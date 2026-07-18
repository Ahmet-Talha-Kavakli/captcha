/**
 * Specter — Bot Ekonomisi & Caydırıcılık Modeli
 * =============================================
 * Bir botu durdurmak teknik değil, EKONOMİK bir savaştır: saldırgan ancak
 * saldırının BEKLENEN GETİRİSİ MALİYETİNDEN büyükse devam eder. Specter'ın işi
 * saldırı başına maliyeti caydırıcı eşiğin üstüne çıkarmaktır.
 *
 * Bu modül saldırgan tarafının ekonomisini modeller:
 *   • Her saldırı sınıfının BİRİM MALİYETİ (proxy/IP kirası, çözüm başına CAPTCHA
 *     çözme ücreti, taze hesap, hesaplama/başarısız-deneme maliyeti).
 *   • Specter'ın bu maliyeti KAÇ KAT yükselttiği (ghost-font çözülemezliği +
 *     davranış skoru + oran sınırlama → başarı oranını düşürür, deneme maliyetini
 *     yükseltir).
 *   • CAYDIRICILIK: saldırının beklenen değeri, yükseltilmiş maliyetin altına
 *     düşüyor mu → saldırgan için kârsız = caydırıldı.
 *
 * Rakamlar SEKTÖR REFERANS TAHMİNLERİDİR (proxy fiyatları, CAPTCHA-çözüm çiftlik
 * ücretleri kamuya açık aralıklardan) — kesin ölçüm değil, ekonomik MODEL. Gerçek
 * olan: hangi saldırı sınıfının kaç istek ürettiği (gözlemlenen olaylardan).
 * Saf/deterministik: Date.now/Math.random YOK.
 */
import type { BotEvent } from "@/lib/db/schema";

/** Bir saldırı sınıfının ekonomik profili (sektör referans tahminleri, USD). */
export interface SaldiriEkonomi {
  botClass: string;
  ad: string;
  /** Saldırganın hedefi (neden yapıyor). */
  amac: string;
  /** İstek başına temel maliyet (proxy/altyapı), USD. */
  istekMaliyeti: number;
  /** Başarılı eylem başına saldırganın kazancı (ele geçen hesap, kazınan kayıt değeri), USD. */
  basariDegeri: number;
  /** Specter YOKKEN saldırının başarı oranı (0-1). */
  hamBasariOran: number;
  /** Specter'ın başarı oranını düşürme çarpanı (ghost-font + davranış → başarı ×bu). */
  specterBasariCarpani: number;
  /** Specter deneme maliyetini kaç kat artırır (çözüm-çiftliği/yeniden-deneme). */
  specterMaliyetCarpani: number;
}

/**
 * Sektör referans ekonomileri. Kaynaklar: proxy kiralama (~$0.5-3/GB residential),
 * CAPTCHA çözüm çiftlikleri (~$1-3 / 1000 çözüm), çalınan hesap değeri (karaborsa
 * $1-15), kazınan veri değeri. Hepsi TAHMİNİ ARALIK ORTASI — model amaçlı.
 */
export const EKONOMILER: SaldiriEkonomi[] = [
  {
    botClass: "credential_stuffing", ad: "Kimlik Doldurma", amac: "Hesap ele geçirme",
    istekMaliyeti: 0.002, basariDegeri: 8, hamBasariOran: 0.015,
    specterBasariCarpani: 0.04, specterMaliyetCarpani: 22,
  },
  {
    botClass: "scraper", ad: "İçerik Kazıma", amac: "Veri/fiyat toplama",
    istekMaliyeti: 0.0015, basariDegeri: 0.05, hamBasariOran: 0.9,
    specterBasariCarpani: 0.08, specterMaliyetCarpani: 14,
  },
  {
    botClass: "ai_agent", ad: "AI Eğitim Taraması", amac: "Model eğitim verisi",
    istekMaliyeti: 0.001, basariDegeri: 0.03, hamBasariOran: 0.85,
    specterBasariCarpani: 0.15, specterMaliyetCarpani: 9,
  },
  {
    botClass: "ddos", ad: "DDoS Seli", amac: "Hizmet kesintisi",
    istekMaliyeti: 0.0003, basariDegeri: 0.4, hamBasariOran: 0.6,
    specterBasariCarpani: 0.1, specterMaliyetCarpani: 12,
  },
  {
    botClass: "spam", ad: "Spam/Sahte Kayıt", amac: "Sahte hesap/içerik",
    istekMaliyeti: 0.004, basariDegeri: 0.6, hamBasariOran: 0.5,
    specterBasariCarpani: 0.06, specterMaliyetCarpani: 18,
  },
  {
    botClass: "automation", ad: "Genel Otomasyon", amac: "Çeşitli kötüye kullanım",
    istekMaliyeti: 0.002, basariDegeri: 0.5, hamBasariOran: 0.7,
    specterBasariCarpani: 0.1, specterMaliyetCarpani: 13,
  },
];

const EKO_MAP = new Map(EKONOMILER.map((e) => [e.botClass, e]));

export interface SinifEkonomiSonuc {
  eko: SaldiriEkonomi;
  /** Gözlemlenen istek sayısı (GERÇEK). */
  istekSayisi: number;
  /* --- Specter YOKKEN --- */
  hamMaliyet: number; // saldırganın toplam altyapı maliyeti
  hamBasari: number; // beklenen başarılı eylem sayısı
  hamGetiri: number; // saldırganın beklenen kazancı
  hamKar: number; // getiri - maliyet
  hamRoi: number; // kar / maliyet
  /* --- Specter VARKEN --- */
  korumaMaliyet: number; // yükseltilmiş deneme maliyeti
  korumaBasari: number; // düşürülmüş başarı
  korumaGetiri: number;
  korumaKar: number;
  korumaRoi: number;
  /** Saldırgan için kârsız mı (caydırıldı). */
  caydirildi: boolean;
  /** Başarı başına maliyet Specter'la kaç kat arttı. */
  maliyetArtisCarpani: number;
}

function yuvarla(n: number, basamak = 2): number {
  const p = Math.pow(10, basamak);
  return Math.round(n * p) / p;
}

/** Bir saldırı sınıfının gözlemlenen istek hacmiyle ekonomisini hesaplar. */
function sinifHesap(eko: SaldiriEkonomi, istekSayisi: number): SinifEkonomiSonuc {
  // Specter YOK:
  const hamMaliyet = istekSayisi * eko.istekMaliyeti;
  const hamBasari = istekSayisi * eko.hamBasariOran;
  const hamGetiri = hamBasari * eko.basariDegeri;
  const hamKar = hamGetiri - hamMaliyet;
  const hamRoi = hamMaliyet > 0 ? hamKar / hamMaliyet : 0;

  // Specter VAR: başarı oranı düşer (ghost-font çözülemez + davranış skoru), aynı
  // sayıda başarı için saldırgan çok daha fazla deneme yapmak zorunda → maliyet artar.
  const korumaBasariOran = eko.hamBasariOran * eko.specterBasariCarpani;
  const korumaBasari = istekSayisi * korumaBasariOran;
  // Deneme maliyeti çarpanı: çözüm-çiftliği ücreti + yeniden-deneme yükü.
  const korumaMaliyet = hamMaliyet * eko.specterMaliyetCarpani;
  const korumaGetiri = korumaBasari * eko.basariDegeri;
  const korumaKar = korumaGetiri - korumaMaliyet;
  const korumaRoi = korumaMaliyet > 0 ? korumaKar / korumaMaliyet : 0;

  // Başarı başına maliyet: Specter'la kaç kat pahalılaştı.
  const hamBirimMaliyet = hamBasari > 0 ? hamMaliyet / hamBasari : 0;
  const korumaBirimMaliyet = korumaBasari > 0 ? korumaMaliyet / korumaBasari : Infinity;
  const maliyetArtisCarpani = hamBirimMaliyet > 0 && isFinite(korumaBirimMaliyet)
    ? korumaBirimMaliyet / hamBirimMaliyet : eko.specterMaliyetCarpani / eko.specterBasariCarpani;

  return {
    eko, istekSayisi,
    hamMaliyet: yuvarla(hamMaliyet), hamBasari: yuvarla(hamBasari, 1), hamGetiri: yuvarla(hamGetiri), hamKar: yuvarla(hamKar), hamRoi: yuvarla(hamRoi),
    korumaMaliyet: yuvarla(korumaMaliyet), korumaBasari: yuvarla(korumaBasari, 2), korumaGetiri: yuvarla(korumaGetiri), korumaKar: yuvarla(korumaKar), korumaRoi: yuvarla(korumaRoi),
    caydirildi: korumaKar <= 0, // kâr sıfır/negatif → saldırgan için anlamsız
    maliyetArtisCarpani: yuvarla(maliyetArtisCarpani, 1),
  };
}

export interface BotEkonomiRaporu {
  siniflar: SinifEkonomiSonuc[];
  ozet: {
    toplamIstek: number;
    /** Specter yokken saldırganların toplam beklenen kârı. */
    hamToplamKar: number;
    /** Specter varken toplam beklenen kâr. */
    korumaToplamKar: number;
    /** Saldırgan kârından silinen miktar (caydırıcılık değeri). */
    silinenKar: number;
    /** Kaç saldırı sınıfı kârsız hale getirildi (caydırıldı). */
    caydirilanSinif: number;
    toplamSinif: number;
    /** Ortalama maliyet-artış çarpanı. */
    ortMaliyetArtis: number;
  };
}

/**
 * Gözlemlenen olaylardan bot ekonomisi raporu üretir. Yalnızca ekonomisi
 * tanımlı kötü sınıflar dahil edilir; hiç istek görülmeyen sınıflar atlanır.
 */
export function botEkonomiHesap(events: BotEvent[]): BotEkonomiRaporu {
  const sayac = new Map<string, number>();
  for (const e of events) {
    if (EKO_MAP.has(e.botClass)) sayac.set(e.botClass, (sayac.get(e.botClass) || 0) + 1);
  }

  const siniflar: SinifEkonomiSonuc[] = [];
  for (const eko of EKONOMILER) {
    const n = sayac.get(eko.botClass) || 0;
    if (n === 0) continue;
    siniflar.push(sinifHesap(eko, n));
  }
  siniflar.sort((a, b) => b.hamKar - a.hamKar);

  const toplamIstek = siniflar.reduce((a, s) => a + s.istekSayisi, 0);
  const hamToplamKar = yuvarla(siniflar.reduce((a, s) => a + s.hamKar, 0));
  const korumaToplamKar = yuvarla(siniflar.reduce((a, s) => a + s.korumaKar, 0));
  const caydirilanSinif = siniflar.filter((s) => s.caydirildi).length;
  const ortMaliyetArtis = siniflar.length
    ? yuvarla(siniflar.reduce((a, s) => a + s.maliyetArtisCarpani, 0) / siniflar.length, 1) : 0;

  return {
    siniflar,
    ozet: {
      toplamIstek,
      hamToplamKar, korumaToplamKar,
      silinenKar: yuvarla(hamToplamKar - korumaToplamKar),
      caydirilanSinif, toplamSinif: siniflar.length,
      ortMaliyetArtis,
    },
  };
}
