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
  /**
   * GERÇEK ÇAPRAZ-DOĞRULAMA: UA string'indeki OS ile Client Hints
   * `sec-ch-ua-platform` header'ı ÇELİŞİYOR mu? Gerçek Chrome ikisini de tutarlı
   * gönderir (UA "Windows NT" → platform "Windows"). Bot UA'yı taklit edip
   * Client Hints platformunu unutur/yanlış verirse burada yakalanır. Header
   * değeri sunucunun GÖRDÜĞÜ ham veridir — UA gibi kolay uydurulamaz (iki ayrı
   * yeri tutarlı yalanlamak gerekir). true = tutarsız (sahte sinyali).
   */
  platformCeliskisi: boolean;
  /**
   * MOBİL ÇELİŞKİSİ: UA "mobil cihaz" (iPhone/Android/Mobile) diyor ama Client
   * Hints `sec-ch-ua-mobile: ?0` (masaüstü) — veya tersi. Gerçek tarayıcı ikisini
   * tutarlı gönderir. true = tutarsız (sahte sinyali).
   */
  mobilCeliskisi: boolean;
  /**
   * Sec-Fetch-* metadata header'ları var mı? Gerçek tarayıcının fetch/XHR'ı
   * (widget'ın doğrulama çağrısı dahil) Sec-Fetch-Mode/Site/Dest gönderir;
   * curl/python/basit HTTP botları göndermez. Chromium iddiası + bunların
   * yokluğu ek bot kanıtıdır (tek başına değil — bazı proxy'ler düşürebilir).
   */
  secFetchVar: boolean;
}

/** UA'daki OS ailesini kaba çıkar (windows/mac/linux/android/ios/?). */
function uaPlatform(u: string): string {
  if (u.includes("windows")) return "windows";
  if (u.includes("android")) return "android"; // android'i mac/linux'tan önce
  if (u.includes("iphone") || u.includes("ipad") || u.includes("ios")) return "ios";
  if (u.includes("mac os") || u.includes("macintosh")) return "mac";
  if (u.includes("cros")) return "chromeos";
  if (u.includes("linux")) return "linux";
  return "?";
}

/** sec-ch-ua-platform değerini normalize et ("Windows" → windows). */
function chPlatform(v: string): string {
  const s = v.replace(/"/g, "").trim().toLowerCase();
  if (s.includes("windows")) return "windows";
  if (s.includes("android")) return "android";
  if (s === "macos" || s.includes("mac")) return "mac";
  if (s.includes("ios")) return "ios";
  if (s.includes("chrome os") || s.includes("chromeos")) return "chromeos";
  if (s.includes("linux")) return "linux";
  return "?";
}

function headerSinyalCikar(h: Headers, ua: string): HeaderSinyal {
  const u = ua.toLowerCase();
  const accept = h.get("accept") || "";
  const chPlatformHam = h.get("sec-ch-ua-platform") || "";
  const uaPl = uaPlatform(u);
  const chPl = chPlatform(chPlatformHam);
  // Her ikisi de bilinen bir platforma çözülüyor VE farklılarsa → çelişki.
  // "?" (bilinmeyen) veya boş → çelişki sayma (yanlış-pozitif önleme).
  const platformCeliskisi = !!chPlatformHam && uaPl !== "?" && chPl !== "?" && uaPl !== chPl;
  // Mobil çelişkisi: sec-ch-ua-mobile "?1"=mobil, "?0"=masaüstü. UA mobil-cihaz
  // işareti taşıyor mu? İkisi çelişirse → sahte. Header yoksa sayma.
  const chMobilHam = h.get("sec-ch-ua-mobile") || "";
  const uaMobil = /iphone|ipad|android|mobile|windows phone/.test(u);
  const mobilCeliskisi =
    (chMobilHam === "?1" && !uaMobil && uaPl !== "?") || // CH mobil ama UA masaüstü
    (chMobilHam === "?0" && uaMobil);                     // CH masaüstü ama UA mobil
  return {
    clientHintsVar: !!(h.get("sec-ch-ua") || h.get("sec-ch-ua-platform")),
    acceptLanguageVar: !!h.get("accept-language"),
    acceptTarayiciBenzeri: accept.includes("text/html") || accept.includes("*/*"),
    // Chromium ailesi (Client Hints gönderir) ama headless/tool DEĞİL.
    uaChromiumIddiasi:
      (u.includes("chrome") || u.includes("edg/")) &&
      !u.includes("headless") &&
      !/python|curl|go-http|node-fetch|axios|scrapy|wget|okhttp|libwww/.test(u),
    platformCeliskisi,
    mobilCeliskisi,
    secFetchVar: !!(h.get("sec-fetch-mode") || h.get("sec-fetch-site") || h.get("sec-fetch-dest")),
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
  // PLATFORM/MOBİL ÇELİŞKİSİ tek başına güçlü kanıttır (UA "Windows" ama Client
  // Hints platform "Linux"; ya da UA "iPhone" ama sec-ch-ua-mobile "?0") —
  // Chromium iddiası olmasa bile geçerli: iki ayrı ham header'ı tutarlı
  // yalanlamayı beceremeyen bir bot burada yakalanır. Gerçek çapraz-doğrulama,
  // düşük yanlış-pozitif (yalnızca ikisi de bilinen+farklı).
  if (s.platformCeliskisi || s.mobilCeliskisi) return true;
  if (!s.uaChromiumIddiasi) return false; // gerisi yalnızca Chromium-iddiası için
  // Tarayıcı-benzeri Accept HİÇ yoksa (text/html de */* de değil) tek başına güçlü.
  if (!s.acceptTarayiciBenzeri && !s.acceptLanguageVar) return true;
  // Chromium iddiası + Client Hints YOK + Sec-Fetch YOK → çok güçlü tool sinyali
  // (gerçek Chromium fetch'i her ikisini de gönderir; curl/python hiçbirini).
  if (!s.clientHintsVar && !s.secFetchVar) return true;
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
