/**
 * Tehdit Avı paneli — YEREL sayfa sözlüğü.
 * =====================================================
 * Bu dosya YALNIZCA /panel/tehdit-avi istemci bileşenlerinin kullanıcıya
 * görünen KROM/ETİKET metinlerini 5 dile taşır (tr/en/de/fr/es).
 * Paylaşılan `@/lib/i18n/panel` sözlüğüne DOKUNMAZ; sadece `Dil` tipini ondan alır.
 *
 * ÖNEMLİ (güvenlik):
 *  - DSL alan İSİMLERİ (score/verdict/botClass/country/ua/asn) sorgu
 *    söz dizimidir — ÇEVRİLMEZ, sorgu token'ı olarak kalır. Sadece bot sınıfı
 *    ve karar ETİKETLERİ enum→anahtar eşlemesiyle çevrilir.
 *  - botClass değerleri (human/good_bot/automation…) ve verdict değerleri
 *    (blocked/allowed/challenged) VERİ'dir; çeviri yalnızca görüntü içindir.
 *  - IP, ASN, ülke kodu, skor, tarih VERİ'dir — çevrilmez.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // Sorgu çubuğu
    "av.sorgu.baslik": "Olay sorgusu",
    "av.sorgu.yer": "örn: botClass:scraper AND country:RU · score<0.3 · headless:true",
    "av.sorgu.ariaEtiket": "Tehdit avı sorgusu",
    "av.sorgu.calistir": "Sorgula",
    "av.sorgu.calisiyor": "Çalışıyor…",
    "av.sorgu.alanlar": "Alanlar:",

    // Şablonlar
    "av.sablon.baslik": "Hazır av şablonları",

    // Özet KPI'lar
    "av.kpi.eslesen": "Eşleşen olay",
    "av.kpi.sonOlaylar": "Son olaylar",
    "av.kpi.taranan": "Taranan olay",
    "av.kpi.benzersizIp": "Benzersiz IP",
    "av.kpi.eslesmeOrani": "Eşleşme oranı",

    // Dağılım kartları
    "av.dagilim.ulkeler": "Ülkeler",
    "av.dagilim.botSiniflari": "Bot sınıfları",
    "av.dagilim.kararlar": "Kararlar",

    // Sonuç tablosu
    "av.sonuc.baslik": "Sonuçlar ({n} gösteriliyor)",
    "av.sonuc.zaman": "Zaman",
    "av.sonuc.ip": "IP",
    "av.sonuc.ulke": "Ülke",
    "av.sonuc.sinif": "Sınıf",
    "av.sonuc.karar": "Karar",
    "av.sonuc.skor": "Skor",
    "av.sonuc.yol": "Yol",
    "av.sonuc.incele": "İncele",
    "av.sonuc.bos": "Eşleşen olay yok — sorguyu değiştir.",
    "av.sonuc.ipDetay": "IP",

    // Toast + dışa aktarma
    "av.toast.calistirilamadi": "Sorgu çalıştırılamadı",
    "av.toast.csvIndirildi": "CSV indirildi",

    // Bot sınıfı etiketleri (enum → anahtar; VALUE çevrilmez)
    "av.bot.human": "İnsan",
    "av.bot.good_bot": "İyi bot",
    "av.bot.automation": "Otomasyon",
    "av.bot.scraper": "Kazıyıcı",
    "av.bot.credential_stuffing": "Kimlik doldurma",
    "av.bot.ai_agent": "AI ajan",
    "av.bot.ddos": "DDoS",
    "av.bot.spam": "Spam",

    // Karar etiketleri (enum → anahtar; VALUE çevrilmez)
    "av.karar.blocked": "Engellendi",
    "av.karar.allowed": "İzin",
    "av.karar.challenged": "Doğrula",
    "av.karar.isaret": "İşaret",
  },

  en: {
    "av.sorgu.baslik": "Event query",
    "av.sorgu.yer": "e.g.: botClass:scraper AND country:RU · score<0.3 · headless:true",
    "av.sorgu.ariaEtiket": "Threat hunt query",
    "av.sorgu.calistir": "Run query",
    "av.sorgu.calisiyor": "Running…",
    "av.sorgu.alanlar": "Fields:",

    "av.sablon.baslik": "Ready-made hunt templates",

    "av.kpi.eslesen": "Matching events",
    "av.kpi.sonOlaylar": "Recent events",
    "av.kpi.taranan": "Events scanned",
    "av.kpi.benzersizIp": "Unique IPs",
    "av.kpi.eslesmeOrani": "Match rate",

    "av.dagilim.ulkeler": "Countries",
    "av.dagilim.botSiniflari": "Bot classes",
    "av.dagilim.kararlar": "Verdicts",

    "av.sonuc.baslik": "Results ({n} shown)",
    "av.sonuc.zaman": "Time",
    "av.sonuc.ip": "IP",
    "av.sonuc.ulke": "Country",
    "av.sonuc.sinif": "Class",
    "av.sonuc.karar": "Verdict",
    "av.sonuc.skor": "Score",
    "av.sonuc.yol": "Path",
    "av.sonuc.incele": "Inspect",
    "av.sonuc.bos": "No matching events — adjust your query.",
    "av.sonuc.ipDetay": "IP",

    "av.toast.calistirilamadi": "Could not run query",
    "av.toast.csvIndirildi": "CSV downloaded",

    "av.bot.human": "Human",
    "av.bot.good_bot": "Good bot",
    "av.bot.automation": "Automation",
    "av.bot.scraper": "Scraper",
    "av.bot.credential_stuffing": "Credential stuffing",
    "av.bot.ai_agent": "AI agent",
    "av.bot.ddos": "DDoS",
    "av.bot.spam": "Spam",

    "av.karar.blocked": "Blocked",
    "av.karar.allowed": "Allowed",
    "av.karar.challenged": "Challenge",
    "av.karar.isaret": "Flag",
  },

  de: {
    "av.sorgu.baslik": "Ereignisabfrage",
    "av.sorgu.yer": "z. B.: botClass:scraper AND country:RU · score<0.3 · headless:true",
    "av.sorgu.ariaEtiket": "Bedrohungsjagd-Abfrage",
    "av.sorgu.calistir": "Abfragen",
    "av.sorgu.calisiyor": "Läuft…",
    "av.sorgu.alanlar": "Felder:",

    "av.sablon.baslik": "Fertige Jagdvorlagen",

    "av.kpi.eslesen": "Passende Ereignisse",
    "av.kpi.sonOlaylar": "Letzte Ereignisse",
    "av.kpi.taranan": "Gescannte Ereignisse",
    "av.kpi.benzersizIp": "Eindeutige IPs",
    "av.kpi.eslesmeOrani": "Trefferquote",

    "av.dagilim.ulkeler": "Länder",
    "av.dagilim.botSiniflari": "Bot-Klassen",
    "av.dagilim.kararlar": "Entscheidungen",

    "av.sonuc.baslik": "Ergebnisse ({n} angezeigt)",
    "av.sonuc.zaman": "Zeit",
    "av.sonuc.ip": "IP",
    "av.sonuc.ulke": "Land",
    "av.sonuc.sinif": "Klasse",
    "av.sonuc.karar": "Entscheidung",
    "av.sonuc.skor": "Score",
    "av.sonuc.yol": "Pfad",
    "av.sonuc.incele": "Prüfen",
    "av.sonuc.bos": "Keine passenden Ereignisse — Abfrage anpassen.",
    "av.sonuc.ipDetay": "IP",

    "av.toast.calistirilamadi": "Abfrage konnte nicht ausgeführt werden",
    "av.toast.csvIndirildi": "CSV heruntergeladen",

    "av.bot.human": "Mensch",
    "av.bot.good_bot": "Guter Bot",
    "av.bot.automation": "Automatisierung",
    "av.bot.scraper": "Scraper",
    "av.bot.credential_stuffing": "Credential-Stuffing",
    "av.bot.ai_agent": "KI-Agent",
    "av.bot.ddos": "DDoS",
    "av.bot.spam": "Spam",

    "av.karar.blocked": "Blockiert",
    "av.karar.allowed": "Zugelassen",
    "av.karar.challenged": "Prüfen",
    "av.karar.isaret": "Markiert",
  },

  fr: {
    "av.sorgu.baslik": "Requête d'événements",
    "av.sorgu.yer": "ex. : botClass:scraper AND country:RU · score<0.3 · headless:true",
    "av.sorgu.ariaEtiket": "Requête de chasse aux menaces",
    "av.sorgu.calistir": "Exécuter",
    "av.sorgu.calisiyor": "En cours…",
    "av.sorgu.alanlar": "Champs :",

    "av.sablon.baslik": "Modèles de chasse prêts à l'emploi",

    "av.kpi.eslesen": "Événements correspondants",
    "av.kpi.sonOlaylar": "Événements récents",
    "av.kpi.taranan": "Événements analysés",
    "av.kpi.benzersizIp": "IP uniques",
    "av.kpi.eslesmeOrani": "Taux de correspondance",

    "av.dagilim.ulkeler": "Pays",
    "av.dagilim.botSiniflari": "Classes de bots",
    "av.dagilim.kararlar": "Verdicts",

    "av.sonuc.baslik": "Résultats ({n} affichés)",
    "av.sonuc.zaman": "Heure",
    "av.sonuc.ip": "IP",
    "av.sonuc.ulke": "Pays",
    "av.sonuc.sinif": "Classe",
    "av.sonuc.karar": "Verdict",
    "av.sonuc.skor": "Score",
    "av.sonuc.yol": "Chemin",
    "av.sonuc.incele": "Inspecter",
    "av.sonuc.bos": "Aucun événement correspondant — modifiez la requête.",
    "av.sonuc.ipDetay": "IP",

    "av.toast.calistirilamadi": "Impossible d'exécuter la requête",
    "av.toast.csvIndirildi": "CSV téléchargé",

    "av.bot.human": "Humain",
    "av.bot.good_bot": "Bon bot",
    "av.bot.automation": "Automatisation",
    "av.bot.scraper": "Extracteur",
    "av.bot.credential_stuffing": "Bourrage d'identifiants",
    "av.bot.ai_agent": "Agent IA",
    "av.bot.ddos": "DDoS",
    "av.bot.spam": "Spam",

    "av.karar.blocked": "Bloqué",
    "av.karar.allowed": "Autorisé",
    "av.karar.challenged": "Vérifier",
    "av.karar.isaret": "Signaler",
  },

  es: {
    "av.sorgu.baslik": "Consulta de eventos",
    "av.sorgu.yer": "p. ej.: botClass:scraper AND country:RU · score<0.3 · headless:true",
    "av.sorgu.ariaEtiket": "Consulta de caza de amenazas",
    "av.sorgu.calistir": "Consultar",
    "av.sorgu.calisiyor": "Ejecutando…",
    "av.sorgu.alanlar": "Campos:",

    "av.sablon.baslik": "Plantillas de caza listas",

    "av.kpi.eslesen": "Eventos coincidentes",
    "av.kpi.sonOlaylar": "Eventos recientes",
    "av.kpi.taranan": "Eventos analizados",
    "av.kpi.benzersizIp": "IP únicas",
    "av.kpi.eslesmeOrani": "Tasa de coincidencia",

    "av.dagilim.ulkeler": "Países",
    "av.dagilim.botSiniflari": "Clases de bot",
    "av.dagilim.kararlar": "Veredictos",

    "av.sonuc.baslik": "Resultados ({n} mostrados)",
    "av.sonuc.zaman": "Hora",
    "av.sonuc.ip": "IP",
    "av.sonuc.ulke": "País",
    "av.sonuc.sinif": "Clase",
    "av.sonuc.karar": "Veredicto",
    "av.sonuc.skor": "Puntuación",
    "av.sonuc.yol": "Ruta",
    "av.sonuc.incele": "Inspeccionar",
    "av.sonuc.bos": "No hay eventos coincidentes — ajusta la consulta.",
    "av.sonuc.ipDetay": "IP",

    "av.toast.calistirilamadi": "No se pudo ejecutar la consulta",
    "av.toast.csvIndirildi": "CSV descargado",

    "av.bot.human": "Humano",
    "av.bot.good_bot": "Bot bueno",
    "av.bot.automation": "Automatización",
    "av.bot.scraper": "Extractor",
    "av.bot.credential_stuffing": "Relleno de credenciales",
    "av.bot.ai_agent": "Agente IA",
    "av.bot.ddos": "DDoS",
    "av.bot.spam": "Spam",

    "av.karar.blocked": "Bloqueado",
    "av.karar.allowed": "Permitido",
    "av.karar.challenged": "Verificar",
    "av.karar.isaret": "Marcar",
  },
};

/** Anahtarı verilen dile çevir. Bulunamazsa TR'ye, o da yoksa anahtara düşer. */
export function tehditAviCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
