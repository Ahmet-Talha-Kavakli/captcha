/**
 * Koruma Kapsamı & Maruz-Kalma Haritası sayfası — yerel çeviri sözlüğü.
 *
 * Sadece bu sayfaya özgü kullanıcı-görünür metinleri içerir. Paylaşılan
 * `src/lib/i18n/panel.ts` sözlüğüne DOKUNMAZ. Anahtar bulunamazsa TR'ye,
 * o da yoksa anahtarın kendisine düşer (eksik çeviri asla boş görünmez).
 *
 * Enum güvenliği: kapsam durumu ("korunuyor/kismi/acik/test_edilmedi") ve bot
 * sınıfı ("human/scraper/ddos"…) enum DEĞERLERİ asla çevrilmez; yalnızca
 * "kap.durum.<deger>" / "kap.bot.<deger>" anahtarlarıyla render sırasında
 * etiketlenir. Lib'in durumEtiket() TR çıktısı YERİNE bu anahtarlar istemcide
 * yeniden türetilir (lib düzenlenmez); durumRenk() salt-renk olduğu için
 * doğrudan kullanılır. Endpoint yolları/sayılar/oranlar veridir; {n}/{yuzde}
 * yer tutucularıyla araya sokulur.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // Sayfa başlığı (kırıntı nav.coverage'tan gelir; başlık ondan farklı)
    "kap.baslik": "Koruma Kapsamı & Maruz-Kalma Haritası",

    // Açıklama şeridi
    "kap.aciklama.baslik": "Bir koruma ürünü ancak kapsamı kadar güçlüdür.",
    "kap.aciklama.p1": "Bu harita, her endpoint'e gelen ",
    "kap.aciklama.p1b": "bot trafiğinin ne kadarının fiilen challenge/engelleme'ye takıldığını",
    "kap.aciklama.p2": " ölçer. Botların çoğunlukla ",
    "kap.aciklama.p2b": "korumasız geçtiği (allowed)",
    "kap.aciklama.p3": " yollar birer ",
    "kap.aciklama.p3b": "maruziyet deliğidir",
    "kap.aciklama.p4": " — korumasız bir ",
    "kap.aciklama.p5": " tüm ürünün sızdırdığı bir açıktır. Kapsam, gözlemlenen gerçek verdict'lerden çıkarılır.",

    // Özet kartları
    "kap.ozet.genelOran": "Genel kapsam oranı (bot hacmiyle ağırlıklı)",
    "kap.ozet.korunanUc": "Korunan endpoint",
    "kap.ozet.acikUc": "Açık endpoint",
    "kap.ozet.acikUcKritik": "Açık endpoint ({n} kritik)",
    "kap.ozet.korumasizIstek": "Korumasız geçen bot isteği",

    // Kapsam görselleştirmesi paneli
    "kap.gorsel.baslik": "Kapsam görselleştirmesi — korunan vs açık yüzey",
    "kap.gorsel.aciklama":
      "İzlenen endpoint'lerin kapsam durumuna göre dağılımı. Kırmızı dilim, botların korumasız geçtiği maruziyet yüzeyini temsil eder.",
    "kap.gorsel.bosDurum": "Henüz sınıflandırılacak endpoint yok.",

    // Açık delikler paneli
    "kap.delik.baslik": "Açık delikler — {n} endpoint korumasız sızdırıyor",
    "kap.delik.aciklamaOnce": "Bu yollara botlar geliyor ama çoğunlukla ",
    "kap.delik.aciklamaVurgu": "korumasız geçiyor",
    "kap.delik.aciklamaSonra":
      ". Kritik işaretli olanlar hassas uçlardır (login/auth/api/ödeme/admin) — önce bunları kapat.",
    "kap.delik.botIstek": "bot isteği korumasız geçti · koruma oranı",
    "kap.delik.buYoluKoru": "Bu yolu koru",
    "kap.delik.otoDuzeltme": "Oto-düzeltme",

    // Rozetler
    "kap.rozet.hassas": "Hassas",
    "kap.rozet.kritik": "Kritik",

    // Filtre çubuğu
    "kap.filtre.ara": "Endpoint ara… (ör. /login, /api)",
    "kap.filtre.araEtiket": "Endpoint ara",
    "kap.filtre.tumu": "Tümü",
    "kap.filtre.acik": "Açık",
    "kap.filtre.kismi": "Kısmi",
    "kap.filtre.korunuyor": "Korunuyor",
    "kap.filtre.testEdilmedi": "Test edilmedi",
    "kap.filtre.yalnizHassas": "Yalnız hassas yollar",

    // Kapsam haritası tablosu
    "kap.tablo.baslik": "Kapsam haritası — {n} endpoint",
    "kap.tablo.endpoint": "Endpoint",
    "kap.tablo.durum": "Durum",
    "kap.tablo.kapsam": "Kapsam (bot trafiği)",
    "kap.tablo.koruma": "Koruma",
    "kap.tablo.botIstegi": "Bot isteği",
    "kap.tablo.korumasiz": "Korumasız",
    "kap.tablo.bosSonuc": "Filtreyle eşleşen endpoint yok.",
    "kap.tablo.botTrafigiYok": "Bot trafiği yok",

    // Genişletilmiş satır — karar kırılımı
    "kap.detay.kararKirilimi": "Karar kırılımı (tüm trafik)",
    "kap.detay.toplamIstek": "Toplam istek",
    "kap.detay.izinVerilen": "İzin verilen",
    "kap.detay.dogrulama": "Doğrulama (challenge)",
    "kap.detay.engellenen": "Engellenen",

    // Genişletilmiş satır — bot sınıfları
    "kap.detay.botSiniflari": "Bu uçtaki bot sınıfları",
    "kap.detay.botTrafigiYok": "Bu uçta korunması beklenen bot trafiği gözlenmedi.",

    // Genişletilmiş satır — aksiyon/yorum
    "kap.durum.saglikli": "Kapsam sağlıklı",
    "kap.durum.testEdilmedi": "Henüz test edilmedi",
    "kap.durum.bosluk": "Kapsam boşluğu",
    "kap.yorum.korunuyor":
      "Bot trafiğinin büyük çoğunluğu challenge/engelleme'ye takılıyor. Bu uçta widget fiilen devrede.",
    "kap.yorum.testEdilmedi":
      "Bu yola henüz korunması beklenen bot trafiği gelmedi. Kapsam bilinmiyor — 'güvenli' varsayma; kör nokta olabilir.",
    "kap.yorum.kismi":
      "Botların kayda değer bir bölümü hâlâ korumasız geçiyor. Kuralı sıkılaştır ya da eşiği düşür.",
    "kap.yorum.acik":
      "Botlar bu uçtan çoğunlukla korumasız geçiyor. Widget entegre değilse ekle; varsa path-tabanlı zorunlu doğrulama kuralı bağla.",

    // Dürüstlük / açıklayıcı notlar
    "kap.not.delikBaslik": "Kapsam deliği neden kritik?",
    "kap.not.delikMetin1": "Bir yola botlar geliyor ama verdict'lerin çoğu ",
    "kap.not.delikMetin2": " ise, widget o uçta fiilen devrede değildir (entegre edilmemiş, kural yok ya da yalnızca ",
    "kap.not.delikMetin3": " modu). Korumasız bir ",
    "kap.not.delikMetin4":
      " tüm ürünün sızdırdığı bir açıktır. Hassas + açık yollar önce kapatılmalıdır.",
    "kap.not.oranBaslik": "Koruma oranı nasıl hesaplanır?",
    "kap.not.oranMetin1": "Yola gelen bot isteğinin (human/good_bot hariç) ne kadarı fiilen ",
    "kap.not.oranMetin2": " + ",
    "kap.not.oranMetin3": " oldu: ",
    "kap.not.oranFormul": "koruma oranı = (challenge + engelleme) / bot isteği",
    "kap.not.oranMetin4":
      ". Kapsam yalnızca gözlemlenen gerçek trafikten çıkarılır; hiç bot görmemiş yol ",
    "kap.not.oranHenuz": "“henüz test edilmedi”",
    "kap.not.oranMetin5": "dir, ",
    "kap.not.oranGuvenliDegil": "güvenli değil",
    "kap.not.oranMetin6": ". Yollar gruplanırken query atılır ve ID'ler ",
    "kap.not.oranMetin7": " olarak toplanır.",

    // Kapsam durumu enum etiketleri (durumEtiket yeniden türetimi)
    "kap.durumEtiket.korunuyor": "Korunuyor",
    "kap.durumEtiket.kismi": "Kısmi",
    "kap.durumEtiket.acik": "Açık",
    "kap.durumEtiket.test_edilmedi": "Henüz test edilmedi",

    // Bot sınıfı enum etiketleri
    "kap.bot.human": "İnsan",
    "kap.bot.good_bot": "İyi bot",
    "kap.bot.automation": "Otomasyon",
    "kap.bot.scraper": "Kazıyıcı",
    "kap.bot.credential_stuffing": "Kimlik denemesi",
    "kap.bot.ai_agent": "AI ajanı",
    "kap.bot.ddos": "DDoS",
    "kap.bot.spam": "Spam",
  },

  en: {
    "kap.baslik": "Protection Coverage & Exposure Map",

    "kap.aciklama.baslik": "A protection product is only as strong as its coverage.",
    "kap.aciklama.p1": "This map measures ",
    "kap.aciklama.p1b": "how much of the bot traffic hitting each endpoint actually gets challenged/blocked",
    "kap.aciklama.p2": ". Paths where bots mostly ",
    "kap.aciklama.p2b": "pass unprotected (allowed)",
    "kap.aciklama.p3": " are each an ",
    "kap.aciklama.p3b": "exposure hole",
    "kap.aciklama.p4": " — an unprotected ",
    "kap.aciklama.p5": " is a leak across the whole product. Coverage is derived from real observed verdicts.",

    "kap.ozet.genelOran": "Overall coverage rate (weighted by bot volume)",
    "kap.ozet.korunanUc": "Protected endpoints",
    "kap.ozet.acikUc": "Open endpoints",
    "kap.ozet.acikUcKritik": "Open endpoints ({n} critical)",
    "kap.ozet.korumasizIstek": "Bot requests passing unprotected",

    "kap.gorsel.baslik": "Coverage visualization — protected vs open surface",
    "kap.gorsel.aciklama":
      "Distribution of monitored endpoints by coverage status. The red segment represents the exposure surface where bots pass unprotected.",
    "kap.gorsel.bosDurum": "No endpoints to classify yet.",

    "kap.delik.baslik": "Open holes — {n} endpoints leaking unprotected",
    "kap.delik.aciklamaOnce": "Bots reach these paths but mostly ",
    "kap.delik.aciklamaVurgu": "pass unprotected",
    "kap.delik.aciklamaSonra":
      ". The ones flagged critical are sensitive endpoints (login/auth/api/payment/admin) — close these first.",
    "kap.delik.botIstek": "bot requests passed unprotected · protection rate",
    "kap.delik.buYoluKoru": "Protect this path",
    "kap.delik.otoDuzeltme": "Auto-fix",

    "kap.rozet.hassas": "Sensitive",
    "kap.rozet.kritik": "Critical",

    "kap.filtre.ara": "Search endpoint… (e.g. /login, /api)",
    "kap.filtre.araEtiket": "Search endpoint",
    "kap.filtre.tumu": "All",
    "kap.filtre.acik": "Open",
    "kap.filtre.kismi": "Partial",
    "kap.filtre.korunuyor": "Protected",
    "kap.filtre.testEdilmedi": "Untested",
    "kap.filtre.yalnizHassas": "Sensitive paths only",

    "kap.tablo.baslik": "Coverage map — {n} endpoints",
    "kap.tablo.endpoint": "Endpoint",
    "kap.tablo.durum": "Status",
    "kap.tablo.kapsam": "Coverage (bot traffic)",
    "kap.tablo.koruma": "Protection",
    "kap.tablo.botIstegi": "Bot requests",
    "kap.tablo.korumasiz": "Unprotected",
    "kap.tablo.bosSonuc": "No endpoint matches the filter.",
    "kap.tablo.botTrafigiYok": "No bot traffic",

    "kap.detay.kararKirilimi": "Decision breakdown (all traffic)",
    "kap.detay.toplamIstek": "Total requests",
    "kap.detay.izinVerilen": "Allowed",
    "kap.detay.dogrulama": "Challenged",
    "kap.detay.engellenen": "Blocked",

    "kap.detay.botSiniflari": "Bot classes on this endpoint",
    "kap.detay.botTrafigiYok": "No bot traffic expected to be protected was observed on this endpoint.",

    "kap.durum.saglikli": "Coverage healthy",
    "kap.durum.testEdilmedi": "Not tested yet",
    "kap.durum.bosluk": "Coverage gap",
    "kap.yorum.korunuyor":
      "The vast majority of bot traffic is being challenged/blocked. The widget is actively in effect on this endpoint.",
    "kap.yorum.testEdilmedi":
      "No bot traffic expected to be protected has reached this path yet. Coverage is unknown — don't assume 'safe'; it may be a blind spot.",
    "kap.yorum.kismi":
      "A significant share of bots still pass unprotected. Tighten the rule or lower the threshold.",
    "kap.yorum.acik":
      "Bots mostly pass unprotected on this endpoint. Add the widget if it isn't integrated; if it is, attach a path-based mandatory verification rule.",

    "kap.not.delikBaslik": "Why is a coverage hole critical?",
    "kap.not.delikMetin1": "Bots reach a path but if most verdicts are ",
    "kap.not.delikMetin2": ", the widget isn't actually in effect there (not integrated, no rule, or only ",
    "kap.not.delikMetin3": " mode). An unprotected ",
    "kap.not.delikMetin4":
      " is a leak across the whole product. Sensitive + open paths must be closed first.",
    "kap.not.oranBaslik": "How is the protection rate computed?",
    "kap.not.oranMetin1": "Of the bot requests reaching a path (excluding human/good_bot), how many were actually ",
    "kap.not.oranMetin2": " + ",
    "kap.not.oranMetin3": ": ",
    "kap.not.oranFormul": "protection rate = (challenge + block) / bot requests",
    "kap.not.oranMetin4":
      ". Coverage is derived only from real observed traffic; a path that has seen no bots is ",
    "kap.not.oranHenuz": "“not tested yet”",
    "kap.not.oranMetin5": ", ",
    "kap.not.oranGuvenliDegil": "not safe",
    "kap.not.oranMetin6": ". When grouping paths, the query string is dropped and IDs are collapsed to ",
    "kap.not.oranMetin7": ".",

    "kap.durumEtiket.korunuyor": "Protected",
    "kap.durumEtiket.kismi": "Partial",
    "kap.durumEtiket.acik": "Open",
    "kap.durumEtiket.test_edilmedi": "Not tested yet",

    "kap.bot.human": "Human",
    "kap.bot.good_bot": "Good bot",
    "kap.bot.automation": "Automation",
    "kap.bot.scraper": "Scraper",
    "kap.bot.credential_stuffing": "Credential stuffing",
    "kap.bot.ai_agent": "AI agent",
    "kap.bot.ddos": "DDoS",
    "kap.bot.spam": "Spam",
  },

  de: {
    "kap.baslik": "Schutzabdeckung & Expositionskarte",

    "kap.aciklama.baslik": "Ein Schutzprodukt ist nur so stark wie seine Abdeckung.",
    "kap.aciklama.p1": "Diese Karte misst, ",
    "kap.aciklama.p1b": "wie viel des Bot-Verkehrs an jedem Endpunkt tatsächlich per Challenge/Blockierung erfasst wird",
    "kap.aciklama.p2": ". Pfade, an denen Bots meist ",
    "kap.aciklama.p2b": "ungeschützt durchkommen (allowed)",
    "kap.aciklama.p3": ", sind jeweils ein ",
    "kap.aciklama.p3b": "Expositionsloch",
    "kap.aciklama.p4": " — ein ungeschützter ",
    "kap.aciklama.p5": " ist ein Leck im gesamten Produkt. Die Abdeckung wird aus realen beobachteten Verdicts abgeleitet.",

    "kap.ozet.genelOran": "Gesamtabdeckungsrate (nach Bot-Volumen gewichtet)",
    "kap.ozet.korunanUc": "Geschützte Endpunkte",
    "kap.ozet.acikUc": "Offene Endpunkte",
    "kap.ozet.acikUcKritik": "Offene Endpunkte ({n} kritisch)",
    "kap.ozet.korumasizIstek": "Ungeschützt durchgelassene Bot-Anfragen",

    "kap.gorsel.baslik": "Abdeckungs-Visualisierung — geschützte vs. offene Oberfläche",
    "kap.gorsel.aciklama":
      "Verteilung der überwachten Endpunkte nach Abdeckungsstatus. Das rote Segment stellt die Expositionsfläche dar, an der Bots ungeschützt durchkommen.",
    "kap.gorsel.bosDurum": "Noch keine Endpunkte zu klassifizieren.",

    "kap.delik.baslik": "Offene Löcher — {n} Endpunkte lassen ungeschützt durch",
    "kap.delik.aciklamaOnce": "Bots erreichen diese Pfade, kommen aber meist ",
    "kap.delik.aciklamaVurgu": "ungeschützt durch",
    "kap.delik.aciklamaSonra":
      ". Die als kritisch markierten sind sensible Endpunkte (Login/Auth/API/Zahlung/Admin) — diese zuerst schließen.",
    "kap.delik.botIstek": "Bot-Anfragen kamen ungeschützt durch · Schutzrate",
    "kap.delik.buYoluKoru": "Diesen Pfad schützen",
    "kap.delik.otoDuzeltme": "Auto-Korrektur",

    "kap.rozet.hassas": "Sensibel",
    "kap.rozet.kritik": "Kritisch",

    "kap.filtre.ara": "Endpunkt suchen… (z. B. /login, /api)",
    "kap.filtre.araEtiket": "Endpunkt suchen",
    "kap.filtre.tumu": "Alle",
    "kap.filtre.acik": "Offen",
    "kap.filtre.kismi": "Teilweise",
    "kap.filtre.korunuyor": "Geschützt",
    "kap.filtre.testEdilmedi": "Ungetestet",
    "kap.filtre.yalnizHassas": "Nur sensible Pfade",

    "kap.tablo.baslik": "Abdeckungskarte — {n} Endpunkte",
    "kap.tablo.endpoint": "Endpunkt",
    "kap.tablo.durum": "Status",
    "kap.tablo.kapsam": "Abdeckung (Bot-Verkehr)",
    "kap.tablo.koruma": "Schutz",
    "kap.tablo.botIstegi": "Bot-Anfragen",
    "kap.tablo.korumasiz": "Ungeschützt",
    "kap.tablo.bosSonuc": "Kein Endpunkt entspricht dem Filter.",
    "kap.tablo.botTrafigiYok": "Kein Bot-Verkehr",

    "kap.detay.kararKirilimi": "Entscheidungsaufschlüsselung (gesamter Verkehr)",
    "kap.detay.toplamIstek": "Anfragen gesamt",
    "kap.detay.izinVerilen": "Zugelassen",
    "kap.detay.dogrulama": "Verifizierung (Challenge)",
    "kap.detay.engellenen": "Blockiert",

    "kap.detay.botSiniflari": "Bot-Klassen an diesem Endpunkt",
    "kap.detay.botTrafigiYok":
      "An diesem Endpunkt wurde kein zu schützender Bot-Verkehr beobachtet.",

    "kap.durum.saglikli": "Abdeckung gesund",
    "kap.durum.testEdilmedi": "Noch nicht getestet",
    "kap.durum.bosluk": "Abdeckungslücke",
    "kap.yorum.korunuyor":
      "Der Großteil des Bot-Verkehrs wird per Challenge/Blockierung erfasst. Das Widget ist an diesem Endpunkt aktiv.",
    "kap.yorum.testEdilmedi":
      "An diesem Pfad ist noch kein zu schützender Bot-Verkehr eingegangen. Abdeckung unbekannt — nicht als 'sicher' annehmen; es kann ein blinder Fleck sein.",
    "kap.yorum.kismi":
      "Ein erheblicher Anteil der Bots kommt weiterhin ungeschützt durch. Regel verschärfen oder Schwellenwert senken.",
    "kap.yorum.acik":
      "Bots kommen an diesem Endpunkt meist ungeschützt durch. Widget einbinden, falls nicht integriert; falls doch, eine pfadbasierte Pflicht-Verifizierungsregel anhängen.",

    "kap.not.delikBaslik": "Warum ist ein Abdeckungsloch kritisch?",
    "kap.not.delikMetin1": "Bots erreichen einen Pfad, aber wenn die meisten Verdicts ",
    "kap.not.delikMetin2": " lauten, ist das Widget dort nicht wirklich aktiv (nicht integriert, keine Regel oder nur ",
    "kap.not.delikMetin3": "-Modus). Ein ungeschützter ",
    "kap.not.delikMetin4":
      " ist ein Leck im gesamten Produkt. Sensible + offene Pfade müssen zuerst geschlossen werden.",
    "kap.not.oranBaslik": "Wie wird die Schutzrate berechnet?",
    "kap.not.oranMetin1": "Von den einen Pfad erreichenden Bot-Anfragen (ohne human/good_bot), wie viele wurden tatsächlich ",
    "kap.not.oranMetin2": " + ",
    "kap.not.oranMetin3": ": ",
    "kap.not.oranFormul": "Schutzrate = (Challenge + Blockierung) / Bot-Anfragen",
    "kap.not.oranMetin4":
      ". Die Abdeckung wird nur aus real beobachtetem Verkehr abgeleitet; ein Pfad ohne Bots ist ",
    "kap.not.oranHenuz": "„noch nicht getestet“",
    "kap.not.oranMetin5": ", ",
    "kap.not.oranGuvenliDegil": "nicht sicher",
    "kap.not.oranMetin6": ". Beim Gruppieren der Pfade wird der Query-String entfernt und IDs werden zu ",
    "kap.not.oranMetin7": " zusammengefasst.",

    "kap.durumEtiket.korunuyor": "Geschützt",
    "kap.durumEtiket.kismi": "Teilweise",
    "kap.durumEtiket.acik": "Offen",
    "kap.durumEtiket.test_edilmedi": "Noch nicht getestet",

    "kap.bot.human": "Mensch",
    "kap.bot.good_bot": "Guter Bot",
    "kap.bot.automation": "Automatisierung",
    "kap.bot.scraper": "Scraper",
    "kap.bot.credential_stuffing": "Credential Stuffing",
    "kap.bot.ai_agent": "KI-Agent",
    "kap.bot.ddos": "DDoS",
    "kap.bot.spam": "Spam",
  },

  fr: {
    "kap.baslik": "Couverture de protection & carte d'exposition",

    "kap.aciklama.baslik": "Un produit de protection ne vaut que sa couverture.",
    "kap.aciklama.p1": "Cette carte mesure ",
    "kap.aciklama.p1b": "quelle part du trafic de bots atteignant chaque endpoint est réellement soumise à un challenge/blocage",
    "kap.aciklama.p2": ". Les chemins où les bots ",
    "kap.aciklama.p2b": "passent le plus souvent sans protection (allowed)",
    "kap.aciklama.p3": " constituent chacun un ",
    "kap.aciklama.p3b": "trou d'exposition",
    "kap.aciklama.p4": " — un ",
    "kap.aciklama.p5": " non protégé est une fuite pour tout le produit. La couverture est déduite des verdicts réels observés.",

    "kap.ozet.genelOran": "Taux de couverture global (pondéré par le volume de bots)",
    "kap.ozet.korunanUc": "Endpoints protégés",
    "kap.ozet.acikUc": "Endpoints ouverts",
    "kap.ozet.acikUcKritik": "Endpoints ouverts ({n} critiques)",
    "kap.ozet.korumasizIstek": "Requêtes de bots passant sans protection",

    "kap.gorsel.baslik": "Visualisation de la couverture — surface protégée vs ouverte",
    "kap.gorsel.aciklama":
      "Répartition des endpoints surveillés selon l'état de couverture. Le segment rouge représente la surface d'exposition où les bots passent sans protection.",
    "kap.gorsel.bosDurum": "Aucun endpoint à classer pour le moment.",

    "kap.delik.baslik": "Trous ouverts — {n} endpoints laissent fuir sans protection",
    "kap.delik.aciklamaOnce": "Les bots atteignent ces chemins mais ",
    "kap.delik.aciklamaVurgu": "passent le plus souvent sans protection",
    "kap.delik.aciklamaSonra":
      ". Ceux marqués critiques sont des endpoints sensibles (login/auth/api/paiement/admin) — fermez-les en premier.",
    "kap.delik.botIstek": "requêtes de bots passées sans protection · taux de protection",
    "kap.delik.buYoluKoru": "Protéger ce chemin",
    "kap.delik.otoDuzeltme": "Correction auto",

    "kap.rozet.hassas": "Sensible",
    "kap.rozet.kritik": "Critique",

    "kap.filtre.ara": "Rechercher un endpoint… (ex. /login, /api)",
    "kap.filtre.araEtiket": "Rechercher un endpoint",
    "kap.filtre.tumu": "Tous",
    "kap.filtre.acik": "Ouvert",
    "kap.filtre.kismi": "Partiel",
    "kap.filtre.korunuyor": "Protégé",
    "kap.filtre.testEdilmedi": "Non testé",
    "kap.filtre.yalnizHassas": "Chemins sensibles uniquement",

    "kap.tablo.baslik": "Carte de couverture — {n} endpoints",
    "kap.tablo.endpoint": "Endpoint",
    "kap.tablo.durum": "État",
    "kap.tablo.kapsam": "Couverture (trafic de bots)",
    "kap.tablo.koruma": "Protection",
    "kap.tablo.botIstegi": "Requêtes de bots",
    "kap.tablo.korumasiz": "Sans protection",
    "kap.tablo.bosSonuc": "Aucun endpoint ne correspond au filtre.",
    "kap.tablo.botTrafigiYok": "Aucun trafic de bots",

    "kap.detay.kararKirilimi": "Ventilation des décisions (tout le trafic)",
    "kap.detay.toplamIstek": "Requêtes totales",
    "kap.detay.izinVerilen": "Autorisées",
    "kap.detay.dogrulama": "Vérification (challenge)",
    "kap.detay.engellenen": "Bloquées",

    "kap.detay.botSiniflari": "Classes de bots sur cet endpoint",
    "kap.detay.botTrafigiYok":
      "Aucun trafic de bots à protéger n'a été observé sur cet endpoint.",

    "kap.durum.saglikli": "Couverture saine",
    "kap.durum.testEdilmedi": "Pas encore testé",
    "kap.durum.bosluk": "Lacune de couverture",
    "kap.yorum.korunuyor":
      "La grande majorité du trafic de bots est soumise à un challenge/blocage. Le widget est réellement actif sur cet endpoint.",
    "kap.yorum.testEdilmedi":
      "Aucun trafic de bots à protéger n'a encore atteint ce chemin. Couverture inconnue — ne présumez pas « sûr » ; ce peut être un angle mort.",
    "kap.yorum.kismi":
      "Une part notable de bots passe encore sans protection. Renforcez la règle ou abaissez le seuil.",
    "kap.yorum.acik":
      "Les bots passent le plus souvent sans protection sur cet endpoint. Ajoutez le widget s'il n'est pas intégré ; s'il l'est, attachez une règle de vérification obligatoire basée sur le chemin.",

    "kap.not.delikBaslik": "Pourquoi un trou de couverture est-il critique ?",
    "kap.not.delikMetin1": "Des bots atteignent un chemin, mais si la plupart des verdicts sont ",
    "kap.not.delikMetin2": ", le widget n'y est pas réellement actif (non intégré, aucune règle, ou seulement mode ",
    "kap.not.delikMetin3": "). Un ",
    "kap.not.delikMetin4":
      " non protégé est une fuite pour tout le produit. Les chemins sensibles + ouverts doivent être fermés en premier.",
    "kap.not.oranBaslik": "Comment le taux de protection est-il calculé ?",
    "kap.not.oranMetin1": "Sur les requêtes de bots atteignant un chemin (hors human/good_bot), combien ont réellement été ",
    "kap.not.oranMetin2": " + ",
    "kap.not.oranMetin3": " : ",
    "kap.not.oranFormul": "taux de protection = (challenge + blocage) / requêtes de bots",
    "kap.not.oranMetin4":
      ". La couverture est déduite uniquement du trafic réel observé ; un chemin n'ayant vu aucun bot est ",
    "kap.not.oranHenuz": "« pas encore testé »",
    "kap.not.oranMetin5": ", ",
    "kap.not.oranGuvenliDegil": "non sûr",
    "kap.not.oranMetin6": ". Lors du regroupement des chemins, la chaîne de requête est retirée et les ID sont réduits à ",
    "kap.not.oranMetin7": ".",

    "kap.durumEtiket.korunuyor": "Protégé",
    "kap.durumEtiket.kismi": "Partiel",
    "kap.durumEtiket.acik": "Ouvert",
    "kap.durumEtiket.test_edilmedi": "Pas encore testé",

    "kap.bot.human": "Humain",
    "kap.bot.good_bot": "Bon bot",
    "kap.bot.automation": "Automatisation",
    "kap.bot.scraper": "Scraper",
    "kap.bot.credential_stuffing": "Bourrage d'identifiants",
    "kap.bot.ai_agent": "Agent IA",
    "kap.bot.ddos": "DDoS",
    "kap.bot.spam": "Spam",
  },

  es: {
    "kap.baslik": "Cobertura de protección y mapa de exposición",

    "kap.aciklama.baslik": "Un producto de protección solo es tan fuerte como su cobertura.",
    "kap.aciklama.p1": "Este mapa mide ",
    "kap.aciklama.p1b": "cuánto del tráfico de bots que llega a cada endpoint queda realmente sometido a desafío/bloqueo",
    "kap.aciklama.p2": ". Las rutas donde los bots ",
    "kap.aciklama.p2b": "pasan mayormente sin protección (allowed)",
    "kap.aciklama.p3": " son cada una un ",
    "kap.aciklama.p3b": "agujero de exposición",
    "kap.aciklama.p4": " — un ",
    "kap.aciklama.p5": " sin proteger es una fuga para todo el producto. La cobertura se deriva de los verdicts reales observados.",

    "kap.ozet.genelOran": "Tasa de cobertura global (ponderada por volumen de bots)",
    "kap.ozet.korunanUc": "Endpoints protegidos",
    "kap.ozet.acikUc": "Endpoints abiertos",
    "kap.ozet.acikUcKritik": "Endpoints abiertos ({n} críticos)",
    "kap.ozet.korumasizIstek": "Solicitudes de bots que pasan sin protección",

    "kap.gorsel.baslik": "Visualización de cobertura — superficie protegida vs abierta",
    "kap.gorsel.aciklama":
      "Distribución de los endpoints monitoreados según el estado de cobertura. El segmento rojo representa la superficie de exposición donde los bots pasan sin protección.",
    "kap.gorsel.bosDurum": "Aún no hay endpoints que clasificar.",

    "kap.delik.baslik": "Agujeros abiertos — {n} endpoints filtran sin protección",
    "kap.delik.aciklamaOnce": "Los bots llegan a estas rutas pero ",
    "kap.delik.aciklamaVurgu": "pasan mayormente sin protección",
    "kap.delik.aciklamaSonra":
      ". Los marcados como críticos son endpoints sensibles (login/auth/api/pago/admin) — ciérralos primero.",
    "kap.delik.botIstek": "solicitudes de bots pasaron sin protección · tasa de protección",
    "kap.delik.buYoluKoru": "Proteger esta ruta",
    "kap.delik.otoDuzeltme": "Corrección automática",

    "kap.rozet.hassas": "Sensible",
    "kap.rozet.kritik": "Crítico",

    "kap.filtre.ara": "Buscar endpoint… (p. ej. /login, /api)",
    "kap.filtre.araEtiket": "Buscar endpoint",
    "kap.filtre.tumu": "Todos",
    "kap.filtre.acik": "Abierto",
    "kap.filtre.kismi": "Parcial",
    "kap.filtre.korunuyor": "Protegido",
    "kap.filtre.testEdilmedi": "Sin probar",
    "kap.filtre.yalnizHassas": "Solo rutas sensibles",

    "kap.tablo.baslik": "Mapa de cobertura — {n} endpoints",
    "kap.tablo.endpoint": "Endpoint",
    "kap.tablo.durum": "Estado",
    "kap.tablo.kapsam": "Cobertura (tráfico de bots)",
    "kap.tablo.koruma": "Protección",
    "kap.tablo.botIstegi": "Solicitudes de bots",
    "kap.tablo.korumasiz": "Sin protección",
    "kap.tablo.bosSonuc": "Ningún endpoint coincide con el filtro.",
    "kap.tablo.botTrafigiYok": "Sin tráfico de bots",

    "kap.detay.kararKirilimi": "Desglose de decisiones (todo el tráfico)",
    "kap.detay.toplamIstek": "Solicitudes totales",
    "kap.detay.izinVerilen": "Permitidas",
    "kap.detay.dogrulama": "Verificación (challenge)",
    "kap.detay.engellenen": "Bloqueadas",

    "kap.detay.botSiniflari": "Clases de bots en este endpoint",
    "kap.detay.botTrafigiYok":
      "No se observó tráfico de bots que debiera protegerse en este endpoint.",

    "kap.durum.saglikli": "Cobertura saludable",
    "kap.durum.testEdilmedi": "Aún sin probar",
    "kap.durum.bosluk": "Brecha de cobertura",
    "kap.yorum.korunuyor":
      "La gran mayoría del tráfico de bots queda sometido a desafío/bloqueo. El widget está realmente activo en este endpoint.",
    "kap.yorum.testEdilmedi":
      "Aún no ha llegado a esta ruta tráfico de bots que debiera protegerse. Cobertura desconocida — no asumas 'seguro'; puede ser un punto ciego.",
    "kap.yorum.kismi":
      "Una parte notable de los bots sigue pasando sin protección. Endurece la regla o baja el umbral.",
    "kap.yorum.acik":
      "Los bots pasan mayormente sin protección en este endpoint. Añade el widget si no está integrado; si lo está, adjunta una regla de verificación obligatoria basada en la ruta.",

    "kap.not.delikBaslik": "¿Por qué es crítico un agujero de cobertura?",
    "kap.not.delikMetin1": "Los bots llegan a una ruta pero si la mayoría de los verdicts son ",
    "kap.not.delikMetin2": ", el widget no está realmente activo ahí (no integrado, sin regla, o solo modo ",
    "kap.not.delikMetin3": "). Un ",
    "kap.not.delikMetin4":
      " sin proteger es una fuga para todo el producto. Las rutas sensibles + abiertas deben cerrarse primero.",
    "kap.not.oranBaslik": "¿Cómo se calcula la tasa de protección?",
    "kap.not.oranMetin1": "De las solicitudes de bots que llegan a una ruta (excluyendo human/good_bot), cuántas fueron realmente ",
    "kap.not.oranMetin2": " + ",
    "kap.not.oranMetin3": ": ",
    "kap.not.oranFormul": "tasa de protección = (challenge + bloqueo) / solicitudes de bots",
    "kap.not.oranMetin4":
      ". La cobertura se deriva solo del tráfico real observado; una ruta que no ha visto bots está ",
    "kap.not.oranHenuz": "«aún sin probar»",
    "kap.not.oranMetin5": ", ",
    "kap.not.oranGuvenliDegil": "no segura",
    "kap.not.oranMetin6": ". Al agrupar las rutas se descarta la query y los ID se colapsan a ",
    "kap.not.oranMetin7": ".",

    "kap.durumEtiket.korunuyor": "Protegido",
    "kap.durumEtiket.kismi": "Parcial",
    "kap.durumEtiket.acik": "Abierto",
    "kap.durumEtiket.test_edilmedi": "Aún sin probar",

    "kap.bot.human": "Humano",
    "kap.bot.good_bot": "Bot bueno",
    "kap.bot.automation": "Automatización",
    "kap.bot.scraper": "Scraper",
    "kap.bot.credential_stuffing": "Relleno de credenciales",
    "kap.bot.ai_agent": "Agente de IA",
    "kap.bot.ddos": "DDoS",
    "kap.bot.spam": "Spam",
  },
};

/** Bu sayfaya özgü çeviri anahtarını çöz (TR yedeğiyle). */
export function kapsamCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
