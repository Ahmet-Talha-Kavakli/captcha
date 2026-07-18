"use client";

/**
 * Specter — İş Etkisi & ROI Bölümü (Business Impact)
 * ==================================================
 * Dashboard'a "Specter bize ne kazandırdı?" sorusunun PARASAL cevabını katar.
 * İki motordan beslenir, HİÇBİR sayı uydurma değildir:
 *   • `roiHesap` (roi.ts)          → önlenen maliyet + net kazanç + ROI çarpanı
 *     ve sınıf-başına maliyet kırılımı (kimlik doldurma, kazıma, DDoS…).
 *   • `botEkonomiHesap` (bot-ekonomi.ts) → saldırgan ekonomisi: Specter
 *     saldırganların beklenen kârını ne kadar sildi, kaç saldırı sınıfını
 *     kârsız hale getirdi (caydırıcılık), deneme maliyetini kaç kat artırdı.
 *
 * GÖRSEL ÇEŞİTLİLİK (her görsel farklı):
 *   1) Para kazanç hero-şeridi (büyük ₺) + ROI yarım-daire gauge.
 *   2) "Veylify olmasa" vs "Veylify ile" önce/sonra karşılaştırma kartı.
 *   3) Maliyet kırılımı — DonutDagilim (yatay-bar yerine halka).
 *   4) Bot ekonomisi — dikey caydırıcılık sütunları (kâr → 0) + kâr silme akış kartı.
 */

import { motion } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  Coins,
  ShieldOff,
  ShieldBan,
  Ban,
  Receipt,
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  PiggyBank,
  Scale,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Panel, Badge, NotKutusu } from "@/components/panel/kit";
import { DonutDagilim } from "@/components/panel/grafikler";
import { botSinifGorsel } from "@/components/panel/bot-sinif-gorsel";
import type { RoiSonuc } from "@/lib/specter/roi";
import type { BotEkonomiRaporu } from "@/lib/specter/bot-ekonomi";

/* ================================================================== Yardımcılar */

/** Tam sayı TL: "12.480 ₺". */
function tl(n: number): string {
  return `${Math.round(Number.isFinite(n) ? n : 0).toLocaleString("tr-TR")} ₺`;
}

/** Büyük sayı yerelleştir (tabular). */
function sayi(n: number): string {
  return (Number.isFinite(n) ? n : 0).toLocaleString("tr-TR");
}

/** Çarpan biçimi: 12.4 → "12,4×" (Infinity → "∞"). */
function carpan(n: number): string {
  if (!Number.isFinite(n)) return "∞";
  return `${n.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}×`;
}

/** Kısa TL (KPI vurgusu için binlik): 12.480 → "12,5B ₺", 1.240.000 → "1,2M ₺". */
function tlKisa(n: number): string {
  const v = Math.round(Number.isFinite(n) ? n : 0);
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}M ₺`;
  if (Math.abs(v) >= 10_000) return `${(v / 1_000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}B ₺`;
  return tl(v);
}

/** Bot sınıfı → ikon (görsel çıpa). */
function sinifIkon(botClass: string): React.ElementType {
  switch (botClass) {
    case "credential_stuffing":
      return ShieldBan;
    case "scraper":
      return Coins;
    case "ddos":
      return ShieldOff;
    case "ai_agent":
      return Sparkles;
    default:
      return Ban;
  }
}

/* ================================================================== Alt-bileşenler */

/** Bölümü rise ile saran motion sarmalayıcı. */
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

/* ================================================================== ROI yarım-daire gauge */

/**
 * ROI çarpanı yarım-daire gauge — histogram/donut'tan farklı görsel dil.
 * Referans olarak "1× = başabaş" işaretlenir; ibre çarpanı gösterir.
 * Ücretsiz planda ∞ (tam dolu yeşil yay).
 */
function RoiGauge({ carpanDeger, ucretsiz, azHareket }: { carpanDeger: number; ucretsiz: boolean; azHareket: boolean }) {
  // 0..10× aralığını 0..1'e ölçekle (10× ve üstü tam dolu). ∞ → tam dolu.
  const oran = ucretsiz ? 1 : !Number.isFinite(carpanDeger) ? 1 : Math.max(0, Math.min(1, carpanDeger / 10));
  const iyi = ucretsiz || carpanDeger >= 3;
  const orta = !iyi && carpanDeger >= 1;
  const renk = iyi ? "#16a34a" : orta ? "#2f6fed" : "#d97706";
  // Yarım-daire yay: 180° (sol→sağ üstten). r=52, merkez (60,60).
  const r = 52;
  const cx = 60;
  const cy = 60;
  // Yay uzunluğu (yarım çevre).
  const yariCevre = Math.PI * r;
  const dolu = oran * yariCevre;
  // Başabaş (1×) işareti açısı: 1/10 oranında.
  const basabasOran = 0.1;
  const basabasAci = Math.PI * (1 - basabasOran); // sol=π, sağ=0
  const bx = cx + r * Math.cos(basabasAci);
  const by = cy - r * Math.sin(basabasAci);

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-canvas/40 px-5 py-4">
      <div className="mb-1 flex items-center gap-1.5 self-start text-[11px] font-semibold uppercase tracking-wide text-slate-faint">
        <TrendingUp className="size-3.5" />
        ROI göstergesi
      </div>
      <svg viewBox="0 0 120 74" className="w-full max-w-[220px]" role="img" aria-label={`ROI çarpanı ${ucretsiz ? "sonsuz" : carpan(carpanDeger)}`}>
        {/* zemin yay */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth={9}
          strokeLinecap="round"
        />
        {/* dolu yay */}
        <motion.path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={renk}
          strokeWidth={9}
          strokeLinecap="round"
          strokeDasharray={yariCevre}
          initial={azHareket ? false : { strokeDashoffset: yariCevre }}
          animate={{ strokeDashoffset: yariCevre - dolu }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
        {/* başabaş (1×) referans tık */}
        <line
          x1={cx + (r - 7) * Math.cos(basabasAci)}
          y1={cy - (r - 7) * Math.sin(basabasAci)}
          x2={bx}
          y2={by}
          stroke="#9c9a90"
          strokeWidth={1.5}
        />
        <text x={bx - 1} y={by - 3} textAnchor="middle" className="fill-slate-400 text-[6px] font-medium">
          1× başabaş
        </text>
      </svg>
      <div className="-mt-3 flex flex-col items-center">
        <span className="text-[30px] font-bold leading-none num" style={{ color: renk }}>
          {ucretsiz ? "∞" : carpan(carpanDeger)}
        </span>
        <span className="mt-1 text-[11px] font-medium text-slate-muted">ödenen 1 ₺ başına değer</span>
      </div>
    </div>
  );
}

/* ================================================================== Önce/Sonra karşılaştırma */

/**
 * "Veylify olmasa" vs "Veylify ile" — iki büyük sütun + aradaki tasarruf oku.
 * Yatay-bar listelerinden görsel olarak tamamen farklı: karşıtlık kartı.
 */
function OnceSonra({
  onlenenMaliyet,
  netKazanc,
  specterMaliyet,
  ucretsiz,
  azHareket,
}: {
  onlenenMaliyet: number;
  netKazanc: number;
  specterMaliyet: number;
  ucretsiz: boolean;
  azHareket: boolean;
}) {
  const onlenenY = onlenenMaliyet; // Veylify olmasaydı bu maliyete maruz kalınırdı
  const kalanY = ucretsiz ? 0 : specterMaliyet; // Veylify ile: sadece ücret
  const maxY = Math.max(onlenenY, kalanY, 1);
  const onceH = Math.max(8, (onlenenY / maxY) * 100);
  const sonraH = Math.max(4, (kalanY / maxY) * 100);

  return (
    <div className="rounded-2xl border border-line bg-canvas/40 p-5">
      <div className="mb-4 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-faint">
        <Scale className="size-3.5" />
        Veylify olmasa vs Veylify ile
      </div>
      <div className="flex items-end gap-4">
        {/* ÖNCE — Veylify olmasa (kırmızı, dolu) */}
        <div className="flex flex-1 flex-col items-center">
          <div className="flex h-32 w-full items-end justify-center">
            <motion.div
              className="w-full max-w-[92px] rounded-t-xl bg-gradient-to-b from-red-400 to-danger2"
              initial={azHareket ? false : { height: 0 }}
              animate={{ height: `${onceH}%` }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <div className="mt-2.5 text-center">
            <div className="text-[19px] font-bold leading-none num text-danger2">{tlKisa(onlenenY)}</div>
            <div className="mt-1 text-[11px] font-medium text-slate-muted">Veylify olmasa</div>
            <div className="text-[10px] text-slate-faint">maruz kalınan maliyet</div>
          </div>
        </div>

        {/* Tasarruf oku */}
        <div className="mb-14 flex shrink-0 flex-col items-center gap-1">
          <span className="grid size-9 place-items-center rounded-full bg-ok-soft text-ok ring-1 ring-inset ring-green-200">
            <ArrowRight className="size-4" />
          </span>
          <span className="rounded-full bg-ok-soft px-2 py-0.5 text-[10px] font-bold text-ok">
            {tlKisa(netKazanc)} net
          </span>
        </div>

        {/* SONRA — Veylify ile (yeşil, ince) */}
        <div className="flex flex-1 flex-col items-center">
          <div className="flex h-32 w-full items-end justify-center">
            <motion.div
              className="w-full max-w-[92px] rounded-t-xl bg-gradient-to-b from-green-400 to-ok"
              initial={azHareket ? false : { height: 0 }}
              animate={{ height: `${sonraH}%` }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <div className="mt-2.5 text-center">
            <div className="text-[19px] font-bold leading-none num text-ok">{ucretsiz ? "0 ₺" : tlKisa(kalanY)}</div>
            <div className="mt-1 text-[11px] font-medium text-slate-muted">Veylify ile</div>
            <div className="text-[10px] text-slate-faint">{ucretsiz ? "ücretsiz plan" : "ödenen abonelik"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== Büyük para hero KPI */

function ParaKart({
  etiket,
  deger,
  altMetin,
  ikon: Ikon,
  ton = "notr",
  azHareket,
  gecikme = 0,
}: {
  etiket: string;
  deger: string;
  altMetin?: string;
  ikon: React.ElementType;
  ton?: "ok" | "brand" | "notr";
  azHareket: boolean;
  gecikme?: number;
}) {
  const zemin =
    ton === "ok"
      ? "border-green-200 bg-ok-soft"
      : ton === "brand"
        ? "border-brand-100 bg-brand-50"
        : "border-line bg-canvas/40";
  const ikonRenk = ton === "ok" ? "text-ok" : ton === "brand" ? "text-brand-600" : "text-slate-faint";
  const degerRenk = ton === "ok" ? "text-ok" : ton === "brand" ? "text-brand-700" : "text-slate-ink";
  return (
    <motion.div
      initial={azHareket ? false : { y: 10 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, delay: gecikme, ease: [0.16, 1, 0.3, 1] }}
      className={cn("rounded-2xl border px-5 py-4", zemin)}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-faint">
        <Ikon className={cn("size-3.5", ikonRenk)} />
        {etiket}
      </div>
      <div className={cn("mt-2 text-[34px] font-bold leading-none num", degerRenk)}>{deger}</div>
      {altMetin && <p className="mt-1.5 text-[12px] leading-relaxed text-slate-muted">{altMetin}</p>}
    </motion.div>
  );
}

/* ================================================================== 1) ROI Özeti */

function RoiBolum({ roi, azHareket }: { roi: RoiSonuc; azHareket: boolean }) {
  const kalemler = roi.kalemler ?? [];
  const pozitif = roi.netKazanc >= 0;

  // Maliyet kırılımı → donut segmentleri (sınıf renkleriyle).
  const segmentler = kalemler
    .filter((k) => k.onlenenMaliyet > 0)
    .map((k) => ({
      etiket: k.ad,
      deger: Math.round(k.onlenenMaliyet),
      renk: botSinifGorsel(k.botClass).renk,
    }));

  return (
    <Bolum azHareket={azHareket} gecikme={0}>
      <Panel
        baslik={<BaslikIkon ikon={Wallet} metin="İş Etkisi & ROI" />}
        sagUst={
          roi.ucretsizMi ? (
            <Badge ton="yesil">Ücretsiz plan · tam kâr</Badge>
          ) : pozitif ? (
            <Badge ton="yesil">
              <ArrowUpRight className="size-3" /> Pozitif getiri
            </Badge>
          ) : (
            <Badge ton="sari">Getiri eşiğin altında</Badge>
          )
        }
      >
        {/* Anlatı şeridi — büyük tasarruf cümlesi */}
        <div className="mb-5 rounded-2xl border border-green-200 bg-ok-soft/70 px-5 py-4">
          <p className="text-[14px] leading-relaxed text-slate-ink">
            Veylify şu ana dek <span className="text-[17px] font-bold text-ok">{tl(roi.toplamOnlenenMaliyet)}</span>{" "}
            tutarında zararı önledi ve <span className="font-bold text-ok">{sayi(roi.toplamEngellenen)}</span> olayı
            maliyete dönüşmeden durdurdu.{" "}
            {roi.ucretsizMi ? (
              <>Ücretsiz planda bu değerin <span className="font-bold text-ok">tamamı</span> net kazanç.</>
            ) : (
              <>Ödenen her 1 ₺ <span className="font-bold text-brand-700">{carpan(roi.roiCarpani)}</span> değere döndü.</>
            )}
          </p>
        </div>

        {/* Üst: 2 büyük para KPI + ROI gauge (3'lü, farklı görseller) */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <ParaKart
            etiket="Önlenen maliyet"
            deger={tlKisa(roi.toplamOnlenenMaliyet)}
            altMetin={`${sayi(roi.toplamEngellenen)} engellenen olayın parasal karşılığı`}
            ikon={ShieldOff}
            ton="ok"
            azHareket={azHareket}
            gecikme={0}
          />
          <ParaKart
            etiket="Net kazanç"
            deger={tlKisa(roi.netKazanc)}
            altMetin={
              roi.ucretsizMi
                ? "Önlenen maliyet − 0 ₺ ücret"
                : `Önlenen ${tl(roi.toplamOnlenenMaliyet)} − ${tl(roi.specterMaliyet)} ücret`
            }
            ikon={PiggyBank}
            ton={pozitif ? "ok" : "notr"}
            azHareket={azHareket}
            gecikme={0.06}
          />
          <RoiGauge carpanDeger={roi.roiCarpani} ucretsiz={roi.ucretsizMi} azHareket={azHareket} />
        </div>

        {/* Önce/Sonra karşılaştırma + donut kırılım (yan yana, iki farklı görsel) */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <OnceSonra
            onlenenMaliyet={roi.toplamOnlenenMaliyet}
            netKazanc={roi.netKazanc}
            specterMaliyet={roi.specterMaliyet}
            ucretsiz={roi.ucretsizMi}
            azHareket={azHareket}
          />

          <div className="rounded-2xl border border-line bg-canvas/40 p-5">
            <div className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-faint">
              <Receipt className="size-3.5" />
              Önlenen maliyet · sınıf kırılımı
            </div>
            {segmentler.length === 0 ? (
              <div className="grid h-40 place-items-center rounded-xl border border-dashed border-line text-[12px] text-slate-faint">
                Henüz maliyeti hesaplanacak engellenen olay yok.
              </div>
            ) : (
              <DonutDagilim segmentler={segmentler} />
            )}
          </div>
        </div>

        {/* Sınıf başına olay × birim özeti — kompakt satırlar (donut'u destekler) */}
        {kalemler.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {kalemler.map((k) => {
              const Ikon = sinifIkon(k.botClass);
              const g = botSinifGorsel(k.botClass);
              return (
                <div
                  key={k.botClass}
                  className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5 py-2.5"
                >
                  <span
                    className="grid size-8 shrink-0 place-items-center rounded-lg"
                    style={{ background: g.soft, color: g.renk }}
                  >
                    <Ikon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold text-slate-ink">{k.ad}</div>
                    <div className="text-[11px] tabular-nums text-slate-faint">
                      {sayi(k.engellenen)} olay × {tl(k.birim)}
                    </div>
                  </div>
                  <span className="shrink-0 text-[14px] font-bold tabular-nums text-ok">{tl(k.onlenenMaliyet)}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-5">
          <NotKutusu ton="bilgi">
            Birim maliyetler sektör-temsili tahminlerdir (kamuya açık bot-maliyet çalışmaları modeli) —
            kesin muhasebe değil, yönetici karar-destek metriğidir.
          </NotKutusu>
        </div>
      </Panel>
    </Bolum>
  );
}

/* ================================================================== Dikey caydırıcılık sütunu */

/** Bir saldırı sınıfının korumasız→Veylify kâr düşüşü, ikili dikey sütun olarak. */
function CaydirmaSutun({
  ad,
  botClass,
  hamKar,
  korumaKar,
  maxKar,
  azHareket,
  gecikme,
}: {
  ad: string;
  botClass: string;
  hamKar: number;
  korumaKar: number;
  maxKar: number;
  azHareket: boolean;
  gecikme: number;
}) {
  const g = botSinifGorsel(botClass);
  const hamH = Math.max(4, (Math.max(0, hamKar) / maxKar) * 100);
  const korumaH = Math.max(2, (Math.max(0, korumaKar) / maxKar) * 100);
  const caydirildi = korumaKar <= 0;
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-28 w-full items-end justify-center gap-1.5">
        {/* korumasız kâr (dolu, sınıf rengi) */}
        <div className="flex h-full w-5 items-end">
          <motion.div
            className="w-full rounded-t-md"
            style={{ background: g.renk }}
            initial={azHareket ? false : { height: 0 }}
            animate={{ height: `${hamH}%` }}
            transition={{ duration: 0.6, delay: gecikme, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
        {/* Veylify'la kâr (ince, yeşil/gri) */}
        <div className="flex h-full w-5 items-end">
          <motion.div
            className="w-full rounded-t-md"
            style={{ background: caydirildi ? "#16a34a" : "#d97706" }}
            initial={azHareket ? false : { height: 0 }}
            animate={{ height: `${korumaH}%` }}
            transition={{ duration: 0.6, delay: gecikme + 0.08, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>
      <span
        className="mt-2 grid size-7 place-items-center rounded-lg"
        style={{ background: g.soft, color: g.renk }}
      >
        <g.ikon className="size-3.5" />
      </span>
      <span className="mt-1 max-w-[72px] truncate text-center text-[10.5px] font-medium text-slate-muted" title={ad}>
        {ad}
      </span>
    </div>
  );
}

/* ================================================================== 2) Bot Ekonomisi & Caydırıcılık */

function EkonomiBolum({ ekonomi, azHareket }: { ekonomi: BotEkonomiRaporu; azHareket: boolean }) {
  const o = ekonomi.ozet;
  const siniflar = ekonomi.siniflar ?? [];
  const tamCaydirma = o.toplamSinif > 0 && o.caydirilanSinif === o.toplamSinif;
  const maxKar = Math.max(1, ...siniflar.map((s) => Math.max(s.hamKar, s.korumaKar)));

  return (
    <Bolum azHareket={azHareket} gecikme={0.05}>
      <Panel
        baslik={<BaslikIkon ikon={ShieldBan} metin="Bot Ekonomisi & Caydırıcılık" />}
        sagUst={
          o.toplamSinif > 0 ? (
            <Badge ton={tamCaydirma ? "yesil" : "brand"}>
              {o.caydirilanSinif}/{o.toplamSinif} saldırı türü kârsız
            </Badge>
          ) : null
        }
      >
        {siniflar.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-line py-12 text-center">
            <ShieldBan className="mb-2 size-7 text-slate-faint" />
            <p className="text-[13px] font-medium text-slate-muted">Ekonomisi ölçülecek saldırı görülmedi</p>
            <p className="mt-0.5 text-[12px] text-slate-faint">
              Bilinen saldırı sınıfı trafiği geldikçe caydırıcılık burada görünür.
            </p>
          </div>
        ) : (
          <>
            {/* Kâr silme akış kartı — büyük ham → koruma kâr geçişi */}
            <div className="rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5">
                <div className="text-center">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-faint">
                    Korumasız beklenen kâr
                  </div>
                  <div className="mt-1 text-[26px] font-bold leading-none num text-danger2">{tlKisa(o.hamToplamKar)}</div>
                </div>
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700">
                  <ArrowRight className="size-5" />
                </span>
                <div className="text-center">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-faint">
                    Veylify altında kâr
                  </div>
                  <div className="mt-1 text-[26px] font-bold leading-none num text-ok">{tlKisa(o.korumaToplamKar)}</div>
                </div>
                <div className="rounded-xl bg-surface px-3.5 py-2 text-center ring-1 ring-inset ring-brand-100">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-faint">Silinen kâr</div>
                  <div className="mt-0.5 text-[18px] font-bold leading-none num text-brand-700">{tlKisa(o.silinenKar)}</div>
                </div>
              </div>
              <p className="mt-3 text-center text-[12.5px] leading-relaxed text-slate-muted">
                <span className="font-semibold text-slate-ink">{o.caydirilanSinif}</span> saldırı türü kârsız hale geldi
                · başarı başına maliyet ortalama <span className="font-semibold text-brand-700">{carpan(o.ortMaliyetArtis)}</span> arttı.
              </p>
            </div>

            {/* Dikey caydırıcılık sütunları — sınıf başına ham vs koruma kâr */}
            <div className="mt-5 rounded-2xl border border-line bg-canvas/40 p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-faint">
                  <TrendingUp className="size-3.5" />
                  Sınıf bazında kâr düşüşü (korumasız → Veylify)
                </div>
                <div className="flex items-center gap-x-3 gap-y-1 text-[10.5px] text-slate-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2.5 rounded-sm bg-slate-400" /> Korumasız kâr
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2.5 rounded-sm bg-ok" /> Veylify'la kâr
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-x-2 gap-y-4 sm:grid-cols-4 md:grid-cols-6">
                {siniflar.map((s, i) => (
                  <CaydirmaSutun
                    key={s.eko.botClass}
                    ad={s.eko.ad}
                    botClass={s.eko.botClass}
                    hamKar={s.hamKar}
                    korumaKar={s.korumaKar}
                    maxKar={maxKar}
                    azHareket={azHareket}
                    gecikme={azHareket ? 0 : i * 0.05}
                  />
                ))}
              </div>
            </div>

            {/* Sınıf-başına detay kartları */}
            <div className="mt-4 space-y-2.5">
              {siniflar.map((s) => {
                const g = botSinifGorsel(s.eko.botClass);
                return (
                  <div
                    key={s.eko.botClass}
                    className="rounded-xl border border-line bg-surface px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="grid size-7 shrink-0 place-items-center rounded-lg"
                          style={{ background: g.soft, color: g.renk }}
                        >
                          <g.ikon className="size-4" />
                        </span>
                        <span className="truncate text-[13px] font-semibold text-slate-ink">{s.eko.ad}</span>
                        <span className="hidden shrink-0 text-[11px] text-slate-faint sm:inline">{s.eko.amac}</span>
                      </div>
                      {s.caydirildi ? (
                        <Badge ton="yesil">Caydırıldı</Badge>
                      ) : (
                        <Badge ton="sari">Kısmen kârlı</Badge>
                      )}
                    </div>
                    <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px] sm:grid-cols-4">
                      <div>
                        <div className="text-[10px] font-medium uppercase tracking-wide text-slate-faint">İstek</div>
                        <div className="tabular-nums font-semibold text-slate-ink">{sayi(s.istekSayisi)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-medium uppercase tracking-wide text-slate-faint">
                          Korumasız kâr
                        </div>
                        <div className="tabular-nums font-semibold text-slate-ink">{tl(s.hamKar)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-medium uppercase tracking-wide text-slate-faint">
                          Veylify'la kâr
                        </div>
                        <div className={cn("tabular-nums font-semibold", s.korumaKar <= 0 ? "text-ok" : "text-warn")}>
                          {tl(s.korumaKar)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-medium uppercase tracking-wide text-slate-faint">
                          Maliyet artışı
                        </div>
                        <div className="tabular-nums font-semibold text-brand-700">{carpan(s.maliyetArtisCarpani)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5">
              <NotKutusu ton={tamCaydirma ? "yesil" : "bilgi"}>
                {tamCaydirma
                  ? "Gözlemlenen tüm saldırı türleri Veylify altında kârsız — saldırganın devam etmesi için ekonomik gerekçe kalmadı."
                  : "Bir saldırı ancak beklenen getirisi maliyetini aşarsa sürer. Veylify deneme maliyetini yükselterek bu dengeyi saldırgan aleyhine çevirir."}
              </NotKutusu>
            </div>
          </>
        )}
      </Panel>
    </Bolum>
  );
}

/* ================================================================== Ana bileşen */

export function IsEtkisiBolumu({
  roi,
  ekonomi,
  azHareket,
}: {
  roi: RoiSonuc;
  ekonomi: BotEkonomiRaporu;
  azHareket: boolean;
}) {
  return (
    <div className="space-y-6">
      <RoiBolum roi={roi} azHareket={azHareket} />
      <EkonomiBolum ekonomi={ekonomi} azHareket={azHareket} />
    </div>
  );
}
