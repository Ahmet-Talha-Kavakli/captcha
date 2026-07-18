/**
 * ML Açıklanabilirlik Konsolu — YEREL sayfa sözlüğü.
 * ==================================================
 * Bu dosya YALNIZCA /panel/ml-aciklanabilir istemci bileşeninin kullanıcıya görünen
 * KROM/ETİKET metinlerini 5 dile taşır (tr/en/de/fr/es).
 * Paylaşılan `@/lib/i18n/panel` sözlüğüne DOKUNMAZ; sadece `Dil` tipini ondan alır.
 *
 * ÖNEMLİ (enum & lib güvenliği):
 *  - Bot sınıfı DEĞERLERİ (BotClass: human/good_bot/…) filtre/renk mantığını sürer,
 *    çevrilmez. Yalnızca ETİKETLERİ enum→anahtar eşlemesiyle ("sinif.*") çözülür.
 *  - Sınıflandırıcı (classifier.ts) TÜRKÇE özellik adları ("UA imzası" gibi) ve
 *    karşı-olgusal sinyal/değişiklik metinleri üretir. Bunları istemcide Türkçe
 *    kaynak→anahtar eşlemesiyle yeniden çeviririz; lib'e DOKUNMAYIZ.
 *  - Güven yorumu lib'de Türkçe üretilir; istemcide `guven` değerinden yeniden
 *    türetilir (edilmez, sayı VERİdir).
 *  - Sayı, skor, yüzde, olasılık VERİ'dir — çevrilmez.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // Giriş bandı
    "serit.baslik": "Kara kutu değil — her karar açıklanabilir.",
    "serit.aciklama.1": "Veylify'ın bot sınıflandırıcısı softmax bir topluluk modelidir. Aşağıdaki araçla sinyalleri değiştir, modelin",
    "serit.aciklama.vurgu": "her sınıfa verdiği olasılığı",
    "serit.aciklama.2": ", kararı en çok etkileyen özellikleri ve \"hangi tek değişiklik kararı çevirirdi\"yi (karşı-olgusal) canlı gör.",

    // Girdi paneli
    "girdi.baslik": "Girdi sinyalleri",
    "girdi.canli": "canlı",
    "girdi.ua": "User-Agent",
    "girdi.davranisSkoru": "Davranış skoru",
    "girdi.headless": "Headless",
    "girdi.tlsUyumsuz": "TLS uyumsuz",
    "girdi.aiAjan": "AI ajan",
    "girdi.acik": "açık",
    "girdi.kapali": "kapalı",

    // Karar paneli
    "karar.baslik": "Model kararı",
    "karar.tahminiSinif": "tahmini sınıf",
    "karar.guven": "güven",
    "karar.softmax": "Softmax olasılık dağılımı",
    "karar.karsiOlgusal": "karar {yeni}'e dönerdi.",

    // Katkı paneli
    "katki.baslik": "Karara en çok katkı veren özellikler (bu girdi)",

    // Özet kartları
    "ozet.siniflandirilanOlay": "Sınıflandırılan olay",
    "ozet.ortGuven": "Ort. model güveni",
    "ozet.belirsizKarar": "Belirsiz karar",
    "ozet.aktifSinif": "Aktif sınıf",

    // Alt paneller
    "dagilim.baslik": "Gerçek trafik karar dağılımı",
    "ozellik.baslik": "En etkili model özellikleri (tüm kararlar)",
    "ozellik.aciklama": "Sınıflandırıcının kararlarında en sık başrol oynayan sinyaller.",

    // Güven yorumu (guven değerinden türetilir)
    "guvenYorum.yuksek": "Yüksek güven — karar net.",
    "guvenYorum.orta": "Orta güven — ikincil sınıf yakın; ek sinyal yardımcı olur.",
    "guvenYorum.dusuk": "Düşük güven — sınıflar çekişiyor; challenge/doğrulama önerilir.",

    // Bot sınıfı etiketleri (BotClass enum → etiket)
    "sinif.human": "İnsan",
    "sinif.good_bot": "İyi bot",
    "sinif.automation": "Otomasyon",
    "sinif.scraper": "Kazıyıcı",
    "sinif.credential_stuffing": "Kimlik doldurma",
    "sinif.ai_agent": "AI ajan",
    "sinif.ddos": "DDoS",
    "sinif.spam": "Spam",

    // Sınıflandırıcı özellik adları (classifier.ts TR kaynak → çeviri)
    "ozellik.UA imzası": "UA imzası",
    "ozellik.Bilinen AI ajanı": "Bilinen AI ajanı",
    "ozellik.Headless tarayıcı": "Headless tarayıcı",
    "ozellik.TLS/UA uyumsuz": "TLS/UA uyumsuz",
    "ozellik.Header anomalisi": "Header anomalisi",
    "ozellik.İnsansı davranış": "İnsansı davranış",
    "ozellik.Bot-benzeri davranış": "Bot-benzeri davranış",
    "ozellik.Kötü ün IP": "Kötü ün IP",
    "ozellik.Temiz IP": "Temiz IP",
    "ozellik.Aşırı istek hızı (flood)": "Aşırı istek hızı (flood)",
    "ozellik.Yüksek istek hızı": "Yüksek istek hızı",
    "ozellik.Kimlik yolu hedefi": "Kimlik yolu hedefi",
    "ozellik.Kötü IP + kimlik yolu": "Kötü IP + kimlik yolu",
    "ozellik.API/veri yolu hedefi": "API/veri yolu hedefi",
    "ozellik.Kayıt/içerik yolu": "Kayıt/içerik yolu",

    // Karşı-olgusal sinyal adları (classifier.ts TR kaynak → çeviri)
    "sinyal.Headless": "Headless",
    "sinyal.TLS uyumsuz": "TLS uyumsuz",
    "sinyal.TLS": "TLS",
    "sinyal.Davranış skoru": "Davranış skoru",
    "sinyal.AI ajan": "AI ajan",

    // Karşı-olgusal değişiklik ifadeleri (classifier.ts TR kaynak → çeviri)
    "degisiklik.kapalı olsaydı": "kapalı olsaydı",
    "degisiklik.açık olsaydı": "açık olsaydı",
    "degisiklik.uyumlu olsaydı": "uyumlu olsaydı",
    "degisiklik.uyumsuz olsaydı": "uyumsuz olsaydı",
    "degisiklik.yüksek olsaydı": "yüksek olsaydı",
    "degisiklik.düşük olsaydı": "düşük olsaydı",
    "degisiklik.tespit edilseydi": "tespit edilseydi",
  },

  en: {
    "serit.baslik": "Not a black box — every decision is explainable.",
    "serit.aciklama.1": "Veylify's bot classifier is a softmax ensemble model. Use the tool below to change signals and see, live, the",
    "serit.aciklama.vurgu": "probability the model assigns to each class",
    "serit.aciklama.2": ", the features that most influence the decision, and \"which single change would flip the decision\" (counterfactual).",

    "girdi.baslik": "Input signals",
    "girdi.canli": "live",
    "girdi.ua": "User-Agent",
    "girdi.davranisSkoru": "Behavior score",
    "girdi.headless": "Headless",
    "girdi.tlsUyumsuz": "TLS mismatch",
    "girdi.aiAjan": "AI agent",
    "girdi.acik": "on",
    "girdi.kapali": "off",

    "karar.baslik": "Model decision",
    "karar.tahminiSinif": "predicted class",
    "karar.guven": "confidence",
    "karar.softmax": "Softmax probability distribution",
    "karar.karsiOlgusal": "the decision would flip to {yeni}.",

    "katki.baslik": "Features contributing most to the decision (this input)",

    "ozet.siniflandirilanOlay": "Classified events",
    "ozet.ortGuven": "Avg. model confidence",
    "ozet.belirsizKarar": "Uncertain decisions",
    "ozet.aktifSinif": "Active classes",

    "dagilim.baslik": "Real-traffic decision distribution",
    "ozellik.baslik": "Most influential model features (all decisions)",
    "ozellik.aciklama": "The signals that most often take the lead in the classifier's decisions.",

    "guvenYorum.yuksek": "High confidence — the decision is clear.",
    "guvenYorum.orta": "Medium confidence — the runner-up class is close; an extra signal would help.",
    "guvenYorum.dusuk": "Low confidence — the classes are competing; a challenge/verification is advised.",

    "sinif.human": "Human",
    "sinif.good_bot": "Good bot",
    "sinif.automation": "Automation",
    "sinif.scraper": "Scraper",
    "sinif.credential_stuffing": "Credential stuffing",
    "sinif.ai_agent": "AI agent",
    "sinif.ddos": "DDoS",
    "sinif.spam": "Spam",

    "ozellik.UA imzası": "UA signature",
    "ozellik.Bilinen AI ajanı": "Known AI agent",
    "ozellik.Headless tarayıcı": "Headless browser",
    "ozellik.TLS/UA uyumsuz": "TLS/UA mismatch",
    "ozellik.Header anomalisi": "Header anomaly",
    "ozellik.İnsansı davranış": "Human-like behavior",
    "ozellik.Bot-benzeri davranış": "Bot-like behavior",
    "ozellik.Kötü ün IP": "Bad-reputation IP",
    "ozellik.Temiz IP": "Clean IP",
    "ozellik.Aşırı istek hızı (flood)": "Excessive request rate (flood)",
    "ozellik.Yüksek istek hızı": "High request rate",
    "ozellik.Kimlik yolu hedefi": "Auth path target",
    "ozellik.Kötü IP + kimlik yolu": "Bad IP + auth path",
    "ozellik.API/veri yolu hedefi": "API/data path target",
    "ozellik.Kayıt/içerik yolu": "Signup/content path",

    "sinyal.Headless": "Headless",
    "sinyal.TLS uyumsuz": "TLS mismatch",
    "sinyal.TLS": "TLS",
    "sinyal.Davranış skoru": "Behavior score",
    "sinyal.AI ajan": "AI agent",

    "degisiklik.kapalı olsaydı": "were off",
    "degisiklik.açık olsaydı": "were on",
    "degisiklik.uyumlu olsaydı": "were consistent",
    "degisiklik.uyumsuz olsaydı": "were mismatched",
    "degisiklik.yüksek olsaydı": "were high",
    "degisiklik.düşük olsaydı": "were low",
    "degisiklik.tespit edilseydi": "were detected",
  },

  de: {
    "serit.baslik": "Keine Black Box — jede Entscheidung ist erklärbar.",
    "serit.aciklama.1": "Der Bot-Klassifikator von Veylify ist ein Softmax-Ensemble-Modell. Ändern Sie mit dem Werkzeug unten die Signale und sehen Sie live",
    "serit.aciklama.vurgu": "die Wahrscheinlichkeit, die das Modell jeder Klasse zuweist",
    "serit.aciklama.2": ", die Merkmale mit dem größten Einfluss auf die Entscheidung und \"welche einzelne Änderung die Entscheidung umkehren würde\" (kontrafaktisch).",

    "girdi.baslik": "Eingangssignale",
    "girdi.canli": "live",
    "girdi.ua": "User-Agent",
    "girdi.davranisSkoru": "Verhaltensscore",
    "girdi.headless": "Headless",
    "girdi.tlsUyumsuz": "TLS-Diskrepanz",
    "girdi.aiAjan": "KI-Agent",
    "girdi.acik": "an",
    "girdi.kapali": "aus",

    "karar.baslik": "Modellentscheidung",
    "karar.tahminiSinif": "vorhergesagte Klasse",
    "karar.guven": "Konfidenz",
    "karar.softmax": "Softmax-Wahrscheinlichkeitsverteilung",
    "karar.karsiOlgusal": "die Entscheidung würde zu {yeni} kippen.",

    "katki.baslik": "Merkmale mit dem größten Beitrag zur Entscheidung (diese Eingabe)",

    "ozet.siniflandirilanOlay": "Klassifizierte Ereignisse",
    "ozet.ortGuven": "Ø Modellkonfidenz",
    "ozet.belirsizKarar": "Unsichere Entscheidungen",
    "ozet.aktifSinif": "Aktive Klassen",

    "dagilim.baslik": "Entscheidungsverteilung im Echtverkehr",
    "ozellik.baslik": "Einflussreichste Modellmerkmale (alle Entscheidungen)",
    "ozellik.aciklama": "Die Signale, die in den Entscheidungen des Klassifikators am häufigsten die Hauptrolle spielen.",

    "guvenYorum.yuksek": "Hohe Konfidenz — die Entscheidung ist eindeutig.",
    "guvenYorum.orta": "Mittlere Konfidenz — die zweitplatzierte Klasse liegt nah; ein zusätzliches Signal hilft.",
    "guvenYorum.dusuk": "Niedrige Konfidenz — die Klassen konkurrieren; eine Challenge/Verifizierung wird empfohlen.",

    "sinif.human": "Mensch",
    "sinif.good_bot": "Guter Bot",
    "sinif.automation": "Automatisierung",
    "sinif.scraper": "Scraper",
    "sinif.credential_stuffing": "Credential Stuffing",
    "sinif.ai_agent": "KI-Agent",
    "sinif.ddos": "DDoS",
    "sinif.spam": "Spam",

    "ozellik.UA imzası": "UA-Signatur",
    "ozellik.Bilinen AI ajanı": "Bekannter KI-Agent",
    "ozellik.Headless tarayıcı": "Headless-Browser",
    "ozellik.TLS/UA uyumsuz": "TLS/UA-Diskrepanz",
    "ozellik.Header anomalisi": "Header-Anomalie",
    "ozellik.İnsansı davranış": "Menschenähnliches Verhalten",
    "ozellik.Bot-benzeri davranış": "Bot-ähnliches Verhalten",
    "ozellik.Kötü ün IP": "IP mit schlechtem Ruf",
    "ozellik.Temiz IP": "Saubere IP",
    "ozellik.Aşırı istek hızı (flood)": "Übermäßige Anfragerate (Flood)",
    "ozellik.Yüksek istek hızı": "Hohe Anfragerate",
    "ozellik.Kimlik yolu hedefi": "Auth-Pfad-Ziel",
    "ozellik.Kötü IP + kimlik yolu": "Schlechte IP + Auth-Pfad",
    "ozellik.API/veri yolu hedefi": "API-/Datenpfad-Ziel",
    "ozellik.Kayıt/içerik yolu": "Registrierungs-/Inhaltspfad",

    "sinyal.Headless": "Headless",
    "sinyal.TLS uyumsuz": "TLS-Diskrepanz",
    "sinyal.TLS": "TLS",
    "sinyal.Davranış skoru": "Verhaltensscore",
    "sinyal.AI ajan": "KI-Agent",

    "degisiklik.kapalı olsaydı": "aus wäre",
    "degisiklik.açık olsaydı": "an wäre",
    "degisiklik.uyumlu olsaydı": "konsistent wäre",
    "degisiklik.uyumsuz olsaydı": "abweichend wäre",
    "degisiklik.yüksek olsaydı": "hoch wäre",
    "degisiklik.düşük olsaydı": "niedrig wäre",
    "degisiklik.tespit edilseydi": "erkannt würde",
  },

  fr: {
    "serit.baslik": "Pas une boîte noire — chaque décision est explicable.",
    "serit.aciklama.1": "Le classificateur de bots de Veylify est un modèle d'ensemble softmax. Avec l'outil ci-dessous, modifiez les signaux et voyez en direct",
    "serit.aciklama.vurgu": "la probabilité que le modèle attribue à chaque classe",
    "serit.aciklama.2": ", les caractéristiques qui influencent le plus la décision et \"quel seul changement inverserait la décision\" (contrefactuel).",

    "girdi.baslik": "Signaux d'entrée",
    "girdi.canli": "en direct",
    "girdi.ua": "User-Agent",
    "girdi.davranisSkoru": "Score de comportement",
    "girdi.headless": "Headless",
    "girdi.tlsUyumsuz": "Incohérence TLS",
    "girdi.aiAjan": "Agent IA",
    "girdi.acik": "activé",
    "girdi.kapali": "désactivé",

    "karar.baslik": "Décision du modèle",
    "karar.tahminiSinif": "classe prédite",
    "karar.guven": "confiance",
    "karar.softmax": "Distribution de probabilité softmax",
    "karar.karsiOlgusal": "la décision basculerait vers {yeni}.",

    "katki.baslik": "Caractéristiques contribuant le plus à la décision (cette entrée)",

    "ozet.siniflandirilanOlay": "Événements classés",
    "ozet.ortGuven": "Confiance moy. du modèle",
    "ozet.belirsizKarar": "Décisions incertaines",
    "ozet.aktifSinif": "Classes actives",

    "dagilim.baslik": "Distribution des décisions sur le trafic réel",
    "ozellik.baslik": "Caractéristiques du modèle les plus influentes (toutes décisions)",
    "ozellik.aciklama": "Les signaux qui jouent le plus souvent un rôle de premier plan dans les décisions du classificateur.",

    "guvenYorum.yuksek": "Confiance élevée — la décision est nette.",
    "guvenYorum.orta": "Confiance moyenne — la classe suivante est proche ; un signal supplémentaire aiderait.",
    "guvenYorum.dusuk": "Confiance faible — les classes s'affrontent ; un challenge/une vérification est recommandé.",

    "sinif.human": "Humain",
    "sinif.good_bot": "Bon bot",
    "sinif.automation": "Automatisation",
    "sinif.scraper": "Scraper",
    "sinif.credential_stuffing": "Bourrage d'identifiants",
    "sinif.ai_agent": "Agent IA",
    "sinif.ddos": "DDoS",
    "sinif.spam": "Spam",

    "ozellik.UA imzası": "Signature UA",
    "ozellik.Bilinen AI ajanı": "Agent IA connu",
    "ozellik.Headless tarayıcı": "Navigateur headless",
    "ozellik.TLS/UA uyumsuz": "Incohérence TLS/UA",
    "ozellik.Header anomalisi": "Anomalie d'en-tête",
    "ozellik.İnsansı davranış": "Comportement humain",
    "ozellik.Bot-benzeri davranış": "Comportement de bot",
    "ozellik.Kötü ün IP": "IP à mauvaise réputation",
    "ozellik.Temiz IP": "IP propre",
    "ozellik.Aşırı istek hızı (flood)": "Débit de requêtes excessif (flood)",
    "ozellik.Yüksek istek hızı": "Débit de requêtes élevé",
    "ozellik.Kimlik yolu hedefi": "Cible chemin d'authentification",
    "ozellik.Kötü IP + kimlik yolu": "Mauvaise IP + chemin d'authentification",
    "ozellik.API/veri yolu hedefi": "Cible chemin API/données",
    "ozellik.Kayıt/içerik yolu": "Chemin d'inscription/contenu",

    "sinyal.Headless": "Headless",
    "sinyal.TLS uyumsuz": "Incohérence TLS",
    "sinyal.TLS": "TLS",
    "sinyal.Davranış skoru": "Score de comportement",
    "sinyal.AI ajan": "Agent IA",

    "degisiklik.kapalı olsaydı": "était désactivé",
    "degisiklik.açık olsaydı": "était activé",
    "degisiklik.uyumlu olsaydı": "était cohérent",
    "degisiklik.uyumsuz olsaydı": "était incohérent",
    "degisiklik.yüksek olsaydı": "était élevé",
    "degisiklik.düşük olsaydı": "était faible",
    "degisiklik.tespit edilseydi": "était détecté",
  },

  es: {
    "serit.baslik": "No es una caja negra — cada decisión es explicable.",
    "serit.aciklama.1": "El clasificador de bots de Veylify es un modelo de conjunto softmax. Con la herramienta de abajo cambia las señales y observa en vivo",
    "serit.aciklama.vurgu": "la probabilidad que el modelo asigna a cada clase",
    "serit.aciklama.2": ", las características que más influyen en la decisión y \"qué único cambio invertiría la decisión\" (contrafactual).",

    "girdi.baslik": "Señales de entrada",
    "girdi.canli": "en vivo",
    "girdi.ua": "User-Agent",
    "girdi.davranisSkoru": "Puntuación de comportamiento",
    "girdi.headless": "Headless",
    "girdi.tlsUyumsuz": "Incongruencia TLS",
    "girdi.aiAjan": "Agente IA",
    "girdi.acik": "activado",
    "girdi.kapali": "desactivado",

    "karar.baslik": "Decisión del modelo",
    "karar.tahminiSinif": "clase predicha",
    "karar.guven": "confianza",
    "karar.softmax": "Distribución de probabilidad softmax",
    "karar.karsiOlgusal": "la decisión cambiaría a {yeni}.",

    "katki.baslik": "Características que más contribuyen a la decisión (esta entrada)",

    "ozet.siniflandirilanOlay": "Eventos clasificados",
    "ozet.ortGuven": "Confianza media del modelo",
    "ozet.belirsizKarar": "Decisiones inciertas",
    "ozet.aktifSinif": "Clases activas",

    "dagilim.baslik": "Distribución de decisiones en tráfico real",
    "ozellik.baslik": "Características del modelo más influyentes (todas las decisiones)",
    "ozellik.aciklama": "Las señales que con más frecuencia son protagonistas en las decisiones del clasificador.",

    "guvenYorum.yuksek": "Confianza alta — la decisión es clara.",
    "guvenYorum.orta": "Confianza media — la clase siguiente está cerca; una señal adicional ayudaría.",
    "guvenYorum.dusuk": "Confianza baja — las clases compiten; se recomienda un desafío/verificación.",

    "sinif.human": "Humano",
    "sinif.good_bot": "Bot bueno",
    "sinif.automation": "Automatización",
    "sinif.scraper": "Scraper",
    "sinif.credential_stuffing": "Relleno de credenciales",
    "sinif.ai_agent": "Agente de IA",
    "sinif.ddos": "DDoS",
    "sinif.spam": "Spam",

    "ozellik.UA imzası": "Firma de UA",
    "ozellik.Bilinen AI ajanı": "Agente IA conocido",
    "ozellik.Headless tarayıcı": "Navegador headless",
    "ozellik.TLS/UA uyumsuz": "Incongruencia TLS/UA",
    "ozellik.Header anomalisi": "Anomalía de cabecera",
    "ozellik.İnsansı davranış": "Comportamiento humano",
    "ozellik.Bot-benzeri davranış": "Comportamiento de bot",
    "ozellik.Kötü ün IP": "IP de mala reputación",
    "ozellik.Temiz IP": "IP limpia",
    "ozellik.Aşırı istek hızı (flood)": "Tasa de peticiones excesiva (flood)",
    "ozellik.Yüksek istek hızı": "Tasa de peticiones alta",
    "ozellik.Kimlik yolu hedefi": "Objetivo ruta de autenticación",
    "ozellik.Kötü IP + kimlik yolu": "IP mala + ruta de autenticación",
    "ozellik.API/veri yolu hedefi": "Objetivo ruta API/datos",
    "ozellik.Kayıt/içerik yolu": "Ruta de registro/contenido",

    "sinyal.Headless": "Headless",
    "sinyal.TLS uyumsuz": "Incongruencia TLS",
    "sinyal.TLS": "TLS",
    "sinyal.Davranış skoru": "Puntuación de comportamiento",
    "sinyal.AI ajan": "Agente IA",

    "degisiklik.kapalı olsaydı": "estuviera desactivado",
    "degisiklik.açık olsaydı": "estuviera activado",
    "degisiklik.uyumlu olsaydı": "fuera coherente",
    "degisiklik.uyumsuz olsaydı": "fuera incongruente",
    "degisiklik.yüksek olsaydı": "fuera alta",
    "degisiklik.düşük olsaydı": "fuera baja",
    "degisiklik.tespit edilseydi": "fuera detectado",
  },
};

/** Anahtarı verilen dile çevir; yoksa TR'ye, o da yoksa anahtara düşer. */
export function mlCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
