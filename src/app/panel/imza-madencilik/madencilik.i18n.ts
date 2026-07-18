/**
 * İmza Madenciliği sayfası — yerel i18n sözlüğü.
 *
 * Panel geneli `ceviri()` yerine bu yerel `mdCeviri()` kullanılır; böylece
 * sayfaya özgü uzun metinler ana sözlüğü şişirmez. Anahtar bulunamazsa TR'ye,
 * o da yoksa anahtarın kendisine düşer.
 *
 * ENUM GÜVENLİĞİ:
 *   - `kategori.*` anahtarları Imza["kategori"] enum değerlerini (arac/kimlik/
 *     ai/kazima/ddos/atlatma) çevirir; enum değerleri asla çevrilmez, yalnızca
 *     gösterim etiketi. Böylece madencilik.ts'teki KATEGORI mantığına
 *     dokunmadan istemci tarafında yeniden türetilir.
 *   - `siddet.*` anahtarları Imza["siddet"] enum değerlerini (dusuk/orta/
 *     yuksek/kritik) çevirir.
 *   - `taktik.*` anahtarları kategori enum'undan yeniden türetilir; sunucudaki
 *     TAKTIK TR string'i yerine istemcide dile göre üretilir (enum güvenliği).
 *   - İmza id'leri, hash'ler, kural-DSL deseni (kosulDesenMetin), ASN/IP/UA/yol
 *     ve otomatik-üretilen ad ise VERİDİR — çevrilmez.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // açıklama şeridi
    "aciklama.baslik": "İmzaları elle yazma — gözlemlenen saldırıdan madenle.",
    "aciklama.p1a": "Kötü niyetli olaylar ortak özelliklerine göre kümelenir (UA ailesi + ASN + yol öneki + botClass); her kümenin ortak paydası bir aday",
    "aciklama.imza": "imzaya",
    "aciklama.p1b": "dönüşür. Her adayın kesinliği ve kapsaması gerçek trafik üzerinde ölçülür — yüksek kaliteli olanları İmza Kütüphanesi'ne ekleyebilirsin.",

    // özet statlar
    "stat.kesfedilen": "Keşfedilen imza",
    "stat.yuksekKalite": "Yüksek kalite (≥70)",
    "stat.otoOnay": "Oto-onaylanabilir",
    "stat.birlesikKapsama": "Birleşik kapsama (tahmini)",

    // boş durum
    "bos.baslik": "Madenlenecek yeterli saldırı yok",
    "bos.metin": "{toplam} olayın {kotu} tanesi kötü niyetli. Anlamlı bir küme oluşması için en az 4 benzer olay gerekir. Trafik biriktikçe imzalar burada belirir.",

    // panel başlıkları
    "panel.kaliteDagilimi": "Kalite dağılımı",
    "panel.kaliteNot": "Kalite = kesinlik (%55) + kapsama (%30) + destek/küme büyüklüğü (%15). Yüksek kaliteliler daha güvenle promote edilir.",
    "panel.scatterBaslik": "Kesinlik × Kapsama dağılımı",
    "panel.scatterNot": "Sağ-üst köşe idealdir: yüksek kesinlik + yüksek kapsama. Nokta büyüklüğü küme (üye) sayısını gösterir. Bir noktaya tıkla.",

    // kalite dağılım bantları
    "bant.yuksek": "Yüksek (≥70)",
    "bant.orta": "Orta (45–69)",
    "bant.dusuk": "Düşük (<45)",

    // scatter görseli
    "scatter.enIyi": "en iyi imzalar",
    "scatter.kapsama": "Kapsama →",
    "scatter.kesinlik": "Kesinlik →",
    "scatter.aria": "Kesinlik-kapsama dağılımı",
    "scatter.nokta": "{ad} — kesinlik %{kesinlik}, kapsama %{kapsama}, {uye} üye",

    // keşfedilen imzalar başlığı
    "kesif.baslik": "Keşfedilen imzalar",
    "kesif.rozet": "kaliteye göre sıralı",

    // imza kartı
    "kart.uyeOlay": "{n} üye olay",
    "kart.kaliteSkoru": "Kalite skoru {n}/100",
    "kart.kalite": "kalite",
    "kart.kesinlik": "Kesinlik (precision)",
    "kart.kapsama": "Kapsama (coverage)",
    "kart.kaliteEtiket": "Kalite",
    "kart.ornekGizle": "Örnek olayları gizle",
    "kart.ornekGoster": "Örnek olaylar ({n})",
    "kart.eklendi": "Kütüphaneye eklendi",
    "kart.ekle": "Kütüphaneye ekle",

    // örnek olay tablosu
    "tablo.ip": "IP",
    "tablo.ulke": "Ülke",
    "tablo.yol": "Yol",
    "tablo.skor": "Skor",
    "tablo.ua": "UA",

    // toast (kütüphaneye ekle)
    "toast.baslik": "İmza kütüphaneye eklendi (oturum-yerel)",
    "toast.aciklama": "{ad} · kalite {kalite}. Kalıcı ekleme İmza Kütüphanesi'nden yapılır.",

    // kümeleme açıklaması
    "kume.baslik": "Kümeleme nasıl çalışır?",
    "kume.1t": "Grupla.",
    "kume.1a": "Her kötü olay bileşik bir özellik anahtarına indirgenir:",
    "kume.1b": "Aynı anahtardaki olaylar bir küme olur.",
    "kume.2t": "Ortak paydayı çıkar.",
    "kume.2a": "Kümenin ≥%70'inde paylaşılan koşullar aday imzaya girer (ua contains, asn, path, botClass, score tavanı).",
    "kume.3t": "Ölç.",
    "kume.3a": "Aday koşullar TÜM olaylara karşı çalıştırılır: kesinlik (eşleşenlerin kaçı kötü) ve kapsama (kötülerin kaçı yakalandı).",
    "kume.4t": "Puanla & promote et.",
    "kume.4a": "Kalite skoruna göre sıralanır; yüksek kaliteli imzaları kütüphaneye ekleyebilirsin.",
    "kume.akis": "olaylar → özellik anahtarı → küme → ortak payda → aday imza",

    // dürüstlük notu
    "not.baslik": "Bu nasıl bir tespit — ve sınırları",
    "not.1a": "İmzalar",
    "not.1b": "gerçek gözlemlenen olaylardan",
    "not.1c": "şeffaf özellik kümelemesiyle madenlenir — kara-kutu bir ML modeli",
    "not.1d": "değildir",
    "not.1e": ". Her kümenin neden bir arada olduğu izlenebilir.",
    "not.2a": "Kesinlik ve kapsama yalnızca",
    "not.2b": "gözlemlenen veri",
    "not.2c": "üzerinde ölçülür; gelecekteki trafikte aynı performans",
    "not.2d": "garanti edilmez",
    "not.2e": ".",
    "not.3a": "Buradaki \"kütüphaneye ekle\"",
    "not.3b": "oturum-yereldir",
    "not.3c": "(sunucuya yazmaz). Kalıcı promotion, imzayı",
    "not.imzaKutuphane": "İmza Kütüphanesi",
    "not.3d": "'ne ayrıca ekler.",
    "not.git": "İmza Kütüphanesi'ne git",

    // kategori enum etiketleri
    "kategori.arac": "HTTP aracı",
    "kategori.kimlik": "Kimlik",
    "kategori.ai": "AI ajan",
    "kategori.kazima": "Kazıma",
    "kategori.ddos": "DDoS",
    "kategori.atlatma": "Atlatma",

    // şiddet enum etiketleri
    "siddet.dusuk": "Düşük",
    "siddet.orta": "Orta",
    "siddet.yuksek": "Yüksek",
    "siddet.kritik": "Kritik",

    // taktik (kategori enum'undan türetilir)
    "taktik.ai": "İçerik toplama",
    "taktik.kimlik": "Kimlik bilgisi erişimi",
    "taktik.ddos": "Hizmet reddi",
    "taktik.kazima": "Veri çıkarma",
    "taktik.arac": "Otomatik erişim",
    "taktik.atlatma": "Savunma atlatma",
  },

  en: {
    "aciklama.baslik": "Don't hand-write signatures — mine them from observed attacks.",
    "aciklama.p1a": "Malicious events are clustered by shared traits (UA family + ASN + path prefix + botClass); each cluster's common denominator becomes a candidate",
    "aciklama.imza": "signature",
    "aciklama.p1b": ". Every candidate's precision and coverage is measured on real traffic — you can add the high-quality ones to the Signature Library.",

    "stat.kesfedilen": "Discovered signatures",
    "stat.yuksekKalite": "High quality (≥70)",
    "stat.otoOnay": "Auto-approvable",
    "stat.birlesikKapsama": "Combined coverage (estimated)",

    "bos.baslik": "Not enough attacks to mine",
    "bos.metin": "{kotu} of {toplam} events are malicious. At least 4 similar events are needed to form a meaningful cluster. As traffic accumulates, signatures will appear here.",

    "panel.kaliteDagilimi": "Quality distribution",
    "panel.kaliteNot": "Quality = precision (55%) + coverage (30%) + support/cluster size (15%). Higher-quality ones are promoted with more confidence.",
    "panel.scatterBaslik": "Precision × Coverage distribution",
    "panel.scatterNot": "The top-right corner is ideal: high precision + high coverage. Dot size reflects the cluster (member) count. Click a dot.",

    "bant.yuksek": "High (≥70)",
    "bant.orta": "Medium (45–69)",
    "bant.dusuk": "Low (<45)",

    "scatter.enIyi": "best signatures",
    "scatter.kapsama": "Coverage →",
    "scatter.kesinlik": "Precision →",
    "scatter.aria": "Precision-coverage distribution",
    "scatter.nokta": "{ad} — precision {kesinlik}%, coverage {kapsama}%, {uye} members",

    "kesif.baslik": "Discovered signatures",
    "kesif.rozet": "sorted by quality",

    "kart.uyeOlay": "{n} member events",
    "kart.kaliteSkoru": "Quality score {n}/100",
    "kart.kalite": "quality",
    "kart.kesinlik": "Precision",
    "kart.kapsama": "Coverage",
    "kart.kaliteEtiket": "Quality",
    "kart.ornekGizle": "Hide sample events",
    "kart.ornekGoster": "Sample events ({n})",
    "kart.eklendi": "Added to library",
    "kart.ekle": "Add to library",

    "tablo.ip": "IP",
    "tablo.ulke": "Country",
    "tablo.yol": "Path",
    "tablo.skor": "Score",
    "tablo.ua": "UA",

    "toast.baslik": "Signature added to library (session-local)",
    "toast.aciklama": "{ad} · quality {kalite}. Permanent addition is done from the Signature Library.",

    "kume.baslik": "How does clustering work?",
    "kume.1t": "Group.",
    "kume.1a": "Each malicious event is reduced to a composite trait key:",
    "kume.1b": "Events under the same key form a cluster.",
    "kume.2t": "Extract the common denominator.",
    "kume.2a": "Conditions shared by ≥70% of the cluster enter the candidate signature (ua contains, asn, path, botClass, score ceiling).",
    "kume.3t": "Measure.",
    "kume.3a": "Candidate conditions are run against ALL events: precision (how many matches are malicious) and coverage (how many malicious events are caught).",
    "kume.4t": "Score & promote.",
    "kume.4a": "They are ranked by quality score; you can add the high-quality signatures to the library.",
    "kume.akis": "events → trait key → cluster → common denominator → candidate signature",

    "not.baslik": "What kind of detection this is — and its limits",
    "not.1a": "Signatures are mined",
    "not.1b": "from real observed events",
    "not.1c": "through transparent trait clustering — it is",
    "not.1d": "not",
    "not.1e": " a black-box ML model. Why each cluster belongs together is traceable.",
    "not.2a": "Precision and coverage are measured only on",
    "not.2b": "observed data",
    "not.2c": "; the same performance on future traffic is",
    "not.2d": "not guaranteed",
    "not.2e": ".",
    "not.3a": "The \"add to library\" here is",
    "not.3b": "session-local",
    "not.3c": "(it doesn't write to the server). Permanent promotion adds the signature separately to the",
    "not.imzaKutuphane": "Signature Library",
    "not.3d": ".",
    "not.git": "Go to Signature Library",

    "kategori.arac": "HTTP tool",
    "kategori.kimlik": "Identity",
    "kategori.ai": "AI agent",
    "kategori.kazima": "Scraping",
    "kategori.ddos": "DDoS",
    "kategori.atlatma": "Evasion",

    "siddet.dusuk": "Low",
    "siddet.orta": "Medium",
    "siddet.yuksek": "High",
    "siddet.kritik": "Critical",

    "taktik.ai": "Content harvesting",
    "taktik.kimlik": "Credential access",
    "taktik.ddos": "Denial of service",
    "taktik.kazima": "Data extraction",
    "taktik.arac": "Automated access",
    "taktik.atlatma": "Defense evasion",
  },

  de: {
    "aciklama.baslik": "Signaturen nicht von Hand schreiben — aus beobachteten Angriffen schürfen.",
    "aciklama.p1a": "Bösartige Ereignisse werden nach gemeinsamen Merkmalen geclustert (UA-Familie + ASN + Pfadpräfix + botClass); der gemeinsame Nenner jedes Clusters wird zu einer Kandidaten-",
    "aciklama.imza": "Signatur",
    "aciklama.p1b": ". Präzision und Abdeckung jedes Kandidaten werden am echten Traffic gemessen — die hochwertigen kannst du der Signaturbibliothek hinzufügen.",

    "stat.kesfedilen": "Entdeckte Signaturen",
    "stat.yuksekKalite": "Hohe Qualität (≥70)",
    "stat.otoOnay": "Auto-genehmigbar",
    "stat.birlesikKapsama": "Kombinierte Abdeckung (geschätzt)",

    "bos.baslik": "Nicht genug Angriffe zum Schürfen",
    "bos.metin": "{kotu} von {toplam} Ereignissen sind bösartig. Für ein aussagekräftiges Cluster sind mindestens 4 ähnliche Ereignisse nötig. Mit zunehmendem Traffic erscheinen die Signaturen hier.",

    "panel.kaliteDagilimi": "Qualitätsverteilung",
    "panel.kaliteNot": "Qualität = Präzision (55 %) + Abdeckung (30 %) + Support/Clustergröße (15 %). Hochwertige werden mit mehr Vertrauen befördert.",
    "panel.scatterBaslik": "Verteilung Präzision × Abdeckung",
    "panel.scatterNot": "Die obere rechte Ecke ist ideal: hohe Präzision + hohe Abdeckung. Die Punktgröße gibt die Cluster-(Mitglieder-)Anzahl an. Klicke auf einen Punkt.",

    "bant.yuksek": "Hoch (≥70)",
    "bant.orta": "Mittel (45–69)",
    "bant.dusuk": "Niedrig (<45)",

    "scatter.enIyi": "beste Signaturen",
    "scatter.kapsama": "Abdeckung →",
    "scatter.kesinlik": "Präzision →",
    "scatter.aria": "Präzisions-Abdeckungs-Verteilung",
    "scatter.nokta": "{ad} — Präzision {kesinlik} %, Abdeckung {kapsama} %, {uye} Mitglieder",

    "kesif.baslik": "Entdeckte Signaturen",
    "kesif.rozet": "nach Qualität sortiert",

    "kart.uyeOlay": "{n} Mitglieder-Ereignisse",
    "kart.kaliteSkoru": "Qualitätswert {n}/100",
    "kart.kalite": "Qualität",
    "kart.kesinlik": "Präzision",
    "kart.kapsama": "Abdeckung",
    "kart.kaliteEtiket": "Qualität",
    "kart.ornekGizle": "Beispielereignisse ausblenden",
    "kart.ornekGoster": "Beispielereignisse ({n})",
    "kart.eklendi": "Zur Bibliothek hinzugefügt",
    "kart.ekle": "Zur Bibliothek hinzufügen",

    "tablo.ip": "IP",
    "tablo.ulke": "Land",
    "tablo.yol": "Pfad",
    "tablo.skor": "Wert",
    "tablo.ua": "UA",

    "toast.baslik": "Signatur zur Bibliothek hinzugefügt (sitzungslokal)",
    "toast.aciklama": "{ad} · Qualität {kalite}. Die dauerhafte Aufnahme erfolgt über die Signaturbibliothek.",

    "kume.baslik": "Wie funktioniert das Clustering?",
    "kume.1t": "Gruppieren.",
    "kume.1a": "Jedes bösartige Ereignis wird auf einen zusammengesetzten Merkmalsschlüssel reduziert:",
    "kume.1b": "Ereignisse unter demselben Schlüssel bilden ein Cluster.",
    "kume.2t": "Gemeinsamen Nenner extrahieren.",
    "kume.2a": "Bedingungen, die ≥70 % des Clusters teilen, fließen in die Kandidatensignatur ein (ua contains, asn, path, botClass, Score-Obergrenze).",
    "kume.3t": "Messen.",
    "kume.3a": "Die Kandidatenbedingungen werden gegen ALLE Ereignisse ausgeführt: Präzision (wie viele Treffer bösartig sind) und Abdeckung (wie viele bösartige Ereignisse erfasst werden).",
    "kume.4t": "Bewerten & befördern.",
    "kume.4a": "Sie werden nach Qualitätswert sortiert; du kannst die hochwertigen Signaturen zur Bibliothek hinzufügen.",
    "kume.akis": "Ereignisse → Merkmalsschlüssel → Cluster → gemeinsamer Nenner → Kandidatensignatur",

    "not.baslik": "Welche Art der Erkennung dies ist — und ihre Grenzen",
    "not.1a": "Signaturen werden",
    "not.1b": "aus echten beobachteten Ereignissen",
    "not.1c": "durch transparentes Merkmals-Clustering geschürft — es ist",
    "not.1d": "kein",
    "not.1e": " Black-Box-ML-Modell. Warum jedes Cluster zusammengehört, ist nachvollziehbar.",
    "not.2a": "Präzision und Abdeckung werden nur an",
    "not.2b": "beobachteten Daten",
    "not.2c": "gemessen; dieselbe Leistung bei künftigem Traffic ist",
    "not.2d": "nicht garantiert",
    "not.2e": ".",
    "not.3a": "Das „Zur Bibliothek hinzufügen“ hier ist",
    "not.3b": "sitzungslokal",
    "not.3c": "(schreibt nicht auf den Server). Die dauerhafte Beförderung fügt die Signatur separat der",
    "not.imzaKutuphane": "Signaturbibliothek",
    "not.3d": " hinzu.",
    "not.git": "Zur Signaturbibliothek",

    "kategori.arac": "HTTP-Tool",
    "kategori.kimlik": "Identität",
    "kategori.ai": "KI-Agent",
    "kategori.kazima": "Scraping",
    "kategori.ddos": "DDoS",
    "kategori.atlatma": "Umgehung",

    "siddet.dusuk": "Niedrig",
    "siddet.orta": "Mittel",
    "siddet.yuksek": "Hoch",
    "siddet.kritik": "Kritisch",

    "taktik.ai": "Inhaltssammlung",
    "taktik.kimlik": "Zugriff auf Anmeldedaten",
    "taktik.ddos": "Dienstverweigerung",
    "taktik.kazima": "Datenextraktion",
    "taktik.arac": "Automatisierter Zugriff",
    "taktik.atlatma": "Abwehrumgehung",
  },

  fr: {
    "aciklama.baslik": "N'écrivez pas les signatures à la main — extrayez-les des attaques observées.",
    "aciklama.p1a": "Les événements malveillants sont regroupés selon des traits communs (famille UA + ASN + préfixe de chemin + botClass) ; le dénominateur commun de chaque groupe devient une",
    "aciklama.imza": "signature",
    "aciklama.p1b": "candidate. La précision et la couverture de chaque candidat sont mesurées sur du trafic réel — vous pouvez ajouter les meilleures à la Bibliothèque de signatures.",

    "stat.kesfedilen": "Signatures découvertes",
    "stat.yuksekKalite": "Haute qualité (≥70)",
    "stat.otoOnay": "Auto-approuvables",
    "stat.birlesikKapsama": "Couverture combinée (estimée)",

    "bos.baslik": "Pas assez d'attaques à extraire",
    "bos.metin": "{kotu} des {toplam} événements sont malveillants. Au moins 4 événements similaires sont nécessaires pour former un groupe significatif. À mesure que le trafic s'accumule, les signatures apparaîtront ici.",

    "panel.kaliteDagilimi": "Distribution de la qualité",
    "panel.kaliteNot": "Qualité = précision (55 %) + couverture (30 %) + support/taille du groupe (15 %). Les plus qualitatives sont promues avec plus de confiance.",
    "panel.scatterBaslik": "Distribution Précision × Couverture",
    "panel.scatterNot": "Le coin supérieur droit est idéal : haute précision + haute couverture. La taille du point reflète le nombre de membres du groupe. Cliquez sur un point.",

    "bant.yuksek": "Élevée (≥70)",
    "bant.orta": "Moyenne (45–69)",
    "bant.dusuk": "Faible (<45)",

    "scatter.enIyi": "meilleures signatures",
    "scatter.kapsama": "Couverture →",
    "scatter.kesinlik": "Précision →",
    "scatter.aria": "Distribution précision-couverture",
    "scatter.nokta": "{ad} — précision {kesinlik} %, couverture {kapsama} %, {uye} membres",

    "kesif.baslik": "Signatures découvertes",
    "kesif.rozet": "triées par qualité",

    "kart.uyeOlay": "{n} événements membres",
    "kart.kaliteSkoru": "Score de qualité {n}/100",
    "kart.kalite": "qualité",
    "kart.kesinlik": "Précision",
    "kart.kapsama": "Couverture",
    "kart.kaliteEtiket": "Qualité",
    "kart.ornekGizle": "Masquer les événements exemples",
    "kart.ornekGoster": "Événements exemples ({n})",
    "kart.eklendi": "Ajoutée à la bibliothèque",
    "kart.ekle": "Ajouter à la bibliothèque",

    "tablo.ip": "IP",
    "tablo.ulke": "Pays",
    "tablo.yol": "Chemin",
    "tablo.skor": "Score",
    "tablo.ua": "UA",

    "toast.baslik": "Signature ajoutée à la bibliothèque (locale à la session)",
    "toast.aciklama": "{ad} · qualité {kalite}. L'ajout permanent se fait depuis la Bibliothèque de signatures.",

    "kume.baslik": "Comment fonctionne le regroupement ?",
    "kume.1t": "Regrouper.",
    "kume.1a": "Chaque événement malveillant est réduit à une clé de trait composite :",
    "kume.1b": "Les événements sous la même clé forment un groupe.",
    "kume.2t": "Extraire le dénominateur commun.",
    "kume.2a": "Les conditions partagées par ≥70 % du groupe entrent dans la signature candidate (ua contains, asn, path, botClass, plafond de score).",
    "kume.3t": "Mesurer.",
    "kume.3a": "Les conditions candidates sont exécutées sur TOUS les événements : précision (combien de correspondances sont malveillantes) et couverture (combien d'événements malveillants sont capturés).",
    "kume.4t": "Noter & promouvoir.",
    "kume.4a": "Elles sont classées par score de qualité ; vous pouvez ajouter les signatures de haute qualité à la bibliothèque.",
    "kume.akis": "événements → clé de trait → groupe → dénominateur commun → signature candidate",

    "not.baslik": "Quel type de détection il s'agit — et ses limites",
    "not.1a": "Les signatures sont extraites",
    "not.1b": "d'événements réels observés",
    "not.1c": "par un regroupement de traits transparent — ce n'est",
    "not.1d": "pas",
    "not.1e": " un modèle ML boîte noire. La raison pour laquelle chaque groupe est cohérent est traçable.",
    "not.2a": "La précision et la couverture sont mesurées uniquement sur les",
    "not.2b": "données observées",
    "not.2c": "; la même performance sur le trafic futur n'est",
    "not.2d": "pas garantie",
    "not.2e": ".",
    "not.3a": "L'« ajout à la bibliothèque » ici est",
    "not.3b": "local à la session",
    "not.3c": "(n'écrit pas sur le serveur). La promotion permanente ajoute la signature séparément à la",
    "not.imzaKutuphane": "Bibliothèque de signatures",
    "not.3d": ".",
    "not.git": "Aller à la Bibliothèque de signatures",

    "kategori.arac": "Outil HTTP",
    "kategori.kimlik": "Identité",
    "kategori.ai": "Agent IA",
    "kategori.kazima": "Scraping",
    "kategori.ddos": "DDoS",
    "kategori.atlatma": "Évasion",

    "siddet.dusuk": "Faible",
    "siddet.orta": "Moyen",
    "siddet.yuksek": "Élevé",
    "siddet.kritik": "Critique",

    "taktik.ai": "Collecte de contenu",
    "taktik.kimlik": "Accès aux identifiants",
    "taktik.ddos": "Déni de service",
    "taktik.kazima": "Extraction de données",
    "taktik.arac": "Accès automatisé",
    "taktik.atlatma": "Évasion de la défense",
  },

  es: {
    "aciklama.baslik": "No escribas las firmas a mano — extráelas de los ataques observados.",
    "aciklama.p1a": "Los eventos maliciosos se agrupan por rasgos comunes (familia UA + ASN + prefijo de ruta + botClass); el denominador común de cada grupo se convierte en una",
    "aciklama.imza": "firma",
    "aciklama.p1b": "candidata. La precisión y la cobertura de cada candidato se miden sobre tráfico real — puedes añadir las de alta calidad a la Biblioteca de firmas.",

    "stat.kesfedilen": "Firmas descubiertas",
    "stat.yuksekKalite": "Alta calidad (≥70)",
    "stat.otoOnay": "Auto-aprobables",
    "stat.birlesikKapsama": "Cobertura combinada (estimada)",

    "bos.baslik": "No hay suficientes ataques para extraer",
    "bos.metin": "{kotu} de {toplam} eventos son maliciosos. Se necesitan al menos 4 eventos similares para formar un grupo significativo. A medida que se acumule el tráfico, las firmas aparecerán aquí.",

    "panel.kaliteDagilimi": "Distribución de calidad",
    "panel.kaliteNot": "Calidad = precisión (55 %) + cobertura (30 %) + soporte/tamaño del grupo (15 %). Las de mayor calidad se promueven con más confianza.",
    "panel.scatterBaslik": "Distribución Precisión × Cobertura",
    "panel.scatterNot": "La esquina superior derecha es ideal: alta precisión + alta cobertura. El tamaño del punto refleja el número de miembros del grupo. Haz clic en un punto.",

    "bant.yuksek": "Alta (≥70)",
    "bant.orta": "Media (45–69)",
    "bant.dusuk": "Baja (<45)",

    "scatter.enIyi": "mejores firmas",
    "scatter.kapsama": "Cobertura →",
    "scatter.kesinlik": "Precisión →",
    "scatter.aria": "Distribución precisión-cobertura",
    "scatter.nokta": "{ad} — precisión {kesinlik} %, cobertura {kapsama} %, {uye} miembros",

    "kesif.baslik": "Firmas descubiertas",
    "kesif.rozet": "ordenadas por calidad",

    "kart.uyeOlay": "{n} eventos miembro",
    "kart.kaliteSkoru": "Puntuación de calidad {n}/100",
    "kart.kalite": "calidad",
    "kart.kesinlik": "Precisión",
    "kart.kapsama": "Cobertura",
    "kart.kaliteEtiket": "Calidad",
    "kart.ornekGizle": "Ocultar eventos de muestra",
    "kart.ornekGoster": "Eventos de muestra ({n})",
    "kart.eklendi": "Añadida a la biblioteca",
    "kart.ekle": "Añadir a la biblioteca",

    "tablo.ip": "IP",
    "tablo.ulke": "País",
    "tablo.yol": "Ruta",
    "tablo.skor": "Puntuación",
    "tablo.ua": "UA",

    "toast.baslik": "Firma añadida a la biblioteca (local de sesión)",
    "toast.aciklama": "{ad} · calidad {kalite}. La adición permanente se hace desde la Biblioteca de firmas.",

    "kume.baslik": "¿Cómo funciona el agrupamiento?",
    "kume.1t": "Agrupar.",
    "kume.1a": "Cada evento malicioso se reduce a una clave de rasgo compuesta:",
    "kume.1b": "Los eventos bajo la misma clave forman un grupo.",
    "kume.2t": "Extraer el denominador común.",
    "kume.2a": "Las condiciones compartidas por ≥70 % del grupo entran en la firma candidata (ua contains, asn, path, botClass, tope de puntuación).",
    "kume.3t": "Medir.",
    "kume.3a": "Las condiciones candidatas se ejecutan contra TODOS los eventos: precisión (cuántas coincidencias son maliciosas) y cobertura (cuántos eventos maliciosos se capturan).",
    "kume.4t": "Puntuar & promover.",
    "kume.4a": "Se ordenan por puntuación de calidad; puedes añadir las firmas de alta calidad a la biblioteca.",
    "kume.akis": "eventos → clave de rasgo → grupo → denominador común → firma candidata",

    "not.baslik": "Qué tipo de detección es esta — y sus límites",
    "not.1a": "Las firmas se extraen",
    "not.1b": "de eventos reales observados",
    "not.1c": "mediante agrupamiento transparente de rasgos — no es",
    "not.1d": "no",
    "not.1e": " un modelo de ML de caja negra. Por qué cada grupo pertenece junto es rastreable.",
    "not.2a": "La precisión y la cobertura se miden únicamente sobre",
    "not.2b": "datos observados",
    "not.2c": "; el mismo rendimiento en el tráfico futuro no está",
    "not.2d": "garantizado",
    "not.2e": ".",
    "not.3a": "El «añadir a la biblioteca» aquí es",
    "not.3b": "local de sesión",
    "not.3c": "(no escribe en el servidor). La promoción permanente añade la firma por separado a la",
    "not.imzaKutuphane": "Biblioteca de firmas",
    "not.3d": ".",
    "not.git": "Ir a la Biblioteca de firmas",

    "kategori.arac": "Herramienta HTTP",
    "kategori.kimlik": "Identidad",
    "kategori.ai": "Agente IA",
    "kategori.kazima": "Scraping",
    "kategori.ddos": "DDoS",
    "kategori.atlatma": "Evasión",

    "siddet.dusuk": "Baja",
    "siddet.orta": "Media",
    "siddet.yuksek": "Alta",
    "siddet.kritik": "Crítica",

    "taktik.ai": "Recolección de contenido",
    "taktik.kimlik": "Acceso a credenciales",
    "taktik.ddos": "Denegación de servicio",
    "taktik.kazima": "Extracción de datos",
    "taktik.arac": "Acceso automatizado",
    "taktik.atlatma": "Evasión de defensa",
  },
};

/** İmza Madenciliği sayfası — yerel çeviri yardımcısı. */
export function mdCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
