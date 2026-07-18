import type { Dil } from "@/lib/i18n/panel";

/**
 * Uyum & Sertifika sayfasına özel i18n sözlüğü (yalnızca bu modül kullanır).
 * "uy." namespace'li anahtarlar. Doğal/native çeviriler.
 *
 * NOT: Çerçeve adları (SOC 2, ISO 27001, KVKK, GDPR) ve kontrol kimlikleri
 * (CC6.1, A.5.15, M.12, Art.32 …) özel ad/veridir — çevrilmez. cerceve.ts'teki
 * kontrol adı/açıklaması/kanıtı/kategorisi de veri olarak TR kalır; burada
 * yalnızca UI çerçevesi (başlıklar, skor metinleri, durum etiketleri, düğmeler)
 * çevrilir. Durum etiketleri enum→i18n anahtarı eşlemesiyle çözülür.
 * TR kaynak/otorite; anahtar bulunamazsa TR'ye, o da yoksa anahtarın kendisine düşer.
 */
const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // --- durum etiketleri (KontrolDurum enum → etiket) ---
    "uy.durum.tamam": "Karşılandı",
    "uy.durum.kismi": "Kısmi",
    "uy.durum.eksik": "Eksik",
    "uy.durum.gecerli-degil": "N/A",
    // --- üst bilgi şeridi ---
    "uy.intro.baslik": "Denetim hazırlığını tek yerden izle.",
    "uy.intro.metin":
      "Veylify'ın SOC 2, ISO 27001, KVKK ve GDPR kontrollerini nasıl karşıladığını gör, kanıt raporlarını indir. Denetime hazırlığını hızlandır.",
    // --- özet kartları ---
    "uy.ozet.genelSkor": "Genel hazırlık skoru",
    "uy.ozet.cerceve": "Uyum çerçevesi",
    "uy.ozet.karsilanan": "Karşılanan kontrol",
    "uy.ozet.hazirAlan": "Denetime hazır alan",
    // --- görsel panolar ---
    "uy.gorsel.skorPano": "Çerçeve hazırlık göstergeleri",
    "uy.gorsel.skorPanoAlt": "Her uyum çerçevesinin öz-değerlendirme hazırlık skoru",
    "uy.gorsel.dagilim": "Kontrol durumu dağılımı",
    "uy.gorsel.radar": "{cerceve} kategori kapsamı",
    "uy.gorsel.radarAlt": "Kontrol kategorisi başına hazırlık yoğunluğu",
    "uy.gorsel.karsilandi": "Karşılandı",
    "uy.gorsel.kismi": "Kısmi",
    "uy.gorsel.eksik": "Eksik",
    "uy.gorsel.kontrol": "kontrol",
    "uy.gorsel.matris": "Çerçeve × durum matrisi",
    "uy.gorsel.matrisAlt": "Her çerçevede karşılanan/kısmi/eksik kontrol yoğunluğu",
    // --- seçili çerçeve detayı ---
    "uy.detay.kontroller": "{cerceve} kontrolleri",
    "uy.detay.kanitRaporu": "Kanıt raporu",
    "uy.detay.hazirlikSkoru": "Hazırlık skoru",
    "uy.detay.ozet": "{tamam} karşılandı · {kismi} kısmi · {toplam} toplam kontrol",
    // --- kanıt raporu (indirilen .txt) ---
    "uy.rapor.baslik": "{cerceve} UYUM KANIT RAPORU",
    "uy.rapor.skor": "Hazırlık skoru: %{skor}  ({tamam}/{toplam} kontrol karşılandı)",
    "uy.rapor.kanit": "Kanıt",
    "uy.rapor.dipnot":
      "Bu bir öz-değerlendirme raporudur. Resmi denetim ayrı bir süreçtir.",
    "uy.rapor.indirildi": "Kanıt raporu indirildi",
    // --- alt not ---
    "uy.not":
      "Bu modül bir <b>öz-değerlendirme</b> ve hazırlık aracıdır. Resmi SOC 2 / ISO 27001 sertifikasyonu bağımsız bir denetçi tarafından yürütülen ayrı bir süreçtir; Veylify bu süreç için gereken kanıt ve kontrolleri sağlar.",
  },
  en: {
    "uy.durum.tamam": "Met",
    "uy.durum.kismi": "Partial",
    "uy.durum.eksik": "Missing",
    "uy.durum.gecerli-degil": "N/A",
    "uy.intro.baslik": "Track audit readiness in one place.",
    "uy.intro.metin":
      "See how Veylify meets SOC 2, ISO 27001, KVKK and GDPR controls, and download evidence reports. Accelerate your audit readiness.",
    "uy.ozet.genelSkor": "Overall readiness score",
    "uy.ozet.cerceve": "Compliance frameworks",
    "uy.ozet.karsilanan": "Controls met",
    "uy.ozet.hazirAlan": "Audit-ready areas",
    "uy.gorsel.skorPano": "Framework readiness gauges",
    "uy.gorsel.skorPanoAlt": "Self-assessment readiness score per compliance framework",
    "uy.gorsel.dagilim": "Control status distribution",
    "uy.gorsel.radar": "{cerceve} category coverage",
    "uy.gorsel.radarAlt": "Readiness intensity per control category",
    "uy.gorsel.karsilandi": "Met",
    "uy.gorsel.kismi": "Partial",
    "uy.gorsel.eksik": "Missing",
    "uy.gorsel.kontrol": "controls",
    "uy.gorsel.matris": "Framework × status matrix",
    "uy.gorsel.matrisAlt": "Met/partial/missing control density per framework",
    "uy.detay.kontroller": "{cerceve} controls",
    "uy.detay.kanitRaporu": "Evidence report",
    "uy.detay.hazirlikSkoru": "Readiness score",
    "uy.detay.ozet": "{tamam} met · {kismi} partial · {toplam} total controls",
    "uy.rapor.baslik": "{cerceve} COMPLIANCE EVIDENCE REPORT",
    "uy.rapor.skor": "Readiness score: {skor}%  ({tamam}/{toplam} controls met)",
    "uy.rapor.kanit": "Evidence",
    "uy.rapor.dipnot":
      "This is a self-assessment report. A formal audit is a separate process.",
    "uy.rapor.indirildi": "Evidence report downloaded",
    "uy.not":
      "This module is a <b>self-assessment</b> and readiness tool. Formal SOC 2 / ISO 27001 certification is a separate process conducted by an independent auditor; Veylify provides the evidence and controls required for that process.",
  },
  de: {
    "uy.durum.tamam": "Erfüllt",
    "uy.durum.kismi": "Teilweise",
    "uy.durum.eksik": "Fehlend",
    "uy.durum.gecerli-degil": "N/V",
    "uy.intro.baslik": "Audit-Bereitschaft an einem Ort verfolgen.",
    "uy.intro.metin":
      "Sehen Sie, wie Veylify die Kontrollen von SOC 2, ISO 27001, KVKK und GDPR erfüllt, und laden Sie Nachweisberichte herunter. Beschleunigen Sie Ihre Audit-Bereitschaft.",
    "uy.ozet.genelSkor": "Gesamt-Bereitschaftsscore",
    "uy.ozet.cerceve": "Compliance-Rahmenwerke",
    "uy.ozet.karsilanan": "Erfüllte Kontrollen",
    "uy.ozet.hazirAlan": "Audit-bereite Bereiche",
    "uy.gorsel.skorPano": "Bereitschaftsanzeigen der Rahmenwerke",
    "uy.gorsel.skorPanoAlt": "Selbstbewertungs-Bereitschaftsscore je Rahmenwerk",
    "uy.gorsel.dagilim": "Verteilung des Kontrollstatus",
    "uy.gorsel.radar": "{cerceve} Kategorieabdeckung",
    "uy.gorsel.radarAlt": "Bereitschaftsdichte je Kontrollkategorie",
    "uy.gorsel.karsilandi": "Erfüllt",
    "uy.gorsel.kismi": "Teilweise",
    "uy.gorsel.eksik": "Fehlend",
    "uy.gorsel.kontrol": "Kontrollen",
    "uy.gorsel.matris": "Rahmenwerk × Status-Matrix",
    "uy.gorsel.matrisAlt": "Dichte erfüllter/teilweiser/fehlender Kontrollen je Rahmenwerk",
    "uy.detay.kontroller": "{cerceve}-Kontrollen",
    "uy.detay.kanitRaporu": "Nachweisbericht",
    "uy.detay.hazirlikSkoru": "Bereitschaftsscore",
    "uy.detay.ozet": "{tamam} erfüllt · {kismi} teilweise · {toplam} Kontrollen gesamt",
    "uy.rapor.baslik": "{cerceve} COMPLIANCE-NACHWEISBERICHT",
    "uy.rapor.skor": "Bereitschaftsscore: {skor}%  ({tamam}/{toplam} Kontrollen erfüllt)",
    "uy.rapor.kanit": "Nachweis",
    "uy.rapor.dipnot":
      "Dies ist ein Selbstbewertungsbericht. Ein formelles Audit ist ein separater Prozess.",
    "uy.rapor.indirildi": "Nachweisbericht heruntergeladen",
    "uy.not":
      "Dieses Modul ist ein <b>Selbstbewertungs-</b> und Bereitschaftswerkzeug. Die formelle SOC 2- / ISO 27001-Zertifizierung ist ein separater Prozess, der von einem unabhängigen Prüfer durchgeführt wird; Veylify stellt die dafür erforderlichen Nachweise und Kontrollen bereit.",
  },
  fr: {
    "uy.durum.tamam": "Satisfait",
    "uy.durum.kismi": "Partiel",
    "uy.durum.eksik": "Manquant",
    "uy.durum.gecerli-degil": "N/A",
    "uy.intro.baslik": "Suivez la préparation à l'audit en un seul endroit.",
    "uy.intro.metin":
      "Découvrez comment Veylify satisfait aux contrôles SOC 2, ISO 27001, KVKK et GDPR, et téléchargez les rapports de preuves. Accélérez votre préparation à l'audit.",
    "uy.ozet.genelSkor": "Score de préparation global",
    "uy.ozet.cerceve": "Cadres de conformité",
    "uy.ozet.karsilanan": "Contrôles satisfaits",
    "uy.ozet.hazirAlan": "Domaines prêts pour l'audit",
    "uy.gorsel.skorPano": "Jauges de préparation des cadres",
    "uy.gorsel.skorPanoAlt": "Score de préparation en auto-évaluation par cadre",
    "uy.gorsel.dagilim": "Répartition des statuts de contrôle",
    "uy.gorsel.radar": "Couverture par catégorie {cerceve}",
    "uy.gorsel.radarAlt": "Intensité de préparation par catégorie de contrôle",
    "uy.gorsel.karsilandi": "Satisfaits",
    "uy.gorsel.kismi": "Partiels",
    "uy.gorsel.eksik": "Manquants",
    "uy.gorsel.kontrol": "contrôles",
    "uy.gorsel.matris": "Matrice cadre × statut",
    "uy.gorsel.matrisAlt": "Densité des contrôles satisfaits/partiels/manquants par cadre",
    "uy.detay.kontroller": "Contrôles {cerceve}",
    "uy.detay.kanitRaporu": "Rapport de preuves",
    "uy.detay.hazirlikSkoru": "Score de préparation",
    "uy.detay.ozet": "{tamam} satisfaits · {kismi} partiels · {toplam} contrôles au total",
    "uy.rapor.baslik": "RAPPORT DE PREUVES DE CONFORMITÉ {cerceve}",
    "uy.rapor.skor": "Score de préparation : {skor}%  ({tamam}/{toplam} contrôles satisfaits)",
    "uy.rapor.kanit": "Preuve",
    "uy.rapor.dipnot":
      "Ceci est un rapport d'auto-évaluation. Un audit formel est un processus distinct.",
    "uy.rapor.indirildi": "Rapport de preuves téléchargé",
    "uy.not":
      "Ce module est un outil d'<b>auto-évaluation</b> et de préparation. La certification formelle SOC 2 / ISO 27001 est un processus distinct mené par un auditeur indépendant ; Veylify fournit les preuves et les contrôles requis pour ce processus.",
  },
  es: {
    "uy.durum.tamam": "Cumplido",
    "uy.durum.kismi": "Parcial",
    "uy.durum.eksik": "Faltante",
    "uy.durum.gecerli-degil": "N/D",
    "uy.intro.baslik": "Sigue la preparación para auditorías en un solo lugar.",
    "uy.intro.metin":
      "Descubre cómo Veylify cumple los controles de SOC 2, ISO 27001, KVKK y GDPR, y descarga los informes de evidencia. Acelera tu preparación para la auditoría.",
    "uy.ozet.genelSkor": "Puntuación de preparación global",
    "uy.ozet.cerceve": "Marcos de cumplimiento",
    "uy.ozet.karsilanan": "Controles cumplidos",
    "uy.ozet.hazirAlan": "Áreas listas para auditoría",
    "uy.gorsel.skorPano": "Indicadores de preparación por marco",
    "uy.gorsel.skorPanoAlt": "Puntuación de preparación de autoevaluación por marco",
    "uy.gorsel.dagilim": "Distribución del estado de los controles",
    "uy.gorsel.radar": "Cobertura por categoría de {cerceve}",
    "uy.gorsel.radarAlt": "Intensidad de preparación por categoría de control",
    "uy.gorsel.karsilandi": "Cumplidos",
    "uy.gorsel.kismi": "Parciales",
    "uy.gorsel.eksik": "Faltantes",
    "uy.gorsel.kontrol": "controles",
    "uy.gorsel.matris": "Matriz marco × estado",
    "uy.gorsel.matrisAlt": "Densidad de controles cumplidos/parciales/faltantes por marco",
    "uy.detay.kontroller": "Controles de {cerceve}",
    "uy.detay.kanitRaporu": "Informe de evidencia",
    "uy.detay.hazirlikSkoru": "Puntuación de preparación",
    "uy.detay.ozet": "{tamam} cumplidos · {kismi} parciales · {toplam} controles en total",
    "uy.rapor.baslik": "INFORME DE EVIDENCIA DE CUMPLIMIENTO {cerceve}",
    "uy.rapor.skor": "Puntuación de preparación: {skor}%  ({tamam}/{toplam} controles cumplidos)",
    "uy.rapor.kanit": "Evidencia",
    "uy.rapor.dipnot":
      "Este es un informe de autoevaluación. Una auditoría formal es un proceso independiente.",
    "uy.rapor.indirildi": "Informe de evidencia descargado",
    "uy.not":
      "Este módulo es una herramienta de <b>autoevaluación</b> y preparación. La certificación formal SOC 2 / ISO 27001 es un proceso independiente realizado por un auditor externo; Veylify proporciona la evidencia y los controles necesarios para ese proceso.",
  },
};

export function uyumCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
