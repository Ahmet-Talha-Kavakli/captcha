/**
 * Specter — Federe (Çapraz-Site) Tehdit Korelasyonu
 * =================================================
 * Bir saldırgan tek sitede zararsız görünebilir; ama AYNI IP/ASN/parmak-izi
 * hesabınızdaki BİRDEN FAZLA siteye vuruyorsa bu KOORDİNELİ bir operasyondur.
 * Tek-site görünürlüğü bunu kaçırır — federe korelasyon, tüm siteler arasında
 * ortak saldırgan altyapısını birleştirir:
 *
 *   • Çapraz-site IP  — aynı IP kaç farklı siteye vurdu (yatay hedefleme).
 *   • Çapraz-site ASN — aynı ağ bloğu birden fazla siteyi tarıyor (botnet).
 *   • Çapraz-site parmak-izi — aynı cihaz imzası siteler arası dolaşıyor.
 *
 * Her çapraz-varlık için YAYILMA (kaç site), yoğunluk ve KOORDİNASYON skoru
 * çıkarılır. Bir site tek başına düşük risk görürken federe görünüm gerçek
 * kampanyayı ortaya çıkarır. Tek site varsa modül federe uyarısı üretmez.
 *
 * Saf/deterministik: Date.now/Math.random YOK — girdi olaylardan.
 */
import type { BotEvent } from "@/lib/db/schema";

const IYI = new Set(["human", "good_bot"]);

/** ASN'den kısa kod (AS9009 M247 → AS9009). */
function asnKisa(asn: string): string {
  const m = asn.match(/^AS\d+/);
  return m ? m[0] : asn.split(" ")[0];
}

export type VarlikTip = "ip" | "asn" | "parmakizi";

export interface FedereVarlik {
  deger: string;
  tip: VarlikTip;
  /** Vurduğu farklı site sayısı. */
  siteSayisi: number;
  /** Vurduğu site id'leri. */
  siteler: string[];
  /** Toplam kötü istek. */
  toplamIstek: number;
  /** Baskın bot sınıfı. */
  botClass: string;
  country: string;
  asn: string;
  /** Koordinasyon skoru 0-100: yayılma × yoğunluk × zamansal örtüşme. */
  koordinasyon: number;
  /** Tehdit: yayılma ne kadar genişse o kadar yüksek. */
  tehdit: "düşük" | "orta" | "yüksek" | "kritik";
  /** Site başına istek dağılımı. */
  siteDagilim: { siteId: string; istek: number }[];
}

function tehditHesap(siteSayisi: number, toplamIstek: number): FedereVarlik["tehdit"] {
  if (siteSayisi >= 4 && toplamIstek >= 20) return "kritik";
  if (siteSayisi >= 3) return "yüksek";
  if (siteSayisi >= 2 && toplamIstek >= 10) return "orta";
  return "düşük";
}

/**
 * Koordinasyon skoru: yayılma (site sayısı), yoğunluk (istek) ve site-başına
 * dengeli dağılım (tek siteye yığılmak yerine yayılmış olması) birleştirilir.
 */
function koordinasyonSkoru(siteSayisi: number, toplamIstek: number, siteDagilim: number[]): number {
  const yayilma = Math.min(1, (siteSayisi - 1) / 4); // 1 site = 0, 5+ site = 1
  const yogunluk = Math.min(1, toplamIstek / 60);
  // Dengeli dağılım: Gini-benzeri tersine — istekler sitelere yayılmışsa yüksek.
  const top = siteDagilim.reduce((a, b) => a + b, 0) || 1;
  const paylar = siteDagilim.map((x) => x / top);
  const enBuyukPay = Math.max(...paylar);
  const denge = 1 - (enBuyukPay - 1 / siteSayisi) / (1 - 1 / siteSayisi || 1); // 1=tam dengeli
  const skor = (yayilma * 0.5 + yogunluk * 0.25 + Math.max(0, denge) * 0.25) * 100;
  return Math.round(skor);
}

function varlikCikar(
  events: BotEvent[],
  tip: VarlikTip,
  anahtar: (e: BotEvent) => string,
): FedereVarlik[] {
  const map = new Map<string, { siteler: Map<string, number>; toplam: number; botClass: Map<string, number>; country: string; asn: string }>();
  for (const e of events) {
    if (IYI.has(e.botClass)) continue;
    const k = anahtar(e);
    if (!k) continue;
    let g = map.get(k);
    if (!g) { g = { siteler: new Map(), toplam: 0, botClass: new Map(), country: e.country, asn: e.asn }; map.set(k, g); }
    g.siteler.set(e.siteId, (g.siteler.get(e.siteId) || 0) + 1);
    g.toplam++;
    g.botClass.set(e.botClass, (g.botClass.get(e.botClass) || 0) + 1);
  }

  const out: FedereVarlik[] = [];
  for (const [deger, g] of map) {
    if (g.siteler.size < 2) continue; // ÇAPRAZ-site değil, atla
    const siteDagilim = [...g.siteler.entries()].map(([siteId, istek]) => ({ siteId, istek })).sort((a, b) => b.istek - a.istek);
    const baskinBot = [...g.botClass.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "automation";
    out.push({
      deger, tip,
      siteSayisi: g.siteler.size,
      siteler: [...g.siteler.keys()],
      toplamIstek: g.toplam,
      botClass: baskinBot,
      country: g.country,
      asn: g.asn,
      koordinasyon: koordinasyonSkoru(g.siteler.size, g.toplam, siteDagilim.map((s) => s.istek)),
      tehdit: tehditHesap(g.siteler.size, g.toplam),
      siteDagilim,
    });
  }
  out.sort((a, b) => b.koordinasyon - a.koordinasyon || b.siteSayisi - a.siteSayisi);
  return out;
}

export interface FedereRapor {
  /** Çok siteli hesap mı (federe korelasyon anlamlı mı). */
  cokSite: boolean;
  siteSayisi: number;
  ipVarliklar: FedereVarlik[];
  asnVarliklar: FedereVarlik[];
  parmakizVarliklar: FedereVarlik[];
  ozet: {
    caprazSaldirgan: number;    // ≥2 siteye vuran benzersiz IP
    kritikVarlik: number;
    enGenisYayilma: number;     // bir varlığın vurduğu max site
    koordineliKampanya: number; // yüksek koordinasyonlu (≥60) varlık
    etkilenenSite: number;      // en az bir çapraz-saldırgan gören site
  };
}

/**
 * Tüm olaylardan federe korelasyon raporu üretir.
 * @param events tüm sitelerin olayları (siteId taşır).
 * @param toplamSite hesaptaki toplam site sayısı.
 */
export function federeKorelasyon(events: BotEvent[], toplamSite: number): FedereRapor {
  const ipVarliklar = varlikCikar(events, "ip", (e) => e.ip);
  const asnVarliklar = varlikCikar(events, "asn", (e) => asnKisa(e.asn));
  const parmakizVarliklar = varlikCikar(events, "parmakizi", (e) => (e.fingerprint && e.fingerprint !== "" ? e.fingerprint : ""));

  const etkilenenSiteSet = new Set<string>();
  for (const v of ipVarliklar) v.siteler.forEach((s) => etkilenenSiteSet.add(s));

  const enGenis = Math.max(0, ...ipVarliklar.map((v) => v.siteSayisi), ...asnVarliklar.map((v) => v.siteSayisi));

  return {
    cokSite: toplamSite >= 2,
    siteSayisi: toplamSite,
    ipVarliklar,
    asnVarliklar,
    parmakizVarliklar,
    ozet: {
      caprazSaldirgan: ipVarliklar.length,
      kritikVarlik: [...ipVarliklar, ...asnVarliklar].filter((v) => v.tehdit === "kritik").length,
      enGenisYayilma: enGenis,
      koordineliKampanya: [...ipVarliklar, ...asnVarliklar].filter((v) => v.koordinasyon >= 60).length,
      etkilenenSite: etkilenenSiteSet.size,
    },
  };
}

export const TEHDIT_RENK: Record<FedereVarlik["tehdit"], string> = {
  "düşük": "#16a34a", "orta": "#d97706", "yüksek": "#ea580c", "kritik": "#dc2626",
};

export const TIP_ETIKET: Record<VarlikTip, string> = {
  ip: "IP adresi", asn: "ASN / Ağ", parmakizi: "Cihaz parmak-izi",
};
