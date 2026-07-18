/**
 * Entegrasyonlar sayfası — yerel çeviri sözlüğü.
 *
 * Sadece bu sayfaya özgü kullanıcı-görünür metinleri içerir. Paylaşılan
 * `src/lib/i18n/panel.ts` ve `src/lib/specter/integrations.ts` veri
 * kaynaklarına DOKUNMAZ; platform/olay açıklamaları burada `tur`/`key`
 * anahtarlarıyla yeniden çevrilir. Marka adları (Slack, Discord, Microsoft
 * Teams, PagerDuty, Zapier) ve enum/veri değerleri çevrilmez.
 *
 * Anahtar bulunamazsa TR'ye, o da yoksa anahtarın kendisine düşer.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // Üst tanıtım bandı
    "en.tanit.baslik": "Güvenlik olaylarını sevdiğin araçlara bağla.",
    "en.tanit.aciklama":
      "Bot engellendiğinde, AI ajan tespit edildiğinde veya kampanya başladığında Slack, Discord, Teams ve daha fazlasına anında bildirim gönder.",

    // Özet kartlar
    "en.ozet.bagli": "Bağlı entegrasyon",
    "en.ozet.aktif": "Aktif",
    "en.ozet.gonderilen": "Gönderilen bildirim",
    "en.ozet.platform": "Desteklenen platform",

    // Bölüm başlıkları
    "en.bolum.yeni": "Yeni entegrasyon bağla",
    "en.bolum.bagli": "Bağlı entegrasyonlar",
    // Görsel panolar + kategori grupları
    "en.gorsel.durumBaslik": "Bağlantı durumu",
    "en.gorsel.durumAlt": "Aktif ve duraklatılmış kanallar",
    "en.gorsel.baglanti": "kanal",
    "en.gorsel.dagitimBaslik": "Kategoriye göre dağıtım",
    "en.gorsel.dagitimAlt": "Platform türüne göre bağlı kanallar",
    "en.kat.bildirim": "Bildirim kanalları",
    "en.kat.otomasyon": "Otomasyon",
    "en.kat.siem": "Olay / SIEM",
    "en.kat.bildirimAlt": "Slack, Discord, Teams, e-posta",
    "en.kat.otomasyonAlt": "Zapier ile 5000+ uygulama",
    "en.kat.siemAlt": "PagerDuty çağrı & olay",

    // Platform açıklamaları (marka adları korunur)
    "en.platform.slack": "Güvenlik olaylarını Slack kanalına gönder.",
    "en.platform.discord": "Olayları Discord kanalına embed olarak gönder.",
    "en.platform.teams": "Teams kanalına kart bildirimi gönder.",
    "en.platform.pagerduty": "Kritik olaylarda çağrı/olay tetikle.",
    "en.platform.zapier": "5000+ uygulamaya otomasyon zinciri kur.",
    "en.platform.email": "Olay özetlerini e-posta ile al.",

    // Olay türü etiketleri
    "en.olay.bot.blocked": "Bot engellendi",
    "en.olay.ai_agent.detected": "AI ajan tespit edildi",
    "en.olay.campaign.started": "Saldırı kampanyası başladı",
    "en.olay.anomaly.detected": "Anomali tespit edildi",
    "en.olay.quota.warning": "Kota uyarısı (%90)",

    // Önem rozetleri
    "en.onem.bilgi": "bilgi",
    "en.onem.uyari": "uyarı",
    "en.onem.kritik": "kritik",

    // Durum etiketleri
    "en.durum.aktif": "Aktif",
    "en.durum.duraklatildi": "Duraklatıldı",

    // Butonlar / satır menü
    "en.btn.test": "Test",
    "en.btn.duraklat": "Duraklat",
    "en.btn.etkinlestir": "Etkinleştir",
    "en.btn.kaldir": "Kaldır",
    "en.btn.iptal": "İptal",
    "en.btn.bagla": "Bağla",
    "en.btn.baglaniyor": "Bağlanıyor…",

    // Satır meta (göreli zaman + gönderi sayısı)
    "en.satir.son": "Son:",
    "en.satir.gonderi": "gönderi",
    "en.goreli.hic": "Hiç",
    "en.goreli.azOnce": "az önce",
    "en.goreli.dk": "dk önce",
    "en.goreli.sa": "s önce",
    "en.goreli.g": "g önce",

    // Modal
    "en.modal.bagla": "bağla",
    "en.modal.baglantiAdi": "Bağlantı adı",
    "en.modal.baglantiAdiOrnek": "ör. Güvenlik kanalı",
    "en.modal.hangiOlaylar": "Hangi olaylarda bildir?",
    "en.modal.emailIpucu": "E-posta adresi doğrudan kullanılır.",
    "en.modal.webhookIpucu": "üzerinden bir gelen webhook oluşturup URL'i buraya yapıştırın.",
    "en.modal.kanalSoneki": " kanalı",

    // Toast bildirimleri
    "en.toast.baglandi": "bağlandı",
    "en.toast.baglanamadi": "Bağlanamadı",
    "en.toast.testGonderiliyor": "Test bildirimi gönderiliyor…",
    "en.toast.testGonderildi": "Test bildirimi gönderildi ✓",
    "en.toast.testHata": "Teslim edilemedi",
    "en.toast.hata": "hata",
    "en.toast.kaldirildi": "Entegrasyon kaldırıldı",
  },

  en: {
    "en.tanit.baslik": "Connect security events to the tools you love.",
    "en.tanit.aciklama":
      "Send instant notifications to Slack, Discord, Teams and more whenever a bot is blocked, an AI agent is detected or a campaign starts.",

    "en.ozet.bagli": "Connected integrations",
    "en.ozet.aktif": "Active",
    "en.ozet.gonderilen": "Notifications sent",
    "en.ozet.platform": "Supported platforms",

    "en.bolum.yeni": "Connect a new integration",
    "en.bolum.bagli": "Connected integrations",
    "en.gorsel.durumBaslik": "Connection status",
    "en.gorsel.durumAlt": "Active vs paused channels",
    "en.gorsel.baglanti": "channels",
    "en.gorsel.dagitimBaslik": "Distribution by category",
    "en.gorsel.dagitimAlt": "Connected channels by platform type",
    "en.kat.bildirim": "Notification channels",
    "en.kat.otomasyon": "Automation",
    "en.kat.siem": "Incident / SIEM",
    "en.kat.bildirimAlt": "Slack, Discord, Teams, email",
    "en.kat.otomasyonAlt": "5000+ apps via Zapier",
    "en.kat.siemAlt": "PagerDuty paging & incidents",

    "en.platform.slack": "Send security events to a Slack channel.",
    "en.platform.discord": "Post events to a Discord channel as embeds.",
    "en.platform.teams": "Send card notifications to a Teams channel.",
    "en.platform.pagerduty": "Trigger a page/incident on critical events.",
    "en.platform.zapier": "Build automation chains across 5000+ apps.",
    "en.platform.email": "Receive event summaries by email.",

    "en.olay.bot.blocked": "Bot blocked",
    "en.olay.ai_agent.detected": "AI agent detected",
    "en.olay.campaign.started": "Attack campaign started",
    "en.olay.anomaly.detected": "Anomaly detected",
    "en.olay.quota.warning": "Quota warning (90%)",

    "en.onem.bilgi": "info",
    "en.onem.uyari": "warning",
    "en.onem.kritik": "critical",

    "en.durum.aktif": "Active",
    "en.durum.duraklatildi": "Paused",

    "en.btn.test": "Test",
    "en.btn.duraklat": "Pause",
    "en.btn.etkinlestir": "Enable",
    "en.btn.kaldir": "Remove",
    "en.btn.iptal": "Cancel",
    "en.btn.bagla": "Connect",
    "en.btn.baglaniyor": "Connecting…",

    "en.satir.son": "Last:",
    "en.satir.gonderi": "deliveries",
    "en.goreli.hic": "Never",
    "en.goreli.azOnce": "just now",
    "en.goreli.dk": "m ago",
    "en.goreli.sa": "h ago",
    "en.goreli.g": "d ago",

    "en.modal.bagla": "connect",
    "en.modal.baglantiAdi": "Connection name",
    "en.modal.baglantiAdiOrnek": "e.g. Security channel",
    "en.modal.hangiOlaylar": "Which events should notify?",
    "en.modal.emailIpucu": "The email address is used directly.",
    "en.modal.webhookIpucu": "· create an incoming webhook and paste the URL here.",
    "en.modal.kanalSoneki": " channel",

    "en.toast.baglandi": "connected",
    "en.toast.baglanamadi": "Could not connect",
    "en.toast.testGonderiliyor": "Sending test notification…",
    "en.toast.testGonderildi": "Test notification sent ✓",
    "en.toast.testHata": "Delivery failed",
    "en.toast.hata": "error",
    "en.toast.kaldirildi": "Integration removed",
  },

  de: {
    "en.tanit.baslik": "Verbinde Sicherheitsereignisse mit deinen Lieblingstools.",
    "en.tanit.aciklama":
      "Sende sofortige Benachrichtigungen an Slack, Discord, Teams und mehr, wenn ein Bot blockiert, ein KI-Agent erkannt oder eine Kampagne gestartet wird.",

    "en.ozet.bagli": "Verbundene Integrationen",
    "en.ozet.aktif": "Aktiv",
    "en.ozet.gonderilen": "Gesendete Benachrichtigungen",
    "en.ozet.platform": "Unterstützte Plattformen",

    "en.bolum.yeni": "Neue Integration verbinden",
    "en.bolum.bagli": "Verbundene Integrationen",
    "en.gorsel.durumBaslik": "Verbindungsstatus",
    "en.gorsel.durumAlt": "Aktive vs. pausierte Kanäle",
    "en.gorsel.baglanti": "Kanäle",
    "en.gorsel.dagitimBaslik": "Verteilung nach Kategorie",
    "en.gorsel.dagitimAlt": "Verbundene Kanäle nach Plattformtyp",
    "en.kat.bildirim": "Benachrichtigungskanäle",
    "en.kat.otomasyon": "Automatisierung",
    "en.kat.siem": "Vorfall / SIEM",
    "en.kat.bildirimAlt": "Slack, Discord, Teams, E-Mail",
    "en.kat.otomasyonAlt": "5000+ Apps über Zapier",
    "en.kat.siemAlt": "PagerDuty Alarmierung & Vorfälle",

    "en.platform.slack": "Sende Sicherheitsereignisse an einen Slack-Kanal.",
    "en.platform.discord": "Poste Ereignisse als Embeds in einen Discord-Kanal.",
    "en.platform.teams": "Sende Kartenbenachrichtigungen an einen Teams-Kanal.",
    "en.platform.pagerduty": "Löse bei kritischen Ereignissen einen Alarm/Vorfall aus.",
    "en.platform.zapier": "Baue Automatisierungsketten über 5000+ Apps.",
    "en.platform.email": "Erhalte Ereigniszusammenfassungen per E-Mail.",

    "en.olay.bot.blocked": "Bot blockiert",
    "en.olay.ai_agent.detected": "KI-Agent erkannt",
    "en.olay.campaign.started": "Angriffskampagne gestartet",
    "en.olay.anomaly.detected": "Anomalie erkannt",
    "en.olay.quota.warning": "Kontingentwarnung (90 %)",

    "en.onem.bilgi": "Info",
    "en.onem.uyari": "Warnung",
    "en.onem.kritik": "Kritisch",

    "en.durum.aktif": "Aktiv",
    "en.durum.duraklatildi": "Pausiert",

    "en.btn.test": "Test",
    "en.btn.duraklat": "Pausieren",
    "en.btn.etkinlestir": "Aktivieren",
    "en.btn.kaldir": "Entfernen",
    "en.btn.iptal": "Abbrechen",
    "en.btn.bagla": "Verbinden",
    "en.btn.baglaniyor": "Wird verbunden…",

    "en.satir.son": "Zuletzt:",
    "en.satir.gonderi": "Zustellungen",
    "en.goreli.hic": "Nie",
    "en.goreli.azOnce": "gerade eben",
    "en.goreli.dk": " Min. her",
    "en.goreli.sa": " Std. her",
    "en.goreli.g": " Tg. her",

    "en.modal.bagla": "verbinden",
    "en.modal.baglantiAdi": "Verbindungsname",
    "en.modal.baglantiAdiOrnek": "z. B. Sicherheitskanal",
    "en.modal.hangiOlaylar": "Bei welchen Ereignissen benachrichtigen?",
    "en.modal.emailIpucu": "Die E-Mail-Adresse wird direkt verwendet.",
    "en.modal.webhookIpucu": "· erstelle einen eingehenden Webhook und füge die URL hier ein.",
    "en.modal.kanalSoneki": "-Kanal",

    "en.toast.baglandi": "verbunden",
    "en.toast.baglanamadi": "Verbindung fehlgeschlagen",
    "en.toast.testGonderiliyor": "Testbenachrichtigung wird gesendet…",
    "en.toast.testGonderildi": "Testbenachrichtigung gesendet ✓",
    "en.toast.testHata": "Zustellung fehlgeschlagen",
    "en.toast.hata": "Fehler",
    "en.toast.kaldirildi": "Integration entfernt",
  },

  fr: {
    "en.tanit.baslik": "Connectez les événements de sécurité à vos outils préférés.",
    "en.tanit.aciklama":
      "Envoyez des notifications instantanées vers Slack, Discord, Teams et plus encore lorsqu'un bot est bloqué, qu'un agent IA est détecté ou qu'une campagne démarre.",

    "en.ozet.bagli": "Intégrations connectées",
    "en.ozet.aktif": "Actives",
    "en.ozet.gonderilen": "Notifications envoyées",
    "en.ozet.platform": "Plateformes prises en charge",

    "en.bolum.yeni": "Connecter une nouvelle intégration",
    "en.bolum.bagli": "Intégrations connectées",
    "en.gorsel.durumBaslik": "État des connexions",
    "en.gorsel.durumAlt": "Canaux actifs vs en pause",
    "en.gorsel.baglanti": "canaux",
    "en.gorsel.dagitimBaslik": "Répartition par catégorie",
    "en.gorsel.dagitimAlt": "Canaux connectés par type de plateforme",
    "en.kat.bildirim": "Canaux de notification",
    "en.kat.otomasyon": "Automatisation",
    "en.kat.siem": "Incident / SIEM",
    "en.kat.bildirimAlt": "Slack, Discord, Teams, e-mail",
    "en.kat.otomasyonAlt": "5000+ applications via Zapier",
    "en.kat.siemAlt": "Alertes et incidents PagerDuty",

    "en.platform.slack": "Envoyez les événements de sécurité vers un canal Slack.",
    "en.platform.discord": "Publiez les événements dans un canal Discord sous forme d'embeds.",
    "en.platform.teams": "Envoyez des notifications en carte vers un canal Teams.",
    "en.platform.pagerduty": "Déclenchez une alerte/un incident sur les événements critiques.",
    "en.platform.zapier": "Créez des chaînes d'automatisation sur plus de 5000 applications.",
    "en.platform.email": "Recevez des résumés d'événements par e-mail.",

    "en.olay.bot.blocked": "Bot bloqué",
    "en.olay.ai_agent.detected": "Agent IA détecté",
    "en.olay.campaign.started": "Campagne d'attaque démarrée",
    "en.olay.anomaly.detected": "Anomalie détectée",
    "en.olay.quota.warning": "Alerte de quota (90 %)",

    "en.onem.bilgi": "info",
    "en.onem.uyari": "avertissement",
    "en.onem.kritik": "critique",

    "en.durum.aktif": "Active",
    "en.durum.duraklatildi": "En pause",

    "en.btn.test": "Tester",
    "en.btn.duraklat": "Mettre en pause",
    "en.btn.etkinlestir": "Activer",
    "en.btn.kaldir": "Retirer",
    "en.btn.iptal": "Annuler",
    "en.btn.bagla": "Connecter",
    "en.btn.baglaniyor": "Connexion…",

    "en.satir.son": "Dernier :",
    "en.satir.gonderi": "envois",
    "en.goreli.hic": "Jamais",
    "en.goreli.azOnce": "à l'instant",
    "en.goreli.dk": " min",
    "en.goreli.sa": " h",
    "en.goreli.g": " j",

    "en.modal.bagla": "connecter",
    "en.modal.baglantiAdi": "Nom de la connexion",
    "en.modal.baglantiAdiOrnek": "p. ex. Canal de sécurité",
    "en.modal.hangiOlaylar": "Pour quels événements notifier ?",
    "en.modal.emailIpucu": "L'adresse e-mail est utilisée directement.",
    "en.modal.webhookIpucu": "· créez un webhook entrant et collez l'URL ici.",
    "en.modal.kanalSoneki": " (canal)",

    "en.toast.baglandi": "connecté",
    "en.toast.baglanamadi": "Échec de la connexion",
    "en.toast.testGonderiliyor": "Envoi de la notification de test…",
    "en.toast.testGonderildi": "Notification de test envoyée ✓",
    "en.toast.testHata": "Échec de la livraison",
    "en.toast.hata": "erreur",
    "en.toast.kaldirildi": "Intégration retirée",
  },

  es: {
    "en.tanit.baslik": "Conecta los eventos de seguridad con tus herramientas favoritas.",
    "en.tanit.aciklama":
      "Envía notificaciones instantáneas a Slack, Discord, Teams y más cuando se bloquea un bot, se detecta un agente de IA o comienza una campaña.",

    "en.ozet.bagli": "Integraciones conectadas",
    "en.ozet.aktif": "Activas",
    "en.ozet.gonderilen": "Notificaciones enviadas",
    "en.ozet.platform": "Plataformas compatibles",

    "en.bolum.yeni": "Conectar una nueva integración",
    "en.bolum.bagli": "Integraciones conectadas",
    "en.gorsel.durumBaslik": "Estado de conexión",
    "en.gorsel.durumAlt": "Canales activos vs en pausa",
    "en.gorsel.baglanti": "canales",
    "en.gorsel.dagitimBaslik": "Distribución por categoría",
    "en.gorsel.dagitimAlt": "Canales conectados por tipo de plataforma",
    "en.kat.bildirim": "Canales de notificación",
    "en.kat.otomasyon": "Automatización",
    "en.kat.siem": "Incidente / SIEM",
    "en.kat.bildirimAlt": "Slack, Discord, Teams, correo",
    "en.kat.otomasyonAlt": "5000+ apps vía Zapier",
    "en.kat.siemAlt": "Alertas e incidentes de PagerDuty",

    "en.platform.slack": "Envía eventos de seguridad a un canal de Slack.",
    "en.platform.discord": "Publica eventos en un canal de Discord como embeds.",
    "en.platform.teams": "Envía notificaciones en tarjeta a un canal de Teams.",
    "en.platform.pagerduty": "Activa una alerta/incidente en eventos críticos.",
    "en.platform.zapier": "Crea cadenas de automatización en más de 5000 apps.",
    "en.platform.email": "Recibe resúmenes de eventos por correo electrónico.",

    "en.olay.bot.blocked": "Bot bloqueado",
    "en.olay.ai_agent.detected": "Agente de IA detectado",
    "en.olay.campaign.started": "Campaña de ataque iniciada",
    "en.olay.anomaly.detected": "Anomalía detectada",
    "en.olay.quota.warning": "Aviso de cuota (90 %)",

    "en.onem.bilgi": "info",
    "en.onem.uyari": "aviso",
    "en.onem.kritik": "crítico",

    "en.durum.aktif": "Activa",
    "en.durum.duraklatildi": "En pausa",

    "en.btn.test": "Probar",
    "en.btn.duraklat": "Pausar",
    "en.btn.etkinlestir": "Activar",
    "en.btn.kaldir": "Quitar",
    "en.btn.iptal": "Cancelar",
    "en.btn.bagla": "Conectar",
    "en.btn.baglaniyor": "Conectando…",

    "en.satir.son": "Último:",
    "en.satir.gonderi": "envíos",
    "en.goreli.hic": "Nunca",
    "en.goreli.azOnce": "ahora mismo",
    "en.goreli.dk": " min",
    "en.goreli.sa": " h",
    "en.goreli.g": " d",

    "en.modal.bagla": "conectar",
    "en.modal.baglantiAdi": "Nombre de la conexión",
    "en.modal.baglantiAdiOrnek": "p. ej. Canal de seguridad",
    "en.modal.hangiOlaylar": "¿En qué eventos notificar?",
    "en.modal.emailIpucu": "La dirección de correo se usa directamente.",
    "en.modal.webhookIpucu": "· crea un webhook entrante y pega la URL aquí.",
    "en.modal.kanalSoneki": " (canal)",

    "en.toast.baglandi": "conectada",
    "en.toast.baglanamadi": "No se pudo conectar",
    "en.toast.testGonderiliyor": "Enviando notificación de prueba…",
    "en.toast.testGonderildi": "Notificación de prueba enviada ✓",
    "en.toast.testHata": "Error de entrega",
    "en.toast.hata": "error",
    "en.toast.kaldirildi": "Integración eliminada",
  },
};

export function entegrasyonlarCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr[anahtar] ?? anahtar;
}
