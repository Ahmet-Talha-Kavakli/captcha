/**
 * Specter — Cihaz Havuzu & Parmak İzi Çakışması Tespiti
 * ====================================================
 * Meşru bir cihaz genelde tek/az IP kullanır. Ama bir SALDIRGAN tek bir cihaz
 * (ya da headless tarayıcı imajı) üstünden onlarca IP döndürerek çok-hesap
 * kötüye kullanımı, kayıt spam'i veya kimlik doldurma yapar. Ters durum da
 * şüphelidir: aynı IP arkasında ONLARCA farklı parmak izi = parmak-izi çiftliği
 * (rastgele fingerprint üretimi) ya da büyük bir NAT/proxy.
 *
 * Bu modül iki yönlü çakışmayı çıkarır:
 *   1) Cihaz havuzu: bir fingerprint → çok IP (IP döndürme / botnet cihazı).
 *   2) IP havuzu: bir IP → çok fingerprint (fingerprint çiftliği / proxy).
 *
 * Saf/deterministik: Date.now/Math.random YOK.
 */
import type { BotEvent } from "@/lib/db/schema";

/** Şüpheli sayılmak için bir fingerprint'in kullandığı minimum farklı IP. */
export const CIHAZ_ESIK_IP = 3;
/** Şüpheli sayılmak için bir IP'nin taşıdığı minimum farklı fingerprint. */
export const IP_ESIK_FP = 5;

export interface CihazHavuzu {
  id: string;
  fingerprint: string;
  ipler: string[];
  ulkeler: string[];
  asnler: string[];
  toplamOlay: number;
  engellenen: number;
  minSkor: number;
  dominantBotClass: string;
  /** IP başına ortalama olay — düşükse "değdirip-geç" IP döndürme. */
  ipBasinaOlay: number;
  /** Çok-ülke yayılımı (coğrafi imkânsızlık işareti). */
  cokUlke: boolean;
  tehditSkoru: number;
  headless: boolean;
}

export interface IpHavuzu {
  id: string;
  ip: string;
  country: string;
  asn: string;
  fingerprintler: string[];
  toplamOlay: number;
  engellenen: number;
  /** Farklı fingerprint sayısı — yüksekse fingerprint çiftliği. */
  fpCesidi: number;
  tehditSkoru: number;
}

const KOTU = new Set(["scraper", "credential_stuffing", "automation", "ai_agent", "ddos", "spam"]);

function hash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, "0");
}

export interface CihazHavuzuSonuc {
  cihazlar: CihazHavuzu[];
  ipHavuzlari: IpHavuzu[];
  ozet: {
    supheliCihaz: number; // >=CIHAZ_ESIK_IP IP kullanan fingerprint
    supheliIp: number; // >=IP_ESIK_FP fingerprint taşıyan IP
    enGenisCihaz: number; // en çok IP'li cihaz
    enGenisIp: number; // en çok fingerprint'li IP
    toplamCihaz: number;
  };
}

export function cihazHavuzuCikar(events: BotEvent[]): CihazHavuzuSonuc {
  // fingerprint → olaylar
  const fpOlay = new Map<string, BotEvent[]>();
  const ipOlay = new Map<string, BotEvent[]>();
  for (const e of events) {
    if (e.fingerprint) (fpOlay.get(e.fingerprint) ?? fpOlay.set(e.fingerprint, []).get(e.fingerprint)!).push(e);
    (ipOlay.get(e.ip) ?? ipOlay.set(e.ip, []).get(e.ip)!).push(e);
  }

  // 1) Cihaz havuzları (fingerprint → çok IP).
  const cihazlar: CihazHavuzu[] = [];
  for (const [fp, olaylar] of fpOlay) {
    const ipler = [...new Set(olaylar.map((e) => e.ip))];
    if (ipler.length < CIHAZ_ESIK_IP) continue;
    const ulkeler = [...new Set(olaylar.map((e) => e.country))];
    const asnler = [...new Set(olaylar.map((e) => e.asn).filter(Boolean))];
    const engellenen = olaylar.filter((e) => e.verdict === "blocked" || e.verdict === "challenged").length;
    const minSkor = Math.min(...olaylar.map((e) => e.score));
    const sinifSay: Record<string, number> = {};
    for (const e of olaylar) sinifSay[e.botClass] = (sinifSay[e.botClass] || 0) + 1;
    const dominantBotClass = Object.entries(sinifSay).sort((a, b) => b[1] - a[1])[0][0];
    const ipBasinaOlay = Math.round((olaylar.length / ipler.length) * 10) / 10;
    const cokUlke = ulkeler.length >= 3;
    // Tehdit: çok IP + çok ülke + düşük skor + engel oranı.
    const tehditSkoru = Math.min(100, Math.round(
      Math.min(ipler.length, 20) * 3 + (cokUlke ? 20 : 0) + (1 - minSkor) * 25 + (engellenen / olaylar.length) * 15,
    ));
    cihazlar.push({
      id: `cihaz_${hash(fp)}`, fingerprint: fp, ipler: ipler.sort(), ulkeler, asnler,
      toplamOlay: olaylar.length, engellenen, minSkor, dominantBotClass, ipBasinaOlay, cokUlke,
      tehditSkoru, headless: olaylar.some((e) => e.headless),
    });
  }
  cihazlar.sort((a, b) => b.ipler.length - a.ipler.length || b.tehditSkoru - a.tehditSkoru);

  // 2) IP havuzları (IP → çok fingerprint).
  const ipHavuzlari: IpHavuzu[] = [];
  for (const [ip, olaylar] of ipOlay) {
    const fps = [...new Set(olaylar.map((e) => e.fingerprint).filter(Boolean))];
    if (fps.length < IP_ESIK_FP) continue;
    const engellenen = olaylar.filter((e) => e.verdict === "blocked" || e.verdict === "challenged").length;
    const kotuOran = olaylar.filter((e) => KOTU.has(e.botClass)).length / olaylar.length;
    const tehditSkoru = Math.min(100, Math.round(Math.min(fps.length, 30) * 2.5 + kotuOran * 25));
    ipHavuzlari.push({
      id: `iphavuz_${hash(ip)}`, ip, country: olaylar[0].country, asn: olaylar[0].asn,
      fingerprintler: fps, toplamOlay: olaylar.length, engellenen, fpCesidi: fps.length, tehditSkoru,
    });
  }
  ipHavuzlari.sort((a, b) => b.fpCesidi - a.fpCesidi || b.tehditSkoru - a.tehditSkoru);

  return {
    cihazlar,
    ipHavuzlari,
    ozet: {
      supheliCihaz: cihazlar.length,
      supheliIp: ipHavuzlari.length,
      enGenisCihaz: cihazlar[0]?.ipler.length ?? 0,
      enGenisIp: ipHavuzlari[0]?.fpCesidi ?? 0,
      toplamCihaz: fpOlay.size,
    },
  };
}
