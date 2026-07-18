"use client";

/**
 * PlanKilit — Premium özellik kilidi
 * ==================================
 * Bir premium özelliği, kullanıcının planı yetersizse "Pro'ya yükselt"
 * overlay'i ile sarmalar. Plan yeterliyse children aynen render edilir
 * (mevcut pro/kurumsal deneyim ETKİLENMEZ).
 *
 * Kullanım:
 *   <PlanKilit plan={plan} ozellik="sso">
 *     <SsoAyarlari />
 *   </PlanKilit>
 *
 * Kilitliyken içerik blur + tıklama-kapalı gösterilir, üstünde kilit rozeti
 * ve /panel/ayarlar/plan linki bulunur. Yatay scroll ÜRETMEZ.
 */

import Link from "next/link";
import { Lock, ArrowUpRight, Sparkles } from "lucide-react";
import {
  planOzellikVar,
  ozellikGerekliPlan,
  OZELLIK_ETIKET,
  planTanim,
  type PlanOzellik,
} from "@/lib/specter/plans";
import { cn } from "@/lib/cn";

export function PlanKilit({
  plan,
  ozellik,
  gerekliPlan,
  aciklama,
  children,
  className,
}: {
  plan: string;
  ozellik: PlanOzellik;
  /** Zorunlu planı ez (varsayılan: özelliği açan en düşük plan). */
  gerekliPlan?: "pro" | "scale";
  /** Kilit kartında gösterilecek özel açıklama. */
  aciklama?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const acik = planOzellikVar(plan, ozellik);
  if (acik) return <>{children}</>;

  const hedefPlan = gerekliPlan ?? ozellikGerekliPlan(ozellik);
  const hedefAd = planTanim(hedefPlan).ad;
  const etiket = OZELLIK_ETIKET[ozellik];

  return (
    <div className={cn("relative overflow-hidden rounded-3xl", className)}>
      {/* Kilitli içerik: etkileşimsiz + blur, sadece görsel bağlam için. */}
      <div
        aria-hidden
        className="pointer-events-none select-none blur-[3px] saturate-[0.85] opacity-60"
      >
        {children}
      </div>

      {/* Kilit katmanı */}
      <div className="absolute inset-0 grid place-items-center bg-canvas/55 p-6 backdrop-blur-[1px]">
        <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-5 text-center shadow-card">
          <span className="mx-auto mb-3 grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <Lock className="size-5" />
          </span>
          <div className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-brand-600">
            <Sparkles className="size-3.5" /> {hedefAd} planı
          </div>
          <h3 className="text-[15px] font-semibold text-slate-ink">{etiket} kilitli</h3>
          <p className="mx-auto mt-1.5 max-w-[34ch] text-[13px] text-slate-muted">
            {aciklama ??
              `Bu özellik ${hedefAd} planında açılır. Yükselterek ${etiket.toLocaleLowerCase("tr-TR")} özelliğini kullanmaya başlayın.`}
          </p>
          <Link
            href="/panel/ayarlar/plan"
            className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-full bg-ink-900 px-5 h-10 text-[13px] font-medium text-white transition-all duration-150 hover:bg-ink-800 active:scale-[0.98]"
          >
            {hedefAd}'a yükselt <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * PlanKilitRozet — hafif satır-içi kilit rozeti.
 * Bir menü/başlık/düğme yanında "Pro" kilidi göstermek için (overlay yerine).
 * Plan yeterliyse null döner.
 */
export function PlanKilitRozet({
  plan,
  ozellik,
  gerekliPlan,
}: {
  plan: string;
  ozellik: PlanOzellik;
  gerekliPlan?: "pro" | "scale";
}) {
  if (planOzellikVar(plan, ozellik)) return null;
  const hedefAd = planTanim(gerekliPlan ?? ozellikGerekliPlan(ozellik)).ad;
  return (
    <Link
      href="/panel/ayarlar/plan"
      title={`${hedefAd} planında açılır`}
      className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700 ring-1 ring-inset ring-brand-100 transition hover:bg-brand-100"
    >
      <Lock className="size-3" /> {hedefAd}
    </Link>
  );
}
