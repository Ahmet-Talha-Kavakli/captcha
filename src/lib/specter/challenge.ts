/**
 * Specter — Challenge Modeli
 * ---------------------------
 * Bir "challenge", insana ekranda gösterilecek görsel bulmacanın
 * TOHUMUDUR (seed). Kritik güvenlik fikri:
 *
 *   1. Sunucu, gerçek cevabı (answer) ASLA tarayıcıya düz göndermez.
 *      Cevap, HMAC ile imzalı bir token içinde saklanır (verify.ts).
 *   2. Tarayıcıya giden şey sadece: challengeId + seed + parametreler.
 *      Tarayıcı bu seed'den glyph'leri deterministik render eder.
 *   3. DOM'da / ağ trafiğinde okunabilir hiçbir doğru karakter yoktur.
 *      Glyph'ler canvas'a piksel olarak çizilir; karşılık gelen gerçek
 *      karakter yalnızca render fonksiyonunun kafasındadır ve DOM'a
 *      yazılmaz.
 *
 * Bu dosya framework-bağımsızdır: hem Node (API route) hem tarayıcı
 * (widget) tarafından import edilir.
 */

import { CHARSET } from "./glyphs";
import { Rng } from "./random";

/** Zorluk seviyeleri — gürültü/çarpıtma miktarını ölçekler. */
export type Difficulty = "low" | "medium" | "high";

/**
 * Challenge türleri — ghost-font çekirdeğinin (temporal dithering) İÇERİĞİNİ
 * değiştirir, KORUMA TEKNİĞİNİ değil. Her tür aynı hareketli-nokta-gürültüsü
 * içinde belirir (tek kare kör, hareket okunur); yalnızca gösterilen içerik ve
 * beklenen cevap farklıdır. Bu çeşitlilik botları tek bir çözücüye karşı
 * dayanıksız bırakır.
 *
 *   - kod : karakter dizisi (VARSAYILAN — mevcut davranış, geriye uyumlu).
 *   - sayi: yalnızca rakamlar (mobil/erişilebilir dostu, sayısal klavye).
 *   - yon : ghost-font içinde bir OK belirir; kullanıcı yönü girer (U/D/L/R).
 *   - sec : ghost-font içinde N tane nokta belirir; kullanıcı sayısını girer.
 */
export type ChallengeType = "kod" | "sayi" | "yon" | "sec";

export const CHALLENGE_TYPES: ChallengeType[] = ["kod", "sayi", "yon", "sec"];

/** Sadece rakamlardan oluşan charset ("sayi" türü için). */
const NUMERIC_CHARSET = "0123456789".split("");

/**
 * Yön haritası: cevap harfi (U/D/L/R) → ghost-font'ta çizilecek ok karakteri.
 * Ok glyph'i buildTextMask ile aynı temporal-dithering içinde çizilir.
 */
export const YON_OKLAR: Record<string, string> = {
  U: "↑",
  D: "↓",
  L: "←",
  R: "→",
};
const YON_KODLAR = ["U", "D", "L", "R"];

/** "sec" türünde gösterilecek nokta sayısı aralığı (dahil). */
const SEC_MIN = 3;
const SEC_MAX = 7;

export interface ChallengeParams {
  /** Kaç karakter gösterilecek (genelde 5-6). */
  length: number;
  /** Görsel çarpıtma agresifliği. */
  difficulty: Difficulty;
  /** Render için tohum. Aynı seed = aynı görüntü. */
  seed: number;
  /** Challenge türü. Verilmezse "kod" (geriye uyumlu). */
  type?: ChallengeType;
}

export interface Challenge {
  /** Benzersiz challenge kimliği (token ile bağlanır). */
  id: string;
  params: ChallengeParams;
  /** Sunucu-içi: doğru cevap. ASLA client'a serialize edilmez. */
  answer: string;
  /** Oluşturulma zamanı (ms). Süre aşımı kontrolü için. */
  issuedAt: number;
}

/**
 * Zorluk → kod uzunluğu. Düşük zorluk kısa (4 hane, insan için hızlı),
 * yüksek zorluk uzun (7 hane, bot için brute-force alanı büyür).
 * NOT: uzunluk sunucu tarafından belirlenip ClientChallenge.params.length
 * ile widget'a gönderilir; widget bu uzunlukla deriveAnswer çağırır →
 * cevap her zaman eşleşir.
 */
const DIFFICULTY_LENGTH: Record<Difficulty, number> = {
  low: 4,
  medium: 5,
  high: 7,
};

/**
 * Verilen seed'den cevabı deterministik türetir. Böylece sunucu
 * cevabı saklamak zorunda kalmadan, sadece seed + secret ile
 * doğrulama yapabilir (stateless doğrulama). render.ts de AYNI
 * fonksiyonu kullanarak ekrana çizilecek glyph dizisini bulur —
 * bu, "ekranda görünen" ile "doğru cevap"ın her zaman eşleşmesini
 * garanti eder.
 */
export function deriveAnswer(
  seed: number,
  length: number,
  type: ChallengeType = "kod",
): string {
  // KOD (varsayılan) — BİREBİR mevcut davranış. Bu dal ASLA değişmez;
  // token'da tür yoksa da bu çalışır (geriye uyum + mevcut testler).
  if (type === "kod") {
    const rng = new Rng(seed ^ 0x9e3779b9);
    let out = "";
    for (let i = 0; i < length; i++) {
      out += rng.pick(CHARSET);
    }
    return out;
  }

  // Yeni türler AYRI bir PRNG akışı kullanır (seed'e türe özgü bir sabit
  // karıştırılır) — böylece "kod" çıktısını hiç etkilemezler.
  if (type === "sayi") {
    const rng = new Rng((seed ^ 0x85ebca6b) >>> 0);
    let out = "";
    for (let i = 0; i < length; i++) out += rng.pick(NUMERIC_CHARSET);
    return out;
  }

  if (type === "yon") {
    // Tek yön: cevap U/D/L/R'den biri. (length yok sayılır — tek harf.)
    const rng = new Rng((seed ^ 0xc2b2ae35) >>> 0);
    return rng.pick(YON_KODLAR);
  }

  if (type === "sec") {
    // Cevap: gösterilecek nokta sayısı (SEC_MIN..SEC_MAX), string olarak.
    const rng = new Rng((seed ^ 0x27d4eb2f) >>> 0);
    return String(rng.int(SEC_MIN, SEC_MAX));
  }

  return "";
}

/**
 * GÖSTERİLECEK içerik — ghost-font'a çizilecek metin. "kod"/"sayi" için
 * cevabın kendisidir; "yon" için ok karakteri; "sec" için o sayıda nokta
 * karakteri (mask'te N ayrı benek). Cevap (deriveAnswer) ile HER ZAMAN
 * aynı seed'den türetilir → görünen ile beklenen eşleşir.
 *
 * render mantığı (temporal dithering) bu metni İÇERİK olarak alır; koruma
 * tekniği türden bağımsız aynıdır.
 */
export function challengeContent(
  seed: number,
  length: number,
  type: ChallengeType = "kod",
): string {
  const answer = deriveAnswer(seed, length, type);
  if (type === "yon") return YON_OKLAR[answer] ?? "→";
  if (type === "sec") {
    // N tane nokta — buildTextMask boşlukla ayrılmış benekler çizer.
    const n = parseInt(answer, 10) || SEC_MIN;
    return "●".repeat(n);
  }
  // kod / sayi: gösterilen = cevap.
  return answer;
}

/**
 * Yeni bir challenge üretir (sunucu tarafı). Seed dışarıdan verilir
 * (kriptografik olarak güvenli üretilmeli — verify.ts sağlar) ki
 * tahmin edilemez olsun.
 */
export function createChallenge(opts: {
  id: string;
  seed: number;
  difficulty?: Difficulty;
  length?: number;
  /** Challenge türü (varsayılan "kod" — geriye uyumlu). */
  type?: ChallengeType;
  now: number;
}): Challenge {
  const difficulty = opts.difficulty ?? "medium";
  const type = opts.type ?? "kod";
  const length = opts.length ?? DIFFICULTY_LENGTH[difficulty];
  const answer = deriveAnswer(opts.seed, length, type);
  return {
    id: opts.id,
    // type yalnızca "kod" değilse params'a eklenir → mevcut kod-challenge
    // yanıtı ve serileştirmesi BİREBİR aynı kalır (geriye uyum).
    params:
      type === "kod"
        ? { length, difficulty, seed: opts.seed }
        : { length, difficulty, seed: opts.seed, type },
    answer,
    issuedAt: opts.now,
  };
}

/**
 * Adaptif zorluk sinyalleri. Sunucu, IP itibarı / davranış skoru / geçmiş
 * başarısızlık gibi verileri bir araya getirip bu yapıyı oluşturur.
 * Tüm alanlar opsiyonel — verilmeyen sinyal "nötr" sayılır.
 */
export interface AdaptiveSignals {
  /**
   * Pasif davranış skoru (0..1). Yüksek = insansı, düşük = bot şüphesi.
   * (passive/verify akışındaki skor ile aynı ölçek.)
   */
  behaviorScore?: number;
  /**
   * IP itibarı (0..1). Yüksek = temiz/iyi ün, düşük = kötü ün
   * (kara-liste, VPN/proxy, bilinen bot ağı vb.).
   */
  ipReputation?: number;
  /** Bu IP/oturumun bu challenge'daki ardışık başarısız deneme sayısı. */
  recentFailures?: number;
  /** Otomasyon işareti (navigator.webdriver vb. sunucuya raporlandı mı). */
  automationFlag?: boolean;
}

const DIFFICULTY_ORDER: Difficulty[] = ["low", "medium", "high"];

/** Zorluk seviyesini indeks kaydırmasıyla klempleyerek yükselt/düşür. */
function shiftDifficulty(base: Difficulty, delta: number): Difficulty {
  const idx = DIFFICULTY_ORDER.indexOf(base);
  const next = Math.max(0, Math.min(DIFFICULTY_ORDER.length - 1, idx + delta));
  return DIFFICULTY_ORDER[next];
}

/**
 * Şüpheli sinyallere göre temel zorluğu OTOMATİK ayarlar.
 *
 * Mantık (net ve muhafazakâr): kötü sinyaller zorluğu yükseltir, güçlü
 * insansı sinyaller bir kademe indirebilir (erişilebilirlik için). Site
 * yöneticisinin seçtiği baseDifficulty referans alınır; adaptif katman
 * yalnızca ±1-2 kademe oynatır.
 *
 *   - automationFlag                        → +2 (doğrudan yükseğe it)
 *   - ipReputation < 0.3 (kötü ün)          → +1
 *   - behaviorScore < 0.3 (bot şüphesi)     → +1
 *   - recentFailures >= 2 (brute-force)     → +1
 *   - behaviorScore >= 0.85 ve ipReputation >= 0.7 (net insan) → -1
 *
 * Toplam kaydırma [-1, +2] arasına klemplenir; sonuç low/medium/high'a
 * sabitlenir. deriveAnswer/render mantığına DOKUNMAZ — sadece hangi
 * profilin uygulanacağını seçer.
 */
export function adaptiveDifficulty(
  baseDifficulty: Difficulty,
  signals: AdaptiveSignals = {},
): Difficulty {
  const {
    behaviorScore,
    ipReputation,
    recentFailures = 0,
    automationFlag = false,
  } = signals;

  let delta = 0;
  if (automationFlag) delta += 2;
  if (ipReputation != null && ipReputation < 0.3) delta += 1;
  if (behaviorScore != null && behaviorScore < 0.3) delta += 1;
  if (recentFailures >= 2) delta += 1;

  // Net insan sinyali: bir kademe kolaylaştır (yalnızca yükseltme yoksa).
  if (
    delta === 0 &&
    behaviorScore != null &&
    behaviorScore >= 0.85 &&
    ipReputation != null &&
    ipReputation >= 0.7
  ) {
    delta -= 1;
  }

  // Aşırı yükseltmeyi sınırla (tek kötü sinyalle uçtan uca zıplamasın).
  delta = Math.max(-1, Math.min(2, delta));
  return shiftDifficulty(baseDifficulty, delta);
}

/** Zorluk → kod uzunluğu eşlemesini dışarıya açar (route/test için). */
export function difficultyLength(difficulty: Difficulty): number {
  return DIFFICULTY_LENGTH[difficulty];
}

/** Tarayıcıya gönderilecek GÜVENLİ alt küme — answer YOK. */
export interface ClientChallenge {
  id: string;
  params: ChallengeParams;
  /** İmzalı, opak doğrulama token'ı (içinde şifreli cevap taahhüdü). */
  token: string;
  /** Süre (saniye). */
  ttl: number;
}

/** Kullanıcının girdisini normalize eder (büyük harf, boşluksuz). */
export function normalizeInput(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}
