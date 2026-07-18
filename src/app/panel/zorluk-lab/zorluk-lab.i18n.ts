/**
 * Ghost-Font Zorluk Laboratuvarı — yerel i18n sözlüğü.
 *
 * Panel deseni: her sayfa kendi düz sözlüğünü taşır; `labCeviri(anahtar, dil)`
 * hedef dile, bulunamazsa TR'ye, o da yoksa anahtarın kendisine düşer.
 *
 * BAŞLIK: kırıntı "Zorluk Laboratuvarı" panel.ts'teki `nav.difflab` ile birebir
 * eşleşir (page.tsx onu `ceviri("nav.difflab", dil)` ile çözer). Üst başlık farklı
 * olduğundan (Ghost-Font Zorluk Laboratuvarı) burada yerel `x.ustBaslik` tutulur.
 *
 * ENUM GÜVENLİĞİ: karakter seti (kod/sayi/karisik) bir enum'dur; asla çevrilmez.
 * lab.ts'teki KARAKTER_SETI_ETIKET yerine istemcide enum id → KEY-MAP
 * ("set.kod" vb.) üzerinden çevrilir. Denge yargısı da lib'de TON enum'una göre
 * ("ideal/iyi/uyari/kotu") döner; yargı metni istemcide TON'dan yeniden türetilir.
 *
 * CANVAS: soldaki canlı canvas / rAF döngüsü / temporal-dithering fiziği ÇEVİRİYE
 * KARIŞMAZ — yalnızca çevresindeki UI etiketleri çevrilir. Sayı/oran/Hz veridir.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    "x.ustBaslik": "Ghost-Font Zorluk Laboratuvarı",

    // üst özet kartları
    "ozet.ocr": "OCR direnci (tahmini)",
    "ozet.oku": "İnsan okunabilirliği (tahmini)",
    "ozet.denge": "Denge skoru",
    "ozet.dither": "Dither hızı",

    // canlı önizleme paneli
    "onizleme.baslik": "Canlı Ghost-Font Önizleme",
    "onizleme.rozet.canli": "canlı · rAF",
    "onizleme.tekKare.baslik": "Tek kare (OCR ne görür)",
    "onizleme.tekKare.aciklama":
      "Dondurulmuş tek kare: harf/arka plan istatistiksel olarak benzer → statik ekran görüntüsü kör.",
    "onizleme.tekKare.aria": "Dondurulmuş tek kare — OCR için gürültü",
    "onizleme.ort.baslik": "Zaman-ortalama (insan ne görür)",
    "onizleme.ort.aciklama":
      "48 kare entegre edilince kod belirir → insan gözünün yaptığı zamansal ortalama.",
    "onizleme.ort.aria": "Zaman-ortalama görünüm — insanın okuduğu net kod",
    "onizleme.canli.aria":
      "Canlı ghost-font önizlemesi — hareketli görüntüde beliren kod",

    // skor çubukları + gerilim
    "skor.ocr": "OCR direnci",
    "skor.oku": "İnsan okunabilirliği",
    "gerilim.etiket": "Gerilim:",
    "gerilim.metin":
      "OCR direncini zorlamak (yüksek gürültü/dither) okunabilirliği düşürür. Tatlı nokta ikisini birden yüksek tutar.",

    // denge yargısı (TON enum key-map)
    "yargi.ideal": "İdeal tatlı nokta: OCR'a kör + insana net.",
    "yargi.iyi": "İyi denge — küçük ayarla ideale çekilebilir.",
    "yargi.uyari":
      "Bota fazla açık — dither hızını, gürültüyü artır veya noktayı incelt.",
    "yargi.kotu":
      "İnsan için zor okunur — kontrastı artır ya da gürültü/dither'ı düşür.",

    // parametreler paneli
    "param.baslik": "Parametreler",
    "param.dither": "Dither hızı",
    "param.kontrast": "Hücre kontrastı",
    "param.gurultu": "Gürültü miktarı",
    "param.kare": "Kare sayısı (entegrasyon)",
    "param.boyut": "Nokta boyutu",
    "param.set.baslik": "Karakter seti",
    "param.oneriYukle": "Önerilen ayarı yükle",
    "param.varsayilan": "Varsayılan",

    // karakter seti (enum key-map)
    "set.kod": "Kod (harf+rakam)",
    "set.sayi": "Sayı",
    "set.karisik": "Karışık",

    // nasıl çalışır paneli
    "nasil.baslik": "Temporal dithering nasıl çalışır?",
    "nasil.1":
      "Kod bir nokta ızgarasına (mask) çevrilir; DOM'da metin yoktur.",
    "nasil.2a": "Harf ve arka plan hücreleri",
    "nasil.2em": "zıt fazda",
    "nasil.2b": "titreşir — her kare ~%50 gürültüdür.",
    "nasil.3":
      "Tek kare (ekran görüntüsü) alan OCR harfi bulamaz: sinyal gürültüye gömülü.",
    "nasil.4":
      "İnsan gözü kareleri zamanda entegre eder → koherent titreşen harfleri OKUR.",
    "nasil.durustluk.etiket": "Dürüstlük notu:",
    "nasil.durustluk.metin":
      "OCR direnci ve okunabilirlik skorları modellenmiş tahminlerdir; soldaki canvas ise gerçek tekniğin (ghostfont.ts / specter.js ile aynı fizik) sadık bir görsel demosudur.",
  },

  en: {
    "x.ustBaslik": "Ghost-Font Difficulty Lab",

    "ozet.ocr": "OCR resistance (estimated)",
    "ozet.oku": "Human readability (estimated)",
    "ozet.denge": "Balance score",
    "ozet.dither": "Dither rate",

    "onizleme.baslik": "Live Ghost-Font Preview",
    "onizleme.rozet.canli": "live · rAF",
    "onizleme.tekKare.baslik": "Single frame (what OCR sees)",
    "onizleme.tekKare.aciklama":
      "Frozen single frame: glyph and background are statistically similar → a static screenshot is blind.",
    "onizleme.tekKare.aria": "Frozen single frame — noise for OCR",
    "onizleme.ort.baslik": "Time-average (what a human sees)",
    "onizleme.ort.aciklama":
      "Integrating 48 frames reveals the code → the temporal averaging the human eye performs.",
    "onizleme.ort.aria": "Time-averaged view — the clear code a human reads",
    "onizleme.canli.aria":
      "Live ghost-font preview — code emerging in the moving image",

    "skor.ocr": "OCR resistance",
    "skor.oku": "Human readability",
    "gerilim.etiket": "Tension:",
    "gerilim.metin":
      "Pushing OCR resistance (high noise/dither) lowers readability. The sweet spot keeps both high.",

    "yargi.ideal": "Ideal sweet spot: blind to OCR + clear to humans.",
    "yargi.iyi": "Good balance — a small tweak reaches the ideal.",
    "yargi.uyari":
      "Too exposed to bots — raise the dither rate, add noise, or shrink the dot.",
    "yargi.kotu":
      "Hard for humans to read — raise contrast or lower the noise/dither.",

    "param.baslik": "Parameters",
    "param.dither": "Dither rate",
    "param.kontrast": "Cell contrast",
    "param.gurultu": "Noise amount",
    "param.kare": "Frame count (integration)",
    "param.boyut": "Dot size",
    "param.set.baslik": "Character set",
    "param.oneriYukle": "Load recommended settings",
    "param.varsayilan": "Default",

    "set.kod": "Code (letters+digits)",
    "set.sayi": "Numbers",
    "set.karisik": "Mixed",

    "nasil.baslik": "How does temporal dithering work?",
    "nasil.1":
      "The code is converted into a dot grid (mask); there is no text in the DOM.",
    "nasil.2a": "Glyph and background cells flicker",
    "nasil.2em": "in counter-phase",
    "nasil.2b": "— each frame is ~50% noise.",
    "nasil.3":
      "OCR taking a single frame (screenshot) can't find the glyph: the signal is buried in noise.",
    "nasil.4":
      "The human eye integrates frames over time → it READS the coherently flickering glyphs.",
    "nasil.durustluk.etiket": "Honesty note:",
    "nasil.durustluk.metin":
      "The OCR-resistance and readability scores are modeled estimates; the canvas on the left is a faithful visual demo of the real technique (same physics as ghostfont.ts / specter.js).",
  },

  de: {
    "x.ustBaslik": "Ghost-Font-Schwierigkeitslabor",

    "ozet.ocr": "OCR-Resistenz (geschätzt)",
    "ozet.oku": "Menschliche Lesbarkeit (geschätzt)",
    "ozet.denge": "Balance-Wert",
    "ozet.dither": "Dither-Rate",

    "onizleme.baslik": "Live-Ghost-Font-Vorschau",
    "onizleme.rozet.canli": "live · rAF",
    "onizleme.tekKare.baslik": "Einzelbild (was OCR sieht)",
    "onizleme.tekKare.aciklama":
      "Eingefrorenes Einzelbild: Zeichen und Hintergrund sind statistisch ähnlich → ein statischer Screenshot ist blind.",
    "onizleme.tekKare.aria": "Eingefrorenes Einzelbild — Rauschen für OCR",
    "onizleme.ort.baslik": "Zeitmittel (was ein Mensch sieht)",
    "onizleme.ort.aciklama":
      "Werden 48 Bilder integriert, erscheint der Code → die zeitliche Mittelung, die das menschliche Auge leistet.",
    "onizleme.ort.aria":
      "Zeitgemittelte Ansicht — der klare Code, den ein Mensch liest",
    "onizleme.canli.aria":
      "Live-Ghost-Font-Vorschau — im bewegten Bild erscheinender Code",

    "skor.ocr": "OCR-Resistenz",
    "skor.oku": "Menschliche Lesbarkeit",
    "gerilim.etiket": "Spannung:",
    "gerilim.metin":
      "Die OCR-Resistenz zu forcieren (hohes Rauschen/Dither) senkt die Lesbarkeit. Der Sweet Spot hält beides hoch.",

    "yargi.ideal": "Idealer Sweet Spot: blind für OCR + klar für Menschen.",
    "yargi.iyi": "Gute Balance — eine kleine Anpassung erreicht das Ideal.",
    "yargi.uyari":
      "Zu offen für Bots — Dither-Rate erhöhen, Rauschen hinzufügen oder Punkt verkleinern.",
    "yargi.kotu":
      "Für Menschen schwer lesbar — Kontrast erhöhen oder Rauschen/Dither senken.",

    "param.baslik": "Parameter",
    "param.dither": "Dither-Rate",
    "param.kontrast": "Zellkontrast",
    "param.gurultu": "Rauschmenge",
    "param.kare": "Bildanzahl (Integration)",
    "param.boyut": "Punktgröße",
    "param.set.baslik": "Zeichensatz",
    "param.oneriYukle": "Empfohlene Einstellung laden",
    "param.varsayilan": "Standard",

    "set.kod": "Code (Buchstaben+Ziffern)",
    "set.sayi": "Zahlen",
    "set.karisik": "Gemischt",

    "nasil.baslik": "Wie funktioniert temporales Dithering?",
    "nasil.1":
      "Der Code wird in ein Punktraster (Maske) umgewandelt; im DOM gibt es keinen Text.",
    "nasil.2a": "Zeichen- und Hintergrundzellen flackern",
    "nasil.2em": "gegenphasig",
    "nasil.2b": "— jedes Bild ist ~50 % Rauschen.",
    "nasil.3":
      "OCR, die ein Einzelbild (Screenshot) nimmt, findet das Zeichen nicht: Das Signal ist im Rauschen vergraben.",
    "nasil.4":
      "Das menschliche Auge integriert die Bilder über die Zeit → es LIEST die kohärent flackernden Zeichen.",
    "nasil.durustluk.etiket": "Ehrlichkeitshinweis:",
    "nasil.durustluk.metin":
      "Die Werte für OCR-Resistenz und Lesbarkeit sind modellierte Schätzungen; das Canvas links ist eine getreue visuelle Demo der echten Technik (gleiche Physik wie ghostfont.ts / specter.js).",
  },

  fr: {
    "x.ustBaslik": "Laboratoire de difficulté Ghost-Font",

    "ozet.ocr": "Résistance OCR (estimée)",
    "ozet.oku": "Lisibilité humaine (estimée)",
    "ozet.denge": "Score d'équilibre",
    "ozet.dither": "Fréquence de dither",

    "onizleme.baslik": "Aperçu Ghost-Font en direct",
    "onizleme.rozet.canli": "en direct · rAF",
    "onizleme.tekKare.baslik": "Image unique (ce que voit l'OCR)",
    "onizleme.tekKare.aciklama":
      "Image unique figée : le glyphe et le fond sont statistiquement similaires → une capture statique est aveugle.",
    "onizleme.tekKare.aria": "Image unique figée — du bruit pour l'OCR",
    "onizleme.ort.baslik": "Moyenne temporelle (ce que voit un humain)",
    "onizleme.ort.aciklama":
      "En intégrant 48 images, le code apparaît → la moyenne temporelle réalisée par l'œil humain.",
    "onizleme.ort.aria":
      "Vue en moyenne temporelle — le code net que lit un humain",
    "onizleme.canli.aria":
      "Aperçu ghost-font en direct — le code émergeant dans l'image animée",

    "skor.ocr": "Résistance OCR",
    "skor.oku": "Lisibilité humaine",
    "gerilim.etiket": "Tension :",
    "gerilim.metin":
      "Forcer la résistance OCR (fort bruit/dither) réduit la lisibilité. Le point idéal maintient les deux élevés.",

    "yargi.ideal": "Point idéal : aveugle à l'OCR + net pour les humains.",
    "yargi.iyi": "Bon équilibre — un petit réglage atteint l'idéal.",
    "yargi.uyari":
      "Trop exposé aux bots — augmentez la fréquence de dither, le bruit ou réduisez le point.",
    "yargi.kotu":
      "Difficile à lire pour un humain — augmentez le contraste ou réduisez le bruit/dither.",

    "param.baslik": "Paramètres",
    "param.dither": "Fréquence de dither",
    "param.kontrast": "Contraste de cellule",
    "param.gurultu": "Quantité de bruit",
    "param.kare": "Nombre d'images (intégration)",
    "param.boyut": "Taille du point",
    "param.set.baslik": "Jeu de caractères",
    "param.oneriYukle": "Charger les réglages recommandés",
    "param.varsayilan": "Par défaut",

    "set.kod": "Code (lettres+chiffres)",
    "set.sayi": "Chiffres",
    "set.karisik": "Mixte",

    "nasil.baslik": "Comment fonctionne le dithering temporel ?",
    "nasil.1":
      "Le code est converti en une grille de points (masque) ; il n'y a aucun texte dans le DOM.",
    "nasil.2a": "Les cellules du glyphe et du fond scintillent",
    "nasil.2em": "en contre-phase",
    "nasil.2b": "— chaque image est composée d'environ 50 % de bruit.",
    "nasil.3":
      "Un OCR prenant une seule image (capture) ne trouve pas le glyphe : le signal est noyé dans le bruit.",
    "nasil.4":
      "L'œil humain intègre les images dans le temps → il LIT les glyphes qui scintillent de façon cohérente.",
    "nasil.durustluk.etiket": "Note d'honnêteté :",
    "nasil.durustluk.metin":
      "Les scores de résistance OCR et de lisibilité sont des estimations modélisées ; le canvas à gauche est une démo visuelle fidèle de la technique réelle (même physique que ghostfont.ts / specter.js).",
  },

  es: {
    "x.ustBaslik": "Laboratorio de dificultad Ghost-Font",

    "ozet.ocr": "Resistencia a OCR (estimada)",
    "ozet.oku": "Legibilidad humana (estimada)",
    "ozet.denge": "Puntuación de equilibrio",
    "ozet.dither": "Frecuencia de dither",

    "onizleme.baslik": "Vista previa Ghost-Font en vivo",
    "onizleme.rozet.canli": "en vivo · rAF",
    "onizleme.tekKare.baslik": "Un solo fotograma (lo que ve el OCR)",
    "onizleme.tekKare.aciklama":
      "Fotograma único congelado: el glifo y el fondo son estadísticamente similares → una captura estática queda ciega.",
    "onizleme.tekKare.aria": "Fotograma único congelado — ruido para el OCR",
    "onizleme.ort.baslik": "Promedio temporal (lo que ve un humano)",
    "onizleme.ort.aciklama":
      "Al integrar 48 fotogramas aparece el código → el promediado temporal que realiza el ojo humano.",
    "onizleme.ort.aria":
      "Vista de promedio temporal — el código nítido que lee un humano",
    "onizleme.canli.aria":
      "Vista previa ghost-font en vivo — el código emergiendo en la imagen en movimiento",

    "skor.ocr": "Resistencia a OCR",
    "skor.oku": "Legibilidad humana",
    "gerilim.etiket": "Tensión:",
    "gerilim.metin":
      "Forzar la resistencia a OCR (mucho ruido/dither) reduce la legibilidad. El punto óptimo mantiene ambas altas.",

    "yargi.ideal": "Punto óptimo ideal: ciego al OCR + nítido para humanos.",
    "yargi.iyi": "Buen equilibrio — un pequeño ajuste alcanza el ideal.",
    "yargi.uyari":
      "Demasiado expuesto a los bots — aumenta la frecuencia de dither, el ruido o reduce el punto.",
    "yargi.kotu":
      "Difícil de leer para un humano — aumenta el contraste o reduce el ruido/dither.",

    "param.baslik": "Parámetros",
    "param.dither": "Frecuencia de dither",
    "param.kontrast": "Contraste de celda",
    "param.gurultu": "Cantidad de ruido",
    "param.kare": "Número de fotogramas (integración)",
    "param.boyut": "Tamaño del punto",
    "param.set.baslik": "Juego de caracteres",
    "param.oneriYukle": "Cargar ajustes recomendados",
    "param.varsayilan": "Predeterminado",

    "set.kod": "Código (letras+dígitos)",
    "set.sayi": "Números",
    "set.karisik": "Mixto",

    "nasil.baslik": "¿Cómo funciona el dithering temporal?",
    "nasil.1":
      "El código se convierte en una rejilla de puntos (máscara); no hay texto en el DOM.",
    "nasil.2a": "Las celdas del glifo y del fondo parpadean",
    "nasil.2em": "en contrafase",
    "nasil.2b": "— cada fotograma es ~50 % ruido.",
    "nasil.3":
      "Un OCR que toma un solo fotograma (captura) no encuentra el glifo: la señal queda sepultada en el ruido.",
    "nasil.4":
      "El ojo humano integra los fotogramas en el tiempo → LEE los glifos que parpadean de forma coherente.",
    "nasil.durustluk.etiket": "Nota de honestidad:",
    "nasil.durustluk.metin":
      "Las puntuaciones de resistencia a OCR y de legibilidad son estimaciones modeladas; el canvas de la izquierda es una demo visual fiel de la técnica real (misma física que ghostfont.ts / specter.js).",
  },
};

/**
 * Zorluk Laboratuvarı yerel çeviri erişimcisi. Hedef dile, yoksa TR'ye, o da
 * yoksa anahtarın kendisine düşer.
 */
export function labCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
