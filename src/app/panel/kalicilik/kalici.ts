/**
 * Specter — Geri-Dönen Saldırganlar & Kalıcılık Takibi (yerel yardımcı)
 * =====================================================================
 * "Kim ısrarla geri geliyor?" — bir kerelik bot GÜRÜLTÜdür; 5 gün içinde
 * engellere rağmen 15 kez dönen saldırgan GERÇEK bir tehdittir.
 *
 * Bu yardımcı, kötü niyetli olayları IP'ye göre gruplar ve her saldırganın
 * ZAMAN İÇİNDEKİ ısrarını ölçer: kaç ayrı gün/oturumda görüldü, engellendikten
 * SONRA geri döndü mü (kilit kalıcılık sinyali), tespitten kaçmak için UA/yol
 * mutasyona uğrattı mı. En kararlı hasımları öne çıkarır.
 *
 * SAF/DETERMİNİSTİK: Date.now / Math.random YOK. Tüm zaman penceresi olayların
 * kendi ts aralığından türetilir. Aynı girdi → aynı çıktı.
 *
 * NOT: /panel/tehdit-aktor (aktör profilleri), /panel/kampanya (kümeleme) ve
 * /panel/federe (çapraz-site) ile TAMAMLAYICIDIR — buradaki açı ZAMANSAL
 * KALICILIK: savunmalara rağmen tekrar tekrar dönen ve bunu yaparken adapte
 * olan saldırgan.
 */
import type { BotEvent, BotClass, Verdict } from "@/lib/db/schema";

// İstemci tarafında da kullanılabilsin diye Verdict tipini yeniden dışa ver.
export type { Verdict } from "@/lib/db/schema";

/** Kötü niyetli sayılan bot sınıfları (kalıcılık takibinin kapsamı). */
const KOTU: ReadonlySet<BotClass> = new Set<BotClass>([
  "scraper",
  "credential_stuffing",
  "automation",
  "ai_agent",
  "ddos",
  "spam",
]);

/** Engel/challenge sayılan kararlar (bu saldırgana "hayır" dendi demektir). */
const ENGEL_KARAR: ReadonlySet<Verdict> = new Set<Verdict>(["blocked", "challenged"]);

/**
 * Oturum ayrımı için varsayılan boşluk eşiği (ms). Bir saldırganın olayları
 * zaman sırasına dizilir; ardışık iki olay arasındaki boşluk bu eşiği aşarsa
 * YENİ bir oturum (yeni bir "dönüş") başlar. 30 dakika, tek bir tarama/saldırı
 * seansını ayrı ziyaretlerden ayırmak için makul bir sezgiseldir.
 */
export const OTURUM_BOSLUK_MS = 30 * 60 * 1000; // 30 dakika

const GUN_MS = 24 * 60 * 60 * 1000;

/** Bir günün başlangıcına (UTC) yuvarlanmış anahtarı — distinct-gün sayımı için. */
function gunAnahtari(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

export type KaliciTehdit = "geçici" | "tekrarlayan" | "inatçı" | "kalıcı-tehdit";

/** Tek bir dönüş oturumu (bir "ziyaret") — zaman şeridi için. */
export interface Oturum {
  baslangic: number;
  bitis: number;
  istekSayisi: number;
  /** Bu oturumda engellendi/challenge edildi mi. */
  engellendi: boolean;
  /** Bu oturumun baskın kararı (görselde renk için). */
  karar: Verdict;
}

export interface KaliciSaldirgan {
  /** Gruplama anahtarı = IP. */
  anahtar: string;
  ip: string;
  asn: string;
  country: string;
  botClass: BotClass;
  ilkGorulme: number;
  sonGorulme: number;
  /** Görüldüğü ayrı gün sayısı (distinct günler). */
  aktifGunSayisi: number;
  /** Ayrı oturum (dönüş) sayısı — boşlukla ayrılmış seanslar. */
  oturumSayisi: number;
  toplamIstek: number;
  /** Kaç kez engellendi/challenge edildi. */
  engellenmeSayisi: number;
  /** Engellendikten SONRA geri dönme sayısı (kilit kalıcılık sinyali). */
  donusRagmenEngel: number;
  /** Toplam yayılım süresi (ms) — ilk ile son görülme arası. */
  yayilimMs: number;
  /** Kalıcılık/ısrar skoru 0-100. */
  inatSkoru: number;
  /** Dönüşler arasında UA/yol değişti mi (tespitten kaçış denemesi). */
  mutasyon: boolean;
  /** Görülen farklı UA sayısı (mutasyon kanıtı). */
  uaCesitliligi: number;
  /** Görülen farklı yol sayısı. */
  yolCesitliligi: number;
  tehdit: KaliciTehdit;
  /** Dönüş oturumlarının zaman şeridi (en eski → en yeni). */
  oturumlar: Oturum[];
}

/**
 * Sıralı (artan) zaman damgalarını boşluk eşiğine göre oturumlara böler.
 * Her oturum, indeks aralığı [bas, son] olarak döner (girdi dizisine referans).
 * Saf: yalnızca girdi ts'lerine ve gapMs'e bağlıdır.
 */
export function oturumBol(sortedTs: number[], gapMs: number): { bas: number; son: number }[] {
  if (sortedTs.length === 0) return [];
  const oturumlar: { bas: number; son: number }[] = [];
  let bas = 0;
  for (let i = 1; i < sortedTs.length; i++) {
    if (sortedTs[i] - sortedTs[i - 1] > gapMs) {
      oturumlar.push({ bas, son: i - 1 });
      bas = i;
    }
  }
  oturumlar.push({ bas, son: sortedTs.length - 1 });
  return oturumlar;
}

/** Bir olay kümesinin baskın kararını bulur (görsel renk için). */
function baskinKarar(olaylar: BotEvent[]): Verdict {
  const say = new Map<Verdict, number>();
  for (const e of olaylar) say.set(e.verdict, (say.get(e.verdict) ?? 0) + 1);
  let en: Verdict = olaylar[0]?.verdict ?? "allowed";
  let enSay = -1;
  for (const [k, v] of say) if (v > enSay) { en = k; enSay = v; }
  return en;
}

/**
 * Bir saldırganın olaylarından (aynı IP) kalıcılık profilini hesaplar.
 * Olaylar zamana göre sıralanır, oturumlara bölünür ve ısrar sinyalleri
 * çıkarılır. ≥2 oturum koşulu çağıran tarafta uygulanır.
 */
function profilCikar(ip: string, olaylar: BotEvent[]): KaliciSaldirgan {
  // Zaman sırası (artan) — deterministik: eşit ts'de id ile tie-break.
  const sirali = [...olaylar].sort((a, b) => a.ts - b.ts || a.id.localeCompare(b.id));
  const tsler = sirali.map((e) => e.ts);
  const dilimler = oturumBol(tsler, OTURUM_BOSLUK_MS);

  // Oturum detaylarını kur.
  const oturumlar: Oturum[] = dilimler.map((d) => {
    const grup = sirali.slice(d.bas, d.son + 1);
    const engellendi = grup.some((e) => ENGEL_KARAR.has(e.verdict));
    return {
      baslangic: grup[0].ts,
      bitis: grup[grup.length - 1].ts,
      istekSayisi: grup.length,
      engellendi,
      karar: baskinKarar(grup),
    };
  });

  // Engellendikten SONRA geri dönme: bir oturumda engel varsa ve ONDAN SONRA
  // en az bir oturum daha geldiyse, bu "engele rağmen dönüş"tür.
  let donusRagmenEngel = 0;
  let dahaOnceEngellendi = false;
  for (const o of oturumlar) {
    if (dahaOnceEngellendi) donusRagmenEngel++;
    if (o.engellendi) dahaOnceEngellendi = true;
  }

  const gunler = new Set(tsler.map(gunAnahtari));
  const uaSet = new Set(sirali.map((e) => e.ua).filter(Boolean));
  const yolSet = new Set(sirali.map((e) => e.path).filter(Boolean));
  const engellenmeSayisi = sirali.filter((e) => ENGEL_KARAR.has(e.verdict)).length;
  const ilkGorulme = tsler[0];
  const sonGorulme = tsler[tsler.length - 1];
  const yayilimMs = sonGorulme - ilkGorulme;
  const yayilimGun = yayilimMs / GUN_MS;

  // Baskın bot sınıfı.
  const sinifSay = new Map<BotClass, number>();
  for (const e of sirali) sinifSay.set(e.botClass, (sinifSay.get(e.botClass) ?? 0) + 1);
  let botClass: BotClass = sirali[0].botClass;
  let bcEn = -1;
  for (const [k, v] of sinifSay) if (v > bcEn) { botClass = k; bcEn = v; }

  // Mutasyon: dönüşler arasında UA VEYA yol çeşitlendiyse tespitten kaçış işareti.
  const mutasyon = uaSet.size > 1 || yolSet.size > 2;

  // --- İnat skoru (0-100) ---
  // Ağırlıklar ısrarın farklı boyutlarını yakalar:
  //   ayrı oturum sayısı (en güçlü sinyal), ayrı gün sayısı, engele-rağmen-dönüş,
  //   yayılım süresi ve mutasyon (adaptif kaçış).
  const oturumPuan = Math.min(30, (oturumlar.length - 1) * 8); // 2 oturum=8 … 5+ =30
  const gunPuan = Math.min(24, (gunler.size - 1) * 8); // 1 gün=0, 4+ gün=24
  const donusPuan = Math.min(28, donusRagmenEngel * 14); // engele rağmen her dönüş çok değerli
  const yayilimPuan = Math.min(10, Math.floor(yayilimGun) * 2.5); // uzun süre = kararlılık
  const mutasyonPuan = mutasyon ? 8 : 0;
  const inatSkoru = Math.round(
    Math.min(100, oturumPuan + gunPuan + donusPuan + yayilimPuan + mutasyonPuan),
  );

  // Tehdit sınıfı — skordan türetilir.
  let tehdit: KaliciTehdit;
  if (inatSkoru >= 70) tehdit = "kalıcı-tehdit";
  else if (inatSkoru >= 45) tehdit = "inatçı";
  else if (inatSkoru >= 22) tehdit = "tekrarlayan";
  else tehdit = "geçici";

  // Baskın ASN / ülke (en sık görülen).
  const asn = enSik(sirali.map((e) => e.asn));
  const country = enSik(sirali.map((e) => e.country));

  return {
    anahtar: ip,
    ip,
    asn,
    country,
    botClass,
    ilkGorulme,
    sonGorulme,
    aktifGunSayisi: gunler.size,
    oturumSayisi: oturumlar.length,
    toplamIstek: sirali.length,
    engellenmeSayisi,
    donusRagmenEngel,
    yayilimMs,
    inatSkoru,
    mutasyon,
    uaCesitliligi: uaSet.size,
    yolCesitliligi: yolSet.size,
    tehdit,
    oturumlar,
  };
}

/** Bir dizideki en sık görülen değeri döndürür (deterministik). */
function enSik(degerler: string[]): string {
  const say = new Map<string, number>();
  for (const d of degerler) if (d) say.set(d, (say.get(d) ?? 0) + 1);
  let en = "";
  let enSay = -1;
  for (const [k, v] of say) if (v > enSay || (v === enSay && k < en)) { en = k; enSay = v; }
  return en;
}

/**
 * Kötü niyetli olayları IP'ye göre gruplar; her IP için kalıcılık profilini
 * hesaplar. YALNIZCA ≥2 ayrı oturumda görülen saldırganlar tutulur (bir kerelik
 * botlar gürültüdür — filtrelenir). İnat skoruna göre azalan sıralı döner.
 */
export function kaliciSaldirganlar(events: BotEvent[]): KaliciSaldirgan[] {
  const kotu = events.filter((e) => KOTU.has(e.botClass));
  const gruplar = new Map<string, BotEvent[]>();
  for (const e of kotu) {
    if (!e.ip) continue;
    let arr = gruplar.get(e.ip);
    if (!arr) { arr = []; gruplar.set(e.ip, arr); }
    arr.push(e);
  }

  const sonuc: KaliciSaldirgan[] = [];
  for (const [ip, grup] of gruplar) {
    const profil = profilCikar(ip, grup);
    // Bir kerelik / tek-oturum saldırganları ele (yalnızca geri-dönenler).
    if (profil.oturumSayisi < 2) continue;
    sonuc.push(profil);
  }

  sonuc.sort((a, b) => b.inatSkoru - a.inatSkoru || b.toplamIstek - a.toplamIstek || a.ip.localeCompare(b.ip));
  return sonuc;
}

export interface KalicilikOzet {
  /** Toplam kalıcı (≥2 oturum) saldırgan sayısı. */
  toplamKalici: number;
  /** "inatçı" + "kalıcı-tehdit" sayısı. */
  inatciSayisi: number;
  /** Ortalama dönüş (oturum) sayısı. */
  ortDonusSayisi: number;
  /** Engellere rağmen geri dönen saldırgan sayısı. */
  engelAsanSayisi: number;
  /** En inatçı saldırgan (varsa). */
  enInatci: KaliciSaldirgan | null;
}

/** Kalıcı saldırgan listesinden özet metrikleri çıkarır (saf). */
export function kalicilikOzet(saldirganlar: KaliciSaldirgan[]): KalicilikOzet {
  const toplamKalici = saldirganlar.length;
  const inatciSayisi = saldirganlar.filter(
    (s) => s.tehdit === "inatçı" || s.tehdit === "kalıcı-tehdit",
  ).length;
  const toplamOturum = saldirganlar.reduce((a, s) => a + s.oturumSayisi, 0);
  const ortDonusSayisi = toplamKalici > 0 ? toplamOturum / toplamKalici : 0;
  const engelAsanSayisi = saldirganlar.filter((s) => s.donusRagmenEngel > 0).length;
  const enInatci = saldirganlar[0] ?? null; // liste inatSkoru azalan sıralı

  return {
    toplamKalici,
    inatciSayisi,
    ortDonusSayisi: Math.round(ortDonusSayisi * 10) / 10,
    engelAsanSayisi,
    enInatci,
  };
}

/** Tehdit sınıfı → görsel ton eşlemesi (UI için ayrık tutulur). */
export const TEHDIT_ETIKET: Record<KaliciTehdit, string> = {
  "geçici": "Geçici",
  tekrarlayan: "Tekrarlayan",
  "inatçı": "İnatçı",
  "kalıcı-tehdit": "Kalıcı Tehdit",
};

/** Tehdit sınıfı → renk (rozet/şerit için). */
export const TEHDIT_RENK: Record<KaliciTehdit, string> = {
  "geçici": "#64748b",
  tekrarlayan: "#d97706",
  "inatçı": "#ea580c",
  "kalıcı-tehdit": "#dc2626",
};
