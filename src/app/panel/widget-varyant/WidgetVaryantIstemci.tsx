"use client";

/**
 * Widget Görsel Varyant Stüdyosu (istemci)
 * =========================================
 * Ghost-font CAPTCHA kartının GÖRSEL varyantlarını tasarla, CANLI önizle,
 * gömme kodunu üret ve sürtünme/dönüşüm ödünleşimini tahmin et.
 *
 * Buradaki tasarım seçenekleri (tema/renk/yarıçap/boyut/tür/zorluk/metin)
 * yalnızca kart KABUĞUNU ve ghost-font İÇERİĞİNİ etkiler — koruma tekniği
 * (temporal dithering) türden bağımsız aynıdır. Varyantlar dürüstçe
 * localStorage'da saklanır (bu bir tasarım aracı; sunucu durumu gerektirmez).
 *
 * Canlı önizleme, gerçek ghost-font çekirdeğini (DIFFICULTY_PROFILES) kullanan
 * kendi kompakt canvas hook'umuzla çizilir — sahte görsel değil, gerçek
 * hareketli-nokta metni. prefers-reduced-motion açıksa animasyon tek kareye
 * dondurulur.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Palette, Lock, RefreshCw, Check, Save, Copy as CopyIcon, Trash2, Plus,
  Sparkles, GaugeCircle, Eye, Contrast, Sun, Moon, Monitor, Type as TypeIcon,
  Layers, TimerReset, TrendingUp, ShieldAlert, X, GitCompareArrows, AlertTriangle,
} from "lucide-react";
import {
  Panel, StatKart, Badge, useToast, KodBlok, NotKutusu, BosDurum, Tooltip,
} from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import {
  DIFFICULTY_PROFILES, buildTextMask, type DifficultyProfile,
} from "@/lib/specter/ghostfont";
import {
  challengeContent, type ChallengeType, type Difficulty, difficultyLength,
} from "@/lib/specter/challenge";
import type { Dil } from "@/lib/i18n/panel";
import { widgetVaryantCeviri } from "./widget-varyant.i18n";

/** Sayfa geneli çeviri kısayolu tipi (alt bileşenlere prop olarak geçilir). */
type Ceviri = (anahtar: string) => string;

/* ================================================================== TİPLER */

type Tema = "acik" | "koyu" | "otomatik";
type Boyut = "kompakt" | "normal" | "buyuk";

/** Bir görsel varyantın tam konfigürasyonu (localStorage'da saklanan birim). */
interface VaryantConfig {
  tema: Tema;
  /** Vurgu rengi (buton + kilit + odak halkası). Hex. */
  vurgu: string;
  /** Köşe yarıçapı (px). */
  yaricap: number;
  boyut: Boyut;
  tur: ChallengeType;
  zorluk: Difficulty;
  /** Başlık metni (kart üstü). */
  baslik: string;
  /** Girdi placeholder metni. */
  placeholder: string;
}

interface Varyant extends VaryantConfig {
  id: string;
  ad: string;
  olusturma: number;
}

const LS_ANAHTAR = "specter_widget_varyantlar";

/* ============================================================ SABİT VERİLER */

/**
 * VARSAYILAN başlık/placeholder metinleri dile göre çözülür (kullanıcı bunları
 * düzenleyebilir; ilk değer aktif dile göre gelir). Bkz. varsayilanConfig().
 */
function varsayilanConfig(t: Ceviri): VaryantConfig {
  return {
    tema: "koyu",
    vurgu: "#06b6d4",
    yaricap: 20,
    boyut: "normal",
    tur: "kod",
    zorluk: "medium",
    baslik: t("wv.kart.baslikVarsayilan"),
    placeholder: t("wv.kart.placeholderVarsayilan"),
  };
}

/** Hazır vurgu renkleri (swatch paleti). */
const RENKLER = [
  "#06b6d4", "#4a41e8", "#2f6fed", "#16a34a", "#d97706",
  "#dc2626", "#db2777", "#7c3aed", "#0f172a", "#059669",
];

/**
 * ENUM GÜVENLİĞİ: aşağıdaki meta-haritalar yalnızca STABİL veri tutar (ikon,
 * boyut, renk tonu). Kullanıcıya gösterilen ETİKETLER çevrilmez — `t()` ile
 * `wv.<alan>.<enumDeğeri>` anahtarından çözülür (enum değerleri hiç değişmez).
 */
const TEMA_META: Record<Tema, { ikon: typeof Sun }> = {
  acik: { ikon: Sun },
  koyu: { ikon: Moon },
  otomatik: { ikon: Monitor },
};

const BOYUT_META: Record<Boyut, { w: number; canvasH: number; olcek: number }> = {
  kompakt: { w: 280, canvasH: 88, olcek: 0.92 },
  normal: { w: 328, canvasH: 104, olcek: 1 },
  buyuk: { w: 380, canvasH: 124, olcek: 1.08 },
};

const TUR_META: Record<ChallengeType, { maxLen: number }> = {
  kod: { maxLen: 7 },
  sayi: { maxLen: 7 },
  yon: { maxLen: 1 },
  sec: { maxLen: 1 },
};

const ZORLUK_META: Record<Difficulty, { ton: "yesil" | "sari" | "kirmizi" }> = {
  low: { ton: "yesil" },
  medium: { ton: "sari" },
  high: { ton: "kirmizi" },
};

/* ------------------------------------------------ enum → yerel etiket çözücüler */

const temaAd = (tema: Tema, t: Ceviri) => t(`wv.tema.${tema}`);
const boyutAd = (boyut: Boyut, t: Ceviri) => t(`wv.boyut.${boyut}`);
const turAd = (tur: ChallengeType, t: Ceviri) => t(`wv.tur.${tur}`);
const turAciklama = (tur: ChallengeType, t: Ceviri) => t(`wv.turAc.${tur}`);
const zorlukAd = (zorluk: Difficulty, t: Ceviri) => t(`wv.zorluk.${zorluk}`);

/* ======================================================= YARDIMCI: RENK/WCAG */

/** "#rrggbb" → {r,g,b} (0..255). Geçersizse siyah. */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return { r: 0, g: 0, b: 0 };
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** sRGB kanal → doğrusal (WCAG relative luminance formülü). */
function kanalDogrusal(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/** WCAG bağıl parlaklık (0..1). */
function parlaklik(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * kanalDogrusal(r) + 0.7152 * kanalDogrusal(g) + 0.0722 * kanalDogrusal(b);
}

/** İki renk arası WCAG kontrast oranı (1..21). */
function kontrastOrani(a: string, b: string): number {
  const l1 = parlaklik(a);
  const l2 = parlaklik(b);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/** Vurgu rengine karşı okunur metin rengi seç (siyah/beyaz). */
function metinRengi(bg: string): string {
  return kontrastOrani(bg, "#ffffff") >= kontrastOrani(bg, "#0b1120") ? "#ffffff" : "#0b1120";
}

/* ============================================ TEMA → KART KABUK RENK PALETİ */

interface KabukPalet {
  kartBg: string;
  kartKenar: string;
  metin: string;
  ikincil: string;
  canvasBg: string;
  canvasMetin: string;
  girdiBg: string;
  girdiKenar: string;
}

/** Sistem karanlık mı (otomatik tema için). SSR-güvenli. */
function sistemKaranlik(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true;
}

function kabukPaleti(tema: Tema, sysKaranlik: boolean): KabukPalet {
  const koyu = tema === "koyu" || (tema === "otomatik" && sysKaranlik);
  if (koyu) {
    return {
      kartBg: "radial-gradient(120% 140% at 0% 0%,#16233f 0%,#0c1526 45%,#080d18 100%)",
      kartKenar: "rgba(255,255,255,.08)",
      metin: "#e8eef7",
      ikincil: "#8fa8bd",
      canvasBg: "#0a1120",
      canvasMetin: "#cfe9f5",
      girdiBg: "rgba(9,14,26,.8)",
      girdiKenar: "rgba(255,255,255,.10)",
    };
  }
  return {
    kartBg: "linear-gradient(180deg,#ffffff 0%,#f4f7fb 100%)",
    kartKenar: "rgba(15,23,42,.10)",
    metin: "#0f172a",
    ikincil: "#5b6b82",
    canvasBg: "#eef2f7",
    canvasMetin: "#0b1120",
    girdiBg: "#ffffff",
    girdiKenar: "rgba(15,23,42,.14)",
  };
}

/* ============================================ CANLI GHOST-FONT CANVAS HOOK'U */

/**
 * Kompakt ghost-field render'ı — GhostField sınıfının çekirdeğini (temporal
 * dithering) küçük bir React hook içinde çoğaltır. Tam DIFFICULTY_PROFILES'ı
 * (coh/refresh/letterBase/bgBase/amp) onurlandırır, böylece zorluk seçimi
 * önizlemede GERÇEKTEN görünür. buildTextMask'ı ghostfont.ts'ten yeniden
 * kullanır (mask hesabı = harf yerleşimi). reduced-motion açıksa tek kare
 * çizilir ve animasyon donar.
 *
 * NOT: Ortak <GhostText/> bileşeni difficulty prop'u almadığından (yalnızca
 * cell), profilin tüm parametrelerini yansıtmak için kendi hook'umuzu yazdık.
 */
function useGhostCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  opt: {
    text: string;
    width: number;
    height: number;
    difficulty: Difficulty;
    color: string;
    bg: string;
    durgun: boolean; // reduced-motion → tek kareye dondur
  },
) {
  const { text, width, height, difficulty, color, bg, durgun } = opt;
  const rafRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    const prof: DifficultyProfile = DIFFICULTY_PROFILES[difficulty];
    const cell = prof.cell;
    const cols = Math.floor(width / cell);
    const rows = Math.floor(height / cell);
    // mask = hangi hücreler harfe ait (ghostfont.ts'ten yeniden kullanılır).
    const mask = buildTextMask(text, cols, rows, cell);

    // Her hücreye sabit deterministik faz (statik analize dirençli desen).
    const phase = new Float32Array(cols * rows);
    let s = 0x9e3779b9;
    for (let i = 0; i < phase.length; i++) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      phase[i] = s / 0x7fffffff;
    }

    // Deterministik (x, satır) gürültüsü — ghostfont.ts ile aynı (zıt-akış).
    const gurultu = (x: number, y: number): number => {
      let h = (x * 374761393 + y * 668265263) & 0x7fffffff;
      h = (h ^ (h >> 13)) * 1274126177;
      h = h & 0x7fffffff;
      return (h % 10000) / 10000;
    };

    const ciz = (t: number) => {
      const w = cols * cell;
      const hgt = rows * cell;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, hgt);
      ctx.fillStyle = color;
      const { coh, letterBase, bgBase, letterAmp, bgAmp, flow } = prof;
      // ZIT-AKIŞ: zemin aşağı (+), harf yukarı (−) — motor ile birebir.
      const sn = t * 0.001;
      const asagi = sn * flow;
      const yukari = sn * flow * 1.1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const harf = mask[i] === 1;
          const akisSatir = harf ? r + yukari : r - asagi;
          const satirTam = Math.floor(akisSatir);
          const satirKesir = akisSatir - satirTam;
          const g0 = gurultu(c, satirTam);
          const g1 = gurultu(c, satirTam + 1);
          const g = g0 * (1 - satirKesir) + g1 * satirKesir;
          const fazTemel = harf ? yukari : asagi;
          const fazHucre = (fazTemel + phase[i] * (1 - coh)) % 1;
          const dalga = Math.sin(fazHucre * 6.2831853);
          const esik = harf
            ? letterBase + dalga * letterAmp * coh
            : bgBase - dalga * bgAmp * coh;
          if (g < esik) ctx.fillRect(c * cell, r * cell, cell, cell);
        }
      }
    };

    if (durgun) {
      // reduced-motion: tek temsili kare çiz, döngü başlatma.
      ciz(420);
      return;
    }

    let start = 0;
    const loop = (ts: number) => {
      if (!start) start = ts;
      ciz(ts - start);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [canvasRef, text, width, height, difficulty, color, bg, durgun]);
}

/* ================================================= SÜRTÜNME / DÖNÜŞÜM MODELİ */

/**
 * Modellenmiş (temsili) sürtünme/dönüşüm tahmini. GERÇEK ölçüm değil —
 * zorluk uzunluğu (difficultyLength: low=4 en kolay → high=7 en zor) ve tür
 * karmaşıklığına dayanan dürüst bir tahmindir. Amaç: tasarımcının güvenlik
 * ↔ kullanıcı deneyimi ödünleşimini görmesini sağlamak.
 */
interface Tahmin {
  cozumOrani: number; // % insan çözüm başarısı
  ortSure: number; // saniye
  surtunme: number; // 0..100 (yüksek = daha çok sürtünme)
  botDirenci: number; // 0..100 (yüksek = bota daha dayanıklı)
}

function tahminHesapla(tur: ChallengeType, zorluk: Difficulty): Tahmin {
  const uzunluk = difficultyLength(zorluk); // 4 / 5 / 7
  // Tür başına temel çözüm kolaylığı çarpanı (yon/sec tek girdi → en kolay).
  const turKolaylik: Record<ChallengeType, number> = {
    kod: 1.0, sayi: 1.12, yon: 1.28, sec: 1.22,
  };
  // Her ek karakter çözüm oranını düşürür, süreyi artırır.
  const tabanOran = 99 - (uzunluk - 4) * 4.2; // 4→99, 5→94.8, 7→86.4
  const cozumOrani = Math.max(70, Math.min(99, tabanOran * turKolaylik[tur] - (turKolaylik[tur] - 1) * 4));
  // Ortalama çözüm süresi: uzunluk + zorluk gürültüsü; kolay türlerde kısa.
  const zorlukSure: Record<Difficulty, number> = { low: 0, medium: 0.9, high: 2.1 };
  const ortSure = Math.max(
    2.0,
    (1.6 + uzunluk * 0.7 + zorlukSure[zorluk]) / turKolaylik[tur],
  );
  // Sürtünme: çözüm oranının ve sürenin fonksiyonu.
  const surtunme = Math.round(Math.max(0, Math.min(100, (100 - cozumOrani) * 3 + (ortSure - 2) * 6)));
  // Bot direnci: uzunluk + zorluk profilinin tazeleme hızı ile artar.
  const zorlukDirenc: Record<Difficulty, number> = { low: 58, medium: 74, high: 90 };
  const botDirenci = Math.round(Math.min(99, zorlukDirenc[zorluk] + (tur === "kod" ? 4 : 0)));
  return {
    cozumOrani: Math.round(cozumOrani * 10) / 10,
    ortSure: Math.round(ortSure * 10) / 10,
    surtunme,
    botDirenci,
  };
}

/* ============================================================ ÖNİZLEME KARTI */

function OnizlemeKart({
  cfg,
  sysKaranlik,
  durgun,
  seed,
  kompakt = false,
  t,
}: {
  cfg: VaryantConfig;
  sysKaranlik: boolean;
  durgun: boolean;
  seed: number;
  kompakt?: boolean;
  t: Ceviri;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const palet = kabukPaleti(cfg.tema, sysKaranlik);
  const boyut = BOYUT_META[cfg.boyut];
  const uzunluk = difficultyLength(cfg.zorluk);
  // Önizlemede gösterilecek gerçek içerik (kod/sayı/yön/nokta) — challenge.ts.
  const icerik = useMemo(
    () => challengeContent(seed, uzunluk, cfg.tur),
    [seed, uzunluk, cfg.tur],
  );
  const cardW = boyut.w * (kompakt ? 0.86 : 1);
  const canvasW = cardW - 32;
  const canvasH = boyut.canvasH * (kompakt ? 0.9 : 1);
  const btnMetin = metinRengi(cfg.vurgu);

  useGhostCanvas(canvasRef, {
    text: icerik,
    width: Math.round(canvasW),
    height: Math.round(canvasH),
    difficulty: cfg.zorluk,
    color: palet.canvasMetin,
    bg: palet.canvasBg,
    durgun,
  });

  return (
    <div
      className="overflow-hidden"
      style={{
        width: cardW,
        maxWidth: "100%",
        borderRadius: cfg.yaricap,
        background: palet.kartBg,
        color: palet.metin,
        boxShadow: `inset 0 1px 0 0 rgba(255,255,255,.06), 0 20px 60px -18px rgba(0,0,0,.45), 0 0 0 1px ${palet.kartKenar}`,
      }}
    >
      {/* başlık şeridi */}
      <div className="flex items-center justify-between px-4 pb-2.5 pt-3.5">
        <span className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: palet.ikincil }}>
          <span className="grid size-4 place-items-center rounded-md" style={{ background: cfg.vurgu }}>
            <span className="size-2 rounded-sm" style={{ background: btnMetin }} />
          </span>
          {cfg.baslik || t("wv.kart.baslikVarsayilan")}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: cfg.vurgu }}>
          <Lock className="size-3" /> {t("wv.kart.sifreli")}
        </span>
      </div>

      {/* ghost-font alanı */}
      <div className="relative px-4">
        <div
          className="overflow-hidden"
          style={{
            borderRadius: Math.max(8, cfg.yaricap - 8),
            boxShadow: `0 0 0 1px ${palet.kartKenar}, inset 0 0 30px rgba(0,0,0,.35)`,
          }}
        >
          <canvas ref={canvasRef} style={{ width: canvasW, height: canvasH, display: "block" }} />
        </div>
        <button
          type="button"
          aria-label={t("wv.kart.yeniKodAria")}
          className="absolute right-6 top-1.5 grid size-7 place-items-center rounded-lg backdrop-blur transition"
          style={{ border: `1px solid ${palet.girdiKenar}`, background: palet.girdiBg, color: palet.ikincil }}
        >
          <RefreshCw className="size-3.5" />
        </button>
      </div>

      {/* girdi + buton */}
      <div className="flex gap-2.5 px-4 pb-1.5 pt-3">
        <input
          readOnly
          placeholder={cfg.placeholder || t("wv.kart.placeholderVarsayilan")}
          className="h-11 flex-1 px-3.5 text-[15px] font-semibold outline-none"
          style={{
            borderRadius: Math.max(8, cfg.yaricap - 8),
            border: `1px solid ${palet.girdiKenar}`,
            background: palet.girdiBg,
            color: palet.metin,
          }}
        />
        <button
          type="button"
          className="px-5 text-[14px] font-extrabold transition hover:brightness-110"
          style={{
            borderRadius: Math.max(8, cfg.yaricap - 8),
            background: cfg.vurgu,
            color: btnMetin,
          }}
        >
          {t("wv.kart.dogrula")}
        </button>
      </div>

      {/* alt şerit */}
      <div className="flex items-center justify-between px-4 pb-3.5 pt-2.5 text-[11px]" style={{ color: palet.ikincil }}>
        <span className="flex items-center gap-1.5 font-bold">
          <span className="size-1.5 rounded-full" style={{ background: cfg.vurgu, boxShadow: `0 0 10px ${cfg.vurgu}` }} />
          {t("wv.kart.korunuyor")}
        </span>
        <Badge ton={ZORLUK_META[cfg.zorluk].ton}>{turAd(cfg.tur, t)}</Badge>
      </div>
    </div>
  );
}

/* ==================================================== KÜÇÜK DÜZENLEYİCİ PARÇALARI */

function KontrolBlok({ etiket, ikon, children }: { etiket: string; ikon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-slate-faint">
        {ikon}
        {etiket}
      </div>
      {children}
    </div>
  );
}

function SecimGrup<T extends string>({
  deger, secenekler, onSec,
}: {
  deger: T;
  secenekler: { deger: T; ad: string; ikon?: React.ReactNode }[];
  onSec: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {secenekler.map((s) => (
        <button
          key={s.deger}
          type="button"
          onClick={() => onSec(s.deger)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[13px] font-medium transition",
            deger === s.deger
              ? "border-brand-400 bg-brand-50 text-brand-700 ring-1 ring-brand-200"
              : "border-line bg-surface text-slate-muted hover:border-line-strong hover:text-slate-ink",
          )}
        >
          {s.ikon}
          {s.ad}
        </button>
      ))}
    </div>
  );
}

/* ================================================================= ANA BİLEŞEN */

export function WidgetVaryantIstemci({ dil }: { dil: Dil }) {
  const { goster } = useToast();
  const t = useCallback((anahtar: string) => widgetVaryantCeviri(anahtar, dil), [dil]);

  const [cfg, setCfg] = useState<VaryantConfig>(() => varsayilanConfig((k) => widgetVaryantCeviri(k, dil)));
  const [varyantlar, setVaryantlar] = useState<Varyant[]>([]);
  const [ad, setAd] = useState("");
  const [duzenlenenId, setDuzenlenenId] = useState<string | null>(null);
  const [karsilastir, setKarsilastir] = useState<string[]>([]); // A/B için 2 varyant id
  const [sysKaranlik, setSysKaranlik] = useState(true);
  const [durgun, setDurgun] = useState(false);
  const [seed, setSeed] = useState(1337);

  const set = useCallback(<K extends keyof VaryantConfig>(k: K, v: VaryantConfig[K]) => {
    setCfg((p) => ({ ...p, [k]: v }));
  }, []);

  // localStorage yükle + sistem tercihleri (yalnızca istemci).
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const ham = window.localStorage.getItem(LS_ANAHTAR);
      if (ham) setVaryantlar(JSON.parse(ham) as Varyant[]);
    } catch {
      /* bozuk JSON → yoksay */
    }
    setSysKaranlik(sistemKaranlik());
    const mm = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    setDurgun(!!mm?.matches);
    const onScheme = (e: MediaQueryListEvent) => setSysKaranlik(e.matches);
    const onMotion = (e: MediaQueryListEvent) => setDurgun(e.matches);
    const schemeMq = window.matchMedia?.("(prefers-color-scheme: dark)");
    schemeMq?.addEventListener?.("change", onScheme);
    mm?.addEventListener?.("change", onMotion);
    return () => {
      schemeMq?.removeEventListener?.("change", onScheme);
      mm?.removeEventListener?.("change", onMotion);
    };
  }, []);

  const kaydet = useCallback((liste: Varyant[]) => {
    setVaryantlar(liste);
    try {
      window.localStorage.setItem(LS_ANAHTAR, JSON.stringify(liste));
    } catch {
      /* kota/gizli mod → sessizce geç */
    }
  }, []);

  const tahmin = useMemo(() => tahminHesapla(cfg.tur, cfg.zorluk), [cfg.tur, cfg.zorluk]);

  // Erişilebilirlik: vurgu ↔ kart zemini kontrastı.
  const a11y = useMemo(() => {
    const palet = kabukPaleti(cfg.tema, sysKaranlik);
    const btnMetin = metinRengi(cfg.vurgu);
    // Buton üzerindeki metin okunabilirliği (vurgu vs metin).
    const btnKontrast = kontrastOrani(cfg.vurgu, btnMetin);
    // Vurgu rengi kart zeminine karşı ne kadar seçilir (odak/kilit görünürlüğü).
    const zeminRef = palet.canvasBg;
    const vurguKontrast = kontrastOrani(cfg.vurgu, zeminRef);
    return { btnKontrast, vurguKontrast, btnMetin };
  }, [cfg.vurgu, cfg.tema, sysKaranlik]);

  function varyantKaydet() {
    const isim = ad.trim() || t("wv.toast.varsayilanVaryant").replace("{n}", String(varyantlar.length + 1));
    if (duzenlenenId) {
      kaydet(varyantlar.map((v) => (v.id === duzenlenenId ? { ...v, ...cfg, ad: isim } : v)));
      goster({ tip: "basari", baslik: t("wv.toast.guncellendiBaslik"), aciklama: isim });
    } else {
      const yeni: Varyant = {
        ...cfg,
        id: `v_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        ad: isim,
        olusturma: Date.now(),
      };
      kaydet([yeni, ...varyantlar]);
      setDuzenlenenId(yeni.id);
      goster({ tip: "basari", baslik: t("wv.toast.kaydedildiBaslik"), aciklama: isim });
    }
  }

  function varyantYukle(v: Varyant) {
    const { id, ad: vad, olusturma, ...rest } = v;
    void id; void olusturma;
    setCfg(rest);
    setAd(vad);
    setDuzenlenenId(v.id);
  }

  function varyantCogalt(v: Varyant) {
    const kopya: Varyant = {
      ...v,
      id: `v_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      ad: `${v.ad} ${t("wv.toast.kopyaEki")}`,
      olusturma: Date.now(),
    };
    kaydet([kopya, ...varyantlar]);
    goster({ tip: "bilgi", baslik: t("wv.toast.cogaltildiBaslik"), aciklama: kopya.ad });
  }

  function varyantSil(id: string) {
    kaydet(varyantlar.filter((v) => v.id !== id));
    setKarsilastir((p) => p.filter((x) => x !== id));
    if (duzenlenenId === id) {
      setDuzenlenenId(null);
      setAd("");
    }
    goster({ tip: "bilgi", baslik: t("wv.toast.silindiBaslik") });
  }

  function yeniBaslat() {
    setCfg(varsayilanConfig(t));
    setAd("");
    setDuzenlenenId(null);
  }

  function karsilastirTogle(id: string) {
    setKarsilastir((p) => {
      if (p.includes(id)) return p.filter((x) => x !== id);
      if (p.length >= 2) return [p[1], id]; // en fazla 2, en eskiyi düşür
      return [...p, id];
    });
  }

  // Gömme kodu üret (temsili data-* öznitelikleri).
  const gommeKod = useMemo(() => {
    const attrs = [
      `class="veylify-captcha"`,
      `data-sitekey="spk_live_XXXXXXXXXXXX"`,
      `data-theme="${cfg.tema}"`,
      `data-accent="${cfg.vurgu}"`,
      `data-type="${cfg.tur}"`,
      `data-difficulty="${cfg.zorluk}"`,
      `data-size="${cfg.boyut}"`,
      `data-radius="${cfg.yaricap}"`,
      `data-title="${cfg.baslik}"`,
      `data-placeholder="${cfg.placeholder}"`,
    ];
    return [
      `<!-- ${t("wv.gomme.yorum")} — ${ad.trim() || t("wv.gomme.varyant")} -->`,
      `<div ${attrs.join("\n     ")}></div>`,
      ``,
      `<script src="https://cdn.veylify.com/veylify.js" async defer></script>`,
    ].join("\n");
  }, [cfg, ad, t]);

  const karsilastirilan = useMemo(
    () => karsilastir.map((id) => varyantlar.find((v) => v.id === id)).filter(Boolean) as Varyant[],
    [karsilastir, varyantlar],
  );

  const surtunmeTon = tahmin.surtunme < 25 ? "yesil" : tahmin.surtunme < 55 ? "sari" : "kirmizi";
  const kontrastYeter = a11y.vurguKontrast >= 3;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* açıklama şeridi */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Palette className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("wv.serit.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {t("wv.serit.aciklama")}
          </p>
        </div>
      </div>

      {/* özet metrikler */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={`%${tahmin.cozumOrani}`} etiket={t("wv.ozet.cozumOrani")} ikon={<Check className="size-5" />} tone={tahmin.cozumOrani >= 92 ? "ok" : "warn"} />
        <StatKart sayi={`${tahmin.ortSure}sn`} etiket={t("wv.ozet.ortSure")} ikon={<TimerReset className="size-5" />} />
        <StatKart sayi={`%${tahmin.botDirenci}`} etiket={t("wv.ozet.botDirenci")} ikon={<ShieldAlert className="size-5" />} tone="brand" />
        <StatKart sayi={varyantlar.length} etiket={t("wv.ozet.kayitliVaryant")} ikon={<Layers className="size-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(340px,400px)]">
        {/* ---------------------------------------------------- SOL: düzenleyici */}
        <Panel
          baslik={t("wv.duzen.baslik")}
          sagUst={
            <div className="flex items-center gap-2">
              {duzenlenenId && <Badge ton="mavi">{t("wv.duzen.duzenleniyor")}</Badge>}
              <Button variant="ghost" size="sm" onClick={yeniBaslat}><Plus className="size-4" /> {t("wv.duzen.yeni")}</Button>
            </div>
          }
        >
          <div className="space-y-5">
            {/* tema */}
            <KontrolBlok etiket={t("wv.duzen.tema")} ikon={<Monitor className="size-3.5" />}>
              <SecimGrup<Tema>
                deger={cfg.tema}
                onSec={(v) => set("tema", v)}
                secenekler={(Object.keys(TEMA_META) as Tema[]).map((tema) => {
                  const I = TEMA_META[tema].ikon;
                  return { deger: tema, ad: temaAd(tema, t), ikon: <I className="size-3.5" /> };
                })}
              />
            </KontrolBlok>

            {/* vurgu rengi */}
            <KontrolBlok etiket={t("wv.duzen.vurguRengi")} ikon={<Palette className="size-3.5" />}>
              <div className="flex flex-wrap items-center gap-2">
                {RENKLER.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set("vurgu", c)}
                    aria-label={t("wv.duzen.renkAria").replace("{c}", c)}
                    className={cn(
                      "size-8 rounded-full ring-2 ring-offset-2 ring-offset-surface transition",
                      cfg.vurgu.toLowerCase() === c.toLowerCase() ? "ring-brand-400 scale-110" : "ring-transparent hover:scale-105",
                    )}
                    style={{ background: c }}
                  />
                ))}
                <label className="flex items-center gap-2 rounded-xl border border-line px-2.5 py-1.5">
                  <input
                    type="color"
                    value={cfg.vurgu}
                    onChange={(e) => set("vurgu", e.target.value)}
                    aria-label={t("wv.duzen.ozelRenkAria")}
                    className="size-6 cursor-pointer rounded border-0 bg-transparent p-0"
                  />
                  <span className="font-mono text-[12px] text-slate-muted">{cfg.vurgu}</span>
                </label>
              </div>
            </KontrolBlok>

            {/* köşe yarıçapı */}
            <KontrolBlok etiket={t("wv.duzen.koseYaricapi").replace("{n}", String(cfg.yaricap))}>
              <input
                type="range" min={0} max={32} step={1}
                value={cfg.yaricap}
                onChange={(e) => set("yaricap", Number(e.target.value))}
                aria-label={t("wv.duzen.koseYaricapiAria")}
                className="w-full accent-brand-600"
              />
            </KontrolBlok>

            {/* boyut */}
            <KontrolBlok etiket={t("wv.duzen.boyut")} ikon={<Layers className="size-3.5" />}>
              <SecimGrup<Boyut>
                deger={cfg.boyut}
                onSec={(v) => set("boyut", v)}
                secenekler={(Object.keys(BOYUT_META) as Boyut[]).map((b) => ({ deger: b, ad: boyutAd(b, t) }))}
              />
            </KontrolBlok>

            {/* challenge türü */}
            <KontrolBlok etiket={t("wv.duzen.challengeTuru")} ikon={<Sparkles className="size-3.5" />}>
              <SecimGrup<ChallengeType>
                deger={cfg.tur}
                onSec={(v) => set("tur", v)}
                secenekler={(Object.keys(TUR_META) as ChallengeType[]).map((tur) => ({ deger: tur, ad: turAd(tur, t) }))}
              />
              <p className="mt-1.5 text-[12px] text-slate-faint">{turAciklama(cfg.tur, t)}</p>
            </KontrolBlok>

            {/* zorluk */}
            <KontrolBlok etiket={t("wv.duzen.zorluk")} ikon={<GaugeCircle className="size-3.5" />}>
              <SecimGrup<Difficulty>
                deger={cfg.zorluk}
                onSec={(v) => set("zorluk", v)}
                secenekler={(Object.keys(ZORLUK_META) as Difficulty[]).map((d) => ({ deger: d, ad: zorlukAd(d, t) }))}
              />
              <p className="mt-1.5 text-[12px] text-slate-faint">
                {t("wv.duzen.zorlukNot").replace("{n}", String(difficultyLength(cfg.zorluk)))}
              </p>
            </KontrolBlok>

            {/* metinler */}
            <div className="grid gap-4 sm:grid-cols-2">
              <KontrolBlok etiket={t("wv.duzen.baslikMetni")} ikon={<TypeIcon className="size-3.5" />}>
                <input
                  value={cfg.baslik}
                  onChange={(e) => set("baslik", e.target.value)}
                  maxLength={40}
                  className="h-11 w-full rounded-2xl border border-line-strong bg-surface px-4 text-sm text-slate-ink outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                />
              </KontrolBlok>
              <KontrolBlok etiket={t("wv.duzen.placeholderMetni")} ikon={<TypeIcon className="size-3.5" />}>
                <input
                  value={cfg.placeholder}
                  onChange={(e) => set("placeholder", e.target.value)}
                  maxLength={40}
                  className="h-11 w-full rounded-2xl border border-line-strong bg-surface px-4 text-sm text-slate-ink outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                />
              </KontrolBlok>
            </div>

            {/* kaydet satırı */}
            <div className="flex flex-wrap items-center gap-2.5 border-t border-line pt-4">
              <input
                value={ad}
                onChange={(e) => setAd(e.target.value)}
                placeholder={t("wv.duzen.varyantAdi")}
                className="h-11 min-w-[200px] flex-1 rounded-2xl border border-line-strong bg-surface px-4 text-sm text-slate-ink outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100 placeholder:text-slate-faint"
              />
              <Button variant="accent" onClick={varyantKaydet}>
                <Save className="size-4" /> {duzenlenenId ? t("wv.duzen.guncelle") : t("wv.duzen.kaydet")}
              </Button>
            </div>
          </div>
        </Panel>

        {/* ---------------------------------------------------- SAĞ: canlı önizleme */}
        <div className="space-y-6">
          <Panel
            baslik={t("wv.onizleme.baslik")}
            sagUst={
              <Tooltip metin={t("wv.onizleme.yenileTooltip")}>
                <button
                  type="button"
                  onClick={() => setSeed((s) => (s * 1103515245 + 12345) & 0x7fffffff)}
                  className="grid size-8 place-items-center rounded-lg text-slate-faint transition hover:bg-canvas hover:text-slate-ink"
                >
                  <RefreshCw className="size-4" />
                </button>
              </Tooltip>
            }
          >
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-canvas/40 py-6">
              <OnizlemeKart cfg={cfg} sysKaranlik={sysKaranlik} durgun={durgun} seed={seed} t={t} />
              <p className="flex items-center gap-1.5 text-[12px] text-slate-faint">
                <Eye className="size-3.5" />
                {durgun ? t("wv.onizleme.durgun") : t("wv.onizleme.canli")}
              </p>
            </div>
          </Panel>

          {/* sürtünme/dönüşüm */}
          <Panel baslik={t("wv.surt.baslik")}>
            <div className="space-y-3.5">
              <SurtunmeSatir etiket={t("wv.surt.cozumOrani")} deger={`%${tahmin.cozumOrani}`} yuzde={tahmin.cozumOrani} renk="#16a34a" />
              <SurtunmeSatir etiket={t("wv.surt.botDirenci")} deger={`%${tahmin.botDirenci}`} yuzde={tahmin.botDirenci} renk="#4a41e8" />
              <SurtunmeSatir etiket={t("wv.surt.surtunme")} deger={`${tahmin.surtunme}/100`} yuzde={tahmin.surtunme} renk={tahmin.surtunme < 25 ? "#16a34a" : tahmin.surtunme < 55 ? "#d97706" : "#dc2626"} />
              <div className="flex items-center justify-between rounded-xl bg-canvas/60 px-3.5 py-2.5">
                <span className="flex items-center gap-1.5 text-[13px] text-slate-muted"><TimerReset className="size-4 text-slate-faint" /> {t("wv.surt.ortSure")}</span>
                <span className="num text-[15px] font-bold text-slate-ink">{tahmin.ortSure} sn</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-slate-muted">{t("wv.surt.denge")}</span>
                <Badge ton={surtunmeTon}>
                  <TrendingUp className="size-3" />
                  {tahmin.surtunme < 25 ? t("wv.surt.dusukSurtunme") : tahmin.surtunme < 55 ? t("wv.surt.dengeli") : t("wv.surt.yuksekGuvenlik")}
                </Badge>
              </div>
            </div>
            <NotKutusu ton="bilgi" baslik="">
              {(() => {
                // "modellenmiş tahmindir" ibaresini <b> ile vurgula (dile göre).
                const tamMetin = t("wv.surt.not");
                const vurgu = t("wv.surt.notVurgu");
                const idx = tamMetin.indexOf(vurgu);
                if (idx === -1) return tamMetin;
                return (
                  <>
                    {tamMetin.slice(0, idx)}<b>{vurgu}</b>{tamMetin.slice(idx + vurgu.length)}
                  </>
                );
              })()}
            </NotKutusu>
          </Panel>

          {/* erişilebilirlik */}
          <Panel baslik={t("wv.a11y.baslik")}>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-line px-3.5 py-2.5">
                <span className="flex items-center gap-1.5 text-[13px] text-slate-muted"><Contrast className="size-4 text-slate-faint" /> {t("wv.a11y.butonKontrasti")}</span>
                <span className="flex items-center gap-2">
                  <span className="num text-[13px] font-bold text-slate-ink">{a11y.btnKontrast.toFixed(1)}:1</span>
                  <Badge ton={a11y.btnKontrast >= 4.5 ? "yesil" : "sari"}>{a11y.btnKontrast >= 4.5 ? "AA" : t("wv.a11y.zayif")}</Badge>
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-line px-3.5 py-2.5">
                <span className="flex items-center gap-1.5 text-[13px] text-slate-muted"><Palette className="size-4 text-slate-faint" /> {t("wv.a11y.vurguZemin")}</span>
                <span className="flex items-center gap-2">
                  <span className="num text-[13px] font-bold text-slate-ink">{a11y.vurguKontrast.toFixed(1)}:1</span>
                  <Badge ton={kontrastYeter ? "yesil" : "kirmizi"}>{kontrastYeter ? t("wv.a11y.yeterli") : t("wv.a11y.dusuk")}</Badge>
                </span>
              </div>
              {!kontrastYeter && (
                <NotKutusu ton="sari" baslik={t("wv.a11y.kontrastUyari")}>
                  {t("wv.a11y.kontrastUyariMetin").replace("{n}", a11y.vurguKontrast.toFixed(1))}
                </NotKutusu>
              )}
              {cfg.boyut === "kompakt" && (
                <NotKutusu ton="sari" baslik={t("wv.a11y.boyutNot")}>
                  {t("wv.a11y.boyutNotMetin")}
                </NotKutusu>
              )}
            </div>
          </Panel>
        </div>
      </div>

      {/* ---------------------------------------------------- gömme kodu */}
      <Panel baslik={t("wv.gomme.baslik")}>
        <p className="mb-3 text-[13px] text-slate-muted">
          {t("wv.gomme.aciklama.1")} <code className="rounded bg-canvas px-1.5 py-0.5 font-mono text-[12px]">data-sitekey</code> {t("wv.gomme.aciklama.2")}
        </p>
        <KodBlok kod={gommeKod} dil="html" baslik="specter-embed.html" />
      </Panel>

      {/* ---------------------------------------------------- varyant kütüphanesi */}
      <Panel
        baslik={t("wv.kutuphane.baslik")}
        sagUst={
          karsilastirilan.length === 2 ? (
            <Badge ton="brand"><GitCompareArrows className="size-3" /> {t("wv.kutuphane.abHazir")}</Badge>
          ) : karsilastir.length === 1 ? (
            <span className="text-[12px] text-slate-faint">{t("wv.kutuphane.abSecim")}</span>
          ) : null
        }
      >
        {varyantlar.length === 0 ? (
          <BosDurum
            ikon={<Layers className="size-7" />}
            baslik={t("wv.kutuphane.bosBaslik")}
            aciklama={t("wv.kutuphane.bosAciklama")}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {varyantlar.map((v) => {
              const tah = tahminHesapla(v.tur, v.zorluk);
              const secili = karsilastir.includes(v.id);
              return (
                <div
                  key={v.id}
                  className={cn(
                    "flex flex-col rounded-2xl border bg-surface p-4 transition",
                    duzenlenenId === v.id ? "border-brand-400 ring-1 ring-brand-200" : "border-line hover:border-line-strong",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-semibold text-slate-ink">{v.ad}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        <Badge ton="gri">{temaAd(v.tema, t)}</Badge>
                        <Badge ton="gri">{turAd(v.tur, t)}</Badge>
                        <Badge ton={ZORLUK_META[v.zorluk].ton}>{zorlukAd(v.zorluk, t)}</Badge>
                      </div>
                    </div>
                    <span className="size-6 shrink-0 rounded-full ring-1 ring-black/10" style={{ background: v.vurgu }} />
                  </div>

                  <div className="mt-3 flex items-center gap-3 text-[12px] text-slate-muted">
                    <span className="flex items-center gap-1"><Check className="size-3 text-ok" /> %{tah.cozumOrani}</span>
                    <span className="flex items-center gap-1"><TimerReset className="size-3 text-slate-faint" /> {tah.ortSure}sn</span>
                    <span className="flex items-center gap-1"><ShieldAlert className="size-3 text-brand-600" /> %{tah.botDirenci}</span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
                    <Button variant="outline" size="sm" onClick={() => varyantYukle(v)}><Eye className="size-3.5" /> {t("wv.kutuphane.yukle")}</Button>
                    <Button variant="ghost" size="sm" onClick={() => varyantCogalt(v)}><CopyIcon className="size-3.5" /> {t("wv.kutuphane.cogalt")}</Button>
                    <button
                      type="button"
                      onClick={() => karsilastirTogle(v.id)}
                      className={cn(
                        "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition",
                        secili ? "border-brand-400 bg-brand-50 text-brand-700" : "border-line-strong bg-surface text-slate-muted hover:text-slate-ink",
                      )}
                    >
                      <GitCompareArrows className="size-3.5" /> {secili ? "A/B ✓" : "A/B"}
                    </button>
                    <button
                      type="button"
                      onClick={() => varyantSil(v.id)}
                      aria-label={t("wv.kutuphane.silAria")}
                      className="ml-auto grid size-9 place-items-center rounded-full text-slate-faint transition hover:bg-danger-soft hover:text-danger2"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* ---------------------------------------------------- A/B karşılaştırma */}
      {karsilastirilan.length === 2 && (
        <Panel
          baslik={t("wv.ab.baslik")}
          sagUst={
            <Button variant="ghost" size="sm" onClick={() => setKarsilastir([])}><X className="size-4" /> {t("wv.ab.kapat")}</Button>
          }
        >
          <div className="grid gap-6 md:grid-cols-2">
            {karsilastirilan.map((v, i) => {
              const tah = tahminHesapla(v.tur, v.zorluk);
              return (
                <div key={v.id} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="grid size-7 place-items-center rounded-lg bg-brand-600 text-[13px] font-bold text-white">{i === 0 ? "A" : "B"}</span>
                    <span className="text-[15px] font-semibold text-slate-ink">{v.ad}</span>
                  </div>
                  <div className="flex justify-center rounded-2xl bg-canvas/40 py-5">
                    <OnizlemeKart cfg={v} sysKaranlik={sysKaranlik} durgun={durgun} seed={seed} kompakt t={t} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <KarsiMetrik etiket={t("wv.ab.cozum")} deger={`%${tah.cozumOrani}`} />
                    <KarsiMetrik etiket={t("wv.ab.sure")} deger={`${tah.ortSure}sn`} />
                    <KarsiMetrik etiket={t("wv.ab.botDir")} deger={`%${tah.botDirenci}`} />
                  </div>
                </div>
              );
            })}
          </div>
          {(() => {
            const [a, b] = karsilastirilan.map((v) => tahminHesapla(v.tur, v.zorluk));
            const kazananCozum = a.cozumOrani === b.cozumOrani ? null : a.cozumOrani > b.cozumOrani ? "A" : "B";
            const kazananBot = a.botDirenci === b.botDirenci ? null : a.botDirenci > b.botDirenci ? "A" : "B";
            return (
              <div className="mt-5 flex flex-wrap items-center gap-2.5 rounded-2xl border border-line bg-canvas/40 px-4 py-3 text-[13px] text-slate-muted">
                <AlertTriangle className="size-4 shrink-0 text-warn" />
                <span>
                  {kazananCozum ? <><b>{kazananCozum}</b> {t("wv.ab.kazananCozum")} </> : <>{t("wv.ab.esitCozum")} </>}
                  {kazananBot ? <><b>{kazananBot}</b> {t("wv.ab.kazananBot")} </> : <>{t("wv.ab.esitBot")} </>}
                  {t("wv.ab.sonNot")}
                </span>
              </div>
            );
          })()}
        </Panel>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- küçük parçalar */

function SurtunmeSatir({ etiket, deger, yuzde, renk }: { etiket: string; deger: string; yuzde: number; renk: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[13px]">
        <span className="text-slate-muted">{etiket}</span>
        <span className="num font-bold text-slate-ink">{deger}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-canvas">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(0, Math.min(100, yuzde))}%`, background: renk }} />
      </div>
    </div>
  );
}

function KarsiMetrik({ etiket, deger }: { etiket: string; deger: string }) {
  return (
    <div className="rounded-xl bg-canvas/60 px-2 py-2.5">
      <div className="num text-[16px] font-bold text-slate-ink">{deger}</div>
      <div className="text-[11px] text-slate-faint">{etiket}</div>
    </div>
  );
}
