"use client";

/**
 * Specter — TLS Parmak İzi İstihbaratı (JA3)
 * ==========================================
 * User-Agent yalan söyleyebilir — TLS parmak izi (JA3) söyleyemez. Bir istek
 * "Chrome" olduğunu iddia edebilir, ama TLS el sıkışması (ClientHello) istemcinin
 * GERÇEK kütüphanesini ele verir: Python-requests, curl, Go-http, headless Chrome
 * ve gerçek Chrome — her birinin kendine has bir JA3 imzası vardır. Bu bölüm
 * gözlemlenen JA3 kümelerini sınıflandırır ve en tehlikeli sinyali öne çıkarır:
 * **UA bir tarayıcı iddia ediyor ama JA3 araç imzası** (uyumsuz = sahtekârlık).
 *
 * HİÇBİR sayı uydurma değildir — hepsi `tls-istihbarat` motorundan türetilir.
 * page.tsx SERVER'da hesaplar (tlsIstihbarat), buraya hazır TlsSonuc gelir.
 *
 * Tasarım: KorelasyonBolumu / TehditAktorBolumu ile birebir aynı dil — Panel +
 * krem kartlar (bg-canvas), tabular-nums, rounded kartlar; framer-motion rise
 * (azHareket → sade). whileInView / viewport / opacity-fade YOK.
 */

import { motion } from "framer-motion";
import {
  Fingerprint,
  ShieldCheck,
  ShieldAlert,
  Globe,
  Bot,
  Terminal,
  Cpu,
  HelpCircle,
  Boxes,
  Server,
  Gauge,
  Flame,
  Ban,
  AlertTriangle,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Panel, Badge, Ulke } from "@/components/panel/kit";
import { DonutDagilim } from "@/components/panel/grafikler";
import { Gauge as GaugeGorsel, IsiMatris } from "@/components/panel/grafikler-ek";
import type { TlsSonuc, Ja3Kume, TlsSinif } from "@/lib/specter/tls-istihbarat";

/* ================================================================== Sabitler */

/** TLS sınıfı → TR ad + renk (hex) + rozet tonu + ikon + kısa alt-etiket.
 *  sahte = en tehlikeli (kırmızı), headless = turuncu, arac/bot = amber,
 *  ai = mavi, tarayici = yeşil, bilinmiyor = gri. */
const SINIF_TANIM: Record<
  TlsSinif,
  {
    ad: string;
    hex: string;
    rozet: "yesil" | "kirmizi" | "sari" | "mavi" | "gri";
    ikon: React.ElementType;
    alt: string;
  }
> = {
  tarayici:   { ad: "Gerçek Tarayıcı", hex: "#16a34a", rozet: "yesil",   ikon: Globe,       alt: "Doğrulanmış tarayıcı imzası" },
  sahte:      { ad: "Sahte Tarayıcı",  hex: "#dc2626", rozet: "kirmizi", ikon: ShieldAlert, alt: "UA yalan söylüyor — JA3 araç" },
  headless:   { ad: "Headless Tarayıcı", hex: "#d97706", rozet: "sari",  ikon: Bot,         alt: "Puppeteer / Playwright / Selenium" },
  arac:       { ad: "Otomasyon Aracı", hex: "#b45309", rozet: "sari",    ikon: Terminal,    alt: "Python / curl / Go — tarayıcı değil" },
  ai:         { ad: "AI Ajan",         hex: "#2f6fed", rozet: "mavi",    ikon: Cpu,         alt: "İlan edilmiş AI crawler deseni" },
  bilinmiyor: { ad: "Bilinmiyor",      hex: "#64748b", rozet: "gri",     ikon: HelpCircle,  alt: "Sınıflandırılamayan imza" },
};

/** Lejant sırası (görsel öncelik: sahte önce, tarayıcı sonra). */
const LEJANT_SIRA: TlsSinif[] = ["sahte", "arac", "headless", "ai", "tarayici", "bilinmiyor"];

/* ================================================================== Yardımcılar */

function sayi(n: number): string {
  return (Number.isFinite(n) ? n : 0).toLocaleString("tr-TR");
}

/** Uzun JA3 hash'ini mono-uyumlu kısalt ("cd08e314…95473da9"). */
function ja3Kisa(ja3: string): string {
  if (ja3.length <= 20) return ja3;
  return `${ja3.slice(0, 8)}…${ja3.slice(-8)}`;
}

/** UA'yı karta sığacak şekilde kısalt (mono gösterim). */
function uaKisa(ua: string, uzunluk = 68): string {
  if (!ua) return "—";
  return ua.length <= uzunluk ? ua : `${ua.slice(0, uzunluk - 1)}…`;
}

/** Tehdit skoruna göre renk (hex). */
function tehditRenk(s: number): string {
  if (s >= 70) return "#dc2626";
  if (s >= 45) return "#ea580c";
  if (s >= 25) return "#d97706";
  return "#16a34a";
}

/** Engine adını normalize edip TR/etiket sunar. */
function engineEtiket(engine: string): string {
  const e = engine.trim();
  if (!e || e === "—" || e.toLowerCase() === "none") return "Motor yok";
  return e;
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

/* ================================================================== Metrik hücresi */

function Metrik({
  ikon: Ikon,
  etiket,
  children,
  ton = "ink",
}: {
  ikon: React.ElementType;
  etiket: string;
  children: React.ReactNode;
  ton?: "ink" | "danger";
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">
        <Ikon className="size-3" />
        {etiket}
      </div>
      <div
        className={cn(
          "mt-1 flex items-center gap-1.5 text-[13px] font-semibold tabular-nums",
          ton === "danger" ? "text-danger2" : "text-slate-ink",
        )}
      >
        {children}
      </div>
    </div>
  );
}

/* ================================================================== JA3 küme kartı */

function Ja3Kart({ kume, azHareket }: { kume: Ja3Kume; azHareket: boolean }) {
  const tanim = SINIF_TANIM[kume.sinif] ?? SINIF_TANIM.bilinmiyor;
  const SinifIkon = tanim.ikon;
  // "Sahte tarayıcı" (UA-TLS uyumsuz) EN KRİTİK — kartı kırmızıya boya.
  const sahtekarlik = kume.uyumsuz || kume.sinif === "sahte";
  const vurgulu = sahtekarlik || kume.tehditSkoru >= 45;
  const tSkorRenk = tehditRenk(kume.tehditSkoru);

  const ulkeGoster = kume.ulkeler.slice(0, 4);
  const ulkeArtan = kume.ulkeler.length - ulkeGoster.length;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-canvas/40 p-4 pl-5 transition",
        sahtekarlik
          ? "border-red-300 bg-danger-soft/35 ring-1 ring-inset ring-red-200"
          : vurgulu
            ? "border-red-200 bg-danger-soft/25"
            : "border-line",
      )}
    >
      {/* Isı-renkli sol şerit — tehdit skoruna göre (görsel sıcaklık ipucu) */}
      <span
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ background: tSkorRenk }}
        aria-hidden
      />

      {/* Üst şerit: sınıf ikonu + TR sınıf + açıklama + tehdit skoru */}
      <div className="mb-3.5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="grid size-9 shrink-0 place-items-center rounded-xl ring-1 ring-inset"
            style={{
              background: `${tanim.hex}14`,
              color: tanim.hex,
              borderColor: `${tanim.hex}33`,
            }}
          >
            <SinifIkon className="size-[18px]" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] font-semibold text-slate-ink">{tanim.ad}</span>
              <Badge ton={tanim.rozet}>
                {kume.sinif === "sahte" && <Flame className="size-3" />}
                {tanim.alt}
              </Badge>
            </div>
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-muted">{kume.aciklama}</p>
          </div>
        </div>

        {/* Tehdit skoru pili */}
        <div className="flex shrink-0 flex-col items-end">
          <div className="flex items-center gap-1.5">
            <Gauge className="size-3.5 text-slate-faint" />
            <span className="text-[15px] font-bold tabular-nums" style={{ color: tSkorRenk }}>
              {kume.tehditSkoru}
            </span>
          </div>
          <span className="text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">tehdit skoru</span>
        </div>
      </div>

      {/* KRİTİK sahtekârlık rozeti — UA tarayıcı der ama JA3 araç imzası */}
      {sahtekarlik && (
        <div className="mb-3.5 flex items-center gap-2.5 rounded-xl border border-red-300 bg-danger-soft px-3 py-2.5">
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-danger2 text-white">
            <AlertTriangle className="size-4" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[12.5px] font-bold uppercase tracking-wide text-red-700">
                UA-TLS Uyumsuz — Sahte
              </span>
            </div>
            <p className="mt-0.5 text-[11.5px] leading-snug text-red-800">
              User-Agent bir tarayıcı iddia ediyor, fakat JA3 imzası bir otomasyon aracına ait —
              bu istek kimliğini gizliyor.
            </p>
          </div>
        </div>
      )}

      {/* JA3 hash + baskın motor */}
      <div className="mb-3.5 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">
            <Fingerprint className="size-3" />
            JA3
          </span>
          <span className="truncate rounded bg-canvas px-1.5 py-0.5 font-mono text-[11.5px] text-slate-ink ring-1 ring-inset ring-line">
            {ja3Kisa(kume.ja3)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">
            <Cpu className="size-3" />
            Motor
          </span>
          <span className="rounded bg-canvas px-1.5 py-0.5 font-mono text-[11.5px] text-slate-muted ring-1 ring-inset ring-line">
            {engineEtiket(kume.engine)}
          </span>
        </div>
      </div>

      {/* Metrikler */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        <Metrik ikon={Boxes} etiket="Toplam olay">
          {sayi(kume.toplam)}
        </Metrik>
        <Metrik ikon={Server} etiket="Benzersiz IP">
          {sayi(kume.benzersizIp)}
        </Metrik>
        <Metrik ikon={Ban} etiket="Engellenen" ton={kume.engellenen > 0 ? "danger" : "ink"}>
          {sayi(kume.engellenen)}
        </Metrik>
        <Metrik ikon={Gauge} etiket="Tehdit">
          <span style={{ color: tSkorRenk }}>{kume.tehditSkoru}</span>
          <span className="text-[11px] font-medium text-slate-faint">/100</span>
        </Metrik>
      </div>

      {/* Kaynak ülkeler */}
      {ulkeGoster.length > 0 && (
        <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">
              <Globe className="size-3" />
              Kaynak
            </span>
            <div className="flex flex-wrap items-center gap-1">
              {ulkeGoster.map((u) => (
                <Ulke key={u} kod={u} />
              ))}
              {ulkeArtan > 0 && (
                <span className="rounded bg-canvas px-1.5 py-0.5 text-[11px] font-medium text-slate-muted">
                  +{ulkeArtan}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Örnek User-Agent — TLS ile karşılaştırma için (mono, kısaltılmış) */}
      <div className="mt-3.5 flex min-w-0 items-center gap-1.5 border-t border-line/70 pt-3">
        <span className="inline-flex shrink-0 items-center gap-1 text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">
          <Layers className="size-3" />
          Örnek UA
        </span>
        <span
          className={cn(
            "truncate rounded px-1.5 py-0.5 font-mono text-[11px] ring-1 ring-inset",
            sahtekarlik
              ? "bg-danger-soft/60 text-red-800 ring-red-200"
              : "bg-canvas text-slate-muted ring-line",
          )}
          title={kume.ornekUa}
        >
          {uaKisa(kume.ornekUa)}
        </span>
      </div>
    </div>
  );
}

/* ================================================================== Ana bileşen */

export function TlsIstihbaratBolumu({ tls, azHareket }: { tls: TlsSonuc; azHareket: boolean }) {
  const { kumeler, ozet } = tls;
  // Tehdit skoruna göre sırala (motor zaten sıralı gönderir); ilk 8'i göster.
  const gosterilecek = [...kumeler]
    .sort((a, b) => b.tehditSkoru - a.tehditSkoru || b.toplam - a.toplam)
    .slice(0, 8);
  const sahteVar = ozet.sahteJa3 > 0 || ozet.uyumsuzOlay > 0;

  /* --- Görsel özet türetimleri (yalnızca mevcut motor verisinden) --- */
  // İstemci/motor dağılımı: her JA3 kümesinin sınıfına göre olay toplamı.
  const sinifOlay = new Map<TlsSinif, number>();
  for (const k of kumeler) sinifOlay.set(k.sinif, (sinifOlay.get(k.sinif) ?? 0) + k.toplam);
  const donutSegment = LEJANT_SIRA.map((s) => ({
    etiket: SINIF_TANIM[s].ad,
    deger: sinifOlay.get(s) ?? 0,
    renk: SINIF_TANIM[s].hex,
  })).filter((d) => d.deger > 0);

  // Otomasyon/headless oranı Gauge: gerçek tarayıcı OLMAYAN olayların yüzdesi.
  const toplamOlay = kumeler.reduce((a, k) => a + k.toplam, 0);
  const tarayiciOlay = kumeler
    .filter((k) => k.sinif === "tarayici")
    .reduce((a, k) => a + k.toplam, 0);
  const otomasyonOran = toplamOlay ? Math.round(((toplamOlay - tarayiciOlay) / toplamOlay) * 100) : 0;

  // TLS anomali ısı-matrisi: satır = en tehlikeli 4 sınıf, sütun = anomali sinyali.
  const anomaliSinifSira: TlsSinif[] = ["sahte", "arac", "headless", "ai"];
  const anomaliSatir = anomaliSinifSira.filter((s) => (sinifOlay.get(s) ?? 0) > 0);
  const anomaliSutun = ["Olay", "UA-TLS uyumsuz", "Engellenen", "Tehdit"];
  const anomaliDeger = anomaliSatir.map((s) => {
    const grup = kumeler.filter((k) => k.sinif === s);
    const olay = grup.reduce((a, k) => a + k.toplam, 0);
    const uyumsuz = grup.filter((k) => k.uyumsuz).reduce((a, k) => a + k.toplam, 0);
    const engellenen = grup.reduce((a, k) => a + k.engellenen, 0);
    const maksTehdit = Math.max(0, ...grup.map((k) => k.tehditSkoru));
    // 0-100 yoğunluğa normalize (olay/engellenen kendi maks'ına göre, uyumsuz oranı, tehdit ham).
    const olayN = toplamOlay ? Math.round((olay / toplamOlay) * 100) : 0;
    const uyumsuzN = olay ? Math.round((uyumsuz / olay) * 100) : 0;
    const engelN = olay ? Math.round((engellenen / olay) * 100) : 0;
    return [olayN, uyumsuzN, engelN, maksTehdit];
  });
  const anomaliVar = anomaliSatir.length > 0;

  return (
    <Bolum azHareket={azHareket}>
      <Panel
        baslik={<BaslikIkon ikon={Fingerprint} metin="TLS Parmak İzi İstihbaratı" />}
        sagUst={
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-slate-faint">{sayi(ozet.toplamJa3)} imza</span>
            <Badge ton={sahteVar ? "kirmizi" : "brand"}>
              <Fingerprint className="size-3" />
              JA3
            </Badge>
          </div>
        }
      >
        {/* Açıklama — kilit fikir */}
        <p className="-mt-1 mb-4 max-w-2xl text-[13px] leading-relaxed text-slate-muted">
          <span className="font-medium text-slate-ink">User-Agent yalan söyleyebilir — TLS parmak izi (JA3) söyleyemez.</span>{" "}
          Bir istek &quot;Chrome&quot; olduğunu iddia edebilir, ama TLS el sıkışması gerçek kütüphaneyi ele verir.
          Veylify gözlemlenen JA3&apos;leri kümeler, sınıflandırır ve en tehlikeli sinyali yakalar: UA
          bir tarayıcı der ama JA3 bir <span className="font-medium text-danger2">araç imzasıdır</span> — sahte tarayıcı.
        </p>

        {/* Ferah görsel özet: solda istemci/motor dağılımı donut'u, sağda
            otomasyon oranı gauge + kritik KPI'lar. Monoton bar-şeridini kırar. */}
        <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          {/* Donut — TLS el sıkışması olaylarının istemci/motor sınıfına göre dağılımı */}
          <div className="rounded-2xl border border-line bg-canvas/40 p-5">
            <div className="mb-4 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-faint">
              <Layers className="size-3.5" />
              İstemci / motor dağılımı — kim gerçekten kim
            </div>
            {donutSegment.length > 0 ? (
              <DonutDagilim segmentler={donutSegment} />
            ) : (
              <div className="grid place-items-center py-8 text-center text-[12px] text-slate-faint">
                Henüz sınıflandırılmış TLS olayı yok
              </div>
            )}
          </div>

          {/* Otomasyon oranı gauge + iki büyük KPI hapı */}
          <div className="flex flex-col gap-4">
            <div className="grid place-items-center rounded-2xl border border-line bg-canvas/40 p-5">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-faint">
                <Bot className="size-3.5" />
                Otomasyon / headless oranı
              </div>
              <GaugeGorsel
                deger={otomasyonOran}
                etiket={otomasyonOran >= 50 ? "yüksek otomasyon" : "çoğu gerçek"}
                boyut={170}
                renk={otomasyonOran >= 50 ? "#dc2626" : otomasyonOran >= 25 ? "#d97706" : "#16a34a"}
              />
              <p className="mt-1 max-w-[15rem] text-center text-[11px] leading-snug text-slate-muted">
                Gerçek tarayıcı OLMAYAN TLS olaylarının payı — araç, headless, AI ve sahte imzalar.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <OzetHap
                ikon={ShieldAlert}
                etiket="Sahte JA3"
                deger={sayi(ozet.sahteJa3)}
                ton={ozet.sahteJa3 > 0 ? "danger" : "ink"}
              />
              <OzetHap
                ikon={AlertTriangle}
                etiket="UA-TLS sahtekârlık"
                deger={sayi(ozet.uyumsuzOlay)}
                ek="olay"
                ton={ozet.uyumsuzOlay > 0 ? "danger" : "ok"}
              />
            </div>
          </div>
        </div>

        {/* TLS anomali ısı-matrisi — sınıf × anomali sinyali yoğunluğu */}
        {anomaliVar && (
          <div className="mt-4 rounded-2xl border border-line bg-canvas/40 p-5">
            <div className="mb-3.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-faint">
              <Flame className="size-3.5" />
              TLS anomali matrisi — hangi sınıf hangi sinyali ne yoğunlukta tetikliyor
            </div>
            <IsiMatris
              satirlar={anomaliSatir.map((s) => SINIF_TANIM[s].ad)}
              sutunlar={anomaliSutun}
              degerler={anomaliDeger}
            />
          </div>
        )}

        {/* JA3 küme listesi */}
        {gosterilecek.length === 0 ? (
          <div className="mt-5 grid place-items-center rounded-2xl border border-dashed border-line py-12 text-center">
            <ShieldCheck className="mb-2 size-7 text-ok" />
            <p className="text-[13px] font-medium text-slate-muted">TLS parmak izi kümesi yok</p>
            <p className="mt-0.5 text-[12px] text-slate-faint">
              İstemciler TLS el sıkışması yaptıkça JA3 imzaları burada kümelenir ve sınıflandırılır.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {gosterilecek.map((k, i) => (
              <Bolum key={k.ja3} azHareket={azHareket} gecikme={azHareket ? 0 : 0.05 + i * 0.03}>
                <Ja3Kart kume={k} azHareket={azHareket} />
              </Bolum>
            ))}
          </div>
        )}

        {/* Sınıf lejantı + kilit vurgu */}
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4 text-[11px] text-slate-faint">
          <span className="font-medium uppercase tracking-wide">TLS sınıfı:</span>
          {LEJANT_SIRA.map((s) => {
            const t = SINIF_TANIM[s];
            return (
              <span key={s} className="inline-flex items-center gap-1.5 text-slate-muted">
                <span className="size-2.5 rounded-full" style={{ background: t.hex }} />
                {t.ad}
              </span>
            );
          })}
          <span className="ml-auto inline-flex items-center gap-1.5 font-medium text-red-700">
            <ShieldAlert className="size-3.5" />
            Sahte tarayıcı = UA yalan söylüyor, JA3 ele veriyor
          </span>
        </div>
      </Panel>
    </Bolum>
  );
}
