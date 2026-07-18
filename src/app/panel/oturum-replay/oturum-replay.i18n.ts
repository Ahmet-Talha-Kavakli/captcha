/**
 * Oturum Yeniden-Oynatma sayfası — yerel çeviri sözlüğü.
 *
 * Sadece bu sayfaya özgü kullanıcı-görünür metinleri içerir. Paylaşılan
 * `src/lib/i18n/panel.ts` ve motor kütüphanesi `src/lib/specter/oturum-replay.ts`
 * DEĞİŞTİRİLMEZ. Anahtar bulunamazsa TR'ye, o da yoksa anahtarın kendisine düşer.
 *
 * ENUM GÜVENLİĞİ
 * --------------
 * Bot sınıfı (human/good_bot/automation/...), verdict (blocked/allowed/
 * challenged/flagged), HTTP method ve path DEĞERLERİ enum/veridir ve ASLA
 * çevrilmez. Yalnızca bunları GÖSTEREN etiketler bir anahtar-haritası ile
 * yerelleştirilir (bkz. "or.bot.*" ve "or.verdict.*"). IP, ülke kodu, ASN,
 * fingerprint, zaman damgaları, skorlar veri olduğu için olduğu gibi kalır;
 * zaman/tarih biçimlemesi BCP-47 diline göre yapılır.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // Açıklama şeridi
    "or.serit.baslik": "Bir saldırganın her adımını yeniden oynat.",
    "or.serit.aciklama":
      "Olaylar aynı IP + cihaz parmak izine göre oturumlara gruplanır. Bir botun sitede attığı her adımı — giriş noktası, gezinme yolu, tetiklenen kurallar, skor değişimi — zaman sırasıyla adım adım izle.",

    // Bot sınıfı enum → etiket
    "or.bot.human": "İnsan",
    "or.bot.good_bot": "İyi bot",
    "or.bot.automation": "Otomasyon",
    "or.bot.scraper": "Kazıyıcı",
    "or.bot.credential_stuffing": "Kimlik doldurma",
    "or.bot.ai_agent": "AI ajan",
    "or.bot.ddos": "DDoS",
    "or.bot.spam": "Spam",

    // Verdict enum → etiket
    "or.verdict.blocked": "Engellendi",
    "or.verdict.allowed": "İzin",
    "or.verdict.challenged": "Doğrula",
    "or.verdict.flagged": "İşaret",

    // Süre birimleri
    "or.sure.sn": "{n} sn",
    "or.sure.dksn": "{d}dk {k}sn",

    // Özet kartları
    "or.ozet.toplam": "Yeniden kurulan oturum",
    "or.ozet.bot": "Bot oturumu",
    "or.ozet.supheli": "Yüksek tehdit (≥60)",
    "or.ozet.ortAdim": "Ort. adım / oturum",

    // Oturum listesi
    "or.liste.baslik": "Oturumlar",
    "or.liste.ara": "IP / ülke / yol ara…",
    "or.liste.araAria": "Oturum ara",
    "or.liste.bulunamadi": "Oturum bulunamadı.",
    "or.liste.adim": "{n} adım",

    // Boş detay
    "or.detay.baslik": "Oturum detayı",
    "or.detay.bosSec": "Bir oturum seç.",

    // Replay paneli
    "or.replay.baslik": "Oturum yeniden-oynatma",
    "or.replay.tehdit": "Tehdit {n}",
    "or.replay.ortAralik": "ort {n}ms aralık",
    "or.replay.adimSayi": "{n} adım",
    "or.replay.ipIstihbarat": "IP istihbaratı",
    "or.replay.oynat": "Oynat",
    "or.replay.duraklat": "Duraklat",
    "or.replay.sonraki": "Sonraki adım",
    "or.replay.basaSar": "Başa sar",

    // Aktif adım kartı
    "or.adim.baslik": "Adım {n}",
    "or.adim.artiSn": " · +{n}sn",
    "or.adim.karar": "Karar",
    "or.adim.skor": "Skor",
    "or.adim.sinif": "Sınıf",
    "or.adim.gecikme": "Gecikme",
    "or.adim.tetiklenen": "Tetiklenen kural:",

    // Zaman çizelgesi
    "or.cizelge.baslik": "Adım zaman çizelgesi",
  },
  en: {
    "or.serit.baslik": "Replay every step an attacker took.",
    "or.serit.aciklama":
      "Events are grouped into sessions by the same IP + device fingerprint. Follow every step a bot took on the site — entry point, navigation path, triggered rules, score change — step by step in chronological order.",

    "or.bot.human": "Human",
    "or.bot.good_bot": "Good bot",
    "or.bot.automation": "Automation",
    "or.bot.scraper": "Scraper",
    "or.bot.credential_stuffing": "Credential stuffing",
    "or.bot.ai_agent": "AI agent",
    "or.bot.ddos": "DDoS",
    "or.bot.spam": "Spam",

    "or.verdict.blocked": "Blocked",
    "or.verdict.allowed": "Allowed",
    "or.verdict.challenged": "Challenge",
    "or.verdict.flagged": "Flagged",

    "or.sure.sn": "{n} s",
    "or.sure.dksn": "{d}m {k}s",

    "or.ozet.toplam": "Reconstructed sessions",
    "or.ozet.bot": "Bot sessions",
    "or.ozet.supheli": "High threat (≥60)",
    "or.ozet.ortAdim": "Avg. steps / session",

    "or.liste.baslik": "Sessions",
    "or.liste.ara": "Search IP / country / path…",
    "or.liste.araAria": "Search sessions",
    "or.liste.bulunamadi": "No sessions found.",
    "or.liste.adim": "{n} steps",

    "or.detay.baslik": "Session detail",
    "or.detay.bosSec": "Select a session.",

    "or.replay.baslik": "Session replay",
    "or.replay.tehdit": "Threat {n}",
    "or.replay.ortAralik": "avg {n}ms interval",
    "or.replay.adimSayi": "{n} steps",
    "or.replay.ipIstihbarat": "IP intelligence",
    "or.replay.oynat": "Play",
    "or.replay.duraklat": "Pause",
    "or.replay.sonraki": "Next step",
    "or.replay.basaSar": "Rewind",

    "or.adim.baslik": "Step {n}",
    "or.adim.artiSn": " · +{n}s",
    "or.adim.karar": "Verdict",
    "or.adim.skor": "Score",
    "or.adim.sinif": "Class",
    "or.adim.gecikme": "Latency",
    "or.adim.tetiklenen": "Triggered rule:",

    "or.cizelge.baslik": "Step timeline",
  },
  de: {
    "or.serit.baslik": "Spiele jeden Schritt eines Angreifers erneut ab.",
    "or.serit.aciklama":
      "Ereignisse werden anhand derselben IP + des Gerätefingerabdrucks zu Sitzungen gruppiert. Verfolge jeden Schritt eines Bots auf der Website — Einstiegspunkt, Navigationspfad, ausgelöste Regeln, Score-Änderung — Schritt für Schritt in chronologischer Reihenfolge.",

    "or.bot.human": "Mensch",
    "or.bot.good_bot": "Guter Bot",
    "or.bot.automation": "Automatisierung",
    "or.bot.scraper": "Scraper",
    "or.bot.credential_stuffing": "Credential Stuffing",
    "or.bot.ai_agent": "KI-Agent",
    "or.bot.ddos": "DDoS",
    "or.bot.spam": "Spam",

    "or.verdict.blocked": "Blockiert",
    "or.verdict.allowed": "Erlaubt",
    "or.verdict.challenged": "Prüfung",
    "or.verdict.flagged": "Markiert",

    "or.sure.sn": "{n} Sek.",
    "or.sure.dksn": "{d} Min. {k} Sek.",

    "or.ozet.toplam": "Rekonstruierte Sitzungen",
    "or.ozet.bot": "Bot-Sitzungen",
    "or.ozet.supheli": "Hohe Bedrohung (≥60)",
    "or.ozet.ortAdim": "Ø Schritte / Sitzung",

    "or.liste.baslik": "Sitzungen",
    "or.liste.ara": "IP / Land / Pfad suchen…",
    "or.liste.araAria": "Sitzungen suchen",
    "or.liste.bulunamadi": "Keine Sitzungen gefunden.",
    "or.liste.adim": "{n} Schritte",

    "or.detay.baslik": "Sitzungsdetail",
    "or.detay.bosSec": "Wähle eine Sitzung.",

    "or.replay.baslik": "Sitzungswiederholung",
    "or.replay.tehdit": "Bedrohung {n}",
    "or.replay.ortAralik": "Ø {n} ms Intervall",
    "or.replay.adimSayi": "{n} Schritte",
    "or.replay.ipIstihbarat": "IP-Aufklärung",
    "or.replay.oynat": "Abspielen",
    "or.replay.duraklat": "Pause",
    "or.replay.sonraki": "Nächster Schritt",
    "or.replay.basaSar": "Zurückspulen",

    "or.adim.baslik": "Schritt {n}",
    "or.adim.artiSn": " · +{n} Sek.",
    "or.adim.karar": "Urteil",
    "or.adim.skor": "Score",
    "or.adim.sinif": "Klasse",
    "or.adim.gecikme": "Latenz",
    "or.adim.tetiklenen": "Ausgelöste Regel:",

    "or.cizelge.baslik": "Schritt-Zeitleiste",
  },
  fr: {
    "or.serit.baslik": "Rejouez chaque étape d'un attaquant.",
    "or.serit.aciklama":
      "Les événements sont regroupés en sessions selon la même IP + l'empreinte de l'appareil. Suivez chaque étape d'un bot sur le site — point d'entrée, parcours de navigation, règles déclenchées, variation de score — étape par étape dans l'ordre chronologique.",

    "or.bot.human": "Humain",
    "or.bot.good_bot": "Bon bot",
    "or.bot.automation": "Automatisation",
    "or.bot.scraper": "Scraper",
    "or.bot.credential_stuffing": "Bourrage d'identifiants",
    "or.bot.ai_agent": "Agent IA",
    "or.bot.ddos": "DDoS",
    "or.bot.spam": "Spam",

    "or.verdict.blocked": "Bloqué",
    "or.verdict.allowed": "Autorisé",
    "or.verdict.challenged": "Vérification",
    "or.verdict.flagged": "Signalé",

    "or.sure.sn": "{n} s",
    "or.sure.dksn": "{d} min {k} s",

    "or.ozet.toplam": "Sessions reconstruites",
    "or.ozet.bot": "Sessions de bot",
    "or.ozet.supheli": "Menace élevée (≥60)",
    "or.ozet.ortAdim": "Étapes moy. / session",

    "or.liste.baslik": "Sessions",
    "or.liste.ara": "Rechercher IP / pays / chemin…",
    "or.liste.araAria": "Rechercher des sessions",
    "or.liste.bulunamadi": "Aucune session trouvée.",
    "or.liste.adim": "{n} étapes",

    "or.detay.baslik": "Détail de la session",
    "or.detay.bosSec": "Sélectionnez une session.",

    "or.replay.baslik": "Relecture de session",
    "or.replay.tehdit": "Menace {n}",
    "or.replay.ortAralik": "intervalle moy. {n} ms",
    "or.replay.adimSayi": "{n} étapes",
    "or.replay.ipIstihbarat": "Renseignement IP",
    "or.replay.oynat": "Lire",
    "or.replay.duraklat": "Pause",
    "or.replay.sonraki": "Étape suivante",
    "or.replay.basaSar": "Rembobiner",

    "or.adim.baslik": "Étape {n}",
    "or.adim.artiSn": " · +{n} s",
    "or.adim.karar": "Verdict",
    "or.adim.skor": "Score",
    "or.adim.sinif": "Classe",
    "or.adim.gecikme": "Latence",
    "or.adim.tetiklenen": "Règle déclenchée :",

    "or.cizelge.baslik": "Chronologie des étapes",
  },
  es: {
    "or.serit.baslik": "Reproduce cada paso de un atacante.",
    "or.serit.aciklama":
      "Los eventos se agrupan en sesiones por la misma IP + huella del dispositivo. Sigue cada paso que dio un bot en el sitio — punto de entrada, ruta de navegación, reglas activadas, cambio de puntuación — paso a paso en orden cronológico.",

    "or.bot.human": "Humano",
    "or.bot.good_bot": "Bot bueno",
    "or.bot.automation": "Automatización",
    "or.bot.scraper": "Scraper",
    "or.bot.credential_stuffing": "Relleno de credenciales",
    "or.bot.ai_agent": "Agente de IA",
    "or.bot.ddos": "DDoS",
    "or.bot.spam": "Spam",

    "or.verdict.blocked": "Bloqueado",
    "or.verdict.allowed": "Permitido",
    "or.verdict.challenged": "Verificación",
    "or.verdict.flagged": "Marcado",

    "or.sure.sn": "{n} s",
    "or.sure.dksn": "{d} min {k} s",

    "or.ozet.toplam": "Sesiones reconstruidas",
    "or.ozet.bot": "Sesiones de bot",
    "or.ozet.supheli": "Amenaza alta (≥60)",
    "or.ozet.ortAdim": "Pasos prom. / sesión",

    "or.liste.baslik": "Sesiones",
    "or.liste.ara": "Buscar IP / país / ruta…",
    "or.liste.araAria": "Buscar sesiones",
    "or.liste.bulunamadi": "No se encontraron sesiones.",
    "or.liste.adim": "{n} pasos",

    "or.detay.baslik": "Detalle de sesión",
    "or.detay.bosSec": "Selecciona una sesión.",

    "or.replay.baslik": "Reproducción de sesión",
    "or.replay.tehdit": "Amenaza {n}",
    "or.replay.ortAralik": "intervalo prom. {n} ms",
    "or.replay.adimSayi": "{n} pasos",
    "or.replay.ipIstihbarat": "Inteligencia de IP",
    "or.replay.oynat": "Reproducir",
    "or.replay.duraklat": "Pausar",
    "or.replay.sonraki": "Paso siguiente",
    "or.replay.basaSar": "Rebobinar",

    "or.adim.baslik": "Paso {n}",
    "or.adim.artiSn": " · +{n} s",
    "or.adim.karar": "Veredicto",
    "or.adim.skor": "Puntuación",
    "or.adim.sinif": "Clase",
    "or.adim.gecikme": "Latencia",
    "or.adim.tetiklenen": "Regla activada:",

    "or.cizelge.baslik": "Cronología de pasos",
  },
};

/** Zaman-damgası biçimleyici için BCP-47 yerel eşlemesi (IP/skor VERİ; saat biçimi dile bağlı). */
export const OR_YEREL: Record<Dil, string> = {
  tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES",
};

export function oturumReplayCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr[anahtar] ?? anahtar;
}
