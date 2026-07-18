/**
 * Specter — Filo (Fleet) Duruş Hesaplayıcı
 * ========================================
 * MSP / ajans tarzı çok-siteli portföy görünümü için SAF hesaplama katmanı.
 * Bir sahibin koruduğu tüm siteleri yan yana kıyaslamak amacıyla her site
 * için tek bir "duruş" (posture) nesnesi ve filo geneli özet üretir.
 *
 * SAFLIK GARANTİSİ: Bu dosya Date.now(), Math.random() veya argümansız
 * `new Date()` KULLANMAZ. Tüm girdiler parametre olarak gelir; aynı girdi
 * her zaman aynı çıktıyı verir (deterministik). Böylece hem sunucuda hem
 * testte güvenle çalışır ve önbelleklenebilir.
 */

import type { Site, BotEvent, Rule, Alert, BotClass } from "@/lib/db/schema";

/* ------------------------------------------------------------------ Tipler */

/** Tek bir sitenin koruma duruşu — kıyas tablosunun bir satırı. */
export interface SiteDurumu {
  siteId: string;
  ad: string;
  /** Site'nin birincil alan adı (varsa) — kıyas tablosunda gösterilir. */
  domain: string | null;
  mode: Site["mode"];
  difficulty: Site["difficulty"];
  verified: boolean;
  /** İncelenen olay penceresindeki toplam olay sayısı. */
  toplamOlay: number;
  /** Bot (insan olmayan) olay oranı — 0..1. */
  botOran: number;
  /** Engellenen (verdict=blocked) olay sayısı. */
  engellenen: number;
  /** Meydan okunan (verdict=challenged) olay sayısı. */
  meydanOkunan: number;
  /** Benzersiz IP sayısı (olay penceresinde). */
  benzersizIp: number;
  /** Etkin (enabled) kural sayısı. */
  aktifKural: number;
  /** Toplam kural sayısı (etkin + pasif). */
  toplamKural: number;
  /** Açık (status=acik) kritik/yüksek öncelikli olay (alert) sayısı. */
  acikKritikOlay: number;
  /** Koruma skoru 0..100 (engelleme etkinliği + kapsam + doğrulama + kural). */
  korumaSkoru: number;
  /** Bu sitede en baskın tehdit sınıfı (insan/iyi-bot hariç); yoksa null. */
  dominantTehdit: BotClass | null;
  /** Baskın tehdidin olay sayısı. */
  dominantTehditSayi: number;
  /** Son N (varsayılan 12) kova için olay yoğunluğu — mini sparkline verisi. */
  son24Olay: number[];
}

/** Filo geneli birleşik özet. */
export interface FiloOzet {
  toplamSite: number;
  /** Koruma aktif site sayısı (mode !== "monitor"). */
  korunanSite: number;
  /** İzleme-modunda kalan (koruma pasif) site sayısı. */
  izlemeSite: number;
  /** Doğrulanmış site sayısı. */
  dogrulanmisSite: number;
  /** Ortalama koruma skoru (0..100, yuvarlanmış). */
  ortKorumaSkoru: number;
  /** Filo genelindeki toplam olay. */
  toplamOlay: number;
  /** Filo genelindeki toplam engellenen olay. */
  toplamEngellenen: number;
  /** Riskli site sayısı (düşük skor VEYA açık kritik olay). */
  riskliSite: number;
  /** En yüksek trafikli (toplam olay) sitenin adı; yoksa null. */
  enAktifSite: string | null;
  /** En yüksek trafikli sitenin olay sayısı. */
  enAktifSiteOlay: number;
  /** En düşük koruma skorlu (en riskli) sitenin adı; yoksa null. */
  enRiskliSite: string | null;
  /** Mod dağılımı sayaçları. */
  modDagilim: { monitor: number; challenge: number; block: number };
}

/** Koruma skoru → seviye etiketi + renk (grafikler.tsx KorumaSkoru ile aynı eşikler). */
export interface KorumaSeviyeBilgi {
  seviye: "guclu" | "iyi" | "orta" | "zayif";
  etiket: string;
  renk: string;
}

/* ------------------------------------------------------------------ Sabitler */

/** Bir botClass'ın "tehdit" sayılıp sayılmadığı (insan ve iyi-bot tehdit değil). */
const TEHDIT_DISI: ReadonlySet<BotClass> = new Set<BotClass>(["human", "good_bot"]);

/** Riskli site eşiği: bu skorun altındaki siteler risk kabul edilir. */
export const RISK_ESIGI = 55;

/* ------------------------------------------------------------------ Yardımcılar */

/** Sınırla: değeri [alt, ust] aralığına kıstır. */
function kis(deger: number, alt: number, ust: number): number {
  return Math.max(alt, Math.min(ust, deger));
}

/**
 * Koruma skoru seviyesini döndür. Eşikler grafikler.tsx > KorumaSkoru ile
 * birebir aynıdır (85 / 65 / 45) — görsel tutarlılık için.
 */
export function korumaSeviye(skor: number): KorumaSeviyeBilgi {
  const s = Number.isFinite(skor) ? kis(skor, 0, 100) : 0;
  if (s >= 85) return { seviye: "guclu", etiket: "Güçlü", renk: "#16a34a" };
  if (s >= 65) return { seviye: "iyi", etiket: "İyi", renk: "#2f6fed" };
  if (s >= 45) return { seviye: "orta", etiket: "Orta", renk: "#d97706" };
  return { seviye: "zayif", etiket: "Zayıf", renk: "#dc2626" };
}

/**
 * Olayları N eşit kovaya böl (son24Olay için). Olaylar ts azalan sırada
 * gelir (Events.forSite reverse döndürür). Kova sayısı sabit; her kovaya
 * düşen olay sayısı sayılır. Deterministik: yalnızca olay indeks dağılımına
 * bakar, zaman damgasına değil (sabit pencere varsayımı).
 */
function olayKovalari(olaySayisi: number, kova = 12): number[] {
  const cikti = new Array(kova).fill(0) as number[];
  if (olaySayisi <= 0) return cikti;
  // Olayları indeks sırasına göre eşit kovalara yay (en yeni → sağda dursun
  // diye ters çevir: kova 0 = en eski dilim).
  for (let i = 0; i < olaySayisi; i++) {
    const k = Math.min(kova - 1, Math.floor((i / olaySayisi) * kova));
    // i=0 en yeni olay; sağa (son kova) yerleşsin.
    cikti[kova - 1 - k]++;
  }
  return cikti;
}

/* ------------------------------------------------------------------ Site duruşu */

/**
 * Bir sitenin koruma duruşunu hesaplar (SAF).
 *
 * KORUMA SKORU FORMÜLÜ (0..100) — dört bileşenin ağırlıklı toplamı:
 *   1. Engelleme etkinliği (40p): tehdit olaylarının ne kadarı gerçekten
 *      engellendi/meydan okundu. Tehdit yoksa tam puan (temiz trafik iyidir).
 *   2. Mod kapsamı (25p): block=25, challenge=16, monitor=0 (izleme koruma
 *      uygulamaz → kapsam puanı yok).
 *   3. Doğrulama (15p): domain sahipliği doğrulanmışsa tam puan.
 *   4. Kural kapsamı (20p): etkin kural sayısına göre kademeli (0→0, 1→8,
 *      2→14, 3+→20). Kural yoksa savunma yüzeyi zayıftır.
 *
 * Açık kritik olay varsa her biri için -6 puan ceza (en çok -18) uygulanır;
 * gerçek bir olay yükü skoru aşağı çeker.
 */
export function siteDurumu(
  site: Site,
  events: BotEvent[],
  rules: Rule[],
  alerts: Alert[],
): SiteDurumu {
  const toplamOlay = events.length;

  // --- Olay tabanlı sayaçlar (tek geçiş) ---
  let botOlay = 0;
  let engellenen = 0;
  let meydanOkunan = 0;
  const ipSet = new Set<string>();
  const tehditSayaci = new Map<BotClass, number>();

  for (const e of events) {
    ipSet.add(e.ip);
    if (!TEHDIT_DISI.has(e.botClass)) {
      botOlay++;
      tehditSayaci.set(e.botClass, (tehditSayaci.get(e.botClass) ?? 0) + 1);
    }
    if (e.verdict === "blocked") engellenen++;
    else if (e.verdict === "challenged") meydanOkunan++;
  }

  const botOran = toplamOlay > 0 ? botOlay / toplamOlay : 0;

  // --- Baskın tehdit (deterministik: eşitlikte alfabetik ilk) ---
  let dominantTehdit: BotClass | null = null;
  let dominantTehditSayi = 0;
  for (const [sinif, sayi] of [...tehditSayaci.entries()].sort((a, b) =>
    b[1] - a[1] || a[0].localeCompare(b[0]),
  )) {
    dominantTehdit = sinif;
    dominantTehditSayi = sayi;
    break;
  }

  // --- Kurallar ---
  const aktifKural = rules.filter((r) => r.enabled).length;
  const toplamKural = rules.length;

  // --- Açık kritik/yüksek olaylar (alert) ---
  const acikKritikOlay = alerts.filter(
    (a) => a.status === "acik" && (a.severity === "critical" || a.severity === "high"),
  ).length;

  // === Koruma skoru bileşenleri ===

  // 1) Engelleme etkinliği (40p)
  const eleGecen = engellenen + meydanOkunan; // tehdide karşı uygulanan aksiyon
  let etkinlik: number;
  if (botOlay === 0) {
    etkinlik = 40; // tehdit yok → temiz; tam puan
  } else {
    etkinlik = kis((eleGecen / botOlay) * 40, 0, 40);
  }

  // 2) Mod kapsamı (25p)
  const modKapsam = site.mode === "block" ? 25 : site.mode === "challenge" ? 16 : 0;

  // 3) Doğrulama (15p)
  const dogrulamaPuan = site.verified ? 15 : 0;

  // 4) Kural kapsamı (20p)
  const kuralPuan = aktifKural >= 3 ? 20 : aktifKural === 2 ? 14 : aktifKural === 1 ? 8 : 0;

  // Ceza: açık kritik olay başına -6 (en çok -18)
  const ceza = Math.min(acikKritikOlay, 3) * 6;

  const korumaSkoru = Math.round(
    kis(etkinlik + modKapsam + dogrulamaPuan + kuralPuan - ceza, 0, 100),
  );

  const domain = Array.isArray(site.domains) && site.domains.length > 0 ? site.domains[0] : null;

  return {
    siteId: site.id,
    ad: site.name,
    domain,
    mode: site.mode,
    difficulty: site.difficulty,
    verified: site.verified,
    toplamOlay,
    botOran,
    engellenen,
    meydanOkunan,
    benzersizIp: ipSet.size,
    aktifKural,
    toplamKural,
    acikKritikOlay,
    korumaSkoru,
    dominantTehdit,
    dominantTehditSayi,
    son24Olay: olayKovalari(toplamOlay),
  };
}

/* ------------------------------------------------------------------ Filo özeti */

/**
 * Site duruşlarından filo geneli özet üretir (SAF). Riskli = düşük skor
 * (RISK_ESIGI altı) VEYA açık kritik olay bulunan site.
 */
export function filoOzet(durumlar: SiteDurumu[]): FiloOzet {
  const toplamSite = durumlar.length;

  let korunanSite = 0;
  let izlemeSite = 0;
  let dogrulanmisSite = 0;
  let toplamOlay = 0;
  let toplamEngellenen = 0;
  let riskliSite = 0;
  let skorToplam = 0;

  const modDagilim = { monitor: 0, challenge: 0, block: 0 };

  let enAktifSite: string | null = null;
  let enAktifSiteOlay = -1;
  let enRiskliSite: string | null = null;
  let enDusukSkor = Infinity;

  for (const d of durumlar) {
    if (d.mode !== "monitor") korunanSite++;
    else izlemeSite++;
    if (d.verified) dogrulanmisSite++;
    toplamOlay += d.toplamOlay;
    toplamEngellenen += d.engellenen;
    skorToplam += d.korumaSkoru;
    modDagilim[d.mode]++;

    if (riskli(d)) riskliSite++;

    if (d.toplamOlay > enAktifSiteOlay) {
      enAktifSiteOlay = d.toplamOlay;
      enAktifSite = d.ad;
    }
    // En riskli = en düşük skor; eşitlikte açık kritik olayı çok olan öncelikli.
    if (
      d.korumaSkoru < enDusukSkor ||
      (d.korumaSkoru === enDusukSkor &&
        enRiskliSite !== null &&
        d.acikKritikOlay > 0)
    ) {
      enDusukSkor = d.korumaSkoru;
      enRiskliSite = d.ad;
    }
  }

  return {
    toplamSite,
    korunanSite,
    izlemeSite,
    dogrulanmisSite,
    ortKorumaSkoru: toplamSite > 0 ? Math.round(skorToplam / toplamSite) : 0,
    toplamOlay,
    toplamEngellenen,
    riskliSite,
    enAktifSite,
    enAktifSiteOlay: enAktifSiteOlay < 0 ? 0 : enAktifSiteOlay,
    enRiskliSite,
    modDagilim,
  };
}

/** Bir site duruşu riskli mi (düşük skor VEYA açık kritik olay). */
export function riskli(d: SiteDurumu): boolean {
  return d.korumaSkoru < RISK_ESIGI || d.acikKritikOlay > 0;
}

/* ------------------------------------------------------------------ Etiketler */

/** BotClass için insan-okur Türkçe etiket (dominant tehdit gösterimi). */
export const BOT_SINIF_ETIKET: Record<BotClass, string> = {
  human: "İnsan",
  good_bot: "İyi bot",
  automation: "Otomasyon",
  scraper: "Kazıyıcı",
  credential_stuffing: "Kimlik denemesi",
  ai_agent: "AI ajan",
  ddos: "DDoS",
  spam: "Spam",
};

/** Mod için insan-okur Türkçe etiket + rozet tonu. */
export const MOD_ETIKET: Record<Site["mode"], { ad: string; ton: "yesil" | "sari" | "gri" }> = {
  block: { ad: "Engelle", ton: "yesil" },
  challenge: { ad: "Meydan oku", ton: "sari" },
  monitor: { ad: "İzle", ton: "gri" },
};

/** Zorluk için insan-okur Türkçe etiket. */
export const ZORLUK_ETIKET: Record<Site["difficulty"], string> = {
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek",
};
