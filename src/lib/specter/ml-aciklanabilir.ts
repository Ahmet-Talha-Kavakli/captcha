/**
 * Specter — ML Sınıflandırıcı Açıklanabilirlik Katmanı
 * ====================================================
 * Bir "kara kutu" bot sınıflandırıcı güvenilmezdir. Specter'ın sınıflandırıcısı
 * (classifier.ts botSiniflandir) zaten softmax olasılıkları + özellik katkıları
 * üretir. Bu katman o çıktıyı AÇIKLANABİLİR hale getirir: her kararın hangi
 * özelliklere dayandığını, güven dağılımını ve gerçek trafikteki karar dağılımını
 * çıkarır. Ayrıca bir "karşı-olgusal" (counterfactual) yardımcısı: hangi tek
 * sinyal değişse karar değişirdi?
 *
 * Saf/deterministik: Date.now/Math.random YOK.
 */
import { botSiniflandir, type SiniflandirmaGirdisi, type SiniflandirmaSonucu } from "@/lib/specter/classifier";
import type { BotEvent, BotClass } from "@/lib/db/schema";

export const SINIF_ETIKET: Record<BotClass, string> = {
  human: "İnsan", good_bot: "İyi bot", automation: "Otomasyon", scraper: "Kazıyıcı",
  credential_stuffing: "Kimlik doldurma", ai_agent: "AI ajan", ddos: "DDoS", spam: "Spam",
};

export interface AciklamaSonuc extends SiniflandirmaSonucu {
  /** Olasılıkları sıralı diziye çevirir (grafik için). */
  siraliOlasilik: { sinif: BotClass; olasilik: number }[];
  /** Karşı-olgusal: hangi tek değişiklik kararı değiştirir. */
  karsiOlgusal: { sinyal: string; degisiklik: string; yeniSinif: BotClass } | null;
  /** Güven yorumu. */
  guvenYorum: string;
}

/** Bir girdiyi sınıflandırıp açıklama zenginleştirmesi ekler. */
export function aciklamaliSiniflandir(g: SiniflandirmaGirdisi): AciklamaSonuc {
  const sonuc = botSiniflandir(g);
  const sirali = (Object.entries(sonuc.olasiliklar) as [BotClass, number][])
    .map(([sinif, olasilik]) => ({ sinif, olasilik }))
    .sort((a, b) => b.olasilik - a.olasilik);

  // Karşı-olgusal: tek sinyali tersine çevirip kararın değişip değişmediğine bak.
  const karsiOlgusal = karsiOlgusalBul(g, sonuc.sinif);

  const guvenYorum =
    sonuc.guven >= 0.7 ? "Yüksek güven — karar net."
    : sonuc.guven >= 0.45 ? "Orta güven — ikincil sınıf yakın; ek sinyal yardımcı olur."
    : "Düşük güven — sınıflar çekişiyor; challenge/doğrulama önerilir.";

  return { ...sonuc, siraliOlasilik: sirali, karsiOlgusal, guvenYorum };
}

/** Tek bir sinyali değiştirip kararı en çok etkileyeni bulur. */
function karsiOlgusalBul(g: SiniflandirmaGirdisi, mevcut: BotClass): AciklamaSonuc["karsiOlgusal"] {
  const denemeler: { sinyal: string; degisiklik: string; girdi: SiniflandirmaGirdisi }[] = [];
  if (g.headless) denemeler.push({ sinyal: "Headless", degisiklik: "kapalı olsaydı", girdi: { ...g, headless: false } });
  else denemeler.push({ sinyal: "Headless", degisiklik: "açık olsaydı", girdi: { ...g, headless: true } });
  if (g.tlsMismatch) denemeler.push({ sinyal: "TLS uyumsuz", degisiklik: "uyumlu olsaydı", girdi: { ...g, tlsMismatch: false } });
  else denemeler.push({ sinyal: "TLS", degisiklik: "uyumsuz olsaydı", girdi: { ...g, tlsMismatch: true } });
  const bs = g.behaviorScore ?? 0.5;
  denemeler.push({ sinyal: "Davranış skoru", degisiklik: bs < 0.5 ? "yüksek olsaydı" : "düşük olsaydı", girdi: { ...g, behaviorScore: bs < 0.5 ? 0.9 : 0.1 } });
  if (!g.aiAjan) denemeler.push({ sinyal: "AI ajan", degisiklik: "tespit edilseydi", girdi: { ...g, aiAjan: true } });

  for (const d of denemeler) {
    const yeni = botSiniflandir(d.girdi).sinif;
    if (yeni !== mevcut) return { sinyal: d.sinyal, degisiklik: d.degisiklik, yeniSinif: yeni };
  }
  return null;
}

/** Bir olayı sınıflandırıcı girdisine çevirir. */
export function olaydanGirdi(e: BotEvent): SiniflandirmaGirdisi {
  return {
    ua: e.ua,
    behaviorScore: e.score,
    headless: e.headless,
    tlsMismatch: e.tlsUaUyumsuz,
    headerAnomali: e.headerAnomali,
    aiAjan: e.botClass === "ai_agent",
    path: e.path,
  };
}

export interface ModelOzet {
  toplam: number;
  /** Sınıf başına gerçek karar dağılımı. */
  sinifDagilim: { sinif: BotClass; sayi: number; oran: number }[];
  /** Ortalama model güveni. */
  ortGuven: number;
  /** Düşük-güven (belirsiz) karar oranı. */
  belirsizOran: number;
  /** En etkili özellikler (tüm kararlarda katkı sıklığı). */
  ozellikEtki: { ozellik: string; siklik: number }[];
}

/** Gerçek olaylar üzerinde modelin karar dağılımını + özellik etkisini çıkarır. */
export function modelOzet(events: BotEvent[]): ModelOzet {
  const sinifSay = new Map<BotClass, number>();
  const ozellikSay = new Map<string, number>();
  let guvenTop = 0;
  let belirsiz = 0;

  for (const e of events) {
    const sonuc = botSiniflandir(olaydanGirdi(e));
    sinifSay.set(sonuc.sinif, (sinifSay.get(sonuc.sinif) || 0) + 1);
    guvenTop += sonuc.guven;
    if (sonuc.guven < 0.45) belirsiz++;
    for (const k of sonuc.katkilar.slice(0, 3)) ozellikSay.set(k.ozellik, (ozellikSay.get(k.ozellik) || 0) + 1);
  }

  const toplam = events.length || 1;
  const sinifDagilim = [...sinifSay.entries()]
    .map(([sinif, sayi]) => ({ sinif, sayi, oran: Math.round((sayi / toplam) * 1000) / 10 }))
    .sort((a, b) => b.sayi - a.sayi);
  const ozellikEtki = [...ozellikSay.entries()]
    .map(([ozellik, siklik]) => ({ ozellik, siklik }))
    .sort((a, b) => b.siklik - a.siklik).slice(0, 8);

  return {
    toplam: events.length,
    sinifDagilim,
    ortGuven: Math.round((guvenTop / toplam) * 100) / 100,
    belirsizOran: Math.round((belirsiz / toplam) * 100),
    ozellikEtki,
  };
}
