/**
 * OCR Direnç Kanıtı sayfası — yerel çeviri sözlüğü.
 *
 * Sadece bu sayfaya özgü kullanıcı-görünür metinleri içerir. Paylaşılan
 * `src/lib/i18n/panel.ts` ve motor kütüphanesi `src/lib/specter/ocr-direnc.ts`
 * DEĞİŞTİRİLMEZ. Anahtar bulunamazsa TR'ye, o da yoksa anahtarın kendisine
 * düşer.
 *
 * ENUM GÜVENLİĞİ
 * --------------
 * Zorluk enum değerleri (low/medium/high) ASLA çevrilmez; veri olarak kalır.
 * Lib'teki `ZORLUK_ETIKET_OCR` Türkçe etiket haritası düzenlenmez; bunun
 * yerine istemcide "ocr.zorluk.low/medium/high" anahtarlarıyla yeniden
 * türetilir. Sayılar/oranlar/puanlar veri olduğu için çevrilmez, yalnızca
 * çevresindeki etiketler çevrilir; birim son ekleri (pt, sn) çeviri metnine
 * dahildir.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // Açıklama şeridi
    "ocr.serit.baslik": "İddia: insan okur, OCR göremez — işte sayısal kanıtı.",
    "ocr.serit.aciklama.1": "Ghost-font (temporal dithering) her karede farklı gürültü çizer. İnsan görme sistemi kareleri",
    "ocr.serit.aciklama.entegre": "entegre eder",
    "ocr.serit.aciklama.2":
      "ve zaman-ortalama sinyali okur; tek bir kare (ekran görüntüsü / OCR girdisi) ise ayırt edilemez gürültüdür. Aşağıdaki metrikler render motorunun gerçek parametrelerinden hesaplanır.",

    // Zorluk enum → etiket (yeniden türetme)
    "ocr.zorluk.low": "Düşük",
    "ocr.zorluk.medium": "Orta",
    "ocr.zorluk.high": "Yüksek",

    // Özet kartları
    "ocr.ozet.garanti": "Garanti",
    "ocr.ozet.riskli": "Riskli",
    "ocr.ozet.okunabilirlik": "İnsan okunabilirliği (≥25pt)",
    "ocr.ozet.minKontrast": "Min zaman-ortalama kontrast",
    "ocr.ozet.maxDirenc": "Maks OCR direnci",
    "ocr.ozet.tekKare": "Tek-kare kontrast ({z})",

    // Zorluk seçici
    "ocr.zorluk.etiket": "Zorluk profili:",

    // Canlı görsel kanıt panelleri
    "ocr.gorsel.insan.baslik": "İnsan görüşü (hareket = okunur)",
    "ocr.gorsel.insan.alt": "Hareket halinde harfler koherent titreşir — göz okur.",
    "ocr.gorsel.ocr.baslik": "OCR girdisi (tek kare = gürültü)",
    "ocr.gorsel.ocr.alt": "Dondurulmuş tek kare — harf/arka plan ayırt edilemez, OCR kör.",
    "ocr.canvas.hareketli": "Hareketli ghost-font — okunur",
    "ocr.canvas.donuk": "Dondurulmuş tek kare — gürültü",

    // Ölçülen metrikler paneli
    "ocr.metrik.baslik": "Ölçülen metrikler — {z}",
    "ocr.metrik.zamanKontrast": "Zaman-ortalama kontrast",
    "ocr.metrik.zamanKontrast.alt": "İnsanın gördüğü sinyal",
    "ocr.metrik.tekKare": "Tek-kare kontrast",
    "ocr.metrik.tekKare.alt": "OCR'ın gördüğü — çok düşük",
    "ocr.metrik.sn": "Tek-kare sinyal/gürültü",
    "ocr.metrik.sn.alt": "1.0 altı = ayırt edilemez",
    "ocr.metrik.direnc": "OCR direnç skoru",
    "ocr.metrik.direnc.alt": "Tek-kare belirsizliği",
    "ocr.metrik.koherens": "Koherens (senkron)",
    "ocr.metrik.koherens.alt": "İnsan hareketi bununla yakalar",
    "ocr.metrik.garanti": "Zaman-ortalama kontrast {v}pt ≥ 25pt eşiği → insan okunabilirliği garanti.",
    "ocr.birim.pt": "pt",

    // Kare birikim eğrisi paneli
    "ocr.egri.baslik": "Kare birikim eğrisi — neden insan okur, OCR okuyamaz",
    "ocr.egri.aciklama":
      "Tek kare (1) düşük etkin kontrasta sahip; kareler biriktikçe (insan gözünün yaptığı entegrasyon) sinyal güçlenir. OCR tek kareye baktığı için bu eğrinin en solunda kalır.",
    "ocr.egri.kare": "{n} kare",
    "ocr.egri.ocr": "OCR: 1 kare (%{v})",
    "ocr.egri.insan": "İnsan: ~30 kare/sn (%{v})",

    // Tüm profiller tablosu
    "ocr.tablo.baslik": "Tüm zorluk profilleri — karşılaştırma",
    "ocr.tablo.kanit": "Kanıt raporu",
    "ocr.tablo.th.zorluk": "Zorluk",
    "ocr.tablo.th.zamanKontrast": "Zaman-ort. kontrast",
    "ocr.tablo.th.tekKare": "Tek-kare kontrast",
    "ocr.tablo.th.sn": "Tek-kare S/N",
    "ocr.tablo.th.direnc": "OCR direnç",
    "ocr.tablo.th.okunabilir": "Okunabilir",
    "ocr.tablo.evet": "Evet",
    "ocr.tablo.hayir": "Hayır",
    "ocr.tablo.dipnot":
      "Yüksek zorluk: bot için daha zor (tek-kare kontrast biraz yükselse de OCR için hâlâ belirsiz), insan için hâlâ okunur (32pt ≥ 25pt).",

    // Demo şeridi
    "ocr.demo.baslik": "Kendi gözünle gör",
    "ocr.demo.aciklama": "Ghost-font stüdyosunda canlı ghost metni oku, sonra ekran görüntüsü al — tek karede hiçbir şey okuyamadığını gör.",
    "ocr.demo.buton": "Ghost-font stüdyosu",

    // Kanıt raporu (indirilen .txt)
    "ocr.rapor.baslik": "SPECTER — GHOST-FONT OCR DİRENÇ KANIT RAPORU",
    "ocr.rapor.garanti.evet": "EVET (tüm profiller ≥25 puan)",
    "ocr.rapor.garanti.hayir": "HAYIR",
    "ocr.rapor.okunabilirGaranti": "Okunabilirlik garantisi: {v}",
    "ocr.rapor.minKontrast": "Min zaman-ortalama kontrast: {v} puan",
    "ocr.rapor.maxDirenc": "Maks OCR direnç: %{v}",
    "ocr.rapor.zamanKontrast": "Zaman-ortalama kontrast (insan görür): {v} puan",
    "ocr.rapor.tekKareKontrast": "Tek-kare kontrast (OCR görür): {v} puan",
    "ocr.rapor.tekKareSN": "Tek-kare sinyal/gürültü: {v}",
    "ocr.rapor.direnc": "OCR direnç skoru: %{v}",
    "ocr.rapor.okunabilir": "İnsan okunabilir: {v}",
    "ocr.rapor.evet": "EVET",
    "ocr.rapor.hayir": "HAYIR",
    "ocr.rapor.yontem.1": "Yöntem: temporal dithering. İnsan görme sistemi kareleri entegre eder",
    "ocr.rapor.yontem.2": "(zaman-ortalama sinyali görür); tek kare OCR için gürültüdür.",
    "ocr.rapor.toast": "Kanıt raporu indirildi",
  },
  en: {
    "ocr.serit.baslik": "The claim: humans read it, OCR can't — here is the numeric proof.",
    "ocr.serit.aciklama.1": "Ghost-font (temporal dithering) draws different noise on every frame. The human visual system",
    "ocr.serit.aciklama.entegre": "integrates",
    "ocr.serit.aciklama.2":
      "the frames and reads the time-averaged signal; a single frame (a screenshot / OCR input) is indistinguishable noise. The metrics below are computed from the render engine's real parameters.",

    "ocr.zorluk.low": "Low",
    "ocr.zorluk.medium": "Medium",
    "ocr.zorluk.high": "High",

    "ocr.ozet.garanti": "Guaranteed",
    "ocr.ozet.riskli": "At risk",
    "ocr.ozet.okunabilirlik": "Human readability (≥25pt)",
    "ocr.ozet.minKontrast": "Min time-averaged contrast",
    "ocr.ozet.maxDirenc": "Max OCR resistance",
    "ocr.ozet.tekKare": "Single-frame contrast ({z})",

    "ocr.zorluk.etiket": "Difficulty profile:",

    "ocr.gorsel.insan.baslik": "Human view (motion = readable)",
    "ocr.gorsel.insan.alt": "In motion the letters shimmer coherently — the eye reads them.",
    "ocr.gorsel.ocr.baslik": "OCR input (single frame = noise)",
    "ocr.gorsel.ocr.alt": "Frozen single frame — letters/background indistinguishable, OCR is blind.",
    "ocr.canvas.hareketli": "Animated ghost-font — readable",
    "ocr.canvas.donuk": "Frozen single frame — noise",

    "ocr.metrik.baslik": "Measured metrics — {z}",
    "ocr.metrik.zamanKontrast": "Time-averaged contrast",
    "ocr.metrik.zamanKontrast.alt": "The signal a human sees",
    "ocr.metrik.tekKare": "Single-frame contrast",
    "ocr.metrik.tekKare.alt": "What OCR sees — very low",
    "ocr.metrik.sn": "Single-frame signal/noise",
    "ocr.metrik.sn.alt": "Below 1.0 = indistinguishable",
    "ocr.metrik.direnc": "OCR resistance score",
    "ocr.metrik.direnc.alt": "Single-frame ambiguity",
    "ocr.metrik.koherens": "Coherence (sync)",
    "ocr.metrik.koherens.alt": "Humans catch motion with this",
    "ocr.metrik.garanti": "Time-averaged contrast {v}pt ≥ 25pt threshold → human readability guaranteed.",
    "ocr.birim.pt": "pt",

    "ocr.egri.baslik": "Frame-accumulation curve — why humans read it and OCR can't",
    "ocr.egri.aciklama":
      "A single frame (1) has low effective contrast; as frames accumulate (the integration the human eye performs) the signal strengthens. OCR looks at a single frame, so it stays at the far left of this curve.",
    "ocr.egri.kare": "{n} frames",
    "ocr.egri.ocr": "OCR: 1 frame ({v}%)",
    "ocr.egri.insan": "Human: ~30 frames/s ({v}%)",

    "ocr.tablo.baslik": "All difficulty profiles — comparison",
    "ocr.tablo.kanit": "Proof report",
    "ocr.tablo.th.zorluk": "Difficulty",
    "ocr.tablo.th.zamanKontrast": "Time-avg. contrast",
    "ocr.tablo.th.tekKare": "Single-frame contrast",
    "ocr.tablo.th.sn": "Single-frame S/N",
    "ocr.tablo.th.direnc": "OCR resistance",
    "ocr.tablo.th.okunabilir": "Readable",
    "ocr.tablo.evet": "Yes",
    "ocr.tablo.hayir": "No",
    "ocr.tablo.dipnot":
      "High difficulty: harder for bots (single-frame contrast rises slightly but stays ambiguous for OCR), still readable for humans (32pt ≥ 25pt).",

    "ocr.demo.baslik": "See it for yourself",
    "ocr.demo.aciklama": "Read the live ghost text in the ghost-font studio, then take a screenshot — see that you can't read a thing in a single frame.",
    "ocr.demo.buton": "Ghost-font studio",

    "ocr.rapor.baslik": "SPECTER — GHOST-FONT OCR RESISTANCE PROOF REPORT",
    "ocr.rapor.garanti.evet": "YES (all profiles ≥25 points)",
    "ocr.rapor.garanti.hayir": "NO",
    "ocr.rapor.okunabilirGaranti": "Readability guarantee: {v}",
    "ocr.rapor.minKontrast": "Min time-averaged contrast: {v} points",
    "ocr.rapor.maxDirenc": "Max OCR resistance: {v}%",
    "ocr.rapor.zamanKontrast": "Time-averaged contrast (human sees): {v} points",
    "ocr.rapor.tekKareKontrast": "Single-frame contrast (OCR sees): {v} points",
    "ocr.rapor.tekKareSN": "Single-frame signal/noise: {v}",
    "ocr.rapor.direnc": "OCR resistance score: {v}%",
    "ocr.rapor.okunabilir": "Human readable: {v}",
    "ocr.rapor.evet": "YES",
    "ocr.rapor.hayir": "NO",
    "ocr.rapor.yontem.1": "Method: temporal dithering. The human visual system integrates the frames",
    "ocr.rapor.yontem.2": "(sees the time-averaged signal); a single frame is noise to OCR.",
    "ocr.rapor.toast": "Proof report downloaded",
  },
  de: {
    "ocr.serit.baslik": "Die Behauptung: Menschen lesen es, OCR nicht — hier der numerische Beweis.",
    "ocr.serit.aciklama.1": "Ghost-Font (temporales Dithering) zeichnet in jedem Frame anderes Rauschen. Das menschliche Sehsystem",
    "ocr.serit.aciklama.entegre": "integriert",
    "ocr.serit.aciklama.2":
      "die Frames und liest das zeitlich gemittelte Signal; ein einzelner Frame (Screenshot / OCR-Eingabe) ist ununterscheidbares Rauschen. Die Kennzahlen unten werden aus den echten Parametern der Render-Engine berechnet.",

    "ocr.zorluk.low": "Niedrig",
    "ocr.zorluk.medium": "Mittel",
    "ocr.zorluk.high": "Hoch",

    "ocr.ozet.garanti": "Garantiert",
    "ocr.ozet.riskli": "Riskant",
    "ocr.ozet.okunabilirlik": "Menschliche Lesbarkeit (≥25 Pt)",
    "ocr.ozet.minKontrast": "Min. zeitgemittelter Kontrast",
    "ocr.ozet.maxDirenc": "Max. OCR-Resistenz",
    "ocr.ozet.tekKare": "Einzelframe-Kontrast ({z})",

    "ocr.zorluk.etiket": "Schwierigkeitsprofil:",

    "ocr.gorsel.insan.baslik": "Menschliche Sicht (Bewegung = lesbar)",
    "ocr.gorsel.insan.alt": "In Bewegung flimmern die Buchstaben kohärent — das Auge liest sie.",
    "ocr.gorsel.ocr.baslik": "OCR-Eingabe (Einzelframe = Rauschen)",
    "ocr.gorsel.ocr.alt": "Eingefrorener Einzelframe — Buchstabe/Hintergrund ununterscheidbar, OCR ist blind.",
    "ocr.canvas.hareketli": "Animierte Ghost-Font — lesbar",
    "ocr.canvas.donuk": "Eingefrorener Einzelframe — Rauschen",

    "ocr.metrik.baslik": "Gemessene Kennzahlen — {z}",
    "ocr.metrik.zamanKontrast": "Zeitgemittelter Kontrast",
    "ocr.metrik.zamanKontrast.alt": "Das Signal, das ein Mensch sieht",
    "ocr.metrik.tekKare": "Einzelframe-Kontrast",
    "ocr.metrik.tekKare.alt": "Was OCR sieht — sehr niedrig",
    "ocr.metrik.sn": "Einzelframe Signal/Rauschen",
    "ocr.metrik.sn.alt": "Unter 1.0 = ununterscheidbar",
    "ocr.metrik.direnc": "OCR-Resistenz-Score",
    "ocr.metrik.direnc.alt": "Einzelframe-Mehrdeutigkeit",
    "ocr.metrik.koherens": "Kohärenz (Synchronität)",
    "ocr.metrik.koherens.alt": "Damit erfassen Menschen die Bewegung",
    "ocr.metrik.garanti": "Zeitgemittelter Kontrast {v} Pt ≥ 25-Pt-Schwelle → menschliche Lesbarkeit garantiert.",
    "ocr.birim.pt": "Pt",

    "ocr.egri.baslik": "Frame-Akkumulationskurve — warum Menschen es lesen und OCR nicht",
    "ocr.egri.aciklama":
      "Ein einzelner Frame (1) hat niedrigen effektiven Kontrast; wenn sich Frames anhäufen (die Integration des menschlichen Auges), verstärkt sich das Signal. OCR betrachtet einen einzelnen Frame und bleibt daher ganz links auf dieser Kurve.",
    "ocr.egri.kare": "{n} Frames",
    "ocr.egri.ocr": "OCR: 1 Frame ({v} %)",
    "ocr.egri.insan": "Mensch: ~30 Frames/s ({v} %)",

    "ocr.tablo.baslik": "Alle Schwierigkeitsprofile — Vergleich",
    "ocr.tablo.kanit": "Beweisbericht",
    "ocr.tablo.th.zorluk": "Schwierigkeit",
    "ocr.tablo.th.zamanKontrast": "Zeitgem. Kontrast",
    "ocr.tablo.th.tekKare": "Einzelframe-Kontrast",
    "ocr.tablo.th.sn": "Einzelframe S/R",
    "ocr.tablo.th.direnc": "OCR-Resistenz",
    "ocr.tablo.th.okunabilir": "Lesbar",
    "ocr.tablo.evet": "Ja",
    "ocr.tablo.hayir": "Nein",
    "ocr.tablo.dipnot":
      "Hohe Schwierigkeit: schwerer für Bots (Einzelframe-Kontrast steigt leicht, bleibt aber für OCR mehrdeutig), für Menschen weiterhin lesbar (32 Pt ≥ 25 Pt).",

    "ocr.demo.baslik": "Sieh es selbst",
    "ocr.demo.aciklama": "Lies den Live-Ghost-Text im Ghost-Font-Studio, mach dann einen Screenshot — sieh, dass du in einem Einzelframe nichts lesen kannst.",
    "ocr.demo.buton": "Ghost-Font-Studio",

    "ocr.rapor.baslik": "SPECTER — GHOST-FONT OCR-RESISTENZ-BEWEISBERICHT",
    "ocr.rapor.garanti.evet": "JA (alle Profile ≥25 Punkte)",
    "ocr.rapor.garanti.hayir": "NEIN",
    "ocr.rapor.okunabilirGaranti": "Lesbarkeitsgarantie: {v}",
    "ocr.rapor.minKontrast": "Min. zeitgemittelter Kontrast: {v} Punkte",
    "ocr.rapor.maxDirenc": "Max. OCR-Resistenz: {v} %",
    "ocr.rapor.zamanKontrast": "Zeitgemittelter Kontrast (Mensch sieht): {v} Punkte",
    "ocr.rapor.tekKareKontrast": "Einzelframe-Kontrast (OCR sieht): {v} Punkte",
    "ocr.rapor.tekKareSN": "Einzelframe Signal/Rauschen: {v}",
    "ocr.rapor.direnc": "OCR-Resistenz-Score: {v} %",
    "ocr.rapor.okunabilir": "Menschlich lesbar: {v}",
    "ocr.rapor.evet": "JA",
    "ocr.rapor.hayir": "NEIN",
    "ocr.rapor.yontem.1": "Methode: temporales Dithering. Das menschliche Sehsystem integriert die Frames",
    "ocr.rapor.yontem.2": "(sieht das zeitgemittelte Signal); ein einzelner Frame ist für OCR Rauschen.",
    "ocr.rapor.toast": "Beweisbericht heruntergeladen",
  },
  fr: {
    "ocr.serit.baslik": "L'affirmation : l'humain le lit, l'OCR non — voici la preuve chiffrée.",
    "ocr.serit.aciklama.1": "La ghost-font (tramage temporel) dessine un bruit différent à chaque image. Le système visuel humain",
    "ocr.serit.aciklama.entegre": "intègre",
    "ocr.serit.aciklama.2":
      "les images et lit le signal moyenné dans le temps ; une seule image (capture d'écran / entrée OCR) n'est qu'un bruit indiscernable. Les métriques ci-dessous sont calculées à partir des paramètres réels du moteur de rendu.",

    "ocr.zorluk.low": "Faible",
    "ocr.zorluk.medium": "Moyen",
    "ocr.zorluk.high": "Élevé",

    "ocr.ozet.garanti": "Garantie",
    "ocr.ozet.riskli": "À risque",
    "ocr.ozet.okunabilirlik": "Lisibilité humaine (≥25 pt)",
    "ocr.ozet.minKontrast": "Contraste moyenné min.",
    "ocr.ozet.maxDirenc": "Résistance OCR max.",
    "ocr.ozet.tekKare": "Contraste d'une image ({z})",

    "ocr.zorluk.etiket": "Profil de difficulté :",

    "ocr.gorsel.insan.baslik": "Vue humaine (mouvement = lisible)",
    "ocr.gorsel.insan.alt": "En mouvement, les lettres scintillent de façon cohérente — l'œil les lit.",
    "ocr.gorsel.ocr.baslik": "Entrée OCR (une image = bruit)",
    "ocr.gorsel.ocr.alt": "Image unique figée — lettre/arrière-plan indiscernables, l'OCR est aveugle.",
    "ocr.canvas.hareketli": "Ghost-font animée — lisible",
    "ocr.canvas.donuk": "Image unique figée — bruit",

    "ocr.metrik.baslik": "Métriques mesurées — {z}",
    "ocr.metrik.zamanKontrast": "Contraste moyenné dans le temps",
    "ocr.metrik.zamanKontrast.alt": "Le signal que voit un humain",
    "ocr.metrik.tekKare": "Contraste d'une image",
    "ocr.metrik.tekKare.alt": "Ce que voit l'OCR — très faible",
    "ocr.metrik.sn": "Signal/bruit d'une image",
    "ocr.metrik.sn.alt": "Sous 1.0 = indiscernable",
    "ocr.metrik.direnc": "Score de résistance OCR",
    "ocr.metrik.direnc.alt": "Ambiguïté d'une image",
    "ocr.metrik.koherens": "Cohérence (synchro)",
    "ocr.metrik.koherens.alt": "L'humain capte le mouvement grâce à cela",
    "ocr.metrik.garanti": "Contraste moyenné {v} pt ≥ seuil de 25 pt → lisibilité humaine garantie.",
    "ocr.birim.pt": "pt",

    "ocr.egri.baslik": "Courbe d'accumulation d'images — pourquoi l'humain lit et pas l'OCR",
    "ocr.egri.aciklama":
      "Une seule image (1) a un faible contraste effectif ; à mesure que les images s'accumulent (l'intégration réalisée par l'œil humain), le signal se renforce. L'OCR ne regarde qu'une image, il reste donc tout à gauche de cette courbe.",
    "ocr.egri.kare": "{n} images",
    "ocr.egri.ocr": "OCR : 1 image ({v} %)",
    "ocr.egri.insan": "Humain : ~30 images/s ({v} %)",

    "ocr.tablo.baslik": "Tous les profils de difficulté — comparaison",
    "ocr.tablo.kanit": "Rapport de preuve",
    "ocr.tablo.th.zorluk": "Difficulté",
    "ocr.tablo.th.zamanKontrast": "Contraste moyenné",
    "ocr.tablo.th.tekKare": "Contraste d'une image",
    "ocr.tablo.th.sn": "S/B d'une image",
    "ocr.tablo.th.direnc": "Résistance OCR",
    "ocr.tablo.th.okunabilir": "Lisible",
    "ocr.tablo.evet": "Oui",
    "ocr.tablo.hayir": "Non",
    "ocr.tablo.dipnot":
      "Difficulté élevée : plus dur pour les bots (le contraste d'une image monte légèrement mais reste ambigu pour l'OCR), toujours lisible pour l'humain (32 pt ≥ 25 pt).",

    "ocr.demo.baslik": "Voyez par vous-même",
    "ocr.demo.aciklama": "Lisez le texte ghost en direct dans le studio ghost-font, puis prenez une capture d'écran — constatez que vous ne lisez rien sur une seule image.",
    "ocr.demo.buton": "Studio ghost-font",

    "ocr.rapor.baslik": "SPECTER — RAPPORT DE PREUVE DE RÉSISTANCE OCR GHOST-FONT",
    "ocr.rapor.garanti.evet": "OUI (tous les profils ≥25 points)",
    "ocr.rapor.garanti.hayir": "NON",
    "ocr.rapor.okunabilirGaranti": "Garantie de lisibilité : {v}",
    "ocr.rapor.minKontrast": "Contraste moyenné min. : {v} points",
    "ocr.rapor.maxDirenc": "Résistance OCR max. : {v} %",
    "ocr.rapor.zamanKontrast": "Contraste moyenné (l'humain voit) : {v} points",
    "ocr.rapor.tekKareKontrast": "Contraste d'une image (l'OCR voit) : {v} points",
    "ocr.rapor.tekKareSN": "Signal/bruit d'une image : {v}",
    "ocr.rapor.direnc": "Score de résistance OCR : {v} %",
    "ocr.rapor.okunabilir": "Lisible par l'humain : {v}",
    "ocr.rapor.evet": "OUI",
    "ocr.rapor.hayir": "NON",
    "ocr.rapor.yontem.1": "Méthode : tramage temporel. Le système visuel humain intègre les images",
    "ocr.rapor.yontem.2": "(voit le signal moyenné dans le temps) ; une seule image est du bruit pour l'OCR.",
    "ocr.rapor.toast": "Rapport de preuve téléchargé",
  },
  es: {
    "ocr.serit.baslik": "La afirmación: los humanos lo leen, el OCR no — aquí está la prueba numérica.",
    "ocr.serit.aciklama.1": "La ghost-font (tramado temporal) dibuja un ruido distinto en cada fotograma. El sistema visual humano",
    "ocr.serit.aciklama.entegre": "integra",
    "ocr.serit.aciklama.2":
      "los fotogramas y lee la señal promediada en el tiempo; un solo fotograma (captura de pantalla / entrada OCR) es ruido indistinguible. Las métricas siguientes se calculan a partir de los parámetros reales del motor de renderizado.",

    "ocr.zorluk.low": "Baja",
    "ocr.zorluk.medium": "Media",
    "ocr.zorluk.high": "Alta",

    "ocr.ozet.garanti": "Garantizada",
    "ocr.ozet.riskli": "En riesgo",
    "ocr.ozet.okunabilirlik": "Legibilidad humana (≥25 pt)",
    "ocr.ozet.minKontrast": "Contraste promediado mín.",
    "ocr.ozet.maxDirenc": "Resistencia OCR máx.",
    "ocr.ozet.tekKare": "Contraste de un fotograma ({z})",

    "ocr.zorluk.etiket": "Perfil de dificultad:",

    "ocr.gorsel.insan.baslik": "Vista humana (movimiento = legible)",
    "ocr.gorsel.insan.alt": "En movimiento las letras parpadean de forma coherente — el ojo las lee.",
    "ocr.gorsel.ocr.baslik": "Entrada OCR (un fotograma = ruido)",
    "ocr.gorsel.ocr.alt": "Fotograma único congelado — letra/fondo indistinguibles, el OCR está ciego.",
    "ocr.canvas.hareketli": "Ghost-font animada — legible",
    "ocr.canvas.donuk": "Fotograma único congelado — ruido",

    "ocr.metrik.baslik": "Métricas medidas — {z}",
    "ocr.metrik.zamanKontrast": "Contraste promediado en el tiempo",
    "ocr.metrik.zamanKontrast.alt": "La señal que ve un humano",
    "ocr.metrik.tekKare": "Contraste de un fotograma",
    "ocr.metrik.tekKare.alt": "Lo que ve el OCR — muy bajo",
    "ocr.metrik.sn": "Señal/ruido de un fotograma",
    "ocr.metrik.sn.alt": "Por debajo de 1.0 = indistinguible",
    "ocr.metrik.direnc": "Puntuación de resistencia OCR",
    "ocr.metrik.direnc.alt": "Ambigüedad de un fotograma",
    "ocr.metrik.koherens": "Coherencia (sincronía)",
    "ocr.metrik.koherens.alt": "El humano capta el movimiento con esto",
    "ocr.metrik.garanti": "Contraste promediado {v} pt ≥ umbral de 25 pt → legibilidad humana garantizada.",
    "ocr.birim.pt": "pt",

    "ocr.egri.baslik": "Curva de acumulación de fotogramas — por qué el humano lee y el OCR no",
    "ocr.egri.aciklama":
      "Un solo fotograma (1) tiene bajo contraste efectivo; a medida que se acumulan fotogramas (la integración que hace el ojo humano) la señal se refuerza. El OCR mira un solo fotograma, por eso queda en el extremo izquierdo de esta curva.",
    "ocr.egri.kare": "{n} fotogramas",
    "ocr.egri.ocr": "OCR: 1 fotograma ({v} %)",
    "ocr.egri.insan": "Humano: ~30 fotogramas/s ({v} %)",

    "ocr.tablo.baslik": "Todos los perfiles de dificultad — comparación",
    "ocr.tablo.kanit": "Informe de prueba",
    "ocr.tablo.th.zorluk": "Dificultad",
    "ocr.tablo.th.zamanKontrast": "Contraste promediado",
    "ocr.tablo.th.tekKare": "Contraste de un fotograma",
    "ocr.tablo.th.sn": "S/R de un fotograma",
    "ocr.tablo.th.direnc": "Resistencia OCR",
    "ocr.tablo.th.okunabilir": "Legible",
    "ocr.tablo.evet": "Sí",
    "ocr.tablo.hayir": "No",
    "ocr.tablo.dipnot":
      "Dificultad alta: más difícil para los bots (el contraste de un fotograma sube un poco pero sigue siendo ambiguo para el OCR), aún legible para los humanos (32 pt ≥ 25 pt).",

    "ocr.demo.baslik": "Compruébalo tú mismo",
    "ocr.demo.aciklama": "Lee el texto ghost en vivo en el estudio ghost-font, luego haz una captura de pantalla — comprueba que no puedes leer nada en un solo fotograma.",
    "ocr.demo.buton": "Estudio ghost-font",

    "ocr.rapor.baslik": "SPECTER — INFORME DE PRUEBA DE RESISTENCIA OCR GHOST-FONT",
    "ocr.rapor.garanti.evet": "SÍ (todos los perfiles ≥25 puntos)",
    "ocr.rapor.garanti.hayir": "NO",
    "ocr.rapor.okunabilirGaranti": "Garantía de legibilidad: {v}",
    "ocr.rapor.minKontrast": "Contraste promediado mín.: {v} puntos",
    "ocr.rapor.maxDirenc": "Resistencia OCR máx.: {v} %",
    "ocr.rapor.zamanKontrast": "Contraste promediado (el humano ve): {v} puntos",
    "ocr.rapor.tekKareKontrast": "Contraste de un fotograma (el OCR ve): {v} puntos",
    "ocr.rapor.tekKareSN": "Señal/ruido de un fotograma: {v}",
    "ocr.rapor.direnc": "Puntuación de resistencia OCR: {v} %",
    "ocr.rapor.okunabilir": "Legible por humanos: {v}",
    "ocr.rapor.evet": "SÍ",
    "ocr.rapor.hayir": "NO",
    "ocr.rapor.yontem.1": "Método: tramado temporal. El sistema visual humano integra los fotogramas",
    "ocr.rapor.yontem.2": "(ve la señal promediada en el tiempo); un solo fotograma es ruido para el OCR.",
    "ocr.rapor.toast": "Informe de prueba descargado",
  },
};

export function ocrCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr[anahtar] ?? anahtar;
}
