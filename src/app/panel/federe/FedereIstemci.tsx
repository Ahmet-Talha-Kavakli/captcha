"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Network, Info, ChevronDown, Globe2, ShieldAlert, Layers, Fingerprint, Server, Building2,
} from "lucide-react";
import { Panel, StatKart, Badge, Ulke } from "@/components/panel/kit";
import { cn } from "@/lib/cn";
import {
  TEHDIT_RENK,
  type FedereRapor, type FedereVarlik, type VarlikTip,
} from "@/lib/specter/federe-korelasyon";
import type { Dil } from "@/lib/i18n/panel";
import { fedCeviri } from "./federe.i18n";

/** Varlık tipi etiketini dile göre çöz (lib TIP_ETIKET yerine — enum güvenliği). */
function tipEtiket(tip: VarlikTip, dil: Dil) {
  return fedCeviri(`tip_${tip}`, dil);
}

/** Tehdit seviyesi etiketini dile göre çöz (ham enum değeri değil). */
function tehditEtiket(tehdit: FedereVarlik["tehdit"], dil: Dil) {
  return fedCeviri(`tehdit_${tehdit}`, dil);
}

export function FedereIstemci({
  rapor, siteAd, olaySayisi, dil,
}: {
  rapor: FedereRapor;
  siteAd: Record<string, string>;
  olaySayisi: number;
  dil: Dil;
}) {
  const t = (k: string) => fedCeviri(k, dil);
  const [tip, setTip] = useState<VarlikTip>("ip");
  const azalt = useReducedMotion();

  const varliklar = tip === "ip" ? rapor.ipVarliklar : tip === "asn" ? rapor.asnVarliklar : rapor.parmakizVarliklar;

  if (!rapor.cokSite) {
    return (
      <div className="mx-auto w-full max-w-7xl px-6 pt-8 pb-10 lg:px-10">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-canvas/30 px-6 py-16 text-center">
          <Building2 className="size-10 text-slate-faint" />
          <p className="mt-3 text-[15px] font-semibold text-slate-ink">{t("bosBaslik")}</p>
          <p className="mt-1 max-w-md text-[13px] text-slate-muted">
            {t("bosMetin").replace("{n}", String(rapor.siteSayisi))}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-8 pb-10 lg:px-10">
      {/* açıklama */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Network className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-ink">{t("aciklamaBaslik").replace("{n}", String(rapor.siteSayisi))}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted" dangerouslySetInnerHTML={{ __html: t("aciklamaMetin") }} />
        </div>
      </div>

      {/* özet */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={rapor.ozet.caprazSaldirgan} etiket={t("ozetCapraz")} ikon={<Globe2 className="size-5" />} tone="brand" />
        <StatKart sayi={rapor.ozet.koordineliKampanya} etiket={t("ozetKoordineli")} ikon={<Network className="size-5" />} tone={rapor.ozet.koordineliKampanya > 0 ? "danger" : "ok"} />
        <StatKart sayi={rapor.ozet.enGenisYayilma} etiket={t("ozetYayilma")} ikon={<Layers className="size-5" />} tone="warn" />
        <StatKart sayi={`${rapor.ozet.etkilenenSite}/${rapor.siteSayisi}`} etiket={t("ozetEtkilenen")} ikon={<Building2 className="size-5" />} tone={rapor.ozet.etkilenenSite > 0 ? "warn" : "ok"} />
      </div>

      {/* tip sekmeleri */}
      <div className="flex gap-2">
        {([
          ["ip", <Server key="i" className="size-4" />, rapor.ipVarliklar.length],
          ["asn", <Network key="a" className="size-4" />, rapor.asnVarliklar.length],
          ["parmakizi", <Fingerprint key="p" className="size-4" />, rapor.parmakizVarliklar.length],
        ] as [VarlikTip, React.ReactNode, number][]).map(([tt, ikon, sayi]) => (
          <button
            key={tt}
            onClick={() => setTip(tt)}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[13px] font-medium transition",
              tip === tt ? "border-brand-400 bg-brand-50 text-brand-700 ring-1 ring-brand-200" : "border-line bg-surface text-slate-muted hover:border-line-strong",
            )}
          >
            {ikon} {tipEtiket(tt, dil)} <span className="num rounded-full bg-canvas px-1.5 text-[11px]">{sayi}</span>
          </button>
        ))}
      </div>

      {/* varlık listesi */}
      <Panel baslik={t("listeBaslik").replace("{tip}", tipEtiket(tip, dil)).replace("{n}", String(varliklar.length))}>
        {varliklar.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-slate-faint">{t("listeBos").replace("{tip}", tipEtiket(tip, dil))}</p>
        ) : (
          <div className="space-y-2.5">
            {varliklar.map((v, i) => (
              <motion.div
                key={v.deger}
                initial={azalt ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
              >
                <VarlikKart v={v} siteAd={siteAd} toplamSite={rapor.siteSayisi} dil={dil} />
              </motion.div>
            ))}
          </div>
        )}
      </Panel>

      {/* yöntem notu */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-canvas/40 px-5 py-4 text-[13px] text-slate-muted">
        <Info className="mt-0.5 size-4 shrink-0 text-brand-600" />
        <span dangerouslySetInnerHTML={{ __html: t("yontemNot") }} />
      </div>
    </div>
  );
}

function VarlikKart({ v, siteAd, toplamSite, dil }: { v: FedereVarlik; siteAd: Record<string, string>; toplamSite: number; dil: Dil }) {
  const t = (k: string) => fedCeviri(k, dil);
  const [acik, setAcik] = useState(false);
  const renk = TEHDIT_RENK[v.tehdit];
  const maxIstek = Math.max(...v.siteDagilim.map((s) => s.istek), 1);

  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3" style={{ borderLeftWidth: 3, borderLeftColor: renk }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {v.tip !== "parmakizi" && <Ulke kod={v.country} />}
          <span className="num text-[13.5px] font-semibold text-slate-ink">{v.tip === "parmakizi" ? v.deger.slice(0, 16) : v.deger}</span>
          {v.tip === "ip" && <span className="hidden text-[11.5px] text-slate-faint sm:inline">{v.asn}</span>}
          <Badge ton={v.tehdit === "kritik" || v.tehdit === "yüksek" ? "kirmizi" : v.tehdit === "orta" ? "sari" : "yesil"}>{tehditEtiket(v.tehdit, dil)}</Badge>
        </div>
        <div className="flex items-center gap-3">
          {/* yayılma göstergesi: kaç site */}
          <span className="flex items-center gap-1.5 text-[12px]">
            <Layers className="size-3.5 text-slate-faint" />
            <span className="num font-semibold text-slate-ink">{v.siteSayisi}</span>
            <span className="text-slate-faint">/ {toplamSite} {t("site")}</span>
          </span>
          <span className="flex items-center gap-1.5 text-[12px]">
            <span className="text-slate-faint">{t("koord")}</span>
            <span className="num font-bold" style={{ color: renk }}>{v.koordinasyon}</span>
          </span>
          <button onClick={() => setAcik((x) => !x)} className="rounded-lg p-1 text-slate-faint hover:bg-canvas hover:text-slate-ink">
            <ChevronDown className={cn("size-4 transition", acik && "rotate-180")} />
          </button>
        </div>
      </div>

      {/* site yayılma noktaları */}
      <div className="mt-2.5 flex items-center gap-1.5">
        {Array.from({ length: toplamSite }, (_, i) => {
          const vurulan = i < v.siteSayisi;
          return <div key={i} className="h-1.5 flex-1 rounded-full" style={{ background: vurulan ? renk : "#e6e1d5", opacity: vurulan ? 1 : 0.5 }} title={vurulan ? t("vuruldu") : t("temiz")} />;
        })}
      </div>

      {acik && (
        <div className="mt-3 border-t border-line/60 pt-3">
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-slate-muted">{t("sitePerIstek").replace("{bot}", v.botClass)}</p>
          <div className="space-y-1.5">
            {v.siteDagilim.map((s) => (
              <div key={s.siteId} className="flex items-center gap-2.5 text-[12.5px]">
                <span className="w-40 shrink-0 truncate font-medium text-slate-ink">{siteAd[s.siteId] || s.siteId}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-canvas">
                  <div className="h-full rounded-full" style={{ width: `${(s.istek / maxIstek) * 100}%`, background: renk }} />
                </div>
                <span className="num w-10 text-right text-slate-muted">{s.istek}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-canvas/50 px-3 py-2 text-[12px] text-slate-muted">
            <ShieldAlert className="mt-0.5 size-3.5 shrink-0 text-warn" />
            <span>
              {t("varlikNot")
                .replace("{tip}", tipEtiket(v.tip, dil).toLowerCase())
                .replace("{n}", String(v.siteSayisi))
                .replace("{istek}", String(v.toplamIstek))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
