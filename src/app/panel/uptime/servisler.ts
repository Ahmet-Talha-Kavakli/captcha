/**
 * Specter Uptime & Servis Sağlığı — sabit servis kataloğu + olay geçmişi
 * =====================================================================
 * Specter'ın kendi platform servislerinin (Challenge API, Verify API, Widget
 * CDN, Dashboard vb.) sağlık, gecikme, uptime ve incident geçmişini temsil
 * eden DETERMİNİSTİK katalog. Değerler sabittir (rastgele değil) — her sunucu
 * render'ında ve her worker'da aynı görüntü çıkar; DB'ye dokunmaz.
 *
 * Yalnızca /panel/uptime içinde kullanılır. BetterStack / Statuspage /
 * Datadog SLA seviyesinde bir izleme yüzeyi besler.
 */

/** Bir servisin sağlık durumu. */
export type ServisDurum = "operasyonel" | "dejenere" | "kesinti";

/** 90 günlük şeritteki bir günün durumu. */
export type GunDurum = "up" | "degraded" | "down";

export interface Servis {
  /** Kararlı kimlik (React key + seçim). */
  id: string;
  /** Servis adı (Türkçe/marka). */
  ad: string;
  /** Kısa açıklama — ne yaptığı. */
  aciklama: string;
  /** Kategori grubu (API / Dağıtım / Uygulama). */
  grup: "API" | "Dağıtım" | "Uygulama";
  /** Güncel sağlık durumu. */
  durum: ServisDurum;
  /** Güncel yanıt süresi (ms). */
  gecikme: number;
  /** p50 / p95 / p99 yanıt süresi (ms) — son 24 saat. */
  p50: number;
  p95: number;
  p99: number;
  /** 90 günlük gerçekleşen uptime (%). */
  uptime90: number;
  /** SLA taahhüdü (%) — bu servis için. */
  sla: number;
  /** Son sağlık kontrolünden bu yana geçen saniye. */
  sonKontrolSn: number;
  /** 90 günlük şerit tohumu (deterministik dağılım için). */
  tohum: number;
}

/** Durum → rozet tonu + etiket + nabız. kit.DurumRozeti ile uyumlu. */
export const DURUM_META: Record<
  ServisDurum,
  { ton: "ok" | "warn" | "danger"; etiket: string; nabiz: boolean }
> = {
  operasyonel: { ton: "ok", etiket: "Operasyonel", nabiz: true },
  dejenere: { ton: "warn", etiket: "Dejenere performans", nabiz: true },
  kesinti: { ton: "danger", etiket: "Kesinti", nabiz: true },
};

/** Gün durumu → şerit rengi (yeşil/sarı/kırmızı). */
export const GUN_RENK: Record<GunDurum, string> = {
  up: "#16a34a",
  degraded: "#d97706",
  down: "#dc2626",
};

/**
 * Specter platform servis kataloğu — 8 servis, 3 grup.
 * Değerler gerçekçi ama tamamen sabittir (deterministik).
 */
export const SERVISLER: Servis[] = [
  {
    id: "challenge-api",
    ad: "Challenge API",
    aciklama: "Ghost-font challenge üretimi ve temporal dithering",
    grup: "API",
    durum: "operasyonel",
    gecikme: 34,
    p50: 31,
    p95: 88,
    p99: 141,
    uptime90: 99.995,
    sla: 99.9,
    sonKontrolSn: 8,
    tohum: 1013,
  },
  {
    id: "verify-api",
    ad: "Verify API",
    aciklama: "Token doğrulama ve challenge çözüm kontrolü",
    grup: "API",
    durum: "operasyonel",
    gecikme: 27,
    p50: 24,
    p95: 71,
    p99: 118,
    uptime90: 99.998,
    sla: 99.9,
    sonKontrolSn: 5,
    tohum: 2027,
  },
  {
    id: "siteverify-api",
    ad: "Siteverify API",
    aciklama: "Sunucu-taraflı /siteverify uç doğrulaması",
    grup: "API",
    durum: "operasyonel",
    gecikme: 41,
    p50: 38,
    p95: 96,
    p99: 162,
    uptime90: 99.981,
    sla: 99.9,
    sonKontrolSn: 11,
    tohum: 3041,
  },
  {
    id: "passive-api",
    ad: "Passive API",
    aciklama: "Görünmez mod pasif sinyal & davranış toplama",
    grup: "API",
    durum: "dejenere",
    gecikme: 118,
    p50: 96,
    p95: 214,
    p99: 388,
    uptime90: 99.942,
    sla: 99.9,
    sonKontrolSn: 6,
    tohum: 4118,
  },
  {
    id: "widget-cdn",
    ad: "Widget CDN",
    aciklama: "specter.js widget dağıtımı (küresel edge)",
    grup: "Dağıtım",
    durum: "operasyonel",
    gecikme: 12,
    p50: 9,
    p95: 28,
    p99: 47,
    uptime90: 100.0,
    sla: 99.99,
    sonKontrolSn: 3,
    tohum: 5012,
  },
  {
    id: "dashboard",
    ad: "Dashboard",
    aciklama: "Yönetim paneli ve arayüz uygulaması",
    grup: "Uygulama",
    durum: "operasyonel",
    gecikme: 63,
    p50: 58,
    p95: 148,
    p99: 264,
    uptime90: 99.953,
    sla: 99.9,
    sonKontrolSn: 14,
    tohum: 6063,
  },
  {
    id: "webhook-teslimat",
    ad: "Webhook Teslimat",
    aciklama: "Olay bildirimlerinin dışa teslimi (retry kuyruğu)",
    grup: "Dağıtım",
    durum: "operasyonel",
    gecikme: 88,
    p50: 74,
    p95: 176,
    p99: 312,
    uptime90: 99.917,
    sla: 99.5,
    sonKontrolSn: 22,
    tohum: 7088,
  },
  {
    id: "edge-agi",
    ad: "Edge Ağı",
    aciklama: "Anycast edge katmanı (16 PoP, 6 bölge)",
    grup: "Dağıtım",
    durum: "operasyonel",
    gecikme: 9,
    p50: 8,
    p95: 24,
    p99: 44,
    uptime90: 99.98,
    sla: 99.99,
    sonKontrolSn: 4,
    tohum: 8009,
  },
];

/**
 * Bir servis için 90 günlük deterministik durum şeridi üretir.
 * Çoğunlukla "up"; belirli servislerde birkaç "degraded"/"down" penceresi.
 * Aynı tohum → her zaman aynı şerit (LCG, saf fonksiyon).
 */
export function uptimeSerit(tohum: number): GunDurum[] {
  let s = tohum >>> 0;
  const rnd = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  return Array.from({ length: 90 }, () => {
    const r = rnd();
    if (r > 0.992) return r > 0.998 ? "down" : "degraded";
    return "up";
  });
}

/** Bir servisin 90 günlük şeridinden gerçekleşen uptime %'sini hesaplar. */
export function seritUptime(serit: GunDurum[]): number {
  if (serit.length === 0) return 100;
  // up = 1.0, degraded = 0.5 (kısmi), down = 0.0 gün-ağırlığı.
  const toplam = serit.reduce(
    (a, d) => a + (d === "up" ? 1 : d === "degraded" ? 0.5 : 0),
    0,
  );
  return (toplam / serit.length) * 100;
}

/* ------------------------------------------------------------------ Olaylar */

export interface Olay {
  id: string;
  /** Etkilenen servis id (SERVISLER ile eşleşir). */
  servisId: string;
  servisAd: string;
  /** Kısa başlık. */
  baslik: string;
  /** Başlangıç (ISO tarih-saat). */
  baslangic: string;
  /** Süre (dakika). */
  sureDk: number;
  /** Etki seviyesi. */
  etki: "kismi" | "tam" | "bakim";
  /** Çözüm / durum. */
  durum: "cozuldu" | "izleniyor" | "arastiriliyor";
  /** Çözüm notu / özet. */
  not: string;
}

/**
 * Son 90 gün içindeki deterministik incident geçmişi (5 kayıt).
 * En yeniden en eskiye sıralı.
 */
export const OLAYLAR: Olay[] = [
  {
    id: "inc-2026-0712",
    servisId: "passive-api",
    servisAd: "Passive API",
    baslik: "Pasif sinyal işlemede artan gecikme",
    baslangic: "2026-07-12 14:08",
    sureDk: 47,
    etki: "kismi",
    durum: "izleniyor",
    not: "Davranış biyometrisi kuyruğunda birikme p95'i geçici olarak 2x artırdı. Kuyruk ölçeklendi; kök neden izleniyor.",
  },
  {
    id: "inc-2026-0703",
    servisId: "webhook-teslimat",
    servisAd: "Webhook Teslimat",
    baslik: "Webhook retry kuyruğu gecikmesi",
    baslangic: "2026-07-03 02:31",
    sureDk: 62,
    etki: "kismi",
    durum: "cozuldu",
    not: "Üçüncü-taraf uç noktalardaki timeout'lar retry kuyruğunu doldurdu. Circuit-breaker eşiği düşürüldü, teslimatlar normale döndü.",
  },
  {
    id: "inc-2026-0621",
    servisId: "dashboard",
    servisAd: "Dashboard",
    baslik: "Planlı altyapı bakımı",
    baslangic: "2026-06-21 03:00",
    sureDk: 25,
    etki: "bakim",
    durum: "cozuldu",
    not: "Panel veritabanı sürüm yükseltmesi. Salt-okunur mod aktifti; kesinti yaşanmadı, yazma işlemleri 25 dk ertelendi.",
  },
  {
    id: "inc-2026-0609",
    servisId: "siteverify-api",
    servisAd: "Siteverify API",
    baslik: "Bölgesel çözümleme hatası (EU-batı)",
    baslangic: "2026-06-09 18:42",
    sureDk: 14,
    etki: "kismi",
    durum: "cozuldu",
    not: "Tek bir edge bölgesinde DNS çözümleme hatası isteklerin ~%6'sını etkiledi. Trafik komşu bölgeye devrildi.",
  },
  {
    id: "inc-2026-0524",
    servisId: "challenge-api",
    servisAd: "Challenge API",
    baslik: "Kısa süreli tam kesinti",
    baslangic: "2026-05-24 09:17",
    sureDk: 6,
    etki: "tam",
    durum: "cozuldu",
    not: "Hatalı yapılandırma dağıtımı challenge üretimini 6 dk durdurdu. Otomatik geri-alma tetiklendi; dağıtım kapısı sıkılaştırıldı.",
  },
  {
    id: "inc-2026-0508",
    servisId: "verify-api",
    servisAd: "Verify API",
    baslik: "Artan hata oranı (5xx)",
    baslangic: "2026-05-08 21:05",
    sureDk: 19,
    etki: "kismi",
    durum: "cozuldu",
    not: "Önbellek düğümü başarısızlığı doğrulama isteklerinin bir kısmında 5xx döndürdü. Düğüm değiştirildi, önbellek yeniden ısındı.",
  },
];

/** Etki → rozet tonu + etiket (kit.Badge ile uyumlu). */
export const ETKI_META: Record<Olay["etki"], { ton: "kirmizi" | "sari" | "mavi"; etiket: string }> = {
  tam: { ton: "kirmizi", etiket: "Tam kesinti" },
  kismi: { ton: "sari", etiket: "Kısmi kesinti" },
  bakim: { ton: "mavi", etiket: "Planlı bakım" },
};

/** Olay durumu → rozet tonu + etiket. */
export const OLAY_DURUM_META: Record<Olay["durum"], { ton: "yesil" | "sari" | "brand"; etiket: string }> = {
  cozuldu: { ton: "yesil", etiket: "Çözüldü" },
  izleniyor: { ton: "sari", etiket: "İzleniyor" },
  arastiriliyor: { ton: "brand", etiket: "Araştırılıyor" },
};

/* ------------------------------------------------------------------ Bölgesel sağlık */

export interface BolgeSaglik {
  ad: string;
  /** Erişilebilirlik (%). */
  erisim: number;
  /** Bölge ort. gecikme (ms). */
  gecikme: number;
  durum: ServisDurum;
}

/** Edge modülüyle uyumlu bölge bazlı erişilebilirlik (deterministik). */
export const BOLGE_SAGLIK: BolgeSaglik[] = [
  { ad: "Avrupa", erisim: 99.99, gecikme: 8, durum: "operasyonel" },
  { ad: "Kuzey Amerika", erisim: 99.98, gecikme: 11, durum: "operasyonel" },
  { ad: "Asya-Pasifik", erisim: 99.94, gecikme: 14, durum: "dejenere" },
  { ad: "Güney Amerika", erisim: 99.97, gecikme: 16, durum: "operasyonel" },
  { ad: "Okyanusya", erisim: 99.96, gecikme: 18, durum: "operasyonel" },
  { ad: "Afrika / Orta Doğu", erisim: 99.91, gecikme: 21, durum: "dejenere" },
];

/**
 * Bir servis için son 24 saat / 7 gün p50-p95-p99 gecikme trendini üretir
 * (deterministik dalga). aralik: nokta sayısı.
 */
export function gecikmeTrend(
  tohum: number,
  taban: number,
  aralik: number,
): { p50: number[]; p95: number[]; p99: number[] } {
  let s = tohum >>> 0;
  const rnd = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  const p50: number[] = [];
  const p95: number[] = [];
  const p99: number[] = [];
  for (let i = 0; i < aralik; i++) {
    const dalga = Math.sin(i * 0.5 + tohum * 0.01) * 0.18 + 1;
    const gurultu = 0.85 + rnd() * 0.3;
    const t = taban * dalga * gurultu;
    p50.push(Math.round(t));
    p95.push(Math.round(t * (2.3 + rnd() * 0.4)));
    p99.push(Math.round(t * (3.8 + rnd() * 0.6)));
  }
  return { p50, p95, p99 };
}
