import type { Dil } from "@/lib/i18n/panel";

/**
 * Webhook İzleme sayfasına özel i18n sözlüğü (yalnızca bu modül).
 * "wm." namespace'li anahtarlar. Doğal/native çeviriler; durum kodları (200,
 * 503…), URL'ler, olay adları, gizli anahtar önekleri, imza başlıkları, kod
 * örnekleri, sayı/ms değerleri ve enum değerleri çevrilmez.
 * TR kaynak/otorite; anahtar bulunamazsa TR'ye, o da yoksa anahtarın kendisine düşer.
 */
const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // --- Göreli zaman ---
    "wm.zaman.azOnce": "az önce",
    "wm.zaman.dk": "{n}dk önce",
    "wm.zaman.sa": "{n}sa önce",
    "wm.zaman.gun": "{n}g önce",

    // --- Durum pill (bağlantı hatası hariç kodlar çevrilmez) ---
    "wm.durum.baglantiHatasi": "bağlantı hatası",

    // --- Sağlık meta ---
    "wm.saglik.saglikli": "Sağlıklı",
    "wm.saglik.bozuk": "Bozuk",
    "wm.saglik.dlq": "DLQ",

    // --- Açıklama şeridi ---
    "wm.giris.baslik": "Olay teslimatını uçtan uca izle.",
    "wm.giris.aciklama": "Her webhook uç noktasının başarı oranını, gecikmesini, yeniden-deneme zamanlamasını ve ölü-mektup kuyruğunu (DLQ) tek konsolda gör. HMAC imzasıyla teslimatların gerçekliğini doğrula.",

    // --- Özet kartları ---
    "wm.ozet.toplam": "Toplam teslimat denemesi",
    "wm.ozet.basari": "Başarı oranı",
    "wm.ozet.gecikme": "Ortalama gecikme",
    "wm.ozet.dlq": "Ölü mektup (DLQ)",

    // --- Temsili veri uyarısı ---
    "wm.temsili": "Gerçek teslimat kaydı seyrek olduğu için konsol, uç noktanın yapılandırmasından türetilen <b>temsili ama deterministik</b> teslimat geçmişiyle zenginleştirildi. Test teslimatı gönderdikçe gerçek kayıtlar birikir.",

    // --- Sağlık matrisi ---
    "wm.matris.baslik": "Uç nokta sağlık matrisi",
    "wm.matris.saglikli": "{n} sağlıklı",
    "wm.matris.bozuk": "{n} bozuk",
    "wm.matris.dlq": "{n} DLQ",
    "wm.matris.bos": "Henüz webhook uç noktası yok.",
    "wm.matris.pasif": "Pasif",
    "wm.matris.testTeslimat": "Test teslimatı",
    "wm.matris.basariOrani": "Başarı oranı",
    "wm.matris.gecikme": "Ort · p95 gecikme",
    "wm.matris.yenidenDeneme": "Yeniden deneme",
    "wm.matris.sonDurum": "Son durum",

    // --- Teslimat sağlığı (gauge + histogram + ısı) ---
    "wm.saglikOzet.baslik": "Teslimat sağlığı özeti",
    "wm.saglikOzet.gauge": "Teslimat başarısı",
    "wm.saglikOzet.gaugeAlt": "2xx oranı",
    "wm.saglikOzet.gecikmeGauge": "Gecikme sağlığı",
    "wm.saglikOzet.gecikmeAlt": "≤500ms hedef",
    "wm.dagilim.baslik": "Durum kodu dağılımı",
    "wm.dagilim.aciklama": "Tüm teslimat denemelerinin HTTP durum sınıflarına göre dağılımı.",
    "wm.dagilim.histoBaslik": "HTTP kod grubu histogramı",
    "wm.dagilim.histoAciklama": "Teslimat denemelerinin 2xx / 3xx / 4xx / 5xx / bağlantı hatası kovalarına göre sayısı.",
    "wm.isi.baslik": "Uç nokta × durum ısı-matris",
    "wm.isi.aciklama": "Her uç noktanın durum sınıflarına göre teslimat yoğunluğu — sıcak hücreler dikkat ister.",
    "wm.isi.basarili": "2xx",
    "wm.isi.kaliciHata": "4xx",
    "wm.isi.geciciHata": "5xx/0",

    // --- Başarı trendi ---
    "wm.trend.baslik": "Teslimat başarı trendi (son 7 gün · 12 saatlik kova)",
    "wm.trend.aciklama": "Zaman içinde 2xx başarı yüzdesi. Düşüşler geçici endpoint sorunlarını işaret eder.",

    // --- Teslimat akışı ---
    "wm.akis.baslik": "Teslimat akışı",
    "wm.akis.durumFiltre": "Duruma göre filtrele",
    "wm.akis.tumDurumlar": "Tüm durumlar",
    "wm.akis.basarili": "Başarılı (2xx)",
    "wm.akis.kaliciHata": "Kalıcı hata (4xx)",
    "wm.akis.geciciHata": "Geçici hata (5xx/0)",
    "wm.akis.ucFiltre": "Uç noktaya göre filtrele",
    "wm.akis.tumUcNoktalar": "Tüm uç noktalar",
    "wm.akis.thOlay": "Olay",
    "wm.akis.thUcNokta": "Uç nokta",
    "wm.akis.thDurum": "Durum",
    "wm.akis.thDeneme": "Deneme",
    "wm.akis.thGecikme": "Gecikme",
    "wm.akis.thZaman": "Zaman",
    "wm.akis.filtreBos": "Filtreye uyan teslimat yok.",
    "wm.akis.yenidenDeneTip": "Bu teslimatı yeniden dene",
    "wm.akis.yenidenDeneAria": "Yeniden dene",
    "wm.akis.limit": "En yeni 60 teslimat gösteriliyor ({n} toplam).",

    // --- DLQ ---
    "wm.dlq.baslik": "Ölü mektup kuyruğu (DLQ)",
    "wm.dlq.temizBaslik": "Kuyruk temiz",
    "wm.dlq.temizAciklama": "Tüm denemelerini tüketen başarısız teslimat yok.",
    "wm.dlq.denemeTukendi": "{n} deneme tükendi",
    "wm.dlq.manuelDene": "Manuel yeniden dene",
    "wm.dlq.sonDeneme": "Son deneme {zaman} · toplam {n}/{maks} deneme başarısız",

    // --- Backoff ---
    "wm.backoff.baslik": "Yeniden deneme backoff programı",
    "wm.backoff.aciklama": "Başarısız (5xx / bağlantı hatası) teslimatlar üstel geri çekilmeyle yeniden denenir. {maks} denemeden sonra hâlâ başarısızsa teslimat DLQ'ya düşer.",
    "wm.backoff.ilkEtiket": "İlk teslimat denemesi",
    "wm.backoff.ilkAlt": "olay tetiklenir tetiklenmez",
    "wm.backoff.denemeEtiket": "{n}. deneme",
    "wm.backoff.denemeAlt": "önceki başarısızlıktan {etiket} sonra",
    "wm.backoff.dlqEtiket": "DLQ'ya düşürülür",
    "wm.backoff.dlqAlt": "tüm denemeler tükendi",
    "wm.backoff.pencere": "Toplam pencere: {toplam} ({adimlar})",

    // --- HMAC ---
    "wm.hmac.baslik": "HMAC imza doğrulama",
    "wm.hmac.ucSec": "İmza için uç nokta seç",
    "wm.hmac.aciklama1": "Her teslimatta",
    "wm.hmac.aciklama2": "başlığı gönderilir. Alıcı, gövdeyi paylaşılan gizli anahtarla imzalayıp karşılaştırarak teslimatın gerçekten Veylify'dan geldiğini (ve değiştirilmediğini) doğrular. Biçim:",
    "wm.hmac.ucNokta": "Uç nokta:",
    "wm.hmac.gizliAnahtar": "Gizli anahtar:",
    "wm.hmac.maskeli": "maskeli",
    "wm.hmac.ornekImza": "Örnek imza başlığı:",
    "wm.hmac.nodeBaslik": "Node.js — imza doğrulama",
    "wm.hmac.pythonBaslik": "Python — imza doğrulama",

    // --- Not ---
    "wm.not.metin": "Uç nokta yönetimi (oluşturma / silme / gerçek test teslimatı) <b>Geliştirici</b> modülünden yapılır. Buradaki \"Test teslimatı\", \"Yeniden dene\" ve \"Manuel yeniden dene\" eylemleri bu izleme konsolunda teslimat motorunu tetikleyen birer <b>simülasyondur</b>; gerçek teslimat kayıtları teslimat motoru çalıştıkça birikir.",

    // --- Yeniden deneme toast ---
    "wm.toast.dlqBaslik": "Yeniden teslim kuyruğa alındı — demo",
    "wm.toast.normalBaslik": "Yeniden teslim kuyruğa alındı — demo",
    "wm.toast.aciklama": "{url} — gerçek teslimat motoru üstel geri çekilmeyle deneyecek. Bu izleme konsolunda eylem demo/simülasyondur.",

    // --- Temsili kayıt rozeti ---
    "wm.temsiliRozet": "temsili",
    "wm.temsiliRozetTip": "Bu kayıt, uç nokta yapılandırmasından türetilen deterministik temsili geçmiştendir (gerçek teslimat değil).",
  },
  en: {
    "wm.zaman.azOnce": "just now",
    "wm.zaman.dk": "{n}m ago",
    "wm.zaman.sa": "{n}h ago",
    "wm.zaman.gun": "{n}d ago",

    "wm.durum.baglantiHatasi": "connection error",

    "wm.saglik.saglikli": "Healthy",
    "wm.saglik.bozuk": "Degraded",
    "wm.saglik.dlq": "DLQ",

    "wm.giris.baslik": "Monitor event delivery end to end.",
    "wm.giris.aciklama": "See each webhook endpoint's success rate, latency, retry timing and dead-letter queue (DLQ) in a single console. Verify delivery authenticity with the HMAC signature.",

    "wm.ozet.toplam": "Total delivery attempts",
    "wm.ozet.basari": "Success rate",
    "wm.ozet.gecikme": "Average latency",
    "wm.ozet.dlq": "Dead letter (DLQ)",

    "wm.temsili": "Because real delivery records are sparse, the console has been enriched with a <b>representative but deterministic</b> delivery history derived from the endpoint's configuration. As you send test deliveries, real records accumulate.",

    "wm.matris.baslik": "Endpoint health matrix",
    "wm.matris.saglikli": "{n} healthy",
    "wm.matris.bozuk": "{n} degraded",
    "wm.matris.dlq": "{n} DLQ",
    "wm.matris.bos": "No webhook endpoint yet.",
    "wm.matris.pasif": "Inactive",
    "wm.matris.testTeslimat": "Test delivery",
    "wm.matris.basariOrani": "Success rate",
    "wm.matris.gecikme": "Avg · p95 latency",
    "wm.matris.yenidenDeneme": "Retries",
    "wm.matris.sonDurum": "Last status",

    "wm.saglikOzet.baslik": "Delivery health summary",
    "wm.saglikOzet.gauge": "Delivery success",
    "wm.saglikOzet.gaugeAlt": "2xx rate",
    "wm.saglikOzet.gecikmeGauge": "Latency health",
    "wm.saglikOzet.gecikmeAlt": "≤500ms target",
    "wm.dagilim.baslik": "Status code distribution",
    "wm.dagilim.aciklama": "Distribution of all delivery attempts by HTTP status class.",
    "wm.dagilim.histoBaslik": "HTTP code group histogram",
    "wm.dagilim.histoAciklama": "Delivery attempt counts by 2xx / 3xx / 4xx / 5xx / connection-error buckets.",
    "wm.isi.baslik": "Endpoint × status heatmap",
    "wm.isi.aciklama": "Each endpoint's delivery density by status class — hot cells need attention.",
    "wm.isi.basarili": "2xx",
    "wm.isi.kaliciHata": "4xx",
    "wm.isi.geciciHata": "5xx/0",

    "wm.trend.baslik": "Delivery success trend (last 7 days · 12-hour buckets)",
    "wm.trend.aciklama": "The 2xx success percentage over time. Drops indicate transient endpoint issues.",

    "wm.akis.baslik": "Delivery stream",
    "wm.akis.durumFiltre": "Filter by status",
    "wm.akis.tumDurumlar": "All statuses",
    "wm.akis.basarili": "Successful (2xx)",
    "wm.akis.kaliciHata": "Permanent error (4xx)",
    "wm.akis.geciciHata": "Transient error (5xx/0)",
    "wm.akis.ucFiltre": "Filter by endpoint",
    "wm.akis.tumUcNoktalar": "All endpoints",
    "wm.akis.thOlay": "Event",
    "wm.akis.thUcNokta": "Endpoint",
    "wm.akis.thDurum": "Status",
    "wm.akis.thDeneme": "Attempt",
    "wm.akis.thGecikme": "Latency",
    "wm.akis.thZaman": "Time",
    "wm.akis.filtreBos": "No delivery matches the filter.",
    "wm.akis.yenidenDeneTip": "Retry this delivery",
    "wm.akis.yenidenDeneAria": "Retry",
    "wm.akis.limit": "Showing the latest 60 deliveries ({n} total).",

    "wm.dlq.baslik": "Dead letter queue (DLQ)",
    "wm.dlq.temizBaslik": "Queue is clean",
    "wm.dlq.temizAciklama": "No failed delivery that exhausted all its attempts.",
    "wm.dlq.denemeTukendi": "{n} attempts exhausted",
    "wm.dlq.manuelDene": "Manual retry",
    "wm.dlq.sonDeneme": "Last attempt {zaman} · {n}/{maks} attempts failed in total",

    "wm.backoff.baslik": "Retry backoff schedule",
    "wm.backoff.aciklama": "Failed (5xx / connection error) deliveries are retried with exponential backoff. If still failing after {maks} attempts, the delivery drops to the DLQ.",
    "wm.backoff.ilkEtiket": "First delivery attempt",
    "wm.backoff.ilkAlt": "as soon as the event triggers",
    "wm.backoff.denemeEtiket": "Attempt {n}",
    "wm.backoff.denemeAlt": "{etiket} after the previous failure",
    "wm.backoff.dlqEtiket": "Dropped to DLQ",
    "wm.backoff.dlqAlt": "all attempts exhausted",
    "wm.backoff.pencere": "Total window: {toplam} ({adimlar})",

    "wm.hmac.baslik": "HMAC signature verification",
    "wm.hmac.ucSec": "Select endpoint for signature",
    "wm.hmac.aciklama1": "Each delivery sends an",
    "wm.hmac.aciklama2": "header. The recipient signs the body with the shared secret and compares it to verify the delivery truly came from Veylify (and was not tampered with). Format:",
    "wm.hmac.ucNokta": "Endpoint:",
    "wm.hmac.gizliAnahtar": "Secret:",
    "wm.hmac.maskeli": "masked",
    "wm.hmac.ornekImza": "Example signature header:",
    "wm.hmac.nodeBaslik": "Node.js — signature verification",
    "wm.hmac.pythonBaslik": "Python — signature verification",

    "wm.not.metin": "Endpoint management (create / delete / real test delivery) is done from the <b>Developer</b> module. The \"Test delivery\", \"Retry\" and \"Manual retry\" actions here are each a <b>simulation</b> that triggers the delivery engine within this monitoring console; real delivery records accumulate as the delivery engine runs.",

    "wm.toast.dlqBaslik": "Redelivery queued — demo",
    "wm.toast.normalBaslik": "Redelivery queued — demo",
    "wm.toast.aciklama": "{url} — the real delivery engine will retry with exponential backoff. In this monitoring console the action is a demo/simulation.",

    "wm.temsiliRozet": "sample",
    "wm.temsiliRozetTip": "This record comes from the deterministic representative history derived from the endpoint configuration (not a real delivery).",
  },
  de: {
    "wm.zaman.azOnce": "gerade eben",
    "wm.zaman.dk": "vor {n} Min.",
    "wm.zaman.sa": "vor {n} Std.",
    "wm.zaman.gun": "vor {n} T.",

    "wm.durum.baglantiHatasi": "Verbindungsfehler",

    "wm.saglik.saglikli": "Gesund",
    "wm.saglik.bozuk": "Beeinträchtigt",
    "wm.saglik.dlq": "DLQ",

    "wm.giris.baslik": "Ereigniszustellung durchgängig überwachen.",
    "wm.giris.aciklama": "Sehen Sie Erfolgsrate, Latenz, Wiederholungszeitplan und Dead-Letter-Queue (DLQ) jedes Webhook-Endpunkts in einer einzigen Konsole. Prüfen Sie die Echtheit der Zustellung mit der HMAC-Signatur.",

    "wm.ozet.toplam": "Gesamte Zustellversuche",
    "wm.ozet.basari": "Erfolgsrate",
    "wm.ozet.gecikme": "Durchschnittliche Latenz",
    "wm.ozet.dlq": "Dead Letter (DLQ)",

    "wm.temsili": "Da echte Zustellprotokolle selten sind, wurde die Konsole mit einer <b>repräsentativen, aber deterministischen</b> Zustellhistorie angereichert, die aus der Endpunktkonfiguration abgeleitet ist. Wenn Sie Testzustellungen senden, sammeln sich echte Datensätze an.",

    "wm.matris.baslik": "Endpunkt-Zustandsmatrix",
    "wm.matris.saglikli": "{n} gesund",
    "wm.matris.bozuk": "{n} beeinträchtigt",
    "wm.matris.dlq": "{n} DLQ",
    "wm.matris.bos": "Noch kein Webhook-Endpunkt.",
    "wm.matris.pasif": "Inaktiv",
    "wm.matris.testTeslimat": "Testzustellung",
    "wm.matris.basariOrani": "Erfolgsrate",
    "wm.matris.gecikme": "Durchschn. · p95-Latenz",
    "wm.matris.yenidenDeneme": "Wiederholungen",
    "wm.matris.sonDurum": "Letzter Status",

    "wm.saglikOzet.baslik": "Zustellungsgesundheit — Übersicht",
    "wm.saglikOzet.gauge": "Zustellerfolg",
    "wm.saglikOzet.gaugeAlt": "2xx-Rate",
    "wm.saglikOzet.gecikmeGauge": "Latenzgesundheit",
    "wm.saglikOzet.gecikmeAlt": "≤500ms Ziel",
    "wm.dagilim.baslik": "Verteilung der Statuscodes",
    "wm.dagilim.aciklama": "Verteilung aller Zustellversuche nach HTTP-Statusklasse.",
    "wm.dagilim.histoBaslik": "Histogramm der HTTP-Codegruppen",
    "wm.dagilim.histoAciklama": "Anzahl der Zustellversuche nach Buckets 2xx / 3xx / 4xx / 5xx / Verbindungsfehler.",
    "wm.isi.baslik": "Endpunkt × Status Heatmap",
    "wm.isi.aciklama": "Zustelldichte jedes Endpunkts nach Statusklasse — heiße Zellen erfordern Aufmerksamkeit.",
    "wm.isi.basarili": "2xx",
    "wm.isi.kaliciHata": "4xx",
    "wm.isi.geciciHata": "5xx/0",

    "wm.trend.baslik": "Zustellerfolgstrend (letzte 7 Tage · 12-Stunden-Buckets)",
    "wm.trend.aciklama": "Der 2xx-Erfolgsprozentsatz im Zeitverlauf. Einbrüche deuten auf vorübergehende Endpunktprobleme hin.",

    "wm.akis.baslik": "Zustellungs-Stream",
    "wm.akis.durumFiltre": "Nach Status filtern",
    "wm.akis.tumDurumlar": "Alle Status",
    "wm.akis.basarili": "Erfolgreich (2xx)",
    "wm.akis.kaliciHata": "Dauerhafter Fehler (4xx)",
    "wm.akis.geciciHata": "Vorübergehender Fehler (5xx/0)",
    "wm.akis.ucFiltre": "Nach Endpunkt filtern",
    "wm.akis.tumUcNoktalar": "Alle Endpunkte",
    "wm.akis.thOlay": "Ereignis",
    "wm.akis.thUcNokta": "Endpunkt",
    "wm.akis.thDurum": "Status",
    "wm.akis.thDeneme": "Versuch",
    "wm.akis.thGecikme": "Latenz",
    "wm.akis.thZaman": "Zeit",
    "wm.akis.filtreBos": "Keine Zustellung entspricht dem Filter.",
    "wm.akis.yenidenDeneTip": "Diese Zustellung wiederholen",
    "wm.akis.yenidenDeneAria": "Wiederholen",
    "wm.akis.limit": "Die neuesten 60 Zustellungen werden angezeigt ({n} gesamt).",

    "wm.dlq.baslik": "Dead-Letter-Queue (DLQ)",
    "wm.dlq.temizBaslik": "Queue ist leer",
    "wm.dlq.temizAciklama": "Keine fehlgeschlagene Zustellung, die alle Versuche aufgebraucht hat.",
    "wm.dlq.denemeTukendi": "{n} Versuche aufgebraucht",
    "wm.dlq.manuelDene": "Manuell wiederholen",
    "wm.dlq.sonDeneme": "Letzter Versuch {zaman} · insgesamt {n}/{maks} Versuche fehlgeschlagen",

    "wm.backoff.baslik": "Wiederholungs-Backoff-Zeitplan",
    "wm.backoff.aciklama": "Fehlgeschlagene (5xx / Verbindungsfehler) Zustellungen werden mit exponentiellem Backoff wiederholt. Wenn sie nach {maks} Versuchen noch fehlschlagen, fällt die Zustellung in die DLQ.",
    "wm.backoff.ilkEtiket": "Erster Zustellversuch",
    "wm.backoff.ilkAlt": "sobald das Ereignis ausgelöst wird",
    "wm.backoff.denemeEtiket": "Versuch {n}",
    "wm.backoff.denemeAlt": "{etiket} nach dem vorherigen Fehlschlag",
    "wm.backoff.dlqEtiket": "In DLQ verschoben",
    "wm.backoff.dlqAlt": "alle Versuche aufgebraucht",
    "wm.backoff.pencere": "Gesamtfenster: {toplam} ({adimlar})",

    "wm.hmac.baslik": "HMAC-Signaturprüfung",
    "wm.hmac.ucSec": "Endpunkt für Signatur auswählen",
    "wm.hmac.aciklama1": "Bei jeder Zustellung wird ein",
    "wm.hmac.aciklama2": "-Header gesendet. Der Empfänger signiert den Body mit dem geteilten Geheimnis und vergleicht ihn, um zu bestätigen, dass die Zustellung wirklich von Veylify stammt (und nicht manipuliert wurde). Format:",
    "wm.hmac.ucNokta": "Endpunkt:",
    "wm.hmac.gizliAnahtar": "Geheimnis:",
    "wm.hmac.maskeli": "maskiert",
    "wm.hmac.ornekImza": "Beispiel-Signatur-Header:",
    "wm.hmac.nodeBaslik": "Node.js — Signaturprüfung",
    "wm.hmac.pythonBaslik": "Python — Signaturprüfung",

    "wm.not.metin": "Die Endpunktverwaltung (Erstellen / Löschen / echte Testzustellung) erfolgt über das <b>Entwickler</b>-Modul. Die Aktionen \"Testzustellung\", \"Wiederholen\" und \"Manuell wiederholen\" hier sind jeweils eine <b>Simulation</b>, die die Zustellmaschine innerhalb dieser Überwachungskonsole auslöst; echte Zustellprotokolle sammeln sich an, während die Zustellmaschine läuft.",

    "wm.toast.dlqBaslik": "Erneute Zustellung eingereiht — Demo",
    "wm.toast.normalBaslik": "Erneute Zustellung eingereiht — Demo",
    "wm.toast.aciklama": "{url} — die echte Zustellmaschine wird mit exponentiellem Backoff wiederholen. In dieser Überwachungskonsole ist die Aktion eine Demo/Simulation.",

    "wm.temsiliRozet": "Beispiel",
    "wm.temsiliRozetTip": "Dieser Datensatz stammt aus der deterministischen repräsentativen Historie, die aus der Endpunktkonfiguration abgeleitet ist (keine echte Zustellung).",
  },
  fr: {
    "wm.zaman.azOnce": "à l'instant",
    "wm.zaman.dk": "il y a {n} min",
    "wm.zaman.sa": "il y a {n} h",
    "wm.zaman.gun": "il y a {n} j",

    "wm.durum.baglantiHatasi": "erreur de connexion",

    "wm.saglik.saglikli": "Sain",
    "wm.saglik.bozuk": "Dégradé",
    "wm.saglik.dlq": "DLQ",

    "wm.giris.baslik": "Surveillez la livraison d'événements de bout en bout.",
    "wm.giris.aciklama": "Voyez le taux de réussite, la latence, le calendrier des nouvelles tentatives et la file d'attente des messages morts (DLQ) de chaque point de terminaison webhook dans une seule console. Vérifiez l'authenticité des livraisons avec la signature HMAC.",

    "wm.ozet.toplam": "Total des tentatives de livraison",
    "wm.ozet.basari": "Taux de réussite",
    "wm.ozet.gecikme": "Latence moyenne",
    "wm.ozet.dlq": "Message mort (DLQ)",

    "wm.temsili": "Comme les enregistrements de livraison réels sont rares, la console a été enrichie d'un historique de livraison <b>représentatif mais déterministe</b> dérivé de la configuration du point de terminaison. Au fur et à mesure que vous envoyez des livraisons de test, de vrais enregistrements s'accumulent.",

    "wm.matris.baslik": "Matrice de santé des points de terminaison",
    "wm.matris.saglikli": "{n} sains",
    "wm.matris.bozuk": "{n} dégradés",
    "wm.matris.dlq": "{n} DLQ",
    "wm.matris.bos": "Aucun point de terminaison webhook pour le moment.",
    "wm.matris.pasif": "Inactif",
    "wm.matris.testTeslimat": "Livraison de test",
    "wm.matris.basariOrani": "Taux de réussite",
    "wm.matris.gecikme": "Latence moy · p95",
    "wm.matris.yenidenDeneme": "Nouvelles tentatives",
    "wm.matris.sonDurum": "Dernier statut",

    "wm.saglikOzet.baslik": "Synthèse de santé des livraisons",
    "wm.saglikOzet.gauge": "Réussite de livraison",
    "wm.saglikOzet.gaugeAlt": "taux 2xx",
    "wm.saglikOzet.gecikmeGauge": "Santé de la latence",
    "wm.saglikOzet.gecikmeAlt": "cible ≤500ms",
    "wm.dagilim.baslik": "Distribution des codes de statut",
    "wm.dagilim.aciklama": "Répartition de toutes les tentatives de livraison par classe de statut HTTP.",
    "wm.dagilim.histoBaslik": "Histogramme des groupes de codes HTTP",
    "wm.dagilim.histoAciklama": "Nombre de tentatives de livraison par tranches 2xx / 3xx / 4xx / 5xx / erreur de connexion.",
    "wm.isi.baslik": "Carte de chaleur point de terminaison × statut",
    "wm.isi.aciklama": "Densité de livraison de chaque point de terminaison par classe de statut — les cellules chaudes demandent de l'attention.",
    "wm.isi.basarili": "2xx",
    "wm.isi.kaliciHata": "4xx",
    "wm.isi.geciciHata": "5xx/0",

    "wm.trend.baslik": "Tendance de réussite de livraison (7 derniers jours · tranches de 12 heures)",
    "wm.trend.aciklama": "Le pourcentage de réussite 2xx dans le temps. Les baisses indiquent des problèmes temporaires du point de terminaison.",

    "wm.akis.baslik": "Flux de livraison",
    "wm.akis.durumFiltre": "Filtrer par statut",
    "wm.akis.tumDurumlar": "Tous les statuts",
    "wm.akis.basarili": "Réussi (2xx)",
    "wm.akis.kaliciHata": "Erreur permanente (4xx)",
    "wm.akis.geciciHata": "Erreur temporaire (5xx/0)",
    "wm.akis.ucFiltre": "Filtrer par point de terminaison",
    "wm.akis.tumUcNoktalar": "Tous les points de terminaison",
    "wm.akis.thOlay": "Événement",
    "wm.akis.thUcNokta": "Point de terminaison",
    "wm.akis.thDurum": "Statut",
    "wm.akis.thDeneme": "Tentative",
    "wm.akis.thGecikme": "Latence",
    "wm.akis.thZaman": "Heure",
    "wm.akis.filtreBos": "Aucune livraison ne correspond au filtre.",
    "wm.akis.yenidenDeneTip": "Réessayer cette livraison",
    "wm.akis.yenidenDeneAria": "Réessayer",
    "wm.akis.limit": "Affichage des 60 livraisons les plus récentes ({n} au total).",

    "wm.dlq.baslik": "File d'attente des messages morts (DLQ)",
    "wm.dlq.temizBaslik": "File d'attente vide",
    "wm.dlq.temizAciklama": "Aucune livraison échouée ayant épuisé toutes ses tentatives.",
    "wm.dlq.denemeTukendi": "{n} tentatives épuisées",
    "wm.dlq.manuelDene": "Réessai manuel",
    "wm.dlq.sonDeneme": "Dernière tentative {zaman} · {n}/{maks} tentatives échouées au total",

    "wm.backoff.baslik": "Calendrier de backoff des nouvelles tentatives",
    "wm.backoff.aciklama": "Les livraisons échouées (5xx / erreur de connexion) sont réessayées avec un backoff exponentiel. Si elles échouent toujours après {maks} tentatives, la livraison tombe dans la DLQ.",
    "wm.backoff.ilkEtiket": "Première tentative de livraison",
    "wm.backoff.ilkAlt": "dès que l'événement se déclenche",
    "wm.backoff.denemeEtiket": "Tentative {n}",
    "wm.backoff.denemeAlt": "{etiket} après l'échec précédent",
    "wm.backoff.dlqEtiket": "Basculée en DLQ",
    "wm.backoff.dlqAlt": "toutes les tentatives épuisées",
    "wm.backoff.pencere": "Fenêtre totale : {toplam} ({adimlar})",

    "wm.hmac.baslik": "Vérification de signature HMAC",
    "wm.hmac.ucSec": "Sélectionner le point de terminaison pour la signature",
    "wm.hmac.aciklama1": "Chaque livraison envoie un en-tête",
    "wm.hmac.aciklama2": ". Le destinataire signe le corps avec le secret partagé et le compare pour vérifier que la livraison provient vraiment de Veylify (et n'a pas été altérée). Format :",
    "wm.hmac.ucNokta": "Point de terminaison :",
    "wm.hmac.gizliAnahtar": "Secret :",
    "wm.hmac.maskeli": "masqué",
    "wm.hmac.ornekImza": "Exemple d'en-tête de signature :",
    "wm.hmac.nodeBaslik": "Node.js — vérification de signature",
    "wm.hmac.pythonBaslik": "Python — vérification de signature",

    "wm.not.metin": "La gestion des points de terminaison (création / suppression / livraison de test réelle) se fait depuis le module <b>Développeur</b>. Les actions \"Livraison de test\", \"Réessayer\" et \"Réessai manuel\" ici sont chacune une <b>simulation</b> qui déclenche le moteur de livraison au sein de cette console de surveillance ; les enregistrements de livraison réels s'accumulent à mesure que le moteur de livraison fonctionne.",

    "wm.toast.dlqBaslik": "Nouvelle livraison en file d'attente — démo",
    "wm.toast.normalBaslik": "Nouvelle livraison en file d'attente — démo",
    "wm.toast.aciklama": "{url} — le vrai moteur de livraison réessaiera avec un backoff exponentiel. Dans cette console de surveillance, l'action est une démo/simulation.",

    "wm.temsiliRozet": "exemple",
    "wm.temsiliRozetTip": "Cet enregistrement provient de l'historique représentatif déterministe dérivé de la configuration du point de terminaison (pas une vraie livraison).",
  },
  es: {
    "wm.zaman.azOnce": "ahora mismo",
    "wm.zaman.dk": "hace {n} min",
    "wm.zaman.sa": "hace {n} h",
    "wm.zaman.gun": "hace {n} d",

    "wm.durum.baglantiHatasi": "error de conexión",

    "wm.saglik.saglikli": "Saludable",
    "wm.saglik.bozuk": "Degradado",
    "wm.saglik.dlq": "DLQ",

    "wm.giris.baslik": "Supervisa la entrega de eventos de extremo a extremo.",
    "wm.giris.aciklama": "Ve la tasa de éxito, la latencia, la programación de reintentos y la cola de mensajes muertos (DLQ) de cada punto de conexión webhook en una sola consola. Verifica la autenticidad de las entregas con la firma HMAC.",

    "wm.ozet.toplam": "Intentos de entrega totales",
    "wm.ozet.basari": "Tasa de éxito",
    "wm.ozet.gecikme": "Latencia media",
    "wm.ozet.dlq": "Mensaje muerto (DLQ)",

    "wm.temsili": "Como los registros de entrega reales son escasos, la consola se ha enriquecido con un historial de entrega <b>representativo pero determinista</b> derivado de la configuración del punto de conexión. A medida que envíes entregas de prueba, se acumulan registros reales.",

    "wm.matris.baslik": "Matriz de salud de puntos de conexión",
    "wm.matris.saglikli": "{n} saludables",
    "wm.matris.bozuk": "{n} degradados",
    "wm.matris.dlq": "{n} DLQ",
    "wm.matris.bos": "Aún no hay ningún punto de conexión webhook.",
    "wm.matris.pasif": "Inactivo",
    "wm.matris.testTeslimat": "Entrega de prueba",
    "wm.matris.basariOrani": "Tasa de éxito",
    "wm.matris.gecikme": "Latencia med · p95",
    "wm.matris.yenidenDeneme": "Reintentos",
    "wm.matris.sonDurum": "Último estado",

    "wm.saglikOzet.baslik": "Resumen de salud de entregas",
    "wm.saglikOzet.gauge": "Éxito de entrega",
    "wm.saglikOzet.gaugeAlt": "tasa 2xx",
    "wm.saglikOzet.gecikmeGauge": "Salud de latencia",
    "wm.saglikOzet.gecikmeAlt": "objetivo ≤500ms",
    "wm.dagilim.baslik": "Distribución de códigos de estado",
    "wm.dagilim.aciklama": "Distribución de todos los intentos de entrega por clase de estado HTTP.",
    "wm.dagilim.histoBaslik": "Histograma de grupos de códigos HTTP",
    "wm.dagilim.histoAciklama": "Recuento de intentos de entrega por tramos 2xx / 3xx / 4xx / 5xx / error de conexión.",
    "wm.isi.baslik": "Mapa de calor punto de conexión × estado",
    "wm.isi.aciklama": "Densidad de entrega de cada punto de conexión por clase de estado — las celdas calientes requieren atención.",
    "wm.isi.basarili": "2xx",
    "wm.isi.kaliciHata": "4xx",
    "wm.isi.geciciHata": "5xx/0",

    "wm.trend.baslik": "Tendencia de éxito de entrega (últimos 7 días · intervalos de 12 horas)",
    "wm.trend.aciklama": "El porcentaje de éxito 2xx a lo largo del tiempo. Las caídas indican problemas temporales del punto de conexión.",

    "wm.akis.baslik": "Flujo de entrega",
    "wm.akis.durumFiltre": "Filtrar por estado",
    "wm.akis.tumDurumlar": "Todos los estados",
    "wm.akis.basarili": "Exitoso (2xx)",
    "wm.akis.kaliciHata": "Error permanente (4xx)",
    "wm.akis.geciciHata": "Error temporal (5xx/0)",
    "wm.akis.ucFiltre": "Filtrar por punto de conexión",
    "wm.akis.tumUcNoktalar": "Todos los puntos de conexión",
    "wm.akis.thOlay": "Evento",
    "wm.akis.thUcNokta": "Punto de conexión",
    "wm.akis.thDurum": "Estado",
    "wm.akis.thDeneme": "Intento",
    "wm.akis.thGecikme": "Latencia",
    "wm.akis.thZaman": "Hora",
    "wm.akis.filtreBos": "Ninguna entrega coincide con el filtro.",
    "wm.akis.yenidenDeneTip": "Reintentar esta entrega",
    "wm.akis.yenidenDeneAria": "Reintentar",
    "wm.akis.limit": "Mostrando las 60 entregas más recientes ({n} en total).",

    "wm.dlq.baslik": "Cola de mensajes muertos (DLQ)",
    "wm.dlq.temizBaslik": "Cola limpia",
    "wm.dlq.temizAciklama": "Ninguna entrega fallida que haya agotado todos sus intentos.",
    "wm.dlq.denemeTukendi": "{n} intentos agotados",
    "wm.dlq.manuelDene": "Reintento manual",
    "wm.dlq.sonDeneme": "Último intento {zaman} · {n}/{maks} intentos fallidos en total",

    "wm.backoff.baslik": "Programa de backoff de reintentos",
    "wm.backoff.aciklama": "Las entregas fallidas (5xx / error de conexión) se reintentan con backoff exponencial. Si siguen fallando tras {maks} intentos, la entrega cae en la DLQ.",
    "wm.backoff.ilkEtiket": "Primer intento de entrega",
    "wm.backoff.ilkAlt": "en cuanto se dispara el evento",
    "wm.backoff.denemeEtiket": "Intento {n}",
    "wm.backoff.denemeAlt": "{etiket} tras el fallo anterior",
    "wm.backoff.dlqEtiket": "Trasladada a la DLQ",
    "wm.backoff.dlqAlt": "todos los intentos agotados",
    "wm.backoff.pencere": "Ventana total: {toplam} ({adimlar})",

    "wm.hmac.baslik": "Verificación de firma HMAC",
    "wm.hmac.ucSec": "Seleccionar punto de conexión para la firma",
    "wm.hmac.aciklama1": "Cada entrega envía una cabecera",
    "wm.hmac.aciklama2": ". El destinatario firma el cuerpo con el secreto compartido y lo compara para verificar que la entrega proviene realmente de Veylify (y no fue manipulada). Formato:",
    "wm.hmac.ucNokta": "Punto de conexión:",
    "wm.hmac.gizliAnahtar": "Secreto:",
    "wm.hmac.maskeli": "enmascarado",
    "wm.hmac.ornekImza": "Ejemplo de cabecera de firma:",
    "wm.hmac.nodeBaslik": "Node.js — verificación de firma",
    "wm.hmac.pythonBaslik": "Python — verificación de firma",

    "wm.not.metin": "La gestión de puntos de conexión (crear / eliminar / entrega de prueba real) se realiza desde el módulo <b>Desarrollador</b>. Las acciones \"Entrega de prueba\", \"Reintentar\" y \"Reintento manual\" aquí son cada una una <b>simulación</b> que activa el motor de entrega dentro de esta consola de supervisión; los registros de entrega reales se acumulan a medida que el motor de entrega funciona.",

    "wm.toast.dlqBaslik": "Reentrega en cola — demo",
    "wm.toast.normalBaslik": "Reentrega en cola — demo",
    "wm.toast.aciklama": "{url} — el motor de entrega real reintentará con backoff exponencial. En esta consola de supervisión la acción es una demo/simulación.",

    "wm.temsiliRozet": "muestra",
    "wm.temsiliRozetTip": "Este registro proviene del historial representativo determinista derivado de la configuración del punto de conexión (no es una entrega real).",
  },
};

/**
 * Anahtarı verilen dile çevir. Bulunamazsa TR'ye, o da yoksa anahtara düşer.
 * @param anahtar "wm." namespace'li anahtar
 * @param dil     hedef dil
 */
export function wmCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
