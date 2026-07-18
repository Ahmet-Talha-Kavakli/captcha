/**
 * Specter — Maliyet-Bilinçli Otomatik Ölçekleme Politikası (saf çekirdek)
 * =======================================================================
 * Edge güvenlik altyapısı için FinOps: gözlemlenen/öngörülen trafikten
 * her BÖLGE için kenar kapasite ölçekleme kararları üretir. Performans
 * (headroom, gecikme SLO'su) ile maliyeti (aşırı-tedarik israfı) dengeler.
 *
 * Bu modül /panel/maliyet-optim'den (birim-maliyet optimizasyonu) ve
 * /panel/filo (filo) ve /panel/kota-tahmin'den (kota öngörüsü) FARKLIDIR:
 * BURASI ölçekleme-politikası motorudur — bölge başına kapasite yukarı/aşağı
 * kararları + maliyet/SLO dengesi.
 *
 * TASARIM İLKESİ — SAF & DETERMİNİSTİK:
 *   Bu dosyada `Date.now()`, argümansız `new Date()` ya da `Math.random()` YOK.
 *   "Şimdi" / ufuk bilgisi PoP topolojisinden (statik) ve olay zaman
 *   damgalarından türetilir. Aynı girdi → daima aynı çıktı; birim test edilebilir.
 *
 * NOT (dürüstlük): Düğüm başına aylık birim maliyet ve düğüm başına RPS
 * kapasitesi MODELLENMİŞ VARSAYIMLARDIR (aşağıda etiketli), canlı bir bulut
 * faturalandırma API'sinden gelmez. Yük öngörüsü ise gözlemlenen rps +
 * sezgisel büyüme faktöründen türetilir.
 */

import type { Pop, EdgeBolge } from "../edge/pops";

/* ------------------------------------------------------------------ Maliyet modeli (VARSAYIMLAR) */

/**
 * MODELLENMİŞ VARSAYIM — düğüm başına aylık maliyet (USD).
 * Bir kenar güvenlik düğümünün (compute + bant genişliği + lisans)
 * amortize aylık taşıma maliyeti. Gerçek fatura değil; planlama varsayımı.
 */
export const DUGUM_AYLIK_MALIYET_USD = 1850;

/**
 * MODELLENMİŞ VARSAYIM — tek bir kenar düğümünün güvenli sürdürebileceği
 * RPS (saniyedeki istek) kapasitesi. Gerçek bir kenar düğümünün (challenge
 * değerlendirme + TLS + WAF) makul üst sınırı. Bölge kapasitesi = düğüm × bu.
 */
export const DUGUM_RPS_KAPASITE = 6000;

/**
 * MODELLENMİŞ VARSAYIM — hedef headroom (boşta bırakılacak kapasite payı).
 * Ani sıçramaları (spike) yutmak ve SLO'yu korumak için bölgenin bu kadar
 * boş kapasitesi olmalı. %30 = pik anında bile doluluk ~%70'te kalır.
 */
export const HEDEF_HEADROOM = 0.30;

/**
 * Sezgisel büyüme faktörü — gözlemlenen olay verisi yoksa uygulanan
 * varsayılan yakın-dönem yük artışı (ör. %8 büyüme öngörüsü). Olay
 * verisi varsa bölge-özel trend bunun yerine geçer.
 */
export const VARSAYILAN_BUYUME = 0.08;

/* ------------------------------------------------------------------ Tipler */

/** Ölçekleme aksiyonu. */
export type OlcekAksiyon = "ölçek-yukarı" | "ölçek-aşağı" | "sabit";

/** SLO risk seviyesi (headroom inceyse yüksek). */
export type SloRisk = "düşük" | "orta" | "yüksek";

/** Tek bir bölge için ölçekleme analizi. */
export interface BolgeOlcek {
  bolge: EdgeBolge;
  /** Bölge içindeki PoP kodları (bilgi amaçlı). */
  poplar: string[];
  /** Bölgedeki aktif PoP sayısı. */
  popSayisi: number;
  /** Şu anki düğüm sayısı (kapasite kademesi). */
  mevcutDugum: number;
  /** Şu anki toplam kapasite (RPS). */
  mevcutKapasite: number;
  /** Şu anki gözlemlenen yük (RPS). */
  mevcutYuk: number;
  /** Öngörülen yakın-dönem yük (RPS) — gözlemlenen + büyüme trendi. */
  tahminiYuk: number;
  /** Bölgenin türetilmiş büyüme faktörü (0.08 = %8). */
  buyumeFaktoru: number;
  /** Şu anki headroom oranı (0..1) — boş kapasite payı. */
  mevcutHeadroom: number;
  /** Tahmini yük altında headroom (0..1) — negatif ise doygunluk. */
  tahminiHeadroom: number;
  /** Hedef headroom (0..1). */
  hedefHeadroom: number;
  /** Önerilen aksiyon. */
  onerilenAksiyon: OlcekAksiyon;
  /** Önerilen düğüm değişimi (+ ekle / − çıkar / 0 sabit). */
  oneriliNodeDelta: number;
  /** Öneri sonrası düğüm sayısı. */
  oneriliDugum: number;
  /** Öneri sonrası kapasite (RPS). */
  oneriliKapasite: number;
  /** Öneri sonrası headroom (0..1). */
  oneriliHeadroom: number;
  /** Şu anki aylık maliyet (USD). */
  mevcutMaliyet: number;
  /** Öneri sonrası aylık maliyet (USD). */
  oneriliMaliyet: number;
  /** Aşağı ölçeklemede tasarruf (USD, pozitif). Yukarıda 0. */
  tasarruf: number;
  /** Yukarı ölçeklemede ek maliyet (USD, pozitif). Aşağıda 0. */
  ekMaliyet: number;
  /** Net maliyet farkı (öneri − mevcut; negatif = tasarruf). */
  netFark: number;
  /** SLO riski (headroom incelmesine göre). */
  sloRiski: SloRisk;
  /** İnsan-okur gerekçe. */
  gerekce: string;
}

/** Ölçekleme özeti (tüm bölgeler). */
export interface OlcekOzet {
  /** Toplam mevcut aylık maliyet (USD). */
  toplamAylikMaliyet: number;
  /** Toplam önerilen aylık maliyet (USD). */
  oneriliAylikMaliyet: number;
  /** Net fark (öneri − mevcut; negatif = net tasarruf). */
  netFark: number;
  /** Toplam aylık tasarruf (aşağı ölçeklemelerden). */
  toplamTasarruf: number;
  /** Toplam aylık ek maliyet (yukarı ölçeklemelerden). */
  toplamEkMaliyet: number;
  /** Yukarı ölçeklenecek bölge sayısı. */
  olcekYukariBolge: number;
  /** Aşağı ölçeklenecek bölge sayısı. */
  olcekAsagiBolge: number;
  /** SLO riski yüksek olan bölge sayısı. */
  sloRiskliBolge: number;
  /** Öneri sonrası ortalama headroom (0..1). */
  ortHeadroom: number;
}

/** Genel politika önerisi. */
export interface Politika {
  /** Önerilen hedef headroom (0..1). */
  hedefHeadroom: number;
  /** Politika özet metni (insan-okur). */
  ozet: string;
  /** Kısa madde-madde kurallar. */
  kurallar: string[];
  /** Öngörülen aylık maliyet etkisi (USD, negatif = tasarruf). */
  maliyetEtkisi: number;
}

/* ------------------------------------------------------------------ Ülke → bölge eşlemesi (olay türevi trend için) */

/**
 * Olay verisindeki ISO2 ülke kodunu edge bölgesine eşler. Olaylar ülke
 * taşır; PoP topolojisi bölge taşır. Bu eşleme, gözlemlenen trafiği
 * bölgelere dağıtıp bölge-özel büyüme trendini türetmemizi sağlar.
 * Kapsanmayan ülkeler yok sayılır (bölgesel sinyali bozmasın).
 */
const ULKE_BOLGE: Record<string, EdgeBolge> = {
  // Avrupa
  TR: "avrupa", DE: "avrupa", NL: "avrupa", GB: "avrupa", FR: "avrupa", ES: "avrupa", IT: "avrupa", PL: "avrupa", SE: "avrupa",
  // Kuzey Amerika
  US: "kuzey-amerika", CA: "kuzey-amerika", MX: "kuzey-amerika",
  // Asya-Pasifik
  SG: "asya", JP: "asya", IN: "asya", CN: "asya", HK: "asya", KR: "asya", ID: "asya",
  // Güney Amerika
  BR: "guney-amerika", AR: "guney-amerika", CL: "guney-amerika",
  // Okyanusya
  AU: "okyanusya", NZ: "okyanusya",
  // Afrika / Orta Doğu
  AE: "afrika", ZA: "afrika", SA: "afrika", EG: "afrika",
};

/** Minimal olay şekli (DB BotEvent'in gereken alt kümesi). */
export interface OlayGirdi {
  ts: number;
  country: string;
}

/* ------------------------------------------------------------------ Yardımcılar */

/** Bir düğüm sayısından kapasiteyi (RPS) türet. */
function kapasiteHesap(dugum: number): number {
  return dugum * DUGUM_RPS_KAPASITE;
}

/** Gözlemlenen yükü belirtilen doluluk oranında taşıyan kurulu düğüm (kesirli). */
function kuruluKapasiteDugum(yuk: number, doluluk: number): number {
  return yuk / doluluk / DUGUM_RPS_KAPASITE;
}

/** Bir düğüm sayısından aylık maliyeti (USD) türet. */
function maliyetHesap(dugum: number): number {
  return dugum * DUGUM_AYLIK_MALIYET_USD;
}

/** Headroom oranı: 1 − (yük / kapasite). Kapasite 0 ise 0. */
function headroom(yuk: number, kapasite: number): number {
  if (kapasite <= 0) return 0;
  return 1 - yuk / kapasite;
}

/**
 * Verili yükü hedef headroom ile karşılamak için gereken minimum düğüm.
 * gerekliKapasite = yuk / (1 − hedefHeadroom); sonra düğüme yuvarla (yukarı).
 * En az 1 düğüm (bölge canlıysa).
 */
function gerekliDugum(yuk: number, hedef: number): number {
  const oran = Math.max(0.01, 1 - hedef); // sıfıra bölme koruması
  const gerekliKapasite = yuk / oran;
  return Math.max(1, Math.ceil(gerekliKapasite / DUGUM_RPS_KAPASITE));
}

/**
 * Bir bölgenin olay-türevi büyüme faktörünü hesapla. Zaman penceresini
 * ortadan (medyan ts) ikiye böler ve ERKEN ile GEÇ yarının olay-YOĞUNLUĞUNU
 * (birim zamandaki olay) karşılaştırır. Yoğunluk hızlanıyorsa → pozitif
 * büyüme; yavaşlıyorsa → negatif. Yeterli olay yoksa VARSAYILAN_BUYUME döner.
 * Sonuç [−0.20, +0.60] aralığına kırpılır (planlamada güvenli uçlar).
 */
function bolgeBuyume(olaylar: OlayGirdi[]): number {
  if (olaylar.length < 8) return VARSAYILAN_BUYUME;
  const sirali = [...olaylar].sort((a, b) => a.ts - b.ts);
  const enErken = sirali[0].ts;
  const enGec = sirali[sirali.length - 1].ts;
  const span = enGec - enErken;
  if (span <= 0) return VARSAYILAN_BUYUME;
  const orta = enErken + span / 2;
  // Zaman-yoğunluğu: her yarıdaki olay sayısı / o yarının süresi.
  const erkenSayi = sirali.filter((e) => e.ts < orta).length;
  const gecSayi = sirali.length - erkenSayi;
  const yariSure = span / 2;
  const erkenYogunluk = erkenSayi / yariSure;
  const gecYogunluk = gecSayi / yariSure;
  if (erkenYogunluk <= 0) return VARSAYILAN_BUYUME;
  const artis = (gecYogunluk - erkenYogunluk) / erkenYogunluk;
  return Math.max(-0.2, Math.min(0.6, artis));
}

/* ------------------------------------------------------------------ Ana analiz */

/**
 * Bölge başına ölçekleme analizi. PoP topolojisini (gerçek rps + kapasite)
 * taban alır; olaylardan (varsa) bölge-özel büyüme trendini türetir.
 *
 * Karar mantığı (deterministik):
 *   1. Bölgenin şu anki yükü = ∑ PoP rps.
 *   2. Şu anki düğüm = mevcut kapasiteyi (∑ rps / mevcutHeadroom veya
 *      kapasite alanından) karşılayan kademe. Kapasite alanını (%) kullanarak
 *      "kurulu" düğüm sayısını geri-hesaplarız: kurulu kapasite = yuk / doluluk.
 *   3. Tahmini yük = şu anki yük × (1 + büyüme).
 *   4. Gerekli düğüm = tahmini yükü hedef headroom ile karşılayan minimum.
 *   5. Delta = gerekli − mevcut → aksiyon.
 */
export function olceklemeAnaliz(pops: Pop[], olaylar: OlayGirdi[] = []): BolgeOlcek[] {
  // Olayları bölgeye dağıt (büyüme trendi için).
  const bolgeOlay = new Map<EdgeBolge, OlayGirdi[]>();
  for (const e of olaylar) {
    const b = ULKE_BOLGE[e.country?.toUpperCase?.() ?? ""];
    if (!b) continue;
    const arr = bolgeOlay.get(b);
    if (arr) arr.push(e);
    else bolgeOlay.set(b, [e]);
  }

  // PoP'ları bölgeye grupla (bakımdaki PoP'lar kapasite dışı sayılır).
  const bolgePop = new Map<EdgeBolge, Pop[]>();
  for (const p of pops) {
    const arr = bolgePop.get(p.bolge);
    if (arr) arr.push(p);
    else bolgePop.set(p.bolge, [p]);
  }

  const sonuc: BolgeOlcek[] = [];

  for (const [bolge, grupPops] of bolgePop) {
    // Bakımdaki PoP kapasiteye sayılmaz ama yük yine gözlemlenir.
    const aktifPops = grupPops.filter((p) => p.durum !== "bakim");
    const mevcutYuk = grupPops.reduce((a, p) => a + p.rps, 0);

    // Kurulu düğüm sayısını PoP kapasite-kullanım yüzdesinden geri-hesapla.
    // kapasite% = yuk / kuruluKapasite → kuruluKapasite = yuk / (kapasite/100).
    // Bölge doluluğu = aktif PoP kapasite yüzdelerinin yük-ağırlıklı ortalaması.
    const yukAgirlikTop = aktifPops.reduce((a, p) => a + p.rps, 0) || 1;
    const bolgeDoluluk =
      aktifPops.reduce((a, p) => a + (p.kapasite / 100) * p.rps, 0) / yukAgirlikTop;
    const doluluk = Math.max(0.05, Math.min(0.99, bolgeDoluluk));
    // Kurulu kapasite gözlemlenen yükü belirtilen doluluk oranında taşır.
    // Düğüme YUKARI yuvarlarız: kurulu kapasite yükü karşılamalı (kesirli
    // düğüm olmaz). Böylece düşük-doluluklu bölgelerde gerçek fazla-tedarik
    // (surplus düğüm) yüzeye çıkar; aşağı-ölçekleme fırsatı görünür olur.
    const mevcutDugum = Math.max(1, Math.ceil(kuruluKapasiteDugum(mevcutYuk, doluluk)));
    const mevcutKapasite = kapasiteHesap(mevcutDugum);

    // Büyüme trendi (olay-türevi veya varsayılan) → tahmini yük.
    const buyume = bolgeBuyume(bolgeOlay.get(bolge) ?? []);
    const tahminiYuk = Math.round(mevcutYuk * (1 + buyume));

    const mevcutHeadroom = headroom(mevcutYuk, mevcutKapasite);
    const tahminiHeadroom = headroom(tahminiYuk, mevcutKapasite);

    // Gerekli düğüm: tahmini yükü hedef headroom ile karşılayan minimum.
    const oneriliDugum = gerekliDugum(tahminiYuk, HEDEF_HEADROOM);
    const oneriliNodeDelta = oneriliDugum - mevcutDugum;
    const oneriliKapasite = kapasiteHesap(oneriliDugum);
    const oneriliHeadroom = headroom(tahminiYuk, oneriliKapasite);

    const mevcutMaliyet = maliyetHesap(mevcutDugum);
    const oneriliMaliyet = maliyetHesap(oneriliDugum);
    const netFark = oneriliMaliyet - mevcutMaliyet;

    let onerilenAksiyon: OlcekAksiyon;
    if (oneriliNodeDelta > 0) onerilenAksiyon = "ölçek-yukarı";
    else if (oneriliNodeDelta < 0) onerilenAksiyon = "ölçek-aşağı";
    else onerilenAksiyon = "sabit";

    const tasarruf = netFark < 0 ? -netFark : 0;
    const ekMaliyet = netFark > 0 ? netFark : 0;

    // SLO riski: TAHMİNİ headroom hedefe göre ne kadar ince.
    // Öngörülen yük altında headroom hedefin yarısının altına düşerse yüksek.
    let sloRiski: SloRisk;
    if (tahminiHeadroom < HEDEF_HEADROOM * 0.5) sloRiski = "yüksek";
    else if (tahminiHeadroom < HEDEF_HEADROOM) sloRiski = "orta";
    else sloRiski = "düşük";

    // Gerekçe metni.
    const yuzHead = Math.round(mevcutHeadroom * 100);
    const yuzTahHead = Math.round(tahminiHeadroom * 100);
    const yuzBuyume = Math.round(buyume * 100);
    let gerekce: string;
    if (onerilenAksiyon === "ölçek-yukarı") {
      gerekce =
        `Öngörülen yük (%${yuzBuyume} büyüme) altında headroom %${yuzTahHead}'e düşüyor — ` +
        `hedef %${Math.round(HEDEF_HEADROOM * 100)} altında. SLO'yu korumak için +${oneriliNodeDelta} düğüm.`;
    } else if (onerilenAksiyon === "ölçek-aşağı") {
      gerekce =
        `Aşırı-tedarik: mevcut headroom %${yuzHead}, öngörülen yükte bile %${yuzTahHead}. ` +
        `${Math.abs(oneriliNodeDelta)} düğüm çıkarılıp israf geri kazanılabilir; SLO korunur.`;
    } else {
      gerekce =
        `Dengede: headroom %${yuzHead} (öngörülende %${yuzTahHead}), hedefe yakın. ` +
        `Kapasite değişikliği gerekmez.`;
    }

    sonuc.push({
      bolge,
      poplar: grupPops.map((p) => p.kod),
      popSayisi: grupPops.length,
      mevcutDugum,
      mevcutKapasite,
      mevcutYuk,
      tahminiYuk,
      buyumeFaktoru: buyume,
      mevcutHeadroom,
      tahminiHeadroom,
      hedefHeadroom: HEDEF_HEADROOM,
      onerilenAksiyon,
      oneriliNodeDelta,
      oneriliDugum,
      oneriliKapasite,
      oneriliHeadroom,
      mevcutMaliyet,
      oneriliMaliyet,
      tasarruf,
      ekMaliyet,
      netFark,
      sloRiski,
      gerekce,
    });
  }

  // Kararlı sıralama: önce SLO riski (yüksek→düşük), sonra |netFark| (büyük→küçük).
  const riskSira: Record<SloRisk, number> = { yüksek: 0, orta: 1, düşük: 2 };
  sonuc.sort((a, b) => {
    if (riskSira[a.sloRiski] !== riskSira[b.sloRiski]) return riskSira[a.sloRiski] - riskSira[b.sloRiski];
    return Math.abs(b.netFark) - Math.abs(a.netFark);
  });

  return sonuc;
}

/* ------------------------------------------------------------------ Özet */

/** Bölge analizlerinden toplu özet çıkar. */
export function olceklemeOzet(bolgeler: BolgeOlcek[]): OlcekOzet {
  const toplamAylikMaliyet = bolgeler.reduce((a, b) => a + b.mevcutMaliyet, 0);
  const oneriliAylikMaliyet = bolgeler.reduce((a, b) => a + b.oneriliMaliyet, 0);
  const toplamTasarruf = bolgeler.reduce((a, b) => a + b.tasarruf, 0);
  const toplamEkMaliyet = bolgeler.reduce((a, b) => a + b.ekMaliyet, 0);
  const olcekYukariBolge = bolgeler.filter((b) => b.onerilenAksiyon === "ölçek-yukarı").length;
  const olcekAsagiBolge = bolgeler.filter((b) => b.onerilenAksiyon === "ölçek-aşağı").length;
  const sloRiskliBolge = bolgeler.filter((b) => b.sloRiski === "yüksek").length;
  const ortHeadroom =
    bolgeler.length > 0 ? bolgeler.reduce((a, b) => a + b.oneriliHeadroom, 0) / bolgeler.length : 0;

  return {
    toplamAylikMaliyet,
    oneriliAylikMaliyet,
    netFark: oneriliAylikMaliyet - toplamAylikMaliyet,
    toplamTasarruf,
    toplamEkMaliyet,
    olcekYukariBolge,
    olcekAsagiBolge,
    sloRiskliBolge,
    ortHeadroom,
  };
}

/* ------------------------------------------------------------------ Politika önerisi */

/**
 * Maliyet ile SLO'yu dengeleyen genel ölçekleme politikası üret.
 * Hedef headroom sabit tutulur (HEDEF_HEADROOM); politika metni bölge
 * durumuna göre uyarlanır (riskli bölge varsa önce SLO, yoksa tasarruf odağı).
 */
export function politikaOner(bolgeler: BolgeOlcek[]): Politika {
  const ozet = olceklemeOzet(bolgeler);
  const yuzHedef = Math.round(HEDEF_HEADROOM * 100);
  const netTasarruf = ozet.netFark; // negatif = tasarruf

  let ana: string;
  if (ozet.sloRiskliBolge > 0) {
    ana =
      `Önce SLO: ${ozet.sloRiskliBolge} bölgede öngörülen yük headroom'u kritik eşiğe düşürüyor — ` +
      `önce bu bölgeler yukarı ölçeklenmeli. Ardından ${ozet.olcekAsagiBolge} aşırı-tedarikli bölge ` +
      `aşağı ölçeklenerek net maliyet nötrlenir.`;
  } else if (ozet.olcekAsagiBolge > 0 && netTasarruf < 0) {
    ana =
      `Tasarruf fırsatı: ${ozet.olcekAsagiBolge} bölge aşırı-tedarikli; %${yuzHedef} hedef headroom ` +
      `korunarak aylık ~$${Math.round(-netTasarruf).toLocaleString("tr-TR")} israf geri kazanılabilir.`;
  } else {
    ana =
      `Filo dengede. %${yuzHedef} hedef headroom çoğu bölgede tutuyor; ` +
      `agresif değişiklik önerilmiyor, mevcut kademe korunmalı.`;
  }

  const kurallar = [
    `Hedef headroom %${yuzHedef}: pik anında bile doluluk ≤ %${100 - yuzHedef} kalır (spike tamponu).`,
    `Öngörülen headroom hedefin yarısının (%${Math.round(yuzHedef / 2)}) altına düşerse YUKARI ölçekle (SLO koruması).`,
    `Öngörülen yükte bile headroom hedefin belirgin üstündeyse AŞAĞI ölçekle (israf geri kazanımı).`,
    `Önceliklendirme: önce SLO-riskli bölgeler, sonra en yüksek tasarruflu aşağı-ölçeklemeler.`,
    `Birim maliyet ($${DUGUM_AYLIK_MALIYET_USD.toLocaleString("tr-TR")}/düğüm/ay) ve $${DUGUM_RPS_KAPASITE.toLocaleString("tr-TR")} RPS/düğüm birer MODELLENMİŞ VARSAYIMDIR.`,
  ];

  return {
    hedefHeadroom: HEDEF_HEADROOM,
    ozet: ana,
    kurallar,
    maliyetEtkisi: netTasarruf,
  };
}
