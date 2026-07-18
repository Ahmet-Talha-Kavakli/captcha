"use client";

/**
 * Analitik'e özel yerel grafik parçaları (yalnızca bu modül kullanır).
 * kit.tsx ve grafikler.tsx'e dokunmadan derinlik ekler: KPI sparkline'lı
 * kart, karar hunisi (funnel), skor histogramı. Hepsi elle SVG + boş-veri
 * korumalı, Tavily krem tema, marka mavisi #2f6fed.
 */
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

/* ------------------------------------------------------- Delta rozeti hesap */
export function delta(bu: number, onceki: number): { yuzde: number; up: boolean } | null {
  if (!onceki) return null;
  const d = ((bu - onceki) / onceki) * 100;
  if (!Number.isFinite(d)) return null;
  return { yuzde: Math.abs(d), up: d >= 0 };
}

/* ------------------------------------------------------- Mini alan sparkline */
export function Spark({ seri, renk = "#2f6fed", yukseklik = 34 }: { seri: number[]; renk?: string; yukseklik?: number }) {
  const temiz = (seri ?? []).filter((v) => Number.isFinite(v));
  if (temiz.length < 2) {
    return <div style={{ height: yukseklik }} className="w-full rounded-md bg-canvas/60" />;
  }
  const W = 120;
  const H = yukseklik;
  const max = Math.max(...temiz);
  const min = Math.min(...temiz);
  const range = max - min || 1;
  const step = W / (temiz.length - 1);
  const pts = temiz.map((v, i) => [i * step, H - 2 - ((v - min) / range) * (H - 4)] as const);
  const d = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const alan = `${d} L ${W} ${H} L 0 ${H} Z`;
  const gid = `sp${Math.round(pts[1][1] * 100)}${renk.replace("#", "")}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={yukseklik} preserveAspectRatio="none" className="overflow-visible">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={renk} stopOpacity="0.22" />
          <stop offset="100%" stopColor={renk} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={alan} fill={`url(#${gid})`} />
      <path d={d} fill="none" stroke={renk} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/* ------------------------------------------------------- Sparkline'lı KPI kartı */
export function KpiKart({
  etiket,
  deger,
  spark,
  sparkRenk = "#2f6fed",
  d,
  iyiYon = "up",
  altBilgi,
}: {
  etiket: string;
  deger: string;
  spark: number[];
  sparkRenk?: string;
  /** Delta (önceki döneme göre). null → gösterilmez. */
  d: { yuzde: number; up: boolean } | null;
  /** Artışın "iyi" mi kötü mü olduğu (renk için). */
  iyiYon?: "up" | "down" | "notr";
  altBilgi?: string;
}) {
  const iyiMi = d ? (iyiYon === "notr" ? true : iyiYon === "up" ? d.up : !d.up) : true;
  return (
    <div className="flex flex-col justify-between rounded-3xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[13px] font-medium text-slate-muted">{etiket}</span>
        {d && (
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
              iyiMi ? "bg-ok-soft text-ok" : "bg-danger-soft text-danger2",
            )}
          >
            {d.up ? "↑" : "↓"} %{d.yuzde.toFixed(d.yuzde < 10 ? 1 : 0)}
          </span>
        )}
      </div>
      <div className="mt-2 text-[28px] font-bold leading-none text-slate-ink num tabular-nums">{deger}</div>
      {altBilgi && <div className="mt-1 text-[11px] text-slate-faint">{altBilgi}</div>}
      <div className="mt-3">
        <Spark seri={spark} renk={sparkRenk} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------- Karar hunisi (funnel)
 * Gerçek DARALAN huni: her aşama, bir öncekinin genişliğinden başlayıp kendi
 * genişliğine inen bir trapez (SVG polygon). Aşama rengi + geçen yüzde şeridin
 * üstünde, elenen sayısı aşamalar arasında. Monoton yatay-bar değil. */
export function Funnel({
  adimlar,
  t,
}: {
  adimlar: { etiket: string; deger: number; renk: string }[];
  t: (k: string) => string;
}) {
  const enUst = Math.max(...adimlar.map((a) => a.deger), 1);
  const W = 100; // viewBox birimi (yüzde ölçek)
  const asamaY = 46; // her trapezin yüksekliği
  const genislikOran = (deger: number) => Math.max(6, (deger / enUst) * 100);

  return (
    <div className="space-y-1">
      {adimlar.map((a, i) => {
        const oncekiDeger = i === 0 ? a.deger : adimlar[i - 1].deger;
        const gecti = oncekiDeger ? (a.deger / oncekiDeger) * 100 : 100;
        const toplamOran = enUst ? (a.deger / enUst) * 100 : 0;

        const ustGenislik = i === 0 ? genislikOran(a.deger) : genislikOran(oncekiDeger);
        const altGenislik = genislikOran(a.deger);
        const ustX1 = (W - ustGenislik) / 2;
        const ustX2 = (W + ustGenislik) / 2;
        const altX1 = (W - altGenislik) / 2;
        const altX2 = (W + altGenislik) / 2;

        return (
          <div key={a.etiket}>
            <div className="mb-0.5 flex items-center justify-between text-[13px]">
              <span className="flex items-center gap-2 font-medium text-slate-ink">
                <span className="size-2.5 rounded-full" style={{ background: a.renk }} />
                {a.etiket}
              </span>
              <span className="flex items-center gap-2">
                <span className="num font-semibold tabular-nums text-slate-ink">{a.deger.toLocaleString("tr-TR")}</span>
                <span className="w-12 rounded-full bg-canvas px-1.5 py-0.5 text-right text-[11px] tabular-nums text-slate-muted">
                  %{toplamOran.toFixed(0)}
                </span>
              </span>
            </div>
            <div className="relative">
              <svg viewBox={`0 0 ${W} ${asamaY}`} preserveAspectRatio="none" className="block h-11 w-full">
                <motion.polygon
                  points={`${ustX1},0 ${ustX2},0 ${altX2},${asamaY} ${altX1},${asamaY}`}
                  fill={a.renk}
                  fillOpacity={0.92}
                  initial={{ y: 6 }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                />
              </svg>
              {i > 0 && (
                <span className="pointer-events-none absolute inset-0 grid place-items-center text-[11px] font-semibold text-white/95 tabular-nums">
                  {t("an.funnel.gecti").replace("{oran}", gecti.toFixed(1))}
                </span>
              )}
            </div>
            {/* aşamalar arası "elenen" ibaresi */}
            {i < adimlar.length - 1 && (
              <div className="flex h-[18px] items-center justify-center" style={{ marginTop: 0 }}>
                {(() => {
                  const sonraki = adimlar[i + 1].deger;
                  const eln = Math.max(0, a.deger - sonraki);
                  return eln > 0 ? (
                    <span className="text-[10px] font-medium tabular-nums text-slate-faint">
                      ↓ {t("an.funnel.elenen").replace("{sayi}", eln.toLocaleString("tr-TR"))}
                    </span>
                  ) : null;
                })()}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------- Skor histogramı (0..1) */
export function Histogram({ kovalar, t }: { kovalar: number[]; t: (k: string) => string }) {
  const max = Math.max(...kovalar, 1);
  const toplam = kovalar.reduce((a, b) => a + b, 0);
  if (!toplam) {
    return (
      <div className="grid h-40 place-items-center rounded-xl border border-dashed border-line text-[12px] text-slate-faint">
        {t("an.hist.bos")}
      </div>
    );
  }
  return (
    <div>
      <div className="flex h-40 items-end gap-1.5">
        {kovalar.map((v, i) => {
          // 0.0–0.5 arası bot bölgesi (kırmızı), üstü insan bölgesi (mavi).
          const bot = i < 5;
          const h = (v / max) * 100;
          const alt = (i / 10).toFixed(1);
          const ust = ((i + 1) / 10).toFixed(1);
          return (
            <div key={i} className="group relative flex flex-1 flex-col justify-end" style={{ height: "100%" }}>
              <motion.div
                className="w-full rounded-t-md"
                style={{ background: bot ? "linear-gradient(180deg,#f87171,#dc2626)" : "linear-gradient(180deg,#6a97fb,#2f6fed)" }}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(2, h)}%` }}
                transition={{ duration: 0.6, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
              />
              <div className="pointer-events-none absolute -top-9 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink-900 px-2.5 py-1 text-[11px] font-medium text-white shadow-lift group-hover:block">
                {alt}–{ust}: {v.toLocaleString("tr-TR")} {t("an.hist.olay")}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] font-medium text-slate-faint">
        <span>{t("an.hist.solEtiket")}</span>
        <span className="text-slate-muted">{t("an.hist.ekEtiket")}</span>
        <span>{t("an.hist.sagEtiket")}</span>
      </div>
      <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-muted">
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-danger2/80" /> {t("an.hist.botBolge")}</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-brand-500" /> {t("an.hist.insanBolge")}</span>
      </div>
    </div>
  );
}
