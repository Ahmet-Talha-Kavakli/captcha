/**
 * Specter — Skor Kalibrasyonu & Model Drift İzleme
 * ================================================
 * Bir bot sınıflandırıcı "%90 eminim" diyorsa, gerçekten %90 doğru olmalı. Bu
 * KALİBRASYONdur. Ayrıca trafik deseni zamanla değişir (yeni bot dalgaları) →
 * model DRIFT eder ve güvenilirliği düşer. Bu modül iki sağlık metriği çıkarır:
 *   1) Kalibrasyon: güvenilirlik diyagramı (bin'lenmiş tahmini-vs-gerçek) + ECE
 *      (Beklenen Kalibrasyon Hatası). Düşük ECE = güvenilir skorlar.
 *   2) Drift: referans dönem vs güncel dönem özellik dağılımı farkı (PSI —
 *      Popülasyon Kararlılık İndeksi). Yüksek PSI = dağılım kaymış, model
 *      yeniden-değerlendirilmeli.
 *
 * Saf/deterministik: Date.now/Math.random YOK — girdi olaylardan.
 */
import type { BotEvent } from "@/lib/db/schema";

const KOTU = new Set(["scraper", "credential_stuffing", "automation", "ai_agent", "ddos", "spam"]);

export interface KalibrasyonBin {
  aralik: string; // "0.0-0.1" gibi
  altSinir: number;
  ortTahmin: number; // bu bin'deki ortalama tahmin (skor)
  gercekOran: number; // bu bin'de gerçekten bot olan oran
  sayi: number;
}

export interface KalibrasyonSonuc {
  binler: KalibrasyonBin[];
  /** Beklenen Kalibrasyon Hatası 0..1 (düşük iyi). */
  ece: number;
  /** Kalibrasyon durumu. */
  durum: "iyi" | "orta" | "zayif";
  toplam: number;
}

/**
 * Kalibrasyon analizi. "botluk olasılığı" = (1 - insanlık skoru); gerçek etiket =
 * olayın kötü sınıfta olup olmadığı. Skorları 10 bin'e ayırıp her bin'de tahmin
 * ile gerçeği kıyaslar.
 */
export function kalibrasyonAnaliz(events: BotEvent[]): KalibrasyonSonuc {
  const N = 10;
  const binlerRaw: { tahminTop: number; gercekTop: number; sayi: number }[] =
    Array.from({ length: N }, () => ({ tahminTop: 0, gercekTop: 0, sayi: 0 }));

  for (const e of events) {
    const botOlasilik = 1 - e.score; // model "bot" olasılığı
    const gercek = KOTU.has(e.botClass) ? 1 : 0;
    let idx = Math.floor(botOlasilik * N);
    if (idx >= N) idx = N - 1;
    if (idx < 0) idx = 0;
    binlerRaw[idx].tahminTop += botOlasilik;
    binlerRaw[idx].gercekTop += gercek;
    binlerRaw[idx].sayi++;
  }

  const toplam = events.length || 1;
  let ece = 0;
  const binler: KalibrasyonBin[] = binlerRaw.map((b, i) => {
    const ortTahmin = b.sayi ? b.tahminTop / b.sayi : 0;
    const gercekOran = b.sayi ? b.gercekTop / b.sayi : 0;
    ece += (b.sayi / toplam) * Math.abs(ortTahmin - gercekOran);
    return {
      aralik: `${(i / N).toFixed(1)}-${((i + 1) / N).toFixed(1)}`,
      altSinir: i / N, ortTahmin, gercekOran, sayi: b.sayi,
    };
  });

  const durum: KalibrasyonSonuc["durum"] = ece < 0.05 ? "iyi" : ece < 0.12 ? "orta" : "zayif";
  return { binler, ece: Math.round(ece * 1000) / 1000, durum, toplam: events.length };
}

/* ------------------------------------------------------- Drift (PSI) */

export interface DriftOzellik {
  ad: string;
  psi: number;
  durum: "kararli" | "kayma" | "belirgin-kayma";
  detay: string;
}

export interface DriftSonuc {
  ozellikler: DriftOzellik[];
  /** Genel drift skoru (max PSI). */
  genelPsi: number;
  durum: "kararli" | "izlemede" | "drift";
  referansSayi: number;
  guncelSayi: number;
}

/** İki dağılım arasında PSI hesaplar. */
function psiHesap(ref: number[], gun: number[]): number {
  const refTop = ref.reduce((a, b) => a + b, 0) || 1;
  const gunTop = gun.reduce((a, b) => a + b, 0) || 1;
  let psi = 0;
  for (let i = 0; i < ref.length; i++) {
    const p = Math.max(ref[i] / refTop, 0.0001);
    const q = Math.max(gun[i] / gunTop, 0.0001);
    psi += (q - p) * Math.log(q / p);
  }
  return psi;
}

/** Bir olay kümesini kategorik özelliğin kova-sayımına çevirir. */
function kategoriDagilim<T extends string>(events: BotEvent[], fn: (e: BotEvent) => T, kategoriler: T[]): number[] {
  const m = new Map<T, number>(kategoriler.map((k) => [k, 0]));
  for (const e of events) { const k = fn(e); if (m.has(k)) m.set(k, (m.get(k) || 0) + 1); }
  return kategoriler.map((k) => m.get(k) || 0);
}

function skorDagilim(events: BotEvent[]): number[] {
  const bins = new Array(10).fill(0);
  for (const e of events) { let i = Math.floor(e.score * 10); if (i >= 10) i = 9; if (i < 0) i = 0; bins[i]++; }
  return bins;
}

const SINIFLAR = ["human", "good_bot", "automation", "scraper", "credential_stuffing", "ai_agent", "ddos", "spam"];

/**
 * Drift analizi: olayları zamana göre referans (eski yarı) ve güncel (yeni yarı)
 * olarak böler, önemli özelliklerde PSI hesaplar.
 */
export function driftAnaliz(events: BotEvent[]): DriftSonuc {
  const sirali = [...events].sort((a, b) => a.ts - b.ts);
  const orta = Math.floor(sirali.length / 2);
  const ref = sirali.slice(0, orta);
  const gun = sirali.slice(orta);

  const psiDurum = (psi: number): DriftOzellik["durum"] => psi < 0.1 ? "kararli" : psi < 0.25 ? "kayma" : "belirgin-kayma";
  const detay = (psi: number) => psi < 0.1 ? "Dağılım kararlı." : psi < 0.25 ? "Hafif kayma — izle." : "Belirgin kayma — modeli yeniden değerlendir.";

  const ozellikler: DriftOzellik[] = [];
  const ekle = (ad: string, refD: number[], gunD: number[]) => {
    const psi = Math.round(psiHesap(refD, gunD) * 1000) / 1000;
    ozellikler.push({ ad, psi, durum: psiDurum(psi), detay: detay(psi) });
  };

  ekle("İnsanlık skoru dağılımı", skorDagilim(ref), skorDagilim(gun));
  ekle("Bot sınıfı dağılımı", kategoriDagilim(ref, (e) => e.botClass, SINIFLAR as never), kategoriDagilim(gun, (e) => e.botClass, SINIFLAR as never));
  const kararlar = ["allowed", "challenged", "blocked", "flagged"];
  ekle("Karar dağılımı", kategoriDagilim(ref, (e) => e.verdict, kararlar as never), kategoriDagilim(gun, (e) => e.verdict, kararlar as never));

  const genelPsi = ozellikler.length ? Math.max(...ozellikler.map((o) => o.psi)) : 0;
  const durum: DriftSonuc["durum"] = genelPsi >= 0.25 ? "drift" : genelPsi >= 0.1 ? "izlemede" : "kararli";

  return { ozellikler, genelPsi, durum, referansSayi: ref.length, guncelSayi: gun.length };
}

export const DURUM_RENK: Record<string, string> = {
  iyi: "#16a34a", orta: "#d97706", zayif: "#dc2626",
  kararli: "#16a34a", izlemede: "#d97706", drift: "#dc2626",
  kayma: "#d97706", "belirgin-kayma": "#dc2626",
};
