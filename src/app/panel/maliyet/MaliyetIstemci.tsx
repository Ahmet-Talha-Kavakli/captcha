"use client";

import { Wallet, TrendingUp, Gauge, AlertTriangle, Check, ArrowUpRight, Sparkles } from "lucide-react";
import { Panel, StatKart, Badge } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { TrendGrafik } from "@/components/panel/grafikler";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { maliyetCeviri, planAdi, planFiyati, MA_LOCALE } from "./maliyet.i18n";

interface PlanBilgi { key: string; ad: string; fiyat: string; kota: number; yeterli: boolean; mevcut: boolean }

export function MaliyetIstemci({
  dil, planKey, kota, kullanilan, oran, seri, etiket,
  aySonuTahmin, tahminAsim, tahminEkUcret, gunlukOrt, planlar,
}: {
  dil: Dil; planKey: string; kota: number; kullanilan: number; oran: number;
  seri: number[]; etiket: string[]; aySonuTahmin: number; tahminAsim: number;
  tahminEkUcret: number; gunlukOrt: number; planlar: PlanBilgi[];
}) {
  const t = (k: string) => maliyetCeviri(k, dil);
  const loc = MA_LOCALE[dil];
  const nf = (n: number) => n.toLocaleString(loc);
  const planAd = planAdi(planKey, dil);
  const planFiyat = planFiyati(planKey, dil);
  const kotaYuzde = Math.round(oran * 100);
  const tahminYuzde = kota > 0 ? Math.round((aySonuTahmin / kota) * 100) : 0;

  // Optimizasyon önerisi: mevcut plan yetersizse yükselt, çok bolsa düşür.
  const mevcut = planlar.find((p) => p.mevcut);
  const yeterliMi = mevcut?.yeterli ?? true;
  const onerilenYukselt = !yeterliMi ? planlar.find((p) => p.yeterli && p.kota > (mevcut?.kota ?? 0)) : null;
  const kullanimDusuk = yeterliMi && aySonuTahmin < kota * 0.3 && mevcut?.key !== "free";

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* özet */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={planAd} etiket={t("ma.ozet.mevcutPlan").replace("{fiyat}", planFiyat)} ikon={<Wallet className="size-5" />} tone="brand" />
        <StatKart sayi={nf(kullanilan)} etiket={t("ma.ozet.buAyKullanilan")} ikon={<Gauge className="size-5" />} />
        <StatKart sayi={nf(aySonuTahmin)} etiket={t("ma.ozet.aySonuOngoru")} ikon={<TrendingUp className="size-5" />} tone={tahminYuzde > 100 ? "danger" : tahminYuzde > 80 ? "warn" : undefined} />
        <StatKart sayi={tahminEkUcret > 0 ? `₺${nf(tahminEkUcret)}` : "₺0"} etiket={t("ma.ozet.ongorulenEkUcret")} tone={tahminEkUcret > 0 ? "warn" : "ok"} />
      </div>

      {/* öngörü paneli */}
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Panel baslik={t("ma.trend.baslik")}>
          <TrendGrafik noktalar={seri} etiketler={etiket} renk="#2f6fed" yukseklik={220} />
          <div className="mt-3 flex flex-wrap items-center gap-4 text-[12px] text-slate-muted">
            <span>{t("ma.trend.gunlukOrt")} <b className="num text-slate-ink">{nf(gunlukOrt)}</b></span>
            <span>{t("ma.trend.aySonu")} <b className="num text-slate-ink">{nf(aySonuTahmin)}</b> / {nf(kota)}</span>
          </div>
        </Panel>

        <Panel baslik={t("ma.proj.baslik")}>
          <div className="space-y-4">
            <div>
              <div className="mb-1.5 flex items-end justify-between">
                <span className="text-[13px] text-slate-muted">{t("ma.proj.mevcutKullanim")}</span>
                <span className="num text-[13px] font-semibold text-slate-ink">%{kotaYuzde}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-canvas"><div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.min(100, kotaYuzde)}%` }} /></div>
            </div>
            <div>
              <div className="mb-1.5 flex items-end justify-between">
                <span className="text-[13px] text-slate-muted">{t("ma.proj.ongorulen")}</span>
                <span className={cn("num text-[13px] font-semibold", tahminYuzde > 100 ? "text-danger2" : "text-slate-ink")}>%{tahminYuzde}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-canvas"><div className={cn("h-full rounded-full", tahminYuzde > 100 ? "bg-danger2" : tahminYuzde > 80 ? "bg-warn" : "bg-ok")} style={{ width: `${Math.min(100, tahminYuzde)}%` }} /></div>
            </div>
            {tahminAsim > 0 ? (
              <div className="flex items-start gap-2 rounded-xl bg-danger-soft px-3 py-2.5 text-[12px] text-danger2">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" /> {t("ma.proj.asim")
                  .replace("{asim}", nf(tahminAsim))
                  .replace("{ekUcret}", tahminEkUcret > 0 ? t("ma.proj.asimEkUcret").replace("{n}", nf(tahminEkUcret)) : t("ma.proj.asimYukselt"))}
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-xl bg-ok-soft px-3 py-2.5 text-[12px] text-ok">
                <Check className="mt-0.5 size-3.5 shrink-0" /> {t("ma.proj.yeterli")}
              </div>
            )}
          </div>
        </Panel>
      </div>

      {/* optimizasyon önerisi */}
      {(onerilenYukselt || kullanimDusuk) && (
        <div className="overflow-hidden rounded-[28px] border border-brand-100 bg-gradient-to-br from-brand-50/60 to-surface p-6">
          <div className="flex items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-600 text-white"><Sparkles className="size-5" /></span>
            <div className="flex-1">
              <h3 className="text-[16px] font-bold text-slate-ink">{t("ma.oneri.baslik")}</h3>
              {onerilenYukselt ? (
                <p className="mt-1 text-[14px] text-slate-muted">{t("ma.oneri.yukselt")
                  .replace("{plan}", planAdi(onerilenYukselt.key, dil))
                  .replace("{kota}", nf(onerilenYukselt.kota))
                  .replace("{fiyat}", planFiyati(onerilenYukselt.key, dil))}</p>
              ) : (
                <p className="mt-1 text-[14px] text-slate-muted">{t("ma.oneri.dusur")}</p>
              )}
              <Button href="/panel/ayarlar/plan" size="sm" className="mt-3">{t("ma.oneri.planiYonet")} <ArrowUpRight className="size-3.5" /></Button>
            </div>
          </div>
        </div>
      )}

      {/* plan karşılaştırma */}
      <Panel baslik={t("ma.plan.baslik")}>
        <p className="mb-4 text-sm text-slate-muted">{t("ma.plan.aciklama").replace("{tahmin}", nf(aySonuTahmin))}</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {planlar.map((p) => (
            <div key={p.key} className={cn("rounded-2xl border p-4", p.mevcut ? "border-brand-400 bg-brand-50/40 ring-1 ring-brand-200" : "border-line bg-surface")}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-ink">{planAdi(p.key, dil)}</span>
                {p.mevcut && <Badge ton="brand">{t("ma.plan.mevcut")}</Badge>}
              </div>
              <div className="mt-1 text-[13px] text-slate-muted">{planFiyati(p.key, dil)}</div>
              <div className="mt-2 num text-[13px] text-slate-ink">{t("ma.plan.kotaAy").replace("{kota}", nf(p.kota))}</div>
              <div className={cn("mt-2 flex items-center gap-1.5 text-[12px] font-medium", p.yeterli ? "text-ok" : "text-danger2")}>
                {p.yeterli ? <><Check className="size-3.5" /> {t("ma.plan.yeter")}</> : <><AlertTriangle className="size-3.5" /> {t("ma.plan.asim")}</>}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
