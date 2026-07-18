/**
 * Saldırı Yüzeyi Analizi — yerel i18n sözlüğü.
 * =============================================
 * Yalnızca bu sayfaya özgü metinler. Enum değerleri (kategori/seviye/verdict/
 * botClass) VERİ olarak kalır; UI'da anahtar-bazlı etikete çevrilir
 * (label-map → key-map). Endpoint yolları (/api/products …) ve HTTP method'lar
 * veridir — ÇEVRİLMEZ.
 *
 * ÖNEMLİ: Kategori etiketleri normalde lib'deki kategoriEtiket() ile üretilir;
 * lib DEĞİŞTİRİLMEZ, bu yüzden etiket burada "kategori.<enum>" anahtarından
 * istemcide türetilir.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // açıklama şeridi
    "serit.baslik": "Saldırı yüzeyini endpoint bazında gör.",
    "serit.aciklama.1": "Botlar rastgele gezmez;",
    "serit.aciklama.hedef": "login, admin, /api ve ödeme",
    "serit.aciklama.2":
      "uçlarını hedefler — en yüksek değerli hedefler bunlardır. Her yolun maruziyet skorunu, bot oranını ve saldırgan coğrafyasını incele; en açık uçlara tek tıkla path-tabanlı kural bağla.",

    // özet kartları
    "ozet.izlenen": "İzlenen endpoint",
    "ozet.yuksekRisk": "Yüksek risk endpoint",
    "ozet.enCok": "En çok saldırılan yol",
    "ozet.toplamBot": "Toplam bot isteği",

    // kategori kırılımı
    "kirilim.baslik": "Kategori kırılımı — istek & saldırı dağılımı",
    "kirilim.aciklama":
      "Uçlar hassaslığa göre gruplanır. Kimlik (login/auth) en yüksek değerli hedeftir; bu kategoride yüksek bot oranı acil aksiyon gerektirir.",
    "kirilim.endpoint": "endpoint",
    "kirilim.istek": "istek",
    "kirilim.bot": "%{n} bot",
    "yuzde": "%{n}",

    // kategori etiketleri (enum key-map)
    "kategori.kimlik": "Kimlik",
    "kategori.yonetim": "Yönetim",
    "kategori.odeme": "Ödeme",
    "kategori.api": "API",
    "kategori.icerik": "İçerik",
    "kategori.hepsi": "Tümü",

    // filtre çubuğu
    "filtre.ara": "Endpoint ara… (ör. /login, /api)",
    "filtre.araLabel": "Endpoint ara",
    "filtre.yalnizYuksek": "Yalnız yüksek risk",

    // tablo
    "tablo.baslik": "Saldırı yüzeyi — {n} endpoint",
    "tablo.endpoint": "Endpoint",
    "tablo.maruziyet": "Maruziyet",
    "tablo.toplam": "Toplam",
    "tablo.bot": "Bot",
    "tablo.engel": "Engel",
    "tablo.tekilIp": "Tekil IP",
    "tablo.baskinSinif": "Baskın sınıf",
    "tablo.method": "Method",
    "tablo.bos": "Filtreyle eşleşen endpoint yok.",

    // maruziyet seviye etiketleri (enum key-map)
    "seviye.kritik": "Kritik",
    "seviye.yuksek": "Yüksek",
    "seviye.orta": "Orta",
    "seviye.dusuk": "Düşük",

    // bot sınıfı etiketleri (enum key-map)
    "botclass.human": "İnsan",
    "botclass.good_bot": "İyi bot",
    "botclass.automation": "Otomasyon",
    "botclass.scraper": "Kazıyıcı",
    "botclass.credential_stuffing": "Kimlik denemesi",
    "botclass.ai_agent": "AI ajanı",
    "botclass.ddos": "DDoS",
    "botclass.spam": "Spam",

    // verdict etiketleri (enum key-map)
    "verdict.allowed": "İzin verildi",
    "verdict.blocked": "Engellendi",
    "verdict.challenged": "Doğrulama",
    "verdict.flagged": "İşaretlendi",

    // satır detayı
    "detay.kararKirilim": "Karar kırılımı",
    "detay.enCokSaldiranUlkeler": "En çok saldıran ülkeler",
    "detay.saldiriYok": "Bu uçta bot kaynaklı saldırı gözlenmedi.",
    "detay.ortInsanlik": "Ort. insanlık skoru",
    "detay.ortYanit": "Ort. yanıt süresi",
    "detay.buUcuKoru": "Bu ucu koru",
    "detay.yuksekDegerli":
      "Yüksek değerli hedef. Bu yola sıkı bir kural (doğrulama/engelleme) bağlaman şiddetle önerilir.",
    "detay.pathTabanli":
      "Bu yola path-tabanlı bir kural bağlayarak bot trafiğini doğrulamaya zorla.",
    "detay.kuralOlustur": "Kural oluştur",

    // alt açıklayıcılar
    "ipucu.hedefBaslik": "En yüksek değerli hedefler",
    "ipucu.hedefKimlik": "Kimlik (login/auth)",
    "ipucu.hedefYonetim": "yönetim (admin)",
    "ipucu.hedefApi": "API",
    "ipucu.hedefOdeme": "ödeme",
    "ipucu.hedefMetin.1": "ve",
    "ipucu.hedefMetin.2":
      "uçları saldırganların ilk durağıdır: credential stuffing, yetki-yükseltme, kazıma ve kart-deneme. Bu uçlarda yüksek bot oranı görüyorsan onları daha sıkı kurallarla (zorunlu doğrulama, hız limiti, coğrafi engelleme) koru.",
    "ipucu.skorBaslik": "Maruziyet skoru nasıl hesaplanır?",
    "ipucu.skorMetin.1":
      "Her endpoint için bot oranı, engelleme oranı, istek hacmi ve yolun",
    "ipucu.skorMetin.hassaslik": "hassaslığı",
    "ipucu.skorMetin.2": "(kategori değeri) ağırlıklı birleştirilir (0–100). Yollar gruplanırken query string atılır ve sayısal/UUID ID'ler",
    "ipucu.skorMetin.3": "olarak toplanır — böylece",
    "ipucu.skorMetin.ve": "ve",
    "ipucu.skorMetin.4": "aynı endpoint olarak görünür ve saldırı tek sıcak-noktada birikir.",
  },

  en: {
    "serit.baslik": "See your attack surface endpoint by endpoint.",
    "serit.aciklama.1": "Bots don't roam at random; they target",
    "serit.aciklama.hedef": "login, admin, /api and payment",
    "serit.aciklama.2":
      "endpoints — these are the highest-value targets. Inspect each path's exposure score, bot ratio and attacker geography; bind a path-based rule to the most exposed endpoints in one click.",

    "ozet.izlenen": "Monitored endpoints",
    "ozet.yuksekRisk": "High-risk endpoints",
    "ozet.enCok": "Most-attacked path",
    "ozet.toplamBot": "Total bot requests",

    "kirilim.baslik": "Category breakdown — request & attack distribution",
    "kirilim.aciklama":
      "Endpoints are grouped by sensitivity. Identity (login/auth) is the highest-value target; a high bot ratio in this category demands immediate action.",
    "kirilim.endpoint": "endpoints",
    "kirilim.istek": "requests",
    "kirilim.bot": "{n}% bot",
    "yuzde": "{n}%",

    "kategori.kimlik": "Identity",
    "kategori.yonetim": "Admin",
    "kategori.odeme": "Payment",
    "kategori.api": "API",
    "kategori.icerik": "Content",
    "kategori.hepsi": "All",

    "filtre.ara": "Search endpoints… (e.g. /login, /api)",
    "filtre.araLabel": "Search endpoints",
    "filtre.yalnizYuksek": "High risk only",

    "tablo.baslik": "Attack surface — {n} endpoints",
    "tablo.endpoint": "Endpoint",
    "tablo.maruziyet": "Exposure",
    "tablo.toplam": "Total",
    "tablo.bot": "Bot",
    "tablo.engel": "Blocked",
    "tablo.tekilIp": "Unique IP",
    "tablo.baskinSinif": "Dominant class",
    "tablo.method": "Method",
    "tablo.bos": "No endpoint matches the filter.",

    "seviye.kritik": "Critical",
    "seviye.yuksek": "High",
    "seviye.orta": "Medium",
    "seviye.dusuk": "Low",

    "botclass.human": "Human",
    "botclass.good_bot": "Good bot",
    "botclass.automation": "Automation",
    "botclass.scraper": "Scraper",
    "botclass.credential_stuffing": "Credential stuffing",
    "botclass.ai_agent": "AI agent",
    "botclass.ddos": "DDoS",
    "botclass.spam": "Spam",

    "verdict.allowed": "Allowed",
    "verdict.blocked": "Blocked",
    "verdict.challenged": "Challenged",
    "verdict.flagged": "Flagged",

    "detay.kararKirilim": "Verdict breakdown",
    "detay.enCokSaldiranUlkeler": "Top attacking countries",
    "detay.saldiriYok": "No bot-driven attack observed on this endpoint.",
    "detay.ortInsanlik": "Avg. humanity score",
    "detay.ortYanit": "Avg. response time",
    "detay.buUcuKoru": "Protect this endpoint",
    "detay.yuksekDegerli":
      "High-value target. Binding a strict rule (challenge/block) to this path is strongly recommended.",
    "detay.pathTabanli":
      "Bind a path-based rule to this path to force bot traffic through verification.",
    "detay.kuralOlustur": "Create rule",

    "ipucu.hedefBaslik": "Highest-value targets",
    "ipucu.hedefKimlik": "Identity (login/auth)",
    "ipucu.hedefYonetim": "admin",
    "ipucu.hedefApi": "API",
    "ipucu.hedefOdeme": "payment",
    "ipucu.hedefMetin.1": "and",
    "ipucu.hedefMetin.2":
      "endpoints are attackers' first stop: credential stuffing, privilege escalation, scraping and card testing. If you see a high bot ratio on these endpoints, protect them with stricter rules (mandatory verification, rate limiting, geo-blocking).",
    "ipucu.skorBaslik": "How is the exposure score computed?",
    "ipucu.skorMetin.1":
      "For each endpoint, the bot ratio, block ratio, request volume and the path's",
    "ipucu.skorMetin.hassaslik": "sensitivity",
    "ipucu.skorMetin.2": "(category value) are weighted together (0–100). When grouping paths, the query string is dropped and numeric/UUID IDs are collapsed to",
    "ipucu.skorMetin.3": "— so that",
    "ipucu.skorMetin.ve": "and",
    "ipucu.skorMetin.4": "appear as the same endpoint and the attack piles up in a single hotspot.",
  },

  de: {
    "serit.baslik": "Sieh deine Angriffsfläche Endpunkt für Endpunkt.",
    "serit.aciklama.1": "Bots streifen nicht zufällig umher; sie zielen auf",
    "serit.aciklama.hedef": "Login-, Admin-, /api- und Zahlungs-",
    "serit.aciklama.2":
      "Endpunkte — das sind die wertvollsten Ziele. Untersuche für jeden Pfad den Expositionswert, die Bot-Quote und die Angreifer-Geografie; binde mit einem Klick eine pfadbasierte Regel an die am stärksten exponierten Endpunkte.",

    "ozet.izlenen": "Überwachte Endpunkte",
    "ozet.yuksekRisk": "Hochrisiko-Endpunkte",
    "ozet.enCok": "Am häufigsten angegriffener Pfad",
    "ozet.toplamBot": "Bot-Anfragen gesamt",

    "kirilim.baslik": "Kategorieaufschlüsselung — Anfrage- & Angriffsverteilung",
    "kirilim.aciklama":
      "Endpunkte werden nach Sensibilität gruppiert. Identität (Login/Auth) ist das wertvollste Ziel; eine hohe Bot-Quote in dieser Kategorie erfordert sofortiges Handeln.",
    "kirilim.endpoint": "Endpunkte",
    "kirilim.istek": "Anfragen",
    "kirilim.bot": "{n}% Bots",

    "kategori.kimlik": "Identität",
    "kategori.yonetim": "Verwaltung",
    "kategori.odeme": "Zahlung",
    "kategori.api": "API",
    "kategori.icerik": "Inhalt",
    "kategori.hepsi": "Alle",

    "filtre.ara": "Endpunkte suchen… (z. B. /login, /api)",
    "filtre.araLabel": "Endpunkte suchen",
    "filtre.yalnizYuksek": "Nur hohes Risiko",

    "tablo.baslik": "Angriffsfläche — {n} Endpunkte",
    "tablo.endpoint": "Endpunkt",
    "tablo.maruziyet": "Exposition",
    "tablo.toplam": "Gesamt",
    "tablo.bot": "Bot",
    "tablo.engel": "Blockiert",
    "tablo.tekilIp": "Eindeutige IP",
    "tablo.baskinSinif": "Dominante Klasse",
    "tablo.method": "Methode",
    "tablo.bos": "Kein Endpunkt entspricht dem Filter.",

    "seviye.kritik": "Kritisch",
    "seviye.yuksek": "Hoch",
    "seviye.orta": "Mittel",
    "seviye.dusuk": "Niedrig",

    "botclass.human": "Mensch",
    "botclass.good_bot": "Guter Bot",
    "botclass.automation": "Automatisierung",
    "botclass.scraper": "Scraper",
    "botclass.credential_stuffing": "Credential Stuffing",
    "botclass.ai_agent": "KI-Agent",
    "botclass.ddos": "DDoS",
    "botclass.spam": "Spam",

    "verdict.allowed": "Zugelassen",
    "verdict.blocked": "Blockiert",
    "verdict.challenged": "Herausgefordert",
    "verdict.flagged": "Markiert",

    "detay.kararKirilim": "Urteilsaufschlüsselung",
    "detay.enCokSaldiranUlkeler": "Am häufigsten angreifende Länder",
    "detay.saldiriYok": "An diesem Endpunkt wurde kein botgesteuerter Angriff beobachtet.",
    "detay.ortInsanlik": "Ø Menschlichkeitswert",
    "detay.ortYanit": "Ø Antwortzeit",
    "detay.buUcuKoru": "Diesen Endpunkt schützen",
    "detay.yuksekDegerli":
      "Hochwertiges Ziel. Es wird dringend empfohlen, an diesen Pfad eine strenge Regel (Challenge/Block) zu binden.",
    "detay.pathTabanli":
      "Binde eine pfadbasierte Regel an diesen Pfad, um Bot-Traffic zur Verifizierung zu zwingen.",
    "detay.kuralOlustur": "Regel erstellen",

    "ipucu.hedefBaslik": "Wertvollste Ziele",
    "ipucu.hedefKimlik": "Identität (Login/Auth)",
    "ipucu.hedefYonetim": "Verwaltung (Admin)",
    "ipucu.hedefApi": "API",
    "ipucu.hedefOdeme": "Zahlung",
    "ipucu.hedefMetin.1": "und",
    "ipucu.hedefMetin.2":
      "Endpunkte sind die erste Anlaufstelle für Angreifer: Credential Stuffing, Rechteausweitung, Scraping und Kartentests. Wenn du an diesen Endpunkten eine hohe Bot-Quote siehst, schütze sie mit strengeren Regeln (obligatorische Verifizierung, Ratenbegrenzung, Geoblocking).",
    "ipucu.skorBaslik": "Wie wird der Expositionswert berechnet?",
    "ipucu.skorMetin.1":
      "Für jeden Endpunkt werden Bot-Quote, Blockquote, Anfragevolumen und die",
    "ipucu.skorMetin.hassaslik": "Sensibilität",
    "ipucu.skorMetin.2": "des Pfads (Kategoriewert) gewichtet kombiniert (0–100). Beim Gruppieren der Pfade wird der Query-String verworfen und numerische/UUID-IDs werden zu",
    "ipucu.skorMetin.3": "zusammengefasst — sodass",
    "ipucu.skorMetin.ve": "und",
    "ipucu.skorMetin.4": "als derselbe Endpunkt erscheinen und sich der Angriff an einem einzigen Hotspot sammelt.",
    "yuzde": "{n} %",
  },

  fr: {
    "serit.baslik": "Visualisez votre surface d'attaque endpoint par endpoint.",
    "serit.aciklama.1": "Les bots ne se promènent pas au hasard ; ils ciblent les endpoints",
    "serit.aciklama.hedef": "login, admin, /api et paiement",
    "serit.aciklama.2":
      "— ce sont les cibles de plus grande valeur. Examinez pour chaque chemin le score d'exposition, le taux de bots et la géographie des attaquants ; liez une règle basée sur le chemin aux endpoints les plus exposés en un clic.",

    "ozet.izlenen": "Endpoints surveillés",
    "ozet.yuksekRisk": "Endpoints à haut risque",
    "ozet.enCok": "Chemin le plus attaqué",
    "ozet.toplamBot": "Total des requêtes de bots",

    "kirilim.baslik": "Répartition par catégorie — distribution des requêtes & attaques",
    "kirilim.aciklama":
      "Les endpoints sont regroupés par sensibilité. L'identité (login/auth) est la cible de plus grande valeur ; un taux de bots élevé dans cette catégorie exige une action immédiate.",
    "kirilim.endpoint": "endpoints",
    "kirilim.istek": "requêtes",
    "kirilim.bot": "{n}% bots",

    "kategori.kimlik": "Identité",
    "kategori.yonetim": "Administration",
    "kategori.odeme": "Paiement",
    "kategori.api": "API",
    "kategori.icerik": "Contenu",
    "kategori.hepsi": "Tout",

    "filtre.ara": "Rechercher des endpoints… (ex. /login, /api)",
    "filtre.araLabel": "Rechercher des endpoints",
    "filtre.yalnizYuksek": "Haut risque uniquement",

    "tablo.baslik": "Surface d'attaque — {n} endpoints",
    "tablo.endpoint": "Endpoint",
    "tablo.maruziyet": "Exposition",
    "tablo.toplam": "Total",
    "tablo.bot": "Bot",
    "tablo.engel": "Bloqué",
    "tablo.tekilIp": "IP unique",
    "tablo.baskinSinif": "Classe dominante",
    "tablo.method": "Méthode",
    "tablo.bos": "Aucun endpoint ne correspond au filtre.",

    "seviye.kritik": "Critique",
    "seviye.yuksek": "Élevé",
    "seviye.orta": "Moyen",
    "seviye.dusuk": "Faible",

    "botclass.human": "Humain",
    "botclass.good_bot": "Bon bot",
    "botclass.automation": "Automatisation",
    "botclass.scraper": "Scraper",
    "botclass.credential_stuffing": "Bourrage d'identifiants",
    "botclass.ai_agent": "Agent IA",
    "botclass.ddos": "DDoS",
    "botclass.spam": "Spam",

    "verdict.allowed": "Autorisé",
    "verdict.blocked": "Bloqué",
    "verdict.challenged": "Vérifié",
    "verdict.flagged": "Signalé",

    "detay.kararKirilim": "Répartition des verdicts",
    "detay.enCokSaldiranUlkeler": "Principaux pays attaquants",
    "detay.saldiriYok": "Aucune attaque pilotée par des bots observée sur cet endpoint.",
    "detay.ortInsanlik": "Score d'humanité moyen",
    "detay.ortYanit": "Temps de réponse moyen",
    "detay.buUcuKoru": "Protéger cet endpoint",
    "detay.yuksekDegerli":
      "Cible de grande valeur. Il est fortement recommandé de lier une règle stricte (vérification/blocage) à ce chemin.",
    "detay.pathTabanli":
      "Liez une règle basée sur le chemin à ce chemin pour forcer le trafic de bots à passer par la vérification.",
    "detay.kuralOlustur": "Créer une règle",

    "ipucu.hedefBaslik": "Cibles de plus grande valeur",
    "ipucu.hedefKimlik": "Identité (login/auth)",
    "ipucu.hedefYonetim": "administration (admin)",
    "ipucu.hedefApi": "API",
    "ipucu.hedefOdeme": "paiement",
    "ipucu.hedefMetin.1": "et",
    "ipucu.hedefMetin.2":
      "les endpoints sont le premier arrêt des attaquants : bourrage d'identifiants, élévation de privilèges, scraping et test de cartes. Si vous voyez un taux de bots élevé sur ces endpoints, protégez-les avec des règles plus strictes (vérification obligatoire, limitation de débit, blocage géographique).",
    "ipucu.skorBaslik": "Comment le score d'exposition est-il calculé ?",
    "ipucu.skorMetin.1":
      "Pour chaque endpoint, le taux de bots, le taux de blocage, le volume de requêtes et la",
    "ipucu.skorMetin.hassaslik": "sensibilité",
    "ipucu.skorMetin.2": "du chemin (valeur de catégorie) sont combinés de façon pondérée (0–100). Lors du regroupement des chemins, la chaîne de requête est supprimée et les ID numériques/UUID sont regroupés en",
    "ipucu.skorMetin.3": "— ainsi",
    "ipucu.skorMetin.ve": "et",
    "ipucu.skorMetin.4": "apparaissent comme le même endpoint et l'attaque s'accumule en un seul point chaud.",
    "yuzde": "{n} %",
  },

  es: {
    "serit.baslik": "Observa tu superficie de ataque endpoint por endpoint.",
    "serit.aciklama.1": "Los bots no deambulan al azar; apuntan a los endpoints de",
    "serit.aciklama.hedef": "login, admin, /api y pago",
    "serit.aciklama.2":
      "— son los objetivos de mayor valor. Examina para cada ruta la puntuación de exposición, la proporción de bots y la geografía de los atacantes; vincula una regla basada en ruta a los endpoints más expuestos con un solo clic.",

    "ozet.izlenen": "Endpoints monitorizados",
    "ozet.yuksekRisk": "Endpoints de alto riesgo",
    "ozet.enCok": "Ruta más atacada",
    "ozet.toplamBot": "Total de solicitudes de bots",

    "kirilim.baslik": "Desglose por categoría — distribución de solicitudes y ataques",
    "kirilim.aciklama":
      "Los endpoints se agrupan por sensibilidad. La identidad (login/auth) es el objetivo de mayor valor; una alta proporción de bots en esta categoría exige acción inmediata.",
    "kirilim.endpoint": "endpoints",
    "kirilim.istek": "solicitudes",
    "kirilim.bot": "{n}% bots",

    "kategori.kimlik": "Identidad",
    "kategori.yonetim": "Administración",
    "kategori.odeme": "Pago",
    "kategori.api": "API",
    "kategori.icerik": "Contenido",
    "kategori.hepsi": "Todos",

    "filtre.ara": "Buscar endpoints… (p. ej. /login, /api)",
    "filtre.araLabel": "Buscar endpoints",
    "filtre.yalnizYuksek": "Solo alto riesgo",

    "tablo.baslik": "Superficie de ataque — {n} endpoints",
    "tablo.endpoint": "Endpoint",
    "tablo.maruziyet": "Exposición",
    "tablo.toplam": "Total",
    "tablo.bot": "Bot",
    "tablo.engel": "Bloqueado",
    "tablo.tekilIp": "IP única",
    "tablo.baskinSinif": "Clase dominante",
    "tablo.method": "Método",
    "tablo.bos": "Ningún endpoint coincide con el filtro.",

    "seviye.kritik": "Crítico",
    "seviye.yuksek": "Alto",
    "seviye.orta": "Medio",
    "seviye.dusuk": "Bajo",

    "botclass.human": "Humano",
    "botclass.good_bot": "Bot bueno",
    "botclass.automation": "Automatización",
    "botclass.scraper": "Scraper",
    "botclass.credential_stuffing": "Relleno de credenciales",
    "botclass.ai_agent": "Agente de IA",
    "botclass.ddos": "DDoS",
    "botclass.spam": "Spam",

    "verdict.allowed": "Permitido",
    "verdict.blocked": "Bloqueado",
    "verdict.challenged": "Verificado",
    "verdict.flagged": "Marcado",

    "detay.kararKirilim": "Desglose de veredictos",
    "detay.enCokSaldiranUlkeler": "Países que más atacan",
    "detay.saldiriYok": "No se observó ningún ataque impulsado por bots en este endpoint.",
    "detay.ortInsanlik": "Puntuación de humanidad media",
    "detay.ortYanit": "Tiempo de respuesta medio",
    "detay.buUcuKoru": "Proteger este endpoint",
    "detay.yuksekDegerli":
      "Objetivo de alto valor. Se recomienda encarecidamente vincular una regla estricta (verificación/bloqueo) a esta ruta.",
    "detay.pathTabanli":
      "Vincula una regla basada en ruta a esta ruta para forzar el tráfico de bots a pasar por la verificación.",
    "detay.kuralOlustur": "Crear regla",

    "ipucu.hedefBaslik": "Objetivos de mayor valor",
    "ipucu.hedefKimlik": "Identidad (login/auth)",
    "ipucu.hedefYonetim": "administración (admin)",
    "ipucu.hedefApi": "API",
    "ipucu.hedefOdeme": "pago",
    "ipucu.hedefMetin.1": "y",
    "ipucu.hedefMetin.2":
      "los endpoints son la primera parada de los atacantes: relleno de credenciales, escalada de privilegios, scraping y prueba de tarjetas. Si ves una alta proporción de bots en estos endpoints, protégelos con reglas más estrictas (verificación obligatoria, límite de tasa, bloqueo geográfico).",
    "ipucu.skorBaslik": "¿Cómo se calcula la puntuación de exposición?",
    "ipucu.skorMetin.1":
      "Para cada endpoint, se combinan de forma ponderada la proporción de bots, la proporción de bloqueo, el volumen de solicitudes y la",
    "ipucu.skorMetin.hassaslik": "sensibilidad",
    "ipucu.skorMetin.2": "de la ruta (valor de categoría) (0–100). Al agrupar las rutas, se descarta la cadena de consulta y los ID numéricos/UUID se agrupan en",
    "ipucu.skorMetin.3": "— de modo que",
    "ipucu.skorMetin.ve": "y",
    "ipucu.skorMetin.4": "aparecen como el mismo endpoint y el ataque se acumula en un solo punto caliente.",
    "yuzde": "{n} %",
  },
};

export function saldiriYuzeyiCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}

/** Sayı biçimlemesi için BCP-47 yerel eşlemesi. */
export const YEREL_BCP47: Record<Dil, string> = {
  tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES",
};
