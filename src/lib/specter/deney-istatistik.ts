/**
 * Specter — A/B Deney İstatistik Motoru
 * =====================================
 * Deneyler ekranında satır-içi basit bir z-testi vardı; bu modül onu GERÇEK bir
 * istatistik kütüphanesine çıkarır: iki-oran z-testi + p-değeri + Wilson güven
 * aralığı + istatistiksel güç (power) + hedef etki için gereken örneklem boyutu
 * + sıralı-test (peeking) uyarısı. Böylece "kazanan B" demek yerine "B, %95
 * güvenle %X-%Y bandında daha iyi ve karar için yeterli örneğe ulaştın/ulaşmadın"
 * diyebiliriz — yüzeysel değil, karar-kalitesinde.
 *
 * Saf/deterministik: Date.now/Math.random YOK.
 */

/** Standart normal CDF (Abramowitz-Stegun) → P(Z ≤ z). */
export function normCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (z > 0) p = 1 - p;
  return p;
}

/** Standart normal ters-CDF (kuantil) — Acklam yaklaşımı. Örneklem boyutu için. */
export function normInv(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.383577518672690e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const pl = 0.02425, ph = 1 - pl;
  let q, r;
  if (p < pl) { q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  if (p <= ph) { q = p - 0.5; r = q * q; return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1); }
  q = Math.sqrt(-2 * Math.log(1 - p));
  return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
}

export interface WilsonAralik {
  alt: number;
  ust: number;
  merkez: number;
}

/** Wilson skor güven aralığı — küçük örneklemde bile sağlam oran aralığı. */
export function wilsonAralik(basari: number, n: number, guvenZ = 1.96): WilsonAralik {
  if (n === 0) return { alt: 0, ust: 0, merkez: 0 };
  const p = basari / n;
  const z2 = guvenZ * guvenZ;
  const payda = 1 + z2 / n;
  const merkez = (p + z2 / (2 * n)) / payda;
  const yari = (guvenZ * Math.sqrt((p * (1 - p) + z2 / (4 * n)) / n)) / payda;
  return { alt: Math.max(0, merkez - yari), ust: Math.min(1, merkez + yari), merkez };
}

export interface DeneyGrup {
  n: number; // gösterim
  basari: number; // geçiş ya da engelleme (metriğe göre)
}

export interface DeneyAnaliz {
  pA: number;
  pB: number;
  fark: number; // pB - pA (yüzde puan)
  bagilFark: number; // %
  z: number;
  pDegeri: number; // iki kuyruk
  guvenYuzde: number; // (1 - p) * 100
  anlamli: boolean; // p < 0.05
  kazanan: "A" | "B" | "esit";
  ciA: WilsonAralik;
  ciB: WilsonAralik;
  farkCiAlt: number; // farkın %95 GA alt
  farkCiUst: number;
  guc: number; // istatistiksel güç (power) %
  yeterliOrnek: boolean; // güç ≥ %80 mı
  gerekenN: number; // mevcut etkiyi %80 güçle görmek için grup başına gereken n
}

/**
 * İki-oran karşılaştırması + tam istatistiksel analiz.
 * @param a kontrol grubu, @param b varyant grubu, @param alfa yanılma (0.05).
 */
export function deneyAnaliz(a: DeneyGrup, b: DeneyGrup, alfa = 0.05): DeneyAnaliz {
  const pA = a.n ? a.basari / a.n : 0;
  const pB = b.n ? b.basari / b.n : 0;
  const zAlfa = normInv(1 - alfa / 2); // ~1.96
  const zBeta = normInv(0.8); // %80 güç için ~0.84

  // Havuzlanmış oran → z-testi.
  const pPool = a.n + b.n ? (a.basari + b.basari) / (a.n + b.n) : 0;
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / (a.n || 1) + 1 / (b.n || 1))) || 1e-9;
  const z = (pB - pA) / se;
  const pDegeri = 2 * (1 - normCdf(Math.abs(z)));
  const guvenYuzde = Math.max(0, Math.min(100, (1 - pDegeri) * 100));
  const anlamli = pDegeri < alfa && a.n > 0 && b.n > 0;

  const fark = (pB - pA) * 100;
  const dusuk = Math.min(pA, pB) || 1e-9;
  const bagilFark = (Math.abs(pB - pA) / dusuk) * 100;

  const ciA = wilsonAralik(a.basari, a.n, zAlfa);
  const ciB = wilsonAralik(b.basari, b.n, zAlfa);
  // Farkın güven aralığı (bağımsız SE ile).
  const seFark = Math.sqrt((pA * (1 - pA)) / (a.n || 1) + (pB * (1 - pB)) / (b.n || 1)) || 1e-9;
  const farkCiAlt = (pB - pA - zAlfa * seFark) * 100;
  const farkCiUst = (pB - pA + zAlfa * seFark) * 100;

  // İstatistiksel güç: mevcut n ve etki büyüklüğüyle H0'ı reddetme olasılığı.
  const etki = Math.abs(pB - pA);
  const seAlt = Math.sqrt((pA * (1 - pA)) / (a.n || 1) + (pB * (1 - pB)) / (b.n || 1)) || 1e-9;
  const guc = etki > 0 ? Math.max(0, Math.min(100, normCdf(etki / seAlt - zAlfa) * 100)) : 0;

  // Bu etkiyi %80 güçle görmek için grup başına gereken n.
  const pOrt = (pA + pB) / 2;
  const gerekenN = etki > 0
    ? Math.ceil((2 * pOrt * (1 - pOrt) * (zAlfa + zBeta) ** 2) / (etki * etki))
    : Infinity;

  const kazanan: "A" | "B" | "esit" = Math.abs(z) < 0.01 || !anlamli ? "esit" : z > 0 ? "B" : "A";

  return {
    pA, pB, fark, bagilFark, z, pDegeri, guvenYuzde, anlamli, kazanan,
    ciA, ciB, farkCiAlt, farkCiUst,
    guc, yeterliOrnek: guc >= 80,
    gerekenN: Number.isFinite(gerekenN) ? gerekenN : 0,
  };
}

/** Sıralı-test (peeking) uyarısı: örneklem hedefe ulaşmadan "kazanan" ilan riski. */
export function peekingUyarisi(mevcutN: number, gerekenN: number, anlamli: boolean): string | null {
  if (!anlamli) return null;
  if (gerekenN > 0 && mevcutN < gerekenN * 0.9) {
    return `Erken sonuç: örneklem gerekenin (${gerekenN.toLocaleString("tr-TR")}/grup) altında. Sonuç henüz güvenilir olmayabilir — deneyi sürdür.`;
  }
  return null;
}

export const KARAR_ETIKET: Record<"A" | "B" | "esit", string> = { A: "Kontrol (A)", B: "Varyant (B)", esit: "Belirsiz" };
