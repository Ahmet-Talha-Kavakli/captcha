/**
 * Specter — Kural Çakışma & Gölgeleme Analizi (Statik Analiz Motoru)
 * ==================================================================
 * Bir sitenin kural kümesini GERÇEK bir statik analizden geçirir: hangi
 * kural başka bir kuralı gölgeliyor (asla ateşlenemez), hangileri çelişkili
 * aksiyon veriyor, hangileri gereksiz tekrar. Bu bir "kural linter'ı"dır.
 *
 * DETERMİNİSTİK: Date.now / Math.random / new Date() KULLANILMAZ. Aynı
 * girdi her zaman aynı bulguları üretir → tsx ile birim-test edilebilir.
 *
 * KAPSAM:
 *   - DÜZ (flat) kurallar (field/op/value): eq/neq/contains/gt/lt/in için
 *     somut alt-küme (subsumption) analizi yapılır.
 *   - GELİŞMİŞ kurallar (kosulGrup): derin karşılaştırma yapılmaz; yalnızca
 *     birebir aynı şekle (kosulGrup + action) sahip iki kural "yineleme"
 *     olarak yakalanır. Bunun dışında "gelişmiş (analiz sınırlı)" sayılır.
 *
 * Motor semantiği (rule-engine.ts ile birebir): kurallar ARTAN önceliğe göre
 * değerlendirilir; ilk TERMİNAL (flag olmayan) eşleşme kararı belirler.
 * "flag" akışı durdurmaz, biriktirir.
 */
import type { Rule, RuleField, RuleOp, RuleAction } from "@/lib/db/schema";

/* ------------------------------------------------------------------ Tipler */

export type BulguTur = "golgeleme" | "cakisma" | "yineleme";
export type BulguSiddet = "yuksek" | "orta" | "dusuk";

/** Bir bulguya karışan kuralın kısa kimliği (UI için). */
export interface BulguKural {
  id: string;
  name: string;
  priority: number;
}

/** Statik analiz motorunun ürettiği tekil bulgu. */
export interface KuralBulgu {
  tur: BulguTur;
  siddet: BulguSiddet;
  baslik: string;
  aciklama: string;
  /** Bulguya karışan kurallar (öncelik sırasıyla; ilki genelde "kazanan"). */
  kurallar: BulguKural[];
  /** Somut, uygulanabilir düzeltme önerisi. */
  oneri: string;
}

export interface AnalizOzet {
  toplam: number;
  golgeleme: number;
  cakisma: number;
  yineleme: number;
  /** Hiç yüksek/orta bulgu yoksa true (kural kümesi sağlıklı). */
  saglikli: boolean;
}

/* ------------------------------------------------------------------ Yardımcılar */

/** Terminal aksiyon mu (karar veren)? "flag" akışı durdurmaz. */
function terminalMi(a: RuleAction): boolean {
  return a !== "flag";
}

/** Bir kural gelişmiş koşul ağacı mı kullanıyor (flat değil)? */
function gelismisMi(r: Rule): boolean {
  return r.kosulGrup != null;
}

/** İki flat kural aynı alanı mı hedefliyor? */
function ayniAlan(a: Rule, b: Rule): boolean {
  return a.field === b.field;
}

/** Değeri küçük-harfe indir + trim (motorla tutarlı karşılaştırma). */
function norm(v: string): string {
  return v.trim().toLowerCase();
}

/** "in" listesini normalize edilmiş küme olarak ayrıştır. */
function inKume(value: string): Set<string> {
  return new Set(value.split(",").map((s) => norm(s)).filter((s) => s.length > 0));
}

/** Sayısal ayrıştırma (gt/lt için). NaN → null. */
function sayi(v: string): number | null {
  const n = parseFloat(v);
  return Number.isNaN(n) ? null : n;
}

/**
 * A kuralının eşleşme kümesi B'nin eşleşme kümesini KAPSIYOR mu?
 * Yani: A eşleşiyorsa B de eşleşir gibi düşün — A, B'yi mantıksal olarak
 * içeriyorsa (A ⊇ B) true. Bu "gölgeleme" için gereklidir: daha yüksek
 * öncelikli A, B'nin tüm trafiğini yakalıyorsa B asla ateşlenemez.
 *
 * Yalnızca AYNI alan üzerinde ve desteklenen op çiftleri için kesin karar
 * verir; emin olamadığı her durumda GÜVENLİ tarafta kalıp false döner
 * (yanlış-pozitif üretmez).
 */
function kapsar(a: Rule, b: Rule): boolean {
  if (!ayniAlan(a, b)) return false;
  const av = norm(a.value);
  const bv = norm(b.value);

  switch (a.op) {
    case "eq":
      // A yalnızca tek bir değeri yakalar. B'yi kapsaması için B de tam
      // olarak aynı tekil değeri yakalamalı.
      if (b.op === "eq") return av === bv;
      if (b.op === "in") {
        const bs = inKume(b.value);
        return bs.size === 1 && bs.has(av);
      }
      return false;

    case "in": {
      // A bir değer kümesi yakalar. B'nin yakaladığı her değer A'nın
      // kümesinde ise A ⊇ B.
      const as = inKume(a.value);
      if (b.op === "eq") return as.has(bv);
      if (b.op === "in") {
        const bs = inKume(b.value);
        return [...bs].every((x) => as.has(x));
      }
      return false;
    }

    case "contains": {
      // A "içerir X". B'nin yakaladığı her dize mutlaka X içeriyorsa A ⊇ B.
      // eq(Y): Y, X'i içeriyorsa. contains(Y): Y, X'i içeriyorsa (Y içeren
      // her dize zaten X'i de içerir). in(...): tüm öğeler X içeriyorsa.
      if (b.op === "eq" || b.op === "contains") return bv.includes(av);
      if (b.op === "in") return [...inKume(b.value)].every((x) => x.includes(av));
      return false;
    }

    case "neq": {
      // A "eşit değil X". A ⊇ B ancak B, X değerini asla üretmiyorsa.
      // neq(X) ⊇ neq(X): aynı → kapsar. neq(X) ⊇ eq(Y) (Y≠X): B yalnızca
      // Y'yi yakalar, Y≠X olduğundan A hep true → kapsar.
      if (b.op === "neq") return av === bv;
      if (b.op === "eq") return av !== bv;
      return false;
    }

    case "gt": {
      // A: değer > n. B'nin yakaladığı tüm sayılar > n ise A ⊇ B.
      const an = sayi(a.value);
      if (an == null) return false;
      if (b.op === "gt") {
        const bn = sayi(b.value);
        return bn != null && bn >= an; // >bn ⊆ >an  ⇔  bn ≥ an
      }
      if (b.op === "eq") {
        const bn = sayi(b.value);
        return bn != null && bn > an;
      }
      return false;
    }

    case "lt": {
      // A: değer < n. B'nin yakaladığı tüm sayılar < n ise A ⊇ B.
      const an = sayi(a.value);
      if (an == null) return false;
      if (b.op === "lt") {
        const bn = sayi(b.value);
        return bn != null && bn <= an; // <bn ⊆ <an  ⇔  bn ≤ an
      }
      if (b.op === "eq") {
        const bn = sayi(b.value);
        return bn != null && bn < an;
      }
      return false;
    }
  }
}

/**
 * İki flat kuralın eşleşme kümeleri KESİŞİYOR mu (ortak trafik var mı)?
 * Çakışma tespiti için gerekir. Kapsama kesişmeyi ima eder; ek olarak
 * bazı örtüşen ama kapsamayan durumları da yakalarız (aynı değer, iç içe
 * geçen sayısal aralıklar, kesişen "in" kümeleri).
 */
function kesisir(a: Rule, b: Rule): boolean {
  if (!ayniAlan(a, b)) return false;
  if (kapsar(a, b) || kapsar(b, a)) return true;

  const av = norm(a.value);
  const bv = norm(b.value);

  // Aynı op + aynı değer → kesin kesişir.
  if (a.op === b.op && av === bv) return true;

  // eq X ∩ eq Y: yalnızca X==Y (yukarıda yakalandı).
  // eq X ∩ in {..}: X kümede mi.
  if (a.op === "eq" && b.op === "in") return inKume(b.value).has(av);
  if (b.op === "eq" && a.op === "in") return inKume(a.value).has(bv);
  // eq X ∩ contains Y: X, Y içeriyor mu (kapsar() ile örtüşür ama simetri için).
  if (a.op === "eq" && b.op === "contains") return av.includes(bv);
  if (b.op === "eq" && a.op === "contains") return bv.includes(av);

  // in ∩ in: kümeler kesişiyor mu.
  if (a.op === "in" && b.op === "in") {
    const as = inKume(a.value);
    return [...inKume(b.value)].some((x) => as.has(x));
  }

  // gt ∩ gt / lt ∩ lt: aynı yönde daima kesişir (sonsuz kuyruk ortak).
  if (a.op === "gt" && b.op === "gt") return true;
  if (a.op === "lt" && b.op === "lt") return true;

  // gt n ∩ lt m: n < m ise (n,m) aralığı ortak → kesişir.
  if (a.op === "gt" && b.op === "lt") {
    const an = sayi(a.value), bn = sayi(b.value);
    return an != null && bn != null && an < bn;
  }
  if (a.op === "lt" && b.op === "gt") {
    const an = sayi(a.value), bn = sayi(b.value);
    return an != null && bn != null && bn < an;
  }

  return false;
}

/** İki flat kural BİREBİR aynı koşula mı sahip (field/op/value)? */
function ayniKosul(a: Rule, b: Rule): boolean {
  return a.field === b.field && a.op === b.op && norm(a.value) === norm(b.value);
}

/** Gelişmiş kuralın kosulGrup'unun deterministik "şekil" imzası (yineleme için). */
function grupImza(r: Rule): string {
  // JSON.stringify anahtar sırasını koruduğundan aynı yapılı gruplar aynı
  // imzayı üretir. Deterministik (rastgelelik yok).
  return JSON.stringify(r.kosulGrup ?? null);
}

/** Kısa kural özeti (UI kurallar listesi için). */
function kuralOzet(r: Rule): BulguKural {
  return { id: r.id, name: r.name, priority: r.priority };
}

/* ------------------------------------------------------------------ Etiketler (aciklama için) */

const ALAN_ETIKET: Record<RuleField, string> = {
  ip: "IP", country: "Ülke", asn: "ASN", ua: "User-Agent", path: "Yol", score: "Skor",
  botClass: "Bot sınıfı", rate: "Hız", aiAgent: "AI ajanı", aiCategory: "AI kategorisi",
  headless: "Headless", tlsMismatch: "TLS/UA uyumsuz", httpVersion: "HTTP sürümü",
};
const OP_ETIKET: Record<RuleOp, string> = {
  eq: "eşittir", neq: "eşit değil", contains: "içerir", gt: ">", lt: "<", in: "içinde",
};
const AKSIYON_ETIKET: Record<RuleAction, string> = {
  allow: "İzin ver", challenge: "Doğrula", block: "Engelle", flag: "İşaretle",
};

/** Bir flat kuralı insan-okur koşula çevirir (örn "Ülke eşittir RU"). */
function kosulMetin(r: Rule): string {
  if (gelismisMi(r)) return "gelişmiş koşul grubu";
  return `${ALAN_ETIKET[r.field]} ${OP_ETIKET[r.op]} "${r.value}"`;
}

/* ------------------------------------------------------------------ Ana analiz */

/**
 * Bir kural kümesini statik analizden geçirir ve tüm bulguları döndürür.
 * Kurallar dışarıdan sıralı gelmese de içeride ARTAN önceliğe göre işlenir.
 */
export function kuralAnaliz(rules: Rule[]): KuralBulgu[] {
  const bulgular: KuralBulgu[] = [];

  // Deterministik sıra: önce öncelik, eşitlikte id (kararlı).
  const sirali = [...rules].sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id));

  // Yalnızca etkin kurallar karar sürecine girer. Devre dışı kurallar
  // gölgeleme/çakışma üretmez (ama flat yineleme kontrolünde de etkin şart).
  const etkin = sirali.filter((r) => r.enabled);

  // Yinelemede aynı çifti iki kez raporlamamak için işaretle.
  const yinelemeGorulen = new Set<string>();

  for (let i = 0; i < etkin.length; i++) {
    const ust = etkin[i]; // daha yüksek öncelikli (önce değerlendirilen)
    for (let j = i + 1; j < etkin.length; j++) {
      const alt = etkin[j]; // daha düşük öncelikli (sonra değerlendirilen)

      /* ---- YİNELEME (birebir aynı koşul + aynı aksiyon) ---- */
      // Hem flat hem gelişmiş için: aynı şekil + aynı aksiyon → alttaki ölü.
      const flatAyni = !gelismisMi(ust) && !gelismisMi(alt) && ayniKosul(ust, alt);
      const grupAyni = gelismisMi(ust) && gelismisMi(alt) && grupImza(ust) === grupImza(alt);
      if ((flatAyni || grupAyni) && ust.action === alt.action) {
        const anahtar = `${ust.id}|${alt.id}`;
        if (!yinelemeGorulen.has(anahtar)) {
          yinelemeGorulen.add(anahtar);
          bulgular.push({
            tur: "yineleme",
            siddet: "dusuk",
            baslik: "Yinelenen kural (gereksiz)",
            aciklama:
              `"${ust.name}" (öncelik ${ust.priority}) ve "${alt.name}" (öncelik ${alt.priority}) ` +
              `aynı koşulu (${kosulMetin(ust)}) aynı aksiyonla (${AKSIYON_ETIKET[ust.action]}) uyguluyor. ` +
              `Üstteki kural her zaman önce eşleştiğinden alttaki kural ölü ağırlıktır ve hiçbir etki yaratmaz.`,
            kurallar: [kuralOzet(ust), kuralOzet(alt)],
            oneri:
              `"${alt.name}" (öncelik ${alt.priority}) kuralını silin — üstteki kuralla birebir aynı işi yapıyor.`,
          });
        }
        // Yineleme bulundu; aynı çift için ayrıca gölgeleme/çakışma üretmeye gerek yok.
        continue;
      }

      /* ---- Gelişmiş kurallarda derin karşılaştırma yapılmaz ---- */
      if (gelismisMi(ust) || gelismisMi(alt)) continue;

      // Buradan itibaren iki taraf da FLAT.
      const ustTerminal = terminalMi(ust.action);

      /* ---- GÖLGELEME ---- */
      // Üst kural terminal ve alt kuralın TÜM eşleşmelerini kapsıyorsa
      // (ust ⊇ alt), alt kural asla ateşlenemez.
      if (ustTerminal && kapsar(ust, alt)) {
        const tamAyni = ayniKosul(ust, alt);
        bulgular.push({
          tur: "golgeleme",
          siddet: "yuksek",
          baslik: "Gölgelenen kural (asla çalışamaz)",
          aciklama:
            `"${ust.name}" (öncelik ${ust.priority}, ${AKSIYON_ETIKET[ust.action]}) kuralı, ` +
            `"${alt.name}" (öncelik ${alt.priority}, ${AKSIYON_ETIKET[alt.action]}) kuralının eşleştiği tüm trafiği ` +
            `daha önce yakalıyor. ` +
            (tamAyni
              ? `İki kural aynı koşulu (${kosulMetin(ust)}) kullanıyor; üstteki terminal aksiyonu akışı bitirdiğinden `
              : `Üstteki kuralın koşulu (${kosulMetin(ust)}) alttakini (${kosulMetin(alt)}) tümüyle kapsadığından `) +
            `alttaki kural asla değerlendirilmez.`,
          kurallar: [kuralOzet(ust), kuralOzet(alt)],
          oneri:
            ust.action === alt.action
              ? `"${alt.name}" kuralını silin — üstteki kural aynı aksiyonla zaten örtüyor.`
              : `Alttaki "${alt.name}" (${AKSIYON_ETIKET[alt.action]}) kuralının çalışması gerekiyorsa önceliğini ` +
                `${ust.priority} değerinin üstüne (ör. ${ust.priority - 1}) alın; gerekmiyorsa silin.`,
        });
        // Gölgeleme zaten "alt asla çalışmaz" demek; çakışma raporu eklemeye gerek yok.
        continue;
      }

      /* ---- ÇAKIŞMA ---- */
      // İki kural örtüşen trafiği yakalıyor ama çelişkili terminal aksiyon
      // veriyor (izin ver ↔ engelle gibi). Öncelikle üstteki kazanır.
      if (
        ustTerminal &&
        terminalMi(alt.action) &&
        ust.action !== alt.action &&
        celiskiliMi(ust.action, alt.action) &&
        kesisir(ust, alt)
      ) {
        bulgular.push({
          tur: "cakisma",
          siddet: "orta",
          baslik: "Çelişen kurallar (aynı trafik, zıt aksiyon)",
          aciklama:
            `"${ust.name}" (öncelik ${ust.priority}) trafiğe "${AKSIYON_ETIKET[ust.action]}" derken, ` +
            `"${alt.name}" (öncelik ${alt.priority}) örtüşen trafiğe "${AKSIYON_ETIKET[alt.action]}" diyor. ` +
            `Koşullar (${kosulMetin(ust)} / ${kosulMetin(alt)}) ortak trafik üretiyor. ` +
            `Öncelik daha düşük olduğu için "${ust.name}" kazanır; kesişen trafikte "${alt.name}" hiç uygulanmaz.`,
          kurallar: [kuralOzet(ust), kuralOzet(alt)],
          oneri:
            `Hangi aksiyonun kazanması gerektiğine karar verin. "${alt.name}" (${AKSIYON_ETIKET[alt.action]}) ` +
            `öncelikliyse önceliğini ${ust.priority} değerinin üstüne alın; değilse koşulları ayrıştırın ki ` +
            `aynı trafiği yakalamasınlar.`,
        });
      }
    }
  }

  return bulgular;
}

/**
 * İki terminal aksiyon anlamlı biçimde çelişiyor mu? "İzin ver" ile
 * "Engelle"/"Doğrula" zıttır; "Engelle" ile "Doğrula" ise ikisi de kısıtlayıcı
 * olduğundan sert çelişki değildir (yine de farklıdır ama çakışma olarak
 * işaretlemeyiz — gürültü olmasın). En keskin çelişki: allow ↔ block/challenge.
 */
function celiskiliMi(a: RuleAction, b: RuleAction): boolean {
  const set = new Set([a, b]);
  if (set.has("allow") && (set.has("block") || set.has("challenge"))) return true;
  return false;
}

/** Bulgu listesinden özet çıkarır. saglikli = yüksek/orta bulgu yok. */
export function analizOzet(bulgular: KuralBulgu[]): AnalizOzet {
  const golgeleme = bulgular.filter((b) => b.tur === "golgeleme").length;
  const cakisma = bulgular.filter((b) => b.tur === "cakisma").length;
  const yineleme = bulgular.filter((b) => b.tur === "yineleme").length;
  const ciddiVar = bulgular.some((b) => b.siddet === "yuksek" || b.siddet === "orta");
  return {
    toplam: bulgular.length,
    golgeleme,
    cakisma,
    yineleme,
    saglikli: !ciddiVar,
  };
}

/**
 * "flag" aksiyonlu kurallar hiçbir zaman KARAR vermez (akışı durdurmaz);
 * yalnızca işaretler. Bu bilgilendirici bir uyarıdır — panel isterse gösterir.
 * Deterministik; salt-okunur bir tarama.
 */
export function sadeceIsaretleyenler(rules: Rule[]): BulguKural[] {
  return rules
    .filter((r) => r.enabled && r.action === "flag")
    .sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id))
    .map(kuralOzet);
}
