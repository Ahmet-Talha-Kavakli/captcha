import type { Dil } from "@/lib/i18n/panel";

/**
 * Değişmezlik Defteri sayfasına özel i18n sözlüğü (yalnızca bu modül kullanır).
 * "dd." namespace'li anahtarlar. Doğal/native çeviriler; veri (hash, sıra no,
 * eylem/hedef ham metni, aktör, Merkle kök hash) çevrilmez — yalnızca görüntü
 * etiketleri çevrilir.
 *
 * TR kaynak/otorite; anahtar bulunamazsa TR'ye, o da yoksa anahtarın kendisine düşer.
 * Enterpolasyon: `.replace("{n}", ...)` ile yapılır.
 */
const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // Başlık
    "dd.baslik": "Değişmezlik Defteri & Tahrifat-Kanıtlı Denetim İzi",

    // Açıklama şeridi
    "dd.aciklamaVurgu": '"Kim ne yaptı" yetmez — kaydın {b0}değiştirilmediği{b1} de kanıtlanmalı.',
    "dd.aciklamaMetin1": "Her denetim girişi bir öncekinin hash'ini içerir:",
    "dd.aciklamaMetin2":
      "Tek bir kaydı değiştirirsen zincir o noktadan kırılır ve tahrifat kesin tespit edilir. Aşağıdaki defteri {b0}kurcalamayı deneyebilirsin{b1} — bütünlük anında bozulur.",

    // Bütünlük durum bandı
    "dd.dogrulandi": "Defter bütünlüğü DOĞRULANDI",
    "dd.tahrifat": "Tahrifat tespit edildi — giriş #{n}",
    "dd.dogrulandiAlt": "{n} giriş, hash-zinciri kesintisiz — hiçbir kayıt değiştirilmemiş.",
    "dd.neden.bag": "Giriş #{n}: zincir bağı kopuk (öncekiHash uyuşmuyor) — önceki kayıt değiştirilmiş.",
    "dd.neden.icerik": "Giriş #{n}: kayıt içeriği değiştirilmiş (hash uyuşmuyor).",
    "dd.zinciriOnar": "Zinciri onar",
    "dd.butunlukRaporu": "Bütünlük raporu",

    // Özet kartları
    "dd.stat.giris": "Defter girişi",
    "dd.stat.butunluk": "Doğrulanan bütünlük",
    "dd.stat.durum": "Zincir durumu",
    "dd.stat.gecerli": "GEÇERLİ",
    "dd.stat.kirik": "KIRIK",
    "dd.merkleKok": "Merkle kök hash",

    // Zincir görünümü
    "dd.zincirBaslik": "Hash-zinciri defter",
    "dd.zincirAciklama": "Her giriş öncekinin hash'ine bağlı. Bir kaydı kurcala (✎) — o girişten itibaren zincir kırılır.",
    "dd.degistirildi": "DEĞİŞTİRİLDİ",
    "dd.kirikRozet": "kırık",
    "dd.kurcalaTitle": "Bu kaydı kurcala (simülasyon)",
    "dd.varsayilanKurca": "Gizlice değiştirilmiş kayıt",

    // Yöntem notu
    "dd.yontemNot":
      "Her giriş {c0}H(öncekiHash + kayıt){c1} ile zincirlenir; {b0}Merkle kök{b1} tüm defterin bütünlüğünü tek değere indirger. Doğrulama, her hash'i yeniden hesaplayıp hem içerik hem zincir bağını kontrol eder. Bu demoda hız için bağımlılıksız {b2}FNV-1a{b3} hash kullanılır — {b4}üretimde SHA-256{b5} önerilir. Kayıtlar temsili denetim izidir; gerçek sistemde her panel eylemi otomatik zincire eklenir.",

    // Bütünlük raporu (indirme metni)
    "dd.rapor.baslik": "SPECTER — DEĞİŞMEZLİK DEFTERİ (bütünlük raporu)",
    "dd.rapor.kokHash": "Kök hash (Merkle): {n}",
    "dd.rapor.butunluk": "Bütünlük: {n}",
    "dd.rapor.gecerli": "GEÇERLİ ✓",
    "dd.rapor.kirildi": "KIRILDI (giriş #{n})",
    "dd.rapor.toplam": "Toplam giriş: {n}",
  },
  en: {
    "dd.baslik": "Immutability Ledger & Tamper-Evident Audit Trail",

    "dd.aciklamaVurgu": '"Who did what" is not enough — you must also prove the record {b0}was not altered{b1}.',
    "dd.aciklamaMetin1": "Each audit entry contains the hash of the previous one:",
    "dd.aciklamaMetin2":
      "If you alter a single record, the chain breaks from that point and tampering is definitively detected. Try {b0}tampering with{b1} the ledger below — integrity breaks instantly.",

    "dd.dogrulandi": "Ledger integrity VERIFIED",
    "dd.tahrifat": "Tampering detected — entry #{n}",
    "dd.dogrulandiAlt": "{n} entries, hash chain unbroken — no record has been altered.",
    "dd.neden.bag": "Entry #{n}: chain link broken (prevHash mismatch) — the previous record was altered.",
    "dd.neden.icerik": "Entry #{n}: record content altered (hash mismatch).",
    "dd.zinciriOnar": "Repair chain",
    "dd.butunlukRaporu": "Integrity report",

    "dd.stat.giris": "Ledger entries",
    "dd.stat.butunluk": "Verified integrity",
    "dd.stat.durum": "Chain status",
    "dd.stat.gecerli": "VALID",
    "dd.stat.kirik": "BROKEN",
    "dd.merkleKok": "Merkle root hash",

    "dd.zincirBaslik": "Hash-chained ledger",
    "dd.zincirAciklama": "Each entry is linked to the previous one's hash. Tamper with a record (✎) — the chain breaks from that entry on.",
    "dd.degistirildi": "ALTERED",
    "dd.kirikRozet": "broken",
    "dd.kurcalaTitle": "Tamper with this record (simulation)",
    "dd.varsayilanKurca": "Covertly altered record",

    "dd.yontemNot":
      "Each entry is chained with {c0}H(prevHash + record){c1}; the {b0}Merkle root{b1} reduces the integrity of the whole ledger to a single value. Verification recomputes each hash and checks both the content and the chain link. For speed, this demo uses the dependency-free {b2}FNV-1a{b3} hash — {b4}SHA-256 is recommended in production{b5}. The records are a representative audit trail; in a real system every panel action is appended to the chain automatically.",

    "dd.rapor.baslik": "SPECTER — IMMUTABILITY LEDGER (integrity report)",
    "dd.rapor.kokHash": "Root hash (Merkle): {n}",
    "dd.rapor.butunluk": "Integrity: {n}",
    "dd.rapor.gecerli": "VALID ✓",
    "dd.rapor.kirildi": "BROKEN (entry #{n})",
    "dd.rapor.toplam": "Total entries: {n}",
  },
  de: {
    "dd.baslik": "Unveränderlichkeits-Ledger & manipulationssicherer Prüfpfad",

    "dd.aciklamaVurgu": '„Wer hat was getan" reicht nicht — es muss auch bewiesen werden, dass der Datensatz {b0}nicht verändert wurde{b1}.',
    "dd.aciklamaMetin1": "Jeder Prüfeintrag enthält den Hash des vorherigen:",
    "dd.aciklamaMetin2":
      "Änderst du einen einzigen Datensatz, bricht die Kette ab dieser Stelle und Manipulation wird eindeutig erkannt. Versuche unten, das Ledger {b0}zu manipulieren{b1} — die Integrität bricht sofort.",

    "dd.dogrulandi": "Ledger-Integrität VERIFIZIERT",
    "dd.tahrifat": "Manipulation erkannt — Eintrag #{n}",
    "dd.dogrulandiAlt": "{n} Einträge, Hash-Kette ununterbrochen — kein Datensatz wurde verändert.",
    "dd.neden.bag": "Eintrag #{n}: Kettenverknüpfung unterbrochen (prevHash stimmt nicht) — der vorherige Datensatz wurde verändert.",
    "dd.neden.icerik": "Eintrag #{n}: Datensatzinhalt verändert (Hash stimmt nicht).",
    "dd.zinciriOnar": "Kette reparieren",
    "dd.butunlukRaporu": "Integritätsbericht",

    "dd.stat.giris": "Ledger-Einträge",
    "dd.stat.butunluk": "Verifizierte Integrität",
    "dd.stat.durum": "Kettenstatus",
    "dd.stat.gecerli": "GÜLTIG",
    "dd.stat.kirik": "GEBROCHEN",
    "dd.merkleKok": "Merkle-Wurzel-Hash",

    "dd.zincirBaslik": "Hash-verkettetes Ledger",
    "dd.zincirAciklama": "Jeder Eintrag ist mit dem Hash des vorherigen verknüpft. Manipuliere einen Datensatz (✎) — ab diesem Eintrag bricht die Kette.",
    "dd.degistirildi": "VERÄNDERT",
    "dd.kirikRozet": "gebrochen",
    "dd.kurcalaTitle": "Diesen Datensatz manipulieren (Simulation)",
    "dd.varsayilanKurca": "Heimlich veränderter Datensatz",

    "dd.yontemNot":
      "Jeder Eintrag wird mit {c0}H(prevHash + Datensatz){c1} verkettet; die {b0}Merkle-Wurzel{b1} reduziert die Integrität des gesamten Ledgers auf einen einzigen Wert. Die Verifizierung berechnet jeden Hash neu und prüft sowohl den Inhalt als auch die Kettenverknüpfung. Aus Geschwindigkeitsgründen verwendet diese Demo den abhängigkeitsfreien {b2}FNV-1a{b3}-Hash — {b4}in der Produktion wird SHA-256 empfohlen{b5}. Die Datensätze sind ein repräsentativer Prüfpfad; in einem echten System wird jede Panel-Aktion automatisch an die Kette angehängt.",

    "dd.rapor.baslik": "SPECTER — UNVERÄNDERLICHKEITS-LEDGER (Integritätsbericht)",
    "dd.rapor.kokHash": "Wurzel-Hash (Merkle): {n}",
    "dd.rapor.butunluk": "Integrität: {n}",
    "dd.rapor.gecerli": "GÜLTIG ✓",
    "dd.rapor.kirildi": "GEBROCHEN (Eintrag #{n})",
    "dd.rapor.toplam": "Einträge gesamt: {n}",
  },
  fr: {
    "dd.baslik": "Registre d'immuabilité & piste d'audit inviolable",

    "dd.aciklamaVurgu": '« Qui a fait quoi » ne suffit pas — il faut aussi prouver que l\'enregistrement {b0}n\'a pas été modifié{b1}.',
    "dd.aciklamaMetin1": "Chaque entrée d'audit contient le hachage de la précédente :",
    "dd.aciklamaMetin2":
      "Si vous modifiez un seul enregistrement, la chaîne se rompt à partir de ce point et toute altération est détectée avec certitude. Essayez de {b0}falsifier{b1} le registre ci-dessous — l'intégrité se brise instantanément.",

    "dd.dogrulandi": "Intégrité du registre VÉRIFIÉE",
    "dd.tahrifat": "Altération détectée — entrée n° {n}",
    "dd.dogrulandiAlt": "{n} entrées, chaîne de hachage intacte — aucun enregistrement n'a été modifié.",
    "dd.neden.bag": "Entrée n° {n} : lien de chaîne rompu (prevHash ne correspond pas) — l'enregistrement précédent a été modifié.",
    "dd.neden.icerik": "Entrée n° {n} : contenu de l'enregistrement modifié (le hachage ne correspond pas).",
    "dd.zinciriOnar": "Réparer la chaîne",
    "dd.butunlukRaporu": "Rapport d'intégrité",

    "dd.stat.giris": "Entrées du registre",
    "dd.stat.butunluk": "Intégrité vérifiée",
    "dd.stat.durum": "État de la chaîne",
    "dd.stat.gecerli": "VALIDE",
    "dd.stat.kirik": "ROMPUE",
    "dd.merkleKok": "Hachage racine de Merkle",

    "dd.zincirBaslik": "Registre chaîné par hachage",
    "dd.zincirAciklama": "Chaque entrée est liée au hachage de la précédente. Falsifiez un enregistrement (✎) — la chaîne se rompt à partir de cette entrée.",
    "dd.degistirildi": "MODIFIÉ",
    "dd.kirikRozet": "rompue",
    "dd.kurcalaTitle": "Falsifier cet enregistrement (simulation)",
    "dd.varsayilanKurca": "Enregistrement modifié en secret",

    "dd.yontemNot":
      "Chaque entrée est chaînée avec {c0}H(prevHash + enregistrement){c1} ; la {b0}racine de Merkle{b1} réduit l'intégrité de tout le registre à une seule valeur. La vérification recalcule chaque hachage et contrôle à la fois le contenu et le lien de chaîne. Pour la rapidité, cette démo utilise le hachage {b2}FNV-1a{b3} sans dépendance — {b4}SHA-256 est recommandé en production{b5}. Les enregistrements constituent une piste d'audit représentative ; dans un système réel, chaque action du panneau est automatiquement ajoutée à la chaîne.",

    "dd.rapor.baslik": "SPECTER — REGISTRE D'IMMUABILITÉ (rapport d'intégrité)",
    "dd.rapor.kokHash": "Hachage racine (Merkle) : {n}",
    "dd.rapor.butunluk": "Intégrité : {n}",
    "dd.rapor.gecerli": "VALIDE ✓",
    "dd.rapor.kirildi": "ROMPUE (entrée n° {n})",
    "dd.rapor.toplam": "Total des entrées : {n}",
  },
  es: {
    "dd.baslik": "Registro de inmutabilidad y rastro de auditoría a prueba de manipulaciones",

    "dd.aciklamaVurgu": '«Quién hizo qué» no basta — también hay que demostrar que el registro {b0}no fue alterado{b1}.',
    "dd.aciklamaMetin1": "Cada entrada de auditoría contiene el hash de la anterior:",
    "dd.aciklamaMetin2":
      "Si alteras un solo registro, la cadena se rompe a partir de ese punto y la manipulación se detecta con certeza. Prueba a {b0}manipular{b1} el registro de abajo — la integridad se rompe al instante.",

    "dd.dogrulandi": "Integridad del registro VERIFICADA",
    "dd.tahrifat": "Manipulación detectada — entrada n.º {n}",
    "dd.dogrulandiAlt": "{n} entradas, cadena de hash intacta — ningún registro ha sido alterado.",
    "dd.neden.bag": "Entrada n.º {n}: enlace de la cadena roto (prevHash no coincide) — el registro anterior fue alterado.",
    "dd.neden.icerik": "Entrada n.º {n}: contenido del registro alterado (el hash no coincide).",
    "dd.zinciriOnar": "Reparar cadena",
    "dd.butunlukRaporu": "Informe de integridad",

    "dd.stat.giris": "Entradas del registro",
    "dd.stat.butunluk": "Integridad verificada",
    "dd.stat.durum": "Estado de la cadena",
    "dd.stat.gecerli": "VÁLIDA",
    "dd.stat.kirik": "ROTA",
    "dd.merkleKok": "Hash raíz de Merkle",

    "dd.zincirBaslik": "Registro encadenado por hash",
    "dd.zincirAciklama": "Cada entrada está enlazada al hash de la anterior. Manipula un registro (✎) — la cadena se rompe a partir de esa entrada.",
    "dd.degistirildi": "ALTERADO",
    "dd.kirikRozet": "rota",
    "dd.kurcalaTitle": "Manipular este registro (simulación)",
    "dd.varsayilanKurca": "Registro alterado de forma encubierta",

    "dd.yontemNot":
      "Cada entrada se encadena con {c0}H(prevHash + registro){c1}; la {b0}raíz de Merkle{b1} reduce la integridad de todo el registro a un único valor. La verificación recalcula cada hash y comprueba tanto el contenido como el enlace de la cadena. Por rapidez, esta demo utiliza el hash {b2}FNV-1a{b3} sin dependencias — {b4}en producción se recomienda SHA-256{b5}. Los registros son un rastro de auditoría representativo; en un sistema real cada acción del panel se añade automáticamente a la cadena.",

    "dd.rapor.baslik": "SPECTER — REGISTRO DE INMUTABILIDAD (informe de integridad)",
    "dd.rapor.kokHash": "Hash raíz (Merkle): {n}",
    "dd.rapor.butunluk": "Integridad: {n}",
    "dd.rapor.gecerli": "VÁLIDA ✓",
    "dd.rapor.kirildi": "ROTA (entrada n.º {n})",
    "dd.rapor.toplam": "Entradas totales: {n}",
  },
};

export function defterCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
