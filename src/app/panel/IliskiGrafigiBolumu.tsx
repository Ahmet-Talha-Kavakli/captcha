"use client";

/**
 * Specter — Bot Ağı & İlişki Grafiği (Attacker Relationship Graph)
 * ================================================================
 * Tek başına IP'ler yanıltıcıdır: bir botnet onlarca IP kullanır ama AYNI cihaz
 * parmak izini veya ASN'i paylaşır. Bu bölüm, ilişki-grafiği motorunun
 * (iliskiGrafigi) çıkardığı bağlı bileşenleri — yani koordineli saldırgan
 * gruplarını (botnet kümeleri) — tek bir "düşman" kartı olarak gösterir:
 * boyutu, dominant bot sınıfı, tehdit skoru, kapsamı (IP/ASN/olay/engel), kaynak
 * ülkeler, kümedeki IP'leri BAĞLAYAN sinyaller ("neden bağlı") ve örnek IP'ler.
 *
 * HİÇBİR sayı uydurma değildir — hepsi `iliski-grafigi` motorundan türetilir.
 * page.tsx SERVER'da hesaplar, buraya hazır GrafSonuc prop gelir.
 *
 * Tasarım: KillChainBolumu / KorelasyonBolumu ile birebir aynı dil — Panel +
 * krem kartlar (bg-canvas), tabular-nums, rounded kartlar; framer-motion rise
 * (azHareket → sade). whileInView/viewport YOK.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Network,
  Share2,
  Waypoints,
  Server,
  Fingerprint,
  Boxes,
  ShieldCheck,
  ShieldAlert,
  Flame,
  Globe,
  Link2,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Panel, Badge, Ulke } from "@/components/panel/kit";
import type {
  GrafSonuc,
  Kume,
  GrafDugum,
  GrafKenar,
} from "@/lib/specter/iliski-grafigi";

/* ================================================================== Sabitler */

/** Kümedeki dominant bot sınıfı → TR ad (bilinmeyenler ham gösterilir). */
const SINIF_AD: Record<string, string> = {
  scraper: "Kazıyıcı",
  credential_stuffing: "Kimlik Denemesi",
  automation: "Otomasyon",
  ai_agent: "AI Ajanı",
  ddos: "DDoS",
  spam: "Spam",
  bot: "Bot",
  crawler: "Tarayıcı",
  human: "İnsan",
};

/** Küme boyutu → renk paleti (hex + rozet tonu + etiket). buyuk=kritik botnet. */
const BOYUT_TANIM: Record<
  Kume["boyut"],
  { hex: string; rozet: "kirmizi" | "sari" | "mavi" | "gri"; etiket: string; alt: string }
> = {
  buyuk: { hex: "#dc2626", rozet: "kirmizi", etiket: "Büyük ağ", alt: "Kritik botnet" },
  orta:  { hex: "#ea580c", rozet: "kirmizi", etiket: "Orta küme", alt: "Koordineli grup" },
  kucuk: { hex: "#d97706", rozet: "sari",    etiket: "Küçük küme", alt: "Bağlı ikili+" },
  tekil: { hex: "#64748b", rozet: "gri",     etiket: "Tekil", alt: "Yalnız saldırgan" },
};

/* ================================================================== Yardımcılar */

function sayi(n: number): string {
  return (Number.isFinite(n) ? n : 0).toLocaleString("tr-TR");
}

function sinifAd(s: string): string {
  return SINIF_AD[s] ?? s.replace(/_/g, " ");
}

/** tehditSkoru → renk (hex) + tailwind metin sınıfı. */
function tehditRenk(skor: number): { hex: string; sinif: string } {
  if (skor >= 70) return { hex: "#dc2626", sinif: "text-danger2" }; // kırmızı
  if (skor >= 45) return { hex: "#ea580c", sinif: "text-orange-600" }; // turuncu
  if (skor >= 25) return { hex: "#d97706", sinif: "text-warn" }; // amber
  return { hex: "#2f6fed", sinif: "text-blue-600" }; // mavi/gri
}

/** Bölümü rise ile saran motion sarmalayıcı (KorelasyonBolumu ile aynı). */
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
  ton = "ink",
}: {
  ikon: React.ElementType;
  etiket: string;
  deger: string;
  ton?: "ink" | "danger" | "ok";
}) {
  const renk = ton === "danger" ? "text-danger2" : ton === "ok" ? "text-ok" : "text-slate-ink";
  return (
    <div className="rounded-xl border border-line bg-canvas/40 px-3.5 py-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-faint">
        <Ikon className="size-3.5" />
        {etiket}
      </div>
      <div className="mt-1 text-[22px] font-bold leading-none num">
        <span className={renk}>{deger}</span>
      </div>
    </div>
  );
}

/* ================================================================== Metrik hücresi */

function Metrik({
  ikon: Ikon,
  etiket,
  children,
}: {
  ikon: React.ElementType;
  etiket: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">
        <Ikon className="size-3" />
        {etiket}
      </div>
      <div className="mt-1 flex items-center gap-1.5 text-[13px] font-semibold tabular-nums text-slate-ink">
        {children}
      </div>
    </div>
  );
}

/* ================================================================== Ağ görseli (SVG) */

/**
 * Odak kümesinin küçük dekoratif "yıldız/ağ" görselleştirmesi: ASN düğümleri
 * merkeze yakın, IP düğümleri çember üzerinde; kenarlar bağlantı çizgisi.
 * Sadece görsel şıklık — asıl bilgi kart listesinde. Boyut küçük ve sabit.
 */
function AgGorseli({
  dugumler,
  kenarlar,
  azHareket,
}: {
  dugumler: GrafDugum[];
  kenarlar: GrafKenar[];
  azHareket: boolean;
}) {
  const G = 340; // viewBox genişliği
  const Y = 200; // viewBox yüksekliği
  const cx = G / 2;
  const cy = Y / 2;

  const ipler = dugumler.filter((d) => d.tur === "ip");
  // ASN'leri en fazla 5 ile sınırla (çok olursa etiketler üst üste biner).
  const asnler = dugumler.filter((d) => d.tur === "asn").slice(0, 5);
  if (ipler.length === 0) return null;

  // Radyal yerleşim (deterministik):
  //   • ASN düğümleri MERKEZDE küçük bir çember üzerinde (tek ASN → tam merkez).
  //   • IP düğümleri DIŞ çemberde, ASN kümesini sarar.
  // Böylece hiçbir etiket taşmaz, düğümler çakışmaz.
  const konum = new Map<string, { x: number; y: number }>();
  const Rip = 74; // dış IP çemberi yarıçapı
  const Rasn = asnler.length > 1 ? 26 : 0; // iç ASN çemberi
  ipler.forEach((d, i) => {
    const a = (i / ipler.length) * Math.PI * 2 - Math.PI / 2;
    konum.set(d.id, { x: cx + Math.cos(a) * Rip, y: cy + Math.sin(a) * Rip * 0.62 });
  });
  asnler.forEach((d, i) => {
    const a = asnler.length > 1 ? (i / asnler.length) * Math.PI * 2 - Math.PI / 2 : 0;
    konum.set(d.id, { x: cx + Math.cos(a) * Rasn, y: cy + Math.sin(a) * Rasn });
  });

  const maxAgirlik = Math.max(1, ...ipler.map((d) => d.agirlik));

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-canvas/50 to-surface p-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-muted">
        <Waypoints className="size-3.5 text-slate-faint" />
        En büyük ağın topolojisi — IP'ler ortak ASN etrafında kümeleniyor
      </div>
      <svg viewBox={`0 0 ${G} ${Y}`} className="h-[210px] w-full" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Bot ağı topoloji görseli">
        {/* Merkez halka aurası — hub'ı görsel olarak kuvvetlendirir (dekoratif) */}
        {asnler.length > 0 && (
          <>
            <circle cx={cx} cy={cy} r={Rip * 0.62 + 6} fill="none" stroke="#dc2626" strokeOpacity={0.06} strokeWidth={10} />
            <circle cx={cx} cy={cy} r={22} fill="#dc2626" fillOpacity={0.05} />
          </>
        )}
        {/* Kenarlar (yalnızca konumu bilinen düğümler arasında) */}
        {kenarlar.map((k, i) => {
          const a = konum.get(k.kaynak);
          const b = konum.get(k.hedef);
          if (!a || !b) return null;
          return (
            <motion.line
              key={`${k.kaynak}-${k.hedef}-${i}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="#dc2626"
              strokeOpacity={0.28}
              strokeWidth={Math.min(2.4, 0.7 + k.agirlik * 0.12)}
              initial={azHareket ? false : { pathLength: 0, opacity: 0 }}
              animate={azHareket ? undefined : { pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.02, ease: [0.16, 1, 0.3, 1] }}
            />
          );
        })}
        {/* ASN düğümleri (merkez, elmas). Etiket, düğümün merkeze göre yönünde
            (üst/alt) dışa itilir → merkezde toplu olsalar bile çakışmaz. */}
        {asnler.map((d) => {
          const p = konum.get(d.id);
          if (!p) return null;
          const ustte = p.y <= cy; // merkezin üstündeyse etiketi yukarı, değilse aşağı koy
          const ey = ustte ? p.y - 12 : p.y + 18;
          // Kısa ASN kodu: "AS9009 MSFT" → "AS9009"
          const kisaEtiket = d.etiket.split(/\s+/)[0].slice(0, 8);
          return (
            <g key={d.id}>
              <motion.rect
                x={p.x - 7}
                y={p.y - 7}
                width={14}
                height={14}
                rx={3}
                transform={`rotate(45 ${p.x} ${p.y})`}
                fill="#1e293b"
                initial={azHareket ? false : { scale: 0.4, opacity: 0 }}
                animate={azHareket ? undefined : { scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              />
              <text
                x={p.x}
                y={ey}
                textAnchor="middle"
                className="fill-slate-500 font-mono text-[8px]"
                style={{ paintOrder: "stroke", stroke: "#f4f1ea", strokeWidth: 3 }}
              >
                {kisaEtiket}
              </text>
            </g>
          );
        })}
        {/* IP düğümleri (çember) — ağırlığa oranlı boyut + kötü olanda halka */}
        {ipler.map((d, i) => {
          const p = konum.get(d.id);
          if (!p) return null;
          const r = 4 + (d.agirlik / maxAgirlik) * 5;
          const renk = d.kotu ? "#dc2626" : "#f59e0b";
          return (
            <g key={d.id}>
              {/* Kötü düğümde soft vurgu halkası */}
              {d.kotu && (
                <motion.circle
                  cx={p.x}
                  cy={p.y}
                  r={r + 3}
                  fill="none"
                  stroke={renk}
                  strokeOpacity={0.22}
                  strokeWidth={1.5}
                  initial={azHareket ? false : { scale: 0, opacity: 0 }}
                  animate={azHareket ? undefined : { scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.18 + i * 0.03, ease: [0.16, 1, 0.3, 1] }}
                />
              )}
              <motion.circle
                cx={p.x}
                cy={p.y}
                r={r}
                fill={renk}
                fillOpacity={0.92}
                stroke="#fff"
                strokeWidth={1.5}
                initial={azHareket ? false : { scale: 0, opacity: 0 }}
                animate={azHareket ? undefined : { scale: 1, opacity: 1 }}
                transition={{ duration: 0.35, delay: 0.15 + i * 0.03, ease: [0.16, 1, 0.3, 1] }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ================================================================== Tehdit gauge */

/**
 * Küçük dairesel tehdit göstergesi (donut gauge) — tehditSkoru 0-100.
 * Küme kartında düz sayı pili yerine görsel bir halka; monotonluğu kırar.
 */
function TehditGauge({ skor, hex, azHareket }: { skor: number; hex: string; azHareket: boolean }) {
  const guvenli = Math.max(0, Math.min(100, Number.isFinite(skor) ? skor : 0));
  const r = 15;
  const cevre = 2 * Math.PI * r;
  const dolu = (guvenli / 100) * cevre;
  return (
    <div className="relative grid size-[46px] place-items-center">
      <svg viewBox="0 0 40 40" className="size-full -rotate-90">
        <circle cx="20" cy="20" r={r} fill="none" stroke="var(--color-line)" strokeWidth="4" />
        <motion.circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke={hex}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={cevre}
          initial={azHareket ? false : { strokeDashoffset: cevre }}
          animate={azHareket ? undefined : { strokeDashoffset: cevre - dolu }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <span className="absolute text-[12px] font-bold tabular-nums" style={{ color: hex }}>
        {guvenli}
      </span>
    </div>
  );
}

/* ================================================================== Küme kartı */

function KumeKart({
  kume,
  azHareket,
  acik,
  onToggle,
}: {
  kume: Kume;
  azHareket: boolean;
  acik: boolean;
  onToggle: () => void;
}) {
  const boyut = BOYUT_TANIM[kume.boyut];
  const tehdit = tehditRenk(kume.tehditSkoru);
  const vurgulu = kume.boyut === "buyuk" || kume.boyut === "orta";
  const kritik = kume.boyut === "buyuk";
  const engelYuzde = kume.toplamOlay > 0 ? Math.round((kume.engellenen / kume.toplamOlay) * 100) : 0;
  const ulkeGoster = kume.ulkeler.slice(0, 4);
  const ulkeArtan = kume.ulkeler.length - ulkeGoster.length;
  const ipGoster = kume.ipler.slice(0, 4);
  const ipArtan = kume.ipler.length - ipGoster.length;

  return (
    <div
      className={cn(
        "rounded-2xl border bg-canvas/40 p-4 transition",
        vurgulu ? "border-red-200 bg-danger-soft/25" : "border-line",
        acik && "ring-1 ring-inset ring-slate-300",
      )}
    >
      {/* Üst şerit: boyut + sınıf + tehdit skoru — TIKLANABİLİR (drill-down aç/kapa) */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={acik}
        aria-label={`${sinifAd(kume.dominantBotClass)} ${boyut.etiket} küme detayını ${acik ? "kapat" : "aç"}`}
        className="mb-3.5 flex w-full flex-wrap items-start justify-between gap-3 rounded-lg text-left transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="grid size-9 shrink-0 place-items-center rounded-xl ring-1 ring-inset"
            style={{
              background: `${boyut.hex}14`,
              color: boyut.hex,
              borderColor: `${boyut.hex}33`,
            }}
          >
            {kritik ? <Network className="size-[18px]" /> : <Share2 className="size-[18px]" />}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] font-semibold text-slate-ink">{sinifAd(kume.dominantBotClass)}</span>
              <Badge ton={boyut.rozet}>
                {kritik && <Flame className="size-3" />}
                {boyut.etiket}
              </Badge>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200 tabular-nums">
                <Fingerprint className="size-3" />
                {sayi(kume.ipler.length)} IP
              </span>
            </div>
            <p className="mt-0.5 text-[11.5px] text-slate-muted">
              {boyut.alt} · <span className="font-mono">{kume.id.replace("kume_", "#")}</span>
            </p>
          </div>
        </div>

        {/* Tehdit skoru — dairesel gauge (düz sayı pili yerine) */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex flex-col items-end leading-none">
            <span className="inline-flex items-center gap-1 text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">
              <ShieldAlert className="size-3" />
              tehdit
            </span>
            <span className={cn("mt-1 text-[11px] font-semibold", tehdit.sinif)}>
              {kume.tehditSkoru >= 70 ? "kritik" : kume.tehditSkoru >= 45 ? "yüksek" : kume.tehditSkoru >= 25 ? "orta" : "düşük"}
            </span>
          </div>
          <TehditGauge skor={kume.tehditSkoru} hex={tehdit.hex} azHareket={azHareket} />
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-slate-faint transition-transform",
              acik && "rotate-180",
            )}
          />
        </div>
      </button>

      {/* Kapalıyken ipucu */}
      {!acik && (
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-faint">
          <ChevronDown className="size-3" />
          Detay için tıklayın
        </p>
      )}

      {/* Drill-down detay — tıklayınca açılır */}
      <AnimatePresence initial={false}>
        {acik && (
          <motion.div
            initial={azHareket ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={azHareket ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: azHareket ? 0 : 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
      {/* Metrikler */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        <Metrik ikon={Fingerprint} etiket="IP sayısı">
          {sayi(kume.ipler.length)}
        </Metrik>
        <Metrik ikon={Server} etiket="ASN">
          <span className="truncate font-mono text-[12px]">{kume.asnler[0] ?? "—"}</span>
          {kume.asnler.length > 1 && (
            <span className="text-[11px] font-medium text-slate-faint">+{kume.asnler.length - 1}</span>
          )}
        </Metrik>
        <Metrik ikon={Boxes} etiket="Olay">
          {sayi(kume.toplamOlay)}
        </Metrik>
        <Metrik ikon={ShieldCheck} etiket="Engellenen">
          <span className={engelYuzde >= 60 ? "text-green-700" : undefined}>{sayi(kume.engellenen)}</span>
          <span className="text-[11px] font-medium text-slate-faint">%{engelYuzde}</span>
        </Metrik>
      </div>

      {/* Kaynak ülkeler */}
      {ulkeGoster.length > 0 && (
        <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">
            <Globe className="size-3" />
            Kaynak
          </span>
          <div className="flex flex-wrap items-center gap-1">
            {ulkeGoster.map((u) => (
              <Ulke key={u} kod={u} />
            ))}
            {ulkeArtan > 0 && (
              <span className="rounded bg-canvas px-1.5 py-0.5 text-[11px] font-medium text-slate-muted">
                +{ulkeArtan}
              </span>
            )}
          </div>
        </div>
      )}

      {/* "Neden bağlı" — paylaşılan sinyaller */}
      {kume.baglar.length > 0 && (
        <div className="mt-3.5">
          <div className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">
            <Link2 className="size-3" />
            Neden bağlı — paylaşılan sinyaller
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {kume.baglar.map((b) => (
              <span
                key={b}
                className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700 ring-1 ring-inset ring-brand-100"
              >
                <Waypoints className="size-3 opacity-70" />
                <span className="truncate font-mono">{b}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Örnek IP'ler */}
      {ipGoster.length > 0 && (
        <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-line/70 pt-3">
          <span className="text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">Ağdaki IP'ler</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {ipGoster.map((ip) => (
              <span key={ip} className="rounded bg-canvas px-1.5 py-0.5 font-mono text-[11px] text-slate-muted ring-1 ring-inset ring-line">
                {ip}
              </span>
            ))}
            {ipArtan > 0 && (
              <span className="text-[11px] font-medium text-slate-faint">+{sayi(ipArtan)} IP daha</span>
            )}
          </div>
        </div>
      )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================================================================== Ana bileşen */

export function IliskiGrafigiBolumu({ graf, azHareket }: { graf: GrafSonuc; azHareket: boolean }) {
  const { kumeler, odakGraf, ozet } = graf;
  // Açık drill-down kümesi (id) — tıklanınca adım-adım küme detayı açılır.
  const [acikId, setAcikId] = useState<string | null>(null);
  // Tehdit skoruna göre sırala (motor IP sayısına göre sıralıyor; burada tehdit önceliği).
  const gosterilecek = [...kumeler].sort((a, b) => b.tehditSkoru - a.tehditSkoru).slice(0, 8);
  const botnetVar = ozet.botnetKume > 0;

  return (
    <Bolum azHareket={azHareket}>
      <Panel
        baslik={<BaslikIkon ikon={Network} metin="Bot Ağı & İlişki Grafiği" />}
        sagUst={
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-slate-faint">{sayi(ozet.toplamKume)} küme</span>
            <Badge ton={botnetVar ? "kirmizi" : "brand"}>
              <Share2 className="size-3" />
              {botnetVar ? `${sayi(ozet.botnetKume)} botnet` : "Graf"}
            </Badge>
          </div>
        }
      >
        {/* Açıklama */}
        <p className="-mt-1 mb-4 max-w-2xl text-[13px] leading-relaxed text-slate-muted">
          Tek başına IP'ler yanıltıcıdır — Veylify aynı parmak izi/ASN'yi paylaşan
          saldırganları tek bir bot ağı olarak ilişkilendirir. Aşağıda koordineli
          kümeler; boyutu, tehdit skoru ve onları birbirine bağlayan sinyallerle
          birlikte gösteriliyor.
        </p>

        {/* Özet şeridi */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <OzetHap ikon={Boxes} etiket="Toplam küme" deger={sayi(ozet.toplamKume)} />
          <OzetHap
            ikon={Network}
            etiket="Botnet kümesi"
            deger={sayi(ozet.botnetKume)}
            ton={botnetVar ? "danger" : "ink"}
          />
          <OzetHap ikon={Share2} etiket="En büyük ağ" deger={`${sayi(ozet.enBuyukKume)} IP`} />
          <OzetHap ikon={Fingerprint} etiket="İlişkili IP" deger={sayi(ozet.iliskiliIp)} />
        </div>

        {/* Odak ağ görseli (dekoratif) */}
        {odakGraf && odakGraf.dugumler.length > 0 && (
          <AgGorseli dugumler={odakGraf.dugumler} kenarlar={odakGraf.kenarlar} azHareket={azHareket} />
        )}

        {/* Küme listesi */}
        {gosterilecek.length === 0 ? (
          <div className="mt-5 grid place-items-center rounded-2xl border border-dashed border-line py-12 text-center">
            <ShieldCheck className="mb-2 size-7 text-ok" />
            <p className="text-[13px] font-medium text-slate-muted">Koordineli bot ağı yok</p>
            <p className="mt-0.5 text-[12px] text-slate-faint">
              Aynı parmak izi/ASN'yi paylaşan saldırganlar tespit edildiğinde kümeler burada belirir.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {gosterilecek.map((k, i) => (
              <Bolum key={k.id} azHareket={azHareket} gecikme={azHareket ? 0 : 0.05 + i * 0.03}>
                <KumeKart
                  kume={k}
                  azHareket={azHareket}
                  acik={acikId === k.id}
                  onToggle={() => setAcikId(acikId === k.id ? null : k.id)}
                />
              </Bolum>
            ))}
          </div>
        )}

        {/* Boyut lejantı */}
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4 text-[11px] text-slate-faint">
          <span className="font-medium uppercase tracking-wide">Küme boyutu:</span>
          {(["buyuk", "orta", "kucuk", "tekil"] as Kume["boyut"][]).map((b) => {
            const t = BOYUT_TANIM[b];
            return (
              <span key={b} className="inline-flex items-center gap-1.5 text-slate-muted">
                <span className="size-2.5 rounded-full" style={{ background: t.hex }} />
                {t.etiket}
              </span>
            );
          })}
          <span className="ml-auto inline-flex items-center gap-1.5 font-medium text-red-700">
            <Network className="size-3.5" />
            3+ IP = botnet
          </span>
        </div>
      </Panel>
    </Bolum>
  );
}
