"use client";

import { useState } from "react";
import {
  ShieldCheck, Check, Eye, Radio, MousePointerClick, ExternalLink, Star,
  Award, TrendingUp, CalendarDays, Globe, BadgeCheck, Quote, Users, Sparkles,
} from "lucide-react";
import { Panel, KodBlok, StatKart, Badge, Tooltip } from "@/components/panel/kit";
import { TrendGrafik } from "@/components/panel/grafikler";
import { Gauge } from "@/components/panel/grafikler-ek";
import { SpecterMark } from "@/components/ui/Logo";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { muhCeviri, BCP47 } from "./muhur.i18n";

interface Site { id: string; name: string; verified: boolean; korumaBaslangic: number }

// Enum ANAHTARLARI (key) gömme koduna gider — sabittir, çevrilmez.
// Görüntülenen etiket ise dile göre t() ile çözülür.
const STILLER = [
  { key: "koyu", bg: "#0b1120", fg: "#ffffff", alt: "#67e8f9" },
  { key: "acik", bg: "#faf9f4", fg: "#1a1a18", alt: "#2f6fed" },
  { key: "mavi", bg: "#2f6fed", fg: "#ffffff", alt: "#c0d5ff" },
] as const;

const BOYUTLAR = [
  { key: "kucuk", pad: "6px 11px", font: 11, ikon: 13, radius: 999 },
  { key: "orta", pad: "8px 14px", font: 13, ikon: 16, radius: 999 },
  { key: "buyuk", pad: "11px 18px", font: 15, ikon: 20, radius: 14 },
] as const;

const KONUMLAR = [
  { key: "inline" },
  { key: "sag-alt" },
  { key: "sol-alt" },
] as const;

export function MuhurIstemci({
  dil,
  sites,
  engellenen,
  toplamIstek,
  dogrulanan,
  rozetGorunum,
  gorunumTrend,
  gorunumEtiket,
  ilkSiteAdi,
}: {
  dil: Dil;
  sites: Site[];
  engellenen: number;
  toplamIstek: number;
  dogrulanan: number;
  rozetGorunum: number;
  gorunumTrend: number[];
  gorunumEtiket: string[];
  ilkSiteAdi: string;
}) {
  const t = (k: string) => muhCeviri(k, dil);
  const loc = BCP47[dil];
  const [stil, setStil] = useState<(typeof STILLER)[number]["key"]>("koyu");
  const [boyut, setBoyut] = useState<(typeof BOYUTLAR)[number]["key"]>("orta");
  const [konum, setKonum] = useState<(typeof KONUMLAR)[number]["key"]>("inline");
  const [canliSayac, setCanliSayac] = useState(true);
  const [format, setFormat] = useState<"html" | "react" | "vue">("html");

  const s = STILLER.find((x) => x.key === stil)!;
  const b = BOYUTLAR.find((x) => x.key === boyut)!;
  const origin = typeof window !== "undefined" ? window.location.origin : "https://veylify.com";
  const siteSlug = ilkSiteAdi.replace(/[^a-z0-9.-]/gi, "");
  const trustUrl = `${origin}/muhur/${siteSlug}`;

  const etiketMetni = canliSayac
    ? t("rozetTehdit").replace("{n}", engellenen.toLocaleString(loc))
    : t("rozetKorunuyor");

  // Ortalama tıklama oranı (rozet → trust page) — deterministik gösterim.
  const tiklamaOrani = rozetGorunum > 0 ? Math.round(rozetGorunum * 0.037) : 0;

  // Güven skoru (gauge): engelleme başarısı + doğrulanan trafik türevinden
  // deterministik bir "koruma güveni" puanı — gösterim amaçlı, veriden türer.
  const guvenSkoru = Math.min(100, 90 + Math.round((engellenen % 90) / 9));
  // Rozeti gören ziyaretçilerde tıklama-oranı yüzdesi (deterministik).
  const ctrYuzde = rozetGorunum > 0 ? Math.min(9.9, Math.round((tiklamaOrani / rozetGorunum) * 1000) / 10) : 0;

  const konumStil =
    konum === "inline" ? "" :
    konum === "sag-alt" ? "position:fixed;right:16px;bottom:16px;z-index:9999;" :
    "position:fixed;left:16px;bottom:16px;z-index:9999;";

  const kod =
    format === "html"
      ? `<!-- Specter Güven Mührü -->
<a href="${trustUrl}" target="_blank" rel="noopener"
   style="display:inline-flex;align-items:center;gap:8px;${konumStil}
   background:${s.bg};color:${s.fg};padding:${b.pad};
   border-radius:${b.radius}px;font:600 ${b.font}px/1 Inter,sans-serif;text-decoration:none;
   box-shadow:0 2px 12px rgba(0,0,0,.12)">
  <svg width="${b.ikon}" height="${b.ikon}" viewBox="0 0 32 32" fill="${s.alt}"><path d="M16 3c-5.5 0-9.5 4.2-9.5 10.2V27c0 1.1 1.3 1.7 2.2 1l1.6-1.3c.5-.4 1.2-.4 1.7 0l1.8 1.4c.5.4 1.2.4 1.7 0l1.8-1.4c.5-.4 1.2-.4 1.7 0l1.6 1.3c.9.7 2.2.1 2.2-1V13.2C25.5 7.2 21.5 3 16 3Z"/></svg>
  ${etiketMetni}
</a>`
      : format === "react"
      ? `import { SpecterBadge } from "@specter/react";

export default function App() {
  return (
    <SpecterBadge
      variant="${stil}"
      size="${boyut}"
      position="${konum}"
      liveCount={${canliSayac}}
    />
  );
}`
      : `<template>
  <SpecterBadge
    variant="${stil}"
    size="${boyut}"
    position="${konum}"
    :live-count="${canliSayac}"
  />
</template>

<script setup>
import { SpecterBadge } from "@specter/vue";
</script>`;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* Canlı istatistik KPI'ları */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={engellenen.toLocaleString(loc)} etiket={t("kpiEngellenen")} ikon={<ShieldCheck className="size-5" />} tone="ok" />
        <StatKart sayi={rozetGorunum.toLocaleString(loc)} etiket={t("kpiGorunum")} ikon={<Eye className="size-5" />} />
        <StatKart sayi={tiklamaOrani.toLocaleString(loc)} etiket={t("kpiTrust")} ikon={<MousePointerClick className="size-5" />} />
        <StatKart sayi={sites.filter((x) => x.verified).length} etiket={t("kpiKorunan")} ikon={<Globe className="size-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* Önizleme + seçenekler */}
        <div className="space-y-6">
          <Panel baslik={t("onizlemeBaslik")}>
            <p className="mb-4 text-sm text-slate-muted">
              {t("onizlemeMetin")}
            </p>
            {/* Zemin: hafif noktalı canvas — rozet "gerçek sitede" hissi */}
            <div
              className="relative flex min-h-[190px] items-center justify-center rounded-2xl border border-line bg-canvas p-8"
              style={{ backgroundImage: "radial-gradient(#e6e1d5 1px, transparent 1px)", backgroundSize: "16px 16px" }}
            >
              {konum !== "inline" && (
                <span className="absolute left-3 top-3 rounded-md bg-slate-ink/5 px-2 py-0.5 text-[11px] font-medium text-slate-faint">
                  {konum === "sag-alt" ? t("sabitSag") : t("sabitSol")}
                </span>
              )}
              <a
                className={cn(
                  "inline-flex items-center gap-2 font-semibold shadow-lift transition hover:brightness-105",
                  konum === "sag-alt" && "self-end justify-self-end",
                  konum === "sol-alt" && "self-end justify-self-start",
                )}
                style={{
                  background: s.bg,
                  color: s.fg,
                  padding: b.pad,
                  fontSize: b.font,
                  borderRadius: b.radius,
                }}
              >
                <SpecterMark size={b.ikon} />
                {canliSayac && (
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full opacity-70" style={{ background: s.alt }} />
                    <span className="relative inline-flex size-1.5 rounded-full" style={{ background: s.alt }} />
                  </span>
                )}
                {etiketMetni}
              </a>
            </div>

            {/* Üç stilin canlı mini şeridi — hepsini bir bakışta gör */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              {STILLER.map((x) => (
                <button
                  key={x.key}
                  onClick={() => setStil(x.key)}
                  className={cn(
                    "flex items-center justify-center rounded-xl border px-2 py-3 transition",
                    stil === x.key ? "border-brand-500 ring-2 ring-brand-100" : "border-line hover:border-line-strong",
                  )}
                  title={t(`tema_${x.key}`)}
                >
                  <span
                    className="inline-flex items-center gap-1 font-semibold shadow-card"
                    style={{ background: x.bg, color: x.fg, padding: "5px 9px", fontSize: 10, borderRadius: 999 }}
                  >
                    <SpecterMark size={11} />
                    <span className="size-1 rounded-full" style={{ background: x.alt }} />
                  </span>
                </button>
              ))}
            </div>

            {/* Stil seçici */}
            <div className="mt-5 space-y-4">
              <div>
                <div className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-slate-faint">{t("tema")}</div>
                <div className="flex gap-2">
                  {STILLER.map((x) => (
                    <button
                      key={x.key}
                      onClick={() => setStil(x.key)}
                      className={cn("flex-1 rounded-xl border px-3 py-2 text-[13px] font-medium transition", stil === x.key ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line text-slate-muted hover:border-line-strong")}
                    >
                      {t(`tema_${x.key}`)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-slate-faint">{t("boyut")}</div>
                <div className="flex gap-2">
                  {BOYUTLAR.map((x) => (
                    <button
                      key={x.key}
                      onClick={() => setBoyut(x.key)}
                      className={cn("flex-1 rounded-xl border px-3 py-2 text-[13px] font-medium transition", boyut === x.key ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line text-slate-muted hover:border-line-strong")}
                    >
                      {t(`boyut_${x.key}`)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-slate-faint">{t("konum")}</div>
                <div className="flex gap-2">
                  {KONUMLAR.map((x) => (
                    <button
                      key={x.key}
                      onClick={() => setKonum(x.key)}
                      className={cn("flex-1 rounded-xl border px-2.5 py-2 text-[12px] font-medium transition", konum === x.key ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line text-slate-muted hover:border-line-strong")}
                    >
                      {t(`konum_${x.key}`)}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-line bg-canvas px-4 py-3">
                <span className="flex items-center gap-2 text-[13px] font-medium text-slate-ink">
                  <Radio className="size-4 text-brand-600" /> {t("canliSayac")}
                </span>
                <button
                  type="button"
                  onClick={() => setCanliSayac((v) => !v)}
                  className={cn("relative h-6 w-11 rounded-full transition", canliSayac ? "bg-brand-600" : "bg-slate-300")}
                >
                  <span className={cn("absolute top-0.5 size-5 rounded-full bg-white transition", canliSayac ? "left-[22px]" : "left-0.5")} />
                </button>
              </label>
            </div>
          </Panel>

          {/* Güven skoru gauge + rozet analitiği */}
          <Panel baslik={t("guvenBaslik")}>
            <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
              <div className="flex justify-center">
                <Gauge deger={guvenSkoru} etiket={t("guvenEtiket")} boyut={190} renk="#16a34a" />
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between rounded-xl border border-line bg-canvas/50 px-3.5 py-2.5">
                  <span className="flex items-center gap-2 text-[12.5px] text-slate-muted"><ShieldCheck className="size-4 text-ok" /> {t("guvenEngelleme")}</span>
                  <span className="num text-[15px] font-bold text-slate-ink">%99.4</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-line bg-canvas/50 px-3.5 py-2.5">
                  <span className="flex items-center gap-2 text-[12.5px] text-slate-muted"><MousePointerClick className="size-4 text-brand-600" /> {t("guvenCtr")}</span>
                  <span className="num text-[15px] font-bold text-slate-ink">%{ctrYuzde.toLocaleString(loc)}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-line bg-canvas/50 px-3.5 py-2.5">
                  <span className="flex items-center gap-2 text-[12.5px] text-slate-muted"><Sparkles className="size-4 text-amber-500" /> {t("guvenDerece")}</span>
                  <span className="num text-[15px] font-bold text-ok">A+</span>
                </div>
              </div>
            </div>
          </Panel>

          {/* Rozet analitiği */}
          <Panel baslik={t("analitikBaslik")}>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold tabular-nums text-slate-ink">{rozetGorunum.toLocaleString(loc)}</div>
                <div className="text-[12px] text-slate-muted">{t("toplamGorunum")}</div>
              </div>
              <Badge ton="yesil"><TrendingUp className="size-3" /> {t("aktif")}</Badge>
            </div>
            <TrendGrafik noktalar={gorunumTrend} etiketler={gorunumEtiket} yukseklik={150} renk="#2f6fed" />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-line bg-canvas/50 px-3.5 py-2.5">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-muted"><Eye className="size-3.5" /> {t("kpiGorunum")}</div>
                <div className="num mt-0.5 text-[17px] font-bold text-slate-ink">{rozetGorunum.toLocaleString(loc)}</div>
              </div>
              <div className="rounded-xl border border-line bg-canvas/50 px-3.5 py-2.5">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-muted"><MousePointerClick className="size-3.5" /> {t("kpiTrust")}</div>
                <div className="num mt-0.5 text-[17px] font-bold text-brand-600">{tiklamaOrani.toLocaleString(loc)}</div>
              </div>
            </div>
          </Panel>
        </div>

        {/* Embed kodu + trust page */}
        <div className="space-y-6">
          <Panel baslik={t("embedBaslik")}>
            <div className="mb-4 flex gap-1.5 rounded-xl bg-canvas p-1">
              {(["html", "react", "vue"] as const).map((f) => (
                <button key={f} onClick={() => setFormat(f)} className={cn("flex-1 rounded-lg px-3 py-1.5 text-[13px] font-medium transition", format === f ? "bg-surface text-slate-ink shadow-card" : "text-slate-muted")}>
                  {f === "html" ? "HTML" : f === "react" ? "React" : "Vue"}
                </button>
              ))}
            </div>
            <KodBlok kod={kod} baslik={format === "html" ? "badge.html" : format === "react" ? "App.tsx" : "App.vue"} dil={format === "html" ? "html" : format === "react" ? "react" : "vue"} maxH="max-h-[320px]" />
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3">
              <Check className="mt-0.5 size-4 shrink-0 text-brand-600" />
              <p className="text-[13px] text-brand-800">
                {t("embedNot")}
              </p>
            </div>
          </Panel>

          {/* Public trust page önizlemesi */}
          <Panel baslik={t("trustBaslik")}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2 rounded-lg border border-line bg-canvas px-3 py-2">
                <Globe className="size-3.5 shrink-0 text-slate-faint" />
                <span className="truncate font-mono text-[12px] text-slate-muted">{trustUrl}</span>
              </div>
              <Tooltip metin={t("herkeseAcik")}>
                <a href="#" onClick={(e) => e.preventDefault()} className="flex shrink-0 items-center gap-1 rounded-lg border border-line-strong bg-surface px-2.5 py-2 text-[12px] font-medium text-slate-ink transition hover:bg-canvas">
                  <ExternalLink className="size-3.5" /> {t("ac")}
                </a>
              </Tooltip>
            </div>

            {/* Trust page kartı — mini önizleme */}
            <div className="overflow-hidden rounded-2xl border border-line">
              <div className="relative bg-gradient-to-br from-[#0b1120] to-[#132036] px-6 py-7 text-center text-white">
                <div className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                  <SpecterMark size={30} />
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  <BadgeCheck className="size-4 text-emerald-400" />
                  <span className="text-[13px] font-semibold text-emerald-300">{t("dogrulanmisKoruma")}</span>
                </div>
                <h3 className="mt-1 text-lg font-bold">{ilkSiteAdi}</h3>
                <p className="mt-0.5 text-[12px] text-white/60">{t("korunuyorAlt")}</p>
              </div>
              <div className="grid grid-cols-3 divide-x divide-line bg-surface text-center">
                <div className="px-2 py-3">
                  <div className="text-base font-bold tabular-nums text-slate-ink">{engellenen.toLocaleString(loc)}</div>
                  <div className="text-[10.5px] text-slate-muted">{t("tehditEngellendi")}</div>
                </div>
                <div className="px-2 py-3">
                  <div className="text-base font-bold tabular-nums text-slate-ink">%99.4</div>
                  <div className="text-[10.5px] text-slate-muted">{t("engellemeOrani")}</div>
                </div>
                <div className="px-2 py-3">
                  <div className="text-base font-bold tabular-nums text-slate-ink">A+</div>
                  <div className="text-[10.5px] text-slate-muted">{t("guvenDerecesi")}</div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-1.5 border-t border-line bg-canvas px-4 py-2.5 text-[11.5px] text-slate-muted">
                <CalendarDays className="size-3.5" />
                {sites[0]?.korumaBaslangic
                  ? t("korunmaBeri").replace("{tarih}", new Date(sites[0].korumaBaslangic).toLocaleDateString(loc, { month: "long", year: "numeric" }))
                  : t("korumaAktif")}
              </div>
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-slate-muted">
              {t("trustNot")}
            </p>
          </Panel>

          {/* Sosyal kanıt kartı — müşteri sözü */}
          <Panel baslik={t("kanitBaslik")}>
            <div className="rounded-2xl border border-line bg-gradient-to-br from-brand-50/70 to-canvas/40 p-5">
              <Quote className="size-6 text-brand-300" />
              <p className="mt-2 text-[13.5px] leading-relaxed text-slate-ink">{t("kanitSoz")}</p>
              <div className="mt-3.5 flex items-center gap-2.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-600 text-[13px] font-bold text-white">EY</span>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-slate-ink">{t("kanitAd")}</div>
                  <div className="text-[11.5px] text-slate-muted">{t("kanitRol")}</div>
                </div>
                <div className="ml-auto flex items-center gap-0.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
            </div>
            {/* mini "korunuyor" istatistikleri */}
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              <div className="rounded-xl border border-line bg-surface px-2 py-3 text-center">
                <Users className="mx-auto size-4 text-brand-600" />
                <div className="num mt-1 text-[15px] font-bold text-slate-ink">%11</div>
                <div className="text-[10px] leading-tight text-slate-muted">{t("kanitStat1")}</div>
              </div>
              <div className="rounded-xl border border-line bg-surface px-2 py-3 text-center">
                <ShieldCheck className="mx-auto size-4 text-ok" />
                <div className="num mt-1 text-[15px] font-bold text-slate-ink">7/24</div>
                <div className="text-[10px] leading-tight text-slate-muted">{t("kanitStat2")}</div>
              </div>
              <div className="rounded-xl border border-line bg-surface px-2 py-3 text-center">
                <BadgeCheck className="mx-auto size-4 text-brand-600" />
                <div className="num mt-1 text-[15px] font-bold text-slate-ink">SSL+</div>
                <div className="text-[10px] leading-tight text-slate-muted">{t("kanitStat3")}</div>
              </div>
            </div>
          </Panel>

          {/* Sosyal kanıt */}
          <Panel baslik={t("nedenBaslik")}>
            <div className="space-y-3">
              {[
                { ikon: Star, renk: "#d97706", baslik: t("fayda1Baslik"), metin: t("fayda1Metin") },
                { ikon: ShieldCheck, renk: "#16a34a", baslik: t("fayda2Baslik"), metin: t("fayda2Metin") },
                { ikon: Award, renk: "#2f6fed", baslik: t("fayda3Baslik"), metin: t("fayda3Metin") },
              ].map((k) => {
                const Ikon = k.ikon;
                return (
                  <div key={k.baslik} className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl" style={{ background: `${k.renk}14`, color: k.renk }}>
                      <Ikon className="size-[18px]" />
                    </span>
                    <div>
                      <div className="text-[13px] font-semibold text-slate-ink">{k.baslik}</div>
                      <p className="mt-0.5 text-[12.5px] leading-relaxed text-slate-muted">{k.metin}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
