/**
 * Landing (pazarlama) i18n — 5 dil sözlüğü + çözümleyiciler
 * =========================================================
 * Panel i18n'den AYRI: landing'in kendi metinleri, kendi cookie'si var.
 * Ziyaretçinin dili middleware (IP/coğrafya + Accept-Language) tarafından
 * `veylify_dil` cookie'sine yazılır; sunucu bileşeni buradan okur.
 *
 * Yapı: `SOZLUK[dil][anahtar]`. Anahtar bulunamazsa TR'ye, o da yoksa anahtarın
 * kendisine düşülür — böylece eksik çeviri asla boş metin göstermez.
 */

export type LandingDil = "tr" | "en" | "de" | "fr" | "es";
export const LANDING_DILLER: LandingDil[] = ["tr", "en", "de", "fr", "es"];
export const LANDING_VARSAYILAN: LandingDil = "tr";
export const LANDING_DIL_COOKIE = "veylify_dil";

/** Dil meta — değiştirici menüsü için. */
export const LANDING_DIL_META: Record<LandingDil, { ad: string; bayrak: string }> = {
  tr: { ad: "Türkçe", bayrak: "🇹🇷" },
  en: { ad: "English", bayrak: "🇬🇧" },
  de: { ad: "Deutsch", bayrak: "🇩🇪" },
  fr: { ad: "Français", bayrak: "🇫🇷" },
  es: { ad: "Español", bayrak: "🇪🇸" },
};

export function gecerliLandingDil(v: unknown): v is LandingDil {
  return typeof v === "string" && (LANDING_DILLER as string[]).includes(v);
}
export function landingDileCevir(v: unknown): LandingDil {
  return gecerliLandingDil(v) ? v : LANDING_VARSAYILAN;
}

type Sozluk = Record<string, string>;

/* =========================================================================
 * TR — kaynak/otorite sözlük. Diğer diller bu anahtar kümesini birebir izler.
 * ========================================================================= */
const tr: Sozluk = {
  // --- Navbar ---
  "nav.ozellikler": "Özellikler",
  "nav.nasil": "Nasıl çalışır",
  "nav.cozumler": "Çözümler",
  "nav.fiyat": "Fiyatlar",
  "nav.demo": "Canlı demo",
  "nav.giris": "Giriş",
  "nav.basla": "Ücretsiz başla",

  // --- Hero ---
  "hero.rozet": "AI çağının bot koruması",
  "hero.baslik1": "AI botları her CAPTCHA'yı geçiyor.",
  "hero.baslik2": "geçemedikleri katman.",
  "hero.aciklama": "Ghost-font teknolojisiyle insanın gördüğü, makinenin göremediği bir doğrulama. Davranış analizi, kural motoru ve görünmez mod ile sitenizi GPTBot, ClaudeBot ve tüm AI kazıyıcılardan koruyun.",
  "hero.cta1": "Ücretsiz başla",
  "hero.cta2": "Canlı demo",
  "hero.rozet1": "10 dakikada kurulur",
  "hero.rozet2": "Kredi kartı gerekmez",
  "hero.rozet3": "reCAPTCHA uyumlu API",
  "hero.gorselAlt": "Veylify kalkanı: insan trafiği geçer, AI botları pixel'lere dağılır",

  // --- Logo strip ---
  "logo.baslik": "Kullandığınız yığınla sorunsuz çalışır",

  // --- Problem ---
  "problem.rozet": "Sorun",
  "problem.baslik": "CAPTCHA artık insanı bottan ayıramıyor",
  "problem.aciklama": "Yapay zeka görüntü tanımada insanı geçti. Eski doğrulama katmanları çöktü.",
  "problem.k1.baslik": "AI ajanları CAPTCHA'yı çözüyor",
  "problem.k1.metin": "GPT-4o ve Claude görüntü CAPTCHA'larını %90+ doğrulukla geçiyor. Klasik doğrulama artık işe yaramıyor.",
  "problem.k2.baslik": "İçeriğiniz eğitim verisine dönüşüyor",
  "problem.k2.metin": "Kazıyıcı botlar sitenizi saniyeler içinde kopyalayıp AI modellerine yem yapıyor — izniniz olmadan.",
  "problem.k3.baslik": "Altyapı maliyeti patlıyor",
  "problem.k3.metin": "Trafiğinizin %40'ı bot. Her istek sunucu, bant genişliği ve para yakıyor.",

  // --- Ghost-font ---
  "ghost.rozet": "Ghost-font teknolojisi",
  "ghost.baslik": "İnsan görür. Makine göremez.",
  "ghost.aciklama": "Temporal dithering ile karakterler tek karede gürültüye gömülür; yalnızca hareket koheransını algılayan insan gözü okur. Ekran görüntüsü alan AI bile sahte bir mesaj görür.",
  "ghost.gorselAlt": "Ghost-font: karakterler her karede statiğe dönüşerek insana okunur, makineye taranamaz kalır",
  "ghost.dene": "Kendin dene",
  "ghost.deneMetin": "Basılı tut, metnin nasıl kaybolduğunu gör",

  // --- How it works ---
  "nasil.rozet": "Nasıl çalışır",
  "nasil.baslik": "Kurulumdan korumaya 10 dakika",
  "nasil.a1.baslik": "Tek satır entegrasyon",
  "nasil.a1.metin": "Script etiketini ekleyin ya da reCAPTCHA uyumlu API'yi çağırın. Mevcut kodunuz değişmez.",
  "nasil.a2.baslik": "Trafiği anında sınıflandır",
  "nasil.a2.metin": "Her istek ghost-font, davranış biyometrisi, TLS parmak izi ve kural motorundan geçer.",
  "nasil.a3.baslik": "İnsan geçer, bot durur",
  "nasil.a3.metin": "Milisaniyeler içinde karar: izin, doğrula veya engelle. Gerçek kullanıcı hiç fark etmez.",
  "nasil.stat1": "karar süresi",
  "nasil.stat2": "savunma katmanı",
  "nasil.stat3": "sızıntı",

  // --- Features ---
  "ozellik.rozet": "Özellikler",
  "ozellik.baslik": "Tek katman değil, bütün bir savunma platformu",
  "ozellik.gorsel1Alt": "Davranış biyometrisi: insan fare izleri cyan, robotik düz çizgiler kırmızı işaretlenir",
  "ozellik.gorsel2Alt": "Proof-of-work: bota özel kriptografik zorluk küpü",
  "ozellik.gorsel3Alt": "Çok-katmanlı savunma: iç içe kalkan katmanları",
  "ozellik.f1.baslik": "Ghost-font CAPTCHA",
  "ozellik.f1.metin": "Temporal dithering — OCR'ı %100 kör eder, insanı hiç yormaz.",
  "ozellik.f2.baslik": "Davranış biyometrisi",
  "ozellik.f2.metin": "Fare, tuş ve dokunuş dinamiğinden insan-bot ayrımı.",
  "ozellik.f3.baslik": "Kural motoru",
  "ozellik.f3.metin": "Path, ülke, ASN, bot sınıfı ile özel politikalar; canlı playground.",
  "ozellik.f4.baslik": "Görünmez mod",
  "ozellik.f4.metin": "Challenge göstermeden, reCAPTCHA v3 gibi arka planda skorla.",
  "ozellik.f5.baslik": "AI ajan kataloğu",
  "ozellik.f5.metin": "GPTBot, ClaudeBot, Bytespider — 15+ crawler'ı UA + TLS ile doğrula.",
  "ozellik.f6.baslik": "Coğrafi & ASN istihbaratı",
  "ozellik.f6.metin": "Datacenter, VPN, botnet trafiğini kaynağından yakala.",
  "ozellik.f7.baslik": "48ms yanıt",
  "ozellik.f7.metin": "Edge'de çalışır; kullanıcı deneyimini hiç yavaşlatmaz.",
  "ozellik.f8.baslik": "Çok-katmanlı savunma",
  "ozellik.f8.metin": "Bir katman atlansa diğeri yakalar — defense in depth.",

  // --- Ürün önizleme ---
  "urun.rozet": "Ürünü gör",
  "urun.baslik": "Tek panelden bütün bot trafiğin",
  "urun.aciklama": "İnsan mı, bot mu, hangi AI ajanı — her şey tek ekranda, canlı ve okunur.",
  "urun.gorselAlt": "Veylify komuta merkezi: canlı tehdit akışı, koruma skoru göstergesi ve engellenen saldırı haritası",
  "urun.n1.baslik": "Canlı komuta merkezi",
  "urun.n1.metin": "Her isteğin kararını gerçek zamanlı izle: izin, doğrula, engelle.",
  "urun.n2.baslik": "AI ajan istihbaratı",
  "urun.n2.metin": "GPTBot'tan Bytespider'a kadar her operatörü tek panelde yönet.",
  "urun.n3.baslik": "Milisaniye içgörü",
  "urun.n3.metin": "48ms altında karar, 14 günlük trafik trendleri, ısı haritaları.",

  // --- AI koruma ---
  "aikoruma.rozet": "AI ajan kataloğu",
  "aikoruma.baslik": "Her AI ajanına ayrı politika",
  "aikoruma.aciklama": "GPTBot, ClaudeBot, Google-Extended, Bytespider — 15+ tanınan AI crawler'ı User-Agent ve TLS parmak iziyle doğrular. İzin ver, doğrula ya da engelle; kararların tek tıkla gerçek robots.txt'e döner.",
  "aikoruma.gorselAlt": "AI ajanı ghost-font bariyerinde durdurulurken insan kullanıcı rahatça geçiyor",
  "aikoruma.m1": "Model eğitimi crawler'larını engelle, aramayı serbest bırak",
  "aikoruma.m2": "robots.txt'i yok sayan ajanları AKTİF olarak durdur",
  "aikoruma.m3": "Tek tıkla hazır politika profilleri (sıkı / dengeli / açık)",

  // --- Compare ---
  "compare.rozet": "Karşılaştırma",
  "compare.baslik": "Klasik CAPTCHA nerede kalıyor",
  "compare.veylify": "Veylify",
  "compare.klasik": "Klasik CAPTCHA",
  "compare.s1": "AI vision modellerine dayanıklı (ghost-font)",
  "compare.s2": "Ekran görüntüsüne karşı dayanıklı (temporal dithering)",
  "compare.s3": "Davranış biyometrisi (fare/klavye/zamanlama)",
  "compare.s4": "AI ajanlarına aktif politika (robots.txt + engelleme)",
  "compare.s5": "Görünmez mod (davranışla sürtünmesiz doğrulama)",
  "compare.s6": "Coğrafi & ASN istihbaratı + kural motoru",

  // --- Testimonials ---
  "yorum.rozet": "Müşteriler ne diyor",
  "yorum.baslik": "Ekipler Veylify'a güveniyor",

  // --- Stats ---
  "stat.1": "OCR körlüğü (kanıtlı)",
  "stat.2": "ortalama yanıt süresi",
  "stat.3": "tanınan AI crawler",
  "stat.4": "insan geçiş oranı",

  // --- Code ---
  "kod.rozet": "Geliştirici dostu",
  "kod.baslik": "Tek satır ekle, koruma başlasın",
  "kod.aciklama": "Script etiketi ya da reCAPTCHA uyumlu API. Mevcut backend'iniz değişmeden çalışır. Her dilde SDK, kapsamlı dokümanlar.",
  "kod.m1": "Sunucu-taraflı doğrulama (siteverify)",
  "kod.m2": "Görünmez pasif skorlama",
  "kod.m3": "Webhook & Slack entegrasyonu",

  // --- Pricing ---
  "fiyat.rozet": "Fiyatlandırma",
  "fiyat.baslik": "Basit, şeffaf, ölçeklenen",
  "fiyat.aciklama": "Kredi kartı gerekmez. İstediğin zaman iptal et.",
  "fiyat.free.ozet": "Kişisel projeler için",
  "fiyat.pro.ozet": "Büyüyen ekipler için",
  "fiyat.scale.ozet": "Yüksek trafik & SLA",
  "fiyat.populer": "En popüler",
  "fiyat.basla": "Başla",
  "fiyat.iletisim": "İletişime geç",
  "fiyat.dogrulamaAy": "doğrulama/ay",
  "fiyat.site": "site",
  "fiyat.ghostfont": "Ghost-font CAPTCHA",
  "fiyat.toplulukDestek": "Topluluk desteği",
  "fiyat.tumKatman": "Tüm savunma katmanları",
  "fiyat.kuralGorunmez": "Kural motoru + görünmez mod",
  "fiyat.oncelikDestek": "Öncelikli destek",
  "fiyat.sinirsizDog": "Sınırsız doğrulama",
  "fiyat.ozelSla": "Özel SLA + SSO",
  "fiyat.sinirsizSite": "Sınırsız site",
  "fiyat.adanmisMuh": "Adanmış çözüm mühendisi",
  "fiyat.onpremise": "On-premise seçeneği",
  "fiyat.sinirsiz": "Sınırsız",

  // --- Güven ---
  "guven.rozet": "Güven & uyumluluk",
  "guven.baslik": "Kurumsal güvenlik, gün bir'den itibaren",
  "guven.aciklama": "Veriniz sizde kalır. Ghost-font tarayıcıda çalışır — sunucumuza asla piksel gitmez. Uyumluluk ilk günden düşünüldü.",
  "guven.r1.ad": "KVKK uyumlu",
  "guven.r1.alt": "Veriler Türkiye'de, aydınlatma metni hazır",
  "guven.r2.ad": "Uçtan uca şifreli",
  "guven.r2.alt": "TLS 1.3 + at-rest AES-256",
  "guven.r3.ad": "SOC 2 hedefli",
  "guven.r3.alt": "Denetim izleri & erişim kontrolü",
  "guven.r4.ad": "GDPR hazır",
  "guven.r4.alt": "AB veri işleme sözleşmesi",
  "guven.r5.ad": "%99.9 uptime",
  "guven.r5.alt": "Çok-bölgeli edge dağıtımı",
  "guven.r6.ad": "Sıfır PII sızıntısı",
  "guven.r6.alt": "Ghost-font istemcide çalışır",

  // --- Entegrasyonlar ---
  "enteg.rozet": "Entegrasyonlar",
  "enteg.baslik": "Yığınınız neyse, oraya oturur",
  "enteg.aciklama": "Script etiketi, reCAPTCHA-uyumlu API veya sunucu-taraflı SDK. WordPress'ten Next.js'e, Shopify'dan kendi backend'inize — dakikalar içinde bağlanır.",
  "enteg.m1": "reCAPTCHA v2/v3 uyumlu — kodu değiştirmeden geçiş",
  "enteg.m2": "Her dilde SDK + kapsamlı doküman",
  "enteg.m3": "Webhook & Slack ile anlık uyarı",
  "enteg.link": "Nasıl çalıştığını gör",

  // --- Final CTA ---
  "cta.baslik": "Sitenizi AI botlarından bugün koruyun",
  "cta.aciklama": "Ücretsiz başlayın, kredi kartı gerekmez. 10 dakikada kurun, ilk botunuzu bugün engelleyin.",
  "cta.buton1": "Ücretsiz başla",
  "cta.buton2": "Satışla konuş",

  // --- FAQ ---
  "faq.rozet": "Sık sorulanlar",
  "faq.baslik": "Merak edilenler",

  // --- Footer ---
  "footer.slogan": "AI çağının bot koruması. İnsanın gördüğü, makinenin göremediği doğrulama.",
  "footer.urun": "Ürün",
  "footer.sirket": "Şirket",
  "footer.kaynaklar": "Kaynaklar",
  "footer.yasal": "Yasal",
  "footer.haklar": "Tüm hakları saklıdır.",
  "footer.sistemler": "Tüm sistemler çalışıyor",

  // --- Ortak ---
  "ortak.evet": "var",
  "ortak.hayir": "yok",
};

/* Diğer diller ayrı dosyalardan gelir (landing.<dil>.ts) — burada birleştirilir. */
import { en } from "./landing.en";
import { de } from "./landing.de";
import { fr } from "./landing.fr";
import { es } from "./landing.es";

export const SOZLUK: Record<LandingDil, Sozluk> = { tr, en, de, fr, es };

/** Landing çevirisi: anahtarı seçili dile çevir; yoksa TR'ye, o da yoksa anahtara düş. */
export function landingCeviri(anahtar: string, dil: LandingDil = LANDING_VARSAYILAN): string {
  return SOZLUK[dil]?.[anahtar] ?? tr[anahtar] ?? anahtar;
}

/** TR anahtar kümesi — diğer dillerin eksiksizliğini doğrulamak için dışa açılır. */
export const TR_ANAHTARLAR = Object.keys(tr);
export { tr as landingTr };
