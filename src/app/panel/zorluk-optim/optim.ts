/**
 * Adaptif Zorluk A/B Optimizasyon Motoru — Saf Hesap Katmanı
 * ==========================================================
 * Bu modül, Specter'ın gözlemlediği GERÇEK trafiği (BotEvent) farklı zorluk
 * POLİTİKALARINDAN geçirerek her birinin sonucunu KONTRFAKTÜEL (counterfactual)
 * simüle eder: "eğer bu politika yürürlükte olsaydı hangi istekleri challenge
 * ederdi, kaç botu yakalar, kaç insana sürtünme yaratırdı?".
 *
 * Sonra objektife (max bot-engelleme × min insan-sürtünmesi) göre bir NET SKOR
 * hesaplar, politikaları sıralar ve iki-oran z-testi + Wilson güven aralığı ile
 * KAZANANI istatistiksel olarak seçer. Nihayetinde uygulanabilir bir öneri üretir.
 *
 * ÖNEMLİ: Bu bir CANLI A/B trafiği bölmesi DEĞİLDİR. Aynı gözlemlenen olay
 * kümesi her politikadan ayrı ayrı geçirilir (replay) — yani "counterfactual
 * simülasyon". İstemci bunu dürüstçe etiketler.
 *
 * Saf/deterministik: Date.now / Math.random YOK. Aynı olaylar → aynı sonuç.
 * deney-istatistik.ts'teki Wilson CI + z-testi READ-ONLY olarak yeniden kullanılır.
 */
import type { BotEvent, BotClass } from "@/lib/db/schema";
import { deneyAnaliz, wilsonAralik, type DeneyAnaliz, type WilsonAralik } from "@/lib/specter/deney-istatistik";

/* ------------------------------------------------------------------ Politikalar */

export interface Politika {
  id: string;
  /** İnsan-okur ad. */
  ad: string;
  /** Kısa açıklama (davranış özeti). */
  aciklama: string;
  /**
   * Bot eşiği (0..1 insanlık skoru). Bir isteğin skoru bu eşiğin ALTINDAysa
   * politika onu challenge/engelleme adayı sayar. Yüksek eşik = daha çok
   * isteğe dokunur (agresif); düşük eşik = yalnızca en şüphelilere dokunur.
   */
  botEsik: number;
  /** Agresiflik 0..1 — challenge yerine doğrudan ENGELLEME olasılığını ölçekler. */
  agresiflik: number;
}

/**
 * Yarışan zorluk politikaları. En yumuşaktan en agresife sıralı. "Adaptif",
 * skora göre eşiğini kaydıran orta-yol politikadır (skor çok düşükse sert,
 * sınırdaysa yumuşak davranır).
 */
export const POLITIKALAR: Politika[] = [
  {
    id: "yumusak",
    ad: "Yumuşak",
    aciklama: "Yalnızca en bariz botlara (çok düşük skor) dokunur. İnsan sürtünmesi en düşük, ama bazı botlar sızar.",
    botEsik: 0.3,
    agresiflik: 0.2,
  },
  {
    id: "dengeli",
    ad: "Dengeli",
    aciklama: "Şüpheli trafiği makul bir eşikte challenge eder. Bot yakalama ile sürtünme arasında denge kurar.",
    botEsik: 0.5,
    agresiflik: 0.45,
  },
  {
    id: "adaptif",
    ad: "Adaptif",
    aciklama: "Eşiğini isteğin skoruna ve otomasyon sinyaline göre CANLI kaydırır: net bot'a sert, sınır vakada yumuşak.",
    botEsik: 0.55,
    agresiflik: 0.5,
  },
  {
    id: "siki",
    ad: "Sıkı",
    aciklama: "Yüksek eşikle geniş bir şüpheli bandını challenge eder. Bot yakalama yüksek, insan sürtünmesi artar.",
    botEsik: 0.65,
    agresiflik: 0.6,
  },
  {
    id: "agresif",
    ad: "Agresif",
    aciklama: "Sıfır tolerans: en geniş bandı doğrudan engellemeye yakın davranır. En çok botu durdurur, en çok insanı yorar.",
    botEsik: 0.78,
    agresiflik: 0.85,
  },
];

/* ------------------------------------------------------------------ Sınıflandırma */

/** İnsan tarafı sayılan sınıflar (iyi bot dahil — bunlara sürtünme İSTENMEZ). */
const INSAN_TARAFI: BotClass[] = ["human", "good_bot"];

/** Bir olayın "gerçek insan/iyi bot" mı yoksa "bot/kötü niyetli" mi olduğu. */
function insanMi(e: BotEvent): boolean {
  return INSAN_TARAFI.includes(e.botClass);
}

/** Olaydan otomasyon sinyali türet (adaptif politika bunu kullanır). */
function otomasyonSinyali(e: BotEvent): boolean {
  return (
    e.botClass === "automation" ||
    e.botClass === "scraper" ||
    e.botClass === "credential_stuffing" ||
    e.botClass === "ddos" ||
    e.headless === true ||
    e.tlsUaUyumsuz === true
  );
}

/* ------------------------------------------------------------------ Politika kararı */

/** Bir politikanın tek bir olaya vereceği karar (kontrfaktüel). */
type Karar = "gecir" | "challenge" | "engelle";

/**
 * Bir politikanın tek olaya vereceği kararı hesaplar. Skor eşiğin altındaysa
 * politika dokunur; agresifliğe göre challenge mı engelleme mi olduğu belirlenir.
 * "Adaptif" politika eşiğini otomasyon sinyaliyle canlı kaydırır.
 */
function politikaKarar(p: Politika, e: BotEvent): Karar {
  let esik = p.botEsik;

  // Adaptif: net bot sinyalinde eşiği yukarı it (daha çok yakala); temiz-görünen
  // sınır vakada eşiği düşür (insana dokunma). Deterministik, olay verisine bağlı.
  if (p.id === "adaptif") {
    if (otomasyonSinyali(e)) esik = Math.min(0.85, esik + 0.15);
    else if (e.score >= 0.75) esik = Math.max(0.3, esik - 0.2);
  }

  if (e.score >= esik) return "gecir";

  // Eşiğin altı → dokunulur. Skor ne kadar düşükse ve politika ne kadar agresifse
  // doğrudan ENGELLEME olasılığı o kadar yüksek; aksi halde challenge.
  // Deterministik karar: "engelleme sertliği" = agresiflik × (eşiğe uzaklık).
  const uzaklik = (esik - e.score) / esik; // 0..1, eşiğin ne kadar altında
  const engelleSertligi = p.agresiflik * uzaklik;
  return engelleSertligi >= 0.35 ? "engelle" : "challenge";
}

/* ------------------------------------------------------------------ Sonuç tipi */

export interface PolitikaSonuc {
  politika: Politika;
  /** Toplam bot (insan-tarafı olmayan) olay sayısı. */
  botToplam: number;
  /** Toplam insan/iyi-bot olay sayısı. */
  insanToplam: number;
  /** Politikanın challenge+engelleme ile DURDURDUĞU bot sayısı. */
  botDurdurulan: number;
  /** Politikanın challenge ettiği (sürtünme yaşatan) insan sayısı. */
  insanSurtunen: number;
  /** Bot yakalama oranı 0..1 = durdurulan bot / toplam bot. */
  botYakalama: number;
  /** İnsan sürtünmesi 0..1 = challenge edilen insan / toplam insan (yanlış-sürtünme). */
  insanSurtunmesi: number;
  /** Net skor 0..100: bot yakalamayı ödüllendirir, insan sürtünmesini cezalandırır. */
  netSkor: number;
  /** Tahmini dönüşüm kaybı (%): sürtünmeden ötürü ayrılan meşru kullanıcı payı. */
  tahminiDonusumKaybi: number;
  /** Kaç isteğe (bot+insan) toplam dokunuldu (challenge+engelleme). */
  dokunulan: number;
}

/** Net skor ağırlıkları. Bot yakalama pozitif, sürtünme ağır cezalı. */
const AGIRLIK_YAKALAMA = 100;
const CEZA_SURTUNME = 140; // sürtünme yakalamadan daha pahalıya mal edilir (dönüşüm kaybı)

/**
 * Sürtünmeden dönüşüm kaybı tahmini. Her challenge edilen meşru kullanıcının bir
 * kısmı (deterministik katsayı) vazgeçer; agresif politikada bırakma daha yüksek.
 */
function donusumKaybiTahmin(insanSurtunmesi: number, agresiflik: number): number {
  // Taban bırakma %35, agresiflik +%40'a kadar artırır.
  const birakmaOrani = 0.35 + agresiflik * 0.4;
  return insanSurtunmesi * birakmaOrani * 100;
}

/* ------------------------------------------------------------------ Değerlendirme */

/**
 * Her politikayı gözlemlenen olaylar üzerinden simüle eder ve sonuç metriklerini
 * döndürür. Saf: aynı `events` → aynı çıktı.
 */
export function politikalariDegerlendir(events: BotEvent[]): PolitikaSonuc[] {
  const botToplam = events.filter((e) => !insanMi(e)).length;
  const insanToplam = events.filter((e) => insanMi(e)).length;

  return POLITIKALAR.map((p) => {
    let botDurdurulan = 0;
    let insanSurtunen = 0;
    let dokunulan = 0;

    for (const e of events) {
      const karar = politikaKarar(p, e);
      if (karar === "gecir") continue;
      dokunulan++;
      if (insanMi(e)) {
        // İnsan/iyi-bot bir challenge/engelleme aldı → sürtünme (yanlış pozitif).
        insanSurtunen++;
      } else {
        // Bot durduruldu (challenge veya engelleme her ikisi de botu yavaşlatır).
        botDurdurulan++;
      }
    }

    const botYakalama = botToplam ? botDurdurulan / botToplam : 0;
    const insanSurtunmesi = insanToplam ? insanSurtunen / insanToplam : 0;

    // Net skor: yakalamayı ödüllendir, sürtünmeyi ağır cezalandır. 0..100 klemp.
    const ham = botYakalama * AGIRLIK_YAKALAMA - insanSurtunmesi * CEZA_SURTUNME;
    const netSkor = Math.max(0, Math.min(100, ham));

    return {
      politika: p,
      botToplam,
      insanToplam,
      botDurdurulan,
      insanSurtunen,
      botYakalama,
      insanSurtunmesi,
      netSkor,
      tahminiDonusumKaybi: donusumKaybiTahmin(insanSurtunmesi, p.agresiflik),
      dokunulan,
    };
  });
}

/* ------------------------------------------------------------------ Kazanan seçimi */

export interface KazananSonuc {
  /** Kazanan politika sonucu (net skora göre en iyi). */
  kazanan: PolitikaSonuc;
  /** İkinci sıradaki (runner-up) — karşılaştırma için. */
  ikinci: PolitikaSonuc | null;
  /** Kazananın ikinciyi net-skorda geçtiğine dair güven % (0..100). */
  guven: number;
  /** Net skor farkı (kazanan − ikinci), puan. */
  fark: number;
  /** İstatistiksel olarak anlamlı mı (p<0.05). */
  anlamli: boolean;
  /** İnsan-okur gerekçe. */
  gerekce: string;
  /** Kazananın bot-yakalama Wilson güven aralığı. */
  yakalamaCi: WilsonAralik;
  /** z-testi tam analizi (kazanan vs ikinci, "başarı" = bot durdurma). */
  analiz: DeneyAnaliz;
}

/**
 * İstatistiksel kazananı seçer. Politikaları net skora göre sıralar; en iyi ile
 * ikinci arasında bot-durdurma oranı üzerinden iki-oran z-testi çalıştırır
 * (deney-istatistik.ts, READ-ONLY). Güven = (1 − p) × 100.
 *
 * NOT: Net skor "objektif" karardır (yakalama × sürtünme dengesi). İstatistiksel
 * test ise kazananın üstünlüğünün ŞANS ESERİ olmadığını doğrular — iki kavram
 * ayrıdır ve panelde ayrı sunulur.
 */
export function kazananSec(sonuclar: PolitikaSonuc[]): KazananSonuc | null {
  if (sonuclar.length === 0) return null;

  const sirali = [...sonuclar].sort((a, b) => b.netSkor - a.netSkor);
  const kazanan = sirali[0];
  const ikinci = sirali[1] ?? null;

  // Kazananın bot-yakalama Wilson aralığı (küçük örnekte bile sağlam).
  const yakalamaCi = wilsonAralik(kazanan.botDurdurulan, kazanan.botToplam);

  if (!ikinci) {
    return {
      kazanan,
      ikinci: null,
      guven: 0,
      fark: 0,
      anlamli: false,
      gerekce: "Karşılaştırılacak ikinci politika yok.",
      yakalamaCi,
      analiz: deneyAnaliz({ n: 0, basari: 0 }, { n: 0, basari: 0 }),
    };
  }

  // İki-oran z-testi: "başarı" = botu durdurma. n = toplam bot (her iki politika
  // aynı olay kümesini gördüğü için botToplam eşittir). Kontrol=ikinci, varyant=kazanan.
  const analiz = deneyAnaliz(
    { n: ikinci.botToplam, basari: ikinci.botDurdurulan },
    { n: kazanan.botToplam, basari: kazanan.botDurdurulan },
  );

  const guven = analiz.guvenYuzde;
  const fark = kazanan.netSkor - ikinci.netSkor;
  const anlamli = analiz.anlamli;

  let gerekce: string;
  if (anlamli) {
    gerekce =
      `"${kazanan.politika.ad}" politikası net skorda ${fark.toFixed(1)} puan önde ve bot-durdurma ` +
      `üstünlüğü %${guven.toFixed(0)} güvenle istatistiksel olarak anlamlı (p<0.05). Uygulanabilir.`;
  } else {
    gerekce =
      `"${kazanan.politika.ad}" net skorda önde (${fark.toFixed(1)} puan) ancak fark %${guven.toFixed(0)} ` +
      `güvenle henüz istatistiksel olarak kesin değil — daha fazla trafik toplandığında karar netleşir.`;
  }

  return { kazanan, ikinci, guven, fark, anlamli, gerekce, yakalamaCi, analiz };
}

/* ------------------------------------------------------------------ Öneri üretimi */

export interface Oneri {
  /** Uygulanması önerilen politika. */
  politika: Politika;
  /** Önerilen bot eşiği (site zorluk ayarına taşınabilir). */
  onerilenEsik: number;
  /** Somut öneri metni (lib-TR; istemci genelde YAPISAL alanlardan yeniden kurar). */
  metin: string;
  /** Karar güvenli mi (istatistiksel anlamlı ise true). */
  guvenli: boolean;
  /**
   * Öneri metnini istemcide DİLE GÖRE yeniden kurmak için yapısal alanlar
   * (enum güvenliği: cümle lib'de çevrilmez, veri buradan gelir).
   */
  yapisal: {
    /** Kazananın bot yakalama yüzdesi (tam sayı string, ör. "88"). */
    yakalamaYuzde: string;
    /** İnsan sürtünmesi yüzdesi (bir ondalık, ör. "2.4"). */
    surtunmeYuzde: string;
    /** Bot-yakalama %95 Wilson alt sınırı (tam sayı string). */
    ciAlt: string;
    /** Bot-yakalama %95 Wilson üst sınırı (tam sayı string). */
    ciUst: string;
    /** Güven yüzdesi (tam sayı string). */
    guven: string;
  };
}

/**
 * Kazanandan somut, uygulanabilir bir öneri üretir. Anlamlıysa doğrudan uygula
 * der; değilse veri toplamaya devam öner.
 */
export function oneriUret(kazananSonuc: KazananSonuc | null): Oneri | null {
  if (!kazananSonuc) return null;
  const { kazanan, anlamli, guven, yakalamaCi } = kazananSonuc;
  const p = kazanan.politika;

  const yakalamaYuzde = (kazanan.botYakalama * 100).toFixed(0);
  const surtunmeYuzde = (kazanan.insanSurtunmesi * 100).toFixed(1);
  const ciAlt = (yakalamaCi.alt * 100).toFixed(0);
  const ciUst = (yakalamaCi.ust * 100).toFixed(0);

  const metin = anlamli
    ? `Önerilen politika: "${p.ad}" (bot eşiği ${p.botEsik.toFixed(2)}). Gözlemlenen trafikte ` +
      `%${yakalamaYuzde} bot yakalar (%95 GA: %${ciAlt}–%${ciUst}) ve yalnızca %${surtunmeYuzde} insan sürtünmesi ` +
      `yaratır. Bu politikayı zorluk ayarında uygula: en iyi güvenlik/sürtünme dengesi.`
    : `Şimdilik "${p.ad}" politikası öne çıkıyor (%${yakalamaYuzde} bot yakalama, %${surtunmeYuzde} sürtünme) ` +
      `ancak üstünlük %${guven.toFixed(0)} güvenle henüz kesin değil. Karar vermeden önce daha fazla trafik topla; ` +
      `bu arada mevcut ayarı koru.`;

  return {
    politika: p,
    onerilenEsik: p.botEsik,
    metin,
    guvenli: anlamli,
    yapisal: {
      yakalamaYuzde,
      surtunmeYuzde,
      ciAlt,
      ciUst,
      guven: guven.toFixed(0),
    },
  };
}
