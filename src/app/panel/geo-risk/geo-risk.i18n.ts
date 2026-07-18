/**
 * Coğrafi & ASN Risk Konsolu — YEREL sayfa sözlüğü.
 * =====================================================
 * Bu dosya YALNIZCA /panel/geo-risk istemci bileşeninin kullanıcıya görünen
 * KROM/ETİKET metinlerini 5 dile taşır (tr/en/de/fr/es).
 * Paylaşılan `@/lib/i18n/panel` sözlüğüne DOKUNMAZ; sadece `Dil` tipini ondan alır.
 *
 * ÖNEMLİ (güvenlik):
 *  - Risk seviyesi DEĞERLERİ (RiskSeviye: dusuk/orta/yuksek/kritik) ve bot sınıfı
 *    DEĞERLERİ (BotClass) filtre/renk/rozet mantığını sürer, çevrilmez. Yalnızca
 *    ETİKETLERİ enum→anahtar eşlemesiyle ("seviye.*", "bot.*") t() ile çözülür.
 *  - Ülke kodu/adı, ASN kodu/adı, IP, sayı, skor, yüzde VERİ'dir — çevrilmez.
 *    Ülke adı (@/lib/flag → ULKE_AD) motor/veri kaynaklıdır ve olduğu gibi gösterilir.
 *  - "Datacenter/Hosting" rozeti teknik bir terimdir; olduğu gibi bırakılır.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // Giriş bandı
    "serit.baslik": "Tehdit coğrafyanı tek yerden gör.",
    "serit.aciklama":
      "Gerçek trafiğinden ülke ve ASN (ağ operatörü) bazında bot/saldırı riskini puanlıyoruz. Meşru pazarlarını allowlist'e al, yüksek riskli coğrafyaları ve veri merkezi (datacenter) ağlarını challenge/block ile karşıla.",

    // Özet kartları
    "ozet.toplamUlke": "İzlenen ülke",
    "ozet.yuksekRiskUlke": "Yüksek riskli ülke",
    "ozet.toplamAsn": "İzlenen ASN",
    "ozet.enRiskliAsn": "En riskli ASN",
    "ozet.enRiskliAsnRisk": "En riskli ASN · risk {n}",

    // Sekmeler + araçlar
    "sekme.ulke": "Ülke riski",
    "sekme.asn": "ASN riski",
    "arama.ulke": "Ülke ara…",
    "arama.asn": "ASN / operatör ara…",
    "arama.aria": "Risk tablosunda ara",
    "filtre.yalnizYuksek": "Yalnızca yüksek risk",

    // Ülke tablosu başlıkları
    "ulke.th.no": "#",
    "ulke.th.ulke": "Ülke",
    "ulke.th.risk": "Risk",
    "ulke.th.toplamEngel": "Toplam / Engel",
    "ulke.th.botOran": "Bot oranı",
    "ulke.th.baskinSinif": "Baskın sınıf",
    "ulke.th.tekilIp": "Tekil IP",
    "ulke.th.aksiyon": "Aksiyon",
    "ulke.bos": "Eşleşen ülke yok.",

    // ASN tablosu başlıkları
    "asn.uyari":
      "Datacenter/hosting rozetli ASN'ler dikkat gerektirir: meşru son-kullanıcılar mobil/geniş bant ISP'lerden gelir, veri merkezlerinden değil. Bir ASN'den gelen trafik datacenter kaynaklıysa neredeyse daima otomasyondur (kazıyıcı, headless tarayıcı, AI ajanı).",
    "asn.th.no": "#",
    "asn.th.asn": "ASN / operatör",
    "asn.th.risk": "Risk",
    "asn.th.toplamEngel": "Toplam / Engel",
    "asn.th.botOran": "Bot oranı",
    "asn.th.kotuItibar": "Kötü itibar IP",
    "asn.th.aksiyon": "Aksiyon",
    "asn.bos": "Eşleşen ASN yok.",
    "asn.datacenterRozet": "Datacenter/Hosting",
    "asn.baskin": "Baskın: {n}",
    "asn.datacenterSayi": "{n} datacenter",

    // Ortak aksiyon
    "aksiyon.kuralOlustur": "Kural oluştur",

    // Açıklayıcı (accordion)
    "aciklama.baslik": "Risk puanı nasıl hesaplanır ve nasıl kullanılır?",
    "aciklama.dortSinyal": "Risk puanı (0–100) dört sinyalden türetilir",
    "aciklama.botOran": "Bot oranı — bot sınıfı olayların payı (en baskın sinyal).",
    "aciklama.engelOran": "Engel oranı — blocked + challenged verdict'lerin payı.",
    "aciklama.dusukInsan": "Düşük insanlık skoru — ortalama insanlık skoru ne kadar düşükse risk o kadar yüksek.",
    "aciklama.hacim": "Hacim — logaritmik; çok istek riski hafifçe yükseltir.",
    "aciklama.asnEkSinyal": "ASN'lerde ek sinyal: IP itibarı",
    "aciklama.asnMetin":
      "Bir ASN'in tekil IP'lerinden kaçı datacenter / tor / vpn / malicious itibarında? Meşru insanlar veri merkezlerinden gelmez; bu yüzden datacenter/hosting ağırlıklı ASN'ler (DigitalOcean, AWS, Hetzner, OVH…) daha yüksek risk taşır ve otomatik olarak Datacenter/Hosting rozetiyle işaretlenir.",
    "aciklama.nasilAksiyon": "Nasıl aksiyona dökülür?",
    "aciklama.allowlist": "Gerçek pazarlarını allowlist'e al — düşük riskli, insan-ağırlıklı ülkelere geçiş serbest bırak.",
    "aciklama.challenge": "Yüksek/kritik coğrafyaları challenge et — engellemeden önce doğrulama iste.",
    "aciklama.datacenterBlock": "Datacenter/hosting ASN'lerini block/challenge — meşru kullanıcı kaybı riski düşük, bot kesme kazancı yüksek.",
    "aciklama.kuralNot": "Her satırdaki Kural oluştur seni gelişmiş kural oluşturucuya, o ülke/ASN önceden seçili olarak götürür.",
    "aciklama.gelismisKural": "Gelişmiş kural oluştur",
    "aciklama.kurallar": "Kurallar",

    // Risk seviyesi etiketleri (enum→anahtar)
    "seviye.dusuk": "Düşük",
    "seviye.orta": "Orta",
    "seviye.yuksek": "Yüksek",
    "seviye.kritik": "Kritik",

    // Bot sınıfı etiketleri (enum→anahtar)
    "bot.human": "İnsan",
    "bot.good_bot": "İyi bot",
    "bot.automation": "Otomasyon",
    "bot.scraper": "Kazıyıcı",
    "bot.credential_stuffing": "Kimlik doldurma",
    "bot.ai_agent": "AI ajan",
    "bot.ddos": "DDoS",
    "bot.spam": "Spam",
  },

  en: {
    "serit.baslik": "See your threat geography in one place.",
    "serit.aciklama":
      "From your real traffic, we score bot/attack risk by country and ASN (network operator). Allowlist your legitimate markets and meet high-risk geographies and data-center (datacenter) networks with challenge/block.",

    "ozet.toplamUlke": "Countries monitored",
    "ozet.yuksekRiskUlke": "High-risk countries",
    "ozet.toplamAsn": "ASNs monitored",
    "ozet.enRiskliAsn": "Riskiest ASN",
    "ozet.enRiskliAsnRisk": "Riskiest ASN · risk {n}",

    "sekme.ulke": "Country risk",
    "sekme.asn": "ASN risk",
    "arama.ulke": "Search country…",
    "arama.asn": "Search ASN / operator…",
    "arama.aria": "Search the risk table",
    "filtre.yalnizYuksek": "High risk only",

    "ulke.th.no": "#",
    "ulke.th.ulke": "Country",
    "ulke.th.risk": "Risk",
    "ulke.th.toplamEngel": "Total / Blocked",
    "ulke.th.botOran": "Bot rate",
    "ulke.th.baskinSinif": "Dominant class",
    "ulke.th.tekilIp": "Unique IPs",
    "ulke.th.aksiyon": "Action",
    "ulke.bos": "No matching country.",

    "asn.uyari":
      "ASNs badged Datacenter/hosting require attention: legitimate end-users come from mobile/broadband ISPs, not data centers. When traffic from an ASN originates in a datacenter, it is almost always automation (scraper, headless browser, AI agent).",
    "asn.th.no": "#",
    "asn.th.asn": "ASN / operator",
    "asn.th.risk": "Risk",
    "asn.th.toplamEngel": "Total / Blocked",
    "asn.th.botOran": "Bot rate",
    "asn.th.kotuItibar": "Bad-reputation IPs",
    "asn.th.aksiyon": "Action",
    "asn.bos": "No matching ASN.",
    "asn.datacenterRozet": "Datacenter/Hosting",
    "asn.baskin": "Dominant: {n}",
    "asn.datacenterSayi": "{n} datacenter",

    "aksiyon.kuralOlustur": "Create rule",

    "aciklama.baslik": "How is the risk score calculated and used?",
    "aciklama.dortSinyal": "The risk score (0–100) is derived from four signals",
    "aciklama.botOran": "Bot rate — the share of bot-class events (the most dominant signal).",
    "aciklama.engelOran": "Block rate — the share of blocked + challenged verdicts.",
    "aciklama.dusukInsan": "Low humanity score — the lower the average humanity score, the higher the risk.",
    "aciklama.hacim": "Volume — logarithmic; high request counts raise risk slightly.",
    "aciklama.asnEkSinyal": "Extra signal for ASNs: IP reputation",
    "aciklama.asnMetin":
      "How many of an ASN's unique IPs have datacenter / tor / vpn / malicious reputation? Legitimate people don't come from data centers, so datacenter/hosting-heavy ASNs (DigitalOcean, AWS, Hetzner, OVH…) carry higher risk and are automatically marked with the Datacenter/Hosting badge.",
    "aciklama.nasilAksiyon": "How to turn this into action?",
    "aciklama.allowlist": "Allowlist your real markets — free up passage to low-risk, human-heavy countries.",
    "aciklama.challenge": "Challenge high/critical geographies — ask for verification before blocking.",
    "aciklama.datacenterBlock": "Block/challenge datacenter/hosting ASNs — low risk of losing legitimate users, high gain in cutting bots.",
    "aciklama.kuralNot": "The Create rule link on each row takes you to the advanced rule builder with that country/ASN preselected.",
    "aciklama.gelismisKural": "Create advanced rule",
    "aciklama.kurallar": "Rules",

    "seviye.dusuk": "Low",
    "seviye.orta": "Medium",
    "seviye.yuksek": "High",
    "seviye.kritik": "Critical",

    "bot.human": "Human",
    "bot.good_bot": "Good bot",
    "bot.automation": "Automation",
    "bot.scraper": "Scraper",
    "bot.credential_stuffing": "Credential stuffing",
    "bot.ai_agent": "AI agent",
    "bot.ddos": "DDoS",
    "bot.spam": "Spam",
  },

  de: {
    "serit.baslik": "Sehen Sie Ihre Bedrohungsgeografie an einem Ort.",
    "serit.aciklama":
      "Aus Ihrem realen Traffic bewerten wir das Bot-/Angriffsrisiko nach Land und ASN (Netzbetreiber). Setzen Sie legitime Märkte auf die Allowlist und begegnen Sie Hochrisiko-Regionen und Rechenzentrums-(Datacenter-)Netzen mit Challenge/Block.",

    "ozet.toplamUlke": "Überwachte Länder",
    "ozet.yuksekRiskUlke": "Länder mit hohem Risiko",
    "ozet.toplamAsn": "Überwachte ASNs",
    "ozet.enRiskliAsn": "Riskanteste ASN",
    "ozet.enRiskliAsnRisk": "Riskanteste ASN · Risiko {n}",

    "sekme.ulke": "Länderrisiko",
    "sekme.asn": "ASN-Risiko",
    "arama.ulke": "Land suchen…",
    "arama.asn": "ASN / Betreiber suchen…",
    "arama.aria": "In der Risikotabelle suchen",
    "filtre.yalnizYuksek": "Nur hohes Risiko",

    "ulke.th.no": "#",
    "ulke.th.ulke": "Land",
    "ulke.th.risk": "Risiko",
    "ulke.th.toplamEngel": "Gesamt / Blockiert",
    "ulke.th.botOran": "Bot-Rate",
    "ulke.th.baskinSinif": "Dominante Klasse",
    "ulke.th.tekilIp": "Eindeutige IPs",
    "ulke.th.aksiyon": "Aktion",
    "ulke.bos": "Kein passendes Land.",

    "asn.uyari":
      "Mit Datacenter/Hosting gekennzeichnete ASNs erfordern Aufmerksamkeit: legitime Endnutzer kommen von Mobil-/Breitband-ISPs, nicht aus Rechenzentren. Stammt der Traffic einer ASN aus einem Datacenter, ist es fast immer Automatisierung (Scraper, Headless-Browser, KI-Agent).",
    "asn.th.no": "#",
    "asn.th.asn": "ASN / Betreiber",
    "asn.th.risk": "Risiko",
    "asn.th.toplamEngel": "Gesamt / Blockiert",
    "asn.th.botOran": "Bot-Rate",
    "asn.th.kotuItibar": "IPs mit schlechtem Ruf",
    "asn.th.aksiyon": "Aktion",
    "asn.bos": "Keine passende ASN.",
    "asn.datacenterRozet": "Datacenter/Hosting",
    "asn.baskin": "Dominant: {n}",
    "asn.datacenterSayi": "{n} Datacenter",

    "aksiyon.kuralOlustur": "Regel erstellen",

    "aciklama.baslik": "Wie wird der Risikowert berechnet und genutzt?",
    "aciklama.dortSinyal": "Der Risikowert (0–100) wird aus vier Signalen abgeleitet",
    "aciklama.botOran": "Bot-Rate — der Anteil von Ereignissen der Bot-Klasse (das dominanteste Signal).",
    "aciklama.engelOran": "Blockrate — der Anteil von blocked + challenged Verdicts.",
    "aciklama.dusukInsan": "Niedriger Menschlichkeits-Score — je niedriger der durchschnittliche Menschlichkeits-Score, desto höher das Risiko.",
    "aciklama.hacim": "Volumen — logarithmisch; viele Anfragen erhöhen das Risiko leicht.",
    "aciklama.asnEkSinyal": "Zusätzliches Signal bei ASNs: IP-Reputation",
    "aciklama.asnMetin":
      "Wie viele der eindeutigen IPs einer ASN haben eine Datacenter- / Tor- / VPN- / Malicious-Reputation? Legitime Menschen kommen nicht aus Rechenzentren; deshalb tragen datacenter-/hosting-lastige ASNs (DigitalOcean, AWS, Hetzner, OVH…) ein höheres Risiko und werden automatisch mit dem Datacenter/Hosting-Abzeichen markiert.",
    "aciklama.nasilAksiyon": "Wie wird daraus eine Aktion?",
    "aciklama.allowlist": "Setzen Sie Ihre echten Märkte auf die Allowlist — geben Sie den Zugang zu risikoarmen, menschlich geprägten Ländern frei.",
    "aciklama.challenge": "Fordern Sie bei hohen/kritischen Regionen eine Challenge — verlangen Sie eine Verifizierung vor dem Blockieren.",
    "aciklama.datacenterBlock": "Blockieren/challengen Sie Datacenter/Hosting-ASNs — geringes Risiko, legitime Nutzer zu verlieren, hoher Gewinn beim Abschneiden von Bots.",
    "aciklama.kuralNot": "Der Link Regel erstellen in jeder Zeile führt Sie zum erweiterten Regel-Builder mit vorausgewähltem Land/ASN.",
    "aciklama.gelismisKural": "Erweiterte Regel erstellen",
    "aciklama.kurallar": "Regeln",

    "seviye.dusuk": "Niedrig",
    "seviye.orta": "Mittel",
    "seviye.yuksek": "Hoch",
    "seviye.kritik": "Kritisch",

    "bot.human": "Mensch",
    "bot.good_bot": "Guter Bot",
    "bot.automation": "Automatisierung",
    "bot.scraper": "Scraper",
    "bot.credential_stuffing": "Credential Stuffing",
    "bot.ai_agent": "KI-Agent",
    "bot.ddos": "DDoS",
    "bot.spam": "Spam",
  },

  fr: {
    "serit.baslik": "Voyez votre géographie des menaces au même endroit.",
    "serit.aciklama":
      "À partir de votre trafic réel, nous évaluons le risque de bot/attaque par pays et par ASN (opérateur réseau). Mettez vos marchés légitimes en allowlist et accueillez les géographies à haut risque et les réseaux de centres de données (datacenter) par challenge/block.",

    "ozet.toplamUlke": "Pays surveillés",
    "ozet.yuksekRiskUlke": "Pays à haut risque",
    "ozet.toplamAsn": "ASN surveillés",
    "ozet.enRiskliAsn": "ASN le plus risqué",
    "ozet.enRiskliAsnRisk": "ASN le plus risqué · risque {n}",

    "sekme.ulke": "Risque pays",
    "sekme.asn": "Risque ASN",
    "arama.ulke": "Rechercher un pays…",
    "arama.asn": "Rechercher ASN / opérateur…",
    "arama.aria": "Rechercher dans le tableau de risque",
    "filtre.yalnizYuksek": "Haut risque uniquement",

    "ulke.th.no": "#",
    "ulke.th.ulke": "Pays",
    "ulke.th.risk": "Risque",
    "ulke.th.toplamEngel": "Total / Bloqué",
    "ulke.th.botOran": "Taux de bots",
    "ulke.th.baskinSinif": "Classe dominante",
    "ulke.th.tekilIp": "IP uniques",
    "ulke.th.aksiyon": "Action",
    "ulke.bos": "Aucun pays correspondant.",

    "asn.uyari":
      "Les ASN étiquetés Datacenter/hosting demandent de l'attention : les utilisateurs finaux légitimes viennent de FAI mobile/haut débit, pas de centres de données. Quand le trafic d'un ASN provient d'un datacenter, il s'agit presque toujours d'automatisation (scraper, navigateur headless, agent IA).",
    "asn.th.no": "#",
    "asn.th.asn": "ASN / opérateur",
    "asn.th.risk": "Risque",
    "asn.th.toplamEngel": "Total / Bloqué",
    "asn.th.botOran": "Taux de bots",
    "asn.th.kotuItibar": "IP à mauvaise réputation",
    "asn.th.aksiyon": "Action",
    "asn.bos": "Aucun ASN correspondant.",
    "asn.datacenterRozet": "Datacenter/Hosting",
    "asn.baskin": "Dominant : {n}",
    "asn.datacenterSayi": "{n} datacenter",

    "aksiyon.kuralOlustur": "Créer une règle",

    "aciklama.baslik": "Comment le score de risque est-il calculé et utilisé ?",
    "aciklama.dortSinyal": "Le score de risque (0–100) est dérivé de quatre signaux",
    "aciklama.botOran": "Taux de bots — la part des événements de classe bot (le signal le plus dominant).",
    "aciklama.engelOran": "Taux de blocage — la part des verdicts blocked + challenged.",
    "aciklama.dusukInsan": "Faible score d'humanité — plus le score moyen d'humanité est bas, plus le risque est élevé.",
    "aciklama.hacim": "Volume — logarithmique ; un grand nombre de requêtes augmente légèrement le risque.",
    "aciklama.asnEkSinyal": "Signal supplémentaire pour les ASN : réputation IP",
    "aciklama.asnMetin":
      "Combien des IP uniques d'un ASN ont une réputation datacenter / tor / vpn / malicious ? Les personnes légitimes ne viennent pas des centres de données ; c'est pourquoi les ASN à forte proportion datacenter/hosting (DigitalOcean, AWS, Hetzner, OVH…) présentent un risque plus élevé et sont automatiquement marqués du badge Datacenter/Hosting.",
    "aciklama.nasilAksiyon": "Comment passer à l'action ?",
    "aciklama.allowlist": "Mettez vos vrais marchés en allowlist — libérez le passage vers les pays à faible risque, à forte présence humaine.",
    "aciklama.challenge": "Challengez les géographies élevées/critiques — demandez une vérification avant de bloquer.",
    "aciklama.datacenterBlock": "Bloquez/challengez les ASN datacenter/hosting — faible risque de perdre des utilisateurs légitimes, fort gain en coupant les bots.",
    "aciklama.kuralNot": "Le lien Créer une règle sur chaque ligne vous amène au générateur de règles avancé avec ce pays/ASN présélectionné.",
    "aciklama.gelismisKural": "Créer une règle avancée",
    "aciklama.kurallar": "Règles",

    "seviye.dusuk": "Faible",
    "seviye.orta": "Moyen",
    "seviye.yuksek": "Élevé",
    "seviye.kritik": "Critique",

    "bot.human": "Humain",
    "bot.good_bot": "Bon bot",
    "bot.automation": "Automatisation",
    "bot.scraper": "Scraper",
    "bot.credential_stuffing": "Bourrage d'identifiants",
    "bot.ai_agent": "Agent IA",
    "bot.ddos": "DDoS",
    "bot.spam": "Spam",
  },

  es: {
    "serit.baslik": "Ve tu geografía de amenazas en un solo lugar.",
    "serit.aciklama":
      "A partir de tu tráfico real, puntuamos el riesgo de bots/ataques por país y ASN (operador de red). Añade a la allowlist tus mercados legítimos y responde a las geografías de alto riesgo y a las redes de centros de datos (datacenter) con challenge/block.",

    "ozet.toplamUlke": "Países monitorizados",
    "ozet.yuksekRiskUlke": "Países de alto riesgo",
    "ozet.toplamAsn": "ASN monitorizados",
    "ozet.enRiskliAsn": "ASN más arriesgado",
    "ozet.enRiskliAsnRisk": "ASN más arriesgado · riesgo {n}",

    "sekme.ulke": "Riesgo por país",
    "sekme.asn": "Riesgo por ASN",
    "arama.ulke": "Buscar país…",
    "arama.asn": "Buscar ASN / operador…",
    "arama.aria": "Buscar en la tabla de riesgo",
    "filtre.yalnizYuksek": "Solo alto riesgo",

    "ulke.th.no": "#",
    "ulke.th.ulke": "País",
    "ulke.th.risk": "Riesgo",
    "ulke.th.toplamEngel": "Total / Bloqueado",
    "ulke.th.botOran": "Tasa de bots",
    "ulke.th.baskinSinif": "Clase dominante",
    "ulke.th.tekilIp": "IP únicas",
    "ulke.th.aksiyon": "Acción",
    "ulke.bos": "Ningún país coincidente.",

    "asn.uyari":
      "Los ASN con la etiqueta Datacenter/hosting requieren atención: los usuarios finales legítimos vienen de ISP móviles/de banda ancha, no de centros de datos. Cuando el tráfico de un ASN se origina en un datacenter, casi siempre es automatización (scraper, navegador headless, agente de IA).",
    "asn.th.no": "#",
    "asn.th.asn": "ASN / operador",
    "asn.th.risk": "Riesgo",
    "asn.th.toplamEngel": "Total / Bloqueado",
    "asn.th.botOran": "Tasa de bots",
    "asn.th.kotuItibar": "IP con mala reputación",
    "asn.th.aksiyon": "Acción",
    "asn.bos": "Ningún ASN coincidente.",
    "asn.datacenterRozet": "Datacenter/Hosting",
    "asn.baskin": "Dominante: {n}",
    "asn.datacenterSayi": "{n} datacenter",

    "aksiyon.kuralOlustur": "Crear regla",

    "aciklama.baslik": "¿Cómo se calcula y se usa la puntuación de riesgo?",
    "aciklama.dortSinyal": "La puntuación de riesgo (0–100) se deriva de cuatro señales",
    "aciklama.botOran": "Tasa de bots — la proporción de eventos de clase bot (la señal más dominante).",
    "aciklama.engelOran": "Tasa de bloqueo — la proporción de veredictos blocked + challenged.",
    "aciklama.dusukInsan": "Puntuación de humanidad baja — cuanto más baja sea la puntuación media de humanidad, mayor será el riesgo.",
    "aciklama.hacim": "Volumen — logarítmico; muchas solicitudes elevan ligeramente el riesgo.",
    "aciklama.asnEkSinyal": "Señal adicional en los ASN: reputación de IP",
    "aciklama.asnMetin":
      "¿Cuántas de las IP únicas de un ASN tienen reputación datacenter / tor / vpn / malicious? Las personas legítimas no vienen de centros de datos; por eso los ASN con fuerte peso datacenter/hosting (DigitalOcean, AWS, Hetzner, OVH…) conllevan mayor riesgo y se marcan automáticamente con la insignia Datacenter/Hosting.",
    "aciklama.nasilAksiyon": "¿Cómo convertirlo en acción?",
    "aciklama.allowlist": "Añade tus mercados reales a la allowlist — libera el paso a países de bajo riesgo, con fuerte presencia humana.",
    "aciklama.challenge": "Aplica challenge a las geografías altas/críticas — pide verificación antes de bloquear.",
    "aciklama.datacenterBlock": "Bloquea/aplica challenge a los ASN datacenter/hosting — bajo riesgo de perder usuarios legítimos, alta ganancia al cortar bots.",
    "aciklama.kuralNot": "El enlace Crear regla de cada fila te lleva al generador de reglas avanzado con ese país/ASN preseleccionado.",
    "aciklama.gelismisKural": "Crear regla avanzada",
    "aciklama.kurallar": "Reglas",

    "seviye.dusuk": "Bajo",
    "seviye.orta": "Medio",
    "seviye.yuksek": "Alto",
    "seviye.kritik": "Crítico",

    "bot.human": "Humano",
    "bot.good_bot": "Bot bueno",
    "bot.automation": "Automatización",
    "bot.scraper": "Scraper",
    "bot.credential_stuffing": "Relleno de credenciales",
    "bot.ai_agent": "Agente de IA",
    "bot.ddos": "DDoS",
    "bot.spam": "Spam",
  },
};

export function geoRiskCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
