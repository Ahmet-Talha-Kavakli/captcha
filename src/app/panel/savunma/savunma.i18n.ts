/**
 * Savunma Katmanları (Defense Layers Overview) — YEREL sayfa sözlüğü.
 * ==================================================================
 * Bu dosya YALNIZCA /panel/savunma istemci bileşeninin kullanıcıya görünen
 * KROM/ETİKET metinlerini 5 dile taşır (tr/en/de/fr/es). Paylaşılan
 * `@/lib/i18n/panel` sözlüğüne DOKUNMAZ; ondan yalnızca `Dil` tipini alır.
 *
 * ÖNEMLİ (güvenlik & veri):
 *  - Sayılar (yakalanan olay, katman-derinliği, sağlık skoru) ve yüzdeler
 *    VERİ'dir — çevrilmez, yerele-duyarlı Intl (SV_YEREL) ile biçimlenir.
 *  - Katman kimlikleri (ghost-font/honeypot/tutarlilik/pow) ENUM'dur — asla
 *    çevrilmez; burada katman-id → çeviri-anahtarı eşlemesiyle etiketlenir
 *    (örn t("sv.katman.ghost-font.ad")).
 *  - `sv.baslik` başlık anahtarı BURADA yereldir (paylaşılan panel.ts'e
 *    dokunmadan) — 5 dilde tutulur.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // Başlık (yerel — paylaşılan panel.ts'e dokunmadan)
    "sv.baslik": "Savunma Katmanları",

    // Sayfa açıklaması
    "sv.aciklama":
      "Veylify'ın çok-katmanlı savunması tek ekranda. Dört bağımsız katman aynı isteğe farklı sorular sorar; bir bot birini atlatsa bile diğerlerine takılır. Aşağıda her katmanın gözlemlenen trafikte ne yaptığını görürsün.",

    // Özet (stat) etiketleri
    "sv.stat.toplamOlay": "Toplam olay",
    "sv.stat.yakalanan": "Yakalanan tehdit",
    "sv.stat.derinlik": "Ort. katman-derinliği",
    "sv.stat.saglik": "Savunma sağlığı",
    "sv.stat.derinlikBirim": "katman/tehdit",

    // "Katmanlı savunma" bölüm başlığı
    "sv.katmanlar.baslik": "Dört savunma katmanı",
    "sv.katmanlar.aciklama":
      "Her katman farklı bir zayıflığı hedefler. Sırayla: okuma-testi, görünmez tuzak, tarayıcı kimliği ve hesaplama maliyeti.",

    // Katman kartı ortak etiketler
    "sv.kart.soru": "Yanıtladığı soru",
    "sv.kart.kapsama": "Bu trafikteki kapsama",
    "sv.kart.yakalanan": "Yakalanan olay",
    "sv.kart.canli": "Canlı & entegre",
    "sv.kart.detay": "Katman panelini aç",
    "sv.kart.atlatma": "Atlatması neden zor",

    // Zorluk etiketleri (enum → etiket)
    "sv.zorluk.orta": "Orta",
    "sv.zorluk.yuksek": "Yüksek",
    "sv.zorluk.kritik": "Kritik",

    // --- Katman: Ghost-Font ---
    "sv.katman.ghost-font.ad": "Ghost-Font",
    "sv.katman.ghost-font.soru": "İnsan mı okuyor?",
    "sv.katman.ghost-font.aciklama":
      "Hareketli-nokta (temporal dithering) yazı tipiyle bir kod gösterir. İnsan gözü kodu net okur; ekran-kazıyan bot ve OCR her karede yalnızca gürültü görür.",
    "sv.katman.ghost-font.atlatma":
      "Statik piksel yoktur — kaydedilen tek bir kare okunamaz. Atlatmak için gerçek zamanlı, insan-benzeri görsel algı gerekir; bu da otomasyonu ekonomik olmaktan çıkarır.",

    // --- Katman: Honeypot ---
    "sv.katman.honeypot.ad": "Honeypot",
    "sv.katman.honeypot.soru": "Görünmez tuzağa düştü mü?",
    "sv.katman.honeypot.aciklama":
      "Forma insana görünmeyen tuzak alanlar yerleştirir. Gerçek kullanıcı onları hiç görmez ve boş bırakır; formu kör dolduran bot tuzağa düşer.",
    "sv.katman.honeypot.atlatma":
      "Botun her alanı hangi kuralla dolduracağını bilmesi gerekir; tuzak alanları gerçeklerden ayırt etmek DOM'u insan gibi yorumlamayı gerektirir. Yanlış-pozitif oranı ~sıfırdır.",

    // --- Katman: Tarayıcı Tutarlılık ---
    "sv.katman.tutarlilik.ad": "Tarayıcı Tutarlılık",
    "sv.katman.tutarlilik.soru": "İddia ettiğin tarayıcı mısın?",
    "sv.katman.tutarlilik.aciklama":
      "İstemcinin beyan ettiği kimliği (User-Agent) gerçek JS/TLS parmak-izleriyle çapraz-doğrular. \"Chrome\" diyen ama Chrome gibi davranmayan istemciyi yakalar.",
    "sv.katman.tutarlilik.atlatma":
      "İnandırıcı bir sahtelik için başlıklar, JS ortamı, TLS el-sıkışması ve davranışın hepsinin tutarlı olması gerekir. Tek bir uyumsuzluk maskeyi düşürür.",

    // --- Katman: İşlem Kanıtı (Proof of Work) ---
    "sv.katman.pow.ad": "İşlem Kanıtı",
    "sv.katman.pow.soru": "CPU maliyetini ödedi mi?",
    "sv.katman.pow.aciklama":
      "Şüpheli isteğe kabul öncesi küçük bir hesaplama bulmacası çözdürür. İnsan bir kez ~ms bekler; milyonlarca istek yapan bot bulmacayı milyonlarca kez çözmek zorunda kalır.",
    "sv.katman.pow.atlatma":
      "Bulmaca atlanamaz; yalnızca çözülebilir. Adaptif zorluk şüpheli trafiği ağırlaştırır, böylece hacim saldırısının CPU maliyeti ekonomik olarak caydırıcı hale gelir.",

    // Katmanlı-savunma (defense-in-depth) açıklayıcı
    "sv.derinlik.baslik": "Neden tek katman değil, dört katman?",
    "sv.derinlik.aciklama":
      "Tek bir savunma her zaman bir kör noktaya sahiptir. Katmanları üst üste koyunca saldırganın DÖRDÜNÜ birden yenmesi gerekir — ve her katman diğerlerinin kaçırdığını yakalar.",
    "sv.derinlik.nokta1.baslik": "Hepsini yenmek zorunda",
    "sv.derinlik.nokta1.aciklama":
      "Bir katmanı atlatmak yetmez. Ghost-font'u geçen bot honeypot'a, onu geçen tutarlılığa, onu geçen İşlem Kanıtı'na takılır.",
    "sv.derinlik.nokta2.baslik": "Kör noktalar örtüşür",
    "sv.derinlik.nokta2.aciklama":
      "Her katman farklı bir sinyale bakar (görsel algı, DOM davranışı, kimlik tutarlılığı, hesaplama maliyeti). Birinin kaçırdığını bir diğeri görür.",
    "sv.derinlik.nokta3.baslik": "Maliyet saldırgana biner",
    "sv.derinlik.nokta3.aciklama":
      "Katman sayısı arttıkça ölçekli otomasyon üstel olarak pahalılaşır. Meşru kullanıcı hiçbir sürtünme hissetmez.",

    // Katman-derinliği rozet açıklaması
    "sv.derinlik.olcum":
      "Katman-derinliği: gözlemlenen her kötücül olayı ortalama kaç katmanın bağımsız olarak yakaladığı. Yüksek olması, savunmanın örtüşerek çalıştığı anlamına gelir.",

    // Dürüstlük notu
    "sv.not":
      "Dört katman da Veylify'da GERÇEK ve canlı entegre çalışır. Yukarıdaki kapsama yüzdeleri ise gerçek bir katman-isabet sayacı değil, gözlemlenen {n} olaydan (verdict, bot sınıfı, tutarlılık analizi ve skor) türetilen <b>çıkarımsal</b> tahminlerdir — bir katmanın belirli bir olayı gerçekten yakalayıp yakalamadığının kesin kaydı değildir.",
    "sv.notGercek":
      "Dört katman da GERÇEK ve canlı entegre çalışır. Yukarıdaki kapsama yüzdeleri artık {n} olayın <b>gerçek katman-isabet kayıtlarından</b> (verify akışının her olaya yazdığı tetiklenen-katmanlar) sayılır — çıkarımsal tahmin değil.",
  },

  en: {
    "sv.baslik": "Defense Layers",

    "sv.aciklama":
      "Veylify's layered defense on one screen. Four independent layers ask the same request a different question; even if a bot beats one, it gets caught by the others. Below is what each layer does in your observed traffic.",

    "sv.stat.toplamOlay": "Total events",
    "sv.stat.yakalanan": "Threats caught",
    "sv.stat.derinlik": "Avg. layer depth",
    "sv.stat.saglik": "Defense health",
    "sv.stat.derinlikBirim": "layers/threat",

    "sv.katmanlar.baslik": "Four defense layers",
    "sv.katmanlar.aciklama":
      "Each layer targets a different weakness. In order: a reading test, an invisible trap, browser identity, and computational cost.",

    "sv.kart.soru": "Question it answers",
    "sv.kart.kapsama": "Coverage in this traffic",
    "sv.kart.yakalanan": "Events caught",
    "sv.kart.canli": "Live & integrated",
    "sv.kart.detay": "Open layer panel",
    "sv.kart.atlatma": "Why it's hard to bypass",

    "sv.zorluk.orta": "Medium",
    "sv.zorluk.yuksek": "High",
    "sv.zorluk.kritik": "Critical",

    "sv.katman.ghost-font.ad": "Ghost-Font",
    "sv.katman.ghost-font.soru": "Is a human reading this?",
    "sv.katman.ghost-font.aciklama":
      "Renders a code in a moving-dot (temporal dithering) font. A human eye reads it clearly; a screen-scraping bot and OCR see only noise in every single frame.",
    "sv.katman.ghost-font.atlatma":
      "There are no static pixels — a single captured frame is unreadable. Bypassing it needs real-time, human-like visual perception, which makes automation uneconomical.",

    "sv.katman.honeypot.ad": "Honeypot",
    "sv.katman.honeypot.soru": "Did it fall into the invisible trap?",
    "sv.katman.honeypot.aciklama":
      "Places decoy fields in the form that are invisible to humans. A real user never sees them and leaves them empty; a bot blindly filling the form falls in.",
    "sv.katman.honeypot.atlatma":
      "The bot would have to know which rule fills each field; telling decoy fields from real ones requires interpreting the DOM like a human. The false-positive rate is ~zero.",

    "sv.katman.tutarlilik.ad": "Browser Consistency",
    "sv.katman.tutarlilik.soru": "Are you the browser you claim to be?",
    "sv.katman.tutarlilik.aciklama":
      "Cross-validates the client's declared identity (User-Agent) against its real JS/TLS fingerprints. It catches a client that says \"Chrome\" but doesn't behave like Chrome.",
    "sv.katman.tutarlilik.atlatma":
      "A convincing fake needs the headers, JS environment, TLS handshake and behavior to all agree. A single mismatch drops the mask.",

    "sv.katman.pow.ad": "Proof of Work",
    "sv.katman.pow.soru": "Did it pay the CPU cost?",
    "sv.katman.pow.aciklama":
      "Makes a suspicious request solve a small computational puzzle before it's accepted. A human waits ~ms once; a bot doing millions of requests must solve the puzzle millions of times.",
    "sv.katman.pow.atlatma":
      "The puzzle can't be skipped, only solved. Adaptive difficulty makes suspicious traffic heavier, so a volume attack's CPU cost becomes economically deterred.",

    "sv.derinlik.baslik": "Why four layers, not one?",
    "sv.derinlik.aciklama":
      "Any single defense always has a blind spot. Stacking layers means an attacker has to beat ALL FOUR — and each layer catches what the others miss.",
    "sv.derinlik.nokta1.baslik": "Must beat all of them",
    "sv.derinlik.nokta1.aciklama":
      "Bypassing one layer isn't enough. A bot past Ghost-Font hits the honeypot, past that hits consistency, past that hits Proof of Work.",
    "sv.derinlik.nokta2.baslik": "Blind spots overlap",
    "sv.derinlik.nokta2.aciklama":
      "Each layer looks at a different signal (visual perception, DOM behavior, identity consistency, computational cost). What one misses, another sees.",
    "sv.derinlik.nokta3.baslik": "Cost shifts to the attacker",
    "sv.derinlik.nokta3.aciklama":
      "The more layers, the more exponentially expensive scaled automation becomes. A legitimate user feels no friction at all.",

    "sv.derinlik.olcum":
      "Layer depth: on average how many layers independently caught each observed malicious event. A higher number means the defenses work with overlap.",

    "sv.not":
      "All four layers are REAL and live-integrated in Veylify. The coverage percentages above are not a true layer-hit counter but <b>inferred</b> estimates derived from your {n} observed events (verdict, bot class, consistency analysis and score) — not an exact record of whether a layer actually caught a given event.",
    "sv.notGercek":
      "All four layers are REAL and live-integrated. The coverage percentages above are now counted from the <b>real layer-hit records</b> of your {n} events (the triggered-layers the verify flow writes onto each event) — not inferred estimates.",
  },

  de: {
    "sv.baslik": "Verteidigungsebenen",

    "sv.aciklama":
      "Veylifys mehrschichtige Verteidigung auf einem Bildschirm. Vier unabhängige Ebenen stellen derselben Anfrage eine andere Frage; selbst wenn ein Bot eine schlägt, fangen ihn die anderen. Unten steht, was jede Ebene in Ihrem beobachteten Verkehr tut.",

    "sv.stat.toplamOlay": "Ereignisse gesamt",
    "sv.stat.yakalanan": "Erkannte Bedrohungen",
    "sv.stat.derinlik": "Durchschn. Ebenentiefe",
    "sv.stat.saglik": "Verteidigungszustand",
    "sv.stat.derinlikBirim": "Ebenen/Bedrohung",

    "sv.katmanlar.baslik": "Vier Verteidigungsebenen",
    "sv.katmanlar.aciklama":
      "Jede Ebene zielt auf eine andere Schwachstelle. In dieser Reihenfolge: ein Lesetest, eine unsichtbare Falle, Browser-Identität und Rechenkosten.",

    "sv.kart.soru": "Beantwortete Frage",
    "sv.kart.kapsama": "Abdeckung in diesem Verkehr",
    "sv.kart.yakalanan": "Erkannte Ereignisse",
    "sv.kart.canli": "Live & integriert",
    "sv.kart.detay": "Ebenen-Panel öffnen",
    "sv.kart.atlatma": "Warum es schwer zu umgehen ist",

    "sv.zorluk.orta": "Mittel",
    "sv.zorluk.yuksek": "Hoch",
    "sv.zorluk.kritik": "Kritisch",

    "sv.katman.ghost-font.ad": "Ghost-Font",
    "sv.katman.ghost-font.soru": "Liest hier ein Mensch?",
    "sv.katman.ghost-font.aciklama":
      "Zeigt einen Code in einer Schrift mit bewegten Punkten (temporales Dithering). Das menschliche Auge liest ihn klar; ein Screen-Scraping-Bot und OCR sehen in jedem einzelnen Frame nur Rauschen.",
    "sv.katman.ghost-font.atlatma":
      "Es gibt keine statischen Pixel — ein einzeln erfasster Frame ist unlesbar. Ein Umgehen erfordert visuelle Wahrnehmung in Echtzeit wie beim Menschen, was Automatisierung unwirtschaftlich macht.",

    "sv.katman.honeypot.ad": "Honeypot",
    "sv.katman.honeypot.soru": "Ist er in die unsichtbare Falle getappt?",
    "sv.katman.honeypot.aciklama":
      "Platziert im Formular Köderfelder, die für Menschen unsichtbar sind. Ein echter Nutzer sieht sie nie und lässt sie leer; ein Bot, der das Formular blind ausfüllt, tappt hinein.",
    "sv.katman.honeypot.atlatma":
      "Der Bot müsste wissen, mit welcher Regel er jedes Feld füllt; Köderfelder von echten zu unterscheiden erfordert, das DOM wie ein Mensch zu deuten. Die Falsch-Positiv-Rate ist ~null.",

    "sv.katman.tutarlilik.ad": "Browser-Konsistenz",
    "sv.katman.tutarlilik.soru": "Sind Sie der Browser, für den Sie sich ausgeben?",
    "sv.katman.tutarlilik.aciklama":
      "Gleicht die vom Client angegebene Identität (User-Agent) mit seinen echten JS-/TLS-Fingerabdrücken ab. Fängt einen Client, der \"Chrome\" sagt, sich aber nicht wie Chrome verhält.",
    "sv.katman.tutarlilik.atlatma":
      "Eine überzeugende Fälschung erfordert, dass Header, JS-Umgebung, TLS-Handshake und Verhalten alle übereinstimmen. Eine einzige Abweichung lässt die Maske fallen.",

    "sv.katman.pow.ad": "Arbeitsnachweis",
    "sv.katman.pow.soru": "Hat er die CPU-Kosten bezahlt?",
    "sv.katman.pow.aciklama":
      "Lässt eine verdächtige Anfrage vor der Annahme ein kleines Rechenrätsel lösen. Ein Mensch wartet einmal ~ms; ein Bot mit Millionen Anfragen muss das Rätsel millionenfach lösen.",
    "sv.katman.pow.atlatma":
      "Das Rätsel lässt sich nicht überspringen, nur lösen. Adaptive Schwierigkeit macht verdächtigen Verkehr schwerer, sodass die CPU-Kosten eines Volumenangriffs wirtschaftlich abgeschreckt werden.",

    "sv.derinlik.baslik": "Warum vier Ebenen, nicht eine?",
    "sv.derinlik.aciklama":
      "Jede einzelne Verteidigung hat immer einen blinden Fleck. Gestapelte Ebenen bedeuten, dass ein Angreifer ALLE VIER schlagen muss — und jede Ebene fängt, was die anderen übersehen.",
    "sv.derinlik.nokta1.baslik": "Muss alle schlagen",
    "sv.derinlik.nokta1.aciklama":
      "Eine Ebene zu umgehen genügt nicht. Ein Bot hinter Ghost-Font trifft auf den Honeypot, danach auf die Konsistenz, danach auf den Arbeitsnachweis.",
    "sv.derinlik.nokta2.baslik": "Blinde Flecken überlappen",
    "sv.derinlik.nokta2.aciklama":
      "Jede Ebene betrachtet ein anderes Signal (visuelle Wahrnehmung, DOM-Verhalten, Identitätskonsistenz, Rechenkosten). Was die eine übersieht, sieht die andere.",
    "sv.derinlik.nokta3.baslik": "Kosten verlagern sich zum Angreifer",
    "sv.derinlik.nokta3.aciklama":
      "Je mehr Ebenen, desto exponentiell teurer wird skalierte Automatisierung. Ein legitimer Nutzer spürt keinerlei Reibung.",

    "sv.derinlik.olcum":
      "Ebenentiefe: durchschnittlich wie viele Ebenen jedes beobachtete bösartige Ereignis unabhängig gefangen haben. Eine höhere Zahl bedeutet, dass die Verteidigungen überlappend arbeiten.",

    "sv.not":
      "Alle vier Ebenen sind in Veylify ECHT und live integriert. Die Abdeckungsprozentsätze oben sind kein echter Ebenen-Treffer-Zähler, sondern <b>abgeleitete</b> Schätzungen aus Ihren {n} beobachteten Ereignissen (Verdict, Bot-Klasse, Konsistenzanalyse und Score) — kein exakter Nachweis, ob eine Ebene ein bestimmtes Ereignis tatsächlich gefangen hat.",
    "sv.notGercek":
      "Alle vier Ebenen sind ECHT und live integriert. Die obigen Abdeckungsprozente werden jetzt aus den <b>echten Ebenen-Treffer-Datensätzen</b> Ihrer {n} Ereignisse gezählt (die vom Verify-Fluss auf jedes Ereignis geschriebenen ausgelösten Ebenen) — keine Schätzungen.",
  },

  fr: {
    "sv.baslik": "Couches de défense",

    "sv.aciklama":
      "La défense multicouche de Veylify sur un seul écran. Quatre couches indépendantes posent à la même requête une question différente ; même si un bot en franchit une, il est pris par les autres. Ci-dessous, ce que chaque couche fait dans votre trafic observé.",

    "sv.stat.toplamOlay": "Événements totaux",
    "sv.stat.yakalanan": "Menaces attrapées",
    "sv.stat.derinlik": "Profondeur de couche moy.",
    "sv.stat.saglik": "Santé de la défense",
    "sv.stat.derinlikBirim": "couches/menace",

    "sv.katmanlar.baslik": "Quatre couches de défense",
    "sv.katmanlar.aciklama":
      "Chaque couche vise une faiblesse différente. Dans l'ordre : un test de lecture, un piège invisible, l'identité du navigateur et le coût de calcul.",

    "sv.kart.soru": "Question à laquelle elle répond",
    "sv.kart.kapsama": "Couverture dans ce trafic",
    "sv.kart.yakalanan": "Événements attrapés",
    "sv.kart.canli": "En direct & intégré",
    "sv.kart.detay": "Ouvrir le panneau de la couche",
    "sv.kart.atlatma": "Pourquoi elle est difficile à contourner",

    "sv.zorluk.orta": "Moyen",
    "sv.zorluk.yuksek": "Élevé",
    "sv.zorluk.kritik": "Critique",

    "sv.katman.ghost-font.ad": "Ghost-Font",
    "sv.katman.ghost-font.soru": "Est-ce un humain qui lit ?",
    "sv.katman.ghost-font.aciklama":
      "Affiche un code dans une police à points mobiles (tramage temporel). L'œil humain le lit clairement ; un bot de capture d'écran et l'OCR ne voient que du bruit dans chaque image.",
    "sv.katman.ghost-font.atlatma":
      "Il n'y a aucun pixel statique — une seule image capturée est illisible. Contourner cela exige une perception visuelle en temps réel, semblable à l'humain, ce qui rend l'automatisation non rentable.",

    "sv.katman.honeypot.ad": "Honeypot",
    "sv.katman.honeypot.soru": "Est-il tombé dans le piège invisible ?",
    "sv.katman.honeypot.aciklama":
      "Place dans le formulaire des champs leurres invisibles aux humains. Un vrai utilisateur ne les voit jamais et les laisse vides ; un bot qui remplit le formulaire à l'aveugle y tombe.",
    "sv.katman.honeypot.atlatma":
      "Le bot devrait savoir avec quelle règle remplir chaque champ ; distinguer les champs leurres des vrais exige d'interpréter le DOM comme un humain. Le taux de faux positifs est ~nul.",

    "sv.katman.tutarlilik.ad": "Cohérence du navigateur",
    "sv.katman.tutarlilik.soru": "Êtes-vous le navigateur que vous prétendez être ?",
    "sv.katman.tutarlilik.aciklama":
      "Recoupe l'identité déclarée du client (User-Agent) avec ses véritables empreintes JS/TLS. Attrape un client qui dit \"Chrome\" mais ne se comporte pas comme Chrome.",
    "sv.katman.tutarlilik.atlatma":
      "Un faux convaincant exige que les en-têtes, l'environnement JS, la poignée de main TLS et le comportement concordent tous. Une seule incohérence fait tomber le masque.",

    "sv.katman.pow.ad": "Preuve de travail",
    "sv.katman.pow.soru": "A-t-il payé le coût CPU ?",
    "sv.katman.pow.aciklama":
      "Fait résoudre à une requête suspecte une petite énigme de calcul avant de l'accepter. Un humain attend ~ms une fois ; un bot faisant des millions de requêtes doit résoudre l'énigme des millions de fois.",
    "sv.katman.pow.atlatma":
      "L'énigme ne peut être ignorée, seulement résolue. La difficulté adaptative alourdit le trafic suspect, de sorte que le coût CPU d'une attaque en volume devient économiquement dissuadé.",

    "sv.derinlik.baslik": "Pourquoi quatre couches, pas une ?",
    "sv.derinlik.aciklama":
      "Toute défense unique a toujours un angle mort. Empiler les couches signifie qu'un attaquant doit les vaincre TOUTES LES QUATRE — et chaque couche attrape ce que les autres manquent.",
    "sv.derinlik.nokta1.baslik": "Doit toutes les vaincre",
    "sv.derinlik.nokta1.aciklama":
      "Contourner une couche ne suffit pas. Un bot passé Ghost-Font heurte le honeypot, après cela la cohérence, après cela la preuve de travail.",
    "sv.derinlik.nokta2.baslik": "Les angles morts se chevauchent",
    "sv.derinlik.nokta2.aciklama":
      "Chaque couche examine un signal différent (perception visuelle, comportement DOM, cohérence d'identité, coût de calcul). Ce que l'une manque, une autre le voit.",
    "sv.derinlik.nokta3.baslik": "Le coût passe à l'attaquant",
    "sv.derinlik.nokta3.aciklama":
      "Plus il y a de couches, plus l'automatisation à grande échelle devient exponentiellement coûteuse. Un utilisateur légitime ne ressent aucune friction.",

    "sv.derinlik.olcum":
      "Profondeur de couche : en moyenne combien de couches ont attrapé indépendamment chaque événement malveillant observé. Un nombre plus élevé signifie que les défenses fonctionnent avec chevauchement.",

    "sv.not":
      "Les quatre couches sont RÉELLES et intégrées en direct dans Veylify. Les pourcentages de couverture ci-dessus ne sont pas un vrai compteur d'impacts par couche mais des estimations <b>déduites</b> de vos {n} événements observés (verdict, classe de bot, analyse de cohérence et score) — pas un relevé exact indiquant si une couche a réellement attrapé un événement donné.",
    "sv.notGercek":
      "Les quatre couches sont RÉELLES et intégrées en direct. Les pourcentages de couverture ci-dessus sont désormais comptés à partir des <b>enregistrements réels de déclenchement de couche</b> de vos {n} événements (les couches déclenchées que le flux de vérification écrit sur chaque événement) — pas des estimations inférées.",
  },

  es: {
    "sv.baslik": "Capas de defensa",

    "sv.aciklama":
      "La defensa por capas de Veylify en una sola pantalla. Cuatro capas independientes le hacen a la misma solicitud una pregunta diferente; aunque un bot venza a una, lo atrapan las demás. Abajo verás qué hace cada capa en tu tráfico observado.",

    "sv.stat.toplamOlay": "Eventos totales",
    "sv.stat.yakalanan": "Amenazas atrapadas",
    "sv.stat.derinlik": "Profundidad de capa media",
    "sv.stat.saglik": "Salud de la defensa",
    "sv.stat.derinlikBirim": "capas/amenaza",

    "sv.katmanlar.baslik": "Cuatro capas de defensa",
    "sv.katmanlar.aciklama":
      "Cada capa apunta a una debilidad distinta. En orden: una prueba de lectura, una trampa invisible, la identidad del navegador y el coste de cómputo.",

    "sv.kart.soru": "Pregunta que responde",
    "sv.kart.kapsama": "Cobertura en este tráfico",
    "sv.kart.yakalanan": "Eventos atrapados",
    "sv.kart.canli": "En vivo & integrada",
    "sv.kart.detay": "Abrir panel de la capa",
    "sv.kart.atlatma": "Por qué es difícil de eludir",

    "sv.zorluk.orta": "Media",
    "sv.zorluk.yuksek": "Alta",
    "sv.zorluk.kritik": "Crítica",

    "sv.katman.ghost-font.ad": "Ghost-Font",
    "sv.katman.ghost-font.soru": "¿Está leyendo un humano?",
    "sv.katman.ghost-font.aciklama":
      "Muestra un código en una fuente de puntos en movimiento (tramado temporal). El ojo humano lo lee con claridad; un bot que captura pantalla y el OCR solo ven ruido en cada fotograma.",
    "sv.katman.ghost-font.atlatma":
      "No hay píxeles estáticos: un único fotograma capturado es ilegible. Eludirlo requiere percepción visual en tiempo real, similar a la humana, lo que hace que la automatización no sea rentable.",

    "sv.katman.honeypot.ad": "Honeypot",
    "sv.katman.honeypot.soru": "¿Cayó en la trampa invisible?",
    "sv.katman.honeypot.aciklama":
      "Coloca en el formulario campos señuelo invisibles para los humanos. Un usuario real nunca los ve y los deja vacíos; un bot que rellena el formulario a ciegas cae en ellos.",
    "sv.katman.honeypot.atlatma":
      "El bot tendría que saber con qué regla rellenar cada campo; distinguir los campos señuelo de los reales exige interpretar el DOM como un humano. La tasa de falsos positivos es ~cero.",

    "sv.katman.tutarlilik.ad": "Coherencia del navegador",
    "sv.katman.tutarlilik.soru": "¿Eres el navegador que dices ser?",
    "sv.katman.tutarlilik.aciklama":
      "Contrasta la identidad declarada del cliente (User-Agent) con sus huellas reales de JS/TLS. Atrapa a un cliente que dice \"Chrome\" pero no se comporta como Chrome.",
    "sv.katman.tutarlilik.atlatma":
      "Una falsificación convincente exige que las cabeceras, el entorno JS, el apretón de manos TLS y el comportamiento coincidan todos. Una sola discrepancia deja caer la máscara.",

    "sv.katman.pow.ad": "Prueba de trabajo",
    "sv.katman.pow.soru": "¿Pagó el coste de CPU?",
    "sv.katman.pow.aciklama":
      "Hace que una solicitud sospechosa resuelva un pequeño rompecabezas computacional antes de aceptarla. Un humano espera ~ms una vez; un bot que hace millones de solicitudes debe resolver el rompecabezas millones de veces.",
    "sv.katman.pow.atlatma":
      "El rompecabezas no se puede omitir, solo resolver. La dificultad adaptativa hace más pesado el tráfico sospechoso, de modo que el coste de CPU de un ataque por volumen queda económicamente disuadido.",

    "sv.derinlik.baslik": "¿Por qué cuatro capas y no una?",
    "sv.derinlik.aciklama":
      "Cualquier defensa única siempre tiene un punto ciego. Apilar capas significa que un atacante debe vencer LAS CUATRO — y cada capa atrapa lo que las demás pasan por alto.",
    "sv.derinlik.nokta1.baslik": "Debe vencerlas todas",
    "sv.derinlik.nokta1.aciklama":
      "Eludir una capa no basta. Un bot que pasa Ghost-Font choca con el honeypot, tras eso con la coherencia, tras eso con la prueba de trabajo.",
    "sv.derinlik.nokta2.baslik": "Los puntos ciegos se solapan",
    "sv.derinlik.nokta2.aciklama":
      "Cada capa observa una señal distinta (percepción visual, comportamiento del DOM, coherencia de identidad, coste de cómputo). Lo que una pasa por alto, otra lo ve.",
    "sv.derinlik.nokta3.baslik": "El coste recae en el atacante",
    "sv.derinlik.nokta3.aciklama":
      "Cuantas más capas, más exponencialmente cara se vuelve la automatización a escala. Un usuario legítimo no siente ninguna fricción.",

    "sv.derinlik.olcum":
      "Profundidad de capa: en promedio cuántas capas atraparon de forma independiente cada evento malicioso observado. Un número más alto significa que las defensas trabajan con solapamiento.",

    "sv.not":
      "Las cuatro capas son REALES y están integradas en vivo en Veylify. Los porcentajes de cobertura de arriba no son un contador real de impactos por capa, sino estimaciones <b>inferidas</b> de tus {n} eventos observados (verdicto, clase de bot, análisis de coherencia y puntuación) — no un registro exacto de si una capa atrapó realmente un evento dado.",
    "sv.notGercek":
      "Las cuatro capas son REALES e integradas en vivo. Los porcentajes de cobertura anteriores ahora se cuentan a partir de los <b>registros reales de activación de capa</b> de tus {n} eventos (las capas activadas que el flujo de verificación escribe en cada evento) — no estimaciones inferidas.",
  },
};

/** Yerel çeviri erişimi — bulunamazsa TR'ye, o da yoksa anahtara düşer. */
export function savunmaCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}

/** Dil → BCP-47 yerel etiketi (Intl sayı biçimleme için). */
export const SV_YEREL: Record<Dil, string> = {
  tr: "tr-TR",
  en: "en-US",
  de: "de-DE",
  fr: "fr-FR",
  es: "es-ES",
};
