/**
 * Kampanya İlişkilendirme sayfası — yerel çeviri sözlüğü + motor-metni yeniden türetme.
 *
 * Sadece bu sayfaya özgü kullanıcı-görünür metinleri içerir. Paylaşılan
 * `src/lib/i18n/panel.ts` DEĞİŞTİRİLMEZ. Kümeleme motoru `kumele.ts` klasör-yerel
 * olsa da metni çevirmek yerine burada, istemci tarafında yeniden türetiriz.
 * Anahtar bulunamazsa TR'ye, o da yoksa anahtarın kendisine düşer.
 *
 * MOTOR-METNİ SORUNU (kampanya adı + açıklaması)
 * ----------------------------------------------
 * `kumele.ts` her kampanya için Türkçe `ad` ("AS9009 (M247) üzerinden Kimlik-
 * Doldurma Kampanyası") ve `aciklama` üretir. Bunları düzenlemek yerine:
 *   - Kampanya ADI istemcide şablondan yeniden kurulur (kampanyaAd): ASN etiketi
 *     + sağlayıcı VERİ olarak kalır, yalnızca "… üzerinden {saldırı}" şablonu ve
 *     `botClass` → saldırı-türü etiketi çevrilir.
 *   - Açıklama da istemcide şablondan üretilir (kampanyaAciklama); sayılar
 *     (olay/IP/ASN/saat) veri olarak yerleştirilir, UA-ailesi anahtarı çevrilir.
 * Böylece `botClass` enum değeri hiçbir zaman çevrilmez; yalnızca etiketi çevrilir.
 */
import type { Dil } from "@/lib/i18n/panel";
import type { BotClass } from "@/lib/db/schema";
import type { TehditSeviyesi, KampanyaDurum, SofistikeSinyal } from "./kumele";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // Açıklama şeridi
    "kmp.serit.baslik": "Gürültü değil operasyon — olaylar tek kampanyada birleşir.",
    "kmp.serit.aciklama":
      "Tekil bot olayları, paylaştıkları saldırgan altyapısına (ASN, IP, UA-ailesi, bot sınıfı) ve zaman-patlamalarına göre koordineli kampanyalara kümelenir. Her kampanyanın bir yaşam döngüsü (ilk görülme → zirve → sönümlenme), deterministik bir adı ve sofistike/tehdit skoru vardır. Böylece \"3 gün boyunca 340 olay aslında TEK operasyon\" netleşir.",

    // Özet kartları
    "kmp.ozet.tespit": "Tespit edilen kampanya",
    "kmp.ozet.aktif": "Aktif kampanya",
    "kmp.ozet.kritik": "Kritik tehdit",
    "kmp.ozet.iliski": "İlişkilendirme oranı ({n} olaydan)",

    // Gantt
    "kmp.gantt.baslik": "Kampanya zaman çizelgesi",

    // Arama
    "kmp.ara.placeholder": "Kampanya / ASN / ülke / tehdit ara…",

    // Boş durumlar
    "kmp.bos.baslik": "Kampanya yok",
    "kmp.bos.aciklama": "Koordineli bir kampanyaya kümelenecek yeterli saldırı olayı yok — trafik dağınık ya da temiz.",
    "kmp.eslesme.baslik": "Eşleşme yok",
    "kmp.eslesme.aciklama": "Aramaya uyan kampanya yok.",

    // Kart metrikleri
    "kmp.kart.tehdit": "{s} tehdit",
    "kmp.kart.olay": "{n} olay",
    "kmp.kart.ip": "{n} IP",
    "kmp.kart.saat": "{n} saat",
    "kmp.kart.saatKisa": "<1",
    "kmp.kart.zirve": "zirve {n}",
    "kmp.kart.sofistikeSkor": "Sofistike skoru",
    "kmp.kart.aktivite": "Aktivite",

    // Genişletilmiş bölüm
    "kmp.det.sinyalBaslik": "Sofistike sinyalleri",
    "kmp.det.sinyalYok": "Belirgin gelişmişlik sinyali yok.",
    "kmp.det.ornekIp": "Örnek IP'ler",
    "kmp.det.hedefYol": "Hedef yollar",
    "kmp.det.yasamDongusu": "Yaşam döngüsü",
    "kmp.det.ilkGorulme": "İlk görülme",
    "kmp.det.zirveAni": "Zirve anı",
    "kmp.det.sonGorulme": "Son görülme",
    "kmp.det.baskinSinif": "Baskın sınıf",
    "kmp.det.asnSayisi": "ASN sayısı",
    "kmp.det.kuralOner": "Bu kampanyaya karşı kural öner",
    "kmp.det.aktorProfil": "Aktör profillemesi",

    // Dürüstlük notu
    "kmp.not":
      "Kampanyalar gerçek bot olaylarından sezgisel kümelemeyle (paylaşılan ASN/IP/UA-ailesi + zaman-patlaması) çıkarılır. Adlar ve skorlar buluşsal gruplamadır — gerçek isimli tehdit gruplarına atıf değildir. İnsan ve iyi-bot trafiği kümelemeye dahil edilmez.",

    // Tehdit seviyeleri (etiket)
    "kmp.tehdit.düşük": "düşük",
    "kmp.tehdit.orta": "orta",
    "kmp.tehdit.yüksek": "yüksek",
    "kmp.tehdit.kritik": "kritik",

    // Durum etiketleri
    "kmp.durum.aktif": "aktif",
    "kmp.durum.sönümleniyor": "sönümleniyor",
    "kmp.durum.kapandı": "kapandı",

    // Saldırı türü (botClass etiketi — kampanya adı için)
    "kmp.saldiri.human": "İnsan Trafiği",
    "kmp.saldiri.good_bot": "İyi-Bot Aktivitesi",
    "kmp.saldiri.automation": "Otomasyon Kampanyası",
    "kmp.saldiri.scraper": "İçerik Kazıma Kampanyası",
    "kmp.saldiri.credential_stuffing": "Kimlik-Doldurma Kampanyası",
    "kmp.saldiri.ai_agent": "AI-Ajan Kampanyası",
    "kmp.saldiri.ddos": "DDoS Kampanyası",
    "kmp.saldiri.spam": "Spam Kampanyası",

    // Kampanya adı şablonu
    "kmp.ad.saglayiciIle": "{asn} ({saglayici}) üzerinden {saldiri}",
    "kmp.ad.saglayicisiz": "{asn} üzerinden {saldiri}",

    // UA-ailesi etiketleri (açıklama için)
    "kmp.ua.boş-ua": "boş UA",
    "kmp.ua.python-http": "python-http",
    "kmp.ua.curl": "curl",
    "kmp.ua.go/okhttp": "go/okhttp",
    "kmp.ua.headless-tarayıcı": "headless-tarayıcı",
    "kmp.ua.selenium": "selenium",
    "kmp.ua.script-scraper": "script-scraper",
    "kmp.ua.ai-ajan": "AI-ajan",
    "kmp.ua.genel-bot": "genel bot",
    "kmp.ua.chrome-benzeri": "Chrome-benzeri",
    "kmp.ua.firefox-benzeri": "Firefox-benzeri",
    "kmp.ua.safari-benzeri": "Safari-benzeri",
    "kmp.ua.diğer": "diğer",
    "kmp.ua.bilinmeyen": "bilinmeyen",

    // Açıklama şablonu (istemci-türetimli)
    "kmp.aciklama.saatKisa": "1 saatten kısa",
    "kmp.aciklama.saatUzun": "~{n} saatlik",
    "kmp.aciklama.metin":
      "{olay} olay, {ip} IP ve {asnSay} ASN paylaşan koordineli {saldiri}. {asn} altyapısından {ua} imzasıyla, {sure} bir pencerede kümelendi.",

    // Sofistike sinyalleri (yapısal → şablon)
    "kmp.sinyal.ipCesit": "{n} benzersiz IP — dağıtık altyapı",
    "kmp.sinyal.asnCesit": "{n} farklı ASN — çok-ağ koordinasyonu",
    "kmp.sinyal.kacinma": "%{n} kaçınma sinyali (headless/TLS-UA)",
    "kmp.sinyal.hiz": "~{n} olay/saat — yüksek hız otomasyon",
    "kmp.sinyal.cografya": "{n} ülkeye yayılmış kaynak",
  },

  en: {
    "kmp.serit.baslik": "Not noise but an operation — events merge into a single campaign.",
    "kmp.serit.aciklama":
      "Individual bot events are clustered into coordinated campaigns by the attacker infrastructure they share (ASN, IP, UA family, bot class) and their time bursts. Each campaign has a lifecycle (first seen → peak → decay), a deterministic name and a sophistication/threat score. This makes it clear that \"340 events over 3 days were actually ONE operation.\"",

    "kmp.ozet.tespit": "Detected campaigns",
    "kmp.ozet.aktif": "Active campaigns",
    "kmp.ozet.kritik": "Critical threats",
    "kmp.ozet.iliski": "Attribution rate (of {n} events)",

    "kmp.gantt.baslik": "Campaign timeline",

    "kmp.ara.placeholder": "Search campaign / ASN / country / threat…",

    "kmp.bos.baslik": "No campaigns",
    "kmp.bos.aciklama": "Not enough attack events to cluster into a coordinated campaign — traffic is scattered or clean.",
    "kmp.eslesme.baslik": "No matches",
    "kmp.eslesme.aciklama": "No campaign matches your search.",

    "kmp.kart.tehdit": "{s} threat",
    "kmp.kart.olay": "{n} events",
    "kmp.kart.ip": "{n} IPs",
    "kmp.kart.saat": "{n} h",
    "kmp.kart.saatKisa": "<1",
    "kmp.kart.zirve": "peak {n}",
    "kmp.kart.sofistikeSkor": "Sophistication score",
    "kmp.kart.aktivite": "Activity",

    "kmp.det.sinyalBaslik": "Sophistication signals",
    "kmp.det.sinyalYok": "No notable sophistication signals.",
    "kmp.det.ornekIp": "Sample IPs",
    "kmp.det.hedefYol": "Targeted paths",
    "kmp.det.yasamDongusu": "Lifecycle",
    "kmp.det.ilkGorulme": "First seen",
    "kmp.det.zirveAni": "Peak moment",
    "kmp.det.sonGorulme": "Last seen",
    "kmp.det.baskinSinif": "Dominant class",
    "kmp.det.asnSayisi": "ASN count",
    "kmp.det.kuralOner": "Suggest a rule against this campaign",
    "kmp.det.aktorProfil": "Actor profiling",

    "kmp.not":
      "Campaigns are extracted from real bot events via heuristic clustering (shared ASN/IP/UA family + time burst). Names and scores are heuristic groupings — not attribution to named threat groups. Human and good-bot traffic is excluded from clustering.",

    "kmp.tehdit.düşük": "low",
    "kmp.tehdit.orta": "medium",
    "kmp.tehdit.yüksek": "high",
    "kmp.tehdit.kritik": "critical",

    "kmp.durum.aktif": "active",
    "kmp.durum.sönümleniyor": "decaying",
    "kmp.durum.kapandı": "closed",

    "kmp.saldiri.human": "Human Traffic",
    "kmp.saldiri.good_bot": "Good-Bot Activity",
    "kmp.saldiri.automation": "Automation Campaign",
    "kmp.saldiri.scraper": "Content Scraping Campaign",
    "kmp.saldiri.credential_stuffing": "Credential-Stuffing Campaign",
    "kmp.saldiri.ai_agent": "AI-Agent Campaign",
    "kmp.saldiri.ddos": "DDoS Campaign",
    "kmp.saldiri.spam": "Spam Campaign",

    "kmp.ad.saglayiciIle": "{saldiri} via {asn} ({saglayici})",
    "kmp.ad.saglayicisiz": "{saldiri} via {asn}",

    "kmp.ua.boş-ua": "empty UA",
    "kmp.ua.python-http": "python-http",
    "kmp.ua.curl": "curl",
    "kmp.ua.go/okhttp": "go/okhttp",
    "kmp.ua.headless-tarayıcı": "headless browser",
    "kmp.ua.selenium": "selenium",
    "kmp.ua.script-scraper": "script scraper",
    "kmp.ua.ai-ajan": "AI agent",
    "kmp.ua.genel-bot": "generic bot",
    "kmp.ua.chrome-benzeri": "Chrome-like",
    "kmp.ua.firefox-benzeri": "Firefox-like",
    "kmp.ua.safari-benzeri": "Safari-like",
    "kmp.ua.diğer": "other",
    "kmp.ua.bilinmeyen": "unknown",

    "kmp.aciklama.saatKisa": "less than an hour",
    "kmp.aciklama.saatUzun": "~{n} hour",
    "kmp.aciklama.metin":
      "A coordinated {saldiri} sharing {olay} events, {ip} IPs and {asnSay} ASNs. Clustered from the {asn} infrastructure with the {ua} signature within a {sure} window.",

    "kmp.sinyal.ipCesit": "{n} unique IPs — distributed infrastructure",
    "kmp.sinyal.asnCesit": "{n} distinct ASNs — multi-network coordination",
    "kmp.sinyal.kacinma": "{n}% evasion signal (headless/TLS-UA)",
    "kmp.sinyal.hiz": "~{n} events/hour — high-rate automation",
    "kmp.sinyal.cografya": "Source spread across {n} countries",
  },

  de: {
    "kmp.serit.baslik": "Kein Rauschen, sondern eine Operation — Ereignisse verschmelzen zu einer Kampagne.",
    "kmp.serit.aciklama":
      "Einzelne Bot-Ereignisse werden anhand der gemeinsamen Angreifer-Infrastruktur (ASN, IP, UA-Familie, Bot-Klasse) und ihrer Zeit-Bursts zu koordinierten Kampagnen geclustert. Jede Kampagne hat einen Lebenszyklus (erste Sichtung → Höhepunkt → Abklingen), einen deterministischen Namen und einen Raffinesse-/Bedrohungs-Score. So wird klar: \"340 Ereignisse über 3 Tage waren tatsächlich EINE Operation.\"",

    "kmp.ozet.tespit": "Erkannte Kampagnen",
    "kmp.ozet.aktif": "Aktive Kampagnen",
    "kmp.ozet.kritik": "Kritische Bedrohungen",
    "kmp.ozet.iliski": "Zuordnungsrate (von {n} Ereignissen)",

    "kmp.gantt.baslik": "Kampagnen-Zeitachse",

    "kmp.ara.placeholder": "Kampagne / ASN / Land / Bedrohung suchen…",

    "kmp.bos.baslik": "Keine Kampagnen",
    "kmp.bos.aciklama": "Nicht genügend Angriffsereignisse für eine koordinierte Kampagne — der Traffic ist verstreut oder sauber.",
    "kmp.eslesme.baslik": "Keine Treffer",
    "kmp.eslesme.aciklama": "Keine Kampagne entspricht Ihrer Suche.",

    "kmp.kart.tehdit": "Bedrohung: {s}",
    "kmp.kart.olay": "{n} Ereignisse",
    "kmp.kart.ip": "{n} IPs",
    "kmp.kart.saat": "{n} Std.",
    "kmp.kart.saatKisa": "<1",
    "kmp.kart.zirve": "Höhepunkt {n}",
    "kmp.kart.sofistikeSkor": "Raffinesse-Score",
    "kmp.kart.aktivite": "Aktivität",

    "kmp.det.sinyalBaslik": "Raffinesse-Signale",
    "kmp.det.sinyalYok": "Keine nennenswerten Raffinesse-Signale.",
    "kmp.det.ornekIp": "Beispiel-IPs",
    "kmp.det.hedefYol": "Zielpfade",
    "kmp.det.yasamDongusu": "Lebenszyklus",
    "kmp.det.ilkGorulme": "Erste Sichtung",
    "kmp.det.zirveAni": "Höhepunkt",
    "kmp.det.sonGorulme": "Letzte Sichtung",
    "kmp.det.baskinSinif": "Dominante Klasse",
    "kmp.det.asnSayisi": "ASN-Anzahl",
    "kmp.det.kuralOner": "Regel gegen diese Kampagne vorschlagen",
    "kmp.det.aktorProfil": "Akteur-Profiling",

    "kmp.not":
      "Kampagnen werden aus echten Bot-Ereignissen per heuristischem Clustering (gemeinsame ASN/IP/UA-Familie + Zeit-Burst) abgeleitet. Namen und Scores sind heuristische Gruppierungen — keine Zuordnung zu benannten Bedrohungsgruppen. Menschlicher und Good-Bot-Traffic ist vom Clustering ausgeschlossen.",

    "kmp.tehdit.düşük": "niedrig",
    "kmp.tehdit.orta": "mittel",
    "kmp.tehdit.yüksek": "hoch",
    "kmp.tehdit.kritik": "kritisch",

    "kmp.durum.aktif": "aktiv",
    "kmp.durum.sönümleniyor": "abklingend",
    "kmp.durum.kapandı": "geschlossen",

    "kmp.saldiri.human": "Menschlicher Traffic",
    "kmp.saldiri.good_bot": "Good-Bot-Aktivität",
    "kmp.saldiri.automation": "Automatisierungskampagne",
    "kmp.saldiri.scraper": "Content-Scraping-Kampagne",
    "kmp.saldiri.credential_stuffing": "Credential-Stuffing-Kampagne",
    "kmp.saldiri.ai_agent": "KI-Agenten-Kampagne",
    "kmp.saldiri.ddos": "DDoS-Kampagne",
    "kmp.saldiri.spam": "Spam-Kampagne",

    "kmp.ad.saglayiciIle": "{saldiri} über {asn} ({saglayici})",
    "kmp.ad.saglayicisiz": "{saldiri} über {asn}",

    "kmp.ua.boş-ua": "leerer UA",
    "kmp.ua.python-http": "python-http",
    "kmp.ua.curl": "curl",
    "kmp.ua.go/okhttp": "go/okhttp",
    "kmp.ua.headless-tarayıcı": "Headless-Browser",
    "kmp.ua.selenium": "selenium",
    "kmp.ua.script-scraper": "Skript-Scraper",
    "kmp.ua.ai-ajan": "KI-Agent",
    "kmp.ua.genel-bot": "generischer Bot",
    "kmp.ua.chrome-benzeri": "Chrome-artig",
    "kmp.ua.firefox-benzeri": "Firefox-artig",
    "kmp.ua.safari-benzeri": "Safari-artig",
    "kmp.ua.diğer": "andere",
    "kmp.ua.bilinmeyen": "unbekannt",

    "kmp.aciklama.saatKisa": "weniger als eine Stunde",
    "kmp.aciklama.saatUzun": "~{n} Stunden",
    "kmp.aciklama.metin":
      "Eine koordinierte {saldiri}, die {olay} Ereignisse, {ip} IPs und {asnSay} ASNs teilt. Aus der {asn}-Infrastruktur mit der {ua}-Signatur innerhalb eines {sure}-Fensters geclustert.",

    "kmp.sinyal.ipCesit": "{n} eindeutige IPs — verteilte Infrastruktur",
    "kmp.sinyal.asnCesit": "{n} verschiedene ASNs — Multi-Netzwerk-Koordination",
    "kmp.sinyal.kacinma": "{n}% Umgehungssignal (Headless/TLS-UA)",
    "kmp.sinyal.hiz": "~{n} Ereignisse/Stunde — Hochraten-Automatisierung",
    "kmp.sinyal.cografya": "Quelle auf {n} Länder verteilt",
  },

  fr: {
    "kmp.serit.baslik": "Pas du bruit mais une opération — les événements se fondent en une seule campagne.",
    "kmp.serit.aciklama":
      "Les événements de bots individuels sont regroupés en campagnes coordonnées selon l'infrastructure d'attaque qu'ils partagent (ASN, IP, famille d'UA, classe de bot) et leurs pics temporels. Chaque campagne a un cycle de vie (première vue → pic → déclin), un nom déterministe et un score de sophistication/menace. Ainsi il devient clair que « 340 événements sur 3 jours n'étaient en réalité qu'UNE seule opération ».",

    "kmp.ozet.tespit": "Campagnes détectées",
    "kmp.ozet.aktif": "Campagnes actives",
    "kmp.ozet.kritik": "Menaces critiques",
    "kmp.ozet.iliski": "Taux d'attribution (sur {n} événements)",

    "kmp.gantt.baslik": "Chronologie des campagnes",

    "kmp.ara.placeholder": "Rechercher campagne / ASN / pays / menace…",

    "kmp.bos.baslik": "Aucune campagne",
    "kmp.bos.aciklama": "Pas assez d'événements d'attaque pour former une campagne coordonnée — le trafic est dispersé ou propre.",
    "kmp.eslesme.baslik": "Aucun résultat",
    "kmp.eslesme.aciklama": "Aucune campagne ne correspond à votre recherche.",

    "kmp.kart.tehdit": "menace {s}",
    "kmp.kart.olay": "{n} événements",
    "kmp.kart.ip": "{n} IP",
    "kmp.kart.saat": "{n} h",
    "kmp.kart.saatKisa": "<1",
    "kmp.kart.zirve": "pic {n}",
    "kmp.kart.sofistikeSkor": "Score de sophistication",
    "kmp.kart.aktivite": "Activité",

    "kmp.det.sinyalBaslik": "Signaux de sophistication",
    "kmp.det.sinyalYok": "Aucun signal de sophistication notable.",
    "kmp.det.ornekIp": "IP d'exemple",
    "kmp.det.hedefYol": "Chemins ciblés",
    "kmp.det.yasamDongusu": "Cycle de vie",
    "kmp.det.ilkGorulme": "Première vue",
    "kmp.det.zirveAni": "Moment de pic",
    "kmp.det.sonGorulme": "Dernière vue",
    "kmp.det.baskinSinif": "Classe dominante",
    "kmp.det.asnSayisi": "Nombre d'ASN",
    "kmp.det.kuralOner": "Suggérer une règle contre cette campagne",
    "kmp.det.aktorProfil": "Profilage d'acteur",

    "kmp.not":
      "Les campagnes sont extraites d'événements de bots réels par regroupement heuristique (famille ASN/IP/UA partagée + pic temporel). Les noms et scores sont des regroupements heuristiques — pas une attribution à des groupes de menace nommés. Le trafic humain et des bons bots est exclu du regroupement.",

    "kmp.tehdit.düşük": "faible",
    "kmp.tehdit.orta": "moyen",
    "kmp.tehdit.yüksek": "élevé",
    "kmp.tehdit.kritik": "critique",

    "kmp.durum.aktif": "active",
    "kmp.durum.sönümleniyor": "en déclin",
    "kmp.durum.kapandı": "clôturée",

    "kmp.saldiri.human": "Trafic humain",
    "kmp.saldiri.good_bot": "Activité de bon bot",
    "kmp.saldiri.automation": "Campagne d'automatisation",
    "kmp.saldiri.scraper": "Campagne d'extraction de contenu",
    "kmp.saldiri.credential_stuffing": "Campagne de credential stuffing",
    "kmp.saldiri.ai_agent": "Campagne d'agent IA",
    "kmp.saldiri.ddos": "Campagne DDoS",
    "kmp.saldiri.spam": "Campagne de spam",

    "kmp.ad.saglayiciIle": "{saldiri} via {asn} ({saglayici})",
    "kmp.ad.saglayicisiz": "{saldiri} via {asn}",

    "kmp.ua.boş-ua": "UA vide",
    "kmp.ua.python-http": "python-http",
    "kmp.ua.curl": "curl",
    "kmp.ua.go/okhttp": "go/okhttp",
    "kmp.ua.headless-tarayıcı": "navigateur headless",
    "kmp.ua.selenium": "selenium",
    "kmp.ua.script-scraper": "scraper de script",
    "kmp.ua.ai-ajan": "agent IA",
    "kmp.ua.genel-bot": "bot générique",
    "kmp.ua.chrome-benzeri": "type Chrome",
    "kmp.ua.firefox-benzeri": "type Firefox",
    "kmp.ua.safari-benzeri": "type Safari",
    "kmp.ua.diğer": "autre",
    "kmp.ua.bilinmeyen": "inconnu",

    "kmp.aciklama.saatKisa": "moins d'une heure",
    "kmp.aciklama.saatUzun": "~{n} heures",
    "kmp.aciklama.metin":
      "Une {saldiri} coordonnée partageant {olay} événements, {ip} IP et {asnSay} ASN. Regroupée depuis l'infrastructure {asn} avec la signature {ua} dans une fenêtre de {sure}.",

    "kmp.sinyal.ipCesit": "{n} IP uniques — infrastructure distribuée",
    "kmp.sinyal.asnCesit": "{n} ASN distincts — coordination multi-réseau",
    "kmp.sinyal.kacinma": "{n}% de signal d'évasion (headless/TLS-UA)",
    "kmp.sinyal.hiz": "~{n} événements/heure — automatisation à haut débit",
    "kmp.sinyal.cografya": "Source répartie sur {n} pays",
  },

  es: {
    "kmp.serit.baslik": "No es ruido sino una operación — los eventos se fusionan en una sola campaña.",
    "kmp.serit.aciklama":
      "Los eventos de bots individuales se agrupan en campañas coordinadas según la infraestructura de ataque que comparten (ASN, IP, familia de UA, clase de bot) y sus ráfagas temporales. Cada campaña tiene un ciclo de vida (primera vez visto → pico → decaimiento), un nombre determinista y una puntuación de sofisticación/amenaza. Así queda claro que \"340 eventos en 3 días fueron en realidad UNA sola operación\".",

    "kmp.ozet.tespit": "Campañas detectadas",
    "kmp.ozet.aktif": "Campañas activas",
    "kmp.ozet.kritik": "Amenazas críticas",
    "kmp.ozet.iliski": "Tasa de atribución (de {n} eventos)",

    "kmp.gantt.baslik": "Cronología de campañas",

    "kmp.ara.placeholder": "Buscar campaña / ASN / país / amenaza…",

    "kmp.bos.baslik": "Sin campañas",
    "kmp.bos.aciklama": "No hay suficientes eventos de ataque para agrupar en una campaña coordinada — el tráfico está disperso o limpio.",
    "kmp.eslesme.baslik": "Sin coincidencias",
    "kmp.eslesme.aciklama": "Ninguna campaña coincide con tu búsqueda.",

    "kmp.kart.tehdit": "amenaza {s}",
    "kmp.kart.olay": "{n} eventos",
    "kmp.kart.ip": "{n} IP",
    "kmp.kart.saat": "{n} h",
    "kmp.kart.saatKisa": "<1",
    "kmp.kart.zirve": "pico {n}",
    "kmp.kart.sofistikeSkor": "Puntuación de sofisticación",
    "kmp.kart.aktivite": "Actividad",

    "kmp.det.sinyalBaslik": "Señales de sofisticación",
    "kmp.det.sinyalYok": "Sin señales de sofisticación notables.",
    "kmp.det.ornekIp": "IP de muestra",
    "kmp.det.hedefYol": "Rutas objetivo",
    "kmp.det.yasamDongusu": "Ciclo de vida",
    "kmp.det.ilkGorulme": "Primera vez visto",
    "kmp.det.zirveAni": "Momento pico",
    "kmp.det.sonGorulme": "Última vez visto",
    "kmp.det.baskinSinif": "Clase dominante",
    "kmp.det.asnSayisi": "Número de ASN",
    "kmp.det.kuralOner": "Sugerir una regla contra esta campaña",
    "kmp.det.aktorProfil": "Perfilado de actor",

    "kmp.not":
      "Las campañas se extraen de eventos de bots reales mediante agrupación heurística (familia ASN/IP/UA compartida + ráfaga temporal). Los nombres y puntuaciones son agrupaciones heurísticas — no una atribución a grupos de amenaza con nombre. El tráfico humano y de buenos bots se excluye de la agrupación.",

    "kmp.tehdit.düşük": "bajo",
    "kmp.tehdit.orta": "medio",
    "kmp.tehdit.yüksek": "alto",
    "kmp.tehdit.kritik": "crítico",

    "kmp.durum.aktif": "activa",
    "kmp.durum.sönümleniyor": "en declive",
    "kmp.durum.kapandı": "cerrada",

    "kmp.saldiri.human": "Tráfico humano",
    "kmp.saldiri.good_bot": "Actividad de buen bot",
    "kmp.saldiri.automation": "Campaña de automatización",
    "kmp.saldiri.scraper": "Campaña de extracción de contenido",
    "kmp.saldiri.credential_stuffing": "Campaña de credential stuffing",
    "kmp.saldiri.ai_agent": "Campaña de agente IA",
    "kmp.saldiri.ddos": "Campaña DDoS",
    "kmp.saldiri.spam": "Campaña de spam",

    "kmp.ad.saglayiciIle": "{saldiri} vía {asn} ({saglayici})",
    "kmp.ad.saglayicisiz": "{saldiri} vía {asn}",

    "kmp.ua.boş-ua": "UA vacío",
    "kmp.ua.python-http": "python-http",
    "kmp.ua.curl": "curl",
    "kmp.ua.go/okhttp": "go/okhttp",
    "kmp.ua.headless-tarayıcı": "navegador headless",
    "kmp.ua.selenium": "selenium",
    "kmp.ua.script-scraper": "scraper de script",
    "kmp.ua.ai-ajan": "agente IA",
    "kmp.ua.genel-bot": "bot genérico",
    "kmp.ua.chrome-benzeri": "tipo Chrome",
    "kmp.ua.firefox-benzeri": "tipo Firefox",
    "kmp.ua.safari-benzeri": "tipo Safari",
    "kmp.ua.diğer": "otro",
    "kmp.ua.bilinmeyen": "desconocido",

    "kmp.aciklama.saatKisa": "menos de una hora",
    "kmp.aciklama.saatUzun": "~{n} horas",
    "kmp.aciklama.metin":
      "Una {saldiri} coordinada que comparte {olay} eventos, {ip} IP y {asnSay} ASN. Agrupada desde la infraestructura {asn} con la firma {ua} dentro de una ventana de {sure}.",

    "kmp.sinyal.ipCesit": "{n} IP únicas — infraestructura distribuida",
    "kmp.sinyal.asnCesit": "{n} ASN distintos — coordinación multired",
    "kmp.sinyal.kacinma": "{n}% señal de evasión (headless/TLS-UA)",
    "kmp.sinyal.hiz": "~{n} eventos/hora — automatización de alta tasa",
    "kmp.sinyal.cografya": "Fuente distribuida en {n} países",
  },
};

/** Intl BCP-47 karşılıkları (sayı/tarih biçimi için). */
export const KMP_LOCALE: Record<Dil, string> = {
  tr: "tr-TR",
  en: "en-US",
  de: "de-DE",
  fr: "fr-FR",
  es: "es-ES",
};

export function kampanyaCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}

/* ------------------------------------------------------------------ Motor-metni yeniden türetme */

/** ASN dizesinden kısa etiket: "AS9009 M247 Ltd" → "AS9009". */
function asnKisa(asn: string): string {
  const m = /^(AS\d+)/i.exec(asn.trim());
  return m ? m[1].toUpperCase() : asn.trim().split(/\s+/)[0] || "AS?";
}

/** ASN dizesinden sağlayıcı adı: "AS9009 M247 Ltd" → "M247 Ltd". */
function asnSaglayici(asn: string): string {
  return asn.replace(/^AS\d+\s*/i, "").trim() || asnKisa(asn);
}

/**
 * Kampanya adını istemcide, seçili dilde yeniden kurar. ASN etiketi + sağlayıcı
 * VERİ olarak kalır; yalnızca şablon ve `botClass` → saldırı-türü etiketi çevrilir.
 */
export function kampanyaAd(anaAsn: string, botClass: BotClass, dil: Dil): string {
  const asnEtiket = asnKisa(anaAsn);
  const saglayici = asnSaglayici(anaAsn);
  const saldiri = kampanyaCeviri(`kmp.saldiri.${botClass}`, dil);
  const sablon =
    saglayici && saglayici !== asnEtiket
      ? kampanyaCeviri("kmp.ad.saglayiciIle", dil)
      : kampanyaCeviri("kmp.ad.saglayicisiz", dil);
  return sablon
    .replace("{asn}", asnEtiket)
    .replace("{saglayici}", saglayici)
    .replace("{saldiri}", saldiri);
}

/**
 * Kampanya açıklamasını istemcide seçili dilde yeniden kurar. Sayılar veri
 * olarak yerleştirilir; UA-ailesi anahtarı ve saldırı-türü etiketi çevrilir.
 * @param uaAnahtar  kumele'nin bileşik anahtarındaki UA-ailesi (ör. "python-http")
 */
export function kampanyaAciklama(
  args: { olay: number; ip: number; asnSay: number; anaAsn: string; uaAnahtar: string; sureSaat: number; botClass: BotClass },
  dil: Dil,
): string {
  const asnEtiket = asnKisa(args.anaAsn);
  const saldiri = kampanyaCeviri(`kmp.saldiri.${args.botClass}`, dil).toLocaleLowerCase(KMP_LOCALE[dil]);
  const ua = kampanyaCeviri(`kmp.ua.${args.uaAnahtar}`, dil);
  const sure =
    args.sureSaat < 1
      ? kampanyaCeviri("kmp.aciklama.saatKisa", dil)
      : kampanyaCeviri("kmp.aciklama.saatUzun", dil).replace("{n}", String(Math.round(args.sureSaat)));
  return kampanyaCeviri("kmp.aciklama.metin", dil)
    .replace("{olay}", String(args.olay))
    .replace("{ip}", String(args.ip))
    .replace("{asnSay}", String(args.asnSay))
    .replace("{saldiri}", saldiri)
    .replace("{asn}", asnEtiket)
    .replace("{ua}", ua)
    .replace("{sure}", sure);
}

/** Tehdit seviyesi etiketi (enum → çeviri). */
export function tehditEtiket(s: TehditSeviyesi, dil: Dil): string {
  return kampanyaCeviri(`kmp.tehdit.${s}`, dil);
}

/** Durum etiketi (enum → çeviri). */
export function durumEtiket(d: KampanyaDurum, dil: Dil): string {
  return kampanyaCeviri(`kmp.durum.${d}`, dil);
}

/** Yapısal sofistike sinyalini seçili dilde metne çevirir. */
export function sinyalMetin(s: SofistikeSinyal, dil: Dil): string {
  return kampanyaCeviri(`kmp.sinyal.${s.anahtar}`, dil).replace("{n}", String(s.n));
}
