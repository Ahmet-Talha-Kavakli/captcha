"use client";

/**
 * Specter — Maliyet-Bilinçli Ölçekleme Politikası (istemci)
 * =========================================================
 * Edge güvenlik altyapısı için FinOps konsolu: bölge başına kapasite
 * yukarı/aşağı kararları, maliyet vs SLO dengesi ve önerilen politika.
 * AWS/Cloudflare kapasite+maliyet planlayıcısı hissi.
 *
 * DÜRÜSTLÜK: Düğüm başına birim maliyet ve RPS kapasitesi MODELLENMİŞ
 * VARSAYIMLARDIR; canlı bulut faturalandırma API'sinden gelmez. Yük öngörüsü
 * gözlemlenen rps + sezgisel büyümeden türetilir.
 */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { Panel, StatKart, Badge, Ilerleme, NotKutusu } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { Gauge as GaugeGost, Histogram } from "@/components/panel/grafikler-ek";
import { TrendGrafik } from "@/components/panel/grafikler";
import {
  Scaling,
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldAlert,
  PiggyBank,
  Server,
  Gauge,
  Info,
  ArrowRight,
  Layers,
  DollarSign,
  ListOrdered,
  Activity,
  Cpu,
  Waypoints,
} from "lucide-react";
import type { Dil } from "@/lib/i18n/panel";
import type { BolgeOlcek, OlcekOzet, Politika, OlcekAksiyon, SloRisk } from "./olcek";
import { olCeviri } from "./olcek.i18n";

/* ------------------------------------------------------------------ Tipler (props) */

interface BolgeMeta {
  ad: string;
  renk: string;
}
interface Props {
  bolgeler: BolgeOlcek[];
  bolgeMeta: BolgeMeta[];
  ozet: OlcekOzet;
  politika: Politika;
  model: { dugumAylikMaliyet: number; dugumRpsKapasite: number; hedefHeadroom: number };
  dil: Dil;
}

/* ------------------------------------------------------------------ Biçimlendirme */

/** Dil → BCP-47 yerel etiketi (sayı biçimleme için). */
const BCP47: Record<Dil, string> = { tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES" };

/* ------------------------------------------------------------------ Aksiyon/SLO meta (enum güvenliği: etiket t() ile) */

// Enum değerleri ASLA çevrilmez; yalnızca ikon/ton/renk (görsel veri) sabittir.
const AKSIYON_META: Record<OlcekAksiyon, { ikon: typeof TrendingUp; ton: "yesil" | "sari" | "gri"; renk: string }> = {
  "ölçek-yukarı": { ikon: TrendingUp, ton: "sari", renk: "#d97706" },
  "ölçek-aşağı": { ikon: TrendingDown, ton: "yesil", renk: "#16a34a" },
  sabit: { ikon: Minus, ton: "gri", renk: "#64748b" },
};

const SLO_META: Record<SloRisk, { ton: "kirmizi" | "sari" | "yesil"; ilerlemeTon: "danger" | "warn" | "ok" }> = {
  yüksek: { ton: "kirmizi", ilerlemeTon: "danger" },
  orta: { ton: "sari", ilerlemeTon: "warn" },
  düşük: { ton: "yesil", ilerlemeTon: "ok" },
};

/* ------------------------------------------------------------------ Headroom barı (mevcut vs öneri) */

function HeadroomBar({ mevcut, oneri, hedef, t, yuzde }: {
  mevcut: number;
  oneri: number;
  hedef: number;
  t: (anahtar: string) => string;
  yuzde: (o: number) => string;
}) {
  // 0..1 headroom → dolu kısım = kullanım (1 − headroom).
  const kullanim = Math.max(0, Math.min(1, 1 - mevcut));
  const hedefKullanim = 1 - hedef;
  const saglikli = mevcut >= hedef;
  return (
    <div className="min-w-[160px]">
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-canvas">
        <div
          className={cn("h-full rounded-full transition-all", saglikli ? "bg-ok" : "bg-danger2")}
          style={{ width: `${kullanim * 100}%` }}
        />
        {/* hedef doluluk çizgisi (bu noktanın sağı = headroom ihlali) */}
        <div
          className="absolute top-0 h-full w-px bg-ink-900/40"
          style={{ left: `${hedefKullanim * 100}%` }}
          title={t("headroom.hedefTavan").replace("{yuzde}", yuzde(hedefKullanim))}
        />
      </div>
      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-faint">
        <span className={saglikli ? "text-ok" : "text-danger2"}>{t("headroom.headroom").replace("{yuzde}", yuzde(mevcut))}</span>
        <span className="text-slate-muted">{t("headroom.oneri").replace("{yuzde}", yuzde(oneri))}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Maliyet vs SLO denge görseli (inline SVG) */

function DengeGorsel({ bolgeler, ozet, t, yuzde, usdImzali }: {
  bolgeler: BolgeOlcek[];
  ozet: OlcekOzet;
  t: (anahtar: string) => string;
  yuzde: (o: number) => string;
  usdImzali: (n: number) => string;
}) {
  // Her bölge bir nokta: x = öngörülen headroom (SLO güvenliği), y = aylık maliyet.
  // Hedef headroom bir dikey referans çizgisi; sol tarafı SLO-riskli bölge.
  const W = 640;
  const H = 260;
  const pad = { sol: 52, sag: 20, ust: 20, alt: 40 };
  const iw = W - pad.sol - pad.sag;
  const ih = H - pad.ust - pad.alt;

  const maxMaliyet = Math.max(...bolgeler.map((b) => Math.max(b.mevcutMaliyet, b.oneriliMaliyet)), 1);
  const hedef = bolgeler[0]?.hedefHeadroom ?? 0.3;

  // x: headroom 0..0.7 aralığına ölçekle (görünürlük için tavan 0.7).
  const xMax = 0.7;
  const px = (headroom: number) => pad.sol + (Math.max(0, Math.min(xMax, headroom)) / xMax) * iw;
  const py = (maliyet: number) => pad.ust + ih - (maliyet / maxMaliyet) * ih;

  const hedefX = px(hedef);

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[560px]" role="img" aria-label={t("denge.aria")}>
        {/* SLO-riskli bölge gölgesi (hedef headroom'un solu) */}
        <rect x={pad.sol} y={pad.ust} width={hedefX - pad.sol} height={ih} fill="#fee2e2" opacity="0.5" />
        <text x={pad.sol + 6} y={pad.ust + 16} className="fill-red-600" fontSize="11" fontWeight="600">
          {t("denge.sloRiskBolge")}
        </text>

        {/* eksenler */}
        <line x1={pad.sol} y1={pad.ust} x2={pad.sol} y2={pad.ust + ih} stroke="#cbd5e1" strokeWidth="1" />
        <line x1={pad.sol} y1={pad.ust + ih} x2={pad.sol + iw} y2={pad.ust + ih} stroke="#cbd5e1" strokeWidth="1" />

        {/* hedef headroom çizgisi */}
        <line x1={hedefX} y1={pad.ust} x2={hedefX} y2={pad.ust + ih} stroke="#0f172a" strokeWidth="1.5" strokeDasharray="4 3" />
        <text x={hedefX + 4} y={pad.ust + ih - 6} className="fill-ink-900" fontSize="10" fontWeight="600">
          {t("denge.hedef").replace("{yuzde}", yuzde(hedef))}
        </text>

        {/* eksen etiketleri */}
        <text x={pad.sol + iw / 2} y={H - 8} textAnchor="middle" className="fill-slate-500" fontSize="11">
          {t("denge.xEksen")}
        </text>
        <text x={14} y={pad.ust + ih / 2} textAnchor="middle" fontSize="11" className="fill-slate-500" transform={`rotate(-90 14 ${pad.ust + ih / 2})`}>
          {t("denge.yEksen")}
        </text>

        {/* her bölge: mevcut → öneri ok + noktalar */}
        {bolgeler.map((b) => {
          const x1 = px(b.tahminiHeadroom);
          const y1 = py(b.mevcutMaliyet);
          const x2 = px(b.oneriliHeadroom);
          const y2 = py(b.oneriliMaliyet);
          const renk = AKSIYON_META[b.onerilenAksiyon].renk;
          const hareket = b.onerilenAksiyon !== "sabit";
          return (
            <g key={b.bolge}>
              {hareket && (
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={renk} strokeWidth="1.5" strokeDasharray="3 2" opacity="0.6" />
              )}
              {/* mevcut nokta (içi boş) */}
              <circle cx={x1} cy={y1} r="4" fill="white" stroke={renk} strokeWidth="1.5" />
              {/* öneri nokta (dolu) */}
              {hareket && <circle cx={x2} cy={y2} r="5" fill={renk} />}
              <text x={x2 + 8} y={y2 + 4} fontSize="10" fontWeight="600" fill="#334155">
                {b.poplar.length ? b.bolge.split("-")[0] : ""}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex flex-wrap items-center gap-4 px-1 text-[11px] text-slate-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full border-[1.5px] border-slate-400 bg-white" /> {t("denge.efsaneMevcut")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full bg-slate-500" /> {t("denge.efsaneOneri")}
        </span>
        <span className="text-slate-faint">
          {t("denge.netEtki")} <span className={cn("font-semibold", ozet.netFark < 0 ? "text-ok" : ozet.netFark > 0 ? "text-warn" : "text-slate-ink")}>{usdImzali(ozet.netFark)}{t("denge.ay")}</span>
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Ana bileşen */

export function OlceklemeIstemci({ bolgeler, bolgeMeta, ozet, politika, model, dil }: Props) {
  const t = (anahtar: string) => olCeviri(anahtar, dil);
  const loc = BCP47[dil];

  // Yerel (BCP-47) biçimlendirme yardımcıları — para/RPS sayıları veridir,
  // yalnızca yerel ayraçla sunulur.
  const usd = (n: number) => `$${Math.round(n).toLocaleString(loc)}`;
  const usdImzali = (n: number) =>
    n < 0 ? `−$${Math.round(-n).toLocaleString(loc)}` : `+$${Math.round(n).toLocaleString(loc)}`;
  const yuzde = (o: number) => `%${Math.round(o * 100)}`;
  const rps = (n: number) => `${Math.round(n).toLocaleString(loc)} RPS`;

  // Bölge adı: pops.ts BOLGE_AD (TR) yerine enum'dan dile göre türetilir.
  const bolgeAd = (bolge: string) => t(`bolge.${bolge}`);

  // Aksiyon etiketi: OlcekAksiyon enum'undan dile göre.
  const aksiyonEtiket = (a: OlcekAksiyon) => t(`aksiyon.${a}`);

  // Bölge gerekçesi: sunucudaki b.gerekce (TR) yerine sayısal alanlardan yeniden
  // türetilir (olcek.ts saf çekirdeğine dokunmadan, dile göre).
  const gerekceMetin = (b: BolgeOlcek): string => {
    const head = Math.round(b.mevcutHeadroom * 100);
    const tahHead = Math.round(b.tahminiHeadroom * 100);
    const buyume = Math.round(b.buyumeFaktoru * 100);
    const hedef = Math.round(b.hedefHeadroom * 100);
    if (b.onerilenAksiyon === "ölçek-yukarı") {
      return t("gerekce.yukari")
        .replace("{buyume}", String(buyume))
        .replace("{tahHead}", String(tahHead))
        .replace("{hedef}", String(hedef))
        .replace("{delta}", String(b.oneriliNodeDelta));
    }
    if (b.onerilenAksiyon === "ölçek-aşağı") {
      return t("gerekce.asagi")
        .replace("{head}", String(head))
        .replace("{tahHead}", String(tahHead))
        .replace("{mutlakDelta}", String(Math.abs(b.oneriliNodeDelta)));
    }
    return t("gerekce.sabit").replace("{head}", String(head)).replace("{tahHead}", String(tahHead));
  };

  // Politika özet metni: sunucudaki politika.ozet (TR) yerine dile göre yeniden.
  const politikaOzet = (): string => {
    const hedef = Math.round(politika.hedefHeadroom * 100);
    if (ozet.sloRiskliBolge > 0) {
      return t("ozet.slo")
        .replace("{riskli}", String(ozet.sloRiskliBolge))
        .replace("{asagi}", String(ozet.olcekAsagiBolge));
    }
    if (ozet.olcekAsagiBolge > 0 && ozet.netFark < 0) {
      return t("ozet.tasarruf")
        .replace("{asagi}", String(ozet.olcekAsagiBolge))
        .replace("{hedef}", String(hedef))
        .replace("{tutar}", Math.round(-ozet.netFark).toLocaleString(loc));
    }
    return t("ozet.dengede").replace("{hedef}", String(hedef));
  };

  // Politika kuralları: sunucudaki politika.kurallar (TR) yerine dile göre.
  const politikaKurallar = (): string[] => {
    const hedef = Math.round(politika.hedefHeadroom * 100);
    return [
      t("kural.1").replace("{hedef}", String(hedef)).replace("{tavan}", String(100 - hedef)),
      t("kural.2").replace("{yari}", String(Math.round(hedef / 2))),
      t("kural.3"),
      t("kural.4"),
      t("kural.5")
        .replace("{maliyet}", model.dugumAylikMaliyet.toLocaleString(loc))
        .replace("{rps}", model.dugumRpsKapasite.toLocaleString(loc)),
    ];
  };

  // Bölge → meta eşlemesi (index korunur çünkü ikisi de aynı sırada gelir).
  const metaMap = useMemo(() => {
    const m = new Map<string, BolgeMeta>();
    bolgeler.forEach((b, i) => m.set(b.bolge, bolgeMeta[i]));
    return m;
  }, [bolgeler, bolgeMeta]);

  const [filtre, setFiltre] = useState<"tumu" | OlcekAksiyon>("tumu");

  const gorunen = useMemo(
    () => (filtre === "tumu" ? bolgeler : bolgeler.filter((b) => b.onerilenAksiyon === filtre)),
    [bolgeler, filtre],
  );

  // Eylem gerektiren bölgeler (öncelik sırasıyla: SLO-riskli önce, sonra tasarruf).
  const eylemler = useMemo(
    () => bolgeler.filter((b) => b.onerilenAksiyon !== "sabit"),
    [bolgeler],
  );

  const netTasarruf = ozet.netFark < 0;

  /**
   * Politikayı CSV olarak dışa aktar (client-side Blob indirme). Mevcut bölge
   * önerilerini satır satır yazar; sunucuya istek yok, çekirdek veriden türetilir.
   */
  function politikayiDisaAktar() {
    const basliklar = [
      t("csv.bolge"), t("csv.aksiyon"), t("csv.mevcutDugum"), t("csv.oneriliDugum"),
      t("csv.delta"), t("csv.mevcutHeadroom"), t("csv.oneriliHeadroom"), t("csv.hedefHeadroom"),
      t("csv.mevcutMaliyet"), t("csv.oneriliMaliyet"), t("csv.netFark"), t("csv.sloRiski"),
    ];
    // CSV alanı: virgül/tırnak/yenisatır varsa çift-tırnakla kaçır.
    const kacir = (h: string | number) => {
      const s = String(h);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const satirlar = bolgeler.map((b) => [
      bolgeAd(b.bolge),
      aksiyonEtiket(b.onerilenAksiyon),
      b.mevcutDugum,
      b.oneriliDugum,
      b.oneriliNodeDelta,
      Math.round(b.tahminiHeadroom * 100),
      Math.round(b.oneriliHeadroom * 100),
      Math.round(b.hedefHeadroom * 100),
      Math.round(b.mevcutMaliyet),
      Math.round(b.oneriliMaliyet),
      Math.round(b.netFark),
      t(`slo.${b.sloRiski}`),
    ]);
    const csv = [basliklar, ...satirlar].map((r) => r.map(kacir).join(",")).join("\n");
    // Excel'in UTF-8'i doğru açması için BOM ekle.
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `veylify-olcekleme-politikasi-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ---- Görsel türetmeler (yalnızca sunum; çekirdek veri değişmez) ----
  // Filo kapasite kullanımı: toplam yük / toplam kapasite (0..100).
  const filoKullanim = useMemo(() => {
    const yuk = bolgeler.reduce((a, b) => a + b.mevcutYuk, 0);
    const kap = bolgeler.reduce((a, b) => a + b.mevcutKapasite, 0);
    return kap > 0 ? Math.min(100, Math.round((yuk / kap) * 100)) : 0;
  }, [bolgeler]);

  // Öngörülen (tahmini yük sonrası) filo kullanımı.
  const filoTahminKullanim = useMemo(() => {
    const yuk = bolgeler.reduce((a, b) => a + b.tahminiYuk, 0);
    const kap = bolgeler.reduce((a, b) => a + b.mevcutKapasite, 0);
    return kap > 0 ? Math.min(120, Math.round((yuk / kap) * 100)) : 0;
  }, [bolgeler]);

  // Öneri sonrası ortalama headroom (0..100).
  const ortHeadroomPct = Math.round((ozet.ortHeadroom ?? 0) * 100);

  // Trafik zirve trendi: her bölgenin buyumeFaktoru'nden tekilleştirilmiş,
  // gözlemlenen→öngörülen artışı yansıtan tek bir kompozit eğri (yalnızca görsel).
  const zirveEgri = useMemo(() => {
    const toplamYuk = bolgeler.reduce((a, b) => a + b.mevcutYuk, 0) || 1;
    const ortBuyume = bolgeler.reduce((a, b) => a + b.buyumeFaktoru, 0) / (bolgeler.length || 1);
    // 12 zaman-dilimi: geçmiş düz, öngörü doğrultusunda tırmanış (deterministik).
    return Array.from({ length: 12 }, (_, i) => {
      const t = i / 11;
      const faz = Math.sin(t * Math.PI * 1.15) * 0.06; // hafif dalga
      const egim = ortBuyume >= 0 ? ortBuyume : ortBuyume * 0.5;
      return Math.round(toplamYuk * (0.78 + t * (0.22 + egim) + faz));
    });
  }, [bolgeler]);

  const zirveKapasite = useMemo(
    () => bolgeler.reduce((a, b) => a + b.mevcutKapasite, 0),
    [bolgeler],
  );

  // Bölge başına kaynak kullanım histogramı (yük/kapasite oranı).
  const kullanimKovalar = useMemo(
    () =>
      [...bolgeler]
        .sort((a, b) => b.tahminiHeadroom - a.tahminiHeadroom)
        .map((b) => {
          const oran = b.mevcutKapasite > 0 ? Math.round((b.tahminiYuk / b.mevcutKapasite) * 100) : 0;
          const asiri = oran >= 100 - Math.round(b.hedefHeadroom * 100);
          return {
            etiket: b.bolge.split("-")[0],
            deger: Math.min(140, oran),
            ton: (asiri ? "bot" : oran <= 45 ? "insan" : "nötr") as "insan" | "bot" | "nötr",
          };
        }),
    [bolgeler],
  );

  return (
    <div className="space-y-6">
      {/* ---- Dürüstlük notu ---- */}
      <NotKutusu ton="bilgi" baslik={t("not.baslik")}>
        {t("not.a")} <b>{t("not.dugumAy").replace("{maliyet}", model.dugumAylikMaliyet.toLocaleString(loc))}</b> {t("not.ve")}{" "}
        <b>{t("not.rpsDugum").replace("{rps}", model.dugumRpsKapasite.toLocaleString(loc))}</b> {t("not.b")} <b>{t("not.varsayim")}</b> {t("not.c")}
      </NotKutusu>

      {/* ---- Özet kartları ---- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatKart sayi={usd(ozet.toplamAylikMaliyet)} etiket={t("stat.mevcutMaliyet")} ikon={<Server className="size-4" />} />
        <StatKart sayi={usd(ozet.oneriliAylikMaliyet)} etiket={t("stat.oneriliMaliyet")} ikon={<Scaling className="size-4" />} />
        <StatKart
          sayi={usdImzali(ozet.netFark)}
          etiket={netTasarruf ? t("stat.netTasarruf") : t("stat.netEkMaliyet")}
          ikon={netTasarruf ? <PiggyBank className="size-4" /> : <DollarSign className="size-4" />}
          tone={netTasarruf ? "ok" : "warn"}
        />
        <StatKart
          sayi={ozet.sloRiskliBolge}
          etiket={t("stat.sloRiskli")}
          ikon={<ShieldAlert className="size-4" />}
          tone={ozet.sloRiskliBolge > 0 ? "danger" : "ok"}
        />
      </div>

      {/* ---- Kapasite panoraması: gauge + trafik zirve trendi + kaynak histogram ---- */}
      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        {/* Filo kapasite göstergeleri */}
        <motion.div
          initial={{ y: 8 }}
          animate={{ y: 0 }}
          className="rounded-3xl border border-line bg-surface p-5 shadow-card"
        >
          <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-ink">
            <Cpu className="size-4 text-brand-600" /> {t("panorama.filoBaslik")}
          </div>
          <div className="mt-2 flex flex-col items-center">
            <GaugeGost deger={filoKullanim} etiket={t("panorama.kullanim")} boyut={168} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-canvas/70 px-3 py-2.5">
              <div className="num text-lg font-bold text-slate-ink">{filoTahminKullanim}%</div>
              <div className="text-[10px] text-slate-faint">{t("panorama.ongoruKullanim")}</div>
            </div>
            <div className="rounded-xl bg-brand-50 px-3 py-2.5">
              <div className="num text-lg font-bold text-brand-700">{ortHeadroomPct}%</div>
              <div className="text-[10px] text-slate-faint">{t("panorama.ortHeadroom")}</div>
            </div>
          </div>
        </motion.div>

        {/* Trafik zirve trendi */}
        <motion.div
          initial={{ y: 8 }}
          animate={{ y: 0 }}
          className="rounded-3xl border border-line bg-surface p-5 shadow-card"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-ink">
              <Activity className="size-4 text-brand-600" /> {t("panorama.zirveBaslik")}
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-faint">
              <span className="inline-block h-px w-5 bg-danger2" style={{ borderTop: "1px dashed" }} />
              {t("panorama.kapasiteTavani")}
            </span>
          </div>
          <div className="relative mt-2">
            <TrendGrafik
              noktalar={zirveEgri}
              yukseklik={190}
              renk="#2f6fed"
              etiketler={zirveEgri.map((_, i) => (i === 0 ? "−11" : i === 11 ? t("panorama.simdi") : ""))}
            />
            {/* Kapasite tavanı referans notu */}
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-faint">
              <span>{rps(Math.min(...zirveEgri))}</span>
              <span className="text-slate-muted">{t("panorama.tavan")}: {rps(zirveKapasite)}</span>
              <span className={ozet.netFark < 0 ? "text-ok" : "text-warn"}>{rps(Math.max(...zirveEgri))}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ---- Bölge başına kaynak kullanım dağılımı (histogram) ---- */}
      <Panel
        baslik={
          <span className="inline-flex items-center gap-2">
            <Waypoints className="size-4 text-brand-600" /> {t("panorama.dagilimBaslik")}
          </span>
        }
        sagUst={
          <div className="flex items-center gap-3 text-[11px] text-slate-faint">
            <span className="inline-flex items-center gap-1.5"><span className="inline-block size-2.5 rounded-sm bg-ok" /> {t("panorama.rahat")}</span>
            <span className="inline-flex items-center gap-1.5"><span className="inline-block size-2.5 rounded-sm bg-brand-500" /> {t("panorama.normal")}</span>
            <span className="inline-flex items-center gap-1.5"><span className="inline-block size-2.5 rounded-sm bg-danger2" /> {t("panorama.baskilanan")}</span>
          </div>
        }
      >
        <Histogram kovalar={kullanimKovalar} yukseklik={110} />
        <p className="mt-3 text-[12px] leading-relaxed text-slate-muted">{t("panorama.dagilimNot")}</p>
      </Panel>

      {/* ---- Politika özeti ---- */}
      <Panel
        baslik={
          <span className="inline-flex items-center gap-2">
            <Gauge className="size-4 text-brand-600" /> {t("politika.baslik")}
          </span>
        }
        sagUst={<Badge ton="brand">{t("politika.hedefRozet").replace("{yuzde}", yuzde(politika.hedefHeadroom))}</Badge>}
      >
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="text-[15px] leading-relaxed text-slate-ink">{politikaOzet()}</p>
            <ul className="mt-4 space-y-2">
              {politikaKurallar().map((k, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[13px] text-slate-muted">
                  <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-brand-500" />
                  <span>{k}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-line bg-canvas/50 p-5">
            <div className="text-[13px] font-medium text-slate-muted">{t("politika.maliyetEtkisiBaslik")}</div>
            <div className={cn("mt-1 text-[34px] font-bold leading-none num", politika.maliyetEtkisi < 0 ? "text-ok" : politika.maliyetEtkisi > 0 ? "text-warn" : "text-slate-ink")}>
              {usdImzali(politika.maliyetEtkisi)}
            </div>
            <div className="mt-1 text-[12px] text-slate-faint">
              {politika.maliyetEtkisi < 0 ? t("politika.etkiTasarruf") : politika.maliyetEtkisi > 0 ? t("politika.etkiEkYatirim") : t("politika.etkiNotr")}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-xl bg-ok-soft px-3 py-2.5">
                <div className="num text-lg font-bold text-ok">{usd(ozet.toplamTasarruf)}</div>
                <div className="text-[11px] text-green-700">{t("politika.tasarruf")}</div>
              </div>
              <div className="rounded-xl bg-warn-soft px-3 py-2.5">
                <div className="num text-lg font-bold text-warn">{usd(ozet.toplamEkMaliyet)}</div>
                <div className="text-[11px] text-amber-700">{t("politika.ekMaliyet")}</div>
              </div>
            </div>
          </div>
        </div>
      </Panel>

      {/* ---- Maliyet vs SLO dengesi ---- */}
      <Panel
        baslik={
          <span className="inline-flex items-center gap-2">
            <Layers className="size-4 text-brand-600" /> {t("denge.baslik")}
          </span>
        }
        sagUst={
          <span className="inline-flex items-center gap-1.5 text-[12px] text-slate-faint">
            <Info className="size-3.5" /> {t("denge.oncesel")}
          </span>
        }
      >
        <DengeGorsel bolgeler={bolgeler} ozet={ozet} t={t} yuzde={yuzde} usdImzali={usdImzali} />
      </Panel>

      {/* ---- Bölge ölçekleme tablosu ---- */}
      <Panel
        baslik={
          <span className="inline-flex items-center gap-2">
            <Scaling className="size-4 text-brand-600" /> {t("tablo.baslik")}
          </span>
        }
        sagUst={
          <div className="flex items-center gap-1.5">
            {(["tumu", "ölçek-yukarı", "ölçek-aşağı", "sabit"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFiltre(f)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[12px] font-medium transition",
                  filtre === f ? "bg-ink-900 text-white" : "text-slate-muted hover:bg-canvas",
                )}
              >
                {f === "tumu" ? t("tablo.tumu") : aksiyonEtiket(f)}
              </button>
            ))}
          </div>
        }
        padding={false}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-y border-line bg-canvas/40 text-[11px] uppercase tracking-wide text-slate-faint">
                <th className="px-5 py-3 font-semibold">{t("tablo.bolge")}</th>
                <th className="px-5 py-3 font-semibold">{t("tablo.kapasiteYuk")}</th>
                <th className="px-5 py-3 font-semibold">{t("tablo.headroom")}</th>
                <th className="px-5 py-3 font-semibold">{t("tablo.aksiyon")}</th>
                <th className="px-5 py-3 font-semibold">{t("tablo.maliyetEtkisi")}</th>
                <th className="px-5 py-3 font-semibold">{t("tablo.slo")}</th>
              </tr>
            </thead>
            <tbody>
              {gorunen.map((b) => {
                const meta = metaMap.get(b.bolge);
                const aksiyon = AKSIYON_META[b.onerilenAksiyon];
                const AksIkon = aksiyon.ikon;
                const slo = SLO_META[b.sloRiski];
                return (
                  <tr key={b.bolge} className="border-b border-line last:border-0 align-top transition hover:bg-canvas/50">
                    {/* Bölge */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <span className="size-2.5 shrink-0 rounded-full" style={{ background: meta?.renk }} />
                        <div>
                          <div className="font-semibold text-slate-ink">{bolgeAd(b.bolge)}</div>
                          <div className="mt-0.5 text-[11px] text-slate-faint">
                            {b.popSayisi} {t("tablo.pop")} · {b.poplar.slice(0, 4).join(" ")}
                            {b.poplar.length > 4 ? " …" : ""}
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* Kapasite / Yük */}
                    <td className="px-5 py-4">
                      <div className="num text-[13px] text-slate-ink">
                        {rps(b.mevcutYuk)} <span className="text-slate-faint">/ {rps(b.mevcutKapasite)}</span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-faint">
                        {b.mevcutDugum} {t("tablo.dugum")} · {t("tablo.ongoru")} {rps(b.tahminiYuk)}{" "}
                        <span className={b.buyumeFaktoru >= 0 ? "text-warn" : "text-ok"}>
                          ({b.buyumeFaktoru >= 0 ? "+" : ""}
                          {yuzde(b.buyumeFaktoru)})
                        </span>
                      </div>
                    </td>
                    {/* Headroom */}
                    <td className="px-5 py-4">
                      <HeadroomBar mevcut={b.tahminiHeadroom} oneri={b.oneriliHeadroom} hedef={b.hedefHeadroom} t={t} yuzde={yuzde} />
                    </td>
                    {/* Aksiyon */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1.5">
                        <Badge ton={aksiyon.ton}>
                          <AksIkon className="size-3" /> {aksiyonEtiket(b.onerilenAksiyon)}
                        </Badge>
                        {b.oneriliNodeDelta !== 0 && (
                          <span className="num text-[12px] font-medium text-slate-muted">
                            {b.mevcutDugum} → {b.oneriliDugum} {t("tablo.dugum")}{" "}
                            <span className={b.oneriliNodeDelta > 0 ? "text-warn" : "text-ok"}>
                              ({b.oneriliNodeDelta > 0 ? "+" : ""}
                              {b.oneriliNodeDelta})
                            </span>
                          </span>
                        )}
                      </div>
                    </td>
                    {/* Maliyet etkisi */}
                    <td className="px-5 py-4">
                      <div
                        className={cn(
                          "num text-[15px] font-semibold",
                          b.netFark < 0 ? "text-ok" : b.netFark > 0 ? "text-warn" : "text-slate-faint",
                        )}
                      >
                        {b.netFark === 0 ? "—" : `${usdImzali(b.netFark)}${t("tablo.ay")}`}
                      </div>
                      {b.tasarruf > 0 && <div className="text-[11px] text-green-700">{t("tablo.israfGeri")}</div>}
                      {b.ekMaliyet > 0 && <div className="text-[11px] text-amber-700">{t("tablo.sloYatirim")}</div>}
                    </td>
                    {/* SLO */}
                    <td className="px-5 py-4">
                      <Badge ton={slo.ton}>{t(`slo.${b.sloRiski}`)} {t("tablo.risk")}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Gerekçe genişletme satırları */}
        <div className="space-y-2 border-t border-line px-5 py-4">
          {gorunen.map((b) => {
            const meta = metaMap.get(b.bolge);
            return (
              <div key={b.bolge} className="flex items-start gap-2.5 text-[12px] text-slate-muted">
                <span className="mt-0.5 size-2 shrink-0 rounded-full" style={{ background: meta?.renk }} />
                <span>
                  <b className="text-slate-ink">{bolgeAd(b.bolge)}:</b> {gerekceMetin(b)}
                </span>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* ---- Ölçekleme takvimi / önceliklendirme ---- */}
      <Panel
        baslik={
          <span className="inline-flex items-center gap-2">
            <ListOrdered className="size-4 text-brand-600" /> {t("takvim.baslik")}
          </span>
        }
        sagUst={<span className="text-[12px] text-slate-faint">{t("takvim.oncelik")}</span>}
      >
        {eylemler.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line-strong bg-white px-6 py-10 text-center">
            <Minus className="mx-auto mb-2 size-6 text-slate-faint" />
            <div className="font-semibold text-slate-ink">{t("takvim.eylemYok")}</div>
            <p className="mt-1 text-sm text-slate-muted">
              {t("takvim.eylemYokMetin")}
            </p>
          </div>
        ) : (
          <ol className="relative space-y-3 before:absolute before:bottom-4 before:left-[18px] before:top-4 before:w-px before:bg-line">
            {eylemler.map((b, i) => {
              const aksiyon = AKSIYON_META[b.onerilenAksiyon];
              const AksIkon = aksiyon.ikon;
              const slo = SLO_META[b.sloRiski];
              const acil = b.sloRiski === "yüksek";
              return (
                <motion.li
                  key={b.bolge}
                  initial={{ y: 8 }}
                  animate={{ y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={cn(
                    "relative flex flex-wrap items-center gap-4 rounded-2xl border p-4",
                    acil ? "border-red-200 bg-danger-soft/40" : "border-line bg-surface",
                  )}
                >
                  <span
                    className={cn(
                      "z-10 grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold text-white ring-4 ring-surface",
                      acil ? "bg-danger2" : "bg-ink-900",
                    )}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-ink">{bolgeAd(b.bolge)}</span>
                      <Badge ton={aksiyon.ton}>
                        <AksIkon className="size-3" /> {aksiyonEtiket(b.onerilenAksiyon)}
                      </Badge>
                      <Badge ton={slo.ton}>{t(`slo.${b.sloRiski}`)} {t("takvim.sloEtiket")}</Badge>
                    </div>
                    <p className="mt-1 text-[12px] leading-relaxed text-slate-muted">{gerekceMetin(b)}</p>
                  </div>
                  <div className="text-right">
                    <div className="num text-[13px] font-semibold text-slate-ink">
                      {b.mevcutDugum} → {b.oneriliDugum} {t("takvim.dugum")}
                    </div>
                    <div
                      className={cn(
                        "num text-[12px] font-medium",
                        b.netFark < 0 ? "text-ok" : "text-warn",
                      )}
                    >
                      {usdImzali(b.netFark)}{t("takvim.ay")}
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        )}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <p className="max-w-lg text-[12px] text-slate-faint">
            {t("takvim.dipnot")}
          </p>
          <Button variant="outline" size="sm" onClick={politikayiDisaAktar}>
            <Scaling className="size-4" /> {t("takvim.disaAktar")}
          </Button>
        </div>
      </Panel>
    </div>
  );
}
