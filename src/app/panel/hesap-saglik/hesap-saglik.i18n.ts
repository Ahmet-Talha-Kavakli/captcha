/**
 * Hesap Sağlığı & Kullanım Olgunluğu paneli — YEREL sayfa sözlüğü.
 * ================================================================
 * Bu dosya YALNIZCA /panel/hesap-saglik istemci bileşeninin kullanıcıya görünen
 * KROM/ETİKET metinlerini 5 dile taşır (tr/en/de/fr/es). Paylaşılan
 * `@/lib/i18n/panel` sözlüğüne DOKUNMAZ; sadece `Dil` tipini ondan alır.
 *
 * ÖNEMLİ (güvenlik & veri):
 *  - Skorlar, ağırlık %'leri, sayılar, tarihler VERİ'dir — çevrilmez, Intl ile
 *    yerele-duyarlı biçimlenir.
 *  - Boyut ANAHTARI (SaglikBoyut.anahtar), durum (SaglikDurum), churn seviyesi
 *    (ChurnSeviye) ve olgunluk seviyesi (SaglikSeviyeAd) ENUM'dur — değeri asla
 *    çevrilmez. İlgili İNSAN-OKUR ad/rozet/açıklama lib'de TR üretilir; istemcide
 *    bu anahtarlardan + ham sinyallerden YENİDEN türetilir (lib düzenlenmeden).
 *  - Boyut adları, öneriler, ayrıntı ölçütleri, churn neden/aksiyonları lib'den
 *    TR gelir; hepsi ham girdi sinyalleriyle istemcide yeniden kurulur.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // Başlık
    "hs.baslik": "Hesap Sağlığı",

    // Açıklama şeridi
    "hs.serit.baslik": "{ws} hesabının koruma kurulumu ne kadar sağlıklı ve benimsenmiş?",
    "hs.serit.aciklama":
      "Bu, hesabının <b>öz-değerlendirmesidir</b> (müşteri başarısı bakışı): kurulum tamlığı, aktif kullanım, yapılandırma derinliği, ekip yönetişimi ve operasyonel sağlık ağırlıklı olarak puanlanır; bırakma (churn) riski sinyalleri çıkarılır.",

    // Üst özet rozetleri
    "hs.rozet.olgunluk": "{ad} olgunluk",
    "hs.plan": "{ad} planı",

    // Olgunluk seviyeleri (SaglikSeviyeAd enum → ad)
    "hs.seviye.mükemmel": "Mükemmel",
    "hs.seviye.iyi": "İyi",
    "hs.seviye.gelişmeli": "Gelişmeli",
    "hs.seviye.riskli": "Riskli",

    // Churn seviyeleri (ChurnSeviye enum → ad)
    "hs.churn.dusuk": "Düşük churn riski",
    "hs.churn.orta": "Orta churn riski",
    "hs.churn.yuksek": "Yüksek churn riski",

    // Boyut durum rozetleri (SaglikDurum enum → ad)
    "hs.durum.iyi": "İyi",
    "hs.durum.orta": "Orta",
    "hs.durum.zayif": "Zayıf",

    // Boyut adları (SaglikBoyut.anahtar enum → ad)
    "hs.boyut.kurulum": "Kurulum Tamlığı",
    "hs.boyut.kullanim": "Aktif Kullanım",
    "hs.boyut.yapilandirma": "Yapılandırma Derinliği",
    "hs.boyut.yonetisim": "Ekip & Yönetişim",
    "hs.boyut.operasyon": "Operasyonel Sağlık",

    // Boyut kartı / ağırlık
    "hs.agirlik": "Ağırlık %{n}",
    "hs.katki": "Genel skora katkı ağırlığı %{n}",

    // Churn paneli
    "hs.churn.baslik": "Churn (bırakma) riski",
    "hs.churn.riskPuani": "/ 100 risk puanı",
    "hs.churn.yuksesltenler": "Riski yükselten sinyaller",
    "hs.churn.neYapmali": "Ne yapmalı",

    // Boyut kırılımı paneli
    "hs.kirilim.baslik": "Boyut kırılımı",
    "hs.kirilim.git": "Git",

    // Trend + sonraki adımlar
    "hs.trend.baslik": "Kullanım sağlığı trendi",
    "hs.trend.aciklama": "Son 30 günlük günlük doğrulama hacmi — benimsenmenin ve etkileşimin canlılığı.",
    "hs.trend.aylik": "Aylık kullanım",
    "hs.trend.aktifGun": "Aktif gün (30g)",
    "hs.trend.kota": "Kota kullanımı",
    "hs.adimlar.baslik": "Sonraki adımlar",
    "hs.adimlar.hepsiIyi": "Tüm boyutlar sağlıklı",
    "hs.adimlar.hepsiIyiAlt": "Öncelikli bir iyileştirme adımı yok. Mevcut kurulumu sürdür.",

    // Dürüstlük notu
    "hs.not":
      "Bu skor Veylify içindeki gerçek hesap verisinden (siteler, kurallar, kullanım, ekip, olaylar) deterministik olarak hesaplanır. Bir <b>öz-değerlendirme</b>dir ve hesabının olgunluğunu izlemeni sağlar; harici bir derecelendirme değildir.",

    // --- Boyut ayrıntı ölçütleri (ham sinyallerden yeniden kurulur) ---
    "hs.ay.siteYok": "Henüz site eklenmemiş",
    "hs.ay.siteDogrulandi": "{a}/{b} site doğrulandı",
    "hs.ay.siteTrafik": "{a}/{b} site canlı trafik alıyor",
    "hs.ay.kuralTanimli": "{n} kural tanımlı",
    "hs.ay.kuralYok": "Kural tanımlanmamış",
    "hs.ay.kotaKullanildi": "Kotanın %{n}'i kullanıldı",
    "hs.ay.aktifGun": "Son 30 günde {n} aktif gün",
    "hs.ay.bugunAktif": "Bugün aktif",
    "hs.ay.sonAktiflik": "Son aktiflik {n} gün önce",
    "hs.ay.ozelKural": "{n} özel kural",
    "hs.ay.aiPolitika": "{n} AI ajan politikası",
    "hs.ay.entVar": "{n} aktif entegrasyon",
    "hs.ay.entYok": "Entegrasyon bağlı değil",
    "hs.ay.ekipUye": "{n} ekip üyesi",
    "hs.ay.tokenVar": "{n} aktif API anahtarı",
    "hs.ay.tokenYok": "API anahtarı yok",
    "hs.ay.denetim": "{n} denetim kaydı",
    "hs.ay.acikKritik": "{n} açık kritik olay",
    "hs.ay.acikKritikYok": "Açık kritik olay yok",
    "hs.ay.cozuldu": "{a}/{b} olay çözüldü",
    "hs.ay.cozulmeOran": "Çözülme oranı %{n}",

    // --- Boyut önerileri (branch anahtarıyla yeniden kurulur) ---
    "hs.on.kurulum.siteYok": "İlk siteni ekleyip doğrula — koruma ancak doğrulamadan sonra devreye girer.",
    "hs.on.kurulum.dogrulama": "Doğrulanmamış sitelerin sahiplik doğrulamasını tamamla.",
    "hs.on.kurulum.trafik": "Koruma kod parçacığını (widget) trafik almayan sitelere yerleştir.",
    "hs.on.kurulum.kural": "En az bir koruma kuralı tanımla.",
    "hs.on.kurulum.tamam": "Kurulum tamam — tüm siteler doğrulanmış ve entegre.",
    "hs.on.kullanim.sifir": "Hesap hiç doğrulama üretmiyor — entegrasyonu canlıya al ve trafik akıt.",
    "hs.on.kullanim.kota": "Kotaya dayandın — planı yükselt ki koruma engellenmeye başlamasın.",
    "hs.on.kullanim.dusuk": "Kullanım çok düşük — korumayı daha fazla trafiğe/uç noktaya yay.",
    "hs.on.kullanim.hareketsiz": "Bir haftadır trafik yok — entegrasyonun hâlâ canlı olduğunu doğrula.",
    "hs.on.kullanim.saglikli": "Kullanım sağlıklı bantta — düzenli ve dengeli.",
    "hs.on.yapi.kural": "Kendi trafiğine özel koruma kuralları ekle — hazır varsayılanlar yetmez.",
    "hs.on.yapi.ai": "AI ajanları için politika belirle (izin ver / doğrula / engelle).",
    "hs.on.yapi.ent": "Slack/Discord/Webhook entegrasyonu bağla — olaylardan haberdar ol.",
    "hs.on.yapi.derin": "Yapılandırma derin — kurallar, AI politikaları ve entegrasyonlar hazır.",
    "hs.on.yon.ekip": "En az bir ekip üyesi davet et — tek-kişi hesaplar operasyonel risk taşır.",
    "hs.on.yon.token": "Programatik erişim için bir API anahtarı oluştur.",
    "hs.on.yon.denetim": "Yönetişim etkinliği düşük — düzenli gözden geçirme ve değişiklik izini artır.",
    "hs.on.yon.saglam": "Ekip ve yönetişim sağlam — üyeler, anahtarlar ve denetim izi mevcut.",
    "hs.on.op.kritik": "{n} açık kritik olayı incele ve çöz — koruma etkinliğini riske atıyor.",
    "hs.on.op.cozulme": "Bekleyen olayların çözülme oranı düşük — olay kuyruğunu temizle.",
    "hs.on.op.saglikli": "Operasyon sağlıklı — açık kritik olay yok, olaylar çözülüyor.",

    // --- Churn nedenleri ---
    "hs.cn.benimsemeCokDusuk": "Genel benimsenme çok düşük — hesap ürünü neredeyse hiç kullanmıyor.",
    "hs.cn.benimsemeSinirli": "Benimsenme sınırlı — kurulumun bazı temel adımları eksik.",
    "hs.cn.kotaDayali": "Kotaya dayanmış — plan yetersiz kalıyor, koruma engellenebilir.",
    "hs.cn.kullanimSifir": "Kullanım neredeyse sıfır — ürün değeri henüz hissedilmemiş.",
    "hs.cn.uykuda": "{n} gündür hiç trafik yok — hesap uykuda.",
    "hs.cn.dusukEtkinlik": "{n} gündür düşük etkinlik.",
    "hs.cn.acikKritik": "{n} açık kritik olay çözülmeyi bekliyor.",
    "hs.cn.tekKisi": "Tek-kişi hesap — ekip benimsemesi yok, bırakma kolay.",
    "hs.cn.yok": "Belirgin churn sinyali yok — hesap sağlıklı ve benimsenmiş.",

    // --- Churn aksiyonları ---
    "hs.ak.onboarding": "Onboarding'i tamamla: site doğrula, widget yerleştir, ilk kuralı ekle.",
    "hs.ak.eksikKurulum": "Eksik kurulum ve yapılandırma adımlarını tamamla.",
    "hs.ak.planKota": "Planı yükselt veya kota politikasını gözden geçir.",
    "hs.ak.trafikYay": "Korumayı gerçek trafik alan uç noktalara yay.",
    "hs.ak.entegreDogrula": "Entegrasyonun canlı olduğunu doğrula; kesinti varsa gider.",
    "hs.ak.widgetKontrol": "Trafik akışını ve widget kurulumunu kontrol et.",
    "hs.ak.kritikKapat": "Açık kritik olayları önceliklendir ve kapat.",
    "hs.ak.ekipDavet": "Ekip üyesi davet ederek kurumsal bağımlılığı artır.",
    "hs.ak.surdur": "Mevcut sağlıklı kullanımı sürdür; düzenli gözden geçirme yeterli.",
  },

  en: {
    "hs.baslik": "Account Health",

    "hs.serit.baslik": "How healthy and adopted is {ws}'s protection setup?",
    "hs.serit.aciklama":
      "This is your account's <b>self-assessment</b> (a customer-success view): setup completeness, active usage, configuration depth, team governance and operational health are scored by weight; churn-risk signals are surfaced.",

    "hs.rozet.olgunluk": "{ad} maturity",
    "hs.plan": "{ad} plan",

    "hs.seviye.mükemmel": "Excellent",
    "hs.seviye.iyi": "Good",
    "hs.seviye.gelişmeli": "Developing",
    "hs.seviye.riskli": "At risk",

    "hs.churn.dusuk": "Low churn risk",
    "hs.churn.orta": "Medium churn risk",
    "hs.churn.yuksek": "High churn risk",

    "hs.durum.iyi": "Good",
    "hs.durum.orta": "Fair",
    "hs.durum.zayif": "Weak",

    "hs.boyut.kurulum": "Setup Completeness",
    "hs.boyut.kullanim": "Active Usage",
    "hs.boyut.yapilandirma": "Configuration Depth",
    "hs.boyut.yonetisim": "Team & Governance",
    "hs.boyut.operasyon": "Operational Health",

    "hs.agirlik": "Weight {n}%",
    "hs.katki": "Contribution weight to overall score {n}%",

    "hs.churn.baslik": "Churn risk",
    "hs.churn.riskPuani": "/ 100 risk score",
    "hs.churn.yuksesltenler": "Risk-raising signals",
    "hs.churn.neYapmali": "What to do",

    "hs.kirilim.baslik": "Dimension breakdown",
    "hs.kirilim.git": "Go",

    "hs.trend.baslik": "Usage-health trend",
    "hs.trend.aciklama": "Daily verification volume over the last 30 days — the vitality of adoption and engagement.",
    "hs.trend.aylik": "Monthly usage",
    "hs.trend.aktifGun": "Active days (30d)",
    "hs.trend.kota": "Quota usage",
    "hs.adimlar.baslik": "Next steps",
    "hs.adimlar.hepsiIyi": "All dimensions healthy",
    "hs.adimlar.hepsiIyiAlt": "No priority improvement step. Maintain the current setup.",

    "hs.not":
      "This score is computed deterministically from your real account data in Veylify (sites, rules, usage, team, events). It is a <b>self-assessment</b> that lets you track your account's maturity; it is not an external rating.",

    "hs.ay.siteYok": "No sites added yet",
    "hs.ay.siteDogrulandi": "{a}/{b} sites verified",
    "hs.ay.siteTrafik": "{a}/{b} sites receiving live traffic",
    "hs.ay.kuralTanimli": "{n} rules defined",
    "hs.ay.kuralYok": "No rules defined",
    "hs.ay.kotaKullanildi": "{n}% of quota used",
    "hs.ay.aktifGun": "{n} active days in the last 30",
    "hs.ay.bugunAktif": "Active today",
    "hs.ay.sonAktiflik": "Last active {n} days ago",
    "hs.ay.ozelKural": "{n} custom rules",
    "hs.ay.aiPolitika": "{n} AI-agent policies",
    "hs.ay.entVar": "{n} active integrations",
    "hs.ay.entYok": "No integration connected",
    "hs.ay.ekipUye": "{n} team members",
    "hs.ay.tokenVar": "{n} active API keys",
    "hs.ay.tokenYok": "No API keys",
    "hs.ay.denetim": "{n} audit records",
    "hs.ay.acikKritik": "{n} open critical events",
    "hs.ay.acikKritikYok": "No open critical events",
    "hs.ay.cozuldu": "{a}/{b} events resolved",
    "hs.ay.cozulmeOran": "Resolution rate {n}%",

    "hs.on.kurulum.siteYok": "Add and verify your first site — protection only kicks in after verification.",
    "hs.on.kurulum.dogrulama": "Complete ownership verification for unverified sites.",
    "hs.on.kurulum.trafik": "Place the protection snippet (widget) on sites not yet receiving traffic.",
    "hs.on.kurulum.kural": "Define at least one protection rule.",
    "hs.on.kurulum.tamam": "Setup complete — all sites verified and integrated.",
    "hs.on.kullanim.sifir": "The account produces no verifications — take the integration live and drive traffic.",
    "hs.on.kullanim.kota": "You're hitting the quota — upgrade the plan so protection doesn't start getting blocked.",
    "hs.on.kullanim.dusuk": "Usage is very low — extend protection to more traffic/endpoints.",
    "hs.on.kullanim.hareketsiz": "No traffic for a week — verify that your integration is still live.",
    "hs.on.kullanim.saglikli": "Usage is in the healthy band — steady and balanced.",
    "hs.on.yapi.kural": "Add protection rules specific to your own traffic — the presets aren't enough.",
    "hs.on.yapi.ai": "Set a policy for AI agents (allow / verify / block).",
    "hs.on.yapi.ent": "Connect a Slack/Discord/Webhook integration — stay informed of events.",
    "hs.on.yapi.derin": "Configuration is deep — rules, AI policies and integrations are ready.",
    "hs.on.yon.ekip": "Invite at least one team member — single-person accounts carry operational risk.",
    "hs.on.yon.token": "Create an API key for programmatic access.",
    "hs.on.yon.denetim": "Governance activity is low — increase regular reviews and change trails.",
    "hs.on.yon.saglam": "Team and governance are solid — members, keys and an audit trail are in place.",
    "hs.on.op.kritik": "Review and resolve {n} open critical events — they're putting protection effectiveness at risk.",
    "hs.on.op.cozulme": "The resolution rate of pending events is low — clear the event queue.",
    "hs.on.op.saglikli": "Operations are healthy — no open critical events, events are being resolved.",

    "hs.cn.benimsemeCokDusuk": "Overall adoption is very low — the account barely uses the product.",
    "hs.cn.benimsemeSinirli": "Adoption is limited — some core setup steps are missing.",
    "hs.cn.kotaDayali": "Hitting the quota — the plan is falling short, protection may get blocked.",
    "hs.cn.kullanimSifir": "Usage is near zero — product value not yet felt.",
    "hs.cn.uykuda": "No traffic for {n} days — the account is dormant.",
    "hs.cn.dusukEtkinlik": "Low activity for {n} days.",
    "hs.cn.acikKritik": "{n} open critical events awaiting resolution.",
    "hs.cn.tekKisi": "Single-person account — no team adoption, easy to churn.",
    "hs.cn.yok": "No clear churn signal — the account is healthy and adopted.",

    "hs.ak.onboarding": "Complete onboarding: verify a site, place the widget, add the first rule.",
    "hs.ak.eksikKurulum": "Complete the missing setup and configuration steps.",
    "hs.ak.planKota": "Upgrade the plan or review the quota policy.",
    "hs.ak.trafikYay": "Extend protection to endpoints receiving real traffic.",
    "hs.ak.entegreDogrula": "Verify the integration is live; fix any outage.",
    "hs.ak.widgetKontrol": "Check the traffic flow and widget installation.",
    "hs.ak.kritikKapat": "Prioritize and close the open critical events.",
    "hs.ak.ekipDavet": "Increase organizational stickiness by inviting a team member.",
    "hs.ak.surdur": "Maintain the current healthy usage; a regular review is enough.",
  },

  de: {
    "hs.baslik": "Kontozustand",

    "hs.serit.baslik": "Wie gesund und etabliert ist das Schutz-Setup von {ws}?",
    "hs.serit.aciklama":
      "Dies ist die <b>Selbstbewertung</b> Ihres Kontos (Customer-Success-Sicht): Setup-Vollständigkeit, aktive Nutzung, Konfigurationstiefe, Team-Governance und operative Gesundheit werden gewichtet bewertet; Churn-Risikosignale werden herausgestellt.",

    "hs.rozet.olgunluk": "Reife: {ad}",
    "hs.plan": "Tarif {ad}",

    "hs.seviye.mükemmel": "Ausgezeichnet",
    "hs.seviye.iyi": "Gut",
    "hs.seviye.gelişmeli": "Entwicklungsfähig",
    "hs.seviye.riskli": "Gefährdet",

    "hs.churn.dusuk": "Geringes Churn-Risiko",
    "hs.churn.orta": "Mittleres Churn-Risiko",
    "hs.churn.yuksek": "Hohes Churn-Risiko",

    "hs.durum.iyi": "Gut",
    "hs.durum.orta": "Mittel",
    "hs.durum.zayif": "Schwach",

    "hs.boyut.kurulum": "Setup-Vollständigkeit",
    "hs.boyut.kullanim": "Aktive Nutzung",
    "hs.boyut.yapilandirma": "Konfigurationstiefe",
    "hs.boyut.yonetisim": "Team & Governance",
    "hs.boyut.operasyon": "Operative Gesundheit",

    "hs.agirlik": "Gewichtung {n}%",
    "hs.katki": "Beitragsgewicht zur Gesamtbewertung {n}%",

    "hs.churn.baslik": "Churn-Risiko",
    "hs.churn.riskPuani": "/ 100 Risikopunkte",
    "hs.churn.yuksesltenler": "Risikoerhöhende Signale",
    "hs.churn.neYapmali": "Was zu tun ist",

    "hs.kirilim.baslik": "Dimensions-Aufschlüsselung",
    "hs.kirilim.git": "Öffnen",

    "hs.trend.baslik": "Nutzungs-Gesundheitstrend",
    "hs.trend.aciklama": "Tägliches Verifizierungsvolumen der letzten 30 Tage — die Vitalität von Akzeptanz und Engagement.",
    "hs.trend.aylik": "Monatliche Nutzung",
    "hs.trend.aktifGun": "Aktive Tage (30 T.)",
    "hs.trend.kota": "Kontingentnutzung",
    "hs.adimlar.baslik": "Nächste Schritte",
    "hs.adimlar.hepsiIyi": "Alle Dimensionen gesund",
    "hs.adimlar.hepsiIyiAlt": "Kein vorrangiger Verbesserungsschritt. Aktuelles Setup beibehalten.",

    "hs.not":
      "Diese Bewertung wird deterministisch aus Ihren echten Kontodaten in Veylify (Sites, Regeln, Nutzung, Team, Ereignisse) berechnet. Sie ist eine <b>Selbstbewertung</b>, mit der Sie die Reife Ihres Kontos verfolgen können; sie ist keine externe Bewertung.",

    "hs.ay.siteYok": "Noch keine Site hinzugefügt",
    "hs.ay.siteDogrulandi": "{a}/{b} Sites verifiziert",
    "hs.ay.siteTrafik": "{a}/{b} Sites erhalten Live-Traffic",
    "hs.ay.kuralTanimli": "{n} Regeln definiert",
    "hs.ay.kuralYok": "Keine Regeln definiert",
    "hs.ay.kotaKullanildi": "{n}% des Kontingents genutzt",
    "hs.ay.aktifGun": "{n} aktive Tage in den letzten 30",
    "hs.ay.bugunAktif": "Heute aktiv",
    "hs.ay.sonAktiflik": "Zuletzt aktiv vor {n} Tagen",
    "hs.ay.ozelKural": "{n} benutzerdefinierte Regeln",
    "hs.ay.aiPolitika": "{n} KI-Agent-Richtlinien",
    "hs.ay.entVar": "{n} aktive Integrationen",
    "hs.ay.entYok": "Keine Integration verbunden",
    "hs.ay.ekipUye": "{n} Teammitglieder",
    "hs.ay.tokenVar": "{n} aktive API-Schlüssel",
    "hs.ay.tokenYok": "Keine API-Schlüssel",
    "hs.ay.denetim": "{n} Audit-Einträge",
    "hs.ay.acikKritik": "{n} offene kritische Ereignisse",
    "hs.ay.acikKritikYok": "Keine offenen kritischen Ereignisse",
    "hs.ay.cozuldu": "{a}/{b} Ereignisse gelöst",
    "hs.ay.cozulmeOran": "Lösungsrate {n}%",

    "hs.on.kurulum.siteYok": "Fügen Sie Ihre erste Site hinzu und verifizieren Sie sie — Schutz greift erst nach der Verifizierung.",
    "hs.on.kurulum.dogrulama": "Schließen Sie die Inhaberschaftsverifizierung nicht verifizierter Sites ab.",
    "hs.on.kurulum.trafik": "Platzieren Sie das Schutz-Snippet (Widget) auf Sites ohne Traffic.",
    "hs.on.kurulum.kural": "Definieren Sie mindestens eine Schutzregel.",
    "hs.on.kurulum.tamam": "Setup abgeschlossen — alle Sites verifiziert und integriert.",
    "hs.on.kullanim.sifir": "Das Konto erzeugt keine Verifizierungen — schalten Sie die Integration live und leiten Sie Traffic ein.",
    "hs.on.kullanim.kota": "Sie stoßen ans Kontingent — heben Sie den Tarif an, damit der Schutz nicht blockiert wird.",
    "hs.on.kullanim.dusuk": "Die Nutzung ist sehr gering — weiten Sie den Schutz auf mehr Traffic/Endpunkte aus.",
    "hs.on.kullanim.hareketsiz": "Seit einer Woche kein Traffic — prüfen Sie, ob Ihre Integration noch live ist.",
    "hs.on.kullanim.saglikli": "Die Nutzung liegt im gesunden Bereich — stetig und ausgewogen.",
    "hs.on.yapi.kural": "Fügen Sie auf Ihren eigenen Traffic zugeschnittene Schutzregeln hinzu — die Voreinstellungen reichen nicht.",
    "hs.on.yapi.ai": "Legen Sie eine Richtlinie für KI-Agenten fest (zulassen / verifizieren / blockieren).",
    "hs.on.yapi.ent": "Verbinden Sie eine Slack-/Discord-/Webhook-Integration — bleiben Sie über Ereignisse informiert.",
    "hs.on.yapi.derin": "Die Konfiguration ist tief — Regeln, KI-Richtlinien und Integrationen sind bereit.",
    "hs.on.yon.ekip": "Laden Sie mindestens ein Teammitglied ein — Einzelkonten bergen ein operatives Risiko.",
    "hs.on.yon.token": "Erstellen Sie einen API-Schlüssel für den programmatischen Zugriff.",
    "hs.on.yon.denetim": "Die Governance-Aktivität ist gering — erhöhen Sie regelmäßige Prüfungen und Änderungsspuren.",
    "hs.on.yon.saglam": "Team und Governance sind solide — Mitglieder, Schlüssel und ein Audit-Trail sind vorhanden.",
    "hs.on.op.kritik": "Prüfen und lösen Sie {n} offene kritische Ereignisse — sie gefährden die Schutzwirksamkeit.",
    "hs.on.op.cozulme": "Die Lösungsrate ausstehender Ereignisse ist gering — leeren Sie die Ereigniswarteschlange.",
    "hs.on.op.saglikli": "Der Betrieb ist gesund — keine offenen kritischen Ereignisse, Ereignisse werden gelöst.",

    "hs.cn.benimsemeCokDusuk": "Die Gesamtakzeptanz ist sehr gering — das Konto nutzt das Produkt kaum.",
    "hs.cn.benimsemeSinirli": "Die Akzeptanz ist begrenzt — einige Kern-Setup-Schritte fehlen.",
    "hs.cn.kotaDayali": "Am Kontingent — der Tarif reicht nicht, der Schutz könnte blockiert werden.",
    "hs.cn.kullanimSifir": "Nutzung nahe null — der Produktwert wird noch nicht wahrgenommen.",
    "hs.cn.uykuda": "Seit {n} Tagen kein Traffic — das Konto ist inaktiv.",
    "hs.cn.dusukEtkinlik": "Seit {n} Tagen geringe Aktivität.",
    "hs.cn.acikKritik": "{n} offene kritische Ereignisse warten auf Lösung.",
    "hs.cn.tekKisi": "Einzelkonto — keine Team-Akzeptanz, leichtes Abwandern.",
    "hs.cn.yok": "Kein klares Churn-Signal — das Konto ist gesund und etabliert.",

    "hs.ak.onboarding": "Schließen Sie das Onboarding ab: Site verifizieren, Widget platzieren, erste Regel hinzufügen.",
    "hs.ak.eksikKurulum": "Vervollständigen Sie die fehlenden Setup- und Konfigurationsschritte.",
    "hs.ak.planKota": "Heben Sie den Tarif an oder überprüfen Sie die Kontingentrichtlinie.",
    "hs.ak.trafikYay": "Weiten Sie den Schutz auf Endpunkte mit echtem Traffic aus.",
    "hs.ak.entegreDogrula": "Prüfen Sie, ob die Integration live ist; beheben Sie etwaige Ausfälle.",
    "hs.ak.widgetKontrol": "Prüfen Sie den Traffic-Fluss und die Widget-Installation.",
    "hs.ak.kritikKapat": "Priorisieren und schließen Sie die offenen kritischen Ereignisse.",
    "hs.ak.ekipDavet": "Erhöhen Sie die organisatorische Bindung, indem Sie ein Teammitglied einladen.",
    "hs.ak.surdur": "Behalten Sie die aktuelle gesunde Nutzung bei; eine regelmäßige Prüfung genügt.",
  },

  fr: {
    "hs.baslik": "Santé du compte",

    "hs.serit.baslik": "Dans quelle mesure la configuration de protection de {ws} est-elle saine et adoptée ?",
    "hs.serit.aciklama":
      "Il s'agit de l'<b>auto-évaluation</b> de votre compte (vue customer success) : complétude de la configuration, usage actif, profondeur de configuration, gouvernance d'équipe et santé opérationnelle sont notés par pondération ; les signaux de risque de churn sont mis en avant.",

    "hs.rozet.olgunluk": "Maturité {ad}",
    "hs.plan": "Forfait {ad}",

    "hs.seviye.mükemmel": "Excellente",
    "hs.seviye.iyi": "Bonne",
    "hs.seviye.gelişmeli": "En développement",
    "hs.seviye.riskli": "À risque",

    "hs.churn.dusuk": "Faible risque de churn",
    "hs.churn.orta": "Risque de churn moyen",
    "hs.churn.yuksek": "Risque de churn élevé",

    "hs.durum.iyi": "Bon",
    "hs.durum.orta": "Moyen",
    "hs.durum.zayif": "Faible",

    "hs.boyut.kurulum": "Complétude de la configuration",
    "hs.boyut.kullanim": "Usage actif",
    "hs.boyut.yapilandirma": "Profondeur de configuration",
    "hs.boyut.yonetisim": "Équipe & gouvernance",
    "hs.boyut.operasyon": "Santé opérationnelle",

    "hs.agirlik": "Poids {n}%",
    "hs.katki": "Poids de contribution au score global {n}%",

    "hs.churn.baslik": "Risque de churn",
    "hs.churn.riskPuani": "/ 100 points de risque",
    "hs.churn.yuksesltenler": "Signaux augmentant le risque",
    "hs.churn.neYapmali": "Que faire",

    "hs.kirilim.baslik": "Détail par dimension",
    "hs.kirilim.git": "Ouvrir",

    "hs.trend.baslik": "Tendance de santé d'usage",
    "hs.trend.aciklama": "Volume quotidien de vérifications sur les 30 derniers jours — la vitalité de l'adoption et de l'engagement.",
    "hs.trend.aylik": "Usage mensuel",
    "hs.trend.aktifGun": "Jours actifs (30 j)",
    "hs.trend.kota": "Usage du quota",
    "hs.adimlar.baslik": "Prochaines étapes",
    "hs.adimlar.hepsiIyi": "Toutes les dimensions sont saines",
    "hs.adimlar.hepsiIyiAlt": "Aucune étape d'amélioration prioritaire. Maintenez la configuration actuelle.",

    "hs.not":
      "Ce score est calculé de manière déterministe à partir des données réelles de votre compte dans Veylify (sites, règles, usage, équipe, événements). C'est une <b>auto-évaluation</b> qui vous permet de suivre la maturité de votre compte ; ce n'est pas une notation externe.",

    "hs.ay.siteYok": "Aucun site ajouté pour l'instant",
    "hs.ay.siteDogrulandi": "{a}/{b} sites vérifiés",
    "hs.ay.siteTrafik": "{a}/{b} sites reçoivent du trafic en direct",
    "hs.ay.kuralTanimli": "{n} règles définies",
    "hs.ay.kuralYok": "Aucune règle définie",
    "hs.ay.kotaKullanildi": "{n}% du quota utilisé",
    "hs.ay.aktifGun": "{n} jours actifs sur les 30 derniers",
    "hs.ay.bugunAktif": "Actif aujourd'hui",
    "hs.ay.sonAktiflik": "Dernière activité il y a {n} jours",
    "hs.ay.ozelKural": "{n} règles personnalisées",
    "hs.ay.aiPolitika": "{n} politiques d'agent IA",
    "hs.ay.entVar": "{n} intégrations actives",
    "hs.ay.entYok": "Aucune intégration connectée",
    "hs.ay.ekipUye": "{n} membres d'équipe",
    "hs.ay.tokenVar": "{n} clés API actives",
    "hs.ay.tokenYok": "Aucune clé API",
    "hs.ay.denetim": "{n} enregistrements d'audit",
    "hs.ay.acikKritik": "{n} événements critiques ouverts",
    "hs.ay.acikKritikYok": "Aucun événement critique ouvert",
    "hs.ay.cozuldu": "{a}/{b} événements résolus",
    "hs.ay.cozulmeOran": "Taux de résolution {n}%",

    "hs.on.kurulum.siteYok": "Ajoutez et vérifiez votre premier site — la protection ne s'active qu'après vérification.",
    "hs.on.kurulum.dogrulama": "Terminez la vérification de propriété des sites non vérifiés.",
    "hs.on.kurulum.trafik": "Placez le snippet de protection (widget) sur les sites qui ne reçoivent pas de trafic.",
    "hs.on.kurulum.kural": "Définissez au moins une règle de protection.",
    "hs.on.kurulum.tamam": "Configuration terminée — tous les sites vérifiés et intégrés.",
    "hs.on.kullanim.sifir": "Le compte ne produit aucune vérification — mettez l'intégration en production et générez du trafic.",
    "hs.on.kullanim.kota": "Vous atteignez le quota — passez à un forfait supérieur pour que la protection ne se bloque pas.",
    "hs.on.kullanim.dusuk": "L'usage est très faible — étendez la protection à davantage de trafic/points d'accès.",
    "hs.on.kullanim.hareketsiz": "Aucun trafic depuis une semaine — vérifiez que votre intégration est toujours active.",
    "hs.on.kullanim.saglikli": "L'usage est dans la bande saine — régulier et équilibré.",
    "hs.on.yapi.kural": "Ajoutez des règles de protection propres à votre trafic — les préréglages ne suffisent pas.",
    "hs.on.yapi.ai": "Définissez une politique pour les agents IA (autoriser / vérifier / bloquer).",
    "hs.on.yapi.ent": "Connectez une intégration Slack/Discord/Webhook — restez informé des événements.",
    "hs.on.yapi.derin": "La configuration est approfondie — règles, politiques IA et intégrations sont prêtes.",
    "hs.on.yon.ekip": "Invitez au moins un membre d'équipe — les comptes mono-utilisateur portent un risque opérationnel.",
    "hs.on.yon.token": "Créez une clé API pour l'accès programmatique.",
    "hs.on.yon.denetim": "L'activité de gouvernance est faible — augmentez les revues régulières et les traces de modification.",
    "hs.on.yon.saglam": "Équipe et gouvernance sont solides — membres, clés et piste d'audit sont en place.",
    "hs.on.op.kritik": "Examinez et résolvez {n} événements critiques ouverts — ils compromettent l'efficacité de la protection.",
    "hs.on.op.cozulme": "Le taux de résolution des événements en attente est faible — videz la file d'événements.",
    "hs.on.op.saglikli": "Les opérations sont saines — aucun événement critique ouvert, les événements sont résolus.",

    "hs.cn.benimsemeCokDusuk": "L'adoption globale est très faible — le compte utilise à peine le produit.",
    "hs.cn.benimsemeSinirli": "L'adoption est limitée — certaines étapes de configuration essentielles manquent.",
    "hs.cn.kotaDayali": "Au quota — le forfait est insuffisant, la protection pourrait se bloquer.",
    "hs.cn.kullanimSifir": "Usage proche de zéro — la valeur du produit n'est pas encore ressentie.",
    "hs.cn.uykuda": "Aucun trafic depuis {n} jours — le compte est en sommeil.",
    "hs.cn.dusukEtkinlik": "Faible activité depuis {n} jours.",
    "hs.cn.acikKritik": "{n} événements critiques ouverts en attente de résolution.",
    "hs.cn.tekKisi": "Compte mono-utilisateur — pas d'adoption d'équipe, churn facile.",
    "hs.cn.yok": "Aucun signal de churn clair — le compte est sain et adopté.",

    "hs.ak.onboarding": "Terminez l'onboarding : vérifiez un site, placez le widget, ajoutez la première règle.",
    "hs.ak.eksikKurulum": "Terminez les étapes de configuration manquantes.",
    "hs.ak.planKota": "Passez à un forfait supérieur ou revoyez la politique de quota.",
    "hs.ak.trafikYay": "Étendez la protection aux points d'accès recevant du trafic réel.",
    "hs.ak.entegreDogrula": "Vérifiez que l'intégration est active ; corrigez toute interruption.",
    "hs.ak.widgetKontrol": "Vérifiez le flux de trafic et l'installation du widget.",
    "hs.ak.kritikKapat": "Priorisez et clôturez les événements critiques ouverts.",
    "hs.ak.ekipDavet": "Renforcez l'ancrage organisationnel en invitant un membre d'équipe.",
    "hs.ak.surdur": "Maintenez l'usage sain actuel ; une revue régulière suffit.",
  },

  es: {
    "hs.baslik": "Salud de la cuenta",

    "hs.serit.baslik": "¿Qué tan saludable y adoptada está la configuración de protección de {ws}?",
    "hs.serit.aciklama":
      "Esta es la <b>autoevaluación</b> de tu cuenta (una visión de customer success): completitud de la configuración, uso activo, profundidad de configuración, gobernanza del equipo y salud operativa se puntúan por peso; se destacan las señales de riesgo de churn.",

    "hs.rozet.olgunluk": "Madurez {ad}",
    "hs.plan": "Plan {ad}",

    "hs.seviye.mükemmel": "Excelente",
    "hs.seviye.iyi": "Buena",
    "hs.seviye.gelişmeli": "En desarrollo",
    "hs.seviye.riskli": "En riesgo",

    "hs.churn.dusuk": "Riesgo de churn bajo",
    "hs.churn.orta": "Riesgo de churn medio",
    "hs.churn.yuksek": "Riesgo de churn alto",

    "hs.durum.iyi": "Bueno",
    "hs.durum.orta": "Medio",
    "hs.durum.zayif": "Débil",

    "hs.boyut.kurulum": "Completitud de la configuración",
    "hs.boyut.kullanim": "Uso activo",
    "hs.boyut.yapilandirma": "Profundidad de configuración",
    "hs.boyut.yonetisim": "Equipo y gobernanza",
    "hs.boyut.operasyon": "Salud operativa",

    "hs.agirlik": "Peso {n}%",
    "hs.katki": "Peso de contribución al puntaje global {n}%",

    "hs.churn.baslik": "Riesgo de churn",
    "hs.churn.riskPuani": "/ 100 puntos de riesgo",
    "hs.churn.yuksesltenler": "Señales que elevan el riesgo",
    "hs.churn.neYapmali": "Qué hacer",

    "hs.kirilim.baslik": "Desglose por dimensión",
    "hs.kirilim.git": "Ir",

    "hs.trend.baslik": "Tendencia de salud de uso",
    "hs.trend.aciklama": "Volumen diario de verificaciones en los últimos 30 días — la vitalidad de la adopción y el compromiso.",
    "hs.trend.aylik": "Uso mensual",
    "hs.trend.aktifGun": "Días activos (30 d)",
    "hs.trend.kota": "Uso de cuota",
    "hs.adimlar.baslik": "Próximos pasos",
    "hs.adimlar.hepsiIyi": "Todas las dimensiones saludables",
    "hs.adimlar.hepsiIyiAlt": "No hay paso de mejora prioritario. Mantén la configuración actual.",

    "hs.not":
      "Este puntaje se calcula de forma determinista a partir de los datos reales de tu cuenta en Veylify (sitios, reglas, uso, equipo, eventos). Es una <b>autoevaluación</b> que te permite seguir la madurez de tu cuenta; no es una calificación externa.",

    "hs.ay.siteYok": "Aún no se han añadido sitios",
    "hs.ay.siteDogrulandi": "{a}/{b} sitios verificados",
    "hs.ay.siteTrafik": "{a}/{b} sitios reciben tráfico en vivo",
    "hs.ay.kuralTanimli": "{n} reglas definidas",
    "hs.ay.kuralYok": "Ninguna regla definida",
    "hs.ay.kotaKullanildi": "{n}% de la cuota usada",
    "hs.ay.aktifGun": "{n} días activos en los últimos 30",
    "hs.ay.bugunAktif": "Activo hoy",
    "hs.ay.sonAktiflik": "Última actividad hace {n} días",
    "hs.ay.ozelKural": "{n} reglas personalizadas",
    "hs.ay.aiPolitika": "{n} políticas de agente IA",
    "hs.ay.entVar": "{n} integraciones activas",
    "hs.ay.entYok": "Ninguna integración conectada",
    "hs.ay.ekipUye": "{n} miembros del equipo",
    "hs.ay.tokenVar": "{n} claves API activas",
    "hs.ay.tokenYok": "Sin claves API",
    "hs.ay.denetim": "{n} registros de auditoría",
    "hs.ay.acikKritik": "{n} eventos críticos abiertos",
    "hs.ay.acikKritikYok": "Sin eventos críticos abiertos",
    "hs.ay.cozuldu": "{a}/{b} eventos resueltos",
    "hs.ay.cozulmeOran": "Tasa de resolución {n}%",

    "hs.on.kurulum.siteYok": "Añade y verifica tu primer sitio — la protección solo se activa tras la verificación.",
    "hs.on.kurulum.dogrulama": "Completa la verificación de propiedad de los sitios sin verificar.",
    "hs.on.kurulum.trafik": "Coloca el snippet de protección (widget) en los sitios que aún no reciben tráfico.",
    "hs.on.kurulum.kural": "Define al menos una regla de protección.",
    "hs.on.kurulum.tamam": "Configuración completa — todos los sitios verificados e integrados.",
    "hs.on.kullanim.sifir": "La cuenta no produce verificaciones — pon la integración en producción y genera tráfico.",
    "hs.on.kullanim.kota": "Estás llegando a la cuota — mejora el plan para que la protección no empiece a bloquearse.",
    "hs.on.kullanim.dusuk": "El uso es muy bajo — extiende la protección a más tráfico/endpoints.",
    "hs.on.kullanim.hareketsiz": "Sin tráfico durante una semana — verifica que tu integración siga activa.",
    "hs.on.kullanim.saglikli": "El uso está en la banda saludable — constante y equilibrado.",
    "hs.on.yapi.kural": "Añade reglas de protección propias de tu tráfico — los preajustes no bastan.",
    "hs.on.yapi.ai": "Define una política para agentes IA (permitir / verificar / bloquear).",
    "hs.on.yapi.ent": "Conecta una integración de Slack/Discord/Webhook — mantente informado de los eventos.",
    "hs.on.yapi.derin": "La configuración es profunda — reglas, políticas IA e integraciones están listas.",
    "hs.on.yon.ekip": "Invita al menos a un miembro del equipo — las cuentas de una sola persona conllevan riesgo operativo.",
    "hs.on.yon.token": "Crea una clave API para el acceso programático.",
    "hs.on.yon.denetim": "La actividad de gobernanza es baja — aumenta las revisiones regulares y los rastros de cambios.",
    "hs.on.yon.saglam": "El equipo y la gobernanza son sólidos — miembros, claves y un rastro de auditoría están en su lugar.",
    "hs.on.op.kritik": "Revisa y resuelve {n} eventos críticos abiertos — están poniendo en riesgo la eficacia de la protección.",
    "hs.on.op.cozulme": "La tasa de resolución de eventos pendientes es baja — vacía la cola de eventos.",
    "hs.on.op.saglikli": "Las operaciones están saludables — sin eventos críticos abiertos, los eventos se resuelven.",

    "hs.cn.benimsemeCokDusuk": "La adopción general es muy baja — la cuenta apenas usa el producto.",
    "hs.cn.benimsemeSinirli": "La adopción es limitada — faltan algunos pasos de configuración esenciales.",
    "hs.cn.kotaDayali": "En la cuota — el plan se queda corto, la protección podría bloquearse.",
    "hs.cn.kullanimSifir": "Uso casi nulo — el valor del producto aún no se percibe.",
    "hs.cn.uykuda": "Sin tráfico durante {n} días — la cuenta está inactiva.",
    "hs.cn.dusukEtkinlik": "Baja actividad durante {n} días.",
    "hs.cn.acikKritik": "{n} eventos críticos abiertos a la espera de resolución.",
    "hs.cn.tekKisi": "Cuenta de una sola persona — sin adopción de equipo, fácil de abandonar.",
    "hs.cn.yok": "Sin señal clara de churn — la cuenta está saludable y adoptada.",

    "hs.ak.onboarding": "Completa el onboarding: verifica un sitio, coloca el widget, añade la primera regla.",
    "hs.ak.eksikKurulum": "Completa los pasos de configuración pendientes.",
    "hs.ak.planKota": "Mejora el plan o revisa la política de cuota.",
    "hs.ak.trafikYay": "Extiende la protección a endpoints que reciben tráfico real.",
    "hs.ak.entegreDogrula": "Verifica que la integración esté activa; corrige cualquier interrupción.",
    "hs.ak.widgetKontrol": "Comprueba el flujo de tráfico y la instalación del widget.",
    "hs.ak.kritikKapat": "Prioriza y cierra los eventos críticos abiertos.",
    "hs.ak.ekipDavet": "Aumenta el arraigo organizativo invitando a un miembro del equipo.",
    "hs.ak.surdur": "Mantén el uso saludable actual; una revisión regular es suficiente.",
  },
};

/** Hesap Sağlığı sayfası çeviri yardımcısı. TR'ye, o da yoksa anahtara düşer. */
export function hesapSaglikCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
