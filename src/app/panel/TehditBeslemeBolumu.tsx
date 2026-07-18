"use client";

/**
 * Specter — Global Tehdit Beslemesi (Threat Intelligence Feed)
 * ============================================================
 * Bilinen kötü niyetli altyapının güncel kataloğu: Tor çıkış düğümleri,
 * bulletproof/abuse ASN'leri, aktif botnet C2, VPN/proxy, veri merkezi
 * aralıkları, internet tarayıcıları, spam kaynakları. Gerçek üründe
 * Spamhaus/AbuseIPDB/Tor Project/FireHOL'den periyodik senkronlanır. Specter
 * gözlemlenen her IP/ASN'i bu beslemelerle eşleştirir ve bilinen tehdit
 * altyapısından geleni anında öne çıkarır — verify/challenge kararı için.
 *
 * HİÇBİR sayı uydurma değildir — hepsi `threat-feed` motorundan (BESLEMELER,
 * beslemeOzeti, tehditBeslemeEslestir) türetilir; SERVER'da gözlemlenen IP'ler
 * beslemelerle eşleştirilip buraya hazır prop gelir.
 *
 * GÖRSEL DİL: "istihbarat kataloğu" — kaynak dağılımı DONUT + IOC-türü HISTOGRAM
 * + güncellik GAUGE + eşleşme ISI-RENKLİ kartlar (monoton yatay-bar tekrarı
 * kırıldı). framer-motion rise (azHareket → sade). whileInView / opacity-fade YOK.
 */

import { motion } from "framer-motion";
import {
  Radio,
  Database,
  Globe,
  Server,
  ShieldAlert,
  ShieldCheck,
  Network,
  ScanLine,
  Skull,
  Cloud,
  Mail,
  EyeOff,
  RefreshCw,
  Layers,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Panel, Badge, Ulke } from "@/components/panel/kit";
import { DonutDagilim } from "@/components/panel/grafikler";
import { Histogram, Gauge } from "@/components/panel/grafikler-ek";
import type { BeslemeKaydi, BeslemeKaynak } from "@/lib/specter/threat-feed";

/* ================================================================== Tipler */

/** Gözlemlenen IP'nin bir tehdit beslemesiyle eşleşmesi (server'da hesaplanır). */
export interface BeslemeVurus {
  ip: string;
  country: string;
  asn: string;
  kaynak: BeslemeKaynak;
  kaynakAd: string;
  guven: number;
  olaySayisi: number;
}

/** Server'da toplanan besleme özeti. */
export interface BeslemeGoster {
  toplamKayit: number;
  aktifBesleme: number;
  enGuncelGun: number;
  /** Gözlemlenen benzersiz IP sayısı. */
  gozlemlenenIp: number;
  /** Beslemede bulunan benzersiz IP sayısı. */
  eslesenIp: number;
  /** Katalog (kaynak dağılımı için). */
  beslemeler: BeslemeKaydi[];
  /** Gözlemlenen IP eşleşmeleri (öne çıkanlar). */
  vuruslar: BeslemeVurus[];
}

/* ================================================================== Sabitler */

/** Besleme kaynağı → TR ad + ikon + renk (hex). */
const KAYNAK_TANIM: Record<BeslemeKaynak, { ad: string; ikon: React.ElementType; hex: string; soft: string }> = {
  tor:         { ad: "Tor çıkış düğümü",           ikon: EyeOff,      hex: "#7c3aed", soft: "#f1ebfe" },
  bulletproof: { ad: "Kurşun-geçirmez barındırma", ikon: Skull,       hex: "#dc2626", soft: "#fdeaea" },
  botnet:      { ad: "Botnet C2",                  ikon: Network,     hex: "#ea580c", soft: "#fdeee3" },
  vpn:         { ad: "VPN / Proxy",                ikon: ShieldAlert, hex: "#0891b2", soft: "#e2f5f9" },
  datacenter:  { ad: "Veri merkezi",               ikon: Cloud,       hex: "#2f6fed", soft: "#eaf1fe" },
  scanner:     { ad: "İnternet tarayıcısı",        ikon: ScanLine,    hex: "#d97706", soft: "#fdf1e3" },
  spam:        { ad: "Spam kaynağı",               ikon: Mail,        hex: "#b45309", soft: "#fbf3da" },
};

/* ================================================================== Yardımcılar */

function sayi(n: number): string {
  return (Number.isFinite(n) ? n : 0).toLocaleString("tr-TR");
}

/** Büyük sayı kısa biçim (histogram etiketleri için). */
function kisaSayi(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0)}Mn`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 ? 1 : 0)}B`;
  return String(n);
}

function guncelEtiket(gun: number): string {
  if (gun <= 0) return "bugün";
  if (gun === 1) return "1 gün önce";
  return `${gun} gün önce`;
}

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

/* ================================================================== Ferah KPI */

/** Büyük, ferah üst-özet KPI kartı — sol renkli ikon çipi + iri sayı. */
function KpiKart({
  ikon: Ikon,
  etiket,
  deger,
  ek,
  hex,
  soft,
}: {
  ikon: React.ElementType;
  etiket: string;
  deger: string;
  ek?: string;
  hex: string;
  soft: string;
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface px-4 py-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl" style={{ background: soft, color: hex }}>
        <Ikon className="size-[22px]" />
      </span>
      <div className="min-w-0">
        <div className="text-[11px] font-medium uppercase tracking-wide text-slate-faint">{etiket}</div>
        <div className="mt-0.5 flex items-baseline gap-1.5">
          <span className="text-[26px] font-bold leading-none num text-slate-ink">{deger}</span>
          {ek && <span className="truncate text-[12px] text-slate-faint">{ek}</span>}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== Isı-renkli vuruş kartı */

/**
 * Bir besleme vuruşunu güven değerine göre ısı-renkli kart olarak gösterir —
 * yatay-bar yerine kompakt, renk-yoğunluklu görsel dil.
 */
function VurusKart({ vurus }: { vurus: BeslemeVurus }) {
  const tanim = KAYNAK_TANIM[vurus.kaynak];
  const Ikon = tanim.ikon;
  const guvenYuzde = Math.round(vurus.guven * 100);
  // Güven → zemin yoğunluğu (ısı). 0x14..0x2e hex alfa aralığı.
  const alfa = Math.round(16 + vurus.guven * 26)
    .toString(16)
    .padStart(2, "0");
  return (
    <div
      className="relative flex flex-col gap-2 overflow-hidden rounded-2xl border p-3.5"
      style={{ borderColor: `${tanim.hex}40`, background: `${tanim.hex}${alfa}` }}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className="grid size-8 shrink-0 place-items-center rounded-lg ring-1 ring-inset"
          style={{ background: tanim.soft, color: tanim.hex, borderColor: `${tanim.hex}33` }}
        >
          <Ikon className="size-4" />
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums text-white"
          style={{ background: tanim.hex }}
        >
          %{guvenYuzde}
        </span>
      </div>
      <div className="min-w-0">
        <p className="truncate font-mono text-[12.5px] font-semibold text-slate-ink">{vurus.ip}</p>
        <p className="mt-0.5 text-[11px] font-medium" style={{ color: tanim.hex }}>
          {tanim.ad}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t pt-2 text-[11px]" style={{ borderColor: `${tanim.hex}22` }}>
        <Ulke kod={vurus.country} />
        <span className="min-w-0 flex-1 truncate text-slate-muted" title={vurus.asn}>
          {vurus.asn || "—"}
        </span>
        <span className="shrink-0 tabular-nums text-slate-faint">{sayi(vurus.olaySayisi)} olay</span>
      </div>
    </div>
  );
}

/* ================================================================== Ana bileşen */

export function TehditBeslemeBolumu({
  besleme,
  azHareket,
}: {
  besleme: BeslemeGoster;
  azHareket: boolean;
}) {
  const { beslemeler, vuruslar } = besleme;
  const siraliBeslemeler = [...beslemeler].sort((a, b) => b.kayitSayisi - a.kayitSayisi);
  const gosterVurus = vuruslar.slice(0, 6);
  const tehditVar = besleme.eslesenIp > 0;

  // Kaynak dağılımı donutu — her beslemenin kayıt payı.
  const kaynakSegmentleri = siraliBeslemeler
    .map((b) => ({
      etiket: KAYNAK_TANIM[b.kaynak].ad,
      deger: b.kayitSayisi,
      renk: KAYNAK_TANIM[b.kaynak].hex,
    }))
    .filter((s) => s.deger > 0);

  // IOC-türü histogramı — kaynak başına kayıt sayısı (log-ölçek: aralık çok geniş).
  const histKovalar = siraliBeslemeler.map((b) => ({
    etiket: kisaSayi(b.kayitSayisi),
    // log-ölçek görsel yükseklik: ham değerler 312..88240, lineer ezilir.
    deger: Math.round(Math.log10(b.kayitSayisi + 1) * 100),
  }));

  // Güncellik Gauge — en güncel gün → tazelik yüzdesi (0 gün = %100, 7+ gün = düşer).
  const tazelik = Math.max(0, Math.min(100, Math.round(100 - besleme.enGuncelGun * 14)));
  // Ortalama besleme güveni (Gauge).
  const ortGuven = beslemeler.length
    ? Math.round((beslemeler.reduce((a, b) => a + b.guven, 0) / beslemeler.length) * 100)
    : 0;

  return (
    <Bolum azHareket={azHareket}>
      <Panel
        baslik={<BaslikIkon ikon={Radio} metin="Global Tehdit Beslemesi" />}
        sagUst={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[12px] text-slate-faint">
              <RefreshCw className="size-3" />
              {guncelEtiket(besleme.enGuncelGun)}
            </span>
            <Badge ton={tehditVar ? "kirmizi" : "brand"}>
              <Database className="size-3" />
              Threat Feed
            </Badge>
          </div>
        }
      >
        {/* Açıklama — kilit fikir */}
        <p className="-mt-1 mb-4 max-w-2xl text-[13px] leading-relaxed text-slate-muted">
          <span className="font-medium text-slate-ink">Bilinen kötü altyapının güncel kataloğu.</span>{" "}
          Tor çıkış düğümleri, aktif botnet C2, kurşun-geçirmez ASN'ler, VPN/proxy ve tarayıcı kaynakları
          Spamhaus/AbuseIPDB/Tor Project'ten senkronlanır. Veylify gözlemlenen her IP'yi bu beslemelerle
          eşleştirir — <span className="font-medium text-danger2">tanınan tehdit → anında yüksek zorluk/engel</span>.
        </p>

        {/* Ferah üst-özet KPI'ları */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiKart ikon={Database} etiket="Toplam kayıt" deger={sayi(besleme.toplamKayit)} ek="IP/ASN" hex="#2f6fed" soft="#eaf1fe" />
          <KpiKart ikon={Radio} etiket="Aktif besleme" deger={sayi(besleme.aktifBesleme)} ek="kaynak" hex="#7c3aed" soft="#f1ebfe" />
          <KpiKart ikon={Server} etiket="Gözlemlenen IP" deger={sayi(besleme.gozlemlenenIp)} hex="#0891b2" soft="#e2f5f9" />
          <KpiKart
            ikon={ShieldAlert}
            etiket="Beslemede eşleşen"
            deger={sayi(besleme.eslesenIp)}
            ek="IP"
            hex={tehditVar ? "#dc2626" : "#16a34a"}
            soft={tehditVar ? "#fdeaea" : "#e7f6ec"}
          />
        </div>

        {/* GÖRSEL PANEL: kaynak donut + IOC histogram + güncellik/güven gauge */}
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {/* Kaynak dağılımı donut */}
          <div className="rounded-2xl border border-line bg-canvas/40 p-4">
            <div className="mb-3 flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">
              <Database className="size-3" />
              Kaynak dağılımı — kayıt payı
            </div>
            {kaynakSegmentleri.length > 0 ? (
              <DonutDagilim segmentler={kaynakSegmentleri} />
            ) : (
              <p className="py-6 text-center text-[12px] text-slate-faint">Kaynak verisi yok</p>
            )}
          </div>

          {/* IOC türü histogramı */}
          <div className="rounded-2xl border border-line bg-canvas/40 p-4">
            <div className="mb-3 flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">
              <Layers className="size-3" />
              IOC hacmi — besleme başına (log ölçek)
            </div>
            {histKovalar.length > 0 ? (
              <Histogram kovalar={histKovalar} yukseklik={132} renk="#2f6fed" />
            ) : (
              <p className="py-6 text-center text-[12px] text-slate-faint">Veri yok</p>
            )}
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-faint">
              {siraliBeslemeler.map((b) => (
                <span key={b.kaynak} className="inline-flex items-center gap-1">
                  <span className="size-2 rounded-full" style={{ background: KAYNAK_TANIM[b.kaynak].hex }} />
                  {KAYNAK_TANIM[b.kaynak].ad}
                </span>
              ))}
            </div>
          </div>

          {/* Güncellik + güven gauge ikilisi */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            <div className="flex flex-col items-center rounded-2xl border border-line bg-canvas/40 p-4">
              <span className="mb-1 flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">
                <Clock className="size-3" />
                Besleme tazeliği
              </span>
              <Gauge deger={tazelik} etiket={guncelEtiket(besleme.enGuncelGun)} boyut={132} renk="#16a34a" />
              <p className="mt-1 text-center text-[11px] leading-snug text-slate-muted">
                En güncel besleme {guncelEtiket(besleme.enGuncelGun)} senkronlandı.
              </p>
            </div>
            <div className="flex flex-col items-center rounded-2xl border border-line bg-canvas/40 p-4">
              <span className="mb-1 flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">
                <ShieldCheck className="size-3" />
                Ortalama güven
              </span>
              <Gauge deger={ortGuven} etiket="kaynak güveni" boyut={132} renk="#2f6fed" />
              <p className="mt-1 text-center text-[11px] leading-snug text-slate-muted">
                Kaynakların ortalama kesinlik derecesi.
              </p>
            </div>
          </div>
        </div>

        {/* Gözlemlenen IP eşleşmeleri — ISI-RENKLİ kartlar */}
        {gosterVurus.length > 0 ? (
          <div className="mt-4">
            <div className="mb-2 flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">
              <ShieldAlert className="size-3" />
              Beslemede bulunan gözlemlenen IP'ler — güven ısı-haritası
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              {gosterVurus.map((v) => (
                <VurusKart key={v.ip} vurus={v} />
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-4 grid place-items-center rounded-2xl border border-dashed border-line py-10 text-center">
            <ShieldCheck className="mb-2 size-7 text-ok" />
            <p className="text-[13px] font-medium text-slate-muted">Gözlemlenen IP'ler tehdit beslemesinde değil</p>
            <p className="mt-0.5 text-[12px] text-slate-faint">
              Bilinen kötü altyapıdan bir IP geldiğinde burada anında öne çıkar.
            </p>
          </div>
        )}

        {/* Kaynak lejantı */}
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4 text-[11px] text-slate-faint">
          <span className="font-medium uppercase tracking-wide">Kaynaklar:</span>
          {(Object.keys(KAYNAK_TANIM) as BeslemeKaynak[]).map((k) => {
            const tan = KAYNAK_TANIM[k];
            return (
              <span key={k} className="inline-flex items-center gap-1.5 text-slate-muted">
                <span className="size-2.5 rounded-full" style={{ background: tan.hex }} />
                {tan.ad}
              </span>
            );
          })}
          <span className="ml-auto inline-flex items-center gap-1.5 font-medium text-brand-700">
            <Globe className="size-3.5" />
            Karar için en yüksek güvenli kaynak kullanılır
          </span>
        </div>
      </Panel>
    </Bolum>
  );
}
