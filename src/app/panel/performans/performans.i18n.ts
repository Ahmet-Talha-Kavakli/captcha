/**
 * Performans Bütçesi sayfası — yerel i18n sözlüğü.
 *
 * Panel geneli `ceviri()` yerine yerel `pfCeviri()` kullanılır.
 *
 * ENUM / VERİ GÜVENLİĞİ:
 *   - butce.ts (klasör-yerel) düzenlenebilir ama tercihen dokunulmaz: tüm
 *     etiketler istemci tarafında stabil `anahtar` (scriptBoyut, gzipBoyut…) ve
 *     Durum enum'u (iyi/orta/kötü) ile yeniden türetilir. Sayısal değerler,
 *     bütçe eşikleri, bayt sayıları saf VERİ olarak lib'den geçer.
 *   - `metrik.*` grupları her metriğin ad/aciklama/oneri metnini `anahtar`la
 *     eşler; lib'deki TR metinleri gösterimde bunlarla değiştirilir.
 *   - CWV metrik adları (LCP/CLS/INP) çevrilmez; yalnızca parantez içi açıklama
 *     çevrilir.
 *   - `birim.*` ölçü birimlerini (KB/ms/puan) çevirir.
 *   - Sayı biçimi Intl BCP-47 map (tr-TR/en-US/de-DE/fr-FR/es-ES) ile yerelleşir.
 */
import type { Dil } from "@/lib/i18n/panel";

/** toLocaleString için BCP-47 yerel kodu. */
export const YEREL: Record<Dil, string> = {
  tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES",
};

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // durum enum (Durum: iyi/orta/kötü)
    "durum.iyi": "İyi",
    "durum.orta": "Orta",
    "durum.kötü": "Kötü",

    // kaynak rozetleri
    "kaynak.ölçülen": "ölçülen",
    "kaynak.modellenen": "modellenen",

    // birimler
    "birim.KB": "KB",
    "birim.ms": "ms",
    "birim.puan": "puan",

    // skor halkası
    "halka.altYazi": "/ 100 Performans",
    "halka.lighthouse": "Lighthouse-benzeri ağırlıklı skor",

    // bütçe çubuğu
    "cubuk.butce": "bütçe",
    "cubuk.payVar": "{n} {birim} pay var",
    "cubuk.asim": "{n} {birim} aşım",
    "cubuk.oneri": "Öneri:",

    // CWV kartı
    "vital.katki": "Widget katkısı (modellenen). İyi < {iyi} · Zayıf > {kotu} {birim}",

    // dürüstlük şeridi
    "durustluk.baslik": "Ölçüm dürüstlüğü",
    "durustluk.gercekEtiket": "Gerçek ölçüm:",
    "durustluk.gercekMetin": "yalnızca script bayt boyutu (sunucuda",
    "durustluk.ile": "ile",
    "durustluk.bayt": "bayt).",
    "durustluk.modelEtiket": "Modellenen tahmin:",
    "durustluk.modelMetin": "gzip, parse, bloklama, LCP/CLS/INP — bunlar bu ekrandan müşterinin gerçek sahasında ölçülemez; gerçek saha değeri için RUM (Gerçek Kullanıcı İzleme) gerekir.",

    // özet statlar
    "stat.hamScript": "Ham script boyutu (ölçülen)",
    "stat.aktarim": "Aktarım (gzip, tahmini)",
    "stat.bloklama": "Ana-iş-parçacığı bloklama (tahmini)",
    "stat.hafif": "Sektör tipik reCAPTCHA'dan daha hafif",

    // CWV paneli
    "cwv.baslik": "Core Web Vitals — widget katkısı (modellenen)",
    "cwv.aciklamaA": "Veylify async/defer yüklenir, Shadow DOM'da izole render eder ve kutu boyutunu baştan ayırır. Bu nedenle üç çekirdek vital'e de",
    "cwv.sifira": "sıfıra yakın",
    "cwv.aciklamaB": "etki eder. Değerler modellenen tahmindir; resmi eşikler",
    "cwv.aciklamaC": "kaynaklıdır.",

    // bütçe paneli
    "butce.baslik": "Performans bütçesi — metrik başına geç/kal",

    // zaman çizelgesi paneli
    "zaman.baslik": "Yükleme zaman çizelgesi — neden bloklamaz",
    "zaman.asama1.ad": "HTML ayrıştırılır",
    "zaman.asama1.detay": "Sayfa akışı hiç durmaz",
    "zaman.asama2.ad": "async/defer indirme",
    "zaman.asama2.detay": "Arka planda, paralel",
    "zaman.asama3.ad": "Ertelenmiş ayrıştırma",
    "zaman.asama3.detay": "Kritik yol dışında",
    "zaman.asama4.ad": "Boşta başlatma (init)",
    "zaman.asama4.detay": "DOMContentLoaded sonrası",
    "zaman.sonucA": "Kritik render yolunda",
    "zaman.sonucVurgu": "tek bir engel bile yok",
    "zaman.sonucB": "— script render-blocking değildir, ilk boyamayı geciktirmez.",

    // karşılaştırma paneli
    "kars.baslik": "Karşılaştırma — Veylify vs sektör tipik reCAPTCHA",
    "kars.specter": "Veylify (gzip tahmini)",
    "kars.recaptcha": "reCAPTCHA (sektör tipik referans)",
    "kars.notA": "reCAPTCHA figürü",
    "kars.notVurgu": "sektör tipik değeridir, referans amaçlıdır",
    "kars.notB": "— kesin bir ölçüm değil, yaygın alıntılanan yaklaşık bir endüstri referansıdır (api.js + gstatic bağımlılıkları). Veylify değeri gerçek ölçülen bayttan türeyen gzip tahminidir.",

    // öneriler paneli
    "oneri.baslik": "Optimizasyon önerileri",
    "oneri.async.ad": "async / defer özniteliği",
    "oneri.async.detay": "Script'i render-blocking olmaktan çıkarır; kritik yolu boş tutar.",
    "oneri.preconnect.ad": "preconnect",
    "oneri.preconnect.detay": "<link rel=\"preconnect\"> ile challenge origin'ine bağlantıyı önceden ısıt.",
    "oneri.selfhost.ad": "Kendi sunucunda barındır",
    "oneri.selfhost.detay": "İsteğe bağlı self-host ile üçüncü-taraf DNS + TLS turunu ele.",
    "oneri.treeshake.ad": "Tree-shaking / dil bölme",
    "oneri.treeshake.detay": "Kullanılmayan i18n dillerini isteğe bağlı yükleyip yükü küçült.",
    "oneri.ctaButon": "Entegrasyon sağlığına git",
    "oneri.ctaMetin": "Gerçek saha CWV'si için sitene RUM ekle; bu panel modellenen tavan/taban gösterir.",

    // --- metrik etiketleri (anahtar bazlı) ---
    "metrik.scriptBoyut.ad": "Script boyutu (ham)",
    "metrik.scriptBoyut.aciklama": "İndirilen sıkıştırılmamış specter.js boyutu — fs ile ölçüldü.",
    "metrik.scriptBoyut.oneri": "Ölü kod ayıklama (tree-shaking) ve gereksiz i18n dillerini isteğe bağlı yükleme.",
    "metrik.gzipBoyut.ad": "Aktarım boyutu (gzip, tahmini)",
    "metrik.gzipBoyut.aciklama": "Kabloda giden tahmini boyut (ham × {kat}). Brotli daha da küçültür.",
    "metrik.gzipBoyut.oneri": "Sunucuda Brotli/gzip'i etkinleştir; CDN kenarında sıkıştır.",
    "metrik.parseMs.ad": "Parse / derleme süresi",
    "metrik.parseMs.aciklama": "Orta-seviye mobilde tahmini ayrıştırma (~{pk} ms/KB).",
    "metrik.parseMs.oneri": "Boyutu küçült; script'i defer ile boşta ayrıştır.",
    "metrik.blokMs.ad": "Ana-iş-parçacığı bloklama",
    "metrik.blokMs.aciklama": "async/defer sayesinde yalnızca ilk çalıştırma penceresi bloklar.",
    "metrik.blokMs.oneri": "Ağır işi requestIdleCallback'e taşı; init'i tembel başlat.",
    "metrik.lcpEtki.ad": "LCP etkisi",
    "metrik.lcpEtki.aciklama": "Widget render-blocking değil ve LCP elemanı değil → katkı ~0.",
    "metrik.lcpEtki.oneri": "Script'i <head>'de async/defer tut; preconnect ile bağlantıyı ısıt.",
    "metrik.cls.ad": "CLS katkısı",
    "metrik.cls.aciklama": "Widget kartı baştan sabit boyutlu → yerleşim kayması yok.",
    "metrik.cls.oneri": "Widget kabına min-height ver; yer tutucu boyutu koru.",
    "metrik.inpMs.ad": "INP (etkileşim gecikmesi)",
    "metrik.inpMs.aciklama": "Doğrula etkileşimi hafif; ağır doğrulama sunucuda yapılır.",
    "metrik.inpMs.oneri": "Ana iş parçacığında ağır senkron iş tutma; olay işleyicileri kısa tut.",

    // --- CWV kart adları (LCP/CLS/INP metrik adı çevrilmez, açıklama çevrilir) ---
    "vitalAd.lcp": "LCP (En Büyük İçerikli Boyama)",
    "vitalAd.cls": "CLS (Kümülatif Düzen Kayması)",
    "vitalAd.inp": "INP (Sonraki Boyamaya Etkileşim)",
  },

  en: {
    "durum.iyi": "Good",
    "durum.orta": "Fair",
    "durum.kötü": "Poor",

    "kaynak.ölçülen": "measured",
    "kaynak.modellenen": "modeled",

    "birim.KB": "KB",
    "birim.ms": "ms",
    "birim.puan": "score",

    "halka.altYazi": "/ 100 Performance",
    "halka.lighthouse": "Lighthouse-like weighted score",

    "cubuk.butce": "budget",
    "cubuk.payVar": "{n} {birim} headroom",
    "cubuk.asim": "{n} {birim} over",
    "cubuk.oneri": "Recommendation:",

    "vital.katki": "Widget contribution (modeled). Good < {iyi} · Poor > {kotu} {birim}",

    "durustluk.baslik": "Measurement honesty",
    "durustluk.gercekEtiket": "Real measurement:",
    "durustluk.gercekMetin": "the script byte size only (on the server via",
    "durustluk.ile": "→",
    "durustluk.bayt": "bytes).",
    "durustluk.modelEtiket": "Modeled estimate:",
    "durustluk.modelMetin": "gzip, parse, blocking, LCP/CLS/INP — these cannot be measured from this screen on the customer's real field; real field values require RUM (Real User Monitoring).",

    "stat.hamScript": "Raw script size (measured)",
    "stat.aktarim": "Transfer (gzip, estimated)",
    "stat.bloklama": "Main-thread blocking (estimated)",
    "stat.hafif": "Lighter than a typical industry reCAPTCHA",

    "cwv.baslik": "Core Web Vitals — widget contribution (modeled)",
    "cwv.aciklamaA": "Veylify loads async/defer, renders isolated in the Shadow DOM and reserves its box size upfront. That's why it has a",
    "cwv.sifira": "near-zero",
    "cwv.aciklamaB": "impact on all three core vitals. Values are modeled estimates; official thresholds come from",
    "cwv.aciklamaC": ".",

    "butce.baslik": "Performance budget — pass/fail per metric",

    "zaman.baslik": "Load timeline — why it doesn't block",
    "zaman.asama1.ad": "HTML is parsed",
    "zaman.asama1.detay": "The page flow never stops",
    "zaman.asama2.ad": "async/defer download",
    "zaman.asama2.detay": "In the background, in parallel",
    "zaman.asama3.ad": "Deferred parsing",
    "zaman.asama3.detay": "Off the critical path",
    "zaman.asama4.ad": "Idle init",
    "zaman.asama4.detay": "After DOMContentLoaded",
    "zaman.sonucA": "There is",
    "zaman.sonucVurgu": "not a single blocker",
    "zaman.sonucB": "on the critical render path — the script is not render-blocking and does not delay first paint.",

    "kars.baslik": "Comparison — Veylify vs typical industry reCAPTCHA",
    "kars.specter": "Veylify (gzip estimate)",
    "kars.recaptcha": "reCAPTCHA (typical industry reference)",
    "kars.notA": "The reCAPTCHA figure is a",
    "kars.notVurgu": "typical industry value, for reference",
    "kars.notB": "— not an exact measurement, but a commonly cited approximate industry reference (api.js + gstatic dependencies). The Veylify value is a gzip estimate derived from the real measured bytes.",

    "oneri.baslik": "Optimization recommendations",
    "oneri.async.ad": "async / defer attribute",
    "oneri.async.detay": "Takes the script out of render-blocking; keeps the critical path clear.",
    "oneri.preconnect.ad": "preconnect",
    "oneri.preconnect.detay": "Warm up the connection to the challenge origin with <link rel=\"preconnect\">.",
    "oneri.selfhost.ad": "Host on your own server",
    "oneri.selfhost.detay": "Optional self-hosting removes the third-party DNS + TLS round trip.",
    "oneri.treeshake.ad": "Tree-shaking / language splitting",
    "oneri.treeshake.detay": "Lazy-load unused i18n languages to shrink the payload.",
    "oneri.ctaButon": "Go to integration health",
    "oneri.ctaMetin": "Add RUM to your site for real field CWV; this panel shows the modeled ceiling/floor.",

    "metrik.scriptBoyut.ad": "Script size (raw)",
    "metrik.scriptBoyut.aciklama": "Downloaded uncompressed specter.js size — measured with fs.",
    "metrik.scriptBoyut.oneri": "Dead-code elimination (tree-shaking) and lazy-loading unnecessary i18n languages.",
    "metrik.gzipBoyut.ad": "Transfer size (gzip, estimated)",
    "metrik.gzipBoyut.aciklama": "Estimated size over the wire (raw × {kat}). Brotli shrinks it further.",
    "metrik.gzipBoyut.oneri": "Enable Brotli/gzip on the server; compress at the CDN edge.",
    "metrik.parseMs.ad": "Parse / compile time",
    "metrik.parseMs.aciklama": "Estimated parsing on a mid-range mobile (~{pk} ms/KB).",
    "metrik.parseMs.oneri": "Reduce size; parse the script at idle with defer.",
    "metrik.blokMs.ad": "Main-thread blocking",
    "metrik.blokMs.aciklama": "Thanks to async/defer, only the first execution window blocks.",
    "metrik.blokMs.oneri": "Move heavy work to requestIdleCallback; start init lazily.",
    "metrik.lcpEtki.ad": "LCP impact",
    "metrik.lcpEtki.aciklama": "The widget is not render-blocking and not an LCP element → contribution ~0.",
    "metrik.lcpEtki.oneri": "Keep the script async/defer in <head>; warm the connection with preconnect.",
    "metrik.cls.ad": "CLS contribution",
    "metrik.cls.aciklama": "The widget card is fixed-size from the start → no layout shift.",
    "metrik.cls.oneri": "Give the widget container a min-height; preserve the placeholder size.",
    "metrik.inpMs.ad": "INP (interaction delay)",
    "metrik.inpMs.aciklama": "The verify interaction is light; heavy verification runs on the server.",
    "metrik.inpMs.oneri": "Avoid heavy synchronous work on the main thread; keep event handlers short.",

    "vitalAd.lcp": "LCP (Largest Contentful Paint)",
    "vitalAd.cls": "CLS (Cumulative Layout Shift)",
    "vitalAd.inp": "INP (Interaction to Next Paint)",
  },

  de: {
    "durum.iyi": "Gut",
    "durum.orta": "Mittel",
    "durum.kötü": "Schlecht",

    "kaynak.ölçülen": "gemessen",
    "kaynak.modellenen": "modelliert",

    "birim.KB": "KB",
    "birim.ms": "ms",
    "birim.puan": "Punkte",

    "halka.altYazi": "/ 100 Leistung",
    "halka.lighthouse": "Lighthouse-ähnlicher gewichteter Score",

    "cubuk.butce": "Budget",
    "cubuk.payVar": "{n} {birim} Spielraum",
    "cubuk.asim": "{n} {birim} über Budget",
    "cubuk.oneri": "Empfehlung:",

    "vital.katki": "Widget-Beitrag (modelliert). Gut < {iyi} · Schlecht > {kotu} {birim}",

    "durustluk.baslik": "Messehrlichkeit",
    "durustluk.gercekEtiket": "Echte Messung:",
    "durustluk.gercekMetin": "nur die Script-Byte-Größe (auf dem Server via",
    "durustluk.ile": "→",
    "durustluk.bayt": "Byte).",
    "durustluk.modelEtiket": "Modellierte Schätzung:",
    "durustluk.modelMetin": "gzip, Parsing, Blockierung, LCP/CLS/INP — diese können von diesem Bildschirm aus nicht im echten Feld des Kunden gemessen werden; echte Feldwerte erfordern RUM (Real User Monitoring).",

    "stat.hamScript": "Rohe Script-Größe (gemessen)",
    "stat.aktarim": "Übertragung (gzip, geschätzt)",
    "stat.bloklama": "Haupt-Thread-Blockierung (geschätzt)",
    "stat.hafif": "Leichter als ein branchenübliches reCAPTCHA",

    "cwv.baslik": "Core Web Vitals — Widget-Beitrag (modelliert)",
    "cwv.aciklamaA": "Veylify lädt async/defer, rendert isoliert im Shadow DOM und reserviert seine Boxgröße vorab. Deshalb hat es einen",
    "cwv.sifira": "nahezu null",
    "cwv.aciklamaB": "Einfluss auf alle drei Kern-Vitals. Die Werte sind modellierte Schätzungen; offizielle Schwellenwerte stammen von",
    "cwv.aciklamaC": ".",

    "butce.baslik": "Leistungsbudget — bestanden/nicht bestanden pro Metrik",

    "zaman.baslik": "Ladezeitachse — warum sie nicht blockiert",
    "zaman.asama1.ad": "HTML wird geparst",
    "zaman.asama1.detay": "Der Seitenfluss stoppt nie",
    "zaman.asama2.ad": "async/defer-Download",
    "zaman.asama2.detay": "Im Hintergrund, parallel",
    "zaman.asama3.ad": "Verzögertes Parsing",
    "zaman.asama3.detay": "Außerhalb des kritischen Pfads",
    "zaman.asama4.ad": "Leerlauf-Init",
    "zaman.asama4.detay": "Nach DOMContentLoaded",
    "zaman.sonucA": "Auf dem kritischen Render-Pfad gibt es",
    "zaman.sonucVurgu": "keinen einzigen Blocker",
    "zaman.sonucB": "— das Script ist nicht render-blockierend und verzögert das erste Rendern nicht.",

    "kars.baslik": "Vergleich — Veylify vs. branchenübliches reCAPTCHA",
    "kars.specter": "Veylify (gzip-Schätzung)",
    "kars.recaptcha": "reCAPTCHA (branchenübliche Referenz)",
    "kars.notA": "Die reCAPTCHA-Zahl ist ein",
    "kars.notVurgu": "branchenüblicher Wert, zu Referenzzwecken",
    "kars.notB": "— keine exakte Messung, sondern eine häufig zitierte ungefähre Branchenreferenz (api.js + gstatic-Abhängigkeiten). Der Veylify-Wert ist eine gzip-Schätzung aus den echt gemessenen Bytes.",

    "oneri.baslik": "Optimierungsempfehlungen",
    "oneri.async.ad": "async / defer-Attribut",
    "oneri.async.detay": "Nimmt das Script aus dem Render-Blocking; hält den kritischen Pfad frei.",
    "oneri.preconnect.ad": "preconnect",
    "oneri.preconnect.detay": "Wärme die Verbindung zum Challenge-Origin mit <link rel=\"preconnect\"> vor.",
    "oneri.selfhost.ad": "Auf eigenem Server hosten",
    "oneri.selfhost.detay": "Optionales Self-Hosting entfernt den Drittanbieter-DNS + TLS-Roundtrip.",
    "oneri.treeshake.ad": "Tree-Shaking / Sprachaufteilung",
    "oneri.treeshake.detay": "Ungenutzte i18n-Sprachen bei Bedarf laden, um die Nutzlast zu verkleinern.",
    "oneri.ctaButon": "Zum Integrationszustand",
    "oneri.ctaMetin": "Füge RUM zu deiner Website hinzu für echte Feld-CWV; dieses Panel zeigt die modellierte Ober-/Untergrenze.",

    "metrik.scriptBoyut.ad": "Script-Größe (roh)",
    "metrik.scriptBoyut.aciklama": "Heruntergeladene unkomprimierte specter.js-Größe — mit fs gemessen.",
    "metrik.scriptBoyut.oneri": "Toter-Code-Eliminierung (Tree-Shaking) und bedarfsweises Laden unnötiger i18n-Sprachen.",
    "metrik.gzipBoyut.ad": "Übertragungsgröße (gzip, geschätzt)",
    "metrik.gzipBoyut.aciklama": "Geschätzte Größe über die Leitung (roh × {kat}). Brotli verkleinert sie weiter.",
    "metrik.gzipBoyut.oneri": "Aktiviere Brotli/gzip auf dem Server; komprimiere am CDN-Rand.",
    "metrik.parseMs.ad": "Parse- / Kompilierzeit",
    "metrik.parseMs.aciklama": "Geschätztes Parsing auf einem Mittelklasse-Mobilgerät (~{pk} ms/KB).",
    "metrik.parseMs.oneri": "Größe reduzieren; das Script mit defer im Leerlauf parsen.",
    "metrik.blokMs.ad": "Haupt-Thread-Blockierung",
    "metrik.blokMs.aciklama": "Dank async/defer blockiert nur das erste Ausführungsfenster.",
    "metrik.blokMs.oneri": "Schwere Arbeit in requestIdleCallback verlagern; init verzögert starten.",
    "metrik.lcpEtki.ad": "LCP-Einfluss",
    "metrik.lcpEtki.aciklama": "Das Widget ist nicht render-blockierend und kein LCP-Element → Beitrag ~0.",
    "metrik.lcpEtki.oneri": "Halte das Script async/defer im <head>; wärme die Verbindung mit preconnect.",
    "metrik.cls.ad": "CLS-Beitrag",
    "metrik.cls.aciklama": "Die Widget-Karte hat von Anfang an eine feste Größe → keine Layoutverschiebung.",
    "metrik.cls.oneri": "Gib dem Widget-Container eine min-height; behalte die Platzhaltergröße bei.",
    "metrik.inpMs.ad": "INP (Interaktionsverzögerung)",
    "metrik.inpMs.aciklama": "Die Verifizierungs-Interaktion ist leicht; die schwere Verifizierung läuft auf dem Server.",
    "metrik.inpMs.oneri": "Vermeide schwere synchrone Arbeit im Haupt-Thread; halte Event-Handler kurz.",

    "vitalAd.lcp": "LCP (Largest Contentful Paint)",
    "vitalAd.cls": "CLS (Cumulative Layout Shift)",
    "vitalAd.inp": "INP (Interaction to Next Paint)",
  },

  fr: {
    "durum.iyi": "Bon",
    "durum.orta": "Moyen",
    "durum.kötü": "Mauvais",

    "kaynak.ölçülen": "mesuré",
    "kaynak.modellenen": "modélisé",

    "birim.KB": "Ko",
    "birim.ms": "ms",
    "birim.puan": "score",

    "halka.altYazi": "/ 100 Performance",
    "halka.lighthouse": "Score pondéré de type Lighthouse",

    "cubuk.butce": "budget",
    "cubuk.payVar": "{n} {birim} de marge",
    "cubuk.asim": "{n} {birim} de dépassement",
    "cubuk.oneri": "Recommandation :",

    "vital.katki": "Contribution du widget (modélisée). Bon < {iyi} · Faible > {kotu} {birim}",

    "durustluk.baslik": "Honnêteté de mesure",
    "durustluk.gercekEtiket": "Mesure réelle :",
    "durustluk.gercekMetin": "uniquement la taille en octets du script (côté serveur via",
    "durustluk.ile": "→",
    "durustluk.bayt": "octets).",
    "durustluk.modelEtiket": "Estimation modélisée :",
    "durustluk.modelMetin": "gzip, parsing, blocage, LCP/CLS/INP — ces valeurs ne peuvent pas être mesurées depuis cet écran sur le terrain réel du client ; les valeurs de terrain réelles nécessitent le RUM (Suivi des utilisateurs réels).",

    "stat.hamScript": "Taille brute du script (mesurée)",
    "stat.aktarim": "Transfert (gzip, estimé)",
    "stat.bloklama": "Blocage du fil principal (estimé)",
    "stat.hafif": "Plus léger qu'un reCAPTCHA type du secteur",

    "cwv.baslik": "Core Web Vitals — contribution du widget (modélisée)",
    "cwv.aciklamaA": "Veylify se charge en async/defer, s'affiche isolé dans le Shadow DOM et réserve sa taille de boîte d'emblée. C'est pourquoi il a un impact",
    "cwv.sifira": "proche de zéro",
    "cwv.aciklamaB": "sur les trois vitals essentielles. Les valeurs sont des estimations modélisées ; les seuils officiels proviennent de",
    "cwv.aciklamaC": ".",

    "butce.baslik": "Budget de performance — réussite/échec par métrique",

    "zaman.baslik": "Chronologie de chargement — pourquoi ça ne bloque pas",
    "zaman.asama1.ad": "Le HTML est analysé",
    "zaman.asama1.detay": "Le flux de la page ne s'arrête jamais",
    "zaman.asama2.ad": "Téléchargement async/defer",
    "zaman.asama2.detay": "En arrière-plan, en parallèle",
    "zaman.asama3.ad": "Analyse différée",
    "zaman.asama3.detay": "Hors du chemin critique",
    "zaman.asama4.ad": "Init au repos",
    "zaman.asama4.detay": "Après DOMContentLoaded",
    "zaman.sonucA": "Sur le chemin de rendu critique, il n'y a",
    "zaman.sonucVurgu": "pas un seul bloqueur",
    "zaman.sonucB": "— le script n'est pas bloquant pour le rendu et ne retarde pas le premier affichage.",

    "kars.baslik": "Comparaison — Veylify vs reCAPTCHA type du secteur",
    "kars.specter": "Veylify (estimation gzip)",
    "kars.recaptcha": "reCAPTCHA (référence type du secteur)",
    "kars.notA": "Le chiffre reCAPTCHA est une",
    "kars.notVurgu": "valeur type du secteur, à titre de référence",
    "kars.notB": "— pas une mesure exacte, mais une référence sectorielle approximative fréquemment citée (dépendances api.js + gstatic). La valeur Veylify est une estimation gzip dérivée des octets réellement mesurés.",

    "oneri.baslik": "Recommandations d'optimisation",
    "oneri.async.ad": "attribut async / defer",
    "oneri.async.detay": "Retire le script du blocage de rendu ; garde le chemin critique libre.",
    "oneri.preconnect.ad": "preconnect",
    "oneri.preconnect.detay": "Préchauffe la connexion à l'origine du challenge avec <link rel=\"preconnect\">.",
    "oneri.selfhost.ad": "Héberger sur ton propre serveur",
    "oneri.selfhost.detay": "L'auto-hébergement facultatif élimine l'aller-retour DNS + TLS tiers.",
    "oneri.treeshake.ad": "Tree-shaking / découpage de langues",
    "oneri.treeshake.detay": "Charge à la demande les langues i18n inutilisées pour réduire la charge utile.",
    "oneri.ctaButon": "Aller à la santé d'intégration",
    "oneri.ctaMetin": "Ajoute le RUM à ton site pour les CWV de terrain réel ; ce panneau montre le plafond/plancher modélisé.",

    "metrik.scriptBoyut.ad": "Taille du script (brute)",
    "metrik.scriptBoyut.aciklama": "Taille de specter.js non compressé téléchargé — mesurée avec fs.",
    "metrik.scriptBoyut.oneri": "Élimination du code mort (tree-shaking) et chargement à la demande des langues i18n inutiles.",
    "metrik.gzipBoyut.ad": "Taille de transfert (gzip, estimée)",
    "metrik.gzipBoyut.aciklama": "Taille estimée sur le câble (brut × {kat}). Brotli la réduit davantage.",
    "metrik.gzipBoyut.oneri": "Active Brotli/gzip sur le serveur ; compresse en périphérie CDN.",
    "metrik.parseMs.ad": "Temps d'analyse / compilation",
    "metrik.parseMs.aciklama": "Analyse estimée sur un mobile milieu de gamme (~{pk} ms/Ko).",
    "metrik.parseMs.oneri": "Réduis la taille ; analyse le script au repos avec defer.",
    "metrik.blokMs.ad": "Blocage du fil principal",
    "metrik.blokMs.aciklama": "Grâce à async/defer, seule la première fenêtre d'exécution bloque.",
    "metrik.blokMs.oneri": "Déplace le travail lourd vers requestIdleCallback ; démarre init paresseusement.",
    "metrik.lcpEtki.ad": "Impact LCP",
    "metrik.lcpEtki.aciklama": "Le widget n'est pas bloquant pour le rendu et n'est pas un élément LCP → contribution ~0.",
    "metrik.lcpEtki.oneri": "Garde le script async/defer dans <head> ; réchauffe la connexion avec preconnect.",
    "metrik.cls.ad": "Contribution CLS",
    "metrik.cls.aciklama": "La carte du widget est de taille fixe dès le départ → aucun décalage de mise en page.",
    "metrik.cls.oneri": "Donne une min-height au conteneur du widget ; conserve la taille du placeholder.",
    "metrik.inpMs.ad": "INP (délai d'interaction)",
    "metrik.inpMs.aciklama": "L'interaction de vérification est légère ; la vérification lourde s'exécute sur le serveur.",
    "metrik.inpMs.oneri": "Évite le travail synchrone lourd sur le fil principal ; garde les gestionnaires d'événements courts.",

    "vitalAd.lcp": "LCP (Largest Contentful Paint)",
    "vitalAd.cls": "CLS (Cumulative Layout Shift)",
    "vitalAd.inp": "INP (Interaction to Next Paint)",
  },

  es: {
    "durum.iyi": "Bueno",
    "durum.orta": "Regular",
    "durum.kötü": "Deficiente",

    "kaynak.ölçülen": "medido",
    "kaynak.modellenen": "modelado",

    "birim.KB": "KB",
    "birim.ms": "ms",
    "birim.puan": "puntos",

    "halka.altYazi": "/ 100 Rendimiento",
    "halka.lighthouse": "Puntuación ponderada tipo Lighthouse",

    "cubuk.butce": "presupuesto",
    "cubuk.payVar": "{n} {birim} de margen",
    "cubuk.asim": "{n} {birim} de exceso",
    "cubuk.oneri": "Recomendación:",

    "vital.katki": "Contribución del widget (modelada). Bueno < {iyi} · Deficiente > {kotu} {birim}",

    "durustluk.baslik": "Honestidad de medición",
    "durustluk.gercekEtiket": "Medición real:",
    "durustluk.gercekMetin": "solo el tamaño en bytes del script (en el servidor mediante",
    "durustluk.ile": "→",
    "durustluk.bayt": "bytes).",
    "durustluk.modelEtiket": "Estimación modelada:",
    "durustluk.modelMetin": "gzip, análisis, bloqueo, LCP/CLS/INP — estos no pueden medirse desde esta pantalla en el campo real del cliente; los valores de campo real requieren RUM (Monitoreo de Usuarios Reales).",

    "stat.hamScript": "Tamaño bruto del script (medido)",
    "stat.aktarim": "Transferencia (gzip, estimada)",
    "stat.bloklama": "Bloqueo del hilo principal (estimado)",
    "stat.hafif": "Más ligero que un reCAPTCHA típico del sector",

    "cwv.baslik": "Core Web Vitals — contribución del widget (modelada)",
    "cwv.aciklamaA": "Veylify se carga con async/defer, se renderiza aislado en el Shadow DOM y reserva su tamaño de caja de antemano. Por eso tiene un impacto",
    "cwv.sifira": "casi nulo",
    "cwv.aciklamaB": "en los tres vitals esenciales. Los valores son estimaciones modeladas; los umbrales oficiales provienen de",
    "cwv.aciklamaC": ".",

    "butce.baslik": "Presupuesto de rendimiento — pasa/no pasa por métrica",

    "zaman.baslik": "Cronología de carga — por qué no bloquea",
    "zaman.asama1.ad": "Se analiza el HTML",
    "zaman.asama1.detay": "El flujo de la página nunca se detiene",
    "zaman.asama2.ad": "Descarga async/defer",
    "zaman.asama2.detay": "En segundo plano, en paralelo",
    "zaman.asama3.ad": "Análisis diferido",
    "zaman.asama3.detay": "Fuera de la ruta crítica",
    "zaman.asama4.ad": "Init en reposo",
    "zaman.asama4.detay": "Tras DOMContentLoaded",
    "zaman.sonucA": "En la ruta de renderizado crítica no hay",
    "zaman.sonucVurgu": "ni un solo bloqueo",
    "zaman.sonucB": "— el script no bloquea el renderizado y no retrasa el primer pintado.",

    "kars.baslik": "Comparación — Veylify vs reCAPTCHA típico del sector",
    "kars.specter": "Veylify (estimación gzip)",
    "kars.recaptcha": "reCAPTCHA (referencia típica del sector)",
    "kars.notA": "La cifra de reCAPTCHA es un",
    "kars.notVurgu": "valor típico del sector, a título de referencia",
    "kars.notB": "— no una medición exacta, sino una referencia sectorial aproximada citada con frecuencia (dependencias api.js + gstatic). El valor de Veylify es una estimación gzip derivada de los bytes realmente medidos.",

    "oneri.baslik": "Recomendaciones de optimización",
    "oneri.async.ad": "atributo async / defer",
    "oneri.async.detay": "Saca el script del bloqueo de renderizado; mantiene libre la ruta crítica.",
    "oneri.preconnect.ad": "preconnect",
    "oneri.preconnect.detay": "Precalienta la conexión al origen del challenge con <link rel=\"preconnect\">.",
    "oneri.selfhost.ad": "Aloja en tu propio servidor",
    "oneri.selfhost.detay": "El auto-alojamiento opcional elimina la ida y vuelta de DNS + TLS de terceros.",
    "oneri.treeshake.ad": "Tree-shaking / división de idiomas",
    "oneri.treeshake.detay": "Carga bajo demanda los idiomas i18n no usados para reducir la carga útil.",
    "oneri.ctaButon": "Ir a salud de integración",
    "oneri.ctaMetin": "Añade RUM a tu sitio para CWV de campo real; este panel muestra el techo/suelo modelado.",

    "metrik.scriptBoyut.ad": "Tamaño del script (bruto)",
    "metrik.scriptBoyut.aciklama": "Tamaño de specter.js sin comprimir descargado — medido con fs.",
    "metrik.scriptBoyut.oneri": "Eliminación de código muerto (tree-shaking) y carga bajo demanda de idiomas i18n innecesarios.",
    "metrik.gzipBoyut.ad": "Tamaño de transferencia (gzip, estimado)",
    "metrik.gzipBoyut.aciklama": "Tamaño estimado en el cable (bruto × {kat}). Brotli lo reduce aún más.",
    "metrik.gzipBoyut.oneri": "Activa Brotli/gzip en el servidor; comprime en el borde del CDN.",
    "metrik.parseMs.ad": "Tiempo de análisis / compilación",
    "metrik.parseMs.aciklama": "Análisis estimado en un móvil de gama media (~{pk} ms/KB).",
    "metrik.parseMs.oneri": "Reduce el tamaño; analiza el script en reposo con defer.",
    "metrik.blokMs.ad": "Bloqueo del hilo principal",
    "metrik.blokMs.aciklama": "Gracias a async/defer, solo bloquea la primera ventana de ejecución.",
    "metrik.blokMs.oneri": "Mueve el trabajo pesado a requestIdleCallback; inicia init de forma diferida.",
    "metrik.lcpEtki.ad": "Impacto en LCP",
    "metrik.lcpEtki.aciklama": "El widget no bloquea el renderizado y no es un elemento LCP → contribución ~0.",
    "metrik.lcpEtki.oneri": "Mantén el script async/defer en <head>; precalienta la conexión con preconnect.",
    "metrik.cls.ad": "Contribución a CLS",
    "metrik.cls.aciklama": "La tarjeta del widget tiene tamaño fijo desde el inicio → sin desplazamiento de diseño.",
    "metrik.cls.oneri": "Da al contenedor del widget una min-height; conserva el tamaño del marcador de posición.",
    "metrik.inpMs.ad": "INP (retraso de interacción)",
    "metrik.inpMs.aciklama": "La interacción de verificación es ligera; la verificación pesada se ejecuta en el servidor.",
    "metrik.inpMs.oneri": "Evita trabajo síncrono pesado en el hilo principal; mantén los manejadores de eventos cortos.",

    "vitalAd.lcp": "LCP (Largest Contentful Paint)",
    "vitalAd.cls": "CLS (Cumulative Layout Shift)",
    "vitalAd.inp": "INP (Interaction to Next Paint)",
  },
};

/** Performans Bütçesi sayfası için yerel çeviri yardımcısı. */
export function pfCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
