/**
 * İşlem Kanıtı (Proof-of-Work) paneli — YEREL sayfa sözlüğü.
 * =========================================================
 * Bu dosya YALNIZCA /panel/is-kaniti istemci bileşeninin kullanıcıya görünen
 * KROM/ETİKET metinlerini 5 dile taşır (tr/en/de/fr/es). Paylaşılan
 * `@/lib/i18n/panel` sözlüğüne DOKUNMAZ; sadece `Dil` tipini ondan alır.
 *
 * ÖNEMLİ (güvenlik & veri):
 *  - Sayısal değerler (bit, deneme sayısı, ms, CPU-saat, çarpan), yüzde ve
 *    istek sayıları VERİ'dir — çevrilmez, yerele-duyarlı Intl ile biçimlenir.
 *  - Katman anahtarları (insan/supheli/muhtemel_bot/bot) ENUM'dur — asla
 *    çevrilmez; burada katman→çeviri-anahtarı eşlemesiyle etiketlenir
 *    (örn t("pow.katman.bot")).
 *  - `pow.baslik` başlık anahtarı BURADA yereldir (paylaşılan panel.ts'e
 *    dokunmadan) — 5 dilde tutulur.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    "pow.baslik": "İşlem Kanıtı (Proof-of-Work)",

    // Açıklama şeridi
    "pow.serit.baslik": "Hacim saldırısını ekonomik olarak imkânsız kıl.",
    "pow.serit.aciklama":
      "İşlem Kanıtı, isteği kabul etmeden önce istemciye küçük bir <b>hesaplama bulmacası</b> çözdürür. İnsan bir kez ~50-500 ms bekler, fark etmez; milyonlarca istek yapan bot bulmacayı milyonlarca kez çözer → <b>CPU/saat maliyeti patlar</b>. Şüpheli trafik daha ağır bulmaca alır (adaptif zorluk), temiz insan trafiği hafif kalır.",

    // Boş durum
    "pow.bos.baslik": "Zorluk dağılımı için henüz trafik yok",
    "pow.bos.aciklama":
      "Gözlemlenen {n} olayda dağılım hesaplanamadı. Trafik geldikçe her isteğin alacağı bulmaca zorluğu burada belirir.",

    // Özet kartlar
    "pow.kpi.toplamOlay": "Değerlendirilen istek",
    "pow.kpi.supheli": "Ağır bulmaca alan (şüpheli) istek",
    "pow.kpi.ortBit": "Ortalama hedef zorluk (bit)",
    "pow.kpi.toplamMaliyet": "Saldırgana yüklenen CPU-saat",

    // Dağılım paneli
    "pow.dagilim.baslik": "Adaptif zorluk dağılımı",
    "pow.dagilim.aciklama":
      "Her isteğin skoruna göre alacağı hedef bit. Yükseldikçe bulmaca üstel olarak pahalılaşır.",
    "pow.dagilim.olay": "istek",
    "pow.dagilim.bit": "bit hedef",
    "pow.dagilim.saat": "CPU-saat",

    // Katman etiketleri (enum → etiket)
    "pow.katman.insan": "İnsan (temiz)",
    "pow.katman.supheli": "Şüpheli",
    "pow.katman.muhtemel_bot": "Muhtemel bot",
    "pow.katman.bot": "Bot",

    // Adaptif zorluk açıklayıcı
    "pow.adaptif.baslik": "Zorluk skora göre nasıl uyarlanır",
    "pow.adaptif.aciklama":
      "Bot olasılığı = 1 − insanlık skoru. Temiz trafik tabanda kalır; şüphe arttıkça hedef sıfır-bit sayısı yükselir. Her ek bit, bulmaca maliyetini <b>iki katına</b> çıkarır.",
    "pow.adaptif.insanlik": "İnsanlık skoru",
    "pow.adaptif.hedefBit": "Hedef zorluk",
    "pow.adaptif.gecikme": "İnsan gecikmesi",
    "pow.adaptif.botKat": "Bot maliyet katı",

    // Ekonomi simülatörü
    "pow.sim.baslik": "Saldırı ekonomisi simülatörü",
    "pow.sim.aciklama":
      "Saldırı hacmini ve zorluğu seç; İşlem Kanıtı'nın saldırgana yüklediği CPU-saat maliyetini ve caydırıcılık katını gör.",
    "pow.sim.hacim": "Saldırı hacmi (istek)",
    "pow.sim.zorluk": "Bulmaca zorluğu (bit)",
    "pow.sim.insanMaliyet": "Tek insana maliyet",
    "pow.sim.botSaat": "Botun toplam CPU-saati",
    "pow.sim.engel": "Saldırı yavaşlaması",
    "pow.sim.caydiricilik": "Caydırıcılık katı",
    "pow.sim.saniye": "sn",
    "pow.sim.saat": "saat",
    "pow.sim.kat": "kat",
    "pow.sim.sonuc.caydirici":
      "Bu maliyet, hacim saldırısını ekonomik olarak <b>caydırıcı</b> kılar — saldırgan başka hedefe döner.",
    "pow.sim.sonuc.hafif":
      "Bu zorluk hafif; yüksek hacimde saldırgan için hâlâ karşılanabilir maliyet. Şüpheli trafik için zorluğu artırın.",

    // Nasıl çalışır boru hattı
    "pow.nasil.baslik": "İşlem Kanıtı nasıl çalışır",
    "pow.nasil.adim1.ad": "1 · Meydan okuma",
    "pow.nasil.adim1.aciklama": "Sunucu bir hedef zorluk (baştaki sıfır-bit) yayınlar.",
    "pow.nasil.adim2.ad": "2 · Çözüm",
    "pow.nasil.adim2.aciklama": "İstemci, hash'i hedefi karşılayan bir nonce bulana kadar dener (CPU harcar).",
    "pow.nasil.adim3.ad": "3 · Doğrulama",
    "pow.nasil.adim3.aciklama": "Sunucu, hash'in baştaki sıfır bitlerini sayar; yeterliyse isteği kabul eder.",

    // İnsan vs bot kontrastı
    "pow.kontrast.baslik": "İnsana görünmez, bota pahalı",
    "pow.kontrast.insan.baslik": "İnsan",
    "pow.kontrast.insan.aciklama":
      "Bir sayfada tek bir bulmaca, arka planda ~65 ms. Kullanıcı hiçbir şey fark etmez.",
    "pow.kontrast.bot.baslik": "Hacim botu",
    "pow.kontrast.bot.aciklama":
      "Milyonlarca istek × bulmaca başına CPU = saatlerce donanım. Saldırının kâr marjını yok eder.",

    // Dürüstlük notu
    "pow.not":
      "İşlem Kanıtı GERÇEK bir savunma mekanizmasıdır (hashcash/Anubis mantığı): zorluk seçimi ve baştaki-sıfır-bit doğrulaması saf ve deterministiktir. Aşağıdaki CPU-saat ve caydırıcılık rakamları ise {n} gözlemlenen olay ve sektör referans donanım varsayımlarına (~1M hash/sn) dayanan <b>modellenmiş/gösterim amaçlı</b> ekonomik tahminlerdir — kesin ölçüm değildir.",
  },

  en: {
    "pow.baslik": "Proof of Work",

    "pow.serit.baslik": "Make volume attacks economically impossible.",
    "pow.serit.aciklama":
      "Proof of Work forces the client to solve a small <b>computational puzzle</b> before the request is accepted. A human waits ~50-500 ms once and never notices; a bot doing millions of requests solves the puzzle millions of times → its <b>CPU/hour cost explodes</b>. Suspicious traffic gets a harder puzzle (adaptive difficulty), clean human traffic stays light.",

    "pow.bos.baslik": "No traffic yet to compute a difficulty distribution",
    "pow.bos.aciklama":
      "Could not compute a distribution from {n} observed events. As traffic arrives, the puzzle difficulty each request would get appears here.",

    "pow.kpi.toplamOlay": "Requests evaluated",
    "pow.kpi.supheli": "Requests given a harder puzzle (suspicious)",
    "pow.kpi.ortBit": "Average target difficulty (bits)",
    "pow.kpi.toplamMaliyet": "CPU-hours imposed on attacker",

    "pow.dagilim.baslik": "Adaptive difficulty distribution",
    "pow.dagilim.aciklama":
      "The target bits each request gets based on its score. As it rises, the puzzle gets exponentially more expensive.",
    "pow.dagilim.olay": "requests",
    "pow.dagilim.bit": "bit target",
    "pow.dagilim.saat": "CPU-hours",

    "pow.katman.insan": "Human (clean)",
    "pow.katman.supheli": "Suspicious",
    "pow.katman.muhtemel_bot": "Likely bot",
    "pow.katman.bot": "Bot",

    "pow.adaptif.baslik": "How difficulty adapts to score",
    "pow.adaptif.aciklama":
      "Bot probability = 1 − humanity score. Clean traffic stays at the base; as suspicion rises the target leading-zero-bit count grows. Each extra bit <b>doubles</b> the puzzle cost.",
    "pow.adaptif.insanlik": "Humanity score",
    "pow.adaptif.hedefBit": "Target difficulty",
    "pow.adaptif.gecikme": "Human delay",
    "pow.adaptif.botKat": "Bot cost multiplier",

    "pow.sim.baslik": "Attack economics simulator",
    "pow.sim.aciklama":
      "Pick an attack volume and difficulty; see the CPU-hours Proof of Work imposes on the attacker and the deterrence multiplier.",
    "pow.sim.hacim": "Attack volume (requests)",
    "pow.sim.zorluk": "Puzzle difficulty (bits)",
    "pow.sim.insanMaliyet": "Cost to a single human",
    "pow.sim.botSaat": "Attacker's total CPU-hours",
    "pow.sim.engel": "Attack slowdown",
    "pow.sim.caydiricilik": "Deterrence multiplier",
    "pow.sim.saniye": "s",
    "pow.sim.saat": "h",
    "pow.sim.kat": "×",
    "pow.sim.sonuc.caydirici":
      "This cost makes the volume attack economically <b>deterred</b> — the attacker moves to another target.",
    "pow.sim.sonuc.hafif":
      "This difficulty is light; at high volume it is still affordable for the attacker. Raise the difficulty for suspicious traffic.",

    "pow.nasil.baslik": "How Proof of Work works",
    "pow.nasil.adim1.ad": "1 · Challenge",
    "pow.nasil.adim1.aciklama": "The server issues a target difficulty (leading zero bits).",
    "pow.nasil.adim2.ad": "2 · Solve",
    "pow.nasil.adim2.aciklama": "The client tries nonces until its hash meets the target (spends CPU).",
    "pow.nasil.adim3.ad": "3 · Verify",
    "pow.nasil.adim3.aciklama": "The server counts the hash's leading zero bits; if enough, the request is accepted.",

    "pow.kontrast.baslik": "Invisible to humans, expensive for bots",
    "pow.kontrast.insan.baslik": "Human",
    "pow.kontrast.insan.aciklama":
      "One puzzle per page, ~65 ms in the background. The user notices nothing.",
    "pow.kontrast.bot.baslik": "Volume bot",
    "pow.kontrast.bot.aciklama":
      "Millions of requests × CPU per puzzle = hours of hardware. It wipes out the attack's profit margin.",

    "pow.not":
      "Proof of Work is a REAL defense mechanism (hashcash/Anubis style): difficulty selection and leading-zero-bit verification are pure and deterministic. The CPU-hours and deterrence numbers below are <b>modeled/demonstrative</b> economic estimates based on {n} observed events and industry reference hardware assumptions (~1M hashes/s) — not exact measurements.",
  },

  de: {
    "pow.baslik": "Arbeitsnachweis",

    "pow.serit.baslik": "Mach Volumenangriffe wirtschaftlich unmöglich.",
    "pow.serit.aciklama":
      "Der Arbeitsnachweis zwingt den Client, vor der Annahme der Anfrage ein kleines <b>Rechenrätsel</b> zu lösen. Ein Mensch wartet einmal ~50-500 ms und merkt nichts; ein Bot mit Millionen Anfragen löst das Rätsel millionenfach → seine <b>CPU-/Stundenkosten explodieren</b>. Verdächtiger Verkehr erhält ein schwereres Rätsel (adaptive Schwierigkeit), sauberer menschlicher Verkehr bleibt leicht.",

    "pow.bos.baslik": "Noch kein Verkehr für eine Schwierigkeitsverteilung",
    "pow.bos.aciklama":
      "Aus {n} beobachteten Ereignissen konnte keine Verteilung berechnet werden. Sobald Verkehr eintrifft, erscheint hier die Rätselschwierigkeit jeder Anfrage.",

    "pow.kpi.toplamOlay": "Bewertete Anfragen",
    "pow.kpi.supheli": "Anfragen mit schwererem Rätsel (verdächtig)",
    "pow.kpi.ortBit": "Durchschnittliche Zielschwierigkeit (Bit)",
    "pow.kpi.toplamMaliyet": "Dem Angreifer auferlegte CPU-Stunden",

    "pow.dagilim.baslik": "Adaptive Schwierigkeitsverteilung",
    "pow.dagilim.aciklama":
      "Die Ziel-Bits, die jede Anfrage anhand ihres Scores erhält. Je höher, desto exponentiell teurer das Rätsel.",
    "pow.dagilim.olay": "Anfragen",
    "pow.dagilim.bit": "Bit-Ziel",
    "pow.dagilim.saat": "CPU-Stunden",

    "pow.katman.insan": "Mensch (sauber)",
    "pow.katman.supheli": "Verdächtig",
    "pow.katman.muhtemel_bot": "Wahrscheinlich Bot",
    "pow.katman.bot": "Bot",

    "pow.adaptif.baslik": "Wie sich die Schwierigkeit an den Score anpasst",
    "pow.adaptif.aciklama":
      "Bot-Wahrscheinlichkeit = 1 − Menschlichkeits-Score. Sauberer Verkehr bleibt an der Basis; mit steigendem Verdacht wächst die Anzahl der führenden Null-Bits. Jedes zusätzliche Bit <b>verdoppelt</b> die Rätselkosten.",
    "pow.adaptif.insanlik": "Menschlichkeits-Score",
    "pow.adaptif.hedefBit": "Zielschwierigkeit",
    "pow.adaptif.gecikme": "Menschliche Verzögerung",
    "pow.adaptif.botKat": "Bot-Kostenmultiplikator",

    "pow.sim.baslik": "Angriffsökonomie-Simulator",
    "pow.sim.aciklama":
      "Wähle Angriffsvolumen und Schwierigkeit; sieh die CPU-Stunden, die der Arbeitsnachweis dem Angreifer auferlegt, und den Abschreckungsmultiplikator.",
    "pow.sim.hacim": "Angriffsvolumen (Anfragen)",
    "pow.sim.zorluk": "Rätselschwierigkeit (Bit)",
    "pow.sim.insanMaliyet": "Kosten für einen einzelnen Menschen",
    "pow.sim.botSaat": "Gesamt-CPU-Stunden des Angreifers",
    "pow.sim.engel": "Angriffsverlangsamung",
    "pow.sim.caydiricilik": "Abschreckungsmultiplikator",
    "pow.sim.saniye": "s",
    "pow.sim.saat": "Std",
    "pow.sim.kat": "×",
    "pow.sim.sonuc.caydirici":
      "Diese Kosten machen den Volumenangriff wirtschaftlich <b>abgeschreckt</b> — der Angreifer wechselt zu einem anderen Ziel.",
    "pow.sim.sonuc.hafif":
      "Diese Schwierigkeit ist gering; bei hohem Volumen bleibt sie für den Angreifer erschwinglich. Erhöhe die Schwierigkeit für verdächtigen Verkehr.",

    "pow.nasil.baslik": "Wie der Arbeitsnachweis funktioniert",
    "pow.nasil.adim1.ad": "1 · Herausforderung",
    "pow.nasil.adim1.aciklama": "Der Server gibt eine Zielschwierigkeit aus (führende Null-Bits).",
    "pow.nasil.adim2.ad": "2 · Lösen",
    "pow.nasil.adim2.aciklama": "Der Client probiert Nonces, bis sein Hash das Ziel erfüllt (verbraucht CPU).",
    "pow.nasil.adim3.ad": "3 · Prüfen",
    "pow.nasil.adim3.aciklama": "Der Server zählt die führenden Null-Bits des Hash; reichen sie, wird die Anfrage akzeptiert.",

    "pow.kontrast.baslik": "Für Menschen unsichtbar, für Bots teuer",
    "pow.kontrast.insan.baslik": "Mensch",
    "pow.kontrast.insan.aciklama":
      "Ein Rätsel pro Seite, ~65 ms im Hintergrund. Der Nutzer bemerkt nichts.",
    "pow.kontrast.bot.baslik": "Volumen-Bot",
    "pow.kontrast.bot.aciklama":
      "Millionen Anfragen × CPU pro Rätsel = Stunden an Hardware. Es vernichtet die Gewinnmarge des Angriffs.",

    "pow.not":
      "Der Arbeitsnachweis ist ein ECHTER Verteidigungsmechanismus (hashcash/Anubis-Art): Schwierigkeitswahl und Verifikation der führenden Null-Bits sind rein und deterministisch. Die CPU-Stunden- und Abschreckungszahlen unten sind <b>modellierte/demonstrative</b> wirtschaftliche Schätzungen auf Basis von {n} beobachteten Ereignissen und Referenz-Hardware-Annahmen (~1 Mio. Hashes/s) — keine exakten Messungen.",
  },

  fr: {
    "pow.baslik": "Preuve de travail",

    "pow.serit.baslik": "Rendez les attaques en volume économiquement impossibles.",
    "pow.serit.aciklama":
      "La preuve de travail force le client à résoudre une petite <b>énigme de calcul</b> avant que la requête soit acceptée. Un humain attend ~50-500 ms une fois et ne remarque rien ; un bot faisant des millions de requêtes résout l'énigme des millions de fois → son <b>coût CPU/heure explose</b>. Le trafic suspect reçoit une énigme plus difficile (difficulté adaptative), le trafic humain propre reste léger.",

    "pow.bos.baslik": "Pas encore de trafic pour calculer une distribution de difficulté",
    "pow.bos.aciklama":
      "Impossible de calculer une distribution à partir de {n} événements observés. À mesure que le trafic arrive, la difficulté d'énigme de chaque requête apparaît ici.",

    "pow.kpi.toplamOlay": "Requêtes évaluées",
    "pow.kpi.supheli": "Requêtes recevant une énigme plus difficile (suspectes)",
    "pow.kpi.ortBit": "Difficulté cible moyenne (bits)",
    "pow.kpi.toplamMaliyet": "Heures-CPU imposées à l'attaquant",

    "pow.dagilim.baslik": "Distribution de difficulté adaptative",
    "pow.dagilim.aciklama":
      "Les bits cibles que chaque requête reçoit selon son score. Plus il monte, plus l'énigme devient exponentiellement coûteuse.",
    "pow.dagilim.olay": "requêtes",
    "pow.dagilim.bit": "bits cible",
    "pow.dagilim.saat": "heures-CPU",

    "pow.katman.insan": "Humain (propre)",
    "pow.katman.supheli": "Suspect",
    "pow.katman.muhtemel_bot": "Bot probable",
    "pow.katman.bot": "Bot",

    "pow.adaptif.baslik": "Comment la difficulté s'adapte au score",
    "pow.adaptif.aciklama":
      "Probabilité de bot = 1 − score d'humanité. Le trafic propre reste à la base ; à mesure que le soupçon augmente, le nombre de bits de zéro en tête croît. Chaque bit supplémentaire <b>double</b> le coût de l'énigme.",
    "pow.adaptif.insanlik": "Score d'humanité",
    "pow.adaptif.hedefBit": "Difficulté cible",
    "pow.adaptif.gecikme": "Délai humain",
    "pow.adaptif.botKat": "Multiplicateur de coût du bot",

    "pow.sim.baslik": "Simulateur d'économie d'attaque",
    "pow.sim.aciklama":
      "Choisissez un volume d'attaque et une difficulté ; voyez les heures-CPU que la preuve de travail impose à l'attaquant et le multiplicateur de dissuasion.",
    "pow.sim.hacim": "Volume d'attaque (requêtes)",
    "pow.sim.zorluk": "Difficulté de l'énigme (bits)",
    "pow.sim.insanMaliyet": "Coût pour un seul humain",
    "pow.sim.botSaat": "Total des heures-CPU de l'attaquant",
    "pow.sim.engel": "Ralentissement de l'attaque",
    "pow.sim.caydiricilik": "Multiplicateur de dissuasion",
    "pow.sim.saniye": "s",
    "pow.sim.saat": "h",
    "pow.sim.kat": "×",
    "pow.sim.sonuc.caydirici":
      "Ce coût rend l'attaque en volume économiquement <b>dissuadée</b> — l'attaquant se tourne vers une autre cible.",
    "pow.sim.sonuc.hafif":
      "Cette difficulté est légère ; à haut volume, elle reste abordable pour l'attaquant. Augmentez la difficulté pour le trafic suspect.",

    "pow.nasil.baslik": "Comment fonctionne la preuve de travail",
    "pow.nasil.adim1.ad": "1 · Défi",
    "pow.nasil.adim1.aciklama": "Le serveur émet une difficulté cible (bits de zéro en tête).",
    "pow.nasil.adim2.ad": "2 · Résolution",
    "pow.nasil.adim2.aciklama": "Le client essaie des nonces jusqu'à ce que son hash atteigne la cible (dépense du CPU).",
    "pow.nasil.adim3.ad": "3 · Vérification",
    "pow.nasil.adim3.aciklama": "Le serveur compte les bits de zéro en tête du hash ; s'ils suffisent, la requête est acceptée.",

    "pow.kontrast.baslik": "Invisible pour les humains, coûteux pour les bots",
    "pow.kontrast.insan.baslik": "Humain",
    "pow.kontrast.insan.aciklama":
      "Une énigme par page, ~65 ms en arrière-plan. L'utilisateur ne remarque rien.",
    "pow.kontrast.bot.baslik": "Bot de volume",
    "pow.kontrast.bot.aciklama":
      "Des millions de requêtes × CPU par énigme = des heures de matériel. Cela anéantit la marge de profit de l'attaque.",

    "pow.not":
      "La preuve de travail est un VRAI mécanisme de défense (style hashcash/Anubis) : le choix de la difficulté et la vérification des bits de zéro en tête sont purs et déterministes. Les chiffres d'heures-CPU et de dissuasion ci-dessous sont des estimations économiques <b>modélisées/démonstratives</b> basées sur {n} événements observés et des hypothèses matérielles de référence (~1 M hashes/s) — pas des mesures exactes.",
  },

  es: {
    "pow.baslik": "Prueba de trabajo",

    "pow.serit.baslik": "Haz que los ataques por volumen sean económicamente imposibles.",
    "pow.serit.aciklama":
      "La prueba de trabajo obliga al cliente a resolver un pequeño <b>rompecabezas computacional</b> antes de aceptar la solicitud. Un humano espera ~50-500 ms una vez y no lo nota; un bot que hace millones de solicitudes resuelve el rompecabezas millones de veces → su <b>coste CPU/hora se dispara</b>. El tráfico sospechoso recibe un rompecabezas más difícil (dificultad adaptativa), el tráfico humano limpio se mantiene ligero.",

    "pow.bos.baslik": "Aún no hay tráfico para calcular una distribución de dificultad",
    "pow.bos.aciklama":
      "No se pudo calcular una distribución a partir de {n} eventos observados. A medida que llegue tráfico, aquí aparecerá la dificultad de rompecabezas que recibiría cada solicitud.",

    "pow.kpi.toplamOlay": "Solicitudes evaluadas",
    "pow.kpi.supheli": "Solicitudes con rompecabezas más difícil (sospechosas)",
    "pow.kpi.ortBit": "Dificultad objetivo media (bits)",
    "pow.kpi.toplamMaliyet": "Horas-CPU impuestas al atacante",

    "pow.dagilim.baslik": "Distribución de dificultad adaptativa",
    "pow.dagilim.aciklama":
      "Los bits objetivo que recibe cada solicitud según su puntuación. Cuanto más sube, más caro se vuelve el rompecabezas exponencialmente.",
    "pow.dagilim.olay": "solicitudes",
    "pow.dagilim.bit": "bits objetivo",
    "pow.dagilim.saat": "horas-CPU",

    "pow.katman.insan": "Humano (limpio)",
    "pow.katman.supheli": "Sospechoso",
    "pow.katman.muhtemel_bot": "Bot probable",
    "pow.katman.bot": "Bot",

    "pow.adaptif.baslik": "Cómo se adapta la dificultad a la puntuación",
    "pow.adaptif.aciklama":
      "Probabilidad de bot = 1 − puntuación de humanidad. El tráfico limpio se mantiene en la base; a medida que aumenta la sospecha, crece el número de bits de cero iniciales. Cada bit adicional <b>duplica</b> el coste del rompecabezas.",
    "pow.adaptif.insanlik": "Puntuación de humanidad",
    "pow.adaptif.hedefBit": "Dificultad objetivo",
    "pow.adaptif.gecikme": "Retraso humano",
    "pow.adaptif.botKat": "Multiplicador de coste del bot",

    "pow.sim.baslik": "Simulador de economía del ataque",
    "pow.sim.aciklama":
      "Elige un volumen de ataque y una dificultad; ve las horas-CPU que la prueba de trabajo impone al atacante y el multiplicador de disuasión.",
    "pow.sim.hacim": "Volumen de ataque (solicitudes)",
    "pow.sim.zorluk": "Dificultad del rompecabezas (bits)",
    "pow.sim.insanMaliyet": "Coste para un solo humano",
    "pow.sim.botSaat": "Horas-CPU totales del atacante",
    "pow.sim.engel": "Ralentización del ataque",
    "pow.sim.caydiricilik": "Multiplicador de disuasión",
    "pow.sim.saniye": "s",
    "pow.sim.saat": "h",
    "pow.sim.kat": "×",
    "pow.sim.sonuc.caydirici":
      "Este coste hace que el ataque por volumen quede económicamente <b>disuadido</b> — el atacante pasa a otro objetivo.",
    "pow.sim.sonuc.hafif":
      "Esta dificultad es ligera; con alto volumen sigue siendo asequible para el atacante. Aumenta la dificultad para el tráfico sospechoso.",

    "pow.nasil.baslik": "Cómo funciona la prueba de trabajo",
    "pow.nasil.adim1.ad": "1 · Desafío",
    "pow.nasil.adim1.aciklama": "El servidor emite una dificultad objetivo (bits de cero iniciales).",
    "pow.nasil.adim2.ad": "2 · Resolución",
    "pow.nasil.adim2.aciklama": "El cliente prueba nonces hasta que su hash cumple el objetivo (gasta CPU).",
    "pow.nasil.adim3.ad": "3 · Verificación",
    "pow.nasil.adim3.aciklama": "El servidor cuenta los bits de cero iniciales del hash; si bastan, la solicitud se acepta.",

    "pow.kontrast.baslik": "Invisible para humanos, caro para bots",
    "pow.kontrast.insan.baslik": "Humano",
    "pow.kontrast.insan.aciklama":
      "Un rompecabezas por página, ~65 ms en segundo plano. El usuario no nota nada.",
    "pow.kontrast.bot.baslik": "Bot de volumen",
    "pow.kontrast.bot.aciklama":
      "Millones de solicitudes × CPU por rompecabezas = horas de hardware. Elimina el margen de beneficio del ataque.",

    "pow.not":
      "La prueba de trabajo es un mecanismo de defensa REAL (estilo hashcash/Anubis): la selección de dificultad y la verificación de bits de cero iniciales son puras y deterministas. Las cifras de horas-CPU y disuasión de abajo son estimaciones económicas <b>modeladas/demostrativas</b> basadas en {n} eventos observados y supuestos de hardware de referencia (~1 M hashes/s) — no mediciones exactas.",
  },
};

/** Yerel çeviri erişimi — bulunamazsa TR'ye, o da yoksa anahtara düşer. */
export function isKanitiCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
