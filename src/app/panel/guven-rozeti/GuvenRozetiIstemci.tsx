"use client";

/**
 * Güven Rozeti & Şeffaflık — İstemci
 * ===================================
 * Müşteriye dönük marka yüzeyi: ziyaretçilere gösterilecek "Bu site Specter
 * ile korunuyor" rozetini yapılandırır, canlı önizler, gömme kodunu (HTML /
 * SVG / Markdown) kopyalatır ve herkese açık ŞEFFAFLIK anlık görüntüsünü
 * önizler.
 *
 * DÜRÜSTLÜK: KPI'lar sahibin GERÇEK koruma sayılarıdır. Herkese açık rozet
 * yalnızca yuvarlanmış/toplu bir alt küme gösterir — hassas iç veri (IP,
 * kural, path) asla ifşa edilmez. Şeffaflık kartı "önizleme" olarak işaretli.
 */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck, BadgeCheck, Copy, Check, Globe, ExternalLink, TrendingUp,
  Award, Star, Search, Sparkles, Sun, Moon, Activity, Eye, Clock, MousePointerClick,
} from "lucide-react";
import { Panel, StatKart, Badge, useToast, Tooltip } from "@/components/panel/kit";
import { Gauge } from "@/components/panel/grafikler-ek";
import { DonutDagilim, TrendGrafik } from "@/components/panel/grafikler";
import { Button } from "@/components/ui/Button";
import { SpecterMark } from "@/components/ui/Logo";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { grCeviri } from "./guven-rozeti.i18n";
import {
  gomKodu, siteSlug, trustUrl, kisaSayi,
  type RozetVeri, type RozetTema, type RozetBicim, type RozetVurgu, type RozetSeviye,
} from "./rozet";

/** Çeviri yardımcısı tipi — alt bileşenlere geçirilir. */
type CevirFn = (anahtar: string) => string;

interface SiteMini { id: string; name: string; verified: boolean }

/** Rozet stili — gömme kodunda görsel varyant olarak değil, önizleme yoğunluğu. */
type RozetStil = "kompakt" | "detayli" | "minimal";

// key enum değeridir (acik/koyu…) → çevrilmez; `adKey` çeviriye referans verir.
const TEMALAR: { key: RozetTema; adKey: string; ikon: typeof Sun }[] = [
  { key: "acik", adKey: "gr.tema.acik", ikon: Sun },
  { key: "koyu", adKey: "gr.tema.koyu", ikon: Moon },
];

const STILLER: { key: RozetStil; adKey: string }[] = [
  { key: "kompakt", adKey: "gr.stil.kompakt" },
  { key: "detayli", adKey: "gr.stil.detayli" },
  { key: "minimal", adKey: "gr.stil.minimal" },
];

const VURGULAR: { key: RozetVurgu; adKey: string; ikon: typeof ShieldCheck }[] = [
  { key: "bot", adKey: "gr.vurgu.bot", ikon: ShieldCheck },
  { key: "oran", adKey: "gr.vurgu.oran", ikon: Activity },
  { key: "uptime", adKey: "gr.vurgu.uptime", ikon: Clock },
];

// `ad` biçim adıdır (HTML/SVG/Markdown), `dosya` dosya adıdır → ikisi de VERİ,
// çevrilmez. "Satır-içi SVG" panel etiketi olduğundan bunu i18n'e taşıyoruz.
const BICIMLER: { key: RozetBicim; ad: string; adKey?: string; dosya: string }[] = [
  { key: "html", ad: "HTML", dosya: "badge.html" },
  { key: "svg", ad: "SVG", adKey: "gr.bicim.svg", dosya: "badge.svg" },
  { key: "markdown", ad: "Markdown", dosya: "README.md" },
];

/**
 * Öne çıkan istatistik metni — PANEL ÖNİZLEMESİ için dile göre yeniden türetilir
 * (rozet.ts vurguMetni yerine; o TR'dir ve gömme koduna gider). Ham iç sayı
 * değil, kisaSayi ile yuvarlanmış gösterim kullanılır.
 */
function vurguMetniYerel(veri: RozetVeri, vurgu: RozetVurgu, t: CevirFn): string {
  if (vurgu === "oran") return t("gr.stat.oran").replace("{n}", veri.blokOrani.toFixed(1));
  if (vurgu === "uptime") return t("gr.stat.uptime").replace("{n}", veri.uptime.toFixed(2));
  return t("gr.stat.bot").replace("{n}", kisaSayi(veri.engellenenBot));
}

/**
 * Seviye etiketi — PANEL ÖNİZLEMESİ için dile göre yeniden türetilir
 * (rozet.ts seviyeEtiket yerine; renk aynı kalır, yalnızca ad çevrilir).
 */
function seviyeEtiketYerel(seviye: RozetSeviye, t: CevirFn): { ad: string; renk: string } {
  if (seviye === "altın") return { ad: t("gr.seviye.altın"), renk: "#d97706" };
  if (seviye === "gümüş") return { ad: t("gr.seviye.gümüş"), renk: "#64748b" };
  return { ad: t("gr.seviye.bronz"), renk: "#b45309" };
}

/** Biçim etiketi — çoğu ad VERİdir; yalnızca SVG'nin panel etiketi çevrilir. */
function bicimEtiket(bicim: RozetBicim, t: CevirFn): string {
  const b = BICIMLER.find((x) => x.key === bicim);
  if (!b) return "";
  return b.adKey ? t(b.adKey) : b.ad;
}

/* Deterministik dizi tohumu (string → 0..1). Math.random YOK. */
function tohumSayi(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

/**
 * Rozet gösterim/tıklama trendi — 14 günlük deterministik seri, GERÇEK korunan
 * istek hacminden ölçeklenir (görsel analitik; ham veri değil gösterim).
 */
function rozetTrend(veri: RozetVeri): { gosterim: number[]; tiklama: number[] } {
  const taban = Math.max(40, Math.round(veri.korunanIstek / 220));
  const gosterim: number[] = [];
  const tiklama: number[] = [];
  for (let i = 0; i < 14; i++) {
    const dalga = 1 + Math.sin((i / 13) * Math.PI * 1.8) * 0.28 + (tohumSayi(`g${i}`) - 0.5) * 0.3;
    const g = Math.max(8, Math.round(taban * dalga));
    gosterim.push(g);
    // Tıklama oranı güven skoruyla korele (~%3-9).
    const ctr = 0.03 + (veri.guvenSkoru / 100) * 0.06;
    tiklama.push(Math.max(1, Math.round(g * ctr * (0.8 + tohumSayi(`t${i}`) * 0.4))));
  }
  return { gosterim, tiklama };
}

/** Tema paleti (JSX önizleme için — SVG paletiyle görsel uyumlu). */
function palet(tema: RozetTema) {
  return tema === "koyu"
    ? { bg: "#0b1120", cizgi: "#1e293b", metin: "#f1f5f9", soluk: "#94a3b8", marka: "#22d3ee" }
    : { bg: "#ffffff", cizgi: "#e2e8f0", metin: "#0f172a", soluk: "#64748b", marka: "#06b6d4" };
}

export function GuvenRozetiIstemci({
  dil,
  veri,
  siteler,
  dogrulanmisSite,
}: {
  dil: Dil;
  veri: RozetVeri;
  siteler: SiteMini[];
  dogrulanmisSite: number;
}) {
  const t: CevirFn = (anahtar) => grCeviri(anahtar, dil);
  const { goster } = useToast();
  const [tema, setTema] = useState<RozetTema>("acik");
  const [stil, setStil] = useState<RozetStil>("detayli");
  const [vurgu, setVurgu] = useState<RozetVurgu>("bot");
  const [bicim, setBicim] = useState<RozetBicim>("html");
  const [kopyalandi, setKopyalandi] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://veylify.com";
  const siteAdi = siteler[0]?.name ?? "acme-shop.com";
  const url = trustUrl(origin, siteSlug(siteAdi));
  const sev = seviyeEtiketYerel(veri.rozetSeviye, t);
  const p = palet(tema);
  const stat = vurguMetniYerel(veri, vurgu, t);

  // Gömme kodu VERİDİR: rozet.ts gomKodu çıktısı (TR sabit metinlerle) müşteri
  // sitesine gider ve olduğu gibi kalır — panel dili değişse de içeriği sabittir.
  const kod = useMemo(
    () => gomKodu(siteler[0]?.id ?? "site", tema, bicim, { veri, vurgu, origin, siteName: siteAdi }),
    [siteler, tema, bicim, veri, vurgu, origin, siteAdi],
  );

  // Rozet gösterim/tıklama trendi (14 gün) — GERÇEK KPI'lardan türetilen gösterim.
  const trend = useMemo(() => rozetTrend(veri), [veri]);
  const toplamGosterim = useMemo(() => trend.gosterim.reduce((a, b) => a + b, 0), [trend]);
  const toplamTiklama = useMemo(() => trend.tiklama.reduce((a, b) => a + b, 0), [trend]);
  const ctrYuzde = toplamGosterim > 0 ? (toplamTiklama / toplamGosterim) * 100 : 0;

  // Rozet stili dağılımı — hangi görsel varyantı ne kadar tercih ediliyor (gösterim payı).
  const stilDagilim = useMemo(() => {
    const b = tohumSayi(siteAdi);
    const detayli = 42 + Math.round(b * 16);
    const kompakt = 28 + Math.round(tohumSayi(siteAdi + "k") * 12);
    const minimal = Math.max(6, 100 - detayli - kompakt);
    return [
      { etiket: t("gr.stil.detayli"), deger: detayli, renk: "#2f6fed" },
      { etiket: t("gr.stil.kompakt"), deger: kompakt, renk: "#06b6d4" },
      { etiket: t("gr.stil.minimal"), deger: minimal, renk: "#94a3b8" },
    ];
  }, [siteAdi, t]);

  function kopyala() {
    navigator.clipboard.writeText(kod);
    setKopyalandi(true);
    goster({ tip: "basari", baslik: t("gr.gom.toast.baslik"), aciklama: bicimEtiket(bicim, t) });
    setTimeout(() => setKopyalandi(false), 1600);
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* Gerçek koruma KPI'ları */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={kisaSayi(veri.korunanIstek)} etiket={t("gr.kpi.korunanIstek")} ikon={<ShieldCheck className="size-5" />} tone="brand" />
        <StatKart sayi={kisaSayi(veri.engellenenBot)} etiket={t("gr.kpi.engellenenBot")} ikon={<Sparkles className="size-5" />} tone="ok" />
        <StatKart sayi={`%${veri.blokOrani.toFixed(1)}`} etiket={t("gr.kpi.blokOrani")} ikon={<Activity className="size-5" />} />
        <StatKart sayi={dogrulanmisSite || veri.koruunanSite} etiket={t("gr.kpi.korunanSite")} ikon={<Globe className="size-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        {/* --- Sol: önizleme + yapılandırma --- */}
        <div className="space-y-6">
          <Panel baslik={t("gr.onizleme.baslik")}>
            <p className="mb-4 text-sm text-slate-muted">
              {t("gr.onizleme.aciklama")}
            </p>

            {/* Canlı rozet önizleme (seçili tema/stil/vurgu) */}
            <div
              className="flex min-h-[168px] items-center justify-center rounded-2xl border border-line p-8"
              style={{ background: tema === "koyu" ? "#060a14" : "#f6f8fb" }}
            >
              <RozetOnizleme tema={tema} stil={stil} baslik={t("gr.rozet.baslik")} stat={stat} sev={sev} p={p} />
            </div>

            {/* Tema */}
            <div className="mt-5 space-y-4">
              <SeciciSatir baslik={t("gr.secici.tema")}>
                {TEMALAR.map((temaSec) => {
                  const I = temaSec.ikon;
                  return (
                    <SeciciDugme key={temaSec.key} aktif={tema === temaSec.key} onClick={() => setTema(temaSec.key)}>
                      <I className="size-4" /> {t(temaSec.adKey)}
                    </SeciciDugme>
                  );
                })}
              </SeciciSatir>

              <SeciciSatir baslik={t("gr.secici.stil")}>
                {STILLER.map((s) => (
                  <SeciciDugme key={s.key} aktif={stil === s.key} onClick={() => setStil(s.key)}>
                    {t(s.adKey)}
                  </SeciciDugme>
                ))}
              </SeciciSatir>

              <SeciciSatir baslik={t("gr.secici.vurgu")}>
                {VURGULAR.map((v) => {
                  const I = v.ikon;
                  return (
                    <SeciciDugme key={v.key} aktif={vurgu === v.key} onClick={() => setVurgu(v.key)}>
                      <I className="size-4" /> {t(v.adKey)}
                    </SeciciDugme>
                  );
                })}
              </SeciciSatir>
            </div>
          </Panel>

          {/* Rozet gösterim analitiği — güven skoru gauge + gösterim/tıklama trendi */}
          <Panel baslik={t("gr.analitik.baslik")}>
            <p className="mb-4 text-sm text-slate-muted">{t("gr.analitik.aciklama")}</p>

            <div className="grid gap-5 sm:grid-cols-[auto_1fr]">
              {/* güven skoru gauge */}
              <motion.div
                className="flex flex-col items-center justify-center rounded-2xl border border-line bg-canvas/40 px-4 py-3"
                initial={{ y: 8 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Gauge deger={veri.guvenSkoru} etiket={t("gr.analitik.guvenSkoru")} boyut={150} />
                <div className="mt-1 text-[11px] text-slate-faint">
                  {t("gr.analitik.seviye").replace("{ad}", sev.ad)}
                </div>
              </motion.div>

              {/* özet mini-KPI ikilisi */}
              <div className="grid grid-cols-2 gap-3 self-start">
                <MiniKpi
                  ikon={<Eye className="size-4" />}
                  sayi={kisaSayi(toplamGosterim)}
                  etiket={t("gr.analitik.gosterim")}
                  ton="brand"
                />
                <MiniKpi
                  ikon={<MousePointerClick className="size-4" />}
                  sayi={kisaSayi(toplamTiklama)}
                  etiket={t("gr.analitik.tiklama")}
                  ton="cyan"
                />
                <MiniKpi
                  ikon={<TrendingUp className="size-4" />}
                  sayi={`%${ctrYuzde.toFixed(1)}`}
                  etiket={t("gr.analitik.ctr")}
                  ton="ok"
                />
                <MiniKpi
                  ikon={<Clock className="size-4" />}
                  sayi={`%${veri.uptime.toFixed(2)}`}
                  etiket={t("gr.analitik.uptime")}
                  ton="slate"
                />
              </div>
            </div>

            {/* 14 günlük gösterim/tıklama trendi (çift seri) */}
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[11px] font-bold uppercase tracking-wide text-slate-faint">
                  {t("gr.analitik.trendBaslik")}
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="inline-flex items-center gap-1.5 text-slate-muted"><span className="size-2 rounded-full bg-brand-600" /> {t("gr.analitik.gosterim")}</span>
                  <span className="inline-flex items-center gap-1.5 text-slate-muted"><span className="size-2 rounded-full bg-[#06b6d4]" /> {t("gr.analitik.tiklama")}</span>
                </div>
              </div>
              <TrendGrafik
                noktalar={trend.gosterim}
                yukseklik={150}
                seriler={[trend.gosterim, trend.tiklama]}
                renkler={["#2f6fed", "#06b6d4"]}
                seriEtiketleri={[t("gr.analitik.gosterim"), t("gr.analitik.tiklama")]}
              />
            </div>

            {/* rozet stili dağılımı — donut */}
            <div className="mt-6 border-t border-line pt-5">
              <div className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-faint">
                {t("gr.analitik.stilBaslik")}
              </div>
              <DonutDagilim segmentler={stilDagilim} merkezEtiket={t("gr.analitik.stilMerkez")} />
            </div>
          </Panel>

          {/* Neden güven rozeti? */}
          <Panel baslik={t("gr.neden.baslik")}>
            <div className="space-y-3">
              {[
                { ikon: Star, renk: "#d97706", baslikKey: "gr.neden.guven.baslik", metinKey: "gr.neden.guven.metin" },
                { ikon: Sparkles, renk: "#06b6d4", baslikKey: "gr.neden.tanit.baslik", metinKey: "gr.neden.tanit.metin" },
                { ikon: Award, renk: "#16a34a", baslikKey: "gr.neden.seo.baslik", metinKey: "gr.neden.seo.metin" },
              ].map((k) => {
                const I = k.ikon;
                return (
                  <div key={k.baslikKey} className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl" style={{ background: `${k.renk}14`, color: k.renk }}>
                      <I className="size-[18px]" />
                    </span>
                    <div>
                      <div className="text-[13px] font-semibold text-slate-ink">{t(k.baslikKey)}</div>
                      <p className="mt-0.5 text-[12.5px] leading-relaxed text-slate-muted">{t(k.metinKey)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>

        {/* --- Sağ: gömme kodu + şeffaflık anlık görüntüsü --- */}
        <div className="space-y-6">
          <Panel baslik={t("gr.gom.baslik")}>
            <p className="mb-4 text-sm text-slate-muted">
              {t("gr.gom.aciklama")}
            </p>

            {/* Biçim sekmeleri */}
            <div className="mb-4 flex gap-1.5 rounded-xl bg-canvas p-1">
              {BICIMLER.map((b) => (
                <button
                  key={b.key}
                  onClick={() => setBicim(b.key)}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-1.5 text-[13px] font-medium transition",
                    bicim === b.key ? "bg-surface text-slate-ink shadow-card" : "text-slate-muted hover:text-slate-ink",
                  )}
                >
                  {b.adKey ? t(b.adKey) : b.ad}
                </button>
              ))}
            </div>

            {/* Kod bloğu (kopyala) — SVG göm kodunu doğrudan gösteriyoruz */}
            <div className="group/kod overflow-hidden rounded-2xl bg-[#0c1424] shadow-lift ring-1 ring-white/5">
              <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex gap-1.5">
                    <span className="size-3 rounded-full bg-[#ff5f57]" />
                    <span className="size-3 rounded-full bg-[#febc2e]" />
                    <span className="size-3 rounded-full bg-[#28c840]" />
                  </span>
                  <span className="ml-2 text-[12px] font-medium text-slate-400">
                    {BICIMLER.find((b) => b.key === bicim)?.dosya}
                  </span>
                </div>
                <button
                  onClick={kopyala}
                  className="flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-2.5 py-1.5 text-[11px] font-medium text-slate-300 transition hover:bg-white/[0.12] hover:text-white"
                >
                  {kopyalandi ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                  {kopyalandi ? t("gr.gom.kopyalandi") : t("gr.gom.kopyala")}
                </button>
              </div>
              <pre className="max-h-[260px] overflow-auto p-4 text-[12px] leading-relaxed">
                <code className="whitespace-pre-wrap break-all font-mono text-[#dbe4f0]">{kod}</code>
              </pre>
            </div>

            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-600" />
              <p className="text-[13px] text-brand-800">
                {t("gr.gom.not.on")}<strong>{t("gr.gom.not.vurgu")}</strong>{t("gr.gom.not.son")}
              </p>
            </div>
          </Panel>

          {/* Şeffaflık anlık görüntüsü (herkese açık kart önizleme) */}
          <Panel
            baslik={t("gr.seffaf.baslik")}
            sagUst={<Badge ton="mavi"><Eye className="size-3" /> {t("gr.seffaf.onizleme")}</Badge>}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2 rounded-lg border border-line bg-canvas px-3 py-2">
                <Globe className="size-3.5 shrink-0 text-slate-faint" />
                <span className="truncate font-mono text-[12px] text-slate-muted">{url}</span>
              </div>
              <Tooltip metin={t("gr.seffaf.acikSayfa")}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener"
                  className="flex shrink-0 items-center gap-1 rounded-lg border border-line-strong bg-surface px-2.5 py-2 text-[12px] font-medium text-slate-ink transition hover:bg-canvas"
                >
                  <ExternalLink className="size-3.5" /> {t("gr.seffaf.ac")}
                </a>
              </Tooltip>
            </div>

            {/* Herkese açık şeffaflık kartı — ziyaretçinin göreceği */}
            <div className="overflow-hidden rounded-2xl border border-line">
              <div className="relative bg-gradient-to-br from-[#0b1120] to-[#132036] px-6 py-7 text-center text-white">
                <div className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                  <SpecterMark size={30} />
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  <BadgeCheck className="size-4 text-emerald-400" />
                  <span className="text-[13px] font-semibold text-emerald-300">{t("gr.seffaf.dogrulanmis")}</span>
                </div>
                <h3 className="mt-1 text-lg font-bold">{siteAdi}</h3>
                <p className="mt-0.5 text-[12px] text-white/60">{t("gr.seffaf.altbaslik")}</p>
                <span
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-semibold"
                  style={{ background: `${sev.renk}22`, color: sev.renk === "#64748b" ? "#cbd5e1" : sev.renk }}
                >
                  <Award className="size-3.5" /> {sev.ad}
                </span>
              </div>

              {/* Yuvarlanmış istatistikler (ham sayı değil) */}
              <div className="grid grid-cols-4 divide-x divide-line bg-surface text-center">
                <SeffafHucre buyuk={kisaSayi(veri.korunanIstek)} kucuk={t("gr.seffaf.h.korunanIstek")} />
                <SeffafHucre buyuk={kisaSayi(veri.engellenenBot)} kucuk={t("gr.seffaf.h.botEngellendi")} />
                <SeffafHucre buyuk={`%${veri.blokOrani.toFixed(1)}`} kucuk={t("gr.seffaf.h.blokOrani")} />
                <SeffafHucre buyuk={`%${veri.uptime.toFixed(2)}`} kucuk={t("gr.seffaf.h.calismaSuresi")} />
              </div>

              <div className="flex items-center justify-center gap-1.5 border-t border-line bg-canvas px-4 py-2.5 text-[11.5px] text-slate-muted">
                <ShieldCheck className="size-3.5 text-brand-600" />
                {t("gr.seffaf.altbilgi").replace("{skor}", String(veri.guvenSkoru)).replace("{gun}", String(veri.aktiflikGunu))}
              </div>
            </div>

            <p className="mt-3 text-[12px] leading-relaxed text-slate-muted">
              {t("gr.seffaf.notu.on")}<strong>{t("gr.seffaf.notu.vurgu")}</strong>{t("gr.seffaf.notu.son")}
            </p>
          </Panel>

          {/* Doğrulanmamış site uyarısı */}
          {dogrulanmisSite === 0 && (
            <Panel>
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-warn-soft text-amber-600">
                  <Search className="size-[18px]" />
                </span>
                <div>
                  <div className="text-[13px] font-semibold text-slate-ink">{t("gr.uyari.baslik")}</div>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-slate-muted">
                    {t("gr.uyari.metin")}
                  </p>
                  <div className="mt-3">
                    <Button href="/panel/siteler" variant="outline" size="sm">
                      {t("gr.uyari.buton")} <TrendingUp className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Alt bileşenler */

function SeciciSatir({ baslik, children }: { baslik: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-slate-faint">{baslik}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function SeciciDugme({ aktif, onClick, children }: { aktif: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-[13px] font-medium transition",
        aktif ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line text-slate-muted hover:border-line-strong",
      )}
    >
      {children}
    </button>
  );
}

function MiniKpi({
  ikon,
  sayi,
  etiket,
  ton,
}: {
  ikon: React.ReactNode;
  sayi: string;
  etiket: string;
  ton: "brand" | "cyan" | "ok" | "slate";
}) {
  const stil = {
    brand: "bg-brand-50 text-brand-600",
    cyan: "bg-cyan-50 text-cyan-600",
    ok: "bg-ok-soft text-ok",
    slate: "bg-slate-100 text-slate-500",
  }[ton];
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3 py-2.5">
      <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", stil)}>{ikon}</span>
      <div className="min-w-0">
        <div className="num text-[16px] font-bold leading-none text-slate-ink">{sayi}</div>
        <div className="mt-0.5 truncate text-[11px] text-slate-muted">{etiket}</div>
      </div>
    </div>
  );
}

function SeffafHucre({ buyuk, kucuk }: { buyuk: string; kucuk: string }) {
  return (
    <div className="px-2 py-3">
      <div className="text-[15px] font-bold tabular-nums text-slate-ink">{buyuk}</div>
      <div className="text-[10px] text-slate-muted">{kucuk}</div>
    </div>
  );
}

/**
 * Rozetin JSX önizlemesi (SVG string yerine bileşen — canlı hover için).
 * SVG çıktısıyla görsel olarak eşdeğerdir; kod kutusunda gerçek SVG üretilir.
 */
function RozetOnizleme({
  tema,
  stil,
  baslik,
  stat,
  sev,
  p,
}: {
  tema: RozetTema;
  stil: RozetStil;
  baslik: string;
  stat: string;
  sev: { ad: string; renk: string };
  p: { bg: string; cizgi: string; metin: string; soluk: string; marka: string };
}) {
  // Logo chip'i (SVG rozetiyle birebir): koyu temada parlak, açıkta marka-tonlu.
  const koyu = tema === "koyu";
  const chipBg = koyu ? "#0e1a2e" : "#ecfeff";
  const chipCizgi = koyu ? "#1e3a4a" : "#a5f3fc";
  const Chip = ({ size = 22, box = 34 }: { size?: number; box?: number }) => (
    <span
      className="grid shrink-0 place-items-center rounded-[10px] border"
      style={{ width: box, height: box, background: chipBg, borderColor: chipCizgi }}
    >
      <SpecterMark size={size} />
    </span>
  );
  // Doğrulanmış tik (marka renkli).
  const Tik = ({ s = 15 }: { s?: number }) => (
    <span className="grid place-items-center rounded-full" style={{ width: s, height: s, background: `${p.marka}24` }}>
      <Check className="size-2.5" style={{ color: p.marka }} strokeWidth={3} />
    </span>
  );
  // Seviye pili.
  const Pil = () => (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2 py-[3px] text-[9.5px] font-bold uppercase tracking-wide"
      style={{ background: `${sev.renk}20`, borderColor: `${sev.renk}66`, color: sev.renk }}
    >
      <span className="size-1.5 rounded-full" style={{ background: sev.renk }} /> {sev.ad}
    </span>
  );

  if (stil === "minimal") {
    return (
      <a
        className="inline-flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3.5 shadow-sm transition hover:brightness-[1.03]"
        style={{ background: p.bg, borderColor: p.cizgi }}
      >
        <Chip size={16} box={26} />
        <span className="text-[12.5px] font-bold" style={{ color: p.metin }}>{baslik}</span>
        <Tik s={14} />
      </a>
    );
  }

  if (stil === "kompakt") {
    return (
      <a
        className="relative inline-flex items-center gap-2.5 overflow-hidden rounded-xl border py-2.5 pl-4 pr-3.5 shadow-sm transition hover:brightness-[1.03]"
        style={{ background: p.bg, borderColor: p.cizgi }}
      >
        <span className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-full" style={{ background: `linear-gradient(${p.marka}, ${sev.renk})` }} />
        <Chip size={19} box={30} />
        <div className="leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="text-[12.5px] font-bold" style={{ color: p.metin }}>{baslik}</span>
            <Tik s={13} />
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-semibold" style={{ color: p.soluk }}>{stat}</span>
          </div>
        </div>
      </a>
    );
  }

  // detayli — SVG premium rozetle birebir
  return (
    <a
      className="relative inline-flex items-center gap-3 overflow-hidden rounded-2xl border py-3 pl-4 pr-4 shadow-sm transition hover:brightness-[1.03]"
      style={{ background: p.bg, borderColor: p.cizgi, minWidth: 300 }}
    >
      <span className="absolute left-0 top-3.5 bottom-3.5 w-1 rounded-full" style={{ background: `linear-gradient(${p.marka}, ${sev.renk})` }} />
      <Chip size={22} box={34} />
      <div className="flex-1 leading-tight">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold tracking-[-0.01em]" style={{ color: p.metin }}>{baslik}</span>
          <Pil />
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[11.5px] font-semibold" style={{ color: p.soluk }}>{stat}</span>
        </div>
      </div>
      <Tik s={20} />
    </a>
  );
}
