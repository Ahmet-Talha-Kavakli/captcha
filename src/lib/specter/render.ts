/**
 * Specter — Ghost Font Render Motoru
 * -----------------------------------
 * Challenge seed'inden, insanın kolayca okuyabileceği ama makinenin
 * (OCR / DOM-scraper / vision model) zorlanacağı bir görsel üretir.
 *
 * Savunma katmanları (hepsi seed'den deterministik):
 *
 *   [Katman 1 — Glyph substitution]
 *     Karakterler DOM'a hiç yazılmaz; canvas'a piksel olarak çizilir.
 *     DOM okuyan bot hiçbir metin bulamaz.
 *
 *   [Katman 2 — Stroke jitter / warp]
 *     Her glyph'in noktaları seed'e göre kaydırılır, glyph hafifçe
 *     eğilip döndürülür. OCR'ın öğrendiği "temiz" harf şablonları
 *     tutmaz; insan gözü ise kolayca tolere eder.
 *
 *   [Katman 3 — Alan gürültüsü]
 *     Arka plana rastgele çizgiler, noktalar ve renk dalgalanması
 *     eklenir. Kenar-tespit tabanlı vision modelleri sahte kenarlarla
 *     boğulur.
 *
 *   [Katman 4 — Renk/kontrast oyunu]
 *     Glyph rengi ile gürültü rengi benzer tonlarda tutulur; insan
 *     bütünü (Gestalt) algılar, piksel-piksel bakan model ayıramaz.
 *
 * Not: Bu fonksiyon TARAYICIDA çalışır (canvas). Aynı seed + aynı
 * charset türetimi (challenge.deriveAnswer) sayesinde ekranda çizilen
 * şey her zaman sunucudaki doğru cevapla birebir aynıdır.
 */

import { GLYPHS, type Glyph, type Point } from "./glyphs";
import { deriveAnswer, type Difficulty } from "./challenge";
import { Rng } from "./random";

export interface RenderOptions {
  seed: number;
  length: number;
  difficulty: Difficulty;
  width: number;
  height: number;
  /** Açık/koyu tema uyumu için taban renk. */
  theme?: "light" | "dark";
}

interface DifficultyProfile {
  jitter: number; // stroke nokta kayması (px)
  rotate: number; // glyph başına maks dönüş (rad)
  skew: number; // maks yatay eğim
  noiseLines: number; // arka plan çizgi sayısı (baz)
  noiseDots: number; // arka plan nokta sayısı (baz)
  waveAmp: number; // dikey dalga genliği (px)
}

const PROFILES: Record<Difficulty, DifficultyProfile> = {
  low: { jitter: 1.5, rotate: 0.1, skew: 0.08, noiseLines: 3, noiseDots: 40, waveAmp: 4 },
  medium: { jitter: 2.5, rotate: 0.18, skew: 0.14, noiseLines: 5, noiseDots: 80, waveAmp: 7 },
  high: { jitter: 3.5, rotate: 0.26, skew: 0.2, noiseLines: 8, noiseDots: 130, waveAmp: 11 },
};

interface Palette {
  bg: string;
  glyph: string;
  glyphAlt: string;
  noise: string;
}

function palette(theme: "light" | "dark", rng: Rng): Palette {
  if (theme === "dark") {
    const hue = rng.int(150, 175); // Specter yeşil-teal aralığı
    return {
      bg: "#0b1120",
      glyph: `hsl(${hue} 70% 72%)`,
      glyphAlt: `hsl(${hue + 20} 65% 60%)`,
      noise: `hsl(${hue} 40% 45%)`,
    };
  }
  const hue = rng.int(150, 175);
  return {
    bg: "#f8fafc",
    glyph: `hsl(${hue} 55% 30%)`,
    glyphAlt: `hsl(${hue + 20} 50% 38%)`,
    noise: `hsl(${hue} 30% 70%)`,
  };
}

/** Bir noktayı merkez etrafında döndürür + eğer + jitter uygular. */
function transformPoint(
  pt: Point,
  cx: number,
  cy: number,
  rot: number,
  skew: number,
  jitter: number,
  rng: Rng,
): Point {
  const x = pt[0] - 0.5;
  const y = pt[1] - 0.5;
  // dönüş
  const rx = x * Math.cos(rot) - y * Math.sin(rot);
  const ry = x * Math.sin(rot) + y * Math.cos(rot);
  // eğim (skew) + geri merkezle
  const sx = rx + ry * skew;
  const px = cx + sx * 1 + rng.range(-jitter, jitter);
  const py = cy + ry * 1 + rng.range(-jitter, jitter);
  return [px, py];
}

/**
 * Challenge'ı bir canvas 2D context'ine çizer.
 * Dönen değer, çizilen doğru cevaptır (widget'ın kendisi buna bakmaz;
 * yalnızca test/demo amaçlı döndürülür).
 */
export function renderChallenge(
  ctx: CanvasRenderingContext2D,
  opts: RenderOptions,
): string {
  const { seed, length, difficulty, width, height } = opts;
  const theme = opts.theme ?? "dark";
  const profile = PROFILES[difficulty];
  const rng = new Rng(seed);
  const answer = deriveAnswer(seed, length);
  const pal = palette(theme, rng);

  // --- Arka plan ---
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, width, height);

  // --- Katman 3a: arka plan çizgi gürültüsü (glyph'lerin ALTINA) ---
  drawNoiseLines(ctx, rng, pal, width, height, Math.floor(profile.noiseLines * 0.6));

  // --- Glyph yerleşimi ---
  const pad = width * 0.06;
  const cellW = (width - pad * 2) / length;
  const glyphSize = Math.min(cellW * 0.72, height * 0.6);

  for (let i = 0; i < length; i++) {
    const ch = answer[i];
    const glyph = GLYPHS[ch];
    if (!glyph) continue;

    const baseX = pad + cellW * i + cellW / 2;
    // dikey dalga — harfler aynı hizada durmasın
    const waveY =
      height / 2 + Math.sin(i * 1.3 + rng.float() * 6.28) * profile.waveAmp;

    const rot = rng.range(-profile.rotate, profile.rotate);
    const skew = rng.range(-profile.skew, profile.skew);

    drawGlyph(ctx, glyph, {
      cx: baseX,
      cy: waveY,
      size: glyphSize,
      rot,
      skew,
      jitter: profile.jitter,
      color: rng.bool(0.5) ? pal.glyph : pal.glyphAlt,
      rng,
    });
  }

  // --- Katman 3b: üst gürültü (glyph'lerin ÜSTÜNE, ince) ---
  drawNoiseLines(ctx, rng, pal, width, height, Math.floor(profile.noiseLines * 0.4));
  drawNoiseDots(ctx, rng, pal, width, height, profile.noiseDots);

  return answer;
}

function drawGlyph(
  ctx: CanvasRenderingContext2D,
  glyph: Glyph,
  o: {
    cx: number;
    cy: number;
    size: number;
    rot: number;
    skew: number;
    jitter: number;
    color: string;
    rng: Rng;
  },
): void {
  ctx.save();
  ctx.strokeStyle = o.color;
  ctx.lineWidth = Math.max(2, o.size * 0.09);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const half = o.size / 2;
  for (const stroke of glyph) {
    ctx.beginPath();
    stroke.forEach((pt, idx) => {
      // 0..1 -> -half..half ölçekle, sonra transform uygula
      const scaled: Point = [pt[0], pt[1]];
      const t = transformPoint(
        scaled,
        o.cx,
        o.cy,
        o.rot,
        o.skew,
        o.jitter,
        o.rng,
      );
      // ölçek: transformPoint 0..1 merkezli çalışıyor; genişlet
      const fx = o.cx + (t[0] - o.cx) * o.size;
      const fy = o.cy + (t[1] - o.cy) * o.size;
      if (idx === 0) ctx.moveTo(fx, fy);
      else ctx.lineTo(fx, fy);
    });
    ctx.stroke();
  }
  ctx.restore();
  void half;
}

function drawNoiseLines(
  ctx: CanvasRenderingContext2D,
  rng: Rng,
  pal: Palette,
  w: number,
  h: number,
  count: number,
): void {
  ctx.save();
  ctx.strokeStyle = pal.noise;
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < count; i++) {
    ctx.lineWidth = rng.range(0.8, 2.2);
    ctx.beginPath();
    const segs = rng.int(2, 4);
    ctx.moveTo(rng.range(0, w), rng.range(0, h));
    for (let s = 0; s < segs; s++) {
      ctx.lineTo(rng.range(0, w), rng.range(0, h));
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawNoiseDots(
  ctx: CanvasRenderingContext2D,
  rng: Rng,
  pal: Palette,
  w: number,
  h: number,
  count: number,
): void {
  ctx.save();
  ctx.fillStyle = pal.noise;
  for (let i = 0; i < count; i++) {
    ctx.globalAlpha = rng.range(0.15, 0.55);
    const r = rng.range(0.5, 1.8);
    ctx.beginPath();
    ctx.arc(rng.range(0, w), rng.range(0, h), r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
