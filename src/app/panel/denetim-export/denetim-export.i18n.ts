import type { Dil } from "@/lib/i18n/panel";

/**
 * Denetim Dışa-Aktarım (SIEM) sayfasına özel i18n sözlüğü (yalnızca bu modül kullanır).
 * "de." namespace'li anahtarlar. Doğal/native çeviriler; veri (seq no, hash,
 * biçim adları NDJSON/CEF/JSON, örnek çıktı içeriği, alan adları, kategori enum
 * değeri) çevrilmez — yalnızca görüntü etiketleri çevrilir.
 *
 * TR kaynak/otorite; anahtar bulunamazsa TR'ye, o da yoksa anahtarın kendisine düşer.
 * Enterpolasyon: `.replace("{n}", ...)` ile yapılır.
 */

/** Dil → BCP-47 yerel etiketi (sayı/tarih biçimlendirme için). */
export const YEREL: Record<Dil, string> = {
  tr: "tr-TR",
  en: "en-US",
  de: "de-DE",
  fr: "fr-FR",
  es: "es-ES",
};

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // Başlık
    "de.baslik": "Denetim Dışa-Aktarım & Bütünlük",
    "de.kirintiSiem": "SIEM Dışa-Aktarım",

    // Tanıtım şeridi
    "de.tanitimBaslik": "Denetim defterini SIEM'ine aktar, bütünlüğünü kanıtla.",
    "de.tanitimMetin":
      "Hash-zincirli denetim günlüğünü NDJSON, CEF veya JSON olarak indir; her indirmeden önce zincirin kurcalanmadığını (tamper-evidence) burada doğrula.",

    // Zincir bütünlüğü kanıtı
    "de.zincirDogrulandi": "Zincir bütünlüğü DOĞRULANDI ✓",
    "de.zincirBozuldu": "Zincir bütünlüğü BOZULDU ✕",
    "de.wormRozet": "WORM — kurcalanmamış",
    "de.kirilmaRozet": "{n} kırılma",
    "de.saglamMetin":
      "Her kaydın önceki-hash bağlantısı ve sıra sürekliliği tutarlı. Silme, yeniden sıralama veya araya kayıt sokma tespit edilmedi.",
    "de.bozukMetin":
      "Zincir bağlantısı veya sıra sürekliliği bozuk. Aşağıdaki kırılma noktaları olası bir kurcalamaya işaret eder.",
    "de.kayitKontrol": "kayıt kontrol edildi",
    "de.seqAraligi": "seq aralığı",
    "de.genesisSon": "genesis → son zincir",

    // Kırılma noktaları
    "de.kirilmaNoktalari": "Kırılma noktaları",
    // Kırılma sebepleri (lib TR metninden yeniden türetilir; veri {p}/{s}/{a}/{b}/{n}/{h} çevrilmez)
    "de.sebep.genesis": 'İlk kayıt genesis değil: prevHash "{p}" beklenirken "genesis".',
    "de.sebep.yinelenen": "Yinelenen sıra numarası: seq {s} birden çok kez var.",
    "de.sebep.bosluk": "Sıra boşluğu: seq {a} ile {b} arasında {n} kayıt eksik (olası silme).",
    "de.sebep.duzensiz": "Sıra düzensiz: seq {s}, önceki seq {p}'den küçük/eşit.",
    "de.sebep.kopuk": 'Zincir kopuk: prevHash "{p}" ≠ önceki kaydın hash\'i "{h}".',

    // Doğrulama yöntemi notu (dürüst not)
    "de.yontemBaslik": "Doğrulama yöntemi:",
    "de.yontemMetin1": "zincirin",
    "de.yontemBaglanti": "bağlantısı",
    "de.yontemMetin2": "(her kaydın",
    "de.yontemMetin3": "'i = önceki kaydın",
    "de.yontemMetin4": "'i) ve",
    "de.yontemSira": "sıra sürekliliği",
    "de.yontemMetin5": "(boşluksuz artan",
    "de.yontemMetin6":
      ") kontrol edilir. SHA-256 içerik hash'i defter yazımında üretilir; bu doğrulama onu yeniden hesaplamaz, bağlantı bütünlüğünü kanıtlar.",

    // Özet istatistikler
    "de.stat.toplam": "Toplam kayıt",
    "de.stat.kritik": "Kritik işlem",
    "de.stat.aktor": "Farklı aktör",
    "de.stat.kategori": "Kategori",

    // Kategori dağılımı
    "de.kategoriDagilim": "Kategori dağılımı",
    "de.henuzKayitYok": "Henüz denetim kaydı yok.",

    // Kategori etiketleri (enum anahtarı → insan-okur etiket)
    "de.kat.auth": "Kimlik",
    "de.kat.site": "Site",
    "de.kat.rule": "Kural",
    "de.kat.team": "Ekip",
    "de.kat.ai-policy": "AI Politikası",
    "de.kat.billing": "Faturalandırma",
    "de.kat.token": "API Anahtarı",
    "de.kat.webhook": "Webhook",

    // Zaman aralığı
    "de.zamanAraligi": "Zaman aralığı",
    "de.ilkKayit": "İlk kayıt",
    "de.sonKayit": "Son kayıt",

    // En etkin aktörler
    "de.enEtkinAktor": "En etkin aktörler",
    "de.aktorYok": "Aktör yok.",

    // Dışa-aktarım biçimleri
    "de.siemBaslik": "SIEM dışa-aktarım biçimleri",
    "de.onizlemeBaslik": "Önizleme (ilk satırlar)",
    "de.onizlemeYok": "Kayıt olmadığından önizleme yok.",
    "de.indir": "{ad} indir",
    "de.ornekDosya": "örnek.{uzanti}",

    // Biçim hedef & açıklamaları (biçim adı NDJSON/CEF/JSON çevrilmez)
    "de.bicim.ndjson.hedef": "Splunk · Elastic",
    "de.bicim.ndjson.aciklama":
      "Satır başına bir JSON olayı (Newline-Delimited JSON). Splunk HEC ve Elastic/Filebeat gibi log-ingest hatlarının doğrudan sindirdiği biçim.",
    "de.bicim.cef.hedef": "ArcSight · QRadar",
    "de.bicim.cef.aciklama":
      "ArcSight Common Event Format satırları (CEF:0|Veylify|AuditLog|…). act/suser/src/cs1 alanlarına eşlenir; QRadar da bu biçimi ayrıştırır.",
    "de.bicim.json.hedef": "Genel · Arşiv",
    "de.bicim.json.aciklama":
      "Girintili tek bir JSON dizisi. Genel amaçlı içe/dışa aktarım, elle inceleme veya uzun-dönem arşiv için.",

    // Toast
    "de.toast.baslik": "{ad} indiriliyor",
    "de.toast.aciklama": "SIEM dışa-aktarım hazırlanıyor.",

    // Dürüst not (pull vs push)
    "de.durustNot":
      "Bu modül {b0}çekme/indirme (pull){b1} tabanlı dışa-aktarım sunar: denetim defterini seçtiğin biçimde indirir, SIEM'ine elle ya da bir toplama işiyle yüklersin. {b2}Canlı akış (push/streaming){b3} — HEC uç noktasına ya da syslog'a gerçek zamanlı gönderim — planlanan bir sonraki adımdır.",
  },
  en: {
    "de.baslik": "Audit Export & Integrity",
    "de.kirintiSiem": "SIEM Export",

    "de.tanitimBaslik": "Export your audit ledger to your SIEM, prove its integrity.",
    "de.tanitimMetin":
      "Download the hash-chained audit log as NDJSON, CEF or JSON; verify here that the chain has not been tampered with (tamper-evidence) before each download.",

    "de.zincirDogrulandi": "Chain integrity VERIFIED ✓",
    "de.zincirBozuldu": "Chain integrity BROKEN ✕",
    "de.wormRozet": "WORM — untampered",
    "de.kirilmaRozet": "{n} breaks",
    "de.saglamMetin":
      "Every record's previous-hash link and sequence continuity are consistent. No deletion, reordering or record insertion was detected.",
    "de.bozukMetin":
      "The chain link or sequence continuity is broken. The break points below indicate possible tampering.",
    "de.kayitKontrol": "records checked",
    "de.seqAraligi": "seq range",
    "de.genesisSon": "genesis → last chain",

    "de.kirilmaNoktalari": "Break points",
    "de.sebep.genesis": 'First record is not genesis: prevHash "{p}" expected, got "genesis".',
    "de.sebep.yinelenen": "Duplicate sequence number: seq {s} appears more than once.",
    "de.sebep.bosluk": "Sequence gap: {n} records missing between seq {a} and {b} (possible deletion).",
    "de.sebep.duzensiz": "Sequence disorder: seq {s} is less than/equal to previous seq {p}.",
    "de.sebep.kopuk": 'Chain broken: prevHash "{p}" ≠ previous record\'s hash "{h}".',

    "de.yontemBaslik": "Verification method:",
    "de.yontemMetin1": "the chain's",
    "de.yontemBaglanti": "link",
    "de.yontemMetin2": "(each record's",
    "de.yontemMetin3": " = the previous record's",
    "de.yontemMetin4": ") and",
    "de.yontemSira": "sequence continuity",
    "de.yontemMetin5": "(gap-free increasing",
    "de.yontemMetin6":
      ") are checked. The SHA-256 content hash is produced when the ledger is written; this verification does not recompute it — it proves link integrity.",

    "de.stat.toplam": "Total records",
    "de.stat.kritik": "Critical actions",
    "de.stat.aktor": "Distinct actors",
    "de.stat.kategori": "Categories",

    "de.kategoriDagilim": "Category distribution",
    "de.henuzKayitYok": "No audit records yet.",

    "de.kat.auth": "Identity",
    "de.kat.site": "Site",
    "de.kat.rule": "Rule",
    "de.kat.team": "Team",
    "de.kat.ai-policy": "AI Policy",
    "de.kat.billing": "Billing",
    "de.kat.token": "API Key",
    "de.kat.webhook": "Webhook",

    "de.zamanAraligi": "Time range",
    "de.ilkKayit": "First record",
    "de.sonKayit": "Last record",

    "de.enEtkinAktor": "Most active actors",
    "de.aktorYok": "No actors.",

    "de.siemBaslik": "SIEM export formats",
    "de.onizlemeBaslik": "Preview (first lines)",
    "de.onizlemeYok": "No preview because there are no records.",
    "de.indir": "Download {ad}",
    "de.ornekDosya": "sample.{uzanti}",

    "de.bicim.ndjson.hedef": "Splunk · Elastic",
    "de.bicim.ndjson.aciklama":
      "One JSON event per line (Newline-Delimited JSON). The format directly ingested by log pipelines such as Splunk HEC and Elastic/Filebeat.",
    "de.bicim.cef.hedef": "ArcSight · QRadar",
    "de.bicim.cef.aciklama":
      "ArcSight Common Event Format lines (CEF:0|Veylify|AuditLog|…). Mapped to the act/suser/src/cs1 fields; QRadar parses this format too.",
    "de.bicim.json.hedef": "General · Archive",
    "de.bicim.json.aciklama":
      "A single indented JSON array. For general-purpose import/export, manual review or long-term archiving.",

    "de.toast.baslik": "Downloading {ad}",
    "de.toast.aciklama": "Preparing SIEM export.",

    "de.durustNot":
      "This module provides {b0}pull-based (download){b1} export: it downloads the audit ledger in your chosen format, and you upload it to your SIEM manually or with an ingestion job. {b2}Live streaming (push){b3} — real-time delivery to a HEC endpoint or syslog — is the planned next step.",
  },
  de: {
    "de.baslik": "Audit-Export & Integrität",
    "de.kirintiSiem": "SIEM-Export",

    "de.tanitimBaslik": "Exportiere dein Audit-Ledger in dein SIEM und beweise seine Integrität.",
    "de.tanitimMetin":
      "Lade das hash-verkettete Audit-Log als NDJSON, CEF oder JSON herunter; überprüfe hier vor jedem Download, dass die Kette nicht manipuliert wurde (Manipulationsnachweis).",

    "de.zincirDogrulandi": "Kettenintegrität VERIFIZIERT ✓",
    "de.zincirBozuldu": "Kettenintegrität GEBROCHEN ✕",
    "de.wormRozet": "WORM — unmanipuliert",
    "de.kirilmaRozet": "{n} Brüche",
    "de.saglamMetin":
      "Die Vorgänger-Hash-Verknüpfung und die Sequenzkontinuität jedes Datensatzes sind konsistent. Kein Löschen, Umsortieren oder Einfügen von Datensätzen erkannt.",
    "de.bozukMetin":
      "Die Kettenverknüpfung oder die Sequenzkontinuität ist gebrochen. Die folgenden Bruchstellen deuten auf eine mögliche Manipulation hin.",
    "de.kayitKontrol": "Datensätze geprüft",
    "de.seqAraligi": "seq-Bereich",
    "de.genesisSon": "Genesis → letzte Kette",

    "de.kirilmaNoktalari": "Bruchstellen",
    "de.sebep.genesis": 'Erster Datensatz ist nicht Genesis: prevHash "{p}" erwartet, aber "genesis".',
    "de.sebep.yinelenen": "Doppelte Sequenznummer: seq {s} kommt mehrfach vor.",
    "de.sebep.bosluk": "Sequenzlücke: {n} Datensätze fehlen zwischen seq {a} und {b} (mögliche Löschung).",
    "de.sebep.duzensiz": "Sequenzunordnung: seq {s} ist kleiner/gleich der vorherigen seq {p}.",
    "de.sebep.kopuk": 'Kette unterbrochen: prevHash "{p}" ≠ Hash des vorherigen Datensatzes "{h}".',

    "de.yontemBaslik": "Verifizierungsmethode:",
    "de.yontemMetin1": "Die",
    "de.yontemBaglanti": "Verknüpfung",
    "de.yontemMetin2": "der Kette (der",
    "de.yontemMetin3": " jedes Datensatzes = der",
    "de.yontemMetin4": " des vorherigen Datensatzes) und die",
    "de.yontemSira": "Sequenzkontinuität",
    "de.yontemMetin5": "(lückenlos ansteigender",
    "de.yontemMetin6":
      ") werden geprüft. Der SHA-256-Inhalts-Hash wird beim Schreiben des Ledgers erzeugt; diese Verifizierung berechnet ihn nicht neu, sondern beweist die Verknüpfungsintegrität.",

    "de.stat.toplam": "Datensätze gesamt",
    "de.stat.kritik": "Kritische Aktionen",
    "de.stat.aktor": "Verschiedene Akteure",
    "de.stat.kategori": "Kategorien",

    "de.kategoriDagilim": "Kategorieverteilung",
    "de.henuzKayitYok": "Noch keine Audit-Datensätze.",

    "de.kat.auth": "Identität",
    "de.kat.site": "Site",
    "de.kat.rule": "Regel",
    "de.kat.team": "Team",
    "de.kat.ai-policy": "KI-Richtlinie",
    "de.kat.billing": "Abrechnung",
    "de.kat.token": "API-Schlüssel",
    "de.kat.webhook": "Webhook",

    "de.zamanAraligi": "Zeitbereich",
    "de.ilkKayit": "Erster Datensatz",
    "de.sonKayit": "Letzter Datensatz",

    "de.enEtkinAktor": "Aktivste Akteure",
    "de.aktorYok": "Keine Akteure.",

    "de.siemBaslik": "SIEM-Exportformate",
    "de.onizlemeBaslik": "Vorschau (erste Zeilen)",
    "de.onizlemeYok": "Keine Vorschau, da keine Datensätze vorhanden sind.",
    "de.indir": "{ad} herunterladen",
    "de.ornekDosya": "beispiel.{uzanti}",

    "de.bicim.ndjson.hedef": "Splunk · Elastic",
    "de.bicim.ndjson.aciklama":
      "Ein JSON-Ereignis pro Zeile (Newline-Delimited JSON). Das Format, das Log-Pipelines wie Splunk HEC und Elastic/Filebeat direkt aufnehmen.",
    "de.bicim.cef.hedef": "ArcSight · QRadar",
    "de.bicim.cef.aciklama":
      "ArcSight-Common-Event-Format-Zeilen (CEF:0|Veylify|AuditLog|…). Den Feldern act/suser/src/cs1 zugeordnet; QRadar parst dieses Format ebenfalls.",
    "de.bicim.json.hedef": "Allgemein · Archiv",
    "de.bicim.json.aciklama":
      "Ein einzelnes eingerücktes JSON-Array. Für allgemeinen Import/Export, manuelle Prüfung oder Langzeitarchivierung.",

    "de.toast.baslik": "{ad} wird heruntergeladen",
    "de.toast.aciklama": "SIEM-Export wird vorbereitet.",

    "de.durustNot":
      "Dieses Modul bietet {b0}pull-basierten (Download){b1} Export: Es lädt das Audit-Ledger im gewählten Format herunter, und du lädst es manuell oder über einen Ingestion-Job in dein SIEM. {b2}Live-Streaming (Push){b3} — Echtzeit-Übermittlung an einen HEC-Endpunkt oder syslog — ist der geplante nächste Schritt.",
  },
  fr: {
    "de.baslik": "Export d'audit et intégrité",
    "de.kirintiSiem": "Export SIEM",

    "de.tanitimBaslik": "Exportez votre registre d'audit vers votre SIEM, prouvez son intégrité.",
    "de.tanitimMetin":
      "Téléchargez le journal d'audit chaîné par hachage au format NDJSON, CEF ou JSON ; vérifiez ici, avant chaque téléchargement, que la chaîne n'a pas été altérée (preuve d'inviolabilité).",

    "de.zincirDogrulandi": "Intégrité de la chaîne VÉRIFIÉE ✓",
    "de.zincirBozuldu": "Intégrité de la chaîne ROMPUE ✕",
    "de.wormRozet": "WORM — non altéré",
    "de.kirilmaRozet": "{n} ruptures",
    "de.saglamMetin":
      "Le lien de hachage précédent et la continuité de séquence de chaque enregistrement sont cohérents. Aucune suppression, réorganisation ou insertion d'enregistrement détectée.",
    "de.bozukMetin":
      "Le lien de la chaîne ou la continuité de séquence est rompu. Les points de rupture ci-dessous indiquent une possible altération.",
    "de.kayitKontrol": "enregistrements vérifiés",
    "de.seqAraligi": "plage de seq",
    "de.genesisSon": "genesis → dernière chaîne",

    "de.kirilmaNoktalari": "Points de rupture",
    "de.sebep.genesis": 'Le premier enregistrement n\'est pas genesis : prevHash "{p}" attendu, mais "genesis".',
    "de.sebep.yinelenen": "Numéro de séquence en double : seq {s} apparaît plusieurs fois.",
    "de.sebep.bosluk": "Lacune de séquence : {n} enregistrements manquants entre seq {a} et {b} (suppression possible).",
    "de.sebep.duzensiz": "Séquence désordonnée : seq {s} est inférieur/égal à la seq précédente {p}.",
    "de.sebep.kopuk": 'Chaîne rompue : prevHash "{p}" ≠ hachage de l\'enregistrement précédent "{h}".',

    "de.yontemBaslik": "Méthode de vérification :",
    "de.yontemMetin1": "le",
    "de.yontemBaglanti": "lien",
    "de.yontemMetin2": "de la chaîne (le",
    "de.yontemMetin3": " de chaque enregistrement = le",
    "de.yontemMetin4": " de l'enregistrement précédent) et la",
    "de.yontemSira": "continuité de séquence",
    "de.yontemMetin5": "(seq croissant sans lacune",
    "de.yontemMetin6":
      ") sont vérifiés. Le hachage de contenu SHA-256 est produit lors de l'écriture du registre ; cette vérification ne le recalcule pas, elle prouve l'intégrité du lien.",

    "de.stat.toplam": "Total des enregistrements",
    "de.stat.kritik": "Actions critiques",
    "de.stat.aktor": "Acteurs distincts",
    "de.stat.kategori": "Catégories",

    "de.kategoriDagilim": "Répartition par catégorie",
    "de.henuzKayitYok": "Aucun enregistrement d'audit pour l'instant.",

    "de.kat.auth": "Identité",
    "de.kat.site": "Site",
    "de.kat.rule": "Règle",
    "de.kat.team": "Équipe",
    "de.kat.ai-policy": "Politique IA",
    "de.kat.billing": "Facturation",
    "de.kat.token": "Clé API",
    "de.kat.webhook": "Webhook",

    "de.zamanAraligi": "Plage temporelle",
    "de.ilkKayit": "Premier enregistrement",
    "de.sonKayit": "Dernier enregistrement",

    "de.enEtkinAktor": "Acteurs les plus actifs",
    "de.aktorYok": "Aucun acteur.",

    "de.siemBaslik": "Formats d'export SIEM",
    "de.onizlemeBaslik": "Aperçu (premières lignes)",
    "de.onizlemeYok": "Aucun aperçu car il n'y a aucun enregistrement.",
    "de.indir": "Télécharger {ad}",
    "de.ornekDosya": "exemple.{uzanti}",

    "de.bicim.ndjson.hedef": "Splunk · Elastic",
    "de.bicim.ndjson.aciklama":
      "Un événement JSON par ligne (Newline-Delimited JSON). Le format directement ingéré par les pipelines de logs comme Splunk HEC et Elastic/Filebeat.",
    "de.bicim.cef.hedef": "ArcSight · QRadar",
    "de.bicim.cef.aciklama":
      "Lignes ArcSight Common Event Format (CEF:0|Veylify|AuditLog|…). Mappées aux champs act/suser/src/cs1 ; QRadar analyse également ce format.",
    "de.bicim.json.hedef": "Général · Archive",
    "de.bicim.json.aciklama":
      "Un seul tableau JSON indenté. Pour l'import/export polyvalent, l'inspection manuelle ou l'archivage à long terme.",

    "de.toast.baslik": "Téléchargement de {ad}",
    "de.toast.aciklama": "Préparation de l'export SIEM.",

    "de.durustNot":
      "Ce module fournit un export {b0}par extraction/téléchargement (pull){b1} : il télécharge le registre d'audit dans le format choisi, et vous le chargez dans votre SIEM manuellement ou via une tâche d'ingestion. Le {b2}flux en direct (push/streaming){b3} — livraison en temps réel vers un point de terminaison HEC ou syslog — est la prochaine étape prévue.",
  },
  es: {
    "de.baslik": "Exportación de auditoría e integridad",
    "de.kirintiSiem": "Exportación SIEM",

    "de.tanitimBaslik": "Exporta tu registro de auditoría a tu SIEM y demuestra su integridad.",
    "de.tanitimMetin":
      "Descarga el registro de auditoría encadenado por hash como NDJSON, CEF o JSON; verifica aquí, antes de cada descarga, que la cadena no ha sido manipulada (evidencia de manipulación).",

    "de.zincirDogrulandi": "Integridad de la cadena VERIFICADA ✓",
    "de.zincirBozuldu": "Integridad de la cadena ROTA ✕",
    "de.wormRozet": "WORM — sin manipular",
    "de.kirilmaRozet": "{n} roturas",
    "de.saglamMetin":
      "El enlace de hash anterior y la continuidad de secuencia de cada registro son coherentes. No se detectó ninguna eliminación, reordenación o inserción de registros.",
    "de.bozukMetin":
      "El enlace de la cadena o la continuidad de secuencia está roto. Los puntos de rotura de abajo indican una posible manipulación.",
    "de.kayitKontrol": "registros comprobados",
    "de.seqAraligi": "rango de seq",
    "de.genesisSon": "genesis → última cadena",

    "de.kirilmaNoktalari": "Puntos de rotura",
    "de.sebep.genesis": 'El primer registro no es genesis: se esperaba prevHash "{p}", pero es "genesis".',
    "de.sebep.yinelenen": "Número de secuencia duplicado: seq {s} aparece más de una vez.",
    "de.sebep.bosluk": "Hueco de secuencia: faltan {n} registros entre seq {a} y {b} (posible eliminación).",
    "de.sebep.duzensiz": "Secuencia desordenada: seq {s} es menor/igual que la seq anterior {p}.",
    "de.sebep.kopuk": 'Cadena rota: prevHash "{p}" ≠ hash del registro anterior "{h}".',

    "de.yontemBaslik": "Método de verificación:",
    "de.yontemMetin1": "se comprueban el",
    "de.yontemBaglanti": "enlace",
    "de.yontemMetin2": "de la cadena (el",
    "de.yontemMetin3": " de cada registro = el",
    "de.yontemMetin4": " del registro anterior) y la",
    "de.yontemSira": "continuidad de secuencia",
    "de.yontemMetin5": "(seq creciente sin huecos",
    "de.yontemMetin6":
      "). El hash de contenido SHA-256 se produce al escribir el registro; esta verificación no lo recalcula, sino que prueba la integridad del enlace.",

    "de.stat.toplam": "Registros totales",
    "de.stat.kritik": "Acciones críticas",
    "de.stat.aktor": "Actores distintos",
    "de.stat.kategori": "Categorías",

    "de.kategoriDagilim": "Distribución por categoría",
    "de.henuzKayitYok": "Aún no hay registros de auditoría.",

    "de.kat.auth": "Identidad",
    "de.kat.site": "Sitio",
    "de.kat.rule": "Regla",
    "de.kat.team": "Equipo",
    "de.kat.ai-policy": "Política de IA",
    "de.kat.billing": "Facturación",
    "de.kat.token": "Clave API",
    "de.kat.webhook": "Webhook",

    "de.zamanAraligi": "Rango temporal",
    "de.ilkKayit": "Primer registro",
    "de.sonKayit": "Último registro",

    "de.enEtkinAktor": "Actores más activos",
    "de.aktorYok": "Sin actores.",

    "de.siemBaslik": "Formatos de exportación SIEM",
    "de.onizlemeBaslik": "Vista previa (primeras líneas)",
    "de.onizlemeYok": "Sin vista previa porque no hay registros.",
    "de.indir": "Descargar {ad}",
    "de.ornekDosya": "ejemplo.{uzanti}",

    "de.bicim.ndjson.hedef": "Splunk · Elastic",
    "de.bicim.ndjson.aciklama":
      "Un evento JSON por línea (Newline-Delimited JSON). El formato que ingieren directamente las canalizaciones de logs como Splunk HEC y Elastic/Filebeat.",
    "de.bicim.cef.hedef": "ArcSight · QRadar",
    "de.bicim.cef.aciklama":
      "Líneas de ArcSight Common Event Format (CEF:0|Veylify|AuditLog|…). Asignadas a los campos act/suser/src/cs1; QRadar también analiza este formato.",
    "de.bicim.json.hedef": "General · Archivo",
    "de.bicim.json.aciklama":
      "Un único array JSON con sangría. Para importación/exportación de uso general, revisión manual o archivo a largo plazo.",

    "de.toast.baslik": "Descargando {ad}",
    "de.toast.aciklama": "Preparando la exportación SIEM.",

    "de.durustNot":
      "Este módulo ofrece exportación {b0}basada en extracción/descarga (pull){b1}: descarga el registro de auditoría en el formato que elijas y lo subes a tu SIEM manualmente o mediante un trabajo de ingesta. La {b2}transmisión en vivo (push/streaming){b3} — entrega en tiempo real a un endpoint HEC o a syslog — es el siguiente paso previsto.",
  },
};

export function exportCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
