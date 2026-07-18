"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Coins, TrendingDown, ShieldCheck, Ban, Info, DollarSign, Scale,
  ArrowRight, Skull, Target, Eraser, BarChart3, PieChart,
} from "lucide-react";
import Link from "next/link";
import { Panel, StatKart, Badge } from "@/components/panel/kit";
import { DonutDagilim } from "@/components/panel/grafikler";
import { Gauge } from "@/components/panel/grafikler-ek";
import { botSinifGorsel } from "@/components/panel/bot-sinif-gorsel";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import type { BotEkonomiRaporu, SinifEkonomiSonuc } from "@/lib/specter/bot-ekonomi";
import { botEkonomiCeviri } from "./bot-ekonomi.i18n";

/** Dil → BCP-47 yerel etiketi (sayı biçimleme için). */
const BCP47: Record<Dil, string> = { tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES" };

const usd = (n: number) => {
  if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  if (Math.abs(n) >= 1) return `$${n.toFixed(0)}`;
  return `$${n.toFixed(2)}`;
};

export function BotEkonomiIstemci({ rapor, olaySayisi, dil }: { rapor: BotEkonomiRaporu; olaySayisi: number; dil: Dil }) {
  const { siniflar, ozet } = rapor;
  const azalt = useReducedMotion();
  const bos = siniflar.length === 0;
  const t = (k: string) => botEkonomiCeviri(k, dil);
  const loc = BCP47[dil];
  const sayi = (n: number) => n.toLocaleString(loc);

  // Caydırıcılık gauge — kaç sınıf kârsız kılındı (yüzde).
  const caydirGauge = ozet.toplamSinif > 0 ? (ozet.caydirilanSinif / ozet.toplamSinif) * 100 : 0;
  // Silinen kâr yüzdesi (ham kârın ne kadarı silindi).
  const silinenYuzde = ozet.hamToplamKar > 0 ? Math.max(0, Math.min(100, Math.round((ozet.silinenKar / ozet.hamToplamKar) * 100))) : 0;

  // Saldırı türü ROI donut — ham kâra göre saldırgan kâr havuzu.
  const donutSegmentler = siniflar
    .filter((s) => s.hamKar > 0)
    .map((s) => ({
      etiket: t(`eko.ad.${s.eko.botClass}`),
      deger: Math.round(s.hamKar),
      renk: botSinifGorsel(s.eko.botClass).renk,
    }));

  // Dikey bar için ortak max (korumasız kâr ölçeği).
  const barMax = Math.max(1, ...siniflar.map((s) => Math.max(s.hamKar, 0)));

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-8 pb-10 lg:px-10">
      {/* açıklama */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Coins className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-ink">{t("eko.serit.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted" dangerouslySetInnerHTML={{ __html: t("eko.serit.aciklama") }} />
        </div>
      </div>

      {bos ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-canvas/30 px-6 py-16 text-center">
          <Coins className="size-10 text-slate-faint" />
          <p className="mt-3 text-[15px] font-semibold text-slate-ink">{t("eko.bos.baslik")}</p>
          <p className="mt-1 max-w-md text-[13px] text-slate-muted">{t("eko.bos.aciklama").replace("{n}", sayi(olaySayisi))}</p>
        </div>
      ) : (
        <>
          {/* özet */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatKart sayi={usd(ozet.silinenKar)} etiket={t("eko.kpi.silinenKar")} ikon={<TrendingDown className="size-5" />} tone="ok" />
            <StatKart sayi={`${ozet.caydirilanSinif}/${ozet.toplamSinif}`} etiket={t("eko.kpi.caydirilan")} ikon={<ShieldCheck className="size-5" />} tone={ozet.caydirilanSinif === ozet.toplamSinif ? "ok" : "warn"} />
            <StatKart sayi={`${ozet.ortMaliyetArtis}×`} etiket={t("eko.kpi.ortArtis")} ikon={<Scale className="size-5" />} tone="brand" />
            <StatKart sayi={usd(ozet.korumaToplamKar)} etiket={t("eko.kpi.kalanKar")} ikon={<DollarSign className="size-5" />} tone={ozet.korumaToplamKar <= 0 ? "ok" : "warn"} />
          </div>

          {/* kâr-silme akış kartı: ham kâr → koruma → silinen kâr */}
          <Panel baslik={<span className="flex items-center gap-2"><Eraser className="size-4 text-brand-600" /> {t("eko.akis.baslik")}</span>}>
            <div className="grid items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
              {/* ham kâr */}
              <motion.div
                initial={azalt ? false : { y: 8 }} animate={{ y: 0 }} transition={{ duration: 0.35 }}
                className="flex flex-col justify-between rounded-2xl border border-danger2/20 bg-danger-soft/30 p-5"
              >
                <div>
                  <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-red-700"><Skull className="size-3.5" /> {t("eko.akis.ham")}</div>
                  <div className="num mt-2 text-[32px] font-bold leading-none text-danger2">{usd(ozet.hamToplamKar)}</div>
                  <p className="mt-1.5 text-[12px] text-slate-muted">{t("eko.akis.ham.alt")}</p>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-[11.5px] text-red-700">
                  <span className="inline-block size-1.5 rounded-full bg-danger2" /> {sayi(ozet.toplamIstek)} {t("eko.akis.istek")}
                </div>
              </motion.div>

              {/* ok: koruma uygulanır */}
              <div className="flex flex-col items-center justify-center gap-1 py-2 lg:py-0">
                <span className="grid size-9 place-items-center rounded-full border border-brand-100 bg-brand-50 text-brand-600 shadow-card"><ShieldCheck className="size-4" /></span>
                <span className="text-center text-[10.5px] font-medium text-slate-faint">{ozet.ortMaliyetArtis}× {t("eko.akis.maliyet")}</span>
              </div>

              {/* silinen kâr */}
              <motion.div
                initial={azalt ? false : { y: 8 }} animate={{ y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}
                className="flex flex-col justify-between rounded-2xl border border-ok/25 bg-gradient-to-br from-ok-soft to-ok-soft/40 p-5"
              >
                <div>
                  <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-ok"><Eraser className="size-3.5" /> {t("eko.akis.silinen")}</div>
                  <div className="num mt-2 text-[32px] font-bold leading-none text-ok">{usd(ozet.silinenKar)}</div>
                  <p className="mt-1.5 text-[12px] text-slate-muted">%{silinenYuzde} {t("eko.akis.silinen.alt")}</p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface/70">
                  <motion.div
                    className="h-full rounded-full bg-ok"
                    initial={azalt ? false : { width: 0 }}
                    animate={{ width: `${silinenYuzde}%` }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </motion.div>

              {/* eşittir */}
              <div className="flex flex-col items-center justify-center gap-1 py-2 lg:py-0">
                <span className="grid size-9 place-items-center rounded-full border border-line bg-surface text-slate-muted shadow-card"><ArrowRight className="size-4" /></span>
                <span className="text-center text-[10.5px] font-medium text-slate-faint">{t("eko.akis.kalan")}</span>
              </div>

              {/* kalan kâr */}
              <motion.div
                initial={azalt ? false : { y: 8 }} animate={{ y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}
                className={cn("flex flex-col justify-between rounded-2xl border p-5", ozet.korumaToplamKar <= 0 ? "border-ok/25 bg-surface" : "border-warn/30 bg-warn-soft/20")}
              >
                <div>
                  <div className={cn("flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide", ozet.korumaToplamKar <= 0 ? "text-ok" : "text-warn")}><DollarSign className="size-3.5" /> {t("eko.akis.kalanKar")}</div>
                  <div className={cn("num mt-2 text-[32px] font-bold leading-none", ozet.korumaToplamKar <= 0 ? "text-ok" : "text-warn")}>{usd(ozet.korumaToplamKar)}</div>
                  <p className="mt-1.5 text-[12px] text-slate-muted">{ozet.korumaToplamKar <= 0 ? t("eko.akis.kalanKar.karsiz") : t("eko.akis.kalanKar.marjinal")}</p>
                </div>
                <div className={cn("mt-4 flex items-center gap-1.5 text-[11.5px]", ozet.korumaToplamKar <= 0 ? "text-green-700" : "text-amber-700")}>
                  <Ban className="size-3.5" /> {ozet.caydirilanSinif}/{ozet.toplamSinif} {t("eko.akis.caydirildi")}
                </div>
              </motion.div>
            </div>
          </Panel>

          {/* caydırıcılık dikey barlar + gauge/donut */}
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            {/* dikey ikili barlar: sınıf başına korumasız vs Veylify ile kâr */}
            <Panel baslik={<span className="flex items-center gap-2"><BarChart3 className="size-4 text-brand-600" /> {t("eko.dikey.baslik")}</span>}>
              <div className="flex items-end gap-4 overflow-hidden pt-2" style={{ height: 220 }}>
                {siniflar.map((s, i) => {
                  const g = botSinifGorsel(s.eko.botClass);
                  const hamH = Math.max(2, (Math.max(s.hamKar, 0) / barMax) * 100);
                  const korH = Math.max(s.korumaKar > 0 ? (s.korumaKar / barMax) * 100 : 1.5, s.korumaKar > 0 ? 2 : 1.5);
                  return (
                    <div key={s.eko.botClass} className="group flex flex-1 flex-col items-center justify-end gap-2" style={{ height: "100%" }}>
                      <div className="relative flex w-full flex-1 items-end justify-center gap-1.5">
                        {/* korumasız (kırmızı, dolu) */}
                        <div className="relative flex h-full w-1/2 max-w-[26px] items-end justify-center">
                          <motion.div
                            className="w-full rounded-t-md"
                            style={{ background: g.renk, opacity: 0.9 }}
                            initial={azalt ? false : { height: 0 }}
                            animate={{ height: `${hamH}%` }}
                            transition={{ duration: 0.7, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                            title={`${t(`eko.ad.${s.eko.botClass}`)} · ${t("eko.dikey.korumasiz")}: ${usd(s.hamKar)}`}
                          />
                        </div>
                        {/* Veylify ile (yeşil/gri, düşük) */}
                        <div className="relative flex h-full w-1/2 max-w-[26px] items-end justify-center">
                          <motion.div
                            className="w-full rounded-t-md"
                            style={{ background: s.caydirildi ? "#c9c4b6" : "#d97706", opacity: s.caydirildi ? 0.7 : 0.9 }}
                            initial={azalt ? false : { height: 0 }}
                            animate={{ height: `${korH}%` }}
                            transition={{ duration: 0.7, delay: i * 0.05 + 0.08, ease: [0.16, 1, 0.3, 1] }}
                            title={`${t(`eko.ad.${s.eko.botClass}`)} · ${t("eko.dikey.ile")}: ${usd(s.korumaKar)}`}
                          />
                        </div>
                      </div>
                      <span className="max-w-full truncate text-center text-[10px] font-medium text-slate-faint" title={t(`eko.ad.${s.eko.botClass}`)}>{t(`eko.ad.${s.eko.botClass}`)}</span>
                    </div>
                  );
                })}
              </div>
              {/* legend */}
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-3 text-[11.5px]">
                <span className="flex items-center gap-1.5 text-slate-muted"><span className="size-2.5 rounded-sm bg-danger2/90" /> {t("eko.dikey.korumasiz")}</span>
                <span className="flex items-center gap-1.5 text-slate-muted"><span className="size-2.5 rounded-sm bg-[#d97706]/90" /> {t("eko.dikey.marjinalKalan")}</span>
                <span className="flex items-center gap-1.5 text-slate-muted"><span className="size-2.5 rounded-sm bg-[#c9c4b6]" /> {t("eko.dikey.caydirilan")}</span>
              </div>
            </Panel>

            {/* caydırıcılık gauge + saldırı türü ROI donut */}
            <div className="grid gap-6">
              <Panel baslik={t("eko.gauge.baslik")}>
                <div className="flex flex-col items-center py-2">
                  <Gauge deger={caydirGauge} boyut={180} renk="#16a34a" />
                  <p className="mt-1 text-center text-[12px] text-slate-muted">
                    <b className="num text-slate-ink">{ozet.caydirilanSinif}/{ozet.toplamSinif}</b> {t("eko.gauge.alt")}
                  </p>
                </div>
              </Panel>
              <Panel baslik={<span className="flex items-center gap-2"><PieChart className="size-4 text-brand-600" /> {t("eko.donut.baslik")}</span>}>
                {donutSegmentler.length === 0 ? (
                  <p className="py-6 text-center text-[13px] text-slate-muted">{t("eko.donut.bos")}</p>
                ) : (
                  <DonutDagilim segmentler={donutSegmentler} merkezEtiket={t("eko.donut.merkez")} />
                )}
              </Panel>
            </div>
          </div>

          {/* önce/sonra kâr bandı */}
          <Panel baslik={t("eko.band.baslik")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-danger2/25 bg-danger-soft/30 px-5 py-4">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-red-700"><Skull className="size-4" /> {t("eko.band.yokken")}</div>
                <p className="num mt-2 text-[32px] font-bold leading-none text-danger2">{usd(ozet.hamToplamKar)}</p>
                <p className="mt-1 text-[12px] text-slate-muted">{t("eko.band.yokken.aciklama")}</p>
              </div>
              <div className="rounded-2xl border border-ok/25 bg-ok-soft/40 px-5 py-4">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-green-700"><ShieldCheck className="size-4" /> {t("eko.band.varken")}</div>
                <p className={cn("num mt-2 text-[32px] font-bold leading-none", ozet.korumaToplamKar <= 0 ? "text-ok" : "text-warn")}>{usd(ozet.korumaToplamKar)}</p>
                <p className="mt-1 text-[12px] text-slate-muted">{ozet.korumaToplamKar <= 0 ? t("eko.band.varken.karsiz") : t("eko.band.varken.marjinal")}</p>
              </div>
            </div>
          </Panel>

          {/* sınıf bazında ekonomi */}
          <div className="space-y-4">
            {siniflar.map((s, i) => (
              <motion.div
                key={s.eko.botClass}
                initial={azalt ? false : { y: 8 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
              >
                <SinifKart s={s} t={t} sayi={sayi} />
              </motion.div>
            ))}
          </div>

          {/* eylem bandı */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] bg-ink-900 px-8 py-6">
            <div className="max-w-xl">
              <h3 className="flex items-center gap-2 text-[16px] font-semibold text-white"><Target className="size-5 text-ok" /> {t("eko.eylem.baslik")}</h3>
              <p className="mt-1 text-[13px] text-white/60" dangerouslySetInnerHTML={{ __html: t("eko.eylem.aciklama") }} />
            </div>
            <Link href="/panel/oto-duzeltme" className="flex items-center gap-1 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-ink-900">{t("eko.eylem.buton")} <ArrowRight className="size-3.5" /></Link>
          </div>
        </>
      )}

      {/* yöntem notu */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-canvas/40 px-5 py-4 text-[13px] text-slate-muted">
        <Info className="mt-0.5 size-4 shrink-0 text-brand-600" />
        <span dangerouslySetInnerHTML={{ __html: t("eko.not").replace("{n}", sayi(olaySayisi)) }} />
      </div>
    </div>
  );
}

function SinifKart({ s, t, sayi }: { s: SinifEkonomiSonuc; t: (k: string) => string; sayi: (n: number) => string }) {
  const e = s.eko;
  const g = botSinifGorsel(e.botClass);
  const Ikon = g.ikon;
  return (
    <div className={cn("rounded-2xl border px-5 py-4", s.caydirildi ? "border-ok/25 bg-surface" : "border-warn/30 bg-warn-soft/20")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl" style={{ background: g.soft, color: g.renk }}>
            <Ikon className="size-5" strokeWidth={2.2} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-semibold text-slate-ink">{t(`eko.ad.${e.botClass}`)}</span>
              {s.caydirildi
                ? <Badge ton="yesil"><Ban className="size-3" /> {t("eko.sinif.caydirildi")}</Badge>
                : <Badge ton="sari">{t("eko.sinif.marjinal")}</Badge>}
            </div>
            <p className="mt-0.5 text-[12px] text-slate-faint">{t(`eko.amac.${e.botClass}`)} · {sayi(s.istekSayisi)} {t("eko.sinif.istek")}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="num text-[22px] font-bold leading-none text-slate-ink">{s.maliyetArtisCarpani}×</div>
          <div className="text-[11px] text-slate-faint">{t("eko.sinif.artis")}</div>
        </div>
      </div>

      {/* önce/sonra kâr çubukları */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <EkonomiKolon
          baslik={t("eko.kol.yoksuz")} ton="kotu" t={t} sayi={sayi}
          maliyet={s.hamMaliyet} basari={s.hamBasari} getiri={s.hamGetiri} kar={s.hamKar} roi={s.hamRoi}
        />
        <EkonomiKolon
          baslik={t("eko.kol.varsul")} ton={s.caydirildi ? "iyi" : "orta"} t={t} sayi={sayi}
          maliyet={s.korumaMaliyet} basari={s.korumaBasari} getiri={s.korumaGetiri} kar={s.korumaKar} roi={s.korumaRoi}
        />
      </div>
    </div>
  );
}

function EkonomiKolon({
  baslik, ton, maliyet, basari, getiri, kar, roi, t, sayi,
}: {
  baslik: string; ton: "kotu" | "orta" | "iyi";
  maliyet: number; basari: number; getiri: number; kar: number; roi: number;
  t: (k: string) => string; sayi: (n: number) => string;
}) {
  const renk = ton === "kotu" ? "text-danger2" : ton === "iyi" ? "text-ok" : "text-warn";
  const zemin = ton === "kotu" ? "bg-danger-soft/30" : ton === "iyi" ? "bg-ok-soft/40" : "bg-warn-soft/25";
  return (
    <div className={cn("rounded-xl px-4 py-3", zemin)}>
      <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-slate-muted">{baslik}</div>
      <div className="grid grid-cols-2 gap-y-1.5 text-[12.5px]">
        <span className="text-slate-muted">{t("eko.kol.altyapi")}</span>
        <span className="num text-right font-medium text-slate-ink">{usd(maliyet)}</span>
        <span className="text-slate-muted">{t("eko.kol.basari")}</span>
        <span className="num text-right font-medium text-slate-ink">{sayi(basari)}</span>
        <span className="text-slate-muted">{t("eko.kol.getiri")}</span>
        <span className="num text-right font-medium text-slate-ink">{usd(getiri)}</span>
        <span className="border-t border-line/60 pt-1 font-semibold text-slate-ink">{t("eko.kol.netKar")}</span>
        <span className={cn("num border-t border-line/60 pt-1 text-right font-bold", renk)}>{usd(kar)}</span>
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-line/60 pt-2 text-[11.5px]">
        <span className="text-slate-faint">{t("eko.kol.roi")}</span>
        <span className={cn("num font-semibold", renk)}>{kar <= 0 ? t("eko.kol.negatif") : `${roi.toFixed(1)}×`}</span>
      </div>
    </div>
  );
}
