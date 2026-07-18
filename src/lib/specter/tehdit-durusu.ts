/**
 * Specter — Tehdit Duruşu (Threat Posture) Motoru
 * ================================================
 *
 * Bu dosya, dashboard'un "Güven Merkezi"ndeki tek-sayılı "Güven Skoru +
 * kırılım çubukları" özetinin Specter tarafındaki DERİN karşılığıdır. Bir
 * güven merkezinin verdiği yüzeysel "şu kadar puandasınız" hissini alıp,
 * onu botla-mücadele gerçekliğine oturtur: koruma duruşunuzun sağlığını
 * BEŞ ölçülebilir eksene ayırır, her birini gerçek olaylardan hesaplar ve
 * ağırlıklı bir genel skorda birleştirir.
 *
 * NEDEN GERÇEK VERİ:
 * ------------------
 * Buradaki HİÇBİR sayı uydurma, sabit ya da rastgele değildir. Her eksen
 * doğrudan `BotEvent` akışından — verdict (allowed/challenged/blocked/
 * flagged), botClass, score (0..1 insanlık), latency (ms), headless bayrağı
 * ve country dağılımından — türetilir. Motor `Date.now()` / `Math.random()`
 * KULLANMAZ; "şimdi" anı çağıran tarafça `simdi` parametresiyle verilir ve
 * tüm zaman pencereleri olayların kendi `ts` alanlarıyla kıyaslanır. Böylece
 * aynı girdi her zaman aynı çıktıyı üretir (deterministik, test edilebilir,
 * SSR-güvenli).
 *
 * NE HESAPLAR:
 * ------------
 *  1) Engelleme Etkinliği  — son 24s'te aktif olarak durdurulan trafik oranı.
 *  2) AI/Bot Kapsama       — bot sınıflı olayların ne kadarı gerçekten yakalandı.
 *  3) Tespit Hızı          — ortalama yanıt gecikmesi (düşük = çevik savunma).
 *  4) Kimlik Bütünlüğü     — headless/düşük-skorlu (sahte kimlik) olayların engellenme oranı.
 *  5) Coğrafi Netlik       — trafiğin tek ülkeye bağımlılığı (dağınık = sağlıklı).
 *
 * Genel skor bu beş eksenin AĞIRLIKLI ortalamasıdır; ayrıca bir harf notu
 * (A+..D), bir 24s trend farkı (bu pencere vs önceki pencere) ve en zayıf
 * ekseni işaret eden bir "kritik bulgu" döndürür — iyileştirmenin nereden
 * başlayacağını söyler.
 *
 * Tüm alt fonksiyonlar saftır (yan etkisiz) ve dosya dışa hiçbir bağımlılık
 * taşımaz; boş olay dizisinde çökmeden güvenli bir varsayılan döndürür.
 */

import type { BotEvent, BotClass, Verdict } from "@/lib/db/schema";

/* ------------------------------------------------------------------ Tipler */

/**
 * Tehdit duruşunun tek bir alt ekseni. Genel skora `agirlik` oranında
 * katkı verir; `aciklama` panelde çubuğun altına konan insan-okur özettir.
 */
export interface TehditEkseni {
  /** Eksen adı (ör. "Engelleme Etkinliği"). */
  ad: string;
  /** Bu eksenin skoru (0..100). */
  skor: number;
  /** Genel skordaki ağırlığı (0..1; eksenler toplamı 1.0). */
  agirlik: number;
  /** Panelde gösterilecek insan-okur açıklama (gerçek sayılarla). */
  aciklama: string;
}

/**
 * Tehdit Duruşu motorunun tam çıktısı. `guven-merkezi`nin özet kartının
 * Specter derin karşılığı: tek bir genel skor + 5 eksen kırılımı + harf notu
 * + trend + en zayıf halkanın işareti.
 */
export interface TehditDurusu {
  /** Ağırlıklı genel duruş skoru (0..100). */
  genelSkor: number;
  /** Harf notu — skor bandından (A+ / A / B / C / D). */
  durusHarfi: "A+" | "A" | "B" | "C" | "D";
  /** 5 alt eksen (sırası sabit; panelde çubuk olarak çizilir). */
  eksenler: TehditEkseni[];
  /**
   * 24 saatlik trend: son pencere skoru eksi önceki pencere skoru (puan farkı).
   * Pozitif = duruş iyileşiyor, negatif = kötüleşiyor. Veri yoksa 0.
   */
  trend: number;
  /**
   * En düşük skorlu eksen — nereden iyileştirmeye başlanacağını söyler.
   */
  kritikBulgu: {
    /** En zayıf eksenin adı. */
    eksen: string;
    /** O eksenin skoru (0..100). */
    skor: number;
  };
  /** Genel skorun hesaplandığı toplam olay sayısı (şeffaflık için). */
  olaySayisi: number;
}

/* ------------------------------------------------------------------ Sabitler */

/** Bir günün milisaniye karşılığı — 24s pencereleri için. */
const GUN_MS = 86_400_000;

/** Bot sayılan olay sınıfları (human ve good_bot hariç her şey tehdit). */
const BOT_SINIFLARI: ReadonlySet<BotClass> = new Set<BotClass>([
  "automation",
  "scraper",
  "credential_stuffing",
  "ai_agent",
  "ddos",
  "spam",
]);

/** Aktif olarak "durdurulmuş" sayılan kararlar. */
const DURDURAN_KARARLAR: ReadonlySet<Verdict> = new Set<Verdict>(["blocked", "challenged"]);

/* ------------------------------------------------------------------ Yardımcılar (saf) */

/** Bir değeri [min, max] aralığına kıstırır. */
function kis(deger: number, min: number, max: number): number {
  if (deger < min) return min;
  if (deger > max) return max;
  return deger;
}

/** Sayıyı 0..100 aralığına kıstırıp bir ondalığa yuvarlar. */
function skorNormalize(deger: number): number {
  return Math.round(kis(deger, 0, 100) * 10) / 10;
}

/** Bir olayın bot sınıfına ait olup olmadığı. */
function botMu(e: BotEvent): boolean {
  return BOT_SINIFLARI.has(e.botClass);
}

/** Bir olayın aktif olarak durdurulup durdurulmadığı (blocked/challenged). */
function durdurulduMu(e: BotEvent): boolean {
  return DURDURAN_KARARLAR.has(e.verdict);
}

/**
 * Sahte-kimlik sinyali taşıyan olay mı: headless=true VEYA insanlık skoru
 * düşük (< 0.3). Bunlar "kimlik bütünlüğü" ekseninin denetlediği kümedir.
 */
function sahteKimlikMi(e: BotEvent): boolean {
  return e.headless === true || e.score < 0.3;
}

/* ------------------------------------------------------------------ Eksen hesapları (saf) */

/**
 * 1) Engelleme Etkinliği — verilen pencerede aktif durdurulan (blocked+
 * challenged) trafik oranından. 0.30'luk durdurma oranı "tam etkin" (100)
 * kabul edilir; altı lineer ölçeklenir: min(1, oran / 0.30) * 100.
 * Trafik yoksa nötr 50 döner (ne iyi ne kötü — kanıt yok).
 */
function eksenEngellemeEtkinligi(pencere: BotEvent[]): number {
  if (pencere.length === 0) return 50;
  const durduran = pencere.reduce((n, e) => n + (durdurulduMu(e) ? 1 : 0), 0);
  const oran = durduran / pencere.length;
  return skorNormalize(Math.min(1, oran / 0.3) * 100);
}

/**
 * 2) AI/Bot Kapsama — bot sınıflı olayların ne kadarının gerçekten
 * yakalandığı (durdurulduğu): durdurulan bot / tüm bot. Hiç bot yoksa
 * ortada tehdit olmadığı için mükemmel kapsama (100) sayılır.
 */
function eksenBotKapsama(tumu: BotEvent[]): number {
  const botlar = tumu.filter(botMu);
  if (botlar.length === 0) return 100;
  const yakalanan = botlar.reduce((n, e) => n + (durdurulduMu(e) ? 1 : 0), 0);
  return skorNormalize((yakalanan / botlar.length) * 100);
}

/**
 * 3) Tespit Hızı — ortalama yanıt gecikmesinden (ms). <=50ms → 100,
 * >=500ms → 40; arası lineer düşer. Çevik savunma yüksek skor alır.
 * Olay yoksa nötr 50.
 */
function eksenTespitHizi(tumu: BotEvent[]): number {
  if (tumu.length === 0) return 50;
  const toplam = tumu.reduce((n, e) => n + (Number.isFinite(e.latency) ? e.latency : 0), 0);
  const ort = toplam / tumu.length;
  if (ort <= 50) return 100;
  if (ort >= 500) return 40;
  // 50ms → 100, 500ms → 40 arası lineer enterpolasyon.
  const skor = 100 - ((ort - 50) / (500 - 50)) * (100 - 40);
  return skorNormalize(skor);
}

/**
 * 4) Kimlik Bütünlüğü — sahte-kimlik sinyali taşıyan (headless=true VEYA
 * score<0.3) olayların ne kadarının engellendiği: durdurulan-sahte /
 * tüm-sahte. Hiç sahte kimlik yoksa bütünlük tam (100).
 */
function eksenKimlikButunlugu(tumu: BotEvent[]): number {
  const sahteler = tumu.filter(sahteKimlikMi);
  if (sahteler.length === 0) return 100;
  const durdurulan = sahteler.reduce((n, e) => n + (durdurulduMu(e) ? 1 : 0), 0);
  return skorNormalize((durdurulan / sahteler.length) * 100);
}

/**
 * 5) Coğrafi Netlik — trafiğin tek bir ülkeye bağımlılığı. En baskın
 * ülkenin trafik payı düşükse (dağınık) risk düşük → yüksek skor;
 * tek ülke trafiğe hakimse (pay yüksek) → düşük skor.
 * Skor = (1 - topPay) * 100. Olay yoksa nötr 50.
 */
function eksenCografiNetlik(tumu: BotEvent[]): number {
  if (tumu.length === 0) return 50;
  const sayac = new Map<string, number>();
  for (const e of tumu) {
    const ulke = e.country || "??";
    sayac.set(ulke, (sayac.get(ulke) ?? 0) + 1);
  }
  let enCok = 0;
  for (const adet of sayac.values()) {
    if (adet > enCok) enCok = adet;
  }
  const topPay = enCok / tumu.length;
  return skorNormalize((1 - topPay) * 100);
}

/* ------------------------------------------------------------------ Harf notu (saf) */

/** Genel skoru A+..D harf bandına eşler. */
function harfNotu(skor: number): TehditDurusu["durusHarfi"] {
  if (skor >= 90) return "A+";
  if (skor >= 80) return "A";
  if (skor >= 65) return "B";
  if (skor >= 50) return "C";
  return "D";
}

/* ------------------------------------------------------------------ Eksen kümesi (saf) */

/**
 * Bir olay kümesi için 5 ekseni hesaplar. `pencere24` engelleme etkinliği
 * için son-24s alt kümesidir; diğer eksenler tüm küme üzerinden çalışır.
 * Ağırlıklar toplamı 1.0'dır ve genel skorun harmanını belirler.
 */
function eksenleriHesapla(tumu: BotEvent[], pencere24: BotEvent[]): TehditEkseni[] {
  const engellemeSkor = eksenEngellemeEtkinligi(pencere24);
  const kapsamaSkor = eksenBotKapsama(tumu);
  const hizSkor = eksenTespitHizi(tumu);
  const kimlikSkor = eksenKimlikButunlugu(tumu);
  const cografiSkor = eksenCografiNetlik(tumu);

  const p24Durduran = pencere24.reduce((n, e) => n + (durdurulduMu(e) ? 1 : 0), 0);
  const botSayi = tumu.reduce((n, e) => n + (botMu(e) ? 1 : 0), 0);
  const botDurdurulan = tumu.reduce((n, e) => n + (botMu(e) && durdurulduMu(e) ? 1 : 0), 0);
  const ortLatency =
    tumu.length === 0
      ? 0
      : Math.round(tumu.reduce((n, e) => n + (Number.isFinite(e.latency) ? e.latency : 0), 0) / tumu.length);
  const sahteSayi = tumu.reduce((n, e) => n + (sahteKimlikMi(e) ? 1 : 0), 0);
  const sahteDurdurulan = tumu.reduce((n, e) => n + (sahteKimlikMi(e) && durdurulduMu(e) ? 1 : 0), 0);

  return [
    {
      ad: "Engelleme Etkinliği",
      skor: engellemeSkor,
      agirlik: 0.3,
      aciklama:
        pencere24.length === 0
          ? "Son 24 saatte trafik yok — nötr temel alındı."
          : `Son 24s: ${pencere24.length} olaydan ${p24Durduran} tanesi aktif durduruldu (hedef: %30+).`,
    },
    {
      ad: "AI/Bot Kapsama",
      skor: kapsamaSkor,
      agirlik: 0.25,
      aciklama:
        botSayi === 0
          ? "Bot sınıflı trafik yok — kapsama tam sayıldı."
          : `${botSayi} bot olayının ${botDurdurulan} tanesi engellendi/challenge edildi.`,
    },
    {
      ad: "Tespit Hızı",
      skor: hizSkor,
      agirlik: 0.15,
      aciklama:
        tumu.length === 0
          ? "Ölçülecek olay yok — nötr temel alındı."
          : `Ortalama yanıt gecikmesi ${ortLatency}ms (ideal: <50ms).`,
    },
    {
      ad: "Kimlik Bütünlüğü",
      skor: kimlikSkor,
      agirlik: 0.2,
      aciklama:
        sahteSayi === 0
          ? "Sahte-kimlik sinyali (headless/düşük skor) yok."
          : `Sahte-kimlikli ${sahteSayi} olayın ${sahteDurdurulan} tanesi durduruldu.`,
    },
    {
      ad: "Coğrafi Netlik",
      skor: cografiSkor,
      agirlik: 0.1,
      aciklama:
        tumu.length === 0
          ? "Coğrafi dağılım için veri yok — nötr temel alındı."
          : `Trafik ${new Set(tumu.map((e) => e.country || "??")).size} ülkeye dağılmış; tek-ülke bağımlılığı ${skorNormalize(100 - cografiSkor)}%.`,
    },
  ];
}

/** Ağırlıklı ortalamayla genel skoru üretir (ağırlık toplamı ~1.0). */
function genelSkorHesapla(eksenler: TehditEkseni[]): number {
  const agirlikToplam = eksenler.reduce((n, x) => n + x.agirlik, 0);
  if (agirlikToplam <= 0) return 0;
  const carpim = eksenler.reduce((n, x) => n + x.skor * x.agirlik, 0);
  return skorNormalize(carpim / agirlikToplam);
}

/* ------------------------------------------------------------------ Ana giriş */

/**
 * Verilen bot olayları ve "şimdi" anından tam bir Tehdit Duruşu üretir.
 *
 * @param events Ham bot olayları (herhangi bir sırada; filtrelenmemiş olabilir).
 * @param simdi  Referans "şimdi" anı (epoch ms) — pencere ve trend kıyasları buna göre.
 * @returns      Genel skor + 5 eksen + harf + 24s trend + kritik bulgu.
 */
export function tehditDurusu(events: BotEvent[], simdi: number): TehditDurusu {
  const tumu = Array.isArray(events) ? events : [];

  // Güvenli boş varsayılan: hiç olay yoksa nötr bir duruş döndür (çökme yok).
  if (tumu.length === 0) {
    const bosEksenler = eksenleriHesapla([], []);
    const bosGenel = genelSkorHesapla(bosEksenler);
    return {
      genelSkor: bosGenel,
      durusHarfi: harfNotu(bosGenel),
      eksenler: bosEksenler,
      trend: 0,
      kritikBulgu: enZayifEksen(bosEksenler),
      olaySayisi: 0,
    };
  }

  // Zaman pencereleri: [simdi-24s, simdi] son pencere; [simdi-48s, simdi-24s) önceki.
  const pivot = simdi - GUN_MS;
  const oncekiPivot = simdi - 2 * GUN_MS;

  const son24 = tumu.filter((e) => e.ts > pivot && e.ts <= simdi);
  const onceki24 = tumu.filter((e) => e.ts > oncekiPivot && e.ts <= pivot);

  // Ana eksenler tüm veri üzerinden; engelleme etkinliği son-24s penceresinden.
  const eksenler = eksenleriHesapla(tumu, son24);
  const genelSkor = genelSkorHesapla(eksenler);

  // Trend: son 24s duruşu vs önceki 24s duruşu (her pencere kendi içinde skorlanır).
  const sonEksen = eksenleriHesapla(son24, son24);
  const oncekiEksen = eksenleriHesapla(onceki24, onceki24);
  const sonSkor = genelSkorHesapla(sonEksen);
  const oncekiSkor = genelSkorHesapla(oncekiEksen);
  // Önceki pencerede hiç veri yoksa anlamlı bir kıyas yok → trend 0.
  const trend = onceki24.length === 0 ? 0 : Math.round((sonSkor - oncekiSkor) * 10) / 10;

  return {
    genelSkor,
    durusHarfi: harfNotu(genelSkor),
    eksenler,
    trend,
    kritikBulgu: enZayifEksen(eksenler),
    olaySayisi: tumu.length,
  };
}

/** Eksen listesindeki en düşük skorlu ekseni "kritik bulgu" olarak çıkarır. */
function enZayifEksen(eksenler: TehditEkseni[]): TehditDurusu["kritikBulgu"] {
  if (eksenler.length === 0) {
    return { eksen: "—", skor: 0 };
  }
  let enZayif = eksenler[0];
  for (const x of eksenler) {
    if (x.skor < enZayif.skor) enZayif = x;
  }
  return { eksen: enZayif.ad, skor: enZayif.skor };
}
