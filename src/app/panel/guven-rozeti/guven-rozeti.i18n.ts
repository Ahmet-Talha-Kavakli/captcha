/**
 * Güven Rozeti & Şeffaflık sayfası — yerel çeviri sözlüğü.
 *
 * Sadece bu sayfaya özgü PANEL (operatör) UI metinlerini içerir. Paylaşılan
 * `src/lib/i18n/panel.ts` sözlüğüne ve `rozet.ts` yardımcı dosyasına DOKUNMAZ.
 * Anahtar bulunamazsa TR'ye, o da yoksa anahtarın kendisine düşer.
 *
 * ÖNEMLİ VERİ ↔ UI ayrımı:
 *   - GÖMME KODU (gomKodu/rozetSvg çıktısı) müşteri sitesine gider; içindeki
 *     "Specter ile korunuyor" / "X bot engellendi" gibi metinler VERİDİR ve
 *     `rozet.ts`'ten geldiği gibi (TR) kalır — çevrilmez, çünkü ziyaretçiye
 *     giden gömülü rozetin sabit içeriğidir.
 *   - PANEL ÖNİZLEME etiketleri (canlı rozet önizlemesi, seviye rozeti, öne
 *     çıkan istatistik metni) operatöre gösterilir → ÇEVRİLİR. Bunlar
 *     `rozet.ts`'teki seviyeEtiket/vurguMetni yerine burada, enum değerinden
 *     (rozetSeviye/vurgu) yeniden türetilir.
 *   - Enum DEĞERLERİ (acik/koyu, kompakt/detayli/minimal, bot/oran/uptime,
 *     bronz/gümüş/altın, html/svg/markdown) asla çevrilmez; label-map değil
 *     key-map kullanılır.
 *   - Sayı/yüzde/skor/URL veridir; {n} yer tutucusuyla araya sokulur.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // Sayfa başlığı eki (nav.trustbadge + bu ek → "Güven Rozeti & Şeffaflık")
    "gr.baslikEk": " & Şeffaflık",

    // Üst KPI'lar
    "gr.kpi.korunanIstek": "Korunan istek",
    "gr.kpi.engellenenBot": "Engellenen bot",
    "gr.kpi.blokOrani": "Blok oranı",
    "gr.kpi.korunanSite": "Korunan site",

    // Sol panel — rozet önizleme
    "gr.onizleme.baslik": "Rozet önizlemesi",
    "gr.onizleme.aciklama": "Ziyaretçilerine sitenin AI botlarına ve kazıyıcılara karşı Veylify ile korunduğunu göster. Her gömülü rozet, gerçek koruma rakamını yansıtır.",
    "gr.secici.tema": "Tema",
    "gr.secici.stil": "Stil",
    "gr.secici.vurgu": "Öne çıkan istatistik",

    // Tema seçenekleri (key-map: acik/koyu)
    "gr.tema.acik": "Açık",
    "gr.tema.koyu": "Koyu",
    // Stil seçenekleri (key-map: kompakt/detayli/minimal)
    "gr.stil.kompakt": "Kompakt",
    "gr.stil.detayli": "Detaylı",
    "gr.stil.minimal": "Minimal",
    // Vurgu seçenekleri (key-map: bot/oran/uptime)
    "gr.vurgu.bot": "Engellenen bot",
    "gr.vurgu.oran": "Blok oranı",
    "gr.vurgu.uptime": "Çalışma süresi",

    // Rozet üzerindeki başlık (panel önizlemesi) — ziyaretçiye giden gömme
    // kodunda değil; yalnızca operatörün gördüğü canlı önizlemede kullanılır.
    "gr.rozet.baslik": "Veylify ile korunuyor",

    // Öne çıkan istatistik önizleme metni (rozet.ts vurguMetni yerine — panel içi)
    "gr.stat.bot": "{n} bot engellendi",
    "gr.stat.oran": "%{n} bot engellendi",
    "gr.stat.uptime": "%{n} çalışma süresi",

    // Seviye etiketi (key-map: bronz/gümüş/altın) — panel önizlemesi
    "gr.seviye.bronz": "Bronz Koruma",
    "gr.seviye.gümüş": "Gümüş Koruma",
    "gr.seviye.altın": "Altın Koruma",

    // Neden güven rozeti?
    "gr.analitik.baslik": "Rozet gösterim analitiği",
    "gr.analitik.aciklama":
      "Rozetinin ziyaretçilere ne kadar gösterildiğini, tıklanma oranını ve güven skorunu izle. Değerler gerçek koruma hacminden türetilir.",
    "gr.analitik.guvenSkoru": "Güven skoru",
    "gr.analitik.seviye": "Rozet seviyesi: {ad}",
    "gr.analitik.gosterim": "Gösterim",
    "gr.analitik.tiklama": "Tıklama",
    "gr.analitik.ctr": "Tıklama oranı",
    "gr.analitik.uptime": "Çalışma süresi",
    "gr.analitik.trendBaslik": "Son 14 gün · gösterim & tıklama",
    "gr.analitik.stilBaslik": "Rozet stili dağılımı (gösterim payı)",
    "gr.analitik.stilMerkez": "pay %",

    "gr.neden.baslik": "Neden güven rozeti?",
    "gr.neden.guven.baslik": "Ziyaretçi güveni",
    "gr.neden.guven.metin": "Aktif koruma sinyali gören kullanıcılarda dönüşüm ve tamamlama oranı belirgin şekilde artar — tıpkı SSL kilidi gibi.",
    "gr.neden.tanit.baslik": "Her rozet Veylify'ı tanıtır",
    "gr.neden.tanit.metin": "Sitene gömülen her rozet, ziyaretçini doğrulama sayfasına taşır ve Veylify'ı organik olarak pazarlar.",
    "gr.neden.seo.baslik": "SEO & itibar",
    "gr.neden.seo.metin": "Herkese açık, doğrulanabilir şeffaflık sayfası backlink ve arama görünürlüğü üretir; markanı güvenilir kılar.",

    // Biçim etiketi (yalnızca "Satır-içi SVG" çevrilir; HTML/Markdown ad kalır)
    "gr.bicim.svg": "Satır-içi SVG",

    // Sağ panel — gömme kodu
    "gr.gom.baslik": "Rozeti sitene göm",
    "gr.gom.aciklama": "Bağımsız gömme kodu — harici istek yok, SVG doğrudan işaretlemeye gömülür. Bir biçim seç ve kopyala.",
    "gr.gom.kopyala": "Kopyala",
    "gr.gom.kopyalandi": "Kopyalandı",
    "gr.gom.toast.baslik": "Gömme kodu kopyalandı",
    "gr.gom.not.on": "Rozet üzerindeki rakamlar ",
    "gr.gom.not.vurgu": "yuvarlanmış",
    "gr.gom.not.son": " ve topludur; IP, kural veya sayfa yolu gibi hassas iç ayrıntı ziyaretçiye asla gösterilmez.",

    // Şeffaflık anlık görüntüsü
    "gr.seffaf.baslik": "Şeffaflık anlık görüntüsü",
    "gr.seffaf.onizleme": "önizleme",
    "gr.seffaf.acikSayfa": "Herkese açık sayfa (mevcut Güven Mührü rotası)",
    "gr.seffaf.ac": "Aç",
    "gr.seffaf.dogrulanmis": "Doğrulanmış Veylify Koruması",
    "gr.seffaf.altbaslik": "AI botlarına ve kazıyıcılara karşı korunuyor",
    "gr.seffaf.h.korunanIstek": "korunan istek",
    "gr.seffaf.h.botEngellendi": "bot engellendi",
    "gr.seffaf.h.blokOrani": "blok oranı",
    "gr.seffaf.h.calismaSuresi": "çalışma süresi",
    "gr.seffaf.altbilgi": "Güven skoru {skor}/100 · {gun} gündür aktif koruma",
    "gr.seffaf.notu.on": "Bu ",
    "gr.seffaf.notu.vurgu": "önizleme",
    "gr.seffaf.notu.son": ", ziyaretçilerinin göreceği herkese açık şeffaflık kartını temsil eder. Gösterilen sayılar gerçek koruma verinden türetilmiş, ziyaretçiye uygun şekilde yuvarlanmış değerlerdir.",

    // Doğrulanmamış site uyarısı
    "gr.uyari.baslik": "Henüz doğrulanmış site yok",
    "gr.uyari.metin": "Rozeti canlıya almadan önce en az bir siteni doğrula. Doğrulanmış siteler herkese açık şeffaflık sayfasını yayımlamaya uygundur.",
    "gr.uyari.buton": "Siteleri yönet",
  },

  en: {
    "gr.baslikEk": " & Transparency",

    "gr.kpi.korunanIstek": "Protected requests",
    "gr.kpi.engellenenBot": "Bots blocked",
    "gr.kpi.blokOrani": "Block rate",
    "gr.kpi.korunanSite": "Protected sites",

    "gr.onizleme.baslik": "Badge preview",
    "gr.onizleme.aciklama": "Show your visitors that the site is protected by Veylify against AI bots and scrapers. Each embedded badge reflects the real protection figure.",
    "gr.secici.tema": "Theme",
    "gr.secici.stil": "Style",
    "gr.secici.vurgu": "Featured stat",

    "gr.tema.acik": "Light",
    "gr.tema.koyu": "Dark",
    "gr.stil.kompakt": "Compact",
    "gr.stil.detayli": "Detailed",
    "gr.stil.minimal": "Minimal",
    "gr.vurgu.bot": "Bots blocked",
    "gr.vurgu.oran": "Block rate",
    "gr.vurgu.uptime": "Uptime",

    "gr.rozet.baslik": "Protected by Veylify",

    "gr.stat.bot": "{n} bots blocked",
    "gr.stat.oran": "{n}% bots blocked",
    "gr.stat.uptime": "{n}% uptime",

    "gr.seviye.bronz": "Bronze Protection",
    "gr.seviye.gümüş": "Silver Protection",
    "gr.seviye.altın": "Gold Protection",

    "gr.analitik.baslik": "Badge display analytics",
    "gr.analitik.aciklama":
      "Track how often your badge is shown to visitors, its click-through rate and trust score. Values are derived from real protection volume.",
    "gr.analitik.guvenSkoru": "Trust score",
    "gr.analitik.seviye": "Badge level: {ad}",
    "gr.analitik.gosterim": "Impressions",
    "gr.analitik.tiklama": "Clicks",
    "gr.analitik.ctr": "Click-through rate",
    "gr.analitik.uptime": "Uptime",
    "gr.analitik.trendBaslik": "Last 14 days · impressions & clicks",
    "gr.analitik.stilBaslik": "Badge style distribution (impression share)",
    "gr.analitik.stilMerkez": "share %",

    "gr.neden.baslik": "Why a trust badge?",
    "gr.neden.guven.baslik": "Visitor trust",
    "gr.neden.guven.metin": "Users who see an active protection signal show noticeably higher conversion and completion rates — just like the SSL padlock.",
    "gr.neden.tanit.baslik": "Every badge promotes Veylify",
    "gr.neden.tanit.metin": "Every badge embedded on your site takes your visitor to the verification page and markets Veylify organically.",
    "gr.neden.seo.baslik": "SEO & reputation",
    "gr.neden.seo.metin": "A public, verifiable transparency page generates backlinks and search visibility, making your brand more trustworthy.",

    "gr.bicim.svg": "Inline SVG",

    "gr.gom.baslik": "Embed the badge on your site",
    "gr.gom.aciklama": "Self-contained embed code — no external requests, the SVG is embedded directly in the markup. Pick a format and copy.",
    "gr.gom.kopyala": "Copy",
    "gr.gom.kopyalandi": "Copied",
    "gr.gom.toast.baslik": "Embed code copied",
    "gr.gom.not.on": "The numbers on the badge are ",
    "gr.gom.not.vurgu": "rounded",
    "gr.gom.not.son": " and aggregated; sensitive internal detail such as IP, rule or page path is never shown to visitors.",

    "gr.seffaf.baslik": "Transparency snapshot",
    "gr.seffaf.onizleme": "preview",
    "gr.seffaf.acikSayfa": "Public page (current Trust Seal route)",
    "gr.seffaf.ac": "Open",
    "gr.seffaf.dogrulanmis": "Verified Veylify Protection",
    "gr.seffaf.altbaslik": "Protected against AI bots and scrapers",
    "gr.seffaf.h.korunanIstek": "protected requests",
    "gr.seffaf.h.botEngellendi": "bots blocked",
    "gr.seffaf.h.blokOrani": "block rate",
    "gr.seffaf.h.calismaSuresi": "uptime",
    "gr.seffaf.altbilgi": "Trust score {skor}/100 · active protection for {gun} days",
    "gr.seffaf.notu.on": "This ",
    "gr.seffaf.notu.vurgu": "preview",
    "gr.seffaf.notu.son": " represents the public transparency card your visitors will see. The numbers shown are derived from your real protection data and rounded appropriately for visitors.",

    "gr.uyari.baslik": "No verified sites yet",
    "gr.uyari.metin": "Verify at least one of your sites before going live with the badge. Verified sites are eligible to publish the public transparency page.",
    "gr.uyari.buton": "Manage sites",
  },

  de: {
    "gr.baslikEk": " & Transparenz",

    "gr.kpi.korunanIstek": "Geschützte Anfragen",
    "gr.kpi.engellenenBot": "Blockierte Bots",
    "gr.kpi.blokOrani": "Blockrate",
    "gr.kpi.korunanSite": "Geschützte Sites",

    "gr.onizleme.baslik": "Abzeichen-Vorschau",
    "gr.onizleme.aciklama": "Zeigen Sie Ihren Besuchern, dass die Site von Veylify gegen KI-Bots und Scraper geschützt ist. Jedes eingebettete Abzeichen spiegelt die echte Schutzzahl wider.",
    "gr.secici.tema": "Thema",
    "gr.secici.stil": "Stil",
    "gr.secici.vurgu": "Hervorgehobene Statistik",

    "gr.tema.acik": "Hell",
    "gr.tema.koyu": "Dunkel",
    "gr.stil.kompakt": "Kompakt",
    "gr.stil.detayli": "Detailliert",
    "gr.stil.minimal": "Minimal",
    "gr.vurgu.bot": "Blockierte Bots",
    "gr.vurgu.oran": "Blockrate",
    "gr.vurgu.uptime": "Verfügbarkeit",

    "gr.rozet.baslik": "Geschützt durch Veylify",

    "gr.stat.bot": "{n} Bots blockiert",
    "gr.stat.oran": "{n} % Bots blockiert",
    "gr.stat.uptime": "{n} % Verfügbarkeit",

    "gr.seviye.bronz": "Bronze-Schutz",
    "gr.seviye.gümüş": "Silber-Schutz",
    "gr.seviye.altın": "Gold-Schutz",

    "gr.analitik.baslik": "Badge-Anzeigeanalyse",
    "gr.analitik.aciklama":
      "Verfolge, wie oft dein Badge Besuchern angezeigt wird, seine Klickrate und den Vertrauens-Score. Die Werte werden aus dem echten Schutzvolumen abgeleitet.",
    "gr.analitik.guvenSkoru": "Vertrauens-Score",
    "gr.analitik.seviye": "Badge-Stufe: {ad}",
    "gr.analitik.gosterim": "Impressionen",
    "gr.analitik.tiklama": "Klicks",
    "gr.analitik.ctr": "Klickrate",
    "gr.analitik.uptime": "Verfügbarkeit",
    "gr.analitik.trendBaslik": "Letzte 14 Tage · Impressionen & Klicks",
    "gr.analitik.stilBaslik": "Badge-Stil-Verteilung (Impressionsanteil)",
    "gr.analitik.stilMerkez": "Anteil %",

    "gr.neden.baslik": "Warum ein Vertrauensabzeichen?",
    "gr.neden.guven.baslik": "Besuchervertrauen",
    "gr.neden.guven.metin": "Nutzer, die ein aktives Schutzsignal sehen, zeigen deutlich höhere Konversions- und Abschlussraten — genau wie das SSL-Schloss.",
    "gr.neden.tanit.baslik": "Jedes Abzeichen bewirbt Veylify",
    "gr.neden.tanit.metin": "Jedes auf Ihrer Site eingebettete Abzeichen führt Ihren Besucher zur Verifizierungsseite und vermarktet Veylify organisch.",
    "gr.neden.seo.baslik": "SEO & Reputation",
    "gr.neden.seo.metin": "Eine öffentliche, überprüfbare Transparenzseite erzeugt Backlinks und Suchsichtbarkeit und macht Ihre Marke vertrauenswürdiger.",

    "gr.bicim.svg": "Inline-SVG",

    "gr.gom.baslik": "Abzeichen auf Ihrer Site einbetten",
    "gr.gom.aciklama": "Eigenständiger Einbettungscode — keine externen Anfragen, das SVG wird direkt in das Markup eingebettet. Wählen Sie ein Format und kopieren Sie.",
    "gr.gom.kopyala": "Kopieren",
    "gr.gom.kopyalandi": "Kopiert",
    "gr.gom.toast.baslik": "Einbettungscode kopiert",
    "gr.gom.not.on": "Die Zahlen auf dem Abzeichen sind ",
    "gr.gom.not.vurgu": "gerundet",
    "gr.gom.not.son": " und aggregiert; sensible interne Details wie IP, Regel oder Seitenpfad werden Besuchern niemals angezeigt.",

    "gr.seffaf.baslik": "Transparenz-Momentaufnahme",
    "gr.seffaf.onizleme": "Vorschau",
    "gr.seffaf.acikSayfa": "Öffentliche Seite (aktuelle Trust-Seal-Route)",
    "gr.seffaf.ac": "Öffnen",
    "gr.seffaf.dogrulanmis": "Verifizierter Veylify-Schutz",
    "gr.seffaf.altbaslik": "Geschützt gegen KI-Bots und Scraper",
    "gr.seffaf.h.korunanIstek": "geschützte Anfragen",
    "gr.seffaf.h.botEngellendi": "Bots blockiert",
    "gr.seffaf.h.blokOrani": "Blockrate",
    "gr.seffaf.h.calismaSuresi": "Verfügbarkeit",
    "gr.seffaf.altbilgi": "Vertrauensscore {skor}/100 · aktiver Schutz seit {gun} Tagen",
    "gr.seffaf.notu.on": "Diese ",
    "gr.seffaf.notu.vurgu": "Vorschau",
    "gr.seffaf.notu.son": " stellt die öffentliche Transparenzkarte dar, die Ihre Besucher sehen werden. Die angezeigten Zahlen sind aus Ihren echten Schutzdaten abgeleitet und für Besucher angemessen gerundet.",

    "gr.uyari.baslik": "Noch keine verifizierten Sites",
    "gr.uyari.metin": "Verifizieren Sie mindestens eine Ihrer Sites, bevor Sie das Abzeichen live schalten. Verifizierte Sites sind berechtigt, die öffentliche Transparenzseite zu veröffentlichen.",
    "gr.uyari.buton": "Sites verwalten",
  },

  fr: {
    "gr.baslikEk": " & Transparence",

    "gr.kpi.korunanIstek": "Requêtes protégées",
    "gr.kpi.engellenenBot": "Bots bloqués",
    "gr.kpi.blokOrani": "Taux de blocage",
    "gr.kpi.korunanSite": "Sites protégés",

    "gr.onizleme.baslik": "Aperçu du badge",
    "gr.onizleme.aciklama": "Montrez à vos visiteurs que le site est protégé par Veylify contre les bots IA et les scrapers. Chaque badge intégré reflète le chiffre de protection réel.",
    "gr.secici.tema": "Thème",
    "gr.secici.stil": "Style",
    "gr.secici.vurgu": "Statistique mise en avant",

    "gr.tema.acik": "Clair",
    "gr.tema.koyu": "Sombre",
    "gr.stil.kompakt": "Compact",
    "gr.stil.detayli": "Détaillé",
    "gr.stil.minimal": "Minimal",
    "gr.vurgu.bot": "Bots bloqués",
    "gr.vurgu.oran": "Taux de blocage",
    "gr.vurgu.uptime": "Disponibilité",

    "gr.rozet.baslik": "Protégé par Veylify",

    "gr.stat.bot": "{n} bots bloqués",
    "gr.stat.oran": "{n} % de bots bloqués",
    "gr.stat.uptime": "{n} % de disponibilité",

    "gr.seviye.bronz": "Protection Bronze",
    "gr.seviye.gümüş": "Protection Argent",
    "gr.seviye.altın": "Protection Or",

    "gr.analitik.baslik": "Analytique d'affichage du badge",
    "gr.analitik.aciklama":
      "Suivez la fréquence d'affichage de votre badge aux visiteurs, son taux de clic et son score de confiance. Les valeurs sont dérivées du volume de protection réel.",
    "gr.analitik.guvenSkoru": "Score de confiance",
    "gr.analitik.seviye": "Niveau du badge : {ad}",
    "gr.analitik.gosterim": "Impressions",
    "gr.analitik.tiklama": "Clics",
    "gr.analitik.ctr": "Taux de clic",
    "gr.analitik.uptime": "Disponibilité",
    "gr.analitik.trendBaslik": "14 derniers jours · impressions & clics",
    "gr.analitik.stilBaslik": "Répartition des styles de badge (part d'impressions)",
    "gr.analitik.stilMerkez": "part %",

    "gr.neden.baslik": "Pourquoi un badge de confiance ?",
    "gr.neden.guven.baslik": "Confiance des visiteurs",
    "gr.neden.guven.metin": "Les utilisateurs qui voient un signal de protection actif présentent des taux de conversion et d'achèvement nettement plus élevés — tout comme le cadenas SSL.",
    "gr.neden.tanit.baslik": "Chaque badge promeut Veylify",
    "gr.neden.tanit.metin": "Chaque badge intégré à votre site amène votre visiteur à la page de vérification et promeut Veylify de manière organique.",
    "gr.neden.seo.baslik": "SEO & réputation",
    "gr.neden.seo.metin": "Une page de transparence publique et vérifiable génère des backlinks et de la visibilité dans les recherches, rendant votre marque plus fiable.",

    "gr.bicim.svg": "SVG en ligne",

    "gr.gom.baslik": "Intégrer le badge sur votre site",
    "gr.gom.aciklama": "Code d'intégration autonome — aucune requête externe, le SVG est intégré directement dans le balisage. Choisissez un format et copiez.",
    "gr.gom.kopyala": "Copier",
    "gr.gom.kopyalandi": "Copié",
    "gr.gom.toast.baslik": "Code d'intégration copié",
    "gr.gom.not.on": "Les chiffres sur le badge sont ",
    "gr.gom.not.vurgu": "arrondis",
    "gr.gom.not.son": " et agrégés ; les détails internes sensibles tels que l'IP, la règle ou le chemin de page ne sont jamais montrés aux visiteurs.",

    "gr.seffaf.baslik": "Instantané de transparence",
    "gr.seffaf.onizleme": "aperçu",
    "gr.seffaf.acikSayfa": "Page publique (route Sceau de confiance actuelle)",
    "gr.seffaf.ac": "Ouvrir",
    "gr.seffaf.dogrulanmis": "Protection Veylify vérifiée",
    "gr.seffaf.altbaslik": "Protégé contre les bots IA et les scrapers",
    "gr.seffaf.h.korunanIstek": "requêtes protégées",
    "gr.seffaf.h.botEngellendi": "bots bloqués",
    "gr.seffaf.h.blokOrani": "taux de blocage",
    "gr.seffaf.h.calismaSuresi": "disponibilité",
    "gr.seffaf.altbilgi": "Score de confiance {skor}/100 · protection active depuis {gun} jours",
    "gr.seffaf.notu.on": "Cet ",
    "gr.seffaf.notu.vurgu": "aperçu",
    "gr.seffaf.notu.son": " représente la carte de transparence publique que vos visiteurs verront. Les chiffres affichés sont dérivés de vos données de protection réelles et arrondis de manière appropriée pour les visiteurs.",

    "gr.uyari.baslik": "Aucun site vérifié pour le moment",
    "gr.uyari.metin": "Vérifiez au moins un de vos sites avant de mettre le badge en ligne. Les sites vérifiés peuvent publier la page de transparence publique.",
    "gr.uyari.buton": "Gérer les sites",
  },

  es: {
    "gr.baslikEk": " y Transparencia",

    "gr.kpi.korunanIstek": "Solicitudes protegidas",
    "gr.kpi.engellenenBot": "Bots bloqueados",
    "gr.kpi.blokOrani": "Tasa de bloqueo",
    "gr.kpi.korunanSite": "Sitios protegidos",

    "gr.onizleme.baslik": "Vista previa de la insignia",
    "gr.onizleme.aciklama": "Muestra a tus visitantes que el sitio está protegido por Veylify frente a bots de IA y scrapers. Cada insignia incrustada refleja la cifra de protección real.",
    "gr.secici.tema": "Tema",
    "gr.secici.stil": "Estilo",
    "gr.secici.vurgu": "Estadística destacada",

    "gr.tema.acik": "Claro",
    "gr.tema.koyu": "Oscuro",
    "gr.stil.kompakt": "Compacta",
    "gr.stil.detayli": "Detallada",
    "gr.stil.minimal": "Minimalista",
    "gr.vurgu.bot": "Bots bloqueados",
    "gr.vurgu.oran": "Tasa de bloqueo",
    "gr.vurgu.uptime": "Tiempo activo",

    "gr.rozet.baslik": "Protegido por Veylify",

    "gr.stat.bot": "{n} bots bloqueados",
    "gr.stat.oran": "{n} % de bots bloqueados",
    "gr.stat.uptime": "{n} % de tiempo activo",

    "gr.seviye.bronz": "Protección Bronce",
    "gr.seviye.gümüş": "Protección Plata",
    "gr.seviye.altın": "Protección Oro",

    "gr.analitik.baslik": "Analítica de visualización de la insignia",
    "gr.analitik.aciklama":
      "Sigue con qué frecuencia se muestra tu insignia a los visitantes, su tasa de clics y su puntaje de confianza. Los valores se derivan del volumen de protección real.",
    "gr.analitik.guvenSkoru": "Puntaje de confianza",
    "gr.analitik.seviye": "Nivel de insignia: {ad}",
    "gr.analitik.gosterim": "Impresiones",
    "gr.analitik.tiklama": "Clics",
    "gr.analitik.ctr": "Tasa de clics",
    "gr.analitik.uptime": "Tiempo activo",
    "gr.analitik.trendBaslik": "Últimos 14 días · impresiones y clics",
    "gr.analitik.stilBaslik": "Distribución de estilos de insignia (cuota de impresiones)",
    "gr.analitik.stilMerkez": "cuota %",

    "gr.neden.baslik": "¿Por qué una insignia de confianza?",
    "gr.neden.guven.baslik": "Confianza del visitante",
    "gr.neden.guven.metin": "Los usuarios que ven una señal de protección activa muestran tasas de conversión y finalización notablemente más altas, igual que el candado SSL.",
    "gr.neden.tanit.baslik": "Cada insignia promociona Veylify",
    "gr.neden.tanit.metin": "Cada insignia incrustada en tu sitio lleva a tu visitante a la página de verificación y promociona Veylify de forma orgánica.",
    "gr.neden.seo.baslik": "SEO y reputación",
    "gr.neden.seo.metin": "Una página de transparencia pública y verificable genera backlinks y visibilidad en búsquedas, haciendo tu marca más confiable.",

    "gr.bicim.svg": "SVG en línea",

    "gr.gom.baslik": "Incrusta la insignia en tu sitio",
    "gr.gom.aciklama": "Código de inserción autónomo: sin solicitudes externas, el SVG se incrusta directamente en el marcado. Elige un formato y copia.",
    "gr.gom.kopyala": "Copiar",
    "gr.gom.kopyalandi": "Copiado",
    "gr.gom.toast.baslik": "Código de inserción copiado",
    "gr.gom.not.on": "Las cifras de la insignia están ",
    "gr.gom.not.vurgu": "redondeadas",
    "gr.gom.not.son": " y agregadas; los detalles internos sensibles como IP, regla o ruta de página nunca se muestran a los visitantes.",

    "gr.seffaf.baslik": "Instantánea de transparencia",
    "gr.seffaf.onizleme": "vista previa",
    "gr.seffaf.acikSayfa": "Página pública (ruta actual del Sello de confianza)",
    "gr.seffaf.ac": "Abrir",
    "gr.seffaf.dogrulanmis": "Protección Veylify verificada",
    "gr.seffaf.altbaslik": "Protegido frente a bots de IA y scrapers",
    "gr.seffaf.h.korunanIstek": "solicitudes protegidas",
    "gr.seffaf.h.botEngellendi": "bots bloqueados",
    "gr.seffaf.h.blokOrani": "tasa de bloqueo",
    "gr.seffaf.h.calismaSuresi": "tiempo activo",
    "gr.seffaf.altbilgi": "Puntuación de confianza {skor}/100 · protección activa durante {gun} días",
    "gr.seffaf.notu.on": "Esta ",
    "gr.seffaf.notu.vurgu": "vista previa",
    "gr.seffaf.notu.son": " representa la tarjeta de transparencia pública que verán tus visitantes. Las cifras mostradas se derivan de tus datos de protección reales y se redondean de forma adecuada para los visitantes.",

    "gr.uyari.baslik": "Aún no hay sitios verificados",
    "gr.uyari.metin": "Verifica al menos uno de tus sitios antes de poner la insignia en vivo. Los sitios verificados pueden publicar la página de transparencia pública.",
    "gr.uyari.buton": "Gestionar sitios",
  },
};

/** Güven Rozeti sayfası çeviri yardımcısı. */
export function grCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
