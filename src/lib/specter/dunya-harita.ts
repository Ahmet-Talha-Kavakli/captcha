/**
 * Specter — Çevrimdışı dünya haritası (gerçek kıta silüetleri)
 * ===========================================================
 * Tile/Mapbox yok (offline demo, API-anahtarı/CSP kısıtı). Bunun yerine
 * GERÇEK KITA SINIRLARI olan, eşdikdörtgen (equirectangular) projeksiyona
 * hizalı bir vektör dünya haritası gömülür. Kıtalar tanınabilir:
 * Kuzey/Güney Amerika, Avrupa, Afrika, Asya, Okyanusya.
 *
 * KOORDİNAT HİZASI (kritik):
 *   Bu path'ler viewBox `0 0 1000 500` (2:1) içinde çizilir ve tam olarak
 *   ulke-koordinat.ts'deki `projeksiyon()` ile aynı eşdikdörtgen kurala uyar:
 *     x = (lon + 180) / 360 * W
 *     y = (90  - lat) / 180 * H
 *   Böylece bir ülkenin lat/lon merkezi, haritada doğru kıtanın üzerine düşer.
 *
 * Determinizm: SAF — Date.now / Math.random yok. Path string'leri sabittir.
 */

/** Harita viewBox genişliği (eşdikdörtgen 2:1). */
export const HARITA_W = 1000;
/** Harita viewBox yüksekliği. */
export const HARITA_H = 500;

/**
 * Kıta path'leri. Her biri stilize ama coğrafi olarak tanınabilir bir kıta
 * silüetidir; equirectangular grid'e elle hizalanmıştır. Path'ler nokta
 * dizileriyle çizilmiştir (M ... L ... Z) — düşük poligon, temiz, hafif.
 */
export const KITA_PATHLERI: { ad: string; d: string }[] = [
  {
    ad: "Kuzey Amerika",
    d: "M 120 95 L 175 78 L 250 72 L 300 82 L 292 104 L 250 108 L 268 128 L 245 150 L 262 168 L 238 186 L 250 205 L 224 222 L 210 250 L 188 236 L 196 208 L 176 190 L 190 168 L 168 150 L 182 128 L 150 118 L 128 132 L 110 118 L 96 96 Z",
  },
  {
    ad: "Kuzey Amerika - kuzey adalar",
    d: "M 300 55 L 360 48 L 402 60 L 380 78 L 340 74 L 312 66 Z",
  },
  {
    ad: "Grönland",
    d: "M 415 48 L 462 42 L 478 66 L 458 92 L 428 84 L 420 64 Z",
  },
  {
    ad: "Orta Amerika",
    d: "M 210 250 L 232 244 L 246 264 L 262 288 L 276 306 L 268 320 L 250 300 L 236 280 L 218 266 Z",
  },
  {
    ad: "Güney Amerika",
    d: "M 320 268 L 352 274 L 366 296 L 356 322 L 360 352 L 350 388 L 336 420 L 318 452 L 302 470 L 292 446 L 300 414 L 286 382 L 300 350 L 300 318 L 288 296 Z",
  },
  {
    ad: "Avrupa",
    d: "M 470 108 L 510 100 L 540 108 L 528 126 L 552 122 L 566 138 L 548 152 L 566 160 L 540 172 L 518 162 L 500 172 L 486 158 L 502 144 L 480 138 L 494 122 L 472 122 Z",
  },
  {
    ad: "İskandinavya",
    d: "M 512 66 L 536 58 L 552 74 L 540 96 L 522 100 L 514 84 Z",
  },
  {
    ad: "Britanya",
    d: "M 460 118 L 476 112 L 480 130 L 466 138 L 456 128 Z",
  },
  {
    ad: "Afrika",
    d: "M 494 200 L 540 190 L 578 196 L 596 220 L 590 252 L 606 280 L 594 320 L 570 356 L 548 378 L 528 360 L 522 328 L 506 300 L 500 268 L 486 240 L 490 216 Z",
  },
  {
    ad: "Madagaskar",
    d: "M 606 330 L 620 326 L 626 350 L 616 366 L 606 350 Z",
  },
  {
    ad: "Rusya / Kuzey Asya",
    d: "M 552 88 L 620 78 L 700 76 L 780 84 L 850 96 L 900 108 L 870 128 L 800 122 L 730 130 L 660 126 L 600 132 L 566 122 L 556 104 Z",
  },
  {
    ad: "Ortadoğu",
    d: "M 566 160 L 600 152 L 628 164 L 640 186 L 624 200 L 600 196 L 580 182 L 570 170 Z",
  },
  {
    ad: "Orta / Güney Asya",
    d: "M 640 148 L 700 140 L 730 152 L 720 178 L 700 196 L 720 216 L 700 240 L 680 224 L 668 200 L 646 186 L 636 166 Z",
  },
  {
    ad: "Doğu Asya",
    d: "M 730 152 L 800 146 L 850 158 L 838 186 L 812 200 L 786 192 L 764 202 L 748 184 L 736 168 Z",
  },
  {
    ad: "Güneydoğu Asya",
    d: "M 748 214 L 782 210 L 806 226 L 792 250 L 768 258 L 752 242 L 744 226 Z",
  },
  {
    ad: "Endonezya",
    d: "M 776 264 L 838 258 L 872 268 L 858 286 L 812 288 L 782 280 Z",
  },
  {
    ad: "Japonya",
    d: "M 862 158 L 878 150 L 888 168 L 878 190 L 866 178 Z",
  },
  {
    ad: "Avustralya",
    d: "M 812 320 L 866 310 L 908 322 L 920 352 L 900 384 L 858 392 L 820 374 L 806 344 Z",
  },
  {
    ad: "Yeni Zelanda",
    d: "M 936 388 L 952 382 L 958 404 L 946 420 L 936 404 Z",
  },
];

/**
 * Zarif enlem/boylam ızgara çizgileri (referans grid). SVG viewBox
 * `0 0 1000 500` içinde piksel koordinatları döndürür.
 */
export function gridCizgileri(): { yatay: number[]; dikey: number[] } {
  const yatay: number[] = [];
  const dikey: number[] = [];
  // Her 30° enlem (y)
  for (let lat = 60; lat >= -60; lat -= 30) {
    yatay.push(((90 - lat) / 180) * HARITA_H);
  }
  // Her 30° boylam (x)
  for (let lon = -150; lon <= 150; lon += 30) {
    dikey.push(((lon + 180) / 360) * HARITA_W);
  }
  return { yatay, dikey };
}
