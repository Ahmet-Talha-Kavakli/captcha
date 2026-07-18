/**
 * Saldırı Zaman Tüneli — yerel çeviri sözlüğü + motor-metni yeniden türetme.
 *
 * Sadece bu sayfaya özgü kullanıcı-görünür metinleri içerir. Paylaşılan
 * `src/lib/i18n/panel.ts` ve motor kütüphaneleri (`src/lib/specter/zaman-tuneli.ts`,
 * `correlation.ts`) DEĞİŞTİRİLMEZ. Anahtar bulunamazsa TR'ye, o da yoksa
 * anahtarın kendisine düşer (eksik çeviri asla boş metin göstermez).
 *
 * MOTOR-METNİ SORUNU
 * ------------------
 * Motor kütüphanesi her incident için Türkçe `baslik`, faz `aciklama` ve
 * `anlati` üretir; içine IP/ASN/yol/ülke ve sayı token'ları gömülüdür. Lib'i
 * düzenleyemediğimiz için:
 *   • `anlati`  → tamamen istemcide, incident'ın YAPISAL alanlarından
 *                 (fazlar/katılımcılar/savunma/olaySayısı) yeniden üretilir
 *                 (bkz. anlatiYeniden). Türkçe metni hiç ayrıştırmaz.
 *   • `baslik`  → " — " ile ön-ek + son-eke bölünür; ön-ek türe göre çevrilir,
 *                 son-ekteki VERİ token'ları (IP/ASN/yol/botClass) korunur
 *                 (bkz. baslikYeniden).
 *   • faz `aciklama` → enum `faz` değerine göre yerel şablon seçilir; sayı ve
 *                 yol token'ları Türkçe metinden regex ile çıkarılıp yeniden
 *                 yerleştirilir (bkz. fazAciklamaYeniden).
 * Böylece çeviri tamamen istemci tarafında, lib'e dokunmadan yapılır.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // --- Açıklama şeridi ---
    "zt.serit.baslik": "Bir saldırıyı baştan sona yeniden kur.",
    "zt.serit.aciklama.1": "Ham olaylar zaman-sıralı olaylara (incident) gruplanır ve her biri bir kill-chain anlatısına dönüşür:",
    "zt.serit.aciklama.zincir": "keşif → erişim denemesi → yayılma → veri çıkarma → etki",
    "zt.serit.aciklama.2": "Hangi IP/ASN ne zaman katıldı, savunma ne zaman devreye girdi — adım adım izle.",

    // --- Özet kartları ---
    "zt.ozet.yenidenKurulan": "Yeniden kurulan olay",
    "zt.ozet.kritik": "Kritik olay",
    "zt.ozet.katilanIp": "Katılan IP",
    "zt.ozet.genelMitigasyon": "Genel mitigasyon",

    // --- Genel zaman çizelgesi ---
    "zt.gzc.baslik": "Genel zaman çizelgesi",
    "zt.gzc.veriYok": "Henüz olay verisi yok.",
    "zt.gzc.hacimAria": "Zaman içindeki olay hacmi",
    "zt.gzc.toplam": "Toplam",
    "zt.gzc.engel": "Engel",
    "zt.gzc.dogrulama": "Doğrulama",
    "zt.gzc.izin": "İzin",
    "zt.gzc.aciklama": "Renkli bantlar = tespit edilen olaylar (tıkla → seç)",

    // --- Boş durum ---
    "zt.bos.baslik": "Yeniden kurulacak olay yok",
    "zt.bos.aciklama": "Henüz ilişkili bir saldırı örüntüsü tespit edilmedi. Trafik arttıkça olaylar burada belirir.",
    "zt.panel.yenidenKurgu": "Olay yeniden-kurgu",

    // --- Olay listesi ---
    "zt.liste.baslik": "Olaylar (şiddete göre)",
    "zt.liste.ara": "Başlık / ülke / ASN ara…",
    "zt.liste.araAria": "Olay ara",
    "zt.liste.bulunamadi": "Olay bulunamadı.",
    "zt.liste.olay": "olay",
    "zt.liste.ip": "IP",
    "zt.detay.baslik": "Olay detayı",
    "zt.detay.olaySec": "Bir olay seç.",

    // --- Şiddet etiketleri (enum güvenli: değer sabit, ad çevrilir) ---
    "zt.siddet.kritik": "Kritik",
    "zt.siddet.yuksek": "Yüksek",
    "zt.siddet.orta": "Orta",
    "zt.siddet.dusuk": "Düşük",

    // --- Faz etiketleri (enum güvenli) ---
    "zt.faz.kesif": "Keşif",
    "zt.faz.erisim_denemesi": "Erişim Denemesi",
    "zt.faz.yayilma": "Yayılma",
    "zt.faz.veri_cikarma": "Veri Çıkarma",
    "zt.faz.etki": "Etki",
    // Faz alt-açıklaması (kısa alt-metin)
    "zt.fazAlt.kesif": "Düşük hacimli sondalama, endpoint keşfi",
    "zt.fazAlt.erisim_denemesi": "Kimlik doğrulama endpoint'lerine yüklenme",
    "zt.fazAlt.yayilma": "Çok sayıda yol/IP'ye yatay dağılma",
    "zt.fazAlt.veri_cikarma": "Veri/API endpoint'lerinden toplu sızdırma",
    "zt.fazAlt.etki": "Kaynak tüketimi ve savunmanın devreye girmesi",

    // --- Bot sınıfı etiketleri (enum güvenli) ---
    "zt.bot.human": "İnsan",
    "zt.bot.good_bot": "İyi bot",
    "zt.bot.automation": "Otomasyon",
    "zt.bot.scraper": "Kazıyıcı",
    "zt.bot.credential_stuffing": "Kimlik doldurma",
    "zt.bot.ai_agent": "AI ajan",
    "zt.bot.ddos": "DDoS",
    "zt.bot.spam": "Spam",

    // --- Verdict etiketleri (enum güvenli) ---
    "zt.verdict.blocked": "Engellendi",
    "zt.verdict.challenged": "Doğrulama",
    "zt.verdict.flagged": "İşaretlendi",
    "zt.verdict.allowed": "İzin verildi",

    // --- Yeniden-kurgu paneli ---
    "zt.kurgu.baslik": "Olay yeniden-kurgu",
    "zt.kurgu.adliAnlati": "Adli anlatı",
    "zt.kurgu.fazProfil": "Faz yoğunluk profili",
    "zt.sav.mitigasyonKisa": "mitigasyon",
    "zt.sav.olayEki": "olay",
    "zt.kurgu.killchain": "Kill-chain zaman tüneli",
    "zt.kurgu.sifirla": "Sıfırla",
    "zt.kurgu.sifirlaTitle": "Baştan sona göster",
    "zt.kurgu.duraklat": "Duraklat",
    "zt.kurgu.oynat": "Oynat",
    "zt.kurgu.olay": "Olay",
    "zt.kurgu.oynatmaAria": "Zaman tüneli oynatma konumu",
    "zt.kurgu.faz": "FAZ",
    "zt.kurgu.olayEki": "olay",

    // --- Savunma yanıtı ---
    "zt.sav.baslik": "Savunma yanıtı",
    "zt.sav.ilkTepki": "İlk tepki {t}",
    "zt.sav.tetiklenmedi": "Tetiklenmedi",
    "zt.sav.engellendi": "Engellendi",
    "zt.sav.dogrulama": "Doğrulama",
    "zt.sav.isaretlendi": "İşaretlendi",
    "zt.sav.izin": "İzin verildi",
    "zt.sav.mitigasyonOrani": "Mitigasyon oranı",

    // --- Katılımcılar ---
    "zt.kat.baslik": "Katılımcılar ({n} IP)",
    "zt.kat.sira": "katılma sırasına göre",
    "zt.kat.katildi": "{faz}'de katıldı",
    "zt.kat.olay": "olay",
    "zt.kat.engellendi": "%{n} engellendi",
    "zt.kat.dahaFazla": "+{n} katılımcı daha",

    // --- Alt not ---
    "zt.not.1": "Kill-chain fazları olay yolu, bot sınıfı, verdict ve zamanlama sezgisel kurallarıyla türetilir. Yeniden-kurgu adli bir",
    "zt.not.anlati": "anlatı",
    "zt.not.2": "olup kesin bir olay-müdahale kaydı değildir; kanıt için ilgili olayların ham kayıtlarına başvurun.",

    // --- baslik ön-ekleri (tür başına) + son-ek şablonları ---
    "zt.baslik.kimlik.onek": "Kimlik doğrulama saldırısı",
    "zt.baslik.kimlik.sonek": "kaba kuvvet",
    "zt.baslik.kazima.onek": "Kazıma kampanyası",
    "zt.baslik.dagitik.onek": "Dağıtık bot ağı",
    "zt.baslik.dagitik.sonek": "{asn} üzerinden {path} hedefli ({bot})",
    "zt.baslik.hedefli.onek": "Hedefli endpoint saldırısı",
    "zt.baslik.ippatlamasi.onek": "IP patlaması",

    // --- faz aciklama şablonları (enum faz'a göre) ---
    "zt.fazAc.kesif": "{ip} IP düşük hacimle {yol} çevresinde sondalama yaptı.",
    "zt.fazAc.erisim_denemesi": "{n} kimlik doğrulama denemesi {yol} endpoint'ine yöneldi.",
    "zt.fazAc.yayilma": "Saldırı {ip} IP ve {yol} yola yayıldı (yatay hareket).",
    "zt.fazAc.veri_cikarma": "{yol} üzerinden tekrarlı veri çıkarma; {n} istek.",
    "zt.fazAc.etki": "Savunma devrede: olayların %{n}'ı engellendi/doğrulandı.",

    // --- anlati şablonları (yapısal yeniden-üretim) ---
    "zt.anlati.bos": "Yeniden kurulacak olay bulunamadı.",
    "zt.anlati.acilis": "{t}'de {ulke} kaynaklı {faz} ile başladı",
    "zt.anlati.tirmanis.erisim": "kimlik doldurma denemeleri",
    "zt.anlati.tirmanis.veri": "veri çıkarma girişimleri",
    "zt.anlati.tirmanis": "{t}'de {eylem} yoğunlaştı",
    "zt.anlati.savunma": "savunma {t}'de devreye girdi ve olayların %{n}'ini durdurdu",
    "zt.anlati.savunmaYok": "savunma bu incident'ta henüz tetiklenmedi",
    "zt.anlati.kapanis": ". Toplam {olay} olay, {ip} IP.",
    "zt.anlati.bilinmeyen": "bilinmeyen",
    // Süre birim ekleri
    "zt.birim.sn": "sn",
    "zt.birim.dk": "dk",
    "zt.birim.sa": "sa",
  },

  en: {
    "zt.serit.baslik": "Reconstruct an attack from start to finish.",
    "zt.serit.aciklama.1": "Raw events are grouped into time-ordered incidents, each turned into a kill-chain narrative:",
    "zt.serit.aciklama.zincir": "reconnaissance → access attempt → propagation → exfiltration → impact",
    "zt.serit.aciklama.2": "Which IP/ASN joined when, when the defense kicked in — follow it step by step.",

    "zt.ozet.yenidenKurulan": "Reconstructed incidents",
    "zt.ozet.kritik": "Critical incidents",
    "zt.ozet.katilanIp": "Participating IPs",
    "zt.ozet.genelMitigasyon": "Overall mitigation",

    "zt.gzc.baslik": "Overall timeline",
    "zt.gzc.veriYok": "No event data yet.",
    "zt.gzc.hacimAria": "Event volume over time",
    "zt.gzc.toplam": "Total",
    "zt.gzc.engel": "Blocked",
    "zt.gzc.dogrulama": "Challenge",
    "zt.gzc.izin": "Allowed",
    "zt.gzc.aciklama": "Colored bands = detected incidents (click → select)",

    "zt.bos.baslik": "No incidents to reconstruct",
    "zt.bos.aciklama": "No correlated attack pattern detected yet. As traffic grows, incidents will appear here.",
    "zt.panel.yenidenKurgu": "Incident reconstruction",

    "zt.liste.baslik": "Incidents (by severity)",
    "zt.liste.ara": "Search title / country / ASN…",
    "zt.liste.araAria": "Search incidents",
    "zt.liste.bulunamadi": "No incidents found.",
    "zt.liste.olay": "events",
    "zt.liste.ip": "IPs",
    "zt.detay.baslik": "Incident detail",
    "zt.detay.olaySec": "Select an incident.",

    "zt.siddet.kritik": "Critical",
    "zt.siddet.yuksek": "High",
    "zt.siddet.orta": "Medium",
    "zt.siddet.dusuk": "Low",

    "zt.faz.kesif": "Reconnaissance",
    "zt.faz.erisim_denemesi": "Access Attempt",
    "zt.faz.yayilma": "Propagation",
    "zt.faz.veri_cikarma": "Exfiltration",
    "zt.faz.etki": "Impact",
    "zt.fazAlt.kesif": "Low-volume probing, endpoint discovery",
    "zt.fazAlt.erisim_denemesi": "Hammering authentication endpoints",
    "zt.fazAlt.yayilma": "Lateral spread across many paths/IPs",
    "zt.fazAlt.veri_cikarma": "Bulk exfiltration from data/API endpoints",
    "zt.fazAlt.etki": "Resource exhaustion and defense engaging",

    "zt.bot.human": "Human",
    "zt.bot.good_bot": "Good bot",
    "zt.bot.automation": "Automation",
    "zt.bot.scraper": "Scraper",
    "zt.bot.credential_stuffing": "Credential stuffing",
    "zt.bot.ai_agent": "AI agent",
    "zt.bot.ddos": "DDoS",
    "zt.bot.spam": "Spam",

    "zt.verdict.blocked": "Blocked",
    "zt.verdict.challenged": "Challenge",
    "zt.verdict.flagged": "Flagged",
    "zt.verdict.allowed": "Allowed",

    "zt.kurgu.baslik": "Incident reconstruction",
    "zt.kurgu.adliAnlati": "Forensic narrative",
    "zt.kurgu.fazProfil": "Phase intensity profile",
    "zt.sav.mitigasyonKisa": "mitigated",
    "zt.sav.olayEki": "events",
    "zt.kurgu.killchain": "Kill-chain timeline",
    "zt.kurgu.sifirla": "Reset",
    "zt.kurgu.sifirlaTitle": "Show start to finish",
    "zt.kurgu.duraklat": "Pause",
    "zt.kurgu.oynat": "Play",
    "zt.kurgu.olay": "Event",
    "zt.kurgu.oynatmaAria": "Timeline playback position",
    "zt.kurgu.faz": "PHASE",
    "zt.kurgu.olayEki": "events",

    "zt.sav.baslik": "Defense response",
    "zt.sav.ilkTepki": "First response {t}",
    "zt.sav.tetiklenmedi": "Not triggered",
    "zt.sav.engellendi": "Blocked",
    "zt.sav.dogrulama": "Challenge",
    "zt.sav.isaretlendi": "Flagged",
    "zt.sav.izin": "Allowed",
    "zt.sav.mitigasyonOrani": "Mitigation rate",

    "zt.kat.baslik": "Participants ({n} IPs)",
    "zt.kat.sira": "in order of joining",
    "zt.kat.katildi": "joined during {faz}",
    "zt.kat.olay": "events",
    "zt.kat.engellendi": "{n}% blocked",
    "zt.kat.dahaFazla": "+{n} more participants",

    "zt.not.1": "Kill-chain phases are derived from event path, bot class, verdict and timing heuristics. The reconstruction is a forensic",
    "zt.not.anlati": "narrative",
    "zt.not.2": "and not a definitive incident-response record; consult the raw logs of the relevant events for evidence.",

    "zt.baslik.kimlik.onek": "Authentication attack",
    "zt.baslik.kimlik.sonek": "brute force",
    "zt.baslik.kazima.onek": "Scraping campaign",
    "zt.baslik.dagitik.onek": "Distributed botnet",
    "zt.baslik.dagitik.sonek": "targeting {path} via {asn} ({bot})",
    "zt.baslik.hedefli.onek": "Targeted endpoint attack",
    "zt.baslik.ippatlamasi.onek": "IP burst",

    "zt.fazAc.kesif": "{ip} IPs probed around {yol} at low volume.",
    "zt.fazAc.erisim_denemesi": "{n} authentication attempts targeted the {yol} endpoint.",
    "zt.fazAc.yayilma": "The attack spread across {ip} IPs and {yol} paths (lateral movement).",
    "zt.fazAc.veri_cikarma": "Repeated exfiltration via {yol}; {n} requests.",
    "zt.fazAc.etki": "Defense engaged: {n}% of events were blocked/challenged.",

    "zt.anlati.bos": "No incident to reconstruct.",
    "zt.anlati.acilis": "Started at {t} with {faz} originating from {ulke}",
    "zt.anlati.tirmanis.erisim": "credential-stuffing attempts",
    "zt.anlati.tirmanis.veri": "exfiltration attempts",
    "zt.anlati.tirmanis": "{eylem} intensified at {t}",
    "zt.anlati.savunma": "the defense engaged at {t} and stopped {n}% of the events",
    "zt.anlati.savunmaYok": "the defense was not triggered for this incident",
    "zt.anlati.kapanis": ". Total {olay} events, {ip} IPs.",
    "zt.anlati.bilinmeyen": "unknown",
    "zt.birim.sn": "s",
    "zt.birim.dk": "m",
    "zt.birim.sa": "h",
  },

  de: {
    "zt.serit.baslik": "Einen Angriff von Anfang bis Ende rekonstruieren.",
    "zt.serit.aciklama.1": "Rohereignisse werden zu zeitlich geordneten Vorfällen gruppiert, jeder wird zu einer Kill-Chain-Erzählung:",
    "zt.serit.aciklama.zincir": "Aufklärung → Zugriffsversuch → Ausbreitung → Datenabfluss → Auswirkung",
    "zt.serit.aciklama.2": "Welche IP/ASN wann beitrat, wann die Abwehr eingriff — Schritt für Schritt verfolgen.",

    "zt.ozet.yenidenKurulan": "Rekonstruierte Vorfälle",
    "zt.ozet.kritik": "Kritische Vorfälle",
    "zt.ozet.katilanIp": "Beteiligte IPs",
    "zt.ozet.genelMitigasyon": "Gesamt-Mitigation",

    "zt.gzc.baslik": "Gesamtzeitachse",
    "zt.gzc.veriYok": "Noch keine Ereignisdaten.",
    "zt.gzc.hacimAria": "Ereignisvolumen im Zeitverlauf",
    "zt.gzc.toplam": "Gesamt",
    "zt.gzc.engel": "Blockiert",
    "zt.gzc.dogrulama": "Prüfung",
    "zt.gzc.izin": "Erlaubt",
    "zt.gzc.aciklama": "Farbige Bänder = erkannte Vorfälle (klicken → auswählen)",

    "zt.bos.baslik": "Keine Vorfälle zum Rekonstruieren",
    "zt.bos.aciklama": "Noch kein korreliertes Angriffsmuster erkannt. Mit wachsendem Verkehr erscheinen die Vorfälle hier.",
    "zt.panel.yenidenKurgu": "Vorfallrekonstruktion",

    "zt.liste.baslik": "Vorfälle (nach Schweregrad)",
    "zt.liste.ara": "Titel / Land / ASN suchen…",
    "zt.liste.araAria": "Vorfälle suchen",
    "zt.liste.bulunamadi": "Keine Vorfälle gefunden.",
    "zt.liste.olay": "Ereignisse",
    "zt.liste.ip": "IPs",
    "zt.detay.baslik": "Vorfalldetail",
    "zt.detay.olaySec": "Einen Vorfall auswählen.",

    "zt.siddet.kritik": "Kritisch",
    "zt.siddet.yuksek": "Hoch",
    "zt.siddet.orta": "Mittel",
    "zt.siddet.dusuk": "Niedrig",

    "zt.faz.kesif": "Aufklärung",
    "zt.faz.erisim_denemesi": "Zugriffsversuch",
    "zt.faz.yayilma": "Ausbreitung",
    "zt.faz.veri_cikarma": "Datenabfluss",
    "zt.faz.etki": "Auswirkung",
    "zt.fazAlt.kesif": "Sondierung mit geringem Volumen, Endpunkt-Erkundung",
    "zt.fazAlt.erisim_denemesi": "Dauerbeschuss von Authentifizierungs-Endpunkten",
    "zt.fazAlt.yayilma": "Laterale Ausbreitung über viele Pfade/IPs",
    "zt.fazAlt.veri_cikarma": "Massenhafter Abfluss aus Daten-/API-Endpunkten",
    "zt.fazAlt.etki": "Ressourcenerschöpfung und Eingreifen der Abwehr",

    "zt.bot.human": "Mensch",
    "zt.bot.good_bot": "Guter Bot",
    "zt.bot.automation": "Automatisierung",
    "zt.bot.scraper": "Scraper",
    "zt.bot.credential_stuffing": "Credential Stuffing",
    "zt.bot.ai_agent": "KI-Agent",
    "zt.bot.ddos": "DDoS",
    "zt.bot.spam": "Spam",

    "zt.verdict.blocked": "Blockiert",
    "zt.verdict.challenged": "Prüfung",
    "zt.verdict.flagged": "Markiert",
    "zt.verdict.allowed": "Erlaubt",

    "zt.kurgu.baslik": "Vorfallrekonstruktion",
    "zt.kurgu.adliAnlati": "Forensische Erzählung",
    "zt.kurgu.fazProfil": "Phasen-Intensitätsprofil",
    "zt.sav.mitigasyonKisa": "mitigiert",
    "zt.sav.olayEki": "Ereignisse",
    "zt.kurgu.killchain": "Kill-Chain-Zeitachse",
    "zt.kurgu.sifirla": "Zurücksetzen",
    "zt.kurgu.sifirlaTitle": "Von Anfang bis Ende zeigen",
    "zt.kurgu.duraklat": "Pause",
    "zt.kurgu.oynat": "Abspielen",
    "zt.kurgu.olay": "Ereignis",
    "zt.kurgu.oynatmaAria": "Zeitachsen-Wiedergabeposition",
    "zt.kurgu.faz": "PHASE",
    "zt.kurgu.olayEki": "Ereignisse",

    "zt.sav.baslik": "Abwehrreaktion",
    "zt.sav.ilkTepki": "Erste Reaktion {t}",
    "zt.sav.tetiklenmedi": "Nicht ausgelöst",
    "zt.sav.engellendi": "Blockiert",
    "zt.sav.dogrulama": "Prüfung",
    "zt.sav.isaretlendi": "Markiert",
    "zt.sav.izin": "Erlaubt",
    "zt.sav.mitigasyonOrani": "Mitigationsrate",

    "zt.kat.baslik": "Teilnehmer ({n} IPs)",
    "zt.kat.sira": "in Reihenfolge des Beitritts",
    "zt.kat.katildi": "trat während {faz} bei",
    "zt.kat.olay": "Ereignisse",
    "zt.kat.engellendi": "{n}% blockiert",
    "zt.kat.dahaFazla": "+{n} weitere Teilnehmer",

    "zt.not.1": "Kill-Chain-Phasen werden aus Ereignispfad, Bot-Klasse, Verdict und Timing-Heuristiken abgeleitet. Die Rekonstruktion ist eine forensische",
    "zt.not.anlati": "Erzählung",
    "zt.not.2": "und kein definitiver Incident-Response-Datensatz; ziehen Sie für Beweise die Rohprotokolle der betreffenden Ereignisse heran.",

    "zt.baslik.kimlik.onek": "Authentifizierungsangriff",
    "zt.baslik.kimlik.sonek": "Brute Force",
    "zt.baslik.kazima.onek": "Scraping-Kampagne",
    "zt.baslik.dagitik.onek": "Verteiltes Botnetz",
    "zt.baslik.dagitik.sonek": "gezielt auf {path} über {asn} ({bot})",
    "zt.baslik.hedefli.onek": "Gezielter Endpunkt-Angriff",
    "zt.baslik.ippatlamasi.onek": "IP-Ausbruch",

    "zt.fazAc.kesif": "{ip} IPs sondierten mit geringem Volumen um {yol}.",
    "zt.fazAc.erisim_denemesi": "{n} Authentifizierungsversuche zielten auf den Endpunkt {yol}.",
    "zt.fazAc.yayilma": "Der Angriff breitete sich über {ip} IPs und {yol} Pfade aus (laterale Bewegung).",
    "zt.fazAc.veri_cikarma": "Wiederholter Datenabfluss über {yol}; {n} Anfragen.",
    "zt.fazAc.etki": "Abwehr eingegriffen: {n}% der Ereignisse wurden blockiert/geprüft.",

    "zt.anlati.bos": "Kein Vorfall zum Rekonstruieren.",
    "zt.anlati.acilis": "Begann um {t} mit {faz} aus {ulke}",
    "zt.anlati.tirmanis.erisim": "Credential-Stuffing-Versuche",
    "zt.anlati.tirmanis.veri": "Datenabflussversuche",
    "zt.anlati.tirmanis": "{eylem} verstärkten sich um {t}",
    "zt.anlati.savunma": "die Abwehr griff um {t} ein und stoppte {n}% der Ereignisse",
    "zt.anlati.savunmaYok": "die Abwehr wurde bei diesem Vorfall nicht ausgelöst",
    "zt.anlati.kapanis": ". Insgesamt {olay} Ereignisse, {ip} IPs.",
    "zt.anlati.bilinmeyen": "unbekannt",
    "zt.birim.sn": "s",
    "zt.birim.dk": "min",
    "zt.birim.sa": "h",
  },

  fr: {
    "zt.serit.baslik": "Reconstruire une attaque du début à la fin.",
    "zt.serit.aciklama.1": "Les événements bruts sont regroupés en incidents ordonnés chronologiquement, chacun devenant un récit de kill-chain :",
    "zt.serit.aciklama.zincir": "reconnaissance → tentative d'accès → propagation → exfiltration → impact",
    "zt.serit.aciklama.2": "Quelle IP/ASN a rejoint et quand, quand la défense est intervenue — suivez pas à pas.",

    "zt.ozet.yenidenKurulan": "Incidents reconstruits",
    "zt.ozet.kritik": "Incidents critiques",
    "zt.ozet.katilanIp": "IP participantes",
    "zt.ozet.genelMitigasyon": "Atténuation globale",

    "zt.gzc.baslik": "Chronologie globale",
    "zt.gzc.veriYok": "Pas encore de données d'événements.",
    "zt.gzc.hacimAria": "Volume d'événements dans le temps",
    "zt.gzc.toplam": "Total",
    "zt.gzc.engel": "Bloqué",
    "zt.gzc.dogrulama": "Vérification",
    "zt.gzc.izin": "Autorisé",
    "zt.gzc.aciklama": "Bandes colorées = incidents détectés (cliquer → sélectionner)",

    "zt.bos.baslik": "Aucun incident à reconstruire",
    "zt.bos.aciklama": "Aucun schéma d'attaque corrélé détecté pour l'instant. À mesure que le trafic augmente, les incidents apparaîtront ici.",
    "zt.panel.yenidenKurgu": "Reconstruction d'incident",

    "zt.liste.baslik": "Incidents (par gravité)",
    "zt.liste.ara": "Rechercher titre / pays / ASN…",
    "zt.liste.araAria": "Rechercher des incidents",
    "zt.liste.bulunamadi": "Aucun incident trouvé.",
    "zt.liste.olay": "événements",
    "zt.liste.ip": "IP",
    "zt.detay.baslik": "Détail de l'incident",
    "zt.detay.olaySec": "Sélectionnez un incident.",

    "zt.siddet.kritik": "Critique",
    "zt.siddet.yuksek": "Élevé",
    "zt.siddet.orta": "Moyen",
    "zt.siddet.dusuk": "Faible",

    "zt.faz.kesif": "Reconnaissance",
    "zt.faz.erisim_denemesi": "Tentative d'accès",
    "zt.faz.yayilma": "Propagation",
    "zt.faz.veri_cikarma": "Exfiltration",
    "zt.faz.etki": "Impact",
    "zt.fazAlt.kesif": "Sondage à faible volume, découverte d'endpoints",
    "zt.fazAlt.erisim_denemesi": "Martèlement des endpoints d'authentification",
    "zt.fazAlt.yayilma": "Propagation latérale sur de nombreux chemins/IP",
    "zt.fazAlt.veri_cikarma": "Exfiltration massive depuis les endpoints data/API",
    "zt.fazAlt.etki": "Épuisement des ressources et intervention de la défense",

    "zt.bot.human": "Humain",
    "zt.bot.good_bot": "Bon bot",
    "zt.bot.automation": "Automatisation",
    "zt.bot.scraper": "Scraper",
    "zt.bot.credential_stuffing": "Credential stuffing",
    "zt.bot.ai_agent": "Agent IA",
    "zt.bot.ddos": "DDoS",
    "zt.bot.spam": "Spam",

    "zt.verdict.blocked": "Bloqué",
    "zt.verdict.challenged": "Vérification",
    "zt.verdict.flagged": "Signalé",
    "zt.verdict.allowed": "Autorisé",

    "zt.kurgu.baslik": "Reconstruction d'incident",
    "zt.kurgu.adliAnlati": "Récit forensique",
    "zt.kurgu.fazProfil": "Profil d'intensité des phases",
    "zt.sav.mitigasyonKisa": "atténué",
    "zt.sav.olayEki": "événements",
    "zt.kurgu.killchain": "Chronologie kill-chain",
    "zt.kurgu.sifirla": "Réinitialiser",
    "zt.kurgu.sifirlaTitle": "Afficher du début à la fin",
    "zt.kurgu.duraklat": "Pause",
    "zt.kurgu.oynat": "Lire",
    "zt.kurgu.olay": "Événement",
    "zt.kurgu.oynatmaAria": "Position de lecture de la chronologie",
    "zt.kurgu.faz": "PHASE",
    "zt.kurgu.olayEki": "événements",

    "zt.sav.baslik": "Réponse de la défense",
    "zt.sav.ilkTepki": "Première réponse {t}",
    "zt.sav.tetiklenmedi": "Non déclenchée",
    "zt.sav.engellendi": "Bloqué",
    "zt.sav.dogrulama": "Vérification",
    "zt.sav.isaretlendi": "Signalé",
    "zt.sav.izin": "Autorisé",
    "zt.sav.mitigasyonOrani": "Taux d'atténuation",

    "zt.kat.baslik": "Participants ({n} IP)",
    "zt.kat.sira": "par ordre d'arrivée",
    "zt.kat.katildi": "a rejoint lors de {faz}",
    "zt.kat.olay": "événements",
    "zt.kat.engellendi": "{n}% bloqué",
    "zt.kat.dahaFazla": "+{n} participants de plus",

    "zt.not.1": "Les phases de la kill-chain sont dérivées du chemin de l'événement, de la classe de bot, du verdict et d'heuristiques temporelles. La reconstruction est un",
    "zt.not.anlati": "récit forensique",
    "zt.not.2": "et non un enregistrement définitif de réponse à incident ; consultez les journaux bruts des événements concernés comme preuve.",

    "zt.baslik.kimlik.onek": "Attaque d'authentification",
    "zt.baslik.kimlik.sonek": "force brute",
    "zt.baslik.kazima.onek": "Campagne de scraping",
    "zt.baslik.dagitik.onek": "Botnet distribué",
    "zt.baslik.dagitik.sonek": "ciblant {path} via {asn} ({bot})",
    "zt.baslik.hedefli.onek": "Attaque d'endpoint ciblée",
    "zt.baslik.ippatlamasi.onek": "Explosion d'IP",

    "zt.fazAc.kesif": "{ip} IP ont sondé autour de {yol} à faible volume.",
    "zt.fazAc.erisim_denemesi": "{n} tentatives d'authentification ont visé l'endpoint {yol}.",
    "zt.fazAc.yayilma": "L'attaque s'est propagée sur {ip} IP et {yol} chemins (mouvement latéral).",
    "zt.fazAc.veri_cikarma": "Exfiltration répétée via {yol} ; {n} requêtes.",
    "zt.fazAc.etki": "Défense intervenue : {n}% des événements ont été bloqués/vérifiés.",

    "zt.anlati.bos": "Aucun incident à reconstruire.",
    "zt.anlati.acilis": "A débuté à {t} par une {faz} provenant de {ulke}",
    "zt.anlati.tirmanis.erisim": "tentatives de credential stuffing",
    "zt.anlati.tirmanis.veri": "tentatives d'exfiltration",
    "zt.anlati.tirmanis": "les {eylem} se sont intensifiées à {t}",
    "zt.anlati.savunma": "la défense est intervenue à {t} et a stoppé {n}% des événements",
    "zt.anlati.savunmaYok": "la défense n'a pas été déclenchée pour cet incident",
    "zt.anlati.kapanis": ". Total {olay} événements, {ip} IP.",
    "zt.anlati.bilinmeyen": "inconnu",
    "zt.birim.sn": "s",
    "zt.birim.dk": "min",
    "zt.birim.sa": "h",
  },

  es: {
    "zt.serit.baslik": "Reconstruye un ataque de principio a fin.",
    "zt.serit.aciklama.1": "Los eventos en bruto se agrupan en incidentes ordenados cronológicamente, cada uno convertido en un relato de kill-chain:",
    "zt.serit.aciklama.zincir": "reconocimiento → intento de acceso → propagación → exfiltración → impacto",
    "zt.serit.aciklama.2": "Qué IP/ASN se unió y cuándo, cuándo intervino la defensa: síguelo paso a paso.",

    "zt.ozet.yenidenKurulan": "Incidentes reconstruidos",
    "zt.ozet.kritik": "Incidentes críticos",
    "zt.ozet.katilanIp": "IP participantes",
    "zt.ozet.genelMitigasyon": "Mitigación general",

    "zt.gzc.baslik": "Cronología general",
    "zt.gzc.veriYok": "Aún no hay datos de eventos.",
    "zt.gzc.hacimAria": "Volumen de eventos a lo largo del tiempo",
    "zt.gzc.toplam": "Total",
    "zt.gzc.engel": "Bloqueado",
    "zt.gzc.dogrulama": "Verificación",
    "zt.gzc.izin": "Permitido",
    "zt.gzc.aciklama": "Bandas de color = incidentes detectados (clic → seleccionar)",

    "zt.bos.baslik": "No hay incidentes que reconstruir",
    "zt.bos.aciklama": "Aún no se ha detectado ningún patrón de ataque correlacionado. A medida que crezca el tráfico, los incidentes aparecerán aquí.",
    "zt.panel.yenidenKurgu": "Reconstrucción de incidentes",

    "zt.liste.baslik": "Incidentes (por gravedad)",
    "zt.liste.ara": "Buscar título / país / ASN…",
    "zt.liste.araAria": "Buscar incidentes",
    "zt.liste.bulunamadi": "No se encontraron incidentes.",
    "zt.liste.olay": "eventos",
    "zt.liste.ip": "IP",
    "zt.detay.baslik": "Detalle del incidente",
    "zt.detay.olaySec": "Selecciona un incidente.",

    "zt.siddet.kritik": "Crítico",
    "zt.siddet.yuksek": "Alto",
    "zt.siddet.orta": "Medio",
    "zt.siddet.dusuk": "Bajo",

    "zt.faz.kesif": "Reconocimiento",
    "zt.faz.erisim_denemesi": "Intento de acceso",
    "zt.faz.yayilma": "Propagación",
    "zt.faz.veri_cikarma": "Exfiltración",
    "zt.faz.etki": "Impacto",
    "zt.fazAlt.kesif": "Sondeo de bajo volumen, descubrimiento de endpoints",
    "zt.fazAlt.erisim_denemesi": "Martilleo de endpoints de autenticación",
    "zt.fazAlt.yayilma": "Propagación lateral por muchas rutas/IP",
    "zt.fazAlt.veri_cikarma": "Exfiltración masiva desde endpoints de datos/API",
    "zt.fazAlt.etki": "Agotamiento de recursos e intervención de la defensa",

    "zt.bot.human": "Humano",
    "zt.bot.good_bot": "Bot bueno",
    "zt.bot.automation": "Automatización",
    "zt.bot.scraper": "Scraper",
    "zt.bot.credential_stuffing": "Credential stuffing",
    "zt.bot.ai_agent": "Agente IA",
    "zt.bot.ddos": "DDoS",
    "zt.bot.spam": "Spam",

    "zt.verdict.blocked": "Bloqueado",
    "zt.verdict.challenged": "Verificación",
    "zt.verdict.flagged": "Marcado",
    "zt.verdict.allowed": "Permitido",

    "zt.kurgu.baslik": "Reconstrucción de incidentes",
    "zt.kurgu.adliAnlati": "Relato forense",
    "zt.kurgu.fazProfil": "Perfil de intensidad de fases",
    "zt.sav.mitigasyonKisa": "mitigado",
    "zt.sav.olayEki": "eventos",
    "zt.kurgu.killchain": "Cronología kill-chain",
    "zt.kurgu.sifirla": "Restablecer",
    "zt.kurgu.sifirlaTitle": "Mostrar de principio a fin",
    "zt.kurgu.duraklat": "Pausar",
    "zt.kurgu.oynat": "Reproducir",
    "zt.kurgu.olay": "Evento",
    "zt.kurgu.oynatmaAria": "Posición de reproducción de la cronología",
    "zt.kurgu.faz": "FASE",
    "zt.kurgu.olayEki": "eventos",

    "zt.sav.baslik": "Respuesta de la defensa",
    "zt.sav.ilkTepki": "Primera respuesta {t}",
    "zt.sav.tetiklenmedi": "No activada",
    "zt.sav.engellendi": "Bloqueado",
    "zt.sav.dogrulama": "Verificación",
    "zt.sav.isaretlendi": "Marcado",
    "zt.sav.izin": "Permitido",
    "zt.sav.mitigasyonOrani": "Tasa de mitigación",

    "zt.kat.baslik": "Participantes ({n} IP)",
    "zt.kat.sira": "por orden de incorporación",
    "zt.kat.katildi": "se unió durante {faz}",
    "zt.kat.olay": "eventos",
    "zt.kat.engellendi": "{n}% bloqueado",
    "zt.kat.dahaFazla": "+{n} participantes más",

    "zt.not.1": "Las fases de la kill-chain se derivan de la ruta del evento, la clase de bot, el verdicto y heurísticas de temporización. La reconstrucción es un",
    "zt.not.anlati": "relato forense",
    "zt.not.2": "y no un registro definitivo de respuesta a incidentes; consulta los registros en bruto de los eventos relevantes como evidencia.",

    "zt.baslik.kimlik.onek": "Ataque de autenticación",
    "zt.baslik.kimlik.sonek": "fuerza bruta",
    "zt.baslik.kazima.onek": "Campaña de scraping",
    "zt.baslik.dagitik.onek": "Botnet distribuida",
    "zt.baslik.dagitik.sonek": "dirigida a {path} vía {asn} ({bot})",
    "zt.baslik.hedefli.onek": "Ataque de endpoint dirigido",
    "zt.baslik.ippatlamasi.onek": "Ráfaga de IP",

    "zt.fazAc.kesif": "{ip} IP sondearon alrededor de {yol} a bajo volumen.",
    "zt.fazAc.erisim_denemesi": "{n} intentos de autenticación se dirigieron al endpoint {yol}.",
    "zt.fazAc.yayilma": "El ataque se propagó por {ip} IP y {yol} rutas (movimiento lateral).",
    "zt.fazAc.veri_cikarma": "Exfiltración repetida vía {yol}; {n} solicitudes.",
    "zt.fazAc.etki": "Defensa intervino: {n}% de los eventos fueron bloqueados/verificados.",

    "zt.anlati.bos": "No hay incidente que reconstruir.",
    "zt.anlati.acilis": "Comenzó a las {t} con {faz} procedente de {ulke}",
    "zt.anlati.tirmanis.erisim": "intentos de credential stuffing",
    "zt.anlati.tirmanis.veri": "intentos de exfiltración",
    "zt.anlati.tirmanis": "los {eylem} se intensificaron a las {t}",
    "zt.anlati.savunma": "la defensa intervino a las {t} y detuvo el {n}% de los eventos",
    "zt.anlati.savunmaYok": "la defensa no se activó para este incidente",
    "zt.anlati.kapanis": ". Total {olay} eventos, {ip} IP.",
    "zt.anlati.bilinmeyen": "desconocido",
    "zt.birim.sn": "s",
    "zt.birim.dk": "min",
    "zt.birim.sa": "h",
  },
};

/** Sayfa çeviri yardımcısı. Anahtar yoksa TR'ye, o da yoksa anahtara düşer. */
export function zamanTuneliCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}

/** {token} yer tutucularını sırayla değerlerle doldurur. */
function doldur(sablon: string, degerler: Record<string, string | number>): string {
  let s = sablon;
  for (const [k, v] of Object.entries(degerler)) {
    s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
  }
  return s;
}

/* ================================================================== MOTOR-METNİ YENİDEN TÜRETME */

/**
 * incident `baslik`'i çevirir (lib'e dokunmadan).
 *
 * Lib şablonları (correlation.ts):
 *   "Kimlik doğrulama saldırısı — {ip} (kaba kuvvet)"
 *   "Kazıma kampanyası — {ip} ({bot})"
 *   "IP patlaması — {ip} ({bot})"
 *   "Dağıtık bot ağı — {asn} üzerinden {path} hedefli ({bot})"
 *   "Hedefli endpoint saldırısı — {path} ({bot})"
 *
 * Yöntem: " — " ile ön-ek/son-eke böl. Ön-eki Türkçe metne göre tanı, yerel
 * ön-eke çevir. VERİ token'ları (ip/asn/path/bot) son-ekten korunur; yalnızca
 * son-ekteki sabit ibareler ("kaba kuvvet", "üzerinden … hedefli") çevrilir.
 */
export function baslikYeniden(baslik: string, dil: Dil): string {
  const t = (k: string) => zamanTuneliCeviri(k, dil);
  const parcalar = baslik.split(" — ");
  const onek = parcalar[0]?.trim() ?? "";
  const sonek = parcalar.slice(1).join(" — ").trim();

  // Kimlik doğrulama saldırısı — {ip} (kaba kuvvet)
  if (onek.startsWith("Kimlik doğrulama")) {
    const ip = sonek.replace(/\s*\(kaba kuvvet\)\s*$/, "").trim();
    return `${t("zt.baslik.kimlik.onek")} — ${ip} (${t("zt.baslik.kimlik.sonek")})`;
  }
  // Kazıma kampanyası — {ip} ({bot})
  if (onek.startsWith("Kazıma")) {
    return `${t("zt.baslik.kazima.onek")} — ${cevrilmisBotEk(sonek, dil)}`;
  }
  // IP patlaması — {ip} ({bot})
  if (onek.startsWith("IP patlaması")) {
    return `${t("zt.baslik.ippatlamasi.onek")} — ${cevrilmisBotEk(sonek, dil)}`;
  }
  // Hedefli endpoint saldırısı — {path} ({bot})
  if (onek.startsWith("Hedefli endpoint")) {
    return `${t("zt.baslik.hedefli.onek")} — ${cevrilmisBotEk(sonek, dil)}`;
  }
  // Dağıtık bot ağı — {asn} üzerinden {path} hedefli ({bot})
  if (onek.startsWith("Dağıtık")) {
    const m = /^(.+?)\s+üzerinden\s+(.+?)\s+hedefli\s+\((.+?)\)\s*$/.exec(sonek);
    if (m) {
      return `${t("zt.baslik.dagitik.onek")} — ${doldur(t("zt.baslik.dagitik.sonek"), {
        asn: m[1], path: m[2], bot: botEtiket(m[3], dil),
      })}`;
    }
  }
  // Tanınmadıysa dokunma.
  return baslik;
}

/** "{data} ({bot})" son-ekindeki bot sınıfını çevirir, veri token'ını korur. */
function cevrilmisBotEk(sonek: string, dil: Dil): string {
  const m = /^(.+?)\s+\((.+?)\)\s*$/.exec(sonek);
  if (!m) return sonek;
  return `${m[1]} (${botEtiket(m[2], dil)})`;
}

/** Ham bot sınıfı değerini (enum) yerel etikete çevirir; bilinmiyorsa aynen. */
export function botEtiket(botClass: string, dil: Dil): string {
  const anahtar = `zt.bot.${botClass}`;
  const cev = zamanTuneliCeviri(anahtar, dil);
  return cev === anahtar ? botClass : cev;
}

/**
 * Faz `aciklama`'sını çevirir. Enum `faz` değeriyle yerel şablon seçilir;
 * sayı ve yol token'ları Türkçe lib metninden regex ile çıkarılır.
 *
 * Lib şablonları (zaman-tuneli.ts → fazAciklama):
 *   kesif:            "{ip} IP düşük hacimle {yol} çevresinde sondalama yaptı."
 *   erisim_denemesi:  "{n} kimlik doğrulama denemesi {yol} endpoint'ine yöneldi."
 *   yayilma:          "Saldırı {ip} IP ve {yol} yola yayıldı (yatay hareket)."
 *   veri_cikarma:     "{yol} üzerinden tekrarlı veri çıkarma; {n} istek."
 *   etki:             "Savunma devrede: olayların %{n}'ı engellendi/doğrulandı."
 */
export function fazAciklamaYeniden(faz: string, aciklama: string, dil: Dil): string {
  const t = (k: string) => zamanTuneliCeviri(k, dil);
  switch (faz) {
    case "kesif": {
      const m = /^(\d+)\s+IP\s+düşük hacimle\s+(.+?)\s+çevresinde/.exec(aciklama);
      if (m) return doldur(t("zt.fazAc.kesif"), { ip: m[1], yol: m[2] });
      break;
    }
    case "erisim_denemesi": {
      const m = /^(\d+)\s+kimlik doğrulama denemesi\s+(.+?)\s+endpoint/.exec(aciklama);
      if (m) return doldur(t("zt.fazAc.erisim_denemesi"), { n: m[1], yol: m[2] });
      break;
    }
    case "yayilma": {
      const m = /^Saldırı\s+(\d+)\s+IP\s+ve\s+(\d+)\s+yola/.exec(aciklama);
      if (m) return doldur(t("zt.fazAc.yayilma"), { ip: m[1], yol: m[2] });
      break;
    }
    case "veri_cikarma": {
      const m = /^(.+?)\s+üzerinden tekrarlı veri çıkarma;\s+(\d+)\s+istek/.exec(aciklama);
      if (m) return doldur(t("zt.fazAc.veri_cikarma"), { yol: m[1], n: m[2] });
      break;
    }
    case "etki": {
      const m = /%(\d+)/.exec(aciklama);
      if (m) return doldur(t("zt.fazAc.etki"), { n: m[1] });
      break;
    }
  }
  return aciklama;
}

/**
 * incident `anlati`'sını çevirir — TÜRKÇE METNİ AYRIŞTIRMAZ. Bunun yerine
 * incident'ın YAPISAL alanlarından (fazlar/katılımcılar/savunma/olaySayısı)
 * lib'in `anlatiUret` mantığını yerel dilde birebir yeniden üretir.
 *
 * @param p İncident'tan gerekli yapısal veriler.
 * @param saatDk ts → "HH:MM" (UTC) — çağıran taraf lib ile aynı biçimi verir.
 */
export function anlatiYeniden(
  p: {
    ilkFaz: string | null;
    ilkFazTs: number | null;
    ilkUlke: string | null;
    tirmanisFaz: "erisim_denemesi" | "veri_cikarma" | null;
    tirmanisTs: number | null;
    ilkTepkiTs: number | null;
    mitigasyonOrani: number;
    olaySayisi: number;
    katilimciSayisi: number;
  },
  saatDk: (ts: number) => string,
  dil: Dil,
): string {
  const t = (k: string) => zamanTuneliCeviri(k, dil);
  if (p.ilkFaz === null || p.ilkFazTs === null) return t("zt.anlati.bos");

  const cumleler: string[] = [];

  // 1) Açılış: ilk faz + ilk katılımcının ülkesi. (faz adı küçük harf)
  const fazAd = t(`zt.faz.${p.ilkFaz}`).toLocaleLowerCase(yerelKod(dil));
  cumleler.push(doldur(t("zt.anlati.acilis"), {
    t: saatDk(p.ilkFazTs),
    ulke: p.ilkUlke ?? t("zt.anlati.bilinmeyen"),
    faz: fazAd,
  }));

  // 2) Tırmanış: erişim/veri-çıkarma fazı varsa vurgula.
  if (p.tirmanisFaz && p.tirmanisTs !== null) {
    const eylem = p.tirmanisFaz === "erisim_denemesi"
      ? t("zt.anlati.tirmanis.erisim")
      : t("zt.anlati.tirmanis.veri");
    cumleler.push(doldur(t("zt.anlati.tirmanis"), { t: saatDk(p.tirmanisTs), eylem }));
  }

  // 3) Savunma yanıtı.
  if (p.ilkTepkiTs !== null) {
    const yuzde = Math.round(p.mitigasyonOrani * 100);
    cumleler.push(doldur(t("zt.anlati.savunma"), { t: saatDk(p.ilkTepkiTs), n: yuzde }));
  } else {
    cumleler.push(t("zt.anlati.savunmaYok"));
  }

  const kapanis = doldur(t("zt.anlati.kapanis"), {
    olay: p.olaySayisi,
    ip: p.katilimciSayisi,
  });
  return cumleler.join(", ") + kapanis;
}

/** Dil → BCP-47 yerel kodu (locale-duyarlı küçük harf için). */
function yerelKod(dil: Dil): string {
  const m: Record<Dil, string> = { tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES" };
  return m[dil];
}
