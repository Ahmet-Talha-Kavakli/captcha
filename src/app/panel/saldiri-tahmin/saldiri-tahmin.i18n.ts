/**
 * Saldırı Tahmini & Erken Uyarı — yerel i18n sözlüğü.
 * ===================================================
 * Yalnızca bu sayfaya özgü metinler. Enum değerleri (siddet/trendYonu) veri
 * olarak kalır; UI'da anahtar-bazlı etikete çevrilir (label-map → key-map).
 *
 * ÖNEMLİ: Erken uyarı başlık/açıklaması lib'de (saldiri-tahmin.ts) dinamik TR
 * metin olarak üretilir. Lib DEĞİŞTİRİLMEZ; bu yüzden başlık/açıklama, yapısal
 * alanlardan (aniSicrama/zirveKova/sicramaKat/mevcutHiz/esik) istemci tarafında
 * YENİDEN türetilir ve buradaki şablonlarla çevrilir. Sayılar veri olarak
 * Intl ile biçimlenir; {n} yer tutucuları .replace ile doldurulur.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // erken uyarı bandı — durum
    "uyari.veriYok": "Yeterli veri yok",
    "uyari.veriYok.aciklama":
      "Tahmin için yeterli saatlik olay birikmedi. Trafik oluştukça bu panel öngörü üretmeye başlar.",
    // erken uyarı — sakin
    "uyari.sakin.baslik": "Sistem sakin",
    "uyari.sakin.aciklama": "Yakın gelecekte anormal bir saldırı dalgası öngörülmüyor.",
    // erken uyarı — dinamik başlık/açıklama şablonları
    "uyari.sicrama.baslik": "Ani saldırı sıçraması",
    "uyari.sicrama.aciklama":
      "Son kovada hacim, yakın ortalamanın {kat}× üstüne fırladı ({olay} olay). Aktif bir dalga başlamış olabilir.",
    "uyari.aktif.baslik": "Saldırı dalgası aktif",
    "uyari.aktif.aciklama":
      "Mevcut hacim ({olay} olay) temel eşiği ({esik}) aşıyor. Dalga şu anda tepe noktasında.",
    "uyari.yaklasiyor.baslik": "Saldırı dalgası yaklaşıyor",
    "uyari.yaklasiyor.aciklama":
      "Tahmini zirve ~{zirve} olay, ~{saat} saat içinde. Temel eşik {esik} olarak aşılıyor.",
    // rozetler
    "rozet.sicrama": "{kat}× sıçrama",
    // banttaki alt metrikler
    "bant.zirveyeSaat": "Tahmini zirveye ~{saat} saat",
    "bant.ongorulenZirve": "Öngörülen zirve: {n} olay",
    "bant.temelEsik": "Temel eşik: {n}",

    // şiddet etiketleri
    "siddet.izle": "İzle",
    "siddet.uyari": "Uyarı",
    "siddet.kritik": "Kritik",

    // trend yönü etiketleri
    "trend.artıyor": "artıyor",
    "trend.azalıyor": "azalıyor",
    "trend.sabit": "sabit",

    // istatistik kartları
    "stat.mevcutHiz": "Mevcut saldırı hızı (olay/saat)",
    "stat.tahminiZirve": "Tahmini zirve",
    "stat.tahminiZirveSaat": "Tahmini zirve (~{saat} saat)",
    "stat.trendYonu": "Trend yönü · ivme {ivme}/sa",
    "stat.erkenUyariDurumu": "Erken-uyarı durumu",
    "stat.sakin": "Sakin",

    // tahmin grafiği
    "grafik.baslik": "Bot/saldırı hacmi — gözlem & tahmin (saatlik)",
    "grafik.gozlem": "Gözlem",
    "grafik.tahmin": "Tahmin",
    "grafik.guvenUst": "Güven üst sınırı",
    "grafik.aciklama.1": "Sol taraf",
    "grafik.aciklama.gozlemlenen": "gözlemlenen",
    "grafik.aciklama.2": "son 48 saatlik hacim; sağdaki dikey ayrımdan sonrası",
    "grafik.aciklama.tahmin": "tahmin",
    "grafik.aciklama.3":
      "(üssel düzeltme + trend). Turuncu çizgi %95 güven bandının üst sınırıdır — gerçek dalga bu ile kırmızı arasında beklenir.",

    // ısı profili
    "isi.baslik": "Saat-bazlı saldırı profili (24 saat)",
    "isi.aciklama.1": "Günün hangi saatlerinde saldırı baskısı yoğunlaşıyor?",
    "isi.aciklama.enYogun": "En yoğun saat {saat} (UTC).",
    "isi.aciklama.2": "Ön-savunmayı bu pencerelere göre planla.",
    "isi.hoverOlay": "{n} olay/sa (ort)",
    "isi.yogunPencereler": "Yoğun pencereler:",
    "isi.bos.1": "Saat-bazlı profil için en az 24 saatlik veri gerekir.",
    "isi.bos.2": "Trafik biriktikçe günün saldırı deseni burada belirir.",

    // günlük bağlam
    "gunluk.baslik": "Günlük hacim & 7 günlük projeksiyon",
    "gunluk.aciklama":
      "Engellenen + challenge edilen günlük toplam ve 7 günlük ileri projeksiyon (uzun-vadeli bağlam).",
    "gunluk.gozlem": "Günlük gözlem",
    "gunluk.tahmin": "7 gün tahmin",
    "gunluk.7gunSonrasi": "7 gün sonrası tahmin",
    "gunluk.olayGun": "{n} olay/gün",

    // öneriler paneli
    "oneri.baslik": "Ne yapmalı — tahmine dayalı ön-savunma",
    "oneri.oncelikli": "Öncelikli",
    // öneri 1a — kritik
    "oneri.simdiSikilastir.baslik": "Kuralları ŞİMDİ sıkılaştır",
    "oneri.oncedenSikilastir.baslik": "Kuralları önceden sıkılaştır",
    "oneri.sikilastir.aciklama.zirve":
      "Zirveye ~{saat} saat var. Dalga gelmeden challenge/block kurallarını devreye al; önerilen kuralları uygula.",
    "oneri.sikilastir.aciklama.aktif":
      "Dalga aktif. Şüpheli sınıflar için agresif challenge/block kurallarını hemen etkinleştir.",
    "oneri.sikilastir.link": "Kural önerilerine git",
    // öneri 2 — adaptif zorluk
    "oneri.zorluk.baslik": "Adaptif zorluğu yükselt",
    "oneri.zorluk.aciklama":
      "Beklenen hacim artışı süresince challenge zorluğunu ve davranış eşiğini geçici olarak yükselterek meşru kullanıcıya minimum sürtünmeyle bot baskısını kır.",
    "oneri.zorluk.link": "Adaptif zorluğa git",
    // öneri sakin
    "oneri.sakin.baslik": "Sistem sakin — hazırlıklı kal",
    "oneri.sakin.aciklama":
      "Şu an anormal dalga öngörülmüyor. Kural önerilerini gözden geçirip savunma yapılandırmanı güncel tutmak iyi bir andır.",
    "oneri.sakin.link": "Kural önerilerini gör",
    // öneri trend
    "oneri.trend.baslik": "Yükselen trend — kapasiteyi doğrula",
    "oneri.trend.aciklama":
      "Saldırı hacmi saat başına ~{ivme} olay artıyor. Rate limit ve kota politikalarının artan yükü karşıladığından emin ol.",
    "oneri.trend.link": "Hız & kota politikası",
    // öneri mevsimsel
    "oneri.zirvePencere.baslik": "Zirve penceresi: {saat} (UTC)",
    "oneri.zirvePencere.aciklama":
      "Saldırılar bu saat çevresinde yoğunlaşıyor. Zamanlanmış kural sıkılaştırması veya ek doğrulamayı bu pencereye hizala.",
    "oneri.zirvePencere.link": "Zorluk zamanlaması",

    // yöntem notu
    "yontem.1": "Tahmin, son ~72 saatlik saatlik saldırı serisi üzerinde",
    "yontem.holt": "üssel düzeltme + lineer trend",
    "yontem.2":
      "(Holt tarzı) ile üretilir; güven bandı son artıkların dağılımından (±1.96σ) hesaplanır. Erken uyarı, temel çizgiyi (ortalama + 2σ) aşan projeksiyon ya da son kovadaki ani sıçrama ile tetiklenir. Determinizm için “şimdi”, gerçek saat değil en yeni olayın zaman damgasıdır — aynı veri her zaman aynı öngörüyü verir.",

    // eksen suffiksleri
    "suffix.saatGeri": "-{n}sa",
    "suffix.saatIleri": "+{n}sa",
    "suffix.gunIleri": "+{n}g",
  },

  en: {
    "uyari.veriYok": "Not enough data",
    "uyari.veriYok.aciklama":
      "Not enough hourly events have accumulated for a forecast. As traffic builds, this panel will start producing predictions.",
    "uyari.sakin.baslik": "System calm",
    "uyari.sakin.aciklama": "No abnormal attack wave is forecast in the near future.",
    "uyari.sicrama.baslik": "Sudden attack spike",
    "uyari.sicrama.aciklama":
      "In the last bucket, volume jumped to {kat}× above the recent average ({olay} events). An active wave may have begun.",
    "uyari.aktif.baslik": "Attack wave active",
    "uyari.aktif.aciklama":
      "Current volume ({olay} events) exceeds the baseline threshold ({esik}). The wave is at its peak right now.",
    "uyari.yaklasiyor.baslik": "Attack wave approaching",
    "uyari.yaklasiyor.aciklama":
      "Estimated peak ~{zirve} events, within ~{saat} hours. The baseline threshold {esik} is being exceeded.",
    "rozet.sicrama": "{kat}× spike",
    "bant.zirveyeSaat": "~{saat} hours to estimated peak",
    "bant.ongorulenZirve": "Predicted peak: {n} events",
    "bant.temelEsik": "Baseline threshold: {n}",

    "siddet.izle": "Watch",
    "siddet.uyari": "Warning",
    "siddet.kritik": "Critical",

    "trend.artıyor": "rising",
    "trend.azalıyor": "falling",
    "trend.sabit": "stable",

    "stat.mevcutHiz": "Current attack rate (events/hour)",
    "stat.tahminiZirve": "Estimated peak",
    "stat.tahminiZirveSaat": "Estimated peak (~{saat} hours)",
    "stat.trendYonu": "Trend direction · acceleration {ivme}/h",
    "stat.erkenUyariDurumu": "Early-warning status",
    "stat.sakin": "Calm",

    "grafik.baslik": "Bot/attack volume — observed & forecast (hourly)",
    "grafik.gozlem": "Observed",
    "grafik.tahmin": "Forecast",
    "grafik.guvenUst": "Confidence upper bound",
    "grafik.aciklama.1": "The left side is",
    "grafik.aciklama.gozlemlenen": "observed",
    "grafik.aciklama.2": "volume over the last 48 hours; everything after the vertical divider is",
    "grafik.aciklama.tahmin": "forecast",
    "grafik.aciklama.3":
      "(exponential smoothing + trend). The orange line is the upper bound of the 95% confidence band — the real wave is expected between it and the red line.",

    "isi.baslik": "Hour-of-day attack profile (24 hours)",
    "isi.aciklama.1": "Which hours of the day does attack pressure concentrate in?",
    "isi.aciklama.enYogun": "Busiest hour {saat} (UTC).",
    "isi.aciklama.2": "Plan your pre-defense around these windows.",
    "isi.hoverOlay": "{n} events/h (avg)",
    "isi.yogunPencereler": "Busy windows:",
    "isi.bos.1": "The hour-of-day profile needs at least 24 hours of data.",
    "isi.bos.2": "As traffic accumulates, the day's attack pattern will emerge here.",

    "gunluk.baslik": "Daily volume & 7-day projection",
    "gunluk.aciklama":
      "Daily total of blocked + challenged plus a 7-day forward projection (long-term context).",
    "gunluk.gozlem": "Daily observed",
    "gunluk.tahmin": "7-day forecast",
    "gunluk.7gunSonrasi": "Forecast 7 days out",
    "gunluk.olayGun": "{n} events/day",

    "oneri.baslik": "What to do — forecast-driven pre-defense",
    "oneri.oncelikli": "Priority",
    "oneri.simdiSikilastir.baslik": "Tighten rules NOW",
    "oneri.oncedenSikilastir.baslik": "Tighten rules in advance",
    "oneri.sikilastir.aciklama.zirve":
      "~{saat} hours to peak. Activate challenge/block rules before the wave arrives; apply the recommended rules.",
    "oneri.sikilastir.aciklama.aktif":
      "Wave active. Immediately enable aggressive challenge/block rules for suspicious classes.",
    "oneri.sikilastir.link": "Go to rule suggestions",
    "oneri.zorluk.baslik": "Raise adaptive difficulty",
    "oneri.zorluk.aciklama":
      "During the expected volume surge, temporarily raise challenge difficulty and the behavior threshold to break bot pressure with minimal friction for legitimate users.",
    "oneri.zorluk.link": "Go to adaptive difficulty",
    "oneri.sakin.baslik": "System calm — stay prepared",
    "oneri.sakin.aciklama":
      "No abnormal wave is forecast right now. This is a good time to review rule suggestions and keep your defense configuration up to date.",
    "oneri.sakin.link": "See rule suggestions",
    "oneri.trend.baslik": "Rising trend — verify capacity",
    "oneri.trend.aciklama":
      "Attack volume is rising by ~{ivme} events per hour. Make sure your rate-limit and quota policies can absorb the growing load.",
    "oneri.trend.link": "Rate & quota policy",
    "oneri.zirvePencere.baslik": "Peak window: {saat} (UTC)",
    "oneri.zirvePencere.aciklama":
      "Attacks concentrate around this hour. Align scheduled rule tightening or extra verification with this window.",
    "oneri.zirvePencere.link": "Difficulty scheduling",

    "yontem.1": "The forecast is produced over the last ~72 hours of hourly attack series with",
    "yontem.holt": "exponential smoothing + linear trend",
    "yontem.2":
      "(Holt-style); the confidence band is computed from the distribution of recent residuals (±1.96σ). The early warning triggers on a projection exceeding the baseline (mean + 2σ) or a sudden spike in the last bucket. For determinism, “now” is the timestamp of the newest event, not the real clock — the same data always yields the same forecast.",

    "suffix.saatGeri": "-{n}h",
    "suffix.saatIleri": "+{n}h",
    "suffix.gunIleri": "+{n}d",
  },

  de: {
    "uyari.veriYok": "Nicht genügend Daten",
    "uyari.veriYok.aciklama":
      "Für eine Prognose haben sich noch nicht genügend stündliche Ereignisse angesammelt. Sobald Traffic entsteht, beginnt dieses Panel mit Vorhersagen.",
    "uyari.sakin.baslik": "System ruhig",
    "uyari.sakin.aciklama": "Für die nahe Zukunft wird keine anormale Angriffswelle prognostiziert.",
    "uyari.sicrama.baslik": "Plötzlicher Angriffsanstieg",
    "uyari.sicrama.aciklama":
      "Im letzten Zeitfenster sprang das Volumen auf das {kat}-Fache über dem jüngsten Durchschnitt ({olay} Ereignisse). Eine aktive Welle könnte begonnen haben.",
    "uyari.aktif.baslik": "Angriffswelle aktiv",
    "uyari.aktif.aciklama":
      "Das aktuelle Volumen ({olay} Ereignisse) überschreitet den Basisschwellenwert ({esik}). Die Welle ist gerade auf ihrem Höhepunkt.",
    "uyari.yaklasiyor.baslik": "Angriffswelle naht",
    "uyari.yaklasiyor.aciklama":
      "Geschätzter Höhepunkt ~{zirve} Ereignisse, in ~{saat} Stunden. Der Basisschwellenwert {esik} wird überschritten.",
    "rozet.sicrama": "{kat}× Anstieg",
    "bant.zirveyeSaat": "~{saat} Stunden bis zum geschätzten Höhepunkt",
    "bant.ongorulenZirve": "Prognostizierter Höhepunkt: {n} Ereignisse",
    "bant.temelEsik": "Basisschwellenwert: {n}",

    "siddet.izle": "Beobachten",
    "siddet.uyari": "Warnung",
    "siddet.kritik": "Kritisch",

    "trend.artıyor": "steigend",
    "trend.azalıyor": "fallend",
    "trend.sabit": "stabil",

    "stat.mevcutHiz": "Aktuelle Angriffsrate (Ereignisse/Stunde)",
    "stat.tahminiZirve": "Geschätzter Höhepunkt",
    "stat.tahminiZirveSaat": "Geschätzter Höhepunkt (~{saat} Stunden)",
    "stat.trendYonu": "Trendrichtung · Beschleunigung {ivme}/Std",
    "stat.erkenUyariDurumu": "Frühwarnstatus",
    "stat.sakin": "Ruhig",

    "grafik.baslik": "Bot-/Angriffsvolumen — beobachtet & Prognose (stündlich)",
    "grafik.gozlem": "Beobachtet",
    "grafik.tahmin": "Prognose",
    "grafik.guvenUst": "Obere Konfidenzgrenze",
    "grafik.aciklama.1": "Die linke Seite ist das",
    "grafik.aciklama.gozlemlenen": "beobachtete",
    "grafik.aciklama.2":
      "Volumen der letzten 48 Stunden; alles nach der vertikalen Trennlinie ist",
    "grafik.aciklama.tahmin": "Prognose",
    "grafik.aciklama.3":
      "(exponentielle Glättung + Trend). Die orange Linie ist die obere Grenze des 95%-Konfidenzbandes — die reale Welle wird zwischen ihr und der roten Linie erwartet.",

    "isi.baslik": "Angriffsprofil nach Tageszeit (24 Stunden)",
    "isi.aciklama.1": "In welchen Tagesstunden konzentriert sich der Angriffsdruck?",
    "isi.aciklama.enYogun": "Stärkste Stunde {saat} (UTC).",
    "isi.aciklama.2": "Plane deine Vorabverteidigung nach diesen Zeitfenstern.",
    "isi.hoverOlay": "{n} Ereignisse/Std (Ø)",
    "isi.yogunPencereler": "Stoßzeitfenster:",
    "isi.bos.1": "Das Tageszeit-Profil benötigt mindestens 24 Stunden Daten.",
    "isi.bos.2": "Sobald sich Traffic ansammelt, zeigt sich hier das Angriffsmuster des Tages.",

    "gunluk.baslik": "Tagesvolumen & 7-Tage-Projektion",
    "gunluk.aciklama":
      "Tagessumme aus blockiert + herausgefordert plus eine 7-tägige Vorwärtsprojektion (langfristiger Kontext).",
    "gunluk.gozlem": "Täglich beobachtet",
    "gunluk.tahmin": "7-Tage-Prognose",
    "gunluk.7gunSonrasi": "Prognose in 7 Tagen",
    "gunluk.olayGun": "{n} Ereignisse/Tag",

    "oneri.baslik": "Was tun — prognosegesteuerte Vorabverteidigung",
    "oneri.oncelikli": "Priorität",
    "oneri.simdiSikilastir.baslik": "Regeln JETZT verschärfen",
    "oneri.oncedenSikilastir.baslik": "Regeln vorab verschärfen",
    "oneri.sikilastir.aciklama.zirve":
      "~{saat} Stunden bis zum Höhepunkt. Aktiviere Challenge-/Block-Regeln, bevor die Welle eintrifft; wende die empfohlenen Regeln an.",
    "oneri.sikilastir.aciklama.aktif":
      "Welle aktiv. Aktiviere sofort aggressive Challenge-/Block-Regeln für verdächtige Klassen.",
    "oneri.sikilastir.link": "Zu den Regelvorschlägen",
    "oneri.zorluk.baslik": "Adaptive Schwierigkeit erhöhen",
    "oneri.zorluk.aciklama":
      "Erhöhe während des erwarteten Volumenanstiegs vorübergehend die Challenge-Schwierigkeit und die Verhaltensschwelle, um den Bot-Druck bei minimaler Reibung für legitime Nutzer zu brechen.",
    "oneri.zorluk.link": "Zur adaptiven Schwierigkeit",
    "oneri.sakin.baslik": "System ruhig — bleib vorbereitet",
    "oneri.sakin.aciklama":
      "Derzeit wird keine anormale Welle prognostiziert. Ein guter Moment, um Regelvorschläge zu prüfen und deine Verteidigungskonfiguration aktuell zu halten.",
    "oneri.sakin.link": "Regelvorschläge ansehen",
    "oneri.trend.baslik": "Steigender Trend — Kapazität prüfen",
    "oneri.trend.aciklama":
      "Das Angriffsvolumen steigt um ~{ivme} Ereignisse pro Stunde. Stelle sicher, dass deine Rate-Limit- und Kontingentrichtlinien die wachsende Last verkraften.",
    "oneri.trend.link": "Raten- & Kontingentrichtlinie",
    "oneri.zirvePencere.baslik": "Spitzenfenster: {saat} (UTC)",
    "oneri.zirvePencere.aciklama":
      "Angriffe konzentrieren sich um diese Stunde. Richte geplante Regelverschärfungen oder zusätzliche Verifizierung an diesem Fenster aus.",
    "oneri.zirvePencere.link": "Schwierigkeitsplanung",

    "yontem.1": "Die Prognose wird über die letzten ~72 Stunden der stündlichen Angriffsreihe mit",
    "yontem.holt": "exponentieller Glättung + linearem Trend",
    "yontem.2":
      "(Holt-Stil) erstellt; das Konfidenzband wird aus der Verteilung der jüngsten Residuen (±1,96σ) berechnet. Die Frühwarnung wird durch eine Projektion ausgelöst, die die Basislinie (Mittelwert + 2σ) überschreitet, oder durch einen plötzlichen Anstieg im letzten Zeitfenster. Aus Determinismusgründen ist „jetzt“ der Zeitstempel des neuesten Ereignisses, nicht die reale Uhr — dieselben Daten liefern stets dieselbe Prognose.",

    "suffix.saatGeri": "-{n}Std",
    "suffix.saatIleri": "+{n}Std",
    "suffix.gunIleri": "+{n}T",
  },

  fr: {
    "uyari.veriYok": "Données insuffisantes",
    "uyari.veriYok.aciklama":
      "Pas assez d'événements horaires accumulés pour une prévision. À mesure que le trafic s'accumule, ce panneau commencera à produire des prédictions.",
    "uyari.sakin.baslik": "Système calme",
    "uyari.sakin.aciklama": "Aucune vague d'attaque anormale n'est prévue dans un avenir proche.",
    "uyari.sicrama.baslik": "Pic d'attaque soudain",
    "uyari.sicrama.aciklama":
      "Dans le dernier intervalle, le volume a bondi à {kat}× au-dessus de la moyenne récente ({olay} événements). Une vague active a peut-être commencé.",
    "uyari.aktif.baslik": "Vague d'attaque active",
    "uyari.aktif.aciklama":
      "Le volume actuel ({olay} événements) dépasse le seuil de référence ({esik}). La vague est à son pic en ce moment.",
    "uyari.yaklasiyor.baslik": "Vague d'attaque imminente",
    "uyari.yaklasiyor.aciklama":
      "Pic estimé ~{zirve} événements, dans ~{saat} heures. Le seuil de référence {esik} est dépassé.",
    "rozet.sicrama": "pic {kat}×",
    "bant.zirveyeSaat": "~{saat} heures avant le pic estimé",
    "bant.ongorulenZirve": "Pic prévu : {n} événements",
    "bant.temelEsik": "Seuil de référence : {n}",

    "siddet.izle": "Surveiller",
    "siddet.uyari": "Alerte",
    "siddet.kritik": "Critique",

    "trend.artıyor": "en hausse",
    "trend.azalıyor": "en baisse",
    "trend.sabit": "stable",

    "stat.mevcutHiz": "Taux d'attaque actuel (événements/heure)",
    "stat.tahminiZirve": "Pic estimé",
    "stat.tahminiZirveSaat": "Pic estimé (~{saat} heures)",
    "stat.trendYonu": "Direction de la tendance · accélération {ivme}/h",
    "stat.erkenUyariDurumu": "État de l'alerte précoce",
    "stat.sakin": "Calme",

    "grafik.baslik": "Volume de bots/attaques — observé & prévu (horaire)",
    "grafik.gozlem": "Observé",
    "grafik.tahmin": "Prévision",
    "grafik.guvenUst": "Borne supérieure de confiance",
    "grafik.aciklama.1": "La partie gauche est le volume",
    "grafik.aciklama.gozlemlenen": "observé",
    "grafik.aciklama.2":
      "des 48 dernières heures ; tout ce qui suit le séparateur vertical est une",
    "grafik.aciklama.tahmin": "prévision",
    "grafik.aciklama.3":
      "(lissage exponentiel + tendance). La ligne orange est la borne supérieure de l'intervalle de confiance à 95 % — la vague réelle est attendue entre celle-ci et la ligne rouge.",

    "isi.baslik": "Profil d'attaque par heure de la journée (24 heures)",
    "isi.aciklama.1": "À quelles heures de la journée la pression d'attaque se concentre-t-elle ?",
    "isi.aciklama.enYogun": "Heure la plus chargée {saat} (UTC).",
    "isi.aciklama.2": "Planifiez votre pré-défense selon ces fenêtres.",
    "isi.hoverOlay": "{n} événements/h (moy)",
    "isi.yogunPencereler": "Fenêtres chargées :",
    "isi.bos.1": "Le profil par heure de la journée nécessite au moins 24 heures de données.",
    "isi.bos.2":
      "À mesure que le trafic s'accumule, le schéma d'attaque de la journée apparaîtra ici.",

    "gunluk.baslik": "Volume quotidien & projection sur 7 jours",
    "gunluk.aciklama":
      "Total quotidien des bloqués + mis au défi, plus une projection prospective sur 7 jours (contexte à long terme).",
    "gunluk.gozlem": "Observé quotidien",
    "gunluk.tahmin": "Prévision 7 jours",
    "gunluk.7gunSonrasi": "Prévision à 7 jours",
    "gunluk.olayGun": "{n} événements/jour",

    "oneri.baslik": "Que faire — pré-défense pilotée par la prévision",
    "oneri.oncelikli": "Prioritaire",
    "oneri.simdiSikilastir.baslik": "Renforcer les règles MAINTENANT",
    "oneri.oncedenSikilastir.baslik": "Renforcer les règles à l'avance",
    "oneri.sikilastir.aciklama.zirve":
      "~{saat} heures avant le pic. Activez les règles de défi/blocage avant l'arrivée de la vague ; appliquez les règles recommandées.",
    "oneri.sikilastir.aciklama.aktif":
      "Vague active. Activez immédiatement des règles agressives de défi/blocage pour les classes suspectes.",
    "oneri.sikilastir.link": "Aller aux suggestions de règles",
    "oneri.zorluk.baslik": "Augmenter la difficulté adaptative",
    "oneri.zorluk.aciklama":
      "Pendant la hausse de volume attendue, augmentez temporairement la difficulté du défi et le seuil comportemental pour briser la pression des bots avec un minimum de friction pour les utilisateurs légitimes.",
    "oneri.zorluk.link": "Aller à la difficulté adaptative",
    "oneri.sakin.baslik": "Système calme — restez prêt",
    "oneri.sakin.aciklama":
      "Aucune vague anormale n'est prévue pour le moment. C'est un bon moment pour revoir les suggestions de règles et maintenir votre configuration de défense à jour.",
    "oneri.sakin.link": "Voir les suggestions de règles",
    "oneri.trend.baslik": "Tendance à la hausse — vérifier la capacité",
    "oneri.trend.aciklama":
      "Le volume d'attaques augmente d'environ {ivme} événements par heure. Assurez-vous que vos politiques de limitation de débit et de quota absorbent la charge croissante.",
    "oneri.trend.link": "Politique de débit & quota",
    "oneri.zirvePencere.baslik": "Fenêtre de pic : {saat} (UTC)",
    "oneri.zirvePencere.aciklama":
      "Les attaques se concentrent autour de cette heure. Alignez le renforcement programmé des règles ou la vérification supplémentaire sur cette fenêtre.",
    "oneri.zirvePencere.link": "Planification de la difficulté",

    "yontem.1": "La prévision est produite sur les ~72 dernières heures de la série d'attaques horaires avec un",
    "yontem.holt": "lissage exponentiel + tendance linéaire",
    "yontem.2":
      "(à la Holt) ; l'intervalle de confiance est calculé à partir de la distribution des résidus récents (±1,96σ). L'alerte précoce se déclenche sur une projection dépassant la ligne de référence (moyenne + 2σ) ou un pic soudain dans le dernier intervalle. Pour le déterminisme, « maintenant » est l'horodatage de l'événement le plus récent, pas l'horloge réelle — les mêmes données donnent toujours la même prévision.",

    "suffix.saatGeri": "-{n}h",
    "suffix.saatIleri": "+{n}h",
    "suffix.gunIleri": "+{n}j",
  },

  es: {
    "uyari.veriYok": "Datos insuficientes",
    "uyari.veriYok.aciklama":
      "No se han acumulado suficientes eventos por hora para un pronóstico. A medida que aumente el tráfico, este panel comenzará a generar predicciones.",
    "uyari.sakin.baslik": "Sistema en calma",
    "uyari.sakin.aciklama": "No se prevé ninguna oleada de ataques anómala en el futuro cercano.",
    "uyari.sicrama.baslik": "Pico de ataque repentino",
    "uyari.sicrama.aciklama":
      "En el último intervalo, el volumen se disparó {kat}× por encima de la media reciente ({olay} eventos). Puede haber comenzado una oleada activa.",
    "uyari.aktif.baslik": "Oleada de ataques activa",
    "uyari.aktif.aciklama":
      "El volumen actual ({olay} eventos) supera el umbral base ({esik}). La oleada está ahora en su punto máximo.",
    "uyari.yaklasiyor.baslik": "Oleada de ataques acercándose",
    "uyari.yaklasiyor.aciklama":
      "Pico estimado ~{zirve} eventos, en ~{saat} horas. Se está superando el umbral base {esik}.",
    "rozet.sicrama": "pico {kat}×",
    "bant.zirveyeSaat": "~{saat} horas hasta el pico estimado",
    "bant.ongorulenZirve": "Pico previsto: {n} eventos",
    "bant.temelEsik": "Umbral base: {n}",

    "siddet.izle": "Vigilar",
    "siddet.uyari": "Aviso",
    "siddet.kritik": "Crítico",

    "trend.artıyor": "en aumento",
    "trend.azalıyor": "en descenso",
    "trend.sabit": "estable",

    "stat.mevcutHiz": "Tasa de ataque actual (eventos/hora)",
    "stat.tahminiZirve": "Pico estimado",
    "stat.tahminiZirveSaat": "Pico estimado (~{saat} horas)",
    "stat.trendYonu": "Dirección de la tendencia · aceleración {ivme}/h",
    "stat.erkenUyariDurumu": "Estado de alerta temprana",
    "stat.sakin": "En calma",

    "grafik.baslik": "Volumen de bots/ataques — observado y pronóstico (por hora)",
    "grafik.gozlem": "Observado",
    "grafik.tahmin": "Pronóstico",
    "grafik.guvenUst": "Límite superior de confianza",
    "grafik.aciklama.1": "El lado izquierdo es el volumen",
    "grafik.aciklama.gozlemlenen": "observado",
    "grafik.aciklama.2":
      "de las últimas 48 horas; todo lo que sigue al divisor vertical es un",
    "grafik.aciklama.tahmin": "pronóstico",
    "grafik.aciklama.3":
      "(suavizado exponencial + tendencia). La línea naranja es el límite superior de la banda de confianza del 95 %: la oleada real se espera entre esta y la línea roja.",

    "isi.baslik": "Perfil de ataques por hora del día (24 horas)",
    "isi.aciklama.1": "¿En qué horas del día se concentra la presión de los ataques?",
    "isi.aciklama.enYogun": "Hora de mayor actividad {saat} (UTC).",
    "isi.aciklama.2": "Planifica tu defensa previa en función de estas ventanas.",
    "isi.hoverOlay": "{n} eventos/h (prom)",
    "isi.yogunPencereler": "Ventanas de mayor actividad:",
    "isi.bos.1": "El perfil por hora del día necesita al menos 24 horas de datos.",
    "isi.bos.2": "A medida que se acumule tráfico, aquí aparecerá el patrón de ataque del día.",

    "gunluk.baslik": "Volumen diario y proyección a 7 días",
    "gunluk.aciklama":
      "Total diario de bloqueados + con verificación, más una proyección a 7 días (contexto a largo plazo).",
    "gunluk.gozlem": "Observado diario",
    "gunluk.tahmin": "Pronóstico a 7 días",
    "gunluk.7gunSonrasi": "Pronóstico a 7 días vista",
    "gunluk.olayGun": "{n} eventos/día",

    "oneri.baslik": "Qué hacer — defensa previa basada en el pronóstico",
    "oneri.oncelikli": "Prioritario",
    "oneri.simdiSikilastir.baslik": "Endurecer las reglas AHORA",
    "oneri.oncedenSikilastir.baslik": "Endurecer las reglas por adelantado",
    "oneri.sikilastir.aciklama.zirve":
      "~{saat} horas hasta el pico. Activa las reglas de verificación/bloqueo antes de que llegue la oleada; aplica las reglas recomendadas.",
    "oneri.sikilastir.aciklama.aktif":
      "Oleada activa. Habilita de inmediato reglas agresivas de verificación/bloqueo para las clases sospechosas.",
    "oneri.sikilastir.link": "Ir a las sugerencias de reglas",
    "oneri.zorluk.baslik": "Aumentar la dificultad adaptativa",
    "oneri.zorluk.aciklama":
      "Durante el aumento de volumen esperado, sube temporalmente la dificultad de la verificación y el umbral de comportamiento para romper la presión de los bots con la mínima fricción para los usuarios legítimos.",
    "oneri.zorluk.link": "Ir a la dificultad adaptativa",
    "oneri.sakin.baslik": "Sistema en calma — mantente preparado",
    "oneri.sakin.aciklama":
      "Ahora mismo no se prevé ninguna oleada anómala. Es un buen momento para revisar las sugerencias de reglas y mantener actualizada tu configuración de defensa.",
    "oneri.sakin.link": "Ver sugerencias de reglas",
    "oneri.trend.baslik": "Tendencia al alza — verifica la capacidad",
    "oneri.trend.aciklama":
      "El volumen de ataques aumenta ~{ivme} eventos por hora. Asegúrate de que tus políticas de límite de tasa y cuota absorban la carga creciente.",
    "oneri.trend.link": "Política de tasa y cuota",
    "oneri.zirvePencere.baslik": "Ventana de pico: {saat} (UTC)",
    "oneri.zirvePencere.aciklama":
      "Los ataques se concentran en torno a esta hora. Alinea el endurecimiento programado de reglas o la verificación adicional con esta ventana.",
    "oneri.zirvePencere.link": "Programación de dificultad",

    "yontem.1": "El pronóstico se genera sobre las últimas ~72 horas de la serie de ataques por hora con",
    "yontem.holt": "suavizado exponencial + tendencia lineal",
    "yontem.2":
      "(al estilo Holt); la banda de confianza se calcula a partir de la distribución de los residuos recientes (±1,96σ). La alerta temprana se activa ante una proyección que supera la línea base (media + 2σ) o un pico repentino en el último intervalo. Por determinismo, «ahora» es la marca de tiempo del evento más reciente, no el reloj real: los mismos datos siempre dan el mismo pronóstico.",

    "suffix.saatGeri": "-{n}h",
    "suffix.saatIleri": "+{n}h",
    "suffix.gunIleri": "+{n}d",
  },
};

export function saldiriTahminCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}

/** Sayı biçimlemesi için BCP-47 yerel eşlemesi. */
export const YEREL_BCP47: Record<Dil, string> = {
  tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES",
};
