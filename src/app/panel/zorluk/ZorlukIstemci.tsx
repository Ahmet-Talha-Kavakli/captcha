"use client";

import { useState } from "react";
import Link from "next/link";
import { Gauge, TrendingUp, TrendingDown, Ruler, Bot, ShieldAlert, Activity, SlidersHorizontal, ArrowRight, Sparkles, Check } from "lucide-react";
import { Panel, StatKart, Badge, useToast } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { zorlukSimule, ZORLUK_RENK } from "@/lib/specter/difficulty-analiz";
import type { ZorlukAnaliz } from "@/lib/specter/difficulty-analiz";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { zorlukCeviri } from "./zorluk.i18n";

type Difficulty = "low" | "medium" | "high";

interface SiteZorluk { id: string; name: string; difficulty: Difficulty; mode: string; verified: boolean }

/** Dil koduna karşılık gelen BCP-47 yerel etiketi (sayı biçimleme için). */
const YEREL: Record<Dil, string> = { tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES" };

export function ZorlukIstemci({
  taban, analiz, siteler, olaySayisi, dil,
}: {
  taban: Difficulty;
  analiz: ZorlukAnaliz;
  siteler: SiteZorluk[];
  olaySayisi: number;
  dil: Dil;
}) {
  const t = (anahtar: string) => zorlukCeviri(anahtar, dil);
  const yerel = YEREL[dil];
  const { goster } = useToast();
  const { dagilim } = analiz;
  const yuzde = (n: number) => (dagilim.toplam ? Math.round((n / dagilim.toplam) * 100) : 0);

  // Lib'in ürettiği TR gerekçe metnini ({n} interpolasyonlu ardışık dahil)
  // hedef dile çevir. "ardışık başarısızlık" satırı sayı içerir → ayrı yakalanır.
  const gerekceCevir = (g: string): string => {
    const ard = g.match(/^(\d+)\s+ardışık/);
    if (ard) return t("gerekce.ardisik").replace("{n}", ard[1]);
    if (g.startsWith("Net insan sinyali")) return t("gerekce.netInsan");
    if (g.startsWith("Nötr sinyaller")) return t("gerekce.notr");
    return t(`gerekce.${g}`);
  };

  // Canlı simülatör durumu.
  const [sim, setSim] = useState({ behaviorScore: 0.5, ipReputation: 0.6, automationFlag: false, recentFailures: 0 });
  const simSonuc = zorlukSimule(taban, sim);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* açıklama */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Sparkles className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("aciklama.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {t("aciklama.metin").replace("{n}", olaySayisi.toLocaleString(yerel))}
          </p>
        </div>
      </div>

      {/* özet */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={t(`zorluk.${taban}`)} etiket={t("ozet.taban")} ikon={<Gauge className="size-5" />} tone="brand" />
        <StatKart sayi={analiz.yukseltilen.toLocaleString(yerel)} etiket={t("ozet.yukseltilen")} ikon={<TrendingUp className="size-5" />} tone="danger" />
        <StatKart sayi={analiz.dusurulen.toLocaleString(yerel)} etiket={t("ozet.dusurulen")} ikon={<TrendingDown className="size-5" />} tone="ok" />
        <StatKart sayi={analiz.ortUzunluk} etiket={t("ozet.ortUzunluk")} ikon={<Ruler className="size-5" />} />
      </div>

      {/* dağılım + sebepler */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel baslik={t("dagilim.baslik")}>
          <div className="space-y-4">
            {(["low", "medium", "high"] as Difficulty[]).map((d) => (
              <div key={d}>
                <div className="mb-1.5 flex items-center justify-between text-[13px]">
                  <span className="flex items-center gap-2 font-medium text-slate-ink">
                    <span className="size-2.5 rounded-full" style={{ background: ZORLUK_RENK[d] }} />
                    {t(`zorluk.${d}`)} {t("dagilim.zorlukEk")}
                    {d === taban && <Badge ton="mavi">{t("dagilim.taban")}</Badge>}
                  </span>
                  <span className="num text-slate-muted"><b className="text-slate-ink">{dagilim[d].toLocaleString(yerel)}</b> · %{yuzde(dagilim[d])}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-canvas">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${yuzde(dagilim[d])}%`, background: ZORLUK_RENK[d] }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-2 rounded-xl bg-canvas/50 px-3.5 py-3 text-[12.5px] text-slate-muted">
            <Activity className="size-4 shrink-0 text-brand-600" />
            {t("dagilim.dipnot")}
          </div>
        </Panel>

        <Panel baslik={t("sebep.baslik")}>
          {analiz.sebepler.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-muted">{t("sebep.bos")}</p>
          ) : (
            <div className="space-y-2.5">
              {analiz.sebepler.map((s) => (
                // İkon seçimi lib TR etiketi üzerinden (veri) yapılır; görüntülenen
                // metin anahtar→çeviri eşlemesiyle hedef dile çevrilir.
                <div key={s.etiket} className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-3.5 py-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-danger-soft text-danger2">
                    {s.etiket.includes("Otomasyon") ? <Bot className="size-4" /> : s.etiket.includes("itibar") ? <ShieldAlert className="size-4" /> : <Activity className="size-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium text-slate-ink">{t(`sebep.etiket.${s.etiket}`)}</div>
                    <div className="text-[12px] text-slate-faint">{t(`etki.${s.etki}`)} · {t("sebep.istekEk").replace("{n}", s.sayi.toLocaleString(yerel))}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* canlı simülatör */}
      <Panel baslik={t("sim.baslik")} sagUst={<span className="flex items-center gap-1.5 text-[12px] text-slate-faint"><SlidersHorizontal className="size-3.5" /> {t("sim.sagUst")}</span>}>
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <Kaydirac etiket={t("sim.davranis")} deger={sim.behaviorScore} onChange={(v) => setSim({ ...sim, behaviorScore: v })} ipucu={t("sim.davranisIpucu")} yerel={yerel} />
            <Kaydirac etiket={t("sim.itibar")} deger={sim.ipReputation} onChange={(v) => setSim({ ...sim, ipReputation: v })} ipucu={t("sim.itibarIpucu")} yerel={yerel} />
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-slate-ink">{t("sim.ardisik")} <b className="num">{sim.recentFailures}</b></span>
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((n) => (
                  <button key={n} onClick={() => setSim({ ...sim, recentFailures: n })} className={cn("size-8 rounded-lg text-[13px] font-semibold transition", sim.recentFailures === n ? "bg-brand-600 text-white" : "bg-canvas text-slate-muted hover:bg-slate-100")}>{n}</button>
                ))}
              </div>
            </div>
            <label className="flex cursor-pointer items-center justify-between">
              <span className="text-[13px] font-medium text-slate-ink">{t("sim.otomasyon")}</span>
              <button onClick={() => setSim({ ...sim, automationFlag: !sim.automationFlag })} className={cn("relative h-6 w-11 rounded-full transition", sim.automationFlag ? "bg-danger2" : "bg-slate-300")}>
                <span className={cn("absolute top-0.5 size-5 rounded-full bg-white transition-all", sim.automationFlag ? "left-[22px]" : "left-0.5")} />
              </button>
            </label>
          </div>

          {/* sonuç */}
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 p-6 text-center" style={{ borderColor: ZORLUK_RENK[simSonuc.zorluk] }}>
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-faint">{t("sim.uygulanacak")}</span>
            <span className="mt-1 text-[32px] font-bold" style={{ color: ZORLUK_RENK[simSonuc.zorluk] }}>{t(`zorluk.${simSonuc.zorluk}`)}</span>
            <span className="num text-[13px] text-slate-muted">{t("sim.haneliKod").replace("{n}", String(simSonuc.uzunluk))}</span>
            <div className="mt-4 w-full space-y-1.5 text-left">
              {simSonuc.gerekce.map((g, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[12px] text-slate-muted">
                  <span className="mt-0.5 text-brand-600">•</span> {gerekceCevir(g)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      {/* site başına zorluk yapılandırması */}
      <Panel baslik={t("site.baslik")} padding={false}>
        <div className="overflow-x-auto px-6 pb-2">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-wide text-slate-faint">
                <th className="py-2 pr-4">{t("site.sutunSite")}</th>
                <th className="py-2 pr-4">{t("site.sutunMod")}</th>
                <th className="py-2 pr-4">{t("site.sutunTaban")}</th>
                <th className="py-2 text-right">{t("site.sutunYonet")}</th>
              </tr>
            </thead>
            <tbody>
              {siteler.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-slate-faint">{t("site.bos")}</td></tr>}
              {siteler.map((s) => (
                <tr key={s.id} className="border-t border-line">
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-2 font-medium text-slate-ink">
                      {s.name}
                      {s.verified && <span title={t("site.dogrulandi")}><Check className="size-3.5 text-ok" /></span>}
                    </div>
                  </td>
                  <td className="py-3.5 pr-4">
                    {/* mode enum değeri (block/challenge/monitor) çevrilmez; etiket anahtar→çeviri ile üretilir */}
                    <Badge ton={s.mode === "block" ? "kirmizi" : s.mode === "challenge" ? "sari" : "gri"}>
                      {s.mode === "block" ? t("mod.block") : s.mode === "challenge" ? t("mod.challenge") : t("mod.monitor")}
                    </Badge>
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className="inline-flex items-center gap-1.5 text-[13px] font-medium" style={{ color: ZORLUK_RENK[s.difficulty] }}>
                      <span className="size-2 rounded-full" style={{ background: ZORLUK_RENK[s.difficulty] }} />
                      {t(`zorluk.${s.difficulty}`)}
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    <Link href={`/panel/siteler/${s.id}`} className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-600 hover:text-brand-700">
                      {t("site.ayarlar")} <ArrowRight className="size-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mx-6 mb-4 mt-1 flex items-center gap-2 rounded-xl bg-canvas/50 px-3.5 py-2.5 text-[12px] text-slate-muted">
          <Gauge className="size-4 shrink-0 text-brand-600" />
          {t("site.dipnot")}
        </div>
      </Panel>

      {/* nasıl çalışır */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] bg-ink-900 px-8 py-6">
        <div className="max-w-xl">
          <h3 className="text-[16px] font-semibold text-white">{t("cta.baslik")}</h3>
          <p className="mt-1 text-[13px] text-white/60">{t("cta.metin")}</p>
        </div>
        <Button href="/panel/besleme" variant="outline" size="sm" onClick={() => goster({ tip: "bilgi", baslik: t("cta.toast") })}>
          {t("cta.buton")} <ArrowRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

function Kaydirac({ etiket, deger, onChange, ipucu, yerel }: { etiket: string; deger: number; onChange: (v: number) => void; ipucu: string; yerel: string }) {
  const renk = deger >= 0.7 ? "#16a34a" : deger >= 0.3 ? "#2f6fed" : "#dc2626";
  const degerMetin = new Intl.NumberFormat(yerel, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(deger);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[13px] font-medium text-slate-ink">{etiket}</span>
        <span className="num text-[13px] font-semibold" style={{ color: renk }}>{degerMetin}</span>
      </div>
      <input type="range" min={0} max={1} step={0.05} value={deger} onChange={(e) => onChange(parseFloat(e.target.value))}
        aria-label={etiket} className="w-full accent-brand-600" />
      <p className="mt-0.5 text-[11.5px] text-slate-faint">{ipucu}</p>
    </div>
  );
}
