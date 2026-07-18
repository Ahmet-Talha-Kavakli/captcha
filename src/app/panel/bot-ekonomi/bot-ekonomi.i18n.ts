/**
 * Bot Ekonomisi & Caydırıcılık paneli — YEREL sayfa sözlüğü.
 * =========================================================
 * Bu dosya YALNIZCA /panel/bot-ekonomi istemci bileşeninin kullanıcıya görünen
 * KROM/ETİKET metinlerini 5 dile taşır (tr/en/de/fr/es). Paylaşılan
 * `@/lib/i18n/panel` sözlüğüne DOKUNMAZ; sadece `Dil` tipini ondan alır.
 *
 * ÖNEMLİ (güvenlik & veri):
 *  - Sayısal değerler (kâr, maliyet, çarpan), $ para birimi, istek sayıları VERİ'dir
 *    — çevrilmez, yerele-duyarlı Intl ile biçimlenir.
 *  - Saldırı sınıfı botClass ENUM değeridir — asla çevrilmez. Sınıf ADI ("Kimlik
 *    Doldurma") ve AMAÇ ("Hesap ele geçirme") lib EKONOMILER'den gelir; burada
 *    botClass→anahtar eşlemesiyle yeniden türetilir (lib düzenlenmeden). Örn:
 *    e.botClass "credential_stuffing" → t("eko.ad.credential_stuffing").
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // Başlık (breadcrumb kısa ad nav.boteconomy'den; bu descriptive h1)
    "eko.baslik": "Bot Ekonomisi & Caydırıcılık Modeli",

    // Açıklama şeridi
    "eko.serit.baslik": "Botları durdurmak teknik değil, ekonomik bir savaştır.",
    "eko.serit.aciklama":
      "Saldırgan ancak saldırının <b>beklenen getirisi maliyetinden büyükse</b> devam eder. Veylify, ghost-font çözülemezliği + davranış skoru + oran sınırlamayla saldırı başına maliyeti caydırıcı eşiğin üstüne çıkarır. Aşağıda her saldırı sınıfının ekonomisi: Veylify'ın saldırganın kârını nasıl <b>sıfırladığı</b>.",

    // Boş durum
    "eko.bos.baslik": "Henüz ekonomisi ölçülebilir saldırı trafiği yok",
    "eko.bos.aciklama":
      "Gözlemlenen {n} olayda bilinen kötü sınıf trafiği bulunamadı. Saldırı geldikçe caydırıcılık ekonomisi burada belirir.",

    // Özet kartlar
    "eko.kpi.silinenKar": "Silinen saldırgan kârı",
    "eko.kpi.caydirilan": "Kârsız kılınan saldırı sınıfı",
    "eko.kpi.ortArtis": "Ort. maliyet artışı (başarı başına)",
    "eko.kpi.kalanKar": "Kalan saldırgan kârı (Veylify'la)",

    // Kâr-silme akış kartı
    "eko.akis.baslik": "Kâr-silme akışı: ham kâr → koruma → kalan",
    "eko.akis.ham": "Ham saldırgan kârı",
    "eko.akis.ham.alt": "Veylify yokken beklenen toplam kâr",
    "eko.akis.istek": "gözlemlenen istek",
    "eko.akis.maliyet": "maliyet artışı",
    "eko.akis.silinen": "Silinen kâr",
    "eko.akis.silinen.alt": "saldırgan kârından silindi",
    "eko.akis.kalan": "kalan kâr",
    "eko.akis.kalanKar": "Kalan kâr",
    "eko.akis.kalanKar.karsiz": "saldırı kârsız kılındı",
    "eko.akis.kalanKar.marjinal": "yalnızca marjinal kâr kaldı",
    "eko.akis.caydirildi": "sınıf caydırıldı",

    // Caydırıcılık dikey barlar
    "eko.dikey.baslik": "Caydırıcılık · sınıf başına kâr (korumasız vs Veylify ile)",
    "eko.dikey.korumasiz": "Korumasız kâr",
    "eko.dikey.ile": "Veylify ile",
    "eko.dikey.marjinalKalan": "Marjinal kalan kâr",
    "eko.dikey.caydirilan": "Caydırıldı (≈0)",

    // Caydırıcılık gauge
    "eko.gauge.baslik": "Caydırıcılık oranı",
    "eko.gauge.alt": "saldırı sınıfı kârsız kılındı",

    // Saldırı türü ROI donut
    "eko.donut.baslik": "Saldırgan kâr havuzu · türe göre",
    "eko.donut.merkez": "$ ham kâr",
    "eko.donut.bos": "Ölçülebilir saldırgan kârı yok.",

    // Önce/sonra kâr bandı
    "eko.band.baslik": "Saldırgan kârlılığı: Veylify'sız → Veylify'la",
    "eko.band.yokken": "Veylify YOKKEN",
    "eko.band.yokken.aciklama":
      "Bu trafik hacminde saldırganların beklenen toplam kârı — saldırı kârlı, tekrar gelirler.",
    "eko.band.varken": "Veylify VARKEN",
    "eko.band.varken.karsiz":
      "Saldırı kârsız — maliyet getiriyi aştı, saldırgan başka hedefe döner.",
    "eko.band.varken.marjinal":
      "Kâr büyük ölçüde eridi; saldırı marjinal hale geldi.",

    // Sınıf kartı
    "eko.sinif.caydirildi": "Caydırıldı (kârsız)",
    "eko.sinif.marjinal": "Hâlâ marjinal kâr",
    "eko.sinif.istek": "gözlemlenen istek",
    "eko.sinif.artis": "başarı başına maliyet artışı",

    // Ekonomi kolonu
    "eko.kol.yoksuz": "Veylify'sız",
    "eko.kol.varsul": "Veylify'la",
    "eko.kol.altyapi": "Altyapı maliyeti",
    "eko.kol.basari": "Beklenen başarı",
    "eko.kol.getiri": "Getiri",
    "eko.kol.netKar": "Net kâr",
    "eko.kol.roi": "Saldırgan ROI",
    "eko.kol.negatif": "negatif",

    // Eylem bandı
    "eko.eylem.baslik": "Caydırıcılık = kalıcı savunma",
    "eko.eylem.aciklama":
      "Bir botu tek seferde engellemek yetmez; saldırıyı <b>kârsız</b> kılmak onları tamamen vazgeçirir. Kalan kârlı sınıfları kural + oran sınırlamayla sıkılaştır.",
    "eko.eylem.buton": "Otomatik düzeltme",

    // Yöntem notu
    "eko.not":
      "<b>Gerçek:</b> hangi saldırı sınıfının kaç istek ürettiği (gözlemlenen {n} olaydan). <b>Model:</b> birim maliyetler (proxy/IP kirası ~$0.5-3/GB, CAPTCHA-çözüm çiftliği ~$1-3/1000, çalınan hesap değeri) sektör referans aralıklarının orta değeridir — kesin ölçüm değil, ekonomik <i>model</i>. Veylify'ın başarı-düşürme ve maliyet-artırma çarpanları ghost-font + davranış skoru etkisinin muhafazakâr tahminidir.",

    // Saldırı sınıfı ADI (lib EKONOMILER.ad — botClass→anahtar ile türetilir)
    "eko.ad.credential_stuffing": "Kimlik Doldurma",
    "eko.ad.scraper": "İçerik Kazıma",
    "eko.ad.ai_agent": "AI Eğitim Taraması",
    "eko.ad.ddos": "DDoS Seli",
    "eko.ad.spam": "Spam/Sahte Kayıt",
    "eko.ad.automation": "Genel Otomasyon",

    // Saldırı AMACI (lib EKONOMILER.amac)
    "eko.amac.credential_stuffing": "Hesap ele geçirme",
    "eko.amac.scraper": "Veri/fiyat toplama",
    "eko.amac.ai_agent": "Model eğitim verisi",
    "eko.amac.ddos": "Hizmet kesintisi",
    "eko.amac.spam": "Sahte hesap/içerik",
    "eko.amac.automation": "Çeşitli kötüye kullanım",
  },

  en: {
    "eko.baslik": "Bot Economics & Deterrence Model",

    "eko.serit.baslik": "Stopping bots is not a technical war — it's an economic one.",
    "eko.serit.aciklama":
      "An attacker only continues while the <b>expected return exceeds the cost</b>. With ghost-font unsolvability + behavioral scoring + rate limiting, Veylify pushes the cost per attack above the deterrence threshold. Below is the economics of each attack class: how Veylify drives the attacker's profit to <b>zero</b>.",

    "eko.bos.baslik": "No attack traffic with measurable economics yet",
    "eko.bos.aciklama":
      "No known malicious-class traffic was found in the {n} observed events. As attacks arrive, the deterrence economics will appear here.",

    "eko.kpi.silinenKar": "Attacker profit erased",
    "eko.kpi.caydirilan": "Attack classes made unprofitable",
    "eko.kpi.ortArtis": "Avg. cost increase (per success)",
    "eko.kpi.kalanKar": "Remaining attacker profit (with Veylify)",

    "eko.akis.baslik": "Profit-erasure flow: raw profit → protection → remaining",
    "eko.akis.ham": "Raw attacker profit",
    "eko.akis.ham.alt": "expected total profit without Veylify",
    "eko.akis.istek": "observed requests",
    "eko.akis.maliyet": "cost increase",
    "eko.akis.silinen": "Erased profit",
    "eko.akis.silinen.alt": "wiped from attacker profit",
    "eko.akis.kalan": "remaining profit",
    "eko.akis.kalanKar": "Remaining profit",
    "eko.akis.kalanKar.karsiz": "attack made unprofitable",
    "eko.akis.kalanKar.marjinal": "only marginal profit left",
    "eko.akis.caydirildi": "classes deterred",

    "eko.dikey.baslik": "Deterrence · profit per class (unprotected vs with Veylify)",
    "eko.dikey.korumasiz": "Unprotected profit",
    "eko.dikey.ile": "With Veylify",
    "eko.dikey.marjinalKalan": "Marginal remaining profit",
    "eko.dikey.caydirilan": "Deterred (≈0)",

    "eko.gauge.baslik": "Deterrence rate",
    "eko.gauge.alt": "attack classes made unprofitable",

    "eko.donut.baslik": "Attacker profit pool · by type",
    "eko.donut.merkez": "$ raw profit",
    "eko.donut.bos": "No measurable attacker profit.",

    "eko.band.baslik": "Attacker profitability: without Veylify → with Veylify",
    "eko.band.yokken": "WITHOUT Veylify",
    "eko.band.yokken.aciklama":
      "The attackers' expected total profit at this traffic volume — the attack pays off, so they come back.",
    "eko.band.varken": "WITH Veylify",
    "eko.band.varken.karsiz":
      "The attack is unprofitable — cost exceeds return, so the attacker moves to another target.",
    "eko.band.varken.marjinal":
      "Profit is largely eroded; the attack has become marginal.",

    "eko.sinif.caydirildi": "Deterred (unprofitable)",
    "eko.sinif.marjinal": "Still marginally profitable",
    "eko.sinif.istek": "observed requests",
    "eko.sinif.artis": "cost increase per success",

    "eko.kol.yoksuz": "Without Veylify",
    "eko.kol.varsul": "With Veylify",
    "eko.kol.altyapi": "Infrastructure cost",
    "eko.kol.basari": "Expected successes",
    "eko.kol.getiri": "Return",
    "eko.kol.netKar": "Net profit",
    "eko.kol.roi": "Attacker ROI",
    "eko.kol.negatif": "negative",

    "eko.eylem.baslik": "Deterrence = lasting defense",
    "eko.eylem.aciklama":
      "Blocking a bot once isn't enough; making the attack <b>unprofitable</b> makes them give up entirely. Tighten the remaining profitable classes with rules + rate limiting.",
    "eko.eylem.buton": "Auto-remediation",

    "eko.not":
      "<b>Real:</b> how many requests each attack class produced (from the {n} observed events). <b>Model:</b> unit costs (proxy/IP rent ~$0.5-3/GB, CAPTCHA-solving farm ~$1-3/1000, stolen-account value) are the midpoints of industry reference ranges — an economic <i>model</i>, not an exact measurement. Veylify's success-reduction and cost-increase multipliers are conservative estimates of the ghost-font + behavioral-scoring effect.",

    "eko.ad.credential_stuffing": "Credential Stuffing",
    "eko.ad.scraper": "Content Scraping",
    "eko.ad.ai_agent": "AI Training Crawl",
    "eko.ad.ddos": "DDoS Flood",
    "eko.ad.spam": "Spam/Fake Signup",
    "eko.ad.automation": "General Automation",

    "eko.amac.credential_stuffing": "Account takeover",
    "eko.amac.scraper": "Data/price harvesting",
    "eko.amac.ai_agent": "Model training data",
    "eko.amac.ddos": "Service disruption",
    "eko.amac.spam": "Fake accounts/content",
    "eko.amac.automation": "Assorted abuse",
  },

  de: {
    "eko.baslik": "Bot-Ökonomie & Abschreckungsmodell",

    "eko.serit.baslik": "Bots zu stoppen ist kein technischer, sondern ein ökonomischer Kampf.",
    "eko.serit.aciklama":
      "Ein Angreifer macht nur weiter, solange der <b>erwartete Ertrag die Kosten übersteigt</b>. Mit Ghost-Font-Unlösbarkeit + Verhaltensbewertung + Ratenbegrenzung hebt Veylify die Kosten pro Angriff über die Abschreckungsschwelle. Unten die Ökonomie jeder Angriffsklasse: wie Veylify den Gewinn des Angreifers auf <b>null</b> treibt.",

    "eko.bos.baslik": "Noch kein Angriffsverkehr mit messbarer Ökonomie",
    "eko.bos.aciklama":
      "In den {n} beobachteten Ereignissen wurde kein bekannter bösartiger Klassenverkehr gefunden. Sobald Angriffe eintreffen, erscheint hier die Abschreckungsökonomie.",

    "eko.kpi.silinenKar": "Gelöschter Angreifergewinn",
    "eko.kpi.caydirilan": "Unrentabel gemachte Angriffsklassen",
    "eko.kpi.ortArtis": "Ø Kostensteigerung (pro Erfolg)",
    "eko.kpi.kalanKar": "Verbleibender Angreifergewinn (mit Veylify)",

    "eko.akis.baslik": "Gewinn-Löschung: Rohgewinn → Schutz → Verbleib",
    "eko.akis.ham": "Roher Angreifergewinn",
    "eko.akis.ham.alt": "erwarteter Gesamtgewinn ohne Veylify",
    "eko.akis.istek": "beobachtete Anfragen",
    "eko.akis.maliyet": "Kostensteigerung",
    "eko.akis.silinen": "Gelöschter Gewinn",
    "eko.akis.silinen.alt": "vom Angreifergewinn gelöscht",
    "eko.akis.kalan": "verbleibender Gewinn",
    "eko.akis.kalanKar": "Verbleibender Gewinn",
    "eko.akis.kalanKar.karsiz": "Angriff unrentabel gemacht",
    "eko.akis.kalanKar.marjinal": "nur marginaler Gewinn übrig",
    "eko.akis.caydirildi": "Klassen abgeschreckt",

    "eko.dikey.baslik": "Abschreckung · Gewinn pro Klasse (ungeschützt vs mit Veylify)",
    "eko.dikey.korumasiz": "Ungeschützter Gewinn",
    "eko.dikey.ile": "Mit Veylify",
    "eko.dikey.marjinalKalan": "Marginaler Restgewinn",
    "eko.dikey.caydirilan": "Abgeschreckt (≈0)",

    "eko.gauge.baslik": "Abschreckungsrate",
    "eko.gauge.alt": "Angriffsklassen unrentabel gemacht",

    "eko.donut.baslik": "Angreifer-Gewinnpool · nach Typ",
    "eko.donut.merkez": "$ Rohgewinn",
    "eko.donut.bos": "Kein messbarer Angreifergewinn.",

    "eko.band.baslik": "Angreiferrentabilität: ohne Veylify → mit Veylify",
    "eko.band.yokken": "OHNE Veylify",
    "eko.band.yokken.aciklama":
      "Der erwartete Gesamtgewinn der Angreifer bei diesem Verkehrsvolumen — der Angriff lohnt sich, also kommen sie wieder.",
    "eko.band.varken": "MIT Veylify",
    "eko.band.varken.karsiz":
      "Der Angriff ist unrentabel — die Kosten übersteigen den Ertrag, der Angreifer wechselt zu einem anderen Ziel.",
    "eko.band.varken.marjinal":
      "Der Gewinn ist weitgehend aufgezehrt; der Angriff ist marginal geworden.",

    "eko.sinif.caydirildi": "Abgeschreckt (unrentabel)",
    "eko.sinif.marjinal": "Noch marginal profitabel",
    "eko.sinif.istek": "beobachtete Anfragen",
    "eko.sinif.artis": "Kostensteigerung pro Erfolg",

    "eko.kol.yoksuz": "Ohne Veylify",
    "eko.kol.varsul": "Mit Veylify",
    "eko.kol.altyapi": "Infrastrukturkosten",
    "eko.kol.basari": "Erwartete Erfolge",
    "eko.kol.getiri": "Ertrag",
    "eko.kol.netKar": "Nettogewinn",
    "eko.kol.roi": "Angreifer-ROI",
    "eko.kol.negatif": "negativ",

    "eko.eylem.baslik": "Abschreckung = dauerhafte Verteidigung",
    "eko.eylem.aciklama":
      "Einen Bot einmal zu blockieren reicht nicht; den Angriff <b>unrentabel</b> zu machen bringt sie zum völligen Aufgeben. Verschärfen Sie die verbleibenden profitablen Klassen mit Regeln + Ratenbegrenzung.",
    "eko.eylem.buton": "Automatische Behebung",

    "eko.not":
      "<b>Real:</b> wie viele Anfragen jede Angriffsklasse erzeugt hat (aus den {n} beobachteten Ereignissen). <b>Modell:</b> Stückkosten (Proxy-/IP-Miete ~$0,5-3/GB, CAPTCHA-Lösungsfarm ~$1-3/1000, Wert gestohlener Konten) sind die Mittelwerte von Branchenreferenzbereichen — ein ökonomisches <i>Modell</i>, keine exakte Messung. Veylifys Multiplikatoren für Erfolgsminderung und Kostensteigerung sind konservative Schätzungen des Ghost-Font- + Verhaltensbewertungseffekts.",

    "eko.ad.credential_stuffing": "Credential Stuffing",
    "eko.ad.scraper": "Content-Scraping",
    "eko.ad.ai_agent": "KI-Trainings-Crawl",
    "eko.ad.ddos": "DDoS-Flut",
    "eko.ad.spam": "Spam/Fake-Registrierung",
    "eko.ad.automation": "Allgemeine Automatisierung",

    "eko.amac.credential_stuffing": "Kontoübernahme",
    "eko.amac.scraper": "Daten-/Preiserfassung",
    "eko.amac.ai_agent": "Modelltrainingsdaten",
    "eko.amac.ddos": "Dienstunterbrechung",
    "eko.amac.spam": "Fake-Konten/-Inhalte",
    "eko.amac.automation": "Diverser Missbrauch",
  },

  fr: {
    "eko.baslik": "Économie des bots et modèle de dissuasion",

    "eko.serit.baslik": "Arrêter les bots n'est pas une guerre technique, mais économique.",
    "eko.serit.aciklama":
      "Un attaquant ne continue que tant que le <b>rendement attendu dépasse le coût</b>. Avec l'insolvabilité ghost-font + le score comportemental + la limitation de débit, Veylify porte le coût par attaque au-dessus du seuil de dissuasion. Ci-dessous, l'économie de chaque classe d'attaque : comment Veylify ramène le profit de l'attaquant à <b>zéro</b>.",

    "eko.bos.baslik": "Pas encore de trafic d'attaque à l'économie mesurable",
    "eko.bos.aciklama":
      "Aucun trafic de classe malveillante connue n'a été trouvé dans les {n} événements observés. À mesure que les attaques arrivent, l'économie de dissuasion apparaîtra ici.",

    "eko.kpi.silinenKar": "Profit d'attaquant effacé",
    "eko.kpi.caydirilan": "Classes d'attaque rendues non rentables",
    "eko.kpi.ortArtis": "Hausse moy. du coût (par succès)",
    "eko.kpi.kalanKar": "Profit d'attaquant restant (avec Veylify)",

    "eko.akis.baslik": "Effacement du profit : profit brut → protection → reste",
    "eko.akis.ham": "Profit brut de l'attaquant",
    "eko.akis.ham.alt": "profit total attendu sans Veylify",
    "eko.akis.istek": "requêtes observées",
    "eko.akis.maliyet": "hausse de coût",
    "eko.akis.silinen": "Profit effacé",
    "eko.akis.silinen.alt": "effacé du profit de l'attaquant",
    "eko.akis.kalan": "profit restant",
    "eko.akis.kalanKar": "Profit restant",
    "eko.akis.kalanKar.karsiz": "attaque rendue non rentable",
    "eko.akis.kalanKar.marjinal": "seul un profit marginal subsiste",
    "eko.akis.caydirildi": "classes dissuadées",

    "eko.dikey.baslik": "Dissuasion · profit par classe (non protégé vs avec Veylify)",
    "eko.dikey.korumasiz": "Profit non protégé",
    "eko.dikey.ile": "Avec Veylify",
    "eko.dikey.marjinalKalan": "Profit résiduel marginal",
    "eko.dikey.caydirilan": "Dissuadé (≈0)",

    "eko.gauge.baslik": "Taux de dissuasion",
    "eko.gauge.alt": "classes d'attaque rendues non rentables",

    "eko.donut.baslik": "Pool de profit de l'attaquant · par type",
    "eko.donut.merkez": "$ profit brut",
    "eko.donut.bos": "Aucun profit d'attaquant mesurable.",

    "eko.band.baslik": "Rentabilité de l'attaquant : sans Veylify → avec Veylify",
    "eko.band.yokken": "SANS Veylify",
    "eko.band.yokken.aciklama":
      "Le profit total attendu des attaquants à ce volume de trafic — l'attaque est rentable, ils reviennent donc.",
    "eko.band.varken": "AVEC Veylify",
    "eko.band.varken.karsiz":
      "L'attaque n'est pas rentable — le coût dépasse le rendement, l'attaquant se tourne vers une autre cible.",
    "eko.band.varken.marjinal":
      "Le profit est largement érodé ; l'attaque est devenue marginale.",

    "eko.sinif.caydirildi": "Dissuadé (non rentable)",
    "eko.sinif.marjinal": "Encore marginalement rentable",
    "eko.sinif.istek": "requêtes observées",
    "eko.sinif.artis": "hausse du coût par succès",

    "eko.kol.yoksuz": "Sans Veylify",
    "eko.kol.varsul": "Avec Veylify",
    "eko.kol.altyapi": "Coût d'infrastructure",
    "eko.kol.basari": "Succès attendus",
    "eko.kol.getiri": "Rendement",
    "eko.kol.netKar": "Profit net",
    "eko.kol.roi": "ROI de l'attaquant",
    "eko.kol.negatif": "négatif",

    "eko.eylem.baslik": "Dissuasion = défense durable",
    "eko.eylem.aciklama":
      "Bloquer un bot une fois ne suffit pas ; rendre l'attaque <b>non rentable</b> les fait renoncer totalement. Renforcez les classes rentables restantes avec des règles + une limitation de débit.",
    "eko.eylem.buton": "Correction automatique",

    "eko.not":
      "<b>Réel :</b> combien de requêtes chaque classe d'attaque a produites (à partir des {n} événements observés). <b>Modèle :</b> les coûts unitaires (location proxy/IP ~$0,5-3/Go, ferme de résolution CAPTCHA ~$1-3/1000, valeur des comptes volés) sont les valeurs médianes des plages de référence du secteur — un <i>modèle</i> économique, pas une mesure exacte. Les multiplicateurs de réduction de succès et de hausse de coût de Veylify sont des estimations prudentes de l'effet ghost-font + score comportemental.",

    "eko.ad.credential_stuffing": "Credential stuffing",
    "eko.ad.scraper": "Extraction de contenu",
    "eko.ad.ai_agent": "Crawl d'entraînement IA",
    "eko.ad.ddos": "Déluge DDoS",
    "eko.ad.spam": "Spam/Inscription factice",
    "eko.ad.automation": "Automatisation générale",

    "eko.amac.credential_stuffing": "Prise de contrôle de compte",
    "eko.amac.scraper": "Collecte de données/prix",
    "eko.amac.ai_agent": "Données d'entraînement de modèle",
    "eko.amac.ddos": "Interruption de service",
    "eko.amac.spam": "Comptes/contenus factices",
    "eko.amac.automation": "Abus divers",
  },

  es: {
    "eko.baslik": "Economía de bots y modelo de disuasión",

    "eko.serit.baslik": "Detener bots no es una guerra técnica, sino económica.",
    "eko.serit.aciklama":
      "Un atacante solo continúa mientras el <b>rendimiento esperado supere el costo</b>. Con la irresolubilidad ghost-font + la puntuación de comportamiento + la limitación de tasa, Veylify eleva el costo por ataque por encima del umbral de disuasión. A continuación, la economía de cada clase de ataque: cómo Veylify reduce a <b>cero</b> el beneficio del atacante.",

    "eko.bos.baslik": "Aún no hay tráfico de ataque con economía medible",
    "eko.bos.aciklama":
      "No se encontró tráfico de clase maliciosa conocida en los {n} eventos observados. A medida que lleguen ataques, la economía de disuasión aparecerá aquí.",

    "eko.kpi.silinenKar": "Beneficio del atacante borrado",
    "eko.kpi.caydirilan": "Clases de ataque hechas no rentables",
    "eko.kpi.ortArtis": "Aumento medio de costo (por éxito)",
    "eko.kpi.kalanKar": "Beneficio del atacante restante (con Veylify)",

    "eko.akis.baslik": "Flujo de borrado de beneficio: bruto → protección → resto",
    "eko.akis.ham": "Beneficio bruto del atacante",
    "eko.akis.ham.alt": "beneficio total esperado sin Veylify",
    "eko.akis.istek": "solicitudes observadas",
    "eko.akis.maliyet": "aumento de costo",
    "eko.akis.silinen": "Beneficio borrado",
    "eko.akis.silinen.alt": "borrado del beneficio del atacante",
    "eko.akis.kalan": "beneficio restante",
    "eko.akis.kalanKar": "Beneficio restante",
    "eko.akis.kalanKar.karsiz": "ataque hecho no rentable",
    "eko.akis.kalanKar.marjinal": "solo queda beneficio marginal",
    "eko.akis.caydirildi": "clases disuadidas",

    "eko.dikey.baslik": "Disuasión · beneficio por clase (sin protección vs con Veylify)",
    "eko.dikey.korumasiz": "Beneficio sin protección",
    "eko.dikey.ile": "Con Veylify",
    "eko.dikey.marjinalKalan": "Beneficio residual marginal",
    "eko.dikey.caydirilan": "Disuadido (≈0)",

    "eko.gauge.baslik": "Tasa de disuasión",
    "eko.gauge.alt": "clases de ataque hechas no rentables",

    "eko.donut.baslik": "Fondo de beneficio del atacante · por tipo",
    "eko.donut.merkez": "$ beneficio bruto",
    "eko.donut.bos": "Sin beneficio de atacante medible.",

    "eko.band.baslik": "Rentabilidad del atacante: sin Veylify → con Veylify",
    "eko.band.yokken": "SIN Veylify",
    "eko.band.yokken.aciklama":
      "El beneficio total esperado de los atacantes con este volumen de tráfico: el ataque es rentable, así que vuelven.",
    "eko.band.varken": "CON Veylify",
    "eko.band.varken.karsiz":
      "El ataque no es rentable: el costo supera el rendimiento, así que el atacante se dirige a otro objetivo.",
    "eko.band.varken.marjinal":
      "El beneficio se ha erosionado en gran medida; el ataque se ha vuelto marginal.",

    "eko.sinif.caydirildi": "Disuadido (no rentable)",
    "eko.sinif.marjinal": "Aún marginalmente rentable",
    "eko.sinif.istek": "solicitudes observadas",
    "eko.sinif.artis": "aumento de costo por éxito",

    "eko.kol.yoksuz": "Sin Veylify",
    "eko.kol.varsul": "Con Veylify",
    "eko.kol.altyapi": "Costo de infraestructura",
    "eko.kol.basari": "Éxitos esperados",
    "eko.kol.getiri": "Rendimiento",
    "eko.kol.netKar": "Beneficio neto",
    "eko.kol.roi": "ROI del atacante",
    "eko.kol.negatif": "negativo",

    "eko.eylem.baslik": "Disuasión = defensa duradera",
    "eko.eylem.aciklama":
      "Bloquear un bot una vez no basta; hacer que el ataque sea <b>no rentable</b> los hace desistir por completo. Endurezca las clases rentables restantes con reglas + limitación de tasa.",
    "eko.eylem.buton": "Corrección automática",

    "eko.not":
      "<b>Real:</b> cuántas solicitudes generó cada clase de ataque (a partir de los {n} eventos observados). <b>Modelo:</b> los costos unitarios (alquiler de proxy/IP ~$0,5-3/GB, granja de resolución de CAPTCHA ~$1-3/1000, valor de cuentas robadas) son los valores medios de los rangos de referencia del sector: un <i>modelo</i> económico, no una medición exacta. Los multiplicadores de reducción de éxito y aumento de costo de Veylify son estimaciones conservadoras del efecto ghost-font + puntuación de comportamiento.",

    "eko.ad.credential_stuffing": "Credential stuffing",
    "eko.ad.scraper": "Extracción de contenido",
    "eko.ad.ai_agent": "Rastreo de entrenamiento de IA",
    "eko.ad.ddos": "Inundación DDoS",
    "eko.ad.spam": "Spam/Registro falso",
    "eko.ad.automation": "Automatización general",

    "eko.amac.credential_stuffing": "Robo de cuenta",
    "eko.amac.scraper": "Recolección de datos/precios",
    "eko.amac.ai_agent": "Datos de entrenamiento de modelos",
    "eko.amac.ddos": "Interrupción del servicio",
    "eko.amac.spam": "Cuentas/contenido falsos",
    "eko.amac.automation": "Abuso diverso",
  },
};

export function botEkonomiCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
