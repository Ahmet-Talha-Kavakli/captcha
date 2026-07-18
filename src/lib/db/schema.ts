/**
 * Specter — Veri Modeli (v2, derin)
 * ==================================
 * Gerçek bir AI-bot koruma platformunun izlediği tüm varlıklar. JSON DB
 * üzerinde tutulur (db.ts). Postgres'e geçiş kolay olsun diye tablolar
 * net ayrık.
 */

export type Plan = "free" | "pro" | "scale";
export type Role = "owner" | "admin" | "analyst" | "viewer";

/**
 * Bildirim tercihleri: her olay türü için hangi kanallardan haber
 * verileceği. Kanal başına aç/kapat (email / webhook / panel içi).
 */
export type BildirimOlay =
  | "kritik_uyari" // kritik güvenlik uyarısı / olay
  | "ai_ajan" // yeni/anormal AI ajan trafiği tespiti
  | "kota" // kullanım kotası eşiği aşımı
  | "haftalik_ozet" // haftalık koruma özeti
  | "ekip" // ekip üyesi davet/rol değişikliği
  | "fatura"; // ödeme / fatura olayları
export type BildirimKanal = "email" | "webhook" | "panel";
/** olay → kanal → açık/kapalı. Eksik anahtarlar için varsayılan geçerli. */
export type BildirimTercihleri = Partial<Record<BildirimOlay, Partial<Record<BildirimKanal, boolean>>>>;

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  plan: Plan;
  role: Role;
  avatarColor: string;
  createdAt: number;
  lastSeenAt: number;
  /** AI Ajan İstihbaratı: ajan-id → politika ("izin"|"dogrula"|"engelle").
   * Belirtilmeyen ajan için Specter'ın önerilen varsayılanı geçerli. */
  aiPolicies?: Record<string, string>;

  /* --- Hesap tercihleri (opsiyonel — geriye uyumlu) --- */
  /** Çalışma alanı (workspace) adı. Boşsa kullanıcı adı gösterilir. */
  workspaceName?: string;
  /** Tercih edilen dil (tr | en). */
  locale?: string;
  /** Tercih edilen saat dilimi (IANA, örn "Europe/Istanbul"). */
  timezone?: string;
  /** İki-adımlı doğrulama (TOTP) etkin mi. */
  twoFactorEnabled?: boolean;
  /** Şifrenin son değiştirildiği an (epoch ms). */
  passwordChangedAt?: number;
  /** Bildirim tercihleri (olay × kanal matrisi). */
  notificationPrefs?: BildirimTercihleri;
}

/** Bir müşteri sitesi (uygulaması). */
export interface Site {
  id: string;
  ownerId: string;
  name: string;
  domains: string[];
  siteKey: string;
  secretKey: string;
  difficulty: "low" | "medium" | "high";
  /**
   * Challenge türü seçimi. Verilmezse "kod" (mevcut karakter dizisi — geriye
   * uyumlu varsayılan). "rotasyon" her challenge'da tür arasında döner.
   *   kod | sayi | yon | sec | rotasyon
   */
  challengeType?: "kod" | "sayi" | "yon" | "sec" | "rotasyon";
  behaviorThreshold: number;
  invisibleMode: boolean;
  /** Koruma modu: monitor (sadece izle) | challenge | block */
  mode: "monitor" | "challenge" | "block";
  /** Rate limit: bir IP'nin dakikada yapabileceği azami istek sayısı.
   * 0 / tanımsız → rate limit kapalı (opsiyonel — geriye uyumlu). */
  rateLimit?: number;
  createdAt: number;
  active: boolean;
  /* --- Domain sahiplik doğrulaması --- */
  /** Alan adı sahipliği doğrulandı mı? Doğrulanana kadar koruma pasiftir. */
  verified: boolean;
  /** Kullanıcının siteye yerleştireceği benzersiz kanıt jetonu (örn "veylify-verify=xxxx"). */
  verifyToken: string;
  /** Son seçilen/başarılı doğrulama yöntemi. */
  verifyMethod: "dns" | "meta" | "file" | null;
  /** Doğrulandığı an (epoch ms) — doğrulanmadıysa null. */
  verifiedAt: number | null;
  /** Kaç kez "Doğrula" denendi (gerçekçi DNS yayılması simülasyonu için). */
  verifyAttempts: number;
}

/* ------------------------------------------------------------------ Bot olayları */

export type BotClass =
  | "human"
  | "good_bot" // Googlebot, Bingbot vb.
  | "automation" // Selenium/Puppeteer/Playwright
  | "scraper" // içerik kazıyıcı
  | "credential_stuffing"
  | "ai_agent" // GPT/Claude ajanı
  | "ddos"
  | "spam";

export type Verdict = "allowed" | "challenged" | "blocked" | "flagged";

/** Tekil bir doğrulama/istek olayı — canlı akışın ve istihbaratın kaynağı. */
export interface BotEvent {
  id: string;
  siteId: string;
  ts: number;
  ip: string;
  country: string; // ISO2
  city?: string;
  asn: string; // "AS15169 Google LLC"
  ua: string;
  path: string;
  botClass: BotClass;
  verdict: Verdict;
  /** 0..1 insanlık skoru (düşük = bot). */
  score: number;
  /** Hangi kurallar tetiklendi. */
  triggeredRules: string[];
  /** Fingerprint hash (cihaz/tarayıcı). */
  fingerprint: string;
  method: string;
  /** Yanıt süresi (ms). */
  latency: number;

  /* --- Derin cihaz parmak izi istihbaratı (opsiyonel — geriye uyumlu) --- */
  /** JA3 TLS parmak izi hash'i (istemci TLS el sıkışma imzası). */
  ja3?: string;
  /** JA4 (yeni nesil TLS parmak izi). */
  ja4?: string;
  /** HTTP protokol sürümü (h2, h3, http/1.1). */
  httpVersion?: string;
  /** Headless tarayıcı tespit edildi mi (Puppeteer/Playwright/Selenium). */
  headless?: boolean;
  /** İstemci tarafı otomasyon sinyali (webdriver, CDP). */
  automationFlags?: string[];
  /** TLS/UA uyumsuzluğu (UA Chrome der ama TLS parmak izi Python). */
  tlsUaUyumsuz?: boolean;
  /** Tespit edilen tarayıcı motoru (Blink/Gecko/WebKit/None). */
  engine?: string;
  /** İstemci ipuçları / header anomali skoru (0..1, yüksek = şüpheli). */
  headerAnomali?: number;
  /** Tespit sinyalleri (insan-okur nedenler). */
  sinyaller?: string[];
  /**
   * Bu olayda GERÇEKTEN tetiklenen savunma katmanları (ghost-font/honeypot/
   * tutarlilik/pow). verify akışı doldurur; Savunma Katmanları paneli bunu
   * çıkarımsal tahmin yerine gerçek sayaç olarak kullanır. Opsiyonel/geriye-uyumlu.
   */
  katmanHitler?: string[];
}

/* ------------------------------------------------------------------ IP itibarı */

export interface IpReputation {
  ip: string;
  country: string;
  asn: string;
  /** 0 (temiz) .. 100 (kötü). */
  threatScore: number;
  category: "clean" | "suspicious" | "malicious" | "tor" | "vpn" | "datacenter";
  firstSeen: number;
  lastSeen: number;
  requests: number;
  blocked: number;
}

/* ------------------------------------------------------------------ Kurallar */

export type RuleAction = "allow" | "challenge" | "block" | "flag";
export type RuleField =
  | "ip" | "country" | "asn" | "ua" | "path" | "score" | "botClass" | "rate"
  /* --- AI-ajan spesifik koşul alanları (v13) --- */
  | "aiAgent" // belirli AI ajanı (gptbot / claudebot / perplexitybot …) — AI_AJANLAR id'si
  | "aiCategory" // AI ajan kategorisi (model_egitimi / canli_getirme / arama_indeksi …)
  | "headless" // headless tarayıcı imzası (true/false)
  | "tlsMismatch" // TLS/UA parmak izi uyumsuzluğu (true/false)
  | "httpVersion"; // HTTP protokol sürümü (h2 / h3 / http/1.1)
export type RuleOp = "eq" | "neq" | "contains" | "gt" | "lt" | "in";

/* --- Gelişmiş kural motoru: VE/VEYA koşul grupları (v18) --- */
/** Tek bir atomik koşul (alan op değer). */
export interface RuleKosul {
  field: RuleField;
  op: RuleOp;
  value: string;
  /** Koşulu tersine çevir (DEĞİL). */
  negate?: boolean;
}
/** Koşul grubu: birden çok koşulu VE/VEYA mantığıyla birleştirir; iç içe olabilir. */
export interface RuleKosulGrup {
  /** "and" = tüm koşullar; "or" = herhangi biri. */
  birlestir: "and" | "or";
  /** Atomik koşullar. */
  kosullar: RuleKosul[];
  /** İç içe alt gruplar (isteğe bağlı — karmaşık mantık için). */
  gruplar?: RuleKosulGrup[];
}

/** Kural sürüm anlık görüntüsü (v19) — geri-alma için tam yapılandırma kopyası. */
export interface RuleVersion {
  /** Sürüm numarası (1'den artan). */
  surum: number;
  /** Bu sürümün alındığı an. */
  ts: number;
  /** İşlemi yapan (kullanıcı adı). */
  actor: string;
  /** Ne değişti (insan-okur özet). */
  ozet: string;
  /** O anki tam kural yapılandırması (geri yüklenebilir alanlar). */
  snapshot: {
    name: string;
    description: string;
    enabled: boolean;
    priority: number;
    field: RuleField;
    op: RuleOp;
    value: string;
    action: RuleAction;
    kosulGrup?: RuleKosulGrup;
  };
}

export interface Rule {
  id: string;
  siteId: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  field: RuleField;
  op: RuleOp;
  value: string;
  action: RuleAction;
  /**
   * Gelişmiş koşul ağacı (v18). Verilirse field/op/value yerine BU değerlendirilir;
   * yoksa (eski kurallar) tekil field/op/value çalışır — geriye tam uyumlu.
   */
  kosulGrup?: RuleKosulGrup;
  /** Kaç kez tetiklendi. */
  hits: number;
  createdAt: number;
  /** Sistem kuralı mı (silinemez). */
  system: boolean;
  /** Sürüm geçmişi (v19) — her değişiklikte snapshot eklenir; geri-alma için. */
  history?: RuleVersion[];
}

/* ------------------------------------------------------------------ Saldırı kampanyaları */

export interface Campaign {
  id: string;
  siteId: string;
  name: string;
  botClass: BotClass;
  status: "active" | "mitigated" | "monitoring";
  startedAt: number;
  peakRps: number;
  totalRequests: number;
  blockedRequests: number;
  topCountries: string[];
  topAsns: string[];
}

/* ------------------------------------------------------------------ Uyarılar / Olay Yönetimi */

export type AlertSeverity = "critical" | "high" | "medium" | "low";
/** Olay yaşam döngüsü durumu. */
export type AlertStatus = "acik" | "inceleniyor" | "cozuldu" | "yoksayildi";
/** Olay önceliği (PagerDuty tarzı). p1 = en yüksek. */
export type AlertPriority = "p1" | "p2" | "p3" | "p4";
/** Olay kategorisi. */
export type AlertCategory = "saldiri" | "anomali" | "politika" | "sistem" | "kota";

/** Bir olayın zaman çizelgesine düşen tekil kayıt (kim, ne zaman, ne yaptı). */
export interface AlertTimelineEntry {
  ts: number;
  /** İşlemi yapan (ekip üyesi adı ya da "Sistem"). */
  actor: string;
  /** Yapılan işlem: "oluşturuldu" | "durum:inceleniyor" | "atandı" | "not" | ... */
  action: string;
  /** Serbest metin açıklama (opsiyonel). */
  note?: string;
}

export interface Alert {
  id: string;
  siteId: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  ts: number;
  read: boolean;
  category: AlertCategory;
  /* --- Olay yönetimi alanları --- */
  /** Olayın yaşam döngüsü durumu. */
  status: AlertStatus;
  /** Atanan ekip üyesinin id'si (yoksa null). */
  assignee: string | null;
  /** Öncelik seviyesi. */
  priority: AlertPriority;
  /** Olayın kaynağı IP (varsa — /panel/tehdit/[ip] ile ilişkili). */
  sourceIp?: string;
  /** İlişkili saldırı kampanyasının id'si (varsa). */
  relatedCampaignId?: string;
  /** Olay geçmişi (kim ne zaman ne yaptı). */
  timeline: AlertTimelineEntry[];
  /** Onaylandığı (acknowledge) an — henüz onaylanmadıysa yok. */
  acknowledgedAt?: number;
  /** Çözüldüğü an — MTTR hesabı için (henüz çözülmediyse yok). */
  resolvedAt?: number;
}

/* ------------------------------------------------------------------ Denetim günlüğü */

/** Denetim kaydı kategorisi (uyum/compliance raporlaması için ayrık). */
export type AuditCategory =
  | "auth" // oturum / giriş / 2FA
  | "site" // site oluştur/sil/mod-değiştir
  | "rule" // kural ekle/güncelle/devre-dışı
  | "team" // üye davet/rol/çıkar
  | "ai-policy" // AI ajan politikası değişikliği
  | "billing" // plan / faturalandırma / kota
  | "token" // API anahtarı oluştur/döndür/iptal
  | "webhook"; // webhook oluştur/test/sil

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  target: string;
  ts: number;
  ip: string;
  meta?: Record<string, string>;
  /* --- Uyum / compliance zenginleştirmesi (opsiyonel — geriye uyumlu) --- */
  /** İşlem kategorisi (filtreleme + kategori dağılımı için). */
  category?: AuditCategory;
  /** Kaydın sıra numarası (değişmezlik zinciri — 1'den artan). */
  seq?: number;
  /** Bu kaydın içerik hash'i (SHA-256, kısaltılmış). */
  hash?: string;
  /** Önceki kaydın hash'i (zincir bütünlüğü — ilk kayıt "genesis"). */
  prevHash?: string;
  /** Kritik/hassas işlem mi (rol değişimi, silme, anahtar döndürme…). */
  critical?: boolean;
  /** Değişen alanın önceki değeri (varsa — denetim izi). */
  onceki?: string;
  /** Değişen alanın yeni değeri (varsa). */
  sonraki?: string;
}

/* ------------------------------------------------------------------ Ekip */

/**
 * İnce izin anahtarları (rol → izin matrisinin sütunları). Roller bu
 * yeteneklerin bir alt kümesini kapsar; özel üyelere ek/eksik izin
 * verilebilsin diye üyede de opsiyonel `permissions` tutulur.
 */
export type TeamCapability =
  | "sites.manage" // Site ekle/çıkar/yapılandır
  | "rules.edit" // Kural oluştur/düzenle/sil
  | "team.manage" // Üye davet/rol değiştir/çıkar
  | "billing.manage" // Plan & faturalandırma
  | "apikeys.manage" // API anahtarı oluştur/döndür
  | "incidents.resolve"; // Olay atama/çözümleme

export interface TeamMember {
  id: string;
  ownerId: string; // hangi hesabın ekibi
  name: string;
  email: string;
  role: Role;
  avatarColor: string;
  status: "active" | "invited" | "suspended";
  lastActive: number;
  /** Üyenin şirketteki görevi/unvanı (örn "Güvenlik Mühendisi"). */
  title?: string;
  /** Rolün ötesinde bu üyeye özel verilmiş ince izinler (varsa). Boşsa rol varsayılanları geçerli. */
  permissions?: TeamCapability[];
  /** İki-adımlı doğrulama (2FA) etkin mi — güvenlik özeti için. */
  mfaEnabled?: boolean;
  /** Davet edildiği an (epoch ms) — status "invited" ise anlamlı. */
  invitedAt?: number;
  /** Daveti gönderen üyenin adı. */
  invitedBy?: string;
  /** Bekleyen davetin son geçerlilik anı (epoch ms). */
  inviteExpiresAt?: number;
}

/* ------------------------------------------------------------------ API anahtarları */

export interface ApiToken {
  id: string;
  ownerId: string;
  name: string;
  prefix: string; // sk_live_xxxx (görünen kısım)
  scopes: string[];
  /** Anahtar ortamı: canlı (production) veya test (sandbox). */
  environment: "live" | "test";
  createdAt: number;
  lastUsed: number | null;
  /** 30 günlük istek sayısı (kullanım göstergesi). */
  requests30d?: number;
  revoked: boolean;
  /* --- Güvenlik & rotasyon (v20) --- */
  /** En son döndürüldüğü an (hiç döndürülmediyse yok → createdAt baz alınır). */
  lastRotatedAt?: number;
  /** Kaç kez döndürüldü. */
  rotationCount?: number;
  /** Sızıntı işareti — bu anahtar herkese açık bir yerde (repo/log) görüldü mü. */
  leaked?: boolean;
  /** Sızıntının tespit edildiği an. */
  leakedAt?: number;
  /** Sızıntı kaynağı (ör. "GitHub public repo", "istemci JS bundle"). */
  leakSource?: string;
}

/* ------------------------------------------------------------------ Webhooks */

/** Tekil bir webhook teslim denemesi (son teslimatlar logu için). */
export interface WebhookDelivery {
  id: string;
  /** Tetikleyen olay türü (ör. "bot.blocked"). */
  event: string;
  /** HTTP durum kodu (0 = bağlantı hatası). */
  status: number;
  ts: number;
  /** Kaçıncı deneme (1 = ilk). */
  attempt: number;
  /** Yanıt süresi (ms). */
  durationMs: number;
}

export interface Webhook {
  id: string;
  siteId: string;
  url: string;
  events: string[];
  active: boolean;
  secret: string;
  createdAt: number;
  lastDelivery: number | null;
  lastStatus: number | null;
  /** Son teslim denemeleri (en yeni sonda; repo son N tutar). */
  deliveries: WebhookDelivery[];
}

/* ------------------------------------------------------------------ Kullanım sayaçları */

export interface UsageCounter {
  siteId: string;
  day: string; // YYYY-MM-DD
  issued: number;
  verified: number;
  blocked: number;
  challenged: number;
}

/* ------------------------------------------------------------------ AI Asistan */

export interface AssistantMessage {
  id: string;
  ownerId: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
}

/* ------------------------------------------------------------------ Raporlama & Dışa Aktarma (v14) */

/** Rapor şablonu türü (galeri kartları + oluşturucu ile ortak anahtar). */
export type ReportType =
  | "haftalik_ozet" // Haftalık güvenlik özeti
  | "aylik_tehdit" // Aylık tehdit raporu
  | "ai_ajan" // AI ajan aktivite raporu
  | "bot_trafik" // Bot trafiği analizi
  | "uyum_denetim" // Uyum / denetim raporu
  | "kampanya_analiz"; // Kampanya sonrası analiz

/** Rapor çıktı biçimi. */
export type ReportFormat = "pdf" | "csv" | "json";

/** Zamanlanmış rapor tekrar sıklığı. */
export type ReportFrequency = "gunluk" | "haftalik" | "aylik";

/**
 * Zamanlanmış (otomatik) rapor tanımı. Belirli sıklıkta üretilip
 * alıcı e-postalara gönderilir. DB'de kalıcı; sahip-güvenli.
 */
export interface ScheduledReport {
  id: string;
  ownerId: string;
  /** Rapor türü (şablon). */
  type: ReportType;
  /** Kullanıcı-dostu ad (boşsa tür etiketinden türetilir). */
  name: string;
  /** Tekrar sıklığı. */
  frequency: ReportFrequency;
  /** Çıktı biçimi. */
  format: ReportFormat;
  /** Alıcı e-posta adresleri. */
  recipients: string[];
  /** Rapor kapsamı (site id) — null ise tüm siteler. */
  siteId: string | null;
  /** Aktif mi (duraklatılabilir). */
  active: boolean;
  createdAt: number;
  /** Bir sonraki planlanan çalışma anı (epoch ms). */
  nextRunAt: number;
  /** En son çalıştığı an (henüz çalışmadıysa null). */
  lastRunAt: number | null;
}

/**
 * Üretilmiş bir raporun geçmiş kaydı (indirilebilir arşiv izi).
 * Gerçek dosya istemcide üretilir; burada meta-veri tutulur.
 */
export interface ReportHistory {
  id: string;
  ownerId: string;
  type: ReportType;
  /** Rapor adı (üretim anındaki). */
  name: string;
  /** Kapsanan dönem (gün). */
  periodDays: number;
  format: ReportFormat;
  /** Yaklaşık dosya boyutu (byte) — gerçekçi arşiv görünümü için. */
  sizeBytes: number;
  /** Raporu üreten kişinin adı. */
  createdBy: string;
  createdAt: number;
  /** Zamanlanmış bir işten mi üretildi (yoksa elle). */
  scheduledReportId?: string;
}

/* ------------------------------------------------------------------ Denemeler / A-B Test (v15) */

/**
 * Bir A/B testinin ölçtüğü birincil metrik.
 * - surtunme  → meşru kullanıcıya en az sürtünme (challenge/geçiş oranı düşük iyi)
 * - guvenlik  → en çok bot engelleme (engelleme oranı yüksek iyi)
 * - donusum   → doğrulamayı tamamlayıp geçen gerçek kullanıcı oranı yüksek iyi
 */
export type ExperimentMetric = "surtunme" | "guvenlik" | "donusum";

/** Deneme yaşam döngüsü durumu. */
export type ExperimentStatus = "taslak" | "calisiyor" | "tamam" | "durduruldu";

/** Bir variantın test ettiği koruma yapılandırması. */
export interface ExperimentVariantConfig {
  /** Zorluk seviyesi (Site.difficulty ile aynı ölçek). */
  difficulty: "low" | "medium" | "high";
  /** Davranış eşiği (0..1) — bu skorun altı şüpheli sayılır. */
  behaviorThreshold: number;
  /** Görünmez mod açık mı (kullanıcıya challenge göstermeden arka planda skorla). */
  invisibleMode: boolean;
  /** Bu variante yönlendirilen trafik yüzdesi (A + B = 100). */
  trafik: number;
}

/** Bir variantın biriken sonuç metrikleri (deterministik/gerçek sayaç). */
export interface ExperimentVariantResult {
  /** Bu variante düşen gösterim (challenge/skorlama) sayısı. */
  gosterim: number;
  /** Doğrulamayı geçen (meşru kabul edilen) istek sayısı. */
  gecis: number;
  /** Engellenen (bot/şüpheli) istek sayısı. */
  engellenen: number;
  /** Ortalama insanlık skoru (0..1). */
  ortSkor: number;
}

export interface Experiment {
  id: string;
  ownerId: string;
  siteId: string;
  /** Kullanıcı-dostu deneme adı. */
  name: string;
  status: ExperimentStatus;
  /** Birincil başarı metriği. */
  metric: ExperimentMetric;
  /** Kontrol variantı (A). */
  variantA: ExperimentVariantConfig;
  /** Deney variantı (B). */
  variantB: ExperimentVariantConfig;
  /** Variant sonuçları — anahtar "A" | "B". Taslakta boş olabilir. */
  results: { A: ExperimentVariantResult; B: ExperimentVariantResult };
  createdAt: number;
  /** Başlatıldığı an (taslakta null). */
  startedAt: number | null;
  /** Bittiği/durdurulduğu an (henüz bitmediyse null). */
  endedAt: number | null;
  /** İlan edilen kazanan ("A" | "B") — henüz belirlenmediyse null. */
  winner: "A" | "B" | null;
}

/* ------------------------------------------------------------------ Promo Kodlar (indirim kuponları) */

/** İndirim türü: yüzde (0-100) veya sabit tutar (TL). */
export type PromoTur = "yuzde" | "sabit";

/**
 * Bir indirim/promosyon kodu. Checkout'ta uygulanır; panelden yönetilir.
 * `kod` her zaman BÜYÜK harf ve benzersizdir. Doğrulama; aktiflik, süre ve
 * kullanım limitini birlikte kontrol eder.
 */
export interface PromoKod {
  id: string;
  /** Kupon kodu — BÜYÜK harf, benzersiz (ör. "LANSMAN30"). */
  kod: string;
  /** İndirim türü. */
  tur: PromoTur;
  /** Değer: yüzde ise 0-100, sabit ise TL tutarı. */
  deger: number;
  /** İnsan-okur açıklama (panelde/rozette görünür). */
  aciklama: string;
  /** Azami toplam kullanım sayısı — null = sınırsız. */
  maxKullanim: number | null;
  /** Şu ana kadar kaç kez kullanıldı (redemption sayacı). */
  kullanilan: number;
  /** Son kullanma tarihi (ISO) — null = süresiz. */
  sonKullanma: string | null;
  /** Aktif mi (pasif kodlar reddedilir). */
  aktif: boolean;
  /** Plan kısıtı: "hepsi" veya belirli bir plan-id ("pro" | "scale"). */
  planKisiti: "hepsi" | Plan;
  createdAt: number;
}

/** Bir promo kodunun tekil kullanım (redemption) kaydı — denetim/log izi. */
export interface PromoKullanim {
  id: string;
  promoId: string;
  /** O anki kod (silinen promoda bile iz kalsın). */
  kod: string;
  /** Kullanan kullanıcı id'si. */
  userId: string;
  /** Hangi plan için kullanıldı. */
  planId: string;
  /** Uygulanan indirim tutarı (TL). */
  indirimTutari: number;
  /** Kullanıldığı an (ISO). */
  tarih: string;
}

/* ------------------------------------------------------------------ Nonce */

export interface UsedNonce {
  nonce: string;
  exp: number;
}

/* ------------------------------------------------------------------ DB */

/* ------------------------------------------------------------------ Entegrasyonlar */

export type IntegrationTur = "slack" | "discord" | "teams" | "zapier" | "email" | "pagerduty" | "webhook";

export interface Integration {
  id: string;
  ownerId: string;
  tur: IntegrationTur;
  /** Kullanıcının verdiği ad (ör. "Güvenlik kanalı"). */
  ad: string;
  /** Slack/Discord/Teams webhook URL'i veya Zapier hook / e-posta adresi. */
  hedef: string;
  /** Abone olunan olaylar (bot.blocked, ai_agent.detected, campaign.started, quota.warning, anomaly.detected). */
  olaylar: string[];
  aktif: boolean;
  createdAt: number;
  lastDelivery: number | null;
  lastStatus: number | null;
  /** Toplam gönderilen bildirim. */
  gonderilen: number;
}

export interface Database {
  users: User[];
  sites: Site[];
  events: BotEvent[];
  ipReputation: IpReputation[];
  rules: Rule[];
  campaigns: Campaign[];
  alerts: Alert[];
  auditLogs: AuditLog[];
  team: TeamMember[];
  apiTokens: ApiToken[];
  webhooks: Webhook[];
  usage: UsageCounter[];
  assistant: AssistantMessage[];
  scheduledReports: ScheduledReport[];
  reportHistory: ReportHistory[];
  experiments: Experiment[];
  integrations: Integration[];
  promoKodlar: PromoKod[];
  promoKullanimlar: PromoKullanim[];
  /** Kurumsal iletişim formundan gelen gerçek mesajlar. */
  iletisimMesajlari: IletisimMesaji[];
  usedNonces: UsedNonce[];
  sessions: Record<string, { userId: string; exp: number }>;
  _version: number;
}

/** Landing iletişim formu mesajı — gerçekten kaydedilir (fake değil). */
export interface IletisimMesaji {
  id: string;
  referans: string;
  ad: string;
  eposta: string;
  konu: string;
  mesaj: string;
  createdAt: number;
  okundu: boolean;
  ip?: string;
}

export const SCHEMA_VERSION = 27;

export function emptyDatabase(): Database {
  return {
    users: [],
    sites: [],
    events: [],
    ipReputation: [],
    rules: [],
    campaigns: [],
    alerts: [],
    auditLogs: [],
    team: [],
    apiTokens: [],
    webhooks: [],
    usage: [],
    assistant: [],
    scheduledReports: [],
    reportHistory: [],
    experiments: [],
    integrations: [],
    promoKodlar: [],
    promoKullanimlar: [],
    iletisimMesajlari: [],
    usedNonces: [],
    sessions: {},
    _version: SCHEMA_VERSION,
  };
}
