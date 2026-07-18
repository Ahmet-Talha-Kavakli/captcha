/**
 * Kural Önerileri — yerel i18n sözlüğü.
 * =====================================
 * Yalnızca bu sayfaya özgü metinler. Enum değerleri (field/op/value/action)
 * çevrilmez — veri olarak kalır; yalnızca action ETİKETLERİ ve öneri-tür
 * ETİKETLERİ (Ülke/Ağ/Bot sınıfı…) anahtar bazlı çevrilir.
 *
 * Öneri başlık/açıklama/gerekçe metinleri lib'de dinamik üretilir (ülke adı,
 * ASN, sayı gömülü) → dinamik veri olarak OLDUĞU GİBİ gösterilir, çevrilmez.
 * Lib DEĞİŞTİRİLMEZ.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // açıklama şeridi
    "serit.baslik": "Kural yazma — Veylify senin için önersin.",
    "serit.aciklama.1":
      "Gözlemlenen tehditler (en saldırgan ülke/ağ/IP/endpoint/bot sınıfı) analiz edilip hazır kural taslakları üretildi. Her önerinin",
    "serit.tahminiEtki": "tahmini etkisi",
    "serit.aciklama.2":
      "(kaç isteği yakalar) ve yanlış-pozitif riski hesaplı. Tek tıkla ekle.",

    // özet kartlar
    "ozet.oneri": "Öneri",
    "ozet.yuksekEtkili": "Yüksek etkili",
    "ozet.yakalanabilir": "Yakalanabilir istek",

    // site seçici
    "site.hedef": "Hedef site",

    // boş durum
    "bos.baslik": "Öneri yok",
    "bos.aciklama":
      "Şu an önerilecek yeni kural yok — mevcut kuralların gözlemlenen tehditleri kapsıyor. 🎉",
    "bos.kurallaraGit": "Kurallara git",

    // öneri kartı
    "kart.reddet": "Reddet",
    "kart.yakalar": "yakalar (%{n})",
    "kart.guven": "güven",
    "kart.var": "Var",
    "kart.yok": "Yok",
    "kart.yanlisPozRiski": "yanlış-poz riski",
    "kart.fpUyari":
      "Bu kural bir miktar insan trafiğini de yakalayabilir — \"engelle\" yerine \"doğrula\" düşün.",

    // aksiyon
    "aksiyon.kuralEklendi": "Kural eklendi",
    "aksiyon.kurallardaGor": "Kurallarda gör",
    "aksiyon.ekleniyor": "Ekleniyor…",
    "aksiyon.kuraliEkle": "Kuralı ekle",

    // toast
    "toast.siteSecilmedi": "Site seçilmedi",
    "toast.kuralEklendi": "Kural eklendi",
    "toast.kuralAktif": "{ad} artık aktif.",
    "toast.kuralEklenemedi": "Kural eklenemedi",

    // action etiketleri (enum → key-map)
    "action.allow": "İzin ver",
    "action.challenge": "Doğrula",
    "action.block": "Engelle",
    "action.flag": "İşaretle",

    // öneri tür etiketleri (lib'den yeniden türetilir)
    "tur.ulke": "Ülke",
    "tur.asn": "Ağ (ASN)",
    "tur.ip": "IP adresi",
    "tur.path": "Endpoint",
    "tur.botClass": "Bot sınıfı",
    "tur.score": "Skor",
  },

  en: {
    "serit.baslik": "Rule writing — let Veylify suggest for you.",
    "serit.aciklama.1":
      "Observed threats (most aggressive country/network/IP/endpoint/bot class) were analyzed to generate ready-made rule drafts. Each suggestion's",
    "serit.tahminiEtki": "estimated impact",
    "serit.aciklama.2":
      "(how many requests it catches) and false-positive risk are computed. Add with one click.",

    "ozet.oneri": "Suggestions",
    "ozet.yuksekEtkili": "High impact",
    "ozet.yakalanabilir": "Catchable requests",

    "site.hedef": "Target site",

    "bos.baslik": "No suggestions",
    "bos.aciklama":
      "No new rules to suggest right now — your existing rules cover the observed threats. 🎉",
    "bos.kurallaraGit": "Go to rules",

    "kart.reddet": "Dismiss",
    "kart.yakalar": "catches ({n}%)",
    "kart.guven": "confidence",
    "kart.var": "Yes",
    "kart.yok": "No",
    "kart.yanlisPozRiski": "false-pos risk",
    "kart.fpUyari":
      "This rule may also catch some human traffic — consider \"challenge\" instead of \"block\".",

    "aksiyon.kuralEklendi": "Rule added",
    "aksiyon.kurallardaGor": "View in rules",
    "aksiyon.ekleniyor": "Adding…",
    "aksiyon.kuraliEkle": "Add rule",

    "toast.siteSecilmedi": "No site selected",
    "toast.kuralEklendi": "Rule added",
    "toast.kuralAktif": "{ad} is now active.",
    "toast.kuralEklenemedi": "Couldn't add rule",

    "action.allow": "Allow",
    "action.challenge": "Challenge",
    "action.block": "Block",
    "action.flag": "Flag",

    "tur.ulke": "Country",
    "tur.asn": "Network (ASN)",
    "tur.ip": "IP address",
    "tur.path": "Endpoint",
    "tur.botClass": "Bot class",
    "tur.score": "Score",
  },

  de: {
    "serit.baslik": "Regeln schreiben — lassen Sie Veylify für Sie vorschlagen.",
    "serit.aciklama.1":
      "Beobachtete Bedrohungen (aggressivstes Land/Netzwerk/IP/Endpoint/Bot-Klasse) wurden analysiert, um fertige Regelentwürfe zu generieren. Die",
    "serit.tahminiEtki": "geschätzte Wirkung",
    "serit.aciklama.2":
      "jedes Vorschlags (wie viele Anfragen er abfängt) und das Falsch-Positiv-Risiko sind berechnet. Mit einem Klick hinzufügen.",

    "ozet.oneri": "Vorschläge",
    "ozet.yuksekEtkili": "Hohe Wirkung",
    "ozet.yakalanabilir": "Abfangbare Anfragen",

    "site.hedef": "Zielsite",

    "bos.baslik": "Keine Vorschläge",
    "bos.aciklama":
      "Derzeit keine neuen Regeln vorzuschlagen — Ihre bestehenden Regeln decken die beobachteten Bedrohungen ab. 🎉",
    "bos.kurallaraGit": "Zu den Regeln",

    "kart.reddet": "Verwerfen",
    "kart.yakalar": "fängt ab ({n}%)",
    "kart.guven": "Vertrauen",
    "kart.var": "Ja",
    "kart.yok": "Nein",
    "kart.yanlisPozRiski": "Falsch-Pos-Risiko",
    "kart.fpUyari":
      "Diese Regel könnte auch etwas menschlichen Traffic abfangen — erwägen Sie \"herausfordern\" statt \"blockieren\".",

    "aksiyon.kuralEklendi": "Regel hinzugefügt",
    "aksiyon.kurallardaGor": "In den Regeln ansehen",
    "aksiyon.ekleniyor": "Wird hinzugefügt…",
    "aksiyon.kuraliEkle": "Regel hinzufügen",

    "toast.siteSecilmedi": "Keine Site ausgewählt",
    "toast.kuralEklendi": "Regel hinzugefügt",
    "toast.kuralAktif": "{ad} ist jetzt aktiv.",
    "toast.kuralEklenemedi": "Regel konnte nicht hinzugefügt werden",

    "action.allow": "Erlauben",
    "action.challenge": "Herausfordern",
    "action.block": "Blockieren",
    "action.flag": "Markieren",

    "tur.ulke": "Land",
    "tur.asn": "Netzwerk (ASN)",
    "tur.ip": "IP-Adresse",
    "tur.path": "Endpoint",
    "tur.botClass": "Bot-Klasse",
    "tur.score": "Score",
  },

  fr: {
    "serit.baslik": "Écriture de règles — laissez Veylify suggérer pour vous.",
    "serit.aciklama.1":
      "Les menaces observées (pays/réseau/IP/endpoint/classe de bot les plus agressifs) ont été analysées pour générer des ébauches de règles prêtes à l'emploi. L'",
    "serit.tahminiEtki": "impact estimé",
    "serit.aciklama.2":
      "de chaque suggestion (combien de requêtes elle capture) et le risque de faux positif sont calculés. Ajoutez en un clic.",

    "ozet.oneri": "Suggestions",
    "ozet.yuksekEtkili": "Fort impact",
    "ozet.yakalanabilir": "Requêtes capturables",

    "site.hedef": "Site cible",

    "bos.baslik": "Aucune suggestion",
    "bos.aciklama":
      "Aucune nouvelle règle à suggérer pour l'instant — vos règles existantes couvrent les menaces observées. 🎉",
    "bos.kurallaraGit": "Aller aux règles",

    "kart.reddet": "Rejeter",
    "kart.yakalar": "capture ({n} %)",
    "kart.guven": "confiance",
    "kart.var": "Oui",
    "kart.yok": "Non",
    "kart.yanlisPozRiski": "risque faux-pos",
    "kart.fpUyari":
      "Cette règle peut aussi capturer un peu de trafic humain — envisagez « défier » plutôt que « bloquer ».",

    "aksiyon.kuralEklendi": "Règle ajoutée",
    "aksiyon.kurallardaGor": "Voir dans les règles",
    "aksiyon.ekleniyor": "Ajout…",
    "aksiyon.kuraliEkle": "Ajouter la règle",

    "toast.siteSecilmedi": "Aucun site sélectionné",
    "toast.kuralEklendi": "Règle ajoutée",
    "toast.kuralAktif": "{ad} est maintenant active.",
    "toast.kuralEklenemedi": "Impossible d'ajouter la règle",

    "action.allow": "Autoriser",
    "action.challenge": "Défier",
    "action.block": "Bloquer",
    "action.flag": "Signaler",

    "tur.ulke": "Pays",
    "tur.asn": "Réseau (ASN)",
    "tur.ip": "Adresse IP",
    "tur.path": "Endpoint",
    "tur.botClass": "Classe de bot",
    "tur.score": "Score",
  },

  es: {
    "serit.baslik": "Escritura de reglas — deja que Veylify sugiera por ti.",
    "serit.aciklama.1":
      "Las amenazas observadas (país/red/IP/endpoint/clase de bot más agresivos) se analizaron para generar borradores de reglas listos. El",
    "serit.tahminiEtki": "impacto estimado",
    "serit.aciklama.2":
      "de cada sugerencia (cuántas solicitudes captura) y el riesgo de falso positivo están calculados. Añade con un clic.",

    "ozet.oneri": "Sugerencias",
    "ozet.yuksekEtkili": "Alto impacto",
    "ozet.yakalanabilir": "Solicitudes capturables",

    "site.hedef": "Sitio objetivo",

    "bos.baslik": "Sin sugerencias",
    "bos.aciklama":
      "No hay reglas nuevas que sugerir por ahora — tus reglas existentes cubren las amenazas observadas. 🎉",
    "bos.kurallaraGit": "Ir a las reglas",

    "kart.reddet": "Descartar",
    "kart.yakalar": "captura ({n} %)",
    "kart.guven": "confianza",
    "kart.var": "Sí",
    "kart.yok": "No",
    "kart.yanlisPozRiski": "riesgo falso-pos",
    "kart.fpUyari":
      "Esta regla también puede capturar algo de tráfico humano — considera «desafiar» en lugar de «bloquear».",

    "aksiyon.kuralEklendi": "Regla añadida",
    "aksiyon.kurallardaGor": "Ver en las reglas",
    "aksiyon.ekleniyor": "Añadiendo…",
    "aksiyon.kuraliEkle": "Añadir regla",

    "toast.siteSecilmedi": "Ningún sitio seleccionado",
    "toast.kuralEklendi": "Regla añadida",
    "toast.kuralAktif": "{ad} ya está activa.",
    "toast.kuralEklenemedi": "No se pudo añadir la regla",

    "action.allow": "Permitir",
    "action.challenge": "Desafiar",
    "action.block": "Bloquear",
    "action.flag": "Marcar",

    "tur.ulke": "País",
    "tur.asn": "Red (ASN)",
    "tur.ip": "Dirección IP",
    "tur.path": "Endpoint",
    "tur.botClass": "Clase de bot",
    "tur.score": "Puntuación",
  },
};

/** Kural önerileri anahtarını verilen dile çevir; TR'ye, sonra anahtara düşer. */
export function kuralOneriCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}

/** Sayı biçimlemesi için BCP-47 yerel eşlemesi. */
export const YEREL_BCP47: Record<Dil, string> = {
  tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES",
};
