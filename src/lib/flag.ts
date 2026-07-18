/**
 * ISO2 ülke kodundan emoji bayrak üretir (sıfır bağımlılık).
 * Regional Indicator Symbols kullanır: "TR" → 🇹🇷
 */
export function bayrak(kod: string): string {
  if (!kod || kod.length !== 2) return "🏳️";
  const üst = kod.toUpperCase();
  if (!/^[A-Z]{2}$/.test(üst)) return "🏳️";
  const base = 0x1f1e6; // 🇦
  return String.fromCodePoint(base + (üst.charCodeAt(0) - 65), base + (üst.charCodeAt(1) - 65));
}

/** Ülke kodu → Türkçe ad (yaygın olanlar). */
export const ULKE_AD: Record<string, string> = {
  TR: "Türkiye", US: "ABD", RU: "Rusya", CN: "Çin", DE: "Almanya", NL: "Hollanda",
  BR: "Brezilya", IN: "Hindistan", GB: "İngiltere", FR: "Fransa", UA: "Ukrayna",
  VN: "Vietnam", ID: "Endonezya", IR: "İran",
};
