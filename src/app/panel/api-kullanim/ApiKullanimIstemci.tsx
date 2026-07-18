"use client";

import { Gauge, Activity, AlertTriangle, Ban, Zap, Server } from "lucide-react";
import { Panel, StatKart, Badge, Ilerleme } from "@/components/panel/kit";
import { TrendGrafik } from "@/components/panel/grafikler";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { kullanimCeviri } from "./api-kullanim.i18n";

/** Yerelleştirme-farkındalıklı sayı biçimi (BCP-47). */
const LOCALE: Record<Dil, string> = { tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES" };

interface Endpoint { yol: string; ad: string; cagri: number; p50: number; p95: number; p99: number; hata: number; basari: number }
interface Ozet {
  toplamCagri: number; toplamHata: number; rateLimit429: number;
  kota: number; kullanilan: number; oran: number; kalan: number;
  asimDavranisi: string; planAd: string; ortLatency: number;
}

function gecikmeRenk(ms: number) {
  return ms <= 15 ? "text-ok" : ms <= 40 ? "text-brand-600" : ms <= 80 ? "text-warn" : "text-danger2";
}

export function ApiKullanimIstemci({
  ozet, endpointler, gunlukSeri, gunEtiket, rateLimit, anlikYuk, dil,
}: {
  ozet: Ozet; endpointler: Endpoint[]; gunlukSeri: number[]; gunEtiket: string[];
  rateLimit: { challenge: number; verify: number; passive: number }; anlikYuk: number; dil: Dil;
}) {
  const t = (k: string) => kullanimCeviri(k, dil);
  const nf = (n: number) => n.toLocaleString(LOCALE[dil]);
  const maxCagri = Math.max(...endpointler.map((e) => e.cagri), 1);
  const kotaYuzde = Math.round(ozet.oran * 100);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* KPI */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={nf(ozet.toplamCagri)} etiket={t("kpi.toplam")} ikon={<Activity className="size-5" />} tone="brand" />
        <StatKart sayi={`${ozet.ortLatency} ms`} etiket={t("kpi.yanit")} ikon={<Zap className="size-5" />} />
        <StatKart sayi={nf(ozet.toplamHata)} etiket={t("kpi.hata")} ikon={<AlertTriangle className="size-5" />} tone={ozet.toplamHata > 0 ? "warn" : undefined} />
        <StatKart sayi={nf(ozet.rateLimit429)} etiket={t("kpi.rate")} ikon={<Ban className="size-5" />} tone={ozet.rateLimit429 > 0 ? "danger" : undefined} />
      </div>

      {/* Kota + anlık yük */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel baslik={t("kota.baslik")}>
          <div className="mb-2 flex items-end justify-between">
            <span className="text-sm text-slate-muted">{t("kota.plan").replace("{ad}", ozet.planAd)}</span>
            <span className="num text-[15px] font-semibold text-slate-ink">{nf(ozet.kullanilan)} / {nf(ozet.kota)}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-canvas">
            <div className={cn("h-full rounded-full transition-all", kotaYuzde >= 90 ? "bg-danger2" : kotaYuzde >= 70 ? "bg-warn" : "bg-brand-600")} style={{ width: `${Math.min(100, kotaYuzde)}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-[12px]">
            <span className="text-slate-faint">{t("kota.kullanildi").replace("{y}", String(kotaYuzde)).replace("{kalan}", nf(ozet.kalan))}</span>
            <Badge ton={ozet.asimDavranisi === "block" ? "kirmizi" : "mavi"}>{ozet.asimDavranisi === "block" ? t("kota.reddet") : t("kota.ekUcret")}</Badge>
          </div>
          {kotaYuzde >= 90 && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-danger-soft px-3 py-2 text-[12px] text-danger2">
              <AlertTriangle className="size-3.5" /> {t("kota.uyari")}
            </div>
          )}
        </Panel>

        <Panel baslik={t("yuk.baslik")}>
          <div className="flex items-center gap-1.5 text-[12px] text-slate-muted"><Server className="size-3.5" /> {t("yuk.son1dk")}</div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={cn("num text-[32px] font-bold leading-none", anlikYuk >= 80 ? "text-danger2" : anlikYuk >= 50 ? "text-warn" : "text-ok")}>%{anlikYuk}</span>
            <span className="text-[13px] text-slate-faint">{t("yuk.kapasite")}</span>
          </div>
          <div className="mt-3"><Ilerleme deger={anlikYuk} ton={anlikYuk >= 80 ? "danger" : anlikYuk >= 50 ? "warn" : "ok"} /></div>
          <div className="mt-1 text-[11px] text-slate-faint">{t("yuk.not")}</div>
        </Panel>
      </div>

      {/* Günlük çağrı trendi */}
      <Panel baslik={t("trend.baslik")}>
        <TrendGrafik noktalar={gunlukSeri} etiketler={gunEtiket} renk="#2f6fed" yukseklik={200} />
      </Panel>

      {/* Endpoint tablosu */}
      <Panel baslik={t("tablo.baslik")} padding={false}>
        <div className="overflow-x-auto px-6 pb-4">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-wide text-slate-faint">
                <th className="py-2.5 pr-4">{t("tablo.endpoint")}</th>
                <th className="py-2.5 pr-4">{t("tablo.cagri")}</th>
                <th className="py-2.5 pr-4">{t("tablo.dagilim")}</th>
                <th className="py-2.5 pr-4">p50</th>
                <th className="py-2.5 pr-4">p95</th>
                <th className="py-2.5 pr-4">p99</th>
                <th className="py-2.5 pr-4">{t("tablo.hata")}</th>
                <th className="py-2.5">{t("tablo.basari")}</th>
              </tr>
            </thead>
            <tbody>
              {endpointler.map((e) => (
                <tr key={e.yol} className="border-t border-line">
                  <td className="py-3 pr-4"><span className="font-mono text-[12px] font-medium text-slate-ink">{e.yol}</span><div className="text-[11px] text-slate-faint">{kullanimCeviri(`ep.${e.yol}`, dil)}</div></td>
                  <td className="py-3 pr-4 num font-semibold text-slate-ink">{nf(e.cagri)}</td>
                  <td className="py-3 pr-4 w-32">
                    <div className="h-1.5 overflow-hidden rounded-full bg-canvas"><div className="h-full rounded-full bg-brand-500" style={{ width: `${(e.cagri / maxCagri) * 100}%` }} /></div>
                  </td>
                  <td className={cn("py-3 pr-4 num font-medium", gecikmeRenk(e.p50))}>{e.p50}ms</td>
                  <td className={cn("py-3 pr-4 num", gecikmeRenk(e.p95))}>{e.p95}ms</td>
                  <td className={cn("py-3 pr-4 num", gecikmeRenk(e.p99))}>{e.p99}ms</td>
                  <td className="py-3 pr-4 num text-slate-muted">{nf(e.hata)}</td>
                  <td className="py-3"><Badge ton="yesil">%{e.basari.toFixed(1)}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Rate-limit görselleştirme */}
      <Panel baslik={t("rate.baslik")}>
        <p className="mb-4 text-sm text-slate-muted">{t("rate.aciklama")}</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { ad: "Challenge", limit: rateLimit.challenge, renk: "#2f6fed" },
            { ad: "Verify", limit: rateLimit.verify, renk: "#16a34a" },
            { ad: "Passive", limit: rateLimit.passive, renk: "#d97706" },
          ].map((r) => (
            <div key={r.ad} className="rounded-2xl border border-line bg-canvas/40 p-4">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ background: r.renk }} />
                <span className="text-[13px] font-semibold text-slate-ink">{r.ad}</span>
              </div>
              <div className="mt-2 num text-[24px] font-bold text-slate-ink">{r.limit}</div>
              <div className="text-[12px] text-slate-faint">{t("rate.birim")}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
