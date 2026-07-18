/**
 * Platform Yönetici Konsolu — YEREL sayfa sözlüğü.
 * ================================================
 * Bu dosya YALNIZCA /panel/admin istemci bileşeninin kullanıcıya görünen KROM/ETİKET
 * metinlerini 5 dile taşır (tr/en/de/fr/es). Paylaşılan `@/lib/i18n/panel`
 * sözlüğüne DOKUNMAZ; sadece `Dil` tipini ondan alır. Başlık/breadcrumb için
 * paylaşılan `nav.admin` anahtarı sayfada kullanılır (burada tekrarlanmaz).
 *
 * ÖNEMLİ (güvenlik & veri):
 *  - Hesap adları, e-postalar, ID'ler, site adları, kampanya adları VERİ'dir — çevrilmez.
 *  - Sayılar/oranlar/₺ tutarları yerele-duyarlı Intl ile biçimlenir.
 *  - Plan enum'ları (free/pro/scale) ve kampanya durum enum'ları (active/mitigated/
 *    monitoring) asla çevrilmez; TR etiket-eşlemesi burada anahtar-eşlemesine dönüştürülür.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // Personel uyarı bandı
    "band.baslik": "Platform Operasyon Konsolu — tüm dağıtımın kuş bakışı görünümü.",
    "band.aciklama":
      "Tüm hesaplar, siteler, küresel trafik sağlığı, sistem-geneli tehdit duruşu ve gelir metrikleri tek yerde. Bu iç operasyon yüzeyi <b>yalnızca Veylify personeline</b> açıktır; production'da rol-kapılıdır (staff-only).",

    // Özet kartları
    "kpi.hesap": "Toplam hesap",
    "kpi.site": "Toplam site",
    "kpi.trafik": "Trafik (30g)",
    "kpi.engellenen": "Engellenen (30g)",
    "kpi.mrr": "MRR tahmini",
    "kpi.saglik": "Sistem sağlık skoru",

    // Trend & sağlık panelleri
    "trend.baslik": "Küresel trafik & engelleme (30 gün)",
    "trend.seri.istek": "Toplam istek",
    "trend.seri.engellenen": "Engellenen",
    "trend.not":
      "Platform-geneli günlük doğrulama hacmi ve engellenen istekler. Ölçek notu: mevcut zirve hacim tek bir edge bölgesiyle karşılanır; sürekli {n}/gün üzeri ortalamada oto-ölçekleme eşiği devreye girer.",
    "saglik.baslik": "Sistem sağlığı",
    "saglik.dogrulanmisSite": "Doğrulanmış site oranı",
    "saglik.insanTrafigi": "İnsan trafiği oranı",
    "saglik.aktifHesap": "Aktif hesap oranı",

    // Plan / MRR / coğrafya
    "plan.baslik": "Plan dağılımı",
    "mrr.baslik": "MRR kırılımı (tahmini)",
    "mrr.hesapCarpim": "{n} hesap × {tl}",
    "mrr.toplam": "Toplam MRR",
    "mrr.not":
      "Scale planı özel sözleşmelidir; MRR için temsili {tl}/ay değeri kullanılır. Gerçek yıllık sözleşmeler farklılık gösterir.",
    "cografya.baslik": "En çok saldırı alan coğrafyalar",

    // Küresel tehdit duruşu
    "tehdit.baslik": "Küresel tehdit duruşu",
    "tehdit.botOran": "Bot oranı",
    "tehdit.botOranAlt": "Challenge + engellenen / toplam trafik",
    "tehdit.toplamEngellenen": "Toplam engellenen",
    "tehdit.toplamEngellenenAlt": "Son 30 günde platform-geneli",
    "tehdit.aktifKampanya": "Aktif kampanya",
    "tehdit.aktifKampanyaAlt": "Devam eden saldırı kampanyası",
    "tehdit.acikKritik": "Açık kritik uyarı",
    "tehdit.acikKritikAlt": "Tüm hesaplarda (açık/inceleniyor)",

    // En büyük kampanyalar tablosu
    "kamp.baslik": "En büyük kampanyalar",
    "kamp.kol.kampanya": "Kampanya",
    "kamp.kol.site": "Site",
    "kamp.kol.durum": "Durum",
    "kamp.kol.toplamIstek": "Toplam istek",
    "kamp.kol.engellenen": "Engellenen",
    "kamp.kol.zirveRps": "Zirve RPS",
    "kamp.kol.cografya": "Coğrafya",
    "kamp.bos": "Kampanya kaydı yok.",
    // Kampanya durum enum → etiket
    "kamp.durum.active": "Aktif",
    "kamp.durum.mitigated": "Azaltıldı",
    "kamp.durum.monitoring": "İzleniyor",

    // Hesap tablosu
    "hesap.baslik": "Hesaplar",
    "hesap.filtre.hepsi": "Hepsi",
    "hesap.kol.hesap": "Hesap",
    "hesap.kol.plan": "Plan",
    "hesap.kol.site": "Site",
    "hesap.kol.trafik": "Trafik (30g)",
    "hesap.kol.engellenen": "Engellenen",
    "hesap.kol.ekip": "Ekip",
    "hesap.kol.anahtar": "Anahtar",
    "hesap.kol.durum": "Durum",
    "hesap.kol.sonGorulme": "Son görülme",
    "hesap.durum.aktif": "Aktif",
    "hesap.durum.bosta": "Boşta",
    "hesap.arama": "{n} hesap gösteriliyor. Tablo salt-okunurdur — bu konsolda yıkıcı işlem yoktur.",
    "hesap.araPlaceholder": "Hesap adı, e-posta veya plan…",
    // Plan enum → etiket
    "plan.free": "Ücretsiz",
    "plan.pro": "Pro",
    "plan.scale": "Scale",

    // Özellik bayrakları
    "bayrak.baslik": "Özellik bayrakları",
    "bayrak.rozet": "Temsili · localStorage",
    "bayrak.aktif": "Aktif",
    "bayrak.acildi": "{ad} açıldı · kaydedildi",
    "bayrak.kapandi": "{ad} kapatıldı · kaydedildi",
    "bayrak.not":
      "Demo amaçlı istemci-tarafı bayraklar (tarayıcıda saklanır). Production'da bunlar merkezi bir bayrak servisiyle kademeli yayına alınır ve denetime kaydedilir.",
    "bayrak.yeniKayit.ad": "Yeni kayıt açık",
    "bayrak.yeniKayit.aciklama": "Platforma yeni hesap kaydını etkinleştirir.",
    "bayrak.bakimModu.ad": "Bakım modu",
    "bayrak.bakimModu.aciklama": "Panel salt-okunur olur; yazma işlemleri askıya alınır.",
    "bayrak.aiDogrulama.ad": "AI Doğrulama (beta)",
    "bayrak.aiDogrulama.aciklama": "AI ajan kriptografik doğrulamasını tüm hesaplara açar.",
    "bayrak.edgeOtoscale.ad": "Edge oto-ölçekleme",
    "bayrak.edgeOtoscale.aciklama": "Yük artışında edge worker havuzunu otomatik büyütür.",
    "bayrak.yeniOnboarding.ad": "Yeni onboarding akışı",
    "bayrak.yeniOnboarding.aciklama": "Yenilenen kurulum sihirbazını kademeli olarak yayına alır.",

    // Kuyruk & worker
    "worker.baslik": "Kuyruk & worker sağlığı",
    "worker.not": "Worker/kuyruk metrikleri temsilidir (canlı telemetri yerine).",
    "worker.edge.ad": "Edge doğrulama worker'ları",
    "worker.edge.alt": "42/43 sağlıklı · p99 12ms",
    "worker.ingest.ad": "Olay ingest kuyruğu",
    "worker.ingest.alt": "gecikme 340ms · biriken 1,2 B",
    "worker.webhook.ad": "Webhook teslim kuyruğu",
    "worker.webhook.alt": "yeniden-deneme 3,1% · biriken 84",
    "worker.rapor.ad": "Rapor üretim işleri",
    "worker.rapor.alt": "sırada iş yok · boşta",

    // Veritabanı & kayıt sayıları
    "db.baslik": "Veritabanı & kayıt sayıları",
    "db.kullanici": "Kullanıcı",
    "db.site": "Site",
    "db.kural": "Kural",
    "db.anahtar": "API anahtarı",
    "db.ekip": "Ekip üyesi",
    "db.kampanya": "Kampanya",
    "db.not":
      "Depolama: JSON DB (v20 şeması) · gerçek toplamlar repo katmanından okundu. Postgres'e geçiş için erişim tek noktadan (repository) yapılır.",

    // Kapasite & büyüme
    "kapasite.baslik": "Kapasite & büyüme",
    "kapasite.gunlukOrt": "Günlük ort. trafik",
    "kapasite.dogrulanmamis": "Doğrulanmamış site",
    "kapasite.toplamKullanici": "Toplam kullanıcı (owner + ekip)",
    "kapasite.aktifKural": "Aktif kural (tüm hesaplar)",
    "kapasite.not":
      "Ölçekleme notu: mevcut hacimler tek bölgeyle rahatça karşılanıyor. Hesap sayısı ve günlük trafik ortalaması büyüdükçe edge worker havuzu ve olay-ingest kuyruğu yatay ölçeklenir; kritik eşik olay-ingest gecikmesinin 500ms'yi sürekli aşmasıdır.",

    // Rol-kapı notu
    "rolkapi.not":
      "Bu <b>Platform Yönetici Konsolu</b> yalnızca <b>Veylify iç personeli (staff)</b> için tasarlanmıştır. Production'da erişim rol-kapılıdır ve her görüntüleme denetime kaydedilir. Demo ortamında oturum-açmış kullanıcıya gösterilir ve hiçbir yıkıcı işlem (hesap silme, plan değişikliği vb.) içermez — salt-okunur operasyon görünümüdür.",

    // Kısa sayı birimleri + göreli zaman
    "sayi.bin": "B",
    "sayi.milyon": "Mn",
    "zaman.azOnce": "az önce",
    "zaman.dk": "{n} dk önce",
    "zaman.sa": "{n} sa önce",
    "zaman.gun": "{n} gün önce",

    // Sistem durumu göstergeleri (gauge şeridi)
    "durum.baslik": "Sistem durumu",
    "durum.saglik": "Sağlık",
    "durum.insan": "İnsan trafiği",
    "durum.dogrulanmis": "Doğrulanmış site",
    "durum.aktifHesap": "Aktif hesap",
    "durum.not": "Dört ana operasyonel gösterge tek bakışta. Yeşil = sağlıklı eşik.",

    // Bayrak dağılımı (donut)
    "bayrakDagilim.baslik": "Bayrak durumu",
    "bayrakDagilim.acik": "Açık",
    "bayrakDagilim.kapali": "Kapalı",
    "bayrakDagilim.merkez": "bayrak",

    // Kaynak kullanım ısı-matrisi
    "kaynak.baslik": "Bölgesel kaynak kullanımı",
    "kaynak.aciklama": "Edge bölgelerinde alt-sistemlerin yük yüzdesi (temsili) — koyu = daha yüklü.",
    "kaynak.cpu": "CPU",
    "kaynak.bellek": "Bellek",
    "kaynak.ag": "Ağ G/Ç",
    "kaynak.kuyruk": "Kuyruk",
  },

  en: {
    "band.baslik": "Platform Operations Console — a bird's-eye view of the entire deployment.",
    "band.aciklama":
      "All accounts, sites, global traffic health, system-wide threat posture and revenue metrics in one place. This internal operations surface is open <b>only to Veylify staff</b>; in production it is role-gated (staff-only).",

    "kpi.hesap": "Total accounts",
    "kpi.site": "Total sites",
    "kpi.trafik": "Traffic (30d)",
    "kpi.engellenen": "Blocked (30d)",
    "kpi.mrr": "MRR estimate",
    "kpi.saglik": "System health score",

    "trend.baslik": "Global traffic & blocking (30 days)",
    "trend.seri.istek": "Total requests",
    "trend.seri.engellenen": "Blocked",
    "trend.not":
      "Platform-wide daily verification volume and blocked requests. Scale note: current peak volume is served by a single edge region; sustained averages above {n}/day trip the auto-scaling threshold.",
    "saglik.baslik": "System health",
    "saglik.dogrulanmisSite": "Verified site ratio",
    "saglik.insanTrafigi": "Human traffic ratio",
    "saglik.aktifHesap": "Active account ratio",

    "plan.baslik": "Plan distribution",
    "mrr.baslik": "MRR breakdown (estimated)",
    "mrr.hesapCarpim": "{n} accounts × {tl}",
    "mrr.toplam": "Total MRR",
    "mrr.not":
      "The Scale plan is custom-contracted; a representative {tl}/mo value is used for MRR. Real annual contracts vary.",
    "cografya.baslik": "Most attacked regions",

    "tehdit.baslik": "Global threat posture",
    "tehdit.botOran": "Bot ratio",
    "tehdit.botOranAlt": "Challenged + blocked / total traffic",
    "tehdit.toplamEngellenen": "Total blocked",
    "tehdit.toplamEngellenenAlt": "Platform-wide over the last 30 days",
    "tehdit.aktifKampanya": "Active campaigns",
    "tehdit.aktifKampanyaAlt": "Ongoing attack campaigns",
    "tehdit.acikKritik": "Open critical alerts",
    "tehdit.acikKritikAlt": "Across all accounts (open/investigating)",

    "kamp.baslik": "Largest campaigns",
    "kamp.kol.kampanya": "Campaign",
    "kamp.kol.site": "Site",
    "kamp.kol.durum": "Status",
    "kamp.kol.toplamIstek": "Total requests",
    "kamp.kol.engellenen": "Blocked",
    "kamp.kol.zirveRps": "Peak RPS",
    "kamp.kol.cografya": "Geography",
    "kamp.bos": "No campaign records.",
    "kamp.durum.active": "Active",
    "kamp.durum.mitigated": "Mitigated",
    "kamp.durum.monitoring": "Monitoring",

    "hesap.baslik": "Accounts",
    "hesap.filtre.hepsi": "All",
    "hesap.kol.hesap": "Account",
    "hesap.kol.plan": "Plan",
    "hesap.kol.site": "Sites",
    "hesap.kol.trafik": "Traffic (30d)",
    "hesap.kol.engellenen": "Blocked",
    "hesap.kol.ekip": "Team",
    "hesap.kol.anahtar": "Keys",
    "hesap.kol.durum": "Status",
    "hesap.kol.sonGorulme": "Last seen",
    "hesap.durum.aktif": "Active",
    "hesap.durum.bosta": "Idle",
    "hesap.arama": "Showing {n} accounts. The table is read-only — this console performs no destructive actions.",
    "hesap.araPlaceholder": "Account name, email or plan…",
    "plan.free": "Free",
    "plan.pro": "Pro",
    "plan.scale": "Scale",

    "bayrak.baslik": "Feature flags",
    "bayrak.rozet": "Representative · localStorage",
    "bayrak.aktif": "Active",
    "bayrak.acildi": "{ad} enabled · saved",
    "bayrak.kapandi": "{ad} disabled · saved",
    "bayrak.not":
      "Demo client-side flags (stored in the browser). In production these roll out gradually via a central flag service and are recorded to the audit log.",
    "bayrak.yeniKayit.ad": "Sign-ups open",
    "bayrak.yeniKayit.aciklama": "Enables new account registration on the platform.",
    "bayrak.bakimModu.ad": "Maintenance mode",
    "bayrak.bakimModu.aciklama": "The panel becomes read-only; write operations are suspended.",
    "bayrak.aiDogrulama.ad": "AI Verification (beta)",
    "bayrak.aiDogrulama.aciklama": "Enables cryptographic AI-agent verification for all accounts.",
    "bayrak.edgeOtoscale.ad": "Edge auto-scaling",
    "bayrak.edgeOtoscale.aciklama": "Automatically grows the edge worker pool under load spikes.",
    "bayrak.yeniOnboarding.ad": "New onboarding flow",
    "bayrak.yeniOnboarding.aciklama": "Rolls out the redesigned setup wizard gradually.",

    "worker.baslik": "Queue & worker health",
    "worker.not": "Worker/queue metrics are representative (in place of live telemetry).",
    "worker.edge.ad": "Edge verification workers",
    "worker.edge.alt": "42/43 healthy · p99 12ms",
    "worker.ingest.ad": "Event ingest queue",
    "worker.ingest.alt": "lag 340ms · backlog 1.2K",
    "worker.webhook.ad": "Webhook delivery queue",
    "worker.webhook.alt": "retry 3.1% · backlog 84",
    "worker.rapor.ad": "Report generation jobs",
    "worker.rapor.alt": "no queued jobs · idle",

    "db.baslik": "Database & record counts",
    "db.kullanici": "Users",
    "db.site": "Sites",
    "db.kural": "Rules",
    "db.anahtar": "API keys",
    "db.ekip": "Team members",
    "db.kampanya": "Campaigns",
    "db.not":
      "Storage: JSON DB (v20 schema) · real totals read from the repository layer. Migration to Postgres goes through a single access point (repository).",

    "kapasite.baslik": "Capacity & growth",
    "kapasite.gunlukOrt": "Avg. daily traffic",
    "kapasite.dogrulanmamis": "Unverified sites",
    "kapasite.toplamKullanici": "Total users (owner + team)",
    "kapasite.aktifKural": "Active rules (all accounts)",
    "kapasite.not":
      "Scaling note: current volumes are comfortably served by a single region. As account count and daily traffic average grow, the edge worker pool and event-ingest queue scale horizontally; the critical threshold is event-ingest lag consistently exceeding 500ms.",

    "rolkapi.not":
      "This <b>Platform Admin Console</b> is designed <b>only for Veylify internal staff</b>. In production, access is role-gated and every view is written to the audit log. In the demo environment it is shown to the logged-in user and contains no destructive actions (account deletion, plan changes, etc.) — it is a read-only operations view.",

    "sayi.bin": "K",
    "sayi.milyon": "M",
    "zaman.azOnce": "just now",
    "zaman.dk": "{n} min ago",
    "zaman.sa": "{n} h ago",
    "zaman.gun": "{n} d ago",

    "durum.baslik": "System status",
    "durum.saglik": "Health",
    "durum.insan": "Human traffic",
    "durum.dogrulanmis": "Verified sites",
    "durum.aktifHesap": "Active accounts",
    "durum.not": "Four key operational gauges at a glance. Green = healthy threshold.",

    "bayrakDagilim.baslik": "Flag status",
    "bayrakDagilim.acik": "On",
    "bayrakDagilim.kapali": "Off",
    "bayrakDagilim.merkez": "flags",

    "kaynak.baslik": "Regional resource usage",
    "kaynak.aciklama": "Subsystem load percentage across edge regions (representative) — darker = busier.",
    "kaynak.cpu": "CPU",
    "kaynak.bellek": "Memory",
    "kaynak.ag": "Net I/O",
    "kaynak.kuyruk": "Queue",
  },

  de: {
    "band.baslik": "Plattform-Betriebskonsole — Vogelperspektive auf das gesamte Deployment.",
    "band.aciklama":
      "Alle Konten, Sites, globale Traffic-Gesundheit, systemweite Bedrohungslage und Umsatzkennzahlen an einem Ort. Diese interne Betriebsoberfläche ist <b>nur Veylify-Mitarbeitenden</b> zugänglich; in der Produktion ist sie rollenbasiert geschützt (nur Staff).",

    "kpi.hesap": "Konten gesamt",
    "kpi.site": "Sites gesamt",
    "kpi.trafik": "Traffic (30 T)",
    "kpi.engellenen": "Blockiert (30 T)",
    "kpi.mrr": "MRR-Schätzung",
    "kpi.saglik": "System-Gesundheitswert",

    "trend.baslik": "Globaler Traffic & Blockierung (30 Tage)",
    "trend.seri.istek": "Anfragen gesamt",
    "trend.seri.engellenen": "Blockiert",
    "trend.not":
      "Plattformweites tägliches Verifizierungsvolumen und blockierte Anfragen. Skalierungshinweis: Das aktuelle Spitzenvolumen wird von einer einzelnen Edge-Region bedient; anhaltende Durchschnitte über {n}/Tag lösen die Auto-Scaling-Schwelle aus.",
    "saglik.baslik": "Systemgesundheit",
    "saglik.dogrulanmisSite": "Anteil verifizierter Sites",
    "saglik.insanTrafigi": "Anteil menschlicher Traffic",
    "saglik.aktifHesap": "Anteil aktiver Konten",

    "plan.baslik": "Tarifverteilung",
    "mrr.baslik": "MRR-Aufschlüsselung (geschätzt)",
    "mrr.hesapCarpim": "{n} Konten × {tl}",
    "mrr.toplam": "MRR gesamt",
    "mrr.not":
      "Der Scale-Tarif wird individuell vertraglich vereinbart; für den MRR wird ein repräsentativer Wert von {tl}/Mon. verwendet. Reale Jahresverträge weichen ab.",
    "cografya.baslik": "Am stärksten angegriffene Regionen",

    "tehdit.baslik": "Globale Bedrohungslage",
    "tehdit.botOran": "Bot-Anteil",
    "tehdit.botOranAlt": "Challenge + blockiert / Gesamt-Traffic",
    "tehdit.toplamEngellenen": "Blockiert gesamt",
    "tehdit.toplamEngellenenAlt": "Plattformweit in den letzten 30 Tagen",
    "tehdit.aktifKampanya": "Aktive Kampagnen",
    "tehdit.aktifKampanyaAlt": "Laufende Angriffskampagnen",
    "tehdit.acikKritik": "Offene kritische Warnungen",
    "tehdit.acikKritikAlt": "Über alle Konten (offen/in Prüfung)",

    "kamp.baslik": "Größte Kampagnen",
    "kamp.kol.kampanya": "Kampagne",
    "kamp.kol.site": "Site",
    "kamp.kol.durum": "Status",
    "kamp.kol.toplamIstek": "Anfragen gesamt",
    "kamp.kol.engellenen": "Blockiert",
    "kamp.kol.zirveRps": "Spitzen-RPS",
    "kamp.kol.cografya": "Geografie",
    "kamp.bos": "Keine Kampagnendaten.",
    "kamp.durum.active": "Aktiv",
    "kamp.durum.mitigated": "Entschärft",
    "kamp.durum.monitoring": "Beobachtung",

    "hesap.baslik": "Konten",
    "hesap.filtre.hepsi": "Alle",
    "hesap.kol.hesap": "Konto",
    "hesap.kol.plan": "Tarif",
    "hesap.kol.site": "Sites",
    "hesap.kol.trafik": "Traffic (30 T)",
    "hesap.kol.engellenen": "Blockiert",
    "hesap.kol.ekip": "Team",
    "hesap.kol.anahtar": "Schlüssel",
    "hesap.kol.durum": "Status",
    "hesap.kol.sonGorulme": "Zuletzt gesehen",
    "hesap.durum.aktif": "Aktiv",
    "hesap.durum.bosta": "Inaktiv",
    "hesap.arama": "{n} Konten werden angezeigt. Die Tabelle ist schreibgeschützt — diese Konsole führt keine destruktiven Aktionen aus.",
    "hesap.araPlaceholder": "Kontoname, E-Mail oder Tarif…",
    "plan.free": "Kostenlos",
    "plan.pro": "Pro",
    "plan.scale": "Scale",

    "bayrak.baslik": "Feature-Flags",
    "bayrak.rozet": "Repräsentativ · localStorage",
    "bayrak.aktif": "Aktiv",
    "bayrak.acildi": "{ad} aktiviert · gespeichert",
    "bayrak.kapandi": "{ad} deaktiviert · gespeichert",
    "bayrak.not":
      "Demo-Flags auf Client-Seite (im Browser gespeichert). In der Produktion werden diese schrittweise über einen zentralen Flag-Service ausgerollt und im Audit-Log erfasst.",
    "bayrak.yeniKayit.ad": "Registrierung offen",
    "bayrak.yeniKayit.aciklama": "Aktiviert die Registrierung neuer Konten auf der Plattform.",
    "bayrak.bakimModu.ad": "Wartungsmodus",
    "bayrak.bakimModu.aciklama": "Das Panel wird schreibgeschützt; Schreibvorgänge werden ausgesetzt.",
    "bayrak.aiDogrulama.ad": "KI-Verifizierung (Beta)",
    "bayrak.aiDogrulama.aciklama": "Aktiviert die kryptografische KI-Agent-Verifizierung für alle Konten.",
    "bayrak.edgeOtoscale.ad": "Edge-Auto-Scaling",
    "bayrak.edgeOtoscale.aciklama": "Vergrößert den Edge-Worker-Pool bei Lastspitzen automatisch.",
    "bayrak.yeniOnboarding.ad": "Neuer Onboarding-Ablauf",
    "bayrak.yeniOnboarding.aciklama": "Rollt den überarbeiteten Einrichtungsassistenten schrittweise aus.",

    "worker.baslik": "Queue- & Worker-Gesundheit",
    "worker.not": "Worker-/Queue-Metriken sind repräsentativ (anstelle von Live-Telemetrie).",
    "worker.edge.ad": "Edge-Verifizierungs-Worker",
    "worker.edge.alt": "42/43 gesund · p99 12ms",
    "worker.ingest.ad": "Event-Ingest-Queue",
    "worker.ingest.alt": "Latenz 340ms · Rückstau 1,2 Tsd.",
    "worker.webhook.ad": "Webhook-Zustell-Queue",
    "worker.webhook.alt": "Wiederholung 3,1% · Rückstau 84",
    "worker.rapor.ad": "Berichtserstellungs-Jobs",
    "worker.rapor.alt": "keine Jobs in der Queue · inaktiv",

    "db.baslik": "Datenbank & Datensatzanzahl",
    "db.kullanici": "Benutzer",
    "db.site": "Sites",
    "db.kural": "Regeln",
    "db.anahtar": "API-Schlüssel",
    "db.ekip": "Teammitglieder",
    "db.kampanya": "Kampagnen",
    "db.not":
      "Speicher: JSON-DB (Schema v20) · reale Summen aus der Repository-Schicht gelesen. Die Migration zu Postgres erfolgt über einen einzigen Zugriffspunkt (Repository).",

    "kapasite.baslik": "Kapazität & Wachstum",
    "kapasite.gunlukOrt": "Ø täglicher Traffic",
    "kapasite.dogrulanmamis": "Nicht verifizierte Sites",
    "kapasite.toplamKullanici": "Benutzer gesamt (Owner + Team)",
    "kapasite.aktifKural": "Aktive Regeln (alle Konten)",
    "kapasite.not":
      "Skalierungshinweis: Aktuelle Volumina werden bequem von einer einzelnen Region bedient. Mit wachsender Kontozahl und steigendem täglichen Traffic-Durchschnitt skalieren der Edge-Worker-Pool und die Event-Ingest-Queue horizontal; die kritische Schwelle ist eine Event-Ingest-Latenz, die dauerhaft 500ms überschreitet.",

    "rolkapi.not":
      "Diese <b>Plattform-Admin-Konsole</b> ist <b>ausschließlich für internes Veylify-Personal (Staff)</b> konzipiert. In der Produktion ist der Zugriff rollenbasiert geschützt und jede Ansicht wird im Audit-Log erfasst. In der Demo-Umgebung wird sie dem angemeldeten Benutzer angezeigt und enthält keine destruktiven Aktionen (Kontolöschung, Tarifänderung usw.) — es ist eine schreibgeschützte Betriebsansicht.",

    "sayi.bin": "Tsd.",
    "sayi.milyon": "Mio.",
    "zaman.azOnce": "gerade eben",
    "zaman.dk": "vor {n} Min.",
    "zaman.sa": "vor {n} Std.",
    "zaman.gun": "vor {n} T.",

    "durum.baslik": "Systemstatus",
    "durum.saglik": "Gesundheit",
    "durum.insan": "Menschl. Traffic",
    "durum.dogrulanmis": "Verifizierte Sites",
    "durum.aktifHesap": "Aktive Konten",
    "durum.not": "Vier zentrale Betriebsanzeigen auf einen Blick. Grün = gesunde Schwelle.",

    "bayrakDagilim.baslik": "Flag-Status",
    "bayrakDagilim.acik": "An",
    "bayrakDagilim.kapali": "Aus",
    "bayrakDagilim.merkez": "Flags",

    "kaynak.baslik": "Regionale Ressourcennutzung",
    "kaynak.aciklama": "Auslastung der Subsysteme über Edge-Regionen (repräsentativ) — dunkler = ausgelasteter.",
    "kaynak.cpu": "CPU",
    "kaynak.bellek": "Speicher",
    "kaynak.ag": "Netz-E/A",
    "kaynak.kuyruk": "Queue",
  },

  fr: {
    "band.baslik": "Console d'exploitation de la plateforme — vue d'ensemble de tout le déploiement.",
    "band.aciklama":
      "Tous les comptes, sites, la santé du trafic mondial, la posture de menace à l'échelle du système et les métriques de revenus au même endroit. Cette surface d'exploitation interne est accessible <b>uniquement au personnel Veylify</b> ; en production, elle est protégée par rôle (staff uniquement).",

    "kpi.hesap": "Total des comptes",
    "kpi.site": "Total des sites",
    "kpi.trafik": "Trafic (30 j)",
    "kpi.engellenen": "Bloqués (30 j)",
    "kpi.mrr": "Estimation MRR",
    "kpi.saglik": "Score de santé système",

    "trend.baslik": "Trafic mondial & blocage (30 jours)",
    "trend.seri.istek": "Total des requêtes",
    "trend.seri.engellenen": "Bloqués",
    "trend.not":
      "Volume quotidien de vérification à l'échelle de la plateforme et requêtes bloquées. Note d'échelle : le volume de pointe actuel est servi par une seule région edge ; des moyennes soutenues au-dessus de {n}/jour déclenchent le seuil d'auto-scaling.",
    "saglik.baslik": "Santé du système",
    "saglik.dogrulanmisSite": "Taux de sites vérifiés",
    "saglik.insanTrafigi": "Taux de trafic humain",
    "saglik.aktifHesap": "Taux de comptes actifs",

    "plan.baslik": "Répartition des forfaits",
    "mrr.baslik": "Détail du MRR (estimé)",
    "mrr.hesapCarpim": "{n} comptes × {tl}",
    "mrr.toplam": "MRR total",
    "mrr.not":
      "Le forfait Scale fait l'objet d'un contrat sur mesure ; une valeur représentative de {tl}/mois est utilisée pour le MRR. Les contrats annuels réels varient.",
    "cografya.baslik": "Régions les plus attaquées",

    "tehdit.baslik": "Posture de menace mondiale",
    "tehdit.botOran": "Taux de bots",
    "tehdit.botOranAlt": "Challenge + bloqués / trafic total",
    "tehdit.toplamEngellenen": "Total bloqués",
    "tehdit.toplamEngellenenAlt": "À l'échelle de la plateforme sur les 30 derniers jours",
    "tehdit.aktifKampanya": "Campagnes actives",
    "tehdit.aktifKampanyaAlt": "Campagnes d'attaque en cours",
    "tehdit.acikKritik": "Alertes critiques ouvertes",
    "tehdit.acikKritikAlt": "Sur tous les comptes (ouvertes/en cours d'examen)",

    "kamp.baslik": "Plus grandes campagnes",
    "kamp.kol.kampanya": "Campagne",
    "kamp.kol.site": "Site",
    "kamp.kol.durum": "Statut",
    "kamp.kol.toplamIstek": "Total des requêtes",
    "kamp.kol.engellenen": "Bloqués",
    "kamp.kol.zirveRps": "RPS de pointe",
    "kamp.kol.cografya": "Géographie",
    "kamp.bos": "Aucun enregistrement de campagne.",
    "kamp.durum.active": "Active",
    "kamp.durum.mitigated": "Atténuée",
    "kamp.durum.monitoring": "Sous surveillance",

    "hesap.baslik": "Comptes",
    "hesap.filtre.hepsi": "Tous",
    "hesap.kol.hesap": "Compte",
    "hesap.kol.plan": "Forfait",
    "hesap.kol.site": "Sites",
    "hesap.kol.trafik": "Trafic (30 j)",
    "hesap.kol.engellenen": "Bloqués",
    "hesap.kol.ekip": "Équipe",
    "hesap.kol.anahtar": "Clés",
    "hesap.kol.durum": "Statut",
    "hesap.kol.sonGorulme": "Vu pour la dernière fois",
    "hesap.durum.aktif": "Actif",
    "hesap.durum.bosta": "Inactif",
    "hesap.arama": "Affichage de {n} comptes. Le tableau est en lecture seule — cette console n'effectue aucune action destructive.",
    "hesap.araPlaceholder": "Nom de compte, e-mail ou forfait…",
    "plan.free": "Gratuit",
    "plan.pro": "Pro",
    "plan.scale": "Scale",

    "bayrak.baslik": "Indicateurs de fonctionnalité",
    "bayrak.rozet": "Représentatif · localStorage",
    "bayrak.aktif": "Actif",
    "bayrak.acildi": "{ad} activé · enregistré",
    "bayrak.kapandi": "{ad} désactivé · enregistré",
    "bayrak.not":
      "Indicateurs de démo côté client (stockés dans le navigateur). En production, ils sont déployés progressivement via un service central d'indicateurs et consignés dans le journal d'audit.",
    "bayrak.yeniKayit.ad": "Inscriptions ouvertes",
    "bayrak.yeniKayit.aciklama": "Active l'enregistrement de nouveaux comptes sur la plateforme.",
    "bayrak.bakimModu.ad": "Mode maintenance",
    "bayrak.bakimModu.aciklama": "Le panneau devient en lecture seule ; les opérations d'écriture sont suspendues.",
    "bayrak.aiDogrulama.ad": "Vérification IA (bêta)",
    "bayrak.aiDogrulama.aciklama": "Active la vérification cryptographique des agents IA pour tous les comptes.",
    "bayrak.edgeOtoscale.ad": "Auto-scaling edge",
    "bayrak.edgeOtoscale.aciklama": "Agrandit automatiquement le pool de workers edge lors des pics de charge.",
    "bayrak.yeniOnboarding.ad": "Nouveau flux d'intégration",
    "bayrak.yeniOnboarding.aciklama": "Déploie progressivement l'assistant de configuration repensé.",

    "worker.baslik": "Santé des files & workers",
    "worker.not": "Les métriques workers/files sont représentatives (à la place de la télémétrie en direct).",
    "worker.edge.ad": "Workers de vérification edge",
    "worker.edge.alt": "42/43 sains · p99 12ms",
    "worker.ingest.ad": "File d'ingestion d'événements",
    "worker.ingest.alt": "latence 340ms · en attente 1,2 K",
    "worker.webhook.ad": "File de livraison de webhooks",
    "worker.webhook.alt": "reprise 3,1% · en attente 84",
    "worker.rapor.ad": "Tâches de génération de rapports",
    "worker.rapor.alt": "aucune tâche en file · inactif",

    "db.baslik": "Base de données & nombre d'enregistrements",
    "db.kullanici": "Utilisateurs",
    "db.site": "Sites",
    "db.kural": "Règles",
    "db.anahtar": "Clés API",
    "db.ekip": "Membres de l'équipe",
    "db.kampanya": "Campagnes",
    "db.not":
      "Stockage : DB JSON (schéma v20) · totaux réels lus depuis la couche repository. La migration vers Postgres passe par un point d'accès unique (repository).",

    "kapasite.baslik": "Capacité & croissance",
    "kapasite.gunlukOrt": "Trafic quotidien moyen",
    "kapasite.dogrulanmamis": "Sites non vérifiés",
    "kapasite.toplamKullanici": "Total des utilisateurs (owner + équipe)",
    "kapasite.aktifKural": "Règles actives (tous les comptes)",
    "kapasite.not":
      "Note de mise à l'échelle : les volumes actuels sont servis confortablement par une seule région. À mesure que le nombre de comptes et la moyenne de trafic quotidien augmentent, le pool de workers edge et la file d'ingestion d'événements évoluent horizontalement ; le seuil critique est une latence d'ingestion d'événements dépassant durablement 500ms.",

    "rolkapi.not":
      "Cette <b>console d'administration de la plateforme</b> est conçue <b>uniquement pour le personnel interne de Veylify (staff)</b>. En production, l'accès est protégé par rôle et chaque consultation est consignée dans le journal d'audit. Dans l'environnement de démo, elle est présentée à l'utilisateur connecté et ne contient aucune action destructive (suppression de compte, changement de forfait, etc.) — c'est une vue d'exploitation en lecture seule.",

    "sayi.bin": "k",
    "sayi.milyon": "M",
    "zaman.azOnce": "à l'instant",
    "zaman.dk": "il y a {n} min",
    "zaman.sa": "il y a {n} h",
    "zaman.gun": "il y a {n} j",

    "durum.baslik": "État du système",
    "durum.saglik": "Santé",
    "durum.insan": "Trafic humain",
    "durum.dogrulanmis": "Sites vérifiés",
    "durum.aktifHesap": "Comptes actifs",
    "durum.not": "Quatre jauges opérationnelles clés en un coup d'œil. Vert = seuil sain.",

    "bayrakDagilim.baslik": "État des indicateurs",
    "bayrakDagilim.acik": "Activé",
    "bayrakDagilim.kapali": "Désactivé",
    "bayrakDagilim.merkez": "indic.",

    "kaynak.baslik": "Utilisation régionale des ressources",
    "kaynak.aciklama": "Pourcentage de charge des sous-systèmes par région edge (représentatif) — plus foncé = plus chargé.",
    "kaynak.cpu": "CPU",
    "kaynak.bellek": "Mémoire",
    "kaynak.ag": "E/S réseau",
    "kaynak.kuyruk": "File",
  },

  es: {
    "band.baslik": "Consola de operaciones de la plataforma — una vista de pájaro de todo el despliegue.",
    "band.aciklama":
      "Todas las cuentas, sitios, la salud del tráfico global, la postura de amenazas a nivel de sistema y las métricas de ingresos en un solo lugar. Esta superficie de operaciones interna está abierta <b>solo al personal de Veylify</b>; en producción tiene control por rol (solo staff).",

    "kpi.hesap": "Cuentas totales",
    "kpi.site": "Sitios totales",
    "kpi.trafik": "Tráfico (30 d)",
    "kpi.engellenen": "Bloqueados (30 d)",
    "kpi.mrr": "Estimación de MRR",
    "kpi.saglik": "Puntuación de salud del sistema",

    "trend.baslik": "Tráfico global & bloqueo (30 días)",
    "trend.seri.istek": "Solicitudes totales",
    "trend.seri.engellenen": "Bloqueados",
    "trend.not":
      "Volumen diario de verificación a nivel de plataforma y solicitudes bloqueadas. Nota de escala: el volumen pico actual se atiende desde una única región edge; los promedios sostenidos por encima de {n}/día activan el umbral de auto-escalado.",
    "saglik.baslik": "Salud del sistema",
    "saglik.dogrulanmisSite": "Proporción de sitios verificados",
    "saglik.insanTrafigi": "Proporción de tráfico humano",
    "saglik.aktifHesap": "Proporción de cuentas activas",

    "plan.baslik": "Distribución de planes",
    "mrr.baslik": "Desglose de MRR (estimado)",
    "mrr.hesapCarpim": "{n} cuentas × {tl}",
    "mrr.toplam": "MRR total",
    "mrr.not":
      "El plan Scale es de contrato personalizado; para el MRR se usa un valor representativo de {tl}/mes. Los contratos anuales reales varían.",
    "cografya.baslik": "Regiones más atacadas",

    "tehdit.baslik": "Postura de amenaza global",
    "tehdit.botOran": "Proporción de bots",
    "tehdit.botOranAlt": "Challenge + bloqueados / tráfico total",
    "tehdit.toplamEngellenen": "Total bloqueados",
    "tehdit.toplamEngellenenAlt": "A nivel de plataforma en los últimos 30 días",
    "tehdit.aktifKampanya": "Campañas activas",
    "tehdit.aktifKampanyaAlt": "Campañas de ataque en curso",
    "tehdit.acikKritik": "Alertas críticas abiertas",
    "tehdit.acikKritikAlt": "En todas las cuentas (abiertas/en revisión)",

    "kamp.baslik": "Campañas más grandes",
    "kamp.kol.kampanya": "Campaña",
    "kamp.kol.site": "Sitio",
    "kamp.kol.durum": "Estado",
    "kamp.kol.toplamIstek": "Solicitudes totales",
    "kamp.kol.engellenen": "Bloqueados",
    "kamp.kol.zirveRps": "RPS pico",
    "kamp.kol.cografya": "Geografía",
    "kamp.bos": "Sin registros de campaña.",
    "kamp.durum.active": "Activa",
    "kamp.durum.mitigated": "Mitigada",
    "kamp.durum.monitoring": "En monitoreo",

    "hesap.baslik": "Cuentas",
    "hesap.filtre.hepsi": "Todas",
    "hesap.kol.hesap": "Cuenta",
    "hesap.kol.plan": "Plan",
    "hesap.kol.site": "Sitios",
    "hesap.kol.trafik": "Tráfico (30 d)",
    "hesap.kol.engellenen": "Bloqueados",
    "hesap.kol.ekip": "Equipo",
    "hesap.kol.anahtar": "Claves",
    "hesap.kol.durum": "Estado",
    "hesap.kol.sonGorulme": "Visto por última vez",
    "hesap.durum.aktif": "Activa",
    "hesap.durum.bosta": "Inactiva",
    "hesap.arama": "Mostrando {n} cuentas. La tabla es de solo lectura — esta consola no realiza acciones destructivas.",
    "hesap.araPlaceholder": "Nombre de cuenta, correo o plan…",
    "plan.free": "Gratis",
    "plan.pro": "Pro",
    "plan.scale": "Scale",

    "bayrak.baslik": "Indicadores de funciones",
    "bayrak.rozet": "Representativo · localStorage",
    "bayrak.aktif": "Activo",
    "bayrak.acildi": "{ad} activado · guardado",
    "bayrak.kapandi": "{ad} desactivado · guardado",
    "bayrak.not":
      "Indicadores de demo del lado del cliente (almacenados en el navegador). En producción se despliegan gradualmente mediante un servicio central de indicadores y quedan registrados en el log de auditoría.",
    "bayrak.yeniKayit.ad": "Registros abiertos",
    "bayrak.yeniKayit.aciklama": "Habilita el registro de nuevas cuentas en la plataforma.",
    "bayrak.bakimModu.ad": "Modo mantenimiento",
    "bayrak.bakimModu.aciklama": "El panel pasa a solo lectura; las operaciones de escritura se suspenden.",
    "bayrak.aiDogrulama.ad": "Verificación IA (beta)",
    "bayrak.aiDogrulama.aciklama": "Habilita la verificación criptográfica de agentes IA para todas las cuentas.",
    "bayrak.edgeOtoscale.ad": "Auto-escalado edge",
    "bayrak.edgeOtoscale.aciklama": "Amplía automáticamente el pool de workers edge ante picos de carga.",
    "bayrak.yeniOnboarding.ad": "Nuevo flujo de incorporación",
    "bayrak.yeniOnboarding.aciklama": "Despliega gradualmente el asistente de configuración rediseñado.",

    "worker.baslik": "Salud de colas & workers",
    "worker.not": "Las métricas de workers/colas son representativas (en lugar de telemetría en vivo).",
    "worker.edge.ad": "Workers de verificación edge",
    "worker.edge.alt": "42/43 sanos · p99 12ms",
    "worker.ingest.ad": "Cola de ingesta de eventos",
    "worker.ingest.alt": "latencia 340ms · pendiente 1,2 K",
    "worker.webhook.ad": "Cola de entrega de webhooks",
    "worker.webhook.alt": "reintento 3,1% · pendiente 84",
    "worker.rapor.ad": "Trabajos de generación de informes",
    "worker.rapor.alt": "sin trabajos en cola · inactivo",

    "db.baslik": "Base de datos & recuento de registros",
    "db.kullanici": "Usuarios",
    "db.site": "Sitios",
    "db.kural": "Reglas",
    "db.anahtar": "Claves API",
    "db.ekip": "Miembros del equipo",
    "db.kampanya": "Campañas",
    "db.not":
      "Almacenamiento: DB JSON (esquema v20) · totales reales leídos desde la capa de repositorio. La migración a Postgres pasa por un único punto de acceso (repository).",

    "kapasite.baslik": "Capacidad & crecimiento",
    "kapasite.gunlukOrt": "Tráfico diario prom.",
    "kapasite.dogrulanmamis": "Sitios sin verificar",
    "kapasite.toplamKullanici": "Usuarios totales (owner + equipo)",
    "kapasite.aktifKural": "Reglas activas (todas las cuentas)",
    "kapasite.not":
      "Nota de escalado: los volúmenes actuales se atienden cómodamente desde una única región. A medida que crecen el número de cuentas y el promedio de tráfico diario, el pool de workers edge y la cola de ingesta de eventos escalan horizontalmente; el umbral crítico es una latencia de ingesta de eventos que supere de forma sostenida los 500ms.",

    "rolkapi.not":
      "Esta <b>Consola de administración de la plataforma</b> está diseñada <b>solo para el personal interno de Veylify (staff)</b>. En producción, el acceso tiene control por rol y cada visualización se registra en el log de auditoría. En el entorno de demo se muestra al usuario conectado y no contiene acciones destructivas (eliminación de cuenta, cambio de plan, etc.) — es una vista de operaciones de solo lectura.",

    "sayi.bin": "K",
    "sayi.milyon": "M",
    "zaman.azOnce": "justo ahora",
    "zaman.dk": "hace {n} min",
    "zaman.sa": "hace {n} h",
    "zaman.gun": "hace {n} d",

    "durum.baslik": "Estado del sistema",
    "durum.saglik": "Salud",
    "durum.insan": "Tráfico humano",
    "durum.dogrulanmis": "Sitios verificados",
    "durum.aktifHesap": "Cuentas activas",
    "durum.not": "Cuatro indicadores operativos clave de un vistazo. Verde = umbral saludable.",

    "bayrakDagilim.baslik": "Estado de indicadores",
    "bayrakDagilim.acik": "Activo",
    "bayrakDagilim.kapali": "Inactivo",
    "bayrakDagilim.merkez": "indic.",

    "kaynak.baslik": "Uso regional de recursos",
    "kaynak.aciklama": "Porcentaje de carga de subsistemas por región edge (representativo) — más oscuro = más ocupado.",
    "kaynak.cpu": "CPU",
    "kaynak.bellek": "Memoria",
    "kaynak.ag": "E/S de red",
    "kaynak.kuyruk": "Cola",
  },
};

/** Yerel çeviri erişimcisi — anahtar bulunmazsa TR'ye, o da yoksa anahtara düşer. */
export function adminCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
