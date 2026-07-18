/**
 * Olay Korelasyonu paneli — YEREL sayfa sözlüğü.
 * =====================================================
 * Bu dosya YALNIZCA /panel/korelasyon istemci bileşeninin kullanıcıya görünen
 * KROM/ETİKET metinlerini 5 dile taşır (tr/en/de/fr/es).
 * Paylaşılan `@/lib/i18n/panel` sözlüğüne DOKUNMAZ; sadece `Dil` tipini ondan alır.
 *
 * ÖNEMLİ (güvenlik):
 *  - Enum DEĞERLERİ (KorelasyonSiddet: kritik/yuksek/orta/dusuk, KorelasyonTur:
 *    kimlik_dogrulama_saldirisi… ) filtre + arama mantığını sürer, çevrilmez.
 *    Tür/şiddet ETİKETLERİ enum→anahtar eşlemesiyle t() ile çözülür.
 *  - IP, ASN, ülke kodu, path, skor, sayı, tarih VERİ'dir — çevrilmez.
 *  - Motor (src/lib/specter/correlation.ts) `baslik` ve `taktikler` alanlarını
 *    Türkçe üretir ve DEĞİŞTİRİLEMEZ. Bunları çevirmek için:
 *      · taktik (kill-chain) → sabit Türkçe cümle → "kc.*" anahtarı eşlemesi.
 *      · baslik → sabit Türkçe önek + araya giren VERİ (IP/ASN/path). Önek
 *        segmentleri "kb.*" anahtarlarıyla yeniden kurulur; veri korunur.
 *  - `verdict` rozeti (blocked/challenged/flagged/allowed) enum DEĞERİDİR ve
 *    doğrudan gösterilir (renk mantığını sürer) — çevrilmez.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // Açıklama şeridi (üst)
    "ko.serit.baslik": "Ham olayları saldırı zincirlerine dönüştür.",
    "ko.serit.aciklama":
      "Korelasyon motoru {n} ham güvenlik olayını inceleyip aynı IP patlamalarını, dağıtık bot ağlarını ve hedefli endpoint saldırılarını ilişkili olaylara (incident) gruplar. Her korelasyon bir kill-chain, güven skoru ve kanıt zinciri taşır.",

    // Özet KPI
    "ko.kpi.korelasyon": "Korelasyon (olay)",
    "ko.kpi.kritik": "Kritik korelasyon",
    "ko.kpi.etkilenenIp": "Etkilenen IP",
    "ko.kpi.aktif": "Aktif saldırı",

    // En yaygın tür şeridi
    "ko.enYaygin": "En yaygın saldırı türü:",
    "ko.aktifRozet": "{n} aktif saldırı sürüyor",

    // Panel + araç çubuğu
    "ko.panel.baslik": "İlişkili Olaylar (Incidents)",
    "ko.btn.siem": "SIEM ihraç",
    "ko.btn.rapor": "Rapor indir",
    "ko.filtre.hepsi": "Hepsi",
    "ko.ara.yer": "IP, ASN, path, ülke ara…",
    "ko.ara.etiket": "Korelasyonlarda ara",

    // Boş durumlar
    "ko.bos.yokBaslik": "Korelasyon bulunamadı",
    "ko.bos.yokAciklama":
      "Henüz ilişkili bir saldırı örüntüsü tespit edilmedi. Olay hacmi arttıkça motor patlamaları ve dağıtık ağları otomatik gruplar.",
    "ko.bos.eslesmeBaslik": "Eşleşme yok",
    "ko.bos.eslesmeAciklama": "Filtre veya aramayla eşleşen korelasyon bulunamadı.",

    // Alt not
    "ko.not":
      "Korelasyon motoru gerçek kurallarla çalışır: 10 dakikalık pencerelerde aynı IP patlamaları, aynı ASN'deki çok-IP dağıtık ağları ve tek endpoint'e yoğunlaşan otomasyon tırmanışları ilişkilendirilir. Güven skoru olay hacmi, engelleme oranı ve IP yayılımından deterministik olarak hesaplanır.",
    "ko.not.gercekKurallar": "gerçek kurallarla",

    // Şiddet etiketleri (enum → anahtar)
    "ko.siddet.kritik": "Kritik",
    "ko.siddet.yuksek": "Yüksek",
    "ko.siddet.orta": "Orta",
    "ko.siddet.dusuk": "Düşük",

    // Tür etiketleri (enum → anahtar)
    "ko.tur.kimlik_dogrulama_saldirisi": "Kimlik Doğrulama Saldırısı",
    "ko.tur.kazima_kampanyasi": "Kazıma Kampanyası",
    "ko.tur.dagitik_bot_agi": "Dağıtık Bot Ağı",
    "ko.tur.hedefli_endpoint_saldirisi": "Hedefli Endpoint Saldırısı",
    "ko.tur.ip_patlamasi": "IP Patlaması",

    // Kart — özet satırı
    "ko.kart.olay": "olay",
    "ko.kart.ip": "IP",
    "ko.kart.engel": "engel",

    // Kart — detay
    "ko.detay.killchain": "Saldırı Zinciri (Kill-Chain)",
    "ko.detay.benzersizIp": "Benzersiz IP",
    "ko.detay.ulke": "Ülke",
    "ko.detay.asn": "ASN",
    "ko.detay.asnAg": "{n} ağ",
    "ko.detay.sure": "Süre",
    "ko.detay.guvenBaslik": "Korelasyon güven skoru",
    "ko.detay.guvenAlt": "Hacim, engelleme oranı ve IP yayılımından türetildi.",
    "ko.detay.ilkGorulme": "İlk görülme:",
    "ko.detay.sonGorulme": "Son görülme:",
    "ko.detay.endpointler": "Hedeflenen Endpoint'ler",
    "ko.detay.ornekOlaylar": "Örnek Olaylar ({a} / {b})",

    // Örnek olay tablosu başlıkları
    "ko.tablo.zaman": "Zaman",
    "ko.tablo.ip": "IP",
    "ko.tablo.ulke": "Ülke",
    "ko.tablo.path": "Path",
    "ko.tablo.sinif": "Sınıf",
    "ko.tablo.karar": "Karar",
    "ko.tablo.skor": "Skor",

    // Olaya dönüştür
    "ko.olay.aciklama": "Bu saldırı zincirini bir olaya dönüştür — atama, durum ve MTTR takibi başlasın.",
    "ko.olay.olustu": "Olay oluşturuldu — görüntüle",
    "ko.olay.olusturuluyor": "Oluşturuluyor…",
    "ko.olay.olustur": "Olay oluştur",

    // Toast
    "ko.toast.olustuBaslik": "Olay oluşturuldu",
    "ko.toast.olustuAciklama": "Olay Yönetimi'nde atama ve durum takibi yapabilirsin.",
    "ko.toast.olusturulamadi": "Olay oluşturulamadı",
    "ko.toast.raporIndi": "Korelasyon raporu indirildi",

    // İndirilen metin raporu (SIEM rapor indir)
    "ko.rapor.baslik": "GÜVENLİK OLAYI KORELASYON RAPORU",
    "ko.rapor.korelasyon": "korelasyon",
    "ko.rapor.kritik": "kritik",
    "ko.rapor.etkilenenIp": "etkilenen IP",
    "ko.rapor.tur": "Tür",
    "ko.rapor.guven": "Güven",
    "ko.rapor.olay": "Olay",
    "ko.rapor.benzersizIp": "Benzersiz IP",
    "ko.rapor.engel": "Engel",
    "ko.rapor.ulke": "Ülke",
    "ko.rapor.asn": "ASN",
    "ko.rapor.endpoint": "Endpoint",
    "ko.rapor.zincir": "Zincir",
    "ko.rapor.ilk": "İlk",
    "ko.rapor.son": "Son",

    // Süre birimleri (deterministik)
    "ko.birim.sn": "{n}sn",
    "ko.birim.dk": "{n}dk",
    "ko.birim.sa": "{n}sa",
    "ko.birim.g": "{n}g",

    // Kill-chain taktik cümleleri (motor Türkçe üretir → çeviri eşlemesi)
    "kc.kesif": "Keşif",
    "kc.erisimDenemesi": "Erişim denemesi",
    "kc.kabaKuvvet": "Kaba kuvvet",
    "kc.kimlikEleGecirme": "Kimlik bilgisi ele geçirme",
    "kc.otomatikGezinme": "Otomatik gezinme",
    "kc.veriCikarma": "Veri çıkarma",
    "kc.topluSizdirma": "Toplu sızdırma",
    "kc.altyapiHazirligi": "Altyapı hazırlığı",
    "kc.dagitikKoordinasyon": "Dağıtık koordinasyon",
    "kc.eszamanliErisim": "Eşzamanlı erişim",
    "kc.kaynakTuketimi": "Kaynak tüketimi",
    "kc.yuzeyTarama": "Yüzey tarama",
    "kc.endpointHedefleme": "Endpoint hedefleme",
    "kc.otomasyonIstismari": "Otomasyon istismarı",
    "kc.yukBindirme": "Yük bindirme",
    "kc.hacimArtisi": "Hacim artışı",

    // Başlık (baslik) önek segmentleri — motor Türkçe üretir → yeniden kurulur.
    // {x} yer tutucuları VERİ ile doldurulur (IP/ASN/path/dominant).
    "kb.kimlik": "Kimlik doğrulama saldırısı — {ip} (kaba kuvvet)",
    "kb.kazima": "Kazıma kampanyası — {ip} ({dom})",
    "kb.ip": "IP patlaması — {ip} ({dom})",
    "kb.dagitik": "Dağıtık bot ağı — {asn} üzerinden {path} hedefli ({dom})",
    "kb.endpoint": "Hedefli endpoint saldırısı — {path} ({dom})",
  },

  en: {
    "ko.serit.baslik": "Turn raw events into attack chains.",
    "ko.serit.aciklama":
      "The correlation engine examines {n} raw security events and groups matching IP bursts, distributed bot networks and targeted endpoint attacks into related incidents. Each correlation carries a kill-chain, a confidence score and a chain of evidence.",

    "ko.kpi.korelasyon": "Correlations (incidents)",
    "ko.kpi.kritik": "Critical correlations",
    "ko.kpi.etkilenenIp": "Affected IPs",
    "ko.kpi.aktif": "Active attacks",

    "ko.enYaygin": "Most common attack type:",
    "ko.aktifRozet": "{n} active attacks in progress",

    "ko.panel.baslik": "Related Incidents",
    "ko.btn.siem": "SIEM export",
    "ko.btn.rapor": "Download report",
    "ko.filtre.hepsi": "All",
    "ko.ara.yer": "Search IP, ASN, path, country…",
    "ko.ara.etiket": "Search correlations",

    "ko.bos.yokBaslik": "No correlations found",
    "ko.bos.yokAciklama":
      "No related attack pattern has been detected yet. As event volume grows, the engine automatically groups bursts and distributed networks.",
    "ko.bos.eslesmeBaslik": "No matches",
    "ko.bos.eslesmeAciklama": "No correlation matches the filter or search.",

    "ko.not":
      "The correlation engine runs on real rules: within 10-minute windows it links same-IP bursts, multi-IP distributed networks from the same ASN, and automation surges concentrated on a single endpoint. The confidence score is computed deterministically from event volume, block rate and IP spread.",
    "ko.not.gercekKurallar": "real rules",

    "ko.siddet.kritik": "Critical",
    "ko.siddet.yuksek": "High",
    "ko.siddet.orta": "Medium",
    "ko.siddet.dusuk": "Low",

    "ko.tur.kimlik_dogrulama_saldirisi": "Credential-Stuffing Attack",
    "ko.tur.kazima_kampanyasi": "Scraping Campaign",
    "ko.tur.dagitik_bot_agi": "Distributed Bot Network",
    "ko.tur.hedefli_endpoint_saldirisi": "Targeted Endpoint Attack",
    "ko.tur.ip_patlamasi": "IP Burst",

    "ko.kart.olay": "events",
    "ko.kart.ip": "IPs",
    "ko.kart.engel": "blocked",

    "ko.detay.killchain": "Attack Chain (Kill-Chain)",
    "ko.detay.benzersizIp": "Unique IPs",
    "ko.detay.ulke": "Country",
    "ko.detay.asn": "ASN",
    "ko.detay.asnAg": "{n} networks",
    "ko.detay.sure": "Duration",
    "ko.detay.guvenBaslik": "Correlation confidence score",
    "ko.detay.guvenAlt": "Derived from volume, block rate and IP spread.",
    "ko.detay.ilkGorulme": "First seen:",
    "ko.detay.sonGorulme": "Last seen:",
    "ko.detay.endpointler": "Targeted Endpoints",
    "ko.detay.ornekOlaylar": "Sample Events ({a} / {b})",

    "ko.tablo.zaman": "Time",
    "ko.tablo.ip": "IP",
    "ko.tablo.ulke": "Country",
    "ko.tablo.path": "Path",
    "ko.tablo.sinif": "Class",
    "ko.tablo.karar": "Verdict",
    "ko.tablo.skor": "Score",

    "ko.olay.aciklama": "Turn this attack chain into an incident — start assignment, status and MTTR tracking.",
    "ko.olay.olustu": "Incident created — view",
    "ko.olay.olusturuluyor": "Creating…",
    "ko.olay.olustur": "Create incident",

    "ko.toast.olustuBaslik": "Incident created",
    "ko.toast.olustuAciklama": "You can handle assignment and status tracking in Incident Management.",
    "ko.toast.olusturulamadi": "Could not create incident",
    "ko.toast.raporIndi": "Correlation report downloaded",

    "ko.rapor.baslik": "SECURITY INCIDENT CORRELATION REPORT",
    "ko.rapor.korelasyon": "correlations",
    "ko.rapor.kritik": "critical",
    "ko.rapor.etkilenenIp": "affected IPs",
    "ko.rapor.tur": "Type",
    "ko.rapor.guven": "Confidence",
    "ko.rapor.olay": "Events",
    "ko.rapor.benzersizIp": "Unique IPs",
    "ko.rapor.engel": "Blocked",
    "ko.rapor.ulke": "Country",
    "ko.rapor.asn": "ASN",
    "ko.rapor.endpoint": "Endpoint",
    "ko.rapor.zincir": "Chain",
    "ko.rapor.ilk": "First",
    "ko.rapor.son": "Last",

    "ko.birim.sn": "{n}s",
    "ko.birim.dk": "{n}m",
    "ko.birim.sa": "{n}h",
    "ko.birim.g": "{n}d",

    "kc.kesif": "Reconnaissance",
    "kc.erisimDenemesi": "Access attempt",
    "kc.kabaKuvvet": "Brute force",
    "kc.kimlikEleGecirme": "Credential compromise",
    "kc.otomatikGezinme": "Automated crawling",
    "kc.veriCikarma": "Data extraction",
    "kc.topluSizdirma": "Bulk exfiltration",
    "kc.altyapiHazirligi": "Infrastructure staging",
    "kc.dagitikKoordinasyon": "Distributed coordination",
    "kc.eszamanliErisim": "Concurrent access",
    "kc.kaynakTuketimi": "Resource exhaustion",
    "kc.yuzeyTarama": "Surface scanning",
    "kc.endpointHedefleme": "Endpoint targeting",
    "kc.otomasyonIstismari": "Automation abuse",
    "kc.yukBindirme": "Load amplification",
    "kc.hacimArtisi": "Volume ramp-up",

    "kb.kimlik": "Credential-stuffing attack — {ip} (brute force)",
    "kb.kazima": "Scraping campaign — {ip} ({dom})",
    "kb.ip": "IP burst — {ip} ({dom})",
    "kb.dagitik": "Distributed bot network — targeting {path} via {asn} ({dom})",
    "kb.endpoint": "Targeted endpoint attack — {path} ({dom})",
  },

  de: {
    "ko.serit.baslik": "Rohereignisse in Angriffsketten verwandeln.",
    "ko.serit.aciklama":
      "Die Korrelations-Engine untersucht {n} rohe Sicherheitsereignisse und gruppiert übereinstimmende IP-Ausbrüche, verteilte Bot-Netzwerke und gezielte Endpoint-Angriffe zu zusammenhängenden Vorfällen. Jede Korrelation trägt eine Kill-Chain, einen Konfidenzwert und eine Beweiskette.",

    "ko.kpi.korelasyon": "Korrelationen (Vorfälle)",
    "ko.kpi.kritik": "Kritische Korrelationen",
    "ko.kpi.etkilenenIp": "Betroffene IPs",
    "ko.kpi.aktif": "Aktive Angriffe",

    "ko.enYaygin": "Häufigster Angriffstyp:",
    "ko.aktifRozet": "{n} aktive Angriffe laufen",

    "ko.panel.baslik": "Zusammenhängende Vorfälle",
    "ko.btn.siem": "SIEM-Export",
    "ko.btn.rapor": "Bericht herunterladen",
    "ko.filtre.hepsi": "Alle",
    "ko.ara.yer": "IP, ASN, Pfad, Land suchen…",
    "ko.ara.etiket": "Korrelationen durchsuchen",

    "ko.bos.yokBaslik": "Keine Korrelationen gefunden",
    "ko.bos.yokAciklama":
      "Es wurde noch kein zusammenhängendes Angriffsmuster erkannt. Mit steigendem Ereignisvolumen gruppiert die Engine Ausbrüche und verteilte Netzwerke automatisch.",
    "ko.bos.eslesmeBaslik": "Keine Treffer",
    "ko.bos.eslesmeAciklama": "Keine Korrelation entspricht dem Filter oder der Suche.",

    "ko.not":
      "Die Korrelations-Engine arbeitet mit echten Regeln: In 10-Minuten-Fenstern verknüpft sie Same-IP-Ausbrüche, Multi-IP-verteilte Netzwerke aus demselben ASN und auf einen einzelnen Endpoint konzentrierte Automatisierungsspitzen. Der Konfidenzwert wird deterministisch aus Ereignisvolumen, Blockrate und IP-Streuung berechnet.",
    "ko.not.gercekKurallar": "echten Regeln",

    "ko.siddet.kritik": "Kritisch",
    "ko.siddet.yuksek": "Hoch",
    "ko.siddet.orta": "Mittel",
    "ko.siddet.dusuk": "Niedrig",

    "ko.tur.kimlik_dogrulama_saldirisi": "Credential-Stuffing-Angriff",
    "ko.tur.kazima_kampanyasi": "Scraping-Kampagne",
    "ko.tur.dagitik_bot_agi": "Verteiltes Bot-Netzwerk",
    "ko.tur.hedefli_endpoint_saldirisi": "Gezielter Endpoint-Angriff",
    "ko.tur.ip_patlamasi": "IP-Ausbruch",

    "ko.kart.olay": "Ereignisse",
    "ko.kart.ip": "IPs",
    "ko.kart.engel": "blockiert",

    "ko.detay.killchain": "Angriffskette (Kill-Chain)",
    "ko.detay.benzersizIp": "Eindeutige IPs",
    "ko.detay.ulke": "Land",
    "ko.detay.asn": "ASN",
    "ko.detay.asnAg": "{n} Netzwerke",
    "ko.detay.sure": "Dauer",
    "ko.detay.guvenBaslik": "Korrelations-Konfidenzwert",
    "ko.detay.guvenAlt": "Abgeleitet aus Volumen, Blockrate und IP-Streuung.",
    "ko.detay.ilkGorulme": "Erstmals gesehen:",
    "ko.detay.sonGorulme": "Zuletzt gesehen:",
    "ko.detay.endpointler": "Anvisierte Endpoints",
    "ko.detay.ornekOlaylar": "Beispielereignisse ({a} / {b})",

    "ko.tablo.zaman": "Zeit",
    "ko.tablo.ip": "IP",
    "ko.tablo.ulke": "Land",
    "ko.tablo.path": "Pfad",
    "ko.tablo.sinif": "Klasse",
    "ko.tablo.karar": "Urteil",
    "ko.tablo.skor": "Score",

    "ko.olay.aciklama": "Verwandeln Sie diese Angriffskette in einen Vorfall — starten Sie Zuweisung, Status- und MTTR-Verfolgung.",
    "ko.olay.olustu": "Vorfall erstellt — anzeigen",
    "ko.olay.olusturuluyor": "Wird erstellt…",
    "ko.olay.olustur": "Vorfall erstellen",

    "ko.toast.olustuBaslik": "Vorfall erstellt",
    "ko.toast.olustuAciklama": "Zuweisung und Statusverfolgung können Sie im Vorfallmanagement vornehmen.",
    "ko.toast.olusturulamadi": "Vorfall konnte nicht erstellt werden",
    "ko.toast.raporIndi": "Korrelationsbericht heruntergeladen",

    "ko.rapor.baslik": "KORRELATIONSBERICHT SICHERHEITSVORFÄLLE",
    "ko.rapor.korelasyon": "Korrelationen",
    "ko.rapor.kritik": "kritisch",
    "ko.rapor.etkilenenIp": "betroffene IPs",
    "ko.rapor.tur": "Typ",
    "ko.rapor.guven": "Konfidenz",
    "ko.rapor.olay": "Ereignisse",
    "ko.rapor.benzersizIp": "Eindeutige IPs",
    "ko.rapor.engel": "Blockiert",
    "ko.rapor.ulke": "Land",
    "ko.rapor.asn": "ASN",
    "ko.rapor.endpoint": "Endpoint",
    "ko.rapor.zincir": "Kette",
    "ko.rapor.ilk": "Erste",
    "ko.rapor.son": "Letzte",

    "ko.birim.sn": "{n}s",
    "ko.birim.dk": "{n}min",
    "ko.birim.sa": "{n}Std",
    "ko.birim.g": "{n}T",

    "kc.kesif": "Aufklärung",
    "kc.erisimDenemesi": "Zugriffsversuch",
    "kc.kabaKuvvet": "Brute Force",
    "kc.kimlikEleGecirme": "Kompromittierung von Anmeldedaten",
    "kc.otomatikGezinme": "Automatisiertes Crawling",
    "kc.veriCikarma": "Datenextraktion",
    "kc.topluSizdirma": "Massen-Exfiltration",
    "kc.altyapiHazirligi": "Infrastrukturvorbereitung",
    "kc.dagitikKoordinasyon": "Verteilte Koordination",
    "kc.eszamanliErisim": "Gleichzeitiger Zugriff",
    "kc.kaynakTuketimi": "Ressourcenerschöpfung",
    "kc.yuzeyTarama": "Oberflächen-Scan",
    "kc.endpointHedefleme": "Endpoint-Anvisierung",
    "kc.otomasyonIstismari": "Automatisierungsmissbrauch",
    "kc.yukBindirme": "Lastverstärkung",
    "kc.hacimArtisi": "Volumensteigerung",

    "kb.kimlik": "Credential-Stuffing-Angriff — {ip} (Brute Force)",
    "kb.kazima": "Scraping-Kampagne — {ip} ({dom})",
    "kb.ip": "IP-Ausbruch — {ip} ({dom})",
    "kb.dagitik": "Verteiltes Bot-Netzwerk — Ziel {path} über {asn} ({dom})",
    "kb.endpoint": "Gezielter Endpoint-Angriff — {path} ({dom})",
  },

  fr: {
    "ko.serit.baslik": "Transformez les événements bruts en chaînes d'attaque.",
    "ko.serit.aciklama":
      "Le moteur de corrélation examine {n} événements de sécurité bruts et regroupe les rafales d'IP identiques, les réseaux de bots distribués et les attaques ciblées d'endpoints en incidents liés. Chaque corrélation porte une kill-chain, un score de confiance et une chaîne de preuves.",

    "ko.kpi.korelasyon": "Corrélations (incidents)",
    "ko.kpi.kritik": "Corrélations critiques",
    "ko.kpi.etkilenenIp": "IP affectées",
    "ko.kpi.aktif": "Attaques actives",

    "ko.enYaygin": "Type d'attaque le plus fréquent :",
    "ko.aktifRozet": "{n} attaques actives en cours",

    "ko.panel.baslik": "Incidents liés",
    "ko.btn.siem": "Export SIEM",
    "ko.btn.rapor": "Télécharger le rapport",
    "ko.filtre.hepsi": "Toutes",
    "ko.ara.yer": "Rechercher IP, ASN, chemin, pays…",
    "ko.ara.etiket": "Rechercher dans les corrélations",

    "ko.bos.yokBaslik": "Aucune corrélation trouvée",
    "ko.bos.yokAciklama":
      "Aucun schéma d'attaque lié n'a encore été détecté. À mesure que le volume d'événements augmente, le moteur regroupe automatiquement les rafales et les réseaux distribués.",
    "ko.bos.eslesmeBaslik": "Aucune correspondance",
    "ko.bos.eslesmeAciklama": "Aucune corrélation ne correspond au filtre ou à la recherche.",

    "ko.not":
      "Le moteur de corrélation fonctionne avec de vraies règles : dans des fenêtres de 10 minutes, il relie les rafales d'une même IP, les réseaux distribués multi-IP d'un même ASN et les pics d'automatisation concentrés sur un seul endpoint. Le score de confiance est calculé de façon déterministe à partir du volume d'événements, du taux de blocage et de la dispersion des IP.",
    "ko.not.gercekKurallar": "de vraies règles",

    "ko.siddet.kritik": "Critique",
    "ko.siddet.yuksek": "Élevée",
    "ko.siddet.orta": "Moyenne",
    "ko.siddet.dusuk": "Faible",

    "ko.tur.kimlik_dogrulama_saldirisi": "Attaque par bourrage d'identifiants",
    "ko.tur.kazima_kampanyasi": "Campagne d'extraction",
    "ko.tur.dagitik_bot_agi": "Réseau de bots distribué",
    "ko.tur.hedefli_endpoint_saldirisi": "Attaque ciblée d'endpoint",
    "ko.tur.ip_patlamasi": "Rafale d'IP",

    "ko.kart.olay": "événements",
    "ko.kart.ip": "IP",
    "ko.kart.engel": "bloqués",

    "ko.detay.killchain": "Chaîne d'attaque (Kill-Chain)",
    "ko.detay.benzersizIp": "IP uniques",
    "ko.detay.ulke": "Pays",
    "ko.detay.asn": "ASN",
    "ko.detay.asnAg": "{n} réseaux",
    "ko.detay.sure": "Durée",
    "ko.detay.guvenBaslik": "Score de confiance de corrélation",
    "ko.detay.guvenAlt": "Dérivé du volume, du taux de blocage et de la dispersion des IP.",
    "ko.detay.ilkGorulme": "Première apparition :",
    "ko.detay.sonGorulme": "Dernière apparition :",
    "ko.detay.endpointler": "Endpoints ciblés",
    "ko.detay.ornekOlaylar": "Événements d'exemple ({a} / {b})",

    "ko.tablo.zaman": "Heure",
    "ko.tablo.ip": "IP",
    "ko.tablo.ulke": "Pays",
    "ko.tablo.path": "Chemin",
    "ko.tablo.sinif": "Classe",
    "ko.tablo.karar": "Verdict",
    "ko.tablo.skor": "Score",

    "ko.olay.aciklama": "Transformez cette chaîne d'attaque en incident — lancez l'affectation, le suivi de statut et du MTTR.",
    "ko.olay.olustu": "Incident créé — voir",
    "ko.olay.olusturuluyor": "Création…",
    "ko.olay.olustur": "Créer un incident",

    "ko.toast.olustuBaslik": "Incident créé",
    "ko.toast.olustuAciklama": "Vous pouvez gérer l'affectation et le suivi de statut dans la Gestion des incidents.",
    "ko.toast.olusturulamadi": "Impossible de créer l'incident",
    "ko.toast.raporIndi": "Rapport de corrélation téléchargé",

    "ko.rapor.baslik": "RAPPORT DE CORRÉLATION D'INCIDENTS DE SÉCURITÉ",
    "ko.rapor.korelasyon": "corrélations",
    "ko.rapor.kritik": "critiques",
    "ko.rapor.etkilenenIp": "IP affectées",
    "ko.rapor.tur": "Type",
    "ko.rapor.guven": "Confiance",
    "ko.rapor.olay": "Événements",
    "ko.rapor.benzersizIp": "IP uniques",
    "ko.rapor.engel": "Bloqués",
    "ko.rapor.ulke": "Pays",
    "ko.rapor.asn": "ASN",
    "ko.rapor.endpoint": "Endpoint",
    "ko.rapor.zincir": "Chaîne",
    "ko.rapor.ilk": "Début",
    "ko.rapor.son": "Fin",

    "ko.birim.sn": "{n}s",
    "ko.birim.dk": "{n}min",
    "ko.birim.sa": "{n}h",
    "ko.birim.g": "{n}j",

    "kc.kesif": "Reconnaissance",
    "kc.erisimDenemesi": "Tentative d'accès",
    "kc.kabaKuvvet": "Force brute",
    "kc.kimlikEleGecirme": "Compromission d'identifiants",
    "kc.otomatikGezinme": "Navigation automatisée",
    "kc.veriCikarma": "Extraction de données",
    "kc.topluSizdirma": "Exfiltration en masse",
    "kc.altyapiHazirligi": "Préparation de l'infrastructure",
    "kc.dagitikKoordinasyon": "Coordination distribuée",
    "kc.eszamanliErisim": "Accès simultané",
    "kc.kaynakTuketimi": "Épuisement des ressources",
    "kc.yuzeyTarama": "Balayage de surface",
    "kc.endpointHedefleme": "Ciblage d'endpoint",
    "kc.otomasyonIstismari": "Abus d'automatisation",
    "kc.yukBindirme": "Amplification de charge",
    "kc.hacimArtisi": "Montée en volume",

    "kb.kimlik": "Attaque par bourrage d'identifiants — {ip} (force brute)",
    "kb.kazima": "Campagne d'extraction — {ip} ({dom})",
    "kb.ip": "Rafale d'IP — {ip} ({dom})",
    "kb.dagitik": "Réseau de bots distribué — ciblant {path} via {asn} ({dom})",
    "kb.endpoint": "Attaque ciblée d'endpoint — {path} ({dom})",
  },

  es: {
    "ko.serit.baslik": "Convierte los eventos en bruto en cadenas de ataque.",
    "ko.serit.aciklama":
      "El motor de correlación examina {n} eventos de seguridad en bruto y agrupa las ráfagas de una misma IP, las redes de bots distribuidas y los ataques dirigidos a endpoints en incidentes relacionados. Cada correlación lleva una kill-chain, una puntuación de confianza y una cadena de evidencias.",

    "ko.kpi.korelasyon": "Correlaciones (incidentes)",
    "ko.kpi.kritik": "Correlaciones críticas",
    "ko.kpi.etkilenenIp": "IP afectadas",
    "ko.kpi.aktif": "Ataques activos",

    "ko.enYaygin": "Tipo de ataque más común:",
    "ko.aktifRozet": "{n} ataques activos en curso",

    "ko.panel.baslik": "Incidentes relacionados",
    "ko.btn.siem": "Exportar a SIEM",
    "ko.btn.rapor": "Descargar informe",
    "ko.filtre.hepsi": "Todas",
    "ko.ara.yer": "Buscar IP, ASN, ruta, país…",
    "ko.ara.etiket": "Buscar en correlaciones",

    "ko.bos.yokBaslik": "No se encontraron correlaciones",
    "ko.bos.yokAciklama":
      "Aún no se ha detectado ningún patrón de ataque relacionado. A medida que aumenta el volumen de eventos, el motor agrupa automáticamente las ráfagas y las redes distribuidas.",
    "ko.bos.eslesmeBaslik": "Sin coincidencias",
    "ko.bos.eslesmeAciklama": "Ninguna correlación coincide con el filtro o la búsqueda.",

    "ko.not":
      "El motor de correlación funciona con reglas reales: en ventanas de 10 minutos vincula ráfagas de una misma IP, redes distribuidas multi-IP del mismo ASN y picos de automatización concentrados en un solo endpoint. La puntuación de confianza se calcula de forma determinista a partir del volumen de eventos, la tasa de bloqueo y la dispersión de IP.",
    "ko.not.gercekKurallar": "reglas reales",

    "ko.siddet.kritik": "Crítica",
    "ko.siddet.yuksek": "Alta",
    "ko.siddet.orta": "Media",
    "ko.siddet.dusuk": "Baja",

    "ko.tur.kimlik_dogrulama_saldirisi": "Ataque de relleno de credenciales",
    "ko.tur.kazima_kampanyasi": "Campaña de scraping",
    "ko.tur.dagitik_bot_agi": "Red de bots distribuida",
    "ko.tur.hedefli_endpoint_saldirisi": "Ataque dirigido a endpoint",
    "ko.tur.ip_patlamasi": "Ráfaga de IP",

    "ko.kart.olay": "eventos",
    "ko.kart.ip": "IP",
    "ko.kart.engel": "bloqueados",

    "ko.detay.killchain": "Cadena de ataque (Kill-Chain)",
    "ko.detay.benzersizIp": "IP únicas",
    "ko.detay.ulke": "País",
    "ko.detay.asn": "ASN",
    "ko.detay.asnAg": "{n} redes",
    "ko.detay.sure": "Duración",
    "ko.detay.guvenBaslik": "Puntuación de confianza de la correlación",
    "ko.detay.guvenAlt": "Derivada del volumen, la tasa de bloqueo y la dispersión de IP.",
    "ko.detay.ilkGorulme": "Primera aparición:",
    "ko.detay.sonGorulme": "Última aparición:",
    "ko.detay.endpointler": "Endpoints objetivo",
    "ko.detay.ornekOlaylar": "Eventos de muestra ({a} / {b})",

    "ko.tablo.zaman": "Hora",
    "ko.tablo.ip": "IP",
    "ko.tablo.ulke": "País",
    "ko.tablo.path": "Ruta",
    "ko.tablo.sinif": "Clase",
    "ko.tablo.karar": "Veredicto",
    "ko.tablo.skor": "Puntuación",

    "ko.olay.aciklama": "Convierte esta cadena de ataque en un incidente — inicia la asignación, el estado y el seguimiento del MTTR.",
    "ko.olay.olustu": "Incidente creado — ver",
    "ko.olay.olusturuluyor": "Creando…",
    "ko.olay.olustur": "Crear incidente",

    "ko.toast.olustuBaslik": "Incidente creado",
    "ko.toast.olustuAciklama": "Puedes gestionar la asignación y el seguimiento de estado en Gestión de incidentes.",
    "ko.toast.olusturulamadi": "No se pudo crear el incidente",
    "ko.toast.raporIndi": "Informe de correlación descargado",

    "ko.rapor.baslik": "INFORME DE CORRELACIÓN DE INCIDENTES DE SEGURIDAD",
    "ko.rapor.korelasyon": "correlaciones",
    "ko.rapor.kritik": "críticas",
    "ko.rapor.etkilenenIp": "IP afectadas",
    "ko.rapor.tur": "Tipo",
    "ko.rapor.guven": "Confianza",
    "ko.rapor.olay": "Eventos",
    "ko.rapor.benzersizIp": "IP únicas",
    "ko.rapor.engel": "Bloqueados",
    "ko.rapor.ulke": "País",
    "ko.rapor.asn": "ASN",
    "ko.rapor.endpoint": "Endpoint",
    "ko.rapor.zincir": "Cadena",
    "ko.rapor.ilk": "Inicio",
    "ko.rapor.son": "Fin",

    "ko.birim.sn": "{n}s",
    "ko.birim.dk": "{n}min",
    "ko.birim.sa": "{n}h",
    "ko.birim.g": "{n}d",

    "kc.kesif": "Reconocimiento",
    "kc.erisimDenemesi": "Intento de acceso",
    "kc.kabaKuvvet": "Fuerza bruta",
    "kc.kimlikEleGecirme": "Compromiso de credenciales",
    "kc.otomatikGezinme": "Navegación automatizada",
    "kc.veriCikarma": "Extracción de datos",
    "kc.topluSizdirma": "Exfiltración masiva",
    "kc.altyapiHazirligi": "Preparación de infraestructura",
    "kc.dagitikKoordinasyon": "Coordinación distribuida",
    "kc.eszamanliErisim": "Acceso simultáneo",
    "kc.kaynakTuketimi": "Agotamiento de recursos",
    "kc.yuzeyTarama": "Escaneo de superficie",
    "kc.endpointHedefleme": "Selección de endpoint",
    "kc.otomasyonIstismari": "Abuso de automatización",
    "kc.yukBindirme": "Amplificación de carga",
    "kc.hacimArtisi": "Aumento de volumen",

    "kb.kimlik": "Ataque de relleno de credenciales — {ip} (fuerza bruta)",
    "kb.kazima": "Campaña de scraping — {ip} ({dom})",
    "kb.ip": "Ráfaga de IP — {ip} ({dom})",
    "kb.dagitik": "Red de bots distribuida — dirigida a {path} vía {asn} ({dom})",
    "kb.endpoint": "Ataque dirigido a endpoint — {path} ({dom})",
  },
};

/* Kill-chain taktik cümlesi (Türkçe, motordan) → i18n anahtarı. */
const KILLCHAIN_ANAHTAR: Record<string, string> = {
  "Keşif": "kc.kesif",
  "Erişim denemesi": "kc.erisimDenemesi",
  "Kaba kuvvet": "kc.kabaKuvvet",
  "Kimlik bilgisi ele geçirme": "kc.kimlikEleGecirme",
  "Otomatik gezinme": "kc.otomatikGezinme",
  "Veri çıkarma": "kc.veriCikarma",
  "Toplu sızdırma": "kc.topluSizdirma",
  "Altyapı hazırlığı": "kc.altyapiHazirligi",
  "Dağıtık koordinasyon": "kc.dagitikKoordinasyon",
  "Eşzamanlı erişim": "kc.eszamanliErisim",
  "Kaynak tüketimi": "kc.kaynakTuketimi",
  "Yüzey tarama": "kc.yuzeyTarama",
  "Endpoint hedefleme": "kc.endpointHedefleme",
  "Otomasyon istismarı": "kc.otomasyonIstismari",
  "Yük bindirme": "kc.yukBindirme",
  "Hacim artışı": "kc.hacimArtisi",
};

/**
 * Motorun ürettiği Türkçe kill-chain taktiğini çevir. Eşleşmezse (beklenmedik
 * yeni bir taktik) Türkçe orijinali korunur — hiçbir zaman boş dönmez.
 */
export function killchainCeviri(taktik: string, dil: Dil): string {
  const anahtar = KILLCHAIN_ANAHTAR[taktik];
  return anahtar ? korelasyonCeviri(anahtar, dil) : taktik;
}

/**
 * Motorun ürettiği Türkçe `baslik`'ı çevir. Başlık sabit bir Türkçe önek +
 * araya giren VERİ (IP/ASN/path/dominant) taşır. Türkçe deseni geri-ayrıştırıp
 * veriyi koruyarak hedef dilde yeniden kurar. Desen tanınmazsa orijinal döner.
 */
export function korelasyonBaslikCeviri(baslik: string, dil: Dil): string {
  // Kimlik doğrulama saldırısı — {ip} (kaba kuvvet)
  let m = baslik.match(/^Kimlik doğrulama saldırısı — (.+) \(kaba kuvvet\)$/);
  if (m) return korelasyonCeviri("kb.kimlik", dil).replace("{ip}", m[1]);
  // Kazıma kampanyası — {ip} ({dom})
  m = baslik.match(/^Kazıma kampanyası — (.+) \((.+)\)$/);
  if (m) return korelasyonCeviri("kb.kazima", dil).replace("{ip}", m[1]).replace("{dom}", m[2]);
  // Dağıtık bot ağı — {asn} üzerinden {path} hedefli ({dom})
  m = baslik.match(/^Dağıtık bot ağı — (.+) üzerinden (.+) hedefli \((.+)\)$/);
  if (m) return korelasyonCeviri("kb.dagitik", dil).replace("{asn}", m[1]).replace("{path}", m[2]).replace("{dom}", m[3]);
  // Hedefli endpoint saldırısı — {path} ({dom})
  m = baslik.match(/^Hedefli endpoint saldırısı — (.+) \((.+)\)$/);
  if (m) return korelasyonCeviri("kb.endpoint", dil).replace("{path}", m[1]).replace("{dom}", m[2]);
  // IP patlaması — {ip} ({dom})
  m = baslik.match(/^IP patlaması — (.+) \((.+)\)$/);
  if (m) return korelasyonCeviri("kb.ip", dil).replace("{ip}", m[1]).replace("{dom}", m[2]);
  return baslik;
}

/** Anahtarı verilen dile çevir. Bulunamazsa TR'ye, o da yoksa anahtara düşer. */
export function korelasyonCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
