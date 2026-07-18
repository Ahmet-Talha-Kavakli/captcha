"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import {
  Waypoints, Info, ChevronDown, ShieldAlert, Gauge, Ban, Zap, Lock,
  ArrowRight, TriangleAlert,
} from "lucide-react";
import { Panel, StatKart, Badge } from "@/components/panel/kit";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import {
  SEVIYE_RENK,
  type ApiAbuseRapor, type EndpointAbuse,
} from "@/lib/specter/api-kotuye";
import { kotuyeCeviri } from "./api-kotuye.i18n";

/** Yerelleştirme-farkındalıklı sayı biçimi (BCP-47). */
const LOCALE: Record<Dil, string> = { tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES" };

export function ApiKotuyeIstemci({ rapor, olaySayisi, dil }: { rapor: ApiAbuseRapor; olaySayisi: number; dil: Dil }) {
  const t = (k: string) => kotuyeCeviri(k, dil);
  const azalt = useReducedMotion();
  const { endpointler, ozet } = rapor;
  const bos = endpointler.length === 0;
  const maxSkor = Math.max(...endpointler.map((e) => e.abuseSkoru), 1);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-8 pb-10 lg:px-10">
      {/* açıklama */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Waypoints className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-ink">{t("aciklama.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted" dangerouslySetInnerHTML={{ __html: t("aciklama.metin") }} />
        </div>
      </div>

      {bos ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-canvas/30 px-6 py-16 text-center">
          <Waypoints className="size-10 text-slate-faint" />
          <p className="mt-3 text-[15px] font-semibold text-slate-ink">{t("bos.baslik")}</p>
          <p className="mt-1 max-w-md text-[13px] text-slate-muted">{t("bos.metin").replace("{n}", String(olaySayisi))}</p>
        </div>
      ) : (
        <>
          {/* özet */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatKart sayi={ozet.toplamYol} etiket={t("ozet.analiz")} ikon={<Waypoints className="size-5" />} tone="brand" />
            <StatKart sayi={ozet.kritikYol} etiket={t("ozet.kritik")} ikon={<ShieldAlert className="size-5" />} tone={ozet.kritikYol > 0 ? "danger" : "ok"} />
            <StatKart sayi={ozet.korunmasizHassas} etiket={t("ozet.korumasiz")} ikon={<Lock className="size-5" />} tone={ozet.korunmasizHassas > 0 ? "danger" : "ok"} />
            <StatKart sayi={ozet.ortAbuseSkoru} etiket={t("ozet.ort")} ikon={<Gauge className="size-5" />} tone={ozet.ortAbuseSkoru >= 45 ? "danger" : ozet.ortAbuseSkoru >= 25 ? "warn" : "ok"} />
          </div>

          {/* endpoint listesi */}
          <Panel baslik={t("liste.baslik").replace("{n}", String(endpointler.length))}>
            <div className="space-y-2.5">
              {endpointler.map((e, i) => (
                <motion.div
                  key={e.yol}
                  initial={azalt ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
                >
                  <EndpointKart e={e} maxSkor={maxSkor} t={t} dil={dil} />
                </motion.div>
              ))}
            </div>
          </Panel>
        </>
      )}

      {/* yöntem notu */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-canvas/40 px-5 py-4 text-[13px] text-slate-muted">
        <Info className="mt-0.5 size-4 shrink-0 text-brand-600" />
        <span dangerouslySetInnerHTML={{ __html: t("not").replace("{n}", olaySayisi.toLocaleString(LOCALE[dil])) }} />
      </div>
    </div>
  );
}

function EndpointKart({ e, maxSkor, t, dil }: { e: EndpointAbuse; maxSkor: number; t: (k: string) => string; dil: Dil }) {
  const [acik, setAcik] = useState(false);
  const renk = SEVIYE_RENK[e.seviye]; // renk döndürür — çeviri gerekmez
  // Gerekçe: lib'i düzenlemeden dile göre yeniden türet.
  const gerekce = t(`gerekce.${e.seviye}`)
    .replace("{bot}", String(Math.round(e.botOrani * 100)))
    .replace("{p}", String(e.patlama));

  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3" style={{ borderLeftWidth: 3, borderLeftColor: renk }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="num truncate rounded bg-canvas px-2 py-0.5 text-[12.5px] font-semibold text-slate-ink">{e.yol}</span>
          {e.hassas && <Badge ton="mavi"><Lock className="size-3" /> {t("kart.hassas")}</Badge>}
          <Badge ton={e.seviye === "kritik" || e.seviye === "yüksek" ? "kirmizi" : e.seviye === "orta" ? "sari" : "yesil"}>{t(`seviye.${e.seviye}`)}</Badge>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 sm:flex">
            <div className="h-2 w-24 overflow-hidden rounded-full bg-canvas">
              <div className="h-full rounded-full" style={{ width: `${(e.abuseSkoru / maxSkor) * 100}%`, background: renk }} />
            </div>
            <span className="num w-8 text-right text-[13px] font-bold" style={{ color: renk }}>{e.abuseSkoru}</span>
          </div>
          <button onClick={() => setAcik((v) => !v)} className="rounded-lg p-1 text-slate-faint hover:bg-canvas hover:text-slate-ink">
            <ChevronDown className={cn("size-4 transition", acik && "rotate-180")} />
          </button>
        </div>
      </div>

      {/* mini metrikler */}
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-slate-muted">
        <span>{e.toplamIstek} {t("kart.istek")} · {e.benzersizIp} IP</span>
        <span>{t("kart.bot")} <b className="text-slate-ink">%{Math.round(e.botOrani * 100)}</b></span>
        <span>{t("kart.ipIstek")} <b className="text-slate-ink num">{e.ipBasinaIstek}</b></span>
        <span>{t("kart.patlama")} <b className="num" style={{ color: e.patlama >= 5 ? "#dc2626" : "#64748b" }}>{e.patlama}×</b></span>
      </div>

      {/* önerilen rate-limit bandı */}
      <div className="mt-2.5 flex flex-wrap items-center gap-2 rounded-lg bg-canvas/50 px-3 py-2 text-[12px]">
        <Zap className="size-3.5 text-brand-600" />
        <span className="text-slate-muted">{t("kart.onerilenLimit")}</span>
        <span className="num font-semibold text-slate-ink">{e.oneri.dakikaLimit}{t("kart.dk")}</span>
        <span className="text-slate-faint">·</span>
        <span className="num text-slate-muted">{t("kart.burst")} {e.oneri.burst}</span>
        <span className="text-slate-faint">·</span>
        <Badge ton={e.oneri.aksiyon === "block" ? "kirmizi" : e.oneri.aksiyon === "challenge" ? "sari" : "gri"}>{t(`aksiyon.${e.oneri.aksiyon}`)}</Badge>
      </div>

      {acik && (
        <div className="mt-3 grid gap-3 border-t border-line/60 pt-3 sm:grid-cols-2">
          <div className="rounded-lg bg-canvas/40 px-3 py-2.5">
            <p className="mb-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-slate-muted">{t("kart.enAgresif")}</p>
            <p className="num text-[13px] font-semibold text-slate-ink">{e.enAgresifIpDeger || "—"}</p>
            <p className="text-[11.5px] text-slate-faint">{e.enAgresifIp} {t("kart.tekIp").replace("{p}", String(Math.round((e.enAgresifIp / e.toplamIstek) * 100)))}</p>
          </div>
          <div className="rounded-lg bg-canvas/40 px-3 py-2.5">
            <p className="mb-1.5 flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-slate-muted"><TriangleAlert className="size-3" /> {t("kart.gerekce")}</p>
            <p className="text-[12px] text-slate-muted">{gerekce}</p>
          </div>
          <div className="sm:col-span-2">
            <Link href="/panel/rate-politika" className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-3.5 py-2 text-[12.5px] font-semibold text-white">
              <Ban className="size-3.5" /> {t("kart.uygula")} <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
