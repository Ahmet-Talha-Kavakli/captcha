/**
 * Saldırgan İlişki Grafiği sayfası — yerel çeviri sözlüğü.
 *
 * Sadece bu sayfaya özgü kullanıcı-görünür metinleri içerir. Paylaşılan
 * `src/lib/i18n/panel.ts` sözlüğüne DOKUNMAZ. Anahtar bulunamazsa TR'ye,
 * o da yoksa anahtarın kendisine düşer (eksik çeviri asla boş görünmez).
 *
 * Enum güvenliği: küme boyutu ("tekil/kucuk/orta/buyuk") ve bot sınıfı
 * ("human/scraper/ddos"…) enum DEĞERLERİ asla çevrilmez; yalnızca
 * "graf.boyut.<deger>" / "graf.bot.<deger>" anahtarlarıyla render sırasında
 * etiketlenir. IP/ASN/ülke/parmak izi/skor/sayı veridir; {n} yer tutucusuyla
 * araya sokulur. "Neden bağlı" bağ etiketleri lib'den gelen serbest metindir
 * (parmak izi/ASN köküyle), veri gibi olduğu-gibi gösterilir.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // Sayfa başlığı (kırıntı nav.graph'tan gelir; başlık ondan farklı)
    "graf.baslik": "Saldırgan İlişki Grafiği",

    // Açıklama şeridi
    "graf.aciklama.baslik": "Tek IP yanıltır — ağ gerçeği gösterir.",
    "graf.aciklama.metin":
      "Bir botnet onlarca IP kullanır ama aynı cihaz parmak izini veya ASN'i paylaşır. Veylify olayları birleşik-bul (union-find) ile kümeler; bağlı IP'ler = tek koordineli düşman. Aşağıda tespit edilen saldırgan ağları.",

    // Özet kartları
    "graf.ozet.tespitKume": "Tespit edilen küme",
    "graf.ozet.botnet": "Botnet (≥3 IP)",
    "graf.ozet.enBuyukAg": "En büyük ağ (IP)",
    "graf.ozet.iliskiliIp": "İlişkili IP",

    // Ağ görünümü paneli
    "graf.ag.baslik": "Ağ görünümü",
    "graf.ag.baslikSayi": "Ağ görünümü — {n} IP",
    "graf.ag.tekil": "Bu bir tekil saldırgan — bağlı ağ yok.",
    "graf.ag.tekilAlt": "Çok-IP'li bir küme seçince ağ topolojisi burada çizilir.",
    "graf.ag.nedenBagli": "Neden bağlı:",
    "graf.ag.tekilBag": "Tekil — paylaşılan bağ yok",
    "graf.ag.svgEtiket": "{n} IP'li saldırgan ağı",
    "graf.ag.gizliIp": "+{n} IP daha",

    // Küme listesi paneli
    "graf.liste.baslik": "Saldırgan kümeleri",
    "graf.liste.ara": "IP / ASN / ülke ara…",
    "graf.liste.araEtiket": "Küme ara",
    "graf.liste.ipRozet": "{n} IP",
    "graf.liste.bosSonuc": "Küme bulunamadı.",

    // Küme istihbaratı paneli
    "graf.detay.baslik": "Küme istihbaratı",
    "graf.detay.ipler": "IP'ler ({n})",
    "graf.detay.asnler": "ASN'ler",
    "graf.detay.toplamOlay": "Toplam olay",
    "graf.detay.engellenen": "Engellenen",
    "graf.detay.engellenenDeger": "{n} (%{yuzde})",
    "graf.detay.minSkor": "Min skor",
    "graf.detay.tehditSkoru": "Tehdit skoru",
    "graf.detay.parmakIziCesidi": "Parmak izi çeşidi",

    // Koordineli ağ uyarısı
    "graf.uyari.metin":
      "Bu koordineli bir ağ. Tek tek IP engellemek yetersiz — ASN veya parmak izi tabanlı bir kural tüm kümeyi tek seferde durdurur.",
    "graf.uyari.metinOnce": "Bu koordineli bir ağ. Tek tek IP engellemek yetersiz — ",
    "graf.uyari.metinVurgu": "ASN veya parmak izi tabanlı bir kural",
    "graf.uyari.metinSonra": " tüm kümeyi tek seferde durdurur. ",
    "graf.uyari.kuralOlustur": "Gelişmiş kural oluştur",

    // Küme boyutu enum etiketleri (BOYUT_ETIKET yeniden türetimi)
    "graf.boyut.tekil": "Tekil",
    "graf.boyut.kucuk": "Küçük küme",
    "graf.boyut.orta": "Orta küme",
    "graf.boyut.buyuk": "Büyük ağ",

    // Bot sınıfı enum etiketleri
    "graf.bot.human": "İnsan",
    "graf.bot.good_bot": "İyi bot",
    "graf.bot.automation": "Otomasyon",
    "graf.bot.scraper": "Kazıyıcı",
    "graf.bot.credential_stuffing": "Kimlik doldurma",
    "graf.bot.ai_agent": "AI ajan",
    "graf.bot.ddos": "DDoS",
    "graf.bot.spam": "Spam",
  },

  en: {
    "graf.baslik": "Attacker Relationship Graph",

    "graf.aciklama.baslik": "A single IP misleads — the network reveals the truth.",
    "graf.aciklama.metin":
      "A botnet uses dozens of IPs but shares the same device fingerprint or ASN. Veylify clusters events with union-find; connected IPs = one coordinated adversary. The detected attacker networks are below.",

    "graf.ozet.tespitKume": "Detected clusters",
    "graf.ozet.botnet": "Botnet (≥3 IPs)",
    "graf.ozet.enBuyukAg": "Largest network (IPs)",
    "graf.ozet.iliskiliIp": "Linked IPs",

    "graf.ag.baslik": "Network view",
    "graf.ag.baslikSayi": "Network view — {n} IPs",
    "graf.ag.tekil": "This is a lone attacker — no connected network.",
    "graf.ag.tekilAlt": "Select a multi-IP cluster to draw its network topology here.",
    "graf.ag.nedenBagli": "Why linked:",
    "graf.ag.tekilBag": "Standalone — no shared link",
    "graf.ag.svgEtiket": "Attacker network of {n} IPs",
    "graf.ag.gizliIp": "+{n} more IPs",

    "graf.liste.baslik": "Attacker clusters",
    "graf.liste.ara": "Search IP / ASN / country…",
    "graf.liste.araEtiket": "Search clusters",
    "graf.liste.ipRozet": "{n} IPs",
    "graf.liste.bosSonuc": "No clusters found.",

    "graf.detay.baslik": "Cluster intelligence",
    "graf.detay.ipler": "IPs ({n})",
    "graf.detay.asnler": "ASNs",
    "graf.detay.toplamOlay": "Total events",
    "graf.detay.engellenen": "Blocked",
    "graf.detay.engellenenDeger": "{n} ({yuzde}%)",
    "graf.detay.minSkor": "Min score",
    "graf.detay.tehditSkoru": "Threat score",
    "graf.detay.parmakIziCesidi": "Fingerprint variants",

    "graf.uyari.metin":
      "This is a coordinated network. Blocking IPs one by one is not enough — an ASN- or fingerprint-based rule stops the whole cluster at once.",
    "graf.uyari.metinOnce": "This is a coordinated network. Blocking IPs one by one is not enough — ",
    "graf.uyari.metinVurgu": "an ASN- or fingerprint-based rule",
    "graf.uyari.metinSonra": " stops the whole cluster at once. ",
    "graf.uyari.kuralOlustur": "Create advanced rule",

    "graf.boyut.tekil": "Standalone",
    "graf.boyut.kucuk": "Small cluster",
    "graf.boyut.orta": "Medium cluster",
    "graf.boyut.buyuk": "Large network",

    "graf.bot.human": "Human",
    "graf.bot.good_bot": "Good bot",
    "graf.bot.automation": "Automation",
    "graf.bot.scraper": "Scraper",
    "graf.bot.credential_stuffing": "Credential stuffing",
    "graf.bot.ai_agent": "AI agent",
    "graf.bot.ddos": "DDoS",
    "graf.bot.spam": "Spam",
  },

  de: {
    "graf.baslik": "Angreifer-Beziehungsgraph",

    "graf.aciklama.baslik": "Eine einzelne IP täuscht — das Netzwerk zeigt die Wahrheit.",
    "graf.aciklama.metin":
      "Ein Botnetz nutzt Dutzende IPs, teilt aber denselben Geräte-Fingerabdruck oder dasselbe ASN. Veylify gruppiert Ereignisse per Union-Find; verbundene IPs = ein koordinierter Gegner. Die erkannten Angreifer-Netzwerke sind unten aufgeführt.",

    "graf.ozet.tespitKume": "Erkannte Cluster",
    "graf.ozet.botnet": "Botnetz (≥3 IPs)",
    "graf.ozet.enBuyukAg": "Größtes Netzwerk (IPs)",
    "graf.ozet.iliskiliIp": "Verknüpfte IPs",

    "graf.ag.baslik": "Netzwerkansicht",
    "graf.ag.baslikSayi": "Netzwerkansicht — {n} IPs",
    "graf.ag.tekil": "Dies ist ein Einzelangreifer — kein verbundenes Netzwerk.",
    "graf.ag.tekilAlt": "Wählen Sie einen Cluster mit mehreren IPs, um hier die Netzwerktopologie zu zeichnen.",
    "graf.ag.nedenBagli": "Grund der Verknüpfung:",
    "graf.ag.tekilBag": "Eigenständig — keine geteilte Verbindung",
    "graf.ag.svgEtiket": "Angreifer-Netzwerk mit {n} IPs",
    "graf.ag.gizliIp": "+{n} weitere IPs",

    "graf.liste.baslik": "Angreifer-Cluster",
    "graf.liste.ara": "IP / ASN / Land suchen…",
    "graf.liste.araEtiket": "Cluster suchen",
    "graf.liste.ipRozet": "{n} IPs",
    "graf.liste.bosSonuc": "Keine Cluster gefunden.",

    "graf.detay.baslik": "Cluster-Aufklärung",
    "graf.detay.ipler": "IPs ({n})",
    "graf.detay.asnler": "ASNs",
    "graf.detay.toplamOlay": "Ereignisse gesamt",
    "graf.detay.engellenen": "Blockiert",
    "graf.detay.engellenenDeger": "{n} ({yuzde} %)",
    "graf.detay.minSkor": "Min-Wert",
    "graf.detay.tehditSkoru": "Bedrohungswert",
    "graf.detay.parmakIziCesidi": "Fingerabdruck-Varianten",

    "graf.uyari.metin":
      "Dies ist ein koordiniertes Netzwerk. IPs einzeln zu blockieren reicht nicht — eine ASN- oder Fingerabdruck-basierte Regel stoppt den gesamten Cluster auf einmal.",
    "graf.uyari.metinOnce":
      "Dies ist ein koordiniertes Netzwerk. IPs einzeln zu blockieren reicht nicht — ",
    "graf.uyari.metinVurgu": "eine ASN- oder Fingerabdruck-basierte Regel",
    "graf.uyari.metinSonra": " stoppt den gesamten Cluster auf einmal. ",
    "graf.uyari.kuralOlustur": "Erweiterte Regel erstellen",

    "graf.boyut.tekil": "Eigenständig",
    "graf.boyut.kucuk": "Kleiner Cluster",
    "graf.boyut.orta": "Mittlerer Cluster",
    "graf.boyut.buyuk": "Großes Netzwerk",

    "graf.bot.human": "Mensch",
    "graf.bot.good_bot": "Guter Bot",
    "graf.bot.automation": "Automatisierung",
    "graf.bot.scraper": "Scraper",
    "graf.bot.credential_stuffing": "Credential Stuffing",
    "graf.bot.ai_agent": "KI-Agent",
    "graf.bot.ddos": "DDoS",
    "graf.bot.spam": "Spam",
  },

  fr: {
    "graf.baslik": "Graphe des relations d'attaquants",

    "graf.aciklama.baslik": "Une seule IP induit en erreur — le réseau révèle la vérité.",
    "graf.aciklama.metin":
      "Un botnet utilise des dizaines d'IP mais partage la même empreinte d'appareil ou le même ASN. Veylify regroupe les événements par union-find ; les IP connectées = un seul adversaire coordonné. Les réseaux d'attaquants détectés figurent ci-dessous.",

    "graf.ozet.tespitKume": "Clusters détectés",
    "graf.ozet.botnet": "Botnet (≥3 IP)",
    "graf.ozet.enBuyukAg": "Plus grand réseau (IP)",
    "graf.ozet.iliskiliIp": "IP liées",

    "graf.ag.baslik": "Vue réseau",
    "graf.ag.baslikSayi": "Vue réseau — {n} IP",
    "graf.ag.tekil": "Il s'agit d'un attaquant isolé — aucun réseau connecté.",
    "graf.ag.tekilAlt": "Sélectionnez un cluster multi-IP pour tracer ici sa topologie réseau.",
    "graf.ag.nedenBagli": "Raison du lien :",
    "graf.ag.tekilBag": "Autonome — aucun lien partagé",
    "graf.ag.svgEtiket": "Réseau d'attaquants de {n} IP",
    "graf.ag.gizliIp": "+{n} IP de plus",

    "graf.liste.baslik": "Clusters d'attaquants",
    "graf.liste.ara": "Rechercher IP / ASN / pays…",
    "graf.liste.araEtiket": "Rechercher un cluster",
    "graf.liste.ipRozet": "{n} IP",
    "graf.liste.bosSonuc": "Aucun cluster trouvé.",

    "graf.detay.baslik": "Renseignement sur le cluster",
    "graf.detay.ipler": "IP ({n})",
    "graf.detay.asnler": "ASN",
    "graf.detay.toplamOlay": "Événements totaux",
    "graf.detay.engellenen": "Bloqués",
    "graf.detay.engellenenDeger": "{n} ({yuzde} %)",
    "graf.detay.minSkor": "Score min.",
    "graf.detay.tehditSkoru": "Score de menace",
    "graf.detay.parmakIziCesidi": "Variantes d'empreinte",

    "graf.uyari.metin":
      "Il s'agit d'un réseau coordonné. Bloquer les IP une par une ne suffit pas — une règle basée sur l'ASN ou l'empreinte arrête tout le cluster d'un coup.",
    "graf.uyari.metinOnce":
      "Il s'agit d'un réseau coordonné. Bloquer les IP une par une ne suffit pas — ",
    "graf.uyari.metinVurgu": "une règle basée sur l'ASN ou l'empreinte",
    "graf.uyari.metinSonra": " arrête tout le cluster d'un coup. ",
    "graf.uyari.kuralOlustur": "Créer une règle avancée",

    "graf.boyut.tekil": "Autonome",
    "graf.boyut.kucuk": "Petit cluster",
    "graf.boyut.orta": "Cluster moyen",
    "graf.boyut.buyuk": "Grand réseau",

    "graf.bot.human": "Humain",
    "graf.bot.good_bot": "Bon bot",
    "graf.bot.automation": "Automatisation",
    "graf.bot.scraper": "Scraper",
    "graf.bot.credential_stuffing": "Bourrage d'identifiants",
    "graf.bot.ai_agent": "Agent IA",
    "graf.bot.ddos": "DDoS",
    "graf.bot.spam": "Spam",
  },

  es: {
    "graf.baslik": "Grafo de relaciones de atacantes",

    "graf.aciklama.baslik": "Una sola IP engaña — la red revela la verdad.",
    "graf.aciklama.metin":
      "Una botnet usa decenas de IP pero comparte la misma huella de dispositivo o el mismo ASN. Veylify agrupa los eventos con union-find; las IP conectadas = un único adversario coordinado. Las redes de atacantes detectadas están abajo.",

    "graf.ozet.tespitKume": "Clústeres detectados",
    "graf.ozet.botnet": "Botnet (≥3 IP)",
    "graf.ozet.enBuyukAg": "Red más grande (IP)",
    "graf.ozet.iliskiliIp": "IP vinculadas",

    "graf.ag.baslik": "Vista de red",
    "graf.ag.baslikSayi": "Vista de red — {n} IP",
    "graf.ag.tekil": "Es un atacante solitario — sin red conectada.",
    "graf.ag.tekilAlt": "Selecciona un clúster con varias IP para dibujar aquí su topología de red.",
    "graf.ag.nedenBagli": "Motivo del vínculo:",
    "graf.ag.tekilBag": "Independiente — sin vínculo compartido",
    "graf.ag.svgEtiket": "Red de atacantes de {n} IP",
    "graf.ag.gizliIp": "+{n} IP más",

    "graf.liste.baslik": "Clústeres de atacantes",
    "graf.liste.ara": "Buscar IP / ASN / país…",
    "graf.liste.araEtiket": "Buscar clúster",
    "graf.liste.ipRozet": "{n} IP",
    "graf.liste.bosSonuc": "No se encontraron clústeres.",

    "graf.detay.baslik": "Inteligencia del clúster",
    "graf.detay.ipler": "IP ({n})",
    "graf.detay.asnler": "ASN",
    "graf.detay.toplamOlay": "Eventos totales",
    "graf.detay.engellenen": "Bloqueados",
    "graf.detay.engellenenDeger": "{n} ({yuzde} %)",
    "graf.detay.minSkor": "Puntuación mín.",
    "graf.detay.tehditSkoru": "Puntuación de amenaza",
    "graf.detay.parmakIziCesidi": "Variantes de huella",

    "graf.uyari.metin":
      "Es una red coordinada. Bloquear IP una por una no basta — una regla basada en ASN o huella detiene todo el clúster de una vez.",
    "graf.uyari.metinOnce":
      "Es una red coordinada. Bloquear IP una por una no basta — ",
    "graf.uyari.metinVurgu": "una regla basada en ASN o huella",
    "graf.uyari.metinSonra": " detiene todo el clúster de una vez. ",
    "graf.uyari.kuralOlustur": "Crear regla avanzada",

    "graf.boyut.tekil": "Independiente",
    "graf.boyut.kucuk": "Clúster pequeño",
    "graf.boyut.orta": "Clúster medio",
    "graf.boyut.buyuk": "Red grande",

    "graf.bot.human": "Humano",
    "graf.bot.good_bot": "Bot bueno",
    "graf.bot.automation": "Automatización",
    "graf.bot.scraper": "Scraper",
    "graf.bot.credential_stuffing": "Relleno de credenciales",
    "graf.bot.ai_agent": "Agente de IA",
    "graf.bot.ddos": "DDoS",
    "graf.bot.spam": "Spam",
  },
};

/** Bu sayfaya özgü çeviri anahtarını çöz (TR yedeğiyle). */
export function grafCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
