"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import {
  RefreshCw, TrendingDown, Target, Info, ArrowRight, Check, AlertTriangle,
  Activity, GitCommitHorizontal,
} from "lucide-react";
import { Panel, StatKart, Badge } from "@/components/panel/kit";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { adaptifCeviri } from "./adaptif.i18n";
import type { AdaptifSonuc, GeriBeslemeSaglik } from "@/lib/specter/adaptif-ogrenme";

// BCP-47 locale eşlemesi — sayı/tarih Intl biçimlendirmesi için.
const LOCALE: Record<Dil, string> = {
  tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES",
};

export function AdaptifIstemci({
  sonuc, saglik, olaySayisi, dil,
}: {
  sonuc: AdaptifSonuc;
  saglik: GeriBeslemeSaglik;
  olaySayisi: number;
  dil: Dil;
}) {
  const t = (k: string) => adaptifCeviri(k, dil);
  const azalt = useReducedMotion();
  const egriMax = Math.max(...sonuc.maliyetEgrisi.map((p) => p.maliyet), 0.01);
  const optimalNokta = sonuc.maliyetEgrisi.reduce((en, p) => Math.abs(p.esik - sonuc.optimalEsik) < Math.abs(en.esik - sonuc.optimalEsik) ? p : en, sonuc.maliyetEgrisi[0]);

  // Öneri metni: lib TR üretiyor; burada dile göre yeniden türetilir (lib düzenlenmez).
  const mevcutEsik = 0.5; // page.tsx'te geriBeslemeSaglik(sonuc, 0.5) ile aynı taban
  const oneriMetin =
    saglik.durum === "optimal"
      ? t("oneri.optimal")
      : t("oneri.ayar")
          .replace("{mevcut}", mevcutEsik.toFixed(2))
          .replace("{optimal}", sonuc.optimalEsik.toFixed(2))
          .replace("{oran}", `%${sonuc.iyilesme}`)
          .replace("{yon}", sonuc.optimalEsik > mevcutEsik ? t("oneri.yonBot") : t("oneri.yonInsan"));

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-8 pb-10 lg:px-10">
      {/* açıklama */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <RefreshCw className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-ink">{t("aciklama.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {(() => {
              const [once, sonra] = t("aciklama.metin").split("{online}");
              return (
                <>
                  {once}<b>{t("aciklama.online")}</b>{sonra}
                </>
              );
            })()}
          </p>
        </div>
      </div>

      {/* özet */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={sonuc.optimalEsik.toFixed(2)} etiket={t("ozet.optimalEsik")} ikon={<Target className="size-5" />} tone="brand" />
        <StatKart sayi={`%${saglik.esikSapmasi * 100 > 0 ? Math.round(saglik.esikSapmasi * 100) : 0}`} etiket={t("ozet.sapma")} ikon={<GitCommitHorizontal className="size-5" />} tone={saglik.durum === "optimal" ? "ok" : saglik.durum === "ayarlanmali" ? "warn" : "danger"} />
        <StatKart sayi={sonuc.optimalMetrik.f1.toFixed(2)} etiket={t("ozet.f1")} ikon={<Activity className="size-5" />} tone="ok" />
        <StatKart sayi={t(`durum.${saglik.durum}`)} etiket={t("ozet.saglik")} ikon={saglik.durum === "optimal" ? <Check className="size-5" /> : <AlertTriangle className="size-5" />} tone={saglik.durum === "optimal" ? "ok" : saglik.durum === "ayarlanmali" ? "warn" : "danger"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* maliyet eğrisi */}
        <Panel baslik={t("egri.baslik")}>
          <p className="mb-3 text-[13px] text-slate-muted">{t("egri.aciklama")}</p>
          <div className="relative" style={{ height: 200 }}>
            {/* İç pad'li çizim alanı: çizgiler kenarlara yapışıp taşmaz.
                preserveAspectRatio KALDIRILDI ("none" deformasyon + taşma
                yapıyordu) → xMidYMid meet ile oranlı, temiz çizim. */}
            {(() => {
              const VW = 320, VH = 180, pX = 10, pT = 10, pB = 14;
              const gw = VW - pX * 2, gh = VH - pT - pB;
              const n = Math.max(1, sonuc.maliyetEgrisi.length - 1);
              const X = (i: number) => pX + (i / n) * gw;
              const Ymal = (p: { maliyet: number }) => pT + (1 - Math.max(0, Math.min(1, p.maliyet / egriMax))) * gh;
              const Yf1 = (p: { f1: number }) => pT + (1 - Math.max(0, Math.min(1, p.f1))) * gh;
              const idx = sonuc.maliyetEgrisi.findIndex((p) => p.esik === optimalNokta.esik);
              const optX = X(idx < 0 ? 0 : idx);
              return (
                <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full" style={{ height: 200 }} preserveAspectRatio="xMidYMid meet">
                  <polyline
                    points={sonuc.maliyetEgrisi.map((p, i) => `${X(i).toFixed(1)},${Ymal(p).toFixed(1)}`).join(" ")}
                    fill="none" stroke="#dc2626" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke"
                  />
                  <polyline
                    points={sonuc.maliyetEgrisi.map((p, i) => `${X(i).toFixed(1)},${Yf1(p).toFixed(1)}`).join(" ")}
                    fill="none" stroke="#16a34a" strokeWidth="1.5" strokeDasharray="3 3" vectorEffect="non-scaling-stroke"
                  />
                  <line x1={optX} y1={pT} x2={optX} y2={VH - pB} stroke="#2563eb" strokeWidth="1.5" strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
                </svg>
              );
            })()}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between text-[10px] text-slate-faint">
              <span>0.05</span><span>{t("egri.eksenEsik")}</span><span>0.95</span>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-[12px]">
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-danger2" /> {t("egri.efsaneMaliyet")}</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 border-b border-dashed border-ok" /> {t("egri.efsaneF1")}</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-0.5 bg-blue-500" /> {t("egri.efsaneOptimal").replace("{esik}", sonuc.optimalEsik.toFixed(2))}</span>
          </div>
        </Panel>

        {/* öğrenme turları */}
        <Panel baslik={t("yakinsama.baslik")}>
          <p className="mb-3 text-[13px] text-slate-muted">{t("yakinsama.aciklama")}</p>
          <div className="max-h-[240px] space-y-1.5 overflow-y-auto pr-1">
            {sonuc.turlar.map((tur) => (
              <motion.div
                key={tur.tur}
                initial={azalt ? false : { opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: Math.min(tur.tur * 0.02, 0.3) }}
                className="flex items-center gap-2 rounded-lg bg-canvas/50 px-3 py-1.5 text-[12px]"
              >
                <span className="num w-8 shrink-0 text-slate-faint">#{tur.tur}</span>
                <span className="num text-slate-muted">{tur.esikOnce.toFixed(3)}</span>
                <ArrowRight className="size-3 text-slate-faint" />
                <span className="num font-semibold text-slate-ink">{tur.esikSonra.toFixed(3)}</span>
                <span className="num ml-auto text-slate-faint">{t("yakinsama.maliyet").replace("{deger}", tur.metrik.maliyet.toFixed(3))}</span>
              </motion.div>
            ))}
          </div>
          <p className="mt-2 text-[11.5px] text-slate-faint">
            {t("yakinsama.altBilgi")
              .replace("{tur}", String(sonuc.turlar.length))
              .replace("{durum}", sonuc.yakinsadi ? t("yakinsama.yakinsadi") : t("yakinsama.maxTur"))}
          </p>
        </Panel>
      </div>

      {/* karar matrisi karşılaştırma */}
      <Panel baslik={t("matris.baslik")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <MatrisKart baslik={t("matris.baslangicEsik").replace("{esik}", sonuc.baslangicEsik.toFixed(2))} m={sonuc.baslangicMetrik} ton="notr" t={t} />
          <MatrisKart baslik={t("matris.ogrenilenEsik").replace("{esik}", sonuc.optimalEsik.toFixed(2))} m={sonuc.optimalMetrik} ton="iyi" t={t} />
        </div>
        {sonuc.iyilesme > 0 && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-ok-soft/40 px-4 py-3 text-[13px] text-green-700">
            <TrendingDown className="size-4" />
            {(() => {
              const [once, sonra] = t("matris.iyilesme").split("{oran}");
              return (
                <span>
                  {once}<b>%{sonuc.iyilesme}</b>{sonra}
                </span>
              );
            })()}
          </div>
        )}
      </Panel>

      {/* öneri bandı */}
      <div className={cn("flex flex-wrap items-center justify-between gap-4 rounded-[28px] px-8 py-6", saglik.durum === "optimal" ? "bg-ink-900" : "bg-ink-900")}>
        <div className="max-w-xl">
          <h3 className="flex items-center gap-2 text-[16px] font-semibold text-white">
            {saglik.durum === "optimal" ? <Check className="size-5 text-ok" /> : <AlertTriangle className="size-5 text-warn" />}
            {saglik.durum === "optimal" ? t("oneri.dengede") : t("oneri.ayarOner")}
          </h3>
          <p className="mt-1 text-[13px] text-white/60">{oneriMetin}</p>
        </div>
        <Link href="/panel/zorluk-optim" className="flex items-center gap-1 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-ink-900">{t("oneri.zorlukLink")} <ArrowRight className="size-3.5" /></Link>
      </div>

      {/* yöntem notu */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-canvas/40 px-5 py-4 text-[13px] text-slate-muted">
        <Info className="mt-0.5 size-4 shrink-0 text-brand-600" />
        {(() => {
          const [once, sonra] = t("not.metin").split("{sayi}");
          return (
            <span>
              {once}<b>{olaySayisi.toLocaleString(LOCALE[dil])}</b>{sonra}
            </span>
          );
        })()}
      </div>
    </div>
  );
}

function MatrisKart({ baslik, m, ton, t }: { baslik: string; m: import("@/lib/specter/adaptif-ogrenme").KararMetrik; ton: "notr" | "iyi"; t: (k: string) => string }) {
  return (
    <div className={cn("rounded-2xl border px-5 py-4", ton === "iyi" ? "border-ok/25 bg-ok-soft/25" : "border-line bg-surface")}>
      <p className="text-[13px] font-semibold text-slate-ink">{baslik}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[12.5px]">
        <Hucre etiket={t("matris.tp")} deger={m.dogruPozitif} renk="#16a34a" />
        <Hucre etiket={t("matris.fn")} deger={m.yanlisNegatif} renk="#dc2626" />
        <Hucre etiket={t("matris.fp")} deger={m.yanlisPozitif} renk="#d97706" />
        <Hucre etiket={t("matris.tn")} deger={m.dogruNegatif} renk="#64748b" />
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-2.5 text-[12px]">
        <span className="text-slate-muted">{t("matris.f1")} <b className="text-slate-ink num">{m.f1.toFixed(3)}</b></span>
        <span className="text-slate-muted">{t("matris.kesinlik")} <b className="num">{m.kesinlik.toFixed(2)}</b></span>
        <span className="text-slate-muted">{t("matris.maliyet")} <b className="num text-danger2">{m.maliyet.toFixed(3)}</b></span>
      </div>
    </div>
  );
}

function Hucre({ etiket, deger, renk }: { etiket: string; deger: number; renk: string }) {
  return (
    <div className="rounded-lg bg-canvas/60 px-3 py-2">
      <div className="num text-[18px] font-bold" style={{ color: renk }}>{deger}</div>
      <div className="text-[10.5px] text-slate-faint">{etiket}</div>
    </div>
  );
}
