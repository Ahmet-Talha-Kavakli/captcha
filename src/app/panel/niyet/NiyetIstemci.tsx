"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import * as Icons from "lucide-react";
import { Brain, Info, ChevronDown, Target, Users } from "lucide-react";
import { Panel, StatKart, Ulke } from "@/components/panel/kit";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import {
  MOTIVASYON_META,
  type NiyetSonuc, type SaldirganNiyet, type NiyetOzet,
} from "@/lib/specter/niyet-siniflandirma";
import {
  niyetCeviri, niyetMotAd, niyetMotAcik, niyetKanitAd, niyetKanitDetay, niyetGerekce,
} from "./niyet.i18n";

function MotIkon({ ad, className }: { ad: string; className?: string }) {
  const C = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[ad] ?? Icons.Circle;
  return <C className={className} />;
}

export function NiyetIstemci({
  saldirganlar, ozet, olaySayisi, dil,
}: {
  saldirganlar: SaldirganNiyet[];
  ozet: NiyetOzet;
  olaySayisi: number;
  dil: Dil;
}) {
  const t = (k: string) => niyetCeviri(k, dil);
  const azalt = useReducedMotion();
  const bos = saldirganlar.length === 0;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-8 pb-10 lg:px-10">
      {/* açıklama */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Brain className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-ink" dangerouslySetInnerHTML={{ __html: t("n.serit.baslik") }} />
          <p className="mt-0.5 text-[13px] text-slate-muted" dangerouslySetInnerHTML={{ __html: t("n.serit.aciklama") }} />
        </div>
      </div>

      {/* genel niyet + özet */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_1fr]">
        <Panel baslik={t("n.genelNiyet")}>
          <NiyetDagilim sonuc={ozet.genelNiyet} dil={dil} buyuk />
        </Panel>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <StatKart sayi={ozet.toplamSaldirgan} etiket={t("n.siniflandirilan")} ikon={<Users className="size-5" />} tone="brand" />
            <StatKart
              sayi={ozet.baskinNiyet ? niyetMotAd(ozet.baskinNiyet, dil) : "—"}
              etiket={t("n.baskinMot")}
              ikon={<Target className="size-5" />}
              tone="danger"
            />
          </div>
          <Panel baslik={t("n.dagilimBaslik")}>
            {ozet.toplamSaldirgan === 0 ? (
              <p className="py-4 text-center text-[13px] text-slate-faint">{t("n.dagilimBos")}</p>
            ) : (
              <div className="space-y-2.5">
                {ozet.dagilim.filter((d) => d.sayi > 0).map((d) => {
                  const meta = MOTIVASYON_META[d.motivasyon];
                  return (
                    <div key={d.motivasyon} className="flex items-center gap-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg" style={{ background: `${meta.renk}18`, color: meta.renk }}>
                        <MotIkon ad={meta.ikon} className="size-4" />
                      </span>
                      <span className="w-32 shrink-0 text-[13px] font-medium text-slate-ink">{niyetMotAd(d.motivasyon, dil)}</span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-canvas">
                        <div className="h-full rounded-full" style={{ width: `${d.oran}%`, background: meta.renk }} />
                      </div>
                      <span className="num w-16 text-right text-[12.5px] font-semibold text-slate-ink">{d.sayi} · %{d.oran}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>
      </div>

      {/* saldırgan niyet kartları */}
      <Panel baslik={t("n.saldirganBazinda").replace("{n}", String(saldirganlar.length))}>
        {bos ? (
          <p className="py-8 text-center text-[13px] text-slate-faint">{t("n.kartBos").replace("{n}", String(olaySayisi))}</p>
        ) : (
          <div className="space-y-2.5">
            {saldirganlar.map((s, i) => <SaldirganKart key={s.anahtar} s={s} idx={i} azalt={!!azalt} dil={dil} />)}
          </div>
        )}
      </Panel>

      {/* yöntem notu */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-canvas/40 px-5 py-4 text-[13px] text-slate-muted">
        <Info className="mt-0.5 size-4 shrink-0 text-brand-600" />
        <span dangerouslySetInnerHTML={{ __html: t("n.not") }} />
      </div>
    </div>
  );
}

function NiyetDagilim({ sonuc, dil, buyuk }: { sonuc: NiyetSonuc; dil: Dil; buyuk?: boolean }) {
  const enUst = sonuc.dagilim[0];
  const meta = MOTIVASYON_META[sonuc.niyet];
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl" style={{ background: `${meta.renk}18`, color: meta.renk }}>
          <MotIkon ad={meta.ikon} className="size-6" />
        </span>
        <div>
          <p className="text-[16px] font-bold text-slate-ink">{niyetMotAd(sonuc.niyet, dil)}</p>
          <p className="text-[12px] text-slate-faint">{niyetMotAcik(sonuc.niyet, dil)}</p>
        </div>
        <span className="num ml-auto text-[22px] font-bold" style={{ color: meta.renk }}>%{Math.round(enUst.olasilik * 100)}</span>
      </div>

      <div className="mt-4 space-y-1.5">
        {sonuc.dagilim.map((d) => {
          const m = MOTIVASYON_META[d.motivasyon];
          return (
            <div key={d.motivasyon} className="flex items-center gap-2">
              <span className="w-24 shrink-0 text-[11.5px] text-slate-muted">{niyetMotAd(d.motivasyon, dil)}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-canvas">
                <div className="h-full rounded-full" style={{ width: `${d.olasilik * 100}%`, background: m.renk }} />
              </div>
              <span className="num w-9 text-right text-[11px] text-slate-faint">%{Math.round(d.olasilik * 100)}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-lg bg-canvas/50 px-3 py-2">
        <span className="text-[11.5px] text-slate-muted">{niyetCeviri("n.guven", dil)}</span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full" style={{ width: `${sonuc.guven}%`, background: sonuc.guven >= 70 ? "#16a34a" : sonuc.guven >= 40 ? "#d97706" : "#dc2626" }} />
        </div>
        <span className="num text-[11.5px] font-semibold text-slate-ink">{sonuc.guven}</span>
      </div>

      {buyuk && (
        <p className="mt-3 border-t border-line pt-3 text-[12px] leading-relaxed text-slate-muted">{niyetGerekce(sonuc, dil)}</p>
      )}
    </div>
  );
}

function SaldirganKart({ s, idx, azalt, dil }: { s: SaldirganNiyet; idx: number; azalt: boolean; dil: Dil }) {
  const [acik, setAcik] = useState(false);
  const meta = MOTIVASYON_META[s.sonuc.niyet];
  return (
    <motion.div
      initial={azalt ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(idx * 0.03, 0.3) }}
      className="rounded-xl border border-line bg-surface px-4 py-3"
      style={{ borderLeftWidth: 3, borderLeftColor: meta.renk }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <Ulke kod={s.country} />
          <span className="num text-[13.5px] font-semibold text-slate-ink">{s.anahtar}</span>
          <span className="text-[11.5px] text-slate-faint">{niyetCeviri("n.istek", dil).replace("{n}", String(s.olaySayisi))}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold" style={{ background: `${meta.renk}18`, color: meta.renk }}>
            <MotIkon ad={meta.ikon} className="size-3.5" /> {niyetMotAd(s.sonuc.niyet, dil)}
          </span>
          <span className="num text-[12px] text-slate-faint">%{Math.round(s.sonuc.dagilim[0].olasilik * 100)}</span>
          <button onClick={() => setAcik((v) => !v)} className="rounded-lg p-1 text-slate-faint hover:bg-canvas hover:text-slate-ink">
            <ChevronDown className={cn("size-4 transition", acik && "rotate-180")} />
          </button>
        </div>
      </div>

      {acik && (
        <div className="mt-3 grid gap-4 border-t border-line/60 pt-3 lg:grid-cols-2">
          <NiyetDagilim sonuc={s.sonuc} dil={dil} />
          <div>
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-slate-muted">{niyetCeviri("n.kanitlar", dil)}</p>
            {s.sonuc.kanitlar.length === 0 ? (
              <p className="text-[12px] text-slate-faint">{niyetCeviri("n.kanitYok", dil)}</p>
            ) : (
              <div className="space-y-1.5">
                {s.sonuc.kanitlar.map((k, i) => (
                  <div key={i} className="rounded-lg bg-canvas/50 px-3 py-2">
                    <p className="text-[12.5px] font-medium text-slate-ink">{niyetKanitAd(k, dil)}</p>
                    <p className="text-[11.5px] text-slate-faint">{niyetKanitDetay(k, dil)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
