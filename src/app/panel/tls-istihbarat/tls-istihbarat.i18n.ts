/**
 * TLS / JA3-JA4 Parmak İzi İstihbaratı paneli — YEREL sayfa sözlüğü.
 * =================================================================
 * Bu dosya YALNIZCA /panel/tls-istihbarat istemci bileşeninin kullanıcıya
 * görünen KROM/ETİKET metinlerini 5 dile taşır (tr/en/de/fr/es). Paylaşılan
 * `@/lib/i18n/panel` sözlüğüne DOKUNMAZ; sadece `Dil` tipini ondan alır.
 *
 * ÖNEMLİ (güvenlik & veri):
 *  - JA3 / JA4 terimleri ürün adıdır — çevrilmez, olduğu gibi kalır.
 *  - Fingerprint hash'leri, cipher/UA metinleri, IP'ler, motor adları (Blink,
 *    WebKit, None...), sayılar VERİ'dir — çevrilmez.
 *  - TLS sınıfı (TlsSinif) ENUM'dur — değeri asla çevrilmez. Sınıf ETİKETİ ve
 *    açıklaması lib'den TR gelir; burada `sinif` anahtarından yeniden türetilir
 *    (lib düzenlenmeden). Örn: k.sinif "sahte" → t("tls.sinif.sahte").
 *  - Küme AÇIKLAMASI (k.aciklama) lib'de TR üretilir; istemcide `sinif` +
 *    `uyumsuz` + `engine` + bilinen-tarayıcı adından yeniden kurulur.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // Başlık (breadcrumb kısa ad nav.tls'den; bu descriptive h1)
    "tls.baslik": "JA3/JA4 TLS Parmak İzi İstihbaratı",

    // Açıklama şeridi
    "tls.serit.baslik": "TLS el sıkışması yalan söyleyemez.",
    "tls.serit.aciklama":
      'User-Agent kolayca sahtelenir; ama JA3/JA4 (TLS ClientHello parmak izi) istemcinin GERÇEK kütüphanesini ele verir. Python-requests, curl, headless Chrome ve gerçek Chrome\'un JA3\'leri farklıdır. En güçlü sinyal: <b>UA "Chrome" der ama JA3 "Python" der</b> → sahte tarayıcı.',

    // Özet kartları
    "tls.ozet.benzersiz": "Benzersiz JA3 imzası",
    "tls.ozet.sahte": "Sahte tarayıcı imzası",
    "tls.ozet.uyumsuz": "TLS/UA uyumsuz olay",
    "tls.ozet.oran": "Sahte/araç imza oranı",

    // Sınıf dağılımı paneli
    "tls.dagilim.baslik": "TLS sınıf dağılımı",
    "tls.dagilim.olay": "olay",

    // Filtre + arama
    "tls.filtre.hepsi": "Hepsi",
    "tls.ara.yer": "JA3 / UA / IP ara…",
    "tls.ara.etiket": "Ara",

    // TLS sınıf etiketleri (TlsSinif enum → etiket; lib'den yeniden türetilir)
    "tls.sinif.tarayici": "Gerçek tarayıcı",
    "tls.sinif.arac": "HTTP aracı",
    "tls.sinif.headless": "Headless",
    "tls.sinif.ai": "AI ajan",
    "tls.sinif.sahte": "Sahte tarayıcı",
    "tls.sinif.bilinmiyor": "Bilinmiyor",

    // Küme açıklamaları (lib aciklama yeniden kurulur; {ad} = bilinen tarayıcı adı)
    "tls.aciklama.tarayici": "Bilinen gerçek tarayıcı imzası ({ad}).",
    "tls.aciklama.sahte": "UA bir tarayıcı iddia ediyor ama JA3 araç imzası — sahte tarayıcı.",
    "tls.aciklama.headless": "Headless tarayıcı TLS imzası (Puppeteer/Playwright/Selenium).",
    "tls.aciklama.ai": "İlan edilmiş AI ajan/crawler TLS deseni.",
    "tls.aciklama.arac": "Tarayıcı olmayan HTTP kütüphanesi TLS imzası (Python/curl/Go...).",
    "tls.aciklama.bilinmiyor": "Sınıflandırılamayan TLS imzası.",

    // Küme kümesi paneli
    "tls.kume.baslik": "JA3 imza kümeleri ({n})",
    "tls.kume.bos": "Eşleşen JA3 kümesi yok.",
    "tls.kume.uyumsuz": "TLS/UA uyumsuz",
    "tls.kume.olayIp": "{olay} olay · {ip} IP",
    "tls.kume.motor": "motor: {motor}",
    "tls.kume.tehdit": "tehdit",
    "tls.kume.ip": "IP",
    "tls.kume.uyariSahte":
      "UA sahteleniyor — TLS imzasıyla eşleşmeyen tarayıcı iddiası. JA3 tabanlı engelleme kesin çözüm.",
    "tls.kume.uyariArac": "Tarayıcı olmayan araç trafiği. Bu JA3 imzasını doğrulamaya/engellemeye al.",

    // Alt CTA şeridi
    "tls.cta.baslik": "TLS parmak izi = değiştirilemez kimlik",
    "tls.cta.aciklama":
      "Bir bot UA'sını değiştirebilir ama TLS kütüphanesini değiştiremez. JA3 imzası, en dayanıklı bot tespit sinyalidir.",
    "tls.cta.buton": "Cihaz havuzu",
  },

  en: {
    "tls.baslik": "JA3/JA4 TLS Fingerprint Intelligence",

    "tls.serit.baslik": "The TLS handshake can't lie.",
    "tls.serit.aciklama":
      'The User-Agent is easily spoofed; but JA3/JA4 (the TLS ClientHello fingerprint) reveals the client\'s REAL library. The JA3s of python-requests, curl, headless Chrome and real Chrome all differ. The strongest signal: <b>the UA says "Chrome" but the JA3 says "Python"</b> → fake browser.',

    "tls.ozet.benzersiz": "Unique JA3 signatures",
    "tls.ozet.sahte": "Fake-browser signatures",
    "tls.ozet.uyumsuz": "TLS/UA mismatch events",
    "tls.ozet.oran": "Fake/tool signature ratio",

    "tls.dagilim.baslik": "TLS class distribution",
    "tls.dagilim.olay": "events",

    "tls.filtre.hepsi": "All",
    "tls.ara.yer": "Search JA3 / UA / IP…",
    "tls.ara.etiket": "Search",

    "tls.sinif.tarayici": "Real browser",
    "tls.sinif.arac": "HTTP tool",
    "tls.sinif.headless": "Headless",
    "tls.sinif.ai": "AI agent",
    "tls.sinif.sahte": "Fake browser",
    "tls.sinif.bilinmiyor": "Unknown",

    "tls.aciklama.tarayici": "Known genuine browser signature ({ad}).",
    "tls.aciklama.sahte": "UA claims a browser but JA3 is a tool signature — fake browser.",
    "tls.aciklama.headless": "Headless browser TLS signature (Puppeteer/Playwright/Selenium).",
    "tls.aciklama.ai": "Declared AI agent/crawler TLS pattern.",
    "tls.aciklama.arac": "Non-browser HTTP library TLS signature (Python/curl/Go...).",
    "tls.aciklama.bilinmiyor": "Unclassifiable TLS signature.",

    "tls.kume.baslik": "JA3 signature clusters ({n})",
    "tls.kume.bos": "No matching JA3 cluster.",
    "tls.kume.uyumsuz": "TLS/UA mismatch",
    "tls.kume.olayIp": "{olay} events · {ip} IPs",
    "tls.kume.motor": "engine: {motor}",
    "tls.kume.tehdit": "threat",
    "tls.kume.ip": "IP",
    "tls.kume.uyariSahte":
      "UA is being spoofed — a browser claim that doesn't match the TLS signature. JA3-based blocking is the definitive fix.",
    "tls.kume.uyariArac": "Non-browser tool traffic. Queue this JA3 signature for verification/blocking.",

    "tls.cta.baslik": "TLS fingerprint = an immutable identity",
    "tls.cta.aciklama":
      "A bot can change its UA but not its TLS library. The JA3 signature is the most durable bot-detection signal.",
    "tls.cta.buton": "Device pool",
  },

  de: {
    "tls.baslik": "JA3/JA4-TLS-Fingerprint-Intelligence",

    "tls.serit.baslik": "Der TLS-Handshake kann nicht lügen.",
    "tls.serit.aciklama":
      'Der User-Agent lässt sich leicht fälschen; aber JA3/JA4 (der TLS-ClientHello-Fingerprint) verrät die ECHTE Bibliothek des Clients. Die JA3 von python-requests, curl, Headless-Chrome und echtem Chrome unterscheiden sich. Das stärkste Signal: <b>der UA sagt "Chrome", aber der JA3 sagt "Python"</b> → falscher Browser.',

    "tls.ozet.benzersiz": "Eindeutige JA3-Signaturen",
    "tls.ozet.sahte": "Falsche-Browser-Signaturen",
    "tls.ozet.uyumsuz": "TLS/UA-Abweichungsereignisse",
    "tls.ozet.oran": "Anteil falscher/Tool-Signaturen",

    "tls.dagilim.baslik": "TLS-Klassenverteilung",
    "tls.dagilim.olay": "Ereignisse",

    "tls.filtre.hepsi": "Alle",
    "tls.ara.yer": "JA3 / UA / IP suchen…",
    "tls.ara.etiket": "Suchen",

    "tls.sinif.tarayici": "Echter Browser",
    "tls.sinif.arac": "HTTP-Tool",
    "tls.sinif.headless": "Headless",
    "tls.sinif.ai": "KI-Agent",
    "tls.sinif.sahte": "Falscher Browser",
    "tls.sinif.bilinmiyor": "Unbekannt",

    "tls.aciklama.tarayici": "Bekannte echte Browser-Signatur ({ad}).",
    "tls.aciklama.sahte": "UA gibt einen Browser vor, aber der JA3 ist eine Tool-Signatur — falscher Browser.",
    "tls.aciklama.headless": "Headless-Browser-TLS-Signatur (Puppeteer/Playwright/Selenium).",
    "tls.aciklama.ai": "Deklariertes KI-Agent-/Crawler-TLS-Muster.",
    "tls.aciklama.arac": "TLS-Signatur einer Nicht-Browser-HTTP-Bibliothek (Python/curl/Go...).",
    "tls.aciklama.bilinmiyor": "Nicht klassifizierbare TLS-Signatur.",

    "tls.kume.baslik": "JA3-Signatur-Cluster ({n})",
    "tls.kume.bos": "Kein passendes JA3-Cluster.",
    "tls.kume.uyumsuz": "TLS/UA-Abweichung",
    "tls.kume.olayIp": "{olay} Ereignisse · {ip} IPs",
    "tls.kume.motor": "Engine: {motor}",
    "tls.kume.tehdit": "Bedrohung",
    "tls.kume.ip": "IP",
    "tls.kume.uyariSahte":
      "Der UA wird gefälscht — eine Browser-Behauptung, die nicht zur TLS-Signatur passt. JA3-basiertes Blockieren ist die endgültige Lösung.",
    "tls.kume.uyariArac": "Nicht-Browser-Tool-Traffic. Stellen Sie diese JA3-Signatur zur Prüfung/Sperre in die Warteschlange.",

    "tls.cta.baslik": "TLS-Fingerprint = eine unveränderliche Identität",
    "tls.cta.aciklama":
      "Ein Bot kann seinen UA ändern, aber nicht seine TLS-Bibliothek. Die JA3-Signatur ist das beständigste Bot-Erkennungssignal.",
    "tls.cta.buton": "Geräte-Pool",
  },

  fr: {
    "tls.baslik": "Renseignement d'empreinte TLS JA3/JA4",

    "tls.serit.baslik": "La poignée de main TLS ne peut pas mentir.",
    "tls.serit.aciklama":
      'Le User-Agent est facile à falsifier ; mais JA3/JA4 (l\'empreinte du ClientHello TLS) révèle la VRAIE bibliothèque du client. Les JA3 de python-requests, curl, Chrome headless et du vrai Chrome diffèrent. Le signal le plus fort : <b>l\'UA dit « Chrome » mais le JA3 dit « Python »</b> → faux navigateur.',

    "tls.ozet.benzersiz": "Signatures JA3 uniques",
    "tls.ozet.sahte": "Signatures de faux navigateur",
    "tls.ozet.uyumsuz": "Événements incohérence TLS/UA",
    "tls.ozet.oran": "Ratio de signatures faux/outil",

    "tls.dagilim.baslik": "Répartition des classes TLS",
    "tls.dagilim.olay": "événements",

    "tls.filtre.hepsi": "Tous",
    "tls.ara.yer": "Rechercher JA3 / UA / IP…",
    "tls.ara.etiket": "Rechercher",

    "tls.sinif.tarayici": "Vrai navigateur",
    "tls.sinif.arac": "Outil HTTP",
    "tls.sinif.headless": "Headless",
    "tls.sinif.ai": "Agent IA",
    "tls.sinif.sahte": "Faux navigateur",
    "tls.sinif.bilinmiyor": "Inconnu",

    "tls.aciklama.tarayici": "Signature de navigateur authentique connue ({ad}).",
    "tls.aciklama.sahte": "L'UA prétend être un navigateur mais le JA3 est une signature d'outil — faux navigateur.",
    "tls.aciklama.headless": "Signature TLS de navigateur headless (Puppeteer/Playwright/Selenium).",
    "tls.aciklama.ai": "Motif TLS d'agent IA/crawler déclaré.",
    "tls.aciklama.arac": "Signature TLS d'une bibliothèque HTTP non-navigateur (Python/curl/Go...).",
    "tls.aciklama.bilinmiyor": "Signature TLS non classifiable.",

    "tls.kume.baslik": "Grappes de signatures JA3 ({n})",
    "tls.kume.bos": "Aucune grappe JA3 correspondante.",
    "tls.kume.uyumsuz": "Incohérence TLS/UA",
    "tls.kume.olayIp": "{olay} événements · {ip} IP",
    "tls.kume.motor": "moteur : {motor}",
    "tls.kume.tehdit": "menace",
    "tls.kume.ip": "IP",
    "tls.kume.uyariSahte":
      "L'UA est falsifié — une revendication de navigateur qui ne correspond pas à la signature TLS. Le blocage basé sur JA3 est la solution définitive.",
    "tls.kume.uyariArac": "Trafic d'outil non-navigateur. Mettez cette signature JA3 en file pour vérification/blocage.",

    "tls.cta.baslik": "Empreinte TLS = une identité immuable",
    "tls.cta.aciklama":
      "Un bot peut changer son UA mais pas sa bibliothèque TLS. La signature JA3 est le signal de détection de bots le plus durable.",
    "tls.cta.buton": "Parc d'appareils",
  },

  es: {
    "tls.baslik": "Inteligencia de huella TLS JA3/JA4",

    "tls.serit.baslik": "El handshake TLS no puede mentir.",
    "tls.serit.aciklama":
      'El User-Agent se falsifica con facilidad; pero JA3/JA4 (la huella del ClientHello TLS) delata la biblioteca REAL del cliente. Los JA3 de python-requests, curl, Chrome headless y Chrome real son distintos. La señal más fuerte: <b>el UA dice «Chrome» pero el JA3 dice «Python»</b> → navegador falso.',

    "tls.ozet.benzersiz": "Firmas JA3 únicas",
    "tls.ozet.sahte": "Firmas de navegador falso",
    "tls.ozet.uyumsuz": "Eventos de discrepancia TLS/UA",
    "tls.ozet.oran": "Proporción de firmas falso/herramienta",

    "tls.dagilim.baslik": "Distribución de clases TLS",
    "tls.dagilim.olay": "eventos",

    "tls.filtre.hepsi": "Todas",
    "tls.ara.yer": "Buscar JA3 / UA / IP…",
    "tls.ara.etiket": "Buscar",

    "tls.sinif.tarayici": "Navegador real",
    "tls.sinif.arac": "Herramienta HTTP",
    "tls.sinif.headless": "Headless",
    "tls.sinif.ai": "Agente IA",
    "tls.sinif.sahte": "Navegador falso",
    "tls.sinif.bilinmiyor": "Desconocido",

    "tls.aciklama.tarayici": "Firma de navegador auténtico conocida ({ad}).",
    "tls.aciklama.sahte": "El UA afirma ser un navegador pero el JA3 es una firma de herramienta — navegador falso.",
    "tls.aciklama.headless": "Firma TLS de navegador headless (Puppeteer/Playwright/Selenium).",
    "tls.aciklama.ai": "Patrón TLS de agente IA/crawler declarado.",
    "tls.aciklama.arac": "Firma TLS de biblioteca HTTP no-navegador (Python/curl/Go...).",
    "tls.aciklama.bilinmiyor": "Firma TLS no clasificable.",

    "tls.kume.baslik": "Clústeres de firmas JA3 ({n})",
    "tls.kume.bos": "No hay clúster JA3 coincidente.",
    "tls.kume.uyumsuz": "Discrepancia TLS/UA",
    "tls.kume.olayIp": "{olay} eventos · {ip} IP",
    "tls.kume.motor": "motor: {motor}",
    "tls.kume.tehdit": "amenaza",
    "tls.kume.ip": "IP",
    "tls.kume.uyariSahte":
      "El UA está siendo falsificado — una afirmación de navegador que no coincide con la firma TLS. El bloqueo basado en JA3 es la solución definitiva.",
    "tls.kume.uyariArac": "Tráfico de herramienta no-navegador. Pon en cola esta firma JA3 para verificación/bloqueo.",

    "tls.cta.baslik": "Huella TLS = una identidad inmutable",
    "tls.cta.aciklama":
      "Un bot puede cambiar su UA pero no su biblioteca TLS. La firma JA3 es la señal de detección de bots más duradera.",
    "tls.cta.buton": "Grupo de dispositivos",
  },
};

/** TLS istihbarat sayfası çeviri yardımcısı. TR'ye, o da yoksa anahtara düşer. */
export function tlsCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
