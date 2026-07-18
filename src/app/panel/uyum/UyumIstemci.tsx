"use client";

import { useState } from "react";
import * as Icons from "lucide-react";
import { ShieldCheck, Check, AlertTriangle, X, Download, FileText, Minus } from "lucide-react";
import { Panel, StatKart, Badge, useToast } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import type { CerceveKey, Kontrol, KontrolDurum } from "./cerceve";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { uyumCeviri } from "./uyum.i18n";
import { RadarGrafik, IsiMatris, Gauge as GaugeGost } from "@/components/panel/grafikler-ek";
import { DonutDagilim } from "@/components/panel/grafikler";

function LucideIkon({ name, className }: { name: string; className?: string }) {
  const Cmp = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name] ?? Icons.Circle;
  return <Cmp className={className} />;
}

interface CerceveVeri {
  key: CerceveKey; ad: string; tamAd: string; aciklama: string; renk: string; ikon: string;
  kontroller: Kontrol[]; skor: number; tamam: number; kismi: number; eksik: number; toplam: number;
}

// Durum → i18n anahtarı + ikon + renk. Etiket render'da t() ile çözülür
// (enum değeri asla çevrilmez, yalnızca görüntü etiketi).
const DURUM_META: Record<KontrolDurum, { adKey: string; ikon: React.ReactNode; renk: string }> = {
  tamam: { adKey: "uy.durum.tamam", ikon: <Check className="size-3.5" />, renk: "text-ok" },
  kismi: { adKey: "uy.durum.kismi", ikon: <AlertTriangle className="size-3.5" />, renk: "text-warn" },
  eksik: { adKey: "uy.durum.eksik", ikon: <X className="size-3.5" />, renk: "text-danger2" },
  "gecerli-degil": { adKey: "uy.durum.gecerli-degil", ikon: <Minus className="size-3.5" />, renk: "text-slate-faint" },
};

export function UyumIstemci({ dil, cerceveler }: { dil: Dil; cerceveler: CerceveVeri[] }) {
  const { goster } = useToast();
  const [secili, setSecili] = useState<CerceveVeri>(cerceveler[0]);
  const t = (k: string) => uyumCeviri(k, dil);

  const genelSkor = Math.round(cerceveler.reduce((a, c) => a + c.skor, 0) / cerceveler.length);
  const toplamKontrol = cerceveler.reduce((a, c) => a + c.toplam, 0);
  const toplamTamam = cerceveler.reduce((a, c) => a + c.tamam, 0);

  function kanitIndir(c: CerceveVeri) {
    const satirlar: string[] = [];
    satirlar.push("=".repeat(72));
    satirlar.push(`  SPECTER — ${t("uy.rapor.baslik").replace("{cerceve}", c.tamAd)}`);
    satirlar.push(
      `  ${t("uy.rapor.skor")
        .replace("{skor}", String(c.skor))
        .replace("{tamam}", String(c.tamam))
        .replace("{toplam}", String(c.toplam))}`,
    );
    satirlar.push("=".repeat(72));
    satirlar.push("");
    for (const k of c.kontroller) {
      satirlar.push(`  [${t(DURUM_META[k.durum].adKey).toUpperCase()}] ${k.id} — ${k.ad}`);
      satirlar.push(`      ${k.aciklama}`);
      satirlar.push(`      ${t("uy.rapor.kanit")}: ${k.kanit}`);
      satirlar.push("");
    }
    satirlar.push("=".repeat(72));
    satirlar.push(`  ${t("uy.rapor.dipnot")}`);
    const blob = new Blob(["﻿" + satirlar.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `specter-uyum-${c.key}.txt`; a.click();
    URL.revokeObjectURL(url);
    goster({ tip: "basari", baslik: t("uy.rapor.indirildi") });
  }

  const skorRenk = (s: number) => (s >= 90 ? "#16a34a" : s >= 70 ? "#2f6fed" : s >= 50 ? "#d97706" : "#dc2626");

  // kategori gruplaması
  const kategoriler = [...new Set(secili.kontroller.map((k) => k.kategori))];

  // --- görsel türetmeler (yalnızca gösterim; veri değişmez) ---
  const durumPuan = (d: KontrolDurum) => (d === "tamam" ? 100 : d === "kismi" ? 50 : 0);

  // Seçili çerçevenin kategori-bazlı hazırlık yoğunluğu (radar eksenleri).
  const radarEksenler = kategoriler.map((kat) => {
    const grup = secili.kontroller.filter((k) => k.kategori === kat && k.durum !== "gecerli-degil");
    const deger = grup.length ? Math.round(grup.reduce((a, k) => a + durumPuan(k.durum), 0) / grup.length) : 0;
    return { etiket: kat, deger };
  });

  // Tüm çerçevelerdeki toplam durum dağılımı (donut).
  const genelDagilim = cerceveler.reduce(
    (acc, c) => {
      acc.tamam += c.tamam;
      acc.kismi += c.kismi;
      acc.eksik += c.eksik;
      return acc;
    },
    { tamam: 0, kismi: 0, eksik: 0 },
  );

  // Çerçeve × durum ısı matrisi (satır = çerçeve, sütun = durum).
  const matrisSatirlar = cerceveler.map((c) => c.ad);
  const matrisSutunlar = [t("uy.gorsel.karsilandi"), t("uy.gorsel.kismi"), t("uy.gorsel.eksik")];
  const matrisDegerler = cerceveler.map((c) => [c.tamam, c.kismi, c.eksik]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("uy.intro.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {t("uy.intro.metin")}
          </p>
        </div>
      </div>

      {/* özet */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={`%${genelSkor}`} etiket={t("uy.ozet.genelSkor")} ikon={<ShieldCheck className="size-5" />} tone={genelSkor >= 80 ? "ok" : "warn"} />
        <StatKart sayi={cerceveler.length} etiket={t("uy.ozet.cerceve")} />
        <StatKart sayi={`${toplamTamam}/${toplamKontrol}`} etiket={t("uy.ozet.karsilanan")} tone="ok" />
        <StatKart sayi="4" etiket={t("uy.ozet.hazirAlan")} ikon={<Check className="size-5" />} />
      </div>

      {/* çerçeve sekmeleri */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cerceveler.map((c) => (
          <button key={c.key} onClick={() => setSecili(c)} className={cn("rounded-3xl border bg-surface p-5 text-left transition", secili.key === c.key ? "border-brand-400 shadow-card ring-1 ring-brand-200" : "border-line hover:border-line-strong")}>
            <div className="flex items-center justify-between">
              <span className="grid size-10 place-items-center rounded-2xl text-white" style={{ background: c.renk }}><LucideIkon name={c.ikon} className="size-5" /></span>
              <span className="num text-[22px] font-bold" style={{ color: skorRenk(c.skor) }}>%{c.skor}</span>
            </div>
            <div className="mt-3 font-semibold text-slate-ink">{c.ad}</div>
            <div className="text-[12px] text-slate-muted">{c.tamAd}</div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-canvas">
              <div className="h-full rounded-full transition-all" style={{ width: `${c.skor}%`, background: skorRenk(c.skor) }} />
            </div>
            <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-faint">
              <span className="flex items-center gap-1 text-ok"><Check className="size-3" /> {c.tamam}</span>
              {c.kismi > 0 && <span className="flex items-center gap-1 text-warn"><AlertTriangle className="size-3" /> {c.kismi}</span>}
            </div>
          </button>
        ))}
      </div>

      {/* görsel panolar: gauge panosu + durum donut + kategori radar */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* çerçeve hazırlık göstergeleri */}
        <div className="rounded-3xl border border-line bg-surface p-5 shadow-card lg:col-span-2">
          <div className="mb-1 text-[14px] font-semibold text-slate-ink">{t("uy.gorsel.skorPano")}</div>
          <div className="mb-4 text-[12.5px] text-slate-muted">{t("uy.gorsel.skorPanoAlt")}</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {cerceveler.map((c) => (
              <button
                key={c.key}
                onClick={() => setSecili(c)}
                className={cn(
                  "flex flex-col items-center rounded-2xl border px-2 py-3 transition",
                  secili.key === c.key ? "border-brand-300 bg-brand-50/50" : "border-line hover:bg-canvas/60",
                )}
              >
                <GaugeGost deger={c.skor} etiket={`%${c.skor}`} boyut={118} renk={skorRenk(c.skor)} />
                <span className="mt-1 flex items-center gap-1.5 text-[12px] font-semibold text-slate-ink">
                  <span className="size-2 rounded-full" style={{ background: c.renk }} />
                  {c.ad}
                </span>
                <span className="text-[10.5px] text-slate-faint">{c.tamam}/{c.toplam} {t("uy.gorsel.kontrol")}</span>
              </button>
            ))}
          </div>
        </div>

        {/* kontrol durumu dağılımı (donut) */}
        <div className="rounded-3xl border border-line bg-surface p-5 shadow-card">
          <div className="mb-3 text-[14px] font-semibold text-slate-ink">{t("uy.gorsel.dagilim")}</div>
          <DonutDagilim
            merkezEtiket={t("uy.gorsel.kontrol")}
            segmentler={[
              { etiket: t("uy.gorsel.karsilandi"), deger: genelDagilim.tamam, renk: "#16a34a" },
              { etiket: t("uy.gorsel.kismi"), deger: genelDagilim.kismi, renk: "#d97706" },
              { etiket: t("uy.gorsel.eksik"), deger: genelDagilim.eksik, renk: "#dc2626" },
            ]}
          />
        </div>
      </div>

      {/* kategori radar + çerçeve×durum ısı matrisi */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-line bg-surface p-5 shadow-card">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-xl text-white" style={{ background: secili.renk }}>
              <LucideIkon name={secili.ikon} className="size-4" />
            </span>
            <div>
              <div className="text-[14px] font-semibold text-slate-ink">{t("uy.gorsel.radar").replace("{cerceve}", secili.ad)}</div>
              <div className="text-[12px] text-slate-muted">{t("uy.gorsel.radarAlt")}</div>
            </div>
          </div>
          <div className="mt-2 grid place-items-center">
            {radarEksenler.length >= 3 ? (
              <RadarGrafik eksenler={radarEksenler} boyut={230} renk={secili.renk} />
            ) : (
              <div className="flex w-full flex-col gap-2 py-4">
                {radarEksenler.map((e) => (
                  <div key={e.etiket} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 truncate text-[12px] text-slate-muted">{e.etiket}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-canvas">
                      <div className="h-full rounded-full" style={{ width: `${e.deger}%`, background: secili.renk }} />
                    </div>
                    <span className="num w-9 shrink-0 text-right text-[11px] font-semibold text-slate-ink">%{e.deger}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-line bg-surface p-5 shadow-card">
          <div className="mb-1 text-[14px] font-semibold text-slate-ink">{t("uy.gorsel.matris")}</div>
          <div className="mb-4 text-[12px] text-slate-muted">{t("uy.gorsel.matrisAlt")}</div>
          <IsiMatris satirlar={matrisSatirlar} sutunlar={matrisSutunlar} degerler={matrisDegerler} renk="#2f6fed" />
        </div>
      </div>

      {/* seçili çerçeve detayı */}
      <Panel
        baslik={t("uy.detay.kontroller").replace("{cerceve}", secili.tamAd)}
        sagUst={<Button variant="outline" size="sm" onClick={() => kanitIndir(secili)}><Download className="size-4" /> {t("uy.detay.kanitRaporu")}</Button>}
      >
        <div className="mb-4 flex items-center gap-4 rounded-2xl bg-canvas/50 p-4">
          <span className="num text-[32px] font-bold" style={{ color: skorRenk(secili.skor) }}>%{secili.skor}</span>
          <div>
            <div className="text-[14px] font-semibold text-slate-ink">{t("uy.detay.hazirlikSkoru")}</div>
            <div className="text-[13px] text-slate-muted">{t("uy.detay.ozet").replace("{tamam}", String(secili.tamam)).replace("{kismi}", String(secili.kismi)).replace("{toplam}", String(secili.toplam))}</div>
          </div>
        </div>

        {kategoriler.map((kat) => (
          <div key={kat} className="mb-4 last:mb-0">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-faint">{kat}</div>
            <div className="space-y-2">
              {secili.kontroller.filter((k) => k.kategori === kat).map((k) => {
                const m = DURUM_META[k.durum];
                return (
                  <div key={k.id} className="flex items-start gap-3 rounded-xl border border-line bg-surface px-3.5 py-3">
                    <span className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg", k.durum === "tamam" ? "bg-ok-soft" : k.durum === "kismi" ? "bg-warn-soft" : k.durum === "eksik" ? "bg-danger-soft" : "bg-canvas", m.renk)}>{m.ikon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] font-semibold text-slate-faint">{k.id}</span>
                        <span className="text-[13px] font-medium text-slate-ink">{k.ad}</span>
                        <Badge ton={k.durum === "tamam" ? "yesil" : k.durum === "kismi" ? "sari" : k.durum === "eksik" ? "kirmizi" : "gri"}>{t(m.adKey)}</Badge>
                      </div>
                      <p className="mt-1 text-[12.5px] text-slate-muted">{k.aciklama}</p>
                      <p className="mt-1 flex items-start gap-1.5 text-[12px] text-brand-700"><FileText className="mt-0.5 size-3 shrink-0" /> {k.kanit}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </Panel>

      {/* not */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-canvas/40 px-5 py-4 text-[13px] text-slate-muted">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" />
        <span dangerouslySetInnerHTML={{ __html: t("uy.not") }} />
      </div>
    </div>
  );
}
