/**
 * Uptime & SLA İzleme sayfası — yerel çeviri sözlüğü.
 *
 * Sadece bu sayfaya özgü kullanıcı-görünür metinleri içerir. Paylaşılan
 * `src/lib/i18n/panel.ts` sözlüğüne DOKUNMAZ. Anahtar bulunamazsa TR'ye,
 * o da yoksa anahtarın kendisine düşer.
 *
 * Not: servisler.ts'teki DATA (enum değerleri, sayılar, tohumlar, tarihler)
 * olduğu gibi kalır; burada yalnızca o veriye karşılık gelen GÖRÜNEN
 * etiketler enum-anahtarlarına göre çevrilir (durum/etki/olay-durum, servis
 * ad+açıklama+grup, olay başlık+not, bölge adı).
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // --- Başlık + üst şerit ---
    "up.baslik": "Uptime & SLA İzleme",
    "up.kirinti": "Uptime & SLA",
    "up.metaTitle": "Uptime & SLA İzleme — Veylify",
    "up.aciklama":
      "Veylify platform servislerinin SLA uyumu, hata bütçesi, gecikme yüzdelikleri, uptime ve olay geçmişi. Salt-okunur SRE konsolu — tüm ekip görebilir.",
    "up.temsiliNot":
      "Temsili platform durumu: bu sayfadaki servis kataloğu, uptime şeritleri ve olay geçmişi canlı probing'den GELMEZ — deterministik temsili değerlerdir. Gerçek zamanlı sağlık izleme yakında bağlanacak.",
    "up.servisRozet": "servis",
    "up.hepsiCalisiyor": "Tüm sistemler çalışıyor",
    "up.kismiBozulma": "Kısmi bozulma",

    // --- 1. Üst özet ---
    "up.genelUptime": "Genel uptime (90 gün, SLA)",
    "up.operasyonelServis": "Operasyonel servis",
    "up.dejenereDelta": "dejenere",
    "up.ortYanit": "Ortalama yanıt süresi",
    "up.son90Olay": "Son 90 günde olay",

    // --- 2. SLA uyum özeti ---
    "up.slaBaslik": "SLA uyum özeti & hata bütçesi",
    "up.slaKarsilandi": "SLA karşılandı",
    "up.slaRiskte": "Bütçe riskte",
    "up.slaIhlal": "SLA ihlal edildi",
    "up.gerceklesenUptime": "Gerçekleşen uptime (30g)",
    "up.hedef": "hedef",
    "up.hedefUstunde": "hedef üstünde",
    "up.hedefAltinda": "hedef altında",
    "up.taahhut": "taahhüt",
    "up.aylikHataButcesi": "Aylık hata bütçesi",
    "up.kaldiYuzde": "kaldı",
    "up.dkKaldi": "dk kaldı",
    "up.tuketildi": "tüketildi",
    "up.slaKademeleri": "SLA kademeleri (dokuzlar)",
    "up.aktifHedef": "aktif hedef",
    "up.dkAy": "dk/ay",
    "up.saYil": "sa/yıl",
    "up.butceAciklamaBas": "Hata bütçesi",
    "up.butceAciklama":
      ", {hedef} SLA hedefinin izin verdiği aylık kesinti payıdır ({izinli} dk/ay). Gerçekleşen uptime incident sürelerinden türetilir; kısmi kesintiler etki payıyla ağırlıklandırılır, planlı bakım (salt-okunur mod) bütçeye sayılmaz. Bütçe tükenmeden risk-alma serbest — tükenince değişiklik dondurulur (error-budget policy).",

    // --- 3. Servis sağlık matrisi ---
    "up.matrisBaslik": "Servis sağlık matrisi — 90 günlük geçmiş",
    "up.guncel": "güncel",
    "up.gunOnce90": "90 gün önce",
    "up.bugun": "bugün",
    "up.uptimeSonKontrol": "uptime · son kontrol",

    // Şerit lejantı + tooltip durumları
    "up.lejantCalisiyor": "Çalışıyor",
    "up.lejantDejenere": "Dejenere",
    "up.lejantKesinti": "Kesinti",
    "up.gunUp": "Çalışıyor",
    "up.gunDegraded": "Dejenere performans",
    "up.gunDown": "Kesinti",

    // Göreli süre birimleri
    "up.snOnce": "sn önce",
    "up.dkOnce": "dk önce",
    "up.saOnce": "sa önce",

    // --- 4. Gecikme yüzdelikleri ---
    "up.yuzdelikBaslik": "Gecikme yüzdelikleri (p50 / p95 / p99)",
    "up.gercekOrnek": "gerçek örnek",
    "up.temsiliDagilim": "temsili dağılım",
    "up.medyanYanit": "medyan yanıt",
    "up.kuyruk95": "kuyruk (%95)",
    "up.enKotu1": "en kötü %1",
    "up.ort": "ort",
    "up.min": "min",
    "up.max": "max",
    "up.ornek": "örnek",
    "up.yanitDagilimi": "Yanıt süresi dağılımı",

    // --- 5. Yanıt süresi trendi ---
    "up.trendBaslik": "Yanıt süresi trendi (p50 / p95 / p99)",
    "up.son24s": "Son 24s",
    "up.son7g": "Son 7g",
    "up.trendGuncel": "Güncel",
    "up.trendP99Son": "p99 (son)",

    // --- 6. Hata bütçesi yakma ---
    "up.yakmaBaslik": "Hata bütçesi yakma trendi (burn-down)",
    "up.yakmaAciklama":
      "Son 30 günde hata bütçesinin kalan payı. %0'a inmek, aylık SLA hedefinin ({kademe}) tükendiğini gösterir.",

    // --- 7. Olay geçmişi ---
    "up.olayBaslik": "Olay geçmişi (incident timeline)",
    "up.son90Kayit": "son 90 gün",
    "up.kayit": "kayıt",
    "up.kolServis": "Servis",
    "up.kolOlay": "Olay",
    "up.kolBaslangic": "Başlangıç",
    "up.kolSure": "Süre",
    "up.kolSlaEtki": "SLA etkisi",
    "up.kolEtki": "Etki",
    "up.kolDurum": "Durum",
    "up.butceDisi": "bütçe dışı",
    "up.dk": "dk",
    "up.butce": "bütçe",
    "up.olayBos": "Son 90 günde kayıtlı olay yok — sistemler kesintisiz çalıştı.",
    "up.olayAra": "Olaylarda ara…",

    // --- 8. Bölgesel sağlık ---
    "up.bolgeBaslik": "Bölgesel erişilebilirlik",
    "up.bolgeRozet": "bölge",

    // --- Durum etiketleri (ServisDurum enum) ---
    "up.durum.operasyonel": "Operasyonel",
    "up.durum.dejenere": "Dejenere performans",
    "up.durum.kesinti": "Kesinti",

    // --- Etki etiketleri (Olay.etki enum) ---
    "up.etki.tam": "Tam kesinti",
    "up.etki.kismi": "Kısmi kesinti",
    "up.etki.bakim": "Planlı bakım",

    // --- Olay durum etiketleri (Olay.durum enum) ---
    "up.olayDurum.cozuldu": "Çözüldü",
    "up.olayDurum.izleniyor": "İzleniyor",
    "up.olayDurum.arastiriliyor": "Araştırılıyor",

    // --- Grup etiketleri ---
    "up.grup.API": "API",
    "up.grup.Dağıtım": "Dağıtım",
    "up.grup.Uygulama": "Uygulama",

    // --- Servis adları + açıklamaları (id anahtarlı) ---
    "up.svc.challenge-api.ad": "Challenge API",
    "up.svc.challenge-api.ac": "Ghost-font challenge üretimi ve temporal dithering",
    "up.svc.verify-api.ad": "Verify API",
    "up.svc.verify-api.ac": "Token doğrulama ve challenge çözüm kontrolü",
    "up.svc.siteverify-api.ad": "Siteverify API",
    "up.svc.siteverify-api.ac": "Sunucu-taraflı /siteverify uç doğrulaması",
    "up.svc.passive-api.ad": "Passive API",
    "up.svc.passive-api.ac": "Görünmez mod pasif sinyal & davranış toplama",
    "up.svc.widget-cdn.ad": "Widget CDN",
    "up.svc.widget-cdn.ac": "veylify.js widget dağıtımı (küresel edge)",
    "up.svc.dashboard.ad": "Dashboard",
    "up.svc.dashboard.ac": "Yönetim paneli ve arayüz uygulaması",
    "up.svc.webhook-teslimat.ad": "Webhook Teslimat",
    "up.svc.webhook-teslimat.ac": "Olay bildirimlerinin dışa teslimi (retry kuyruğu)",
    "up.svc.edge-agi.ad": "Edge Ağı",
    "up.svc.edge-agi.ac": "Anycast edge katmanı (16 PoP, 6 bölge)",

    // --- Bölge adları (id anahtarlı) ---
    "up.bolge.Avrupa": "Avrupa",
    "up.bolge.Kuzey Amerika": "Kuzey Amerika",
    "up.bolge.Asya-Pasifik": "Asya-Pasifik",
    "up.bolge.Güney Amerika": "Güney Amerika",
    "up.bolge.Okyanusya": "Okyanusya",
    "up.bolge.Afrika / Orta Doğu": "Afrika / Orta Doğu",

    // --- Olay başlık + notları (id anahtarlı) ---
    "up.inc.inc-2026-0712.baslik": "Pasif sinyal işlemede artan gecikme",
    "up.inc.inc-2026-0712.not":
      "Davranış biyometrisi kuyruğunda birikme p95'i geçici olarak 2x artırdı. Kuyruk ölçeklendi; kök neden izleniyor.",
    "up.inc.inc-2026-0703.baslik": "Webhook retry kuyruğu gecikmesi",
    "up.inc.inc-2026-0703.not":
      "Üçüncü-taraf uç noktalardaki timeout'lar retry kuyruğunu doldurdu. Circuit-breaker eşiği düşürüldü, teslimatlar normale döndü.",
    "up.inc.inc-2026-0621.baslik": "Planlı altyapı bakımı",
    "up.inc.inc-2026-0621.not":
      "Panel veritabanı sürüm yükseltmesi. Salt-okunur mod aktifti; kesinti yaşanmadı, yazma işlemleri 25 dk ertelendi.",
    "up.inc.inc-2026-0609.baslik": "Bölgesel çözümleme hatası (EU-batı)",
    "up.inc.inc-2026-0609.not":
      "Tek bir edge bölgesinde DNS çözümleme hatası isteklerin ~%6'sını etkiledi. Trafik komşu bölgeye devrildi.",
    "up.inc.inc-2026-0524.baslik": "Kısa süreli tam kesinti",
    "up.inc.inc-2026-0524.not":
      "Hatalı yapılandırma dağıtımı challenge üretimini 6 dk durdurdu. Otomatik geri-alma tetiklendi; dağıtım kapısı sıkılaştırıldı.",
    "up.inc.inc-2026-0508.baslik": "Artan hata oranı (5xx)",
    "up.inc.inc-2026-0508.not":
      "Önbellek düğümü başarısızlığı doğrulama isteklerinin bir kısmında 5xx döndürdü. Düğüm değiştirildi, önbellek yeniden ısındı.",
  },

  en: {
    "up.baslik": "Uptime & SLA Monitoring",
    "up.kirinti": "Uptime & SLA",
    "up.metaTitle": "Uptime & SLA Monitoring — Veylify",
    "up.aciklama":
      "SLA compliance, error budget, latency percentiles, uptime and incident history for Veylify platform services. Read-only SRE console — visible to the whole team.",
    "up.temsiliNot":
      "Representative platform status: the service catalog, uptime bars and incident history on this page do NOT come from live probing — they are deterministic representative values. Real-time health monitoring will be connected soon.",
    "up.servisRozet": "services",
    "up.hepsiCalisiyor": "All systems operational",
    "up.kismiBozulma": "Partial degradation",

    "up.genelUptime": "Overall uptime (90 days, SLA)",
    "up.operasyonelServis": "Operational services",
    "up.dejenereDelta": "degraded",
    "up.ortYanit": "Average response time",
    "up.son90Olay": "Incidents in last 90 days",

    "up.slaBaslik": "SLA compliance summary & error budget",
    "up.slaKarsilandi": "SLA met",
    "up.slaRiskte": "Budget at risk",
    "up.slaIhlal": "SLA breached",
    "up.gerceklesenUptime": "Actual uptime (30d)",
    "up.hedef": "target",
    "up.hedefUstunde": "above target",
    "up.hedefAltinda": "below target",
    "up.taahhut": "commitment",
    "up.aylikHataButcesi": "Monthly error budget",
    "up.kaldiYuzde": "left",
    "up.dkKaldi": "min left",
    "up.tuketildi": "consumed",
    "up.slaKademeleri": "SLA tiers (nines)",
    "up.aktifHedef": "active target",
    "up.dkAy": "min/mo",
    "up.saYil": "hr/yr",
    "up.butceAciklamaBas": "Error budget",
    "up.butceAciklama":
      " is the monthly downtime allowance permitted by the {hedef} SLA target ({izinli} min/mo). Actual uptime is derived from incident durations; partial outages are weighted by impact share, and planned maintenance (read-only mode) doesn't count against the budget. Risk-taking is free until the budget is spent — once depleted, changes are frozen (error-budget policy).",

    "up.matrisBaslik": "Service health matrix — 90-day history",
    "up.guncel": "current",
    "up.gunOnce90": "90 days ago",
    "up.bugun": "today",
    "up.uptimeSonKontrol": "uptime · last check",

    "up.lejantCalisiyor": "Operational",
    "up.lejantDejenere": "Degraded",
    "up.lejantKesinti": "Outage",
    "up.gunUp": "Operational",
    "up.gunDegraded": "Degraded performance",
    "up.gunDown": "Outage",

    "up.snOnce": "s ago",
    "up.dkOnce": "m ago",
    "up.saOnce": "h ago",

    "up.yuzdelikBaslik": "Latency percentiles (p50 / p95 / p99)",
    "up.gercekOrnek": "real samples",
    "up.temsiliDagilim": "representative distribution",
    "up.medyanYanit": "median response",
    "up.kuyruk95": "tail (95%)",
    "up.enKotu1": "worst 1%",
    "up.ort": "avg",
    "up.min": "min",
    "up.max": "max",
    "up.ornek": "samples",
    "up.yanitDagilimi": "Response time distribution",

    "up.trendBaslik": "Response time trend (p50 / p95 / p99)",
    "up.son24s": "Last 24h",
    "up.son7g": "Last 7d",
    "up.trendGuncel": "Current",
    "up.trendP99Son": "p99 (latest)",

    "up.yakmaBaslik": "Error budget burn-down trend",
    "up.yakmaAciklama":
      "Remaining share of the error budget over the last 30 days. Reaching 0% means the monthly SLA target ({kademe}) has been exhausted.",

    "up.olayBaslik": "Incident history (incident timeline)",
    "up.son90Kayit": "last 90 days",
    "up.kayit": "records",
    "up.kolServis": "Service",
    "up.kolOlay": "Incident",
    "up.kolBaslangic": "Started",
    "up.kolSure": "Duration",
    "up.kolSlaEtki": "SLA impact",
    "up.kolEtki": "Impact",
    "up.kolDurum": "Status",
    "up.butceDisi": "excluded from budget",
    "up.dk": "min",
    "up.butce": "budget",
    "up.olayBos": "No incidents recorded in the last 90 days — systems ran without interruption.",
    "up.olayAra": "Search incidents…",

    "up.bolgeBaslik": "Regional availability",
    "up.bolgeRozet": "regions",

    "up.durum.operasyonel": "Operational",
    "up.durum.dejenere": "Degraded performance",
    "up.durum.kesinti": "Outage",

    "up.etki.tam": "Full outage",
    "up.etki.kismi": "Partial outage",
    "up.etki.bakim": "Planned maintenance",

    "up.olayDurum.cozuldu": "Resolved",
    "up.olayDurum.izleniyor": "Monitoring",
    "up.olayDurum.arastiriliyor": "Investigating",

    "up.grup.API": "API",
    "up.grup.Dağıtım": "Delivery",
    "up.grup.Uygulama": "Application",

    "up.svc.challenge-api.ad": "Challenge API",
    "up.svc.challenge-api.ac": "Ghost-font challenge generation and temporal dithering",
    "up.svc.verify-api.ad": "Verify API",
    "up.svc.verify-api.ac": "Token verification and challenge solution checking",
    "up.svc.siteverify-api.ad": "Siteverify API",
    "up.svc.siteverify-api.ac": "Server-side /siteverify endpoint verification",
    "up.svc.passive-api.ad": "Passive API",
    "up.svc.passive-api.ac": "Invisible-mode passive signal & behavior collection",
    "up.svc.widget-cdn.ad": "Widget CDN",
    "up.svc.widget-cdn.ac": "veylify.js widget delivery (global edge)",
    "up.svc.dashboard.ad": "Dashboard",
    "up.svc.dashboard.ac": "Admin panel and interface application",
    "up.svc.webhook-teslimat.ad": "Webhook Delivery",
    "up.svc.webhook-teslimat.ac": "Outbound delivery of event notifications (retry queue)",
    "up.svc.edge-agi.ad": "Edge Network",
    "up.svc.edge-agi.ac": "Anycast edge layer (16 PoPs, 6 regions)",

    "up.bolge.Avrupa": "Europe",
    "up.bolge.Kuzey Amerika": "North America",
    "up.bolge.Asya-Pasifik": "Asia-Pacific",
    "up.bolge.Güney Amerika": "South America",
    "up.bolge.Okyanusya": "Oceania",
    "up.bolge.Afrika / Orta Doğu": "Africa / Middle East",

    "up.inc.inc-2026-0712.baslik": "Increased latency in passive signal processing",
    "up.inc.inc-2026-0712.not":
      "A backlog in the behavioral biometrics queue temporarily raised p95 by 2x. The queue was scaled; root cause under investigation.",
    "up.inc.inc-2026-0703.baslik": "Webhook retry queue delay",
    "up.inc.inc-2026-0703.not":
      "Timeouts at third-party endpoints filled the retry queue. The circuit-breaker threshold was lowered and deliveries returned to normal.",
    "up.inc.inc-2026-0621.baslik": "Scheduled infrastructure maintenance",
    "up.inc.inc-2026-0621.not":
      "Panel database version upgrade. Read-only mode was active; no outage occurred, writes were deferred for 25 min.",
    "up.inc.inc-2026-0609.baslik": "Regional resolution failure (EU-west)",
    "up.inc.inc-2026-0609.not":
      "A DNS resolution failure in a single edge region affected ~6% of requests. Traffic was failed over to a neighboring region.",
    "up.inc.inc-2026-0524.baslik": "Brief full outage",
    "up.inc.inc-2026-0524.not":
      "A misconfigured deployment halted challenge generation for 6 min. Automatic rollback was triggered; the deployment gate was tightened.",
    "up.inc.inc-2026-0508.baslik": "Elevated error rate (5xx)",
    "up.inc.inc-2026-0508.not":
      "A cache node failure returned 5xx on a portion of verification requests. The node was replaced and the cache re-warmed.",
  },

  de: {
    "up.baslik": "Uptime- & SLA-Überwachung",
    "up.kirinti": "Uptime & SLA",
    "up.metaTitle": "Uptime- & SLA-Überwachung — Veylify",
    "up.aciklama":
      "SLA-Einhaltung, Fehlerbudget, Latenzperzentile, Uptime und Vorfallverlauf der Veylify-Plattformdienste. Schreibgeschützte SRE-Konsole — für das gesamte Team sichtbar.",
    "up.temsiliNot":
      "Repräsentativer Plattformstatus: Servicekatalog, Uptime-Balken und Vorfallverlauf auf dieser Seite stammen NICHT aus Live-Probing — es sind deterministische, repräsentative Werte. Echtzeit-Überwachung wird bald angebunden.",
    "up.servisRozet": "Dienste",
    "up.hepsiCalisiyor": "Alle Systeme betriebsbereit",
    "up.kismiBozulma": "Teilweise Beeinträchtigung",

    "up.genelUptime": "Gesamt-Uptime (90 Tage, SLA)",
    "up.operasyonelServis": "Betriebsbereite Dienste",
    "up.dejenereDelta": "beeinträchtigt",
    "up.ortYanit": "Durchschnittliche Antwortzeit",
    "up.son90Olay": "Vorfälle in den letzten 90 Tagen",

    "up.slaBaslik": "SLA-Einhaltungsübersicht & Fehlerbudget",
    "up.slaKarsilandi": "SLA erfüllt",
    "up.slaRiskte": "Budget gefährdet",
    "up.slaIhlal": "SLA verletzt",
    "up.gerceklesenUptime": "Tatsächliche Uptime (30 T)",
    "up.hedef": "Ziel",
    "up.hedefUstunde": "über Ziel",
    "up.hedefAltinda": "unter Ziel",
    "up.taahhut": "Zusage",
    "up.aylikHataButcesi": "Monatliches Fehlerbudget",
    "up.kaldiYuzde": "übrig",
    "up.dkKaldi": "Min übrig",
    "up.tuketildi": "verbraucht",
    "up.slaKademeleri": "SLA-Stufen (Neunen)",
    "up.aktifHedef": "aktives Ziel",
    "up.dkAy": "Min/Mon",
    "up.saYil": "Std/Jahr",
    "up.butceAciklamaBas": "Fehlerbudget",
    "up.butceAciklama":
      " ist der monatliche Ausfallanteil, den das {hedef}-SLA-Ziel zulässt ({izinli} Min/Mon). Die tatsächliche Uptime wird aus den Vorfalldauern abgeleitet; Teilausfälle werden nach Auswirkungsanteil gewichtet, und geplante Wartung (schreibgeschützter Modus) zählt nicht zum Budget. Risikofreudigkeit ist erlaubt, bis das Budget aufgebraucht ist — danach werden Änderungen eingefroren (Fehlerbudget-Richtlinie).",

    "up.matrisBaslik": "Dienstzustandsmatrix — 90-Tage-Verlauf",
    "up.guncel": "aktuell",
    "up.gunOnce90": "vor 90 Tagen",
    "up.bugun": "heute",
    "up.uptimeSonKontrol": "Uptime · letzte Prüfung",

    "up.lejantCalisiyor": "Betriebsbereit",
    "up.lejantDejenere": "Beeinträchtigt",
    "up.lejantKesinti": "Ausfall",
    "up.gunUp": "Betriebsbereit",
    "up.gunDegraded": "Beeinträchtigte Leistung",
    "up.gunDown": "Ausfall",

    "up.snOnce": "Sek. her",
    "up.dkOnce": "Min. her",
    "up.saOnce": "Std. her",

    "up.yuzdelikBaslik": "Latenzperzentile (p50 / p95 / p99)",
    "up.gercekOrnek": "echte Stichproben",
    "up.temsiliDagilim": "repräsentative Verteilung",
    "up.medyanYanit": "mittlere Antwort",
    "up.kuyruk95": "Ausläufer (95 %)",
    "up.enKotu1": "schlechteste 1 %",
    "up.ort": "Ø",
    "up.min": "Min",
    "up.max": "Max",
    "up.ornek": "Stichproben",
    "up.yanitDagilimi": "Antwortzeitverteilung",

    "up.trendBaslik": "Antwortzeit-Trend (p50 / p95 / p99)",
    "up.son24s": "Letzte 24 Std",
    "up.son7g": "Letzte 7 T",
    "up.trendGuncel": "Aktuell",
    "up.trendP99Son": "p99 (aktuell)",

    "up.yakmaBaslik": "Fehlerbudget-Verbrauchstrend (Burn-down)",
    "up.yakmaAciklama":
      "Verbleibender Anteil des Fehlerbudgets über die letzten 30 Tage. Erreicht der Wert 0 %, ist das monatliche SLA-Ziel ({kademe}) aufgebraucht.",

    "up.olayBaslik": "Vorfallverlauf (Incident-Timeline)",
    "up.son90Kayit": "letzte 90 Tage",
    "up.kayit": "Einträge",
    "up.kolServis": "Dienst",
    "up.kolOlay": "Vorfall",
    "up.kolBaslangic": "Beginn",
    "up.kolSure": "Dauer",
    "up.kolSlaEtki": "SLA-Auswirkung",
    "up.kolEtki": "Auswirkung",
    "up.kolDurum": "Status",
    "up.butceDisi": "budgetneutral",
    "up.dk": "Min",
    "up.butce": "Budget",
    "up.olayBos": "In den letzten 90 Tagen keine Vorfälle erfasst — die Systeme liefen ununterbrochen.",
    "up.olayAra": "Vorfälle durchsuchen…",

    "up.bolgeBaslik": "Regionale Verfügbarkeit",
    "up.bolgeRozet": "Regionen",

    "up.durum.operasyonel": "Betriebsbereit",
    "up.durum.dejenere": "Beeinträchtigte Leistung",
    "up.durum.kesinti": "Ausfall",

    "up.etki.tam": "Vollständiger Ausfall",
    "up.etki.kismi": "Teilausfall",
    "up.etki.bakim": "Geplante Wartung",

    "up.olayDurum.cozuldu": "Behoben",
    "up.olayDurum.izleniyor": "Wird überwacht",
    "up.olayDurum.arastiriliyor": "Wird untersucht",

    "up.grup.API": "API",
    "up.grup.Dağıtım": "Auslieferung",
    "up.grup.Uygulama": "Anwendung",

    "up.svc.challenge-api.ad": "Challenge API",
    "up.svc.challenge-api.ac": "Ghost-Font-Challenge-Erzeugung und Temporal Dithering",
    "up.svc.verify-api.ad": "Verify API",
    "up.svc.verify-api.ac": "Token-Verifizierung und Prüfung der Challenge-Lösung",
    "up.svc.siteverify-api.ad": "Siteverify API",
    "up.svc.siteverify-api.ac": "Serverseitige Verifizierung des /siteverify-Endpunkts",
    "up.svc.passive-api.ad": "Passive API",
    "up.svc.passive-api.ac": "Passive Signal- & Verhaltenserfassung im unsichtbaren Modus",
    "up.svc.widget-cdn.ad": "Widget CDN",
    "up.svc.widget-cdn.ac": "specter.js-Widget-Auslieferung (globales Edge)",
    "up.svc.dashboard.ad": "Dashboard",
    "up.svc.dashboard.ac": "Verwaltungspanel und Oberflächenanwendung",
    "up.svc.webhook-teslimat.ad": "Webhook-Zustellung",
    "up.svc.webhook-teslimat.ac": "Ausgehende Zustellung von Ereignisbenachrichtigungen (Retry-Queue)",
    "up.svc.edge-agi.ad": "Edge-Netzwerk",
    "up.svc.edge-agi.ac": "Anycast-Edge-Schicht (16 PoPs, 6 Regionen)",

    "up.bolge.Avrupa": "Europa",
    "up.bolge.Kuzey Amerika": "Nordamerika",
    "up.bolge.Asya-Pasifik": "Asien-Pazifik",
    "up.bolge.Güney Amerika": "Südamerika",
    "up.bolge.Okyanusya": "Ozeanien",
    "up.bolge.Afrika / Orta Doğu": "Afrika / Naher Osten",

    "up.inc.inc-2026-0712.baslik": "Erhöhte Latenz bei der Verarbeitung passiver Signale",
    "up.inc.inc-2026-0712.not":
      "Ein Rückstau in der Verhaltensbiometrie-Queue erhöhte p95 vorübergehend um das 2-Fache. Die Queue wurde skaliert; die Ursache wird untersucht.",
    "up.inc.inc-2026-0703.baslik": "Verzögerung der Webhook-Retry-Queue",
    "up.inc.inc-2026-0703.not":
      "Timeouts bei Drittanbieter-Endpunkten füllten die Retry-Queue. Der Circuit-Breaker-Schwellenwert wurde gesenkt, und die Zustellungen normalisierten sich.",
    "up.inc.inc-2026-0621.baslik": "Geplante Infrastrukturwartung",
    "up.inc.inc-2026-0621.not":
      "Versions-Upgrade der Panel-Datenbank. Der schreibgeschützte Modus war aktiv; kein Ausfall, Schreibvorgänge wurden 25 Min verzögert.",
    "up.inc.inc-2026-0609.baslik": "Regionaler Auflösungsfehler (EU-West)",
    "up.inc.inc-2026-0609.not":
      "Ein DNS-Auflösungsfehler in einer einzelnen Edge-Region betraf ~6 % der Anfragen. Der Verkehr wurde auf eine benachbarte Region umgeleitet.",
    "up.inc.inc-2026-0524.baslik": "Kurzer vollständiger Ausfall",
    "up.inc.inc-2026-0524.not":
      "Ein fehlerhaftes Deployment stoppte die Challenge-Erzeugung für 6 Min. Ein automatisches Rollback wurde ausgelöst; das Deployment-Gate wurde verschärft.",
    "up.inc.inc-2026-0508.baslik": "Erhöhte Fehlerrate (5xx)",
    "up.inc.inc-2026-0508.not":
      "Ein Ausfall eines Cache-Knotens führte bei einem Teil der Verifizierungsanfragen zu 5xx. Der Knoten wurde ersetzt und der Cache neu aufgewärmt.",
  },

  fr: {
    "up.baslik": "Surveillance de la disponibilité et du SLA",
    "up.kirinti": "Disponibilité & SLA",
    "up.metaTitle": "Surveillance de la disponibilité et du SLA — Veylify",
    "up.aciklama":
      "Conformité au SLA, budget d'erreur, percentiles de latence, disponibilité et historique des incidents des services de la plateforme Veylify. Console SRE en lecture seule — visible par toute l'équipe.",
    "up.temsiliNot":
      "Statut de plateforme représentatif : le catalogue de services, les barres de disponibilité et l'historique des incidents de cette page ne proviennent PAS d'un sondage en direct — ce sont des valeurs représentatives déterministes. La surveillance en temps réel sera bientôt connectée.",
    "up.servisRozet": "services",
    "up.hepsiCalisiyor": "Tous les systèmes opérationnels",
    "up.kismiBozulma": "Dégradation partielle",

    "up.genelUptime": "Disponibilité globale (90 jours, SLA)",
    "up.operasyonelServis": "Services opérationnels",
    "up.dejenereDelta": "dégradé",
    "up.ortYanit": "Temps de réponse moyen",
    "up.son90Olay": "Incidents sur les 90 derniers jours",

    "up.slaBaslik": "Résumé de conformité SLA & budget d'erreur",
    "up.slaKarsilandi": "SLA respecté",
    "up.slaRiskte": "Budget à risque",
    "up.slaIhlal": "SLA non respecté",
    "up.gerceklesenUptime": "Disponibilité réelle (30 j)",
    "up.hedef": "cible",
    "up.hedefUstunde": "au-dessus de la cible",
    "up.hedefAltinda": "en dessous de la cible",
    "up.taahhut": "engagement",
    "up.aylikHataButcesi": "Budget d'erreur mensuel",
    "up.kaldiYuzde": "restant",
    "up.dkKaldi": "min restantes",
    "up.tuketildi": "consommé",
    "up.slaKademeleri": "Niveaux de SLA (neuf)",
    "up.aktifHedef": "cible active",
    "up.dkAy": "min/mois",
    "up.saYil": "h/an",
    "up.butceAciklamaBas": "Le budget d'erreur",
    "up.butceAciklama":
      " correspond à la part d'indisponibilité mensuelle autorisée par la cible SLA de {hedef} ({izinli} min/mois). La disponibilité réelle est dérivée de la durée des incidents ; les pannes partielles sont pondérées par leur part d'impact, et la maintenance planifiée (mode lecture seule) n'est pas comptée dans le budget. La prise de risque est libre tant que le budget n'est pas épuisé — une fois épuisé, les changements sont gelés (politique de budget d'erreur).",

    "up.matrisBaslik": "Matrice de santé des services — historique sur 90 jours",
    "up.guncel": "actuel",
    "up.gunOnce90": "il y a 90 jours",
    "up.bugun": "aujourd'hui",
    "up.uptimeSonKontrol": "disponibilité · dernière vérification",

    "up.lejantCalisiyor": "Opérationnel",
    "up.lejantDejenere": "Dégradé",
    "up.lejantKesinti": "Panne",
    "up.gunUp": "Opérationnel",
    "up.gunDegraded": "Performance dégradée",
    "up.gunDown": "Panne",

    "up.snOnce": "s",
    "up.dkOnce": "min",
    "up.saOnce": "h",

    "up.yuzdelikBaslik": "Percentiles de latence (p50 / p95 / p99)",
    "up.gercekOrnek": "échantillons réels",
    "up.temsiliDagilim": "distribution représentative",
    "up.medyanYanit": "réponse médiane",
    "up.kuyruk95": "queue (95 %)",
    "up.enKotu1": "pire 1 %",
    "up.ort": "moy",
    "up.min": "min",
    "up.max": "max",
    "up.ornek": "échantillons",
    "up.yanitDagilimi": "Distribution des temps de réponse",

    "up.trendBaslik": "Tendance du temps de réponse (p50 / p95 / p99)",
    "up.son24s": "24 h",
    "up.son7g": "7 j",
    "up.trendGuncel": "Actuel",
    "up.trendP99Son": "p99 (dernier)",

    "up.yakmaBaslik": "Tendance de consommation du budget d'erreur (burn-down)",
    "up.yakmaAciklama":
      "Part restante du budget d'erreur sur les 30 derniers jours. Atteindre 0 % signifie que la cible SLA mensuelle ({kademe}) est épuisée.",

    "up.olayBaslik": "Historique des incidents (chronologie)",
    "up.son90Kayit": "90 derniers jours",
    "up.kayit": "enregistrements",
    "up.kolServis": "Service",
    "up.kolOlay": "Incident",
    "up.kolBaslangic": "Début",
    "up.kolSure": "Durée",
    "up.kolSlaEtki": "Impact SLA",
    "up.kolEtki": "Impact",
    "up.kolDurum": "Statut",
    "up.butceDisi": "hors budget",
    "up.dk": "min",
    "up.butce": "budget",
    "up.olayBos": "Aucun incident enregistré ces 90 derniers jours — les systèmes ont fonctionné sans interruption.",
    "up.olayAra": "Rechercher des incidents…",

    "up.bolgeBaslik": "Disponibilité régionale",
    "up.bolgeRozet": "régions",

    "up.durum.operasyonel": "Opérationnel",
    "up.durum.dejenere": "Performance dégradée",
    "up.durum.kesinti": "Panne",

    "up.etki.tam": "Panne totale",
    "up.etki.kismi": "Panne partielle",
    "up.etki.bakim": "Maintenance planifiée",

    "up.olayDurum.cozuldu": "Résolu",
    "up.olayDurum.izleniyor": "Surveillance",
    "up.olayDurum.arastiriliyor": "En cours d'analyse",

    "up.grup.API": "API",
    "up.grup.Dağıtım": "Diffusion",
    "up.grup.Uygulama": "Application",

    "up.svc.challenge-api.ad": "Challenge API",
    "up.svc.challenge-api.ac": "Génération de challenges ghost-font et tramage temporel",
    "up.svc.verify-api.ad": "Verify API",
    "up.svc.verify-api.ac": "Vérification de jetons et contrôle de la résolution des challenges",
    "up.svc.siteverify-api.ad": "Siteverify API",
    "up.svc.siteverify-api.ac": "Vérification côté serveur du point de terminaison /siteverify",
    "up.svc.passive-api.ad": "Passive API",
    "up.svc.passive-api.ac": "Collecte passive de signaux et de comportements en mode invisible",
    "up.svc.widget-cdn.ad": "Widget CDN",
    "up.svc.widget-cdn.ac": "Diffusion du widget specter.js (edge mondial)",
    "up.svc.dashboard.ad": "Dashboard",
    "up.svc.dashboard.ac": "Panneau d'administration et application d'interface",
    "up.svc.webhook-teslimat.ad": "Livraison des webhooks",
    "up.svc.webhook-teslimat.ac": "Livraison sortante des notifications d'événements (file de nouvelles tentatives)",
    "up.svc.edge-agi.ad": "Réseau Edge",
    "up.svc.edge-agi.ac": "Couche edge anycast (16 PoP, 6 régions)",

    "up.bolge.Avrupa": "Europe",
    "up.bolge.Kuzey Amerika": "Amérique du Nord",
    "up.bolge.Asya-Pasifik": "Asie-Pacifique",
    "up.bolge.Güney Amerika": "Amérique du Sud",
    "up.bolge.Okyanusya": "Océanie",
    "up.bolge.Afrika / Orta Doğu": "Afrique / Moyen-Orient",

    "up.inc.inc-2026-0712.baslik": "Latence accrue dans le traitement des signaux passifs",
    "up.inc.inc-2026-0712.not":
      "Une accumulation dans la file de biométrie comportementale a temporairement doublé le p95. La file a été mise à l'échelle ; la cause racine est en cours d'analyse.",
    "up.inc.inc-2026-0703.baslik": "Retard de la file de nouvelles tentatives des webhooks",
    "up.inc.inc-2026-0703.not":
      "Des délais d'attente sur des points de terminaison tiers ont saturé la file de nouvelles tentatives. Le seuil du disjoncteur a été abaissé et les livraisons sont revenues à la normale.",
    "up.inc.inc-2026-0621.baslik": "Maintenance d'infrastructure planifiée",
    "up.inc.inc-2026-0621.not":
      "Mise à niveau de version de la base de données du panneau. Le mode lecture seule était actif ; aucune panne, les écritures ont été différées de 25 min.",
    "up.inc.inc-2026-0609.baslik": "Échec de résolution régional (UE-ouest)",
    "up.inc.inc-2026-0609.not":
      "Un échec de résolution DNS dans une seule région edge a affecté ~6 % des requêtes. Le trafic a basculé vers une région voisine.",
    "up.inc.inc-2026-0524.baslik": "Brève panne totale",
    "up.inc.inc-2026-0524.not":
      "Un déploiement mal configuré a interrompu la génération de challenges pendant 6 min. Un rollback automatique a été déclenché ; la barrière de déploiement a été renforcée.",
    "up.inc.inc-2026-0508.baslik": "Taux d'erreur élevé (5xx)",
    "up.inc.inc-2026-0508.not":
      "La défaillance d'un nœud de cache a renvoyé des 5xx sur une partie des requêtes de vérification. Le nœud a été remplacé et le cache réchauffé.",
  },

  es: {
    "up.baslik": "Monitorización de disponibilidad y SLA",
    "up.kirinti": "Disponibilidad y SLA",
    "up.metaTitle": "Monitorización de disponibilidad y SLA — Veylify",
    "up.aciklama":
      "Cumplimiento del SLA, presupuesto de error, percentiles de latencia, disponibilidad e historial de incidentes de los servicios de la plataforma Veylify. Consola SRE de solo lectura — visible para todo el equipo.",
    "up.temsiliNot":
      "Estado de plataforma representativo: el catálogo de servicios, las barras de disponibilidad y el historial de incidentes de esta página NO provienen de sondeo en vivo — son valores representativos deterministas. La monitorización en tiempo real se conectará pronto.",
    "up.servisRozet": "servicios",
    "up.hepsiCalisiyor": "Todos los sistemas operativos",
    "up.kismiBozulma": "Degradación parcial",

    "up.genelUptime": "Disponibilidad general (90 días, SLA)",
    "up.operasyonelServis": "Servicios operativos",
    "up.dejenereDelta": "degradado",
    "up.ortYanit": "Tiempo de respuesta medio",
    "up.son90Olay": "Incidentes en los últimos 90 días",

    "up.slaBaslik": "Resumen de cumplimiento del SLA y presupuesto de error",
    "up.slaKarsilandi": "SLA cumplido",
    "up.slaRiskte": "Presupuesto en riesgo",
    "up.slaIhlal": "SLA incumplido",
    "up.gerceklesenUptime": "Disponibilidad real (30 d)",
    "up.hedef": "objetivo",
    "up.hedefUstunde": "por encima del objetivo",
    "up.hedefAltinda": "por debajo del objetivo",
    "up.taahhut": "compromiso",
    "up.aylikHataButcesi": "Presupuesto de error mensual",
    "up.kaldiYuzde": "restante",
    "up.dkKaldi": "min restantes",
    "up.tuketildi": "consumido",
    "up.slaKademeleri": "Niveles de SLA (nueves)",
    "up.aktifHedef": "objetivo activo",
    "up.dkAy": "min/mes",
    "up.saYil": "h/año",
    "up.butceAciklamaBas": "El presupuesto de error",
    "up.butceAciklama":
      " es la cuota de inactividad mensual permitida por el objetivo de SLA de {hedef} ({izinli} min/mes). La disponibilidad real se deriva de la duración de los incidentes; las caídas parciales se ponderan por su cuota de impacto, y el mantenimiento planificado (modo solo lectura) no cuenta contra el presupuesto. Asumir riesgos es libre hasta agotar el presupuesto — una vez agotado, los cambios se congelan (política de presupuesto de error).",

    "up.matrisBaslik": "Matriz de estado de servicios — historial de 90 días",
    "up.guncel": "actual",
    "up.gunOnce90": "hace 90 días",
    "up.bugun": "hoy",
    "up.uptimeSonKontrol": "disponibilidad · última comprobación",

    "up.lejantCalisiyor": "Operativo",
    "up.lejantDejenere": "Degradado",
    "up.lejantKesinti": "Caída",
    "up.gunUp": "Operativo",
    "up.gunDegraded": "Rendimiento degradado",
    "up.gunDown": "Caída",

    "up.snOnce": "s atrás",
    "up.dkOnce": "min atrás",
    "up.saOnce": "h atrás",

    "up.yuzdelikBaslik": "Percentiles de latencia (p50 / p95 / p99)",
    "up.gercekOrnek": "muestras reales",
    "up.temsiliDagilim": "distribución representativa",
    "up.medyanYanit": "respuesta mediana",
    "up.kuyruk95": "cola (95 %)",
    "up.enKotu1": "peor 1 %",
    "up.ort": "media",
    "up.min": "mín",
    "up.max": "máx",
    "up.ornek": "muestras",
    "up.yanitDagilimi": "Distribución del tiempo de respuesta",

    "up.trendBaslik": "Tendencia del tiempo de respuesta (p50 / p95 / p99)",
    "up.son24s": "Últimas 24 h",
    "up.son7g": "Últimos 7 d",
    "up.trendGuncel": "Actual",
    "up.trendP99Son": "p99 (último)",

    "up.yakmaBaslik": "Tendencia de consumo del presupuesto de error (burn-down)",
    "up.yakmaAciklama":
      "Cuota restante del presupuesto de error en los últimos 30 días. Llegar al 0 % indica que el objetivo mensual del SLA ({kademe}) se ha agotado.",

    "up.olayBaslik": "Historial de incidentes (cronología)",
    "up.son90Kayit": "últimos 90 días",
    "up.kayit": "registros",
    "up.kolServis": "Servicio",
    "up.kolOlay": "Incidente",
    "up.kolBaslangic": "Inicio",
    "up.kolSure": "Duración",
    "up.kolSlaEtki": "Impacto en SLA",
    "up.kolEtki": "Impacto",
    "up.kolDurum": "Estado",
    "up.butceDisi": "fuera de presupuesto",
    "up.dk": "min",
    "up.butce": "presupuesto",
    "up.olayBos": "No hay incidentes registrados en los últimos 90 días — los sistemas funcionaron sin interrupción.",
    "up.olayAra": "Buscar incidentes…",

    "up.bolgeBaslik": "Disponibilidad regional",
    "up.bolgeRozet": "regiones",

    "up.durum.operasyonel": "Operativo",
    "up.durum.dejenere": "Rendimiento degradado",
    "up.durum.kesinti": "Caída",

    "up.etki.tam": "Caída total",
    "up.etki.kismi": "Caída parcial",
    "up.etki.bakim": "Mantenimiento planificado",

    "up.olayDurum.cozuldu": "Resuelto",
    "up.olayDurum.izleniyor": "En seguimiento",
    "up.olayDurum.arastiriliyor": "En investigación",

    "up.grup.API": "API",
    "up.grup.Dağıtım": "Distribución",
    "up.grup.Uygulama": "Aplicación",

    "up.svc.challenge-api.ad": "Challenge API",
    "up.svc.challenge-api.ac": "Generación de challenges ghost-font y tramado temporal",
    "up.svc.verify-api.ad": "Verify API",
    "up.svc.verify-api.ac": "Verificación de tokens y comprobación de la resolución de challenges",
    "up.svc.siteverify-api.ad": "Siteverify API",
    "up.svc.siteverify-api.ac": "Verificación del endpoint /siteverify del lado del servidor",
    "up.svc.passive-api.ad": "Passive API",
    "up.svc.passive-api.ac": "Recopilación pasiva de señales y comportamiento en modo invisible",
    "up.svc.widget-cdn.ad": "Widget CDN",
    "up.svc.widget-cdn.ac": "Distribución del widget specter.js (edge global)",
    "up.svc.dashboard.ad": "Dashboard",
    "up.svc.dashboard.ac": "Panel de administración y aplicación de interfaz",
    "up.svc.webhook-teslimat.ad": "Entrega de webhooks",
    "up.svc.webhook-teslimat.ac": "Entrega saliente de notificaciones de eventos (cola de reintentos)",
    "up.svc.edge-agi.ad": "Red Edge",
    "up.svc.edge-agi.ac": "Capa edge anycast (16 PoP, 6 regiones)",

    "up.bolge.Avrupa": "Europa",
    "up.bolge.Kuzey Amerika": "Norteamérica",
    "up.bolge.Asya-Pasifik": "Asia-Pacífico",
    "up.bolge.Güney Amerika": "Sudamérica",
    "up.bolge.Okyanusya": "Oceanía",
    "up.bolge.Afrika / Orta Doğu": "África / Oriente Medio",

    "up.inc.inc-2026-0712.baslik": "Mayor latencia en el procesamiento de señales pasivas",
    "up.inc.inc-2026-0712.not":
      "Una acumulación en la cola de biometría de comportamiento duplicó temporalmente el p95. La cola se escaló; la causa raíz está en investigación.",
    "up.inc.inc-2026-0703.baslik": "Retraso en la cola de reintentos de webhooks",
    "up.inc.inc-2026-0703.not":
      "Los tiempos de espera en endpoints de terceros llenaron la cola de reintentos. Se redujo el umbral del cortacircuitos y las entregas volvieron a la normalidad.",
    "up.inc.inc-2026-0621.baslik": "Mantenimiento de infraestructura planificado",
    "up.inc.inc-2026-0621.not":
      "Actualización de versión de la base de datos del panel. El modo solo lectura estaba activo; no hubo caída, las escrituras se aplazaron 25 min.",
    "up.inc.inc-2026-0609.baslik": "Fallo de resolución regional (UE-oeste)",
    "up.inc.inc-2026-0609.not":
      "Un fallo de resolución DNS en una sola región edge afectó al ~6 % de las solicitudes. El tráfico se derivó a una región vecina.",
    "up.inc.inc-2026-0524.baslik": "Breve caída total",
    "up.inc.inc-2026-0524.not":
      "Un despliegue mal configurado detuvo la generación de challenges durante 6 min. Se activó una reversión automática; se reforzó la puerta de despliegue.",
    "up.inc.inc-2026-0508.baslik": "Tasa de error elevada (5xx)",
    "up.inc.inc-2026-0508.not":
      "El fallo de un nodo de caché devolvió 5xx en una parte de las solicitudes de verificación. Se reemplazó el nodo y se recalentó la caché.",
  },
};

export function uptimeCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr[anahtar] ?? anahtar;
}
