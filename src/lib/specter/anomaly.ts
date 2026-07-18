/**
 * Specter — Anomali Tespit Motoru
 * ================================
 * Trafik zaman serisinde istatistiksel sapmaları (spike/drop), coğrafya
 * kaymalarını, bot-oranı sıçramalarını ve skor dağılımı bozulmalarını
 * yakalar. Z-skoru (ortalamadan kaç standart sapma) + EWMA temelli basit
 * ama etkili bir tespit; gerçek üründe bu STL/Prophet olurdu.
 *
 * Çıktı: insan-okunur anomali kartları (tür, şiddet, açıklama, öneri) —
 * Genel Bakış'ta otomatik uyarı, Analitik'te içgörü olarak gösterilir.
 */

import type { BotEvent } from "@/lib/db/schema";

export type AnomaliTur = "trafik_artis" | "trafik_dus" | "bot_orani" | "cografya" | "skor_dusus" | "ai_ajan" | "yeni_asn";
export type AnomaliSiddet = "dusuk" | "orta" | "yuksek" | "kritik";

export interface Anomali {
  tur: AnomaliTur;
  siddet: AnomaliSiddet;
  baslik: string;
  aciklama: string;
  /** Sapma büyüklüğü (z-skor benzeri; yüksek = daha anormal). */
  skor: number;
  oneri?: string;
}

/** Bir sayı serisinin ortalama + std sapmasını hesapla. */
function istatistik(seri: number[]): { ort: number; std: number } {
  if (!seri.length) return { ort: 0, std: 0 };
  const ort = seri.reduce((a, b) => a + b, 0) / seri.length;
  const varyans = seri.reduce((a, b) => a + (b - ort) ** 2, 0) / seri.length;
  return { ort, std: Math.sqrt(varyans) };
}

function siddetBelirle(z: number): AnomaliSiddet {
  const a = Math.abs(z);
  if (a >= 4) return "kritik";
  if (a >= 3) return "yuksek";
  if (a >= 2) return "orta";
  return "dusuk";
}

/**
 * Olay akışından anomalileri tespit et. `events` en yeni önce sıralı olabilir;
 * biz ts'e göre gruplarız. Son ~48 saati saatlik kovalara böler, son saati
 * geçmiş dağılıma göre karşılaştırır.
 */
export function anomaliTespit(events: BotEvent[]): Anomali[] {
  const anomaliler: Anomali[] = [];
  if (events.length < 20) return anomaliler;

  const simdi = Date.now();
  const saat = 3600000;
  // Son 48 saati saatlik kovalara ayır.
  const kova = new Map<number, BotEvent[]>();
  for (const e of events) {
    const h = Math.floor((simdi - e.ts) / saat);
    if (h < 0 || h >= 48) continue;
    if (!kova.has(h)) kova.set(h, []);
    kova.get(h)!.push(e);
  }
  // Saatlik istek sayısı serisi (h=1..47 geçmiş, h=0 şimdi).
  const gecmisSayilar: number[] = [];
  for (let h = 47; h >= 1; h--) gecmisSayilar.push((kova.get(h) || []).length);
  const sonSaat = kova.get(0) || [];

  // 1) Trafik hacmi anomalisi (spike/drop)
  const { ort, std } = istatistik(gecmisSayilar.filter((x) => x > 0));
  if (std > 0 && sonSaat.length > 0) {
    const z = (sonSaat.length - ort) / std;
    if (z >= 2) {
      anomaliler.push({
        tur: "trafik_artis", siddet: siddetBelirle(z),
        baslik: "Trafik ani yükselişi",
        aciklama: `Son saatte ${sonSaat.length} istek — normalin ${(sonSaat.length / (ort || 1)).toFixed(1)}× üstünde (z=${z.toFixed(1)}).`,
        skor: z,
        oneri: "Koordineli bir kampanya olabilir; Tehdit İstihbaratı'nı ve kural motorunu kontrol et.",
      });
    } else if (z <= -2 && ort > 3) {
      anomaliler.push({
        tur: "trafik_dus", siddet: siddetBelirle(z),
        baslik: "Trafik ani düşüşü",
        aciklama: `Son saatte trafik normalin %${Math.round((1 - sonSaat.length / ort) * 100)} altında (z=${z.toFixed(1)}).`,
        skor: Math.abs(z),
        oneri: "Widget entegrasyonu veya site erişilebilirliğini doğrula.",
      });
    }
  }

  // 2) Bot oranı sıçraması
  const gecmisTumOlaylar = events.filter((e) => e.ts < simdi - saat && e.ts >= simdi - 48 * saat);
  const botOran = (list: BotEvent[]) =>
    list.length ? list.filter((e) => e.verdict === "blocked" || e.verdict === "challenged").length / list.length : 0;
  const gecmisBotOran = botOran(gecmisTumOlaylar);
  const sonBotOran = botOran(sonSaat);
  if (sonSaat.length >= 10 && sonBotOran > gecmisBotOran + 0.25) {
    anomaliler.push({
      tur: "bot_orani", siddet: sonBotOran > gecmisBotOran + 0.4 ? "yuksek" : "orta",
      baslik: "Bot oranı sıçraması",
      aciklama: `Bot oranı %${Math.round(gecmisBotOran * 100)} → %${Math.round(sonBotOran * 100)} yükseldi.`,
      skor: (sonBotOran - gecmisBotOran) * 10,
      oneri: "Yeni bir bot dalgası başlamış olabilir; agresif kural veya challenge modu düşün.",
    });
  }

  // 3) Coğrafya kayması — yeni baskın ülke
  const ulkeSay = (list: BotEvent[]) => {
    const m: Record<string, number> = {};
    for (const e of list) m[e.country] = (m[e.country] || 0) + 1;
    return m;
  };
  const gecmisUlke = ulkeSay(gecmisTumOlaylar);
  const sonUlke = ulkeSay(sonSaat);
  for (const [ulke, sayi] of Object.entries(sonUlke)) {
    const oranSon = sayi / (sonSaat.length || 1);
    const oranGecmis = (gecmisUlke[ulke] || 0) / (gecmisTumOlaylar.length || 1);
    if (sonSaat.length >= 10 && oranSon > 0.4 && oranSon > oranGecmis + 0.3) {
      anomaliler.push({
        tur: "cografya", siddet: "orta",
        baslik: `${ulke} kaynaklı ani yoğunlaşma`,
        aciklama: `Son saatteki isteklerin %${Math.round(oranSon * 100)}'i ${ulke} kaynaklı (normalde %${Math.round(oranGecmis * 100)}).`,
        skor: (oranSon - oranGecmis) * 10,
        oneri: `Coğrafi kural veya ${ulke} için ek doğrulama düşünülebilir.`,
      });
    }
  }

  // 4) AI ajan yoğunluğu
  const gecmisAi = gecmisTumOlaylar.filter((e) => e.botClass === "ai_agent").length / (gecmisTumOlaylar.length || 1);
  const sonAi = sonSaat.filter((e) => e.botClass === "ai_agent").length / (sonSaat.length || 1);
  if (sonSaat.length >= 8 && sonAi > 0.3 && sonAi > gecmisAi + 0.2) {
    anomaliler.push({
      tur: "ai_ajan", siddet: "orta",
      baslik: "AI ajan taraması yoğunlaştı",
      aciklama: `AI ajan trafiği %${Math.round(gecmisAi * 100)} → %${Math.round(sonAi * 100)} arttı.`,
      skor: (sonAi - gecmisAi) * 10,
      oneri: "AI Ajan İstihbaratı'ndan politikaları gözden geçir; eğitim botlarını engelle.",
    });
  }

  // 5) Skor dağılımı bozulması (ort insanlık skoru düşüşü)
  const ortSkor = (list: BotEvent[]) => (list.length ? list.reduce((a, e) => a + e.score, 0) / list.length : 0.5);
  const gecmisSkor = ortSkor(gecmisTumOlaylar);
  const sonSkor = ortSkor(sonSaat);
  if (sonSaat.length >= 10 && sonSkor < gecmisSkor - 0.15) {
    anomaliler.push({
      tur: "skor_dusus", siddet: sonSkor < gecmisSkor - 0.25 ? "yuksek" : "orta",
      baslik: "Ortalama insanlık skoru düştü",
      aciklama: `Ort. skor ${gecmisSkor.toFixed(2)} → ${sonSkor.toFixed(2)} (daha çok otomasyon).`,
      skor: (gecmisSkor - sonSkor) * 10,
      oneri: "Davranış eşiğini yükseltmeyi veya görünmez modu sıkılaştırmayı değerlendir.",
    });
  }

  // Şiddete göre sırala (en kritik önce).
  const sira: Record<AnomaliSiddet, number> = { kritik: 4, yuksek: 3, orta: 2, dusuk: 1 };
  anomaliler.sort((a, b) => sira[b.siddet] - sira[a.siddet] || b.skor - a.skor);
  return anomaliler;
}
