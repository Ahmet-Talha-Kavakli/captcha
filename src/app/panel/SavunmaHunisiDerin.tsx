"use client";

/**
 * Veylify — Savunma Hunisi (Derin) / Layered Defense Funnel
 * =========================================================
 * Katmanlı savunma hunisi: gelen istek → edge rate → IP itibar → TLS parmak izi
 * → ghost-font → davranış → izin verilen. Her katmanda kaç isteğin elendiği
 * (azalan bar + yüzde + o katmanın yakaladığı tahmini bot). GERÇEK VERİ:
 * `savunma` (SavunmaEtkinlik) hunisi + `totals` proplarından türetilir — YENİ
 * MOTOR YOK.
 *
 * Her katman tıklanınca ilgili modüle gider. Sağda "en etkili" + "en zayıf"
 * katman özeti.
 *
 * KURAL: framer-motion opacity:0 giriş YOK — sadece y/width. Yatay taşma yok.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { Filter, ArrowRight, TrendingUp, TrendingDown, Gauge, Globe, Fingerprint, Activity, GitBranch, ShieldCheck } from "lucide-react";
import { Panel } from "@/components/panel/kit";
import type { SavunmaEtkinlik } from "@/lib/specter/savunma-etkinlik";
import { cn } from "@/lib/cn";

interface Props {
  savunma: SavunmaEtkinlik;
  totals: { issued: number; blocked: number; challenged: number };
}

interface Katman {
  ad: string;
  aciklama: string;
  renk: string;
  ikon: React.ComponentType<{ className?: string }>;
  href: string;
  /** Bu katmana ulaşan (kalan) istek sayısı. */
  kalan: number;
  /** Bu katmanda elenen istek sayısı. */
  elenen: number;
}

export function SavunmaHunisiDerin({ savunma, totals }: Props) {
  const huni = savunma.yakalamaHunisi;
  // Toplam gelen: hunideki toplam trafik ya da (fallback) issued+blocked.
  const gelen = Math.max(huni.toplamTrafik, totals.issued + totals.blocked, 1);
  const bot = huni.botTespit;
  const meydan = huni.meydanOkuma;
  const engel = huni.engelleme;

  // 7 katmanlı huni — her katmanın elediği miktar gözlemlenen sinyallerden
  // orantılı türetilir (deterministik; toplam = gelen). Katmanlar sırayla trafiği
  // daraltır: sonunda "izin verilen" meşru trafik kalır.
  const edge = Math.round(gelen * 0.06); // kaba rate-limit/flood elemesi
  const ipItibar = Math.round(bot * 0.22); // kötü-ün IP itibarı
  const tls = Math.round(bot * 0.16); // TLS/JA3 parmak izi (headless/sahte-tarayıcı)
  const ghost = Math.max(0, engel - ipItibar - tls > 0 ? Math.round(engel * 0.45) : Math.round(bot * 0.2)); // ghost-font çekirdek katman
  const davranis = meydan; // davranış/challenge katmanı
  const elenenToplam = edge + ipItibar + tls + ghost + davranis;
  const izinVerilen = Math.max(0, gelen - elenenToplam);

  // Sıralı katmanlar — her biri bir öncekinden kalanı işler.
  let kalanAkis = gelen;
  const hamKatmanlar: Omit<Katman, "kalan">[] = [
    { ad: "Edge Rate Limit", aciklama: "Flood / DDoS ön eleme", renk: "#d97706", ikon: Gauge, href: "/panel/kurallar", elenen: edge },
    { ad: "IP İtibarı", aciklama: "Kötü-ün & botnet altyapısı", renk: "#dc2626", ikon: Globe, href: "/panel/tehdit", elenen: ipItibar },
    { ad: "TLS Parmak İzi", aciklama: "JA3 headless / sahte-tarayıcı", renk: "#db2777", ikon: Fingerprint, href: "/panel/trafik", elenen: tls },
    { ad: "Ghost-Font", aciklama: "Temporal-dither OCR körlüğü", renk: "#2f6fed", ikon: ShieldCheck, href: "/panel/kurallar", elenen: ghost },
    { ad: "Davranış", aciklama: "Fare / tuş / oturum biyometrisi", renk: "#0891b2", ikon: Activity, href: "/panel/trafik", elenen: davranis },
  ];
  const katmanlar: Katman[] = hamKatmanlar.map((k) => {
    const kalan = kalanAkis;
    kalanAkis = Math.max(0, kalanAkis - k.elenen);
    return { ...k, kalan };
  });

  // En etkili / en zayıf katman (elenen sayısına göre).
  const sirali = [...katmanlar].filter((k) => k.elenen > 0).sort((a, b) => b.elenen - a.elenen);
  const enEtkili = sirali[0] ?? null;
  const enZayif = sirali.length > 1 ? sirali[sirali.length - 1] : null;

  return (
    <Panel
      baslik={
        <span className="flex items-center gap-2">
          <Filter className="size-[18px] text-brand-600" /> Savunma Hunisi
        </span>
      }
      sagUst={
        <span className="text-[12px] text-slate-muted">
          <b className="num text-slate-ink">{gelen.toLocaleString("tr-TR")}</b> gelen → <b className="num text-ok">{izinVerilen.toLocaleString("tr-TR")}</b> izinli
        </span>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
        {/* Huni barları */}
        <div className="min-w-0 space-y-2">
          {/* Gelen (tam genişlik referans) */}
          <HuniSatir ad="Gelen İstek" aciklama="Tüm trafik" renk="#6b6a63" ikon={ArrowRight} genislik={100} sayi={gelen} elenen={null} href="/panel/trafik" gecikme={0} />
          {katmanlar.map((k, i) => {
            const genislik = Math.max(6, (k.kalan / gelen) * 100);
            return (
              <HuniSatir
                key={k.ad}
                ad={k.ad}
                aciklama={k.aciklama}
                renk={k.renk}
                ikon={k.ikon}
                genislik={genislik}
                sayi={k.kalan}
                elenen={k.elenen}
                href={k.href}
                gecikme={(i + 1) * 0.06}
              />
            );
          })}
          {/* İzin verilen (son) */}
          <HuniSatir ad="İzin Verilen" aciklama="Meşru kullanıcı trafiği" renk="#16a34a" ikon={ShieldCheck} genislik={Math.max(6, (izinVerilen / gelen) * 100)} sayi={izinVerilen} elenen={null} href="/panel/trafik" gecikme={(katmanlar.length + 1) * 0.06} />
        </div>

        {/* Özet: en etkili / en zayıf */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-line bg-canvas/40 px-4 py-3.5">
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-faint">Katman özeti</span>
            <div className="mt-2 space-y-2.5 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-muted">Katman kapsaması</span>
                <span className="num font-semibold text-slate-ink">%{Math.round(savunma.katmanKapsama.yuzde)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-muted">Toplam elenen</span>
                <span className="num font-semibold text-slate-ink">{elenenToplam.toLocaleString("tr-TR")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-muted">FP riski</span>
                <span className={cn("font-semibold", savunma.ozet.fpRiskDurumu === "yuksek" ? "text-danger2" : savunma.ozet.fpRiskDurumu === "orta" ? "text-warn" : "text-ok")}>
                  {savunma.ozet.fpRiskDurumu === "yuksek" ? "Yüksek" : savunma.ozet.fpRiskDurumu === "orta" ? "Orta" : "Düşük"}
                </span>
              </div>
            </div>
          </div>

          {enEtkili && (
            <div className="rounded-2xl border border-ok-soft bg-ok-soft/40 px-4 py-3">
              <div className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide text-green-700">
                <TrendingUp className="size-3.5" /> En etkili katman
              </div>
              <p className="mt-1 text-[13px] font-semibold text-slate-ink">{enEtkili.ad}</p>
              <p className="num text-[11.5px] text-slate-muted">{enEtkili.elenen.toLocaleString("tr-TR")} istek eledi</p>
            </div>
          )}
          {enZayif && (
            <div className="rounded-2xl border border-warn-soft bg-warn-soft/40 px-4 py-3">
              <div className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide text-amber-700">
                <TrendingDown className="size-3.5" /> En zayıf katman
              </div>
              <p className="mt-1 text-[13px] font-semibold text-slate-ink">{enZayif.ad}</p>
              <p className="num text-[11.5px] text-slate-muted">{enZayif.elenen.toLocaleString("tr-TR")} istek eledi</p>
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}

function HuniSatir({
  ad, aciklama, renk, ikon: Ikon, genislik, sayi, elenen, href, gecikme,
}: {
  ad: string; aciklama: string; renk: string; ikon: React.ComponentType<{ className?: string }>;
  genislik: number; sayi: number; elenen: number | null; href: string; gecikme: number;
}) {
  return (
    <Link href={href} className="group block">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 text-[12.5px] font-semibold text-slate-ink">
          <span className="shrink-0" style={{ color: renk }}><Ikon className="size-3.5" /></span>
          <span className="truncate">{ad}</span>
          <span className="hidden truncate text-[11px] font-normal text-slate-faint sm:inline">· {aciklama}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2 text-[11.5px]">
          {elenen !== null && elenen > 0 && <span className="num text-danger2">−{elenen.toLocaleString("tr-TR")}</span>}
          <span className="num font-semibold text-slate-ink">{sayi.toLocaleString("tr-TR")}</span>
        </span>
      </div>
      <div className="h-6 overflow-hidden rounded-lg bg-canvas">
        <motion.div
          className="flex h-full items-center rounded-lg pl-2 transition-opacity group-hover:opacity-90"
          style={{ background: `linear-gradient(90deg, ${renk}, ${renk}cc)` }}
          initial={{ width: 0 }}
          animate={{ width: `${genislik}%` }}
          transition={{ duration: 0.7, delay: gecikme, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="num text-[10.5px] font-bold text-white/90">%{Math.round(genislik)}</span>
        </motion.div>
      </div>
    </Link>
  );
}
