/**
 * Specter — Ülke koordinat tablosu + eşdikdörtgen projeksiyon
 * ===========================================================
 * BotEvent'lerde yalnızca `country` (ISO2) var, koordinat yok. Canlı Saldırı
 * Haritası olayları harita üzerine yerleştirmek için ülke merkezlerini
 * (yaklaşık centroid: [enlem, boylam]) burada tutar.
 *
 * Determinizm: Bu dosya SAF'tır — Date.now / Math.random / new Date yoktur.
 * Değerler el ile girilmiş sabitlerdir; coğrafi olarak "yeterince doğru"
 * (mükemmel değil) — stilize bir dünya silüeti için fazlasıyla iyi.
 */

/** ISO2 ülke kodu → [enlem, boylam] (yaklaşık merkez). */
export const ULKE_KOORDINAT: Record<string, [number, number]> = {
  // --- Avrupa ---
  TR: [39.0, 35.0],
  DE: [51.2, 10.4],
  FR: [46.6, 2.2],
  GB: [54.0, -2.0],
  NL: [52.2, 5.3],
  ES: [40.2, -3.7],
  IT: [42.8, 12.6],
  RU: [61.5, 90.0],
  UA: [48.4, 31.2],
  PL: [52.1, 19.4],
  SE: [62.2, 15.6],
  NO: [64.6, 12.1],
  FI: [64.5, 26.0],
  DK: [56.0, 9.5],
  IE: [53.2, -8.2],
  BE: [50.6, 4.6],
  CH: [46.8, 8.2],
  AT: [47.6, 14.1],
  CZ: [49.8, 15.5],
  RO: [45.9, 24.9],
  GR: [39.1, 22.0],
  PT: [39.6, -8.0],
  HU: [47.2, 19.4],
  BG: [42.7, 25.3],
  RS: [44.0, 21.0],

  // --- Ortadoğu & Orta Asya ---
  IR: [32.4, 53.7],
  IL: [31.4, 35.0],
  SA: [24.0, 45.1],
  AE: [23.9, 54.3],
  IQ: [33.2, 43.7],
  QA: [25.3, 51.2],
  KZ: [48.2, 66.9],
  PK: [30.4, 69.3],
  AF: [33.9, 67.7],

  // --- Asya-Pasifik ---
  CN: [35.9, 104.2],
  IN: [22.6, 79.6],
  JP: [36.2, 138.3],
  KR: [36.4, 127.9],
  KP: [40.3, 127.5],
  ID: [-2.5, 118.0],
  VN: [16.2, 107.9],
  TH: [15.1, 101.0],
  MY: [4.2, 108.0],
  SG: [1.35, 103.8],
  PH: [12.9, 122.9],
  TW: [23.7, 121.0],
  HK: [22.3, 114.2],
  BD: [23.7, 90.4],
  AU: [-25.7, 134.5],
  NZ: [-41.8, 172.9],

  // --- Amerika ---
  US: [39.8, -98.6],
  CA: [58.0, -104.0],
  MX: [23.6, -102.5],
  BR: [-10.8, -52.9],
  AR: [-38.4, -63.6],
  CO: [4.6, -74.3],
  CL: [-35.7, -71.5],
  PE: [-9.2, -75.0],
  VE: [7.1, -66.1],

  // --- Afrika ---
  ZA: [-29.0, 24.7],
  NG: [9.1, 8.7],
  EG: [26.8, 30.8],
  KE: [0.2, 37.9],
  MA: [31.8, -7.1],
  DZ: [28.0, 2.6],
  ET: [9.1, 40.5],
  TN: [34.0, 9.6],
  GH: [7.9, -1.0],
};

/**
 * Eşdikdörtgen (equirectangular) projeksiyon: enlem/boylam → SVG x/y.
 *  x = (boylam + 180) / 360 * W
 *  y = (90 - enlem) / 180 * H
 * W/H harita viewBox boyutları (piksel). Saf fonksiyon.
 */
export function projeksiyon(
  lat: number,
  lon: number,
  W: number,
  H: number,
): { x: number; y: number } {
  const x = ((lon + 180) / 360) * W;
  const y = ((90 - lat) / 180) * H;
  return { x, y };
}

/** Bir ISO2 kodu için koordinat getir (yoksa null). */
export function ulkeKoordinat(kod: string): [number, number] | null {
  return ULKE_KOORDINAT[kod?.toUpperCase()] ?? null;
}
