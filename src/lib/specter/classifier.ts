/**
 * Specter — Bot Sınıflandırma Motoru (ML-tarzı ensemble)
 * =======================================================
 * Basit UA-eşleştirmenin ötesinde: birden çok sinyali (UA imzası, TLS/parmak
 * izi, davranış biyometrisi, IP itibarı, AI ajan tespiti, header anomalisi,
 * istek hızı) ağırlıklı bir ensemble ile birleştirip her bot sınıfı için bir
 * OLASILIK dağılımı, baskın sınıf ve genel GÜVEN skoru üretir.
 *
 * Gerçek bir üründe bu bir gradient-boosted / lojistik model olurdu; burada
 * onu, üretim modelinin ürettiği aynı çıktı şekliyle (sınıf olasılıkları +
 * güven + katkı-veren-özellikler) deterministik ağırlıklı puanlamayla
 * modelliyoruz. Panel (sınıflandırma açıklanabilirliği) ve verify akışı kullanır.
 */

import type { BotClass } from "@/lib/db/schema";

export interface SiniflandirmaGirdisi {
  ua: string;
  /** 0..1 davranış insanlık skoru (varsa). */
  behaviorScore?: number;
  /** 0..1 IP itibarı (yüksek=temiz). */
  ipReputation?: number;
  /** Headless tarayıcı tespit edildi mi. */
  headless?: boolean;
  /** TLS/UA uyumsuzluğu. */
  tlsMismatch?: boolean;
  /** 0..1 header anomali skoru. */
  headerAnomali?: number;
  /** Bilinen AI ajanı mı (ai-agents kataloğundan). */
  aiAjan?: boolean;
  /** Dakikadaki istek hızı (varsa). */
  rate?: number;
  /** İstenen yol (path tabanlı ipuçları için). */
  path?: string;
}

export interface SiniflandirmaSonucu {
  /** Baskın (en yüksek olasılıklı) sınıf. */
  sinif: BotClass;
  /** Her sınıf için 0..1 olasılık (toplam ~1). */
  olasiliklar: Record<BotClass, number>;
  /** Baskın sınıfın olasılığı = model güveni (0..1). */
  guven: number;
  /** İnsan mı (human sınıfı baskın ve güven yeterli). */
  insanMi: boolean;
  /** Karara en çok katkıda bulunan özellikler (açıklanabilirlik). */
  katkilar: { ozellik: string; agirlik: number; sinif: BotClass }[];
}

const SINIFLAR: BotClass[] = [
  "human", "good_bot", "automation", "scraper", "credential_stuffing", "ai_agent", "ddos", "spam",
];

/** UA imzasından ham sınıf ipuçları (skor katkıları). */
function uaSinyalleri(ua: string): Partial<Record<BotClass, number>> {
  const u = ua.toLowerCase();
  const s: Partial<Record<BotClass, number>> = {};
  if (/gptbot|claudebot|perplexity|bytespider|ccbot|amazonbot|google-extended|meta-external|cohere|oai-searchbot|chatgpt-user|ai-agent/.test(u)) s.ai_agent = 3.2;
  if (/googlebot|bingbot|duckduckbot|yandexbot|applebot/.test(u)) s.good_bot = 3.0;
  if (/python|curl|go-http|node-fetch|axios|wget|java|okhttp|libwww|ruby/.test(u)) s.automation = 2.4;
  if (/scrapy|headless|puppeteer|playwright|phantom|selenium/.test(u)) s.scraper = 2.2;
  if (/mozilla.*(chrome|safari|firefox)/.test(u) && !/headless|bot|crawl/.test(u)) s.human = 1.6;
  return s;
}

/**
 * Ana sınıflandırıcı. Sinyalleri ağırlıklı ensemble ile birleştirir,
 * softmax-benzeri normalizasyonla olasılık dağılımı üretir.
 */
export function botSiniflandir(g: SiniflandirmaGirdisi): SiniflandirmaSonucu {
  // Her sınıf için ham logit skoru (0 taban).
  const skor: Record<BotClass, number> = Object.fromEntries(
    SINIFLAR.map((c) => [c, 0]),
  ) as Record<BotClass, number>;
  const katkilar: { ozellik: string; agirlik: number; sinif: BotClass }[] = [];
  const ekle = (sinif: BotClass, agirlik: number, ozellik: string) => {
    skor[sinif] += agirlik;
    if (agirlik >= 1) katkilar.push({ ozellik, agirlik: Number(agirlik.toFixed(1)), sinif });
  };

  // 1) UA imzaları
  for (const [c, w] of Object.entries(uaSinyalleri(g.ua))) ekle(c as BotClass, w!, "UA imzası");

  // 2) AI ajan tespiti (kesin sinyal)
  if (g.aiAjan) ekle("ai_agent", 3.5, "Bilinen AI ajanı");

  // 3) Fingerprint sinyalleri
  if (g.headless) { ekle("scraper", 1.8, "Headless tarayıcı"); ekle("automation", 1.2, "Headless tarayıcı"); }
  if (g.tlsMismatch) { ekle("automation", 2.0, "TLS/UA uyumsuz"); ekle("credential_stuffing", 0.8, "TLS/UA uyumsuz"); }
  if (typeof g.headerAnomali === "number" && g.headerAnomali >= 0.5) ekle("automation", 1.5 * g.headerAnomali, "Header anomalisi");

  // 4) Davranış skoru (düşük = bot)
  if (typeof g.behaviorScore === "number") {
    if (g.behaviorScore >= 0.7) ekle("human", 2.2 * g.behaviorScore, "İnsansı davranış");
    else if (g.behaviorScore < 0.3) {
      ekle("automation", 1.6, "Bot-benzeri davranış");
      ekle("credential_stuffing", 0.8, "Bot-benzeri davranış");
    }
  }

  // 5) IP itibarı (düşük = kötü ün)
  if (typeof g.ipReputation === "number") {
    if (g.ipReputation < 0.3) {
      ekle("credential_stuffing", 1.4, "Kötü ün IP");
      ekle("ddos", 1.0, "Kötü ün IP");
      ekle("spam", 0.8, "Kötü ün IP");
    } else if (g.ipReputation >= 0.8) ekle("human", 1.0, "Temiz IP");
  }

  // 6) İstek hızı (yüksek = DDoS/flood) — flood en belirgin sinyaldir.
  if (typeof g.rate === "number") {
    if (g.rate > 120) ekle("ddos", 4.5, "Aşırı istek hızı (flood)");
    else if (g.rate > 40) ekle("automation", 1.2, "Yüksek istek hızı");
  }

  // 7) Yol ipuçları — kimlik yolu + kötü IP birlikte kimlik-doldurma sinyali.
  if (g.path) {
    if (/\/login|\/signin|\/auth/.test(g.path)) {
      ekle("credential_stuffing", 2.2, "Kimlik yolu hedefi");
      // düşük itibar + kimlik yolu = güçlü kimlik-doldurma sinyali
      if (typeof g.ipReputation === "number" && g.ipReputation < 0.4) ekle("credential_stuffing", 1.6, "Kötü IP + kimlik yolu");
    }
    if (/\/api\/|\/graphql|\/products/.test(g.path)) ekle("scraper", 1.2, "API/veri yolu hedefi");
    if (/\/register|\/comment|\/review/.test(g.path)) ekle("spam", 1.2, "Kayıt/içerik yolu");
  }

  // Hiç sinyal yoksa nötr insan varsayımı (düşük güven).
  if (SINIFLAR.every((c) => skor[c] === 0)) skor.human = 0.5;

  // Softmax-benzeri normalizasyon (sıcaklık ile yumuşatılmış).
  const T = 1.6;
  const expler = SINIFLAR.map((c) => Math.exp(skor[c] / T));
  const toplam = expler.reduce((a, b) => a + b, 0) || 1;
  const olasiliklar = Object.fromEntries(
    SINIFLAR.map((c, i) => [c, expler[i] / toplam]),
  ) as Record<BotClass, number>;

  // Baskın sınıf + güven.
  let sinif: BotClass = "human";
  let guven = 0;
  for (const c of SINIFLAR) {
    if (olasiliklar[c] > guven) { guven = olasiliklar[c]; sinif = c; }
  }

  // En etkili katkıları öne sırala.
  katkilar.sort((a, b) => b.agirlik - a.agirlik);

  return {
    sinif,
    olasiliklar,
    guven: Number(guven.toFixed(3)),
    insanMi: sinif === "human" && guven >= 0.35,
    katkilar: katkilar.slice(0, 6),
  };
}
