/**
 * Specter — Kampanya İlişkilendirme (Attack Campaign Correlation)
 * ===============================================================
 * Tekil bot olaylarını KAMPANYALARA kümeler. Amaç: operatörün "3 gün
 * boyunca 340 olay ASLINDA tek bir koordineli operasyon" gerçeğini gürültü
 * yerine görmesi. MITRE/Mandiant'ın aktiviteyi "intrusion set" olarak
 * gruplaması gibi — ama burada gerçek zaman-serisi kümeleme ile.
 *
 * Bu dosya SAF ve DETERMİNİSTİKtir: Date.now / Math.random KULLANILMAZ.
 * "Şimdi" referansı olaylardaki en büyük ts'tir (en yeni olay). Böylece
 * aynı girdi her zaman aynı kampanyaları üretir (test edilebilir).
 *
 * NOT (dürüstlük): Kampanyalar GERÇEK olaylardan sezgisel kümeleme ile
 * ÇIKARILIR. Etiketler (ad, sofistike skor, tehdit seviyesi) buluşsal
 * gruplamadır — gerçek isimlendirilmiş tehdit gruplarına atfedilmez.
 */

import type { BotEvent, BotClass } from "@/lib/db/schema";

/* ------------------------------------------------------------------ Türler */

/** Bir kampanyanın zaman-serisi kovası (sparkline için). */
export interface KampanyaKova {
  /** Kova başlangıç ts'i (ms). */
  ts: number;
  /** Bu kovadaki olay sayısı. */
  sayi: number;
}

export type TehditSeviyesi = "düşük" | "orta" | "yüksek" | "kritik";
export type KampanyaDurum = "aktif" | "sönümleniyor" | "kapandı";

/**
 * Sofistike sinyali — yapısal veri (metin DEĞİL). İstemci `anahtar`a göre
 * seçili dilde şablonu doldurur; `n` gömülü sayıdır. Böylece sinyal metni lib'e
 * bağlı kalmadan tüm dillerde doğru üretilir.
 */
export interface SofistikeSinyal {
  /** Kararlı sinyal kodu (enum değil, i18n anahtarı). */
  anahtar: "ipCesit" | "asnCesit" | "kacinma" | "hiz" | "cografya";
  /** Şablona gömülecek sayı (IP sayısı, ASN sayısı, yüzde, olay/saat, ülke sayısı). */
  n: number;
}

/** Kümelenmiş tek bir saldırı kampanyası. */
export interface Kampanya {
  id: string;
  /** Deterministik ad (aktör-ailesi + saldırı-türü tabanlı). */
  ad: string;
  /** Kampanyaya katkı veren ASN'ler (en sık üstte). */
  asnlar: string[];
  /** Kaynak ülkeler (ISO2, en sık üstte). */
  ulkeler: string[];
  /** Baskın bot sınıfı. */
  botClass: BotClass;
  /** İlk görülme (min ts). */
  ilkGorulme: number;
  /** Son görülme (max ts). */
  sonGorulme: number;
  /** Süre (saat). */
  sureSaat: number;
  /** Toplam olay sayısı. */
  olaySayisi: number;
  /** Benzersiz IP sayısı. */
  benzersizIp: number;
  /** En yoğun saatteki olay sayısı (zirve). */
  zirveSaat: number;
  /** Zirvenin gerçekleştiği kova ts'i. */
  zirveTs: number;
  /** Sofistike skoru (0-100). */
  sofistikeSkor: number;
  /** Tehdit seviyesi. */
  tehditSeviyesi: TehditSeviyesi;
  /** Yaşam döngüsü durumu. */
  durum: KampanyaDurum;
  /** Örnek IP'ler (adli inceleme için, en fazla 6). */
  ornekIpler: string[];
  /** Zaman serisi (sparkline) — eşit aralıklı kovalar. */
  zamanSerisi: KampanyaKova[];
  /** En sık hedeflenen yollar. */
  hedefYollar: string[];
  /** İnsan-okur açıklama (nasıl kümelendi). */
  aciklama: string;
  /** Sofistike skoruna katkı veren sinyaller (yapısal — istemcide çevrilir). */
  sinyaller: SofistikeSinyal[];
  /**
   * Baskın UA-ailesi anahtarı (ör. "python-http"). İstemci, kampanya adını ve
   * açıklamasını seçili dilde yeniden türetirken kullanır (i18n). Enum değil,
   * kararlı bir anahtar dizesidir; çeviri istemcide yapılır.
   */
  uaAileAnahtar: string;
}

export interface KampanyaOzet {
  toplamKampanya: number;
  aktif: number;
  kritik: number;
  /** En büyük kampanyanın adı (olay sayısına göre). */
  enBuyukKampanya: string;
  /** İlişkilendirme oranı: kampanyalara atanan olay / toplam olay (0..1). */
  iliskilendirmeOrani: number;
}

/* ------------------------------------------------------------------ Sabitler */

const SAAT = 3_600_000;
/** Aynı gruptaki iki olay bu süreden fazla ayrıksa yeni patlama penceresi başlar. */
const PATLAMA_BOSLUK = 6 * SAAT;
/** Bir kampanya sayılması için gereken asgari olay (altındakiler gürültü). */
const MIN_OLAY = 4;
/** Sparkline için hedeflenen kova sayısı. */
const KOVA_SAYISI = 24;

/* ------------------------------------------------------------------ Yardımcılar */

/** ASN dizesinden kısa etiket çıkarır: "AS9009 M247 Ltd" → "AS9009". */
function asnKisa(asn: string): string {
  const m = /^(AS\d+)/i.exec(asn.trim());
  return m ? m[1].toUpperCase() : asn.trim().split(/\s+/)[0] || "AS?";
}

/** ASN dizesinden sağlayıcı adını çıkarır: "AS9009 M247 Ltd" → "M247 Ltd". */
function asnSaglayici(asn: string): string {
  return asn.replace(/^AS\d+\s*/i, "").trim() || asnKisa(asn);
}

/**
 * UA'dan kaba aile imzası çıkarır. Sürüm numaraları ATILIR ki aynı araç
 * farklı sürümlerle gelse de tek aileye düşsün. Deterministik.
 */
function uaAile(ua: string): string {
  const u = (ua || "").toLowerCase();
  if (!u) return "boş-ua";
  if (u.includes("python") || u.includes("requests") || u.includes("aiohttp") || u.includes("httpx")) return "python-http";
  if (u.includes("curl")) return "curl";
  if (u.includes("go-http") || u.includes("okhttp")) return "go/okhttp";
  if (u.includes("headless") || u.includes("puppeteer") || u.includes("playwright")) return "headless-tarayıcı";
  if (u.includes("selenium") || u.includes("webdriver")) return "selenium";
  if (u.includes("scrapy") || u.includes("node-fetch") || u.includes("axios")) return "script-scraper";
  if (u.includes("gptbot") || u.includes("claudebot") || u.includes("perplexity") || u.includes("ccbot")) return "ai-ajan";
  if (u.includes("bot") || u.includes("spider") || u.includes("crawl")) return "genel-bot";
  if (u.includes("chrome")) return "chrome-benzeri";
  if (u.includes("firefox")) return "firefox-benzeri";
  if (u.includes("safari")) return "safari-benzeri";
  return "diğer";
}

/** botClass → Türkçe saldırı-türü adı (kampanya adlandırması için). */
const SALDIRI_ADI: Record<BotClass, string> = {
  human: "İnsan Trafiği",
  good_bot: "İyi-Bot Aktivitesi",
  automation: "Otomasyon Kampanyası",
  scraper: "İçerik Kazıma Kampanyası",
  credential_stuffing: "Kimlik-Doldurma Kampanyası",
  ai_agent: "AI-Ajan Kampanyası",
  ddos: "DDoS Kampanyası",
  spam: "Spam Kampanyası",
};

/**
 * Deterministik id: composite anahtar + pencere başlangıcından türetilir.
 * Aynı küme her zaman aynı id'yi alır (crypto/random YOK).
 */
function kampanyaId(anahtar: string, pencereBaslangic: number): string {
  let h = 2166136261;
  const s = `${anahtar}|${pencereBaslangic}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return "kmp_" + (h >>> 0).toString(36);
}

/** Bir sayaç haritasına ekler. */
function say<T>(harita: Map<T, number>, k: T): void {
  harita.set(k, (harita.get(k) ?? 0) + 1);
}

/** Sayaç haritasını sıklığa göre azalan sıralı anahtar dizisine çevirir. */
function sirali<T>(harita: Map<T, number>): T[] {
  return [...harita.entries()].sort((a, b) => b[1] - a[1]).map((e) => e[0]);
}

/* ------------------------------------------------------------------ Sofistike skoru */

/**
 * Deterministik sofistike skorlayıcı (0-100). Bir kampanyanın ne kadar
 * "gelişmiş/organize" olduğunu ölçer. Bileşenler:
 *  - IP çeşitliliği: dağıtık altyapı (çok IP) → daha sofistike.
 *  - ASN sayısı: birden çok ağ/sağlayıcı → koordinasyon.
 *  - Kaçınma oranı: headless / TLS-UA uyumsuzluğu / otomasyon bayrağı oranı.
 *  - Hız: saat başına olay yoğunluğu (yüksek = otomatik/altyapılı).
 *  - Ülke yayılımı: coğrafi dağıtım.
 * Her bileşen 0..1'e normalize edilir, ağırlıklı toplanır.
 */
function sofistikeHesapla(
  olaylar: BotEvent[],
  benzersizIp: number,
  asnSayisi: number,
  ulkeSayisi: number,
  sureSaat: number,
): { skor: number; sinyaller: SofistikeSinyal[] } {
  const n = olaylar.length;
  const sinyaller: SofistikeSinyal[] = [];

  // IP çeşitliliği: ~40 benzersiz IP'de doygun.
  const ipCesit = Math.min(1, benzersizIp / 40);
  if (benzersizIp >= 15) sinyaller.push({ anahtar: "ipCesit", n: benzersizIp });

  // ASN sayısı: 4+ ağ tam puan.
  const asnCesit = Math.min(1, (asnSayisi - 1) / 3);
  if (asnSayisi >= 2) sinyaller.push({ anahtar: "asnCesit", n: asnSayisi });

  // Kaçınma oranı: headless / tls-ua-uyumsuz / otomasyon bayrağı olan olay oranı.
  let kacinma = 0;
  for (const e of olaylar) {
    if (e.headless || e.tlsUaUyumsuz || (e.automationFlags && e.automationFlags.length > 0)) kacinma++;
  }
  const kacinmaOran = n > 0 ? kacinma / n : 0;
  if (kacinmaOran >= 0.25) sinyaller.push({ anahtar: "kacinma", n: Math.round(kacinmaOran * 100) });

  // Hız: saat başına olay. ~30/saat doygun.
  const hiz = sureSaat > 0 ? n / sureSaat : n;
  const hizNorm = Math.min(1, hiz / 30);
  if (hiz >= 12) sinyaller.push({ anahtar: "hiz", n: Math.round(hiz) });

  // Ülke yayılımı: 5+ ülke tam puan.
  const cogNorm = Math.min(1, (ulkeSayisi - 1) / 4);
  if (ulkeSayisi >= 3) sinyaller.push({ anahtar: "cografya", n: ulkeSayisi });

  const skor = Math.round(
    100 * (0.26 * ipCesit + 0.2 * asnCesit + 0.26 * kacinmaOran + 0.16 * hizNorm + 0.12 * cogNorm),
  );
  return { skor: Math.max(0, Math.min(100, skor)), sinyaller };
}

/** Sofistike skoru + olay hacminden tehdit seviyesi türetir. */
function tehditSeviyesiHesapla(skor: number, olaySayisi: number): TehditSeviyesi {
  // Hacim skoru biraz yukarı iter — çok olaylı kampanya daha tehlikeli.
  const efektif = skor + Math.min(15, Math.floor(olaySayisi / 30));
  if (efektif >= 70) return "kritik";
  if (efektif >= 48) return "yüksek";
  if (efektif >= 26) return "orta";
  return "düşük";
}

/**
 * Durum: son olayın en yeni olaya (referans "şimdi") ne kadar yakın
 * olduğuna göre. 3 saat içinde → aktif; 24 saat içinde → sönümleniyor;
 * daha eski → kapandı.
 */
function durumHesapla(sonGorulme: number, referansSon: number): KampanyaDurum {
  const yas = referansSon - sonGorulme;
  if (yas <= 3 * SAAT) return "aktif";
  if (yas <= 24 * SAAT) return "sönümleniyor";
  return "kapandı";
}

/* ------------------------------------------------------------------ Zaman serisi */

/**
 * Bir patlama penceresini eşit KOVA_SAYISI kovaya böler ve olayları sayar
 * (sparkline). Kova genişliği pencereye göre uyarlanır.
 */
function zamanSerisiKur(olaylar: BotEvent[], ilk: number, son: number): { seri: KampanyaKova[]; zirve: number; zirveTs: number } {
  const span = Math.max(1, son - ilk);
  const kovaGen = Math.max(1, Math.ceil(span / KOVA_SAYISI));
  const kovalar: KampanyaKova[] = [];
  for (let i = 0; i < KOVA_SAYISI; i++) {
    kovalar.push({ ts: ilk + i * kovaGen, sayi: 0 });
  }
  for (const e of olaylar) {
    let idx = Math.floor((e.ts - ilk) / kovaGen);
    if (idx < 0) idx = 0;
    if (idx >= KOVA_SAYISI) idx = KOVA_SAYISI - 1;
    kovalar[idx].sayi++;
  }
  let zirve = 0;
  let zirveTs = ilk;
  for (const k of kovalar) {
    if (k.sayi > zirve) {
      zirve = k.sayi;
      zirveTs = k.ts;
    }
  }
  return { seri: kovalar, zirve, zirveTs };
}

/* ------------------------------------------------------------------ Ana kümeleme */

/**
 * Olayları kampanyalara kümeler.
 *
 * Algoritma:
 *  1) Her olayı bileşik anahtarla (ASN-kısa + botClass + UA-ailesi) grupla.
 *  2) Her grup içinde olayları ts'e göre sırala ve PATLAMA_BOSLUK'tan büyük
 *     boşluklarda böl → her segment bir aday kampanya penceresidir.
 *  3) MIN_OLAY altındaki pencereleri ele (gürültü).
 *  4) Her kampanya için metrikler + deterministik ad + skor + durum üret.
 *  5) Kampanyaları sofistike*hacim ağırlığına göre sırala.
 *
 * İnsan/iyi-bot sınıfları kampanya sayılmaz (saldırı değil) — filtrelenir.
 */
export function kampanyalariCikar(events: BotEvent[]): Kampanya[] {
  if (!events || events.length === 0) return [];

  // Saldırı olmayan sınıfları ele.
  const kotu = events.filter((e) => e.botClass !== "human" && e.botClass !== "good_bot");
  if (kotu.length === 0) return [];

  // Referans "şimdi": tüm olaylardaki en yeni ts (deterministik).
  let referansSon = 0;
  for (const e of events) if (e.ts > referansSon) referansSon = e.ts;

  // 1) Bileşik anahtara göre grupla.
  const gruplar = new Map<string, BotEvent[]>();
  for (const e of kotu) {
    const anahtar = `${asnKisa(e.asn)}|${e.botClass}|${uaAile(e.ua)}`;
    let arr = gruplar.get(anahtar);
    if (!arr) {
      arr = [];
      gruplar.set(anahtar, arr);
    }
    arr.push(e);
  }

  const kampanyalar: Kampanya[] = [];

  for (const [anahtar, grupOlaylar] of gruplar) {
    // 2) Zamana göre sırala ve patlama pencerelerine böl.
    const sirasal = [...grupOlaylar].sort((a, b) => a.ts - b.ts);
    let pencere: BotEvent[] = [];
    const pencereler: BotEvent[][] = [];
    let onceki = -Infinity;
    for (const e of sirasal) {
      if (pencere.length > 0 && e.ts - onceki > PATLAMA_BOSLUK) {
        pencereler.push(pencere);
        pencere = [];
      }
      pencere.push(e);
      onceki = e.ts;
    }
    if (pencere.length > 0) pencereler.push(pencere);

    // 3) + 4) Her pencereyi kampanyaya dönüştür.
    for (const pOlaylar of pencereler) {
      if (pOlaylar.length < MIN_OLAY) continue; // gürültü

      const ilk = pOlaylar[0].ts;
      const son = pOlaylar[pOlaylar.length - 1].ts;
      const sureSaat = Math.max(0, (son - ilk) / SAAT);

      // Sayaçlar.
      const ipSet = new Set<string>();
      const asnSay = new Map<string, number>();
      const ulkeSay = new Map<string, number>();
      const yolSay = new Map<string, number>();
      const sinifSay = new Map<BotClass, number>();
      for (const e of pOlaylar) {
        ipSet.add(e.ip);
        say(asnSay, e.asn);
        if (e.country) say(ulkeSay, e.country);
        if (e.path) say(yolSay, e.path);
        say(sinifSay, e.botClass);
      }

      const asnlarTam = sirali(asnSay);
      const ulkeler = sirali(ulkeSay);
      const hedefYollar = sirali(yolSay).slice(0, 5);
      const baskinSinif = sirali(sinifSay)[0];
      const benzersizIp = ipSet.size;

      const { seri, zirve, zirveTs } = zamanSerisiKur(pOlaylar, ilk, son);
      const { skor, sinyaller } = sofistikeHesapla(
        pOlaylar,
        benzersizIp,
        asnlarTam.length,
        ulkeler.length,
        sureSaat,
      );
      const tehditSeviyesi = tehditSeviyesiHesapla(skor, pOlaylar.length);
      const durum = durumHesapla(son, referansSon);

      // Deterministik ad: sağlayıcı/ASN etiketi + saldırı türü.
      const anaSaglayici = asnSaglayici(asnlarTam[0]);
      const asnEtiket = asnKisa(asnlarTam[0]);
      const saldiriAdi = SALDIRI_ADI[baskinSinif];
      // "AS9009 (M247) üzerinden Kimlik-Doldurma Kampanyası"
      const ad =
        anaSaglayici && anaSaglayici !== asnEtiket
          ? `${asnEtiket} (${anaSaglayici}) üzerinden ${saldiriAdi}`
          : `${asnEtiket} üzerinden ${saldiriAdi}`;

      const aciklama =
        `${pOlaylar.length} olay, ${benzersizIp} IP ve ${asnlarTam.length} ASN paylaşan koordineli ` +
        `${saldiriAdi.toLowerCase()}. ${asnEtiket} altyapısından ${uaAileEtiket(anahtar)} imzasıyla, ` +
        `${sureSaat < 1 ? "1 saatten kısa" : `~${Math.round(sureSaat)} saatlik`} bir pencerede kümelendi.`;

      kampanyalar.push({
        id: kampanyaId(anahtar, ilk),
        ad,
        asnlar: asnlarTam.slice(0, 5),
        ulkeler: ulkeler.slice(0, 8),
        botClass: baskinSinif,
        ilkGorulme: ilk,
        sonGorulme: son,
        sureSaat: Math.round(sureSaat * 10) / 10,
        olaySayisi: pOlaylar.length,
        benzersizIp,
        zirveSaat: zirve,
        zirveTs,
        sofistikeSkor: skor,
        tehditSeviyesi,
        durum,
        ornekIpler: [...ipSet].slice(0, 6),
        zamanSerisi: seri,
        hedefYollar,
        aciklama,
        sinyaller,
        uaAileAnahtar: uaAileEtiket(anahtar),
      });
    }
  }

  // 5) Tehdit önceliğine göre sırala: önce sofistike*hacim, sonra son görülme.
  kampanyalar.sort((a, b) => {
    const wa = a.sofistikeSkor * Math.log2(a.olaySayisi + 2);
    const wb = b.sofistikeSkor * Math.log2(b.olaySayisi + 2);
    if (wb !== wa) return wb - wa;
    return b.sonGorulme - a.sonGorulme;
  });

  return kampanyalar;
}

/** Bileşik anahtardan UA-ailesi kısmını okunur çıkarır (açıklama için). */
function uaAileEtiket(anahtar: string): string {
  const parcalar = anahtar.split("|");
  return parcalar[2] ?? "bilinmeyen";
}

/* ------------------------------------------------------------------ Özet */

/**
 * Kampanya listesinden üst-düzey özet. İlişkilendirme oranı: kampanyalara
 * atanan olay / toplam olay — gürültüden ne kadar sinyal çıkardığımızın
 * ölçüsü.
 */
export function kampanyaOzet(kampanyalar: Kampanya[], toplamOlay: number): KampanyaOzet {
  let aktif = 0;
  let kritik = 0;
  let enBuyukSayi = -1;
  let enBuyukAd = "—";
  let iliskilendirilen = 0;
  for (const k of kampanyalar) {
    if (k.durum === "aktif") aktif++;
    if (k.tehditSeviyesi === "kritik") kritik++;
    iliskilendirilen += k.olaySayisi;
    if (k.olaySayisi > enBuyukSayi) {
      enBuyukSayi = k.olaySayisi;
      enBuyukAd = k.ad;
    }
  }
  const oran = toplamOlay > 0 ? Math.min(1, iliskilendirilen / toplamOlay) : 0;
  return {
    toplamKampanya: kampanyalar.length,
    aktif,
    kritik,
    enBuyukKampanya: enBuyukAd,
    iliskilendirmeOrani: Math.round(oran * 100) / 100,
  };
}
