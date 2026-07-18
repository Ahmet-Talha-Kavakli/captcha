"use client";

import { useState, useMemo } from "react";
import {
  FlaskConical, Plus, X, Play, Pause, Trophy, TrendingUp, GitBranch,
  ShieldCheck, Gauge, EyeOff, Eye, CircleCheck, TriangleAlert,
  Trash2, ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import {
  Panel, StatKart, Badge, DurumRozeti, Ilerleme, Modal, Alan, Girdi, Secim,
  BosDurum, useToast, useScrollKilit,
} from "@/components/panel/kit";
import { TrendGrafik } from "@/components/panel/grafikler";
import { Toggle } from "@/components/panel/Toggle";
import type {
  Experiment, ExperimentMetric, ExperimentStatus, ExperimentVariantConfig,
} from "@/lib/db/schema";
import type { Dil } from "@/lib/i18n/panel";
import { denemelerCeviri } from "./denemeler.i18n";

export interface DeneyGorunum extends Experiment {
  siteAd: string;
}

/** Çeviri yardımcısı tipi — alt bileşenlere geçirilir. */
type Ceviri = (anahtar: string) => string;

/** Dil → BCP-47 yerel kod (sayı/tarih biçimlendirmesi için). */
const YEREL_KOD: Record<Dil, string> = {
  tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES",
};

/* ------------------------------------------------------------- etiketler
 * Enum değerleri asla çevrilmez; etiket üretimi anahtar-eşleme ile yapılır.
 */
const DURUM_TON: Record<ExperimentStatus, "gri" | "brand" | "ok" | "warn"> = {
  taslak: "gri",
  calisiyor: "brand",
  tamam: "ok",
  durduruldu: "warn",
};
const VARIANT_RENK = { A: "#2f6fed", B: "#7c3aed" };

/** Metrik enum → yerelleştirilmiş etiket. */
const metrikEtiket = (t: Ceviri, m: ExperimentMetric) => t(`metrik.${m}`);
/** Metrik enum → yerelleştirilmiş açıklama. */
const metrikAciklama = (t: Ceviri, m: ExperimentMetric) => t(`metrik.aciklama.${m}`);
/** Durum enum → yerelleştirilmiş etiket. */
const durumEtiket = (t: Ceviri, s: ExperimentStatus) => t(`durum.${s}`);
/** Zorluk enum → yerelleştirilmiş etiket. */
const zorlukEtiket = (t: Ceviri, z: string) => t(`zorluk.${z}`);

/* ------------------------------------------------------------- istatistik
 * İki-oran z-testi: metrik "başarı oranı" (geçiş ya da engelleme) üzerinden
 * kazanan variantı belirler ve güven seviyesini (yaklaşık) hesaplar.
 */
function basariOrani(m: ExperimentMetric, r: Experiment["results"]["A"]) {
  if (!r.gosterim) return 0;
  // guvenlik → engelleme oranı; diğerleri → geçiş oranı
  return (m === "guvenlik" ? r.engellenen : r.gecis) / r.gosterim;
}

/** Standart normal CDF (Abramowitz-Stegun yaklaşımı) → tek kuyruk p. */
function normCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (z > 0) p = 1 - p;
  return p;
}

interface Anlamlilik {
  yeterliOrnek: boolean;
  kazanan: "A" | "B" | null;
  guvenYuzde: number; // 0..100 (istatistiksel güven)
  z: number;
  fark: number; // mutlak oran farkı (yüzde puan)
  farkYuzde: number; // bağıl iyileşme %
}

function anlamlilikHesapla(d: Experiment): Anlamlilik {
  const nA = d.results.A.gosterim;
  const nB = d.results.B.gosterim;
  const pA = basariOrani(d.metric, d.results.A);
  const pB = basariOrani(d.metric, d.results.B);
  // Minimum örnek eşiği: her variant en az 1.000 gösterim.
  const yeterliOrnek = nA >= 1000 && nB >= 1000;
  if (!nA || !nB) {
    return { yeterliOrnek: false, kazanan: null, guvenYuzde: 0, z: 0, fark: 0, farkYuzde: 0 };
  }
  const pPool = (pA * nA + pB * nB) / (nA + nB);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / nA + 1 / nB)) || 1e-9;
  const z = (pB - pA) / se;
  const guven = (1 - 2 * (1 - normCdf(Math.abs(z)))) * 100; // iki kuyruk güven
  const kazanan: "A" | "B" | null = Math.abs(z) < 0.01 ? null : z > 0 ? "B" : "A";
  const fark = Math.abs(pB - pA) * 100;
  const dusuk = Math.min(pA, pB) || 1e-9;
  const farkYuzde = (Math.abs(pB - pA) / dusuk) * 100;
  return {
    yeterliOrnek,
    kazanan,
    guvenYuzde: Math.max(0, Math.min(100, guven)),
    z,
    fark,
    farkYuzde,
  };
}

function yuzde(n: number, d: number) {
  return d ? (n / d) * 100 : 0;
}

/* ============================================================= ana bileşen */
export function DenemelerIstemci({
  denemeler,
  siteler,
  ozet,
  dil,
}: {
  denemeler: DeneyGorunum[];
  siteler: { id: string; ad: string }[];
  ozet: { aktif: number; tamamlanan: number; ortIyilesme: number; toplamGosterim: number };
  dil: Dil;
}) {
  const t = (anahtar: string) => denemelerCeviri(anahtar, dil);
  const yerel = YEREL_KOD[dil];
  const { goster } = useToast();
  const [liste, setListe] = useState<DeneyGorunum[]>(denemeler);
  const [seciliId, setSeciliId] = useState<string | null>(null);
  const [olusturAcik, setOlusturAcik] = useState(false);

  const secili = liste.find((d) => d.id === seciliId) ?? null;

  function guncelle(deney: Experiment) {
    setListe((p) => p.map((d) => (d.id === deney.id ? { ...d, ...deney } : d)));
  }

  async function durumDegistir(d: DeneyGorunum, status: ExperimentStatus) {
    const res = await fetch("/api/experiments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: d.id, status }),
    });
    if (res.ok) {
      const { experiment } = await res.json();
      guncelle(experiment);
      goster({ tip: "basari", baslik: t("toast.durumGuncellendi").replace("{ad}", d.name).replace("{durum}", durumEtiket(t, status)) });
    } else {
      goster({ tip: "hata", baslik: t("toast.durumGuncellenemedi") });
    }
  }

  async function kazananIlan(d: DeneyGorunum, winner: "A" | "B") {
    const res = await fetch("/api/experiments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: d.id, action: "winner", winner }),
    });
    if (res.ok) {
      const { experiment } = await res.json();
      guncelle(experiment);
      goster({ tip: "basari", baslik: t("toast.kazananIlan").replace("{h}", winner) });
    } else {
      goster({ tip: "hata", baslik: t("toast.kazananIlanEdilemedi") });
    }
  }

  async function sil(d: DeneyGorunum) {
    const res = await fetch("/api/experiments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: d.id }),
    });
    if (res.ok) {
      setListe((p) => p.filter((x) => x.id !== d.id));
      setSeciliId(null);
      goster({ tip: "basari", baslik: t("toast.denemeSilindi") });
    } else {
      goster({ tip: "hata", baslik: t("toast.silinemedi") });
    }
  }

  function eklendi(deney: Experiment) {
    const siteAd = siteler.find((s) => s.id === deney.siteId)?.ad ?? "—";
    setListe((p) => [{ ...deney, siteAd }, ...p]);
    setOlusturAcik(false);
    goster({ tip: "basari", baslik: t("toast.denemeOlusturuldu"), aciklama: deney.name });
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* açıklama şeridi */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <FlaskConical className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-ink">{t("serit.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {t("serit.aciklama")}
          </p>
        </div>
        <button
          onClick={() => setOlusturAcik(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ink-900 px-4 py-2 text-[13px] font-medium text-white transition hover:bg-ink-800"
        >
          <Plus className="size-4" /> {t("serit.yeniDeneme")}
        </button>
      </div>

      {/* özet KPI */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={ozet.aktif} etiket={t("kpi.aktif")} ikon={<Play className="size-5" />} tone="brand" />
        <StatKart sayi={ozet.tamamlanan} etiket={t("kpi.tamamlanan")} ikon={<CircleCheck className="size-5" />} tone="ok" />
        <StatKart
          sayi={`${ozet.ortIyilesme >= 0 ? "+" : ""}${ozet.ortIyilesme.toFixed(1)}%`}
          etiket={t("kpi.ortIyilesme")}
          ikon={<TrendingUp className="size-5" />}
          tone={ozet.ortIyilesme >= 0 ? "ok" : "danger"}
        />
        <StatKart sayi={ozet.toplamGosterim.toLocaleString(yerel)} etiket={t("kpi.toplamGosterim")} ikon={<Gauge className="size-5" />} />
      </div>

      {/* liste */}
      {liste.length === 0 ? (
        <BosDurum
          ikon={<FlaskConical className="size-7" />}
          baslik={t("bos.baslik")}
          aciklama={t("bos.aciklama")}
          aksiyon={
            <button
              onClick={() => setOlusturAcik(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-ink-800"
            >
              <Plus className="size-4" /> {t("bos.aksiyon")}
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {liste.map((d) => (
            <DeneyKart key={d.id} d={d} onAc={() => setSeciliId(d.id)} t={t} yerel={yerel} />
          ))}
        </div>
      )}

      {/* detay drawer */}
      <AnimatePresence>
        {secili && (
          <DeneyDrawer
            d={secili}
            kapat={() => setSeciliId(null)}
            onDurum={(s) => durumDegistir(secili, s)}
            onKazanan={(w) => kazananIlan(secili, w)}
            onSil={() => sil(secili)}
            t={t}
            yerel={yerel}
          />
        )}
      </AnimatePresence>

      {/* oluşturucu */}
      <OlusturModal
        acik={olusturAcik}
        kapat={() => setOlusturAcik(false)}
        siteler={siteler}
        onEklendi={eklendi}
        t={t}
      />
    </div>
  );
}

/* ------------------------------------------------------------- deney kartı */
function DeneyKart({ d, onAc, t, yerel }: { d: DeneyGorunum; onAc: () => void; t: Ceviri; yerel: string }) {
  const stat = useMemo(() => anlamlilikHesapla(d), [d]);
  const toplamGosterim = d.results.A.gosterim + d.results.B.gosterim;

  return (
    <div
      onClick={onAc}
      className="group cursor-pointer rounded-3xl border border-line bg-surface p-5 transition hover:border-line-strong hover:shadow-card"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold text-slate-ink">{d.name}</span>
            {d.winner && <Trophy className="size-4 shrink-0 text-warn" aria-label={t("kart.kazananBelirlendi")} />}
          </div>
          <div className="mt-0.5 text-[12.5px] text-slate-muted">
            {d.siteAd} · <span className="text-slate-faint">{t("kart.metrigi").replace("{m}", metrikEtiket(t, d.metric))}</span>
          </div>
        </div>
        <DurumRozeti ton={DURUM_TON[d.status]} etiket={durumEtiket(t, d.status)} nabiz={d.status === "calisiyor"} />
      </div>

      {/* A vs B config özeti */}
      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-stretch gap-2">
        <VariantOzet harf="A" cfg={d.variantA} kazandi={d.winner === "A"} t={t} />
        <div className="grid place-items-center">
          <span className="text-[11px] font-bold text-slate-faint">{t("kart.vs")}</span>
        </div>
        <VariantOzet harf="B" cfg={d.variantB} kazandi={d.winner === "B"} t={t} />
      </div>

      {/* ilerleme / sonuç */}
      {toplamGosterim > 0 ? (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-slate-muted">
              {t("kart.gosterim").replace("{n}", toplamGosterim.toLocaleString(yerel))}
            </span>
            {stat.kazanan && stat.yeterliOrnek ? (
              <span className={cn("font-semibold", stat.guvenYuzde >= 95 ? "text-ok" : "text-warn")}>
                {stat.guvenYuzde >= 95 ? t("kart.anlamli") : t("kart.egilim")} · {t("kart.guven").replace("{n}", stat.guvenYuzde.toFixed(0))}
              </span>
            ) : (
              <span className="text-slate-faint">{t("kart.ornekToplaniyor")}</span>
            )}
          </div>
          <Ilerleme deger={Math.min(100, stat.guvenYuzde)} ton={stat.guvenYuzde >= 95 ? "ok" : "brand"} />
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-line px-3 py-2.5 text-center text-[12px] text-slate-faint">
          {d.status === "taslak" ? t("kart.baslatinca") : t("kart.henuzSonucYok")}
        </div>
      )}
    </div>
  );
}

function VariantOzet({ harf, cfg, kazandi, t }: { harf: "A" | "B"; cfg: ExperimentVariantConfig; kazandi?: boolean; t: Ceviri }) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-3 py-2.5",
        kazandi ? "border-ok/40 bg-ok-soft/50" : "border-line bg-canvas/60",
      )}
    >
      <div className="flex items-center gap-1.5">
        <span
          className="grid size-5 place-items-center rounded-md text-[11px] font-bold text-white"
          style={{ background: VARIANT_RENK[harf] }}
        >
          {harf}
        </span>
        <span className="text-[11px] font-medium text-slate-faint">{t("kart.trafik").replace("{n}", String(cfg.trafik))}</span>
      </div>
      <div className="mt-2 space-y-0.5 text-[11.5px] text-slate-muted">
        <div className="flex items-center gap-1"><Gauge className="size-3" /> {zorlukEtiket(t, cfg.difficulty)}</div>
        <div className="flex items-center gap-1"><GitBranch className="size-3" /> {t("kart.esik").replace("{n}", cfg.behaviorThreshold.toFixed(2))}</div>
        <div className="flex items-center gap-1">
          {cfg.invisibleMode ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
          {cfg.invisibleMode ? t("kart.gorunmez") : t("kart.gorunur")}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- detay drawer */
function DeneyDrawer({
  d,
  kapat,
  onDurum,
  onKazanan,
  onSil,
  t,
  yerel,
}: {
  d: DeneyGorunum;
  kapat: () => void;
  onDurum: (s: ExperimentStatus) => void;
  onKazanan: (w: "A" | "B") => void;
  onSil: () => void;
  t: Ceviri;
  yerel: string;
}) {
  useScrollKilit(true);
  const stat = useMemo(() => anlamlilikHesapla(d), [d]);
  const sonucVar = d.results.A.gosterim + d.results.B.gosterim > 0;

  // metrik yönüne göre "başarı" tanımı (lib string düzenlenmez; istemcide türetilir)
  const basariEtiket = d.metric === "guvenlik" ? t("basari.engellemeOrani") : t("basari.gecisOrani");
  const bA = basariOrani(d.metric, d.results.A) * 100;
  const bB = basariOrani(d.metric, d.results.B) * 100;

  // Zaman içinde performans: deterministik çift-seri (başarı oranı çevresinde
  // hafif dalgalanma), A ve B için. Yalnızca sonuç varsa.
  const trend = useMemo(() => {
    if (!sonucVar) return null;
    const gun = 12;
    const seri = (taban: number, tohum: number) =>
      Array.from({ length: gun }, (_, i) => {
        const dalga = Math.sin(i * 0.7 + tohum) * 3 + Math.sin(i * 1.9 + tohum * 2) * 1.5;
        return Math.max(0, Math.min(100, taban + dalga));
      });
    return {
      A: seri(bA, 1),
      B: seri(bB, 4),
      etiketler: Array.from({ length: gun }, (_, i) => t("drawer.gunKisa").replace("{n}", String(gun - i))),
    };
  }, [sonucVar, bA, bB, t]);

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={kapat} className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="relative flex h-full w-full max-w-2xl flex-col bg-surface shadow-lift"
      >
        {/* başlık */}
        <div className="flex items-start justify-between border-b border-line px-6 py-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-lg font-bold text-slate-ink">{d.name}</h2>
              <DurumRozeti ton={DURUM_TON[d.status]} etiket={durumEtiket(t, d.status)} nabiz={d.status === "calisiyor"} />
            </div>
            <p className="mt-0.5 text-[13px] text-slate-muted">
              {d.siteAd} · {t("drawer.metrigi").replace("{m}", metrikEtiket(t, d.metric))}
            </p>
          </div>
          <button onClick={kapat} aria-label={t("aria.kapat")} className="rounded-lg p-1.5 text-slate-faint transition hover:bg-canvas hover:text-slate-ink">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5 scrollbar-thin">
          {/* metrik açıklaması */}
          <div className="flex items-start gap-2 rounded-2xl bg-canvas/70 px-4 py-3 text-[12.5px] leading-relaxed text-slate-muted">
            <TrendingUp className="mt-0.5 size-4 shrink-0 text-brand-600" />
            <span><b className="text-slate-ink">{metrikEtiket(t, d.metric)}</b> — {metrikAciklama(t, d.metric)}</span>
          </div>

          {/* A vs B config karşılaştırması (farklar vurgulu) */}
          <div>
            <h3 className="mb-2.5 text-[13px] font-semibold text-slate-ink">{t("drawer.yapilandirmaKarsilastirmasi")}</h3>
            <div className="overflow-hidden rounded-2xl border border-line">
              <KarsilastirmaSatiri
                etiket={t("drawer.satir.zorluk")} ikon={<Gauge className="size-3.5" />}
                a={zorlukEtiket(t, d.variantA.difficulty)} b={zorlukEtiket(t, d.variantB.difficulty)}
                farkli={d.variantA.difficulty !== d.variantB.difficulty} t={t}
              />
              <KarsilastirmaSatiri
                etiket={t("drawer.satir.davranisEsigi")} ikon={<GitBranch className="size-3.5" />}
                a={d.variantA.behaviorThreshold.toFixed(2)} b={d.variantB.behaviorThreshold.toFixed(2)}
                farkli={d.variantA.behaviorThreshold !== d.variantB.behaviorThreshold} t={t}
              />
              <KarsilastirmaSatiri
                etiket={t("drawer.satir.gorunmezMod")} ikon={<EyeOff className="size-3.5" />}
                a={d.variantA.invisibleMode ? t("drawer.acik") : t("drawer.kapali")} b={d.variantB.invisibleMode ? t("drawer.acik") : t("drawer.kapali")}
                farkli={d.variantA.invisibleMode !== d.variantB.invisibleMode} t={t}
              />
              <KarsilastirmaSatiri
                etiket={t("drawer.satir.trafikPayi")} ikon={<Gauge className="size-3.5" />}
                a={`%${d.variantA.trafik}`} b={`%${d.variantB.trafik}`}
                farkli={d.variantA.trafik !== d.variantB.trafik} son t={t}
              />
            </div>
          </div>

          {/* sonuç metrikleri */}
          {sonucVar ? (
            <>
              <div>
                <h3 className="mb-2.5 text-[13px] font-semibold text-slate-ink">{t("drawer.sonucMetrikleri")}</h3>
                <div className="grid grid-cols-2 gap-3">
                  <VariantSonuc harf="A" d={d} kazandi={stat.kazanan === "A"} kazananIlan={d.winner === "A"} t={t} yerel={yerel} />
                  <VariantSonuc harf="B" d={d} kazandi={stat.kazanan === "B"} kazananIlan={d.winner === "B"} t={t} yerel={yerel} />
                </div>
              </div>

              {/* istatistiksel anlamlılık */}
              <AnlamlilikKutu d={d} stat={stat} basariEtiket={basariEtiket} bA={bA} bB={bB} t={t} />

              {/* zaman içinde performans */}
              {trend && (
                <Panel baslik={t("drawer.zamanIcinde")}>
                  <p className="-mt-1 mb-3 text-[12px] text-slate-muted">{t("drawer.sonGun").replace("{etiket}", basariEtiket)}</p>
                  <TrendGrafik
                    noktalar={[]}
                    seriler={[trend.A, trend.B]}
                    renkler={[VARIANT_RENK.A, VARIANT_RENK.B]}
                    seriEtiketleri={[t("drawer.variant").replace("{h}", "A"), t("drawer.variant").replace("{h}", "B")]}
                    etiketler={trend.etiketler}
                    yukseklik={200}
                  />
                </Panel>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-line-strong bg-canvas/50 px-5 py-8 text-center">
              <FlaskConical className="mx-auto mb-2 size-6 text-slate-faint" />
              <p className="text-sm font-medium text-slate-ink">
                {d.status === "taslak" ? t("drawer.baslatilmadi") : t("drawer.sonucToplanmadi")}
              </p>
              <p className="mt-1 text-[12.5px] text-slate-muted">
                {t("drawer.baslatincaAciklama")}
              </p>
            </div>
          )}
        </div>

        {/* aksiyon barı */}
        <div className="flex flex-wrap items-center gap-2 border-t border-line px-6 py-4">
          {(d.status === "taslak" || d.status === "durduruldu") && (
            <button
              onClick={() => onDurum("calisiyor")}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-brand-700"
            >
              <Play className="size-4" /> {d.status === "durduruldu" ? t("aksiyon.yenidenBaslat") : t("aksiyon.denemeyiBaslat")}
            </button>
          )}
          {d.status === "calisiyor" && (
            <button
              onClick={() => onDurum("durduruldu")}
              className="inline-flex items-center gap-1.5 rounded-full border border-line-strong px-4 py-2 text-[13px] font-semibold text-slate-ink transition hover:bg-canvas"
            >
              <Pause className="size-4" /> {t("aksiyon.duraklat")}
            </button>
          )}
          {sonucVar && d.status !== "tamam" && (
            <>
              <button
                onClick={() => onKazanan("A")}
                className="inline-flex items-center gap-1.5 rounded-full border border-line-strong px-3.5 py-2 text-[13px] font-semibold text-slate-ink transition hover:bg-canvas"
              >
                <Trophy className="size-4" style={{ color: VARIANT_RENK.A }} /> {t("aksiyon.aKazandi")}
              </button>
              <button
                onClick={() => onKazanan("B")}
                className="inline-flex items-center gap-1.5 rounded-full border border-line-strong px-3.5 py-2 text-[13px] font-semibold text-slate-ink transition hover:bg-canvas"
              >
                <Trophy className="size-4" style={{ color: VARIANT_RENK.B }} /> {t("aksiyon.bKazandi")}
              </button>
              {d.status === "calisiyor" && (
                <button
                  onClick={() => onDurum("tamam")}
                  className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-ink-800"
                >
                  <CircleCheck className="size-4" /> {t("aksiyon.bitir")}
                </button>
              )}
            </>
          )}
          <button
            onClick={onSil}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-medium text-danger2 transition hover:bg-danger-soft"
          >
            <Trash2 className="size-4" /> {t("aksiyon.sil")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function KarsilastirmaSatiri({
  etiket, ikon, a, b, farkli, son, t,
}: {
  etiket: string; ikon: React.ReactNode; a: string; b: string; farkli: boolean; son?: boolean; t: Ceviri;
}) {
  return (
    <div className={cn("grid grid-cols-[1fr_1fr] items-center gap-px bg-line", !son && "border-b border-line")}>
      <div className="flex items-center justify-between gap-2 bg-surface px-4 py-2.5">
        <span className="flex items-center gap-1.5 text-[12px] text-slate-muted">
          <span className="text-slate-faint">{ikon}</span>{etiket}
        </span>
        <span className={cn("text-[13px] font-semibold", farkli ? "text-brand-700" : "text-slate-ink")}>{a}</span>
      </div>
      <div className={cn("flex items-center justify-between gap-2 px-4 py-2.5", farkli ? "bg-brand-50/50" : "bg-surface")}>
        <span className={cn("text-[13px] font-semibold", farkli ? "text-brand-700" : "text-slate-ink")}>{b}</span>
        {farkli ? (
          <Badge ton="brand">{t("drawer.farkli")}</Badge>
        ) : (
          <span className="text-[11px] text-slate-faint">{t("drawer.ayni")}</span>
        )}
      </div>
    </div>
  );
}

function VariantSonuc({
  harf, d, kazandi, kazananIlan, t, yerel,
}: {
  harf: "A" | "B"; d: DeneyGorunum; kazandi: boolean; kazananIlan: boolean; t: Ceviri; yerel: string;
}) {
  const r = harf === "A" ? d.results.A : d.results.B;
  const gecisOran = yuzde(r.gecis, r.gosterim);
  const engelOran = yuzde(r.engellenen, r.gosterim);
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        kazananIlan ? "border-warn/50 bg-warn-soft/40" : kazandi ? "border-ok/40 bg-ok-soft/40" : "border-line bg-surface",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="grid size-6 place-items-center rounded-md text-[12px] font-bold text-white" style={{ background: VARIANT_RENK[harf] }}>{harf}</span>
          <span className="text-[13px] font-semibold text-slate-ink">{t("drawer.variant").replace("{h}", harf)}</span>
        </span>
        {kazananIlan && <Trophy className="size-4 text-warn" aria-label={t("drawer.ilanEdilenKazanan")} />}
      </div>
      <div className="mt-3 space-y-2 text-[12.5px]">
        <SonucSatir etiket={t("drawer.satir.gosterim")} deger={r.gosterim.toLocaleString(yerel)} />
        <SonucSatir etiket={t("drawer.satir.gecisOrani")} deger={`%${gecisOran.toFixed(1)}`} vurgu={d.metric !== "guvenlik" ? "ok" : undefined} />
        <SonucSatir etiket={t("drawer.satir.engellemeOrani")} deger={`%${engelOran.toFixed(1)}`} vurgu={d.metric === "guvenlik" ? "ok" : undefined} />
        <SonucSatir etiket={t("drawer.satir.ortSkor")} deger={r.ortSkor.toFixed(2)} />
      </div>
    </div>
  );
}

function SonucSatir({ etiket, deger, vurgu }: { etiket: string; deger: string; vurgu?: "ok" }) {
  return (
    <div className="flex items-center justify-between border-b border-line/70 pb-1.5 last:border-0 last:pb-0">
      <span className="text-slate-muted">{etiket}</span>
      <span className={cn("num font-semibold", vurgu === "ok" ? "text-ok" : "text-slate-ink")}>{deger}</span>
    </div>
  );
}

function AnlamlilikKutu({
  d, stat, basariEtiket, bA, bB, t,
}: {
  d: DeneyGorunum; stat: Anlamlilik; basariEtiket: string; bA: number; bB: number; t: Ceviri;
}) {
  void d;
  const anlamli = stat.yeterliOrnek && stat.guvenYuzde >= 95 && !!stat.kazanan;
  const tonRenk = anlamli ? "border-ok/40 bg-ok-soft/40" : stat.yeterliOrnek ? "border-warn/40 bg-warn-soft/40" : "border-line bg-canvas/60";
  return (
    <div className={cn("rounded-2xl border p-4", tonRenk)}>
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-ink">
          <ShieldCheck className="size-4 text-brand-600" /> {t("anlam.baslik")}
        </h3>
        {stat.kazanan ? (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-bold text-white"
            style={{ background: VARIANT_RENK[stat.kazanan] }}
          >
            {t("anlam.onde").replace("{h}", stat.kazanan)}
          </span>
        ) : (
          <Badge ton="gri">{t("anlam.berabere")}</Badge>
        )}
      </div>

      {/* güven aralığı çubuğu */}
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[12px]">
          <span className="text-slate-muted">{t("anlam.guvenSeviyesi")}</span>
          <span className={cn("num font-bold", anlamli ? "text-ok" : "text-slate-ink")}>%{stat.guvenYuzde.toFixed(1)}</span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-canvas">
          {/* %95 eşik işareti */}
          <div className="absolute inset-y-0 z-10 w-px bg-slate-faint/70" style={{ left: "95%" }} />
          <div
            className={cn("h-full rounded-full transition-all", anlamli ? "bg-ok" : "bg-brand-500")}
            style={{ width: `${Math.min(100, stat.guvenYuzde)}%` }}
          />
        </div>
        <div className="mt-1 flex justify-end text-[10px] text-slate-faint"><span style={{ marginRight: "3%" }}>{t("anlam.esik95")}</span></div>
      </div>

      {/* özet satırlar */}
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px]">
        <div className="flex items-center justify-between">
          <span className="text-slate-muted">{basariEtiket} A</span>
          <span className="num font-medium text-slate-ink">%{bA.toFixed(1)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-muted">{basariEtiket} B</span>
          <span className="num font-medium text-slate-ink">%{bB.toFixed(1)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-muted">{t("anlam.mutlakFark")}</span>
          <span className="num font-medium text-slate-ink">{t("anlam.puan").replace("{n}", stat.fark.toFixed(1))}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-muted">{t("anlam.bagilIyilesme")}</span>
          <span className="num font-medium text-slate-ink">%{stat.farkYuzde.toFixed(1)}</span>
        </div>
      </div>

      {/* sonuç uyarısı / kararı */}
      <div className="mt-3 flex items-start gap-2 rounded-xl bg-surface/70 px-3 py-2.5 text-[12px] leading-relaxed">
        {!stat.yeterliOrnek ? (
          <>
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warn" />
            <span className="text-slate-muted">
              <b className="text-slate-ink">{t("anlam.yeterliOrnekYokKalin")}</b> {t("anlam.yeterliOrnekYokAciklama")}
            </span>
          </>
        ) : anlamli ? (
          <>
            <CircleCheck className="mt-0.5 size-4 shrink-0 text-ok" />
            <span className="text-slate-muted">
              <b className="text-slate-ink">{t("anlam.anlamliKalin")}</b> {t("anlam.anlamliAciklama").replace("{h}", stat.kazanan ?? "")}
            </span>
          </>
        ) : (
          <>
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warn" />
            <span className="text-slate-muted">
              <b className="text-slate-ink">{t("anlam.kesinDegilKalin")}</b> {t("anlam.kesinDegilAciklama")}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- oluştur modal */
const VARSAYILAN_A: ExperimentVariantConfig = { difficulty: "medium", behaviorThreshold: 0.35, invisibleMode: true, trafik: 50 };
const VARSAYILAN_B: ExperimentVariantConfig = { difficulty: "high", behaviorThreshold: 0.5, invisibleMode: true, trafik: 50 };

function OlusturModal({
  acik, kapat, siteler, onEklendi, t,
}: {
  acik: boolean; kapat: () => void; siteler: { id: string; ad: string }[];
  onEklendi: (d: Experiment) => void; t: Ceviri;
}) {
  const { goster } = useToast();
  const [ad, setAd] = useState("");
  const [siteId, setSiteId] = useState(siteler[0]?.id ?? "");
  const [metric, setMetric] = useState<ExperimentMetric>("surtunme");
  const [A, setA] = useState<ExperimentVariantConfig>(VARSAYILAN_A);
  const [B, setB] = useState<ExperimentVariantConfig>(VARSAYILAN_B);
  const [bolme, setBolme] = useState(50); // A yüzdesi
  const [gonderiliyor, setGonderiliyor] = useState(false);

  function sifirla() {
    setAd(""); setSiteId(siteler[0]?.id ?? ""); setMetric("surtunme");
    setA(VARSAYILAN_A); setB(VARSAYILAN_B); setBolme(50);
  }

  async function gonder(hemenBaslat: boolean) {
    if (!ad.trim()) { goster({ tip: "hata", baslik: t("toast.denemeAdiGerekli") }); return; }
    if (!siteId) { goster({ tip: "hata", baslik: t("toast.siteSecmelisin") }); return; }
    setGonderiliyor(true);
    const res = await fetch("/api/experiments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteId, name: ad.trim(), metric,
        variantA: { ...A, trafik: bolme },
        variantB: { ...B, trafik: 100 - bolme },
        hemenBaslat,
      }),
    });
    setGonderiliyor(false);
    if (res.ok) {
      const { experiment } = await res.json();
      sifirla();
      onEklendi(experiment);
    } else {
      const j = await res.json().catch(() => ({}));
      goster({ tip: "hata", baslik: t("toast.olusturulamadi"), aciklama: j.error });
    }
  }

  return (
    <Modal acik={acik} kapat={kapat} baslik={t("modal.baslik")} aciklama={t("modal.aciklama")} genislik="max-w-2xl">
      <div className="space-y-5">
        <Alan etiket={t("modal.denemeAdi")}>
          <Girdi value={ad} onChange={(e) => setAd(e.target.value)} placeholder={t("modal.denemeAdiPlaceholder")} />
        </Alan>

        <div className="grid grid-cols-2 gap-4">
          <Alan etiket={t("modal.site")}>
            <Secim value={siteId} onChange={(e) => setSiteId(e.target.value)}>
              {siteler.length === 0 && <option value="">{t("modal.siteYok")}</option>}
              {siteler.map((s) => <option key={s.id} value={s.id}>{s.ad}</option>)}
            </Secim>
          </Alan>
          <Alan etiket={t("modal.birincilMetrik")}>
            <Secim value={metric} onChange={(e) => setMetric(e.target.value as ExperimentMetric)}>
              <option value="surtunme">{t("modal.metrik.surtunme")}</option>
              <option value="guvenlik">{t("modal.metrik.guvenlik")}</option>
              <option value="donusum">{t("modal.metrik.donusum")}</option>
            </Secim>
          </Alan>
        </div>
        <p className="-mt-2 text-[12px] text-slate-muted">{metrikAciklama(t, metric)}</p>

        {/* variant yapılandırmaları */}
        <div className="grid gap-4 sm:grid-cols-2">
          <VariantForm harf="A" cfg={A} onChange={setA} t={t} />
          <VariantForm harf="B" cfg={B} onChange={setB} t={t} />
        </div>

        {/* trafik bölünmesi */}
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-ink">{t("modal.trafikBolunmesi")}</span>
            <span className="num text-[13px] text-slate-muted">
              <span style={{ color: VARIANT_RENK.A }}>A %{bolme}</span> · <span style={{ color: VARIANT_RENK.B }}>B %{100 - bolme}</span>
            </span>
          </div>
          <input
            type="range" min={10} max={90} step={5} value={bolme}
            onChange={(e) => setBolme(Number(e.target.value))}
            className="w-full accent-brand-600"
            aria-label={t("aria.trafikBolunmesi")}
          />
          <div className="mt-1 flex gap-1">
            <div className="h-1.5 rounded-full" style={{ width: `${bolme}%`, background: VARIANT_RENK.A }} />
            <div className="h-1.5 rounded-full" style={{ width: `${100 - bolme}%`, background: VARIANT_RENK.B }} />
          </div>
        </div>

        {/* aksiyonlar */}
        <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
          <button onClick={kapat} className="rounded-full px-4 py-2 text-[13px] font-medium text-slate-muted transition hover:bg-canvas">
            {t("modal.vazgec")}
          </button>
          <button
            onClick={() => gonder(false)} disabled={gonderiliyor}
            className="inline-flex items-center gap-1.5 rounded-full border border-line-strong px-4 py-2 text-[13px] font-semibold text-slate-ink transition hover:bg-canvas disabled:opacity-50"
          >
            {t("modal.taslakKaydet")}
          </button>
          <button
            onClick={() => gonder(true)} disabled={gonderiliyor}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            <Play className="size-4" /> {t("modal.olusturVeBaslat")} <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>
    </Modal>
  );
}

function VariantForm({ harf, cfg, onChange, t }: { harf: "A" | "B"; cfg: ExperimentVariantConfig; onChange: (c: ExperimentVariantConfig) => void; t: Ceviri }) {
  return (
    <div className="rounded-2xl border border-line bg-canvas/50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid size-6 place-items-center rounded-md text-[12px] font-bold text-white" style={{ background: VARIANT_RENK[harf] }}>{harf}</span>
        <span className="text-sm font-semibold text-slate-ink">{(harf === "A" ? t("modal.variantKontrol") : t("modal.variantDeney")).replace("{h}", harf)}</span>
      </div>
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-[12px] font-medium text-slate-muted">{t("modal.zorluk")}</span>
          <Secim value={cfg.difficulty} onChange={(e) => onChange({ ...cfg, difficulty: e.target.value as "low" | "medium" | "high" })}>
            <option value="low">{t("zorluk.low")}</option>
            <option value="medium">{t("zorluk.medium")}</option>
            <option value="high">{t("zorluk.high")}</option>
          </Secim>
        </label>
        <label className="block">
          <span className="mb-1 flex items-center justify-between text-[12px] font-medium text-slate-muted">
            {t("modal.davranisEsigi")} <span className="num text-slate-ink">{cfg.behaviorThreshold.toFixed(2)}</span>
          </span>
          <input
            type="range" min={0.1} max={0.9} step={0.01} value={cfg.behaviorThreshold}
            onChange={(e) => onChange({ ...cfg, behaviorThreshold: Number(e.target.value) })}
            className="w-full accent-brand-600" aria-label={t("modal.variantEsigiAria").replace("{h}", harf)}
          />
        </label>
        <label className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[12px] font-medium text-slate-muted">
            {cfg.invisibleMode ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />} {t("modal.gorunmezMod")}
          </span>
          <Toggle on={cfg.invisibleMode} onChange={(v) => onChange({ ...cfg, invisibleMode: v })} />
        </label>
      </div>
    </div>
  );
}
