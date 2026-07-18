/**
 * Specter — Saldırı İmza Kütüphanesi & YARA-benzeri Kural Derleyici
 * ================================================================
 * Antivirüs dünyasındaki YARA gibi, Specter de saldırıları İMZALARLA tanır: bir
 * imza, bir olayın alanları üzerinde çoklu koşuldan (ve/veya bir eşik) oluşan bir
 * desendir. Bu modül (1) hazır bir imza kütüphanesi, (2) basit bir imza-DSL
 * derleyicisi (`condition: botClass == "scraper" and score < 0.3`) ve (3) imzaları
 * gerçek olaylara karşı eşleştiren bir tarayıcı sağlar.
 *
 * DSL örneği:
 *   ua contains "python" and tls == true
 *   botClass == "ai_agent" or ua contains "gptbot"
 *   score < 0.2 and country in "RU,CN,IR"
 *
 * Saf/deterministik: Date.now/Math.random YOK.
 */
import type { BotEvent } from "@/lib/db/schema";

export type ImzaOp = "==" | "!=" | "contains" | "<" | ">" | "in";

export interface ImzaKosul {
  alan: string;
  op: ImzaOp;
  deger: string;
}

export interface Imza {
  id: string;
  ad: string;
  aciklama: string;
  kategori: "arac" | "kimlik" | "ai" | "kazima" | "ddos" | "atlatma";
  siddet: "dusuk" | "orta" | "yuksek" | "kritik";
  birlestir: "and" | "or";
  kosullar: ImzaKosul[];
  /** MITRE-benzeri etiket. */
  taktik: string;
}

/* ------------------------------------------------------- Hazır imza kütüphanesi */

export const IMZA_KUTUPHANESI: Imza[] = [
  {
    id: "SIG-TOOL-PY", ad: "Python HTTP kütüphanesi", kategori: "arac", siddet: "yuksek",
    aciklama: "python-requests/urllib gibi tarayıcı-olmayan istemci.", birlestir: "or",
    kosullar: [{ alan: "ua", op: "contains", deger: "python" }, { alan: "ua", op: "contains", deger: "urllib" }, { alan: "ua", op: "contains", deger: "aiohttp" }],
    taktik: "Otomatik erişim",
  },
  {
    id: "SIG-SPOOF-TLS", ad: "Sahte tarayıcı (TLS uyumsuz)", kategori: "atlatma", siddet: "kritik",
    aciklama: "UA tarayıcı der ama TLS parmak izi araç.", birlestir: "and",
    kosullar: [{ alan: "tls", op: "==", deger: "true" }],
    taktik: "Savunma atlatma",
  },
  {
    id: "SIG-HEADLESS", ad: "Headless tarayıcı", kategori: "arac", siddet: "yuksek",
    aciklama: "Puppeteer/Playwright/Selenium otomasyonu.", birlestir: "and",
    kosullar: [{ alan: "headless", op: "==", deger: "true" }],
    taktik: "Otomatik erişim",
  },
  {
    id: "SIG-CRED-STUFF", ad: "Kimlik doldurma", kategori: "kimlik", siddet: "kritik",
    aciklama: "Login yolunda düşük skorlu otomasyon.", birlestir: "and",
    kosullar: [{ alan: "path", op: "contains", deger: "login" }, { alan: "score", op: "<", deger: "0.35" }, { alan: "verdict", op: "!=", deger: "allowed" }],
    taktik: "Kimlik bilgisi erişimi",
  },
  {
    id: "SIG-AI-CRAWLER", ad: "AI ajan / crawler", kategori: "ai", siddet: "orta",
    aciklama: "İlan edilmiş veya tespit edilmiş AI botu.", birlestir: "or",
    kosullar: [{ alan: "botClass", op: "==", deger: "ai_agent" }, { alan: "ua", op: "contains", deger: "gptbot" }, { alan: "ua", op: "contains", deger: "claudebot" }, { alan: "ua", op: "contains", deger: "perplexity" }],
    taktik: "İçerik toplama",
  },
  {
    id: "SIG-SCRAPE-FAST", ad: "Hızlı kazıma", kategori: "kazima", siddet: "yuksek",
    aciklama: "Kazıyıcı sınıfı, yüksek anomali + düşük skor.", birlestir: "and",
    kosullar: [{ alan: "botClass", op: "==", deger: "scraper" }, { alan: "score", op: "<", deger: "0.3" }],
    taktik: "Veri çıkarma",
  },
  {
    id: "SIG-DDOS", ad: "DDoS deseni", kategori: "ddos", siddet: "kritik",
    aciklama: "DDoS sınıfı yüksek hacimli trafik.", birlestir: "and",
    kosullar: [{ alan: "botClass", op: "==", deger: "ddos" }],
    taktik: "Hizmet reddi",
  },
  {
    id: "SIG-GEO-HIGH", ad: "Yüksek-risk coğrafya + bot", kategori: "kazima", siddet: "orta",
    aciklama: "Riskli ülkeden düşük skorlu istek.", birlestir: "and",
    kosullar: [{ alan: "country", op: "in", deger: "RU,CN,IR,KP" }, { alan: "score", op: "<", deger: "0.4" }],
    taktik: "Keşif",
  },
];

/* ------------------------------------------------------- DSL derleyici */

export interface DerlemeSonuc {
  imza: Imza | null;
  hata: string | null;
}

/**
 * Basit imza-DSL'ini derler. Biçim: `<koşul> (and|or) <koşul> ...`
 * Koşul: `alan op değer` — değer tırnaklı olabilir.
 */
export function imzaDerle(ad: string, dsl: string): DerlemeSonuc {
  const s = dsl.trim();
  if (!s) return { imza: null, hata: "Boş kural." };

  // and/or ayır (baskın birleştirici).
  const birlestir: "and" | "or" = /\bor\b/i.test(s) && !/\band\b/i.test(s) ? "or" : "and";
  const parcalar = s.split(/\s+(?:and|or)\s+/i);
  const kosullar: ImzaKosul[] = [];

  for (const p of parcalar) {
    const m = p.trim().match(/^(\w+)\s*(==|!=|contains|in|<|>)\s*(.+)$/i);
    if (!m) return { imza: null, hata: `Ayrıştırılamayan koşul: "${p.trim()}"` };
    const alan = m[1].toLowerCase();
    const op = m[2].toLowerCase() as ImzaOp;
    const deger = m[3].trim().replace(/^["']|["']$/g, "");
    if (!GECERLI_ALAN.has(alan)) return { imza: null, hata: `Bilinmeyen alan: "${alan}"` };
    kosullar.push({ alan, op, deger });
  }

  return {
    imza: {
      id: `SIG-CUSTOM-${imzaHash(dsl)}`, ad: ad || "Özel imza",
      aciklama: "Kullanıcı tanımlı imza.", kategori: "kazima", siddet: "orta",
      birlestir, kosullar, taktik: "Özel",
    },
    hata: null,
  };
}

const GECERLI_ALAN = new Set(["ip", "country", "asn", "ua", "path", "method", "botclass", "verdict", "score", "latency", "headless", "tls", "engine"]);

function imzaHash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 0x01000193) >>> 0; }
  return h.toString(16).slice(0, 6);
}

/* ------------------------------------------------------- Eşleştirme */

function olayAlan(e: BotEvent, alan: string): string | number {
  switch (alan.toLowerCase()) {
    case "ip": return e.ip;
    case "country": return e.country;
    case "asn": return e.asn;
    case "ua": return e.ua;
    case "path": return e.path;
    case "method": return e.method;
    case "botclass": return e.botClass;
    case "verdict": return e.verdict;
    case "score": return e.score;
    case "latency": return e.latency;
    case "engine": return e.engine ?? "";
    case "headless": return e.headless ? "true" : "false";
    case "tls": return e.tlsUaUyumsuz ? "true" : "false";
    default: return "";
  }
}

function kosulEslesir(e: BotEvent, k: ImzaKosul): boolean {
  const val = olayAlan(e, k.alan);
  const d = k.deger;
  switch (k.op) {
    case "==": return String(val).toLowerCase() === d.toLowerCase();
    case "!=": return String(val).toLowerCase() !== d.toLowerCase();
    case "contains": return String(val).toLowerCase().includes(d.toLowerCase());
    case "<": return parseFloat(String(val)) < parseFloat(d);
    case ">": return parseFloat(String(val)) > parseFloat(d);
    case "in": return d.split(",").map((x) => x.trim().toLowerCase()).includes(String(val).toLowerCase());
  }
}

export function imzaEslesir(e: BotEvent, imza: Imza): boolean {
  if (imza.kosullar.length === 0) return false;
  return imza.birlestir === "or"
    ? imza.kosullar.some((k) => kosulEslesir(e, k))
    : imza.kosullar.every((k) => kosulEslesir(e, k));
}

export interface ImzaVurusu {
  imza: Imza;
  vurus: number;
  benzersizIp: number;
  ornekIpler: string[];
  ulkeler: string[];
}

export interface TaramaSonuc {
  vuruslar: ImzaVurusu[];
  toplamOlay: number;
  eslesenOlay: number;
  ozet: { toplamImza: number; tetiklenen: number; kritikVurus: number };
}

/** İmzaları olay kümesine karşı tarar. */
export function imzaTara(events: BotEvent[], imzalar: Imza[] = IMZA_KUTUPHANESI): TaramaSonuc {
  const vuruslar: ImzaVurusu[] = [];
  const eslesenSet = new Set<string>();

  for (const imza of imzalar) {
    const eslesen = events.filter((e) => imzaEslesir(e, imza));
    if (eslesen.length === 0) continue;
    for (const e of eslesen) eslesenSet.add(e.id);
    const ipler = [...new Set(eslesen.map((e) => e.ip))];
    vuruslar.push({
      imza, vurus: eslesen.length, benzersizIp: ipler.length,
      ornekIpler: ipler.slice(0, 5), ulkeler: [...new Set(eslesen.map((e) => e.country))].slice(0, 6),
    });
  }
  vuruslar.sort((a, b) => b.vurus - a.vurus);

  return {
    vuruslar,
    toplamOlay: events.length,
    eslesenOlay: eslesenSet.size,
    ozet: {
      toplamImza: imzalar.length,
      tetiklenen: vuruslar.length,
      kritikVurus: vuruslar.filter((v) => v.imza.siddet === "kritik").length,
    },
  };
}

export const KATEGORI_ETIKET: Record<Imza["kategori"], string> = {
  arac: "HTTP aracı", kimlik: "Kimlik", ai: "AI ajan", kazima: "Kazıma", ddos: "DDoS", atlatma: "Atlatma",
};
export const SIDDET_RENK: Record<Imza["siddet"], string> = {
  dusuk: "#65a30d", orta: "#d97706", yuksek: "#ea580c", kritik: "#dc2626",
};
