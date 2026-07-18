/**
 * Specter — Çok-Site Kural Dağıtım & Senkronizasyon (saf çekirdek)
 * ================================================================
 * Ajanslar/MSP'ler için "filo" kural yönetimi. Birden çok korunan sitedeki
 * kuralları TEK bir imza uzayında birleştirir; hangi kuralın hangi sitede
 * var/yok olduğunu (kapsama matrisi), siteler arası SAPMAYI (drift) ve
 * önerilen bir "master" kural setini üretir.
 *
 * TASARIM İLKESİ: Bu dosya %100 SAF ve DETERMİNİSTİKtir — Date.now(),
 * Math.random() YOK. Aynı girdi → aynı çıktı. Böylece test edilebilir,
 * SSR'da güvenli ve UI'da yeniden hesaplanabilir.
 */

import type { Rule, RuleKosulGrup, RuleKosul } from "@/lib/db/schema";

/* ------------------------------------------------------------------ Türler */

/** Kural dağıtımının ihtiyaç duyduğu minimal site şekli (DB Site'ın alt kümesi). */
export interface DagitimSite {
  id: string;
  name: string;
}

/** Bir imza için tek bir sitedeki hücre durumu. */
export interface MatrisHucre {
  /** Bu sitede bu imzaya sahip kural VAR mı. */
  var: boolean;
  /** Varsa kural id'si (drift onarımında kaynak/atlama için). */
  ruleId?: string;
  /** Varsa kural aktif mi (kapalı kurallar "var ama pasif" sayılır). */
  enabled?: boolean;
}

/** Benzersiz bir kural imzasının matris satırı. */
export interface MatrisSatir {
  /** Kanonik imza (kuralImza çıktısı). */
  imza: string;
  /** İnsan-okur kural adı (bu imzayı taşıyan ilk kuraldan). */
  ad: string;
  /** İnsan-okur koşul özeti (örn "score lt 0.2 → block"). */
  kosulOzet: string;
  /** Bu imzanın uygulandığı eylem (allow/challenge/block/flag). */
  action: string;
  /** siteId → hücre. Her site için bir giriş bulunur. */
  hucreler: Record<string, MatrisHucre>;
  /** Bu imzaya sahip site sayısı. */
  varSayisi: number;
  /** Toplam site sayısı (kapsama yüzdesi için payda). */
  toplamSite: number;
  /** Kaç sitede eksik (toplamSite - varSayisi). */
  eksikSayisi: number;
  /** Tüm sitelerde var mı (tam kapsama). */
  tamKapsama: boolean;
}

/** Kapsama matrisinin tamamı + özet. */
export interface KapsamaMatrisi {
  siteler: DagitimSite[];
  satirlar: MatrisSatir[];
  /** Benzersiz imza sayısı. */
  benzersizKural: number;
  /** Tüm sitelerde bulunan (tam kapsanan) imza sayısı. */
  tamKapsananKural: number;
}

/** Bir sitenin drift durumu: başka sitelerde olup bunda olmayan kurallar. */
export interface SiteDrift {
  siteId: string;
  siteAd: string;
  /** Bu sitede olması beklenen ama olmayan kurallar (başka sitelerde var). */
  eksikler: EksikKural[];
  /** Yalnızca bu siteye özgü kurallar (başka hiçbir sitede yok). */
  ozgunler: MatrisSatir[];
  /** Bu sitedeki kural imzası sayısı. */
  mevcutSayisi: number;
}

/** Eksik bir kuralın onarım için gereken tam tanımı. */
export interface EksikKural {
  imza: string;
  ad: string;
  kosulOzet: string;
  /** POST /api/rules gövdesine gidecek alanlar (kaynak bir siteden kopyalanır). */
  tohum: KuralTohum;
  /** Bu kuralın halihazırda bulunduğu site sayısı (yaygınlık). */
  kaynakSayisi: number;
}

/** POST /api/rules'a gönderilecek dağıtılabilir kural tohumu (siteId hariç). */
export interface KuralTohum {
  name: string;
  description: string;
  field: string;
  op: string;
  value: string;
  action: string;
  priority: number;
  kosulGrup?: RuleKosulGrup;
}

/** Master kural seti önerisi. */
export interface MasterSet {
  /** Master'a dahil edilen benzersiz kurallar (yaygınlığa göre sıralı). */
  kurallar: MasterKural[];
  /** Master uygulanırsa toplam kaç kural oluşturulacağı (tüm sitelerde eksikler). */
  toplamOlusturulacak: number;
}

/** Master setteki tek bir kural + hangi sitelerde eksik olduğu. */
export interface MasterKural {
  imza: string;
  ad: string;
  kosulOzet: string;
  action: string;
  tohum: KuralTohum;
  /** Bu kuralın halihazırda bulunduğu site sayısı. */
  varSayisi: number;
  /** Bu kuralın eksik olduğu site id'leri (dağıtım hedefleri). */
  eksikSiteler: string[];
}

/* ------------------------------------------------------------------ İmza */

/**
 * Bir koşul grubunu (VE/VEYA ağacı) kanonik, sıradan-bağımsız bir dizeye
 * indirger. Aynı koşulların farklı sıralaması aynı imzayı üretsin diye
 * atomik koşullar ve alt gruplar sıralanır.
 */
function kosulGrupImza(g: RuleKosulGrup): string {
  const kosulPar = (k: RuleKosul) => `${k.negate ? "!" : ""}${k.field}:${k.op}:${k.value}`;
  const atomlar = (g.kosullar ?? []).map(kosulPar).sort();
  const altlar = (g.gruplar ?? []).map(kosulGrupImza).sort();
  return `(${g.birlestir}|${atomlar.join(",")}|${altlar.join(";")})`;
}

/**
 * Bir kuralın KANONİK İMZASI. İki farklı sitedeki "aynı" kural (aynı koşul +
 * aynı eylem) aynı imzayı üretir — böylece siteler arası eşleştirme yapılır.
 *
 * NOT: Kural ADI imzaya DAHİL DEĞİLDİR; kasıtlı. Ajanslar aynı politikayı
 * farklı adlarla kopyalayabilir — mantığın aynı olması yeterlidir. Ad yalnızca
 * gösterim içindir. İmza koşul mantığı + eylemden türetilir; kosulGrup varsa
 * o, yoksa tekil field/op/value kullanılır (şemadaki geriye-uyumlu davranış).
 */
export function kuralImza(rule: Pick<Rule, "field" | "op" | "value" | "action" | "kosulGrup">): string {
  const govde = rule.kosulGrup
    ? `grup=${kosulGrupImza(rule.kosulGrup)}`
    : `tekil=${rule.field}:${rule.op}:${rule.value}`;
  return `${govde}=>${rule.action}`;
}

/** Bir kuralın insan-okur koşul özeti (matris/drift gösterimi için). */
export function kosulOzeti(rule: Pick<Rule, "field" | "op" | "value" | "action" | "kosulGrup">): string {
  if (rule.kosulGrup) {
    const say = kosulSay(rule.kosulGrup);
    const bag = rule.kosulGrup.birlestir === "and" ? "VE" : "VEYA";
    return `${say} koşul (${bag}) → ${rule.action}`;
  }
  return `${rule.field} ${rule.op} ${rule.value} → ${rule.action}`;
}

/** Bir koşul ağacındaki toplam atomik koşul sayısı (özet için). */
function kosulSay(g: RuleKosulGrup): number {
  let n = (g.kosullar ?? []).length;
  for (const alt of g.gruplar ?? []) n += kosulSay(alt);
  return n;
}

/** Bir kuraldan dağıtılabilir tohum üretir (siteId ve id atılır). */
export function kuralTohumu(rule: Rule): KuralTohum {
  return {
    name: rule.name,
    description: rule.description ?? "",
    field: rule.field,
    op: rule.op,
    value: rule.value,
    action: rule.action,
    priority: rule.priority,
    ...(rule.kosulGrup ? { kosulGrup: rule.kosulGrup } : {}),
  };
}

/* ------------------------------------------------------------------ Kapsama matrisi */

/**
 * Kapsama matrisi: satır = benzersiz kural imzası, sütun = site, hücre =
 * var/yok. `kuralHaritasi` siteId → o siteye ait kurallar. Deterministik:
 * satırlar (varSayisi çok → az, sonra ad) ve sütunlar girdi sırasına göre.
 */
export function kapsamaMatrisi(
  siteler: DagitimSite[],
  kuralHaritasi: Record<string, Rule[]>,
): KapsamaMatrisi {
  const toplamSite = siteler.length;
  // imza → çekirdek satır verisi (ilk görülen kuraldan ad/özet alınır).
  const satirMap = new Map<string, MatrisSatir>();

  for (const site of siteler) {
    const kurallar = kuralHaritasi[site.id] ?? [];
    // Aynı sitede aynı imzadan birden çok kural olabilir; ilk (en yüksek
    // öncelik = en düşük priority) temsilci sayılır. Kurallar sırasını
    // koru (forSite zaten priority artan sıralı verir).
    const gorulen = new Set<string>();
    for (const r of kurallar) {
      const imza = kuralImza(r);
      let satir = satirMap.get(imza);
      if (!satir) {
        satir = {
          imza,
          ad: r.name,
          kosulOzet: kosulOzeti(r),
          action: r.action,
          hucreler: {},
          varSayisi: 0,
          toplamSite,
          eksikSayisi: toplamSite,
          tamKapsama: false,
        };
        // Tüm siteleri "yok" olarak başlat (matris tam dolsun).
        for (const s of siteler) satir.hucreler[s.id] = { var: false };
        satirMap.set(imza, satir);
      }
      // Aynı sitede aynı imza ikinci kez görülürse ilk temsilciyi koru.
      if (!gorulen.has(imza)) {
        gorulen.add(imza);
        satir.hucreler[site.id] = { var: true, ruleId: r.id, enabled: r.enabled };
        satir.varSayisi += 1;
        satir.eksikSayisi -= 1;
      }
    }
  }

  const satirlar = [...satirMap.values()];
  for (const s of satirlar) s.tamKapsama = s.varSayisi === toplamSite && toplamSite > 0;

  // Deterministik sıralama: önce en yaygın olmayanlar (drift'i öne çıkar),
  // eşitlikte ad alfabetik, sonra imza (kesin tie-break).
  satirlar.sort((a, b) => {
    if (a.varSayisi !== b.varSayisi) return a.varSayisi - b.varSayisi;
    if (a.ad !== b.ad) return a.ad.localeCompare(b.ad, "tr");
    return a.imza.localeCompare(b.imza);
  });

  return {
    siteler,
    satirlar,
    benzersizKural: satirlar.length,
    tamKapsananKural: satirlar.filter((s) => s.tamKapsama).length,
  };
}

/* ------------------------------------------------------------------ Drift */

/**
 * Siteler arası sapma (drift) tespiti. Her site için:
 *  - eksikler: EN AZ İKİ (başka) sitede bulunup bu sitede olmayan kurallar
 *    (bu site "aykırı" — çoğunluk politikayı taşıyor, o taşımıyor). Tek bir
 *    sitede olan bir kural "eksik" DEĞİLDİR; o, sahibinin ÖZGÜN kuralıdır
 *    (yoksa her özgün kural diğer tüm siteler için gürültülü drift üretirdi).
 *  - ozgunler: yalnızca bu siteye özgü kurallar (başka hiçbir sitede yok).
 *
 * `kurallar` owner'ın TÜM kuralları; siteId ile matris üzerinden ilişkilendirilir.
 * Deterministik.
 */
export function driftBul(
  siteler: DagitimSite[],
  kurallar: Rule[],
): { siteler: SiteDrift[]; toplamEksik: number; driftliSite: number } {
  const kuralHaritasi = kurallariGrupla(siteler, kurallar);
  const matris = kapsamaMatrisi(siteler, kuralHaritasi);

  // İmza → temsilci kural (tohum üretimi için). En düşük siteId sırasıyla
  // kararlı bir temsilci seç (deterministik).
  const temsilci = new Map<string, Rule>();
  const sirali = [...kurallar].sort((a, b) =>
    a.siteId === b.siteId ? a.id.localeCompare(b.id) : a.siteId.localeCompare(b.siteId),
  );
  for (const r of sirali) {
    const imza = kuralImza(r);
    if (!temsilci.has(imza)) temsilci.set(imza, r);
  }

  const sonuc: SiteDrift[] = [];
  let toplamEksik = 0;

  for (const site of siteler) {
    const eksikler: EksikKural[] = [];
    const ozgunler: MatrisSatir[] = [];
    let mevcutSayisi = 0;

    for (const satir of matris.satirlar) {
      const bende = satir.hucreler[site.id]?.var ?? false;
      if (bende) {
        mevcutSayisi += 1;
        // Yalnızca bu sitede varsa → özgün.
        if (satir.varSayisi === 1) ozgunler.push(satir);
        continue;
      }
      // Bende yok. Başka EN AZ İKİ sitede varsa → eksik (drift). Tek sitede
      // olanı eksik saymayız (o, sahibinin özgün kuralı — gürültü olmasın).
      if (satir.varSayisi >= 2) {
        const kaynak = temsilci.get(satir.imza);
        if (kaynak) {
          eksikler.push({
            imza: satir.imza,
            ad: satir.ad,
            kosulOzet: satir.kosulOzet,
            tohum: kuralTohumu(kaynak),
            kaynakSayisi: satir.varSayisi,
          });
        }
      }
    }

    // Eksikleri yaygınlığa göre sırala (çok sitede olan = daha kritik eksik).
    eksikler.sort((a, b) => b.kaynakSayisi - a.kaynakSayisi || a.ad.localeCompare(b.ad, "tr"));
    toplamEksik += eksikler.length;
    sonuc.push({
      siteId: site.id,
      siteAd: site.name,
      eksikler,
      ozgunler,
      mevcutSayisi,
    });
  }

  return {
    siteler: sonuc,
    toplamEksik,
    driftliSite: sonuc.filter((s) => s.eksikler.length > 0).length,
  };
}

/* ------------------------------------------------------------------ Master set */

/**
 * Önerilen master kural seti: tüm sitelerdeki kuralların BİRLEŞİMİ. Her
 * benzersiz kural, yaygınlığına (kaç sitede var) göre sıralanır; en yaygın
 * kurallar master'ın çekirdeğidir. Master uygulanırsa her sitedeki eksikler
 * oluşturulur.
 *
 * `esik` (opsiyonel): master'a dahil olmak için bir kuralın bulunması gereken
 * asgari site sayısı. Varsayılan 1 (birleşim — hiçbir kural atılmaz). Örneğin
 * 2 verilirse yalnızca ≥2 sitede olan "ortak" kurallar master olur; tekil
 * özgün kurallar dışarıda kalır. Deterministik.
 */
export function masterKuralSeti(
  siteler: DagitimSite[],
  kurallar: Rule[],
  esik = 1,
): MasterSet {
  const kuralHaritasi = kurallariGrupla(siteler, kurallar);
  const matris = kapsamaMatrisi(siteler, kuralHaritasi);

  const temsilci = new Map<string, Rule>();
  const sirali = [...kurallar].sort((a, b) =>
    a.siteId === b.siteId ? a.id.localeCompare(b.id) : a.siteId.localeCompare(b.siteId),
  );
  for (const r of sirali) {
    const imza = kuralImza(r);
    if (!temsilci.has(imza)) temsilci.set(imza, r);
  }

  const kurallarM: MasterKural[] = [];
  let toplamOlusturulacak = 0;

  for (const satir of matris.satirlar) {
    if (satir.varSayisi < esik) continue;
    const kaynak = temsilci.get(satir.imza);
    if (!kaynak) continue;
    const eksikSiteler = siteler.filter((s) => !(satir.hucreler[s.id]?.var ?? false)).map((s) => s.id);
    toplamOlusturulacak += eksikSiteler.length;
    kurallarM.push({
      imza: satir.imza,
      ad: satir.ad,
      kosulOzet: satir.kosulOzet,
      action: satir.action,
      tohum: kuralTohumu(kaynak),
      varSayisi: satir.varSayisi,
      eksikSiteler,
    });
  }

  // Master listesi: en yaygın kurallar üstte (çekirdek politika), sonra ad.
  kurallarM.sort((a, b) => b.varSayisi - a.varSayisi || a.ad.localeCompare(b.ad, "tr"));

  return { kurallar: kurallarM, toplamOlusturulacak };
}

/* ------------------------------------------------------------------ Yardımcı */

/** Owner'ın tüm kurallarını siteId → kural listesi haritasına böler. */
export function kurallariGrupla(siteler: DagitimSite[], kurallar: Rule[]): Record<string, Rule[]> {
  const harita: Record<string, Rule[]> = {};
  for (const s of siteler) harita[s.id] = [];
  for (const r of kurallar) {
    if (harita[r.siteId]) harita[r.siteId].push(r);
  }
  return harita;
}
