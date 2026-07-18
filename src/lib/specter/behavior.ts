/**
 * Specter — Davranışsal Sinyal Analizi
 * -------------------------------------
 * Ghost-font glyph substitution, DOM okuyan botları yakalar. Ancak
 * ekran görüntüsü alıp vision-model (GPT-4V / OCR) ile çözen gelişmiş
 * ajanlar glyph'i doğru okuyabilir. İkinci savunma katmanı: ETKİLEŞİM
 * DAVRANIŞI.
 *
 * İnsanlar CAPTCHA'yı çözerken:
 *   - fareyi düzensiz, eğrisel yollarla hareket ettirir,
 *   - tuşlara değişken aralıklarla basar (insan ritmi),
 *   - challenge'ı görmeden yazmaz (görüntüleme→giriş gecikmesi olur),
 *   - odak/blur, scroll, dokunma gibi doğal olaylar üretir.
 *
 * Botlar tipik olarak:
 *   - anında ve düz yol ile input'a gider,
 *   - sabit aralıklı / çok hızlı tuş basar,
 *   - fare hiç oynatmadan form doldurur,
 *   - challenge render'ı ile submit arası gecikme insan-dışıdır.
 *
 * Bu modül tarayıcıda toplanan sinyalleri 0..1 arası bir "insanlık
 * skoru"na indirger. Skor, çözüm doğruluğuyla BİRLİKTE değerlendirilir.
 */

export interface BehaviorSignals {
  /** Fare hareket örneklerinin sayısı. */
  mouseSamples: number;
  /** Fare yolunun toplam uzunluğu (px). */
  mousePathLength: number;
  /** Fare hızı varyansı (insan = yüksek, bot = düşük/0). */
  mouseSpeedVariance: number;
  /** Tuş vuruşları arası gecikmeler (ms). */
  keyIntervals: number[];
  /** Challenge görüntülenmesi ile ilk etkileşim arası süre (ms). */
  timeToFirstInteraction: number;
  /** Challenge görüntülenmesi ile submit arası toplam süre (ms). */
  timeToSubmit: number;
  /** Dokunmatik olay var mı (mobil insan sinyali). */
  hadTouch: boolean;
  /** Sayfa odak/blur olayı sayısı. */
  focusEvents: number;
  /** Kopyala-yapıştır tespit edildi mi (bot işareti olabilir). */
  pasted: boolean;

  /* --- Derin biyometri (opsiyonel — geriye uyumlu) --- */
  /** Fare yolundaki keskin dönüş/köşe sayısı (insan yolu eğrisel, çok mikro-düzeltme yapar). */
  mouseCorners?: number;
  /** Fare ivme değişimlerinin varyansı (insan ivmesi düzensiz; bot sabit/lineer). */
  mouseAccelVariance?: number;
  /** Tuş basılı kalma süreleri (dwell time, ms) — insan tuş-basma süreleri değişkendir. */
  keyDwellTimes?: number[];
  /** Scroll olay sayısı (insan sayfayı gezinir). */
  scrollEvents?: number;
  /** Cihaz oryantasyon/ivmeölçer verisi geldi mi (gerçek mobil cihaz sinyali). */
  deviceMotion?: boolean;
  /** navigator.webdriver bayrağı (headless/otomasyon açık işareti). */
  webdriver?: boolean;
  /** Görünmez honeypot tuzak alanı dolduruldu/tetiklendi mi (bot-kesin işaret). */
  honeypotTetik?: boolean;
  /** İşlem-Kanıtı (PoW) çözümü: bulunan nonce (token powBit istiyorsa). */
  powNonce?: number;
  /** PoW çözümünün hash'i (hex) — verify baştaki-sıfır-bitini doğrular. */
  powHashHex?: string;

  /* --- Tarayıcı-tutarlılık ortam sinyalleri (opsiyonel — widget toplar,
     tarayiciTutarlilik UA-iddiasıyla çapraz-doğrular) --- */
  /** navigator.hardwareConcurrency (CPU çekirdek). */
  hardwareConcurrency?: number;
  /** navigator.deviceMemory (GB — Chrome'a özgü). */
  deviceMemory?: number;
  /** navigator.languages dizisi uzunluğu. */
  dilSayisi?: number;
  /** navigator.plugins.length. */
  eklentiSayisi?: number;
  /** window.chrome nesnesi var mı. */
  chromeNesnesi?: boolean;
  /** WebGL üreticisi (yazılım render = headless işareti). */
  webglSaticisi?: string;
  /** AudioContext örnekleme oranı. */
  sesOrnekOrani?: number;
  /** window.devicePixelRatio. */
  pikselOrani?: number;
  /** Dokunmatik desteği (maxTouchPoints>0). */
  dokunmatik?: boolean;
  /** İstemci zaman dilimi ile IP coğrafyası tutarlı mı (tutarsızlık = proxy/otomasyon). */
  timezoneMismatch?: boolean;
  /** Sayfa görünürlük değişimi (sekme değiştirme) — gerçek kullanıcı davranışı. */
  visibilityChanges?: number;
  /** İlk tuş basımına kadar fare hareketi oldu mu (insan önce fareyle input'a gider). */
  mouseBeforeKey?: boolean;
  /** Tarayıcı dokunma+fare karışık mı (bot genelde tek girdi türü kullanır). */
  interactionMix?: boolean;
}

export function emptySignals(): BehaviorSignals {
  return {
    mouseSamples: 0,
    mousePathLength: 0,
    mouseSpeedVariance: 0,
    keyIntervals: [],
    timeToFirstInteraction: 0,
    timeToSubmit: 0,
    hadTouch: false,
    focusEvents: 0,
    pasted: false,
  };
}

/** Skora katkıda bulunan tekil bir biyometrik faktör (dashboard için). */
export interface BehaviorFactor {
  /** Faktör kimliği (ör "mouse", "keyRhythm"). */
  key: string;
  /** İnsan-okunur etiket. */
  label: string;
  /** Bu faktörün skora katkısı (-1..+1; + insan, - bot). */
  delta: number;
  /** Kategori: hareket / ritim / zamanlama / cihaz / bütünlük. */
  category: "hareket" | "ritim" | "zamanlama" | "cihaz" | "butunluk";
}

interface ScoreBreakdown {
  score: number; // 0..1
  reasons: string[];
  humanLikely: boolean;
  /** Skorun nasıl oluştuğu — her faktörün ağırlıklı katkısı. */
  factors: BehaviorFactor[];
  /** İnsanlık güven yüzdesi (0..100). */
  confidence: number;
}

/**
 * Sinyalleri 0..1 insanlık skoruna indirger. Ağırlıklar deneyimsel;
 * dashboard'dan zorluk politikasına göre ayarlanabilir tutuldu.
 */
export function scoreBehavior(s: BehaviorSignals): ScoreBreakdown {
  let score = 0.5; // nötr başla
  const reasons: string[] = [];
  const factors: BehaviorFactor[] = [];
  const ekle = (key: string, label: string, delta: number, category: BehaviorFactor["category"]) => {
    score += delta;
    factors.push({ key, label, delta, category });
    if (delta < 0) reasons.push(label);
  };

  // 1) Fare hareketi — insanlar oynatır.
  if (s.mouseSamples === 0 && !s.hadTouch) {
    ekle("mouse", "fare/dokunma hareketi yok", -0.25, "hareket");
  } else if (s.mousePathLength > 120 && s.mouseSpeedVariance > 0.05) {
    ekle("mouse", "doğal fare hareketi", 0.18, "hareket");
  }

  // 1b) Fare köşe/mikro-düzeltme — insan yolu eğrisel, çok düzeltme yapar.
  if (typeof s.mouseCorners === "number" && s.mouseSamples > 0) {
    if (s.mouseCorners >= 4) ekle("mouseCorners", "insansı yol düzeltmeleri", 0.08, "hareket");
    else if (s.mouseCorners === 0 && s.mousePathLength > 50) ekle("mouseCorners", "düz/robotik fare yolu", -0.12, "hareket");
  }

  // 1c) İvme varyansı — insan ivmesi düzensiz; bot lineer/sabit.
  if (typeof s.mouseAccelVariance === "number" && s.mouseSamples > 0) {
    if (s.mouseAccelVariance > 0.03) ekle("accel", "doğal ivme değişimi", 0.06, "hareket");
    else if (s.mouseAccelVariance < 0.002) ekle("accel", "sabit ivme (otomasyon)", -0.1, "hareket");
  }

  // 2) Tuş ritmi — insan aralıkları değişkendir.
  if (s.keyIntervals.length >= 3) {
    const mean = s.keyIntervals.reduce((a, b) => a + b, 0) / s.keyIntervals.length;
    const variance = s.keyIntervals.reduce((a, b) => a + (b - mean) ** 2, 0) / s.keyIntervals.length;
    const cv = mean > 0 ? Math.sqrt(variance) / mean : 0;
    if (cv < 0.05) ekle("keyRhythm", "mekanik/sabit tuş ritmi", -0.2, "ritim");
    else if (cv > 0.2) ekle("keyRhythm", "insansı tuş ritmi", 0.15, "ritim");
    if (mean < 25) ekle("keySpeed", "insan-üstü yazma hızı", -0.15, "ritim");
  }

  // 2b) Tuş basılı kalma süresi (dwell) — insan dwell süreleri değişken (40-200ms).
  if (s.keyDwellTimes && s.keyDwellTimes.length >= 3) {
    const d = s.keyDwellTimes;
    const dMean = d.reduce((a, b) => a + b, 0) / d.length;
    const dVar = d.reduce((a, b) => a + (b - dMean) ** 2, 0) / d.length;
    const dCv = dMean > 0 ? Math.sqrt(dVar) / dMean : 0;
    if (dMean >= 40 && dMean <= 220 && dCv > 0.15) ekle("dwell", "doğal tuş basma süreleri", 0.08, "ritim");
    else if (dMean < 8 || dCv < 0.02) ekle("dwell", "sentetik tuş süreleri", -0.12, "ritim");
  }

  // 3) Zamanlama — çok hızlı çözüm şüpheli.
  if (s.timeToSubmit > 0 && s.timeToSubmit < 400) ekle("submit", "challenge'a bakmadan submit", -0.2, "zamanlama");
  else if (s.timeToSubmit >= 900 && s.timeToSubmit < 30000) ekle("submit", "makul çözüm süresi", 0.1, "zamanlama");
  if (s.timeToFirstInteraction > 0 && s.timeToFirstInteraction < 80) ekle("firstInt", "anında etkileşim (otomasyon)", -0.1, "zamanlama");

  // 3b) Fare-önce-tuş sırası — insan önce fareyle input'a gider.
  if (s.mouseBeforeKey === true) ekle("order", "doğal etkileşim sırası", 0.05, "zamanlama");
  else if (s.mouseBeforeKey === false && s.keyIntervals.length > 0) ekle("order", "fare olmadan doğrudan yazma", -0.08, "zamanlama");

  // 4) Yapıştırma — çözümü dışarıdan enjekte etme işareti.
  if (s.pasted) ekle("paste", "yapıştırma tespit edildi", -0.15, "butunluk");

  // 5) Odak/scroll/görünürlük — gerçek kullanıcı etkileşimi.
  if (s.focusEvents > 0) ekle("focus", "sayfa odak etkileşimi", 0.05, "cihaz");
  if (s.scrollEvents && s.scrollEvents > 0) ekle("scroll", "sayfa gezinme (scroll)", 0.04, "cihaz");
  if (s.visibilityChanges && s.visibilityChanges > 0) ekle("visibility", "sekme etkileşimi", 0.03, "cihaz");

  // 6) Cihaz bütünlüğü — güçlü otomasyon/proxy sinyalleri.
  if (s.deviceMotion === true) ekle("motion", "gerçek cihaz hareketi (mobil)", 0.1, "cihaz");
  if (s.webdriver === true) ekle("webdriver", "navigator.webdriver = true", -0.35, "butunluk");
  if (s.timezoneMismatch === true) ekle("tz", "saat dilimi/coğrafya uyumsuz", -0.15, "butunluk");
  if (s.interactionMix === true) ekle("mix", "insansı girdi çeşitliliği", 0.05, "cihaz");

  score = Math.max(0, Math.min(1, score));
  return {
    score,
    reasons,
    humanLikely: score >= 0.45,
    factors,
    confidence: Math.round(score * 100),
  };
}
