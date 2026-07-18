/**
 * Specter — Coğrafi & ASN Risk Puanlama Motoru (saf, deterministik)
 * =================================================================
 * Gözlemlenen gerçek trafikten ülke ve ASN (ağ operatörü) bazında bot/saldırı
 * riskini puanlar. Amaç: tehdidin NEREDEN geldiğini görünür kılıp aksiyona
 * (allowlist / challenge / block) bağlamak.
 *
 * Neden değerli?
 *   - Ülke riski: belirli coğrafyalar orantısız bot/atak üretir. Gerçek
 *     kullanıcının olmadığı ülkelerden gelen yüksek hacim = otomasyon işareti.
 *   - ASN riski: BURASI derin kısım. Meşru insanlar veri merkezlerinden /
 *     hosting sağlayıcılarından tarama yapmaz. DigitalOcean, AWS, Hetzner gibi
 *     datacenter ASN'leri bot kaynaklarının başında gelir. IP itibar
 *     kategorileri (datacenter/tor/vpn/malicious) bunu doğrular.
 *
 * TASARIM İLKESİ — SAF & DETERMİNİSTİK:
 *   Bu dosyada `Date.now()`, argümansız `new Date()` ya da `Math.random()` YOK.
 *   Girdi (olaylar + IP itibarı) aynıysa çıktı DAİMA aynıdır → birim test
 *   edilebilir. Tüm sıralamalar kararlı (eşitlikte ikincil anahtar) yapılır.
 */

import type { BotEvent, IpReputation, BotClass } from "@/lib/db/schema";

/* ------------------------------------------------------------------ Tipler */

export type RiskSeviye = "dusuk" | "orta" | "yuksek" | "kritik";

/** Tek bir ülkenin risk profili. */
export interface UlkeRisk {
  ulke: string; // ISO2 (örn "RU")
  toplam: number; // toplam istek
  engellenen: number; // blocked verdict sayısı
  challenge: number; // challenged verdict sayısı
  botOran: number; // 0..1 — bot sınıfı olayların oranı
  ortSkor: number; // 0..1 — ortalama insanlık skoru (düşük = bot)
  tekilIp: number; // benzersiz IP sayısı
  baskinBotClass: BotClass; // en sık görülen bot sınıfı
  riskPuan: number; // 0..100
  seviye: RiskSeviye;
}

/** Tek bir ASN'in (ağ operatörü) risk profili. */
export interface AsnRisk {
  asn: string; // "AS14061 DigitalOcean, LLC"
  asnKod: string; // "AS14061"
  asnAd: string; // "DigitalOcean, LLC"
  ulkeler: string[]; // bu ASN'in görüldüğü ülkeler (ISO2)
  toplam: number;
  engellenen: number;
  challenge: number;
  botOran: number; // 0..1
  ortSkor: number; // 0..1
  tekilIp: number;
  baskinBotClass: BotClass;
  /** İtibar kategorisi datacenter/tor/vpn/malicious olan tekil IP sayısı. */
  kotuItibarIp: number;
  /** Yalnızca datacenter kategorisindeki tekil IP sayısı. */
  datacenterIp: number;
  /** Bu ASN datacenter/hosting ağırlıklı mı (bkz. datacenterMi()). */
  datacenterAgirlikli: boolean;
  riskPuan: number; // 0..100
  seviye: RiskSeviye;
}

/** Coğrafi risk özeti (üst-seviye kartlar için). */
export interface GeoOzet {
  toplamUlke: number;
  yuksekRiskUlke: number; // seviye yuksek+kritik
  toplamAsn: number;
  yuksekRiskAsn: number; // seviye yuksek+kritik
  enRiskliUlke: UlkeRisk | null;
  enRiskliAsn: AsnRisk | null;
}

/* ------------------------------------------------------------------ Sabitler & yardımcılar */

/** İtibar açısından "kötü" (meşru insan trafiği beklenmeyen) kategoriler. */
const KOTU_ITIBAR: ReadonlySet<IpReputation["category"]> = new Set([
  "datacenter",
  "tor",
  "vpn",
  "malicious",
]);

/**
 * Bir ASN adından datacenter/hosting sağlayıcısı olup olmadığını tahmin eder.
 * İki sinyal birleşir (çağıran tarafta):
 *   1) ASN adı bilinen hosting/bulut operatörü anahtar kelimeleri içeriyor mu?
 *   2) O ASN'den gelen tekil IP'lerin itibar kategorisi datacenter mı?
 * Bu fonksiyon YALNIZCA (1)'i (ad-tabanlı sezgi) uygular; saf ve girdi-bağımsız.
 *
 * Meşru son-kullanıcılar mobil/geniş bant ISP'lerden gelir; datacenter'dan
 * tarama yapan neredeyse daima bir bottur (scraper, headless tarayıcı, ajan).
 */
export function datacenterMi(asnAd: string): boolean {
  const s = asnAd.toLowerCase();
  const anahtarlar = [
    "digitalocean",
    "amazon",
    "aws",
    "google cloud",
    "google llc", // GCP/ölçekli tarama kaynağı
    "microsoft",
    "azure",
    "hetzner",
    "ovh",
    "linode",
    "akamai",
    "cloudflare",
    "vultr",
    "leaseweb",
    "contabo",
    "scaleway",
    "oracle",
    "alibaba",
    "tencent",
    "choopa",
    "datacamp",
    "hosting",
    "cloud",
    "server",
    "datacenter",
    "data center",
    "colocation",
    "vps",
    "dedicated",
  ];
  return anahtarlar.some((k) => s.includes(k));
}

/** "AS14061 DigitalOcean, LLC" → { kod: "AS14061", ad: "DigitalOcean, LLC" }. */
export function asnAyristir(asn: string): { kod: string; ad: string } {
  const m = /^\s*(AS\d+)\s*(.*)$/i.exec(asn ?? "");
  if (m) return { kod: m[1].toUpperCase(), ad: m[2].trim() || m[1].toUpperCase() };
  return { kod: asn || "AS?", ad: asn || "Bilinmeyen" };
}

/** 0..100 puanı risk seviyesine çevirir. */
export function riskSeviye(puan: number): RiskSeviye {
  if (puan >= 75) return "kritik";
  if (puan >= 50) return "yuksek";
  if (puan >= 25) return "orta";
  return "dusuk";
}

/** Risk seviyesi için tutarlı renk (grafikler + rozetler ile uyumlu). */
export function seviyeRenk(seviye: RiskSeviye): string {
  switch (seviye) {
    case "kritik":
      return "#dc2626"; // kırmızı
    case "yuksek":
      return "#ea580c"; // turuncu
    case "orta":
      return "#d97706"; // amber
    default:
      return "#16a34a"; // yeşil
  }
}

/** 0..1'e sıkıştır (savunmacı; NaN → 0). */
function kis01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** 0..100'e sıkıştır ve yuvarla. */
function puan100(v: number): number {
  if (!Number.isFinite(v)) return 0;
  const c = v < 0 ? 0 : v > 100 ? 100 : v;
  return Math.round(c);
}

/** Bir olayın botClass'ı "insan" değilse bot sayılır. */
function botMu(botClass: BotClass): boolean {
  return botClass !== "human";
}

/**
 * Bir olay grubundan baskın (en sık) botClass'ı bulur. Kararlı: eşit sayıda
 * ise alfabetik olarak ilk gelen seçilir (deterministik). Grup boşsa "human".
 */
function baskinBotClass(sayac: Map<BotClass, number>): BotClass {
  let enIyi: BotClass = "human";
  let enCok = -1;
  // Anahtarları sıralayarak gez → eşitlikte kararlı seçim.
  const anahtarlar = [...sayac.keys()].sort();
  for (const k of anahtarlar) {
    const c = sayac.get(k) ?? 0;
    if (c > enCok) {
      enCok = c;
      enIyi = k;
    }
  }
  return enIyi;
}

/* ------------------------------------------------------------------ Risk formülü */

/**
 * Ortak risk çekirdeği (0..100). Dört sinyali ağırlıklı birleştirir:
 *   - botOran (bot sınıfı olay oranı) — en güçlü sinyal
 *   - engelOran (blocked/challenged verdict oranı)
 *   - düşük insanlık skoru (1 - ortSkor)
 *   - hacim faktörü (logaritmik; çok istek riski hafifçe yükseltir)
 * Opsiyonel `itibarBonus` (0..1) ASN'ler için kötü-itibar/datacenter katkısı.
 */
function riskCekirdek(opts: {
  botOran: number;
  engelOran: number;
  ortSkor: number;
  toplam: number;
  itibarBonus?: number; // 0..1
}): number {
  const botOran = kis01(opts.botOran);
  const engelOran = kis01(opts.engelOran);
  const dusukInsan = kis01(1 - opts.ortSkor);
  // Hacim faktörü: 0 istekte 0, ~200+ istekte ~1'e doyar (log ölçek).
  const hacim = kis01(Math.log10(Math.max(1, opts.toplam)) / Math.log10(200));
  const itibar = kis01(opts.itibarBonus ?? 0);

  // Ağırlıklar toplamı 1.0 (itibar bonusu ayrı, üstüne biner).
  let puan =
    botOran * 42 + // bot oranı baskın
    engelOran * 24 + // engel/challenge oranı
    dusukInsan * 20 + // düşük insanlık skoru
    hacim * 14; // hacim

  // İtibar bonusu: datacenter/tor/vpn/malicious IP yoğunluğu riski yükseltir.
  // En fazla +22 puan ekler (ASN'lerde kritik ayırt edici).
  puan += itibar * 22;

  return puan100(puan);
}

/* ------------------------------------------------------------------ Ülke risk puanlama */

/**
 * Ülke bazında risk. Her ISO2 ülke için hacim, engellenen, bot oranı,
 * ortalama insanlık skoru, tekil IP ve baskın bot sınıfı toplanır; riskPuan
 * türetilir. Sonuç risk azalan (yüksek→düşük) sıralanır; eşitlikte hacme,
 * sonra ülke koduna göre kararlı sıralama.
 */
export function ulkeRiskPuanla(events: BotEvent[]): UlkeRisk[] {
  interface Biriktir {
    toplam: number;
    engellenen: number;
    challenge: number;
    botSayi: number;
    skorToplam: number;
    ipler: Set<string>;
    botClassSayac: Map<BotClass, number>;
  }
  const harita = new Map<string, Biriktir>();

  for (const e of events) {
    const ulke = (e.country || "??").toUpperCase();
    let b = harita.get(ulke);
    if (!b) {
      b = {
        toplam: 0,
        engellenen: 0,
        challenge: 0,
        botSayi: 0,
        skorToplam: 0,
        ipler: new Set(),
        botClassSayac: new Map(),
      };
      harita.set(ulke, b);
    }
    b.toplam++;
    if (e.verdict === "blocked") b.engellenen++;
    if (e.verdict === "challenged") b.challenge++;
    if (botMu(e.botClass)) {
      b.botSayi++;
      b.botClassSayac.set(e.botClass, (b.botClassSayac.get(e.botClass) ?? 0) + 1);
    }
    b.skorToplam += kis01(e.score);
    if (e.ip) b.ipler.add(e.ip);
  }

  const sonuc: UlkeRisk[] = [];
  for (const [ulke, b] of harita) {
    const botOran = b.toplam ? b.botSayi / b.toplam : 0;
    const engelOran = b.toplam ? (b.engellenen + b.challenge) / b.toplam : 0;
    const ortSkor = b.toplam ? b.skorToplam / b.toplam : 0;
    const riskPuan = riskCekirdek({ botOran, engelOran, ortSkor, toplam: b.toplam });
    sonuc.push({
      ulke,
      toplam: b.toplam,
      engellenen: b.engellenen,
      challenge: b.challenge,
      botOran,
      ortSkor,
      tekilIp: b.ipler.size,
      baskinBotClass: baskinBotClass(b.botClassSayac),
      riskPuan,
      seviye: riskSeviye(riskPuan),
    });
  }

  // Risk azalan; eşitlikte hacim azalan; sonra ülke kodu artan (kararlı).
  sonuc.sort(
    (a, z) => z.riskPuan - a.riskPuan || z.toplam - a.toplam || a.ulke.localeCompare(z.ulke),
  );
  return sonuc;
}

/* ------------------------------------------------------------------ ASN risk puanlama */

/**
 * ASN (ağ operatörü) bazında risk. Ülke puanlamasının tüm metriklerine ek
 * olarak IP itibarını devreye sokar: bu ASN'e ait tekil IP'lerin kaçı
 * datacenter/tor/vpn/malicious kategorisinde? Meşru insanlar veri
 * merkezlerinden gelmediği için bu ASN'ler daha yüksek risk taşır.
 *
 * datacenterAgirlikli bayrağı iki kanaldan biriyle set edilir:
 *   (a) ASN adı bilinen hosting/bulut operatörü (datacenterMi), VEYA
 *   (b) tekil IP'lerinin belirgin kısmı (>= %40) datacenter itibarında.
 *
 * Sonuç risk azalan sıralanır (eşitlikte hacim, sonra ASN kodu — kararlı).
 */
export function asnRiskPuanla(events: BotEvent[], ipRep: IpReputation[]): AsnRisk[] {
  // IP → itibar kategorisi (hızlı arama).
  const ipKategori = new Map<string, IpReputation["category"]>();
  for (const r of ipRep) ipKategori.set(r.ip, r.category);

  interface Biriktir {
    toplam: number;
    engellenen: number;
    challenge: number;
    botSayi: number;
    skorToplam: number;
    ipler: Set<string>;
    ulkeler: Set<string>;
    botClassSayac: Map<BotClass, number>;
  }
  const harita = new Map<string, Biriktir>();

  for (const e of events) {
    const asn = e.asn || "AS? Bilinmeyen";
    let b = harita.get(asn);
    if (!b) {
      b = {
        toplam: 0,
        engellenen: 0,
        challenge: 0,
        botSayi: 0,
        skorToplam: 0,
        ipler: new Set(),
        ulkeler: new Set(),
        botClassSayac: new Map(),
      };
      harita.set(asn, b);
    }
    b.toplam++;
    if (e.verdict === "blocked") b.engellenen++;
    if (e.verdict === "challenged") b.challenge++;
    if (botMu(e.botClass)) {
      b.botSayi++;
      b.botClassSayac.set(e.botClass, (b.botClassSayac.get(e.botClass) ?? 0) + 1);
    }
    b.skorToplam += kis01(e.score);
    if (e.ip) b.ipler.add(e.ip);
    if (e.country) b.ulkeler.add(e.country.toUpperCase());
  }

  const sonuc: AsnRisk[] = [];
  for (const [asn, b] of harita) {
    const { kod, ad } = asnAyristir(asn);

    // İtibar sayımı: bu ASN'in tekil IP'lerini kategorilere göre say.
    let kotuItibarIp = 0;
    let datacenterIp = 0;
    for (const ip of b.ipler) {
      const kat = ipKategori.get(ip);
      if (kat && KOTU_ITIBAR.has(kat)) kotuItibarIp++;
      if (kat === "datacenter") datacenterIp++;
    }
    const tekilIp = b.ipler.size;
    const kotuOran = tekilIp ? kotuItibarIp / tekilIp : 0;
    const dcOran = tekilIp ? datacenterIp / tekilIp : 0;

    // Datacenter ağırlıklı mı: ad-sinyali VEYA IP'lerin >= %40'ı datacenter.
    const datacenterAgirlikli = datacenterMi(ad) || dcOran >= 0.4;

    const botOran = b.toplam ? b.botSayi / b.toplam : 0;
    const engelOran = b.toplam ? (b.engellenen + b.challenge) / b.toplam : 0;
    const ortSkor = b.toplam ? b.skorToplam / b.toplam : 0;

    // İtibar bonusu: kötü-itibar oranı + datacenter işareti birleşir (0..1).
    // Datacenter ağırlıklı ASN'ler taban 0.5 bonus alır (insanlar oradan gelmez).
    const itibarBonus = kis01(kotuOran * 0.7 + (datacenterAgirlikli ? 0.5 : 0) * 0.6);

    const riskPuan = riskCekirdek({ botOran, engelOran, ortSkor, toplam: b.toplam, itibarBonus });

    sonuc.push({
      asn,
      asnKod: kod,
      asnAd: ad,
      ulkeler: [...b.ulkeler].sort(),
      toplam: b.toplam,
      engellenen: b.engellenen,
      challenge: b.challenge,
      botOran,
      ortSkor,
      tekilIp,
      baskinBotClass: baskinBotClass(b.botClassSayac),
      kotuItibarIp,
      datacenterIp,
      datacenterAgirlikli,
      riskPuan,
      seviye: riskSeviye(riskPuan),
    });
  }

  sonuc.sort(
    (a, z) => z.riskPuan - a.riskPuan || z.toplam - a.toplam || a.asnKod.localeCompare(z.asnKod),
  );
  return sonuc;
}

/* ------------------------------------------------------------------ Özet */

/** Üst-seviye kartlar için özet metrikler türetir. */
export function geoOzet(ulkeRiskler: UlkeRisk[], asnRiskler: AsnRisk[]): GeoOzet {
  const yuksek = (s: RiskSeviye) => s === "yuksek" || s === "kritik";
  return {
    toplamUlke: ulkeRiskler.length,
    yuksekRiskUlke: ulkeRiskler.filter((u) => yuksek(u.seviye)).length,
    toplamAsn: asnRiskler.length,
    yuksekRiskAsn: asnRiskler.filter((a) => yuksek(a.seviye)).length,
    // Listeler zaten risk azalan sıralı → ilk eleman en riskli.
    enRiskliUlke: ulkeRiskler[0] ?? null,
    enRiskliAsn: asnRiskler[0] ?? null,
  };
}
