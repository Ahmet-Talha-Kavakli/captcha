"use client";

/**
 * Coğrafi Tehdit Isı Haritası — istemci (tehdit-istihbaratı konsolu).
 * ===================================================================
 * - Kütüphanesiz, tamamen çevrimdışı: dünya GERÇEK KITA SILÜETLERIYLE çizilir
 *   (paylaşılan @/lib/specter/dunya-harita → KITA_PATHLERI). Kıtalar tanınır:
 *   Amerika, Avrupa, Afrika, Asya, Okyanusya. Üstüne her aktif ülke, gerçek
 *   lat/lon konumuna (equirectangular projeksiyon) yerleştirilen bir "ısı
 *   noktası + glow" olarak çizilir → gerçek dünya ısı haritası görünümü.
 * - Renk gradyanı yoğunluk puanına göre: düşük=yeşil → orta=sarı/turuncu →
 *   kritik=kırmızı (üstteki "Düşük → Kritik" lejandı bunu yansıtır).
 * - Ülke tıklanınca sağda drill-down açılır: top ASN'ler, bot sınıfı kırılımı
 *   (SinifDagilimListesi ikonlarıyla), engelleme oranı + "kural oluştur" CTA.
 * - Zaman kaydırıcısı zaman dilimleri arasında gezinir; her adımda harita o
 *   döneme göre yeniden tonlanır (oynat/duraklat; prefers-reduced-motion'a saygı).
 * - Sıralı ülke tablosu + bölgesel özet.
 * Dürüstlük: Gösterilen yalnızca BİZİM gözlemlediğimiz trafiktir, küresel
 * gerçeği değil.
 */

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Thermometer, Globe2, Ban, Flame, MapPin, Play, Pause, ShieldPlus,
  Server, Bot, Layers, ChevronRight, Clock, Activity, X,
} from "lucide-react";
import { Panel, StatKart, Badge } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { DonutDagilim } from "@/components/panel/grafikler";
import { IsiMatris } from "@/components/panel/grafikler-ek";
import { SinifDagilimListesi, type DagilimSatir } from "@/components/panel/SinifDagilimListesi";
import { bayrak, ULKE_AD } from "@/lib/flag";
import { ULKE_KOORDINAT, projeksiyon } from "@/lib/specter/ulke-koordinat";
import {
  KITA_PATHLERI, gridCizgileri, HARITA_W, HARITA_H,
} from "@/lib/specter/dunya-harita";
import {
  isiRengi, ISI_KADEMELERI,
  type UlkeYogunluk, type BolgeYogunluk, type GeoIsiOzet, type ZamanDilimSonuc,
} from "@/lib/specter/geo-isi";
import type { Dil } from "@/lib/i18n/panel";
import { geoIsiCeviri, YEREL_BCP47 } from "./geo-isi.i18n";
import { cn } from "@/lib/cn";

/* --------------------------------------------------------------- tipler */
interface Props {
  ulkeler: UlkeYogunluk[];
  bolgeler: BolgeYogunluk[];
  ozet: GeoIsiOzet;
  zaman: ZamanDilimSonuc;
  dil: Dil;
}

/** t() yardımcısı — bu sayfaya özgü çeviri. */
type Ceviri = (anahtar: string) => string;

function ulkeAd(kod: string): string {
  return ULKE_AD[kod] ?? kod;
}
function yuzde(x: number): string {
  return `%${Math.round(x * 100)}`;
}

/**
 * Yoğunluk puanı → kademe anahtarı (lib'deki isiEtiket TR üretir; burada
 * eşik mantığını yeniden türetip çeviriye map ederiz — lib DEĞİŞTİRİLMEZ).
 */
function kademeAnahtar(puan: number): string {
  const p = Math.max(0, Math.min(100, puan));
  if (p >= 80) return "kademe.kritik";
  if (p >= 60) return "kademe.yuksek";
  if (p >= 40) return "kademe.orta";
  if (p >= 20) return "kademe.dusuk";
  return "kademe.asgari";
}
/** Kademe etiketi (çevrilmiş). */
function kademeEtiket(puan: number, t: Ceviri): string {
  return t(kademeAnahtar(puan));
}
/** Bot sınıfı kodu → çevrilmiş etiket (bulunamazsa kodu döndürür). */
function botEtiket(kod: string, t: Ceviri): string {
  const c = t(`bot.${kod}`);
  return c === `bot.${kod}` ? kod : c;
}

/* Harita viewBox — paylaşılan dünya haritası ölçeği (equirectangular 2:1). */
const W = HARITA_W; // 1000
const H = HARITA_H; // 500

/* =============================================================== bileşen */
export function GeoIsiIstemci({ ulkeler, bolgeler, ozet, zaman, dil }: Props) {
  const t: Ceviri = (k) => geoIsiCeviri(k, dil);
  const yerel = YEREL_BCP47[dil];
  const azHareket = useReducedMotion() ?? false;

  // Zaman kaydırıcısı: son dilim = "şimdi" (canlı toplam). "canli" modunda
  // tüm-pencere yoğunluğu (props.ulkeler) gösterilir; kaydırınca o dilim.
  const dilimSayisi = zaman.dilimler.length;
  const [dilimIdx, setDilimIdx] = useState<number>(dilimSayisi); // == dilimSayisi → "canlı/tümü"
  const canliMod = dilimIdx >= dilimSayisi;

  // O anki gösterilecek ülke yoğunlukları (tüm-pencere veya seçili dilim).
  const aktifUlkeler = canliMod
    ? ulkeler
    : zaman.dilimler[dilimIdx]?.ulkeler ?? [];

  // Seçili ülke (drill-down). Tüm-pencere verisinden çekilir (drill-down
  // dilimden bağımsız tam geçmişi gösterir).
  const [seciliKod, setSeciliKod] = useState<string | null>(null);
  const [hoverKod, setHoverKod] = useState<string | null>(null);
  const secili = useMemo(
    () => ulkeler.find((u) => u.ulke === seciliKod) ?? null,
    [ulkeler, seciliKod],
  );

  // Harita üzerine çizilecek işaretler (koordinatı bilinen + o dönemde aktif).
  const isaretler = useMemo(
    () =>
      aktifUlkeler
        .filter((u) => ULKE_KOORDINAT[u.ulke])
        .map((u) => {
          const [lat, lon] = ULKE_KOORDINAT[u.ulke];
          return { ...u, ...projeksiyon(lat, lon, W, H) };
        }),
    [aktifUlkeler],
  );
  const enBuyuk = isaretler.length ? Math.max(...isaretler.map((i) => i.toplam)) : 1;
  // Hücre yarıçapı: hacim (log) + yoğunluk karışımı → hem çok trafik hem yüksek
  // tehdit büyük görünür. (viewBox 1000×500 olduğundan ölçek büyütüldü.)
  const yaricap = useCallback(
    (u: UlkeYogunluk) => {
      const hacim = Math.sqrt(u.toplam / enBuyuk); // 0..1
      const yog = u.yogunlukPuan / 100; // 0..1
      return 9 + (hacim * 0.6 + yog * 0.4) * 26;
    },
    [enBuyuk],
  );

  const hoverU = hoverKod ? isaretler.find((i) => i.ulke === hoverKod) ?? null : null;

  const gecis = azHareket
    ? { duration: 0 }
    : { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const };
  const gir = (gecikme = 0) => ({
    initial: azHareket ? false : { y: 12 },
    animate: { y: 0 },
    transition: { ...gecis, delay: azHareket ? 0 : gecikme },
  });

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* başlık şeridi */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Thermometer className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">
            {t("serit.baslik")}
          </p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {t("serit.aciklama.1")}
            <b> {t("serit.aciklama.yogunlukPuan")}</b> {t("serit.aciklama.2")}{" "}
            <b>{t("serit.aciklama.gozlemlenen")}</b>{t("serit.aciklama.3")}
          </p>
        </div>
      </div>

      {/* özet kartlar */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={ozet.ulkeSayisi} etiket={t("ozet.trafikKaynagi")} ikon={<Globe2 className="size-5" />} />
        <StatKart
          sayi={ozet.enYogunUlke ? `${bayrak(ozet.enYogunUlke.ulke)} ${ulkeAd(ozet.enYogunUlke.ulke)}` : "—"}
          etiket={t("ozet.enYogunUlke")}
          ikon={<Flame className="size-5" />}
          tone="danger"
        />
        <StatKart sayi={ozet.kritikUlkeSayisi} etiket={t("ozet.kritikKademe")} tone="danger" ikon={<Ban className="size-5" />} />
        <StatKart sayi={yuzde(ozet.botOran)} etiket={t("ozet.genelBot")} tone="warn" ikon={<Bot className="size-5" />} />
      </div>

      {/* harita + drill-down */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <motion.div className="space-y-4" {...gir(0.02)}>
          <IsiHarita
            isaretler={isaretler}
            yaricap={yaricap}
            seciliKod={seciliKod}
            hoverKod={hoverKod}
            hoverU={hoverU}
            setSeciliKod={setSeciliKod}
            setHoverKod={setHoverKod}
            azHareket={azHareket}
            t={t}
            yerel={yerel}
          />
          <ZamanKaydirici
            zaman={zaman}
            dilimIdx={dilimIdx}
            setDilimIdx={setDilimIdx}
            canliMod={canliMod}
            azHareket={azHareket}
            t={t}
          />
        </motion.div>

        <motion.div {...gir(0.06)}>
          <UlkeDrilldown secili={secili} onKapat={() => setSeciliKod(null)} azHareket={azHareket} t={t} yerel={yerel} />
        </motion.div>
      </div>

      {/* gün×dilim risk ısı-matrisi + ASN kategori dağılımı — FARKLI görsel dil */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <motion.div {...gir(0.08)}>
          <DilimIsiMatris zaman={zaman} t={t} />
        </motion.div>
        <motion.div {...gir(0.1)}>
          <AsnKategoriDagilim ulkeler={aktifUlkeler} t={t} />
        </motion.div>
      </div>

      {/* sıralı ülke listesi + bölgesel özet (donut) */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <UlkeSiralama
          ulkeler={aktifUlkeler}
          seciliKod={seciliKod}
          setSeciliKod={setSeciliKod}
          setHoverKod={setHoverKod}
          canliMod={canliMod}
          t={t}
          yerel={yerel}
        />
        <BolgeOzet bolgeler={bolgeler} t={t} yerel={yerel} />
      </div>

      {/* dürüstlük notu */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-canvas/40 px-5 py-4 text-[13px] text-slate-muted">
        <Globe2 className="mt-0.5 size-4 shrink-0 text-slate-faint" />
        <span>
          {t("not.1")} <b>{t("not.kuresel")}</b> {t("not.2")} <b>{t("not.goreli")}</b> {t("not.3")}
        </span>
      </div>
    </div>
  );
}

/* =============================================================== IsiHarita */
function IsiHarita({
  isaretler, yaricap, seciliKod, hoverKod, hoverU,
  setSeciliKod, setHoverKod, azHareket, t, yerel,
}: {
  isaretler: (UlkeYogunluk & { x: number; y: number })[];
  yaricap: (u: UlkeYogunluk) => number;
  seciliKod: string | null;
  hoverKod: string | null;
  hoverU: (UlkeYogunluk & { x: number; y: number }) | null;
  setSeciliKod: (k: string | null) => void;
  setHoverKod: (k: string | null) => void;
  azHareket: boolean;
  t: Ceviri;
  yerel: string;
}) {
  const grid = useMemo(gridCizgileri, []);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b1220] shadow-lift">
      {/* üst şerit + efsane */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <Thermometer className="size-4 text-emerald-400" />
          <span className="text-[14px] font-semibold text-white">{t("harita.baslik")}</span>
        </div>
        <div className="flex items-center gap-2.5 text-[11px] text-white/50">
          <span className="text-white/40">{t("harita.dusuk")}</span>
          <div className="flex overflow-hidden rounded-full ring-1 ring-white/10">
            {[...ISI_KADEMELERI].reverse().map((k) => (
              // Kademe etiketi lib'de TR üretilir → puana göre yeniden türetilip çevrilir.
              <span key={k.alt} className="h-2 w-7" style={{ background: k.renk }} title={kademeEtiket(k.alt, t)} />
            ))}
          </div>
          <span className="text-white/40">{t("harita.kritik")}</span>
        </div>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block w-full"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={t("harita.ariaLabel")}
        >
          <defs>
            <radialGradient id="geoisi-arka" cx="50%" cy="42%" r="62%">
              <stop offset="0%" stopColor="#14243f" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#0b1220" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="geoisi-kita" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#20304d" />
              <stop offset="100%" stopColor="#172439" />
            </linearGradient>
            <filter id="geoisi-glow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="10" />
            </filter>
          </defs>

          {/* arka ışıma */}
          <rect x="0" y="0" width={W} height={H} fill="url(#geoisi-arka)" />

          {/* referans grid (enlem/boylam) */}
          <g stroke="#ffffff" strokeOpacity={0.05} strokeWidth={1}>
            {grid.yatay.map((y, i) => (
              <line key={`gy-${i}`} x1={0} y1={y} x2={W} y2={y} />
            ))}
            {grid.dikey.map((x, i) => (
              <line key={`gx-${i}`} x1={x} y1={0} x2={x} y2={H} />
            ))}
          </g>

          {/* gerçek kıta silüetleri */}
          <g fill="url(#geoisi-kita)" stroke="#33507a" strokeWidth={1} strokeOpacity={0.55}>
            {KITA_PATHLERI.map((k) => (
              <path key={k.ad} d={k.d} />
            ))}
          </g>

          {/* ısı hücreleri: önce yayılan glow katmanı, sonra çekirdekler */}
          <g>
            {isaretler.map((u) => {
              const renk = isiRengi(u.yogunlukPuan);
              const r = yaricap(u);
              return (
                <circle
                  key={`glow-${u.ulke}`}
                  cx={u.x} cy={u.y} r={r * 1.6}
                  fill={renk} fillOpacity={0.28} filter="url(#geoisi-glow)"
                />
              );
            })}
          </g>
          <g>
            {isaretler.map((u) => {
              const renk = isiRengi(u.yogunlukPuan);
              const r = yaricap(u);
              const aktif = u.ulke === seciliKod;
              const uzeri = u.ulke === hoverKod;
              return (
                <g
                  key={u.ulke}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoverKod(u.ulke)}
                  onMouseLeave={() => setHoverKod(null)}
                  onClick={() => setSeciliKod(u.ulke === seciliKod ? null : u.ulke)}
                  role="button"
                  aria-label={`${ulkeAd(u.ulke)} — ${t("drill.yogunluk").replace("{n}", String(u.yogunlukPuan))}`}
                >
                  {/* dış halka */}
                  <circle cx={u.x} cy={u.y} r={r} fill={renk} fillOpacity={0.32} />
                  {/* çekirdek */}
                  <circle
                    cx={u.x} cy={u.y}
                    r={Math.max(4, r * 0.4)}
                    fill={renk}
                    stroke={aktif || uzeri ? "#fff" : "#0b1220"}
                    strokeWidth={aktif ? 2.4 : uzeri ? 1.6 : 0.9}
                  />
                  {/* seçili nabız halkası (reduced-motion ile kapanır) */}
                  {aktif && !azHareket && (
                    <circle
                      cx={u.x} cy={u.y} r={r}
                      fill="none" stroke={renk} strokeWidth={2}
                      style={{ transformOrigin: `${u.x}px ${u.y}px` }}
                      className="geoisi-nabiz motion-reduce:hidden"
                    />
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* tooltip */}
        {hoverU && (
          <div
            className="pointer-events-none absolute z-10 w-56 -translate-x-1/2 rounded-xl border border-white/10 bg-[#0f1a2e]/95 p-3 text-white shadow-lift backdrop-blur"
            style={{
              left: `${(hoverU.x / W) * 100}%`,
              top: `${(hoverU.y / H) * 100}%`,
              transform: "translate(-50%, calc(-100% - 14px))",
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-[15px] leading-none">{bayrak(hoverU.ulke)}</span>
              <span className="text-[13px] font-semibold">{ulkeAd(hoverU.ulke)}</span>
              <span
                className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ background: isiRengi(hoverU.yogunlukPuan) + "26", color: isiRengi(hoverU.yogunlukPuan) }}
              >
                {kademeEtiket(hoverU.yogunlukPuan, t)} · {hoverU.yogunlukPuan}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-y-1 text-[11.5px]">
              <span className="text-white/50">{t("metrik.toplam")}</span>
              <span className="num text-right font-semibold">{hoverU.toplam.toLocaleString(yerel)}</span>
              <span className="text-white/50">{t("metrik.botOrani")}</span>
              <span className="num text-right font-semibold text-amber-300">{yuzde(hoverU.botOran)}</span>
              <span className="text-white/50">{t("metrik.engellenen")}</span>
              <span className="num text-right font-semibold text-rose-400">{hoverU.engellenen.toLocaleString(yerel)}</span>
              <span className="text-white/50">{t("metrik.baskinTehdit")}</span>
              <span className="text-right font-medium">
                {hoverU.dominantBotClass ? botEtiket(hoverU.dominantBotClass, t) : "—"}
              </span>
            </div>
            <div className="mt-2 border-t border-white/10 pt-1.5 text-[10.5px] text-white/40">{t("harita.detayIcinTikla")}</div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-white/10 px-5 py-2.5 text-[11px] text-white/40">
        <span className="flex items-center gap-1.5"><MapPin className="size-3.5" /> {t("harita.ulkeHaritalandi").replace("{n}", String(isaretler.length))}</span>
        <span className="flex items-center gap-1.5"><Flame className="size-3.5 text-orange-400" /> {t("harita.hucreBoyutu")}</span>
      </div>

      <style>{`
        @keyframes geoisiNabiz { 0% { opacity: 0.85; transform: scale(0.7); } 100% { opacity: 0; transform: scale(1.5); } }
        .geoisi-nabiz { animation: geoisiNabiz 2.2s ease-out infinite; }
        @media (prefers-reduced-motion: reduce) { .geoisi-nabiz { animation: none !important; } }
      `}</style>
    </div>
  );
}

/* =============================================================== ZamanKaydirici */
function ZamanKaydirici({
  zaman, dilimIdx, setDilimIdx, canliMod, azHareket, t,
}: {
  zaman: ZamanDilimSonuc;
  dilimIdx: number;
  setDilimIdx: (i: number) => void;
  canliMod: boolean;
  azHareket: boolean;
  t: Ceviri;
}) {
  const n = zaman.dilimler.length;
  const [oynuyor, setOynuyor] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Interval içindeki en güncel dilim indeksine erişmek için ref (setter
  // sade sayı alıyor, fonksiyon-updater değil).
  const idxRef = useRef(dilimIdx);
  useEffect(() => { idxRef.current = dilimIdx; }, [dilimIdx]);

  useEffect(() => {
    if (!oynuyor) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    // Oynatma en eski dilimden ilerler; "canlı"ya (n) ulaşınca durur.
    timerRef.current = setInterval(() => {
      const prev = idxRef.current;
      setDilimIdx(prev >= n ? 0 : prev + 1);
    }, 1100);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // setDilimIdx stabil (parent useState setter); n sabit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oynuyor, n]);

  // "canlı"ya ulaşınca oynatmayı durdur.
  useEffect(() => {
    if (oynuyor && dilimIdx >= n) setOynuyor(false);
  }, [dilimIdx, n, oynuyor]);

  const dilim = canliMod ? null : zaman.dilimler[dilimIdx];
  const etiket = canliMod
    ? t("zaman.tumPencere")
    : dilim
      ? `${araForm(dilim.baslangic, t)} – ${araForm(dilim.bitis, t)}`
      : "";

  function oynatToggle() {
    if (azHareket) {
      // Hareket azaltılmış: oynatma yerine bir sonraki dilime adımla.
      setDilimIdx(dilimIdx >= n ? 0 : dilimIdx + 1);
      return;
    }
    if (!oynuyor && dilimIdx >= n) setDilimIdx(0); // baştan başlat
    setOynuyor((v) => !v);
  }

  return (
    <div className="rounded-3xl border border-line bg-surface p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-brand-600" />
          <span className="text-[14px] font-semibold text-slate-ink">{t("zaman.baslik")}</span>
          <Badge ton={canliMod ? "yesil" : "mavi"}>{etiket}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={oynatToggle} aria-label={oynuyor ? t("zaman.duraklat") : t("zaman.oynat")}>
            {oynuyor ? <><Pause className="size-4" /> {t("zaman.duraklat")}</> : <><Play className="size-4" /> {t("zaman.oynat")}</>}
          </Button>
          {!canliMod && (
            <Button size="sm" variant="ghost" onClick={() => { setOynuyor(false); setDilimIdx(n); }}>
              {t("zaman.canliyaDon")}
            </Button>
          )}
        </div>
      </div>

      {/* dilim çubukları (mini spark) + slider */}
      <div className="mb-2 flex h-14 items-end gap-1">
        {zaman.dilimler.map((d, i) => {
          // Çubuk yüksekliği dilimin toplam olayına, rengi en yoğun ülkesine.
          const enB = Math.max(1, ...zaman.dilimler.map((x) => x.olaySayisi));
          const h = 8 + (d.olaySayisi / enB) * 44;
          const enYog = d.ulkeler[0]?.yogunlukPuan ?? 0;
          const secili = !canliMod && i === dilimIdx;
          return (
            <button
              key={i}
              onClick={() => { setOynuyor(false); setDilimIdx(i); }}
              className={cn(
                "group relative flex-1 rounded-t-md transition-all",
                secili ? "ring-2 ring-brand-400 ring-offset-1" : "opacity-70 hover:opacity-100",
              )}
              style={{ height: `${h}px`, background: d.olaySayisi ? isiRengi(enYog) : "#e2e8f0" }}
              title={t("zaman.dilimTitle").replace("{ara}", araForm(d.baslangic, t)).replace("{n}", String(d.olaySayisi))}
              aria-label={t("zaman.dilimAria").replace("{i}", String(i + 1)).replace("{n}", String(d.olaySayisi))}
            />
          );
        })}
      </div>

      {/* gerçek slider (0..n; n = canlı/tümü) */}
      <input
        type="range"
        min={0}
        max={n}
        step={1}
        value={dilimIdx}
        onChange={(e) => { setOynuyor(false); setDilimIdx(Number(e.target.value)); }}
        className="geoisi-slider w-full accent-brand-600"
        aria-label={t("zaman.sliderAria")}
      />
      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-faint">
        <span>{araForm(zaman.dilimler[0]?.baslangic ?? Date.now(), t)}</span>
        <span className="flex items-center gap-1"><Activity className="size-3" /> {t("zaman.pencere").replace("{gun}", String(zaman.pencereMs / 86400000)).replace("{n}", String(n))}</span>
        <span>{t("zaman.simdi")}</span>
      </div>
    </div>
  );
}

/** ms epoch → kısa "gg AY ss:00" formatı. Ay kısaltması aktif dile göre. */
function araForm(ts: number, t: Ceviri): string {
  const d = new Date(ts);
  const gun = d.getDate();
  const ay = t(`ay.${d.getMonth()}`);
  const saat = String(d.getHours()).padStart(2, "0");
  return `${gun} ${ay} ${saat}:00`;
}

/* =============================================================== UlkeDrilldown */
function UlkeDrilldown({ secili, onKapat, azHareket, t, yerel }: { secili: UlkeYogunluk | null; onKapat: () => void; azHareket: boolean; t: Ceviri; yerel: string }) {
  if (!secili) {
    return (
      <Panel className="flex min-h-[380px] flex-col items-center justify-center text-center">
        <div className="grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <MapPin className="size-6" />
        </div>
        <p className="mt-4 text-[14px] font-semibold text-slate-ink">{t("drill.ulkeSec")}</p>
        <p className="mt-1 max-w-[240px] text-[12.5px] text-slate-muted">
          {t("drill.ulkeSecAciklama")}
        </p>
      </Panel>
    );
  }

  const renk = isiRengi(secili.yogunlukPuan);
  // Top ASN'ler (azalan) ve bot sınıfı kırılımı.
  const topAsn = Object.entries(secili.asnSayac).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const asnEnB = topAsn.length ? topAsn[0][1] : 1;
  // Bot sınıfı kırılımı → SinifDagilimListesi satırları (ikon+renk üretir).
  const botSatirlar: DagilimSatir[] = Object.entries(secili.botSinifSayac)
    .sort((a, b) => b[1] - a[1])
    .map(([cls, n]) => ({ sinif: cls, etiket: botEtiket(cls, t), deger: n }));

  return (
    <Panel
      padding={false}
      className="flex flex-col overflow-hidden"
    >
      {/* başlık */}
      <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="text-[24px] leading-none">{bayrak(secili.ulke)}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-semibold text-slate-ink">{ulkeAd(secili.ulke)}</span>
              <span className="text-[11px] font-medium text-slate-faint">{secili.ulke}</span>
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                style={{ background: renk + "22", color: renk }}
              >
                {kademeEtiket(secili.yogunlukPuan, t)} · {t("drill.yogunluk").replace("{n}", String(secili.yogunlukPuan))}
              </span>
            </div>
          </div>
        </div>
        <button onClick={onKapat} className="rounded-lg p-1 text-slate-faint transition hover:bg-canvas hover:text-slate-ink" aria-label={t("ortak.kapat")}>
          <X className="size-4" />
        </button>
      </div>

      {/* metrik ızgarası */}
      <div className="grid grid-cols-3 gap-px border-b border-line bg-line">
        <MetrikHucre etiket={t("metrik.toplam")} deger={secili.toplam.toLocaleString(yerel)} />
        <MetrikHucre etiket={t("metrik.botOrani")} deger={yuzde(secili.botOran)} vurgu="warn" />
        <MetrikHucre etiket={t("metrik.engelOrani")} deger={yuzde(secili.engelOran)} vurgu="danger" />
      </div>

      <div className="space-y-5 px-5 py-4">
        {/* top ASN'ler */}
        <section>
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-faint">
            <Server className="size-3.5" /> {t("drill.enYogunAglar")}
          </div>
          {topAsn.length === 0 ? (
            <p className="text-[12.5px] text-slate-muted">{t("drill.asnYok")}</p>
          ) : (
            <div className="space-y-2">
              {topAsn.map(([asn, n]) => (
                <div key={asn} className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    {/* ASN kodu veri olarak kalır (çevrilmez) */}
                    <div className="truncate text-[12.5px] font-medium text-slate-ink">{asn}</div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-canvas">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: `${(n / asnEnB) * 100}%` }} />
                    </div>
                  </div>
                  <span className="num shrink-0 text-[12px] font-semibold text-slate-muted">{n.toLocaleString(yerel)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* bot sınıfı kırılımı — ikonlu premium liste */}
        <section>
          <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-faint">
            <Bot className="size-3.5" /> {t("drill.botKirilim")}
          </div>
          {botSatirlar.length === 0 ? (
            <p className="text-[12.5px] text-slate-muted">{t("drill.botKirilimYok")}</p>
          ) : (
            <SinifDagilimListesi satirlar={botSatirlar} azHareket={azHareket} />
          )}
        </section>

        {/* mini engelleme özeti (çubuk) */}
        <section>
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-faint">
            <Ban className="size-3.5" /> {t("drill.yanitDagilimi")}
          </div>
          <div className="flex h-3 overflow-hidden rounded-full">
            <span className="bg-danger2" style={{ width: `${secili.engelOran * 100}%` }} title={t("drill.engellenenTitle")} />
            <span className="bg-ok" style={{ width: `${(1 - secili.engelOran) * 100}%` }} title={t("drill.izinVerilenTitle")} />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-muted">
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-danger2" /> {t("drill.engellenenLabel").replace("{n}", secili.engellenen.toLocaleString(yerel))}</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-ok" /> {t("drill.izinLabel").replace("{n}", (secili.toplam - secili.engellenen).toLocaleString(yerel))}</span>
          </div>
        </section>
      </div>

      {/* CTA: geo kural oluştur */}
      <div className="mt-auto border-t border-line bg-canvas/40 px-5 py-4">
        <p className="mb-2.5 text-[12.5px] text-slate-muted">
          <b>{ulkeAd(secili.ulke)}</b> {t("drill.ctaAciklama")}
        </p>
        <Button
          size="sm"
          href={`/panel/kurallar/gelismis?field=country&op=eq&value=${secili.ulke}`}
          className="w-full"
        >
          <ShieldPlus className="size-4" /> {t("drill.ctaButon").replace("{ulke}", secili.ulke)}
        </Button>
      </div>
    </Panel>
  );
}

function MetrikHucre({ etiket, deger, vurgu }: { etiket: string; deger: string; vurgu?: "warn" | "danger" }) {
  const renk = vurgu === "danger" ? "text-danger2" : vurgu === "warn" ? "text-warn" : "text-slate-ink";
  return (
    <div className="bg-surface px-4 py-3">
      <div className={cn("num text-[20px] font-bold leading-none", renk)}>{deger}</div>
      <div className="mt-1 text-[11px] text-slate-faint">{etiket}</div>
    </div>
  );
}

/* =============================================================== UlkeSiralama */
function UlkeSiralama({
  ulkeler, seciliKod, setSeciliKod, setHoverKod, canliMod, t, yerel,
}: {
  ulkeler: UlkeYogunluk[];
  seciliKod: string | null;
  setSeciliKod: (k: string | null) => void;
  setHoverKod: (k: string | null) => void;
  canliMod: boolean;
  t: Ceviri;
  yerel: string;
}) {
  return (
    <Panel
      baslik={t("siralama.baslik")}
      sagUst={
        <span className="text-[12px] text-slate-faint">
          {canliMod ? t("siralama.tumPencere") : t("siralama.seciliDilim")} · {t("siralama.ulkeSayisi").replace("{n}", String(ulkeler.length))}
        </span>
      }
    >
      {ulkeler.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-muted">{t("siralama.trafikYok")}</p>
      ) : (
        <div className="space-y-1.5">
          {ulkeler.slice(0, 12).map((u, i) => {
            const renk = isiRengi(u.yogunlukPuan);
            const aktif = u.ulke === seciliKod;
            return (
              <button
                key={u.ulke}
                onClick={() => setSeciliKod(u.ulke === seciliKod ? null : u.ulke)}
                onMouseEnter={() => setHoverKod(u.ulke)}
                onMouseLeave={() => setHoverKod(null)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
                  aktif ? "border-brand-300 bg-brand-50/60" : "border-line hover:border-line-strong hover:bg-canvas/50",
                )}
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-canvas text-[12px] font-bold text-slate-muted">{i + 1}</span>
                <span className="text-[16px] leading-none">{bayrak(u.ulke)}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[13.5px] font-semibold text-slate-ink">{ulkeAd(u.ulke)}</span>
                    <span className="text-[11px] font-medium text-slate-faint">{u.ulke}</span>
                    <span
                      className="ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                      style={{ background: renk + "1f", color: renk }}
                    >
                      {u.yogunlukPuan}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-canvas">
                    <div className="h-full rounded-full transition-all" style={{ width: `${u.yogunlukPuan}%`, background: renk }} />
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="num text-[14px] font-bold text-slate-ink">{u.toplam.toLocaleString(yerel)}</div>
                  <div className="text-[11px] text-danger2">{t("siralama.engel").replace("{n}", yuzde(u.engelOran))}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

/* =============================================================== BolgeOzet
 * Bölge dağılımı artık DONUT (pay görselleştirmesi) + altında yoğunluk-tonlu
 * kompakt satırlar. Yatay-bar tekrarı kırılır; veri/mantık aynı (bolgeler propu).
 */
function BolgeOzet({ bolgeler, t, yerel }: { bolgeler: BolgeYogunluk[]; t: Ceviri; yerel: string }) {
  // Donut segmentleri: her bölge = bir pay, rengi yoğunluk puanına göre.
  const segmentler = useMemo(
    () =>
      bolgeler
        .filter((b) => b.toplam > 0)
        .map((b) => ({ etiket: t(`bolge.${b.bolge}`), deger: b.toplam, renk: isiRengi(b.yogunlukPuan) })),
    [bolgeler, t],
  );

  return (
    <Panel baslik={t("gorsel.bolgeDagilim")} sagUst={<Layers className="size-4 text-slate-faint" />}>
      {bolgeler.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-muted">{t("bolge.veriYok")}</p>
      ) : (
        <div className="space-y-4">
          <p className="-mt-1 text-[12px] text-slate-muted">{t("gorsel.bolgeDagilimAlt")}</p>
          <DonutDagilim segmentler={segmentler} merkezEtiket={t("gorsel.bolgeMerkez")} />

          {/* kompakt yoğunluk satırları — bar yerine ince kademe rozeti + en yoğun ülke */}
          <div className="space-y-1.5 border-t border-line pt-3">
            {bolgeler.map((b) => {
              const renk = isiRengi(b.yogunlukPuan);
              return (
                <div key={b.bolge} className="flex items-center gap-2.5 rounded-lg px-1.5 py-1">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: renk }} />
                  <span className="text-[13px] font-medium text-slate-ink">{t(`bolge.${b.bolge}`)}</span>
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                    style={{ background: renk + "1f", color: renk }}
                  >
                    {b.yogunlukPuan}
                  </span>
                  <span className="ml-auto flex items-center gap-1 text-[11px] text-slate-muted">
                    {b.enYogunUlke && <>{bayrak(b.enYogunUlke)} {ulkeAd(b.enYogunUlke)}</>}
                    <ChevronRight className="size-3 text-slate-faint" />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Panel>
  );
}

/* =============================================================== DilimIsiMatris
 * Zaman dilimleri × en-yoğun-ülkeler → gün/dilim risk yoğunluğu ısı-matrisi.
 * Satır = dilimin en yoğun 6 ülkesi (birleşik), sütun = zaman dilimleri.
 * Hücre = o ülkenin o dilimdeki yoğunluk puanı. Veri: zaman.dilimler (aynı).
 */
function DilimIsiMatris({ zaman, t }: { zaman: ZamanDilimSonuc; t: Ceviri }) {
  const { satirlar, sutunlar, degerler } = useMemo(() => {
    const dilimler = zaman.dilimler;
    // Sütunlar: her dilim (kısa "gg AY ss" etiketi).
    const sutunlar = dilimler.map((d) => araForm(d.baslangic, t).replace(/:00$/, "h"));
    // Satır adayları: tüm dilimlerdeki en yoğun ülkeleri topla → en çok görüneni seç.
    const puanTop = new Map<string, number>();
    for (const d of dilimler) {
      for (const [kod, p] of Object.entries(d.puanHaritasi)) {
        puanTop.set(kod, (puanTop.get(kod) ?? 0) + p);
      }
    }
    const enUlkeler = [...puanTop.entries()].sort((a, b) => b[1] - a[1]).slice(0, 7).map(([k]) => k);
    const satirlar = enUlkeler.map((k) => `${bayrak(k)} ${ulkeAd(k)}`);
    // degerler[satir][sutun] = o ülkenin o dilimdeki yoğunluk puanı.
    const degerler = enUlkeler.map((kod) => dilimler.map((d) => Math.round(d.puanHaritasi[kod] ?? 0)));
    return { satirlar, sutunlar, degerler };
  }, [zaman, t]);

  const veriVar = satirlar.length > 0 && sutunlar.length > 0;

  return (
    <Panel
      baslik={<span className="flex items-center gap-2"><Activity className="size-4 text-brand-600" /> {t("gorsel.isiMatris")}</span>}
      sagUst={<span className="text-[12px] text-slate-faint">{t("gorsel.isiMatrisAlt")}</span>}
    >
      {!veriVar ? (
        <p className="py-10 text-center text-sm text-slate-muted">{t("bolge.veriYok")}</p>
      ) : (
        <div className="pt-1">
          <IsiMatris satirlar={satirlar} sutunlar={sutunlar} degerler={degerler} />
        </div>
      )}
    </Panel>
  );
}

/* =============================================================== AsnKategoriDagilim
 * Aktif ülkelerin ASN sayaçlarını ağ türüne göre kategorize eder (barındırma/
 * İSS/mobil/bilinmeyen) → donut. Heuristik yalnızca GÖRSEL sınıflamadır; ham
 * ASN verisi (asnSayac) değiştirilmez, motorla ilişkisi yoktur.
 */
function asnKategori(asn: string): "hosting" | "isp" | "mobil" | "bilinmeyen" {
  const s = asn.toLowerCase();
  if (/unknown|as0\b|bogon|reserved/.test(s)) return "bilinmeyen";
  if (/aws|amazon|azure|microsoft|google|gcp|cloud|linode|akamai|digitalocean|ovh|hetzner|vultr|hosting|datacenter|server|leaseweb|contabo/.test(s)) return "hosting";
  if (/mobile|gsm|cellular|vodafone|turkcell|orange|t-mobile|verizon wireless|telkomsel|jio/.test(s)) return "mobil";
  return "isp";
}

function AsnKategoriDagilim({ ulkeler, t }: { ulkeler: UlkeYogunluk[]; t: Ceviri }) {
  const segmentler = useMemo(() => {
    const say: Record<string, number> = { hosting: 0, isp: 0, mobil: 0, bilinmeyen: 0 };
    for (const u of ulkeler) {
      for (const [asn, n] of Object.entries(u.asnSayac)) {
        say[asnKategori(asn)] += n;
      }
    }
    const meta: { k: string; etiketKey: string; renk: string }[] = [
      { k: "hosting", etiketKey: "gorsel.asnHosting", renk: "#dc2626" },
      { k: "isp", etiketKey: "gorsel.asnIsp", renk: "#2f6fed" },
      { k: "mobil", etiketKey: "gorsel.asnMobil", renk: "#0891b2" },
      { k: "bilinmeyen", etiketKey: "gorsel.asnBilinmeyen", renk: "#94a3b8" },
    ];
    return meta
      .filter((m) => say[m.k] > 0)
      .map((m) => ({ etiket: t(m.etiketKey), deger: say[m.k], renk: m.renk }));
  }, [ulkeler, t]);

  return (
    <Panel
      baslik={<span className="flex items-center gap-2"><Server className="size-4 text-brand-600" /> {t("gorsel.asnBaslik")}</span>}
    >
      {segmentler.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-muted">{t("gorsel.asnVeriYok")}</p>
      ) : (
        <div className="space-y-3 pt-1">
          <p className="text-[12px] text-slate-muted">{t("gorsel.asnAlt")}</p>
          <DonutDagilim segmentler={segmentler} merkezEtiket={t("gorsel.bolgeMerkez")} />
        </div>
      )}
    </Panel>
  );
}
