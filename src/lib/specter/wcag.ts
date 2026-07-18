/**
 * Specter — WCAG 2.2 Erişilebilirlik Kriter Kataloğu & Skorlama
 * =============================================================
 * Specter'ın ghost-font CAPTCHA widget'ının ve panelinin WCAG 2.2 A/AA
 * uyumunu değerlendiren deterministik, saf (yan-etkisiz) katalog + skorlama.
 *
 * Kriterler POUR ilkelerine göre gruplanır:
 *   Algılanabilir (Perceivable) · İşletilebilir (Operable)
 *   Anlaşılabilir (Understandable) · Sağlam (Robust)
 *
 * Kanıtlar GERÇEK özelliklere dayanır (public/specter.js):
 *   - canvas'ta role="img" + aria-label (metin alternatifi)
 *   - ghost-font'u göremeyenler için SESLİ alternatif (kritik)
 *   - klavye erişilebilir input + yön tuş takımı (button'lar)
 *   - role="status"/aria-live="polite" ve role="alert" duyuru bölgeleri
 *   - @media (prefers-reduced-motion:reduce) → nokta/tik animasyonu durur
 *   - :focus görünür halka (box-shadow 0 0 0 4px)
 *
 * NOT: Bu bir ÖZ-DEĞERLENDİRME katalogudur. Resmi WCAG denetimi (VPAT/ACR)
 * bağımsız bir süreçtir; bu modül hazırlık ve kanıt aracıdır.
 */

export type WcagSeviye = "A" | "AA";
export type WcagIlke = "algilanabilir" | "isletilebilir" | "anlasilabilir" | "saglam";
export type WcagDurum = "karsilandi" | "kismi" | "karsilanmadi" | "gecerli-degil";

export interface WcagKriter {
  /** Başarım ölçütü numarası, örn "1.1.1". */
  id: string;
  ad: string;
  seviye: WcagSeviye;
  ilke: WcagIlke;
  aciklama: string;
  durum: WcagDurum;
  /** Specter'ın bu ölçütü nasıl karşıladığına dair gerçek kanıt. */
  kanit: string;
  /** Tam karşılanmadıysa iyileştirme önerisi. */
  oneri?: string;
}

/** POUR ilkelerinin görünen adları ve kısa açıklamaları. */
export const ILKE_META: Record<WcagIlke, { ad: string; enAd: string; aciklama: string; ikon: string; renk: string }> = {
  algilanabilir: {
    ad: "Algılanabilir",
    enAd: "Perceivable",
    aciklama: "Bilgi ve arayüz, kullanıcıların algılayabileceği biçimde sunulur.",
    ikon: "Eye",
    renk: "#2f6fed",
  },
  isletilebilir: {
    ad: "İşletilebilir",
    enAd: "Operable",
    aciklama: "Arayüz bileşenleri ve gezinme işletilebilir olmalıdır (klavye dahil).",
    ikon: "Keyboard",
    renk: "#7c3aed",
  },
  anlasilabilir: {
    ad: "Anlaşılabilir",
    enAd: "Understandable",
    aciklama: "Bilgi ve arayüzün işleyişi anlaşılabilir olmalıdır.",
    ikon: "BookOpen",
    renk: "#16a34a",
  },
  saglam: {
    ad: "Sağlam",
    enAd: "Robust",
    aciklama: "İçerik, yardımcı teknolojiler dahil geniş araç yelpazesiyle yorumlanabilir olmalıdır.",
    ikon: "ShieldCheck",
    renk: "#d97706",
  },
};

/**
 * WCAG 2.2 Level A/AA başarım ölçütleri kataloğu (temsili ama gerçekçi alt küme).
 * Her ölçütün durumu Specter'ın gerçek widget/panel özelliklerine dayanır.
 */
export const WCAG_KRITERLER: WcagKriter[] = [
  /* ---------------------------------------------------- ALGILANABILIR */
  {
    id: "1.1.1",
    ad: "Metin Olmayan İçerik",
    seviye: "A",
    ilke: "algilanabilir",
    aciklama: "Metin olmayan tüm içeriğin eşdeğer bir metin alternatifi vardır.",
    durum: "karsilandi",
    kanit:
      "Ghost-font canvas'ı role=\"img\" + aria-label taşır (challenge türüne göre canvasLabel/canvasSayi/canvasSec/canvasYon). Görsel challenge'a ek olarak SESLİ alternatif (🔊 sesBtn) mevcuttur.",
  },
  {
    id: "1.3.1",
    ad: "Bilgi ve İlişkiler",
    seviye: "A",
    ilke: "algilanabilir",
    aciklama: "Sunumla iletilen yapı ve ilişkiler programatik olarak belirlenebilir.",
    durum: "karsilandi",
    kanit:
      "Widget semantik HTML kullanır: <button>, <input aria-label>, role=\"group\" kök, başlık/gövde bölümleri. Panel tabloları başlık hücreleri ve liste yapıları kullanır.",
  },
  {
    id: "1.3.5",
    ad: "Giriş Amacını Belirleme",
    seviye: "AA",
    ilke: "algilanabilir",
    aciklama: "Kullanıcı hakkındaki alanların amacı programatik olarak belirlenebilir.",
    durum: "kismi",
    kanit:
      "Doğrulama kodu alanı kişisel veri toplamaz; autocomplete=\"off\" ve inputmode ayarlıdır. Kimlik alanı olmadığından autocomplete token'ı uygulanmaz.",
    oneri:
      "Kişisel veri toplanmadığı için tam kapsam gerekmez; yine de amaç metaverisi belgelenmelidir.",
  },
  {
    id: "1.4.1",
    ad: "Rengin Kullanımı",
    seviye: "A",
    ilke: "algilanabilir",
    aciklama: "Renk, bilgi iletmenin tek görsel yolu değildir.",
    durum: "karsilandi",
    kanit:
      "Başarı/başarısızlık yalnızca renkle değil; ✓/✕ ikon, metin (\"Doğrulandı\"/\"Doğrulanamadı\") ve role=status/alert duyurusuyla iletilir.",
  },
  {
    id: "1.4.3",
    ad: "Kontrast (Minimum)",
    seviye: "AA",
    ilke: "algilanabilir",
    aciklama: "Metin ve arka planı arasında en az 4.5:1 (büyük metin 3:1) kontrast oranı bulunur.",
    durum: "kismi",
    kanit:
      "Ana gövde metni #e8eef7 / #0c1526 üzerinde ~14:1 kontrast sağlar (AAA). Doğrula butonu #042028 / cyan zeminde yüksek kontrastlıdır. Ancak alt bilgi/dipnot metni (#54657f) küçük boyutta AA eşiğinin altında kalır.",
    oneri:
      "Alt bilgi (foot) ve link metinlerini #54657f'ten en az #7c8aa3 tonuna açarak 4.5:1 eşiğini geçirin.",
  },
  {
    id: "1.4.4",
    ad: "Metni Yeniden Boyutlandırma",
    seviye: "AA",
    ilke: "algilanabilir",
    aciklama: "Metin %200'e kadar büyütüldüğünde içerik ve işlev kaybolmaz.",
    durum: "karsilandi",
    kanit:
      "Widget rem/px karışık ölçekli olup tarayıcı yakınlaştırmasıyla bozulmaz; panel arayüzü akışkan (responsive) ve rem tabanlıdır.",
  },
  {
    id: "1.4.11",
    ad: "Metin Olmayan Kontrast",
    seviye: "AA",
    ilke: "algilanabilir",
    aciklama: "Arayüz bileşenleri ve grafik nesnelerin sınırları en az 3:1 kontrast taşır.",
    durum: "karsilandi",
    kanit:
      "Input odak halkası cyan (#22d3ee) box-shadow; buton kenarları ve yön tuş takımı sınırları görünür kontrasta sahiptir. Odak göstergesi 4px halka ile 3:1 üstündedir.",
  },
  {
    id: "1.4.12",
    ad: "Metin Aralığı",
    seviye: "AA",
    ilke: "algilanabilir",
    aciklama: "Satır/harf/kelime aralığı ayarlandığında içerik kaybı olmaz.",
    durum: "karsilandi",
    kanit:
      "Widget sabit yükseklik yerine esnek düzen kullanır; kullanıcı stil sayfası aralık değişiklikleriyle metin kırpılmaz.",
  },
  {
    id: "1.4.13",
    ad: "İşaretçiyle veya Odakla Beliren İçerik",
    seviye: "AA",
    ilke: "algilanabilir",
    aciklama: "Hover/odakla beliren içerik kapatılabilir, işaret edilebilir ve kalıcıdır.",
    durum: "karsilandi",
    kanit:
      "Widget hover ile ek katman (tooltip/popover) açmaz; yön tuş takımı ve butonlar odakta kalıcıdır, kaybolan içerik yoktur.",
  },
  /* ---------------------------------------------------- İŞLETİLEBİLİR */
  {
    id: "2.1.1",
    ad: "Klavye",
    seviye: "A",
    ilke: "isletilebilir",
    aciklama: "Tüm işlevler klavye arayüzüyle kullanılabilir.",
    durum: "karsilandi",
    kanit:
      "Kod girişi <input>, doğrula/yeni-kod/sesli-dinle ve yön tuş takımı gerçek <button> öğeleridir; hepsi Tab ile gezilir, Enter/Space ile tetiklenir. Fare gerektiren bir işlev yoktur.",
  },
  {
    id: "2.1.2",
    ad: "Klavye Tuzağı Yok",
    seviye: "A",
    ilke: "isletilebilir",
    aciklama: "Odak yalnızca klavyeyle bileşenin içine ve dışına taşınabilir.",
    durum: "karsilandi",
    kanit:
      "Widget Shadow DOM içinde doğal sekme sırası kullanır; odak yakalayan modal/tuzak yoktur, Tab ile içeri/dışarı serbestçe geçilir.",
  },
  {
    id: "2.1.4",
    ad: "Tek Karakterli Kısayol Tuşları",
    seviye: "A",
    ilke: "isletilebilir",
    aciklama: "Tek tuş kısayolları kapatılabilir, yeniden atanabilir veya yalnızca odakta çalışır.",
    durum: "gecerli-degil",
    kanit: "Widget tek karakterli global kısayol tuşu tanımlamaz; ölçüt uygulanmaz.",
  },
  {
    id: "2.2.1",
    ad: "Zamanlama Ayarlanabilir",
    seviye: "A",
    ilke: "isletilebilir",
    aciklama: "Zaman sınırı olan içerikte kullanıcı süreyi kapatabilir, ayarlayabilir veya uzatabilir.",
    durum: "karsilandi",
    kanit:
      "Challenge token'ının bir TTL'si vardır; ancak süre dolduğunda \"yeni kod üret\" (↻ reload) ile kullanıcı sınırsız kez sıfırlayabilir. Zaman baskısı yoktur; süre uzatma her zaman kullanıcı elindedir.",
  },
  {
    id: "2.2.2",
    ad: "Duraklat, Durdur, Gizle",
    seviye: "A",
    ilke: "isletilebilir",
    aciklama: "Otomatik hareket eden/yanıp sönen içerik duraklatılabilir veya alternatifi vardır.",
    durum: "karsilandi",
    kanit:
      "Hareketli nokta challenge'ının SESLİ alternatifi vardır (görsel harekete bağımlı değil). Ayrıca prefers-reduced-motion ile animasyon durur; challenge dışına çıkınca RAF döngüsü iptal edilir.",
  },
  {
    id: "2.3.1",
    ad: "Üç Parlama Eşiğinin Altında",
    seviye: "A",
    ilke: "isletilebilir",
    aciklama: "İçerik saniyede üçten fazla parlamaz (fotosensitif nöbet riski yok).",
    durum: "karsilandi",
    kanit:
      "Ghost-font animasyonu düşük frekanslı geçişli hareket kullanır; ani yüksek-parlaklık yanıp sönmesi (flash) içermez, 3 Hz eşiğinin çok altındadır.",
  },
  {
    id: "2.3.3",
    ad: "Etkileşimlerden Kaynaklanan Animasyon",
    seviye: "AA",
    ilke: "isletilebilir",
    aciklama: "Etkileşim tetikli hareket animasyonu, temel işlev için gerekli değilse kapatılabilir.",
    durum: "karsilandi",
    kanit:
      "@media (prefers-reduced-motion:reduce) kuralı nokta (.dot) ve tik (.check) animasyonlarını kapatır. Hareket duyarlı kullanıcılar için sesli alternatif challenge'ı tamamen tamamlayabilir.",
  },
  {
    id: "2.4.3",
    ad: "Odak Sırası",
    seviye: "A",
    ilke: "isletilebilir",
    aciklama: "Bileşenler anlamlı ve işleyişi koruyan bir sırayla odaklanır.",
    durum: "karsilandi",
    kanit:
      "DOM sırası mantıksaldır: başlık → canvas → sesli/yeni-kod → giriş → doğrula → yön tuş takımı. Doğal sekme sırası içerik akışını takip eder.",
  },
  {
    id: "2.4.7",
    ad: "Görünür Odak",
    seviye: "AA",
    ilke: "isletilebilir",
    aciklama: "Klavye ile odaklanan öğede görünür bir odak göstergesi bulunur.",
    durum: "karsilandi",
    kanit:
      "input:focus → 4px cyan halka (box-shadow 0 0 0 4px rgba(34,211,238,.18)); yön butonları ve seçili durum belirgin kenarlık/halka gösterir.",
  },
  {
    id: "2.5.3",
    ad: "Etikette Ad",
    seviye: "A",
    ilke: "isletilebilir",
    aciklama: "Görünür metin etiketi olan bileşenlerin erişilebilir adı bu metni içerir.",
    durum: "karsilandi",
    kanit:
      "\"Doğrula\" butonunun aria-label'ı görünen metniyle eşleşir; yön butonlarının aria-label'ı ok yönünü (Yukarı/Aşağı/Sol/Sağ) tanımlar.",
  },
  {
    id: "2.5.8",
    ad: "Hedef Boyutu (Minimum)",
    seviye: "AA",
    ilke: "isletilebilir",
    aciklama: "Dokunma hedefleri en az 24×24 CSS pikseldir (WCAG 2.2 yeni ölçütü).",
    durum: "karsilandi",
    kanit:
      "Doğrula/giriş/yön butonları 44px yüksekliğe sahiptir (24px eşiğinin üstünde); sesli/yeni-kod butonları 30px genişlik/yükseklikle eşiği karşılar.",
  },
  /* ---------------------------------------------------- ANLAŞILABİLİR */
  {
    id: "3.1.1",
    ad: "Sayfanın Dili",
    seviye: "A",
    ilke: "anlasilabilir",
    aciklama: "Varsayılan insan dili programatik olarak belirlenebilir.",
    durum: "karsilandi",
    kanit:
      "Widget navigator.language'ı algılayıp 9 dilden birini seçer (tr/en/de/fr/es/ar/ru/pt); RTL diller için dir=\"rtl\" ayarlanır. Panel HTML lang özelliği taşır.",
  },
  {
    id: "3.2.1",
    ad: "Odakta",
    seviye: "A",
    ilke: "anlasilabilir",
    aciklama: "Bir bileşen odak aldığında bağlamda beklenmedik bir değişiklik olmaz.",
    durum: "karsilandi",
    kanit:
      "Odaklanma tek başına form gönderimi, yönlendirme veya içerik değişimi tetiklemez; doğrulama yalnızca açık buton tıklaması/Enter ile başlar.",
  },
  {
    id: "3.2.2",
    ad: "Girişte",
    seviye: "A",
    ilke: "anlasilabilir",
    aciklama: "Bir ayarın değiştirilmesi beklenmedik bağlam değişikliğine yol açmaz.",
    durum: "karsilandi",
    kanit:
      "Koda karakter yazmak otomatik gönderim yapmaz; kullanıcı doğrula butonuyla açıkça onaylar. Yön seçimi görsel işaretler ama bağlamı değiştirmez.",
  },
  {
    id: "3.3.1",
    ad: "Hata Belirleme",
    seviye: "A",
    ilke: "anlasilabilir",
    aciklama: "Giriş hatası otomatik algılanırsa, hatalı öğe belirtilir ve metinle açıklanır.",
    durum: "karsilandi",
    kanit:
      "Yanlış kodda role=\"alert\" aria-live=\"assertive\" failState devreye girer; ✕ ikon + \"Doğrulanamadı\" metni + ipucu gösterilir ve ekran okuyucuya anında duyurulur.",
  },
  {
    id: "3.3.2",
    ad: "Etiketler veya Yönergeler",
    seviye: "A",
    ilke: "anlasilabilir",
    aciklama: "Kullanıcı girişi gerektiğinde etiket veya yönerge sağlanır.",
    durum: "karsilandi",
    kanit:
      "Giriş alanı aria-label (codeLabel) + placeholder taşır; başlık \"İnsan doğrulaması\" bağlamı verir; sesli ipucu challenge türünü açıklar.",
  },
  {
    id: "3.3.7",
    ad: "Gereksiz Giriş",
    seviye: "A",
    ilke: "anlasilabilir",
    aciklama: "Aynı oturumda daha önce girilen bilgi otomatik doldurulur veya seçilebilir (WCAG 2.2).",
    durum: "gecerli-degil",
    kanit:
      "Widget tek adımlı bir doğrulamadır; tekrar giriş gerektiren çok adımlı akış yoktur, ölçüt uygulanmaz.",
  },
  /* ---------------------------------------------------- SAĞLAM */
  {
    id: "4.1.2",
    ad: "Ad, Rol, Değer",
    seviye: "A",
    ilke: "saglam",
    aciklama: "Tüm arayüz bileşenlerinin adı ve rolü programatik olarak belirlenebilir.",
    durum: "karsilandi",
    kanit:
      "canvas role=\"img\"; kök role=\"group\" aria-label; butonlar native <button> (rol örtük); input aria-label taşır. Ad/rol/değer yardımcı teknolojiye açıktır.",
  },
  {
    id: "4.1.3",
    ad: "Durum Mesajları",
    seviye: "AA",
    ilke: "saglam",
    aciklama: "Durum mesajları odak almadan yardımcı teknolojiye sunulur.",
    durum: "karsilandi",
    kanit:
      "Başarı/kontrol için role=\"status\" aria-live=\"polite\"; hata için role=\"alert\" aria-live=\"assertive\"; sesli okuma için gizli \"sesDuyuru\" canlı bölgesi. Durum, odak taşınmadan duyurulur.",
  },
];

/** Skor sonucu: her ilke için ve genel uyum yüzdesi. */
export interface WcagSkorSonuc {
  genel: number;
  karsilandi: number;
  kismi: number;
  karsilanmadi: number;
  toplam: number;
  seviyeA: { skor: number; toplam: number };
  seviyeAA: { skor: number; toplam: number };
  ilkeler: Record<WcagIlke, { skor: number; karsilandi: number; kismi: number; karsilanmadi: number; toplam: number }>;
}

/** Bir kriter kümesinin ağırlıklı skorunu döndür (karşılandı=1, kısmi=0.5, N/A hariç). */
function kumeSkor(kriterler: WcagKriter[]): { skor: number; karsilandi: number; kismi: number; karsilanmadi: number; toplam: number } {
  const sayilan = kriterler.filter((k) => k.durum !== "gecerli-degil");
  const karsilandi = sayilan.filter((k) => k.durum === "karsilandi").length;
  const kismi = sayilan.filter((k) => k.durum === "kismi").length;
  const karsilanmadi = sayilan.filter((k) => k.durum === "karsilanmadi").length;
  const skor = sayilan.length ? Math.round(((karsilandi + kismi * 0.5) / sayilan.length) * 100) : 0;
  return { skor, karsilandi, kismi, karsilanmadi, toplam: sayilan.length };
}

/**
 * WCAG uyum skorunu hesapla: ilke bazlı + seviye (A/AA) bazlı + genel.
 * Deterministik; "geçerli-değil" ölçütler paydadan hariç tutulur.
 */
export function wcagSkoru(kriterler: WcagKriter[]): WcagSkorSonuc {
  const genelKume = kumeSkor(kriterler);
  const a = kumeSkor(kriterler.filter((k) => k.seviye === "A"));
  const aa = kumeSkor(kriterler.filter((k) => k.seviye !== "A"));

  const ilkeAnahtarlari: WcagIlke[] = ["algilanabilir", "isletilebilir", "anlasilabilir", "saglam"];
  const ilkeler = {} as WcagSkorSonuc["ilkeler"];
  for (const ilke of ilkeAnahtarlari) {
    ilkeler[ilke] = kumeSkor(kriterler.filter((k) => k.ilke === ilke));
  }

  return {
    genel: genelKume.skor,
    karsilandi: genelKume.karsilandi,
    kismi: genelKume.kismi,
    karsilanmadi: genelKume.karsilanmadi,
    toplam: genelKume.toplam,
    seviyeA: { skor: a.skor, toplam: a.toplam },
    seviyeAA: { skor: aa.skor, toplam: aa.toplam },
    ilkeler,
  };
}

/* ------------------------------------------------------------------ Kontrast */

/** #RGB / #RRGGBB / "rgb(r,g,b)" biçimini {r,g,b} (0-255) olarak ayrıştır. */
export function renkAyristir(renk: string): { r: number; g: number; b: number } | null {
  const s = renk.trim().toLowerCase();
  const hex = s.replace(/^#/, "");
  if (/^[0-9a-f]{3}$/.test(hex)) {
    return {
      r: parseInt(hex[0] + hex[0], 16),
      g: parseInt(hex[1] + hex[1], 16),
      b: parseInt(hex[2] + hex[2], 16),
    };
  }
  if (/^[0-9a-f]{6}$/.test(hex)) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }
  const m = s.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) return { r: +m[1], g: +m[2], b: +m[3] };
  return null;
}

/** Tek bir sRGB kanalını doğrusallaştır (WCAG göreli aydınlık formülü). */
function kanalDogrusal(deger: number): number {
  const c = deger / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** WCAG göreli aydınlık (relative luminance) 0..1. */
export function goreliAydinlik(renk: string): number {
  const p = renkAyristir(renk) ?? { r: 0, g: 0, b: 0 };
  return 0.2126 * kanalDogrusal(p.r) + 0.7152 * kanalDogrusal(p.g) + 0.0722 * kanalDogrusal(p.b);
}

/**
 * İki renk arasındaki gerçek WCAG kontrast oranı (1..21).
 * (L_açık + 0.05) / (L_koyu + 0.05).
 */
export function kontrastOran(fg: string, bg: string): number {
  const l1 = goreliAydinlik(fg);
  const l2 = goreliAydinlik(bg);
  const acik = Math.max(l1, l2);
  const koyu = Math.min(l1, l2);
  return (acik + 0.05) / (koyu + 0.05);
}

/** Kontrast oranının WCAG eşiklerine karşı geçme/kalma sonucu. */
export interface KontrastSonuc {
  oran: number;
  aaNormal: boolean; // >= 4.5:1
  aaBuyuk: boolean; // >= 3:1
  aaaNormal: boolean; // >= 7:1
  aaaBuyuk: boolean; // >= 4.5:1
}

/** Bir kontrast oranını AA/AAA (normal + büyük metin) eşiklerine göre değerlendir. */
export function kontrastDegerlendir(fg: string, bg: string): KontrastSonuc {
  const oran = kontrastOran(fg, bg);
  return {
    oran,
    aaNormal: oran >= 4.5,
    aaBuyuk: oran >= 3,
    aaaNormal: oran >= 7,
    aaaBuyuk: oran >= 4.5,
  };
}

/** Widget'ın gerçek renklerinden hazır kontrast örnekleri (denetleyici ön-ayarları). */
export const KONTRAST_ONAYARLAR: { ad: string; fg: string; bg: string }[] = [
  { ad: "Gövde metni / kart zemini", fg: "#e8eef7", bg: "#0c1526" },
  { ad: "Doğrula butonu metni / cyan zemin", fg: "#042028", bg: "#22d3ee" },
  { ad: "Başlık metni / kart zemini", fg: "#aebfd4", bg: "#0c1526" },
  { ad: "Alt bilgi metni / kart zemini", fg: "#54657f", bg: "#0c1526" },
  { ad: "Giriş metni / giriş zemini", fg: "#ffffff", bg: "#090e1a" },
  { ad: "Güvenli rozeti / kart zemini", fg: "#5ad1c4", bg: "#0c1526" },
];

/**
 * Klavye & ekran-okuyucu kapsam kontrol listesi — gerçek widget davranışına
 * dayalı, deterministik. Panelde işaret listesi olarak gösterilir.
 */
export interface KapsamOgesi {
  ad: string;
  aciklama: string;
  durum: WcagDurum;
  ikon: string;
  wcag: string;
}

export const KAPSAM_LISTESI: KapsamOgesi[] = [
  {
    ad: "Tam klavye gezinmesi",
    aciklama: "Giriş, doğrula, yeni-kod, sesli-dinle ve yön tuş takımı yalnızca klavyeyle kullanılabilir.",
    durum: "karsilandi",
    ikon: "Keyboard",
    wcag: "2.1.1",
  },
  {
    ad: "Görünür odak göstergesi",
    aciklama: "Odaklanan giriş 4px cyan halka; butonlar belirgin kenarlık gösterir.",
    durum: "karsilandi",
    ikon: "SquareDashedMousePointer",
    wcag: "2.4.7",
  },
  {
    ad: "Klavye tuzağı yok",
    aciklama: "Odak Shadow DOM içine ve dışına Tab ile serbestçe taşınır.",
    durum: "karsilandi",
    ikon: "Unlock",
    wcag: "2.1.2",
  },
  {
    ad: "aria-live durum duyuruları",
    aciklama: "Başarı/kontrol polite, hata assertive; sesli okuma için gizli canlı bölge.",
    durum: "karsilandi",
    ikon: "Megaphone",
    wcag: "4.1.3",
  },
  {
    ad: "Ekran-okuyucu etiketleri",
    aciklama: "canvas role=img + aria-label; input/butonlar erişilebilir ad taşır.",
    durum: "karsilandi",
    ikon: "AudioLines",
    wcag: "1.1.1 / 4.1.2",
  },
  {
    ad: "Azaltılmış hareket desteği",
    aciklama: "prefers-reduced-motion:reduce nokta/tik animasyonlarını kapatır.",
    durum: "karsilandi",
    ikon: "Accessibility",
    wcag: "2.3.3",
  },
  {
    ad: "Sesli alternatif (ghost-font)",
    aciklama: "Görsel hareketli challenge'ın 🔊 sesli eşdeğeri; görme engelli kullanıcılar tamamlayabilir.",
    durum: "karsilandi",
    ikon: "Volume2",
    wcag: "1.1.1 / 2.2.2",
  },
  {
    ad: "Süre uzatma / yeniden üretme",
    aciklama: "Token TTL dolduğunda kullanıcı ↻ ile sınırsız yeni kod üretebilir; zaman baskısı yok.",
    durum: "karsilandi",
    ikon: "TimerReset",
    wcag: "2.2.1",
  },
  {
    ad: "Renkten bağımsız durum",
    aciklama: "Sonuç renkle değil ikon + metin + duyuru ile de iletilir.",
    durum: "karsilandi",
    ikon: "Palette",
    wcag: "1.4.1",
  },
  {
    ad: "Yeterli hedef boyutu",
    aciklama: "Ana kontroller 44px; yardımcı butonlar 30px (24px eşiği üstü).",
    durum: "karsilandi",
    ikon: "Move",
    wcag: "2.5.8",
  },
  {
    ad: "Düşük kontrastlı dipnot",
    aciklama: "Alt bilgi metni (#54657f) küçük boyutta AA kontrast eşiğinin altında.",
    durum: "kismi",
    ikon: "AlertTriangle",
    wcag: "1.4.3",
  },
];
