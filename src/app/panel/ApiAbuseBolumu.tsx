"use client";

/**
 * Specter — API Kötüye-Kullanım & Rate-Limit İstihbaratı
 * ======================================================
 * Botlar tek tek isteklerden çok belirli ENDPOINT'leri sömürür: /login'e
 * kimlik-doldurma, /api/products'a kazıma, /register'a spam. Bu bölüm yol
 * başına kötüye-kullanımı skorlar (bot oranı × yoğunluk × patlama × hassaslık)
 * ve her yol için token-bucket bir rate-limit ÖNERİR — meşru kullanıcı temposunu
 * bozmadan bot patlamalarını kesecek dakika-limiti + burst + aşım aksiyonu.
 *
 * HİÇBİR sayı uydurma değildir — hepsi `api-kotuye` motorundan türetilir.
 * page.tsx SERVER'da hesaplar (apiAbuseAnaliz), buraya hazır ApiAbuseRapor gelir.
 *
 * Tasarım: TlsIstihbaratBolumu / OtoDuzeltmeBolumu ile birebir aynı dil — Panel +
 * krem kartlar (bg-canvas), tabular-nums, rounded kartlar; framer-motion rise
 * (azHareket → sade). whileInView / viewport / opacity-fade YOK.
 */

import { motion } from "framer-motion";
import {
  Gauge,
  ServerCog,
  Activity,
  ShieldCheck,
  ShieldAlert,
  Ban,
  Zap,
  Timer,
  Server,
  Users,
  Bot,
  Flame,
  Lock,
  TrendingUp,
  ArrowRight,
  Layers,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Panel, Badge, Ilerleme } from "@/components/panel/kit";
import type {
  ApiAbuseRapor,
  EndpointAbuse,
  RateOneri,
} from "@/lib/specter/api-kotuye";

/* ================================================================== Sabitler */

/** Seviye → TR ad + renk (hex) + rozet tonu.
 *  düşük gri · orta amber · yüksek turuncu · kritik kırmızı. */
const SEVIYE_TANIM: Record<
  EndpointAbuse["seviye"],
  { ad: string; hex: string; rozet: "gri" | "sari" | "kirmizi" }
> = {
  "düşük": { ad: "Düşük", hex: "#64748b", rozet: "gri" },
  "orta": { ad: "Orta", hex: "#d97706", rozet: "sari" },
  "yüksek": { ad: "Yüksek", hex: "#ea580c", rozet: "sari" },
  "kritik": { ad: "Kritik", hex: "#dc2626", rozet: "kirmizi" },
};

/** Aksiyon → renk paleti + TR etiket + ikon.
 *  block=kırmızı, challenge=amber, throttle=mavi. */
const AKSIYON_TANIM: Record<
  RateOneri["aksiyon"],
  { hex: string; rozet: "kirmizi" | "sari" | "mavi"; etiket: string; ikon: React.ElementType }
> = {
  block: { hex: "#dc2626", rozet: "kirmizi", etiket: "Engelle", ikon: Ban },
  challenge: { hex: "#d97706", rozet: "sari", etiket: "Doğrula", ikon: ShieldAlert },
  throttle: { hex: "#2f6fed", rozet: "mavi", etiket: "Yavaşlat", ikon: Timer },
};

/* ================================================================== Yardımcılar */

function sayi(n: number): string {
  return (Number.isFinite(n) ? n : 0).toLocaleString("tr-TR");
}

/** Kötüye-kullanım skoruna göre renk (hex). */
function skorRenk(s: number): string {
  if (s >= 70) return "#dc2626";
  if (s >= 45) return "#ea580c";
  if (s >= 25) return "#d97706";
  return "#16a34a";
}

/** Bot oranına göre ilerleme tonu. */
function botTon(oran: number): "danger" | "warn" | "brand" {
  if (oran >= 0.6) return "danger";
  if (oran >= 0.3) return "warn";
  return "brand";
}

/** Uzun yolu karta sığacak şekilde kısalt (mono gösterim). */
function yolKisa(yol: string, uzunluk = 42): string {
  if (!yol) return "/";
  return yol.length <= uzunluk ? yol : `${yol.slice(0, uzunluk - 1)}…`;
}

/** Bölümü rise ile saran motion sarmalayıcı (OtoDuzeltmeBolumu ile aynı). */
function Bolum({
  azHareket,
  gecikme = 0,
  children,
}: {
  azHareket: boolean;
  gecikme?: number;
  children: React.ReactNode;
}) {
  if (azHareket) return <div>{children}</div>;
  return (
    <motion.div
      initial={{ y: 12 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, delay: gecikme, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Panel başlığında ikon + metin. */
function BaslikIkon({ ikon: Ikon, metin }: { ikon: React.ElementType; metin: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Ikon className="size-4 text-slate-faint" />
      {metin}
    </span>
  );
}

/* ================================================================== Özet hapı */

function OzetHap({
  ikon: Ikon,
  etiket,
  deger,
  ek,
  ton = "ink",
}: {
  ikon: React.ElementType;
  etiket: string;
  deger: string;
  ek?: string;
  ton?: "ink" | "danger" | "ok" | "warn";
}) {
  const renk =
    ton === "danger" ? "text-danger2" : ton === "ok" ? "text-ok" : ton === "warn" ? "text-warn" : "text-slate-ink";
  return (
    <div className="rounded-xl border border-line bg-canvas/40 px-3.5 py-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-faint">
        <Ikon className="size-3.5" />
        {etiket}
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className={cn("text-[22px] font-bold leading-none num", renk)}>{deger}</span>
        {ek && <span className="truncate text-[12px] text-slate-faint">{ek}</span>}
      </div>
    </div>
  );
}

/* ================================================================== Metrik hücresi */

function Metrik({
  ikon: Ikon,
  etiket,
  children,
  ton = "ink",
}: {
  ikon: React.ElementType;
  etiket: string;
  children: React.ReactNode;
  ton?: "ink" | "danger";
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">
        <Ikon className="size-3" />
        {etiket}
      </div>
      <div
        className={cn(
          "mt-1 flex items-center gap-1.5 text-[13px] font-semibold tabular-nums",
          ton === "danger" ? "text-danger2" : "text-slate-ink",
        )}
      >
        {children}
      </div>
    </div>
  );
}

/* ================================================================== Rate-limit kutusu */

/** Önerilen token-bucket rate-limit: dakika-limiti + burst + aksiyon + gerekçe. */
function RateOneriKutu({ oneri }: { oneri: RateOneri }) {
  const aksiyon = AKSIYON_TANIM[oneri.aksiyon] ?? AKSIYON_TANIM.throttle;
  const AksiyonIkon = aksiyon.ikon;
  return (
    <div className="mt-3.5 rounded-xl border border-brand-100 bg-brand-50/40 px-3.5 py-3">
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-brand-700">
          <Gauge className="size-3.5" />
          Önerilen rate-limit
        </span>
        <span
          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset"
          style={{
            background: `${aksiyon.hex}12`,
            color: aksiyon.hex,
            borderColor: `${aksiyon.hex}33`,
          }}
        >
          <AksiyonIkon className="size-3" />
          {aksiyon.etiket}
        </span>
      </div>

      {/* Token-bucket parametreleri — mono kod hissi */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5">
          <Timer className="size-3.5 text-brand-600" />
          <span className="text-[14px] font-bold tabular-nums text-slate-ink">{sayi(oneri.dakikaLimit)}</span>
          <span className="text-[11px] font-medium text-slate-faint">istek/dk</span>
        </span>
        <span className="text-slate-300">+</span>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5">
          <Zap className="size-3.5 text-brand-600" />
          <span className="text-[14px] font-bold tabular-nums text-slate-ink">{sayi(oneri.burst)}</span>
          <span className="text-[11px] font-medium text-slate-faint">burst</span>
        </span>
        <ArrowRight className="size-3.5 text-slate-faint" />
        <span
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold ring-1 ring-inset"
          style={{
            background: `${aksiyon.hex}12`,
            color: aksiyon.hex,
            borderColor: `${aksiyon.hex}33`,
          }}
        >
          <AksiyonIkon className="size-3.5" />
          aşımda {aksiyon.etiket.toLowerCase()}
        </span>
      </div>

      {/* Gerekçe (insan-okur) */}
      <p className="mt-2.5 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-slate-muted">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-brand-600" />
        <span>{oneri.gerekce}</span>
      </p>
    </div>
  );
}

/* ================================================================== Top-abuse dikey bar */

/**
 * En çok kötüye-kullanılan endpoint'ler — dikey sütun grafiği (yatay-bar değil).
 * Y: abuse skoru (0-100), sütun rengi seviyeye göre. Kart-listesinden farklı,
 * tek bakışta "hangi yol en tehlikeli" görseli.
 */
function TopAbuseBar({ endpointler, azHareket }: { endpointler: EndpointAbuse[]; azHareket: boolean }) {
  const veri = endpointler.slice(0, 8);
  if (veri.length === 0) return null;
  const kisaAd = (yol: string) => {
    const seg = yol.split("?")[0].split("/").filter(Boolean);
    return seg.length ? `/${seg[seg.length - 1]}` : "/";
  };
  return (
    <div className="rounded-2xl border border-line bg-canvas/40 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-faint">
          <Layers className="size-3.5" />
          En çok kötüye-kullanılan yollar · abuse skoru
        </div>
        <span className="text-[10.5px] text-slate-faint">0–100</span>
      </div>
      <div className="flex h-44 items-end gap-2.5">
        {veri.map((e, i) => {
          const h = Math.max(4, e.abuseSkoru);
          const renk = skorRenk(e.abuseSkoru);
          return (
            <div key={e.yol} className="group relative flex flex-1 flex-col items-center justify-end" style={{ height: "100%" }}>
              <span className="mb-1 text-[11px] font-bold tabular-nums" style={{ color: renk }}>
                {e.abuseSkoru}
              </span>
              <motion.div
                className="w-full max-w-[46px] rounded-t-lg"
                style={{ background: renk }}
                initial={azHareket ? false : { height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ duration: 0.6, delay: azHareket ? 0 : i * 0.04, ease: [0.16, 1, 0.3, 1] }}
              />
              <span className="mt-2 w-full truncate text-center font-mono text-[10px] text-slate-muted" title={e.yol}>
                {kisaAd(e.yol)}
              </span>
              {/* hover detay */}
              <div className="pointer-events-none absolute -top-12 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-line bg-surface/95 px-2.5 py-1.5 text-[11px] shadow-lift backdrop-blur-sm group-hover:block">
                <div className="mb-0.5 font-mono font-medium text-slate-muted">{yolKisa(e.yol, 32)}</div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-muted">Skor</span>
                  <span className="ml-auto font-semibold tabular-nums" style={{ color: renk }}>{e.abuseSkoru}/100</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-muted">Bot</span>
                  <span className="ml-auto font-semibold tabular-nums text-slate-ink">%{Math.round(e.botOrani * 100)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================== Risk ısı-matrisi */

/**
 * Endpoint × risk-faktörü ısı matrisi — yatay-bar/kart yerine hücre-yoğunluk ızgarası.
 * Satır: endpoint (yol). Sütun: 4 risk faktörü (bot oranı, yoğunluk, patlama, hassaslık).
 * Hücre rengi 0-1 normalize yoğunluğa göre koyulaşır → sıcak noktalar tek bakışta.
 */
function RiskIsiMatris({ endpointler }: { endpointler: EndpointAbuse[] }) {
  const veri = endpointler.slice(0, 8);
  if (veri.length === 0) return null;

  // Normalize edici yardımcı — 0..1 arası yoğunluk.
  const kolonlar: { ad: string; ikon: React.ElementType; deger: (e: EndpointAbuse) => number; goster: (e: EndpointAbuse) => string }[] = [
    { ad: "Bot oranı", ikon: Bot, deger: (e) => Math.min(1, e.botOrani), goster: (e) => `%${Math.round(e.botOrani * 100)}` },
    { ad: "Yoğunluk", ikon: Users, deger: (e) => Math.min(1, e.ipBasinaIstek / 20), goster: (e) => `${sayi(e.ipBasinaIstek)}/IP` },
    { ad: "Patlama", ikon: TrendingUp, deger: (e) => Math.min(1, e.patlama / 8), goster: (e) => `${sayi(e.patlama)}×` },
    { ad: "Hassaslık", ikon: Lock, deger: (e) => (e.hassas ? 1 : 0.12), goster: (e) => (e.hassas ? "Hassas" : "—") },
  ];

  // Yoğunluk → renk (yeşil→amber→turuncu→kırmızı, sıcaklık dili).
  const hucreRenk = (y: number): { bg: string; fg: string } => {
    if (y >= 0.75) return { bg: "#dc2626", fg: "#ffffff" };
    if (y >= 0.5) return { bg: "#ea580c", fg: "#ffffff" };
    if (y >= 0.3) return { bg: "#f59e0b", fg: "#7c2d12" };
    if (y >= 0.15) return { bg: "#fde68a", fg: "#78350f" };
    return { bg: "#eef2f4", fg: "#94a3b8" };
  };

  return (
    <div className="rounded-2xl border border-line bg-canvas/40 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-faint">
          <Flame className="size-3.5" />
          Endpoint × risk faktörü ısı matrisi
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-faint">
          <span>düşük</span>
          <span className="flex overflow-hidden rounded">
            {["#eef2f4", "#fde68a", "#f59e0b", "#ea580c", "#dc2626"].map((c) => (
              <span key={c} className="size-2.5" style={{ background: c }} />
            ))}
          </span>
          <span>yüksek</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[440px]">
          {/* Sütun başlıkları */}
          <div className="grid grid-cols-[minmax(120px,1.4fr)_repeat(4,1fr)] gap-1.5 px-0.5 pb-1.5">
            <span />
            {kolonlar.map((k) => (
              <span key={k.ad} className="flex items-center justify-center gap-1 text-[10px] font-medium uppercase tracking-wide text-slate-faint">
                <k.ikon className="size-3" />
                <span className="hidden sm:inline">{k.ad}</span>
              </span>
            ))}
          </div>
          {/* Satırlar */}
          <div className="space-y-1.5">
            {veri.map((e) => (
              <div key={e.yol} className="grid grid-cols-[minmax(120px,1.4fr)_repeat(4,1fr)] items-center gap-1.5">
                <code
                  className="truncate rounded bg-surface px-1.5 py-1 font-mono text-[11px] text-slate-ink ring-1 ring-inset ring-line"
                  title={e.yol}
                >
                  {yolKisa(e.yol, 22)}
                </code>
                {kolonlar.map((k) => {
                  const y = k.deger(e);
                  const { bg, fg } = hucreRenk(y);
                  return (
                    <div
                      key={k.ad}
                      className="grid h-8 place-items-center rounded-md text-[11px] font-semibold tabular-nums"
                      style={{ background: bg, color: fg }}
                      title={`${k.ad}: ${k.goster(e)}`}
                    >
                      {k.goster(e)}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== Endpoint kartı */

function EndpointKart({ endpoint, azHareket }: { endpoint: EndpointAbuse; azHareket: boolean }) {
  void azHareket;
  const seviye = SEVIYE_TANIM[endpoint.seviye] ?? SEVIYE_TANIM["düşük"];
  const sRenk = skorRenk(endpoint.abuseSkoru);
  const kritik = endpoint.seviye === "kritik";
  const vurgulu = kritik || endpoint.abuseSkoru >= 45;
  const botYuzde = Math.round(endpoint.botOrani * 100);
  // Hassas + yüksek skor = korunmasız hassas yol (en tehlikeli birleşim).
  const korunmasiz = endpoint.hassas && endpoint.abuseSkoru >= 45;

  return (
    <div
      className={cn(
        "rounded-2xl border bg-canvas/40 p-4 transition",
        kritik
          ? "border-red-300 bg-danger-soft/35 ring-1 ring-inset ring-red-200"
          : vurgulu
            ? "border-red-200 bg-danger-soft/25"
            : "border-line",
      )}
    >
      {/* Üst şerit: yol (mono) + hassas kilit + seviye rozeti + abuse skoru */}
      <div className="mb-3.5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="grid size-9 shrink-0 place-items-center rounded-xl ring-1 ring-inset"
            style={{
              background: `${seviye.hex}14`,
              color: seviye.hex,
              borderColor: `${seviye.hex}33`,
            }}
          >
            <ServerCog className="size-[18px]" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <code
                className="truncate rounded bg-canvas px-1.5 py-0.5 font-mono text-[12.5px] font-medium text-slate-ink ring-1 ring-inset ring-line"
                title={endpoint.yol}
              >
                {yolKisa(endpoint.yol)}
              </code>
              {endpoint.hassas && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
                    korunmasiz
                      ? "bg-danger-soft text-red-700 ring-red-200"
                      : "bg-warn-soft text-amber-700 ring-amber-200",
                  )}
                >
                  <Lock className="size-3" />
                  Hassas
                </span>
              )}
              <Badge ton={seviye.rozet}>
                {kritik && <Flame className="size-3" />}
                {seviye.ad}
              </Badge>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-faint">
              <Bot className="size-3" />
              <span className="tabular-nums">%{botYuzde} bot trafiği</span>
              <span className="text-slate-300">·</span>
              <span className="tabular-nums">{sayi(endpoint.toplamIstek)} istek</span>
            </p>
          </div>
        </div>

        {/* Kötüye-kullanım skoru pili */}
        <div className="flex shrink-0 flex-col items-end">
          <div className="flex items-baseline gap-1">
            <span className="text-[18px] font-bold tabular-nums leading-none" style={{ color: sRenk }}>
              {endpoint.abuseSkoru}
            </span>
            <span className="text-[11px] font-medium text-slate-faint">/100</span>
          </div>
          <span className="mt-0.5 text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">
            abuse skoru
          </span>
        </div>
      </div>

      {/* Korunmasız hassas uyarısı — hassas yol + yüksek kötüye-kullanım */}
      {korunmasiz && (
        <div className="mb-3.5 flex items-center gap-2.5 rounded-xl border border-red-300 bg-danger-soft px-3 py-2.5">
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-danger2 text-white">
            <AlertTriangle className="size-4" />
          </span>
          <div className="min-w-0">
            <span className="text-[12.5px] font-bold uppercase tracking-wide text-red-700">
              Korunmasız hassas yol
            </span>
            <p className="mt-0.5 text-[11.5px] leading-snug text-red-800">
              Kimlik/ödeme/API sınıfı bir endpoint yoğun bot baskısı altında — aşağıdaki rate-limit
              önerisi acilen uygulanmalı.
            </p>
          </div>
        </div>
      )}

      {/* Bot oranı ilerleme barı */}
      <div className="mb-3.5">
        <div className="mb-1.5 flex items-center justify-between text-[11px]">
          <span className="inline-flex items-center gap-1 font-medium uppercase tracking-wide text-slate-faint">
            <Bot className="size-3" />
            Bot oranı
          </span>
          <span className="font-semibold tabular-nums text-slate-ink">%{botYuzde}</span>
        </div>
        <Ilerleme deger={botYuzde} ton={botTon(endpoint.botOrani)} />
      </div>

      {/* Metrikler */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
        <Metrik ikon={Activity} etiket="Toplam istek">
          {sayi(endpoint.toplamIstek)}
        </Metrik>
        <Metrik ikon={Server} etiket="Benzersiz IP">
          {sayi(endpoint.benzersizIp)}
        </Metrik>
        <Metrik ikon={Bot} etiket="Bot oranı" ton={endpoint.botOrani >= 0.5 ? "danger" : "ink"}>
          %{botYuzde}
        </Metrik>
        <Metrik ikon={Users} etiket="IP başına istek">
          {sayi(endpoint.ipBasinaIstek)}
        </Metrik>
        <Metrik ikon={TrendingUp} etiket="Patlama katsayısı" ton={endpoint.patlama >= 4 ? "danger" : "ink"}>
          {sayi(endpoint.patlama)}×
        </Metrik>
        <Metrik ikon={Flame} etiket="En agresif IP" ton={endpoint.enAgresifIp >= 20 ? "danger" : "ink"}>
          {sayi(endpoint.enAgresifIp)}
          <span className="text-[11px] font-medium text-slate-faint">istek</span>
        </Metrik>
      </div>

      {/* En agresif IP adresi — mono */}
      {endpoint.enAgresifIpDeger && (
        <div className="mt-3.5 flex min-w-0 items-center gap-1.5 border-t border-line/70 pt-3">
          <span className="inline-flex shrink-0 items-center gap-1 text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">
            <Flame className="size-3" />
            En agresif kaynak
          </span>
          <code className="truncate rounded bg-canvas px-1.5 py-0.5 font-mono text-[11.5px] text-slate-muted ring-1 ring-inset ring-line">
            {endpoint.enAgresifIpDeger}
          </code>
        </div>
      )}

      {/* Önerilen rate-limit kutusu */}
      <RateOneriKutu oneri={endpoint.oneri} />
    </div>
  );
}

/* ================================================================== Ana bileşen */

export function ApiAbuseBolumu({ rapor, azHareket }: { rapor: ApiAbuseRapor; azHareket: boolean }) {
  const { endpointler, ozet } = rapor;
  // Motor zaten abuseSkoru'na göre sıralı gönderir; ilk 8'i göster.
  const gosterilecek = endpointler.slice(0, 8);
  const kotuyeVar = ozet.kritikYol > 0 || ozet.korunmasizHassas > 0;

  return (
    <Bolum azHareket={azHareket}>
      <Panel
        baslik={<BaslikIkon ikon={Gauge} metin="API Kötüye-Kullanım İstihbaratı" />}
        sagUst={
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-slate-faint">{sayi(ozet.toplamYol)} yol</span>
            <Badge ton={kotuyeVar ? "kirmizi" : "brand"}>
              <ServerCog className="size-3" />
              Rate-Limit
            </Badge>
          </div>
        }
      >
        {/* Açıklama — kilit fikir */}
        <p className="-mt-1 mb-4 max-w-2xl text-[13px] leading-relaxed text-slate-muted">
          <span className="font-medium text-slate-ink">Hangi endpoint&apos;ler bot yağmuru altında?</span>{" "}
          Veylify yol başına kötüye-kullanım skorlar — bot oranı × IP-başına yoğunluk × patlama ×
          hassaslık — ve her yol için meşru kullanıcıyı bozmadan bot patlamalarını kesecek bir{" "}
          <span className="font-medium text-slate-ink">token-bucket rate-limit önerir</span>.
        </p>

        {/* Özet şeridi */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <OzetHap ikon={ServerCog} etiket="Toplam yol" deger={sayi(ozet.toplamYol)} />
          <OzetHap
            ikon={Activity}
            etiket="Kötüye kullanılan"
            deger={sayi(ozet.kotuyeKullanilANYol)}
            ek="yol"
            ton={ozet.kotuyeKullanilANYol > 0 ? "warn" : "ink"}
          />
          <OzetHap
            ikon={Flame}
            etiket="Kritik yol"
            deger={sayi(ozet.kritikYol)}
            ton={ozet.kritikYol > 0 ? "danger" : "ink"}
          />
          <OzetHap
            ikon={Lock}
            etiket="Korunmasız hassas"
            deger={sayi(ozet.korunmasizHassas)}
            ton={ozet.korunmasizHassas > 0 ? "danger" : "ok"}
          />
        </div>

        {/* GÖRSEL 1 + 2 — dikey abuse bar + risk ısı matrisi (yan yana, iki farklı görsel) */}
        {gosterilecek.length > 0 && (
          <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Bolum azHareket={azHareket} gecikme={azHareket ? 0 : 0.05}>
              <TopAbuseBar endpointler={endpointler} azHareket={azHareket} />
            </Bolum>
            <Bolum azHareket={azHareket} gecikme={azHareket ? 0 : 0.08}>
              <RiskIsiMatris endpointler={endpointler} />
            </Bolum>
          </div>
        )}

        {/* Endpoint listesi — detay kartları */}
        {gosterilecek.length > 0 && (
          <div className="mt-6 mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-faint">
            <ServerCog className="size-3.5" />
            Yol başına detay + rate-limit önerisi
          </div>
        )}
        {gosterilecek.length === 0 ? (
          <div className="mt-5 grid place-items-center rounded-2xl border border-dashed border-line py-12 text-center">
            <ShieldCheck className="mb-2 size-7 text-ok" />
            <p className="text-[13px] font-medium text-slate-muted">Kötüye-kullanılan endpoint yok</p>
            <p className="mt-0.5 max-w-sm text-[12px] text-slate-faint">
              Yeterli hacimli bir yol ölçüldükçe Veylify kötüye-kullanımı skorlar ve buraya
              yol başına rate-limit önerisi çıkarır.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {gosterilecek.map((e, i) => (
              <Bolum key={e.yol} azHareket={azHareket} gecikme={azHareket ? 0 : 0.05 + i * 0.03}>
                <EndpointKart endpoint={e} azHareket={azHareket} />
              </Bolum>
            ))}
          </div>
        )}

        {/* Seviye lejantı + kilit vurgu */}
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4 text-[11px] text-slate-faint">
          <span className="font-medium uppercase tracking-wide">Kötüye-kullanım seviyesi:</span>
          {(["kritik", "yüksek", "orta", "düşük"] as EndpointAbuse["seviye"][]).map((s) => {
            const t = SEVIYE_TANIM[s];
            return (
              <span key={s} className="inline-flex items-center gap-1.5 text-slate-muted">
                <span className="size-2.5 rounded-full" style={{ background: t.hex }} />
                {t.ad}
              </span>
            );
          })}
          <span className="ml-auto inline-flex items-center gap-1.5 font-medium text-brand-700">
            <Gauge className="size-3.5" />
            token-bucket: dakika-limit + burst + aşım aksiyonu
          </span>
        </div>
      </Panel>
    </Bolum>
  );
}
