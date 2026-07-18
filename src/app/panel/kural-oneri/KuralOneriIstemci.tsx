"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Check, Plus, ShieldAlert, Globe, Server, Bot, Crosshair, Fingerprint, TrendingUp, AlertTriangle, ArrowRight, X } from "lucide-react";
import { Panel, StatKart, Badge, useToast } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import type { KuralOnerisi, OneriTur } from "@/lib/specter/kural-oneri";
import type { Dil } from "@/lib/i18n/panel";
import { kuralOneriCeviri, YEREL_BCP47 } from "./kural-oneri.i18n";
import { cn } from "@/lib/cn";

const TUR_IKON: Record<OneriTur, React.ReactNode> = {
  ulke: <Globe className="size-4" />, asn: <Server className="size-4" />, ip: <Crosshair className="size-4" />,
  path: <Fingerprint className="size-4" />, botClass: <Bot className="size-4" />, score: <TrendingUp className="size-4" />,
};

// action → Badge tonu (enum değeri; etiket ayrıca çevrilir).
const ACTION_TON: Record<string, "yesil" | "sari" | "kirmizi" | "gri"> = { allow: "yesil", challenge: "sari", block: "kirmizi", flag: "gri" };

export function KuralOneriIstemci({
  oneriler, ozet, siteler, dil,
}: {
  oneriler: KuralOnerisi[];
  ozet: { toplam: number; yuksekEtki: number; toplamYakalanabilir: number };
  siteler: { id: string; name: string }[];
  dil: Dil;
}) {
  const t = (k: string) => kuralOneriCeviri(k, dil);
  const yerel = YEREL_BCP47[dil];
  const { goster } = useToast();
  const [siteId, setSiteId] = useState(siteler[0]?.id ?? "");
  const [kurulan, setKurulan] = useState<Record<string, "yukleniyor" | "kuruldu">>({});
  const [reddedilen, setReddedilen] = useState<Record<string, boolean>>({});

  async function kur(o: KuralOnerisi) {
    if (!siteId) { goster({ tip: "hata", baslik: t("toast.siteSecilmedi") }); return; }
    if (kurulan[o.id]) return;
    setKurulan((p) => ({ ...p, [o.id]: "yukleniyor" }));
    try {
      const r = await fetch("/api/rules", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId, name: o.baslik, description: o.aciklama,
          field: o.field, op: o.op, value: o.value, action: o.action, priority: o.priority,
        }),
      });
      if (!r.ok) throw new Error();
      setKurulan((p) => ({ ...p, [o.id]: "kuruldu" }));
      goster({ tip: "basari", baslik: t("toast.kuralEklendi"), aciklama: t("toast.kuralAktif").replace("{ad}", o.baslik) });
    } catch {
      setKurulan((p) => { const y = { ...p }; delete y[o.id]; return y; });
      goster({ tip: "hata", baslik: t("toast.kuralEklenemedi") });
    }
  }

  const gorunur = oneriler.filter((o) => !reddedilen[o.id]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* açıklama */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Sparkles className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("serit.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {t("serit.aciklama.1")} <b>{t("serit.tahminiEtki")}</b> {t("serit.aciklama.2")}
          </p>
        </div>
      </div>

      {/* özet + site seçici */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="grid flex-1 grid-cols-3 gap-4">
          <StatKart sayi={ozet.toplam} etiket={t("ozet.oneri")} ikon={<Sparkles className="size-5" />} tone="brand" />
          <StatKart sayi={ozet.yuksekEtki} etiket={t("ozet.yuksekEtkili")} ikon={<TrendingUp className="size-5" />} tone="ok" />
          <StatKart sayi={ozet.toplamYakalanabilir.toLocaleString(yerel)} etiket={t("ozet.yakalanabilir")} ikon={<ShieldAlert className="size-5" />} tone="danger" />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-slate-muted">{t("site.hedef")}</label>
          <select value={siteId} onChange={(e) => setSiteId(e.target.value)} className="h-10 rounded-xl border border-line-strong bg-surface px-3 text-[13px] outline-none focus:border-brand-400">
            {siteler.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {gorunur.length === 0 ? (
        <Panel baslik={t("bos.baslik")}>
          <div className="py-10 text-center">
            <Check className="mx-auto mb-3 size-10 text-ok" />
            <p className="text-sm text-slate-muted">{t("bos.aciklama")}</p>
            <Link href="/panel/kurallar" className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-600 hover:text-brand-700">{t("bos.kurallaraGit")} <ArrowRight className="size-3.5" /></Link>
          </div>
        </Panel>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {gorunur.map((o) => {
            const durum = kurulan[o.id];
            return (
              <div key={o.id} className="overflow-hidden rounded-3xl border border-line bg-surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600">{TUR_IKON[o.tur]}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        {/* o.baslik dinamik lib-üretimli prose → veri olarak gösterilir */}
                        <h3 className="text-[15px] font-bold text-slate-ink">{o.baslik}</h3>
                        <Badge ton="mavi">{t(`tur.${o.tur}`)}</Badge>
                      </div>
                      {/* o.aciklama dinamik lib-üretimli prose → veri olarak gösterilir */}
                      <p className="mt-1 text-[13px] text-slate-muted">{o.aciklama}</p>
                    </div>
                  </div>
                  {!durum && (
                    <button onClick={() => setReddedilen((p) => ({ ...p, [o.id]: true }))} className="grid size-7 shrink-0 place-items-center rounded-full text-slate-faint transition hover:bg-canvas hover:text-slate-ink" aria-label={t("kart.reddet")}><X className="size-4" /></button>
                  )}
                </div>

                {/* kural önizleme — field/op/value/action ENUM değerleri veri olarak kalır */}
                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-canvas/50 px-3 py-2 text-[12px]">
                  <span className="font-mono text-slate-ink">{o.field}</span>
                  <span className="text-slate-faint">{o.op}</span>
                  <span className="rounded bg-white px-1.5 py-0.5 font-mono font-semibold text-slate-ink">{o.value}</span>
                  <ArrowRight className="size-3 text-slate-faint" />
                  <Badge ton={ACTION_TON[o.action]}>{t(`action.${o.action}`)}</Badge>
                </div>

                {/* etki + güven */}
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl border border-line bg-surface py-2">
                    <div className="num text-[18px] font-bold text-danger2">{o.etkiSayisi}</div>
                    <div className="text-[10px] text-slate-faint">{t("kart.yakalar").replace("{n}", String(o.etkiOran))}</div>
                  </div>
                  <div className="rounded-xl border border-line bg-surface py-2">
                    <div className="num text-[18px] font-bold" style={{ color: o.guven >= 60 ? "#16a34a" : o.guven >= 30 ? "#2f6fed" : "#d97706" }}>%{o.guven}</div>
                    <div className="text-[10px] text-slate-faint">{t("kart.guven")}</div>
                  </div>
                  <div className="rounded-xl border border-line bg-surface py-2">
                    <div className={cn("num text-[18px] font-bold", o.yanlisPozitifRiski ? "text-danger2" : "text-ok")}>{o.yanlisPozitifRiski ? t("kart.var") : t("kart.yok")}</div>
                    <div className="text-[10px] text-slate-faint">{t("kart.yanlisPozRiski")}</div>
                  </div>
                </div>

                {/* o.gerekce dinamik lib-üretimli prose → veri olarak gösterilir */}
                <p className="mt-2 text-[11.5px] italic text-slate-faint">{o.gerekce}</p>

                {o.yanlisPozitifRiski && (
                  <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-warn-soft/50 px-2.5 py-1.5 text-[11.5px] text-amber-700">
                    <AlertTriangle className="mt-0.5 size-3 shrink-0" /> {t("kart.fpUyari")}
                  </div>
                )}

                {/* aksiyon */}
                <div className="mt-4">
                  {durum === "kuruldu" ? (
                    <div className="flex items-center justify-between rounded-xl border border-green-200 bg-ok-soft px-3.5 py-2.5 text-[13px] text-green-700">
                      <span className="flex items-center gap-1.5"><Check className="size-4" /> {t("aksiyon.kuralEklendi")}</span>
                      <Link href="/panel/kurallar" className="font-semibold underline">{t("aksiyon.kurallardaGor")}</Link>
                    </div>
                  ) : (
                    <Button className="w-full" onClick={() => kur(o)} disabled={durum === "yukleniyor"}>
                      <Plus className="size-4" /> {durum === "yukleniyor" ? t("aksiyon.ekleniyor") : t("aksiyon.kuraliEkle")}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
