"use client";

/**
 * Specter Panel Grafikleri — elle SVG + framer-motion (Sentinel DNA).
 * Hiçbir grafik kütüphanesi yok; hepsi <svg> + <motion.path/circle>.
 *
 * Tasarım dili: Google Material Charts — az mürekkep, çok veri.
 * İnce çizgiler, açık gridler, net tipografi (tabular-nums), abartısız animasyon.
 * Krem zemin (#f4f1ea) ile uyumlu; sınırlı, anlamlı renk paleti.
 */
import { motion } from "framer-motion";
import { useId, useMemo, useRef, useState, useEffect } from "react";
import { cn } from "@/lib/cn";
import { usePanelDil } from "@/lib/i18n/istemci";

/* Ortak grafik palet sabitleri — CSS token'ına bağlı, böylece koyu temada da
   doğru (sabit hex değil). SVG stroke/fill bu değişkenleri okuyabilir. */
const GRID = "var(--color-line)"; // grid/zemin çizgisi — tema-duyarlı
const EKSEN_YAZI = "var(--color-slate-faint)"; // eksen yazısı — tema-duyarlı
const TABAN_YAZI = "#6b6a63"; // slate-muted

/* ------------------------------------------------------- Koruma Skoru donut gauge */
export function KorumaSkoru({ skor, boyut = 176 }: { skor: number; boyut?: number }) {
  const { ceviri: t } = usePanelDil();
  const guvenli = Number.isFinite(skor) ? Math.max(0, Math.min(100, skor)) : 0;
  const r = 42;
  const cevre = 2 * Math.PI * r;
  const dolu = (guvenli / 100) * cevre;
  const renk = guvenli >= 85 ? "#16a34a" : guvenli >= 65 ? "#2f6fed" : guvenli >= 45 ? "#d97706" : "#dc2626";
  const etiket = guvenli >= 85 ? t("grafik.skor.guclu") : guvenli >= 65 ? t("grafik.skor.iyi") : guvenli >= 45 ? t("grafik.skor.orta") : t("grafik.skor.zayif");
  return (
    <div
      className="relative grid place-items-center"
      style={{ width: boyut, height: boyut }}
      role="img"
      aria-label={t("grafik.aria.korumaSkoru").replace("{skor}", String(guvenli)).replace("{etiket}", etiket)}
    >
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        {/* zemin halkası — ince, nötr */}
        <circle cx="50" cy="50" r={r} fill="none" stroke={GRID} strokeWidth="6" />
        <motion.circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={renk}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={cevre}
          initial={{ strokeDashoffset: cevre }}
          animate={{ strokeDashoffset: cevre - dolu }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-bold tabular-nums text-slate-ink">{guvenli}</span>
        <span className="text-xs font-medium" style={{ color: renk }}>
          {etiket}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------- Skor çubuğu (ince, yuvarlak uçlu) */
export function SkorCubugu({ etiket, deger, renk = "#2f6fed" }: { etiket: string; deger: number; renk?: string }) {
  const guvenli = Number.isFinite(deger) ? Math.max(0, Math.min(100, deger)) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[13px]">
        <span className="text-slate-muted">{etiket}</span>
        <span className="font-semibold tabular-nums text-slate-ink">{guvenli}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full" style={{ background: GRID }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: renk }}
          initial={{ width: 0 }}
          animate={{ width: `${guvenli}%` }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------- Trend/Area grafik (Google Analytics kalitesi)
 * Temiz ince çizgi + abartısız gradient dolgu (glow YOK), Y-ekseni etiketleri,
 * açık yatay gridler, X-ekseni tarih etiketleri ve fare-takipli hover tooltip.
 * Çoklu seri desteği (opsiyonel `seriler` + `renkler` + `seriEtiketleri`).
 * Boş / tek-nokta / düz veriye karşı tam korumalı.
 */
export function TrendGrafik({
  noktalar,
  yukseklik = 240,
  renk = "#2f6fed",
  gradId, // artık gereksiz ama imza korunuyor; benzersiz id otomatik üretilir
  etiketler,
  seriler,
  renkler,
  seriEtiketleri,
}: {
  noktalar: number[];
  yukseklik?: number;
  renk?: string;
  /** Geriye dönük uyum için tutuluyor; iç id çakışması artık useId ile önlenir. */
  gradId?: string;
  /** Opsiyonel x-ekseni etiketleri (ör. gün/saat). */
  etiketler?: string[];
  /** Opsiyonel çoklu seri. Verilirse `noktalar` yerine bunlar çizilir. */
  seriler?: number[][];
  /** Çoklu seri renkleri (seriler ile aynı sırada). */
  renkler?: string[];
  /** Çoklu seri legend etiketleri. */
  seriEtiketleri?: string[];
}) {
  void gradId; // imza korunuyor
  const { ceviri: t } = usePanelDil();
  const uid = useId().replace(/:/g, "");
  const kapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  // Konteynerin GERÇEK piksel genişliğini ölç → viewBox'ı ona eşitle. Böylece
  // preserveAspectRatio="none" YATAY ESNEMESİ ortadan kalkar: çizgi deforme olmaz
  // ve SVG-içi koordinatlar (çizgi ucu) ile HTML-overlay (son-nokta topu) BİREBİR
  // hizalanır → "çizgi sonda kopuk/soluk, top ayrı duruyor" bug'ı çözülür.
  const [olcW, setOlcW] = useState(600);
  useEffect(() => {
    const el = kapRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((girisler) => {
      const g = girisler[0]?.contentRect?.width;
      if (g && g > 0) setOlcW(Math.round(g));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const W = olcW;
  const H = yukseklik;
  const padL = 34; // Y-ekseni etiketleri için sol boşluk
  const padR = 14; // sağ boşluk — son nokta grafiğin sağ kenarına yakın bitsin
  const padT = 12;
  const padB = 22; // X-ekseni etiketleri için alt boşluk

  // Çoklu seri mi? Değilse tek seriyi tek elemanlı diziye sar.
  const cokluGirdi = seriler && seriler.length > 0 ? seriler : [noktalar ?? []];
  const seriRenkleri = renkler && renkler.length ? renkler : [renk];

  // Her seriyi temizle; en az 2 nokta garanti et.
  const temizSeriler = cokluGirdi.map((s) => (s ?? []).filter((v) => Number.isFinite(v)));
  const veriYok = temizSeriler.every((s) => s.length === 0);
  const seriler2 = temizSeriler.map((s) => (s.length === 0 ? [0, 0] : s.length === 1 ? [s[0], s[0]] : s));

  // Ortak Y ölçeği: tüm serilerin min/max'ı → "GÜZEL" yuvarlak sınırlara genişlet.
  // Böylece eksen etiketleri 0 / 500 / 1.000 / 1.500 gibi okunur değerler olur;
  // 349 / 699 / 1.0b gibi çirkin ham değerler ASLA çıkmaz.
  const tumDegerler = seriler2.flat();
  const veriMax = tumDegerler.length ? Math.max(...tumDegerler) : 0;
  const veriMin = tumDegerler.length ? Math.min(...tumDegerler) : 0;
  const duz = veriMax === veriMin;
  // Taban: negatif veri yoksa her zaman 0'dan başla (grafik havada durmasın).
  const hamMin = veriMin < 0 ? veriMin : 0;
  const hamMax = duz ? veriMax + 1 : veriMax;
  // "Nice" aralık: 4 kademeye bölünebilen, güzel bir adım (1/2/2.5/5 × 10^k).
  const KADEME = 4;
  function guzelAdim(kaba: number): number {
    if (kaba <= 0 || !Number.isFinite(kaba)) return 1;
    const us = Math.pow(10, Math.floor(Math.log10(kaba)));
    const taban = kaba / us; // 1..10
    const carpan = taban <= 1 ? 1 : taban <= 2 ? 2 : taban <= 2.5 ? 2.5 : taban <= 5 ? 5 : 10;
    return carpan * us;
  }
  const adim = guzelAdim((hamMax - hamMin) / KADEME);
  const min = Math.floor(hamMin / adim) * adim;
  const max = Math.ceil((hamMax || 1) / adim) * adim;
  const range = max - min || 1;
  // Ondalık gerekiyor mu? Adım 1'den küçükse (ör. 0-1 arası oran verisi) eksen
  // etiketleri tam sayıya yuvarlanınca "0,0,1,1" gibi tekrar eder — ondalık göster.
  const ondalikBasamak = adim < 1 ? Math.min(2, Math.ceil(-Math.log10(adim))) : 0;

  const enUzun = Math.max(...seriler2.map((s) => s.length));
  const icX = W - padL - padR;
  const step = enUzun > 1 ? icX / (enUzun - 1) : icX;
  const yTaban = H - padB;
  const yTavan = padT;

  const yOf = (v: number) => {
    const oran = duz ? 0.5 : (v - min) / range;
    return yTavan + (1 - oran) * (yTaban - yTavan);
  };
  const xOf = (i: number) => padL + i * step;

  // Her serinin nokta koordinatları.
  const seriPts = seriler2.map((s) => s.map((v, i) => [xOf(i), yOf(v)] as const));

  // Catmull-Rom → kübik Bézier: yumuşak eğri. Kontrol noktalarının Y'si grafik
  // alanına ([yTavan, yTaban]) KISTIRILIR — böylece düz-sonra-sıçrama gibi sert
  // verilerde eğri 0-çizgisinin ALTINA taşmaz (görseldeki negatif dalga bug'ı).
  const kisY = (y: number) => Math.max(yTavan, Math.min(yTaban, y));
  function yumusakYol(p: readonly (readonly [number, number])[]) {
    if (p.length < 2) return `M ${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;
    let d = `M ${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[i === 0 ? 0 : i - 1];
      const p1 = p[i];
      const p2 = p[i + 1];
      const p3 = p[i + 2 < p.length ? i + 2 : p.length - 1];
      const t = 1 / 6;
      const c1x = p1[0] + (p2[0] - p0[0]) * t;
      const c1y = kisY(p1[1] + (p2[1] - p0[1]) * t);
      const c2x = p2[0] - (p3[0] - p1[0]) * t;
      const c2y = kisY(p2[1] - (p3[1] - p1[1]) * t);
      d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d;
  }

  // Kısa sayı biçimi — Türkçe: bin=B, milyon=Mn. Ondalık aralıkta (adim<1) küçük
  // değerler ondalıkla gösterilir; aksi halde tam sayı. Tekrar eden "0,0,1,1"
  // etiketleri önlenmiş olur.
  const kisa = (n: number) => {
    const a = Math.abs(n);
    if (a >= 1_000_000) return (n / 1_000_000).toFixed(a % 1_000_000 ? 1 : 0) + "Mn";
    if (a >= 1_000) return (n / 1_000).toFixed(a % 1_000 ? 1 : 0) + "B";
    if (ondalikBasamak > 0) return n.toFixed(ondalikBasamak);
    return String(Math.round(n));
  };

  // Y-ekseni işaretleri — güzel adımla üretilir (min, min+adim, min+2·adim, …).
  // Her etiket adım'ın tam katı olduğu için okunabilir yuvarlak sayılardır.
  // Aynı GÖRÜNEN etikete sahip ardışık tick'ler elenir (çirkin tekrar önlenir).
  const yTicks = useMemo(() => {
    const liste: { deg: number; y: number }[] = [];
    let oncekiEtiket: string | null = null;
    for (let d = min; d <= max + adim * 0.001; d += adim) {
      const etiket = kisa(d);
      if (etiket === oncekiEtiket) continue; // tekrar eden etiketi atla
      oncekiEtiket = etiket;
      liste.push({ deg: d, y: yOf(d) });
    }
    return liste;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min, max, adim, yTaban, yTavan, duz, ondalikBasamak]);

  const etks = etiketler && etiketler.length ? etiketler : null;

  // --- Hover: fareyi en yakın veri indeksine eşle (piksel ölçeğinden viewBox'a).
  function fareTakip(e: React.MouseEvent<HTMLDivElement>) {
    if (veriYok || !kapRef.current) return;
    const kutu = kapRef.current.getBoundingClientRect();
    const oranX = (e.clientX - kutu.left) / kutu.width; // 0..1
    const vbX = oranX * W;
    // en yakın indeks
    const rawI = (vbX - padL) / step;
    const i = Math.max(0, Math.min(enUzun - 1, Math.round(rawI)));
    setHover(i);
  }

  // Tooltip yatay konumu — kenarlarda taşmayı ve sağ-üst legend çakışmasını
  // önlemek için %8–%92 aralığına kıstır ve uçlarda hizayı kenara çevir.
  const hamSol = hover !== null ? (xOf(hover) / W) * 100 : 0;
  const tooltipSol = Math.max(8, Math.min(92, hamSol));
  // Uçlara yakınken -translate-x'i ayarla ki balon konteynerin içinde kalsın.
  const tooltipHiza = hamSol <= 12 ? "left" : hamSol >= 88 ? "right" : "orta";
  // Dikey: balonu hover'daki EN ÜST (en küçük y) noktanın biraz üstüne koy;
  // böylece grafiğin en tepesindeki legend şeridiyle çakışmaz.
  const tooltipUst = hover !== null
    ? Math.max(18, Math.min(...seriler2.map((s) => yOf(s[Math.min(hover, s.length - 1)]))) - 12)
    : 0;

  return (
    <div className="relative">
      <div
        ref={kapRef}
        className="relative"
        onMouseMove={fareTakip}
        onMouseLeave={() => setHover(null)}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ height: yukseklik }}
          preserveAspectRatio="none"
          role="img"
          aria-label={t("grafik.aria.trend")}
        >
          <defs>
            {seriRenkleri.map((c, si) => (
              <linearGradient key={si} id={`${uid}-dolgu-${si}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={c} stopOpacity="0.12" />
                <stop offset="100%" stopColor={c} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>

          {/* Y-ekseni yatay grid çizgileri — ÇOK ince, açık, solid (non-scaling) */}
          {yTicks.map((t, i) => (
            <line
              key={i}
              x1={padL}
              x2={W - padR}
              y1={t.y}
              y2={t.y}
              stroke={GRID}
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {/* ÖNCE tüm alan-dolgular (arka katman). Böylece sonraki serinin dolgusu
              önceki serinin ÇİZGİSİNİ örtmez — "sonda çizgi soluyor" bug'ının kökü. */}
          {seriPts.map((pts, si) => {
            const cizgi = yumusakYol(pts);
            const son = pts[pts.length - 1];
            const ilk = pts[0];
            const alan = `${cizgi} L ${son[0].toFixed(1)} ${yTaban} L ${ilk[0].toFixed(1)} ${yTaban} Z`;
            return (
              <motion.path
                key={`alan-${si}`}
                d={alan}
                fill={`url(#${uid}-dolgu-${si})`}
                initial={{ opacity: 0 }}
                animate={{ opacity: veriYok ? 0.4 : 1 }}
                transition={{ duration: 0.8 }}
              />
            );
          })}
          {/* SONRA tüm çizgiler (ön katman) — her zaman dolguların üstünde, net. */}
          {seriPts.map((pts, si) => {
            const cizgi = yumusakYol(pts);
            const c = seriRenkleri[si % seriRenkleri.length];
            return (
              <motion.path
                key={`cizgi-${si}`}
                d={cizgi}
                fill="none"
                stroke={c}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={veriYok ? "4 5" : undefined}
                strokeOpacity={veriYok ? 0.4 : 1}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}

          {/* Hover: dikey kılavuz + her seride dolu daire */}
          {hover !== null && !veriYok && (
            <g>
              <line
                x1={xOf(hover)}
                x2={xOf(hover)}
                y1={yTavan}
                y2={yTaban}
                stroke="#c9c4b6"
                strokeWidth="1"
                strokeDasharray="3 3"
                vectorEffect="non-scaling-stroke"
              />
              {seriler2.map((s, si) => {
                const idx = Math.min(hover, s.length - 1);
                const c = seriRenkleri[si % seriRenkleri.length];
                return (
                  <circle
                    key={si}
                    cx={xOf(idx)}
                    cy={yOf(s[idx])}
                    r="3"
                    fill={c}
                    stroke="#faf9f4"
                    strokeWidth="1.75"
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
            </g>
          )}
        </svg>

        {/* Y-ekseni değer etiketleri (SVG dışı, ölçekten etkilenmez) */}
        {!veriYok && (
          <div className="pointer-events-none absolute inset-0">
            {yTicks.map((t, i) => (
              <span
                key={i}
                className="absolute right-full -translate-y-1/2 pr-1 text-right text-[9px] tabular-nums"
                style={{
                  color: EKSEN_YAZI,
                  top: `${(t.y / H) * 100}%`,
                  left: `${(padL / W) * 100}%`,
                }}
              >
                {kisa(t.deg)}
              </span>
            ))}
          </div>
        )}

        {/* Son-nokta vurguları — HTML overlay (mükemmel daire, çizgi ucuna
            tam oturur; SVG stretch'inden etkilenmez). */}
        {!veriYok && (
          <div className="pointer-events-none absolute inset-0">
            {seriPts.map((pts, si) => {
              const son = pts[pts.length - 1];
              const c = seriRenkleri[si % seriRenkleri.length];
              return (
                <span
                  key={si}
                  className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[#faf9f4]"
                  style={{
                    left: `${(son[0] / W) * 100}%`,
                    top: `${(son[1] / H) * 100}%`,
                    background: c,
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Hover tooltip — tarih + değer(ler). Balon hover noktasının biraz
            ÜSTÜNDE ve konteyner içinde kalacak şekilde konumlanır; grafiğin
            tepesindeki legend şeridiyle artık çakışmaz. */}
        {hover !== null && !veriYok && (
          <div
            className={cn(
              "pointer-events-none absolute z-20 -translate-y-full whitespace-nowrap rounded-lg border border-line bg-surface/95 px-2.5 py-1.5 text-[11px] shadow-lift backdrop-blur-sm",
              tooltipHiza === "left" ? "translate-x-0" : tooltipHiza === "right" ? "-translate-x-full" : "-translate-x-1/2",
            )}
            style={{ left: `${tooltipSol}%`, top: tooltipUst }}
          >
            {etks && (
              <div className="mb-0.5 font-medium text-slate-muted">
                {etks[Math.min(hover, etks.length - 1)]}
              </div>
            )}
            {seriler2.map((s, si) => {
              const idx = Math.min(hover, s.length - 1);
              const c = seriRenkleri[si % seriRenkleri.length];
              const ad = seriEtiketleri?.[si];
              return (
                <div key={si} className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ background: c }} />
                  {ad && <span className="text-slate-muted">{ad}</span>}
                  <span className="ml-auto font-semibold tabular-nums text-slate-ink">
                    {s[idx].toLocaleString("tr-TR")}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* boş-durum rozeti */}
      {veriYok && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="rounded-full border border-line bg-surface/80 px-3 py-1 text-[11px] font-medium text-slate-faint backdrop-blur-sm">
            {t("grafik.veriYok")}
          </span>
        </div>
      )}

      {/* Çoklu seri legend */}
      {seriEtiketleri && seriEtiketleri.length > 1 && !veriYok && (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 pl-8 text-[11px]">
          {seriEtiketleri.map((ad, si) => (
            <span key={si} className="flex items-center gap-1.5 text-slate-muted">
              <span className="size-2 rounded-full" style={{ background: seriRenkleri[si % seriRenkleri.length] }} />
              {ad}
            </span>
          ))}
        </div>
      )}

      {/* x-ekseni etiketleri — eşit aralıklı ~6 işaret (Google Analytics tarzı).
          Sadece 3 (ilk/orta/son) yerine dengeli dağıtılmış etiketler grafiği
          çok daha okunur yapar; çok kısa serilerde tümü, uzunlarda seyreltilir. */}
      {etks && !veriYok && (
        <div
          className="relative mt-1.5 h-3.5 text-[10px] font-medium tabular-nums"
          style={{ color: EKSEN_YAZI }}
        >
          {(() => {
            const n = etks.length;
            const hedef = Math.min(6, n); // en çok 6 etiket
            const idxSet = new Set<number>();
            for (let j = 0; j < hedef; j++) idxSet.add(Math.round((j * (n - 1)) / (hedef - 1 || 1)));
            idxSet.add(0);
            idxSet.add(n - 1); // ilk ve son her zaman görünür
            return [...idxSet].sort((a, b) => a - b).map((i) => {
              const yatay = (xOf(i) / W) * 100;
              // Uçlarda hizalamayı kenara çevir ki taşmasın.
              const ceviri = i === 0 ? "translateX(0)" : i === n - 1 ? "translateX(-100%)" : "translateX(-50%)";
              return (
                <span
                  key={i}
                  className="absolute whitespace-nowrap"
                  style={{ left: `${yatay}%`, transform: ceviri }}
                >
                  {etks[i]}
                </span>
              );
            });
          })()}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------- Çift-seri stacked bar (yuvarlatılmış, hover değerli) */
export function StackBar({
  data,
  yukseklik = 260,
}: {
  data: { label: string; insan: number; bot: number }[];
  yukseklik?: number;
}) {
  const { ceviri: t } = usePanelDil();
  if (!data.length) {
    return (
      <div
        className="grid place-items-center rounded-xl border border-dashed border-line text-[12px] text-slate-faint"
        style={{ height: yukseklik }}
      >
        {t("grafik.veriYok")}
      </div>
    );
  }
  const max = Math.max(...data.map((d) => d.insan + d.bot), 1);
  return (
    <div className="flex items-end gap-1.5" style={{ height: yukseklik }} role="img" aria-label={t("grafik.aria.insanBot")}>
      {data.map((d, i) => {
        const toplam = d.insan + d.bot;
        const h = (toplam / max) * 100;
        const botH = toplam ? (d.bot / toplam) * 100 : 0;
        return (
          <div key={i} className="group relative flex flex-1 flex-col justify-end" style={{ height: "100%" }}>
            <motion.div
              className="flex w-full flex-col overflow-hidden rounded-md transition-transform duration-200 group-hover:-translate-y-0.5"
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ duration: 0.7, delay: i * 0.015, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* bot (üst) — kırmızı, düz renk */}
              <div className="w-full shrink-0" style={{ height: `${botH}%`, background: "#dc2626" }} />
              {/* insan (alt) — mavi, düz renk */}
              <div className="w-full grow" style={{ background: "#2f6fed" }} />
            </motion.div>
            {/* hover tooltip: insan + bot ayrık */}
            <div className="pointer-events-none absolute -top-14 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-line bg-surface/95 px-2.5 py-1.5 text-[11px] shadow-lift backdrop-blur-sm group-hover:block">
              <div className="mb-0.5 font-medium text-slate-muted">{d.label}</div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ background: "#2f6fed" }} />
                <span className="text-slate-muted">{t("grafik.insan")}</span>
                <span className="ml-3 font-semibold tabular-nums text-slate-ink">{d.insan.toLocaleString("tr-TR")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ background: "#dc2626" }} />
                <span className="text-slate-muted">{t("grafik.bot")}</span>
                <span className="ml-3 font-semibold tabular-nums text-slate-ink">{d.bot.toLocaleString("tr-TR")}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------- Yanıt/mini spark grafik (deterministik)
 * Tohumdan üretilen ORGANİK bir seri (pseudo-random yürüyüş + hafif dalga) —
 * tek sinüs eğrisinin yapay/tekrarlı görüntüsü yerine gerçek trend hissi.
 * width sabit değil: viewBox + w-full ile karta tam oturur. */
export function MiniSpark({ tohum, renk = "#2f6fed", yukseklik = 40 }: { tohum: string; renk?: string; yukseklik?: number }) {
  const uid = useId().replace(/:/g, "");
  let s = 0;
  for (let i = 0; i < tohum.length; i++) s = (s * 31 + tohum.charCodeAt(i)) & 0xffffffff;
  // Deterministik LCG → her adımda küçük rastgele yürüyüş, [0.18, 0.92] bandına sıkıştırılır.
  let durum = (s >>> 0) || 1;
  const rnd = () => {
    durum = (durum * 1664525 + 1013904223) >>> 0;
    return durum / 0xffffffff;
  };
  const N = 24;
  const ham: number[] = [];
  let v = 0.4 + rnd() * 0.3;
  for (let i = 0; i < N; i++) {
    v += (rnd() - 0.5) * 0.32 + 0.06 * Math.sin(i * 0.5 + s * 0.001);
    v = Math.max(0.12, Math.min(0.95, v));
    ham.push(v);
  }
  const W = 120;
  const H = yukseklik;
  const step = W / (N - 1);
  // Yumuşak eğri (Catmull-Rom benzeri quadratic smoothing).
  const pts = ham.map((val, i) => [i * step, (1 - val) * H] as const);
  let cizgi = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const orta = [(pts[i - 1][0] + pts[i][0]) / 2, (pts[i - 1][1] + pts[i][1]) / 2];
    cizgi += ` Q ${pts[i - 1][0].toFixed(1)} ${pts[i - 1][1].toFixed(1)} ${orta[0].toFixed(1)} ${orta[1].toFixed(1)}`;
  }
  cizgi += ` L ${pts[pts.length - 1][0].toFixed(1)} ${pts[pts.length - 1][1].toFixed(1)}`;
  const son = ham[ham.length - 1];
  const alan = `${cizgi} L ${W} ${H} L 0 ${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" style={{ height: yukseklik }} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${uid}-spark`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={renk} stopOpacity="0.16" />
          <stop offset="100%" stopColor={renk} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={alan} fill={`url(#${uid}-spark)`} />
      <path d={cizgi} fill="none" stroke={renk} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle cx={W} cy={(1 - son) * H} r="2.5" fill={renk} />
    </svg>
  );
}

/* ------------------------------------------------------- Donut segment (Material halka) */
export function DonutDagilim({ segmentler, merkezEtiket = "olay" }: { segmentler: { etiket: string; deger: number; renk: string }[]; merkezEtiket?: string }) {
  const { ceviri: t } = usePanelDil();
  const gercekToplam = segmentler.reduce((a, s) => a + s.deger, 0);
  const bosDurum = segmentler.length === 0 || gercekToplam === 0;
  const toplam = gercekToplam || 1;
  const r = 42;
  const cevre = 2 * Math.PI * r;
  const kalinlik = 10; // ince, Material hissi
  const bosluk = 1.5; // segmentler arası ince boşluk (çevre birimi)

  // offset'leri mutasyonsuz önceden hesapla; her segmentten küçük boşluk düş.
  let birikim = 0;
  const cokSegment = segmentler.filter((s) => s.deger > 0).length > 1;
  const dilimler = segmentler.map((s) => {
    const tamUzunluk = (s.deger / toplam) * cevre;
    const uzunluk = cokSegment && s.deger > 0 ? Math.max(0, tamUzunluk - bosluk) : tamUzunluk;
    const off = birikim;
    birikim += tamUzunluk;
    return { ...s, uzunluk, off };
  });

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-4" role="img" aria-label={t("grafik.aria.dagilim")}>
      <div className="relative size-40 shrink-0">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90">
          {/* zemin halkası */}
          <circle cx="50" cy="50" r={r} fill="none" stroke={GRID} strokeWidth={kalinlik} strokeOpacity={bosDurum ? 1 : 0.7} />
          {!bosDurum &&
            dilimler.map((s, i) => (
              <motion.circle
                key={i}
                cx="50"
                cy="50"
                r={r}
                fill="none"
                stroke={s.renk}
                strokeWidth={kalinlik}
                strokeDasharray={`${s.uzunluk} ${cevre - s.uzunluk}`}
                strokeDashoffset={-s.off}
                strokeLinecap="butt"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
              />
            ))}
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="text-2xl font-bold tabular-nums text-slate-ink">
              {bosDurum ? 0 : gercekToplam.toLocaleString("tr-TR")}
            </div>
            <div className="text-[11px] text-slate-faint">{merkezEtiket}</div>
          </div>
        </div>
      </div>
      <div className="min-w-[180px] flex-1 space-y-2">
        {segmentler.map((s) => (
          <div key={s.etiket} className="flex items-center gap-2 text-[13px]">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: s.renk }} />
            <span className="min-w-0 truncate text-slate-muted">{s.etiket}</span>
            <span className="ml-auto shrink-0 font-semibold tabular-nums text-slate-ink">
              {((s.deger / toplam) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------- Dünya coğrafya bar (ince, yuvarlak uçlu) */
export function CografyaBar({ ulkeler }: { ulkeler: { kod: string; ad: string; deger: number }[] }) {
  const { ceviri: t } = usePanelDil();
  if (!ulkeler.length) {
    return (
      <div className="grid h-24 place-items-center rounded-xl border border-dashed border-line text-[12px] text-slate-faint">
        {t("grafik.veriYok")}
      </div>
    );
  }
  const max = Math.max(...ulkeler.map((u) => u.deger), 1);
  return (
    <div className="space-y-3">
      {ulkeler.map((u, i) => (
        <div key={u.kod} className="flex items-center gap-3">
          <span className="w-8 shrink-0 text-[13px] font-medium text-slate-muted">{u.kod}</span>
          <div className="flex-1">
            <div className="mb-1 flex items-center justify-between text-[12px]">
              <span className="truncate text-slate-muted">{u.ad}</span>
              <span className="ml-2 shrink-0 font-semibold tabular-nums text-slate-ink">
                {u.deger.toLocaleString("tr-TR")}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full" style={{ background: GRID }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: "#2f6fed" }}
                initial={{ width: 0 }}
                animate={{ width: `${(u.deger / max) * 100}%` }}
                transition={{ duration: 0.7, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
