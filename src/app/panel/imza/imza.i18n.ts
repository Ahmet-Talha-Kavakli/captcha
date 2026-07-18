/**
 * Saldırı İmza Kütüphanesi Konsolu — YEREL sayfa sözlüğü.
 * =======================================================
 * Bu dosya YALNIZCA /panel/imza istemci bileşeninin kullanıcıya görünen
 * KROM/ETİKET metinlerini 5 dile taşır (tr/en/de/fr/es).
 * Paylaşılan `@/lib/i18n/panel` sözlüğüne DOKUNMAZ; sadece `Dil` tipini ondan alır.
 *
 * ÖNEMLİ (enum, DSL & lib güvenliği):
 *  - Şiddet DEĞERLERİ (dusuk/orta/yuksek/kritik) ve kategori DEĞERLERİ
 *    (arac/kimlik/ai/kazima/ddos/atlatma) rozet/renk mantığını sürer, çevrilmez.
 *    Yalnızca ETİKETLERİ enum→anahtar eşlemesiyle ("siddet.*", "kategori.*") çözülür.
 *  - DSL sözdizimi (alan/op/değer: `ua contains "python"`, operatörler == != contains
 *    < > in, birleştirici and/or) SÖZDİZİMİDİR — çevrilmez, olduğu gibi gösterilir.
 *    Yalnızca koşul-birleştirme bağlacının (VE/VEYA) görünen METNİ çevrilir.
 *  - İmza kütüphanesi (imza.ts IMZA_KUTUPHANESI) TÜRKÇE ad/açıklama/taktik üretir.
 *    Bunları istemcide id/taktik anahtarlı eşlemelerle çeviririz; lib'e DOKUNMAYIZ.
 *  - IP, ülke kodu, sayı, yüzde VERİ'dir — çevrilmez.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // Giriş bandı
    "serit.baslik": "Saldırıları imzalarla tanı — YARA gibi.",
    "serit.aciklama.1": "Her imza, olay alanları üzerinde çoklu koşuldan oluşan bir desendir (ör.",
    "serit.aciklama.2": "). Hazır kütüphane trafiğinde otomatik taranır; kendi imzanı DSL ile yazıp anında test edebilirsin.",

    // Özet kartları
    "ozet.tetiklenen": "Tetiklenen imza",
    "ozet.kritik": "Kritik imza vuruşu",
    "ozet.imzaliOlay": "İmzalı olay",
    "ozet.kapsama": "Kapsama oranı",

    // Sekmeler
    "sekme.vurus": "İmza vuruşları",
    "sekme.kutuphane": "Kütüphane",
    "sekme.derle": "İmza derleyici",

    // Vuruş sekmesi
    "vurus.baslik": "Trafikte tetiklenen imzalar",
    "vurus.ara": "İmza ara…",
    "vurus.araAria": "Ara",
    "vurus.bos": "Tetiklenen imza yok — trafik temiz veya imza eşleşmedi.",
    "vurus.ipEki": "vuruş · {n} IP",
    "vurus.vurusTip": "{n} vuruş",

    // Derleyici sekmesi
    "derle.baslik": "İmza derleyici (DSL)",
    "derle.imzaAdi": "İmza adı",
    "derle.kural": "Kural (DSL)",
    "derle.testEt": "Derle & gerçek trafikte test et",
    "derle.testEdiliyor": "Test ediliyor…",
    "derle.operatorler": "Operatörler:",
    "derle.birlestir": "birleştir:",
    "derle.sonucBaslik": "Test sonucu",
    "derle.sonucBos": "Derle & test et",
    "derle.eslesti": "gerçek olayda eşleşti · {n} IP",
    "derle.gecerli": "İmza geçerli ve derlendi.",
    "derle.eslesmeVar": "Trafikte eşleşme var.",
    "derle.eslesmeYok": "Şu an eşleşme yok.",
    "derle.kuralaCevir": "Bu deseni kurala çevir",

    // Toast
    "toast.derlemeHatasi": "Derleme hatası",
    "toast.derlendi": "Derlendi — {n} eşleşme",
    "toast.testBasarisiz": "Test başarısız",

    // Koşul birleştirme bağlacı (kosulMetin)
    "kosul.ve": " VE ",
    "kosul.veya": " VEYA ",

    // Şiddet etiketleri (siddet enum → etiket)
    "siddet.dusuk": "Düşük",
    "siddet.orta": "Orta",
    "siddet.yuksek": "Yüksek",
    "siddet.kritik": "Kritik",

    // Kategori etiketleri (kategori enum → etiket)
    "kategori.arac": "HTTP aracı",
    "kategori.kimlik": "Kimlik",
    "kategori.ai": "AI ajan",
    "kategori.kazima": "Kazıma",
    "kategori.ddos": "DDoS",
    "kategori.atlatma": "Atlatma",

    // İmza adları (imza.ts id → çeviri)
    "imza.ad.SIG-TOOL-PY": "Python HTTP kütüphanesi",
    "imza.ad.SIG-SPOOF-TLS": "Sahte tarayıcı (TLS uyumsuz)",
    "imza.ad.SIG-HEADLESS": "Headless tarayıcı",
    "imza.ad.SIG-CRED-STUFF": "Kimlik doldurma",
    "imza.ad.SIG-AI-CRAWLER": "AI ajan / crawler",
    "imza.ad.SIG-SCRAPE-FAST": "Hızlı kazıma",
    "imza.ad.SIG-DDOS": "DDoS deseni",
    "imza.ad.SIG-GEO-HIGH": "Yüksek-risk coğrafya + bot",

    // İmza açıklamaları (imza.ts id → çeviri)
    "imza.aciklama.SIG-TOOL-PY": "python-requests/urllib gibi tarayıcı-olmayan istemci.",
    "imza.aciklama.SIG-SPOOF-TLS": "UA tarayıcı der ama TLS parmak izi araç.",
    "imza.aciklama.SIG-HEADLESS": "Puppeteer/Playwright/Selenium otomasyonu.",
    "imza.aciklama.SIG-CRED-STUFF": "Login yolunda düşük skorlu otomasyon.",
    "imza.aciklama.SIG-AI-CRAWLER": "İlan edilmiş veya tespit edilmiş AI botu.",
    "imza.aciklama.SIG-SCRAPE-FAST": "Kazıyıcı sınıfı, yüksek anomali + düşük skor.",
    "imza.aciklama.SIG-DDOS": "DDoS sınıfı yüksek hacimli trafik.",
    "imza.aciklama.SIG-GEO-HIGH": "Riskli ülkeden düşük skorlu istek.",

    // Taktik adları (imza.ts TR kaynak → çeviri)
    "taktik.Otomatik erişim": "Otomatik erişim",
    "taktik.Savunma atlatma": "Savunma atlatma",
    "taktik.Kimlik bilgisi erişimi": "Kimlik bilgisi erişimi",
    "taktik.İçerik toplama": "İçerik toplama",
    "taktik.Veri çıkarma": "Veri çıkarma",
    "taktik.Hizmet reddi": "Hizmet reddi",
    "taktik.Keşif": "Keşif",
    "taktik.Özel": "Özel",
  },

  en: {
    "serit.baslik": "Detect attacks with signatures — like YARA.",
    "serit.aciklama.1": "Each signature is a pattern of multiple conditions over event fields (e.g.",
    "serit.aciklama.2": "). The built-in library is scanned automatically against traffic; you can write your own signature in DSL and test it instantly.",

    "ozet.tetiklenen": "Triggered signatures",
    "ozet.kritik": "Critical signature hits",
    "ozet.imzaliOlay": "Signed events",
    "ozet.kapsama": "Coverage rate",

    "sekme.vurus": "Signature hits",
    "sekme.kutuphane": "Library",
    "sekme.derle": "Signature compiler",

    "vurus.baslik": "Signatures triggered in traffic",
    "vurus.ara": "Search signature…",
    "vurus.araAria": "Search",
    "vurus.bos": "No triggered signatures — traffic is clean or no signature matched.",
    "vurus.ipEki": "hits · {n} IPs",
    "vurus.vurusTip": "{n} hits",

    "derle.baslik": "Signature compiler (DSL)",
    "derle.imzaAdi": "Signature name",
    "derle.kural": "Rule (DSL)",
    "derle.testEt": "Compile & test on real traffic",
    "derle.testEdiliyor": "Testing…",
    "derle.operatorler": "Operators:",
    "derle.birlestir": "combine:",
    "derle.sonucBaslik": "Test result",
    "derle.sonucBos": "Compile & test",
    "derle.eslesti": "matched in real events · {n} IPs",
    "derle.gecerli": "Signature is valid and compiled.",
    "derle.eslesmeVar": "There are matches in traffic.",
    "derle.eslesmeYok": "No matches right now.",
    "derle.kuralaCevir": "Turn this pattern into a rule",

    "toast.derlemeHatasi": "Compilation error",
    "toast.derlendi": "Compiled — {n} matches",
    "toast.testBasarisiz": "Test failed",

    "kosul.ve": " AND ",
    "kosul.veya": " OR ",

    "siddet.dusuk": "Low",
    "siddet.orta": "Medium",
    "siddet.yuksek": "High",
    "siddet.kritik": "Critical",

    "kategori.arac": "HTTP tool",
    "kategori.kimlik": "Credentials",
    "kategori.ai": "AI agent",
    "kategori.kazima": "Scraping",
    "kategori.ddos": "DDoS",
    "kategori.atlatma": "Evasion",

    "imza.ad.SIG-TOOL-PY": "Python HTTP library",
    "imza.ad.SIG-SPOOF-TLS": "Spoofed browser (TLS mismatch)",
    "imza.ad.SIG-HEADLESS": "Headless browser",
    "imza.ad.SIG-CRED-STUFF": "Credential stuffing",
    "imza.ad.SIG-AI-CRAWLER": "AI agent / crawler",
    "imza.ad.SIG-SCRAPE-FAST": "Fast scraping",
    "imza.ad.SIG-DDOS": "DDoS pattern",
    "imza.ad.SIG-GEO-HIGH": "High-risk geography + bot",

    "imza.aciklama.SIG-TOOL-PY": "Non-browser client such as python-requests/urllib.",
    "imza.aciklama.SIG-SPOOF-TLS": "UA claims a browser but the TLS fingerprint is a tool.",
    "imza.aciklama.SIG-HEADLESS": "Puppeteer/Playwright/Selenium automation.",
    "imza.aciklama.SIG-CRED-STUFF": "Low-score automation on the login path.",
    "imza.aciklama.SIG-AI-CRAWLER": "Declared or detected AI bot.",
    "imza.aciklama.SIG-SCRAPE-FAST": "Scraper class, high anomaly + low score.",
    "imza.aciklama.SIG-DDOS": "High-volume traffic of the DDoS class.",
    "imza.aciklama.SIG-GEO-HIGH": "Low-score request from a risky country.",

    "taktik.Otomatik erişim": "Automated access",
    "taktik.Savunma atlatma": "Defense evasion",
    "taktik.Kimlik bilgisi erişimi": "Credential access",
    "taktik.İçerik toplama": "Content collection",
    "taktik.Veri çıkarma": "Data extraction",
    "taktik.Hizmet reddi": "Denial of service",
    "taktik.Keşif": "Reconnaissance",
    "taktik.Özel": "Custom",
  },

  de: {
    "serit.baslik": "Angriffe mit Signaturen erkennen — wie YARA.",
    "serit.aciklama.1": "Jede Signatur ist ein Muster aus mehreren Bedingungen über Ereignisfelder (z. B.",
    "serit.aciklama.2": "). Die integrierte Bibliothek wird automatisch gegen den Traffic geprüft; Sie können Ihre eigene Signatur in DSL schreiben und sofort testen.",

    "ozet.tetiklenen": "Ausgelöste Signaturen",
    "ozet.kritik": "Kritische Signaturtreffer",
    "ozet.imzaliOlay": "Signierte Ereignisse",
    "ozet.kapsama": "Abdeckungsrate",

    "sekme.vurus": "Signaturtreffer",
    "sekme.kutuphane": "Bibliothek",
    "sekme.derle": "Signatur-Compiler",

    "vurus.baslik": "Im Traffic ausgelöste Signaturen",
    "vurus.ara": "Signatur suchen…",
    "vurus.araAria": "Suchen",
    "vurus.bos": "Keine ausgelösten Signaturen — der Traffic ist sauber oder keine Signatur hat gematcht.",
    "vurus.ipEki": "Treffer · {n} IPs",
    "vurus.vurusTip": "{n} Treffer",

    "derle.baslik": "Signatur-Compiler (DSL)",
    "derle.imzaAdi": "Signaturname",
    "derle.kural": "Regel (DSL)",
    "derle.testEt": "Kompilieren & im Echtverkehr testen",
    "derle.testEdiliyor": "Wird getestet…",
    "derle.operatorler": "Operatoren:",
    "derle.birlestir": "kombinieren:",
    "derle.sonucBaslik": "Testergebnis",
    "derle.sonucBos": "Kompilieren & testen",
    "derle.eslesti": "in Echtereignissen gematcht · {n} IPs",
    "derle.gecerli": "Signatur ist gültig und kompiliert.",
    "derle.eslesmeVar": "Es gibt Treffer im Traffic.",
    "derle.eslesmeYok": "Derzeit keine Treffer.",
    "derle.kuralaCevir": "Dieses Muster in eine Regel umwandeln",

    "toast.derlemeHatasi": "Kompilierungsfehler",
    "toast.derlendi": "Kompiliert — {n} Treffer",
    "toast.testBasarisiz": "Test fehlgeschlagen",

    "kosul.ve": " UND ",
    "kosul.veya": " ODER ",

    "siddet.dusuk": "Niedrig",
    "siddet.orta": "Mittel",
    "siddet.yuksek": "Hoch",
    "siddet.kritik": "Kritisch",

    "kategori.arac": "HTTP-Tool",
    "kategori.kimlik": "Anmeldedaten",
    "kategori.ai": "KI-Agent",
    "kategori.kazima": "Scraping",
    "kategori.ddos": "DDoS",
    "kategori.atlatma": "Umgehung",

    "imza.ad.SIG-TOOL-PY": "Python-HTTP-Bibliothek",
    "imza.ad.SIG-SPOOF-TLS": "Gefälschter Browser (TLS-Diskrepanz)",
    "imza.ad.SIG-HEADLESS": "Headless-Browser",
    "imza.ad.SIG-CRED-STUFF": "Credential Stuffing",
    "imza.ad.SIG-AI-CRAWLER": "KI-Agent / Crawler",
    "imza.ad.SIG-SCRAPE-FAST": "Schnelles Scraping",
    "imza.ad.SIG-DDOS": "DDoS-Muster",
    "imza.ad.SIG-GEO-HIGH": "Hochrisiko-Geografie + Bot",

    "imza.aciklama.SIG-TOOL-PY": "Nicht-Browser-Client wie python-requests/urllib.",
    "imza.aciklama.SIG-SPOOF-TLS": "UA gibt einen Browser an, aber der TLS-Fingerabdruck ist ein Tool.",
    "imza.aciklama.SIG-HEADLESS": "Puppeteer-/Playwright-/Selenium-Automatisierung.",
    "imza.aciklama.SIG-CRED-STUFF": "Niedrig bewertete Automatisierung auf dem Login-Pfad.",
    "imza.aciklama.SIG-AI-CRAWLER": "Deklarierter oder erkannter KI-Bot.",
    "imza.aciklama.SIG-SCRAPE-FAST": "Scraper-Klasse, hohe Anomalie + niedriger Score.",
    "imza.aciklama.SIG-DDOS": "Traffic hohen Volumens der DDoS-Klasse.",
    "imza.aciklama.SIG-GEO-HIGH": "Niedrig bewertete Anfrage aus einem riskanten Land.",

    "taktik.Otomatik erişim": "Automatisierter Zugriff",
    "taktik.Savunma atlatma": "Verteidigungsumgehung",
    "taktik.Kimlik bilgisi erişimi": "Zugriff auf Anmeldedaten",
    "taktik.İçerik toplama": "Inhaltssammlung",
    "taktik.Veri çıkarma": "Datenextraktion",
    "taktik.Hizmet reddi": "Denial of Service",
    "taktik.Keşif": "Aufklärung",
    "taktik.Özel": "Benutzerdefiniert",
  },

  fr: {
    "serit.baslik": "Détectez les attaques avec des signatures — comme YARA.",
    "serit.aciklama.1": "Chaque signature est un motif de plusieurs conditions sur les champs d'événement (ex.",
    "serit.aciklama.2": "). La bibliothèque intégrée est analysée automatiquement sur le trafic ; vous pouvez écrire votre propre signature en DSL et la tester instantanément.",

    "ozet.tetiklenen": "Signatures déclenchées",
    "ozet.kritik": "Impacts de signature critiques",
    "ozet.imzaliOlay": "Événements signés",
    "ozet.kapsama": "Taux de couverture",

    "sekme.vurus": "Impacts de signature",
    "sekme.kutuphane": "Bibliothèque",
    "sekme.derle": "Compilateur de signatures",

    "vurus.baslik": "Signatures déclenchées dans le trafic",
    "vurus.ara": "Rechercher une signature…",
    "vurus.araAria": "Rechercher",
    "vurus.bos": "Aucune signature déclenchée — le trafic est propre ou aucune signature n'a correspondu.",
    "vurus.ipEki": "impacts · {n} IP",
    "vurus.vurusTip": "{n} impacts",

    "derle.baslik": "Compilateur de signatures (DSL)",
    "derle.imzaAdi": "Nom de la signature",
    "derle.kural": "Règle (DSL)",
    "derle.testEt": "Compiler & tester sur le trafic réel",
    "derle.testEdiliyor": "Test en cours…",
    "derle.operatorler": "Opérateurs :",
    "derle.birlestir": "combiner :",
    "derle.sonucBaslik": "Résultat du test",
    "derle.sonucBos": "Compiler & tester",
    "derle.eslesti": "correspondances dans des événements réels · {n} IP",
    "derle.gecerli": "La signature est valide et compilée.",
    "derle.eslesmeVar": "Il y a des correspondances dans le trafic.",
    "derle.eslesmeYok": "Aucune correspondance pour l'instant.",
    "derle.kuralaCevir": "Convertir ce motif en règle",

    "toast.derlemeHatasi": "Erreur de compilation",
    "toast.derlendi": "Compilé — {n} correspondances",
    "toast.testBasarisiz": "Échec du test",

    "kosul.ve": " ET ",
    "kosul.veya": " OU ",

    "siddet.dusuk": "Faible",
    "siddet.orta": "Moyen",
    "siddet.yuksek": "Élevé",
    "siddet.kritik": "Critique",

    "kategori.arac": "Outil HTTP",
    "kategori.kimlik": "Identifiants",
    "kategori.ai": "Agent IA",
    "kategori.kazima": "Scraping",
    "kategori.ddos": "DDoS",
    "kategori.atlatma": "Évasion",

    "imza.ad.SIG-TOOL-PY": "Bibliothèque HTTP Python",
    "imza.ad.SIG-SPOOF-TLS": "Navigateur usurpé (incohérence TLS)",
    "imza.ad.SIG-HEADLESS": "Navigateur headless",
    "imza.ad.SIG-CRED-STUFF": "Bourrage d'identifiants",
    "imza.ad.SIG-AI-CRAWLER": "Agent IA / crawler",
    "imza.ad.SIG-SCRAPE-FAST": "Scraping rapide",
    "imza.ad.SIG-DDOS": "Motif DDoS",
    "imza.ad.SIG-GEO-HIGH": "Géographie à haut risque + bot",

    "imza.aciklama.SIG-TOOL-PY": "Client non-navigateur tel que python-requests/urllib.",
    "imza.aciklama.SIG-SPOOF-TLS": "Le UA annonce un navigateur mais l'empreinte TLS est un outil.",
    "imza.aciklama.SIG-HEADLESS": "Automatisation Puppeteer/Playwright/Selenium.",
    "imza.aciklama.SIG-CRED-STUFF": "Automatisation à faible score sur le chemin de connexion.",
    "imza.aciklama.SIG-AI-CRAWLER": "Bot IA déclaré ou détecté.",
    "imza.aciklama.SIG-SCRAPE-FAST": "Classe scraper, anomalie élevée + score faible.",
    "imza.aciklama.SIG-DDOS": "Trafic à fort volume de la classe DDoS.",
    "imza.aciklama.SIG-GEO-HIGH": "Requête à faible score depuis un pays à risque.",

    "taktik.Otomatik erişim": "Accès automatisé",
    "taktik.Savunma atlatma": "Évasion de défense",
    "taktik.Kimlik bilgisi erişimi": "Accès aux identifiants",
    "taktik.İçerik toplama": "Collecte de contenu",
    "taktik.Veri çıkarma": "Extraction de données",
    "taktik.Hizmet reddi": "Déni de service",
    "taktik.Keşif": "Reconnaissance",
    "taktik.Özel": "Personnalisé",
  },

  es: {
    "serit.baslik": "Detecta ataques con firmas — como YARA.",
    "serit.aciklama.1": "Cada firma es un patrón de múltiples condiciones sobre campos de evento (p. ej.",
    "serit.aciklama.2": "). La biblioteca integrada se escanea automáticamente contra el tráfico; puedes escribir tu propia firma en DSL y probarla al instante.",

    "ozet.tetiklenen": "Firmas activadas",
    "ozet.kritik": "Impactos de firma críticos",
    "ozet.imzaliOlay": "Eventos firmados",
    "ozet.kapsama": "Tasa de cobertura",

    "sekme.vurus": "Impactos de firma",
    "sekme.kutuphane": "Biblioteca",
    "sekme.derle": "Compilador de firmas",

    "vurus.baslik": "Firmas activadas en el tráfico",
    "vurus.ara": "Buscar firma…",
    "vurus.araAria": "Buscar",
    "vurus.bos": "No hay firmas activadas — el tráfico está limpio o ninguna firma coincidió.",
    "vurus.ipEki": "impactos · {n} IP",
    "vurus.vurusTip": "{n} impactos",

    "derle.baslik": "Compilador de firmas (DSL)",
    "derle.imzaAdi": "Nombre de la firma",
    "derle.kural": "Regla (DSL)",
    "derle.testEt": "Compilar & probar en tráfico real",
    "derle.testEdiliyor": "Probando…",
    "derle.operatorler": "Operadores:",
    "derle.birlestir": "combinar:",
    "derle.sonucBaslik": "Resultado de la prueba",
    "derle.sonucBos": "Compilar & probar",
    "derle.eslesti": "coincidencias en eventos reales · {n} IP",
    "derle.gecerli": "La firma es válida y se compiló.",
    "derle.eslesmeVar": "Hay coincidencias en el tráfico.",
    "derle.eslesmeYok": "Sin coincidencias por ahora.",
    "derle.kuralaCevir": "Convertir este patrón en una regla",

    "toast.derlemeHatasi": "Error de compilación",
    "toast.derlendi": "Compilado — {n} coincidencias",
    "toast.testBasarisiz": "Prueba fallida",

    "kosul.ve": " Y ",
    "kosul.veya": " O ",

    "siddet.dusuk": "Bajo",
    "siddet.orta": "Medio",
    "siddet.yuksek": "Alto",
    "siddet.kritik": "Crítico",

    "kategori.arac": "Herramienta HTTP",
    "kategori.kimlik": "Credenciales",
    "kategori.ai": "Agente IA",
    "kategori.kazima": "Scraping",
    "kategori.ddos": "DDoS",
    "kategori.atlatma": "Evasión",

    "imza.ad.SIG-TOOL-PY": "Biblioteca HTTP de Python",
    "imza.ad.SIG-SPOOF-TLS": "Navegador falsificado (incongruencia TLS)",
    "imza.ad.SIG-HEADLESS": "Navegador headless",
    "imza.ad.SIG-CRED-STUFF": "Relleno de credenciales",
    "imza.ad.SIG-AI-CRAWLER": "Agente IA / crawler",
    "imza.ad.SIG-SCRAPE-FAST": "Scraping rápido",
    "imza.ad.SIG-DDOS": "Patrón DDoS",
    "imza.ad.SIG-GEO-HIGH": "Geografía de alto riesgo + bot",

    "imza.aciklama.SIG-TOOL-PY": "Cliente no-navegador como python-requests/urllib.",
    "imza.aciklama.SIG-SPOOF-TLS": "El UA dice ser un navegador pero la huella TLS es una herramienta.",
    "imza.aciklama.SIG-HEADLESS": "Automatización con Puppeteer/Playwright/Selenium.",
    "imza.aciklama.SIG-CRED-STUFF": "Automatización de baja puntuación en la ruta de inicio de sesión.",
    "imza.aciklama.SIG-AI-CRAWLER": "Bot de IA declarado o detectado.",
    "imza.aciklama.SIG-SCRAPE-FAST": "Clase scraper, anomalía alta + puntuación baja.",
    "imza.aciklama.SIG-DDOS": "Tráfico de alto volumen de la clase DDoS.",
    "imza.aciklama.SIG-GEO-HIGH": "Petición de baja puntuación desde un país de riesgo.",

    "taktik.Otomatik erişim": "Acceso automatizado",
    "taktik.Savunma atlatma": "Evasión de defensa",
    "taktik.Kimlik bilgisi erişimi": "Acceso a credenciales",
    "taktik.İçerik toplama": "Recolección de contenido",
    "taktik.Veri çıkarma": "Extracción de datos",
    "taktik.Hizmet reddi": "Denegación de servicio",
    "taktik.Keşif": "Reconocimiento",
    "taktik.Özel": "Personalizado",
  },
};

/** Anahtarı verilen dile çevir; yoksa TR'ye, o da yoksa anahtara düşer. */
export function imzaCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
