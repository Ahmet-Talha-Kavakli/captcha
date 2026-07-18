/**
 * Specter — Maliyet-Atıf & ROI (Yatırım Getirisi) Motoru
 * ======================================================
 * "Specter bize ne kazandırdı?" — yöneticiye/satışa gösterilecek somut değer.
 * Engellenen her bot sınıfının bir MALİYETİ vardır: kazıma bant genişliği yer,
 * kimlik doldurma dolandırıcılık/destek maliyeti yaratır, DDoS altyapı şişirir,
 * AI eğitim botu içerik çalar, spam moderasyon yükü doğurur. Bu motor, engellenen
 * bot sayısını sınıf-başına temsili birim maliyetle çarpıp ÖNLENEN MALİYETİ,
 * sonra Specter ücretiyle karşılaştırıp ROI'yi hesaplar.
 *
 * NOT: Birim maliyetler sektör-temsili tahminlerdir (kaynak: kamuya açık bot-
 * maliyet çalışmaları modeli); kesin muhasebe değil, karar-destek metriği.
 * Saf/deterministik: Date.now/Math.random YOK.
 */

/** Bot sınıfı başına önlenen temsili birim maliyet (TL). */
export interface BirimMaliyet {
  botClass: string;
  ad: string;
  /** Engellenen olay başına TL. */
  birim: number;
  /** Maliyet kalemi açıklaması. */
  aciklama: string;
}

export const BIRIM_MALIYETLER: BirimMaliyet[] = [
  { botClass: "credential_stuffing", ad: "Kimlik doldurma", birim: 4.2, aciklama: "Hesap ele geçirme, dolandırıcılık ve destek maliyeti." },
  { botClass: "scraper", ad: "Kazıyıcı", birim: 0.9, aciklama: "Bant genişliği, fiyat/içerik hırsızlığı, rakip istihbaratı." },
  { botClass: "ddos", ad: "DDoS", birim: 2.6, aciklama: "Altyapı ölçekleme, kesinti ve mitigasyon maliyeti." },
  { botClass: "ai_agent", ad: "AI ajan", birim: 1.4, aciklama: "İzinsiz içerik toplama / model eğitimi değer kaybı." },
  { botClass: "spam", ad: "Spam", birim: 0.7, aciklama: "Moderasyon, itibar ve teslimat maliyeti." },
  { botClass: "automation", ad: "Otomasyon", birim: 0.6, aciklama: "Kaynak tüketimi ve kötüye kullanım." },
];

const MALIYET_MAP = new Map(BIRIM_MALIYETLER.map((b) => [b.botClass, b]));
/** Sınıflandırılamayan engellenen olay için varsayılan birim. */
const VARSAYILAN_BIRIM = 0.5;

export interface RoiKalem {
  botClass: string;
  ad: string;
  engellenen: number;
  birim: number;
  onlenenMaliyet: number;
  aciklama: string;
}

export interface RoiSonuc {
  kalemler: RoiKalem[];
  toplamEngellenen: number;
  toplamOnlenenMaliyet: number;
  /** Specter aylık ücreti (plandan). */
  specterMaliyet: number;
  /** Net kazanç = önlenen − ücret. */
  netKazanc: number;
  /** ROI çarpanı (önlenen / ücret). */
  roiCarpani: number;
  /** ROI yüzdesi. */
  roiYuzde: number;
  /** Önlenen olay başına ortalama değer. */
  ortDeger: number;
  /** Ücretsiz plansa (maliyet 0) tam kâr. */
  ucretsizMi: boolean;
}

/**
 * Engellenen bot dağılımından ROI hesaplar.
 * @param botDagilim botClass → engellenen sayısı (son dönem).
 * @param specterAylikTl Specter'ın aylık ücreti (0 = ücretsiz).
 */
export function roiHesap(botDagilim: Record<string, number>, specterAylikTl: number): RoiSonuc {
  const kalemler: RoiKalem[] = [];
  let toplamOnlenen = 0;
  let toplamEngellenen = 0;

  // Bilinen sınıfları maliyetli kalemlere çevir.
  for (const bm of BIRIM_MALIYETLER) {
    const say = botDagilim[bm.botClass] || 0;
    if (say <= 0) continue;
    const maliyet = say * bm.birim;
    toplamOnlenen += maliyet;
    toplamEngellenen += say;
    kalemler.push({ botClass: bm.botClass, ad: bm.ad, engellenen: say, birim: bm.birim, onlenenMaliyet: Math.round(maliyet), aciklama: bm.aciklama });
  }

  // Bilinmeyen sınıflar (varsayılan birim).
  let digerSay = 0;
  for (const [k, v] of Object.entries(botDagilim)) {
    if (!MALIYET_MAP.has(k) && k !== "human" && k !== "good_bot" && v > 0) digerSay += v;
  }
  if (digerSay > 0) {
    const maliyet = digerSay * VARSAYILAN_BIRIM;
    toplamOnlenen += maliyet;
    toplamEngellenen += digerSay;
    kalemler.push({ botClass: "diger", ad: "Diğer bot", engellenen: digerSay, birim: VARSAYILAN_BIRIM, onlenenMaliyet: Math.round(maliyet), aciklama: "Sınıflandırılmamış engellenen otomasyon." });
  }

  kalemler.sort((a, b) => b.onlenenMaliyet - a.onlenenMaliyet);

  const toplamOnlenenMaliyet = Math.round(toplamOnlenen);
  const ucretsizMi = specterAylikTl <= 0;
  const netKazanc = toplamOnlenenMaliyet - specterAylikTl;
  const roiCarpani = specterAylikTl > 0 ? Math.round((toplamOnlenenMaliyet / specterAylikTl) * 10) / 10 : Infinity;
  const roiYuzde = specterAylikTl > 0 ? Math.round((netKazanc / specterAylikTl) * 100) : 0;
  const ortDeger = toplamEngellenen > 0 ? Math.round((toplamOnlenenMaliyet / toplamEngellenen) * 100) / 100 : 0;

  return {
    kalemler, toplamEngellenen, toplamOnlenenMaliyet,
    specterMaliyet: specterAylikTl, netKazanc, roiCarpani, roiYuzde, ortDeger, ucretsizMi,
  };
}

/** Plan fiyat dizesinden aylık TL çıkarır ("₺490/ay" → 490, "₺0" → 0, "Özel" → 0). */
export function fiyatTl(fiyat: string): number {
  const m = fiyat.replace(/\./g, "").match(/(\d+)/);
  return m ? Number(m[1]) : 0;
}
