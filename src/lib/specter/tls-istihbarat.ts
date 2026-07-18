/**
 * Specter — JA3/JA4 TLS Parmak İzi İstihbaratı
 * ============================================
 * User-Agent kolayca sahtelenir; ama TLS el sıkışması (ClientHello) istemcinin
 * GERÇEK kütüphanesini ele verir. JA3/JA4, bu el sıkışmasının parmak izidir:
 * Python-requests, curl, Go-http, headless Chrome, gerçek Chrome — her birinin
 * kendine has JA3'ü vardır. Bu modül gözlemlenen JA3'leri KÜMELER ve her kümeyi
 * sınıflandırır (gerçek tarayıcı / araç / headless / AI / sahte), en tehlikeli
 * sinyali de yakalar: **UA tarayıcı der ama JA3 araç** (tlsUaUyumsuz).
 *
 * Saf/deterministik: Date.now/Math.random YOK. Olaydaki ja3/engine/tlsUaUyumsuz
 * alanları fingerprint motorundan gelir (gerçek üründe TLS analizinden).
 */
import type { BotEvent } from "@/lib/db/schema";

export type TlsSinif = "tarayici" | "arac" | "headless" | "ai" | "sahte" | "bilinmiyor";

export interface Ja3Kume {
  ja3: string;
  sinif: TlsSinif;
  /** Sınıf açıklaması. */
  aciklama: string;
  toplam: number;
  benzersizIp: number;
  ulkeler: string[];
  engellenen: number;
  /** Baskın motor (Blink/WebKit/Gecko/None...). */
  engine: string;
  /** Bu JA3'te UA ile TLS uyuşmuyor mu (sahtekârlık). */
  uyumsuz: boolean;
  ornekUa: string;
  tehditSkoru: number;
  /** Örnek IP'ler. */
  ornekIpler: string[];
}

/** Bilinen gerçek tarayıcı JA3'leri (fingerprint.ts ile aynı temsili sabitler). */
const BILINEN_TARAYICI: Record<string, string> = {
  cd08e31494f9531f560d64c695473da9: "Chrome / Blink",
  b32309a26951912be7dba376398abc3b: "Safari / WebKit",
  b20b44b18b853ef29ab773e921b03422: "Firefox / Gecko",
};

const KOTU = new Set(["scraper", "credential_stuffing", "automation", "ai_agent", "ddos", "spam"]);

/** Bir olay kümesinden TLS sınıfı türet (engine + UA + botClass sinyalleri). */
function siniflandir(olaylar: BotEvent[]): { sinif: TlsSinif; aciklama: string } {
  const ilk = olaylar[0];
  const engine = (ilk.engine || "").toLowerCase();
  const uyumsuz = olaylar.some((e) => e.tlsUaUyumsuz);

  if (BILINEN_TARAYICI[ilk.ja3 || ""]) {
    return { sinif: "tarayici", aciklama: `Bilinen gerçek tarayıcı imzası (${BILINEN_TARAYICI[ilk.ja3!]}).` };
  }
  if (uyumsuz) {
    return { sinif: "sahte", aciklama: "UA bir tarayıcı iddia ediyor ama JA3 araç imzası — sahte tarayıcı." };
  }
  if (engine.includes("headless")) {
    return { sinif: "headless", aciklama: "Headless tarayıcı TLS imzası (Puppeteer/Playwright/Selenium)." };
  }
  if (engine.includes("crawler") || olaylar.some((e) => e.botClass === "ai_agent")) {
    return { sinif: "ai", aciklama: "İlan edilmiş AI ajan/crawler TLS deseni." };
  }
  if (engine === "none" || olaylar.some((e) => /python|curl|go-http|node|axios|scrapy|wget|java|okhttp/.test((e.ua || "").toLowerCase()))) {
    return { sinif: "arac", aciklama: "Tarayıcı olmayan HTTP kütüphanesi TLS imzası (Python/curl/Go...)." };
  }
  return { sinif: "bilinmiyor", aciklama: "Sınıflandırılamayan TLS imzası." };
}

export interface TlsSonuc {
  kumeler: Ja3Kume[];
  ozet: {
    toplamJa3: number;
    tarayiciJa3: number;
    aracJa3: number;
    sahteJa3: number;
    uyumsuzOlay: number; // TLS/UA uyumsuz toplam olay
    sahteOran: number; // sahte+araç oranı
  };
}

export function tlsIstihbarat(events: BotEvent[]): TlsSonuc {
  // ja3 → olaylar (ja3 olmayan olayları atla).
  const ja3Olay = new Map<string, BotEvent[]>();
  for (const e of events) {
    if (!e.ja3) continue;
    (ja3Olay.get(e.ja3) ?? ja3Olay.set(e.ja3, []).get(e.ja3)!).push(e);
  }

  const kumeler: Ja3Kume[] = [];
  let uyumsuzOlay = 0;

  for (const [ja3, olaylar] of ja3Olay) {
    const { sinif, aciklama } = siniflandir(olaylar);
    const ipler = [...new Set(olaylar.map((e) => e.ip))];
    const ulkeler = [...new Set(olaylar.map((e) => e.country))];
    const engellenen = olaylar.filter((e) => e.verdict === "blocked" || e.verdict === "challenged").length;
    const uyumsuz = olaylar.some((e) => e.tlsUaUyumsuz);
    if (uyumsuz) uyumsuzOlay += olaylar.filter((e) => e.tlsUaUyumsuz).length;
    const kotuOran = olaylar.filter((e) => KOTU.has(e.botClass)).length / olaylar.length;

    // Tehdit: sahte>araç>headless>ai>tarayıcı; + engel oranı + kötü oran.
    const sinifTaban: Record<TlsSinif, number> = { sahte: 55, arac: 45, headless: 35, ai: 20, bilinmiyor: 25, tarayici: 3 };
    const tehditSkoru = Math.min(100, Math.round(sinifTaban[sinif] + kotuOran * 25 + (engellenen / olaylar.length) * 15));

    kumeler.push({
      ja3, sinif, aciklama,
      toplam: olaylar.length, benzersizIp: ipler.length, ulkeler,
      engellenen, engine: olaylar[0].engine || "—", uyumsuz,
      ornekUa: olaylar[0].ua, tehditSkoru,
      ornekIpler: ipler.slice(0, 5),
    });
  }

  kumeler.sort((a, b) => b.tehditSkoru - a.tehditSkoru || b.toplam - a.toplam);

  const tarayiciJa3 = kumeler.filter((k) => k.sinif === "tarayici").length;
  const aracJa3 = kumeler.filter((k) => k.sinif === "arac").length;
  const sahteJa3 = kumeler.filter((k) => k.sinif === "sahte").length;
  const kotuKume = kumeler.filter((k) => k.sinif === "sahte" || k.sinif === "arac").length;

  return {
    kumeler,
    ozet: {
      toplamJa3: kumeler.length,
      tarayiciJa3, aracJa3, sahteJa3,
      uyumsuzOlay,
      sahteOran: kumeler.length ? Math.round((kotuKume / kumeler.length) * 100) : 0,
    },
  };
}

export const TLS_SINIF_ETIKET: Record<TlsSinif, string> = {
  tarayici: "Gerçek tarayıcı", arac: "HTTP aracı", headless: "Headless", ai: "AI ajan", sahte: "Sahte tarayıcı", bilinmiyor: "Bilinmiyor",
};
export const TLS_SINIF_RENK: Record<TlsSinif, string> = {
  tarayici: "#16a34a", arac: "#dc2626", headless: "#d97706", ai: "#0891b2", sahte: "#db2777", bilinmiyor: "#6b6a63",
};
