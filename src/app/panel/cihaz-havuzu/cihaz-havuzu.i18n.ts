/**
 * Cihaz Havuzu & Parmak İzi Çakışması paneli — YEREL sayfa sözlüğü.
 * =====================================================
 * Bu dosya YALNIZCA /panel/cihaz-havuzu istemci bileşeninin kullanıcıya görünen
 * KROM/ETİKET metinlerini 5 dile taşır (tr/en/de/fr/es).
 * Paylaşılan `@/lib/i18n/panel` sözlüğüne DOKUNMAZ; sadece `Dil` tipini ondan alır.
 *
 * ÖNEMLİ (güvenlik):
 *  - Bot sınıfı DEĞERLERİ (human/good_bot/automation/scraper/…) motor verisidir;
 *    filtre/gösterim mantığını sürer, çevrilmez. Yalnızca ETİKETLERİ enum→anahtar
 *    eşlemesiyle ("bot.*") t() ile çözülür.
 *  - IP, ASN, ülke kodu, parmak izi (fingerprint) hash'i, sayı, skor VERİ'dir —
 *    çevrilmez.
 *  - `fpCesidi`, olay sayıları, tehdit skorları doğrudan gösterilir.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // Açıklama şeridi (üst)
    "serit.baslik": "Bir cihaz, onlarca IP: çok-hesap kötüye kullanımının imzası.",
    "serit.aciklama":
      "Meşru cihaz az IP kullanır. Tek parmak izinin onlarca IP'de (üstelik farklı ülkelerde) görünmesi = IP döndüren bot / kayıt spam'i. Tersi de şüpheli: tek IP'de onlarca parmak izi = parmak-izi çiftliği veya büyük proxy.",

    // Özet kartları
    "ozet.supheliCihaz": "Şüpheli cihaz havuzu",
    "ozet.enGenisCihaz": "En geniş cihaz (IP)",
    "ozet.supheliIp": "Şüpheli IP havuzu",
    "ozet.enGenisIp": "En geniş IP (parmak izi)",

    // Sekmeler + arama
    "sekme.cihaz": "Cihaz havuzları ({n})",
    "sekme.ip": "IP havuzları ({n})",
    "arama.placeholder": "Ara…",
    "arama.aria": "Ara",

    // Cihaz paneli
    "cihaz.baslik": "Cihaz havuzları — bir parmak izi, çok IP",
    "cihaz.bos": "Şüpheli cihaz havuzu tespit edilmedi — cihazlar temiz görünüyor. 🎉",
    "cihaz.ipRozet": "{n} IP",
    "cihaz.ulkeRozet": "{n} ülke",
    "cihaz.headless": "headless",
    "cihaz.meta": "{sinif} · {olay} olay · IP başına {ipBasina} · min skor {skor}",
    "cihaz.tehdit": "tehdit",
    "cihaz.cokUlkeUyari": "Aynı cihaz {n} farklı ülkede — coğrafi olarak imkânsız. Parmak izi tabanlı engelleme önerilir.",
    "cihaz.kuralOlustur": "Kural oluştur",

    // IP paneli
    "ip.baslik": "IP havuzları — bir IP, çok parmak izi",
    "ip.bos": "Şüpheli IP havuzu tespit edilmedi.",
    "ip.th.ip": "IP",
    "ip.th.ulke": "Ülke",
    "ip.th.asn": "ASN",
    "ip.th.fpCesidi": "Parmak izi çeşidi",
    "ip.th.olay": "Olay",
    "ip.th.tehdit": "Tehdit",

    // Alt CTA bandı
    "cta.baslik": "Parmak izi, IP'den daha güçlü bir kimlik",
    "cta.aciklama": "IP döndüren botlar IP-engelini aşar ama cihaz parmak izini değiştiremez. Parmak izi tabanlı kurallarla tüm havuzu tek seferde durdur.",
    "cta.iliskiGrafigi": "İlişki grafiği",

    // Bot sınıfı etiketleri (enum→anahtar)
    "bot.human": "İnsan",
    "bot.good_bot": "İyi bot",
    "bot.automation": "Otomasyon",
    "bot.scraper": "Kazıyıcı",
    "bot.credential_stuffing": "Kimlik doldurma",
    "bot.ai_agent": "AI ajan",
    "bot.ddos": "DDoS",
    "bot.spam": "Spam",
  },

  en: {
    "serit.baslik": "One device, dozens of IPs: the signature of multi-account abuse.",
    "serit.aciklama":
      "A legitimate device uses few IPs. A single fingerprint appearing across dozens of IPs (and in different countries) = an IP-rotating bot / signup spam. The reverse is suspicious too: dozens of fingerprints on a single IP = a fingerprint farm or large proxy.",

    "ozet.supheliCihaz": "Suspicious device pool",
    "ozet.enGenisCihaz": "Widest device (IP)",
    "ozet.supheliIp": "Suspicious IP pool",
    "ozet.enGenisIp": "Widest IP (fingerprint)",

    "sekme.cihaz": "Device pools ({n})",
    "sekme.ip": "IP pools ({n})",
    "arama.placeholder": "Search…",
    "arama.aria": "Search",

    "cihaz.baslik": "Device pools — one fingerprint, many IPs",
    "cihaz.bos": "No suspicious device pool detected — devices look clean. 🎉",
    "cihaz.ipRozet": "{n} IPs",
    "cihaz.ulkeRozet": "{n} countries",
    "cihaz.headless": "headless",
    "cihaz.meta": "{sinif} · {olay} events · {ipBasina} per IP · min score {skor}",
    "cihaz.tehdit": "threat",
    "cihaz.cokUlkeUyari": "The same device in {n} different countries — geographically impossible. Fingerprint-based blocking recommended.",
    "cihaz.kuralOlustur": "Create rule",

    "ip.baslik": "IP pools — one IP, many fingerprints",
    "ip.bos": "No suspicious IP pool detected.",
    "ip.th.ip": "IP",
    "ip.th.ulke": "Country",
    "ip.th.asn": "ASN",
    "ip.th.fpCesidi": "Fingerprint variety",
    "ip.th.olay": "Events",
    "ip.th.tehdit": "Threat",

    "cta.baslik": "The fingerprint is a stronger identity than the IP",
    "cta.aciklama": "IP-rotating bots evade IP blocks, but they can't change the device fingerprint. Stop the entire pool at once with fingerprint-based rules.",
    "cta.iliskiGrafigi": "Relationship graph",

    "bot.human": "Human",
    "bot.good_bot": "Good bot",
    "bot.automation": "Automation",
    "bot.scraper": "Scraper",
    "bot.credential_stuffing": "Credential stuffing",
    "bot.ai_agent": "AI agent",
    "bot.ddos": "DDoS",
    "bot.spam": "Spam",
  },

  de: {
    "serit.baslik": "Ein Gerät, Dutzende IPs: die Signatur von Multi-Konto-Missbrauch.",
    "serit.aciklama":
      "Ein legitimes Gerät nutzt wenige IPs. Erscheint ein einziger Fingerabdruck über Dutzende IPs (und in verschiedenen Ländern) = IP-rotierender Bot / Registrierungs-Spam. Der umgekehrte Fall ist ebenso verdächtig: Dutzende Fingerabdrücke auf einer einzigen IP = eine Fingerabdruck-Farm oder ein großer Proxy.",

    "ozet.supheliCihaz": "Verdächtiger Gerätepool",
    "ozet.enGenisCihaz": "Breitestes Gerät (IP)",
    "ozet.supheliIp": "Verdächtiger IP-Pool",
    "ozet.enGenisIp": "Breiteste IP (Fingerabdruck)",

    "sekme.cihaz": "Gerätepools ({n})",
    "sekme.ip": "IP-Pools ({n})",
    "arama.placeholder": "Suchen…",
    "arama.aria": "Suchen",

    "cihaz.baslik": "Gerätepools — ein Fingerabdruck, viele IPs",
    "cihaz.bos": "Kein verdächtiger Gerätepool erkannt — Geräte wirken sauber. 🎉",
    "cihaz.ipRozet": "{n} IPs",
    "cihaz.ulkeRozet": "{n} Länder",
    "cihaz.headless": "headless",
    "cihaz.meta": "{sinif} · {olay} Ereignisse · {ipBasina} pro IP · Min.-Score {skor}",
    "cihaz.tehdit": "Bedrohung",
    "cihaz.cokUlkeUyari": "Dasselbe Gerät in {n} verschiedenen Ländern — geografisch unmöglich. Fingerabdruck-basierte Sperrung empfohlen.",
    "cihaz.kuralOlustur": "Regel erstellen",

    "ip.baslik": "IP-Pools — eine IP, viele Fingerabdrücke",
    "ip.bos": "Kein verdächtiger IP-Pool erkannt.",
    "ip.th.ip": "IP",
    "ip.th.ulke": "Land",
    "ip.th.asn": "ASN",
    "ip.th.fpCesidi": "Fingerabdruck-Vielfalt",
    "ip.th.olay": "Ereignisse",
    "ip.th.tehdit": "Bedrohung",

    "cta.baslik": "Der Fingerabdruck ist eine stärkere Identität als die IP",
    "cta.aciklama": "IP-rotierende Bots umgehen IP-Sperren, können aber den Geräte-Fingerabdruck nicht ändern. Stoppen Sie den gesamten Pool auf einmal mit Fingerabdruck-basierten Regeln.",
    "cta.iliskiGrafigi": "Beziehungsgraph",

    "bot.human": "Mensch",
    "bot.good_bot": "Guter Bot",
    "bot.automation": "Automatisierung",
    "bot.scraper": "Scraper",
    "bot.credential_stuffing": "Credential Stuffing",
    "bot.ai_agent": "KI-Agent",
    "bot.ddos": "DDoS",
    "bot.spam": "Spam",
  },

  fr: {
    "serit.baslik": "Un appareil, des dizaines d'IP : la signature de l'abus multi-comptes.",
    "serit.aciklama":
      "Un appareil légitime utilise peu d'IP. Une même empreinte apparaissant sur des dizaines d'IP (et dans différents pays) = un bot à rotation d'IP / spam d'inscription. L'inverse est tout aussi suspect : des dizaines d'empreintes sur une seule IP = une ferme d'empreintes ou un grand proxy.",

    "ozet.supheliCihaz": "Pool d'appareils suspect",
    "ozet.enGenisCihaz": "Appareil le plus large (IP)",
    "ozet.supheliIp": "Pool d'IP suspect",
    "ozet.enGenisIp": "IP la plus large (empreinte)",

    "sekme.cihaz": "Pools d'appareils ({n})",
    "sekme.ip": "Pools d'IP ({n})",
    "arama.placeholder": "Rechercher…",
    "arama.aria": "Rechercher",

    "cihaz.baslik": "Pools d'appareils — une empreinte, plusieurs IP",
    "cihaz.bos": "Aucun pool d'appareils suspect détecté — les appareils semblent sains. 🎉",
    "cihaz.ipRozet": "{n} IP",
    "cihaz.ulkeRozet": "{n} pays",
    "cihaz.headless": "headless",
    "cihaz.meta": "{sinif} · {olay} événements · {ipBasina} par IP · score min {skor}",
    "cihaz.tehdit": "menace",
    "cihaz.cokUlkeUyari": "Le même appareil dans {n} pays différents — géographiquement impossible. Blocage basé sur l'empreinte recommandé.",
    "cihaz.kuralOlustur": "Créer une règle",

    "ip.baslik": "Pools d'IP — une IP, plusieurs empreintes",
    "ip.bos": "Aucun pool d'IP suspect détecté.",
    "ip.th.ip": "IP",
    "ip.th.ulke": "Pays",
    "ip.th.asn": "ASN",
    "ip.th.fpCesidi": "Variété d'empreintes",
    "ip.th.olay": "Événements",
    "ip.th.tehdit": "Menace",

    "cta.baslik": "L'empreinte est une identité plus forte que l'IP",
    "cta.aciklama": "Les bots à rotation d'IP contournent le blocage d'IP mais ne peuvent pas changer l'empreinte de l'appareil. Arrêtez tout le pool d'un coup avec des règles basées sur l'empreinte.",
    "cta.iliskiGrafigi": "Graphe de relations",

    "bot.human": "Humain",
    "bot.good_bot": "Bon bot",
    "bot.automation": "Automatisation",
    "bot.scraper": "Scraper",
    "bot.credential_stuffing": "Bourrage d'identifiants",
    "bot.ai_agent": "Agent IA",
    "bot.ddos": "DDoS",
    "bot.spam": "Spam",
  },

  es: {
    "serit.baslik": "Un dispositivo, decenas de IP: la firma del abuso multicuenta.",
    "serit.aciklama":
      "Un dispositivo legítimo usa pocas IP. Que una sola huella aparezca en decenas de IP (y en distintos países) = un bot que rota IP / spam de registro. Lo contrario también es sospechoso: decenas de huellas en una sola IP = una granja de huellas o un proxy grande.",

    "ozet.supheliCihaz": "Grupo de dispositivos sospechoso",
    "ozet.enGenisCihaz": "Dispositivo más amplio (IP)",
    "ozet.supheliIp": "Grupo de IP sospechoso",
    "ozet.enGenisIp": "IP más amplia (huella)",

    "sekme.cihaz": "Grupos de dispositivos ({n})",
    "sekme.ip": "Grupos de IP ({n})",
    "arama.placeholder": "Buscar…",
    "arama.aria": "Buscar",

    "cihaz.baslik": "Grupos de dispositivos — una huella, muchas IP",
    "cihaz.bos": "No se detectó ningún grupo de dispositivos sospechoso — los dispositivos parecen limpios. 🎉",
    "cihaz.ipRozet": "{n} IP",
    "cihaz.ulkeRozet": "{n} países",
    "cihaz.headless": "headless",
    "cihaz.meta": "{sinif} · {olay} eventos · {ipBasina} por IP · puntuación mín. {skor}",
    "cihaz.tehdit": "amenaza",
    "cihaz.cokUlkeUyari": "El mismo dispositivo en {n} países diferentes — geográficamente imposible. Se recomienda el bloqueo basado en la huella.",
    "cihaz.kuralOlustur": "Crear regla",

    "ip.baslik": "Grupos de IP — una IP, muchas huellas",
    "ip.bos": "No se detectó ningún grupo de IP sospechoso.",
    "ip.th.ip": "IP",
    "ip.th.ulke": "País",
    "ip.th.asn": "ASN",
    "ip.th.fpCesidi": "Variedad de huellas",
    "ip.th.olay": "Eventos",
    "ip.th.tehdit": "Amenaza",

    "cta.baslik": "La huella es una identidad más fuerte que la IP",
    "cta.aciklama": "Los bots que rotan IP evaden el bloqueo de IP, pero no pueden cambiar la huella del dispositivo. Detén todo el grupo de una vez con reglas basadas en la huella.",
    "cta.iliskiGrafigi": "Grafo de relaciones",

    "bot.human": "Humano",
    "bot.good_bot": "Bot bueno",
    "bot.automation": "Automatización",
    "bot.scraper": "Scraper",
    "bot.credential_stuffing": "Relleno de credenciales",
    "bot.ai_agent": "Agente de IA",
    "bot.ddos": "DDoS",
    "bot.spam": "Spam",
  },
};

export function cihazHavuzuCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
