/**
 * Kayıtlı Avlar sayfası — yerel çeviri sözlüğü + motor-metni yeniden türetme.
 *
 * Sadece bu sayfaya özgü kullanıcı-görünür metinleri içerir. Paylaşılan
 * `src/lib/i18n/panel.ts` ve motor kütüphanesi `./avlar.ts` DEĞİŞTİRİLMEZ.
 * Anahtar bulunamazsa TR'ye, o da yoksa anahtarın kendisine düşer.
 *
 * ENUM GÜVENLİĞİ
 * --------------
 * `avlar.ts` her av için Türkçe ad/açıklama/etiket üretir ve kategori/şiddet/
 * sıklık için label-map (KATEGORI_ETIKET vb.) tutar. Lib'i düzenleyemediğimiz
 * için:
 *   - Kategori/şiddet/sıklık etiketleri `key` (enum) ile eşlenir → çevrilir;
 *     `key` değeri asla çevrilmez (label-map → key-map).
 *   - Av `ad`/`aciklama` metinleri kararlı `id` ile eşlenir → çevrilir.
 *   - `sorgu` (DSL) ve `etiketler` VERİ olarak kalır (sorgu sözdizimi) — çevrilmez.
 * Sayılar/eşikler VERİ olarak kalır; yalnızca yerelleştirilmiş biçimlenir.
 */
import type { Dil } from "@/lib/i18n/panel";
import type { AvKategori, AvSiddet, AvSiklik } from "./avlar";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // Sayfa başlığı / kırıntı
    "ka.baslik": "Kayıtlı Avlar & Zamanlanmış Tehdit Avı",

    // Üst şerit
    "ka.serit.aciklama":
      "Yeniden kullanılabilir tehdit avı kütüphanesi. {n} gerçek olay üzerinde canlı DSL motoruyla çalışır.",
    "ka.serit.yeniAv": "Yeni av kaydet",

    // Özet kartları
    "ka.ozet.toplamAv": "Toplam av",
    "ka.ozet.tetiklenen": "Tetiklenen (eşleşti)",
    "ka.ozet.zamanliAv": "Zamanlanmış av",
    "ka.ozet.kritikTetik": "Kritik tetik",

    // Dürüstlük notu
    "ka.not.baslik": "Bu nasıl çalışır?",
    "ka.not.govde":
      "Avlar, hesabınızın gerçek olaylarına karşı /panel/tehdit-avi ile aynı DSL motoruyla çalıştırılır. “Zamanlanmış” ve “uyarı” katmanı burada temsilen gösterilir: aşağıdaki liste, avın şu an çalıştırılsa neyi tetikleyeceğini gösterir. Üretimde periyodik zamanlayıcı (cron) sunucu tarafında ayrı çalışır. Kaydettiğiniz özel avlar yalnızca bu tarayıcıda (localStorage) saklanır.",

    // Zamanlanmış avlar & uyarılar
    "ka.zamanli.baslik": "Zamanlanmış avlar & uyarılar",
    "ka.zamanli.rozet": "{n} zamanlı",
    "ka.zamanli.bos": "Zamanlanmış av yok.",
    "ka.zamanli.tetiklenirdi": "{n} zamanlanmış av şu an tetiklenirdi",
    "ka.zamanli.tetiklenirdiGovde":
      "Bu avlar, mevcut olaylarınızda eşik değerini aştı. Gerçek zamanlayıcıda bunlar uyarı üretirdi.",
    "ka.zamanli.esik": "/ eşik {n}",
    "ka.zamanli.tetiklendi": "Tetiklendi",
    "ka.zamanli.sakin": "Sakin",

    // Arama + filtre
    "ka.arama.placeholder": "Av, açıklama, sorgu veya etiket ara…",
    "ka.arama.aria": "Avlarda ara",
    "ka.filtre.hepsi": "Hepsi",

    // Av kütüphanesi
    "ka.kutuphane.baslik": "Av kütüphanesi",
    "ka.kutuphane.sayac": "{n} av",
    "ka.kutuphane.bosBaslik": "Eşleşen av yok",
    "ka.kutuphane.bosAciklama": "Arama terimini veya kategori filtresini değiştirin.",

    // Görsel panel başlıkları (dashboard zenginleştirme)
    "ka.gorsel.bulguDagilimi": "Bulgu dağılımı",
    "ka.gorsel.bulguMerkez": "eşleşme",
    "ka.gorsel.kategoriYogunluk": "Kategori × şiddet yoğunluğu",
    "ka.gorsel.avBasari": "Av başarı oranı",
    "ka.gorsel.avBasariEtiket": "tetiklenen",
    "ka.gorsel.kapsamaProfili": "Kapsama profili",
    "ka.gorsel.tetikDagilimi": "Eşik'e yakınlık",
    "ka.gorsel.kategoriKapsama": "Kategori kapsaması",
    "ka.gorsel.tetiklenenAv": "tetiklenen",
    "ka.gorsel.toplamEslesme": "toplam eşleşme",
    "ka.gorsel.enAktifKategori": "en aktif kategori",
    "ka.gorsel.ortEsik": "ort. eşik",

    // Av kartı
    "ka.kart.dslSorgusu": "DSL sorgusu",
    "ka.kart.eslesme": "eşleşme",
    "ka.kart.tetikEsigi": "tetik eşiği",
    "ka.kart.konsoldaCalistir": "Konsolda çalıştır",
    "ka.kart.tehditAvindaAc": "Tehdit avında aç",

    // Özel avlar
    "ka.ozel.baslik": "Özel avlarım",
    "ka.ozel.rozet": "{n} kayıt · yalnızca bu tarayıcı",
    "ka.ozel.bos":
      "Henüz özel av kaydetmediniz. “Yeni av kaydet” ile kendi DSL sorgunuzu kütüphaneye ekleyin.",
    "ka.ozel.calistir": "Çalıştır",
    "ka.ozel.sil": "Avı sil",
    "ka.ozel.silindiBaslik": "Av silindi",
    "ka.ozel.kaydedildiBaslik": "Av kaydedildi",

    // Yeni av modalı
    "ka.modal.baslik": "Yeni av kaydet",
    "ka.modal.aciklama": "Kendi DSL sorgunuzu adlandırıp kütüphaneye ekleyin.",
    "ka.modal.avAdi": "Av adı",
    "ka.modal.avAdiPlaceholder": "Örn. Şüpheli ödeme yolları",
    "ka.modal.aciklamaEtiket": "Açıklama",
    "ka.modal.aciklamaPlaceholder": "Bu av neyi arıyor?",
    "ka.modal.kategori": "Kategori",
    "ka.modal.dslSorgusu": "DSL sorgusu",
    "ka.modal.sorguGecerli": "Sorgu geçerli — kaydedilebilir.",
    "ka.modal.ipucu.alanlar": "Alanlar:",
    "ka.modal.ipucu.operatorler": "Operatörler:",
    "ka.modal.ipucu.deger": "alan:değer",
    "ka.modal.ipucu.birlestirme": "birleştirme",
    "ka.modal.iptal": "İptal",
    "ka.modal.aviKaydet": "Avı kaydet",

    // Kategori etiketleri (key-map)
    "ka.kat.kimlik": "Kimlik",
    "ka.kat.kazima": "Kazıma",
    "ka.kat.ai": "AI Botları",
    "ka.kat.atlatma": "Atlatma",
    "ka.kat.ddos": "DDoS",
    "ka.kat.kesif": "Keşif",

    // Şiddet etiketleri (key-map)
    "ka.siddet.kritik": "Kritik",
    "ka.siddet.yuksek": "Yüksek",
    "ka.siddet.orta": "Orta",
    "ka.siddet.dusuk": "Düşük",

    // Sıklık etiketleri (key-map)
    "ka.siklik.5dk": "5 dakikada bir",
    "ka.siklik.saatlik": "Saatlik",
    "ka.siklik.günlük": "Günlük",

    // Av adları (id-map)
    "ka.av.av-hizli-kimlik-doldurma.ad": "Hızlı kimlik doldurma",
    "ka.av.av-hizli-kimlik-doldurma.aciklama":
      "Login yoluna gelen kimlik doldurma (credential stuffing) trafiği.",
    "ka.av.av-datacenter-kaziyici.ad": "Datacenter kazıyıcıları",
    "ka.av.av-datacenter-kaziyici.aciklama":
      "Datacenter ASN'lerinden gelen içerik kazıma (scraper) trafiği.",
    "ka.av.av-sahte-tarayici-tls.ad": "Sahte tarayıcı (TLS uyumsuz)",
    "ka.av.av-sahte-tarayici-tls.aciklama":
      "UA kendini tarayıcı gösterir ama TLS parmak izi uyuşmaz.",
    "ka.av.av-ai-egitim-botlari.ad": "AI eğitim botları",
    "ka.av.av-ai-egitim-botlari.aciklama":
      "Model eğitimi için içerik toplayan AI ajan/crawler trafiği.",
    "ka.av.av-yuksek-risk-cografya.ad": "Yüksek-riskli coğrafya + düşük skor",
    "ka.av.av-yuksek-risk-cografya.aciklama":
      "Yüksek-riskli ülkelerden gelen, insanlık skoru çok düşük istekler.",
    "ka.av.av-headless-otomasyon.ad": "Headless otomasyon",
    "ka.av.av-headless-otomasyon.aciklama":
      "Puppeteer/Playwright/Selenium headless tarayıcı imzaları.",
    "ka.av.av-hassas-yol-kesfi.ad": "Hassas yol keşfi",
    "ka.av.av-hassas-yol-kesfi.aciklama":
      "Yönetim/API/env gibi hassas yolları yoklayan keşif trafiği.",
    "ka.av.av-python-arac-trafigi.ad": "Python/araç istemcileri",
    "ka.av.av-python-arac-trafigi.aciklama":
      "python-requests / curl / go-http gibi HTTP kütüphanesi istemcileri.",
    "ka.av.av-ddos-yuksek-hacim.ad": "DDoS / yüksek-hacim engelleme",
    "ka.av.av-ddos-yuksek-hacim.aciklama":
      "DDoS sınıfı, yüksek güvenle engellenmiş yoğun trafik.",
    "ka.av.av-dusuk-skor-engellenen.ad": "Yüksek güvenli bot engellemeleri",
    "ka.av.av-dusuk-skor-engellenen.aciklama":
      "Çok düşük insanlık skoruyla bot kabul edilip engellenen istekler.",
    "ka.av.av-motor-yok-otomasyon.ad": "Tarayıcı motoru yok (ham istemci)",
    "ka.av.av-motor-yok-otomasyon.aciklama":
      "Gerçek bir tarayıcı motoru raporlamayan (Blink/Gecko/WebKit değil) istemciler.",
    "ka.av.av-yavas-supheli.ad": "Yavaş + şüpheli trafik",
    "ka.av.av-yavas-supheli.aciklama":
      "Olağandışı yüksek gecikmeli, düşük skorlu şüpheli istekler.",
  },

  en: {
    "ka.baslik": "Saved Hunts & Scheduled Threat Hunting",

    "ka.serit.aciklama":
      "A reusable threat-hunting library. Runs on {n} real events with a live DSL engine.",
    "ka.serit.yeniAv": "Save new hunt",

    "ka.ozet.toplamAv": "Total hunts",
    "ka.ozet.tetiklenen": "Triggered (matched)",
    "ka.ozet.zamanliAv": "Scheduled hunts",
    "ka.ozet.kritikTetik": "Critical triggers",

    "ka.not.baslik": "How does this work?",
    "ka.not.govde":
      "Hunts run against your account's real events with the same DSL engine as /panel/tehdit-avi. The “scheduled” and “alert” layer is shown here representatively: the list below shows what the hunt would trigger if run right now. In production, the periodic scheduler (cron) runs separately on the server. Custom hunts you save are stored only in this browser (localStorage).",

    "ka.zamanli.baslik": "Scheduled hunts & alerts",
    "ka.zamanli.rozet": "{n} scheduled",
    "ka.zamanli.bos": "No scheduled hunts.",
    "ka.zamanli.tetiklenirdi": "{n} scheduled hunts would trigger right now",
    "ka.zamanli.tetiklenirdiGovde":
      "These hunts exceeded their threshold on your current events. In a real scheduler they would raise alerts.",
    "ka.zamanli.esik": "/ threshold {n}",
    "ka.zamanli.tetiklendi": "Triggered",
    "ka.zamanli.sakin": "Quiet",

    "ka.arama.placeholder": "Search hunts, description, query or tag…",
    "ka.arama.aria": "Search hunts",
    "ka.filtre.hepsi": "All",

    "ka.kutuphane.baslik": "Hunt library",
    "ka.kutuphane.sayac": "{n} hunts",
    "ka.kutuphane.bosBaslik": "No matching hunts",
    "ka.kutuphane.bosAciklama": "Change the search term or category filter.",

    "ka.gorsel.bulguDagilimi": "Findings distribution",
    "ka.gorsel.bulguMerkez": "matches",
    "ka.gorsel.kategoriYogunluk": "Category × severity intensity",
    "ka.gorsel.avBasari": "Hunt trigger rate",
    "ka.gorsel.avBasariEtiket": "triggered",
    "ka.gorsel.kapsamaProfili": "Coverage profile",
    "ka.gorsel.tetikDagilimi": "Proximity to threshold",
    "ka.gorsel.kategoriKapsama": "Category coverage",
    "ka.gorsel.tetiklenenAv": "triggered",
    "ka.gorsel.toplamEslesme": "total matches",
    "ka.gorsel.enAktifKategori": "most active category",
    "ka.gorsel.ortEsik": "avg. threshold",

    "ka.kart.dslSorgusu": "DSL query",
    "ka.kart.eslesme": "matches",
    "ka.kart.tetikEsigi": "trigger threshold",
    "ka.kart.konsoldaCalistir": "Run in console",
    "ka.kart.tehditAvindaAc": "Open in threat hunt",

    "ka.ozel.baslik": "My custom hunts",
    "ka.ozel.rozet": "{n} saved · this browser only",
    "ka.ozel.bos":
      "You haven't saved any custom hunts yet. Use “Save new hunt” to add your own DSL query to the library.",
    "ka.ozel.calistir": "Run",
    "ka.ozel.sil": "Delete hunt",
    "ka.ozel.silindiBaslik": "Hunt deleted",
    "ka.ozel.kaydedildiBaslik": "Hunt saved",

    "ka.modal.baslik": "Save new hunt",
    "ka.modal.aciklama": "Name your own DSL query and add it to the library.",
    "ka.modal.avAdi": "Hunt name",
    "ka.modal.avAdiPlaceholder": "E.g. Suspicious payment paths",
    "ka.modal.aciklamaEtiket": "Description",
    "ka.modal.aciklamaPlaceholder": "What is this hunt looking for?",
    "ka.modal.kategori": "Category",
    "ka.modal.dslSorgusu": "DSL query",
    "ka.modal.sorguGecerli": "Query valid — ready to save.",
    "ka.modal.ipucu.alanlar": "Fields:",
    "ka.modal.ipucu.operatorler": "Operators:",
    "ka.modal.ipucu.deger": "field:value",
    "ka.modal.ipucu.birlestirme": "combine with",
    "ka.modal.iptal": "Cancel",
    "ka.modal.aviKaydet": "Save hunt",

    "ka.kat.kimlik": "Identity",
    "ka.kat.kazima": "Scraping",
    "ka.kat.ai": "AI Bots",
    "ka.kat.atlatma": "Evasion",
    "ka.kat.ddos": "DDoS",
    "ka.kat.kesif": "Recon",

    "ka.siddet.kritik": "Critical",
    "ka.siddet.yuksek": "High",
    "ka.siddet.orta": "Medium",
    "ka.siddet.dusuk": "Low",

    "ka.siklik.5dk": "Every 5 minutes",
    "ka.siklik.saatlik": "Hourly",
    "ka.siklik.günlük": "Daily",

    "ka.av.av-hizli-kimlik-doldurma.ad": "Fast credential stuffing",
    "ka.av.av-hizli-kimlik-doldurma.aciklama":
      "Credential stuffing traffic hitting the login path.",
    "ka.av.av-datacenter-kaziyici.ad": "Datacenter scrapers",
    "ka.av.av-datacenter-kaziyici.aciklama":
      "Content-scraping (scraper) traffic from datacenter ASNs.",
    "ka.av.av-sahte-tarayici-tls.ad": "Fake browser (TLS mismatch)",
    "ka.av.av-sahte-tarayici-tls.aciklama":
      "The UA claims to be a browser but the TLS fingerprint doesn't match.",
    "ka.av.av-ai-egitim-botlari.ad": "AI training bots",
    "ka.av.av-ai-egitim-botlari.aciklama":
      "AI agent/crawler traffic collecting content for model training.",
    "ka.av.av-yuksek-risk-cografya.ad": "High-risk geography + low score",
    "ka.av.av-yuksek-risk-cografya.aciklama":
      "Requests from high-risk countries with a very low humanity score.",
    "ka.av.av-headless-otomasyon.ad": "Headless automation",
    "ka.av.av-headless-otomasyon.aciklama":
      "Puppeteer/Playwright/Selenium headless browser signatures.",
    "ka.av.av-hassas-yol-kesfi.ad": "Sensitive path recon",
    "ka.av.av-hassas-yol-kesfi.aciklama":
      "Recon traffic probing sensitive paths like admin/API/env.",
    "ka.av.av-python-arac-trafigi.ad": "Python/tooling clients",
    "ka.av.av-python-arac-trafigi.aciklama":
      "HTTP library clients like python-requests / curl / go-http.",
    "ka.av.av-ddos-yuksek-hacim.ad": "DDoS / high-volume blocking",
    "ka.av.av-ddos-yuksek-hacim.aciklama":
      "DDoS-class, high-confidence blocked heavy traffic.",
    "ka.av.av-dusuk-skor-engellenen.ad": "High-confidence bot blocks",
    "ka.av.av-dusuk-skor-engellenen.aciklama":
      "Requests accepted as bots and blocked with a very low humanity score.",
    "ka.av.av-motor-yok-otomasyon.ad": "No browser engine (raw client)",
    "ka.av.av-motor-yok-otomasyon.aciklama":
      "Clients reporting no real browser engine (not Blink/Gecko/WebKit).",
    "ka.av.av-yavas-supheli.ad": "Slow + suspicious traffic",
    "ka.av.av-yavas-supheli.aciklama":
      "Unusually high-latency, low-score suspicious requests.",
  },

  de: {
    "ka.baslik": "Gespeicherte Jagden & geplante Bedrohungsjagd",

    "ka.serit.aciklama":
      "Eine wiederverwendbare Bedrohungsjagd-Bibliothek. Läuft auf {n} echten Ereignissen mit einer Live-DSL-Engine.",
    "ka.serit.yeniAv": "Neue Jagd speichern",

    "ka.ozet.toplamAv": "Jagden gesamt",
    "ka.ozet.tetiklenen": "Ausgelöst (getroffen)",
    "ka.ozet.zamanliAv": "Geplante Jagden",
    "ka.ozet.kritikTetik": "Kritische Auslöser",

    "ka.not.baslik": "Wie funktioniert das?",
    "ka.not.govde":
      "Jagden laufen gegen die echten Ereignisse deines Kontos mit derselben DSL-Engine wie /panel/tehdit-avi. Die „geplante“ und „Alarm“-Ebene wird hier repräsentativ gezeigt: Die Liste unten zeigt, was die Jagd auslösen würde, wenn sie jetzt liefe. In der Produktion läuft der periodische Scheduler (Cron) separat auf dem Server. Von dir gespeicherte eigene Jagden werden nur in diesem Browser (localStorage) gespeichert.",

    "ka.zamanli.baslik": "Geplante Jagden & Alarme",
    "ka.zamanli.rozet": "{n} geplant",
    "ka.zamanli.bos": "Keine geplanten Jagden.",
    "ka.zamanli.tetiklenirdi": "{n} geplante Jagden würden jetzt auslösen",
    "ka.zamanli.tetiklenirdiGovde":
      "Diese Jagden haben bei deinen aktuellen Ereignissen ihren Schwellenwert überschritten. In einem echten Scheduler würden sie Alarme erzeugen.",
    "ka.zamanli.esik": "/ Schwelle {n}",
    "ka.zamanli.tetiklendi": "Ausgelöst",
    "ka.zamanli.sakin": "Ruhig",

    "ka.arama.placeholder": "Jagd, Beschreibung, Abfrage oder Tag suchen…",
    "ka.arama.aria": "Jagden durchsuchen",
    "ka.filtre.hepsi": "Alle",

    "ka.kutuphane.baslik": "Jagd-Bibliothek",
    "ka.kutuphane.sayac": "{n} Jagden",
    "ka.kutuphane.bosBaslik": "Keine passenden Jagden",
    "ka.kutuphane.bosAciklama": "Ändere den Suchbegriff oder den Kategoriefilter.",

    "ka.kart.dslSorgusu": "DSL-Abfrage",
    "ka.kart.eslesme": "Treffer",
    "ka.kart.tetikEsigi": "Auslöseschwelle",
    "ka.kart.konsoldaCalistir": "In Konsole ausführen",
    "ka.kart.tehditAvindaAc": "In Bedrohungsjagd öffnen",

    "ka.ozel.baslik": "Meine eigenen Jagden",
    "ka.ozel.rozet": "{n} gespeichert · nur dieser Browser",
    "ka.ozel.bos":
      "Du hast noch keine eigenen Jagden gespeichert. Füge mit „Neue Jagd speichern“ deine eigene DSL-Abfrage zur Bibliothek hinzu.",
    "ka.ozel.calistir": "Ausführen",
    "ka.ozel.sil": "Jagd löschen",
    "ka.ozel.silindiBaslik": "Jagd gelöscht",
    "ka.ozel.kaydedildiBaslik": "Jagd gespeichert",

    "ka.modal.baslik": "Neue Jagd speichern",
    "ka.modal.aciklama": "Benenne deine eigene DSL-Abfrage und füge sie zur Bibliothek hinzu.",
    "ka.modal.avAdi": "Jagdname",
    "ka.modal.avAdiPlaceholder": "z. B. Verdächtige Zahlungspfade",
    "ka.modal.aciklamaEtiket": "Beschreibung",
    "ka.modal.aciklamaPlaceholder": "Wonach sucht diese Jagd?",
    "ka.modal.kategori": "Kategorie",
    "ka.modal.dslSorgusu": "DSL-Abfrage",
    "ka.modal.sorguGecerli": "Abfrage gültig — bereit zum Speichern.",
    "ka.modal.ipucu.alanlar": "Felder:",
    "ka.modal.ipucu.operatorler": "Operatoren:",
    "ka.modal.ipucu.deger": "Feld:Wert",
    "ka.modal.ipucu.birlestirme": "verknüpfen mit",
    "ka.modal.iptal": "Abbrechen",
    "ka.modal.aviKaydet": "Jagd speichern",

    "ka.kat.kimlik": "Identität",
    "ka.kat.kazima": "Scraping",
    "ka.kat.ai": "KI-Bots",
    "ka.kat.atlatma": "Umgehung",
    "ka.kat.ddos": "DDoS",
    "ka.kat.kesif": "Aufklärung",

    "ka.siddet.kritik": "Kritisch",
    "ka.siddet.yuksek": "Hoch",
    "ka.siddet.orta": "Mittel",
    "ka.siddet.dusuk": "Niedrig",

    "ka.siklik.5dk": "Alle 5 Minuten",
    "ka.siklik.saatlik": "Stündlich",
    "ka.siklik.günlük": "Täglich",

    "ka.av.av-hizli-kimlik-doldurma.ad": "Schnelles Credential Stuffing",
    "ka.av.av-hizli-kimlik-doldurma.aciklama":
      "Credential-Stuffing-Traffic auf dem Login-Pfad.",
    "ka.av.av-datacenter-kaziyici.ad": "Rechenzentrums-Scraper",
    "ka.av.av-datacenter-kaziyici.aciklama":
      "Content-Scraping-(Scraper-)Traffic aus Rechenzentrums-ASNs.",
    "ka.av.av-sahte-tarayici-tls.ad": "Gefälschter Browser (TLS-Diskrepanz)",
    "ka.av.av-sahte-tarayici-tls.aciklama":
      "Der UA gibt sich als Browser aus, aber der TLS-Fingerabdruck passt nicht.",
    "ka.av.av-ai-egitim-botlari.ad": "KI-Trainingsbots",
    "ka.av.av-ai-egitim-botlari.aciklama":
      "KI-Agent-/Crawler-Traffic, der Inhalte für das Modelltraining sammelt.",
    "ka.av.av-yuksek-risk-cografya.ad": "Hochrisiko-Geografie + niedriger Score",
    "ka.av.av-yuksek-risk-cografya.aciklama":
      "Anfragen aus Hochrisikoländern mit sehr niedrigem Humanity-Score.",
    "ka.av.av-headless-otomasyon.ad": "Headless-Automatisierung",
    "ka.av.av-headless-otomasyon.aciklama":
      "Puppeteer/Playwright/Selenium Headless-Browser-Signaturen.",
    "ka.av.av-hassas-yol-kesfi.ad": "Aufklärung sensibler Pfade",
    "ka.av.av-hassas-yol-kesfi.aciklama":
      "Aufklärungs-Traffic, der sensible Pfade wie Admin/API/env abtastet.",
    "ka.av.av-python-arac-trafigi.ad": "Python-/Tooling-Clients",
    "ka.av.av-python-arac-trafigi.aciklama":
      "HTTP-Bibliotheks-Clients wie python-requests / curl / go-http.",
    "ka.av.av-ddos-yuksek-hacim.ad": "DDoS / Blockierung großer Mengen",
    "ka.av.av-ddos-yuksek-hacim.aciklama":
      "DDoS-Klasse, mit hoher Sicherheit blockierter, starker Traffic.",
    "ka.av.av-dusuk-skor-engellenen.ad": "Bot-Blocks mit hoher Sicherheit",
    "ka.av.av-dusuk-skor-engellenen.aciklama":
      "Anfragen, die mit sehr niedrigem Humanity-Score als Bots akzeptiert und blockiert wurden.",
    "ka.av.av-motor-yok-otomasyon.ad": "Keine Browser-Engine (Raw Client)",
    "ka.av.av-motor-yok-otomasyon.aciklama":
      "Clients, die keine echte Browser-Engine melden (nicht Blink/Gecko/WebKit).",
    "ka.av.av-yavas-supheli.ad": "Langsamer + verdächtiger Traffic",
    "ka.av.av-yavas-supheli.aciklama":
      "Ungewöhnlich hoch-latente, niedrig bewertete verdächtige Anfragen.",
  },

  fr: {
    "ka.baslik": "Chasses enregistrées & chasse aux menaces planifiée",

    "ka.serit.aciklama":
      "Une bibliothèque de chasse aux menaces réutilisable. S'exécute sur {n} événements réels avec un moteur DSL en direct.",
    "ka.serit.yeniAv": "Enregistrer une chasse",

    "ka.ozet.toplamAv": "Chasses au total",
    "ka.ozet.tetiklenen": "Déclenchées (correspondance)",
    "ka.ozet.zamanliAv": "Chasses planifiées",
    "ka.ozet.kritikTetik": "Déclencheurs critiques",

    "ka.not.baslik": "Comment ça marche ?",
    "ka.not.govde":
      "Les chasses s'exécutent sur les événements réels de votre compte avec le même moteur DSL que /panel/tehdit-avi. La couche « planifiée » et « alerte » est présentée ici à titre représentatif : la liste ci-dessous montre ce que la chasse déclencherait si elle était exécutée maintenant. En production, le planificateur périodique (cron) s'exécute séparément côté serveur. Les chasses personnalisées que vous enregistrez sont stockées uniquement dans ce navigateur (localStorage).",

    "ka.zamanli.baslik": "Chasses planifiées & alertes",
    "ka.zamanli.rozet": "{n} planifiées",
    "ka.zamanli.bos": "Aucune chasse planifiée.",
    "ka.zamanli.tetiklenirdi": "{n} chasses planifiées se déclencheraient maintenant",
    "ka.zamanli.tetiklenirdiGovde":
      "Ces chasses ont dépassé leur seuil sur vos événements actuels. Dans un vrai planificateur, elles généreraient des alertes.",
    "ka.zamanli.esik": "/ seuil {n}",
    "ka.zamanli.tetiklendi": "Déclenchée",
    "ka.zamanli.sakin": "Calme",

    "ka.arama.placeholder": "Rechercher chasse, description, requête ou étiquette…",
    "ka.arama.aria": "Rechercher des chasses",
    "ka.filtre.hepsi": "Toutes",

    "ka.kutuphane.baslik": "Bibliothèque de chasses",
    "ka.kutuphane.sayac": "{n} chasses",
    "ka.kutuphane.bosBaslik": "Aucune chasse correspondante",
    "ka.kutuphane.bosAciklama": "Modifiez le terme de recherche ou le filtre de catégorie.",

    "ka.kart.dslSorgusu": "Requête DSL",
    "ka.kart.eslesme": "correspondances",
    "ka.kart.tetikEsigi": "seuil de déclenchement",
    "ka.kart.konsoldaCalistir": "Exécuter dans la console",
    "ka.kart.tehditAvindaAc": "Ouvrir dans la chasse aux menaces",

    "ka.ozel.baslik": "Mes chasses personnalisées",
    "ka.ozel.rozet": "{n} enregistrées · ce navigateur uniquement",
    "ka.ozel.bos":
      "Vous n'avez pas encore enregistré de chasse personnalisée. Utilisez « Enregistrer une chasse » pour ajouter votre propre requête DSL à la bibliothèque.",
    "ka.ozel.calistir": "Exécuter",
    "ka.ozel.sil": "Supprimer la chasse",
    "ka.ozel.silindiBaslik": "Chasse supprimée",
    "ka.ozel.kaydedildiBaslik": "Chasse enregistrée",

    "ka.modal.baslik": "Enregistrer une chasse",
    "ka.modal.aciklama": "Nommez votre propre requête DSL et ajoutez-la à la bibliothèque.",
    "ka.modal.avAdi": "Nom de la chasse",
    "ka.modal.avAdiPlaceholder": "Ex. Chemins de paiement suspects",
    "ka.modal.aciklamaEtiket": "Description",
    "ka.modal.aciklamaPlaceholder": "Que recherche cette chasse ?",
    "ka.modal.kategori": "Catégorie",
    "ka.modal.dslSorgusu": "Requête DSL",
    "ka.modal.sorguGecerli": "Requête valide — prête à enregistrer.",
    "ka.modal.ipucu.alanlar": "Champs :",
    "ka.modal.ipucu.operatorler": "Opérateurs :",
    "ka.modal.ipucu.deger": "champ:valeur",
    "ka.modal.ipucu.birlestirme": "combiner avec",
    "ka.modal.iptal": "Annuler",
    "ka.modal.aviKaydet": "Enregistrer la chasse",

    "ka.kat.kimlik": "Identité",
    "ka.kat.kazima": "Scraping",
    "ka.kat.ai": "Bots IA",
    "ka.kat.atlatma": "Évasion",
    "ka.kat.ddos": "DDoS",
    "ka.kat.kesif": "Reconnaissance",

    "ka.siddet.kritik": "Critique",
    "ka.siddet.yuksek": "Élevée",
    "ka.siddet.orta": "Moyenne",
    "ka.siddet.dusuk": "Faible",

    "ka.siklik.5dk": "Toutes les 5 minutes",
    "ka.siklik.saatlik": "Toutes les heures",
    "ka.siklik.günlük": "Quotidienne",

    "ka.av.av-hizli-kimlik-doldurma.ad": "Credential stuffing rapide",
    "ka.av.av-hizli-kimlik-doldurma.aciklama":
      "Trafic de credential stuffing frappant le chemin de connexion.",
    "ka.av.av-datacenter-kaziyici.ad": "Scrapers de datacenter",
    "ka.av.av-datacenter-kaziyici.aciklama":
      "Trafic de scraping de contenu (scraper) provenant d'ASN de datacenter.",
    "ka.av.av-sahte-tarayici-tls.ad": "Faux navigateur (TLS incohérent)",
    "ka.av.av-sahte-tarayici-tls.aciklama":
      "L'UA se présente comme un navigateur mais l'empreinte TLS ne correspond pas.",
    "ka.av.av-ai-egitim-botlari.ad": "Bots d'entraînement IA",
    "ka.av.av-ai-egitim-botlari.aciklama":
      "Trafic d'agent/crawler IA collectant du contenu pour l'entraînement de modèles.",
    "ka.av.av-yuksek-risk-cografya.ad": "Géographie à haut risque + score faible",
    "ka.av.av-yuksek-risk-cografya.aciklama":
      "Requêtes de pays à haut risque avec un score d'humanité très faible.",
    "ka.av.av-headless-otomasyon.ad": "Automatisation headless",
    "ka.av.av-headless-otomasyon.aciklama":
      "Signatures de navigateurs headless Puppeteer/Playwright/Selenium.",
    "ka.av.av-hassas-yol-kesfi.ad": "Reconnaissance de chemins sensibles",
    "ka.av.av-hassas-yol-kesfi.aciklama":
      "Trafic de reconnaissance sondant des chemins sensibles comme admin/API/env.",
    "ka.av.av-python-arac-trafigi.ad": "Clients Python/outils",
    "ka.av.av-python-arac-trafigi.aciklama":
      "Clients de bibliothèques HTTP comme python-requests / curl / go-http.",
    "ka.av.av-ddos-yuksek-hacim.ad": "DDoS / blocage à haut volume",
    "ka.av.av-ddos-yuksek-hacim.aciklama":
      "Trafic dense de classe DDoS, bloqué avec une grande confiance.",
    "ka.av.av-dusuk-skor-engellenen.ad": "Blocages de bots à haute confiance",
    "ka.av.av-dusuk-skor-engellenen.aciklama":
      "Requêtes acceptées comme bots et bloquées avec un score d'humanité très faible.",
    "ka.av.av-motor-yok-otomasyon.ad": "Aucun moteur de navigateur (client brut)",
    "ka.av.av-motor-yok-otomasyon.aciklama":
      "Clients ne signalant aucun vrai moteur de navigateur (ni Blink/Gecko/WebKit).",
    "ka.av.av-yavas-supheli.ad": "Trafic lent + suspect",
    "ka.av.av-yavas-supheli.aciklama":
      "Requêtes suspectes à latence anormalement élevée et faible score.",
  },

  es: {
    "ka.baslik": "Cazas guardadas & caza de amenazas programada",

    "ka.serit.aciklama":
      "Una biblioteca reutilizable de caza de amenazas. Se ejecuta sobre {n} eventos reales con un motor DSL en vivo.",
    "ka.serit.yeniAv": "Guardar nueva caza",

    "ka.ozet.toplamAv": "Cazas totales",
    "ka.ozet.tetiklenen": "Disparadas (coincidieron)",
    "ka.ozet.zamanliAv": "Cazas programadas",
    "ka.ozet.kritikTetik": "Disparos críticos",

    "ka.not.baslik": "¿Cómo funciona esto?",
    "ka.not.govde":
      "Las cazas se ejecutan sobre los eventos reales de tu cuenta con el mismo motor DSL que /panel/tehdit-avi. La capa “programada” y “alerta” se muestra aquí de forma representativa: la lista de abajo muestra lo que la caza dispararía si se ejecutara ahora mismo. En producción, el planificador periódico (cron) se ejecuta por separado en el servidor. Las cazas personalizadas que guardas se almacenan solo en este navegador (localStorage).",

    "ka.zamanli.baslik": "Cazas programadas & alertas",
    "ka.zamanli.rozet": "{n} programadas",
    "ka.zamanli.bos": "No hay cazas programadas.",
    "ka.zamanli.tetiklenirdi": "{n} cazas programadas se dispararían ahora mismo",
    "ka.zamanli.tetiklenirdiGovde":
      "Estas cazas superaron su umbral en tus eventos actuales. En un planificador real generarían alertas.",
    "ka.zamanli.esik": "/ umbral {n}",
    "ka.zamanli.tetiklendi": "Disparada",
    "ka.zamanli.sakin": "En calma",

    "ka.arama.placeholder": "Buscar caza, descripción, consulta o etiqueta…",
    "ka.arama.aria": "Buscar cazas",
    "ka.filtre.hepsi": "Todas",

    "ka.kutuphane.baslik": "Biblioteca de cazas",
    "ka.kutuphane.sayac": "{n} cazas",
    "ka.kutuphane.bosBaslik": "No hay cazas coincidentes",
    "ka.kutuphane.bosAciklama": "Cambia el término de búsqueda o el filtro de categoría.",

    "ka.kart.dslSorgusu": "Consulta DSL",
    "ka.kart.eslesme": "coincidencias",
    "ka.kart.tetikEsigi": "umbral de disparo",
    "ka.kart.konsoldaCalistir": "Ejecutar en consola",
    "ka.kart.tehditAvindaAc": "Abrir en caza de amenazas",

    "ka.ozel.baslik": "Mis cazas personalizadas",
    "ka.ozel.rozet": "{n} guardadas · solo este navegador",
    "ka.ozel.bos":
      "Aún no has guardado ninguna caza personalizada. Usa “Guardar nueva caza” para añadir tu propia consulta DSL a la biblioteca.",
    "ka.ozel.calistir": "Ejecutar",
    "ka.ozel.sil": "Eliminar caza",
    "ka.ozel.silindiBaslik": "Caza eliminada",
    "ka.ozel.kaydedildiBaslik": "Caza guardada",

    "ka.modal.baslik": "Guardar nueva caza",
    "ka.modal.aciklama": "Nombra tu propia consulta DSL y añádela a la biblioteca.",
    "ka.modal.avAdi": "Nombre de la caza",
    "ka.modal.avAdiPlaceholder": "Ej. Rutas de pago sospechosas",
    "ka.modal.aciklamaEtiket": "Descripción",
    "ka.modal.aciklamaPlaceholder": "¿Qué busca esta caza?",
    "ka.modal.kategori": "Categoría",
    "ka.modal.dslSorgusu": "Consulta DSL",
    "ka.modal.sorguGecerli": "Consulta válida — lista para guardar.",
    "ka.modal.ipucu.alanlar": "Campos:",
    "ka.modal.ipucu.operatorler": "Operadores:",
    "ka.modal.ipucu.deger": "campo:valor",
    "ka.modal.ipucu.birlestirme": "combinar con",
    "ka.modal.iptal": "Cancelar",
    "ka.modal.aviKaydet": "Guardar caza",

    "ka.kat.kimlik": "Identidad",
    "ka.kat.kazima": "Scraping",
    "ka.kat.ai": "Bots de IA",
    "ka.kat.atlatma": "Evasión",
    "ka.kat.ddos": "DDoS",
    "ka.kat.kesif": "Reconocimiento",

    "ka.siddet.kritik": "Crítica",
    "ka.siddet.yuksek": "Alta",
    "ka.siddet.orta": "Media",
    "ka.siddet.dusuk": "Baja",

    "ka.siklik.5dk": "Cada 5 minutos",
    "ka.siklik.saatlik": "Cada hora",
    "ka.siklik.günlük": "Diaria",

    "ka.av.av-hizli-kimlik-doldurma.ad": "Credential stuffing rápido",
    "ka.av.av-hizli-kimlik-doldurma.aciklama":
      "Tráfico de credential stuffing golpeando la ruta de inicio de sesión.",
    "ka.av.av-datacenter-kaziyici.ad": "Scrapers de datacenter",
    "ka.av.av-datacenter-kaziyici.aciklama":
      "Tráfico de scraping de contenido (scraper) desde ASN de datacenter.",
    "ka.av.av-sahte-tarayici-tls.ad": "Navegador falso (TLS no coincide)",
    "ka.av.av-sahte-tarayici-tls.aciklama":
      "El UA dice ser un navegador pero la huella TLS no coincide.",
    "ka.av.av-ai-egitim-botlari.ad": "Bots de entrenamiento de IA",
    "ka.av.av-ai-egitim-botlari.aciklama":
      "Tráfico de agente/crawler de IA que recopila contenido para entrenar modelos.",
    "ka.av.av-yuksek-risk-cografya.ad": "Geografía de alto riesgo + puntuación baja",
    "ka.av.av-yuksek-risk-cografya.aciklama":
      "Solicitudes de países de alto riesgo con una puntuación de humanidad muy baja.",
    "ka.av.av-headless-otomasyon.ad": "Automatización headless",
    "ka.av.av-headless-otomasyon.aciklama":
      "Firmas de navegadores headless Puppeteer/Playwright/Selenium.",
    "ka.av.av-hassas-yol-kesfi.ad": "Reconocimiento de rutas sensibles",
    "ka.av.av-hassas-yol-kesfi.aciklama":
      "Tráfico de reconocimiento sondeando rutas sensibles como admin/API/env.",
    "ka.av.av-python-arac-trafigi.ad": "Clientes Python/herramientas",
    "ka.av.av-python-arac-trafigi.aciklama":
      "Clientes de bibliotecas HTTP como python-requests / curl / go-http.",
    "ka.av.av-ddos-yuksek-hacim.ad": "DDoS / bloqueo de alto volumen",
    "ka.av.av-ddos-yuksek-hacim.aciklama":
      "Tráfico denso de clase DDoS, bloqueado con alta confianza.",
    "ka.av.av-dusuk-skor-engellenen.ad": "Bloqueos de bots de alta confianza",
    "ka.av.av-dusuk-skor-engellenen.aciklama":
      "Solicitudes aceptadas como bots y bloqueadas con una puntuación de humanidad muy baja.",
    "ka.av.av-motor-yok-otomasyon.ad": "Sin motor de navegador (cliente crudo)",
    "ka.av.av-motor-yok-otomasyon.aciklama":
      "Clientes que no reportan un motor de navegador real (no Blink/Gecko/WebKit).",
    "ka.av.av-yavas-supheli.ad": "Tráfico lento + sospechoso",
    "ka.av.av-yavas-supheli.aciklama":
      "Solicitudes sospechosas con latencia inusualmente alta y puntuación baja.",
  },
};

/** Intl BCP-47 karşılıkları (sayı biçimi için). */
export const KA_LOCALE: Record<Dil, string> = {
  tr: "tr-TR",
  en: "en-US",
  de: "de-DE",
  fr: "fr-FR",
  es: "es-ES",
};

export function avCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}

/* ------------------------------------------------------------------ Motor-metni yeniden türetme */

/** Kategori etiketi — `key` (enum) ile eşlenir, çevrilir. */
export function kategoriAd(key: AvKategori, dil: Dil): string {
  return avCeviri(`ka.kat.${key}`, dil);
}

/** Şiddet etiketi — `key` (enum) ile eşlenir, çevrilir. */
export function siddetAd(key: AvSiddet, dil: Dil): string {
  return avCeviri(`ka.siddet.${key}`, dil);
}

/** Sıklık etiketi — `key` (enum) ile eşlenir, çevrilir. */
export function siklikAd(key: AvSiklik, dil: Dil): string {
  return avCeviri(`ka.siklik.${key}`, dil);
}

/**
 * Hazır av ad/açıklaması — kararlı `id` ile eşlenir, çevrilir. Bilinmeyen
 * (özel/kullanıcı) av id'leri için sözlükte anahtar yoktur; bu durumda anahtar
 * kendisine düşer, çağıran taraf yedek olarak lib'den gelen TR metni kullanır.
 */
export function avAd(id: string, dil: Dil): string {
  const anahtar = `ka.av.${id}.ad`;
  const cevrilen = avCeviri(anahtar, dil);
  return cevrilen === anahtar ? "" : cevrilen;
}

export function avAciklama(id: string, dil: Dil): string {
  const anahtar = `ka.av.${id}.aciklama`;
  const cevrilen = avCeviri(anahtar, dil);
  return cevrilen === anahtar ? "" : cevrilen;
}
