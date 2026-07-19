import type { Dil } from "@/lib/i18n/panel";

/**
 * Entegrasyon Sağlık & Test Konsolu sayfasına özel i18n sözlüğü
 * (yalnızca bu modül kullanır). "es." namespace'li anahtarlar. Doğal/native çeviriler.
 *
 * NOT: Platform/entegrasyon adları (Slack, Discord, Teams, PagerDuty, Zapier,
 * webhook, e-posta) ve kullanıcıların verdiği entegrasyon adları özel ad/veridir
 * — çevrilmez. Sağlık durumu (saglikli/uyari/bozuk/pasif), önem (kritik/uyari/bilgi)
 * ve kurulum-kontrol etiketleri enum→i18n anahtarı eşlemesiyle çözülür; lib'deki
 * TR üretilmiş etiketler istemcide yeniden türetilir (lib düzenlenmez). Sayılar,
 * HTTP kodları ve tarihler veri olarak kalır, BCP-47 ile biçimlenir.
 * TR kaynak/otorite; anahtar yoksa TR'ye düşer.
 */
const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    "es.baslik": "Entegrasyon Sağlığı",

    // --- boş durum tanıtım şeridi ---
    "es.bos.baslik": "Bağlantı sağlığını ve teslimatı tek yerden izle.",
    "es.bos.metin":
      "Slack, Discord, Teams, webhook, PagerDuty, Zapier ve e-posta entegrasyonlarının teslimat durumunu, canlı testini ve kurulum doğrulamasını burada göreceksin.",
    "es.bos.durumBaslik": "Henüz bağlı entegrasyon yok",
    "es.bos.durumMetin":
      "Sağlığını izleyebilmek için önce bir entegrasyon bağla. Bir bildirim kanalı bağladığında teslimat durumu, canlı test ve kapsama analizi burada belirir.",
    "es.bos.baglaBtn": "Entegrasyon bağla",
    "es.bos.yonlendirBtn": "Bildirim yönlendirme",

    // --- dolu durum tanıtım şeridi ---
    "es.intro.baslik": "Bağlantı sağlığı & teslimat gözlemlenebilirliği.",
    "es.intro.metin":
      "Her entegrasyonun son teslimat durumunu, sağlık skorunu ve kurulum doğrulamasını izle. Bir kanalı gerçek bir test bildirimiyle canlı doğrula.",
    "es.tumTest": "Tümünü test et",
    "es.taraniyor": "Taranıyor…",

    // --- özet kartları ---
    "es.ozet.toplam": "Toplam entegrasyon",
    "es.ozet.aktif": "Aktif",
    "es.ozet.saglikli": "Sağlıklı",
    "es.ozet.sonBasarisiz": "Son teslimatı başarısız",

    // --- filo sağlık özeti ---
    "es.filo.baslik": "Filo sağlık özeti",
    "es.filo.ortSkor": "Ortalama sağlık skoru",
    "es.filo.toplamGonderi": "{n} toplam bildirim gönderildi",
    "es.filo.dagilimBaslik": "Durum dağılımı & gecikme profili",
    "es.filo.donutMerkez": "kanal",
    "es.tahminiRozet": "Tahmini",
    "es.filo.gecikmeBaslik": "Kanal başına tahmini gecikme",
    "es.filo.gecikmeNot": "Ölçülmüş değil: sağlık skoru ve son durum kodundan türetilen TAHMİNİ gösterim değeri (ms).",
    "es.filo.kurulumHataBaslik": "Kurulum hatası var",
    "es.filo.kurulumHataMetin":
      "Bir veya daha fazla entegrasyonun kritik kurulum kontrolü (geçerli hedef / seçili olay) başarısız. Aşağıdaki matriste kırmızı işaretli kontrolleri düzelt.",

    // durum dağılım rozetleri (enum→etiket)
    "es.durum.saglikli": "Sağlıklı",
    "es.durum.uyari": "Uyarı",
    "es.durum.bozuk": "Bozuk",
    "es.durum.pasif": "Pasif",

    // --- entegrasyon × metrik ısı-matris ---
    "es.isi.baslik": "Entegrasyon × metrik ısı haritası",
    "es.isi.metin":
      "Her entegrasyonu dört boyutta karşılaştır. Koyu hücre yüksek değer; açık hücre iyileştirme alanı demektir.",
    "es.isi.saglik": "Sağlık",
    "es.isi.gecikme": "Gecikme",
    "es.isi.kurulum": "Kurulum",
    "es.isi.hacim": "Hacim",
    "es.isi.dusuk": "Düşük",
    "es.isi.yuksek": "Yüksek",
    "es.isi.not": "Gecikme sütunu ters ölçek: yüksek = daha hızlı.",

    // --- olay tipi kapsaması ---
    "es.kapsama.baslik": "Olay tipi kapsaması",
    "es.kapsama.metin":
      "Hangi güvenlik olaylarının en az bir aktif teslimat kanalı var? Kapsanmayan kritik olaylar sessiz kalır — bir kanala bağla.",
    "es.kapsama.kritikBaslik": "{n} kritik olayın teslimat kanalı yok",
    "es.kapsama.kritikMetin": "{liste} — bu olaylar tetiklendiğinde hiçbir yere bildirilmeyecek.",
    "es.kapsama.kanalYok": "Aktif teslimat kanalı yok",
    "es.kapsama.aktif": "aktif",
    "es.kapsama.toplam": "/ {n} toplam",
    "es.kapsama.kanal": "kanal",

    // önem (enum→etiket)
    "es.onem.kritik": "kritik",
    "es.onem.uyari": "uyarı",
    "es.onem.bilgi": "bilgi",

    // olay türü adları (OLAY_TURLERI.key → etiket; lib TR yerine istemcide türetilir)
    "es.olay.bot.blocked": "Bot engellendi",
    "es.olay.ai_agent.detected": "AI ajan tespit edildi",
    "es.olay.campaign.started": "Saldırı kampanyası başladı",
    "es.olay.anomaly.detected": "Anomali tespit edildi",
    "es.olay.quota.warning": "Kota uyarısı (%90)",

    // --- entegrasyon sağlık matrisi ---
    "es.matris.baslik": "Entegrasyon sağlık matrisi",
    "es.matris.olaySecilmemis": "Olay seçilmemiş",
    "es.matris.gonderiliyor": "Gönderiliyor…",
    "es.matris.testGonder": "Test gönder",

    // teslimat metrikleri
    "es.metrik.sonTeslimat": "Son teslimat",
    "es.metrik.durumKodu": "Durum kodu",
    "es.metrik.baglantiHatasi": "Bağlantı hatası",
    "es.metrik.gonderilen": "Gönderilen",
    "es.metrik.gecikme": "Tahmini gecikme",
    "es.metrik.gecikmeTrend": "Gecikme trendi",
    "es.metrik.kurulum": "Kurulum",
    "es.metrik.gecti": "{gecen}/{toplam} geçti",

    // canlı test sonucu
    "es.test.teslimEdildi": "Canlı test teslim edildi{ek}.",
    "es.test.basarisiz": "Canlı test başarısız{ek}. Sayfayı yenileyip son durumu gör.",

    // kurulum doğrulama
    "es.dogrulama.baslik": "Kurulum doğrulama",
    "es.dogrulama.kritik": "kritik",

    // --- teslimat geçmişi özeti ---
    "es.teslimat.baslik": "Teslimat geçmişi özeti",
    "es.teslimat.bos":
      "Henüz hiçbir entegrasyona teslimat yapılmadı. Bir entegrasyonu <b>Test gönder</b> ile deneyerek ilk teslimat kaydını oluştur.",
    "es.teslimat.toplamGonderilen": "Toplam gönderilen",
    "es.teslimat.enSon": "En son teslimat",
    "es.teslimat.enCok": "En çok kullanılan",
    "es.teslimat.bildirim": "{n} bildirim",
    "es.teslimat.basarisizNot":
      "{n} entegrasyonun son teslimatı başarısız: {liste}. Canlı test ile yeniden dene.",
    "es.teslimat.hepsiBasarili": "Teslimat yapan tüm entegrasyonların son denemesi başarılı.",
    "es.teslimat.not":
      "Not: Ayrıntılı teslimat log'u yalnızca son durumu (lastStatus/lastDelivery) ve toplam sayacı tutar; deneme-deneme geçmiş bu modülde tutulmaz.",

    // --- alt bağlantılar ---
    "es.alt.ekleBaslik": "Entegrasyon ekle / yapılandır",
    "es.alt.ekleMetin": "Yeni bir Slack, Discord, Teams, webhook, PagerDuty veya Zapier kanalı bağla.",
    "es.alt.yonlendirBaslik": "Bildirim yönlendirme",
    "es.alt.yonlendirMetin": "Hangi olayın hangi kanaldan gideceğini kural bazında yönet.",

    // --- alt not ---
    "es.dipnot":
      "Sağlık durumu son teslimat sonucuna, tazeliğine ve kurulum tamlığına göre hesaplanır. <b>Canlı test</b> gerçek bir HTTP isteği gönderir (e-posta türü hariç — orada gövde hazırlanır ve başarı sayılır). Test sonrası son durumu görmek için sayfa otomatik yenilenir.",

    // toast bildirimleri
    "es.toast.testEdiliyor": "{ad} test ediliyor…",
    "es.toast.teslimEdildi": "Test bildirimi teslim edildi ✓",
    "es.toast.calisiyor": "{ad} çalışıyor.",
    "es.toast.teslimEdilemedi": "Teslim edilemedi",
    "es.toast.ulasilamadi": "{ad} hedefine ulaşılamadı.",
    "es.toast.aktifYok": "Test edilecek aktif entegrasyon yok",
    "es.toast.taramaTamam": "Tarama tamam · {basari}/{toplam} başarılı",

    // göreli zaman
    "es.zaman.hic": "Hiç",
    "es.zaman.azOnce": "az önce",
    "es.zaman.dkOnce": "{n} dk önce",
    "es.zaman.saOnce": "{n} sa önce",
    "es.zaman.gunOnce": "{n} gün önce",
  },

  en: {
    "es.baslik": "Integration Health",

    "es.bos.baslik": "Monitor connection health and delivery in one place.",
    "es.bos.metin":
      "See the delivery status, live test and setup validation of your Slack, Discord, Teams, webhook, PagerDuty, Zapier and email integrations here.",
    "es.bos.durumBaslik": "No connected integrations yet",
    "es.bos.durumMetin":
      "Connect an integration first to monitor its health. Once you connect a notification channel, its delivery status, live test and coverage analysis will appear here.",
    "es.bos.baglaBtn": "Connect integration",
    "es.bos.yonlendirBtn": "Notification routing",

    "es.intro.baslik": "Connection health & delivery observability.",
    "es.intro.metin":
      "Track each integration's last delivery status, health score and setup validation. Verify a channel live with a real test notification.",
    "es.tumTest": "Test all",
    "es.taraniyor": "Scanning…",

    "es.ozet.toplam": "Total integrations",
    "es.ozet.aktif": "Active",
    "es.ozet.saglikli": "Healthy",
    "es.ozet.sonBasarisiz": "Last delivery failed",

    "es.filo.baslik": "Fleet health summary",
    "es.filo.ortSkor": "Average health score",
    "es.filo.toplamGonderi": "{n} total notifications sent",
    "es.filo.dagilimBaslik": "Status distribution & latency profile",
    "es.filo.donutMerkez": "channels",
    "es.tahminiRozet": "Estimated",
    "es.filo.gecikmeBaslik": "Estimated latency per channel",
    "es.filo.gecikmeNot": "Not measured: an ESTIMATED display value (ms) derived from health score and last status code.",
    "es.filo.kurulumHataBaslik": "Setup error present",
    "es.filo.kurulumHataMetin":
      "One or more integrations failed a critical setup check (valid target / selected event). Fix the checks flagged red in the matrix below.",

    "es.durum.saglikli": "Healthy",
    "es.durum.uyari": "Warning",
    "es.durum.bozuk": "Broken",
    "es.durum.pasif": "Inactive",

    "es.isi.baslik": "Integration × metric heatmap",
    "es.isi.metin":
      "Compare each integration across four dimensions. A dark cell means a high value; a light cell marks room to improve.",
    "es.isi.saglik": "Health",
    "es.isi.gecikme": "Latency",
    "es.isi.kurulum": "Setup",
    "es.isi.hacim": "Volume",
    "es.isi.dusuk": "Low",
    "es.isi.yuksek": "High",
    "es.isi.not": "Latency column is inverted: higher = faster.",

    "es.kapsama.baslik": "Event type coverage",
    "es.kapsama.metin":
      "Which security events have at least one active delivery channel? Uncovered critical events stay silent — connect them to a channel.",
    "es.kapsama.kritikBaslik": "{n} critical events have no delivery channel",
    "es.kapsama.kritikMetin": "{liste} — these events will be reported nowhere when triggered.",
    "es.kapsama.kanalYok": "No active delivery channel",
    "es.kapsama.aktif": "active",
    "es.kapsama.toplam": "/ {n} total",
    "es.kapsama.kanal": "channels",

    "es.onem.kritik": "critical",
    "es.onem.uyari": "warning",
    "es.onem.bilgi": "info",

    "es.olay.bot.blocked": "Bot blocked",
    "es.olay.ai_agent.detected": "AI agent detected",
    "es.olay.campaign.started": "Attack campaign started",
    "es.olay.anomaly.detected": "Anomaly detected",
    "es.olay.quota.warning": "Quota warning (90%)",

    "es.matris.baslik": "Integration health matrix",
    "es.matris.olaySecilmemis": "No event selected",
    "es.matris.gonderiliyor": "Sending…",
    "es.matris.testGonder": "Send test",

    "es.metrik.sonTeslimat": "Last delivery",
    "es.metrik.durumKodu": "Status code",
    "es.metrik.baglantiHatasi": "Connection error",
    "es.metrik.gonderilen": "Sent",
    "es.metrik.gecikme": "Est. latency",
    "es.metrik.gecikmeTrend": "Latency trend",
    "es.metrik.kurulum": "Setup",
    "es.metrik.gecti": "{gecen}/{toplam} passed",

    "es.test.teslimEdildi": "Live test delivered{ek}.",
    "es.test.basarisiz": "Live test failed{ek}. Refresh the page to see the latest status.",

    "es.dogrulama.baslik": "Setup validation",
    "es.dogrulama.kritik": "critical",

    "es.teslimat.baslik": "Delivery history summary",
    "es.teslimat.bos":
      "No delivery has been made to any integration yet. Create the first delivery record by trying an integration with <b>Send test</b>.",
    "es.teslimat.toplamGonderilen": "Total sent",
    "es.teslimat.enSon": "Latest delivery",
    "es.teslimat.enCok": "Most used",
    "es.teslimat.bildirim": "{n} notifications",
    "es.teslimat.basarisizNot":
      "{n} integrations' last delivery failed: {liste}. Retry with a live test.",
    "es.teslimat.hepsiBasarili": "The last attempt of every integration that has delivered succeeded.",
    "es.teslimat.not":
      "Note: The detailed delivery log only keeps the last status (lastStatus/lastDelivery) and total counter; attempt-by-attempt history is not kept in this module.",

    "es.alt.ekleBaslik": "Add / configure integration",
    "es.alt.ekleMetin": "Connect a new Slack, Discord, Teams, webhook, PagerDuty or Zapier channel.",
    "es.alt.yonlendirBaslik": "Notification routing",
    "es.alt.yonlendirMetin": "Manage which event goes through which channel on a per-rule basis.",

    "es.dipnot":
      "Health status is calculated from the last delivery result, its freshness and setup completeness. <b>Live test</b> sends a real HTTP request (except the email type — there the body is prepared and counted as success). The page refreshes automatically to show the latest status after a test.",

    "es.toast.testEdiliyor": "Testing {ad}…",
    "es.toast.teslimEdildi": "Test notification delivered ✓",
    "es.toast.calisiyor": "{ad} is working.",
    "es.toast.teslimEdilemedi": "Delivery failed",
    "es.toast.ulasilamadi": "Could not reach {ad}'s target.",
    "es.toast.aktifYok": "No active integration to test",
    "es.toast.taramaTamam": "Scan complete · {basari}/{toplam} succeeded",

    "es.zaman.hic": "Never",
    "es.zaman.azOnce": "just now",
    "es.zaman.dkOnce": "{n} min ago",
    "es.zaman.saOnce": "{n} h ago",
    "es.zaman.gunOnce": "{n} d ago",
  },

  de: {
    "es.baslik": "Integrationszustand",

    "es.bos.baslik": "Verbindungszustand und Zustellung an einem Ort überwachen.",
    "es.bos.metin":
      "Sieh hier den Zustellstatus, Live-Test und die Einrichtungsprüfung deiner Slack-, Discord-, Teams-, Webhook-, PagerDuty-, Zapier- und E-Mail-Integrationen.",
    "es.bos.durumBaslik": "Noch keine verbundenen Integrationen",
    "es.bos.durumMetin":
      "Verbinde zuerst eine Integration, um ihren Zustand zu überwachen. Sobald du einen Benachrichtigungskanal verbindest, erscheinen hier Zustellstatus, Live-Test und Abdeckungsanalyse.",
    "es.bos.baglaBtn": "Integration verbinden",
    "es.bos.yonlendirBtn": "Benachrichtigungs-Routing",

    "es.intro.baslik": "Verbindungszustand & Zustell-Observability.",
    "es.intro.metin":
      "Verfolge den letzten Zustellstatus, den Zustands-Score und die Einrichtungsprüfung jeder Integration. Verifiziere einen Kanal live mit einer echten Testbenachrichtigung.",
    "es.tumTest": "Alle testen",
    "es.taraniyor": "Wird gescannt…",

    "es.ozet.toplam": "Integrationen gesamt",
    "es.ozet.aktif": "Aktiv",
    "es.ozet.saglikli": "Gesund",
    "es.ozet.sonBasarisiz": "Letzte Zustellung fehlgeschlagen",

    "es.filo.baslik": "Flottenzustands-Übersicht",
    "es.filo.ortSkor": "Durchschnittlicher Zustands-Score",
    "es.filo.toplamGonderi": "{n} Benachrichtigungen insgesamt gesendet",
    "es.filo.dagilimBaslik": "Statusverteilung & Latenzprofil",
    "es.filo.donutMerkez": "Kanäle",
    "es.tahminiRozet": "Geschätzt",
    "es.filo.gecikmeBaslik": "Geschätzte Latenz pro Kanal",
    "es.filo.gecikmeNot": "Nicht gemessen: ein GESCHÄTZTER Anzeigewert (ms), abgeleitet aus Health-Score und letztem Statuscode.",
    "es.filo.kurulumHataBaslik": "Einrichtungsfehler vorhanden",
    "es.filo.kurulumHataMetin":
      "Eine oder mehrere Integrationen haben eine kritische Einrichtungsprüfung (gültiges Ziel / ausgewähltes Ereignis) nicht bestanden. Behebe die rot markierten Prüfungen in der Matrix unten.",

    "es.durum.saglikli": "Gesund",
    "es.durum.uyari": "Warnung",
    "es.durum.bozuk": "Defekt",
    "es.durum.pasif": "Inaktiv",

    "es.isi.baslik": "Integration × Metrik Heatmap",
    "es.isi.metin":
      "Vergleiche jede Integration über vier Dimensionen. Eine dunkle Zelle bedeutet einen hohen Wert; eine helle Zelle zeigt Verbesserungspotenzial.",
    "es.isi.saglik": "Gesundheit",
    "es.isi.gecikme": "Latenz",
    "es.isi.kurulum": "Einrichtung",
    "es.isi.hacim": "Volumen",
    "es.isi.dusuk": "Niedrig",
    "es.isi.yuksek": "Hoch",
    "es.isi.not": "Latenzspalte ist invertiert: höher = schneller.",

    "es.kapsama.baslik": "Ereignistyp-Abdeckung",
    "es.kapsama.metin":
      "Welche Sicherheitsereignisse haben mindestens einen aktiven Zustellkanal? Nicht abgedeckte kritische Ereignisse bleiben stumm — verbinde sie mit einem Kanal.",
    "es.kapsama.kritikBaslik": "{n} kritische Ereignisse haben keinen Zustellkanal",
    "es.kapsama.kritikMetin": "{liste} — diese Ereignisse werden bei Auslösung nirgendwo gemeldet.",
    "es.kapsama.kanalYok": "Kein aktiver Zustellkanal",
    "es.kapsama.aktif": "aktiv",
    "es.kapsama.toplam": "/ {n} gesamt",
    "es.kapsama.kanal": "Kanäle",

    "es.onem.kritik": "kritisch",
    "es.onem.uyari": "Warnung",
    "es.onem.bilgi": "Info",

    "es.olay.bot.blocked": "Bot blockiert",
    "es.olay.ai_agent.detected": "KI-Agent erkannt",
    "es.olay.campaign.started": "Angriffskampagne gestartet",
    "es.olay.anomaly.detected": "Anomalie erkannt",
    "es.olay.quota.warning": "Kontingentwarnung (90 %)",

    "es.matris.baslik": "Integrationszustands-Matrix",
    "es.matris.olaySecilmemis": "Kein Ereignis ausgewählt",
    "es.matris.gonderiliyor": "Wird gesendet…",
    "es.matris.testGonder": "Test senden",

    "es.metrik.sonTeslimat": "Letzte Zustellung",
    "es.metrik.durumKodu": "Statuscode",
    "es.metrik.baglantiHatasi": "Verbindungsfehler",
    "es.metrik.gonderilen": "Gesendet",
    "es.metrik.gecikme": "Gesch. Latenz",
    "es.metrik.gecikmeTrend": "Latenztrend",
    "es.metrik.kurulum": "Einrichtung",
    "es.metrik.gecti": "{gecen}/{toplam} bestanden",

    "es.test.teslimEdildi": "Live-Test zugestellt{ek}.",
    "es.test.basarisiz": "Live-Test fehlgeschlagen{ek}. Aktualisiere die Seite, um den neuesten Status zu sehen.",

    "es.dogrulama.baslik": "Einrichtungsprüfung",
    "es.dogrulama.kritik": "kritisch",

    "es.teslimat.baslik": "Zustellverlaufs-Übersicht",
    "es.teslimat.bos":
      "Es wurde noch keine Zustellung an eine Integration vorgenommen. Erzeuge den ersten Zustelleintrag, indem du eine Integration mit <b>Test senden</b> ausprobierst.",
    "es.teslimat.toplamGonderilen": "Gesamt gesendet",
    "es.teslimat.enSon": "Letzte Zustellung",
    "es.teslimat.enCok": "Am meisten genutzt",
    "es.teslimat.bildirim": "{n} Benachrichtigungen",
    "es.teslimat.basarisizNot":
      "Die letzte Zustellung von {n} Integrationen ist fehlgeschlagen: {liste}. Erneut mit einem Live-Test versuchen.",
    "es.teslimat.hepsiBasarili": "Der letzte Versuch jeder Integration mit Zustellung war erfolgreich.",
    "es.teslimat.not":
      "Hinweis: Das detaillierte Zustellprotokoll behält nur den letzten Status (lastStatus/lastDelivery) und den Gesamtzähler; ein Versuch-für-Versuch-Verlauf wird in diesem Modul nicht geführt.",

    "es.alt.ekleBaslik": "Integration hinzufügen / konfigurieren",
    "es.alt.ekleMetin": "Verbinde einen neuen Slack-, Discord-, Teams-, Webhook-, PagerDuty- oder Zapier-Kanal.",
    "es.alt.yonlendirBaslik": "Benachrichtigungs-Routing",
    "es.alt.yonlendirMetin": "Verwalte regelbasiert, welches Ereignis über welchen Kanal geht.",

    "es.dipnot":
      "Der Zustand wird aus dem letzten Zustellergebnis, seiner Aktualität und der Einrichtungsvollständigkeit berechnet. <b>Live-Test</b> sendet eine echte HTTP-Anfrage (außer beim E-Mail-Typ — dort wird der Text vorbereitet und als Erfolg gewertet). Die Seite wird nach einem Test automatisch aktualisiert, um den neuesten Status anzuzeigen.",

    "es.toast.testEdiliyor": "{ad} wird getestet…",
    "es.toast.teslimEdildi": "Testbenachrichtigung zugestellt ✓",
    "es.toast.calisiyor": "{ad} funktioniert.",
    "es.toast.teslimEdilemedi": "Zustellung fehlgeschlagen",
    "es.toast.ulasilamadi": "Ziel von {ad} konnte nicht erreicht werden.",
    "es.toast.aktifYok": "Keine aktive Integration zum Testen",
    "es.toast.taramaTamam": "Scan abgeschlossen · {basari}/{toplam} erfolgreich",

    "es.zaman.hic": "Nie",
    "es.zaman.azOnce": "gerade eben",
    "es.zaman.dkOnce": "vor {n} Min.",
    "es.zaman.saOnce": "vor {n} Std.",
    "es.zaman.gunOnce": "vor {n} T.",
  },

  fr: {
    "es.baslik": "Santé des intégrations",

    "es.bos.baslik": "Surveillez la santé des connexions et la livraison au même endroit.",
    "es.bos.metin":
      "Consultez ici l'état de livraison, le test en direct et la validation de configuration de vos intégrations Slack, Discord, Teams, webhook, PagerDuty, Zapier et e-mail.",
    "es.bos.durumBaslik": "Aucune intégration connectée pour le moment",
    "es.bos.durumMetin":
      "Connectez d'abord une intégration pour surveiller sa santé. Une fois un canal de notification connecté, son état de livraison, son test en direct et son analyse de couverture apparaîtront ici.",
    "es.bos.baglaBtn": "Connecter une intégration",
    "es.bos.yonlendirBtn": "Routage des notifications",

    "es.intro.baslik": "Santé des connexions & observabilité de la livraison.",
    "es.intro.metin":
      "Suivez le dernier état de livraison, le score de santé et la validation de configuration de chaque intégration. Vérifiez un canal en direct avec une véritable notification de test.",
    "es.tumTest": "Tout tester",
    "es.taraniyor": "Analyse…",

    "es.ozet.toplam": "Intégrations totales",
    "es.ozet.aktif": "Actives",
    "es.ozet.saglikli": "Saines",
    "es.ozet.sonBasarisiz": "Dernière livraison échouée",

    "es.filo.baslik": "Résumé de santé du parc",
    "es.filo.ortSkor": "Score de santé moyen",
    "es.filo.toplamGonderi": "{n} notifications envoyées au total",
    "es.filo.dagilimBaslik": "Répartition des statuts & profil de latence",
    "es.filo.donutMerkez": "canaux",
    "es.tahminiRozet": "Estimé",
    "es.filo.gecikmeBaslik": "Latence estimée par canal",
    "es.filo.gecikmeNot": "Non mesuré : une valeur d'affichage ESTIMÉE (ms) dérivée du score de santé et du dernier code de statut.",
    "es.filo.kurulumHataBaslik": "Erreur de configuration présente",
    "es.filo.kurulumHataMetin":
      "Une ou plusieurs intégrations ont échoué à une vérification de configuration critique (cible valide / événement sélectionné). Corrigez les vérifications signalées en rouge dans la matrice ci-dessous.",

    "es.durum.saglikli": "Saine",
    "es.durum.uyari": "Avertissement",
    "es.durum.bozuk": "Défaillante",
    "es.durum.pasif": "Inactive",

    "es.isi.baslik": "Carte de chaleur intégration × métrique",
    "es.isi.metin":
      "Comparez chaque intégration sur quatre dimensions. Une cellule sombre indique une valeur élevée ; une cellule claire signale une marge de progression.",
    "es.isi.saglik": "Santé",
    "es.isi.gecikme": "Latence",
    "es.isi.kurulum": "Configuration",
    "es.isi.hacim": "Volume",
    "es.isi.dusuk": "Faible",
    "es.isi.yuksek": "Élevé",
    "es.isi.not": "La colonne latence est inversée : plus élevé = plus rapide.",

    "es.kapsama.baslik": "Couverture par type d'événement",
    "es.kapsama.metin":
      "Quels événements de sécurité disposent d'au moins un canal de livraison actif ? Les événements critiques non couverts restent silencieux — connectez-les à un canal.",
    "es.kapsama.kritikBaslik": "{n} événements critiques n'ont aucun canal de livraison",
    "es.kapsama.kritikMetin": "{liste} — ces événements ne seront signalés nulle part lorsqu'ils se déclenchent.",
    "es.kapsama.kanalYok": "Aucun canal de livraison actif",
    "es.kapsama.aktif": "actifs",
    "es.kapsama.toplam": "/ {n} au total",
    "es.kapsama.kanal": "canaux",

    "es.onem.kritik": "critique",
    "es.onem.uyari": "avertissement",
    "es.onem.bilgi": "info",

    "es.olay.bot.blocked": "Bot bloqué",
    "es.olay.ai_agent.detected": "Agent IA détecté",
    "es.olay.campaign.started": "Campagne d'attaque lancée",
    "es.olay.anomaly.detected": "Anomalie détectée",
    "es.olay.quota.warning": "Alerte de quota (90 %)",

    "es.matris.baslik": "Matrice de santé des intégrations",
    "es.matris.olaySecilmemis": "Aucun événement sélectionné",
    "es.matris.gonderiliyor": "Envoi…",
    "es.matris.testGonder": "Envoyer un test",

    "es.metrik.sonTeslimat": "Dernière livraison",
    "es.metrik.durumKodu": "Code de statut",
    "es.metrik.baglantiHatasi": "Erreur de connexion",
    "es.metrik.gonderilen": "Envoyées",
    "es.metrik.gecikme": "Latence est.",
    "es.metrik.gecikmeTrend": "Tendance de latence",
    "es.metrik.kurulum": "Configuration",
    "es.metrik.gecti": "{gecen}/{toplam} réussies",

    "es.test.teslimEdildi": "Test en direct livré{ek}.",
    "es.test.basarisiz": "Test en direct échoué{ek}. Actualisez la page pour voir le dernier état.",

    "es.dogrulama.baslik": "Validation de configuration",
    "es.dogrulama.kritik": "critique",

    "es.teslimat.baslik": "Résumé de l'historique de livraison",
    "es.teslimat.bos":
      "Aucune livraison n'a encore été effectuée vers une intégration. Créez le premier enregistrement de livraison en testant une intégration avec <b>Envoyer un test</b>.",
    "es.teslimat.toplamGonderilen": "Total envoyé",
    "es.teslimat.enSon": "Dernière livraison",
    "es.teslimat.enCok": "La plus utilisée",
    "es.teslimat.bildirim": "{n} notifications",
    "es.teslimat.basarisizNot":
      "La dernière livraison de {n} intégrations a échoué : {liste}. Réessayez avec un test en direct.",
    "es.teslimat.hepsiBasarili": "La dernière tentative de chaque intégration ayant livré a réussi.",
    "es.teslimat.not":
      "Remarque : le journal de livraison détaillé ne conserve que le dernier état (lastStatus/lastDelivery) et le compteur total ; l'historique tentative par tentative n'est pas conservé dans ce module.",

    "es.alt.ekleBaslik": "Ajouter / configurer une intégration",
    "es.alt.ekleMetin": "Connectez un nouveau canal Slack, Discord, Teams, webhook, PagerDuty ou Zapier.",
    "es.alt.yonlendirBaslik": "Routage des notifications",
    "es.alt.yonlendirMetin": "Gérez, règle par règle, quel événement passe par quel canal.",

    "es.dipnot":
      "L'état de santé est calculé à partir du résultat de la dernière livraison, de sa fraîcheur et de l'exhaustivité de la configuration. Le <b>test en direct</b> envoie une véritable requête HTTP (sauf pour le type e-mail — le corps y est préparé et compté comme réussi). La page s'actualise automatiquement pour afficher le dernier état après un test.",

    "es.toast.testEdiliyor": "Test de {ad}…",
    "es.toast.teslimEdildi": "Notification de test livrée ✓",
    "es.toast.calisiyor": "{ad} fonctionne.",
    "es.toast.teslimEdilemedi": "Échec de la livraison",
    "es.toast.ulasilamadi": "Impossible d'atteindre la cible de {ad}.",
    "es.toast.aktifYok": "Aucune intégration active à tester",
    "es.toast.taramaTamam": "Analyse terminée · {basari}/{toplam} réussies",

    "es.zaman.hic": "Jamais",
    "es.zaman.azOnce": "à l'instant",
    "es.zaman.dkOnce": "il y a {n} min",
    "es.zaman.saOnce": "il y a {n} h",
    "es.zaman.gunOnce": "il y a {n} j",
  },

  es: {
    "es.baslik": "Estado de integraciones",

    "es.bos.baslik": "Supervisa el estado de la conexión y la entrega en un solo lugar.",
    "es.bos.metin":
      "Consulta aquí el estado de entrega, la prueba en vivo y la validación de configuración de tus integraciones de Slack, Discord, Teams, webhook, PagerDuty, Zapier y correo.",
    "es.bos.durumBaslik": "Aún no hay integraciones conectadas",
    "es.bos.durumMetin":
      "Conecta primero una integración para supervisar su estado. Cuando conectes un canal de notificación, aquí aparecerán su estado de entrega, prueba en vivo y análisis de cobertura.",
    "es.bos.baglaBtn": "Conectar integración",
    "es.bos.yonlendirBtn": "Enrutamiento de notificaciones",

    "es.intro.baslik": "Estado de la conexión y observabilidad de la entrega.",
    "es.intro.metin":
      "Sigue el último estado de entrega, la puntuación de estado y la validación de configuración de cada integración. Verifica un canal en vivo con una notificación de prueba real.",
    "es.tumTest": "Probar todo",
    "es.taraniyor": "Escaneando…",

    "es.ozet.toplam": "Integraciones totales",
    "es.ozet.aktif": "Activas",
    "es.ozet.saglikli": "Saludables",
    "es.ozet.sonBasarisiz": "Última entrega fallida",

    "es.filo.baslik": "Resumen de estado de la flota",
    "es.filo.ortSkor": "Puntuación de estado media",
    "es.filo.toplamGonderi": "{n} notificaciones enviadas en total",
    "es.filo.dagilimBaslik": "Distribución de estado y perfil de latencia",
    "es.filo.donutMerkez": "canales",
    "es.tahminiRozet": "Estimado",
    "es.filo.gecikmeBaslik": "Latencia estimada por canal",
    "es.filo.gecikmeNot": "No medido: un valor de visualización ESTIMADO (ms) derivado del puntaje de salud y el último código de estado.",
    "es.filo.kurulumHataBaslik": "Hay un error de configuración",
    "es.filo.kurulumHataMetin":
      "Una o más integraciones fallaron una comprobación de configuración crítica (destino válido / evento seleccionado). Corrige las comprobaciones marcadas en rojo en la matriz de abajo.",

    "es.durum.saglikli": "Saludable",
    "es.durum.uyari": "Advertencia",
    "es.durum.bozuk": "Averiada",
    "es.durum.pasif": "Inactiva",

    "es.isi.baslik": "Mapa de calor integración × métrica",
    "es.isi.metin":
      "Compara cada integración en cuatro dimensiones. Una celda oscura indica un valor alto; una celda clara señala margen de mejora.",
    "es.isi.saglik": "Salud",
    "es.isi.gecikme": "Latencia",
    "es.isi.kurulum": "Configuración",
    "es.isi.hacim": "Volumen",
    "es.isi.dusuk": "Bajo",
    "es.isi.yuksek": "Alto",
    "es.isi.not": "La columna de latencia está invertida: más alto = más rápido.",

    "es.kapsama.baslik": "Cobertura por tipo de evento",
    "es.kapsama.metin":
      "¿Qué eventos de seguridad tienen al menos un canal de entrega activo? Los eventos críticos sin cobertura permanecen en silencio; conéctalos a un canal.",
    "es.kapsama.kritikBaslik": "{n} eventos críticos no tienen canal de entrega",
    "es.kapsama.kritikMetin": "{liste} — estos eventos no se notificarán en ningún sitio cuando se activen.",
    "es.kapsama.kanalYok": "Sin canal de entrega activo",
    "es.kapsama.aktif": "activos",
    "es.kapsama.toplam": "/ {n} en total",
    "es.kapsama.kanal": "canales",

    "es.onem.kritik": "crítico",
    "es.onem.uyari": "advertencia",
    "es.onem.bilgi": "info",

    "es.olay.bot.blocked": "Bot bloqueado",
    "es.olay.ai_agent.detected": "Agente de IA detectado",
    "es.olay.campaign.started": "Campaña de ataque iniciada",
    "es.olay.anomaly.detected": "Anomalía detectada",
    "es.olay.quota.warning": "Aviso de cuota (90 %)",

    "es.matris.baslik": "Matriz de estado de integraciones",
    "es.matris.olaySecilmemis": "Ningún evento seleccionado",
    "es.matris.gonderiliyor": "Enviando…",
    "es.matris.testGonder": "Enviar prueba",

    "es.metrik.sonTeslimat": "Última entrega",
    "es.metrik.durumKodu": "Código de estado",
    "es.metrik.baglantiHatasi": "Error de conexión",
    "es.metrik.gonderilen": "Enviadas",
    "es.metrik.gecikme": "Latencia est.",
    "es.metrik.gecikmeTrend": "Tendencia de latencia",
    "es.metrik.kurulum": "Configuración",
    "es.metrik.gecti": "{gecen}/{toplam} superadas",

    "es.test.teslimEdildi": "Prueba en vivo entregada{ek}.",
    "es.test.basarisiz": "Prueba en vivo fallida{ek}. Actualiza la página para ver el último estado.",

    "es.dogrulama.baslik": "Validación de configuración",
    "es.dogrulama.kritik": "crítico",

    "es.teslimat.baslik": "Resumen del historial de entregas",
    "es.teslimat.bos":
      "Aún no se ha realizado ninguna entrega a ninguna integración. Crea el primer registro de entrega probando una integración con <b>Enviar prueba</b>.",
    "es.teslimat.toplamGonderilen": "Total enviado",
    "es.teslimat.enSon": "Última entrega",
    "es.teslimat.enCok": "Más usada",
    "es.teslimat.bildirim": "{n} notificaciones",
    "es.teslimat.basarisizNot":
      "La última entrega de {n} integraciones falló: {liste}. Reinténtalo con una prueba en vivo.",
    "es.teslimat.hepsiBasarili": "El último intento de todas las integraciones que han entregado tuvo éxito.",
    "es.teslimat.not":
      "Nota: el registro de entrega detallado solo conserva el último estado (lastStatus/lastDelivery) y el contador total; en este módulo no se guarda el historial intento a intento.",

    "es.alt.ekleBaslik": "Añadir / configurar integración",
    "es.alt.ekleMetin": "Conecta un nuevo canal de Slack, Discord, Teams, webhook, PagerDuty o Zapier.",
    "es.alt.yonlendirBaslik": "Enrutamiento de notificaciones",
    "es.alt.yonlendirMetin": "Gestiona, regla por regla, qué evento va por qué canal.",

    "es.dipnot":
      "El estado se calcula a partir del resultado de la última entrega, su actualidad y la integridad de la configuración. La <b>prueba en vivo</b> envía una solicitud HTTP real (salvo el tipo correo, donde se prepara el cuerpo y se cuenta como éxito). La página se actualiza automáticamente para mostrar el último estado tras una prueba.",

    "es.toast.testEdiliyor": "Probando {ad}…",
    "es.toast.teslimEdildi": "Notificación de prueba entregada ✓",
    "es.toast.calisiyor": "{ad} funciona.",
    "es.toast.teslimEdilemedi": "Error en la entrega",
    "es.toast.ulasilamadi": "No se pudo alcanzar el destino de {ad}.",
    "es.toast.aktifYok": "No hay integración activa que probar",
    "es.toast.taramaTamam": "Escaneo completado · {basari}/{toplam} con éxito",

    "es.zaman.hic": "Nunca",
    "es.zaman.azOnce": "ahora mismo",
    "es.zaman.dkOnce": "hace {n} min",
    "es.zaman.saOnce": "hace {n} h",
    "es.zaman.gunOnce": "hace {n} d",
  },
};

/** Sözlükten çeviri getir; anahtar yoksa TR'ye, o da yoksa anahtarın kendisine düş. */
export function esCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
