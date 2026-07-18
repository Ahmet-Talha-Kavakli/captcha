"use client";

/**
 * Maliyet Optimizasyonu — İstemci
 * ================================
 * Bulut-maliyet-optimizatörü tarzı FinOps konsolu (bot koruması için):
 * verimlilik skoru, kaynak dağılımı, israf analizi, önceliklendirilmiş
 * optimizasyon önerileri ve "hepsini uygula" tasarruf projeksiyonu.
 * Tüm sayılar sunucudaki pure lib'den gelir; burada yalnızca sunum var.
 */

import {
  PiggyBank,
  TrendingDown,
  AlertTriangle,
  Gauge,
  Zap,
  Recycle,
  ShieldOff,
  ArrowRight,
  Sparkles,
  Info,
  Wallet,
  Flame,
} from "lucide-react";
import { Panel, StatKart, Badge, NotKutusu, Ilerleme } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { TrendGrafik, DonutDagilim } from "@/components/panel/grafikler";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import {
  maliyetCeviri,
  israfKategoriMetin,
  segmentAd,
  oncelikAd,
  oneriMetin,
  MO_LOCALE,
} from "./maliyet-optim.i18n";

/* ------------------------------------------------------------------ Tipler (page.tsx ile aynı şekil) */

interface IsrafKategori {
  key: "gereksiz_challenge" | "dusuk_deger" | "tekrar_dogrulama";
  ad: string;
  aciklama: string;
  adet: number;
  kotaIsraf: number;
  computeIsraf: number;
  tlIsraf: number;
  duzeltmeHref: string;
  duzeltmeEtiket: string;
}
interface DagilimSegment {
  key: "gercek_tehdit" | "insan_challenge" | "iyi_bot" | "israf";
  ad: string;
  compute: number;
  tl: number;
  yuzde: number;
  renk: string;
}
interface Oneri {
  key: string;
  baslik: string;
  aciklama: string;
  kotaTasarruf: number;
  tlTasarruf: number;
  tasarrufYuzde: number;
  oncelik: "yuksek" | "orta" | "dusuk";
  guvenlikNotu: string;
  cta: { etiket: string; href: string };
}
interface Props {
  planAd: string;
  kota: number;
  kullanilan: number;
  kotaOran: number;
  verimlilik: { skor: number; israfYuzde: number; toplamCompute: number; israfCompute: number };
  israf: IsrafKategori[];
  dagilim: DagilimSegment[];
  oneriler: Oneri[];
  projeksiyon: {
    toplamKotaTasarruf: number;
    toplamTLTasarruf: number;
    mevcutSkor: number;
    yeniSkor: number;
    mevcutAylikTL: number;
    yeniAylikTL: number;
  };
  trendSeri: number[];
  trendEtiket: string[];
  birimTL: { kota: number; compute: number };
}

/* ------------------------------------------------------------------ Yardımcılar */

// Yerelleştirilmiş ₺/sayı biçimlendirici — ₺ sembolü veri olarak korunur.
const tlYap = (n: number, locale: string) => `₺${n.toLocaleString(locale, { maximumFractionDigits: 2 })}`;
const sayiYap = (n: number, locale: string) => n.toLocaleString(locale);

const ISRAF_IKON: Record<IsrafKategori["key"], React.ReactNode> = {
  gereksiz_challenge: <ShieldOff className="size-5" />,
  dusuk_deger: <Flame className="size-5" />,
  tekrar_dogrulama: <Recycle className="size-5" />,
};

// Öncelik → rozet tonu (etiket i18n'den, ton burada — enum güvenli key-map).
const ONCELIK_TON: Record<Oneri["oncelik"], "kirmizi" | "sari" | "gri"> = {
  yuksek: "kirmizi",
  orta: "sari",
  dusuk: "gri",
};

function verimlilikRenk(s: number) {
  return s >= 80 ? "#16a34a" : s >= 60 ? "#2f6fed" : s >= 40 ? "#d97706" : "#dc2626";
}

/* ------------------------------------------------------------------ Bileşen */

export function MaliyetOptimIstemci({
  dil,
  planAd,
  kota,
  kullanilan,
  kotaOran,
  verimlilik,
  israf,
  dagilim,
  oneriler,
  projeksiyon,
  trendSeri,
  trendEtiket,
  birimTL,
}: Props & { dil: Dil }) {
  const t = (k: string) => maliyetCeviri(k, dil);
  const locale = MO_LOCALE[dil];
  const tl = (n: number) => tlYap(n, locale);
  const sayi = (n: number) => sayiYap(n, locale);

  const toplamIsrafTL = israf.reduce((a, k) => a + k.tlIsraf, 0);
  const toplamIsrafKota = israf.reduce((a, k) => a + k.kotaIsraf, 0);
  const vRenk = verimlilikRenk(verimlilik.skor);
  const skorArti = projeksiyon.yeniSkor - projeksiyon.mevcutSkor;

  // Segment adı seçili dilde (key-map); ₺/CU veri kalır.
  const donutSeg = dagilim.map((s) => ({ etiket: segmentAd(s.key, dil), deger: Math.round(s.compute), renk: s.renk }));

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* giriş şeridi */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <PiggyBank className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("mo.serit.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {t("mo.serit.aciklama")
              .split("{plan}")
              .flatMap((parca, i) => (i === 0 ? [parca] : [<b key="plan">{planAd}</b>, parca]))}
          </p>
        </div>
      </div>

      {/* üst özet kartları */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart
          sayi={`%${verimlilik.skor}`}
          etiket={t("mo.ozet.verimlilik")}
          ikon={<Gauge className="size-5" />}
          tone={verimlilik.skor >= 60 ? "ok" : "warn"}
        />
        <StatKart
          sayi={`%${verimlilik.israfYuzde}`}
          etiket={t("mo.ozet.israfOran")}
          ikon={<TrendingDown className="size-5" />}
          tone={verimlilik.israfYuzde >= 25 ? "danger" : "warn"}
        />
        <StatKart sayi={tl(toplamIsrafTL)} etiket={t("mo.ozet.aylikIsraf")} ikon={<Flame className="size-5" />} tone="danger" />
        <StatKart
          sayi={tl(projeksiyon.toplamTLTasarruf)}
          etiket={t("mo.ozet.potansiyel")}
          ikon={<PiggyBank className="size-5" />}
          tone="ok"
        />
      </div>

      {/* verimlilik + kaynak dağılımı */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* verimlilik skoru büyük */}
        <Panel baslik={t("mo.verim.baslik")} className="lg:col-span-1">
          <div className="flex flex-col items-center py-2">
            <div className="relative grid size-44 place-items-center">
              <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#eceae2" strokeWidth="7" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke={vRenk}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 42}
                  strokeDashoffset={2 * Math.PI * 42 * (1 - verimlilik.skor / 100)}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-bold tabular-nums text-slate-ink">{verimlilik.skor}</span>
                <span className="text-xs font-medium" style={{ color: vRenk }}>
                  {verimlilik.skor >= 80
                    ? t("mo.verim.verimli")
                    : verimlilik.skor >= 60
                      ? t("mo.verim.iyi")
                      : verimlilik.skor >= 40
                        ? t("mo.verim.orta")
                        : t("mo.verim.israfli")}
                </span>
              </div>
            </div>
            <p className="mt-3 max-w-[240px] text-center text-[12.5px] text-slate-muted">{t("mo.verim.aciklama")}</p>
            <div className="mt-4 grid w-full grid-cols-2 gap-3 text-center">
              <div className="rounded-xl border border-line bg-canvas/40 px-3 py-2.5">
                <div className="num text-lg font-bold text-slate-ink">{sayi(Math.round(verimlilik.toplamCompute))}</div>
                <div className="text-[11px] text-slate-faint">{t("mo.verim.toplamCompute")}</div>
              </div>
              <div className="rounded-xl border border-line bg-canvas/40 px-3 py-2.5">
                <div className="num text-lg font-bold text-warn">{sayi(Math.round(verimlilik.israfCompute))}</div>
                <div className="text-[11px] text-slate-faint">{t("mo.verim.israfCompute")}</div>
              </div>
            </div>
          </div>
        </Panel>

        {/* kaynak dağılımı */}
        <Panel baslik={t("mo.dagilim.baslik")} className="lg:col-span-2">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <DonutDagilim segmentler={donutSeg} />
            <div className="flex-1 space-y-3">
              {dagilim.map((s) => (
                <div key={s.key}>
                  <div className="mb-1 flex items-center justify-between text-[13px]">
                    <span className="flex items-center gap-2 text-slate-muted">
                      <span className="size-2.5 rounded-full" style={{ background: s.renk }} />
                      {segmentAd(s.key, dil)}
                    </span>
                    <span className="font-semibold tabular-nums text-slate-ink">
                      %{s.yuzde} <span className="text-slate-faint">· {tl(s.tl)}</span>
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-canvas">
                    <div className="h-full rounded-full transition-all" style={{ width: `${s.yuzde}%`, background: s.renk }} />
                  </div>
                </div>
              ))}
              <p className="pt-1 text-[12px] text-slate-faint">{t("mo.dagilim.not")}</p>
            </div>
          </div>
        </Panel>
      </div>

      {/* israf analizi */}
      <Panel
        baslik={t("mo.israf.baslik")}
        sagUst={
          <Badge ton="kirmizi">
            <Flame className="size-3" /> {t("mo.israf.rozet").replace("{tl}", tl(toplamIsrafTL)).replace("{kota}", sayi(toplamIsrafKota))}
          </Badge>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          {israf.map((k) => {
            const sifir = k.adet === 0;
            const kat = israfKategoriMetin(k.key, dil);
            return (
              <div
                key={k.key}
                className={cn(
                  "flex flex-col rounded-2xl border p-4",
                  sifir ? "border-line bg-canvas/30" : "border-amber-200 bg-warn-soft/40",
                )}
              >
                <div className="flex items-start justify-between">
                  <span
                    className={cn(
                      "grid size-10 place-items-center rounded-xl",
                      sifir ? "bg-slate-100 text-slate-400" : "bg-warn-soft text-amber-700",
                    )}
                  >
                    {ISRAF_IKON[k.key]}
                  </span>
                  {sifir ? (
                    <Badge ton="yesil">{t("mo.israf.temiz")}</Badge>
                  ) : (
                    <span className="num text-right text-lg font-bold text-amber-700">{tl(k.tlIsraf)}</span>
                  )}
                </div>
                <div className="mt-3 text-[14px] font-semibold text-slate-ink">{kat.ad}</div>
                <p className="mt-1 flex-1 text-[12.5px] leading-relaxed text-slate-muted">{kat.aciklama}</p>
                <div className="mt-3 flex items-center gap-3 border-t border-line/70 pt-3 text-[12px]">
                  <span className="text-slate-muted">
                    <b className="num text-slate-ink">{sayi(k.adet)}</b> {t("mo.israf.dogrulama")}
                  </span>
                  <span className="text-slate-faint">·</span>
                  <span className="text-slate-muted">
                    <b className="num text-slate-ink">{sayi(k.kotaIsraf)}</b> {t("mo.israf.kota")}
                  </span>
                </div>
                {!sifir && (
                  <Button variant="outline" size="sm" href={k.duzeltmeHref} className="mt-3 w-full">
                    {kat.cta} <ArrowRight className="size-3.5" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </Panel>

      {/* optimizasyon önerileri */}
      <Panel
        baslik={t("mo.oneri.baslik")}
        sagUst={<Badge ton="brand"><Sparkles className="size-3" /> {t("mo.oneri.rozet").replace("{n}", String(oneriler.length))}</Badge>}
      >
        {oneriler.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line-strong bg-canvas/30 px-5 py-10 text-center">
            <Sparkles className="mx-auto mb-2 size-6 text-brand-400" />
            <p className="text-sm font-medium text-slate-ink">{t("mo.oneri.bosBaslik")}</p>
            <p className="mt-1 text-[13px] text-slate-muted">{t("mo.oneri.bosAciklama")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {oneriler.map((o) => {
              const on = oneriMetin(o.key, o.kotaTasarruf, dil);
              return (
                <div key={o.key} className="rounded-2xl border border-line bg-surface p-4 transition hover:border-line-strong">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Zap className="size-4 shrink-0 text-brand-600" />
                        <span className="text-[14px] font-semibold text-slate-ink">{on.baslik}</span>
                        <Badge ton={ONCELIK_TON[o.oncelik]}>{oncelikAd(o.oncelik, dil)}</Badge>
                      </div>
                      <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-muted">{on.aciklama}</p>
                      <p className="mt-2 flex items-start gap-1.5 text-[12px] text-brand-700">
                        <ShieldOff className="mt-0.5 size-3 shrink-0" /> {on.guvenlik}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="num text-xl font-bold text-ok">{tl(o.tlTasarruf)}</span>
                      <span className="text-[11px] text-slate-faint">
                        %{o.tasarrufYuzde} · {sayi(o.kotaTasarruf)} {t("mo.israf.kota")}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
                    <div className="flex-1">
                      <Ilerleme deger={Math.min(100, o.tasarrufYuzde * 2)} ton="ok" />
                    </div>
                    <Button variant="outline" size="sm" href={o.cta.href}>
                      {on.cta} <ArrowRight className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* tasarruf projeksiyonu */}
      <Panel baslik={t("mo.proj.baslik")}>
        <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          {/* sol: skor + ₺ karşılaştırma */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-green-200 bg-ok-soft/40 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-medium text-slate-muted">{t("mo.proj.verimlilik")}</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="num text-2xl font-bold text-slate-ink">{projeksiyon.mevcutSkor}</span>
                    <ArrowRight className="size-4 text-slate-faint" />
                    <span className="num text-3xl font-bold text-ok">{projeksiyon.yeniSkor}</span>
                    {skorArti > 0 && (
                      <span className="rounded-full bg-ok-soft px-2 py-0.5 text-[12px] font-semibold text-ok">
                        {t("mo.proj.puan").replace("{n}", String(skorArti))}
                      </span>
                    )}
                  </div>
                </div>
                <Gauge className="size-8 text-ok" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-line bg-canvas/40 p-4">
                <div className="flex items-center gap-2 text-slate-faint">
                  <Wallet className="size-4" />
                  <span className="text-[12px] font-medium">{t("mo.proj.aylikMaliyet")}</span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="num text-[15px] font-semibold text-slate-muted line-through">
                    {tl(projeksiyon.mevcutAylikTL)}
                  </span>
                </div>
                <div className="num text-2xl font-bold text-slate-ink">{tl(projeksiyon.yeniAylikTL)}</div>
              </div>
              <div className="rounded-2xl border border-line bg-canvas/40 p-4">
                <div className="flex items-center gap-2 text-slate-faint">
                  <PiggyBank className="size-4" />
                  <span className="text-[12px] font-medium">{t("mo.proj.toplamTasarruf")}</span>
                </div>
                <div className="num mt-2 text-2xl font-bold text-ok">{tl(projeksiyon.toplamTLTasarruf)}</div>
                <div className="text-[12px] text-slate-faint">
                  {t("mo.proj.kotaKurtarilir").replace("{n}", sayi(projeksiyon.toplamKotaTasarruf))}
                </div>
              </div>
            </div>
          </div>

          {/* sağ: kota bağlamı */}
          <div className="rounded-2xl border border-line bg-canvas/30 p-5">
            <div className="mb-2 flex items-center justify-between text-[13px]">
              <span className="font-medium text-slate-ink">{t("mo.proj.aylikKota")}</span>
              <span className="num font-semibold text-slate-muted">
                {sayi(kullanilan)} / {sayi(kota)}
              </span>
            </div>
            <Ilerleme deger={Math.min(100, kotaOran * 100)} ton={kotaOran >= 0.9 ? "danger" : kotaOran >= 0.7 ? "warn" : "brand"} />
            <p className="mt-3 text-[12.5px] leading-relaxed text-slate-muted">
              {t("mo.proj.aciklama")
                .split("{n}")
                .flatMap((parca, i) =>
                  i === 0 ? [parca] : [<b key="kota">{sayi(projeksiyon.toplamKotaTasarruf)}</b>, parca],
                )}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="accent" size="sm" href="/panel/zorluk">
                <Gauge className="size-4" /> {t("mo.proj.adaptifZorluk")}
              </Button>
              <Button variant="outline" size="sm" href="/panel/maliyet">
                <Wallet className="size-4" /> {t("mo.proj.maliyetFatura")}
              </Button>
            </div>
          </div>
        </div>
      </Panel>

      {/* 30g maliyet trendi */}
      <Panel baslik={t("mo.trend.baslik")}>
        <TrendGrafik noktalar={trendSeri} etiketler={trendEtiket} renk="#d97706" yukseklik={220} />
        <p className="mt-2 text-[12px] text-slate-faint">{t("mo.trend.aciklama")}</p>
      </Panel>

      {/* birim maliyet + dürüstlük notu */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-slate-ink">
            <Info className="size-4 text-brand-600" /> {t("mo.birim.baslik")}
          </div>
          <ul className="space-y-2 text-[12.5px] text-slate-muted">
            <li className="flex items-center justify-between">
              <span>{t("mo.birim.kota")}</span>
              <span className="num font-semibold text-slate-ink">{tl(birimTL.kota)}</span>
            </li>
            <li className="flex items-center justify-between">
              <span>{t("mo.birim.compute")}</span>
              <span className="num font-semibold text-slate-ink">{tl(birimTL.compute)}</span>
            </li>
            <li className="flex items-center justify-between border-t border-line pt-2">
              <span>{t("mo.birim.challenge")}</span>
              <span className="num font-semibold text-slate-ink">6 CU</span>
            </li>
            <li className="flex items-center justify-between">
              <span>{t("mo.birim.block")}</span>
              <span className="num font-semibold text-slate-ink">2 CU</span>
            </li>
            <li className="flex items-center justify-between">
              <span>{t("mo.birim.gecis")}</span>
              <span className="num font-semibold text-slate-ink">1 CU</span>
            </li>
          </ul>
        </div>
        <NotKutusu ton="sari" baslik={t("mo.not.baslik")}>
          <span className="text-[13px] leading-relaxed">
            {t("mo.not.govde")
              .split("{link}")
              .flatMap((parca, i) =>
                i === 0
                  ? [parca]
                  : [
                      <a key="link" className="font-semibold underline" href="/panel/maliyet">
                        {t("mo.not.link")}
                      </a>,
                      parca,
                    ],
              )}
          </span>
        </NotKutusu>
      </div>
    </div>
  );
}
