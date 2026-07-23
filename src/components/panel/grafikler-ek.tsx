"use client";

/**
 * Dashboard görsel çeşitliliği için ek grafik bileşenleri. grafikler.tsx'i
 * şişirmeden, monoton yatay-bar tekrarını kırmak için: histogram, radar,
 * ısı-matris, gauge. Hepsi elle SVG, krem tema, brand-600 vurgu, offline.
 */

import { cn } from "@/lib/cn";

const GRID = "#e6e1d5";

/* ---------------------------------------------------- Histogram (dağılım) */
export function Histogram({
  kovalar,
  yukseklik = 90,
  renk = "#2f6fed",
  ikinciRenk,
}: {
  /** Her kova: {etiket, deger} — ör. skor aralıkları. */
  kovalar: { etiket: string; deger: number; ton?: "insan" | "bot" | "nötr" }[];
  yukseklik?: number;
  renk?: string;
  ikinciRenk?: string;
}) {
  const toplam = kovalar.reduce((a, k) => a + Math.max(0, k.deger), 0);
  const max = Math.max(1, ...kovalar.map((k) => k.deger));
  const renkSec = (ton?: string) =>
    ton === "bot" ? "#dc2626" : ton === "insan" ? "#16a34a" : ikinciRenk ?? renk;

  // BOŞ-DURUM: tüm kovalar 0 ise ince-görünmez barlar yerine dürüst bir mesaj
  // göster (aksi halde grafik "kırık/boş kutu" gibi görünür — kullanıcı hatası sanır).
  if (toplam <= 0) {
    return (
      <div>
        <div
          className="grid place-items-center rounded-xl border border-dashed border-line text-center"
          style={{ height: yukseklik + 22 }}
        >
          <div className="px-3">
            <p className="text-[12px] font-medium text-slate-muted">Henüz veri yok</p>
            <p className="mt-0.5 text-[11px] text-slate-faint">
              Trafik geldikçe dağılım burada oluşur.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-end gap-1" style={{ height: yukseklik }}>
        {kovalar.map((k, i) => (
          <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
            <div
              className="w-full rounded-t-md transition-all"
              style={{
                // Sıfır kovada görünür bir taban (2px) bırak; dolu kovalar orantılı.
                height: k.deger > 0 ? `${Math.max(6, (k.deger / max) * 100)}%` : "2px",
                background: renkSec(k.ton),
                opacity: k.deger > 0 ? 0.85 : 0.25,
              }}
              title={`${k.etiket}: ${k.deger}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1">
        {kovalar.map((k, i) => (
          <span
            key={i}
            className="flex-1 truncate text-center text-[9px] tabular-nums text-slate-faint"
          >
            {k.etiket}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------- Radar (çok-eksenli profil) */
export function RadarGrafik({
  eksenler,
  boyut = 200,
  renk = "#2f6fed",
}: {
  /** Her eksen: {etiket, deger 0-100}. */
  eksenler: { etiket: string; deger: number }[];
  boyut?: number;
  renk?: string;
}) {
  const n = eksenler.length;
  if (n < 3) return null;
  const merkez = boyut / 2;
  const r = merkez - 26;
  const nokta = (deger: number, i: number) => {
    const aci = (Math.PI * 2 * i) / n - Math.PI / 2;
    const uzunluk = (Math.max(0, Math.min(100, deger)) / 100) * r;
    return [merkez + Math.cos(aci) * uzunluk, merkez + Math.sin(aci) * uzunluk];
  };
  const halkalar = [0.25, 0.5, 0.75, 1];
  const veriYolu =
    eksenler
      .map((e, i) => {
        const [x, y] = nokta(e.deger, i);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ") + "Z";
  return (
    <svg viewBox={`0 0 ${boyut} ${boyut}`} width={boyut} height={boyut} className="max-w-full overflow-visible">
      {halkalar.map((h, i) => (
        <polygon
          key={i}
          points={eksenler
            .map((_, j) => {
              const aci = (Math.PI * 2 * j) / n - Math.PI / 2;
              return `${merkez + Math.cos(aci) * r * h},${merkez + Math.sin(aci) * r * h}`;
            })
            .join(" ")}
          fill="none"
          stroke={GRID}
          strokeWidth="1"
        />
      ))}
      {eksenler.map((_, i) => {
        const aci = (Math.PI * 2 * i) / n - Math.PI / 2;
        return (
          <line
            key={i}
            x1={merkez}
            y1={merkez}
            x2={merkez + Math.cos(aci) * r}
            y2={merkez + Math.sin(aci) * r}
            stroke={GRID}
            strokeWidth="1"
          />
        );
      })}
      <path d={veriYolu} fill={renk} fillOpacity="0.14" stroke={renk} strokeWidth="1.75" strokeLinejoin="round" />
      {eksenler.map((e, i) => {
        const [x, y] = nokta(e.deger, i);
        return <circle key={i} cx={x} cy={y} r="2.5" fill={renk} />;
      })}
      {eksenler.map((e, i) => {
        const aci = (Math.PI * 2 * i) / n - Math.PI / 2;
        const cosA = Math.cos(aci);
        const lx = merkez + cosA * (r + 14);
        const ly = merkez + Math.sin(aci) * (r + 14);
        // Yatay hizayı açıya göre seç: sağdaki etiketler sola, soldakiler sağa
        // yaslanır → uzun etiketler grafik dışına taşmadan okunur.
        const anchor = cosA > 0.3 ? "start" : cosA < -0.3 ? "end" : "middle";
        // Uzun etiketleri kısalt (radar dar; taşmayı önle).
        const etiket = e.etiket.length > 12 ? e.etiket.slice(0, 11) + "…" : e.etiket;
        return (
          <text
            key={i}
            x={lx}
            y={ly}
            fontSize="9"
            className="fill-slate-muted"
            textAnchor={anchor}
            dominantBaseline="middle"
          >
            <title>{e.etiket}</title>
            {etiket}
          </text>
        );
      })}
    </svg>
  );
}

/* ---------------------------------------------------- Isı matrisi (satır × sütun) */
export function IsiMatris({
  satirlar,
  sutunlar,
  degerler,
  renk = "#dc2626",
}: {
  satirlar: string[];
  sutunlar: string[];
  /** degerler[satirIndex][sutunIndex] = 0-100 yoğunluk. */
  degerler: number[][];
  renk?: string;
}) {
  const max = Math.max(1, ...degerler.flat());
  return (
    <div className="overflow-hidden">
      <div className="grid gap-1" style={{ gridTemplateColumns: `88px repeat(${sutunlar.length}, minmax(0,1fr))` }}>
        <span />
        {sutunlar.map((s) => (
          <span key={s} className="truncate pb-1 text-center text-[9px] font-medium text-slate-faint">
            {s}
          </span>
        ))}
        {satirlar.map((satir, i) => (
          <div key={satir} className="contents">
            <span className="truncate self-center pr-1 text-right text-[10px] font-medium text-slate-muted">
              {satir}
            </span>
            {sutunlar.map((_, j) => {
              const v = degerler[i]?.[j] ?? 0;
              const yog = v / max;
              // TEMA: sıfır/açık hücreler için tema-duyarlı token kullan (koyu temada
              // sabit "#f4f1ea" devasa beyaz kutular oluşturuyordu). Renk yoğunluğu
              // markanın kırmızısıyla; boş hücre canvas/metin token'larına düşer.
              return (
                <div
                  key={j}
                  className={cn(
                    "grid aspect-square place-items-center rounded-[4px] text-[9px] font-semibold tabular-nums",
                    yog === 0 && "bg-canvas text-slate-faint",
                  )}
                  style={
                    yog === 0
                      ? undefined
                      : {
                          background: `${renk}${Math.round(18 + yog * 82).toString(16).padStart(2, "0")}`,
                          color: yog > 0.55 ? "#fff" : "var(--color-slate-muted)",
                        }
                  }
                  title={`${satir} · ${sutunlar[j]}: ${v}`}
                >
                  {v > 0 ? v : ""}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------- Gauge (yarım daire gösterge) */
export function Gauge({
  deger,
  etiket,
  boyut = 150,
  renk,
}: {
  /** 0-100. */
  deger: number;
  etiket?: string;
  boyut?: number;
  renk?: string;
}) {
  const v = Math.max(0, Math.min(100, deger));
  const otoRenk = renk ?? (v >= 80 ? "#16a34a" : v >= 50 ? "#2f6fed" : v >= 30 ? "#d97706" : "#dc2626");
  const r = 42;
  const cevre = Math.PI * r; // yarım daire
  const dolu = (v / 100) * cevre;
  return (
    <div className="relative grid place-items-center" style={{ width: boyut, height: boyut * 0.62 }}>
      <svg viewBox="0 0 100 56" width={boyut} height={boyut * 0.56}>
        <path d="M8 50 A42 42 0 0 1 92 50" fill="none" stroke={GRID} strokeWidth="7" strokeLinecap="round" />
        <path
          d="M8 50 A42 42 0 0 1 92 50"
          fill="none"
          stroke={otoRenk}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={cevre}
          strokeDashoffset={cevre - dolu}
        />
      </svg>
      <div className="absolute bottom-0 flex flex-col items-center">
        <span className="text-2xl font-bold tabular-nums text-slate-ink">{Math.round(v)}</span>
        {etiket && <span className="text-[10px] font-medium" style={{ color: otoRenk }}>{etiket}</span>}
      </div>
    </div>
  );
}
