/**
 * Bildirim Merkezi sayfası — yerel çeviri sözlüğü.
 *
 * Sadece bu sayfaya özgü kullanıcı-görünür metinleri içerir. Paylaşılan
 * `src/lib/i18n/panel.ts` DEĞİŞTİRİLMEZ. Anahtar bulunamazsa TR'ye, o da
 * yoksa anahtarın kendisine düşer.
 *
 * ENUM GÜVENLİĞİ
 * --------------
 * `BildirimKategori` ("guvenlik" | "sistem" | …) ve `severity`
 * ("critical" | "high" | …) enum değerleridir; ASLA çevrilmez. İstemcideki
 * eski TR etiket-haritaları (KAT_ETIKET / SEV_ETIKET) anahtar-haritasına
 * çevrildi; görünen metin `t("kat." + kategori)` / `t("sev." + severity)` ile
 * üretilir. Bildirim içeriği (title/message) veri olduğundan çevrilmez.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // Başlık / kırıntı (panel.ts'te uygun nav.* yok)
    "bl.baslik": "Bildirim Merkezi",
    "bl.kirinti": "Bildirimler",

    // Özet kartları
    "bl.ozet.okunmamis": "Okunmamış",
    "bl.ozet.bugun": "Bugün gelen",
    "bl.ozet.kritik": "Kritik",
    "bl.ozet.toplam": "Toplam bildirim",

    // Durum sekmeleri
    "bl.filtre.all": "Tümü",
    "bl.filtre.unread": "Okunmamış",
    "bl.filtre.critical": "Kritik",

    // Arama
    "bl.ara.placeholder": "Bildirimlerde ara…",
    "bl.ara.aria": "Bildirimlerde ara",

    // Kategori çipleri
    "bl.kategori.baslik": "Kategori",
    "bl.kategori.hepsi": "Hepsi",

    // Kategori etiketleri (enum: BildirimKategori)
    "kat.guvenlik": "Güvenlik",
    "kat.sistem": "Sistem",
    "kat.ekip": "Ekip",
    "kat.kota": "Kota",
    "kat.rapor": "Rapor",

    // Şiddet etiketleri (enum: severity)
    "sev.critical": "Kritik",
    "sev.high": "Yüksek",
    "sev.medium": "Orta",
    "sev.low": "Bilgi",

    // Gün grupları
    "grup.bugun": "Bugün",
    "grup.dun": "Dün",
    "grup.hafta": "Bu hafta",
    "grup.eski": "Daha eski",

    // Toplu işlem barı
    "bl.toplu.tumunuSec": "Tümünü seç",
    "bl.toplu.secili": "{n} seçili",
    "bl.toplu.seciliOku": "Seçilenleri oku",
    "bl.toplu.arsivle": "Arşivle",
    "bl.toplu.tumunuOku": "Tümünü okundu işaretle",

    // Satır aksiyonları
    "bl.satir.sec": "Bildirimi seç",
    "bl.satir.ac": "Aç",
    "bl.satir.okunduIsaretle": "Okundu işaretle",

    // Boş durum
    "bl.bos.baslik": "Her şey yolunda 🎉",
    "bl.bos.filtre": "Bu filtreye uyan bildirim yok. Filtreleri sıfırlamayı deneyin.",
    "bl.bos.temiz": "Okunmamış bildirimin yok. Yeni bir olay, kota eşiği ya da rapor hazır olduğunda burada anında görünür.",
    "bl.bos.temizle": "Filtreleri temizle",

    // Toast'lar
    "bl.toast.zatenOkundu": "Zaten hepsi okundu",
    "bl.toast.tumuOkundu": "Tümü okundu işaretlendi",
    "bl.toast.seciliOkundu": "Seçilenler okundu",
    "bl.toast.arsivlendi": "Arşivlendi",
    "bl.toast.arsivGizlendi": "{n} bildirim gizlendi",
    "bl.toast.adet": "{n} bildirim",

    // Göreli zaman
    "bl.zaman.simdi": "şimdi",
    "bl.zaman.dk": "{n}dk önce",
    "bl.zaman.sa": "{n}s önce",
    "bl.zaman.gun": "{n}g önce",
  },
  en: {
    "bl.baslik": "Notification Center",
    "bl.kirinti": "Notifications",

    "bl.ozet.okunmamis": "Unread",
    "bl.ozet.bugun": "Received today",
    "bl.ozet.kritik": "Critical",
    "bl.ozet.toplam": "Total notifications",

    "bl.filtre.all": "All",
    "bl.filtre.unread": "Unread",
    "bl.filtre.critical": "Critical",

    "bl.ara.placeholder": "Search notifications…",
    "bl.ara.aria": "Search notifications",

    "bl.kategori.baslik": "Category",
    "bl.kategori.hepsi": "All",

    "kat.guvenlik": "Security",
    "kat.sistem": "System",
    "kat.ekip": "Team",
    "kat.kota": "Quota",
    "kat.rapor": "Report",

    "sev.critical": "Critical",
    "sev.high": "High",
    "sev.medium": "Medium",
    "sev.low": "Info",

    "grup.bugun": "Today",
    "grup.dun": "Yesterday",
    "grup.hafta": "This week",
    "grup.eski": "Older",

    "bl.toplu.tumunuSec": "Select all",
    "bl.toplu.secili": "{n} selected",
    "bl.toplu.seciliOku": "Mark selected as read",
    "bl.toplu.arsivle": "Archive",
    "bl.toplu.tumunuOku": "Mark all as read",

    "bl.satir.sec": "Select notification",
    "bl.satir.ac": "Open",
    "bl.satir.okunduIsaretle": "Mark as read",

    "bl.bos.baslik": "All caught up 🎉",
    "bl.bos.filtre": "No notifications match this filter. Try resetting the filters.",
    "bl.bos.temiz": "You have no unread notifications. When a new event, quota threshold or report is ready, it shows up here instantly.",
    "bl.bos.temizle": "Clear filters",

    "bl.toast.zatenOkundu": "Everything is already read",
    "bl.toast.tumuOkundu": "Marked all as read",
    "bl.toast.seciliOkundu": "Selected marked as read",
    "bl.toast.arsivlendi": "Archived",
    "bl.toast.arsivGizlendi": "{n} notifications hidden",
    "bl.toast.adet": "{n} notifications",

    "bl.zaman.simdi": "now",
    "bl.zaman.dk": "{n}m ago",
    "bl.zaman.sa": "{n}h ago",
    "bl.zaman.gun": "{n}d ago",
  },
  de: {
    "bl.baslik": "Benachrichtigungszentrum",
    "bl.kirinti": "Benachrichtigungen",

    "bl.ozet.okunmamis": "Ungelesen",
    "bl.ozet.bugun": "Heute erhalten",
    "bl.ozet.kritik": "Kritisch",
    "bl.ozet.toplam": "Benachrichtigungen gesamt",

    "bl.filtre.all": "Alle",
    "bl.filtre.unread": "Ungelesen",
    "bl.filtre.critical": "Kritisch",

    "bl.ara.placeholder": "Benachrichtigungen durchsuchen…",
    "bl.ara.aria": "Benachrichtigungen durchsuchen",

    "bl.kategori.baslik": "Kategorie",
    "bl.kategori.hepsi": "Alle",

    "kat.guvenlik": "Sicherheit",
    "kat.sistem": "System",
    "kat.ekip": "Team",
    "kat.kota": "Kontingent",
    "kat.rapor": "Bericht",

    "sev.critical": "Kritisch",
    "sev.high": "Hoch",
    "sev.medium": "Mittel",
    "sev.low": "Info",

    "grup.bugun": "Heute",
    "grup.dun": "Gestern",
    "grup.hafta": "Diese Woche",
    "grup.eski": "Älter",

    "bl.toplu.tumunuSec": "Alle auswählen",
    "bl.toplu.secili": "{n} ausgewählt",
    "bl.toplu.seciliOku": "Ausgewählte als gelesen markieren",
    "bl.toplu.arsivle": "Archivieren",
    "bl.toplu.tumunuOku": "Alle als gelesen markieren",

    "bl.satir.sec": "Benachrichtigung auswählen",
    "bl.satir.ac": "Öffnen",
    "bl.satir.okunduIsaretle": "Als gelesen markieren",

    "bl.bos.baslik": "Alles erledigt 🎉",
    "bl.bos.filtre": "Keine Benachrichtigungen entsprechen diesem Filter. Versuchen Sie, die Filter zurückzusetzen.",
    "bl.bos.temiz": "Sie haben keine ungelesenen Benachrichtigungen. Sobald ein neues Ereignis, eine Kontingentschwelle oder ein Bericht bereit ist, erscheint es hier sofort.",
    "bl.bos.temizle": "Filter zurücksetzen",

    "bl.toast.zatenOkundu": "Alles ist bereits gelesen",
    "bl.toast.tumuOkundu": "Alle als gelesen markiert",
    "bl.toast.seciliOkundu": "Ausgewählte als gelesen markiert",
    "bl.toast.arsivlendi": "Archiviert",
    "bl.toast.arsivGizlendi": "{n} Benachrichtigungen ausgeblendet",
    "bl.toast.adet": "{n} Benachrichtigungen",

    "bl.zaman.simdi": "jetzt",
    "bl.zaman.dk": "vor {n} Min.",
    "bl.zaman.sa": "vor {n} Std.",
    "bl.zaman.gun": "vor {n} T.",
  },
  fr: {
    "bl.baslik": "Centre de notifications",
    "bl.kirinti": "Notifications",

    "bl.ozet.okunmamis": "Non lues",
    "bl.ozet.bugun": "Reçues aujourd'hui",
    "bl.ozet.kritik": "Critiques",
    "bl.ozet.toplam": "Total des notifications",

    "bl.filtre.all": "Toutes",
    "bl.filtre.unread": "Non lues",
    "bl.filtre.critical": "Critiques",

    "bl.ara.placeholder": "Rechercher des notifications…",
    "bl.ara.aria": "Rechercher des notifications",

    "bl.kategori.baslik": "Catégorie",
    "bl.kategori.hepsi": "Toutes",

    "kat.guvenlik": "Sécurité",
    "kat.sistem": "Système",
    "kat.ekip": "Équipe",
    "kat.kota": "Quota",
    "kat.rapor": "Rapport",

    "sev.critical": "Critique",
    "sev.high": "Élevée",
    "sev.medium": "Moyenne",
    "sev.low": "Info",

    "grup.bugun": "Aujourd'hui",
    "grup.dun": "Hier",
    "grup.hafta": "Cette semaine",
    "grup.eski": "Plus anciennes",

    "bl.toplu.tumunuSec": "Tout sélectionner",
    "bl.toplu.secili": "{n} sélectionnée(s)",
    "bl.toplu.seciliOku": "Marquer la sélection comme lue",
    "bl.toplu.arsivle": "Archiver",
    "bl.toplu.tumunuOku": "Tout marquer comme lu",

    "bl.satir.sec": "Sélectionner la notification",
    "bl.satir.ac": "Ouvrir",
    "bl.satir.okunduIsaretle": "Marquer comme lue",

    "bl.bos.baslik": "Tout est à jour 🎉",
    "bl.bos.filtre": "Aucune notification ne correspond à ce filtre. Essayez de réinitialiser les filtres.",
    "bl.bos.temiz": "Vous n'avez aucune notification non lue. Dès qu'un nouvel événement, un seuil de quota ou un rapport est prêt, il apparaît ici instantanément.",
    "bl.bos.temizle": "Effacer les filtres",

    "bl.toast.zatenOkundu": "Tout est déjà lu",
    "bl.toast.tumuOkundu": "Tout marqué comme lu",
    "bl.toast.seciliOkundu": "Sélection marquée comme lue",
    "bl.toast.arsivlendi": "Archivé",
    "bl.toast.arsivGizlendi": "{n} notifications masquées",
    "bl.toast.adet": "{n} notifications",

    "bl.zaman.simdi": "à l'instant",
    "bl.zaman.dk": "il y a {n} min",
    "bl.zaman.sa": "il y a {n} h",
    "bl.zaman.gun": "il y a {n} j",
  },
  es: {
    "bl.baslik": "Centro de notificaciones",
    "bl.kirinti": "Notificaciones",

    "bl.ozet.okunmamis": "Sin leer",
    "bl.ozet.bugun": "Recibidas hoy",
    "bl.ozet.kritik": "Críticas",
    "bl.ozet.toplam": "Notificaciones totales",

    "bl.filtre.all": "Todas",
    "bl.filtre.unread": "Sin leer",
    "bl.filtre.critical": "Críticas",

    "bl.ara.placeholder": "Buscar notificaciones…",
    "bl.ara.aria": "Buscar notificaciones",

    "bl.kategori.baslik": "Categoría",
    "bl.kategori.hepsi": "Todas",

    "kat.guvenlik": "Seguridad",
    "kat.sistem": "Sistema",
    "kat.ekip": "Equipo",
    "kat.kota": "Cuota",
    "kat.rapor": "Informe",

    "sev.critical": "Crítica",
    "sev.high": "Alta",
    "sev.medium": "Media",
    "sev.low": "Información",

    "grup.bugun": "Hoy",
    "grup.dun": "Ayer",
    "grup.hafta": "Esta semana",
    "grup.eski": "Más antiguas",

    "bl.toplu.tumunuSec": "Seleccionar todo",
    "bl.toplu.secili": "{n} seleccionada(s)",
    "bl.toplu.seciliOku": "Marcar selección como leída",
    "bl.toplu.arsivle": "Archivar",
    "bl.toplu.tumunuOku": "Marcar todo como leído",

    "bl.satir.sec": "Seleccionar notificación",
    "bl.satir.ac": "Abrir",
    "bl.satir.okunduIsaretle": "Marcar como leída",

    "bl.bos.baslik": "Todo al día 🎉",
    "bl.bos.filtre": "Ninguna notificación coincide con este filtro. Prueba a restablecer los filtros.",
    "bl.bos.temiz": "No tienes notificaciones sin leer. En cuanto haya un nuevo evento, umbral de cuota o informe listo, aparecerá aquí al instante.",
    "bl.bos.temizle": "Borrar filtros",

    "bl.toast.zatenOkundu": "Ya está todo leído",
    "bl.toast.tumuOkundu": "Todo marcado como leído",
    "bl.toast.seciliOkundu": "Selección marcada como leída",
    "bl.toast.arsivlendi": "Archivado",
    "bl.toast.arsivGizlendi": "{n} notificaciones ocultadas",
    "bl.toast.adet": "{n} notificaciones",

    "bl.zaman.simdi": "ahora",
    "bl.zaman.dk": "hace {n} min",
    "bl.zaman.sa": "hace {n} h",
    "bl.zaman.gun": "hace {n} d",
  },
};

/** Bu sayfa için çeviri. Anahtar yoksa TR'ye, o da yoksa anahtara düşer. */
export function bildirimlerCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
