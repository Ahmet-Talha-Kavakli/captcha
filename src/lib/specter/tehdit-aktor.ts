/**
 * Specter — Tehdit Aktör Profilleme & Atıf Motoru
 * ===============================================
 * "Bana kim saldırıyor?" — ham olayları saldırgan gruplarına ayırıp her grubu
 * TTP'lerine (Taktik/Teknik/Prosedür: bot sınıfı, ASN türü, coğrafya, hedef
 * yollar, zamanlama, araçlar) göre BİLİNEN tehdit-aktör arketiplerine ATFEDER.
 * Her atıf: aktör profili + güven skoru + eşleşen göstergeler (IOC).
 *
 * NOT: Aktör profilleri davranışsal arketiplerdir (gerçek APT isimleri değil) —
 * gözlemlenen TTP desenine göre sınıflandırma. Saf/deterministik.
 */
import type { BotEvent, BotClass } from "@/lib/db/schema";

export interface AktorProfil {
  id: string;
  ad: string;
  aciklama: string;
  /** Bu aktörün karakteristik TTP'leri. */
  ttp: string[];
  /** Baskın bot sınıfları. */
  siniflar: BotClass[];
  motivasyon: string;
  seviye: "fırsatçı" | "organize" | "gelişmiş";
}

/** Bilinen tehdit-aktör arketipleri (davranışsal). */
export const AKTOR_PROFILLERI: AktorProfil[] = [
  {
    id: "cred-syndicate", ad: "Kimlik Doldurma Şebekesi", aciklama: "Çalınmış kimlik listeleriyle hesap ele geçirmeye çalışan organize grup.",
    ttp: ["Login endpoint hedefleme", "Yüksek hız", "Botnet IP döndürme", "Düşük insanlık skoru"],
    siniflar: ["credential_stuffing"], motivasyon: "Finansal (hesap ele geçirme)", seviye: "organize",
  },
  {
    id: "scrape-farm", ad: "Kazıma Çiftliği", aciklama: "Ürün/fiyat/içerik verisini ticari amaçla toplayan dağıtık operasyon.",
    ttp: ["Datacenter ASN", "python/curl araçları", "API/ürün yolları", "Sistematik gezinme"],
    siniflar: ["scraper", "automation"], motivasyon: "Ticari (veri arbitrajı)", seviye: "organize",
  },
  {
    id: "ai-harvest", ad: "AI Toplama Operasyonu", aciklama: "İçeriği LLM eğitimi/RAG için toplayan AI ajanları.",
    ttp: ["İlan edilmiş AI UA", "Robots-saygılı desen", "Geniş içerik taraması", "Bulut ASN"],
    siniflar: ["ai_agent"], motivasyon: "Veri (model eğitimi)", seviye: "gelişmiş",
  },
  {
    id: "ddos-crew", ad: "DDoS Ekibi", aciklama: "Hizmeti aşırı yükle boğmaya çalışan hacimsel saldırgan.",
    ttp: ["Aşırı istek hacmi", "Çok-IP kaynak", "Düşük çeşitlilik yol", "Go/araç UA"],
    siniflar: ["ddos"], motivasyon: "Yıkıcı (kesinti/şantaj)", seviye: "organize",
  },
  {
    id: "spoof-evader", ad: "İmza Atlatıcı", aciklama: "TLS/UA taklidiyle tespiti atlatmaya çalışan gelişmiş saldırgan.",
    ttp: ["Sahte tarayıcı UA", "TLS/UA uyumsuz", "Headless tarayıcı", "Parmak izi rotasyonu"],
    siniflar: ["automation", "scraper"], motivasyon: "Değişken (gizli erişim)", seviye: "gelişmiş",
  },
  {
    id: "opportunist", ad: "Fırsatçı Tarayıcı", aciklama: "Belirli hedefi olmayan, otomatik tarama/istismar denemesi.",
    ttp: ["Düşük hacim", "Karışık yollar", "Bilinen tarayıcı imzaları"],
    siniflar: ["automation", "spam"], motivasyon: "Fırsatçı (geniş tarama)", seviye: "fırsatçı",
  },
];

const KOTU = new Set(["scraper", "credential_stuffing", "automation", "ai_agent", "ddos", "spam"]);
const DC_ANAHTAR = /digitalocean|amazon|aws|hetzner|ovh|linode|vultr|azure|google cloud|hosting|cloud|datacenter|vps|m247/i;

function hash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 0x01000193) >>> 0; }
  return h.toString(16).slice(0, 8);
}

export interface AktorAtif {
  id: string;
  profil: AktorProfil;
  /** 0-100 atıf güveni. */
  guven: number;
  toplamOlay: number;
  benzersizIp: number;
  ulkeler: string[];
  asnler: string[];
  hedefYollar: string[];
  /** Eşleşen göstergeler (IOC / TTP kanıtı). */
  gostergeler: string[];
  dominantSinif: string;
  ilkGorulme: number;
  sonGorulme: number;
}

/** Bir saldırgan grubunu (olay kümesi) en olası aktör profiline atfeder. */
function atfet(olaylar: BotEvent[]): AktorAtif | null {
  const kotu = olaylar.filter((e) => KOTU.has(e.botClass));
  if (kotu.length < 3) return null;

  const sinifSay = new Map<string, number>();
  for (const e of kotu) sinifSay.set(e.botClass, (sinifSay.get(e.botClass) || 0) + 1);
  const dominant = [...sinifSay.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const ipler = [...new Set(kotu.map((e) => e.ip))];
  const asnler = [...new Set(kotu.map((e) => e.asn).filter(Boolean))];
  const yollar = [...new Set(kotu.map((e) => e.path))];
  const ulkeler = [...new Set(kotu.map((e) => e.country))];
  const dcVar = asnler.some((a) => DC_ANAHTAR.test(a));
  const tlsVar = kotu.some((e) => e.tlsUaUyumsuz);
  const headlessVar = kotu.some((e) => e.headless);
  const loginVar = yollar.some((y) => /login|auth|signin|password/i.test(y));
  const aiUa = kotu.some((e) => /gptbot|claudebot|perplexity|bytespider|ccbot|amazonbot/i.test(e.ua));

  // Her profile puan ver.
  let enIyi: { profil: AktorProfil; puan: number; gost: string[] } | null = null;
  for (const p of AKTOR_PROFILLERI) {
    let puan = 0;
    const gost: string[] = [];
    if (p.siniflar.includes(dominant as BotClass)) { puan += 40; gost.push(`Baskın sınıf: ${dominant}`); }
    // Profil-özel TTP kanıtları.
    if (p.id === "cred-syndicate" && loginVar) { puan += 25; gost.push("Login endpoint hedefleniyor"); }
    if (p.id === "cred-syndicate" && ipler.length >= 3) { puan += 10; gost.push(`${ipler.length} IP döndürme`); }
    if (p.id === "scrape-farm" && dcVar) { puan += 20; gost.push("Datacenter/hosting ASN"); }
    if (p.id === "scrape-farm" && kotu.some((e) => /python|curl|scrapy|go-http/i.test(e.ua))) { puan += 15; gost.push("HTTP kütüphanesi aracı"); }
    if (p.id === "ai-harvest" && aiUa) { puan += 30; gost.push("İlan edilmiş AI ajan UA"); }
    if (p.id === "ddos-crew" && ipler.length >= 5) { puan += 20; gost.push(`${ipler.length} kaynak IP (dağıtık)`); }
    if (p.id === "spoof-evader" && (tlsVar || headlessVar)) { puan += 30; gost.push(tlsVar ? "TLS/UA uyumsuz (sahte tarayıcı)" : "Headless imza"); }
    if (p.id === "opportunist" && ipler.length <= 2 && kotu.length < 20) { puan += 15; gost.push("Düşük hacim fırsatçı"); }
    // Coğrafi yoğunluk küçük bonus.
    if (ulkeler.length <= 3 && p.seviye !== "fırsatçı") { puan += 5; }
    if (puan > 0 && (!enIyi || puan > enIyi.puan)) enIyi = { profil: p, puan, gost };
  }
  if (!enIyi) return null;

  const guven = Math.min(100, enIyi.puan);
  return {
    id: `aktor_${hash(ipler.sort().join(",") + enIyi.profil.id)}`,
    profil: enIyi.profil, guven,
    toplamOlay: kotu.length, benzersizIp: ipler.length,
    ulkeler, asnler: asnler.slice(0, 4), hedefYollar: yollar.slice(0, 5),
    gostergeler: enIyi.gost, dominantSinif: dominant,
    ilkGorulme: Math.min(...kotu.map((e) => e.ts)), sonGorulme: Math.max(...kotu.map((e) => e.ts)),
  };
}

export interface AktorSonuc {
  atiflar: AktorAtif[];
  ozet: {
    toplamAktor: number;
    gelismisAktor: number;
    profilDagilim: { ad: string; sayi: number }[];
    enAktifProfil: string;
  };
}

/**
 * Olayları ASN'e göre saldırgan gruplarına ayırıp her grubu bir aktöre atfeder.
 * (ASN, bir tehdit-aktörün altyapı imzasının iyi bir yaklaşımıdır.)
 */
export function tehditAktorAnaliz(events: BotEvent[]): AktorSonuc {
  const kotu = events.filter((e) => KOTU.has(e.botClass));
  // ASN'e göre grupla (aktör altyapı imzası).
  const gruplar = new Map<string, BotEvent[]>();
  for (const e of kotu) {
    const anahtar = e.asn || "bilinmeyen";
    (gruplar.get(anahtar) ?? gruplar.set(anahtar, []).get(anahtar)!).push(e);
  }

  const atiflar: AktorAtif[] = [];
  for (const [, grup] of gruplar) {
    const a = atfet(grup);
    if (a) atiflar.push(a);
  }
  atiflar.sort((a, b) => b.toplamOlay - a.toplamOlay || b.guven - a.guven);

  const profilSay = new Map<string, number>();
  for (const a of atiflar) profilSay.set(a.profil.ad, (profilSay.get(a.profil.ad) || 0) + 1);

  return {
    atiflar,
    ozet: {
      toplamAktor: atiflar.length,
      gelismisAktor: atiflar.filter((a) => a.profil.seviye === "gelişmiş").length,
      profilDagilim: [...profilSay.entries()].map(([ad, sayi]) => ({ ad, sayi })).sort((a, b) => b.sayi - a.sayi),
      enAktifProfil: atiflar[0]?.profil.ad ?? "—",
    },
  };
}

export const SEVIYE_ETIKET: Record<AktorProfil["seviye"], string> = {
  "fırsatçı": "Fırsatçı", organize: "Organize", "gelişmiş": "Gelişmiş",
};
export const SEVIYE_RENK: Record<AktorProfil["seviye"], string> = {
  "fırsatçı": "#65a30d", organize: "#ea580c", "gelişmiş": "#dc2626",
};
