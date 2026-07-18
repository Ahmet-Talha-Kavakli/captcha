/**
 * Specter — Kırmızı Takım Saldırı Senaryosu Simülatörü
 * ====================================================
 * "Savunmam gerçekten çalışıyor mu?" — kullanıcının KENDİ kurallarını gerçek
 * saldırı senaryolarına karşı test eder. Her senaryo (kimlik doldurma, kazıma
 * botneti, AI eğitim taraması, DDoS, sahte tarayıcı...) sentetik istek bağlamları
 * üretir; bunlar kullanıcının GERÇEK kural motorundan (`evaluateRules`) geçirilir.
 * Sonuç: hangi saldırı engellendi/doğrulandı/kaçtı + kapsama skoru + boşluklar.
 *
 * Saf/deterministik: Date.now/Math.random YOK — sentetik veriler indeks-tohumlu.
 */
import { evaluateRules, type RequestContext } from "@/lib/specter/rule-engine";
import type { Rule, BotClass } from "@/lib/db/schema";

export interface SaldiriSenaryo {
  id: string;
  ad: string;
  aciklama: string;
  kategori: "kimlik" | "kazima" | "ai" | "ddos" | "atlatma" | "spam";
  siddet: "orta" | "yuksek" | "kritik";
  /** Bu senaryoda beklenen doğru aksiyon (savunma bunu yapmalı). */
  beklenen: "block" | "challenge";
  /** Sentetik istek üreteci (n istek). */
  uretici: (n: number) => RequestContext[];
}

/** Deterministik "rastgele" — indeks tohumlu. */
function tohum(i: number, tuz: number): number {
  const x = Math.sin(i * 12.9898 + tuz * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function ctx(p: Partial<RequestContext>): RequestContext {
  return {
    ip: "1.1.1.1", country: "US", asn: "AS0 Unknown", ua: "Mozilla/5.0", path: "/",
    score: 0.5, botClass: "human" as BotClass, rate: 0, headless: false, tlsUaUyumsuz: false, httpVersion: "h2", ...p,
  };
}

export const SENARYOLAR: SaldiriSenaryo[] = [
  {
    id: "credential-stuffing", ad: "Kimlik Doldurma Saldırısı", kategori: "kimlik", siddet: "kritik", beklenen: "block",
    aciklama: "Botnet /login yolunu düşük skorlu, yüksek hızlı isteklerle bombardıman ediyor.",
    uretici: (n) => Array.from({ length: n }, (_, i) => ctx({
      ip: `45.11.${Math.floor(tohum(i, 1) * 255)}.${Math.floor(tohum(i, 2) * 255)}`,
      country: ["RU", "CN", "BR"][Math.floor(tohum(i, 3) * 3)], asn: "AS9009 M247 (VPN)",
      ua: "Mozilla/5.0", path: "/login", score: 0.08 + tohum(i, 4) * 0.15, botClass: "credential_stuffing", rate: 40 + Math.floor(tohum(i, 5) * 60),
    })),
  },
  {
    id: "scraper-botnet", ad: "Kazıma Botneti", kategori: "kazima", siddet: "yuksek", beklenen: "block",
    aciklama: "Dağıtık kazıyıcılar ürün/fiyat sayfalarını sistematik topluyor.",
    uretici: (n) => Array.from({ length: n }, (_, i) => ctx({
      ip: `185.220.${Math.floor(tohum(i, 6) * 255)}.${Math.floor(tohum(i, 7) * 255)}`,
      country: "NL", asn: "AS14061 DigitalOcean", ua: "python-requests/2.31",
      path: ["/urunler", "/api/products", "/fiyatlar"][Math.floor(tohum(i, 8) * 3)], score: 0.15 + tohum(i, 9) * 0.1, botClass: "scraper", rate: 20,
    })),
  },
  {
    id: "ai-training", ad: "AI Eğitim Taraması", kategori: "ai", siddet: "orta", beklenen: "challenge",
    aciklama: "GPTBot/ClaudeBot içeriği model eğitimi için topluyor.",
    uretici: (n) => Array.from({ length: n }, (_, i) => ctx({
      ip: `20.15.${Math.floor(tohum(i, 10) * 255)}.${Math.floor(tohum(i, 11) * 255)}`,
      country: "US", asn: "AS8075 Microsoft", ua: "Mozilla/5.0 (compatible; GPTBot/1.1)",
      path: "/blog", score: 0.5, botClass: "ai_agent", aiAgentId: "gptbot", aiCategory: "model_egitimi",
    })),
  },
  {
    id: "spoofed-browser", ad: "Sahte Tarayıcı (TLS Atlatma)", kategori: "atlatma", siddet: "kritik", beklenen: "block",
    aciklama: "UA Chrome diyor ama TLS parmak izi Python — imza atlatma denemesi.",
    uretici: (n) => Array.from({ length: n }, (_, i) => ctx({
      ip: `103.79.${Math.floor(tohum(i, 12) * 255)}.${Math.floor(tohum(i, 13) * 255)}`,
      country: ["CN", "VN"][Math.floor(tohum(i, 14) * 2)], asn: "AS4134 ChinaNet", ua: "Mozilla/5.0 (Windows NT 10.0) Chrome/120",
      path: "/api/data", score: 0.12, botClass: "automation", tlsUaUyumsuz: true, headless: false,
    })),
  },
  {
    id: "ddos-flood", ad: "DDoS Sel Saldırısı", kategori: "ddos", siddet: "kritik", beklenen: "block",
    aciklama: "Yüksek hacimli, çok-IP'li istek seli hizmeti boğmaya çalışıyor.",
    uretici: (n) => Array.from({ length: n }, (_, i) => ctx({
      ip: `${Math.floor(tohum(i, 15) * 255)}.${Math.floor(tohum(i, 16) * 255)}.1.1`,
      country: ["RU", "CN", "IR", "BR", "IN"][Math.floor(tohum(i, 17) * 5)], asn: "AS0 Botnet", ua: "Go-http-client/2.0",
      path: "/", score: 0.05, botClass: "ddos", rate: 200 + Math.floor(tohum(i, 18) * 300),
    })),
  },
  {
    id: "headless-scrape", ad: "Headless Tarayıcı Kazıma", kategori: "atlatma", siddet: "yuksek", beklenen: "block",
    aciklama: "Puppeteer/Playwright JS-üretimli içeriği render edip topluyor.",
    uretici: (n) => Array.from({ length: n }, (_, i) => ctx({
      ip: `35.192.${Math.floor(tohum(i, 19) * 255)}.${Math.floor(tohum(i, 20) * 255)}`,
      country: "US", asn: "AS15169 Google Cloud", ua: "Mozilla/5.0 HeadlessChrome/120",
      path: "/dinamik", score: 0.2, botClass: "scraper", headless: true,
    })),
  },
];

export interface SenaryoSonuc {
  senaryo: SaldiriSenaryo;
  toplam: number;
  engellenen: number;
  dogrulanan: number;
  kacan: number; // izin verilen (savunma başarısız)
  /** Savunma etkinliği: doğru aksiyon oranı (0-100). */
  etkinlik: number;
  /** Bu senaryoyu yakalayan kurallar. */
  yakalayanKurallar: string[];
  durum: "korunuyor" | "kismi" | "acik";
}

export interface KirmiziTakimSonuc {
  sonuclar: SenaryoSonuc[];
  ozet: {
    toplamSenaryo: number;
    korunuyor: number;
    acik: number;
    kapsamaSkoru: number; // genel savunma kapsama %
    kritikAcik: number;
  };
}

/**
 * Tüm senaryoları kullanıcının kurallarına karşı çalıştırır.
 * @param rules kullanıcının GERÇEK kuralları.
 * @param istekSayisi senaryo başına sentetik istek sayısı.
 */
export function kirmiziTakimCalistir(rules: Rule[], istekSayisi = 40): KirmiziTakimSonuc {
  const sonuclar: SenaryoSonuc[] = [];

  for (const senaryo of SENARYOLAR) {
    const istekler = senaryo.uretici(istekSayisi);
    let engellenen = 0, dogrulanan = 0, kacan = 0;
    const yakalayan = new Set<string>();

    for (const istek of istekler) {
      const sonuc = evaluateRules(rules, istek);
      if (sonuc.action === "block") engellenen++;
      else if (sonuc.action === "challenge") dogrulanan++;
      else kacan++; // allow ya da flag → saldırı geçti
      if (sonuc.decidedBy && sonuc.action !== "allow") yakalayan.add(sonuc.decidedBy.ruleName);
    }

    // Etkinlik: beklenen aksiyon (block ise engellenen; challenge ise engellenen+doğrulanan).
    const dogruAksiyon = senaryo.beklenen === "block" ? engellenen : engellenen + dogrulanan;
    const etkinlik = Math.round((dogruAksiyon / istekler.length) * 100);
    const durum: SenaryoSonuc["durum"] = etkinlik >= 85 ? "korunuyor" : etkinlik >= 40 ? "kismi" : "acik";

    sonuclar.push({
      senaryo, toplam: istekler.length, engellenen, dogrulanan, kacan,
      etkinlik, yakalayanKurallar: [...yakalayan], durum,
    });
  }

  const korunuyor = sonuclar.filter((s) => s.durum === "korunuyor").length;
  const acik = sonuclar.filter((s) => s.durum === "acik").length;
  const kapsamaSkoru = Math.round(sonuclar.reduce((a, s) => a + s.etkinlik, 0) / sonuclar.length);
  const kritikAcik = sonuclar.filter((s) => s.durum === "acik" && s.senaryo.siddet === "kritik").length;

  return {
    sonuclar: sonuclar.sort((a, b) => a.etkinlik - b.etkinlik), // en zayıf önce
    ozet: { toplamSenaryo: sonuclar.length, korunuyor, acik, kapsamaSkoru, kritikAcik },
  };
}

export const KATEGORI_ETIKET: Record<SaldiriSenaryo["kategori"], string> = {
  kimlik: "Kimlik", kazima: "Kazıma", ai: "AI ajan", ddos: "DDoS", atlatma: "Atlatma", spam: "Spam",
};
export const DURUM_RENK: Record<SenaryoSonuc["durum"], string> = {
  korunuyor: "#16a34a", kismi: "#d97706", acik: "#dc2626",
};
