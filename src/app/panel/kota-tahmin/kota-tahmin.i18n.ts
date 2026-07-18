import type { Dil } from "@/lib/i18n/panel";

/**
 * Kota Tahmini sayfasına özel i18n sözlüğü (yalnızca bu modül kullanır).
 * "kt." namespace'li anahtarlar. Doğal/native çeviriler; veri (sayı, tarih,
 * plan adı, yöntem makine-anahtarı) çevrilmez.
 * TR kaynak/otorite; anahtar bulunamazsa TR'ye, o da yoksa anahtarın kendisine düşer.
 * Enum güvenliği: yöntem anahtarları (basit/regresyon/agirlikli) ve trend yönü
 * (artıyor/azalıyor/sabit) lib'den enum olarak gelir; bunların GÖRÜNEN metni
 * burada anahtar-eşlemeyle (kt.yontem.* / kt.trend.*) çevrilir, ham değer değil.
 */
const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // --- trend yönü (enum → etiket) ---
    "kt.trend.artıyor": "Artıyor",
    "kt.trend.azalıyor": "Azalıyor",
    "kt.trend.sabit": "Sabit",
    // --- yöntem adı (enum → etiket) ---
    "kt.yontem.basit": "Basit ortalama",
    "kt.yontem.regresyon": "Lineer regresyon",
    "kt.yontem.agirlikli": "Son-7-gün ağırlıklı",
    // --- yöntem açıklamaları (enum → metin) ---
    "kt.yontemAciklama.basit":
      "Şimdiye kadarki günlük ortalamayı kalan günlere sabit uygular. En sade ve kararlı yöntem; trendi görmez.",
    "kt.yontemAciklama.regresyon":
      "En küçük kareler doğrusuyla trendi yakalar. Kullanım hızlanıyor/yavaşlıyorsa bunu projeksiyona taşır.",
    "kt.yontemAciklama.agirlikli":
      "Son 7 güne artan ağırlık verir; en güncel davranışa duyarlıdır, ani sıçramalara hızlı tepki verir.",
    // --- açıklama şeridi ---
    "kt.aciklama.baslik": "Kotanı tükenmeden gör; kapasiteni önceden planla.",
    "kt.aciklama.metin":
      "Bu motor üç ayrı istatistiksel yöntemle ({plan} planı, {gecti}/{toplam} gün) ay-sonu doğrulama kullanımını öngörür, kotanın hangi gün tükeneceğini hesaplar ve doğru planı önerir.",
    // --- özet kartları ---
    "kt.kart.mevcut": "Mevcut kullanım (%{pct} kota)",
    "kt.kart.aySonu": "Ay-sonu tahmini · {yontem}",
    "kt.kart.tukenisGunu": "Tahmini tükeniş günü",
    "kt.kart.yeterliEtiket": "Kota ay sonuna yeter",
    "kt.kart.gunEtiketi": "{n}. gün",
    "kt.kart.yeterli": "Yeterli",
    "kt.kart.trend": "Kullanım trendi (regresyon)",
    // --- tükeniş uyarısı ---
    "kt.uyari.baslik": "Kota ay bitmeden tükeniyor — tahmini {n}. gün",
    "kt.uyari.metin":
      "Seçilen yönteme göre ({yontem}) günlük ~{hiz} doğrulama hızıyla {kota} kotalık {plan} planı, ayın {gun}. gününde dolacak. Ay-sonu tahmini {tahmin} — ",
    "kt.uyari.asim": "{n} aşım",
    "kt.uyari.oneri": ". Planı yükseltmeyi ya da kullanımı azaltmayı düşün.",
    "kt.ok.baslik": "Kota ay sonuna kadar yeterli",
    "kt.ok.metin":
      "Tahmini ay-sonu kullanımı {tahmin} / {kota} kota (%{pct} doluluk). Kalan {kalan} gün mevcut hızda risk oluşturmuyor.",
    // --- projeksiyon grafiği ---
    "kt.proj.baslik": "Kullanım projeksiyonu",
    "kt.proj.altBaslik":
      "Gerçekleşen günlük kullanım + seçilen yöntemin ({yontem}) ileriye dönük tahmin çizgisi.",
    "kt.proj.seriGercek": "Gerçekleşen",
    "kt.proj.seriTahmin": "Tahmin (projeksiyon)",
    "kt.proj.guvenAraligi": "Güven aralığı:",
    "kt.proj.band": "(üç yöntemin ay-sonu bandı, genişlik {n})",
    "kt.proj.trendEgimi": "Trend eğimi:",
    "kt.proj.gunBirim": "/gün",
    // --- 3 yöntem karşılaştırması ---
    "kt.tablo.baslik": "3 yöntem karşılaştırması",
    "kt.tablo.altBaslik":
      "Aynı veriye üç farklı öngörü yöntemi uygulandı. Ortanca (dengeli) tahmini veren yöntem seçildi.",
    "kt.tablo.yontem": "Yöntem",
    "kt.tablo.gunlukHiz": "Günlük hız",
    "kt.tablo.aySonu": "Ay-sonu tahmini",
    "kt.tablo.asim": "Aşım",
    "kt.tablo.tukenis": "Tükeniş günü",
    "kt.tablo.durum": "Durum",
    "kt.tablo.secilen": "Seçilen",
    "kt.tablo.yeter": "yeter",
    "kt.tablo.asimRiski": "Aşım riski",
    "kt.tablo.guvenli": "Güvenli",
    // --- kapasite planlama ---
    "kt.kapasite.baslik": "Kapasite planlama",
    "kt.kapasite.altBaslik":
      "Tahmini ay-sonu kullanımına göre her planın uyumu, boşluğu ve önerilen kademe.",
    "kt.kapasite.mevcutPlan": "Mevcut plan",
    "kt.kapasite.onerilen": "Önerilen",
    "kt.kapasite.kota": "kota {n}",
    "kt.kapasite.bosluk": "%{pct} boşluk kalır",
    "kt.kapasite.asilir": "Kota aşılır",
    "kt.kapasite.tahmini": "tahmini {tahmin} / {kota}",
    // --- kapasite gerekçe (enum → metin) ---
    "kt.gerekce.mevcutYeter":
      "Mevcut planın tahmini ay-sonu kullanımını rahatça karşılıyor. Yükseltme gerekmez.",
    "kt.gerekce.ekonomik":
      "Mevcut plan yetiyor; ancak tahmini kullanımı en ekonomik karşılayan plan aşağıda önerildi.",
    "kt.gerekce.asiyor":
      "Tahmini ay-sonu kullanımın mevcut kotayı aşıyor; önerilen plan bu kullanımı sığdıran en küçük kademe.",
    "kt.gerekce.enYuksek":
      "Tahmini kullanım tüm planların kotasını aşıyor; en yüksek kademe önerildi, aşım ücreti kaçınılmaz.",
    // --- yöntem notu ---
    "kt.not":
      "Tahminler geçmiş doğrulama (issued) verisine dayalı istatistiksel projeksiyonlardır; ani trafik değişimleri sonucu etkileyebilir. Motor deterministiktir — aynı veri her zaman aynı öngörüyü üretir. Karar için üç yöntemin oluşturduğu güven aralığını birlikte değerlendir.",
  },
  en: {
    "kt.trend.artıyor": "Rising",
    "kt.trend.azalıyor": "Falling",
    "kt.trend.sabit": "Steady",
    "kt.yontem.basit": "Simple average",
    "kt.yontem.regresyon": "Linear regression",
    "kt.yontem.agirlikli": "Last-7-days weighted",
    "kt.yontemAciklama.basit":
      "Applies the average daily rate so far to the remaining days as a constant. The simplest, most stable method; it ignores the trend.",
    "kt.yontemAciklama.regresyon":
      "Captures the trend with a least-squares line. If usage is accelerating or slowing, it carries that into the projection.",
    "kt.yontemAciklama.agirlikli":
      "Gives increasing weight to the last 7 days; sensitive to the most recent behavior and reacts quickly to sudden spikes.",
    "kt.aciklama.baslik": "See your quota before it runs out; plan your capacity ahead.",
    "kt.aciklama.metin":
      "Using three separate statistical methods ({plan} plan, day {gecti}/{toplam}), this engine forecasts end-of-month verification usage, calculates which day the quota will run out, and recommends the right plan.",
    "kt.kart.mevcut": "Current usage ({pct}% of quota)",
    "kt.kart.aySonu": "End-of-month forecast · {yontem}",
    "kt.kart.tukenisGunu": "Estimated depletion day",
    "kt.kart.yeterliEtiket": "Quota lasts through month-end",
    "kt.kart.gunEtiketi": "Day {n}",
    "kt.kart.yeterli": "Sufficient",
    "kt.kart.trend": "Usage trend (regression)",
    "kt.uyari.baslik": "Quota runs out before month-end — estimated day {n}",
    "kt.uyari.metin":
      "By the selected method ({yontem}), at ~{hiz} verifications/day the {kota}-quota {plan} plan will fill on day {gun} of the month. End-of-month forecast is {tahmin} — ",
    "kt.uyari.asim": "{n} overage",
    "kt.uyari.oneri": ". Consider upgrading your plan or reducing usage.",
    "kt.ok.baslik": "Quota is sufficient through month-end",
    "kt.ok.metin":
      "Estimated end-of-month usage is {tahmin} / {kota} quota ({pct}% full). The remaining {kalan} days pose no risk at the current rate.",
    "kt.proj.baslik": "Usage projection",
    "kt.proj.altBaslik":
      "Actual daily usage + the selected method's ({yontem}) forward-looking forecast line.",
    "kt.proj.seriGercek": "Actual",
    "kt.proj.seriTahmin": "Forecast (projection)",
    "kt.proj.guvenAraligi": "Confidence band:",
    "kt.proj.band": "(end-of-month band of the three methods, width {n})",
    "kt.proj.trendEgimi": "Trend slope:",
    "kt.proj.gunBirim": "/day",
    "kt.tablo.baslik": "3-method comparison",
    "kt.tablo.altBaslik":
      "Three different forecasting methods were applied to the same data. The method giving the median (balanced) forecast was selected.",
    "kt.tablo.yontem": "Method",
    "kt.tablo.gunlukHiz": "Daily rate",
    "kt.tablo.aySonu": "End-of-month forecast",
    "kt.tablo.asim": "Overage",
    "kt.tablo.tukenis": "Depletion day",
    "kt.tablo.durum": "Status",
    "kt.tablo.secilen": "Selected",
    "kt.tablo.yeter": "sufficient",
    "kt.tablo.asimRiski": "Overage risk",
    "kt.tablo.guvenli": "Safe",
    "kt.kapasite.baslik": "Capacity planning",
    "kt.kapasite.altBaslik":
      "Each plan's fit, headroom and the recommended tier based on estimated end-of-month usage.",
    "kt.kapasite.mevcutPlan": "Current plan",
    "kt.kapasite.onerilen": "Recommended",
    "kt.kapasite.kota": "quota {n}",
    "kt.kapasite.bosluk": "{pct}% headroom remains",
    "kt.kapasite.asilir": "Quota exceeded",
    "kt.kapasite.tahmini": "forecast {tahmin} / {kota}",
    "kt.gerekce.mevcutYeter":
      "Your current plan comfortably covers the estimated end-of-month usage. No upgrade needed.",
    "kt.gerekce.ekonomik":
      "The current plan is enough; however, the most economical plan covering the estimated usage is recommended below.",
    "kt.gerekce.asiyor":
      "Your estimated end-of-month usage exceeds the current quota; the recommended plan is the smallest tier that fits this usage.",
    "kt.gerekce.enYuksek":
      "Estimated usage exceeds every plan's quota; the highest tier is recommended and an overage charge is unavoidable.",
    "kt.not":
      "Forecasts are statistical projections based on historical verification (issued) data; sudden traffic changes may affect the outcome. The engine is deterministic — the same data always produces the same forecast. For decisions, weigh the confidence band formed by all three methods together.",
  },
  de: {
    "kt.trend.artıyor": "Steigend",
    "kt.trend.azalıyor": "Fallend",
    "kt.trend.sabit": "Konstant",
    "kt.yontem.basit": "Einfacher Durchschnitt",
    "kt.yontem.regresyon": "Lineare Regression",
    "kt.yontem.agirlikli": "Gewichtet (letzte 7 Tage)",
    "kt.yontemAciklama.basit":
      "Wendet den bisherigen Tagesdurchschnitt konstant auf die verbleibenden Tage an. Die einfachste und stabilste Methode; sie erkennt den Trend nicht.",
    "kt.yontemAciklama.regresyon":
      "Erfasst den Trend mit einer Kleinste-Quadrate-Geraden. Wenn sich die Nutzung beschleunigt oder verlangsamt, überträgt sie das in die Projektion.",
    "kt.yontemAciklama.agirlikli":
      "Gewichtet die letzten 7 Tage zunehmend; reagiert empfindlich auf das jüngste Verhalten und schnell auf plötzliche Ausschläge.",
    "kt.aciklama.baslik": "Sieh dein Kontingent, bevor es erschöpft ist; plane deine Kapazität im Voraus.",
    "kt.aciklama.metin":
      "Mit drei separaten statistischen Methoden ({plan}-Plan, Tag {gecti}/{toplam}) prognostiziert diese Engine die Verifizierungsnutzung zum Monatsende, berechnet, an welchem Tag das Kontingent erschöpft ist, und empfiehlt den richtigen Plan.",
    "kt.kart.mevcut": "Aktuelle Nutzung ({pct} % des Kontingents)",
    "kt.kart.aySonu": "Monatsend-Prognose · {yontem}",
    "kt.kart.tukenisGunu": "Geschätzter Erschöpfungstag",
    "kt.kart.yeterliEtiket": "Kontingent reicht bis Monatsende",
    "kt.kart.gunEtiketi": "Tag {n}",
    "kt.kart.yeterli": "Ausreichend",
    "kt.kart.trend": "Nutzungstrend (Regression)",
    "kt.uyari.baslik": "Kontingent erschöpft vor Monatsende — geschätzt Tag {n}",
    "kt.uyari.metin":
      "Nach der gewählten Methode ({yontem}) füllt sich der {plan}-Plan mit {kota} Kontingent bei ~{hiz} Verifizierungen/Tag am Tag {gun} des Monats. Monatsend-Prognose {tahmin} — ",
    "kt.uyari.asim": "{n} Überschreitung",
    "kt.uyari.oneri": ". Erwäge, deinen Plan hochzustufen oder die Nutzung zu reduzieren.",
    "kt.ok.baslik": "Kontingent reicht bis Monatsende",
    "kt.ok.metin":
      "Geschätzte Monatsend-Nutzung {tahmin} / {kota} Kontingent ({pct} % ausgelastet). Die verbleibenden {kalan} Tage bergen beim aktuellen Tempo kein Risiko.",
    "kt.proj.baslik": "Nutzungsprojektion",
    "kt.proj.altBaslik":
      "Tatsächliche Tagesnutzung + zukunftsgerichtete Prognoselinie der gewählten Methode ({yontem}).",
    "kt.proj.seriGercek": "Tatsächlich",
    "kt.proj.seriTahmin": "Prognose (Projektion)",
    "kt.proj.guvenAraligi": "Konfidenzband:",
    "kt.proj.band": "(Monatsendband der drei Methoden, Breite {n})",
    "kt.proj.trendEgimi": "Trendsteigung:",
    "kt.proj.gunBirim": "/Tag",
    "kt.tablo.baslik": "Vergleich der 3 Methoden",
    "kt.tablo.altBaslik":
      "Drei verschiedene Prognosemethoden wurden auf dieselben Daten angewendet. Gewählt wurde die Methode mit der medianen (ausgewogenen) Prognose.",
    "kt.tablo.yontem": "Methode",
    "kt.tablo.gunlukHiz": "Tagestempo",
    "kt.tablo.aySonu": "Monatsend-Prognose",
    "kt.tablo.asim": "Überschreitung",
    "kt.tablo.tukenis": "Erschöpfungstag",
    "kt.tablo.durum": "Status",
    "kt.tablo.secilen": "Gewählt",
    "kt.tablo.yeter": "reicht",
    "kt.tablo.asimRiski": "Überschreitungsrisiko",
    "kt.tablo.guvenli": "Sicher",
    "kt.kapasite.baslik": "Kapazitätsplanung",
    "kt.kapasite.altBaslik":
      "Eignung, Spielraum und empfohlene Stufe jedes Plans basierend auf der geschätzten Monatsend-Nutzung.",
    "kt.kapasite.mevcutPlan": "Aktueller Plan",
    "kt.kapasite.onerilen": "Empfohlen",
    "kt.kapasite.kota": "Kontingent {n}",
    "kt.kapasite.bosluk": "{pct} % Spielraum verbleibt",
    "kt.kapasite.asilir": "Kontingent überschritten",
    "kt.kapasite.tahmini": "Prognose {tahmin} / {kota}",
    "kt.gerekce.mevcutYeter":
      "Dein aktueller Plan deckt die geschätzte Monatsend-Nutzung bequem ab. Kein Upgrade nötig.",
    "kt.gerekce.ekonomik":
      "Der aktuelle Plan reicht aus; unten wird jedoch der wirtschaftlichste Plan empfohlen, der die geschätzte Nutzung abdeckt.",
    "kt.gerekce.asiyor":
      "Deine geschätzte Monatsend-Nutzung überschreitet das aktuelle Kontingent; empfohlen wird die kleinste Stufe, die diese Nutzung fasst.",
    "kt.gerekce.enYuksek":
      "Die geschätzte Nutzung überschreitet das Kontingent aller Pläne; die höchste Stufe wird empfohlen, eine Überschreitungsgebühr ist unvermeidlich.",
    "kt.not":
      "Prognosen sind statistische Projektionen auf Basis historischer Verifizierungsdaten (issued); plötzliche Traffic-Änderungen können das Ergebnis beeinflussen. Die Engine ist deterministisch — dieselben Daten liefern stets dieselbe Prognose. Berücksichtige für Entscheidungen das von allen drei Methoden gebildete Konfidenzband gemeinsam.",
  },
  fr: {
    "kt.trend.artıyor": "En hausse",
    "kt.trend.azalıyor": "En baisse",
    "kt.trend.sabit": "Stable",
    "kt.yontem.basit": "Moyenne simple",
    "kt.yontem.regresyon": "Régression linéaire",
    "kt.yontem.agirlikli": "Pondéré sur 7 jours",
    "kt.yontemAciklama.basit":
      "Applique la moyenne quotidienne actuelle aux jours restants de façon constante. La méthode la plus simple et stable ; elle ignore la tendance.",
    "kt.yontemAciklama.regresyon":
      "Capte la tendance avec une droite des moindres carrés. Si l'usage accélère ou ralentit, elle le reporte dans la projection.",
    "kt.yontemAciklama.agirlikli":
      "Donne un poids croissant aux 7 derniers jours ; sensible au comportement le plus récent, elle réagit vite aux pics soudains.",
    "kt.aciklama.baslik": "Voyez votre quota avant qu'il ne s'épuise ; planifiez votre capacité à l'avance.",
    "kt.aciklama.metin":
      "À l'aide de trois méthodes statistiques distinctes (forfait {plan}, jour {gecti}/{toplam}), ce moteur prévoit l'usage de vérification en fin de mois, calcule le jour où le quota s'épuisera et recommande le bon forfait.",
    "kt.kart.mevcut": "Usage actuel ({pct} % du quota)",
    "kt.kart.aySonu": "Prévision de fin de mois · {yontem}",
    "kt.kart.tukenisGunu": "Jour d'épuisement estimé",
    "kt.kart.yeterliEtiket": "Le quota tient jusqu'à la fin du mois",
    "kt.kart.gunEtiketi": "Jour {n}",
    "kt.kart.yeterli": "Suffisant",
    "kt.kart.trend": "Tendance d'usage (régression)",
    "kt.uyari.baslik": "Le quota s'épuise avant la fin du mois — jour {n} estimé",
    "kt.uyari.metin":
      "Selon la méthode choisie ({yontem}), à ~{hiz} vérifications/jour, le forfait {plan} de {kota} de quota sera plein le jour {gun} du mois. Prévision de fin de mois : {tahmin} — ",
    "kt.uyari.asim": "{n} de dépassement",
    "kt.uyari.oneri": ". Envisagez de passer à un forfait supérieur ou de réduire l'usage.",
    "kt.ok.baslik": "Le quota est suffisant jusqu'à la fin du mois",
    "kt.ok.metin":
      "Usage estimé de fin de mois : {tahmin} / {kota} de quota ({pct} % rempli). Les {kalan} jours restants ne présentent aucun risque au rythme actuel.",
    "kt.proj.baslik": "Projection d'usage",
    "kt.proj.altBaslik":
      "Usage quotidien réel + ligne de prévision prospective de la méthode choisie ({yontem}).",
    "kt.proj.seriGercek": "Réel",
    "kt.proj.seriTahmin": "Prévision (projection)",
    "kt.proj.guvenAraligi": "Intervalle de confiance :",
    "kt.proj.band": "(bande de fin de mois des trois méthodes, largeur {n})",
    "kt.proj.trendEgimi": "Pente de tendance :",
    "kt.proj.gunBirim": "/jour",
    "kt.tablo.baslik": "Comparaison des 3 méthodes",
    "kt.tablo.altBaslik":
      "Trois méthodes de prévision différentes ont été appliquées aux mêmes données. La méthode donnant la prévision médiane (équilibrée) a été retenue.",
    "kt.tablo.yontem": "Méthode",
    "kt.tablo.gunlukHiz": "Débit quotidien",
    "kt.tablo.aySonu": "Prévision de fin de mois",
    "kt.tablo.asim": "Dépassement",
    "kt.tablo.tukenis": "Jour d'épuisement",
    "kt.tablo.durum": "État",
    "kt.tablo.secilen": "Retenue",
    "kt.tablo.yeter": "suffit",
    "kt.tablo.asimRiski": "Risque de dépassement",
    "kt.tablo.guvenli": "Sûr",
    "kt.kapasite.baslik": "Planification de capacité",
    "kt.kapasite.altBaslik":
      "L'adéquation, la marge et le palier recommandé de chaque forfait selon l'usage estimé de fin de mois.",
    "kt.kapasite.mevcutPlan": "Forfait actuel",
    "kt.kapasite.onerilen": "Recommandé",
    "kt.kapasite.kota": "quota {n}",
    "kt.kapasite.bosluk": "{pct} % de marge restante",
    "kt.kapasite.asilir": "Quota dépassé",
    "kt.kapasite.tahmini": "prévision {tahmin} / {kota}",
    "kt.gerekce.mevcutYeter":
      "Votre forfait actuel couvre confortablement l'usage estimé de fin de mois. Aucune mise à niveau nécessaire.",
    "kt.gerekce.ekonomik":
      "Le forfait actuel suffit ; toutefois, le forfait le plus économique couvrant l'usage estimé est recommandé ci-dessous.",
    "kt.gerekce.asiyor":
      "Votre usage estimé de fin de mois dépasse le quota actuel ; le forfait recommandé est le plus petit palier qui contient cet usage.",
    "kt.gerekce.enYuksek":
      "L'usage estimé dépasse le quota de tous les forfaits ; le palier le plus élevé est recommandé et des frais de dépassement sont inévitables.",
    "kt.not":
      "Les prévisions sont des projections statistiques basées sur les données historiques de vérification (issued) ; des changements soudains de trafic peuvent affecter le résultat. Le moteur est déterministe — les mêmes données produisent toujours la même prévision. Pour décider, évaluez ensemble l'intervalle de confiance formé par les trois méthodes.",
  },
  es: {
    "kt.trend.artıyor": "En aumento",
    "kt.trend.azalıyor": "En descenso",
    "kt.trend.sabit": "Estable",
    "kt.yontem.basit": "Promedio simple",
    "kt.yontem.regresyon": "Regresión lineal",
    "kt.yontem.agirlikli": "Ponderado últimos 7 días",
    "kt.yontemAciklama.basit":
      "Aplica el promedio diario actual a los días restantes de forma constante. El método más simple y estable; no detecta la tendencia.",
    "kt.yontemAciklama.regresyon":
      "Capta la tendencia con una recta de mínimos cuadrados. Si el uso se acelera o desacelera, lo traslada a la proyección.",
    "kt.yontemAciklama.agirlikli":
      "Da peso creciente a los últimos 7 días; es sensible al comportamiento más reciente y reacciona rápido a picos repentinos.",
    "kt.aciklama.baslik": "Consulta tu cuota antes de que se agote; planifica tu capacidad con antelación.",
    "kt.aciklama.metin":
      "Con tres métodos estadísticos distintos (plan {plan}, día {gecti}/{toplam}), este motor prevé el uso de verificación de fin de mes, calcula qué día se agotará la cuota y recomienda el plan adecuado.",
    "kt.kart.mevcut": "Uso actual ({pct} % de la cuota)",
    "kt.kart.aySonu": "Pronóstico de fin de mes · {yontem}",
    "kt.kart.tukenisGunu": "Día estimado de agotamiento",
    "kt.kart.yeterliEtiket": "La cuota alcanza hasta fin de mes",
    "kt.kart.gunEtiketi": "Día {n}",
    "kt.kart.yeterli": "Suficiente",
    "kt.kart.trend": "Tendencia de uso (regresión)",
    "kt.uyari.baslik": "La cuota se agota antes de fin de mes — día {n} estimado",
    "kt.uyari.metin":
      "Según el método seleccionado ({yontem}), a ~{hiz} verificaciones/día, el plan {plan} de {kota} de cuota se llenará el día {gun} del mes. Pronóstico de fin de mes: {tahmin} — ",
    "kt.uyari.asim": "{n} de exceso",
    "kt.uyari.oneri": ". Considera subir de plan o reducir el uso.",
    "kt.ok.baslik": "La cuota es suficiente hasta fin de mes",
    "kt.ok.metin":
      "Uso estimado de fin de mes: {tahmin} / {kota} de cuota ({pct} % lleno). Los {kalan} días restantes no suponen riesgo al ritmo actual.",
    "kt.proj.baslik": "Proyección de uso",
    "kt.proj.altBaslik":
      "Uso diario real + línea de pronóstico prospectiva del método seleccionado ({yontem}).",
    "kt.proj.seriGercek": "Real",
    "kt.proj.seriTahmin": "Pronóstico (proyección)",
    "kt.proj.guvenAraligi": "Intervalo de confianza:",
    "kt.proj.band": "(banda de fin de mes de los tres métodos, amplitud {n})",
    "kt.proj.trendEgimi": "Pendiente de tendencia:",
    "kt.proj.gunBirim": "/día",
    "kt.tablo.baslik": "Comparación de 3 métodos",
    "kt.tablo.altBaslik":
      "Se aplicaron tres métodos de pronóstico distintos a los mismos datos. Se eligió el método que da el pronóstico mediano (equilibrado).",
    "kt.tablo.yontem": "Método",
    "kt.tablo.gunlukHiz": "Ritmo diario",
    "kt.tablo.aySonu": "Pronóstico de fin de mes",
    "kt.tablo.asim": "Exceso",
    "kt.tablo.tukenis": "Día de agotamiento",
    "kt.tablo.durum": "Estado",
    "kt.tablo.secilen": "Seleccionado",
    "kt.tablo.yeter": "alcanza",
    "kt.tablo.asimRiski": "Riesgo de exceso",
    "kt.tablo.guvenli": "Seguro",
    "kt.kapasite.baslik": "Planificación de capacidad",
    "kt.kapasite.altBaslik":
      "La adecuación, el margen y el nivel recomendado de cada plan según el uso estimado de fin de mes.",
    "kt.kapasite.mevcutPlan": "Plan actual",
    "kt.kapasite.onerilen": "Recomendado",
    "kt.kapasite.kota": "cuota {n}",
    "kt.kapasite.bosluk": "queda {pct} % de margen",
    "kt.kapasite.asilir": "Cuota superada",
    "kt.kapasite.tahmini": "pronóstico {tahmin} / {kota}",
    "kt.gerekce.mevcutYeter":
      "Tu plan actual cubre con holgura el uso estimado de fin de mes. No se necesita mejora.",
    "kt.gerekce.ekonomik":
      "El plan actual basta; no obstante, abajo se recomienda el plan más económico que cubre el uso estimado.",
    "kt.gerekce.asiyor":
      "Tu uso estimado de fin de mes supera la cuota actual; el plan recomendado es el nivel más pequeño que abarca este uso.",
    "kt.gerekce.enYuksek":
      "El uso estimado supera la cuota de todos los planes; se recomienda el nivel más alto y un cargo por exceso es inevitable.",
    "kt.not":
      "Los pronósticos son proyecciones estadísticas basadas en datos históricos de verificación (issued); cambios repentinos de tráfico pueden afectar el resultado. El motor es determinista — los mismos datos siempre producen el mismo pronóstico. Para decidir, evalúa en conjunto el intervalo de confianza formado por los tres métodos.",
  },
};

export function ktCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
