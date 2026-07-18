/**
 * Topluluk İstihbaratı Konsolu — YEREL sayfa sözlüğü.
 * ===================================================
 * Bu dosya YALNIZCA /panel/topluluk istemci bileşeninin kullanıcıya görünen
 * KROM/ETİKET metinlerini 5 dile taşır (tr/en/de/fr/es).
 * Paylaşılan `@/lib/i18n/panel` sözlüğüne DOKUNMAZ; yalnızca `Dil` tipini ondan alır.
 *
 * ÖNEMLİ (enum & lib güvenliği):
 *  - IOC TÜR değerleri (ip/asn/fingerprint) ve KATEGORİ değerleri
 *    (botnet/scraper/…) rozet/renk/ikon mantığını sürer, çevrilmez.
 *    Yalnızca ETİKETLERİ enum→anahtar eşlemesiyle ("tur.*", "kategori.*") çözülür.
 *    (lib TUR_ETIKET / KATEGORI_ETIKET artık istemcide kullanılmaz.)
 *  - Kademe değerleri (Bronz/Gümüş/Altın/Platin) lib'den string olarak gelir;
 *    istemcide "kademe.*" anahtarıyla çevrilir, lib'e DOKUNULMAZ.
 *  - IP, ASN, ülke kodu, parmak izi hash'i, sayı, tarih, yüzde VERİ'dir — çevrilmez.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // Giriş şeridi
    "serit.baslik": "Ağ-etkisi savunması: her katkı herkesi güçlendirir.",
    "serit.aciklama":
      "Gözlemlediğin kötü niyetli IOC'leri (IP, ASN, cihaz parmak izi) anonim olarak topluluğa katkıla; karşılığında başka düğümlerde ilk görülen tehditleri sen görmeden önce engelle. Bir müşteride tespit edilen saldırı, tüm ağ için önden-bilinen bir tehdide dönüşür.",

    // 1. Ağ özeti kartları
    "kart.katkiIoc": "Katkı yapılabilir IOC",
    "kart.dogrulanmis": "Topluluk-doğrulanmış tehdit",
    "kart.proaktif": "Proaktif kazanç (sende yok)",
    "kart.katkiPuani": "Katkı puanı",

    // Temsili ağ durumu şeridi
    "ag.ad": "Veylify topluluk ağı",
    "ag.temsili": "temsili",
    "ag.dugum": "düğüm",
    "ag.havuz": "bilinen kötü IOC (simüle edilmiş toplu havuz)",
    "ag.katkici": "katkıcı",
    "ag.katki": "Topluluğa katkı",

    // 1.5 Görsel istihbarat panosu
    "gorsel.katkiSagligi": "Katkı sağlığı",
    "gorsel.puanTavan": "/ 900 puan",
    "gorsel.savunmaProfili": "Tür-bazlı savunma profili",
    "gorsel.kategoriDagilim": "Tehdit kategori dağılımı",
    "gorsel.iocMerkez": "IOC",
    "gorsel.guvenBandi": "Topluluk güven bandı",
    "gorsel.guvenBandiAlt": "IOC sayısı / güven aralığı",
    "gorsel.enYaygin": "En yaygın katkıların (topluluk düğümü)",
    "gorsel.veriYok": "Veri yok",
    "radar.kapsam": "Paylaşım",
    "radar.dogrulama": "Doğrulama",

    // 2. Katkılarım
    "katki.baslik": "Katkılarım",
    "katki.gercekVerin": "gerçek verin",
    "katki.hepsi": "Hepsi",
    "katki.parmakIzi": "Parmak izi",
    "katki.tumunuPaylas": "Tümünü paylaş",
    "katki.anonimNot.1": "Paylaşım",
    "katki.anonimNot.2": "anonimdir",
    "katki.anonimNot.3":
      "ve yalnızca IOC göstergesini (IP / ASN / parmak izi hash'i) içerir — hiçbir PII, site adı, URL veya kullanıcı verisi paylaşılmaz. Şu an",
    "katki.anonimNot.4": "IOC paylaşımda.",
    "katki.bosBaslik": "Henüz katkı yapılabilir IOC yok",
    "katki.bosAciklama":
      "Sitelerin kötü niyetli trafik gözlemledikçe (engellenen / işaretlenen olaylar) katkı yapılabilir göstergeler burada birikir. Aşağıdaki topluluk beslemesinden proaktif korumadan hemen yararlanabilirsin.",
    "katki.th.gosterge": "Gösterge (IOC)",
    "katki.th.tur": "Tür",
    "katki.th.gozlem": "Gözlem",
    "katki.th.tehdit": "Tehdit skoru",
    "katki.th.guven": "Önerilen güven",
    "katki.th.topluluk": "Topluluk",
    "katki.th.paylas": "Paylaş",
    "katki.dugum": "düğüm",
    "katki.yalnizSende": "yalnız sende",
    "katki.paylasAria": "{deger} paylaş",

    // 3. Topluluk istihbaratı (temsili besleme)
    "besleme.baslik": "Topluluk istihbaratı",
    "besleme.rozet": "temsili topluluk ağı",
    "besleme.uyari":
      "Aşağıdaki göstergeler simüle edilmiş topluluk ağından gelir (deterministik temsili model). Düğüm sayısı ve küresel güven, gerçek başka müşteriler değil, IOC'nin kararlı bir temsili istihbarat profilidir. Sarı ile işaretli olanları henüz sen görmedin — proaktif olarak engelleyebilirsin.",
    "besleme.sendeVar": "sende var",
    "besleme.yeni": "yeni",
    "besleme.dugum": "düğüm",
    "besleme.kureselGuven": "Küresel güven",
    "besleme.ilkGorulme": "İlk görülme: {tarih}",
    "besleme.engelle": "Engelle",

    // 4. Topluluk-doğrulanmış tehditler
    "dogru.baslik": "Topluluk-doğrulanmış tehditlerin",
    "dogru.aciklama":
      "Bunları hem sen gözlemledin hem de topluluk ağı işaretledi — ikili doğrulama, daha yüksek güven demektir. Bu IOC'lere karşı daha hızlı ve kesin aksiyon alabilirsin.",
    "dogru.bos":
      "Henüz topluluk-doğrulanmış (ikili işaretli) tehdidin yok. Katkın arttıkça örtüşme yükselir.",
    "dogru.satir": "Sende {gozlem} gözlem · Toplulukta {dugum} düğüm · {tur}",
    "dogru.birlesikGuven": "birleşik güven",

    // 5. Karşılıklılık
    "kar.baslik": "Karşılıklılık — ağ-etkisi değeri",
    "kar.katkiliyorsun": "Sen katkılıyorsun",
    "kar.iocPaylasimda": "IOC paylaşımda",
    "kar.verilenAciklama":
      "Gözlemlediğin kötü göstergeler anonim olarak ağı besliyor — başka bir düğümün gelecekteki savunması senin verinle güçleniyor.",
    "kar.kazaniyorsun": "Sen kazanıyorsun",
    "kar.proaktifEngelleme": "proaktif engelleme",
    "kar.kazanilanAciklama":
      "Topluluğun işaretlediği ama senin henüz görmediğin tehditler. Bunları önden engelleyerek sıfır-gün maruz kalmanı azaltırsın.",
    "kar.dogrulanan": "Doğrulanan tehdit",
    "kar.kaldirac": "Ağ-etkisi kaldıracı",
    "kar.katkiPuani": "Katkı puanı",
    "kar.kademe": "İtibar kademesi",
    "kar.notBaslik": "Ağ etkisi nasıl çalışır?",
    "kar.not.1":
      "Katkı ne kadar artarsa örtüşme ve doğrulama o kadar yükselir; topluluk beslemesinden aldığın proaktif koruma da büyür. Tek başına savunan bir sistem yalnızca kendi gördüğünü bilir — kolektif savunmada",
    "kar.not.2": "ağın gözleriyle görür.",

    // 6. Gizlilik & ayarlar
    "giz.baslik": "Gizlilik & paylaşım ayarları",
    "giz.katkiBaslik": "Topluluğa katkıda bulun",
    "giz.katkiAciklama":
      "Gözlemlenen kötü IOC'leri anonim olarak topluluk ağına aktar (ana anahtar).",
    "giz.otomatikBaslik": "Yeni IOC'leri otomatik paylaş",
    "giz.otomatikAciklama":
      "İleride gözlemlenen yeni göstergeler de otomatik olarak paylaşıma dahil edilsin.",
    "giz.neBaslik": "Ne paylaşılır, ne paylaşılmaz",
    "giz.evet.1": "IOC göstergesi: IP adresi, ASN, cihaz parmak izi hash'i",
    "giz.evet.2": "Anonim gözlem sayısı ve tehdit kategorisi",
    "giz.hayir.1": "Site adı, alan adı, URL veya yol",
    "giz.hayir.2": "Kullanıcı / ziyaretçi kişisel verisi (PII)",
    "giz.hayir.3": "Hesap, API anahtarı veya yapılandırma bilgisi",
    "giz.ifsaBaslik": "Dürüst ifşa:",
    "giz.ifsa":
      "Katkı verilerin (yukarıdaki tablo) senin sitelerinin gerçek gözlemlerinden türetilir. Buna karşılık gösterilen topluluk toplamı temsilidir — deterministik bir istihbarat modelidir, gerçek başka müşterilerin canlı verisi değildir. Gerçek üründe bu katman, kimliksizleştirilmiş IOC'lerin çok-kiracılı bir güven ağında birleştirilmesiyle çalışır (CrowdSec / kolektif-güvenlik modeli). Paylaşım tercihlerin bu tarayıcıda saklanır.",

    // Toast'lar
    "toast.acikBaslik": "Topluluğa katkı açıldı",
    "toast.kapaliBaslik": "Topluluğa katkı kapatıldı",
    "toast.acikAciklama": "IOC'lerin anonim olarak topluluk ağına aktarılıyor.",
    "toast.kapaliAciklama": "Artık hiçbir IOC paylaşılmıyor.",
    "toast.tumuBaslik": "Tüm IOC'ler paylaşıma açıldı",
    "toast.tumuAciklama": "{n} gösterge topluluk ağına aktarılıyor.",
    "toast.engelleBaslik": "Engelleme kuralı taslağı hazır",
    "toast.engelleAciklama":
      "{deger} için topluluk-temelli engelleme kuralı Kurallar modülünde oluşturulabilir.",

    // Kademe etiketleri (lib "Bronz/Gümüş/Altın/Platin" → çeviri)
    "kademe.Bronz": "Bronz",
    "kademe.Gümüş": "Gümüş",
    "kademe.Altın": "Altın",
    "kademe.Platin": "Platin",

    // IOC tür etiketleri (enum → çeviri)
    "tur.ip": "IP adresi",
    "tur.asn": "ASN",
    "tur.fingerprint": "Cihaz parmak izi",

    // Kategori etiketleri (enum → çeviri)
    "kategori.botnet": "Botnet / C2",
    "kategori.credential_stuffing": "Kimlik doldurma",
    "kategori.scraper": "İçerik kazıyıcı",
    "kategori.scanner": "Tarayıcı",
    "kategori.spam": "Spam kaynağı",
    "kategori.proxy_abuse": "Proxy/VPN kötüye kullanımı",
    "kategori.ddos": "DDoS",
  },

  en: {
    "serit.baslik": "Network-effect defense: every contribution strengthens everyone.",
    "serit.aciklama":
      "Contribute the malicious IOCs you observe (IP, ASN, device fingerprint) anonymously to the community; in return, block threats first seen on other nodes before you ever see them. An attack detected at one customer becomes a pre-known threat for the entire network.",

    "kart.katkiIoc": "Contributable IOCs",
    "kart.dogrulanmis": "Community-verified threats",
    "kart.proaktif": "Proactive gain (not yet yours)",
    "kart.katkiPuani": "Contribution score",

    "ag.ad": "Veylify community network",
    "ag.temsili": "representative",
    "ag.dugum": "nodes",
    "ag.havuz": "known malicious IOCs (simulated collective pool)",
    "ag.katkici": "contributor",
    "ag.katki": "Community contribution",

    "gorsel.katkiSagligi": "Contribution health",
    "gorsel.puanTavan": "/ 900 pts",
    "gorsel.savunmaProfili": "Type-based defense profile",
    "gorsel.kategoriDagilim": "Threat category breakdown",
    "gorsel.iocMerkez": "IOCs",
    "gorsel.guvenBandi": "Community confidence band",
    "gorsel.guvenBandiAlt": "IOC count / confidence range",
    "gorsel.enYaygin": "Your most widespread contributions (nodes)",
    "gorsel.veriYok": "No data",
    "radar.kapsam": "Sharing",
    "radar.dogrulama": "Verification",

    "katki.baslik": "My contributions",
    "katki.gercekVerin": "your real data",
    "katki.hepsi": "All",
    "katki.parmakIzi": "Fingerprint",
    "katki.tumunuPaylas": "Share all",
    "katki.anonimNot.1": "Sharing is",
    "katki.anonimNot.2": "anonymous",
    "katki.anonimNot.3":
      "and includes only the IOC indicator (IP / ASN / fingerprint hash) — no PII, site name, URL or user data is shared. Currently",
    "katki.anonimNot.4": "IOCs are being shared.",
    "katki.bosBaslik": "No contributable IOCs yet",
    "katki.bosAciklama":
      "As your sites observe malicious traffic (blocked / flagged events), contributable indicators accumulate here. You can benefit from proactive protection in the community feed below right away.",
    "katki.th.gosterge": "Indicator (IOC)",
    "katki.th.tur": "Type",
    "katki.th.gozlem": "Observations",
    "katki.th.tehdit": "Threat score",
    "katki.th.guven": "Suggested confidence",
    "katki.th.topluluk": "Community",
    "katki.th.paylas": "Share",
    "katki.dugum": "nodes",
    "katki.yalnizSende": "only you",
    "katki.paylasAria": "Share {deger}",

    "besleme.baslik": "Community intelligence",
    "besleme.rozet": "representative community network",
    "besleme.uyari":
      "The indicators below come from a simulated community network (deterministic representative model). Node count and global confidence are not real other customers but a stable representative intelligence profile of the IOC. You haven't seen the ones marked in amber yet — you can block them proactively.",
    "besleme.sendeVar": "already yours",
    "besleme.yeni": "new",
    "besleme.dugum": "nodes",
    "besleme.kureselGuven": "Global confidence",
    "besleme.ilkGorulme": "First seen: {tarih}",
    "besleme.engelle": "Block",

    "dogru.baslik": "Your community-verified threats",
    "dogru.aciklama":
      "You observed these and the community network flagged them too — dual verification means higher confidence. You can take faster, more decisive action against these IOCs.",
    "dogru.bos":
      "You have no community-verified (dually flagged) threats yet. Overlap rises as your contribution grows.",
    "dogru.satir": "{gozlem} observations on your side · {dugum} nodes in the community · {tur}",
    "dogru.birlesikGuven": "combined confidence",

    "kar.baslik": "Reciprocity — network-effect value",
    "kar.katkiliyorsun": "You contribute",
    "kar.iocPaylasimda": "IOCs shared",
    "kar.verilenAciklama":
      "The malicious indicators you observe feed the network anonymously — another node's future defense grows stronger with your data.",
    "kar.kazaniyorsun": "You gain",
    "kar.proaktifEngelleme": "proactive blocks",
    "kar.kazanilanAciklama":
      "Threats the community flagged but you haven't seen yet. By blocking them upfront, you reduce your zero-day exposure.",
    "kar.dogrulanan": "Verified threats",
    "kar.kaldirac": "Network-effect leverage",
    "kar.katkiPuani": "Contribution score",
    "kar.kademe": "Reputation tier",
    "kar.notBaslik": "How does the network effect work?",
    "kar.not.1":
      "The more you contribute, the higher the overlap and verification; the proactive protection you draw from the community feed also grows. A system defending alone knows only what it sees — in collective defense",
    "kar.not.2": "sees with the eyes of the network.",

    "giz.baslik": "Privacy & sharing settings",
    "giz.katkiBaslik": "Contribute to the community",
    "giz.katkiAciklama":
      "Forward observed malicious IOCs anonymously to the community network (master switch).",
    "giz.otomatikBaslik": "Auto-share new IOCs",
    "giz.otomatikAciklama":
      "Include newly observed indicators in sharing automatically going forward.",
    "giz.neBaslik": "What is shared, what is not",
    "giz.evet.1": "IOC indicator: IP address, ASN, device fingerprint hash",
    "giz.evet.2": "Anonymous observation count and threat category",
    "giz.hayir.1": "Site name, domain, URL or path",
    "giz.hayir.2": "User / visitor personal data (PII)",
    "giz.hayir.3": "Account, API key or configuration data",
    "giz.ifsaBaslik": "Honest disclosure:",
    "giz.ifsa":
      "Your contribution data (the table above) is derived from your sites' real observations. The community total shown in return is representative — a deterministic intelligence model, not the live data of real other customers. In a real product, this layer works by aggregating anonymized IOCs in a multi-tenant trust network (CrowdSec / collective-security model). Your sharing preferences are stored in this browser.",

    "toast.acikBaslik": "Community contribution enabled",
    "toast.kapaliBaslik": "Community contribution disabled",
    "toast.acikAciklama": "Your IOCs are being forwarded anonymously to the community network.",
    "toast.kapaliAciklama": "No IOCs are shared anymore.",
    "toast.tumuBaslik": "All IOCs opened for sharing",
    "toast.tumuAciklama": "{n} indicators are being forwarded to the community network.",
    "toast.engelleBaslik": "Blocking rule draft ready",
    "toast.engelleAciklama":
      "A community-based blocking rule for {deger} can be created in the Rules module.",

    "kademe.Bronz": "Bronze",
    "kademe.Gümüş": "Silver",
    "kademe.Altın": "Gold",
    "kademe.Platin": "Platinum",

    "tur.ip": "IP address",
    "tur.asn": "ASN",
    "tur.fingerprint": "Device fingerprint",

    "kategori.botnet": "Botnet / C2",
    "kategori.credential_stuffing": "Credential stuffing",
    "kategori.scraper": "Content scraper",
    "kategori.scanner": "Scanner",
    "kategori.spam": "Spam source",
    "kategori.proxy_abuse": "Proxy/VPN abuse",
    "kategori.ddos": "DDoS",
  },

  de: {
    "serit.baslik": "Netzwerkeffekt-Abwehr: Jeder Beitrag stärkt alle.",
    "serit.aciklama":
      "Trage die von dir beobachteten bösartigen IOCs (IP, ASN, Geräte-Fingerabdruck) anonym zur Community bei; im Gegenzug blockierst du Bedrohungen, die zuerst auf anderen Knoten auftauchen, bevor du sie überhaupt siehst. Ein bei einem Kunden erkannter Angriff wird zu einer vorab bekannten Bedrohung für das gesamte Netzwerk.",

    "kart.katkiIoc": "Beitragbare IOCs",
    "kart.dogrulanmis": "Community-verifizierte Bedrohungen",
    "kart.proaktif": "Proaktiver Gewinn (noch nicht bei dir)",
    "kart.katkiPuani": "Beitragspunktzahl",

    "ag.ad": "Veylify-Community-Netzwerk",
    "ag.temsili": "repräsentativ",
    "ag.dugum": "Knoten",
    "ag.havuz": "bekannte bösartige IOCs (simulierter kollektiver Pool)",
    "ag.katkici": "Beitragender",
    "ag.katki": "Community-Beitrag",

    "gorsel.katkiSagligi": "Beitragsgesundheit",
    "gorsel.puanTavan": "/ 900 Pkt.",
    "gorsel.savunmaProfili": "Typbasiertes Abwehrprofil",
    "gorsel.kategoriDagilim": "Bedrohungskategorie-Verteilung",
    "gorsel.iocMerkez": "IOCs",
    "gorsel.guvenBandi": "Community-Konfidenzband",
    "gorsel.guvenBandiAlt": "IOC-Anzahl / Konfidenzbereich",
    "gorsel.enYaygin": "Deine verbreitetsten Beiträge (Knoten)",
    "gorsel.veriYok": "Keine Daten",
    "radar.kapsam": "Teilen",
    "radar.dogrulama": "Verifizierung",

    "katki.baslik": "Meine Beiträge",
    "katki.gercekVerin": "deine echten Daten",
    "katki.hepsi": "Alle",
    "katki.parmakIzi": "Fingerabdruck",
    "katki.tumunuPaylas": "Alle teilen",
    "katki.anonimNot.1": "Die Weitergabe ist",
    "katki.anonimNot.2": "anonym",
    "katki.anonimNot.3":
      "und enthält nur den IOC-Indikator (IP / ASN / Fingerabdruck-Hash) — keine PII, kein Website-Name, keine URL oder Nutzerdaten werden geteilt. Derzeit",
    "katki.anonimNot.4": "IOCs werden geteilt.",
    "katki.bosBaslik": "Noch keine beitragbaren IOCs",
    "katki.bosAciklama":
      "Sobald deine Sites bösartigen Traffic beobachten (blockierte / markierte Ereignisse), sammeln sich hier beitragbare Indikatoren. Vom proaktiven Schutz im Community-Feed unten kannst du sofort profitieren.",
    "katki.th.gosterge": "Indikator (IOC)",
    "katki.th.tur": "Typ",
    "katki.th.gozlem": "Beobachtungen",
    "katki.th.tehdit": "Bedrohungswert",
    "katki.th.guven": "Empfohlene Konfidenz",
    "katki.th.topluluk": "Community",
    "katki.th.paylas": "Teilen",
    "katki.dugum": "Knoten",
    "katki.yalnizSende": "nur bei dir",
    "katki.paylasAria": "{deger} teilen",

    "besleme.baslik": "Community-Analyse",
    "besleme.rozet": "repräsentatives Community-Netzwerk",
    "besleme.uyari":
      "Die folgenden Indikatoren stammen aus einem simulierten Community-Netzwerk (deterministisches repräsentatives Modell). Knotenzahl und globale Konfidenz sind keine echten anderen Kunden, sondern ein stabiles repräsentatives Analyseprofil des IOC. Die gelb markierten hast du noch nicht gesehen — du kannst sie proaktiv blockieren.",
    "besleme.sendeVar": "bereits bei dir",
    "besleme.yeni": "neu",
    "besleme.dugum": "Knoten",
    "besleme.kureselGuven": "Globale Konfidenz",
    "besleme.ilkGorulme": "Erstmals gesehen: {tarih}",
    "besleme.engelle": "Blockieren",

    "dogru.baslik": "Deine Community-verifizierten Bedrohungen",
    "dogru.aciklama":
      "Du hast diese beobachtet und das Community-Netzwerk hat sie ebenfalls markiert — doppelte Verifizierung bedeutet höhere Konfidenz. Gegen diese IOCs kannst du schneller und entschlossener handeln.",
    "dogru.bos":
      "Du hast noch keine Community-verifizierten (doppelt markierten) Bedrohungen. Die Überschneidung steigt, je mehr du beiträgst.",
    "dogru.satir": "{gozlem} Beobachtungen bei dir · {dugum} Knoten in der Community · {tur}",
    "dogru.birlesikGuven": "kombinierte Konfidenz",

    "kar.baslik": "Reziprozität — Netzwerkeffekt-Wert",
    "kar.katkiliyorsun": "Du trägst bei",
    "kar.iocPaylasimda": "IOCs geteilt",
    "kar.verilenAciklama":
      "Die von dir beobachteten bösartigen Indikatoren speisen das Netzwerk anonym — die künftige Abwehr eines anderen Knotens wird durch deine Daten stärker.",
    "kar.kazaniyorsun": "Du gewinnst",
    "kar.proaktifEngelleme": "proaktive Blockierungen",
    "kar.kazanilanAciklama":
      "Bedrohungen, die die Community markiert hat, die du aber noch nicht gesehen hast. Indem du sie vorab blockierst, verringerst du deine Zero-Day-Exposition.",
    "kar.dogrulanan": "Verifizierte Bedrohungen",
    "kar.kaldirac": "Netzwerkeffekt-Hebel",
    "kar.katkiPuani": "Beitragspunktzahl",
    "kar.kademe": "Reputationsstufe",
    "kar.notBaslik": "Wie funktioniert der Netzwerkeffekt?",
    "kar.not.1":
      "Je mehr du beiträgst, desto höher sind Überschneidung und Verifizierung; auch der proaktive Schutz, den du aus dem Community-Feed ziehst, wächst. Ein allein verteidigendes System kennt nur, was es selbst sieht — in der kollektiven Abwehr",
    "kar.not.2": "sieht mit den Augen des Netzwerks.",

    "giz.baslik": "Datenschutz- & Freigabeeinstellungen",
    "giz.katkiBaslik": "Zur Community beitragen",
    "giz.katkiAciklama":
      "Beobachtete bösartige IOCs anonym an das Community-Netzwerk weiterleiten (Hauptschalter).",
    "giz.otomatikBaslik": "Neue IOCs automatisch teilen",
    "giz.otomatikAciklama":
      "Künftig neu beobachtete Indikatoren automatisch in die Freigabe einbeziehen.",
    "giz.neBaslik": "Was geteilt wird und was nicht",
    "giz.evet.1": "IOC-Indikator: IP-Adresse, ASN, Geräte-Fingerabdruck-Hash",
    "giz.evet.2": "Anonyme Beobachtungszahl und Bedrohungskategorie",
    "giz.hayir.1": "Website-Name, Domain, URL oder Pfad",
    "giz.hayir.2": "Personenbezogene Daten von Nutzern / Besuchern (PII)",
    "giz.hayir.3": "Konto-, API-Schlüssel- oder Konfigurationsdaten",
    "giz.ifsaBaslik": "Ehrliche Offenlegung:",
    "giz.ifsa":
      "Deine Beitragsdaten (die Tabelle oben) werden aus den echten Beobachtungen deiner Sites abgeleitet. Die im Gegenzug gezeigte Community-Summe ist repräsentativ — ein deterministisches Analysemodell, nicht die Live-Daten echter anderer Kunden. In einem echten Produkt funktioniert diese Schicht durch die Aggregation anonymisierter IOCs in einem mandantenübergreifenden Vertrauensnetzwerk (CrowdSec / kollektives Sicherheitsmodell). Deine Freigabeeinstellungen werden in diesem Browser gespeichert.",

    "toast.acikBaslik": "Community-Beitrag aktiviert",
    "toast.kapaliBaslik": "Community-Beitrag deaktiviert",
    "toast.acikAciklama": "Deine IOCs werden anonym an das Community-Netzwerk weitergeleitet.",
    "toast.kapaliAciklama": "Es werden keine IOCs mehr geteilt.",
    "toast.tumuBaslik": "Alle IOCs zur Freigabe geöffnet",
    "toast.tumuAciklama": "{n} Indikatoren werden an das Community-Netzwerk weitergeleitet.",
    "toast.engelleBaslik": "Blockierregel-Entwurf bereit",
    "toast.engelleAciklama":
      "Eine community-basierte Blockierregel für {deger} kann im Regeln-Modul erstellt werden.",

    "kademe.Bronz": "Bronze",
    "kademe.Gümüş": "Silber",
    "kademe.Altın": "Gold",
    "kademe.Platin": "Platin",

    "tur.ip": "IP-Adresse",
    "tur.asn": "ASN",
    "tur.fingerprint": "Geräte-Fingerabdruck",

    "kategori.botnet": "Botnet / C2",
    "kategori.credential_stuffing": "Credential Stuffing",
    "kategori.scraper": "Content-Scraper",
    "kategori.scanner": "Scanner",
    "kategori.spam": "Spam-Quelle",
    "kategori.proxy_abuse": "Proxy/VPN-Missbrauch",
    "kategori.ddos": "DDoS",
  },

  fr: {
    "serit.baslik": "Défense par effet de réseau : chaque contribution renforce tout le monde.",
    "serit.aciklama":
      "Contribuez anonymement à la communauté les IOC malveillants que vous observez (IP, ASN, empreinte d'appareil) ; en retour, bloquez les menaces vues en premier sur d'autres nœuds avant même de les voir. Une attaque détectée chez un client devient une menace pré-connue pour tout le réseau.",

    "kart.katkiIoc": "IOC contribuables",
    "kart.dogrulanmis": "Menaces vérifiées par la communauté",
    "kart.proaktif": "Gain proactif (pas encore chez vous)",
    "kart.katkiPuani": "Score de contribution",

    "ag.ad": "Réseau communautaire Veylify",
    "ag.temsili": "représentatif",
    "ag.dugum": "nœuds",
    "ag.havuz": "IOC malveillants connus (pool collectif simulé)",
    "ag.katkici": "contributeur",
    "ag.katki": "Contribution communautaire",

    "gorsel.katkiSagligi": "Santé de contribution",
    "gorsel.puanTavan": "/ 900 pts",
    "gorsel.savunmaProfili": "Profil de défense par type",
    "gorsel.kategoriDagilim": "Répartition par catégorie de menace",
    "gorsel.iocMerkez": "IOC",
    "gorsel.guvenBandi": "Bande de confiance communautaire",
    "gorsel.guvenBandiAlt": "Nombre d'IOC / plage de confiance",
    "gorsel.enYaygin": "Vos contributions les plus répandues (nœuds)",
    "gorsel.veriYok": "Aucune donnée",
    "radar.kapsam": "Partage",
    "radar.dogrulama": "Vérification",

    "katki.baslik": "Mes contributions",
    "katki.gercekVerin": "vos vraies données",
    "katki.hepsi": "Tous",
    "katki.parmakIzi": "Empreinte",
    "katki.tumunuPaylas": "Tout partager",
    "katki.anonimNot.1": "Le partage est",
    "katki.anonimNot.2": "anonyme",
    "katki.anonimNot.3":
      "et n'inclut que l'indicateur IOC (hash IP / ASN / empreinte) — aucune PII, aucun nom de site, aucune URL ni donnée utilisateur n'est partagé. Actuellement",
    "katki.anonimNot.4": "IOC sont partagés.",
    "katki.bosBaslik": "Aucun IOC contribuable pour l'instant",
    "katki.bosAciklama":
      "À mesure que vos sites observent du trafic malveillant (événements bloqués / signalés), les indicateurs contribuables s'accumulent ici. Vous pouvez profiter immédiatement de la protection proactive du flux communautaire ci-dessous.",
    "katki.th.gosterge": "Indicateur (IOC)",
    "katki.th.tur": "Type",
    "katki.th.gozlem": "Observations",
    "katki.th.tehdit": "Score de menace",
    "katki.th.guven": "Confiance suggérée",
    "katki.th.topluluk": "Communauté",
    "katki.th.paylas": "Partager",
    "katki.dugum": "nœuds",
    "katki.yalnizSende": "seulement vous",
    "katki.paylasAria": "Partager {deger}",

    "besleme.baslik": "Renseignement communautaire",
    "besleme.rozet": "réseau communautaire représentatif",
    "besleme.uyari":
      "Les indicateurs ci-dessous proviennent d'un réseau communautaire simulé (modèle représentatif déterministe). Le nombre de nœuds et la confiance globale ne sont pas de vrais autres clients mais un profil de renseignement représentatif stable de l'IOC. Vous n'avez pas encore vu ceux marqués en jaune — vous pouvez les bloquer de manière proactive.",
    "besleme.sendeVar": "déjà chez vous",
    "besleme.yeni": "nouveau",
    "besleme.dugum": "nœuds",
    "besleme.kureselGuven": "Confiance globale",
    "besleme.ilkGorulme": "Première observation : {tarih}",
    "besleme.engelle": "Bloquer",

    "dogru.baslik": "Vos menaces vérifiées par la communauté",
    "dogru.aciklama":
      "Vous les avez observées et le réseau communautaire les a aussi signalées — une double vérification signifie une confiance plus élevée. Vous pouvez agir plus vite et plus fermement contre ces IOC.",
    "dogru.bos":
      "Vous n'avez pas encore de menaces vérifiées par la communauté (doublement signalées). Le recoupement augmente à mesure que votre contribution croît.",
    "dogru.satir": "{gozlem} observations de votre côté · {dugum} nœuds dans la communauté · {tur}",
    "dogru.birlesikGuven": "confiance combinée",

    "kar.baslik": "Réciprocité — valeur de l'effet de réseau",
    "kar.katkiliyorsun": "Vous contribuez",
    "kar.iocPaylasimda": "IOC partagés",
    "kar.verilenAciklama":
      "Les indicateurs malveillants que vous observez alimentent le réseau de façon anonyme — la défense future d'un autre nœud se renforce grâce à vos données.",
    "kar.kazaniyorsun": "Vous gagnez",
    "kar.proaktifEngelleme": "blocages proactifs",
    "kar.kazanilanAciklama":
      "Des menaces que la communauté a signalées mais que vous n'avez pas encore vues. En les bloquant en amont, vous réduisez votre exposition au jour zéro.",
    "kar.dogrulanan": "Menaces vérifiées",
    "kar.kaldirac": "Levier de l'effet de réseau",
    "kar.katkiPuani": "Score de contribution",
    "kar.kademe": "Palier de réputation",
    "kar.notBaslik": "Comment fonctionne l'effet de réseau ?",
    "kar.not.1":
      "Plus vous contribuez, plus le recoupement et la vérification augmentent ; la protection proactive que vous tirez du flux communautaire croît aussi. Un système qui se défend seul ne connaît que ce qu'il voit — en défense collective,",
    "kar.not.2": "voit avec les yeux du réseau.",

    "giz.baslik": "Paramètres de confidentialité et de partage",
    "giz.katkiBaslik": "Contribuer à la communauté",
    "giz.katkiAciklama":
      "Transférer anonymement les IOC malveillants observés au réseau communautaire (interrupteur principal).",
    "giz.otomatikBaslik": "Partager automatiquement les nouveaux IOC",
    "giz.otomatikAciklama":
      "Inclure automatiquement dans le partage les indicateurs nouvellement observés à l'avenir.",
    "giz.neBaslik": "Ce qui est partagé, ce qui ne l'est pas",
    "giz.evet.1": "Indicateur IOC : adresse IP, ASN, hash d'empreinte d'appareil",
    "giz.evet.2": "Nombre d'observations anonymes et catégorie de menace",
    "giz.hayir.1": "Nom de site, domaine, URL ou chemin",
    "giz.hayir.2": "Données personnelles d'utilisateur / visiteur (PII)",
    "giz.hayir.3": "Données de compte, clé API ou configuration",
    "giz.ifsaBaslik": "Divulgation honnête :",
    "giz.ifsa":
      "Vos données de contribution (le tableau ci-dessus) sont dérivées des observations réelles de vos sites. Le total communautaire affiché en retour est représentatif — un modèle de renseignement déterministe, pas les données en direct de véritables autres clients. Dans un vrai produit, cette couche fonctionne en agrégeant des IOC anonymisés dans un réseau de confiance multi-locataire (modèle CrowdSec / sécurité collective). Vos préférences de partage sont stockées dans ce navigateur.",

    "toast.acikBaslik": "Contribution communautaire activée",
    "toast.kapaliBaslik": "Contribution communautaire désactivée",
    "toast.acikAciklama": "Vos IOC sont transférés anonymement au réseau communautaire.",
    "toast.kapaliAciklama": "Aucun IOC n'est plus partagé.",
    "toast.tumuBaslik": "Tous les IOC ouverts au partage",
    "toast.tumuAciklama": "{n} indicateurs sont transférés au réseau communautaire.",
    "toast.engelleBaslik": "Brouillon de règle de blocage prêt",
    "toast.engelleAciklama":
      "Une règle de blocage communautaire pour {deger} peut être créée dans le module Règles.",

    "kademe.Bronz": "Bronze",
    "kademe.Gümüş": "Argent",
    "kademe.Altın": "Or",
    "kademe.Platin": "Platine",

    "tur.ip": "Adresse IP",
    "tur.asn": "ASN",
    "tur.fingerprint": "Empreinte d'appareil",

    "kategori.botnet": "Botnet / C2",
    "kategori.credential_stuffing": "Credential stuffing",
    "kategori.scraper": "Scraper de contenu",
    "kategori.scanner": "Scanner",
    "kategori.spam": "Source de spam",
    "kategori.proxy_abuse": "Abus de proxy/VPN",
    "kategori.ddos": "DDoS",
  },

  es: {
    "serit.baslik": "Defensa por efecto de red: cada contribución fortalece a todos.",
    "serit.aciklama":
      "Contribuye de forma anónima a la comunidad los IOC maliciosos que observas (IP, ASN, huella de dispositivo); a cambio, bloquea amenazas vistas primero en otros nodos antes de que tú las veas. Un ataque detectado en un cliente se convierte en una amenaza conocida de antemano para toda la red.",

    "kart.katkiIoc": "IOC contribuibles",
    "kart.dogrulanmis": "Amenazas verificadas por la comunidad",
    "kart.proaktif": "Ganancia proactiva (aún no tuya)",
    "kart.katkiPuani": "Puntuación de contribución",

    "ag.ad": "Red comunitaria de Veylify",
    "ag.temsili": "representativa",
    "ag.dugum": "nodos",
    "ag.havuz": "IOC maliciosos conocidos (pool colectivo simulado)",
    "ag.katkici": "contribuidor",
    "ag.katki": "Contribución a la comunidad",

    "gorsel.katkiSagligi": "Salud de contribución",
    "gorsel.puanTavan": "/ 900 pts",
    "gorsel.savunmaProfili": "Perfil de defensa por tipo",
    "gorsel.kategoriDagilim": "Distribución por categoría de amenaza",
    "gorsel.iocMerkez": "IOC",
    "gorsel.guvenBandi": "Banda de confianza comunitaria",
    "gorsel.guvenBandiAlt": "Número de IOC / rango de confianza",
    "gorsel.enYaygin": "Tus contribuciones más extendidas (nodos)",
    "gorsel.veriYok": "Sin datos",
    "radar.kapsam": "Compartición",
    "radar.dogrulama": "Verificación",

    "katki.baslik": "Mis contribuciones",
    "katki.gercekVerin": "tus datos reales",
    "katki.hepsi": "Todos",
    "katki.parmakIzi": "Huella",
    "katki.tumunuPaylas": "Compartir todo",
    "katki.anonimNot.1": "El uso compartido es",
    "katki.anonimNot.2": "anónimo",
    "katki.anonimNot.3":
      "e incluye solo el indicador IOC (hash de IP / ASN / huella) — no se comparte ninguna PII, nombre de sitio, URL ni dato de usuario. Actualmente",
    "katki.anonimNot.4": "IOC se están compartiendo.",
    "katki.bosBaslik": "Aún no hay IOC contribuibles",
    "katki.bosAciklama":
      "A medida que tus sitios observen tráfico malicioso (eventos bloqueados / marcados), los indicadores contribuibles se acumulan aquí. Puedes beneficiarte de inmediato de la protección proactiva del feed comunitario de abajo.",
    "katki.th.gosterge": "Indicador (IOC)",
    "katki.th.tur": "Tipo",
    "katki.th.gozlem": "Observaciones",
    "katki.th.tehdit": "Puntuación de amenaza",
    "katki.th.guven": "Confianza sugerida",
    "katki.th.topluluk": "Comunidad",
    "katki.th.paylas": "Compartir",
    "katki.dugum": "nodos",
    "katki.yalnizSende": "solo tú",
    "katki.paylasAria": "Compartir {deger}",

    "besleme.baslik": "Inteligencia comunitaria",
    "besleme.rozet": "red comunitaria representativa",
    "besleme.uyari":
      "Los indicadores de abajo provienen de una red comunitaria simulada (modelo representativo determinista). El número de nodos y la confianza global no son clientes reales, sino un perfil de inteligencia representativo estable del IOC. Los marcados en amarillo aún no los has visto — puedes bloquearlos de forma proactiva.",
    "besleme.sendeVar": "ya tuyo",
    "besleme.yeni": "nuevo",
    "besleme.dugum": "nodos",
    "besleme.kureselGuven": "Confianza global",
    "besleme.ilkGorulme": "Primera aparición: {tarih}",
    "besleme.engelle": "Bloquear",

    "dogru.baslik": "Tus amenazas verificadas por la comunidad",
    "dogru.aciklama":
      "Las observaste tú y la red comunitaria también las marcó — la verificación doble significa mayor confianza. Puedes actuar más rápido y con más decisión contra estos IOC.",
    "dogru.bos":
      "Aún no tienes amenazas verificadas por la comunidad (marcadas doblemente). El solapamiento aumenta a medida que crece tu contribución.",
    "dogru.satir": "{gozlem} observaciones de tu lado · {dugum} nodos en la comunidad · {tur}",
    "dogru.birlesikGuven": "confianza combinada",

    "kar.baslik": "Reciprocidad — valor del efecto de red",
    "kar.katkiliyorsun": "Tú contribuyes",
    "kar.iocPaylasimda": "IOC compartidos",
    "kar.verilenAciklama":
      "Los indicadores maliciosos que observas alimentan la red de forma anónima — la defensa futura de otro nodo se fortalece con tus datos.",
    "kar.kazaniyorsun": "Tú ganas",
    "kar.proaktifEngelleme": "bloqueos proactivos",
    "kar.kazanilanAciklama":
      "Amenazas que la comunidad marcó pero que tú aún no has visto. Al bloquearlas de antemano, reduces tu exposición a día cero.",
    "kar.dogrulanan": "Amenazas verificadas",
    "kar.kaldirac": "Apalancamiento del efecto de red",
    "kar.katkiPuani": "Puntuación de contribución",
    "kar.kademe": "Nivel de reputación",
    "kar.notBaslik": "¿Cómo funciona el efecto de red?",
    "kar.not.1":
      "Cuanto más contribuyes, mayor es el solapamiento y la verificación; también crece la protección proactiva que obtienes del feed comunitario. Un sistema que se defiende solo solo conoce lo que ve — en defensa colectiva,",
    "kar.not.2": "ve con los ojos de la red.",

    "giz.baslik": "Ajustes de privacidad y de uso compartido",
    "giz.katkiBaslik": "Contribuir a la comunidad",
    "giz.katkiAciklama":
      "Reenviar de forma anónima los IOC maliciosos observados a la red comunitaria (interruptor principal).",
    "giz.otomatikBaslik": "Compartir automáticamente los nuevos IOC",
    "giz.otomatikAciklama":
      "Incluir automáticamente en el uso compartido los indicadores observados en el futuro.",
    "giz.neBaslik": "Qué se comparte y qué no",
    "giz.evet.1": "Indicador IOC: dirección IP, ASN, hash de huella de dispositivo",
    "giz.evet.2": "Recuento anónimo de observaciones y categoría de amenaza",
    "giz.hayir.1": "Nombre de sitio, dominio, URL o ruta",
    "giz.hayir.2": "Datos personales de usuario / visitante (PII)",
    "giz.hayir.3": "Datos de cuenta, clave API o configuración",
    "giz.ifsaBaslik": "Divulgación honesta:",
    "giz.ifsa":
      "Tus datos de contribución (la tabla de arriba) se derivan de las observaciones reales de tus sitios. El total comunitario mostrado a cambio es representativo — un modelo de inteligencia determinista, no los datos en vivo de otros clientes reales. En un producto real, esta capa funciona agregando IOC anonimizados en una red de confianza multiinquilino (modelo CrowdSec / seguridad colectiva). Tus preferencias de uso compartido se guardan en este navegador.",

    "toast.acikBaslik": "Contribución a la comunidad activada",
    "toast.kapaliBaslik": "Contribución a la comunidad desactivada",
    "toast.acikAciklama": "Tus IOC se reenvían de forma anónima a la red comunitaria.",
    "toast.kapaliAciklama": "Ya no se comparte ningún IOC.",
    "toast.tumuBaslik": "Todos los IOC abiertos para compartir",
    "toast.tumuAciklama": "{n} indicadores se están reenviando a la red comunitaria.",
    "toast.engelleBaslik": "Borrador de regla de bloqueo listo",
    "toast.engelleAciklama":
      "Se puede crear una regla de bloqueo basada en la comunidad para {deger} en el módulo Reglas.",

    "kademe.Bronz": "Bronce",
    "kademe.Gümüş": "Plata",
    "kademe.Altın": "Oro",
    "kademe.Platin": "Platino",

    "tur.ip": "Dirección IP",
    "tur.asn": "ASN",
    "tur.fingerprint": "Huella de dispositivo",

    "kategori.botnet": "Botnet / C2",
    "kategori.credential_stuffing": "Relleno de credenciales",
    "kategori.scraper": "Scraper de contenido",
    "kategori.scanner": "Escáner",
    "kategori.spam": "Fuente de spam",
    "kategori.proxy_abuse": "Abuso de proxy/VPN",
    "kategori.ddos": "DDoS",
  },
};

/** Anahtarı verilen dile çevir; yoksa TR'ye, o da yoksa anahtara düşer. */
export function toplulukCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
