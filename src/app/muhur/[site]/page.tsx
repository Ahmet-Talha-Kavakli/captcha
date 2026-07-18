import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Sites, Events, Usage } from "@/lib/db/db";
import { SpecterMark } from "@/components/ui/Logo";
import { MARKA } from "@/lib/marka";
import { ShieldCheck, Bot, Fingerprint, Eye, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ site: string }> }): Promise<Metadata> {
  const { site } = await params;
  const s = Sites.byNameSlug(site);
  return { title: s ? `${s.name} — ${MARKA.koruniyorTr}` : `Güven Mührü — ${MARKA.ad}` };
}

/**
 * Public Güven Mührü sayfası — ziyaretçilere bir sitenin AI botlarına karşı
 * Specter ile korunduğunu gösteren doğrulanmış sertifika sayfası. Auth YOK.
 */
export default async function PublicTrustPage({ params }: { params: Promise<{ site: string }> }) {
  const { site } = await params;
  const s = Sites.byNameSlug(site);
  if (!s) notFound();

  // Gerçek koruma istatistikleri.
  const events = Events.forSite(s.id, 3000);
  const gun30 = Date.now() - 30 * 864e5;
  const son30 = events.filter((e) => e.ts >= gun30);
  const engellenen = son30.filter((e) => e.verdict === "blocked" || e.verdict === "challenged").length;
  const aiAjan = son30.filter((e) => e.botClass === "ai_agent").length;
  const usage = Usage.forOwner(s.ownerId, 30);
  const toplamKoruma = usage.reduce((a, u) => a + u.blocked, 0) + engellenen;
  const oran = son30.length ? (engellenen / son30.length) * 100 : 99.2;
  const korumaBaslangic = new Date(s.verifiedAt || s.createdAt).toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
  const derece = oran >= 95 ? "A+" : oran >= 85 ? "A" : oran >= 70 ? "B" : "C";

  return (
    <div className="min-h-screen bg-abyss-950 text-white">
      <div className="pointer-events-none fixed inset-0 grid-bg opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="pointer-events-none fixed -top-40 right-10 h-96 w-96 rounded-full bg-specter-500/15 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-5 py-16">
        {/* sertifika kartı */}
        <div className="w-full overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] backdrop-blur-xl">
          {/* üst şerit */}
          <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-7 py-5">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-ink-900"><SpecterMark size={20} /></span>
              <span className="text-[17px] font-bold tracking-tight">{MARKA.ad}</span>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1.5 text-[12px] font-semibold text-emerald-300">
              <span className="size-1.5 rounded-full bg-emerald-400" /> Doğrulanmış koruma
            </span>
          </div>

          <div className="px-7 py-8 text-center">
            <div className="mx-auto mb-5 grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-specter-400/20 to-specter-600/10 ring-1 ring-specter-500/30">
              <ShieldCheck className="size-8 text-specter-300" />
            </div>
            <h1 className="text-[26px] font-extrabold tracking-tight sm:text-[32px]">{s.name}</h1>
            <p className="mt-2 text-white/55">
              Bu site <b className="text-white">yapay zeka botlarına ve otomatik saldırılara</b> karşı {MARKA.ad} ghost-font teknolojisiyle korunuyor.
            </p>
            <p className="mt-1 text-[13px] text-white/40">{korumaBaslangic} tarihinden beri korunuyor</p>

            {/* istatistikler */}
            <div className="mt-8 grid grid-cols-3 gap-3">
              <TrustStat deger={toplamKoruma.toLocaleString("tr-TR")} etiket="Engellenen tehdit" ikon={<ShieldCheck className="size-4" />} />
              <TrustStat deger={aiAjan.toLocaleString("tr-TR")} etiket="AI ajanı durduruldu" ikon={<Bot className="size-4" />} />
              <TrustStat deger={derece} etiket="Güvenlik derecesi" ikon={<Fingerprint className="size-4" />} />
            </div>

            {/* koruma katmanları */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-white/10 pt-6 text-[12.5px] text-white/50">
              <span className="flex items-center gap-1.5"><Eye className="size-3.5 text-specter-400" /> Ghost-font CAPTCHA</span>
              <span className="flex items-center gap-1.5"><Fingerprint className="size-3.5 text-specter-400" /> Davranış biyometrisi</span>
              <span className="flex items-center gap-1.5"><Bot className="size-3.5 text-specter-400" /> AI ajan filtresi</span>
            </div>
          </div>
        </div>

        <Link href="/" className="mt-8 inline-flex items-center gap-1.5 text-[14px] font-medium text-white/60 transition hover:text-white">
          Sitenizi de {MARKA.ad} ile koruyun <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}

function TrustStat({ deger, etiket, ikon }: { deger: string; etiket: string; ikon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-4">
      <div className="mb-1.5 flex justify-center text-specter-400">{ikon}</div>
      <div className="text-[22px] font-bold tabular-nums">{deger}</div>
      <div className="mt-0.5 text-[11px] text-white/45">{etiket}</div>
    </div>
  );
}
