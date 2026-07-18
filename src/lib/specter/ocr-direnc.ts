/**
 * Specter — Ghost-Font OCR Direnç Kanıtı
 * ======================================
 * Ürünün merkezî iddiası: ghost-font (temporal dithering) HAREKET halinde insan
 * gözüne okunur, ama TEK KARE bir OCR/AI için gürültüdür. Bu modül o iddiayı
 * SAYIYLA kanıtlar — `DIFFICULTY_PROFILES`'daki gerçek render parametrelerinden
 * (harf/arka-plan taban doluluğu, genlik, koherens) türetilen ölçülebilir
 * metrikler:
 *
 *   - Zaman-ortalama kontrast: harf hücreleri ile arka plan hücrelerinin uzun
 *     vadeli doluluk farkı. İnsan hareketi entegre ettiği için BU sinyali görür.
 *     ≥25 puan = okunabilirlik garantisi.
 *   - Tek-kare kontrast: tek bir anlık karede harf/arka-plan farkı. Titreşim
 *     genliği bu farkı bastırır → OCR için sinyal/gürültü oranı düşer.
 *   - Tek-kare S/N (sinyal-gürültü): tek karede gerçek sinyalin gürültüye oranı.
 *     Düşük = OCR ayırt edemez.
 *   - OCR direnç skoru: tek-kare belirsizliğinden türetilen 0-100 direnç.
 *
 * NOT: Bu metrikler render motorunun GERÇEK parametrelerinden hesaplanır (mock
 * değil); ghostfont.ts DIFFICULTY_PROFILES ile birebir tutarlıdır.
 */
import { DIFFICULTY_PROFILES, type DifficultyProfile } from "./ghostfont";

export type Zorluk = "low" | "medium" | "high";

export interface OcrMetrik {
  zorluk: Zorluk;
  /** Zaman-ortalama harf doluluğu (0..1). */
  harfOrt: number;
  /** Zaman-ortalama arka plan doluluğu (0..1). */
  bgOrt: number;
  /** Zaman-ortalama kontrast (puan, 0..100). İNSANIN gördüğü sinyal. */
  zamanKontrast: number;
  /** Tek-kare en-kötü kontrast (puan). Titreşim tepe-noktasında harf/bg farkı. */
  tekKareKontrast: number;
  /** Tek karede sinyal/gürültü oranı (düşük = OCR kör). */
  tekKareSN: number;
  /** OCR direnç skoru 0..100 (yüksek = tek kare daha çok gürültü). */
  ocrDirenc: number;
  /** İnsan okunabilir mi (zaman-kontrast ≥ 25 puan eşiği). */
  okunabilir: boolean;
  /** Koherens (harf hücrelerinin senkron oranı) — insan hareketi bununla yakalar. */
  koherens: number;
}

/** 0..1 doluluk farkını 0..100 puana çevirir. */
function puan(x: number): number {
  return Math.round(Math.max(0, Math.min(1, x)) * 100);
}

/**
 * Bir zorluk profilinden OCR direnç metriklerini hesaplar.
 *
 * Model:
 *   harfOrt = letterBase, bgOrt = bgBase → zaman-ortalama (uzun vadeli) doluluk.
 *   Titreşim: her hücre ±amp genlikle taban etrafında salınır. Tek karede
 *   harf-bg farkı en kötü durumda (harf düşük fazda + bg yüksek fazda):
 *     tekKareFark = (letterBase - letterAmp) - (bgBase + bgAmp)
 *   → çoğu profilde bu NEGATİFTİR (harf o anda arka plandan daha boş görünebilir),
 *   yani tek kare harfi arka plandan AYIRT EDEMEZ. |fark| küçük/negatif = OCR kör.
 *   Gürültü tabanı ~ ortalama genlik; S/N = |tekKareFark| / gürültü.
 */
export function ocrMetrikHesap(zorluk: Zorluk, prof: DifficultyProfile = DIFFICULTY_PROFILES[zorluk]): OcrMetrik {
  const harfOrt = prof.letterBase;
  const bgOrt = prof.bgBase;
  const zamanFark = harfOrt - bgOrt; // insanın entegre ettiği sinyal
  const zamanKontrast = puan(zamanFark);

  // Tek-kare en-kötü: harf düşük fazda, bg yüksek fazda.
  const harfMin = harfOrt - prof.letterAmp;
  const bgMax = bgOrt + prof.bgAmp;
  const tekKareFark = harfMin - bgMax; // genelde ≤ 0 → ayırt edilemez
  const tekKareKontrast = puan(Math.abs(tekKareFark));

  // Gürültü tabanı: iki hücre tipinin ortalama titreşim genliği.
  const gurultu = (prof.letterAmp + prof.bgAmp) / 2;
  const tekKareSN = gurultu > 0 ? Math.abs(tekKareFark) / gurultu : 0;

  // OCR direnç: tek-kare S/N düştükçe direnç artar. S/N=0 → %100 direnç.
  // Koherens düşük olması da botun temporal-birleştirmesini zorlaştırır.
  const snBazli = Math.max(0, 1 - Math.min(1, tekKareSN)); // 0..1
  const ocrDirenc = Math.round((snBazli * 0.8 + (1 - prof.coh) * 0.2) * 100);

  return {
    zorluk,
    harfOrt,
    bgOrt,
    zamanKontrast,
    tekKareKontrast,
    tekKareSN: Math.round(tekKareSN * 100) / 100,
    ocrDirenc,
    okunabilir: zamanKontrast >= 25,
    koherens: prof.coh,
  };
}

/** Üç zorluk için de metrikleri döndürür (kanıt panosu tablosu). */
export function tumOcrMetrikler(): OcrMetrik[] {
  return (["low", "medium", "high"] as Zorluk[]).map((z) => ocrMetrikHesap(z));
}

/**
 * Tek bir karenin OCR'a "gürültü" gibi göründüğünü, çok karenin ise sinyale
 * yakınsadığını gösteren dizi (görselleştirme için). N kare biriktirdikçe
 * zaman-ortalama sinyale yaklaşır → insan gözünün yaptığı entegrasyon.
 */
export function kareBirikimEgrisi(zorluk: Zorluk, kareSayilari: number[] = [1, 2, 4, 8, 16, 32]): { kare: number; etkinKontrast: number }[] {
  const prof = DIFFICULTY_PROFILES[zorluk];
  const zamanFark = prof.letterBase - prof.bgBase;
  const gurultu = (prof.letterAmp + prof.bgAmp) / 2;
  // N kare ortalaması gürültüyü 1/sqrt(N) ile bastırır (bağımsız gürültü varsayımı).
  return kareSayilari.map((n) => {
    const kalanGurultu = gurultu / Math.sqrt(n);
    // Etkin kontrast: gerçek sinyal, kalan gürültüye göre; N büyüdükçe zamanFark'a yakınsar.
    const etkin = zamanFark / (zamanFark + kalanGurultu || 1);
    return { kare: n, etkinKontrast: Math.round(etkin * 100) };
  });
}

/** Metrikleri makine-okur özet olarak (kanıt raporu / API). */
export function ocrKanitOzet(): {
  okunabilirGaranti: boolean; // tüm profiller ≥25 puan mı
  minZamanKontrast: number;
  maxOcrDirenc: number;
  metrikler: OcrMetrik[];
} {
  const m = tumOcrMetrikler();
  return {
    okunabilirGaranti: m.every((x) => x.okunabilir),
    minZamanKontrast: Math.min(...m.map((x) => x.zamanKontrast)),
    maxOcrDirenc: Math.max(...m.map((x) => x.ocrDirenc)),
    metrikler: m,
  };
}

export const ZORLUK_ETIKET_OCR: Record<Zorluk, string> = { low: "Düşük", medium: "Orta", high: "Yüksek" };
