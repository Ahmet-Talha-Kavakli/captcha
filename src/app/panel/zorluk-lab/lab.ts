/**
 * Zorluk Laboratuvarı — Saf Skorlama Modeli (lab.ts)
 * ===================================================
 * Bu dosya YALNIZCA bu panele aittir (src/lib/specter DEĞİL). Amaç: operatörün
 * canlı canvas'ta ayarladığı ghost-font parametrelerinden — gerçek render
 * motorunun (ghostfont.ts / specter.js) mantığını YANSITARAK — iki rakip metrik
 * üretmek:
 *
 *   1) ocrDirenci  : tek-kareden harfi ayıklama zorluğu (bota ne kadar kör?)
 *   2) insanOkunabilirlik : zaman-ortalamada harfin ne kadar net okunduğu
 *
 * GERİLİM: OCR direncini maksimuma çekmek (yüksek titreşim + gürültü + hızlı
 * dither) insan okunabilirliğini de düşürür. dengeSkoru bu iki metriği
 * birleştirip "tatlı nokta"yı bulur.
 *
 * SAFLIK GARANTİSİ: Bu dosyadaki hiçbir skorlama fonksiyonu Date.now / Math.random
 * kullanmaz — deterministiktir (aynı konfig → aynı skor). Canlı canvas
 * animasyonu (istemci bileşeninde requestAnimationFrame) ayrı meseledir; o görsel
 * bir demodur, skorlamaya karışmaz.
 *
 * Model, ocr-direnc.ts'teki gerçek formüllerin AYNI fiziğini kullanır:
 *   - Zaman-ortalama kontrast = harf tabanı - arka plan tabanı (insanın gördüğü).
 *   - Tek-kare en-kötü fark = (harfMin) - (bgMax); titreşim bu farkı bastırır.
 *   - Tek-kare S/N düştükçe OCR direnci artar.
 * Buradaki fark: sabit üç profil yerine operatörün SÜRDÜĞÜ serbest parametreler.
 */

/** Ghost-font karakter seti seçeneği. */
export type KarakterSeti = "kod" | "sayi" | "karisik";

/** Operatörün laboratuvarda ayarladığı ghost-font konfigürasyonu. */
export interface Konfig {
  /** Dither (kırpışma) hızı — Hz. Yüksek = bota zor, çok yüksek = insana da zor. */
  ditherHz: number;
  /** Hücre kontrastı 0..1 — harf/arka plan zaman-ortalama doluluk farkını ölçekler. */
  hucreKontrast: number;
  /** Gürültü miktarı 0..1 — titreşim genliği (tek-kareyi bulanıklaştırır). */
  gurultu: number;
  /** Kare sayısı — insan gözünün entegre ettiği kare adedi (algısal örnekleme). */
  kareSayisi: number;
  /** Gösterilecek içeriğin karakter seti. */
  karakterSeti: KarakterSeti;
  /** Nokta (hücre) boyutu px — iri = daha okunur, ince = bota zor. */
  boyut: number;
}

/** Denge skoru + operatöre yönelik yargı. */
export interface DengeSonuc {
  /** 0..100 birleşik tatlı-nokta skoru. */
  skor: number;
  /** Kısa yargı metni (Türkçe). */
  yargi: string;
  /** Yargı tonu (rozet rengi seçimi için). */
  ton: "ideal" | "iyi" | "uyari" | "kotu";
  ocrDirenc: number;
  okunabilirlik: number;
}

/** Laboratuvarın açılış (varsayılan) konfigürasyonu — dengeli "medium" hissi. */
export const KonfigVarsayilan: Konfig = {
  ditherHz: 24,
  hucreKontrast: 0.62,
  gurultu: 0.42,
  kareSayisi: 12,
  karakterSeti: "kod",
  boyut: 4,
};

/** 0..1 değeri 0..100 tam sayı puana çevirir (kırpma ile). */
function puan(x: number): number {
  return Math.round(Math.max(0, Math.min(1, x)) * 100);
}

/** Bir değeri [a,b] aralığına kıstırır. */
function kis(x: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, x));
}

/**
 * Konfigürasyondan gerçek render fiziği türetir. ocr-direnc.ts'teki taban/genlik
 * ilişkisini, operatörün serbest parametrelerinden yeniden kurar:
 *   - hucreKontrast → harf/arka plan zaman-ortalama doluluk FARKI (0..~0.5).
 *   - gurultu       → titreşim genliği (letterAmp≈bgAmp), tek-kareyi bastıran.
 *   - koherens      → gürültü arttıkça düşer (yüksek gürültü senkronu bozar).
 */
function fizik(k: Konfig): {
  zamanFark: number; // harf - arka plan (zaman-ortalama)
  genlik: number; // ortalama titreşim genliği
  tekKareFark: number; // tek-karede en-kötü harf/bg farkı (genelde ≤0)
  tekKareSN: number; // tek-karede sinyal/gürültü
  koherens: number; // 0..1
} {
  // Zaman-ortalama fark: kontrast doğrudan farkı sürer. 0.5'e kadar (tam ayrık).
  const zamanFark = kis(k.hucreKontrast, 0, 1) * 0.5;
  // Titreşim genliği (gürültü tabanı): gürültü onu güçlü büyütür. Yüksek gürültüde
  // tek-kare tabanı sinyali gömer. Üst sınır ~0.85.
  const genlik = kis(0.1 + k.gurultu * 0.85, 0, 0.85);
  // Tek-kare en-kötü: harf düşük fazda, arka plan yüksek fazda. Görsel işaret.
  const tekKareFark = zamanFark - 2 * genlik; // genelde negatif → OCR ayırt edemez
  // Tek-kare S/N: KALICI sinyalin (zaman-ortalama harf farkı) tek-kare gürültü
  // tabanına oranı. Gürültü (genlik) büyüdükçe sinyal tek karede gömülür → OCR
  // kör. Düşük S/N = yüksek OCR direnci. (ocr-direnc.ts ile aynı yön.)
  const tekKareSN = genlik > 0 ? zamanFark / genlik : 999;
  // Koherens: gürültü senkronu bozar; boyut (iri nokta) senkronu güçlendirir.
  const koherens = kis(0.92 - k.gurultu * 0.4 + (k.boyut - 4) * 0.02, 0.3, 0.95);
  return { zamanFark, genlik, tekKareFark, tekKareSN, koherens };
}

/**
 * OCR DİRENCİ (0..100) — tek-kareden harfi ayıklamanın zorluğu.
 * Yüksek dither + yüksek gürültü + ince nokta + düşük tek-kare-kontrast → yüksek direnç.
 * ocr-direnc.ts'teki formülü izler: S/N düştükçe direnç artar; düşük koherens de ekler.
 * Ayrıca dither hızı ve ince nokta bota-özgü zorluk katkısı verir.
 */
export function ocrDirenci(k: Konfig): number {
  const f = fizik(k);
  // S/N tabanlı çekirdek direnç (tek-kare belirsizliği).
  const snBazli = Math.max(0, 1 - Math.min(1, f.tekKareSN)); // 0..1
  // Dither hızı katkısı: hızlı tazeleme botun kare-yakalamasını zorlaştırır.
  // 40 Hz'de doyar. (Referans motor refresh 0.035..0.075 ~ 8..18 Hz aralığı.)
  const ditherKatki = kis(k.ditherHz / 40, 0, 1);
  // İnce nokta katkısı: küçük hücre statik analizi zorlaştırır (2px zor, 8px kolay).
  const noktaKatki = kis((8 - k.boyut) / 6, 0, 1);
  // Ağırlıklı birleşim (S/N ana etken, koherens+dither+nokta destek).
  const ham =
    snBazli * 0.62 +
    (1 - f.koherens) * 0.14 +
    ditherKatki * 0.14 +
    noktaKatki * 0.1;
  return puan(ham);
}

/**
 * İNSAN OKUNABİLİRLİĞİ (0..100) — zaman-ortalamada harfin ne kadar net görüldüğü.
 * Ana sinyal: zaman-ortalama kontrast (≥25 puan = okunur eşiği, ocr-direnc.ts).
 * Cezalar:
 *   - Aşırı gürültü zaman-ortalamayı bulanıklaştırır (algısal SNR düşer).
 *   - Çok hızlı dither (>~30 Hz) insan füzyon eşiğini zorlar (kırpışma yorucu).
 *   - Az kare sayısı (kısa bakış) entegrasyonu tamamlatmaz.
 *   - Çok ince nokta (harf kenarı erir) okunurluğu düşürür.
 * "karisik" karakter seti (harf+rakam) hafifçe daha zor okunur.
 */
export function insanOkunabilirlik(k: Konfig): number {
  const f = fizik(k);
  // Temel: zaman-ortalama kontrast, kareSayisi entegrasyonuyla gürültüyü bastırır.
  // N kare gürültüyü 1/sqrt(N) ile azaltır (bağımsız gürültü varsayımı; ocr-direnc.ts).
  const kalanGurultu = f.genlik / Math.sqrt(Math.max(1, k.kareSayisi));
  const etkinKontrast = f.zamanFark / (f.zamanFark + kalanGurultu || 1); // 0..1
  let taban = etkinKontrast; // 0..1

  // Hızlı dither cezası: 30 Hz üstünde kırpışma yorucu; 55 Hz'de ağır ceza.
  if (k.ditherHz > 30) taban -= kis((k.ditherHz - 30) / 50, 0, 0.35);
  // Aşırı gürültü cezası: 0.6 üstü zaman-ortalamayı bile bulanıklaştırır.
  if (k.gurultu > 0.6) taban -= kis((k.gurultu - 0.6) * 0.6, 0, 0.28);
  // İnce nokta cezası: 3px altında harf kenarı erir.
  if (k.boyut < 3) taban -= 0.12;
  // Az kare cezası: <6 kare entegrasyon eksik.
  if (k.kareSayisi < 6) taban -= kis((6 - k.kareSayisi) * 0.03, 0, 0.18);
  // Karışık set hafif zor.
  if (k.karakterSeti === "karisik") taban -= 0.04;

  return puan(taban);
}

/**
 * DENGE SKORU — tatlı-nokta. İki metrik de yüksek olmalı; birinin düşüklüğü
 * ağır cezalandırılır (geometrik-benzeri). İdeal: OCR'a kör + insana net.
 */
export function dengeSkoru(k: Konfig): DengeSonuc {
  const ocr = ocrDirenci(k);
  const oku = insanOkunabilirlik(k);
  // Geometrik ortalama benzeri: iki taraf da güçlü olmalı; zayıf halka bastırır.
  const skor = Math.round(Math.sqrt(ocr * oku));

  let yargi: string;
  let ton: DengeSonuc["ton"];
  if (oku < 45) {
    yargi = "İnsan için zor okunur — kontrastı artır ya da gürültü/dither'ı düşür.";
    ton = "kotu";
  } else if (ocr < 45) {
    yargi = "Bota fazla açık — dither hızını, gürültüyü artır veya noktayı incelt.";
    ton = "uyari";
  } else if (ocr >= 70 && oku >= 70) {
    yargi = "İdeal tatlı nokta: OCR'a kör + insana net.";
    ton = "ideal";
  } else {
    yargi = "İyi denge — küçük ayarla ideale çekilebilir.";
    ton = "iyi";
  }
  return { skor, yargi, ton, ocrDirenc: ocr, okunabilirlik: oku };
}

/**
 * ÖNERİLEN KONFİG — dengeSkoru'nu yüksek tutan, deterministik ızgara aramasıyla
 * bulunmuş dengeli ayar. (Arama saf: sabit ızgara, rastgelelik yok.)
 */
export function onerilenKonfig(): Konfig {
  let enIyi = KonfigVarsayilan;
  let enIyiSkor = -1;
  const ditherler = [20, 24, 28, 32];
  const kontrastlar = [0.5, 0.55, 0.6, 0.7];
  const gurultuler = [0.4, 0.5, 0.6, 0.7];
  const boyutlar = [3, 4, 5];
  const kareler = [16, 20, 24];
  for (const ditherHz of ditherler)
    for (const hucreKontrast of kontrastlar)
      for (const gurultu of gurultuler)
        for (const boyut of boyutlar)
          for (const kareSayisi of kareler) {
            const k: Konfig = {
              ditherHz,
              hucreKontrast,
              gurultu,
              kareSayisi,
              karakterSeti: "kod",
              boyut,
            };
            const d = dengeSkoru(k);
            // Sadece iki tarafı da güvenli olanları kabul et (okunur + dirençli).
            if (d.okunabilirlik >= 62 && d.ocrDirenc >= 55 && d.skor > enIyiSkor) {
              enIyiSkor = d.skor;
              enIyi = k;
            }
          }
  return enIyi;
}

/** Karakter setine göre örnek gösterim metni (canvas'a çizilecek). */
export function ornekMetin(set: KarakterSeti): string {
  if (set === "sayi") return "70492";
  if (set === "karisik") return "SP3CTR";
  return "SPECTER";
}

/** Karakter seti etiketleri (UI). */
export const KARAKTER_SETI_ETIKET: Record<KarakterSeti, string> = {
  kod: "Kod (harf+rakam)",
  sayi: "Sayı",
  karisik: "Karışık",
};
