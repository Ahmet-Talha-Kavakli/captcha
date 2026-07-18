"use client";

import { useState } from "react";
import Link from "next/link";
import { FlaskConical, TrendingUp, Check, X, AlertTriangle, Trophy, Sigma, Target, Gauge, ArrowRight, Info } from "lucide-react";
import { Panel, StatKart, Badge } from "@/components/panel/kit";
import type { DeneyAnaliz, WilsonAralik } from "@/lib/specter/deney-istatistik";
import type { ExperimentVariantResult } from "@/lib/db/schema";
import type { Dil } from "@/lib/i18n/panel";
import { deneyCeviri } from "./deney-analiz.i18n";
import { cn } from "@/lib/cn";

interface AnalizGorunum {
  id: string; name: string; status: string; metric: string;
  // enum güvenliği: varyant etiketi ham veriden client'ta kurulur (görünmez eki çevrilir)
  variantADifficulty: string; variantAInvisible: boolean;
  variantBDifficulty: string; variantBInvisible: boolean;
  sonucA: ExperimentVariantResult; sonucB: ExperimentVariantResult;
  basariA: number; basariB: number;
  analiz: DeneyAnaliz; peekingUyari: string | null;
}

export function DeneyAnalizIstemci({ analizler, dil }: { analizler: AnalizGorunum[]; dil: Dil }) {
  const t = (k: string) => deneyCeviri(k, dil);
  const [secili, setSecili] = useState<AnalizGorunum | null>(analizler[0] ?? null);

  const anlamliSayi = analizler.filter((a) => a.analiz.anlamli).length;
  const yeterliSayi = analizler.filter((a) => a.analiz.yeterliOrnek).length;

  // metrik enum → yerelleştirilmiş etiket (anahtar-eşleme, çevrilmeyen değer)
  const metrikEtiket = (m: string) => t(`metrik.${m}`);
  // varyant etiketi: "A · orta · görünmez" gibi, yalnız "görünmez" eki çevrilir
  const varyantAd = (harf: "A" | "B", diff: string, gorunmez: boolean) =>
    `${harf} · ${diff}${gorunmez ? ` · ${t("varyant.gorunmez")}` : ""}`;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Sigma className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("banner.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">{t("banner.metin")}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={analizler.length} etiket={t("stat.toplam")} ikon={<FlaskConical className="size-5" />} />
        <StatKart sayi={anlamliSayi} etiket={t("stat.anlamli")} ikon={<Check className="size-5" />} tone="ok" />
        <StatKart sayi={yeterliSayi} etiket={t("stat.yeterli")} ikon={<Gauge className="size-5" />} tone="brand" />
        <StatKart sayi={analizler.length - yeterliSayi} etiket={t("stat.dahaVeri")} ikon={<AlertTriangle className="size-5" />} tone="warn" />
      </div>

      {analizler.length === 0 ? (
        <Panel baslik={t("bos.baslik")}>
          <div className="py-10 text-center">
            <FlaskConical className="mx-auto mb-3 size-10 text-slate-300" />
            <p className="text-sm text-slate-muted">{t("bos.metin")}</p>
            <Link href="/panel/denemeler" className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-4 py-2 text-[13px] font-semibold text-white">{t("bos.cta")} <ArrowRight className="size-3.5" /></Link>
          </div>
        </Panel>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* deney listesi */}
          <Panel baslik={t("liste.baslik")} padding={false}>
            <div className="divide-y divide-line">
              {analizler.map((a) => (
                <button key={a.id} onClick={() => setSecili(a)} className={cn("flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-canvas/50", secili?.id === a.id && "bg-brand-50/40")}>
                  <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", a.analiz.anlamli ? "bg-ok-soft text-ok" : "bg-canvas text-slate-muted")}>
                    {a.analiz.anlamli ? <Trophy className="size-4" /> : <FlaskConical className="size-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold text-slate-ink">{a.name}</div>
                    <div className="text-[11.5px] text-slate-faint">{metrikEtiket(a.metric)} · {t("liste.guven").replace("{n}", a.analiz.guvenYuzde.toFixed(0))}</div>
                  </div>
                  {a.analiz.anlamli && <Badge ton={a.analiz.kazanan === "B" ? "yesil" : "mavi"}>{a.analiz.kazanan}</Badge>}
                </button>
              ))}
            </div>
          </Panel>

          {/* analiz detayı */}
          {secili && <AnalizDetay a={secili} t={t} varyantAd={varyantAd} dil={dil} />}
        </div>
      )}
    </div>
  );
}

function AnalizDetay({ a, t, varyantAd, dil }: {
  a: AnalizGorunum;
  t: (k: string) => string;
  varyantAd: (harf: "A" | "B", diff: string, gorunmez: boolean) => string;
  dil: Dil;
}) {
  const an = a.analiz;
  const adA = varyantAd("A", a.variantADifficulty, a.variantAInvisible);
  const adB = varyantAd("B", a.variantBDifficulty, a.variantBInvisible);
  const kazananAd = an.kazanan === "B" ? adB : adA;
  const locale = dil === "tr" ? "tr-TR" : dil;
  return (
    <div className="space-y-6">
      {/* karar özeti */}
      <Panel baslik={t("detay.karar")}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className={cn("grid size-12 place-items-center rounded-2xl", an.anlamli ? "bg-ok-soft text-ok" : "bg-warn-soft text-amber-700")}>
              {an.anlamli ? <Trophy className="size-6" /> : <AlertTriangle className="size-6" />}
            </span>
            <div>
              <div className="text-[17px] font-bold text-slate-ink">
                {an.anlamli ? t("detay.kazanan").replace("{ad}", kazananAd) : t("detay.belirsiz")}
              </div>
              <div className="text-[13px] text-slate-muted">
                {an.anlamli
                  ? t("detay.kazananAlt").replace("{guven}", an.guvenYuzde.toFixed(1)).replace("{fark}", an.bagilFark.toFixed(1))
                  : t("detay.belirsizAlt").replace("{p}", an.pDegeri.toFixed(3)).replace("{guc}", an.guc.toFixed(0))}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="num text-[28px] font-bold" style={{ color: an.anlamli ? "#16a34a" : "#d97706" }}>%{an.guvenYuzde.toFixed(0)}</div>
            <div className="text-[11px] text-slate-faint">{t("detay.guvenEtiket")}</div>
          </div>
        </div>
        {a.peekingUyari && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-warn-soft bg-warn-soft/40 px-3.5 py-3 text-[12.5px] text-amber-700">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {t("detay.peeking").replace("{n}", (an.gerekenN || 0).toLocaleString(locale))}
          </div>
        )}
      </Panel>

      {/* oran karşılaştırma + güven aralıkları */}
      <Panel baslik={t("oran.baslik")}>
        <div className="space-y-5">
          <VaryantCubuk ad={t("oran.kontrol").replace("{ad}", adA)} orani={an.pA} ci={an.ciA} basari={a.basariA} n={a.sonucA.gosterim} renk="#64748b" kazanan={an.anlamli && an.kazanan === "A"} t={t} locale={locale} />
          <VaryantCubuk ad={t("oran.varyant").replace("{ad}", adB)} orani={an.pB} ci={an.ciB} basari={a.basariB} n={a.sonucB.gosterim} renk="#2f6fed" kazanan={an.anlamli && an.kazanan === "B"} t={t} locale={locale} />
        </div>
        <div className="mt-4 rounded-xl bg-canvas/50 px-3.5 py-3 text-[12.5px] text-slate-muted">
          <Info className="mr-1.5 inline size-3.5 text-brand-600" />
          {t("oran.farkAralik")
            .replace("{alt}", an.farkCiAlt.toFixed(2))
            .replace("{ust}", an.farkCiUst.toFixed(2))}
          {an.farkCiAlt > 0 || an.farkCiUst < 0 ? t("oran.sifirYok") : t("oran.sifirVar")}
        </div>
      </Panel>

      {/* istatistik metrikleri */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <IstatKart ikon={<Sigma className="size-4" />} etiket={t("istat.z")} deger={an.z.toFixed(2)} alt={t("istat.zAlt")} />
        <IstatKart ikon={<Target className="size-4" />} etiket={t("istat.p")} deger={an.pDegeri < 0.001 ? "<0.001" : an.pDegeri.toFixed(3)} alt={an.pDegeri < 0.05 ? t("istat.pAnlamli") : t("istat.pAnlamsiz")} tone={an.pDegeri < 0.05 ? "ok" : "warn"} />
        <IstatKart ikon={<Gauge className="size-4" />} etiket={t("istat.guc")} deger={`%${an.guc.toFixed(0)}`} alt={an.yeterliOrnek ? t("istat.gucYeterli") : t("istat.gucDusuk")} tone={an.yeterliOrnek ? "ok" : "warn"} />
        <IstatKart ikon={<TrendingUp className="size-4" />} etiket={t("istat.orneklem")} deger={an.gerekenN ? an.gerekenN.toLocaleString(locale) : "—"} alt={t("istat.orneklemAlt")} />
      </div>

      {/* yöntem açıklama */}
      <Panel baslik={t("yontem.baslik")}>
        <div className="grid gap-3 sm:grid-cols-2">
          <YontemNot baslik={t("yontem.ztest")} metin={t("yontem.ztestMetin")} />
          <YontemNot baslik={t("yontem.wilson")} metin={t("yontem.wilsonMetin")} />
          <YontemNot baslik={t("yontem.guc")} metin={t("yontem.gucMetin")} />
          <YontemNot baslik={t("yontem.peeking")} metin={t("yontem.peekingMetin")} />
        </div>
      </Panel>
    </div>
  );
}

function VaryantCubuk({ ad, orani, ci, basari, n, renk, kazanan, t, locale }: { ad: string; orani: number; ci: WilsonAralik; basari: number; n: number; renk: string; kazanan: boolean; t: (k: string) => string; locale: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[13px] font-medium text-slate-ink">{ad} {kazanan && <Trophy className="size-3.5 text-ok" />}</span>
        <span className="num text-[13px] font-semibold" style={{ color: renk }}>%{(orani * 100).toFixed(2)}</span>
      </div>
      {/* GA bandı */}
      <div className="relative h-6 rounded-lg bg-canvas">
        {/* güven aralığı bandı */}
        <div className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full opacity-30" style={{ left: `${ci.alt * 100}%`, width: `${(ci.ust - ci.alt) * 100}%`, background: renk }} />
        {/* nokta tahmini */}
        <div className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white" style={{ left: `${orani * 100}%`, background: renk }} />
      </div>
      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-faint">
        <span className="num">{basari.toLocaleString(locale)} / {n.toLocaleString(locale)}</span>
        <span className="num">{t("oran.ga").replace("{alt}", (ci.alt * 100).toFixed(1)).replace("{ust}", (ci.ust * 100).toFixed(1))}</span>
      </div>
    </div>
  );
}

function IstatKart({ ikon, etiket, deger, alt, tone }: { ikon: React.ReactNode; etiket: string; deger: string; alt: string; tone?: "ok" | "warn" }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-center gap-1.5 text-[12px] text-slate-muted">{ikon} {etiket}</div>
      <div className="mt-1 num text-[22px] font-bold text-slate-ink">{deger}</div>
      <div className={cn("text-[11.5px]", tone === "ok" ? "text-ok" : tone === "warn" ? "text-amber-700" : "text-slate-faint")}>{alt}</div>
    </div>
  );
}

function YontemNot({ baslik, metin }: { baslik: string; metin: string }) {
  return (
    <div className="rounded-xl border border-line bg-canvas/40 px-3.5 py-3">
      <div className="text-[13px] font-semibold text-slate-ink">{baslik}</div>
      <p className="mt-0.5 text-[12px] leading-relaxed text-slate-muted">{metin}</p>
    </div>
  );
}
