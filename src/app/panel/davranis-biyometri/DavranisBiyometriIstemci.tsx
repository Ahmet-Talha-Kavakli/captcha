"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Fingerprint, User, Bot, HelpCircle, Info, MousePointer2, Keyboard,
  Activity, Gauge, Waves,
} from "lucide-react";
import { Panel, Badge } from "@/components/panel/kit";
import { cn } from "@/lib/cn";
import {
  biyometriAnaliz, ornekSinyal, SINIF_RENK,
  type OrnekTur, type BiyometriSonuc, type DavranisSinyal,
} from "@/lib/specter/davranis-biyometri";
import type { Dil } from "@/lib/i18n/panel";
import { biyometriCeviri, OZELLIK_ID } from "./davranis-biyometri.i18n";

/** Dil → BCP-47 yerel etiketi (Intl sayı biçimlendirme için). */
const YEREL: Record<Dil, string> = { tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES" };

const ORNEK_TURLER: { tur: OrnekTur; ikon: React.ReactNode }[] = [
  { tur: "insan", ikon: <User className="size-4" /> },
  { tur: "mobil-insan", ikon: <User className="size-4" /> },
  { tur: "script-bot", ikon: <Bot className="size-4" /> },
  { tur: "gurultu-bot", ikon: <Bot className="size-4" /> },
];

export function DavranisBiyometriIstemci({ dil }: { dil: Dil }) {
  const [tur, setTur] = useState<OrnekTur>("insan");
  const azalt = useReducedMotion();
  const t = (k: string) => biyometriCeviri(k, dil);
  const yerel = YEREL[dil];

  // Lib TR özellik `ad`'ını (stabil id) çeviriye eşle; lib düzenlenmez.
  const ozellikAd = (libAd: string) => {
    const id = OZELLIK_ID[libAd];
    return id ? t(`ozellik.${id}.ad`) : libAd;
  };
  const ozellikAciklama = (libAd: string, libFallback: string) => {
    const id = OZELLIK_ID[libAd];
    return id ? t(`ozellik.${id}.aciklama`) : libFallback;
  };
  // band: sayısal aralık VERİDİR; yalnızca metinsel band'lar çevrilir.
  const ozellikBand = (libAd: string, libBand: string) => {
    const id = OZELLIK_ID[libAd];
    const anahtar = `ozellik.${id}.band`;
    const cev = t(anahtar);
    return cev === anahtar ? libBand : cev; // sözlükte metinsel band yoksa lib'in sayısal band'ını koru
  };
  // sınıf enum → çeviri
  const sinifEt = (s: BiyometriSonuc["sinif"]) => t(`sinif.${s}`);

  const sinyal = useMemo<DavranisSinyal>(() => ornekSinyal(tur), [tur]);
  const sonuc = useMemo(() => biyometriAnaliz(sinyal), [sinyal]);
  const skorYuzde = Math.round(sonuc.insanlikSkoru * 100);
  const renk = SINIF_RENK[sonuc.sinif];

  // gerekçe cümlesini lib TR yerine sinif+zayıfSinyal+insanımsılıktan yeniden kur.
  const zayifKatki = sonuc.katkilar.find((k) => k.ad === sonuc.zayifSinyal);
  const gerekce =
    sonuc.sinif === "insan"
      ? t("gerekce.insan")
      : sonuc.sinif === "bot"
        ? t("gerekce.bot")
            .replace("{ad}", ozellikAd(sonuc.zayifSinyal))
            .replace("{deger}", String((zayifKatki?.insanimsilik ?? 0)))
            .replace("{ek}", (zayifKatki?.insanimsilik ?? 1) < 0.2 ? t("gerekce.bot.asiri") : t("gerekce.bot.sapma"))
        : t("gerekce.supheli").replace("{ad}", ozellikAd(sonuc.zayifSinyal));

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-8 pb-10 lg:px-10">
      {/* açıklama */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Fingerprint className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-ink">{t("aciklama.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {t("aciklama.metin1")}<b>{t("aciklama.vurgu1")}</b>{t("aciklama.metin2")}<b>{t("aciklama.vurgu2")}</b>{t("aciklama.metin3")}<b>{t("aciklama.vurgu3")}</b>{t("aciklama.metin4")}
          </p>
        </div>
      </div>

      {/* örnek seçici */}
      <div className="flex flex-wrap gap-2">
        {ORNEK_TURLER.map((o) => (
          <button
            key={o.tur}
            onClick={() => setTur(o.tur)}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-left transition",
              tur === o.tur ? "border-brand-400 bg-brand-50 ring-1 ring-brand-200" : "border-line bg-surface hover:border-line-strong",
            )}
          >
            <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", tur === o.tur ? "bg-brand-100 text-brand-700" : "bg-canvas text-slate-muted")}>{o.ikon}</span>
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold text-slate-ink">{t(`ornek.${o.tur}.ad`)}</span>
              <span className="block text-[11px] text-slate-faint">{t(`ornek.${o.tur}.not`)}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
        {/* skor kartı */}
        <div className="space-y-4">
          <Panel baslik={t("skor.baslik")}>
            <div className="flex flex-col items-center py-2">
              <div className="relative grid size-40 place-items-center">
                <svg viewBox="0 0 120 120" className="size-40 -rotate-90">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#eee7d8" strokeWidth="12" />
                  <motion.circle
                    cx="60" cy="60" r="52" fill="none" stroke={renk} strokeWidth="12" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 52}
                    initial={azalt ? false : { strokeDashoffset: 2 * Math.PI * 52 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - sonuc.insanlikSkoru) }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="num text-[38px] font-bold leading-none" style={{ color: renk }}>{skorYuzde}</span>
                  <span className="text-[11px] text-slate-faint">/ 100</span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                {sonuc.sinif === "insan" ? <User className="size-4 text-ok" /> : sonuc.sinif === "bot" ? <Bot className="size-4 text-danger2" /> : <HelpCircle className="size-4 text-warn" />}
                <Badge ton={sonuc.sinif === "insan" ? "yesil" : sonuc.sinif === "bot" ? "kirmizi" : "sari"}>{sinifEt(sonuc.sinif)}</Badge>
              </div>
              <p className="mt-3 text-center text-[12.5px] leading-relaxed text-slate-muted">{gerekce}</p>
            </div>
          </Panel>

          <div className="rounded-2xl border border-line bg-canvas/40 px-4 py-3.5">
            <div className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-slate-muted">
              <Activity className="size-3.5" /> {t("skor.zayifBaslik")}
            </div>
            <p className="text-[13px] font-semibold text-slate-ink">{ozellikAd(sonuc.zayifSinyal)}</p>
            <p className="mt-0.5 text-[12px] text-slate-faint">{t("skor.zayifNot")}</p>
          </div>
        </div>

        {/* özellik katkıları */}
        <Panel baslik={t("katki.baslik")}>
          <p className="mb-4 text-[13px] text-slate-muted">{t("katki.aciklama")}</p>
          <div className="space-y-3.5">
            {sonuc.katkilar.map((k, i) => (
              <motion.div
                key={k.ad}
                initial={azalt ? false : { opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-[13px] font-medium text-slate-ink">
                    {ikonFor(k.ad)}
                    {ozellikAd(k.ad)}
                  </span>
                  <span className="flex items-center gap-2 text-[12px]">
                    <span className="num text-slate-faint">{t("katki.deger")} {k.deger.toLocaleString(yerel)}</span>
                    <span className="num w-9 text-right font-semibold" style={{ color: skorRenk(k.insanimsilik) }}>{Math.round(k.insanimsilik * 100)}</span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-canvas">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: skorRenk(k.insanimsilik) }}
                    initial={azalt ? false : { width: 0 }}
                    animate={{ width: `${k.insanimsilik * 100}%` }}
                    transition={{ duration: 0.6, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <p className="mt-1 text-[11.5px] text-slate-faint">{ozellikAciklama(k.ad, k.aciklama)} <span className="text-slate-muted">· {t("katki.insanBandi")} {ozellikBand(k.ad, k.band)}</span></p>
              </motion.div>
            ))}
          </div>
        </Panel>
      </div>

      {/* ham sinyal görselleştirme */}
      <Panel baslik={t("ham.baslik")}>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <SinyalGrafik baslik={t("ham.dwell")} ikon={<Keyboard className="size-3.5" />} veri={sinyal.dwell} renk="#2563eb" birim="ms" t={t} yerel={yerel} />
          <SinyalGrafik baslik={t("ham.flight")} ikon={<Keyboard className="size-3.5" />} veri={sinyal.flight} renk="#7c3aed" birim="ms" t={t} yerel={yerel} />
          <SinyalGrafik baslik={t("ham.fareHiz")} ikon={<MousePointer2 className="size-3.5" />} veri={sinyal.fareHiz} renk="#0891b2" birim="px/ms" t={t} yerel={yerel} />
          {sinyal.basinc && <SinyalGrafik baslik={t("ham.basinc")} ikon={<Waves className="size-3.5" />} veri={sinyal.basinc} renk="#16a34a" birim="" t={t} yerel={yerel} />}
        </div>
      </Panel>

      {/* yöntem notu */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-canvas/40 px-5 py-4 text-[13px] text-slate-muted">
        <Info className="mt-0.5 size-4 shrink-0 text-brand-600" />
        <span>{t("not.metin1")}<b>{t("not.vurgu1")}</b>{t("not.metin2")}<b>{t("not.vurgu2")}</b>{t("not.metin3")}<b>{t("not.vurgu3")}</b>{t("not.metin4")}<b>{t("not.vurgu4")}</b>{t("not.metin5")}<b>{t("not.vurgu5")}</b>{t("not.metin6")}</span>
      </div>
    </div>
  );
}

function ikonFor(ad: string) {
  if (ad.includes("dwell") || ad.includes("entropi") || ad.includes("ritim") || ad.includes("hız")) return <Keyboard className="size-3.5 text-slate-faint" />;
  if (ad.includes("Fare") || ad.includes("jerk")) return <MousePointer2 className="size-3.5 text-slate-faint" />;
  if (ad.includes("basınç")) return <Waves className="size-3.5 text-slate-faint" />;
  return <Gauge className="size-3.5 text-slate-faint" />;
}

function skorRenk(v: number): string {
  if (v >= 0.65) return "#16a34a";
  if (v >= 0.4) return "#d97706";
  return "#dc2626";
}

function SinyalGrafik({ baslik, ikon, veri, renk, birim, t, yerel }: { baslik: string; ikon: React.ReactNode; veri: number[]; renk: string; birim: string; t: (k: string) => string; yerel: string }) {
  const max = Math.max(1, ...veri);
  const min = Math.min(...veri);
  const W = 220, H = 60;
  const pts = veri.map((v, i) => {
    const x = veri.length > 1 ? (i / (veri.length - 1)) * W : W / 2;
    const y = H - ((v - min) / (max - min || 1)) * (H - 8) - 4;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <div className="rounded-xl border border-line bg-surface px-3.5 py-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-ink">{ikon} {baslik}</span>
        <span className="num text-[11px] text-slate-faint">{veri.length.toLocaleString(yerel)} {t("ham.ornek")}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }} preserveAspectRatio="none">
        <polyline points={pts} fill="none" stroke={renk} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {veri.map((v, i) => {
          const x = veri.length > 1 ? (i / (veri.length - 1)) * W : W / 2;
          const y = H - ((v - min) / (max - min || 1)) * (H - 8) - 4;
          return <circle key={i} cx={x} cy={y} r={1.6} fill={renk} />;
        })}
      </svg>
      <div className="mt-1 flex justify-between text-[10.5px] text-slate-faint">
        <span className="num">{t("ham.min")} {Math.round(min).toLocaleString(yerel)}{birim}</span>
        <span className="num">{t("ham.max")} {Math.round(max).toLocaleString(yerel)}{birim}</span>
      </div>
    </div>
  );
}
