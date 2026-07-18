/**
 * Saldırgan Niyet Sınıflandırma sayfası — yerel çeviri sözlüğü + motor-metni
 * yeniden türetme.
 *
 * Sadece bu sayfaya özgü kullanıcı-görünür metinleri içerir. Paylaşılan
 * `src/lib/i18n/panel.ts` ve motor kütüphanesi
 * `src/lib/specter/niyet-siniflandirma.ts` DEĞİŞTİRİLMEZ. Anahtar bulunamazsa
 * TR'ye, o da yoksa anahtarın kendisine düşer.
 *
 * ENUM & MOTOR-METNİ GÜVENLİĞİ
 * ----------------------------
 * `Motivasyon` enum değerleri (finansal/veri/yikim/kesif/kotuye) ASLA çevrilmez;
 * yalnızca eşleme anahtarı olarak kullanılır. Motorun ürettiği Türkçe metinler:
 *   1. `MOTIVASYON_META[m].ad/.aciklama` → enum-anahtarlı yerel çeviriyle değişir
 *      (niyetMotAd / niyetMotAcik).
 *   2. Kanıt `ad` alanı → sabit Türkçe şablon olduğu için TR-string→anahtar
 *      eşlemesiyle çevrilir (kanitAnahtar), sayısal token'lar korunur.
 *   3. Kanıt `detay` ve genel `gerekce` → içine sayı/yüzde gömülü olduğundan
 *      lib'e dokunmadan, sayı token'ları regex ile çıkarılıp yerel şablona
 *      yeniden yerleştirilerek çevrilir (kanitDetay / niyetGerekce).
 */
import type { Dil } from "@/lib/i18n/panel";
import type { Motivasyon, NiyetKanit, NiyetSonuc } from "@/lib/specter/niyet-siniflandirma";

/* --------------------------------------------------------------- Düz sözlük */

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // Başlık / kırıntı
    "n.baslik": "Saldırgan Niyet & Motivasyon Sınıflandırma",

    // Açıklama şeridi
    "n.serit.baslik": "Botu engellemek yetmez — <b>ne istediğini</b> bil.",
    "n.serit.aciklama":
      "Gözlemlenen davranıştan (hedef yollar, bot sınıfı, hacim, araç imzası, skor) saldırganın <b>motivasyonunu</b> çıkarırız: finansal kazanç, veri hasadı, hizmet yıkımı, keşif/tarama veya kötüye kullanım. Yöntem <b>Bayes-benzeri kanıt birikimi</b> — her gözlem motivasyon olasılıklarını günceller, softmax ile dağılıma dönüşür. Niyet biliniyorsa savunma hedeflenebilir.",

    // Paneller
    "n.genelNiyet": "Genel trafik niyeti",
    "n.siniflandirilan": "Sınıflandırılan saldırgan",
    "n.baskinMot": "Baskın motivasyon",
    "n.dagilimBaslik": "Motivasyon dağılımı (saldırgan başına)",
    "n.dagilimBos": "Sınıflandırılacak saldırgan yok.",
    "n.saldirganBazinda": "Saldırgan bazında niyet ({n})",
    "n.kartBos": "Sınıflandırılacak çok-istekli saldırgan bulunamadı ({n} olay).",
    "n.istek": "{n} istek",

    // Dağılım / güven
    "n.guven": "Güven",
    "n.kanitlar": "Kanıtlar",
    "n.kanitYok": "Ayırt edici kanıt yok.",

    // Yöntem notu
    "n.not":
      "Niyet, <b>gerçek gözlemlenen davranıştan</b> Bayes-benzeri çıkarımdır: her motivasyonun önsel olasılığı, gözlem kanıtlarının log-olabilirlik katkılarıyla güncellenip softmax ile normalize edilir. Motivasyon etiketleri buluşsaldır — kesin atıf değil, davranışsal çıkarımdır. Kanıtlar (hangi gözlem hangi niyeti destekledi) her kartta açıkça listelenir.",

    // Motivasyon adları (enum-anahtarlı)
    "mot.finansal": "Finansal kazanç",
    "mot.veri": "Veri hasadı",
    "mot.yikim": "Hizmet yıkımı",
    "mot.kesif": "Keşif / tarama",
    "mot.kotuye": "Kötüye kullanım",
    // Motivasyon açıklamaları
    "motAcik.finansal": "Hesap ele geçirme, ödeme/kart kötüye kullanımı",
    "motAcik.veri": "İçerik/fiyat kazıma, AI eğitim toplama",
    "motAcik.yikim": "DDoS, kaynak tüketimi, kesinti",
    "motAcik.kesif": "Zafiyet tarama, endpoint numaralandırma",
    "motAcik.kotuye": "Spam, sahte kayıt, içerik enjeksiyonu",

    // Kanıt adları (anahtar → ad)
    "kanit.finYol.ad": "Finansal yol hedefleme",
    "kanit.veriYol.ad": "Veri/API yol hedefleme",
    "kanit.kesifYol.ad": "Hassas/keşif yolları",
    "kanit.kotuyeYol.ad": "Kayıt/form yolları",
    "kanit.cred.ad": "Kimlik-doldurma sınıfı",
    "kanit.scraper.ad": "Kazıyıcı sınıfı",
    "kanit.ddos.ad": "DDoS sınıfı",
    "kanit.aiClass.ad": "AI-ajan sınıfı",
    "kanit.spam.ad": "Spam sınıfı",
    "kanit.hacim.ad": "Yüksek istek hacmi",
    "kanit.aracUA.ad": "Otomasyon aracı UA",
    "kanit.aiUA.ad": "AI tarayıcı UA",
    "kanit.dusukSkor.ad": "Yaygın düşük skor",
    // Kanıt detayları (sayı token'ı {p} yüzde, {n} adet)
    "kanit.finYol.detay": "İsteklerin %{p}'i login/ödeme/hesap yollarına.",
    "kanit.veriYol.detay": "İsteklerin %{p}'i ürün/fiyat/API yollarına.",
    "kanit.kesifYol.detay": "admin/.env/config/backup gibi yollara erişim denemesi (%{p}).",
    "kanit.kotuyeYol.detay": "register/comment/upload yollarına yoğunluk (%{p}).",
    "kanit.cred.detay": "Trafiğin %{p}'i credential_stuffing.",
    "kanit.scraper.detay": "Trafiğin %{p}'i scraper.",
    "kanit.ddos.detay": "Trafiğin %{p}'i ddos.",
    "kanit.aiClass.detay": "Trafiğin %{p}'i ai_agent (eğitim toplama).",
    "kanit.spam.detay": "Trafiğin %{p}'i spam.",
    "kanit.hacim.detay": "{n} istek gözlemlendi — kaynak tüketimi/kaba kuvvet göstergesi.",
    "kanit.aracUA.detay": "İsteklerin %{p}'i script/araç UA (python/curl).",
    "kanit.aiUA.detay": "Bildirilen AI botu UA'ları (gptbot/claudebot vb.).",
    "kanit.dusukSkor.detay": "İsteklerin %{p}'i çok düşük insanlık skoru.",

    // Gerekçe (yeniden türetilmiş)
    "gerekce.bos": "Yeterli ayırt edici davranış kanıtı yok — niyet önsel dağılıma yakın.",
    "gerekce.dolu": "En olası niyet: {mot} (%{p}). Başlıca kanıt: {detay}",
    "gerekce.doluKanitsiz": "En olası niyet: {mot} (%{p}).",
  },

  en: {
    "n.baslik": "Attacker Intent & Motivation Classification",

    "n.serit.baslik": "Blocking the bot isn't enough — know <b>what it wants</b>.",
    "n.serit.aciklama":
      "From observed behavior (target paths, bot class, volume, tool signature, score) we infer the attacker's <b>motivation</b>: financial gain, data harvesting, service disruption, reconnaissance/scanning, or abuse. The method is <b>Bayesian-like evidence accumulation</b> — each observation updates the motivation probabilities, then softmax turns them into a distribution. Once intent is known, defense can be targeted.",

    "n.genelNiyet": "Overall traffic intent",
    "n.siniflandirilan": "Classified attackers",
    "n.baskinMot": "Dominant motivation",
    "n.dagilimBaslik": "Motivation distribution (per attacker)",
    "n.dagilimBos": "No attackers to classify.",
    "n.saldirganBazinda": "Intent by attacker ({n})",
    "n.kartBos": "No multi-request attackers found to classify ({n} events).",
    "n.istek": "{n} requests",

    "n.guven": "Confidence",
    "n.kanitlar": "Evidence",
    "n.kanitYok": "No distinguishing evidence.",

    "n.not":
      "Intent is a Bayesian-like inference from <b>actual observed behavior</b>: each motivation's prior probability is updated by the log-likelihood contributions of observed evidence, then normalized via softmax. Motivation labels are heuristic — behavioral inference, not definitive attribution. The evidence (which observation supported which intent) is listed explicitly on every card.",

    "mot.finansal": "Financial gain",
    "mot.veri": "Data harvesting",
    "mot.yikim": "Service disruption",
    "mot.kesif": "Reconnaissance / scanning",
    "mot.kotuye": "Abuse",
    "motAcik.finansal": "Account takeover, payment/card abuse",
    "motAcik.veri": "Content/price scraping, AI training collection",
    "motAcik.yikim": "DDoS, resource exhaustion, outage",
    "motAcik.kesif": "Vulnerability scanning, endpoint enumeration",
    "motAcik.kotuye": "Spam, fake registration, content injection",

    "kanit.finYol.ad": "Financial path targeting",
    "kanit.veriYol.ad": "Data/API path targeting",
    "kanit.kesifYol.ad": "Sensitive/recon paths",
    "kanit.kotuyeYol.ad": "Registration/form paths",
    "kanit.cred.ad": "Credential-stuffing class",
    "kanit.scraper.ad": "Scraper class",
    "kanit.ddos.ad": "DDoS class",
    "kanit.aiClass.ad": "AI-agent class",
    "kanit.spam.ad": "Spam class",
    "kanit.hacim.ad": "High request volume",
    "kanit.aracUA.ad": "Automation tool UA",
    "kanit.aiUA.ad": "AI crawler UA",
    "kanit.dusukSkor.ad": "Widespread low score",
    "kanit.finYol.detay": "{p}% of requests to login/payment/account paths.",
    "kanit.veriYol.detay": "{p}% of requests to product/price/API paths.",
    "kanit.kesifYol.detay": "Access attempts to paths like admin/.env/config/backup ({p}%).",
    "kanit.kotuyeYol.detay": "Concentration on register/comment/upload paths ({p}%).",
    "kanit.cred.detay": "{p}% of traffic is credential_stuffing.",
    "kanit.scraper.detay": "{p}% of traffic is scraper.",
    "kanit.ddos.detay": "{p}% of traffic is ddos.",
    "kanit.aiClass.detay": "{p}% of traffic is ai_agent (training collection).",
    "kanit.spam.detay": "{p}% of traffic is spam.",
    "kanit.hacim.detay": "{n} requests observed — resource-exhaustion/brute-force indicator.",
    "kanit.aracUA.detay": "{p}% of requests use script/tool UA (python/curl).",
    "kanit.aiUA.detay": "Reported AI bot UAs (gptbot/claudebot etc.).",
    "kanit.dusukSkor.detay": "{p}% of requests have a very low humanity score.",

    "gerekce.bos": "Not enough distinguishing behavioral evidence — intent stays close to the prior.",
    "gerekce.dolu": "Most likely intent: {mot} ({p}%). Primary evidence: {detay}",
    "gerekce.doluKanitsiz": "Most likely intent: {mot} ({p}%).",
  },

  de: {
    "n.baslik": "Angreiferabsicht & Motivationsklassifizierung",

    "n.serit.baslik": "Den Bot zu blockieren reicht nicht — wissen, <b>was er will</b>.",
    "n.serit.aciklama":
      "Aus dem beobachteten Verhalten (Zielpfade, Bot-Klasse, Volumen, Tool-Signatur, Score) leiten wir die <b>Motivation</b> des Angreifers ab: finanzieller Gewinn, Datenernte, Dienstzerstörung, Aufklärung/Scanning oder Missbrauch. Die Methode ist eine <b>Bayes-ähnliche Beweisakkumulation</b> — jede Beobachtung aktualisiert die Motivationswahrscheinlichkeiten, die per Softmax zu einer Verteilung werden. Ist die Absicht bekannt, lässt sich die Verteidigung gezielt ausrichten.",

    "n.genelNiyet": "Gesamtabsicht des Verkehrs",
    "n.siniflandirilan": "Klassifizierte Angreifer",
    "n.baskinMot": "Dominante Motivation",
    "n.dagilimBaslik": "Motivationsverteilung (pro Angreifer)",
    "n.dagilimBos": "Keine Angreifer zu klassifizieren.",
    "n.saldirganBazinda": "Absicht pro Angreifer ({n})",
    "n.kartBos": "Keine Angreifer mit mehreren Anfragen zum Klassifizieren gefunden ({n} Ereignisse).",
    "n.istek": "{n} Anfragen",

    "n.guven": "Konfidenz",
    "n.kanitlar": "Belege",
    "n.kanitYok": "Keine unterscheidenden Belege.",

    "n.not":
      "Die Absicht ist eine Bayes-ähnliche Schlussfolgerung aus <b>tatsächlich beobachtetem Verhalten</b>: Die A-priori-Wahrscheinlichkeit jeder Motivation wird durch die Log-Likelihood-Beiträge der beobachteten Belege aktualisiert und per Softmax normalisiert. Motivationsbezeichnungen sind heuristisch — verhaltensbasierte Schlussfolgerung, keine definitive Zuschreibung. Die Belege (welche Beobachtung welche Absicht stützte) werden auf jeder Karte ausdrücklich aufgelistet.",

    "mot.finansal": "Finanzieller Gewinn",
    "mot.veri": "Datenernte",
    "mot.yikim": "Dienstzerstörung",
    "mot.kesif": "Aufklärung / Scanning",
    "mot.kotuye": "Missbrauch",
    "motAcik.finansal": "Kontoübernahme, Zahlungs-/Kartenmissbrauch",
    "motAcik.veri": "Inhalts-/Preis-Scraping, KI-Trainingssammlung",
    "motAcik.yikim": "DDoS, Ressourcenerschöpfung, Ausfall",
    "motAcik.kesif": "Schwachstellen-Scanning, Endpoint-Enumeration",
    "motAcik.kotuye": "Spam, Fake-Registrierung, Content-Injection",

    "kanit.finYol.ad": "Finanzpfad-Targeting",
    "kanit.veriYol.ad": "Daten-/API-Pfad-Targeting",
    "kanit.kesifYol.ad": "Sensible/Aufklärungspfade",
    "kanit.kotuyeYol.ad": "Registrierungs-/Formularpfade",
    "kanit.cred.ad": "Credential-Stuffing-Klasse",
    "kanit.scraper.ad": "Scraper-Klasse",
    "kanit.ddos.ad": "DDoS-Klasse",
    "kanit.aiClass.ad": "KI-Agent-Klasse",
    "kanit.spam.ad": "Spam-Klasse",
    "kanit.hacim.ad": "Hohes Anfragevolumen",
    "kanit.aracUA.ad": "Automatisierungstool-UA",
    "kanit.aiUA.ad": "KI-Crawler-UA",
    "kanit.dusukSkor.ad": "Weit verbreiteter niedriger Score",
    "kanit.finYol.detay": "{p}% der Anfragen an Login-/Zahlungs-/Kontopfade.",
    "kanit.veriYol.detay": "{p}% der Anfragen an Produkt-/Preis-/API-Pfade.",
    "kanit.kesifYol.detay": "Zugriffsversuche auf Pfade wie admin/.env/config/backup ({p}%).",
    "kanit.kotuyeYol.detay": "Konzentration auf register/comment/upload-Pfade ({p}%).",
    "kanit.cred.detay": "{p}% des Verkehrs ist credential_stuffing.",
    "kanit.scraper.detay": "{p}% des Verkehrs ist scraper.",
    "kanit.ddos.detay": "{p}% des Verkehrs ist ddos.",
    "kanit.aiClass.detay": "{p}% des Verkehrs ist ai_agent (Trainingssammlung).",
    "kanit.spam.detay": "{p}% des Verkehrs ist spam.",
    "kanit.hacim.detay": "{n} Anfragen beobachtet — Indikator für Ressourcenerschöpfung/Brute-Force.",
    "kanit.aracUA.detay": "{p}% der Anfragen nutzen Skript-/Tool-UA (python/curl).",
    "kanit.aiUA.detay": "Gemeldete KI-Bot-UAs (gptbot/claudebot usw.).",
    "kanit.dusukSkor.detay": "{p}% der Anfragen haben einen sehr niedrigen Menschlichkeits-Score.",

    "gerekce.bos": "Nicht genug unterscheidende Verhaltensbelege — die Absicht bleibt nahe dem A-priori.",
    "gerekce.dolu": "Wahrscheinlichste Absicht: {mot} ({p}%). Hauptbeleg: {detay}",
    "gerekce.doluKanitsiz": "Wahrscheinlichste Absicht: {mot} ({p}%).",
  },

  fr: {
    "n.baslik": "Classification de l'intention et de la motivation de l'attaquant",

    "n.serit.baslik": "Bloquer le bot ne suffit pas — sachez <b>ce qu'il veut</b>.",
    "n.serit.aciklama":
      "À partir du comportement observé (chemins ciblés, classe de bot, volume, signature d'outil, score), nous déduisons la <b>motivation</b> de l'attaquant : gain financier, moisson de données, perturbation du service, reconnaissance/balayage ou abus. La méthode est une <b>accumulation de preuves de type bayésien</b> — chaque observation met à jour les probabilités de motivation, puis un softmax les transforme en distribution. Une fois l'intention connue, la défense peut être ciblée.",

    "n.genelNiyet": "Intention globale du trafic",
    "n.siniflandirilan": "Attaquants classés",
    "n.baskinMot": "Motivation dominante",
    "n.dagilimBaslik": "Répartition des motivations (par attaquant)",
    "n.dagilimBos": "Aucun attaquant à classer.",
    "n.saldirganBazinda": "Intention par attaquant ({n})",
    "n.kartBos": "Aucun attaquant à requêtes multiples trouvé à classer ({n} événements).",
    "n.istek": "{n} requêtes",

    "n.guven": "Confiance",
    "n.kanitlar": "Preuves",
    "n.kanitYok": "Aucune preuve distinctive.",

    "n.not":
      "L'intention est une inférence de type bayésien à partir du <b>comportement réellement observé</b> : la probabilité a priori de chaque motivation est mise à jour par les contributions de log-vraisemblance des preuves observées, puis normalisée par softmax. Les étiquettes de motivation sont heuristiques — inférence comportementale, non attribution définitive. Les preuves (quelle observation a soutenu quelle intention) sont listées explicitement sur chaque carte.",

    "mot.finansal": "Gain financier",
    "mot.veri": "Moisson de données",
    "mot.yikim": "Perturbation du service",
    "mot.kesif": "Reconnaissance / balayage",
    "mot.kotuye": "Abus",
    "motAcik.finansal": "Prise de contrôle de compte, abus de paiement/carte",
    "motAcik.veri": "Extraction de contenu/prix, collecte pour entraînement IA",
    "motAcik.yikim": "DDoS, épuisement de ressources, panne",
    "motAcik.kesif": "Analyse de vulnérabilités, énumération d'endpoints",
    "motAcik.kotuye": "Spam, faux enregistrement, injection de contenu",

    "kanit.finYol.ad": "Ciblage de chemins financiers",
    "kanit.veriYol.ad": "Ciblage de chemins données/API",
    "kanit.kesifYol.ad": "Chemins sensibles/de reconnaissance",
    "kanit.kotuyeYol.ad": "Chemins d'enregistrement/formulaire",
    "kanit.cred.ad": "Classe credential-stuffing",
    "kanit.scraper.ad": "Classe scraper",
    "kanit.ddos.ad": "Classe DDoS",
    "kanit.aiClass.ad": "Classe agent-IA",
    "kanit.spam.ad": "Classe spam",
    "kanit.hacim.ad": "Volume de requêtes élevé",
    "kanit.aracUA.ad": "UA d'outil d'automatisation",
    "kanit.aiUA.ad": "UA de crawler IA",
    "kanit.dusukSkor.ad": "Score bas généralisé",
    "kanit.finYol.detay": "{p}% des requêtes vers des chemins login/paiement/compte.",
    "kanit.veriYol.detay": "{p}% des requêtes vers des chemins produit/prix/API.",
    "kanit.kesifYol.detay": "Tentatives d'accès à des chemins comme admin/.env/config/backup ({p}%).",
    "kanit.kotuyeYol.detay": "Concentration sur les chemins register/comment/upload ({p}%).",
    "kanit.cred.detay": "{p}% du trafic est du credential_stuffing.",
    "kanit.scraper.detay": "{p}% du trafic est du scraper.",
    "kanit.ddos.detay": "{p}% du trafic est du ddos.",
    "kanit.aiClass.detay": "{p}% du trafic est ai_agent (collecte d'entraînement).",
    "kanit.spam.detay": "{p}% du trafic est du spam.",
    "kanit.hacim.detay": "{n} requêtes observées — indicateur d'épuisement de ressources/force brute.",
    "kanit.aracUA.detay": "{p}% des requêtes utilisent un UA de script/outil (python/curl).",
    "kanit.aiUA.detay": "UA de bots IA signalés (gptbot/claudebot, etc.).",
    "kanit.dusukSkor.detay": "{p}% des requêtes ont un score d'humanité très bas.",

    "gerekce.bos": "Pas assez de preuves comportementales distinctives — l'intention reste proche de l'a priori.",
    "gerekce.dolu": "Intention la plus probable : {mot} ({p}%). Preuve principale : {detay}",
    "gerekce.doluKanitsiz": "Intention la plus probable : {mot} ({p}%).",
  },

  es: {
    "n.baslik": "Clasificación de intención y motivación del atacante",

    "n.serit.baslik": "Bloquear el bot no basta — conoce <b>lo que quiere</b>.",
    "n.serit.aciklama":
      "A partir del comportamiento observado (rutas objetivo, clase de bot, volumen, firma de herramienta, puntuación) inferimos la <b>motivación</b> del atacante: ganancia financiera, recolección de datos, disrupción del servicio, reconocimiento/escaneo o abuso. El método es una <b>acumulación de evidencia de tipo bayesiano</b> — cada observación actualiza las probabilidades de motivación y luego softmax las convierte en una distribución. Una vez conocida la intención, la defensa puede orientarse.",

    "n.genelNiyet": "Intención global del tráfico",
    "n.siniflandirilan": "Atacantes clasificados",
    "n.baskinMot": "Motivación dominante",
    "n.dagilimBaslik": "Distribución de motivaciones (por atacante)",
    "n.dagilimBos": "No hay atacantes que clasificar.",
    "n.saldirganBazinda": "Intención por atacante ({n})",
    "n.kartBos": "No se encontraron atacantes con múltiples solicitudes para clasificar ({n} eventos).",
    "n.istek": "{n} solicitudes",

    "n.guven": "Confianza",
    "n.kanitlar": "Evidencia",
    "n.kanitYok": "Sin evidencia distintiva.",

    "n.not":
      "La intención es una inferencia de tipo bayesiano a partir del <b>comportamiento realmente observado</b>: la probabilidad a priori de cada motivación se actualiza con las contribuciones de log-verosimilitud de la evidencia observada y luego se normaliza mediante softmax. Las etiquetas de motivación son heurísticas — inferencia conductual, no atribución definitiva. La evidencia (qué observación respaldó qué intención) se lista explícitamente en cada tarjeta.",

    "mot.finansal": "Ganancia financiera",
    "mot.veri": "Recolección de datos",
    "mot.yikim": "Disrupción del servicio",
    "mot.kesif": "Reconocimiento / escaneo",
    "mot.kotuye": "Abuso",
    "motAcik.finansal": "Robo de cuentas, abuso de pagos/tarjetas",
    "motAcik.veri": "Extracción de contenido/precios, recopilación para entrenar IA",
    "motAcik.yikim": "DDoS, agotamiento de recursos, caída del servicio",
    "motAcik.kesif": "Escaneo de vulnerabilidades, enumeración de endpoints",
    "motAcik.kotuye": "Spam, registro falso, inyección de contenido",

    "kanit.finYol.ad": "Segmentación de rutas financieras",
    "kanit.veriYol.ad": "Segmentación de rutas datos/API",
    "kanit.kesifYol.ad": "Rutas sensibles/de reconocimiento",
    "kanit.kotuyeYol.ad": "Rutas de registro/formulario",
    "kanit.cred.ad": "Clase credential-stuffing",
    "kanit.scraper.ad": "Clase scraper",
    "kanit.ddos.ad": "Clase DDoS",
    "kanit.aiClass.ad": "Clase agente-IA",
    "kanit.spam.ad": "Clase spam",
    "kanit.hacim.ad": "Alto volumen de solicitudes",
    "kanit.aracUA.ad": "UA de herramienta de automatización",
    "kanit.aiUA.ad": "UA de rastreador IA",
    "kanit.dusukSkor.ad": "Puntuación baja generalizada",
    "kanit.finYol.detay": "{p}% de las solicitudes a rutas login/pago/cuenta.",
    "kanit.veriYol.detay": "{p}% de las solicitudes a rutas producto/precio/API.",
    "kanit.kesifYol.detay": "Intentos de acceso a rutas como admin/.env/config/backup ({p}%).",
    "kanit.kotuyeYol.detay": "Concentración en rutas register/comment/upload ({p}%).",
    "kanit.cred.detay": "{p}% del tráfico es credential_stuffing.",
    "kanit.scraper.detay": "{p}% del tráfico es scraper.",
    "kanit.ddos.detay": "{p}% del tráfico es ddos.",
    "kanit.aiClass.detay": "{p}% del tráfico es ai_agent (recopilación para entrenamiento).",
    "kanit.spam.detay": "{p}% del tráfico es spam.",
    "kanit.hacim.detay": "{n} solicitudes observadas — indicador de agotamiento de recursos/fuerza bruta.",
    "kanit.aracUA.detay": "{p}% de las solicitudes usan UA de script/herramienta (python/curl).",
    "kanit.aiUA.detay": "UA de bots de IA reportados (gptbot/claudebot, etc.).",
    "kanit.dusukSkor.detay": "{p}% de las solicitudes tienen una puntuación de humanidad muy baja.",

    "gerekce.bos": "No hay suficiente evidencia conductual distintiva — la intención se mantiene cerca del a priori.",
    "gerekce.dolu": "Intención más probable: {mot} ({p}%). Evidencia principal: {detay}",
    "gerekce.doluKanitsiz": "Intención más probable: {mot} ({p}%).",
  },
};

/* ------------------------------------------------------------- Temel çevirmen */

export function niyetCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}

/** Motivasyon adı — enum değeri anahtar olarak kullanılır (asla çevrilmez). */
export function niyetMotAd(m: Motivasyon, dil: Dil): string {
  return niyetCeviri(`mot.${m}`, dil);
}

/** Motivasyon açıklaması — enum-anahtarlı. */
export function niyetMotAcik(m: Motivasyon, dil: Dil): string {
  return niyetCeviri(`motAcik.${m}`, dil);
}

/* ------------------------------------- Kanıt metni yeniden türetme (lib'e dokunmadan) */

/**
 * Lib'in ürettiği Türkçe kanıt `ad` metnini sabit anahtara eşler. Kanıt şablonları
 * `kanitToplama()` içinde sabittir; bu yüzden TR-string → anahtar eşlemesi güvenlidir.
 */
const KANIT_AD_ANAHTAR: Record<string, string> = {
  "Finansal yol hedefleme": "finYol",
  "Veri/API yol hedefleme": "veriYol",
  "Hassas/keşif yolları": "kesifYol",
  "Kayıt/form yolları": "kotuyeYol",
  "Kimlik-doldurma sınıfı": "cred",
  "Kazıyıcı sınıfı": "scraper",
  "DDoS sınıfı": "ddos",
  "AI-ajan sınıfı": "aiClass",
  "Spam sınıfı": "spam",
  "Yüksek istek hacmi": "hacim",
  "Otomasyon aracı UA": "aracUA",
  "AI tarayıcı UA": "aiUA",
  "Yaygın düşük skor": "dusukSkor",
};

/** Türkçe kanıt `ad`'ından anahtar bul (bilinmeyen için null). */
function kanitAnahtar(trAd: string): string | null {
  return KANIT_AD_ANAHTAR[trAd] ?? null;
}

/** Bir kanıtın çevrilmiş adı (bilinmeyen kalıp TR'ye düşer). */
export function niyetKanitAd(k: NiyetKanit, dil: Dil): string {
  const a = kanitAnahtar(k.ad);
  return a ? niyetCeviri(`kanit.${a}.ad`, dil) : k.ad;
}

/**
 * Bir kanıtın çevrilmiş detayı: Türkçe detay metninden sayı/yüzde token'ları
 * regex ile çıkarılır ve yerel şablona ({p} yüzde, {n} adet) yeniden yerleştirilir.
 * Bilinmeyen kalıp aynen (TR) döner.
 */
export function niyetKanitDetay(k: NiyetKanit, dil: Dil): string {
  const a = kanitAnahtar(k.ad);
  if (!a) return k.detay;
  const sablon = niyetCeviri(`kanit.${a}.detay`, dil);
  // "hacim" adet token'ı ("40 istek"), diğerleri yüzde token'ı ("%40").
  if (a === "hacim") {
    const n = k.detay.match(/(\d+)/)?.[1] ?? "";
    return sablon.replace("{n}", n);
  }
  const p = k.detay.match(/%\s*(\d+)/)?.[1] ?? k.detay.match(/(\d+)\s*%/)?.[1] ?? "";
  return sablon.replace("{p}", p);
}

/**
 * Genel/saldırgan gerekçesini VERİDEN yeniden türetir (lib'in TR `gerekce`
 * metnini kullanmak yerine). Böylece sayı token'ı çıkarmaya gerek kalmaz:
 * niyet enum'u + baskın olasılık + en güçlü kanıtın çevrilmiş detayı kullanılır.
 */
export function niyetGerekce(sonuc: NiyetSonuc, dil: Dil): string {
  if (sonuc.kanitlar.length === 0) return niyetCeviri("gerekce.bos", dil);
  const mot = niyetMotAd(sonuc.niyet, dil);
  const p = String(Math.round((sonuc.dagilim[0]?.olasilik ?? 0) * 100));
  // Lib ile aynı seçim: baskın niyeti en çok destekleyen kanıt.
  const enGuclu = [...sonuc.kanitlar].sort(
    (a, b) => (b.etkiler[sonuc.niyet] ?? 0) - (a.etkiler[sonuc.niyet] ?? 0),
  )[0];
  if (!enGuclu) {
    return niyetCeviri("gerekce.doluKanitsiz", dil).replace("{mot}", mot).replace("{p}", p);
  }
  return niyetCeviri("gerekce.dolu", dil)
    .replace("{mot}", mot)
    .replace("{p}", p)
    .replace("{detay}", niyetKanitDetay(enGuclu, dil));
}
