/**
 * MARKA — tek kaynak. Ürün adı / domain / slogan tek yerden yönetilir.
 * Kullanıcı-görünür her yerde bu sabitler kullanılır; isim değişirse yalnız
 * burası düzenlenir. (Kod yorumlarındaki eski "Specter/Zentry" geçişleri
 * kullanıcıya görünmez, dokunulmaz.)
 */
export const MARKA = {
  /** Ürün adı — başlık, logo, metinler. */
  ad: "Veylify",
  /** Küçük harf slug — teknik yerler, e-posta yerel kısmı, UA. */
  slug: "veylify",
  /** Kök alan adı (.com alındı). */
  domain: "veylify.com",
  /** Tam URL. */
  url: "https://veylify.com",
  /** Kısa slogan (İngilizce, evrensel). */
  slogan: "The invisible layer only humans can read",
  /** Türkçe slogan. */
  sloganTr: "Sadece insanların okuyabildiği görünmez katman",
  /** Rozet/entegrasyon imzası. */
  koruniyorTr: "Veylify ile korunuyor",
  koruniyorEn: "Protected by Veylify",
  /** Destek e-postası. */
  destekEposta: "destek@veylify.com",
  /**
   * Sabit public demo site-key. `/demo` sayfasının gerçek API'leri (challenge/
   * verify/passive) her ortamda çağırabilmesi için deterministik olmalı;
   * seed.ts bu değeri demo hesabının İLK sitesine atar. Halka açık, sadece
   * demo trafiği içindir.
   */
  demoSiteKey: "pk_demo_veylify_public",
  /** Marka rengi (ana vurgu) — landing beyaz tema için. */
  renk: "#4f46e5",
} as const;

export type Marka = typeof MARKA;

/**
 * FİRMA — yasal/kurumsal bilgiler (mesafeli satış sözleşmesi, iade politikası,
 * KVKK, iletişim sayfalarında kullanılır). PayTR / ödeme başvurusu ve 6502
 * sayılı Tüketicinin Korunması Hakkında Kanun uyumu için ZORUNLU alanlardır.
 *
 * ⚠️ CANLIYA ÇIKMADAN / PayTR BAŞVURUSUNDAN ÖNCE tüm [KÖŞELİ PARANTEZ]
 * placeholder'ları GERÇEK firma bilgileriyle doldur. Tek kaynak: burası.
 */
export const FIRMA = {
  /** Ticaret unvanı (ör. "Veylify Yazılım Ltd. Şti." veya şahıs adı-soyadı). */
  unvan: "[FİRMA TİCARET UNVANI]",
  /** Kısa görünen ad (sözleşmelerde "SATICI"/"HİZMET SAĞLAYICI"). */
  kisaAd: "Veylify",
  /** Açık adres — il/ilçe dahil tam posta adresi. */
  adres: "[AÇIK ADRES — Mahalle, Cadde/Sokak No, İlçe/İl, Posta Kodu]",
  /** Vergi dairesi. */
  vergiDairesi: "[VERGİ DAİRESİ]",
  /** Vergi / TC kimlik no. */
  vergiNo: "[VERGİ NO / TC KİMLİK NO]",
  /** MERSIS no (tüzel kişi ise). Şahıs ise boş bırakılabilir. */
  mersis: "[MERSIS NO]",
  /** Ticaret sicil no (tüzel kişi ise). */
  ticaretSicilNo: "[TİCARET SİCİL NO]",
  /** İletişim telefonu. */
  telefon: "[+90 XXX XXX XX XX]",
  /** Genel iletişim e-postası. */
  eposta: "destek@veylify.com",
  /** KVKK / veri sorumlusu başvuru e-postası. */
  kvkkEposta: "kvkk@veylify.com",
  /** Müşteri hizmetleri/destek çalışma saatleri. */
  calismaSaatleri: "Hafta içi 09:00–18:00 (GMT+3)",
} as const;

export type Firma = typeof FIRMA;
