"use client";

import { useState } from "react";
import {
  BotOff,
  ShieldAlert,
  ShieldCheck,
  Gauge,
  ChevronDown,
  ChevronRight,
  Ban,
  GitBranch,
  Lock,
  AlertTriangle,
  Bot,
  ArrowRight,
} from "lucide-react";
import { Panel, StatKart, Badge } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { type AjanUyum, type UyumOzet } from "@/lib/specter/robots-uyum";
import type { Dil } from "@/lib/i18n/panel";
import { robotsCeviri } from "./robots-uyum.i18n";

/** Dil koduna karşılık gelen BCP-47 yerel etiketi (sayı biçimleme için). */
const YEREL: Record<Dil, string> = { tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES" };

/** Uyum durumuna göre rozet tonu + metin rengi + ikon. */
function durumMeta(a: AjanUyum) {
  if (a.durum === "ihlal")
    return { ton: "kirmizi" as const, ikon: <ShieldAlert className="size-3.5" />, satirRenk: "border-red-300 bg-danger-soft/40" };
  if (a.durum === "taahhut_yok")
    return { ton: "gri" as const, ikon: <Ban className="size-3.5" />, satirRenk: "border-line bg-surface" };
  return { ton: "yesil" as const, ikon: <ShieldCheck className="size-3.5" />, satirRenk: "border-line bg-surface" };
}

/** Uyum oranını renklendir (yüksek = yeşil). */
const oranRenk = (o: number) => (o >= 0.99 ? "#16a34a" : o >= 0.9 ? "#65a30d" : o >= 0.7 ? "#d97706" : "#dc2626");

export function RobotsUyumIstemci({
  ajanlar,
  ozet,
  korumaliYollar,
  dil,
}: {
  ajanlar: AjanUyum[];
  ozet: UyumOzet;
  korumaliYollar: string[];
  dil: Dil;
}) {
  const t = (anahtar: string) => robotsCeviri(anahtar, dil);
  const yerel = YEREL[dil];
  const [acik, setAcik] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setAcik((p) => ({ ...p, [id]: !p[id] }));

  const ortUyumYuzde = Math.round(ozet.ortUyum * 100);
  const trafikliAjan = ajanlar.filter((a) => a.toplam > 0);
  const ihlalEdenler = ajanlar.filter((a) => a.durum === "ihlal");

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* açıklama şeridi */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <BotOff className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("aciklama.soru")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {t("aciklama.metin")
              .split("{ihlal}")
              .flatMap((parca, i) =>
                i === 0 ? [parca] : [<b key={i}>{t("aciklama.ihlalVurgu")}</b>, parca],
              )}
          </p>
        </div>
      </div>

      {/* özet kartları */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart
          sayi={ozet.toplamAiIstek.toLocaleString(yerel)}
          etiket={t("ozet.aiIstek")}
          ikon={<Bot className="size-5" />}
        />
        <StatKart
          sayi={ozet.toplamIhlal.toLocaleString(yerel)}
          etiket={t("ozet.ihlal")}
          ikon={<ShieldAlert className="size-5" />}
          tone={ozet.toplamIhlal > 0 ? "danger" : "ok"}
        />
        <StatKart
          sayi={ozet.ihlalliAjan}
          etiket={t("ozet.ihlalliAjan")}
          ikon={<BotOff className="size-5" />}
          tone={ozet.ihlalliAjan > 0 ? "danger" : "ok"}
        />
        <StatKart
          sayi={`%${ortUyumYuzde}`}
          etiket={t("ozet.ortUyum")}
          ikon={<Gauge className="size-5" />}
          tone={ortUyumYuzde >= 90 ? "ok" : ortUyumYuzde >= 70 ? "warn" : "danger"}
        />
      </div>

      {/* asıl bulgu vurgusu */}
      {ihlalEdenler.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-300 bg-danger-soft/50 px-5 py-4">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-danger2" />
          <div className="text-[13px] text-red-800">
            <span className="font-semibold">
              {t("bulgu.metin").replace("{n}", String(ihlalEdenler.length))}
            </span>{" "}
            {t("bulgu.enKritik")}{" "}
            {ihlalEdenler
              .slice(0, 3)
              .map((a) => `${a.urun} (${t("bulgu.ihlalEk").replace("{n}", String(a.ihlal))})`)
              .join(", ")}
            {t("bulgu.kuyruk")}
          </div>
        </div>
      )}

      {/* ajan uyum tablosu / kartları */}
      <Panel baslik={t("ajan.baslik")}>
        {trafikliAjan.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-white px-6 py-16 text-center">
            <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <Bot className="size-6" />
            </span>
            <h3 className="text-base font-semibold text-slate-ink">{t("ajan.bosBaslik")}</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-muted">{t("ajan.bosMetin")}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {trafikliAjan.map((a) => {
              const m = durumMeta(a);
              const genisletilebilir = a.ihlalYollar.length > 0;
              const acikMi = !!acik[a.id];
              return (
                <div key={a.id} className={cn("overflow-hidden rounded-2xl border transition", m.satirRenk)}>
                  <button
                    type="button"
                    onClick={() => genisletilebilir && toggle(a.id)}
                    className={cn(
                      "flex w-full items-center gap-4 px-4 py-3.5 text-left",
                      genisletilebilir && "hover:bg-black/[0.02]",
                    )}
                  >
                    {/* logo + ad */}
                    <span
                      className="grid size-9 shrink-0 place-items-center rounded-xl text-white"
                      style={{ background: a.logo }}
                    >
                      <Bot className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-ink">{a.urun}</span>
                        <span className="text-[12px] text-slate-faint">{a.operator}</span>
                        {/* robots.txt saygı iddiası rozeti */}
                        {a.saygiRobots ? (
                          <Badge ton="yesil">
                            <ShieldCheck className="size-3" /> {t("ajan.saygiTaahhut")}
                          </Badge>
                        ) : (
                          <Badge ton="gri">
                            <Ban className="size-3" /> {t("ajan.taahhutYok")}
                          </Badge>
                        )}
                        {/* durum rozeti (enum: a.durum → çeviri anahtarı) */}
                        <Badge ton={m.ton}>
                          {m.ikon} {t(`durum.${a.durum}`)}
                        </Badge>
                      </div>
                      {/* uyum çubuğu */}
                      <div className="mt-2 flex items-center gap-3">
                        <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-canvas">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${Math.round(a.uyumOrani * 100)}%`, background: oranRenk(a.uyumOrani) }}
                          />
                        </div>
                        <span
                          className="num shrink-0 text-[13px] font-semibold"
                          style={{ color: oranRenk(a.uyumOrani) }}
                        >
                          {t("ajan.uyumEk").replace("{n}", String(Math.round(a.uyumOrani * 100)))}
                        </span>
                      </div>
                    </div>
                    {/* sayaçlar */}
                    <div className="hidden shrink-0 items-center gap-5 sm:flex">
                      <div className="text-right">
                        <div className="num text-[15px] font-bold text-slate-ink">{a.toplam.toLocaleString(yerel)}</div>
                        <div className="text-[11px] text-slate-faint">{t("ajan.istek")}</div>
                      </div>
                      <div className="text-right">
                        <div
                          className={cn(
                            "num text-[15px] font-bold",
                            a.ihlal > 0 ? "text-danger2" : "text-slate-faint",
                          )}
                        >
                          {a.ihlal.toLocaleString(yerel)}
                        </div>
                        <div className="text-[11px] text-slate-faint">{t("ajan.ihlal")}</div>
                      </div>
                    </div>
                    {genisletilebilir ? (
                      acikMi ? (
                        <ChevronDown className="size-4 shrink-0 text-slate-faint" />
                      ) : (
                        <ChevronRight className="size-4 shrink-0 text-slate-faint" />
                      )
                    ) : (
                      <span className="w-4 shrink-0" />
                    )}
                  </button>

                  {/* genişleyen ihlal-yolları listesi */}
                  {genisletilebilir && acikMi && (
                    <div className="border-t border-line/70 bg-canvas/30 px-4 py-3">
                      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-faint">
                        <Lock className="size-3" /> {t("ajan.cignenenYollar")}
                      </div>
                      <div className="space-y-1.5">
                        {a.ihlalYollar.map((y) => (
                          <div
                            key={y.path}
                            className="flex items-center justify-between rounded-lg border border-red-200 bg-danger-soft/40 px-3 py-2"
                          >
                            <code className="font-mono text-[12.5px] font-medium text-red-800">{y.path}</code>
                            <span className="num text-[12px] font-semibold text-red-700">
                              {t("ajan.istekSayi").replace("{n}", y.sayi.toLocaleString(yerel))}
                            </span>
                          </div>
                        ))}
                      </div>
                      {a.saygiRobots && (
                        <p className="mt-2.5 flex items-start gap-1.5 text-[12px] text-red-700">
                          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                          {t("ajan.celiskiUyari")}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* nasıl davranmalı — CTA */}
      <Panel baslik={t("cta.baslik")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col rounded-2xl border border-line bg-canvas/40 p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <Bot className="size-4" />
              </span>
              <span className="font-semibold text-slate-ink">{t("cta.engelleBaslik")}</span>
            </div>
            <p className="flex-1 text-[13px] text-slate-muted">{t("cta.engelleMetin")}</p>
            <div className="mt-3">
              <Button href="/panel/ai-ajanlar" variant="accent" size="sm">
                {t("cta.engelleButon")} <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col rounded-2xl border border-line bg-canvas/40 p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <GitBranch className="size-4" />
              </span>
              <span className="font-semibold text-slate-ink">{t("cta.kuralBaslik")}</span>
            </div>
            <p className="flex-1 text-[13px] text-slate-muted">
              {t("cta.kuralMetin1")} <code className="font-mono text-[12px] text-slate-ink">/admin</code>,{" "}
              <code className="font-mono text-[12px] text-slate-ink">/api</code>
              {t("cta.kuralMetin2")}
            </p>
            <div className="mt-3">
              <Button href="/panel/kurallar" variant="outline" size="sm">
                {t("cta.kuralButon")} <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </Panel>

      {/* korumalı yollar referansı */}
      <Panel baslik={t("ref.baslik")}>
        <p className="mb-3 text-[13px] text-slate-muted">
          {t("ref.metin")
            .split("{disallow}")
            .flatMap((parca, i) =>
              i === 0 ? [parca] : [<b key={i}>{t("ref.disallowVurgu")}</b>, parca],
            )}
        </p>
        <div className="flex flex-wrap gap-2">
          {korumaliYollar.map((yol) => (
            <span
              key={yol}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-2.5 py-1.5 font-mono text-[12.5px] font-medium text-slate-ink"
            >
              <Lock className="size-3 text-slate-faint" />
              Disallow: {yol}
            </span>
          ))}
        </div>
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-line bg-canvas/40 px-4 py-3 text-[12.5px] text-slate-muted">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" />
          <span>
            {t("ref.uyari")
              .split("{temsili}")
              .flatMap((parca, i) =>
                i === 0 ? [parca] : [<b key={i}>{t("ref.temsiliVurgu")}</b>, parca],
              )}
          </span>
        </div>
      </Panel>
    </div>
  );
}
