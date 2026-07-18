/**
 * Specter — Saldırgan Oturum Yeniden-Oynatma (Session Replay)
 * ==========================================================
 * Ham olaylar ayrık kayıtlardır; bir saldırıyı ANLAMAK için olayları
 * OTURUMLARA gruplamak gerekir. Specter'da explicit sessionId yok — bunun
 * yerine bir oturum, AYNI IP + AYNI fingerprint (cihaz imzası) paylaşan ve
 * ardışık olayları arasındaki boşluk `OTURUM_ARALIK`'tan küçük olan olaylar
 * dizisidir. Bu, gerçek adli inceleme (forensics) mantığıdır: bir botun
 * sitede attığı her adımı zaman sırasıyla yeniden oynatır.
 *
 * Çıktı: her oturum bir "atak zinciri" — giriş noktası, gezinme yolu, tetiklenen
 * kurallar, skor değişimi, nihai karar, süre ve şüphe göstergeleri.
 */
import type { BotEvent } from "@/lib/db/schema";

/** Aynı oturuma ait sayılmak için ardışık olaylar arası maks boşluk (ms). */
export const OTURUM_ARALIK = 30 * 60 * 1000; // 30 dk

export interface OturumAdim {
  ts: number;
  path: string;
  method: string;
  verdict: string;
  score: number;
  botClass: string;
  triggeredRules: string[];
  latency: number;
  /** Bir önceki adımdan bu adıma geçen süre (ms). */
  delta: number;
  sinyaller: string[];
}

export interface Oturum {
  id: string; // deterministik: ip+fp+ilkTs
  ip: string;
  country: string;
  asn: string;
  ua: string;
  fingerprint: string;
  baslangic: number;
  bitis: number;
  sureMs: number;
  adimSayisi: number;
  adimlar: OturumAdim[];
  /** Oturum boyunca gezilen benzersiz yollar. */
  yollar: string[];
  /** Nihai karar (son adımın verdict'i). */
  sonKarar: string;
  /** Oturumun tepe (en düşük) insanlık skoru. */
  minSkor: number;
  /** Ortalama istek aralığı (ms) — çok düzenli = otomasyon. */
  ortAralik: number;
  /** Otomasyon şüphe sinyalleri (birleşik). */
  supheSinyaller: string[];
  /** Botluk sınıfı (oturumdaki baskın). */
  dominantBotClass: string;
  /** Oturum tehdit skoru 0-100. */
  tehditSkoru: number;
  headless: boolean;
  tlsUaUyumsuz: boolean;
}

/** Basit deterministik hash (FNV-1a) — oturum id'si için. */
function hash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

/**
 * Olayları oturumlara böler. Aynı ip+fingerprint için olayları zaman sırasına
 * dizer; ardışık boşluk OTURUM_ARALIK'ı aşınca yeni oturum başlatır.
 */
export function oturumlariCikar(events: BotEvent[]): Oturum[] {
  // ip+fingerprint anahtarına göre grupla.
  const gruplar = new Map<string, BotEvent[]>();
  for (const e of events) {
    const anahtar = `${e.ip}|${e.fingerprint || "nofp"}`;
    (gruplar.get(anahtar) ?? gruplar.set(anahtar, []).get(anahtar)!).push(e);
  }

  const oturumlar: Oturum[] = [];
  for (const [, grup] of gruplar) {
    const sirali = [...grup].sort((a, b) => a.ts - b.ts);
    // Zaman boşluğuna göre oturumlara böl.
    let parca: BotEvent[] = [];
    const parcalar: BotEvent[][] = [];
    for (const e of sirali) {
      if (parca.length && e.ts - parca[parca.length - 1].ts > OTURUM_ARALIK) {
        parcalar.push(parca);
        parca = [];
      }
      parca.push(e);
    }
    if (parca.length) parcalar.push(parca);

    for (const p of parcalar) {
      if (p.length === 0) continue;
      oturumlar.push(oturumKur(p));
    }
  }

  // En yeni + en tehditli önce.
  return oturumlar.sort((a, b) => b.tehditSkoru - a.tehditSkoru || b.baslangic - a.baslangic);
}

function oturumKur(olaylar: BotEvent[]): Oturum {
  const ilk = olaylar[0];
  const son = olaylar[olaylar.length - 1];
  const adimlar: OturumAdim[] = olaylar.map((e, i) => ({
    ts: e.ts,
    path: e.path,
    method: e.method,
    verdict: e.verdict,
    score: e.score,
    botClass: e.botClass,
    triggeredRules: e.triggeredRules ?? [],
    latency: e.latency,
    delta: i === 0 ? 0 : e.ts - olaylar[i - 1].ts,
    sinyaller: e.sinyaller ?? [],
  }));

  const yollar = [...new Set(olaylar.map((e) => e.path))];
  const araliklar = adimlar.slice(1).map((a) => a.delta);
  const ortAralik = araliklar.length ? Math.round(araliklar.reduce((x, y) => x + y, 0) / araliklar.length) : 0;
  const minSkor = Math.min(...olaylar.map((e) => e.score));

  // Baskın bot sınıfı.
  const sinifSay: Record<string, number> = {};
  for (const e of olaylar) sinifSay[e.botClass] = (sinifSay[e.botClass] || 0) + 1;
  const dominantBotClass = Object.entries(sinifSay).sort((a, b) => b[1] - a[1])[0][0];

  // Şüphe sinyalleri birleşik.
  const supheSet = new Set<string>();
  for (const e of olaylar) {
    for (const s of e.sinyaller ?? []) supheSet.add(s);
    if (e.headless) supheSet.add("Headless tarayıcı");
    if (e.tlsUaUyumsuz) supheSet.add("TLS/UA uyumsuz");
    for (const f of e.automationFlags ?? []) supheSet.add(f);
  }

  // Aralık düzenliliği (otomasyon işareti): varyans düşükse şüphe.
  let duzenliMi = false;
  if (araliklar.length >= 3) {
    const ort = ortAralik;
    const varyans = araliklar.reduce((a, d) => a + (d - ort) ** 2, 0) / araliklar.length;
    const std = Math.sqrt(varyans);
    duzenliMi = ort > 0 && std / ort < 0.15; // %15 altı sapma = makine gibi düzenli
    if (duzenliMi) supheSet.add("Makine-düzeni istek aralığı");
  }

  const engellenen = olaylar.filter((e) => e.verdict === "blocked" || e.verdict === "challenged").length;
  const engelOran = engellenen / olaylar.length;

  // Tehdit skoru: düşük skor + engel oranı + şüphe sinyalleri + düzenlilik.
  const tehditSkoru = Math.min(
    100,
    Math.round((1 - minSkor) * 45 + engelOran * 25 + Math.min(supheSet.size, 5) * 5 + (duzenliMi ? 15 : 0)),
  );

  return {
    id: `oturum_${hash(`${ilk.ip}|${ilk.fingerprint}|${ilk.ts}`)}`,
    ip: ilk.ip,
    country: ilk.country,
    asn: ilk.asn,
    ua: ilk.ua,
    fingerprint: ilk.fingerprint,
    baslangic: ilk.ts,
    bitis: son.ts,
    sureMs: son.ts - ilk.ts,
    adimSayisi: olaylar.length,
    adimlar,
    yollar,
    sonKarar: son.verdict,
    minSkor,
    ortAralik,
    supheSinyaller: [...supheSet],
    dominantBotClass,
    tehditSkoru,
    headless: olaylar.some((e) => e.headless),
    tlsUaUyumsuz: olaylar.some((e) => e.tlsUaUyumsuz),
  };
}

export interface OturumOzet {
  toplamOturum: number;
  botOturum: number;
  ortAdim: number;
  enUzunOturum: number;
  supheliOturum: number; // tehditSkoru >= 60
}

export function oturumOzet(oturumlar: Oturum[]): OturumOzet {
  const botOturum = oturumlar.filter((o) => o.dominantBotClass !== "human" && o.dominantBotClass !== "good_bot").length;
  const supheliOturum = oturumlar.filter((o) => o.tehditSkoru >= 60).length;
  const toplamAdim = oturumlar.reduce((a, o) => a + o.adimSayisi, 0);
  const enUzun = oturumlar.reduce((m, o) => Math.max(m, o.sureMs), 0);
  return {
    toplamOturum: oturumlar.length,
    botOturum,
    ortAdim: oturumlar.length ? Math.round(toplamAdim / oturumlar.length) : 0,
    enUzunOturum: enUzun,
    supheliOturum,
  };
}
