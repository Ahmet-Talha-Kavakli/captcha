/**
 * Tehdit Göstergesi Zenginleştirme sayfası — yerel i18n sözlüğü.
 *
 * Panel geneli `ceviri()` yerine bu yerel `zgCeviri()` kullanılır; sayfaya özgü
 * uzun metinler (dürüstlük şeridi, gerekçe başlıkları, ağ tipi açıklaması) ana
 * sözlüğü şişirmesin diye. Anahtar yoksa TR'ye, o da yoksa anahtara düşer.
 *
 * ENUM GÜVENLİĞİ:
 *   - `tehdit.*`  → TehditSeviye enum ("temiz"/"şüpheli"/"kötü"/"kritik")
 *   - `ag.*`      → AgTipi enum ("barındırma"/"VPN/proxy"/"konut"/"mobil"/"bilinmeyen")
 *   - `aksiyon.*` → OnerilenAksiyon enum ("izle"/"doğrula"/"engelle")
 *   - `botClass.*`→ BotClass enum (schema)
 *   - `tip.*`     → GostergeTip enum ("ip"/"asn"/"ulke")
 *   Enum DEĞERLERİ asla çevrilmez; yalnızca anahtar→etiket eşlemeleri çevrilir.
 *   Böylece istemcideki label-map'ler key-map'e dönüştürülür (lib'e dokunulmaz).
 *
 * VERİ:
 *   Motorun (zengin.ts) türettiği serbest metinler — `gerekce`, `kampanyaIpucu`,
 *   `etiketler` ve gösterge değerleri (IP/ASN) — VERİdir; deterministik olarak
 *   sunucuda üretilir ve çevrilmez (sayı/tarih gibi). Yalnızca bunları saran
 *   UI kabuğu çevrilir.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // sayfa başlığı (nav "Zenginleştirme"den daha zengin — yerel tutulur)
    "sayfa.baslik": "Tehdit Göstergesi Zenginleştirme",

    // dürüstlük notu
    "not.baslik": "Nasıl çalışır — dürüst zenginleştirme",
    "not.metin.a": "Her gösterge, sitelerinizde",
    "not.metin.gozlem": "gözlemlenen gerçek trafikten",
    "not.metin.b": "ve deterministik sezgilerden (ASN anahtar-kelime sınıflandırması, IP itibar kayıtları, botClass karışımı)",
    "not.metin.turetilir": "türetilir",
    "not.metin.c": ". Bu sayfa canlı bir",
    "not.metin.besleme": "harici tehdit-istihbaratı beslemesi",
    "not.metin.d": "sorgulamaz; besleme entegrasyonu ayrı bir çalışmadır. Ham gösterge → türetilmiş bağlam (ağ tipi, itibar, güven, tehdit, önerilen aksiyon) boru hattı.",

    // özet kartları
    "stat.toplam": "Zenginleştirilmiş gösterge",
    "stat.kritik": "Kritik gösterge",
    "stat.oto": "Oto-engellenebilir",
    "stat.ortGuven": "Ort. güven skoru",

    // gösterge listesi paneli
    "liste.baslik": "Zenginleştirilmiş göstergeler ({n})",
    "liste.yalnizTehdit": "Yalnız tehdit",
    "liste.ara": "IP, ASN, ülke veya etiket ara…",
    "liste.araAria": "Göstergelerde ara",
    "filtre.hepsi": "Hepsi",
    "liste.bosBaslik": "Eşleşen gösterge yok",
    "liste.bosMetin": "Filtreleri gevşetin ya da daha fazla trafik gözlemlendikçe göstergeler burada zenginleşir.",

    // gösterge kartı
    "kart.yuksekHacim": "yüksek-hacim",
    "kart.guven": "güven",
    "kart.itibar": "itibar",
    "alan.ilkGorulme": "İlk görülme",
    "alan.sonGorulme": "Son görülme",
    "alan.olaySayisi": "Olay sayısı",
    "alan.tekilIp": "Tekil IP",
    "alan.asn": "ASN",
    "alan.baskinUlke": "Baskın ülke",
    "alan.guven": "Güven",
    "alan.itibar": "İtibar",
    "kart.iliskiliBot": "İlişkili bot sınıfları",
    "kart.turetilmisEtiket": "Türetilmiş etiketler",
    "kart.nedenTehdit": "Neden bu tehdit seviyesi",
    "kart.kampanyaIpucu": "Kampanya ipucu:",
    "kart.onerilenAksiyon": "Önerilen aksiyon:",
    "kart.kuralOlustur": "Kural oluştur",

    // görece zaman
    "zaman.azOnce": "az önce",
    "zaman.dk": "{n} dk önce",
    "zaman.sa": "{n} sa önce",
    "zaman.gun": "{n} gün önce",

    // ağ tipi dağılımı paneli
    "dagilim.baslik": "Ağ tipi dağılımı",
    "dagilim.metin": "Barındırma + VPN/proxy ağları daha yüksek şüphe taşır — meşru son-kullanıcı oralardan gelmez. Konut/mobil ağlar meşru trafikle uyumludur.",
    "dagilim.uyari.a": "gösterge barındırma/VPN ağından — yüksek-şüphe kaynakları.",

    // oto-engelleme adayları paneli
    "oto.baslik": "Oto-engelleme adayları",
    "oto.metin": "Yüksek güvenli (≥70) kötücül göstergeler — engelleme kuralına hazır.",
    "oto.bos": "Şu an yüksek-güvenli oto-engelleme adayı yok.",
    "oto.guven": "güven",
    "oto.itibar": "itibar",
    "oto.kural": "Kural",
    "oto.git": "Oto-düzeltme akışına git",

    // ---- enum etiketleri ----
    "tip.ip": "IP",
    "tip.asn": "ASN",
    "tip.ulke": "Ülke",

    "tehdit.temiz": "Temiz",
    "tehdit.şüpheli": "Şüpheli",
    "tehdit.kötü": "Kötü",
    "tehdit.kritik": "Kritik",

    "ag.barındırma": "Barındırma",
    "ag.VPN/proxy": "VPN/Proxy",
    "ag.konut": "Konut",
    "ag.mobil": "Mobil",
    "ag.bilinmeyen": "Bilinmeyen",

    "aksiyon.izle": "İzle",
    "aksiyon.doğrula": "Doğrula",
    "aksiyon.engelle": "Engelle",

    "botClass.human": "İnsan",
    "botClass.good_bot": "İyi bot",
    "botClass.automation": "Otomasyon",
    "botClass.scraper": "Kazıyıcı",
    "botClass.credential_stuffing": "Kimlik doldurma",
    "botClass.ai_agent": "AI ajan",
    "botClass.ddos": "DDoS",
    "botClass.spam": "Spam",
  },

  en: {
    "sayfa.baslik": "Threat Indicator Enrichment",

    "not.baslik": "How it works — honest enrichment",
    "not.metin.a": "Each indicator is",
    "not.metin.gozlem": "derived from the real traffic observed",
    "not.metin.b": "on your sites and from deterministic heuristics (ASN keyword classification, IP reputation records, botClass mix)",
    "not.metin.turetilir": "",
    "not.metin.c": ". This page does not query a live",
    "not.metin.besleme": "external threat-intelligence feed",
    "not.metin.d": "; feed integration is separate work. A raw indicator → derived context (network type, reputation, confidence, threat, recommended action) pipeline.",

    "stat.toplam": "Enriched indicators",
    "stat.kritik": "Critical indicators",
    "stat.oto": "Auto-blockable",
    "stat.ortGuven": "Avg. confidence score",

    "liste.baslik": "Enriched indicators ({n})",
    "liste.yalnizTehdit": "Threats only",
    "liste.ara": "Search IP, ASN, country or tag…",
    "liste.araAria": "Search indicators",
    "filtre.hepsi": "All",
    "liste.bosBaslik": "No matching indicators",
    "liste.bosMetin": "Loosen the filters, or indicators will enrich here as more traffic is observed.",

    "kart.yuksekHacim": "high-volume",
    "kart.guven": "confidence",
    "kart.itibar": "reputation",
    "alan.ilkGorulme": "First seen",
    "alan.sonGorulme": "Last seen",
    "alan.olaySayisi": "Event count",
    "alan.tekilIp": "Unique IPs",
    "alan.asn": "ASN",
    "alan.baskinUlke": "Dominant country",
    "alan.guven": "Confidence",
    "alan.itibar": "Reputation",
    "kart.iliskiliBot": "Related bot classes",
    "kart.turetilmisEtiket": "Derived tags",
    "kart.nedenTehdit": "Why this threat level",
    "kart.kampanyaIpucu": "Campaign hint:",
    "kart.onerilenAksiyon": "Recommended action:",
    "kart.kuralOlustur": "Create rule",

    "zaman.azOnce": "just now",
    "zaman.dk": "{n} min ago",
    "zaman.sa": "{n} h ago",
    "zaman.gun": "{n} d ago",

    "dagilim.baslik": "Network type distribution",
    "dagilim.metin": "Hosting + VPN/proxy networks carry higher suspicion — legitimate end users don't come from there. Residential/mobile networks are consistent with legitimate traffic.",
    "dagilim.uyari.a": "indicators from hosting/VPN networks — high-suspicion sources.",

    "oto.baslik": "Auto-block candidates",
    "oto.metin": "High-confidence (≥70) malicious indicators — ready for a block rule.",
    "oto.bos": "No high-confidence auto-block candidates right now.",
    "oto.guven": "conf.",
    "oto.itibar": "rep.",
    "oto.kural": "Rule",
    "oto.git": "Go to the auto-remediation flow",

    "tip.ip": "IP",
    "tip.asn": "ASN",
    "tip.ulke": "Country",

    "tehdit.temiz": "Clean",
    "tehdit.şüpheli": "Suspicious",
    "tehdit.kötü": "Bad",
    "tehdit.kritik": "Critical",

    "ag.barındırma": "Hosting",
    "ag.VPN/proxy": "VPN/Proxy",
    "ag.konut": "Residential",
    "ag.mobil": "Mobile",
    "ag.bilinmeyen": "Unknown",

    "aksiyon.izle": "Watch",
    "aksiyon.doğrula": "Challenge",
    "aksiyon.engelle": "Block",

    "botClass.human": "Human",
    "botClass.good_bot": "Good bot",
    "botClass.automation": "Automation",
    "botClass.scraper": "Scraper",
    "botClass.credential_stuffing": "Credential stuffing",
    "botClass.ai_agent": "AI agent",
    "botClass.ddos": "DDoS",
    "botClass.spam": "Spam",
  },

  de: {
    "sayfa.baslik": "Anreicherung von Bedrohungsindikatoren",

    "not.baslik": "So funktioniert es — ehrliche Anreicherung",
    "not.metin.a": "Jeder Indikator wird",
    "not.metin.gozlem": "aus dem auf deinen Websites beobachteten echten Traffic",
    "not.metin.b": "und aus deterministischen Heuristiken (ASN-Schlüsselwortklassifizierung, IP-Reputationsdatensätze, botClass-Mischung)",
    "not.metin.turetilir": "abgeleitet",
    "not.metin.c": ". Diese Seite fragt keinen Live-",
    "not.metin.besleme": "externen Bedrohungsdaten-Feed",
    "not.metin.d": "ab; die Feed-Integration ist eine separate Arbeit. Eine Pipeline: Roh-Indikator → abgeleiteter Kontext (Netzwerktyp, Reputation, Konfidenz, Bedrohung, empfohlene Aktion).",

    "stat.toplam": "Angereicherte Indikatoren",
    "stat.kritik": "Kritische Indikatoren",
    "stat.oto": "Automatisch sperrbar",
    "stat.ortGuven": "Ø Konfidenzwert",

    "liste.baslik": "Angereicherte Indikatoren ({n})",
    "liste.yalnizTehdit": "Nur Bedrohungen",
    "liste.ara": "IP, ASN, Land oder Tag suchen…",
    "liste.araAria": "Indikatoren durchsuchen",
    "filtre.hepsi": "Alle",
    "liste.bosBaslik": "Keine passenden Indikatoren",
    "liste.bosMetin": "Lockere die Filter, oder die Indikatoren werden hier angereichert, sobald mehr Traffic beobachtet wird.",

    "kart.yuksekHacim": "hohes Volumen",
    "kart.guven": "Konfidenz",
    "kart.itibar": "Reputation",
    "alan.ilkGorulme": "Erstmals gesehen",
    "alan.sonGorulme": "Zuletzt gesehen",
    "alan.olaySayisi": "Ereignisanzahl",
    "alan.tekilIp": "Eindeutige IPs",
    "alan.asn": "ASN",
    "alan.baskinUlke": "Dominantes Land",
    "alan.guven": "Konfidenz",
    "alan.itibar": "Reputation",
    "kart.iliskiliBot": "Verwandte Bot-Klassen",
    "kart.turetilmisEtiket": "Abgeleitete Tags",
    "kart.nedenTehdit": "Warum diese Bedrohungsstufe",
    "kart.kampanyaIpucu": "Kampagnen-Hinweis:",
    "kart.onerilenAksiyon": "Empfohlene Aktion:",
    "kart.kuralOlustur": "Regel erstellen",

    "zaman.azOnce": "gerade eben",
    "zaman.dk": "vor {n} Min.",
    "zaman.sa": "vor {n} Std.",
    "zaman.gun": "vor {n} T.",

    "dagilim.baslik": "Verteilung der Netzwerktypen",
    "dagilim.metin": "Hosting- + VPN/Proxy-Netzwerke tragen höheren Verdacht — legitime Endnutzer kommen nicht von dort. Wohn-/Mobilfunknetze passen zu legitimem Traffic.",
    "dagilim.uyari.a": "Indikatoren aus Hosting-/VPN-Netzwerken — Quellen mit hohem Verdacht.",

    "oto.baslik": "Auto-Sperr-Kandidaten",
    "oto.metin": "Bösartige Indikatoren mit hoher Konfidenz (≥70) — bereit für eine Sperrregel.",
    "oto.bos": "Derzeit keine Auto-Sperr-Kandidaten mit hoher Konfidenz.",
    "oto.guven": "Konf.",
    "oto.itibar": "Rep.",
    "oto.kural": "Regel",
    "oto.git": "Zum Auto-Behebungs-Ablauf gehen",

    "tip.ip": "IP",
    "tip.asn": "ASN",
    "tip.ulke": "Land",

    "tehdit.temiz": "Sauber",
    "tehdit.şüpheli": "Verdächtig",
    "tehdit.kötü": "Schlecht",
    "tehdit.kritik": "Kritisch",

    "ag.barındırma": "Hosting",
    "ag.VPN/proxy": "VPN/Proxy",
    "ag.konut": "Wohnnetz",
    "ag.mobil": "Mobil",
    "ag.bilinmeyen": "Unbekannt",

    "aksiyon.izle": "Beobachten",
    "aksiyon.doğrula": "Prüfen",
    "aksiyon.engelle": "Sperren",

    "botClass.human": "Mensch",
    "botClass.good_bot": "Guter Bot",
    "botClass.automation": "Automatisierung",
    "botClass.scraper": "Scraper",
    "botClass.credential_stuffing": "Credential Stuffing",
    "botClass.ai_agent": "KI-Agent",
    "botClass.ddos": "DDoS",
    "botClass.spam": "Spam",
  },

  fr: {
    "sayfa.baslik": "Enrichissement des indicateurs de menace",

    "not.baslik": "Comment ça marche — enrichissement honnête",
    "not.metin.a": "Chaque indicateur est",
    "not.metin.gozlem": "dérivé du trafic réel observé",
    "not.metin.b": "sur vos sites et d'heuristiques déterministes (classification par mots-clés d'ASN, enregistrements de réputation IP, mélange de botClass)",
    "not.metin.turetilir": "",
    "not.metin.c": ". Cette page n'interroge pas un",
    "not.metin.besleme": "flux externe de renseignement sur les menaces",
    "not.metin.d": " en direct ; l'intégration de flux est un travail distinct. Un pipeline indicateur brut → contexte dérivé (type de réseau, réputation, confiance, menace, action recommandée).",

    "stat.toplam": "Indicateurs enrichis",
    "stat.kritik": "Indicateurs critiques",
    "stat.oto": "Blocables automatiquement",
    "stat.ortGuven": "Score de confiance moyen",

    "liste.baslik": "Indicateurs enrichis ({n})",
    "liste.yalnizTehdit": "Menaces seulement",
    "liste.ara": "Rechercher IP, ASN, pays ou tag…",
    "liste.araAria": "Rechercher des indicateurs",
    "filtre.hepsi": "Tous",
    "liste.bosBaslik": "Aucun indicateur correspondant",
    "liste.bosMetin": "Assouplissez les filtres, ou les indicateurs s'enrichiront ici à mesure que plus de trafic est observé.",

    "kart.yuksekHacim": "haut volume",
    "kart.guven": "confiance",
    "kart.itibar": "réputation",
    "alan.ilkGorulme": "Vu pour la première fois",
    "alan.sonGorulme": "Vu pour la dernière fois",
    "alan.olaySayisi": "Nombre d'événements",
    "alan.tekilIp": "IP uniques",
    "alan.asn": "ASN",
    "alan.baskinUlke": "Pays dominant",
    "alan.guven": "Confiance",
    "alan.itibar": "Réputation",
    "kart.iliskiliBot": "Classes de bots associées",
    "kart.turetilmisEtiket": "Tags dérivés",
    "kart.nedenTehdit": "Pourquoi ce niveau de menace",
    "kart.kampanyaIpucu": "Indice de campagne :",
    "kart.onerilenAksiyon": "Action recommandée :",
    "kart.kuralOlustur": "Créer une règle",

    "zaman.azOnce": "à l'instant",
    "zaman.dk": "il y a {n} min",
    "zaman.sa": "il y a {n} h",
    "zaman.gun": "il y a {n} j",

    "dagilim.baslik": "Répartition des types de réseau",
    "dagilim.metin": "Les réseaux d'hébergement + VPN/proxy présentent une suspicion plus élevée — les utilisateurs finaux légitimes n'en viennent pas. Les réseaux résidentiels/mobiles sont cohérents avec un trafic légitime.",
    "dagilim.uyari.a": "indicateurs provenant de réseaux d'hébergement/VPN — sources à forte suspicion.",

    "oto.baslik": "Candidats au blocage auto",
    "oto.metin": "Indicateurs malveillants à haute confiance (≥70) — prêts pour une règle de blocage.",
    "oto.bos": "Aucun candidat au blocage auto à haute confiance pour l'instant.",
    "oto.guven": "conf.",
    "oto.itibar": "rép.",
    "oto.kural": "Règle",
    "oto.git": "Aller au flux d'auto-remédiation",

    "tip.ip": "IP",
    "tip.asn": "ASN",
    "tip.ulke": "Pays",

    "tehdit.temiz": "Propre",
    "tehdit.şüpheli": "Suspect",
    "tehdit.kötü": "Mauvais",
    "tehdit.kritik": "Critique",

    "ag.barındırma": "Hébergement",
    "ag.VPN/proxy": "VPN/Proxy",
    "ag.konut": "Résidentiel",
    "ag.mobil": "Mobile",
    "ag.bilinmeyen": "Inconnu",

    "aksiyon.izle": "Surveiller",
    "aksiyon.doğrula": "Défier",
    "aksiyon.engelle": "Bloquer",

    "botClass.human": "Humain",
    "botClass.good_bot": "Bon bot",
    "botClass.automation": "Automatisation",
    "botClass.scraper": "Scraper",
    "botClass.credential_stuffing": "Credential stuffing",
    "botClass.ai_agent": "Agent IA",
    "botClass.ddos": "DDoS",
    "botClass.spam": "Spam",
  },

  es: {
    "sayfa.baslik": "Enriquecimiento de indicadores de amenaza",

    "not.baslik": "Cómo funciona — enriquecimiento honesto",
    "not.metin.a": "Cada indicador se",
    "not.metin.gozlem": "deriva del tráfico real observado",
    "not.metin.b": "en tus sitios y de heurísticas deterministas (clasificación por palabras clave de ASN, registros de reputación de IP, mezcla de botClass)",
    "not.metin.turetilir": "",
    "not.metin.c": ". Esta página no consulta un",
    "not.metin.besleme": "feed externo de inteligencia de amenazas",
    "not.metin.d": " en vivo; la integración del feed es un trabajo aparte. Un pipeline indicador crudo → contexto derivado (tipo de red, reputación, confianza, amenaza, acción recomendada).",

    "stat.toplam": "Indicadores enriquecidos",
    "stat.kritik": "Indicadores críticos",
    "stat.oto": "Bloqueables automáticamente",
    "stat.ortGuven": "Puntuación de confianza media",

    "liste.baslik": "Indicadores enriquecidos ({n})",
    "liste.yalnizTehdit": "Solo amenazas",
    "liste.ara": "Buscar IP, ASN, país o etiqueta…",
    "liste.araAria": "Buscar indicadores",
    "filtre.hepsi": "Todos",
    "liste.bosBaslik": "No hay indicadores coincidentes",
    "liste.bosMetin": "Relaja los filtros, o los indicadores se enriquecerán aquí a medida que se observe más tráfico.",

    "kart.yuksekHacim": "alto volumen",
    "kart.guven": "confianza",
    "kart.itibar": "reputación",
    "alan.ilkGorulme": "Visto por primera vez",
    "alan.sonGorulme": "Visto por última vez",
    "alan.olaySayisi": "Número de eventos",
    "alan.tekilIp": "IP únicas",
    "alan.asn": "ASN",
    "alan.baskinUlke": "País dominante",
    "alan.guven": "Confianza",
    "alan.itibar": "Reputación",
    "kart.iliskiliBot": "Clases de bots relacionadas",
    "kart.turetilmisEtiket": "Etiquetas derivadas",
    "kart.nedenTehdit": "Por qué este nivel de amenaza",
    "kart.kampanyaIpucu": "Pista de campaña:",
    "kart.onerilenAksiyon": "Acción recomendada:",
    "kart.kuralOlustur": "Crear regla",

    "zaman.azOnce": "justo ahora",
    "zaman.dk": "hace {n} min",
    "zaman.sa": "hace {n} h",
    "zaman.gun": "hace {n} d",

    "dagilim.baslik": "Distribución por tipo de red",
    "dagilim.metin": "Las redes de hosting + VPN/proxy conllevan mayor sospecha — los usuarios finales legítimos no vienen de ahí. Las redes residenciales/móviles son coherentes con el tráfico legítimo.",
    "dagilim.uyari.a": "indicadores de redes de hosting/VPN — fuentes de alta sospecha.",

    "oto.baslik": "Candidatos a bloqueo automático",
    "oto.metin": "Indicadores maliciosos de alta confianza (≥70) — listos para una regla de bloqueo.",
    "oto.bos": "No hay candidatos a bloqueo automático de alta confianza por ahora.",
    "oto.guven": "conf.",
    "oto.itibar": "rep.",
    "oto.kural": "Regla",
    "oto.git": "Ir al flujo de auto-remediación",

    "tip.ip": "IP",
    "tip.asn": "ASN",
    "tip.ulke": "País",

    "tehdit.temiz": "Limpio",
    "tehdit.şüpheli": "Sospechoso",
    "tehdit.kötü": "Malo",
    "tehdit.kritik": "Crítico",

    "ag.barındırma": "Hosting",
    "ag.VPN/proxy": "VPN/Proxy",
    "ag.konut": "Residencial",
    "ag.mobil": "Móvil",
    "ag.bilinmeyen": "Desconocido",

    "aksiyon.izle": "Vigilar",
    "aksiyon.doğrula": "Desafiar",
    "aksiyon.engelle": "Bloquear",

    "botClass.human": "Humano",
    "botClass.good_bot": "Bot bueno",
    "botClass.automation": "Automatización",
    "botClass.scraper": "Scraper",
    "botClass.credential_stuffing": "Relleno de credenciales",
    "botClass.ai_agent": "Agente IA",
    "botClass.ddos": "DDoS",
    "botClass.spam": "Spam",
  },
};

export function zgCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
