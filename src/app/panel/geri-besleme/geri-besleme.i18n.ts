/**
 * Katman Geri-Besleme (Layer Feedback Loop) sayfası — yerel çeviri sözlüğü.
 *
 * Sadece bu sayfaya özgü kullanıcı-görünür metinleri içerir. Paylaşılan
 * `src/lib/i18n/panel.ts` sözlüğüne DOKUNMAZ. Anahtar bulunamazsa TR'ye,
 * o da yoksa anahtarın kendisine düşer (eksik çeviri asla boş görünmez).
 *
 * Enum güvenliği: KatmanId enum DEĞERLERİ ("ghost-font", "honeypot"…) ve
 * BotClass enum DEĞERLERİ ("scraper", "ai_agent"…) asla çevrilmez; motor
 * (katman-geribesleme.ts) TR-yalın kalır. Görünür etiketler render sırasında
 * "gb.katman.<id>" / "gb.tur.<enum>" anahtarlarıyla çevrilir. Sayılar/oranlar
 * veridir; Intl ile yerelleştirilir (GB_YEREL).
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // Başlık (yerel — nav başlığı paylaşılan sözlükte)
    "gb.baslik": "Katman Geri-Besleme",
    "gb.aciklama":
      "Dört savunma katmanının gerçek yakalanan trafikten NE ÖĞRENDİĞİ: hangi bot türü hangi katmanı tetikliyor, her katman ne kadar etkili, katmanlar ne kadar örtüşüyor ve hangi tehditler hiçbir ağa takılmıyor.",

    // Boş durum
    "gb.bos.baslik": "Henüz gerçek katman-hit verisi yok",
    "gb.bos.aciklama":
      "Katman geri-besleme döngüsü, gerçek yakalanan olayların katman-hit'lerinden kurulur. Trafik biriktikçe bu ekran dolar — hangi katman hangi tehdidi öğrendiği burada belirir.",

    // Stat kartlar
    "gb.stat.hitliOlay": "Katman-hit'li olay",
    "gb.stat.hitliOlayAlt": "en az bir katmanı tetikleyen gerçek olay",
    "gb.stat.enEtkili": "En etkili katman",
    "gb.stat.enEtkiliAlt": "en çok benzersiz yakalama",
    "gb.stat.enEtkiliYok": "Henüz yok",

    // Çapraz-tablo (bot türü × katman)
    "gb.capraz.baslik": "Bot Türü × Katman Isı Matrisi",
    "gb.capraz.aciklama":
      "Her satır bir bot türü, her sütun bir savunma katmanı. Hücre ne kadar koyuysa o tür o katmanı o kadar sık tetikler — böylece hangi katmanın hangi tehdidi öğrendiği görünür.",
    "gb.capraz.turKatman": "Tür \\ Katman",
    "gb.capraz.hucre": "{sayi} tetiklenme · türün %{oran}'i",
    "gb.capraz.bosHucre": "tetiklenme yok",

    // Katman etkinliği
    "gb.katman.baslik": "Katman Etkinliği",
    "gb.katman.aciklama":
      "Her katmanın toplam tetiklenmesi, en çok yakaladığı bot türü ve YALNIZ kendisinin yakaladığı (başka katmanın görmediği) benzersiz olay sayısı. Benzersiz yakalama yüksekse o katman eşsiz değer katıyor demektir.",
    "gb.katman.toplam": "toplam tetiklenme",
    "gb.katman.baskinTur": "baskın tür",
    "gb.katman.baskinTurYok": "veri yok",
    "gb.katman.benzersiz": "benzersiz yakalama",
    "gb.katman.enEtkiliRozet": "En etkili",

    // Örtüşme
    "gb.ortusme.baslik": "Katman Örtüşmesi",
    "gb.ortusme.aciklama":
      "İki katmanın aynı olayda birlikte tetiklendiği durumlar. DÜŞÜK örtüşme İYİDİR: her katman farklı bir tehdit yakalıyor demektir — gerçek derinlemesine savunma. Yüksek örtüşme, katmanların aynı işi tekrarladığını gösterir.",
    "gb.ortusme.birlikte": "birlikte tetiklendi",
    "gb.ortusme.bos": "Hiçbir katman çifti birlikte tetiklenmedi — her katman tamamen farklı tehditler yakalıyor. İdeal derinlemesine savunma.",

    // Savunma boşlukları
    "gb.bosluk.baslik": "Savunma Boşlukları",
    "gb.bosluk.aciklama":
      "Bu kötü bot türleri gözlemlendi ama HİÇBİR katmana yakalanmadı — açık bir savunma boşluğu. Bunlar dikkat gerektirir: yeni bir kural ya da yeni bir katman gerekebilir.",
    "gb.bosluk.olay": "{n} olay hiçbir katmana yakalanmadı",
    "gb.bosluk.uyari": "Savunma boşluğu",
    "gb.bosluk.bos": "Savunma boşluğu yok — gözlemlenen her kötü tür en az bir katmana yakalandı. Tam kapsama.",

    // Derinlemesine savunma açıklayıcı
    "gb.aciklayici.baslik": "Neden Düşük Örtüşme İyidir?",
    "gb.aciklayici.p1":
      "Her katman farklı bir tehdide özelleşmiştir. Ghost-font OCR botlarını, honeypot naif otomasyonu, tutarlılık sahte tarayıcıları, işlem kanıtı ise hacimli saldırıları yakalar. Katmanlar farklı tehditler yakaladığında örtüşme düşük kalır.",
    "gb.aciklayici.p2":
      "Düşük örtüşme = her katman EŞSİZ değer katıyor = sağlam derinlemesine savunma. Bir katman bir tehdidi kaçırsa bir diğeri onu farklı bir sinyalden yakalar. Yüksek örtüşme ise fazlalık işaret eder — katmanlar aynı işi tekrar yapıyordur.",
    "gb.aciklayici.durustluk":
      "Dürüstlük: Tüm sayılar gerçek katman-hit olaylarından deterministik çıkarılır. Hiçbir katmana yakalanmayan türler savunma boşluğu olarak dürüstçe işaretlenir; yanlış güven verilmez.",

    // Katman Öz-Ayar (kapalı-döngü self-tuning öneriler)
    "gb.ozayar.baslik": "Katman Öz-Ayar Önerileri",
    "gb.ozayar.aciklama":
      "Sistem, gerçek yakalanan trafikten öğrendiklerini somut ayar önerilerine çevirir: hangi katman hangi tür için kritik, hangisi boşa çalışıyor ve nerede savunma boşluğu var. Kapalı-döngü self-tuning — bir uyarlanabilir zorluk danışmanı gibi.",
    "gb.ozayar.skor": "Öz-ayar skoru",
    "gb.ozayar.skorAlt": "boşluk az + katmanlar dengeli = yüksek",
    "gb.ozayar.bosluk": "Savunma boşluğu",
    "gb.ozayar.guclendir": "Güçlendirilecek",
    "gb.ozayar.tur.guclendir": "Güçlendir",
    "gb.ozayar.tur.koru": "Koru",
    "gb.ozayar.tur.gereksiz": "Gereksiz",
    "gb.ozayar.tur.bosluk": "Boşluk",
    "gb.ozayar.zorluk": "zorluk",
    "gb.ozayar.dahaFazla": "+{n} öneri daha",
    "gb.ozayar.durustluk":
      "Dürüstlük: Öneriler gerçek katman-hit verisinden deterministik türetilir — tahmin değil. Uygulaması insan onaylıdır: bu görünüm yalnızca tavsiye niteliğindedir ve üretim ayarlarını KENDİLİĞİNDEN değiştirmez.",
    "gb.ozayar.kapali":
      "Kapalı-döngü ayar: motor öğrenir → önerir → sen onaylarsın → uyarlanabilir zorluk güncellenir. Döngü gerçek trafikle her tur biraz daha keskinleşir.",
    // Uygula akışı (öneri → gerçek kural)
    "gb.ozayar.uygula": "Uygula",
    "gb.ozayar.uygulaniyor": "Uygulanıyor…",
    "gb.ozayar.uygulandi": "Uygulandı",
    "gb.ozayar.kurallaraGit": "Kurallara git",
    "gb.ozayar.siteSec": "Site seç",
    "gb.ozayar.siteGerek": "Uygulamak için önce bir site gerekli.",
    "gb.ozayar.basariToast": "Öneri uygulandı",
    "gb.ozayar.hataToast": "Uygulanamadı",

    // Öz-Ayar Etki Takibi (kapalı-döngü ölçüm halkası)
    "gb.etki.baslik": "Öz-Ayar Etki Takibi",
    "gb.etki.aciklama":
      "Uygulanan öz-ayar kuralları gerçekten işe yaradı mı? Her kuralın oluşturulma anı pivot alınır; öncesi ve sonrasındaki EŞİT uzunluktaki dönemler kıyaslanır — hedef bot türünün olay hacmi düştü mü, engelleme arttı mı?",
    "gb.etki.bos":
      "Henüz uygulanmış öz-ayar kuralı yok — ölçülecek bir etki oluşmadı. Yukarıdaki önerilerden birini uyguladığında, o kuralın gerçek etkisi burada öncesi/sonrası kıyasıyla belirir.",
    "gb.etki.toplam": "İzlenen kural",
    "gb.etki.etkili": "Etkili bulunan",
    "gb.etki.karar.etkili": "Etkili",
    "gb.etki.karar.notr": "Nötr",
    "gb.etki.karar.etkisiz": "Etkisiz",
    "gb.etki.karar.yetersiz-veri": "Yetersiz veri",
    "gb.etki.oncesi": "Öncesi",
    "gb.etki.sonrasi": "Sonrası",
    "gb.etki.hacim": "Hacim değişimi",
    "gb.etki.engel": "Engelleme değişimi",
    "gb.etki.puan": "puan",
    "gb.etki.olay": "olay",
    "gb.etki.durustluk":
      "Kıyas adil olsun diye kural-öncesi ve kural-sonrası dönemler EŞİT uzunlukta alınır. Az örnekli kurallar 'yetersiz veri' olarak işaretlenir; temsili sonuçlar abartılmaz.",

    // Katman adları (KatmanId → görünür ad)
    "gb.katman.ghost-font": "Ghost-Font",
    "gb.katman.honeypot": "Honeypot",
    "gb.katman.tutarlilik": "Tarayıcı Tutarlılık",
    "gb.katman.pow": "İşlem Kanıtı",

    // Bot türü etiketleri (BotClass enum → görünür ad)
    "gb.tur.human": "İnsan",
    "gb.tur.good_bot": "İyi Bot",
    "gb.tur.automation": "Otomasyon",
    "gb.tur.scraper": "Kazıyıcı",
    "gb.tur.credential_stuffing": "Kimlik Doldurma",
    "gb.tur.ai_agent": "AI Ajanı",
    "gb.tur.ddos": "DDoS",
    "gb.tur.spam": "Spam",
  },

  en: {
    "gb.baslik": "Layer Feedback",
    "gb.aciklama":
      "What the four defense layers LEARN from real caught traffic: which bot type triggers which layer, how effective each layer is, how much the layers overlap, and which threats slip past every net.",

    "gb.bos.baslik": "No real layer-hit data yet",
    "gb.bos.aciklama":
      "The layer feedback loop is built from the layer-hits of real caught events. As traffic accumulates this screen fills in — which layer learned which threat appears here.",

    "gb.stat.hitliOlay": "Layer-hit events",
    "gb.stat.hitliOlayAlt": "real events triggering at least one layer",
    "gb.stat.enEtkili": "Most effective layer",
    "gb.stat.enEtkiliAlt": "most unique catches",
    "gb.stat.enEtkiliYok": "None yet",

    "gb.capraz.baslik": "Bot Type × Layer Heatmap",
    "gb.capraz.aciklama":
      "Each row is a bot type, each column a defense layer. The darker the cell, the more often that type triggers that layer — revealing which layer learned which threat.",
    "gb.capraz.turKatman": "Type \\ Layer",
    "gb.capraz.hucre": "{sayi} triggers · {oran}% of type",
    "gb.capraz.bosHucre": "no triggers",

    "gb.katman.baslik": "Layer Effectiveness",
    "gb.katman.aciklama":
      "Each layer's total triggers, its dominant bot type, and the count of events it caught UNIQUELY (that no other layer saw). A high unique-catch count means the layer adds distinct value.",
    "gb.katman.toplam": "total triggers",
    "gb.katman.baskinTur": "dominant type",
    "gb.katman.baskinTurYok": "no data",
    "gb.katman.benzersiz": "unique catches",
    "gb.katman.enEtkiliRozet": "Most effective",

    "gb.ortusme.baslik": "Layer Overlap",
    "gb.ortusme.aciklama":
      "Cases where two layers fired together on the same event. LOW overlap is GOOD: it means each layer catches a different threat — true defense in depth. High overlap means layers repeat the same work.",
    "gb.ortusme.birlikte": "fired together",
    "gb.ortusme.bos": "No layer pair fired together — every layer catches entirely different threats. Ideal defense in depth.",

    "gb.bosluk.baslik": "Defense Gaps",
    "gb.bosluk.aciklama":
      "These malicious bot types were observed but caught by NO layer — an open defense gap. They need attention: a new rule or a new layer may be required.",
    "gb.bosluk.olay": "{n} events caught by no layer",
    "gb.bosluk.uyari": "Defense gap",
    "gb.bosluk.bos": "No defense gaps — every observed malicious type was caught by at least one layer. Full coverage.",

    "gb.aciklayici.baslik": "Why Is Low Overlap Good?",
    "gb.aciklayici.p1":
      "Each layer specializes in a different threat. Ghost-font catches OCR bots, honeypot catches naive automation, consistency catches fake browsers, and proof of work catches high-volume attacks. When layers catch different threats, overlap stays low.",
    "gb.aciklayici.p2":
      "Low overlap = each layer adds UNIQUE value = robust defense in depth. If one layer misses a threat, another catches it via a different signal. High overlap signals redundancy — the layers are doing the same work twice.",
    "gb.aciklayici.durustluk":
      "Honesty: All numbers are derived deterministically from real layer-hit events. Types caught by no layer are honestly flagged as defense gaps; no false confidence is given.",

    "gb.ozayar.baslik": "Layer Auto-Tuning Recommendations",
    "gb.ozayar.aciklama":
      "The system turns what it learned from real caught traffic into concrete tuning recommendations: which layer is critical for which type, which one runs idle, and where a defense gap exists. Closed-loop self-tuning — like an adaptive-difficulty advisor.",
    "gb.ozayar.skor": "Auto-tuning score",
    "gb.ozayar.skorAlt": "few gaps + balanced layers = high",
    "gb.ozayar.bosluk": "Defense gap",
    "gb.ozayar.guclendir": "To strengthen",
    "gb.ozayar.tur.guclendir": "Strengthen",
    "gb.ozayar.tur.koru": "Preserve",
    "gb.ozayar.tur.gereksiz": "Redundant",
    "gb.ozayar.tur.bosluk": "Gap",
    "gb.ozayar.zorluk": "difficulty",
    "gb.ozayar.dahaFazla": "+{n} more recommendations",
    "gb.ozayar.durustluk":
      "Honesty: Recommendations are derived deterministically from real layer-hit data — not guesses. Applying them is human-approved: this view is advisory only and does NOT change production settings on its own.",
    "gb.ozayar.kapali":
      "Closed-loop tuning: the engine learns → recommends → you approve → adaptive difficulty updates. With real traffic the loop sharpens a little more each round.",
    "gb.ozayar.uygula": "Apply",
    "gb.ozayar.uygulaniyor": "Applying…",
    "gb.ozayar.uygulandi": "Applied",
    "gb.ozayar.kurallaraGit": "Go to rules",
    "gb.ozayar.siteSec": "Select site",
    "gb.ozayar.siteGerek": "You need a site first to apply.",
    "gb.ozayar.basariToast": "Recommendation applied",
    "gb.ozayar.hataToast": "Could not apply",

    // Auto-Tune Impact Tracking (closed-loop measurement ring)
    "gb.etki.baslik": "Auto-Tune Impact Tracking",
    "gb.etki.aciklama":
      "Did the applied auto-tune rules actually work? Each rule's creation moment is the pivot; the EQUAL-length periods before and after are compared — did the target bot type's event volume drop, did blocking increase?",
    "gb.etki.bos":
      "No auto-tune rule has been applied yet — there is no impact to measure. Once you apply one of the recommendations above, that rule's real effect appears here as a before/after comparison.",
    "gb.etki.toplam": "Rules tracked",
    "gb.etki.etkili": "Found effective",
    "gb.etki.karar.etkili": "Effective",
    "gb.etki.karar.notr": "Neutral",
    "gb.etki.karar.etkisiz": "Ineffective",
    "gb.etki.karar.yetersiz-veri": "Insufficient data",
    "gb.etki.oncesi": "Before",
    "gb.etki.sonrasi": "After",
    "gb.etki.hacim": "Volume change",
    "gb.etki.engel": "Blocking change",
    "gb.etki.puan": "pts",
    "gb.etki.olay": "events",
    "gb.etki.durustluk":
      "To keep the comparison fair, the pre-rule and post-rule periods are taken at EQUAL length. Rules with few samples are marked 'insufficient data'; representative results are not overstated.",

    "gb.katman.ghost-font": "Ghost-Font",
    "gb.katman.honeypot": "Honeypot",
    "gb.katman.tutarlilik": "Browser Consistency",
    "gb.katman.pow": "Proof of Work",

    "gb.tur.human": "Human",
    "gb.tur.good_bot": "Good Bot",
    "gb.tur.automation": "Automation",
    "gb.tur.scraper": "Scraper",
    "gb.tur.credential_stuffing": "Credential Stuffing",
    "gb.tur.ai_agent": "AI Agent",
    "gb.tur.ddos": "DDoS",
    "gb.tur.spam": "Spam",
  },

  de: {
    "gb.baslik": "Ebenen-Feedback",
    "gb.aciklama":
      "Was die vier Verteidigungsebenen aus echtem erfasstem Traffic LERNEN: welcher Bot-Typ welche Ebene auslöst, wie effektiv jede Ebene ist, wie stark sich die Ebenen überschneiden und welche Bedrohungen durch jedes Netz schlüpfen.",

    "gb.bos.baslik": "Noch keine echten Ebenen-Treffer-Daten",
    "gb.bos.aciklama":
      "Die Ebenen-Feedback-Schleife wird aus den Ebenen-Treffern echter erfasster Ereignisse aufgebaut. Mit zunehmendem Traffic füllt sich dieser Bildschirm — welche Ebene welche Bedrohung gelernt hat, erscheint hier.",

    "gb.stat.hitliOlay": "Ebenen-Treffer-Ereignisse",
    "gb.stat.hitliOlayAlt": "echte Ereignisse, die mindestens eine Ebene auslösen",
    "gb.stat.enEtkili": "Effektivste Ebene",
    "gb.stat.enEtkiliAlt": "meiste eindeutige Fänge",
    "gb.stat.enEtkiliYok": "Noch keine",

    "gb.capraz.baslik": "Bot-Typ × Ebenen-Heatmap",
    "gb.capraz.aciklama":
      "Jede Zeile ist ein Bot-Typ, jede Spalte eine Verteidigungsebene. Je dunkler die Zelle, desto häufiger löst dieser Typ diese Ebene aus — so wird sichtbar, welche Ebene welche Bedrohung gelernt hat.",
    "gb.capraz.turKatman": "Typ \\ Ebene",
    "gb.capraz.hucre": "{sayi} Auslösungen · {oran}% des Typs",
    "gb.capraz.bosHucre": "keine Auslösungen",

    "gb.katman.baslik": "Ebenen-Effektivität",
    "gb.katman.aciklama":
      "Die Gesamtauslösungen jeder Ebene, ihr dominanter Bot-Typ und die Anzahl der Ereignisse, die sie EINDEUTIG erfasst hat (die keine andere Ebene sah). Eine hohe Anzahl eindeutiger Fänge bedeutet, dass die Ebene eigenständigen Wert schafft.",
    "gb.katman.toplam": "Auslösungen gesamt",
    "gb.katman.baskinTur": "dominanter Typ",
    "gb.katman.baskinTurYok": "keine Daten",
    "gb.katman.benzersiz": "eindeutige Fänge",
    "gb.katman.enEtkiliRozet": "Effektivste",

    "gb.ortusme.baslik": "Ebenen-Überschneidung",
    "gb.ortusme.aciklama":
      "Fälle, in denen zwei Ebenen beim selben Ereignis gemeinsam ausgelöst haben. GERINGE Überschneidung ist GUT: Jede Ebene fängt eine andere Bedrohung — echte Tiefenverteidigung. Hohe Überschneidung bedeutet, dass Ebenen dieselbe Arbeit wiederholen.",
    "gb.ortusme.birlikte": "gemeinsam ausgelöst",
    "gb.ortusme.bos": "Kein Ebenenpaar wurde gemeinsam ausgelöst — jede Ebene fängt völlig unterschiedliche Bedrohungen. Ideale Tiefenverteidigung.",

    "gb.bosluk.baslik": "Verteidigungslücken",
    "gb.bosluk.aciklama":
      "Diese bösartigen Bot-Typen wurden beobachtet, aber von KEINER Ebene erfasst — eine offene Verteidigungslücke. Sie erfordern Aufmerksamkeit: eine neue Regel oder eine neue Ebene könnte nötig sein.",
    "gb.bosluk.olay": "{n} Ereignisse von keiner Ebene erfasst",
    "gb.bosluk.uyari": "Verteidigungslücke",
    "gb.bosluk.bos": "Keine Verteidigungslücken — jeder beobachtete bösartige Typ wurde von mindestens einer Ebene erfasst. Vollständige Abdeckung.",

    "gb.aciklayici.baslik": "Warum ist geringe Überschneidung gut?",
    "gb.aciklayici.p1":
      "Jede Ebene ist auf eine andere Bedrohung spezialisiert. Ghost-Font fängt OCR-Bots, Honeypot fängt naive Automatisierung, Konsistenz fängt gefälschte Browser und Arbeitsnachweis fängt hochvolumige Angriffe. Wenn Ebenen unterschiedliche Bedrohungen fangen, bleibt die Überschneidung gering.",
    "gb.aciklayici.p2":
      "Geringe Überschneidung = jede Ebene schafft EINDEUTIGEN Wert = robuste Tiefenverteidigung. Verpasst eine Ebene eine Bedrohung, fängt eine andere sie über ein anderes Signal. Hohe Überschneidung signalisiert Redundanz — die Ebenen erledigen dieselbe Arbeit doppelt.",
    "gb.aciklayici.durustluk":
      "Ehrlichkeit: Alle Zahlen werden deterministisch aus echten Ebenen-Treffer-Ereignissen abgeleitet. Von keiner Ebene erfasste Typen werden ehrlich als Verteidigungslücken markiert; es wird kein falsches Vertrauen erzeugt.",

    "gb.ozayar.baslik": "Ebenen-Auto-Tuning-Empfehlungen",
    "gb.ozayar.aciklama":
      "Das System wandelt das aus echtem erfasstem Traffic Gelernte in konkrete Tuning-Empfehlungen um: welche Ebene für welchen Typ kritisch ist, welche leer läuft und wo eine Verteidigungslücke besteht. Closed-Loop-Selbstoptimierung — wie ein Berater für adaptive Schwierigkeit.",
    "gb.ozayar.skor": "Auto-Tuning-Wert",
    "gb.ozayar.skorAlt": "wenige Lücken + ausgewogene Ebenen = hoch",
    "gb.ozayar.bosluk": "Verteidigungslücke",
    "gb.ozayar.guclendir": "Zu verstärken",
    "gb.ozayar.tur.guclendir": "Verstärken",
    "gb.ozayar.tur.koru": "Beibehalten",
    "gb.ozayar.tur.gereksiz": "Redundant",
    "gb.ozayar.tur.bosluk": "Lücke",
    "gb.ozayar.zorluk": "Schwierigkeit",
    "gb.ozayar.dahaFazla": "+{n} weitere Empfehlungen",
    "gb.ozayar.durustluk":
      "Ehrlichkeit: Empfehlungen werden deterministisch aus echten Ebenen-Treffer-Daten abgeleitet — keine Vermutungen. Ihre Anwendung ist menschlich genehmigt: Diese Ansicht ist nur beratend und ändert Produktionseinstellungen NICHT von selbst.",
    "gb.ozayar.kapali":
      "Closed-Loop-Tuning: Die Engine lernt → empfiehlt → Sie genehmigen → die adaptive Schwierigkeit wird aktualisiert. Mit echtem Traffic wird die Schleife bei jeder Runde etwas schärfer.",
    "gb.ozayar.uygula": "Anwenden",
    "gb.ozayar.uygulaniyor": "Wird angewendet…",
    "gb.ozayar.uygulandi": "Angewendet",
    "gb.ozayar.kurallaraGit": "Zu den Regeln",
    "gb.ozayar.siteSec": "Website wählen",
    "gb.ozayar.siteGerek": "Zum Anwenden wird zuerst eine Website benötigt.",
    "gb.ozayar.basariToast": "Empfehlung angewendet",
    "gb.ozayar.hataToast": "Konnte nicht angewendet werden",

    // Auto-Tuning-Wirkungsverfolgung (geschlossene Mess-Schleife)
    "gb.etki.baslik": "Auto-Tuning-Wirkungsverfolgung",
    "gb.etki.aciklama":
      "Haben die angewendeten Auto-Tuning-Regeln wirklich gewirkt? Der Erstellungszeitpunkt jeder Regel dient als Bezugspunkt; die GLEICH langen Zeiträume davor und danach werden verglichen — ist das Ereignisvolumen des Ziel-Bot-Typs gesunken, hat die Blockierung zugenommen?",
    "gb.etki.bos":
      "Es wurde noch keine Auto-Tuning-Regel angewendet — es gibt keine Wirkung zu messen. Sobald Sie eine der obigen Empfehlungen anwenden, erscheint die tatsächliche Wirkung dieser Regel hier als Vorher-/Nachher-Vergleich.",
    "gb.etki.toplam": "Verfolgte Regeln",
    "gb.etki.etkili": "Als wirksam befunden",
    "gb.etki.karar.etkili": "Wirksam",
    "gb.etki.karar.notr": "Neutral",
    "gb.etki.karar.etkisiz": "Unwirksam",
    "gb.etki.karar.yetersiz-veri": "Unzureichende Daten",
    "gb.etki.oncesi": "Vorher",
    "gb.etki.sonrasi": "Nachher",
    "gb.etki.hacim": "Volumenänderung",
    "gb.etki.engel": "Blockierungsänderung",
    "gb.etki.puan": "Pkt.",
    "gb.etki.olay": "Ereignisse",
    "gb.etki.durustluk":
      "Damit der Vergleich fair bleibt, werden der Zeitraum vor und nach der Regel GLEICH lang gewählt. Regeln mit wenigen Stichproben werden als 'unzureichende Daten' markiert; repräsentative Ergebnisse werden nicht übertrieben.",

    "gb.katman.ghost-font": "Ghost-Font",
    "gb.katman.honeypot": "Honeypot",
    "gb.katman.tutarlilik": "Browser-Konsistenz",
    "gb.katman.pow": "Arbeitsnachweis",

    "gb.tur.human": "Mensch",
    "gb.tur.good_bot": "Guter Bot",
    "gb.tur.automation": "Automatisierung",
    "gb.tur.scraper": "Scraper",
    "gb.tur.credential_stuffing": "Credential Stuffing",
    "gb.tur.ai_agent": "KI-Agent",
    "gb.tur.ddos": "DDoS",
    "gb.tur.spam": "Spam",
  },

  fr: {
    "gb.baslik": "Retour des couches",
    "gb.aciklama":
      "Ce que les quatre couches de défense APPRENNENT du trafic réel intercepté : quel type de bot déclenche quelle couche, l'efficacité de chaque couche, le degré de chevauchement des couches et quelles menaces passent à travers chaque filet.",

    "gb.bos.baslik": "Aucune donnée réelle de déclenchement de couche pour l'instant",
    "gb.bos.aciklama":
      "La boucle de retour des couches est construite à partir des déclenchements de couches d'événements réels interceptés. À mesure que le trafic s'accumule, cet écran se remplit — quelle couche a appris quelle menace apparaît ici.",

    "gb.stat.hitliOlay": "Événements avec déclenchement de couche",
    "gb.stat.hitliOlayAlt": "événements réels déclenchant au moins une couche",
    "gb.stat.enEtkili": "Couche la plus efficace",
    "gb.stat.enEtkiliAlt": "le plus de captures uniques",
    "gb.stat.enEtkiliYok": "Aucune pour l'instant",

    "gb.capraz.baslik": "Carte de chaleur type de bot × couche",
    "gb.capraz.aciklama":
      "Chaque ligne est un type de bot, chaque colonne une couche de défense. Plus la cellule est foncée, plus ce type déclenche souvent cette couche — révélant quelle couche a appris quelle menace.",
    "gb.capraz.turKatman": "Type \\ Couche",
    "gb.capraz.hucre": "{sayi} déclenchements · {oran}% du type",
    "gb.capraz.bosHucre": "aucun déclenchement",

    "gb.katman.baslik": "Efficacité des couches",
    "gb.katman.aciklama":
      "Les déclenchements totaux de chaque couche, son type de bot dominant et le nombre d'événements qu'elle a interceptés de manière UNIQUE (qu'aucune autre couche n'a vus). Un nombre élevé de captures uniques signifie que la couche apporte une valeur distincte.",
    "gb.katman.toplam": "déclenchements totaux",
    "gb.katman.baskinTur": "type dominant",
    "gb.katman.baskinTurYok": "aucune donnée",
    "gb.katman.benzersiz": "captures uniques",
    "gb.katman.enEtkiliRozet": "La plus efficace",

    "gb.ortusme.baslik": "Chevauchement des couches",
    "gb.ortusme.aciklama":
      "Cas où deux couches se sont déclenchées ensemble sur le même événement. Un FAIBLE chevauchement est BON : chaque couche intercepte une menace différente — véritable défense en profondeur. Un chevauchement élevé signifie que les couches répètent le même travail.",
    "gb.ortusme.birlikte": "déclenchées ensemble",
    "gb.ortusme.bos": "Aucune paire de couches ne s'est déclenchée ensemble — chaque couche intercepte des menaces totalement différentes. Défense en profondeur idéale.",

    "gb.bosluk.baslik": "Failles de défense",
    "gb.bosluk.aciklama":
      "Ces types de bots malveillants ont été observés mais interceptés par AUCUNE couche — une faille de défense ouverte. Ils nécessitent une attention : une nouvelle règle ou une nouvelle couche peut être requise.",
    "gb.bosluk.olay": "{n} événements interceptés par aucune couche",
    "gb.bosluk.uyari": "Faille de défense",
    "gb.bosluk.bos": "Aucune faille de défense — chaque type malveillant observé a été intercepté par au moins une couche. Couverture totale.",

    "gb.aciklayici.baslik": "Pourquoi un faible chevauchement est-il bon ?",
    "gb.aciklayici.p1":
      "Chaque couche est spécialisée dans une menace différente. Ghost-font intercepte les bots OCR, le honeypot intercepte l'automatisation naïve, la cohérence intercepte les faux navigateurs et la preuve de travail intercepte les attaques à fort volume. Quand les couches interceptent des menaces différentes, le chevauchement reste faible.",
    "gb.aciklayici.p2":
      "Faible chevauchement = chaque couche apporte une valeur UNIQUE = défense en profondeur robuste. Si une couche manque une menace, une autre l'intercepte via un signal différent. Un chevauchement élevé signale une redondance — les couches font le même travail deux fois.",
    "gb.aciklayici.durustluk":
      "Honnêteté : tous les chiffres sont dérivés de manière déterministe d'événements réels de déclenchement de couches. Les types interceptés par aucune couche sont honnêtement signalés comme des failles de défense ; aucune fausse confiance n'est donnée.",

    "gb.ozayar.baslik": "Recommandations d'auto-réglage des couches",
    "gb.ozayar.aciklama":
      "Le système transforme ce qu'il a appris du trafic réel intercepté en recommandations de réglage concrètes : quelle couche est critique pour quel type, laquelle tourne à vide et où se trouve une faille de défense. Auto-réglage en boucle fermée — comme un conseiller de difficulté adaptative.",
    "gb.ozayar.skor": "Score d'auto-réglage",
    "gb.ozayar.skorAlt": "peu de failles + couches équilibrées = élevé",
    "gb.ozayar.bosluk": "Faille de défense",
    "gb.ozayar.guclendir": "À renforcer",
    "gb.ozayar.tur.guclendir": "Renforcer",
    "gb.ozayar.tur.koru": "Préserver",
    "gb.ozayar.tur.gereksiz": "Redondant",
    "gb.ozayar.tur.bosluk": "Faille",
    "gb.ozayar.zorluk": "difficulté",
    "gb.ozayar.dahaFazla": "+{n} recommandations de plus",
    "gb.ozayar.durustluk":
      "Honnêteté : les recommandations sont dérivées de manière déterministe des données réelles de déclenchement de couches — pas des suppositions. Leur application est approuvée par un humain : cette vue est purement consultative et ne modifie PAS les réglages de production d'elle-même.",
    "gb.ozayar.kapali":
      "Réglage en boucle fermée : le moteur apprend → recommande → vous approuvez → la difficulté adaptative se met à jour. Avec du trafic réel, la boucle s'affine un peu plus à chaque tour.",
    "gb.ozayar.uygula": "Appliquer",
    "gb.ozayar.uygulaniyor": "Application…",
    "gb.ozayar.uygulandi": "Appliqué",
    "gb.ozayar.kurallaraGit": "Aller aux règles",
    "gb.ozayar.siteSec": "Choisir un site",
    "gb.ozayar.siteGerek": "Un site est requis avant de pouvoir appliquer.",
    "gb.ozayar.basariToast": "Recommandation appliquée",
    "gb.ozayar.hataToast": "Impossible d'appliquer",

    // Suivi de l'impact de l'auto-réglage (boucle de mesure fermée)
    "gb.etki.baslik": "Suivi de l'impact de l'auto-réglage",
    "gb.etki.aciklama":
      "Les règles d'auto-réglage appliquées ont-elles vraiment fonctionné ? Le moment de création de chaque règle sert de pivot ; les périodes de durée ÉGALE avant et après sont comparées — le volume d'événements du type de bot ciblé a-t-il baissé, le blocage a-t-il augmenté ?",
    "gb.etki.bos":
      "Aucune règle d'auto-réglage n'a encore été appliquée — il n'y a aucun impact à mesurer. Dès que vous appliquez l'une des recommandations ci-dessus, l'effet réel de cette règle apparaît ici sous forme de comparaison avant/après.",
    "gb.etki.toplam": "Règles suivies",
    "gb.etki.etkili": "Jugées efficaces",
    "gb.etki.karar.etkili": "Efficace",
    "gb.etki.karar.notr": "Neutre",
    "gb.etki.karar.etkisiz": "Inefficace",
    "gb.etki.karar.yetersiz-veri": "Données insuffisantes",
    "gb.etki.oncesi": "Avant",
    "gb.etki.sonrasi": "Après",
    "gb.etki.hacim": "Variation du volume",
    "gb.etki.engel": "Variation du blocage",
    "gb.etki.puan": "pts",
    "gb.etki.olay": "événements",
    "gb.etki.durustluk":
      "Pour que la comparaison reste équitable, les périodes avant et après la règle sont prises de durée ÉGALE. Les règles à faible échantillon sont marquées « données insuffisantes » ; les résultats représentatifs ne sont pas exagérés.",

    "gb.katman.ghost-font": "Ghost-Font",
    "gb.katman.honeypot": "Honeypot",
    "gb.katman.tutarlilik": "Cohérence du navigateur",
    "gb.katman.pow": "Preuve de travail",

    "gb.tur.human": "Humain",
    "gb.tur.good_bot": "Bon bot",
    "gb.tur.automation": "Automatisation",
    "gb.tur.scraper": "Scraper",
    "gb.tur.credential_stuffing": "Bourrage d'identifiants",
    "gb.tur.ai_agent": "Agent IA",
    "gb.tur.ddos": "DDoS",
    "gb.tur.spam": "Spam",
  },

  es: {
    "gb.baslik": "Retroalimentación de capas",
    "gb.aciklama":
      "Lo que las cuatro capas de defensa APRENDEN del tráfico real capturado: qué tipo de bot activa qué capa, cuán efectiva es cada capa, cuánto se solapan las capas y qué amenazas se escapan por cada red.",

    "gb.bos.baslik": "Aún no hay datos reales de activación de capas",
    "gb.bos.aciklama":
      "El bucle de retroalimentación de capas se construye a partir de las activaciones de capa de eventos reales capturados. A medida que se acumula tráfico, esta pantalla se llena — qué capa aprendió qué amenaza aparece aquí.",

    "gb.stat.hitliOlay": "Eventos con activación de capa",
    "gb.stat.hitliOlayAlt": "eventos reales que activan al menos una capa",
    "gb.stat.enEtkili": "Capa más efectiva",
    "gb.stat.enEtkiliAlt": "más capturas únicas",
    "gb.stat.enEtkiliYok": "Ninguna aún",

    "gb.capraz.baslik": "Mapa de calor tipo de bot × capa",
    "gb.capraz.aciklama":
      "Cada fila es un tipo de bot, cada columna una capa de defensa. Cuanto más oscura la celda, más a menudo ese tipo activa esa capa — revelando qué capa aprendió qué amenaza.",
    "gb.capraz.turKatman": "Tipo \\ Capa",
    "gb.capraz.hucre": "{sayi} activaciones · {oran}% del tipo",
    "gb.capraz.bosHucre": "sin activaciones",

    "gb.katman.baslik": "Efectividad de las capas",
    "gb.katman.aciklama":
      "Las activaciones totales de cada capa, su tipo de bot dominante y el número de eventos que capturó de forma ÚNICA (que ninguna otra capa vio). Un alto número de capturas únicas significa que la capa aporta un valor distinto.",
    "gb.katman.toplam": "activaciones totales",
    "gb.katman.baskinTur": "tipo dominante",
    "gb.katman.baskinTurYok": "sin datos",
    "gb.katman.benzersiz": "capturas únicas",
    "gb.katman.enEtkiliRozet": "Más efectiva",

    "gb.ortusme.baslik": "Solapamiento de capas",
    "gb.ortusme.aciklama":
      "Casos en que dos capas se activaron juntas en el mismo evento. Un BAJO solapamiento es BUENO: cada capa captura una amenaza diferente — verdadera defensa en profundidad. Un solapamiento alto significa que las capas repiten el mismo trabajo.",
    "gb.ortusme.birlikte": "activadas juntas",
    "gb.ortusme.bos": "Ningún par de capas se activó junto — cada capa captura amenazas totalmente diferentes. Defensa en profundidad ideal.",

    "gb.bosluk.baslik": "Brechas de defensa",
    "gb.bosluk.aciklama":
      "Estos tipos de bots maliciosos fueron observados pero capturados por NINGUNA capa — una brecha de defensa abierta. Requieren atención: puede ser necesaria una nueva regla o una nueva capa.",
    "gb.bosluk.olay": "{n} eventos capturados por ninguna capa",
    "gb.bosluk.uyari": "Brecha de defensa",
    "gb.bosluk.bos": "Sin brechas de defensa — cada tipo malicioso observado fue capturado por al menos una capa. Cobertura total.",

    "gb.aciklayici.baslik": "¿Por qué es bueno un bajo solapamiento?",
    "gb.aciklayici.p1":
      "Cada capa se especializa en una amenaza diferente. Ghost-font captura bots OCR, el honeypot captura automatización ingenua, la coherencia captura navegadores falsos y la prueba de trabajo captura ataques de alto volumen. Cuando las capas capturan amenazas diferentes, el solapamiento se mantiene bajo.",
    "gb.aciklayici.p2":
      "Bajo solapamiento = cada capa aporta un valor ÚNICO = defensa en profundidad robusta. Si una capa pierde una amenaza, otra la captura mediante una señal diferente. Un solapamiento alto señala redundancia — las capas hacen el mismo trabajo dos veces.",
    "gb.aciklayici.durustluk":
      "Honestidad: todos los números se derivan de forma determinista de eventos reales de activación de capas. Los tipos capturados por ninguna capa se marcan honestamente como brechas de defensa; no se da falsa confianza.",

    "gb.ozayar.baslik": "Recomendaciones de autoajuste de capas",
    "gb.ozayar.aciklama":
      "El sistema convierte lo que aprendió del tráfico real capturado en recomendaciones de ajuste concretas: qué capa es crítica para qué tipo, cuál trabaja en vacío y dónde hay una brecha de defensa. Autoajuste en bucle cerrado — como un asesor de dificultad adaptativa.",
    "gb.ozayar.skor": "Puntuación de autoajuste",
    "gb.ozayar.skorAlt": "pocas brechas + capas equilibradas = alta",
    "gb.ozayar.bosluk": "Brecha de defensa",
    "gb.ozayar.guclendir": "Por reforzar",
    "gb.ozayar.tur.guclendir": "Reforzar",
    "gb.ozayar.tur.koru": "Preservar",
    "gb.ozayar.tur.gereksiz": "Redundante",
    "gb.ozayar.tur.bosluk": "Brecha",
    "gb.ozayar.zorluk": "dificultad",
    "gb.ozayar.dahaFazla": "+{n} recomendaciones más",
    "gb.ozayar.durustluk":
      "Honestidad: las recomendaciones se derivan de forma determinista de datos reales de activación de capas — no son conjeturas. Su aplicación es aprobada por un humano: esta vista es solo consultiva y NO cambia los ajustes de producción por sí sola.",
    "gb.ozayar.kapali":
      "Ajuste en bucle cerrado: el motor aprende → recomienda → tú apruebas → la dificultad adaptativa se actualiza. Con tráfico real, el bucle se afina un poco más en cada vuelta.",
    "gb.ozayar.uygula": "Aplicar",
    "gb.ozayar.uygulaniyor": "Aplicando…",
    "gb.ozayar.uygulandi": "Aplicado",
    "gb.ozayar.kurallaraGit": "Ir a reglas",
    "gb.ozayar.siteSec": "Seleccionar sitio",
    "gb.ozayar.siteGerek": "Se necesita un sitio antes de poder aplicar.",
    "gb.ozayar.basariToast": "Recomendación aplicada",
    "gb.ozayar.hataToast": "No se pudo aplicar",

    // Seguimiento del impacto del autoajuste (anillo de medición de bucle cerrado)
    "gb.etki.baslik": "Seguimiento del impacto del autoajuste",
    "gb.etki.aciklama":
      "¿Las reglas de autoajuste aplicadas realmente funcionaron? El momento de creación de cada regla se toma como pivote; se comparan los periodos de IGUAL duración anterior y posterior — ¿bajó el volumen de eventos del tipo de bot objetivo, aumentó el bloqueo?",
    "gb.etki.bos":
      "Aún no se ha aplicado ninguna regla de autoajuste — no hay impacto que medir. En cuanto apliques una de las recomendaciones anteriores, el efecto real de esa regla aparecerá aquí como una comparación antes/después.",
    "gb.etki.toplam": "Reglas monitorizadas",
    "gb.etki.etkili": "Halladas efectivas",
    "gb.etki.karar.etkili": "Efectiva",
    "gb.etki.karar.notr": "Neutral",
    "gb.etki.karar.etkisiz": "Inefectiva",
    "gb.etki.karar.yetersiz-veri": "Datos insuficientes",
    "gb.etki.oncesi": "Antes",
    "gb.etki.sonrasi": "Después",
    "gb.etki.hacim": "Cambio de volumen",
    "gb.etki.engel": "Cambio de bloqueo",
    "gb.etki.puan": "pts",
    "gb.etki.olay": "eventos",
    "gb.etki.durustluk":
      "Para que la comparación sea justa, los periodos previo y posterior a la regla se toman de IGUAL duración. Las reglas con pocas muestras se marcan como 'datos insuficientes'; los resultados representativos no se exageran.",

    "gb.katman.ghost-font": "Ghost-Font",
    "gb.katman.honeypot": "Honeypot",
    "gb.katman.tutarlilik": "Coherencia del navegador",
    "gb.katman.pow": "Prueba de trabajo",

    "gb.tur.human": "Humano",
    "gb.tur.good_bot": "Bot bueno",
    "gb.tur.automation": "Automatización",
    "gb.tur.scraper": "Scraper",
    "gb.tur.credential_stuffing": "Relleno de credenciales",
    "gb.tur.ai_agent": "Agente IA",
    "gb.tur.ddos": "DDoS",
    "gb.tur.spam": "Spam",
  },
};

export function geriBeslemeCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}

/** Intl için dil → yerel (locale) eşlemesi (sayı/oran biçimleme). */
export const GB_YEREL: Record<Dil, string> = {
  tr: "tr-TR",
  en: "en-US",
  de: "de-DE",
  fr: "fr-FR",
  es: "es-ES",
};
