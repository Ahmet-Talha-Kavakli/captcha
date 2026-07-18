/**
 * Kural Sürümleri — yerel i18n sözlüğü.
 *
 * Panel deseni: her sayfa kendi düz sözlüğünü taşır; `kuralSurumCeviri(anahtar, dil)`
 * hedef dile, bulunamazsa TR'ye, o da yoksa anahtarın kendisine düşer.
 *
 * ENUM GÜVENLİĞİ: aksiyon enum'u (allow/challenge/block/flag) asla çevrilmez;
 * burada enum-id → çeviri KEY-MAP'i tutulur ("aksiyon.allow" vb.) ve istemci tarafı
 * enum id ile etiketi türetir. Lib'deki rule-engine etiket-map'leri (FIELD_ETIKET,
 * OP_ETIKET) DÜZENLENMEDEN kalır: koşul özeti (ör. `IP eşittir "..."`) teknik
 * kural-DSL çıktısıdır, veri gibi ele alınır (kural-lab deseniyle tutarlı). Sürüm
 * numaraları/tarihler VERİDİR; BCP-47 ile yerelleştirilir. Sayılar {n}/{v} ile enterpole edilir.
 */
import type { Dil } from "@/lib/i18n/panel";

/** Göreli/tam zaman biçimlendirmede kullanılacak BCP-47 yerel kodları. */
export const YEREL_KOD: Record<Dil, string> = {
  tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES",
};

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // göreli zaman
    "zaman.azOnce": "az önce",
    "zaman.dk": "{n} dk önce",
    "zaman.sa": "{n} sa önce",
    "zaman.gun": "{n} gün önce",

    // durum etiketleri (diff + rozet)
    "durum.aktif": "Aktif",
    "durum.pasif": "Pasif",

    // diff alan etiketleri
    "alan.ad": "Ad",
    "alan.aksiyon": "Aksiyon",
    "alan.kosul": "Koşul",
    "alan.oncelik": "Öncelik",
    "alan.durum": "Durum",
    "alan.aciklama": "Açıklama",

    // tanıtım bandı
    "band.baslik": "Kurallarınız için git-benzeri sürüm geçmişi.",
    "band.metin":
      "Her kural düzenlemesi otomatik anlık-görüntü olarak kaydedilir. Sürümler arasındaki farkı gör, neyin değiştiğini incele ve tek tıkla istediğin sürüme güvenle geri dön.",

    // boş durum
    "bos.baslik": "Henüz sürüm geçmişi yok",
    "bos.metin":
      "Sürüm geçmişi, kurallarınızı düzenledikçe otomatik birikir. Bir kuralı her güncellediğinizde önceki hâli anlık-görüntü olarak kaydedilir; buradan farkları görüp istediğiniz sürüme geri dönebilirsiniz.",
    "bos.aksiyon": "Kurallara git",

    // özet kartları
    "ozet.surumluKural": "Sürümlü kural",
    "ozet.toplamKayit": "Toplam sürüm kaydı",
    "ozet.enCokDuzenlenen": "En çok düzenlenen",
    "ozet.enCokDuzenlenenAd": "En çok düzenlenen: {ad}",

    // sol liste
    "liste.ara": "Kural ya da site ara…",
    "liste.araLabel": "Kural ara",
    "liste.eslesmeYok": "Eşleşen kural yok.",
    "liste.sonDegisim": "son değişim {zaman}",
    "liste.kuralSec": "Soldan bir kural seçin.",

    // diff paneli
    "diff.baslik": "Fark: Sürüm {v} → Şu an aktif",
    "diff.degisti": "{n} alan değişti",
    "diff.farkYok": "Fark yok",
    "diff.rozet.degisti": "değişti",
    "diff.dipnot": "Solda seçili sürümün (Sürüm {v}) değeri, sağda kuralın şu anki hâli.",

    // sürüm zaman çizelgesi
    "zaman.baslik": "Sürüm geçmişi",
    "surum.no": "Sürüm {v}",
    "surum.enYeni": "en yeni kayıt",
    "surum.geriDonMe": "Bu sürüme geri dön",
    "surum.geriDonSor": "Kuralı Sürüm {v}'e döndür?",
    "surum.geriDonOnay": "Evet, geri dön",
    "surum.geriDonuluyor": "Dönülüyor…",
    "surum.iptal": "İptal",

    // toast + geri-alma hata mesajları
    "geri.bulunamadi": "Kural ya da sürüm bulunamadı.",
    "geri.yetkiYok": "Bu kuralı düzenleme yetkiniz yok.",
    "geri.gecersiz": "Geçersiz sürüm.",
    "geri.basarisiz": "Geri alma başarısız oldu.",
    "geri.aglHata": "Ağ hatası. Tekrar deneyin.",
    "toast.alinamadi.baslik": "Geri alınamadı",
    "toast.donuldu.baslik": "Sürüm {v}'e geri dönüldü",
    "toast.donuldu.aciklama": "Kural bu sürümün yapılandırmasına geri yüklendi.",

    // iyimser geçmiş kaydı (geri-alma sonrası)
    "kayit.siz": "Siz",
    "kayit.geriDonuldu": "Sürüm {v}'e geri döndürüldü",

    // aksiyon enum → etiket (enum id sabit; etiket türetilir)
    "aksiyon.allow": "İzin ver",
    "aksiyon.challenge": "Doğrula",
    "aksiyon.block": "Engelle",
    "aksiyon.flag": "İşaretle",
  },
  en: {
    "zaman.azOnce": "just now",
    "zaman.dk": "{n} min ago",
    "zaman.sa": "{n} h ago",
    "zaman.gun": "{n} d ago",

    "durum.aktif": "Active",
    "durum.pasif": "Inactive",

    "alan.ad": "Name",
    "alan.aksiyon": "Action",
    "alan.kosul": "Condition",
    "alan.oncelik": "Priority",
    "alan.durum": "Status",
    "alan.aciklama": "Description",

    "band.baslik": "Git-like version history for your rules.",
    "band.metin":
      "Every rule edit is automatically saved as a snapshot. See the diff between versions, review what changed and safely revert to any version in one click.",

    "bos.baslik": "No version history yet",
    "bos.metin":
      "Version history builds up automatically as you edit your rules. Each time you update a rule, its previous state is saved as a snapshot; from here you can view the diffs and revert to any version.",
    "bos.aksiyon": "Go to Rules",

    "ozet.surumluKural": "Versioned rules",
    "ozet.toplamKayit": "Total version records",
    "ozet.enCokDuzenlenen": "Most edited",
    "ozet.enCokDuzenlenenAd": "Most edited: {ad}",

    "liste.ara": "Search rule or site…",
    "liste.araLabel": "Search rule",
    "liste.eslesmeYok": "No matching rule.",
    "liste.sonDegisim": "last change {zaman}",
    "liste.kuralSec": "Select a rule on the left.",

    "diff.baslik": "Diff: Version {v} → Currently active",
    "diff.degisti": "{n} fields changed",
    "diff.farkYok": "No diff",
    "diff.rozet.degisti": "changed",
    "diff.dipnot": "On the left is the selected version's (Version {v}) value, on the right is the rule's current state.",

    "zaman.baslik": "Version history",
    "surum.no": "Version {v}",
    "surum.enYeni": "latest record",
    "surum.geriDonMe": "Revert to this version",
    "surum.geriDonSor": "Revert the rule to Version {v}?",
    "surum.geriDonOnay": "Yes, revert",
    "surum.geriDonuluyor": "Reverting…",
    "surum.iptal": "Cancel",

    "geri.bulunamadi": "Rule or version not found.",
    "geri.yetkiYok": "You don't have permission to edit this rule.",
    "geri.gecersiz": "Invalid version.",
    "geri.basarisiz": "Revert failed.",
    "geri.aglHata": "Network error. Try again.",
    "toast.alinamadi.baslik": "Couldn't revert",
    "toast.donuldu.baslik": "Reverted to Version {v}",
    "toast.donuldu.aciklama": "The rule was restored to this version's configuration.",

    "kayit.siz": "You",
    "kayit.geriDonuldu": "Reverted to Version {v}",

    "aksiyon.allow": "Allow",
    "aksiyon.challenge": "Challenge",
    "aksiyon.block": "Block",
    "aksiyon.flag": "Flag",
  },
  de: {
    "zaman.azOnce": "gerade eben",
    "zaman.dk": "vor {n} Min",
    "zaman.sa": "vor {n} Std",
    "zaman.gun": "vor {n} T",

    "durum.aktif": "Aktiv",
    "durum.pasif": "Inaktiv",

    "alan.ad": "Name",
    "alan.aksiyon": "Aktion",
    "alan.kosul": "Bedingung",
    "alan.oncelik": "Priorität",
    "alan.durum": "Status",
    "alan.aciklama": "Beschreibung",

    "band.baslik": "Git-ähnliche Versionsgeschichte für deine Regeln.",
    "band.metin":
      "Jede Regeländerung wird automatisch als Snapshot gespeichert. Sieh den Unterschied zwischen Versionen, prüfe, was sich geändert hat, und setze mit einem Klick sicher auf jede Version zurück.",

    "bos.baslik": "Noch keine Versionsgeschichte",
    "bos.metin":
      "Die Versionsgeschichte baut sich automatisch auf, während du deine Regeln bearbeitest. Jedes Mal, wenn du eine Regel aktualisierst, wird ihr vorheriger Zustand als Snapshot gespeichert; von hier aus kannst du die Unterschiede ansehen und auf jede Version zurücksetzen.",
    "bos.aksiyon": "Zu den Regeln",

    "ozet.surumluKural": "Versionierte Regeln",
    "ozet.toplamKayit": "Versionseinträge gesamt",
    "ozet.enCokDuzenlenen": "Am häufigsten bearbeitet",
    "ozet.enCokDuzenlenenAd": "Am häufigsten bearbeitet: {ad}",

    "liste.ara": "Regel oder Site suchen…",
    "liste.araLabel": "Regel suchen",
    "liste.eslesmeYok": "Keine passende Regel.",
    "liste.sonDegisim": "letzte Änderung {zaman}",
    "liste.kuralSec": "Wähle links eine Regel.",

    "diff.baslik": "Unterschied: Version {v} → Derzeit aktiv",
    "diff.degisti": "{n} Felder geändert",
    "diff.farkYok": "Kein Unterschied",
    "diff.rozet.degisti": "geändert",
    "diff.dipnot": "Links steht der Wert der ausgewählten Version (Version {v}), rechts der aktuelle Zustand der Regel.",

    "zaman.baslik": "Versionsgeschichte",
    "surum.no": "Version {v}",
    "surum.enYeni": "neuester Eintrag",
    "surum.geriDonMe": "Auf diese Version zurücksetzen",
    "surum.geriDonSor": "Regel auf Version {v} zurücksetzen?",
    "surum.geriDonOnay": "Ja, zurücksetzen",
    "surum.geriDonuluyor": "Wird zurückgesetzt…",
    "surum.iptal": "Abbrechen",

    "geri.bulunamadi": "Regel oder Version nicht gefunden.",
    "geri.yetkiYok": "Du hast keine Berechtigung, diese Regel zu bearbeiten.",
    "geri.gecersiz": "Ungültige Version.",
    "geri.basarisiz": "Zurücksetzen fehlgeschlagen.",
    "geri.aglHata": "Netzwerkfehler. Versuche es erneut.",
    "toast.alinamadi.baslik": "Konnte nicht zurückgesetzt werden",
    "toast.donuldu.baslik": "Auf Version {v} zurückgesetzt",
    "toast.donuldu.aciklama": "Die Regel wurde auf die Konfiguration dieser Version zurückgesetzt.",

    "kayit.siz": "Sie",
    "kayit.geriDonuldu": "Auf Version {v} zurückgesetzt",

    "aksiyon.allow": "Erlauben",
    "aksiyon.challenge": "Prüfen",
    "aksiyon.block": "Blockieren",
    "aksiyon.flag": "Markieren",
  },
  fr: {
    "zaman.azOnce": "à l'instant",
    "zaman.dk": "il y a {n} min",
    "zaman.sa": "il y a {n} h",
    "zaman.gun": "il y a {n} j",

    "durum.aktif": "Actif",
    "durum.pasif": "Inactif",

    "alan.ad": "Nom",
    "alan.aksiyon": "Action",
    "alan.kosul": "Condition",
    "alan.oncelik": "Priorité",
    "alan.durum": "Statut",
    "alan.aciklama": "Description",

    "band.baslik": "Historique des versions façon git pour vos règles.",
    "band.metin":
      "Chaque modification de règle est automatiquement enregistrée comme instantané. Voyez la différence entre versions, examinez ce qui a changé et revenez à n'importe quelle version en un clic en toute sécurité.",

    "bos.baslik": "Pas encore d'historique des versions",
    "bos.metin":
      "L'historique des versions se construit automatiquement à mesure que vous modifiez vos règles. Chaque fois que vous mettez à jour une règle, son état précédent est enregistré comme instantané ; d'ici, vous pouvez voir les différences et revenir à n'importe quelle version.",
    "bos.aksiyon": "Aller aux Règles",

    "ozet.surumluKural": "Règles versionnées",
    "ozet.toplamKayit": "Total des enregistrements de version",
    "ozet.enCokDuzenlenen": "La plus modifiée",
    "ozet.enCokDuzenlenenAd": "La plus modifiée : {ad}",

    "liste.ara": "Rechercher une règle ou un site…",
    "liste.araLabel": "Rechercher une règle",
    "liste.eslesmeYok": "Aucune règle correspondante.",
    "liste.sonDegisim": "dernière modification {zaman}",
    "liste.kuralSec": "Sélectionnez une règle à gauche.",

    "diff.baslik": "Différence : Version {v} → Actuellement active",
    "diff.degisti": "{n} champs modifiés",
    "diff.farkYok": "Aucune différence",
    "diff.rozet.degisti": "modifié",
    "diff.dipnot": "À gauche, la valeur de la version sélectionnée (Version {v}), à droite, l'état actuel de la règle.",

    "zaman.baslik": "Historique des versions",
    "surum.no": "Version {v}",
    "surum.enYeni": "enregistrement le plus récent",
    "surum.geriDonMe": "Revenir à cette version",
    "surum.geriDonSor": "Rétablir la règle à la Version {v} ?",
    "surum.geriDonOnay": "Oui, revenir",
    "surum.geriDonuluyor": "Rétablissement…",
    "surum.iptal": "Annuler",

    "geri.bulunamadi": "Règle ou version introuvable.",
    "geri.yetkiYok": "Vous n'avez pas la permission de modifier cette règle.",
    "geri.gecersiz": "Version invalide.",
    "geri.basarisiz": "Échec du rétablissement.",
    "geri.aglHata": "Erreur réseau. Réessayez.",
    "toast.alinamadi.baslik": "Impossible de revenir",
    "toast.donuldu.baslik": "Rétabli à la Version {v}",
    "toast.donuldu.aciklama": "La règle a été restaurée à la configuration de cette version.",

    "kayit.siz": "Vous",
    "kayit.geriDonuldu": "Rétabli à la Version {v}",

    "aksiyon.allow": "Autoriser",
    "aksiyon.challenge": "Vérifier",
    "aksiyon.block": "Bloquer",
    "aksiyon.flag": "Signaler",
  },
  es: {
    "zaman.azOnce": "hace un momento",
    "zaman.dk": "hace {n} min",
    "zaman.sa": "hace {n} h",
    "zaman.gun": "hace {n} d",

    "durum.aktif": "Activa",
    "durum.pasif": "Inactiva",

    "alan.ad": "Nombre",
    "alan.aksiyon": "Acción",
    "alan.kosul": "Condición",
    "alan.oncelik": "Prioridad",
    "alan.durum": "Estado",
    "alan.aciklama": "Descripción",

    "band.baslik": "Historial de versiones estilo git para tus reglas.",
    "band.metin":
      "Cada edición de regla se guarda automáticamente como instantánea. Ve la diferencia entre versiones, revisa qué cambió y revierte a cualquier versión con un clic de forma segura.",

    "bos.baslik": "Aún no hay historial de versiones",
    "bos.metin":
      "El historial de versiones se acumula automáticamente a medida que editas tus reglas. Cada vez que actualizas una regla, su estado anterior se guarda como instantánea; desde aquí puedes ver las diferencias y revertir a cualquier versión.",
    "bos.aksiyon": "Ir a Reglas",

    "ozet.surumluKural": "Reglas versionadas",
    "ozet.toplamKayit": "Total de registros de versión",
    "ozet.enCokDuzenlenen": "Más editada",
    "ozet.enCokDuzenlenenAd": "Más editada: {ad}",

    "liste.ara": "Buscar regla o sitio…",
    "liste.araLabel": "Buscar regla",
    "liste.eslesmeYok": "Ninguna regla coincidente.",
    "liste.sonDegisim": "último cambio {zaman}",
    "liste.kuralSec": "Selecciona una regla a la izquierda.",

    "diff.baslik": "Diferencia: Versión {v} → Actualmente activa",
    "diff.degisti": "{n} campos cambiados",
    "diff.farkYok": "Sin diferencia",
    "diff.rozet.degisti": "cambiado",
    "diff.dipnot": "A la izquierda está el valor de la versión seleccionada (Versión {v}), a la derecha el estado actual de la regla.",

    "zaman.baslik": "Historial de versiones",
    "surum.no": "Versión {v}",
    "surum.enYeni": "registro más reciente",
    "surum.geriDonMe": "Revertir a esta versión",
    "surum.geriDonSor": "¿Revertir la regla a la Versión {v}?",
    "surum.geriDonOnay": "Sí, revertir",
    "surum.geriDonuluyor": "Revirtiendo…",
    "surum.iptal": "Cancelar",

    "geri.bulunamadi": "Regla o versión no encontrada.",
    "geri.yetkiYok": "No tienes permiso para editar esta regla.",
    "geri.gecersiz": "Versión no válida.",
    "geri.basarisiz": "La reversión falló.",
    "geri.aglHata": "Error de red. Inténtalo de nuevo.",
    "toast.alinamadi.baslik": "No se pudo revertir",
    "toast.donuldu.baslik": "Revertido a la Versión {v}",
    "toast.donuldu.aciklama": "La regla se restauró a la configuración de esta versión.",

    "kayit.siz": "Tú",
    "kayit.geriDonuldu": "Revertido a la Versión {v}",

    "aksiyon.allow": "Permitir",
    "aksiyon.challenge": "Verificar",
    "aksiyon.block": "Bloquear",
    "aksiyon.flag": "Marcar",
  },
};

export function kuralSurumCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
