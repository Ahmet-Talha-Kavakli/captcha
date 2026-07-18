"use client";

/**
 * Raporlar & Dışa Aktarma Merkezi — istemci
 * ==========================================
 * Cloudflare/Datadog seviyesi merkezi rapor sistemi:
 *  - Üst özet (StatKart)
 *  - Rapor şablonları galerisi (6 hazır tür, Oluştur + Zamanla)
 *  - Rapor oluşturucu (builder) modalı — gerçek veriden CSV/JSON/PDF üretir ve indirir
 *  - Zamanlanmış raporlar (liste + ekle/duraklat/sil — DB'de kalıcı)
 *  - Rapor geçmişi (yeniden indir)
 *  - Canlı önizleme (seçilen türe göre gerçek metrikler + mini grafikler)
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FileText, Download, Calendar, Clock, Mail, BarChart3, FileBarChart,
  ShieldCheck, Bot, Sparkles, Play, Pause, Trash2, Plus, Filter, Send, Repeat,
} from "lucide-react";
import {
  Panel, StatKart, Badge, DurumRozeti, Modal, Alan, Girdi, Secim, Tablo,
  useToast, BosDurum, Tooltip, type Kolon,
} from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { TrendGrafik, DonutDagilim, CografyaBar } from "@/components/panel/grafikler";
import { Histogram, Gauge as GaugeGost } from "@/components/panel/grafikler-ek";
import { botSinifGorsel } from "@/components/panel/bot-sinif-gorsel";
import { exportCsv } from "@/lib/csv";
import { bayrak } from "@/lib/flag";
import { cn } from "@/lib/cn";
import type { ReportType, ReportFormat, ReportFrequency } from "@/lib/db/schema";
import type { Dil } from "@/lib/i18n/panel";
import { raporlarCeviri } from "./raporlar.i18n";

/** Bu modülde her yerde kullanılan çeviri imzası. */
type Ceviri = (anahtar: string) => string;

/* ------------------------------------------------------------------ tipler */
export interface SiteDTO {
  id: string;
  name: string;
  mode: "monitor" | "challenge" | "block";
}
export interface GunDTO {
  gun: string;
  issued: number;
  verified: number;
  blocked: number;
  challenged: number;
}
export interface RaporVeriDTO {
  siteler: SiteDTO[];
  gunler: GunDTO[];
  sinifSayac: Record<string, number>;
  ulkeler: { kod: string; deger: number }[];
  aiAileler: { ad: string; deger: number }[];
  aiOlaySayisi: number;
  kampanyalar: {
    id: string;
    name: string;
    botClass: string;
    status: string;
    siteName: string;
    totalRequests: number;
    blockedRequests: number;
    peakRps: number;
    startedAt: number;
  }[];
  kullanimToplam: { issued: number; verified: number; blocked: number; challenged: number };
  kotuIpSayisi: number;
  ipToplam: number;
  uyariAcik: number;
  uyariCozulen: number;
  uyariToplam: number;
  ortMttrSaat: number;
  denetimToplam: number;
  denetimKritik: number;
}
export interface ZamanRaporDTO {
  id: string;
  type: ReportType;
  name: string;
  frequency: ReportFrequency;
  format: ReportFormat;
  recipients: string[];
  siteName: string | null;
  active: boolean;
  createdAt: number;
  nextRunAt: number;
  lastRunAt: number | null;
}
export interface GecmisDTO {
  id: string;
  type: ReportType;
  name: string;
  periodDays: number;
  format: ReportFormat;
  sizeBytes: number;
  createdBy: string;
  createdAt: number;
  scheduled: boolean;
}

/* ------------------------------------------------------------------ sabitler */

interface Sablon {
  type: ReportType;
  /** ad/aciklama i18n anahtarları (etiketler t() ile çözülür). */
  adKey: string;
  aciklamaKey: string;
  ikon: React.ReactNode;
  renk: string;
  /** metrik etiketleri i18n anahtarları. */
  metrikKeys: string[];
  /** Oluşturucuda seçilebilecek bölümler (checkbox anahtarları = logic + etiket i18n anahtarı). */
  bolumler: { anahtar: string; etiketKey: string }[];
}

const SABLONLAR: Sablon[] = [
  {
    type: "haftalik_ozet",
    adKey: "rap.tur.haftalik_ozet.ad",
    aciklamaKey: "rap.tur.haftalik_ozet.aciklama",
    ikon: <ShieldCheck className="size-5" />,
    renk: "#2f6fed",
    metrikKeys: ["rap.metrik.toplamIstek", "rap.metrik.engelOran", "rap.metrik.insanBotDagilim", "rap.metrik.acikOlay"],
    bolumler: [
      { anahtar: "ozet", etiketKey: "rap.bolum.ozet" },
      { anahtar: "trafik", etiketKey: "rap.bolum.trafik" },
      { anahtar: "olaylar", etiketKey: "rap.bolum.olaylar" },
      { anahtar: "cografya", etiketKey: "rap.bolum.cografya" },
    ],
  },
  {
    type: "aylik_tehdit",
    adKey: "rap.tur.aylik_tehdit.ad",
    aciklamaKey: "rap.tur.aylik_tehdit.aciklama",
    ikon: <FileBarChart className="size-5" />,
    renk: "#dc2626",
    metrikKeys: ["rap.metrik.tehditSkor", "rap.metrik.kotuIp", "rap.metrik.saldiriTur", "rap.metrik.aktifKampanya"],
    bolumler: [
      { anahtar: "ozet", etiketKey: "rap.bolum.tehditOzet" },
      { anahtar: "ip", etiketKey: "rap.bolum.ip" },
      { anahtar: "sinif", etiketKey: "rap.bolum.sinif" },
      { anahtar: "kampanya", etiketKey: "rap.bolum.kampanya" },
    ],
  },
  {
    type: "ai_ajan",
    adKey: "rap.tur.ai_ajan.ad",
    aciklamaKey: "rap.tur.ai_ajan.aciklama",
    ikon: <Bot className="size-5" />,
    renk: "#8b5cf6",
    metrikKeys: ["rap.metrik.aiHacim", "rap.metrik.ajanDagilim", "rap.metrik.hedefYol", "rap.metrik.politikaOzet"],
    bolumler: [
      { anahtar: "ozet", etiketKey: "rap.bolum.aiOzet" },
      { anahtar: "ajan", etiketKey: "rap.bolum.ajan" },
      { anahtar: "trend", etiketKey: "rap.bolum.trend" },
    ],
  },
  {
    type: "bot_trafik",
    adKey: "rap.tur.bot_trafik.ad",
    aciklamaKey: "rap.tur.bot_trafik.aciklama",
    ikon: <BarChart3 className="size-5" />,
    renk: "#0891b2",
    metrikKeys: ["rap.metrik.insanBotOran", "rap.metrik.kararDagilim", "rap.metrik.gunlukHacim", "rap.metrik.istekZirve"],
    bolumler: [
      { anahtar: "ozet", etiketKey: "rap.bolum.trafikOzet" },
      { anahtar: "trend", etiketKey: "rap.bolum.gunlukTrend" },
      { anahtar: "karar", etiketKey: "rap.bolum.karar" },
      { anahtar: "cografya", etiketKey: "rap.bolum.cografya" },
    ],
  },
  {
    type: "uyum_denetim",
    adKey: "rap.tur.uyum_denetim.ad",
    aciklamaKey: "rap.tur.uyum_denetim.aciklama",
    ikon: <FileText className="size-5" />,
    renk: "#16a34a",
    metrikKeys: ["rap.metrik.denetimSayi", "rap.metrik.kritikIslem", "rap.metrik.olayMttr", "rap.metrik.cozumOran"],
    bolumler: [
      { anahtar: "ozet", etiketKey: "rap.bolum.uyumOzet" },
      { anahtar: "denetim", etiketKey: "rap.bolum.denetim" },
      { anahtar: "olay", etiketKey: "rap.bolum.olay" },
    ],
  },
  {
    type: "kampanya_analiz",
    adKey: "rap.tur.kampanya_analiz.ad",
    aciklamaKey: "rap.tur.kampanya_analiz.aciklama",
    ikon: <Sparkles className="size-5" />,
    renk: "#d97706",
    metrikKeys: ["rap.metrik.toplamIstek", "rap.metrik.engelOran", "rap.metrik.zirveRps", "rap.metrik.kaynakUlkeAsn"],
    bolumler: [
      { anahtar: "ozet", etiketKey: "rap.bolum.kampanyaOzet" },
      { anahtar: "kampanya", etiketKey: "rap.bolum.kampanyaTablo" },
      { anahtar: "cografya", etiketKey: "rap.bolum.cografyaKaynak" },
    ],
  },
];

const SABLON_HARITA: Record<ReportType, Sablon> = Object.fromEntries(
  SABLONLAR.map((s) => [s.type, s]),
) as Record<ReportType, Sablon>;

// Format adları (marka/biçim adı) — çevrilmez.
const FORMAT_ETIKET: Record<ReportFormat, string> = { pdf: "PDF", csv: "CSV", json: "JSON" };
// Sıklık enum → i18n anahtarı (etiket t() ile çözülür).
const SIKLIK_KEY: Record<ReportFrequency, string> = { gunluk: "rap.siklik.gunluk", haftalik: "rap.siklik.haftalik", aylik: "rap.siklik.aylik" };
// Bot sınıfı enum → i18n anahtarı (etiket t() ile çözülür).
const SINIF_KEY: Record<string, string> = {
  human: "rap.sinif.human",
  good_bot: "rap.sinif.good_bot",
  automation: "rap.sinif.automation",
  scraper: "rap.sinif.scraper",
  credential_stuffing: "rap.sinif.credential_stuffing",
  ai_agent: "rap.sinif.ai_agent",
  ddos: "rap.sinif.ddos",
  spam: "rap.sinif.spam",
};
// Sınıf renkleri tek kaynak: botSinifGorsel (krem-temaya uygun, koyu/siyah yok).
const SINIF_RENK: Record<string, string> = {
  human: botSinifGorsel("human").renk,
  good_bot: botSinifGorsel("good_bot").renk,
  automation: botSinifGorsel("automation").renk,
  scraper: botSinifGorsel("scraper").renk,
  credential_stuffing: botSinifGorsel("credential_stuffing").renk,
  ai_agent: botSinifGorsel("ai_agent").renk,
  ddos: botSinifGorsel("ddos").renk,
  spam: botSinifGorsel("spam").renk,
};
const DONEMLER = [7, 30, 90] as const;

/* ------------------------------------------------------------------ yardımcılar */
function tarih(ts: number): string {
  return new Date(ts).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}
function tarihSaat(ts: number): string {
  return new Date(ts).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
function goreli(ts: number, t: Ceviri): string {
  const fark = ts - Date.now();
  const gun = Math.round(fark / 86400000);
  if (gun === 0) return t("rap.goreli.bugun");
  if (gun > 0) return t("rap.goreli.sonra").replace("{n}", String(gun));
  return t("rap.goreli.once").replace("{n}", String(Math.abs(gun)));
}
function boyut(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "rapor";
}

/* ------------------------------------------------------------------ ana bileşen */
export function RaporlarIstemci({
  veri,
  zamanli,
  gecmis,
  benimAdim,
  dil,
}: {
  veri: RaporVeriDTO;
  zamanli: ZamanRaporDTO[];
  gecmis: GecmisDTO[];
  benimAdim: string;
  dil: Dil;
}) {
  const router = useRouter();
  const { goster } = useToast();
  const t = (k: string) => raporlarCeviri(k, dil);

  // Canlı önizleme + oluşturucu için seçili tür & dönem.
  const [seciliTur, setSeciliTur] = useState<ReportType>("haftalik_ozet");
  const [donem, setDonem] = useState<number>(30);

  // Modallar.
  const [olusturAcik, setOlusturAcik] = useState(false);
  const [zamanlaAcik, setZamanlaAcik] = useState(false);
  const [gonderiliyor, setGonderiliyor] = useState(false);

  const sablon = SABLON_HARITA[seciliTur];

  /* --- dönem filtreli türetilmiş veri (canlı önizleme + export ortak) --- */
  const donemVeri = useMemo(() => filtrele(veri, donem), [veri, donem]);

  /* --- gerçek dosya üretimi --- */
  async function raporUret(tur: ReportType, gun: number, format: ReportFormat, bolumSecim: string[], adOverride?: string) {
    const s = SABLON_HARITA[tur];
    const ad = adOverride?.trim() || t(s.adKey);
    const dv = filtrele(veri, gun);
    const dosyaTaban = `${slug(ad)}-${gun}g-${new Date().toISOString().slice(0, 10)}`;
    let boyutTahmin = 0;

    if (format === "csv") {
      const satirlar = csvSatirlari(tur, dv, bolumSecim, t);
      if (!satirlar.length) {
        goster({ tip: "hata", baslik: t("rap.toast.bosBaslik"), aciklama: t("rap.toast.bosAciklama") });
        return;
      }
      exportCsv(`${dosyaTaban}.csv`, satirlar);
      boyutTahmin = JSON.stringify(satirlar).length;
    } else if (format === "json") {
      const nesne = jsonNesne(tur, ad, gun, dv, bolumSecim);
      const metin = JSON.stringify(nesne, null, 2);
      indir(`${dosyaTaban}.json`, metin, "application/json");
      boyutTahmin = metin.length;
    } else {
      // PDF: yazdırılabilir, kendi kendine yeten HTML rapor (tarayıcı "PDF olarak kaydet").
      const html = pdfHtml(tur, ad, gun, dv, bolumSecim, benimAdim, t);
      indir(`${dosyaTaban}.html`, html, "text/html");
      boyutTahmin = html.length;
    }

    // Geçmişe kaydet (DB'de kalıcı — audit + arşiv izi).
    try {
      await fetch("/api/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "record",
          type: tur,
          name: ad,
          periodDays: gun,
          format,
          sizeBytes: boyutTahmin,
        }),
      });
    } catch {
      /* indirme yine de başarılı — sessiz geç */
    }
    goster({
      tip: "basari",
      baslik: t("rap.toast.indirildi").replace("{ad}", t(s.adKey)),
      aciklama: t("rap.toast.indirildiAlt").replace("{format}", FORMAT_ETIKET[format]).replace("{n}", String(gun)),
    });
    router.refresh();
  }

  /* --- zamanlanmış rapor işlemleri --- */
  async function zamanlaEkle(payload: {
    type: ReportType;
    name: string;
    frequency: ReportFrequency;
    format: ReportFormat;
    recipients: string[];
    siteId: string | null;
  }) {
    setGonderiliyor(true);
    try {
      const r = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      if (!r.ok) {
        goster({ tip: "hata", baslik: t("rap.toast.zamanlanamadi"), aciklama: data.error });
        return;
      }
      goster({ tip: "basari", baslik: t("rap.toast.zamanlandi"), aciklama: t("rap.toast.zamanlandiAlt").replace("{siklik}", t(SIKLIK_KEY[payload.frequency])).replace("{n}", String(payload.recipients.length)) });
      setZamanlaAcik(false);
      router.refresh();
    } finally {
      setGonderiliyor(false);
    }
  }

  async function zamanlaDurumDegistir(r: ZamanRaporDTO) {
    const res = await fetch("/api/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: r.id }),
    });
    if (res.ok) {
      goster({ tip: "bilgi", baslik: r.active ? t("rap.toast.duraklatildi") : t("rap.toast.yenidenBaslatildi"), aciklama: r.name });
      router.refresh();
    }
  }

  async function zamanlaSil(r: ZamanRaporDTO) {
    if (!confirm(t("rap.toast.silOnay").replace("{ad}", r.name))) return;
    const res = await fetch("/api/reports", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: r.id }),
    });
    if (res.ok) {
      goster({ tip: "basari", baslik: t("rap.toast.silindi"), aciklama: r.name });
      router.refresh();
    }
  }

  /* --- üst özet metrikleri --- */
  const sonRaporTs = gecmis.length ? gecmis[0].createdAt : null;
  const toplamKayit = gecmis.reduce((a, g) => {
    // Yaklaşık dışa aktarılan satır sayısı (boyut/128 byte ~ satır) — gösterge.
    return a + Math.max(1, Math.round(g.sizeBytes / 128));
  }, 0);

  /* --- görsel özet türetmeleri (salt görsel; hiçbir CRUD/export mantığı yok) --- */
  const gorsel = useMemo(() => {
    // Rapor türü dağılımı (geçmiş bazında) donut.
    const turSayac: Record<string, number> = {};
    for (const g of gecmis) turSayac[g.type] = (turSayac[g.type] ?? 0) + 1;
    const turDonut = Object.entries(turSayac)
      .sort((a, b) => b[1] - a[1])
      .map(([tur, deger]) => ({ etiket: t(SABLON_HARITA[tur as ReportType].adKey), deger, renk: SABLON_HARITA[tur as ReportType].renk }));

    // Format dağılımı donut.
    const fmtRenk: Record<string, string> = { pdf: "#dc2626", csv: "#16a34a", json: "#d97706" };
    const fmtSayac: Record<string, number> = {};
    for (const g of gecmis) fmtSayac[g.format] = (fmtSayac[g.format] ?? 0) + 1;
    const fmtDonut = Object.entries(fmtSayac).map(([f, deger]) => ({ etiket: FORMAT_ETIKET[f as ReportFormat], deger, renk: fmtRenk[f] ?? "#2f6fed" }));

    // Son 12 haftalık oluşturma trendi (histogram).
    const simdi = Date.now();
    const kovalar = Array.from({ length: 12 }, (_, i) => {
      const bas = simdi - (12 - i) * 7 * 86400000;
      const bit = bas + 7 * 86400000;
      const sayi = gecmis.filter((g) => g.createdAt >= bas && g.createdAt < bit).length;
      return { etiket: `${12 - i}h`, deger: sayi, ton: "nötr" as const };
    });

    // Zamanlanmış aktif oranı gauge.
    const aktifOran = zamanli.length ? Math.round((zamanli.filter((z) => z.active).length / zamanli.length) * 100) : 100;
    return { turDonut, fmtDonut, kovalar, aktifOran };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gecmis, zamanli, dil]);

  /* --- zamanlanmış tablo kolonları --- */
  const zamanKolonlar: Kolon<ZamanRaporDTO>[] = [
    {
      baslik: t("rap.zaman.kol.rapor"),
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg" style={{ background: SABLON_HARITA[r.type].renk + "18", color: SABLON_HARITA[r.type].renk }}>
            {SABLON_HARITA[r.type].ikon}
          </span>
          <div className="min-w-0">
            <div className="truncate font-medium text-slate-ink">{r.name}</div>
            <div className="text-[12px] text-slate-faint">{r.siteName ?? t("rap.zaman.tumSiteler")}</div>
          </div>
        </div>
      ),
    },
    { baslik: t("rap.zaman.kol.siklik"), render: (r) => <Badge ton="mavi">{t(SIKLIK_KEY[r.frequency])}</Badge> },
    { baslik: t("rap.zaman.kol.format"), render: (r) => <span className="rounded-md bg-canvas px-2 py-0.5 text-[12px] font-medium text-slate-muted">{FORMAT_ETIKET[r.format]}</span> },
    {
      baslik: t("rap.zaman.kol.alicilar"),
      render: (r) => (
        <Tooltip metin={r.recipients.join(", ")}>
          <span className="inline-flex items-center gap-1.5 text-[13px] text-slate-muted">
            <Mail className="size-3.5 text-slate-faint" />
            {t("rap.zaman.aliciSayi").replace("{n}", String(r.recipients.length))}
          </span>
        </Tooltip>
      ),
    },
    {
      baslik: t("rap.zaman.kol.sonraki"),
      render: (r) =>
        r.active ? (
          <span className="inline-flex items-center gap-1.5 text-[13px] text-slate-muted">
            <Clock className="size-3.5 text-slate-faint" />
            {goreli(r.nextRunAt, t)}
          </span>
        ) : (
          <span className="text-[13px] text-slate-faint">—</span>
        ),
    },
    {
      baslik: t("rap.zaman.kol.durum"),
      render: (r) =>
        r.active ? <DurumRozeti ton="ok" etiket={t("rap.zaman.aktif")} nabiz /> : <DurumRozeti ton="gri" etiket={t("rap.zaman.duraklatildi")} />,
    },
    {
      baslik: "",
      className: "text-right",
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Tooltip metin={r.active ? t("rap.zaman.duraklat") : t("rap.zaman.yenidenBaslat")}>
            <button
              onClick={() => zamanlaDurumDegistir(r)}
              className="rounded-lg p-1.5 text-slate-faint transition hover:bg-canvas hover:text-slate-ink"
              aria-label={r.active ? t("rap.zaman.duraklat") : t("rap.zaman.yenidenBaslat")}
            >
              {r.active ? <Pause className="size-4" /> : <Play className="size-4" />}
            </button>
          </Tooltip>
          <Tooltip metin={t("rap.zaman.sil")}>
            <button
              onClick={() => zamanlaSil(r)}
              className="rounded-lg p-1.5 text-slate-faint transition hover:bg-danger-soft hover:text-danger2"
              aria-label={t("rap.zaman.sil")}
            >
              <Trash2 className="size-4" />
            </button>
          </Tooltip>
        </div>
      ),
    },
  ];

  /* --- geçmiş tablo kolonları --- */
  const gecmisKolonlar: Kolon<GecmisDTO>[] = [
    {
      baslik: t("rap.zaman.kol.rapor"),
      render: (g) => (
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg" style={{ background: SABLON_HARITA[g.type].renk + "18", color: SABLON_HARITA[g.type].renk }}>
            {SABLON_HARITA[g.type].ikon}
          </span>
          <div className="min-w-0">
            <div className="truncate font-medium text-slate-ink">{g.name}</div>
            <div className="text-[12px] text-slate-faint">
              {g.scheduled ? t("rap.gecmis.zamanlanmis") : t("rap.gecmis.elle")} · {g.createdBy}
            </div>
          </div>
        </div>
      ),
    },
    { baslik: t("rap.gecmis.kol.donem"), render: (g) => <span className="text-[13px] text-slate-muted">{t("rap.gecmis.sonGun").replace("{n}", String(g.periodDays))}</span> },
    { baslik: t("rap.zaman.kol.format"), render: (g) => <span className="rounded-md bg-canvas px-2 py-0.5 text-[12px] font-medium text-slate-muted">{FORMAT_ETIKET[g.format]}</span> },
    { baslik: t("rap.gecmis.kol.boyut"), className: "num", render: (g) => <span className="text-[13px] tabular-nums text-slate-muted">{boyut(g.sizeBytes)}</span> },
    { baslik: t("rap.gecmis.kol.olusturuldu"), render: (g) => <span className="text-[13px] text-slate-muted">{tarihSaat(g.createdAt)}</span> },
    {
      baslik: "",
      className: "text-right",
      render: (g) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            raporUret(g.type, g.periodDays, g.format, SABLON_HARITA[g.type].bolumler.map((b) => b.anahtar), g.name)
          }
        >
          <Download className="size-3.5" />
          {t("rap.gecmis.yenidenIndir")}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* ---------- Üst özet ---------- */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={gecmis.length} etiket={t("rap.ust.olusturulan")} ikon={<FileText className="size-4" />} />
        <StatKart
          sayi={zamanli.filter((z) => z.active).length}
          etiket={t("rap.ust.aktif")}
          ikon={<Repeat className="size-4" />}
          tone="brand"
        />
        <StatKart
          sayi={sonRaporTs ? tarih(sonRaporTs) : "—"}
          etiket={t("rap.ust.sonTarih")}
          ikon={<Calendar className="size-4" />}
        />
        <StatKart
          sayi={toplamKayit.toLocaleString("tr-TR")}
          etiket={t("rap.ust.disaKayit")}
          ikon={<Download className="size-4" />}
        />
      </div>

      {/* ---------- Görsel özet: tür dağılımı + oluşturma trendi + format ---------- */}
      {gecmis.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <Panel baslik={t("rap.gorsel.olusturmaTrendi")} sagUst={<Badge ton="brand">{t("rap.gorsel.son12h")}</Badge>}>
            <Histogram kovalar={gorsel.kovalar} yukseklik={128} renk="#2f6fed" />
            <div className="mt-4 flex items-center gap-4 border-t border-line pt-4">
              <div className="flex flex-col items-center">
                <GaugeGost deger={gorsel.aktifOran} etiket={t("rap.gorsel.aktifOran")} boyut={112} renk={gorsel.aktifOran >= 66 ? "#16a34a" : gorsel.aktifOran >= 33 ? "#d97706" : "#dc2626"} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-2 text-[12px] font-medium text-slate-muted">{t("rap.gorsel.formatDagilim")}</div>
                {gorsel.fmtDonut.length ? (
                  <div className="space-y-2">
                    {gorsel.fmtDonut.map((f) => {
                      const top = gorsel.fmtDonut.reduce((a, x) => a + x.deger, 0) || 1;
                      return (
                        <div key={f.etiket} className="flex items-center gap-2 text-[13px]">
                          <span className="size-2.5 shrink-0 rounded-full" style={{ background: f.renk }} />
                          <span className="text-slate-muted">{f.etiket}</span>
                          <span className="ml-auto font-semibold tabular-nums text-slate-ink">{Math.round((f.deger / top) * 100)}%</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[13px] text-slate-faint">—</p>
                )}
              </div>
            </div>
          </Panel>
          <Panel baslik={t("rap.gorsel.turDagilim")}>
            {gorsel.turDonut.length ? (
              <DonutDagilim segmentler={gorsel.turDonut} merkezEtiket={t("rap.gorsel.raporMerkez")} />
            ) : (
              <p className="text-[13px] text-slate-faint">—</p>
            )}
          </Panel>
        </div>
      )}

      {/* ---------- Rapor şablonları galerisi ---------- */}
      <Panel
        baslik={t("rap.sablon.baslik")}
        sagUst={
          <Button size="sm" variant="accent" onClick={() => setOlusturAcik(true)}>
            <Plus className="size-4" />
            {t("rap.sablon.ozelOlustur")}
          </Button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {SABLONLAR.map((s) => (
            <motion.div
              key={s.type}
              whileHover={{ y: -2 }}
              className={cn(
                "flex flex-col rounded-2xl border bg-white p-5 transition",
                seciliTur === s.type ? "border-brand-300 ring-2 ring-brand-100" : "border-line hover:border-line-strong",
              )}
            >
              <div className="flex items-start justify-between">
                <span className="grid size-10 place-items-center rounded-xl" style={{ background: s.renk + "18", color: s.renk }}>
                  {s.ikon}
                </span>
                {seciliTur === s.type && <Badge ton="brand">{t("rap.sablon.onizlemede")}</Badge>}
              </div>
              <h4 className="mt-3 text-[15px] font-semibold text-slate-ink">{t(s.adKey)}</h4>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-muted">{t(s.aciklamaKey)}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {s.metrikKeys.map((m) => (
                  <span key={m} className="rounded-md bg-canvas px-2 py-0.5 text-[11px] font-medium text-slate-muted">
                    {t(m)}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 border-t border-line pt-4">
                <Button
                  size="sm"
                  variant="accent"
                  className="flex-1"
                  onClick={() => {
                    setSeciliTur(s.type);
                    setOlusturAcik(true);
                  }}
                >
                  <Download className="size-3.5" />
                  {t("rap.sablon.olustur")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setSeciliTur(s.type);
                    setZamanlaAcik(true);
                  }}
                >
                  <Clock className="size-3.5" />
                  {t("rap.sablon.zamanla")}
                </Button>
                <Tooltip metin={t("rap.sablon.onizle")}>
                  <button
                    onClick={() => setSeciliTur(s.type)}
                    className="grid size-9 shrink-0 place-items-center rounded-full border border-line-strong text-slate-muted transition hover:bg-canvas"
                    aria-label={t("rap.sablon.onizle")}
                  >
                    <BarChart3 className="size-4" />
                  </button>
                </Tooltip>
              </div>
            </motion.div>
          ))}
        </div>
      </Panel>

      {/* ---------- Canlı önizleme ---------- */}
      <Panel
        baslik={t("rap.onizleme.baslik").replace("{ad}", t(sablon.adKey))}
        sagUst={
          <div className="flex items-center gap-1 rounded-full border border-line-strong bg-canvas p-0.5">
            {DONEMLER.map((d) => (
              <button
                key={d}
                onClick={() => setDonem(d)}
                className={cn(
                  "rounded-full px-3 py-1 text-[12px] font-medium transition",
                  donem === d ? "bg-surface text-slate-ink shadow-sm" : "text-slate-muted hover:text-slate-ink",
                )}
              >
                {d}g
              </button>
            ))}
          </div>
        }
      >
        <Onizleme tur={seciliTur} dv={donemVeri} donem={donem} t={t} />
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-5">
          <span className="text-[13px] text-slate-muted">{t("rap.onizleme.indir")}</span>
          {(["pdf", "csv", "json"] as ReportFormat[]).map((f) => (
            <Button
              key={f}
              size="sm"
              variant="outline"
              onClick={() => raporUret(seciliTur, donem, f, sablon.bolumler.map((b) => b.anahtar))}
            >
              <Download className="size-3.5" />
              {FORMAT_ETIKET[f]}
            </Button>
          ))}
        </div>
      </Panel>

      {/* ---------- Zamanlanmış raporlar ---------- */}
      <Panel
        baslik={t("rap.zaman.baslik")}
        sagUst={
          <Button size="sm" variant="accent" onClick={() => { setZamanlaAcik(true); }}>
            <Plus className="size-4" />
            {t("rap.zaman.zamanla")}
          </Button>
        }
      >
        {zamanli.length === 0 ? (
          <BosDurum
            ikon={<Clock className="size-7" />}
            baslik={t("rap.zaman.bosBaslik")}
            aciklama={t("rap.zaman.bosAciklama")}
            aksiyon={
              <Button variant="accent" onClick={() => setZamanlaAcik(true)}>
                <Plus className="size-4" />
                {t("rap.zaman.ilkZamanla")}
              </Button>
            }
          />
        ) : (
          <Tablo kolonlar={zamanKolonlar} veri={zamanli} />
        )}
      </Panel>

      {/* ---------- Rapor geçmişi ---------- */}
      <Panel baslik={t("rap.gecmis.baslik")}>
        {gecmis.length === 0 ? (
          <BosDurum ikon={<FileText className="size-7" />} baslik={t("rap.gecmis.bosBaslik")} aciklama={t("rap.gecmis.bosAciklama")} />
        ) : (
          <Tablo
            kolonlar={gecmisKolonlar}
            veri={gecmis}
            sayfaBoyu={15}
            ara={(g) => `${g.name} ${t(SABLON_HARITA[g.type].adKey)} ${g.createdBy}`}
            araPlaceholder={t("rap.gecmis.ara")}
          />
        )}
      </Panel>

      {/* ---------- Oluşturucu modalı ---------- */}
      {olusturAcik && (
        <OlusturucuModal
          baslangicTur={seciliTur}
          baslangicDonem={donem}
          siteler={veri.siteler}
          kapat={() => setOlusturAcik(false)}
          uret={raporUret}
          t={t}
        />
      )}

      {/* ---------- Zamanla modalı ---------- */}
      {zamanlaAcik && (
        <ZamanlaModal
          baslangicTur={seciliTur}
          siteler={veri.siteler}
          gonderiliyor={gonderiliyor}
          kapat={() => setZamanlaAcik(false)}
          ekle={zamanlaEkle}
          t={t}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Canlı önizleme */
function Onizleme({ tur, dv, donem, t }: { tur: ReportType; dv: DonemVeri; donem: number; t: Ceviri }) {
  const trendNoktalar = dv.gunler.map((g) => g.blocked);
  const trendEtiket = dv.gunler.map((g) => new Date(g.gun).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" }));
  const insan = dv.sinifSayac.human ?? 0;
  const bot = Object.entries(dv.sinifSayac).reduce((a, [k, v]) => (k === "human" ? a : a + v), 0);
  const engelOran = dv.kullanimToplam.issued ? Math.round((dv.kullanimToplam.blocked / dv.kullanimToplam.issued) * 100) : 0;

  // Ortak mini KPI şeridi.
  const kpiler: { etiket: string; deger: string; renk?: string }[] = [
    { etiket: t("rap.kpi.toplamIstek"), deger: dv.kullanimToplam.issued.toLocaleString("tr-TR") },
    { etiket: t("rap.kpi.engellenen"), deger: dv.kullanimToplam.blocked.toLocaleString("tr-TR"), renk: "#dc2626" },
    { etiket: t("rap.kpi.engelOran"), deger: `%${engelOran}` },
    { etiket: t("rap.kpi.donem"), deger: t("rap.kpi.gun").replace("{n}", String(donem)) },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpiler.map((k) => (
          <div key={k.etiket} className="rounded-2xl border border-line bg-canvas/40 px-4 py-3">
            <div className="text-[22px] font-bold tabular-nums" style={{ color: k.renk ?? "#1f2937" }}>{k.deger}</div>
            <div className="mt-0.5 text-[12px] text-slate-muted">{k.etiket}</div>
          </div>
        ))}
      </div>

      {/* Tür bazlı önizleme gövdesi */}
      {(tur === "haftalik_ozet" || tur === "bot_trafik") && (
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <div className="mb-2 text-[13px] font-medium text-slate-muted">{t("rap.onizleme.engelTrend")}</div>
            <TrendGrafik noktalar={trendNoktalar} etiketler={trendEtiket} renk="#dc2626" yukseklik={200} />
          </div>
          <div>
            <div className="mb-3 text-[13px] font-medium text-slate-muted">{t("rap.onizleme.insanBot")}</div>
            <DonutDagilim
              segmentler={[
                { etiket: t("rap.onizleme.insan"), deger: insan, renk: "#16a34a" },
                { etiket: t("rap.onizleme.bot"), deger: bot, renk: "#dc2626" },
              ]}
            />
          </div>
        </div>
      )}

      {tur === "aylik_tehdit" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <div className="mb-3 text-[13px] font-medium text-slate-muted">{t("rap.onizleme.saldiriTur")}</div>
            <DonutDagilim segmentler={sinifSegment(dv.sinifSayac, t)} />
          </div>
          <div>
            <div className="mb-3 text-[13px] font-medium text-slate-muted">{t("rap.onizleme.cografyaKaynak")}</div>
            <CografyaBar ulkeler={dv.ulkeler.map((u) => ({ kod: u.kod, ad: u.kod, deger: u.deger }))} />
          </div>
        </div>
      )}

      {tur === "ai_ajan" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <div className="mb-3 text-[13px] font-medium text-slate-muted">{t("rap.onizleme.ajanDagilim")}</div>
            {dv.aiAileler.length ? (
              <CografyaBar ulkeler={dv.aiAileler.map((a) => ({ kod: "AI", ad: a.ad, deger: a.deger }))} />
            ) : (
              <p className="text-[13px] text-slate-faint">{t("rap.onizleme.aiYok")}</p>
            )}
          </div>
          <div>
            <div className="mb-2 text-[13px] font-medium text-slate-muted">{t("rap.onizleme.aiTrend")}</div>
            <TrendGrafik noktalar={dv.gunler.map((g) => Math.round(g.blocked * 0.3))} etiketler={trendEtiket} renk="#8b5cf6" yukseklik={200} />
          </div>
        </div>
      )}

      {tur === "uyum_denetim" && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat etiket={t("rap.onizleme.denetimKayit")} deger={dv.denetimToplam.toLocaleString("tr-TR")} />
          <MiniStat etiket={t("rap.onizleme.kritikIslem")} deger={String(dv.denetimKritik)} renk="#dc2626" />
          <MiniStat etiket={t("rap.onizleme.cozulenOlay")} deger={String(dv.uyariCozulen)} renk="#16a34a" />
          <MiniStat etiket={t("rap.onizleme.ortMttr")} deger={`${dv.ortMttrSaat} sa`} />
        </div>
      )}

      {tur === "kampanya_analiz" && (
        <div>
          <div className="mb-2 text-[13px] font-medium text-slate-muted">{t("rap.onizleme.kampanyalar").replace("{sayi}", String(dv.kampanyalar.length))}</div>
          {dv.kampanyalar.length ? (
            <div className="space-y-2">
              {dv.kampanyalar.slice(0, 5).map((c) => {
                const oran = c.totalRequests ? Math.round((c.blockedRequests / c.totalRequests) * 100) : 0;
                return (
                  <div key={c.id} className="flex items-center justify-between rounded-xl border border-line bg-canvas/40 px-4 py-2.5">
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-medium text-slate-ink">{c.name}</div>
                      <div className="text-[12px] text-slate-faint">{c.siteName} · {c.totalRequests.toLocaleString("tr-TR")} {t("rap.onizleme.istek")}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] font-semibold tabular-nums text-danger2">{t("rap.durum.engel").replace("{n}", String(oran))}</span>
                      <Badge ton={c.status === "active" ? "kirmizi" : c.status === "monitoring" ? "sari" : "yesil"}>
                        {c.status === "active" ? t("rap.durum.active") : c.status === "monitoring" ? t("rap.durum.monitoring") : t("rap.durum.mitigated")}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[13px] text-slate-faint">{t("rap.onizleme.kampanyaYok")}</p>
          )}
        </div>
      )}
    </div>
  );
}

function MiniStat({ etiket, deger, renk }: { etiket: string; deger: string; renk?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-canvas/40 px-4 py-3">
      <div className="text-[22px] font-bold tabular-nums" style={{ color: renk ?? "#1f2937" }}>{deger}</div>
      <div className="mt-0.5 text-[12px] text-slate-muted">{etiket}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ Oluşturucu modalı */
function OlusturucuModal({
  baslangicTur,
  baslangicDonem,
  siteler,
  kapat,
  uret,
  t,
}: {
  baslangicTur: ReportType;
  baslangicDonem: number;
  siteler: SiteDTO[];
  kapat: () => void;
  uret: (tur: ReportType, gun: number, format: ReportFormat, bolumler: string[], ad?: string) => void;
  t: Ceviri;
}) {
  const [tur, setTur] = useState<ReportType>(baslangicTur);
  const [gun, setGun] = useState<number>([7, 30, 90].includes(baslangicDonem) ? baslangicDonem : 30);
  const [format, setFormat] = useState<ReportFormat>("pdf");
  const [siteId, setSiteId] = useState<string>("all");
  const [ad, setAd] = useState("");
  const sablon = SABLON_HARITA[tur];
  const [bolumler, setBolumler] = useState<string[]>(sablon.bolumler.map((b) => b.anahtar));

  function turDegistir(yeniTur: ReportType) {
    setTur(yeniTur);
    setBolumler(SABLON_HARITA[yeniTur].bolumler.map((b) => b.anahtar));
  }
  function bolumToggle(anahtar: string) {
    setBolumler((p) => (p.includes(anahtar) ? p.filter((x) => x !== anahtar) : [...p, anahtar]));
  }

  return (
    <Modal acik kapat={kapat} baslik={t("rap.olustur.baslik")} aciklama={t("rap.olustur.aciklama")} genislik="max-w-2xl">
      <div className="space-y-4">
        <Alan etiket={t("rap.olustur.turEtiket")}>
          <Secim value={tur} onChange={(e) => turDegistir(e.target.value as ReportType)}>
            {SABLONLAR.map((s) => (
              <option key={s.type} value={s.type}>{t(s.adKey)}</option>
            ))}
          </Secim>
        </Alan>

        <Alan etiket={t("rap.olustur.adEtiket")} opsiyonel>
          <Girdi value={ad} onChange={(e) => setAd(e.target.value)} placeholder={t(sablon.adKey)} />
        </Alan>

        <div className="grid gap-4 sm:grid-cols-2">
          <Alan etiket={t("rap.olustur.donemEtiket")}>
            <Secim value={gun} onChange={(e) => setGun(Number(e.target.value))}>
              <option value={7}>{t("rap.olustur.son7")}</option>
              <option value={30}>{t("rap.olustur.son30")}</option>
              <option value={90}>{t("rap.olustur.son90")}</option>
            </Secim>
          </Alan>
          <Alan etiket={t("rap.olustur.siteEtiket")}>
            <Secim value={siteId} onChange={(e) => setSiteId(e.target.value)}>
              <option value="all">{t("rap.olustur.tumSiteler")}</option>
              {siteler.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Secim>
          </Alan>
        </div>

        <Alan etiket={t("rap.olustur.formatEtiket")}>
          <div className="flex gap-2">
            {(["pdf", "csv", "json"] as ReportFormat[]).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={cn(
                  "flex-1 rounded-2xl border px-4 py-3 text-center transition",
                  format === f ? "border-brand-300 bg-brand-50 text-brand-700 ring-2 ring-brand-100" : "border-line-strong text-slate-muted hover:bg-canvas",
                )}
              >
                <div className="text-[14px] font-semibold">{FORMAT_ETIKET[f]}</div>
                <div className="mt-0.5 text-[11px] text-slate-faint">
                  {f === "pdf" ? t("rap.olustur.pdfAlt") : f === "csv" ? t("rap.olustur.csvAlt") : t("rap.olustur.jsonAlt")}
                </div>
              </button>
            ))}
          </div>
        </Alan>

        <Alan etiket={t("rap.olustur.bolumEtiket")}>
          <div className="grid gap-2 sm:grid-cols-2">
            {sablon.bolumler.map((b) => (
              <label
                key={b.anahtar}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-[13px] transition",
                  bolumler.includes(b.anahtar) ? "border-brand-200 bg-brand-50/60 text-slate-ink" : "border-line text-slate-muted hover:bg-canvas",
                )}
              >
                <input
                  type="checkbox"
                  checked={bolumler.includes(b.anahtar)}
                  onChange={() => bolumToggle(b.anahtar)}
                  className="size-4 accent-brand-600"
                />
                {t(b.etiketKey)}
              </label>
            ))}
          </div>
        </Alan>

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button variant="ghost" onClick={kapat}>{t("rap.olustur.vazgec")}</Button>
          <Button
            variant="accent"
            disabled={!bolumler.length}
            onClick={() => {
              uret(tur, gun, format, bolumler, ad);
              kapat();
            }}
          >
            <Download className="size-4" />
            {t("rap.olustur.olusturIndir")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ Zamanla modalı */
function ZamanlaModal({
  baslangicTur,
  siteler,
  gonderiliyor,
  kapat,
  ekle,
  t,
}: {
  baslangicTur: ReportType;
  siteler: SiteDTO[];
  gonderiliyor: boolean;
  kapat: () => void;
  ekle: (payload: {
    type: ReportType;
    name: string;
    frequency: ReportFrequency;
    format: ReportFormat;
    recipients: string[];
    siteId: string | null;
  }) => void;
  t: Ceviri;
}) {
  const [tur, setTur] = useState<ReportType>(baslangicTur);
  const [ad, setAd] = useState("");
  const [siklik, setSiklik] = useState<ReportFrequency>("haftalik");
  const [format, setFormat] = useState<ReportFormat>("pdf");
  const [siteId, setSiteId] = useState<string>("all");
  const [aliciMetin, setAliciMetin] = useState("");
  const sablon = SABLON_HARITA[tur];

  const alicilar = aliciMetin
    .split(/[,\n;]+/)
    .map((s) => s.trim())
    .filter((s) => s.includes("@"));

  return (
    <Modal acik kapat={kapat} baslik={t("rap.zamanla.baslik")} aciklama={t("rap.zamanla.aciklama")} genislik="max-w-xl">
      <div className="space-y-4">
        <Alan etiket={t("rap.olustur.turEtiket")}>
          <Secim value={tur} onChange={(e) => setTur(e.target.value as ReportType)}>
            {SABLONLAR.map((s) => (
              <option key={s.type} value={s.type}>{t(s.adKey)}</option>
            ))}
          </Secim>
        </Alan>

        <Alan etiket={t("rap.olustur.adEtiket")} opsiyonel>
          <Girdi value={ad} onChange={(e) => setAd(e.target.value)} placeholder={t(sablon.adKey)} />
        </Alan>

        <div className="grid gap-4 sm:grid-cols-2">
          <Alan etiket={t("rap.zamanla.siklikEtiket")}>
            <Secim value={siklik} onChange={(e) => setSiklik(e.target.value as ReportFrequency)}>
              <option value="gunluk">{t("rap.siklik.gunluk")}</option>
              <option value="haftalik">{t("rap.siklik.haftalik")}</option>
              <option value="aylik">{t("rap.siklik.aylik")}</option>
            </Secim>
          </Alan>
          <Alan etiket={t("rap.zamanla.formatEtiket")}>
            <Secim value={format} onChange={(e) => setFormat(e.target.value as ReportFormat)}>
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </Secim>
          </Alan>
        </div>

        <Alan etiket={t("rap.olustur.siteEtiket")}>
          <Secim value={siteId} onChange={(e) => setSiteId(e.target.value)}>
            <option value="all">{t("rap.olustur.tumSiteler")}</option>
            {siteler.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Secim>
        </Alan>

        <Alan etiket={t("rap.zamanla.aliciEtiket")}>
          <textarea
            value={aliciMetin}
            onChange={(e) => setAliciMetin(e.target.value)}
            placeholder="elif@acme.com, mert@acme.com"
            rows={2}
            className="w-full rounded-2xl border border-line-strong bg-surface px-4 py-2.5 text-sm text-slate-ink outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100 placeholder:text-slate-faint"
          />
          <span className="mt-1 block text-[12px] text-slate-faint">
            {t("rap.zamanla.aliciIpucu")} {alicilar.length > 0 && <span className="text-slate-muted">{t("rap.zamanla.aliciGecerli").replace("{n}", String(alicilar.length))}</span>}
          </span>
        </Alan>

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button variant="ghost" onClick={kapat}>{t("rap.olustur.vazgec")}</Button>
          <Button
            variant="accent"
            disabled={gonderiliyor || alicilar.length === 0}
            onClick={() =>
              ekle({
                type: tur,
                name: ad,
                frequency: siklik,
                format,
                recipients: alicilar,
                siteId: siteId === "all" ? null : siteId,
              })
            }
          >
            <Send className="size-4" />
            {gonderiliyor ? t("rap.zamanla.gonderiliyor") : t("rap.zamanla.zamanla")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ================================================================== veri türetme + export yardımcıları */

type DonemVeri = RaporVeriDTO & { gunler: GunDTO[] };

/** Havuzu döneme (gün) göre kırp ve türetilmiş toplamları yeniden hesapla. */
function filtrele(veri: RaporVeriDTO, gun: number): DonemVeri {
  const gunler = veri.gunler.slice(-gun);
  const kullanimToplam = gunler.reduce(
    (a, g) => ({
      issued: a.issued + g.issued,
      verified: a.verified + g.verified,
      blocked: a.blocked + g.blocked,
      challenged: a.challenged + g.challenged,
    }),
    { issued: 0, verified: 0, blocked: 0, challenged: 0 },
  );
  // Not: sinif/ülke/AI/kampanya dağılımları 90g havuz üzerinden gösterilir
  // (event tabanlı; dönem kırpımı kaba ölçekle uygulanır).
  const oran = veri.gunler.length ? gun / veri.gunler.length : 1;
  const olcek = (n: number) => Math.round(n * Math.min(1, oran));
  const sinifSayac: Record<string, number> = {};
  for (const [k, v] of Object.entries(veri.sinifSayac)) sinifSayac[k] = olcek(v);
  const ulkeler = veri.ulkeler.map((u) => ({ ...u, deger: olcek(u.deger) }));
  const aiAileler = veri.aiAileler.map((a) => ({ ...a, deger: olcek(a.deger) }));
  return {
    ...veri,
    gunler,
    kullanimToplam,
    sinifSayac,
    ulkeler,
    aiAileler,
    aiOlaySayisi: olcek(veri.aiOlaySayisi),
  };
}

function sinifSegment(sinifSayac: Record<string, number>, t: Ceviri) {
  return Object.entries(sinifSayac)
    .filter(([k, v]) => k !== "human" && v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => ({ etiket: SINIF_KEY[k] ? t(SINIF_KEY[k]) : k, deger: v, renk: SINIF_RENK[k] ?? botSinifGorsel(k).renk }));
}

/** Tarayıcıda metin dosyası indir (CSV dışı biçimler için). */
function indir(dosyaAdi: string, icerik: string, mime: string) {
  const blob = new Blob([icerik], { type: `${mime};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = dosyaAdi;
  a.click();
  URL.revokeObjectURL(url);
}

/** CSV satırlarını türe göre üret (gerçek veri). Sütun adları veri şemasıdır (çevrilmez); değer etiketleri t() ile çözülür. */
function csvSatirlari(tur: ReportType, dv: DonemVeri, bolumler: string[], t: Ceviri): Record<string, unknown>[] {
  if (tur === "aylik_tehdit" || tur === "kampanya_analiz") {
    if (bolumler.includes("kampanya") || tur === "kampanya_analiz") {
      const k = dv.kampanyalar.map((c) => ({
        kampanya: c.name,
        site: c.siteName,
        tür: SINIF_KEY[c.botClass] ? t(SINIF_KEY[c.botClass]) : c.botClass,
        durum: c.status,
        toplam_istek: c.totalRequests,
        engellenen: c.blockedRequests,
        engel_orani: c.totalRequests ? `%${Math.round((c.blockedRequests / c.totalRequests) * 100)}` : "%0",
        zirve_rps: c.peakRps,
        başlangıç: new Date(c.startedAt).toISOString(),
      }));
      if (k.length) return k;
    }
  }
  if (tur === "ai_ajan") {
    return dv.aiAileler.map((a) => ({ ai_ajan: a.ad, olay_sayısı: a.deger }));
  }
  // Varsayılan: günlük trafik özeti (tüm türlerde güvenli fallback).
  return dv.gunler.map((g) => ({
    gün: g.gun,
    toplam_istek: g.issued,
    doğrulanan: g.verified,
    engellenen: g.blocked,
    challenge: g.challenged,
    engel_orani: g.issued ? `%${Math.round((g.blocked / g.issued) * 100)}` : "%0",
  }));
}

/** JSON rapor nesnesi (gerçek veri, tam yapılandırılmış). */
function jsonNesne(tur: ReportType, ad: string, gun: number, dv: DonemVeri, bolumler: string[]) {
  const engelOran = dv.kullanimToplam.issued ? dv.kullanimToplam.blocked / dv.kullanimToplam.issued : 0;
  const base: Record<string, unknown> = {
    rapor: ad,
    tür: tur,
    dönem_gün: gun,
    üretim_anı: new Date().toISOString(),
    özet: {
      toplam_istek: dv.kullanimToplam.issued,
      doğrulanan: dv.kullanimToplam.verified,
      engellenen: dv.kullanimToplam.blocked,
      challenge: dv.kullanimToplam.challenged,
      engelleme_oranı: Math.round(engelOran * 1000) / 10,
      kötü_ün_ip: dv.kotuIpSayisi,
      izlenen_ip: dv.ipToplam,
    },
  };
  if (bolumler.includes("trafik") || bolumler.includes("trend") || tur === "bot_trafik" || tur === "haftalik_ozet") {
    base.günlük_trafik = dv.gunler.map((g) => ({ gün: g.gun, istek: g.issued, engellenen: g.blocked, challenge: g.challenged }));
  }
  if (bolumler.includes("sinif") || tur === "aylik_tehdit") {
    base.saldırı_türleri = dv.sinifSayac;
  }
  if (bolumler.includes("ajan") || tur === "ai_ajan") {
    base.ai_ajanlar = dv.aiAileler;
  }
  if (bolumler.includes("cografya")) {
    base.coğrafi_dağılım = dv.ulkeler;
  }
  if (bolumler.includes("kampanya") || tur === "kampanya_analiz" || tur === "aylik_tehdit") {
    base.kampanyalar = dv.kampanyalar;
  }
  if (bolumler.includes("denetim") || bolumler.includes("olay") || tur === "uyum_denetim") {
    base.uyum = {
      denetim_kaydı: dv.denetimToplam,
      kritik_işlem: dv.denetimKritik,
      açık_olay: dv.uyariAcik,
      çözülen_olay: dv.uyariCozulen,
      toplam_olay: dv.uyariToplam,
      ortalama_mttr_saat: dv.ortMttrSaat,
    };
  }
  return base;
}

/** Yazdırılabilir HTML rapor (tarayıcı "PDF olarak kaydet"). Kendi kendine yeten. */
function pdfHtml(tur: ReportType, ad: string, gun: number, dv: DonemVeri, bolumler: string[], ureten: string, t: Ceviri): string {
  const sablon = SABLON_HARITA[tur];
  const engelOran = dv.kullanimToplam.issued ? Math.round((dv.kullanimToplam.blocked / dv.kullanimToplam.issued) * 100) : 0;
  const now = new Date().toLocaleString("tr-TR");

  const kart = (etiket: string, deger: string, renk = "#1f2937") =>
    `<div class="kpi"><div class="kpi-v" style="color:${renk}">${deger}</div><div class="kpi-e">${etiket}</div></div>`;

  const bolum: string[] = [];

  bolum.push(`<div class="grid">
    ${kart(t("rap.kpi.toplamIstek"), dv.kullanimToplam.issued.toLocaleString("tr-TR"))}
    ${kart(t("rap.kpi.engellenen"), dv.kullanimToplam.blocked.toLocaleString("tr-TR"), "#dc2626")}
    ${kart(t("rap.kpi.engelOran"), "%" + engelOran)}
    ${kart(t("rap.pdf.kotuIp"), String(dv.kotuIpSayisi), "#dc2626")}
  </div>`);

  if (bolumler.includes("sinif") || tur === "aylik_tehdit") {
    const seg = sinifSegment(dv.sinifSayac, t);
    if (seg.length) {
      bolum.push(`<h2>${t("rap.pdf.saldiriTur")}</h2><table><thead><tr><th>${t("rap.pdf.tur")}</th><th class="r">${t("rap.pdf.olay")}</th></tr></thead><tbody>${seg.map((s) => `<tr><td><span class="dot" style="background:${s.renk}"></span>${s.etiket}</td><td class="r">${s.deger.toLocaleString("tr-TR")}</td></tr>`).join("")}</tbody></table>`);
    }
  }
  if (bolumler.includes("ajan") || tur === "ai_ajan") {
    if (dv.aiAileler.length) {
      bolum.push(`<h2>${t("rap.pdf.aiDagilim")}</h2><table><thead><tr><th>${t("rap.pdf.ajan")}</th><th class="r">${t("rap.pdf.olay")}</th></tr></thead><tbody>${dv.aiAileler.map((a) => `<tr><td>${a.ad}</td><td class="r">${a.deger.toLocaleString("tr-TR")}</td></tr>`).join("")}</tbody></table>`);
    }
  }
  if (bolumler.includes("cografya") && dv.ulkeler.length) {
    bolum.push(`<h2>${t("rap.pdf.cografya")}</h2><table><thead><tr><th>${t("rap.pdf.ulke")}</th><th class="r">${t("rap.pdf.olay")}</th></tr></thead><tbody>${dv.ulkeler.map((u) => `<tr><td>${bayrak(u.kod)} ${u.kod}</td><td class="r">${u.deger.toLocaleString("tr-TR")}</td></tr>`).join("")}</tbody></table>`);
  }
  if ((bolumler.includes("kampanya") || tur === "kampanya_analiz" || tur === "aylik_tehdit") && dv.kampanyalar.length) {
    bolum.push(`<h2>${t("rap.pdf.kampanyalar")}</h2><table><thead><tr><th>${t("rap.pdf.kampanya")}</th><th>${t("rap.pdf.site")}</th><th class="r">${t("rap.pdf.istek")}</th><th class="r">${t("rap.pdf.engel")}</th></tr></thead><tbody>${dv.kampanyalar.map((c) => `<tr><td>${c.name}</td><td>${c.siteName}</td><td class="r">${c.totalRequests.toLocaleString("tr-TR")}</td><td class="r">${c.totalRequests ? Math.round((c.blockedRequests / c.totalRequests) * 100) : 0}%</td></tr>`).join("")}</tbody></table>`);
  }
  if (bolumler.includes("denetim") || bolumler.includes("olay") || tur === "uyum_denetim") {
    bolum.push(`<h2>${t("rap.pdf.uyumOlay")}</h2><table><tbody>
      <tr><td>${t("rap.pdf.denetimKayit")}</td><td class="r">${dv.denetimToplam}</td></tr>
      <tr><td>${t("rap.pdf.kritikIslem")}</td><td class="r">${dv.denetimKritik}</td></tr>
      <tr><td>${t("rap.pdf.acikOlay")}</td><td class="r">${dv.uyariAcik}</td></tr>
      <tr><td>${t("rap.pdf.cozulenOlay")}</td><td class="r">${dv.uyariCozulen}</td></tr>
      <tr><td>${t("rap.pdf.ortMttr")}</td><td class="r">${dv.ortMttrSaat} ${t("rap.pdf.saat")}</td></tr>
    </tbody></table>`);
  }
  if (bolumler.includes("trafik") || bolumler.includes("trend") || tur === "bot_trafik" || tur === "haftalik_ozet") {
    const son = dv.gunler.slice(-14);
    bolum.push(`<h2>${t("rap.pdf.gunlukTrafik").replace("{n}", String(son.length))}</h2><table><thead><tr><th>${t("rap.pdf.gun")}</th><th class="r">${t("rap.pdf.istek")}</th><th class="r">${t("rap.pdf.engellenen")}</th><th class="r">${t("rap.pdf.challenge")}</th></tr></thead><tbody>${son.map((g) => `<tr><td>${g.gun}</td><td class="r">${g.issued.toLocaleString("tr-TR")}</td><td class="r">${g.blocked.toLocaleString("tr-TR")}</td><td class="r">${g.challenged.toLocaleString("tr-TR")}</td></tr>`).join("")}</tbody></table>`);
  }

  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${ad}</title><style>
    *{box-sizing:border-box}
    body{font-family:-apple-system,'Segoe UI',Inter,sans-serif;color:#1f2937;margin:0;padding:40px;background:#faf9f4;max-width:900px;margin:0 auto}
    header{border-bottom:3px solid ${sablon.renk};padding-bottom:18px;margin-bottom:24px}
    .brand{display:flex;align-items:center;gap:10px;font-weight:700;font-size:14px;color:${sablon.renk};letter-spacing:.02em}
    h1{font-size:26px;margin:12px 0 4px}
    .meta{color:#6b6a63;font-size:13px}
    h2{font-size:16px;margin:28px 0 10px;color:#1f2937}
    .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:8px 0}
    .kpi{border:1px solid #e6e1d5;border-radius:14px;padding:14px;background:#fff}
    .kpi-v{font-size:24px;font-weight:700}
    .kpi-e{font-size:12px;color:#6b6a63;margin-top:2px}
    table{width:100%;border-collapse:collapse;font-size:13px;margin-top:6px;background:#fff;border:1px solid #e6e1d5;border-radius:12px;overflow:hidden}
    th,td{text-align:left;padding:9px 14px;border-bottom:1px solid #efece3}
    th{background:#f4f1ea;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#6b6a63}
    tr:last-child td{border-bottom:none}
    .r{text-align:right;font-variant-numeric:tabular-nums}
    .dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:7px;vertical-align:middle}
    footer{margin-top:36px;padding-top:16px;border-top:1px solid #e6e1d5;font-size:12px;color:#9c9a90}
    @media print{body{padding:0;background:#fff}.kpi,table{break-inside:avoid}}
  </style></head><body>
    <header>
      <div class="brand">${t("rap.pdf.marka")}</div>
      <h1>${ad}</h1>
      <div class="meta">${t("rap.pdf.meta").replace("{n}", String(gun)).replace("{tarih}", now).replace("{ureten}", ureten)}</div>
    </header>
    ${bolum.join("\n")}
    <footer>${t("rap.pdf.footer")}</footer>
    <script>window.onload=function(){setTimeout(function(){try{window.print()}catch(e){}},400)}</script>
  </body></html>`;
}
