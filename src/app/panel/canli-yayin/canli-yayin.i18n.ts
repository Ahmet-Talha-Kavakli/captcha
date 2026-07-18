/**
 * Gerçek-Zaman Tehdit Yayını sayfası — yerel çeviri sözlüğü.
 *
 * Sadece bu sayfaya özgü kullanıcı-görünür metinleri içerir. Paylaşılan
 * `src/lib/i18n/panel.ts` DEĞİŞTİRİLMEZ. Anahtar bulunamazsa TR'ye, o da
 * yoksa anahtarın kendisine düşer.
 *
 * ENUM GÜVENLİĞİ
 * --------------
 * Akıştan gelen `botClass` ("human" | "scraper" | …) ve `verdict`
 * ("allowed" | "blocked" | …) sunucu verisidir; ASLA çevrilmez. İstemcideki
 * eski TR etiket-haritaları (BOT_ETIKET / VERDICT_ETIKET) anahtar-haritasına
 * çevrildi; görünen metin `t("bot." + botClass)` / `t("verdict." + verdict)`
 * ile üretilir. Bağlantı durumu ("baglaniyor" | "canli" | "kesildi") de bir
 * enumdur; rozet metni `t("cy.durum.*")` anahtarından gelir. IP/ülke/skor/
 * saat veridir, çevrilmez.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // Başlık / kırıntı (panel.ts "nav.livestream" = "Canlı Yayın" yalnızca kırıntı;
    // sayfa başlığı daha spesifik olduğundan yerel tutulur)
    "cy.baslik": "Gerçek-Zaman Tehdit Yayını",
    "cy.kirinti": "Canlı Yayın",

    // Bağlantı durumu rozeti (enum: baglaniyor | canli | kesildi)
    "cy.durum.canli": "CANLI",
    "cy.durum.baglaniyor": "Bağlanıyor…",
    "cy.durum.kesildi": "Bağlantı kesildi — yeniden bağlanılıyor",

    // Üst şerit
    "cy.serit.baslik": "Yayın bağlantısı",
    "cy.serit.aciklama.on": "Tek bir",
    "cy.serit.aciklama.sse": "SSE (EventSource)",
    "cy.serit.aciklama.son": "bağlantısı — sunucu, hesabınızın gerçek olay akışından yeni tehditleri anlık iter.",
    "cy.serit.surdur": "Sürdür",
    "cy.serit.duraklat": "Duraklat",
    "cy.serit.temizle": "Temizle",

    // Canlı sayaç kartları
    "cy.sayac.gorulen": "Bu oturumda görülen olay",
    "cy.sayac.engellenen": "Engellenen",
    "cy.sayac.dogrulanan": "Doğrulamaya alınan",
    "cy.sayac.anlik": "Anlık hız (olay/sn)",

    // Canlı akış paneli
    "cy.akis.baslik": "Canlı tehdit akışı",
    "cy.akis.sonOlay": "son {n} olay",
    "cy.akis.canliBekleniyor": "Yayın canlı — olay bekleniyor…",
    "cy.akis.baglaniyor": "Bağlanıyor…",
    "cy.akis.yenidenKuruluyor": "Bağlantı yeniden kuruluyor…",
    "cy.akis.aciklama": "Yeni tehdit gözlemlendiğinde bu akışa anlık olarak düşecek.",

    // Hız paneli
    "cy.hiz.baslik": "Canlı tehdit hızı",
    "cy.hiz.anlik": "Anlık",
    "cy.hiz.olaySn": "olay/sn",
    "cy.hiz.ortalama": "Ortalama",
    "cy.hiz.sonNsn": "son {n}sn",

    // Bot dağılımı paneli
    "cy.dagilim.baslik": "Canlı bot-sınıfı dağılımı",
    "cy.dagilim.bosVeri": "Henüz veri yok — akış bekleniyor.",

    // Bot-sınıfı etiketleri (enum: botClass)
    "bot.human": "İnsan",
    "bot.good_bot": "İyi bot",
    "bot.automation": "Otomasyon",
    "bot.scraper": "Kazıyıcı",
    "bot.credential_stuffing": "Kimlik doldurma",
    "bot.ai_agent": "AI ajan",
    "bot.ddos": "DDoS",
    "bot.spam": "Spam",
    "bot.bilinmiyor": "bilinmiyor",

    // Verdict etiketleri (enum: verdict)
    "verdict.allowed": "İzin verildi",
    "verdict.blocked": "Engellendi",
    "verdict.challenged": "Doğrulandı",
    "verdict.flagged": "İşaretlendi",

    // Bağlam notu
    "cy.not.baslik": "Bu ekran nasıl çalışır?",
    "cy.not.govde.1": "Bu, hesabınızın",
    "cy.not.gercekAkis": "gerçek olay akışının canlı görünümüdür",
    "cy.not.govde.2": ". Tarayıcınız sunucuya tek bir kalıcı",
    "cy.not.sse": "SSE (Server-Sent Events)",
    "cy.not.govde.3": "bağlantısı açar",
    "cy.not.govde.4": "; sunucu yeni gözlemlenen tehditleri bu bağlantı üzerinden iter — sahte bir setInterval tekrarı değil. Bağlantı koparsa EventSource kendiliğinden yeniden bağlanır. Yukarıdaki oturum sayaçları, akış açıldığından beri",
    "cy.not.sifirdan": "sıfırdan",
    "cy.not.govde.5": "sayar; geçmiş toplamlar için Analitik ve Konsol panellerine bakın.",
    "cy.not.ilkBoyama": "İlk-boyama referansı (son olaylardan): toplam {toplam} · engellenen {engellenen} · doğrulanan {dogrulanan}.",
  },
  en: {
    "cy.baslik": "Real-Time Threat Stream",
    "cy.kirinti": "Live Stream",

    "cy.durum.canli": "LIVE",
    "cy.durum.baglaniyor": "Connecting…",
    "cy.durum.kesildi": "Connection lost — reconnecting",

    "cy.serit.baslik": "Stream connection",
    "cy.serit.aciklama.on": "A single",
    "cy.serit.aciklama.sse": "SSE (EventSource)",
    "cy.serit.aciklama.son": "connection — the server pushes new threats from your account's real event stream in real time.",
    "cy.serit.surdur": "Resume",
    "cy.serit.duraklat": "Pause",
    "cy.serit.temizle": "Clear",

    "cy.sayac.gorulen": "Events seen this session",
    "cy.sayac.engellenen": "Blocked",
    "cy.sayac.dogrulanan": "Challenged",
    "cy.sayac.anlik": "Current rate (events/s)",

    "cy.akis.baslik": "Live threat feed",
    "cy.akis.sonOlay": "last {n} events",
    "cy.akis.canliBekleniyor": "Stream is live — waiting for events…",
    "cy.akis.baglaniyor": "Connecting…",
    "cy.akis.yenidenKuruluyor": "Reconnecting…",
    "cy.akis.aciklama": "When a new threat is observed, it drops into this feed in real time.",

    "cy.hiz.baslik": "Live threat rate",
    "cy.hiz.anlik": "Current",
    "cy.hiz.olaySn": "events/s",
    "cy.hiz.ortalama": "Average",
    "cy.hiz.sonNsn": "last {n}s",

    "cy.dagilim.baslik": "Live bot-class distribution",
    "cy.dagilim.bosVeri": "No data yet — waiting for the stream.",

    "bot.human": "Human",
    "bot.good_bot": "Good bot",
    "bot.automation": "Automation",
    "bot.scraper": "Scraper",
    "bot.credential_stuffing": "Credential stuffing",
    "bot.ai_agent": "AI agent",
    "bot.ddos": "DDoS",
    "bot.spam": "Spam",
    "bot.bilinmiyor": "unknown",

    "verdict.allowed": "Allowed",
    "verdict.blocked": "Blocked",
    "verdict.challenged": "Challenged",
    "verdict.flagged": "Flagged",

    "cy.not.baslik": "How does this screen work?",
    "cy.not.govde.1": "This is a",
    "cy.not.gercekAkis": "live view of your account's real event stream",
    "cy.not.govde.2": ". Your browser opens a single persistent",
    "cy.not.sse": "SSE (Server-Sent Events)",
    "cy.not.govde.3": "connection",
    "cy.not.govde.4": "; the server pushes newly observed threats over this connection — not a fake setInterval loop. If the connection drops, EventSource reconnects on its own. The session counters above count",
    "cy.not.sifirdan": "from zero",
    "cy.not.govde.5": "since the stream opened; for historical totals, see the Analytics and Console panels.",
    "cy.not.ilkBoyama": "First-paint reference (from recent events): total {toplam} · blocked {engellenen} · challenged {dogrulanan}.",
  },
  de: {
    "cy.baslik": "Echtzeit-Bedrohungsstream",
    "cy.kirinti": "Live-Stream",

    "cy.durum.canli": "LIVE",
    "cy.durum.baglaniyor": "Verbinden…",
    "cy.durum.kesildi": "Verbindung verloren — Neuverbindung",

    "cy.serit.baslik": "Stream-Verbindung",
    "cy.serit.aciklama.on": "Eine einzige",
    "cy.serit.aciklama.sse": "SSE (EventSource)",
    "cy.serit.aciklama.son": "-Verbindung — der Server sendet neue Bedrohungen aus dem echten Ereignisstrom Ihres Kontos in Echtzeit.",
    "cy.serit.surdur": "Fortsetzen",
    "cy.serit.duraklat": "Pausieren",
    "cy.serit.temizle": "Leeren",

    "cy.sayac.gorulen": "In dieser Sitzung gesehene Ereignisse",
    "cy.sayac.engellenen": "Blockiert",
    "cy.sayac.dogrulanan": "Herausgefordert",
    "cy.sayac.anlik": "Aktuelle Rate (Ereignisse/s)",

    "cy.akis.baslik": "Live-Bedrohungsfeed",
    "cy.akis.sonOlay": "letzte {n} Ereignisse",
    "cy.akis.canliBekleniyor": "Stream ist live — warte auf Ereignisse…",
    "cy.akis.baglaniyor": "Verbinden…",
    "cy.akis.yenidenKuruluyor": "Neuverbindung…",
    "cy.akis.aciklama": "Sobald eine neue Bedrohung beobachtet wird, erscheint sie in Echtzeit in diesem Feed.",

    "cy.hiz.baslik": "Live-Bedrohungsrate",
    "cy.hiz.anlik": "Aktuell",
    "cy.hiz.olaySn": "Ereignisse/s",
    "cy.hiz.ortalama": "Durchschnitt",
    "cy.hiz.sonNsn": "letzte {n} s",

    "cy.dagilim.baslik": "Live-Verteilung der Bot-Klassen",
    "cy.dagilim.bosVeri": "Noch keine Daten — warte auf den Stream.",

    "bot.human": "Mensch",
    "bot.good_bot": "Guter Bot",
    "bot.automation": "Automatisierung",
    "bot.scraper": "Scraper",
    "bot.credential_stuffing": "Credential Stuffing",
    "bot.ai_agent": "KI-Agent",
    "bot.ddos": "DDoS",
    "bot.spam": "Spam",
    "bot.bilinmiyor": "unbekannt",

    "verdict.allowed": "Zugelassen",
    "verdict.blocked": "Blockiert",
    "verdict.challenged": "Herausgefordert",
    "verdict.flagged": "Markiert",

    "cy.not.baslik": "Wie funktioniert dieser Bildschirm?",
    "cy.not.govde.1": "Dies ist eine",
    "cy.not.gercekAkis": "Live-Ansicht des echten Ereignisstroms Ihres Kontos",
    "cy.not.govde.2": ". Ihr Browser öffnet eine einzige dauerhafte",
    "cy.not.sse": "SSE (Server-Sent Events)",
    "cy.not.govde.3": "-Verbindung",
    "cy.not.govde.4": "; der Server sendet neu beobachtete Bedrohungen über diese Verbindung — keine gefälschte setInterval-Schleife. Bricht die Verbindung ab, verbindet sich EventSource von selbst neu. Die Sitzungszähler oben zählen",
    "cy.not.sifirdan": "von null",
    "cy.not.govde.5": "seit Öffnen des Streams; für historische Summen siehe die Panels Analytik und Konsole.",
    "cy.not.ilkBoyama": "Erstdarstellungs-Referenz (aus jüngsten Ereignissen): gesamt {toplam} · blockiert {engellenen} · herausgefordert {dogrulanan}.",
  },
  fr: {
    "cy.baslik": "Flux de menaces en temps réel",
    "cy.kirinti": "Flux en direct",

    "cy.durum.canli": "EN DIRECT",
    "cy.durum.baglaniyor": "Connexion…",
    "cy.durum.kesildi": "Connexion perdue — reconnexion",

    "cy.serit.baslik": "Connexion du flux",
    "cy.serit.aciklama.on": "Une seule connexion",
    "cy.serit.aciklama.sse": "SSE (EventSource)",
    "cy.serit.aciklama.son": " — le serveur transmet en temps réel les nouvelles menaces depuis le flux d'événements réel de votre compte.",
    "cy.serit.surdur": "Reprendre",
    "cy.serit.duraklat": "Suspendre",
    "cy.serit.temizle": "Effacer",

    "cy.sayac.gorulen": "Événements vus cette session",
    "cy.sayac.engellenen": "Bloqués",
    "cy.sayac.dogrulanan": "Mis au défi",
    "cy.sayac.anlik": "Débit actuel (événements/s)",

    "cy.akis.baslik": "Flux de menaces en direct",
    "cy.akis.sonOlay": "{n} derniers événements",
    "cy.akis.canliBekleniyor": "Flux en direct — en attente d'événements…",
    "cy.akis.baglaniyor": "Connexion…",
    "cy.akis.yenidenKuruluyor": "Reconnexion…",
    "cy.akis.aciklama": "Dès qu'une nouvelle menace est observée, elle apparaît dans ce flux en temps réel.",

    "cy.hiz.baslik": "Débit de menaces en direct",
    "cy.hiz.anlik": "Actuel",
    "cy.hiz.olaySn": "événements/s",
    "cy.hiz.ortalama": "Moyenne",
    "cy.hiz.sonNsn": "{n} dernières s",

    "cy.dagilim.baslik": "Répartition des classes de bots en direct",
    "cy.dagilim.bosVeri": "Pas encore de données — en attente du flux.",

    "bot.human": "Humain",
    "bot.good_bot": "Bon bot",
    "bot.automation": "Automatisation",
    "bot.scraper": "Extracteur",
    "bot.credential_stuffing": "Bourrage d'identifiants",
    "bot.ai_agent": "Agent IA",
    "bot.ddos": "DDoS",
    "bot.spam": "Spam",
    "bot.bilinmiyor": "inconnu",

    "verdict.allowed": "Autorisé",
    "verdict.blocked": "Bloqué",
    "verdict.challenged": "Mis au défi",
    "verdict.flagged": "Signalé",

    "cy.not.baslik": "Comment fonctionne cet écran ?",
    "cy.not.govde.1": "Ceci est une",
    "cy.not.gercekAkis": "vue en direct du flux d'événements réel de votre compte",
    "cy.not.govde.2": ". Votre navigateur ouvre une seule connexion persistante",
    "cy.not.sse": "SSE (Server-Sent Events)",
    "cy.not.govde.3": "",
    "cy.not.govde.4": " ; le serveur transmet les menaces nouvellement observées via cette connexion — pas une fausse boucle setInterval. Si la connexion tombe, EventSource se reconnecte de lui-même. Les compteurs de session ci-dessus comptent",
    "cy.not.sifirdan": "à partir de zéro",
    "cy.not.govde.5": "depuis l'ouverture du flux ; pour les totaux historiques, consultez les panneaux Analytique et Console.",
    "cy.not.ilkBoyama": "Référence de premier rendu (d'après les événements récents) : total {toplam} · bloqués {engellenen} · mis au défi {dogrulanan}.",
  },
  es: {
    "cy.baslik": "Flujo de amenazas en tiempo real",
    "cy.kirinti": "Transmisión en vivo",

    "cy.durum.canli": "EN VIVO",
    "cy.durum.baglaniyor": "Conectando…",
    "cy.durum.kesildi": "Conexión perdida — reconectando",

    "cy.serit.baslik": "Conexión del flujo",
    "cy.serit.aciklama.on": "Una única conexión",
    "cy.serit.aciklama.sse": "SSE (EventSource)",
    "cy.serit.aciklama.son": " — el servidor envía en tiempo real las nuevas amenazas desde el flujo de eventos real de tu cuenta.",
    "cy.serit.surdur": "Reanudar",
    "cy.serit.duraklat": "Pausar",
    "cy.serit.temizle": "Limpiar",

    "cy.sayac.gorulen": "Eventos vistos en esta sesión",
    "cy.sayac.engellenen": "Bloqueados",
    "cy.sayac.dogrulanan": "Desafiados",
    "cy.sayac.anlik": "Tasa actual (eventos/s)",

    "cy.akis.baslik": "Flujo de amenazas en vivo",
    "cy.akis.sonOlay": "últimos {n} eventos",
    "cy.akis.canliBekleniyor": "Transmisión en vivo — esperando eventos…",
    "cy.akis.baglaniyor": "Conectando…",
    "cy.akis.yenidenKuruluyor": "Reconectando…",
    "cy.akis.aciklama": "Cuando se observe una nueva amenaza, aparecerá en este flujo en tiempo real.",

    "cy.hiz.baslik": "Tasa de amenazas en vivo",
    "cy.hiz.anlik": "Actual",
    "cy.hiz.olaySn": "eventos/s",
    "cy.hiz.ortalama": "Promedio",
    "cy.hiz.sonNsn": "últimos {n} s",

    "cy.dagilim.baslik": "Distribución de clases de bots en vivo",
    "cy.dagilim.bosVeri": "Aún no hay datos — esperando el flujo.",

    "bot.human": "Humano",
    "bot.good_bot": "Bot bueno",
    "bot.automation": "Automatización",
    "bot.scraper": "Scraper",
    "bot.credential_stuffing": "Relleno de credenciales",
    "bot.ai_agent": "Agente de IA",
    "bot.ddos": "DDoS",
    "bot.spam": "Spam",
    "bot.bilinmiyor": "desconocido",

    "verdict.allowed": "Permitido",
    "verdict.blocked": "Bloqueado",
    "verdict.challenged": "Desafiado",
    "verdict.flagged": "Marcado",

    "cy.not.baslik": "¿Cómo funciona esta pantalla?",
    "cy.not.govde.1": "Esta es una",
    "cy.not.gercekAkis": "vista en vivo del flujo de eventos real de tu cuenta",
    "cy.not.govde.2": ". Tu navegador abre una única conexión persistente",
    "cy.not.sse": "SSE (Server-Sent Events)",
    "cy.not.govde.3": "",
    "cy.not.govde.4": "; el servidor envía las amenazas recién observadas por esta conexión — no un bucle setInterval falso. Si la conexión se cae, EventSource se reconecta por sí solo. Los contadores de sesión de arriba cuentan",
    "cy.not.sifirdan": "desde cero",
    "cy.not.govde.5": "desde que se abrió el flujo; para totales históricos, consulta los paneles Analítica y Consola.",
    "cy.not.ilkBoyama": "Referencia de primer render (de eventos recientes): total {toplam} · bloqueados {engellenen} · desafiados {dogrulanan}.",
  },
};

/** Bu sayfa için çeviri. Anahtar yoksa TR'ye, o da yoksa anahtara düşer. */
export function canliYayinCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
