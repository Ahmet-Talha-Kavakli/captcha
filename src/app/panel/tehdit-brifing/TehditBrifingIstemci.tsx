"use client";

import { useState } from "react";
import { FileText, ShieldAlert, Lightbulb, Download, Printer, AlertTriangle, Info, CheckCircle2, Radar } from "lucide-react";
import { useToast } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { SEVIYE_RENK } from "@/lib/specter/tehdit-brifing";
import type { Brifing, BrifingDonem } from "@/lib/specter/tehdit-brifing";
import type { Dil } from "@/lib/i18n/panel";
import { brifingCeviri } from "./tehdit-brifing.i18n";
import { cn } from "@/lib/cn";

const SIDDET_META: Record<string, { renk: string; ikon: React.ReactNode }> = {
  kritik: { renk: "#dc2626", ikon: <AlertTriangle className="size-4" /> },
  uyari: { renk: "#d97706", ikon: <ShieldAlert className="size-4" /> },
  bilgi: { renk: "#16a34a", ikon: <Info className="size-4" /> },
};

export function TehditBrifingIstemci({
  brifingler, uretildi, dil,
}: {
  brifingler: Record<BrifingDonem, Brifing>;
  uretildi: string;
  dil: Dil;
}) {
  const { goster } = useToast();
  const t = (k: string) => brifingCeviri(k, dil);
  const [donem, setDonem] = useState<BrifingDonem>("24s");
  const b = brifingler[donem];

  // Dönem adı ve seviye etiketini enum/anahtar üzerinden yeniden türet
  // (motor Türkçe döndürür; motoru değiştirmeden istemcide çeviriyoruz).
  const donemAd = t(`periodName.${donem}`);
  const seviyeEtiket = t(`sev.${b.tehditSeviye}`);
  // Belge başlığı (motorun b.baslik'i yerine yeniden kuruluyor).
  const belgeBaslik = `${t("kicker")} — ${donemAd}`;

  function metinIndir() {
    const s: string[] = [];
    s.push("=".repeat(66));
    s.push(`  ${belgeBaslik.toUpperCase()}`);
    s.push(`  ${t("dl.generatedLevel").replace("{u}", uretildi).replace("{s}", seviyeEtiket.toUpperCase())}`);
    s.push("=".repeat(66));
    s.push("");
    s.push(t("dl.summary"));
    s.push("  " + b.ozet);
    s.push("");
    s.push(t("dl.highlights"));
    for (const v of b.vurgular) s.push(`  ${t(`hl.${v.etiket}`)}: ${v.deger}`);
    s.push("");
    s.push(t("dl.findings"));
    for (const f of b.bulgular) { s.push(`  [${f.siddet.toUpperCase()}] ${f.baslik}`); s.push(`      ${f.detay}`); }
    s.push("");
    s.push(t("dl.recommended"));
    b.oneriler.forEach((o, i) => s.push(`  ${i + 1}. ${o}`));
    const blob = new Blob(["﻿" + s.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `specter-brifing-${donem}.txt`; a.click();
    URL.revokeObjectURL(url);
    goster({ tip: "basari", baslik: t("downloaded") });
  }

  function yazdir() {
    if (typeof window !== "undefined") window.print();
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* dönem + eylemler (yazdırmada gizli) */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex gap-2">
          {(["24s", "7g", "30g"] as BrifingDonem[]).map((d) => (
            <button key={d} onClick={() => setDonem(d)} className={cn("rounded-full px-4 py-2 text-[13px] font-medium transition", donem === d ? "bg-ink-900 text-white" : "bg-canvas text-slate-muted hover:text-slate-ink")}>
              {t(`period.${d}`)}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={yazdir}><Printer className="size-4" /> {t("print")}</Button>
          <Button variant="outline" size="sm" onClick={metinIndir}><Download className="size-4" /> {t("download")}</Button>
        </div>
      </div>

      {/* brifing belgesi */}
      <div id="brifing-belge" className="overflow-hidden rounded-[28px] border border-line bg-surface">
        {/* başlık bandı */}
        <div className="flex items-start justify-between gap-4 border-b border-line px-8 py-6" style={{ background: `linear-gradient(135deg, ${SEVIYE_RENK[b.tehditSeviye]}12, transparent)` }}>
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-faint"><Radar className="size-3.5" /> {t("kicker")}</div>
            <h1 className="mt-1 text-[24px] font-bold text-slate-ink">{donemAd}</h1>
            <p className="mt-0.5 text-[12px] text-slate-faint">{t("generatedAt")}: {uretildi}</p>
          </div>
          <div className="text-center">
            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-faint">{t("threatLevel")}</div>
            <div className="mt-1 rounded-full px-4 py-1.5 text-[15px] font-bold text-white" style={{ background: SEVIYE_RENK[b.tehditSeviye] }}>{seviyeEtiket}</div>
          </div>
        </div>

        {/* öne çıkanlar */}
        <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3 lg:grid-cols-6">
          {b.vurgular.map((v) => (
            <div key={v.etiket} className="bg-surface px-4 py-3.5 text-center">
              <div className="num text-[18px] font-bold text-slate-ink">{v.deger}</div>
              <div className="mt-0.5 text-[10.5px] leading-tight text-slate-faint">{t(`hl.${v.etiket}`)}</div>
            </div>
          ))}
        </div>

        {/* özet */}
        <div className="border-t border-line px-8 py-6">
          <h2 className="mb-2 flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-slate-faint"><FileText className="size-4" /> {t("execSummary")}</h2>
          <p className="text-[14px] leading-relaxed text-slate-ink">{b.ozet}</p>
        </div>

        {/* bulgular */}
        <div className="border-t border-line px-8 py-6">
          <h2 className="mb-3 flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-slate-faint"><ShieldAlert className="size-4" /> {t("findings")}</h2>
          <div className="space-y-2.5">
            {b.bulgular.map((f, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-line bg-canvas/30 px-4 py-3">
                <span className="mt-0.5 shrink-0" style={{ color: SIDDET_META[f.siddet].renk }}>{SIDDET_META[f.siddet].ikon}</span>
                <div>
                  <div className="text-[13.5px] font-semibold text-slate-ink">{f.baslik}</div>
                  <div className="text-[12.5px] text-slate-muted">{f.detay}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* öneriler */}
        <div className="border-t border-line bg-brand-50/30 px-8 py-6">
          <h2 className="mb-3 flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-brand-700"><Lightbulb className="size-4" /> {t("recommended")}</h2>
          <div className="space-y-2">
            {b.oneriler.map((o, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-600" />
                <span className="text-[13.5px] text-slate-ink">{o}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-line px-8 py-3 text-center text-[11px] text-slate-faint">
          {t("footer")}
        </div>
      </div>
    </div>
  );
}
