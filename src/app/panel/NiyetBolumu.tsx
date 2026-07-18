"use client";

/**
 * Specter — Saldırgan Niyet Analizi (Attacker Intent Classification)
 * =================================================================
 * Bir botu engellemek yetmez: NEDEN geldiğini bilmek savunmayı hedefler. Bu bölüm,
 * niyet-sınıflandırma motorunun (niyetSiniflandir / saldirganNiyetleri / niyetOzet)
 * Bayes-benzeri çıkarımını gösterir — gözlemlenen davranıştan (hedef yollar,
 * botClass, hacim, UA imzası, skor dağılımı) trafiğin ARDINDAKI motivasyonu:
 *
 *   • finansal — hesap ele geçirme, ödeme/kart kötüye kullanımı.
 *   • veri     — içerik/fiyat kazıma, AI eğitim toplama.
 *   • yikim    — DDoS, kaynak tüketimi, kesinti.
 *   • kesif    — zafiyet tarama, endpoint numaralandırma.
 *   • kotuye   — spam, sahte kayıt, içerik enjeksiyonu.
 *
 * HİÇBİR sayı uydurma değildir — hepsi `niyet-siniflandirma` motorundan
 * (softmax dağılım + güven + kanıtlar + gerekçe) türetilir. page.tsx SERVER'da
 * hesaplar (genel + saldırgan başına + özet), buraya hazır prop gelir.
 *
 * Tasarım: KorelasyonBolumu / IliskiGrafigiBolumu ile birebir aynı dil — Panel +
 * krem kartlar (bg-canvas/40), tabular-nums, rounded kartlar; framer-motion rise
 * (azHareket → sade). whileInView / viewport / opacity-fade YOK.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Target,
  Banknote,
  Database,
  Bomb,
  Radar,
  ShieldAlert,
  Gauge,
  Boxes,
  Fingerprint,
  Sparkles,
  Users,
  Lightbulb,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Panel, Badge, Ulke } from "@/components/panel/kit";
import { DonutDagilim } from "@/components/panel/grafikler";
import type {
  Motivasyon,
  NiyetSonuc,
  SaldirganNiyet,
  NiyetOzet,
} from "@/lib/specter/niyet-siniflandirma";

/* ================================================================== Sabitler */

/** Motivasyon → TR ad + kısa açıklama + ikon + renk paleti. */
const NIYET_TANIM: Record<
  Motivasyon,
  { ad: string; kisa: string; ikon: LucideIcon; hex: string }
> = {
  finansal: { ad: "Finansal",          kisa: "Hesap ele geçirme, ödeme/kart kötüye kullanımı", ikon: Banknote,    hex: "#dc2626" },
  veri:     { ad: "Veri Hırsızlığı",   kisa: "İçerik/fiyat kazıma, AI eğitim toplama",          ikon: Database,    hex: "#2563eb" },
  yikim:    { ad: "Yıkım / Kesinti",   kisa: "DDoS, kaynak tüketimi, hizmet kesintisi",         ikon: Bomb,        hex: "#ea580c" },
  kesif:    { ad: "Keşif",             kisa: "Zafiyet tarama, endpoint numaralandırma",         ikon: Radar,       hex: "#d97706" },
  kotuye:   { ad: "Kötüye Kullanım",   kisa: "Spam, sahte kayıt, içerik enjeksiyonu",           ikon: ShieldAlert, hex: "#7c3aed" },
};

/** Motivasyon sabit sıralaması (dağılım barları / lejant için istikrarlı düzen). */
const NIYET_SIRA: Motivasyon[] = ["finansal", "veri", "yikim", "kesif", "kotuye"];

/* ================================================================== Yardımcılar */

function sayi(n: number): string {
  return (Number.isFinite(n) ? n : 0).toLocaleString("tr-TR");
}

function yuzde(oran01: number): number {
  return Math.round((Number.isFinite(oran01) ? oran01 : 0) * 100);
}

/** Bölümü rise ile saran motion sarmalayıcı (KorelasyonBolumu ile aynı). */
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
function BaslikIkon({ ikon: Ikon, metin }: { ikon: LucideIcon; metin: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Ikon className="size-4 text-slate-faint" />
      {metin}
    </span>
  );
}

/** Motivasyon rozeti — ikonlu, motivasyona özgü renkli hap (inline hex). */
function NiyetRozet({ niyet, boyut = "md" }: { niyet: Motivasyon; boyut?: "sm" | "md" }) {
  const t = NIYET_TANIM[niyet];
  const Ikon = t.ikon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset",
        boyut === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-[12px]",
      )}
      style={{ background: `${t.hex}14`, color: t.hex, borderColor: `${t.hex}33` }}
    >
      <Ikon className="size-3.5" />
      {t.ad}
    </span>
  );
}

/* ================================================================== Niyet radarı */

/**
 * Softmax dağılımını 5-eksenli bir RADAR (örümcek ağı) olarak çizer — her
 * motivasyon bir eksen, olasılık merkeze uzaklık. Baskın motivasyonun rengiyle
 * doldurulmuş çokgen; monoton yatay-bar listesinin yerini alır. Deterministik
 * SVG (grafik kütüphanesi yok); azHareket'te statik.
 */
function NiyetRadar({
  dagilim,
  enOlasi,
  azHareket,
  boyut = 214,
}: {
  dagilim: { motivasyon: Motivasyon; olasilik: number }[];
  enOlasi: Motivasyon;
  azHareket: boolean;
  boyut?: number;
}) {
  const harita = new Map(dagilim.map((d) => [d.motivasyon, d.olasilik]));
  const eksenler = NIYET_SIRA.map((m) => ({ motivasyon: m, olasilik: harita.get(m) ?? 0 }));
  const enBuyuk = Math.max(0.0001, ...eksenler.map((e) => e.olasilik));
  const t = NIYET_TANIM[enOlasi];

  const S = 100; // viewBox
  const cx = S / 2;
  const cy = S / 2;
  const R = 38; // dış yarıçap
  const n = eksenler.length;
  // Her eksen açısı — tepeden başlayıp saat yönünde.
  const aci = (i: number) => (i / n) * Math.PI * 2 - Math.PI / 2;
  // Olasılık merkeze göre normalize (en büyük değer dış kenara ~oturur).
  const nokta = (i: number, oran01: number) => {
    const r = R * (0.12 + 0.88 * (oran01 / enBuyuk));
    return [cx + Math.cos(aci(i)) * r, cy + Math.sin(aci(i)) * r] as const;
  };
  const cokgen = eksenler
    .map((e, i) => nokta(i, e.olasilik))
    .map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`)
    .join(" ");

  // Grid halkaları (0.25/0.5/0.75/1.0).
  const halkalar = [0.25, 0.5, 0.75, 1].map((f) =>
    eksenler
      .map((_, i) => {
        const r = R * f;
        return `${(cx + Math.cos(aci(i)) * r).toFixed(2)},${(cy + Math.sin(aci(i)) * r).toFixed(2)}`;
      })
      .join(" "),
  );

  return (
    <div className="relative mx-auto" style={{ width: boyut, height: boyut }}>
      <svg viewBox={`0 0 ${S} ${S}`} className="size-full" role="img" aria-label="Motivasyon olasılık radarı">
        {/* Grid halkaları */}
        {halkalar.map((pts, i) => (
          <polygon key={i} points={pts} fill="none" stroke="#e7e4dc" strokeWidth={0.4} />
        ))}
        {/* Eksen çizgileri */}
        {eksenler.map((_, i) => {
          const p = [cx + Math.cos(aci(i)) * R, cy + Math.sin(aci(i)) * R];
          return <line key={i} x1={cx} y1={cy} x2={p[0]} y2={p[1]} stroke="#e7e4dc" strokeWidth={0.4} />;
        })}
        {/* Dolu çokgen (baskın niyet rengi) */}
        <motion.polygon
          points={cokgen}
          fill={`${t.hex}22`}
          stroke={t.hex}
          strokeWidth={1.3}
          strokeLinejoin="round"
          initial={azHareket ? false : { scale: 0.6, opacity: 0 }}
          animate={azHareket ? undefined : { scale: 1, opacity: 1 }}
          style={{ transformOrigin: "center" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
        {/* Köşe düğümleri */}
        {eksenler.map((e, i) => {
          const p = nokta(i, e.olasilik);
          const et = NIYET_TANIM[e.motivasyon];
          const baskin = e.motivasyon === enOlasi;
          return (
            <motion.circle
              key={e.motivasyon}
              cx={p[0]}
              cy={p[1]}
              r={baskin ? 2.4 : 1.7}
              fill={et.hex}
              stroke="#faf9f4"
              strokeWidth={0.8}
              initial={azHareket ? false : { scale: 0 }}
              animate={azHareket ? undefined : { scale: 1 }}
              transition={{ duration: 0.35, delay: azHareket ? 0 : 0.25 + i * 0.05 }}
            />
          );
        })}
      </svg>
      {/* Eksen etiketleri (HTML overlay — konumları radar köşelerine göre) */}
      {eksenler.map((e, i) => {
        const et = NIYET_TANIM[e.motivasyon];
        const p = [cx + Math.cos(aci(i)) * (R + 11), cy + Math.sin(aci(i)) * (R + 11)];
        const baskin = e.motivasyon === enOlasi;
        return (
          <span
            key={e.motivasyon}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[9.5px] font-medium",
              baskin ? "font-bold" : "text-slate-faint",
            )}
            style={{ left: `${p[0]}%`, top: `${p[1]}%`, color: baskin ? et.hex : undefined }}
          >
            {et.ad}
          </span>
        );
      })}
    </div>
  );
}

/* ================================================================== Genel niyet kartı */

/**
 * Baskın motivasyonun büyük gösterimi: ikon + ad + %güven + gerekçe metni + tüm
 * motivasyonların softmax dağılım barları. Bölümün "kalbi".
 */
function GenelNiyetKart({ genel, azHareket }: { genel: NiyetSonuc; azHareket: boolean }) {
  const t = NIYET_TANIM[genel.niyet];
  const Ikon = t.ikon;

  return (
    <div
      className="rounded-2xl border p-5"
      style={{ borderColor: `${t.hex}33`, background: `${t.hex}0a` }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* Sol: baskın niyet kimliği */}
        <div className="flex min-w-0 items-center gap-3.5">
          <span
            className="grid size-12 shrink-0 place-items-center rounded-2xl ring-1 ring-inset"
            style={{ background: `${t.hex}16`, color: t.hex, borderColor: `${t.hex}33` }}
          >
            <Ikon className="size-6" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-faint">
              <Target className="size-3.5" />
              Baskın motivasyon
            </div>
            <div className="mt-0.5 text-[19px] font-bold leading-tight" style={{ color: t.hex }}>
              {t.ad}
            </div>
            <p className="mt-0.5 text-[12px] text-slate-muted">{t.kisa}</p>
          </div>
        </div>

        {/* Sağ: güven pili */}
        <div className="flex shrink-0 flex-col items-end">
          <div className="flex items-center gap-1.5">
            <Gauge className="size-4 text-slate-faint" />
            <span className="text-[24px] font-bold leading-none tabular-nums" style={{ color: t.hex }}>
              %{genel.guven}
            </span>
          </div>
          <span className="mt-1 text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">
            model güveni
          </span>
        </div>
      </div>

      {/* Gerekçe (motorun insan-okur açıklaması) */}
      <div className="mt-4 flex items-start gap-2 rounded-xl border border-line bg-surface/70 px-3.5 py-2.5">
        <Lightbulb className="mt-0.5 size-4 shrink-0 text-slate-faint" />
        <p className="text-[12.5px] leading-relaxed text-slate-muted">{genel.gerekce}</p>
      </div>

      {/* Softmax dağılımı — DONUT + RADAR ikilisi (monoton bar yerine) */}
      <div className="mt-5">
        <div className="mb-3 flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">
          <Sparkles className="size-3.5" />
          Motivasyon olasılık dağılımı — Bayes-benzeri çıkarım
        </div>
        <div className="grid items-center gap-5 rounded-2xl border border-line bg-surface/60 p-4 lg:grid-cols-[1.1fr_auto]">
          {/* Sol: donut + lejant (grafikler.tsx DonutDagilim) */}
          <DonutDagilim
            segmentler={NIYET_SIRA.map((m) => {
              const d = genel.dagilim.find((x) => x.motivasyon === m);
              return {
                etiket: NIYET_TANIM[m].ad,
                deger: Math.round((d?.olasilik ?? 0) * 1000),
                renk: NIYET_TANIM[m].hex,
              };
            })}
          />
          {/* Sağ: 5-eksenli radar */}
          <div className="mx-auto shrink-0">
            <NiyetRadar dagilim={genel.dagilim} enOlasi={genel.niyet} azHareket={azHareket} />
            <p className="mt-1 text-center text-[10px] font-medium uppercase tracking-wide text-slate-faint">
              olasılık radarı
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== Özet dağılım şeridi */

/**
 * Saldırgan başına baskın niyetin toplu dağılımı: kaç saldırgan hangi
 * motivasyonda, oranıyla. "Trafiğin çoğu ne peşinde?" sorusunu yanıtlar.
 */
function OzetDagilim({ ozet, azHareket }: { ozet: NiyetOzet; azHareket: boolean }) {
  const varOlan = ozet.dagilim.filter((d) => d.sayi > 0);
  if (varOlan.length === 0 || ozet.toplamSaldirgan === 0) return null;

  return (
    <div className="mt-5">
      <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-faint">
        <Users className="size-3.5" />
        Saldırgan başına niyet dağılımı ({sayi(ozet.toplamSaldirgan)} saldırgan)
      </div>

      {/* Yığılmış oran çubuğu */}
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-canvas">
        {varOlan.map((d, i) => {
          const t = NIYET_TANIM[d.motivasyon];
          return (
            <motion.div
              key={d.motivasyon}
              className="h-full first:rounded-l-full last:rounded-r-full"
              style={{ background: t.hex }}
              initial={azHareket ? false : { width: 0 }}
              animate={azHareket ? undefined : { width: `${d.oran}%` }}
              transition={{ duration: 0.6, delay: azHareket ? 0 : 0.05 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            />
          );
        })}
      </div>

      {/* Kartlar */}
      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {NIYET_SIRA.map((m) => {
          const d = ozet.dagilim.find((x) => x.motivasyon === m);
          const sayiDeger = d?.sayi ?? 0;
          const oran = d?.oran ?? 0;
          const t = NIYET_TANIM[m];
          const Ikon = t.ikon;
          const baskin = ozet.baskinNiyet === m && sayiDeger > 0;
          return (
            <div
              key={m}
              className={cn(
                "rounded-xl border bg-canvas/40 px-3 py-2.5",
                baskin ? "border-line-strong" : "border-line",
              )}
              style={baskin ? { boxShadow: `inset 0 0 0 1px ${t.hex}33` } : undefined}
            >
              <div className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">
                <Ikon className="size-3" style={{ color: t.hex }} />
                <span className="truncate">{t.ad}</span>
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-[19px] font-bold leading-none tabular-nums text-slate-ink">
                  {sayi(sayiDeger)}
                </span>
                <span className="text-[11px] tabular-nums text-slate-faint">%{oran}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================== Saldırgan satırı */

/**
 * Tek saldırgan (IP) için niyet kartı: IP + ülke + olay sayısı + niyet rozeti +
 * %güven + en güçlü kanıtın detayı. "Bu IP ne peşinde?" — tek bakışta.
 */
function SaldirganKart({
  s,
  azHareket,
  acik,
  onToggle,
}: {
  s: SaldirganNiyet;
  azHareket: boolean;
  acik: boolean;
  onToggle: () => void;
}) {
  const niyet = s.sonuc.niyet;
  const t = NIYET_TANIM[niyet];
  const pct = yuzde(s.sonuc.dagilim[0]?.olasilik ?? 0);
  // Kanıtları baskın niyete etkisine göre sırala (en güçlüsü en üstte).
  const siraliKanitlar = [...s.sonuc.kanitlar].sort(
    (a, b) => (b.etkiler[niyet] ?? 0) - (a.etkiler[niyet] ?? 0),
  );
  const enGuclu = siraliKanitlar[0];

  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-canvas/40 p-3.5 transition",
        acik && "ring-1 ring-inset ring-slate-300",
      )}
    >
      {/* Üst şerit: kimlik + niyet + güven — TIKLANABİLİR (drill-down aç/kapa) */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={acik}
        aria-label={`${s.anahtar} niyet detayını ${acik ? "kapat" : "aç"}`}
        className="flex w-full flex-wrap items-center justify-between gap-3 rounded-lg text-left transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          {/* Niyet ikon rozeti */}
          <span
            className="grid size-8 shrink-0 place-items-center rounded-lg ring-1 ring-inset"
            style={{ background: `${t.hex}14`, color: t.hex, borderColor: `${t.hex}33` }}
          >
            <t.ikon className="size-4" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate font-mono text-[12.5px] font-medium text-slate-ink">
                {s.anahtar}
              </span>
              <Ulke kod={s.country} />
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-faint">
              <Boxes className="size-3" />
              <span className="tabular-nums">{sayi(s.olaySayisi)} olay</span>
            </div>
          </div>
        </div>

        {/* Niyet rozeti + güven */}
        <div className="flex shrink-0 items-center gap-2.5">
          <NiyetRozet niyet={niyet} boyut="sm" />
          <div className="flex flex-col items-end leading-none">
            <span className="text-[14px] font-bold tabular-nums" style={{ color: t.hex }}>
              %{s.sonuc.guven}
            </span>
            <span className="mt-0.5 text-[9.5px] font-medium uppercase tracking-wide text-slate-faint">
              güven
            </span>
          </div>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-slate-faint transition-transform",
              acik && "rotate-180",
            )}
          />
        </div>
      </button>

      {/* Mini güven barı (en olası niyet olasılığı) */}
      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-canvas">
        <motion.div
          className="h-full rounded-full"
          style={{ background: t.hex }}
          initial={azHareket ? false : { width: 0 }}
          animate={azHareket ? undefined : { width: `${pct}%` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {/* En güçlü kanıt / gerekçe (özet — hep görünür) */}
      {enGuclu ? (
        <p className="mt-2 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-slate-muted">
          <Fingerprint className="mt-0.5 size-3 shrink-0 text-slate-faint" />
          <span>
            <span className="font-medium text-slate-ink">{enGuclu.ad}:</span> {enGuclu.detay}
          </span>
        </p>
      ) : (
        <p className="mt-2 text-[11.5px] leading-relaxed text-slate-faint">
          Ayırt edici kanıt zayıf — niyet önsel dağılıma yakın.
        </p>
      )}

      {/* Drill-down detay: tam kanıt dökümü + softmax dağılımı (tıklayınca açılır) */}
      <AnimatePresence initial={false}>
        {acik && (
          <motion.div
            initial={azHareket ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={azHareket ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: azHareket ? 0 : 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mt-3.5 grid gap-4 border-t border-line pt-3.5 lg:grid-cols-12">
              {/* Sol: tüm kanıtlar — motorun her göstergesi + baskın niyete etkisi */}
              <div className="lg:col-span-7">
                <div className="mb-2 flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">
                  <Fingerprint className="size-3" />
                  Tüm kanıtlar — {sayi(siraliKanitlar.length)} gösterge
                </div>
                {siraliKanitlar.length > 0 ? (
                  <ul className="space-y-1.5">
                    {siraliKanitlar.map((k, i) => {
                      const etki = k.etkiler[niyet] ?? 0;
                      return (
                        <li
                          key={`${k.ad}-${i}`}
                          className="rounded-lg border border-line bg-surface/70 px-2.5 py-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-[11.5px] font-semibold text-slate-ink">
                              {k.ad}
                            </span>
                            {etki > 0 && (
                              <span
                                className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums"
                                style={{ background: `${t.hex}14`, color: t.hex }}
                              >
                                +{yuzde(etki)}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-muted">
                            {k.detay}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-[11.5px] text-slate-faint">
                    Ayırt edici kanıt yok — niyet önsel dağılıma yakın.
                  </p>
                )}
              </div>

              {/* Sağ: bu saldırgana özel softmax dağılımı (tüm motivasyonlar) */}
              <div className="lg:col-span-5">
                <div className="mb-2 flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">
                  <Sparkles className="size-3" />
                  Motivasyon olasılık dağılımı
                </div>
                <div className="space-y-1.5">
                  {NIYET_SIRA.map((m) => {
                    const d = s.sonuc.dagilim.find((x) => x.motivasyon === m);
                    const oran = yuzde(d?.olasilik ?? 0);
                    const mt = NIYET_TANIM[m];
                    const baskin = m === niyet;
                    return (
                      <div key={m} className="flex items-center gap-2">
                        <span
                          className={cn(
                            "w-[92px] shrink-0 truncate text-[11px]",
                            baskin ? "font-semibold text-slate-ink" : "text-slate-muted",
                          )}
                        >
                          {mt.ad}
                        </span>
                        <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-canvas">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: mt.hex }}
                            initial={azHareket ? false : { width: 0 }}
                            animate={azHareket ? undefined : { width: `${oran}%` }}
                            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                          />
                        </div>
                        <span className="w-8 shrink-0 text-right text-[11px] tabular-nums text-slate-faint">
                          %{oran}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kapalıyken ipucu */}
      {!acik && (
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-faint">
          <ChevronDown className="size-3" />
          Detay için tıklayın
        </p>
      )}
    </div>
  );
}

/* ================================================================== Ana bileşen */

export function NiyetBolumu({
  genel,
  saldirganlar,
  ozet,
  azHareket,
}: {
  genel: NiyetSonuc;
  saldirganlar: SaldirganNiyet[];
  ozet: NiyetOzet;
  azHareket: boolean;
}) {
  const [acikId, setAcikId] = useState<string | null>(null);
  const gosterilecek = saldirganlar.slice(0, 8);
  const baskinTanim = ozet.baskinNiyet ? NIYET_TANIM[ozet.baskinNiyet] : null;
  // Üst KPI şeridi verileri (hepsi motordan türetilir).
  const finansalSayi = ozet.dagilim.find((d) => d.motivasyon === "finansal")?.sayi ?? 0;

  return (
    <Bolum azHareket={azHareket}>
      <Panel
        baslik={<BaslikIkon ikon={Brain} metin="Saldırgan Niyet Analizi" />}
        sagUst={
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-slate-faint">
              {sayi(genel.toplamOlay)} olay çözümlendi
            </span>
            <Badge ton="brand">
              <Sparkles className="size-3" />
              Bayes
            </Badge>
          </div>
        }
      >
        {/* Açıklama */}
        <p className="-mt-1 mb-4 max-w-2xl text-[13px] leading-relaxed text-slate-muted">
          Bir botu engellemek yetmez — Veylify, trafiğin <span className="font-medium text-slate-ink">ardındaki
          motivasyonu</span> Bayes-benzeri kanıt birikimiyle sınıflandırır: hedef yollar,
          bot sınıfı, hacim ve imzalardan saldırganın ne peşinde olduğunu çıkarır.
          {baskinTanim && (
            <>
              {" "}Saldırganların çoğu şu an{" "}
              <span className="font-medium text-slate-ink">{baskinTanim.ad.toLowerCase()}</span>{" "}
              odaklı.
            </>
          )}
        </p>

        {/* Üst KPI şeridi — büyük ana sayılar (guven-merkezi ferahlığı) */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-line bg-canvas/40 px-4 py-3.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-faint">
              <Sparkles className="size-3.5" />
              Baskın niyet
            </div>
            <div className="mt-1.5 text-[18px] font-bold leading-none" style={{ color: baskinTanim?.hex ?? "#334155" }}>
              {baskinTanim?.ad ?? "—"}
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-canvas/40 px-4 py-3.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-faint">
              <Gauge className="size-3.5" />
              Model güveni
            </div>
            <div className="mt-1.5 text-[26px] font-bold leading-none tabular-nums text-slate-ink">
              %{genel.guven}
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-canvas/40 px-4 py-3.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-faint">
              <Users className="size-3.5" />
              Sınıflanan
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-[26px] font-bold leading-none tabular-nums text-slate-ink">
                {sayi(ozet.toplamSaldirgan)}
              </span>
              <span className="text-[11px] text-slate-faint">saldırgan</span>
            </div>
          </div>
          <div
            className="rounded-2xl border px-4 py-3.5"
            style={{ borderColor: finansalSayi > 0 ? "#dc262633" : undefined, background: finansalSayi > 0 ? "#dc26260a" : undefined }}
          >
            <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-faint">
              <Banknote className="size-3.5" />
              Finansal hedef
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span
                className="text-[26px] font-bold leading-none tabular-nums"
                style={{ color: finansalSayi > 0 ? "#dc2626" : "#334155" }}
              >
                {sayi(finansalSayi)}
              </span>
              <span className="text-[11px] text-slate-faint">IP</span>
            </div>
          </div>
        </div>

        {/* 1) Genel niyet — büyük gösterim */}
        <GenelNiyetKart genel={genel} azHareket={azHareket} />

        {/* 2) Saldırgan başına niyet dağılımı özeti */}
        <OzetDagilim ozet={ozet} azHareket={azHareket} />

        {/* 3) Saldırgan başına niyet listesi */}
        <div className="mt-5">
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-faint">
              <Fingerprint className="size-3.5" />
              Saldırgan başına niyet
            </div>
            {saldirganlar.length > gosterilecek.length && (
              <span className="text-[11px] text-slate-faint">
                ilk {gosterilecek.length} / {sayi(saldirganlar.length)}
              </span>
            )}
          </div>

          {gosterilecek.length === 0 ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-line py-10 text-center">
              <Brain className="mb-2 size-7 text-slate-faint" />
              <p className="text-[13px] font-medium text-slate-muted">Sınıflandırılacak saldırgan yok</p>
              <p className="mt-0.5 text-[12px] text-slate-faint">
                Yeterli olay üreten kötü niyetli kaynaklar tespit edildiğinde niyetleri burada belirir.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {gosterilecek.map((s, i) => (
                <Bolum key={s.anahtar} azHareket={azHareket} gecikme={azHareket ? 0 : 0.05 + i * 0.03}>
                  <SaldirganKart
                    s={s}
                    azHareket={azHareket}
                    acik={acikId === s.anahtar}
                    onToggle={() => setAcikId(acikId === s.anahtar ? null : s.anahtar)}
                  />
                </Bolum>
              ))}
            </div>
          )}
        </div>

        {/* Motivasyon lejantı */}
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4 text-[11px] text-slate-faint">
          <span className="font-medium uppercase tracking-wide">Motivasyon:</span>
          {NIYET_SIRA.map((m) => {
            const t = NIYET_TANIM[m];
            return (
              <span key={m} className="inline-flex items-center gap-1.5 text-slate-muted">
                <span className="size-2.5 rounded-full" style={{ background: t.hex }} />
                {t.ad}
              </span>
            );
          })}
          <span className="ml-auto inline-flex items-center gap-1.5 font-medium text-slate-muted">
            <Gauge className="size-3.5" />
            Güven = en olası ile ikinci arası ayrışma
          </span>
        </div>
      </Panel>
    </Bolum>
  );
}
