/**
 * Dil & Yerelleştirme — yerel i18n sözlüğü.
 *
 * Panel deseni: her sayfa kendi düz sözlüğünü taşır; `dilCeviri(anahtar, dil)`
 * hedef dile, bulunamazsa TR'ye, o da yoksa anahtarın kendisine düşer.
 *
 * BAŞLIK: kırıntı + üst başlık "Dil & Yerelleştirme" panel.ts'teki `nav.localization`
 * ile birebir eşleşir (page.tsx `ceviri("nav.localization", dil)` ile çözer).
 *
 * VERİ vs. UI: Bu sayfa yalnızca panel KRONUNU (etiketler, açıklamalar, tablo başlıkları,
 * butonlar) çevirir. Şunlar VERİ'dir ve ASLA çevrilmez:
 *   - dil endonimleri (Türkçe/English/Deutsch/Français/Español/العربية/Русский/Português)
 *   - widget önizleme metinleri (dil.ceviriler.* — widget'ın kendi çevirileri)
 *   - data-lang kod parçacığı ve dil kodları (tr/en/de/...)
 * RTL rozeti bir enum bayrağıdır (dil.rtl); "RTL" kısaltması evrensel olduğundan çevrilmez.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // tanıtım şeridi
    "tanit.baslik": "Widget'ı ziyaretçinin diline uyarla.",
    "tanit.metin":
      "Ghost-font doğrulama kartı {sayi} dilde çalışır. Aşağıdan bir dil seç, canlı önizlemede metinlerin nasıl göründüğünü gör ve {kod} parçacığını kopyala.",

    // özet istatistik
    "ozet.dil": "Desteklenen dil",
    "ozet.anahtar": "Çevrilen metin anahtarı",
    "ozet.kapsam": "Çeviri kapsamı",
    "ozet.rtl": "Sağdan-sola (RTL) dil",

    // dil ızgarası
    "izgara.sec": "Bir dil seç",

    // canlı önizleme paneli
    "onizleme.baslik": "Canlı önizleme — {ad}",
    "onizleme.metin":
      "Aşağıdaki kart, seçili dildeki widget metinlerini gösterir. Görsel bir taklittir; gerçek ghost-font hareketli render'ı sitendeki widget'ta çalışır.",

    // entegrasyon paneli
    "ent.baslik": "Entegrasyon",
    "ent.metin": "Dili sabitlemek için widget div'ine {kod} ekle. Bu parçacık {ad} ({kodDeger}) içindir.",
    "ent.kopyala": "Yalnızca data-lang kopyala",
    "ent.kopyalandi": "data-lang kopyalandı",
    "ent.notBaslik": "Otomatik algılama sırası:",
    "ent.notMetin1": "widget dili şu öncelikle seçer:",
    "ent.notMetin2": "özniteliği →",
    "ent.notMetin3": "(tarayıcı dili) →",
    "ent.notMetin4": "(varsayılan). Listede olmayan bir dil istenirse Türkçe'ye düşer.",

    // kapsam tablosu
    "kapsam.baslik": "Çeviri kapsamı",
    "kapsam.metin":
      "Her dil × her metin anahtarı. Tüm hücreler dolu — {sayi} dilin tamamı {anahtar} anahtarı %100 kapsar.",
    "kapsam.thAnahtar": "Anahtar",
    "kapsam.tfKapsam": "Kapsam",
  },

  en: {
    "tanit.baslik": "Adapt the widget to the visitor's language.",
    "tanit.metin":
      "The ghost-font verification card works in {sayi} languages. Pick a language below, see how the text looks in the live preview, and copy the {kod} snippet.",

    "ozet.dil": "Supported language",
    "ozet.anahtar": "Translated text key",
    "ozet.kapsam": "Translation coverage",
    "ozet.rtl": "Right-to-left (RTL) language",

    "izgara.sec": "Pick a language",

    "onizleme.baslik": "Live preview — {ad}",
    "onizleme.metin":
      "The card below shows the widget's text in the selected language. It is a visual mock-up; the real animated ghost-font render runs in the widget on your site.",

    "ent.baslik": "Integration",
    "ent.metin": "To pin the language, add {kod} to the widget div. This snippet is for {ad} ({kodDeger}).",
    "ent.kopyala": "Copy data-lang only",
    "ent.kopyalandi": "data-lang copied",
    "ent.notBaslik": "Auto-detection order:",
    "ent.notMetin1": "the widget selects the language in this priority:",
    "ent.notMetin2": "attribute →",
    "ent.notMetin3": "(browser language) →",
    "ent.notMetin4": "(default). If an unlisted language is requested, it falls back to Turkish.",

    "kapsam.baslik": "Translation coverage",
    "kapsam.metin":
      "Every language × every text key. All cells are filled — all {sayi} languages cover the {anahtar} keys 100%.",
    "kapsam.thAnahtar": "Key",
    "kapsam.tfKapsam": "Coverage",
  },

  de: {
    "tanit.baslik": "Passe das Widget an die Sprache des Besuchers an.",
    "tanit.metin":
      "Die Ghost-Font-Verifizierungskarte funktioniert in {sayi} Sprachen. Wähle unten eine Sprache, sieh in der Live-Vorschau, wie die Texte aussehen, und kopiere das {kod}-Snippet.",

    "ozet.dil": "Unterstützte Sprache",
    "ozet.anahtar": "Übersetzter Text-Schlüssel",
    "ozet.kapsam": "Übersetzungsabdeckung",
    "ozet.rtl": "Rechts-nach-links-Sprache (RTL)",

    "izgara.sec": "Sprache wählen",

    "onizleme.baslik": "Live-Vorschau — {ad}",
    "onizleme.metin":
      "Die Karte unten zeigt die Widget-Texte in der gewählten Sprache. Es ist ein visuelles Modell; das echte animierte Ghost-Font-Rendering läuft im Widget auf deiner Website.",

    "ent.baslik": "Integration",
    "ent.metin": "Um die Sprache festzulegen, füge {kod} zum Widget-div hinzu. Dieses Snippet ist für {ad} ({kodDeger}).",
    "ent.kopyala": "Nur data-lang kopieren",
    "ent.kopyalandi": "data-lang kopiert",
    "ent.notBaslik": "Reihenfolge der automatischen Erkennung:",
    "ent.notMetin1": "das Widget wählt die Sprache in dieser Priorität:",
    "ent.notMetin2": "-Attribut →",
    "ent.notMetin3": "(Browsersprache) →",
    "ent.notMetin4": "(Standard). Wird eine nicht gelistete Sprache angefragt, wird auf Türkisch zurückgegriffen.",

    "kapsam.baslik": "Übersetzungsabdeckung",
    "kapsam.metin":
      "Jede Sprache × jeder Text-Schlüssel. Alle Zellen sind gefüllt — alle {sayi} Sprachen decken die {anahtar} Schlüssel zu 100 % ab.",
    "kapsam.thAnahtar": "Schlüssel",
    "kapsam.tfKapsam": "Abdeckung",
  },

  fr: {
    "tanit.baslik": "Adaptez le widget à la langue du visiteur.",
    "tanit.metin":
      "La carte de vérification ghost-font fonctionne en {sayi} langues. Choisissez une langue ci-dessous, voyez comment les textes s'affichent dans l'aperçu en direct et copiez l'extrait {kod}.",

    "ozet.dil": "Langue prise en charge",
    "ozet.anahtar": "Clé de texte traduite",
    "ozet.kapsam": "Couverture de traduction",
    "ozet.rtl": "Langue de droite à gauche (RTL)",

    "izgara.sec": "Choisir une langue",

    "onizleme.baslik": "Aperçu en direct — {ad}",
    "onizleme.metin":
      "La carte ci-dessous montre les textes du widget dans la langue sélectionnée. C'est une maquette visuelle ; le vrai rendu ghost-font animé s'exécute dans le widget sur votre site.",

    "ent.baslik": "Intégration",
    "ent.metin": "Pour fixer la langue, ajoutez {kod} au div du widget. Cet extrait est pour {ad} ({kodDeger}).",
    "ent.kopyala": "Copier uniquement data-lang",
    "ent.kopyalandi": "data-lang copié",
    "ent.notBaslik": "Ordre de détection automatique :",
    "ent.notMetin1": "le widget sélectionne la langue dans cette priorité :",
    "ent.notMetin2": "attribut →",
    "ent.notMetin3": "(langue du navigateur) →",
    "ent.notMetin4": "(par défaut). Si une langue non listée est demandée, il revient au turc.",

    "kapsam.baslik": "Couverture de traduction",
    "kapsam.metin":
      "Chaque langue × chaque clé de texte. Toutes les cellules sont remplies — les {sayi} langues couvrent les {anahtar} clés à 100 %.",
    "kapsam.thAnahtar": "Clé",
    "kapsam.tfKapsam": "Couverture",
  },

  es: {
    "tanit.baslik": "Adapta el widget al idioma del visitante.",
    "tanit.metin":
      "La tarjeta de verificación ghost-font funciona en {sayi} idiomas. Elige un idioma abajo, mira cómo se ven los textos en la vista previa en vivo y copia el fragmento {kod}.",

    "ozet.dil": "Idioma admitido",
    "ozet.anahtar": "Clave de texto traducida",
    "ozet.kapsam": "Cobertura de traducción",
    "ozet.rtl": "Idioma de derecha a izquierda (RTL)",

    "izgara.sec": "Elige un idioma",

    "onizleme.baslik": "Vista previa en vivo — {ad}",
    "onizleme.metin":
      "La tarjeta de abajo muestra los textos del widget en el idioma seleccionado. Es una maqueta visual; el render ghost-font animado real se ejecuta en el widget de tu sitio.",

    "ent.baslik": "Integración",
    "ent.metin": "Para fijar el idioma, añade {kod} al div del widget. Este fragmento es para {ad} ({kodDeger}).",
    "ent.kopyala": "Copiar solo data-lang",
    "ent.kopyalandi": "data-lang copiado",
    "ent.notBaslik": "Orden de detección automática:",
    "ent.notMetin1": "el widget selecciona el idioma con esta prioridad:",
    "ent.notMetin2": "atributo →",
    "ent.notMetin3": "(idioma del navegador) →",
    "ent.notMetin4": "(predeterminado). Si se solicita un idioma no listado, recurre al turco.",

    "kapsam.baslik": "Cobertura de traducción",
    "kapsam.metin":
      "Cada idioma × cada clave de texto. Todas las celdas están llenas — los {sayi} idiomas cubren las {anahtar} claves al 100 %.",
    "kapsam.thAnahtar": "Clave",
    "kapsam.tfKapsam": "Cobertura",
  },
};

/** Anahtarı hedef dile çevir; bulunamazsa TR'ye, o da yoksa anahtara düşer. */
export function dilCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
