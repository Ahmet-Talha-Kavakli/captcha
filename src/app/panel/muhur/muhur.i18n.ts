import type { Dil } from "@/lib/i18n/panel";

// Güven Mührü paneli için yerel sözlük.
// Müşteri sitesine giden gömme kodu (HTML/SVG/React) ve rozete işlenen metin
// VERİ olarak kalır — yalnızca panel önizleme etiketleri çevrilir.
// Tema/boyut/konum enum ANAHTARLARI (koyu/orta/inline...) çevrilmez; yalnızca
// görüntülenen etiketleri anahtar-eşlemesiyle çevrilir.
const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    kirinti: "Güven Mührü",
    // KPI kartları
    kpiEngellenen: "Engellenen tehdit (30g)",
    kpiGorunum: "Rozet görüntülenme",
    kpiTrust: "Trust sayfası ziyareti",
    kpiKorunan: "Korunan site",

    // rozet önizleme paneli
    onizlemeBaslik: "Rozet önizlemesi",
    onizlemeMetin: "Ziyaretçilerine sitenin AI botlarına karşı korunduğunu göster. Canlı sayaç, korunan gerçek tehdit sayısını yansıtır.",
    sabitSag: "Sağ alt köşeye sabitlenir →",
    sabitSol: "← Sol alt köşeye sabitlenir",

    // rozet metni (müşteri sitesine gider ama panel önizlemede de görünür)
    rozetTehdit: "{n} tehdit engellendi",
    rozetKorunuyor: "Veylify ile korunuyor",

    // stil/boyut/konum seçici başlıkları
    tema: "Tema",
    boyut: "Boyut",
    konum: "Konum",
    canliSayac: "Canlı tehdit sayacı",

    // tema etiketleri (enum anahtarı değil)
    tema_koyu: "Koyu",
    tema_acik: "Açık",
    tema_mavi: "Mavi",

    // boyut etiketleri
    boyut_kucuk: "Küçük",
    boyut_orta: "Orta",
    boyut_buyuk: "Büyük",

    // konum etiketleri
    konum_inline: "Satır içi",
    "konum_sag-alt": "Sağ alt (sabit)",
    "konum_sol-alt": "Sol alt (sabit)",

    // güven skoru
    guvenBaslik: "Güven skoru",
    guvenEtiket: "koruma güveni",
    guvenEngelleme: "Engelleme başarısı",
    guvenCtr: "Rozet tıklama oranı",
    guvenDerece: "Genel derece",

    // rozet analitiği
    analitikBaslik: "Rozet analitiği (30g)",
    toplamGorunum: "toplam görüntülenme",
    aktif: "aktif",

    // sosyal kanıt kartı
    kanitBaslik: "Sosyal kanıt",
    kanitSoz: "Güven mührünü ekledikten sonra ziyaretçilerimizin siteye güveni gözle görülür arttı — sepet terk oranımız düştü, dönüşüm arttı.",
    kanitAd: "E. Yılmaz",
    kanitRol: "E-ticaret Direktörü",
    kanitStat1: "daha yüksek dönüşüm",
    kanitStat2: "aktif koruma",
    kanitStat3: "seviyesi güven",

    // gömme kodu paneli
    embedBaslik: "Rozeti sitene ekle",
    embedNot: "Rozet, sitendeki koruma istatistiklerini gerçek zamanlı yansıtır ve tıklandığında herkese açık doğrulama sayfana yönlendirir.",

    // doğrulanmış koruma sayfası
    trustBaslik: "Doğrulanmış koruma sayfası",
    herkeseAcik: "Herkese açık sayfa",
    ac: "Aç",
    dogrulanmisKoruma: "Doğrulanmış Koruma",
    korunuyorAlt: "Veylify tarafından AI botlarına karşı korunuyor",
    tehditEngellendi: "tehdit engellendi",
    engellemeOrani: "engelleme oranı",
    guvenDerecesi: "güven derecesi",
    korunmaBeri: "{tarih} tarihinden beri korunuyor",
    korumaAktif: "Koruma aktif",
    trustNot: "Bu herkese açık sayfa, müşterilerine sitenin bağımsız olarak korunduğunu kanıtlar — tıpkı bir SSL sertifikası gibi güven verir.",

    // neden güven mührü
    nedenBaslik: "Neden güven mührü?",
    fayda1Baslik: "Dönüşümü artırır",
    fayda1Metin: "Güven rozeti gören ziyaretçilerde ödeme tamamlama oranı ortalama %11 daha yüksek.",
    fayda2Baslik: "Botları caydırır",
    fayda2Metin: "Aktif koruma sinyali, otomatik saldırganların hedef seçiminde caydırıcıdır.",
    fayda3Baslik: "Marka güvenilirliği",
    fayda3Metin: "AI çağında \"içeriğim korunuyor\" mesajı, kullanıcı ve iş ortağı güvenini pekiştirir.",
  },
  en: {
    kirinti: "Trust Seal",
    kpiEngellenen: "Threats blocked (30d)",
    kpiGorunum: "Badge impressions",
    kpiTrust: "Trust page visits",
    kpiKorunan: "Protected sites",

    onizlemeBaslik: "Badge preview",
    onizlemeMetin: "Show your visitors that the site is protected against AI bots. The live counter reflects the real number of threats blocked.",
    sabitSag: "Pinned to bottom-right corner →",
    sabitSol: "← Pinned to bottom-left corner",

    rozetTehdit: "{n} threats blocked",
    rozetKorunuyor: "Protected by Veylify",

    tema: "Theme",
    boyut: "Size",
    konum: "Position",
    canliSayac: "Live threat counter",

    tema_koyu: "Dark",
    tema_acik: "Light",
    tema_mavi: "Blue",

    boyut_kucuk: "Small",
    boyut_orta: "Medium",
    boyut_buyuk: "Large",

    konum_inline: "Inline",
    "konum_sag-alt": "Bottom-right (fixed)",
    "konum_sol-alt": "Bottom-left (fixed)",

    guvenBaslik: "Trust score",
    guvenEtiket: "protection trust",
    guvenEngelleme: "Block success",
    guvenCtr: "Badge click rate",
    guvenDerece: "Overall grade",

    analitikBaslik: "Badge analytics (30d)",
    toplamGorunum: "total impressions",
    aktif: "active",

    kanitBaslik: "Social proof",
    kanitSoz: "After adding the trust seal, our visitors' confidence in the site grew visibly — cart abandonment dropped and conversion rose.",
    kanitAd: "E. Yılmaz",
    kanitRol: "E-commerce Director",
    kanitStat1: "higher conversion",
    kanitStat2: "active protection",
    kanitStat3: "level of trust",

    embedBaslik: "Add the badge to your site",
    embedNot: "The badge reflects your site's protection stats in real time and links to your public verification page when clicked.",

    trustBaslik: "Verified protection page",
    herkeseAcik: "Public page",
    ac: "Open",
    dogrulanmisKoruma: "Verified Protection",
    korunuyorAlt: "Protected against AI bots by Veylify",
    tehditEngellendi: "threats blocked",
    engellemeOrani: "block rate",
    guvenDerecesi: "trust grade",
    korunmaBeri: "Protected since {tarih}",
    korumaAktif: "Protection active",
    trustNot: "This public page proves to your customers that the site is independently protected — building trust just like an SSL certificate.",

    nedenBaslik: "Why a trust seal?",
    fayda1Baslik: "Boosts conversion",
    fayda1Metin: "Visitors who see a trust badge complete checkout at an 11% higher rate on average.",
    fayda2Baslik: "Deters bots",
    fayda2Metin: "An active protection signal deters automated attackers when picking targets.",
    fayda3Baslik: "Brand credibility",
    fayda3Metin: "In the AI era, a \"my content is protected\" message reinforces user and partner trust.",
  },
  de: {
    kirinti: "Vertrauenssiegel",
    kpiEngellenen: "Blockierte Bedrohungen (30 T.)",
    kpiGorunum: "Badge-Impressionen",
    kpiTrust: "Besuche der Trust-Seite",
    kpiKorunan: "Geschützte Websites",

    onizlemeBaslik: "Badge-Vorschau",
    onizlemeMetin: "Zeigen Sie Ihren Besuchern, dass die Website vor KI-Bots geschützt ist. Der Live-Zähler spiegelt die tatsächliche Anzahl blockierter Bedrohungen wider.",
    sabitSag: "Unten rechts fixiert →",
    sabitSol: "← Unten links fixiert",

    rozetTehdit: "{n} Bedrohungen blockiert",
    rozetKorunuyor: "Geschützt durch Veylify",

    tema: "Design",
    boyut: "Größe",
    konum: "Position",
    canliSayac: "Live-Bedrohungszähler",

    tema_koyu: "Dunkel",
    tema_acik: "Hell",
    tema_mavi: "Blau",

    boyut_kucuk: "Klein",
    boyut_orta: "Mittel",
    boyut_buyuk: "Groß",

    konum_inline: "Inline",
    "konum_sag-alt": "Unten rechts (fixiert)",
    "konum_sol-alt": "Unten links (fixiert)",

    guvenBaslik: "Vertrauensscore",
    guvenEtiket: "Schutzvertrauen",
    guvenEngelleme: "Blockier-Erfolg",
    guvenCtr: "Badge-Klickrate",
    guvenDerece: "Gesamtnote",

    analitikBaslik: "Badge-Analyse (30 T.)",
    toplamGorunum: "Impressionen gesamt",
    aktif: "aktiv",

    kanitBaslik: "Sozialer Beweis",
    kanitSoz: "Nach dem Hinzufügen des Vertrauenssiegels stieg das Vertrauen unserer Besucher sichtbar — die Warenkorbabbrüche sanken, die Conversion stieg.",
    kanitAd: "E. Yılmaz",
    kanitRol: "E-Commerce-Direktor",
    kanitStat1: "höhere Conversion",
    kanitStat2: "aktiver Schutz",
    kanitStat3: "Vertrauensniveau",

    embedBaslik: "Badge zu Ihrer Website hinzufügen",
    embedNot: "Der Badge spiegelt die Schutzstatistiken Ihrer Website in Echtzeit wider und verlinkt beim Anklicken auf Ihre öffentliche Verifizierungsseite.",

    trustBaslik: "Verifizierte Schutzseite",
    herkeseAcik: "Öffentliche Seite",
    ac: "Öffnen",
    dogrulanmisKoruma: "Verifizierter Schutz",
    korunuyorAlt: "Von Veylify vor KI-Bots geschützt",
    tehditEngellendi: "Bedrohungen blockiert",
    engellemeOrani: "Blockierrate",
    guvenDerecesi: "Vertrauensnote",
    korunmaBeri: "Geschützt seit {tarih}",
    korumaAktif: "Schutz aktiv",
    trustNot: "Diese öffentliche Seite beweist Ihren Kunden, dass die Website unabhängig geschützt ist — und schafft Vertrauen wie ein SSL-Zertifikat.",

    nedenBaslik: "Warum ein Vertrauenssiegel?",
    fayda1Baslik: "Steigert die Conversion",
    fayda1Metin: "Besucher, die ein Vertrauens-Badge sehen, schließen den Checkout im Schnitt um 11 % häufiger ab.",
    fayda2Baslik: "Schreckt Bots ab",
    fayda2Metin: "Ein aktives Schutzsignal schreckt automatisierte Angreifer bei der Zielauswahl ab.",
    fayda3Baslik: "Markenglaubwürdigkeit",
    fayda3Metin: "Im KI-Zeitalter stärkt die Botschaft „meine Inhalte sind geschützt“ das Vertrauen von Nutzern und Partnern.",
  },
  fr: {
    kirinti: "Sceau de confiance",
    kpiEngellenen: "Menaces bloquées (30 j)",
    kpiGorunum: "Impressions du badge",
    kpiTrust: "Visites de la page de confiance",
    kpiKorunan: "Sites protégés",

    onizlemeBaslik: "Aperçu du badge",
    onizlemeMetin: "Montrez à vos visiteurs que le site est protégé contre les bots IA. Le compteur en direct reflète le nombre réel de menaces bloquées.",
    sabitSag: "Épinglé en bas à droite →",
    sabitSol: "← Épinglé en bas à gauche",

    rozetTehdit: "{n} menaces bloquées",
    rozetKorunuyor: "Protégé par Veylify",

    tema: "Thème",
    boyut: "Taille",
    konum: "Position",
    canliSayac: "Compteur de menaces en direct",

    tema_koyu: "Sombre",
    tema_acik: "Clair",
    tema_mavi: "Bleu",

    boyut_kucuk: "Petit",
    boyut_orta: "Moyen",
    boyut_buyuk: "Grand",

    konum_inline: "En ligne",
    "konum_sag-alt": "En bas à droite (fixe)",
    "konum_sol-alt": "En bas à gauche (fixe)",

    guvenBaslik: "Score de confiance",
    guvenEtiket: "confiance de protection",
    guvenEngelleme: "Succès de blocage",
    guvenCtr: "Taux de clic du badge",
    guvenDerece: "Note globale",

    analitikBaslik: "Analyse du badge (30 j)",
    toplamGorunum: "impressions au total",
    aktif: "actif",

    kanitBaslik: "Preuve sociale",
    kanitSoz: "Après avoir ajouté le sceau de confiance, la confiance de nos visiteurs a nettement augmenté — l'abandon de panier a baissé et la conversion a grimpé.",
    kanitAd: "E. Yılmaz",
    kanitRol: "Directeur e-commerce",
    kanitStat1: "conversion supérieure",
    kanitStat2: "protection active",
    kanitStat3: "niveau de confiance",

    embedBaslik: "Ajoutez le badge à votre site",
    embedNot: "Le badge reflète en temps réel les statistiques de protection de votre site et renvoie vers votre page de vérification publique lorsqu'on clique dessus.",

    trustBaslik: "Page de protection vérifiée",
    herkeseAcik: "Page publique",
    ac: "Ouvrir",
    dogrulanmisKoruma: "Protection vérifiée",
    korunuyorAlt: "Protégé contre les bots IA par Veylify",
    tehditEngellendi: "menaces bloquées",
    engellemeOrani: "taux de blocage",
    guvenDerecesi: "note de confiance",
    korunmaBeri: "Protégé depuis {tarih}",
    korumaAktif: "Protection active",
    trustNot: "Cette page publique prouve à vos clients que le site est protégé de façon indépendante — instaurant la confiance comme un certificat SSL.",

    nedenBaslik: "Pourquoi un sceau de confiance ?",
    fayda1Baslik: "Augmente la conversion",
    fayda1Metin: "Les visiteurs qui voient un badge de confiance finalisent leur paiement à un taux supérieur de 11 % en moyenne.",
    fayda2Baslik: "Dissuade les bots",
    fayda2Metin: "Un signal de protection active dissuade les attaquants automatisés au moment de choisir leurs cibles.",
    fayda3Baslik: "Crédibilité de la marque",
    fayda3Metin: "À l'ère de l'IA, le message « mon contenu est protégé » renforce la confiance des utilisateurs et des partenaires.",
  },
  es: {
    kirinti: "Sello de confianza",
    kpiEngellenen: "Amenazas bloqueadas (30 d)",
    kpiGorunum: "Impresiones del distintivo",
    kpiTrust: "Visitas a la página de confianza",
    kpiKorunan: "Sitios protegidos",

    onizlemeBaslik: "Vista previa del distintivo",
    onizlemeMetin: "Muestra a tus visitantes que el sitio está protegido frente a bots de IA. El contador en vivo refleja el número real de amenazas bloqueadas.",
    sabitSag: "Fijado en la esquina inferior derecha →",
    sabitSol: "← Fijado en la esquina inferior izquierda",

    rozetTehdit: "{n} amenazas bloqueadas",
    rozetKorunuyor: "Protegido por Veylify",

    tema: "Tema",
    boyut: "Tamaño",
    konum: "Posición",
    canliSayac: "Contador de amenazas en vivo",

    tema_koyu: "Oscuro",
    tema_acik: "Claro",
    tema_mavi: "Azul",

    boyut_kucuk: "Pequeño",
    boyut_orta: "Mediano",
    boyut_buyuk: "Grande",

    konum_inline: "En línea",
    "konum_sag-alt": "Abajo a la derecha (fijo)",
    "konum_sol-alt": "Abajo a la izquierda (fijo)",

    guvenBaslik: "Puntuación de confianza",
    guvenEtiket: "confianza de protección",
    guvenEngelleme: "Éxito de bloqueo",
    guvenCtr: "Tasa de clic del distintivo",
    guvenDerece: "Calificación general",

    analitikBaslik: "Analítica del distintivo (30 d)",
    toplamGorunum: "impresiones totales",
    aktif: "activo",

    kanitBaslik: "Prueba social",
    kanitSoz: "Tras añadir el sello de confianza, la confianza de nuestros visitantes creció de forma visible — el abandono del carrito bajó y la conversión subió.",
    kanitAd: "E. Yılmaz",
    kanitRol: "Directora de comercio electrónico",
    kanitStat1: "mayor conversión",
    kanitStat2: "protección activa",
    kanitStat3: "nivel de confianza",

    embedBaslik: "Añade el distintivo a tu sitio",
    embedNot: "El distintivo refleja en tiempo real las estadísticas de protección de tu sitio y, al hacer clic, dirige a tu página pública de verificación.",

    trustBaslik: "Página de protección verificada",
    herkeseAcik: "Página pública",
    ac: "Abrir",
    dogrulanmisKoruma: "Protección verificada",
    korunuyorAlt: "Protegido contra bots de IA por Veylify",
    tehditEngellendi: "amenazas bloqueadas",
    engellemeOrani: "tasa de bloqueo",
    guvenDerecesi: "grado de confianza",
    korunmaBeri: "Protegido desde {tarih}",
    korumaAktif: "Protección activa",
    trustNot: "Esta página pública demuestra a tus clientes que el sitio está protegido de forma independiente — generando confianza igual que un certificado SSL.",

    nedenBaslik: "¿Por qué un sello de confianza?",
    fayda1Baslik: "Aumenta la conversión",
    fayda1Metin: "Los visitantes que ven un distintivo de confianza completan el pago con una tasa un 11 % mayor de media.",
    fayda2Baslik: "Disuade a los bots",
    fayda2Metin: "Una señal de protección activa disuade a los atacantes automatizados al elegir sus objetivos.",
    fayda3Baslik: "Credibilidad de marca",
    fayda3Metin: "En la era de la IA, el mensaje «mi contenido está protegido» refuerza la confianza de usuarios y socios.",
  },
};

/** Panel dilini Intl için BCP-47 yerel koduna eşle (sayı/tarih biçimleme). */
export const BCP47: Record<Dil, string> = {
  tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES",
};

export function muhCeviri(anahtar: string, dil: Dil) {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
