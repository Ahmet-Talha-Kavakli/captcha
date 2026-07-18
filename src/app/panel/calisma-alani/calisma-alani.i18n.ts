/**
 * Çalışma Alanı paneli — YEREL sayfa sözlüğü.
 * =====================================================
 * Bu dosya YALNIZCA /panel/calisma-alani istemci bileşeninin kullanıcıya
 * görünen KROM/ETİKET metinlerini 5 dile taşır (tr/en/de/fr/es).
 * Paylaşılan `@/lib/i18n/panel` sözlüğüne DOKUNMAZ; sadece `Dil` tipini ondan alır.
 *
 * ÖNEMLİ (güvenlik / veri):
 *  - Enum DEĞERLERİ (plan: free/pro/scale, rol: owner/admin/analyst/viewer,
 *    üye durumu: active/invited/suspended) hiçbir zaman çevrilmez.
 *  - Plan/rol/durum ETİKETLERİ enum→anahtar eşlemesiyle çözülür:
 *    değer "pro" → t("ca.plan.pro). Böylece görüntü çevrilir, mantık değişmez.
 *  - Çalışma alanı adı, üye adı/e-postası, çalışma alanı kimliği ve tarihler
 *    VERİ'dir — çevrilmez (tarih Intl ile yerelleştirilir).
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // Başlık (breadcrumb + PanelUst)
    "ca.baslik": "Çalışma Alanı",

    // Bilgi şeridi
    "ca.serit.baslik": "Çalışma alanını buradan yönet.",
    "ca.serit.aciklama":
      "Çalışma alanının adını değiştir, üyeleri ve alan-düzeyi kullanımı gör. Bu ad panelin üst köşesindeki çalışma-alanı anahtarında görünür.",

    // Başlık kartı
    "ca.plan.suffix": "plan",
    "ca.olusturuldu": "Oluşturuldu: {t}",

    // Ad düzenleme
    "ca.ad.etiket": "Çalışma alanı adı",
    "ca.ad.kaydediliyor": "Kaydediliyor…",
    "ca.ad.kaydet": "Kaydet",
    "ca.ad.yardim": "2–60 karakter. Boş bırakılırsa kullanıcı adın ({ad}) gösterilir.",

    // Kaydetme toast'ları
    "ca.toast.kaydedilemedi.baslik": "Kaydedilemedi",
    "ca.toast.kaydedilemedi.aciklama": "Bir hata oluştu",
    "ca.toast.aghatasi.baslik": "Ağ hatası",
    "ca.toast.aghatasi.aciklama": "Lütfen tekrar deneyin",
    "ca.toast.basari.baslik": "Çalışma alanı güncellendi",

    // İstatistik kartları
    "ca.stat.uye": "Üye sayısı",
    "ca.stat.site": "Korunan site",
    "ca.stat.dogrulama": "30g doğrulama",
    "ca.stat.plan": "Plan",

    // Üyeler paneli
    "ca.uyeler.baslik": "Üyeler",
    "ca.uyeler.ekibiYonet": "Ekibi yönet",
    "ca.uyeler.ozet": "Bu çalışma alanında {n} üye var ({aktif} aktif). Rol ve davetleri düzenlemek için ekip sayfasını kullan.",
    "ca.uyeler.davetBekliyor": "Davet bekliyor",
    "ca.uyeler.askida": "Askıda",

    // Rol etiketleri (enum→anahtar)
    "ca.rol.owner": "Sahip",
    "ca.rol.admin": "Yönetici",
    "ca.rol.analyst": "Analist",
    "ca.rol.viewer": "İzleyici",

    // Plan etiketleri (enum→anahtar)
    "ca.plan.free": "Ücretsiz",
    "ca.plan.pro": "Pro",
    "ca.plan.scale": "Scale",

    // Çalışma alanları bölümü
    "ca.alanlar.baslik": "Çalışma alanları",
    "ca.alanlar.aktif": "Aktif",
    "ca.alanlar.ozet": "{plan} plan · {n} üye",
    "ca.alanlar.yeni.baslik": "Yeni çalışma alanı",
    "ca.alanlar.yeni.aciklama": "Ekiplerini ayrı alanlarda yönet.",
    "ca.alanlar.yakinda": "Yakında",
    "ca.alanlar.olustur": "Oluştur",
    "ca.alanlar.not":
      "Şu an tek çalışma alanı kullanıyorsun. Birden fazla çalışma alanı (ayrı fatura, ayrı ekip ve site kümesi) yakında geliyor.",

    // Veri bölümü
    "ca.veri.baslik": "Çalışma alanı verisi",
    "ca.veri.kart.baslik": "Yedekleme ve dışa aktarma",
    "ca.veri.kart.aciklama":
      "Çalışma alanının site, kural ve olay verisini yedekle ya da dışa aktar. Silme işlemi hesap ayarlarından yönetilir.",
    "ca.veri.link": "Veri & Yedekleme",
  },

  en: {
    "ca.baslik": "Workspace",

    "ca.serit.baslik": "Manage your workspace here.",
    "ca.serit.aciklama":
      "Rename your workspace and see members and workspace-level usage. This name appears in the workspace switcher at the top corner of the panel.",

    "ca.plan.suffix": "plan",
    "ca.olusturuldu": "Created: {t}",

    "ca.ad.etiket": "Workspace name",
    "ca.ad.kaydediliyor": "Saving…",
    "ca.ad.kaydet": "Save",
    "ca.ad.yardim": "2–60 characters. If left empty, your username ({ad}) is shown.",

    "ca.toast.kaydedilemedi.baslik": "Couldn't save",
    "ca.toast.kaydedilemedi.aciklama": "Something went wrong",
    "ca.toast.aghatasi.baslik": "Network error",
    "ca.toast.aghatasi.aciklama": "Please try again",
    "ca.toast.basari.baslik": "Workspace updated",

    "ca.stat.uye": "Members",
    "ca.stat.site": "Protected sites",
    "ca.stat.dogrulama": "30d verifications",
    "ca.stat.plan": "Plan",

    "ca.uyeler.baslik": "Members",
    "ca.uyeler.ekibiYonet": "Manage team",
    "ca.uyeler.ozet": "This workspace has {n} members ({aktif} active). Use the team page to edit roles and invites.",
    "ca.uyeler.davetBekliyor": "Invite pending",
    "ca.uyeler.askida": "Suspended",

    "ca.rol.owner": "Owner",
    "ca.rol.admin": "Admin",
    "ca.rol.analyst": "Analyst",
    "ca.rol.viewer": "Viewer",

    "ca.plan.free": "Free",
    "ca.plan.pro": "Pro",
    "ca.plan.scale": "Scale",

    "ca.alanlar.baslik": "Workspaces",
    "ca.alanlar.aktif": "Active",
    "ca.alanlar.ozet": "{plan} plan · {n} members",
    "ca.alanlar.yeni.baslik": "New workspace",
    "ca.alanlar.yeni.aciklama": "Manage your teams in separate workspaces.",
    "ca.alanlar.yakinda": "Coming soon",
    "ca.alanlar.olustur": "Create",
    "ca.alanlar.not":
      "You're using a single workspace right now. Multiple workspaces (separate billing, team and site set) are coming soon.",

    "ca.veri.baslik": "Workspace data",
    "ca.veri.kart.baslik": "Backup and export",
    "ca.veri.kart.aciklama":
      "Back up or export your workspace's site, rule and event data. Deletion is handled from account settings.",
    "ca.veri.link": "Data & Backup",
  },

  de: {
    "ca.baslik": "Arbeitsbereich",

    "ca.serit.baslik": "Verwalte hier deinen Arbeitsbereich.",
    "ca.serit.aciklama":
      "Benenne deinen Arbeitsbereich um und sieh Mitglieder sowie die Nutzung auf Bereichsebene. Dieser Name erscheint im Arbeitsbereich-Umschalter oben in der Ecke des Panels.",

    "ca.plan.suffix": "Tarif",
    "ca.olusturuldu": "Erstellt: {t}",

    "ca.ad.etiket": "Name des Arbeitsbereichs",
    "ca.ad.kaydediliyor": "Wird gespeichert…",
    "ca.ad.kaydet": "Speichern",
    "ca.ad.yardim": "2–60 Zeichen. Wenn leer, wird dein Benutzername ({ad}) angezeigt.",

    "ca.toast.kaydedilemedi.baslik": "Speichern fehlgeschlagen",
    "ca.toast.kaydedilemedi.aciklama": "Ein Fehler ist aufgetreten",
    "ca.toast.aghatasi.baslik": "Netzwerkfehler",
    "ca.toast.aghatasi.aciklama": "Bitte versuche es erneut",
    "ca.toast.basari.baslik": "Arbeitsbereich aktualisiert",

    "ca.stat.uye": "Mitglieder",
    "ca.stat.site": "Geschützte Websites",
    "ca.stat.dogrulama": "Verifizierungen (30 T.)",
    "ca.stat.plan": "Tarif",

    "ca.uyeler.baslik": "Mitglieder",
    "ca.uyeler.ekibiYonet": "Team verwalten",
    "ca.uyeler.ozet": "Dieser Arbeitsbereich hat {n} Mitglieder ({aktif} aktiv). Nutze die Team-Seite, um Rollen und Einladungen zu bearbeiten.",
    "ca.uyeler.davetBekliyor": "Einladung ausstehend",
    "ca.uyeler.askida": "Gesperrt",

    "ca.rol.owner": "Eigentümer",
    "ca.rol.admin": "Administrator",
    "ca.rol.analyst": "Analyst",
    "ca.rol.viewer": "Betrachter",

    "ca.plan.free": "Kostenlos",
    "ca.plan.pro": "Pro",
    "ca.plan.scale": "Scale",

    "ca.alanlar.baslik": "Arbeitsbereiche",
    "ca.alanlar.aktif": "Aktiv",
    "ca.alanlar.ozet": "{plan}-Tarif · {n} Mitglieder",
    "ca.alanlar.yeni.baslik": "Neuer Arbeitsbereich",
    "ca.alanlar.yeni.aciklama": "Verwalte deine Teams in getrennten Arbeitsbereichen.",
    "ca.alanlar.yakinda": "Demnächst",
    "ca.alanlar.olustur": "Erstellen",
    "ca.alanlar.not":
      "Du nutzt derzeit einen einzigen Arbeitsbereich. Mehrere Arbeitsbereiche (getrennte Abrechnung, getrenntes Team und Website-Set) folgen bald.",

    "ca.veri.baslik": "Arbeitsbereich-Daten",
    "ca.veri.kart.baslik": "Sicherung und Export",
    "ca.veri.kart.aciklama":
      "Sichere oder exportiere die Website-, Regel- und Ereignisdaten deines Arbeitsbereichs. Das Löschen wird über die Kontoeinstellungen verwaltet.",
    "ca.veri.link": "Daten & Sicherung",
  },

  fr: {
    "ca.baslik": "Espace de travail",

    "ca.serit.baslik": "Gérez votre espace de travail ici.",
    "ca.serit.aciklama":
      "Renommez votre espace de travail et consultez les membres ainsi que l'utilisation au niveau de l'espace. Ce nom apparaît dans le sélecteur d'espace de travail, en haut du panneau.",

    "ca.plan.suffix": "forfait",
    "ca.olusturuldu": "Créé le : {t}",

    "ca.ad.etiket": "Nom de l'espace de travail",
    "ca.ad.kaydediliyor": "Enregistrement…",
    "ca.ad.kaydet": "Enregistrer",
    "ca.ad.yardim": "2 à 60 caractères. Si laissé vide, votre nom d'utilisateur ({ad}) est affiché.",

    "ca.toast.kaydedilemedi.baslik": "Échec de l'enregistrement",
    "ca.toast.kaydedilemedi.aciklama": "Une erreur s'est produite",
    "ca.toast.aghatasi.baslik": "Erreur réseau",
    "ca.toast.aghatasi.aciklama": "Veuillez réessayer",
    "ca.toast.basari.baslik": "Espace de travail mis à jour",

    "ca.stat.uye": "Membres",
    "ca.stat.site": "Sites protégés",
    "ca.stat.dogrulama": "Vérifications (30 j)",
    "ca.stat.plan": "Forfait",

    "ca.uyeler.baslik": "Membres",
    "ca.uyeler.ekibiYonet": "Gérer l'équipe",
    "ca.uyeler.ozet": "Cet espace de travail compte {n} membres ({aktif} actifs). Utilisez la page équipe pour modifier les rôles et les invitations.",
    "ca.uyeler.davetBekliyor": "Invitation en attente",
    "ca.uyeler.askida": "Suspendu",

    "ca.rol.owner": "Propriétaire",
    "ca.rol.admin": "Administrateur",
    "ca.rol.analyst": "Analyste",
    "ca.rol.viewer": "Observateur",

    "ca.plan.free": "Gratuit",
    "ca.plan.pro": "Pro",
    "ca.plan.scale": "Scale",

    "ca.alanlar.baslik": "Espaces de travail",
    "ca.alanlar.aktif": "Actif",
    "ca.alanlar.ozet": "Forfait {plan} · {n} membres",
    "ca.alanlar.yeni.baslik": "Nouvel espace de travail",
    "ca.alanlar.yeni.aciklama": "Gérez vos équipes dans des espaces de travail distincts.",
    "ca.alanlar.yakinda": "Bientôt disponible",
    "ca.alanlar.olustur": "Créer",
    "ca.alanlar.not":
      "Vous utilisez actuellement un seul espace de travail. Plusieurs espaces de travail (facturation, équipe et ensemble de sites distincts) arrivent bientôt.",

    "ca.veri.baslik": "Données de l'espace de travail",
    "ca.veri.kart.baslik": "Sauvegarde et exportation",
    "ca.veri.kart.aciklama":
      "Sauvegardez ou exportez les données de sites, de règles et d'événements de votre espace de travail. La suppression se gère depuis les paramètres du compte.",
    "ca.veri.link": "Données et sauvegarde",
  },

  es: {
    "ca.baslik": "Espacio de trabajo",

    "ca.serit.baslik": "Gestiona tu espacio de trabajo aquí.",
    "ca.serit.aciklama":
      "Cambia el nombre de tu espacio de trabajo y consulta los miembros y el uso a nivel de espacio. Este nombre aparece en el selector de espacios de trabajo, en la esquina superior del panel.",

    "ca.plan.suffix": "plan",
    "ca.olusturuldu": "Creado: {t}",

    "ca.ad.etiket": "Nombre del espacio de trabajo",
    "ca.ad.kaydediliyor": "Guardando…",
    "ca.ad.kaydet": "Guardar",
    "ca.ad.yardim": "2 a 60 caracteres. Si se deja vacío, se muestra tu nombre de usuario ({ad}).",

    "ca.toast.kaydedilemedi.baslik": "No se pudo guardar",
    "ca.toast.kaydedilemedi.aciklama": "Se produjo un error",
    "ca.toast.aghatasi.baslik": "Error de red",
    "ca.toast.aghatasi.aciklama": "Inténtalo de nuevo",
    "ca.toast.basari.baslik": "Espacio de trabajo actualizado",

    "ca.stat.uye": "Miembros",
    "ca.stat.site": "Sitios protegidos",
    "ca.stat.dogrulama": "Verificaciones (30 d)",
    "ca.stat.plan": "Plan",

    "ca.uyeler.baslik": "Miembros",
    "ca.uyeler.ekibiYonet": "Gestionar equipo",
    "ca.uyeler.ozet": "Este espacio de trabajo tiene {n} miembros ({aktif} activos). Usa la página de equipo para editar roles e invitaciones.",
    "ca.uyeler.davetBekliyor": "Invitación pendiente",
    "ca.uyeler.askida": "Suspendido",

    "ca.rol.owner": "Propietario",
    "ca.rol.admin": "Administrador",
    "ca.rol.analyst": "Analista",
    "ca.rol.viewer": "Observador",

    "ca.plan.free": "Gratis",
    "ca.plan.pro": "Pro",
    "ca.plan.scale": "Scale",

    "ca.alanlar.baslik": "Espacios de trabajo",
    "ca.alanlar.aktif": "Activo",
    "ca.alanlar.ozet": "Plan {plan} · {n} miembros",
    "ca.alanlar.yeni.baslik": "Nuevo espacio de trabajo",
    "ca.alanlar.yeni.aciklama": "Gestiona tus equipos en espacios de trabajo separados.",
    "ca.alanlar.yakinda": "Próximamente",
    "ca.alanlar.olustur": "Crear",
    "ca.alanlar.not":
      "Ahora mismo usas un único espacio de trabajo. Los espacios de trabajo múltiples (facturación, equipo y conjunto de sitios separados) llegarán pronto.",

    "ca.veri.baslik": "Datos del espacio de trabajo",
    "ca.veri.kart.baslik": "Copia de seguridad y exportación",
    "ca.veri.kart.aciklama":
      "Haz una copia de seguridad o exporta los datos de sitios, reglas y eventos de tu espacio de trabajo. La eliminación se gestiona desde los ajustes de la cuenta.",
    "ca.veri.link": "Datos y copia de seguridad",
  },
};

/** Çalışma Alanı yerel çeviri yardımcısı: anahtar bulunamazsa TR'ye düşer. */
export function calismaAlaniCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
