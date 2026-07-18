"use client";

/**
 * Canlı Saldırı Haritası — istemci (SOC "harekat odası").
 * ========================================================
 * - Kütüphanesiz, tamamen çevrimdışı: dünya GERÇEK KITA SINIRLARI olan bir
 *   inline vektör harita (equirectangular) olarak çizilir — Kuzey/Güney
 *   Amerika, Avrupa, Afrika, Asya, Okyanusya tanınabilir (dunya-harita.ts).
 * - Ülke işaretçileri lat/lon → x/y eşdikdörtgen projeksiyonla, tam olarak
 *   haritanın çizildiği aynı kurala göre yerleştirilir (kıtalara oturur).
 * - Saldırı yayları kaynak ülkelerden merkeze (sunucularımız) doğru animasyonlu.
 * - Canlı yan panel /api/live'ı 3sn'de bir yoklar (KomutaSeridi deseni).
 * - prefers-reduced-motion tüm nabız/yay animasyonlarını kapatır.
 * - Yatay scroll YOK: SVG viewBox + w-full + preserveAspectRatio="xMidYMid meet".
 */

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Globe2, Ban, Activity, Radio, Pause, Play, ShieldAlert, Crosshair,
  MapPin, Bot,
} from "lucide-react";
import { Panel, StatKart, useToast } from "@/components/panel/kit";
import { bayrak, ULKE_AD } from "@/lib/flag";
import { ULKE_KOORDINAT, projeksiyon } from "@/lib/specter/ulke-koordinat";
import { HARITA_W, HARITA_H, KITA_PATHLERI, gridCizgileri } from "@/lib/specter/dunya-harita";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { haritaCeviri } from "./harita.i18n";

/** Yerel çeviri fonksiyonu tipi (t) — alt bileşenlere geçirilir. */
type Ceviri = (anahtar: string) => string;

/** BCP-47 yerel kodu (Intl sayı biçimlendirme için). */
const YEREL: Record<Dil, string> = { tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES" };

/* --------------------------------------------------------------- tipler */
export interface UlkeVeri {
  country: string;
  toplam: number;
  blocked: number;
  challenged: number;
  dominantBotClass: string;
  tehditOran: number;
}
interface CanliOlay {
  id: string;
  ts: number;
  ip: string;
  country: string;
  botClass: string;
  verdict: string;
  path?: string;
}
interface Props {
  dil: Dil;
  ulkeler: UlkeVeri[];
  toplamOlay: number;
  toplamBlocked: number;
  toplamUlke: number;
  enAktifUlke: { country: string; toplam: number } | null;
}

/** Bot sınıfı enum → çeviri (yerel BOT_ETIKET yerine). Bilinmezse ham değer. */
function botEtiket(sinif: string, t: Ceviri): string {
  const c = t(`bot.${sinif}`);
  return c === `bot.${sinif}` ? sinif : c;
}
/** Verdict enum → çeviri. Bilinmezse ham değer. */
function verdictEtiket(verdict: string, t: Ceviri): string {
  const c = t(`verdict.${verdict}`);
  return c === `verdict.${verdict}` ? verdict : c;
}

/* Harita viewBox boyutları — gerçek kıta haritasıyla aynı (eşdikdörtgen 2:1). */
const W = HARITA_W;
const H = HARITA_H;

/* Merkez (sunucularımız) — yayların hedefi. Frankfurt/orta-Avrupa yaklaşık. */
const MERKEZ = projeksiyon(50, 10, W, H);

/* --------------------------------------------------------------- tehdit rengi */
/**
 * Ülkenin baskın tehdidine göre renk + seviye ANAHTARI: çoğu engelli=kırmızı,
 * karışık=amber, temiz=mavi. `seviye` bir anahtardır (çeviri çağrı yerinde yapılır).
 */
function tehditRenk(u: UlkeVeri): { r: string; seviye: "yuksek" | "orta" | "dusuk" } {
  if (u.tehditOran >= 0.55) return { r: "#f43f5e", seviye: "yuksek" };
  if (u.tehditOran >= 0.2) return { r: "#f59e0b", seviye: "orta" };
  return { r: "#38bdf8", seviye: "dusuk" };
}

function ulkeAd(kod: string): string {
  return ULKE_AD[kod] ?? kod;
}

/* =============================================================== bileşen */
export function HaritaIstemci({
  dil, ulkeler, toplamOlay, toplamBlocked, toplamUlke, enAktifUlke,
}: Props) {
  const { goster } = useToast();
  const t: Ceviri = (anahtar) => haritaCeviri(anahtar, dil);
  const yerel = YEREL[dil];

  // Koordinatı bilinen ülkeler (harita üzerine çizilebilenler).
  const isaretler = useMemo(
    () =>
      ulkeler
        .filter((u) => ULKE_KOORDINAT[u.country])
        .map((u) => {
          const [lat, lon] = ULKE_KOORDINAT[u.country];
          const { x, y } = projeksiyon(lat, lon, W, H);
          return { ...u, x, y };
        }),
    [ulkeler],
  );

  const enBuyuk = isaretler.length ? Math.max(...isaretler.map((i) => i.toplam)) : 1;
  const yaricap = (t: number) => 4 + Math.sqrt(t / enBuyuk) * 12;

  // En yoğun 6 kaynak → saldırı yayları çizilir.
  const yaylar = useMemo(
    () => isaretler.filter((i) => i.tehditOran >= 0.2).slice(0, 6),
    [isaretler],
  );

  const [seciliKod, setSeciliKod] = useState<string | null>(null);
  const secili = isaretler.find((i) => i.country === seciliKod) ?? null;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* başlık şeridi */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Globe2 className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("serit.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">{t("serit.aciklama")}</p>
        </div>
      </div>

      {/* özet kartlar */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={toplamUlke} etiket={t("ozet.kaynakUlke")} ikon={<Globe2 className="size-5" />} />
        <StatKart
          sayi={enAktifUlke ? `${bayrak(enAktifUlke.country)} ${ulkeAd(enAktifUlke.country)}` : "—"}
          etiket={t("ozet.enAktif")}
          ikon={<MapPin className="size-5" />}
        />
        <StatKart sayi={toplamBlocked.toLocaleString(yerel)} etiket={t("ozet.engellenen")} tone="danger" ikon={<Ban className="size-5" />} />
        <CanliHizKart t={t} />
      </div>

      {/* harita + canlı akış */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <DunyaHarita
          isaretler={isaretler}
          yaylar={yaylar}
          yaricap={yaricap}
          secili={secili}
          seciliKod={seciliKod}
          setSeciliKod={setSeciliKod}
          t={t}
          yerel={yerel}
        />
        <CanliAkis goster={goster} t={t} yerel={yerel} />
      </div>

      {/* lider tablosu */}
      <Panel
        baslik={t("lider.baslik")}
        sagUst={
          <span className="text-[12px] text-slate-faint">
            {t("lider.ozet").replace("{olay}", toplamOlay.toLocaleString(yerel)).replace("{ulke}", String(toplamUlke))}
          </span>
        }
      >
        {ulkeler.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-muted">{t("lider.bosDurum")}</p>
        ) : (
          <div className="space-y-1.5">
            {ulkeler.slice(0, 12).map((u, i) => {
              const tr = tehditRenk(u);
              const oran = Math.round(u.tehditOran * 100);
              const aktif = u.country === seciliKod;
              return (
                <button
                  key={u.country}
                  onMouseEnter={() => ULKE_KOORDINAT[u.country] && setSeciliKod(u.country)}
                  onMouseLeave={() => setSeciliKod(null)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
                    aktif ? "border-brand-300 bg-brand-50/60" : "border-line hover:border-line-strong hover:bg-canvas/50",
                  )}
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-canvas text-[12px] font-bold text-slate-muted">{i + 1}</span>
                  <span className="text-[16px] leading-none">{bayrak(u.country)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[13.5px] font-semibold text-slate-ink">{ulkeAd(u.country)}</span>
                      <span className="text-[11px] font-medium text-slate-faint">{u.country}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-canvas">
                      <div className="h-full rounded-full transition-all" style={{ width: `${oran}%`, background: tr.r }} />
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="num text-[14px] font-bold text-slate-ink">{u.toplam.toLocaleString(yerel)}</div>
                    <div className="text-[11px] text-danger2">{t("lider.engel").replace("{n}", u.blocked.toLocaleString(yerel))}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}

/* =============================================================== DünyaHarita */
function DunyaHarita({
  isaretler, yaylar, yaricap, secili, seciliKod, setSeciliKod, t, yerel,
}: {
  isaretler: (UlkeVeri & { x: number; y: number })[];
  yaylar: (UlkeVeri & { x: number; y: number })[];
  yaricap: (t: number) => number;
  secili: (UlkeVeri & { x: number; y: number }) | null;
  seciliKod: string | null;
  setSeciliKod: (k: string | null) => void;
  t: Ceviri;
  yerel: string;
}) {
  const grid = gridCizgileri();

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#070d18] shadow-lift">
      {/* üst şerit */}
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-5 py-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-70 motion-reduce:hidden" />
            <span className="relative inline-flex size-2.5 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[14px] font-semibold text-white">{t("harita.baslik")}</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-white/50">
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: "#f43f5e" }} /> {t("tehdit.yuksek")}</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: "#f59e0b" }} /> {t("tehdit.orta")}</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: "#38bdf8" }} /> {t("tehdit.dusuk")}</span>
        </div>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block w-full"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={t("harita.aria")}
        >
          <defs>
            <radialGradient id="harita-glow" cx="50%" cy="42%" r="62%">
              <stop offset="0%" stopColor="#132a4a" stopOpacity="0.65" />
              <stop offset="55%" stopColor="#0b1830" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#070d18" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="harita-kita" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#24405f" />
              <stop offset="100%" stopColor="#1a2f47" />
            </linearGradient>
            <filter id="harita-blur"><feGaussianBlur stdDeviation="3" /></filter>
            <filter id="harita-kita-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="1.4" floodColor="#3b82f6" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* taban + arka ışıma */}
          <rect x="0" y="0" width={W} height={H} fill="#070d18" />
          <rect x="0" y="0" width={W} height={H} fill="url(#harita-glow)" />

          {/* enlem/boylam ızgarası (zarif) */}
          <g stroke="#1b2c46" strokeWidth={0.6}>
            {grid.yatay.map((y, i) => (
              <line key={`gy-${i}`} x1={0} y1={y} x2={W} y2={y} strokeOpacity={0.55} />
            ))}
            {grid.dikey.map((x, i) => (
              <line key={`gx-${i}`} x1={x} y1={0} x2={x} y2={H} strokeOpacity={0.55} />
            ))}
          </g>

          {/* GERÇEK kıta silüetleri (tanınabilir dünya haritası) */}
          <g
            fill="url(#harita-kita)"
            stroke="#3f6595"
            strokeWidth={0.8}
            strokeLinejoin="round"
            filter="url(#harita-kita-glow)"
          >
            {KITA_PATHLERI.map((k) => (
              <path key={k.ad} d={k.d} />
            ))}
          </g>

          {/* saldırı yayları (kaynak → merkez) */}
          <g fill="none" strokeLinecap="round">
            {yaylar.map((y) => {
              const renk = tehditRenk(y).r;
              const d = yayYolu(y.x, y.y, MERKEZ.x, MERKEZ.y);
              return (
                <g key={`yay-${y.country}`}>
                  <path d={d} stroke={renk} strokeOpacity={0.3} strokeWidth={1.4} />
                  <path
                    d={d}
                    stroke={renk}
                    strokeWidth={2.6}
                    strokeDasharray="5 120"
                    className="harita-yay motion-reduce:[stroke-dasharray:none] motion-reduce:[stroke-opacity:0.55]"
                  />
                </g>
              );
            })}
          </g>

          {/* merkez (sunucularımız) */}
          <g>
            <circle cx={MERKEZ.x} cy={MERKEZ.y} r={10} fill="#34d399" fillOpacity={0.18} filter="url(#harita-blur)" />
            <circle cx={MERKEZ.x} cy={MERKEZ.y} r={4} fill="#34d399" />
            <circle cx={MERKEZ.x} cy={MERKEZ.y} r={4} fill="none" stroke="#34d399" strokeWidth={1.6} className="harita-merkez-nabiz motion-reduce:hidden" />
          </g>

          {/* ülke işaretçileri */}
          <g>
            {isaretler.map((u) => {
              const tr = tehditRenk(u);
              const r = yaricap(u.toplam);
              const aktif = u.country === seciliKod;
              return (
                <g
                  key={u.country}
                  className="cursor-pointer"
                  onMouseEnter={() => setSeciliKod(u.country)}
                  onMouseLeave={() => setSeciliKod(null)}
                >
                  {/* yumuşak hale */}
                  <circle cx={u.x} cy={u.y} r={r} fill={tr.r} fillOpacity={0.16} />
                  {/* nabız halkası */}
                  <circle
                    cx={u.x} cy={u.y} r={r}
                    fill="none" stroke={tr.r} strokeWidth={1.2}
                    style={{ transformOrigin: `${u.x}px ${u.y}px` }}
                    className="harita-isaret-nabiz motion-reduce:hidden"
                  />
                  {/* çekirdek */}
                  <circle cx={u.x} cy={u.y} r={aktif ? 5 : 3.8} fill={tr.r} stroke="#070d18" strokeWidth={aktif ? 1.8 : 1} />
                </g>
              );
            })}
          </g>
        </svg>

        {/* tooltip (SVG dışında, mutlak konum) */}
        {secili && (
          <div
            className="pointer-events-none absolute z-10 w-52 -translate-x-1/2 rounded-xl border border-white/10 bg-[#0f1a2e]/95 p-3 text-white shadow-lift backdrop-blur"
            style={{
              left: `${(secili.x / W) * 100}%`,
              top: `${(secili.y / H) * 100}%`,
              transform: `translate(-50%, calc(-100% - 12px))`,
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-[15px] leading-none">{bayrak(secili.country)}</span>
              <span className="text-[13px] font-semibold">{ulkeAd(secili.country)}</span>
              <span className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: tehditRenk(secili).r + "22", color: tehditRenk(secili).r }}>
                {t(`tehdit.${tehditRenk(secili).seviye}`)}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-y-1 text-[11.5px]">
              <span className="text-white/50">{t("ipucu.toplam")}</span>
              <span className="num text-right font-semibold">{secili.toplam.toLocaleString(yerel)}</span>
              <span className="text-white/50">{t("ipucu.engellenen")}</span>
              <span className="num text-right font-semibold text-rose-400">{secili.blocked.toLocaleString(yerel)}</span>
              <span className="text-white/50">{t("ipucu.baskinSinif")}</span>
              <span className="text-right font-medium">{botEtiket(secili.dominantBotClass, t)}</span>
            </div>
          </div>
        )}
      </div>

      {/* alt bilgi */}
      <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.02] px-5 py-2.5 text-[11px] text-white/40">
        <span className="flex items-center gap-1.5"><Crosshair className="size-3.5" /> {t("harita.kaynakHaritalandi").replace("{n}", String(isaretler.length))}</span>
        <span className="flex items-center gap-1.5"><ShieldAlert className="size-3.5 text-emerald-400" /> {t("harita.altyapi")}</span>
      </div>

      {/* animasyon stilleri (CSS — reduced-motion ile kapanır) */}
      <style>{`
        @keyframes haritaYayAk { to { stroke-dashoffset: -125; } }
        .harita-yay { animation: haritaYayAk 1.8s linear infinite; }
        @keyframes haritaNabiz {
          0% { r: 4; opacity: 0.85; }
          100% { r: 22; opacity: 0; }
        }
        .harita-isaret-nabiz { animation: haritaNabiz 2.6s ease-out infinite; }
        @keyframes haritaMerkezNabiz {
          0% { r: 4; opacity: 0.9; }
          100% { r: 20; opacity: 0; }
        }
        .harita-merkez-nabiz { animation: haritaMerkezNabiz 1.8s ease-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .harita-yay, .harita-isaret-nabiz, .harita-merkez-nabiz { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

/** Kaynak → hedef için yumuşak bir kavis (quadratic bezier) çizer. */
function yayYolu(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const uzunluk = Math.sqrt(dx * dx + dy * dy) || 1;
  // Kavisi yol uzunluğuyla orantılı yukarı it (dik açıya dik yön).
  const kavis = Math.min(70, uzunluk * 0.28);
  const cx = mx + (-dy / uzunluk) * kavis;
  const cy = my + (dx / uzunluk) * kavis;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

/* =============================================================== CanlıAkış */
function CanliAkis({ goster, t, yerel }: { goster: (t: { tip: "basari" | "hata" | "bilgi"; baslik: string }) => void; t: Ceviri; yerel: string }) {
  const [olaylar, setOlaylar] = useState<CanliOlay[]>([]);
  const [canli, setCanli] = useState(true);
  const [sayac, setSayac] = useState(0);
  const [hiz, setHiz] = useState(0);
  const sinceRef = useRef(Date.now() - 60000);

  useEffect(() => {
    if (!canli) return;
    let iptal = false;

    async function cek() {
      try {
        const r = await fetch(`/api/live?since=${sinceRef.current}`);
        if (!r.ok) return;
        const d = await r.json();
        const yeni: CanliOlay[] = d.events || [];
        if (iptal || yeni.length === 0) {
          if (!iptal) setHiz(0);
          return;
        }
        sinceRef.current = Math.max(...yeni.map((e) => e.ts));
        setSayac((s) => s + yeni.length);
        setHiz(Math.round(yeni.length / 3));
        setOlaylar((p) => [...yeni.slice().reverse(), ...p].slice(0, 40));
      } catch {
        /* sessiz */
      }
    }

    cek();
    const timer = setInterval(cek, 3000);
    return () => {
      iptal = true;
      clearInterval(timer);
    };
  }, [canli]);

  return (
    <Panel padding={false} className="flex flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="relative flex size-2.5">
            {canli && <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-70 motion-reduce:hidden" />}
            <span className={cn("relative inline-flex size-2.5 rounded-full", canli ? "bg-emerald-400" : "bg-slate-400")} />
          </span>
          <span className="text-[14px] font-semibold text-slate-ink">{t("canli.baslik")}</span>
          <span className="rounded-full bg-canvas px-2 py-0.5 text-[10px] font-medium text-slate-muted">{canli ? t("canli.canli") : t("canli.duraklatildi")}</span>
        </div>
        <button
          onClick={() => setCanli((v) => !v)}
          className="flex items-center gap-1.5 rounded-full bg-canvas px-3 py-1.5 text-[12px] font-medium text-slate-muted transition hover:text-slate-ink"
        >
          {canli ? <><Pause className="size-3.5" /> {t("canli.duraklat")}</> : <><Play className="size-3.5" /> {t("canli.devam")}</>}
        </button>
      </div>

      {/* oturum sayaçları */}
      <div className="grid grid-cols-2 gap-px bg-line">
        <div className="bg-surface px-5 py-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-faint"><Radio className="size-3.5" /> {t("canli.buOturum")}</div>
          <div className="num mt-0.5 text-[22px] font-bold leading-none text-slate-ink tabular-nums">{sayac.toLocaleString(yerel)}</div>
        </div>
        <div className="bg-surface px-5 py-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-faint"><Activity className="size-3.5" /> {t("canli.olayHizi")}</div>
          <div className="num mt-0.5 text-[22px] font-bold leading-none text-slate-ink tabular-nums">{hiz}<span className="ml-1 text-[12px] font-normal text-slate-faint">{t("canli.snKisa")}</span></div>
        </div>
      </div>

      {/* akış listesi */}
      <div className="max-h-[420px] flex-1 divide-y divide-line overflow-y-auto">
        {olaylar.length === 0 && (
          <p className="px-5 py-10 text-center text-[13px] text-slate-muted">{t("canli.bekleniyor")}</p>
        )}
        {olaylar.map((e) => {
          const bot = e.verdict === "blocked" || e.verdict === "challenged";
          return (
            <div key={e.id} className="flex items-center gap-3 px-5 py-2.5 animate-fade-up">
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-lg",
                  e.verdict === "blocked" ? "bg-danger-soft text-danger2" : e.verdict === "allowed" ? "bg-ok-soft text-ok" : "bg-warn-soft text-warn",
                )}
              >
                {bot ? <Bot className="size-3.5" /> : <ShieldAlert className="size-3.5" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[12.5px]">
                  <span className="leading-none">{bayrak(e.country)}</span>
                  <span className="num truncate font-medium text-slate-ink">{e.ip}</span>
                </div>
                <div className="truncate text-[11px] text-slate-faint">{botEtiket(e.botClass, t)}</div>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  e.verdict === "blocked" ? "bg-danger-soft text-red-700" : e.verdict === "allowed" ? "bg-ok-soft text-green-700" : "bg-warn-soft text-amber-700",
                )}
              >
                {verdictEtiket(e.verdict, t)}
              </span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

/* =============================================================== CanlıHızKart
 * Özet kartında canlı olay hızını gösterir (kendi hafif yoklaması). */
function CanliHizKart({ t }: { t: Ceviri }) {
  const [hiz, setHiz] = useState(0);
  const sinceRef = useRef(Date.now() - 10000);
  useEffect(() => {
    let iptal = false;
    async function cek() {
      try {
        const r = await fetch(`/api/live?since=${sinceRef.current}`);
        if (!r.ok) return;
        const d = await r.json();
        const yeni: { ts: number }[] = d.events || [];
        if (iptal) return;
        if (yeni.length) {
          sinceRef.current = Math.max(...yeni.map((e) => e.ts));
          setHiz(Math.round(yeni.length / 3));
        } else {
          setHiz(0);
        }
      } catch {
        /* sessiz */
      }
    }
    cek();
    const t = setInterval(cek, 3000);
    return () => {
      iptal = true;
      clearInterval(t);
    };
  }, []);
  return <StatKart sayi={`${hiz}${t("canli.snKisa")}`} etiket={t("ozet.canliHiz")} tone="ok" ikon={<Activity className="size-5" />} />;
}
