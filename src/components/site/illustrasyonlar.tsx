"use client";

/**
 * Veylify landing illüstrasyon kütüphanesi — hepsi elle çizilmiş, offline,
 * keskin SVG. Beyaz tema + indigo/violet marka. Çok-sayfalı landing'in her
 * sayfası kendi zengin görselini buradan alır (foto yerine premium vektör).
 */
import {
  Eye, Fingerprint, GitBranch, Lock, Bot, Globe, Gauge, Layers,
  ShieldCheck, Server, Cpu, Radio, Network, Activity, Zap,
} from "lucide-react";

/* ---------------------------------------------------- Akış diyagramı: istek → katmanlar → karar */
export function AkisDiyagram() {
  const katmanlar = [
    { ikon: Radio, ad: "Edge hız sınırı", renk: "#0891b2" },
    { ikon: Globe, ad: "IP & ASN itibarı", renk: "#4f46e5" },
    { ikon: Fingerprint, ad: "TLS parmak izi", renk: "#7c3aed" },
    { ikon: Eye, ad: "Ghost-font", renk: "#db2777" },
    { ikon: Activity, ad: "Davranış skoru", renk: "#dc2626" },
  ];
  return (
    <div className="rounded-3xl border border-veylify-100 bg-white p-6 shadow-[0_24px_64px_-32px_rgba(79,70,229,0.3)]">
      <div className="mb-5 flex items-center justify-between">
        <span className="flex items-center gap-2 text-[13px] font-semibold text-veylify-950">
          <Network className="size-4 text-veylify-600" /> Katmanlı savunma hunisi
        </span>
        <span className="rounded-full bg-veylify-50 px-2.5 py-1 text-[11px] font-semibold text-veylify-600 ring-1 ring-veylify-100">
          1.028 istek
        </span>
      </div>
      <div className="space-y-2">
        {katmanlar.map((k, i) => {
          const genislik = 100 - i * 15;
          return (
            <div key={k.ad} className="flex flex-col items-center">
              <div
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-white transition"
                style={{ width: `${genislik}%`, background: `linear-gradient(90deg, ${k.renk}, ${k.renk}cc)` }}
              >
                <k.ikon className="size-4 shrink-0" />
                <span className="text-[13px] font-semibold">{k.ad}</span>
                <span className="ml-auto text-[12px] font-medium tabular-nums text-white/80">
                  %{[16, 41, 24, 19, 100][i]} yakaladı
                </span>
              </div>
              {i < katmanlar.length - 1 && (
                <span className="my-0.5 text-[10px] font-medium text-slate-400">↓ geçti</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 py-2.5 text-[12.5px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
        <ShieldCheck className="size-4" /> Sıfır sızıntı — her tehdit bir katmanda durduruldu
      </div>
    </div>
  );
}

/* ---------------------------------------------------- Mimari şema: SDK → edge → panel */
export function MimariSema() {
  const dugumler = [
    { ikon: Server, ad: "Siteniz", alt: "script / API" },
    { ikon: Zap, ad: "Veylify Edge", alt: "48ms karar" },
    { ikon: Gauge, ad: "Panel", alt: "canlı analitik" },
  ];
  return (
    <div className="rounded-3xl border border-veylify-100 bg-gradient-to-br from-veylify-50/60 to-white p-8">
      <div className="flex items-center justify-between gap-3">
        {dugumler.map((d, i) => (
          <div key={d.ad} className="flex flex-1 items-center gap-3">
            <div className="flex flex-1 flex-col items-center gap-2 text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-white text-veylify-600 shadow-[0_12px_28px_-14px_rgba(79,70,229,0.5)] ring-1 ring-veylify-100">
                <d.ikon className="size-6" />
              </span>
              <div>
                <div className="text-[13px] font-bold text-veylify-950">{d.ad}</div>
                <div className="text-[11px] text-slate-500">{d.alt}</div>
              </div>
            </div>
            {i < dugumler.length - 1 && (
              <svg width="40" height="12" viewBox="0 0 40 12" className="shrink-0" aria-hidden>
                <path d="M0 6h32m0 0-5-4m5 4-5 4" stroke="#a5b4fc" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------- İzometrik kalkan sahnesi (hero için) */
export function KalkanSahne() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-md">
      <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-veylify-200/50 to-violet-200/40 blur-3xl" />
      <svg viewBox="0 0 400 400" className="relative w-full" aria-hidden>
        <defs>
          <linearGradient id="ks-shield" x1="80" y1="40" x2="320" y2="360">
            <stop stopColor="#6366f1" />
            <stop offset="0.55" stopColor="#4f46e5" />
            <stop offset="1" stopColor="#7c3aed" />
          </linearGradient>
          <radialGradient id="ks-glow" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#c7d2fe" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#c7d2fe" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="200" cy="180" r="150" fill="url(#ks-glow)" />
        {/* yörünge halkaları */}
        {[110, 140, 170].map((r, i) => (
          <circle key={r} cx="200" cy="190" r={r} fill="none" stroke="#c7d2fe" strokeWidth="1.5" strokeDasharray={i === 1 ? "4 6" : undefined} opacity="0.5" />
        ))}
        {/* kalkan */}
        <path d="M200 60 110 96v88c0 74 48 132 90 160 42-28 90-86 90-160V96L200 60Z" fill="url(#ks-shield)" />
        <ellipse cx="200" cy="170" rx="52" ry="38" fill="#ffffff" fillOpacity="0.95" />
        <circle cx="200" cy="170" r="26" fill="#c7d2fe" />
        <circle cx="200" cy="170" r="12" fill="#312e81" />
        <circle cx="210" cy="160" r="5" fill="#eef2ff" />
        <path d="M155 232h90l-90 40h90" stroke="#fff" strokeOpacity="0.8" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* yörüngedeki bot ikonları — bazıları engelli (kırmızı) */}
        <g>
          <circle cx="90" cy="190" r="14" fill="#fee2e2" stroke="#dc2626" strokeWidth="2" />
          <circle cx="310" cy="190" r="14" fill="#fee2e2" stroke="#dc2626" strokeWidth="2" />
          <circle cx="200" cy="20" r="12" fill="#dcfce7" stroke="#16a34a" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

/* ---------------------------------------------------- Özellik ikon ızgarası (dekoratif) */
export function OzellikIzgara() {
  const ikonlar = [Eye, Fingerprint, GitBranch, Lock, Bot, Globe, Gauge, Layers, ShieldCheck, Cpu, Radio, Activity];
  return (
    <div className="grid grid-cols-4 gap-3">
      {ikonlar.map((Ikon, i) => (
        <span
          key={i}
          className="grid aspect-square place-items-center rounded-2xl border border-veylify-100 bg-white text-veylify-500 transition hover:border-veylify-300 hover:text-veylify-600"
          style={{ opacity: 0.5 + (i % 4) * 0.16 }}
        >
          <Ikon className="size-6" />
        </span>
      ))}
    </div>
  );
}

/* ---------------------------------------------------- Sayısal vurgu şeridi */
export function VuruStat({ deger, etiket }: { deger: string; etiket: string }) {
  return (
    <div className="rounded-2xl border border-veylify-100 bg-white p-5 text-center">
      <div className="bg-gradient-to-r from-veylify-600 to-violet-600 bg-clip-text text-3xl font-extrabold tabular-nums text-transparent">
        {deger}
      </div>
      <div className="mt-1 text-[12.5px] font-medium text-slate-500">{etiket}</div>
    </div>
  );
}
