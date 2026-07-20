"use client";

/**
 * Rapor Stüdyosu — istemci bestecisi.
 * ===================================
 * Databox/Metabase tarzı DERİN bir rapor oluşturucu. Dört ana kulvar:
 *   1) Şablon seçimi   → seçilen şablon bölüm setini tohumlar.
 *   2) Bölüm bestecisi → hangi bölümlerin görüneceğini aç/kapa + sırala.
 *   3) Markalama       → başlık, alt başlık, vurgu rengi, logo baş harfleri.
 *   4) CANLI ÖNİZLEME   → gerçek verilerle dolu, PDF sayfası görünümlü belge.
 *
 * Dışa aktarma:
 *   • CSV / JSON → gerçek istemci-tarafı blob indirmesi (gerçek veriden).
 *   • PDF        → window.print() ile çalışan "yazdır / PDF kaydet" (yazdırma
 *                  stili yalnızca önizleme belgesini bırakır).
 *   • Zamanlama  → temsili zamanlanmış-rapor listesi (localStorage), sonraki
 *                  çalışma anı hesaplanır. Gerçek e-posta teslimi sunucuda olur.
 *
 * Kalıcılık (localStorage):
 *   • "specter_rapor_taslak"    → besteci taslağı (şablon + bölümler + markalama).
 *   • "specter_rapor_zamanli"   → temsili zamanlanmış rapor listesi.
 *
 * SSR-güvenli: window/localStorage/print erişimleri effect/handler içinde
 * typeof kontrolüyle korunur.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FileBarChart, LayoutTemplate, ShieldCheck, TrendingUp, Bug, Globe, Bot,
  Megaphone, ListChecks, GaugeCircle, FileDown, FileJson, FileSpreadsheet,
  Printer, Clock, Palette, Check, GripVertical, Plus, Trash2, Pause, Play,
  Mail, Calendar, Eye, Layers,
} from "lucide-react";
import { Panel, Badge, useToast, Modal, Alan, Girdi, Secim, Tooltip } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { DonutDagilim } from "@/components/panel/grafikler";
import { RadarGrafik, Gauge, Histogram } from "@/components/panel/grafikler-ek";
import { botSinifGorsel } from "@/components/panel/bot-sinif-gorsel";
import { bayrak } from "@/lib/flag";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { raporStudyoCeviri } from "./rapor-studyo.i18n";

/** Bu modülde her yerde kullanılan çeviri imzası. */
type Ceviri = (anahtar: string) => string;

/* ------------------------------------------------------------------ Tipler */

export interface StudyoVeriDTO {
  donemGun: number;
  olusturmaZamani: number;
  siteSayisi: number;
  siteAdlari: string[];
  trafikSerisi: { gun: string; deger: number }[];
  toplam: { issued: number; verified: number; blocked: number; challenged: number };
  engellenenSayisi: number;
  olaySayisi: number;
  enUlkeler: { kod: string; deger: number }[];
  enSiniflar: { kod: string; deger: number }[];
  kampanyalar: {
    id: string; name: string; botClass: string;
    totalRequests: number; blockedRequests: number; peakRps: number;
  }[];
  korumaSkoru: number;
  tespitSkoru: number;
  kapsamSkoru: number;
  yanitSkoru: number;
  aktifKampanya: number;
  kritikUyari: number;
}

/** Önizlemedeki bölüm kimlikleri (sıralanabilir). */
type BolumId =
  | "ozet_skorlari"
  | "trafik_trendi"
  | "tehdit_dagilimi"
  | "top_ulkeler"
  | "top_bot_siniflari"
  | "engellenen_olaylar"
  | "kampanyalar"
  | "oneriler";

interface BolumMeta {
  id: BolumId;
  ikon: React.ComponentType<{ className?: string }>;
}

/** Bölüm meta — ad/açıklama i18n'den (`rs.blm.<id>.ad|aciklama`) türetilir. */
const BOLUMLER: BolumMeta[] = [
  { id: "ozet_skorlari", ikon: GaugeCircle },
  { id: "trafik_trendi", ikon: TrendingUp },
  { id: "tehdit_dagilimi", ikon: Bug },
  { id: "top_ulkeler", ikon: Globe },
  { id: "top_bot_siniflari", ikon: Bot },
  { id: "engellenen_olaylar", ikon: ShieldCheck },
  { id: "kampanyalar", ikon: Megaphone },
  { id: "oneriler", ikon: ListChecks },
];

const BOLUM_META = Object.fromEntries(BOLUMLER.map((b) => [b.id, b])) as Record<BolumId, BolumMeta>;

/** Rapor şablonları — seçim bölüm setini tohumlar. */
type SablonId = "yonetici" | "guvenlik_ops" | "uyum" | "aylik_trafik" | "tehdit_istihbarat";

interface SablonMeta {
  id: SablonId;
  ikon: React.ComponentType<{ className?: string }>;
  bolumler: BolumId[];
}

/** Şablon meta — ad/açıklama/başlık i18n'den (`rs.sablon.<id>.*`) türetilir. */
const SABLONLAR: SablonMeta[] = [
  {
    id: "yonetici",
    ikon: LayoutTemplate,
    bolumler: ["ozet_skorlari", "trafik_trendi", "engellenen_olaylar", "oneriler"],
  },
  {
    id: "guvenlik_ops",
    ikon: ShieldCheck,
    bolumler: ["ozet_skorlari", "trafik_trendi", "tehdit_dagilimi", "top_bot_siniflari", "engellenen_olaylar", "kampanyalar", "oneriler"],
  },
  {
    id: "uyum",
    ikon: Check,
    bolumler: ["ozet_skorlari", "engellenen_olaylar", "top_ulkeler", "oneriler"],
  },
  {
    id: "aylik_trafik",
    ikon: TrendingUp,
    bolumler: ["trafik_trendi", "top_ulkeler", "top_bot_siniflari", "engellenen_olaylar"],
  },
  {
    id: "tehdit_istihbarat",
    ikon: Bug,
    bolumler: ["tehdit_dagilimi", "top_ulkeler", "top_bot_siniflari", "kampanyalar", "oneriler"],
  },
];

/** localStorage'da tutulan besteci taslağı. */
interface Taslak {
  sablon: SablonId;
  bolumler: BolumId[]; // sıralı + yalnızca aktif olanlar
  markaBaslik: string;
  markaAltBaslik: string;
  markaRenk: string;
  markaLogo: string; // logo baş harfleri
  donemGun: number;
}

/** localStorage'da tutulan temsili zamanlanmış rapor. */
interface ZamanliRapor {
  id: string;
  ad: string;
  sablon: SablonId;
  siklik: "gunluk" | "haftalik" | "aylik";
  format: "pdf" | "csv" | "json";
  aliciAdlari: string; // virgülle ayrılmış e-posta listesi
  aktif: boolean;
  olusturmaAni: number;
  sonrakiCalisma: number;
}

const TASLAK_ANAHTAR = "specter_rapor_taslak";
const ZAMANLI_ANAHTAR = "specter_rapor_zamanli";

const RENK_SECENEK = [
  { anahtar: "rs.renk.indigo", renk: "#4a41e8" },
  { anahtar: "rs.renk.mavi", renk: "#2f6fed" },
  { anahtar: "rs.renk.mor", renk: "#7c3aed" },
  { anahtar: "rs.renk.zumrut", renk: "#059669" },
  { anahtar: "rs.renk.amber", renk: "#d97706" },
  { anahtar: "rs.renk.kizil", renk: "#dc2626" },
  { anahtar: "rs.renk.gece", renk: "#0f172a" },
];

/** Dil → Intl yerel etiketi (tarih/sayı biçimlendirme için; veri çevirisi değil). */
const YEREL: Record<Dil, string> = {
  tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES",
};

/* ------------------------------------------------------------------ Yardımcılar */

function sonrakiCalismaHesap(siklik: ZamanliRapor["siklik"], baz = Date.now()): number {
  const d = new Date(baz);
  d.setHours(8, 0, 0, 0); // sabah 08:00 teslim varsayımı
  if (siklik === "gunluk") d.setDate(d.getDate() + 1);
  else if (siklik === "haftalik") d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1);
  return d.getTime();
}

function tarihMetin(ts: number, dil: Dil): string {
  return new Date(ts).toLocaleDateString(YEREL[dil], { day: "2-digit", month: "long", year: "numeric" });
}

function tamTarihMetin(ts: number, dil: Dil): string {
  return new Date(ts).toLocaleString(YEREL[dil], { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function sayiKisa(n: number, dil: Dil): string {
  return n.toLocaleString(YEREL[dil]);
}

/* ------------------------------------------------------------------ Ana bileşen */

export function RaporStudyoIstemci({
  dil,
  veri,
  benimAdim,
  planim,
}: {
  dil: Dil;
  veri: StudyoVeriDTO;
  benimAdim: string;
  planim: string;
}) {
  const t = (anahtar: string) => raporStudyoCeviri(anahtar, dil);
  const { goster } = useToast();

  // --- Taslak durumu (localStorage'dan yüklenir) ---
  const varsayilanSablon = SABLONLAR[0];
  const [taslak, setTaslak] = useState<Taslak>({
    sablon: varsayilanSablon.id,
    bolumler: varsayilanSablon.bolumler,
    markaBaslik: t(`rs.sablon.${varsayilanSablon.id}.baslik`),
    markaAltBaslik: t(`rs.sablon.${varsayilanSablon.id}.altBaslik`),
    markaRenk: "#4a41e8",
    markaLogo: "SP",
    donemGun: veri.donemGun,
  });
  const [yuklendi, setYuklendi] = useState(false);

  // --- Zamanlanmış raporlar (localStorage) ---
  const [zamanli, setZamanli] = useState<ZamanliRapor[]>([]);
  const [zamanModalAcik, setZamanModalAcik] = useState(false);

  // --- Sürükle-bırak sıralama durumu ---
  const surukleRef = useRef<BolumId | null>(null);

  // İlk yüklemede localStorage'dan oku (SSR-güvenli).
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const ham = window.localStorage.getItem(TASLAK_ANAHTAR);
      if (ham) {
        const p = JSON.parse(ham) as Partial<Taslak>;
        setTaslak((eski) => ({
          ...eski,
          ...p,
          // Geçersiz bölüm id'lerini süz.
          bolumler: Array.isArray(p.bolumler)
            ? p.bolumler.filter((b): b is BolumId => b in BOLUM_META)
            : eski.bolumler,
        }));
      }
      const hamZ = window.localStorage.getItem(ZAMANLI_ANAHTAR);
      if (hamZ) {
        const arr = JSON.parse(hamZ) as ZamanliRapor[];
        if (Array.isArray(arr)) setZamanli(arr);
      }
    } catch {
      // Bozuk kayıt → varsayılanlarla devam.
    }
    setYuklendi(true);
  }, []);

  // Taslak değişince kaydet (yüklendikten sonra).
  useEffect(() => {
    if (!yuklendi || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(TASLAK_ANAHTAR, JSON.stringify(taslak));
    } catch {
      /* kota/gizli mod → sessizce geç */
    }
  }, [taslak, yuklendi]);

  // Zamanlı liste değişince kaydet.
  useEffect(() => {
    if (!yuklendi || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(ZAMANLI_ANAHTAR, JSON.stringify(zamanli));
    } catch {
      /* sessizce geç */
    }
  }, [zamanli, yuklendi]);

  /* --- Şablon seç: bölüm setini + varsayılan başlıkları tohumlar --- */
  function sablonSec(s: SablonMeta) {
    setTaslak((eski) => ({
      ...eski,
      sablon: s.id,
      bolumler: s.bolumler,
      // Başlık kullanıcı tarafından özelleştirilmediyse şablon başlığını al.
      markaBaslik: t(`rs.sablon.${s.id}.baslik`),
      markaAltBaslik: t(`rs.sablon.${s.id}.altBaslik`),
    }));
    goster({
      tip: "bilgi",
      baslik: t("rs.toast.sablonYuklendiBaslik").replace("{ad}", t(`rs.sablon.${s.id}.ad`)),
      aciklama: t("rs.toast.sablonYuklendiAciklama").replace("{n}", String(s.bolumler.length)),
    });
  }

  /* --- Bölüm aç/kapa --- */
  function bolumToggle(id: BolumId) {
    setTaslak((eski) => {
      const acik = eski.bolumler.includes(id);
      if (acik) return { ...eski, bolumler: eski.bolumler.filter((b) => b !== id) };
      // Eklerken BOLUMLER doğal sırasına göre araya yerleştir.
      const yeni = [...eski.bolumler, id].sort(
        (a, b) => BOLUMLER.findIndex((x) => x.id === a) - BOLUMLER.findIndex((x) => x.id === b),
      );
      return { ...eski, bolumler: yeni };
    });
  }

  /* --- Sürükle-bırak ile yeniden sıralama --- */
  function surukleBaslat(id: BolumId) {
    surukleRef.current = id;
  }
  function uzerineBirak(hedef: BolumId) {
    const kaynak = surukleRef.current;
    surukleRef.current = null;
    if (!kaynak || kaynak === hedef) return;
    setTaslak((eski) => {
      const dizi = [...eski.bolumler];
      const ki = dizi.indexOf(kaynak);
      const hi = dizi.indexOf(hedef);
      if (ki < 0 || hi < 0) return eski;
      dizi.splice(ki, 1);
      dizi.splice(hi, 0, kaynak);
      return { ...eski, bolumler: dizi };
    });
  }

  /* --- Dışa aktarma verisi (gerçek) --- */
  const raporNesnesi = useMemo(() => {
    const tsl = taslak;
    // Guard BÖLEN üzerinde olmalı (olaySayisi); aksi halde issued>0 ama olay yokken
    // dışa aktarılan raporda oran Infinity/NaN çıkıyordu.
    const oran = veri.olaySayisi ? veri.engellenenSayisi / veri.olaySayisi : 0;
    return {
      meta: {
        baslik: tsl.markaBaslik,
        altBaslik: tsl.markaAltBaslik,
        sablon: tsl.sablon,
        olusturan: benimAdim,
        plan: planim,
        olusturmaAni: new Date(veri.olusturmaZamani).toISOString(),
        donemGun: tsl.donemGun,
        bolumler: tsl.bolumler,
      },
      ozet: {
        korumaSkoru: veri.korumaSkoru,
        tespitSkoru: veri.tespitSkoru,
        kapsamSkoru: veri.kapsamSkoru,
        yanitSkoru: veri.yanitSkoru,
        siteSayisi: veri.siteSayisi,
        aktifKampanya: veri.aktifKampanya,
        kritikUyari: veri.kritikUyari,
      },
      trafik: {
        toplamIstek: veri.toplam.issued,
        dogrulanan: veri.toplam.verified,
        engellenen: veri.toplam.blocked,
        mucadele: veri.toplam.challenged,
        olaySayisi: veri.olaySayisi,
        engellenenOlay: veri.engellenenSayisi,
        engellemeOrani: Math.round(oran * 1000) / 10,
        gunlukSeri: veri.trafikSerisi,
      },
      enUlkeler: veri.enUlkeler,
      enSiniflar: veri.enSiniflar,
      kampanyalar: veri.kampanyalar,
    };
  }, [taslak, veri, benimAdim, planim]);

  function dosyaIndir(icerik: string, tur: string, ad: string) {
    if (typeof window === "undefined") return;
    const blob = new Blob(["﻿" + icerik], { type: `${tur};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = ad;
    a.click();
    URL.revokeObjectURL(url);
  }

  function jsonDisaAktar() {
    dosyaIndir(JSON.stringify(raporNesnesi, null, 2), "application/json", `specter-rapor-${taslak.sablon}.json`);
    goster({ tip: "basari", baslik: t("rs.toast.jsonAktarildi") });
  }

  function csvDisaAktar() {
    // Birden çok mantıksal tabloyu tek CSV'de bölümlerle ver. Başlıklar rapor
    // içeriğidir → kullanıcının diline çevrilir; sayı/tarih verisi değişmez.
    const s: string[] = [];
    const q = (v: string | number) => {
      const m = String(v);
      return /[",\n]/.test(m) ? `"${m.replace(/"/g, '""')}"` : m;
    };
    s.push(`Veylify,${q(taslak.markaBaslik)}`);
    s.push(`${q(t("rs.marka.donem"))},${taslak.donemGun}`);
    s.push(`${q(t("rs.belge.hazirlayan").replace(": {v}", ""))},${q(benimAdim)}`);
    s.push(`${q(t("rs.belge.donem"))},${q(tamTarihMetin(veri.olusturmaZamani, dil))}`);
    s.push("");
    s.push(`# ${q(t("rs.blm.ozet_skorlari.ad"))}`);
    s.push(`${q(t("rs.icerik.korumaSkoru"))},${veri.korumaSkoru}`);
    s.push(`${q(t("rs.icerik.tespit"))},${veri.tespitSkoru}`);
    s.push(`${q(t("rs.icerik.kapsam"))},${veri.kapsamSkoru}`);
    s.push(`${q(t("rs.icerik.yanit"))},${veri.yanitSkoru}`);
    s.push(`${q(t("rs.icerik.site"))},${veri.siteSayisi}`);
    s.push(`${q(t("rs.icerik.aktifKampanya"))},${veri.aktifKampanya}`);
    s.push("");
    s.push(`# ${q(t("rs.blm.trafik_trendi.ad"))}`);
    s.push(`${q(t("rs.icerik.toplamIstek"))},${veri.toplam.issued}`);
    s.push(`${q(t("rs.icerik.dogrulanan"))},${veri.toplam.verified}`);
    s.push(`${q(t("rs.icerik.engellenen"))},${veri.toplam.blocked}`);
    s.push(`${q(t("rs.icerik.mucadele"))},${veri.toplam.challenged}`);
    s.push(`${q(t("rs.icerik.toplamOlay"))},${veri.engellenenSayisi}`);
    s.push("");
    s.push(`# ${q(t("rs.blm.top_ulkeler.ad"))}`);
    for (const u of veri.enUlkeler) s.push(`${u.kod},${u.deger}`);
    s.push("");
    s.push(`# ${q(t("rs.blm.top_bot_siniflari.ad"))}`);
    s.push(`${q(t("rs.icerik.sinif"))},${q(t("rs.icerik.olay"))}`);
    for (const c of veri.enSiniflar) s.push(`${q(t(`rs.sinif.${c.kod}`))},${c.deger}`);
    s.push("");
    s.push(`# ${q(t("rs.blm.kampanyalar.ad"))}`);
    s.push(`${q(t("rs.icerik.kampanya"))},${q(t("rs.icerik.sinif"))},${q(t("rs.icerik.istek"))},${q(t("rs.icerik.engellenen"))},${q(t("rs.icerik.zirveRps"))}`);
    for (const k of veri.kampanyalar) s.push(`${q(k.name)},${q(t(`rs.sinif.${k.botClass}`))},${k.totalRequests},${k.blockedRequests},${k.peakRps}`);
    dosyaIndir(s.join("\n"), "text/csv", `specter-rapor-${taslak.sablon}.csv`);
    goster({ tip: "basari", baslik: t("rs.toast.csvAktarildi") });
  }

  function pdfYazdir() {
    if (typeof window === "undefined") return;
    // Yazdırma stili (aşağıdaki <style>) yalnızca #rapor-belge alanını bırakır.
    goster({ tip: "bilgi", baslik: t("rs.toast.yazdirBaslik"), aciklama: t("rs.toast.yazdirAciklama") });
    window.setTimeout(() => window.print(), 250);
  }

  /* --- Zamanlanmış rapor ekle/sil/duraklat --- */
  function zamanliEkle(z: Omit<ZamanliRapor, "id" | "olusturmaAni" | "sonrakiCalisma">) {
    const yeni: ZamanliRapor = {
      ...z,
      id: `z_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      olusturmaAni: Date.now(),
      sonrakiCalisma: sonrakiCalismaHesap(z.siklik),
    };
    setZamanli((l) => [yeni, ...l]);
    setZamanModalAcik(false);
    goster({ tip: "basari", baslik: t("rs.toast.zamanEklendiBaslik"), aciklama: t("rs.toast.zamanEklendiAciklama") });
  }
  function zamanliSil(id: string) {
    setZamanli((l) => l.filter((z) => z.id !== id));
    goster({ tip: "bilgi", baslik: t("rs.toast.zamanKaldirildi") });
  }
  function zamanliDurumDegis(id: string) {
    setZamanli((l) => l.map((z) => (z.id === id ? { ...z, aktif: !z.aktif } : z)));
  }

  const seciliSablon = SABLONLAR.find((s) => s.id === taslak.sablon) ?? SABLONLAR[0];

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 px-6 pt-6 pb-14 lg:px-10">
      {/* Yazdırma stili: yalnızca belge alanını bırak. */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #rapor-belge, #rapor-belge * { visibility: visible !important; }
          #rapor-belge {
            position: absolute; left: 0; top: 0; width: 100%;
            box-shadow: none !important; border: none !important; border-radius: 0 !important;
          }
          @page { margin: 16mm; }
        }
      `}</style>

      {/* Tanıtım şeridi */}
      <div className="no-print flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <FileBarChart className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("rs.tanit.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {t("rs.tanit.metin1")}
            <span className="font-medium text-slate-ink">/panel/raporlar</span>{t("rs.tanit.metin2")}
          </p>
        </div>
      </div>

      {/* ÜST: iki kulvar → sol besteci paneli, sağ canlı önizleme */}
      <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
        {/* ---------------- SOL: BESTECİ ---------------- */}
        <div className="no-print space-y-6">
          {/* Şablon seçimi */}
          <Panel baslik={t("rs.kulvar.sablon")}>
            <div className="grid gap-2.5">
              {SABLONLAR.map((s) => {
                const Ikon = s.ikon;
                const secili = taslak.sablon === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => sablonSec(s)}
                    className={cn(
                      "flex items-start gap-3 rounded-2xl border p-3.5 text-left transition",
                      secili
                        ? "border-brand-400 bg-brand-50/50 ring-1 ring-brand-200"
                        : "border-line hover:border-line-strong hover:bg-canvas/50",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-xl",
                        secili ? "bg-brand-600 text-white" : "bg-canvas text-slate-muted",
                      )}
                    >
                      <Ikon className="size-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-semibold text-slate-ink">{t(`rs.sablon.${s.id}.ad`)}</span>
                        {secili && <Check className="size-4 text-brand-600" />}
                      </div>
                      <p className="mt-0.5 text-[12.5px] leading-snug text-slate-muted">{t(`rs.sablon.${s.id}.aciklama`)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Panel>

          {/* Bölüm bestecisi */}
          <Panel
            baslik={t("rs.kulvar.bolumler")}
            sagUst={<Badge ton="brand">{t("rs.bolum.aktif").replace("{n}", String(taslak.bolumler.length))}</Badge>}
          >
            <p className="mb-3 text-[12.5px] text-slate-muted">
              {t("rs.bolum.yardim")}
            </p>
            <ul className="space-y-1.5">
              {BOLUMLER.map((b) => {
                const acik = taslak.bolumler.includes(b.id);
                const sira = taslak.bolumler.indexOf(b.id);
                const Ikon = b.ikon;
                return (
                  <li
                    key={b.id}
                    draggable={acik}
                    onDragStart={() => acik && surukleBaslat(b.id)}
                    onDragOver={(e) => acik && e.preventDefault()}
                    onDrop={() => acik && uzerineBirak(b.id)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition",
                      acik ? "border-line bg-surface cursor-grab active:cursor-grabbing" : "border-dashed border-line bg-canvas/30",
                    )}
                  >
                    {acik ? (
                      <GripVertical className="size-4 shrink-0 text-slate-faint" />
                    ) : (
                      <span className="size-4 shrink-0" />
                    )}
                    <Ikon className={cn("size-4 shrink-0", acik ? "text-brand-600" : "text-slate-faint")} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-[13.5px] font-medium", acik ? "text-slate-ink" : "text-slate-muted")}>
                          {t(`rs.blm.${b.id}.ad`)}
                        </span>
                        {acik && sira >= 0 && (
                          <span className="num rounded bg-brand-50 px-1.5 text-[10px] font-semibold text-brand-600">
                            {sira + 1}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-[11.5px] text-slate-faint">{t(`rs.blm.${b.id}.aciklama`)}</p>
                    </div>
                    <button
                      onClick={() => bolumToggle(b.id)}
                      aria-label={(acik ? t("rs.bolum.kapatAria") : t("rs.bolum.ekleAria")).replace("{ad}", t(`rs.blm.${b.id}.ad`))}
                      className={cn(
                        "relative h-5 w-9 shrink-0 rounded-full transition",
                        acik ? "bg-brand-600" : "bg-slate-300",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 size-4 rounded-full bg-white shadow transition-all",
                          acik ? "left-4" : "left-0.5",
                        )}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </Panel>

          {/* Markalama */}
          <Panel baslik={<span className="flex items-center gap-2"><Palette className="size-4 text-brand-600" /> {t("rs.kulvar.markalama")}</span>}>
            <div className="space-y-3.5">
              <Alan etiket={t("rs.marka.baslik")}>
                <Girdi
                  value={taslak.markaBaslik}
                  onChange={(e) => setTaslak((eski) => ({ ...eski, markaBaslik: e.target.value }))}
                  placeholder={t("rs.marka.baslikPh")}
                />
              </Alan>
              <Alan etiket={t("rs.marka.altBaslik")} opsiyonel>
                <Girdi
                  value={taslak.markaAltBaslik}
                  onChange={(e) => setTaslak((eski) => ({ ...eski, markaAltBaslik: e.target.value }))}
                  placeholder={t("rs.marka.altBaslikPh")}
                />
              </Alan>
              <div className="grid grid-cols-2 gap-3">
                <Alan etiket={t("rs.marka.logo")}>
                  <Girdi
                    value={taslak.markaLogo}
                    maxLength={3}
                    onChange={(e) => setTaslak((eski) => ({ ...eski, markaLogo: e.target.value.toUpperCase().slice(0, 3) }))}
                    placeholder="SP"
                  />
                </Alan>
                <Alan etiket={t("rs.marka.donem")}>
                  <Secim
                    value={taslak.donemGun}
                    onChange={(e) => setTaslak((eski) => ({ ...eski, donemGun: Number(e.target.value) }))}
                  >
                    <option value={7}>{t("rs.marka.donem7")}</option>
                    <option value={14}>{t("rs.marka.donem14")}</option>
                    <option value={30}>{t("rs.marka.donem30")}</option>
                  </Secim>
                </Alan>
              </div>
              <div>
                <span className="mb-1.5 block text-sm font-medium text-slate-ink">{t("rs.marka.vurguRenk")}</span>
                <div className="flex flex-wrap gap-2">
                  {RENK_SECENEK.map((r) => (
                    <Tooltip key={r.renk} metin={t(r.anahtar)}>
                      <button
                        onClick={() => setTaslak((eski) => ({ ...eski, markaRenk: r.renk }))}
                        aria-label={t("rs.marka.vurguAria").replace("{ad}", t(r.anahtar))}
                        className={cn(
                          "size-8 rounded-full ring-2 ring-offset-2 transition",
                          taslak.markaRenk === r.renk ? "ring-brand-400" : "ring-transparent hover:ring-line-strong",
                        )}
                        style={{ background: r.renk }}
                      />
                    </Tooltip>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          {/* Dışa aktarma + zamanlama aksiyonları */}
          <Panel baslik={t("rs.kulvar.disaAktar")}>
            <div className="grid grid-cols-2 gap-2.5">
              <Button variant="accent" onClick={pdfYazdir} className="justify-start">
                <Printer className="size-4" /> {t("rs.aktar.pdf")}
              </Button>
              <Button variant="outline" onClick={csvDisaAktar} className="justify-start">
                <FileSpreadsheet className="size-4" /> {t("rs.aktar.csv")}
              </Button>
              <Button variant="outline" onClick={jsonDisaAktar} className="justify-start">
                <FileJson className="size-4" /> {t("rs.aktar.json")}
              </Button>
              <Button variant="outline" onClick={() => setZamanModalAcik(true)} className="justify-start">
                <Clock className="size-4" /> {t("rs.aktar.zamanla")}
              </Button>
            </div>
            <p className="mt-3 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-slate-faint">
              <FileDown className="mt-0.5 size-3 shrink-0" />
              {t("rs.aktar.not1")}
              <span className="font-medium text-slate-muted">{t("rs.aktar.notVurgu")}</span>{t("rs.aktar.not2")}
            </p>
          </Panel>
        </div>

        {/* ---------------- SAĞ: CANLI ÖNİZLEME ---------------- */}
        <div className="space-y-3">
          <div className="no-print flex items-center justify-between">
            <span className="flex items-center gap-2 text-[13px] font-medium text-slate-muted">
              <Eye className="size-4" /> {t("rs.onizleme.baslik")}
            </span>
            <span className="flex items-center gap-2 text-[12px] text-slate-faint">
              <Layers className="size-3.5" /> {t(`rs.sablon.${seciliSablon.id}.ad`)}
            </span>
          </div>

          <RaporBelge taslak={taslak} veri={veri} benimAdim={benimAdim} dil={dil} t={t} />
        </div>
      </div>

      {/* Zamanlanmış raporlar listesi */}
      <Panel
        baslik={<span className="flex items-center gap-2"><Clock className="size-4 text-brand-600" /> {t("rs.zaman.baslik")}</span>}
        sagUst={
          <Button variant="outline" size="sm" onClick={() => setZamanModalAcik(true)}>
            <Plus className="size-4" /> {t("rs.zaman.yeni")}
          </Button>
        }
        className="no-print"
      >
        {zamanli.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-canvas/30 px-6 py-12 text-center">
            <span className="mb-3 grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <Calendar className="size-6" />
            </span>
            <p className="text-sm font-semibold text-slate-ink">{t("rs.zaman.bosBaslik")}</p>
            <p className="mt-1 max-w-sm text-[13px] text-slate-muted">
              {t("rs.zaman.bosMetin")}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {zamanli.map((z) => {
              const sabl = SABLONLAR.find((s) => s.id === z.sablon);
              const alicilar = z.aliciAdlari.split(",").map((a) => a.trim()).filter(Boolean);
              return (
                <div
                  key={z.id}
                  className={cn(
                    "flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 transition",
                    z.aktif ? "border-line bg-surface" : "border-line bg-canvas/40 opacity-70",
                  )}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <FileBarChart className="size-4.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[14px] font-semibold text-slate-ink">{z.ad}</span>
                      <Badge ton="gri">{sabl ? t(`rs.sablon.${sabl.id}.ad`) : z.sablon}</Badge>
                      <Badge ton="brand">{t(`rs.siklik.${z.siklik}`)}</Badge>
                      <Badge ton="mavi">{z.format.toUpperCase()}</Badge>
                      {z.aktif ? <Badge ton="yesil">{t("rs.zaman.aktif")}</Badge> : <Badge ton="sari">{t("rs.zaman.duraklatildi")}</Badge>}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[12px] text-slate-muted">
                      <span className="flex items-center gap-1">
                        <Mail className="size-3" /> {t("rs.zaman.alici").replace("{n}", String(alicilar.length))}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" /> {t("rs.zaman.sonraki").replace("{v}", tamTarihMetin(z.sonrakiCalisma, dil))}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Tooltip metin={z.aktif ? t("rs.zaman.duraklat") : t("rs.zaman.surdur")}>
                      <button
                        onClick={() => zamanliDurumDegis(z.id)}
                        aria-label={z.aktif ? t("rs.zaman.duraklat") : t("rs.zaman.surdur")}
                        className="rounded-lg p-2 text-slate-faint transition hover:bg-canvas hover:text-slate-ink"
                      >
                        {z.aktif ? <Pause className="size-4" /> : <Play className="size-4" />}
                      </button>
                    </Tooltip>
                    <Tooltip metin={t("rs.zaman.sil")}>
                      <button
                        onClick={() => zamanliSil(z.id)}
                        aria-label={t("rs.zaman.sil")}
                        className="rounded-lg p-2 text-slate-faint transition hover:bg-danger-soft hover:text-danger2"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </Tooltip>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <ZamanlamaModal
        acik={zamanModalAcik}
        kapat={() => setZamanModalAcik(false)}
        onEkle={zamanliEkle}
        varsayilanSablon={taslak.sablon}
        varsayilanAd={taslak.markaBaslik}
        dil={dil}
        t={t}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ Belge önizleme
 * PDF sayfası görünümlü belge. Yazdırma bu alanı bırakır (#rapor-belge). */

function RaporBelge({
  taslak,
  veri,
  benimAdim,
  dil,
  t,
}: {
  taslak: Taslak;
  veri: StudyoVeriDTO;
  benimAdim: string;
  dil: Dil;
  t: Ceviri;
}) {
  const renk = taslak.markaRenk;
  const donemBaslangic = veri.olusturmaZamani - taslak.donemGun * 86400000;

  return (
    <div
      id="rapor-belge"
      className="overflow-hidden rounded-2xl border border-line bg-white shadow-lift"
    >
      {/* Markalı başlık */}
      <div className="px-8 pt-8 pb-6" style={{ borderTop: `5px solid ${renk}` }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="grid size-12 place-items-center rounded-xl text-[18px] font-bold text-white"
              style={{ background: renk }}
            >
              {taslak.markaLogo || "SP"}
            </span>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: renk }}>
                {t("rs.belge.marka")}
              </div>
              <h1 className="text-[22px] font-bold leading-tight text-slate-ink">{taslak.markaBaslik || t("rs.belge.varsayilanBaslik")}</h1>
              {taslak.markaAltBaslik && (
                <p className="mt-0.5 text-[13px] text-slate-muted">{taslak.markaAltBaslik}</p>
              )}
            </div>
          </div>
          <div className="shrink-0 text-right text-[12px] text-slate-muted">
            <div className="font-medium text-slate-ink">{t("rs.belge.donem")}</div>
            <div>{tarihMetin(donemBaslangic, dil)} –</div>
            <div>{tarihMetin(veri.olusturmaZamani, dil)}</div>
            <div className="mt-1.5 text-slate-faint">{t("rs.belge.hazirlayan").replace("{v}", benimAdim)}</div>
          </div>
        </div>
      </div>

      <div className="border-t border-line px-8 py-6" style={{ minHeight: 400 }}>
        {taslak.bolumler.length === 0 ? (
          <div className="grid place-items-center py-20 text-center text-sm text-slate-faint">
            {t("rs.onizleme.bosBolum")}
          </div>
        ) : (
          <div className="space-y-8">
            {taslak.bolumler.map((id, i) => (
              <BolumRender key={id} id={id} sira={i + 1} veri={veri} renk={renk} dil={dil} t={t} />
            ))}
          </div>
        )}
      </div>

      {/* Altbilgi */}
      <div className="flex items-center justify-between border-t border-line bg-canvas/40 px-8 py-3 text-[11px] text-slate-faint">
        <span>{t("rs.belge.altbilgi")}</span>
        <span>{tamTarihMetin(veri.olusturmaZamani, dil)}</span>
      </div>
    </div>
  );
}

/** Tek bir belge bölümünü render eder. */
function BolumRender({
  id,
  sira,
  veri,
  renk,
  dil,
  t,
}: {
  id: BolumId;
  sira: number;
  veri: StudyoVeriDTO;
  renk: string;
  dil: Dil;
  t: Ceviri;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2 border-b border-line pb-2">
        <span
          className="num grid size-6 place-items-center rounded-md text-[11px] font-bold text-white"
          style={{ background: renk }}
        >
          {sira}
        </span>
        <h2 className="text-[15px] font-bold text-slate-ink">{t(`rs.blm.${id}.ad`)}</h2>
      </div>
      <BolumIcerik id={id} veri={veri} renk={renk} dil={dil} t={t} />
    </section>
  );
}

function BolumIcerik({ id, veri, renk, dil, t }: { id: BolumId; veri: StudyoVeriDTO; renk: string; dil: Dil; t: Ceviri }) {
  switch (id) {
    case "ozet_skorlari":
      return <OzetSkorlari veri={veri} renk={renk} dil={dil} t={t} />;
    case "trafik_trendi":
      return <TrafikTrendi veri={veri} renk={renk} dil={dil} t={t} />;
    case "tehdit_dagilimi":
      return <TehditDagilimi veri={veri} renk={renk} dil={dil} t={t} />;
    case "top_ulkeler":
      return <TopUlkeler veri={veri} renk={renk} dil={dil} t={t} />;
    case "top_bot_siniflari":
      return <TopSiniflar veri={veri} dil={dil} t={t} />;
    case "engellenen_olaylar":
      return <EngellenenOlaylar veri={veri} renk={renk} dil={dil} t={t} />;
    case "kampanyalar":
      return <Kampanyalar veri={veri} dil={dil} t={t} />;
    case "oneriler":
      return <Oneriler veri={veri} renk={renk} dil={dil} t={t} />;
    default:
      return null;
  }
}

/* ---- Bölüm içerikleri (gerçek veriyle) ---- */

function StatBlok({ etiket, deger, alt, renk }: { etiket: string; deger: string; alt?: string; renk?: string }) {
  return (
    <div className="rounded-xl border border-line bg-canvas/30 px-4 py-3">
      <div className="text-[11px] font-medium uppercase tracking-wide text-slate-faint">{etiket}</div>
      <div className="num mt-1 text-[26px] font-bold leading-none" style={{ color: renk ?? "#0f172a" }}>
        {deger}
      </div>
      {alt && <div className="mt-1 text-[11.5px] text-slate-muted">{alt}</div>}
    </div>
  );
}

function OzetSkorlari({ veri, renk, dil, t }: { veri: StudyoVeriDTO; renk: string; dil: Dil; t: Ceviri }) {
  const altlar = [
    { anahtar: "rs.icerik.tespit", d: veri.tespitSkoru },
    { anahtar: "rs.icerik.kapsam", d: veri.kapsamSkoru },
    { anahtar: "rs.icerik.yanit", d: veri.yanitSkoru },
  ];
  // Radar için dört skor ekseni (koruma + üç alt metrik) — tek bakışta profil.
  const radarEksenler = [
    { etiket: t("rs.icerik.korumaSkoru"), deger: veri.korumaSkoru },
    { etiket: t("rs.icerik.tespit"), deger: veri.tespitSkoru },
    { etiket: t("rs.icerik.kapsam"), deger: veri.kapsamSkoru },
    { etiket: t("rs.icerik.yanit"), deger: veri.yanitSkoru },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[168px_168px_minmax(0,1fr)]">
        {/* Skor halkası (inline SVG) */}
        <div className="flex flex-col items-center justify-center rounded-xl border border-line bg-canvas/30 py-4">
          <SkorHalka deger={veri.korumaSkoru} renk={renk} />
          <div className="mt-2 text-[12px] font-medium text-slate-muted">{t("rs.icerik.korumaSkoru")}</div>
        </div>
        {/* Skor profili radar — dört skoru aynı düzlemde göster */}
        <div className="flex flex-col items-center justify-center rounded-xl border border-line bg-canvas/30 py-4">
          <RadarGrafik eksenler={radarEksenler} boyut={148} renk={renk} />
        </div>
        {/* Alt metrik çubukları */}
        <div className="flex flex-col justify-center space-y-3">
          {altlar.map((a) => (
            <div key={a.anahtar}>
              <div className="mb-1 flex items-center justify-between text-[12px]">
                <span className="font-medium text-slate-ink">{t(a.anahtar)}</span>
                <span className="num font-semibold text-slate-muted">{a.d}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-canvas">
                <div className="h-full rounded-full" style={{ width: `${a.d}%`, background: renk }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <StatBlok etiket={t("rs.icerik.site")} deger={sayiKisa(veri.siteSayisi, dil)} />
        <StatBlok etiket={t("rs.icerik.aktifKampanya")} deger={sayiKisa(veri.aktifKampanya, dil)} renk={veri.aktifKampanya > 0 ? "#dc2626" : undefined} />
        <StatBlok etiket={t("rs.icerik.kritikUyari")} deger={sayiKisa(veri.kritikUyari, dil)} renk={veri.kritikUyari > 0 ? "#d97706" : undefined} />
      </div>
    </div>
  );
}

function SkorHalka({ deger, renk }: { deger: number; renk: string }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const dolu = (Math.max(0, Math.min(100, deger)) / 100) * c;
  return (
    <svg width={120} height={120} viewBox="0 0 120 120">
      <circle cx={60} cy={60} r={r} fill="none" stroke="#eef1f6" strokeWidth={10} />
      <circle
        cx={60}
        cy={60}
        r={r}
        fill="none"
        stroke={renk}
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={`${dolu} ${c}`}
        transform="rotate(-90 60 60)"
      />
      <text x={60} y={58} textAnchor="middle" className="num" fontSize={30} fontWeight={700} fill="#0f172a">
        {deger}
      </text>
      <text x={60} y={78} textAnchor="middle" fontSize={11} fill="#64748b">
        / 100
      </text>
    </svg>
  );
}

function TrafikTrendi({ veri, renk, dil, t }: { veri: StudyoVeriDTO; renk: string; dil: Dil; t: Ceviri }) {
  const seri = veri.trafikSerisi;
  const maks = Math.max(1, ...seri.map((s) => s.deger));
  const W = 720;
  const H = 180;
  const pad = 8;
  const noktalar = seri.map((s, i) => {
    const x = pad + (i / Math.max(1, seri.length - 1)) * (W - pad * 2);
    const y = H - pad - (s.deger / maks) * (H - pad * 2);
    return { x, y };
  });
  const cizgi = noktalar.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const alan = `${cizgi} L${noktalar[noktalar.length - 1]?.x.toFixed(1) ?? W},${H - pad} L${pad},${H - pad} Z`;

  return (
    <div>
      <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBlok etiket={t("rs.icerik.toplamIstek")} deger={sayiKisa(veri.toplam.issued, dil)} renk={renk} />
        <StatBlok etiket={t("rs.icerik.dogrulanan")} deger={sayiKisa(veri.toplam.verified, dil)} />
        <StatBlok etiket={t("rs.icerik.engellenen")} deger={sayiKisa(veri.toplam.blocked, dil)} renk="#dc2626" />
        <StatBlok etiket={t("rs.icerik.mucadele")} deger={sayiKisa(veri.toplam.challenged, dil)} renk="#d97706" />
      </div>
      <div className="rounded-xl border border-line bg-canvas/20 p-3">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="trafikGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={renk} stopOpacity={0.28} />
              <stop offset="100%" stopColor={renk} stopOpacity={0} />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={pad} x2={W - pad} y1={H * f} y2={H * f} stroke="#eef1f6" strokeWidth={1} />
          ))}
          <path d={alan} fill="url(#trafikGrad)" />
          <path d={cizgi} fill="none" stroke={renk} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        </svg>
        <div className="mt-1 flex justify-between text-[10.5px] text-slate-faint">
          <span>{seri[0]?.gun ?? ""}</span>
          <span>{seri[seri.length - 1]?.gun ?? ""}</span>
        </div>
      </div>
    </div>
  );
}

function TehditDagilimi({ veri, dil, t }: { veri: StudyoVeriDTO; renk: string; dil: Dil; t: Ceviri }) {
  // İnsan/iyi-bot hariç tehdit sınıfları.
  const tehdit = veri.enSiniflar.filter((s) => s.kod !== "human" && s.kod !== "good_bot");
  if (tehdit.length === 0) return <BosSatir metin={t("rs.icerik.bosTehdit")} />;
  // Donut segmentleri — her tehdit sınıfı kendi görsel kimliğiyle (renk-kodlu).
  const segmentler = tehdit.map((s) => ({
    etiket: t(`rs.sinif.${s.kod}`),
    deger: s.deger,
    renk: botSinifGorsel(s.kod).renk,
  }));
  return <DonutDagilim segmentler={segmentler} merkezEtiket={t("rs.icerik.olay")} />;
}

function TopUlkeler({ veri, renk, dil, t }: { veri: StudyoVeriDTO; renk: string; dil: Dil; t: Ceviri }) {
  const maks = Math.max(1, ...veri.enUlkeler.map((u) => u.deger));
  if (veri.enUlkeler.length === 0) return <BosSatir metin={t("rs.icerik.bosCografya")} />;
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {veri.enUlkeler.map((u) => (
        <div key={u.kod} className="flex items-center gap-2.5 rounded-lg border border-line bg-canvas/20 px-3 py-2">
          <span className="text-[16px] leading-none">{bayrak(u.kod)}</span>
          <span className="w-9 shrink-0 text-[12.5px] font-semibold text-slate-ink">{u.kod}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-canvas">
            <div className="h-full rounded-full" style={{ width: `${(u.deger / maks) * 100}%`, background: renk }} />
          </div>
          <span className="num w-12 shrink-0 text-right text-[12px] font-medium text-slate-muted">{sayiKisa(u.deger, dil)}</span>
        </div>
      ))}
    </div>
  );
}

function TopSiniflar({ veri, dil, t }: { veri: StudyoVeriDTO; dil: Dil; t: Ceviri }) {
  const toplam = veri.enSiniflar.reduce((a, s) => a + s.deger, 0) || 1;
  // Histogram — sınıf başına olay hacmi (insan/iyi-bot yeşil, tehdit kırmızı).
  const kovalar = veri.enSiniflar.map((s) => ({
    etiket: t(`rs.sinif.${s.kod}`),
    deger: s.deger,
    ton: (s.kod === "human" || s.kod === "good_bot" ? "insan" : "bot") as "insan" | "bot",
  }));
  return (
    <div className="space-y-4">
      {kovalar.length > 0 && (
        <div className="rounded-xl border border-line bg-canvas/20 p-3">
          <Histogram kovalar={kovalar} yukseklik={80} />
        </div>
      )}
      <table className="w-full text-left text-[12.5px]">
      <thead>
        <tr className="border-b border-line text-[11px] uppercase tracking-wide text-slate-faint">
          <th className="py-1.5 font-semibold">{t("rs.icerik.botSinifi")}</th>
          <th className="py-1.5 text-right font-semibold">{t("rs.icerik.olay")}</th>
          <th className="py-1.5 text-right font-semibold">{t("rs.icerik.pay")}</th>
        </tr>
      </thead>
      <tbody>
        {veri.enSiniflar.map((s) => (
          <tr key={s.kod} className="border-b border-line last:border-0">
            <td className="py-1.5 font-medium text-slate-ink">{t(`rs.sinif.${s.kod}`)}</td>
            <td className="num py-1.5 text-right text-slate-muted">{sayiKisa(s.deger, dil)}</td>
            <td className="num py-1.5 text-right text-slate-muted">%{Math.round((s.deger / toplam) * 100)}</td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}

function EngellenenOlaylar({ veri, renk, dil, t }: { veri: StudyoVeriDTO; renk: string; dil: Dil; t: Ceviri }) {
  const oran = veri.olaySayisi ? Math.round((veri.engellenenSayisi / veri.olaySayisi) * 1000) / 10 : 0;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-[170px_minmax(0,1fr)]">
      {/* Engelleme oranı gauge — yarım daire gösterge */}
      <div className="flex flex-col items-center justify-center rounded-xl border border-line bg-canvas/30 py-4">
        <Gauge deger={oran} etiket={t("rs.icerik.engellemeOrani")} boyut={160} renk={renk} />
      </div>
      {/* KPI şeridi */}
      <div className="grid grid-cols-2 gap-3 self-center">
        <StatBlok etiket={t("rs.icerik.toplamOlay")} deger={sayiKisa(veri.olaySayisi, dil)} />
        <StatBlok etiket={t("rs.icerik.engellenen")} deger={sayiKisa(veri.engellenenSayisi, dil)} renk="#dc2626" />
        <StatBlok etiket={t("rs.icerik.mucadele")} deger={sayiKisa(veri.toplam.challenged, dil)} renk="#d97706" />
        <StatBlok etiket={t("rs.icerik.dogrulanan")} deger={sayiKisa(veri.toplam.verified, dil)} renk="#16a34a" />
      </div>
    </div>
  );
}

function Kampanyalar({ veri, dil, t }: { veri: StudyoVeriDTO; dil: Dil; t: Ceviri }) {
  if (veri.kampanyalar.length === 0) return <BosSatir metin={t("rs.icerik.bosKampanya")} />;
  return (
    <table className="w-full text-left text-[12.5px]">
      <thead>
        <tr className="border-b border-line text-[11px] uppercase tracking-wide text-slate-faint">
          <th className="py-1.5 font-semibold">{t("rs.icerik.kampanya")}</th>
          <th className="py-1.5 font-semibold">{t("rs.icerik.sinif")}</th>
          <th className="py-1.5 text-right font-semibold">{t("rs.icerik.istek")}</th>
          <th className="py-1.5 text-right font-semibold">{t("rs.icerik.engellenen")}</th>
          <th className="py-1.5 text-right font-semibold">{t("rs.icerik.zirveRps")}</th>
        </tr>
      </thead>
      <tbody>
        {veri.kampanyalar.map((k) => (
          <tr key={k.id} className="border-b border-line last:border-0">
            <td className="py-1.5 font-medium text-slate-ink">{k.name}</td>
            <td className="py-1.5 text-slate-muted">{t(`rs.sinif.${k.botClass}`)}</td>
            <td className="num py-1.5 text-right text-slate-muted">{sayiKisa(k.totalRequests, dil)}</td>
            <td className="num py-1.5 text-right text-slate-muted">{sayiKisa(k.blockedRequests, dil)}</td>
            <td className="num py-1.5 text-right text-slate-muted">{sayiKisa(k.peakRps, dil)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Gerçek veriden türetilmiş basit aksiyon önerileri. */
function Oneriler({ veri, renk, dil, t }: { veri: StudyoVeriDTO; renk: string; dil: Dil; t: Ceviri }) {
  const oneriler: string[] = [];
  if (veri.korumaSkoru < 70)
    oneriler.push(t("rs.oneri.korumaSkoru").replace("{n}", String(veri.korumaSkoru)));
  if (veri.kritikUyari > 0)
    oneriler.push(t("rs.oneri.kritikUyari").replace("{n}", String(veri.kritikUyari)));
  if (veri.aktifKampanya > 0)
    oneriler.push(t("rs.oneri.aktifKampanya").replace("{n}", String(veri.aktifKampanya)));
  const enUlke = veri.enUlkeler[0];
  if (enUlke)
    oneriler.push(
      t("rs.oneri.enUlke")
        .replace("{bayrak}", bayrak(enUlke.kod))
        .replace("{kod}", enUlke.kod)
        .replace("{n}", sayiKisa(enUlke.deger, dil)),
    );
  const aiSinif = veri.enSiniflar.find((s) => s.kod === "ai_agent");
  if (aiSinif && aiSinif.deger > 0)
    oneriler.push(t("rs.oneri.aiAjan").replace("{n}", sayiKisa(aiSinif.deger, dil)));
  if (oneriler.length === 0)
    oneriler.push(t("rs.oneri.saglikli"));

  return (
    <ul className="space-y-2">
      {oneriler.map((o, i) => (
        <li key={i} className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-slate-ink">
          <span
            className="num mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white"
            style={{ background: renk }}
          >
            {i + 1}
          </span>
          <span>{o}</span>
        </li>
      ))}
    </ul>
  );
}

function BosSatir({ metin }: { metin: string }) {
  return <div className="rounded-lg border border-dashed border-line bg-canvas/20 px-4 py-4 text-center text-[12.5px] text-slate-faint">{metin}</div>;
}

/* ------------------------------------------------------------------ Zamanlama modalı */

function ZamanlamaModal({
  acik,
  kapat,
  onEkle,
  varsayilanSablon,
  varsayilanAd,
  dil,
  t,
}: {
  acik: boolean;
  kapat: () => void;
  onEkle: (z: Omit<ZamanliRapor, "id" | "olusturmaAni" | "sonrakiCalisma">) => void;
  varsayilanSablon: SablonId;
  varsayilanAd: string;
  dil: Dil;
  t: Ceviri;
}) {
  const [ad, setAd] = useState(varsayilanAd);
  const [sablon, setSablon] = useState<SablonId>(varsayilanSablon);
  const [siklik, setSiklik] = useState<ZamanliRapor["siklik"]>("haftalik");
  const [format, setFormat] = useState<ZamanliRapor["format"]>("pdf");
  const [alicilar, setAlicilar] = useState("");

  // Modal her açıldığında güncel taslak değerlerini yansıt.
  useEffect(() => {
    if (acik) {
      setAd(varsayilanAd);
      setSablon(varsayilanSablon);
    }
  }, [acik, varsayilanAd, varsayilanSablon]);

  const gecerli = ad.trim().length > 0 && alicilar.trim().length > 0;

  return (
    <Modal
      acik={acik}
      kapat={kapat}
      baslik={t("rs.modal.baslik")}
      aciklama={t("rs.modal.aciklama")}
    >
      <div className="space-y-4">
        <Alan etiket={t("rs.modal.raporAdi")}>
          <Girdi value={ad} onChange={(e) => setAd(e.target.value)} placeholder={t("rs.modal.raporAdiPh")} />
        </Alan>
        <Alan etiket={t("rs.modal.sablon")}>
          <Secim value={sablon} onChange={(e) => setSablon(e.target.value as SablonId)}>
            {SABLONLAR.map((s) => (
              <option key={s.id} value={s.id}>
                {t(`rs.sablon.${s.id}.ad`)}
              </option>
            ))}
          </Secim>
        </Alan>
        <div className="grid grid-cols-2 gap-3">
          <Alan etiket={t("rs.modal.siklik")}>
            <Secim value={siklik} onChange={(e) => setSiklik(e.target.value as ZamanliRapor["siklik"])}>
              <option value="gunluk">{t("rs.siklik.gunluk")}</option>
              <option value="haftalik">{t("rs.siklik.haftalik")}</option>
              <option value="aylik">{t("rs.siklik.aylik")}</option>
            </Secim>
          </Alan>
          <Alan etiket={t("rs.modal.bicim")}>
            <Secim value={format} onChange={(e) => setFormat(e.target.value as ZamanliRapor["format"])}>
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </Secim>
          </Alan>
        </div>
        <Alan etiket={t("rs.modal.alicilar")}>
          <Girdi
            value={alicilar}
            onChange={(e) => setAlicilar(e.target.value)}
            placeholder={t("rs.modal.alicilarPh")}
          />
        </Alan>
        <div className="rounded-xl border border-line bg-canvas/40 px-3.5 py-2.5 text-[12px] text-slate-muted">
          {t("rs.modal.sonrakiCalisma")}<span className="font-medium text-slate-ink">{tamTarihMetin(sonrakiCalismaHesap(siklik), dil)}</span>{t("rs.modal.sonrakiNot")}
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={kapat}>
            {t("rs.modal.iptal")}
          </Button>
          <Button
            variant="accent"
            disabled={!gecerli}
            onClick={() =>
              onEkle({ ad: ad.trim(), sablon, siklik, format, aliciAdlari: alicilar.trim(), aktif: true })
            }
          >
            <Check className="size-4" /> {t("rs.modal.kur")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
