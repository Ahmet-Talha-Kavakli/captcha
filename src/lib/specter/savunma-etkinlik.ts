/**
 * Specter — Savunma Etkinlik & Kural Performansı Motoru
 * ====================================================
 *
 * Bu saf/deterministik motor, koruma katmanının GERÇEKTEN ne kadar işe
 * yaradığını ölçer. "Kaç bot engelledik" gibi süslü ama boş vaatler yerine,
 * elimizdeki GERÇEK olay akışından (`BotEvent[]`) doğrudan türetilmiş sinyaller
 * üretir:
 *
 *   1) Kural Performansı — hangi kural kaç kez tetikleniyor, tetiklendiğinde
 *      gerçekten engelleme/meydan-okuma ile mi sonuçlanıyor (etkinlik oranı).
 *      Çok tetiklenip hiç engellemeyen bir kural gürültüdür; bu motor onu
 *      ortaya çıkarır.
 *   2) Katman Kapsaması — olayların yüzde kaçında en az bir kural devreye
 *      girdi. Düşük kapsama = savunmada kör noktalar.
 *   3) Yakalama Hunisi — toplam trafik → bot tespiti → meydan okuma → engelleme.
 *      Her aşamada ne kadar daraldığımızı gösterir.
 *   4) False-Pozitif Riski — insan/iyi-bot trafiğini yanlışlıkla engelleme/
 *      challenge etme oranı. Yüksekse meşru kullanıcıyı yakıyoruz demektir.
 *   5) Ortalama Yanıt — savunma katmanının gecikme maliyeti (ms) + son 24 saat
 *      ile önceki 24 saat trend karşılaştırması.
 *   6) Özet — tek bakışta sağlık: kapsama, toplam engelleme, FP risk durumu.
 *
 * NEDEN GERÇEK VERİ: Tüm metrikler `events` dizisindeki alanlardan (triggeredRules,
 * verdict, botClass, latency, ts) hesaplanır. Rastgele üretim, tahmin ya da
 * uydurma sabit YOKTUR. Zaman kıyasları `Date.now()` yerine dışarıdan gelen
 * `simdi` parametresini ve olayların `ts` alanını kullanır → motor tamamen
 * deterministik ve test edilebilir.
 *
 * Saf fonksiyon: aynı girdi → aynı çıktı. Yan etki yok. Dış bağımlılık yok.
 */

import type { BotEvent, BotClass, Verdict } from "@/lib/db/schema";

/* ------------------------------------------------------------------ Sabitler */

/** 24 saat (ms) — trend pivotu için. */
const YIRMI_DORT_SAAT = 86_400_000;

/** Bot sayılan sınıflar (insan/iyi-bot dışındaki her şey). */
const BOT_SINIFLARI: ReadonlySet<BotClass> = new Set<BotClass>([
  "automation",
  "scraper",
  "credential_stuffing",
  "ai_agent",
  "ddos",
  "spam",
]);

/** Meşru/insan sayılan sınıflar (false-pozitif riski bunlar için ölçülür). */
const INSAN_SINIFLARI: ReadonlySet<BotClass> = new Set<BotClass>(["human", "good_bot"]);

/** "Bastırıldı" sayılan kararlar (challenge veya block). */
const BASTIRAN_KARARLAR: ReadonlySet<Verdict> = new Set<Verdict>(["challenged", "blocked"]);

/** Kural performans tablosunda gösterilecek azami satır. */
const KURAL_LIMIT = 10;

/* ------------------------------------------------------------------ Tipler */

/** Tek bir kuralın performans satırı. */
export interface KuralPerformansSatiri {
  /** Kural kimliği (triggeredRules dizisindeki ham değer). */
  ruleId: string;
  /** Bu kuralın kaç olayda tetiklendiği. */
  tetiklenme: number;
  /** Tetiklendiği VE kararın blocked/challenged olduğu olay sayısı. */
  engelleme: number;
  /** Etkinlik oranı = engelleme / tetiklenme (0..1). Tetiklenme 0 ise 0. */
  etkinlik: number;
}

/** Katman kapsaması: kaç olayda en az bir kural devreye girdi. */
export interface KatmanKapsama {
  /** En az bir kural tetikleyen olay sayısı. */
  kurallıOlay: number;
  /** Toplam olay sayısı. */
  toplamOlay: number;
  /** Kapsama yüzdesi (0..100). */
  yuzde: number;
}

/** Yakalama hunisinin tek bir aşaması. */
export interface HuniAsama {
  /** Aşama etiketi (insan-okur). */
  etiket: string;
  /** Bu aşamadaki olay sayısı. */
  sayi: number;
  /** Toplam trafiğe oranı (0..1). */
  oran: number;
}

/** Yakalama hunisi: trafik → bot tespiti → meydan okuma → engelleme. */
export interface YakalamaHunisi {
  toplamTrafik: number;
  botTespit: number;
  meydanOkuma: number;
  engelleme: number;
  /** Sıralı huni aşamaları (grafik için hazır). */
  asamalar: HuniAsama[];
}

/** False-pozitif riski: meşru trafiği yanlış bastırma. */
export interface FalsePozitifRisk {
  /** İnsan/iyi-bot olup blocked/challenged olan olay sayısı. */
  sayi: number;
  /** Bu olayların TÜM insan trafiğine oranı (0..1). */
  oran: number;
  /** Değerlendirmeye alınan toplam insan/iyi-bot olay sayısı (payda). */
  insanToplam: number;
}

/** Ortalama yanıt süresi + trend. */
export interface OrtalamaYanit {
  /** Tüm olayların ortalama latency'si (ms). */
  ortalamaMs: number;
  /** Son 24 saatteki ortalama latency (ms). */
  son24Ms: number;
  /** Önceki 24 saatteki (simdi-48s .. simdi-24s) ortalama latency (ms). */
  onceki24Ms: number;
  /** Trend: son24 - onceki24 (ms). Pozitif = yavaşlıyor. */
  trendMs: number;
  /** Trend yönü. */
  yon: "artis" | "dusus" | "sabit";
}

/** FP risk durumu eşiklerinin sınıflandırması. */
export type FpRiskDurumu = "dusuk" | "orta" | "yuksek";

/** Tek bakış özeti. */
export interface SavunmaOzet {
  /** Katman kapsama yüzdesi (0..100). */
  kapsama: number;
  /** Toplam engellenen (blocked) olay sayısı. */
  engellenenToplam: number;
  /** FP risk durumu (oran<0.02 dusuk, <0.05 orta, üzeri yuksek). */
  fpRiskDurumu: FpRiskDurumu;
}

/** Motorun tam çıktısı. */
export interface SavunmaEtkinlik {
  kuralPerformans: KuralPerformansSatiri[];
  katmanKapsama: KatmanKapsama;
  yakalamaHunisi: YakalamaHunisi;
  falsePozitifRisk: FalsePozitifRisk;
  ortalamaYanit: OrtalamaYanit;
  ozet: SavunmaOzet;
}

/* ------------------------------------------------------------------ Yardımcılar */

/** Güvenli oran: payda 0 ise 0 döndür. */
function oran(pay: number, payda: number): number {
  return payda > 0 ? pay / payda : 0;
}

/** FP oranını durum etiketine çevir. */
function fpDurum(oranDeger: number): FpRiskDurumu {
  if (oranDeger < 0.02) return "dusuk";
  if (oranDeger < 0.05) return "orta";
  return "yuksek";
}

/** Boş girdi için çökmeyen güvenli varsayılan. */
function bosSonuc(): SavunmaEtkinlik {
  return {
    kuralPerformans: [],
    katmanKapsama: { kurallıOlay: 0, toplamOlay: 0, yuzde: 0 },
    yakalamaHunisi: {
      toplamTrafik: 0,
      botTespit: 0,
      meydanOkuma: 0,
      engelleme: 0,
      asamalar: [
        { etiket: "Toplam Trafik", sayi: 0, oran: 0 },
        { etiket: "Bot Tespiti", sayi: 0, oran: 0 },
        { etiket: "Meydan Okuma", sayi: 0, oran: 0 },
        { etiket: "Engelleme", sayi: 0, oran: 0 },
      ],
    },
    falsePozitifRisk: { sayi: 0, oran: 0, insanToplam: 0 },
    ortalamaYanit: { ortalamaMs: 0, son24Ms: 0, onceki24Ms: 0, trendMs: 0, yon: "sabit" },
    ozet: { kapsama: 0, engellenenToplam: 0, fpRiskDurumu: "dusuk" },
  };
}

/* ------------------------------------------------------------------ Ana motor */

/**
 * Gerçek olay akışından savunma etkinliği ve kural performansı çıkarır.
 *
 * @param events Ham bot olayları (canlı akışın kaynağı).
 * @param simdi  Referans "şu an" (epoch ms) — trend pivotu. Date.now() KULLANILMAZ.
 * @returns Kapsama, huni, kural performansı, FP riski, yanıt trendi ve özet.
 */
export function savunmaEtkinlik(events: BotEvent[], simdi: number): SavunmaEtkinlik {
  if (!Array.isArray(events) || events.length === 0) {
    return bosSonuc();
  }

  const toplam = events.length;

  /* --- Kural performansı: kural-id → {tetiklenme, engelleme} --- */
  const kuralMap = new Map<string, { tetiklenme: number; engelleme: number }>();

  /* --- Sayaçlar (tek geçişte) --- */
  let kurallıOlay = 0; // en az bir kural tetikleyen olay
  let botTespit = 0; // bot sınıflı olay
  let meydanOkuma = 0; // challenged
  let engelleme = 0; // blocked
  let bastiran = 0; // challenged VEYA blocked (huni "bastırılan" toplamı)

  let insanToplam = 0; // human/good_bot olay
  let fpSayi = 0; // human/good_bot olup blocked/challenged

  let latencyToplam = 0;
  let son24Toplam = 0;
  let son24Adet = 0;
  let onceki24Toplam = 0;
  let onceki24Adet = 0;

  const son24Pivot = simdi - YIRMI_DORT_SAAT;
  const onceki24Pivot = simdi - 2 * YIRMI_DORT_SAAT;

  for (const ev of events) {
    const kurallar = Array.isArray(ev.triggeredRules) ? ev.triggeredRules : [];
    const bastirildi = BASTIRAN_KARARLAR.has(ev.verdict);

    if (kurallar.length > 0) {
      kurallıOlay += 1;
      for (const rid of kurallar) {
        let satir = kuralMap.get(rid);
        if (!satir) {
          satir = { tetiklenme: 0, engelleme: 0 };
          kuralMap.set(rid, satir);
        }
        satir.tetiklenme += 1;
        if (bastirildi) satir.engelleme += 1;
      }
    }

    if (BOT_SINIFLARI.has(ev.botClass)) botTespit += 1;
    if (ev.verdict === "challenged") meydanOkuma += 1;
    if (ev.verdict === "blocked") engelleme += 1;
    if (bastirildi) bastiran += 1;

    if (INSAN_SINIFLARI.has(ev.botClass)) {
      insanToplam += 1;
      if (bastirildi) fpSayi += 1;
    }

    const lat = typeof ev.latency === "number" && Number.isFinite(ev.latency) ? ev.latency : 0;
    latencyToplam += lat;

    if (ev.ts >= son24Pivot) {
      son24Toplam += lat;
      son24Adet += 1;
    } else if (ev.ts >= onceki24Pivot) {
      onceki24Toplam += lat;
      onceki24Adet += 1;
    }
  }

  /* --- Kural performans tablosu: tetiklenmeye göre azalan, top 10 --- */
  const kuralPerformans: KuralPerformansSatiri[] = Array.from(kuralMap.entries())
    .map(([ruleId, v]) => ({
      ruleId,
      tetiklenme: v.tetiklenme,
      engelleme: v.engelleme,
      etkinlik: oran(v.engelleme, v.tetiklenme),
    }))
    .sort((a, b) => b.tetiklenme - a.tetiklenme || b.engelleme - a.engelleme)
    .slice(0, KURAL_LIMIT);

  /* --- Katman kapsaması --- */
  const kapsamaYuzde = oran(kurallıOlay, toplam) * 100;
  const katmanKapsama: KatmanKapsama = {
    kurallıOlay,
    toplamOlay: toplam,
    yuzde: kapsamaYuzde,
  };

  /* --- Yakalama hunisi --- */
  const yakalamaHunisi: YakalamaHunisi = {
    toplamTrafik: toplam,
    botTespit,
    meydanOkuma,
    engelleme,
    asamalar: [
      { etiket: "Toplam Trafik", sayi: toplam, oran: 1 },
      { etiket: "Bot Tespiti", sayi: botTespit, oran: oran(botTespit, toplam) },
      { etiket: "Meydan Okuma", sayi: meydanOkuma, oran: oran(meydanOkuma, toplam) },
      { etiket: "Engelleme", sayi: engelleme, oran: oran(engelleme, toplam) },
    ],
  };
  // `bastiran` toplamı huni yorumunu zenginleştirmek için sayaç olarak tutulur
  // (challenged+blocked birleşik bastırma); dışa dökülmez ama hesap tutarlıdır.
  void bastiran;

  /* --- False-pozitif riski --- */
  const fpOran = oran(fpSayi, insanToplam);
  const falsePozitifRisk: FalsePozitifRisk = {
    sayi: fpSayi,
    oran: fpOran,
    insanToplam,
  };

  /* --- Ortalama yanıt + trend --- */
  const ortalamaMs = oran(latencyToplam, toplam);
  const son24Ms = oran(son24Toplam, son24Adet);
  const onceki24Ms = oran(onceki24Toplam, onceki24Adet);
  const trendMs = son24Ms - onceki24Ms;
  const yon: OrtalamaYanit["yon"] = trendMs > 0.5 ? "artis" : trendMs < -0.5 ? "dusus" : "sabit";
  const ortalamaYanit: OrtalamaYanit = {
    ortalamaMs,
    son24Ms,
    onceki24Ms,
    trendMs,
    yon,
  };

  /* --- Özet --- */
  const ozet: SavunmaOzet = {
    kapsama: kapsamaYuzde,
    engellenenToplam: engelleme,
    fpRiskDurumu: fpDurum(fpOran),
  };

  return {
    kuralPerformans,
    katmanKapsama,
    yakalamaHunisi,
    falsePozitifRisk,
    ortalamaYanit,
    ozet,
  };
}
