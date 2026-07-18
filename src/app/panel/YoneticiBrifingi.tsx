"use client";

/**
 * Specter — Yönetici Tehdit Brifingi (Executive Threat Briefing)
 * =============================================================
 * Dağınık güvenlik verisini üst-düzey bir istihbarat brifingine sentezleyen
 * bölüm. HİÇBİR sayı uydurma değildir: `tehdit-brifing` motoru SERVER tarafında
 * (page.tsx) çalışır ve hazır `Brifing` objeleri prop olarak buraya gelir.
 *
 * Kullanıcı 24 Saat / 7 Gün / 30 Gün sekmeleri arasında geçer; her sekme ilgili
 * brifingi (özet anlatı + tehdit seviyesi + vurgular + bulgular + öneriler)
 * gösterir.
 *
 * Tasarım: DerinlikBolumleri ile aynı DNA — krem tema (bg-surface/border-line/
 * text-slate-*), rounded kartlar, tabular-nums, framer-motion fade+rise
 * (azHareket → sade). Panel/NotKutusu kit'ten gelir.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  ShieldAlert,
  ShieldCheck,
  Lightbulb,
  AlertTriangle,
  Info,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Panel } from "@/components/panel/kit";
import type { Brifing, TehditSeviye } from "@/lib/specter/tehdit-brifing";

/* ================================================================== Sabitler */

type Donem = "24s" | "7g" | "30g";

const DONEM_SEKMELER: { anahtar: Donem; etiket: string }[] = [
  { anahtar: "24s", etiket: "24 Saat" },
  { anahtar: "7g", etiket: "7 Gün" },
  { anahtar: "30g", etiket: "30 Gün" },
];

/** Tehdit seviyesi → renk + etiket + ikon paleti. Tek doğruluk kaynağı. */
const SEVIYE_STIL: Record<
  TehditSeviye,
  {
    etiket: string;
    metin: string; // metin rengi
    zemin: string; // yumuşak zemin
    kenar: string; // kenarlık
    nokta: string; // nabız noktası zemini
    ozetZemin: string; // özet kutusu zemini
  }
> = {
  sakin: {
    etiket: "Sakin",
    metin: "text-ok",
    zemin: "bg-ok-soft",
    kenar: "border-green-200",
    nokta: "bg-ok",
    ozetZemin: "bg-ok-soft/50",
  },
  izlemede: {
    etiket: "İzlemede",
    metin: "text-brand-600",
    zemin: "bg-brand-50",
    kenar: "border-brand-100",
    nokta: "bg-brand-600",
    ozetZemin: "bg-brand-50/60",
  },
  yuksek: {
    etiket: "Yüksek",
    metin: "text-warn",
    zemin: "bg-warn-soft",
    kenar: "border-amber-200",
    nokta: "bg-warn",
    ozetZemin: "bg-warn-soft/50",
  },
  kritik: {
    etiket: "Kritik",
    metin: "text-danger2",
    zemin: "bg-danger-soft",
    kenar: "border-red-200",
    nokta: "bg-danger2",
    ozetZemin: "bg-danger-soft/50",
  },
};

/** Bulgu şiddeti → ikon + renk. */
const SIDDET_STIL: Record<
  Brifing["bulgular"][number]["siddet"],
  { ikon: React.ElementType; metin: string; zemin: string; kenar: string }
> = {
  kritik: { ikon: ShieldAlert, metin: "text-danger2", zemin: "bg-danger-soft", kenar: "border-red-200" },
  uyari: { ikon: AlertTriangle, metin: "text-warn", zemin: "bg-warn-soft", kenar: "border-amber-200" },
  bilgi: { ikon: Info, metin: "text-brand-600", zemin: "bg-brand-50", kenar: "border-brand-100" },
};

/* ================================================================== Alt-bileşenler */

/** Büyük tehdit seviyesi rozeti (nabızlı nokta + etiket). */
function SeviyeRozet({ seviye }: { seviye: TehditSeviye }) {
  const s = SEVIYE_STIL[seviye];
  const nabiz = seviye === "yuksek" || seviye === "kritik";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold",
        s.zemin,
        s.kenar,
        s.metin,
      )}
    >
      <span className="relative flex size-2.5">
        {nabiz && <span className={cn("absolute inline-flex size-full animate-ping rounded-full opacity-60", s.nokta)} />}
        <span className={cn("relative inline-flex size-2.5 rounded-full", s.nokta)} />
      </span>
      Tehdit Seviyesi: {s.etiket}
    </span>
  );
}

/** Küçük vurgu-metrik hücresi (etiket + değer). guven-merkezi StatKart dili:
 *  temiz yüzey, büyük net sayı, ferah padding. */
function VurguHucre({ etiket, deger }: { etiket: string; deger: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-4 py-4 shadow-card">
      <div className="text-[26px] font-bold leading-none num text-slate-ink">{deger}</div>
      <div className="mt-2 text-[11px] font-medium uppercase tracking-wide text-slate-faint">{etiket}</div>
    </div>
  );
}

/** Tek bir brifingin gövdesi (seçili döneme göre değişir). */
function BrifingGovde({ brifing, azHareket }: { brifing: Brifing; azHareket: boolean }) {
  const s = SEVIYE_STIL[brifing.tehditSeviye];

  return (
    <div className="space-y-7">
      {/* 1) Seviye rozeti + özet anlatı */}
      <div className={cn("rounded-2xl border p-5 sm:p-6", s.kenar, s.ozetZemin)}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SeviyeRozet seviye={brifing.tehditSeviye} />
          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-faint">
            <Sparkles className="size-3.5" />
            Otomatik üretilen istihbarat
          </span>
        </div>
        <p className="mt-4 text-[15px] leading-relaxed text-slate-ink">{brifing.ozet}</p>
      </div>

      {/* 2) Vurgular — 6 küçük metrik grid */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
        {brifing.vurgular.map((v) => (
          <VurguHucre key={v.etiket} etiket={v.etiket} deger={v.deger} />
        ))}
      </div>

      {/* 3) Bulgular + Öneriler */}
      <div className="grid gap-7 lg:grid-cols-2">
        {/* Bulgular */}
        <div>
          <div className="mb-3 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-slate-muted">
            <ShieldAlert className="size-3.5 text-slate-faint" />
            Öne Çıkan Bulgular
          </div>
          <div className="space-y-2.5">
            {brifing.bulgular.map((b, i) => {
              const st = SIDDET_STIL[b.siddet];
              const Ikon = st.ikon;
              const govde = (
                <div
                  className={cn(
                    "flex items-start gap-3 rounded-2xl border px-4 py-3.5",
                    st.kenar,
                    st.zemin,
                  )}
                >
                  <span className={cn("mt-0.5 shrink-0", st.metin)}>
                    <Ikon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-semibold text-slate-ink">{b.baslik}</div>
                    <div className="mt-1 text-[12px] leading-relaxed text-slate-muted">{b.detay}</div>
                  </div>
                </div>
              );
              if (azHareket) return <div key={i}>{govde}</div>;
              return (
                <motion.div
                  key={i}
                  initial={false}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                >
                  {govde}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Öneriler */}
        <div>
          <div className="mb-3 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-slate-muted">
            <Lightbulb className="size-3.5 text-slate-faint" />
            Önerilen Aksiyonlar
          </div>
          <ol className="space-y-2.5">
            {brifing.oneriler.map((o, i) => {
              const govde = (
                <li className="flex items-start gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5 transition hover:border-line-strong hover:bg-canvas/40">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-600 num">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-[13.5px] leading-relaxed text-slate-ink">{o}</span>
                  <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-slate-faint" />
                </li>
              );
              if (azHareket) return <div key={i}>{govde}</div>;
              return (
                <motion.div
                  key={i}
                  initial={false}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                >
                  {govde}
                </motion.div>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== Ana bileşen */

export function YoneticiBrifingi({
  brifing24,
  brifing7,
  brifing30,
  azHareket,
}: {
  brifing24: Brifing;
  brifing7: Brifing;
  brifing30: Brifing;
  azHareket: boolean;
}) {
  const [donem, setDonem] = useState<Donem>("24s");

  const brifing = donem === "24s" ? brifing24 : donem === "7g" ? brifing7 : brifing30;

  const govde = (
    <Panel
      baslik={
        <span className="inline-flex items-center gap-2">
          <FileText className="size-4 text-slate-faint" />
          Yönetici Tehdit Brifingi
        </span>
      }
      sagUst={
        <div className="inline-flex items-center gap-1 rounded-xl border border-line bg-canvas/50 p-0.5">
          {DONEM_SEKMELER.map((sekme) => {
            const aktif = donem === sekme.anahtar;
            return (
              <button
                key={sekme.anahtar}
                type="button"
                onClick={() => setDonem(sekme.anahtar)}
                aria-pressed={aktif}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[12px] font-semibold transition",
                  aktif
                    ? "bg-surface text-slate-ink shadow-sm ring-1 ring-line"
                    : "text-slate-muted hover:text-slate-ink",
                )}
              >
                {sekme.etiket}
              </button>
            );
          })}
        </div>
      }
    >
      {/* Dönem adı + üst-satır bilgi */}
      <div className="mb-4 flex items-center gap-2 text-[12px] text-slate-faint">
        <ShieldCheck className="size-3.5" />
        <span>
          {brifing.donemAd} penceresinden sentezlendi — yönetici özeti, bulgular ve önerilen aksiyonlar.
        </span>
      </div>

      {azHareket ? (
        <BrifingGovde brifing={brifing} azHareket={azHareket} />
      ) : (
        <motion.div
          key={donem}
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <BrifingGovde brifing={brifing} azHareket={azHareket} />
        </motion.div>
      )}
    </Panel>
  );

  if (azHareket) return <div>{govde}</div>;
  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {govde}
    </motion.div>
  );
}
