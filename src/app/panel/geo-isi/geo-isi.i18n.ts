/**
 * Coğrafi Isı Haritası — yerel i18n sözlüğü.
 * =========================================
 * Yalnızca bu sayfaya özgü metinler. Ortak/nav anahtarları için lib'deki
 * `ceviri()` kullanılır. Ülke adları @/lib/flag'ten gelir (çevrilmez),
 * ASN kodları veri olarak kalır, sayı/tarih/IP biçimlemesi ayrıca yapılır.
 *
 * Kademe etiketleri (Kritik/Yüksek/Orta/Düşük/Asgari) ve bölge etiketleri
 * lib'de TR üretildiğinden burada anahtar bazlı yeniden türetilir; lib
 * DEĞİŞTİRİLMEZ.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // başlık şeridi
    "serit.baslik": "Tehdidin coğrafi yoğunluğunu ısı haritasında oku.",
    "serit.aciklama.1": "Her ülke, bot hacmi + engelleme oranı + düşük skordan harmanlanan bir",
    "serit.aciklama.yogunlukPuan": "yoğunluk puanı",
    "serit.aciklama.2":
      "(0-100) ile tonlanır. Bir ülkeye tıkla → ASN, bot sınıfı ve zaman kırılımını gör; kaydırıcıyı oynat → tehdit coğrafyasının zamanla nasıl kaydığını izle. Gösterilen yalnızca",
    "serit.aciklama.gozlemlenen": "senin gözlemlenen trafiğin",
    "serit.aciklama.3": "dir.",

    // özet kartlar
    "ozet.trafikKaynagi": "Trafik kaynağı ülke",
    "ozet.enYogunUlke": "En yoğun tehdit ülkesi",
    "ozet.kritikKademe": "Kritik kademe ülke (≥80)",
    "ozet.genelBot": "Genel bot oranı",

    // harita
    "harita.baslik": "Tehdit Yoğunluğu Isı Haritası",
    "harita.dusuk": "Düşük",
    "harita.kritik": "Kritik",
    "harita.ariaLabel": "Coğrafi tehdit yoğunluğu ısı haritası",
    "harita.ulkeHaritalandi": "{n} ülke haritalandı",
    "harita.hucreBoyutu": "Hücre boyutu = hacim + yoğunluk",
    "harita.detayIcinTikla": "Detay için tıkla →",
    "ortak.kapat": "Kapat",

    // tooltip / drilldown metrikleri
    "metrik.toplam": "Toplam",
    "metrik.botOrani": "Bot oranı",
    "metrik.engellenen": "Engellenen",
    "metrik.baskinTehdit": "Baskın tehdit",
    "metrik.engelOrani": "Engel oranı",

    // zaman kaydırıcı
    "zaman.baslik": "Zaman kaydırıcı",
    "zaman.tumPencere": "Tüm pencere (canlı)",
    "zaman.oynat": "Oynat",
    "zaman.duraklat": "Duraklat",
    "zaman.canliyaDon": "Canlıya dön",
    "zaman.simdi": "Şimdi",
    "zaman.pencere": "{gun} günlük pencere · {n} dilim",
    "zaman.sliderAria": "Zaman dilimi seçici",
    "zaman.dilimTitle": "{ara}: {n} olay",
    "zaman.dilimAria": "Dilim {i}: {n} olay",

    // drilldown boş durum
    "drill.ulkeSec": "Bir ülke seç",
    "drill.ulkeSecAciklama":
      "Haritadan veya alttaki sıralamadan bir ülkeye tıkla; ASN, bot sınıfı ve zaman kırılımını burada gör.",
    "drill.yogunluk": "yoğunluk {n}",
    "drill.enYogunAglar": "En yoğun ağlar (ASN)",
    "drill.asnYok": "ASN verisi yok.",
    "drill.botKirilim": "Bot sınıfı kırılımı",
    "drill.botKirilimYok": "Bu ülkeden bot sınıfı olayı gözlemlenmedi.",
    "drill.yanitDagilimi": "Yanıt dağılımı",
    "drill.engellenenTitle": "Engellenen/doğrulanan",
    "drill.izinVerilenTitle": "İzin verilen",
    "drill.engellenenLabel": "{n} engellenen/doğrulanan",
    "drill.izinLabel": "{n} izin",
    "drill.ctaAciklama":
      "için coğrafi bir kural oluştur — bu kaynaktan gelen trafiği engelle, doğrula veya yakından izle.",
    "drill.ctaButon": "{ulke} için kural oluştur",

    // ülke sıralaması
    "siralama.baslik": "Tehdit ülke sıralaması",
    "siralama.tumPencere": "tüm pencere",
    "siralama.seciliDilim": "seçili dilim",
    "siralama.ulkeSayisi": "{n} ülke",
    "siralama.trafikYok": "Bu dönemde trafik gözlemlenmedi.",
    "siralama.engel": "{n} engel",

    // bölgesel özet
    "bolge.baslik": "Bölgesel özet",
    "bolge.veriYok": "Bölge verisi yok.",
    "bolge.ulkeOlay": "{ulke} ülke · {olay} olay",

    // dürüstlük notu
    "not.1": "Bu ısı haritası",
    "not.kuresel": "küresel bir tehdit gerçeği değildir",
    "not.2":
      "— yalnızca Veylify'ın senin sitelerinde gözlemlediği trafiği yansıtır. Yoğunluk puanı ülkeler arası",
    "not.goreli": "göreli",
    "not.3":
      "bir ölçektir (log-ölçekli hacim + engelleme oranı + ortalama skor). Coğrafi konumlar yaklaşık ülke merkezleridir.",

    // ısı kademe etiketleri (lib'den yeniden türetilir)
    "kademe.kritik": "Kritik",
    "kademe.yuksek": "Yüksek",
    "kademe.orta": "Orta",
    "kademe.dusuk": "Düşük",
    "kademe.asgari": "Asgari",

    // bölge etiketleri (lib'den yeniden türetilir)
    "bolge.avrupa": "Avrupa",
    "bolge.asya": "Asya-Pasifik",
    "bolge.amerika": "Amerika",
    "bolge.afrika": "Afrika",
    "bolge.ortadogu": "Ortadoğu & Orta Asya",
    "bolge.diger": "Diğer",

    // yeni görsel bölümler (donut / ısı-matris / ASN)
    "gorsel.bolgeDagilim": "Bölge dağılımı",
    "gorsel.bolgeDagilimAlt": "Gözlemlenen olayların kıtalara göre payı",
    "gorsel.bolgeMerkez": "olay",
    "gorsel.isiMatris": "Gün × dilim risk yoğunluğu",
    "gorsel.isiMatrisAlt": "Her hücre o zaman diliminin en yoğun ülke puanı (0-100)",
    "gorsel.asnBaslik": "ASN kategori dağılımı",
    "gorsel.asnAlt": "Trafiğin ağ altyapısı türüne göre kırılımı",
    "gorsel.asnVeriYok": "Kategorize edilecek ASN yok",
    "gorsel.asnHosting": "Barındırma / Bulut",
    "gorsel.asnIsp": "İSS / Erişim",
    "gorsel.asnMobil": "Mobil operatör",
    "gorsel.asnBilinmeyen": "Bilinmeyen / Diğer",
    "gorsel.matrisDilim": "Dilim",

    // bot sınıfı etiketleri
    "bot.human": "İnsan",
    "bot.good_bot": "İyi bot",
    "bot.automation": "Otomasyon",
    "bot.scraper": "Kazıyıcı",
    "bot.credential_stuffing": "Kimlik doldurma",
    "bot.ai_agent": "AI ajan",
    "bot.ddos": "DDoS",
    "bot.spam": "Spam",

    // ay kısaltmaları (tarih biçimlemesi)
    "ay.0": "Oca", "ay.1": "Şub", "ay.2": "Mar", "ay.3": "Nis",
    "ay.4": "May", "ay.5": "Haz", "ay.6": "Tem", "ay.7": "Ağu",
    "ay.8": "Eyl", "ay.9": "Eki", "ay.10": "Kas", "ay.11": "Ara",
  },

  en: {
    "serit.baslik": "Read the geographic intensity of the threat on the heatmap.",
    "serit.aciklama.1": "Each country is shaded by a",
    "serit.aciklama.yogunlukPuan": "intensity score",
    "serit.aciklama.2":
      "(0-100) blended from bot volume + block rate + low score. Click a country → see its ASN, bot-class and time breakdown; play the slider → watch how the threat geography shifts over time. What's shown is only",
    "serit.aciklama.gozlemlenen": "your observed traffic",
    "serit.aciklama.3": ".",

    "ozet.trafikKaynagi": "Traffic-source countries",
    "ozet.enYogunUlke": "Most intense threat country",
    "ozet.kritikKademe": "Critical-tier countries (≥80)",
    "ozet.genelBot": "Overall bot rate",

    "harita.baslik": "Threat Intensity Heatmap",
    "harita.dusuk": "Low",
    "harita.kritik": "Critical",
    "harita.ariaLabel": "Geographic threat intensity heatmap",
    "harita.ulkeHaritalandi": "{n} countries mapped",
    "harita.hucreBoyutu": "Cell size = volume + intensity",
    "harita.detayIcinTikla": "Click for details →",
    "ortak.kapat": "Close",

    "metrik.toplam": "Total",
    "metrik.botOrani": "Bot rate",
    "metrik.engellenen": "Blocked",
    "metrik.baskinTehdit": "Dominant threat",
    "metrik.engelOrani": "Block rate",

    "zaman.baslik": "Time slider",
    "zaman.tumPencere": "Full window (live)",
    "zaman.oynat": "Play",
    "zaman.duraklat": "Pause",
    "zaman.canliyaDon": "Back to live",
    "zaman.simdi": "Now",
    "zaman.pencere": "{gun}-day window · {n} slices",
    "zaman.sliderAria": "Time slice selector",
    "zaman.dilimTitle": "{ara}: {n} events",
    "zaman.dilimAria": "Slice {i}: {n} events",

    "drill.ulkeSec": "Select a country",
    "drill.ulkeSecAciklama":
      "Click a country on the map or in the ranking below; see its ASN, bot-class and time breakdown here.",
    "drill.yogunluk": "intensity {n}",
    "drill.enYogunAglar": "Busiest networks (ASN)",
    "drill.asnYok": "No ASN data.",
    "drill.botKirilim": "Bot-class breakdown",
    "drill.botKirilimYok": "No bot-class events observed from this country.",
    "drill.yanitDagilimi": "Response distribution",
    "drill.engellenenTitle": "Blocked/challenged",
    "drill.izinVerilenTitle": "Allowed",
    "drill.engellenenLabel": "{n} blocked/challenged",
    "drill.izinLabel": "{n} allowed",
    "drill.ctaAciklama":
      "— create a geographic rule to block, challenge or closely monitor traffic from this source.",
    "drill.ctaButon": "Create rule for {ulke}",

    "siralama.baslik": "Threat country ranking",
    "siralama.tumPencere": "full window",
    "siralama.seciliDilim": "selected slice",
    "siralama.ulkeSayisi": "{n} countries",
    "siralama.trafikYok": "No traffic observed in this period.",
    "siralama.engel": "{n} blocked",

    "bolge.baslik": "Regional summary",
    "bolge.veriYok": "No regional data.",
    "bolge.ulkeOlay": "{ulke} countries · {olay} events",

    "not.1": "This heatmap",
    "not.kuresel": "is not a global threat ground truth",
    "not.2":
      "— it reflects only the traffic Veylify observed on your sites. The intensity score is a",
    "not.goreli": "relative",
    "not.3":
      "scale across countries (log-scaled volume + block rate + average score). Geographic positions are approximate country centers.",

    "kademe.kritik": "Critical",
    "kademe.yuksek": "High",
    "kademe.orta": "Medium",
    "kademe.dusuk": "Low",
    "kademe.asgari": "Minimal",

    "bolge.avrupa": "Europe",
    "bolge.asya": "Asia-Pacific",
    "bolge.amerika": "Americas",
    "bolge.afrika": "Africa",
    "bolge.ortadogu": "Middle East & Central Asia",
    "bolge.diger": "Other",

    "bot.human": "Human",
    "bot.good_bot": "Good bot",
    "bot.automation": "Automation",
    "bot.scraper": "Scraper",
    "bot.credential_stuffing": "Credential stuffing",
    "bot.ai_agent": "AI agent",
    "bot.ddos": "DDoS",
    "bot.spam": "Spam",

    "ay.0": "Jan", "ay.1": "Feb", "ay.2": "Mar", "ay.3": "Apr",
    "ay.4": "May", "ay.5": "Jun", "ay.6": "Jul", "ay.7": "Aug",
    "ay.8": "Sep", "ay.9": "Oct", "ay.10": "Nov", "ay.11": "Dec",
  },

  de: {
    "serit.baslik": "Lesen Sie die geografische Intensität der Bedrohung auf der Heatmap.",
    "serit.aciklama.1": "Jedes Land wird durch einen",
    "serit.aciklama.yogunlukPuan": "Intensitätswert",
    "serit.aciklama.2":
      "(0-100) eingefärbt, gemischt aus Bot-Volumen + Blockrate + niedrigem Score. Klicken Sie auf ein Land → sehen Sie dessen ASN-, Bot-Klassen- und Zeitaufschlüsselung; spielen Sie den Schieberegler ab → beobachten Sie, wie sich die Bedrohungsgeografie im Laufe der Zeit verschiebt. Angezeigt wird nur",
    "serit.aciklama.gozlemlenen": "Ihr beobachteter Traffic",
    "serit.aciklama.3": ".",

    "ozet.trafikKaynagi": "Traffic-Herkunftsländer",
    "ozet.enYogunUlke": "Intensivstes Bedrohungsland",
    "ozet.kritikKademe": "Länder der kritischen Stufe (≥80)",
    "ozet.genelBot": "Gesamt-Bot-Rate",

    "harita.baslik": "Bedrohungsintensitäts-Heatmap",
    "harita.dusuk": "Niedrig",
    "harita.kritik": "Kritisch",
    "harita.ariaLabel": "Geografische Bedrohungsintensitäts-Heatmap",
    "harita.ulkeHaritalandi": "{n} Länder kartiert",
    "harita.hucreBoyutu": "Zellengröße = Volumen + Intensität",
    "harita.detayIcinTikla": "Für Details klicken →",
    "ortak.kapat": "Schließen",

    "metrik.toplam": "Gesamt",
    "metrik.botOrani": "Bot-Rate",
    "metrik.engellenen": "Blockiert",
    "metrik.baskinTehdit": "Dominante Bedrohung",
    "metrik.engelOrani": "Blockrate",

    "zaman.baslik": "Zeitschieberegler",
    "zaman.tumPencere": "Gesamtes Fenster (live)",
    "zaman.oynat": "Abspielen",
    "zaman.duraklat": "Pausieren",
    "zaman.canliyaDon": "Zurück zu live",
    "zaman.simdi": "Jetzt",
    "zaman.pencere": "{gun}-Tage-Fenster · {n} Segmente",
    "zaman.sliderAria": "Zeitsegment-Auswahl",
    "zaman.dilimTitle": "{ara}: {n} Ereignisse",
    "zaman.dilimAria": "Segment {i}: {n} Ereignisse",

    "drill.ulkeSec": "Wählen Sie ein Land",
    "drill.ulkeSecAciklama":
      "Klicken Sie auf ein Land auf der Karte oder im Ranking unten; sehen Sie dessen ASN-, Bot-Klassen- und Zeitaufschlüsselung hier.",
    "drill.yogunluk": "Intensität {n}",
    "drill.enYogunAglar": "Aktivste Netzwerke (ASN)",
    "drill.asnYok": "Keine ASN-Daten.",
    "drill.botKirilim": "Bot-Klassen-Aufschlüsselung",
    "drill.botKirilimYok": "Keine Bot-Klassen-Ereignisse aus diesem Land beobachtet.",
    "drill.yanitDagilimi": "Antwortverteilung",
    "drill.engellenenTitle": "Blockiert/herausgefordert",
    "drill.izinVerilenTitle": "Erlaubt",
    "drill.engellenenLabel": "{n} blockiert/herausgefordert",
    "drill.izinLabel": "{n} erlaubt",
    "drill.ctaAciklama":
      "— erstellen Sie eine geografische Regel, um Traffic aus dieser Quelle zu blockieren, herauszufordern oder genau zu überwachen.",
    "drill.ctaButon": "Regel für {ulke} erstellen",

    "siralama.baslik": "Bedrohungsländer-Ranking",
    "siralama.tumPencere": "gesamtes Fenster",
    "siralama.seciliDilim": "ausgewähltes Segment",
    "siralama.ulkeSayisi": "{n} Länder",
    "siralama.trafikYok": "In diesem Zeitraum kein Traffic beobachtet.",
    "siralama.engel": "{n} blockiert",

    "bolge.baslik": "Regionale Zusammenfassung",
    "bolge.veriYok": "Keine regionalen Daten.",
    "bolge.ulkeOlay": "{ulke} Länder · {olay} Ereignisse",

    "not.1": "Diese Heatmap",
    "not.kuresel": "ist keine globale Bedrohungsrealität",
    "not.2":
      "— sie spiegelt nur den Traffic wider, den Veylify auf Ihren Sites beobachtet hat. Der Intensitätswert ist eine",
    "not.goreli": "relative",
    "not.3":
      "Skala über Länder hinweg (log-skaliertes Volumen + Blockrate + Durchschnittsscore). Geografische Positionen sind ungefähre Ländermittelpunkte.",

    "kademe.kritik": "Kritisch",
    "kademe.yuksek": "Hoch",
    "kademe.orta": "Mittel",
    "kademe.dusuk": "Niedrig",
    "kademe.asgari": "Minimal",

    "bolge.avrupa": "Europa",
    "bolge.asya": "Asien-Pazifik",
    "bolge.amerika": "Amerika",
    "bolge.afrika": "Afrika",
    "bolge.ortadogu": "Naher Osten & Zentralasien",
    "bolge.diger": "Andere",

    "bot.human": "Mensch",
    "bot.good_bot": "Guter Bot",
    "bot.automation": "Automatisierung",
    "bot.scraper": "Scraper",
    "bot.credential_stuffing": "Credential Stuffing",
    "bot.ai_agent": "KI-Agent",
    "bot.ddos": "DDoS",
    "bot.spam": "Spam",

    "ay.0": "Jan", "ay.1": "Feb", "ay.2": "Mär", "ay.3": "Apr",
    "ay.4": "Mai", "ay.5": "Jun", "ay.6": "Jul", "ay.7": "Aug",
    "ay.8": "Sep", "ay.9": "Okt", "ay.10": "Nov", "ay.11": "Dez",
  },

  fr: {
    "serit.baslik": "Lisez l'intensité géographique de la menace sur la carte de chaleur.",
    "serit.aciklama.1": "Chaque pays est nuancé par un",
    "serit.aciklama.yogunlukPuan": "score d'intensité",
    "serit.aciklama.2":
      "(0-100) mélangé à partir du volume de bots + taux de blocage + score faible. Cliquez sur un pays → voyez sa répartition par ASN, classe de bot et temps ; lancez le curseur → observez comment la géographie de la menace évolue dans le temps. Ce qui est affiché n'est que",
    "serit.aciklama.gozlemlenen": "votre trafic observé",
    "serit.aciklama.3": ".",

    "ozet.trafikKaynagi": "Pays sources de trafic",
    "ozet.enYogunUlke": "Pays de menace le plus intense",
    "ozet.kritikKademe": "Pays de niveau critique (≥80)",
    "ozet.genelBot": "Taux de bots global",

    "harita.baslik": "Carte de chaleur d'intensité des menaces",
    "harita.dusuk": "Faible",
    "harita.kritik": "Critique",
    "harita.ariaLabel": "Carte de chaleur d'intensité des menaces géographiques",
    "harita.ulkeHaritalandi": "{n} pays cartographiés",
    "harita.hucreBoyutu": "Taille de cellule = volume + intensité",
    "harita.detayIcinTikla": "Cliquez pour les détails →",
    "ortak.kapat": "Fermer",

    "metrik.toplam": "Total",
    "metrik.botOrani": "Taux de bots",
    "metrik.engellenen": "Bloqués",
    "metrik.baskinTehdit": "Menace dominante",
    "metrik.engelOrani": "Taux de blocage",

    "zaman.baslik": "Curseur temporel",
    "zaman.tumPencere": "Fenêtre complète (en direct)",
    "zaman.oynat": "Lecture",
    "zaman.duraklat": "Pause",
    "zaman.canliyaDon": "Retour au direct",
    "zaman.simdi": "Maintenant",
    "zaman.pencere": "Fenêtre de {gun} jours · {n} tranches",
    "zaman.sliderAria": "Sélecteur de tranche temporelle",
    "zaman.dilimTitle": "{ara} : {n} événements",
    "zaman.dilimAria": "Tranche {i} : {n} événements",

    "drill.ulkeSec": "Sélectionnez un pays",
    "drill.ulkeSecAciklama":
      "Cliquez sur un pays de la carte ou du classement ci-dessous ; voyez ici sa répartition par ASN, classe de bot et temps.",
    "drill.yogunluk": "intensité {n}",
    "drill.enYogunAglar": "Réseaux les plus actifs (ASN)",
    "drill.asnYok": "Aucune donnée ASN.",
    "drill.botKirilim": "Répartition par classe de bot",
    "drill.botKirilimYok": "Aucun événement de classe de bot observé depuis ce pays.",
    "drill.yanitDagilimi": "Distribution des réponses",
    "drill.engellenenTitle": "Bloqués/défiés",
    "drill.izinVerilenTitle": "Autorisés",
    "drill.engellenenLabel": "{n} bloqués/défiés",
    "drill.izinLabel": "{n} autorisés",
    "drill.ctaAciklama":
      "— créez une règle géographique pour bloquer, défier ou surveiller de près le trafic de cette source.",
    "drill.ctaButon": "Créer une règle pour {ulke}",

    "siralama.baslik": "Classement des pays de menace",
    "siralama.tumPencere": "fenêtre complète",
    "siralama.seciliDilim": "tranche sélectionnée",
    "siralama.ulkeSayisi": "{n} pays",
    "siralama.trafikYok": "Aucun trafic observé sur cette période.",
    "siralama.engel": "{n} bloqués",

    "bolge.baslik": "Résumé régional",
    "bolge.veriYok": "Aucune donnée régionale.",
    "bolge.ulkeOlay": "{ulke} pays · {olay} événements",

    "not.1": "Cette carte de chaleur",
    "not.kuresel": "n'est pas une vérité terrain mondiale des menaces",
    "not.2":
      "— elle reflète uniquement le trafic que Veylify a observé sur vos sites. Le score d'intensité est une échelle",
    "not.goreli": "relative",
    "not.3":
      "entre pays (volume à échelle log + taux de blocage + score moyen). Les positions géographiques sont des centres de pays approximatifs.",

    "kademe.kritik": "Critique",
    "kademe.yuksek": "Élevé",
    "kademe.orta": "Moyen",
    "kademe.dusuk": "Faible",
    "kademe.asgari": "Minimal",

    "bolge.avrupa": "Europe",
    "bolge.asya": "Asie-Pacifique",
    "bolge.amerika": "Amériques",
    "bolge.afrika": "Afrique",
    "bolge.ortadogu": "Moyen-Orient & Asie centrale",
    "bolge.diger": "Autre",

    "bot.human": "Humain",
    "bot.good_bot": "Bon bot",
    "bot.automation": "Automatisation",
    "bot.scraper": "Scraper",
    "bot.credential_stuffing": "Bourrage d'identifiants",
    "bot.ai_agent": "Agent IA",
    "bot.ddos": "DDoS",
    "bot.spam": "Spam",

    "ay.0": "jan", "ay.1": "fév", "ay.2": "mar", "ay.3": "avr",
    "ay.4": "mai", "ay.5": "juin", "ay.6": "juil", "ay.7": "août",
    "ay.8": "sep", "ay.9": "oct", "ay.10": "nov", "ay.11": "déc",
  },

  es: {
    "serit.baslik": "Lee la intensidad geográfica de la amenaza en el mapa de calor.",
    "serit.aciklama.1": "Cada país se sombrea con una",
    "serit.aciklama.yogunlukPuan": "puntuación de intensidad",
    "serit.aciklama.2":
      "(0-100) combinada a partir del volumen de bots + tasa de bloqueo + puntuación baja. Haz clic en un país → ve su desglose por ASN, clase de bot y tiempo; reproduce el control deslizante → observa cómo cambia la geografía de la amenaza con el tiempo. Lo que se muestra es solo",
    "serit.aciklama.gozlemlenen": "tu tráfico observado",
    "serit.aciklama.3": ".",

    "ozet.trafikKaynagi": "Países de origen del tráfico",
    "ozet.enYogunUlke": "País de amenaza más intenso",
    "ozet.kritikKademe": "Países de nivel crítico (≥80)",
    "ozet.genelBot": "Tasa general de bots",

    "harita.baslik": "Mapa de calor de intensidad de amenazas",
    "harita.dusuk": "Bajo",
    "harita.kritik": "Crítico",
    "harita.ariaLabel": "Mapa de calor de intensidad de amenazas geográficas",
    "harita.ulkeHaritalandi": "{n} países mapeados",
    "harita.hucreBoyutu": "Tamaño de celda = volumen + intensidad",
    "harita.detayIcinTikla": "Haz clic para ver detalles →",
    "ortak.kapat": "Cerrar",

    "metrik.toplam": "Total",
    "metrik.botOrani": "Tasa de bots",
    "metrik.engellenen": "Bloqueados",
    "metrik.baskinTehdit": "Amenaza dominante",
    "metrik.engelOrani": "Tasa de bloqueo",

    "zaman.baslik": "Control deslizante temporal",
    "zaman.tumPencere": "Ventana completa (en vivo)",
    "zaman.oynat": "Reproducir",
    "zaman.duraklat": "Pausar",
    "zaman.canliyaDon": "Volver a en vivo",
    "zaman.simdi": "Ahora",
    "zaman.pencere": "Ventana de {gun} días · {n} segmentos",
    "zaman.sliderAria": "Selector de segmento temporal",
    "zaman.dilimTitle": "{ara}: {n} eventos",
    "zaman.dilimAria": "Segmento {i}: {n} eventos",

    "drill.ulkeSec": "Selecciona un país",
    "drill.ulkeSecAciklama":
      "Haz clic en un país del mapa o del ranking de abajo; ve aquí su desglose por ASN, clase de bot y tiempo.",
    "drill.yogunluk": "intensidad {n}",
    "drill.enYogunAglar": "Redes más activas (ASN)",
    "drill.asnYok": "Sin datos de ASN.",
    "drill.botKirilim": "Desglose por clase de bot",
    "drill.botKirilimYok": "No se observaron eventos de clase de bot desde este país.",
    "drill.yanitDagilimi": "Distribución de respuestas",
    "drill.engellenenTitle": "Bloqueados/desafiados",
    "drill.izinVerilenTitle": "Permitidos",
    "drill.engellenenLabel": "{n} bloqueados/desafiados",
    "drill.izinLabel": "{n} permitidos",
    "drill.ctaAciklama":
      "— crea una regla geográfica para bloquear, desafiar o monitorear de cerca el tráfico de esta fuente.",
    "drill.ctaButon": "Crear regla para {ulke}",

    "siralama.baslik": "Ranking de países de amenaza",
    "siralama.tumPencere": "ventana completa",
    "siralama.seciliDilim": "segmento seleccionado",
    "siralama.ulkeSayisi": "{n} países",
    "siralama.trafikYok": "No se observó tráfico en este período.",
    "siralama.engel": "{n} bloqueados",

    "bolge.baslik": "Resumen regional",
    "bolge.veriYok": "Sin datos regionales.",
    "bolge.ulkeOlay": "{ulke} países · {olay} eventos",

    "not.1": "Este mapa de calor",
    "not.kuresel": "no es una verdad global de amenazas",
    "not.2":
      "— refleja solo el tráfico que Veylify observó en tus sitios. La puntuación de intensidad es una escala",
    "not.goreli": "relativa",
    "not.3":
      "entre países (volumen a escala logarítmica + tasa de bloqueo + puntuación media). Las posiciones geográficas son centros de países aproximados.",

    "kademe.kritik": "Crítico",
    "kademe.yuksek": "Alto",
    "kademe.orta": "Medio",
    "kademe.dusuk": "Bajo",
    "kademe.asgari": "Mínimo",

    "bolge.avrupa": "Europa",
    "bolge.asya": "Asia-Pacífico",
    "bolge.amerika": "América",
    "bolge.afrika": "África",
    "bolge.ortadogu": "Oriente Medio & Asia Central",
    "bolge.diger": "Otro",

    "bot.human": "Humano",
    "bot.good_bot": "Bot bueno",
    "bot.automation": "Automatización",
    "bot.scraper": "Scraper",
    "bot.credential_stuffing": "Relleno de credenciales",
    "bot.ai_agent": "Agente IA",
    "bot.ddos": "DDoS",
    "bot.spam": "Spam",

    "ay.0": "ene", "ay.1": "feb", "ay.2": "mar", "ay.3": "abr",
    "ay.4": "may", "ay.5": "jun", "ay.6": "jul", "ay.7": "ago",
    "ay.8": "sep", "ay.9": "oct", "ay.10": "nov", "ay.11": "dic",
  },
};

/** Coğrafi ısı haritası anahtarını verilen dile çevir; TR'ye, sonra anahtara düşer. */
export function geoIsiCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}

/** Ülke sayısı/olay biçimlemesi için BCP-47 yerel eşlemesi. */
export const YEREL_BCP47: Record<Dil, string> = {
  tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES",
};
