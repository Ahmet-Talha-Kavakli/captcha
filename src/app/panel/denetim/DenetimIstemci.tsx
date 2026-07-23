"use client";

import { useState, useMemo } from "react";
import {
  FileCheck, Search, Download, ShieldCheck, AlertTriangle, Users2, Activity,
  ChevronRight, Link2, ArrowRight, Lock, FileText, LogIn, Globe, Filter,
  KeyRound, Webhook as WebhookIcon, CreditCard, Bot, Layers,
} from "lucide-react";
import {
  PanelBaslik, Panel, StatKart, Badge, BosDurum, Avatar, Tooltip,
} from "@/components/panel/kit";
import { DonutDagilim } from "@/components/panel/grafikler";
import { Gauge as GaugeGost, Histogram } from "@/components/panel/grafikler-ek";
import { Button } from "@/components/ui/Button";
import { exportCsv } from "@/lib/csv";
import { cn } from "@/lib/cn";
import { denetimCeviri } from "./denetim.i18n";
import type { Dil } from "@/lib/i18n/panel";

/** t yardımcısının tipi. */
type Ceviri = (anahtar: string) => string;

type Kategori = "auth" | "site" | "rule" | "team" | "ai-policy" | "billing" | "token" | "webhook" | "admin";

interface Log {
  id: string;
  actorName: string;
  action: string;
  target: string;
  ts: number;
  ip: string;
  category: Kategori;
  seq: number;
  hash: string;
  prevHash: string;
  critical: boolean;
  onceki: string | null;
  sonraki: string | null;
  meta: Record<string, string> | null;
}

/* Kategori görsel kimliği: renk + ikon. Etiket enum → i18n anahtarı ile çevrilir. */
const KAT_META: Record<Kategori, { renk: string; ton: "brand" | "gri" | "yesil" | "sari" | "kirmizi" | "mavi"; ikon: typeof LogIn }> = {
  auth: { renk: "#64748b", ton: "gri", ikon: LogIn },
  site: { renk: "#2f6fed", ton: "brand", ikon: Globe },
  rule: { renk: "#7c3aed", ton: "mavi", ikon: FileText },
  team: { renk: "#0891b2", ton: "mavi", ikon: Users2 },
  "ai-policy": { renk: "#d97706", ton: "sari", ikon: Bot },
  billing: { renk: "#16a34a", ton: "yesil", ikon: CreditCard },
  token: { renk: "#db2777", ton: "kirmizi", ikon: KeyRound },
  webhook: { renk: "#0d9488", ton: "yesil", ikon: WebhookIcon },
  admin: { renk: "#dc2626", ton: "kirmizi", ikon: Users2 },
};

/** Kategori enum değeri → çevrilebilir etiket anahtarı. Enum değeri asla çevrilmez. */
const KAT_ETIKET_ANAHTAR: Record<Kategori, string> = {
  auth: "dn.kat.auth",
  site: "dn.kat.site",
  rule: "dn.kat.rule",
  team: "dn.kat.team",
  "ai-policy": "dn.kat.ai-policy",
  billing: "dn.kat.billing",
  token: "dn.kat.token",
  webhook: "dn.kat.webhook",
  admin: "dn.kat.admin",
};
/** Kategorinin çevrilmiş etiketi (enum → anahtar). */
function katEtiket(t: Ceviri, k: Kategori): string {
  return t(KAT_ETIKET_ANAHTAR[k]);
}

/** Filtre çipleri — enum key sabit, etiket i18n anahtarıyla. token için kısa "API". */
const KATEGORILER: Array<{ key: "all" | Kategori; anahtar: string }> = [
  { key: "all", anahtar: "dn.katFiltre.tumu" },
  { key: "auth", anahtar: "dn.kat.auth" },
  { key: "site", anahtar: "dn.kat.site" },
  { key: "rule", anahtar: "dn.kat.rule" },
  { key: "team", anahtar: "dn.kat.team" },
  { key: "ai-policy", anahtar: "dn.kat.ai-policy" },
  { key: "token", anahtar: "dn.katKisa.token" },
  { key: "webhook", anahtar: "dn.kat.webhook" },
  { key: "billing", anahtar: "dn.kat.billing" },
];

const TARIH_ARALIK: Array<{ key: string; anahtar: string; gun: number }> = [
  { key: "1", anahtar: "dn.aralik.1", gun: 1 },
  { key: "7", anahtar: "dn.aralik.7", gun: 7 },
  { key: "30", anahtar: "dn.aralik.30", gun: 30 },
  { key: "all", anahtar: "dn.aralik.all", gun: 99999 },
];

function yasMetni(t: Ceviri, ts: number): string {
  const fark = Date.now() - ts;
  const dk = Math.floor(fark / 60000);
  if (dk < 1) return t("dn.zaman.azOnce");
  if (dk < 60) return t("dn.zaman.dk").replace("{n}", String(dk));
  const sa = Math.floor(dk / 60);
  if (sa < 24) return t("dn.zaman.sa").replace("{n}", String(sa));
  const g = Math.floor(sa / 24);
  return t("dn.zaman.gun").replace("{n}", String(g));
}

export function DenetimIstemci({ logs, dil }: { logs: Log[]; dil: Dil }) {
  const t = (k: string) => denetimCeviri(k, dil);
  const [q, setQ] = useState("");
  const [kat, setKat] = useState<"all" | Kategori>("all");
  const [aktor, setAktor] = useState("all");
  const [aralik, setAralik] = useState("30");
  const [acikId, setAcikId] = useState<string | null>(null);

  const aktorler = useMemo(
    () => Array.from(new Set(logs.map((l) => l.actorName))).sort(),
    [logs],
  );

  const aralikGun = TARIH_ARALIK.find((t) => t.key === aralik)?.gun ?? 30;
  const cutoff = Date.now() - aralikGun * 86400000;

  const filtreli = useMemo(() => {
    return logs.filter((l) => {
      if (l.ts < cutoff) return false;
      if (kat !== "all" && l.category !== kat) return false;
      if (aktor !== "all" && l.actorName !== aktor) return false;
      if (q) {
        const alt = q.toLocaleLowerCase("tr");
        const havuz = `${l.action} ${l.target} ${l.actorName} ${l.ip} ${l.onceki ?? ""} ${l.sonraki ?? ""}`.toLowerCase();
        if (!havuz.includes(alt)) return false;
      }
      return true;
    });
  }, [logs, q, kat, aktor, cutoff]);

  /* Üst özet — 30g penceresine göre (aralık filtresinden bağımsız, sabit özet). */
  const ozet = useMemo(() => {
    const pencere = Date.now() - 30 * 86400000;
    const son30 = logs.filter((l) => l.ts >= pencere);
    const kritik = son30.filter((l) => l.critical).length;
    const aktifAktor = new Set(son30.map((l) => l.actorName)).size;
    const katSay: Record<string, number> = {};
    for (const l of son30) katSay[l.category] = (katSay[l.category] ?? 0) + 1;
    return { toplam: son30.length, kritik, aktifAktor, katSay };
  }, [logs]);

  /* Donut segmentleri (en büyük 6 kategori). */
  const donutSeg = useMemo(() => {
    return Object.entries(ozet.katSay)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([k, v]) => ({
        etiket: KAT_ETIKET_ANAHTAR[k as Kategori] ? katEtiket(t, k as Kategori) : k,
        deger: v,
        renk: KAT_META[k as Kategori]?.renk ?? "#94a3b8",
      }));
  }, [ozet, dil]);

  /* Kritiklik histogramı — kategori başına olay adedi (görüntü türevi). */
  const kritikHist = useMemo(() => {
    return Object.entries(ozet.katSay)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([k, v]) => ({ etiket: katEtiket(t, k as Kategori), deger: v }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ozet, dil]);

  /* Kritik oranı — bütünlük gauge yanında rozet olarak. */
  const kritikOran = ozet.toplam ? Math.round((ozet.kritik / ozet.toplam) * 100) : 0;
  /* Zincir bütünlüğü göstergesi: değişmez defterde daima %100 (kesintisiz zincir). */
  const butunluk = 100;

  function csvAktar() {
    exportCsv(
      t("dn.csvAd"),
      filtreli.map((l) => ({
        [t("dn.csv.seq")]: l.seq,
        [t("dn.csv.zaman")]: new Date(l.ts).toISOString(),
        [t("dn.csv.aktor")]: l.actorName,
        [t("dn.csv.kategori")]: KAT_ETIKET_ANAHTAR[l.category] ? katEtiket(t, l.category) : l.category,
        [t("dn.csv.islem")]: l.action,
        [t("dn.csv.hedef")]: l.target,
        [t("dn.csv.onceki")]: l.onceki ?? "",
        [t("dn.csv.sonraki")]: l.sonraki ?? "",
        [t("dn.csv.kritik")]: l.critical ? t("dn.csv.evet") : t("dn.csv.hayir"),
        [t("dn.csv.ip")]: l.ip,
        [t("dn.csv.hash")]: l.hash,
        [t("dn.csv.oncekiHash")]: l.prevHash,
      })),
    );
  }

  /* Uyum denetim raporu — imzalı .txt (hash zinciri + özet). */
  function raporAktar() {
    const cizgi = "=".repeat(72);
    const satirlar: string[] = [];
    satirlar.push(cizgi);
    satirlar.push(`  ${t("dn.rap.baslik")}`);
    satirlar.push(`  ${t("dn.rap.olusturulma").replace("{tarih}", new Date().toLocaleString("tr-TR"))}`);
    satirlar.push(`  ${t("dn.rap.kapsam").replace("{kapsam}", t(TARIH_ARALIK.find((x) => x.key === aralik)?.anahtar ?? "dn.aralik.30")).replace("{adet}", String(filtreli.length))}`);
    satirlar.push(cizgi);
    satirlar.push("");
    satirlar.push(`  ${t("dn.rap.ozet")}`);
    satirlar.push(`    ${t("dn.rap.toplamIslem").padEnd(18)}: ${ozet.toplam}`);
    satirlar.push(`    ${t("dn.rap.kritikIslem").padEnd(18)}: ${ozet.kritik}`);
    satirlar.push(`    ${t("dn.rap.aktifAktor").padEnd(18)}: ${ozet.aktifAktor}`);
    satirlar.push("");
    satirlar.push(`  ${t("dn.rap.degismezlik1")}`);
    satirlar.push(`  ${t("dn.rap.degismezlik2")}`);
    satirlar.push("");
    satirlar.push(cizgi);
    for (const l of [...filtreli].sort((a, b) => a.seq - b.seq)) {
      satirlar.push(`  #${String(l.seq).padStart(3, "0")}  ${new Date(l.ts).toLocaleString("tr-TR")}${l.critical ? `  [${t("dn.rap.kritikEtiket")}]` : ""}`);
      satirlar.push(`        ${t("dn.rap.aktor")} : ${l.actorName}  (${l.ip})`);
      satirlar.push(`        ${t("dn.rap.islem")} : ${l.action} → ${l.target}`);
      if (l.onceki || l.sonraki) satirlar.push(`        ${t("dn.rap.deger")} : ${l.onceki ?? "—"}  →  ${l.sonraki ?? "—"}`);
      if (l.meta) satirlar.push(`        ${t("dn.rap.meta")}  : ${Object.entries(l.meta).map(([k, v]) => `${k}=${v}`).join(", ")}`);
      satirlar.push(`        ${t("dn.rap.hash")}  : ${l.hash}   ⟵ ${t("dn.rap.prev")}: ${l.prevHash}`);
      satirlar.push("");
    }
    satirlar.push(cizgi);
    satirlar.push(`  ${t("dn.rap.son")}`);
    satirlar.push(cizgi);
    const blob = new Blob(["﻿" + satirlar.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${t("dn.rapAd")}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* Gün gruplu zaman çizelgesi. */
  const gunGruplu = useMemo(() => {
    const gruplar = new Map<string, Log[]>();
    for (const l of filtreli) {
      const g = new Date(l.ts).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
      if (!gruplar.has(g)) gruplar.set(g, []);
      gruplar.get(g)!.push(l);
    }
    return Array.from(gruplar.entries());
  }, [filtreli]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      <PanelBaslik
        aciklama={t("dn.aciklama")}
        aksiyon={
          <>
            <Button variant="outline" size="sm" onClick={csvAktar}>
              <Download className="size-4" /> {t("dn.csv")}
            </Button>
            <Button variant="primary" size="sm" onClick={raporAktar}>
              <FileText className="size-4" /> {t("dn.rapor")}
            </Button>
          </>
        }
      />

      {/* Üst özet */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={ozet.toplam.toLocaleString("tr-TR")} etiket={t("dn.stat.islem")} ikon={<Activity className="size-5" />} />
        <StatKart sayi={ozet.kritik.toLocaleString("tr-TR")} etiket={t("dn.stat.kritik")} ikon={<AlertTriangle className="size-5" />} tone={ozet.kritik > 0 ? "warn" : undefined} />
        <StatKart sayi={ozet.aktifAktor} etiket={t("dn.stat.aktor")} ikon={<Users2 className="size-5" />} />
        <StatKart sayi="WORM" etiket={t("dn.stat.worm")} ikon={<Lock className="size-5" />} tone="ok" />
      </div>

      {/* Zincir bütünlüğü + kategori dağılımı + kritiklik */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Bütünlük göstergesi — yeşil gauge + rozet */}
        <Panel baslik={t("dn.butunluk")}>
          <div className="flex flex-col items-center pt-1 text-center">
            <GaugeGost deger={butunluk} boyut={168} renk="#16a34a" etiket={t("dn.butunlukEtiket")} />
            <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-ok-soft px-3 py-1 text-[12px] font-semibold text-green-700 ring-1 ring-inset ring-green-200">
              <ShieldCheck className="size-3.5" /> {t("dn.butunlukSaglam")}
            </span>
            <p className="mt-3 max-w-[240px] text-[12.5px] leading-relaxed text-slate-muted">{t("dn.butunlukAciklama")}</p>
            <div className="mt-3 flex w-full items-center justify-center gap-1.5 font-mono text-[11px] text-slate-faint">
              <Lock className="size-3 text-brand-600" />
              <span className="tabular-nums text-slate-muted">{ozet.toplam.toLocaleString("tr-TR")}</span>
              <span>{t("dn.zincirKayit")}</span>
            </div>
          </div>
        </Panel>

        {/* Kategori dağılımı — donut */}
        <Panel baslik={t("dn.kategoriDagilim")}>
          {donutSeg.length ? (
            <DonutDagilim segmentler={donutSeg} />
          ) : (
            <p className="py-8 text-center text-sm text-slate-faint">{t("dn.henuzKayitYok")}</p>
          )}
        </Panel>

        {/* Kritiklik dağılımı — histogram + oran */}
        <Panel baslik={t("dn.kritiklikBaslik")}>
          {kritikHist.length ? (
            <>
              <Histogram kovalar={kritikHist} yukseklik={104} renk="#2f6fed" />
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4">
                <div>
                  <div className="flex items-center gap-1.5 text-[12px] text-slate-faint">
                    <AlertTriangle className="size-3 text-warn" /> {t("dn.kritiklikKritik")}
                  </div>
                  <div className="mt-0.5 text-[17px] font-semibold tabular-nums text-danger2">{ozet.kritik.toLocaleString("tr-TR")}</div>
                </div>
                <div>
                  <div className="text-[12px] text-slate-faint">{t("dn.kritikOran")}</div>
                  <div className="mt-0.5 text-[17px] font-semibold tabular-nums text-slate-ink">%{kritikOran}</div>
                </div>
              </div>
            </>
          ) : (
            <p className="py-8 text-center text-sm text-slate-faint">{t("dn.henuzKayitYok")}</p>
          )}
        </Panel>
      </div>

      {/* Değişmezlik açıklaması — hash zinciri vurgusu */}
      <Panel baslik={t("dn.degismezlik")}>
        <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-4 py-3.5">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand-600" />
            <p className="text-[13px] leading-relaxed text-brand-800">
              {t("dn.degismezlikMetin1")} <span className="font-semibold">{t("dn.degismezlikSha")}</span>{t("dn.degismezlikMetin2")}
              <span className="font-semibold"> {t("dn.degismezlikHashZinciri")}</span> {t("dn.degismezlikMetin3")}
            </p>
          </div>
          <div className="space-y-2 font-mono text-[11px]">
            {filtreli.slice(0, 4).map((l) => (
              <div key={l.id} className="flex items-center gap-2 rounded-lg border border-line bg-canvas/50 px-2.5 py-1.5 text-slate-muted">
                <span className="rounded bg-surface px-1.5 py-0.5 font-semibold text-slate-ink">#{l.seq}</span>
                <span className="truncate text-brand-600">{l.hash}</span>
                <Link2 className="size-3 shrink-0 text-slate-faint" />
                <span className="truncate text-slate-faint">{l.prevHash.slice(0, 10)}…</span>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      {/* Filtreler */}
      <Panel padding>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-faint" />
              <input
                aria-label={t("dn.araLabel")}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("dn.araPh")}
                className="h-10 w-full rounded-2xl border border-line-strong bg-surface pl-9 pr-3 text-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              />
            </div>
            <select
              value={aktor}
              onChange={(e) => setAktor(e.target.value)}
              aria-label={t("dn.aktorFiltreLabel")}
              className="h-10 rounded-2xl border border-line-strong bg-surface px-3 text-sm font-medium text-slate-ink outline-none transition focus:border-brand-400"
            >
              <option value="all">{t("dn.tumAktorler")}</option>
              {aktorler.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <div className="flex items-center gap-1 rounded-2xl border border-line-strong bg-surface p-1">
              {TARIH_ARALIK.map((ta) => (
                <button
                  key={ta.key}
                  onClick={() => setAralik(ta.key)}
                  className={cn(
                    "rounded-xl px-2.5 py-1.5 text-[13px] font-medium transition",
                    aralik === ta.key ? "bg-brand-600 text-white" : "text-slate-muted hover:bg-canvas",
                  )}
                >
                  {t(ta.anahtar)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Filter className="size-3.5 text-slate-faint" />
            {KATEGORILER.map((k) => (
              <button
                key={k.key}
                onClick={() => setKat(k.key)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[13px] font-medium transition",
                  kat === k.key ? "bg-ink-900 text-white" : "bg-canvas text-slate-muted hover:bg-slate-100",
                )}
              >
                {t(k.anahtar)}
              </button>
            ))}
          </div>
        </div>
      </Panel>

      {/* Zaman çizelgesi — gün gruplu, genişleyen satırlar */}
      {filtreli.length === 0 ? (
        <BosDurum ikon={<FileCheck className="size-8" />} baslik={t("dn.bosBaslik")} aciklama={t("dn.bosAciklama")} />
      ) : (
        <div className="space-y-6">
          {gunGruplu.map(([gun, kayitlar]) => (
            <div key={gun}>
              <div className="mb-2.5 flex items-center gap-3">
                <h3 className="text-[13px] font-semibold uppercase tracking-wide text-slate-faint">{gun}</h3>
                <div className="h-px flex-1 bg-line" />
                <span className="text-[12px] tabular-nums text-slate-faint">{t("dn.islemSay").replace("{n}", String(kayitlar.length))}</span>
              </div>
              <Panel padding={false}>
                <ul className="divide-y divide-line">
                  {kayitlar.map((l) => {
                    const km = KAT_META[l.category];
                    const Ikon = km.ikon;
                    const acik = acikId === l.id;
                    return (
                      <li key={l.id}>
                        <button
                          onClick={() => setAcikId(acik ? null : l.id)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-canvas/60"
                        >
                          <span
                            className="grid size-9 shrink-0 place-items-center rounded-xl"
                            style={{ background: `${km.renk}14`, color: km.renk }}
                          >
                            <Ikon className="size-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium text-slate-ink">{l.action}</span>
                              <Badge ton={km.ton}>{katEtiket(t, l.category)}</Badge>
                              {l.critical && (
                                <Tooltip metin={t("dn.kritikTip")}>
                                  <span className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-2 py-0.5 text-[11px] font-semibold text-red-700 ring-1 ring-inset ring-red-200">
                                    <AlertTriangle className="size-3" /> {t("dn.kritik")}
                                  </span>
                                </Tooltip>
                              )}
                            </div>
                            <div className="mt-0.5 truncate text-[13px] text-slate-muted">
                              <span className="text-slate-ink/80">{l.target}</span>
                              {(l.onceki || l.sonraki) && (
                                <span className="ml-2 inline-flex items-center gap-1 text-slate-faint">
                                  · {l.onceki ?? "—"} <ArrowRight className="size-3" /> <span className="font-medium text-slate-ink">{l.sonraki ?? "—"}</span>
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="hidden shrink-0 items-center gap-2 sm:flex">
                            <Avatar ad={l.actorName} boyut={22} />
                            <span className="text-[13px] text-slate-muted">{l.actorName}</span>
                          </div>
                          <span className="shrink-0 whitespace-nowrap text-[12px] tabular-nums text-slate-faint">
                            {yasMetni(t, l.ts)}
                          </span>
                          <ChevronRight className={cn("size-4 shrink-0 text-slate-faint transition", acik && "rotate-90")} />
                        </button>

                        {acik && (
                          <div className="border-t border-line bg-canvas/40 px-4 py-4 sm:pl-16">
                            <dl className="grid gap-x-6 gap-y-2.5 text-[13px] sm:grid-cols-2">
                              <div className="flex justify-between gap-3 border-b border-line/70 pb-2">
                                <dt className="text-slate-muted">{t("dn.detay.siraNo")}</dt>
                                <dd className="font-mono font-medium text-slate-ink">#{l.seq}</dd>
                              </div>
                              <div className="flex justify-between gap-3 border-b border-line/70 pb-2">
                                <dt className="text-slate-muted">{t("dn.detay.tamZaman")}</dt>
                                <dd className="tabular-nums text-slate-ink">{new Date(l.ts).toLocaleString("tr-TR")}</dd>
                              </div>
                              <div className="flex justify-between gap-3 border-b border-line/70 pb-2">
                                <dt className="text-slate-muted">{t("dn.detay.aktor")}</dt>
                                <dd className="text-slate-ink">{l.actorName}</dd>
                              </div>
                              <div className="flex justify-between gap-3 border-b border-line/70 pb-2">
                                <dt className="text-slate-muted">{t("dn.detay.kaynakIp")}</dt>
                                <dd className="font-mono text-slate-ink">{l.ip}</dd>
                              </div>
                              {(l.onceki || l.sonraki) && (
                                <div className="flex justify-between gap-3 border-b border-line/70 pb-2 sm:col-span-2">
                                  <dt className="text-slate-muted">{t("dn.detay.degisiklik")}</dt>
                                  <dd className="flex items-center gap-2 text-slate-ink">
                                    <span className="rounded bg-danger-soft px-1.5 py-0.5 text-[12px] text-red-700 line-through">{l.onceki ?? "—"}</span>
                                    <ArrowRight className="size-3.5 text-slate-faint" />
                                    <span className="rounded bg-ok-soft px-1.5 py-0.5 text-[12px] font-medium text-green-700">{l.sonraki ?? "—"}</span>
                                  </dd>
                                </div>
                              )}
                            </dl>

                            {l.meta && Object.keys(l.meta).length > 0 && (
                              <div className="mt-3">
                                <div className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-slate-faint">{t("dn.detay.meta")}</div>
                                <div className="flex flex-wrap gap-1.5">
                                  {Object.entries(l.meta).map(([k, v]) => (
                                    <span key={k} className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2 py-1 font-mono text-[11.5px]">
                                      <span className="text-slate-faint">{k}</span>
                                      <span className="text-slate-ink">{v}</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Hash zinciri vurgusu */}
                            <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-line bg-surface px-3.5 py-2.5">
                              <Lock className="mt-0.5 size-4 shrink-0 text-brand-600" />
                              <div className="min-w-0 space-y-0.5 font-mono text-[11.5px]">
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-faint">{t("dn.detay.kayitHash").replace("{seq}", String(l.seq))}</span>
                                  <span className="truncate text-brand-600">{l.hash}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-faint">
                                  <span>{t("dn.detay.oncekiHash")}</span>
                                  <span className="truncate">{l.prevHash}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            </div>
          ))}
          <div className="flex items-center justify-center gap-2 pt-1 text-[12px] text-slate-faint">
            <Layers className="size-3.5" />
            {t("dn.altBilgi").replace("{n}", String(filtreli.length))}
          </div>
        </div>
      )}
    </div>
  );
}
