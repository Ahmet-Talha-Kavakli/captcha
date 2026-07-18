/**
 * Otonom Savunma Orkestratörü — yerel çeviri sözlüğü + füzyon-metni yeniden kurma.
 *
 * Sadece bu sayfaya özgü kullanıcı-görünür metinleri içerir. Paylaşılan
 * `src/lib/i18n/panel.ts` ve motor kütüphaneleri DEĞİŞTİRİLMEZ. Panel-yerel
 * `orkestra.ts` çekirdeği düz TR metni yanında ANAHTAR + SAYISAL VERİ taşır;
 * bu dosya o anahtarları etkin dile çevirir.
 *
 * ENUM & VERİ GÜVENLİĞİ
 * ---------------------
 *   - Duruş (normal/yükseltilmiş/savunma/kilit), aciliyet (düşük/orta/yüksek/kritik),
 *     motivasyon (finansal/veri/…), uyarı şiddeti (izle/uyari/kritik), trend
 *     (artıyor/azalıyor/sabit) enum değerleri ASLA çevrilmez; yalnızca anahtar.
 *   - Sayı/yüzde/$ değerleri VERİ olarak taşınır ve `{token}` ile şablona yerleşir.
 *   - Aksiyon şablonları `id` ile, sinyal özetleri `ozetAnahtar` ile anahtarlanır;
 *     hiçbir Türkçe düz metin ayrıştırılmaz.
 */
import type { Dil } from "@/lib/i18n/panel";
import type { Durus, Aciliyet, SinyalKatki, AutoAksiyon, GerekceVeri, Veri } from "./orkestra";
import { DURUS_META } from "./orkestra";

/* --------------------------------------------------------------- Düz sözlük */

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    "o.baslik": "Otonom Savunma Orkestratörü",

    // Namusluluk şeridi
    "o.namus.baslik": "Karar-destek füzyonu",
    "o.namus.metin":
      "Bu panel, diğer tespit motorlarının (saldırı tahmini, niyet, kill-chain, bot ekonomisi, birleşik risk) <b>gerçek çıktılarını</b> tek savunma duruşuna füzyonlar. Önerilen aksiyonlar <b>otomatik uygulanmaz</b>; “uygula (simüle)” yalnızca bu oturumda yerel bir kuyruk işaretler.",

    // Duruş kadranı
    "o.oneriDurus": "Önerilen savunma duruşu",
    "o.tehditBasinci": "/ 100 tehdit basıncı",
    "o.durusEtiket": "Duruş: {ad}",
    "o.fuzyonGuveni": "Füzyon güveni",

    // Neden bu duruş
    "o.nedenDurus": "Neden bu duruş?",
    "o.fuzyonGerekcesi": "füzyon gerekçesi",
    "o.mini.saldirgan": "Saldırgan",
    "o.mini.saldirgan.niyet": "niyet: {ad}",
    "o.mini.saldirgan.yok": "sınıflandırılmadı",
    "o.mini.killChain": "Kill-chain",
    "o.mini.killChain.alt": "{ileri} ileri · %{durdurma} durdurma",
    "o.mini.kritikIp": "Kritik IP",
    "o.mini.kritikIp.alt": "{n} engel önerisi",
    "o.mini.caydirilan": "Caydırılan",
    "o.mini.caydirilan.alt": "kârsız sınıf",
    "o.mini.trend": "Trend",
    "o.mini.olay": "Olay",
    "o.mini.olay.alt": "analiz penceresi",

    // Sinyal füzyonu
    "o.sinyalFuzyonu": "Sinyal füzyonu",
    "o.aciklanabilirlik": "açıklanabilirlik",

    // Aksiyon planı
    "o.aksiyonPlani": "Otonom aksiyon planı",
    "o.aksiyonRozet": "{oto} otomatik · {manuel} manuel",
    "o.hepsiniUygula": "Hepsini uygula (simüle)",
    "o.kuyruguTemizle": "Kuyruğu temizle",
    "o.kuyrukNot": "<b>{n}</b> aksiyon oturum-yerel kuyruğa alındı (simülasyon). Gerçek uygulama, ilgili panellerde onaylı kurallarla yapılır — bu ekran üretime müdahale etmez.",
    "o.otomatik": "otomatik",
    "o.onayGerekir": "onay gerekir",
    "o.dayanak": "Dayanak:",
    "o.kuyrukta": "Kuyrukta",
    "o.kuyrugaAl": "Kuyruğa al",
    "o.paneleGit": "Panele git",

    // Duruş adları (enum-anahtarlı)
    "durus.normal": "Normal",
    "durus.yükseltilmiş": "Yükseltilmiş",
    "durus.savunma": "Savunma",
    "durus.kilit": "Kilit",
    // Duruş açıklamaları
    "durusAcik.normal": "Sinyaller sakin. Standart koruma yeterli; müdahaleye gerek yok.",
    "durusAcik.yükseltilmiş": "Artan baskı gözleniyor. İzleme sıklaştırılır, şüpheli trafiğe doğrulama artırılır.",
    "durusAcik.savunma": "Aktif tehdit. Hassas yollar sertleştirilir, oran-sınırlama ve zorluk yükseltilir.",
    "durusAcik.kilit": "Kritik/koordineli saldırı. En agresif koruma; kritik kaynaklara erişim kilitlenir.",

    // Aciliyet (enum-anahtarlı)
    "acil.düşük": "düşük",
    "acil.orta": "orta",
    "acil.yüksek": "yüksek",
    "acil.kritik": "kritik",

    // Sinyal adları (anahtar-anahtarlı)
    "sinyal.tahmin": "Saldırı Tahmini",
    "sinyal.killChain": "Kill-Chain İlerleyişi",
    "sinyal.risk": "Birleşik Risk",
    "sinyal.niyet": "Saldırgan Niyeti",
    "sinyal.ekonomi": "Bot Ekonomisi",

    // Motivasyon (niyet ozet/mini için — enum-anahtarlı)
    "mot.finansal": "finansal",
    "mot.veri": "veri",
    "mot.yikim": "yıkım",
    "mot.kesif": "keşif",
    "mot.kotuye": "kötüye",
    "mot.belirsiz": "belirsiz",

    // Uyarı şiddeti (enum-anahtarlı)
    "siddet.izle": "izle",
    "siddet.uyari": "uyarı",
    "siddet.kritik": "kritik",
    // Trend (enum-anahtarlı)
    "trend.artıyor": "artıyor",
    "trend.azalıyor": "azalıyor",
    "trend.sabit": "sabit",

    // Sinyal özetleri (ozetAnahtar-anahtarlı, {token} veri)
    "ozet.tahmin.yok": "Tahmin verisi yok.",
    "ozet.tahmin.sakin": "Yaklaşan anormal dalga öngörülmüyor.",
    "ozet.tahmin.aktif": "{parcalar}",
    "ozet.tahmin.uyari": "erken uyarı “{siddet}”",
    "ozet.tahmin.sicrama": "ani sıçrama {kat}×",
    "ozet.tahmin.trendArtiyor": "hacim trendi artıyor",
    "ozet.tahmin.hiz": "mevcut hız {n}/saat",
    "ozet.killChain.yok": "Aktif saldırı zinciri yok.",
    "ozet.killChain.aktif": "{zincir} zincir, {ileri} sömürü/sızmaya ulaştı, durdurma %{durdurma}.",
    "ozet.niyet.yok": "Sınıflandırılmış saldırgan yok.",
    "ozet.niyet.aktif": "{saldirgan} saldırgan; baskın niyet “{niyet}” (güven %{guven}).",
    "ozet.risk.yok": "Risk skorlanan IP yok.",
    "ozet.risk.aktif": "{ip} IP; {kritik} kritik, {yuksek} yüksek, ort. risk {ort}.",
    "ozet.ekonomi.yok": "Ekonomik saldırı sınıfı yok.",
    "ozet.ekonomi.aktif": "{caydirilan}/{toplam} sınıf kârsız kılındı; kalan saldırgan kârı ~${kar}.",

    // Aksiyon şablonları (id-anahtarlı)
    "aksiyon.hassasYol.baslik": "Hassas yolları sertleştir",
    "aksiyon.hassasYol.metin": "login/checkout/admin yollarında zorluk seviyesini yükselt, otomasyon imzalarını doğrudan engelle.",
    "aksiyon.ipEngelle.baslik": "{n} yüksek-riskli IP'yi engelle",
    "aksiyon.ipEngelle.metin": "Birleşik risk motorunun “engelle” önerdiği {n} IP için otomatik engelleme kuralı uygula.",
    "aksiyon.kimlikKoru.baslik": "Kimlik akışlarını koruma moduna al",
    "aksiyon.kimlikKoru.metin": "Giriş/ödeme uçlarına adım-artırılmış doğrulama (step-up) ve oran-sınırlama uygula; kimlik-doldurma imzalarını izle.",
    "aksiyon.kaynakOranSinir.baslik": "Kaynak-tüketimine karşı oran-sınırla",
    "aksiyon.kaynakOranSinir.metin": "DDoS/yıkım niyetine karşı IP başına oran-sınırlamayı sıkılaştır, pahalı uçları önbelleğe/kuyruğa al.",
    "aksiyon.dalgaHazirlan.baslik": "Yaklaşan dalgaya hazırlan",
    "aksiyon.dalgaHazirlan.metin": "Öngörülen zirveden önce kapasite/edge önbelleğini ölçekle, komuta merkezinde canlı izlemeyi aç.",
    "aksiyon.dalgaSonumle.baslik": "Aktif dalgayı sönümle",
    "aksiyon.dalgaSonumle.metin": "Aktif dalga için otomatik zorluk yükseltmeyi devreye al ve trafiği yakından izle.",
    "aksiyon.ekonomiKirsizlastir.baslik": "Saldırı ekonomisini kârsızlaştır",
    "aksiyon.ekonomiKirsizlastir.metin": "Hâlâ kâr eden saldırı sınıflarına ghost-font zorluğunu ve deneme maliyetini yükselt (çözüm-çiftliği ROI'sini kır).",
    "aksiyon.playbook.baslik": "Koordineli müdahale playbook'u başlat",
    "aksiyon.playbook.metin": "Kilit duruşu tetiklendi: komuta merkezinden koordineli müdahaleyi başlat, ekibe kritik uyarı gönder.",
    "aksiyon.gozlem.baslik": "Standart izlemeyi sürdür",
    "aksiyon.gozlem.metin": "Sinyaller sakin. Mevcut koruma politikaları yeterli; yalnızca rutin gözlem gerekir.",

    // Dayanak önekleri (dayanakAnahtar-anahtarlı)
    "dayanak.killChain": "Kill-Chain: {ozet}",
    "dayanak.risk": "Birleşik Risk: {ozet}",
    "dayanak.niyet": "Niyet: {ozet}",
    "dayanak.tahmin": "Tahmin: {ozet}",
    "dayanak.ekonomi": "Ekonomi: {ozet}",
    "dayanak.fuzyon": "Füzyon: kritik tehdit basıncı — birden çok sinyal aynı anda yüksek.",
    "dayanak.fuzyonSakin": "Füzyon: tüm sinyaller eşik altında.",

    // Gerekçe (yapısal → yeniden kurma)
    "gerekce.bos": "Hiçbir tespit katmanı anlamlı sinyal üretmedi; sistem sakin — standart koruma yeterli.",
    "gerekce.dolu": "Önerilen duruş: {durus} (tehdit basıncı {skor}/100). Başlıca katkılar: {parcalar}",
    "gerekce.parca": "{ad} ({ozet})",
  },

  en: {
    "o.baslik": "Autonomous Defense Orchestrator",

    "o.namus.baslik": "Decision-support fusion",
    "o.namus.metin":
      "This panel fuses the <b>real outputs</b> of the other detection engines (attack forecast, intent, kill-chain, bot economy, unified risk) into a single defense posture. Recommended actions are <b>not applied automatically</b>; “apply (simulate)” only marks a session-local queue.",

    "o.oneriDurus": "Recommended defense posture",
    "o.tehditBasinci": "/ 100 threat pressure",
    "o.durusEtiket": "Posture: {ad}",
    "o.fuzyonGuveni": "Fusion confidence",

    "o.nedenDurus": "Why this posture?",
    "o.fuzyonGerekcesi": "fusion rationale",
    "o.mini.saldirgan": "Attackers",
    "o.mini.saldirgan.niyet": "intent: {ad}",
    "o.mini.saldirgan.yok": "unclassified",
    "o.mini.killChain": "Kill-chain",
    "o.mini.killChain.alt": "{ileri} advanced · {durdurma}% stopped",
    "o.mini.kritikIp": "Critical IPs",
    "o.mini.kritikIp.alt": "{n} block suggestions",
    "o.mini.caydirilan": "Deterred",
    "o.mini.caydirilan.alt": "unprofitable classes",
    "o.mini.trend": "Trend",
    "o.mini.olay": "Events",
    "o.mini.olay.alt": "analysis window",

    "o.sinyalFuzyonu": "Signal fusion",
    "o.aciklanabilirlik": "explainability",

    "o.aksiyonPlani": "Autonomous action plan",
    "o.aksiyonRozet": "{oto} automatic · {manuel} manual",
    "o.hepsiniUygula": "Apply all (simulate)",
    "o.kuyruguTemizle": "Clear queue",
    "o.kuyrukNot": "<b>{n}</b> actions queued session-locally (simulation). Real enforcement happens with approved rules in the relevant panels — this screen does not touch production.",
    "o.otomatik": "automatic",
    "o.onayGerekir": "approval required",
    "o.dayanak": "Basis:",
    "o.kuyrukta": "Queued",
    "o.kuyrugaAl": "Add to queue",
    "o.paneleGit": "Go to panel",

    "durus.normal": "Normal",
    "durus.yükseltilmiş": "Elevated",
    "durus.savunma": "Defensive",
    "durus.kilit": "Lockdown",
    "durusAcik.normal": "Signals are calm. Standard protection is sufficient; no intervention needed.",
    "durusAcik.yükseltilmiş": "Rising pressure observed. Monitoring tightens, verification on suspicious traffic increases.",
    "durusAcik.savunma": "Active threat. Sensitive paths are hardened, rate-limiting and challenge levels rise.",
    "durusAcik.kilit": "Critical/coordinated attack. Most aggressive protection; access to critical resources is locked down.",

    "acil.düşük": "low",
    "acil.orta": "medium",
    "acil.yüksek": "high",
    "acil.kritik": "critical",

    "sinyal.tahmin": "Attack Forecast",
    "sinyal.killChain": "Kill-Chain Progression",
    "sinyal.risk": "Unified Risk",
    "sinyal.niyet": "Attacker Intent",
    "sinyal.ekonomi": "Bot Economy",

    "mot.finansal": "financial",
    "mot.veri": "data",
    "mot.yikim": "disruption",
    "mot.kesif": "recon",
    "mot.kotuye": "abuse",
    "mot.belirsiz": "undetermined",

    "siddet.izle": "watch",
    "siddet.uyari": "warning",
    "siddet.kritik": "critical",
    "trend.artıyor": "rising",
    "trend.azalıyor": "falling",
    "trend.sabit": "stable",

    "ozet.tahmin.yok": "No forecast data.",
    "ozet.tahmin.sakin": "No incoming abnormal wave forecast.",
    "ozet.tahmin.aktif": "{parcalar}",
    "ozet.tahmin.uyari": "early warning “{siddet}”",
    "ozet.tahmin.sicrama": "sudden spike {kat}×",
    "ozet.tahmin.trendArtiyor": "volume trend rising",
    "ozet.tahmin.hiz": "current rate {n}/hour",
    "ozet.killChain.yok": "No active attack chains.",
    "ozet.killChain.aktif": "{zincir} chains, {ileri} reached exploitation/exfiltration, {durdurma}% stopped.",
    "ozet.niyet.yok": "No classified attackers.",
    "ozet.niyet.aktif": "{saldirgan} attackers; dominant intent “{niyet}” (confidence {guven}%).",
    "ozet.risk.yok": "No risk-scored IPs.",
    "ozet.risk.aktif": "{ip} IPs; {kritik} critical, {yuksek} high, avg. risk {ort}.",
    "ozet.ekonomi.yok": "No economic attack classes.",
    "ozet.ekonomi.aktif": "{caydirilan}/{toplam} classes made unprofitable; remaining attacker profit ~${kar}.",

    "aksiyon.hassasYol.baslik": "Harden sensitive paths",
    "aksiyon.hassasYol.metin": "Raise the challenge level on login/checkout/admin paths and directly block automation signatures.",
    "aksiyon.ipEngelle.baslik": "Block {n} high-risk IPs",
    "aksiyon.ipEngelle.metin": "Apply an automatic block rule for the {n} IPs the unified-risk engine recommends to “block”.",
    "aksiyon.kimlikKoru.baslik": "Put identity flows into protection mode",
    "aksiyon.kimlikKoru.metin": "Apply step-up verification and rate-limiting to login/payment endpoints; watch for credential-stuffing signatures.",
    "aksiyon.kaynakOranSinir.baslik": "Rate-limit against resource exhaustion",
    "aksiyon.kaynakOranSinir.metin": "Tighten per-IP rate-limiting against DDoS/disruption intent, cache/queue expensive endpoints.",
    "aksiyon.dalgaHazirlan.baslik": "Prepare for the incoming wave",
    "aksiyon.dalgaHazirlan.metin": "Scale capacity/edge cache ahead of the forecasted peak, enable live monitoring in the command center.",
    "aksiyon.dalgaSonumle.baslik": "Dampen the active wave",
    "aksiyon.dalgaSonumle.metin": "Enable automatic challenge escalation for the active wave and monitor traffic closely.",
    "aksiyon.ekonomiKirsizlastir.baslik": "Make the attack economy unprofitable",
    "aksiyon.ekonomiKirsizlastir.metin": "Raise the ghost-font challenge and attempt cost for still-profitable attack classes (break the solving-farm ROI).",
    "aksiyon.playbook.baslik": "Launch the coordinated response playbook",
    "aksiyon.playbook.metin": "Lockdown posture triggered: launch coordinated response from the command center and send a critical alert to the team.",
    "aksiyon.gozlem.baslik": "Maintain standard monitoring",
    "aksiyon.gozlem.metin": "Signals are calm. Current protection policies are sufficient; only routine observation is needed.",

    "dayanak.killChain": "Kill-Chain: {ozet}",
    "dayanak.risk": "Unified Risk: {ozet}",
    "dayanak.niyet": "Intent: {ozet}",
    "dayanak.tahmin": "Forecast: {ozet}",
    "dayanak.ekonomi": "Economy: {ozet}",
    "dayanak.fuzyon": "Fusion: critical threat pressure — multiple signals high at once.",
    "dayanak.fuzyonSakin": "Fusion: all signals below threshold.",

    "gerekce.bos": "No detection layer produced a meaningful signal; the system is calm — standard protection is sufficient.",
    "gerekce.dolu": "Recommended posture: {durus} (threat pressure {skor}/100). Main contributions: {parcalar}",
    "gerekce.parca": "{ad} ({ozet})",
  },

  de: {
    "o.baslik": "Autonomer Verteidigungs-Orchestrator",

    "o.namus.baslik": "Entscheidungsunterstützungs-Fusion",
    "o.namus.metin":
      "Dieses Panel fusioniert die <b>realen Ausgaben</b> der anderen Erkennungs-Engines (Angriffsprognose, Absicht, Kill-Chain, Bot-Ökonomie, vereinheitlichtes Risiko) zu einer einzigen Verteidigungshaltung. Empfohlene Aktionen werden <b>nicht automatisch angewendet</b>; „Anwenden (simulieren)“ markiert nur eine sitzungslokale Warteschlange.",

    "o.oneriDurus": "Empfohlene Verteidigungshaltung",
    "o.tehditBasinci": "/ 100 Bedrohungsdruck",
    "o.durusEtiket": "Haltung: {ad}",
    "o.fuzyonGuveni": "Fusionskonfidenz",

    "o.nedenDurus": "Warum diese Haltung?",
    "o.fuzyonGerekcesi": "Fusionsbegründung",
    "o.mini.saldirgan": "Angreifer",
    "o.mini.saldirgan.niyet": "Absicht: {ad}",
    "o.mini.saldirgan.yok": "nicht klassifiziert",
    "o.mini.killChain": "Kill-Chain",
    "o.mini.killChain.alt": "{ileri} fortgeschritten · {durdurma}% gestoppt",
    "o.mini.kritikIp": "Kritische IPs",
    "o.mini.kritikIp.alt": "{n} Sperrvorschläge",
    "o.mini.caydirilan": "Abgeschreckt",
    "o.mini.caydirilan.alt": "unrentable Klassen",
    "o.mini.trend": "Trend",
    "o.mini.olay": "Ereignisse",
    "o.mini.olay.alt": "Analysefenster",

    "o.sinyalFuzyonu": "Signalfusion",
    "o.aciklanabilirlik": "Erklärbarkeit",

    "o.aksiyonPlani": "Autonomer Aktionsplan",
    "o.aksiyonRozet": "{oto} automatisch · {manuel} manuell",
    "o.hepsiniUygula": "Alle anwenden (simulieren)",
    "o.kuyruguTemizle": "Warteschlange leeren",
    "o.kuyrukNot": "<b>{n}</b> Aktionen sitzungslokal in die Warteschlange gestellt (Simulation). Die echte Durchsetzung erfolgt mit genehmigten Regeln in den jeweiligen Panels — dieser Bildschirm greift nicht in die Produktion ein.",
    "o.otomatik": "automatisch",
    "o.onayGerekir": "Genehmigung erforderlich",
    "o.dayanak": "Grundlage:",
    "o.kuyrukta": "In Warteschlange",
    "o.kuyrugaAl": "Zur Warteschlange",
    "o.paneleGit": "Zum Panel",

    "durus.normal": "Normal",
    "durus.yükseltilmiş": "Erhöht",
    "durus.savunma": "Defensiv",
    "durus.kilit": "Abriegelung",
    "durusAcik.normal": "Die Signale sind ruhig. Standardschutz genügt; kein Eingriff nötig.",
    "durusAcik.yükseltilmiş": "Steigender Druck beobachtet. Überwachung wird verschärft, Verifizierung bei verdächtigem Verkehr erhöht.",
    "durusAcik.savunma": "Aktive Bedrohung. Sensible Pfade werden gehärtet, Ratenbegrenzung und Schwierigkeit steigen.",
    "durusAcik.kilit": "Kritischer/koordinierter Angriff. Aggressivster Schutz; Zugriff auf kritische Ressourcen wird gesperrt.",

    "acil.düşük": "niedrig",
    "acil.orta": "mittel",
    "acil.yüksek": "hoch",
    "acil.kritik": "kritisch",

    "sinyal.tahmin": "Angriffsprognose",
    "sinyal.killChain": "Kill-Chain-Fortschritt",
    "sinyal.risk": "Vereinheitlichtes Risiko",
    "sinyal.niyet": "Angreiferabsicht",
    "sinyal.ekonomi": "Bot-Ökonomie",

    "mot.finansal": "finanziell",
    "mot.veri": "Daten",
    "mot.yikim": "Zerstörung",
    "mot.kesif": "Aufklärung",
    "mot.kotuye": "Missbrauch",
    "mot.belirsiz": "unbestimmt",

    "siddet.izle": "beobachten",
    "siddet.uyari": "Warnung",
    "siddet.kritik": "kritisch",
    "trend.artıyor": "steigend",
    "trend.azalıyor": "fallend",
    "trend.sabit": "stabil",

    "ozet.tahmin.yok": "Keine Prognosedaten.",
    "ozet.tahmin.sakin": "Keine anrollende anomale Welle prognostiziert.",
    "ozet.tahmin.aktif": "{parcalar}",
    "ozet.tahmin.uyari": "Frühwarnung „{siddet}“",
    "ozet.tahmin.sicrama": "plötzlicher Anstieg {kat}×",
    "ozet.tahmin.trendArtiyor": "Volumentrend steigend",
    "ozet.tahmin.hiz": "aktuelle Rate {n}/Stunde",
    "ozet.killChain.yok": "Keine aktiven Angriffsketten.",
    "ozet.killChain.aktif": "{zincir} Ketten, {ileri} erreichten Ausnutzung/Exfiltration, {durdurma}% gestoppt.",
    "ozet.niyet.yok": "Keine klassifizierten Angreifer.",
    "ozet.niyet.aktif": "{saldirgan} Angreifer; dominante Absicht „{niyet}“ (Konfidenz {guven}%).",
    "ozet.risk.yok": "Keine risikobewerteten IPs.",
    "ozet.risk.aktif": "{ip} IPs; {kritik} kritisch, {yuksek} hoch, durchschn. Risiko {ort}.",
    "ozet.ekonomi.yok": "Keine ökonomischen Angriffsklassen.",
    "ozet.ekonomi.aktif": "{caydirilan}/{toplam} Klassen unrentabel gemacht; verbleibender Angreifergewinn ~{kar} $.",

    "aksiyon.hassasYol.baslik": "Sensible Pfade härten",
    "aksiyon.hassasYol.metin": "Schwierigkeitsstufe bei Login-/Checkout-/Admin-Pfaden erhöhen, Automatisierungssignaturen direkt blockieren.",
    "aksiyon.ipEngelle.baslik": "{n} risikoreiche IPs blockieren",
    "aksiyon.ipEngelle.metin": "Eine automatische Sperrregel für die {n} IPs anwenden, die die Risiko-Engine zum „Blockieren“ empfiehlt.",
    "aksiyon.kimlikKoru.baslik": "Identitätsflüsse in den Schutzmodus versetzen",
    "aksiyon.kimlikKoru.metin": "Step-up-Verifizierung und Ratenbegrenzung auf Login-/Zahlungs-Endpoints anwenden; Credential-Stuffing-Signaturen überwachen.",
    "aksiyon.kaynakOranSinir.baslik": "Gegen Ressourcenerschöpfung ratenbegrenzen",
    "aksiyon.kaynakOranSinir.metin": "Pro-IP-Ratenbegrenzung gegen DDoS-/Zerstörungsabsicht verschärfen, teure Endpoints cachen/in die Warteschlange stellen.",
    "aksiyon.dalgaHazirlan.baslik": "Auf die anrollende Welle vorbereiten",
    "aksiyon.dalgaHazirlan.metin": "Kapazität/Edge-Cache vor dem prognostizierten Höhepunkt skalieren, Live-Überwachung im Kommandozentrum aktivieren.",
    "aksiyon.dalgaSonumle.baslik": "Aktive Welle dämpfen",
    "aksiyon.dalgaSonumle.metin": "Automatische Schwierigkeits-Eskalation für die aktive Welle aktivieren und den Verkehr eng überwachen.",
    "aksiyon.ekonomiKirsizlastir.baslik": "Angriffs-Ökonomie unrentabel machen",
    "aksiyon.ekonomiKirsizlastir.metin": "Ghost-Font-Schwierigkeit und Versuchskosten für noch profitable Angriffsklassen erhöhen (den ROI der Löse-Farm brechen).",
    "aksiyon.playbook.baslik": "Koordiniertes Reaktions-Playbook starten",
    "aksiyon.playbook.metin": "Abriegelungshaltung ausgelöst: koordinierte Reaktion aus dem Kommandozentrum starten und dem Team eine kritische Warnung senden.",
    "aksiyon.gozlem.baslik": "Standardüberwachung fortsetzen",
    "aksiyon.gozlem.metin": "Die Signale sind ruhig. Die aktuellen Schutzrichtlinien genügen; nur routinemäßige Beobachtung ist nötig.",

    "dayanak.killChain": "Kill-Chain: {ozet}",
    "dayanak.risk": "Vereinheitlichtes Risiko: {ozet}",
    "dayanak.niyet": "Absicht: {ozet}",
    "dayanak.tahmin": "Prognose: {ozet}",
    "dayanak.ekonomi": "Ökonomie: {ozet}",
    "dayanak.fuzyon": "Fusion: kritischer Bedrohungsdruck — mehrere Signale gleichzeitig hoch.",
    "dayanak.fuzyonSakin": "Fusion: alle Signale unter dem Schwellenwert.",

    "gerekce.bos": "Keine Erkennungsschicht erzeugte ein aussagekräftiges Signal; das System ist ruhig — Standardschutz genügt.",
    "gerekce.dolu": "Empfohlene Haltung: {durus} (Bedrohungsdruck {skor}/100). Hauptbeiträge: {parcalar}",
    "gerekce.parca": "{ad} ({ozet})",
  },

  fr: {
    "o.baslik": "Orchestrateur de défense autonome",

    "o.namus.baslik": "Fusion d'aide à la décision",
    "o.namus.metin":
      "Ce panneau fusionne les <b>sorties réelles</b> des autres moteurs de détection (prévision d'attaque, intention, kill-chain, économie des bots, risque unifié) en une seule posture de défense. Les actions recommandées ne sont <b>pas appliquées automatiquement</b> ; « appliquer (simuler) » ne marque qu'une file d'attente locale à la session.",

    "o.oneriDurus": "Posture de défense recommandée",
    "o.tehditBasinci": "/ 100 pression de menace",
    "o.durusEtiket": "Posture : {ad}",
    "o.fuzyonGuveni": "Confiance de la fusion",

    "o.nedenDurus": "Pourquoi cette posture ?",
    "o.fuzyonGerekcesi": "justification de la fusion",
    "o.mini.saldirgan": "Attaquants",
    "o.mini.saldirgan.niyet": "intention : {ad}",
    "o.mini.saldirgan.yok": "non classé",
    "o.mini.killChain": "Kill-chain",
    "o.mini.killChain.alt": "{ileri} avancés · {durdurma}% arrêtés",
    "o.mini.kritikIp": "IP critiques",
    "o.mini.kritikIp.alt": "{n} suggestions de blocage",
    "o.mini.caydirilan": "Dissuadés",
    "o.mini.caydirilan.alt": "classes non rentables",
    "o.mini.trend": "Tendance",
    "o.mini.olay": "Événements",
    "o.mini.olay.alt": "fenêtre d'analyse",

    "o.sinyalFuzyonu": "Fusion des signaux",
    "o.aciklanabilirlik": "explicabilité",

    "o.aksiyonPlani": "Plan d'action autonome",
    "o.aksiyonRozet": "{oto} automatique · {manuel} manuel",
    "o.hepsiniUygula": "Tout appliquer (simuler)",
    "o.kuyruguTemizle": "Vider la file",
    "o.kuyrukNot": "<b>{n}</b> actions mises en file locale à la session (simulation). L'application réelle se fait avec des règles approuvées dans les panneaux concernés — cet écran ne touche pas à la production.",
    "o.otomatik": "automatique",
    "o.onayGerekir": "approbation requise",
    "o.dayanak": "Fondement :",
    "o.kuyrukta": "En file",
    "o.kuyrugaAl": "Ajouter à la file",
    "o.paneleGit": "Aller au panneau",

    "durus.normal": "Normal",
    "durus.yükseltilmiş": "Élevé",
    "durus.savunma": "Défensif",
    "durus.kilit": "Verrouillage",
    "durusAcik.normal": "Les signaux sont calmes. La protection standard suffit ; aucune intervention nécessaire.",
    "durusAcik.yükseltilmiş": "Pression croissante observée. La surveillance se resserre, la vérification du trafic suspect augmente.",
    "durusAcik.savunma": "Menace active. Les chemins sensibles sont durcis, la limitation de débit et la difficulté augmentent.",
    "durusAcik.kilit": "Attaque critique/coordonnée. Protection la plus agressive ; l'accès aux ressources critiques est verrouillé.",

    "acil.düşük": "faible",
    "acil.orta": "moyen",
    "acil.yüksek": "élevé",
    "acil.kritik": "critique",

    "sinyal.tahmin": "Prévision d'attaque",
    "sinyal.killChain": "Progression de la kill-chain",
    "sinyal.risk": "Risque unifié",
    "sinyal.niyet": "Intention de l'attaquant",
    "sinyal.ekonomi": "Économie des bots",

    "mot.finansal": "financière",
    "mot.veri": "données",
    "mot.yikim": "destruction",
    "mot.kesif": "reconnaissance",
    "mot.kotuye": "abus",
    "mot.belirsiz": "indéterminée",

    "siddet.izle": "surveiller",
    "siddet.uyari": "alerte",
    "siddet.kritik": "critique",
    "trend.artıyor": "en hausse",
    "trend.azalıyor": "en baisse",
    "trend.sabit": "stable",

    "ozet.tahmin.yok": "Aucune donnée de prévision.",
    "ozet.tahmin.sakin": "Aucune vague anormale imminente prévue.",
    "ozet.tahmin.aktif": "{parcalar}",
    "ozet.tahmin.uyari": "alerte précoce « {siddet} »",
    "ozet.tahmin.sicrama": "pic soudain {kat}×",
    "ozet.tahmin.trendArtiyor": "tendance du volume en hausse",
    "ozet.tahmin.hiz": "débit actuel {n}/heure",
    "ozet.killChain.yok": "Aucune chaîne d'attaque active.",
    "ozet.killChain.aktif": "{zincir} chaînes, {ileri} ont atteint l'exploitation/exfiltration, {durdurma}% arrêtées.",
    "ozet.niyet.yok": "Aucun attaquant classé.",
    "ozet.niyet.aktif": "{saldirgan} attaquants ; intention dominante « {niyet} » (confiance {guven}%).",
    "ozet.risk.yok": "Aucune IP à score de risque.",
    "ozet.risk.aktif": "{ip} IP ; {kritik} critiques, {yuksek} élevées, risque moy. {ort}.",
    "ozet.ekonomi.yok": "Aucune classe d'attaque économique.",
    "ozet.ekonomi.aktif": "{caydirilan}/{toplam} classes rendues non rentables ; profit restant de l'attaquant ~{kar} $.",

    "aksiyon.hassasYol.baslik": "Durcir les chemins sensibles",
    "aksiyon.hassasYol.metin": "Augmenter le niveau de difficulté sur les chemins login/checkout/admin et bloquer directement les signatures d'automatisation.",
    "aksiyon.ipEngelle.baslik": "Bloquer {n} IP à haut risque",
    "aksiyon.ipEngelle.metin": "Appliquer une règle de blocage automatique pour les {n} IP que le moteur de risque unifié recommande de « bloquer ».",
    "aksiyon.kimlikKoru.baslik": "Mettre les flux d'identité en mode protection",
    "aksiyon.kimlikKoru.metin": "Appliquer une vérification renforcée (step-up) et une limitation de débit aux points de connexion/paiement ; surveiller les signatures de credential-stuffing.",
    "aksiyon.kaynakOranSinir.baslik": "Limiter le débit contre l'épuisement des ressources",
    "aksiyon.kaynakOranSinir.metin": "Renforcer la limitation de débit par IP contre l'intention de DDoS/destruction, mettre en cache/file les points coûteux.",
    "aksiyon.dalgaHazirlan.baslik": "Se préparer à la vague imminente",
    "aksiyon.dalgaHazirlan.metin": "Mettre à l'échelle la capacité/le cache edge avant le pic prévu, activer la surveillance en direct dans le centre de commande.",
    "aksiyon.dalgaSonumle.baslik": "Amortir la vague active",
    "aksiyon.dalgaSonumle.metin": "Activer l'escalade automatique de la difficulté pour la vague active et surveiller le trafic de près.",
    "aksiyon.ekonomiKirsizlastir.baslik": "Rendre l'économie de l'attaque non rentable",
    "aksiyon.ekonomiKirsizlastir.metin": "Augmenter la difficulté ghost-font et le coût des tentatives pour les classes d'attaque encore rentables (casser le ROI de la ferme de résolution).",
    "aksiyon.playbook.baslik": "Lancer le playbook de réponse coordonnée",
    "aksiyon.playbook.metin": "Posture de verrouillage déclenchée : lancer la réponse coordonnée depuis le centre de commande et envoyer une alerte critique à l'équipe.",
    "aksiyon.gozlem.baslik": "Maintenir la surveillance standard",
    "aksiyon.gozlem.metin": "Les signaux sont calmes. Les politiques de protection actuelles suffisent ; seule une observation de routine est nécessaire.",

    "dayanak.killChain": "Kill-Chain : {ozet}",
    "dayanak.risk": "Risque unifié : {ozet}",
    "dayanak.niyet": "Intention : {ozet}",
    "dayanak.tahmin": "Prévision : {ozet}",
    "dayanak.ekonomi": "Économie : {ozet}",
    "dayanak.fuzyon": "Fusion : pression de menace critique — plusieurs signaux élevés en même temps.",
    "dayanak.fuzyonSakin": "Fusion : tous les signaux sous le seuil.",

    "gerekce.bos": "Aucune couche de détection n'a produit de signal significatif ; le système est calme — la protection standard suffit.",
    "gerekce.dolu": "Posture recommandée : {durus} (pression de menace {skor}/100). Principales contributions : {parcalar}",
    "gerekce.parca": "{ad} ({ozet})",
  },

  es: {
    "o.baslik": "Orquestador de defensa autónomo",

    "o.namus.baslik": "Fusión de apoyo a la decisión",
    "o.namus.metin":
      "Este panel fusiona las <b>salidas reales</b> de los demás motores de detección (pronóstico de ataque, intención, kill-chain, economía de bots, riesgo unificado) en una única postura de defensa. Las acciones recomendadas <b>no se aplican automáticamente</b>; «aplicar (simular)» solo marca una cola local de la sesión.",

    "o.oneriDurus": "Postura de defensa recomendada",
    "o.tehditBasinci": "/ 100 presión de amenaza",
    "o.durusEtiket": "Postura: {ad}",
    "o.fuzyonGuveni": "Confianza de la fusión",

    "o.nedenDurus": "¿Por qué esta postura?",
    "o.fuzyonGerekcesi": "justificación de la fusión",
    "o.mini.saldirgan": "Atacantes",
    "o.mini.saldirgan.niyet": "intención: {ad}",
    "o.mini.saldirgan.yok": "sin clasificar",
    "o.mini.killChain": "Kill-chain",
    "o.mini.killChain.alt": "{ileri} avanzadas · {durdurma}% detenidas",
    "o.mini.kritikIp": "IP críticas",
    "o.mini.kritikIp.alt": "{n} sugerencias de bloqueo",
    "o.mini.caydirilan": "Disuadidas",
    "o.mini.caydirilan.alt": "clases no rentables",
    "o.mini.trend": "Tendencia",
    "o.mini.olay": "Eventos",
    "o.mini.olay.alt": "ventana de análisis",

    "o.sinyalFuzyonu": "Fusión de señales",
    "o.aciklanabilirlik": "explicabilidad",

    "o.aksiyonPlani": "Plan de acción autónomo",
    "o.aksiyonRozet": "{oto} automáticas · {manuel} manuales",
    "o.hepsiniUygula": "Aplicar todo (simular)",
    "o.kuyruguTemizle": "Vaciar cola",
    "o.kuyrukNot": "<b>{n}</b> acciones puestas en cola local de la sesión (simulación). La aplicación real ocurre con reglas aprobadas en los paneles correspondientes — esta pantalla no toca producción.",
    "o.otomatik": "automática",
    "o.onayGerekir": "requiere aprobación",
    "o.dayanak": "Fundamento:",
    "o.kuyrukta": "En cola",
    "o.kuyrugaAl": "Añadir a la cola",
    "o.paneleGit": "Ir al panel",

    "durus.normal": "Normal",
    "durus.yükseltilmiş": "Elevada",
    "durus.savunma": "Defensiva",
    "durus.kilit": "Bloqueo",
    "durusAcik.normal": "Las señales están en calma. La protección estándar es suficiente; no se necesita intervención.",
    "durusAcik.yükseltilmiş": "Presión creciente observada. La monitorización se intensifica y aumenta la verificación del tráfico sospechoso.",
    "durusAcik.savunma": "Amenaza activa. Las rutas sensibles se refuerzan, la limitación de tasa y la dificultad aumentan.",
    "durusAcik.kilit": "Ataque crítico/coordinado. La protección más agresiva; el acceso a los recursos críticos se bloquea.",

    "acil.düşük": "baja",
    "acil.orta": "media",
    "acil.yüksek": "alta",
    "acil.kritik": "crítica",

    "sinyal.tahmin": "Pronóstico de ataque",
    "sinyal.killChain": "Progresión de la kill-chain",
    "sinyal.risk": "Riesgo unificado",
    "sinyal.niyet": "Intención del atacante",
    "sinyal.ekonomi": "Economía de bots",

    "mot.finansal": "financiera",
    "mot.veri": "datos",
    "mot.yikim": "destrucción",
    "mot.kesif": "reconocimiento",
    "mot.kotuye": "abuso",
    "mot.belirsiz": "indeterminada",

    "siddet.izle": "observar",
    "siddet.uyari": "alerta",
    "siddet.kritik": "crítica",
    "trend.artıyor": "en aumento",
    "trend.azalıyor": "en descenso",
    "trend.sabit": "estable",

    "ozet.tahmin.yok": "Sin datos de pronóstico.",
    "ozet.tahmin.sakin": "No se pronostica ninguna ola anormal inminente.",
    "ozet.tahmin.aktif": "{parcalar}",
    "ozet.tahmin.uyari": "alerta temprana «{siddet}»",
    "ozet.tahmin.sicrama": "pico repentino {kat}×",
    "ozet.tahmin.trendArtiyor": "tendencia de volumen en aumento",
    "ozet.tahmin.hiz": "tasa actual {n}/hora",
    "ozet.killChain.yok": "Sin cadenas de ataque activas.",
    "ozet.killChain.aktif": "{zincir} cadenas, {ileri} alcanzaron explotación/exfiltración, {durdurma}% detenidas.",
    "ozet.niyet.yok": "Sin atacantes clasificados.",
    "ozet.niyet.aktif": "{saldirgan} atacantes; intención dominante «{niyet}» (confianza {guven}%).",
    "ozet.risk.yok": "Sin IP con puntuación de riesgo.",
    "ozet.risk.aktif": "{ip} IP; {kritik} críticas, {yuksek} altas, riesgo prom. {ort}.",
    "ozet.ekonomi.yok": "Sin clases de ataque económico.",
    "ozet.ekonomi.aktif": "{caydirilan}/{toplam} clases vueltas no rentables; beneficio restante del atacante ~{kar} $.",

    "aksiyon.hassasYol.baslik": "Reforzar las rutas sensibles",
    "aksiyon.hassasYol.metin": "Subir el nivel de dificultad en las rutas login/checkout/admin y bloquear directamente las firmas de automatización.",
    "aksiyon.ipEngelle.baslik": "Bloquear {n} IP de alto riesgo",
    "aksiyon.ipEngelle.metin": "Aplicar una regla de bloqueo automático para las {n} IP que el motor de riesgo unificado recomienda «bloquear».",
    "aksiyon.kimlikKoru.baslik": "Poner los flujos de identidad en modo protección",
    "aksiyon.kimlikKoru.metin": "Aplicar verificación reforzada (step-up) y limitación de tasa a los endpoints de acceso/pago; vigilar las firmas de credential-stuffing.",
    "aksiyon.kaynakOranSinir.baslik": "Limitar la tasa contra el agotamiento de recursos",
    "aksiyon.kaynakOranSinir.metin": "Endurecer la limitación de tasa por IP contra la intención de DDoS/destrucción, cachear/encolar los endpoints costosos.",
    "aksiyon.dalgaHazirlan.baslik": "Prepararse para la ola inminente",
    "aksiyon.dalgaHazirlan.metin": "Escalar la capacidad/caché edge antes del pico previsto, activar la monitorización en vivo en el centro de mando.",
    "aksiyon.dalgaSonumle.baslik": "Amortiguar la ola activa",
    "aksiyon.dalgaSonumle.metin": "Activar el escalado automático de dificultad para la ola activa y monitorizar el tráfico de cerca.",
    "aksiyon.ekonomiKirsizlastir.baslik": "Hacer no rentable la economía del ataque",
    "aksiyon.ekonomiKirsizlastir.metin": "Subir la dificultad ghost-font y el coste de los intentos para las clases de ataque aún rentables (romper el ROI de la granja de resolución).",
    "aksiyon.playbook.baslik": "Lanzar el playbook de respuesta coordinada",
    "aksiyon.playbook.metin": "Postura de bloqueo activada: lanzar la respuesta coordinada desde el centro de mando y enviar una alerta crítica al equipo.",
    "aksiyon.gozlem.baslik": "Mantener la monitorización estándar",
    "aksiyon.gozlem.metin": "Las señales están en calma. Las políticas de protección actuales son suficientes; solo se necesita observación de rutina.",

    "dayanak.killChain": "Kill-Chain: {ozet}",
    "dayanak.risk": "Riesgo unificado: {ozet}",
    "dayanak.niyet": "Intención: {ozet}",
    "dayanak.tahmin": "Pronóstico: {ozet}",
    "dayanak.ekonomi": "Economía: {ozet}",
    "dayanak.fuzyon": "Fusión: presión de amenaza crítica — varias señales altas a la vez.",
    "dayanak.fuzyonSakin": "Fusión: todas las señales por debajo del umbral.",

    "gerekce.bos": "Ninguna capa de detección produjo una señal significativa; el sistema está en calma — la protección estándar es suficiente.",
    "gerekce.dolu": "Postura recomendada: {durus} (presión de amenaza {skor}/100). Contribuciones principales: {parcalar}",
    "gerekce.parca": "{ad} ({ozet})",
  },
};

/* ------------------------------------------------------------- Temel çevirmen */

export function orkestraCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}

/** {token} yer tutucularını veriyle doldur. */
function doldur(sablon: string, veri: Veri): string {
  let s = sablon;
  for (const [k, v] of Object.entries(veri)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

/* ---------------------------------------------------------- Enum-anahtarlı yardımcılar */

/** Duruş adı (enum değeri asla çevrilmez, yalnızca anahtar). */
export function durusAd(d: Durus, dil: Dil): string {
  return orkestraCeviri(`durus.${d}`, dil);
}
/** Duruş açıklaması. */
export function durusAcik(d: Durus, dil: Dil): string {
  return orkestraCeviri(`durusAcik.${d}`, dil);
}
/** Aciliyet etiketi. */
export function aciliyetAd(a: Aciliyet, dil: Dil): string {
  return orkestraCeviri(`acil.${a}`, dil);
}
/** Sinyal adı (katki.anahtar ile). */
export function sinyalAd(anahtar: string, dil: Dil): string {
  return orkestraCeviri(`sinyal.${anahtar}`, dil);
}

/** Motivasyon enum'unu (finansal/veri/…) çevir; boş/bilinmeyen için "belirsiz". */
function motAd(m: string, dil: Dil): string {
  if (!m) return orkestraCeviri("mot.belirsiz", dil);
  const anahtar = `mot.${m}`;
  const c = orkestraCeviri(anahtar, dil);
  return c === anahtar ? m : c;
}

/* ------------------------------------------------------ Sinyal özeti yeniden kurma */

/**
 * Bir sinyal katkısının özet metnini VERİDEN yeniden kurar. Enum token'ları
 * (uyarı şiddeti, trend, niyet) alt sözlüklerle çevrilir; sayılar aynen yerleşir.
 */
export function katkiOzet(k: SinyalKatki, dil: Dil): string {
  const { ozetAnahtar, ozetVeri } = k;

  // Tahmin "aktif" özeti birden çok parçadan oluşur; parçaları burada kurup birleştiririz.
  if (ozetAnahtar === "ozet.tahmin.aktif") {
    const parcalar: string[] = [];
    if (ozetVeri.uyari) {
      parcalar.push(
        doldur(orkestraCeviri("ozet.tahmin.uyari", dil), { siddet: orkestraCeviri(`siddet.${ozetVeri.uyari}`, dil) }),
      );
    }
    if (ozetVeri.aniSicrama) {
      parcalar.push(doldur(orkestraCeviri("ozet.tahmin.sicrama", dil), { kat: ozetVeri.aniSicrama }));
    }
    if (ozetVeri.trend === "artıyor") parcalar.push(orkestraCeviri("ozet.tahmin.trendArtiyor", dil));
    if (ozetVeri.hiz) parcalar.push(doldur(orkestraCeviri("ozet.tahmin.hiz", dil), { n: ozetVeri.hiz }));
    // Hiç parça yoksa (kenar durum) sakin metne düş.
    if (parcalar.length === 0) return orkestraCeviri("ozet.tahmin.sakin", dil);
    return parcalar.join(", ");
  }

  // Niyet özeti: baskın niyet enum'unu çevir.
  if (ozetAnahtar === "ozet.niyet.aktif") {
    return doldur(orkestraCeviri(ozetAnahtar, dil), { ...ozetVeri, niyet: motAd(String(ozetVeri.niyet ?? ""), dil) });
  }

  // Diğer özetler: düz token doldurma.
  return doldur(orkestraCeviri(ozetAnahtar, dil), ozetVeri);
}

/* ------------------------------------------------------ Aksiyon metni yeniden kurma */

export function aksiyonBaslik(a: AutoAksiyon, dil: Dil): string {
  return doldur(orkestraCeviri(`aksiyon.${a.id}.baslik`, dil), a.veri);
}
export function aksiyonMetin(a: AutoAksiyon, dil: Dil): string {
  return doldur(orkestraCeviri(`aksiyon.${a.id}.metin`, dil), a.veri);
}

/**
 * Aksiyonun dayanağını yeniden kurar: sinyal öneki + o sinyalin çevrilmiş özeti.
 * Özeti, ilgili katkı listesinden (aynı anahtarla) çekip çeviririz.
 */
export function aksiyonDayanak(a: AutoAksiyon, katkilar: SinyalKatki[], dil: Dil): string {
  const anahtar = a.dayanakAnahtar;
  // Füzyon dayanakları özet almaz (sabit metin).
  if (anahtar === "fuzyon" || anahtar === "fuzyonSakin") {
    return orkestraCeviri(`dayanak.${anahtar}`, dil);
  }
  const katki = katkilar.find((k) => k.anahtar === anahtar);
  const ozet = katki ? katkiOzet(katki, dil) : "";
  return doldur(orkestraCeviri(`dayanak.${anahtar}`, dil), { ozet });
}

/* ------------------------------------------------------ Gerekçe yeniden kurma */

/** Genel füzyon gerekçesini yapısal veriden yeniden kurar. */
export function gerekceMetin(gv: GerekceVeri, katkilar: SinyalKatki[], dil: Dil): string {
  if (gv.kip === "bos") return orkestraCeviri("gerekce.bos", dil);
  const parcalar = gv.parcalar.map((p) => {
    const katki = katkilar.find((k) => k.anahtar === p.anahtar);
    const ozet = katki ? katkiOzet(katki, dil) : "";
    return doldur(orkestraCeviri("gerekce.parca", dil), { ad: sinyalAd(p.anahtar, dil), ozet });
  });
  return doldur(orkestraCeviri("gerekce.dolu", dil), {
    durus: durusAd(gv.durus, dil),
    skor: gv.skor,
    parcalar: parcalar.join(" · "),
  });
}

/** İstemci mini-ölçüt "niyet" göstergesi için baskın niyet enum'unu çevir. */
export function baskinNiyetAd(m: string | null, dil: Dil): string | null {
  return m ? motAd(m, dil) : null;
}

// DURUS_META yalnızca renk/sıra/ikon için istemcide kullanılmaya devam eder;
// ad/açıklama artık durusAd/durusAcik ile çevrilir.
void DURUS_META;
