"use client";

/**
 * Erişilebilirlik & WCAG Uyum Denetimi — istemci arayüzü.
 * ======================================================
 * Ghost-font CAPTCHA widget'ının + panelin WCAG 2.2 A/AA uyumunu ölçüt-bazında
 * (kanıtla) gösterir, gerçek renk kontrastı denetleyicisi ve klavye/ekran-okuyucu
 * kapsam listesi sunar. Skorlama saf lib'den (wcag.ts) gelir.
 */

import { useMemo, useState } from "react";
import * as Icons from "lucide-react";
import {
  Accessibility,
  Check,
  AlertTriangle,
  X,
  Minus,
  Download,
  FileText,
  ChevronDown,
  Volume2,
  TimerReset,
  Eye,
  Contrast,
  Sparkles,
} from "lucide-react";
import { Panel, StatKart, Badge, useToast } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { erisimCeviri } from "./erisim.i18n";
import {
  wcagSkoru,
  kontrastDegerlendir,
  ILKE_META,
  KAPSAM_LISTESI,
  KONTRAST_ONAYARLAR,
  type WcagKriter,
  type WcagIlke,
  type WcagDurum,
} from "@/lib/specter/wcag";

function LucideIkon({ name, className }: { name: string; className?: string }) {
  const Cmp = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name] ?? Icons.Circle;
  return <Cmp className={className} />;
}

// Durum enum'u → i18n anahtarı; görünen etiket t() ile çözülür (label-map değil key-map).
const DURUM_META: Record<WcagDurum, { anahtar: string; ikon: React.ReactNode; renk: string; badge: "yesil" | "sari" | "kirmizi" | "gri" }> = {
  karsilandi: { anahtar: "er.durum.karsilandi", ikon: <Check className="size-3.5" />, renk: "text-ok", badge: "yesil" },
  kismi: { anahtar: "er.durum.kismi", ikon: <AlertTriangle className="size-3.5" />, renk: "text-warn", badge: "sari" },
  karsilanmadi: { anahtar: "er.durum.karsilanmadi", ikon: <X className="size-3.5" />, renk: "text-danger2", badge: "kirmizi" },
  "gecerli-degil": { anahtar: "er.durum.gecerli-degil", ikon: <Minus className="size-3.5" />, renk: "text-slate-faint", badge: "gri" },
};

const skorRenk = (s: number) => (s >= 90 ? "#16a34a" : s >= 70 ? "#2f6fed" : s >= 50 ? "#d97706" : "#dc2626");

export function ErisimIstemci({ kriterler, dil }: { kriterler: WcagKriter[]; dil: Dil }) {
  const t = (k: string) => erisimCeviri(k, dil);
  const { goster } = useToast();
  const skor = useMemo(() => wcagSkoru(kriterler), [kriterler]);

  const [acikIlke, setAcikIlke] = useState<WcagIlke | null>("algilanabilir");
  const [acikKriter, setAcikKriter] = useState<string | null>(null);

  // Kontrast denetleyici durumu
  const [fg, setFg] = useState("#54657f");
  const [bg, setBg] = useState("#0c1526");
  const kontrast = useMemo(() => kontrastDegerlendir(fg, bg), [fg, bg]);

  const ilkeAnahtarlari: WcagIlke[] = ["algilanabilir", "isletilebilir", "anlasilabilir", "saglam"];

  function kanitIndir() {
    // Rapor çerçevesi (başlık, etiketler) çevrilir; ölçüt ad/açıklama/kanıt/öneri
    // ve KAPSAM_LISTESI açıklamaları wcag.ts VERİSİDİR — re-derive edilenler dışında
    // (ilke adı, durum etiketi, kapsam adı/açıklaması) TR nesir korunur.
    const satirlar: string[] = [];
    satirlar.push("=".repeat(74));
    satirlar.push(`  SPECTER — ${t("er.rapor.baslik")}`);
    satirlar.push(`  ${t("er.rapor.genel").replace("{genel}", String(skor.genel)).replace("{karsilandi}", String(skor.karsilandi)).replace("{toplam}", String(skor.toplam)).replace("{kismi}", String(skor.kismi))}`);
    satirlar.push(`  ${t("er.rapor.seviye").replace("{aSkor}", String(skor.seviyeA.skor)).replace("{aToplam}", String(skor.seviyeA.toplam)).replace("{aaSkor}", String(skor.seviyeAA.skor)).replace("{aaToplam}", String(skor.seviyeAA.toplam))}`);
    satirlar.push("=".repeat(74));
    satirlar.push("");
    for (const ilke of ilkeAnahtarlari) {
      const m = ILKE_META[ilke];
      const p = skor.ilkeler[ilke];
      const ilkeAd = t(`er.ilke.${ilke}.ad`);
      satirlar.push(`■ ${ilkeAd.toLocaleUpperCase(dil)} (${m.enAd}) — %${p.skor}  ${t("er.rapor.ilkeSayac").replace("{karsilandi}", String(p.karsilandi)).replace("{toplam}", String(p.toplam))}`);
      satirlar.push("-".repeat(74));
      for (const k of kriterler.filter((x) => x.ilke === ilke)) {
        satirlar.push(`  [${t(DURUM_META[k.durum].anahtar).toLocaleUpperCase(dil)}] ${k.id} (${k.seviye}) — ${k.ad}`);
        satirlar.push(`      ${k.aciklama}`);
        satirlar.push(`      ${t("er.rapor.kanit")}: ${k.kanit}`);
        if (k.oneri) satirlar.push(`      ${t("er.rapor.oneri")}: ${k.oneri}`);
        satirlar.push("");
      }
      satirlar.push("");
    }
    satirlar.push("=".repeat(74));
    satirlar.push(`  ${t("er.rapor.kapsamBaslik")}`);
    satirlar.push("-".repeat(74));
    KAPSAM_LISTESI.forEach((o, i) => {
      satirlar.push(`  [${t(DURUM_META[o.durum].anahtar).toLocaleUpperCase(dil)}] ${t(`er.kap.${i}.ad`)} (WCAG ${o.wcag})`);
      satirlar.push(`      ${t(`er.kap.${i}.aciklama`)}`);
    });
    satirlar.push("");
    satirlar.push("=".repeat(74));
    satirlar.push(`  ${t("er.rapor.dipnot1")}`);
    satirlar.push(`  ${t("er.rapor.dipnot2")}`);
    satirlar.push(`  ${t("er.rapor.olusturma")}: ${new Date().toISOString()}`);

    const blob = new Blob(["﻿" + satirlar.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "specter-wcag-erisilebilirlik-kanit.txt";
    a.click();
    URL.revokeObjectURL(url);
    goster({ tip: "basari", baslik: t("er.toast.indirildi") });
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* açıklama şeridi */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Accessibility className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("er.intro.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {t("er.intro.metin1")} <b>{t("er.intro.sesli")}</b>, <b>{t("er.intro.klavye")}</b>, <b>{t("er.intro.hareket")}</b>{" "}
            {t("er.intro.ve")} <b>{t("er.intro.arialive")}</b>{t("er.intro.metin2")}
          </p>
        </div>
      </div>

      {/* özet skor kartları */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={`%${skor.genel}`} etiket={t("er.ozet.genel")} ikon={<Accessibility className="size-5" />} tone={skor.genel >= 90 ? "ok" : "warn"} />
        <StatKart sayi={`%${skor.seviyeA.skor}`} etiket={t("er.ozet.seviyeA").replace("{n}", String(skor.seviyeA.toplam))} tone={skor.seviyeA.skor >= 90 ? "ok" : "warn"} />
        <StatKart sayi={`%${skor.seviyeAA.skor}`} etiket={t("er.ozet.seviyeAA").replace("{n}", String(skor.seviyeAA.toplam))} tone={skor.seviyeAA.skor >= 90 ? "ok" : "warn"} />
        <StatKart sayi={`${skor.karsilandi}/${skor.toplam}`} etiket={t("er.ozet.karsilanan")} ikon={<Check className="size-5" />} tone="ok" />
      </div>

      {/* büyük skor + ilke barları */}
      <Panel
        baslik={t("er.pour.baslik")}
        sagUst={<Button variant="outline" size="sm" onClick={kanitIndir}><Download className="size-4" /> {t("er.pour.rapor")}</Button>}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="flex items-center gap-4 rounded-2xl bg-canvas/50 p-5 lg:w-72 lg:shrink-0">
            <span className="num text-[46px] font-bold leading-none" style={{ color: skorRenk(skor.genel) }}>%{skor.genel}</span>
            <div>
              <div className="text-[14px] font-semibold text-slate-ink">{t("er.pour.genelSkor")}</div>
              <div className="text-[12.5px] text-slate-muted">{t("er.pour.dagilim").replace("{karsilandi}", String(skor.karsilandi)).replace("{kismi}", String(skor.kismi)).replace("{toplam}", String(skor.toplam))}</div>
            </div>
          </div>
          <div className="grid flex-1 gap-3 sm:grid-cols-2">
            {ilkeAnahtarlari.map((ilke) => {
              const m = ILKE_META[ilke];
              const p = skor.ilkeler[ilke];
              return (
                <div key={ilke} className="rounded-2xl border border-line bg-surface p-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-[13px] font-semibold text-slate-ink">
                      <span className="grid size-7 place-items-center rounded-lg text-white" style={{ background: m.renk }}>
                        <LucideIkon name={m.ikon} className="size-4" />
                      </span>
                      {t(`er.ilke.${ilke}.ad`)}
                    </span>
                    <span className="num text-[16px] font-bold" style={{ color: skorRenk(p.skor) }}>%{p.skor}</span>
                  </div>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-canvas">
                    <div className="h-full rounded-full transition-all" style={{ width: `${p.skor}%`, background: skorRenk(p.skor) }} />
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-faint">
                    <span className="flex items-center gap-1 text-ok"><Check className="size-3" /> {p.karsilandi}</span>
                    {p.kismi > 0 && <span className="flex items-center gap-1 text-warn"><AlertTriangle className="size-3" /> {p.kismi}</span>}
                    {p.karsilanmadi > 0 && <span className="flex items-center gap-1 text-danger2"><X className="size-3" /> {p.karsilanmadi}</span>}
                    <span className="ml-auto">{t("er.pour.olcut").replace("{n}", String(p.toplam))}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Panel>

      {/* ilke-bazlı kırılım: genişleyebilir ölçüt listeleri */}
      <Panel baslik={t("er.olcut.baslik")}>
        <div className="space-y-3">
          {ilkeAnahtarlari.map((ilke) => {
            const m = ILKE_META[ilke];
            const p = skor.ilkeler[ilke];
            const kritlar = kriterler.filter((k) => k.ilke === ilke);
            const acik = acikIlke === ilke;
            return (
              <div key={ilke} className="overflow-hidden rounded-2xl border border-line">
                <button
                  onClick={() => setAcikIlke(acik ? null : ilke)}
                  className="flex w-full items-center gap-3 bg-surface px-4 py-3.5 text-left transition hover:bg-canvas/40"
                >
                  <span className="grid size-9 place-items-center rounded-xl text-white" style={{ background: m.renk }}>
                    <LucideIkon name={m.ikon} className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[14px] font-semibold text-slate-ink">
                      {t(`er.ilke.${ilke}.ad`)} <span className="text-[12px] font-normal text-slate-faint">· {m.enAd}</span>
                    </div>
                    <div className="text-[12px] text-slate-muted">{t(`er.ilke.${ilke}.aciklama`)}</div>
                  </div>
                  <div className="hidden items-center gap-2 text-[11px] text-slate-faint sm:flex">
                    <span className="flex items-center gap-1 text-ok"><Check className="size-3" /> {p.karsilandi}</span>
                    {p.kismi > 0 && <span className="flex items-center gap-1 text-warn"><AlertTriangle className="size-3" /> {p.kismi}</span>}
                    {p.karsilanmadi > 0 && <span className="flex items-center gap-1 text-danger2"><X className="size-3" /> {p.karsilanmadi}</span>}
                  </div>
                  <span className="num text-[15px] font-bold" style={{ color: skorRenk(p.skor) }}>%{p.skor}</span>
                  <ChevronDown className={cn("size-4 text-slate-faint transition-transform", acik && "rotate-180")} />
                </button>
                {acik && (
                  <div className="space-y-2 border-t border-line bg-canvas/20 p-3">
                    {kritlar.map((k) => {
                      const dm = DURUM_META[k.durum];
                      const kAcik = acikKriter === k.id;
                      return (
                        <div key={k.id} className="rounded-xl border border-line bg-surface">
                          <button
                            onClick={() => setAcikKriter(kAcik ? null : k.id)}
                            className="flex w-full items-start gap-3 px-3.5 py-3 text-left"
                          >
                            <span className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg", k.durum === "karsilandi" ? "bg-ok-soft" : k.durum === "kismi" ? "bg-warn-soft" : k.durum === "karsilanmadi" ? "bg-danger-soft" : "bg-canvas", dm.renk)}>
                              {dm.ikon}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-[11px] font-semibold text-slate-faint">{k.id}</span>
                                <span className="text-[13px] font-medium text-slate-ink">{k.ad}</span>
                                <Badge ton="brand">{k.seviye}</Badge>
                                <Badge ton={dm.badge}>{t(dm.anahtar)}</Badge>
                              </div>
                              {kAcik && (
                                <div className="mt-2 space-y-1.5">
                                  <p className="text-[12.5px] text-slate-muted">{k.aciklama}</p>
                                  <p className="flex items-start gap-1.5 text-[12px] text-brand-700"><FileText className="mt-0.5 size-3 shrink-0" /> {k.kanit}</p>
                                  {k.oneri && (
                                    <p className="flex items-start gap-1.5 text-[12px] text-warn"><AlertTriangle className="mt-0.5 size-3 shrink-0" /> {k.oneri}</p>
                                  )}
                                </div>
                              )}
                            </div>
                            <ChevronDown className={cn("mt-0.5 size-3.5 shrink-0 text-slate-faint transition-transform", kAcik && "rotate-180")} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* renk kontrastı denetleyici */}
        <Panel baslik={t("er.kontrast.baslik")}>
          <p className="mb-4 flex items-center gap-1.5 text-[12.5px] text-slate-muted">
            <Contrast className="size-3.5 shrink-0 text-brand-600" /> {t("er.kontrast.aciklama")}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-faint">{t("er.kontrast.onPlan")}</span>
              <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-2.5 py-2">
                <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="size-8 shrink-0 cursor-pointer rounded-md border border-line bg-transparent" aria-label={t("er.kontrast.onPlanRenk")} />
                <input type="text" value={fg} onChange={(e) => setFg(e.target.value)} className="w-full bg-transparent font-mono text-[13px] text-slate-ink outline-none" aria-label={t("er.kontrast.onPlanHex")} />
              </div>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-faint">{t("er.kontrast.arkaPlan")}</span>
              <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-2.5 py-2">
                <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="size-8 shrink-0 cursor-pointer rounded-md border border-line bg-transparent" aria-label={t("er.kontrast.arkaPlanRenk")} />
                <input type="text" value={bg} onChange={(e) => setBg(e.target.value)} className="w-full bg-transparent font-mono text-[13px] text-slate-ink outline-none" aria-label={t("er.kontrast.arkaPlan")} />
              </div>
            </label>
          </div>

          {/* önizleme + oran */}
          <div className="mt-4 flex items-center gap-4 rounded-2xl border border-line p-4" style={{ background: bg }}>
            <div className="flex-1">
              <div className="text-[20px] font-bold" style={{ color: fg }}>{t("er.kontrast.buyukMetin")}</div>
              <div className="text-[13px]" style={{ color: fg }}>{t("er.kontrast.normalMetin")}</div>
            </div>
            <div className="text-right">
              <div className="num text-[30px] font-bold" style={{ color: fg }}>{kontrast.oran.toFixed(2)}</div>
              <div className="text-[11px]" style={{ color: fg }}>{t("er.kontrast.oranSuffix")}</div>
            </div>
          </div>

          {/* geçme/kalma matrisi */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              { ad: t("er.kontrast.aaNormal"), esik: "4.5:1", gecti: kontrast.aaNormal },
              { ad: t("er.kontrast.aaBuyuk"), esik: "3:1", gecti: kontrast.aaBuyuk },
              { ad: t("er.kontrast.aaaNormal"), esik: "7:1", gecti: kontrast.aaaNormal },
              { ad: t("er.kontrast.aaaBuyuk"), esik: "4.5:1", gecti: kontrast.aaaBuyuk },
            ].map((r) => (
              <div key={r.ad} className={cn("flex items-center gap-2 rounded-xl border px-3 py-2", r.gecti ? "border-green-200 bg-ok-soft" : "border-red-200 bg-danger-soft")}>
                <span className={cn("grid size-5 shrink-0 place-items-center rounded-full", r.gecti ? "bg-ok text-white" : "bg-danger2 text-white")}>
                  {r.gecti ? <Check className="size-3" /> : <X className="size-3" />}
                </span>
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold text-slate-ink">{r.ad}</div>
                  <div className="text-[10.5px] text-slate-muted">{t("er.kontrast.esik").replace("{esik}", r.esik)} · {r.gecti ? t("er.kontrast.gecti") : t("er.kontrast.kaldi")}</div>
                </div>
              </div>
            ))}
          </div>

          {/* widget ön-ayarları */}
          <div className="mt-4">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-faint">{t("er.kontrast.widgetRenkleri")}</div>
            <div className="flex flex-wrap gap-2">
              {KONTRAST_ONAYARLAR.map((p, i) => (
                <button
                  key={p.ad}
                  onClick={() => { setFg(p.fg); setBg(p.bg); }}
                  className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-[11.5px] text-slate-muted transition hover:border-brand-300 hover:text-slate-ink"
                >
                  <span className="flex -space-x-1">
                    <span className="size-4 rounded-full border border-white" style={{ background: p.fg }} />
                    <span className="size-4 rounded-full border border-white" style={{ background: p.bg }} />
                  </span>
                  {t(`er.onayar.${i}`)}
                </button>
              ))}
            </div>
          </div>
        </Panel>

        {/* klavye & ekran-okuyucu kapsamı */}
        <Panel baslik={t("er.kapsam.baslik")}>
          <p className="mb-3 flex items-center gap-1.5 text-[12.5px] text-slate-muted">
            <Eye className="size-3.5 shrink-0 text-brand-600" /> {t("er.kapsam.aciklama")}
          </p>
          <div className="space-y-2">
            {KAPSAM_LISTESI.map((o, i) => {
              const dm = DURUM_META[o.durum];
              return (
                <div key={o.ad} className="flex items-start gap-3 rounded-xl border border-line bg-surface px-3.5 py-2.5">
                  <span className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg", o.durum === "karsilandi" ? "bg-ok-soft text-ok" : o.durum === "kismi" ? "bg-warn-soft text-warn" : "bg-canvas text-slate-faint")}>
                    <LucideIkon name={o.ikon} className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-medium text-slate-ink">{t(`er.kap.${i}.ad`)}</span>
                      <span className="font-mono text-[10px] text-slate-faint">WCAG {o.wcag}</span>
                      <Badge ton={dm.badge}>{t(dm.anahtar)}</Badge>
                    </div>
                    <p className="mt-0.5 text-[12px] text-slate-muted">{t(`er.kap.${i}.aciklama`)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* ghost-font erişilebilirliği — kilit farklılaştırıcı */}
      <Panel baslik={t("er.ghost.baslik")}>
        <p className="mb-4 flex items-center gap-1.5 text-[12.5px] text-slate-muted">
          <Sparkles className="size-3.5 shrink-0 text-brand-600" /> {t("er.ghost.aciklama1")} <b>{t("er.ghost.aciklamaBold")}</b> {t("er.ghost.aciklama2")}
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-line bg-surface p-4">
            <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><Volume2 className="size-5" /></span>
            <div className="mt-3 text-[13.5px] font-semibold text-slate-ink">{t("er.ghost.sesliBaslik")}</div>
            <p className="mt-1 text-[12px] text-slate-muted">
              {t("er.ghost.sesliMetin")} <span className="font-mono text-[11px] text-brand-700">WCAG 1.1.1 · 2.2.2</span>
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-4">
            <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><Accessibility className="size-5" /></span>
            <div className="mt-3 text-[13.5px] font-semibold text-slate-ink">{t("er.ghost.hareketBaslik")}</div>
            <p className="mt-1 text-[12px] text-slate-muted">
              <span className="font-mono text-[11px]">prefers-reduced-motion:reduce</span> {t("er.ghost.hareketMetin1")} <span className="font-mono text-[11px] text-brand-700">WCAG 2.3.3</span>
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-4">
            <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><TimerReset className="size-5" /></span>
            <div className="mt-3 text-[13.5px] font-semibold text-slate-ink">{t("er.ghost.sureBaslik")}</div>
            <p className="mt-1 text-[12px] text-slate-muted">
              {t("er.ghost.sureMetin")}
              <span className="font-mono text-[11px] text-brand-700"> WCAG 2.2.1</span>
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-canvas/40 px-4 py-3 text-[12.5px] text-slate-muted">
          <Check className="mt-0.5 size-4 shrink-0 text-ok" />
          <span>
            {t("er.ghost.sonucMetin1")} <b>{t("er.ghost.sonucBold")}</b> {t("er.ghost.sonucMetin2")}
          </span>
        </div>
      </Panel>

      {/* dürüstlük notu */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-canvas/40 px-5 py-4 text-[13px] text-slate-muted">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" />
        <span>
          {t("er.not.metin1")} <b>{t("er.not.ozdegerlendirme")}</b> {t("er.not.metin2")}
        </span>
      </div>
    </div>
  );
}
