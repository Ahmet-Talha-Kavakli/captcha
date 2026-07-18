import type { Dil } from "@/lib/i18n/panel";

/**
 * Hız & Kota Politikası sayfasına özel i18n sözlüğü (yalnızca bu modül kullanır).
 * "rp." namespace'li anahtarlar. Doğal/native çeviriler; veri (sayı, endpoint,
 * limit, para) çevrilmez.
 * TR kaynak/otorite; anahtar bulunamazsa TR'ye, o da yoksa anahtarın kendisine düşer.
 * Enum güvenliği: aksiyon (yavaslat/challenge/engelle), aşım davranışı
 * (block/overage) ve kademe anahtarı (gevsek/dengeli/siki/cok-siki) lib'den enum
 * gelir; GÖRÜNEN metin burada anahtar-eşlemeyle (rp.aksiyon.* / rp.kademe.* …)
 * çevrilir, ham enum değeri değil.
 */
const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // --- aksiyon (enum → etiket) ---
    "rp.aksiyon.yavaslat": "Yavaşlat",
    "rp.aksiyon.challenge": "Challenge",
    "rp.aksiyon.engelle": "Engelle",
    // --- kademe adı (enum → etiket) ---
    "rp.kademe.gevsek": "Gevşek",
    "rp.kademe.dengeli": "Dengeli",
    "rp.kademe.siki": "Sıkı",
    "rp.kademe.cok-siki": "Çok sıkı",
    // --- kademe açıklaması (enum → metin) ---
    "rp.kademeAciklama.gevsek":
      "Yüksek meşru trafik (kampanya, API entegrasyonu). Yalnızca aşırı sel durdurulur.",
    "rp.kademeAciklama.dengeli":
      "Çoğu üretim sitesi için varsayılan denge: meşru zirveleri boğmadan kötüye kullanımı kırar.",
    "rp.kademeAciklama.siki":
      "Hassas uçlar (giriş, ödeme, OTP). Otomasyon ve kaba-kuvvet için düşük tolerans.",
    "rp.kademeAciklama.cok-siki":
      "Kritik/az-trafikli uçlar. Limit aşan her istek doğrudan engellenir.",
    // --- giriş bandı ---
    "rp.giris.baslik": "Kapasite ve kötüye kullanım koruması, tek konsolda.",

    // --- Görsel: kapasite gauge + limit dağılım ---
    "rp.kapasite.baslik": "Kademe kapasite kullanımı",
    "rp.kapasite.metin": "Gözlemlenen tepe trafik ({rps}/sn ≈ {dk}/dk) her kademe limitinin ne kadarını dolduruyor.",
    "rp.kapasite.dolu": "dolu",
    "rp.dagilim.baslik": "Limit dağılımı",
    "rp.dagilim.metin": "Kademeler arası dakikalık istek limitinin görece büyüklüğü.",
    "rp.dagilim.onerilen": "Önerilen",
    "rp.dagilim.diger": "Diğer",
    "rp.giris.metin":
      "Hız-limiti kademelerini simüle et, meşru zirveyi boğmadan seli durduran ayarı seç; kotanın ne zaman biteceğini ve dolduğunda ne olacağını (red mi, fazla-kullanım mı) önceden gör.",
    // --- özet istatistikler ---
    "rp.birim.sn": "sn",
    "rp.kart.tepeTrafik": "Gözlemlenen tepe trafik",
    "rp.kart.kotaKullanim": "Kota kullanımı",
    "rp.kart.tukenisKalan": "Kota tükenişine kalan",
    "rp.kart.gunBirim": "{n} gün",
    "rp.kart.asimDavranis": "Kota aşım davranışı",
    "rp.deger.fazlaKullanim": "Fazla-kullanım",
    "rp.deger.red429": "Red (429)",
    // --- BÖLÜM 1: kademeler ---
    "rp.kademeler.baslik": "Hız limiti kademeleri",
    "rp.kademeler.metin":
      "Dakika başına istek limiti, kayan pencere ve limit aşımında uygulanacak aksiyon. Gözlemlenen tepe trafiğe göre",
    "rp.kademeler.onerilenVurgu": "önerilen",
    "rp.kademeler.metinSon": "kademe işaretlidir.",
    "rp.kademeler.onerilenRozet": "Önerilen",
    "rp.kademeler.istekDk": "istek/dk",
    "rp.kademeler.pencere": "Kayan pencere: {n} sn",
    "rp.kademeler.oneriGerekceBaslik": "Öneri gerekçesi",
    // --- öneri gerekçesi (lib TR metni yerine client'ta yeniden türetilir) ---
    "rp.oneriGerekce.trafikYok":
      "Anlamlı trafik gözlenmedi; kötüye kullanıma karşı sağlam bir varsayılan olarak sıkı kademe önerildi.",
    "rp.oneriGerekce.var":
      "Gözlemlenen tepe {rps} istek/sn (~{dk} istek/dk). Meşru zirveyi boğmamak için 2x baş-boşluk bırakıldı; bu yükü karşılayan en sıkı kademe \"{kademe}\".",
    // --- aşım davranışı açıklaması (lib TR metni yerine client'ta yeniden türetilir) ---
    "rp.asimAciklama.block":
      "Kota dolduğunda fazla istekler REDDEDİLİR (HTTP 429). Doğrulama durur; koruma pasifleşmez ama yeni challenge üretilmez. Plan yükseltilmeli.",
    "rp.asimAciklama.overage":
      "Kota dolduğunda hizmet KESİLMEZ; fazla kullanım (overage) faturaya eklenir. Kesintisiz koruma sürer.",
    // --- Simülatör ---
    "rp.sim.baslik": "Canlı hız-limiti simülatörü",
    "rp.sim.metin":
      "Gelen tepe trafiği ayarla; her kademenin bu 10 saniyelik patlamada kaç isteği geçireceğini, kaçını kısıtlayacağını canlı gör. Bu, politikanın gerçekten çalıştığını kanıtlar.",
    "rp.sim.gelenTrafik": "Gelen tepe trafik",
    "rp.sim.istekSn": "istek/sn",
    "rp.sim.sakin": "5/sn (sakin)",
    "rp.sim.orta": "250/sn",
    "rp.sim.sel": "500/sn (sel)",
    "rp.sim.serpme": "{i}. sn: {n} istek",
    "rp.sim.seriNot": "Sentetik 10 sn patlama serisi (ortada zirve). Toplam {n} istek.",
    "rp.sim.gecen": "Geçen",
    "rp.sim.kisitlamaOrani": "Kısıtlama oranı",
    "rp.sim.ariaGelen": "Gelen tepe trafik (istek/sn)",
    "rp.sim.nasilOkunurBaslik": "Nasıl okunur",
    "rp.sim.nasilOkunur1":
      "Düşük trafikte tüm kademeler isteği geçirir (kısıtlama yok). Trafik zirve yapınca sıkı kademeler önce devreye girer: meşru kullanıcıyı boğmadan otomasyon selini kırmak için doğru kademeyi seçin. Aksiyon",
    "rp.sim.nasilOkunur2":
      "arasında değişir — reddetmek yerine challenge sunmak meşru kullanıcı için daha güvenlidir.",
    // --- BÖLÜM 2: kota aşım politikası ---
    "rp.kota.baslik": "Kota aşım politikası — {plan} planı",
    "rp.kota.donemKullanilan": "Bu dönem kullanılan doğrulama",
    "rp.kota.kullanildi": "%{pct} kullanıldı",
    "rp.kota.kalan": "Kalan: {n}",
    "rp.kota.gunlukOrt": "Günlük ort: {n}",
    "rp.kota.tahminiTukenis": "Tahmini tükeniş",
    "rp.kota.tukenmez": "Tükenmez",
    "rp.kota.kotaDolu": "Kota dolu",
    "rp.kota.gun": "{n} gün",
    "rp.kota.tukenmezMetin": "Mevcut kullanım hızıyla dönem kotası tükenmiyor.",
    "rp.kota.tukenisMetin":
      "Günlük ortalama kullanım hızı sabit kalırsa, kotanın biteceği tahmini gün.",
    "rp.kota.dolunca": "Dolunca ne olur?",
    "rp.kota.fazlaKullanimUcret": "Fazla-kullanım ücreti",
    "rp.kota.istekRed": "İstekler reddedilir (429)",
    "rp.kota.projBaslik": "Ay sonu projeksiyonu: kotayı",
    "rp.kota.projIstekAsar": "istek aşacaksınız.",
    "rp.kota.tahminiEkFatura": "Tahmini ek fatura:",
    "rp.kota.birimNot": "(1000 istek başına ₺2).",
    "rp.kota.reddedilecek": "Bu istekler reddedilecek — planı yükseltmeyi düşünün.",
    // --- plan karşılaştırma ---
    "rp.plan.baslik": "Planlara göre aşım davranışı",
    "rp.plan.mevcut": "Mevcut",
    "rp.plan.aylik": "{n} / ay",
    "rp.plan.fazlaKullanim": "Fazla-kullanım",
    "rp.plan.red429": "Red (429)",
    "rp.plan.not":
      "Fazla-kullanım planlarında kota dolsa da koruma kesintisiz sürer; aşım faturaya eklenir. Red planlarında kota dolunca yeni doğrulama üretilmez.",
    // --- BÖLÜM 3: kullanım-kota grafiği ---
    "rp.grafik.baslik": "Günlük kullanım — kota tavanı (son 14 gün)",
    "rp.grafik.metinBas": "Günlük doğrulama kullanımı (mavi) ile günlük kota tavanı (kesik gri:",
    "rp.grafik.metinSon":
      "/gün) karşılaştırması. Kullanım çizgisi tavanı aşan günlerde kota baskısı vardır.",
    "rp.grafik.seriKullanim": "Günlük kullanım",
    "rp.grafik.seriTavan": "Günlük kota tavanı",
    // --- dürüst not + özel limit ipucu ---
    "rp.not.temsili": "temsili hazır ayarlardır",
    "rp.not.metin1": "Hız-limiti kademeleri",
    "rp.not.metin2": "Site-başına özel limitler ileride kural motoruyla yapılandırılabilir —",
    "rp.not.kurallar": "Kurallar",
    "rp.not.metin3": "modülünde",
    "rp.not.metin4": "alanlı bir kural zaten mevcut.",
    "rp.not.siteVar": "Şu an {n} siteniz var.",
    "rp.ipucu.baslik": "Site-başına özel hız kuralı ekle",
    "rp.ipucu.metinBas": "koşullu kural ile hassas uçları koru.",
    "rp.ipucu.buton": "Kurallara git",
  },
  en: {
    "rp.aksiyon.yavaslat": "Throttle",
    "rp.aksiyon.challenge": "Challenge",
    "rp.aksiyon.engelle": "Block",
    "rp.kademe.gevsek": "Loose",
    "rp.kademe.dengeli": "Balanced",
    "rp.kademe.siki": "Strict",
    "rp.kademe.cok-siki": "Very strict",
    "rp.kademeAciklama.gevsek":
      "High legitimate traffic (campaigns, API integrations). Only extreme floods are stopped.",
    "rp.kademeAciklama.dengeli":
      "The default balance for most production sites: breaks abuse without choking legitimate peaks.",
    "rp.kademeAciklama.siki":
      "Sensitive endpoints (login, payment, OTP). Low tolerance for automation and brute force.",
    "rp.kademeAciklama.cok-siki":
      "Critical/low-traffic endpoints. Every request over the limit is blocked outright.",
    "rp.giris.baslik": "Capacity and abuse protection, in one console.",

    // --- Visual: capacity gauge + limit distribution ---
    "rp.kapasite.baslik": "Tier capacity usage",
    "rp.kapasite.metin": "How much of each tier limit the observed peak traffic ({rps}/s ≈ {dk}/min) fills.",
    "rp.kapasite.dolu": "full",
    "rp.dagilim.baslik": "Limit distribution",
    "rp.dagilim.metin": "Relative size of per-minute request limits across tiers.",
    "rp.dagilim.onerilen": "Recommended",
    "rp.dagilim.diger": "Other",
    "rp.giris.metin":
      "Simulate rate-limit tiers and pick the setting that stops the flood without choking legitimate peaks; see in advance when your quota will run out and what happens when it does (rejection or overage).",
    "rp.birim.sn": "s",
    "rp.kart.tepeTrafik": "Observed peak traffic",
    "rp.kart.kotaKullanim": "Quota usage",
    "rp.kart.tukenisKalan": "Time to quota depletion",
    "rp.kart.gunBirim": "{n} days",
    "rp.kart.asimDavranis": "Quota overage behavior",
    "rp.deger.fazlaKullanim": "Overage",
    "rp.deger.red429": "Reject (429)",
    "rp.kademeler.baslik": "Rate-limit tiers",
    "rp.kademeler.metin":
      "Requests-per-minute limit, sliding window and the action applied on limit breach. Based on observed peak traffic, the",
    "rp.kademeler.onerilenVurgu": "recommended",
    "rp.kademeler.metinSon": "tier is marked.",
    "rp.kademeler.onerilenRozet": "Recommended",
    "rp.kademeler.istekDk": "req/min",
    "rp.kademeler.pencere": "Sliding window: {n} s",
    "rp.kademeler.oneriGerekceBaslik": "Recommendation rationale",
    "rp.oneriGerekce.trafikYok":
      "No meaningful traffic was observed; a strict tier is recommended as a solid default against abuse.",
    "rp.oneriGerekce.var":
      "Observed peak {rps} req/s (~{dk} req/min). A 2x headroom was left to avoid choking the legitimate peak; the strictest tier that handles this load is \"{kademe}\".",
    "rp.asimAciklama.block":
      "When the quota is full, excess requests are REJECTED (HTTP 429). Verification stops; protection is not disabled but no new challenges are issued. The plan should be upgraded.",
    "rp.asimAciklama.overage":
      "When the quota is full, service is NOT cut off; overage is added to the bill. Uninterrupted protection continues.",
    "rp.sim.baslik": "Live rate-limit simulator",
    "rp.sim.metin":
      "Adjust incoming peak traffic; watch live how many requests each tier lets through and throttles during this 10-second burst. This proves the policy actually works.",
    "rp.sim.gelenTrafik": "Incoming peak traffic",
    "rp.sim.istekSn": "req/s",
    "rp.sim.sakin": "5/s (calm)",
    "rp.sim.orta": "250/s",
    "rp.sim.sel": "500/s (flood)",
    "rp.sim.serpme": "s {i}: {n} requests",
    "rp.sim.seriNot": "Synthetic 10 s burst series (peak in the middle). Total {n} requests.",
    "rp.sim.gecen": "Passed",
    "rp.sim.kisitlamaOrani": "Throttle rate",
    "rp.sim.ariaGelen": "Incoming peak traffic (req/s)",
    "rp.sim.nasilOkunurBaslik": "How to read this",
    "rp.sim.nasilOkunur1":
      "At low traffic every tier lets requests through (no throttling). When traffic peaks, strict tiers engage first: pick the right tier to break the automation flood without choking legitimate users. The action ranges among",
    "rp.sim.nasilOkunur2":
      "— offering a challenge instead of rejecting is safer for legitimate users.",
    "rp.kota.baslik": "Quota overage policy — {plan} plan",
    "rp.kota.donemKullanilan": "Verifications used this period",
    "rp.kota.kullanildi": "{pct}% used",
    "rp.kota.kalan": "Remaining: {n}",
    "rp.kota.gunlukOrt": "Daily avg: {n}",
    "rp.kota.tahminiTukenis": "Estimated depletion",
    "rp.kota.tukenmez": "Never depletes",
    "rp.kota.kotaDolu": "Quota full",
    "rp.kota.gun": "{n} days",
    "rp.kota.tukenmezMetin": "At the current usage rate the period quota does not run out.",
    "rp.kota.tukenisMetin":
      "The estimated day the quota runs out if the daily average usage rate stays constant.",
    "rp.kota.dolunca": "What happens when it's full?",
    "rp.kota.fazlaKullanimUcret": "Overage charge",
    "rp.kota.istekRed": "Requests rejected (429)",
    "rp.kota.projBaslik": "End-of-month projection: you will exceed the quota by",
    "rp.kota.projIstekAsar": "requests.",
    "rp.kota.tahminiEkFatura": "Estimated extra bill:",
    "rp.kota.birimNot": "(₺2 per 1000 requests).",
    "rp.kota.reddedilecek": "These requests will be rejected — consider upgrading your plan.",
    "rp.plan.baslik": "Overage behavior by plan",
    "rp.plan.mevcut": "Current",
    "rp.plan.aylik": "{n} / month",
    "rp.plan.fazlaKullanim": "Overage",
    "rp.plan.red429": "Reject (429)",
    "rp.plan.not":
      "On overage plans, protection continues uninterrupted even when the quota is full; the excess is added to the bill. On reject plans, no new verifications are issued once the quota is full.",
    "rp.grafik.baslik": "Daily usage — quota ceiling (last 14 days)",
    "rp.grafik.metinBas": "Comparison of daily verification usage (blue) with the daily quota ceiling (dashed gray:",
    "rp.grafik.metinSon":
      "/day). On days the usage line exceeds the ceiling there is quota pressure.",
    "rp.grafik.seriKullanim": "Daily usage",
    "rp.grafik.seriTavan": "Daily quota ceiling",
    "rp.not.temsili": "are representative presets",
    "rp.not.metin1": "The rate-limit tiers",
    "rp.not.metin2": "Per-site custom limits can be configured with the rule engine later —",
    "rp.not.kurallar": "Rules",
    "rp.not.metin3": "module already has a rule with a",
    "rp.not.metin4": "field.",
    "rp.not.siteVar": "You currently have {n} sites.",
    "rp.ipucu.baslik": "Add a per-site custom rate rule",
    "rp.ipucu.metinBas": "conditional rule to protect sensitive endpoints.",
    "rp.ipucu.buton": "Go to Rules",
  },
  de: {
    "rp.aksiyon.yavaslat": "Drosseln",
    "rp.aksiyon.challenge": "Challenge",
    "rp.aksiyon.engelle": "Blockieren",
    "rp.kademe.gevsek": "Locker",
    "rp.kademe.dengeli": "Ausgewogen",
    "rp.kademe.siki": "Streng",
    "rp.kademe.cok-siki": "Sehr streng",
    "rp.kademeAciklama.gevsek":
      "Hoher legitimer Traffic (Kampagnen, API-Integrationen). Nur extreme Fluten werden gestoppt.",
    "rp.kademeAciklama.dengeli":
      "Die Standardbalance für die meisten Produktionssites: bricht Missbrauch, ohne legitime Spitzen zu ersticken.",
    "rp.kademeAciklama.siki":
      "Sensible Endpunkte (Login, Zahlung, OTP). Geringe Toleranz für Automatisierung und Brute Force.",
    "rp.kademeAciklama.cok-siki":
      "Kritische/traffic-arme Endpunkte. Jede Anfrage über dem Limit wird direkt blockiert.",
    "rp.giris.baslik": "Kapazitäts- und Missbrauchsschutz in einer Konsole.",

    // --- Visuell: Kapazitätsanzeige + Limitverteilung ---
    "rp.kapasite.baslik": "Stufen-Kapazitätsauslastung",
    "rp.kapasite.metin": "Wie viel des jeweiligen Stufenlimits der beobachtete Spitzenverkehr ({rps}/s ≈ {dk}/Min.) ausfüllt.",
    "rp.kapasite.dolu": "voll",
    "rp.dagilim.baslik": "Limitverteilung",
    "rp.dagilim.metin": "Relative Größe der Anfragelimits pro Minute über die Stufen hinweg.",
    "rp.dagilim.onerilen": "Empfohlen",
    "rp.dagilim.diger": "Andere",
    "rp.giris.metin":
      "Simuliere Rate-Limit-Stufen und wähle die Einstellung, die die Flut stoppt, ohne legitime Spitzen zu ersticken; sieh im Voraus, wann dein Kontingent erschöpft ist und was dann passiert (Ablehnung oder Überschreitung).",
    "rp.birim.sn": "s",
    "rp.kart.tepeTrafik": "Beobachteter Spitzen-Traffic",
    "rp.kart.kotaKullanim": "Kontingentnutzung",
    "rp.kart.tukenisKalan": "Zeit bis zur Kontingenterschöpfung",
    "rp.kart.gunBirim": "{n} Tage",
    "rp.kart.asimDavranis": "Kontingent-Überschreitungsverhalten",
    "rp.deger.fazlaKullanim": "Überschreitung",
    "rp.deger.red429": "Ablehnung (429)",
    "rp.kademeler.baslik": "Rate-Limit-Stufen",
    "rp.kademeler.metin":
      "Anfragen-pro-Minute-Limit, gleitendes Fenster und die bei Limitüberschreitung angewandte Aktion. Basierend auf dem beobachteten Spitzen-Traffic ist die",
    "rp.kademeler.onerilenVurgu": "empfohlene",
    "rp.kademeler.metinSon": "Stufe markiert.",
    "rp.kademeler.onerilenRozet": "Empfohlen",
    "rp.kademeler.istekDk": "Anf./Min.",
    "rp.kademeler.pencere": "Gleitendes Fenster: {n} s",
    "rp.kademeler.oneriGerekceBaslik": "Empfehlungsbegründung",
    "rp.oneriGerekce.trafikYok":
      "Es wurde kein nennenswerter Traffic beobachtet; als solide Standardeinstellung gegen Missbrauch wird eine strenge Stufe empfohlen.",
    "rp.oneriGerekce.var":
      "Beobachteter Spitzenwert {rps} Anf./s (~{dk} Anf./Min.). Es wurde 2x Spielraum gelassen, um die legitime Spitze nicht zu ersticken; die strengste Stufe, die diese Last bewältigt, ist \"{kademe}\".",
    "rp.asimAciklama.block":
      "Wenn das Kontingent voll ist, werden überschüssige Anfragen ABGELEHNT (HTTP 429). Die Verifizierung stoppt; der Schutz wird nicht deaktiviert, aber es werden keine neuen Challenges erzeugt. Der Plan sollte hochgestuft werden.",
    "rp.asimAciklama.overage":
      "Wenn das Kontingent voll ist, wird der Dienst NICHT unterbrochen; die Überschreitung wird der Rechnung hinzugefügt. Der ununterbrochene Schutz läuft weiter.",
    "rp.sim.baslik": "Live-Rate-Limit-Simulator",
    "rp.sim.metin":
      "Stelle den eingehenden Spitzen-Traffic ein; sieh live, wie viele Anfragen jede Stufe in diesem 10-sekündigen Ausbruch durchlässt und wie viele sie drosselt. Das beweist, dass die Richtlinie tatsächlich funktioniert.",
    "rp.sim.gelenTrafik": "Eingehender Spitzen-Traffic",
    "rp.sim.istekSn": "Anf./s",
    "rp.sim.sakin": "5/s (ruhig)",
    "rp.sim.orta": "250/s",
    "rp.sim.sel": "500/s (Flut)",
    "rp.sim.serpme": "s {i}: {n} Anfragen",
    "rp.sim.seriNot": "Synthetische 10-s-Ausbruchsreihe (Spitze in der Mitte). Insgesamt {n} Anfragen.",
    "rp.sim.gecen": "Durchgelassen",
    "rp.sim.kisitlamaOrani": "Drosselrate",
    "rp.sim.ariaGelen": "Eingehender Spitzen-Traffic (Anf./s)",
    "rp.sim.nasilOkunurBaslik": "So liest man das",
    "rp.sim.nasilOkunur1":
      "Bei geringem Traffic lässt jede Stufe Anfragen durch (keine Drosselung). Bei Traffic-Spitzen greifen strenge Stufen zuerst: Wähle die richtige Stufe, um die Automatisierungsflut zu brechen, ohne legitime Nutzer zu ersticken. Die Aktion reicht von",
    "rp.sim.nasilOkunur2":
      "— eine Challenge anzubieten statt abzulehnen ist für legitime Nutzer sicherer.",
    "rp.kota.baslik": "Kontingent-Überschreitungsrichtlinie — {plan}-Plan",
    "rp.kota.donemKullanilan": "In diesem Zeitraum genutzte Verifizierungen",
    "rp.kota.kullanildi": "{pct} % genutzt",
    "rp.kota.kalan": "Verbleibend: {n}",
    "rp.kota.gunlukOrt": "Tagesdurchschnitt: {n}",
    "rp.kota.tahminiTukenis": "Geschätzte Erschöpfung",
    "rp.kota.tukenmez": "Erschöpft nie",
    "rp.kota.kotaDolu": "Kontingent voll",
    "rp.kota.gun": "{n} Tage",
    "rp.kota.tukenmezMetin": "Beim aktuellen Nutzungstempo erschöpft sich das Zeitraumkontingent nicht.",
    "rp.kota.tukenisMetin":
      "Der geschätzte Tag, an dem das Kontingent aufgebraucht ist, wenn das tägliche Durchschnittstempo konstant bleibt.",
    "rp.kota.dolunca": "Was passiert, wenn es voll ist?",
    "rp.kota.fazlaKullanimUcret": "Überschreitungsgebühr",
    "rp.kota.istekRed": "Anfragen abgelehnt (429)",
    "rp.kota.projBaslik": "Monatsend-Projektion: Du wirst das Kontingent um",
    "rp.kota.projIstekAsar": "Anfragen überschreiten.",
    "rp.kota.tahminiEkFatura": "Geschätzte Zusatzrechnung:",
    "rp.kota.birimNot": "(₺2 pro 1000 Anfragen).",
    "rp.kota.reddedilecek": "Diese Anfragen werden abgelehnt — erwäge ein Upgrade deines Plans.",
    "rp.plan.baslik": "Überschreitungsverhalten je Plan",
    "rp.plan.mevcut": "Aktuell",
    "rp.plan.aylik": "{n} / Monat",
    "rp.plan.fazlaKullanim": "Überschreitung",
    "rp.plan.red429": "Ablehnung (429)",
    "rp.plan.not":
      "Bei Überschreitungsplänen läuft der Schutz auch bei vollem Kontingent ununterbrochen weiter; der Überschuss wird der Rechnung hinzugefügt. Bei Ablehnungsplänen werden bei vollem Kontingent keine neuen Verifizierungen erzeugt.",
    "rp.grafik.baslik": "Tagesnutzung — Kontingentgrenze (letzte 14 Tage)",
    "rp.grafik.metinBas": "Vergleich der täglichen Verifizierungsnutzung (blau) mit der täglichen Kontingentgrenze (gestrichelt grau:",
    "rp.grafik.metinSon":
      "/Tag). An Tagen, an denen die Nutzungslinie die Grenze überschreitet, herrscht Kontingentdruck.",
    "rp.grafik.seriKullanim": "Tagesnutzung",
    "rp.grafik.seriTavan": "Tägliche Kontingentgrenze",
    "rp.not.temsili": "sind repräsentative Voreinstellungen",
    "rp.not.metin1": "Die Rate-Limit-Stufen",
    "rp.not.metin2": "Site-spezifische Limits können später mit der Regel-Engine konfiguriert werden —",
    "rp.not.kurallar": "Regeln",
    "rp.not.metin3": "Modul hat bereits eine Regel mit einem",
    "rp.not.metin4": "Feld.",
    "rp.not.siteVar": "Du hast derzeit {n} Sites.",
    "rp.ipucu.baslik": "Site-spezifische benutzerdefinierte Rate-Regel hinzufügen",
    "rp.ipucu.metinBas": "bedingte Regel, um sensible Endpunkte zu schützen.",
    "rp.ipucu.buton": "Zu den Regeln",
  },
  fr: {
    "rp.aksiyon.yavaslat": "Ralentir",
    "rp.aksiyon.challenge": "Challenge",
    "rp.aksiyon.engelle": "Bloquer",
    "rp.kademe.gevsek": "Souple",
    "rp.kademe.dengeli": "Équilibré",
    "rp.kademe.siki": "Strict",
    "rp.kademe.cok-siki": "Très strict",
    "rp.kademeAciklama.gevsek":
      "Trafic légitime élevé (campagnes, intégrations API). Seules les inondations extrêmes sont stoppées.",
    "rp.kademeAciklama.dengeli":
      "L'équilibre par défaut pour la plupart des sites de production : casse l'abus sans étouffer les pics légitimes.",
    "rp.kademeAciklama.siki":
      "Points d'accès sensibles (connexion, paiement, OTP). Faible tolérance à l'automatisation et à la force brute.",
    "rp.kademeAciklama.cok-siki":
      "Points d'accès critiques/à faible trafic. Chaque requête dépassant la limite est bloquée directement.",
    "rp.giris.baslik": "Capacité et protection contre l'abus, dans une seule console.",

    // --- Visuel : jauge de capacité + distribution des limites ---
    "rp.kapasite.baslik": "Utilisation de la capacité par palier",
    "rp.kapasite.metin": "Part de chaque limite de palier remplie par le trafic de pointe observé ({rps}/s ≈ {dk}/min).",
    "rp.kapasite.dolu": "plein",
    "rp.dagilim.baslik": "Distribution des limites",
    "rp.dagilim.metin": "Taille relative des limites de requêtes par minute entre les paliers.",
    "rp.dagilim.onerilen": "Recommandé",
    "rp.dagilim.diger": "Autre",
    "rp.giris.metin":
      "Simulez les paliers de limitation de débit et choisissez le réglage qui arrête l'inondation sans étouffer les pics légitimes ; voyez à l'avance quand votre quota s'épuisera et ce qui se passe alors (rejet ou dépassement).",
    "rp.birim.sn": "s",
    "rp.kart.tepeTrafik": "Trafic de pointe observé",
    "rp.kart.kotaKullanim": "Utilisation du quota",
    "rp.kart.tukenisKalan": "Temps avant épuisement du quota",
    "rp.kart.gunBirim": "{n} jours",
    "rp.kart.asimDavranis": "Comportement de dépassement du quota",
    "rp.deger.fazlaKullanim": "Dépassement",
    "rp.deger.red429": "Rejet (429)",
    "rp.kademeler.baslik": "Paliers de limitation de débit",
    "rp.kademeler.metin":
      "Limite de requêtes par minute, fenêtre glissante et action appliquée en cas de dépassement. Selon le trafic de pointe observé, le palier",
    "rp.kademeler.onerilenVurgu": "recommandé",
    "rp.kademeler.metinSon": "est marqué.",
    "rp.kademeler.onerilenRozet": "Recommandé",
    "rp.kademeler.istekDk": "req/min",
    "rp.kademeler.pencere": "Fenêtre glissante : {n} s",
    "rp.kademeler.oneriGerekceBaslik": "Justification de la recommandation",
    "rp.oneriGerekce.trafikYok":
      "Aucun trafic significatif n'a été observé ; un palier strict est recommandé comme réglage par défaut solide contre l'abus.",
    "rp.oneriGerekce.var":
      "Pic observé {rps} req/s (~{dk} req/min). Une marge de 2x a été laissée pour ne pas étouffer le pic légitime ; le palier le plus strict qui gère cette charge est « {kademe} ».",
    "rp.asimAciklama.block":
      "Quand le quota est plein, les requêtes excédentaires sont REJETÉES (HTTP 429). La vérification s'arrête ; la protection n'est pas désactivée mais aucun nouveau challenge n'est émis. Le forfait doit être mis à niveau.",
    "rp.asimAciklama.overage":
      "Quand le quota est plein, le service n'est PAS interrompu ; le dépassement est ajouté à la facture. La protection continue sans interruption.",
    "rp.sim.baslik": "Simulateur de limitation de débit en direct",
    "rp.sim.metin":
      "Ajustez le trafic de pointe entrant ; voyez en direct combien de requêtes chaque palier laisse passer et combien il restreint durant cette rafale de 10 secondes. Cela prouve que la politique fonctionne réellement.",
    "rp.sim.gelenTrafik": "Trafic de pointe entrant",
    "rp.sim.istekSn": "req/s",
    "rp.sim.sakin": "5/s (calme)",
    "rp.sim.orta": "250/s",
    "rp.sim.sel": "500/s (inondation)",
    "rp.sim.serpme": "s {i} : {n} requêtes",
    "rp.sim.seriNot": "Série de rafale synthétique de 10 s (pic au milieu). Total {n} requêtes.",
    "rp.sim.gecen": "Passées",
    "rp.sim.kisitlamaOrani": "Taux de restriction",
    "rp.sim.ariaGelen": "Trafic de pointe entrant (req/s)",
    "rp.sim.nasilOkunurBaslik": "Comment lire ceci",
    "rp.sim.nasilOkunur1":
      "À faible trafic, chaque palier laisse passer les requêtes (aucune restriction). Quand le trafic culmine, les paliers stricts s'activent en premier : choisissez le bon palier pour casser l'inondation d'automatisation sans étouffer les utilisateurs légitimes. L'action varie entre",
    "rp.sim.nasilOkunur2":
      "— proposer un challenge plutôt que rejeter est plus sûr pour l'utilisateur légitime.",
    "rp.kota.baslik": "Politique de dépassement du quota — forfait {plan}",
    "rp.kota.donemKullanilan": "Vérifications utilisées cette période",
    "rp.kota.kullanildi": "{pct} % utilisé",
    "rp.kota.kalan": "Restant : {n}",
    "rp.kota.gunlukOrt": "Moy. quotidienne : {n}",
    "rp.kota.tahminiTukenis": "Épuisement estimé",
    "rp.kota.tukenmez": "Ne s'épuise jamais",
    "rp.kota.kotaDolu": "Quota plein",
    "rp.kota.gun": "{n} jours",
    "rp.kota.tukenmezMetin": "Au rythme d'usage actuel, le quota de la période ne s'épuise pas.",
    "rp.kota.tukenisMetin":
      "Le jour estimé où le quota s'épuise si le rythme d'usage quotidien moyen reste constant.",
    "rp.kota.dolunca": "Que se passe-t-il quand il est plein ?",
    "rp.kota.fazlaKullanimUcret": "Frais de dépassement",
    "rp.kota.istekRed": "Requêtes rejetées (429)",
    "rp.kota.projBaslik": "Projection de fin de mois : vous dépasserez le quota de",
    "rp.kota.projIstekAsar": "requêtes.",
    "rp.kota.tahminiEkFatura": "Facture supplémentaire estimée :",
    "rp.kota.birimNot": "(2 ₺ pour 1000 requêtes).",
    "rp.kota.reddedilecek": "Ces requêtes seront rejetées — envisagez de passer à un forfait supérieur.",
    "rp.plan.baslik": "Comportement de dépassement par forfait",
    "rp.plan.mevcut": "Actuel",
    "rp.plan.aylik": "{n} / mois",
    "rp.plan.fazlaKullanim": "Dépassement",
    "rp.plan.red429": "Rejet (429)",
    "rp.plan.not":
      "Sur les forfaits avec dépassement, la protection continue sans interruption même quand le quota est plein ; l'excédent est ajouté à la facture. Sur les forfaits avec rejet, aucune nouvelle vérification n'est émise une fois le quota plein.",
    "rp.grafik.baslik": "Usage quotidien — plafond de quota (14 derniers jours)",
    "rp.grafik.metinBas": "Comparaison de l'usage de vérification quotidien (bleu) avec le plafond de quota quotidien (gris pointillé :",
    "rp.grafik.metinSon":
      "/jour). Les jours où la ligne d'usage dépasse le plafond, il y a une pression sur le quota.",
    "rp.grafik.seriKullanim": "Usage quotidien",
    "rp.grafik.seriTavan": "Plafond de quota quotidien",
    "rp.not.temsili": "sont des préréglages représentatifs",
    "rp.not.metin1": "Les paliers de limitation de débit",
    "rp.not.metin2": "Les limites personnalisées par site pourront être configurées ultérieurement avec le moteur de règles —",
    "rp.not.kurallar": "Règles",
    "rp.not.metin3": "possède déjà une règle avec un champ",
    "rp.not.metin4": ".",
    "rp.not.siteVar": "Vous avez actuellement {n} sites.",
    "rp.ipucu.baslik": "Ajouter une règle de débit personnalisée par site",
    "rp.ipucu.metinBas": "règle conditionnelle pour protéger les points d'accès sensibles.",
    "rp.ipucu.buton": "Aller aux Règles",
  },
  es: {
    "rp.aksiyon.yavaslat": "Ralentizar",
    "rp.aksiyon.challenge": "Challenge",
    "rp.aksiyon.engelle": "Bloquear",
    "rp.kademe.gevsek": "Flexible",
    "rp.kademe.dengeli": "Equilibrado",
    "rp.kademe.siki": "Estricto",
    "rp.kademe.cok-siki": "Muy estricto",
    "rp.kademeAciklama.gevsek":
      "Alto tráfico legítimo (campañas, integraciones API). Solo se detienen las avalanchas extremas.",
    "rp.kademeAciklama.dengeli":
      "El equilibrio predeterminado para la mayoría de sitios de producción: frena el abuso sin ahogar los picos legítimos.",
    "rp.kademeAciklama.siki":
      "Puntos de acceso sensibles (inicio de sesión, pago, OTP). Baja tolerancia a la automatización y la fuerza bruta.",
    "rp.kademeAciklama.cok-siki":
      "Puntos de acceso críticos/de bajo tráfico. Cada solicitud que supera el límite se bloquea directamente.",
    "rp.giris.baslik": "Capacidad y protección contra el abuso, en una sola consola.",

    // --- Visual: indicador de capacidad + distribución de límites ---
    "rp.kapasite.baslik": "Uso de capacidad por nivel",
    "rp.kapasite.metin": "Cuánto llena de cada límite de nivel el tráfico pico observado ({rps}/s ≈ {dk}/min).",
    "rp.kapasite.dolu": "lleno",
    "rp.dagilim.baslik": "Distribución de límites",
    "rp.dagilim.metin": "Tamaño relativo de los límites de solicitudes por minuto entre niveles.",
    "rp.dagilim.onerilen": "Recomendado",
    "rp.dagilim.diger": "Otro",
    "rp.giris.metin":
      "Simula los niveles de límite de tasa y elige el ajuste que detiene la avalancha sin ahogar los picos legítimos; ve con antelación cuándo se agotará tu cuota y qué ocurre cuando lo hace (rechazo o exceso).",
    "rp.birim.sn": "s",
    "rp.kart.tepeTrafik": "Tráfico pico observado",
    "rp.kart.kotaKullanim": "Uso de la cuota",
    "rp.kart.tukenisKalan": "Tiempo hasta agotar la cuota",
    "rp.kart.gunBirim": "{n} días",
    "rp.kart.asimDavranis": "Comportamiento de exceso de cuota",
    "rp.deger.fazlaKullanim": "Exceso",
    "rp.deger.red429": "Rechazo (429)",
    "rp.kademeler.baslik": "Niveles de límite de tasa",
    "rp.kademeler.metin":
      "Límite de solicitudes por minuto, ventana deslizante y la acción aplicada al superar el límite. Según el tráfico pico observado, el nivel",
    "rp.kademeler.onerilenVurgu": "recomendado",
    "rp.kademeler.metinSon": "está marcado.",
    "rp.kademeler.onerilenRozet": "Recomendado",
    "rp.kademeler.istekDk": "sol./min",
    "rp.kademeler.pencere": "Ventana deslizante: {n} s",
    "rp.kademeler.oneriGerekceBaslik": "Justificación de la recomendación",
    "rp.oneriGerekce.trafikYok":
      "No se observó tráfico significativo; se recomienda un nivel estricto como ajuste predeterminado sólido contra el abuso.",
    "rp.oneriGerekce.var":
      "Pico observado {rps} sol./s (~{dk} sol./min). Se dejó un margen de 2x para no ahogar el pico legítimo; el nivel más estricto que gestiona esta carga es «{kademe}».",
    "rp.asimAciklama.block":
      "Cuando la cuota está llena, las solicitudes excedentes se RECHAZAN (HTTP 429). La verificación se detiene; la protección no se desactiva pero no se emiten nuevos challenges. El plan debe actualizarse.",
    "rp.asimAciklama.overage":
      "Cuando la cuota está llena, el servicio NO se corta; el exceso se añade a la factura. La protección continúa sin interrupción.",
    "rp.sim.baslik": "Simulador de límite de tasa en vivo",
    "rp.sim.metin":
      "Ajusta el tráfico pico entrante; observa en vivo cuántas solicitudes deja pasar y cuántas restringe cada nivel durante esta ráfaga de 10 segundos. Esto demuestra que la política realmente funciona.",
    "rp.sim.gelenTrafik": "Tráfico pico entrante",
    "rp.sim.istekSn": "sol./s",
    "rp.sim.sakin": "5/s (tranquilo)",
    "rp.sim.orta": "250/s",
    "rp.sim.sel": "500/s (avalancha)",
    "rp.sim.serpme": "s {i}: {n} solicitudes",
    "rp.sim.seriNot": "Serie de ráfaga sintética de 10 s (pico en el centro). Total {n} solicitudes.",
    "rp.sim.gecen": "Pasadas",
    "rp.sim.kisitlamaOrani": "Tasa de restricción",
    "rp.sim.ariaGelen": "Tráfico pico entrante (sol./s)",
    "rp.sim.nasilOkunurBaslik": "Cómo leer esto",
    "rp.sim.nasilOkunur1":
      "Con tráfico bajo, cada nivel deja pasar las solicitudes (sin restricción). Cuando el tráfico llega al pico, los niveles estrictos se activan primero: elige el nivel correcto para romper la avalancha de automatización sin ahogar a los usuarios legítimos. La acción varía entre",
    "rp.sim.nasilOkunur2":
      "— ofrecer un challenge en lugar de rechazar es más seguro para el usuario legítimo.",
    "rp.kota.baslik": "Política de exceso de cuota — plan {plan}",
    "rp.kota.donemKullanilan": "Verificaciones usadas este período",
    "rp.kota.kullanildi": "{pct} % usado",
    "rp.kota.kalan": "Restante: {n}",
    "rp.kota.gunlukOrt": "Prom. diario: {n}",
    "rp.kota.tahminiTukenis": "Agotamiento estimado",
    "rp.kota.tukenmez": "Nunca se agota",
    "rp.kota.kotaDolu": "Cuota llena",
    "rp.kota.gun": "{n} días",
    "rp.kota.tukenmezMetin": "Al ritmo de uso actual, la cuota del período no se agota.",
    "rp.kota.tukenisMetin":
      "El día estimado en que se agota la cuota si el ritmo de uso diario promedio se mantiene constante.",
    "rp.kota.dolunca": "¿Qué ocurre cuando se llena?",
    "rp.kota.fazlaKullanimUcret": "Cargo por exceso",
    "rp.kota.istekRed": "Solicitudes rechazadas (429)",
    "rp.kota.projBaslik": "Proyección de fin de mes: superarás la cuota en",
    "rp.kota.projIstekAsar": "solicitudes.",
    "rp.kota.tahminiEkFatura": "Factura adicional estimada:",
    "rp.kota.birimNot": "(₺2 por cada 1000 solicitudes).",
    "rp.kota.reddedilecek": "Estas solicitudes serán rechazadas — considera subir de plan.",
    "rp.plan.baslik": "Comportamiento de exceso por plan",
    "rp.plan.mevcut": "Actual",
    "rp.plan.aylik": "{n} / mes",
    "rp.plan.fazlaKullanim": "Exceso",
    "rp.plan.red429": "Rechazo (429)",
    "rp.plan.not":
      "En los planes con exceso, la protección continúa sin interrupción aunque la cuota esté llena; el exceso se añade a la factura. En los planes con rechazo, no se emiten nuevas verificaciones una vez llena la cuota.",
    "rp.grafik.baslik": "Uso diario — techo de cuota (últimos 14 días)",
    "rp.grafik.metinBas": "Comparación del uso de verificación diario (azul) con el techo de cuota diario (gris punteado:",
    "rp.grafik.metinSon":
      "/día). En los días en que la línea de uso supera el techo hay presión sobre la cuota.",
    "rp.grafik.seriKullanim": "Uso diario",
    "rp.grafik.seriTavan": "Techo de cuota diario",
    "rp.not.temsili": "son ajustes predefinidos representativos",
    "rp.not.metin1": "Los niveles de límite de tasa",
    "rp.not.metin2": "Los límites personalizados por sitio podrán configurarse más adelante con el motor de reglas —",
    "rp.not.kurallar": "Reglas",
    "rp.not.metin3": "ya tiene una regla con un campo",
    "rp.not.metin4": ".",
    "rp.not.siteVar": "Actualmente tienes {n} sitios.",
    "rp.ipucu.baslik": "Añadir una regla de tasa personalizada por sitio",
    "rp.ipucu.metinBas": "regla condicional para proteger los puntos de acceso sensibles.",
    "rp.ipucu.buton": "Ir a Reglas",
  },
};

export function rpCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
