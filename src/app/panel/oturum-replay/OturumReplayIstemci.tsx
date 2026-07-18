"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Play, Pause, SkipForward, RotateCcw, Fingerprint, Clock, Activity, ShieldX,
  ShieldCheck, Bot, Search, ArrowRight, AlertTriangle, MapPin, Gauge, Zap, Radar,
} from "lucide-react";
import { Panel, StatKart, Badge, Ulke, useToast } from "@/components/panel/kit";
import type { Oturum, OturumOzet, OturumAdim } from "@/lib/specter/oturum-replay";
import type { Dil } from "@/lib/i18n/panel";
import { oturumReplayCeviri, OR_YEREL } from "./oturum-replay.i18n";
import { cn } from "@/lib/cn";

type Cevir = (k: string) => string;

// Bot sınıfı enum → yerelleştirilmiş etiket (değer enum/veri; etiket çevrilir).
function botEtiket(sinif: string, t: Cevir): string {
  const bilinen = ["human", "good_bot", "automation", "scraper", "credential_stuffing", "ai_agent", "ddos", "spam"];
  return bilinen.includes(sinif) ? t(`or.bot.${sinif}`) : sinif;
}

function sure(ms: number, t: Cevir): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return t("or.sure.sn").replace("{n}", String(s));
  const d = Math.floor(s / 60), k = s % 60;
  return t("or.sure.dksn").replace("{d}", String(d)).replace("{k}", String(k));
}

export function OturumReplayIstemci({ oturumlar, ozet, dil }: { oturumlar: Oturum[]; ozet: OturumOzet; dil: Dil }) {
  const t = (k: string) => oturumReplayCeviri(k, dil);
  const [secili, setSecili] = useState<Oturum | null>(oturumlar[0] ?? null);
  const [sorgu, setSorgu] = useState("");

  const filtreli = oturumlar.filter((o) =>
    !sorgu || `${o.ip} ${o.country} ${o.asn} ${o.dominantBotClass} ${o.yollar.join(" ")}`.toLowerCase().includes(sorgu.toLowerCase()),
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* açıklama */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Radar className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("or.serit.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {t("or.serit.aciklama")}
          </p>
        </div>
      </div>

      {/* özet */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={ozet.toplamOturum} etiket={t("or.ozet.toplam")} ikon={<Activity className="size-5" />} />
        <StatKart sayi={ozet.botOturum} etiket={t("or.ozet.bot")} ikon={<Bot className="size-5" />} tone="danger" />
        <StatKart sayi={ozet.supheliOturum} etiket={t("or.ozet.supheli")} ikon={<ShieldX className="size-5" />} tone="warn" />
        <StatKart sayi={ozet.ortAdim} etiket={t("or.ozet.ortAdim")} ikon={<Zap className="size-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* oturum listesi */}
        <Panel baslik={t("or.liste.baslik")} padding={false}>
          <div className="border-b border-line px-4 py-3">
            <div className="flex items-center gap-2 rounded-xl border border-line bg-canvas px-3 py-2">
              <Search className="size-4 text-slate-faint" />
              <input value={sorgu} onChange={(e) => setSorgu(e.target.value)} placeholder={t("or.liste.ara")} className="w-full bg-transparent text-[13px] outline-none" aria-label={t("or.liste.araAria")} />
            </div>
          </div>
          <div className="max-h-[560px] divide-y divide-line overflow-y-auto">
            {filtreli.length === 0 && <p className="py-8 text-center text-sm text-slate-muted">{t("or.liste.bulunamadi")}</p>}
            {filtreli.map((o) => (
              <button key={o.id} onClick={() => setSecili(o)} className={cn("flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-canvas/50", secili?.id === o.id && "bg-brand-50/40")}>
                <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", o.tehditSkoru >= 60 ? "bg-danger-soft text-danger2" : o.tehditSkoru >= 30 ? "bg-warn-soft text-amber-700" : "bg-ok-soft text-ok")}>
                  {o.dominantBotClass === "human" ? <ShieldCheck className="size-4" /> : <Bot className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[13px]">
                    <span className="num font-semibold text-slate-ink">{o.ip}</span>
                    <Ulke kod={o.country} />
                  </div>
                  <div className="truncate text-[11.5px] text-slate-faint">{botEtiket(o.dominantBotClass, t)} · {t("or.liste.adim").replace("{n}", String(o.adimSayisi))} · {sure(o.sureMs, t)}</div>
                </div>
                <span className="num shrink-0 text-[13px] font-bold" style={{ color: o.tehditSkoru >= 60 ? "#dc2626" : o.tehditSkoru >= 30 ? "#d97706" : "#16a34a" }}>{o.tehditSkoru}</span>
              </button>
            ))}
          </div>
        </Panel>

        {/* replay */}
        {secili ? <OturumReplay oturum={secili} key={secili.id} dil={dil} t={t} /> : (
          <Panel baslik={t("or.detay.baslik")}><p className="py-10 text-center text-sm text-slate-muted">{t("or.detay.bosSec")}</p></Panel>
        )}
      </div>
    </div>
  );
}

function OturumReplay({ oturum, dil, t }: { oturum: Oturum; dil: Dil; t: Cevir }) {
  const yerel = OR_YEREL[dil];
  const { goster } = useToast();
  const [adimIdx, setAdimIdx] = useState(0);
  const [oynuyor, setOynuyor] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Oynatma: her adımı ~1.1sn'de bir ilerlet.
  useEffect(() => {
    if (!oynuyor) return;
    if (adimIdx >= oturum.adimlar.length - 1) { setOynuyor(false); return; }
    timerRef.current = setTimeout(() => setAdimIdx((i) => Math.min(i + 1, oturum.adimlar.length - 1)), 1100);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [oynuyor, adimIdx, oturum.adimlar.length]);

  const aktif = oturum.adimlar[adimIdx];

  return (
    <div className="space-y-6">
      {/* oturum başlığı + kontroller */}
      <Panel baslik={t("or.replay.baslik")}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="num text-[17px] font-bold text-slate-ink">{oturum.ip}</span>
              <Ulke kod={oturum.country} />
              <Badge ton={oturum.tehditSkoru >= 60 ? "kirmizi" : oturum.tehditSkoru >= 30 ? "sari" : "yesil"}>{t("or.replay.tehdit").replace("{n}", String(oturum.tehditSkoru))}</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-slate-muted">
              <span className="flex items-center gap-1"><MapPin className="size-3.5" /> {oturum.asn}</span>
              <span className="flex items-center gap-1"><Fingerprint className="size-3.5" /> {oturum.fingerprint.slice(0, 16)}</span>
              <span className="flex items-center gap-1"><Clock className="size-3.5" /> {sure(oturum.sureMs, t)} · {t("or.replay.adimSayi").replace("{n}", String(oturum.adimSayisi))}</span>
              <span className="flex items-center gap-1"><Gauge className="size-3.5" /> {t("or.replay.ortAralik").replace("{n}", String(oturum.ortAralik))}</span>
            </div>
          </div>
          <Link href={`/panel/tehdit/${encodeURIComponent(oturum.ip)}`} className="flex items-center gap-1 text-[13px] font-medium text-brand-600 hover:text-brand-700">{t("or.replay.ipIstihbarat")} <ArrowRight className="size-3.5" /></Link>
        </div>

        {/* şüphe sinyalleri */}
        {oturum.supheSinyaller.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {oturum.supheSinyaller.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-2.5 py-1 text-[11.5px] font-medium text-danger2"><AlertTriangle className="size-3" /> {s}</span>
            ))}
          </div>
        )}

        {/* oynatma kontrolleri */}
        <div className="mt-5 flex items-center gap-3">
          <button onClick={() => setOynuyor((v) => !v)} className="flex items-center gap-1.5 rounded-full bg-ink-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-ink-800">
            {oynuyor ? <><Pause className="size-4" /> {t("or.replay.duraklat")}</> : <><Play className="size-4" /> {t("or.replay.oynat")}</>}
          </button>
          <button onClick={() => setAdimIdx((i) => Math.min(i + 1, oturum.adimlar.length - 1))} className="grid size-9 place-items-center rounded-full bg-canvas text-slate-muted transition hover:text-slate-ink" aria-label={t("or.replay.sonraki")}><SkipForward className="size-4" /></button>
          <button onClick={() => { setAdimIdx(0); setOynuyor(false); }} className="grid size-9 place-items-center rounded-full bg-canvas text-slate-muted transition hover:text-slate-ink" aria-label={t("or.replay.basaSar")}><RotateCcw className="size-4" /></button>
          <div className="flex-1">
            <div className="h-1.5 overflow-hidden rounded-full bg-canvas">
              <div className="h-full rounded-full bg-brand-600 transition-all duration-300" style={{ width: `${((adimIdx + 1) / oturum.adimlar.length) * 100}%` }} />
            </div>
          </div>
          <span className="num text-[12px] font-semibold text-slate-muted">{adimIdx + 1} / {oturum.adimlar.length}</span>
        </div>
      </Panel>

      {/* aktif adım kartı */}
      <div className={cn("overflow-hidden rounded-3xl border p-5 transition", aktif.verdict === "blocked" ? "border-danger-soft bg-danger-soft/20" : aktif.verdict === "allowed" ? "border-green-200 bg-ok-soft/40" : "border-warn-soft bg-warn-soft/20")}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-faint">{t("or.adim.baslik").replace("{n}", String(adimIdx + 1))}</span>
          <span className="num text-[12px] text-slate-muted">{new Date(aktif.ts).toLocaleTimeString(yerel)}{aktif.delta > 0 && t("or.adim.artiSn").replace("{n}", String(Math.round(aktif.delta / 1000)))}</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="rounded-lg bg-white/70 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-ink">{aktif.method}</span>
          <span className="num text-[15px] font-semibold text-slate-ink">{aktif.path}</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat etiket={t("or.adim.karar")} deger={aktif.verdict} tone={aktif.verdict} t={t} />
          <MiniStat etiket={t("or.adim.skor")} deger={aktif.score.toFixed(2)} t={t} />
          <MiniStat etiket={t("or.adim.sinif")} deger={botEtiket(aktif.botClass, t)} t={t} />
          <MiniStat etiket={t("or.adim.gecikme")} deger={`${aktif.latency}ms`} t={t} />
        </div>
        {aktif.triggeredRules.length > 0 && (
          <div className="mt-3 text-[12px] text-slate-muted">{t("or.adim.tetiklenen")} {aktif.triggeredRules.map((r) => <span key={r} className="mr-1 rounded bg-white/70 px-1.5 py-0.5 font-mono text-[11px] text-slate-ink">{r}</span>)}</div>
        )}
        {aktif.sinyaller.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">{aktif.sinyaller.map((s) => <span key={s} className="rounded-full bg-white/60 px-2 py-0.5 text-[11px] text-slate-muted">{s}</span>)}</div>
        )}
      </div>

      {/* tam adım zaman çizelgesi */}
      <Panel baslik={t("or.cizelge.baslik")} padding={false}>
        <div className="px-6 py-2">
          {oturum.adimlar.map((a, i) => (
            <button key={i} onClick={() => { setAdimIdx(i); setOynuyor(false); }} className={cn("flex w-full items-center gap-3 border-l-2 py-2.5 pl-4 text-left transition", i === adimIdx ? "border-brand-600 bg-brand-50/40" : i < adimIdx ? "border-line-strong opacity-70" : "border-line")}>
              <span className={cn("grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold", a.verdict === "blocked" ? "bg-danger-soft text-danger2" : a.verdict === "allowed" ? "bg-ok-soft text-ok" : "bg-warn-soft text-amber-700")}>{i + 1}</span>
              <span className="num w-16 shrink-0 text-[11px] text-slate-faint">{new Date(a.ts).toLocaleTimeString(yerel)}</span>
              <span className="min-w-0 flex-1 truncate text-[13px] text-slate-ink"><span className="font-mono text-[11px] text-slate-faint">{a.method}</span> {a.path}</span>
              <VerdictNokta verdict={a.verdict} />
            </button>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function MiniStat({ etiket, deger, tone, t }: { etiket: string; deger: string; tone?: string; t: Cevir }) {
  const renk = tone === "blocked" ? "text-danger2" : tone === "allowed" ? "text-ok" : tone === "challenged" ? "text-amber-700" : "text-slate-ink";
  // verdict enum → yerelleştirilmiş etiket (değer enum; gösterim çevrilir).
  const etiketGoster = tone === "blocked" ? t("or.verdict.blocked") : tone === "allowed" ? t("or.verdict.allowed") : tone === "challenged" ? t("or.verdict.challenged") : tone === "flagged" ? t("or.verdict.flagged") : deger;
  return (
    <div className="rounded-xl bg-white/60 px-3 py-2">
      <div className="text-[10px] font-medium uppercase tracking-wide text-slate-faint">{etiket}</div>
      <div className={cn("mt-0.5 text-[13px] font-semibold", renk)}>{tone ? etiketGoster : deger}</div>
    </div>
  );
}

function VerdictNokta({ verdict }: { verdict: string }) {
  const renk = verdict === "blocked" ? "#dc2626" : verdict === "allowed" ? "#16a34a" : verdict === "challenged" ? "#d97706" : "#94a3b8";
  return <span className="size-2 shrink-0 rounded-full" style={{ background: renk }} title={verdict} />;
}

export type { OturumAdim };
