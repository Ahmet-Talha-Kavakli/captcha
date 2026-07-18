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
