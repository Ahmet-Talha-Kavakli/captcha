/**
 * Specter — Plan & Kota Tanımları
 * ================================
 * Tek kaynak: plan limitleri, fiyatlar ve kota zorlaması burada tanımlanır.
 * Hem panel (fatura/kullanım) hem public API (kota aşımı zorlaması) kullanır.
 */

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

export const PLANLAR: Record<Plan, PlanTanim> = {
  free: {
    key: "free", ad: "Ücretsiz", fiyat: "₺0",
    dogrulamaKotasi: 1000, siteLimiti: 1, ekipLimiti: 1, anahtarLimiti: 2,
    asimDavranisi: "block",
  },
  pro: {
    key: "pro", ad: "Pro", fiyat: "₺490/ay",
    dogrulamaKotasi: 100000, siteLimiti: 999, ekipLimiti: 10, anahtarLimiti: 20,
    asimDavranisi: "overage",
  },
  scale: {
    key: "scale", ad: "Scale", fiyat: "Özel",
    dogrulamaKotasi: 1000000, siteLimiti: 9999, ekipLimiti: 999, anahtarLimiti: 999,
    asimDavranisi: "overage",
  },
};

export function planTanim(plan: string): PlanTanim {
  return PLANLAR[(plan as Plan)] ?? PLANLAR.free;
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
