/**
 * Birleşik Risk sayfası — yerel çeviri sözlüğü.
 *
 * Sadece bu sayfaya özgü kullanıcı-görünür metinleri içerir. Paylaşılan
 * `src/lib/i18n/panel.ts` sözlüğüne DOKUNMAZ. Anahtar bulunamazsa TR'ye,
 * o da yoksa anahtarın kendisine düşer.
 *
 * NOT: Risk seviyesi (RiskSeviye) ve öneri enum değerleri asla çevrilmez;
 * lib bunları anahtar olarak üretir. Görünen etiketler burada enum-anahtarına
 * göre yeniden türetilir (br.seviye.*, br.oneri.*, br.faktor.*).
 *
 * Faktör açıklamaları lib'de TR üretilir; istemci onları anahtar (itibar/
 * tehditFeed/…) + gömülü sayısal verilerden yeniden türetip çevirir.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // Açıklama kutusu
    "br.aciklama.baslik": "Tüm sinyaller, tek karar.",
    "br.aciklama.govde":
      "Coğrafya, ASN/datacenter, TLS uyumsuzluğu, headless, tehdit-beslemesi, davranış skoru ve olay yoğunluğu — Veylify'ın tüm modülleri her IP için tek {vurgu}nda toplanır. Her skorun neden o olduğu şeffaf; önerilen aksiyon hazır.",
    "br.aciklama.vurgu": "birleşik risk skoru",

    // Özet kartlar
    "br.ozet.ip": "Değerlendirilen IP",
    "br.ozet.yuksekKritik": "Yüksek+kritik risk",
    "br.ozet.ort": "Ortalama risk",
    "br.ozet.engelle": "Engelleme önerilen",

    // Faktör dağılımı paneli
    "br.dagilim.baslik": "Risk faktörü katkı dağılımı",
    "br.dagilim.aciklama": "Hangi sinyaller trafiğinde en çok tetikleniyor — savunma önceliğin.",
    "br.dagilim.ipOrt": "{n} IP · ort puan {p}",

    // Filtre + arama
    "br.filtre.hepsi": "Hepsi",
    "br.ara.placeholder": "IP / ülke / ASN ara…",

    // IP listesi
    "br.liste.baslik": "IP risk sıralaması ({n})",
    "br.liste.eslesmeYok": "Eşleşen IP yok.",
    "br.liste.satirOzet": "{asn} · {olay} olay · baskın: {faktor}",
    "br.detay.baslik": "Risk faktörü dökümü",
    "br.detay.ipIstihbarat": "IP istihbaratı",
    "br.detay.kuralOner": "{oneri} kuralı öner",

    // Seviye etiketleri (enum değeri temiz/dusuk/… anahtar kalır)
    "br.seviye.temiz": "Temiz",
    "br.seviye.dusuk": "Düşük",
    "br.seviye.orta": "Orta",
    "br.seviye.yuksek": "Yüksek",
    "br.seviye.kritik": "Kritik",

    // Öneri etiketleri (enum değeri izin/izle/dogrula/engelle anahtar kalır)
    "br.oneri.izin": "İzin ver",
    "br.oneri.izle": "İzle",
    "br.oneri.dogrula": "Doğrula",
    "br.oneri.engelle": "Engelle",

    // Faktör adları (enum-anahtarına göre)
    "br.faktor.itibar": "Davranış & itibar",
    "br.faktor.tehditFeed": "Tehdit beslemesi",
    "br.faktor.datacenter": "Datacenter/hosting",
    "br.faktor.cografya": "Coğrafi risk",
    "br.faktor.tls": "TLS/otomasyon imzası",
    "br.faktor.tutarlilik": "Tarayıcı tutarlılık",
    "br.faktor.yogunluk": "Olay yoğunluğu",

    // Faktör açıklamaları (istemci-türevi; {..} yer tutucular gömülü veriyle dolar)
    "br.acik.itibar": "En düşük insanlık skoru {skor}, engel oranı %{engel}.",
    "br.acik.tehditFeed.eslesti": "{kaynaklar} beslemelerinde listeli.",
    "br.acik.tehditFeed.yok": "Bilinen tehdit beslemelerinde yok.",
    "br.acik.datacenter.evet": "{asn} bir datacenter/hosting ağı — meşru kullanıcı nadiren buradan gelir.",
    "br.acik.datacenter.hayir": "Konut/mobil ISP ağı.",
    "br.acik.cografya.riskli": "{ulke} yüksek bot-kaynağı yoğunluğuna sahip.",
    "br.acik.cografya.dusuk": "{ulke} düşük coğrafi risk.",
    "br.acik.tls.uyumsuz": "UA tarayıcı der ama TLS imzası araç — sahte tarayıcı.",
    "br.acik.tls.headless": "Headless tarayıcı imzası.",
    "br.acik.tls.tutarli": "Tutarlı tarayıcı imzası.",
    "br.acik.yogunluk": "{olay} olay, %{kotu} kötü sınıf.",
  },

  en: {
    "br.aciklama.baslik": "All signals, one decision.",
    "br.aciklama.govde":
      "Geography, ASN/datacenter, TLS mismatch, headless, threat feed, behavior score and event intensity — all of Veylify's modules combine into a single {vurgu} for each IP. Why each score is what it is stays transparent; the recommended action is ready.",
    "br.aciklama.vurgu": "unified risk score",

    "br.ozet.ip": "IPs assessed",
    "br.ozet.yuksekKritik": "High+critical risk",
    "br.ozet.ort": "Average risk",
    "br.ozet.engelle": "Blocking recommended",

    "br.dagilim.baslik": "Risk factor contribution breakdown",
    "br.dagilim.aciklama": "Which signals trigger most in your traffic — your defense priority.",
    "br.dagilim.ipOrt": "{n} IPs · avg score {p}",

    "br.filtre.hepsi": "All",
    "br.ara.placeholder": "Search IP / country / ASN…",

    "br.liste.baslik": "IP risk ranking ({n})",
    "br.liste.eslesmeYok": "No matching IP.",
    "br.liste.satirOzet": "{asn} · {olay} events · dominant: {faktor}",
    "br.detay.baslik": "Risk factor breakdown",
    "br.detay.ipIstihbarat": "IP intelligence",
    "br.detay.kuralOner": "Suggest {oneri} rule",

    "br.seviye.temiz": "Clean",
    "br.seviye.dusuk": "Low",
    "br.seviye.orta": "Medium",
    "br.seviye.yuksek": "High",
    "br.seviye.kritik": "Critical",

    "br.oneri.izin": "Allow",
    "br.oneri.izle": "Monitor",
    "br.oneri.dogrula": "Verify",
    "br.oneri.engelle": "Block",

    "br.faktor.itibar": "Behavior & reputation",
    "br.faktor.tehditFeed": "Threat feed",
    "br.faktor.datacenter": "Datacenter/hosting",
    "br.faktor.cografya": "Geographic risk",
    "br.faktor.tls": "TLS/automation signature",
    "br.faktor.tutarlilik": "Browser consistency",
    "br.faktor.yogunluk": "Event intensity",

    "br.acik.itibar": "Lowest humanity score {skor}, block rate {engel}%.",
    "br.acik.tehditFeed.eslesti": "Listed in {kaynaklar} feeds.",
    "br.acik.tehditFeed.yok": "Not in known threat feeds.",
    "br.acik.datacenter.evet": "{asn} is a datacenter/hosting network — legitimate users rarely come from here.",
    "br.acik.datacenter.hayir": "Residential/mobile ISP network.",
    "br.acik.cografya.riskli": "{ulke} has a high bot-source density.",
    "br.acik.cografya.dusuk": "{ulke} low geographic risk.",
    "br.acik.tls.uyumsuz": "UA claims a browser but the TLS signature is a tool — spoofed browser.",
    "br.acik.tls.headless": "Headless browser signature.",
    "br.acik.tls.tutarli": "Consistent browser signature.",
    "br.acik.yogunluk": "{olay} events, {kotu}% malicious class.",
  },

  de: {
    "br.aciklama.baslik": "Alle Signale, eine Entscheidung.",
    "br.aciklama.govde":
      "Geografie, ASN/Datacenter, TLS-Unstimmigkeit, Headless, Bedrohungs-Feed, Verhaltens-Score und Ereignisdichte — alle Module von Veylify fließen für jede IP in einen einzigen {vurgu} zusammen. Warum jeder Score so ist, bleibt transparent; die empfohlene Aktion steht bereit.",
    "br.aciklama.vurgu": "einheitlichen Risiko-Score",

    "br.ozet.ip": "Bewertete IPs",
    "br.ozet.yuksekKritik": "Hohes+kritisches Risiko",
    "br.ozet.ort": "Durchschnittsrisiko",
    "br.ozet.engelle": "Blockierung empfohlen",

    "br.dagilim.baslik": "Aufschlüsselung der Risikofaktor-Beiträge",
    "br.dagilim.aciklama": "Welche Signale in Ihrem Traffic am häufigsten auslösen — Ihre Verteidigungspriorität.",
    "br.dagilim.ipOrt": "{n} IPs · Ø Score {p}",

    "br.filtre.hepsi": "Alle",
    "br.ara.placeholder": "IP / Land / ASN suchen…",

    "br.liste.baslik": "IP-Risiko-Rangliste ({n})",
    "br.liste.eslesmeYok": "Keine passende IP.",
    "br.liste.satirOzet": "{asn} · {olay} Ereignisse · dominant: {faktor}",
    "br.detay.baslik": "Risikofaktor-Aufschlüsselung",
    "br.detay.ipIstihbarat": "IP-Analyse",
    "br.detay.kuralOner": "Regel „{oneri}“ vorschlagen",

    "br.seviye.temiz": "Sauber",
    "br.seviye.dusuk": "Niedrig",
    "br.seviye.orta": "Mittel",
    "br.seviye.yuksek": "Hoch",
    "br.seviye.kritik": "Kritisch",

    "br.oneri.izin": "Zulassen",
    "br.oneri.izle": "Beobachten",
    "br.oneri.dogrula": "Verifizieren",
    "br.oneri.engelle": "Blockieren",

    "br.faktor.itibar": "Verhalten & Reputation",
    "br.faktor.tehditFeed": "Bedrohungs-Feed",
    "br.faktor.datacenter": "Datacenter/Hosting",
    "br.faktor.cografya": "Geografisches Risiko",
    "br.faktor.tls": "TLS-/Automatisierungssignatur",
    "br.faktor.tutarlilik": "Browser-Konsistenz",
    "br.faktor.yogunluk": "Ereignisdichte",

    "br.acik.itibar": "Niedrigster Menschlichkeits-Score {skor}, Blockrate {engel}%.",
    "br.acik.tehditFeed.eslesti": "In {kaynaklar}-Feeds gelistet.",
    "br.acik.tehditFeed.yok": "Nicht in bekannten Bedrohungs-Feeds.",
    "br.acik.datacenter.evet": "{asn} ist ein Datacenter-/Hosting-Netz — legitime Nutzer kommen selten von hier.",
    "br.acik.datacenter.hayir": "Privates/mobiles ISP-Netz.",
    "br.acik.cografya.riskli": "{ulke} hat eine hohe Bot-Quellen-Dichte.",
    "br.acik.cografya.dusuk": "{ulke} geringes geografisches Risiko.",
    "br.acik.tls.uyumsuz": "UA gibt einen Browser an, doch die TLS-Signatur ist ein Tool — gefälschter Browser.",
    "br.acik.tls.headless": "Headless-Browser-Signatur.",
    "br.acik.tls.tutarli": "Konsistente Browser-Signatur.",
    "br.acik.yogunluk": "{olay} Ereignisse, {kotu}% bösartige Klasse.",
  },

  fr: {
    "br.aciklama.baslik": "Tous les signaux, une seule décision.",
    "br.aciklama.govde":
      "Géographie, ASN/datacenter, incohérence TLS, headless, flux de menaces, score de comportement et intensité d'événements — tous les modules de Veylify se combinent en un seul {vurgu} pour chaque IP. Pourquoi chaque score est ce qu'il est reste transparent ; l'action recommandée est prête.",
    "br.aciklama.vurgu": "score de risque unifié",

    "br.ozet.ip": "IP évaluées",
    "br.ozet.yuksekKritik": "Risque élevé+critique",
    "br.ozet.ort": "Risque moyen",
    "br.ozet.engelle": "Blocage recommandé",

    "br.dagilim.baslik": "Répartition de la contribution des facteurs de risque",
    "br.dagilim.aciklama": "Quels signaux se déclenchent le plus dans votre trafic — votre priorité de défense.",
    "br.dagilim.ipOrt": "{n} IP · score moy. {p}",

    "br.filtre.hepsi": "Tout",
    "br.ara.placeholder": "Rechercher IP / pays / ASN…",

    "br.liste.baslik": "Classement de risque des IP ({n})",
    "br.liste.eslesmeYok": "Aucune IP correspondante.",
    "br.liste.satirOzet": "{asn} · {olay} événements · dominant : {faktor}",
    "br.detay.baslik": "Détail des facteurs de risque",
    "br.detay.ipIstihbarat": "Renseignement IP",
    "br.detay.kuralOner": "Suggérer une règle « {oneri} »",

    "br.seviye.temiz": "Propre",
    "br.seviye.dusuk": "Faible",
    "br.seviye.orta": "Moyen",
    "br.seviye.yuksek": "Élevé",
    "br.seviye.kritik": "Critique",

    "br.oneri.izin": "Autoriser",
    "br.oneri.izle": "Surveiller",
    "br.oneri.dogrula": "Vérifier",
    "br.oneri.engelle": "Bloquer",

    "br.faktor.itibar": "Comportement & réputation",
    "br.faktor.tehditFeed": "Flux de menaces",
    "br.faktor.datacenter": "Datacenter/hébergement",
    "br.faktor.cografya": "Risque géographique",
    "br.faktor.tls": "Signature TLS/automatisation",
    "br.faktor.tutarlilik": "Cohérence du navigateur",
    "br.faktor.yogunluk": "Intensité d'événements",

    "br.acik.itibar": "Score d'humanité le plus bas {skor}, taux de blocage {engel} %.",
    "br.acik.tehditFeed.eslesti": "Répertorié dans les flux {kaynaklar}.",
    "br.acik.tehditFeed.yok": "Absent des flux de menaces connus.",
    "br.acik.datacenter.evet": "{asn} est un réseau datacenter/hébergement — les utilisateurs légitimes en viennent rarement.",
    "br.acik.datacenter.hayir": "Réseau FAI résidentiel/mobile.",
    "br.acik.cografya.riskli": "{ulke} présente une forte densité de sources de bots.",
    "br.acik.cografya.dusuk": "{ulke} faible risque géographique.",
    "br.acik.tls.uyumsuz": "L'UA prétend être un navigateur mais la signature TLS est un outil — navigateur usurpé.",
    "br.acik.tls.headless": "Signature de navigateur headless.",
    "br.acik.tls.tutarli": "Signature de navigateur cohérente.",
    "br.acik.yogunluk": "{olay} événements, {kotu} % de classe malveillante.",
  },

  es: {
    "br.aciklama.baslik": "Todas las señales, una decisión.",
    "br.aciklama.govde":
      "Geografía, ASN/datacenter, discrepancia TLS, headless, fuente de amenazas, puntuación de comportamiento e intensidad de eventos — todos los módulos de Veylify se combinan en una sola {vurgu} para cada IP. Por qué cada puntuación es la que es se mantiene transparente; la acción recomendada está lista.",
    "br.aciklama.vurgu": "puntuación de riesgo unificada",

    "br.ozet.ip": "IP evaluadas",
    "br.ozet.yuksekKritik": "Riesgo alto+crítico",
    "br.ozet.ort": "Riesgo medio",
    "br.ozet.engelle": "Bloqueo recomendado",

    "br.dagilim.baslik": "Desglose de contribución de factores de riesgo",
    "br.dagilim.aciklama": "Qué señales se activan más en tu tráfico — tu prioridad de defensa.",
    "br.dagilim.ipOrt": "{n} IP · punt. media {p}",

    "br.filtre.hepsi": "Todos",
    "br.ara.placeholder": "Buscar IP / país / ASN…",

    "br.liste.baslik": "Ranking de riesgo de IP ({n})",
    "br.liste.eslesmeYok": "Ninguna IP coincidente.",
    "br.liste.satirOzet": "{asn} · {olay} eventos · dominante: {faktor}",
    "br.detay.baslik": "Desglose de factores de riesgo",
    "br.detay.ipIstihbarat": "Inteligencia de IP",
    "br.detay.kuralOner": "Sugerir regla «{oneri}»",

    "br.seviye.temiz": "Limpio",
    "br.seviye.dusuk": "Bajo",
    "br.seviye.orta": "Medio",
    "br.seviye.yuksek": "Alto",
    "br.seviye.kritik": "Crítico",

    "br.oneri.izin": "Permitir",
    "br.oneri.izle": "Monitorear",
    "br.oneri.dogrula": "Verificar",
    "br.oneri.engelle": "Bloquear",

    "br.faktor.itibar": "Comportamiento & reputación",
    "br.faktor.tehditFeed": "Fuente de amenazas",
    "br.faktor.datacenter": "Datacenter/hosting",
    "br.faktor.cografya": "Riesgo geográfico",
    "br.faktor.tls": "Firma TLS/automatización",
    "br.faktor.tutarlilik": "Coherencia del navegador",
    "br.faktor.yogunluk": "Intensidad de eventos",

    "br.acik.itibar": "Puntuación de humanidad más baja {skor}, tasa de bloqueo {engel}%.",
    "br.acik.tehditFeed.eslesti": "Listado en las fuentes {kaynaklar}.",
    "br.acik.tehditFeed.yok": "No está en fuentes de amenazas conocidas.",
    "br.acik.datacenter.evet": "{asn} es una red de datacenter/hosting — los usuarios legítimos rara vez provienen de aquí.",
    "br.acik.datacenter.hayir": "Red de ISP residencial/móvil.",
    "br.acik.cografya.riskli": "{ulke} tiene una alta densidad de fuentes de bots.",
    "br.acik.cografya.dusuk": "{ulke} riesgo geográfico bajo.",
    "br.acik.tls.uyumsuz": "El UA dice ser un navegador pero la firma TLS es una herramienta — navegador falsificado.",
    "br.acik.tls.headless": "Firma de navegador headless.",
    "br.acik.tls.tutarli": "Firma de navegador consistente.",
    "br.acik.yogunluk": "{olay} eventos, {kotu}% de clase maliciosa.",
  },
};

export function birlesikRiskCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
