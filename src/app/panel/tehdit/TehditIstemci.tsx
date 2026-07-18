"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Globe, ShieldAlert, ShieldCheck, Download, Server, Network,
  ChevronRight, Crosshair, Flame,
} from "lucide-react";
import {
  Badge, Tablo, Ilerleme, DurumRozeti, Tooltip, type Kolon,
} from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { CografyaBar, DonutDagilim, TrendGrafik } from "@/components/panel/grafikler";
import { Histogram, Gauge } from "@/components/panel/grafikler-ek";
import { botSinifGorsel } from "@/components/panel/bot-sinif-gorsel";
import { bayrak } from "@/lib/flag";
import { exportCsv } from "@/lib/csv";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { tehditCeviri } from "./tehdit.i18n";

/* ------------------------------------------------------------------ tipler */
interface Ip {
  id: string;
  ip: string;
  country: string;
  asn: string;
  threatScore: number;
  category: string;
  requests: number;
  blocked: number;
  lastSeen: number;
}
interface Kpi {
  izlenenSaldiran: number;
  kotuUn: number;
  aktifKampanya: number;
  engellenen30g: number;
  ortSkor: number;
  yeniIp7g: number;
  aktif24s: number;
}
interface HaritaUlke {
  kod: string;
  ad: string;
  ipSayi: number;
  istek: number;
  engellenen: number;
  ortSkor: number;
  kotuUn: number;
  isi: number;
}
interface Ag {
  asn: string;
  asNo: string;
  ad: string;
  kategori: "vpn" | "datacenter" | "bulletproof" | "isp" | "temiz";
  ipSayi: number;
  istek: number;
  engellenen: number;
  ulkeSayi: number;
  ortSkor: number;
}
interface Kampanya {
  id: string;
  name: string;
  botClass: string;
  status: string;
  peakRps: number;
  totalRequests: number;
  blockedRequests: number;
  topCountries: string[];
  topAsns: string[];
  startedAt: number;
}

/* ------------------------------------------------------------------ etiketler */
type Cev = (k: string) => string;
/** IP itibar kategorisi → çeviri anahtarı. */
function katEtiket(kat: string, t: Cev): string {
  return t(`th.katEtiket.${kat}`);
}
/** Bot sınıfı → çeviri anahtarı. */
function botEtiket(bot: string, t: Cev): string {
  return t(`th.botEtiket.${bot}`);
}
/** Ağ (ASN) kategorisi → çeviri anahtarı. */
function agEtiket(kategori: Ag["kategori"], t: Cev): string {
  return t(`th.ag.kat.${kategori}`);
}
// Bot sınıf renkleri tek kaynak: botSinifGorsel (krem-tema; koyu/siyah yok).
const BOT_RENK: Record<string, string> = {
  automation: botSinifGorsel("automation").renk, scraper: botSinifGorsel("scraper").renk,
  credential_stuffing: botSinifGorsel("credential_stuffing").renk, ai_agent: botSinifGorsel("ai_agent").renk,
  ddos: botSinifGorsel("ddos").renk, spam: botSinifGorsel("spam").renk,
  good_bot: botSinifGorsel("good_bot").renk, human: botSinifGorsel("human").renk,
};
const KAT_RENK: Record<string, string> = {
  malicious: "#dc2626", suspicious: "#d97706", vpn: "#7c74ff",
  datacenter: "#2f6fed", tor: "#0b0b18", clean: "#16a34a",
};
const AG_TON: Record<Ag["kategori"], "kirmizi" | "sari" | "mavi" | "gri" | "yesil"> = {
  bulletproof: "kirmizi", vpn: "sari", datacenter: "mavi", isp: "gri", temiz: "yesil",
};

// Ülke kodu → kıta/bölge. Bölge dağılımı donutu için kaba ama yeterli eşleme.
const ULKE_BOLGE: Record<string, string> = {
  US: "Kuzey Amerika", CA: "Kuzey Amerika", MX: "Kuzey Amerika",
  BR: "Güney Amerika", AR: "Güney Amerika", CO: "Güney Amerika", CL: "Güney Amerika",
  GB: "Avrupa", DE: "Avrupa", FR: "Avrupa", NL: "Avrupa", RU: "Avrupa", UA: "Avrupa",
  IT: "Avrupa", ES: "Avrupa", PL: "Avrupa", RO: "Avrupa", TR: "Avrupa", SE: "Avrupa",
  CN: "Asya", IN: "Asya", JP: "Asya", KR: "Asya", VN: "Asya", ID: "Asya", SG: "Asya",
  HK: "Asya", TW: "Asya", TH: "Asya", PK: "Asya", IR: "Asya", IL: "Asya",
  ZA: "Afrika", NG: "Afrika", EG: "Afrika", KE: "Afrika", MA: "Afrika",
  AU: "Okyanusya", NZ: "Okyanusya",
};
const BOLGE_RENK: Record<string, string> = {
  Asya: "#dc2626", Avrupa: "#2f6fed", "Kuzey Amerika": "#d97706",
  "Güney Amerika": "#16a34a", Afrika: "#7c74ff", Okyanusya: "#0ea5e9", Diğer: "#8b8fa3",
};

function kisaSayi(n: number): string {
  const a = Math.abs(n);
  if (a >= 1_000_000) return (n / 1_000_000).toFixed(a % 1_000_000 ? 1 : 0) + "M";
  if (a >= 1_000) return (n / 1_000).toFixed(a % 1_000 ? 1 : 0) + "B";
  return String(n);
}

/** Isı skorundan (0..100) krem-uyumlu kırmızı yoğunluk. */
function isiRengi(isi: number): string {
  // Düşük: soluk amber-kırmızı; yüksek: koyu kırmızı.
  const t = Math.max(0, Math.min(100, isi)) / 100;
  // #fbeee6 (soluk) → #dc2626 (koyu kırmızı) arası lineer.
  const lerp = (a: number, b: number) => Math.round(a + (b - a) * t);
  const r = lerp(0xfb, 0xdc);
  const g = lerp(0xee, 0x26);
  const b = lerp(0xe6, 0x26);
  return `rgb(${r}, ${g}, ${b})`;
}
function isiMetinRengi(isi: number): string {
  return isi >= 55 ? "#fff" : "#7a2e12";
}

/* ------------------------------------------------------------------ ana bileşen */
export function TehditIstemci({
  dil, kpi, ips, harita, aglar, kategoriDagilim, botDagilim, cografya, kampanyalar,
  tehditGun, engelGun, gunEtiketleri,
}: {
  dil: Dil;
  kpi: Kpi;
  ips: Ip[];
  harita: HaritaUlke[];
  aglar: Ag[];
  kategoriDagilim: [string, number][];
  botDagilim: [string, number][];
  cografya: { kod: string; ad: string; deger: number }[];
  kampanyalar: Kampanya[];
  tehditGun: number[];
  engelGun: number[];
  gunEtiketleri: string[];
}) {
  const t = (k: string) => tehditCeviri(k, dil);
  const router = useRouter();
  const [kat, setKat] = useState("all");

  const filtreliBase = useMemo(() => {
    if (kat === "all") return ips;
    return ips.filter((r) => r.category === kat);
  }, [ips, kat]);

  /* --- IP itibar tablosu kolonları --- */
  const kolonlar: Kolon<Ip>[] = [
    {
      baslik: t("th.ip.kolon.ip"),
      render: (r) => (
        <span className="inline-flex items-center gap-1.5 num text-[13px] font-medium tracking-tight text-slate-ink">
          <span className="text-[13px] leading-none">{bayrak(r.country)}</span>
          {r.ip}
        </span>
      ),
    },
    { baslik: t("th.ip.kolon.kategori"), render: (r) => <KatBadge kat={r.category} t={t} /> },
    { baslik: t("th.ip.kolon.asn"), render: (r) => <span className="text-[12px] text-slate-muted">{r.asn}</span> },
    {
      baslik: t("th.ip.kolon.tehditSkoru"),
      render: (r) => (
        <div className="flex w-36 items-center gap-2">
          <div className="flex-1">
            <Ilerleme deger={r.threatScore} ton={r.threatScore > 70 ? "danger" : r.threatScore > 40 ? "warn" : "ok"} />
          </div>
          <span
            className={cn(
              "w-8 text-right num text-[13px] font-bold",
              r.threatScore > 70 ? "text-danger2" : r.threatScore > 40 ? "text-warn" : "text-ok",
            )}
          >
            {r.threatScore}
          </span>
        </div>
      ),
    },
    {
      baslik: t("th.ip.kolon.istek"),
      render: (r) => <span className="num text-[13px] font-medium text-slate-muted">{r.requests.toLocaleString("tr-TR")}</span>,
      className: "text-right",
    },
    {
      baslik: t("th.ip.kolon.engellenen"),
      render: (r) => <span className="num text-[13px] font-semibold text-danger2">{r.blocked.toLocaleString("tr-TR")}</span>,
      className: "text-right",
    },
    {
      baslik: t("th.ip.kolon.sonGorulme"),
      render: (r) => <span className="num whitespace-nowrap text-[12px] text-slate-faint">{sureMetni(Date.now() - r.lastSeen, t)}</span>,
      className: "text-right",
    },
  ];

  const botDonut = botDagilim.slice(0, 6).map(([k, v]) => ({ etiket: botEtiket(k, t), deger: v, renk: BOT_RENK[k] || botSinifGorsel(k).renk }));
  const katDonut = kategoriDagilim.map(([k, v]) => ({ etiket: katEtiket(k, t), deger: v, renk: KAT_RENK[k] || "#8b8fa3" }));

  // Bölge (kıta) dağılımı: harita ülkelerini kıtaya toplar → istek hacmine göre donut.
  const bolgeDonut = useMemo(() => {
    const map = new Map<string, number>();
    for (const u of harita) {
      const b = ULKE_BOLGE[u.kod] ?? "Diğer";
      map.set(b, (map.get(b) || 0) + u.istek);
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([etiket, deger]) => ({ etiket, deger, renk: BOLGE_RENK[etiket] || "#8b8fa3" }));
  }, [harita]);

  return (
    /* Google-sadeliği: daha geniş nefes alanı (space-y-10), sakin tipografi,
       gürültüsüz bölüm başlıkları. Hiçbir bölüm/veri eksiltilmedi — yalnızca
       görsel gürültü azaltıldı, hiyerarşi netleştirildi, whitespace artırıldı. */
    <div className="mx-auto w-full max-w-6xl space-y-12 px-6 pt-8 pb-16 lg:px-8">
      {/* ── Başlık ── sade, tek satır, dekorasyonsuz */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-slate-ink">{t("th.baslik")}</h1>
          <p className="mt-1.5 text-[14px] leading-relaxed text-slate-muted">{t("th.aciklama")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" href="/panel/tehdit/kampanyalar">
            <Crosshair className="size-4" /> {t("th.kampanyalar")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              exportCsv(
                "specter-ip-itibar.csv",
                filtreliBase.map((r) => ({ ip: r.ip, ulke: r.country, asn: r.asn, kategori: r.category, tehdit_skoru: r.threatScore, istek: r.requests, engel: r.blocked })),
              )
            }
          >
            <Download className="size-4" /> {t("th.disaAktar")}
          </Button>
        </div>
      </div>

      {/* ── Üst özet KPI ── sade metrik satırı: çizgiyle ayrılmış, ikonsuz, tek vurgu */}
      <SadeKpiSerisi kpi={kpi} t={t} />

      {/* ── En tehlikeli 3 kaynak ── öne çıkan vurgu şeridi (koyu-kırmızı aksan) */}
      <EnTehlikeliUcKaynak ips={ips} t={t} onSec={(ip) => router.push(`/panel/tehdit/${encodeURIComponent(ip)}`)} />

      {/* ── Global tehdit haritası ── ısı gridi + yanında bölge dağılımı donutu */}
      <Bolum
        baslik={t("th.harita.baslik")}
        not={harita[0] ? `${t("th.harita.enRiskli")} ${harita[0].ad} · ${t("th.harita.ulke").replace("{n}", String(harita.length))}` : t("th.harita.ulke").replace("{n}", String(harita.length))}
      >
        <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_260px]">
          <TehditHaritasi harita={harita} t={t} />
          <div className="lg:border-l lg:border-line lg:pl-8">
            <div className="mb-4 text-[13px] font-medium text-slate-muted">{t("th.harita.bolgeBaslik")}</div>
            <DonutDagilim segmentler={bolgeDonut} />
          </div>
        </div>
      </Bolum>

      {/* ── ASN / Ağ istihbaratı ── kategori donutu + gauge + ısı-renkli ağ kartları */}
      <Bolum baslik={t("th.ag.baslik")} not={t("th.ag.sayac").replace("{n}", String(aglar.length))}>
        <AgIstihbarati aglar={aglar} t={t} />
      </Bolum>

      {/* ── Tehdit trendi + kategori dağılımı ── */}
      <Bolum baslik={t("th.trend.baslik")} not={t("th.trend.gunluk")}>
        <div className="grid gap-x-12 gap-y-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TrendGrafik
              noktalar={tehditGun}
              seriler={[tehditGun, engelGun]}
              renkler={["#dc2626", "#d97706"]}
              seriEtiketleri={[t("th.trend.tehditOlayi"), t("th.trend.engellenenIstek")]}
              etiketler={gunEtiketleri}
              yukseklik={220}
            />
          </div>
          <div>
            <div className="mb-4 text-[13px] font-medium text-slate-muted">{t("th.kat.baslik")}</div>
            <DonutDagilim segmentler={katDonut} />
          </div>
        </div>
      </Bolum>

      {/* ── Bot sınıfı dağılımı + saldırı coğrafyası ── */}
      <div className="grid gap-x-12 gap-y-12 lg:grid-cols-2">
        <Bolum baslik={t("th.bot.baslik")}>
          <DonutDagilim segmentler={botDonut} />
        </Bolum>
        <Bolum baslik={t("th.cografya.baslik")}>
          <CografyaBar ulkeler={cografya} />
        </Bolum>
      </div>

      {/* ── Aktif kampanyalar korelasyonu ── */}
      <KampanyaKorelasyon kampanyalar={kampanyalar} t={t} />

      {/* ── IP itibar tablosu ── */}
      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-2.5">
            <h2 className="text-[16px] font-semibold tracking-tight text-slate-ink">{t("th.ip.baslik")}</h2>
            <span className="text-[13px] text-slate-faint">{t("th.ip.kayit").replace("{n}", String(filtreliBase.length))}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {["all", "malicious", "vpn", "datacenter", "suspicious", "clean"].map((k) => (
              <button
                key={k}
                onClick={() => setKat(k)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[13px] font-medium transition",
                  kat === k ? "bg-slate-ink text-white" : "text-slate-muted hover:bg-canvas",
                )}
              >
                {k === "all" ? t("th.ip.filtre.all") : katEtiket(k, t)}
              </button>
            ))}
          </div>
        </div>
        <Tablo
          kolonlar={kolonlar}
          veri={filtreliBase}
          sayfaBoyu={15}
          ara={(r) => `${r.ip} ${r.asn} ${r.country} ${r.category}`}
          araPlaceholder={t("th.ip.araPlaceholder")}
          onSatir={(r) => router.push(`/panel/tehdit/${encodeURIComponent(r.ip)}`)}
          bosMesaj={t("th.ip.bosMesaj")}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Sade bölüm sarmalayıcı
 * Google-sadeliği: her bölüm çerçevesiz/gölgesiz başlar; sadece ince bir başlık
 * satırı + isteğe bağlı sağ-not. Panel kartı yerine düz whitespace-tabanlı ayrım.
 * İçerik (harita/tablo/grafik) olduğu gibi kalır — yalnızca kabuk sadeleşir. */
function Bolum({ baslik, not, children }: { baslik: string; not?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-5 flex items-baseline justify-between gap-3 border-b border-line pb-2.5">
        <h2 className="text-[16px] font-semibold tracking-tight text-slate-ink">{baslik}</h2>
        {not && <span className="shrink-0 text-[12.5px] text-slate-faint">{not}</span>}
      </div>
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ Sade KPI serisi
 * 5 metrik; renkli ikon-kartlar yerine yatay, çizgiyle ayrılmış sakin sayı satırı.
 * Google Analytics üst-metrik şeridi hissi: büyük sayı + küçük etiket, tek vurgu. */
function SadeKpiSerisi({ kpi, t }: { kpi: Kpi; t: Cev }) {
  const ogeler: { deger: string; etiket: string; alt?: string; vurgu?: "danger" | "warn" }[] = [
    { deger: kpi.izlenenSaldiran.toLocaleString("tr-TR"), etiket: t("th.kpi.izlenen"), alt: t("th.kpi.yeni").replace("{n}", String(kpi.yeniIp7g)) },
    { deger: kpi.kotuUn.toLocaleString("tr-TR"), etiket: t("th.kpi.kotuUn"), vurgu: "danger" },
    { deger: String(kpi.aktifKampanya), etiket: t("th.kpi.aktifKampanya"), vurgu: "warn" },
    { deger: kisaSayi(kpi.engellenen30g), etiket: t("th.kpi.engellenen30g"), vurgu: "danger" },
    { deger: String(kpi.ortSkor), etiket: t("th.kpi.ortSkor"), alt: t("th.kpi.aktif24s").replace("{n}", String(kpi.aktif24s)), vurgu: kpi.ortSkor > 60 ? "danger" : kpi.ortSkor > 40 ? "warn" : undefined },
  ];
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-3 lg:grid-cols-5 lg:divide-x lg:divide-line">
      {ogeler.map((o, i) => (
        <div key={i} className={cn(i > 0 && "lg:pl-8")}>
          <div className={cn("num text-[28px] font-semibold leading-none tracking-tight", o.vurgu === "danger" ? "text-danger2" : o.vurgu === "warn" ? "text-warn" : "text-slate-ink")}>
            {o.deger}
          </div>
          <div className="mt-2 text-[13px] text-slate-muted">{o.etiket}</div>
          {o.alt && <div className="mt-0.5 text-[11.5px] text-slate-faint">{o.alt}</div>}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ En tehlikeli 3 kaynak
 * Öne çıkan vurgu şeridi: en yüksek tehdit skorlu 3 IP'yi büyük, tıklanabilir
 * kartlarda gösterir. Koyu-kırmızı aksanlı; büyük skor + hacim barı ile ferah. */
function EnTehlikeliUcKaynak({ ips, t, onSec }: { ips: Ip[]; t: Cev; onSec: (ip: string) => void }) {
  const ilk3 = ips.slice(0, 3);
  if (ilk3.length === 0) return null;
  const enFazlaEngel = Math.max(1, ...ilk3.map((r) => r.blocked));
  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-lg bg-danger-soft text-danger2">
          <Flame className="size-4" />
        </span>
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-slate-ink">{t("th.tehlikeli.baslik")}</h2>
          <p className="text-[12px] text-slate-faint">{t("th.tehlikeli.altbaslik")}</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {ilk3.map((r, i) => (
          <motion.button
            key={r.ip}
            type="button"
            onClick={() => onSec(r.ip)}
            initial={{ y: 8 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="group relative overflow-hidden rounded-3xl border border-line bg-surface p-5 text-left transition hover:border-line-strong hover:shadow-card"
          >
            {/* sıra rozeti */}
            <span className="absolute right-4 top-4 grid size-6 place-items-center rounded-full bg-danger-soft text-[11px] font-bold text-danger2">
              {i + 1}
            </span>
            <div className="flex items-center gap-1.5 text-[15px] font-semibold tracking-tight text-slate-ink num">
              <span className="text-[14px] leading-none">{bayrak(r.country)}</span>
              {r.ip}
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <KatBadge kat={r.category} t={t} />
              <span className="truncate text-[11px] text-slate-faint">{r.asn}</span>
            </div>
            {/* büyük skor */}
            <div className="mt-4 flex items-end justify-between">
              <div>
                <div className="num text-[32px] font-bold leading-none text-danger2">{r.threatScore}</div>
                <div className="mt-1 text-[11px] text-slate-faint">{t("th.tehlikeli.skor")}</div>
              </div>
              <div className="text-right">
                <div className="num text-[15px] font-bold text-slate-ink">{kisaSayi(r.blocked)}</div>
                <div className="mt-1 text-[11px] text-slate-faint">{t("th.tehlikeli.engel")}</div>
              </div>
            </div>
            {/* engel hacmi barı */}
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line/60">
              <motion.div
                className="h-full rounded-full bg-danger2"
                initial={{ width: 0 }}
                animate={{ width: `${(r.blocked / enFazlaEngel) * 100}%` }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ Global tehdit haritası
 * Gerçek SVG dünya haritası yerine güçlü bir "ısı gridi": her ülke bir kart,
 * tehdit ısısına göre renk yoğunluğu, bayrak, hacim barı. Harita hissi verir. */
function TehditHaritasi({ harita, t }: { harita: HaritaUlke[]; t: Cev }) {
  const enFazlaIstek = Math.max(1, ...harita.map((u) => u.istek));
  const toplamKotuUn = harita.reduce((a, u) => a + u.kotuUn, 0);
  const enRiskli = harita[0];

  return (
    <>
      {harita.length === 0 ? (
        <div className="grid h-32 place-items-center text-[13px] text-slate-faint">{t("th.harita.bosVeri")}</div>
      ) : (
        <>
          {/* Isı gridi */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {harita.map((u, i) => (
              <motion.div
                key={u.kod}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, delay: i * 0.02, ease: [0.16, 1, 0.3, 1] }}
              >
                <Tooltip
                  metin={`${u.ad}: ${u.ipSayi} ${t("th.harita.ip")} · ${u.engellenen.toLocaleString("tr-TR")} ${t("th.harita.engel")} · ${t("th.harita.ortSkor")} ${u.ortSkor}`}
                  className="w-full"
                >
                  <div
                    className="w-full overflow-hidden rounded-2xl border border-line px-3 py-2.5 text-left transition hover:border-line-strong"
                    style={{ background: isiRengi(u.isi) }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: isiMetinRengi(u.isi) }}>
                        <span className="text-[15px] leading-none">{bayrak(u.kod)}</span>
                        {u.kod}
                      </span>
                      <span className="num text-[11px] font-bold" style={{ color: isiMetinRengi(u.isi) }}>
                        {u.isi}
                      </span>
                    </div>
                    <div className="mt-1 truncate text-[11px]" style={{ color: isiMetinRengi(u.isi), opacity: 0.85 }}>
                      {u.ad}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10.5px]" style={{ color: isiMetinRengi(u.isi), opacity: 0.9 }}>
                      <span className="num">{u.ipSayi} {t("th.harita.ip")}</span>
                      <span className="num font-semibold">{kisaSayi(u.engellenen)} {t("th.harita.engel")}</span>
                    </div>
                    {/* hacim barı */}
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full" style={{ background: isiMetinRengi(u.isi) === "#fff" ? "rgba(255,255,255,.25)" : "rgba(122,46,18,.18)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(u.istek / enFazlaIstek) * 100}%`, background: isiMetinRengi(u.isi) }}
                      />
                    </div>
                  </div>
                </Tooltip>
              </motion.div>
            ))}
          </div>

          {/* Alt şerit: ısı lejantı + özet */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
            <div className="flex items-center gap-2 text-[12px] text-slate-muted">
              <span>{t("th.harita.isi")}</span>
              <span className="h-2 w-28 rounded-full" style={{ background: `linear-gradient(90deg, ${isiRengi(0)}, ${isiRengi(50)}, ${isiRengi(100)})` }} />
              <span className="text-slate-faint">{t("th.harita.dusukYuksek")}</span>
            </div>
            <div className="flex items-center gap-4 text-[12px]">
              <span className="text-slate-muted">
                {t("th.harita.toplamKotuUn")} <b className="num text-danger2">{toplamKotuUn}</b>
              </span>
            </div>
          </div>
        </>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ ASN / ağ istihbaratı
 * Tablo yerine üç farklı görsel dil bir arada: (1) ağ-türü kategori donutu,
 * (2) ortalama ağ-tehdidi gauge'i, (3) ısı-renkli ağ kartları gridi. Böylece
 * yatay-bar tekrarı kırılır; hacim + itibar + skor tek bakışta okunur. */
const AG_IKON: Record<Ag["kategori"], typeof Server> = {
  bulletproof: ShieldAlert, vpn: Network, datacenter: Server, isp: Globe, temiz: ShieldCheck,
};
const AG_CIP: Record<Ag["kategori"], string> = {
  bulletproof: "bg-danger-soft text-danger2 ring-red-200",
  vpn: "bg-warn-soft text-warn ring-amber-200",
  datacenter: "bg-brand-50 text-brand-600 ring-brand-100",
  isp: "bg-slate-100 text-slate-500 ring-slate-200",
  temiz: "bg-ok-soft text-ok ring-green-200",
};
const AG_KAT_RENK: Record<Ag["kategori"], string> = {
  bulletproof: "#dc2626", vpn: "#d97706", datacenter: "#2f6fed", isp: "#8b8fa3", temiz: "#16a34a",
};
const AG_SIRA: Ag["kategori"][] = ["bulletproof", "vpn", "datacenter", "isp", "temiz"];

function AgIstihbarati({ aglar, t }: { aglar: Ag[]; t: Cev }) {
  const gorunen = aglar.slice(0, 9);

  // Kategori dağılımı (IP sayısına göre) + ortalama ağ skoru (ağırlıklı).
  const { katDonut, ortSkor } = useMemo(() => {
    const kmap = new Map<Ag["kategori"], number>();
    let skorTop = 0, agirlik = 0;
    for (const a of aglar) {
      kmap.set(a.kategori, (kmap.get(a.kategori) || 0) + a.ipSayi);
      skorTop += a.ortSkor * a.ipSayi;
      agirlik += a.ipSayi;
    }
    const donut = AG_SIRA
      .filter((k) => (kmap.get(k) || 0) > 0)
      .map((k) => ({ etiket: agEtiket(k, t), deger: kmap.get(k) || 0, renk: AG_KAT_RENK[k] }));
    return { katDonut: donut, ortSkor: agirlik ? Math.round(skorTop / agirlik) : 0 };
  }, [aglar, t]);

  if (gorunen.length === 0) {
    return <div className="grid h-32 place-items-center text-[13px] text-slate-faint">{t("th.ag.bosVeri")}</div>;
  }

  const enFazlaEngel = Math.max(1, ...gorunen.map((a) => a.engellenen));

  return (
    <div className="space-y-8">
      {/* Üst: kategori donutu + ortalama skor gauge'i (iki farklı görsel) */}
      <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div>
          <div className="mb-4 text-[13px] font-medium text-slate-muted">{t("th.ag.dagilimBaslik")}</div>
          <DonutDagilim segmentler={katDonut} />
        </div>
        <div className="grid place-items-center lg:border-l lg:border-line lg:pl-8">
          <div className="text-center">
            <div className="mb-2 text-[13px] font-medium text-slate-muted">{t("th.ag.ortSkorBaslik")}</div>
            <Gauge deger={ortSkor} etiket={t("th.ag.ortSkor")} boyut={168} />
          </div>
        </div>
      </div>

      {/* Alt: en riskli ağ kartları — ısı-renkli sol şerit + hacim barı */}
      <div>
        <div className="mb-4 border-b border-line pb-2.5 text-[13px] font-medium text-slate-muted">{t("th.ag.enKotuBaslik")}</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {gorunen.map((a, i) => {
            const AgIkon = AG_IKON[a.kategori];
            const oran = Math.round((a.engellenen / Math.max(1, a.istek)) * 100);
            const skorRenk = a.ortSkor > 70 ? "text-danger2" : a.ortSkor > 40 ? "text-warn" : "text-ok";
            return (
              <motion.div
                key={a.asn}
                initial={{ y: 6 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.02, ease: [0.16, 1, 0.3, 1] }}
                className="relative overflow-hidden rounded-2xl border border-line bg-surface p-4 transition hover:border-line-strong hover:shadow-card"
              >
                {/* ısı-renkli sol şerit: skora göre renk */}
                <span
                  className="absolute inset-y-0 left-0 w-1"
                  style={{ background: isiRengi(a.ortSkor) }}
                />
                <div className="flex items-start gap-2.5 pl-1.5">
                  <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg ring-1 ring-inset", AG_CIP[a.kategori])}>
                    <AgIkon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-semibold text-slate-ink">{a.ad}</div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-faint">
                      <span className="num">{a.asNo}</span>
                      <span>·</span>
                      <span>{t("th.ag.ulke").replace("{n}", String(a.ulkeSayi))}</span>
                    </div>
                  </div>
                  <span className={cn("num shrink-0 text-[18px] font-bold leading-none", skorRenk)}>{a.ortSkor}</span>
                </div>

                <div className="mt-3 flex items-center gap-1.5 pl-1.5">
                  <Badge ton={AG_TON[a.kategori]}><AgIkon className="size-3" /> {agEtiket(a.kategori, t)}</Badge>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 pl-1.5 text-[11.5px]">
                  <div>
                    <div className="num text-[14px] font-bold text-slate-ink">{kisaSayi(a.ipSayi)}</div>
                    <div className="text-slate-faint">{t("th.ag.ip")}</div>
                  </div>
                  <div className="text-right">
                    <div className="num text-[14px] font-bold text-slate-ink">{kisaSayi(a.istek)}</div>
                    <div className="text-slate-faint">{t("th.ag.istek")}</div>
                  </div>
                </div>

                {/* engel oranı barı */}
                <div className="mt-3 pl-1.5">
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className="num font-semibold text-danger2">{kisaSayi(a.engellenen)}</span>
                    <span className="num text-slate-faint">%{oran}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-line/60">
                    <motion.div
                      className="h-full rounded-full bg-danger2"
                      initial={{ width: 0 }}
                      animate={{ width: `${(a.engellenen / enFazlaEngel) * 100}%` }}
                      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ etiket, deger, ton }: { etiket: string; deger: string; ton?: "danger" }) {
  return (
    <div>
      <div className={cn("num text-[15px] font-bold", ton === "danger" ? "text-danger2" : "text-slate-ink")}>{deger}</div>
      <div className="text-[11px] text-slate-faint">{etiket}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ Kampanya korelasyonu
 * Şiddet histogramı (dikey barlar — bölüm için farklı görsel dil) + kampanya
 * kartları. Şiddet, kampanyanın zirve-RPS + toplam istek hacminden türetilir. */
const SIDDET_SIRA = ["dusuk", "orta", "yuksek", "kritik"] as const;
function kampanyaSiddet(c: Kampanya): (typeof SIDDET_SIRA)[number] {
  // Zirve RPS ölçekli kaba şiddet: >2000 kritik, >800 yüksek, >200 orta, altı düşük.
  const rps = c.peakRps;
  if (rps >= 2000) return "kritik";
  if (rps >= 800) return "yuksek";
  if (rps >= 200) return "orta";
  return "dusuk";
}
function KampanyaKorelasyon({ kampanyalar, t }: { kampanyalar: Kampanya[]; t: Cev }) {
  if (kampanyalar.length === 0) return null;

  const siddetKovalar = SIDDET_SIRA.map((s) => ({
    etiket: t(`th.kamp.siddet.${s}`),
    deger: kampanyalar.filter((c) => kampanyaSiddet(c) === s).length,
    ton: (s === "kritik" || s === "yuksek" ? "bot" : s === "dusuk" ? "insan" : "nötr") as "bot" | "insan" | "nötr",
  }));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-slate-ink">{t("th.kamp.baslik")}</h2>
        <Link href="/panel/tehdit/kampanyalar" className="inline-flex items-center gap-1 text-[13px] text-brand-700 transition hover:text-brand-800">
          {t("th.kamp.tumu")} <ChevronRight className="size-3.5" />
        </Link>
      </div>

      {/* Şiddet dağılımı — dikey histogram (bölüme özgü görsel dil) */}
      <div className="mb-5 rounded-2xl border border-line bg-surface px-5 py-4">
        <div className="mb-3 text-[13px] font-medium text-slate-muted">{t("th.kamp.siddetBaslik")}</div>
        <Histogram kovalar={siddetKovalar} yukseklik={72} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {kampanyalar.map((c) => {
          const oran = c.totalRequests ? (c.blockedRequests / c.totalRequests) * 100 : 0;
          return (
            <Link
              key={c.id}
              href={`/panel/tehdit/kampanyalar/${c.id}`}
              className="group block rounded-3xl border border-line bg-surface p-5 transition hover:border-line-strong hover:bg-canvas/40"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[15px] font-semibold text-slate-ink group-hover:text-brand-700">
                    <span className="truncate">{c.name}</span>
                    <ChevronRight className="size-4 shrink-0 text-slate-faint transition group-hover:translate-x-0.5" />
                  </div>
                  <div className="mt-1">
                    <Badge ton="gri">{botEtiket(c.botClass, t)}</Badge>
                  </div>
                </div>
                <DurumRozeti
                  ton={c.status === "active" ? "danger" : c.status === "monitoring" ? "warn" : "ok"}
                  etiket={c.status === "active" ? t("th.kamp.durum.active") : c.status === "monitoring" ? t("th.kamp.durum.monitoring") : t("th.kamp.durum.stopped")}
                  nabiz={c.status === "active"}
                />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <MiniStat etiket={t("th.kamp.toplam")} deger={kisaSayi(c.totalRequests)} />
                <MiniStat etiket={t("th.kamp.engellenen")} deger={kisaSayi(c.blockedRequests)} ton="danger" />
                <MiniStat etiket={t("th.kamp.zirveRps")} deger={kisaSayi(c.peakRps)} />
              </div>

              <div className="mt-4">
                <div className="mb-1.5 flex justify-between text-[12px]">
                  <span className="text-slate-muted">{t("th.kamp.azaltmaOrani")}</span>
                  <span className="num font-semibold text-slate-ink">%{oran.toFixed(1)}</span>
                </div>
                <Ilerleme deger={oran} ton={oran > 90 ? "ok" : "warn"} />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
                {c.topCountries.slice(0, 3).map((k, i) => (
                  <span key={`${k}-${i}`} className="inline-flex items-center gap-1 rounded bg-canvas px-1.5 py-0.5 text-[11px] font-medium text-slate-muted">
                    <span className="leading-none">{bayrak(k)}</span> {k}
                  </span>
                ))}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ yardımcılar */
function KatBadge({ kat, t }: { kat: string; t: Cev }) {
  const ton = kat === "malicious" ? "kirmizi" : kat === "suspicious" || kat === "vpn" ? "sari" : kat === "datacenter" ? "mavi" : kat === "clean" ? "yesil" : "gri";
  return <Badge ton={ton as "kirmizi" | "sari" | "mavi" | "gri" | "yesil"}>{katEtiket(kat, t)}</Badge>;
}

function sureMetni(ms: number, t: Cev): string {
  const g = Math.floor(ms / 86400000);
  if (g > 0) return t("th.sure.gun").replace("{n}", String(g));
  const s = Math.floor(ms / 3600000);
  if (s > 0) return t("th.sure.saat").replace("{n}", String(s));
  const d = Math.floor(ms / 60000);
  return t("th.sure.dk").replace("{n}", String(Math.max(1, d)));
}
