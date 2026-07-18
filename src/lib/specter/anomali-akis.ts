/**
 * Specter — Gerçek-Zaman Anomali Akışı: Akış Katmanı (SAF yardımcılar)
 * ====================================================================
 * Batch anomali motoru (`anomaly.ts`) son 48 saati saatlik kovalara bölüp
 * geçmişe göre karşılaştırır — kabaca ve periyodiktir. Bu dosya ise CANLI
 * akış için gereken hafif istatistik primitiflerini içerir: canlı bir sayaç
 * serisinde (ör. saniyedeki olay sayısı) yuvarlanan-pencere temel çizgisi,
 * z-skoru ile ani-sıçrama tespiti ve EWMA (üssel ağırlıklı hareketli ort.).
 *
 * TASARIM KURALI (test edilebilirlik + belirlenimcilik):
 *   Bu modülde `Date.now()`, `Math.random()` veya argümansız `new Date()` YOK.
 *   Zaman/eşik gereken her yerde çağıran tarafından parametre olarak geçirilir.
 *   Böylece saf, yan-etkisiz ve birebir test edilebilir kalır.
 *
 * `anomaly.ts` DEĞİŞTİRİLMEZ; ondan yalnızca içe aktarma yapılabilir.
 */

/** Bir sayı serisinin ortalama + standart sapması (nüfus std). */
export function ortalamaStd(seri: number[]): { ort: number; std: number } {
  if (!seri.length) return { ort: 0, std: 0 };
  const ort = seri.reduce((a, b) => a + b, 0) / seri.length;
  const varyans = seri.reduce((a, b) => a + (b - ort) ** 2, 0) / seri.length;
  return { ort, std: Math.sqrt(varyans) };
}

/**
 * Üssel ağırlıklı hareketli ortalama (EWMA).
 *   yeni = alfa * gozlem + (1 - alfa) * onceki
 * Yüksek `alfa` → daha tepkisel (yeni değere hızlı uyar); düşük → daha yumuşak.
 * `onceki` null ise ilk gözlem doğrudan tohum olur (soğuk başlangıç sıçraması yok).
 */
export function ewma(onceki: number | null, gozlem: number, alfa = 0.3): number {
  if (onceki === null || !Number.isFinite(onceki)) return gozlem;
  const a = Math.max(0, Math.min(1, alfa));
  return a * gozlem + (1 - a) * onceki;
}

/** Ani-sıçrama tespit sonucu. */
export interface SicramaSonuc {
  /** Sıçrama var mı (z >= esik VE anlamlı bir temel çizgi/std varsa). */
  sicrama: boolean;
  /** Son değerin temel çizgiye göre z-skoru (std=0 ise 0). */
  z: number;
  /** Yuvarlanan pencerenin (son değer hariç) ortalaması. */
  taban: number;
  /** Yuvarlanan pencerenin std sapması. */
  std: number;
}

/**
 * Canlı bir sayaç serisinde SON değeri, kendisinden ÖNCEKİ yuvarlanan pencereye
 * göre karşılaştırır ve z-skoru ile ani sıçrama olup olmadığını söyler.
 *
 * - `seri`      : zaman sıralı örnekler (en yeni SONDA). Ör. saniyelik olay hızı.
 * - `esikZ`     : kaç σ üstü "sıçrama" sayılır (varsayılan 2).
 * - `minPencere`: temel çizgi için gereken asgari geçmiş örnek (varsayılan 5).
 *
 * Not: son değer temel çizgiye DAHİL EDİLMEZ (kendini kirletmesin). Düz seride
 * std=0 olur → asla yanlış-pozitif sıçrama üretmez.
 */
export function sicramaTespit(seri: number[], esikZ = 2, minPencere = 5): SicramaSonuc {
  const bos: SicramaSonuc = { sicrama: false, z: 0, taban: 0, std: 0 };
  if (seri.length < minPencere + 1) {
    // Yeterli geçmiş yok — yine de taban bilgisini döndür (UI için faydalı).
    if (seri.length >= 2) {
      const gecmis0 = seri.slice(0, -1);
      const { ort, std } = ortalamaStd(gecmis0);
      return { sicrama: false, z: 0, taban: ort, std };
    }
    return bos;
  }
  const son = seri[seri.length - 1];
  const gecmis = seri.slice(0, -1);
  const { ort, std } = ortalamaStd(gecmis);
  if (std <= 0) {
    // Düz temel çizgi: std yok → z tanımsız. Yalnızca temel çizgiyi belirgin
    // aşan mutlak bir artış varsa (ör. 0'lardan sonra ani değer) işaretle.
    const sicrama = son > ort && ort >= 0 && son - ort > Math.max(3, ort);
    return { sicrama, z: sicrama ? esikZ : 0, taban: ort, std: 0 };
  }
  const z = (son - ort) / std;
  return { sicrama: z >= esikZ, z, taban: ort, std };
}

/**
 * Yuvarlanan bir örnek tamponuna yeni değer ekler ve tamponu en fazla `kapasite`
 * elemanda tutar (baştan atarak). Yeni dizi döndürür (mutasyonsuz — React state
 * için güvenli). Bellek sınırı: kapasite aşılırsa en eski örnek düşer.
 */
export function tamponaEkle(tampon: number[], deger: number, kapasite: number): number[] {
  const y = tampon.length >= kapasite ? tampon.slice(tampon.length - kapasite + 1) : tampon.slice();
  y.push(deger);
  return y;
}

/**
 * Canlı tehdit seviyesi (0..100). Batch anomali motorundan gelen aktif anomali
 * sayısı + şiddetleri ve o anki bot oranından türetilir. Yalnızca girdilere
 * bağlı → saf ve test edilebilir.
 *
 * - `botOran`     : 0..1 arası son penceredeki bot/challenge oranı.
 * - `anomaliAgir` : aktif anomalilerin şiddet-ağırlıklı toplamı
 *                   (dusuk=1, orta=2, yuksek=3, kritik=5 vb.).
 * - `sicramaVar`  : o an canlı hız sıçraması işaretli mi (ek baskı).
 */
export function tehditSeviyesi(botOran: number, anomaliAgir: number, sicramaVar: boolean): number {
  const oran = Math.max(0, Math.min(1, botOran));
  const taban = oran * 45; // bot oranı seviyenin ~%45'ini sürükler
  const anomaliKatki = Math.min(45, anomaliAgir * 9); // her ağırlık puanı ~9, tavan 45
  const sicramaKatki = sicramaVar ? 10 : 0;
  return Math.round(Math.max(0, Math.min(100, taban + anomaliKatki + sicramaKatki)));
}

/** Bir şiddet etiketini sayısal ağırlığa çevir (tehdit seviyesi hesabı için). */
export function siddetAgirlik(siddet: string): number {
  switch (siddet) {
    case "kritik":
      return 5;
    case "yuksek":
      return 3;
    case "orta":
      return 2;
    case "dusuk":
      return 1;
    default:
      return 1;
  }
}
