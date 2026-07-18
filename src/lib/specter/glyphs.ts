/**
 * Specter — Ghost Font Glyph Definitions
 * ---------------------------------------
 * Her karakter, sistem fontlarından TAMAMEN bağımsız olarak, kendi
 * stroke (çizgi) tabanlı vektör tanımıyla çizilir. Bu, ghost-font
 * korumasının çekirdeğidir:
 *
 *   - HTML'de yazan karakter ile ekranda çizilen glyph birbirinden
 *     bağımsızdır (glyph-substitution).
 *   - Glyph'leri stroke seviyesinde kontrol ettiğimiz için OCR/vision
 *     modellerini şaşırtacak gürültü, çarpıtma ve deformasyon
 *     ekleyebiliriz (render.ts).
 *   - Hiçbir @font-face / .woff dosyası indirilmediği için botlar
 *     fontu tersine çevirip haritalayamaz.
 *
 * Koordinat sistemi: her glyph 0..1 aralığında normalize bir kutuda
 * tanımlanır. (0,0) sol-üst, (1,1) sağ-alt. Render sırasında hedef
 * boyuta ölçeklenir.
 */

export type Point = [number, number];
/** Bir stroke = ardışık noktalardan oluşan bir polyline. */
export type Stroke = Point[];
/** Bir glyph = bir veya daha fazla stroke. */
export type Glyph = Stroke[];

/**
 * Karakter havuzu. Görsel olarak birbirine karışabilecek karakterler
 * (0/O, 1/I/l, 5/S, 2/Z, 8/B) CAPTCHA'da kafa karıştırmasın diye
 * bilinçli olarak DIŞARIDA bırakıldı. İnsanın net okuyabileceği,
 * ayırt edilebilir bir alfabe.
 */
export const CHARSET = "34679ACDEFHJKLMNPRTUVWXY".split("");

// Kısa yardımcılar — glyph tanımlarını okunur tutmak için.
const p = (x: number, y: number): Point => [x, y];

/**
 * Stroke tabanlı glyph sözlüğü. Her tanım, insanların bu karakteri
 * elle yazarken izlediği doğal çizgi yapısına yakın tutuldu; böylece
 * gürültü eklendiğinde bile insan gözü kolayca çözer.
 */
export const GLYPHS: Record<string, Glyph> = {
  "3": [
    [p(0.15, 0.12), p(0.8, 0.12), p(0.45, 0.42), p(0.82, 0.6), p(0.75, 0.82), p(0.4, 0.9), p(0.12, 0.78)],
  ],
  "4": [
    [p(0.62, 0.1), p(0.62, 0.9)],
    [p(0.62, 0.1), p(0.12, 0.62), p(0.85, 0.62)],
  ],
  "6": [
    [p(0.7, 0.12), p(0.35, 0.2), p(0.18, 0.5), p(0.16, 0.75), p(0.35, 0.9), p(0.62, 0.88), p(0.78, 0.68), p(0.68, 0.5), p(0.4, 0.46), p(0.2, 0.56)],
  ],
  "7": [
    [p(0.14, 0.12), p(0.85, 0.12), p(0.42, 0.9)],
  ],
  "9": [
    [p(0.78, 0.5), p(0.6, 0.62), p(0.32, 0.56), p(0.22, 0.32), p(0.38, 0.14), p(0.66, 0.16), p(0.8, 0.38), p(0.78, 0.7), p(0.6, 0.88), p(0.32, 0.9)],
  ],
  A: [
    [p(0.1, 0.9), p(0.5, 0.1), p(0.9, 0.9)],
    [p(0.26, 0.58), p(0.74, 0.58)],
  ],
  C: [
    [p(0.82, 0.24), p(0.55, 0.12), p(0.28, 0.22), p(0.15, 0.5), p(0.28, 0.78), p(0.55, 0.88), p(0.82, 0.76)],
  ],
  D: [
    [p(0.18, 0.1), p(0.18, 0.9)],
    [p(0.18, 0.1), p(0.55, 0.14), p(0.8, 0.4), p(0.8, 0.6), p(0.55, 0.86), p(0.18, 0.9)],
  ],
  E: [
    [p(0.8, 0.12), p(0.18, 0.12), p(0.18, 0.9), p(0.8, 0.9)],
    [p(0.18, 0.5), p(0.66, 0.5)],
  ],
  F: [
    [p(0.8, 0.12), p(0.18, 0.12), p(0.18, 0.9)],
    [p(0.18, 0.5), p(0.66, 0.5)],
  ],
  H: [
    [p(0.16, 0.1), p(0.16, 0.9)],
    [p(0.84, 0.1), p(0.84, 0.9)],
    [p(0.16, 0.5), p(0.84, 0.5)],
  ],
  J: [
    [p(0.75, 0.12), p(0.75, 0.72), p(0.58, 0.9), p(0.32, 0.86), p(0.2, 0.66)],
  ],
  K: [
    [p(0.18, 0.1), p(0.18, 0.9)],
    [p(0.82, 0.1), p(0.18, 0.52)],
    [p(0.4, 0.44), p(0.82, 0.9)],
  ],
  L: [
    [p(0.2, 0.1), p(0.2, 0.9), p(0.8, 0.9)],
  ],
  M: [
    [p(0.12, 0.9), p(0.12, 0.1), p(0.5, 0.6), p(0.88, 0.1), p(0.88, 0.9)],
  ],
  N: [
    [p(0.16, 0.9), p(0.16, 0.1), p(0.84, 0.9), p(0.84, 0.1)],
  ],
  P: [
    [p(0.2, 0.9), p(0.2, 0.12), p(0.62, 0.14), p(0.8, 0.32), p(0.62, 0.5), p(0.2, 0.52)],
  ],
  R: [
    [p(0.2, 0.9), p(0.2, 0.12), p(0.62, 0.14), p(0.8, 0.32), p(0.62, 0.5), p(0.2, 0.52)],
    [p(0.42, 0.5), p(0.82, 0.9)],
  ],
  T: [
    [p(0.1, 0.12), p(0.9, 0.12)],
    [p(0.5, 0.12), p(0.5, 0.9)],
  ],
  U: [
    [p(0.16, 0.1), p(0.16, 0.66), p(0.34, 0.88), p(0.66, 0.88), p(0.84, 0.66), p(0.84, 0.1)],
  ],
  V: [
    [p(0.12, 0.1), p(0.5, 0.9), p(0.88, 0.1)],
  ],
  W: [
    [p(0.1, 0.1), p(0.28, 0.9), p(0.5, 0.4), p(0.72, 0.9), p(0.9, 0.1)],
  ],
  X: [
    [p(0.14, 0.1), p(0.86, 0.9)],
    [p(0.86, 0.1), p(0.14, 0.9)],
  ],
  Y: [
    [p(0.14, 0.1), p(0.5, 0.5), p(0.86, 0.1)],
    [p(0.5, 0.5), p(0.5, 0.9)],
  ],
};

/** Charset içinde glyph tanımı olmayan karakter kalmadığını doğrular. */
export function assertGlyphCoverage(): void {
  const missing = CHARSET.filter((c) => !GLYPHS[c]);
  if (missing.length) {
    throw new Error(`Specter: glyph tanımı eksik karakterler: ${missing.join(", ")}`);
  }
}
