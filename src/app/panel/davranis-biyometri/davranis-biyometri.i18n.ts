/**
 * Davranışsal Biyometri İmza Analizi — yerel i18n sözlüğü.
 *
 * Panel deseni: düz sözlük + `biyometriCeviri(anahtar, dil)` (dil→TR→anahtar düşüşü).
 *
 * ENUM/LIB GÜVENLİĞİ:
 *  - `sinif` enum'u ("insan"/"şüpheli"/"bot") asla çevrilmez; "sinif.insan" gibi
 *    KEY-MAP'lerden türetilir.
 *  - Lib (`davranis-biyometri.ts`) her özelliği SABİT bir TR `ad` string'iyle üretir
 *    ve `aciklama`/`band`/`gerekce` alanlarını TR döndürür. Lib DÜZENLENMEDEN, bu TR
 *    `ad` string'i STABİL BİR ID gibi kullanılıp ("ozellik.<id>.ad/aciklama/band")
 *    çevirisi buradan türetilir. `band` içindeki sayısal aralıklar veridir; olduğu
 *    gibi korunur. `gerekce` cümlesi sinif+zayıfSinyal+insanımsılıktan yeniden kurulur.
 */
import type { Dil } from "@/lib/i18n/panel";

/** Lib'in ürettiği TR özellik `ad`'ı → stabil id. Lib düzenlenmeden eşleme. */
export const OZELLIK_ID: Record<string, string> = {
  "Tuş-basma varyansı (dwell CV)": "dwell",
  "Aralık entropisi (flight)": "flight",
  "Ardışık ritim düzensizliği": "ritim",
  "Fare ivme pürüzsüzlüğü (jerk)": "jerk",
  "Dağılım şekli (çarpıklık + KS)": "sekil",
  "Dokunuş basıncı varyansı": "basinc",
  "Form dolum hızı": "hiz",
};

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // başlıklar (panel.ts'te birebir eşleşen nav yok → yerel)
    "x.baslik": "Davranışsal Biyometri İmza Analizi",
    "x.kirinti": "Davranışsal Biyometri",

    // açıklama
    "aciklama.baslik": "Kodu doğru girmek yetmez — nasıl girdiğin de imzadır.",
    "aciklama.metin1":
      "Widget tuş-basma süreleri, tuşlar-arası aralıklar, fare ivmesi ve dokunuş basıncını toplar. İnsan davranışı ",
    "aciklama.vurgu1": "doğal istatistiksel bir imza",
    "aciklama.metin2":
      " taşır: yapısal varyans, sağa-çarpık aralık dağılımı, pürüzsüz fare ivmesi. Bot iki uçtan birine düşer — ",
    "aciklama.vurgu2": "fazla düzenli",
    "aciklama.metin3": " (script) veya ",
    "aciklama.vurgu3": "fazla rastgele",
    "aciklama.metin4":
      " (gürültü). Bu motor ham sinyalden istatistiksel özellik çıkarır (CV, entropi, çarpıklık, jerk, KS mesafesi) ve açıklanabilir bir insanlık skoru üretir.",

    // örnek seçici
    "ornek.insan.ad": "Gerçek insan (masaüstü)",
    "ornek.insan.not": "Yapısal varyans, pürüzsüz fare, doğal ritim",
    "ornek.mobil-insan.ad": "Gerçek insan (mobil)",
    "ornek.mobil-insan.not": "Dokunuş basıncı + doğal jest",
    "ornek.script-bot.ad": "Script bot (sabit)",
    "ornek.script-bot.not": "Sabit gecikmeler, sıfır varyans",
    "ornek.gurultu-bot.ad": "Gürültü botu (rastgele)",
    "ornek.gurultu-bot.not": "Uniform gürültü, insan-dışı düz dağılım",

    // skor kartı
    "skor.baslik": "İnsanlık skoru",
    "skor.zayifBaslik": "En zayıf sinyal",
    "skor.zayifNot": "Bu özellik insan referansından en çok saptı — sınıflandırmayı en çok etkileyen sinyal.",

    // sınıf enum
    "sinif.insan": "İnsan",
    "sinif.şüpheli": "Şüpheli",
    "sinif.bot": "Bot",

    // gerekçe (lib TR cümlesi istemcide yeniden kurulur)
    "gerekce.insan": "Davranış sinyalleri doğal insan imzasıyla tutarlı: yapısal varyans, pürüzsüz ivme, doğal entropi.",
    "gerekce.bot": "Otomasyon imzası: en zayıf sinyal \"{ad}\" (insanımsılık {deger}). {ek}",
    "gerekce.bot.asiri": "Aşırı düzenlilik/insan-dışı desen.",
    "gerekce.bot.sapma": "İnsan referansından sapma.",
    "gerekce.supheli": "Karışık sinyaller — \"{ad}\" zayıf. Ek doğrulama (ghost-font challenge) önerilir.",

    // özellik katkıları paneli
    "katki.baslik": "Özellik katkıları (açıklanabilirlik)",
    "katki.aciklama": "Her istatistiksel özellik 0–1 insanımsılığa eşlenir; ağırlıklı ortalama skoru verir. Kırmızıya yakın = insan-dışı.",
    "katki.deger": "değer",
    "katki.insanBandi": "insan bandı:",

    // özellik adları (lib TR ad → id ile çevrilir)
    "ozellik.dwell.ad": "Tuş-basma varyansı (dwell CV)",
    "ozellik.dwell.aciklama": "İnsan her tuşu farklı süre basar (yapısal varyans); script sabit (~0), gürültü-bot aşırı yüksek (>1).",
    "ozellik.flight.ad": "Aralık entropisi (flight)",
    "ozellik.flight.aciklama": "Aralık dağılımı çeşitliliği; bot tekdüze (~0) veya insan-dışı düz-uniform (~1). İnsan yapısal orta-yüksek.",
    "ozellik.ritim.ad": "Ardışık ritim düzensizliği",
    "ozellik.ritim.aciklama": "Script sabit gecikmelerle ilerler (Δ sabit); insan ritmi düzensizdir.",
    "ozellik.jerk.ad": "Fare ivme pürüzsüzlüğü (jerk)",
    "ozellik.jerk.aciklama": "İnsan faresi pürüzsüz ivmelenir; teleport/lineer bot düz veya sıçramalı.",
    "ozellik.jerk.band": "insanımsı bant",
    "ozellik.sekil.ad": "Dağılım şekli (çarpıklık + KS)",
    "ozellik.sekil.aciklama": "İnsan aralıkları sağa-çarpıktır (çoğu kısa, ara-sıra uzun); uniform enjekte gürültü simetriktir (çarpıklık ~0).",
    "ozellik.sekil.band": "çarpıklık >0.4",
    "ozellik.basinc.ad": "Dokunuş basıncı varyansı",
    "ozellik.basinc.aciklama": "Gerçek parmak basıncı doğal dalgalanır; emüle dokunuş sabittir.",
    "ozellik.hiz.ad": "Form dolum hızı",
    "ozellik.hiz.aciklama": "Karakter başına süre (ms). İnsan-dışı hızlı gönderim (<40ms/kar) otomasyona işaret; yavaş normaldir.",
    "ozellik.hiz.band": ">60 ms/kar",

    // ham sinyal görselleştirme
    "ham.baslik": "Ham davranış sinyalleri",
    "ham.dwell": "Tuş-basma (dwell)",
    "ham.flight": "Aralık (flight)",
    "ham.fareHiz": "Fare hızı",
    "ham.basinc": "Dokunuş basıncı",
    "ham.ornek": "örnek",
    "ham.min": "min",
    "ham.max": "max",

    // yöntem notu
    "not.metin1": "Örnek sinyaller ",
    "not.vurgu1": "temsili",
    "not.metin2": " profillerdir (gerçek widget bunları canlı toplar). Analiz motoru saf/deterministiktir: ",
    "not.vurgu2": "varyasyon katsayısı",
    "not.metin3": " (script tespiti), ",
    "not.vurgu3": "entropi & çarpıklık",
    "not.metin4": " (uniform-gürültü tespiti), ",
    "not.vurgu4": "jerk",
    "not.metin5": " (fare pürüzsüzlüğü), ",
    "not.vurgu5": "KS mesafesi",
    "not.metin6": " (dağılım uyumu). Skor, ghost-font kararıyla birleşerek nihai insan/bot verdiktini besler.",
  },
  en: {
    "x.baslik": "Behavioral Biometrics Signature Analysis",
    "x.kirinti": "Behavioral Biometrics",

    "aciklama.baslik": "Typing the code right isn't enough — how you type it is a signature too.",
    "aciklama.metin1":
      "The widget collects keystroke dwell times, inter-key intervals, mouse acceleration and touch pressure. Human behavior carries ",
    "aciklama.vurgu1": "a natural statistical signature",
    "aciklama.metin2":
      ": structural variance, a right-skewed interval distribution, smooth mouse acceleration. A bot falls to one of two extremes — ",
    "aciklama.vurgu2": "too regular",
    "aciklama.metin3": " (script) or ",
    "aciklama.vurgu3": "too random",
    "aciklama.metin4":
      " (noise). This engine extracts statistical features from the raw signal (CV, entropy, skewness, jerk, KS distance) and produces an explainable humanity score.",

    "ornek.insan.ad": "Real human (desktop)",
    "ornek.insan.not": "Structural variance, smooth mouse, natural rhythm",
    "ornek.mobil-insan.ad": "Real human (mobile)",
    "ornek.mobil-insan.not": "Touch pressure + natural gesture",
    "ornek.script-bot.ad": "Script bot (fixed)",
    "ornek.script-bot.not": "Fixed delays, zero variance",
    "ornek.gurultu-bot.ad": "Noise bot (random)",
    "ornek.gurultu-bot.not": "Uniform noise, inhuman flat distribution",

    "skor.baslik": "Humanity score",
    "skor.zayifBaslik": "Weakest signal",
    "skor.zayifNot": "This feature deviated most from the human reference — the signal that most affects classification.",

    "sinif.insan": "Human",
    "sinif.şüpheli": "Suspicious",
    "sinif.bot": "Bot",

    "gerekce.insan": "Behavioral signals are consistent with a natural human signature: structural variance, smooth acceleration, natural entropy.",
    "gerekce.bot": "Automation signature: weakest signal \"{ad}\" (humanness {deger}). {ek}",
    "gerekce.bot.asiri": "Excessive regularity / inhuman pattern.",
    "gerekce.bot.sapma": "Deviation from the human reference.",
    "gerekce.supheli": "Mixed signals — \"{ad}\" is weak. Additional verification (ghost-font challenge) recommended.",

    "katki.baslik": "Feature contributions (explainability)",
    "katki.aciklama": "Each statistical feature maps to 0–1 humanness; the weighted average gives the score. Closer to red = inhuman.",
    "katki.deger": "value",
    "katki.insanBandi": "human band:",

    "ozellik.dwell.ad": "Keystroke variance (dwell CV)",
    "ozellik.dwell.aciklama": "A human holds each key for a different duration (structural variance); a script is constant (~0), a noise bot excessively high (>1).",
    "ozellik.flight.ad": "Interval entropy (flight)",
    "ozellik.flight.aciklama": "Diversity of the interval distribution; a bot is uniform (~0) or inhumanly flat-uniform (~1). Humans are structurally mid-high.",
    "ozellik.ritim.ad": "Consecutive rhythm irregularity",
    "ozellik.ritim.aciklama": "A script advances with fixed delays (constant Δ); human rhythm is irregular.",
    "ozellik.jerk.ad": "Mouse acceleration smoothness (jerk)",
    "ozellik.jerk.aciklama": "A human mouse accelerates smoothly; a teleport/linear bot is flat or jumpy.",
    "ozellik.jerk.band": "humanlike band",
    "ozellik.sekil.ad": "Distribution shape (skewness + KS)",
    "ozellik.sekil.aciklama": "Human intervals are right-skewed (mostly short, occasionally long); uniform injected noise is symmetric (skewness ~0).",
    "ozellik.sekil.band": "skewness >0.4",
    "ozellik.basinc.ad": "Touch pressure variance",
    "ozellik.basinc.aciklama": "Real finger pressure fluctuates naturally; emulated touch is constant.",
    "ozellik.hiz.ad": "Form fill speed",
    "ozellik.hiz.aciklama": "Time per character (ms). Inhumanly fast submission (<40ms/char) signals automation; slow is normal.",
    "ozellik.hiz.band": ">60 ms/char",

    "ham.baslik": "Raw behavioral signals",
    "ham.dwell": "Keystroke (dwell)",
    "ham.flight": "Interval (flight)",
    "ham.fareHiz": "Mouse speed",
    "ham.basinc": "Touch pressure",
    "ham.ornek": "samples",
    "ham.min": "min",
    "ham.max": "max",

    "not.metin1": "The example signals are ",
    "not.vurgu1": "representative",
    "not.metin2": " profiles (the real widget collects them live). The analysis engine is pure/deterministic: ",
    "not.vurgu2": "coefficient of variation",
    "not.metin3": " (script detection), ",
    "not.vurgu3": "entropy & skewness",
    "not.metin4": " (uniform-noise detection), ",
    "not.vurgu4": "jerk",
    "not.metin5": " (mouse smoothness), ",
    "not.vurgu5": "KS distance",
    "not.metin6": " (distribution fit). The score combines with the ghost-font decision to feed the final human/bot verdict.",
  },
  de: {
    "x.baslik": "Verhaltensbiometrie-Signaturanalyse",
    "x.kirinti": "Verhaltensbiometrie",

    "aciklama.baslik": "Den Code richtig einzugeben reicht nicht — wie man ihn eingibt, ist ebenfalls eine Signatur.",
    "aciklama.metin1":
      "Das Widget erfasst Tastenanschlagszeiten (Dwell), Intervalle zwischen Tasten, Mausbeschleunigung und Berührungsdruck. Menschliches Verhalten trägt ",
    "aciklama.vurgu1": "eine natürliche statistische Signatur",
    "aciklama.metin2":
      ": strukturelle Varianz, rechtsschiefe Intervallverteilung, gleichmäßige Mausbeschleunigung. Ein Bot fällt in eines von zwei Extremen — ",
    "aciklama.vurgu2": "zu regelmäßig",
    "aciklama.metin3": " (Skript) oder ",
    "aciklama.vurgu3": "zu zufällig",
    "aciklama.metin4":
      " (Rauschen). Diese Engine extrahiert statistische Merkmale aus dem Rohsignal (CV, Entropie, Schiefe, Jerk, KS-Distanz) und erzeugt einen erklärbaren Menschlichkeitswert.",

    "ornek.insan.ad": "Echter Mensch (Desktop)",
    "ornek.insan.not": "Strukturelle Varianz, gleichmäßige Maus, natürlicher Rhythmus",
    "ornek.mobil-insan.ad": "Echter Mensch (mobil)",
    "ornek.mobil-insan.not": "Berührungsdruck + natürliche Geste",
    "ornek.script-bot.ad": "Skript-Bot (fix)",
    "ornek.script-bot.not": "Feste Verzögerungen, null Varianz",
    "ornek.gurultu-bot.ad": "Rausch-Bot (zufällig)",
    "ornek.gurultu-bot.not": "Uniformes Rauschen, unmenschlich flache Verteilung",

    "skor.baslik": "Menschlichkeitswert",
    "skor.zayifBaslik": "Schwächstes Signal",
    "skor.zayifNot": "Dieses Merkmal wich am stärksten von der menschlichen Referenz ab — das Signal mit dem größten Einfluss auf die Klassifizierung.",

    "sinif.insan": "Mensch",
    "sinif.şüpheli": "Verdächtig",
    "sinif.bot": "Bot",

    "gerekce.insan": "Die Verhaltenssignale sind mit einer natürlichen menschlichen Signatur konsistent: strukturelle Varianz, gleichmäßige Beschleunigung, natürliche Entropie.",
    "gerekce.bot": "Automatisierungssignatur: schwächstes Signal \"{ad}\" (Menschlichkeit {deger}). {ek}",
    "gerekce.bot.asiri": "Übermäßige Regelmäßigkeit / unmenschliches Muster.",
    "gerekce.bot.sapma": "Abweichung von der menschlichen Referenz.",
    "gerekce.supheli": "Gemischte Signale — \"{ad}\" ist schwach. Zusätzliche Verifizierung (Ghost-Font-Challenge) empfohlen.",

    "katki.baslik": "Merkmalsbeiträge (Erklärbarkeit)",
    "katki.aciklama": "Jedes statistische Merkmal wird auf 0–1 Menschlichkeit abgebildet; der gewichtete Mittelwert ergibt den Wert. Näher an Rot = unmenschlich.",
    "katki.deger": "Wert",
    "katki.insanBandi": "Menschband:",

    "ozellik.dwell.ad": "Tastenanschlagsvarianz (Dwell CV)",
    "ozellik.dwell.aciklama": "Ein Mensch hält jede Taste unterschiedlich lange (strukturelle Varianz); ein Skript ist konstant (~0), ein Rausch-Bot übermäßig hoch (>1).",
    "ozellik.flight.ad": "Intervall-Entropie (Flight)",
    "ozellik.flight.aciklama": "Vielfalt der Intervallverteilung; ein Bot ist uniform (~0) oder unmenschlich flach-uniform (~1). Menschen sind strukturell mittel-hoch.",
    "ozellik.ritim.ad": "Aufeinanderfolgende Rhythmus-Unregelmäßigkeit",
    "ozellik.ritim.aciklama": "Ein Skript schreitet mit festen Verzögerungen voran (konstantes Δ); menschlicher Rhythmus ist unregelmäßig.",
    "ozellik.jerk.ad": "Mausbeschleunigungs-Glätte (Jerk)",
    "ozellik.jerk.aciklama": "Eine menschliche Maus beschleunigt gleichmäßig; ein Teleport-/Linear-Bot ist flach oder sprunghaft.",
    "ozellik.jerk.band": "menschenähnliches Band",
    "ozellik.sekil.ad": "Verteilungsform (Schiefe + KS)",
    "ozellik.sekil.aciklama": "Menschliche Intervalle sind rechtsschief (meist kurz, gelegentlich lang); uniform injiziertes Rauschen ist symmetrisch (Schiefe ~0).",
    "ozellik.sekil.band": "Schiefe >0.4",
    "ozellik.basinc.ad": "Berührungsdruckvarianz",
    "ozellik.basinc.aciklama": "Echter Fingerdruck schwankt natürlich; emulierte Berührung ist konstant.",
    "ozellik.hiz.ad": "Formular-Ausfüllgeschwindigkeit",
    "ozellik.hiz.aciklama": "Zeit pro Zeichen (ms). Unmenschlich schnelles Absenden (<40ms/Zeichen) deutet auf Automatisierung; langsam ist normal.",
    "ozellik.hiz.band": ">60 ms/Zeichen",

    "ham.baslik": "Rohe Verhaltenssignale",
    "ham.dwell": "Tastenanschlag (Dwell)",
    "ham.flight": "Intervall (Flight)",
    "ham.fareHiz": "Mausgeschwindigkeit",
    "ham.basinc": "Berührungsdruck",
    "ham.ornek": "Proben",
    "ham.min": "Min",
    "ham.max": "Max",

    "not.metin1": "Die Beispielsignale sind ",
    "not.vurgu1": "repräsentative",
    "not.metin2": " Profile (das echte Widget erfasst sie live). Die Analyse-Engine ist rein/deterministisch: ",
    "not.vurgu2": "Variationskoeffizient",
    "not.metin3": " (Skript-Erkennung), ",
    "not.vurgu3": "Entropie & Schiefe",
    "not.metin4": " (Uniform-Rausch-Erkennung), ",
    "not.vurgu4": "Jerk",
    "not.metin5": " (Maus-Glätte), ",
    "not.vurgu5": "KS-Distanz",
    "not.metin6": " (Verteilungsanpassung). Der Wert verbindet sich mit der Ghost-Font-Entscheidung und speist das endgültige Mensch/Bot-Verdikt.",
  },
  fr: {
    "x.baslik": "Analyse de signature biométrique comportementale",
    "x.kirinti": "Biométrie comportementale",

    "aciklama.baslik": "Saisir le code correctement ne suffit pas — la façon de le saisir est aussi une signature.",
    "aciklama.metin1":
      "Le widget collecte les durées d'appui des touches, les intervalles entre touches, l'accélération de la souris et la pression tactile. Le comportement humain porte ",
    "aciklama.vurgu1": "une signature statistique naturelle",
    "aciklama.metin2":
      " : variance structurelle, distribution des intervalles asymétrique à droite, accélération de souris fluide. Un bot tombe dans l'un des deux extrêmes — ",
    "aciklama.vurgu2": "trop régulier",
    "aciklama.metin3": " (script) ou ",
    "aciklama.vurgu3": "trop aléatoire",
    "aciklama.metin4":
      " (bruit). Ce moteur extrait des caractéristiques statistiques du signal brut (CV, entropie, asymétrie, jerk, distance KS) et produit un score d'humanité explicable.",

    "ornek.insan.ad": "Humain réel (bureau)",
    "ornek.insan.not": "Variance structurelle, souris fluide, rythme naturel",
    "ornek.mobil-insan.ad": "Humain réel (mobile)",
    "ornek.mobil-insan.not": "Pression tactile + geste naturel",
    "ornek.script-bot.ad": "Bot script (fixe)",
    "ornek.script-bot.not": "Délais fixes, variance nulle",
    "ornek.gurultu-bot.ad": "Bot bruit (aléatoire)",
    "ornek.gurultu-bot.not": "Bruit uniforme, distribution plate non humaine",

    "skor.baslik": "Score d'humanité",
    "skor.zayifBaslik": "Signal le plus faible",
    "skor.zayifNot": "Cette caractéristique s'est le plus écartée de la référence humaine — le signal qui influence le plus la classification.",

    "sinif.insan": "Humain",
    "sinif.şüpheli": "Suspect",
    "sinif.bot": "Bot",

    "gerekce.insan": "Les signaux comportementaux sont cohérents avec une signature humaine naturelle : variance structurelle, accélération fluide, entropie naturelle.",
    "gerekce.bot": "Signature d'automatisation : signal le plus faible « {ad} » (humanité {deger}). {ek}",
    "gerekce.bot.asiri": "Régularité excessive / motif non humain.",
    "gerekce.bot.sapma": "Écart par rapport à la référence humaine.",
    "gerekce.supheli": "Signaux mixtes — « {ad} » est faible. Vérification supplémentaire (challenge ghost-font) recommandée.",

    "katki.baslik": "Contributions des caractéristiques (explicabilité)",
    "katki.aciklama": "Chaque caractéristique statistique est mappée sur 0–1 d'humanité ; la moyenne pondérée donne le score. Plus proche du rouge = non humain.",
    "katki.deger": "valeur",
    "katki.insanBandi": "bande humaine :",

    "ozellik.dwell.ad": "Variance d'appui des touches (dwell CV)",
    "ozellik.dwell.aciklama": "Un humain maintient chaque touche une durée différente (variance structurelle) ; un script est constant (~0), un bot bruit excessivement élevé (>1).",
    "ozellik.flight.ad": "Entropie des intervalles (flight)",
    "ozellik.flight.aciklama": "Diversité de la distribution des intervalles ; un bot est uniforme (~0) ou plat-uniforme non humain (~1). Les humains sont structurellement moyen-élevés.",
    "ozellik.ritim.ad": "Irrégularité du rythme consécutif",
    "ozellik.ritim.aciklama": "Un script progresse par délais fixes (Δ constant) ; le rythme humain est irrégulier.",
    "ozellik.jerk.ad": "Fluidité de l'accélération de la souris (jerk)",
    "ozellik.jerk.aciklama": "Une souris humaine accélère en douceur ; un bot téléport/linéaire est plat ou saccadé.",
    "ozellik.jerk.band": "bande humaine",
    "ozellik.sekil.ad": "Forme de distribution (asymétrie + KS)",
    "ozellik.sekil.aciklama": "Les intervalles humains sont asymétriques à droite (surtout courts, parfois longs) ; le bruit injecté uniforme est symétrique (asymétrie ~0).",
    "ozellik.sekil.band": "asymétrie >0.4",
    "ozellik.basinc.ad": "Variance de la pression tactile",
    "ozellik.basinc.aciklama": "La pression d'un vrai doigt fluctue naturellement ; le toucher émulé est constant.",
    "ozellik.hiz.ad": "Vitesse de remplissage du formulaire",
    "ozellik.hiz.aciklama": "Temps par caractère (ms). Une soumission non humainement rapide (<40 ms/car.) signale l'automatisation ; lent est normal.",
    "ozellik.hiz.band": ">60 ms/car.",

    "ham.baslik": "Signaux comportementaux bruts",
    "ham.dwell": "Appui touche (dwell)",
    "ham.flight": "Intervalle (flight)",
    "ham.fareHiz": "Vitesse souris",
    "ham.basinc": "Pression tactile",
    "ham.ornek": "échantillons",
    "ham.min": "min",
    "ham.max": "max",

    "not.metin1": "Les signaux d'exemple sont des profils ",
    "not.vurgu1": "représentatifs",
    "not.metin2": " (le vrai widget les collecte en direct). Le moteur d'analyse est pur/déterministe : ",
    "not.vurgu2": "coefficient de variation",
    "not.metin3": " (détection de script), ",
    "not.vurgu3": "entropie & asymétrie",
    "not.metin4": " (détection de bruit uniforme), ",
    "not.vurgu4": "jerk",
    "not.metin5": " (fluidité de la souris), ",
    "not.vurgu5": "distance KS",
    "not.metin6": " (ajustement de distribution). Le score se combine à la décision ghost-font pour alimenter le verdict final humain/bot.",
  },
  es: {
    "x.baslik": "Análisis de firma biométrica de comportamiento",
    "x.kirinti": "Biometría de comportamiento",

    "aciklama.baslik": "Escribir el código bien no basta — cómo lo escribes también es una firma.",
    "aciklama.metin1":
      "El widget recopila los tiempos de pulsación de teclas, los intervalos entre teclas, la aceleración del ratón y la presión táctil. El comportamiento humano lleva ",
    "aciklama.vurgu1": "una firma estadística natural",
    "aciklama.metin2":
      ": varianza estructural, distribución de intervalos sesgada a la derecha, aceleración de ratón suave. Un bot cae en uno de dos extremos — ",
    "aciklama.vurgu2": "demasiado regular",
    "aciklama.metin3": " (script) o ",
    "aciklama.vurgu3": "demasiado aleatorio",
    "aciklama.metin4":
      " (ruido). Este motor extrae características estadísticas de la señal en bruto (CV, entropía, asimetría, jerk, distancia KS) y produce una puntuación de humanidad explicable.",

    "ornek.insan.ad": "Humano real (escritorio)",
    "ornek.insan.not": "Varianza estructural, ratón suave, ritmo natural",
    "ornek.mobil-insan.ad": "Humano real (móvil)",
    "ornek.mobil-insan.not": "Presión táctil + gesto natural",
    "ornek.script-bot.ad": "Bot script (fijo)",
    "ornek.script-bot.not": "Retrasos fijos, varianza cero",
    "ornek.gurultu-bot.ad": "Bot de ruido (aleatorio)",
    "ornek.gurultu-bot.not": "Ruido uniforme, distribución plana no humana",

    "skor.baslik": "Puntuación de humanidad",
    "skor.zayifBaslik": "Señal más débil",
    "skor.zayifNot": "Esta característica se desvió más de la referencia humana — la señal que más afecta a la clasificación.",

    "sinif.insan": "Humano",
    "sinif.şüpheli": "Sospechoso",
    "sinif.bot": "Bot",

    "gerekce.insan": "Las señales de comportamiento son coherentes con una firma humana natural: varianza estructural, aceleración suave, entropía natural.",
    "gerekce.bot": "Firma de automatización: señal más débil «{ad}» (humanidad {deger}). {ek}",
    "gerekce.bot.asiri": "Regularidad excesiva / patrón no humano.",
    "gerekce.bot.sapma": "Desviación de la referencia humana.",
    "gerekce.supheli": "Señales mixtas — «{ad}» es débil. Se recomienda verificación adicional (challenge ghost-font).",

    "katki.baslik": "Contribuciones de características (explicabilidad)",
    "katki.aciklama": "Cada característica estadística se asigna a 0–1 de humanidad; la media ponderada da la puntuación. Más cerca del rojo = no humano.",
    "katki.deger": "valor",
    "katki.insanBandi": "banda humana:",

    "ozellik.dwell.ad": "Varianza de pulsación (dwell CV)",
    "ozellik.dwell.aciklama": "Un humano mantiene cada tecla una duración distinta (varianza estructural); un script es constante (~0), un bot de ruido excesivamente alto (>1).",
    "ozellik.flight.ad": "Entropía de intervalos (flight)",
    "ozellik.flight.aciklama": "Diversidad de la distribución de intervalos; un bot es uniforme (~0) o plano-uniforme no humano (~1). Los humanos son estructuralmente medio-altos.",
    "ozellik.ritim.ad": "Irregularidad del ritmo consecutivo",
    "ozellik.ritim.aciklama": "Un script avanza con retrasos fijos (Δ constante); el ritmo humano es irregular.",
    "ozellik.jerk.ad": "Suavidad de aceleración del ratón (jerk)",
    "ozellik.jerk.aciklama": "Un ratón humano acelera suavemente; un bot de teletransporte/lineal es plano o brusco.",
    "ozellik.jerk.band": "banda humana",
    "ozellik.sekil.ad": "Forma de distribución (asimetría + KS)",
    "ozellik.sekil.aciklama": "Los intervalos humanos están sesgados a la derecha (en su mayoría cortos, ocasionalmente largos); el ruido inyectado uniforme es simétrico (asimetría ~0).",
    "ozellik.sekil.band": "asimetría >0.4",
    "ozellik.basinc.ad": "Varianza de presión táctil",
    "ozellik.basinc.aciklama": "La presión de un dedo real fluctúa naturalmente; el toque emulado es constante.",
    "ozellik.hiz.ad": "Velocidad de llenado del formulario",
    "ozellik.hiz.aciklama": "Tiempo por carácter (ms). Un envío no humanamente rápido (<40ms/car.) indica automatización; lento es normal.",
    "ozellik.hiz.band": ">60 ms/car.",

    "ham.baslik": "Señales de comportamiento en bruto",
    "ham.dwell": "Pulsación (dwell)",
    "ham.flight": "Intervalo (flight)",
    "ham.fareHiz": "Velocidad del ratón",
    "ham.basinc": "Presión táctil",
    "ham.ornek": "muestras",
    "ham.min": "mín",
    "ham.max": "máx",

    "not.metin1": "Las señales de ejemplo son perfiles ",
    "not.vurgu1": "representativos",
    "not.metin2": " (el widget real las recopila en vivo). El motor de análisis es puro/determinista: ",
    "not.vurgu2": "coeficiente de variación",
    "not.metin3": " (detección de script), ",
    "not.vurgu3": "entropía y asimetría",
    "not.metin4": " (detección de ruido uniforme), ",
    "not.vurgu4": "jerk",
    "not.metin5": " (suavidad del ratón), ",
    "not.vurgu5": "distancia KS",
    "not.metin6": " (ajuste de distribución). La puntuación se combina con la decisión ghost-font para alimentar el veredicto final humano/bot.",
  },
};

/** Anahtarı hedef dile çevir; yoksa TR'ye, o da yoksa anahtara düşer. */
export function biyometriCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
