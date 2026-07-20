"use client";

/**
 * Etkileşim Analizi — Davranışsal Adli Görselleştirme Konsolu
 * ===========================================================
 * `etkilesim-analiz.ts` içindeki SAF, deterministik fonksiyonları çağırıp
 * (db/Date/Math.random dokunmaz) fare-hareket ısı haritasını, zamanlama
 * dağılımlarını ve insan↔bot sinyal ayrımını görselleştirir. Isı haritası
 * inline SVG + CSS grid ile çizilir (harici kütüphane yok, CSP-güvenli).
 */

import { useMemo, useState } from "react";
import {
  MousePointer,
  Grid3x3,
  Gauge,
  Fingerprint,
  Activity,
  Zap,
  ArrowRight,
  Info,
  User,
  Bot,
  Keyboard,
} from "lucide-react";
import { Panel, StatKart, Badge } from "@/components/panel/kit";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { etkilesimCeviri } from "./etkilesim.i18n";
import {
  hareketIsiHaritasi,
  isiMetrik,
  zamanlamaDagilimi,
  etkilesimKarsilastir,
  tiklamaDeseni,
  IZGARA_GENISLIK,
  IZGARA_YUKSEKLIK,
  type IsiArketip,
  type EtkilesimOzet,
  type TrafikDagilim,
} from "@/lib/specter/etkilesim-analiz";

interface Props {
  arketipler: IsiArketip[];
  ozet: EtkilesimOzet;
  trafik: TrafikDagilim;
  varsayilanInsan: string;
  varsayilanBot: string;
  dil: Dil;
}

/** Bir arketibin görünen adını lib TR'sinden değil, kimlik anahtarından çevirir. */
function arketipAd(kimlik: string, t: (k: string) => string): string {
  return t(`et.ark.${kimlik}.ad`);
}

/**
 * Lib'in ürettiği (sabit) TR desen-özeti metnini kararlı bir sözlük anahtarına
 * eşler. Lib'e dokunmadan çeviri sağlamanın yolu: metin → anahtar. Eşleşme
 * yoksa metnin kendisi (TR) döner, böylece hiçbir zaman boş kalmaz.
 */
function desenOzetAnahtar(ozetTr: string): string {
  const harita: Record<string, string> = {
    "Etkileşim yok — form programatik dolduruldu, anında gönderildi.": "et.ozet.yok",
    "Mekanik tuş ritmi (sabit aralık) — kayıt-tekrar/otomasyon imzası.": "et.ozet.mekanik",
    "Çözüm yapıştırıldı — dışarıdan enjeksiyon işareti.": "et.ozet.yapistir",
    "Değişken tuş ritmi + doğal fare — insansı etkileşim dizisi.": "et.ozet.insansi",
    "Sınırda dizi — bazı sinyaller insansı, bazıları sentetik.": "et.ozet.sinirda",
  };
  return harita[ozetTr] ?? ozetTr;
}

/* ------------------------------------------------------------------ Renk ölçekleri */
/** Yoğunluk 0..1 → renk. İnsan yeşil-mavi organik; bot amber-kırmızı mekanik. */
function isiRenk(v: number, taraf: "insan" | "bot"): string {
  if (v <= 0.001) return "transparent";
  const a = Math.max(0.08, Math.min(1, v));
  if (taraf === "insan") {
    // koyu indigo → parlak camgöbeği (organik enerji)
    return `rgba(${Math.round(37 + v * 20)}, ${Math.round(99 + v * 90)}, ${Math.round(235 - v * 40)}, ${a})`;
  }
  // amber → kırmızı (mekanik/sparse)
  return `rgba(${Math.round(217 + v * 30)}, ${Math.round(119 - v * 90)}, ${Math.round(60 - v * 50)}, ${a})`;
}

/* ------------------------------------------------------------------ Isı haritası SVG */
function IsiHaritasi({ izgara, taraf, t }: { izgara: number[][]; taraf: "insan" | "bot"; t: (k: string) => string }) {
  const g = IZGARA_GENISLIK;
  const y = IZGARA_YUKSEKLIK;
  const hucre = 22;
  const bosluk = 2;
  const genislik = g * (hucre + bosluk);
  const yukseklik = y * (hucre + bosluk);
  return (
    <svg
      viewBox={`0 0 ${genislik} ${yukseklik}`}
      className="h-auto w-full rounded-2xl bg-canvas/60"
      role="img"
      aria-label={taraf === "insan" ? t("et.isi.aria.insan") : t("et.isi.aria.bot")}
    >
      {izgara.map((satir, j) =>
        satir.map((v, i) => (
          <rect
            key={`${i}-${j}`}
            x={i * (hucre + bosluk)}
            y={j * (hucre + bosluk)}
            width={hucre}
            height={hucre}
            rx={4}
            fill={isiRenk(v, taraf)}
            stroke={v > 0.001 ? "none" : "rgba(148,163,184,0.10)"}
            strokeWidth={0.5}
          >
            {v > 0.15 && (
              <animate
                attributeName="opacity"
                values="0.75;1;0.75"
                dur={`${2.4 + (i % 5) * 0.3}s`}
                repeatCount="indefinite"
              />
            )}
          </rect>
        )),
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ Histogram çubukları */
function Histogram({ kutular, renk }: { kutular: { etiket: string; deger: number }[]; renk: string }) {
  const maks = Math.max(1, ...kutular.map((k) => k.deger));
  return (
    <div className="flex items-end gap-1.5" style={{ height: 96 }}>
      {kutular.map((k) => (
        <div key={k.etiket} className="flex flex-1 flex-col items-center gap-1">
          <div className="flex w-full flex-1 items-end">
            <div
              className="w-full rounded-t transition-[height] duration-500 motion-reduce:transition-none"
              style={{ height: `${(k.deger / maks) * 100}%`, minHeight: k.deger > 0 ? 4 : 0, background: renk }}
              title={`${k.etiket}: ${k.deger}`}
            />
          </div>
          <span className="text-[9px] leading-none text-slate-faint">{k.etiket.replace("ms", "")}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ Ana bileşen */
export function EtkilesimIstemci({ arketipler, ozet, trafik, varsayilanInsan, varsayilanBot, dil }: Props) {
  const t = (k: string) => etkilesimCeviri(k, dil);
  const [seciliIsi, setSeciliIsi] = useState<string>(varsayilanInsan);
  const [insanAnahtar, setInsanAnahtar] = useState<string>(varsayilanInsan);
  const [botAnahtar, setBotAnahtar] = useState<string>(varsayilanBot);

  const aktifArketip = useMemo(
    () => arketipler.find((a) => a.kimlik === seciliIsi) ?? arketipler[0],
    [arketipler, seciliIsi],
  );
  const izgara = useMemo(() => hareketIsiHaritasi(seciliIsi), [seciliIsi]);
  const metrik = useMemo(() => isiMetrik(izgara), [izgara]);
  const desen = useMemo(() => tiklamaDeseni(seciliIsi), [seciliIsi]);
  // arketipler boş gelirse aktifArketip undefined olur → guard'sız erişim çökerdi.
  const isiTaraf: "insan" | "bot" = aktifArketip?.beklenen ?? "insan";

  const kars = useMemo(() => etkilesimKarsilastir(insanAnahtar, botAnahtar), [insanAnahtar, botAnahtar]);
  const zi = useMemo(() => zamanlamaDagilimi(insanAnahtar), [insanAnahtar]);
  const zb = useMemo(() => zamanlamaDagilimi(botAnahtar), [botAnahtar]);

  const insanArketipler = arketipler.filter((a) => a.beklenen === "insan");
  const botArketipler = arketipler.filter((a) => a.beklenen === "bot");

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* açıklama şeridi */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <MousePointer className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">
            {t("et.giris.baslik")}
          </p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {t("et.giris.metin")}
          </p>
        </div>
      </div>

      {/* özet kartları */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart
          sayi={`%${ozet.ayrilabilirlik}`}
          etiket={t("et.kart.ayrilabilirlik")}
          ikon={<Fingerprint className="size-5" />}
          tone={ozet.ayrilabilirlik >= 70 ? "ok" : "warn"}
        />
        <StatKart
          sayi={`${ozet.insanEntropi.toFixed(1)} / ${ozet.botEntropi.toFixed(1)}`}
          etiket={t("et.kart.entropi")}
          ikon={<Grid3x3 className="size-5" />}
        />
        <StatKart
          sayi={`${ozet.insanSayi}+${ozet.botSayi}`}
          etiket={t("et.kart.arketip")}
          ikon={<Activity className="size-5" />}
        />
        <StatKart
          sayi={trafik.toplam > 0 ? `%${Math.round(trafik.botOran * 100)}` : "—"}
          etiket={t("et.kart.canliBot")}
          ikon={<Bot className="size-5" />}
          tone={trafik.botOran > 0.5 ? "danger" : "brand"}
        />
      </div>

      {/* ISI HARİTASI — merkez */}
      <Panel baslik={t("et.isi.baslik")} sagUst={<Badge ton={isiTaraf === "insan" ? "mavi" : "kirmizi"}>{isiTaraf === "insan" ? t("et.rozet.insan") : t("et.rozet.bot")}</Badge>}>
        {/* arketip seçici */}
        <div className="mb-4 flex flex-wrap gap-2">
          {arketipler.map((a) => (
            <button
              key={a.kimlik}
              onClick={() => setSeciliIsi(a.kimlik)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition",
                seciliIsi === a.kimlik
                  ? a.beklenen === "insan"
                    ? "border-blue-300 bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                    : "border-red-300 bg-danger-soft text-red-700 ring-1 ring-red-200"
                  : "border-line text-slate-muted hover:border-line-strong hover:text-slate-ink",
              )}
            >
              {a.beklenen === "insan" ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
              {arketipAd(a.kimlik, t)}
            </button>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <IsiHaritasi izgara={izgara} taraf={isiTaraf} t={t} />
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-faint">
              <span>{t("et.isi.eksen")}</span>
              <span className="flex items-center gap-1.5">
                {t("et.isi.dusuk")}
                <span className="h-2 w-16 rounded-full" style={{ background: `linear-gradient(90deg, ${isiRenk(0.1, isiTaraf)}, ${isiRenk(1, isiTaraf)})` }} />
                {t("et.isi.yuksek")}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-[14px] font-semibold text-slate-ink">{arketipAd(aktifArketip.kimlik, t)}</div>
              <p className="mt-1 text-[12.5px] leading-relaxed text-slate-muted">{t(`et.ark.${aktifArketip.kimlik}.ac`)}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {aktifArketip.etiketler.map((_e, ei) => (
                  <span key={ei} className="rounded-full bg-canvas px-2 py-0.5 text-[11px] font-medium text-slate-muted">{t(`et.ark.${aktifArketip.kimlik}.e${ei}`)}</span>
                ))}
              </div>
            </div>

            {/* ısı metrikleri */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-line bg-canvas/40 px-3 py-2.5">
                <div className="num text-[20px] font-bold text-slate-ink">{metrik.doluHucre}</div>
                <div className="text-[11px] text-slate-faint">{t("et.metrik.doluHucre").replace("{n}", String(metrik.toplamHucre))}</div>
              </div>
              <div className="rounded-xl border border-line bg-canvas/40 px-3 py-2.5">
                <div className="num text-[20px] font-bold text-slate-ink">{metrik.entropi.toFixed(2)}</div>
                <div className="text-[11px] text-slate-faint">{t("et.metrik.entropi")}</div>
              </div>
              <div className="rounded-xl border border-line bg-canvas/40 px-3 py-2.5">
                <div className="num text-[20px] font-bold text-slate-ink">%{Math.round(metrik.kapsama * 100)}</div>
                <div className="text-[11px] text-slate-faint">{t("et.metrik.kapsama")}</div>
              </div>
              <div className="rounded-xl border border-line bg-canvas/40 px-3 py-2.5">
                <div className="num text-[20px] font-bold text-slate-ink">{metrik.ortYogunluk.toFixed(2)}</div>
                <div className="text-[11px] text-slate-faint">{t("et.metrik.yogunluk")}</div>
              </div>
            </div>
            <p className="flex items-start gap-1.5 text-[12px] text-slate-muted">
              <Info className="mt-0.5 size-3.5 shrink-0 text-brand-500" />
              {isiTaraf === "insan" ? t("et.isi.aciklama.insan") : t("et.isi.aciklama.bot")}
            </p>
          </div>
        </div>
      </Panel>

      {/* TIKLAMA / TUŞ DESENİ zaman çizelgesi */}
      <Panel baslik={t("et.desen.baslik")}>
        <p className="mb-3 text-[13px] text-slate-muted">{t(desenOzetAnahtar(desen.ozet))}</p>
        <div className="flex flex-wrap items-center gap-1 overflow-x-auto rounded-2xl border border-line bg-canvas/40 p-3">
          {desen.adimlar.map((adim, i) => {
            const renk =
              adim.isaret === "insan" ? "bg-blue-100 text-blue-700 border-blue-200"
              : adim.isaret === "bot" ? "bg-danger-soft text-red-700 border-red-200"
              : "bg-slate-100 text-slate-500 border-slate-200";
            const genislik = Math.max(20, Math.min(90, adim.sure / 4));
            if (adim.tur === "bosluk" && !adim.etiket) {
              return <span key={i} className="h-0.5 rounded bg-slate-200" style={{ width: genislik }} title={`${adim.sure}ms`} />;
            }
            return (
              <span
                key={i}
                className={cn("inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium", renk)}
                title={`${adim.tur} · ${adim.sure}ms`}
              >
                {adim.tur === "tus" && <Keyboard className="size-3" />}
                {adim.tur === "gonderim" && <Zap className="size-3" />}
                {adim.tur === "fare" && <MousePointer className="size-3" />}
                {adim.etiket ? t(`et.adim.${adim.etiket}`) : t(`et.tur.${adim.tur}`)}
              </span>
            );
          })}
        </div>
        <div className="mt-2 text-[11px] text-slate-faint">
          {t("et.desen.toplamSure")} <span className="num font-semibold text-slate-muted">{desen.toplamSure}ms</span> · {t("et.desen.renkNotu")}
        </div>
      </Panel>

      {/* KARŞILAŞTIRMA — insan vs bot seçim */}
      <Panel baslik={t("et.kars.baslik")}>
        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-blue-700"><User className="size-3.5" /> {t("et.kars.insanArketip")}</span>
            <select
              value={insanAnahtar}
              onChange={(e) => setInsanAnahtar(e.target.value)}
              className="h-10 w-full rounded-xl border border-line-strong bg-surface px-3 text-sm text-slate-ink outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            >
              {insanArketipler.map((a) => <option key={a.kimlik} value={a.kimlik}>{arketipAd(a.kimlik, t)}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-red-700"><Bot className="size-3.5" /> {t("et.kars.botArketip")}</span>
            <select
              value={botAnahtar}
              onChange={(e) => setBotAnahtar(e.target.value)}
              className="h-10 w-full rounded-xl border border-line-strong bg-surface px-3 text-sm text-slate-ink outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            >
              {botArketipler.map((a) => <option key={a.kimlik} value={a.kimlik}>{arketipAd(a.kimlik, t)}</option>)}
            </select>
          </label>
        </div>

        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-canvas/50 p-4">
          <Gauge className="size-6 text-brand-600" />
          <div>
            <div className="num text-[26px] font-bold" style={{ color: kars.ayrilabilirlik >= 70 ? "#16a34a" : kars.ayrilabilirlik >= 50 ? "#d97706" : "#dc2626" }}>
              %{kars.ayrilabilirlik}
            </div>
            <div className="text-[13px] text-slate-muted">{t("et.kars.ayrilabilirlik")}</div>
          </div>
        </div>

        {/* sinyal-sinyal ayrım çubukları */}
        <div className="space-y-3">
          {kars.satirlar.map((r) => (
            <div key={r.anahtar} className="rounded-xl border border-line bg-surface px-4 py-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[13px] font-medium text-slate-ink">{t(`et.sinyal.${r.anahtar}`)}</span>
                <Badge ton={r.ayrimGucu >= 0.6 ? "yesil" : r.ayrimGucu >= 0.3 ? "sari" : "gri"}>
                  {t("et.kars.ayrim").replace("{n}", String(Math.round(r.ayrimGucu * 100)))}
                </Badge>
              </div>
              {/* insan vs bot değer çubukları */}
              <div className="space-y-1.5">
                <SinyalCubuk etiket={t("et.kars.insan")} deger={r.insanDeger} maks={Math.max(r.insanDeger, r.botDeger, 0.0001)} birim={r.birim} renk="#2563eb" />
                <SinyalCubuk etiket={t("et.kars.bot")} deger={r.botDeger} maks={Math.max(r.insanDeger, r.botDeger, 0.0001)} birim={r.birim} renk="#dc2626" />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* ZAMANLAMA DAĞILIMLARI */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel baslik={t("et.zaman.insan")}>
          <Histogram kutular={zi.tusRitmi} renk="#2563eb" />
          <div className="mt-3 flex items-center justify-between text-[12px] text-slate-muted">
            <span>{t("et.zaman.cv")} <span className="num font-semibold text-blue-700">{zi.ritimCv.toFixed(2)}</span></span>
            <span>{t("et.zaman.gonderim")} <span className="num font-semibold">{zi.gonderim}ms</span></span>
          </div>
          <p className="mt-1.5 text-[11.5px] text-slate-faint">{t("et.zaman.not.insan")}</p>
        </Panel>
        <Panel baslik={t("et.zaman.bot")}>
          <Histogram kutular={zb.tusRitmi} renk="#dc2626" />
          <div className="mt-3 flex items-center justify-between text-[12px] text-slate-muted">
            <span>{t("et.zaman.cv")} <span className="num font-semibold text-red-700">{zb.ritimCv.toFixed(2)}</span></span>
            <span>{t("et.zaman.gonderim")} <span className="num font-semibold">{zb.gonderim}ms</span></span>
          </div>
          <p className="mt-1.5 text-[11.5px] text-slate-faint">{t("et.zaman.not.bot")}</p>
        </Panel>
      </div>

      {/* AÇIKLAYICI */}
      <Panel baslik={t("et.aciklayici.baslik")}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { ikon: <MousePointer className="size-4" />, k: "k1" },
            { ikon: <Keyboard className="size-4" />, k: "k2" },
            { ikon: <Gauge className="size-4" />, k: "k3" },
            { ikon: <Grid3x3 className="size-4" />, k: "k4" },
            { ikon: <Fingerprint className="size-4" />, k: "k5" },
            { ikon: <Zap className="size-4" />, k: "k6" },
          ].map((k) => (
            <div key={k.k} className="rounded-2xl border border-line bg-surface p-4">
              <span className="mb-2 inline-grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-600">{k.ikon}</span>
              <div className="text-[13.5px] font-semibold text-slate-ink">{t(`et.${k.k}.baslik`)}</div>
              <p className="mt-1 text-[12.5px] leading-relaxed text-slate-muted">{t(`et.${k.k}.metin`)}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-line bg-canvas/40 px-5 py-4 text-[13px] text-slate-muted">
          <ArrowRight className="mt-0.5 size-4 shrink-0 text-brand-500" />
          <span>{t("et.aciklayici.dipnot")}</span>
        </div>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ Sinyal değer çubuğu */
function SinyalCubuk({ etiket, deger, maks, birim, renk }: { etiket: string; deger: number; maks: number; birim: string; renk: string }) {
  const oran = maks > 0 ? Math.min(100, (deger / maks) * 100) : 0;
  const gosterim = deger >= 100 ? Math.round(deger) : deger >= 1 ? deger.toFixed(0) : deger.toFixed(2);
  return (
    <div className="flex items-center gap-2">
      <span className="w-10 shrink-0 text-[11px] font-medium text-slate-faint">{etiket}</span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-canvas">
        <div className="h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${oran}%`, background: renk }} />
      </div>
      <span className="num w-20 shrink-0 text-right text-[11px] font-semibold text-slate-ink">{gosterim}{birim}</span>
    </div>
  );
}
