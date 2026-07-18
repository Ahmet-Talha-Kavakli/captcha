/**
 * Specter — Webhook Teslimat İzleme (saf hesap katmanı)
 * =====================================================
 * Bu dosya SAF ve DETERMİNİSTİKtir: içinde Date.now(), Math.random() veya
 * argümansız `new Date()` YOKTUR. Tüm "şimdi" değerleri dışarıdan (server
 * sayfası) parametre olarak gelir. Böylece aynı girdi her zaman aynı çıktıyı
 * üretir ve test edilebilir.
 *
 * Sağladıkları:
 *   - Bir teslimat sonucunu sınıflandırma (2xx başarılı, 4xx kalıcı-hata,
 *     5xx/0 geçici-hata → yeniden dene).
 *   - Uç nokta (endpoint) başına istatistik: başarı oranı, ort/p95 gecikme,
 *     yeniden-deneme sayısı, son durum, sağlık sınıfı.
 *   - DLQ (ölü-mektup) tespiti: tüm denemeleri tükettiği halde 2xx alamamış
 *     teslimatlar.
 *   - Üstel geri-çekilme (backoff) programı modeli: 1sn, 5sn, 30sn, 2dk, 10dk.
 */

import type { WebhookDelivery } from "@/lib/db/schema";

/* ------------------------------------------------------------------ Sınıflandırma */

/** Bir teslimat denemesinin sonuç sınıfı. */
export type TeslimatSinif = "basarili" | "kalici-hata" | "gecici-hata";

/**
 * HTTP durum kodunu sonuç sınıfına çevirir:
 *   - 2xx           → başarılı
 *   - 4xx           → kalıcı hata (yeniden deneme faydasız; istek biçimi/yetki)
 *   - 5xx veya 0    → geçici hata (sunucu/ağ; yeniden denenebilir)
 * Not: 0 = bağlantı hatası (timeout / erişilemez).
 */
export function teslimatSinifla(status: number): TeslimatSinif {
  if (status >= 200 && status < 300) return "basarili";
  if (status >= 400 && status < 500) return "kalici-hata";
  // 5xx, 0 ve diğer tüm beklenmedik kodlar geçici sayılır (yeniden denenir).
  return "gecici-hata";
}

/** Sınıfın renk-tonu (UI pill'i için — kit Badge ton adlarıyla uyumlu). */
export function sinifTon(sinif: TeslimatSinif): "yesil" | "sari" | "kirmizi" {
  if (sinif === "basarili") return "yesil";
  if (sinif === "kalici-hata") return "sari";
  return "kirmizi";
}

/* ------------------------------------------------------------------ Backoff programı */

/**
 * Üstel geri-çekilme programı. Her başarısız denemeden sonra bir sonraki
 * denemeye kadar beklenen süre (ms). i. deneme başarısızsa (i-1). indeksteki
 * gecikme kadar beklenir. Toplam en fazla `RETRY_BACKOFF.length + 1` deneme.
 *   1sn → 5sn → 30sn → 2dk → 10dk
 */
export const RETRY_BACKOFF_MS: number[] = [
  1_000, // 1 sn
  5_000, // 5 sn
  30_000, // 30 sn
  120_000, // 2 dk
  600_000, // 10 dk
];

/** Azami deneme sayısı (ilk deneme + geri-çekilmeli yeniden denemeler). */
export const MAKS_DENEME = RETRY_BACKOFF_MS.length + 1;

/** İnsan-okur backoff etiketi (ör. 1000 → "1sn", 120000 → "2dk"). */
export function backoffEtiket(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)}sn`;
  return `${Math.round(ms / 60_000)}dk`;
}

/** Backoff programını adım-adım döndürür (görselleştirme için). */
export interface BackoffAdim {
  /** Kaçıncı deneme bu adımdan SONRA yapılır (2 = ilk yeniden deneme). */
  deneme: number;
  /** Bu adımdaki bekleme süresi (ms). */
  gecikmeMs: number;
  /** İnsan-okur etiket. */
  etiket: string;
}
export function backoffProgrami(): BackoffAdim[] {
  return RETRY_BACKOFF_MS.map((ms, i) => ({
    deneme: i + 2, // 1. deneme anındadır; ilk backoff 2. denemeden önce.
    gecikmeMs: ms,
    etiket: backoffEtiket(ms),
  }));
}

/* ------------------------------------------------------------------ Uç nokta istatistiği */

/** Bir uç noktanın sağlık sınıfı. */
export type UcNoktaSaglik = "saglikli" | "bozuk" | "dlq";

export interface UcNoktaIstatistik {
  /** Toplam teslimat denemesi (tüm attempt'ler dahil). */
  toplamDeneme: number;
  /** 2xx dönen deneme sayısı. */
  basariliDeneme: number;
  /** Başarı oranı yüzdesi (0..100, tam sayıya yuvarlanır). Deneme yoksa 0. */
  basariOrani: number;
  /** Ortalama gecikme (ms, tam sayı). Deneme yoksa 0. */
  ortGecikme: number;
  /** p95 gecikme (ms, tam sayı) — en yavaş %5'in eşiği. */
  p95Gecikme: number;
  /** Yeniden-deneme sayısı (attempt > 1 olan denemeler). */
  yenidenDeneme: number;
  /** En son (en yeni ts) denemenin durum kodu — hiç yoksa null. */
  sonDurum: number | null;
  /** En son denemenin ts'i — hiç yoksa null. */
  sonTs: number | null;
  /** Sağlık sınıfı. */
  saglik: UcNoktaSaglik;
}

/**
 * Bir teslimat listesinden p-yüzdelik gecikme hesaplar (nearest-rank).
 * Boş listede 0 döner. `p` 0..100 arası.
 */
export function yuzdelikGecikme(deliveries: WebhookDelivery[], p: number): number {
  const sureler = deliveries.map((d) => d.durationMs).sort((a, b) => a - b);
  if (sureler.length === 0) return 0;
  // Nearest-rank: rank = ceil(p/100 * N), 1-tabanlı.
  const rank = Math.ceil((p / 100) * sureler.length);
  const idx = Math.min(sureler.length - 1, Math.max(0, rank - 1));
  return Math.round(sureler[idx]);
}

/**
 * Bir uç noktanın (webhook'un) teslimat geçmişinden istatistik türetir.
 * Sağlık kuralı:
 *   - DLQ varsa (aşağıdaki dlqTespit) → "dlq"
 *   - başarı oranı < %90 VEYA son durum 2xx değilse → "bozuk"
 *   - aksi halde → "saglikli"
 */
export function ucNoktaIstatistik(deliveries: WebhookDelivery[]): UcNoktaIstatistik {
  const toplamDeneme = deliveries.length;
  const basariliDeneme = deliveries.filter((d) => teslimatSinifla(d.status) === "basarili").length;
  const basariOrani = toplamDeneme === 0 ? 0 : Math.round((basariliDeneme / toplamDeneme) * 100);
  const ortGecikme =
    toplamDeneme === 0 ? 0 : Math.round(deliveries.reduce((a, d) => a + d.durationMs, 0) / toplamDeneme);
  const p95Gecikme = yuzdelikGecikme(deliveries, 95);
  const yenidenDeneme = deliveries.filter((d) => d.attempt > 1).length;

  // En son deneme (en yüksek ts). Girdi sırasına güvenmeyip ts'e göre seç.
  let son: WebhookDelivery | null = null;
  for (const d of deliveries) if (!son || d.ts > son.ts) son = d;

  const dlq = dlqTespit(deliveries);
  const sonBasarili = son ? teslimatSinifla(son.status) === "basarili" : false;
  const saglik: UcNoktaSaglik = dlq.length > 0 ? "dlq" : !sonBasarili || basariOrani < 90 ? "bozuk" : "saglikli";

  return {
    toplamDeneme,
    basariliDeneme,
    basariOrani,
    ortGecikme,
    p95Gecikme,
    yenidenDeneme,
    sonDurum: son ? son.status : null,
    sonTs: son ? son.ts : null,
    saglik,
  };
}

/* ------------------------------------------------------------------ DLQ tespiti */

/**
 * Ölü-mektup (dead-letter) tespiti. Bir teslimat, aynı olay için tüm
 * denemeleri (MAKS_DENEME) tükettiği HALDE 2xx alamamışsa DLQ'ya düşer.
 *
 * Girdi tek bir webhook'un teslimatlarıdır. Aynı olayın ardışık denemeleri
 * attempt alanıyla ayrışır (1 = ilk deneme). Bir "deneme zinciri":
 *   attempt=1 ile başlar, sonraki kayıtlar attempt=2,3,... ile aynı zincire
 *   aittir. Zincir başarısız kapanır (son deneme 2xx değil) VE en yüksek
 *   attempt MAKS_DENEME'ye ulaşmışsa → o zincirin son kaydı DLQ öğesidir.
 *
 * Not: Basit ve deterministik olması için zincirleri ts sırasına dizip
 * attempt=1'de yeni zincir başlatırız. Bu, gerçek teslimat motorunun
 * (webhook-delivery.ts) ürettiği ardışık attempt desenine uyar.
 */
export interface DlqOge {
  /** Zincirin son (nihai başarısız) teslimat kaydı. */
  sonKayit: WebhookDelivery;
  /** Zincirdeki tüm denemeler (attempt artan). */
  zincir: WebhookDelivery[];
  /** Ulaşılan en yüksek deneme sayısı. */
  denemeSayisi: number;
}

export function dlqTespit(deliveries: WebhookDelivery[]): DlqOge[] {
  // ts'e göre kararlı sırala (eşitse attempt'e göre).
  const sirali = [...deliveries].sort((a, b) => a.ts - b.ts || a.attempt - b.attempt);

  const zincirler: WebhookDelivery[][] = [];
  let mevcut: WebhookDelivery[] = [];
  for (const d of sirali) {
    // attempt=1 yeni bir teslimat zinciri başlatır.
    if (d.attempt <= 1 && mevcut.length > 0) {
      zincirler.push(mevcut);
      mevcut = [];
    }
    mevcut.push(d);
  }
  if (mevcut.length > 0) zincirler.push(mevcut);

  const dlq: DlqOge[] = [];
  for (const z of zincirler) {
    const sonKayit = z[z.length - 1];
    const denemeSayisi = z.reduce((m, d) => Math.max(m, d.attempt), 0);
    const basariliOldu = z.some((d) => teslimatSinifla(d.status) === "basarili");
    // Tüm denemeler bitti (MAKS_DENEME'ye ulaştı) VE hiç 2xx alınamadı.
    if (!basariliOldu && denemeSayisi >= MAKS_DENEME) {
      dlq.push({ sonKayit, zincir: z, denemeSayisi });
    }
  }
  return dlq;
}

/* ------------------------------------------------------------------ Özet (tüm uç noktalar) */

export interface TeslimatOzet {
  /** Tüm uç noktalardaki toplam teslimat denemesi. */
  toplamTeslimat: number;
  /** Toplam başarılı (2xx) deneme. */
  basariliTeslimat: number;
  /** Genel başarı oranı yüzdesi (0..100). */
  basariOrani: number;
  /** Tüm denemeler üzerinden ortalama gecikme (ms). */
  ortGecikme: number;
  /** DLQ'daki (ölü-mektup) toplam öğe sayısı. */
  dlqSayisi: number;
  /** Toplam yeniden-deneme sayısı (attempt > 1). */
  yenidenDeneme: number;
}

/** Birden çok uç noktanın teslimatlarını tek özete indirger. */
export function teslimatOzeti(tumTeslimatlar: WebhookDelivery[]): TeslimatOzet {
  const toplam = tumTeslimatlar.length;
  const basarili = tumTeslimatlar.filter((d) => teslimatSinifla(d.status) === "basarili").length;
  const ort = toplam === 0 ? 0 : Math.round(tumTeslimatlar.reduce((a, d) => a + d.durationMs, 0) / toplam);
  const yeniden = tumTeslimatlar.filter((d) => d.attempt > 1).length;
  const dlq = dlqTespit(tumTeslimatlar).length;
  return {
    toplamTeslimat: toplam,
    basariliTeslimat: basarili,
    basariOrani: toplam === 0 ? 0 : Math.round((basarili / toplam) * 100),
    ortGecikme: ort,
    dlqSayisi: dlq,
    yenidenDeneme: yeniden,
  };
}

/* ------------------------------------------------------------------ Başarı trendi (kova) */

/**
 * Teslimatları zaman kovalarına bölüp her kova için başarı oranı (%) üretir.
 * TrendGrafik için deterministik seri. `simdiMs` ve `kovaSayisi`/`kovaMs`
 * dışarıdan gelir (saf kalması için). Kova yoksa 0 döner (çizim boş-korumalı).
 *
 * Dönen `oranlar` en eskiden en yeniye sıralıdır; `etiketler` aynı sırada.
 */
export interface BasariTrend {
  oranlar: number[];
  etiketler: string[];
}
export function basariTrendi(
  tumTeslimatlar: WebhookDelivery[],
  simdiMs: number,
  kovaSayisi: number,
  kovaMs: number,
): BasariTrend {
  const oranlar: number[] = [];
  const etiketler: string[] = [];
  for (let i = kovaSayisi - 1; i >= 0; i--) {
    const kovaSon = simdiMs - i * kovaMs;
    const kovaBas = kovaSon - kovaMs;
    const kovadakiler = tumTeslimatlar.filter((d) => d.ts > kovaBas && d.ts <= kovaSon);
    const basarili = kovadakiler.filter((d) => teslimatSinifla(d.status) === "basarili").length;
    // Kova boşsa bir önceki oranı taşı (grafik kopmasın); ilk kova boşsa 100.
    const oran =
      kovadakiler.length === 0
        ? oranlar.length > 0
          ? oranlar[oranlar.length - 1]
          : 100
        : Math.round((basarili / kovadakiler.length) * 100);
    oranlar.push(oran);
    etiketler.push(`${kovaSayisi - i}`);
  }
  return { oranlar, etiketler };
}
