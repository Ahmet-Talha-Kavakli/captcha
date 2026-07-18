/**
 * Specter — AI Bot Radarı (AI Agent Radar)
 * ========================================
 *
 * Specter'ın ana farkı ve varlık nedeni: **AI ajanlarını görmek.** Klasik bot
 * korumaları (Cloudflare, hCaptcha, reCAPTCHA) "insan mı, bot mu" ikilisine
 * bakar; oysa 2024 sonrası trafiğin sessizce büyüyen dilimi ne klasik scraper
 * ne de kötü niyetli botnet — LLM ajanlarıdır: model eğitimi için içerik
 * toplayan (GPTBot, ClaudeBot, CCBot), canlı yanıt için sayfa getiren
 * (ChatGPT-User, Claude-Web, PerplexityBot) ve arama/indeks amaçlı gezen
 * (Google-Extended, Applebot-Extended) ajanlar. Bu motor tam olarak bu
 * görünmez katmanı radara alır.
 *
 * NEDEN GERÇEK VERİ — TAHMİN YOK:
 * Bu motor UYDURMA/rastgele üretmez. Tüm çıktılar sitenin gerçek olay akışından
 * (`BotEvent[]`) türetilir:
 *   1. Tespit motorunun `botClass: "ai_agent"` olarak sınıfladığı olaylar, VE
 *   2. Ham `ua` (User-Agent) stringinde bilinen AI ajan imzaları (GPTBot,
 *      ClaudeBot, PerplexityBot, CCBot, Bytespider, …) — case-insensitive
 *      alt-string/regex eşleşmesiyle.
 * Bu iki sinyalin birleşimi "AI trafiği" sayılır. Böylece sınıflandırıcı bir
 * ajanı henüz `ai_agent` etiketlememişse bile ham UA imzası onu yakalar; tersi
 * durumda da sınıf etiketi imza-eşleşmesiz olayları kapsar.
 *
 * Zaman kıyasları için `simdi` DIŞARIDAN parametre gelir — `Date.now()` yoktur;
 * motor tümüyle SAF ve DETERMİNİSTİKtir (aynı girdi → aynı çıktı). Bu, hem
 * test edilebilirlik hem de sunucu/istemci tutarlılığı (hydration) için gerekli.
 *
 * Boş/eksik girdi güvenli: hiç olay yoksa çökme yerine sıfırlı, tutarlı bir
 * varsayılan `AiBotRadar` döner.
 *
 * @module lib/specter/ai-bot-radar
 */

import type { BotEvent, Verdict } from "@/lib/db/schema";

/* ------------------------------------------------------------------ Sabitler */

/** 24 saat (ms) — pencere kıyasları için. */
const YIRMI_DORT_SAAT = 86_400_000;

/**
 * Bilinen AI ajan imzası: insan-okur ad + UA stringinde aranacak desen.
 * `desen` case-insensitive alt-string olarak aranır (RegExp'e gerek yok; sade
 * `includes` yeterli ve daha hızlı). Ham UA örnekleri:
 *   "Mozilla/5.0 ... GPTBot/1.2; +https://openai.com/gptbot"
 *   "Mozilla/5.0 ... ChatGPT-User/1.0; +https://openai.com/bot"
 *   "Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)"
 *   "Mozilla/5.0 (compatible; PerplexityBot/1.0; +perplexity.ai)"
 *   "CCBot/2.0 (https://commoncrawl.org/faq/)"
 */
export interface AiImza {
  /** Kullanıcıya gösterilen kanonik ajan adı. */
  ad: string;
  /** UA stringinde aranan alt-string (küçük harfe indirgenmiş karşılaştırılır). */
  desen: string;
}

/**
 * Specter'ın tanıdığı AI ajan imza kataloğu. UA içinde bu desenlerden biri
 * (case-insensitive) geçen her olay o ada ait AI trafiği sayılır.
 *
 * Not: Sıralama önemli — belirli desenler (örn "Claude-Web") daha genel
 * desenlerden ("ClaudeBot") önce/ayrı ele alınır; her olay TÜM imzalara karşı
 * denetlenir ve eşleşen ilk imzanın adına atanır (deterministik ilk-eşleşme).
 */
export const AI_IMZALAR: readonly AiImza[] = [
  { ad: "GPTBot", desen: "gptbot" },
  { ad: "ChatGPT-User", desen: "chatgpt-user" },
  { ad: "ClaudeBot", desen: "claudebot" },
  { ad: "Claude-Web", desen: "claude-web" },
  { ad: "anthropic-ai", desen: "anthropic-ai" },
  { ad: "PerplexityBot", desen: "perplexitybot" },
  { ad: "Google-Extended", desen: "google-extended" },
  { ad: "CCBot", desen: "ccbot" },
  { ad: "Bytespider", desen: "bytespider" },
  { ad: "Amazonbot", desen: "amazonbot" },
  { ad: "Applebot-Extended", desen: "applebot-extended" },
  { ad: "cohere-ai", desen: "cohere-ai" },
  { ad: "Diffbot", desen: "diffbot" },
] as const;

/* ------------------------------------------------------------------ Tipler */

/** Radara düşen tekil bir AI ajanının özet kaydı. */
export interface AiAjan {
  /** Kanonik ajan adı (AI_IMZALAR'dan) veya sınıf-etiketli ama imzasız için "Bilinmeyen AI". */
  ad: string;
  /** Bu ajana ait toplam olay sayısı. */
  olay: number;
  /** verdict === "blocked" olan olay sayısı. */
  engellenen: number;
  /** verdict === "allowed" olan olay sayısı. */
  izinVerilen: number;
  /** Bu ajanın en son görüldüğü an (epoch ms) — olaylar arasındaki azami ts. */
  sonGoruldu: number;
}

/** AI olaylarının verdict (karar) dağılımı. */
export interface AiPolitikaDurum {
  /** verdict === "allowed" AI olayı sayısı. */
  izinVerilen: number;
  /** verdict === "blocked" AI olayı sayısı. */
  engellenen: number;
  /** verdict === "challenged" AI olayı sayısı. */
  meydanOkunan: number;
}

/** Son 24s AI trafiğinin bir önceki 24s'e göre değişim eğilimi. */
export interface AiEgilim {
  /** Son 24 saatteki AI olay sayısı. */
  son24: number;
  /** Ondan önceki 24 saatteki (48s–24s arası) AI olay sayısı. */
  onceki24: number;
  /**
   * Yüzde değişim (+artış / -azalış). Önceki pencere 0 ise: mevcut > 0 → 100,
   * mevcut 0 → 0. Tam sayıya yuvarlanır.
   */
  yuzde: number;
  /** Yön etiketi — UI'da ok/renk seçimi için. */
  yon: "artis" | "azalis" | "sabit";
}

/** Radarın tepe-özet blok'u (dashboard başlık kartları). */
export interface AiRadarOzet {
  /** Kaç farklı AI ajanı adı tespit edildi (benzersiz `ad` sayısı). */
  taninanAjan: number;
  /** Toplam AI trafiği (ai_agent sınıflı VEYA imza eşleşen olay sayısı). */
  toplamAiTrafik: number;
  /** Engelleme oranı: engellenen AI olayı / toplam AI trafiği (0..1). */
  engelOran: number;
  /** En aktif ajanın adı (en yüksek olay sayısı); AI trafiği yoksa null. */
  enAktifAjan: string | null;
}

/** AI Bot Radarı motorunun tam çıktısı. */
export interface AiBotRadar {
  /** Tespit edilen her AI ajanı — olay sayısına göre azalan sıralı. */
  ajanlar: AiAjan[];
  /** Toplam AI trafiği (ai_agent sınıflı VEYA bir AI imzası eşleşen olay sayısı). */
  toplamAiTrafik: number;
  /** Son 24 saatteki (simdi - 86400000'den yeni) AI olay sayısı. */
  son24Ai: number;
  /** AI olaylarının verdict dağılımı. */
  politikaDurum: AiPolitikaDurum;
  /** Son 24s vs önceki 24s AI trafiği eğilimi. */
  egilim: AiEgilim;
  /**
   * Bilinmeyen bot: botClass "automation" olan ama hiçbir AI imzası
   * eşleşmeyen (tanımlanamayan otomasyon) olay sayısı. AI ajanı DEĞİL ama
   * insan da değil — radarın "gri bölge" göstergesi.
   */
  bilinmeyenBot: number;
  /** Tepe-özet bloğu. */
  ozet: AiRadarOzet;
}

/* ------------------------------------------------------------------ Yardımcılar */

/**
 * Bir UA stringinde eşleşen ilk AI imzasını döndürür (deterministik ilk-eşleşme,
 * AI_IMZALAR sırasına göre). Eşleşme yoksa null.
 */
function imzaEslesir(ua: string): AiImza | null {
  const kucuk = (ua ?? "").toLowerCase();
  if (kucuk.length === 0) return null;
  for (const imza of AI_IMZALAR) {
    if (kucuk.includes(imza.desen)) return imza;
  }
  return null;
}

/**
 * Bir olayın AI trafiği sayılıp sayılmadığı: botClass "ai_agent" VEYA UA'da
 * bilinen bir AI imzası eşleşiyor.
 */
function aiTrafigiMi(ev: BotEvent): boolean {
  return ev.botClass === "ai_agent" || imzaEslesir(ev.ua) !== null;
}

/**
 * Bir AI olayına ajan adı atar: önce UA imzası (kanonik ad), yoksa sınıfı
 * ai_agent olduğu için "Bilinmeyen AI".
 */
function ajanAdi(ev: BotEvent): string {
  const imza = imzaEslesir(ev.ua);
  if (imza) return imza.ad;
  return "Bilinmeyen AI";
}

/** Güvenli boş radar — hiç AI olayı yoksa döndürülür (çökme yerine). */
function bosRadar(): AiBotRadar {
  return {
    ajanlar: [],
    toplamAiTrafik: 0,
    son24Ai: 0,
    politikaDurum: { izinVerilen: 0, engellenen: 0, meydanOkunan: 0 },
    egilim: { son24: 0, onceki24: 0, yuzde: 0, yon: "sabit" },
    bilinmeyenBot: 0,
    ozet: {
      taninanAjan: 0,
      toplamAiTrafik: 0,
      engelOran: 0,
      enAktifAjan: null,
    },
  };
}

/* ------------------------------------------------------------------ Ana motor */

/**
 * AI Bot Radarı — gerçek olay akışından AI ajan istihbaratı çıkarır.
 *
 * @param events Sitenin ham bot olayları (canlı akışın kaynağı).
 * @param simdi  Referans "şimdi" anı (epoch ms) — pencere kıyasları buradan.
 *               Date.now() KULLANILMAZ; deterministiklik için dışarıdan gelir.
 * @returns Ajan listesi, trafik toplamları, politika dağılımı, eğilim ve özet.
 */
export function aiBotRadar(events: BotEvent[], simdi: number): AiBotRadar {
  if (!events || events.length === 0) return bosRadar();

  const son24Esik = simdi - YIRMI_DORT_SAAT;
  const onceki24Esik = simdi - 2 * YIRMI_DORT_SAAT;

  // Ajan adı → biriken kayıt.
  const ajanMap = new Map<string, AiAjan>();

  let toplamAiTrafik = 0;
  let son24Ai = 0;
  let onceki24Ai = 0;
  let bilinmeyenBot = 0;

  const politikaDurum: AiPolitikaDurum = {
    izinVerilen: 0,
    engellenen: 0,
    meydanOkunan: 0,
  };

  for (const ev of events) {
    // Bilinmeyen bot: automation sınıflı ama hiçbir AI imzası eşleşmeyen.
    if (ev.botClass === "automation" && imzaEslesir(ev.ua) === null) {
      bilinmeyenBot += 1;
    }

    if (!aiTrafigiMi(ev)) continue;

    toplamAiTrafik += 1;

    // Zaman pencereleri (ts, olayın kendi zamanı).
    if (ev.ts >= son24Esik) {
      son24Ai += 1;
    } else if (ev.ts >= onceki24Esik) {
      onceki24Ai += 1;
    }

    // Politika (verdict) dağılımı.
    const v: Verdict = ev.verdict;
    if (v === "allowed") politikaDurum.izinVerilen += 1;
    else if (v === "blocked") politikaDurum.engellenen += 1;
    else if (v === "challenged") politikaDurum.meydanOkunan += 1;

    // Ajan bazında birikim.
    const ad = ajanAdi(ev);
    let kayit = ajanMap.get(ad);
    if (!kayit) {
      kayit = { ad, olay: 0, engellenen: 0, izinVerilen: 0, sonGoruldu: 0 };
      ajanMap.set(ad, kayit);
    }
    kayit.olay += 1;
    if (v === "blocked") kayit.engellenen += 1;
    else if (v === "allowed") kayit.izinVerilen += 1;
    if (ev.ts > kayit.sonGoruldu) kayit.sonGoruldu = ev.ts;
  }

  // Ajanları olaya göre azalan sırala; eşitlikte ad'a göre (deterministik).
  const ajanlar = Array.from(ajanMap.values()).sort((a, b) => {
    if (b.olay !== a.olay) return b.olay - a.olay;
    return a.ad.localeCompare(b.ad);
  });

  // Eğilim: son 24s vs önceki 24s.
  let yuzde: number;
  if (onceki24Ai === 0) {
    yuzde = son24Ai > 0 ? 100 : 0;
  } else {
    yuzde = Math.round(((son24Ai - onceki24Ai) / onceki24Ai) * 100);
  }
  const yon: AiEgilim["yon"] =
    son24Ai > onceki24Ai ? "artis" : son24Ai < onceki24Ai ? "azalis" : "sabit";

  const egilim: AiEgilim = { son24: son24Ai, onceki24: onceki24Ai, yuzde, yon };

  // Özet.
  const engelOran = toplamAiTrafik > 0 ? politikaDurum.engellenen / toplamAiTrafik : 0;
  const enAktifAjan = ajanlar.length > 0 ? ajanlar[0].ad : null;

  const ozet: AiRadarOzet = {
    taninanAjan: ajanlar.length,
    toplamAiTrafik,
    engelOran,
    enAktifAjan,
  };

  return {
    ajanlar,
    toplamAiTrafik,
    son24Ai,
    politikaDurum,
    egilim,
    bilinmeyenBot,
    ozet,
  };
}
