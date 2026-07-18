"use client";

import Link from "next/link";
import { Gauge, TrendingUp, Activity, Info, ArrowRight, Check, AlertTriangle } from "lucide-react";
import { Panel, StatKart, Badge } from "@/components/panel/kit";
import { DURUM_RENK } from "@/lib/specter/skor-kalibrasyon";
import type { KalibrasyonSonuc, DriftSonuc, DriftOzellik } from "@/lib/specter/skor-kalibrasyon";
import type { Dil } from "@/lib/i18n/panel";
import { skorKalibrasyonCeviri } from "./skor-kalibrasyon.i18n";
import { cn } from "@/lib/cn";

/**
 * Enum → çeviri anahtarı eşlemeleri. Enum değerleri (iyi/orta/zayif ·
 * kararli/izlemede/drift · kayma/belirgin-kayma) asla çevrilmez; yalnızca
 * görüntü etiketi için anahtara çevrilir.
 */
const KALIB_ANAHTAR: Record<KalibrasyonSonuc["durum"], string> = {
  iyi: "sk.kalib.iyi",
  orta: "sk.kalib.orta",
  zayif: "sk.kalib.zayif",
};
const DRIFT_ANAHTAR: Record<DriftSonuc["durum"], string> = {
  kararli: "sk.drift.kararli",
  izlemede: "sk.drift.izlemede",
  drift: "sk.drift.drift",
};
const OZ_ANAHTAR: Record<DriftOzellik["durum"], string> = {
  kararli: "sk.oz.kararli",
  kayma: "sk.oz.kayma",
  "belirgin-kayma": "sk.oz.belirgin-kayma",
};

/**
 * Özellik detay metni özelliğin durumundan türetilir (lib'deki detay ile aynı
 * mantık); böylece lib'e dokunmadan çeviri client-tarafında yeniden üretilir.
 */
const OZ_DETAY_ANAHTAR: Record<DriftOzellik["durum"], string> = {
  kararli: "sk.detay.kararli",
  kayma: "sk.detay.kayma",
  "belirgin-kayma": "sk.detay.belirgin-kayma",
};

/**
 * Özellik adı, lib'deki sabit TR ad üzerinden çeviri anahtarına eşlenir.
 * (Ad enum değil ama lib'de deterministik/sabit olduğundan güvenle eşlenebilir.)
 */
const OZELLIK_ANAHTAR: Record<string, string> = {
  "İnsanlık skoru dağılımı": "sk.ozellik.skor",
  "Bot sınıfı dağılımı": "sk.ozellik.sinif",
  "Karar dağılımı": "sk.ozellik.karar",
};

export function SkorKalibrasyonIstemci({
  kalibrasyon, drift, dil,
}: {
  kalibrasyon: KalibrasyonSonuc;
  drift: DriftSonuc;
  dil: Dil;
}) {
  const t = (k: string) => skorKalibrasyonCeviri(k, dil);
  const ozellikAd = (ad: string) => (OZELLIK_ANAHTAR[ad] ? t(OZELLIK_ANAHTAR[ad]) : ad);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* açıklama */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Gauge className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("sk.giris.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {t("sk.giris.metin.1")} <b>{t("sk.giris.kalibrasyon")}</b> {t("sk.giris.kalibrasyon.aciklama")}{" "}
            {t("sk.giris.ve")} <b>{t("sk.giris.drift")}</b> {t("sk.giris.drift.aciklama")}
          </p>
        </div>
      </div>

      {/* özet */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={kalibrasyon.ece.toFixed(3)} etiket={t("sk.ozet.ece")} ikon={<Gauge className="size-5" />} tone={kalibrasyon.durum === "iyi" ? "ok" : kalibrasyon.durum === "orta" ? "warn" : "danger"} />
        <StatKart sayi={t(KALIB_ANAHTAR[kalibrasyon.durum])} etiket={t("sk.ozet.kalibDurum")} ikon={<Check className="size-5" />} />
        <StatKart sayi={drift.genelPsi.toFixed(3)} etiket={t("sk.ozet.psi")} ikon={<TrendingUp className="size-5" />} tone={drift.durum === "kararli" ? "ok" : drift.durum === "izlemede" ? "warn" : "danger"} />
        <StatKart sayi={t(DRIFT_ANAHTAR[drift.durum])} etiket={t("sk.ozet.driftDurum")} ikon={<Activity className="size-5" />} />
      </div>

      {/* güvenilirlik diyagramı + drift */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Panel baslik={t("sk.diyagram.baslik")}>
          <p className="mb-3 text-[13px] text-slate-muted">{t("sk.diyagram.aciklama")}</p>
          {/* diyagram */}
          <div className="relative">
            <div className="flex items-end gap-1" style={{ height: 200 }}>
              {kalibrasyon.binler.map((b) => (
                <div
                  key={b.aralik}
                  className="flex flex-1 flex-col items-center justify-end gap-0.5"
                  title={t("sk.diyagram.baloncuk")
                    .replace("{aralik}", b.aralik)
                    .replace("{tahmin}", String(Math.round(b.ortTahmin * 100)))
                    .replace("{gercek}", String(Math.round(b.gercekOran * 100)))
                    .replace("{sayi}", String(b.sayi))}
                >
                  <div className="flex w-full items-end justify-center gap-0.5" style={{ height: 180 }}>
                    <div className="w-1/2 rounded-t bg-brand-400" style={{ height: `${b.ortTahmin * 100}%` }} />
                    <div className="w-1/2 rounded-t bg-danger2/70" style={{ height: `${b.gercekOran * 100}%` }} />
                  </div>
                  <span className="text-[8px] text-slate-faint">{b.altSinir.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-4 text-[12px]">
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-brand-400" /> {t("sk.diyagram.legend.tahmin")}</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-danger2/70" /> {t("sk.diyagram.legend.gercek")}</span>
          </div>
          <div className={cn("mt-3 flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-[12.5px]", kalibrasyon.durum === "iyi" ? "bg-ok-soft text-green-700" : "bg-warn-soft/40 text-amber-700")}>
            {kalibrasyon.durum === "iyi" ? <Check className="mt-0.5 size-4 shrink-0" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0" />}
            {(kalibrasyon.durum === "iyi" ? t("sk.diyagram.iyi") : t("sk.diyagram.kotu")).replace("{ece}", String(kalibrasyon.ece))}
          </div>
        </Panel>

        <Panel baslik={t("sk.psi.baslik")}>
          <p className="mb-3 text-[13px] text-slate-muted">
            {t("sk.psi.aciklama")
              .replace("{ref}", drift.referansSayi.toLocaleString("tr-TR"))
              .replace("{gun}", drift.guncelSayi.toLocaleString("tr-TR"))}
          </p>
          <div className="space-y-3">
            {drift.ozellikler.map((o) => (
              <div key={o.ad}>
                <div className="mb-1 flex items-center justify-between text-[13px]">
                  <span className="font-medium text-slate-ink">{ozellikAd(o.ad)}</span>
                  <span className="flex items-center gap-2">
                    <span className="num font-semibold" style={{ color: DURUM_RENK[o.durum] }}>{o.psi}</span>
                    <Badge ton={o.durum === "kararli" ? "yesil" : o.durum === "kayma" ? "sari" : "kirmizi"}>{t(OZ_ANAHTAR[o.durum])}</Badge>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-canvas">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, o.psi * 200)}%`, background: DURUM_RENK[o.durum] }} />
                </div>
                <p className="mt-0.5 text-[11.5px] text-slate-faint">{t(OZ_DETAY_ANAHTAR[o.durum])}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl bg-canvas/50 px-3.5 py-2.5 text-[11.5px] text-slate-muted">
            <Info className="mr-1.5 inline size-3.5 text-brand-600" /> {t("sk.psi.not")}
          </div>
        </Panel>
      </div>

      {/* eylem */}
      {(kalibrasyon.durum !== "iyi" || drift.durum !== "kararli") && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] bg-ink-900 px-8 py-6">
          <div className="max-w-xl">
            <h3 className="text-[16px] font-semibold text-white">{t("sk.eylem.baslik")}</h3>
            <p className="mt-1 text-[13px] text-white/60">{drift.durum === "drift" ? t("sk.eylem.drift") : t("sk.eylem.kalib")}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/panel/zorluk" className="rounded-full border border-white/20 px-4 py-2 text-[13px] font-medium text-white transition hover:bg-white/10">{t("sk.eylem.zorluk")}</Link>
            <Link href="/panel/ml-aciklanabilir" className="flex items-center gap-1 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-ink-900">{t("sk.eylem.mlaciklama")} <ArrowRight className="size-3.5" /></Link>
          </div>
        </div>
      )}

      {/* yöntem notu */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-canvas/40 px-5 py-4 text-[13px] text-slate-muted">
        <Info className="mt-0.5 size-4 shrink-0 text-brand-600" />
        <span
          dangerouslySetInnerHTML={{
            __html: t("sk.yontem").replace("{toplam}", kalibrasyon.toplam.toLocaleString("tr-TR")),
          }}
        />
      </div>
    </div>
  );
}
