/**
 * Adaptif Zorluk A/B Optimizasyon Motoru — yerel i18n sözlüğü.
 *
 * Panel deseni: her sayfa kendi düz sözlüğünü taşır; `optimCeviri(anahtar, dil)`
 * hedef dile, bulunamazsa TR'ye, o da yoksa anahtarın kendisine düşer.
 *
 * BAŞLIK: kırıntı "Zorluk Optimizasyonu" panel.ts'teki `nav.diffoptim` ile birebir
 * eşleşir (page.tsx onu `ceviri("nav.diffoptim", dil)` ile çözer). Üst başlık farklı
 * olduğundan (Adaptif Zorluk A/B Optimizasyon Motoru) burada yerel `x.ustBaslik`.
 *
 * ENUM GÜVENLİĞİ: politika kimliği (yumusak/dengeli/adaptif/siki/agresif) bir
 * enum'dur; asla çevrilmez. optim.ts'te üretilen politika adı/açıklaması ve
 * gerekçe/öneri CÜMLELERİ lib-TR'dir; istemcide enum id → KEY-MAP ("pol.ad.*",
 * "pol.acik.*") ile çevrilir, cümleler ise optim.ts'in döndürdüğü YAPISAL
 * alanlardan (sayılar/oranlar/bayraklar) istemcide yeniden kurulur. Sayı/oran/
 * eşik/p-değeri VERİDİR; yalnızca yerel biçimlendirme (Intl) uygulanır.
 *
 * İNTERPOLASYON: {n} yer tutucuları .replace ile doldurulur.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    "x.ustBaslik": "Adaptif Zorluk A/B Optimizasyon Motoru",

    // boş durum
    "bos.baslik": "Yeterli trafik yok",
    "bos.metin":
      "Politikaları değerlendirmek için gözlemlenmiş trafik gerekiyor. Widget'ı bir siteye kurup olay topladıkça motor otomatik çalışır.",

    // giriş şeridi
    "giris.baslik":
      "Hangi zorluk politikası en çok botu durdurup en az insanı yorar?",
    "giris.metin.a": "rakip politika, gözlemlenen",
    "giris.metin.b": "gerçek istek üzerinden değerlendirildi. Objektif:",
    "giris.objektif":
      "maksimum bot-engelleme × minimum insan-sürtünmesi",
    "giris.metin.c":
      "Kazanan istatistiksel olarak seçilir ve uygulanabilir bir öneriye dönüştürülür.",

    // özet kartları
    "ozet.kazanan": "Kazanan politika",
    "ozet.guven.anlamli": "Güven (anlamlı)",
    "ozet.guven.yetersiz": "Güven (yetersiz)",
    "ozet.botYakalama": "Bot yakalama",
    "ozet.insanSurtunmesi": "İnsan sürtünmesi",

    // politika karşılaştırma
    "kars.baslik": "Politika karşılaştırma",
    "kars.kazanan": "Kazanan",
    "kars.esik": "eşik {n}",
    "kars.net": "net",
    "kars.botYakalama": "Bot yakalama",
    "kars.insanSurtunmesi": "İnsan sürtünmesi",
    "kars.donusumKaybi": "Tahmini dönüşüm kaybı",

    // kadran grafiği
    "kadran.baslik": "Güvenlik / sürtünme kadranı",
    "kadran.aciklama.a": "Y ekseni bot-yakalama (yüksek iyi), X ekseni insan-sürtünmesi (düşük iyi). En iyi bölge",
    "kadran.aciklama.solust": "sol-üst",
    "kadran.aciklama.b": "köşe: çok bot durdur, az insan yor.",
    "kadran.aria": "Güvenlik/sürtünme kadran grafiği",
    "kadran.enIyiBolge": "En iyi bölge",
    "kadran.eksen.bot": "Bot yakalama →",
    "kadran.eksen.insan": "İnsan sürtünmesi →",

    // seçili politika detayı
    "detay.baslik": "Politika: {n}",
    "detay.botEsik": "Bot eşiği",
    "detay.agresiflik": "Agresiflik",
    "detay.durdurulanBot": "Durdurulan bot",
    "detay.surtunenInsan": "Sürtünen insan",
    "detay.dokunulanIstek": "Dokunulan istek",
    "detay.netSkor": "Net skor",

    // kazanan & öneri
    "kazoneri.baslik": "Kazanan & öneri",
    "kazoneri.anlamli": "İstatistiksel anlamlı",
    "kazoneri.dahaVeri": "Daha fazla veri gerek",
    "kazoneri.runnerUp": "Runner-up:",
    "kazoneri.netFark.a": "net fark",
    "kazoneri.netFark.b": "puan",
    "kazoneri.tekPolitika": "Tek politika",

    // gerekçe (yapısal alanlardan kurulur)
    "gerekce.anlamli":
      "\"{ad}\" politikası net skorda {fark} puan önde ve bot-durdurma üstünlüğü %{guven} güvenle istatistiksel olarak anlamlı (p<0.05). Uygulanabilir.",
    "gerekce.belirsiz":
      "\"{ad}\" net skorda önde ({fark} puan) ancak fark %{guven} güvenle henüz istatistiksel olarak kesin değil — daha fazla trafik toplandığında karar netleşir.",
    "gerekce.tekPolitika": "Karşılaştırılacak ikinci politika yok.",

    // istatistiksel kanıt
    "ist.guven": "Güven",
    "ist.pDegeri": "p-değeri",
    "ist.ci": "Bot-yakalama %95 GA",
    "ist.guc": "Örneklem gücü",

    // karar-kesin-değil notu
    "not.baslik": "Karar henüz kesin değil",
    "not.metin":
      "Kazananın üstünlüğü %{guven} güvenle istatistiksel olarak doğrulanamadı (p ≥ 0.05). Daha fazla trafik topladıkça ayrım netleşecek — o zamana dek mevcut ayarı korumak güvenlidir.",

    // öneri kartı
    "oneri.baslik": "Önerilen ayar",
    "oneri.botEsik": "Bot eşiği",
    "oneri.uygula": "Bu politikayı uygula",
    "oneri.zorlukGor": "Zorluk ayarını gör",
    "oneri.guvensizNot": "Öneri güvenli değil — önce daha fazla veri topla.",

    // öneri metni (yapısal alanlardan kurulur)
    "onerimetin.anlamli":
      "Önerilen politika: \"{ad}\" (bot eşiği {esik}). Gözlemlenen trafikte %{yakalama} bot yakalar (%95 GA: %{ciAlt}–%{ciUst}) ve yalnızca %{surtunme} insan sürtünmesi yaratır. Bu politikayı zorluk ayarında uygula: en iyi güvenlik/sürtünme dengesi.",
    "onerimetin.belirsiz":
      "Şimdilik \"{ad}\" politikası öne çıkıyor (%{yakalama} bot yakalama, %{surtunme} sürtünme) ancak üstünlük %{guven} güvenle henüz kesin değil. Karar vermeden önce daha fazla trafik topla; bu arada mevcut ayarı koru.",

    // simülasyon açıklaması
    "sim.baslik": "Simülasyon nasıl çalışır?",
    "sim.p1.a": "Bu bir",
    "sim.p1.vurgu": "canlı A/B trafik bölmesi DEĞİLDİR",
    "sim.p1.b": ". Her politika, gözlemlenen",
    "sim.p1.c": "gerçek isteğin AYNI kümesi üzerinde ayrı ayrı",
    "sim.p1.replay": "yeniden oynatılarak (counterfactual replay)",
    "sim.p1.d":
      "değerlendirilir: \"bu politika yürürlükte olsaydı bu trafiği nasıl ele alırdı?\".",
    "sim.li1":
      "Her istek için, politika kendi {bot} isteğin gerçek insanlık skoruyla karşılaştırır; eşiğin altındaysa challenge/engelleme kararı verilir (agresiflik doğrudan-engelleme oranını ölçekler).",
    "sim.li1.bot": "bot eşiğini",
    "sim.li2.a": "Bot sınıfı (automation/scraper/ai_agent…) bir isteğe dokunulursa",
    "sim.li2.vurgu": "bot yakalama",
    "sim.li2.b": "sayılır.",
    "sim.li3.a": "İnsan/iyi-bot bir isteğe dokunulursa",
    "sim.li3.vurgu": "yanlış sürtünme",
    "sim.li3.b": "sayılır ve dönüşüm kaybı tahminine yansır.",
    "sim.li4.a": "Kazanan, net skora göre sıralanır; üstünlüğü",
    "sim.li4.vurgu": "iki-oran z-testi + Wilson güven aralığı",
    "sim.li4.b": "ile doğrulanır.",
    "sim.not.a":
      "Not: Replay simülasyonu geçmiş trafiğe dayanır; gerçek dünyada botlar politikaya adapte olabilir. Sonuçları canlı bir denemeyle doğrulamak için",
    "sim.not.link": "Deney Analizi",
    "sim.not.b": "ekranını kullanın.",

    // politika adları (enum key-map)
    "pol.ad.yumusak": "Yumuşak",
    "pol.ad.dengeli": "Dengeli",
    "pol.ad.adaptif": "Adaptif",
    "pol.ad.siki": "Sıkı",
    "pol.ad.agresif": "Agresif",

    // politika açıklamaları (enum key-map)
    "pol.acik.yumusak":
      "Yalnızca en bariz botlara (çok düşük skor) dokunur. İnsan sürtünmesi en düşük, ama bazı botlar sızar.",
    "pol.acik.dengeli":
      "Şüpheli trafiği makul bir eşikte challenge eder. Bot yakalama ile sürtünme arasında denge kurar.",
    "pol.acik.adaptif":
      "Eşiğini isteğin skoruna ve otomasyon sinyaline göre CANLI kaydırır: net bot'a sert, sınır vakada yumuşak.",
    "pol.acik.siki":
      "Yüksek eşikle geniş bir şüpheli bandını challenge eder. Bot yakalama yüksek, insan sürtünmesi artar.",
    "pol.acik.agresif":
      "Sıfır tolerans: en geniş bandı doğrudan engellemeye yakın davranır. En çok botu durdurur, en çok insanı yorar.",

    // görsel şerit (donut / gauge / adaptif eğri / radar)
    "gorsel.dagilimBaslik": "Zorluk seviye dağılımı",
    "gorsel.politika": "politika",
    "gorsel.dengeBaslik": "Başarı / sürtünme dengesi",
    "gorsel.denge": "denge",
    "gorsel.yakalama": "Bot yakalama",
    "gorsel.surtunme": "İnsan sürtünmesi",
    "gorsel.adaptifBaslik": "Adaptif eğri · eşiğe göre",
    "gorsel.adaptifNot": "Bot eşiği yükseldikçe yakalama artar; ancak insan sürtünmesi de tırmanır. Optimum, iki eğrinin en geniş açıldığı noktadadır.",
    "dagilim.dusuk": "Düşük zorluk",
    "dagilim.orta": "Orta zorluk",
    "dagilim.yuksek": "Yüksek zorluk",
    "radar.baslik": "Optimizasyon profili",
    "radar.botYakalama": "Bot yakalama",
    "radar.insanDostu": "İnsan-dostu",
    "radar.donusum": "Dönüşüm koruma",
    "radar.kapsama": "Kapsama",
    "radar.netSkor": "Net skor",
  },

  en: {
    "x.ustBaslik": "Adaptive Difficulty A/B Optimization Engine",

    "bos.baslik": "Not enough traffic",
    "bos.metin":
      "Evaluating policies requires observed traffic. As you install the widget on a site and collect events, the engine runs automatically.",

    "giris.baslik":
      "Which difficulty policy stops the most bots while tiring the fewest humans?",
    "giris.metin.a": "competing policies, evaluated over the observed",
    "giris.metin.b": "real requests. Objective:",
    "giris.objektif": "maximum bot blocking × minimum human friction",
    "giris.metin.c":
      "The winner is chosen statistically and turned into an actionable recommendation.",

    "ozet.kazanan": "Winning policy",
    "ozet.guven.anlamli": "Confidence (significant)",
    "ozet.guven.yetersiz": "Confidence (insufficient)",
    "ozet.botYakalama": "Bot capture",
    "ozet.insanSurtunmesi": "Human friction",

    "kars.baslik": "Policy comparison",
    "kars.kazanan": "Winner",
    "kars.esik": "threshold {n}",
    "kars.net": "net",
    "kars.botYakalama": "Bot capture",
    "kars.insanSurtunmesi": "Human friction",
    "kars.donusumKaybi": "Estimated conversion loss",

    "kadran.baslik": "Security / friction quadrant",
    "kadran.aciklama.a": "The Y axis is bot capture (higher is better), the X axis is human friction (lower is better). The best region is the",
    "kadran.aciklama.solust": "top-left",
    "kadran.aciklama.b": "corner: stop many bots, tire few humans.",
    "kadran.aria": "Security/friction quadrant chart",
    "kadran.enIyiBolge": "Best region",
    "kadran.eksen.bot": "Bot capture →",
    "kadran.eksen.insan": "Human friction →",

    "detay.baslik": "Policy: {n}",
    "detay.botEsik": "Bot threshold",
    "detay.agresiflik": "Aggressiveness",
    "detay.durdurulanBot": "Bots stopped",
    "detay.surtunenInsan": "Humans friction-hit",
    "detay.dokunulanIstek": "Requests touched",
    "detay.netSkor": "Net score",

    "kazoneri.baslik": "Winner & recommendation",
    "kazoneri.anlamli": "Statistically significant",
    "kazoneri.dahaVeri": "More data needed",
    "kazoneri.runnerUp": "Runner-up:",
    "kazoneri.netFark.a": "net gap",
    "kazoneri.netFark.b": "pts",
    "kazoneri.tekPolitika": "Single policy",

    "gerekce.anlamli":
      "The \"{ad}\" policy leads by {fark} pts in net score, and its bot-stopping edge is statistically significant at {guven}% confidence (p<0.05). Ready to apply.",
    "gerekce.belirsiz":
      "\"{ad}\" leads in net score ({fark} pts) but the gap is not yet statistically certain at {guven}% confidence — the decision will firm up as more traffic is collected.",
    "gerekce.tekPolitika": "No second policy to compare against.",

    "ist.guven": "Confidence",
    "ist.pDegeri": "p-value",
    "ist.ci": "Bot-capture 95% CI",
    "ist.guc": "Sample power",

    "not.baslik": "Decision not yet final",
    "not.metin":
      "The winner's edge could not be statistically confirmed at {guven}% confidence (p ≥ 0.05). The distinction will sharpen as you collect more traffic — until then, keeping the current setting is safe.",

    "oneri.baslik": "Recommended setting",
    "oneri.botEsik": "Bot threshold",
    "oneri.uygula": "Apply this policy",
    "oneri.zorlukGor": "View difficulty setting",
    "oneri.guvensizNot": "Recommendation isn't safe yet — collect more data first.",

    "onerimetin.anlamli":
      "Recommended policy: \"{ad}\" (bot threshold {esik}). On observed traffic it captures {yakalama}% of bots (95% CI: {ciAlt}%–{ciUst}%) and creates only {surtunme}% human friction. Apply this policy in the difficulty setting: the best security/friction balance.",
    "onerimetin.belirsiz":
      "For now the \"{ad}\" policy stands out ({yakalama}% bot capture, {surtunme}% friction) but its edge isn't yet certain at {guven}% confidence. Collect more traffic before deciding; keep the current setting in the meantime.",

    "sim.baslik": "How does the simulation work?",
    "sim.p1.a": "This is",
    "sim.p1.vurgu": "NOT a live A/B traffic split",
    "sim.p1.b": ". Each policy is evaluated by replaying",
    "sim.p1.c": "of the observed real requests separately",
    "sim.p1.replay": "(counterfactual replay)",
    "sim.p1.d":
      ": \"if this policy had been in effect, how would it have handled this traffic?\".",
    "sim.li1":
      "For each request, the policy compares its own {bot} against the request's real humanity score; if below the threshold, a challenge/block decision is made (aggressiveness scales the direct-block rate).",
    "sim.li1.bot": "bot threshold",
    "sim.li2.a": "If a request from a bot class (automation/scraper/ai_agent…) is touched, it counts as a",
    "sim.li2.vurgu": "bot capture",
    "sim.li2.b": ".",
    "sim.li3.a": "If a human/good-bot request is touched, it counts as",
    "sim.li3.vurgu": "false friction",
    "sim.li3.b": "and feeds into the conversion-loss estimate.",
    "sim.li4.a": "The winner is ranked by net score; its edge is validated with a",
    "sim.li4.vurgu": "two-proportion z-test + Wilson confidence interval",
    "sim.li4.b": ".",
    "sim.not.a":
      "Note: replay simulation relies on past traffic; in the real world bots may adapt to the policy. To validate the results with a live experiment, use the",
    "sim.not.link": "Experiment Analysis",
    "sim.not.b": "screen.",

    "pol.ad.yumusak": "Soft",
    "pol.ad.dengeli": "Balanced",
    "pol.ad.adaptif": "Adaptive",
    "pol.ad.siki": "Strict",
    "pol.ad.agresif": "Aggressive",

    "pol.acik.yumusak":
      "Touches only the most obvious bots (very low score). Human friction is lowest, but some bots slip through.",
    "pol.acik.dengeli":
      "Challenges suspicious traffic at a reasonable threshold. Balances bot capture against friction.",
    "pol.acik.adaptif":
      "Shifts its threshold LIVE based on the request's score and automation signal: harsh on clear bots, gentle on borderline cases.",
    "pol.acik.siki":
      "Challenges a wide suspicious band with a high threshold. Bot capture is high, human friction rises.",
    "pol.acik.agresif":
      "Zero tolerance: treats the widest band as near-direct blocking. Stops the most bots, tires the most humans.",

    "gorsel.dagilimBaslik": "Difficulty level distribution",
    "gorsel.politika": "policies",
    "gorsel.dengeBaslik": "Success / friction balance",
    "gorsel.denge": "balance",
    "gorsel.yakalama": "Bot capture",
    "gorsel.surtunme": "Human friction",
    "gorsel.adaptifBaslik": "Adaptive curve · by threshold",
    "gorsel.adaptifNot": "As the bot threshold rises, capture increases — but so does human friction. The optimum is where the two curves diverge the most.",
    "dagilim.dusuk": "Low difficulty",
    "dagilim.orta": "Medium difficulty",
    "dagilim.yuksek": "High difficulty",
    "radar.baslik": "Optimization profile",
    "radar.botYakalama": "Bot capture",
    "radar.insanDostu": "Human-friendly",
    "radar.donusum": "Conversion safety",
    "radar.kapsama": "Coverage",
    "radar.netSkor": "Net score",
  },

  de: {
    "x.ustBaslik": "Adaptive Schwierigkeits-A/B-Optimierungs-Engine",

    "bos.baslik": "Nicht genug Traffic",
    "bos.metin":
      "Die Bewertung von Richtlinien erfordert beobachteten Traffic. Sobald Sie das Widget auf einer Website einbinden und Ereignisse sammeln, läuft die Engine automatisch.",

    "giris.baslik":
      "Welche Schwierigkeitsrichtlinie stoppt die meisten Bots und ermüdet die wenigsten Menschen?",
    "giris.metin.a": "konkurrierende Richtlinien, ausgewertet über die beobachteten",
    "giris.metin.b": "echten Anfragen. Ziel:",
    "giris.objektif": "maximale Bot-Blockierung × minimale menschliche Reibung",
    "giris.metin.c":
      "Der Gewinner wird statistisch ausgewählt und in eine umsetzbare Empfehlung überführt.",

    "ozet.kazanan": "Gewinnende Richtlinie",
    "ozet.guven.anlamli": "Konfidenz (signifikant)",
    "ozet.guven.yetersiz": "Konfidenz (unzureichend)",
    "ozet.botYakalama": "Bot-Erfassung",
    "ozet.insanSurtunmesi": "Menschliche Reibung",

    "kars.baslik": "Richtlinienvergleich",
    "kars.kazanan": "Gewinner",
    "kars.esik": "Schwelle {n}",
    "kars.net": "netto",
    "kars.botYakalama": "Bot-Erfassung",
    "kars.insanSurtunmesi": "Menschliche Reibung",
    "kars.donusumKaybi": "Geschätzter Konversionsverlust",

    "kadran.baslik": "Sicherheits-/Reibungs-Quadrant",
    "kadran.aciklama.a": "Die Y-Achse ist Bot-Erfassung (höher ist besser), die X-Achse menschliche Reibung (niedriger ist besser). Die beste Region ist die",
    "kadran.aciklama.solust": "obere linke",
    "kadran.aciklama.b": "Ecke: viele Bots stoppen, wenige Menschen ermüden.",
    "kadran.aria": "Sicherheits-/Reibungs-Quadrantendiagramm",
    "kadran.enIyiBolge": "Beste Region",
    "kadran.eksen.bot": "Bot-Erfassung →",
    "kadran.eksen.insan": "Menschliche Reibung →",

    "detay.baslik": "Richtlinie: {n}",
    "detay.botEsik": "Bot-Schwelle",
    "detay.agresiflik": "Aggressivität",
    "detay.durdurulanBot": "Gestoppte Bots",
    "detay.surtunenInsan": "Reibung erlebende Menschen",
    "detay.dokunulanIstek": "Berührte Anfragen",
    "detay.netSkor": "Nettowert",

    "kazoneri.baslik": "Gewinner & Empfehlung",
    "kazoneri.anlamli": "Statistisch signifikant",
    "kazoneri.dahaVeri": "Mehr Daten nötig",
    "kazoneri.runnerUp": "Zweitplatzierte:",
    "kazoneri.netFark.a": "Netto-Abstand",
    "kazoneri.netFark.b": "Pkt.",
    "kazoneri.tekPolitika": "Einzelne Richtlinie",

    "gerekce.anlamli":
      "Die Richtlinie \"{ad}\" führt im Nettowert um {fark} Pkt., und ihr Vorsprung beim Bot-Stoppen ist mit {guven}% Konfidenz statistisch signifikant (p<0.05). Anwendbar.",
    "gerekce.belirsiz":
      "\"{ad}\" führt im Nettowert ({fark} Pkt.), aber der Abstand ist bei {guven}% Konfidenz noch nicht statistisch sicher — die Entscheidung festigt sich, wenn mehr Traffic gesammelt wird.",
    "gerekce.tekPolitika": "Keine zweite Richtlinie zum Vergleich.",

    "ist.guven": "Konfidenz",
    "ist.pDegeri": "p-Wert",
    "ist.ci": "Bot-Erfassung 95%-KI",
    "ist.guc": "Stichprobenstärke",

    "not.baslik": "Entscheidung noch nicht endgültig",
    "not.metin":
      "Der Vorsprung des Gewinners konnte bei {guven}% Konfidenz statistisch nicht bestätigt werden (p ≥ 0.05). Der Unterschied schärft sich mit mehr Traffic — bis dahin ist es sicher, die aktuelle Einstellung beizubehalten.",

    "oneri.baslik": "Empfohlene Einstellung",
    "oneri.botEsik": "Bot-Schwelle",
    "oneri.uygula": "Diese Richtlinie anwenden",
    "oneri.zorlukGor": "Schwierigkeitseinstellung ansehen",
    "oneri.guvensizNot": "Empfehlung ist noch nicht sicher — sammeln Sie zuerst mehr Daten.",

    "onerimetin.anlamli":
      "Empfohlene Richtlinie: \"{ad}\" (Bot-Schwelle {esik}). Im beobachteten Traffic erfasst sie {yakalama}% der Bots (95%-KI: {ciAlt}%–{ciUst}%) und erzeugt nur {surtunme}% menschliche Reibung. Wenden Sie diese Richtlinie in der Schwierigkeitseinstellung an: die beste Sicherheits-/Reibungsbalance.",
    "onerimetin.belirsiz":
      "Vorerst sticht die Richtlinie \"{ad}\" hervor ({yakalama}% Bot-Erfassung, {surtunme}% Reibung), aber ihr Vorsprung ist bei {guven}% Konfidenz noch nicht sicher. Sammeln Sie mehr Traffic, bevor Sie entscheiden; behalten Sie in der Zwischenzeit die aktuelle Einstellung bei.",

    "sim.baslik": "Wie funktioniert die Simulation?",
    "sim.p1.a": "Dies ist",
    "sim.p1.vurgu": "KEINE Live-A/B-Traffic-Aufteilung",
    "sim.p1.b": ". Jede Richtlinie wird bewertet, indem",
    "sim.p1.c": "der beobachteten echten Anfragen separat wiederholt werden",
    "sim.p1.replay": "(kontrafaktisches Replay)",
    "sim.p1.d":
      ": \"Wäre diese Richtlinie in Kraft gewesen, wie hätte sie diesen Traffic behandelt?\".",
    "sim.li1":
      "Für jede Anfrage vergleicht die Richtlinie ihre eigene {bot} mit dem echten Menschlichkeitswert der Anfrage; liegt er unter der Schwelle, wird eine Challenge-/Block-Entscheidung getroffen (Aggressivität skaliert die Direkt-Block-Rate).",
    "sim.li1.bot": "Bot-Schwelle",
    "sim.li2.a": "Wird eine Anfrage einer Bot-Klasse (automation/scraper/ai_agent…) berührt, zählt sie als",
    "sim.li2.vurgu": "Bot-Erfassung",
    "sim.li2.b": ".",
    "sim.li3.a": "Wird eine Mensch-/Good-Bot-Anfrage berührt, zählt sie als",
    "sim.li3.vurgu": "falsche Reibung",
    "sim.li3.b": "und fließt in die Konversionsverlust-Schätzung ein.",
    "sim.li4.a": "Der Gewinner wird nach Nettowert eingestuft; sein Vorsprung wird mit einem",
    "sim.li4.vurgu": "Zwei-Anteils-z-Test + Wilson-Konfidenzintervall",
    "sim.li4.b": "validiert.",
    "sim.not.a":
      "Hinweis: Die Replay-Simulation beruht auf vergangenem Traffic; in der realen Welt können sich Bots an die Richtlinie anpassen. Um die Ergebnisse mit einem Live-Experiment zu validieren, nutzen Sie den Bildschirm",
    "sim.not.link": "Experimentanalyse",
    "sim.not.b": ".",

    "pol.ad.yumusak": "Sanft",
    "pol.ad.dengeli": "Ausgewogen",
    "pol.ad.adaptif": "Adaptiv",
    "pol.ad.siki": "Streng",
    "pol.ad.agresif": "Aggressiv",

    "pol.acik.yumusak":
      "Berührt nur die offensichtlichsten Bots (sehr niedriger Wert). Menschliche Reibung ist am geringsten, aber einige Bots schlüpfen durch.",
    "pol.acik.dengeli":
      "Fordert verdächtigen Traffic bei einer angemessenen Schwelle heraus. Balanciert Bot-Erfassung gegen Reibung.",
    "pol.acik.adaptif":
      "Verschiebt ihre Schwelle LIVE anhand des Anfragewerts und des Automatisierungssignals: hart bei klaren Bots, sanft bei Grenzfällen.",
    "pol.acik.siki":
      "Fordert mit hoher Schwelle ein breites Verdachtsband heraus. Bot-Erfassung ist hoch, menschliche Reibung steigt.",
    "pol.acik.agresif":
      "Null Toleranz: behandelt das breiteste Band als nahezu direkte Blockierung. Stoppt die meisten Bots, ermüdet die meisten Menschen.",

    "gorsel.dagilimBaslik": "Verteilung der Schwierigkeitsstufen",
    "gorsel.politika": "Richtlinien",
    "gorsel.dengeBaslik": "Erfolgs-/Reibungs-Balance",
    "gorsel.denge": "Balance",
    "gorsel.yakalama": "Bot-Erfassung",
    "gorsel.surtunme": "Menschliche Reibung",
    "gorsel.adaptifBaslik": "Adaptive Kurve · nach Schwelle",
    "gorsel.adaptifNot": "Steigt die Bot-Schwelle, nimmt die Erfassung zu — aber auch die menschliche Reibung. Das Optimum liegt dort, wo die beiden Kurven am weitesten auseinandergehen.",
    "dagilim.dusuk": "Niedrige Schwierigkeit",
    "dagilim.orta": "Mittlere Schwierigkeit",
    "dagilim.yuksek": "Hohe Schwierigkeit",
    "radar.baslik": "Optimierungsprofil",
    "radar.botYakalama": "Bot-Erfassung",
    "radar.insanDostu": "Menschenfreundlich",
    "radar.donusum": "Konversionsschutz",
    "radar.kapsama": "Abdeckung",
    "radar.netSkor": "Nettowert",
  },

  fr: {
    "x.ustBaslik": "Moteur d'optimisation A/B de difficulté adaptative",

    "bos.baslik": "Trafic insuffisant",
    "bos.metin":
      "L'évaluation des politiques nécessite du trafic observé. Dès que vous installez le widget sur un site et collectez des événements, le moteur s'exécute automatiquement.",

    "giris.baslik":
      "Quelle politique de difficulté arrête le plus de bots tout en fatiguant le moins d'humains ?",
    "giris.metin.a": "politiques concurrentes, évaluées sur les",
    "giris.metin.b": "requêtes réelles observées. Objectif :",
    "giris.objektif": "blocage maximal des bots × friction humaine minimale",
    "giris.metin.c":
      "Le gagnant est choisi statistiquement et transformé en recommandation actionnable.",

    "ozet.kazanan": "Politique gagnante",
    "ozet.guven.anlamli": "Confiance (significative)",
    "ozet.guven.yetersiz": "Confiance (insuffisante)",
    "ozet.botYakalama": "Capture de bots",
    "ozet.insanSurtunmesi": "Friction humaine",

    "kars.baslik": "Comparaison des politiques",
    "kars.kazanan": "Gagnant",
    "kars.esik": "seuil {n}",
    "kars.net": "net",
    "kars.botYakalama": "Capture de bots",
    "kars.insanSurtunmesi": "Friction humaine",
    "kars.donusumKaybi": "Perte de conversion estimée",

    "kadran.baslik": "Quadrant sécurité / friction",
    "kadran.aciklama.a": "L'axe Y est la capture de bots (plus haut est mieux), l'axe X la friction humaine (plus bas est mieux). La meilleure zone est le coin",
    "kadran.aciklama.solust": "en haut à gauche",
    "kadran.aciklama.b": " : arrêter beaucoup de bots, fatiguer peu d'humains.",
    "kadran.aria": "Graphique en quadrant sécurité/friction",
    "kadran.enIyiBolge": "Meilleure zone",
    "kadran.eksen.bot": "Capture de bots →",
    "kadran.eksen.insan": "Friction humaine →",

    "detay.baslik": "Politique : {n}",
    "detay.botEsik": "Seuil de bot",
    "detay.agresiflik": "Agressivité",
    "detay.durdurulanBot": "Bots arrêtés",
    "detay.surtunenInsan": "Humains frictionnés",
    "detay.dokunulanIstek": "Requêtes touchées",
    "detay.netSkor": "Score net",

    "kazoneri.baslik": "Gagnant & recommandation",
    "kazoneri.anlamli": "Statistiquement significatif",
    "kazoneri.dahaVeri": "Plus de données nécessaires",
    "kazoneri.runnerUp": "Finaliste :",
    "kazoneri.netFark.a": "écart net",
    "kazoneri.netFark.b": "pts",
    "kazoneri.tekPolitika": "Politique unique",

    "gerekce.anlamli":
      "La politique « {ad} » mène de {fark} pts au score net, et son avance en arrêt de bots est statistiquement significative à {guven}% de confiance (p<0.05). Applicable.",
    "gerekce.belirsiz":
      "« {ad} » mène au score net ({fark} pts) mais l'écart n'est pas encore statistiquement certain à {guven}% de confiance — la décision se précisera à mesure que davantage de trafic sera collecté.",
    "gerekce.tekPolitika": "Aucune deuxième politique pour comparer.",

    "ist.guven": "Confiance",
    "ist.pDegeri": "valeur p",
    "ist.ci": "Capture de bots IC 95%",
    "ist.guc": "Puissance de l'échantillon",

    "not.baslik": "Décision pas encore définitive",
    "not.metin":
      "L'avance du gagnant n'a pas pu être confirmée statistiquement à {guven}% de confiance (p ≥ 0.05). La distinction se précisera à mesure que vous collectez plus de trafic — d'ici là, conserver le réglage actuel est sûr.",

    "oneri.baslik": "Réglage recommandé",
    "oneri.botEsik": "Seuil de bot",
    "oneri.uygula": "Appliquer cette politique",
    "oneri.zorlukGor": "Voir le réglage de difficulté",
    "oneri.guvensizNot": "La recommandation n'est pas encore sûre — collectez d'abord plus de données.",

    "onerimetin.anlamli":
      "Politique recommandée : « {ad} » (seuil de bot {esik}). Sur le trafic observé, elle capture {yakalama}% des bots (IC 95% : {ciAlt}%–{ciUst}%) et ne crée que {surtunme}% de friction humaine. Appliquez cette politique dans le réglage de difficulté : le meilleur équilibre sécurité/friction.",
    "onerimetin.belirsiz":
      "Pour l'instant, la politique « {ad} » se démarque ({yakalama}% de capture de bots, {surtunme}% de friction) mais son avance n'est pas encore certaine à {guven}% de confiance. Collectez plus de trafic avant de décider ; conservez le réglage actuel entre-temps.",

    "sim.baslik": "Comment fonctionne la simulation ?",
    "sim.p1.a": "Ce n'est",
    "sim.p1.vurgu": "PAS une répartition de trafic A/B en direct",
    "sim.p1.b": ". Chaque politique est évaluée en rejouant",
    "sim.p1.c": "des requêtes réelles observées séparément",
    "sim.p1.replay": "(replay contrefactuel)",
    "sim.p1.d":
      " : « si cette politique avait été en vigueur, comment aurait-elle traité ce trafic ? ».",
    "sim.li1":
      "Pour chaque requête, la politique compare son propre {bot} au score d'humanité réel de la requête ; s'il est sous le seuil, une décision de challenge/blocage est prise (l'agressivité module le taux de blocage direct).",
    "sim.li1.bot": "seuil de bot",
    "sim.li2.a": "Si une requête d'une classe de bot (automation/scraper/ai_agent…) est touchée, elle compte comme une",
    "sim.li2.vurgu": "capture de bot",
    "sim.li2.b": ".",
    "sim.li3.a": "Si une requête humaine/bon-bot est touchée, elle compte comme",
    "sim.li3.vurgu": "friction erronée",
    "sim.li3.b": "et alimente l'estimation de perte de conversion.",
    "sim.li4.a": "Le gagnant est classé par score net ; son avance est validée par un",
    "sim.li4.vurgu": "test z à deux proportions + intervalle de confiance de Wilson",
    "sim.li4.b": ".",
    "sim.not.a":
      "Note : la simulation par replay repose sur le trafic passé ; dans le monde réel, les bots peuvent s'adapter à la politique. Pour valider les résultats par une expérience en direct, utilisez l'écran",
    "sim.not.link": "Analyse d'expérience",
    "sim.not.b": ".",

    "pol.ad.yumusak": "Souple",
    "pol.ad.dengeli": "Équilibrée",
    "pol.ad.adaptif": "Adaptative",
    "pol.ad.siki": "Stricte",
    "pol.ad.agresif": "Agressive",

    "pol.acik.yumusak":
      "Ne touche que les bots les plus évidents (score très bas). La friction humaine est la plus faible, mais certains bots passent.",
    "pol.acik.dengeli":
      "Défie le trafic suspect à un seuil raisonnable. Équilibre la capture de bots et la friction.",
    "pol.acik.adaptif":
      "Déplace son seuil EN DIRECT selon le score de la requête et le signal d'automatisation : dur sur les bots nets, doux sur les cas limites.",
    "pol.acik.siki":
      "Défie une large bande suspecte avec un seuil élevé. La capture de bots est élevée, la friction humaine augmente.",
    "pol.acik.agresif":
      "Tolérance zéro : traite la bande la plus large comme un blocage quasi direct. Arrête le plus de bots, fatigue le plus d'humains.",

    "gorsel.dagilimBaslik": "Distribution des niveaux de difficulté",
    "gorsel.politika": "politiques",
    "gorsel.dengeBaslik": "Équilibre réussite / friction",
    "gorsel.denge": "équilibre",
    "gorsel.yakalama": "Capture de bots",
    "gorsel.surtunme": "Friction humaine",
    "gorsel.adaptifBaslik": "Courbe adaptative · par seuil",
    "gorsel.adaptifNot": "À mesure que le seuil de bot augmente, la capture croît — mais la friction humaine aussi. L'optimum se situe là où les deux courbes divergent le plus.",
    "dagilim.dusuk": "Faible difficulté",
    "dagilim.orta": "Difficulté moyenne",
    "dagilim.yuksek": "Difficulté élevée",
    "radar.baslik": "Profil d'optimisation",
    "radar.botYakalama": "Capture de bots",
    "radar.insanDostu": "Convivial pour l'humain",
    "radar.donusum": "Protection de la conversion",
    "radar.kapsama": "Couverture",
    "radar.netSkor": "Score net",
  },

  es: {
    "x.ustBaslik": "Motor de optimización A/B de dificultad adaptativa",

    "bos.baslik": "Tráfico insuficiente",
    "bos.metin":
      "Evaluar las políticas requiere tráfico observado. En cuanto instales el widget en un sitio y recojas eventos, el motor se ejecuta automáticamente.",

    "giris.baslik":
      "¿Qué política de dificultad detiene más bots cansando a menos humanos?",
    "giris.metin.a": "políticas rivales, evaluadas sobre las",
    "giris.metin.b": "solicitudes reales observadas. Objetivo:",
    "giris.objektif": "máximo bloqueo de bots × mínima fricción humana",
    "giris.metin.c":
      "El ganador se elige estadísticamente y se convierte en una recomendación accionable.",

    "ozet.kazanan": "Política ganadora",
    "ozet.guven.anlamli": "Confianza (significativa)",
    "ozet.guven.yetersiz": "Confianza (insuficiente)",
    "ozet.botYakalama": "Captura de bots",
    "ozet.insanSurtunmesi": "Fricción humana",

    "kars.baslik": "Comparación de políticas",
    "kars.kazanan": "Ganadora",
    "kars.esik": "umbral {n}",
    "kars.net": "neto",
    "kars.botYakalama": "Captura de bots",
    "kars.insanSurtunmesi": "Fricción humana",
    "kars.donusumKaybi": "Pérdida de conversión estimada",

    "kadran.baslik": "Cuadrante seguridad / fricción",
    "kadran.aciklama.a": "El eje Y es la captura de bots (más alto es mejor), el eje X la fricción humana (más bajo es mejor). La mejor región es la esquina",
    "kadran.aciklama.solust": "superior izquierda",
    "kadran.aciklama.b": ": detener muchos bots, cansar a pocos humanos.",
    "kadran.aria": "Gráfico de cuadrante seguridad/fricción",
    "kadran.enIyiBolge": "Mejor región",
    "kadran.eksen.bot": "Captura de bots →",
    "kadran.eksen.insan": "Fricción humana →",

    "detay.baslik": "Política: {n}",
    "detay.botEsik": "Umbral de bot",
    "detay.agresiflik": "Agresividad",
    "detay.durdurulanBot": "Bots detenidos",
    "detay.surtunenInsan": "Humanos con fricción",
    "detay.dokunulanIstek": "Solicitudes tocadas",
    "detay.netSkor": "Puntuación neta",

    "kazoneri.baslik": "Ganadora y recomendación",
    "kazoneri.anlamli": "Estadísticamente significativa",
    "kazoneri.dahaVeri": "Se necesitan más datos",
    "kazoneri.runnerUp": "Subcampeona:",
    "kazoneri.netFark.a": "diferencia neta",
    "kazoneri.netFark.b": "pts",
    "kazoneri.tekPolitika": "Política única",

    "gerekce.anlamli":
      "La política «{ad}» lidera por {fark} pts en puntuación neta, y su ventaja en detención de bots es estadísticamente significativa con {guven}% de confianza (p<0.05). Aplicable.",
    "gerekce.belirsiz":
      "«{ad}» lidera en puntuación neta ({fark} pts) pero la diferencia aún no es estadísticamente segura con {guven}% de confianza — la decisión se afianzará a medida que se recoja más tráfico.",
    "gerekce.tekPolitika": "No hay una segunda política para comparar.",

    "ist.guven": "Confianza",
    "ist.pDegeri": "valor p",
    "ist.ci": "Captura de bots IC 95%",
    "ist.guc": "Potencia de la muestra",

    "not.baslik": "Decisión aún no definitiva",
    "not.metin":
      "La ventaja de la ganadora no pudo confirmarse estadísticamente con {guven}% de confianza (p ≥ 0.05). La distinción se afinará a medida que recojas más tráfico — hasta entonces, mantener el ajuste actual es seguro.",

    "oneri.baslik": "Ajuste recomendado",
    "oneri.botEsik": "Umbral de bot",
    "oneri.uygula": "Aplicar esta política",
    "oneri.zorlukGor": "Ver ajuste de dificultad",
    "oneri.guvensizNot": "La recomendación aún no es segura — recoge más datos primero.",

    "onerimetin.anlamli":
      "Política recomendada: «{ad}» (umbral de bot {esik}). En el tráfico observado captura el {yakalama}% de los bots (IC 95%: {ciAlt}%–{ciUst}%) y solo genera un {surtunme}% de fricción humana. Aplica esta política en el ajuste de dificultad: el mejor equilibrio seguridad/fricción.",
    "onerimetin.belirsiz":
      "Por ahora la política «{ad}» destaca ({yakalama}% de captura de bots, {surtunme}% de fricción) pero su ventaja aún no es segura con {guven}% de confianza. Recoge más tráfico antes de decidir; mantén el ajuste actual mientras tanto.",

    "sim.baslik": "¿Cómo funciona la simulación?",
    "sim.p1.a": "Esto",
    "sim.p1.vurgu": "NO es una división de tráfico A/B en vivo",
    "sim.p1.b": ". Cada política se evalúa reproduciendo",
    "sim.p1.c": "del mismo conjunto de solicitudes reales observadas por separado",
    "sim.p1.replay": "(replay contrafactual)",
    "sim.p1.d":
      ": «si esta política hubiera estado vigente, ¿cómo habría gestionado este tráfico?».",
    "sim.li1":
      "Para cada solicitud, la política compara su propio {bot} con la puntuación de humanidad real de la solicitud; si está por debajo del umbral, se toma una decisión de challenge/bloqueo (la agresividad escala la tasa de bloqueo directo).",
    "sim.li1.bot": "umbral de bot",
    "sim.li2.a": "Si se toca una solicitud de una clase de bot (automation/scraper/ai_agent…), cuenta como una",
    "sim.li2.vurgu": "captura de bot",
    "sim.li2.b": ".",
    "sim.li3.a": "Si se toca una solicitud humana/buen-bot, cuenta como",
    "sim.li3.vurgu": "fricción errónea",
    "sim.li3.b": "y se refleja en la estimación de pérdida de conversión.",
    "sim.li4.a": "La ganadora se ordena por puntuación neta; su ventaja se valida con una",
    "sim.li4.vurgu": "prueba z de dos proporciones + intervalo de confianza de Wilson",
    "sim.li4.b": ".",
    "sim.not.a":
      "Nota: la simulación por replay se basa en tráfico pasado; en el mundo real los bots pueden adaptarse a la política. Para validar los resultados con un experimento en vivo, usa la pantalla",
    "sim.not.link": "Análisis de Experimento",
    "sim.not.b": ".",

    "pol.ad.yumusak": "Suave",
    "pol.ad.dengeli": "Equilibrada",
    "pol.ad.adaptif": "Adaptativa",
    "pol.ad.siki": "Estricta",
    "pol.ad.agresif": "Agresiva",

    "pol.acik.yumusak":
      "Solo toca los bots más evidentes (puntuación muy baja). La fricción humana es la más baja, pero algunos bots se filtran.",
    "pol.acik.dengeli":
      "Desafía el tráfico sospechoso en un umbral razonable. Equilibra la captura de bots con la fricción.",
    "pol.acik.adaptif":
      "Desplaza su umbral EN VIVO según la puntuación de la solicitud y la señal de automatización: duro con los bots claros, suave en los casos límite.",
    "pol.acik.siki":
      "Desafía una amplia banda sospechosa con un umbral alto. La captura de bots es alta, la fricción humana aumenta.",
    "pol.acik.agresif":
      "Tolerancia cero: trata la banda más amplia como un bloqueo casi directo. Detiene más bots, cansa a más humanos.",

    "gorsel.dagilimBaslik": "Distribución de niveles de dificultad",
    "gorsel.politika": "políticas",
    "gorsel.dengeBaslik": "Equilibrio éxito / fricción",
    "gorsel.denge": "equilibrio",
    "gorsel.yakalama": "Captura de bots",
    "gorsel.surtunme": "Fricción humana",
    "gorsel.adaptifBaslik": "Curva adaptativa · por umbral",
    "gorsel.adaptifNot": "A medida que sube el umbral de bot, la captura aumenta — pero también la fricción humana. El óptimo está donde las dos curvas más se separan.",
    "dagilim.dusuk": "Dificultad baja",
    "dagilim.orta": "Dificultad media",
    "dagilim.yuksek": "Dificultad alta",
    "radar.baslik": "Perfil de optimización",
    "radar.botYakalama": "Captura de bots",
    "radar.insanDostu": "Amigable con humanos",
    "radar.donusum": "Protección de conversión",
    "radar.kapsama": "Cobertura",
    "radar.netSkor": "Puntuación neta",
  },
};

/**
 * Zorluk Optimizasyonu yerel çeviri erişimcisi. Hedef dile, yoksa TR'ye, o da
 * yoksa anahtarın kendisine düşer.
 */
export function optimCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
