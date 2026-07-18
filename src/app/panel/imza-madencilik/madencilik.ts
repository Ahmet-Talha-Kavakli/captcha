/**
 * Specter — Otomatik İmza Madenciliği (Kümeleme ile İmza Keşfi)
 * =============================================================
 * Elle imza yazmak yerine, gözlemlenen SALDIRI trafiğinden imzaları OTOMATİK
 * çıkarır. Fikir denetimsiz (unsupervised): benzer kötü niyetli olayları ortak
 * özelliklerine göre kümeler (UA ailesi + ASN + yol öneki + botClass), her
 * kümenin ortak paydasını bir aday İMZAYA (kural-benzeri desen) dönüştürür,
 * ardından bu adayın kesinliğini (precision) ve kapsamasını (coverage) TÜM
 * olaylar üzerinde ölçer.
 *
 * DÜRÜSTLÜK: Bu bir kara-kutu ML modeli DEĞİLDİR. Şeffaf, deterministik özellik
 * kümelemesidir — hangi olayların neden bir arada olduğu tamamen izlenebilir.
 * Kesinlik/kapsama yalnızca GÖZLEMLENEN veride ölçülür; gelecekteki trafikte
 * aynı performans garanti edilmez.
 *
 * Saf/deterministik: Date.now / Math.random YOK. Kararlı id'ler için FNV-1a.
 * /panel/imza (elle yazılmış imza kütüphanesi + DSL) ile aynı `Imza` şeklini
 * ÜRETMEYİ hedefler; çıktı, kütüphaneye eklenebilecek ADAY imzalardır.
 */
import type { BotEvent } from "@/lib/db/schema";
import type { Imza, ImzaKosul } from "@/lib/specter/imza";
import { imzaEslesir } from "@/lib/specter/imza";

/* ------------------------------------------------------------------ Ayarlar */

/** Bir kümenin aday imza olması için gereken en az üye sayısı. */
const MIN_KUME_UYE = 4;
/** Bir koşulun imzaya dahil edilmesi için kümede paylaşılması gereken oran. */
const KOSUL_ESIK = 0.7;

/* ------------------------------------------------------------------ Tipler */

/** Madencilik ile keşfedilen bir aday imza (kütüphaneye eklenebilir). */
export interface MadenImza {
  /** Kararlı id (özellik anahtarından FNV-1a ile türetilir). */
  id: string;
  /** Baskın özelliklerden otomatik üretilen ad ("python-requests + AS14061 + /api yolu"). */
  ad: string;
  /** İmzanın ortak koşulları — /panel/imza ile uyumlu ImzaKosul[]. */
  kosullar: ImzaKosul[];
  /** Koşulların birleştiricisi (madencilikte hep "and" — ortak payda). */
  birlestir: "and" | "or";
  /** Kümenin üye sayısı (bu desene uyan kötü olay sayısı). */
  uyeSayisi: number;
  /** Kesinlik (precision): bu koşullarla eşleşen olayların yüzde kaçı gerçekten kötü. */
  kesinlik: number;
  /** Kapsama (coverage): tüm kötü olayların yüzde kaçını bu imza yakalar. */
  kapsama: number;
  /** Kalite (0-100): kesinlik + kapsama + destek birleşimi. */
  kalite: number;
  /** /panel/imza ile uyumlu kategori. */
  kategori: Imza["kategori"];
  /** /panel/imza ile uyumlu şiddet (kalite/skordan türetilir). */
  siddet: Imza["siddet"];
  /** MITRE-benzeri taktik etiketi. */
  taktik: string;
  /** Kümenin baskın özellikleri (rozet/görsel için). */
  ozellikler: {
    uaAilesi: string;
    asn: string;
    yolOneki: string;
    botClass: string;
    ortSkor: number;
  };
  /** Örnek olaylar (genişletilebilir detay için, en fazla 6). */
  ornekOlaylar: {
    ip: string;
    country: string;
    path: string;
    ua: string;
    score: number;
    botClass: string;
  }[];
}

/** Madencilik özeti (üst StatKart'lar için). */
export interface MadencilikOzet {
  /** Keşfedilen toplam aday imza. */
  toplamImza: number;
  /** Yüksek kaliteli (kalite ≥ 70) imza sayısı. */
  yuksekKalite: number;
  /** Keşfedilen imzaların birleşik (union) kötü-olay kapsaması (tahmini %). */
  toplamKapsama: number;
  /** Otomatik onaylanabilir imza sayısı (kesinlik ≥ 90 ve kalite ≥ 75). */
  otoOnaylanabilir: number;
}

/* ------------------------------------------------------------------ Yardımcılar */

/** FNV-1a — kararlı, deterministik string hash (id üretimi için). */
function fnv1a(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0").slice(0, 8);
}

/** Kötü niyetli mi? human ve good_bot dışındaki her botClass kötü sayılır. */
export function kotuMu(e: BotEvent): boolean {
  return e.botClass !== "human" && e.botClass !== "good_bot";
}

/**
 * UA'yı deterministik olarak bir "aileye" indirger. Ham UA çok değişkendir;
 * kümeleme için ortak bir aile anahtarına ihtiyaç var (python-requests, curl,
 * headless-chrome, go-http, gerçek-tarayıcı, …).
 */
export function uaAilesi(ua: string): string {
  const u = (ua || "").toLowerCase();
  if (!u.trim()) return "boş-ua";
  if (u.includes("python-requests") || u.includes("python-urllib")) return "python-requests";
  if (u.includes("aiohttp")) return "aiohttp";
  if (u.includes("python")) return "python";
  if (u.includes("curl")) return "curl";
  if (u.includes("wget")) return "wget";
  if (u.includes("go-http") || u.includes("go-http-client")) return "go-http";
  if (u.includes("java") || u.includes("okhttp") || u.includes("apache-httpclient")) return "java-http";
  if (u.includes("node") || u.includes("axios") || u.includes("got ")) return "node-http";
  if (u.includes("scrapy")) return "scrapy";
  // Headless / otomasyon imzaları.
  if (u.includes("headlesschrome")) return "headless-chrome";
  if (u.includes("phantomjs")) return "phantomjs";
  if (u.includes("playwright")) return "playwright";
  if (u.includes("puppeteer")) return "puppeteer";
  if (u.includes("selenium")) return "selenium";
  // İlan edilmiş AI ajanları.
  if (u.includes("gptbot")) return "gptbot";
  if (u.includes("claudebot")) return "claudebot";
  if (u.includes("perplexity")) return "perplexitybot";
  if (u.includes("ccbot")) return "ccbot";
  if (u.includes("bytespider")) return "bytespider";
  // Gerçek tarayıcı motorları (spoof olabilir ama aile olarak ayrılır).
  if (u.includes("chrome") || u.includes("chromium")) return "chrome-tarayıcı";
  if (u.includes("firefox")) return "firefox-tarayıcı";
  if (u.includes("safari")) return "safari-tarayıcı";
  return "bilinmeyen-istemci";
}

/** ASN string'inden kısa numarayı ayıklar ("AS14061 DigitalOcean" → "AS14061"). */
export function asnKisa(asn: string): string {
  const m = (asn || "").match(/AS\d+/i);
  return m ? m[0].toUpperCase() : (asn || "AS?").split(/\s+/)[0] || "AS?";
}

/** Yolun ilk anlamlı segmentini önek olarak alır ("/api/v1/users" → "/api"). */
export function yolOneki(path: string): string {
  const p = (path || "/").split(/[?#]/)[0];
  const segs = p.split("/").filter(Boolean);
  if (segs.length === 0) return "/";
  return "/" + segs[0];
}

/** Bir olayın hangi UA ailesine ait olduğunu belirler (skor band + botClass ile birlikte anahtar). */
function skorBandi(score: number): string {
  if (score < 0.2) return "çok-düşük";
  if (score < 0.4) return "düşük";
  if (score < 0.6) return "orta";
  return "yüksek";
}

/* ------------------------------------------------------------------ Eşleştirme (aday koşullar) */

/**
 * Aday koşulları /panel/imza'daki `imzaEslesir` ile ÖLÇEBİLMEK için, aday imzayı
 * gerçek bir `Imza` nesnesine sarar. Böylece kesinlik/kapsama, kütüphane
 * imzalarıyla birebir aynı eşleştirme mantığıyla hesaplanır (kod tekrarı yok).
 */
function adayImza(kosullar: ImzaKosul[]): Imza {
  return {
    id: "SIG-MINED-ADAY",
    ad: "aday",
    aciklama: "",
    kategori: "kazima",
    siddet: "orta",
    birlestir: "and",
    kosullar,
    taktik: "",
  };
}

/* ------------------------------------------------------------------ Kategori/şiddet türetme */

/** botClass → /panel/imza kategorisi eşlemesi. */
function kategoriTuret(botClass: string, uaAil: string): Imza["kategori"] {
  if (botClass === "ai_agent") return "ai";
  if (botClass === "credential_stuffing") return "kimlik";
  if (botClass === "ddos") return "ddos";
  if (botClass === "scraper") return "kazima";
  if (botClass === "automation") return "arac";
  if (botClass === "spam") return "kazima";
  // araç ailelerine göre yedek.
  if (["headless-chrome", "playwright", "puppeteer", "selenium", "phantomjs"].includes(uaAil)) return "atlatma";
  return "arac";
}

/** Kaliteye ve skora göre şiddet türet. */
function siddetTuret(kalite: number, ortSkor: number): Imza["siddet"] {
  if (kalite >= 80 && ortSkor < 0.25) return "kritik";
  if (kalite >= 65) return "yuksek";
  if (kalite >= 45) return "orta";
  return "dusuk";
}

const TAKTIK: Record<string, string> = {
  ai: "İçerik toplama",
  kimlik: "Kimlik bilgisi erişimi",
  ddos: "Hizmet reddi",
  kazima: "Veri çıkarma",
  arac: "Otomatik erişim",
  atlatma: "Savunma atlatma",
};

/* ------------------------------------------------------------------ Ad üretimi */

/** İnsan-okur otomatik ad ("python-requests + AS14061 + /api yolu"). */
function otoAd(uaAil: string, asn: string, yol: string, botClass: string): string {
  const parcalar: string[] = [];
  if (uaAil && uaAil !== "bilinmeyen-istemci") parcalar.push(uaAil);
  else parcalar.push(botClass);
  if (asn && asn !== "AS?") parcalar.push(asn);
  if (yol && yol !== "/") parcalar.push(`${yol} yolu`);
  return parcalar.join(" + ");
}

/* ------------------------------------------------------------------ Ana madencilik */

interface Kume {
  anahtar: string;
  uaAil: string;
  asn: string;
  yol: string;
  botClass: string;
  uyeler: BotEvent[];
}

/**
 * Ana madencilik fonksiyonu.
 * 1) Kötü olayları bileşik özellik anahtarına göre grupla:
 *    (uaAilesi, asnKisa, yolOneki, botClass).
 * 2) ≥ MIN_KUME_UYE üyeli kümeleri tut.
 * 3) Her küme için, üyelerin ≥ %70'inde paylaşılan koşulları çıkar
 *    (uaContains, asn, pathPrefix, botClass, scoreMax).
 * 4) Bu koşulları TÜM olaylar üzerinde çalıştırıp kesinlik/kapsama ölç.
 * 5) Kalite skoru hesapla, sırala.
 */
export function imzaMadenciligi(events: BotEvent[]): MadenImza[] {
  const kotuOlaylar = events.filter(kotuMu);
  const toplamKotu = kotuOlaylar.length;
  if (toplamKotu === 0) return [];

  // 1) Bileşik özellik anahtarına göre grupla.
  const kumeler = new Map<string, Kume>();
  for (const e of kotuOlaylar) {
    const uaAil = uaAilesi(e.ua);
    const asn = asnKisa(e.asn);
    const yol = yolOneki(e.path);
    const anahtar = `${uaAil}|${asn}|${yol}|${e.botClass}`;
    let k = kumeler.get(anahtar);
    if (!k) {
      k = { anahtar, uaAil, asn, yol, botClass: e.botClass, uyeler: [] };
      kumeler.set(anahtar, k);
    }
    k.uyeler.push(e);
  }

  const sonuc: MadenImza[] = [];

  for (const k of kumeler.values()) {
    if (k.uyeler.length < MIN_KUME_UYE) continue;

    const n = k.uyeler.length;
    const kosullar: ImzaKosul[] = [];

    // 3) Kümede ≥ %70 paylaşılan koşulları çıkar.
    // botClass — kümenin tanımı gereği %100 ortaktır.
    kosullar.push({ alan: "botClass", op: "==", deger: k.botClass });

    // UA ailesi → temsili bir "ua contains <belirteç>" koşuluna çevir.
    // Aile belirteci ham UA'da geçen sağlam bir alt-dizedir.
    const uaBelirtec = uaBelirteci(k.uaAil);
    if (uaBelirtec) {
      const oran = k.uyeler.filter((e) => e.ua.toLowerCase().includes(uaBelirtec.toLowerCase())).length / n;
      if (oran >= KOSUL_ESIK) kosullar.push({ alan: "ua", op: "contains", deger: uaBelirtec });
    }

    // ASN — kümede baskınsa ekle.
    if (k.asn && k.asn !== "AS?") {
      const oran = k.uyeler.filter((e) => asnKisa(e.asn) === k.asn).length / n;
      if (oran >= KOSUL_ESIK) kosullar.push({ alan: "asn", op: "contains", deger: k.asn });
    }

    // Yol öneki — kümede baskınsa ekle.
    if (k.yol && k.yol !== "/") {
      const oran = k.uyeler.filter((e) => yolOneki(e.path) === k.yol).length / n;
      if (oran >= KOSUL_ESIK) kosullar.push({ alan: "path", op: "contains", deger: k.yol });
    }

    // Skor bandı — üyelerin çoğu belirli bir tavanın altındaysa scoreMax koşulu ekle.
    const skorlar = k.uyeler.map((e) => e.score).sort((a, b) => a - b);
    const p90 = skorlar[Math.min(skorlar.length - 1, Math.floor(skorlar.length * 0.9))];
    // Tavanı bir üst 0.1 dilimine yuvarla (0.28 → 0.3) ki kenar olaylar da girsin.
    const scoreMax = Math.min(1, Math.ceil((p90 + 0.001) * 10) / 10);
    if (scoreMax < 0.6) {
      const oran = k.uyeler.filter((e) => e.score < scoreMax).length / n;
      if (oran >= KOSUL_ESIK) kosullar.push({ alan: "score", op: "<", deger: String(scoreMax) });
    }

    // 4) Kesinlik/kapsama — bu koşulları TÜM olaylar üzerinde çalıştır.
    const aday = adayImza(kosullar);
    const eslesenler = events.filter((e) => imzaEslesir(e, aday));
    const eslesenKotu = eslesenler.filter(kotuMu).length;
    const eslesenToplam = eslesenler.length;
    // Kesinlik: eşleşenlerin kaçı gerçekten kötü.
    const kesinlik = eslesenToplam === 0 ? 0 : Math.round((eslesenKotu / eslesenToplam) * 100);
    // Kapsama: tüm kötü olayların kaçını yakalar.
    const kapsama = Math.round((eslesenKotu / toplamKotu) * 100);
    // Destek: küme büyüklüğünün log-ölçekli katkısı (tekil küme aşırı ödüllenmesin).
    const destek = Math.min(100, Math.round((Math.log2(n + 1) / Math.log2(toplamKotu + 1)) * 100));

    // 5) Kalite = kesinlik ağırlıklı + kapsama + destek.
    const kalite = Math.round(kesinlik * 0.55 + kapsama * 0.3 + destek * 0.15);

    const ortSkor = Math.round((skorlar.reduce((a, b) => a + b, 0) / n) * 100) / 100;
    const kategori = kategoriTuret(k.botClass, k.uaAil);
    const siddet = siddetTuret(kalite, ortSkor);
    const id = "SIG-MINED-" + fnv1a(k.anahtar).toUpperCase();

    // Örnek olayları en düşük skorlulardan (en net kötüler) seç.
    const ornek = [...k.uyeler]
      .sort((a, b) => a.score - b.score)
      .slice(0, 6)
      .map((e) => ({
        ip: e.ip,
        country: e.country,
        path: e.path,
        ua: e.ua,
        score: e.score,
        botClass: e.botClass,
      }));

    sonuc.push({
      id,
      ad: otoAd(k.uaAil, k.asn, k.yol, k.botClass),
      kosullar,
      birlestir: "and",
      uyeSayisi: n,
      kesinlik,
      kapsama,
      kalite,
      kategori,
      siddet,
      taktik: TAKTIK[kategori] ?? "Otomatik erişim",
      ozellikler: { uaAilesi: k.uaAil, asn: k.asn, yolOneki: k.yol, botClass: k.botClass, ortSkor },
      ornekOlaylar: ornek,
    });
  }

  // Kaliteye göre azalan sırala (eşitlikte kapsama, sonra üye).
  sonuc.sort((a, b) => b.kalite - a.kalite || b.kapsama - a.kapsama || b.uyeSayisi - a.uyeSayisi);
  return sonuc;
}

/**
 * UA ailesi → ham UA içinde aranabilir sağlam belirteç. `ua contains <x>`
 * koşulu bu belirteci kullanır. Tarayıcı-benzeri aileler için (spoof riski)
 * belirteç üretmeyiz — o kümelerde imza botClass/asn/path'e dayanır.
 */
function uaBelirteci(uaAil: string): string | null {
  const map: Record<string, string> = {
    "python-requests": "python-requests",
    aiohttp: "aiohttp",
    python: "python",
    curl: "curl",
    wget: "wget",
    "go-http": "Go-http",
    "java-http": "Java",
    "node-http": "axios",
    scrapy: "Scrapy",
    "headless-chrome": "HeadlessChrome",
    phantomjs: "PhantomJS",
    playwright: "Playwright",
    puppeteer: "Puppeteer",
    selenium: "Selenium",
    gptbot: "GPTBot",
    claudebot: "ClaudeBot",
    perplexitybot: "Perplexity",
    ccbot: "CCBot",
    bytespider: "Bytespider",
  };
  return map[uaAil] ?? null;
}

/* ------------------------------------------------------------------ Özet */

export function madencilikOzet(imzalar: MadenImza[]): MadencilikOzet {
  const toplamImza = imzalar.length;
  const yuksekKalite = imzalar.filter((i) => i.kalite >= 70).length;
  const otoOnaylanabilir = imzalar.filter((i) => i.kesinlik >= 90 && i.kalite >= 75).length;

  // Birleşik kapsama tahmini: kapsamalar örtüşebileceğinden basitçe TOPLAMAK
  // yanıltıcı olur (>%100). Örtüşmeyi göz ardı eden ama tavanlanan bir tahmin:
  // en yüksek kapsamalı imzayı baz al, kalanların katkısını azalan ağırlıkla ekle.
  const sirali = [...imzalar].map((i) => i.kapsama).sort((a, b) => b - a);
  let toplamKapsama = 0;
  let kalan = 100;
  for (const kap of sirali) {
    // Kalan yakalanmamış payın bu imza tarafından yakalanan kısmı (kaba tahmin).
    const katki = Math.round((kap / 100) * kalan);
    toplamKapsama += katki;
    kalan -= katki;
    if (kalan <= 0) break;
  }
  toplamKapsama = Math.min(100, toplamKapsama);

  return { toplamImza, yuksekKalite, toplamKapsama, otoOnaylanabilir };
}

/** Koşulları /panel/imza tarzı kural-desen string'ine çevirir (görsel için). */
export function kosulDesenMetin(imza: MadenImza): string {
  const ayrac = imza.birlestir === "or" ? " or " : " and ";
  return imza.kosullar.map((k) => `${k.alan} ${k.op} "${k.deger}"`).join(ayrac);
}
