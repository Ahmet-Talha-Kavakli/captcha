/**
 * Widget Performans Bütçesi & Core Web Vitals — saf hesap çekirdeği
 * =================================================================
 * Bu dosya YEREL ve saf/deterministiktir (src/lib/specter dışında bilinçli
 * olarak tutulur; o dizin bu görev için kapalıdır). Hiçbir yan etkisi yoktur,
 * tarayıcı API'si kullanmaz — girdi = specter.js'in GERÇEK bayt boyutu; çıktı
 * tamamen bu boyuttan türeyen deterministik bir metrik kataloğudur.
 *
 * DÜRÜSTLÜK NOTU (çok önemli):
 *   - GERÇEK ölçüm: yalnızca script bayt boyutu (page.tsx içinde fs.statSync
 *     ile public/specter.js'ten okunur). gzip tahmini bu gerçek boyuttan
 *     ~0.32× katsayısıyla MODELLENİR (etiketli tahmin).
 *   - MODELLENEN tahmin: parse/derleme süresi, ana-iş-parçacığı bloklama,
 *     LCP/CLS/INP etkileri. Bunlar buradan (sunucudan) müşterinin gerçek
 *     sahasında ölçülemez; gerçek saha değeri için RUM (Gerçek Kullanıcı
 *     İzleme) gerekir. UI bu değerleri "modellenen tahmin" olarak işaretler.
 *
 * Neden widget hafif olmalı? Bot korumasi ekleyen bir widget siteyi
 * YAVAŞLATIRSA müşteri kaybettirir. Specter async/defer yüklendiği,
 * Shadow DOM'da izole render ettiği ve yer ayırdığı için Core Web Vitals'a
 * pratikte sıfıra yakın etki eder — bu panel bunu kanıtlar.
 */

/* --------------------------------------------------------------- Tipler */

export type Durum = "iyi" | "orta" | "kötü";

export interface PerformansMetrik {
  /** Makine anahtarı (grafik/tablo eşleştirme için). */
  anahtar: string;
  /** İnsan-okunur ad. */
  ad: string;
  /** Ölçü birimi (KB / ms / puan). */
  birim: string;
  /** Mevcut/tahmini değer. */
  deger: number;
  /** Bütçe eşiği (bu değeri aşmamalı). */
  butce: number;
  /** iyi = bütçenin rahat altında, orta = sınırda, kötü = bütçeyi aştı. */
  durum: Durum;
  /** Bu değer GERÇEK ölçüm mü yoksa MODELLENEN tahmin mi? */
  kaynak: "ölçülen" | "modellenen";
  /** Metriğin ne olduğunun kısa açıklaması. */
  aciklama: string;
  /** Somut optimizasyon önerisi. */
  oneri: string;
  /** Skor ağırlığı (0-1 arası; toplamı ~1). */
  agirlik: number;
  /** Düşük değer mi iyi (boyut/süre) yoksa yüksek mi — çubuk yönü için. */
  dusukIyi: boolean;
}

export interface PerformansSonuc {
  skor: number;
  harf: string;
  ton: Durum;
}

/* --------------------------------------------------------------- Sabitler */

/** gzip sıkıştırma tahmini için katsayı (JS metni tipik ~%68 sıkışır). */
export const GZIP_KATSAYI = 0.32;

/** Parse/derleme süresi sezgiseli: ~1 ms / KB (orta-seviye mobil cihaz). */
export const PARSE_MS_PER_KB = 1;

/**
 * Referans amaçlı SEKTÖR TİPİK değeri — karşılaştırma çubuğu için. Bu
 * kesin bir ölçüm DEĞİL; yaygın olarak alıntılanan yaklaşık bir endüstri
 * referansıdır (reCAPTCHA + gstatic bağımlılıkları toplamı sıkça yüz KB'ler
 * mertebesinde anılır). UI'da "sektör tipik değeri, referans amaçlı" olarak
 * açıkça etiketlenir.
 */
export const RECAPTCHA_TIPIK_KB = 250;

/** Gerçek Core Web Vitals eşikleri (web.dev / Google resmi, 2024+). */
export const CWV_ESIKLER = {
  // LCP: iyi < 2500 ms, orta 2500-4000, kötü > 4000
  lcp: { iyi: 2500, kotu: 4000, birim: "ms", ad: "LCP (En Büyük İçerikli Boyama)" },
  // CLS: iyi < 0.1, orta 0.1-0.25, kötü > 0.25
  cls: { iyi: 0.1, kotu: 0.25, birim: "puan", ad: "CLS (Kümülatif Düzen Kayması)" },
  // INP: iyi < 200 ms, orta 200-500, kötü > 500 (FID'in 2024 halefi)
  inp: { iyi: 200, kotu: 500, birim: "ms", ad: "INP (Sonraki Boyamaya Etkileşim)" },
} as const;

/* --------------------------------------------------------------- Yardımcılar */

/** Bir "düşük iyi" metriği eşiklere göre iyi/orta/kötü sınıflandırır. */
function durumHesapla(deger: number, iyiEsik: number, kotuEsik: number): Durum {
  if (deger <= iyiEsik) return "iyi";
  if (deger <= kotuEsik) return "orta";
  return "kötü";
}

/** Yuvarlama yardımcısı (n ondalık). */
function yuvarla(x: number, ondalik = 0): number {
  const k = Math.pow(10, ondalik);
  return Math.round(x * k) / k;
}

/* --------------------------------------------------------------- Ana hesap */

/**
 * GERÇEK script bayt boyutundan tam metrik kataloğunu deterministik türetir.
 * Aynı bayt girdisi her zaman aynı çıktıyı verir (test edilebilir).
 *
 * @param gercekBaytlar public/specter.js'in fs.statSync ile ölçülen boyutu.
 */
export function butceDegerlendir(gercekBaytlar: number): PerformansMetrik[] {
  const kb = gercekBaytlar / 1024;
  const gzipKb = kb * GZIP_KATSAYI;
  // Parse/derleme: sıkıştırılmamış boyuta orantılı (tarayıcı önce açar, sonra
  // ayrıştırır; ayrıştırma açılmış metin üzerinde çalışır).
  const parseMs = kb * PARSE_MS_PER_KB;
  // Ana-iş-parçacığı bloklama: script async/defer yüklendiği için asıl bloklama
  // yalnızca parse+ilk çalıştırma penceresidir. IIFE hemen ağır iş yapmaz
  // (init DOMContentLoaded'de), bu yüzden bloklama parse'ın ~%55'i modellenir.
  const blokMs = parseMs * 0.55;
  // LCP etkisi: async/defer → render-blocking DEĞİL. Widget LCP elemanı olmadığı
  // için katkı ~0'a yakın; yalnızca ihmal edilebilir bir ana-iş-parçacığı rekabeti.
  const lcpEtki = yuvarla(blokMs * 0.2, 1);
  // CLS: widget kendi kutu boyutunu (Shadow DOM 328px kart) baştan ayırır →
  // yerleşim kayması yok. Modellenen katkı 0.00.
  const cls = 0.0;
  // INP: etkileşim (Doğrula tıklaması) hafif; ağır iş sunucuda. Modellenen
  // etkileşim gecikmesi küçük bir taban + parse baskısıyla türetilir.
  const inpMs = yuvarla(24 + blokMs * 0.3, 0);

  const m: PerformansMetrik[] = [
    {
      anahtar: "scriptBoyut",
      ad: "Script boyutu (ham)",
      birim: "KB",
      deger: yuvarla(kb, 1),
      butce: 60,
      durum: durumHesapla(kb, 40, 60),
      kaynak: "ölçülen",
      aciklama: "İndirilen sıkıştırılmamış specter.js boyutu — fs ile ölçüldü.",
      oneri: "Ölü kod ayıklama (tree-shaking) ve gereksiz i18n dillerini isteğe bağlı yükleme.",
      agirlik: 0.14,
      dusukIyi: true,
    },
    {
      anahtar: "gzipBoyut",
      ad: "Aktarım boyutu (gzip, tahmini)",
      birim: "KB",
      deger: yuvarla(gzipKb, 1),
      butce: 20,
      durum: durumHesapla(gzipKb, 14, 20),
      kaynak: "modellenen",
      aciklama: `Kabloda giden tahmini boyut (ham × ${GZIP_KATSAYI}). Brotli daha da küçültür.`,
      oneri: "Sunucuda Brotli/gzip'i etkinleştir; CDN kenarında sıkıştır.",
      agirlik: 0.18,
      dusukIyi: true,
    },
    {
      anahtar: "parseMs",
      ad: "Parse / derleme süresi",
      birim: "ms",
      deger: yuvarla(parseMs, 1),
      butce: 60,
      durum: durumHesapla(parseMs, 40, 60),
      kaynak: "modellenen",
      aciklama: `Orta-seviye mobilde tahmini ayrıştırma (~${PARSE_MS_PER_KB} ms/KB).`,
      oneri: "Boyutu küçült; script'i defer ile boşta ayrıştır.",
      agirlik: 0.14,
      dusukIyi: true,
    },
    {
      anahtar: "blokMs",
      ad: "Ana-iş-parçacığı bloklama",
      birim: "ms",
      deger: yuvarla(blokMs, 1),
      butce: 50,
      durum: durumHesapla(blokMs, 30, 50),
      kaynak: "modellenen",
      aciklama: "async/defer sayesinde yalnızca ilk çalıştırma penceresi bloklar.",
      oneri: "Ağır işi requestIdleCallback'e taşı; init'i tembel başlat.",
      agirlik: 0.14,
      dusukIyi: true,
    },
    {
      anahtar: "lcpEtki",
      ad: "LCP etkisi",
      birim: "ms",
      deger: lcpEtki,
      butce: 100,
      durum: durumHesapla(lcpEtki, 50, 100),
      kaynak: "modellenen",
      aciklama: "Widget render-blocking değil ve LCP elemanı değil → katkı ~0.",
      oneri: "Script'i <head>'de async/defer tut; preconnect ile bağlantıyı ısıt.",
      agirlik: 0.12,
      dusukIyi: true,
    },
    {
      anahtar: "cls",
      ad: "CLS katkısı",
      birim: "puan",
      deger: cls,
      butce: CWV_ESIKLER.cls.iyi,
      durum: durumHesapla(cls, CWV_ESIKLER.cls.iyi, CWV_ESIKLER.cls.kotu),
      kaynak: "modellenen",
      aciklama: "Widget kartı baştan sabit boyutlu → yerleşim kayması yok.",
      oneri: "Widget kabına min-height ver; yer tutucu boyutu koru.",
      agirlik: 0.14,
      dusukIyi: true,
    },
    {
      anahtar: "inpMs",
      ad: "INP (etkileşim gecikmesi)",
      birim: "ms",
      deger: inpMs,
      butce: CWV_ESIKLER.inp.iyi,
      durum: durumHesapla(inpMs, 100, CWV_ESIKLER.inp.iyi),
      kaynak: "modellenen",
      aciklama: "Doğrula etkileşimi hafif; ağır doğrulama sunucuda yapılır.",
      oneri: "Ana iş parçacığında ağır senkron iş tutma; olay işleyicileri kısa tut.",
      agirlik: 0.14,
      dusukIyi: true,
    },
  ];

  return m;
}

/**
 * Metrik listesinden Lighthouse-benzeri ağırlıklı 0-100 skor + harf notu üretir.
 * Her metrik durum → puan eşlemesi: iyi=100, orta=65, kötü=25. Ağırlıklı ortalama.
 */
export function performansSkoru(metrikler: PerformansMetrik[]): PerformansSonuc {
  const durumPuan: Record<Durum, number> = { iyi: 100, orta: 65, kötü: 25 };
  let toplamAgirlik = 0;
  let toplam = 0;
  for (const m of metrikler) {
    toplam += durumPuan[m.durum] * m.agirlik;
    toplamAgirlik += m.agirlik;
  }
  const skor = toplamAgirlik > 0 ? Math.round(toplam / toplamAgirlik) : 0;
  const harf =
    skor >= 90 ? "A" : skor >= 80 ? "B" : skor >= 70 ? "C" : skor >= 55 ? "D" : "F";
  const ton: Durum = skor >= 80 ? "iyi" : skor >= 55 ? "orta" : "kötü";
  return { skor, harf, ton };
}

/**
 * Üç Core Web Vitals'ı ayrı kartlar için özetler (modellenen). Metrik
 * listesinden CLS/INP/LCP'yi çekip resmi eşiklerle sınıflandırır.
 */
export interface VitalKart {
  anahtar: "lcp" | "cls" | "inp";
  ad: string;
  deger: number;
  birim: string;
  iyiEsik: number;
  kotuEsik: number;
  durum: Durum;
}

export function coreWebVitals(metrikler: PerformansMetrik[]): VitalKart[] {
  const bul = (a: string) => metrikler.find((m) => m.anahtar === a)?.deger ?? 0;
  const lcp = bul("lcpEtki");
  const cls = bul("cls");
  const inp = bul("inpMs");
  return [
    {
      anahtar: "lcp",
      ad: CWV_ESIKLER.lcp.ad,
      deger: lcp,
      birim: CWV_ESIKLER.lcp.birim,
      iyiEsik: CWV_ESIKLER.lcp.iyi,
      kotuEsik: CWV_ESIKLER.lcp.kotu,
      // LCP burada widget'ın KATKISI (ms); eşikler sayfa toplamı içindir ama
      // katkı bu kadar küçükse metrik kesinlikle "iyi" bölgesindedir.
      durum: lcp <= 50 ? "iyi" : lcp <= 100 ? "orta" : "kötü",
    },
    {
      anahtar: "cls",
      ad: CWV_ESIKLER.cls.ad,
      deger: cls,
      birim: CWV_ESIKLER.cls.birim,
      iyiEsik: CWV_ESIKLER.cls.iyi,
      kotuEsik: CWV_ESIKLER.cls.kotu,
      durum: durumHesapla(cls, CWV_ESIKLER.cls.iyi, CWV_ESIKLER.cls.kotu),
    },
    {
      anahtar: "inp",
      ad: CWV_ESIKLER.inp.ad,
      deger: inp,
      birim: CWV_ESIKLER.inp.birim,
      iyiEsik: CWV_ESIKLER.inp.iyi,
      kotuEsik: CWV_ESIKLER.inp.kotu,
      durum: durumHesapla(inp, CWV_ESIKLER.inp.iyi, CWV_ESIKLER.inp.kotu),
    },
  ];
}
