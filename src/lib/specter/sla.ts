/**
 * Specter — SLA & Hata Bütçesi (Error Budget) hesap çekirdeği
 * ===========================================================
 * SALT-SAF (pure) fonksiyonlar: Date.now / Math.random / argsız `new Date`
 * KULLANMAZ. Tüm zaman/seri girdileri dışarıdan parametre olarak alınır.
 * Aynı girdi → her zaman aynı çıktı (determinizm garantisi). Böylece hem
 * sunucu render'ında hem de scratch testinde birebir doğrulanabilir.
 *
 * SRE terminolojisi:
 *  - SLA hedefi (ör. %99.9): sözleşmede taahhüt edilen uptime yüzdesi.
 *  - Hata bütçesi (error budget): 100% - hedef; dönem içinde "harcanabilecek"
 *    kesinti payı. %99.9 aylık → 43.2 dk izinli kesinti.
 *  - Tüketilen bütçe: gerçekleşen kesintinin bu paydan yediği kısım.
 *  - Yüzdelikler (p50/p95/p99): gecikme dağılımının kuyruk metrikleri.
 */

/* ------------------------------------------------------------------ Dönem sabitleri */

/** Bir dönemin dakika cinsinden uzunluğu. */
export const DONEM_DAKIKA = {
  /** 30 günlük ay. */
  aylik: 30 * 24 * 60, // 43200
  /** 365 günlük yıl. */
  yillik: 365 * 24 * 60, // 525600
} as const;

export type DonemAnahtar = keyof typeof DONEM_DAKIKA;

/* ------------------------------------------------------------------ SLA kademeleri */

export interface SlaKademe {
  /** Hedef uptime yüzdesi (ör. 99.9). */
  hedef: number;
  /** İnsan-okur etiket. */
  etiket: string;
  /** Aylık (30g) izin verilen kesinti — dakika. */
  aylikDkIzin: number;
  /** Yıllık (365g) izin verilen kesinti — dakika. */
  yillikDkIzin: number;
}

/**
 * "Dokuzlar" kademeleri: %99.9 / %99.95 / %99.99 ve karşılık gelen
 * aylık/yıllık izinli kesinti süreleri. Determinist türetme.
 */
export const SLA_KADEMELERI: SlaKademe[] = [99.9, 99.95, 99.99].map((hedef) => ({
  hedef,
  etiket: `%${hedef}`,
  aylikDkIzin: yuvarla(DONEM_DAKIKA.aylik * (1 - hedef / 100), 2),
  yillikDkIzin: yuvarla(DONEM_DAKIKA.yillik * (1 - hedef / 100), 2),
}));

/** Verilen hedefe en yakın (>= hedef) tanımlı kademeyi döndürür. */
export function kademeBul(hedef: number): SlaKademe {
  const tam = SLA_KADEMELERI.find((k) => Math.abs(k.hedef - hedef) < 1e-9);
  if (tam) return tam;
  // Tanımlı değilse dinamik bir kademe üret (yine deterministik).
  return {
    hedef,
    etiket: `%${hedef}`,
    aylikDkIzin: yuvarla(DONEM_DAKIKA.aylik * (1 - hedef / 100), 2),
    yillikDkIzin: yuvarla(DONEM_DAKIKA.yillik * (1 - hedef / 100), 2),
  };
}

/* ------------------------------------------------------------------ SLA hesabı */

export interface SlaSonuc {
  /** Girdi uptime yüzdesi. */
  uptime: number;
  /** Hedef uptime yüzdesi. */
  hedef: number;
  /** Hedef karşılandı mı (uptime >= hedef). */
  karsilandi: boolean;
  /** Uyum durumu: karşılandı / risk-altında / ihlal. */
  durum: "karsilandi" | "risk" | "ihlal";
  /** Dönem uzunluğu (dakika). */
  donemDk: number;
  /** İzin verilen kesinti bütçesi (dakika). */
  izinliKesintiDk: number;
  /** Gerçekleşen (tüketilen) kesinti (dakika). */
  tuketilenDk: number;
  /** Kalan bütçe (dakika, negatif olmaz). */
  kalanDk: number;
  /** Bütçe kullanım yüzdesi (100'ü aşabilir → ihlal). */
  kullanimYuzde: number;
  /** Kalan bütçe yüzdesi (0..100). */
  kalanYuzde: number;
}

/**
 * SLA uyumu + hata bütçesi hesabı.
 *
 * @param uptimeYuzde  Gerçekleşen uptime yüzdesi (ör. 99.95).
 * @param hedefYuzde   SLA hedefi (ör. 99.9).
 * @param donem        "aylik" (30g, varsayılan) veya "yillik" (365g).
 *
 * Örnek: %99.9 hedef, aylık → 43.2 dk izinli kesinti.
 *   uptime %99.5 → kesinti 216 dk → bütçe %500 tüketildi → İHLAL.
 *   uptime %99.95 → kesinti 21.6 dk → bütçe kaldı → KARŞILANDI.
 */
export function slaHesap(
  uptimeYuzde: number,
  hedefYuzde: number,
  donem: DonemAnahtar = "aylik",
): SlaSonuc {
  const donemDk = DONEM_DAKIKA[donem];
  // İzin verilen kesinti = hedefin bıraktığı pay.
  const izinliKesintiDk = donemDk * (1 - hedefYuzde / 100);
  // Gerçekleşen kesinti = uptime açığının dönem karşılığı.
  const tuketilenDk = donemDk * (1 - uptimeYuzde / 100);
  // Bütçe kullanımı: izin 0 ise (hedef %100) bölme yapma.
  const kullanimYuzde =
    izinliKesintiDk <= 0
      ? tuketilenDk > 0
        ? Infinity
        : 0
      : (tuketilenDk / izinliKesintiDk) * 100;
  const kalanDk = Math.max(0, izinliKesintiDk - tuketilenDk);
  const kalanYuzde = Math.max(0, Math.min(100, 100 - kullanimYuzde));
  const karsilandi = uptimeYuzde >= hedefYuzde - 1e-9;

  // Durum: karşılandı ama bütçenin >%80'i tükendiyse "risk".
  let durum: SlaSonuc["durum"];
  if (!karsilandi) durum = "ihlal";
  else if (kullanimYuzde >= 80) durum = "risk";
  else durum = "karsilandi";

  return {
    uptime: yuvarla(uptimeYuzde, 4),
    hedef: hedefYuzde,
    karsilandi,
    durum,
    donemDk,
    izinliKesintiDk: yuvarla(izinliKesintiDk, 3),
    tuketilenDk: yuvarla(tuketilenDk, 3),
    kalanDk: yuvarla(kalanDk, 3),
    kullanimYuzde: Number.isFinite(kullanimYuzde) ? yuvarla(kullanimYuzde, 2) : Infinity,
    kalanYuzde: yuvarla(kalanYuzde, 2),
  };
}

/* ------------------------------------------------------------------ Yüzdelikler */

/**
 * Bir gecikme (ms) dizisinden p-yüzdeliğini hesaplar (nearest-rank).
 * Boş dizide 0 döner. Girdiyi mutasyona uğratmaz (kopya sıralanır).
 *
 * @param latencySeri  Gecikme örnekleri (ms).
 * @param p            Yüzdelik (0..100; ör. 50, 95, 99).
 */
export function yuzdelik(latencySeri: number[], p: number): number {
  if (latencySeri.length === 0) return 0;
  const sirali = [...latencySeri].sort((a, b) => a - b);
  if (p <= 0) return sirali[0];
  if (p >= 100) return sirali[sirali.length - 1];
  // Nearest-rank: rank = ceil(p/100 * N), 1-tabanlı.
  const rank = Math.ceil((p / 100) * sirali.length);
  const idx = Math.min(sirali.length - 1, Math.max(0, rank - 1));
  return sirali[idx];
}

export interface Yuzdelikler {
  p50: number;
  p95: number;
  p99: number;
  /** Örnek sayısı. */
  n: number;
  /** Ortalama (ms). */
  ort: number;
  /** En düşük / en yüksek. */
  min: number;
  max: number;
}

/** p50 / p95 / p99 + özet istatistikleri tek geçişte üretir. */
export function yuzdelikOzet(latencySeri: number[]): Yuzdelikler {
  const n = latencySeri.length;
  if (n === 0) return { p50: 0, p95: 0, p99: 0, n: 0, ort: 0, min: 0, max: 0 };
  const toplam = latencySeri.reduce((a, v) => a + v, 0);
  return {
    p50: yuzdelik(latencySeri, 50),
    p95: yuzdelik(latencySeri, 95),
    p99: yuzdelik(latencySeri, 99),
    n,
    ort: yuvarla(toplam / n, 1),
    min: Math.min(...latencySeri),
    max: Math.max(...latencySeri),
  };
}

/**
 * Gecikme dağılımını histograma böler (kova sınırları ms). Her kova için
 * eleman sayısını döndürür — dağılım grafiği için. Deterministik.
 *
 * @param latencySeri  Gecikme örnekleri (ms).
 * @param sinirlar     Artan kova üst-sınırları (ör. [30,60,100,200]).
 *                     Son kova bu sınırın üstünü ("+") toplar.
 */
export function histogram(
  latencySeri: number[],
  sinirlar: number[],
): { etiket: string; alt: number; ust: number; adet: number }[] {
  const kovalar = sinirlar.map((ust, i) => ({
    alt: i === 0 ? 0 : sinirlar[i - 1],
    ust,
    adet: 0,
    etiket: i === 0 ? `≤${ust}` : `${sinirlar[i - 1]}–${ust}`,
  }));
  // Taşma kovası: son sınırın üstü.
  const son = sinirlar[sinirlar.length - 1] ?? 0;
  kovalar.push({ alt: son, ust: Infinity, adet: 0, etiket: `>${son}` });

  for (const v of latencySeri) {
    const k = kovalar.find((b) => v > b.alt && v <= b.ust) ?? kovalar[kovalar.length - 1];
    k.adet++;
  }
  return kovalar;
}

/* ------------------------------------------------------------------ Uptime hesabı */

/** Bir probe (sağlık yoklaması) sonucu. */
export type KontrolDurum = "up" | "degraded" | "down";

/**
 * Bir up/down/degraded probe serisinden uptime yüzdesini hesaplar.
 * Ağırlık: up = 1.0, degraded = 0.5 (kısmi hizmet), down = 0.0.
 * Boş seri → %100 (veri yoksa kesinti varsayma).
 *
 * @param kontroller  Sıralı probe sonuçları.
 */
export function uptimeHesapla(kontroller: KontrolDurum[]): number {
  if (kontroller.length === 0) return 100;
  const toplam = kontroller.reduce(
    (a, d) => a + (d === "up" ? 1 : d === "degraded" ? 0.5 : 0),
    0,
  );
  return yuvarla((toplam / kontroller.length) * 100, 4);
}

/**
 * Probe serisinden kesinti/dejenere olay pencerelerini çıkarır — ardışık
 * "up olmayan" günleri tek olaya birleştirir. Incident timeline için.
 *
 * @param kontroller  Sıralı probe sonuçları (indeks = dönem içi konum).
 */
export function kesintiPencereleri(
  kontroller: KontrolDurum[],
): { baslangicIndeks: number; uzunluk: number; enKotu: KontrolDurum }[] {
  const pencereler: { baslangicIndeks: number; uzunluk: number; enKotu: KontrolDurum }[] = [];
  let i = 0;
  while (i < kontroller.length) {
    if (kontroller[i] === "up") {
      i++;
      continue;
    }
    const bas = i;
    let enKotu: KontrolDurum = "degraded";
    while (i < kontroller.length && kontroller[i] !== "up") {
      if (kontroller[i] === "down") enKotu = "down";
      i++;
    }
    pencereler.push({ baslangicIndeks: bas, uzunluk: i - bas, enKotu });
  }
  return pencereler;
}

/* ------------------------------------------------------------------ Bütçe yakma trendi */

/**
 * Hata bütçesi "yakma" (burn-down) serisi: dönem boyunca her adımda kalan
 * bütçe yüzdesini üretir. Kümülatif kesinti dakikaları girdiden gelir.
 *
 * @param kumulatifKesintiDk  Her adımda o ana kadar birikmiş kesinti (dk).
 * @param izinliKesintiDk     Dönem için izin verilen toplam kesinti (dk).
 * @returns Her adım için kalan bütçe yüzdesi (0..100).
 */
export function butceYakma(
  kumulatifKesintiDk: number[],
  izinliKesintiDk: number,
): number[] {
  if (izinliKesintiDk <= 0) return kumulatifKesintiDk.map((v) => (v > 0 ? 0 : 100));
  return kumulatifKesintiDk.map((tuketilen) =>
    yuvarla(Math.max(0, Math.min(100, 100 - (tuketilen / izinliKesintiDk) * 100)), 2),
  );
}

/* ------------------------------------------------------------------ yardımcı */

/** n ondalık basamağa yuvarlar (deterministik). */
function yuvarla(x: number, n: number): number {
  const k = 10 ** n;
  return Math.round(x * k) / k;
}
