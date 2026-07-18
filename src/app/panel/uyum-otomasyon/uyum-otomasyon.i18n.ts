import type { Dil } from "@/lib/i18n/panel";

/**
 * Uyum Kanıt Otomasyonu sayfasına özel i18n sözlüğü (yalnızca bu modül kullanır).
 * "uo." namespace'li anahtarlar. Doğal/native çeviriler.
 *
 * NOT: Çerçeve adları (SOC 2, ISO 27001, KVKK, GDPR) ve kontrol kimlikleri
 * (CC6.1, A.5.15, Art.32 …) özel ad/veridir — çevrilmez. Toplayıcıların
 * uyum-otomasyon.ts motorunda gerçek veriden ÜRETTİĞİ ad/açıklama/kanıt/detay
 * metinleri (canlı sayılar içerir) veri olarak TR kalır — uyum/cerceve
 * modülündeki kanıt metniyle aynı yaklaşım. Burada yalnızca UI çerçevesi
 * (başlıklar, kart etiketleri, durum rozetleri, düğmeler, göreli zaman)
 * çevrilir. Durum etiketleri enum→i18n anahtarı eşlemesiyle çözülür.
 * Sayılar/tarihler veri olarak kalır, BCP-47 ile biçimlenir.
 * TR kaynak/otorite; anahtar yoksa TR'ye düşer.
 */
const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    "uo.baslik": "Uyum Kanıt Otomasyonu",
    // --- tanıtım şeridi ---
    "uo.intro.baslik": "Kanıt kendiliğinden toplanır — statik metin değil, canlı sistem durumu.",
    "uo.intro.metin":
      "Toplayıcılar; ekip rolleri, denetim zinciri, API anahtar kapsamları, 2FA, olay yaşam döngüsü ve daha fazlasını sürekli okuyup her kontrolün geçtiğini doğrular. Denetçiye hazır kanıt paketini tek tıkla indir.",
    // --- özet skorlar ---
    "uo.ozet.kapsam": "Otomatik kanıt kapsamı",
    "uo.ozet.dogrulanan": "Otomatik doğrulanan toplayıcı",
    "uo.ozet.canliKontrol": "Canlı kanıtlı çerçeve-kontrolü",
    "uo.ozet.elleGereken": "Elle kanıt gereken",
    // --- sürekli izleme şeridi ---
    "uo.izleme.aktif": "Sürekli izleme aktif",
    "uo.izleme.sonTarama": "· Son tarama {goreli} ({tam})",
    "uo.izleme.taraniyor": "Taranıyor…",
    "uo.izleme.yenidenTara": "Yeniden tara",
    "uo.izleme.paketTxt": "Kanıt paketi (.txt)",
    "uo.izleme.paketJson": "Kanıt paketi (.json)",
    // --- çerçeve kapsam panosu ---
    "uo.pano.otomatikKanitli": "{otomatik}/{toplam} kontrol otomatik kanıtlı",
    // --- görsel panolar ---
    "uo.gorsel.kapsamBaslik": "Otomasyon kapsamı",
    "uo.gorsel.kapsamAlt": "Otomatik doğrulanan toplayıcı oranı",
    "uo.gorsel.dagilimBaslik": "Kanıt toplama durumu",
    "uo.gorsel.otomatik": "Otomatik",
    "uo.gorsel.elle": "Elle",
    "uo.gorsel.cerceveBaslik": "Çerçeve kanıt yoğunluğu",
    "uo.gorsel.cerceveAlt": "Çerçeve başına otomatik kanıtlı kontrol",
    "uo.gorsel.toplayici": "toplayıcı",
    // --- toplayıcı listesi ---
    "uo.list.baslik": "Kanıt toplayıcıları",
    "uo.list.filtre.hepsi": "Hepsi ({n})",
    "uo.list.filtre.otomatik": "Otomatik ({n})",
    "uo.list.filtre.elle": "Elle ({n})",
    "uo.list.bos": "Bu filtreye uygun toplayıcı yok.",
    // --- toplayıcı satırı ---
    "uo.satir.dogrulandi": "Otomatik doğrulandı",
    "uo.satir.elleGerekli": "Elle kanıt gerekli",
    "uo.satir.kanitIzi": "Kanıt izi",
    "uo.satir.sonKontrol": "Son kontrol: {tam}",
    // --- toast ---
    "uo.toast.tarandiBaslik": "Kanıt yeniden tarandı",
    "uo.toast.tarandiAcik": "Toplayıcılar canlı sistem durumundan güncellendi.",
    "uo.toast.indirildiTxt": "Kanıt paketi indirildi (.txt)",
    "uo.toast.indirildiJson": "Kanıt paketi indirildi (.json)",
    // --- göreli zaman ---
    "uo.zaman.azOnce": "az önce",
    "uo.zaman.dk": "{n} dk önce",
    "uo.zaman.sa": "{n} sa önce",
    "uo.zaman.g": "{n} g önce",
    // --- dürüstlük notu ---
    "uo.dust.metin":
      "Otomatik kanıt, çalışan sistemin <b>gerçek durumundan</b> toplanır ve denetim hazırlığını hızlandırır; ancak resmi bir denetimin <b>yerine geçmez</b>. Bağımsız denetçi süreci ayrıca gerekir. Bu konsol, statik <b>Uyum &amp; Sertifika</b> sayfasını canlı doğrulamayla tamamlar.",
  },

  en: {
    "uo.baslik": "Compliance Evidence Automation",
    "uo.intro.baslik": "Evidence collects itself — not static text, live system state.",
    "uo.intro.metin":
      "Collectors continuously read team roles, the audit chain, API key scopes, 2FA, the incident lifecycle and more, verifying that every control passes. Download the auditor-ready evidence package in one click.",
    "uo.ozet.kapsam": "Automated evidence coverage",
    "uo.ozet.dogrulanan": "Auto-verified collectors",
    "uo.ozet.canliKontrol": "Framework controls with live evidence",
    "uo.ozet.elleGereken": "Requiring manual evidence",
    "uo.izleme.aktif": "Continuous monitoring active",
    "uo.izleme.sonTarama": "· Last scan {goreli} ({tam})",
    "uo.izleme.taraniyor": "Scanning…",
    "uo.izleme.yenidenTara": "Re-scan",
    "uo.izleme.paketTxt": "Evidence package (.txt)",
    "uo.izleme.paketJson": "Evidence package (.json)",
    "uo.pano.otomatikKanitli": "{otomatik}/{toplam} controls auto-evidenced",
    "uo.gorsel.kapsamBaslik": "Automation coverage",
    "uo.gorsel.kapsamAlt": "Share of auto-verified collectors",
    "uo.gorsel.dagilimBaslik": "Evidence collection status",
    "uo.gorsel.otomatik": "Automated",
    "uo.gorsel.elle": "Manual",
    "uo.gorsel.cerceveBaslik": "Framework evidence density",
    "uo.gorsel.cerceveAlt": "Auto-evidenced controls per framework",
    "uo.gorsel.toplayici": "collectors",
    "uo.list.baslik": "Evidence collectors",
    "uo.list.filtre.hepsi": "All ({n})",
    "uo.list.filtre.otomatik": "Automated ({n})",
    "uo.list.filtre.elle": "Manual ({n})",
    "uo.list.bos": "No collector matches this filter.",
    "uo.satir.dogrulandi": "Auto-verified",
    "uo.satir.elleGerekli": "Manual evidence required",
    "uo.satir.kanitIzi": "Evidence trail",
    "uo.satir.sonKontrol": "Last check: {tam}",
    "uo.toast.tarandiBaslik": "Evidence re-scanned",
    "uo.toast.tarandiAcik": "Collectors updated from live system state.",
    "uo.toast.indirildiTxt": "Evidence package downloaded (.txt)",
    "uo.toast.indirildiJson": "Evidence package downloaded (.json)",
    "uo.zaman.azOnce": "just now",
    "uo.zaman.dk": "{n} min ago",
    "uo.zaman.sa": "{n} h ago",
    "uo.zaman.g": "{n} d ago",
    "uo.dust.metin":
      "Automated evidence is collected from the <b>real state</b> of the running system and speeds up audit preparation; however it <b>does not replace</b> a formal audit. An independent auditor process is still required. This console complements the static <b>Compliance &amp; Certs</b> page with live verification.",
  },

  de: {
    "uo.baslik": "Compliance-Nachweis-Automatisierung",
    "uo.intro.baslik": "Nachweise sammeln sich selbst — kein statischer Text, sondern der Live-Systemzustand.",
    "uo.intro.metin":
      "Kollektoren lesen laufend Teamrollen, die Audit-Kette, API-Schlüssel-Scopes, 2FA, den Vorfall-Lebenszyklus und mehr und bestätigen, dass jede Kontrolle besteht. Lade das auditbereite Nachweispaket mit einem Klick herunter.",
    "uo.ozet.kapsam": "Automatisierte Nachweisabdeckung",
    "uo.ozet.dogrulanan": "Automatisch verifizierte Kollektoren",
    "uo.ozet.canliKontrol": "Framework-Kontrollen mit Live-Nachweis",
    "uo.ozet.elleGereken": "Manueller Nachweis erforderlich",
    "uo.izleme.aktif": "Kontinuierliche Überwachung aktiv",
    "uo.izleme.sonTarama": "· Letzter Scan {goreli} ({tam})",
    "uo.izleme.taraniyor": "Scannen…",
    "uo.izleme.yenidenTara": "Erneut scannen",
    "uo.izleme.paketTxt": "Nachweispaket (.txt)",
    "uo.izleme.paketJson": "Nachweispaket (.json)",
    "uo.pano.otomatikKanitli": "{otomatik}/{toplam} Kontrollen automatisch belegt",
    "uo.gorsel.kapsamBaslik": "Automatisierungsabdeckung",
    "uo.gorsel.kapsamAlt": "Anteil automatisch verifizierter Sammler",
    "uo.gorsel.dagilimBaslik": "Status der Nachweiserfassung",
    "uo.gorsel.otomatik": "Automatisch",
    "uo.gorsel.elle": "Manuell",
    "uo.gorsel.cerceveBaslik": "Nachweisdichte je Rahmenwerk",
    "uo.gorsel.cerceveAlt": "Automatisch belegte Kontrollen je Rahmenwerk",
    "uo.gorsel.toplayici": "Sammler",
    "uo.list.baslik": "Nachweis-Kollektoren",
    "uo.list.filtre.hepsi": "Alle ({n})",
    "uo.list.filtre.otomatik": "Automatisch ({n})",
    "uo.list.filtre.elle": "Manuell ({n})",
    "uo.list.bos": "Kein Kollektor passt zu diesem Filter.",
    "uo.satir.dogrulandi": "Automatisch verifiziert",
    "uo.satir.elleGerekli": "Manueller Nachweis erforderlich",
    "uo.satir.kanitIzi": "Nachweisspur",
    "uo.satir.sonKontrol": "Letzte Prüfung: {tam}",
    "uo.toast.tarandiBaslik": "Nachweise erneut gescannt",
    "uo.toast.tarandiAcik": "Kollektoren aus dem Live-Systemzustand aktualisiert.",
    "uo.toast.indirildiTxt": "Nachweispaket heruntergeladen (.txt)",
    "uo.toast.indirildiJson": "Nachweispaket heruntergeladen (.json)",
    "uo.zaman.azOnce": "gerade eben",
    "uo.zaman.dk": "vor {n} Min.",
    "uo.zaman.sa": "vor {n} Std.",
    "uo.zaman.g": "vor {n} T.",
    "uo.dust.metin":
      "Automatisierte Nachweise werden aus dem <b>realen Zustand</b> des laufenden Systems gesammelt und beschleunigen die Audit-Vorbereitung; sie <b>ersetzen jedoch kein</b> formelles Audit. Ein unabhängiger Auditprozess ist weiterhin erforderlich. Diese Konsole ergänzt die statische Seite <b>Compliance &amp; Zertifikate</b> um eine Live-Verifizierung.",
  },

  fr: {
    "uo.baslik": "Automatisation des preuves de conformité",
    "uo.intro.baslik": "Les preuves se collectent seules — pas du texte statique, l'état système en direct.",
    "uo.intro.metin":
      "Les collecteurs lisent en continu les rôles d'équipe, la chaîne d'audit, les portées des clés API, le 2FA, le cycle de vie des incidents et plus encore, vérifiant que chaque contrôle est satisfait. Téléchargez le dossier de preuves prêt pour l'auditeur en un clic.",
    "uo.ozet.kapsam": "Couverture des preuves automatisées",
    "uo.ozet.dogrulanan": "Collecteurs vérifiés automatiquement",
    "uo.ozet.canliKontrol": "Contrôles de cadre avec preuve en direct",
    "uo.ozet.elleGereken": "Preuve manuelle requise",
    "uo.izleme.aktif": "Surveillance continue active",
    "uo.izleme.sonTarama": "· Dernier scan {goreli} ({tam})",
    "uo.izleme.taraniyor": "Analyse…",
    "uo.izleme.yenidenTara": "Relancer le scan",
    "uo.izleme.paketTxt": "Dossier de preuves (.txt)",
    "uo.izleme.paketJson": "Dossier de preuves (.json)",
    "uo.pano.otomatikKanitli": "{otomatik}/{toplam} contrôles prouvés automatiquement",
    "uo.gorsel.kapsamBaslik": "Couverture d'automatisation",
    "uo.gorsel.kapsamAlt": "Part des collecteurs vérifiés automatiquement",
    "uo.gorsel.dagilimBaslik": "Statut de collecte des preuves",
    "uo.gorsel.otomatik": "Automatique",
    "uo.gorsel.elle": "Manuel",
    "uo.gorsel.cerceveBaslik": "Densité de preuves par cadre",
    "uo.gorsel.cerceveAlt": "Contrôles auto-prouvés par cadre",
    "uo.gorsel.toplayici": "collecteurs",
    "uo.list.baslik": "Collecteurs de preuves",
    "uo.list.filtre.hepsi": "Tous ({n})",
    "uo.list.filtre.otomatik": "Automatiques ({n})",
    "uo.list.filtre.elle": "Manuels ({n})",
    "uo.list.bos": "Aucun collecteur ne correspond à ce filtre.",
    "uo.satir.dogrulandi": "Vérifié automatiquement",
    "uo.satir.elleGerekli": "Preuve manuelle requise",
    "uo.satir.kanitIzi": "Piste de preuve",
    "uo.satir.sonKontrol": "Dernière vérification : {tam}",
    "uo.toast.tarandiBaslik": "Preuves ré-analysées",
    "uo.toast.tarandiAcik": "Collecteurs mis à jour depuis l'état système en direct.",
    "uo.toast.indirildiTxt": "Dossier de preuves téléchargé (.txt)",
    "uo.toast.indirildiJson": "Dossier de preuves téléchargé (.json)",
    "uo.zaman.azOnce": "à l'instant",
    "uo.zaman.dk": "il y a {n} min",
    "uo.zaman.sa": "il y a {n} h",
    "uo.zaman.g": "il y a {n} j",
    "uo.dust.metin":
      "Les preuves automatisées sont collectées à partir de l'<b>état réel</b> du système en fonctionnement et accélèrent la préparation de l'audit ; elles <b>ne remplacent toutefois pas</b> un audit formel. Un processus d'auditeur indépendant reste nécessaire. Cette console complète la page statique <b>Conformité &amp; certifs</b> par une vérification en direct.",
  },

  es: {
    "uo.baslik": "Automatización de evidencias de cumplimiento",
    "uo.intro.baslik": "La evidencia se recopila sola — no es texto estático, es el estado del sistema en vivo.",
    "uo.intro.metin":
      "Los recopiladores leen de forma continua los roles del equipo, la cadena de auditoría, los ámbitos de las claves API, el 2FA, el ciclo de vida de incidentes y más, verificando que cada control se cumple. Descarga el paquete de evidencias listo para el auditor con un clic.",
    "uo.ozet.kapsam": "Cobertura de evidencia automatizada",
    "uo.ozet.dogrulanan": "Recopiladores verificados automáticamente",
    "uo.ozet.canliKontrol": "Controles de marco con evidencia en vivo",
    "uo.ozet.elleGereken": "Requieren evidencia manual",
    "uo.izleme.aktif": "Monitorización continua activa",
    "uo.izleme.sonTarama": "· Último escaneo {goreli} ({tam})",
    "uo.izleme.taraniyor": "Escaneando…",
    "uo.izleme.yenidenTara": "Reescanear",
    "uo.izleme.paketTxt": "Paquete de evidencias (.txt)",
    "uo.izleme.paketJson": "Paquete de evidencias (.json)",
    "uo.pano.otomatikKanitli": "{otomatik}/{toplam} controles con evidencia automática",
    "uo.gorsel.kapsamBaslik": "Cobertura de automatización",
    "uo.gorsel.kapsamAlt": "Proporción de colectores verificados automáticamente",
    "uo.gorsel.dagilimBaslik": "Estado de recopilación de evidencia",
    "uo.gorsel.otomatik": "Automático",
    "uo.gorsel.elle": "Manual",
    "uo.gorsel.cerceveBaslik": "Densidad de evidencia por marco",
    "uo.gorsel.cerceveAlt": "Controles con evidencia automática por marco",
    "uo.gorsel.toplayici": "colectores",
    "uo.list.baslik": "Recopiladores de evidencias",
    "uo.list.filtre.hepsi": "Todos ({n})",
    "uo.list.filtre.otomatik": "Automáticos ({n})",
    "uo.list.filtre.elle": "Manuales ({n})",
    "uo.list.bos": "Ningún recopilador coincide con este filtro.",
    "uo.satir.dogrulandi": "Verificado automáticamente",
    "uo.satir.elleGerekli": "Se requiere evidencia manual",
    "uo.satir.kanitIzi": "Rastro de evidencia",
    "uo.satir.sonKontrol": "Última comprobación: {tam}",
    "uo.toast.tarandiBaslik": "Evidencia reescaneada",
    "uo.toast.tarandiAcik": "Recopiladores actualizados desde el estado del sistema en vivo.",
    "uo.toast.indirildiTxt": "Paquete de evidencias descargado (.txt)",
    "uo.toast.indirildiJson": "Paquete de evidencias descargado (.json)",
    "uo.zaman.azOnce": "ahora mismo",
    "uo.zaman.dk": "hace {n} min",
    "uo.zaman.sa": "hace {n} h",
    "uo.zaman.g": "hace {n} d",
    "uo.dust.metin":
      "La evidencia automatizada se recopila del <b>estado real</b> del sistema en funcionamiento y acelera la preparación de la auditoría; sin embargo, <b>no sustituye</b> a una auditoría formal. Sigue siendo necesario un proceso de auditor independiente. Esta consola complementa la página estática <b>Cumplimiento &amp; certs</b> con verificación en vivo.",
  },
};

/** Bu modülün çeviri yardımcısı: anahtar yoksa TR'ye, o da yoksa anahtara düşer. */
export function uoCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
