/**
 * Saldırı Sandbox'ı & Kural Regresyon — YEREL sayfa sözlüğü.
 * ==========================================================
 * Bu dosya YALNIZCA /panel/sandbox istemci bileşeninin kullanıcıya görünen
 * KROM/ETİKET metinlerini 5 dile taşır (tr/en/de/fr/es).
 * Paylaşılan `@/lib/i18n/panel` sözlüğüne DOKUNMAZ; yalnızca `Dil` tipini ondan alır.
 *
 * ÖNEMLİ (enum & lib güvenliği):
 *  - Kural DSL enum DEĞERLERİ (field: botClass/country/…, op: eq/neq/…,
 *    action: allow/challenge/block/flag) rozet/renk/mantığı sürer, çevrilmez.
 *    Yalnızca görünen ETİKETLERİ enum→anahtar eşlemesiyle çözülür:
 *      "alan.*" (rule-engine FIELD_ETIKET yerine), "op.*" (OP_ETIKET),
 *      "aksiyon.*" (ACTION_ETIKET). Böylece lib rule-engine.ts'e DOKUNMADAN
 *      DSL etiketleri yerelleşir.
 *  - Diff enum DEĞERLERİ (iyilesme/regresyon/yanlis-pozitif) ve karar DEĞERLERİ
 *    (dagit/dikkatli/durdur) renk/ton mantığını sürer; yalnızca ETİKETLERİ
 *    "diff.*" / "karar.*" ile çevrilir (lib DIFF_ETIKET/KARAR_ETIKET yerine).
 *  - Yakalama (YAKALAMALAR) ve senaryo adları/açıklamaları lib'de TÜRKÇE üretilir;
 *    istemcide id/ad-anahtarlı eşlemelerle ("yakalama.<id>.*", "senaryo.<ad>")
 *    çevrilir — lib sandbox.ts'e DOKUNULMAZ.
 *  - IP, yol, sayı, yüzde VERİ'dir — çevrilmez.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // Açıklama şeridi
    "serit.baslik": "Yeni bir kuralı canlıya almadan önce, neyi kıracağını gör.",
    "serit.aciklama.1":
      "Kayıtlı bir trafik yakalaması (karışık saldırı + gerçek ziyaretçi)",
    "serit.aciklama.iki": "iki",
    "serit.aciklama.2": "kural setine karşı üretime hiç dokunmadan yeniden oynatılır:",
    "serit.baz": "Baz",
    "serit.aciklama.3": "(canlıdaki kuralların) ve",
    "serit.aday": "Aday",
    "serit.aciklama.4": "(aşağıda düzenlediğin taslak). Diff her isteği eşleştirir;",
    "serit.regresyon": "regresyon",
    "serit.aciklama.5": "(yakalanan saldırı artık kaçıyor) ve",
    "serit.yanlisPozitif": "yanlış pozitif",
    "serit.aciklama.6": "(meşru kullanıcı artık engelleniyor) dağıtımdan önce ortaya çıkar.",

    // Yakalama seçimi
    "sec.yakalama": "Trafik yakalaması",
    "sec.istek": "istek",
    "sec.degisiklikVar": "Taslakta değişiklik var",
    "sec.sifirla": "Sıfırla",
    "sec.calistir": "Sandbox'ı çalıştır",

    // Aday editör
    "editor.baslik": "Aday kural seti (taslak)",
    "editor.aciklama":
      "Kuralları aç/kapat, değerini değiştir veya yeni kural ekle. Değişiklikler yalnızca sandbox'ta yaşar — canlı yapılandırma korunur.",
    "editor.bos": "Taslak boş — tüm kararlar otomatik skor motoruna düşer.",
    "editor.devreDisi": "Devre dışı bırak",
    "editor.etkinlestir": "Etkinleştir",
    "editor.yeni": "yeni",
    "editor.sistem": "sistem",
    "editor.kaldir": "Kaldır",
    "editor.eger": "Eğer",
    "editor.yeniKural": "Yeni taslak kural",
    "editor.taslakEkle": "Taslak kural ekle",

    // Sonuç boş
    "sonuc.bosBaslik": "Sandbox henüz çalışmadı",
    "sonuc.bosAciklama.1": "Taslağını düzenle, ardından",
    "sonuc.bosAciklama.2": "ile bazla aday savunmayı yan-yana kıyasla.",

    // Karar bandı
    "karar.raporKisa": "Rapor",
    "karar.dagitAciklama": "Regresyon yok, meşru trafik korunuyor, net savunma arttı.",
    "karar.dikkatliAciklama": "Kayda değer yanlış pozitif — meşru kullanıcı etkileniyor.",
    "karar.durdurRegresyon": "{n} istek artık kaçıyor — savunma zayıflıyor.",
    "karar.durdurNet": "Net savunma geriledi.",

    // Etkinlik kıyas kartları
    "kart.bazEtkinlik": "Baz etkinlik",
    "kart.adayEtkinlik": "Aday etkinlik",
    "kart.netDegisim": "Net değişim (puan)",

    // Diff kırılımı
    "diffPanel.baslik": "Karar farkları (baz → aday)",
    "diff.iyilesme.aciklama": "Kaçan saldırı artık yakalanıyor",
    "diff.regresyon.aciklama": "Yakalanan saldırı artık kaçıyor",
    "diff.yanlisPozitif.aciklama": "Meşru kullanıcıya yeni sürtünme",

    // Senaryo bazında savunma
    "senaryoPanel.baslik": "Senaryo bazında savunma",
    "senaryoPanel.istek": "istek",
    "senaryoPanel.puan": "puan",
    "senaryoPanel.baz": "Baz",
    "senaryoPanel.aday": "Aday",
    "senaryoPanel.dipnot": "— her senaryoda doğru savunulan istek oranı.",

    // Örnek diff tablosu
    "ornek.baslik": "En kritik istek farkları ({n})",
    "ornek.th.fark": "Fark",
    "ornek.th.senaryo": "Senaryo",
    "ornek.th.istek": "İstek",
    "ornek.th.bazKarar": "Baz kararı",
    "ornek.th.adayKarar": "Aday kararı",
    "ornek.mesru": "(meşru)",

    // Eylem bandı
    "eylem.baslik": "Bu taslak güvenle dağıtılabilir",
    "eylem.arttiVar": "arttı",
    "eylem.arttiYok": "korundu",
    "eylem.aciklama.1": "Regresyon yok, meşru trafik korunuyor ve net savunma",
    "eylem.aciklama.2":
      ". Değişiklikleri Kurallar ekranından canlıya taşıyabilirsin.",
    "eylem.kurallarEkrani": "Kurallar ekranı",

    // Yöntem notu
    "yontem.1": "Sandbox üretime",
    "yontem.hicDokunmaz": "hiç dokunmaz",
    "yontem.2": ": her istek in-memory kural motorundan (",
    "yontem.3":
      ") geçirilir; canlı yapılandırma ve gerçek trafik etkilenmez. Trafik yakalamaları temsili senaryolardır — gerçek saldırı desenlerini modeller.",

    // Rapor metni (indirilen .txt)
    "rapor.baslik": "SPECTER — SALDIRI SANDBOX RAPORU",
    "rapor.yakalama": "Yakalama",
    "rapor.istek": "istek",
    "rapor.karar": "Karar",
    "rapor.bazEtkinlik": "Baz savunma etkinliği ",
    "rapor.adayEtkinlik": "Aday savunma etkinliği",
    "rapor.net": "net",
    "rapor.puan": "puan",
    "rapor.iyilesme": "İyileşme       ",
    "rapor.iyilesmeNot": "(kaçan saldırı artık yakalanıyor)",
    "rapor.regresyon": "Regresyon      ",
    "rapor.regresyonNot": "(yakalanan saldırı artık kaçıyor)",
    "rapor.tehlike": "⚠ TEHLİKE",
    "rapor.yanlisPozitif": "Yanlış pozitif ",
    "rapor.yanlisPozitifNot": "(meşru kullanıcıya yeni sürtünme)",
    "rapor.senaryoKirilimi": "SENARYO KIRILIMI:",
    "rapor.not":
      "Not: Sandbox üretime dokunmaz; kararlar in-memory kural motorundan üretilmiştir.",

    // Yakalama adları & açıklamaları (lib id → çeviri)
    "yakalama.karma-saldiri.ad": "Karma Saldırı + Gerçek Trafik",
    "yakalama.karma-saldiri.aciklama":
      "Kimlik doldurma dalgası, kazıyıcılar ve normal ziyaretçiler aynı pencerede.",
    "yakalama.ai-dalgasi.ad": "AI Ajan Dalgası",
    "yakalama.ai-dalgasi.aciklama":
      "GPTBot/ClaudeBot içeriği toplarken meşru arama motoru botları da geziyor.",
    "yakalama.atlatma.ad": "Gizlenme & Atlatma",
    "yakalama.atlatma.aciklama":
      "Sahte tarayıcı (TLS uyumsuz) ve headless kazıyıcılar imza atlatmaya çalışıyor.",

    // Senaryo adları (lib → çeviri)
    "senaryo.Kimlik doldurma": "Kimlik doldurma",
    "senaryo.Kazıma": "Kazıma",
    "senaryo.Gerçek ziyaretçi": "Gerçek ziyaretçi",
    "senaryo.AI eğitim taraması": "AI eğitim taraması",
    "senaryo.Arama motoru botu": "Arama motoru botu",
    "senaryo.Sahte tarayıcı (TLS)": "Sahte tarayıcı (TLS)",
    "senaryo.Headless kazıma": "Headless kazıma",
    "senaryo.Gerçek mobil": "Gerçek mobil",

    // Diff etiketleri (enum → çeviri)
    "diff.iyilesme": "İyileşme",
    "diff.regresyon": "Regresyon",
    "diff.yanlis-pozitif": "Yanlış pozitif",
    "diff.degismeyen-dogru": "Değişmeyen (doğru)",
    "diff.degismeyen-yanlis": "Değişmeyen (açık)",

    // Karar etiketleri (enum → çeviri)
    "karar.dagit": "Dağıtıma hazır",
    "karar.dikkatli": "Dikkatli dağıt",
    "karar.durdur": "Dağıtma",

    // Alan etiketleri (rule-engine FIELD_ETIKET → çeviri)
    "alan.ip": "IP",
    "alan.country": "Ülke",
    "alan.asn": "ASN",
    "alan.ua": "User-Agent",
    "alan.path": "Yol",
    "alan.score": "Skor",
    "alan.botClass": "Bot sınıfı",
    "alan.rate": "Hız",
    "alan.aiAgent": "AI ajanı",
    "alan.aiCategory": "AI kategorisi",
    "alan.headless": "Headless",
    "alan.tlsMismatch": "TLS/UA uyumsuz",
    "alan.httpVersion": "HTTP sürümü",

    // Operatör etiketleri (OP_ETIKET → çeviri)
    "op.eq": "eşittir",
    "op.neq": "eşit değil",
    "op.contains": "içerir",
    "op.gt": ">",
    "op.lt": "<",
    "op.in": "içinde",

    // Aksiyon etiketleri (ACTION_ETIKET → çeviri)
    "aksiyon.allow": "İzin ver",
    "aksiyon.challenge": "Doğrula",
    "aksiyon.block": "Engelle",
    "aksiyon.flag": "İşaretle",
  },

  en: {
    "serit.baslik": "Before you push a new rule live, see what it will break.",
    "serit.aciklama.1":
      "A recorded traffic capture (mixed attack + real visitors) is replayed against",
    "serit.aciklama.iki": "two",
    "serit.aciklama.2": "rule sets without ever touching production:",
    "serit.baz": "Base",
    "serit.aciklama.3": "(your live rules) and",
    "serit.aday": "Candidate",
    "serit.aciklama.4": "(the draft you edit below). The diff matches every request;",
    "serit.regresyon": "regression",
    "serit.aciklama.5": "(a caught attack now slips through) and",
    "serit.yanlisPozitif": "false positive",
    "serit.aciklama.6": "(a legitimate user is now blocked) surface before deployment.",

    "sec.yakalama": "Traffic capture",
    "sec.istek": "requests",
    "sec.degisiklikVar": "Draft has changes",
    "sec.sifirla": "Reset",
    "sec.calistir": "Run sandbox",

    "editor.baslik": "Candidate rule set (draft)",
    "editor.aciklama":
      "Toggle rules on/off, change their value, or add a new rule. Changes live only in the sandbox — your live configuration is preserved.",
    "editor.bos": "Draft is empty — all decisions fall to the automatic scoring engine.",
    "editor.devreDisi": "Disable",
    "editor.etkinlestir": "Enable",
    "editor.yeni": "new",
    "editor.sistem": "system",
    "editor.kaldir": "Remove",
    "editor.eger": "If",
    "editor.yeniKural": "New draft rule",
    "editor.taslakEkle": "Add draft rule",

    "sonuc.bosBaslik": "Sandbox hasn't run yet",
    "sonuc.bosAciklama.1": "Edit your draft, then use",
    "sonuc.bosAciklama.2": "to compare base and candidate defense side by side.",

    "karar.raporKisa": "Report",
    "karar.dagitAciklama": "No regression, legitimate traffic preserved, net defense increased.",
    "karar.dikkatliAciklama": "Notable false positives — legitimate users are affected.",
    "karar.durdurRegresyon": "{n} requests now slip through — defense is weakening.",
    "karar.durdurNet": "Net defense declined.",

    "kart.bazEtkinlik": "Base effectiveness",
    "kart.adayEtkinlik": "Candidate effectiveness",
    "kart.netDegisim": "Net change (points)",

    "diffPanel.baslik": "Decision differences (base → candidate)",
    "diff.iyilesme.aciklama": "Escaping attack is now caught",
    "diff.regresyon.aciklama": "Caught attack now slips through",
    "diff.yanlisPozitif.aciklama": "New friction for legitimate users",

    "senaryoPanel.baslik": "Defense by scenario",
    "senaryoPanel.istek": "requests",
    "senaryoPanel.puan": "points",
    "senaryoPanel.baz": "Base",
    "senaryoPanel.aday": "Candidate",
    "senaryoPanel.dipnot": "— share of correctly defended requests in each scenario.",

    "ornek.baslik": "Most critical request differences ({n})",
    "ornek.th.fark": "Difference",
    "ornek.th.senaryo": "Scenario",
    "ornek.th.istek": "Request",
    "ornek.th.bazKarar": "Base decision",
    "ornek.th.adayKarar": "Candidate decision",
    "ornek.mesru": "(legitimate)",

    "eylem.baslik": "This draft can be deployed safely",
    "eylem.arttiVar": "increased",
    "eylem.arttiYok": "held",
    "eylem.aciklama.1": "No regression, legitimate traffic preserved, and net defense",
    "eylem.aciklama.2": ". You can move the changes live from the Rules screen.",
    "eylem.kurallarEkrani": "Rules screen",

    "yontem.1": "The sandbox",
    "yontem.hicDokunmaz": "never touches",
    "yontem.2": "production: every request is run through the in-memory rule engine (",
    "yontem.3":
      "); the live configuration and real traffic are unaffected. Traffic captures are representative scenarios — they model real attack patterns.",

    "rapor.baslik": "SPECTER — ATTACK SANDBOX REPORT",
    "rapor.yakalama": "Capture",
    "rapor.istek": "requests",
    "rapor.karar": "Decision",
    "rapor.bazEtkinlik": "Base defense effectiveness  ",
    "rapor.adayEtkinlik": "Candidate defense effectiveness",
    "rapor.net": "net",
    "rapor.puan": "points",
    "rapor.iyilesme": "Improvement    ",
    "rapor.iyilesmeNot": "(escaping attack now caught)",
    "rapor.regresyon": "Regression     ",
    "rapor.regresyonNot": "(caught attack now slips through)",
    "rapor.tehlike": "⚠ DANGER",
    "rapor.yanlisPozitif": "False positive ",
    "rapor.yanlisPozitifNot": "(new friction for legitimate users)",
    "rapor.senaryoKirilimi": "SCENARIO BREAKDOWN:",
    "rapor.not":
      "Note: The sandbox does not touch production; decisions are produced by the in-memory rule engine.",

    "yakalama.karma-saldiri.ad": "Mixed Attack + Real Traffic",
    "yakalama.karma-saldiri.aciklama":
      "A credential-stuffing wave, scrapers and normal visitors in the same window.",
    "yakalama.ai-dalgasi.ad": "AI Agent Wave",
    "yakalama.ai-dalgasi.aciklama":
      "GPTBot/ClaudeBot harvesting content while legitimate search engine bots also crawl.",
    "yakalama.atlatma.ad": "Cloaking & Evasion",
    "yakalama.atlatma.aciklama":
      "Fake browsers (TLS mismatch) and headless scrapers trying to evade signatures.",

    "senaryo.Kimlik doldurma": "Credential stuffing",
    "senaryo.Kazıma": "Scraping",
    "senaryo.Gerçek ziyaretçi": "Real visitor",
    "senaryo.AI eğitim taraması": "AI training crawl",
    "senaryo.Arama motoru botu": "Search engine bot",
    "senaryo.Sahte tarayıcı (TLS)": "Fake browser (TLS)",
    "senaryo.Headless kazıma": "Headless scraping",
    "senaryo.Gerçek mobil": "Real mobile",

    "diff.iyilesme": "Improvement",
    "diff.regresyon": "Regression",
    "diff.yanlis-pozitif": "False positive",
    "diff.degismeyen-dogru": "Unchanged (correct)",
    "diff.degismeyen-yanlis": "Unchanged (open)",

    "karar.dagit": "Ready to deploy",
    "karar.dikkatli": "Deploy carefully",
    "karar.durdur": "Do not deploy",

    "alan.ip": "IP",
    "alan.country": "Country",
    "alan.asn": "ASN",
    "alan.ua": "User-Agent",
    "alan.path": "Path",
    "alan.score": "Score",
    "alan.botClass": "Bot class",
    "alan.rate": "Rate",
    "alan.aiAgent": "AI agent",
    "alan.aiCategory": "AI category",
    "alan.headless": "Headless",
    "alan.tlsMismatch": "TLS/UA mismatch",
    "alan.httpVersion": "HTTP version",

    "op.eq": "equals",
    "op.neq": "not equal",
    "op.contains": "contains",
    "op.gt": ">",
    "op.lt": "<",
    "op.in": "in",

    "aksiyon.allow": "Allow",
    "aksiyon.challenge": "Challenge",
    "aksiyon.block": "Block",
    "aksiyon.flag": "Flag",
  },

  de: {
    "serit.baslik": "Bevor du eine neue Regel live schaltest, sieh, was sie zerbricht.",
    "serit.aciklama.1":
      "Eine aufgezeichnete Traffic-Aufnahme (gemischter Angriff + echte Besucher) wird gegen",
    "serit.aciklama.iki": "zwei",
    "serit.aciklama.2": "Regelsätze abgespielt, ohne die Produktion je zu berühren:",
    "serit.baz": "Basis",
    "serit.aciklama.3": "(deine Live-Regeln) und",
    "serit.aday": "Kandidat",
    "serit.aciklama.4": "(der Entwurf, den du unten bearbeitest). Der Diff gleicht jede Anfrage ab;",
    "serit.regresyon": "Regression",
    "serit.aciklama.5": "(ein abgefangener Angriff rutscht jetzt durch) und",
    "serit.yanlisPozitif": "Falsch-Positiv",
    "serit.aciklama.6": "(ein legitimer Nutzer wird jetzt blockiert) treten vor der Bereitstellung zutage.",

    "sec.yakalama": "Traffic-Aufnahme",
    "sec.istek": "Anfragen",
    "sec.degisiklikVar": "Entwurf hat Änderungen",
    "sec.sifirla": "Zurücksetzen",
    "sec.calistir": "Sandbox ausführen",

    "editor.baslik": "Kandidaten-Regelsatz (Entwurf)",
    "editor.aciklama":
      "Regeln ein-/ausschalten, ihren Wert ändern oder eine neue Regel hinzufügen. Änderungen leben nur in der Sandbox — deine Live-Konfiguration bleibt erhalten.",
    "editor.bos": "Entwurf ist leer — alle Entscheidungen fallen an die automatische Scoring-Engine.",
    "editor.devreDisi": "Deaktivieren",
    "editor.etkinlestir": "Aktivieren",
    "editor.yeni": "neu",
    "editor.sistem": "System",
    "editor.kaldir": "Entfernen",
    "editor.eger": "Wenn",
    "editor.yeniKural": "Neue Entwurfsregel",
    "editor.taslakEkle": "Entwurfsregel hinzufügen",

    "sonuc.bosBaslik": "Sandbox wurde noch nicht ausgeführt",
    "sonuc.bosAciklama.1": "Bearbeite deinen Entwurf, dann nutze",
    "sonuc.bosAciklama.2": ", um Basis- und Kandidaten-Abwehr nebeneinander zu vergleichen.",

    "karar.raporKisa": "Bericht",
    "karar.dagitAciklama": "Keine Regression, legitimer Traffic erhalten, Netto-Abwehr gestiegen.",
    "karar.dikkatliAciklama": "Nennenswerte Falsch-Positive — legitime Nutzer sind betroffen.",
    "karar.durdurRegresyon": "{n} Anfragen rutschen jetzt durch — die Abwehr wird schwächer.",
    "karar.durdurNet": "Netto-Abwehr ist zurückgegangen.",

    "kart.bazEtkinlik": "Basis-Wirksamkeit",
    "kart.adayEtkinlik": "Kandidaten-Wirksamkeit",
    "kart.netDegisim": "Netto-Veränderung (Punkte)",

    "diffPanel.baslik": "Entscheidungsunterschiede (Basis → Kandidat)",
    "diff.iyilesme.aciklama": "Durchrutschender Angriff wird jetzt abgefangen",
    "diff.regresyon.aciklama": "Abgefangener Angriff rutscht jetzt durch",
    "diff.yanlisPozitif.aciklama": "Neue Reibung für legitime Nutzer",

    "senaryoPanel.baslik": "Abwehr nach Szenario",
    "senaryoPanel.istek": "Anfragen",
    "senaryoPanel.puan": "Punkte",
    "senaryoPanel.baz": "Basis",
    "senaryoPanel.aday": "Kandidat",
    "senaryoPanel.dipnot": "— Anteil korrekt abgewehrter Anfragen je Szenario.",

    "ornek.baslik": "Kritischste Anfrageunterschiede ({n})",
    "ornek.th.fark": "Unterschied",
    "ornek.th.senaryo": "Szenario",
    "ornek.th.istek": "Anfrage",
    "ornek.th.bazKarar": "Basis-Entscheidung",
    "ornek.th.adayKarar": "Kandidaten-Entscheidung",
    "ornek.mesru": "(legitim)",

    "eylem.baslik": "Dieser Entwurf kann sicher bereitgestellt werden",
    "eylem.arttiVar": "gestiegen",
    "eylem.arttiYok": "gehalten",
    "eylem.aciklama.1": "Keine Regression, legitimer Traffic erhalten, und die Netto-Abwehr ist",
    "eylem.aciklama.2": ". Du kannst die Änderungen über den Regeln-Bildschirm live schalten.",
    "eylem.kurallarEkrani": "Regeln-Bildschirm",

    "yontem.1": "Die Sandbox",
    "yontem.hicDokunmaz": "berührt nie",
    "yontem.2": "die Produktion: jede Anfrage wird durch die In-Memory-Regel-Engine (",
    "yontem.3":
      ") geleitet; die Live-Konfiguration und der echte Traffic bleiben unberührt. Traffic-Aufnahmen sind repräsentative Szenarien — sie modellieren echte Angriffsmuster.",

    "rapor.baslik": "SPECTER — ANGRIFFS-SANDBOX-BERICHT",
    "rapor.yakalama": "Aufnahme",
    "rapor.istek": "Anfragen",
    "rapor.karar": "Entscheidung",
    "rapor.bazEtkinlik": "Basis-Abwehrwirksamkeit  ",
    "rapor.adayEtkinlik": "Kandidaten-Abwehrwirksamkeit",
    "rapor.net": "netto",
    "rapor.puan": "Punkte",
    "rapor.iyilesme": "Verbesserung   ",
    "rapor.iyilesmeNot": "(durchrutschender Angriff jetzt abgefangen)",
    "rapor.regresyon": "Regression     ",
    "rapor.regresyonNot": "(abgefangener Angriff rutscht jetzt durch)",
    "rapor.tehlike": "⚠ GEFAHR",
    "rapor.yanlisPozitif": "Falsch-Positiv ",
    "rapor.yanlisPozitifNot": "(neue Reibung für legitime Nutzer)",
    "rapor.senaryoKirilimi": "SZENARIO-AUFSCHLÜSSELUNG:",
    "rapor.not":
      "Hinweis: Die Sandbox berührt die Produktion nicht; Entscheidungen werden von der In-Memory-Regel-Engine erzeugt.",

    "yakalama.karma-saldiri.ad": "Gemischter Angriff + Echter Traffic",
    "yakalama.karma-saldiri.aciklama":
      "Eine Credential-Stuffing-Welle, Scraper und normale Besucher im selben Zeitfenster.",
    "yakalama.ai-dalgasi.ad": "KI-Agenten-Welle",
    "yakalama.ai-dalgasi.aciklama":
      "GPTBot/ClaudeBot sammeln Inhalte, während auch legitime Suchmaschinen-Bots crawlen.",
    "yakalama.atlatma.ad": "Cloaking & Umgehung",
    "yakalama.atlatma.aciklama":
      "Gefälschte Browser (TLS-Fehlanpassung) und Headless-Scraper versuchen, Signaturen zu umgehen.",

    "senaryo.Kimlik doldurma": "Credential Stuffing",
    "senaryo.Kazıma": "Scraping",
    "senaryo.Gerçek ziyaretçi": "Echter Besucher",
    "senaryo.AI eğitim taraması": "KI-Trainings-Crawl",
    "senaryo.Arama motoru botu": "Suchmaschinen-Bot",
    "senaryo.Sahte tarayıcı (TLS)": "Gefälschter Browser (TLS)",
    "senaryo.Headless kazıma": "Headless-Scraping",
    "senaryo.Gerçek mobil": "Echtes Mobilgerät",

    "diff.iyilesme": "Verbesserung",
    "diff.regresyon": "Regression",
    "diff.yanlis-pozitif": "Falsch-Positiv",
    "diff.degismeyen-dogru": "Unverändert (korrekt)",
    "diff.degismeyen-yanlis": "Unverändert (offen)",

    "karar.dagit": "Bereit zur Bereitstellung",
    "karar.dikkatli": "Vorsichtig bereitstellen",
    "karar.durdur": "Nicht bereitstellen",

    "alan.ip": "IP",
    "alan.country": "Land",
    "alan.asn": "ASN",
    "alan.ua": "User-Agent",
    "alan.path": "Pfad",
    "alan.score": "Score",
    "alan.botClass": "Bot-Klasse",
    "alan.rate": "Rate",
    "alan.aiAgent": "KI-Agent",
    "alan.aiCategory": "KI-Kategorie",
    "alan.headless": "Headless",
    "alan.tlsMismatch": "TLS/UA-Fehlanpassung",
    "alan.httpVersion": "HTTP-Version",

    "op.eq": "gleich",
    "op.neq": "ungleich",
    "op.contains": "enthält",
    "op.gt": ">",
    "op.lt": "<",
    "op.in": "in",

    "aksiyon.allow": "Zulassen",
    "aksiyon.challenge": "Prüfen",
    "aksiyon.block": "Blockieren",
    "aksiyon.flag": "Markieren",
  },

  fr: {
    "serit.baslik": "Avant de mettre une nouvelle règle en production, voyez ce qu'elle va casser.",
    "serit.aciklama.1":
      "Une capture de trafic enregistrée (attaque mixte + vrais visiteurs) est rejouée contre",
    "serit.aciklama.iki": "deux",
    "serit.aciklama.2": "jeux de règles sans jamais toucher à la production :",
    "serit.baz": "Base",
    "serit.aciklama.3": "(vos règles en direct) et",
    "serit.aday": "Candidat",
    "serit.aciklama.4": "(le brouillon que vous éditez ci-dessous). Le diff apparie chaque requête ;",
    "serit.regresyon": "régression",
    "serit.aciklama.5": "(une attaque interceptée passe désormais) et",
    "serit.yanlisPozitif": "faux positif",
    "serit.aciklama.6": "(un utilisateur légitime est désormais bloqué) émergent avant le déploiement.",

    "sec.yakalama": "Capture de trafic",
    "sec.istek": "requêtes",
    "sec.degisiklikVar": "Le brouillon a des modifications",
    "sec.sifirla": "Réinitialiser",
    "sec.calistir": "Exécuter le sandbox",

    "editor.baslik": "Jeu de règles candidat (brouillon)",
    "editor.aciklama":
      "Activez/désactivez les règles, changez leur valeur ou ajoutez une nouvelle règle. Les modifications ne vivent que dans le sandbox — votre configuration en direct est préservée.",
    "editor.bos": "Le brouillon est vide — toutes les décisions reviennent au moteur de score automatique.",
    "editor.devreDisi": "Désactiver",
    "editor.etkinlestir": "Activer",
    "editor.yeni": "nouveau",
    "editor.sistem": "système",
    "editor.kaldir": "Retirer",
    "editor.eger": "Si",
    "editor.yeniKural": "Nouvelle règle brouillon",
    "editor.taslakEkle": "Ajouter une règle brouillon",

    "sonuc.bosBaslik": "Le sandbox n'a pas encore été exécuté",
    "sonuc.bosAciklama.1": "Modifiez votre brouillon, puis utilisez",
    "sonuc.bosAciklama.2": "pour comparer côte à côte la défense de base et candidate.",

    "karar.raporKisa": "Rapport",
    "karar.dagitAciklama": "Aucune régression, trafic légitime préservé, défense nette accrue.",
    "karar.dikkatliAciklama": "Faux positifs notables — les utilisateurs légitimes sont affectés.",
    "karar.durdurRegresyon": "{n} requêtes passent désormais — la défense s'affaiblit.",
    "karar.durdurNet": "La défense nette a reculé.",

    "kart.bazEtkinlik": "Efficacité de base",
    "kart.adayEtkinlik": "Efficacité candidate",
    "kart.netDegisim": "Variation nette (points)",

    "diffPanel.baslik": "Différences de décision (base → candidat)",
    "diff.iyilesme.aciklama": "L'attaque qui passait est désormais interceptée",
    "diff.regresyon.aciklama": "L'attaque interceptée passe désormais",
    "diff.yanlisPozitif.aciklama": "Nouvelle friction pour les utilisateurs légitimes",

    "senaryoPanel.baslik": "Défense par scénario",
    "senaryoPanel.istek": "requêtes",
    "senaryoPanel.puan": "points",
    "senaryoPanel.baz": "Base",
    "senaryoPanel.aday": "Candidat",
    "senaryoPanel.dipnot": "— part des requêtes correctement défendues dans chaque scénario.",

    "ornek.baslik": "Différences de requêtes les plus critiques ({n})",
    "ornek.th.fark": "Différence",
    "ornek.th.senaryo": "Scénario",
    "ornek.th.istek": "Requête",
    "ornek.th.bazKarar": "Décision de base",
    "ornek.th.adayKarar": "Décision candidate",
    "ornek.mesru": "(légitime)",

    "eylem.baslik": "Ce brouillon peut être déployé en toute sécurité",
    "eylem.arttiVar": "a augmenté",
    "eylem.arttiYok": "s'est maintenue",
    "eylem.aciklama.1": "Aucune régression, trafic légitime préservé, et la défense nette",
    "eylem.aciklama.2": ". Vous pouvez mettre les modifications en production depuis l'écran Règles.",
    "eylem.kurallarEkrani": "Écran Règles",

    "yontem.1": "Le sandbox",
    "yontem.hicDokunmaz": "ne touche jamais",
    "yontem.2": "à la production : chaque requête passe par le moteur de règles en mémoire (",
    "yontem.3":
      ") ; la configuration en direct et le trafic réel ne sont pas affectés. Les captures de trafic sont des scénarios représentatifs — elles modélisent de vrais schémas d'attaque.",

    "rapor.baslik": "SPECTER — RAPPORT SANDBOX D'ATTAQUE",
    "rapor.yakalama": "Capture",
    "rapor.istek": "requêtes",
    "rapor.karar": "Décision",
    "rapor.bazEtkinlik": "Efficacité de défense de base  ",
    "rapor.adayEtkinlik": "Efficacité de défense candidate",
    "rapor.net": "net",
    "rapor.puan": "points",
    "rapor.iyilesme": "Amélioration   ",
    "rapor.iyilesmeNot": "(l'attaque qui passait est interceptée)",
    "rapor.regresyon": "Régression     ",
    "rapor.regresyonNot": "(l'attaque interceptée passe désormais)",
    "rapor.tehlike": "⚠ DANGER",
    "rapor.yanlisPozitif": "Faux positif   ",
    "rapor.yanlisPozitifNot": "(nouvelle friction pour les utilisateurs légitimes)",
    "rapor.senaryoKirilimi": "RÉPARTITION PAR SCÉNARIO :",
    "rapor.not":
      "Note : le sandbox ne touche pas à la production ; les décisions sont produites par le moteur de règles en mémoire.",

    "yakalama.karma-saldiri.ad": "Attaque Mixte + Trafic Réel",
    "yakalama.karma-saldiri.aciklama":
      "Une vague de credential stuffing, des scrapers et des visiteurs normaux dans la même fenêtre.",
    "yakalama.ai-dalgasi.ad": "Vague d'Agents IA",
    "yakalama.ai-dalgasi.aciklama":
      "GPTBot/ClaudeBot moissonnent le contenu tandis que des bots de moteurs de recherche légitimes explorent aussi.",
    "yakalama.atlatma.ad": "Dissimulation & Évasion",
    "yakalama.atlatma.aciklama":
      "De faux navigateurs (TLS incohérent) et des scrapers headless tentent d'échapper aux signatures.",

    "senaryo.Kimlik doldurma": "Credential stuffing",
    "senaryo.Kazıma": "Scraping",
    "senaryo.Gerçek ziyaretçi": "Visiteur réel",
    "senaryo.AI eğitim taraması": "Crawl d'entraînement IA",
    "senaryo.Arama motoru botu": "Bot de moteur de recherche",
    "senaryo.Sahte tarayıcı (TLS)": "Faux navigateur (TLS)",
    "senaryo.Headless kazıma": "Scraping headless",
    "senaryo.Gerçek mobil": "Mobile réel",

    "diff.iyilesme": "Amélioration",
    "diff.regresyon": "Régression",
    "diff.yanlis-pozitif": "Faux positif",
    "diff.degismeyen-dogru": "Inchangé (correct)",
    "diff.degismeyen-yanlis": "Inchangé (ouvert)",

    "karar.dagit": "Prêt à déployer",
    "karar.dikkatli": "Déployer prudemment",
    "karar.durdur": "Ne pas déployer",

    "alan.ip": "IP",
    "alan.country": "Pays",
    "alan.asn": "ASN",
    "alan.ua": "User-Agent",
    "alan.path": "Chemin",
    "alan.score": "Score",
    "alan.botClass": "Classe de bot",
    "alan.rate": "Débit",
    "alan.aiAgent": "Agent IA",
    "alan.aiCategory": "Catégorie IA",
    "alan.headless": "Headless",
    "alan.tlsMismatch": "TLS/UA incohérent",
    "alan.httpVersion": "Version HTTP",

    "op.eq": "égal à",
    "op.neq": "différent de",
    "op.contains": "contient",
    "op.gt": ">",
    "op.lt": "<",
    "op.in": "dans",

    "aksiyon.allow": "Autoriser",
    "aksiyon.challenge": "Vérifier",
    "aksiyon.block": "Bloquer",
    "aksiyon.flag": "Marquer",
  },

  es: {
    "serit.baslik": "Antes de poner una nueva regla en producción, mira qué va a romper.",
    "serit.aciklama.1":
      "Una captura de tráfico grabada (ataque mixto + visitantes reales) se reproduce contra",
    "serit.aciklama.iki": "dos",
    "serit.aciklama.2": "conjuntos de reglas sin tocar nunca la producción:",
    "serit.baz": "Base",
    "serit.aciklama.3": "(tus reglas en vivo) y",
    "serit.aday": "Candidata",
    "serit.aciklama.4": "(el borrador que editas abajo). El diff empareja cada solicitud;",
    "serit.regresyon": "regresión",
    "serit.aciklama.5": "(un ataque atrapado ahora se cuela) y",
    "serit.yanlisPozitif": "falso positivo",
    "serit.aciklama.6": "(un usuario legítimo ahora es bloqueado) salen a la luz antes del despliegue.",

    "sec.yakalama": "Captura de tráfico",
    "sec.istek": "solicitudes",
    "sec.degisiklikVar": "El borrador tiene cambios",
    "sec.sifirla": "Restablecer",
    "sec.calistir": "Ejecutar sandbox",

    "editor.baslik": "Conjunto de reglas candidato (borrador)",
    "editor.aciklama":
      "Activa/desactiva reglas, cambia su valor o añade una nueva regla. Los cambios solo viven en el sandbox — tu configuración en vivo se conserva.",
    "editor.bos": "El borrador está vacío — todas las decisiones recaen en el motor de puntuación automático.",
    "editor.devreDisi": "Desactivar",
    "editor.etkinlestir": "Activar",
    "editor.yeni": "nuevo",
    "editor.sistem": "sistema",
    "editor.kaldir": "Quitar",
    "editor.eger": "Si",
    "editor.yeniKural": "Nueva regla borrador",
    "editor.taslakEkle": "Añadir regla borrador",

    "sonuc.bosBaslik": "El sandbox aún no se ha ejecutado",
    "sonuc.bosAciklama.1": "Edita tu borrador y luego usa",
    "sonuc.bosAciklama.2": "para comparar la defensa base y candidata lado a lado.",

    "karar.raporKisa": "Informe",
    "karar.dagitAciklama": "Sin regresión, tráfico legítimo preservado, defensa neta aumentada.",
    "karar.dikkatliAciklama": "Falsos positivos notables — los usuarios legítimos se ven afectados.",
    "karar.durdurRegresyon": "{n} solicitudes ahora se cuelan — la defensa se debilita.",
    "karar.durdurNet": "La defensa neta retrocedió.",

    "kart.bazEtkinlik": "Eficacia base",
    "kart.adayEtkinlik": "Eficacia candidata",
    "kart.netDegisim": "Cambio neto (puntos)",

    "diffPanel.baslik": "Diferencias de decisión (base → candidata)",
    "diff.iyilesme.aciklama": "El ataque que se colaba ahora se atrapa",
    "diff.regresyon.aciklama": "El ataque atrapado ahora se cuela",
    "diff.yanlisPozitif.aciklama": "Nueva fricción para usuarios legítimos",

    "senaryoPanel.baslik": "Defensa por escenario",
    "senaryoPanel.istek": "solicitudes",
    "senaryoPanel.puan": "puntos",
    "senaryoPanel.baz": "Base",
    "senaryoPanel.aday": "Candidata",
    "senaryoPanel.dipnot": "— proporción de solicitudes defendidas correctamente en cada escenario.",

    "ornek.baslik": "Diferencias de solicitud más críticas ({n})",
    "ornek.th.fark": "Diferencia",
    "ornek.th.senaryo": "Escenario",
    "ornek.th.istek": "Solicitud",
    "ornek.th.bazKarar": "Decisión base",
    "ornek.th.adayKarar": "Decisión candidata",
    "ornek.mesru": "(legítimo)",

    "eylem.baslik": "Este borrador puede desplegarse con seguridad",
    "eylem.arttiVar": "aumentó",
    "eylem.arttiYok": "se mantuvo",
    "eylem.aciklama.1": "Sin regresión, tráfico legítimo preservado, y la defensa neta",
    "eylem.aciklama.2": ". Puedes llevar los cambios a producción desde la pantalla de Reglas.",
    "eylem.kurallarEkrani": "Pantalla de Reglas",

    "yontem.1": "El sandbox",
    "yontem.hicDokunmaz": "nunca toca",
    "yontem.2": "la producción: cada solicitud pasa por el motor de reglas en memoria (",
    "yontem.3":
      "); la configuración en vivo y el tráfico real no se ven afectados. Las capturas de tráfico son escenarios representativos — modelan patrones de ataque reales.",

    "rapor.baslik": "SPECTER — INFORME DEL SANDBOX DE ATAQUE",
    "rapor.yakalama": "Captura",
    "rapor.istek": "solicitudes",
    "rapor.karar": "Decisión",
    "rapor.bazEtkinlik": "Eficacia de defensa base  ",
    "rapor.adayEtkinlik": "Eficacia de defensa candidata",
    "rapor.net": "neto",
    "rapor.puan": "puntos",
    "rapor.iyilesme": "Mejora         ",
    "rapor.iyilesmeNot": "(el ataque que se colaba ahora se atrapa)",
    "rapor.regresyon": "Regresión      ",
    "rapor.regresyonNot": "(el ataque atrapado ahora se cuela)",
    "rapor.tehlike": "⚠ PELIGRO",
    "rapor.yanlisPozitif": "Falso positivo ",
    "rapor.yanlisPozitifNot": "(nueva fricción para usuarios legítimos)",
    "rapor.senaryoKirilimi": "DESGLOSE POR ESCENARIO:",
    "rapor.not":
      "Nota: el sandbox no toca la producción; las decisiones las produce el motor de reglas en memoria.",

    "yakalama.karma-saldiri.ad": "Ataque Mixto + Tráfico Real",
    "yakalama.karma-saldiri.aciklama":
      "Una ola de relleno de credenciales, scrapers y visitantes normales en la misma ventana.",
    "yakalama.ai-dalgasi.ad": "Ola de Agentes de IA",
    "yakalama.ai-dalgasi.aciklama":
      "GPTBot/ClaudeBot recolectan contenido mientras bots legítimos de motores de búsqueda también rastrean.",
    "yakalama.atlatma.ad": "Encubrimiento y Evasión",
    "yakalama.atlatma.aciklama":
      "Navegadores falsos (TLS incoherente) y scrapers headless intentan evadir las firmas.",

    "senaryo.Kimlik doldurma": "Relleno de credenciales",
    "senaryo.Kazıma": "Scraping",
    "senaryo.Gerçek ziyaretçi": "Visitante real",
    "senaryo.AI eğitim taraması": "Rastreo de entrenamiento de IA",
    "senaryo.Arama motoru botu": "Bot de motor de búsqueda",
    "senaryo.Sahte tarayıcı (TLS)": "Navegador falso (TLS)",
    "senaryo.Headless kazıma": "Scraping headless",
    "senaryo.Gerçek mobil": "Móvil real",

    "diff.iyilesme": "Mejora",
    "diff.regresyon": "Regresión",
    "diff.yanlis-pozitif": "Falso positivo",
    "diff.degismeyen-dogru": "Sin cambios (correcto)",
    "diff.degismeyen-yanlis": "Sin cambios (abierto)",

    "karar.dagit": "Listo para desplegar",
    "karar.dikkatli": "Desplegar con cuidado",
    "karar.durdur": "No desplegar",

    "alan.ip": "IP",
    "alan.country": "País",
    "alan.asn": "ASN",
    "alan.ua": "User-Agent",
    "alan.path": "Ruta",
    "alan.score": "Puntuación",
    "alan.botClass": "Clase de bot",
    "alan.rate": "Tasa",
    "alan.aiAgent": "Agente de IA",
    "alan.aiCategory": "Categoría de IA",
    "alan.headless": "Headless",
    "alan.tlsMismatch": "TLS/UA incoherente",
    "alan.httpVersion": "Versión HTTP",

    "op.eq": "igual a",
    "op.neq": "distinto de",
    "op.contains": "contiene",
    "op.gt": ">",
    "op.lt": "<",
    "op.in": "en",

    "aksiyon.allow": "Permitir",
    "aksiyon.challenge": "Verificar",
    "aksiyon.block": "Bloquear",
    "aksiyon.flag": "Marcar",
  },
};

/** Anahtarı verilen dile çevir; yoksa TR'ye, o da yoksa anahtara düşer. */
export function sandboxCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
