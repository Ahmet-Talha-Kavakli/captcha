/**
 * Specter — Davranışsal İmza Arketipleri
 * ======================================
 * `behavior.ts` içindeki gerçek `scoreBehavior()` motorunu beslemek için
 * hazır, gerçekçi `BehaviorSignals` şablonları. Her arketip; bir insan ya da
 * bot türünü (doğal insan, aceleci insan, otomasyon scripti, headless tarayıcı,
 * kayıt-tekrar botu, insan taklidi gelişmiş bot) temsil eden TAM bir sinyal
 * setidir.
 *
 * Bu dosya SAF'tır: `Date.now`, `Math.random` ya da argümansız `new Date`
 * kullanmaz — aynı girdi her zaman aynı skoru üretir (determinizm). Skorlama
 * mantığı burada YOK; sadece `scoreBehavior()`'a verilen imza şablonları var.
 * Böylece galeri, motorun gerçek çıktısını gösterir; uydurma sayı yoktur.
 */

import { scoreBehavior, type BehaviorSignals, type BehaviorFactor } from "@/lib/specter/behavior";

/** Bir arketipin beklenen sonucu — motor gerçekte bunu doğrular. */
export type BeklenenKarar = "insan" | "bot";

export interface Arketip {
  /** Kararlı kimlik (React key + seçim için). */
  kimlik: string;
  /** Kısa ad (ör. "Doğal insan"). */
  ad: string;
  /** Kullanıcıya gösterilen 1-2 cümlelik açıklama. */
  aciklama: string;
  /** Bu arketibin karakterini özetleyen kısa etiketler. */
  etiketler: string[];
  /** Motorun vermesini beklediğimiz karar (galeri bunu gerçek skorla kıyaslar). */
  beklenen: BeklenenKarar;
  /** `scoreBehavior()`'a verilecek tam davranış imzası. */
  sinyal: BehaviorSignals;
}

/**
 * Arketip imzaları. Her biri `emptySignals()` şeklini TAM doldurur — böylece
 * eksik alan varsayılanına düşmez ve skor öngörülebilir olur. Değerler,
 * `behaviorScore()` eşiklerine (bkz. behavior.ts yorumları) göre gerçekçi
 * seçilmiştir.
 */
export const ARKETIPLER: Arketip[] = [
  {
    kimlik: "dogal-insan",
    ad: "Doğal insan",
    aciklama:
      "Masaüstünde fareyle input'a gidip challenge'ı okuduktan sonra değişken ritimle yazan tipik kullanıcı. Tüm hareket, ritim ve zamanlama sinyalleri insansı.",
    etiketler: ["eğrisel fare", "değişken ritim", "makul süre"],
    beklenen: "insan",
    sinyal: {
      mouseSamples: 74,
      mousePathLength: 512,
      mouseSpeedVariance: 0.34,
      keyIntervals: [148, 205, 118, 176, 132, 191],
      timeToFirstInteraction: 780,
      timeToSubmit: 4200,
      hadTouch: false,
      focusEvents: 2,
      pasted: false,
      mouseCorners: 9,
      mouseAccelVariance: 0.06,
      keyDwellTimes: [88, 124, 96, 112, 103],
      scrollEvents: 3,
      deviceMotion: false,
      webdriver: false,
      timezoneMismatch: false,
      visibilityChanges: 1,
      mouseBeforeKey: true,
      interactionMix: false,
    },
  },
  {
    kimlik: "aceleci-insan",
    ad: "Aceleci insan",
    aciklama:
      "Gerçek kullanıcı ama hızlı: az fare hareketi, kısa çözüm süresi. Sinyaller insansı olsa da zayıf — motor yine de sınırda insan tarafında tutar.",
    etiketler: ["hızlı çözüm", "az hareket", "sınırda"],
    beklenen: "insan",
    sinyal: {
      mouseSamples: 22,
      mousePathLength: 168,
      mouseSpeedVariance: 0.12,
      keyIntervals: [92, 128, 74, 141],
      timeToFirstInteraction: 240,
      timeToSubmit: 1400,
      hadTouch: false,
      focusEvents: 1,
      pasted: false,
      mouseCorners: 4,
      mouseAccelVariance: 0.031,
      keyDwellTimes: [62, 95, 71, 84],
      scrollEvents: 0,
      deviceMotion: false,
      webdriver: false,
      timezoneMismatch: false,
      visibilityChanges: 0,
      mouseBeforeKey: true,
      interactionMix: false,
    },
  },
  {
    kimlik: "mobil-insan",
    ad: "Mobil kullanıcı",
    aciklama:
      "Dokunmatik ekranda çözen gerçek kişi: cihaz hareketi (ivmeölçer) ve doğal tuş ritmi var, fare yok. Cihaz bütünlüğü sinyalleri güçlü insan işareti.",
    etiketler: ["dokunma", "cihaz hareketi", "doğal ritim"],
    beklenen: "insan",
    sinyal: {
      mouseSamples: 0,
      mousePathLength: 0,
      mouseSpeedVariance: 0,
      keyIntervals: [162, 214, 138, 187, 155],
      timeToFirstInteraction: 640,
      timeToSubmit: 4600,
      hadTouch: true,
      focusEvents: 1,
      pasted: false,
      mouseCorners: undefined,
      mouseAccelVariance: undefined,
      keyDwellTimes: [94, 132, 101, 118],
      scrollEvents: 4,
      deviceMotion: true,
      webdriver: false,
      timezoneMismatch: false,
      visibilityChanges: 2,
      mouseBeforeKey: undefined,
      interactionMix: true,
    },
  },
  {
    kimlik: "otomasyon-scripti",
    ad: "Otomasyon scripti",
    aciklama:
      "python-requests / curl tarzı ham istemci: hiç fare/klavye biyometrisi yok, challenge'a bakmadan milisaniyeler içinde submit. Motor için en kolay yakalanan.",
    etiketler: ["etkileşim yok", "anında submit", "ham istemci"],
    beklenen: "bot",
    sinyal: {
      mouseSamples: 0,
      mousePathLength: 0,
      mouseSpeedVariance: 0,
      keyIntervals: [],
      timeToFirstInteraction: 12,
      timeToSubmit: 90,
      hadTouch: false,
      focusEvents: 0,
      pasted: false,
      mouseCorners: undefined,
      mouseAccelVariance: undefined,
      keyDwellTimes: undefined,
      scrollEvents: 0,
      deviceMotion: false,
      webdriver: false,
      timezoneMismatch: true,
      visibilityChanges: 0,
      mouseBeforeKey: false,
      interactionMix: false,
    },
  },
  {
    kimlik: "headless-tarayici",
    ad: "Headless tarayıcı",
    aciklama:
      "Puppeteer/Playwright: navigator.webdriver açık, fare yok, düz yol, mekanik ve insan-üstü hızlı tuş ritmi. Cihaz bütünlüğü bayrağı tek başına ele verir.",
    etiketler: ["webdriver=true", "mekanik ritim", "düz yol"],
    beklenen: "bot",
    sinyal: {
      mouseSamples: 0,
      mousePathLength: 0,
      mouseSpeedVariance: 0,
      keyIntervals: [12, 11, 13, 10, 12],
      timeToFirstInteraction: 22,
      timeToSubmit: 210,
      hadTouch: false,
      focusEvents: 0,
      pasted: false,
      mouseCorners: 0,
      mouseAccelVariance: 0.001,
      keyDwellTimes: [4, 5, 4, 5],
      scrollEvents: 0,
      deviceMotion: false,
      webdriver: true,
      timezoneMismatch: true,
      visibilityChanges: 0,
      mouseBeforeKey: false,
      interactionMix: false,
    },
  },
  {
    kimlik: "kayit-tekrar-botu",
    ad: "Kayıt-tekrar botu",
    aciklama:
      "Bir insan oturumunu kaydedip tekrar oynatan bot: fare hareketi VAR ama sabit ivmeli, tuş ritmi mekanik (sabit CV), çözümü yapıştırıyor. Ritim ve bütünlük sinyalleri ele verir.",
    etiketler: ["kayıt-tekrar", "sabit ivme", "yapıştırma"],
    beklenen: "bot",
    sinyal: {
      mouseSamples: 40,
      mousePathLength: 300,
      mouseSpeedVariance: 0.02,
      keyIntervals: [100, 100, 101, 100, 99, 100],
      timeToFirstInteraction: 60,
      timeToSubmit: 620,
      hadTouch: false,
      focusEvents: 0,
      pasted: true,
      mouseCorners: 0,
      mouseAccelVariance: 0.0008,
      keyDwellTimes: [3, 3, 4, 3],
      scrollEvents: 0,
      deviceMotion: false,
      webdriver: false,
      timezoneMismatch: false,
      visibilityChanges: 0,
      mouseBeforeKey: false,
      interactionMix: false,
    },
  },
  {
    kimlik: "insan-taklidi-bot",
    ad: "İnsan taklidi gelişmiş bot",
    aciklama:
      "En zorlu düşman: fare yolunu eğriselleştirip tuş ritmine gürültü ekleyen bot. Bazı sinyalleri kandırır ama basılı-kalma süreleri sentetik ve etkileşim sırası bozuk — motor sınırın altında tutar.",
    etiketler: ["gelişmiş taklit", "sentetik dwell", "sınırda bot"],
    beklenen: "bot",
    sinyal: {
      mouseSamples: 48,
      mousePathLength: 300,
      // Eğrisel görünmeye çalışır ama üretilmiş yol düz kalır → varyans düşük.
      mouseSpeedVariance: 0.03,
      keyIntervals: [120, 145, 108, 160, 132],
      // Zamanlamayı insansı taklit etmeyi başarır (makul süre) — bu yüzden
      // sadece ince biyometrik kusurlar (sentetik dwell, sabit ivme, bozuk
      // etkileşim sırası) motoru sınırın hemen ALTINDA tutar.
      timeToFirstInteraction: 320,
      timeToSubmit: 2600,
      hadTouch: false,
      focusEvents: 0,
      pasted: false,
      mouseCorners: 4,
      mouseAccelVariance: 0.001,
      // Basılı-kalma süreleri sentetik (insan 40-220ms; bot ~3ms).
      keyDwellTimes: [3, 4, 3, 5, 3],
      scrollEvents: 0,
      deviceMotion: false,
      webdriver: false,
      timezoneMismatch: false,
      visibilityChanges: 0,
      mouseBeforeKey: false,
      interactionMix: false,
    },
  },
];

/** Bir arketibi gerçek motordan geçir — skor + karar + faktör dökümü döner. */
export function arketipSkoru(a: Arketip) {
  const b = scoreBehavior(a.sinyal);
  return {
    ...b,
    /** Motorun kararı, arketibin beklediğiyle örtüşüyor mu? */
    beklentiyeUygun: (b.humanLikely ? "insan" : "bot") === a.beklenen,
  };
}

/** Tüm arketipleri tek seferde skorla (galeri kartları için). */
export function tumArketipSkorlari() {
  return ARKETIPLER.map((a) => ({ arketip: a, sonuc: arketipSkoru(a) }));
}

/**
 * İnteraktif analizör için "önemli" alanların açıklamalı meta verisi. Slider /
 * toggle üretimini besler; sadece motorun gerçekten okuduğu alanları içerir.
 */
export type AlanTipi = "sayi" | "bool" | "dizi";

export interface AlanTanimi {
  anahtar: keyof BehaviorSignals;
  etiket: string;
  ipucu: string;
  tip: AlanTipi;
  /** sayı alanları için slider aralığı + adım. */
  min?: number;
  max?: number;
  adim?: number;
}

export const AYARLANABILIR_ALANLAR: AlanTanimi[] = [
  { anahtar: "mouseSamples", etiket: "Fare örnek sayısı", ipucu: "Kaç fare hareketi örneklendi. 0 = fare hiç oynatılmadı (bot işareti).", tip: "sayi", min: 0, max: 120, adim: 1 },
  { anahtar: "mousePathLength", etiket: "Fare yol uzunluğu (px)", ipucu: "Fare imlecinin kat ettiği toplam mesafe. İnsanlar dolambaçlı yol izler.", tip: "sayi", min: 0, max: 800, adim: 10 },
  { anahtar: "mouseSpeedVariance", etiket: "Fare hız varyansı", ipucu: "Hız düzensizliği. İnsan = yüksek varyans; bot = düz/sabit (≈0).", tip: "sayi", min: 0, max: 0.5, adim: 0.01 },
  { anahtar: "mouseCorners", etiket: "Yol köşe/düzeltme", ipucu: "Fare yolundaki keskin dönüşler. İnsan çok mikro-düzeltme yapar; ≥4 insansı, 0 robotik.", tip: "sayi", min: 0, max: 15, adim: 1 },
  { anahtar: "mouseAccelVariance", etiket: "İvme varyansı", ipucu: "İvmelenme düzensizliği. >0.03 doğal, <0.002 sabit/otomasyon.", tip: "sayi", min: 0, max: 0.1, adim: 0.005 },
  { anahtar: "timeToFirstInteraction", etiket: "İlk etkileşim gecikmesi (ms)", ipucu: "Challenge görünür olduktan sonra ilk temasa kadar geçen süre. <80ms = anında (otomasyon).", tip: "sayi", min: 0, max: 2000, adim: 20 },
  { anahtar: "timeToSubmit", etiket: "Gönderime kadar süre (ms)", ipucu: "Toplam çözüm süresi. <400ms bakmadan submit; 900ms–30sn makul.", tip: "sayi", min: 0, max: 8000, adim: 50 },
  { anahtar: "hadTouch", etiket: "Dokunma olayı", ipucu: "Dokunmatik ekran etkileşimi (gerçek mobil kullanıcı işareti).", tip: "bool" },
  { anahtar: "deviceMotion", etiket: "Cihaz hareketi (ivmeölçer)", ipucu: "Gerçek mobil cihaz sensör verisi geldi mi. Güçlü insan sinyali.", tip: "bool" },
  { anahtar: "webdriver", etiket: "navigator.webdriver", ipucu: "Tarayıcının otomasyon bayrağı. true = headless/otomasyon (en güçlü bot sinyali).", tip: "bool" },
  { anahtar: "timezoneMismatch", etiket: "Saat dilimi uyumsuz", ipucu: "İstemci saat dilimi ile IP coğrafyası çelişiyor (proxy/otomasyon).", tip: "bool" },
  { anahtar: "pasted", etiket: "Yapıştırma tespit", ipucu: "Çözüm yapıştırıldı mı — dışarıdan enjeksiyon işareti olabilir.", tip: "bool" },
  { anahtar: "mouseBeforeKey", etiket: "Önce fare, sonra tuş", ipucu: "İnsan önce fareyle input'a gider, sonra yazar. Doğal etkileşim sırası.", tip: "bool" },
];
