"use client";

/**
 * Specter — Saldırı Zaman Tüneli & Olay Yeniden-Kurgu
 * ===================================================
 * Bir saldırı tek bir olay değil, ZAMAN İÇİNDE bir hikâyedir: keşif başlar,
 * erişim denenir, saldırı yayılır, veri çekilir ve nihayet savunma devreye
 * girer. Bu bölüm her incident'i KRONOLOJİK bir zaman tüneli olarak anlatır —
 * fazlar soldan sağa dizilir, her düğüm bir kill-chain aşamasıdır ve her
 * incident için otomatik üretilmiş adli bir anlatı özeti gösterilir.
 *
 * HİÇBİR sayı uydurma değildir — hepsi `zaman-tuneli` motorundan
 * (saldiriZamanTuneli / tunelOzet) türetilir. page.tsx SERVER'da hesaplar,
 * buraya hazır prop gelir.
 *
 * Tasarım: KillChainBolumu / KorelasyonBolumu ile birebir aynı dil — Panel +
 * krem kartlar (bg-canvas), tabular-nums, rounded kartlar; framer-motion rise
 * (initial y:12 → 0; azHareket → sade).
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  History,
  Search,
  KeyRound,
  GitFork,
  Database,
  ShieldCheck,
  ShieldAlert,
  Flame,
  Clock,
  Users,
  Layers,
  Ban,
  Radio,
  Bot,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Panel, Badge, Ulke } from "@/components/panel/kit";
import type { TunelOlayi, TunelOzet, Faz, FazKaydi } from "@/lib/specter/zaman-tuneli";

/* ================================================================== Sabitler */

/** Kill-chain'in kanonik (kronolojik) faz sırası. */
const FAZ_SIRA: Faz[] = ["kesif", "erisim_denemesi", "yayilma", "veri_cikarma", "etki"];

/** Faz → TR ad + kısa ad + ikon + hex renk (kill-chain ilerledikçe koyulaşan tehdit). */
const FAZ_TANIM: Record<Faz, { ad: string; kisa: string; ikon: React.ElementType; hex: string }> = {
  kesif:           { ad: "Keşif",           kisa: "Keşif",   ikon: Search,      hex: "#2f6fed" },
  erisim_denemesi: { ad: "Erişim Denemesi", kisa: "Erişim",  ikon: KeyRound,    hex: "#7c3aed" },
  yayilma:         { ad: "Yayılma",         kisa: "Yayılma", ikon: GitFork,     hex: "#d97706" },
  veri_cikarma:    { ad: "Veri Çıkarma",    kisa: "Veri",    ikon: Database,    hex: "#dc2626" },
  etki:            { ad: "Etki / Savunma",  kisa: "Etki",    ikon: ShieldCheck, hex: "#0f766e" },
};

/** Şiddet → renk paleti (hex + tailwind rozet tonu + etiket). */
const SIDDET_TANIM: Record<
  string,
  { hex: string; rozet: "kirmizi" | "sari" | "mavi"; etiket: string }
> = {
  kritik: { hex: "#dc2626", rozet: "kirmizi", etiket: "Kritik" },
  yuksek: { hex: "#ea580c", rozet: "kirmizi", etiket: "Yüksek" },
  orta:   { hex: "#d97706", rozet: "sari",    etiket: "Orta" },
  dusuk:  { hex: "#2f6fed", rozet: "mavi",     etiket: "Düşük" },
};

function siddet(s: string) {
  return SIDDET_TANIM[s] ?? SIDDET_TANIM.dusuk;
}

/* ================================================================== Yardımcılar */

function sayi(n: number): string {
  return (Number.isFinite(n) ? n : 0).toLocaleString("tr-TR");
}

/** Süreyi (ms) insan-okur biçime çevirir — deterministik ("<1 dk" / "12 dk" / "3 sa" / "2 gün"). */
function sureBicim(ms: number): string {
  const sn = Math.round(Math.max(0, ms) / 1000);
  if (sn < 60) return `${sn} sn`;
  const dk = Math.round(sn / 60);
  if (dk < 60) return `${dk} dk`;
  const sa = Math.round(dk / 60);
  if (sa < 24) return `${sa} sa`;
  const gun = Math.round(sa / 24);
  return `${gun} gün`;
}

/** ts → "HH:MM" (yerel, hidrasyon uyarısı çağıran tarafta bastırılır). */
function saatDk(ts: number): string {
  return new Date(ts).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

/** Bölümü rise ile saran motion sarmalayıcı (KillChainBolumu ile aynı). */
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
  alt,
  ton,
}: {
  ikon: React.ElementType;
  etiket: string;
  deger: string;
  alt?: string;
  ton?: "danger" | "ok";
}) {
  const renk = ton === "danger" ? "text-danger2" : ton === "ok" ? "text-ok" : "text-slate-ink";
  return (
    <div className="rounded-xl border border-line bg-canvas/40 px-3.5 py-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-faint">
        <Ikon className="size-3.5" />
        {etiket}
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className={cn("text-[22px] font-bold leading-none num", renk)}>{deger}</span>
        {alt && <span className="text-[12px] tabular-nums text-slate-faint">{alt}</span>}
      </div>
    </div>
  );
}

/* ================================================================== Faz timeline */

/**
 * Bir incident'ın kronolojik faz dizisini DİKEY bir zaman çizelgesi (timeline)
 * olarak çizer — soldaki sürekli akış çizgisi üzerine ikon düğümleri dizilir,
 * sağda her faz için açıklama + olay/IP metrikleri. Yatay scroll YOK; kill-chain
 * ilerledikçe renk koyulaşır. Önceki yatay-tünel deseninin yerini alır.
 */
function FazTuneli({
  fazlar,
  azHareket,
  gecikme,
}: {
  fazlar: FazKaydi[];
  azHareket: boolean;
  gecikme: number;
}) {
  if (!fazlar.length) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-canvas/30 px-4 py-6 text-center text-[12px] text-slate-faint">
        Yeniden kurulacak faz bulunamadı.
      </div>
    );
  }

  const enFazlaOlay = Math.max(1, ...fazlar.map((f) => f.olaySayisi));

  return (
    <div className="relative pl-1">
      {fazlar.map((f, i) => {
        const tanim = FAZ_TANIM[f.faz];
        const Ikon = tanim.ikon;
        const sonMu = i === fazlar.length - 1;
        const olayOran = Math.round((f.olaySayisi / enFazlaOlay) * 100);
        return (
          <motion.div
            key={`${f.faz}-${f.ts}-${i}`}
            className="relative flex gap-3.5 pb-3.5 last:pb-0"
            initial={azHareket ? false : { y: 8 }}
            animate={azHareket ? undefined : { y: 0 }}
            transition={{ duration: 0.35, delay: gecikme + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Sol ray: dikey akış çizgisi + faz düğümü */}
            <div className="relative flex w-8 shrink-0 flex-col items-center">
              {/* Bağlantı çizgisi (son fazda yok) */}
              {!sonMu && (
                <span
                  className="absolute top-8 h-[calc(100%-1rem)] w-px"
                  style={{ background: `linear-gradient(${tanim.hex}55, ${FAZ_TANIM[fazlar[i + 1].faz].hex}55)` }}
                />
              )}
              <span
                className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full ring-1 ring-inset"
                style={{ background: `${tanim.hex}14`, color: tanim.hex, borderColor: `${tanim.hex}33` }}
              >
                <Ikon className="size-[17px]" />
              </span>
            </div>

            {/* Sağ içerik kartı */}
            <div className="min-w-0 flex-1 rounded-xl border bg-surface px-3.5 py-2.5" style={{ borderColor: `${tanim.hex}26` }}>
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[12.5px] font-semibold text-slate-ink">{tanim.ad}</span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-faint">
                    <Clock className="size-3" />
                    <span className="tabular-nums" suppressHydrationWarning>{saatDk(f.ts)}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-[11px]">
                  <span className="tabular-nums font-semibold text-slate-ink">{sayi(f.olaySayisi)} olay</span>
                  <span className="text-slate-300">·</span>
                  <span className="tabular-nums text-slate-faint">{sayi(f.ipler.length)} IP</span>
                </div>
              </div>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-muted">{f.aciklama}</p>
              {/* Faz yoğunluk barı (olay sayısı oransal) — fazlar arası hacim farkını gösterir */}
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-canvas">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: tanim.hex, opacity: 0.75 }}
                  initial={azHareket ? false : { width: 0 }}
                  animate={azHareket ? undefined : { width: `${olayOran}%` }}
                  transition={{ duration: 0.55, delay: gecikme + 0.1 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ================================================================== Incident kartı */

function IncidentKart({
  incident,
  azHareket,
  gecikme,
  acik,
  onToggle,
}: {
  incident: TunelOlayi;
  azHareket: boolean;
  gecikme: number;
  acik: boolean;
  onToggle: () => void;
}) {
  const s = siddet(incident.siddet);
  const sav = incident.savunmaYaniti;
  const mitigasyon = Math.round(sav.mitigasyonOrani * 100);
  const kritikMi = incident.siddet === "kritik";
  const ulkeler = incident.ulkeler.slice(0, 4);

  return (
    <div
      className={cn(
        "rounded-2xl border bg-canvas/40 p-4",
        kritikMi ? "border-red-200 bg-danger-soft/30" : "border-line",
        acik && "ring-1 ring-inset ring-slate-300",
      )}
    >
      {/* Üst şerit: kimlik + şiddet + süre — TIKLANABİLİR (drill-down) */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={acik}
        aria-label={`${incident.baslik} olay detayını ${acik ? "kapat" : "aç"}`}
        className="mb-3 flex w-full flex-wrap items-center justify-between gap-3 rounded-lg text-left transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="grid size-8 shrink-0 place-items-center rounded-lg ring-1 ring-inset"
            style={{ background: `${s.hex}14`, color: s.hex, borderColor: `${s.hex}33` }}
          >
            {kritikMi ? <ShieldAlert className="size-4" /> : <ShieldCheck className="size-4" />}
          </span>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold text-slate-ink">{incident.baslik}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-faint">
              <span className="inline-flex items-center gap-1">
                <Bot className="size-3" />
                {incident.dominantBotClass}
              </span>
              <span className="text-slate-300">·</span>
              <span className="tabular-nums">{sayi(incident.olaySayisi)} olay</span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Badge ton={s.rozet}>
            {kritikMi && <Flame className="size-3" />}
            {s.etiket}
          </Badge>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[12px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
            <Clock className="size-3.5" />
            {sureBicim(incident.sureMs)}
          </span>
          <ChevronDown className={cn("size-4 shrink-0 text-slate-faint transition-transform", acik && "rotate-180")} />
        </div>
      </button>

      {/* Drill-down: adli anlatı + faz tüneli + savunma yanıtı (tıklayınca açılır) */}
      <AnimatePresence initial={false}>
        {acik && (
          <motion.div
            initial={azHareket ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={azHareket ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: azHareket ? 0 : 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
      {/* Adli anlatı — vurgu kutusu */}
      <div
        className="mb-4 rounded-xl border-l-2 bg-surface/70 px-3.5 py-2.5"
        style={{ borderColor: s.hex }}
      >
        <div className="mb-0.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-faint">
          <Radio className="size-3" />
          Adli anlatı
        </div>
        <p className="text-[12.5px] italic leading-relaxed text-slate-muted">{incident.anlati}</p>
      </div>

      {/* Yatay faz zaman tüneli */}
      <FazTuneli fazlar={incident.fazlar} azHareket={azHareket} gecikme={gecikme} />

      {/* Alt: savunma yanıtı + kapsam */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {/* Savunma yanıtı */}
        <div className="rounded-xl border border-line bg-surface/60 px-3.5 py-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-faint">
              <ShieldCheck className="size-3.5" />
              Savunma yanıtı
            </span>
            <span className={cn("text-[12px] font-semibold tabular-nums", mitigasyon > 0 ? "text-ok" : "text-slate-faint")}>
              %{mitigasyon} mitigasyon
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-canvas">
            <motion.div
              className="h-full rounded-full bg-ok"
              initial={azHareket ? false : { width: 0 }}
              animate={azHareket ? undefined : { width: `${mitigasyon}%` }}
              transition={{ duration: 0.6, delay: gecikme + 0.1, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
            <span className="inline-flex items-center gap-1 text-red-700">
              <Ban className="size-3" />
              <span className="tabular-nums font-semibold">{sayi(sav.engellenen)}</span> engellendi
            </span>
            <span className="inline-flex items-center gap-1 text-amber-700">
              <ShieldCheck className="size-3" />
              <span className="tabular-nums font-semibold">{sayi(sav.dogrulanan)}</span> doğrulandı
            </span>
            {sav.isaretlenen > 0 && (
              <span className="inline-flex items-center gap-1 text-blue-700">
                <span className="tabular-nums font-semibold">{sayi(sav.isaretlenen)}</span> işaretlendi
              </span>
            )}
            {sav.ilkTepkiTs !== null && (
              <span className="inline-flex items-center gap-1 text-slate-faint">
                <Clock className="size-3" />
                ilk tepki <span className="tabular-nums" suppressHydrationWarning>{saatDk(sav.ilkTepkiTs)}</span>
              </span>
            )}
          </div>
        </div>

        {/* Kapsam: IP / ASN / ülkeler */}
        <div className="rounded-xl border border-line bg-surface/60 px-3.5 py-3">
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-faint">
            <Users className="size-3.5" />
            Katılımcılar
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-slate-muted">
            <span className="inline-flex items-baseline gap-1">
              <span className="text-[16px] font-bold leading-none num text-slate-ink">{sayi(incident.katilanIp)}</span>
              <span className="text-[11px] text-slate-faint">IP</span>
            </span>
            <span className="inline-flex items-baseline gap-1">
              <span className="text-[16px] font-bold leading-none num text-slate-ink">{sayi(incident.katilanAsn)}</span>
              <span className="text-[11px] text-slate-faint">ASN</span>
            </span>
          </div>
          {ulkeler.length > 0 && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              {ulkeler.map((u) => (
                <Ulke key={u} kod={u} />
              ))}
              {incident.ulkeler.length > ulkeler.length && (
                <span className="text-[11px] text-slate-faint">+{incident.ulkeler.length - ulkeler.length}</span>
              )}
            </div>
          )}
        </div>
      </div>
          </motion.div>
        )}
      </AnimatePresence>
      {!acik && (
        <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-faint">
          <ChevronDown className="size-3" />
          Adli anlatı, faz tüneli ve savunma yanıtı için tıklayın
        </p>
      )}
    </div>
  );
}

/* ================================================================== Ana bileşen */

export function ZamanTuneliBolumu({
  incidentler,
  ozet,
  azHareket,
}: {
  incidentler: TunelOlayi[];
  ozet: TunelOzet;
  azHareket: boolean;
}) {
  const [acikId, setAcikId] = useState<string | null>(null);
  const gosterilecek = incidentler.slice(0, 6);
  const genelMitigasyon = Math.round(ozet.genelMitigasyon * 100);
  const acilisAd = ozet.baskinAcilisFaz ? FAZ_TANIM[ozet.baskinAcilisFaz].ad : "—";

  return (
    <Bolum azHareket={azHareket}>
      <Panel
        baslik={<BaslikIkon ikon={History} metin="Saldırı Zaman Tüneli" />}
        sagUst={
          <span className="text-[12px] text-slate-faint">
            {sayi(ozet.toplamIncident)} yeniden kurulmuş incident
          </span>
        }
      >
        {/* Açıklama */}
        <p className="-mt-1 mb-4 max-w-2xl text-[13px] leading-relaxed text-slate-muted">
          Bir saldırı zaman içinde bir hikâyedir. Her incident, ham olaylardan
          yeniden kurulan bir kill-chain fazı dizisiyle anlatılır:
          {" "}Keşif → Erişim → Yayılma → Veri Çıkarma → Etki. Aşağıda en tehlikeli
          incident'lar kronolojik zaman tüneli ve adli anlatılarıyla gösteriliyor.
        </p>

        {/* Özet hapları */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <OzetHap ikon={Layers} etiket="Incident" deger={sayi(ozet.toplamIncident)} />
          <OzetHap
            ikon={Flame}
            etiket="Kritik"
            deger={sayi(ozet.kritik)}
            ton={ozet.kritik > 0 ? "danger" : undefined}
          />
          <OzetHap ikon={Users} etiket="Katılımcı" deger={sayi(ozet.toplamKatilimci)} alt="IP" />
          <OzetHap ikon={Clock} etiket="Ort. süre" deger={sureBicim(ozet.ortSureMs)} />
        </div>

        {/* İkincil şerit: baskın açılış fazı + genel mitigasyon */}
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-line bg-canvas/30 px-4 py-2.5 text-[12px]">
          <span className="inline-flex items-center gap-1.5 text-slate-muted">
            <Search className="size-3.5 text-slate-faint" />
            Baskın açılış fazı:
            <span className="font-semibold text-slate-ink">{acilisAd}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-muted sm:ml-auto">
            <ShieldCheck className="size-3.5 text-ok" />
            Genel mitigasyon:
            <span className={cn("font-semibold tabular-nums", genelMitigasyon > 0 ? "text-ok" : "text-slate-ink")}>
              %{genelMitigasyon}
            </span>
          </span>
        </div>

        {/* Incident listesi */}
        {gosterilecek.length === 0 ? (
          <div className="mt-5 grid place-items-center rounded-2xl border border-dashed border-line py-12 text-center">
            <ShieldCheck className="mb-2 size-7 text-ok" />
            <p className="text-[13px] font-medium text-slate-muted">Yeniden kurulacak incident yok</p>
            <p className="mt-0.5 text-[12px] text-slate-faint">
              Korele saldırı davranışı tespit edildiğinde zaman tünelleri burada belirir.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {gosterilecek.map((inc, i) => (
              <IncidentKart
                key={inc.id}
                incident={inc}
                azHareket={azHareket}
                gecikme={azHareket ? 0 : 0.05 + i * 0.04}
                acik={acikId === inc.id}
                onToggle={() => setAcikId(acikId === inc.id ? null : inc.id)}
              />
            ))}
          </div>
        )}

        {/* Faz lejantı */}
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4 text-[11px] text-slate-faint">
          <span className="font-medium uppercase tracking-wide">Kill-chain fazları:</span>
          {FAZ_SIRA.map((faz, i) => {
            const tanim = FAZ_TANIM[faz];
            const Ikon = tanim.ikon;
            return (
              <span key={faz} className="inline-flex items-center gap-1.5 text-slate-muted">
                <Ikon className="size-3.5" style={{ color: tanim.hex }} />
                <span className="tabular-nums text-slate-faint">{i + 1}.</span>
                {tanim.ad}
              </span>
            );
          })}
        </div>
      </Panel>
    </Bolum>
  );
}
