import type { Dil } from "@/lib/i18n/panel";

/**
 * Kullanım Ölçümü & SLA Takibi sayfasına özel i18n sözlüğü
 * (yalnızca bu modül kullanır). "ko." namespace'li anahtarlar. Doğal/native çeviriler.
 *
 * NOT: Sayılar, para birimi (₺) ve tarihler veri olarak kalır, BCP-47 ile biçimlenir.
 * SLA durumu (karşılanıyor/risk/ihlal), SLA metriği (uptime/latency/support), plan
 * kademesi (baslangic/buyume/kurumsal) enum/anahtar üzerinden çözülür — olcum.ts
 * lib'inde ÜRETİLEN TR ad/açıklama/gerekçe metinleri (canlı sayı içerebilir) lib
 * düzenlenmeden istemcide yeniden türetilir (label-map → key-map). TR kaynak/otorite;
 * anahtar yoksa TR'ye düşer.
 */
const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    "ko.baslik": "Kullanım Ölçümü & SLA Takibi",

    // --- açıklama şeridi ---
    "ko.intro.baslik":
      "Gerçek kullanımını plan kotasına ölç, ay-sonu faturanı önceden gör, SLA taahhütlerini izle.",
    "ko.intro.planEki": "planı",
    "ko.intro.varsayilan": " (varsayılan — hesapta plan tanımlı değil)",
    "ko.intro.metin":
      "{gecen}/{toplam} gün · {olay} gözlemlenen olay. Kullanım gerçek olaylardan ölçülür; fatura ve projeksiyon tahmindir; SLA gerçekleşen değerleri gözlemden türetilir.",

    // --- özet kartları ---
    "ko.ozet.kullanilan": "Kullanılan doğrulama (%{pct} kota)",
    "ko.ozet.projeksiyon": "Ay-sonu projeksiyon",
    "ko.ozet.faturaTahmini": "Fatura tahmini (ay-sonu)",
    "ko.ozet.slaUyum": "SLA uyumu",
    "ko.ozet.slaUyumKredi": "SLA uyumu · %{kredi} kredi",

    // --- görsel çeşitlilik: gauge / donut / trend / histogram / öngörü ---
    "ko.gauge.kullanim": "Kota kullanımı",
    "ko.gauge.projeksiyon": "Ay-sonu proj.",
    "ko.gauge.donem": "Dönem ilerlemesi",
    "ko.gauge.donemAlt": "Ayın {gecen}/{toplam} günü",
    "ko.donut.baslik": "Kaynak dağılımı (tahmini)",
    "ko.donut.merkez": "olay",
    "ko.donut.dogrulama": "Doğrulama olayı",
    "ko.donut.apiCagri": "API çağrısı",
    "ko.donut.asim": "Aşım (projeksiyon)",
    "ko.trend.baslik": "Kümülatif kullanım & kota yolu",
    "ko.trend.aciklama": "Ayın gününe göre biriken doğrulama; kesikli çizgi kotaya varış yolunu (run-rate) gösterir.",
    "ko.trend.gercek": "Kümülatif gerçek",
    "ko.trend.projeksiyon": "Kota yolu (run-rate)",
    "ko.hist.baslik": "Günlük kullanım dağılımı",
    "ko.hist.aciklama": "Bu ayın günlük doğrulama hacmi. En yoğun gün vurgulanır; ortalama run-rate referans çizgisidir.",
    "ko.ongoru.baslik": "Öngörü",
    "ko.ongoru.tahminiBitis": "Kota tükeniş tahmini",
    "ko.ongoru.gunSonra": "{n}. günde",
    "ko.ongoru.riskYok": "Bu dönem tükenmez",
    "ko.ongoru.enYogun": "En yoğun gün",
    "ko.ongoru.zirve": "{n} doğrulama",

    // --- kota kullanım göstergesi ---
    "ko.kota.baslik": "Kota kullanım göstergesi",
    "ko.kota.suAnaKadar": "Şu ana kadar kullanılan",
    "ko.kota.gercek": "Gerçek kullanım (%{pct})",
    "ko.kota.projeksiyon": "Ay-sonu projeksiyon (%{pct})",
    "ko.kota.sinir": "Kota sınırı",
    "ko.kota.gunlukOrt": "Günlük ort. (run-rate)",
    "ko.kota.gunBirim": "{n}/gün",
    "ko.kota.kalanGun": "Kalan gün",
    "ko.kota.gunEki": "{n} gün",
    "ko.kota.apiCagri": "Türetilmiş API çağrısı",
    "ko.kota.asimBaslik": "Kota aşımı öngörülüyor",
    "ko.kota.asimMetin":
      "Mevcut günlük hızla ay sonunda <strong>{proj}</strong> doğrulamaya ulaşırsın — kotanı <strong>{asim}</strong> ({pct}%) aşar. ",
    "ko.kota.asimUcretli": "Bu, {tutar} aşım ücreti demek.",
    "ko.kota.asimBlok": "Bu plan aşımı bloklar — kota dolunca doğrulama reddedilir.",
    "ko.kota.guvenBaslik": "Kota güvende",
    "ko.kota.guvenMetin":
      "Ay-sonu projeksiyonun (<strong>{proj}</strong>) kotanın altında; aşım riski yok.",

    // --- fatura projeksiyonu ---
    "ko.fatura.gunlukBaslik": "Günlük kullanım & projeksiyon",
    "ko.fatura.gunlukMetin":
      "Bu ayın gerçek günlük doğrulama hacmi ve run-rate ile uzatılan ay-sonu projeksiyon çizgisi.",
    "ko.fatura.baslik": "Fatura projeksiyonu",
    "ko.fatura.taban": "Taban ücret · {plan}",
    "ko.fatura.asimUcreti": "Aşım ücreti",
    "ko.fatura.asimDetay": "{miktar} × {birim}/doğrulama",
    "ko.fatura.toplam": "Ay-sonu tahmini toplam",
    "ko.fatura.slaKredi": "SLA kredisi: −{tutar}",
    "ko.fatura.slaKrediMetin":
      "İhlal edilen taahhütler için bir sonraki faturadan düşülmesi gereken kredi.",
    "ko.fatura.dipnot":
      "Rakamlar mevcut run-rate'e dayalı projeksiyondur; gerçek fatura ay sonundaki fiili kullanıma göre kesilir.",

    // --- SLA uyum tablosu ---
    "ko.sla.baslik": "SLA uyum durumu",
    "ko.sla.metin":
      "Her taahhüt için sözleşme hedefi vs gözlemlenen gerçek değer, uyum durumu ve ihlalde ödenmesi gereken kredi.",
    "ko.sla.metinEk":
      " p95 gecikme gerçek olay verisinden; çalışma süresi ve destek gözlem-türevidir.",
    "ko.sla.thMetrik": "Metrik",
    "ko.sla.thTaahhut": "Taahhüt",
    "ko.sla.thGerceklesen": "Gerçekleşen",
    "ko.sla.thKarsilama": "Karşılama",
    "ko.sla.thDurum": "Durum",
    "ko.sla.thKredi": "Kredi",
    "ko.sla.hepsiKarsilaniyor": "Tüm SLA taahhütleri karşılanıyor — bu dönem kredi borcu yok.",
    "ko.sla.ihlalOzet": "{n} metrik ihlalde · toplam %{kredi} kredi ({tutar}).",

    // SLA metrik adları (anahtar → ad; lib TR yerine istemcide)
    "ko.slaMetrik.uptime": "Çalışma süresi",
    "ko.slaMetrik.latency": "Engelleme gecikmesi (p95)",
    "ko.slaMetrik.support": "Destek ilk-yanıt",

    // SLA metrik açıklamaları (anahtar → açıklama; p99 latency'de interpolasyon)
    "ko.slaAciklama.uptime":
      "Aşırı gecikmeli (taahhüt p95'in 4 katından yavaş) olaylar fiili kesinti sayılır; oranı çalışma süresini düşürür.",
    "ko.slaAciklama.latency": "Gerçek olay gecikmelerinin 95. yüzdeliği. p99: {p99} ms.",
    "ko.slaAciklama.support":
      "Gözlemlenen olay hacminin yarattığı yük baskısından türetilen temsili ilk-yanıt süresi.",

    // SLA durum etiketleri (enum → etiket)
    "ko.slaDurum.karsilaniyor": "Karşılanıyor",
    "ko.slaDurum.risk": "Risk",
    "ko.slaDurum.ihlal": "İhlal",

    // birim etiketleri (lib birim alanı → çevrili son ek)
    "ko.birim.sa": "sa",

    // --- plan karşılaştırma ---
    "ko.plan.baslik": "Plan karşılaştırma",
    "ko.plan.mevcut": "Mevcut",
    "ko.plan.onerilen": "Önerilen",
    "ko.plan.ucretsiz": "Ücretsiz",
    "ko.plan.ay": "/ay",
    "ko.plan.aylikKota": "Aylık kota",
    "ko.plan.slaUptime": "SLA çalışma süresi",
    "ko.plan.gecikmeP95": "Gecikme p95",
    "ko.plan.destekYaniti": "Destek yanıtı",
    "ko.plan.saEki": "{n} sa",
    "ko.plan.projeksiyonUygun": "Projeksiyona uygun",
    "ko.plan.evet": "Evet",
    "ko.plan.asar": "Aşar",
    "ko.plan.yukseltmeBaslik": "{plan} planına yükseltme öneriliyor",
    "ko.plan.yukseltmeBtn": "Planı yükselt",

    // plan adları (id → ad; lib TR yerine istemcide)
    "ko.planAd.baslangic": "Başlangıç",
    "ko.planAd.buyume": "Büyüme",
    "ko.planAd.kurumsal": "Ölçek",

    // yükseltme gerekçeleri (senaryo anahtarı → metin; lib TR yerine istemcide)
    "ko.gerekce.yok":
      "Mevcut plan tahmini ay-sonu kullanımını rahatça karşılıyor. Yükseltme gerekmez.",
    "ko.gerekce.enUstAsiyor":
      "Projeksiyon en yüksek planın kotasını da aşıyor; kurumsal aşım anlaşması gerekli.",
    "ko.gerekce.enUstYaklasiyor":
      "Kotanın sonuna yaklaşıyorsun ama daha üst bir kademe yok.",
    "ko.gerekce.asiyor":
      "Ay-sonu projeksiyonun ({proj}) mevcut kotayı aşıyor. {plan} planı bu kullanımı sığdırır ve aşım ücretinden kaçınmanı sağlar.",
    "ko.gerekce.yaklasiyor":
      "Kotanın %{pct}'ini kullandın. {plan} planına geçmek büyüme için tampon sağlar.",

    // --- günlük grafik ---
    "ko.grafik.bosVeri": "Bu dönem henüz kullanım verisi yok.",
    "ko.grafik.aria": "Günlük kullanım ve projeksiyon",
    "ko.grafik.projeksiyon": "Projeksiyon",
    "ko.grafik.gercekGunluk": "Gerçek günlük",
    "ko.grafik.runRate": "Run-rate ({n}/gün)",
  },

  en: {
    "ko.baslik": "Usage Metering & SLA Tracking",

    "ko.intro.baslik":
      "Measure your real usage against your plan quota, preview your end-of-month bill, track your SLA commitments.",
    "ko.intro.planEki": "plan",
    "ko.intro.varsayilan": " (default — no plan defined on the account)",
    "ko.intro.metin":
      "{gecen}/{toplam} days · {olay} observed events. Usage is measured from real events; the bill and projection are estimates; SLA actuals are derived from observation.",

    "ko.ozet.kullanilan": "Verifications used ({pct}% of quota)",
    "ko.ozet.projeksiyon": "End-of-month projection",
    "ko.ozet.faturaTahmini": "Estimated bill (end-of-month)",
    "ko.ozet.slaUyum": "SLA compliance",
    "ko.ozet.slaUyumKredi": "SLA compliance · {kredi}% credit",

    "ko.gauge.kullanim": "Quota usage",
    "ko.gauge.projeksiyon": "EOM projection",
    "ko.gauge.donem": "Period progress",
    "ko.gauge.donemAlt": "Day {gecen}/{toplam} of the month",
    "ko.donut.baslik": "Source breakdown (estimated)",
    "ko.donut.merkez": "events",
    "ko.donut.dogrulama": "Verification events",
    "ko.donut.apiCagri": "API calls",
    "ko.donut.asim": "Overage (projected)",
    "ko.trend.baslik": "Cumulative usage & quota path",
    "ko.trend.aciklama": "Verifications accrued by day of month; the dashed line shows the run-rate path to the quota.",
    "ko.trend.gercek": "Cumulative actual",
    "ko.trend.projeksiyon": "Quota path (run-rate)",
    "ko.hist.baslik": "Daily usage distribution",
    "ko.hist.aciklama": "This month's daily verification volume. The busiest day is highlighted; the average run-rate is the reference line.",
    "ko.ongoru.baslik": "Forecast",
    "ko.ongoru.tahminiBitis": "Estimated quota exhaustion",
    "ko.ongoru.gunSonra": "on day {n}",
    "ko.ongoru.riskYok": "Won't exhaust this period",
    "ko.ongoru.enYogun": "Busiest day",
    "ko.ongoru.zirve": "{n} verifications",

    "ko.kota.baslik": "Quota usage gauge",
    "ko.kota.suAnaKadar": "Used so far",
    "ko.kota.gercek": "Actual usage ({pct}%)",
    "ko.kota.projeksiyon": "End-of-month projection ({pct}%)",
    "ko.kota.sinir": "Quota limit",
    "ko.kota.gunlukOrt": "Daily avg. (run-rate)",
    "ko.kota.gunBirim": "{n}/day",
    "ko.kota.kalanGun": "Days remaining",
    "ko.kota.gunEki": "{n} days",
    "ko.kota.apiCagri": "Derived API calls",
    "ko.kota.asimBaslik": "Quota overage projected",
    "ko.kota.asimMetin":
      "At the current daily rate you will reach <strong>{proj}</strong> verifications by month-end — exceeding your quota by <strong>{asim}</strong> ({pct}%). ",
    "ko.kota.asimUcretli": "That means a {tutar} overage charge.",
    "ko.kota.asimBlok": "This plan blocks overage — once the quota is full, verifications are rejected.",
    "ko.kota.guvenBaslik": "Quota safe",
    "ko.kota.guvenMetin":
      "Your end-of-month projection (<strong>{proj}</strong>) is below the quota; no overage risk.",

    "ko.fatura.gunlukBaslik": "Daily usage & projection",
    "ko.fatura.gunlukMetin":
      "This month's real daily verification volume and the end-of-month projection line extended by run-rate.",
    "ko.fatura.baslik": "Bill projection",
    "ko.fatura.taban": "Base fee · {plan}",
    "ko.fatura.asimUcreti": "Overage charge",
    "ko.fatura.asimDetay": "{miktar} × {birim}/verification",
    "ko.fatura.toplam": "Estimated end-of-month total",
    "ko.fatura.slaKredi": "SLA credit: −{tutar}",
    "ko.fatura.slaKrediMetin":
      "Credit to be deducted from the next bill for breached commitments.",
    "ko.fatura.dipnot":
      "Figures are a projection based on the current run-rate; the actual bill is issued based on real usage at month-end.",

    "ko.sla.baslik": "SLA compliance status",
    "ko.sla.metin":
      "For each commitment: contract target vs observed actual value, compliance status and the credit owed on a breach.",
    "ko.sla.metinEk":
      " p95 latency from real event data; uptime and support are observation-derived.",
    "ko.sla.thMetrik": "Metric",
    "ko.sla.thTaahhut": "Commitment",
    "ko.sla.thGerceklesen": "Actual",
    "ko.sla.thKarsilama": "Attainment",
    "ko.sla.thDurum": "Status",
    "ko.sla.thKredi": "Credit",
    "ko.sla.hepsiKarsilaniyor": "All SLA commitments are met — no credit owed this period.",
    "ko.sla.ihlalOzet": "{n} metrics in breach · total {kredi}% credit ({tutar}).",

    "ko.slaMetrik.uptime": "Uptime",
    "ko.slaMetrik.latency": "Block latency (p95)",
    "ko.slaMetrik.support": "Support first response",

    "ko.slaAciklama.uptime":
      "Events with extreme latency (slower than 4× the committed p95) count as actual downtime; their ratio lowers uptime.",
    "ko.slaAciklama.latency": "The 95th percentile of real event latencies. p99: {p99} ms.",
    "ko.slaAciklama.support":
      "A representative first-response time derived from the load pressure created by observed event volume.",

    "ko.slaDurum.karsilaniyor": "Met",
    "ko.slaDurum.risk": "Risk",
    "ko.slaDurum.ihlal": "Breach",

    "ko.birim.sa": "h",

    "ko.plan.baslik": "Plan comparison",
    "ko.plan.mevcut": "Current",
    "ko.plan.onerilen": "Recommended",
    "ko.plan.ucretsiz": "Free",
    "ko.plan.ay": "/mo",
    "ko.plan.aylikKota": "Monthly quota",
    "ko.plan.slaUptime": "SLA uptime",
    "ko.plan.gecikmeP95": "Latency p95",
    "ko.plan.destekYaniti": "Support response",
    "ko.plan.saEki": "{n} h",
    "ko.plan.projeksiyonUygun": "Fits projection",
    "ko.plan.evet": "Yes",
    "ko.plan.asar": "Exceeds",
    "ko.plan.yukseltmeBaslik": "Upgrade to the {plan} plan is recommended",
    "ko.plan.yukseltmeBtn": "Upgrade plan",

    "ko.planAd.baslangic": "Starter",
    "ko.planAd.buyume": "Growth",
    "ko.planAd.kurumsal": "Enterprise",

    "ko.gerekce.yok":
      "Your current plan comfortably covers the projected end-of-month usage. No upgrade needed.",
    "ko.gerekce.enUstAsiyor":
      "The projection exceeds even the highest plan's quota; an enterprise overage agreement is required.",
    "ko.gerekce.enUstYaklasiyor":
      "You're nearing the end of your quota, but there is no higher tier.",
    "ko.gerekce.asiyor":
      "Your end-of-month projection ({proj}) exceeds the current quota. The {plan} plan fits this usage and lets you avoid overage charges.",
    "ko.gerekce.yaklasiyor":
      "You've used {pct}% of your quota. Moving to the {plan} plan provides headroom for growth.",

    "ko.grafik.bosVeri": "No usage data for this period yet.",
    "ko.grafik.aria": "Daily usage and projection",
    "ko.grafik.projeksiyon": "Projection",
    "ko.grafik.gercekGunluk": "Actual daily",
    "ko.grafik.runRate": "Run-rate ({n}/day)",
  },

  de: {
    "ko.baslik": "Nutzungsmessung & SLA-Verfolgung",

    "ko.intro.baslik":
      "Miss deine echte Nutzung gegen dein Plankontingent, sieh deine Rechnung zum Monatsende voraus, verfolge deine SLA-Zusagen.",
    "ko.intro.planEki": "-Plan",
    "ko.intro.varsayilan": " (Standard — kein Plan im Konto definiert)",
    "ko.intro.metin":
      "{gecen}/{toplam} Tage · {olay} beobachtete Ereignisse. Die Nutzung wird aus echten Ereignissen gemessen; Rechnung und Projektion sind Schätzungen; SLA-Istwerte werden aus der Beobachtung abgeleitet.",

    "ko.ozet.kullanilan": "Verwendete Verifizierungen ({pct} % des Kontingents)",
    "ko.ozet.projeksiyon": "Monatsend-Projektion",
    "ko.ozet.faturaTahmini": "Geschätzte Rechnung (Monatsende)",
    "ko.ozet.slaUyum": "SLA-Konformität",
    "ko.ozet.slaUyumKredi": "SLA-Konformität · {kredi} % Gutschrift",

    "ko.kota.baslik": "Kontingent-Nutzungsanzeige",
    "ko.kota.suAnaKadar": "Bisher verwendet",
    "ko.kota.gercek": "Tatsächliche Nutzung ({pct} %)",
    "ko.kota.projeksiyon": "Monatsend-Projektion ({pct} %)",
    "ko.kota.sinir": "Kontingentgrenze",
    "ko.kota.gunlukOrt": "Tagesdurchschnitt (Run-Rate)",
    "ko.kota.gunBirim": "{n}/Tag",
    "ko.kota.kalanGun": "Verbleibende Tage",
    "ko.kota.gunEki": "{n} Tage",
    "ko.kota.apiCagri": "Abgeleitete API-Aufrufe",
    "ko.kota.asimBaslik": "Kontingentüberschreitung prognostiziert",
    "ko.kota.asimMetin":
      "Bei der aktuellen Tagesrate erreichst du bis Monatsende <strong>{proj}</strong> Verifizierungen — das überschreitet dein Kontingent um <strong>{asim}</strong> ({pct} %). ",
    "ko.kota.asimUcretli": "Das bedeutet eine Überschreitungsgebühr von {tutar}.",
    "ko.kota.asimBlok": "Dieser Plan blockiert Überschreitungen — ist das Kontingent voll, werden Verifizierungen abgelehnt.",
    "ko.kota.guvenBaslik": "Kontingent sicher",
    "ko.kota.guvenMetin":
      "Deine Monatsend-Projektion (<strong>{proj}</strong>) liegt unter dem Kontingent; kein Überschreitungsrisiko.",

    "ko.fatura.gunlukBaslik": "Tägliche Nutzung & Projektion",
    "ko.fatura.gunlukMetin":
      "Das tatsächliche tägliche Verifizierungsvolumen dieses Monats und die per Run-Rate verlängerte Monatsend-Projektionslinie.",
    "ko.fatura.baslik": "Rechnungsprojektion",
    "ko.fatura.taban": "Grundgebühr · {plan}",
    "ko.fatura.asimUcreti": "Überschreitungsgebühr",
    "ko.fatura.asimDetay": "{miktar} × {birim}/Verifizierung",
    "ko.fatura.toplam": "Geschätzte Monatsend-Summe",
    "ko.fatura.slaKredi": "SLA-Gutschrift: −{tutar}",
    "ko.fatura.slaKrediMetin":
      "Für verletzte Zusagen von der nächsten Rechnung abzuziehende Gutschrift.",
    "ko.fatura.dipnot":
      "Die Zahlen sind eine Projektion auf Basis der aktuellen Run-Rate; die tatsächliche Rechnung wird nach der realen Nutzung zum Monatsende erstellt.",

    "ko.sla.baslik": "SLA-Konformitätsstatus",
    "ko.sla.metin":
      "Für jede Zusage: Vertragsziel vs. beobachteter Istwert, Konformitätsstatus und die bei einer Verletzung geschuldete Gutschrift.",
    "ko.sla.metinEk":
      " p95-Latenz aus echten Ereignisdaten; Verfügbarkeit und Support sind beobachtungsabgeleitet.",
    "ko.sla.thMetrik": "Metrik",
    "ko.sla.thTaahhut": "Zusage",
    "ko.sla.thGerceklesen": "Ist",
    "ko.sla.thKarsilama": "Erfüllung",
    "ko.sla.thDurum": "Status",
    "ko.sla.thKredi": "Gutschrift",
    "ko.sla.hepsiKarsilaniyor": "Alle SLA-Zusagen werden erfüllt — keine Gutschrift in diesem Zeitraum geschuldet.",
    "ko.sla.ihlalOzet": "{n} Metriken verletzt · insgesamt {kredi} % Gutschrift ({tutar}).",

    "ko.slaMetrik.uptime": "Verfügbarkeit",
    "ko.slaMetrik.latency": "Blockierlatenz (p95)",
    "ko.slaMetrik.support": "Support-Erstantwort",

    "ko.slaAciklama.uptime":
      "Ereignisse mit extremer Latenz (langsamer als das 4-Fache der zugesagten p95) gelten als tatsächliche Ausfallzeit; ihr Anteil senkt die Verfügbarkeit.",
    "ko.slaAciklama.latency": "Das 95. Perzentil der echten Ereignislatenzen. p99: {p99} ms.",
    "ko.slaAciklama.support":
      "Eine repräsentative Erstantwortzeit, abgeleitet aus dem Lastdruck durch das beobachtete Ereignisvolumen.",

    "ko.slaDurum.karsilaniyor": "Erfüllt",
    "ko.slaDurum.risk": "Risiko",
    "ko.slaDurum.ihlal": "Verletzung",

    "ko.birim.sa": "Std.",

    "ko.plan.baslik": "Planvergleich",
    "ko.plan.mevcut": "Aktuell",
    "ko.plan.onerilen": "Empfohlen",
    "ko.plan.ucretsiz": "Kostenlos",
    "ko.plan.ay": "/Mon.",
    "ko.plan.aylikKota": "Monatliches Kontingent",
    "ko.plan.slaUptime": "SLA-Verfügbarkeit",
    "ko.plan.gecikmeP95": "Latenz p95",
    "ko.plan.destekYaniti": "Support-Antwort",
    "ko.plan.saEki": "{n} Std.",
    "ko.plan.projeksiyonUygun": "Passt zur Projektion",
    "ko.plan.evet": "Ja",
    "ko.plan.asar": "Überschreitet",
    "ko.plan.yukseltmeBaslik": "Upgrade auf den {plan}-Plan empfohlen",
    "ko.plan.yukseltmeBtn": "Plan upgraden",

    "ko.planAd.baslangic": "Starter",
    "ko.planAd.buyume": "Wachstum",
    "ko.planAd.kurumsal": "Enterprise",

    "ko.gerekce.yok":
      "Dein aktueller Plan deckt die projizierte Monatsend-Nutzung bequem ab. Kein Upgrade nötig.",
    "ko.gerekce.enUstAsiyor":
      "Die Projektion überschreitet selbst das Kontingent des höchsten Plans; eine Enterprise-Überschreitungsvereinbarung ist erforderlich.",
    "ko.gerekce.enUstYaklasiyor":
      "Du näherst dich dem Ende deines Kontingents, aber es gibt keine höhere Stufe.",
    "ko.gerekce.asiyor":
      "Deine Monatsend-Projektion ({proj}) überschreitet das aktuelle Kontingent. Der {plan}-Plan passt zu dieser Nutzung und lässt dich Überschreitungsgebühren vermeiden.",
    "ko.gerekce.yaklasiyor":
      "Du hast {pct} % deines Kontingents verbraucht. Der Wechsel zum {plan}-Plan bietet Puffer für Wachstum.",

    "ko.grafik.bosVeri": "Für diesen Zeitraum noch keine Nutzungsdaten.",
    "ko.grafik.aria": "Tägliche Nutzung und Projektion",
    "ko.grafik.projeksiyon": "Projektion",
    "ko.grafik.gercekGunluk": "Tatsächlich täglich",
    "ko.grafik.runRate": "Run-Rate ({n}/Tag)",
  },

  fr: {
    "ko.baslik": "Mesure d'utilisation & suivi SLA",

    "ko.intro.baslik":
      "Mesurez votre utilisation réelle par rapport au quota de votre forfait, prévisualisez votre facture de fin de mois, suivez vos engagements SLA.",
    "ko.intro.planEki": "forfait",
    "ko.intro.varsayilan": " (par défaut — aucun forfait défini sur le compte)",
    "ko.intro.metin":
      "{gecen}/{toplam} jours · {olay} événements observés. L'utilisation est mesurée à partir d'événements réels ; la facture et la projection sont des estimations ; les valeurs SLA réelles sont dérivées de l'observation.",

    "ko.ozet.kullanilan": "Vérifications utilisées ({pct} % du quota)",
    "ko.ozet.projeksiyon": "Projection de fin de mois",
    "ko.ozet.faturaTahmini": "Facture estimée (fin de mois)",
    "ko.ozet.slaUyum": "Conformité SLA",
    "ko.ozet.slaUyumKredi": "Conformité SLA · {kredi} % de crédit",

    "ko.kota.baslik": "Jauge d'utilisation du quota",
    "ko.kota.suAnaKadar": "Utilisé jusqu'à présent",
    "ko.kota.gercek": "Utilisation réelle ({pct} %)",
    "ko.kota.projeksiyon": "Projection de fin de mois ({pct} %)",
    "ko.kota.sinir": "Limite de quota",
    "ko.kota.gunlukOrt": "Moy. journalière (run-rate)",
    "ko.kota.gunBirim": "{n}/jour",
    "ko.kota.kalanGun": "Jours restants",
    "ko.kota.gunEki": "{n} jours",
    "ko.kota.apiCagri": "Appels API dérivés",
    "ko.kota.asimBaslik": "Dépassement de quota prévu",
    "ko.kota.asimMetin":
      "Au rythme journalier actuel, vous atteindrez <strong>{proj}</strong> vérifications d'ici la fin du mois — dépassant votre quota de <strong>{asim}</strong> ({pct} %). ",
    "ko.kota.asimUcretli": "Cela représente des frais de dépassement de {tutar}.",
    "ko.kota.asimBlok": "Ce forfait bloque le dépassement — une fois le quota atteint, les vérifications sont refusées.",
    "ko.kota.guvenBaslik": "Quota sécurisé",
    "ko.kota.guvenMetin":
      "Votre projection de fin de mois (<strong>{proj}</strong>) est inférieure au quota ; aucun risque de dépassement.",

    "ko.fatura.gunlukBaslik": "Utilisation journalière & projection",
    "ko.fatura.gunlukMetin":
      "Le volume réel de vérifications journalières de ce mois et la ligne de projection de fin de mois prolongée par le run-rate.",
    "ko.fatura.baslik": "Projection de facture",
    "ko.fatura.taban": "Frais de base · {plan}",
    "ko.fatura.asimUcreti": "Frais de dépassement",
    "ko.fatura.asimDetay": "{miktar} × {birim}/vérification",
    "ko.fatura.toplam": "Total estimé de fin de mois",
    "ko.fatura.slaKredi": "Crédit SLA : −{tutar}",
    "ko.fatura.slaKrediMetin":
      "Crédit à déduire de la prochaine facture pour les engagements non respectés.",
    "ko.fatura.dipnot":
      "Les chiffres sont une projection basée sur le run-rate actuel ; la facture réelle est émise selon l'utilisation réelle en fin de mois.",

    "ko.sla.baslik": "État de conformité SLA",
    "ko.sla.metin":
      "Pour chaque engagement : objectif contractuel vs valeur réelle observée, état de conformité et crédit dû en cas de manquement.",
    "ko.sla.metinEk":
      " Latence p95 issue de données d'événements réelles ; la disponibilité et le support sont dérivés de l'observation.",
    "ko.sla.thMetrik": "Métrique",
    "ko.sla.thTaahhut": "Engagement",
    "ko.sla.thGerceklesen": "Réel",
    "ko.sla.thKarsilama": "Atteinte",
    "ko.sla.thDurum": "État",
    "ko.sla.thKredi": "Crédit",
    "ko.sla.hepsiKarsilaniyor": "Tous les engagements SLA sont respectés — aucun crédit dû cette période.",
    "ko.sla.ihlalOzet": "{n} métriques en manquement · total {kredi} % de crédit ({tutar}).",

    "ko.slaMetrik.uptime": "Disponibilité",
    "ko.slaMetrik.latency": "Latence de blocage (p95)",
    "ko.slaMetrik.support": "Première réponse du support",

    "ko.slaAciklama.uptime":
      "Les événements à latence extrême (plus lents que 4× la p95 engagée) comptent comme une indisponibilité réelle ; leur proportion réduit la disponibilité.",
    "ko.slaAciklama.latency": "Le 95e centile des latences d'événements réelles. p99 : {p99} ms.",
    "ko.slaAciklama.support":
      "Un temps de première réponse représentatif dérivé de la pression de charge créée par le volume d'événements observé.",

    "ko.slaDurum.karsilaniyor": "Respecté",
    "ko.slaDurum.risk": "Risque",
    "ko.slaDurum.ihlal": "Manquement",

    "ko.birim.sa": "h",

    "ko.plan.baslik": "Comparaison des forfaits",
    "ko.plan.mevcut": "Actuel",
    "ko.plan.onerilen": "Recommandé",
    "ko.plan.ucretsiz": "Gratuit",
    "ko.plan.ay": "/mois",
    "ko.plan.aylikKota": "Quota mensuel",
    "ko.plan.slaUptime": "Disponibilité SLA",
    "ko.plan.gecikmeP95": "Latence p95",
    "ko.plan.destekYaniti": "Réponse du support",
    "ko.plan.saEki": "{n} h",
    "ko.plan.projeksiyonUygun": "Compatible avec la projection",
    "ko.plan.evet": "Oui",
    "ko.plan.asar": "Dépasse",
    "ko.plan.yukseltmeBaslik": "Passage au forfait {plan} recommandé",
    "ko.plan.yukseltmeBtn": "Mettre à niveau",

    "ko.planAd.baslangic": "Débutant",
    "ko.planAd.buyume": "Croissance",
    "ko.planAd.kurumsal": "Entreprise",

    "ko.gerekce.yok":
      "Votre forfait actuel couvre confortablement l'utilisation projetée de fin de mois. Aucune mise à niveau nécessaire.",
    "ko.gerekce.enUstAsiyor":
      "La projection dépasse même le quota du forfait le plus élevé ; un accord de dépassement entreprise est requis.",
    "ko.gerekce.enUstYaklasiyor":
      "Vous approchez de la fin de votre quota, mais il n'existe pas de palier supérieur.",
    "ko.gerekce.asiyor":
      "Votre projection de fin de mois ({proj}) dépasse le quota actuel. Le forfait {plan} correspond à cette utilisation et vous permet d'éviter les frais de dépassement.",
    "ko.gerekce.yaklasiyor":
      "Vous avez utilisé {pct} % de votre quota. Passer au forfait {plan} offre une marge pour la croissance.",

    "ko.grafik.bosVeri": "Aucune donnée d'utilisation pour cette période pour l'instant.",
    "ko.grafik.aria": "Utilisation journalière et projection",
    "ko.grafik.projeksiyon": "Projection",
    "ko.grafik.gercekGunluk": "Réel journalier",
    "ko.grafik.runRate": "Run-rate ({n}/jour)",
  },

  es: {
    "ko.baslik": "Medición de uso y seguimiento de SLA",

    "ko.intro.baslik":
      "Mide tu uso real frente a la cuota de tu plan, previsualiza tu factura de fin de mes y sigue tus compromisos de SLA.",
    "ko.intro.planEki": "plan",
    "ko.intro.varsayilan": " (predeterminado — no hay plan definido en la cuenta)",
    "ko.intro.metin":
      "{gecen}/{toplam} días · {olay} eventos observados. El uso se mide a partir de eventos reales; la factura y la proyección son estimaciones; los valores reales de SLA se derivan de la observación.",

    "ko.ozet.kullanilan": "Verificaciones usadas ({pct} % de la cuota)",
    "ko.ozet.projeksiyon": "Proyección de fin de mes",
    "ko.ozet.faturaTahmini": "Factura estimada (fin de mes)",
    "ko.ozet.slaUyum": "Cumplimiento de SLA",
    "ko.ozet.slaUyumKredi": "Cumplimiento de SLA · {kredi} % de crédito",

    "ko.kota.baslik": "Indicador de uso de cuota",
    "ko.kota.suAnaKadar": "Usado hasta ahora",
    "ko.kota.gercek": "Uso real ({pct} %)",
    "ko.kota.projeksiyon": "Proyección de fin de mes ({pct} %)",
    "ko.kota.sinir": "Límite de cuota",
    "ko.kota.gunlukOrt": "Prom. diario (run-rate)",
    "ko.kota.gunBirim": "{n}/día",
    "ko.kota.kalanGun": "Días restantes",
    "ko.kota.gunEki": "{n} días",
    "ko.kota.apiCagri": "Llamadas a la API derivadas",
    "ko.kota.asimBaslik": "Se prevé exceso de cuota",
    "ko.kota.asimMetin":
      "Al ritmo diario actual alcanzarás <strong>{proj}</strong> verificaciones a fin de mes, superando tu cuota en <strong>{asim}</strong> ({pct} %). ",
    "ko.kota.asimUcretli": "Eso supone un cargo por exceso de {tutar}.",
    "ko.kota.asimBlok": "Este plan bloquea el exceso: cuando la cuota se llena, las verificaciones se rechazan.",
    "ko.kota.guvenBaslik": "Cuota segura",
    "ko.kota.guvenMetin":
      "Tu proyección de fin de mes (<strong>{proj}</strong>) está por debajo de la cuota; sin riesgo de exceso.",

    "ko.fatura.gunlukBaslik": "Uso diario y proyección",
    "ko.fatura.gunlukMetin":
      "El volumen real de verificaciones diarias de este mes y la línea de proyección de fin de mes extendida por el run-rate.",
    "ko.fatura.baslik": "Proyección de factura",
    "ko.fatura.taban": "Tarifa base · {plan}",
    "ko.fatura.asimUcreti": "Cargo por exceso",
    "ko.fatura.asimDetay": "{miktar} × {birim}/verificación",
    "ko.fatura.toplam": "Total estimado de fin de mes",
    "ko.fatura.slaKredi": "Crédito de SLA: −{tutar}",
    "ko.fatura.slaKrediMetin":
      "Crédito a deducir de la próxima factura por los compromisos incumplidos.",
    "ko.fatura.dipnot":
      "Las cifras son una proyección basada en el run-rate actual; la factura real se emite según el uso real a fin de mes.",

    "ko.sla.baslik": "Estado de cumplimiento de SLA",
    "ko.sla.metin":
      "Para cada compromiso: objetivo contractual frente al valor real observado, estado de cumplimiento y el crédito adeudado en caso de incumplimiento.",
    "ko.sla.metinEk":
      " Latencia p95 a partir de datos de eventos reales; el tiempo de actividad y el soporte se derivan de la observación.",
    "ko.sla.thMetrik": "Métrica",
    "ko.sla.thTaahhut": "Compromiso",
    "ko.sla.thGerceklesen": "Real",
    "ko.sla.thKarsilama": "Cumplimiento",
    "ko.sla.thDurum": "Estado",
    "ko.sla.thKredi": "Crédito",
    "ko.sla.hepsiKarsilaniyor": "Todos los compromisos de SLA se cumplen — no se adeuda crédito este período.",
    "ko.sla.ihlalOzet": "{n} métricas incumplidas · total {kredi} % de crédito ({tutar}).",

    "ko.slaMetrik.uptime": "Tiempo de actividad",
    "ko.slaMetrik.latency": "Latencia de bloqueo (p95)",
    "ko.slaMetrik.support": "Primera respuesta de soporte",

    "ko.slaAciklama.uptime":
      "Los eventos con latencia extrema (más lentos que 4× la p95 comprometida) cuentan como inactividad real; su proporción reduce el tiempo de actividad.",
    "ko.slaAciklama.latency": "El percentil 95 de las latencias de eventos reales. p99: {p99} ms.",
    "ko.slaAciklama.support":
      "Un tiempo de primera respuesta representativo derivado de la presión de carga que genera el volumen de eventos observado.",

    "ko.slaDurum.karsilaniyor": "Cumplido",
    "ko.slaDurum.risk": "Riesgo",
    "ko.slaDurum.ihlal": "Incumplimiento",

    "ko.birim.sa": "h",

    "ko.plan.baslik": "Comparación de planes",
    "ko.plan.mevcut": "Actual",
    "ko.plan.onerilen": "Recomendado",
    "ko.plan.ucretsiz": "Gratis",
    "ko.plan.ay": "/mes",
    "ko.plan.aylikKota": "Cuota mensual",
    "ko.plan.slaUptime": "Tiempo de actividad SLA",
    "ko.plan.gecikmeP95": "Latencia p95",
    "ko.plan.destekYaniti": "Respuesta de soporte",
    "ko.plan.saEki": "{n} h",
    "ko.plan.projeksiyonUygun": "Se ajusta a la proyección",
    "ko.plan.evet": "Sí",
    "ko.plan.asar": "Supera",
    "ko.plan.yukseltmeBaslik": "Se recomienda actualizar al plan {plan}",
    "ko.plan.yukseltmeBtn": "Actualizar plan",

    "ko.planAd.baslangic": "Inicial",
    "ko.planAd.buyume": "Crecimiento",
    "ko.planAd.kurumsal": "Empresa",

    "ko.gerekce.yok":
      "Tu plan actual cubre cómodamente el uso proyectado de fin de mes. No es necesario actualizar.",
    "ko.gerekce.enUstAsiyor":
      "La proyección supera incluso la cuota del plan más alto; se requiere un acuerdo de exceso empresarial.",
    "ko.gerekce.enUstYaklasiyor":
      "Te estás acercando al final de tu cuota, pero no hay un nivel superior.",
    "ko.gerekce.asiyor":
      "Tu proyección de fin de mes ({proj}) supera la cuota actual. El plan {plan} se ajusta a este uso y te permite evitar cargos por exceso.",
    "ko.gerekce.yaklasiyor":
      "Has usado el {pct} % de tu cuota. Pasar al plan {plan} ofrece margen para el crecimiento.",

    "ko.grafik.bosVeri": "Aún no hay datos de uso para este período.",
    "ko.grafik.aria": "Uso diario y proyección",
    "ko.grafik.projeksiyon": "Proyección",
    "ko.grafik.gercekGunluk": "Real diario",
    "ko.grafik.runRate": "Run-rate ({n}/día)",
  },
};

/** Sözlükten çeviri getir; anahtar yoksa TR'ye, o da yoksa anahtarın kendisine düş. */
export function koCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
