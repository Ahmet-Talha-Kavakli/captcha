/**
 * Specter — Saldırgan Geri-Besleme Döngüsü & Adaptif Eşik Öğrenme
 * ==============================================================
 * Statik eşikler eskir: saldırganlar adapte olur, trafik kayar. Bu motor bir
 * KAPALI-DÖNGÜ öğrenme sistemidir — savunma kararlarının SONUÇLARINI gözlemleyip
 * karar eşiğini otomatik ayarlar (online/pekiştirmeli ayarlama):
 *
 *   1) GÖZLEM   — mevcut eşikte kaç bot kaçtı (yanlış-negatif), kaç insan
 *      engellendi (yanlış-pozitif). Skor dağılımından hesaplanır.
 *   2) HATA      — dengesizlik: bot kaçıyorsa eşik çok gevşek (yukarı it), insan
 *      engelleniyorsa çok sıkı (aşağı çek). Maliyet-ağırlıklı gradyan.
 *   3) GÜNCELLE   — eşiği öğrenme-oranıyla küçük adım kaydır (gradyan inişi),
 *      salınımı önlemek için momentum + adım-sınırı ile.
 *   4) YAKINSAMA  — hata küçüldükçe adımlar küçülür; F1/dengeli-doğruluk artar.
 *
 * Çok turlu simülasyon, eşiğin nasıl yakınsadığını gösterir. Saf/deterministik:
 * Date.now/Math.random YOK — girdi olaylardan + tohumlu.
 */
import type { BotEvent } from "@/lib/db/schema";

const KOTU = new Set(["scraper", "credential_stuffing", "automation", "ai_agent", "ddos", "spam"]);

/** Bir skor dağılımı örneği: gerçek etiket + insanlık skoru. */
export interface SkorOrnek {
  skor: number;   // 0..1 insanlık skoru
  bot: boolean;   // gerçek etiket
}

export interface KararMetrik {
  esik: number;
  /** esik altı = bot say → engelle. */
  dogruPozitif: number;   // bot, engellendi
  yanlisPozitif: number;  // insan, engellendi (sürtünme)
  dogruNegatif: number;   // insan, geçti
  yanlisNegatif: number;  // bot, geçti (kaçtı)
  kesinlik: number;       // precision
  duyarlilik: number;     // recall
  f1: number;
  /** Maliyet-ağırlıklı hata (yanlış-pozitif ve yanlış-negatif maliyeti). */
  maliyet: number;
}

/** Bir eşikte karar metriklerini hesaplar (esik altı skor → bot kararı). */
export function metrikHesap(ornekler: SkorOrnek[], esik: number, fpMaliyet = 1, fnMaliyet = 1): KararMetrik {
  let tp = 0, fp = 0, tn = 0, fn = 0;
  for (const o of ornekler) {
    const botKarari = o.skor < esik; // eşik altı → bot say
    if (o.bot && botKarari) tp++;
    else if (!o.bot && botKarari) fp++;
    else if (!o.bot && !botKarari) tn++;
    else fn++;
  }
  const kesinlik = tp + fp > 0 ? tp / (tp + fp) : 1;
  const duyarlilik = tp + fn > 0 ? tp / (tp + fn) : 1;
  const f1 = kesinlik + duyarlilik > 0 ? (2 * kesinlik * duyarlilik) / (kesinlik + duyarlilik) : 0;
  const n = ornekler.length || 1;
  const maliyet = (fp * fpMaliyet + fn * fnMaliyet) / n;
  return { esik, dogruPozitif: tp, yanlisPozitif: fp, dogruNegatif: tn, yanlisNegatif: fn, kesinlik, duyarlilik, f1, maliyet };
}

export interface OgrenmeTur {
  tur: number;
  esikOnce: number;
  esikSonra: number;
  gradyan: number;
  metrik: KararMetrik;
}

export interface AdaptifSonuc {
  baslangicEsik: number;
  optimalEsik: number;
  turlar: OgrenmeTur[];
  baslangicMetrik: KararMetrik;
  optimalMetrik: KararMetrik;
  yakinsadi: boolean;
  /** İyileşme: maliyet düşüşü %. */
  iyilesme: number;
  /** Maliyet-eğrisi: her aday eşikte maliyet (görselleştirme). */
  maliyetEgrisi: { esik: number; maliyet: number; f1: number }[];
}

/**
 * Gradyan-inişi tabanlı adaptif eşik öğrenme. Sonlu-fark ile maliyet gradyanını
 * tahmin eder, momentum + adım-sınırıyla eşiği günceller.
 */
export function adaptifEsikOgren(
  ornekler: SkorOrnek[],
  baslangicEsik = 0.5,
  ogrenmeOrani = 0.15,
  maxTur = 20,
  fpMaliyet = 1.5,   // insan engelleme (sürtünme) biraz daha pahalı
  fnMaliyet = 1.0,   // bot kaçırma
): AdaptifSonuc {
  const eps = 0.02;
  let esik = baslangicEsik;
  let momentum = 0;
  const turlar: OgrenmeTur[] = [];
  const baslangicMetrik = metrikHesap(ornekler, baslangicEsik, fpMaliyet, fnMaliyet);

  for (let t = 0; t < maxTur; t++) {
    // Sonlu-fark gradyanı: d(maliyet)/d(esik).
    const mArti = metrikHesap(ornekler, Math.min(1, esik + eps), fpMaliyet, fnMaliyet).maliyet;
    const mEksi = metrikHesap(ornekler, Math.max(0, esik - eps), fpMaliyet, fnMaliyet).maliyet;
    const gradyan = (mArti - mEksi) / (2 * eps);

    // Momentum + adım-sınırı (salınım önleme).
    momentum = 0.6 * momentum - ogrenmeOrani * gradyan;
    let adim = Math.max(-0.08, Math.min(0.08, momentum));
    const esikOnce = esik;
    esik = Math.max(0.02, Math.min(0.98, esik + adim));

    const metrik = metrikHesap(ornekler, esik, fpMaliyet, fnMaliyet);
    turlar.push({ tur: t + 1, esikOnce, esikSonra: esik, gradyan: Math.round(gradyan * 1000) / 1000, metrik });

    // Yakınsama: adım çok küçüldüyse dur.
    if (Math.abs(esik - esikOnce) < 0.002) break;
  }

  // Maliyet eğrisi (tarama): global optimumu doğrula.
  const maliyetEgrisi: AdaptifSonuc["maliyetEgrisi"] = [];
  let enIyiEsik = esik, enIyiMaliyet = Infinity;
  for (let e = 0.05; e <= 0.95; e += 0.05) {
    const m = metrikHesap(ornekler, e, fpMaliyet, fnMaliyet);
    maliyetEgrisi.push({ esik: Math.round(e * 100) / 100, maliyet: Math.round(m.maliyet * 1000) / 1000, f1: Math.round(m.f1 * 1000) / 1000 });
    if (m.maliyet < enIyiMaliyet) { enIyiMaliyet = m.maliyet; enIyiEsik = Math.round(e * 100) / 100; }
  }

  // Öğrenilen eşik ile tarama-optimumundan iyi olanı seç (öğrenme yerel minimuma sıkışabilir).
  const ogrenilenM = metrikHesap(ornekler, esik, fpMaliyet, fnMaliyet);
  const optimalEsik = ogrenilenM.maliyet <= enIyiMaliyet + 0.001 ? Math.round(esik * 100) / 100 : enIyiEsik;
  const optimalMetrik = metrikHesap(ornekler, optimalEsik, fpMaliyet, fnMaliyet);

  const iyilesme = baslangicMetrik.maliyet > 0
    ? Math.round(((baslangicMetrik.maliyet - optimalMetrik.maliyet) / baslangicMetrik.maliyet) * 1000) / 10
    : 0;

  return {
    baslangicEsik, optimalEsik, turlar,
    baslangicMetrik, optimalMetrik,
    yakinsadi: turlar.length < maxTur,
    iyilesme,
    maliyetEgrisi,
  };
}

/* ------------------------------------------------- Gerçek olaylardan örnek üretimi */

/** Gözlemlenen olaylardan skor örnekleri çıkarır (gerçek etiket = kötü sınıf). */
export function olaylardanOrnek(events: BotEvent[]): SkorOrnek[] {
  return events.map((e) => ({ skor: e.score, bot: KOTU.has(e.botClass) }));
}

/* ------------------------------------------------- Geri-besleme kalite izleme */

export interface GeriBeslemeSaglik {
  /** Şu anki (varsayılan 0.5) eşiğin maliyeti. */
  mevcutMaliyet: number;
  /** Optimal eşiğin maliyeti. */
  optimalMaliyet: number;
  /** Eşik ne kadar uzakta (kalibrasyon açığı). */
  esikSapmasi: number;
  durum: "optimal" | "ayarlanmali" | "kritik";
  oneri: string;
}

export function geriBeslemeSaglik(sonuc: AdaptifSonuc, mevcutEsik = 0.5): GeriBeslemeSaglik {
  const mevcut = sonuc.maliyetEgrisi.reduce((en, p) => Math.abs(p.esik - mevcutEsik) < Math.abs(en.esik - mevcutEsik) ? p : en, sonuc.maliyetEgrisi[0]);
  const sapma = Math.abs(mevcutEsik - sonuc.optimalEsik);
  const durum: GeriBeslemeSaglik["durum"] = sapma < 0.05 ? "optimal" : sapma < 0.15 ? "ayarlanmali" : "kritik";
  const oneri = durum === "optimal"
    ? "Eşik optimuma yakın — geri-besleme döngüsü dengede."
    : `Eşiği ${mevcutEsik.toFixed(2)} → ${sonuc.optimalEsik.toFixed(2)} olarak ayarla: maliyet %${sonuc.iyilesme} düşer (${sonuc.optimalEsik > mevcutEsik ? "daha çok bot yakalanır" : "daha az insan engellenir"}).`;
  return {
    mevcutMaliyet: mevcut?.maliyet ?? 0,
    optimalMaliyet: sonuc.optimalMetrik.maliyet,
    esikSapmasi: Math.round(sapma * 100) / 100,
    durum, oneri,
  };
}
