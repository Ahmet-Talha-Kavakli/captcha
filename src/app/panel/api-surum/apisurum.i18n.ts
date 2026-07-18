/**
 * API Sürümleme & Değişiklik Günlüğü sayfası — yerel çeviri sözlüğü.
 *
 * Sadece bu sayfaya özgü kullanıcı-görünür metinleri içerir. Paylaşılan
 * `src/lib/i18n/panel.ts` sözlüğüne DOKUNMAZ. Anahtar bulunamazsa TR'ye,
 * o da yoksa anahtarın kendisine düşer.
 *
 * ENUM GÜVENLİĞİ: DegisimTuru / MatrisDurum / durum enum DEĞERLERİ asla
 * çevrilmez; onlar anahtar olarak kalır. Yalnızca etiket-metinleri çevrilir.
 * Sürüm numaraları (v1, v2), API v2 etiketleri, taban URL'ler, tarihler ve
 * kod örnekleri VERİ olarak korunur — çevrilmez.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // Giriş şeridi
    "as.giris.baslik": "API sürümlerini, değişiklikleri ve göç yollarını tek yerden izle.",
    "as.giris.aciklama":
      "Veylify API'sinin sürüm politikası, tam değişiklik günlüğü, endpoint sürüm matrisi ve kullanımdan kaldırma bildirimleri. Entegrasyonunuzu güncel tutmak için gereken her şey burada.",

    // Özet istatistikler
    "as.stat.guncel": "Güncel kararlı sürüm",
    "as.stat.beta": "Beta (erken erişim)",
    "as.stat.yeni": "Yeni özellik (günlük)",
    "as.stat.kirici": "Kırıcı / kaldırma",

    // Sürüm bilgileri (v1 / v2)
    "as.surum.v1.etiket": "Kararlı (Genel Kullanım)",
    "as.surum.v1.aciklama":
      "Üretime hazır, uzun-vadeli desteklenen sürüm. Widget → challenge/verify akışı ve sunucu-taraflı siteverify teyidi bu sürümde yayınlanır. Kırıcı olmayan tüm iyileştirmeler geriye uyumlu şekilde eklenir.",
    "as.surum.v2.etiket": "Beta — üretimde önerilmez",
    "as.surum.v2.aciklama":
      "Zenginleştirilmiş risk sinyalleri (risk skoru, JA4 parmak izi, AI ajan sınıfı) yanıt gövdesinde birinci-sınıf alanlar olarak döner. Alan adları ve şekli GA'ya kadar değişebilir. Erken erişim için endpoint bazında etkinleştirilir.",

    // Durum rozetleri
    "as.durum.kararli": "Kararlı",
    "as.durum.beta": "Beta",
    "as.durum.kaldirildi": "Kaldırıldı",
    "as.rozet.onerilen": "Önerilen",

    // Genel bakış paneli
    "as.gb.baslik": "Sürüm genel bakışı",
    "as.gb.tabanUrl": "Taban URL",
    "as.gb.yayinTarihi": "Yayın tarihi",
    "as.toast.baslik": "Taban URL kopyalandı",

    // sürüm göstergeleri (gauge + istek payı)
    "as.gauge.saglik": "Kararlılık skoru",
    "as.gauge.benimseme": "Benimseme skoru",
    "as.gauge.istekPayi": "İstek payı (24s)",
    "as.gauge.v1Not": "Üretim trafiğinin çoğunluğu hâlâ v1'de; tam desteklenir.",
    "as.gauge.v2Not": "Erken benimseyenler v2 beta'yı deniyor; geriye uyumlu.",

    // sürüm kullanımı & endpoint yükü
    "as.kullanim.baslik": "Sürüm kullanımı & endpoint yükü",
    "as.kullanim.payBaslik": "Sürüm istek payı",
    "as.kullanim.payNot": "Son 24 saatteki tüm doğrulama isteklerinin sürüme göre dağılımı.",
    "as.kullanim.hacimBaslik": "Endpoint çağrı hacmi",
    "as.kullanim.hacimBirim": "bin çağrı / 24s",
    "as.kullanim.efsaneKararli": "Kararlı",
    "as.kullanim.efsaneDegisti": "v2'de değişti",
    "as.kullanim.efsaneKaldirildi": "Kaldırıldı",

    // deprecation zaman çizelgesi
    "as.kald.zamanBaslik": "Kullanımdan kaldırma zaman çizelgesi",
    "as.kald.asama.duyuru": "Duyuru",
    "as.kald.asama.sunset": "Sunset",
    "as.kald.asama.kaldirildi": "Kaldırıldı",

    // Sürümleme konvansiyonu
    "as.konv.baslik": "Sürümleme konvansiyonu",
    "as.konv.giris":
      "Veylify <b>iki katmanlı</b> sürümleme kullanır. <b>Major sürümler yola gömülüdür</b> ({v1}, {v2}) — kırıcı değişiklikler yalnızca yeni bir major sürümde yayınlanır. Bir major sürüm içindeki <b>küçük, geriye uyumlu</b> değişiklikler ise {ver} tarih başlığıyla sabitlenir (Stripe modeli).",
    "as.konv.yolBaslik": "Yol (major sürüm)",
    "as.konv.yolAciklama": "Kırıcı değişiklikler için. Sürümü açıkça URL'de görürsünüz.",
    "as.konv.baslikBaslik": "Başlık (tarih pini, minor)",
    "as.konv.baslikAciklama": "Major içindeki geriye-uyumlu değişiklikleri dondurur. Opsiyoneldir.",

    // Değişiklik günlüğü
    "as.gunluk.baslik": "Değişiklik günlüğü",
    "as.gunluk.tumu": "Tümü",
    "as.gunluk.bosTur": "Bu türde giriş yok.",

    // Değişim türü etiketleri (DegisimTuru anahtarları → metin)
    "as.tur.yeni": "Yeni özellik",
    "as.tur.iyilestirme": "İyileştirme",
    "as.tur.duzeltme": "Düzeltme",
    "as.tur.kirici": "Kırıcı değişiklik",
    "as.tur.kaldirma": "Kullanımdan kaldırma",

    // Günlük girişleri (baslik + aciklama, tarihe göre)
    "as.g.2026-06-15.baslik": "v2 beta yayınlandı — zenginleştirilmiş risk yanıtı",
    "as.g.2026-06-15.aciklama":
      "/api/v2/passive ve /api/v2/verify yanıtlarına yapılandırılmış `risk` nesnesi eklendi: `risk.score`, `risk.level` (low/medium/high) ve `risk.reasons[]`. v1'deki düz `score` alanı geriye uyumluluk için korunur.",
    "as.g.2026-05-20.baslik": "JA4 parmak izi alanı eklendi",
    "as.g.2026-05-20.aciklama":
      "verify ve passive olay kayıtlarında JA4/JA4H TLS parmak izi yüzeye çıkarıldı. Webhook `bot.blocked` yükü artık `ja4` alanını içerir. Eski `ja3` alanı korunur; JA4'e geçiş önerilir.",
    "as.g.2026-04-28.baslik": "passive verify yanıtına risk skoru eklendi",
    "as.g.2026-04-28.aciklama":
      "/api/v1/passive artık başarılı görünmez-mod geçişlerinde `score` alanını (0–1 davranış skoru) döndürüyor. Bu geriye uyumlu bir eklemedir; mevcut istemciler etkilenmez.",
    "as.g.2026-04-10.baslik": "AI ajan politikası passive akışına taşındı",
    "as.g.2026-04-10.aciklama":
      "Bilinen AI crawler'ları (GPTBot, ClaudeBot, PerplexityBot vb.) için site sahibi politikaları artık görünmez modda da uygulanıyor. `reason: ai_policy` yeni bir başarısızlık nedeni olarak eklendi.",
    "as.g.2026-03-15.baslik": "Kota uyarı başlığı standartlaştırıldı",
    "as.g.2026-03-15.aciklama":
      "Aylık kotaya yaklaşıldığında `X-Veylify-Quota: warning`, aşıldığında `overage` veya `exceeded` başlığı döner. challenge yanıtına opsiyonel `quotaWarning` nesnesi eklendi.",
    "as.g.2026-02-02.baslik": "Nonce replay penceresi düzeltildi",
    "as.g.2026-02-02.aciklama":
      "TTL sınırında (challenge süresi dolarken) nadiren aynı nonce'ın iki kez kabul edilmesine yol açan yarış durumu giderildi. Replay tespitinde `reason: replay` artık deterministik döner.",
    "as.g.2026-01-01.baslik": "Tarih tabanlı sürüm sabitleme (Veylify-Version)",
    "as.g.2026-01-01.aciklama":
      "İstemciler artık `Veylify-Version: 2026-01-01` başlığıyla bir tarihe pinlenebilir. Başlık yoksa hesabınızın varsayılan sürümü kullanılır. Bu, major sürüm (/v1) içindeki küçük değişiklikleri kontrol etmenizi sağlar.",
    "as.g.2025-12-10.baslik": "Görünmez mod (passive) uç noktası",
    "as.g.2025-12-10.aciklama":
      "/api/v1/passive eklendi: challenge göstermeden davranış sinyalleri + kural motoruyla karar verir. reCAPTCHA v3 / Turnstile sürtünmesiz akışının Veylify karşılığı. `passed`, `token`, `reason` döndürür.",
    "as.g.2025-11-05.baslik": "verify yanıtına appliedRules eklendi",
    "as.g.2025-11-05.aciklama":
      "/api/v1/verify başarı yanıtı artık isteğe uygulanan kural adlarını `appliedRules[]` dizisinde döndürüyor. Hata ayıklama ve denetim için geriye uyumlu ekleme.",
    "as.g.2025-10-14.baslik": "siteverify hata biçimi error-codes dizisine geçti",
    "as.g.2025-10-14.aciklama":
      "reCAPTCHA/Turnstile ile uyum için /api/v1/siteverify hataları tekil `error` string yerine `error-codes: string[]` döndürüyor (ör. `invalid-input-secret`, `site-not-verified`). Sunucu tarafı entegrasyonlarınızı güncelleyin.",
    "as.g.2025-09-20.baslik": "Eski /v1/check ucu kullanımdan kaldırıldı",
    "as.g.2025-09-20.aciklama":
      "Tek-adımlı `/api/v1/check` ucu, iki-fazlı verify + siteverify akışı lehine kullanımdan kaldırıldı (sunset: 2026-03-31). Kanıt: imzalı token doğrulaması istemci tarafında güvenilir değildi.",
    "as.g.2025-09-01.baslik": "v1 genel kullanıma (GA) açıldı",
    "as.g.2025-09-01.aciklama":
      "challenge / verify / siteverify uçları kararlı olarak yayınlandı. Ghost-font challenge üretimi, imzalı token doğrulaması ve sunucu-taraflı teyit ilk kez üretime hazır hale geldi.",

    // Endpoint matrisi
    "as.matris.baslik": "Endpoint sürüm matrisi",
    "as.matris.giris":
      "Tüm public uçlar {url} altında yayınlanır. Aşağıdaki uçlar Veylify'ın gerçek API yüzeyini yansıtır.",
    "as.matris.thEndpoint": "Endpoint",
    "as.matris.thDurum": "Durum",

    // Endpoint özetleri (yol → özet)
    "as.ep.challenge": "Yeni ghost-font challenge üret (widget çağırır)",
    "as.ep.passive": "Görünmez mod: challenge göstermeden doğrula",
    "as.ep.verify": "Challenge cevabı + davranış + nonce doğrula",
    "as.ep.siteverify": "Sunucu-taraflı token teyidi (secret ile)",
    "as.ep.check": "Tek-adımlı doğrulama (eski)",

    // Matris durum etiketleri (MatrisDurum anahtarları → metin)
    "as.mat.var": "Var",
    "as.mat.beta": "Beta",
    "as.mat.planlanan": "Planlanan",
    "as.mat.degisti": "Değişti",
    "as.mat.kaldirildi": "Kaldırıldı",
    "as.mat.yok": "Yok",

    // Kullanımdan kaldırma
    "as.kald.baslik": "Kullanımdan kaldırma bildirimleri",
    "as.kald.sunset": "Sunset: {tarih}",
    "as.kald.uyari":
      "Tek-adımlı <code>/check</code> ucu, güvenli iki-fazlı <code>verify</code> + <code>siteverify</code> akışı lehine kaldırıldı. İmzalı token doğrulaması istemci tarafında güvenilir olmadığı için sunucu-taraflı teyit zorunlu hale geldi. Aşağıdaki göç kılavuzunu izleyin.",
    "as.kald.gocBaslik": "Göç kılavuzu — önce / sonra",
    "as.kald.once": "Önce (kaldırıldı)",
    "as.kald.sonra": "Sonra (önerilen)",
    "as.kald.politikaBaslik": "Kullanımdan kaldırma politikası",
    "as.kald.politika":
      "Kullanımdan kaldırılan her uç/alan için <b>en az 6 ay sunset penceresi</b> sağlanır. Kaldırma önce bu sayfada ve <code>Sunset</code> yanıt başlığında duyurulur; ardından hesap panelinizde uyarı gösterilir. Kırıcı değişiklikler yalnızca yeni bir major sürümde (ör. /v2) yayınlanır.",

    // Diff görünümü
    "as.diff.baslik": "Neler değişti — v1 → v2 (beta) diff",
    "as.diff.giris":
      "<code>POST /passive</code> yanıt şekli, v2'de yapılandırılmış bir <code>risk</code> nesnesi ve <code>ja4</code> parmak izi ile zenginleştirildi. v1 alanları (<code>score</code>) geriye uyumluluk için korunur — yeşil satırlar eklenen alanlardır.",
    "as.diff.mevcut": "mevcut",
    "as.diff.eklenen": "beta — eklenen alanlar",
    "as.diff.ozet.koru": "score — düz alan korundu",

    // Sürüm sabitleme
    "as.pin.baslik": "Sürüm sabitleme (version pinning)",
    "as.pin.yolBaslik": "Yol ile sabitleme (major)",
    "as.pin.yolEtiket": "Yol tabanlı",
    "as.pin.baslikBaslik": "Başlık ile sabitleme (tarih)",
    "as.pin.ilke1.baslik": "Geriye uyum garantisi",
    "as.pin.ilke1.aciklama":
      "Bir major sürüm içinde yeni alanlar eklenebilir; mevcut alanlar asla kaldırılmaz veya yeniden adlandırılmaz.",
    "as.pin.ilke2.baslik": "6 ay sunset",
    "as.pin.ilke2.aciklama":
      "Kullanımdan kaldırılan uç/alanlar en az 6 ay boyunca çalışmaya devam eder; Sunset başlığıyla duyurulur.",
    "as.pin.ilke3.baslik": "Varsayılan sürüm",
    "as.pin.ilke3.aciklama":
      "Başlık göndermezseniz hesabınızın panelde ayarlı varsayılan sürümü kullanılır. Yeni hesaplar en güncel kararlıya kilitlenir.",

    // Dürüstlük notu
    "as.durustluk":
      "Bu sayfadaki tarihler ve değişiklik günlüğü girişleri, Veylify API'sinin evrimini <b>temsili</b> olarak yansıtır. Endpoint matrisi ve kod örnekleri ise ürünün <b>gerçek</b> public uçlarıyla (challenge / passive / verify / siteverify) ve bunların gerçek yanıt alanlarıyla hizalıdır.",
  },

  en: {
    "as.giris.baslik": "Track API versions, changes and migration paths in one place.",
    "as.giris.aciklama":
      "The Veylify API's version policy, full changelog, endpoint version matrix and deprecation notices. Everything you need to keep your integration up to date, right here.",

    "as.stat.guncel": "Current stable version",
    "as.stat.beta": "Beta (early access)",
    "as.stat.yeni": "New features (changelog)",
    "as.stat.kirici": "Breaking / removals",

    "as.surum.v1.etiket": "Stable (General Availability)",
    "as.surum.v1.aciklama":
      "Production-ready, long-term supported version. The widget → challenge/verify flow and server-side siteverify confirmation ship in this version. All non-breaking improvements are added in a backward-compatible way.",
    "as.surum.v2.etiket": "Beta — not recommended in production",
    "as.surum.v2.aciklama":
      "Enriched risk signals (risk score, JA4 fingerprint, AI agent class) are returned as first-class fields in the response body. Field names and shape may change before GA. Enabled per endpoint for early access.",

    "as.durum.kararli": "Stable",
    "as.durum.beta": "Beta",
    "as.durum.kaldirildi": "Removed",
    "as.rozet.onerilen": "Recommended",

    "as.gb.baslik": "Version overview",
    "as.gb.tabanUrl": "Base URL",
    "as.gb.yayinTarihi": "Release date",
    "as.toast.baslik": "Base URL copied",

    "as.gauge.saglik": "Stability score",
    "as.gauge.benimseme": "Adoption score",
    "as.gauge.istekPayi": "Request share (24h)",
    "as.gauge.v1Not": "Most production traffic is still on v1; fully supported.",
    "as.gauge.v2Not": "Early adopters are trying the v2 beta; backward compatible.",

    "as.kullanim.baslik": "Version usage & endpoint load",
    "as.kullanim.payBaslik": "Version request share",
    "as.kullanim.payNot": "Share of all verification requests by version over the last 24 hours.",
    "as.kullanim.hacimBaslik": "Endpoint call volume",
    "as.kullanim.hacimBirim": "k calls / 24h",
    "as.kullanim.efsaneKararli": "Stable",
    "as.kullanim.efsaneDegisti": "Changed in v2",
    "as.kullanim.efsaneKaldirildi": "Removed",

    "as.kald.zamanBaslik": "Deprecation timeline",
    "as.kald.asama.duyuru": "Announced",
    "as.kald.asama.sunset": "Sunset",
    "as.kald.asama.kaldirildi": "Removed",

    "as.konv.baslik": "Versioning convention",
    "as.konv.giris":
      "Veylify uses <b>two-layer</b> versioning. <b>Major versions are embedded in the path</b> ({v1}, {v2}) — breaking changes ship only in a new major version. Small, <b>backward-compatible</b> changes within a major version are pinned with the {ver} date header (the Stripe model).",
    "as.konv.yolBaslik": "Path (major version)",
    "as.konv.yolAciklama": "For breaking changes. You see the version explicitly in the URL.",
    "as.konv.baslikBaslik": "Header (date pin, minor)",
    "as.konv.baslikAciklama": "Freezes backward-compatible changes within a major. Optional.",

    "as.gunluk.baslik": "Changelog",
    "as.gunluk.tumu": "All",
    "as.gunluk.bosTur": "No entries of this type.",

    "as.tur.yeni": "New feature",
    "as.tur.iyilestirme": "Improvement",
    "as.tur.duzeltme": "Fix",
    "as.tur.kirici": "Breaking change",
    "as.tur.kaldirma": "Deprecation",

    "as.g.2026-06-15.baslik": "v2 beta released — enriched risk response",
    "as.g.2026-06-15.aciklama":
      "A structured `risk` object was added to /api/v2/passive and /api/v2/verify responses: `risk.score`, `risk.level` (low/medium/high) and `risk.reasons[]`. The flat `score` field from v1 is preserved for backward compatibility.",
    "as.g.2026-05-20.baslik": "JA4 fingerprint field added",
    "as.g.2026-05-20.aciklama":
      "The JA4/JA4H TLS fingerprint was surfaced in verify and passive event records. The `bot.blocked` webhook payload now includes a `ja4` field. The legacy `ja3` field is preserved; migrating to JA4 is recommended.",
    "as.g.2026-04-28.baslik": "Risk score added to passive verify response",
    "as.g.2026-04-28.aciklama":
      "/api/v1/passive now returns a `score` field (0–1 behavioral score) on successful invisible-mode passes. This is a backward-compatible addition; existing clients are unaffected.",
    "as.g.2026-04-10.baslik": "AI agent policy moved into the passive flow",
    "as.g.2026-04-10.aciklama":
      "Site-owner policies for known AI crawlers (GPTBot, ClaudeBot, PerplexityBot, etc.) are now enforced in invisible mode too. `reason: ai_policy` was added as a new failure reason.",
    "as.g.2026-03-15.baslik": "Quota warning header standardized",
    "as.g.2026-03-15.aciklama":
      "When approaching the monthly quota an `X-Veylify-Quota: warning` header is returned, and `overage` or `exceeded` when it is surpassed. An optional `quotaWarning` object was added to the challenge response.",
    "as.g.2026-02-02.baslik": "Nonce replay window fixed",
    "as.g.2026-02-02.aciklama":
      "A race condition that rarely allowed the same nonce to be accepted twice at the TTL boundary (as the challenge expired) was resolved. On replay detection, `reason: replay` is now returned deterministically.",
    "as.g.2026-01-01.baslik": "Date-based version pinning (Veylify-Version)",
    "as.g.2026-01-01.aciklama":
      "Clients can now pin to a date with the `Veylify-Version: 2026-01-01` header. Without the header, your account's default version is used. This lets you control minor changes within a major version (/v1).",
    "as.g.2025-12-10.baslik": "Invisible mode (passive) endpoint",
    "as.g.2025-12-10.aciklama":
      "/api/v1/passive was added: it decides using behavioral signals + the rule engine without showing a challenge. Veylify's equivalent of the reCAPTCHA v3 / Turnstile frictionless flow. Returns `passed`, `token`, `reason`.",
    "as.g.2025-11-05.baslik": "appliedRules added to verify response",
    "as.g.2025-11-05.aciklama":
      "The /api/v1/verify success response now returns the names of rules applied to the request in an `appliedRules[]` array. A backward-compatible addition for debugging and auditing.",
    "as.g.2025-10-14.baslik": "siteverify error format switched to an error-codes array",
    "as.g.2025-10-14.aciklama":
      "For compatibility with reCAPTCHA/Turnstile, /api/v1/siteverify errors now return `error-codes: string[]` instead of a single `error` string (e.g. `invalid-input-secret`, `site-not-verified`). Update your server-side integrations.",
    "as.g.2025-09-20.baslik": "Legacy /v1/check endpoint deprecated",
    "as.g.2025-09-20.aciklama":
      "The single-step `/api/v1/check` endpoint was deprecated in favor of the two-phase verify + siteverify flow (sunset: 2026-03-31). Rationale: signed-token validation was not trustworthy on the client side.",
    "as.g.2025-09-01.baslik": "v1 reached General Availability (GA)",
    "as.g.2025-09-01.aciklama":
      "The challenge / verify / siteverify endpoints were released as stable. Ghost-font challenge generation, signed-token validation and server-side confirmation became production-ready for the first time.",

    "as.matris.baslik": "Endpoint version matrix",
    "as.matris.giris":
      "All public endpoints ship under {url}. The endpoints below reflect Veylify's real API surface.",
    "as.matris.thEndpoint": "Endpoint",
    "as.matris.thDurum": "Status",

    "as.ep.challenge": "Generate a new ghost-font challenge (called by the widget)",
    "as.ep.passive": "Invisible mode: verify without showing a challenge",
    "as.ep.verify": "Verify challenge answer + behavior + nonce",
    "as.ep.siteverify": "Server-side token confirmation (with secret)",
    "as.ep.check": "Single-step verification (legacy)",

    "as.mat.var": "Present",
    "as.mat.beta": "Beta",
    "as.mat.planlanan": "Planned",
    "as.mat.degisti": "Changed",
    "as.mat.kaldirildi": "Removed",
    "as.mat.yok": "None",

    "as.kald.baslik": "Deprecation notices",
    "as.kald.sunset": "Sunset: {tarih}",
    "as.kald.uyari":
      "The single-step <code>/check</code> endpoint was removed in favor of the secure two-phase <code>verify</code> + <code>siteverify</code> flow. Since signed-token validation is not trustworthy on the client side, server-side confirmation became mandatory. Follow the migration guide below.",
    "as.kald.gocBaslik": "Migration guide — before / after",
    "as.kald.once": "Before (removed)",
    "as.kald.sonra": "After (recommended)",
    "as.kald.politikaBaslik": "Deprecation policy",
    "as.kald.politika":
      "For every deprecated endpoint/field we provide <b>at least a 6-month sunset window</b>. A removal is first announced on this page and in the <code>Sunset</code> response header; then a warning appears in your account panel. Breaking changes ship only in a new major version (e.g. /v2).",

    "as.diff.baslik": "What changed — v1 → v2 (beta) diff",
    "as.diff.giris":
      "The <code>POST /passive</code> response shape was enriched in v2 with a structured <code>risk</code> object and a <code>ja4</code> fingerprint. The v1 fields (<code>score</code>) are preserved for backward compatibility — the green lines are the added fields.",
    "as.diff.mevcut": "current",
    "as.diff.eklenen": "beta — added fields",
    "as.diff.ozet.koru": "score — flat field preserved",

    "as.pin.baslik": "Version pinning",
    "as.pin.yolBaslik": "Pin by path (major)",
    "as.pin.yolEtiket": "Path-based",
    "as.pin.baslikBaslik": "Pin by header (date)",
    "as.pin.ilke1.baslik": "Backward-compatibility guarantee",
    "as.pin.ilke1.aciklama":
      "New fields may be added within a major version; existing fields are never removed or renamed.",
    "as.pin.ilke2.baslik": "6-month sunset",
    "as.pin.ilke2.aciklama":
      "Deprecated endpoints/fields keep working for at least 6 months; announced via the Sunset header.",
    "as.pin.ilke3.baslik": "Default version",
    "as.pin.ilke3.aciklama":
      "If you don't send the header, your account's default version set in the panel is used. New accounts are locked to the latest stable.",

    "as.durustluk":
      "The dates and changelog entries on this page reflect the evolution of the Veylify API in a <b>representative</b> way. The endpoint matrix and code examples, however, are aligned with the product's <b>real</b> public endpoints (challenge / passive / verify / siteverify) and their actual response fields.",
  },

  de: {
    "as.giris.baslik": "Verfolge API-Versionen, Änderungen und Migrationspfade an einem Ort.",
    "as.giris.aciklama":
      "Die Versionsrichtlinie der Veylify-API, das vollständige Änderungsprotokoll, die Endpunkt-Versionsmatrix und Verfallshinweise. Alles, was du brauchst, um deine Integration aktuell zu halten, an einem Ort.",

    "as.stat.guncel": "Aktuelle stabile Version",
    "as.stat.beta": "Beta (früher Zugang)",
    "as.stat.yeni": "Neue Funktionen (Protokoll)",
    "as.stat.kirici": "Breaking / Entfernungen",

    "as.surum.v1.etiket": "Stabil (Allgemeine Verfügbarkeit)",
    "as.surum.v1.aciklama":
      "Produktionsreife, langfristig unterstützte Version. Der Ablauf Widget → challenge/verify und die serverseitige siteverify-Bestätigung werden in dieser Version ausgeliefert. Alle nicht brechenden Verbesserungen werden abwärtskompatibel ergänzt.",
    "as.surum.v2.etiket": "Beta — in Produktion nicht empfohlen",
    "as.surum.v2.aciklama":
      "Angereicherte Risikosignale (Risk-Score, JA4-Fingerabdruck, KI-Agent-Klasse) werden als erstklassige Felder im Antwortkörper zurückgegeben. Feldnamen und -form können sich bis zur GA ändern. Für frühen Zugang pro Endpunkt aktiviert.",

    "as.durum.kararli": "Stabil",
    "as.durum.beta": "Beta",
    "as.durum.kaldirildi": "Entfernt",
    "as.rozet.onerilen": "Empfohlen",

    "as.gb.baslik": "Versionsübersicht",
    "as.gb.tabanUrl": "Basis-URL",
    "as.gb.yayinTarihi": "Veröffentlichungsdatum",
    "as.toast.baslik": "Basis-URL kopiert",

    "as.gauge.saglik": "Stabilitätswert",
    "as.gauge.benimseme": "Akzeptanzwert",
    "as.gauge.istekPayi": "Anfragenanteil (24 Std.)",
    "as.gauge.v1Not": "Der meiste Produktionsverkehr läuft weiterhin über v1; voll unterstützt.",
    "as.gauge.v2Not": "Frühe Anwender testen die v2-Beta; abwärtskompatibel.",

    "as.kullanim.baslik": "Versionsnutzung & Endpoint-Last",
    "as.kullanim.payBaslik": "Anfragenanteil je Version",
    "as.kullanim.payNot": "Anteil aller Verifizierungsanfragen nach Version in den letzten 24 Stunden.",
    "as.kullanim.hacimBaslik": "Endpoint-Aufrufvolumen",
    "as.kullanim.hacimBirim": "Tsd. Aufrufe / 24 Std.",
    "as.kullanim.efsaneKararli": "Stabil",
    "as.kullanim.efsaneDegisti": "In v2 geändert",
    "as.kullanim.efsaneKaldirildi": "Entfernt",

    "as.kald.zamanBaslik": "Deprecation-Zeitleiste",
    "as.kald.asama.duyuru": "Angekündigt",
    "as.kald.asama.sunset": "Sunset",
    "as.kald.asama.kaldirildi": "Entfernt",

    "as.konv.baslik": "Versionierungskonvention",
    "as.konv.giris":
      "Veylify verwendet eine <b>zweischichtige</b> Versionierung. <b>Hauptversionen sind im Pfad eingebettet</b> ({v1}, {v2}) — brechende Änderungen erscheinen nur in einer neuen Hauptversion. Kleine, <b>abwärtskompatible</b> Änderungen innerhalb einer Hauptversion werden über den Datums-Header {ver} fixiert (das Stripe-Modell).",
    "as.konv.yolBaslik": "Pfad (Hauptversion)",
    "as.konv.yolAciklama": "Für brechende Änderungen. Du siehst die Version ausdrücklich in der URL.",
    "as.konv.baslikBaslik": "Header (Datums-Pin, Minor)",
    "as.konv.baslikAciklama": "Friert abwärtskompatible Änderungen innerhalb einer Hauptversion ein. Optional.",

    "as.gunluk.baslik": "Änderungsprotokoll",
    "as.gunluk.tumu": "Alle",
    "as.gunluk.bosTur": "Keine Einträge dieses Typs.",

    "as.tur.yeni": "Neue Funktion",
    "as.tur.iyilestirme": "Verbesserung",
    "as.tur.duzeltme": "Fehlerbehebung",
    "as.tur.kirici": "Brechende Änderung",
    "as.tur.kaldirma": "Verfall",

    "as.g.2026-06-15.baslik": "v2-Beta veröffentlicht — angereicherte Risikoantwort",
    "as.g.2026-06-15.aciklama":
      "Ein strukturiertes `risk`-Objekt wurde zu den Antworten von /api/v2/passive und /api/v2/verify hinzugefügt: `risk.score`, `risk.level` (low/medium/high) und `risk.reasons[]`. Das flache `score`-Feld aus v1 bleibt aus Kompatibilitätsgründen erhalten.",
    "as.g.2026-05-20.baslik": "JA4-Fingerabdruck-Feld hinzugefügt",
    "as.g.2026-05-20.aciklama":
      "Der JA4/JA4H-TLS-Fingerabdruck wurde in den verify- und passive-Ereignisdatensätzen sichtbar gemacht. Die `bot.blocked`-Webhook-Nutzlast enthält jetzt ein `ja4`-Feld. Das alte `ja3`-Feld bleibt erhalten; die Migration zu JA4 wird empfohlen.",
    "as.g.2026-04-28.baslik": "Risk-Score zur passive-verify-Antwort hinzugefügt",
    "as.g.2026-04-28.aciklama":
      "/api/v1/passive gibt jetzt bei erfolgreichen Durchläufen im Invisible-Modus ein `score`-Feld zurück (0–1 Verhaltens-Score). Dies ist eine abwärtskompatible Ergänzung; bestehende Clients sind nicht betroffen.",
    "as.g.2026-04-10.baslik": "KI-Agent-Richtlinie in den passive-Ablauf verschoben",
    "as.g.2026-04-10.aciklama":
      "Website-Betreiber-Richtlinien für bekannte KI-Crawler (GPTBot, ClaudeBot, PerplexityBot usw.) werden jetzt auch im Invisible-Modus durchgesetzt. `reason: ai_policy` wurde als neuer Fehlergrund hinzugefügt.",
    "as.g.2026-03-15.baslik": "Kontingent-Warnheader standardisiert",
    "as.g.2026-03-15.aciklama":
      "Bei Annäherung an das Monatskontingent wird ein `X-Veylify-Quota: warning`-Header zurückgegeben, bei Überschreitung `overage` oder `exceeded`. Der challenge-Antwort wurde ein optionales `quotaWarning`-Objekt hinzugefügt.",
    "as.g.2026-02-02.baslik": "Nonce-Replay-Fenster behoben",
    "as.g.2026-02-02.aciklama":
      "Eine Race Condition, die selten dazu führte, dass dieselbe Nonce an der TTL-Grenze (während die Challenge ablief) zweimal akzeptiert wurde, wurde behoben. Bei Replay-Erkennung wird `reason: replay` jetzt deterministisch zurückgegeben.",
    "as.g.2026-01-01.baslik": "Datumsbasierte Versionsfixierung (Veylify-Version)",
    "as.g.2026-01-01.aciklama":
      "Clients können sich jetzt mit dem Header `Veylify-Version: 2026-01-01` auf ein Datum fixieren. Ohne den Header wird die Standardversion deines Kontos verwendet. So kannst du kleine Änderungen innerhalb einer Hauptversion (/v1) steuern.",
    "as.g.2025-12-10.baslik": "Invisible-Modus-Endpunkt (passive)",
    "as.g.2025-12-10.aciklama":
      "/api/v1/passive wurde hinzugefügt: Es entscheidet anhand von Verhaltenssignalen + der Regel-Engine, ohne eine Challenge anzuzeigen. Veylifys Entsprechung zum reibungslosen Ablauf von reCAPTCHA v3 / Turnstile. Gibt `passed`, `token`, `reason` zurück.",
    "as.g.2025-11-05.baslik": "appliedRules zur verify-Antwort hinzugefügt",
    "as.g.2025-11-05.aciklama":
      "Die Erfolgsantwort von /api/v1/verify gibt jetzt die auf die Anfrage angewandten Regelnamen in einem `appliedRules[]`-Array zurück. Eine abwärtskompatible Ergänzung für Debugging und Auditing.",
    "as.g.2025-10-14.baslik": "siteverify-Fehlerformat auf ein error-codes-Array umgestellt",
    "as.g.2025-10-14.aciklama":
      "Zur Kompatibilität mit reCAPTCHA/Turnstile geben /api/v1/siteverify-Fehler jetzt `error-codes: string[]` statt eines einzelnen `error`-Strings zurück (z. B. `invalid-input-secret`, `site-not-verified`). Aktualisiere deine serverseitigen Integrationen.",
    "as.g.2025-09-20.baslik": "Alter /v1/check-Endpunkt als veraltet markiert",
    "as.g.2025-09-20.aciklama":
      "Der einstufige `/api/v1/check`-Endpunkt wurde zugunsten des zweiphasigen verify + siteverify-Ablaufs als veraltet markiert (Sunset: 2026-03-31). Begründung: Die Validierung signierter Token war auf der Client-Seite nicht vertrauenswürdig.",
    "as.g.2025-09-01.baslik": "v1 erreichte die allgemeine Verfügbarkeit (GA)",
    "as.g.2025-09-01.aciklama":
      "Die Endpunkte challenge / verify / siteverify wurden als stabil veröffentlicht. Ghost-Font-Challenge-Generierung, Validierung signierter Token und serverseitige Bestätigung wurden erstmals produktionsreif.",

    "as.matris.baslik": "Endpunkt-Versionsmatrix",
    "as.matris.giris":
      "Alle öffentlichen Endpunkte werden unter {url} ausgeliefert. Die untenstehenden Endpunkte spiegeln Veylifys reale API-Oberfläche wider.",
    "as.matris.thEndpoint": "Endpunkt",
    "as.matris.thDurum": "Status",

    "as.ep.challenge": "Neue Ghost-Font-Challenge erzeugen (vom Widget aufgerufen)",
    "as.ep.passive": "Invisible-Modus: ohne Challenge verifizieren",
    "as.ep.verify": "Challenge-Antwort + Verhalten + Nonce verifizieren",
    "as.ep.siteverify": "Serverseitige Token-Bestätigung (mit Secret)",
    "as.ep.check": "Einstufige Verifizierung (veraltet)",

    "as.mat.var": "Vorhanden",
    "as.mat.beta": "Beta",
    "as.mat.planlanan": "Geplant",
    "as.mat.degisti": "Geändert",
    "as.mat.kaldirildi": "Entfernt",
    "as.mat.yok": "Keine",

    "as.kald.baslik": "Verfallshinweise",
    "as.kald.sunset": "Sunset: {tarih}",
    "as.kald.uyari":
      "Der einstufige <code>/check</code>-Endpunkt wurde zugunsten des sicheren zweiphasigen <code>verify</code> + <code>siteverify</code>-Ablaufs entfernt. Da die Validierung signierter Token auf der Client-Seite nicht vertrauenswürdig ist, wurde die serverseitige Bestätigung obligatorisch. Folge dem Migrationsleitfaden unten.",
    "as.kald.gocBaslik": "Migrationsleitfaden — vorher / nachher",
    "as.kald.once": "Vorher (entfernt)",
    "as.kald.sonra": "Nachher (empfohlen)",
    "as.kald.politikaBaslik": "Verfallsrichtlinie",
    "as.kald.politika":
      "Für jeden veralteten Endpunkt/jedes veraltete Feld bieten wir <b>mindestens ein 6-monatiges Sunset-Fenster</b>. Eine Entfernung wird zuerst auf dieser Seite und im <code>Sunset</code>-Antwortheader angekündigt; anschließend erscheint eine Warnung in deinem Konto-Panel. Brechende Änderungen erscheinen nur in einer neuen Hauptversion (z. B. /v2).",

    "as.diff.baslik": "Was sich geändert hat — v1 → v2 (Beta) diff",
    "as.diff.giris":
      "Die Antwortform von <code>POST /passive</code> wurde in v2 mit einem strukturierten <code>risk</code>-Objekt und einem <code>ja4</code>-Fingerabdruck angereichert. Die v1-Felder (<code>score</code>) bleiben aus Kompatibilitätsgründen erhalten — die grünen Zeilen sind die hinzugefügten Felder.",
    "as.diff.mevcut": "aktuell",
    "as.diff.eklenen": "Beta — hinzugefügte Felder",
    "as.diff.ozet.koru": "score — flaches Feld erhalten",

    "as.pin.baslik": "Versionsfixierung (Version-Pinning)",
    "as.pin.yolBaslik": "Über Pfad fixieren (Major)",
    "as.pin.yolEtiket": "Pfadbasiert",
    "as.pin.baslikBaslik": "Über Header fixieren (Datum)",
    "as.pin.ilke1.baslik": "Abwärtskompatibilitätsgarantie",
    "as.pin.ilke1.aciklama":
      "Innerhalb einer Hauptversion können neue Felder hinzugefügt werden; bestehende Felder werden nie entfernt oder umbenannt.",
    "as.pin.ilke2.baslik": "6-monatiges Sunset",
    "as.pin.ilke2.aciklama":
      "Veraltete Endpunkte/Felder funktionieren mindestens 6 Monate weiter; angekündigt über den Sunset-Header.",
    "as.pin.ilke3.baslik": "Standardversion",
    "as.pin.ilke3.aciklama":
      "Wenn du den Header nicht sendest, wird die im Panel eingestellte Standardversion deines Kontos verwendet. Neue Konten werden auf die neueste stabile Version festgelegt.",

    "as.durustluk":
      "Die Daten und Änderungsprotokoll-Einträge auf dieser Seite spiegeln die Entwicklung der Veylify-API <b>repräsentativ</b> wider. Die Endpunktmatrix und die Codebeispiele sind hingegen an den <b>echten</b> öffentlichen Endpunkten des Produkts (challenge / passive / verify / siteverify) und deren tatsächlichen Antwortfeldern ausgerichtet.",
  },

  fr: {
    "as.giris.baslik": "Suivez les versions d'API, les changements et les chemins de migration au même endroit.",
    "as.giris.aciklama":
      "La politique de versions de l'API Veylify, le journal des modifications complet, la matrice de versions par point de terminaison et les avis d'obsolescence. Tout ce dont vous avez besoin pour maintenir votre intégration à jour, ici même.",

    "as.stat.guncel": "Version stable actuelle",
    "as.stat.beta": "Bêta (accès anticipé)",
    "as.stat.yeni": "Nouvelles fonctionnalités (journal)",
    "as.stat.kirici": "Ruptures / retraits",

    "as.surum.v1.etiket": "Stable (Disponibilité générale)",
    "as.surum.v1.aciklama":
      "Version prête pour la production, prise en charge à long terme. Le flux widget → challenge/verify et la confirmation siteverify côté serveur sont livrés dans cette version. Toutes les améliorations non cassantes sont ajoutées de manière rétrocompatible.",
    "as.surum.v2.etiket": "Bêta — non recommandée en production",
    "as.surum.v2.aciklama":
      "Des signaux de risque enrichis (score de risque, empreinte JA4, classe d'agent IA) sont renvoyés comme champs de premier ordre dans le corps de la réponse. Les noms et la forme des champs peuvent changer avant la GA. Activés par point de terminaison pour l'accès anticipé.",

    "as.durum.kararli": "Stable",
    "as.durum.beta": "Bêta",
    "as.durum.kaldirildi": "Retirée",
    "as.rozet.onerilen": "Recommandée",

    "as.gb.baslik": "Aperçu des versions",
    "as.gb.tabanUrl": "URL de base",
    "as.gb.yayinTarihi": "Date de sortie",
    "as.toast.baslik": "URL de base copiée",

    "as.gauge.saglik": "Score de stabilité",
    "as.gauge.benimseme": "Score d'adoption",
    "as.gauge.istekPayi": "Part des requêtes (24 h)",
    "as.gauge.v1Not": "La majeure partie du trafic de production reste sur v1 ; entièrement pris en charge.",
    "as.gauge.v2Not": "Les premiers adoptants testent la bêta v2 ; rétrocompatible.",

    "as.kullanim.baslik": "Utilisation des versions & charge des endpoints",
    "as.kullanim.payBaslik": "Part des requêtes par version",
    "as.kullanim.payNot": "Part de toutes les requêtes de vérification par version sur les dernières 24 h.",
    "as.kullanim.hacimBaslik": "Volume d'appels par endpoint",
    "as.kullanim.hacimBirim": "k appels / 24 h",
    "as.kullanim.efsaneKararli": "Stable",
    "as.kullanim.efsaneDegisti": "Modifié en v2",
    "as.kullanim.efsaneKaldirildi": "Retiré",

    "as.kald.zamanBaslik": "Calendrier de dépréciation",
    "as.kald.asama.duyuru": "Annoncé",
    "as.kald.asama.sunset": "Sunset",
    "as.kald.asama.kaldirildi": "Retiré",

    "as.konv.baslik": "Convention de versionnage",
    "as.konv.giris":
      "Veylify utilise un versionnage <b>à deux couches</b>. <b>Les versions majeures sont intégrées au chemin</b> ({v1}, {v2}) — les changements cassants ne sortent que dans une nouvelle version majeure. Les petits changements <b>rétrocompatibles</b> au sein d'une version majeure sont épinglés via l'en-tête de date {ver} (le modèle Stripe).",
    "as.konv.yolBaslik": "Chemin (version majeure)",
    "as.konv.yolAciklama": "Pour les changements cassants. Vous voyez la version explicitement dans l'URL.",
    "as.konv.baslikBaslik": "En-tête (épingle de date, mineure)",
    "as.konv.baslikAciklama": "Fige les changements rétrocompatibles au sein d'une version majeure. Optionnel.",

    "as.gunluk.baslik": "Journal des modifications",
    "as.gunluk.tumu": "Tous",
    "as.gunluk.bosTur": "Aucune entrée de ce type.",

    "as.tur.yeni": "Nouvelle fonctionnalité",
    "as.tur.iyilestirme": "Amélioration",
    "as.tur.duzeltme": "Correction",
    "as.tur.kirici": "Changement cassant",
    "as.tur.kaldirma": "Obsolescence",

    "as.g.2026-06-15.baslik": "Bêta v2 publiée — réponse de risque enrichie",
    "as.g.2026-06-15.aciklama":
      "Un objet `risk` structuré a été ajouté aux réponses de /api/v2/passive et /api/v2/verify : `risk.score`, `risk.level` (low/medium/high) et `risk.reasons[]`. Le champ plat `score` de la v1 est conservé pour la rétrocompatibilité.",
    "as.g.2026-05-20.baslik": "Champ d'empreinte JA4 ajouté",
    "as.g.2026-05-20.aciklama":
      "L'empreinte TLS JA4/JA4H a été exposée dans les enregistrements d'événements verify et passive. La charge utile du webhook `bot.blocked` inclut désormais un champ `ja4`. L'ancien champ `ja3` est conservé ; la migration vers JA4 est recommandée.",
    "as.g.2026-04-28.baslik": "Score de risque ajouté à la réponse passive-verify",
    "as.g.2026-04-28.aciklama":
      "/api/v1/passive renvoie désormais un champ `score` (score comportemental de 0 à 1) lors des passages réussis en mode invisible. Il s'agit d'un ajout rétrocompatible ; les clients existants ne sont pas affectés.",
    "as.g.2026-04-10.baslik": "Politique d'agent IA déplacée vers le flux passive",
    "as.g.2026-04-10.aciklama":
      "Les politiques des propriétaires de sites pour les robots d'IA connus (GPTBot, ClaudeBot, PerplexityBot, etc.) sont désormais appliquées aussi en mode invisible. `reason: ai_policy` a été ajouté comme nouveau motif d'échec.",
    "as.g.2026-03-15.baslik": "En-tête d'avertissement de quota standardisé",
    "as.g.2026-03-15.aciklama":
      "À l'approche du quota mensuel, un en-tête `X-Veylify-Quota: warning` est renvoyé, et `overage` ou `exceeded` lorsqu'il est dépassé. Un objet `quotaWarning` optionnel a été ajouté à la réponse challenge.",
    "as.g.2026-02-02.baslik": "Fenêtre de rejeu de nonce corrigée",
    "as.g.2026-02-02.aciklama":
      "Une condition de concurrence qui permettait rarement d'accepter deux fois le même nonce à la limite du TTL (à l'expiration du challenge) a été résolue. À la détection d'un rejeu, `reason: replay` est désormais renvoyé de manière déterministe.",
    "as.g.2026-01-01.baslik": "Épinglage de version par date (Veylify-Version)",
    "as.g.2026-01-01.aciklama":
      "Les clients peuvent désormais s'épingler à une date avec l'en-tête `Veylify-Version: 2026-01-01`. Sans cet en-tête, la version par défaut de votre compte est utilisée. Cela vous permet de contrôler les changements mineurs au sein d'une version majeure (/v1).",
    "as.g.2025-12-10.baslik": "Point de terminaison mode invisible (passive)",
    "as.g.2025-12-10.aciklama":
      "/api/v1/passive a été ajouté : il décide à partir de signaux comportementaux + le moteur de règles sans afficher de challenge. L'équivalent Veylify du flux sans friction de reCAPTCHA v3 / Turnstile. Renvoie `passed`, `token`, `reason`.",
    "as.g.2025-11-05.baslik": "appliedRules ajouté à la réponse verify",
    "as.g.2025-11-05.aciklama":
      "La réponse de succès de /api/v1/verify renvoie désormais les noms des règles appliquées à la requête dans un tableau `appliedRules[]`. Un ajout rétrocompatible pour le débogage et l'audit.",
    "as.g.2025-10-14.baslik": "Format d'erreur siteverify passé à un tableau error-codes",
    "as.g.2025-10-14.aciklama":
      "Pour la compatibilité avec reCAPTCHA/Turnstile, les erreurs de /api/v1/siteverify renvoient désormais `error-codes: string[]` au lieu d'une chaîne `error` unique (par ex. `invalid-input-secret`, `site-not-verified`). Mettez à jour vos intégrations côté serveur.",
    "as.g.2025-09-20.baslik": "Ancien point de terminaison /v1/check rendu obsolète",
    "as.g.2025-09-20.aciklama":
      "Le point de terminaison en une étape `/api/v1/check` a été rendu obsolète au profit du flux en deux phases verify + siteverify (sunset : 2026-03-31). Justification : la validation des jetons signés n'était pas fiable côté client.",
    "as.g.2025-09-01.baslik": "v1 a atteint la disponibilité générale (GA)",
    "as.g.2025-09-01.aciklama":
      "Les points de terminaison challenge / verify / siteverify ont été publiés comme stables. La génération de challenges ghost-font, la validation des jetons signés et la confirmation côté serveur sont devenues prêtes pour la production pour la première fois.",

    "as.matris.baslik": "Matrice de versions par point de terminaison",
    "as.matris.giris":
      "Tous les points de terminaison publics sont livrés sous {url}. Les points de terminaison ci-dessous reflètent la surface d'API réelle de Veylify.",
    "as.matris.thEndpoint": "Point de terminaison",
    "as.matris.thDurum": "Statut",

    "as.ep.challenge": "Générer un nouveau challenge ghost-font (appelé par le widget)",
    "as.ep.passive": "Mode invisible : vérifier sans afficher de challenge",
    "as.ep.verify": "Vérifier la réponse au challenge + comportement + nonce",
    "as.ep.siteverify": "Confirmation de jeton côté serveur (avec secret)",
    "as.ep.check": "Vérification en une étape (obsolète)",

    "as.mat.var": "Présent",
    "as.mat.beta": "Bêta",
    "as.mat.planlanan": "Prévu",
    "as.mat.degisti": "Modifié",
    "as.mat.kaldirildi": "Retiré",
    "as.mat.yok": "Aucun",

    "as.kald.baslik": "Avis d'obsolescence",
    "as.kald.sunset": "Sunset : {tarih}",
    "as.kald.uyari":
      "Le point de terminaison en une étape <code>/check</code> a été retiré au profit du flux sécurisé en deux phases <code>verify</code> + <code>siteverify</code>. La validation des jetons signés n'étant pas fiable côté client, la confirmation côté serveur est devenue obligatoire. Suivez le guide de migration ci-dessous.",
    "as.kald.gocBaslik": "Guide de migration — avant / après",
    "as.kald.once": "Avant (retiré)",
    "as.kald.sonra": "Après (recommandé)",
    "as.kald.politikaBaslik": "Politique d'obsolescence",
    "as.kald.politika":
      "Pour chaque point de terminaison/champ obsolète, nous offrons <b>une fenêtre de sunset d'au moins 6 mois</b>. Un retrait est d'abord annoncé sur cette page et dans l'en-tête de réponse <code>Sunset</code> ; puis un avertissement apparaît dans le panneau de votre compte. Les changements cassants ne sortent que dans une nouvelle version majeure (par ex. /v2).",

    "as.diff.baslik": "Ce qui a changé — diff v1 → v2 (bêta)",
    "as.diff.giris":
      "La forme de la réponse <code>POST /passive</code> a été enrichie en v2 avec un objet <code>risk</code> structuré et une empreinte <code>ja4</code>. Les champs v1 (<code>score</code>) sont conservés pour la rétrocompatibilité — les lignes vertes sont les champs ajoutés.",
    "as.diff.mevcut": "actuel",
    "as.diff.eklenen": "bêta — champs ajoutés",
    "as.diff.ozet.koru": "score — champ plat conservé",

    "as.pin.baslik": "Épinglage de version (version pinning)",
    "as.pin.yolBaslik": "Épingler par chemin (majeure)",
    "as.pin.yolEtiket": "Basé sur le chemin",
    "as.pin.baslikBaslik": "Épingler par en-tête (date)",
    "as.pin.ilke1.baslik": "Garantie de rétrocompatibilité",
    "as.pin.ilke1.aciklama":
      "De nouveaux champs peuvent être ajoutés au sein d'une version majeure ; les champs existants ne sont jamais supprimés ni renommés.",
    "as.pin.ilke2.baslik": "Sunset de 6 mois",
    "as.pin.ilke2.aciklama":
      "Les points de terminaison/champs obsolètes continuent de fonctionner pendant au moins 6 mois ; annoncés via l'en-tête Sunset.",
    "as.pin.ilke3.baslik": "Version par défaut",
    "as.pin.ilke3.aciklama":
      "Si vous n'envoyez pas l'en-tête, la version par défaut de votre compte réglée dans le panneau est utilisée. Les nouveaux comptes sont verrouillés sur la dernière version stable.",

    "as.durustluk":
      "Les dates et les entrées du journal des modifications de cette page reflètent l'évolution de l'API Veylify de manière <b>représentative</b>. La matrice de points de terminaison et les exemples de code sont en revanche alignés sur les <b>vrais</b> points de terminaison publics du produit (challenge / passive / verify / siteverify) et sur leurs champs de réponse réels.",
  },

  es: {
    "as.giris.baslik": "Rastrea las versiones de la API, los cambios y las rutas de migración en un solo lugar.",
    "as.giris.aciklama":
      "La política de versiones de la API de Veylify, el registro de cambios completo, la matriz de versiones por endpoint y los avisos de obsolescencia. Todo lo que necesitas para mantener tu integración al día, aquí mismo.",

    "as.stat.guncel": "Versión estable actual",
    "as.stat.beta": "Beta (acceso anticipado)",
    "as.stat.yeni": "Nuevas funciones (registro)",
    "as.stat.kirici": "Rupturas / retiradas",

    "as.surum.v1.etiket": "Estable (Disponibilidad general)",
    "as.surum.v1.aciklama":
      "Versión lista para producción, con soporte a largo plazo. El flujo widget → challenge/verify y la confirmación siteverify del lado del servidor se publican en esta versión. Todas las mejoras no disruptivas se añaden de forma retrocompatible.",
    "as.surum.v2.etiket": "Beta — no recomendada en producción",
    "as.surum.v2.aciklama":
      "Señales de riesgo enriquecidas (puntuación de riesgo, huella JA4, clase de agente de IA) se devuelven como campos de primera clase en el cuerpo de la respuesta. Los nombres y la forma de los campos pueden cambiar antes de la GA. Se habilitan por endpoint para el acceso anticipado.",

    "as.durum.kararli": "Estable",
    "as.durum.beta": "Beta",
    "as.durum.kaldirildi": "Retirada",
    "as.rozet.onerilen": "Recomendada",

    "as.gb.baslik": "Resumen de versiones",
    "as.gb.tabanUrl": "URL base",
    "as.gb.yayinTarihi": "Fecha de lanzamiento",
    "as.toast.baslik": "URL base copiada",

    "as.gauge.saglik": "Puntuación de estabilidad",
    "as.gauge.benimseme": "Puntuación de adopción",
    "as.gauge.istekPayi": "Cuota de solicitudes (24 h)",
    "as.gauge.v1Not": "La mayor parte del tráfico de producción sigue en v1; totalmente compatible.",
    "as.gauge.v2Not": "Los primeros usuarios prueban la beta v2; retrocompatible.",

    "as.kullanim.baslik": "Uso de versiones y carga de endpoints",
    "as.kullanim.payBaslik": "Cuota de solicitudes por versión",
    "as.kullanim.payNot": "Cuota de todas las solicitudes de verificación por versión en las últimas 24 h.",
    "as.kullanim.hacimBaslik": "Volumen de llamadas por endpoint",
    "as.kullanim.hacimBirim": "k llamadas / 24 h",
    "as.kullanim.efsaneKararli": "Estable",
    "as.kullanim.efsaneDegisti": "Cambiado en v2",
    "as.kullanim.efsaneKaldirildi": "Retirado",

    "as.kald.zamanBaslik": "Cronología de retirada",
    "as.kald.asama.duyuru": "Anunciado",
    "as.kald.asama.sunset": "Sunset",
    "as.kald.asama.kaldirildi": "Retirado",

    "as.konv.baslik": "Convención de versionado",
    "as.konv.giris":
      "Veylify usa un versionado <b>de dos capas</b>. <b>Las versiones mayores están incrustadas en la ruta</b> ({v1}, {v2}) — los cambios disruptivos solo se publican en una nueva versión mayor. Los cambios pequeños y <b>retrocompatibles</b> dentro de una versión mayor se fijan con la cabecera de fecha {ver} (el modelo de Stripe).",
    "as.konv.yolBaslik": "Ruta (versión mayor)",
    "as.konv.yolAciklama": "Para cambios disruptivos. Ves la versión explícitamente en la URL.",
    "as.konv.baslikBaslik": "Cabecera (fijación por fecha, menor)",
    "as.konv.baslikAciklama": "Congela los cambios retrocompatibles dentro de una versión mayor. Opcional.",

    "as.gunluk.baslik": "Registro de cambios",
    "as.gunluk.tumu": "Todos",
    "as.gunluk.bosTur": "No hay entradas de este tipo.",

    "as.tur.yeni": "Nueva función",
    "as.tur.iyilestirme": "Mejora",
    "as.tur.duzeltme": "Corrección",
    "as.tur.kirici": "Cambio disruptivo",
    "as.tur.kaldirma": "Obsolescencia",

    "as.g.2026-06-15.baslik": "Beta v2 publicada — respuesta de riesgo enriquecida",
    "as.g.2026-06-15.aciklama":
      "Se añadió un objeto `risk` estructurado a las respuestas de /api/v2/passive y /api/v2/verify: `risk.score`, `risk.level` (low/medium/high) y `risk.reasons[]`. El campo plano `score` de la v1 se conserva por retrocompatibilidad.",
    "as.g.2026-05-20.baslik": "Campo de huella JA4 añadido",
    "as.g.2026-05-20.aciklama":
      "La huella TLS JA4/JA4H se expuso en los registros de eventos verify y passive. La carga del webhook `bot.blocked` ahora incluye un campo `ja4`. El campo antiguo `ja3` se conserva; se recomienda migrar a JA4.",
    "as.g.2026-04-28.baslik": "Puntuación de riesgo añadida a la respuesta de passive-verify",
    "as.g.2026-04-28.aciklama":
      "/api/v1/passive ahora devuelve un campo `score` (puntuación de comportamiento de 0 a 1) en los pasos exitosos de modo invisible. Es una adición retrocompatible; los clientes existentes no se ven afectados.",
    "as.g.2026-04-10.baslik": "Política de agentes de IA trasladada al flujo passive",
    "as.g.2026-04-10.aciklama":
      "Las políticas de los propietarios de sitios para rastreadores de IA conocidos (GPTBot, ClaudeBot, PerplexityBot, etc.) ahora se aplican también en modo invisible. `reason: ai_policy` se añadió como nuevo motivo de fallo.",
    "as.g.2026-03-15.baslik": "Cabecera de aviso de cuota estandarizada",
    "as.g.2026-03-15.aciklama":
      "Al acercarse a la cuota mensual se devuelve una cabecera `X-Veylify-Quota: warning`, y `overage` o `exceeded` cuando se supera. Se añadió un objeto `quotaWarning` opcional a la respuesta challenge.",
    "as.g.2026-02-02.baslik": "Ventana de repetición de nonce corregida",
    "as.g.2026-02-02.aciklama":
      "Se resolvió una condición de carrera que raramente permitía aceptar el mismo nonce dos veces en el límite del TTL (al expirar el challenge). En la detección de repetición, `reason: replay` ahora se devuelve de forma determinista.",
    "as.g.2026-01-01.baslik": "Fijación de versión por fecha (Veylify-Version)",
    "as.g.2026-01-01.aciklama":
      "Los clientes ahora pueden fijarse a una fecha con la cabecera `Veylify-Version: 2026-01-01`. Sin la cabecera, se usa la versión predeterminada de tu cuenta. Esto te permite controlar los cambios menores dentro de una versión mayor (/v1).",
    "as.g.2025-12-10.baslik": "Endpoint de modo invisible (passive)",
    "as.g.2025-12-10.aciklama":
      "Se añadió /api/v1/passive: decide usando señales de comportamiento + el motor de reglas sin mostrar un challenge. El equivalente de Veylify al flujo sin fricción de reCAPTCHA v3 / Turnstile. Devuelve `passed`, `token`, `reason`.",
    "as.g.2025-11-05.baslik": "appliedRules añadido a la respuesta verify",
    "as.g.2025-11-05.aciklama":
      "La respuesta de éxito de /api/v1/verify ahora devuelve los nombres de las reglas aplicadas a la solicitud en un array `appliedRules[]`. Una adición retrocompatible para depuración y auditoría.",
    "as.g.2025-10-14.baslik": "Formato de error de siteverify cambiado a un array error-codes",
    "as.g.2025-10-14.aciklama":
      "Por compatibilidad con reCAPTCHA/Turnstile, los errores de /api/v1/siteverify ahora devuelven `error-codes: string[]` en lugar de una única cadena `error` (p. ej. `invalid-input-secret`, `site-not-verified`). Actualiza tus integraciones del lado del servidor.",
    "as.g.2025-09-20.baslik": "Antiguo endpoint /v1/check declarado obsoleto",
    "as.g.2025-09-20.aciklama":
      "El endpoint de un solo paso `/api/v1/check` se declaró obsoleto en favor del flujo de dos fases verify + siteverify (sunset: 2026-03-31). Justificación: la validación de tokens firmados no era fiable en el lado del cliente.",
    "as.g.2025-09-01.baslik": "v1 alcanzó la disponibilidad general (GA)",
    "as.g.2025-09-01.aciklama":
      "Los endpoints challenge / verify / siteverify se publicaron como estables. La generación de challenges ghost-font, la validación de tokens firmados y la confirmación del lado del servidor estuvieron listas para producción por primera vez.",

    "as.matris.baslik": "Matriz de versiones por endpoint",
    "as.matris.giris":
      "Todos los endpoints públicos se publican bajo {url}. Los endpoints siguientes reflejan la superficie de API real de Veylify.",
    "as.matris.thEndpoint": "Endpoint",
    "as.matris.thDurum": "Estado",

    "as.ep.challenge": "Generar un nuevo challenge ghost-font (llamado por el widget)",
    "as.ep.passive": "Modo invisible: verificar sin mostrar un challenge",
    "as.ep.verify": "Verificar respuesta al challenge + comportamiento + nonce",
    "as.ep.siteverify": "Confirmación de token del lado del servidor (con secret)",
    "as.ep.check": "Verificación en un solo paso (obsoleto)",

    "as.mat.var": "Presente",
    "as.mat.beta": "Beta",
    "as.mat.planlanan": "Planificado",
    "as.mat.degisti": "Cambiado",
    "as.mat.kaldirildi": "Retirado",
    "as.mat.yok": "Ninguno",

    "as.kald.baslik": "Avisos de obsolescencia",
    "as.kald.sunset": "Sunset: {tarih}",
    "as.kald.uyari":
      "El endpoint de un solo paso <code>/check</code> se retiró en favor del flujo seguro de dos fases <code>verify</code> + <code>siteverify</code>. Dado que la validación de tokens firmados no es fiable en el lado del cliente, la confirmación del lado del servidor se volvió obligatoria. Sigue la guía de migración a continuación.",
    "as.kald.gocBaslik": "Guía de migración — antes / después",
    "as.kald.once": "Antes (retirado)",
    "as.kald.sonra": "Después (recomendado)",
    "as.kald.politikaBaslik": "Política de obsolescencia",
    "as.kald.politika":
      "Para cada endpoint/campo obsoleto ofrecemos <b>al menos una ventana de sunset de 6 meses</b>. Una retirada se anuncia primero en esta página y en la cabecera de respuesta <code>Sunset</code>; luego aparece un aviso en el panel de tu cuenta. Los cambios disruptivos solo se publican en una nueva versión mayor (p. ej. /v2).",

    "as.diff.baslik": "Qué cambió — diff v1 → v2 (beta)",
    "as.diff.giris":
      "La forma de la respuesta <code>POST /passive</code> se enriqueció en la v2 con un objeto <code>risk</code> estructurado y una huella <code>ja4</code>. Los campos v1 (<code>score</code>) se conservan por retrocompatibilidad — las líneas verdes son los campos añadidos.",
    "as.diff.mevcut": "actual",
    "as.diff.eklenen": "beta — campos añadidos",
    "as.diff.ozet.koru": "score — campo plano conservado",

    "as.pin.baslik": "Fijación de versión (version pinning)",
    "as.pin.yolBaslik": "Fijar por ruta (mayor)",
    "as.pin.yolEtiket": "Basado en ruta",
    "as.pin.baslikBaslik": "Fijar por cabecera (fecha)",
    "as.pin.ilke1.baslik": "Garantía de retrocompatibilidad",
    "as.pin.ilke1.aciklama":
      "Dentro de una versión mayor pueden añadirse nuevos campos; los campos existentes nunca se eliminan ni se renombran.",
    "as.pin.ilke2.baslik": "Sunset de 6 meses",
    "as.pin.ilke2.aciklama":
      "Los endpoints/campos obsoletos siguen funcionando durante al menos 6 meses; se anuncian mediante la cabecera Sunset.",
    "as.pin.ilke3.baslik": "Versión predeterminada",
    "as.pin.ilke3.aciklama":
      "Si no envías la cabecera, se usa la versión predeterminada de tu cuenta configurada en el panel. Las cuentas nuevas se bloquean en la última versión estable.",

    "as.durustluk":
      "Las fechas y las entradas del registro de cambios de esta página reflejan la evolución de la API de Veylify de forma <b>representativa</b>. La matriz de endpoints y los ejemplos de código, en cambio, están alineados con los endpoints públicos <b>reales</b> del producto (challenge / passive / verify / siteverify) y sus campos de respuesta reales.",
  },
};

/** Anahtar → çeviri; bulunamazsa TR'ye, o da yoksa anahtarın kendisine düşer. */
export function apiSurumCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
