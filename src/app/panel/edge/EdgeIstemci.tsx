"use client";

/**
 * Specter Edge Ağı — İstemci görünümü
 * ===================================
 * Küresel anycast edge ağının (PoP'lar) görünürlük modülü:
 *  1. Üst özet (aktif PoP, ort. gecikme, edge'de işlenen %, uptime)
 *  2. Küresel PoP haritası (dünya SVG + noktalar) + bölge-gruplu PoP kartları
 *  3. Bölgesel trafik dağılımı (donut) + en yakın-PoP yönlendirme mantığı
 *  4. Gecikme analizi (bölge bazlı p50/p95/p99)
 *  5. Edge sağlık zaman çizelgesi (son 24s durum şeridi + uptime trendi)
 *  6. Anycast / yönlendirme açıklaması
 *
 * Tüm görsel dil Tehdit modülüyle tutarlı: krem zemin, ince çizgiler,
 * kit + grafikler bileşenleri. Grafik kütüphanesi yok.
 */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Globe, Network, Server, Radio, Activity, Gauge, MapPin,
  Route, ShieldAlert, ArrowRightLeft, TrendingUp, Zap, Power,
} from "lucide-react";
import {
  PanelBaslik, Panel, Badge, StatKart, DurumRozeti, Ilerleme, Tooltip,
} from "@/components/panel/kit";
import { DonutDagilim, TrendGrafik } from "@/components/panel/grafikler";
import { IsiMatris, Gauge as GaugeGost } from "@/components/panel/grafikler-ek";
import { cn } from "@/lib/cn";
import { bayrak } from "@/lib/flag";
import type { Dil } from "@/lib/i18n/panel";
import { edgeCeviri } from "./edge.i18n";
import {
  type Pop, type EdgeBolge, type PopDurum,
  BOLGE_RENK, DURUM_META, gecikmeRengi,
} from "./pops";
import { KITALAR } from "./dunya-path";
import {
  failoverPlan, type YonPop, type FailoverHedef,
} from "@/lib/specter/edge-yonlendirme";
import { projeksiyon } from "@/lib/specter/ulke-koordinat";

/** Bölge enum → çevrilmiş görüntü etiketi (enum değeri korunur). */
function bolgeAd(dil: Dil, b: EdgeBolge): string {
  return edgeCeviri(`ed.bolge.${b}`, dil);
}
/** Durum enum → çevrilmiş görüntü etiketi (enum değeri + rozet tonu korunur). */
function durumEtiket(dil: Dil, d: PopDurum): string {
  return edgeCeviri(`ed.durum.${d}`, dil);
}

/* ------------------------------------------------------------------ tipler */
interface Ozet {
  aktifPop: number;
  toplamPop: number;
  ortGecikme: number;
  edgeIslenen: number;
  uptime: number;
}
interface BolgeDagilim {
  bolge: EdgeBolge;
  deger: number;
  popSayi: number;
}
interface GecikmeBolge {
  bolge: EdgeBolge;
  p50: number;
  p95: number;
  p99: number;
  popSayi: number;
}
interface SaglikSaat {
  saat: number;
  durum: "ok" | "warn" | "danger";
}
/** PoP sağlık matrisi satırı (gerçek yükten türetilir). */
export interface SaglikMatrisSatir {
  kod: string;
  olay: number;
  yukPay: number;
  anycast: number;
  saglikSeviye: "yesil" | "sari" | "kirmizi";
  kullanim: number;
  headroom: number;
}
/** Bir trafik kaynağı → en yakın PoP akış hattı. */
export interface Akis {
  ulke: string;
  adet: number;
  lat: number;
  lon: number;
  popKod: string;
  mesafeKm: number;
}
/** Ağ geneli kapasite özeti (kapasiteOzet çıktısı). */
export interface KapasiteOzetDto {
  toplamKapasiteRps: number;
  kullanilanRps: number;
  headroomYuzde: number;
  enDolu: string | null;
}

function kisaSayi(n: number): string {
  const a = Math.abs(n);
  if (a >= 1_000_000) return (n / 1_000_000).toFixed(a % 1_000_000 ? 1 : 0) + "M";
  if (a >= 1_000) return (n / 1_000).toFixed(a % 1_000 ? 1 : 0) + "B";
  return String(n);
}

/* ------------------------------------------------------------------ ana bileşen */
export function EdgeIstemci({
  dil, ozet, pops, bolgeDagilim, gecikmeBolge, saglikSerit, uptimeTrend, saatEtiketleri, olayVar,
  saglikMatris, akislar, kapasite, toplamYonlenen,
}: {
  dil: Dil;
  ozet: Ozet;
  pops: Pop[];
  bolgeDagilim: BolgeDagilim[];
  gecikmeBolge: GecikmeBolge[];
  saglikSerit: SaglikSaat[];
  uptimeTrend: number[];
  saatEtiketleri: string[];
  olayVar: boolean;
  saglikMatris: SaglikMatrisSatir[];
  akislar: Akis[];
  kapasite: KapasiteOzetDto;
  toplamYonlenen: number;
}) {
  const t = (k: string) => edgeCeviri(k, dil);
  const [seciliBolge, setSeciliBolge] = useState<EdgeBolge | "all">("all");

  const bolgeler = useMemo(() => {
    const set = new Set(pops.map((p) => p.bolge));
    return [...set];
  }, [pops]);

  const gorunenPops = useMemo(
    () => (seciliBolge === "all" ? pops : pops.filter((p) => p.bolge === seciliBolge)),
    [pops, seciliBolge],
  );

  // Bölge → PoP grupları (kart bölümü için).
  const gruplar = useMemo(() => {
    const m = new Map<EdgeBolge, Pop[]>();
    for (const p of gorunenPops) {
      if (!m.has(p.bolge)) m.set(p.bolge, []);
      m.get(p.bolge)!.push(p);
    }
    return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [gorunenPops]);

  const donutSegmentler = bolgeDagilim.map((r) => ({
    etiket: bolgeAd(dil, r.bolge),
    deger: r.deger,
    renk: BOLGE_RENK[r.bolge],
  }));

  const toplamRps = pops.reduce((a, p) => a + p.rps, 0);
  const dejenereSayi = pops.filter((p) => p.durum === "dejenere").length;
  const bakimSayi = pops.filter((p) => p.durum === "bakim").length;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-6 pt-6 pb-10 lg:px-10">
      <PanelBaslik
        aciklama={t("ed.aciklama")}
        aksiyon={
          <div className="flex items-center gap-2">
            <Badge ton="brand"><Network className="size-3" /> {pops.length} PoP · {bolgeler.length} {t("ed.bolge")}</Badge>
            <DurumRozeti ton="ok" etiket={`${kisaSayi(toplamRps)} ${t("ed.rpsCanli")}`} nabiz />
          </div>
        }
      />

      {/* ---- 1. ÜST ÖZET ---- */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart
          sayi={`${ozet.aktifPop}/${ozet.toplamPop}`}
          etiket={t("ed.ozet.aktifPop")}
          ikon={<Radio className="size-5" />}
          tone="ok"
          delta={bakimSayi ? { value: `${bakimSayi} ${t("ed.ozet.bakimda")}`, up: false, good: false } : undefined}
        />
        <StatKart
          sayi={`${ozet.ortGecikme} ms`}
          etiket={t("ed.ozet.ortGecikme")}
          ikon={<Gauge className="size-5" />}
          tone={ozet.ortGecikme <= 12 ? "ok" : "warn"}
        />
        <StatKart
          sayi={`%${ozet.edgeIslenen.toFixed(1)}`}
          etiket={t("ed.ozet.edgeIslenen")}
          ikon={<Server className="size-5" />}
          tone="brand"
        />
        <StatKart
          sayi={`%${ozet.uptime.toFixed(2)}`}
          etiket={t("ed.ozet.uptime")}
          ikon={<Activity className="size-5" />}
          tone="ok"
          delta={dejenereSayi ? { value: `${dejenereSayi} ${t("ed.ozet.dejenere")}`, up: false, good: false } : undefined}
        />
      </div>

      {/* ---- 1b. NOC gösterge şeridi: uptime / edge-işlenen / ort-gecikme gauge ---- */}
      <Panel
        baslik={t("ed.saglik.baslik")}
        sagUst={<Badge ton="yesil"><Activity className="size-3" /> {t("ed.saglik.nocSeridi")}</Badge>}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {/* uptime — yüksek iyi, doğrudan yüzde */}
          <div className="flex flex-col items-center gap-1 rounded-2xl border border-line bg-canvas/40 py-4">
            <GaugeGost deger={ozet.uptime} etiket={t("ed.ozet.uptime")} boyut={168} renk="#16a34a" />
            <span className="num text-[12px] text-slate-muted">%{ozet.uptime.toFixed(2)}</span>
          </div>
          {/* edge'de işlenen — yüksek iyi */}
          <div className="flex flex-col items-center gap-1 rounded-2xl border border-line bg-canvas/40 py-4">
            <GaugeGost deger={ozet.edgeIslenen} etiket={t("ed.ozet.edgeIslenen")} boyut={168} renk="#2f6fed" />
            <span className="num text-[12px] text-slate-muted">%{ozet.edgeIslenen.toFixed(1)}</span>
          </div>
          {/* ort. gecikme — düşük iyi; 40ms ölçekte tersine çevirerek "iyilik" göster */}
          <div className="flex flex-col items-center gap-1 rounded-2xl border border-line bg-canvas/40 py-4">
            <GaugeGost deger={Math.max(0, Math.min(100, 100 - (ozet.ortGecikme / 40) * 100))} etiket={t("ed.ozet.ortGecikme")} boyut={168} />
            <span className="num text-[12px] text-slate-muted">{ozet.ortGecikme} ms</span>
          </div>
        </div>
      </Panel>

      {/* ---- 2. KÜRESEL PoP HARİTASI (trafik akış hatlarıyla) ---- */}
      <DunyaHaritasi dil={dil} pops={pops} akislar={akislar} toplamYonlenen={toplamYonlenen} />

      {/* ---- 2b. Bölge filtresi + PoP kartları (bölge-gruplu) ---- */}
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-semibold text-slate-ink">{t("ed.lok.baslik")}</h2>
            <span className="text-[13px] text-slate-muted">{gorunenPops.length} PoP</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <FiltreBtn aktif={seciliBolge === "all"} onClick={() => setSeciliBolge("all")}>{t("ed.lok.tumu")}</FiltreBtn>
            {bolgeler.map((b) => (
              <FiltreBtn key={b} aktif={seciliBolge === b} onClick={() => setSeciliBolge(b)}>
                <span className="size-2 rounded-full" style={{ background: BOLGE_RENK[b] }} />
                {bolgeAd(dil, b)}
              </FiltreBtn>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          {gruplar.map(([bolge, list]) => (
            <div key={bolge}>
              <div className="mb-2.5 flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ background: BOLGE_RENK[bolge] }} />
                <h3 className="text-[13px] font-semibold uppercase tracking-wide text-slate-muted">{bolgeAd(dil, bolge)}</h3>
                <span className="text-[12px] text-slate-faint">· {list.length} PoP</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((p, i) => (
                  <PopKart key={p.kod} dil={dil} p={p} idx={i} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---- 2c. PoP SAĞLIK MATRİSİ (gerçek yük + kapasite + failover) ---- */}
      <Panel
        baslik={t("ed.matris.baslik")}
        sagUst={
          <Badge ton="brand">
            <Server className="size-3" /> {olayVar ? t("ed.matris.gercekYuk") : t("ed.matris.temsiliYuk")}
          </Badge>
        }
      >
        <SaglikMatrisi dil={dil} pops={pops} matris={saglikMatris} olayVar={olayVar} />
      </Panel>

      {/* ---- 3. Bölgesel trafik dağılımı + yönlendirme mantığı ---- */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel
          baslik={t("ed.donut.baslik")}
          sagUst={<Badge ton="brand"><Globe className="size-3" /> {olayVar ? t("ed.donut.gercekOlay") : t("ed.donut.popPayi")}</Badge>}
        >
          <DonutDagilim segmentler={donutSegmentler} />
          <p className="mt-4 border-t border-line pt-3 text-[12px] leading-relaxed text-slate-faint">
            {olayVar ? t("ed.donut.aciklamaVar") : t("ed.donut.aciklamaYok")}
          </p>
        </Panel>

        <Panel
          baslik={t("ed.yon.baslik")}
          className="lg:col-span-2"
          sagUst={<Badge ton="mavi"><Network className="size-3" /> {t("ed.yon.anycast")}</Badge>}
        >
          <YonlendirmeGorsel dil={dil} />
        </Panel>
      </div>

      {/* ---- 4. Gecikme analizi ---- */}
      <Panel
        baslik={t("ed.gecikme.baslik")}
        sagUst={<Badge ton="brand"><Gauge className="size-3" /> {t("ed.gecikme.edgeYakinligi")}</Badge>}
      >
        <GecikmeAnaliz dil={dil} veri={gecikmeBolge} />
      </Panel>

      {/* ---- 5. Edge sağlık zaman çizelgesi ---- */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel
          baslik={t("ed.saglik.baslik")}
          className="lg:col-span-2"
          sagUst={<Badge ton="yesil"><Activity className="size-3" /> {t("ed.saglik.nocSeridi")}</Badge>}
        >
          <SaglikSerit dil={dil} serit={saglikSerit} etiketler={saatEtiketleri} />
        </Panel>
        <Panel baslik={t("ed.uptime.baslik")} sagUst={<Badge ton="brand">%</Badge>}>
          <TrendGrafik
            noktalar={uptimeTrend}
            renk="#16a34a"
            etiketler={saatEtiketleri}
            yukseklik={200}
          />
        </Panel>
      </div>

      {/* ---- 6. Failover simülasyonu (geo-steering / yeniden yönlendirme) ---- */}
      <FailoverSimulasyon dil={dil} pops={pops} matris={saglikMatris} />

      {/* ---- 7. Anycast dağılımı + kapasite headroom ---- */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel
          baslik={t("ed.any.baslik")}
          className="lg:col-span-2"
          sagUst={<Badge ton="mavi"><Radio className="size-3" /> {t("ed.any.bgpDuyuru")}</Badge>}
        >
          <AnycastDagilim dil={dil} pops={pops} matris={saglikMatris} olayVar={olayVar} />
        </Panel>
        <KapasiteKart dil={dil} kapasite={kapasite} pops={pops} />
      </div>

      {/* ---- 8. Anycast / yönlendirme teknik açıklaması ---- */}
      <AnycastAciklama dil={dil} pops={pops} />
    </div>
  );
}

/* ------------------------------------------------------------------ Filtre butonu */
function FiltreBtn({ aktif, onClick, children }: { aktif: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition",
        aktif ? "bg-brand-600 text-white" : "bg-canvas text-slate-muted hover:bg-slate-100",
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ Dünya haritası (SVG + PoP noktaları)
 * Basit ekvatoral (equirectangular) projeksiyon: lon/lat → x/y. Kıta
 * silüetleri için hafif bir grid + bölge renkli nabızlı noktalar. */
function DunyaHaritasi({
  dil, pops, akislar, toplamYonlenen,
}: {
  dil: Dil;
  pops: Pop[];
  akislar: Akis[];
  toplamYonlenen: number;
}) {
  const t = (k: string) => edgeCeviri(k, dil);
  const [hover, setHover] = useState<string | null>(null);
  const W = 1000;
  const H = 500;
  // Eşdikdörtgen projeksiyon — ulke-koordinat.ts'teki projeksiyon ile aynı formül.
  const xOf = (lon: number) => projeksiyon(0, lon, W, H).x;
  const yOf = (lat: number) => projeksiyon(lat, 0, W, H).y;

  const saglikli = pops.filter((p) => p.durum === "saglikli").length;
  const popHar = useMemo(() => new Map(pops.map((p) => [p.kod, p])), [pops]);
  const enYogunAkis = Math.max(1, ...akislar.map((a) => a.adet));

  return (
    <Panel
      baslik={t("ed.harita.baslik")}
      sagUst={
        <div className="flex items-center gap-2">
          <Badge ton="brand"><Globe className="size-3" /> {pops.length} PoP</Badge>
          {akislar.length > 0 && (
            <Badge ton="mavi"><Route className="size-3" /> {akislar.length} {t("ed.harita.canliAkis")}</Badge>
          )}
          <span className="hidden items-center gap-1 text-[12px] text-slate-muted sm:inline-flex">
            <MapPin className="size-3.5 text-ok" /> {saglikli} {t("ed.harita.saglikliCevrimici")}
          </span>
        </div>
      }
    >
      <div className="relative overflow-hidden rounded-2xl border border-line">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={t("ed.harita.ariaLabel")}>
          <defs>
            {/* okyanus zemin gradyanı — kutuplarda hafif koyulaşan derin mavi-gri */}
            <linearGradient id="okyanusZemin" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e9eff3" />
              <stop offset="42%" stopColor="#eef3f6" />
              <stop offset="58%" stopColor="#eef3f6" />
              <stop offset="100%" stopColor="#e6edf1" />
            </linearGradient>
            {/* kıta dolgu gradyanı — temiz açık kara tonu, hafif kabartma hissi */}
            <linearGradient id="kitaDolgu" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e2e8e2" />
              <stop offset="100%" stopColor="#d6ded8" />
            </linearGradient>
            {/* kara altına ince kıyı gölgesi (deniz hissi) */}
            <filter id="karaGolge" x="-4%" y="-4%" width="108%" height="108%">
              <feDropShadow dx="0" dy="0.6" stdDeviation="1.1" floodColor="#8ba0a8" floodOpacity="0.35" />
            </filter>
            {/* okyanus için çok ince nokta dokusu */}
            <pattern id="okyanusNokta" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#d4dde2" />
            </pattern>
          </defs>

          {/* okyanus zemini: düz gradyan + üstüne çok ince nokta dokusu */}
          <rect x="0" y="0" width={W} height={H} fill="url(#okyanusZemin)" />
          <rect x="0" y="0" width={W} height={H} fill="url(#okyanusNokta)" opacity="0.5" />

          {/* enlem/boylam grid (graticule) — çok açık, okyanus üstünde */}
          <g stroke="#c6d3d9" strokeWidth="0.5" strokeOpacity="0.65" vectorEffect="non-scaling-stroke">
            {Array.from({ length: 13 }, (_, i) => {
              const x = (i / 12) * W;
              return <line key={`v${i}`} x1={x} y1={0} x2={x} y2={H} />;
            })}
            {Array.from({ length: 7 }, (_, i) => {
              const y = (i / 6) * H;
              return <line key={`h${i}`} x1={0} y1={y} x2={W} y2={y} />;
            })}
          </g>

          {/* GERÇEK kıta silüetleri (equirectangular — PoP koordinatlarıyla hizalı).
              Tek grup halinde ince kıyı gölgesiyle → denizden yükselen kara hissi. */}
          <g filter="url(#karaGolge)">
            {KITALAR.map((d, i) => (
              <path key={`kita-${i}`} d={d} fill="url(#kitaDolgu)" stroke="#a9bcb0" strokeWidth="0.7" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            ))}
          </g>

          {/* ekvator ile 30°/60° enlem çizgileri — hafif vurgu */}
          {[
            { y: H / 6, dash: "2 8", op: 0.4 },     // 60°K
            { y: H / 3, dash: "2 8", op: 0.4 },     // 30°K
            { y: H / 2, dash: "3 7", op: 0.7 },     // ekvator
            { y: (2 * H) / 3, dash: "2 8", op: 0.4 }, // 30°G
            { y: (5 * H) / 6, dash: "2 8", op: 0.4 }, // 60°G
          ].map((l, i) => (
            <line key={`enlem-${i}`} x1={0} y1={l.y} x2={W} y2={l.y} stroke="#a7bac2" strokeWidth={i === 2 ? 0.9 : 0.6} strokeDasharray={l.dash} strokeOpacity={l.op} vectorEffect="non-scaling-stroke" />
          ))}

          {/* Trafik akış hatları: kaynak coğrafya → en yakın PoP (kavisli).
              Her istek anycast ile en yakın PoP'a düşer; bu hatlar onu gösterir. */}
          {akislar.map((a, i) => {
            const hedef = popHar.get(a.popKod);
            if (!hedef) return null;
            const x1 = xOf(a.lon), y1 = yOf(a.lat);
            const x2 = xOf(hedef.lon), y2 = yOf(hedef.lat);
            // kontrol noktası: orta noktanın hafif yukarısı → nazik kavis
            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2 - Math.abs(x2 - x1) * 0.12 - 14;
            const kalinlik = 0.6 + (a.adet / enYogunAkis) * 2.2;
            const acik = hover === a.popKod || hover === `akis-${a.ulke}`;
            return (
              <g key={`akis-${i}`}>
                <path
                  d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
                  fill="none"
                  stroke={BOLGE_RENK[hedef.bolge]}
                  strokeWidth={kalinlik}
                  strokeOpacity={acik ? 0.85 : 0.32}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
                {/* akış yönü nabzı (kaynaktan PoP'a doğru kayan nokta) */}
                <motion.circle
                  r={acik ? 3 : 2}
                  fill={BOLGE_RENK[hedef.bolge]}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.9, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
                >
                  <animateMotion dur="2.4s" repeatCount="indefinite" begin={`${i * 0.18}s`} path={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`} />
                </motion.circle>
                {/* kaynak noktası (küçük, nötr) */}
                <circle cx={x1} cy={y1} r={2.5} fill="#a8a294" stroke="#faf9f4" strokeWidth="0.75" />
              </g>
            );
          })}

          {/* PoP noktaları */}
          {pops.map((p) => {
            const cx = xOf(p.lon);
            const cy = yOf(p.lat);
            const renk = BOLGE_RENK[p.bolge];
            const acik = hover === p.kod;
            const solgun = p.durum === "bakim";
            return (
              <g
                key={p.kod}
                onMouseEnter={() => setHover(p.kod)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: "pointer" }}
              >
                {/* nabız halkası (sağlıklı/dejenere) */}
                {p.durum !== "bakim" && (
                  <motion.circle
                    cx={cx}
                    cy={cy}
                    r={7}
                    fill={renk}
                    initial={{ opacity: 0.5, scale: 0.6 }}
                    animate={{ opacity: [0.4, 0, 0.4], scale: [0.8, 2.2, 0.8] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                    style={{ transformOrigin: `${cx}px ${cy}px` }}
                  />
                )}
                {/* çekirdek nokta */}
                <circle cx={cx} cy={cy} r={acik ? 7 : 5} fill={solgun ? "#b8b2a4" : renk} stroke="#faf9f4" strokeWidth="1.5" />
                {/* dejenere: sarı halka */}
                {p.durum === "dejenere" && (
                  <circle cx={cx} cy={cy} r={9} fill="none" stroke="#d97706" strokeWidth="1.5" strokeDasharray="2 2" />
                )}
                {/* kod etiketi (hover'da) */}
                {acik && (
                  <text x={cx} y={cy - 12} textAnchor="middle" className="fill-slate-ink" style={{ fontSize: 13, fontWeight: 700 }}>
                    {p.kod}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* hover kartı */}
        {hover && (() => {
          const p = pops.find((x) => x.kod === hover)!;
          const dm = DURUM_META[p.durum];
          return (
            <div className="pointer-events-none absolute left-3 top-3 rounded-xl border border-line bg-surface/95 px-3.5 py-2.5 text-[12px] shadow-lift backdrop-blur-sm">
              <div className="flex items-center gap-1.5 font-semibold text-slate-ink">
                <span>{bayrak(p.ulke)}</span> {p.sehir}
                <span className="text-slate-faint">({p.kod})</span>
              </div>
              <div className="mt-1 flex items-center gap-3">
                <DurumRozeti ton={dm.ton} etiket={durumEtiket(dil, p.durum)} nabiz={dm.nabiz} />
                <span className="num" style={{ color: gecikmeRengi(p.gecikme) }}>{p.gecikme} ms</span>
                <span className="num text-slate-muted">{kisaSayi(p.rps)} RPS</span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* lejant */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3 text-[12px]">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {(["avrupa", "kuzey-amerika", "asya", "guney-amerika", "okyanusya", "afrika"] as EdgeBolge[]).map((b) => (
            <span key={b} className="flex items-center gap-1.5 text-slate-muted">
              <span className="size-2.5 rounded-full" style={{ background: BOLGE_RENK[b] }} />
              {bolgeAd(dil, b)}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3 text-slate-faint">
          <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-ok" /> {t("ed.harita.lej.saglikli")}</span>
          <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-warn" /> {t("ed.harita.lej.dejenere")}</span>
          <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-slate-400" /> {t("ed.harita.lej.bakimda")}</span>
          <span className="flex items-center gap-1"><span className="h-0.5 w-4 rounded-full bg-blue-400" /> {t("ed.harita.lej.trafikAkisi")}</span>
        </div>
      </div>
      <p className="mt-2.5 text-[11.5px] leading-relaxed text-slate-faint">
        {toplamYonlenen > 0
          ? t("ed.harita.aciklamaVar").replace("{n}", toplamYonlenen.toLocaleString("tr-TR"))
          : t("ed.harita.aciklamaYok")}
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ PoP kartı */
function PopKart({ dil, p, idx }: { dil: Dil; p: Pop; idx: number }) {
  const t = (k: string) => edgeCeviri(k, dil);
  const dm = DURUM_META[p.durum];
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: idx * 0.02, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-line bg-surface px-4 py-3.5 transition hover:border-line-strong"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[15px] leading-none">{bayrak(p.ulke)}</span>
            <span className="truncate text-[14px] font-semibold text-slate-ink">{p.sehir}</span>
            <span className="num shrink-0 rounded bg-canvas px-1.5 py-0.5 text-[10.5px] font-bold text-slate-muted">{p.kod}</span>
          </div>
          <div className="mt-1 truncate text-[11.5px] text-slate-faint">{p.omurga}</div>
        </div>
        <DurumRozeti ton={dm.ton} etiket={durumEtiket(dil, p.durum)} nabiz={dm.nabiz} />
      </div>

      <div className="mt-3 flex items-center gap-3">
        {/* sol: gecikme + RPS + trafik payı metrikleri */}
        <div className="grid flex-1 grid-cols-3 gap-2">
          <div>
            <div className="num text-[16px] font-bold" style={{ color: gecikmeRengi(p.gecikme) }}>{p.gecikme}<span className="text-[11px] font-medium text-slate-faint"> ms</span></div>
            <div className="text-[10.5px] text-slate-faint">{t("ed.lok.gecikme")}</div>
          </div>
          <div>
            <div className="num text-[16px] font-bold text-slate-ink">{kisaSayi(p.rps)}</div>
            <div className="text-[10.5px] text-slate-faint">RPS</div>
          </div>
          <div>
            <div className="num text-[16px] font-bold text-slate-ink">%{p.trafikPay.toFixed(1)}</div>
            <div className="text-[10.5px] text-slate-faint">{t("ed.lok.trafikPayi")}</div>
          </div>
        </div>
        {/* sağ: kapasite kullanımı — yarım-daire gauge */}
        <div className="shrink-0 text-center">
          <GaugeGost
            deger={p.kapasite}
            boyut={82}
            renk={p.kapasite >= 80 ? "#dc2626" : p.kapasite >= 65 ? "#d97706" : "#16a34a"}
          />
          <div className="-mt-1 text-[10px] text-slate-faint">{t("ed.lok.kapasiteKullanimi")}</div>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ En yakın-PoP yönlendirme görseli */
function YonlendirmeGorsel({ dil }: { dil: Dil }) {
  const t = (k: string) => edgeCeviri(k, dil);
  const adimlar = [
    { ikon: <Globe className="size-4" />, ad: t("ed.yon.adim1.ad"), not: t("ed.yon.adim1.not") },
    { ikon: <Network className="size-4" />, ad: t("ed.yon.adim2.ad"), not: t("ed.yon.adim2.not") },
    { ikon: <Radio className="size-4" />, ad: t("ed.yon.adim3.ad"), not: t("ed.yon.adim3.not") },
    { ikon: <Server className="size-4" />, ad: t("ed.yon.adim4.ad"), not: t("ed.yon.adim4.not") },
  ];
  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {adimlar.map((a, i) => (
          <div key={i} className="relative rounded-2xl border border-line bg-canvas/40 px-3.5 py-3">
            <div className="flex items-center gap-2">
              <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">{a.ikon}</span>
              <span className="num text-[11px] font-bold text-slate-faint">0{i + 1}</span>
            </div>
            <div className="mt-2 text-[13px] font-semibold text-slate-ink">{a.ad}</div>
            <div className="mt-0.5 text-[11.5px] leading-relaxed text-slate-faint">{a.not}</div>
            {i < adimlar.length - 1 && (
              <span className="absolute -right-1.5 top-1/2 z-10 hidden -translate-y-1/2 text-slate-faint lg:block">→</span>
            )}
          </div>
        ))}
      </div>
      <p className="mt-4 border-t border-line pt-3 text-[12.5px] leading-relaxed text-slate-muted">
        {t("ed.yon.aciklama")}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ Gecikme analizi (bölge bazlı p50/p95/p99) */
function GecikmeAnaliz({ dil, veri }: { dil: Dil; veri: GecikmeBolge[] }) {
  const t = (k: string) => edgeCeviri(k, dil);
  const maxP99 = Math.max(1, ...veri.map((v) => v.p99));
  // Bölge × percentil ısı matrisi (ms değerleriyle) — katmanlı bardan farklı görsel dil.
  const isiSatirlar = veri.map((v) => bolgeAd(dil, v.bolge));
  const isiSutunlar = ["p50", "p95", "p99"];
  const isiDegerler = veri.map((v) => [v.p50, v.p95, v.p99]);
  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
      <div className="space-y-4">
      {veri.map((v, i) => (
        <motion.div
          key={v.bolge}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.03 }}
        >
          <div className="mb-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ background: BOLGE_RENK[v.bolge] }} />
              <span className="text-[13px] font-semibold text-slate-ink">{bolgeAd(dil, v.bolge)}</span>
              <span className="text-[11.5px] text-slate-faint">· {v.popSayi} PoP</span>
            </div>
            <div className="flex items-center gap-3 text-[12px]">
              <span className="num" style={{ color: gecikmeRengi(v.p50) }}>p50 <b>{v.p50}</b></span>
              <span className="num text-warn">p95 <b>{v.p95}</b></span>
              <span className="num text-danger2">p99 <b>{v.p99}</b> ms</span>
            </div>
          </div>
          {/* katmanlı bar: p50 (koyu) → p95 → p99 */}
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-canvas">
            <div className="absolute left-0 top-0 h-full rounded-full bg-danger2/25" style={{ width: `${(v.p99 / maxP99) * 100}%` }} />
            <div className="absolute left-0 top-0 h-full rounded-full bg-warn/50" style={{ width: `${(v.p95 / maxP99) * 100}%` }} />
            <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${(v.p50 / maxP99) * 100}%`, background: gecikmeRengi(v.p50) }} />
          </div>
        </motion.div>
      ))}
      <div className="flex flex-wrap items-center gap-4 border-t border-line pt-3 text-[11.5px] text-slate-muted">
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-ok" /> {t("ed.gecikme.p50Medyan")}</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-warn/60" /> p95</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-danger2/30" /> {t("ed.gecikme.p99Kuyruk")}</span>
        <span className="ml-auto text-slate-faint">{t("ed.gecikme.dipnot")}</span>
      </div>
      </div>

      {/* Bölge × percentil ısı matrisi (ms) — yoğunluk renkli, farklı okuma açısı */}
      <div className="rounded-2xl border border-line bg-canvas/40 p-4">
        <div className="mb-3 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-slate-muted">
          <Gauge className="size-3.5" /> {t("ed.gecikme.edgeYakinligi")}
        </div>
        <IsiMatris satirlar={isiSatirlar} sutunlar={isiSutunlar} degerler={isiDegerler} renk="#d97706" />
        <p className="mt-3 text-[11px] leading-relaxed text-slate-faint">{t("ed.gecikme.dipnot")}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Sağlık zaman şeridi (24s durum segmentleri) */
function SaglikSerit({ dil, serit, etiketler }: { dil: Dil; serit: SaglikSaat[]; etiketler: string[] }) {
  const t = (k: string) => edgeCeviri(k, dil);
  const renk = { ok: "#16a34a", warn: "#d97706", danger: "#dc2626" };
  const olayAdet = serit.filter((s) => s.durum !== "ok").length;
  const kritikAdet = serit.filter((s) => s.durum === "danger").length;
  return (
    <div>
      <div className="flex h-14 items-stretch gap-[3px] overflow-hidden rounded-xl">
        {serit.map((s, i) => (
          <Tooltip key={i} metin={`${etiketler[i]} — ${s.durum === "ok" ? t("ed.saglik.tt.saglikli") : s.durum === "warn" ? t("ed.saglik.tt.dejenere") : t("ed.saglik.tt.kritik")}`} className="flex-1">
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.4, delay: i * 0.015, ease: [0.16, 1, 0.3, 1] }}
              className="h-14 w-full rounded-[3px] transition hover:opacity-80"
              style={{ background: renk[s.durum], transformOrigin: "bottom" }}
            />
          </Tooltip>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10.5px] font-medium tabular-nums text-slate-faint">
        <span>{etiketler[0]}</span>
        <span>{etiketler[Math.floor(etiketler.length / 2)]}</span>
        <span>{etiketler[etiketler.length - 1]}</span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-line pt-3 text-[12px]">
        <span className="text-slate-muted">{t("ed.saglik.son24.a")} <b className="text-slate-ink">{24 - olayAdet}</b> {t("ed.saglik.son24.b")}</span>
        {olayAdet > 0 && <span className="text-warn">{olayAdet - kritikAdet} {t("ed.saglik.kismiDusus")}</span>}
        {kritikAdet > 0 && <span className="text-danger2">{kritikAdet} {t("ed.saglik.kritikOlay")}</span>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ PoP sağlık matrisi
 * Her PoP için: bölge/şehir, durum, gerçek yük payı, kapasite kullanımı,
 * gecikme (p50/p95), trafik payı, anycast ağırlığı ve failover göstergesi.
 * Cloudflare/Fastly edge-ops konsolundaki "colo health" tablosunun karşılığı. */
function SaglikMatrisi({
  dil, pops, matris, olayVar,
}: {
  dil: Dil;
  pops: Pop[];
  matris: SaglikMatrisSatir[];
  olayVar: boolean;
}) {
  const t = (k: string) => edgeCeviri(k, dil);
  const matHar = useMemo(() => new Map(matris.map((m) => [m.kod, m])), [matris]);
  // Yük payına göre azalan; bakımdakiler sona.
  const sirali = useMemo(
    () =>
      [...pops].sort((a, b) => {
        if (a.durum === "bakim" && b.durum !== "bakim") return 1;
        if (b.durum === "bakim" && a.durum !== "bakim") return -1;
        return (matHar.get(b.kod)?.yukPay ?? 0) - (matHar.get(a.kod)?.yukPay ?? 0);
      }),
    [pops, matHar],
  );
  const seviyeRenk = { yesil: "#16a34a", sari: "#d97706", kirmizi: "#dc2626" };
  const seviyeAd = { yesil: t("ed.matris.rahat"), sari: t("ed.matris.uyari"), kirmizi: t("ed.matris.doygun") };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-left text-[13px]">
        <thead>
          <tr className="border-b border-line text-[11px] font-semibold uppercase tracking-wide text-slate-faint">
            <th className="py-2.5 pr-3">{t("ed.matris.col.popBolge")}</th>
            <th className="px-3 py-2.5">{t("ed.matris.col.durum")}</th>
            <th className="px-3 py-2.5 text-right">{t("ed.matris.col.yukPayi")}</th>
            <th className="px-3 py-2.5">{t("ed.matris.col.kapasite")}</th>
            <th className="px-3 py-2.5 text-right">{t("ed.matris.col.gecikme")}</th>
            <th className="px-3 py-2.5 text-right">{t("ed.matris.col.anycast")}</th>
            <th className="px-3 py-2.5 text-center">{t("ed.matris.col.failover")}</th>
          </tr>
        </thead>
        <tbody>
          {sirali.map((p) => {
            const m = matHar.get(p.kod);
            const dm = DURUM_META[p.durum];
            const seviye = m?.saglikSeviye ?? "yesil";
            const bakim = p.durum === "bakim";
            return (
              <tr key={p.kod} className="border-b border-line last:border-0 transition hover:bg-canvas/50">
                {/* PoP + bölge */}
                <td className="py-3 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] leading-none">{bayrak(p.ulke)}</span>
                    <span className="font-semibold text-slate-ink">{p.sehir}</span>
                    <span className="num rounded bg-canvas px-1.5 py-0.5 text-[10px] font-bold text-slate-muted">{p.kod}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-faint">
                    <span className="size-1.5 rounded-full" style={{ background: BOLGE_RENK[p.bolge] }} />
                    {bolgeAd(dil, p.bolge)}
                  </div>
                </td>
                {/* durum */}
                <td className="px-3 py-3">
                  <DurumRozeti ton={dm.ton} etiket={durumEtiket(dil, p.durum)} nabiz={dm.nabiz} />
                </td>
                {/* yük payı */}
                <td className="px-3 py-3 text-right">
                  <span className="num font-semibold text-slate-ink">%{(m?.yukPay ?? 0).toFixed(1)}</span>
                  {olayVar && m && m.olay > 0 && (
                    <div className="num text-[10.5px] text-slate-faint">{kisaSayi(m.olay)} {t("ed.matris.olay")}</div>
                  )}
                </td>
                {/* kapasite kullanımı + sağlık ışığı */}
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="min-w-[70px] flex-1">
                      <Ilerleme
                        deger={m?.kullanim ?? p.kapasite}
                        ton={seviye === "kirmizi" ? "danger" : seviye === "sari" ? "warn" : "ok"}
                      />
                    </div>
                    <Tooltip metin={`${seviyeAd[seviye]} · %${m?.headroom ?? 0} ${t("ed.matris.bosluk")}`}>
                      <span className="num text-[11.5px] font-semibold" style={{ color: seviyeRenk[seviye] }}>
                        %{m?.kullanim ?? p.kapasite}
                      </span>
                    </Tooltip>
                  </div>
                </td>
                {/* gecikme p50/p95 */}
                <td className="px-3 py-3 text-right">
                  <span className="num font-semibold" style={{ color: gecikmeRengi(p.p50) }}>{p.p50}</span>
                  <span className="num text-slate-faint"> / {p.p95} ms</span>
                </td>
                {/* anycast ağırlığı */}
                <td className="px-3 py-3 text-right">
                  <span className="num font-medium text-slate-muted">{bakim ? "—" : `%${(m?.anycast ?? 0).toFixed(1)}`}</span>
                </td>
                {/* failover göstergesi */}
                <td className="px-3 py-3 text-center">
                  {bakim ? (
                    <Tooltip metin={t("ed.matris.tt.bakim")}>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                        <Power className="size-3.5" /> {t("ed.matris.pasif")}
                      </span>
                    </Tooltip>
                  ) : seviye === "kirmizi" ? (
                    <Tooltip metin={t("ed.matris.tt.riskli")}>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-danger2">
                        <ShieldAlert className="size-3.5" /> {t("ed.matris.riskli")}
                      </span>
                    </Tooltip>
                  ) : (
                    <Tooltip metin={t("ed.matris.tt.hazir")}>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ok">
                        <ArrowRightLeft className="size-3.5" /> {t("ed.matris.hazir")}
                      </span>
                    </Tooltip>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-3 border-t border-line pt-3 text-[12px] leading-relaxed text-slate-faint">
        {t("ed.matris.aciklama").replace("{kaynak}", olayVar ? t("ed.matris.aciklamaGercek") : t("ed.matris.aciklamaTemsili"))}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ Failover simülasyonu
 * Bir PoP'u "düşür" işaretle → failoverPlan ile trafiğinin komşu PoP'lara
 * nasıl devrildiğini istemci-tarafı, deterministik olarak göster. */
function FailoverSimulasyon({
  dil, pops, matris,
}: {
  dil: Dil;
  pops: Pop[];
  matris: SaglikMatrisSatir[];
}) {
  const t = (k: string) => edgeCeviri(k, dil);
  // Yönlendirmeye uygun (bakımda olmayan) PoP'lar seçilebilir.
  const secilebilir = useMemo(() => pops.filter((p) => p.durum !== "bakim"), [pops]);
  const [dusukKod, setDusukKod] = useState<string>(() => {
    // Başlangıçta en yüklü sağlıklı PoP seçili gelsin (en anlamlı senaryo).
    const enYuklu = [...matris].sort((a, b) => b.yukPay - a.yukPay)[0];
    return enYuklu?.kod ?? secilebilir[0]?.kod ?? "";
  });

  const dusuk = pops.find((p) => p.kod === dusukKod);
  const matHar = useMemo(() => new Map(matris.map((m) => [m.kod, m])), [matris]);

  // Düşen PoP'un olay/yük payı → dağıtılacak trafik.
  const dusukYukPay = matHar.get(dusukKod)?.yukPay ?? dusuk?.trafikPay ?? 0;
  const dusukOlay = matHar.get(dusukKod)?.olay ?? 0;
  // Olay yoksa yük payını 1000'lik ölçekte temsili olaya çevir (görsel için).
  const dagitilacak = dusukOlay > 0 ? dusukOlay : Math.round(dusukYukPay * 10);

  const yonPops: YonPop[] = useMemo(
    () => pops.map((p) => ({ kod: p.kod, lat: p.lat, lon: p.lon, kapasite: p.kapasite, rps: p.rps, durum: p.durum })),
    [pops],
  );

  const plan: FailoverHedef[] = useMemo(() => {
    if (!dusuk) return [];
    const dp: YonPop = { kod: dusuk.kod, lat: dusuk.lat, lon: dusuk.lon, kapasite: dusuk.kapasite, rps: dusuk.rps, durum: dusuk.durum };
    return failoverPlan(dp, yonPops, dagitilacak).filter((h) => h.pay > 0).slice(0, 6);
  }, [dusuk, yonPops, dagitilacak]);

  const popHar = useMemo(() => new Map(pops.map((p) => [p.kod, p])), [pops]);

  return (
    <Panel
      baslik={t("ed.fail.baslik")}
      sagUst={<Badge ton="sari"><ShieldAlert className="size-3" /> {t("ed.fail.geoSteering")}</Badge>}
    >
      <p className="mb-4 text-[13px] leading-relaxed text-slate-muted">
        {t("ed.fail.aciklama")}
      </p>

      {/* PoP seçici çipleri */}
      <div className="mb-5 flex flex-wrap gap-1.5">
        {secilebilir.map((p) => (
          <button
            key={p.kod}
            onClick={() => setDusukKod(p.kod)}
            className={cn(
              "num inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition",
              dusukKod === p.kod
                ? "bg-danger2 text-white"
                : "bg-canvas text-slate-muted hover:bg-slate-100",
            )}
          >
            {dusukKod === p.kod && <Power className="size-3" />}
            {p.kod}
          </button>
        ))}
      </div>

      {dusuk && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,280px)_1fr]">
          {/* Düşen PoP kartı */}
          <div className="rounded-2xl border border-danger2/30 bg-danger-soft/40 px-4 py-3.5">
            <div className="flex items-center gap-2">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-danger2/10 text-danger2">
                <Power className="size-4.5" />
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[14px] leading-none">{bayrak(dusuk.ulke)}</span>
                  <span className="text-[14px] font-semibold text-slate-ink">{dusuk.sehir}</span>
                  <span className="num rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-danger2">{dusuk.kod}</span>
                </div>
                <div className="mt-0.5 text-[11.5px] text-danger2">{t("ed.fail.devreDisi")}</div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-danger2/20 pt-3 text-center">
              <div>
                <div className="num text-[18px] font-bold text-slate-ink">%{dusukYukPay.toFixed(1)}</div>
                <div className="text-[10.5px] text-slate-faint">{t("ed.fail.devredilenYuk")}</div>
              </div>
              <div>
                <div className="num text-[18px] font-bold text-slate-ink">{plan.length}</div>
                <div className="text-[10.5px] text-slate-faint">{t("ed.fail.hedefPop")}</div>
              </div>
            </div>
          </div>

          {/* Yeniden yönlendirme hedefleri */}
          <div>
            <div className="mb-2.5 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-slate-muted">
              <ArrowRightLeft className="size-3.5" /> {t("ed.fail.nereye")}
            </div>
            {plan.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-[13px] text-slate-faint">
                {t("ed.fail.bulunamadi")}
              </div>
            ) : (
              <div className="space-y-2.5">
                {plan.map((h, i) => {
                  const hp = popHar.get(h.kod);
                  if (!hp) return null;
                  return (
                    <motion.div
                      key={h.kod}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-2.5"
                    >
                      <span className="text-[15px] leading-none">{bayrak(hp.ulke)}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13.5px] font-semibold text-slate-ink">{hp.sehir}</span>
                          <span className="num rounded bg-canvas px-1.5 py-0.5 text-[10px] font-bold text-slate-muted">{hp.kod}</span>
                        </div>
                        <div className="num text-[11px] text-slate-faint">{h.mesafeKm.toLocaleString("tr-TR")} km · {bolgeAd(dil, hp.bolge)}</div>
                      </div>
                      <div className="ml-auto flex items-center gap-3">
                        <div className="hidden w-28 sm:block">
                          <Ilerleme deger={h.pay} ton="warn" />
                        </div>
                        <span className="num w-12 text-right text-[14px] font-bold text-warn">%{h.pay.toFixed(1)}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
            <p className="mt-3 text-[11.5px] leading-relaxed text-slate-faint">
              {t("ed.fail.dipnot")}
            </p>
          </div>
        </div>
      )}
    </Panel>
  );
}

/* ------------------------------------------------------------------ Anycast ağırlık dağılımı
 * Her PoP'un aldığı anycast trafik ağırlığını yatay barlarla gösterir. */
function AnycastDagilim({
  dil, pops, matris, olayVar,
}: {
  dil: Dil;
  pops: Pop[];
  matris: SaglikMatrisSatir[];
  olayVar: boolean;
}) {
  const t = (k: string) => edgeCeviri(k, dil);
  const popHar = useMemo(() => new Map(pops.map((p) => [p.kod, p])), [pops]);
  const sirali = useMemo(
    () => [...matris].filter((m) => (popHar.get(m.kod)?.durum ?? "") !== "bakim").sort((a, b) => b.anycast - a.anycast),
    [matris, popHar],
  );
  const maxAgirlik = Math.max(1, ...sirali.map((m) => m.anycast));

  return (
    <div>
      <div className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
        {sirali.map((m, i) => {
          const p = popHar.get(m.kod);
          if (!p) return null;
          return (
            <motion.div
              key={m.kod}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.02 }}
              className="flex items-center gap-2.5"
            >
              <span className="num w-11 shrink-0 rounded bg-canvas px-1.5 py-0.5 text-center text-[10.5px] font-bold text-slate-muted">{p.kod}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-canvas">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: BOLGE_RENK[p.bolge] }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(m.anycast / maxAgirlik) * 100}%` }}
                  transition={{ duration: 0.7, delay: i * 0.02, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <span className="num w-12 shrink-0 text-right text-[12px] font-semibold text-slate-ink">%{m.anycast.toFixed(1)}</span>
            </motion.div>
          );
        })}
      </div>
      <p className="mt-4 border-t border-line pt-3 text-[12px] leading-relaxed text-slate-faint">
        {t("ed.any.aciklama").replace("{kaynak}", olayVar ? t("ed.any.aciklamaGercek") : t("ed.any.aciklamaTemsili"))}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ Kapasite headroom kartı */
function KapasiteKart({
  dil, kapasite, pops,
}: {
  dil: Dil;
  kapasite: KapasiteOzetDto;
  pops: Pop[];
}) {
  const t = (k: string) => edgeCeviri(k, dil);
  const enDoluPop = pops.find((p) => p.kod === kapasite.enDolu);
  const kullanimYuzde = Math.max(0, Math.min(100, 100 - kapasite.headroomYuzde));
  const olcek = (n: number) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(n % 1_000 ? 1 : 0) + "B";
    return String(n);
  };
  return (
    <Panel baslik={t("ed.kap.baslik")} sagUst={<Badge ton="yesil"><TrendingUp className="size-3" /> {t("ed.kap.olcek")}</Badge>}>
      <div className="flex items-baseline gap-2">
        <span className="num text-[40px] font-bold leading-none text-ok">%{kapasite.headroomYuzde.toFixed(1)}</span>
        <span className="text-[13px] text-slate-muted">{t("ed.kap.bosKapasite")}</span>
      </div>
      <div className="mt-3">
        <div className="mb-1.5 flex items-center justify-between text-[12px]">
          <span className="text-slate-muted">{t("ed.kap.agGeneliDoluluk")}</span>
          <span className="num font-semibold text-slate-ink">%{kullanimYuzde.toFixed(1)}</span>
        </div>
        <Ilerleme deger={kullanimYuzde} ton={kullanimYuzde >= 80 ? "danger" : kullanimYuzde >= 65 ? "warn" : "ok"} />
      </div>
      <div className="mt-4 space-y-2.5 border-t border-line pt-3.5 text-[12.5px]">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-muted"><Zap className="size-3.5" /> {t("ed.kap.tepeKapasite")}</span>
          <span className="num font-semibold text-slate-ink">{olcek(kapasite.toplamKapasiteRps)} RPS</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-muted"><Activity className="size-3.5" /> {t("ed.kap.suAnkiYuk")}</span>
          <span className="num font-semibold text-slate-ink">{olcek(kapasite.kullanilanRps)} RPS</span>
        </div>
        {enDoluPop && (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-muted"><Server className="size-3.5" /> {t("ed.kap.enDoluPop")}</span>
            <span className="flex items-center gap-1.5 font-semibold text-slate-ink">
              {bayrak(enDoluPop.ulke)} {enDoluPop.kod} <span className="num text-warn">%{enDoluPop.kapasite}</span>
            </span>
          </div>
        )}
      </div>
      <p className="mt-3.5 rounded-xl bg-brand-50 px-3 py-2.5 text-[11.5px] leading-relaxed text-brand-800">
        {kapasite.headroomYuzde >= 30 ? t("ed.kap.bolBosluk") : t("ed.kap.daralan")}
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ Anycast teknik açıklaması */
function AnycastAciklama({ dil, pops }: { dil: Dil; pops: Pop[] }) {
  const t = (k: string) => edgeCeviri(k, dil);
  const enHizli = [...pops].filter((p) => p.durum !== "bakim").sort((a, b) => a.gecikme - b.gecikme)[0];
  const kartlar: { baslik: string; metin: string; ikon: React.ReactNode; deger?: string }[] = [
    {
      ikon: <Network className="size-4" />,
      baslik: t("ed.acik.k1.baslik"),
      metin: t("ed.acik.k1.metin"),
    },
    {
      ikon: <Radio className="size-4" />,
      baslik: t("ed.acik.k2.baslik"),
      metin: t("ed.acik.k2.metin"),
      deger: enHizli ? `${enHizli.gecikme} ms — ${enHizli.sehir}` : undefined,
    },
    {
      ikon: <Server className="size-4" />,
      baslik: t("ed.acik.k3.baslik"),
      metin: t("ed.acik.k3.metin"),
    },
    {
      ikon: <Activity className="size-4" />,
      baslik: t("ed.acik.k4.baslik"),
      metin: t("ed.acik.k4.metin"),
    },
  ];
  return (
    <Panel
      baslik={t("ed.acik.baslik")}
      sagUst={<Badge ton="mavi"><Network className="size-3" /> {t("ed.acik.altyapi")}</Badge>}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {kartlar.map((k, i) => (
          <div key={i} className="rounded-2xl border border-line bg-canvas/40 px-4 py-3.5">
            <div className="flex items-center gap-2">
              <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">{k.ikon}</span>
              <span className="text-[14px] font-semibold text-slate-ink">{k.baslik}</span>
              {k.deger && <span className="num ml-auto rounded-full bg-ok-soft px-2 py-0.5 text-[11px] font-bold text-green-700">{k.deger}</span>}
            </div>
            <p className="mt-2 text-[12.5px] leading-relaxed text-slate-muted">{k.metin}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}
