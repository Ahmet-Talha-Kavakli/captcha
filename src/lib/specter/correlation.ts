/**
 * Specter — Güvenlik Olayı Korelasyonu (SIEM Korelasyon Motoru)
 * ============================================================
 * Ham bot/güvenlik olaylarını GERÇEK kurallarla ilişkili "olaylara"
 * (incident / attack chain) gruplar. Dekoratif değil: her korelasyon
 * gerçek bir örüntüden (IP patlaması, dağıtık ASN, endpoint tırmanması)
 * türer.
 *
 * SAF FONKSİYON KATMANI — bilinçli olarak `next/headers` veya `server-only`
 * import ETMEZ; böylece tsx test koşucusuyla bağımsız test edilebilir.
 *
 * DETERMİNİZM: Bu dosya ASLA `Date.now()`, `Math.random()` ya da argümansız
 * `new Date()` çağırmaz. Her şey içeri verilen olay zaman damgalarından
 * hesaplanır — aksi halde test koşucusunda kırılır ve sonuçlar oynak olur.
 */

/* ------------------------------------------------------------------ Tipler */

/**
 * Korelasyon motorunun ihtiyaç duyduğu asgari olay şekli. BotEvent'ten
 * yalnızca kullandığımız alanlar (schema.ts BotEvent ile birebir uyumlu,
 * yeni alan EKLENMEZ). Testte sentetik dizi verebilmek için ayrık tutuldu.
 */
export interface KorelasyonOlay {
  id: string;
  ts: number;
  ip: string;
  country: string;
  asn: string;
  ua: string;
  path: string;
  botClass: string;
  /** "allowed" | "challenged" | "blocked" | "flagged" */
  verdict: string;
  /** 0..1 insanlık skoru (düşük = bot). */
  score: number;
}

export type KorelasyonTur =
  | "kimlik_dogrulama_saldirisi" // aynı IP + credential_stuffing patlaması
  | "kazima_kampanyasi" // aynı IP + scraper/ai_agent patlaması
  | "dagitik_bot_agi" // aynı ASN, çok IP, aynı path
  | "hedefli_endpoint_saldirisi" // tek path'te tırmanan otomasyon
  | "ip_patlamasi"; // aynı IP genel yüksek-hacim patlaması

export type KorelasyonSiddet = "kritik" | "yuksek" | "orta" | "dusuk";

export interface Korelasyon {
  /** Olay verisinden türetilmiş deterministik kimlik (Date.now/random YOK). */
  id: string;
  tur: KorelasyonTur;
  baslik: string;
  siddet: KorelasyonSiddet;
  /** En eski olay ts (ms). */
  ilkGorulme: number;
  /** En yeni olay ts (ms). */
  sonGorulme: number;
  olaySayisi: number;
  benzersizIp: number;
  ulkeler: string[];
  asnler: string[];
  pathler: string[];
  dominantBotClass: string;
  /** İlk 5 örnek olay (ts artan). */
  ornekOlaylar: KorelasyonOlay[];
  /** Kill-chain / MITRE-ATT&CK benzeri taktik etiketleri (Türkçe). */
  taktikler: string[];
  /** 0-100 güven skoru (bu gruplamanın gerçek bir saldırı olma olasılığı). */
  guvenSkoru: number;
  /** Engellenen olay oranı (0..1) — mitigasyon göstergesi. */
  engelOrani: number;
}

export interface KorelasyonOzet {
  toplam: number;
  kritik: number;
  /** Son ~15 dk içinde hâlâ olay üreten korelasyon sayısı (aktif saldırı). */
  aktifSaldiri: number;
  etkilenenIp: number;
  enYayginTur: KorelasyonTur | null;
}

/* ------------------------------------------------------------------ Ayarlar */

/** Bir "patlama" için pencere (ms) — bu süre içindeki yoğunluk saldırı sayılır. */
const PENCERE_MS = 10 * 60 * 1000; // 10 dk
/** Aynı IP için patlama eşiği (bu kadar olay bir grup oluşturur). */
const IP_PATLAMA_ESIK = 6;
/** Dağıtık ASN saldırısı: aynı ASN'de en az bu kadar benzersiz IP. */
const ASN_MIN_IP = 4;
/** Dağıtık ASN saldırısı: en az bu kadar olay. */
const ASN_MIN_OLAY = 8;
/** Hedefli endpoint: tek path'te en az bu kadar otomasyon/saldırı olayı. */
const ENDPOINT_MIN_OLAY = 8;
/** "Aktif" sayılmak için son olaydan bu kadar yakın olmalı (en yeni olaya göre). */
const AKTIF_PENCERE_MS = 15 * 60 * 1000;

/** Saldırgan (bot) sayılan sınıflar. */
const KOTU_SINIFLAR = new Set([
  "scraper",
  "credential_stuffing",
  "automation",
  "ai_agent",
  "ddos",
  "spam",
]);

/* ------------------------------------------------------------------ Yardımcılar */

/** Deterministik 32-bit FNV-1a hash → kısa hex (Date.now/random KULLANMAZ). */
function hash(girdi: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < girdi.length; i++) {
    h ^= girdi.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // İşaretsiz 32-bit → 8 haneli hex.
  return (h >>> 0).toString(16).padStart(8, "0");
}

/** Bir sayıyı [min,max] aralığına kelepçeler. */
function kelepce(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** Bir dizideki en sık geçen değeri döndürür (eşitlikte ilk görülen). */
function baskin<T>(dizi: T[]): T | undefined {
  const say = new Map<T, number>();
  let enIyi: T | undefined;
  let enCok = 0;
  for (const x of dizi) {
    const n = (say.get(x) ?? 0) + 1;
    say.set(x, n);
    if (n > enCok) {
      enCok = n;
      enIyi = x;
    }
  }
  return enIyi;
}

/** Benzersiz + sıralı (kararlı çıktı için). */
function tekil(dizi: string[]): string[] {
  return [...new Set(dizi)].sort();
}

/**
 * botClass → kill-chain taktik zinciri (Türkçe, MITRE-ATT&CK benzeri).
 * Gerçek saldırı aşamalarını yansıtır; süsleme değil.
 */
function taktikZinciri(tur: KorelasyonTur, dominant: string): string[] {
  switch (tur) {
    case "kimlik_dogrulama_saldirisi":
      return ["Keşif", "Erişim denemesi", "Kaba kuvvet", "Kimlik bilgisi ele geçirme"];
    case "kazima_kampanyasi":
      return ["Keşif", "Otomatik gezinme", "Veri çıkarma", "Toplu sızdırma"];
    case "dagitik_bot_agi":
      return ["Altyapı hazırlığı", "Dağıtık koordinasyon", "Eşzamanlı erişim", "Kaynak tüketimi"];
    case "hedefli_endpoint_saldirisi":
      return ["Yüzey tarama", "Endpoint hedefleme", "Otomasyon istismarı", "Yük bindirme"];
    case "ip_patlamasi":
    default: {
      const cikar = dominant === "ddos" ? "Kaynak tüketimi" : "Veri çıkarma";
      return ["Keşif", "Hacim artışı", "Otomasyon istismarı", cikar];
    }
  }
}

/** Bir grup olaydan güven skoru (0-100): hacim + engel oranı + IP yayılımı. */
function guvenHesapla(
  olaylar: KorelasyonOlay[],
  benzersizIp: number,
  esik: number,
): number {
  const n = olaylar.length;
  // Hacim bileşeni: eşiğin katına göre 0..45.
  const hacimP = kelepce((n / (esik * 2)) * 45, 0, 45);
  // Engel/challenge oranı: sistem zaten şüpheli bulmuşsa güven artar → 0..30.
  const kotu = olaylar.filter((e) => e.verdict === "blocked" || e.verdict === "challenged" || e.verdict === "flagged").length;
  const engelP = (kotu / Math.max(1, n)) * 30;
  // Ortalama bot skoru (düşük skor = bot): (1 - ortSkor) → 0..15.
  const ortSkor = olaylar.reduce((a, e) => a + e.score, 0) / Math.max(1, n);
  const skorP = (1 - kelepce(ortSkor, 0, 1)) * 15;
  // IP yayılımı: dağıtık saldırılarda çok IP güveni artırır → 0..10.
  const yayilimP = kelepce((benzersizIp / 10) * 10, 0, 10);
  return Math.round(kelepce(hacimP + engelP + skorP + yayilimP, 0, 100));
}

/** Hacim + engel oranı + IP yayılımından şiddet türet. */
function siddetHesapla(olaySayisi: number, engelOrani: number, benzersizIp: number): KorelasyonSiddet {
  // Ağırlıklı bir tehdit puanı.
  const puan =
    olaySayisi * 1.0 +
    engelOrani * 20 +
    benzersizIp * 2.5;
  if (puan >= 50) return "kritik";
  if (puan >= 30) return "yuksek";
  if (puan >= 16) return "orta";
  return "dusuk";
}

/** Bir olay penceresini zaman kovalarına böler (pencere içi gruplama). */
function pencereKovasi(ts: number, taban: number): number {
  return Math.floor((ts - taban) / PENCERE_MS);
}

/* ------------------------------------------------------------------ Ortak inşa */

/** Bir olay kümesinden Korelasyon nesnesi kurar (tekilleştirilmiş metrikler). */
function korelasyonKur(
  tur: KorelasyonTur,
  baslikUret: (dominant: string, ctx: { ip?: string; asn?: string; path?: string }) => string,
  olaylar: KorelasyonOlay[],
  kimlikTohum: string,
  esik: number,
  ctx: { ip?: string; asn?: string; path?: string },
): Korelasyon {
  const sirali = [...olaylar].sort((a, b) => a.ts - b.ts);
  const ipler = tekil(sirali.map((e) => e.ip));
  const dominant = baskin(sirali.map((e) => e.botClass)) ?? "automation";
  const kotu = sirali.filter(
    (e) => e.verdict === "blocked" || e.verdict === "challenged" || e.verdict === "flagged",
  ).length;
  const engelOrani = kotu / Math.max(1, sirali.length);
  const benzersizIp = ipler.length;

  return {
    id: "kor_" + hash(tur + "|" + kimlikTohum),
    tur,
    baslik: baslikUret(dominant, ctx),
    siddet: siddetHesapla(sirali.length, engelOrani, benzersizIp),
    ilkGorulme: sirali[0].ts,
    sonGorulme: sirali[sirali.length - 1].ts,
    olaySayisi: sirali.length,
    benzersizIp,
    ulkeler: tekil(sirali.map((e) => e.country)),
    asnler: tekil(sirali.map((e) => e.asn)),
    pathler: tekil(sirali.map((e) => e.path)),
    dominantBotClass: dominant,
    ornekOlaylar: sirali.slice(0, 5),
    taktikler: taktikZinciri(tur, dominant),
    guvenSkoru: guvenHesapla(sirali, benzersizIp, esik),
    engelOrani,
  };
}

/* ------------------------------------------------------------------ Ana motor */

/**
 * Ham olayları ilişkili olaylara (incident) gruplar.
 *
 * Kurallar:
 *  (a) Aynı IP + patlama (pencere içinde >= IP_PATLAMA_ESIK olay) →
 *      baskın botClass'a göre "kimlik doğrulama saldırısı" / "kazıma
 *      kampanyası" / genel "ip patlaması".
 *  (b) Aynı ASN'de çok IP aynı path'e vuruyorsa → "dağıtık bot ağı".
 *  (c) Tek endpoint'te tırmanan otomasyon/credential_stuffing/scraper →
 *      "hedefli endpoint saldırısı".
 *
 * Bir olay birden çok kurala girebilir; ancak aynı korelasyona iki kez
 * dahil edilmemesi için her kural kendi anahtar uzayında gruplar ve
 * sonuçlar tür+kimlik ile tekilleştirilir. Öncelik: (b) dağıtık ağ en
 * güçlü sinyaldir, sonra (c) endpoint, sonra (a) IP patlaması — bir olay
 * daha güçlü bir korelasyona atandıysa zayıf olana tekrar katılmaz.
 */
export function korelasyonBul(olaylar: KorelasyonOlay[]): Korelasyon[] {
  if (!olaylar.length) return [];

  // Zaman tabanı: en eski olay (kova hesabı bunun üstünden gider — deterministik).
  const taban = olaylar.reduce((m, e) => Math.min(m, e.ts), Infinity);
  const sonuc: Korelasyon[] = [];
  // Bir olay güçlü bir korelasyona atandıysa id'si buraya işaretlenir; zayıf
  // kurallar bu olayları atlar (çift sayımı engeller).
  const tuketilen = new Set<string>();

  /* --- (b) Dağıtık bot ağı: ASN + path + zaman kovası --- */
  const asnGrup = new Map<string, KorelasyonOlay[]>();
  for (const e of olaylar) {
    if (!KOTU_SINIFLAR.has(e.botClass)) continue;
    const kova = pencereKovasi(e.ts, taban);
    const k = `${e.asn}|${e.path}|${kova}`;
    (asnGrup.get(k) ?? asnGrup.set(k, []).get(k)!).push(e);
  }
  for (const [anahtar, grup] of asnGrup) {
    const benzersizIp = new Set(grup.map((e) => e.ip)).size;
    if (grup.length >= ASN_MIN_OLAY && benzersizIp >= ASN_MIN_IP) {
      sonuc.push(
        korelasyonKur(
          "dagitik_bot_agi",
          (dom, c) => `Dağıtık bot ağı — ${c.asn} üzerinden ${c.path} hedefli (${dom})`,
          grup,
          anahtar,
          ASN_MIN_OLAY,
          { asn: grup[0].asn, path: grup[0].path },
        ),
      );
      for (const e of grup) tuketilen.add(e.id);
    }
  }

  /* --- (c) Hedefli endpoint saldırısı: path + zaman kovası --- */
  const pathGrup = new Map<string, KorelasyonOlay[]>();
  for (const e of olaylar) {
    if (tuketilen.has(e.id)) continue;
    if (!KOTU_SINIFLAR.has(e.botClass)) continue;
    const kova = pencereKovasi(e.ts, taban);
    const k = `${e.path}|${kova}`;
    (pathGrup.get(k) ?? pathGrup.set(k, []).get(k)!).push(e);
  }
  for (const [anahtar, grup] of pathGrup) {
    // Tek endpoint'te yoğun otomasyon + birden çok IP → hedefli saldırı.
    const benzersizIp = new Set(grup.map((e) => e.ip)).size;
    if (grup.length >= ENDPOINT_MIN_OLAY && benzersizIp >= 2) {
      sonuc.push(
        korelasyonKur(
          "hedefli_endpoint_saldirisi",
          (dom, c) => `Hedefli endpoint saldırısı — ${c.path} (${dom})`,
          grup,
          anahtar,
          ENDPOINT_MIN_OLAY,
          { path: grup[0].path },
        ),
      );
      for (const e of grup) tuketilen.add(e.id);
    }
  }

  /* --- (a) Aynı IP patlaması: IP + zaman kovası --- */
  const ipGrup = new Map<string, KorelasyonOlay[]>();
  for (const e of olaylar) {
    if (tuketilen.has(e.id)) continue;
    if (!KOTU_SINIFLAR.has(e.botClass)) continue;
    const kova = pencereKovasi(e.ts, taban);
    const k = `${e.ip}|${kova}`;
    (ipGrup.get(k) ?? ipGrup.set(k, []).get(k)!).push(e);
  }
  for (const [anahtar, grup] of ipGrup) {
    if (grup.length < IP_PATLAMA_ESIK) continue;
    const dom = baskin(grup.map((e) => e.botClass)) ?? "automation";
    let tur: KorelasyonTur = "ip_patlamasi";
    if (dom === "credential_stuffing") tur = "kimlik_dogrulama_saldirisi";
    else if (dom === "scraper" || dom === "ai_agent") tur = "kazima_kampanyasi";
    const baslikUret = (d: string, c: { ip?: string }) => {
      if (tur === "kimlik_dogrulama_saldirisi") return `Kimlik doğrulama saldırısı — ${c.ip} (kaba kuvvet)`;
      if (tur === "kazima_kampanyasi") return `Kazıma kampanyası — ${c.ip} (${d})`;
      return `IP patlaması — ${c.ip} (${d})`;
    };
    sonuc.push(
      korelasyonKur(tur, baslikUret, grup, anahtar, IP_PATLAMA_ESIK, { ip: grup[0].ip }),
    );
    for (const e of grup) tuketilen.add(e.id);
  }

  // Şiddet (kritik→düşük) sonra son görülme (yeni→eski) sırala — SIEM önceliği.
  const siddetSira: Record<KorelasyonSiddet, number> = { kritik: 0, yuksek: 1, orta: 2, dusuk: 3 };
  sonuc.sort((a, b) => {
    const s = siddetSira[a.siddet] - siddetSira[b.siddet];
    return s !== 0 ? s : b.sonGorulme - a.sonGorulme;
  });
  return sonuc;
}

/** Korelasyon listesinden üst-düzey özet metrikleri. */
export function korelasyonOzet(kors: Korelasyon[]): KorelasyonOzet {
  if (!kors.length) {
    return { toplam: 0, kritik: 0, aktifSaldiri: 0, etkilenenIp: 0, enYayginTur: null };
  }
  // "Aktif": en yeni korelasyon-olayına göre son AKTIF_PENCERE_MS içinde
  // olay üreten korelasyonlar (deterministik — Date.now yok).
  const enYeniAn = kors.reduce((m, k) => Math.max(m, k.sonGorulme), 0);
  const aktif = kors.filter((k) => enYeniAn - k.sonGorulme <= AKTIF_PENCERE_MS).length;

  // Etkilenen benzersiz IP: korelasyon başına benzersizIp toplanır. (ornekOlaylar
  // yalnız 5 olayla sınırlı olduğundan tam IP kümesi orada değil; benzersizIp
  // her korelasyonun kendi tam sayımıdır. Korelasyonlar ayrık anahtar
  // uzaylarında kurulduğu için üst üste binme pratikte ihmal edilebilir.)
  const etkilenenIp = kors.reduce((a, k) => a + k.benzersizIp, 0);

  const enYayginTur = baskin(kors.map((k) => k.tur)) ?? null;

  return {
    toplam: kors.length,
    kritik: kors.filter((k) => k.siddet === "kritik").length,
    aktifSaldiri: aktif,
    etkilenenIp,
    enYayginTur,
  };
}

/* ------------------------------------------------------------------ Etiketler (UI ortak) */

export const TUR_ETIKET: Record<KorelasyonTur, string> = {
  kimlik_dogrulama_saldirisi: "Kimlik Doğrulama Saldırısı",
  kazima_kampanyasi: "Kazıma Kampanyası",
  dagitik_bot_agi: "Dağıtık Bot Ağı",
  hedefli_endpoint_saldirisi: "Hedefli Endpoint Saldırısı",
  ip_patlamasi: "IP Patlaması",
};

export const SIDDET_ETIKET: Record<KorelasyonSiddet, string> = {
  kritik: "Kritik",
  yuksek: "Yüksek",
  orta: "Orta",
  dusuk: "Düşük",
};
