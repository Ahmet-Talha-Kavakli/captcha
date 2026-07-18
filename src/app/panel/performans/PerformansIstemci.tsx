"use client";

/**
 * Widget Performans Bütçesi & Core Web Vitals — istemci arayüzü
 * =============================================================
 * Satış argümanı: bot koruması ekleyen bir widget siteyi YAVAŞLATIRSA müşteri
 * kaybettirir. Bu panel Specter'in hafif ve CWV-dostu olduğunu KANITLAR.
 *
 * DÜRÜSTLÜK: script bayt boyutu GERÇEK ölçümdür (fs.statSync). gzip, parse,
 * bloklama, LCP/CLS/INP tüm değerleri MODELLENEN tahmindir — bu değerler
 * sunucudan müşterinin gerçek sahasında ölçülemez; gerçek saha ölçümü için
 * RUM (Gerçek Kullanıcı İzleme) gerekir. UI her modellenen değeri işaretler.
 *
 * ENUM / VERİ GÜVENLİĞİ: butce.ts'e dokunmadan, tüm gösterim etiketleri stabil
 * `anahtar` (scriptBoyut/gzipBoyut…) ve Durum enum'u (iyi/orta/kötü) ile yerel
 * sözlükten yeniden türetilir. Sayısal değerler/eşikler saf VERİ olarak geçer;
 * sayı biçimi Intl BCP-47 map ile yerelleşir.
 */

import { Panel, StatKart, Badge, NotKutusu } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import {
  Gauge,
  Zap,
  ShieldCheck,
  Feather,
  Download,
  Cpu,
  Layers,
  MousePointerClick,
  CircleCheck,
  CircleAlert,
  CircleX,
  Link2,
  Server,
  Scissors,
  Info,
} from "lucide-react";
import type { PerformansMetrik, PerformansSonuc, VitalKart, Durum } from "./butce";
import type { Dil } from "@/lib/i18n/panel";
import { pfCeviri, YEREL } from "./performans.i18n";

/* ------------------------------------------------------------ renk yardımcı */

// etiket enum'dan (Durum) çeviriyle türetilir; burada yalnızca renk/ikon tutulur.
const DURUM_META: Record<
  Durum,
  { renk: string; halka: string; cizgi: string; rozet: "yesil" | "sari" | "kirmizi"; ikon: typeof CircleCheck }
> = {
  iyi: { renk: "text-ok", halka: "#16a34a", cizgi: "bg-ok", rozet: "yesil", ikon: CircleCheck },
  orta: { renk: "text-warn", halka: "#d97706", cizgi: "bg-warn", rozet: "sari", ikon: CircleAlert },
  "kötü": { renk: "text-danger2", halka: "#dc2626", cizgi: "bg-danger2", rozet: "kirmizi", ikon: CircleX },
};

/* ------------------------------------------------------------ Skor halkası (inline SVG) */

function SkorHalka({ skor, harf, ton, t }: PerformansSonuc & { t: (k: string) => string }) {
  const R = 82;
  const cevre = 2 * Math.PI * R;
  const dolu = (skor / 100) * cevre;
  const meta = DURUM_META[ton];
  return (
    <div className="relative grid size-[220px] place-items-center">
      <svg viewBox="0 0 200 200" className="size-full -rotate-90">
        <circle cx="100" cy="100" r={R} fill="none" stroke="currentColor" strokeWidth="14" className="text-canvas" />
        <circle
          cx="100"
          cy="100"
          r={R}
          fill="none"
          stroke={meta.halka}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${dolu} ${cevre}`}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={cn("num text-[56px] font-bold leading-none", meta.renk)}>{skor}</span>
        <span className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-faint">{t("halka.altYazi")}</span>
        <span className={cn("mt-2 grid size-9 place-items-center rounded-full text-lg font-bold text-white", meta.cizgi)}>
          {harf}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ Bütçe çubuğu */

function ButceCubugu({ metrik, t, kat, pk }: { metrik: PerformansMetrik; t: (k: string) => string; kat: number; pk: number }) {
  const meta = DURUM_META[metrik.durum];
  // Çubuk = değerin bütçeye oranı. "düşük iyi" metriklerde dolu kısım ne kadar
  // az, o kadar iyi. %100 = bütçe sınırı.
  const oran = metrik.butce > 0 ? Math.min(140, (metrik.deger / metrik.butce) * 100) : 0;
  const headroom = metrik.butce - metrik.deger;
  const birim = t("birim." + metrik.birim);
  // Metin etiketleri lib TR yerine anahtar bazlı yerel sözlükten türetilir.
  const ad = t("metrik." + metrik.anahtar + ".ad");
  const aciklama = t("metrik." + metrik.anahtar + ".aciklama").replace("{kat}", String(kat)).replace("{pk}", String(pk));
  const oneri = t("metrik." + metrik.anahtar + ".oneri");
  return (
    <div className="border-b border-line py-4 last:border-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-medium text-slate-ink">{ad}</span>
          <Badge ton={metrik.kaynak === "ölçülen" ? "mavi" : "gri"}>
            {t("kaynak." + metrik.kaynak)}
          </Badge>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="num text-sm font-semibold text-slate-ink">
            {metrik.deger}
            <span className="text-slate-faint"> {birim}</span>
          </span>
          <span className="text-xs text-slate-faint">/ {t("cubuk.butce")} {metrik.butce}</span>
          <Badge ton={meta.rozet}>{t("durum." + metrik.durum)}</Badge>
        </div>
      </div>
      {/* Çubuk: bütçe sınırı %100'de kesikli çizgiyle işaretli */}
      <div className="relative mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-canvas">
        <div className={cn("h-full rounded-full transition-all duration-500", meta.cizgi)} style={{ width: `${Math.min(100, oran)}%` }} />
        {/* bütçe sınırı işareti (100/140 ölçeğinde ~%71) */}
        <div className="absolute inset-y-0 w-0.5 bg-slate-ink/40" style={{ left: `${(100 / 140) * 100}%` }} />
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] text-slate-muted">{aciklama}</p>
        <span className={cn("text-xs font-medium", headroom >= 0 ? "text-ok" : "text-danger2")}>
          {headroom >= 0
            ? t("cubuk.payVar").replace("{n}", String(Math.round(headroom * 10) / 10)).replace("{birim}", birim)
            : t("cubuk.asim").replace("{n}", String(Math.round(-headroom * 10) / 10)).replace("{birim}", birim)}
        </span>
      </div>
      <p className="mt-1.5 text-[12.5px] text-slate-faint">
        <span className="font-medium text-slate-muted">{t("cubuk.oneri")}</span> {oneri}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------ CWV kartı */

function VitalKarti({ v, t }: { v: VitalKart; t: (k: string) => string }) {
  const meta = DURUM_META[v.durum];
  const Ikon = meta.ikon;
  const ikonMap = { lcp: Layers, cls: Feather, inp: MousePointerClick };
  const Vi = ikonMap[v.anahtar];
  const birim = t("birim." + v.birim);
  // CWV metrik adı (LCP/CLS/INP) çevrilmez; parantez içi açıklama çevrilir.
  const ad = t("vitalAd." + v.anahtar);
  return (
    <div className="rounded-3xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between">
        <span className="grid size-10 place-items-center rounded-2xl bg-canvas text-slate-muted">
          <Vi className="size-5" />
        </span>
        <span className={cn("inline-flex items-center gap-1 text-sm font-semibold", meta.renk)}>
          <Ikon className="size-4" />
          {t("durum." + v.durum)}
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className={cn("num text-[34px] font-bold leading-none", meta.renk)}>{v.deger}</span>
        <span className="text-sm text-slate-faint">{birim}</span>
      </div>
      <p className="mt-1 text-sm font-medium text-slate-ink">{ad}</p>
      <p className="mt-1.5 text-[12.5px] text-slate-muted">
        {t("vital.katki").replace("{iyi}", String(v.iyiEsik)).replace("{kotu}", String(v.kotuEsik)).replace("{birim}", birim)}
      </p>
      {/* eşik konum çubuğu */}
      <div className="relative mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gradient-to-r from-ok via-warn to-danger2 opacity-80">
        <div
          className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-slate-ink shadow"
          style={{ left: `${Math.min(98, Math.max(2, (v.deger / (v.kotuEsik * 1.3)) * 100))}%` }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ Yükleme zaman çizelgesi */

function ZamanCizelgesi({ t }: { t: (k: string) => string }) {
  // Widget'ın bloklamadan nasıl yüklendiğini görsel anlatan aşamalar.
  const asamalar = [
    { anahtar: "asama1", ikon: Download, renk: "bg-slate-300", genislik: "18%" },
    { anahtar: "asama2", ikon: Zap, renk: "bg-brand-400", genislik: "26%" },
    { anahtar: "asama3", ikon: Cpu, renk: "bg-brand-500", genislik: "20%" },
    { anahtar: "asama4", ikon: Gauge, renk: "bg-ok", genislik: "16%" },
  ];
  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full">
        {asamalar.map((a) => (
          <div key={a.anahtar} className={cn("h-full", a.renk)} style={{ width: a.genislik }} />
        ))}
        <div className="h-full flex-1 bg-canvas" />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {asamalar.map((a, i) => {
          const A = a.ikon;
          return (
            <div key={a.anahtar} className="flex items-start gap-3 rounded-2xl border border-line bg-canvas/40 p-3">
              <span className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl text-white", a.renk)}>
                <A className="size-4" />
              </span>
              <div>
                <div className="flex items-center gap-1.5 text-sm font-medium text-slate-ink">
                  <span className="num text-xs text-slate-faint">{i + 1}.</span>
                  {t("zaman." + a.anahtar + ".ad")}
                </div>
                <p className="mt-0.5 text-[12.5px] text-slate-muted">{t("zaman." + a.anahtar + ".detay")}</p>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-[13px] text-slate-muted">
        {t("zaman.sonucA")} <span className="font-semibold text-ok">{t("zaman.sonucVurgu")}</span> {t("zaman.sonucB")}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------ Ana bileşen */

export function PerformansIstemci({
  gercekBaytlar,
  metrikler,
  skor,
  vitals,
  recaptchaTipikKb,
  gzipKatsayi,
  parseMsPerKb,
  dil,
}: {
  gercekBaytlar: number;
  metrikler: PerformansMetrik[];
  skor: PerformansSonuc;
  vitals: VitalKart[];
  recaptchaTipikKb: number;
  gzipKatsayi: number;
  parseMsPerKb: number;
  dil: Dil;
}) {
  const t = (k: string) => pfCeviri(k, dil);
  const kb = gercekBaytlar / 1024;
  const gzipKb = kb * gzipKatsayi;
  const scriptMetrik = metrikler.find((m) => m.anahtar === "scriptBoyut")!;
  const blokMetrik = metrikler.find((m) => m.anahtar === "blokMs")!;

  // Karşılaştırma: Specter (gerçek gzip tahmini) vs sektör tipik reCAPTCHA.
  const specterVsRecaptcha = Math.round((1 - gzipKb / recaptchaTipikKb) * 100);
  const specterCubuk = (gzipKb / recaptchaTipikKb) * 100;

  const oneriler = [
    { anahtar: "async", ikon: Zap },
    { anahtar: "preconnect", ikon: Link2 },
    { anahtar: "selfhost", ikon: Server },
    { anahtar: "treeshake", ikon: Scissors },
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* Dürüstlük şeridi */}
      <NotKutusu ton="bilgi" baslik={t("durustluk.baslik")}>
        <span className="font-medium">{t("durustluk.gercekEtiket")}</span> {t("durustluk.gercekMetin")}{" "}
        <code className="rounded bg-white/60 px-1 num">fs.statSync</code> {t("durustluk.ile")}{" "}
        <span className="num">{gercekBaytlar.toLocaleString(YEREL[dil])}</span>{" "}
        {t("durustluk.bayt")}{" "}
        <span className="font-medium">{t("durustluk.modelEtiket")}</span> {t("durustluk.modelMetin")}
      </NotKutusu>

      {/* Üst: skor halkası + özet statlar */}
      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        <Panel className="grid place-items-center">
          <div className="flex flex-col items-center gap-3 py-2">
            <SkorHalka {...skor} t={t} />
            <div className="flex items-center gap-2 text-sm text-slate-muted">
              <ShieldCheck className="size-4 text-ok" />
              {t("halka.lighthouse")}
            </div>
          </div>
        </Panel>

        <div className="grid gap-4 sm:grid-cols-2">
          <StatKart
            sayi={`${scriptMetrik.deger} KB`}
            etiket={t("stat.hamScript")}
            ikon={<Download className="size-5" />}
            tone={scriptMetrik.durum === "iyi" ? "ok" : scriptMetrik.durum === "orta" ? "warn" : "danger"}
          />
          <StatKart
            sayi={`${Math.round(gzipKb * 10) / 10} KB`}
            etiket={t("stat.aktarim")}
            ikon={<Feather className="size-5" />}
            tone="ok"
          />
          <StatKart
            sayi={`${blokMetrik.deger} ms`}
            etiket={t("stat.bloklama")}
            ikon={<Cpu className="size-5" />}
            tone={blokMetrik.durum === "iyi" ? "ok" : "warn"}
          />
          <StatKart
            sayi={`~%${specterVsRecaptcha}`}
            etiket={t("stat.hafif")}
            ikon={<Feather className="size-5" />}
            tone="ok"
          />
        </div>
      </div>

      {/* Core Web Vitals kartları */}
      <Panel baslik={t("cwv.baslik")}>
        <p className="mb-4 text-[13px] text-slate-muted">
          {t("cwv.aciklamaA")} <span className="font-medium text-ok">{t("cwv.sifira")}</span> {t("cwv.aciklamaB")}{" "}
          <span className="num">web.dev</span> {t("cwv.aciklamaC")}
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {vitals.map((v) => (
            <VitalKarti key={v.anahtar} v={v} t={t} />
          ))}
        </div>
      </Panel>

      {/* Performans bütçesi tablosu */}
      <Panel baslik={t("butce.baslik")}>
        <div className="-mt-1">
          {metrikler.map((m) => (
            <ButceCubugu key={m.anahtar} metrik={m} t={t} kat={gzipKatsayi} pk={parseMsPerKb} />
          ))}
        </div>
      </Panel>

      {/* Yükleme zaman çizelgesi */}
      <Panel baslik={t("zaman.baslik")}>
        <ZamanCizelgesi t={t} />
      </Panel>

      {/* Karşılaştırma */}
      <Panel baslik={t("kars.baslik")}>
        <div className="space-y-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-ink">{t("kars.specter")}</span>
              <span className="num font-semibold text-ok">{Math.round(gzipKb * 10) / 10} KB</span>
            </div>
            <div className="h-4 w-full overflow-hidden rounded-full bg-canvas">
              <div className="flex h-full items-center justify-end rounded-full bg-ok pr-2 transition-all duration-500" style={{ width: `${Math.max(6, specterCubuk)}%` }} />
            </div>
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-ink">{t("kars.recaptcha")}</span>
              <span className="num font-semibold text-slate-muted">~{recaptchaTipikKb} KB</span>
            </div>
            <div className="h-4 w-full overflow-hidden rounded-full bg-canvas">
              <div className="h-full rounded-full bg-slate-400 transition-all duration-500" style={{ width: "100%" }} />
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-xl border border-line bg-canvas/40 px-3 py-2.5">
            <Info className="mt-0.5 size-4 shrink-0 text-slate-faint" />
            <p className="text-[12.5px] text-slate-muted">
              {t("kars.notA")} <span className="font-medium">{t("kars.notVurgu")}</span> {t("kars.notB")}
            </p>
          </div>
        </div>
      </Panel>

      {/* Optimizasyon önerileri */}
      <Panel baslik={t("oneri.baslik")}>
        <div className="grid gap-3 sm:grid-cols-2">
          {oneriler.map((o) => {
            const O = o.ikon;
            return (
              <div key={o.anahtar} className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <O className="size-4" />
                </span>
                <div>
                  <div className="text-sm font-medium text-slate-ink">{t("oneri." + o.anahtar + ".ad")}</div>
                  <p className="mt-0.5 text-[13px] text-slate-muted">{t("oneri." + o.anahtar + ".detay")}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button variant="accent" size="sm" href="/panel/entegrasyon-saglik">
            {t("oneri.ctaButon")}
          </Button>
          <span className="text-[13px] text-slate-muted">
            {t("oneri.ctaMetin")}
          </span>
        </div>
      </Panel>
    </div>
  );
}
