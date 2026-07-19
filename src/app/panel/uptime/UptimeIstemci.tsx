"use client";

/**
 * Specter Uptime & SLA İzleme — İstemci görünümü
 * ==============================================
 * Specter'ın kendi platform servislerinin (Challenge/Verify/Siteverify/Passive
 * API, Widget CDN, Dashboard, Webhook, Edge) SRE seviyesi Uptime & SLA konsolu
 * (BetterUptime / Pingdom / Datadog tarzı):
 *
 *   1. Üst özet (genel uptime, aktif servis, ort. yanıt, 90g olay)
 *   2. SLA uyum özeti: gerçekleşen vs hedef, uyum rozeti (karşılandı/risk/ihlal),
 *      hata bütçesi göstergesi (tüketilen vs kalan — dakika), hedef kademe
 *   3. Servis sağlık matrisi (durum, gecikme, 90g uptime, 90g şerit)
 *   4. Gecikme yüzdelikleri: gerçek BotEvent.latency'den p50/p95/p99 +
 *      dağılım histogramı (stat kartları)
 *   5. Yanıt süresi trendi (24s/7g p50/p95/p99, servis seçilebilir)
 *   6. Hata bütçesi yakma (burn-down) trendi
 *   7. Olay/kesinti geçmişi (incident timeline — süre + SLA etkisi)
 *   8. Bölgesel sağlık (edge modülüyle uyumlu)
 *
 * Görsel dil Edge/Tehdit modülüyle tutarlı: krem zemin, ince çizgiler,
 * kit + grafikler bileşenleri. SLA çekirdeği @/lib/specter/sla (saf).
 */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Gauge,
  Server,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Timer,
  TrendingDown,
  Flame,
} from "lucide-react";
import {
  Panel,
  PanelBaslik,
  StatKart,
  Badge,
  DurumRozeti,
  Ilerleme,
  Tooltip,
  Tablo,
  type Kolon,
} from "@/components/panel/kit";
import { TrendGrafik, MiniSpark, DonutDagilim } from "@/components/panel/grafikler";
import { Histogram, Gauge as GaugeGost } from "@/components/panel/grafikler-ek";
import { cn } from "@/lib/cn";
import {
  type Servis,
  type Olay,
  type GunDurum,
  type BolgeSaglik,
  DURUM_META,
  GUN_RENK,
  ETKI_META,
  OLAY_DURUM_META,
} from "./servisler";
import type { Dil } from "@/lib/i18n/panel";
import { uptimeCeviri } from "./uptime.i18n";

/** Sayfa-yerel çeviri yardımcısı tipi. */
type Cevir = (anahtar: string) => string;

/* ------------------------------------------------------------------ tipler */
interface SeritGun {
  durum: GunDurum;
  ts: number;
}
interface ServisZengin extends Servis {
  serit: SeritGun[];
  gerceklesen90: number;
  trend24: { p50: number[]; p95: number[]; p99: number[] };
  trend7g: { p50: number[]; p95: number[]; p99: number[] };
  yuzdelik: { p50: number; p95: number; p99: number };
}
interface Ozet {
  genelUptime: number;
  operasyonelSayi: number;
  toplamServis: number;
  ortGecikme: number;
  olay90: number;
  dejenereSayi: number;
  kesintiSayi: number;
}
interface Sla {
  hedef: number;
  gerceklesen: number;
  /** İncident'lardan türetilen gerçekleşen aylık uptime. */
  gerceklesenAylik: number;
  durum: "karsilandi" | "risk" | "ihlal";
  karsilandi: boolean;
  izinliKesintiDk: number;
  tuketilenKesintiDk: number;
  kalanKesintiDk: number;
  kullanimYuzde: number;
  kalanYuzde: number;
  kademeEtiket: string;
  yillikDkIzin: number;
}
interface Kademe {
  hedef: number;
  etiket: string;
  aylikDkIzin: number;
  yillikDkIzin: number;
}
interface Yuzdelik {
  p50: number;
  p95: number;
  p99: number;
  ort: number;
  n: number;
  min: number;
  max: number;
  /** Gerçek trafik örneği mi (BotEvent.latency) yoksa temsili mi. */
  gercek: boolean;
}
interface OlayZengin extends Olay {
  etkiDk: number;
  butceYuzde: number;
}

/* ------------------------------------------------------------------ yardımcılar */
/** Gecikme (ms) → renk kodu (yanıt-süresi eşikleri). */
function gecikmeRengi(ms: number): string {
  if (ms <= 30) return "#16a34a"; // hızlı
  if (ms <= 70) return "#2f6fed"; // iyi
  if (ms <= 130) return "#d97706"; // orta
  return "#dc2626"; // yavaş
}
/** Gecikme (ms) → metin rengi sınıfı. */
function gecikmeSinif(ms: number): string {
  if (ms <= 30) return "text-ok";
  if (ms <= 70) return "text-brand-700";
  if (ms <= 130) return "text-warn";
  return "text-danger2";
}
/** "az önce" tarzı göreli süre (dile göre birim). */
function goreliSure(sn: number, t: Cevir): string {
  if (sn < 60) return `${sn} ${t("up.snOnce")}`;
  const dk = Math.floor(sn / 60);
  if (dk < 60) return `${dk} ${t("up.dkOnce")}`;
  return `${Math.floor(dk / 60)} ${t("up.saOnce")}`;
}
/** dil → Intl locale (kısa tarih için). */
const LOCALE: Record<Dil, string> = {
  tr: "tr-TR",
  en: "en-US",
  de: "de-DE",
  fr: "fr-FR",
  es: "es-ES",
};
/** ts → "16 Tem" tarzı, dile duyarlı kısa tarih. */
function kisaTarih(ts: number, dil: Dil): string {
  return new Intl.DateTimeFormat(LOCALE[dil], { day: "numeric", month: "short" }).format(
    new Date(ts),
  );
}

/* ------------------------------------------------------------------ ana bileşen */
export function UptimeIstemci({
  dil,
  ozet,
  servisler,
  olaylar,
  bolgeSaglik,
  sla,
  kademeler,
  yuzdelik,
  gecikmeDagilim,
  butceYakma,
}: {
  dil: Dil;
  ozet: Ozet;
  servisler: ServisZengin[];
  olaylar: OlayZengin[];
  bolgeSaglik: BolgeSaglik[];
  sla: Sla;
  kademeler: Kademe[];
  yuzdelik: Yuzdelik;
  gecikmeDagilim: { etiket: string; adet: number }[];
  butceYakma: number[];
}) {
  const t: Cevir = (k) => uptimeCeviri(k, dil);
  const hepsiOperasyonel = ozet.dejenereSayi === 0 && ozet.kesintiSayi === 0;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-6 pt-6 pb-10 lg:px-10">
      <PanelBaslik
        aciklama={t("up.aciklama")}
        aksiyon={
          <div className="flex items-center gap-2">
            <Badge ton="brand">
              <Server className="size-3" /> {ozet.toplamServis} {t("up.servisRozet")}
            </Badge>
            <DurumRozeti
              ton={hepsiOperasyonel ? "ok" : ozet.kesintiSayi > 0 ? "danger" : "warn"}
              etiket={hepsiOperasyonel ? t("up.hepsiCalisiyor") : t("up.kismiBozulma")}
              nabiz
            />
          </div>
        }
      />

      {/* ---- Dürüstlük notu: sayfadaki değerler temsili (canlı probing yok) ---- */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-warn-soft/40 px-5 py-3.5 text-[13px] text-amber-800">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <span>{t("up.temsiliNot")}</span>
      </div>

      {/* ---- 1. ÜST ÖZET ---- */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart
          sayi={`%${ozet.genelUptime.toFixed(3)}`}
          etiket={t("up.genelUptime")}
          ikon={<Activity className="size-5" />}
          tone={ozet.genelUptime >= 99.9 ? "ok" : "warn"}
        />
        <StatKart
          sayi={`${ozet.operasyonelSayi}/${ozet.toplamServis}`}
          etiket={t("up.operasyonelServis")}
          ikon={<CheckCircle2 className="size-5" />}
          tone={hepsiOperasyonel ? "ok" : "warn"}
          delta={
            ozet.dejenereSayi
              ? { value: `${ozet.dejenereSayi} ${t("up.dejenereDelta")}`, up: false, good: false }
              : undefined
          }
        />
        <StatKart
          sayi={`${ozet.ortGecikme} ms`}
          etiket={t("up.ortYanit")}
          ikon={<Gauge className="size-5" />}
          tone={ozet.ortGecikme <= 60 ? "ok" : "warn"}
        />
        <StatKart
          sayi={ozet.olay90}
          etiket={t("up.son90Olay")}
          ikon={<AlertTriangle className="size-5" />}
          tone={ozet.olay90 === 0 ? "ok" : "brand"}
        />
      </div>

      {/* ---- 1b. GENEL UPTIME GAUGE + KESİNTİ DAĞILIMI ---- */}
      <UptimeHeroPanel ozet={ozet} olaylar={olaylar} t={t} />

      {/* ---- 2. SLA UYUM ÖZETİ + HATA BÜTÇESİ GÖSTERGESİ ---- */}
      <SlaOzetPanel sla={sla} kademeler={kademeler} t={t} />

      {/* ---- 3. SERVİS SAĞLIK MATRİSİ + 90 GÜNLÜK ŞERİT ---- */}
      <Panel
        baslik={t("up.matrisBaslik")}
        sagUst={<SeritLejant t={t} />}
      >
        <div className="space-y-2.5">
          {servisler.map((s, i) => (
            <ServisSatir key={s.id} s={s} idx={i} dil={dil} t={t} />
          ))}
        </div>
      </Panel>

      {/* ---- 4. GECİKME YÜZDELİKLERİ (p50/p95/p99) + DAĞILIM ---- */}
      <YuzdelikPanel yuzdelik={yuzdelik} dagilim={gecikmeDagilim} t={t} />

      {/* ---- 5. YANIT SÜRESİ TRENDİ (servis seçilebilir) ---- */}
      <GecikmePanel servisler={servisler} t={t} />

      {/* ---- 6. HATA BÜTÇESİ YAKMA TRENDİ ---- */}
      <ButceYakmaPanel seri={butceYakma} sla={sla} t={t} />

      {/* ---- 7. OLAY / KESİNTİ GEÇMİŞİ (incident timeline) ---- */}
      <OlayPanel olaylar={olaylar} t={t} />

      {/* ---- 8. BÖLGESEL SAĞLIK ---- */}
      <BolgePanel bolgeler={bolgeSaglik} t={t} />
    </div>
  );
}

/* ------------------------------------------------------------------ SLA uyum etiketleri */
const SLA_DURUM_META: Record<
  Sla["durum"],
  { badge: "yesil" | "sari" | "kirmizi"; etiketKey: string; ton: "ok" | "warn" | "danger" }
> = {
  karsilandi: { badge: "yesil", etiketKey: "up.slaKarsilandi", ton: "ok" },
  risk: { badge: "sari", etiketKey: "up.slaRiskte", ton: "warn" },
  ihlal: { badge: "kirmizi", etiketKey: "up.slaIhlal", ton: "danger" },
};

/* ------------------------------------------------------------------ Şerit lejantı */
function SeritLejant({ t }: { t: Cevir }) {
  return (
    <div className="flex items-center gap-3 text-[11.5px] text-slate-muted">
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-[2px]" style={{ background: GUN_RENK.up }} /> {t("up.lejantCalisiyor")}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-[2px]" style={{ background: GUN_RENK.degraded }} /> {t("up.lejantDejenere")}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-[2px]" style={{ background: GUN_RENK.down }} /> {t("up.lejantKesinti")}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ Servis satırı (üst bilgi + 90g şerit) */
function ServisSatir({ s, idx, dil, t }: { s: ServisZengin; idx: number; dil: Dil; t: Cevir }) {
  const dm = DURUM_META[s.durum];
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: idx * 0.025, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-line bg-surface px-4 py-3.5 transition hover:border-line-strong"
    >
      {/* üst bilgi */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-[14px] font-semibold text-slate-ink">{t(`up.svc.${s.id}.ad`)}</span>
            <span className="shrink-0 rounded bg-canvas px-1.5 py-0.5 text-[10.5px] font-medium text-slate-muted">
              {t(`up.grup.${s.grup}`)}
            </span>
          </div>
          <div className="mt-0.5 truncate text-[11.5px] text-slate-faint">{t(`up.svc.${s.id}.ac`)}</div>
        </div>
        <div className="flex items-center gap-4">
          {/* Servis-bazlı p50/p95/p99 (son 24s örneklerinden) */}
          <div className="hidden items-center gap-3 sm:flex">
            {(["p50", "p95", "p99"] as const).map((k) => (
              <div key={k} className="text-right">
                <div
                  className="num text-[13px] font-semibold leading-none"
                  style={{ color: gecikmeRengi(s.yuzdelik[k]) }}
                >
                  {s.yuzdelik[k]}
                  <span className="text-[9.5px] font-medium text-slate-faint"> ms</span>
                </div>
                <div className="text-[9.5px] uppercase tracking-wide text-slate-faint">{k}</div>
              </div>
            ))}
          </div>
          <div className="text-right">
            <div className={cn("num text-[15px] font-bold leading-none", gecikmeSinif(s.gecikme))}>
              {s.gecikme}
              <span className="text-[10.5px] font-medium text-slate-faint"> ms</span>
            </div>
            <div className="text-[10px] text-slate-faint">{t("up.guncel")}</div>
          </div>
          <DurumRozeti ton={dm.ton} etiket={t(`up.durum.${s.durum}`)} nabiz={dm.nabiz} />
        </div>
      </div>

      {/* 90 günlük şerit + yanıt-süresi mini-trend */}
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_120px] sm:items-center">
        <div>
          <UptimeSerit serit={s.serit} dil={dil} t={t} />
          <div className="mt-1.5 flex items-center justify-between text-[10.5px] text-slate-faint">
            <span>{t("up.gunOnce90")}</span>
            <span className="num font-semibold text-slate-muted">
              %{s.gerceklesen90.toFixed(3)} {t("up.uptimeSonKontrol")} {goreliSure(s.sonKontrolSn, t)}
            </span>
            <span>{t("up.bugun")}</span>
          </div>
        </div>
        {/* servis-bazlı yanıt süresi mini-spark (24s p95) */}
        <div className="hidden sm:block">
          <MiniSpark tohum={`${s.id}-lat`} renk={gecikmeRengi(s.yuzdelik.p95)} yukseklik={34} />
          <div className="mt-0.5 text-right text-[9.5px] text-slate-faint">{t("up.trendGuncel")}</div>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ 90 günlük uptime şeridi (dikey çubuklar) */
function UptimeSerit({ serit, dil, t }: { serit: SeritGun[]; dil: Dil; t: Cevir }) {
  const etiketDurum: Record<GunDurum, string> = {
    up: t("up.gunUp"),
    degraded: t("up.gunDegraded"),
    down: t("up.gunDown"),
  };
  return (
    <div className="flex items-stretch gap-[2px]">
      {serit.map((g, i) => (
        <Tooltip
          key={i}
          metin={`${kisaTarih(g.ts, dil)} — ${etiketDurum[g.durum]}`}
          className="flex-1"
        >
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.3, delay: i * 0.004, ease: [0.16, 1, 0.3, 1] }}
            className="h-8 w-full rounded-[1.5px] transition hover:opacity-70"
            style={{ background: GUN_RENK[g.durum], transformOrigin: "bottom" }}
          />
        </Tooltip>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ Gecikme trendi paneli */
function GecikmePanel({ servisler, t }: { servisler: ServisZengin[]; t: Cevir }) {
  const [seciliId, setSeciliId] = useState(servisler[0]?.id ?? "");
  const [aralik, setAralik] = useState<"24s" | "7g">("24s");
  const secili = servisler.find((s) => s.id === seciliId) ?? servisler[0];

  const veri = aralik === "24s" ? secili?.trend24 : secili?.trend7g;
  const etiketler = useMemo(() => {
    if (!veri) return [];
    if (aralik === "24s") {
      // son 24 saat: 23sa önce → şimdi
      return veri.p50.map((_, i) => {
        const saat = (new Date().getHours() - (veri.p50.length - 1 - i) + 24) % 24;
        return `${String(saat).padStart(2, "0")}:00`;
      });
    }
    // 7 gün
    return veri.p50.map((_, i) => `${veri.p50.length - i}g`);
  }, [veri, aralik]);

  if (!secili || !veri) return null;

  const sonP99 = veri.p99[veri.p99.length - 1] ?? 0;

  return (
    <Panel
      baslik={t("up.trendBaslik")}
      sagUst={
        <div className="flex items-center gap-1.5 rounded-full bg-canvas p-0.5">
          {(["24s", "7g"] as const).map((a) => (
            <button
              key={a}
              onClick={() => setAralik(a)}
              className={cn(
                "rounded-full px-3 py-1 text-[12px] font-medium transition",
                aralik === a ? "bg-brand-600 text-white" : "text-slate-muted hover:text-slate-ink",
              )}
            >
              {a === "24s" ? t("up.son24s") : t("up.son7g")}
            </button>
          ))}
        </div>
      }
    >
      {/* servis seçici */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {servisler.map((s) => (
          <button
            key={s.id}
            onClick={() => setSeciliId(s.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition",
              s.id === seciliId
                ? "bg-brand-600 text-white"
                : "bg-canvas text-slate-muted hover:bg-slate-100",
            )}
          >
            <span
              className="size-1.5 rounded-full"
              style={{
                background:
                  s.id === seciliId
                    ? "#fff"
                    : s.durum === "operasyonel"
                      ? "#16a34a"
                      : s.durum === "dejenere"
                        ? "#d97706"
                        : "#dc2626",
              }}
            />
            {t(`up.svc.${s.id}.ad`)}
          </button>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-4 text-[12px]">
        <span className="flex items-center gap-1.5 text-slate-muted">
          <Zap className="size-3.5" style={{ color: gecikmeRengi(secili.gecikme) }} />
          {t("up.trendGuncel")} <b className="num text-slate-ink">{secili.gecikme} ms</b>
        </span>
        <span className="num text-slate-muted">
          {t("up.trendP99Son")} <b style={{ color: gecikmeRengi(sonP99) }}>{sonP99} ms</b>
        </span>
      </div>

      <TrendGrafik
        noktalar={veri.p50}
        seriler={[veri.p50, veri.p95, veri.p99]}
        renkler={["#16a34a", "#2f6fed", "#dc2626"]}
        seriEtiketleri={["p50", "p95", "p99"]}
        etiketler={etiketler}
        yukseklik={240}
      />
    </Panel>
  );
}

/* ------------------------------------------------------------------ Genel uptime hero (gauge + servis/olay donut) */
function UptimeHeroPanel({ ozet, olaylar, t }: { ozet: Ozet; olaylar: OlayZengin[]; t: Cevir }) {
  // Genel uptime gauge: %99..%100 aralığına genişletilmiş ölçek.
  const uptimeGauge = Math.max(0, Math.min(100, ((ozet.genelUptime - 99) / 1) * 100));
  const uptimeIyi = ozet.genelUptime >= 99.9;

  // Servis durum dağılımı (donut) — özet sayacından türetilir.
  const servisSeg = [
    { etiket: t("up.durum.operasyonel"), deger: ozet.operasyonelSayi, renk: "#16a34a" },
    { etiket: t("up.durum.dejenere"), deger: ozet.dejenereSayi, renk: "#d97706" },
    { etiket: t("up.durum.kesinti"), deger: ozet.kesintiSayi, renk: "#dc2626" },
  ].filter((s) => s.deger > 0);

  // Olay etki dağılımı (donut) — 90 günlük olaylardan gruplanır.
  const etkiSayac = { kismi: 0, tam: 0, bakim: 0 } as Record<OlayZengin["etki"], number>;
  for (const o of olaylar) etkiSayac[o.etki]++;
  const olaySeg = [
    { etiket: t("up.etki.tam"), deger: etkiSayac.tam, renk: "#dc2626" },
    { etiket: t("up.etki.kismi"), deger: etkiSayac.kismi, renk: "#d97706" },
    { etiket: t("up.etki.bakim"), deger: etkiSayac.bakim, renk: "#2f6fed" },
  ].filter((s) => s.deger > 0);

  return (
    <Panel
      baslik={t("up.genelUptime")}
      sagUst={
        <Badge ton={uptimeIyi ? "yesil" : "sari"}>
          <Activity className="size-3" /> %{ozet.genelUptime.toFixed(3)}
        </Badge>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Genel uptime gauge */}
        <motion.div
          initial={{ y: 8 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center justify-center rounded-2xl border border-line bg-canvas/40 p-4"
        >
          <GaugeGost
            deger={uptimeGauge}
            etiket={t("up.genelUptime")}
            boyut={176}
            renk={uptimeIyi ? "#16a34a" : "#d97706"}
          />
          <div className="num mt-1 text-[13px] font-semibold text-slate-ink">%{ozet.genelUptime.toFixed(3)}</div>
          <div className="text-[11px] text-slate-faint">{t("up.son90Olay")}: {ozet.olay90}</div>
        </motion.div>

        {/* Servis durum dağılımı */}
        <motion.div
          initial={{ y: 8 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl border border-line bg-canvas/40 p-4"
        >
          <div className="mb-2 text-[12px] font-medium text-slate-muted">{t("up.operasyonelServis")}</div>
          <DonutDagilim segmentler={servisSeg} merkezEtiket={t("up.servisRozet")} />
        </motion.div>

        {/* Olay etki dağılımı */}
        <motion.div
          initial={{ y: 8 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.35, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl border border-line bg-canvas/40 p-4"
        >
          <div className="mb-2 text-[12px] font-medium text-slate-muted">{t("up.olayBaslik")}</div>
          <DonutDagilim segmentler={olaySeg} merkezEtiket={t("up.kayit")} />
        </motion.div>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ SLA uyum özeti + hata bütçesi göstergesi */
function SlaOzetPanel({ sla, kademeler, t }: { sla: Sla; kademeler: Kademe[]; t: Cevir }) {
  const meta = SLA_DURUM_META[sla.durum];
  // Bütçe göstergesi (gauge): tüketilen pay 0..100.
  const tuketilenYuzde = Math.min(100, sla.kullanimYuzde);
  return (
    <Panel
      baslik={t("up.slaBaslik")}
      sagUst={
        <Badge ton={meta.badge}>
          {sla.durum === "ihlal" ? (
            <ShieldAlert className="size-3" />
          ) : sla.durum === "risk" ? (
            <AlertTriangle className="size-3" />
          ) : (
            <ShieldCheck className="size-3" />
          )}
          {t(meta.etiketKey)}
        </Badge>
      }
    >
      <div className="grid gap-5 lg:grid-cols-3">
        {/* --- Gerçekleşen vs hedef (gauge) --- */}
        <div className="rounded-2xl border border-line bg-canvas/40 p-4">
          <div className="flex items-center justify-between">
            <div className="text-[12px] font-medium text-slate-muted">{t("up.gerceklesenUptime")}</div>
            <span className="rounded-full bg-canvas px-2 py-0.5 text-[11px] font-semibold text-slate-muted">
              {t("up.hedef")} {sla.kademeEtiket}
            </span>
          </div>
          <div className="mt-1 grid grid-cols-[auto,1fr] items-center gap-3">
            {/* %99..%100 aralığına genişletilmiş ölçek üzerinde gauge. */}
            <GaugeGost
              deger={Math.max(0, Math.min(100, ((sla.gerceklesenAylik - 99) / 1) * 100))}
              etiket={t("up.taahhut")}
              boyut={128}
              renk={meta.ton === "ok" ? "#16a34a" : meta.ton === "warn" ? "#d97706" : "#dc2626"}
            />
            <div>
              <div className={cn("num text-[30px] font-bold leading-none", meta.ton === "ok" ? "text-ok" : meta.ton === "warn" ? "text-warn" : "text-danger2")}>
                %{sla.gerceklesenAylik.toFixed(3)}
              </div>
              <div className="mt-1.5 text-[12px] text-slate-faint">
                {sla.karsilandi ? t("up.hedefUstunde") : t("up.hedefAltinda")}
              </div>
              <div className="num mt-0.5 text-[12px] text-slate-muted">{t("up.taahhut")} %{sla.hedef}</div>
            </div>
          </div>
        </div>

        {/* --- Hata bütçesi göstergesi (kalan pay gauge) --- */}
        <div className="rounded-2xl border border-line bg-canvas/40 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-muted">
              <Timer className="size-3.5" /> {t("up.aylikHataButcesi")}
            </div>
            <span
              className={cn(
                "num text-[12px] font-bold",
                sla.kalanYuzde > 30 ? "text-ok" : sla.kalanYuzde > 0 ? "text-warn" : "text-danger2",
              )}
            >
              %{sla.kalanYuzde.toFixed(0)} {t("up.kaldiYuzde")}
            </span>
          </div>
          <div className="mt-1 grid grid-cols-[auto,1fr] items-center gap-3">
            {/* Kalan bütçe payı gauge (0..100). */}
            <GaugeGost
              deger={Math.max(0, Math.min(100, sla.kalanYuzde))}
              etiket={t("up.kaldiYuzde")}
              boyut={128}
              renk={sla.kalanYuzde > 30 ? "#16a34a" : sla.kalanYuzde > 0 ? "#d97706" : "#dc2626"}
            />
            <div>
              <div className="num text-[30px] font-bold leading-none text-slate-ink">
                {sla.kalanKesintiDk.toFixed(1)}
                <span className="ml-1 text-[12px] font-medium text-slate-faint">{t("up.dkKaldi")}</span>
              </div>
              <div className="mt-1.5 text-[12px] text-slate-faint">
                {sla.tuketilenKesintiDk.toFixed(1)} / {sla.izinliKesintiDk.toFixed(1)} {t("up.dk")} {t("up.tuketildi")}
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-canvas">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${tuketilenYuzde}%`,
                    background: sla.kalanYuzde > 30 ? "#16a34a" : sla.kalanYuzde > 0 ? "#d97706" : "#dc2626",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* --- SLA kademe modeli (dokuzlar) --- */}
        <div className="rounded-2xl border border-line bg-canvas/40 p-4">
          <div className="text-[12px] font-medium text-slate-muted">{t("up.slaKademeleri")}</div>
          <div className="mt-3 space-y-2.5">
            {kademeler.map((k) => {
              const aktif = Math.abs(k.hedef - sla.hedef) < 1e-9;
              return (
                <div
                  key={k.hedef}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[12px]",
                    aktif ? "bg-brand-50 ring-1 ring-brand-100" : "",
                  )}
                >
                  <span className={cn("num font-semibold", aktif ? "text-brand-700" : "text-slate-ink")}>
                    {k.etiket}
                    {aktif && <span className="ml-1.5 text-[10px] font-medium text-brand-600">{t("up.aktifHedef")}</span>}
                  </span>
                  <span className="num text-slate-muted">
                    {k.aylikDkIzin} {t("up.dkAy")} · {(k.yillikDkIzin / 60).toFixed(1)} {t("up.saYil")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="mt-4 border-t border-line pt-3 text-[12px] leading-relaxed text-slate-faint">
        <b className="text-slate-ink">{t("up.butceAciklamaBas")}</b>
        {t("up.butceAciklama")
          .replace("{hedef}", `%${sla.hedef}`)
          .replace("{izinli}", sla.izinliKesintiDk.toFixed(1))}
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ Gecikme yüzdelikleri + dağılım */
function YuzdelikPanel({
  yuzdelik,
  dagilim,
  t,
}: {
  yuzdelik: Yuzdelik;
  dagilim: { etiket: string; adet: number }[];
  t: Cevir;
}) {
  const enBuyukAdet = Math.max(1, ...dagilim.map((d) => d.adet));
  return (
    <Panel
      baslik={t("up.yuzdelikBaslik")}
      sagUst={
        <Badge ton={yuzdelik.gercek ? "yesil" : "gri"}>
          <Activity className="size-3" />
          {yuzdelik.gercek
            ? `${yuzdelik.n.toLocaleString("tr-TR")} ${t("up.gercekOrnek")}`
            : t("up.temsiliDagilim")}
        </Badge>
      }
    >
      <div className="grid grid-cols-3 gap-4">
        {(
          [
            { k: "p50", v: yuzdelik.p50, aciklama: t("up.medyanYanit") },
            { k: "p95", v: yuzdelik.p95, aciklama: t("up.kuyruk95") },
            { k: "p99", v: yuzdelik.p99, aciklama: t("up.enKotu1") },
          ] as const
        ).map((m) => (
          <div key={m.k} className="rounded-2xl border border-line bg-canvas/40 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-faint">
              {m.k}
            </div>
            <div className="mt-1.5 flex items-end gap-1">
              <span
                className="num text-[30px] font-bold leading-none"
                style={{ color: gecikmeRengi(m.v) }}
              >
                {m.v}
              </span>
              <span className="mb-0.5 text-[12px] text-slate-faint">ms</span>
            </div>
            <div className="mt-1 text-[11.5px] text-slate-faint">{m.aciklama}</div>
          </div>
        ))}
      </div>

      {/* özet satırı */}
      <div className="mt-3 flex flex-wrap items-center gap-4 rounded-xl bg-canvas/60 px-3 py-2 text-[12px] text-slate-muted">
        <span className="num">{t("up.ort")} <b className="text-slate-ink">{yuzdelik.ort} ms</b></span>
        <span className="num">{t("up.min")} <b className="text-slate-ink">{yuzdelik.min} ms</b></span>
        <span className="num">{t("up.max")} <b className="text-slate-ink">{yuzdelik.max} ms</b></span>
        <span className="num">{t("up.ornek")} <b className="text-slate-ink">{yuzdelik.n.toLocaleString("tr-TR")}</b></span>
      </div>

      {/* dağılım histogramı (dikey kova — yatay-bar tekrarını kırar) */}
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[12px] font-medium text-slate-muted">{t("up.yanitDagilimi")}</div>
          <div className="num text-[11px] text-slate-faint">{t("up.max")} {enBuyukAdet.toLocaleString("tr-TR")}</div>
        </div>
        <div className="rounded-2xl border border-line bg-canvas/40 p-4">
          <Histogram
            yukseklik={120}
            kovalar={dagilim.map((d) => {
              const ust = parseInt(d.etiket.replace(/[^\d]/g, ""), 10) || 500;
              return {
                etiket: `${d.etiket}ms`,
                deger: d.adet,
                ton: ust <= 30 ? ("insan" as const) : ust > 130 ? ("bot" as const) : ("nötr" as const),
              };
            })}
          />
        </div>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ Hata bütçesi yakma trendi */
function ButceYakmaPanel({ seri, sla, t }: { seri: number[]; sla: Sla; t: Cevir }) {
  const son = seri[seri.length - 1] ?? 100;
  const etiketler = seri.map((_, i) => `${seri.length - i}g`);
  return (
    <Panel
      baslik={t("up.yakmaBaslik")}
      sagUst={
        <div className="flex items-center gap-2">
          <Badge ton={son > 30 ? "yesil" : son > 0 ? "sari" : "kirmizi"}>
            {son > 30 ? <TrendingDown className="size-3" /> : <Flame className="size-3" />}
            %{son.toFixed(0)} {t("up.kaldiYuzde")}
          </Badge>
        </div>
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-4 text-[12px] text-slate-muted">
        <span>{t("up.yakmaAciklama").replace("{kademe}", sla.kademeEtiket)}</span>
      </div>
      <TrendGrafik
        noktalar={seri}
        renk="#2f6fed"
        etiketler={etiketler}
        yukseklik={200}
      />
    </Panel>
  );
}

/* ------------------------------------------------------------------ Bölgesel sağlık paneli */
function BolgePanel({ bolgeler, t }: { bolgeler: BolgeSaglik[]; t: Cevir }) {
  return (
    <Panel
      baslik={t("up.bolgeBaslik")}
      sagUst={<Badge ton="brand"><Activity className="size-3" /> {bolgeler.length} {t("up.bolgeRozet")}</Badge>}
    >
      <div className="space-y-3">
        {bolgeler.map((b, i) => {
          const dm = DURUM_META[b.durum];
          return (
            <motion.div
              key={b.ad}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
              className="flex items-center gap-3"
            >
              <span
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  dm.ton === "ok" ? "bg-ok" : dm.ton === "warn" ? "bg-warn" : "bg-danger2",
                )}
              />
              <span className="w-32 shrink-0 truncate text-[13px] font-medium text-slate-ink">
                {t(`up.bolge.${b.ad}`)}
              </span>
              <div className="flex-1">
                <Ilerleme
                  deger={Math.min(100, ((b.erisim - 99.8) / 0.2) * 100)}
                  ton={dm.ton === "ok" ? "ok" : dm.ton === "warn" ? "warn" : "danger"}
                />
              </div>
              <span className="num w-14 shrink-0 text-right text-[12.5px] font-semibold text-slate-ink">
                %{b.erisim.toFixed(2)}
              </span>
              <span
                className="num w-12 shrink-0 text-right text-[12px]"
                style={{ color: gecikmeRengi(b.gecikme) }}
              >
                {b.gecikme}ms
              </span>
            </motion.div>
          );
        })}
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ Olay geçmişi paneli (incident timeline) */
function OlayPanel({ olaylar, t }: { olaylar: OlayZengin[]; t: Cevir }) {
  // Görünen olay metinlerini id anahtarına göre çevir (DATA ham hâliyle kalır).
  const svcAd = (o: OlayZengin) => t(`up.svc.${o.servisId}.ad`);
  const olayBaslik = (o: OlayZengin) => t(`up.inc.${o.id}.baslik`);
  const olayNot = (o: OlayZengin) => t(`up.inc.${o.id}.not`);

  const kolonlar: Kolon<OlayZengin>[] = [
    {
      baslik: t("up.kolServis"),
      render: (o) => <span className="font-medium text-slate-ink">{svcAd(o)}</span>,
    },
    {
      baslik: t("up.kolOlay"),
      render: (o) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-slate-ink">{olayBaslik(o)}</div>
          <div className="mt-0.5 max-w-md truncate text-[12px] text-slate-faint">{olayNot(o)}</div>
        </div>
      ),
    },
    {
      baslik: t("up.kolBaslangic"),
      render: (o) => <span className="num text-slate-muted">{o.baslangic}</span>,
    },
    {
      baslik: t("up.kolSure"),
      render: (o) => (
        <span className="num inline-flex items-center gap-1 text-slate-ink">
          <Clock className="size-3.5 text-slate-faint" />
          {o.sureDk} {t("up.dk")}
        </span>
      ),
    },
    {
      baslik: t("up.kolSlaEtki"),
      render: (o) =>
        o.etki === "bakim" ? (
          <span className="text-[12px] text-slate-faint">{t("up.butceDisi")}</span>
        ) : (
          <span className="num inline-flex items-center gap-1.5 text-slate-ink">
            <span className="font-semibold">{o.etkiDk} {t("up.dk")}</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold",
                o.butceYuzde >= 50
                  ? "bg-danger-soft text-red-700"
                  : o.butceYuzde >= 20
                    ? "bg-warn-soft text-amber-700"
                    : "bg-ok-soft text-green-700",
              )}
            >
              {t("up.butce")} %{o.butceYuzde.toFixed(0)}
            </span>
          </span>
        ),
    },
    {
      baslik: t("up.kolEtki"),
      render: (o) => {
        const m = ETKI_META[o.etki];
        return <Badge ton={m.ton}>{t(`up.etki.${o.etki}`)}</Badge>;
      },
    },
    {
      baslik: t("up.kolDurum"),
      render: (o) => {
        const m = OLAY_DURUM_META[o.durum];
        return <Badge ton={m.ton}>{t(`up.olayDurum.${o.durum}`)}</Badge>;
      },
    },
  ];
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-[15px] font-semibold text-slate-ink">{t("up.olayBaslik")}</h2>
        <span className="text-[13px] text-slate-muted">{t("up.son90Kayit")} · {olaylar.length} {t("up.kayit")}</span>
      </div>
      <Tablo
        kolonlar={kolonlar}
        veri={olaylar}
        bosMesaj={t("up.olayBos")}
        ara={(o) => `${svcAd(o)} ${olayBaslik(o)} ${olayNot(o)}`}
        araPlaceholder={t("up.olayAra")}
      />
    </div>
  );
}
