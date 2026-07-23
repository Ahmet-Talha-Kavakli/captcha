/**
 * Specter panel navigasyonu — veri-güdümlü sidebar + komut paleti kaynağı.
 * icon = lucide-react bileşen adı (Sidebar dinamik çözer).
 * capability = bu modülü GÖRMEK için gereken TeamCapability (yoksa herkese açık,
 * yani salt-okunur izleme modülü). RBAC hem sidebar hem sayfa guard kullanır.
 */
import type { TeamCapability } from "@/lib/db/schema";

export interface NavAlt {
  ad: string;
  href: string;
  /** i18n sözlük anahtarı (nav.*). Yoksa `ad` gösterilir (geriye uyumlu). */
  key?: string;
}
export interface NavItem {
  ad: string;
  href: string;
  icon: string;
  alt?: NavAlt[];
  /** i18n sözlük anahtarı (nav.*). Yoksa `ad` gösterilir (geriye uyumlu). */
  key?: string;
  /** Bu modülü kullanmak için gereken yetenek (yoksa: görüntüleme, herkes). */
  capability?: TeamCapability;
  /** Yalnızca platform admin (staff) görebilir — küresel operasyon konsolu. */
  platformAdmin?: boolean;
}

export const panelNav: NavItem[] = [
  { key: "nav.overview", ad: "Genel Bakış", href: "/panel", icon: "House" },
  { key: "nav.onboarding", ad: "Kurulum Sihirbazı", href: "/panel/onboarding", icon: "Rocket" },
  { key: "nav.learn", ad: "Öğrenme Merkezi", href: "/panel/ogrenme", icon: "GraduationCap" },
  { key: "nav.playground", ad: "API Test Alanı", href: "/panel/test-alani", icon: "Code", capability: "sites.manage" },
  { key: "nav.usecases", ad: "Kullanım Senaryoları", href: "/panel/senaryolar", icon: "Sparkles", capability: "rules.edit" },
  { key: "nav.traffic", ad: "Canlı Trafik", href: "/panel/trafik", icon: "Radar" },
  { key: "nav.console", ad: "Canlı Konsol", href: "/panel/canli-konsol", icon: "Terminal" },
  { key: "nav.commandcenter", ad: "Komuta Merkezi", href: "/panel/komuta-merkezi", icon: "Radio", capability: "rules.edit" },
  { key: "nav.livestream", ad: "Canlı Yayın", href: "/panel/canli-yayin", icon: "RadioTower" },
  { key: "nav.incident", ad: "Olay Müdahale", href: "/panel/mudahale", icon: "Siren", capability: "rules.edit" },
  { key: "nav.anomalystream", ad: "Anomali Akışı", href: "/panel/anomali-akis", icon: "Waves" },
  { key: "nav.threat", ad: "Tehdit İstihbaratı", href: "/panel/tehdit", icon: "ShieldAlert" },
  { key: "nav.threathunt", ad: "Tehdit Avı", href: "/panel/tehdit-avi", icon: "Search" },
  { key: "nav.savedhunts", ad: "Kayıtlı Avlar", href: "/panel/kayitli-avlar", icon: "BookMarked", capability: "rules.edit" },
  { key: "nav.sigmining", ad: "İmza Madenciliği", href: "/panel/imza-madencilik", icon: "Pickaxe", capability: "rules.edit" },
  { key: "nav.unifiedrisk", ad: "Birleşik Risk", href: "/panel/birlesik-risk", icon: "Layers" },
  { key: "nav.signatures", ad: "Saldırı İmzaları", href: "/panel/imza", icon: "Fingerprint" },
  { key: "nav.redteam", ad: "Kırmızı Takım", href: "/panel/kirmizi-takim", icon: "Swords", capability: "rules.edit" },
  { key: "nav.sandbox", ad: "Saldırı Sandbox'ı", href: "/panel/sandbox", icon: "FlaskConical", capability: "rules.edit" },
  { key: "nav.autofix", ad: "Otomatik Düzeltme", href: "/panel/oto-duzeltme", icon: "Wand2", capability: "rules.edit" },
  { key: "nav.adaptive", ad: "Adaptif Öğrenme", href: "/panel/adaptif", icon: "RefreshCw", capability: "rules.edit" },
  { key: "nav.coverage", ad: "Koruma Kapsamı", href: "/panel/kapsam", icon: "ShieldHalf" },
  { key: "nav.perfbudget", ad: "Performans Bütçesi", href: "/panel/performans", icon: "Gauge" },
  { key: "nav.campaigns", ad: "Kampanyalar", href: "/panel/kampanya", icon: "Crosshair" },
  { key: "nav.killchain", ad: "Saldırı Zinciri", href: "/panel/kill-chain", icon: "Link2" },
  { key: "nav.intent", ad: "Saldırgan Niyeti", href: "/panel/niyet", icon: "Brain" },
  { key: "nav.federated", ad: "Federe Korelasyon", href: "/panel/federe", icon: "Network" },
  { key: "nav.persistence", ad: "Kalıcılık Takibi", href: "/panel/kalicilik", icon: "Repeat" },
  { key: "nav.apiabuse", ad: "API Kötüye-Kullanım", href: "/panel/api-kotuye", icon: "Waypoints", capability: "rules.edit" },
  { key: "nav.defenselayers", ad: "Savunma Derinliği", href: "/panel/savunma-derinligi", icon: "Layers" },
  { key: "nav.defenselayersview", ad: "Savunma Katmanları", href: "/panel/savunma", icon: "ShieldCheck" },
  { key: "nav.layerfeedback", ad: "Katman Geri-Besleme", href: "/panel/geri-besleme", icon: "Repeat2" },
  { key: "nav.orchestrator", ad: "Otonom Orkestratör", href: "/panel/orkestrator", icon: "BrainCircuit", capability: "rules.edit" },
  { key: "nav.briefing", ad: "Tehdit Brifingi", href: "/panel/tehdit-brifing", icon: "FileText" },
  { key: "nav.map", ad: "Saldırı Haritası", href: "/panel/harita", icon: "Map" },
  { key: "nav.replay", ad: "Oturum Yeniden-Oynatma", href: "/panel/oturum-replay", icon: "Play" },
  { key: "nav.timeline", ad: "Zaman Tüneli", href: "/panel/zaman-tuneli", icon: "GitCommitHorizontal" },
  { key: "nav.surface", ad: "Saldırı Yüzeyi", href: "/panel/saldiri-yuzeyi", icon: "Crosshair" },
  { key: "nav.graph", ad: "İlişki Grafiği", href: "/panel/iliski-grafigi", icon: "Share2" },
  { key: "nav.threatactor", ad: "Tehdit Aktörleri", href: "/panel/tehdit-aktor", icon: "UserSearch" },
  { key: "nav.devicepool", ad: "Cihaz Havuzu", href: "/panel/cihaz-havuzu", icon: "MonitorSmartphone" },
  { key: "nav.georisk", ad: "Coğrafi & ASN Risk", href: "/panel/geo-risk", icon: "Globe" },
  { key: "nav.geoheat", ad: "Coğrafi Isı Haritası", href: "/panel/geo-isi", icon: "Thermometer" },
  { key: "nav.ai-agents", ad: "AI Ajan İstihbaratı", href: "/panel/ai-ajanlar", icon: "Bot" },
  { key: "nav.ai-verify", ad: "AI Ajan Doğrulama", href: "/panel/ai-dogrulama", icon: "ShieldCheck" },
  { key: "nav.tls", ad: "TLS İstihbaratı", href: "/panel/tls-istihbarat", icon: "Fingerprint" },
  { key: "nav.browserconsistency", ad: "Tarayıcı Tutarlılık", href: "/panel/tutarlilik", icon: "ScanFace" },
  { key: "nav.honeypot", ad: "Honeypot Tuzakları", href: "/panel/tuzak", icon: "Bug" },
  { key: "nav.proofofwork", ad: "İşlem Kanıtı", href: "/panel/is-kaniti", icon: "Cpu" },
  { key: "nav.ocr", ad: "OCR Direnç Kanıtı", href: "/panel/ocr-kanit", icon: "ScanLine" },
  { key: "nav.robots", ad: "robots.txt Uyum", href: "/panel/robots-uyum", icon: "BotOff" },
  { key: "nav.correlation", ad: "Olay Korelasyonu", href: "/panel/korelasyon", icon: "Workflow" },
  { key: "nav.feeds", ad: "Tehdit Beslemeleri", href: "/panel/besleme", icon: "Rss" },
  { key: "nav.community", ad: "Topluluk İstihbaratı", href: "/panel/topluluk", icon: "Users2" },
  { key: "nav.biometrics", ad: "Davranış Biyometrisi", href: "/panel/biyometri", icon: "Fingerprint" },
  { key: "nav.behaviobio", ad: "Biyometri İmza Analizi", href: "/panel/davranis-biyometri", icon: "Fingerprint" },
  { key: "nav.difflab", ad: "Zorluk Laboratuvarı", href: "/panel/zorluk-lab", icon: "FlaskConical" },
  { key: "nav.diffoptim", ad: "Zorluk Optimizasyonu", href: "/panel/zorluk-optim", icon: "SlidersHorizontal", capability: "rules.edit" },
  { key: "nav.scaling", ad: "Ölçekleme Politikası", href: "/panel/olcekleme", icon: "Scaling", capability: "rules.edit" },
  { key: "nav.enrichment", ad: "Zenginleştirme", href: "/panel/zenginlestirme", icon: "ScanSearch" },
  { key: "nav.casework", ad: "Ekip & Vakalar", href: "/panel/ekip-akis", icon: "KanbanSquare", capability: "rules.edit" },
  { key: "nav.mlexplain", ad: "ML Açıklanabilirlik", href: "/panel/ml-aciklanabilir", icon: "Brain" },
  { key: "nav.calibration", ad: "Skor Kalibrasyonu", href: "/panel/skor-kalibrasyon", icon: "Gauge" },
  { key: "nav.behaviorcapture", ad: "Davranış Yakalama", href: "/panel/davranis-yakalama", icon: "MousePointerClick" },
  { key: "nav.difficulty", ad: "Adaptif Zorluk", href: "/panel/zorluk", icon: "Gauge" },
  { key: "nav.widgetstudio", ad: "Widget Varyantları", href: "/panel/widget-varyant", icon: "Palette", capability: "sites.manage" },
  { key: "nav.friction", ad: "Sürtünme Analizi", href: "/panel/surtunme", icon: "Activity" },
  { key: "nav.journey", ad: "Kullanıcı Yolculuğu", href: "/panel/kullanici-yolculuk", icon: "Scale" },
  { key: "nav.interaction", ad: "Etkileşim Analizi", href: "/panel/etkilesim", icon: "MousePointer" },
  {
    key: "nav.rules", ad: "Kurallar", href: "/panel/kurallar", icon: "GitBranch", capability: "rules.edit",
    alt: [
      { key: "nav.rules", ad: "Kurallar", href: "/panel/kurallar" },
      { key: "nav.rulebuilder", ad: "Gelişmiş oluşturucu", href: "/panel/kurallar/gelismis" },
    ],
  },
  { key: "nav.marketplace", ad: "Kural Pazarı", href: "/panel/kural-pazari", icon: "Store", capability: "rules.edit" },
  { key: "nav.rulesuggest", ad: "Kural Önerileri", href: "/panel/kural-oneri", icon: "Sparkles", capability: "rules.edit" },
  { key: "nav.rulelab", ad: "Kural Laboratuvarı", href: "/panel/kural-lab", icon: "FlaskConical", capability: "rules.edit" },
  { key: "nav.ruleanalysis", ad: "Kural Analizi", href: "/panel/kural-analiz", icon: "ScanSearch", capability: "rules.edit" },
  { key: "nav.ruleperf", ad: "Kural Performansı", href: "/panel/kural-performans", icon: "TrendingUp", capability: "rules.edit" },
  { key: "nav.ruleversions", ad: "Kural Sürümleri", href: "/panel/kural-surum", icon: "History", capability: "rules.edit" },
  { key: "nav.ruledeploy", ad: "Kural Dağıtımı", href: "/panel/kural-dagitim", icon: "CopyPlus", capability: "rules.edit" },
  { key: "nav.experiments", ad: "Denemeler", href: "/panel/denemeler", icon: "FlaskConical", capability: "rules.edit" },
  { key: "nav.expanalysis", ad: "Deney Analizi", href: "/panel/deney-analiz", icon: "Sigma", capability: "rules.edit" },
  { key: "nav.sites", ad: "Siteler", href: "/panel/siteler", icon: "Globe", capability: "sites.manage" },
  { key: "nav.edge", ad: "Edge Ağı", href: "/panel/edge", icon: "Network" },
  { key: "nav.uptime", ad: "Uptime", href: "/panel/uptime", icon: "Activity" },
  { key: "nav.health", ad: "Hesap Sağlığı", href: "/panel/hesap-saglik", icon: "HeartPulse" },
  { key: "nav.fleet", ad: "Filo Panosu", href: "/panel/filo", icon: "LayoutGrid" },
  { key: "nav.analytics", ad: "Analitik", href: "/panel/analitik", icon: "ChartColumn" },
  { key: "nav.alerts", ad: "Uyarılar", href: "/panel/uyarilar", icon: "Bell", capability: "incidents.resolve" },
  { key: "nav.notifchannels", ad: "Bildirim Kanalları", href: "/panel/bildirim-kanali", icon: "BellRing", capability: "incidents.resolve" },
  { key: "nav.reports", ad: "Raporlar", href: "/panel/raporlar", icon: "FileText" },
  { key: "nav.reportstudio", ad: "Rapor Stüdyosu", href: "/panel/rapor-studyo", icon: "FileBarChart" },
  { key: "nav.audit", ad: "Denetim", href: "/panel/denetim", icon: "FileCheck" },
  { key: "nav.auditexport", ad: "Denetim Dışa-Aktarım", href: "/panel/denetim-export", icon: "FileDown" },
  { key: "nav.ledger", ad: "Değişmezlik Defteri", href: "/panel/denetim-defteri", icon: "Link2" },
  { key: "nav.wloc", ad: "Widget Yerelleştirme", href: "/panel/yerellestirme", icon: "Globe" },
  { key: "nav.compliance", ad: "Uyum & Sertifika", href: "/panel/uyum", icon: "ShieldCheck" },
  { key: "nav.complianceauto", ad: "Kanıt Otomasyonu", href: "/panel/uyum-otomasyon", icon: "ClipboardCheck" },
  { key: "nav.accessibility", ad: "Erişilebilirlik", href: "/panel/erisim", icon: "Accessibility" },
  { key: "nav.retention", ad: "Veri Saklama", href: "/panel/veri-saklama", icon: "DatabaseZap", capability: "team.manage" },
  { key: "nav.seal", ad: "Güven Mührü", href: "/panel/muhur", icon: "BadgeCheck" },
  { key: "nav.workspace", ad: "Çalışma Alanı", href: "/panel/calisma-alani", icon: "Building2", capability: "team.manage" },
  { key: "nav.sso", ad: "SSO & SAML", href: "/panel/sso", icon: "KeySquare", capability: "team.manage" },
  { key: "nav.team", ad: "Ekip", href: "/panel/ekip", icon: "Users", capability: "team.manage" },
  { key: "nav.developer", ad: "Geliştirici", href: "/panel/gelistirici", icon: "Code", capability: "apikeys.manage" },
  { key: "nav.keysecurity", ad: "Anahtar Güvenliği", href: "/panel/anahtar-guvenlik", icon: "KeyRound", capability: "apikeys.manage" },
  { key: "nav.sessionsec", ad: "Oturum Güvenliği", href: "/panel/oturum-guvenlik", icon: "LockKeyhole", capability: "team.manage" },
  { key: "nav.integrations", ad: "Entegrasyonlar", href: "/panel/entegrasyonlar", icon: "Plug", capability: "apikeys.manage" },
  { key: "nav.webhookmon", ad: "Webhook İzleme", href: "/panel/webhook-izleme", icon: "Webhook", capability: "apikeys.manage" },
  { key: "nav.apiversion", ad: "API Sürümleme", href: "/panel/api-surum", icon: "GitPullRequest", capability: "apikeys.manage" },
  { key: "nav.mobilesdk", ad: "Mobil & SDK", href: "/panel/mobil-sdk", icon: "Smartphone" },
  { key: "nav.integrationhealth", ad: "Entegrasyon Sağlığı", href: "/panel/entegrasyon-saglik", icon: "Activity", capability: "apikeys.manage" },
  { key: "nav.localization", ad: "Dil & Yerelleştirme", href: "/panel/dil", icon: "Languages" },
  { key: "nav.apiusage", ad: "API Kullanımı", href: "/panel/api-kullanim", icon: "Gauge", capability: "apikeys.manage" },
  { key: "nav.billing", ad: "Maliyet & Fatura", href: "/panel/maliyet", icon: "Wallet", capability: "billing.manage" },
  { key: "nav.promo", ad: "Promo Kodlar", href: "/panel/promo-kodlar", icon: "Ticket", capability: "billing.manage" },
  { key: "nav.costoptim", ad: "Maliyet Optimizasyonu", href: "/panel/maliyet-optim", icon: "PiggyBank", capability: "billing.manage" },
  { key: "nav.roi", ad: "ROI & Değer", href: "/panel/roi", icon: "TrendingUp" },
  { key: "nav.referral", ad: "Davet Et & Kazan", href: "/panel/davet", icon: "Gift" },
  { key: "nav.boteconomy", ad: "Bot Ekonomisi", href: "/panel/bot-ekonomi", icon: "Coins" },
  { key: "nav.trustbadge", ad: "Güven Rozeti", href: "/panel/guven-rozeti", icon: "ShieldCheck" },
  { key: "nav.metering", ad: "Kullanım & SLA", href: "/panel/kullanim-olcum", icon: "Receipt" },
  { key: "nav.forecast", ad: "Kota Tahmini", href: "/panel/kota-tahmin", icon: "TrendingUp", capability: "billing.manage" },
  { key: "nav.attackforecast", ad: "Saldırı Tahmini", href: "/panel/saldiri-tahmin", icon: "Siren" },
  { key: "nav.ratelimit", ad: "Hız & Kota Politikası", href: "/panel/rate-politika", icon: "Gauge", capability: "billing.manage" },
  { key: "nav.admin", ad: "Yönetici Konsolu", href: "/panel/admin", icon: "ServerCog", capability: "team.manage", platformAdmin: true },
  {
    key: "nav.settings",
    ad: "Ayarlar",
    href: "/panel/ayarlar",
    icon: "Settings",
    alt: [
      { key: "nav.settings.account", ad: "Hesap", href: "/panel/ayarlar" },
      { key: "nav.settings.billing", ad: "Plan & Fatura", href: "/panel/ayarlar/plan" },
      { key: "nav.settings.data", ad: "Veri & Yedekleme", href: "/panel/ayarlar/veri" },
    ],
  },
];

/** Bir href için gereken yeteneği bul (sayfa guard'ı kullanır). */
export function navYetenek(href: string): TeamCapability | undefined {
  const clean = href.split("?")[0];
  // En uzun eşleşen prefix'i bul (alt yollar üst modülün yeteneğini alır).
  let bulunan: NavItem | undefined;
  for (const item of panelNav) {
    if (item.href === "/panel") continue;
    if (clean === item.href || clean.startsWith(item.href + "/")) {
      if (!bulunan || item.href.length > bulunan.href.length) bulunan = item;
    }
  }
  return bulunan?.capability;
}
