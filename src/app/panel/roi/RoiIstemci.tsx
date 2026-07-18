"use client";

import { motion } from "framer-motion";
import { TrendingUp, ShieldCheck, Coins, Ban, Sparkles, Download, ArrowUpRight, ArrowRight, Info, Wallet, Gauge as GaugeGost, CalendarClock, Layers } from "lucide-react";
import { Panel, StatKart, Badge, useToast } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { TrendGrafik, DonutDagilim } from "@/components/panel/grafikler";
import { Gauge } from "@/components/panel/grafikler-ek";
import { botSinifGorsel } from "@/components/panel/bot-sinif-gorsel";
import type { RoiSonuc } from "@/lib/specter/roi";
import type { Dil } from "@/lib/i18n/panel";
import { cn } from "@/lib/cn";
import { roiCeviri } from "./roi.i18n";

/** Dil → BCP-47 yerel etiketi (sayı biçimleme için). */
const BCP47: Record<Dil, string> = { tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES" };

export function RoiIstemci({
  roi, planAd, planFiyat, trendDeger, trendEtiket, dil,
}: {
  roi: RoiSonuc;
  planAd: string;
  planFiyat: string;
  trendDeger: number[];
  trendEtiket: string[];
  dil: Dil;
}) {
  const { goster } = useToast();
  const t = (k: string) => roiCeviri(k, dil);
  const loc = BCP47[dil];
  const sayi = (n: number) => n.toLocaleString(loc);
  const tl = (n: number) => "₺" + Math.round(n).toLocaleString(loc);
  const maxKalem = Math.max(1, ...roi.kalemler.map((k) => k.onlenenMaliyet));

  // Yıllık projeksiyon (aylık × 12).
  const yillikOnlenen = roi.toplamOnlenenMaliyet * 12;
  const yillikMaliyet = roi.specterMaliyet * 12;
  const yillikNet = yillikOnlenen - yillikMaliyet;

  // Gauge için ROI çarpanı → 0-100 ölçek. 10× ve üstü tam skala; ücretsiz plan = 100.
  const roiGaugeDeger = roi.ucretsizMi ? 100 : Math.max(0, Math.min(100, (roi.roiCarpani / 10) * 100));
  // Geri ödeme (ücret önlenen maliyetin kaçta kaçı → kaç günde çıkar).
  const geriOdemeGun = roi.ucretsizMi || roi.toplamOnlenenMaliyet <= 0
    ? 0
    : Math.max(1, Math.round((roi.specterMaliyet / roi.toplamOnlenenMaliyet) * 30));

  // Maliyet kırılımı donut segmentleri (saldırı türüne göre).
  const donutSegmentler = roi.kalemler.map((k) => ({
    etiket: t(`roi.kalem.${k.botClass}`),
    deger: k.onlenenMaliyet,
    renk: botSinifGorsel(k.botClass).renk,
  }));

  function raporIndir() {
    const s: string[] = [];
    s.push("=".repeat(64));
    s.push("  " + t("roi.rapor.baslik"));
    s.push("=".repeat(64));
    s.push(`  ${t("roi.rapor.plan")}: ${planAd} (${planFiyat})`);
    s.push("");
    s.push(`  ${t("roi.rapor.toplamBot")}: ${sayi(roi.toplamEngellenen)}`);
    s.push(`  ${t("roi.rapor.onlenen")}: ${tl(roi.toplamOnlenenMaliyet)}`);
    s.push(`  ${t("roi.rapor.ucret")}: ${tl(roi.specterMaliyet)}`);
    s.push(`  ${t("roi.rapor.net")}: ${tl(roi.netKazanc)}`);
    s.push(`  ${t("roi.rapor.roi")}: ${roi.ucretsizMi ? t("roi.rapor.ucretsiz") : roi.roiCarpani + "x (%" + roi.roiYuzde + ")"}`);
    s.push(`  ${t("roi.rapor.yillik")}: ${tl(yillikNet)}`);
    s.push("");
    s.push("  " + t("roi.rapor.dokum"));
    for (const k of roi.kalemler) {
      s.push(`    ${t(`roi.kalem.${k.botClass}`)}: ${sayi(k.engellenen)} × ₺${k.birim} = ${tl(k.onlenenMaliyet)}`);
      s.push(`      (${t(`roi.kalemAci.${k.botClass}`)})`);
    }
    s.push("");
    s.push("  " + t("roi.rapor.notSatir"));
    const blob = new Blob(["﻿" + s.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = t("roi.rapor.dosya"); a.click();
    URL.revokeObjectURL(url);
    goster({ tip: "basari", baslik: t("roi.toast.indi") });
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* kahraman ROI kartı — büyük para + ROI gauge */}
      <motion.div
        initial={{ y: 10 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden rounded-[28px] border border-brand-100 bg-gradient-to-br from-brand-50 via-surface to-ok-soft/30 p-6 lg:p-8"
      >
        <div className="grid gap-8 lg:grid-cols-[1.4fr_auto_1fr] lg:items-center">
          {/* sol: net kazanç büyük para */}
          <div>
            <div className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-brand-700">
              <Sparkles className="size-4" /> {t("roi.kahraman.ustbaslik")}
            </div>
            <div className="mt-2 num text-[52px] font-bold leading-none tracking-tight text-slate-ink">{tl(roi.netKazanc)}</div>
            <div className="mt-2 text-[14px] text-slate-muted" dangerouslySetInnerHTML={{ __html: t("roi.kahraman.altbaslik").replace("{n}", sayi(roi.toplamEngellenen)) }} />
            {/* yıllık + geri ödeme mini-metrikler */}
            <div className="mt-5 flex flex-wrap gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-surface/70 px-3 py-1.5 text-[12.5px] font-medium text-brand-700">
                <TrendingUp className="size-3.5" /> {t("roi.kahraman.yillik")}: <b className="num">{tl(yillikNet)}</b>
              </span>
              {!roi.ucretsizMi && geriOdemeGun > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-ok/20 bg-ok-soft/50 px-3 py-1.5 text-[12.5px] font-medium text-green-700">
                  <CalendarClock className="size-3.5" /> {t("roi.kahraman.geriOdeme")}: <b className="num">{geriOdemeGun} {t("roi.kahraman.gun")}</b>
                </span>
              )}
            </div>
          </div>

          <div className="hidden h-28 w-px bg-brand-100 lg:block" />

          {/* sağ: ROI gauge */}
          <div className="flex flex-col items-center">
            <Gauge
              deger={roiGaugeDeger}
              boyut={196}
              renk="#16a34a"
            />
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="num text-[22px] font-bold text-ok">{roi.ucretsizMi ? "∞" : roi.roiCarpani + "×"}</span>
              <span className="text-[11px] font-medium uppercase tracking-wide text-slate-faint">{t("roi.kahraman.roiCarpani")}</span>
            </div>
            {!roi.ucretsizMi && (
              <span className="mt-0.5 text-[11px] text-slate-muted">%{sayi(roi.roiYuzde)} {t("roi.kahraman.getiriYuzde")}</span>
            )}
          </div>
        </div>
      </motion.div>

      {/* özet kartlar */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={tl(roi.toplamOnlenenMaliyet)} etiket={t("roi.kpi.onlenen")} ikon={<ShieldCheck className="size-5" />} tone="ok" />
        <StatKart sayi={sayi(roi.toplamEngellenen)} etiket={t("roi.kpi.engellenen")} ikon={<Ban className="size-5" />} tone="danger" />
        <StatKart sayi={roi.ucretsizMi ? "₺0" : planFiyat} etiket={t("roi.kpi.ucret").replace("{plan}", planAd)} ikon={<Wallet className="size-5" />} />
        <StatKart sayi={tl(roi.ortDeger)} etiket={t("roi.kpi.ortDeger")} ikon={<Coins className="size-5" />} tone="brand" />
      </div>

      {/* "Veylify olmasa vs ile" önce/sonra karşılaştırma akışı */}
      <Panel baslik={<span className="flex items-center gap-2"><GaugeGost className="size-4 text-brand-600" /> {t("roi.karsilastir.baslik")}</span>}>
        <div className="grid items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
          {/* olmasa */}
          <motion.div
            initial={{ y: 8 }} animate={{ y: 0 }} transition={{ duration: 0.35 }}
            className="flex flex-col justify-between rounded-2xl border border-danger2/20 bg-danger-soft/30 p-5"
          >
            <div>
              <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-danger2"><Ban className="size-3.5" /> {t("roi.karsilastir.olmasa")}</div>
              <div className="mt-2 num text-[30px] font-bold leading-none text-danger2">{tl(roi.toplamOnlenenMaliyet)}</div>
              <p className="mt-1.5 text-[12px] text-slate-muted">{t("roi.karsilastir.olmasa.alt")}</p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[11.5px] text-red-700">
              <span className="inline-block size-1.5 rounded-full bg-danger2" /> {sayi(roi.toplamEngellenen)} {t("roi.karsilastir.botAkin")}
            </div>
          </motion.div>

          {/* ok: ücret çıkarılır */}
          <div className="flex flex-col items-center justify-center gap-1 py-2 lg:py-0">
            <span className="grid size-9 place-items-center rounded-full border border-line bg-surface text-slate-muted shadow-card"><ArrowRight className="size-4" /></span>
            <span className="text-[10.5px] font-medium text-slate-faint">− {roi.ucretsizMi ? "₺0" : tl(roi.specterMaliyet)}</span>
          </div>

          {/* ile */}
          <motion.div
            initial={{ y: 8 }} animate={{ y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}
            className="flex flex-col justify-between rounded-2xl border border-line bg-canvas/50 p-5"
          >
            <div>
              <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-slate-muted"><Wallet className="size-3.5" /> {t("roi.karsilastir.ucret")}</div>
              <div className="mt-2 num text-[30px] font-bold leading-none text-slate-ink">{roi.ucretsizMi ? "₺0" : tl(roi.specterMaliyet)}</div>
              <p className="mt-1.5 text-[12px] text-slate-muted">{t("roi.karsilastir.ucret.alt").replace("{plan}", planAd)}</p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[11.5px] text-slate-muted">
              <span className="inline-block size-1.5 rounded-full bg-slate-400" /> {t("roi.karsilastir.sabitMaliyet")}
            </div>
          </motion.div>

          {/* eşittir */}
          <div className="flex flex-col items-center justify-center gap-1 py-2 lg:py-0">
            <span className="grid size-9 place-items-center rounded-full border border-ok/30 bg-ok-soft text-ok shadow-card text-[18px] font-bold leading-none">=</span>
            <span className="text-[10.5px] font-medium text-slate-faint">{t("roi.karsilastir.netKazanc")}</span>
          </div>

          {/* net */}
          <motion.div
            initial={{ y: 8 }} animate={{ y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}
            className="flex flex-col justify-between rounded-2xl border border-ok/25 bg-gradient-to-br from-ok-soft to-ok-soft/40 p-5"
          >
            <div>
              <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-ok"><Sparkles className="size-3.5" /> {t("roi.karsilastir.net")}</div>
              <div className="mt-2 num text-[30px] font-bold leading-none text-ok">{tl(roi.netKazanc)}</div>
              <p className="mt-1.5 text-[12px] text-slate-muted">{t("roi.karsilastir.net.alt")}</p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[11.5px] text-green-700">
              <ArrowUpRight className="size-3.5" /> {roi.ucretsizMi ? "∞" : roi.roiCarpani + "×"} {t("roi.karsilastir.getiri")}
            </div>
          </motion.div>
        </div>
      </Panel>

      {/* maliyet kırılımı DONUT (saldırı türüne göre) + aylık tasarruf trendi */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        <Panel baslik={<span className="flex items-center gap-2"><Layers className="size-4 text-brand-600" /> {t("roi.donut.baslik")}</span>}>
          {donutSegmentler.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-muted">{t("roi.dokum.bos")}</p>
          ) : (
            <>
              <DonutDagilim segmentler={donutSegmentler} merkezEtiket={t("roi.donut.merkez")} />
              <p className="mt-4 text-[12px] text-slate-faint">{t("roi.donut.aciklama")}</p>
            </>
          )}
        </Panel>

        <Panel baslik={t("roi.trend.baslik")}>
          <TrendGrafik noktalar={trendDeger} etiketler={trendEtiket} renk="#16a34a" yukseklik={220} />
          <div className="mt-3 flex items-center justify-between text-[12px] text-slate-muted">
            <span>{t("roi.trend.toplam")} <b className="num text-slate-ink">{tl(trendDeger.reduce((a, b) => a + b, 0))}</b></span>
            <span className="flex items-center gap-1 text-ok"><ArrowUpRight className="size-3.5" /> {t("roi.trend.tasarruf")}</span>
          </div>
        </Panel>
      </div>

      {/* sınıf başına tasarruf kartları (döküm + bar) */}
      <Panel baslik={t("roi.dokum.baslik")} sagUst={<Button variant="outline" size="sm" onClick={raporIndir}><Download className="size-4" /> {t("roi.dokum.rapor")}</Button>}>
        {roi.kalemler.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-muted">{t("roi.dokum.bos")}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {roi.kalemler.map((k, i) => {
              const g = botSinifGorsel(k.botClass);
              const Ikon = g.ikon;
              const pay = roi.toplamOnlenenMaliyet > 0 ? Math.round((k.onlenenMaliyet / roi.toplamOnlenenMaliyet) * 100) : 0;
              return (
                <motion.div
                  key={k.botClass}
                  initial={{ y: 8 }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className="rounded-2xl border border-line bg-surface p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl" style={{ background: g.soft, color: g.renk }}>
                        <Ikon className="size-[18px]" strokeWidth={2.2} />
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-[14px] font-semibold text-slate-ink" title={t(`roi.kalemAci.${k.botClass}`)}>{t(`roi.kalem.${k.botClass}`)}</div>
                        <div className="text-[11.5px] text-slate-faint">{sayi(k.engellenen)} × ₺{k.birim}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="num text-[17px] font-bold leading-none text-slate-ink">{tl(k.onlenenMaliyet)}</div>
                      <div className="mt-0.5 text-[11px] text-slate-faint">%{pay}</div>
                    </div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-canvas">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: g.renk }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(k.onlenenMaliyet / maxKalem) * 100}%` }}
                      transition={{ duration: 0.7, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* yöntem notu */}
      <div className={cn("flex items-start gap-2.5 rounded-2xl border border-line bg-canvas/40 px-5 py-4 text-[13px] text-slate-muted")}>
        <Info className="mt-0.5 size-4 shrink-0 text-brand-600" />
        <span dangerouslySetInnerHTML={{ __html: t("roi.not") }} />
      </div>
    </div>
  );
}
