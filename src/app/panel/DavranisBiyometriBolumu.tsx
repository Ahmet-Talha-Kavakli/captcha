"use client";

/**
 * Specter — Davranışsal Biyometri (Behavioral Biometrics)
 * =======================================================
 * Ghost-font kodun doğru girilmesi tek sinyal değildir. Widget kullanıcının
 * DAVRANIŞINI de toplar: tuş-basma süreleri (dwell), tuşlar-arası aralıklar
 * (flight), fare hızı/ivmesi, dokunuş basıncı. İnsan davranışı DOĞAL bir imza
 * taşır — yüksek ama yapısal varyans, pürüzsüz ivme, doğal entropi. Bot ise iki
 * uçtan birine düşer: FAZLA DÜZENLİ (script, varyans ~0) ya da FAZLA RASTGELE
 * (uniform gürültü enjekte, insan-dışı düz dağılım). Motor ham sinyal
 * dizilerinden istatistiksel özellikler çıkarır (CV, entropi, çarpıklık, jerk,
 * KS mesafesi) ve açıklanabilir bir "insanlık skoru" üretir.
 *
 * HİÇBİR sayı uydurma değildir — hepsi `davranis-biyometri` motorundan
 * (biyometriAnaliz + ornekSinyal) türetilir; SERVER'da hesaplanıp buraya
 * hazır BiyometriKart[] prop gelir.
 *
 * Tasarım: TlsIstihbaratBolumu / FedereBolumu ile birebir aynı dil — Panel +
 * krem kartlar (bg-canvas), tabular-nums, rounded kartlar; framer-motion rise
 * (azHareket → sade). whileInView / viewport / opacity-fade YOK.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Fingerprint,
  User,
  Bot,
  Smartphone,
  Terminal,
  ShieldCheck,
  ShieldAlert,
  Gauge,
  ChevronDown,
  Activity,
  HelpCircle,
  Waves,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Panel, Badge } from "@/components/panel/kit";
import type { BiyometriSonuc, OrnekTur } from "@/lib/specter/davranis-biyometri";
import { SINIF_RENK } from "@/lib/specter/davranis-biyometri";

/* ================================================================== Tipler */

/** Bir örnek profilin analiz sonucu (server'da hesaplanıp gelir). */
export interface BiyometriKart {
  tur: OrnekTur;
  sonuc: BiyometriSonuc;
}

/* ================================================================== Sabitler */

/** Örnek tür → TR ad + kısa açıklama + ikon. */
const TUR_TANIM: Record<OrnekTur, { ad: string; alt: string; ikon: React.ElementType }> = {
  "insan":        { ad: "Gerçek İnsan (masaüstü)", alt: "Yapısal varyans, sağa-çarpık ritim", ikon: User },
  "mobil-insan":  { ad: "Gerçek İnsan (mobil)",    alt: "Dokunuş basıncı + doğal ritim",       ikon: Smartphone },
  "script-bot":   { ad: "Script Bot",              alt: "Sabit gecikmeler, varyans ~0",        ikon: Terminal },
  "gurultu-bot":  { ad: "Gürültü Bot",             alt: "Uniform gürültü, insan-dışı düz dağılım", ikon: Bot },
};

/** Sınıf → TR etiket + rozet tonu. */
const SINIF_TANIM: Record<BiyometriSonuc["sinif"], { ad: string; rozet: "yesil" | "sari" | "kirmizi"; ikon: React.ElementType }> = {
  "insan":   { ad: "İnsan",   rozet: "yesil",   ikon: ShieldCheck },
  "şüpheli": { ad: "Şüpheli", rozet: "sari",    ikon: HelpCircle },
  "bot":     { ad: "Bot",     rozet: "kirmizi", ikon: ShieldAlert },
};

/* ================================================================== Yardımcılar */

/** 0-1 skoru yüzdeye çevir. */
function yuzde(n: number): number {
  return Math.round((Number.isFinite(n) ? n : 0) * 100);
}

/** İnsanımsılık (0-1) → renk (hex). */
function katkiRenk(v: number): string {
  if (v >= 0.65) return "#16a34a";
  if (v >= 0.4) return "#d97706";
  return "#dc2626";
}

/** Bölümü rise ile saran motion sarmalayıcı (TlsIstihbaratBolumu ile aynı). */
function Bolum({
  azHareket,
  gecikme = 0,
  children,
}: {
  azHareket: boolean;
  gecikme?: number;
  children: React.ReactNode;
}) {
  if (azHareket) return <div>{children}</div>;
  return (
    <motion.div
      initial={{ y: 12 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, delay: gecikme, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Panel başlığında ikon + metin. */
function BaslikIkon({ ikon: Ikon, metin }: { ikon: React.ElementType; metin: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Ikon className="size-4 text-slate-faint" />
      {metin}
    </span>
  );
}

/* ================================================================== Özet hapı */

function OzetHap({
  ikon: Ikon,
  etiket,
  deger,
  ek,
  ton = "ink",
}: {
  ikon: React.ElementType;
  etiket: string;
  deger: string;
  ek?: string;
  ton?: "ink" | "danger" | "ok" | "warn";
}) {
  const renk =
    ton === "danger" ? "text-danger2" : ton === "ok" ? "text-ok" : ton === "warn" ? "text-warn" : "text-slate-ink";
  return (
    <div className="rounded-xl border border-line bg-canvas/40 px-3.5 py-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-faint">
        <Ikon className="size-3.5" />
        {etiket}
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className={cn("text-[22px] font-bold leading-none num", renk)}>{deger}</span>
        {ek && <span className="truncate text-[12px] text-slate-faint">{ek}</span>}
      </div>
    </div>
  );
}

/* ================================================================== Özellik katkı barı */

/**
 * Bir özelliğin insanımsılık katkısını bar olarak çizer. Sadece motorun
 * ürettiği katki.insanimsilik'i görselleştirir — sayı uydurma yok.
 */
function KatkiBar({
  ad,
  insanimsilik,
  band,
  aciklama,
  azHareket,
  gecikme,
}: {
  ad: string;
  insanimsilik: number;
  band: string;
  aciklama: string;
  azHareket: boolean;
  gecikme: number;
}) {
  const oran = yuzde(insanimsilik);
  const hex = katkiRenk(insanimsilik);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-[11.5px] font-medium text-slate-muted" title={aciklama}>
          {ad}
        </span>
        <span className="shrink-0 text-[11.5px] font-semibold tabular-nums" style={{ color: hex }}>
          %{oran}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-canvas">
        <motion.div
          className="h-full rounded-full"
          style={{ background: hex }}
          initial={azHareket ? false : { width: 0 }}
          animate={azHareket ? undefined : { width: `${Math.max(4, oran)}%` }}
          transition={{ duration: 0.6, delay: azHareket ? 0 : gecikme, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <p className="mt-1 text-[10.5px] leading-snug text-slate-faint">
        İnsan bandı: <span className="font-medium text-slate-muted">{band}</span>
      </p>
    </div>
  );
}

/* ================================================================== Profil kartı */

function ProfilKart({ kart, azHareket, acik, onToggle }: { kart: BiyometriKart; azHareket: boolean; acik: boolean; onToggle: () => void }) {
  const { tur, sonuc } = kart;
  const turTanim = TUR_TANIM[tur];
  const TurIkon = turTanim.ikon;
  const sinifTanim = SINIF_TANIM[sonuc.sinif];
  const SinifIkon = sinifTanim.ikon;
  const hex = SINIF_RENK[sonuc.sinif];
  const skorYuzde = yuzde(sonuc.insanlikSkoru);
  const bot = sonuc.sinif === "bot";

  return (
    <div
      className={cn(
        "rounded-2xl border bg-canvas/40 p-4 transition",
        bot ? "border-red-200 bg-danger-soft/25" : "border-line",
        acik && "ring-1 ring-inset ring-slate-300",
      )}
    >
      {/* Üst şerit: profil türü + sınıf + insanlık skoru — TIKLANABİLİR (drill-down) */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={acik}
        aria-label={`${turTanim.ad} biyometri detayını ${acik ? "kapat" : "aç"}`}
        className="mb-3.5 flex w-full flex-wrap items-start justify-between gap-3 rounded-lg text-left transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="grid size-9 shrink-0 place-items-center rounded-xl ring-1 ring-inset"
            style={{ background: `${hex}14`, color: hex, borderColor: `${hex}33` }}
          >
            <TurIkon className="size-[18px]" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] font-semibold text-slate-ink">{turTanim.ad}</span>
              <Badge ton={sinifTanim.rozet}>
                <SinifIkon className="size-3" />
                {sinifTanim.ad}
              </Badge>
            </div>
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-muted">{turTanim.alt}</p>
          </div>
        </div>

        {/* İnsanlık skoru pili */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5">
              <Gauge className="size-3.5 text-slate-faint" />
              <span className="text-[15px] font-bold tabular-nums" style={{ color: hex }}>
                %{skorYuzde}
              </span>
            </div>
            <span className="text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">insanlık skoru</span>
          </div>
          <ChevronDown className={cn("size-4 shrink-0 text-slate-faint transition-transform", acik && "rotate-180")} />
        </div>
      </button>

      {/* Drill-down: katkı barları + en zayıf sinyal (tıklayınca açılır) */}
      <AnimatePresence initial={false}>
        {acik && (
          <motion.div
            initial={azHareket ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={azHareket ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: azHareket ? 0 : 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {/* Özellik katkı barları (açıklanabilirlik) */}
            <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              {sonuc.katkilar.map((k, i) => (
                <KatkiBar
                  key={k.ad}
                  ad={k.ad}
                  insanimsilik={k.insanimsilik}
                  band={k.band}
                  aciklama={k.aciklama}
                  azHareket={azHareket}
                  gecikme={0.1 + i * 0.04}
                />
              ))}
            </div>

            {/* En zayıf sinyal + gerekçe */}
            <div
              className={cn(
                "mt-3.5 flex items-start gap-2.5 rounded-xl border px-3 py-2.5",
                bot ? "border-red-200 bg-danger-soft/50" : "border-line bg-canvas/60",
              )}
            >
              <Waves className="mt-0.5 size-4 shrink-0" style={{ color: hex }} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-faint">
                  En çok ele veren sinyal
                  <span className="font-semibold normal-case text-slate-ink">{sonuc.zayifSinyal}</span>
                </div>
                <p className="mt-0.5 text-[11.5px] leading-snug text-slate-muted">{sonuc.gerekce}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {!acik && (
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-faint">
          <ChevronDown className="size-3" />
          Özellik katkıları ve en zayıf sinyal için tıklayın
        </p>
      )}
    </div>
  );
}

/* ================================================================== Ana bileşen */

export function DavranisBiyometriBolumu({
  kartlar,
  azHareket,
}: {
  kartlar: BiyometriKart[];
  azHareket: boolean;
}) {
  const [acikTur, setAcikTur] = useState<string | null>(null);
  if (kartlar.length === 0) return null;

  const insanSay = kartlar.filter((k) => k.sonuc.sinif === "insan").length;
  const botSay = kartlar.filter((k) => k.sonuc.sinif === "bot").length;
  const supheliSay = kartlar.filter((k) => k.sonuc.sinif === "şüpheli").length;

  return (
    <Bolum azHareket={azHareket}>
      <Panel
        baslik={<BaslikIkon ikon={Fingerprint} metin="Davranışsal Biyometri" />}
        sagUst={
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-slate-faint">{kartlar.length} profil analiz edildi</span>
            <Badge ton="brand">
              <Activity className="size-3" />
              Biyometri
            </Badge>
          </div>
        }
      >
        {/* Açıklama — kilit fikir */}
        <p className="-mt-1 mb-4 max-w-2xl text-[13px] leading-relaxed text-slate-muted">
          <span className="font-medium text-slate-ink">İnsan davranışı doğal bir imza taşır — bot taşıyamaz.</span>{" "}
          Veylify tuş-basma süreleri, aralık ritmi, fare ivmesi ve dokunuş basıncından istatistiksel özellikler
          çıkarır (varyasyon katsayısı, entropi, çarpıklık, jerk). Bot iki uçtan birine düşer:{" "}
          <span className="font-medium text-danger2">fazla düzenli</span> (script) ya da{" "}
          <span className="font-medium text-danger2">fazla rastgele</span> (enjekte gürültü) — ikisi de ele verir.
        </p>

        {/* Özet şeridi */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <OzetHap ikon={User} etiket="İnsan" deger={String(insanSay)} ton="ok" />
          <OzetHap ikon={HelpCircle} etiket="Şüpheli" deger={String(supheliSay)} ton={supheliSay > 0 ? "warn" : "ink"} />
          <OzetHap ikon={Bot} etiket="Bot" deger={String(botSay)} ton={botSay > 0 ? "danger" : "ink"} />
          <OzetHap ikon={Activity} etiket="Sinyal boyutu" deger={String(kartlar[0]?.sonuc.katkilar.length ?? 0)} ek="özellik" />
        </div>

        {/* Profil kartları */}
        <div className="mt-5 space-y-3">
          {kartlar.map((k, i) => (
            <Bolum key={k.tur} azHareket={azHareket} gecikme={azHareket ? 0 : 0.05 + i * 0.03}>
              <ProfilKart
                kart={k}
                azHareket={azHareket}
                acik={acikTur === k.tur}
                onToggle={() => setAcikTur(acikTur === k.tur ? null : k.tur)}
              />
            </Bolum>
          ))}
        </div>

        {/* Sınıf lejantı + kilit vurgu */}
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4 text-[11px] text-slate-faint">
          <span className="font-medium uppercase tracking-wide">Karar sınıfı:</span>
          {(["insan", "şüpheli", "bot"] as BiyometriSonuc["sinif"][]).map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5 text-slate-muted">
              <span className="size-2.5 rounded-full" style={{ background: SINIF_RENK[s] }} />
              {SINIF_TANIM[s].ad}
            </span>
          ))}
          <span className="ml-auto inline-flex items-center gap-1.5 font-medium text-brand-700">
            <Fingerprint className="size-3.5" />
            Ghost-font doğrulanmış olsa bile davranış ele verir
          </span>
        </div>
      </Panel>
    </Bolum>
  );
}
