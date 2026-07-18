/**
 * Specter — Deterministik Rastgelelik
 * ------------------------------------
 * Ghost-font challenge'ının çekirdeği, aynı seed'in HEM sunucuda
 * (challenge üretimi + doğrulama) HEM tarayıcıda (render) aynı
 * sonucu üretmesine dayanır. Bu yüzden Math.random KULLANILMAZ;
 * bunun yerine seed'lenebilir bir PRNG (mulberry32) kullanılır.
 *
 * Böylece sunucu sadece küçük bir seed gönderir, tarayıcı o seed'den
 * tüm görsel challenge'ı (glyph seçimi, permütasyon, gürültü, çarpıtma)
 * yeniden üretir. Ağda hiçbir glyph/font/answer sızmaz.
 */

/** 32-bit seed'den deterministik 0..1 sayı üreticisi. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** String bir seed'i (challenge id gibi) 32-bit int'e çevirir (xfnv1a). */
export function hashSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

/** PRNG üzerine kurulu pratik yardımcılar. */
export class Rng {
  private next: () => number;

  constructor(seed: number | string) {
    const s = typeof seed === "string" ? hashSeed(seed) : seed;
    this.next = mulberry32(s);
  }

  /** [0, 1) */
  float(): number {
    return this.next();
  }

  /** [min, max) */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** [min, max] tamsayı */
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  /** Diziden rastgele bir eleman. */
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  /** Fisher-Yates — yeni karıştırılmış dizi döndürür. */
  shuffle<T>(arr: readonly T[]): T[] {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  /** true olma olasılığı p. */
  bool(p = 0.5): boolean {
    return this.next() < p;
  }
}
