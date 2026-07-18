/**
 * Specter — Otonom Savunma Orkestratörü (Füzyon Çekirdeği)
 * =======================================================
 * Bu, platformun "beyni"dir: tek tek tespit katmanları (saldırı tahmini, saldırgan
 * niyeti, kill-chain ilerleyişi, bot ekonomisi/caydırıcılık, birleşik risk) ayrı ayrı
 * DOĞRU ama PARÇALI sinyaller üretir. Orkestratör bunların HEPSİNİ birden okuyup TEK
 * bir SAVUNMA DURUŞU + öncelikli OTONOM AKSİYON PLANI'na indirger:
 *
 *   "Şu an bildiğimiz her şeye göre → duruşu X'e sıkılaştır ve şu aksiyonları al."
 *
 * Bu dosya bilinçli olarak src/lib/specter DIŞINDA (panel-yerel) tutulur: motorları
 * DEĞİŞTİRMEZ, yalnızca çıktılarını TÜKETİR. Tamamen saf/deterministik — Date.now /
 * Math.random YOK; tüm girdi zaten hesaplanmış motor çıktılarından gelir.
 *
 * NAMUSLU: Bu bir KARAR-DESTEK füzyonudur. "durusSkoru" birden çok motorun ağırlıklı
 * birleşimidir; kesin bir olasılık değil, açıklanabilir bir tehdit-basıncı endeksidir.
 *
 * ÇOK DİLLİLİK NOTU
 * ----------------
 * Bu çekirdek deterministik metin ÜRETMEZ; her insan-okur alanın yanında bir
 * ANAHTAR (`*Anahtar`) + SAYISAL VERİ (`*Veri`) taşır. Türkçe düz metin alanları
 * (ozet/gerekce/baslik/aksiyon/dayanak) yalnızca güvenli varsayılan/yedek olarak
 * kalır; istemci bunları `orkestra.i18n.ts` sözlüğüyle etkin dile çevirir. Böylece
 * çeviri panel-yerel yapılır ve enum/id değerleri asla çevrilmez.
 */

import type { NiyetOzet } from "@/lib/specter/niyet-siniflandirma";
import type { KillChainOzet } from "@/lib/specter/kill-chain";
import type { BotEkonomiRaporu } from "@/lib/specter/bot-ekonomi";
import type { TahminSonuc, ErkenUyari } from "@/lib/specter/saldiri-tahmin";
import type { BirlesikRiskSonuc } from "@/lib/specter/birlesik-risk";

/* ------------------------------------------------------------------ Girdi tipi */

/**
 * Motorların önceden hesaplanmış çıktılarını taşıyan füzyon girdisi. Her alan
 * opsiyonel olabilir (bir motor veri üretemezse zarifçe atlanır).
 */
export interface Sinyaller {
  /** Saldırgan niyeti özeti (finansal/veri/yıkım/keşif/kötüye). */
  niyet?: NiyetOzet | null;
  /** Kill-chain özeti (ne kadar ilerledi, durdurma oranı, ileri ulaşan). */
  killChain?: KillChainOzet | null;
  /** Bot ekonomisi raporu (caydırıcılık / kâr silme). */
  ekonomi?: BotEkonomiRaporu | null;
  /** Saldırı tahmini çıktısı (trend + ivme). */
  tahmin?: TahminSonuc | null;
  /** Erken uyarı (dalga aktif/yaklaşıyor mu). */
  uyari?: ErkenUyari | null;
  /** Birleşik risk özeti (kritik IP sayısı, ortalama risk). */
  risk?: BirlesikRiskSonuc | null;
  /** Son saatteki mevcut saldırı hızı (bağlam için). */
  mevcutHiz?: number;
}

/* ------------------------------------------------------------------ Çıktı tipleri */

export type Durus = "normal" | "yükseltilmiş" | "savunma" | "kilit";
export type Aciliyet = "düşük" | "orta" | "yüksek" | "kritik";

/** Çeviri için sayısal/token veri torbası (istemci şablona yerleştirir). */
export type Veri = Record<string, string | number>;

/** Duruşların 0-3 tırmanma sırası + görsel meta. */
export const DURUS_META: Record<Durus, { sira: number; ad: string; renk: string; aciklama: string }> = {
  normal: {
    sira: 0, ad: "Normal", renk: "#16a34a",
    aciklama: "Sinyaller sakin. Standart koruma yeterli; müdahaleye gerek yok.",
  },
  yükseltilmiş: {
    sira: 1, ad: "Yükseltilmiş", renk: "#d97706",
    aciklama: "Artan baskı gözleniyor. İzleme sıklaştırılır, şüpheli trafiğe doğrulama artırılır.",
  },
  savunma: {
    sira: 2, ad: "Savunma", renk: "#ea580c",
    aciklama: "Aktif tehdit. Hassas yollar sertleştirilir, oran-sınırlama ve zorluk yükseltilir.",
  },
  kilit: {
    sira: 3, ad: "Kilit", renk: "#dc2626",
    aciklama: "Kritik/koordineli saldırı. En agresif koruma; kritik kaynaklara erişim kilitlenir.",
  },
};

/** Bir otonom (veya önerilen) savunma aksiyonu. */
export interface AutoAksiyon {
  /** Uygulama sırası (1 = en öncelikli). */
  sira: number;
  /** Aksiyon şablon kimliği (çeviri anahtarı — asla çevrilmez). */
  id: string;
  /** Kısa başlık (yedek TR). */
  baslik: string;
  /** Ne yapılacağının açıklaması (yedek TR). */
  aksiyon: string;
  /** baslik/aksiyon şablonuna gömülü sayısal veri. */
  veri: Veri;
  /** Otomatik uygulanabilir mi (true) yoksa insan onayı mı gerekir (false). */
  otomatik: boolean;
  aciliyet: Aciliyet;
  /** Hangi sinyalin tetiklediği (yedek TR gerekçe). */
  dayanak: string;
  /** Dayanağı sağlayan sinyal anahtarı (tahmin/killChain/risk/niyet/ekonomi/fuzyon). */
  dayanakAnahtar: string;
  /** İlgili panelin href'i (aksiyonu icra etmek için). */
  ilgiliPanel: string;
}

/** Bir sinyalin duruş skoruna katkısı (açıklanabilirlik / radar). */
export interface SinyalKatki {
  anahtar: string;
  ad: string;
  /** Bu sinyalin ham tehdit puanı (0-100). */
  puan: number;
  /** Füzyondaki ağırlığı (0-1, toplam ~1). */
  agirlik: number;
  /** Ağırlıklı katkı = puan × ağırlık (skora eklenen). */
  katki: number;
  /** İnsan-okur özet (yedek TR). */
  ozet: string;
  /** Özet şablonunun çeviri anahtarı (asla çevrilmez). */
  ozetAnahtar: string;
  /** Özet şablonuna gömülü sayısal veri. */
  ozetVeri: Veri;
  /** Sinyal etkin mi (veri geldi mi / eşiği aştı mı). */
  aktif: boolean;
}

/** Gerekçenin çeviri için yapısal parçalanmışı. */
export interface GerekceVeri {
  /** "bos" (sinyal yok) ya da "dolu". */
  kip: "bos" | "dolu";
  durus: Durus;
  skor: number;
  /** En güçlü sinyallerin anahtar + ozet(anahtar/veri) dökümü. */
  parcalar: { anahtar: string; ozetAnahtar: string; ozetVeri: Veri }[];
}

export interface OrkestraSonuc {
  durus: Durus;
  /** 0-100 tehdit basıncı endeksi (füzyon skoru). */
  durusSkoru: number;
  /** Neden bu duruş — sinyalleri anan gerekçe (yedek TR). */
  gerekce: string;
  /** Gerekçenin çeviri için yapısal hali. */
  gerekceVeri: GerekceVeri;
  /** Sıralı otonom aksiyon planı. */
  aksiyonlar: AutoAksiyon[];
  /** 0-100 füzyon güveni (kaç sinyal veri sağladı + ne kadar hemfikir). */
  guven: number;
  /** Sinyal katkı dökümü (radar). */
  katkilar: SinyalKatki[];
}

/* ------------------------------------------------------------------ Ağırlıklar */

/**
 * Füzyon ağırlıkları — hangi sinyalin duruşa ne kadar etki ettiği. Tahmin ve
 * kill-chain en yüksek, çünkü "yaklaşan hacim" ve "ne kadar ilerlediler" en
 * eyleme-dönük göstergelerdir. Toplam ~1.
 */
const AGIRLIK = {
  tahmin: 0.24, // yaklaşan dalga / ivme
  killChain: 0.24, // ilerleme + durdurulamama
  niyet: 0.16, // finansal/yıkım niyeti çarpanı
  risk: 0.20, // kritik IP yoğunluğu
  ekonomi: 0.16, // caydırıcılık düşükse baskı artar
} as const;

/* ------------------------------------------------------------------ Puan sonucu tipi */

/** Bir puan çevriminin dönüşü — TR yedek metin + çeviri anahtarı/verisi. */
interface PuanSonuc {
  puan: number;
  ozet: string;
  ozetAnahtar: string;
  ozetVeri: Veri;
  aktif: boolean;
}

/* ------------------------------------------------------------------ Sinyal → puan çevrimleri */

/** Tahmin/uyarı sinyalini 0-100 tehdit puanına çevirir. */
function tahminPuan(tahmin?: TahminSonuc | null, uyari?: ErkenUyari | null, mevcutHiz = 0): PuanSonuc {
  if (!tahmin && !uyari) return { puan: 0, ozet: "Tahmin verisi yok.", ozetAnahtar: "ozet.tahmin.yok", ozetVeri: {}, aktif: false };
  let puan = 0;
  const parcalar: string[] = [];

  if (uyari?.tetiklendi) {
    // Erken uyarı şiddeti taban puanı belirler.
    puan += uyari.siddet === "kritik" ? 70 : uyari.siddet === "uyari" ? 45 : 25;
    parcalar.push(`erken uyarı "${uyari.siddet}" (${uyari.baslik.toLowerCase()})`);
    if (uyari.aniSicrama) { puan += 12; parcalar.push(`ani sıçrama ${uyari.sicramaKat}×`); }
  }
  if (tahmin) {
    if (tahmin.trendYonu === "artıyor") { puan += 18; parcalar.push("hacim trendi artıyor"); }
    else if (tahmin.trendYonu === "azalıyor") { puan -= 8; }
    // İvme (kova başına değişim) hafif katkı.
    if (tahmin.ivme > 0) puan += Math.min(12, tahmin.ivme * 2);
  }
  if (mevcutHiz >= 8) { puan += 8; parcalar.push(`mevcut hız ${mevcutHiz}/saat`); }

  puan = Math.max(0, Math.min(100, Math.round(puan)));
  const ozet = parcalar.length ? parcalar.join(", ") : "Yaklaşan anormal dalga öngörülmüyor.";
  // Çeviri verisi: uyarı şiddeti (enum), sıçrama kat, trend (enum), mevcut hız.
  const ozetVeri: Veri = {
    uyari: uyari?.tetiklendi ? uyari.siddet : "",
    aniSicrama: uyari?.aniSicrama ? String(uyari.sicramaKat ?? "") : "",
    trend: tahmin?.trendYonu ?? "",
    hiz: mevcutHiz >= 8 ? mevcutHiz : "",
  };
  const ozetAnahtar = parcalar.length ? "ozet.tahmin.aktif" : "ozet.tahmin.sakin";
  return { puan, ozet, ozetAnahtar, ozetVeri, aktif: puan > 0 };
}

/** Kill-chain özetini 0-100 tehdit puanına çevirir. */
function killChainPuan(kc?: KillChainOzet | null): PuanSonuc {
  if (!kc || kc.toplamZincir === 0) return { puan: 0, ozet: "Aktif saldırı zinciri yok.", ozetAnahtar: "ozet.killChain.yok", ozetVeri: {}, aktif: false };
  // İleri (sömürü/sızma) ulaşan zincir oranı = en tehlikeli sinyal.
  const ileriOran = kc.ileriUlasan / kc.toplamZincir;
  const durdurmaEksik = 1 - kc.durdurulanOran / 100; // durdurulamayan oran
  let puan = ileriOran * 60 + durdurmaEksik * 35;
  // Geç kesme (ortKesmeSira yüksek) = savunma geç devrede.
  if (kc.ortKesmeSira >= 4) puan += 8;
  puan = Math.max(0, Math.min(100, Math.round(puan)));
  const ozet = `${kc.toplamZincir} zincir, ${kc.ileriUlasan} sömürü/sızmaya ulaştı, durdurma %${Math.round(kc.durdurulanOran)}.`;
  const ozetVeri: Veri = { zincir: kc.toplamZincir, ileri: kc.ileriUlasan, durdurma: Math.round(kc.durdurulanOran) };
  return { puan, ozet, ozetAnahtar: "ozet.killChain.aktif", ozetVeri, aktif: true };
}

/** Niyet özetini 0-100 tehdit puanına çevirir (finansal/yıkım en ağır). */
function niyetPuan(niyet?: NiyetOzet | null): PuanSonuc {
  if (!niyet || niyet.toplamSaldirgan === 0) return { puan: 0, ozet: "Sınıflandırılmış saldırgan yok.", ozetAnahtar: "ozet.niyet.yok", ozetVeri: {}, aktif: false };
  const bask = niyet.baskinNiyet;
  // Niyet ağırlığı: finansal ve yıkım en tehlikeli; keşif en düşük.
  const niyetAgirlik: Record<string, number> = { finansal: 90, yikim: 80, kotuye: 55, veri: 45, kesif: 30 };
  const taban = bask ? niyetAgirlik[bask] ?? 40 : 20;
  // Genel niyet güveni ölçekler.
  const guvenOlcek = 0.6 + 0.4 * (niyet.genelNiyet.guven / 100);
  const puan = Math.max(0, Math.min(100, Math.round(taban * guvenOlcek)));
  const baskAd = bask ?? "belirsiz";
  const ozet = `${niyet.toplamSaldirgan} saldırgan; baskın niyet "${baskAd}" (güven %${niyet.genelNiyet.guven}).`;
  // Çeviri verisi: saldırgan sayısı, baskın niyet ENUM'u (istemci çevirir), güven.
  const ozetVeri: Veri = { saldirgan: niyet.toplamSaldirgan, niyet: bask ?? "", guven: niyet.genelNiyet.guven };
  return { puan, ozet, ozetAnahtar: "ozet.niyet.aktif", ozetVeri, aktif: true };
}

/** Birleşik risk özetini 0-100 tehdit puanına çevirir. */
function riskPuan(risk?: BirlesikRiskSonuc | null): PuanSonuc {
  if (!risk || risk.ozet.toplamIp === 0) return { puan: 0, ozet: "Risk skorlanan IP yok.", ozetAnahtar: "ozet.risk.yok", ozetVeri: {}, aktif: false };
  const { kritik, yuksek, ortRisk, toplamIp } = risk.ozet;
  // Kritik+yüksek IP oranı + ortalama risk birleşimi.
  const tehlikeliOran = (kritik + yuksek) / toplamIp;
  let puan = ortRisk * 0.5 + tehlikeliOran * 50;
  if (kritik > 0) puan += Math.min(15, kritik * 3);
  puan = Math.max(0, Math.min(100, Math.round(puan)));
  const ozet = `${toplamIp} IP; ${kritik} kritik, ${yuksek} yüksek, ort. risk ${ortRisk}.`;
  const ozetVeri: Veri = { ip: toplamIp, kritik, yuksek, ort: ortRisk };
  return { puan, ozet, ozetAnahtar: "ozet.risk.aktif", ozetVeri, aktif: true };
}

/**
 * Ekonomi/caydırıcılık sinyali TERS çalışır: caydırıcılık YÜKSEKSE tehdit puanı
 * DÜŞÜK, caydırıcılık zayıfsa (saldırgan hâlâ kâr ediyor) tehdit puanı YÜKSEK.
 */
function ekonomiPuan(eko?: BotEkonomiRaporu | null): PuanSonuc {
  if (!eko || eko.ozet.toplamSinif === 0) return { puan: 0, ozet: "Ekonomik saldırı sınıfı yok.", ozetAnahtar: "ozet.ekonomi.yok", ozetVeri: {}, aktif: false };
  const { caydirilanSinif, toplamSinif, korumaToplamKar } = eko.ozet;
  const caydirmaOran = caydirilanSinif / toplamSinif; // 1 = hepsi kârsız (iyi)
  // Ters: caydırma düştükçe puan artar.
  let puan = (1 - caydirmaOran) * 70;
  // Specter'a rağmen saldırgan hâlâ kâr ediyorsa ek baskı.
  if (korumaToplamKar > 0) puan += Math.min(30, korumaToplamKar / 2);
  puan = Math.max(0, Math.min(100, Math.round(puan)));
  const ozet = `${caydirilanSinif}/${toplamSinif} sınıf kârsız kılındı; kalan saldırgan kârı ~$${korumaToplamKar}.`;
  const ozetVeri: Veri = { caydirilan: caydirilanSinif, toplam: toplamSinif, kar: korumaToplamKar };
  return { puan, ozet, ozetAnahtar: "ozet.ekonomi.aktif", ozetVeri, aktif: true };
}

/* ------------------------------------------------------------------ Katkı dökümü */

/**
 * Her sinyalin duruş skoruna ağırlıklı katkısını çıkarır (açıklanabilirlik/radar).
 * defansDurusuHesap bunu içeride de kullanır.
 */
export function sinyalKatkilari(sinyaller: Sinyaller): SinyalKatki[] {
  const t = tahminPuan(sinyaller.tahmin, sinyaller.uyari, sinyaller.mevcutHiz ?? 0);
  const kc = killChainPuan(sinyaller.killChain);
  const ni = niyetPuan(sinyaller.niyet);
  const ri = riskPuan(sinyaller.risk);
  const ek = ekonomiPuan(sinyaller.ekonomi);

  const yap = (anahtar: string, ad: string, agirlik: number, s: PuanSonuc): SinyalKatki => ({
    anahtar, ad, agirlik, puan: s.puan,
    katki: Math.round(s.puan * agirlik * 10) / 10,
    ozet: s.ozet, ozetAnahtar: s.ozetAnahtar, ozetVeri: s.ozetVeri, aktif: s.aktif,
  });

  return [
    yap("tahmin", "Saldırı Tahmini", AGIRLIK.tahmin, t),
    yap("killChain", "Kill-Chain İlerleyişi", AGIRLIK.killChain, kc),
    yap("risk", "Birleşik Risk", AGIRLIK.risk, ri),
    yap("niyet", "Saldırgan Niyeti", AGIRLIK.niyet, ni),
    yap("ekonomi", "Bot Ekonomisi", AGIRLIK.ekonomi, ek),
  ];
}

/* ------------------------------------------------------------------ Aksiyon planı */

/**
 * Duruşa ve etkin sinyallere göre sıralı otonom aksiyon planı üretir. Aksiyonlar,
 * hangi sinyalin tetiklediğine (dayanak) ve icra edileceği panele (ilgiliPanel)
 * bağlanır. Önce en yüksek aciliyet.
 */
function aksiyonUret(durus: Durus, katkilar: SinyalKatki[], sinyaller: Sinyaller): AutoAksiyon[] {
  const durusSira = DURUS_META[durus].sira;
  const cikan: Omit<AutoAksiyon, "sira">[] = [];
  const kMap = new Map(katkilar.map((k) => [k.anahtar, k]));

  const kill = kMap.get("killChain")!;
  const risk = kMap.get("risk")!;
  const niyet = kMap.get("niyet")!;
  const tahmin = kMap.get("tahmin")!;
  const eko = kMap.get("ekonomi")!;

  // 1) Kill-chain ileri ulaştıysa → hassas yolları sertleştir.
  if (kill.aktif && (sinyaller.killChain?.ileriUlasan ?? 0) > 0) {
    cikan.push({
      id: "hassasYol",
      baslik: "Hassas yolları sertleştir",
      aksiyon: "login/checkout/admin yollarında zorluk seviyesini yükselt, otomasyon imzalarını doğrudan engelle.",
      veri: {},
      otomatik: durusSira >= 2,
      aciliyet: durusSira >= 3 ? "kritik" : "yüksek",
      dayanak: `Kill-Chain: ${kill.ozet}`,
      dayanakAnahtar: "killChain",
      ilgiliPanel: "/panel/kill-chain",
    });
  }

  // 2) Kritik risk IP'leri → engelle.
  if (risk.aktif && (sinyaller.risk?.ozet.engellenmeli ?? 0) > 0) {
    const n = sinyaller.risk!.ozet.engellenmeli;
    cikan.push({
      id: "ipEngelle",
      baslik: `${n} yüksek-riskli IP'yi engelle`,
      aksiyon: `Birleşik risk motorunun "engelle" önerdiği ${n} IP için otomatik engelleme kuralı uygula.`,
      veri: { n },
      otomatik: durusSira >= 2,
      aciliyet: durusSira >= 3 ? "kritik" : "yüksek",
      dayanak: `Birleşik Risk: ${risk.ozet}`,
      dayanakAnahtar: "risk",
      ilgiliPanel: "/panel/birlesik-risk",
    });
  }

  // 3) Finansal niyet → kimlik-doğrulama akışlarını koru.
  if (niyet.aktif && sinyaller.niyet?.baskinNiyet === "finansal") {
    cikan.push({
      id: "kimlikKoru",
      baslik: "Kimlik akışlarını koruma moduna al",
      aksiyon: "Giriş/ödeme uçlarına adım-artırılmış doğrulama (step-up) ve oran-sınırlama uygula; kimlik-doldurma imzalarını izle.",
      veri: {},
      otomatik: durusSira >= 2,
      aciliyet: "kritik",
      dayanak: `Niyet: ${niyet.ozet}`,
      dayanakAnahtar: "niyet",
      ilgiliPanel: "/panel/niyet",
    });
  } else if (niyet.aktif && sinyaller.niyet?.baskinNiyet === "yikim") {
    cikan.push({
      id: "kaynakOranSinir",
      baslik: "Kaynak-tüketimine karşı oran-sınırla",
      aksiyon: "DDoS/yıkım niyetine karşı IP başına oran-sınırlamayı sıkılaştır, pahalı uçları önbelleğe/kuyruğa al.",
      veri: {},
      otomatik: durusSira >= 2,
      aciliyet: "yüksek",
      dayanak: `Niyet: ${niyet.ozet}`,
      dayanakAnahtar: "niyet",
      ilgiliPanel: "/panel/niyet",
    });
  }

  // 4) Yaklaşan dalga → ölçekleme + izleme.
  if (tahmin.aktif && (sinyaller.uyari?.tetiklendi || sinyaller.tahmin?.trendYonu === "artıyor")) {
    const yaklasyor = sinyaller.uyari?.zirveKova && sinyaller.uyari.zirveKova > 0;
    cikan.push({
      id: yaklasyor ? "dalgaHazirlan" : "dalgaSonumle",
      baslik: yaklasyor ? "Yaklaşan dalgaya hazırlan" : "Aktif dalgayı sönümle",
      aksiyon: yaklasyor
        ? "Öngörülen zirveden önce kapasite/edge önbelleğini ölçekle, komuta merkezinde canlı izlemeyi aç."
        : "Aktif dalga için otomatik zorluk yükseltmeyi devreye al ve trafiği yakından izle.",
      veri: {},
      otomatik: durusSira >= 1,
      aciliyet: durusSira >= 3 ? "yüksek" : "orta",
      dayanak: `Tahmin: ${tahmin.ozet}`,
      dayanakAnahtar: "tahmin",
      ilgiliPanel: "/panel/saldiri-tahmin",
    });
  }

  // 5) Caydırıcılık zayıfsa → ekonomik baskıyı artır (zorluk kalibrasyonu).
  if (eko.aktif && eko.puan >= 40) {
    cikan.push({
      id: "ekonomiKirsizlastir",
      baslik: "Saldırı ekonomisini kârsızlaştır",
      aksiyon: "Hâlâ kâr eden saldırı sınıflarına ghost-font zorluğunu ve deneme maliyetini yükselt (çözüm-çiftliği ROI'sini kır).",
      veri: {},
      otomatik: false,
      aciliyet: durusSira >= 2 ? "orta" : "düşük",
      dayanak: `Ekonomi: ${eko.ozet}`,
      dayanakAnahtar: "ekonomi",
      ilgiliPanel: "/panel/bot-ekonomi",
    });
  }

  // 6) Kilit duruşunda → koordineli müdahale playbook'u başlat.
  if (durusSira >= 3) {
    cikan.push({
      id: "playbook",
      baslik: "Koordineli müdahale playbook'u başlat",
      aksiyon: "Kilit duruşu tetiklendi: komuta merkezinden koordineli müdahaleyi başlat, ekibe kritik uyarı gönder.",
      veri: {},
      otomatik: false,
      aciliyet: "kritik",
      dayanak: "Füzyon: kritik tehdit basıncı — birden çok sinyal aynı anda yüksek.",
      dayanakAnahtar: "fuzyon",
      ilgiliPanel: "/panel/komuta-merkezi",
    });
  }

  // Sakin durum: hiçbir aksiyon tetiklenmediyse tek "gözlem" aksiyonu.
  if (cikan.length === 0) {
    cikan.push({
      id: "gozlem",
      baslik: "Standart izlemeyi sürdür",
      aksiyon: "Sinyaller sakin. Mevcut koruma politikaları yeterli; yalnızca rutin gözlem gerekir.",
      veri: {},
      otomatik: true,
      aciliyet: "düşük",
      dayanak: "Füzyon: tüm sinyaller eşik altında.",
      dayanakAnahtar: "fuzyonSakin",
      ilgiliPanel: "/panel/komuta-merkezi",
    });
  }

  // Aciliyet sırasına göre diz + sıra ata.
  const acilSira: Record<Aciliyet, number> = { kritik: 0, yüksek: 1, orta: 2, düşük: 3 };
  cikan.sort((a, b) => acilSira[a.aciliyet] - acilSira[b.aciliyet]);
  return cikan.map((a, i) => ({ ...a, sira: i + 1 }));
}

/* ------------------------------------------------------------------ Ana füzyon */

/** Duruş skorunu 0-3 tırmanma seviyesine eşler. */
function durusBul(skor: number): Durus {
  if (skor >= 68) return "kilit";
  if (skor >= 45) return "savunma";
  if (skor >= 24) return "yükseltilmiş";
  return "normal";
}

/**
 * FÜZYON: tüm sinyalleri tek savunma duruşu + aksiyon planına indirger.
 *
 * Skor = Σ (sinyal puanı × ağırlık). Ayrıca "tehlike birleşimi" kuralı:
 * yüksek tahmin + ileri kill-chain + finansal/yıkım niyeti + zayıf caydırıcılık
 * aynı anda gerçekleşirse skor ek olarak yükseltilir (koordineli saldırı imzası).
 */
export function defansDurusuHesap(sinyaller: Sinyaller): OrkestraSonuc {
  const katkilar = sinyalKatkilari(sinyaller);
  const kMap = new Map(katkilar.map((k) => [k.anahtar, k]));

  // Temel skor: ağırlıklı katkıların toplamı.
  let skor = katkilar.reduce((a, k) => a + k.katki, 0);

  // Tehlike birleşimi (koordineli-saldırı çarpanı): birden çok kritik sinyal
  // aynı anda yüksekse tehdit doğrusal-üstü artar.
  const yuksekSinyaller = katkilar.filter((k) => k.puan >= 55).length;
  if (yuksekSinyaller >= 3) skor += 10;
  else if (yuksekSinyaller === 2) skor += 5;

  // Özel imza: finansal niyet + ileri kill-chain birlikte → hesap-ele-geçirme kampanyası.
  const finansal = sinyaller.niyet?.baskinNiyet === "finansal";
  const ileriZincir = (sinyaller.killChain?.ileriUlasan ?? 0) > 0;
  if (finansal && ileriZincir && (kMap.get("tahmin")?.puan ?? 0) >= 40) skor += 8;

  skor = Math.max(0, Math.min(100, Math.round(skor)));
  const durus = durusBul(skor);

  // Güven: kaç sinyal veri sağladı (kapsam) + baskın sinyal ne kadar net.
  const aktifSayi = katkilar.filter((k) => k.aktif).length;
  const kapsam = aktifSayi / katkilar.length; // 0-1
  const enYuksekKatki = Math.max(...katkilar.map((k) => k.katki), 0);
  const toplamKatki = katkilar.reduce((a, k) => a + k.katki, 0) || 1;
  const netlik = enYuksekKatki / toplamKatki; // baskınlık
  const guven = Math.round(Math.min(100, kapsam * 65 + netlik * 25 + (aktifSayi >= 3 ? 10 : 0)));

  const aksiyonlar = aksiyonUret(durus, katkilar, sinyaller);

  // Gerekçe: en güçlü 2-3 sinyali anarak duruşu açıkla.
  const enGuclu = [...katkilar].filter((k) => k.aktif).sort((a, b) => b.katki - a.katki).slice(0, 3);
  const gerekce =
    aktifSayi === 0
      ? "Hiçbir tespit katmanı anlamlı sinyal üretmedi; sistem sakin — standart koruma yeterli."
      : `Önerilen duruş: ${DURUS_META[durus].ad} (tehdit basıncı ${skor}/100). ` +
        `Başlıca katkılar: ${enGuclu.map((k) => `${k.ad} (${k.ozet})`).join(" · ")}`;

  // Gerekçenin çeviri için yapısal hali (istemci düz metni yeniden kurar).
  const gerekceVeri: GerekceVeri = {
    kip: aktifSayi === 0 ? "bos" : "dolu",
    durus,
    skor,
    parcalar: enGuclu.map((k) => ({ anahtar: k.anahtar, ozetAnahtar: k.ozetAnahtar, ozetVeri: k.ozetVeri })),
  };

  return { durus, durusSkoru: skor, gerekce, gerekceVeri, aksiyonlar, guven, katkilar };
}
