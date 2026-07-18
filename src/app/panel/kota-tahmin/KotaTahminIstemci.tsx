"use client";

import {
  TrendingUp,
  TrendingDown,
  Minus,
  Gauge,
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Info,
  ArrowUpRight,
} from "lucide-react";
import { Panel, StatKart, Badge } from "@/components/panel/kit";
import { TrendGrafik } from "@/components/panel/grafikler";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { ktCeviri } from "./kota-tahmin.i18n";
import type {
  YontemSonuc,
  YontemAnahtar,
  TrendYonu,
  KapasitePlani,
} from "@/lib/specter/kota-tahmin";

/** BCP-47 dil kodu (sayı biçimlendirme için). */
const BCP47: Record<Dil, string> = { tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES" };

/**
 * Trend rozet meta'sı — enum GÜVENLİĞİ: `ad` burada YOK; görünen etiket
 * "kt.trend.<enum>" anahtarıyla çeviriden gelir (ikon/renk/ton dil-bağımsız).
 */
const TREND_META: Record<TrendYonu, { ikon: React.ReactNode; renk: string; ton: "ok" | "warn" | "brand" }> = {
  artıyor: { ikon: <TrendingUp className="size-5" />, renk: "text-warn", ton: "warn" },
  azalıyor: { ikon: <TrendingDown className="size-5" />, renk: "text-ok", ton: "ok" },
  sabit: { ikon: <Minus className="size-5" />, renk: "text-brand-600", ton: "brand" },
};

interface Props {
  dil: Dil;
  planAd: string;
  kota: number;
  gunGecti: number;
  ayToplamGun: number;
  mevcutKullanim: number;
  gunlukOrtalama: number;
  oran: number;
  trendYonu: TrendYonu;
  egim: number;
  yontemler: YontemSonuc[];
  secilenAnahtar: YontemAnahtar;
  guvenAraligi: { alt: number; ust: number; genislik: number };
  tukenecek: boolean;
  tukenisGunu: number | null;
  gercekSeri: number[];
  projeksiyonSeri: number[];
  etiketler: string[];
  kapasite: KapasitePlani;
}

export function KotaTahminIstemci(p: Props) {
  const t = (k: string) => ktCeviri(k, p.dil);
  const nf = (n: number) => n.toLocaleString(BCP47[p.dil]);
  // Yöntem/açıklama etiketleri lib'den TR gelir; enum anahtarıyla yeniden türet.
  const yontemAd = (anahtar: YontemAnahtar) => t(`kt.yontem.${anahtar}`);
  const yontemAciklama = (anahtar: YontemAnahtar) => t(`kt.yontemAciklama.${anahtar}`);
  const secilen = p.yontemler.find((y) => y.anahtar === p.secilenAnahtar) ?? p.yontemler[0];
  const trend = TREND_META[p.trendYonu];
  const trendAd = t(`kt.trend.${p.trendYonu}`);
  const kalanGun = Math.max(0, p.ayToplamGun - p.gunGecti);

  /* Kapasite gerekçesi lib'de 4 TR metinden biri olarak üretilir. Lib'i
     değiştirmeden, gelen TR metnini ktCeviri'nin TR kaynağıyla eşleyip doğru
     çeviri anahtarını buluruz (metin-eşleme; yoksa ham metne düşer). */
  const GEREKCE_ANAHTARLARI = [
    "kt.gerekce.mevcutYeter",
    "kt.gerekce.ekonomik",
    "kt.gerekce.asiyor",
    "kt.gerekce.enYuksek",
  ];
  const gerekceMetin =
    GEREKCE_ANAHTARLARI.map((k) => ({ k, tr: ktCeviri(k, "tr") })).find((x) => x.tr === p.kapasite.gerekce)
      ?.k ?? null;
  const kapasiteGerekce = gerekceMetin ? t(gerekceMetin) : p.kapasite.gerekce;

  // Ay-sonu doluluk oranı (seçilen yönteme göre).
  const dolulukPct = p.kota > 0 ? Math.min(200, (secilen.aySonuTahmin / p.kota) * 100) : 0;
  const mevcutPct = p.kota > 0 ? Math.min(100, (p.mevcutKullanim / p.kota) * 100) : 0;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* açıklama şeridi */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Gauge className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("kt.aciklama.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {t("kt.aciklama.metin")
              .replace("{plan}", p.planAd)
              .replace("{gecti}", String(p.gunGecti))
              .replace("{toplam}", String(p.ayToplamGun))}
          </p>
        </div>
      </div>

      {/* özet kartları */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart
          sayi={nf(p.mevcutKullanim)}
          etiket={t("kt.kart.mevcut").replace("{pct}", String(Math.round(mevcutPct)))}
          ikon={<Gauge className="size-5" />}
        />
        <StatKart
          sayi={nf(secilen.aySonuTahmin)}
          etiket={t("kt.kart.aySonu").replace("{yontem}", yontemAd(secilen.anahtar))}
          ikon={<ArrowUpRight className="size-5" />}
          tone={secilen.asim > 0 ? "danger" : "ok"}
        />
        <StatKart
          sayi={p.tukenecek ? t("kt.kart.gunEtiketi").replace("{n}", String(p.tukenisGunu)) : t("kt.kart.yeterli")}
          etiket={p.tukenecek ? t("kt.kart.tukenisGunu") : t("kt.kart.yeterliEtiket")}
          ikon={<CalendarClock className="size-5" />}
          tone={p.tukenecek ? "danger" : "ok"}
        />
        <StatKart
          sayi={trendAd}
          etiket={t("kt.kart.trend")}
          ikon={<span className={trend.renk}>{trend.ikon}</span>}
          tone={trend.ton === "brand" ? undefined : trend.ton}
        />
      </div>

      {/* tükeniş uyarısı */}
      {p.tukenecek ? (
        <div className="flex items-start gap-3 rounded-2xl border border-danger-soft bg-danger-soft/40 px-5 py-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-danger2" />
          <div>
            <p className="text-sm font-semibold text-danger2">
              {t("kt.uyari.baslik").replace("{n}", String(p.tukenisGunu))}
            </p>
            <p className="mt-0.5 text-[13px] text-slate-muted">
              {t("kt.uyari.metin")
                .replace("{yontem}", yontemAd(secilen.anahtar))
                .replace("{hiz}", nf(secilen.gunlukHiz))
                .replace("{kota}", nf(p.kota))
                .replace("{plan}", p.planAd)
                .replace("{gun}", String(p.tukenisGunu))
                .replace("{tahmin}", nf(secilen.aySonuTahmin))}
              <b className="text-danger2">{t("kt.uyari.asim").replace("{n}", nf(secilen.asim))}</b>
              {t("kt.uyari.oneri")}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-2xl border border-ok-soft bg-ok-soft/30 px-5 py-4">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-ok" />
          <div>
            <p className="text-sm font-semibold text-ok">{t("kt.ok.baslik")}</p>
            <p className="mt-0.5 text-[13px] text-slate-muted">
              {t("kt.ok.metin")
                .replace("{tahmin}", nf(secilen.aySonuTahmin))
                .replace("{kota}", nf(p.kota))
                .replace("{pct}", String(Math.round(dolulukPct)))
                .replace("{kalan}", String(kalanGun))}
            </p>
          </div>
        </div>
      )}

      {/* projeksiyon grafiği */}
      <Panel baslik={t("kt.proj.baslik")}>
        <p className="-mt-1 mb-3 text-[13px] text-slate-muted">
          {t("kt.proj.altBaslik").replace("{yontem}", yontemAd(secilen.anahtar))}
        </p>
        <TrendGrafik
          noktalar={p.gercekSeri}
          seriler={[p.gercekSeri, p.projeksiyonSeri]}
          renkler={["#2f6fed", "#d97706"]}
          seriEtiketleri={[t("kt.proj.seriGercek"), t("kt.proj.seriTahmin")]}
          etiketler={p.etiketler}
          yukseklik={260}
        />
        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 rounded-xl bg-canvas/50 px-4 py-3 text-[12.5px] text-slate-muted">
          <span className="flex items-center gap-1.5">
            <Info className="size-3.5 text-brand-600" />
            {t("kt.proj.guvenAraligi")}{" "}
            <b className="text-slate-ink">
              {nf(p.guvenAraligi.alt)} – {nf(p.guvenAraligi.ust)}
            </b>{" "}
            {t("kt.proj.band").replace("{n}", nf(p.guvenAraligi.genislik))}
          </span>
          <span className="flex items-center gap-1.5">
            <span className={trend.renk}>{trend.ikon}</span>
            {t("kt.proj.trendEgimi")} <b className="text-slate-ink">{p.egim >= 0 ? "+" : ""}{p.egim.toFixed(1)}{t("kt.proj.gunBirim")}</b>
          </span>
        </div>
      </Panel>

      {/* 3 yöntem karşılaştırması */}
      <Panel baslik={t("kt.tablo.baslik")}>
        <p className="-mt-1 mb-3 text-[13px] text-slate-muted">
          {t("kt.tablo.altBaslik")}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-[11px] font-bold uppercase tracking-wide text-slate-faint">
                <th className="py-2 pr-3">{t("kt.tablo.yontem")}</th>
                <th className="py-2 px-3 text-right">{t("kt.tablo.gunlukHiz")}</th>
                <th className="py-2 px-3 text-right">{t("kt.tablo.aySonu")}</th>
                <th className="py-2 px-3 text-right">{t("kt.tablo.asim")}</th>
                <th className="py-2 px-3 text-right">{t("kt.tablo.tukenis")}</th>
                <th className="py-2 pl-3">{t("kt.tablo.durum")}</th>
              </tr>
            </thead>
            <tbody>
              {p.yontemler.map((y) => {
                const sec = y.anahtar === p.secilenAnahtar;
                return (
                  <tr
                    key={y.anahtar}
                    className={cn(
                      "border-b border-line/60 last:border-0",
                      sec && "bg-brand-50/50",
                    )}
                  >
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-ink">{yontemAd(y.anahtar)}</span>
                        {sec && <Badge ton="brand">{t("kt.tablo.secilen")}</Badge>}
                      </div>
                    </td>
                    <td className="px-3 text-right tabular-nums text-slate-muted">{nf(y.gunlukHiz)}</td>
                    <td className="px-3 text-right font-semibold tabular-nums text-slate-ink">{nf(y.aySonuTahmin)}</td>
                    <td className="px-3 text-right tabular-nums">
                      {y.asim > 0 ? <span className="text-danger2">+{nf(y.asim)}</span> : <span className="text-slate-faint">—</span>}
                    </td>
                    <td className="px-3 text-right tabular-nums">
                      {y.tukenisGunu !== null ? (
                        <span className="text-warn">{t("kt.kart.gunEtiketi").replace("{n}", String(y.tukenisGunu))}</span>
                      ) : (
                        <span className="text-ok">{t("kt.tablo.yeter")}</span>
                      )}
                    </td>
                    <td className="py-2.5 pl-3">
                      <Badge ton={y.asim > 0 ? "kirmizi" : "yesil"}>{y.asim > 0 ? t("kt.tablo.asimRiski") : t("kt.tablo.guvenli")}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* yöntem açıklamaları (eğitim) */}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {p.yontemler.map((y) => (
            <div
              key={y.anahtar}
              className={cn(
                "rounded-xl border p-3.5",
                y.anahtar === p.secilenAnahtar ? "border-brand-300 bg-brand-50/40" : "border-line bg-surface",
              )}
            >
              <div className="mb-1 text-[12.5px] font-semibold text-slate-ink">{yontemAd(y.anahtar)}</div>
              <p className="text-[12px] leading-relaxed text-slate-muted">{yontemAciklama(y.anahtar)}</p>
            </div>
          ))}
        </div>
      </Panel>

      {/* kapasite planlama */}
      <Panel baslik={t("kt.kapasite.baslik")}>
        <p className="-mt-1 mb-3 text-[13px] text-slate-muted">
          {t("kt.kapasite.altBaslik")}
        </p>
        <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-canvas/50 px-4 py-3 text-[13px] text-slate-muted">
          <Layers className="mt-0.5 size-4 shrink-0 text-brand-600" />
          <span>{kapasiteGerekce}</span>
        </div>
        <div className="space-y-3">
          {p.kapasite.planlar.map((pl) => {
            const dolPct = Math.min(100, Math.round(pl.dolulukOran * 100));
            const barRenk = pl.dolulukOran > 1 ? "#dc2626" : pl.dolulukOran > 0.9 ? "#d97706" : "#16a34a";
            return (
              <div
                key={pl.key}
                className={cn(
                  "rounded-2xl border p-4",
                  pl.onerilen ? "border-brand-300 bg-brand-50/40 ring-1 ring-brand-200" : "border-line bg-surface",
                )}
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-ink">{pl.ad}</span>
                  <span className="text-[12px] text-slate-faint">{pl.fiyat}</span>
                  {pl.mevcut && <Badge ton="gri">{t("kt.kapasite.mevcutPlan")}</Badge>}
                  {pl.onerilen && <Badge ton="brand">{t("kt.kapasite.onerilen")}</Badge>}
                  <span className="ml-auto text-[12px] tabular-nums text-slate-muted">
                    {t("kt.kapasite.kota").replace("{n}", nf(pl.kota))}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-canvas">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${dolPct}%`, background: barRenk }}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[12px]">
                  <span className={pl.yeterli ? "text-ok" : "text-danger2"}>
                    {pl.yeterli ? t("kt.kapasite.bosluk").replace("{pct}", String(pl.bosluk)) : t("kt.kapasite.asilir")}
                  </span>
                  <span className="tabular-nums text-slate-faint">
                    {t("kt.kapasite.tahmini").replace("{tahmin}", nf(secilen.aySonuTahmin)).replace("{kota}", nf(pl.kota))}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* yöntem notu */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-canvas/40 px-5 py-4 text-[13px] text-slate-muted">
        <Info className="mt-0.5 size-4 shrink-0 text-brand-600" />
        <span>{t("kt.not")}</span>
      </div>
    </div>
  );
}
