/**
 * Specter — Plan & Kota Tanımları
 * ================================
 * Tek kaynak: plan limitleri, fiyatlar ve kota zorlaması burada tanımlanır.
 * Hem panel (fatura/kullanım) hem public API (kota aşımı zorlaması) kullanır.
 */

/**
 * ÖDEME ALTYAPISI DURUMU
 * ----------------------
 * Ödeme sağlayıcı (Stripe/iyzico) entegrasyonu HENÜZ CANLI DEĞİL. Bu bayrak
 * `false` iken para tahsil eden akışlar (kredi satın alma, ücretli plana geçiş,
 * kart ekleme) "Yakında" olarak sunulur — hiçbir gerçek tahsilat/DB-yükseltme
 * yapılmaz. Ücretsiz plana düşme ve Scale satış-talebi (para tahsil etmez)
 * etkilenmez. Altyapı canlıya alınınca burada tek satır `true` yapılır ve tüm
 * satın-alma akışları otomatik açılır. Tek kaynak — UI + API aynı bayrağı okur.
 */
export const ODEME_HAZIR = false;

export type Plan = "free" | "pro" | "scale";

export interface PlanTanim {
  key: Plan;
  ad: string;
  fiyat: string;
  /** Aylık doğrulama kotası. */
  dogrulamaKotasi: number;
  /** Maksimum site sayısı. */
  siteLimiti: number;
  /** Maksimum ekip üyesi. */
  ekipLimiti: number;
  /** API anahtarı limiti. */
  anahtarLimiti: number;
  /** Kota aşımında davranış: "block" (reddet) | "overage" (fazla kullanım ücreti) | "downgrade" (zorluk düşür). */
  asimDavranisi: "block" | "overage";
}

// NOT: Bu limitler landing fiyatlandırma sayfasıyla (FiyatIcerik.tsx) TUTARLI
// olmalı — landing müşteriye vaat edilen sözdür. Daha önce landing 10K free /
// 1M pro vaat ediyordu ama sistem 1K / 100K'da kesiyordu (müşteri yanıltma +
// kota erken engelleme). Landing'in söz verdiği (daha cömert) değerlere hizalandı.
export const PLANLAR: Record<Plan, PlanTanim> = {
  free: {
    key: "free", ad: "Başlangıç", fiyat: "₺0",
    dogrulamaKotasi: 10000, siteLimiti: 1, ekipLimiti: 1, anahtarLimiti: 2,
    asimDavranisi: "block",
  },
  pro: {
    key: "pro", ad: "Büyüme", fiyat: "₺990/ay",
    dogrulamaKotasi: 1000000, siteLimiti: 10, ekipLimiti: 10, anahtarLimiti: 20,
    asimDavranisi: "overage",
  },
  scale: {
    key: "scale", ad: "Ölçek", fiyat: "Özel",
    dogrulamaKotasi: 100000000, siteLimiti: 9999, ekipLimiti: 999, anahtarLimiti: 999,
    asimDavranisi: "overage",
  },
};

export function planTanim(plan: string): PlanTanim {
  return PLANLAR[(plan as Plan)] ?? PLANLAR.free;
}

/* ------------------------------------------------------------------ Özellik matrisi
 * Premium özellik erişim tablosu. Tek kaynak: hangi plan hangi premium
 * özelliği açar. UI kilitleri (PlanKilit) ve gerekirse sunucu zorlaması bunu
 * kullanır. Not: temel koruma tüm planlarda vardır; burada YALNIZCA plana göre
 * ayrışan premium özellikler listelenir. */
export type PlanOzellik =
  | "davranissal_analiz"   // gelişmiş davranışsal analiz
  | "kural_motoru"         // gelişmiş kural motoru (kill-chain kuralları)
  | "webhook"              // webhook & giden entegrasyon
  | "api_erisim"           // public API anahtarları
  | "sso"                  // SSO / SAML kurumsal kimlik
  | "sla"                  // SLA garantisi
  | "ozel_model";          // özel AI ajan modeli

/** Her plan hangi premium özelliklere sahip. free = temel; pro = üretim; scale = kurumsal. */
export const PLAN_OZELLIKLERI: Record<Plan, PlanOzellik[]> = {
  free: [],
  pro: ["davranissal_analiz", "kural_motoru", "webhook", "api_erisim"],
  scale: ["davranissal_analiz", "kural_motoru", "webhook", "api_erisim", "sso", "sla", "ozel_model"],
};

/** İnsan-okur özellik etiketleri (kilit UI başlıkları için). */
export const OZELLIK_ETIKET: Record<PlanOzellik, string> = {
  davranissal_analiz: "Davranışsal analiz",
  kural_motoru: "Gelişmiş kural motoru",
  webhook: "Webhook & entegrasyon",
  api_erisim: "API erişimi",
  sso: "SSO / SAML",
  sla: "SLA garantisi",
  ozel_model: "Özel AI ajan modeli",
};

/** Bir plan verilen premium özelliğe sahip mi? */
export function planOzellikVar(plan: string, ozellik: PlanOzellik): boolean {
  return (PLAN_OZELLIKLERI[(plan as Plan)] ?? PLAN_OZELLIKLERI.free).includes(ozellik);
}

/** Bir özelliği açan EN DÜŞÜK plan (kilit UI'da "X planına yükselt" demek için). */
export function ozellikGerekliPlan(ozellik: PlanOzellik): Plan {
  if (PLAN_OZELLIKLERI.pro.includes(ozellik)) return "pro";
  if (PLAN_OZELLIKLERI.scale.includes(ozellik)) return "scale";
  return "pro";
}

/** Kullanım durumunu değerlendir: aşıldı mı, yakında mı, ne kadar kaldı. */
export function kotaDurumu(kullanilan: number, plan: string): {
  kota: number;
  kullanilan: number;
  oran: number; // 0..1
  kalan: number;
  asildi: boolean;
  uyari: boolean; // %90+
  asimDavranisi: "block" | "overage";
} {
  const t = planTanim(plan);
  const kota = t.dogrulamaKotasi;
  const oran = kota > 0 ? kullanilan / kota : 0;
  return {
    kota,
    kullanilan,
    oran: Math.min(2, oran),
    kalan: Math.max(0, kota - kullanilan),
    asildi: kullanilan >= kota,
    uyari: oran >= 0.9,
    asimDavranisi: t.asimDavranisi,
  };
}
