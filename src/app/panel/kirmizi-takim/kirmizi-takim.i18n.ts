/**
 * Kırmızı Takım paneli — YEREL sayfa sözlüğü.
 * =====================================================
 * Bu dosya YALNIZCA /panel/kirmizi-takim istemci bileşenlerinin kullanıcıya
 * görünen KROM/ETİKET metinlerini 5 dile taşır (tr/en/de/fr/es).
 * Paylaşılan `@/lib/i18n/panel` sözlüğüne DOKUNMAZ; sadece `Dil` tipini ondan alır.
 *
 * ÖNEMLİ (güvenlik + veri):
 *  - Senaryo `ad`/`aciklama` metinleri lib'den (kirmizi-takim) TR olarak gelir.
 *    Lib DÜZENLENMEDEN, istemcide senaryo `id`'sine göre yeniden çevrilir.
 *    Bilinmeyen id olduğu gibi (lib TR metni) kalır.
 *  - Enum DEĞERLERİ (durum: korunuyor/kismi/acik; siddet: orta/yuksek/kritik;
 *    beklenen: block/challenge; kategori anahtarları) filtre/ikon sürer —
 *    çevrilmez; yalnızca ETİKETLERİ enum→anahtar eşlemesiyle çevrilir.
 *  - Sayılar, yüzdeler, yakalayan kural id'leri VERİ'dir — çevrilmez.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // Açıklama şeridi
    "kt.serit.baslik": "Savunmanı gerçek saldırılarla test et.",
    "kt.serit.aciklama":
      "Kırmızı takım, {n} gerçekçi saldırı senaryosunu (kimlik doldurma, kazıma botneti, AI taraması, DDoS, sahte tarayıcı, headless kazıma) senin GERÇEK kurallarından geçirir. Hangi saldırıyı yakalıyorsun, hangisi kaçıyor — açık noktaları gör.",
    "kt.serit.gercekKural": "GERÇEK kurallarından",

    // Kapsama skoru paneli
    "kt.skor.baslik": "Savunma kapsama skoru",
    "kt.skor.kapsama": "kapsama",
    "kt.skor.korunuyor": "korunuyor",
    "kt.skor.acik": "açık",
    "kt.skor.aktifKural": "aktif kural",
    "kt.skor.calistir": "Simülasyonu çalıştır",
    "kt.skor.calisiyor": "Çalışıyor…",

    // Özet uyarı şeritleri
    "kt.uyari.kritikBaslik": "{n} kritik saldırı savunmasız!",
    "kt.uyari.kritikAciklama":
      "Kritik senaryolar mevcut kurallarınla engellenmiyor. Aşağıdaki açık senaryolar için hemen kural ekle.",
    "kt.uyari.acikBaslik": "{n} senaryo savunmasız",
    "kt.uyari.acikAciklama": "Bazı saldırılar kaçıyor — kapsamı güçlendir.",
    "kt.uyari.temizBaslik": "Tüm senaryolar korunuyor 🎉",
    "kt.uyari.temizAciklama": "Mevcut kuralların {n} saldırı senaryosunu da yakalıyor.",

    // Özet KPI'lar
    "kt.kpi.testEdilen": "Test edilen senaryo",
    "kt.kpi.korunan": "Korunan",
    "kt.kpi.acik": "Açık",

    // Senaryo kartı — durum etiketleri (enum → anahtar)
    "kt.durum.korunuyor": "Korunuyor",
    "kt.durum.kismi": "Kısmi",
    "kt.durum.acik": "Açık (savunmasız)",

    // Şiddet etiketleri (enum → anahtar)
    "kt.siddet.orta": "orta",
    "kt.siddet.yuksek": "yüksek",
    "kt.siddet.kritik": "kritik",

    // Beklenen davranış (enum → anahtar)
    "kt.beklenen.on": "Beklenen:",
    "kt.beklenen.block": "engelle",
    "kt.beklenen.challenge": "doğrula",

    // Senaryo satırı sayaçları
    "kt.satir.engellendi": "engellendi",
    "kt.satir.dogrulandi": "doğrulandı",
    "kt.satir.kacti": "kaçtı",
    "kt.satir.yakalayan": "yakalayan:",
    "kt.satir.etkinlik": "etkinlik",

    // Açık / korunuyor alt şeritleri
    "kt.acik.uyari": "Bu saldırı savunmandan geçiyor — kural ekle.",
    "kt.acik.kuralOner": "Kural öner",
    "kt.korunuyor.mesaj": "Bu saldırı mevcut kurallarınla etkili biçimde engelleniyor.",

    // Toast
    "kt.toast.basariBaslik": "Simülasyon tamamlandı",
    "kt.toast.basariAciklama": "{n} saldırı senaryosu kurallarına karşı çalıştırıldı.",
    "kt.toast.hataBaslik": "Simülasyon başarısız",

    // Senaryo adları (id → çeviri; lib değeri çevrilmez, id ile eşlenir)
    "kt.senaryo.credential-stuffing.ad": "Kimlik Doldurma Saldırısı",
    "kt.senaryo.credential-stuffing.aciklama": "Botnet /login yolunu düşük skorlu, yüksek hızlı isteklerle bombardıman ediyor.",
    "kt.senaryo.scraper-botnet.ad": "Kazıma Botneti",
    "kt.senaryo.scraper-botnet.aciklama": "Dağıtık kazıyıcılar ürün/fiyat sayfalarını sistematik topluyor.",
    "kt.senaryo.ai-training.ad": "AI Eğitim Taraması",
    "kt.senaryo.ai-training.aciklama": "GPTBot/ClaudeBot içeriği model eğitimi için topluyor.",
    "kt.senaryo.spoofed-browser.ad": "Sahte Tarayıcı (TLS Atlatma)",
    "kt.senaryo.spoofed-browser.aciklama": "UA Chrome diyor ama TLS parmak izi Python — imza atlatma denemesi.",
    "kt.senaryo.ddos-flood.ad": "DDoS Sel Saldırısı",
    "kt.senaryo.ddos-flood.aciklama": "Yüksek hacimli, çok-IP'li istek seli hizmeti boğmaya çalışıyor.",
    "kt.senaryo.headless-scrape.ad": "Headless Tarayıcı Kazıma",
    "kt.senaryo.headless-scrape.aciklama": "Puppeteer/Playwright JS-üretimli içeriği render edip topluyor.",

    // Canlı ilerleme
    "kt.canli.baslik": "Canlı saldırı akışı",
    "kt.canli.hazir": "Simülasyonu çalıştır — saldırılar katman katman işlensin.",
    "kt.canli.calisiyor": "{ad} çalışıyor…",
    "kt.canli.istek": "{i}/{n} istek",
    "kt.canli.tamamlandi": "Tüm senaryolar işlendi.",
    "kt.canli.katman.rate": "Hız katmanı",
    "kt.canli.katman.reputation": "İtibar katmanı",
    "kt.canli.katman.fingerprint": "Parmak izi katmanı",
    "kt.canli.katman.behavior": "Davranış katmanı",
    "kt.canli.katman.ghostfont": "Ghost-font katmanı",
    "kt.canli.katman.rule": "Kural motoru",
    "kt.canli.yakalayan": "yakalayan katman",
    "kt.canli.gecti": "geçti",

    // Etkinlik göstergesi
    "kt.gosterge.baslik": "Genel savunma etkinliği",
    "kt.gosterge.mukemmel": "Sektör-lideri savunma",
    "kt.gosterge.iyi": "Sağlam savunma — birkaç boşluk var",
    "kt.gosterge.zayif": "Kritik boşluklar — hemen kapat",

    // Kategori grupları
    "kt.kategori.kimlik": "Kimlik doldurma",
    "kt.kategori.kazima": "Kazıma",
    "kt.kategori.ai": "AI ajan tarama",
    "kt.kategori.ddos": "DDoS / sel",
    "kt.kategori.atlatma": "İmza atlatma",
    "kt.kategori.spam": "Spam / kötüye kullanım",
    "kt.kategori.senaryoSayisi": "{n} senaryo",
    "kt.kategori.ortEtkinlik": "ort. etkinlik",

    // Boşluk kapatma önerisi (kategori → aksiyon)
    "kt.oneri.baslik": "Bu boşluğu kapat",
    "kt.oneri.kimlik": "/login yoluna, skoru <0.3 ve hız >30 olan istekleri engelleyen bir kural ekle.",
    "kt.oneri.kazima": "Bilinen kazıyıcı UA'ları (python-requests, curl) ve datacenter ASN'lerini engelle.",
    "kt.oneri.ai": "AI ajan botClass'ı için model_egitimi kategorisini doğrula/engelle kuralı ekle.",
    "kt.oneri.ddos": "IP başına hız >150 olduğunda otomatik engelle + rate-limit politikası uygula.",
    "kt.oneri.atlatma": "TLS-UA uyumsuzluğu (tlsUaUyumsuz) ve headless imzalarını engelleyen kural ekle.",
    "kt.oneri.spam": "Yüksek hacimli tekrar eden istekleri hız + itibar kuralıyla sınırla.",
    "kt.oneri.kurGit": "Kural oluştur",
  },

  en: {
    "kt.serit.baslik": "Test your defenses against real attacks.",
    "kt.serit.aciklama":
      "The red team runs {n} realistic attack scenarios (credential stuffing, scraper botnet, AI crawling, DDoS, spoofed browser, headless scraping) through your REAL rules. See which attacks you catch and which slip through — spot your gaps.",
    "kt.serit.gercekKural": "REAL rules",

    "kt.skor.baslik": "Defense coverage score",
    "kt.skor.kapsama": "coverage",
    "kt.skor.korunuyor": "protected",
    "kt.skor.acik": "exposed",
    "kt.skor.aktifKural": "active rules",
    "kt.skor.calistir": "Run simulation",
    "kt.skor.calisiyor": "Running…",

    "kt.uyari.kritikBaslik": "{n} critical attacks exposed!",
    "kt.uyari.kritikAciklama":
      "Critical scenarios are not blocked by your current rules. Add rules for the exposed scenarios below right away.",
    "kt.uyari.acikBaslik": "{n} scenarios exposed",
    "kt.uyari.acikAciklama": "Some attacks are slipping through — strengthen your coverage.",
    "kt.uyari.temizBaslik": "All scenarios protected 🎉",
    "kt.uyari.temizAciklama": "Your current rules catch all {n} attack scenarios.",

    "kt.kpi.testEdilen": "Scenarios tested",
    "kt.kpi.korunan": "Protected",
    "kt.kpi.acik": "Exposed",

    "kt.durum.korunuyor": "Protected",
    "kt.durum.kismi": "Partial",
    "kt.durum.acik": "Exposed (vulnerable)",

    "kt.siddet.orta": "medium",
    "kt.siddet.yuksek": "high",
    "kt.siddet.kritik": "critical",

    "kt.beklenen.on": "Expected:",
    "kt.beklenen.block": "block",
    "kt.beklenen.challenge": "challenge",

    "kt.satir.engellendi": "blocked",
    "kt.satir.dogrulandi": "challenged",
    "kt.satir.kacti": "slipped through",
    "kt.satir.yakalayan": "caught by:",
    "kt.satir.etkinlik": "effectiveness",

    "kt.acik.uyari": "This attack gets past your defenses — add a rule.",
    "kt.acik.kuralOner": "Suggest a rule",
    "kt.korunuyor.mesaj": "This attack is effectively blocked by your current rules.",

    "kt.toast.basariBaslik": "Simulation complete",
    "kt.toast.basariAciklama": "{n} attack scenarios were run against your rules.",
    "kt.toast.hataBaslik": "Simulation failed",

    "kt.senaryo.credential-stuffing.ad": "Credential Stuffing Attack",
    "kt.senaryo.credential-stuffing.aciklama": "A botnet bombards the /login path with low-score, high-rate requests.",
    "kt.senaryo.scraper-botnet.ad": "Scraper Botnet",
    "kt.senaryo.scraper-botnet.aciklama": "Distributed scrapers systematically harvest product/pricing pages.",
    "kt.senaryo.ai-training.ad": "AI Training Crawl",
    "kt.senaryo.ai-training.aciklama": "GPTBot/ClaudeBot collect content for model training.",
    "kt.senaryo.spoofed-browser.ad": "Spoofed Browser (TLS Evasion)",
    "kt.senaryo.spoofed-browser.aciklama": "The UA claims Chrome but the TLS fingerprint is Python — a signature-evasion attempt.",
    "kt.senaryo.ddos-flood.ad": "DDoS Flood Attack",
    "kt.senaryo.ddos-flood.aciklama": "A high-volume, multi-IP request flood tries to overwhelm the service.",
    "kt.senaryo.headless-scrape.ad": "Headless Browser Scraping",
    "kt.senaryo.headless-scrape.aciklama": "Puppeteer/Playwright render and harvest JS-generated content.",

    "kt.canli.baslik": "Live attack stream",
    "kt.canli.hazir": "Run the simulation — watch attacks processed layer by layer.",
    "kt.canli.calisiyor": "Running {ad}…",
    "kt.canli.istek": "{i}/{n} requests",
    "kt.canli.tamamlandi": "All scenarios processed.",
    "kt.canli.katman.rate": "Rate layer",
    "kt.canli.katman.reputation": "Reputation layer",
    "kt.canli.katman.fingerprint": "Fingerprint layer",
    "kt.canli.katman.behavior": "Behavior layer",
    "kt.canli.katman.ghostfont": "Ghost-font layer",
    "kt.canli.katman.rule": "Rule engine",
    "kt.canli.yakalayan": "catching layer",
    "kt.canli.gecti": "passed",

    "kt.gosterge.baslik": "Overall defense effectiveness",
    "kt.gosterge.mukemmel": "Industry-leading defense",
    "kt.gosterge.iyi": "Solid defense — a few gaps",
    "kt.gosterge.zayif": "Critical gaps — close now",

    "kt.kategori.kimlik": "Credential stuffing",
    "kt.kategori.kazima": "Scraping",
    "kt.kategori.ai": "AI agent crawling",
    "kt.kategori.ddos": "DDoS / flood",
    "kt.kategori.atlatma": "Signature evasion",
    "kt.kategori.spam": "Spam / abuse",
    "kt.kategori.senaryoSayisi": "{n} scenarios",
    "kt.kategori.ortEtkinlik": "avg. effectiveness",

    "kt.oneri.baslik": "Close this gap",
    "kt.oneri.kimlik": "Add a rule that blocks requests to /login with score <0.3 and rate >30.",
    "kt.oneri.kazima": "Block known scraper UAs (python-requests, curl) and datacenter ASNs.",
    "kt.oneri.ai": "Add a challenge/block rule for AI-agent botClass with the model_training category.",
    "kt.oneri.ddos": "Auto-block when per-IP rate >150 and apply a rate-limit policy.",
    "kt.oneri.atlatma": "Add a rule blocking TLS-UA mismatch (tlsUaUyumsuz) and headless signatures.",
    "kt.oneri.spam": "Throttle high-volume repeated requests with a rate + reputation rule.",
    "kt.oneri.kurGit": "Create a rule",
  },

  de: {
    "kt.serit.baslik": "Teste deine Abwehr mit echten Angriffen.",
    "kt.serit.aciklama":
      "Das Red Team führt {n} realistische Angriffsszenarien (Credential-Stuffing, Scraper-Botnet, KI-Crawling, DDoS, gefälschter Browser, Headless-Scraping) durch deine ECHTEN Regeln. Sieh, welche Angriffe du abfängst und welche durchrutschen — erkenne deine Lücken.",
    "kt.serit.gercekKural": "ECHTEN Regeln",

    "kt.skor.baslik": "Abdeckungsscore der Abwehr",
    "kt.skor.kapsama": "Abdeckung",
    "kt.skor.korunuyor": "geschützt",
    "kt.skor.acik": "ungeschützt",
    "kt.skor.aktifKural": "aktive Regeln",
    "kt.skor.calistir": "Simulation ausführen",
    "kt.skor.calisiyor": "Läuft…",

    "kt.uyari.kritikBaslik": "{n} kritische Angriffe ungeschützt!",
    "kt.uyari.kritikAciklama":
      "Kritische Szenarien werden von deinen aktuellen Regeln nicht blockiert. Füge sofort Regeln für die ungeschützten Szenarien unten hinzu.",
    "kt.uyari.acikBaslik": "{n} Szenarien ungeschützt",
    "kt.uyari.acikAciklama": "Einige Angriffe rutschen durch — stärke deine Abdeckung.",
    "kt.uyari.temizBaslik": "Alle Szenarien geschützt 🎉",
    "kt.uyari.temizAciklama": "Deine aktuellen Regeln fangen alle {n} Angriffsszenarien ab.",

    "kt.kpi.testEdilen": "Getestete Szenarien",
    "kt.kpi.korunan": "Geschützt",
    "kt.kpi.acik": "Ungeschützt",

    "kt.durum.korunuyor": "Geschützt",
    "kt.durum.kismi": "Teilweise",
    "kt.durum.acik": "Ungeschützt (verwundbar)",

    "kt.siddet.orta": "mittel",
    "kt.siddet.yuksek": "hoch",
    "kt.siddet.kritik": "kritisch",

    "kt.beklenen.on": "Erwartet:",
    "kt.beklenen.block": "blockieren",
    "kt.beklenen.challenge": "prüfen",

    "kt.satir.engellendi": "blockiert",
    "kt.satir.dogrulandi": "geprüft",
    "kt.satir.kacti": "durchgerutscht",
    "kt.satir.yakalayan": "abgefangen von:",
    "kt.satir.etkinlik": "Wirksamkeit",

    "kt.acik.uyari": "Dieser Angriff kommt durch deine Abwehr — füge eine Regel hinzu.",
    "kt.acik.kuralOner": "Regel vorschlagen",
    "kt.korunuyor.mesaj": "Dieser Angriff wird von deinen aktuellen Regeln wirksam blockiert.",

    "kt.toast.basariBaslik": "Simulation abgeschlossen",
    "kt.toast.basariAciklama": "{n} Angriffsszenarien wurden gegen deine Regeln ausgeführt.",
    "kt.toast.hataBaslik": "Simulation fehlgeschlagen",

    "kt.senaryo.credential-stuffing.ad": "Credential-Stuffing-Angriff",
    "kt.senaryo.credential-stuffing.aciklama": "Ein Botnet bombardiert den /login-Pfad mit Anfragen niedriger Bewertung und hoher Rate.",
    "kt.senaryo.scraper-botnet.ad": "Scraper-Botnet",
    "kt.senaryo.scraper-botnet.aciklama": "Verteilte Scraper sammeln systematisch Produkt-/Preisseiten.",
    "kt.senaryo.ai-training.ad": "KI-Trainings-Crawl",
    "kt.senaryo.ai-training.aciklama": "GPTBot/ClaudeBot sammeln Inhalte für das Modelltraining.",
    "kt.senaryo.spoofed-browser.ad": "Gefälschter Browser (TLS-Umgehung)",
    "kt.senaryo.spoofed-browser.aciklama": "Der UA gibt Chrome an, aber der TLS-Fingerabdruck ist Python — ein Signatur-Umgehungsversuch.",
    "kt.senaryo.ddos-flood.ad": "DDoS-Flutangriff",
    "kt.senaryo.ddos-flood.aciklama": "Eine hochvolumige Anfrageflut über viele IPs versucht, den Dienst zu überlasten.",
    "kt.senaryo.headless-scrape.ad": "Headless-Browser-Scraping",
    "kt.senaryo.headless-scrape.aciklama": "Puppeteer/Playwright rendern und sammeln JS-generierte Inhalte.",

    "kt.canli.baslik": "Live-Angriffsstrom",
    "kt.canli.hazir": "Simulation ausführen — Angriffe werden Schicht für Schicht verarbeitet.",
    "kt.canli.calisiyor": "{ad} läuft…",
    "kt.canli.istek": "{i}/{n} Anfragen",
    "kt.canli.tamamlandi": "Alle Szenarien verarbeitet.",
    "kt.canli.katman.rate": "Raten-Schicht",
    "kt.canli.katman.reputation": "Reputations-Schicht",
    "kt.canli.katman.fingerprint": "Fingerabdruck-Schicht",
    "kt.canli.katman.behavior": "Verhaltens-Schicht",
    "kt.canli.katman.ghostfont": "Ghost-Font-Schicht",
    "kt.canli.katman.rule": "Regel-Engine",
    "kt.canli.yakalayan": "abfangende Schicht",
    "kt.canli.gecti": "durchgelassen",

    "kt.gosterge.baslik": "Gesamtwirksamkeit der Abwehr",
    "kt.gosterge.mukemmel": "Branchenführende Abwehr",
    "kt.gosterge.iyi": "Solide Abwehr — einige Lücken",
    "kt.gosterge.zayif": "Kritische Lücken — jetzt schließen",

    "kt.kategori.kimlik": "Credential-Stuffing",
    "kt.kategori.kazima": "Scraping",
    "kt.kategori.ai": "KI-Agent-Crawling",
    "kt.kategori.ddos": "DDoS / Flut",
    "kt.kategori.atlatma": "Signatur-Umgehung",
    "kt.kategori.spam": "Spam / Missbrauch",
    "kt.kategori.senaryoSayisi": "{n} Szenarien",
    "kt.kategori.ortEtkinlik": "Ø Wirksamkeit",

    "kt.oneri.baslik": "Diese Lücke schließen",
    "kt.oneri.kimlik": "Füge eine Regel hinzu, die Anfragen an /login mit Score <0,3 und Rate >30 blockiert.",
    "kt.oneri.kazima": "Blockiere bekannte Scraper-UAs (python-requests, curl) und Rechenzentrums-ASNs.",
    "kt.oneri.ai": "Füge eine Prüf-/Blockregel für KI-Agent-botClass mit der Kategorie model_training hinzu.",
    "kt.oneri.ddos": "Automatisch blockieren, wenn die Rate pro IP >150 ist, und eine Rate-Limit-Richtlinie anwenden.",
    "kt.oneri.atlatma": "Füge eine Regel hinzu, die TLS-UA-Diskrepanz (tlsUaUyumsuz) und Headless-Signaturen blockiert.",
    "kt.oneri.spam": "Drossle hochvolumige wiederholte Anfragen mit einer Raten- + Reputationsregel.",
    "kt.oneri.kurGit": "Regel erstellen",
  },

  fr: {
    "kt.serit.baslik": "Testez vos défenses avec de vraies attaques.",
    "kt.serit.aciklama":
      "L'équipe rouge fait passer {n} scénarios d'attaque réalistes (bourrage d'identifiants, botnet d'extraction, exploration IA, DDoS, navigateur usurpé, extraction headless) par vos VRAIES règles. Voyez quelles attaques vous interceptez et lesquelles passent — repérez vos failles.",
    "kt.serit.gercekKural": "VRAIES règles",

    "kt.skor.baslik": "Score de couverture de défense",
    "kt.skor.kapsama": "couverture",
    "kt.skor.korunuyor": "protégés",
    "kt.skor.acik": "exposés",
    "kt.skor.aktifKural": "règles actives",
    "kt.skor.calistir": "Lancer la simulation",
    "kt.skor.calisiyor": "En cours…",

    "kt.uyari.kritikBaslik": "{n} attaques critiques exposées !",
    "kt.uyari.kritikAciklama":
      "Les scénarios critiques ne sont pas bloqués par vos règles actuelles. Ajoutez sans attendre des règles pour les scénarios exposés ci-dessous.",
    "kt.uyari.acikBaslik": "{n} scénarios exposés",
    "kt.uyari.acikAciklama": "Certaines attaques passent — renforcez votre couverture.",
    "kt.uyari.temizBaslik": "Tous les scénarios protégés 🎉",
    "kt.uyari.temizAciklama": "Vos règles actuelles interceptent les {n} scénarios d'attaque.",

    "kt.kpi.testEdilen": "Scénarios testés",
    "kt.kpi.korunan": "Protégés",
    "kt.kpi.acik": "Exposés",

    "kt.durum.korunuyor": "Protégé",
    "kt.durum.kismi": "Partiel",
    "kt.durum.acik": "Exposé (vulnérable)",

    "kt.siddet.orta": "moyen",
    "kt.siddet.yuksek": "élevé",
    "kt.siddet.kritik": "critique",

    "kt.beklenen.on": "Attendu :",
    "kt.beklenen.block": "bloquer",
    "kt.beklenen.challenge": "vérifier",

    "kt.satir.engellendi": "bloqués",
    "kt.satir.dogrulandi": "vérifiés",
    "kt.satir.kacti": "passés",
    "kt.satir.yakalayan": "interceptés par :",
    "kt.satir.etkinlik": "efficacité",

    "kt.acik.uyari": "Cette attaque franchit vos défenses — ajoutez une règle.",
    "kt.acik.kuralOner": "Suggérer une règle",
    "kt.korunuyor.mesaj": "Cette attaque est efficacement bloquée par vos règles actuelles.",

    "kt.toast.basariBaslik": "Simulation terminée",
    "kt.toast.basariAciklama": "{n} scénarios d'attaque ont été exécutés contre vos règles.",
    "kt.toast.hataBaslik": "Échec de la simulation",

    "kt.senaryo.credential-stuffing.ad": "Attaque par bourrage d'identifiants",
    "kt.senaryo.credential-stuffing.aciklama": "Un botnet bombarde le chemin /login de requêtes à faible score et à haut débit.",
    "kt.senaryo.scraper-botnet.ad": "Botnet d'extraction",
    "kt.senaryo.scraper-botnet.aciklama": "Des extracteurs distribués collectent systématiquement les pages produit/tarifs.",
    "kt.senaryo.ai-training.ad": "Exploration d'entraînement IA",
    "kt.senaryo.ai-training.aciklama": "GPTBot/ClaudeBot collectent du contenu pour l'entraînement de modèles.",
    "kt.senaryo.spoofed-browser.ad": "Navigateur usurpé (contournement TLS)",
    "kt.senaryo.spoofed-browser.aciklama": "L'UA annonce Chrome mais l'empreinte TLS est Python — une tentative de contournement de signature.",
    "kt.senaryo.ddos-flood.ad": "Attaque par saturation DDoS",
    "kt.senaryo.ddos-flood.aciklama": "Un flot de requêtes à haut volume et multi-IP tente de submerger le service.",
    "kt.senaryo.headless-scrape.ad": "Extraction par navigateur headless",
    "kt.senaryo.headless-scrape.aciklama": "Puppeteer/Playwright affichent et collectent le contenu généré en JS.",

    "kt.canli.baslik": "Flux d'attaque en direct",
    "kt.canli.hazir": "Lancez la simulation — les attaques sont traitées couche par couche.",
    "kt.canli.calisiyor": "{ad} en cours…",
    "kt.canli.istek": "{i}/{n} requêtes",
    "kt.canli.tamamlandi": "Tous les scénarios traités.",
    "kt.canli.katman.rate": "Couche débit",
    "kt.canli.katman.reputation": "Couche réputation",
    "kt.canli.katman.fingerprint": "Couche empreinte",
    "kt.canli.katman.behavior": "Couche comportement",
    "kt.canli.katman.ghostfont": "Couche ghost-font",
    "kt.canli.katman.rule": "Moteur de règles",
    "kt.canli.yakalayan": "couche interceptrice",
    "kt.canli.gecti": "passé",

    "kt.gosterge.baslik": "Efficacité globale de la défense",
    "kt.gosterge.mukemmel": "Défense de pointe",
    "kt.gosterge.iyi": "Défense solide — quelques failles",
    "kt.gosterge.zayif": "Failles critiques — à combler",

    "kt.kategori.kimlik": "Bourrage d'identifiants",
    "kt.kategori.kazima": "Extraction",
    "kt.kategori.ai": "Exploration par IA",
    "kt.kategori.ddos": "DDoS / saturation",
    "kt.kategori.atlatma": "Contournement de signature",
    "kt.kategori.spam": "Spam / abus",
    "kt.kategori.senaryoSayisi": "{n} scénarios",
    "kt.kategori.ortEtkinlik": "efficacité moy.",

    "kt.oneri.baslik": "Combler cette faille",
    "kt.oneri.kimlik": "Ajoutez une règle bloquant les requêtes vers /login avec score <0,3 et débit >30.",
    "kt.oneri.kazima": "Bloquez les UA de scraping connus (python-requests, curl) et les ASN de datacenter.",
    "kt.oneri.ai": "Ajoutez une règle de vérification/blocage pour le botClass agent-IA avec la catégorie model_training.",
    "kt.oneri.ddos": "Bloquez automatiquement quand le débit par IP >150 et appliquez une politique de limitation.",
    "kt.oneri.atlatma": "Ajoutez une règle bloquant l'incohérence TLS-UA (tlsUaUyumsuz) et les signatures headless.",
    "kt.oneri.spam": "Limitez les requêtes répétées à haut volume avec une règle débit + réputation.",
    "kt.oneri.kurGit": "Créer une règle",
  },

  es: {
    "kt.serit.baslik": "Pon a prueba tus defensas con ataques reales.",
    "kt.serit.aciklama":
      "El equipo rojo hace pasar {n} escenarios de ataque realistas (relleno de credenciales, botnet de extracción, rastreo de IA, DDoS, navegador falsificado, extracción headless) por tus reglas REALES. Descubre qué ataques detienes y cuáles se escapan — detecta tus brechas.",
    "kt.serit.gercekKural": "reglas REALES",

    "kt.skor.baslik": "Puntuación de cobertura de defensa",
    "kt.skor.kapsama": "cobertura",
    "kt.skor.korunuyor": "protegidos",
    "kt.skor.acik": "expuestos",
    "kt.skor.aktifKural": "reglas activas",
    "kt.skor.calistir": "Ejecutar simulación",
    "kt.skor.calisiyor": "Ejecutando…",

    "kt.uyari.kritikBaslik": "¡{n} ataques críticos expuestos!",
    "kt.uyari.kritikAciklama":
      "Los escenarios críticos no están bloqueados por tus reglas actuales. Añade reglas de inmediato para los escenarios expuestos que aparecen abajo.",
    "kt.uyari.acikBaslik": "{n} escenarios expuestos",
    "kt.uyari.acikAciklama": "Algunos ataques se escapan — refuerza tu cobertura.",
    "kt.uyari.temizBaslik": "Todos los escenarios protegidos 🎉",
    "kt.uyari.temizAciklama": "Tus reglas actuales detienen los {n} escenarios de ataque.",

    "kt.kpi.testEdilen": "Escenarios probados",
    "kt.kpi.korunan": "Protegidos",
    "kt.kpi.acik": "Expuestos",

    "kt.durum.korunuyor": "Protegido",
    "kt.durum.kismi": "Parcial",
    "kt.durum.acik": "Expuesto (vulnerable)",

    "kt.siddet.orta": "medio",
    "kt.siddet.yuksek": "alto",
    "kt.siddet.kritik": "crítico",

    "kt.beklenen.on": "Esperado:",
    "kt.beklenen.block": "bloquear",
    "kt.beklenen.challenge": "verificar",

    "kt.satir.engellendi": "bloqueados",
    "kt.satir.dogrulandi": "verificados",
    "kt.satir.kacti": "se escaparon",
    "kt.satir.yakalayan": "detectados por:",
    "kt.satir.etkinlik": "eficacia",

    "kt.acik.uyari": "Este ataque atraviesa tus defensas — añade una regla.",
    "kt.acik.kuralOner": "Sugerir una regla",
    "kt.korunuyor.mesaj": "Este ataque se bloquea eficazmente con tus reglas actuales.",

    "kt.toast.basariBaslik": "Simulación completada",
    "kt.toast.basariAciklama": "Se ejecutaron {n} escenarios de ataque contra tus reglas.",
    "kt.toast.hataBaslik": "La simulación falló",

    "kt.senaryo.credential-stuffing.ad": "Ataque de relleno de credenciales",
    "kt.senaryo.credential-stuffing.aciklama": "Una botnet bombardea la ruta /login con solicitudes de baja puntuación y alta velocidad.",
    "kt.senaryo.scraper-botnet.ad": "Botnet de extracción",
    "kt.senaryo.scraper-botnet.aciklama": "Extractores distribuidos recopilan sistemáticamente páginas de producto/precios.",
    "kt.senaryo.ai-training.ad": "Rastreo de entrenamiento de IA",
    "kt.senaryo.ai-training.aciklama": "GPTBot/ClaudeBot recopilan contenido para el entrenamiento de modelos.",
    "kt.senaryo.spoofed-browser.ad": "Navegador falsificado (evasión TLS)",
    "kt.senaryo.spoofed-browser.aciklama": "El UA dice Chrome pero la huella TLS es Python — un intento de evasión de firma.",
    "kt.senaryo.ddos-flood.ad": "Ataque de saturación DDoS",
    "kt.senaryo.ddos-flood.aciklama": "Una avalancha de solicitudes de alto volumen y múltiples IP intenta saturar el servicio.",
    "kt.senaryo.headless-scrape.ad": "Extracción con navegador headless",
    "kt.senaryo.headless-scrape.aciklama": "Puppeteer/Playwright renderizan y recopilan contenido generado por JS.",

    "kt.canli.baslik": "Flujo de ataque en vivo",
    "kt.canli.hazir": "Ejecuta la simulación — los ataques se procesan capa por capa.",
    "kt.canli.calisiyor": "Ejecutando {ad}…",
    "kt.canli.istek": "{i}/{n} solicitudes",
    "kt.canli.tamamlandi": "Todos los escenarios procesados.",
    "kt.canli.katman.rate": "Capa de velocidad",
    "kt.canli.katman.reputation": "Capa de reputación",
    "kt.canli.katman.fingerprint": "Capa de huella",
    "kt.canli.katman.behavior": "Capa de comportamiento",
    "kt.canli.katman.ghostfont": "Capa ghost-font",
    "kt.canli.katman.rule": "Motor de reglas",
    "kt.canli.yakalayan": "capa que detecta",
    "kt.canli.gecti": "pasó",

    "kt.gosterge.baslik": "Eficacia global de la defensa",
    "kt.gosterge.mukemmel": "Defensa líder del sector",
    "kt.gosterge.iyi": "Defensa sólida — algunas brechas",
    "kt.gosterge.zayif": "Brechas críticas — ciérralas ya",

    "kt.kategori.kimlik": "Relleno de credenciales",
    "kt.kategori.kazima": "Extracción",
    "kt.kategori.ai": "Rastreo por IA",
    "kt.kategori.ddos": "DDoS / saturación",
    "kt.kategori.atlatma": "Evasión de firma",
    "kt.kategori.spam": "Spam / abuso",
    "kt.kategori.senaryoSayisi": "{n} escenarios",
    "kt.kategori.ortEtkinlik": "eficacia media",

    "kt.oneri.baslik": "Cerrar esta brecha",
    "kt.oneri.kimlik": "Añade una regla que bloquee solicitudes a /login con puntuación <0,3 y velocidad >30.",
    "kt.oneri.kazima": "Bloquea UAs de scraping conocidos (python-requests, curl) y ASNs de datacenter.",
    "kt.oneri.ai": "Añade una regla de verificación/bloqueo para el botClass agente-IA con la categoría model_training.",
    "kt.oneri.ddos": "Bloquea automáticamente cuando la velocidad por IP >150 y aplica una política de límite.",
    "kt.oneri.atlatma": "Añade una regla que bloquee la incoherencia TLS-UA (tlsUaUyumsuz) y firmas headless.",
    "kt.oneri.spam": "Limita las solicitudes repetidas de alto volumen con una regla de velocidad + reputación.",
    "kt.oneri.kurGit": "Crear una regla",
  },
};

/** Anahtarı verilen dile çevir. Bulunamazsa TR'ye, o da yoksa anahtara düşer. */
export function kirmiziTakimCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
