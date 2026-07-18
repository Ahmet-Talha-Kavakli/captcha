/**
 * Specter — Davranışsal Isı Haritası & Etkileşim Analizi
 * ======================================================
 * Bu modül, `biyometri-profil.ts` içindeki gerçek `ARKETIPLER` davranış
 * imzalarını (BehaviorSignals) alıp bunları GÖRSELLEŞTİRİLEBİLİR yapılara
 * dönüştürür: fare hareket ısı haritası, etkileşim-zamanlama dağılımları,
 * tıklama/tuş dizisi desenleri ve insan↔bot sinyal ayrımı.
 *
 * TEMEL FİKİR — insan ile bot, ghost-font challenge'ıyla FARKLI etkileşir:
 *   - İnsan: fareyi eğrisel, kümelenmiş (dwell) yollarla oynatır; tuş ritmi
 *     değişken; zamanlama doğal varyanslı.
 *   - Otomasyon: fare hiç oynamaz ya da düz/ışınlanan hareket; tuş ritmi
 *     mekanik (sabit); zamanlama insan-üstü hızlı.
 *   - Headless: ızgaraya hizalı sıçramalar, webdriver bayrağı.
 * Ghost-font glyph'i vision-model ile ÇÖZÜLSE bile, bu davranışsal imza
 * ölçekte taklit edilemez — ikinci savunma katmanı budur.
 *
 * DETERMİNİZM (SAF MODÜL)
 * -----------------------
 * Bu dosya `Date.now`, `Math.random` veya argümansız `new Date` KULLANMAZ.
 * Her "rastgelelik" ızgara indeksi + arketip tohumundan (seed) hash'le
 * türetilir. Aynı arketip her zaman aynı ısı haritasını üretir → panel
 * gerçek, tekrarlanabilir bir görselleştirme gösterir; uydurma sayı yok.
 */

import { ARKETIPLER, type Arketip } from "@/lib/specter/biyometri-profil";
import type { BehaviorSignals } from "@/lib/specter/behavior";

/* ------------------------------------------------------------------ Izgara boyutları */
/** Isı haritası ızgarası: 20 sütun × 12 satır (genişlik × yükseklik). */
export const IZGARA_GENISLIK = 20;
export const IZGARA_YUKSEKLIK = 12;

/* ------------------------------------------------------------------ Deterministik gürültü */
/**
 * Tamsayı tohumundan 0..1 arası deterministik "rastgele" değer üretir
 * (mulberry32 esintili). SAF: aynı tohum → aynı çıktı. `Math.random` YOK.
 */
function tohumRastgele(tohum: number): number {
  let t = (tohum + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Bir metinden kararlı tamsayı tohumu (basit FNV-1a benzeri). */
function metinTohum(metin: string): number {
  let h = 2166136261;
  for (let i = 0; i < metin.length; i++) {
    h ^= metin.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** İki hücre indeksinden kararlı tohum (ısı haritası gürültüsü için). */
function hucreTohum(taban: number, x: number, y: number): number {
  return (taban ^ Math.imul(x + 1, 73856093) ^ Math.imul(y + 1, 19349663)) >>> 0;
}

/* ------------------------------------------------------------------ Arketip erişimi */
/** Anahtardan arketip bul; yoksa ilk arketip (savunmacı). */
export function arketipBul(anahtar: string): Arketip {
  return ARKETIPLER.find((a) => a.kimlik === anahtar) ?? ARKETIPLER[0];
}

/** Isı haritası galerisi için gösterilen sadeleştirilmiş arketip listesi. */
export interface IsiArketip {
  kimlik: string;
  ad: string;
  aciklama: string;
  beklenen: "insan" | "bot";
  etiketler: string[];
}
export function isiArketipleri(): IsiArketip[] {
  return ARKETIPLER.map((a) => ({
    kimlik: a.kimlik,
    ad: a.ad,
    aciklama: a.aciklama,
    beklenen: a.beklenen,
    etiketler: a.etiketler,
  }));
}

/* ================================================================== 1) FARE ISI HARİTASI */
/**
 * Bir arketip için deterministik fare-hareket yoğunluk ızgarası üretir.
 * 2B ızgara (satır × sütun), her hücre 0..1 yoğunluk.
 *
 * ARKETİP KARAKTERİ imzadan (BehaviorSignals) türetilir:
 *   - Fare hiç yok (mouseSamples=0, hadTouch=false) → neredeyse boş ızgara.
 *   - Dokunmatik (hadTouch) → giriş alanı çevresinde kümelenmiş dokunuşlar.
 *   - Eğrisel insan yolu (yüksek varyans + köşe) → merkeze doğru akan,
 *     dwell kümeleri olan organik bir iz.
 *   - Düz/robotik (köşe=0, düşük varyans) → tek bir yatay çizgi (ışınlanma).
 *   - Headless (webdriver) → ızgaraya hizalı ayrık sıçramalar.
 */
export function hareketIsiHaritasi(arketipAnahtar: string): number[][] {
  const a = arketipBul(arketipAnahtar);
  const s = a.sinyal;
  const taban = metinTohum(a.kimlik);
  const g = IZGARA_GENISLIK;
  const y = IZGARA_YUKSEKLIK;

  // Boş ızgara.
  const izgara: number[][] = Array.from({ length: y }, () => Array.from({ length: g }, () => 0));

  const ekle = (cx: number, cy: number, guc: number, yaricap: number) => {
    for (let j = 0; j < y; j++) {
      for (let i = 0; i < g; i++) {
        const dx = i - cx;
        const dy = j - cy;
        const d2 = dx * dx + dy * dy;
        const katki = guc * Math.exp(-d2 / (2 * yaricap * yaricap));
        if (katki > 0.002) izgara[j][i] = Math.min(1, izgara[j][i] + katki);
      }
    }
  };

  // Giriş alanı (input) ızgaranın sağ-alt merkezinde varsayılsın — kullanıcı
  // buraya doğru gider. Challenge/başlangıç sol-üstte.
  const hedefX = g * 0.62;
  const hedefY = y * 0.6;
  const baslaX = g * 0.15;
  const baslaY = y * 0.25;

  const fareVarMi = s.mouseSamples > 0;

  if (!fareVarMi && !s.hadTouch) {
    // Ham istemci / etkileşim yok → sadece giriş alanında minik bir iz
    // (form programatik dolduruldu). Neredeyse tamamen boş.
    ekle(hedefX, hedefY, 0.25, 0.7);
    return izgara;
  }

  if (s.hadTouch) {
    // Mobil dokunma: fare yolu yok ama giriş alanı + kaydırma kümeleri var.
    const dokunusSayi = 3 + ((s.scrollEvents ?? 0) % 4);
    for (let k = 0; k < dokunusSayi; k++) {
      const r = tohumRastgele(taban + k * 977);
      const r2 = tohumRastgele(taban + k * 613 + 5);
      const px = hedefX + (r - 0.5) * 4;
      const py = hedefY + (r2 - 0.5) * 5;
      ekle(px, py, 0.85, 1.1 + r * 0.6);
    }
    return izgara;
  }

  // Buradan sonrası fareli arketipler.
  const varyans = s.mouseSpeedVariance;
  const koseler = s.mouseCorners ?? 0;
  const headless = s.webdriver === true;

  if (headless) {
    // Headless: ızgaraya hizalı ayrık sıçramalar (teleport). Düz bir satırda
    // eşit aralıklı, keskin ve dwell'siz noktalar.
    const nokta = 5;
    const satir = Math.round(y * 0.5);
    for (let k = 0; k < nokta; k++) {
      const px = 2 + (k * (g - 4)) / (nokta - 1);
      ekle(px, satir, 0.7, 0.45); // dar yarıçap → keskin, mekanik nokta
    }
    return izgara;
  }

  const organikMi = varyans > 0.1 && koseler >= 4;

  if (!organikMi) {
    // Kayıt-tekrar / insan-taklidi bot: fare VAR ama düz, sabit hızlı yol.
    // Başlangıçtan hedefe tek bir düz çizgi, dwell yok.
    const adim = 14;
    for (let k = 0; k <= adim; k++) {
      const t = k / adim;
      const px = baslaX + (hedefX - baslaX) * t;
      const py = baslaY + (hedefY - baslaY) * t;
      ekle(px, py, 0.5, 0.5);
    }
    // Hedefte hafif küçük bir küme (submit).
    ekle(hedefX, hedefY, 0.55, 0.7);
    return izgara;
  }

  // Doğal insan: eğrisel, mikro-düzeltmeli, dwell kümeli organik yol.
  // Bezier-benzeri yol; kontrol noktası köşe sayısına göre sapar. Yol boyunca
  // deterministik jitter (mikro-düzeltme) ve birkaç dwell kümesi eklenir.
  const kontrolX = g * (0.35 + tohumRastgele(taban) * 0.3);
  const kontrolY = y * (0.75 + tohumRastgele(taban + 1) * 0.2);
  const adimSayi = Math.max(24, Math.min(60, s.mouseSamples));
  for (let k = 0; k <= adimSayi; k++) {
    const t = k / adimSayi;
    // Kuadratik Bezier: başla → kontrol → hedef.
    const bx = (1 - t) * (1 - t) * baslaX + 2 * (1 - t) * t * kontrolX + t * t * hedefX;
    const by = (1 - t) * (1 - t) * baslaY + 2 * (1 - t) * t * kontrolY + t * t * hedefY;
    // İnsansı mikro-düzeltme jitter'ı (varyansla ölçekli, deterministik).
    const jx = (tohumRastgele(taban + k * 131) - 0.5) * varyans * 6;
    const jy = (tohumRastgele(taban + k * 197 + 3) - 0.5) * varyans * 6;
    ekle(bx + jx, by + jy, 0.32, 0.6);
  }
  // Dwell kümeleri: köşe sayısı kadar "durup düşünme" bölgesi.
  const dwellSayi = Math.min(koseler, 6);
  for (let d = 0; d < dwellSayi; d++) {
    const t = (d + 1) / (dwellSayi + 1);
    const bx = (1 - t) * (1 - t) * baslaX + 2 * (1 - t) * t * kontrolX + t * t * hedefX;
    const by = (1 - t) * (1 - t) * baslaY + 2 * (1 - t) * t * kontrolY + t * t * hedefY;
    const sap = (tohumRastgele(taban + d * 431) - 0.5) * 3;
    ekle(bx + sap, by, 0.6, 1.0 + tohumRastgele(taban + d * 733) * 0.8);
  }
  // Hedef (input + submit) çevresinde güçlü dwell.
  ekle(hedefX, hedefY, 0.9, 1.3);
  return izgara;
}

/* ------------------------------------------------------------------ Isı haritası metrikleri */
export interface IsiMetrik {
  /** Yoğunluğu 0'dan farklı hücre sayısı (yayılım). */
  doluHucre: number;
  /** Toplam hücre sayısı. */
  toplamHucre: number;
  /** Dolu hücre oranı 0..1 (kapsama). */
  kapsama: number;
  /** Yoğunluk entropisi (0=tek nokta, yüksek=organik yayılım). */
  entropi: number;
  /** Ortalama yoğunluk (dolu hücreler). */
  ortYogunluk: number;
}
/** Bir ısı haritasının yayılım/organiklik metriklerini hesaplar. */
export function isiMetrik(izgara: number[][]): IsiMetrik {
  let dolu = 0;
  let toplam = 0;
  let yogunlukToplam = 0;
  const degerler: number[] = [];
  for (const satir of izgara) {
    for (const v of satir) {
      toplam++;
      if (v > 0.001) {
        dolu++;
        yogunlukToplam += v;
        degerler.push(v);
      }
    }
  }
  // Shannon entropisi (normalize yoğunluk dağılımı üzerinden).
  const toplamYog = degerler.reduce((a, b) => a + b, 0) || 1;
  let entropi = 0;
  for (const v of degerler) {
    const p = v / toplamYog;
    if (p > 0) entropi -= p * Math.log2(p);
  }
  return {
    doluHucre: dolu,
    toplamHucre: toplam,
    kapsama: toplam > 0 ? dolu / toplam : 0,
    entropi,
    ortYogunluk: dolu > 0 ? yogunlukToplam / dolu : 0,
  };
}

/* ================================================================== 2) ZAMANLAMA DAĞILIMI */
export interface Kutu {
  /** Kutu (bin) etiketi (ör. "100-150ms"). */
  etiket: string;
  /** Bu kutuya düşen örnek sayısı (yükseklik). */
  deger: number;
}
export interface ZamanlamaDagilimi {
  /** Tuş-vuruş aralık ritmi histogramı (ms). */
  tusRitmi: Kutu[];
  /** Tuş aralıklarının varyasyon katsayısı (CV): insan yüksek, bot ≈0. */
  ritimCv: number;
  /** İlk etkileşime kadar süre (ms). */
  ilkEtkilesim: number;
  /** Gönderime kadar süre (ms). */
  gonderim: number;
  /** Bu zamanlama insansı mı görünüyor (yorumlama için). */
  insansiZamanlama: boolean;
}

/** Basit sayısal histogram: verilen sınırlara göre kutular. */
function histogram(degerler: number[], sinirlar: number[], birim = "ms"): Kutu[] {
  const kutular: Kutu[] = [];
  for (let i = 0; i < sinirlar.length - 1; i++) {
    const alt = sinirlar[i];
    const ust = sinirlar[i + 1];
    const say = degerler.filter((d) => d >= alt && d < ust).length;
    kutular.push({ etiket: `${alt}-${ust}${birim}`, deger: say });
  }
  return kutular;
}

/**
 * Bir arketibin etkileşim-zamanlama dağılımını üretir. İnsan tuş aralıkları
 * doğal varyanslıdır (geniş histogram); bot ya çok düzenli (tek kutuda yığılma)
 * ya da çok hızlıdır (en düşük kutuda yığılma).
 */
export function zamanlamaDagilimi(arketipAnahtar: string): ZamanlamaDagilimi {
  const a = arketipBul(arketipAnahtar);
  const s = a.sinyal;
  const araliklar = s.keyIntervals;

  const sinirlar = [0, 25, 50, 100, 150, 200, 250, 300];
  const tusRitmi = histogram(araliklar, sinirlar);

  // Varyasyon katsayısı (CV) — behavior.ts ile aynı mantık.
  let ritimCv = 0;
  if (araliklar.length >= 2) {
    const ort = araliklar.reduce((x, y) => x + y, 0) / araliklar.length;
    const varyans = araliklar.reduce((x, y) => x + (y - ort) ** 2, 0) / araliklar.length;
    ritimCv = ort > 0 ? Math.sqrt(varyans) / ort : 0;
  }

  const insansiZamanlama =
    ritimCv > 0.15 && s.timeToSubmit >= 900 && s.timeToFirstInteraction >= 80;

  return {
    tusRitmi,
    ritimCv,
    ilkEtkilesim: s.timeToFirstInteraction,
    gonderim: s.timeToSubmit,
    insansiZamanlama,
  };
}

/* ================================================================== 3) SİNYAL KARŞILAŞTIRMA */
export interface SinyalSatir {
  /** Sinyal kimliği. */
  anahtar: string;
  /** İnsan-okunur etiket. */
  etiket: string;
  /** İnsan (arketip) değeri. */
  insanDeger: number;
  /** Bot (arketip) değeri. */
  botDeger: number;
  /** Birim (gösterim için). */
  birim: string;
  /**
   * Ayrım gücü 0..1: iki değer ne kadar farklı (normalize). 1 = mükemmel ayrım.
   * Panel'de "bu sinyal ne kadar iyi ayırıyor" çubuğunu besler.
   */
  ayrimGucu: number;
  /** Yön: insan mı daha yüksek ("insan") yoksa bot mu ("bot"). */
  yon: "insan" | "bot" | "esit";
}

/** Bir imzadan tuş-ritmi CV'sini türet (yardımcı). */
function cvHesap(araliklar: number[]): number {
  if (araliklar.length < 2) return 0;
  const ort = araliklar.reduce((a, b) => a + b, 0) / araliklar.length;
  const varyans = araliklar.reduce((a, b) => a + (b - ort) ** 2, 0) / araliklar.length;
  return ort > 0 ? Math.sqrt(varyans) / ort : 0;
}

/** Bir imzadan dwell (basılı-kalma) ortalamasını türet. */
function dwellOrt(s: BehaviorSignals): number {
  const d = s.keyDwellTimes;
  if (!d || d.length === 0) return 0;
  return d.reduce((a, b) => a + b, 0) / d.length;
}

/** Yoğunluğu ölçmek için ısı-haritası entropisini yardımcı olarak türet. */
function isiEntropi(anahtar: string): number {
  return isiMetrik(hareketIsiHaritasi(anahtar)).entropi;
}

/**
 * İki arketibi (insan vs bot) sinyal-sinyal karşılaştırır. Her satır, o
 * sinyalin insan ile bot arasında ne kadar ayırt edici olduğunu gösterir.
 */
export function etkilesimKarsilastir(insanAnahtar: string, botAnahtar: string): {
  insan: IsiArketip;
  bot: IsiArketip;
  satirlar: SinyalSatir[];
  /** Genel ayrılabilirlik skoru 0..100 (satırların ağırlıklı ortalaması). */
  ayrilabilirlik: number;
} {
  const ins = arketipBul(insanAnahtar);
  const bot = arketipBul(botAnahtar);
  const si = ins.sinyal;
  const sb = bot.sinyal;

  const olcut = (
    anahtar: string,
    etiket: string,
    insanDeger: number,
    botDeger: number,
    birim: string,
    olcek: number, // normalize aralık (fark bu değere bölünür)
  ): SinyalSatir => {
    const fark = Math.abs(insanDeger - botDeger);
    const ayrimGucu = Math.max(0, Math.min(1, fark / olcek));
    const yon: SinyalSatir["yon"] =
      insanDeger > botDeger ? "insan" : insanDeger < botDeger ? "bot" : "esit";
    return { anahtar, etiket, insanDeger, botDeger, birim, ayrimGucu, yon };
  };

  const satirlar: SinyalSatir[] = [
    olcut("path", "Fare yol uzunluğu", si.mousePathLength, sb.mousePathLength, "px", 400),
    olcut("var", "Fare hız varyansı", si.mouseSpeedVariance, sb.mouseSpeedVariance, "", 0.25),
    olcut("kose", "Yol köşe/düzeltme", si.mouseCorners ?? 0, sb.mouseCorners ?? 0, "", 8),
    olcut("cv", "Tuş ritmi düzensizliği (CV)", cvHesap(si.keyIntervals), cvHesap(sb.keyIntervals), "", 0.35),
    olcut("dwell", "Tuş basılı-kalma (ort.)", dwellOrt(si), dwellOrt(sb), "ms", 100),
    olcut("submit", "Gönderime kadar süre", si.timeToSubmit, sb.timeToSubmit, "ms", 3000),
    olcut("ilk", "İlk etkileşim gecikmesi", si.timeToFirstInteraction, sb.timeToFirstInteraction, "ms", 600),
    olcut("entropi", "Hareket ısı-entropisi", isiEntropi(ins.kimlik), isiEntropi(bot.kimlik), "bit", 4),
  ];

  const ortAyrim =
    satirlar.reduce((a, r) => a + r.ayrimGucu, 0) / (satirlar.length || 1);

  return {
    insan: isiArketipleri().find((x) => x.kimlik === ins.kimlik)!,
    bot: isiArketipleri().find((x) => x.kimlik === bot.kimlik)!,
    satirlar,
    ayrilabilirlik: Math.round(ortAyrim * 100),
  };
}

/* ================================================================== 4) TIKLAMA / TUŞ DESENİ */
export interface DesenAdim {
  /** Adım türü. */
  tur: "fare" | "odak" | "tus" | "dwell" | "gonderim" | "bosluk";
  /** Etiket (ör. "K", "→"). */
  etiket: string;
  /** Bu adımın göreli süresi (ms) — zaman çizelgesi genişliği için. */
  sure: number;
  /** İnsansı mı bot işareti mi (renk için). */
  isaret: "insan" | "bot" | "notr";
}
export interface TiklamaDeseni {
  adimlar: DesenAdim[];
  /** Toplam süre (ms). */
  toplamSure: number;
  /** Kısa yorum. */
  ozet: string;
}

/**
 * Bir arketibin tıklama/tuş-vuruş dizisini zaman çizelgesi olarak üretir.
 * İnsan: fare→odak→değişken aralıklı tuşlar→makul gönderim. Bot: doğrudan
 * tuşlar/anında gönderim, aralıklar tekdüze.
 */
export function tiklamaDeseni(arketipAnahtar: string): TiklamaDeseni {
  const a = arketipBul(arketipAnahtar);
  const s = a.sinyal;
  const adimlar: DesenAdim[] = [];

  const fareVar = s.mouseSamples > 0;
  const dokunma = s.hadTouch;

  // 1) İlk etkileşim gecikmesi.
  adimlar.push({
    tur: "bosluk",
    etiket: "başlangıç",
    sure: Math.min(1200, s.timeToFirstInteraction),
    isaret: s.timeToFirstInteraction < 80 ? "bot" : "insan",
  });

  // 2) Fare / dokunma / doğrudan.
  if (dokunma) {
    adimlar.push({ tur: "fare", etiket: "dokunuş", sure: 220, isaret: "insan" });
  } else if (fareVar) {
    const organik = s.mouseSpeedVariance > 0.1 && (s.mouseCorners ?? 0) >= 4;
    adimlar.push({
      tur: "fare",
      etiket: organik ? "eğrisel fare" : "düz fare",
      sure: 300,
      isaret: organik ? "insan" : "bot",
    });
  }

  // 3) Odak.
  if (s.focusEvents > 0) adimlar.push({ tur: "odak", etiket: "odak", sure: 120, isaret: "insan" });

  // 4) Tuş vuruşları (aralıklar zaman çizelgesine yansır).
  const araliklar = s.keyIntervals;
  const cv = cvHesap(araliklar);
  araliklar.forEach((ms, i) => {
    if (i > 0) {
      adimlar.push({
        tur: "bosluk",
        etiket: "",
        sure: Math.min(300, ms),
        isaret: "notr",
      });
    }
    adimlar.push({
      tur: "tus",
      etiket: "K",
      sure: 40,
      isaret: cv < 0.05 ? "bot" : cv > 0.2 ? "insan" : "notr",
    });
  });

  // 5) Yapıştırma (varsa) — tuş yerine tek blok.
  if (s.pasted) {
    adimlar.push({ tur: "tus", etiket: "yapıştır", sure: 60, isaret: "bot" });
  }

  // 6) Gönderim.
  adimlar.push({
    tur: "gonderim",
    etiket: "gönder",
    sure: 120,
    isaret: s.timeToSubmit < 400 ? "bot" : "insan",
  });

  const toplamSure = adimlar.reduce((x, y) => x + y.sure, 0);

  let ozet: string;
  if (!fareVar && !dokunma && araliklar.length === 0) {
    ozet = "Etkileşim yok — form programatik dolduruldu, anında gönderildi.";
  } else if (cv < 0.05 && araliklar.length > 0) {
    ozet = "Mekanik tuş ritmi (sabit aralık) — kayıt-tekrar/otomasyon imzası.";
  } else if (s.pasted) {
    ozet = "Çözüm yapıştırıldı — dışarıdan enjeksiyon işareti.";
  } else if (cv > 0.2) {
    ozet = "Değişken tuş ritmi + doğal fare — insansı etkileşim dizisi.";
  } else {
    ozet = "Sınırda dizi — bazı sinyaller insansı, bazıları sentetik.";
  }

  return { adimlar, toplamSure, ozet };
}

/* ================================================================== 5) ÖZET / AYRIM */
/** Varsayılan temsili insan ve bot arketip anahtarları (panel başlangıcı). */
export const VARSAYILAN_INSAN = "dogal-insan";
export const VARSAYILAN_BOT = "headless-tarayici";

export interface EtkilesimOzet {
  /** İnsan arketip sayısı. */
  insanSayi: number;
  /** Bot arketip sayısı. */
  botSayi: number;
  /** Varsayılan insan↔bot ayrılabilirlik skoru 0..100. */
  ayrilabilirlik: number;
  /** İnsan ısı-haritası entropisi. */
  insanEntropi: number;
  /** Bot ısı-haritası entropisi. */
  botEntropi: number;
  /** En ayırt edici sinyalin etiketi. */
  enGucluSinyal: string;
}

/** Panel stat kartları için üst-düzey özet. */
export function etkilesimOzet(): EtkilesimOzet {
  const insanlar = ARKETIPLER.filter((a) => a.beklenen === "insan");
  const botlar = ARKETIPLER.filter((a) => a.beklenen === "bot");
  const kars = etkilesimKarsilastir(VARSAYILAN_INSAN, VARSAYILAN_BOT);
  const enGuclu = [...kars.satirlar].sort((a, b) => b.ayrimGucu - a.ayrimGucu)[0];
  return {
    insanSayi: insanlar.length,
    botSayi: botlar.length,
    ayrilabilirlik: kars.ayrilabilirlik,
    insanEntropi: isiEntropi(VARSAYILAN_INSAN),
    botEntropi: isiEntropi(VARSAYILAN_BOT),
    enGucluSinyal: enGuclu?.etiket ?? "—",
  };
}

/* ------------------------------------------------------------------ Gerçek trafik boyaması */
export interface TrafikDagilim {
  /** İnsan (human/good_bot) olay oranı 0..1. */
  insanOran: number;
  /** Bot (automation/scraper/... ) olay oranı 0..1. */
  botOran: number;
  /** Toplam olay sayısı (örneklenen). */
  toplam: number;
  /** Ortalama insanlık skoru 0..1. */
  ortSkor: number;
}
/**
 * Gerçek olay dağılımından (botClass/score) insan↔bot oranını türetir.
 * Isı haritasını gerçek trafiğe göre "renklendirmek" için panel bunu kullanır.
 * `human` ve `good_bot` insan tarafı; kalan sınıflar bot tarafı sayılır.
 */
export function trafikDagilim(
  olaylar: { botClass: string; score: number }[],
): TrafikDagilim {
  const toplam = olaylar.length;
  if (toplam === 0) {
    return { insanOran: 0, botOran: 0, toplam: 0, ortSkor: 0 };
  }
  let insan = 0;
  let skorToplam = 0;
  for (const e of olaylar) {
    if (e.botClass === "human" || e.botClass === "good_bot") insan++;
    skorToplam += e.score;
  }
  return {
    insanOran: insan / toplam,
    botOran: (toplam - insan) / toplam,
    toplam,
    ortSkor: skorToplam / toplam,
  };
}
