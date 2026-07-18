/**
 * Specter — Tehdit Avı Sorgu Motoru (Threat Hunt Query Engine)
 * ============================================================
 * SIEM-tarzı sorgulanabilir olay dili. Analist, ham olayları serbestçe sorgular:
 *   botClass:scraper AND country:RU
 *   score<0.3 AND path:/login
 *   verdict:blocked OR headless:true
 *   ua:python asn:datacenter
 *
 * Dil: `alan:değer` (içerir/eşittir), `alan>N` / `alan<N` (sayısal), tırnaklı
 * değerler, AND/OR (varsayılan AND). Serbest kelimeler ua+path+ip+asn'de aranır.
 * Saf/deterministik: Date.now/Math.random YOK.
 */
import type { BotEvent } from "@/lib/db/schema";

export type Op = "eq" | "contains" | "gt" | "lt" | "neq";

export interface Kosul {
  alan: string;
  op: Op;
  deger: string;
  /** Serbest kelime (alan yok) → çoklu alanda aranır. */
  serbest?: boolean;
}

export interface AyristirmaSonuc {
  kosullar: Kosul[];
  birlestir: "and" | "or";
  hata: string | null;
}

/** Sorgulanabilir alanlar (öneri + doğrulama). */
export const SORGU_ALANLARI = [
  "ip", "country", "asn", "ua", "path", "method", "botClass", "verdict", "score", "latency",
  "ja3", "headless", "engine", "fingerprint", "tls",
] as const;
/** küçük-harf alan adı → kanonik (camelCase) alan adı. Sorgu büyük/küçük duyarsız. */
const ALAN_KANONIK = new Map<string, string>(SORGU_ALANLARI.map((a) => [a.toLowerCase(), a]));
/** Bir token'ın geçerli alan olup olmadığını (case-insensitive) döner. */
function kanonikAlan(ad: string): string | null {
  return ALAN_KANONIK.get(ad.toLowerCase()) ?? null;
}

const SAYISAL = new Set(["score", "latency"]);

/** Sorgu dizesini koşullara ayrıştırır. */
export function sorguAyristir(sorgu: string): AyristirmaSonuc {
  const q = sorgu.trim();
  if (!q) return { kosullar: [], birlestir: "and", hata: null };

  // AND/OR birleştirme (baskın olan). Basit: OR geçiyorsa or.
  const birlestir: "and" | "or" = /\bOR\b/i.test(q) ? "or" : "and";

  // Token'lara böl: tırnaklı ifadeleri koru.
  const tokens = q.match(/"[^"]*"|\S+/g) ?? [];
  const kosullar: Kosul[] = [];

  for (const rawTok of tokens) {
    const tok = rawTok.trim();
    if (/^(AND|OR)$/i.test(tok)) continue;

    // alan>N / alan<N
    let m = tok.match(/^(\w+)\s*(>|<)\s*(.+)$/);
    let kanon = m ? kanonikAlan(m[1]) : null;
    if (m && kanon) {
      kosullar.push({ alan: kanon, op: m[2] === ">" ? "gt" : "lt", deger: m[3].replace(/"/g, "") });
      continue;
    }
    // alan!=değer
    m = tok.match(/^(\w+)\s*!=\s*(.+)$/);
    kanon = m ? kanonikAlan(m[1]) : null;
    if (m && kanon) {
      kosullar.push({ alan: kanon, op: "neq", deger: m[2].replace(/"/g, "") });
      continue;
    }
    // alan:değer
    m = tok.match(/^(\w+):(.+)$/);
    kanon = m ? kanonikAlan(m[1]) : null;
    if (m && kanon) {
      const deger = m[2].replace(/"/g, "");
      // Kesin-eşleşme alanları (enum): botClass/verdict/method → eq; metin → contains.
      const kesin = kanon === "botClass" || kanon === "verdict" || kanon === "method" || kanon === "headless" || kanon === "tls" || kanon === "country";
      kosullar.push({ alan: kanon, op: SAYISAL.has(kanon) ? "eq" : kesin ? "eq" : "contains", deger });
      continue;
    }
    // serbest kelime
    kosullar.push({ alan: "*", op: "contains", deger: tok.replace(/"/g, ""), serbest: true });
  }

  return { kosullar, birlestir, hata: null };
}

function alanDeger(e: BotEvent, alan: string): string | number {
  switch (alan) {
    case "ip": return e.ip;
    case "country": return e.country;
    case "asn": return e.asn;
    case "ua": return e.ua;
    case "path": return e.path;
    case "method": return e.method;
    case "botClass": return e.botClass;
    case "verdict": return e.verdict;
    case "score": return e.score;
    case "latency": return e.latency;
    case "ja3": return e.ja3 ?? "";
    case "engine": return e.engine ?? "";
    case "fingerprint": return e.fingerprint;
    case "headless": return e.headless ? "true" : "false";
    case "tls": return e.tlsUaUyumsuz ? "true" : "false";
    default: return "";
  }
}

function kosulEslesir(e: BotEvent, k: Kosul): boolean {
  if (k.serbest) {
    const hedef = `${e.ip} ${e.ua} ${e.path} ${e.asn} ${e.country} ${e.botClass}`.toLowerCase();
    return hedef.includes(k.deger.toLowerCase());
  }
  const val = alanDeger(e, k.alan);
  const dNum = parseFloat(k.deger);
  switch (k.op) {
    case "eq": return String(val).toLowerCase() === k.deger.toLowerCase();
    case "neq": return String(val).toLowerCase() !== k.deger.toLowerCase();
    case "contains": return String(val).toLowerCase().includes(k.deger.toLowerCase());
    case "gt": return typeof val === "number" ? val > dNum : parseFloat(String(val)) > dNum;
    case "lt": return typeof val === "number" ? val < dNum : parseFloat(String(val)) < dNum;
  }
}

export function olayEslesir(e: BotEvent, ayristir: AyristirmaSonuc): boolean {
  if (ayristir.kosullar.length === 0) return true;
  return ayristir.birlestir === "or"
    ? ayristir.kosullar.some((k) => kosulEslesir(e, k))
    : ayristir.kosullar.every((k) => kosulEslesir(e, k));
}

export interface AvSonuc {
  eslesmeler: BotEvent[];
  toplam: number;
  eslesme: number;
  /** Sonuç kümesi özeti (alan dağılımları). */
  ozet: {
    ulkeler: { ad: string; sayi: number }[];
    sinifis: { ad: string; sayi: number }[];
    kararlar: { ad: string; sayi: number }[];
    benzersizIp: number;
  };
}

/** Bir sorguyu olay kümesine karşı çalıştırır. */
export function tehditAvi(sorgu: string, events: BotEvent[], limit = 200): AvSonuc {
  const ayristir = sorguAyristir(sorgu);
  const eslesenler = events.filter((e) => olayEslesir(e, ayristir));

  const say = (fn: (e: BotEvent) => string) => {
    const m = new Map<string, number>();
    for (const e of eslesenler) { const k = fn(e); m.set(k, (m.get(k) || 0) + 1); }
    return [...m.entries()].map(([ad, sayi]) => ({ ad, sayi })).sort((a, b) => b.sayi - a.sayi).slice(0, 8);
  };

  return {
    eslesmeler: eslesenler.slice(0, limit),
    toplam: events.length,
    eslesme: eslesenler.length,
    ozet: {
      ulkeler: say((e) => e.country),
      sinifis: say((e) => e.botClass),
      kararlar: say((e) => e.verdict),
      benzersizIp: new Set(eslesenler.map((e) => e.ip)).size,
    },
  };
}

/** Hazır av şablonları (tek tıkla sorgu). */
export const AV_SABLONLARI: { ad: string; sorgu: string; aciklama: string }[] = [
  { ad: "Sahte tarayıcılar", sorgu: "tls:true", aciklama: "UA tarayıcı der ama TLS uyuşmuyor." },
  { ad: "Kimlik doldurma", sorgu: "botClass:credential_stuffing path:/login", aciklama: "Login'e kimlik doldurma." },
  { ad: "Düşük skorlu engellenen", sorgu: "score<0.3 verdict:blocked", aciklama: "Yüksek güvenle bot kabul edilip engellenenler." },
  { ad: "Headless botlar", sorgu: "headless:true", aciklama: "Puppeteer/Playwright imzaları." },
  { ad: "Python/araç trafiği", sorgu: "ua:python OR ua:curl OR ua:go-http", aciklama: "HTTP kütüphanesi istemcileri." },
  { ad: "AI ajanları", sorgu: "botClass:ai_agent", aciklama: "Tüm AI crawler trafiği." },
];
