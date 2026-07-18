/**
 * İstekten bot-olay meta verisi çıkarır (IP, UA, coğrafya tahmini).
 * Gerçekte CDN header'ları (cf-ipcountry vb.) kullanılır; burada makul
 * bir yaklaşım + deterministik fallback.
 */
import type { BotClass } from "@/lib/db/schema";

export function extractMeta(req: Request): {
  ip: string;
  ua: string;
  country: string;
  asn: string;
  path: string;
  method: string;
} {
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
  return { ip, ua, country, asn, path, method: req.method };
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
