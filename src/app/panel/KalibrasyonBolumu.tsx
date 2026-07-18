"use client";

/**
 * Specter — Skor Kalibrasyonu & Model Güvenilirliği
 * =================================================
 * Bir skor "90 bot" diyorsa gerçekten 90 mı? İyi bir sınıflandırıcı yalnızca
 * doğru sıralamaz — kendi güvenini de doğru bilir. Specter, ürettiği bot
 * tahminlerini gözlemlenen GERÇEK sonuçlarla kıyaslar (kalibrasyon). Skorları
 * 10 kovaya böler; her kovada "ortalama tahmin" ile "gerçekte bot çıkan oran"ı
 * yan yana koyar. İdeal kalibre modelde bu ikisi eşittir (y = x diyagonali).
 * Sapmanın kova-ağırlıklı ortalaması ECE'dir (Beklenen Kalibrasyon Hatası) —
 * düşük ECE = güvenilir kararlar, az yanlış-pozitif.
 *
 * ANA GÖRSEL: güvenilirlik diyagramı (reliability diagram) — ML güvenilirlik
 * araçlarının imza grafiği. HİÇBİR sayı uydurma değildir; hepsi
 * `skor-kalibrasyon` motorundan (kalibrasyonAnaliz) gelir. page.tsx SERVER'da
 * hesaplar, buraya hazır KalibrasyonSonuc gelir.
 *
 * Tasarım: TlsIstihbaratBolumu / SavunmaKatmanlariBolumu ile birebir aynı dil —
 * Panel + krem kartlar (bg-canvas), tabular-nums, rounded kartlar; framer-motion
 * rise (azHareket → sade). whileInView / viewport / opacity-fade YOK.
 */

import { motion } from "framer-motion";
import {
  Target,
  Gauge,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  Boxes,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Ruler,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Panel, Badge } from "@/components/panel/kit";
import { KorumaSkoru } from "@/components/panel/grafikler";
import type { KalibrasyonSonuc, KalibrasyonBin } from "@/lib/specter/skor-kalibrasyon";

/* ================================================================== Sabitler */

/** Kalibrasyon durumu → TR ad + renk (hex) + rozet tonu + ikon + kısa açıklama.
 *  iyi = yeşil, orta = amber, zayif = kırmızı. ECE düşük = iyi. */
const DURUM_TANIM: Record<
  KalibrasyonSonuc["durum"],
  {
    ad: string;
    hex: string;
    rozet: "yesil" | "sari" | "kirmizi";
    ikon: React.ElementType;
    ozet: string;
  }
> = {
  iyi: {
    ad: "İyi kalibre",
    hex: "#16a34a",
    rozet: "yesil",
    ikon: ShieldCheck,
    ozet: "Skorlar gerçeği yansıtıyor — kararlar güvenilir.",
  },
  orta: {
    ad: "Orta kalibre",
    hex: "#d97706",
    rozet: "sari",
    ikon: Gauge,
    ozet: "Skorlar çoğunlukla tutuyor — kenar bölgelerde sapma var.",
  },
  zayif: {
    ad: "Zayıf kalibre",
    hex: "#dc2626",
    rozet: "kirmizi",
    ikon: ShieldAlert,
    ozet: "Tahminler gerçekten sapıyor — eşikler gözden geçirilmeli.",
  },
};

/* ================================================================== Yardımcılar */

function sayi(n: number): string {
  return (Number.isFinite(n) ? n : 0).toLocaleString("tr-TR");
}

/** 0-1 oranını yüzde metnine çevirir ("0.90" → "%90"). */
function yuzde(o: number, ondalik = 0): string {
  const v = (Number.isFinite(o) ? o : 0) * 100;
  return `%${v.toLocaleString("tr-TR", { minimumFractionDigits: ondalik, maximumFractionDigits: ondalik })}`;
}

/** Kalibrasyon hatası (|tahmin - gerçek|) büyüklüğüne göre renk (hex). */
function hataRenk(fark: number): string {
  if (fark >= 0.2) return "#dc2626";
  if (fark >= 0.1) return "#ea580c";
  if (fark >= 0.05) return "#d97706";
  return "#16a34a";
}

/** Bölümü rise ile saran motion sarmalayıcı (TlsIstihbaratBolumu ile aynı). */
function Bolum({
  azHareket,
  gecikme = 0,
  children,
}: {
  azHareket: boolean;
  gecikme?: number;
  children: React.ReactNode;
}) {
  if (azHareket) return <div>{children}</div>;
  return (
    <motion.div
      initial={{ y: 12 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, delay: gecikme, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Panel başlığında ikon + metin. */
function BaslikIkon({ ikon: Ikon, metin }: { ikon: React.ElementType; metin: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Ikon className="size-4 text-slate-faint" />
      {metin}
    </span>
  );
}

/* ================================================================== Özet hapı */

function OzetHap({
  ikon: Ikon,
  etiket,
  deger,
  ek,
  ton = "ink",
  renkHex,
}: {
  ikon: React.ElementType;
  etiket: string;
  deger: string;
  ek?: string;
  ton?: "ink" | "danger" | "ok" | "warn";
  renkHex?: string;
}) {
  const renk =
    ton === "danger" ? "text-danger2" : ton === "ok" ? "text-ok" : ton === "warn" ? "text-warn" : "text-slate-ink";
  return (
    <div className="rounded-xl border border-line bg-canvas/40 px-3.5 py-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-faint">
        <Ikon className="size-3.5" />
        {etiket}
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span
          className={cn("text-[22px] font-bold leading-none num", !renkHex && renk)}
          style={renkHex ? { color: renkHex } : undefined}
        >
          {deger}
        </span>
        {ek && <span className="truncate text-[12px] text-slate-faint">{ek}</span>}
      </div>
    </div>
  );
}

/* ================================================================== Güvenilirlik diyagramı (ANA GÖRSEL) */

/**
 * Reliability diagram — X: ortalama tahmin (0-1), Y: gerçek bot oranı (0-1).
 * İdeal kalibrasyon = y = x diyagonali (kesikli). Her dolu bin bir nokta;
 * nokta çapı bin'deki örnek sayısına orantılı. Noktalar diyagonale ne kadar
 * yakınsa model o kadar iyi kalibre. Ayrıca gerçek eğri (noktaları birleştiren
 * çizgi) ve her nokta ile diyagonal arası "sapma çubuğu" çizilir.
 */
function GuvenilirlikDiyagram({
  binler,
  azHareket,
}: {
  binler: KalibrasyonBin[];
  azHareket: boolean;
}) {
  // Çizim alanı (viewBox koordinatları). Sol/alt eksen boşluğu bırakılır.
  const W = 520;
  const H = 320;
  const solPad = 46;
  const altPad = 40;
  const ustPad = 16;
  const sagPad = 16;
  const gx0 = solPad;
  const gx1 = W - sagPad;
  const gy0 = ustPad;
  const gy1 = H - altPad;
  const gw = gx1 - gx0;
  const gh = gy1 - gy0;

  // 0-1 değerini piksele çevir (Y ters: 0 altta, 1 üstte).
  const px = (v: number) => gx0 + Math.max(0, Math.min(1, v)) * gw;
  const py = (v: number) => gy1 - Math.max(0, Math.min(1, v)) * gh;

  const dolu = binler.filter((b) => b.sayi > 0);
  const maxSayi = Math.max(1, ...dolu.map((b) => b.sayi));

  // Izgara çizgileri (0, 0.25, 0.5, 0.75, 1.0).
  const izgara = [0, 0.25, 0.5, 0.75, 1];

  // Gerçek eğri polyline (dolu binleri tahmine göre sırala).
  const egriNoktalar = [...dolu]
    .sort((a, b) => a.ortTahmin - b.ortTahmin)
    .map((b) => `${px(b.ortTahmin).toFixed(1)},${py(b.gercekOran).toFixed(1)}`)
    .join(" ");

  return (
    <div className="rounded-2xl border border-line bg-canvas/40 p-4">
      {/* Başlık şeridi + mini lejant */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-faint">
          <Target className="size-3.5" />
          Güvenilirlik diyagramı
        </div>
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[10.5px] text-slate-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-0 w-4 border-t border-dashed border-slate-400" />
            İdeal (tahmin = gerçek)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-[3px] w-4 rounded-full bg-brand-500" />
            Veylify eğrisi
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-brand-600 ring-2 ring-inset ring-white" />
            Kova (çap = örnek)
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-[300px] w-full"
        role="img"
        aria-label="Güvenilirlik diyagramı: ortalama tahmin (yatay) ile gerçek bot oranı (dikey) karşılaştırması"
      >
        {/* Izgara + eksen etiketleri */}
        {izgara.map((g) => (
          <g key={`gx-${g}`}>
            {/* dikey ızgara */}
            <line x1={px(g)} y1={gy0} x2={px(g)} y2={gy1} stroke="#eef1f6" strokeWidth={1} />
            {/* X etiketi */}
            <text
              x={px(g)}
              y={gy1 + 18}
              textAnchor="middle"
              className="fill-slate-400 text-[10px]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {g.toFixed(2)}
            </text>
          </g>
        ))}
        {izgara.map((g) => (
          <g key={`gy-${g}`}>
            {/* yatay ızgara */}
            <line x1={gx0} y1={py(g)} x2={gx1} y2={py(g)} stroke="#eef1f6" strokeWidth={1} />
            {/* Y etiketi */}
            <text
              x={gx0 - 8}
              y={py(g) + 3.5}
              textAnchor="end"
              className="fill-slate-400 text-[10px]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {g.toFixed(2)}
            </text>
          </g>
        ))}

        {/* Çerçeve */}
        <rect x={gx0} y={gy0} width={gw} height={gh} fill="none" stroke="#e2e6ee" strokeWidth={1.5} rx={6} />

        {/* İdeal diyagonal (y = x, kesikli) */}
        <line
          x1={px(0)}
          y1={py(0)}
          x2={px(1)}
          y2={py(1)}
          stroke="#94a3b8"
          strokeWidth={1.75}
          strokeDasharray="6 5"
          strokeLinecap="round"
        />

        {/* Her dolu bin: diyagonale sapma çubuğu (dikey — tahmin sabit, gerçek nereye düşmüş) */}
        {dolu.map((b) => {
          const x = px(b.ortTahmin);
          const yGercek = py(b.gercekOran);
          const yIdeal = py(b.ortTahmin); // diyagonal üstündeki hedef nokta
          const fark = Math.abs(b.ortTahmin - b.gercekOran);
          return (
            <line
              key={`sap-${b.aralik}`}
              x1={x}
              y1={yIdeal}
              x2={x}
              y2={yGercek}
              stroke={hataRenk(fark)}
              strokeWidth={1.5}
              strokeOpacity={0.45}
              strokeLinecap="round"
            />
          );
        })}

        {/* Gerçek eğri (Specter) — noktaları birleştiren çizgi */}
        {dolu.length >= 2 &&
          (azHareket ? (
            <polyline
              points={egriNoktalar}
              fill="none"
              stroke="#4a41e8"
              strokeWidth={2.25}
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeOpacity={0.9}
            />
          ) : (
            <motion.polyline
              points={egriNoktalar}
              fill="none"
              stroke="#4a41e8"
              strokeWidth={2.25}
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeOpacity={0.9}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            />
          ))}

        {/* Bin noktaları — çap örnek sayısına orantılı (4-11px).
            Kenar bin'lerde (tahmin/oran = 0 veya 1) nokta+halo çerçeve dışına
            taşmasın diye merkez, yarıçap+halo kadar içeri KISTIRILIR. */}
        {dolu.map((b, i) => {
          const r = 4 + (b.sayi / maxSayi) * 7;
          const pay = r + 2; // halo dahil
          const x = Math.max(gx0 + pay, Math.min(gx1 - pay, px(b.ortTahmin)));
          const y = Math.max(gy0 + pay, Math.min(gy1 - pay, py(b.gercekOran)));
          const fark = Math.abs(b.ortTahmin - b.gercekOran);
          const renk = hataRenk(fark);
          const nokta = (
            <>
              <circle cx={x} cy={y} r={r + 2} fill="var(--color-surface)" />
              <circle cx={x} cy={y} r={r} fill={renk} fillOpacity={0.9} stroke="#ffffff" strokeWidth={1.5} />
            </>
          );
          if (azHareket) {
            return <g key={`nk-${b.aralik}`}>{nokta}</g>;
          }
          return (
            <motion.g
              key={`nk-${b.aralik}`}
              initial={{ scale: 0.4 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.35, delay: 0.15 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: `${x}px ${y}px` }}
            >
              {nokta}
            </motion.g>
          );
        })}

        {/* Eksen başlıkları */}
        <text
          x={gx0 + gw / 2}
          y={H - 4}
          textAnchor="middle"
          className="fill-slate-500 text-[11px] font-medium"
        >
          Veylify tahmini (ortalama bot skoru)
        </text>
        <text
          x={14}
          y={gy0 + gh / 2}
          textAnchor="middle"
          transform={`rotate(-90 14 ${gy0 + gh / 2})`}
          className="fill-slate-500 text-[11px] font-medium"
        >
          Gerçek bot oranı
        </text>
      </svg>

      {/* Okuma ipucu */}
      <p className="mt-2 text-[11.5px] leading-relaxed text-slate-muted">
        Noktalar kesikli çizgiye ne kadar yakınsa Veylify o kadar iyi kalibre.{" "}
        <span className="text-slate-faint">Çizginin üstündeki nokta = model olduğundan az güvenmiş; altındaki = fazla güvenmiş.</span>
      </p>
    </div>
  );
}

/* ================================================================== Skor dağılım histogramı (bimodal) */

/**
 * Skor dağılım histogramı — güvenilirlik scatter'ından TAMAMEN farklı görsel dil.
 * X: 10 skor kovası (0→1), Y: her kovadaki örnek sayısı. Her sütun insan (alt,
 * mavi) + bot (üst, kırmızı) olarak yığılır — iyi ayrışan modelde iki tepe
 * (bimodal) görünür: solda insan yığını, sağda bot yığını, ortada boşluk.
 * gercekOran = o kovanın bot payı → insan/bot bölünmesini verir.
 */
function SkorHistogram({ binler, azHareket }: { binler: KalibrasyonBin[]; azHareket: boolean }) {
  const veriler = binler.map((b) => {
    const bot = Math.round(b.sayi * b.gercekOran);
    const insan = b.sayi - bot;
    // Kova orta noktası (0.05, 0.15, …) — insan mı bot bölgesi mi göstermek için.
    const orta = Number.parseFloat(b.aralik.split("-")[0]) + 0.05;
    return { aralik: b.aralik, orta, bot, insan, toplam: b.sayi };
  });
  const maxToplam = Math.max(1, ...veriler.map((v) => v.toplam));

  return (
    <div className="rounded-2xl border border-line bg-canvas/40 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-faint">
          <Boxes className="size-3.5" />
          Skor dağılımı (insan/bot ayrışması)
        </div>
        <div className="flex items-center gap-x-3 gap-y-1 text-[10.5px] text-slate-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: "#2f6fed" }} /> İnsan
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: "#dc2626" }} /> Bot
          </span>
        </div>
      </div>

      <div className="flex h-40 items-end gap-1.5">
        {veriler.map((v, i) => {
          const h = (v.toplam / maxToplam) * 100;
          const botPay = v.toplam ? (v.bot / v.toplam) * 100 : 0;
          return (
            <div key={v.aralik} className="group relative flex flex-1 flex-col justify-end" style={{ height: "100%" }}>
              <motion.div
                className="flex w-full flex-col overflow-hidden rounded-t-md"
                initial={azHareket ? false : { height: 0 }}
                animate={{ height: `${Math.max(v.toplam > 0 ? 3 : 0, h)}%` }}
                transition={{ duration: 0.6, delay: azHareket ? 0 : i * 0.03, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="w-full shrink-0" style={{ height: `${botPay}%`, background: "#dc2626" }} />
                <div className="w-full grow" style={{ background: "#2f6fed" }} />
              </motion.div>
              {/* hover değeri */}
              <div className="pointer-events-none absolute -top-12 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-line bg-surface/95 px-2.5 py-1.5 text-[11px] shadow-lift backdrop-blur-sm group-hover:block">
                <div className="mb-0.5 font-medium text-slate-muted tabular-nums">skor {v.aralik}</div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ background: "#2f6fed" }} />
                  <span className="text-slate-muted">İnsan</span>
                  <span className="ml-3 font-semibold tabular-nums text-slate-ink">{sayi(v.insan)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ background: "#dc2626" }} />
                  <span className="text-slate-muted">Bot</span>
                  <span className="ml-3 font-semibold tabular-nums text-slate-ink">{sayi(v.bot)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* X ekseni skor etiketleri */}
      <div className="mt-1.5 flex items-center justify-between px-0.5 text-[9.5px] tabular-nums text-slate-faint">
        <span>0.0</span>
        <span>0.25</span>
        <span>0.5 (belirsiz)</span>
        <span>0.75</span>
        <span>1.0</span>
      </div>
      <p className="mt-2 text-[11.5px] leading-relaxed text-slate-muted">
        İyi ayrışan modelde <span className="font-medium text-slate-ink">iki ayrı tepe</span> oluşur — solda insanlar,
        sağda botlar. Ortadaki (%50 civarı) boşluk ne kadar belirginse karar o kadar net.
      </p>
    </div>
  );
}

/* ================================================================== Güvenilirlik gauge (ECE → skor) */

/**
 * ECE'yi tersine çevirip 0-100 güvenilirlik skoruna dönüştüren donut-gauge.
 * ECE %0 → 100 skor (kusursuz), ECE %20+ → düşük skor. Reliability scatter ve
 * histogramdan farklı 3. görsel türü: dairesel gösterge.
 */
function GuvenilirlikGauge({ ece }: { ece: number }) {
  // ECE 0 → 100, ECE 0.20 → 0 (lineer, alt sınır 0).
  const skor = Math.max(0, Math.min(100, Math.round((1 - ece / 0.2) * 100)));
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-line bg-canvas/40 px-3.5 py-3">
      <div className="mb-1 flex items-center gap-1.5 self-start text-[11px] font-medium uppercase tracking-wide text-slate-faint">
        <Gauge className="size-3.5" />
        Güvenilirlik skoru
      </div>
      <KorumaSkoru skor={skor} boyut={132} />
      <span className="mt-1 text-[11px] text-slate-faint">ECE {yuzde(ece, 1)} sapmadan türetildi</span>
    </div>
  );
}

/* ================================================================== Bin satırı */

function BinSatir({ bin }: { bin: KalibrasyonBin }) {
  const fark = Math.abs(bin.ortTahmin - bin.gercekOran);
  const renk = hataRenk(fark);
  // Sayı barı — bin popülasyonu (görsel ağırlık).
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 py-2.5">
      {/* Skor aralığı */}
      <span className="rounded-md bg-canvas px-2 py-1 font-mono text-[11.5px] font-medium text-slate-ink ring-1 ring-inset ring-line tabular-nums">
        {bin.aralik}
      </span>

      {/* Tahmin vs gerçek karşılaştırması */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px]">
          <span className="inline-flex items-center gap-1 text-slate-muted">
            <span className="text-[10.5px] uppercase tracking-wide text-slate-faint">Tahmin</span>
            <span className="font-semibold tabular-nums text-slate-ink">{yuzde(bin.ortTahmin)}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-slate-muted">
            <span className="text-[10.5px] uppercase tracking-wide text-slate-faint">Gerçek</span>
            <span className="font-semibold tabular-nums text-slate-ink">{yuzde(bin.gercekOran)}</span>
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums"
            style={{ background: `${renk}14`, color: renk }}
          >
            {fark < 0.05 ? <CheckCircle2 className="size-3" /> : <AlertTriangle className="size-3" />}
            ±{yuzde(fark, 1)}
          </span>
        </div>
        {/* Tahmin (üst) vs gerçek (alt) mini çift-bar — doğrudan görsel kıyas */}
        <div className="mt-1.5 space-y-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-canvas">
            <div className="h-full rounded-full bg-slate-300" style={{ width: `${Math.max(0, Math.min(100, bin.ortTahmin * 100))}%` }} />
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-canvas">
            <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, bin.gercekOran * 100))}%`, background: renk }} />
          </div>
        </div>
      </div>

      {/* Örnek sayısı */}
      <div className="flex flex-col items-end">
        <span className="text-[13px] font-semibold tabular-nums text-slate-ink">{sayi(bin.sayi)}</span>
        <span className="text-[10px] font-medium uppercase tracking-wide text-slate-faint">örnek</span>
      </div>
    </div>
  );
}

/* ================================================================== Ana bileşen */

export function KalibrasyonBolumu({
  kalibrasyon,
  azHareket,
}: {
  kalibrasyon: KalibrasyonSonuc;
  azHareket: boolean;
}) {
  const { binler, ece, durum, toplam } = kalibrasyon;
  const tanim = DURUM_TANIM[durum] ?? DURUM_TANIM.orta;
  const DurumIkon = tanim.ikon;
  const doluBinler = binler.filter((b) => b.sayi > 0);
  const yeterliVeri = toplam > 0 && doluBinler.length > 0;

  return (
    <Bolum azHareket={azHareket}>
      <Panel
        baslik={<BaslikIkon ikon={Target} metin="Skor Kalibrasyonu" />}
        sagUst={
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-slate-faint">ECE {yuzde(ece, 1)}</span>
            <Badge ton={tanim.rozet}>
              <DurumIkon className="size-3" />
              {tanim.ad}
            </Badge>
          </div>
        }
      >
        {/* Açıklama — kilit fikir */}
        <p className="-mt-1 mb-4 max-w-2xl text-[13px] leading-relaxed text-slate-muted">
          <span className="font-medium text-slate-ink">Bir skor &quot;90 bot&quot; diyorsa gerçekten 90 mı?</span>{" "}
          İyi bir model yalnızca doğru sıralamaz — kendi güvenini de doğru bilir. Veylify, ürettiği bot
          tahminlerini gözlemlenen gerçek sonuçlarla kıyaslar (kalibrasyon). İyi kalibre model ={" "}
          <span className="font-medium text-ok">güvenilir kararlar, az yanlış-pozitif</span>.
        </p>

        {yeterliVeri ? (
          <>
            {/* Özet şeridi: güvenilirlik gauge (dairesel) + KPI hapları + durum cümlesi */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[auto_1fr]">
              <GuvenilirlikGauge ece={ece} />
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <OzetHap
                    ikon={Ruler}
                    etiket="ECE (kalibrasyon hatası)"
                    deger={yuzde(ece, 1)}
                    ek="düşük = iyi"
                    renkHex={tanim.hex}
                  />
                  <OzetHap
                    ikon={DurumIkon}
                    etiket="Güvenilirlik"
                    deger={tanim.ad}
                    ton={durum === "iyi" ? "ok" : durum === "orta" ? "warn" : "danger"}
                  />
                  <OzetHap ikon={Boxes} etiket="Değerlendirilen örnek" deger={sayi(toplam)} ek="karar" />
                </div>
                {/* Durum cümlesi — vurgu */}
                <div
                  className="flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[12.5px] leading-relaxed"
                  style={{ borderColor: `${tanim.hex}33`, background: `${tanim.hex}0d`, color: tanim.hex }}
                >
                  <Sparkles className="mt-0.5 size-4 shrink-0" />
                  <span>
                    <span className="font-semibold">Beklenen Kalibrasyon Hatası {yuzde(ece, 1)}</span> — {tanim.ozet}{" "}
                    Ortalama olarak Veylify&apos;ın bir kovadaki güveni ile o kovanın gerçek bot oranı{" "}
                    <span className="font-semibold">{yuzde(ece, 1)}</span> sapıyor.
                  </span>
                </div>
              </div>
            </div>

            {/* GÖRSEL 1 — skor dağılım histogramı (bimodal insan/bot) */}
            <div className="mt-5">
              <Bolum azHareket={azHareket} gecikme={azHareket ? 0 : 0.05}>
                <SkorHistogram binler={binler} azHareket={azHareket} />
              </Bolum>
            </div>

            {/* GÖRSEL 2 — güvenilirlik diyagramı (kalibrasyon eğrisi / scatter) */}
            <div className="mt-5">
              <Bolum azHareket={azHareket} gecikme={azHareket ? 0 : 0.08}>
                <GuvenilirlikDiyagram binler={binler} azHareket={azHareket} />
              </Bolum>
            </div>

            {/* Bin dökümü — kova kova tahmin vs gerçek */}
            <div className="mt-5">
              <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-faint">
                <TrendingUp className="size-3.5" />
                Kova dökümü (tahmin vs gerçek — fark = kalibrasyon hatası)
              </div>
              <div className="rounded-2xl border border-line bg-canvas/30 px-4 divide-y divide-line/70">
                {doluBinler.map((b, i) => (
                  <Bolum key={b.aralik} azHareket={azHareket} gecikme={azHareket ? 0 : 0.05 + i * 0.03}>
                    <BinSatir bin={b} />
                  </Bolum>
                ))}
              </div>
            </div>

            {/* Renk lejantı + kilit vurgu */}
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4 text-[11px] text-slate-faint">
              <span className="font-medium uppercase tracking-wide">Sapma:</span>
              <span className="inline-flex items-center gap-1.5 text-slate-muted">
                <span className="size-2.5 rounded-full" style={{ background: "#16a34a" }} />
                İyi (&lt;%5)
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-muted">
                <span className="size-2.5 rounded-full" style={{ background: "#d97706" }} />
                Ilımlı (%5–10)
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-muted">
                <span className="size-2.5 rounded-full" style={{ background: "#ea580c" }} />
                Belirgin (%10–20)
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-muted">
                <span className="size-2.5 rounded-full" style={{ background: "#dc2626" }} />
                Yüksek (&gt;%20)
              </span>
              <span className="ml-auto inline-flex items-center gap-1.5 font-medium text-slate-muted">
                <Target className="size-3.5 text-slate-faint" />
                Diyagonale yakınlık = güvenilir skor
              </span>
            </div>
          </>
        ) : (
          <div className="grid place-items-center rounded-2xl border border-dashed border-line py-12 text-center">
            <Ban className="mb-2 size-7 text-slate-faint" />
            <p className="text-[13px] font-medium text-slate-muted">Kalibrasyon için yeterli veri yok</p>
            <p className="mt-0.5 max-w-sm text-[12px] text-slate-faint">
              Veylify kararlar biriktirdikçe tahminler gerçek sonuçlarla kıyaslanır ve güvenilirlik
              diyagramı burada oluşur.
            </p>
          </div>
        )}
      </Panel>
    </Bolum>
  );
}
