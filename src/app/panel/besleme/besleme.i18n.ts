/**
 * Tehdit İstihbarat Beslemeleri — yerel i18n sözlüğü.
 *
 * Panel deseni: düz sözlük + `beslemeCeviri(anahtar, dil)` (dil→TR→anahtar düşüşü).
 *
 * ENUM/LIB GÜVENLİĞİ:
 *  - `kaynak` enum'u (tor/vpn/datacenter/bulletproof/botnet/spam/scanner) asla
 *    çevrilmez. Besleme kaynağı ETİKETLERİ "kaynak.<enum>" KEY-MAP'inden türetilir.
 *  - Lib (`threat-feed.ts`) her besleme kaydını SABİT TR `ad`/`aciklama` ile üretir;
 *    lib DÜZENLENMEDEN, `kaynak` enum'u stabil id olarak kullanılıp besleme adı
 *    ("besleme.<kaynak>.ad") ve açıklaması ("besleme.<kaynak>.aciklama") buradan
 *    yeniden türetilir. IP/ASN/ülke/kayıt sayısı/güven yüzdesi veridir; korunur.
 *  - Tazelik ("gün önce") metinleri `{n}` ile interpolasyonla kurulur.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    "x.baslik": "Tehdit Beslemeleri",
    "x.kirinti": "Tehdit Beslemeleri",

    // tanıtım şeridi
    "intro.baslik": "Bilinen kötü altyapıyı gerçek-zamanlı istihbaratla yakala.",
    "intro.metin":
      "Tehdit beslemeleri; Tor çıkış düğümleri, botnet C2, kurşun-geçirmez barındırma, VPN/proxy ve tarayıcı IP/ASN'lerini kataloglar. Bir IP bir beslemeye uyduğunda itibarı yükselir, ghost-font zorluğu artar ve kurallar tetiklenebilir.",

    // özet kartları
    "ozet.toplamKayit": "Toplam besleme kaydı",
    "ozet.aktifBesleme": "Aktif besleme kaynağı",
    "ozet.eslesenIp": "Trafiğinde eşleşen IP",
    "ozet.enGuncel": "En güncel senkron",
    "ozet.bugun": "Bugün",

    // besleme kaynağı ETİKETLERİ (KAYNAK_META.etiket — enum key-map)
    "kaynak.tor": "Anonimleştirme",
    "kaynak.vpn": "VPN / Proxy",
    "kaynak.datacenter": "Veri merkezi",
    "kaynak.bulletproof": "Kötüye kullanım",
    "kaynak.botnet": "Botnet C2",
    "kaynak.spam": "Spam",
    "kaynak.scanner": "Tarayıcı",

    // besleme adları (lib ad — enum key-map)
    "besleme.tor.ad": "Tor Çıkış Düğümleri",
    "besleme.bulletproof.ad": "Kurşun-geçirmez Barındırma",
    "besleme.botnet.ad": "Aktif Botnet C2",
    "besleme.vpn.ad": "Ticari VPN/Proxy",
    "besleme.datacenter.ad": "Veri Merkezi Aralıkları",
    "besleme.scanner.ad": "İnternet Tarayıcıları",
    "besleme.spam.ad": "Spam Kaynakları",

    // besleme açıklamaları (lib aciklama — enum key-map)
    "besleme.tor.aciklama": "Tor ağının bilinen çıkış IP'leri — anonimleştirme.",
    "besleme.bulletproof.aciklama": "Kötüye kullanım şikayetlerini yok sayan ASN'ler (Flokinet, vb.).",
    "besleme.botnet.aciklama": "Bilinen komuta-kontrol ve zombi ağı IP'leri.",
    "besleme.vpn.aciklama": "Bilinen VPN ve proxy sağlayıcı IP aralıkları.",
    "besleme.datacenter.aciklama": "Konut olmayan bulut/hosting IP'leri (AWS/GCP/OVH).",
    "besleme.scanner.aciklama": "Kütle port/zafiyet tarayan bilinen kaynaklar.",
    "besleme.spam.aciklama": "Spamhaus/DBL benzeri bilinen spam gönderen IP'ler.",

    // katalog paneli
    "katalog.baslik": "Besleme kataloğu",
    "katalog.canliSenkron": "Canlı senkron",
    "kart.canli": "canlı",
    "kart.kayit": "kayıt",
    "kart.guven": "güven",
    "kart.eslesme": "{n} eşleşme",
    "kart.trafikYok": "trafiğinde yok",

    // tazelik
    "taze.bugun": "bugün senkronlandı",
    "taze.birGun": "1 gün önce",
    "taze.gun": "{n} gün önce",

    // tablo
    "kol.ip": "IP adresi",
    "kol.ulke": "Ülke",
    "kol.asn": "ASN",
    "kol.eslesenBesleme": "Eşleşen besleme",
    "kol.tehditSkoru": "Tehdit skoru",
    "kol.istekEngel": "İstek / Engel",
    "tablo.baslik": "Beslemede eşleşen IP'ler",
    "tablo.aciklama":
      "Kendi trafiğinde gözlemlenen ve bir tehdit beslemesine uyan kötü-niyetli IP'ler. Satırdan adli incelemeye geç.",
    "tablo.rozet": "{n} eşleşen IP",
    "tablo.ara": "IP, ülke veya ASN ara…",
    "tablo.bos": "Trafiğinde bir tehdit beslemesine uyan IP henüz yok. İyi haber.",

    // nasıl çalışır
    "nasil.baslik": "Beslemeler nasıl çalışır",
    "nasil.1.baslik": "1 · Besleme senkronu",
    "nasil.1.metin":
      "Tor, botnet, bulletproof, VPN/proxy, veri merkezi, tarayıcı ve spam katalogları düzenli olarak güncellenir.",
    "nasil.2.baslik": "2 · İtibar zenginleştirme",
    "nasil.2.metin":
      "Bir IP/ASN bir beslemeye uyduğunda tehdit itibarı yükselir; eşleşen kaynağın güveni skoru belirler.",
    "nasil.3.baslik": "3 · Ghost-font zorluğu",
    "nasil.3.metin":
      "Yüksek tehdit skoru, ghost-font (zamansal titreme) zorluğunu yükseltir — botlar için okunması imkânsızlaşır.",
    "nasil.4.baslik": "4 · Kural tetikleme",
    "nasil.4.metin":
      "Skor eşiği aşıldığında kurallar devreye girer: challenge, engelle veya işaretle. Karar milisaniyeler içinde.",
    "nasil.uclar": "Boru hattını uçlarından incele:",
    "nasil.link.zorluk": "Ghost-font zorluğu",
    "nasil.link.kurallar": "Kural motoru",
    "nasil.link.tehdit": "Tehdit istihbaratı",

    // dürüstlük notu
    "not.metin":
      "Bu beslemeler <b>Veylify tarafından derlenmiş</b> temsili istihbarat kataloglarıdır ve düzenli olarak güncellenir. Üretimde bu kaynaklar Spamhaus, AbuseIPDB, Tor Project ve FireHOL gibi beslemelerden periyodik senkronlanabilir; buradaki katalog gerçekçi ama simülasyondur ve canlı bir üçüncü-taraf aboneliği temsil etmez.",
  },

  en: {
    "x.baslik": "Threat Feeds",
    "x.kirinti": "Threat Feeds",

    "intro.baslik": "Catch known-bad infrastructure with real-time intelligence.",
    "intro.metin":
      "Threat feeds catalog Tor exit nodes, botnet C2, bulletproof hosting, VPN/proxy and scanner IPs/ASNs. When an IP matches a feed, its reputation rises, the ghost-font challenge hardens and rules can fire.",

    "ozet.toplamKayit": "Total feed records",
    "ozet.aktifBesleme": "Active feed sources",
    "ozet.eslesenIp": "Matched IPs in your traffic",
    "ozet.enGuncel": "Latest sync",
    "ozet.bugun": "Today",

    "kaynak.tor": "Anonymization",
    "kaynak.vpn": "VPN / Proxy",
    "kaynak.datacenter": "Data center",
    "kaynak.bulletproof": "Abuse",
    "kaynak.botnet": "Botnet C2",
    "kaynak.spam": "Spam",
    "kaynak.scanner": "Scanner",

    "besleme.tor.ad": "Tor Exit Nodes",
    "besleme.bulletproof.ad": "Bulletproof Hosting",
    "besleme.botnet.ad": "Active Botnet C2",
    "besleme.vpn.ad": "Commercial VPN/Proxy",
    "besleme.datacenter.ad": "Data Center Ranges",
    "besleme.scanner.ad": "Internet Scanners",
    "besleme.spam.ad": "Spam Sources",

    "besleme.tor.aciklama": "Known exit IPs of the Tor network — anonymization.",
    "besleme.bulletproof.aciklama": "ASNs that ignore abuse complaints (Flokinet, etc.).",
    "besleme.botnet.aciklama": "Known command-and-control and zombie network IPs.",
    "besleme.vpn.aciklama": "Known VPN and proxy provider IP ranges.",
    "besleme.datacenter.aciklama": "Non-residential cloud/hosting IPs (AWS/GCP/OVH).",
    "besleme.scanner.aciklama": "Known sources doing mass port/vulnerability scanning.",
    "besleme.spam.aciklama": "Known spam-sending IPs, Spamhaus/DBL style.",

    "katalog.baslik": "Feed catalog",
    "katalog.canliSenkron": "Live sync",
    "kart.canli": "live",
    "kart.kayit": "records",
    "kart.guven": "confidence",
    "kart.eslesme": "{n} matches",
    "kart.trafikYok": "not in your traffic",

    "taze.bugun": "synced today",
    "taze.birGun": "1 day ago",
    "taze.gun": "{n} days ago",

    "kol.ip": "IP address",
    "kol.ulke": "Country",
    "kol.asn": "ASN",
    "kol.eslesenBesleme": "Matched feed",
    "kol.tehditSkoru": "Threat score",
    "kol.istekEngel": "Requests / Blocked",
    "tablo.baslik": "IPs matched in feeds",
    "tablo.aciklama":
      "Malicious IPs observed in your own traffic that match a threat feed. Jump from a row to forensic review.",
    "tablo.rozet": "{n} matched IPs",
    "tablo.ara": "Search IP, country or ASN…",
    "tablo.bos": "No IP in your traffic matches a threat feed yet. Good news.",

    "nasil.baslik": "How feeds work",
    "nasil.1.baslik": "1 · Feed sync",
    "nasil.1.metin":
      "The Tor, botnet, bulletproof, VPN/proxy, data center, scanner and spam catalogs are updated regularly.",
    "nasil.2.baslik": "2 · Reputation enrichment",
    "nasil.2.metin":
      "When an IP/ASN matches a feed, its threat reputation rises; the matched source's confidence sets the score.",
    "nasil.3.baslik": "3 · Ghost-font challenge",
    "nasil.3.metin":
      "A high threat score raises the ghost-font (temporal dithering) challenge — making it impossible for bots to read.",
    "nasil.4.baslik": "4 · Rule triggering",
    "nasil.4.metin":
      "When the score threshold is exceeded, rules kick in: challenge, block or flag. The decision takes milliseconds.",
    "nasil.uclar": "Inspect the pipeline from its endpoints:",
    "nasil.link.zorluk": "Ghost-font challenge",
    "nasil.link.kurallar": "Rule engine",
    "nasil.link.tehdit": "Threat intelligence",

    "not.metin":
      "These feeds are representative intelligence catalogs <b>compiled by Veylify</b> and are updated regularly. In production these sources can be synced periodically from feeds like Spamhaus, AbuseIPDB, Tor Project and FireHOL; the catalog here is realistic but a simulation and does not represent a live third-party subscription.",
  },

  de: {
    "x.baslik": "Bedrohungs-Feeds",
    "x.kirinti": "Bedrohungs-Feeds",

    "intro.baslik": "Bekannte bösartige Infrastruktur mit Echtzeit-Intelligenz aufspüren.",
    "intro.metin":
      "Bedrohungs-Feeds katalogisieren Tor-Exit-Nodes, Botnet-C2, Bulletproof-Hosting, VPN/Proxy- und Scanner-IPs/ASNs. Trifft eine IP auf einen Feed zu, steigt ihre Reputation, die Ghost-Font-Challenge wird härter und Regeln können auslösen.",

    "ozet.toplamKayit": "Feed-Datensätze gesamt",
    "ozet.aktifBesleme": "Aktive Feed-Quellen",
    "ozet.eslesenIp": "Getroffene IPs in Ihrem Verkehr",
    "ozet.enGuncel": "Letzte Synchronisation",
    "ozet.bugun": "Heute",

    "kaynak.tor": "Anonymisierung",
    "kaynak.vpn": "VPN / Proxy",
    "kaynak.datacenter": "Rechenzentrum",
    "kaynak.bulletproof": "Missbrauch",
    "kaynak.botnet": "Botnet-C2",
    "kaynak.spam": "Spam",
    "kaynak.scanner": "Scanner",

    "besleme.tor.ad": "Tor-Exit-Nodes",
    "besleme.bulletproof.ad": "Bulletproof-Hosting",
    "besleme.botnet.ad": "Aktives Botnet-C2",
    "besleme.vpn.ad": "Kommerzielles VPN/Proxy",
    "besleme.datacenter.ad": "Rechenzentrums-Bereiche",
    "besleme.scanner.ad": "Internet-Scanner",
    "besleme.spam.ad": "Spam-Quellen",

    "besleme.tor.aciklama": "Bekannte Exit-IPs des Tor-Netzwerks — Anonymisierung.",
    "besleme.bulletproof.aciklama": "ASNs, die Missbrauchsbeschwerden ignorieren (Flokinet usw.).",
    "besleme.botnet.aciklama": "Bekannte Command-and-Control- und Zombie-Netz-IPs.",
    "besleme.vpn.aciklama": "Bekannte IP-Bereiche von VPN- und Proxy-Anbietern.",
    "besleme.datacenter.aciklama": "Nicht-residenzielle Cloud-/Hosting-IPs (AWS/GCP/OVH).",
    "besleme.scanner.aciklama": "Bekannte Quellen für Massen-Port-/Schwachstellen-Scans.",
    "besleme.spam.aciklama": "Bekannte Spam-versendende IPs im Spamhaus/DBL-Stil.",

    "katalog.baslik": "Feed-Katalog",
    "katalog.canliSenkron": "Live-Sync",
    "kart.canli": "live",
    "kart.kayit": "Datensätze",
    "kart.guven": "Konfidenz",
    "kart.eslesme": "{n} Treffer",
    "kart.trafikYok": "nicht in Ihrem Verkehr",

    "taze.bugun": "heute synchronisiert",
    "taze.birGun": "vor 1 Tag",
    "taze.gun": "vor {n} Tagen",

    "kol.ip": "IP-Adresse",
    "kol.ulke": "Land",
    "kol.asn": "ASN",
    "kol.eslesenBesleme": "Getroffener Feed",
    "kol.tehditSkoru": "Bedrohungswert",
    "kol.istekEngel": "Anfragen / Blockiert",
    "tablo.baslik": "In Feeds getroffene IPs",
    "tablo.aciklama":
      "In Ihrem eigenen Verkehr beobachtete bösartige IPs, die auf einen Bedrohungs-Feed zutreffen. Von einer Zeile zur forensischen Prüfung springen.",
    "tablo.rozet": "{n} getroffene IPs",
    "tablo.ara": "IP, Land oder ASN suchen…",
    "tablo.bos": "Noch keine IP in Ihrem Verkehr trifft auf einen Bedrohungs-Feed zu. Gute Nachricht.",

    "nasil.baslik": "So funktionieren Feeds",
    "nasil.1.baslik": "1 · Feed-Sync",
    "nasil.1.metin":
      "Die Kataloge für Tor, Botnet, Bulletproof, VPN/Proxy, Rechenzentrum, Scanner und Spam werden regelmäßig aktualisiert.",
    "nasil.2.baslik": "2 · Reputations-Anreicherung",
    "nasil.2.metin":
      "Trifft eine IP/ASN auf einen Feed zu, steigt ihre Bedrohungsreputation; die Konfidenz der getroffenen Quelle bestimmt den Wert.",
    "nasil.3.baslik": "3 · Ghost-Font-Challenge",
    "nasil.3.metin":
      "Ein hoher Bedrohungswert verschärft die Ghost-Font-Challenge (zeitliches Dithering) — für Bots unlesbar.",
    "nasil.4.baslik": "4 · Regelauslösung",
    "nasil.4.metin":
      "Wird der Schwellenwert überschritten, greifen Regeln: Challenge, Blockieren oder Markieren. Die Entscheidung dauert Millisekunden.",
    "nasil.uclar": "Prüfen Sie die Pipeline von ihren Endpunkten aus:",
    "nasil.link.zorluk": "Ghost-Font-Challenge",
    "nasil.link.kurallar": "Regel-Engine",
    "nasil.link.tehdit": "Bedrohungsintelligenz",

    "not.metin":
      "Diese Feeds sind repräsentative <b>von Veylify zusammengestellte</b> Intelligenz-Kataloge und werden regelmäßig aktualisiert. In der Produktion können diese Quellen periodisch aus Feeds wie Spamhaus, AbuseIPDB, Tor Project und FireHOL synchronisiert werden; der Katalog hier ist realistisch, aber eine Simulation und stellt kein Live-Abonnement eines Drittanbieters dar.",
  },

  fr: {
    "x.baslik": "Flux de menaces",
    "x.kirinti": "Flux de menaces",

    "intro.baslik": "Repérez l'infrastructure malveillante connue grâce au renseignement en temps réel.",
    "intro.metin":
      "Les flux de menaces cataloguent les nœuds de sortie Tor, les C2 de botnets, l'hébergement bulletproof, les IP/ASN de VPN/proxy et de scanners. Lorsqu'une IP correspond à un flux, sa réputation augmente, le défi ghost-font se durcit et des règles peuvent se déclencher.",

    "ozet.toplamKayit": "Total des enregistrements de flux",
    "ozet.aktifBesleme": "Sources de flux actives",
    "ozet.eslesenIp": "IP correspondantes dans votre trafic",
    "ozet.enGuncel": "Dernière synchronisation",
    "ozet.bugun": "Aujourd'hui",

    "kaynak.tor": "Anonymisation",
    "kaynak.vpn": "VPN / Proxy",
    "kaynak.datacenter": "Centre de données",
    "kaynak.bulletproof": "Abus",
    "kaynak.botnet": "C2 de botnet",
    "kaynak.spam": "Spam",
    "kaynak.scanner": "Scanner",

    "besleme.tor.ad": "Nœuds de sortie Tor",
    "besleme.bulletproof.ad": "Hébergement bulletproof",
    "besleme.botnet.ad": "C2 de botnet actif",
    "besleme.vpn.ad": "VPN/Proxy commercial",
    "besleme.datacenter.ad": "Plages de centres de données",
    "besleme.scanner.ad": "Scanners Internet",
    "besleme.spam.ad": "Sources de spam",

    "besleme.tor.aciklama": "IP de sortie connues du réseau Tor — anonymisation.",
    "besleme.bulletproof.aciklama": "ASN qui ignorent les plaintes pour abus (Flokinet, etc.).",
    "besleme.botnet.aciklama": "IP connues de commande-et-contrôle et de réseaux zombies.",
    "besleme.vpn.aciklama": "Plages d'IP connues de fournisseurs VPN et proxy.",
    "besleme.datacenter.aciklama": "IP cloud/hébergement non résidentielles (AWS/GCP/OVH).",
    "besleme.scanner.aciklama": "Sources connues effectuant du scan massif de ports/vulnérabilités.",
    "besleme.spam.aciklama": "IP émettrices de spam connues, style Spamhaus/DBL.",

    "katalog.baslik": "Catalogue de flux",
    "katalog.canliSenkron": "Sync en direct",
    "kart.canli": "en direct",
    "kart.kayit": "enregistrements",
    "kart.guven": "confiance",
    "kart.eslesme": "{n} correspondances",
    "kart.trafikYok": "absent de votre trafic",

    "taze.bugun": "synchronisé aujourd'hui",
    "taze.birGun": "il y a 1 jour",
    "taze.gun": "il y a {n} jours",

    "kol.ip": "Adresse IP",
    "kol.ulke": "Pays",
    "kol.asn": "ASN",
    "kol.eslesenBesleme": "Flux correspondant",
    "kol.tehditSkoru": "Score de menace",
    "kol.istekEngel": "Requêtes / Bloquées",
    "tablo.baslik": "IP correspondant aux flux",
    "tablo.aciklama":
      "IP malveillantes observées dans votre propre trafic qui correspondent à un flux de menaces. Passez d'une ligne à l'analyse forensique.",
    "tablo.rozet": "{n} IP correspondantes",
    "tablo.ara": "Rechercher IP, pays ou ASN…",
    "tablo.bos": "Aucune IP de votre trafic ne correspond encore à un flux de menaces. Bonne nouvelle.",

    "nasil.baslik": "Comment fonctionnent les flux",
    "nasil.1.baslik": "1 · Synchronisation des flux",
    "nasil.1.metin":
      "Les catalogues Tor, botnet, bulletproof, VPN/proxy, centre de données, scanner et spam sont mis à jour régulièrement.",
    "nasil.2.baslik": "2 · Enrichissement de réputation",
    "nasil.2.metin":
      "Lorsqu'une IP/ASN correspond à un flux, sa réputation de menace augmente ; la confiance de la source correspondante fixe le score.",
    "nasil.3.baslik": "3 · Défi ghost-font",
    "nasil.3.metin":
      "Un score de menace élevé renforce le défi ghost-font (dithering temporel) — le rendant impossible à lire pour les bots.",
    "nasil.4.baslik": "4 · Déclenchement de règles",
    "nasil.4.metin":
      "Lorsque le seuil de score est dépassé, les règles entrent en jeu : défier, bloquer ou signaler. La décision prend quelques millisecondes.",
    "nasil.uclar": "Inspectez le pipeline depuis ses extrémités :",
    "nasil.link.zorluk": "Défi ghost-font",
    "nasil.link.kurallar": "Moteur de règles",
    "nasil.link.tehdit": "Renseignement sur les menaces",

    "not.metin":
      "Ces flux sont des catalogues de renseignement représentatifs <b>compilés par Veylify</b> et sont mis à jour régulièrement. En production, ces sources peuvent être synchronisées périodiquement depuis des flux comme Spamhaus, AbuseIPDB, Tor Project et FireHOL ; le catalogue présenté ici est réaliste mais reste une simulation et ne représente pas un abonnement tiers en direct.",
  },

  es: {
    "x.baslik": "Fuentes de amenazas",
    "x.kirinti": "Fuentes de amenazas",

    "intro.baslik": "Detecta infraestructura maliciosa conocida con inteligencia en tiempo real.",
    "intro.metin":
      "Las fuentes de amenazas catalogan nodos de salida Tor, C2 de botnets, hosting bulletproof e IP/ASN de VPN/proxy y escáneres. Cuando una IP coincide con una fuente, su reputación sube, el desafío ghost-font se endurece y pueden dispararse reglas.",

    "ozet.toplamKayit": "Registros totales de fuentes",
    "ozet.aktifBesleme": "Fuentes activas",
    "ozet.eslesenIp": "IP coincidentes en tu tráfico",
    "ozet.enGuncel": "Última sincronización",
    "ozet.bugun": "Hoy",

    "kaynak.tor": "Anonimización",
    "kaynak.vpn": "VPN / Proxy",
    "kaynak.datacenter": "Centro de datos",
    "kaynak.bulletproof": "Abuso",
    "kaynak.botnet": "C2 de botnet",
    "kaynak.spam": "Spam",
    "kaynak.scanner": "Escáner",

    "besleme.tor.ad": "Nodos de salida Tor",
    "besleme.bulletproof.ad": "Hosting bulletproof",
    "besleme.botnet.ad": "C2 de botnet activo",
    "besleme.vpn.ad": "VPN/Proxy comercial",
    "besleme.datacenter.ad": "Rangos de centros de datos",
    "besleme.scanner.ad": "Escáneres de Internet",
    "besleme.spam.ad": "Fuentes de spam",

    "besleme.tor.aciklama": "IP de salida conocidas de la red Tor — anonimización.",
    "besleme.bulletproof.aciklama": "ASN que ignoran las denuncias de abuso (Flokinet, etc.).",
    "besleme.botnet.aciklama": "IP conocidas de comando y control y redes zombi.",
    "besleme.vpn.aciklama": "Rangos de IP conocidos de proveedores de VPN y proxy.",
    "besleme.datacenter.aciklama": "IP de nube/hosting no residenciales (AWS/GCP/OVH).",
    "besleme.scanner.aciklama": "Fuentes conocidas que hacen escaneo masivo de puertos/vulnerabilidades.",
    "besleme.spam.aciklama": "IP emisoras de spam conocidas, estilo Spamhaus/DBL.",

    "katalog.baslik": "Catálogo de fuentes",
    "katalog.canliSenkron": "Sincronización en vivo",
    "kart.canli": "en vivo",
    "kart.kayit": "registros",
    "kart.guven": "confianza",
    "kart.eslesme": "{n} coincidencias",
    "kart.trafikYok": "no está en tu tráfico",

    "taze.bugun": "sincronizado hoy",
    "taze.birGun": "hace 1 día",
    "taze.gun": "hace {n} días",

    "kol.ip": "Dirección IP",
    "kol.ulke": "País",
    "kol.asn": "ASN",
    "kol.eslesenBesleme": "Fuente coincidente",
    "kol.tehditSkoru": "Puntuación de amenaza",
    "kol.istekEngel": "Solicitudes / Bloqueadas",
    "tablo.baslik": "IP coincidentes en fuentes",
    "tablo.aciklama":
      "IP maliciosas observadas en tu propio tráfico que coinciden con una fuente de amenazas. Salta de una fila a la revisión forense.",
    "tablo.rozet": "{n} IP coincidentes",
    "tablo.ara": "Buscar IP, país o ASN…",
    "tablo.bos": "Todavía ninguna IP de tu tráfico coincide con una fuente de amenazas. Buenas noticias.",

    "nasil.baslik": "Cómo funcionan las fuentes",
    "nasil.1.baslik": "1 · Sincronización de fuentes",
    "nasil.1.metin":
      "Los catálogos de Tor, botnet, bulletproof, VPN/proxy, centro de datos, escáner y spam se actualizan con regularidad.",
    "nasil.2.baslik": "2 · Enriquecimiento de reputación",
    "nasil.2.metin":
      "Cuando una IP/ASN coincide con una fuente, su reputación de amenaza sube; la confianza de la fuente coincidente fija la puntuación.",
    "nasil.3.baslik": "3 · Desafío ghost-font",
    "nasil.3.metin":
      "Una puntuación de amenaza alta eleva el desafío ghost-font (dithering temporal) — haciéndolo imposible de leer para los bots.",
    "nasil.4.baslik": "4 · Activación de reglas",
    "nasil.4.metin":
      "Cuando se supera el umbral de puntuación, las reglas entran en acción: desafiar, bloquear o marcar. La decisión tarda milisegundos.",
    "nasil.uclar": "Inspecciona el pipeline desde sus extremos:",
    "nasil.link.zorluk": "Desafío ghost-font",
    "nasil.link.kurallar": "Motor de reglas",
    "nasil.link.tehdit": "Inteligencia de amenazas",

    "not.metin":
      "Estas fuentes son catálogos de inteligencia representativos <b>compilados por Veylify</b> y se actualizan con regularidad. En producción, estas fuentes pueden sincronizarse periódicamente desde fuentes como Spamhaus, AbuseIPDB, Tor Project y FireHOL; el catálogo aquí es realista pero es una simulación y no representa una suscripción de terceros en vivo.",
  },
};

export function beslemeCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
