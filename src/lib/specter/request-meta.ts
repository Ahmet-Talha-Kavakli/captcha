/**
 * İstekten bot-olay meta verisi çıkarır (IP, UA, coğrafya tahmini).
 * Gerçekte CDN header'ları (cf-ipcountry vb.) kullanılır; burada makul
 * bir yaklaşım + deterministik fallback.
 */
import type { BotClass } from "@/lib/db/schema";

export interface RequestMeta {
  ip: string;
  ua: string;
  country: string;
  asn: string;
  path: string;
  method: string;
  /** GERÇEK sunucu-tarafı HTTP başlık sinyalleri (UA-taklidine bağışık). */
  headerSinyal: HeaderSinyal;
}

/**
 * İstemcinin YALANLAYAMADIĞI gerçek başlık sinyalleri. UA string'i saniyede
 * taklit edilebilir ama gerçek tarayıcılar HER İSTEKTE tutarlı bir başlık SETİ
 * gönderir (Accept, Accept-Language, ve Chrome/Edge için Client Hints sec-ch-ua).
 * Bu setin YOKLUĞU, UA "Chrome/Edge" iddia ederken, güçlü otomasyon kanıtıdır.
 */
export interface HeaderSinyal {
  /** sec-ch-ua (Client Hints) mevcut mu? Chromium tarayıcılar gönderir. */
  clientHintsVar: boolean;
  /** Accept-Language mevcut mu? Gerçek tarayıcı daima gönderir; çoğu bot atlar. */
  acceptLanguageVar: boolean;
  /** Accept mevcut ve tarayıcı-benzeri mi (text/html içerir)? */
  acceptTarayiciBenzeri: boolean;
  /** UA Chromium (Chrome/Edge, headless değil) iddia ediyor mu? */
  uaChromiumIddiasi: boolean;
}

function headerSinyalCikar(h: Headers, ua: string): HeaderSinyal {
  const u = ua.toLowerCase();
  const accept = h.get("accept") || "";
  return {
    clientHintsVar: !!(h.get("sec-ch-ua") || h.get("sec-ch-ua-platform")),
    acceptLanguageVar: !!h.get("accept-language"),
    acceptTarayiciBenzeri: accept.includes("text/html") || accept.includes("*/*"),
    // Chromium ailesi (Client Hints gönderir) ama headless/tool DEĞİL.
    uaChromiumIddiasi:
      (u.includes("chrome") || u.includes("edg/")) &&
      !u.includes("headless") &&
      !/python|curl|go-http|node-fetch|axios|scrapy|wget|okhttp|libwww/.test(u),
  };
}

export function extractMeta(req: Request): RequestMeta {
  const h = req.headers;
  const ip =
    h.get("x-forwarded-for")?.split(",")[0].trim() ||
    h.get("x-real-ip") ||
    "127.0.0.1";
  const ua = (h.get("user-agent") || "unknown").slice(0, 120);
  const country = h.get("cf-ipcountry") || h.get("x-vercel-ip-country") || "TR";
  const asn = h.get("x-asn") || "AS0 Unknown";
  let path = "/";
  try {
    path = new URL(req.url).pathname;
  } catch {
    /* yok */
  }
  return { ip, ua, country, asn, path, method: req.method, headerSinyal: headerSinyalCikar(h, ua) };
}

/**
 * GERÇEK başlık-tabanlı otomasyon kanıtı (UA-taklidine bağışık). UA "Chrome/Edge"
 * iddia ediyor AMA gerçek tarayıcının HER İSTEKTE gönderdiği temel başlıklar
 * eksikse → UA sahtekârlığı.
 *
 * YANLIŞ-POZİTİF KORUMASI (kritik — meşru kullanıcıyı bloklamamak): İki koşuldan
 * BİRİ değil, İKİSİ birden gereklidir:
 *   1) Accept-Language YOK  — gerçek tarayıcı bunu HTTP'de bile daima gönderir;
 *      neredeyse tüm botlar/HTTP kütüphaneleri atlar. Güçlü, protokolden bağımsız.
 *   2) Client Hints (sec-ch-ua) YOK — Chromium ≥ 89 HTTPS'de daima gönderir.
 *      TEK BAŞINA yetersiz: HTTP/localhost/bazı proxy'lerde meşru olarak eksik
 *      olabilir; o yüzden ancak Accept-Language DA eksikse kanıt sayılır.
 * Böylece "gerçek Chrome ama Client Hints proxy'de düşmüş" senaryosu bloklanmaz;
 * yalnızca hem dil hem Client Hints eksik olan (belirgin bot) yakalanır.
 * Tarayıcı iddia etmeyen istemciler (curl vb.) DEĞERLENDİRİLMEZ — ayrı UA/TLS
 * sinyalleri onları zaten yakalar.
 */
export function baslikSahtekarligi(s: HeaderSinyal): boolean {
  if (!s.uaChromiumIddiasi) return false; // yalnızca Chromium-iddiası olanları denetle
  // Tarayıcı-benzeri Accept HİÇ yoksa (text/html de */* de değil) tek başına güçlü.
  if (!s.acceptTarayiciBenzeri && !s.acceptLanguageVar) return true;
  // Aksi halde: hem Accept-Language HEM Client Hints eksikse (ikisi birden).
  return !s.acceptLanguageVar && !s.clientHintsVar;
}

/** UA'dan kaba bot sınıfı tahmini (canlı olaylar için etiketleme). */
export function classifyUA(ua: string): BotClass {
  const u = ua.toLowerCase();
  if (u.includes("gptbot") || u.includes("claudebot") || u.includes("ai-agent")) return "ai_agent";
  if (u.includes("googlebot") || u.includes("bingbot")) return "good_bot";
  if (u.includes("python") || u.includes("curl") || u.includes("go-http") || u.includes("node-fetch") || u.includes("axios")) return "automation";
  if (u.includes("scrapy") || u.includes("headless")) return "scraper";
  return "human";
}
