"use client";

import { useState } from "react";
import Link from "next/link";
import { GitBranch, TrendingUp, Skull, ShieldAlert, Search, ArrowRight, AlertTriangle, Trophy, Layers } from "lucide-react";
import { Panel, StatKart, Badge } from "@/components/panel/kit";
import { DURUM_RENK } from "@/lib/specter/kural-performans";
import type { KuralPerformans } from "@/lib/specter/kural-performans";
import type { Dil } from "@/lib/i18n/panel";
import { kuralCeviri } from "./kural-performans.i18n";
import { cn } from "@/lib/cn";

export function KuralPerformansIstemci({
  kurallar, ozet, olaySayisi, dil,
}: {
  kurallar: KuralPerformans[];
  ozet: { toplam: number; aktif: number; olu: number; riskli: number; golgede: number; ortDegerSkoru: number; toplamIsabet: number };
  olaySayisi: number;
  dil: Dil;
}) {
  const t = (k: string) => kuralCeviri(k, dil);
  const locale = dil === "tr" ? "tr-TR" : dil;
  const [sorgu, setSorgu] = useState("");
  const [filtre, setFiltre] = useState<string>("hepsi");

  const filtreler = ["hepsi", "yuksek-deger", "riskli", "olu", "golgede", "pasif"];
  const filtreli = kurallar.filter((k) =>
    (filtre === "hepsi" || k.durum === filtre) &&
    (!sorgu || `${k.ad} ${k.field} ${k.value}`.toLowerCase().includes(sorgu.toLowerCase())),
  );

  const maxIsabet = Math.max(1, ...kurallar.map((k) => k.isabet));
  const sorunlu = kurallar.filter((k) => k.oneri).length;

  // enum → yerelleştirilmiş etiketler (anahtar-eşleme)
  const durumEtiket = (d: KuralPerformans["durum"]) => t(`durum.${d}`);
  const actionEtiket = (a: string) => t(`action.${a}`);
  // lib "oneri" TR string'i yerine durum'a göre yeniden türet (riskli → insanIsabet)
  const oneriMetin = (k: KuralPerformans) =>
    t(`oneri.${k.durum}`).replace("{n}", k.insanIsabet.toLocaleString(locale));

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* açıklama */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <GitBranch className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("banner.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {t("banner.metin").replace("{n}", olaySayisi.toLocaleString(locale))}
          </p>
        </div>
      </div>

      {/* özet */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={`${ozet.ortDegerSkoru}`} etiket={t("stat.ortDeger")} ikon={<TrendingUp className="size-5" />} tone={ozet.ortDegerSkoru >= 60 ? "ok" : "warn"} />
        <StatKart sayi={ozet.olu} etiket={t("stat.olu")} ikon={<Skull className="size-5" />} tone={ozet.olu > 0 ? "warn" : "ok"} />
        <StatKart sayi={ozet.riskli} etiket={t("stat.riskli")} ikon={<ShieldAlert className="size-5" />} tone={ozet.riskli > 0 ? "danger" : "ok"} />
        <StatKart sayi={ozet.toplamIsabet.toLocaleString(locale)} etiket={t("stat.toplamIsabet")} ikon={<GitBranch className="size-5" />} />
      </div>

      {/* budama uyarısı */}
      {sorunlu > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-warn-soft bg-warn-soft/40 px-5 py-4 text-amber-700">
          <AlertTriangle className="size-5 shrink-0" />
          <span className="text-[13.5px] font-medium">{t("budama").replace("{n}", `${sorunlu}`)}</span>
        </div>
      )}

      {/* filtre + arama */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {filtreler.map((f) => (
            <button key={f} onClick={() => setFiltre(f)} className={cn("rounded-full px-3 py-1.5 text-[12.5px] font-medium transition", filtre === f ? "bg-ink-900 text-white" : "bg-canvas text-slate-muted hover:text-slate-ink")}>
              {t(`filtre.${f}`)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-line bg-canvas px-3 py-2">
          <Search className="size-4 text-slate-faint" />
          <input value={sorgu} onChange={(e) => setSorgu(e.target.value)} placeholder={t("ara.placeholder")} className="w-40 bg-transparent text-[13px] outline-none" aria-label={t("ara.placeholder")} />
        </div>
      </div>

      {/* kural listesi */}
      <Panel baslik={t("liste.baslik").replace("{n}", `${filtreli.length}`)} padding={false}>
        <div className="divide-y divide-line">
          {filtreli.length === 0 && <p className="py-10 text-center text-sm text-slate-muted">{t("liste.bos")}</p>}
          {filtreli.map((k) => (
            <div key={k.id} className="px-6 py-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-2xl text-white" style={{ background: DURUM_RENK[k.durum] }}>
                    {k.durum === "yuksek-deger" ? <Trophy className="size-4" /> : k.durum === "olu" ? <Skull className="size-4" /> : k.durum === "riskli" ? <ShieldAlert className="size-4" /> : k.durum === "golgede" ? <Layers className="size-4" /> : <GitBranch className="size-4" />}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[14px] font-semibold text-slate-ink">{k.ad}</span>
                      <Badge ton={k.durum === "yuksek-deger" ? "yesil" : k.durum === "riskli" || k.durum === "olu" ? "kirmizi" : k.durum === "golgede" || k.durum === "dusuk-isabet" ? "sari" : "gri"}>{durumEtiket(k.durum)}</Badge>
                      {k.system && <span className="rounded-full bg-canvas px-2 py-0.5 text-[10px] text-slate-faint">{t("rozet.sistem")}</span>}
                    </div>
                    <div className="mt-1 font-mono text-[11.5px] text-brand-700">{k.field} {k.op} "{k.value}" → {actionEtiket(k.action)}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-slate-muted">
                      <span><b className="num text-slate-ink">{k.isabet.toLocaleString(locale)}</b> {t("satir.isabet")}</span>
                      {k.isabet > 0 && <span>{t("satir.botOran").replace("{n}", `${k.botOran}`)}</span>}
                      {k.insanIsabet > 0 && <span className="text-danger2">{t("satir.insanYakalandi").replace("{n}", `${k.insanIsabet}`)}</span>}
                      <span>{t("satir.oncelik").replace("{n}", `${k.priority}`)}</span>
                    </div>
                    {k.oneri && (
                      <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-canvas/60 px-2.5 py-1.5 text-[12px] text-slate-muted">
                        <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-600" /> {oneriMetin(k)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {/* isabet barı */}
                  <div className="hidden w-32 sm:block">
                    <div className="mb-1 text-right text-[10px] text-slate-faint">{t("bar.isabet")}</div>
                    <div className="h-2 overflow-hidden rounded-full bg-canvas"><div className="h-full rounded-full bg-brand-500" style={{ width: `${(k.isabet / maxIsabet) * 100}%` }} /></div>
                  </div>
                  <div className="text-right">
                    <div className="num text-[22px] font-bold" style={{ color: DURUM_RENK[k.durum] }}>{k.degerSkoru}</div>
                    <div className="text-[11px] text-slate-faint">{t("kart.deger")}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* kurallara git */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] bg-ink-900 px-8 py-6">
        <div className="max-w-xl">
          <h3 className="text-[16px] font-semibold text-white">{t("cta.baslik")}</h3>
          <p className="mt-1 text-[13px] text-white/60">{t("cta.metin")}</p>
        </div>
        <Link href="/panel/kurallar" className="flex items-center gap-1 rounded-full border border-white/20 px-4 py-2 text-[13px] font-medium text-white transition hover:bg-white/10">{t("cta.buton")} <ArrowRight className="size-3.5" /></Link>
      </div>
    </div>
  );
}
