/**
 * Specter — Cihaz Parmak İzi İstihbaratı
 * =======================================
 * Bir isteğin User-Agent + bot sınıfından gerçekçi bir TLS/tarayıcı parmak
 * izi profili türetir. Gerçek bir bot-tespit motorunun ürettiği sinyalleri
 * (JA3/JA4, HTTP sürümü, headless bayrağı, TLS-UA uyumsuzluğu, header
 * anomalisi) taklit eder — bunlar olay detayında derinlemesine gösterilir.
 *
 * NOT: Değerler deterministiktir (aynı UA+ip → aynı parmak izi), böylece
 * aynı bot tutarlı bir imza taşır. Gerçek üründe bu veriler TLS el sıkışma
 * ve HTTP/2 çerçeve analizinden gelir; burada onları modelliyoruz.
 */

export interface FingerprintProfil {
  ja3: string;
  ja4: string;
  httpVersion: string;
  headless: boolean;
  automationFlags: string[];
  tlsUaUyumsuz: boolean;
  engine: string;
  headerAnomali: number; // 0..1
  sinyaller: string[];
}

/** Basit deterministik hash (string → 32-bit). */
function hash32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function hexHash(s: string, len: number): string {
  let out = "";
  let h = hash32(s);
  while (out.length < len) {
    h = Math.imul(h ^ (h >>> 13), 0x5bd1e995) >>> 0;
    out += h.toString(16).padStart(8, "0");
  }
  return out.slice(0, len);
}

// Bilinen gerçek tarayıcıların yaklaşık JA3'leri (temsili sabitler).
const TARAYICI_JA3: Record<string, string> = {
  chrome: "cd08e31494f9531f560d64c695473da9",
  safari: "b32309a26951912be7dba376398abc3b",
  firefox: "b20b44b18b853ef29ab773e921b03422",
};

/**
 * UA + botClass + ip'den parmak izi profili türet.
 */
export function fingerprintUret(ua: string, botClass: string, ip: string): FingerprintProfil {
  const u = (ua || "").toLowerCase();
  const seed = ua + "|" + ip;
  const sinyaller: string[] = [];
  const automationFlags: string[] = [];

  const isChrome = u.includes("chrome") && !u.includes("headless");
  const isSafari = u.includes("safari") && !u.includes("chrome");
  const isFirefox = u.includes("firefox");
  const isHeadless = u.includes("headless") || u.includes("playwright") || u.includes("puppeteer") || u.includes("phantom") || botClass === "ai_agent" && u.includes("browser-use");
  const isTool = /python|curl|go-http|node-fetch|axios|scrapy|wget|java|okhttp|libwww/.test(u);
  const isAiCrawler = /gptbot|claudebot|perplexity|bytespider|ccbot|amazonbot|google-extended|meta-external|cohere|oai-searchbot|chatgpt-user/.test(u);

  let engine = "Blink";
  let httpVersion = "h2";
  let ja3: string;
  let tlsUaUyumsuz = false;
  let headerAnomali = 0.05;

  if (isTool) {
    // HTTP kütüphanesi: tarayıcı değil. TLS parmak izi araç imzası taşır.
    engine = "None";
    httpVersion = u.includes("go-http") ? "h2" : "http/1.1";
    ja3 = hexHash("tool:" + seed, 32);
    tlsUaUyumsuz = u.includes("mozilla"); // UA tarayıcı taklidi ama TLS araç
    headerAnomali = 0.55 + (hash32(seed) % 40) / 100;
    sinyaller.push("Tarayıcı olmayan TLS imzası (HTTP kütüphanesi)");
    if (tlsUaUyumsuz) sinyaller.push("UA tarayıcı iddiasında ama TLS parmak izi uyuşmuyor");
    automationFlags.push("no-js-engine");
  } else if (isHeadless) {
    engine = "Blink (headless)";
    httpVersion = "h2";
    ja3 = hexHash("headless:" + seed, 32);
    tlsUaUyumsuz = false;
    headerAnomali = 0.4 + (hash32(seed) % 35) / 100;
    sinyaller.push("Headless tarayıcı imzası tespit edildi");
    sinyaller.push("navigator.webdriver = true");
    automationFlags.push("webdriver", "cdp-detected", "no-plugins");
  } else if (isAiCrawler) {
    engine = "None (crawler)";
    httpVersion = "h2";
    ja3 = hexHash("ai:" + seed, 32);
    headerAnomali = 0.25 + (hash32(seed) % 20) / 100;
    sinyaller.push("İlan edilmiş AI ajan User-Agent");
    sinyaller.push("Robots-uyumlu tarama deseni");
  } else if (isChrome) {
    engine = "Blink";
    ja3 = TARAYICI_JA3.chrome;
    sinyaller.push("Tutarlı Chrome/Blink TLS parmak izi");
  } else if (isSafari) {
    engine = "WebKit";
    ja3 = TARAYICI_JA3.safari;
    sinyaller.push("Tutarlı Safari/WebKit TLS parmak izi");
  } else if (isFirefox) {
    engine = "Gecko";
    ja3 = TARAYICI_JA3.firefox;
    sinyaller.push("Tutarlı Firefox/Gecko TLS parmak izi");
  } else {
    engine = "Bilinmiyor";
    ja3 = hexHash("unknown:" + seed, 32);
    headerAnomali = 0.3;
    sinyaller.push("Sınıflandırılamayan istemci imzası");
  }

  // Bot sınıfına göre ek sinyaller
  if (botClass === "credential_stuffing") sinyaller.push("Yüksek frekanslı kimlik denemesi deseni");
  if (botClass === "ddos") sinyaller.push("Anormal istek hızı (flood)");
  if (botClass === "scraper") sinyaller.push("Sıralı sayfa gezinme (kazıma deseni)");

  const ja4 = engine === "None" || engine.includes("headless")
    ? "t13d" + hexHash("ja4:" + seed, 8) + "_" + hexHash("b:" + seed, 12)
    : "t13d1516h2_" + hexHash("ja4b:" + seed, 12) + "_" + hexHash("ja4c:" + seed, 12);

  return {
    ja3,
    ja4,
    httpVersion,
    headless: isHeadless,
    automationFlags,
    tlsUaUyumsuz,
    engine,
    headerAnomali: Math.min(1, Number(headerAnomali.toFixed(2))),
    sinyaller,
  };
}
