/**
 * Specter — Zengin Deterministik Seed
 * ====================================
 * Gerçek bir bot-koruma platformunun 30 günlük operasyonunu simüle eder:
 * binlerce bot olayı, IP itibar kayıtları, kurallar, saldırı kampanyaları,
 * uyarılar, denetim günlüğü, ekip. Tümü deterministik (Math.random YOK) —
 * her yeniden seed aynı gerçekçi veriyi üretir.
 */

import crypto from "node:crypto";
import { MARKA } from "@/lib/marka";
import {
  emptyDatabase,
  type Database,
  type BotClass,
  type Verdict,
  type BotEvent,
  type User,
  type Site,
  type Rule,
  type AlertSeverity,
  type AlertStatus,
  type AlertPriority,
  type AlertCategory,
  type AlertTimelineEntry,
  type TeamMember,
  type TeamCapability,
  type AuditCategory,
  type AuditLog,
  type ReportType,
  type ReportFormat,
  type ReportFrequency,
} from "./schema";

// Deterministik PRNG.
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function id(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}
function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(pw, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}
function dayKey(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

const COUNTRIES = ["TR", "US", "RU", "CN", "DE", "NL", "BR", "IN", "GB", "FR", "UA", "VN", "ID", "IR"];
const CITIES: Record<string, string[]> = {
  TR: ["İstanbul", "Ankara", "İzmir"],
  US: ["Ashburn", "San Jose", "Dallas"],
  RU: ["Moskova", "St. Petersburg"],
  CN: ["Pekin", "Shanghai", "Shenzhen"],
  DE: ["Frankfurt", "Berlin"],
  NL: ["Amsterdam"],
};
const ASNS = [
  "AS15169 Google LLC",
  "AS16509 Amazon AWS",
  "AS14061 DigitalOcean",
  "AS13335 Cloudflare",
  "AS8075 Microsoft",
  "AS16276 OVH",
  "AS24940 Hetzner",
  "AS9009 M247 (VPN)",
  "AS200651 Flokinet",
  "AS49505 Selectel",
  "AS4837 China Unicom",
  "AS45102 Alibaba",
];
const UAS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X) Safari/17.4",
  "python-requests/2.31.0",
  "Go-http-client/2.0",
  "Scrapy/2.11 (+https://scrapy.org)",
  "HeadlessChrome/124.0.0.0",
  "curl/8.4.0",
  "node-fetch/3.3",
  "GPTBot/1.1 (+https://openai.com/gptbot)",
  "ClaudeBot/1.0",
  "Googlebot/2.1 (+http://www.google.com/bot.html)",
  "axios/1.6.8",
];

/** AI ajan UA'ları (ai-agents.ts kataloğundaki uaEslesme ile uyumlu).
 * botClass="ai_agent" olayları bunlardan seçilir → AI Ajan İstihbaratı doludur. */
const AI_UAS = [
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.1; +https://openai.com/gptbot",
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot",
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot",
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ClaudeBot/1.0; +https://anthropic.com/claudebot",
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; Claude-User/1.0; +https://anthropic.com",
  "Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)",
  "Mozilla/5.0 (compatible; Perplexity-User/1.0; +https://perplexity.ai)",
  "Mozilla/5.0 (compatible; Bytespider; spider-feedback@bytedance.com)",
  "CCBot/2.0 (https://commoncrawl.org/faq/)",
  "Mozilla/5.0 (compatible; Amazonbot/0.1; +https://developer.amazon.com/support/amazonbot)",
  "meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/web-crawlers)",
  "Mozilla/5.0 (compatible; Google-Extended)",
  "cohere-ai (+https://cohere.com)",
  "Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/124.0.0.0 browser-use/0.1",
];
const PATHS = ["/login", "/api/checkout", "/register", "/api/graphql", "/cart", "/api/products", "/search", "/api/user", "/wp-login.php", "/.env"];
const BOT_CLASSES: BotClass[] = ["human", "good_bot", "automation", "scraper", "credential_stuffing", "ai_agent", "ddos", "spam"];
const AVATAR_COLORS = ["#06b6d4", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899"];

function randIp(rng: () => number): string {
  return `${1 + Math.floor(rng() * 223)}.${Math.floor(rng() * 256)}.${Math.floor(rng() * 256)}.${1 + Math.floor(rng() * 254)}`;
}

/** Bilinen gerçek tarayıcı JA3 imzaları (tls-istihbarat.ts BILINEN_TARAYICI ile aynı). */
const JA3_TARAYICI = [
  { ja3: "cd08e31494f9531f560d64c695473da9", engine: "Blink" },   // Chrome
  { ja3: "b32309a26951912be7dba376398abc3b", engine: "WebKit" },  // Safari
  { ja3: "b20b44b18b853ef29ab773e921b03422", engine: "Gecko" },   // Firefox
];
/** Otomasyon aracı JA3 imzaları (python/curl/go — engine yok). */
const JA3_ARAC = [
  { ja3: "3b5074b1b5d032e5620f69f9f700ff0e", engine: "None" },     // python-requests
  { ja3: "e7d705a3286e19ea42f587b344ee6865", engine: "None" },     // curl
  { ja3: "a0e9f5d64349fb13191bc781f81f42e1", engine: "None" },     // Go http
];
const JA3_HEADLESS = { ja3: "66918128f1b9b03303d77c6f2eefd128", engine: "HeadlessChrome" };
const JA3_CRAWLER = { ja3: "7dd50e112cd23734a310b90f6f44a7cd", engine: "Crawler" };

/**
 * Bir olaya gerçekçi TLS/JA3 parmak izi + engine atar. Bot sınıfı + UA'ya göre:
 *  - insan/iyi-bot → gerçek tarayıcı JA3 (UA ile uyumlu).
 *  - ai_agent → crawler engine (ilan edilmiş AI botu).
 *  - scraper/automation araç UA'lı → araç JA3 (None engine).
 *  - BAZI botlar SAHTE: UA "Chrome/Safari" iddia eder ama JA3 araç imzası →
 *    tlsUaUyumsuz=true (TLS parmak izi UA'nın yalanını açığa çıkarır).
 */
function tlsAta(
  rng: () => number, botClass: BotClass, ua: string,
): { ja3: string; engine: string; tlsUaUyumsuz: boolean } {
  const tarayiciIddia = /Mozilla|Chrome|Safari|Firefox|Edg/.test(ua) && !/bot|crawler|python|curl|go-http|scrapy|axios|node-fetch|headless/i.test(ua);
  if (botClass === "human" || botClass === "good_bot") {
    const t = JA3_TARAYICI[Math.floor(rng() * JA3_TARAYICI.length)];
    return { ja3: t.ja3, engine: t.engine, tlsUaUyumsuz: false };
  }
  if (botClass === "ai_agent") {
    return { ja3: JA3_CRAWLER.ja3, engine: JA3_CRAWLER.engine, tlsUaUyumsuz: false };
  }
  // Kötü sınıf. UA bir tarayıcı iddia ediyorsa → SAHTE (JA3 araç, uyumsuz).
  if (tarayiciIddia) {
    const a = JA3_ARAC[Math.floor(rng() * JA3_ARAC.length)];
    return { ja3: a.ja3, engine: a.engine, tlsUaUyumsuz: true }; // sahte tarayıcı!
  }
  // Headless UA → headless JA3.
  if (/headless/i.test(ua)) {
    return { ja3: JA3_HEADLESS.ja3, engine: JA3_HEADLESS.engine, tlsUaUyumsuz: false };
  }
  // Açık araç UA (python/curl/go) → araç JA3, dürüst (UA zaten araç diyor).
  const a = JA3_ARAC[Math.floor(rng() * JA3_ARAC.length)];
  return { ja3: a.ja3, engine: a.engine, tlsUaUyumsuz: false };
}

function verdictFor(botClass: BotClass, rng: () => number): { verdict: Verdict; score: number } {
  if (botClass === "human") return { verdict: "allowed", score: 0.72 + rng() * 0.27 };
  if (botClass === "good_bot") return { verdict: "allowed", score: 0.4 + rng() * 0.2 };
  const score = rng() * 0.35;
  const verdict: Verdict = rng() < 0.75 ? "blocked" : rng() < 0.5 ? "challenged" : "flagged";
  return { verdict, score };
}

export function buildSeed(now: number): Database {
  const db = emptyDatabase();
  const rng = makeRng(0x5eed);

  // --- Sahip kullanıcı ---
  const owner: User = {
    id: id("usr"),
    email: "demo@specter.dev",
    name: "Demo Geliştirici",
    passwordHash: hashPassword("specter123"),
    plan: "pro",
    role: "owner",
    avatarColor: "#06b6d4",
    createdAt: now - 90 * 86400000,
    lastSeenAt: now,
    workspaceName: "Acme Güvenlik",
    locale: "tr",
    timezone: "Europe/Istanbul",
    // Demo hesap: 2FA KAPALI (test için sürtünmesiz giriş; gerçek TOTP secret
    // olmadan enabled:true tutmak login akışında tutarsızlık yaratırdı). 2FA
    // vitrin akışı panelin ayarlar/güvenlik ekranından denenebilir.
    twoFactorEnabled: false,
    passwordChangedAt: now - 40 * 86400000,
    notificationPrefs: {
      kritik_uyari: { email: true, webhook: true, panel: true },
      ai_ajan: { email: true, webhook: false, panel: true },
      kota: { email: true, webhook: false, panel: true },
      haftalik_ozet: { email: true, webhook: false, panel: false },
      ekip: { email: false, webhook: false, panel: true },
      fatura: { email: true, webhook: false, panel: true },
    },
  };
  db.users.push(owner);

  // --- Siteler ---
  const siteConfigs = [
    { name: "acme-shop.com", domains: ["acme-shop.com", "www.acme-shop.com"], difficulty: "medium" as const, mode: "challenge" as const, days: 90 },
    { name: "checkout.acme.com", domains: ["checkout.acme.com"], difficulty: "high" as const, mode: "block" as const, days: 60 },
    { name: "api.acme.com", domains: ["api.acme.com"], difficulty: "high" as const, mode: "block" as const, days: 45 },
    { name: "blog.acme.com", domains: ["blog.acme.com"], difficulty: "low" as const, mode: "monitor" as const, days: 30 },
  ];
  const sites: Site[] = siteConfigs.map((c, ci) => ({
    id: id("site"),
    ownerId: owner.id,
    name: c.name,
    domains: c.domains,
    // İLK site → sabit public demo anahtarı (/demo sayfası her ortamda
    // gerçek challenge/verify/passive çağırabilsin diye deterministik).
    siteKey: ci === 0 ? MARKA.demoSiteKey : "pk_live_" + crypto.randomBytes(10).toString("hex"),
    secretKey: "sk_live_" + crypto.randomBytes(14).toString("hex"),
    difficulty: c.difficulty,
    behaviorThreshold: c.difficulty === "high" ? 0.5 : 0.35,
    // İlk (demo) site görünmez modu açık tutar → /demo'nun passive uç çağrısı
    // gerçek karar döndürür.
    invisibleMode: ci === 0 ? true : c.mode !== "monitor",
    mode: c.mode,
    createdAt: now - c.days * 86400000,
    active: true,
    // Mevcut seed siteleri geriye-uyum için doğrulanmış kabul edilir.
    verified: true,
    verifyToken: "veylify-verify=" + crypto.randomBytes(12).toString("hex"),
    verifyMethod: "dns" as const,
    verifiedAt: now - c.days * 86400000,
    verifyAttempts: 1,
  }));
  db.sites.push(...sites);

  // --- Yoğun saldırgan IP'leri (adli inceleme sayfası için) ---
  // Gerçek bir bot-koruma panelinde birkaç IP yüzlerce/binlerce istek üretir.
  // Bu IP'ler SABİTTİR ve aşağıda çok sayıda olayla (farklı saat/yol/karar/bot
  // sınıfı) beslenir; böylece /panel/tehdit/[ip] sayfası GERÇEKTEN dolu olur.
  // Bu IP'lerin ipReputation kaydı da otomatik oluşur (aşağıda IP itibarı
  // türetimi tüm eventPool'u tarar), yani örtüşme garanti.
  interface Saldirgan {
    ip: string;
    country: string;
    asn: string;
    botClass: BotClass;
    /** Ağırlıklı yol dağılımı (bu IP hangi endpoint'leri vuruyor). */
    paths: string[];
    /** Ortalama günlük olay yoğunluğu. */
    yogunluk: number;
    /** Aktivitenin yoğunlaştığı saat aralığı [başlangıç, bitiş]. */
    saatler: [number, number];
    site: Site;
    ua: string;
    /** Kampanyanın kaç gün önce başladığı (öncesinde olay yok). */
    baslangicGun: number;
  }
  const saldirganlar: Saldirgan[] = [
    { ip: "45.155.205.211", country: "RU", asn: "AS200651 Flokinet", botClass: "credential_stuffing", paths: ["/login", "/api/user", "/register"], yogunluk: 22, saatler: [1, 6], site: sites[1], ua: "python-requests/2.31.0", baslangicGun: 29 },
    { ip: "185.220.101.34", country: "DE", asn: "AS9009 M247 (VPN)", botClass: "scraper", paths: ["/api/products", "/search", "/api/graphql"], yogunluk: 30, saatler: [0, 23], site: sites[0], ua: "Scrapy/2.11 (+https://scrapy.org)", baslangicGun: 29 },
    { ip: "193.42.33.14", country: "NL", asn: "AS9009 M247 (VPN)", botClass: "ddos", paths: ["/api/checkout", "/cart", "/api/products"], yogunluk: 22, saatler: [20, 23], site: sites[2], ua: "Go-http-client/2.0", baslangicGun: 11 },
    { ip: "104.244.76.187", country: "US", asn: "AS16509 Amazon AWS", botClass: "ai_agent", paths: ["/api/graphql", "/api/products", "/search"], yogunluk: 16, saatler: [8, 18], site: sites[0], ua: "GPTBot/1.1 (+https://openai.com/gptbot)", baslangicGun: 29 },
    { ip: "89.248.165.52", country: "RU", asn: "AS49505 Selectel", botClass: "automation", paths: ["/login", "/wp-login.php", "/.env"], yogunluk: 18, saatler: [2, 5], site: sites[1], ua: "HeadlessChrome/124.0.0.0", baslangicGun: 29 },
    { ip: "141.98.11.29", country: "NL", asn: "AS200651 Flokinet", botClass: "credential_stuffing", paths: ["/login", "/api/user"], yogunluk: 14, saatler: [3, 7], site: sites[2], ua: "curl/8.4.0", baslangicGun: 29 },
    { ip: "116.203.44.9", country: "DE", asn: "AS24940 Hetzner", botClass: "scraper", paths: ["/api/products", "/api/graphql", "/blog"], yogunluk: 20, saatler: [10, 22], site: sites[3], ua: "node-fetch/3.3", baslangicGun: 29 },
    { ip: "159.65.221.78", country: "IN", asn: "AS14061 DigitalOcean", botClass: "spam", paths: ["/register", "/api/user", "/search"], yogunluk: 12, saatler: [12, 20], site: sites[0], ua: "axios/1.6.8", baslangicGun: 29 },
  ];

  // --- Bot olayları: son 30 gün, saat başına örnekler ---
  // Yoğun ama makul: ~2500 olay.
  const eventPool: BotEvent[] = [];

  // Bot-IP havuzu: gerçek saldırıda aynı IP DEFALARCA vurur. Her bot olayına
  // taze-rastgele IP vermek yerine sınırlı bir havuzdan seçeriz → aynı IP'ler
  // tekrarlar. Bu, kill-chain (saldırgan zinciri), korelasyon (olay zinciri),
  // ilişki-grafiği (IP kümesi) ve tehdit-aktör motorlarının GERÇEK veri
  // üretmesini sağlar. ~120 IP: her IP ortalama ~onlarca olay yapar.
  const botIpHavuzu: string[] = Array.from({ length: 120 }, () => randIp(rng));
  // İnsan trafiği çeşitli kalır (ayrı, daha geniş havuz).
  const insanIpHavuzu: string[] = Array.from({ length: 900 }, () => randIp(rng));

  // Saldırgan IP'lerinin olaylarını üret (yüksek hacim, tutarlı profil).
  for (const s of saldirganlar) {
    for (let d = Math.min(29, s.baslangicGun); d >= 0; d--) {
      // O güne ait olay sayısı (yoğunluk ± sapma, deterministik).
      const gunlukSayi = Math.max(4, s.yogunluk - 6 + Math.floor(rng() * 13));
      // PATLAMA penceresi: gerçek saldırılar dalga dalga gelir. Günlük olayların
      // bir bölümünü 10dk'lık dar bir pencereye sıkıştırırız → korelasyon motoru
      // (aynı IP patlaması, ASN koordinasyonu) GERÇEK saldırı zincirleri bulur.
      const [ph0, ph1] = s.saatler;
      const patlamaSaat = ph0 + Math.floor(rng() * (ph1 - ph0 + 1));
      const patlamaBaslangic = now - d * 86400000 - (24 - patlamaSaat) * 3600000 - Math.floor(rng() * 3000000);
      for (let k = 0; k < gunlukSayi; k++) {
        const [h0, h1] = s.saatler;
        const hour = h0 + Math.floor(rng() * (h1 - h0 + 1));
        // İlk ~%65 olay patlama penceresinde (10dk), kalanı gün içine yayılır.
        const patlamada = k < Math.ceil(gunlukSayi * 0.65);
        const ts = patlamada
          ? patlamaBaslangic + Math.floor(rng() * 9 * 60 * 1000) // 0..9 dk içinde
          : now - d * 86400000 - (24 - hour) * 3600000 - Math.floor(rng() * 3600000);
        // Kararlar: çoğunlukla engellendi, bir kısmı doğrulama/işaret.
        const vr = rng();
        const verdict: Verdict = vr < 0.72 ? "blocked" : vr < 0.9 ? "challenged" : vr < 0.97 ? "flagged" : "allowed";
        const score = verdict === "allowed" ? 0.55 + rng() * 0.2 : rng() * 0.22;
        const path = s.paths[Math.floor(rng() * s.paths.length)];
        const rules: string[] = [];
        if (verdict !== "allowed") {
          if (score < 0.15) rules.push("Düşük davranış skoru");
          if (s.asn.includes("VPN") || s.asn.includes("Flokinet")) rules.push("Kötü ün ASN");
          if (s.botClass === "credential_stuffing") rules.push("Kimlik denemesi hızı");
          if (s.botClass === "ai_agent") rules.push("AI ajan imzası");
          if (s.botClass === "ddos") rules.push("İstek hızı eşiği");
        }
        const saldTls = tlsAta(rng, s.botClass, s.ua);
        eventPool.push({
          id: id("ev"),
          siteId: s.site.id,
          ts,
          ip: s.ip,
          country: s.country,
          city: CITIES[s.country]?.[Math.floor(rng() * (CITIES[s.country]?.length || 1))],
          asn: s.asn,
          ua: s.ua,
          ja3: saldTls.ja3,
          engine: saldTls.engine,
          tlsUaUyumsuz: saldTls.tlsUaUyumsuz,
          path,
          botClass: s.botClass,
          verdict,
          score,
          triggeredRules: rules,
          fingerprint: crypto.randomBytes(6).toString("hex"),
          method: path.startsWith("/api") || path.includes("login") || path.includes("register") ? "POST" : "GET",
          latency: 8 + Math.floor(rng() * 90),
        });
      }
    }
  }

  for (let d = 29; d >= 0; d--) {
    // Hafif organik büyüme: eski günlerde biraz daha az, yeni günlerde biraz
    // daha çok trafik (gerçek bir sitenin doğal büyümesi). AMA ilk günler bile
    // sağlam bir TABAN hacme sahip — grafik baştan "ezik/düz" görünmez.
    const buyumeFaktoru = 0.85 + (29 - d) * 0.012; // ~0.85 → ~1.20
    for (let hour = 0; hour < 24; hour += 2) {
      const site = sites[Math.floor(rng() * sites.length)];
      const perSlot = Math.max(4, Math.round((6 + Math.floor(rng() * 5)) * buyumeFaktoru));
      for (let k = 0; k < perSlot; k++) {
        // Gündüz insan ağırlıklı, gece bot ağırlıklı. Bot oranı her gün makul
        // düzeyde tutulur ki "tehdit olayı" serisi ilk günlerde de görünür olsun.
        const botHeavy = hour < 6 || hour > 22;
        const roll = rng();
        let botClass: BotClass;
        if (botHeavy) {
          botClass = roll < 0.35 ? "human" : BOT_CLASSES[2 + Math.floor(rng() * 6)];
        } else {
          botClass = roll < 0.6 ? "human" : roll < 0.7 ? "good_bot" : BOT_CLASSES[2 + Math.floor(rng() * 6)];
        }
        const country = COUNTRIES[Math.floor(rng() * COUNTRIES.length)];
        const asn = botClass === "human" ? ASNS[Math.floor(rng() * 4)] : ASNS[3 + Math.floor(rng() * 8)];
        const { verdict, score } = verdictFor(botClass, rng);
        const ts = now - d * 86400000 - (24 - hour) * 3600000 - Math.floor(rng() * 3600000);
        const rules: string[] = [];
        if (verdict === "blocked") {
          if (score < 0.15) rules.push("Düşük davranış skoru");
          if (asn.includes("VPN") || asn.includes("Flokinet")) rules.push("Kötü ün ASN");
          if (botClass === "credential_stuffing") rules.push("Kimlik denemesi hızı");
        }
        // İnsan → geniş havuz (çeşitli); bot → dar havuz (aynı IP tekrarlar →
        // saldırgan zincirleri, korelasyon ve ilişki grafiği gerçek veri üretir).
        const ip = botClass === "human"
          ? insanIpHavuzu[Math.floor(rng() * insanIpHavuzu.length)]
          : botIpHavuzu[Math.floor(rng() * botIpHavuzu.length)];
        const havuzUa = botClass === "ai_agent"
          ? AI_UAS[Math.floor(rng() * AI_UAS.length)]
          : UAS[Math.floor(rng() * UAS.length)];
        const havuzTls = tlsAta(rng, botClass, havuzUa);
        eventPool.push({
          id: id("ev"),
          siteId: site.id,
          ts,
          ip,
          country,
          ja3: havuzTls.ja3,
          engine: havuzTls.engine,
          tlsUaUyumsuz: havuzTls.tlsUaUyumsuz,
          city: CITIES[country]?.[Math.floor(rng() * (CITIES[country]?.length || 1))],
          asn,
          ua: havuzUa, // TLS ata ile aynı UA (JA3 uyumsuzluk tutarlı hesaplanır)
          path: PATHS[Math.floor(rng() * PATHS.length)],
          botClass,
          verdict,
          score,
          triggeredRules: rules,
          fingerprint: crypto.randomBytes(6).toString("hex"),
          method: rng() < 0.6 ? "POST" : "GET",
          latency: 8 + Math.floor(rng() * 90),
        });
      }
    }
  }
  eventPool.sort((a, b) => a.ts - b.ts);
  db.events.push(...eventPool);

  // --- Kullanım sayaçları (olaylardan türet) ---
  const usageMap = new Map<string, { issued: number; verified: number; blocked: number; challenged: number }>();
  for (const e of eventPool) {
    const key = `${e.siteId}|${dayKey(e.ts)}`;
    const u = usageMap.get(key) ?? { issued: 0, verified: 0, blocked: 0, challenged: 0 };
    u.issued++;
    if (e.verdict === "allowed") u.verified++;
    else if (e.verdict === "blocked") u.blocked++;
    else if (e.verdict === "challenged") u.challenged++;
    usageMap.set(key, u);
  }
  // Gerçekçi ölçek için sayaçları büyüt (her olay ~40 gerçek isteği temsil etsin).
  for (const [key, u] of usageMap) {
    const [siteId, day] = key.split("|");
    db.usage.push({
      siteId,
      day,
      issued: u.issued * 40,
      verified: u.verified * 40,
      blocked: u.blocked * 40,
      challenged: u.challenged * 40,
    });
  }

  // --- IP itibarı (olaylardaki botlardan) ---
  const ipMap = new Map<string, { c: string; asn: string; req: number; blocked: number; first: number; last: number; bad: boolean }>();
  for (const e of eventPool) {
    const cur = ipMap.get(e.ip) ?? { c: e.country, asn: e.asn, req: 0, blocked: 0, first: e.ts, last: e.ts, bad: false };
    cur.req++;
    if (e.verdict === "blocked") cur.blocked++;
    if (e.botClass !== "human" && e.botClass !== "good_bot") cur.bad = true;
    cur.last = Math.max(cur.last, e.ts);
    cur.first = Math.min(cur.first, e.ts);
    ipMap.set(e.ip, cur);
  }
  // Önce en çok istek üreten IP'ler gelsin ki yoğun saldırganlar (adli
  // inceleme sayfası için) 200'lük kapak dışında kalmasın.
  const ipEntries = [...ipMap.entries()]
    .filter(([, v]) => v.bad || v.blocked > 0)
    .sort((a, b) => b[1].req - a[1].req)
    .slice(0, 200);
  for (const [ip, v] of ipEntries) {
    const ratio = v.req ? v.blocked / v.req : 0;
    // Yüksek hacim de tehdidi yükseltir (çok istek = daha agresif kaynak).
    const hacimBonus = v.req >= 200 ? 25 : v.req >= 80 ? 18 : v.req >= 25 ? 10 : 0;
    const threat = Math.min(100, Math.round(ratio * 70 + hacimBonus + (v.asn.includes("VPN") ? 25 : 0) + (v.bad ? 15 : 0)));
    db.ipReputation.push({
      ip,
      country: v.c,
      asn: v.asn,
      threatScore: threat,
      category:
        threat > 70 ? "malicious" : v.asn.includes("VPN") ? "vpn" : v.asn.includes("Amazon") || v.asn.includes("DigitalOcean") || v.asn.includes("Hetzner") ? "datacenter" : threat > 40 ? "suspicious" : "clean",
      firstSeen: v.first,
      lastSeen: v.last,
      requests: v.req,
      blocked: v.blocked,
    });
  }
  db.ipReputation.sort((a, b) => b.threatScore - a.threatScore);

  // --- Kurallar (sistem + özel) ---
  const ruleDefs: Array<Omit<Rule, "id" | "siteId" | "createdAt">> = [
    { name: "Düşük davranış skoru", description: "İnsanlık skoru 0.20'nin altındaki istekleri engelle", enabled: true, priority: 1, field: "score", op: "lt", value: "0.2", action: "block", hits: 0, system: true },
    { name: "Bilinen kötü ASN", description: "Kötü üne sahip barındırma/VPN ASN'lerini zorla", enabled: true, priority: 2, field: "asn", op: "contains", value: "VPN", action: "challenge", hits: 0, system: true },
    { name: "AI ajan tespiti", description: "GPT/Claude ajan imzalarını işaretle", enabled: true, priority: 3, field: "botClass", op: "eq", value: "ai_agent", action: "challenge", hits: 0, system: false },
    { name: "Kimlik doldurma koruması", description: "/login yolunda yüksek hızı engelle", enabled: true, priority: 4, field: "path", op: "eq", value: "/login", action: "challenge", hits: 0, system: false },
    { name: "Datacenter IP zorlaması", description: "Veri merkezi IP'lerini challenge'a tabi tut", enabled: true, priority: 5, field: "asn", op: "contains", value: "Amazon", action: "challenge", hits: 0, system: false },
    { name: "İyi botlara izin ver", description: "Googlebot/Bingbot'a izin ver", enabled: true, priority: 0, field: "botClass", op: "eq", value: "good_bot", action: "allow", hits: 0, system: true },
  ];
  for (const site of sites) {
    for (const r of ruleDefs) {
      db.rules.push({
        ...r,
        id: id("rule"),
        siteId: site.id,
        createdAt: site.createdAt,
        hits: Math.floor(rng() * 4000),
      });
    }
  }

  // --- Kampanyalar ---
  const campaignDefs = [
    { name: "Kimlik Doldurma Dalgası", botClass: "credential_stuffing" as BotClass, status: "mitigated" as const },
    { name: "Envanter Kazıma Botu", botClass: "scraper" as BotClass, status: "active" as const },
    { name: "GPT Ajan Sondajı", botClass: "ai_agent" as BotClass, status: "monitoring" as const },
    { name: "Katman-7 DDoS", botClass: "ddos" as BotClass, status: "mitigated" as const },
  ];
  campaignDefs.forEach((c, i) => {
    const total = 40000 + Math.floor(rng() * 500000);
    db.campaigns.push({
      id: id("camp"),
      siteId: sites[i % sites.length].id,
      name: c.name,
      botClass: c.botClass,
      status: c.status,
      startedAt: now - (2 + i * 3) * 86400000,
      peakRps: 200 + Math.floor(rng() * 8000),
      totalRequests: total,
      blockedRequests: Math.floor(total * (0.82 + rng() * 0.15)),
      topCountries: [COUNTRIES[Math.floor(rng() * 5)], COUNTRIES[Math.floor(rng() * 5)], COUNTRIES[Math.floor(rng() * 5)]],
      topAsns: [ASNS[7 + Math.floor(rng() * 4)], ASNS[7 + Math.floor(rng() * 4)]],
    });
  });

  // --- Ekip ---
  // (Uyarılardan ÖNCE üretilir; olaylara gerçek ekip üyeleri atanabilsin.)
  // Gerçekçi bir güvenlik ekibi: farklı rol/durum/görev/MFA + bekleyen davetler.
  interface UyeTanim {
    name: string;
    email: string;
    role: "owner" | "admin" | "analyst" | "viewer";
    status: "active" | "invited" | "suspended";
    title: string;
    mfa: boolean;
    /** Son aktivite kaç saat önce (aktif üyeler için). */
    aktifOnceSaat?: number;
    /** Davetli/askıda üyeler için: kaç gün önce davet edildi. */
    davetGunOnce?: number;
    /** Daveti gönderen üyenin adı. */
    invitedBy?: string;
    /** Rol-üstü ek izin (özel erişim rozeti için). */
    ekstraIzin?: TeamCapability[];
  }
  const teamDefs: UyeTanim[] = [
    { name: "Demo Geliştirici", email: "demo@specter.dev", role: "owner", status: "active", title: "Kurucu & Güvenlik Lideri", mfa: true, aktifOnceSaat: 0.2 },
    { name: "Elif Yılmaz", email: "elif@acme.com", role: "admin", status: "active", title: "Güvenlik Operasyon Yöneticisi", mfa: true, aktifOnceSaat: 1.5 },
    { name: "Mert Kaya", email: "mert@acme.com", role: "analyst", status: "active", title: "Kıdemli Tehdit Analisti", mfa: true, aktifOnceSaat: 3 },
    { name: "Can Öztürk", email: "can@acme.com", role: "analyst", status: "active", title: "Güvenlik Analisti", mfa: false, aktifOnceSaat: 26 },
    { name: "Selin Aydın", email: "selin@acme.com", role: "viewer", status: "active", title: "Uyum & Denetim Uzmanı", mfa: true, aktifOnceSaat: 52, ekstraIzin: ["incidents.resolve"] },
    { name: "Burak Şahin", email: "burak@acme.com", role: "viewer", status: "active", title: "Ürün Mühendisi", mfa: false, aktifOnceSaat: 120 },
    { name: "Deniz Arslan", email: "deniz@acme.com", role: "viewer", status: "suspended", title: "Eski Stajyer", mfa: false, aktifOnceSaat: 21 * 24 },
    // --- Bekleyen davetler ---
    { name: "Zeynep Demir", email: "zeynep@acme.com", role: "analyst", status: "invited", title: "Tehdit Analisti", mfa: false, davetGunOnce: 2, invitedBy: "Elif Yılmaz" },
    { name: "Kerem Doğan", email: "kerem@partner-soc.com", role: "admin", status: "invited", title: "Dış SOC Danışmanı", mfa: false, davetGunOnce: 5, invitedBy: "Demo Geliştirici" },
    { name: "Aslı Çelik", email: "asli@acme.com", role: "viewer", status: "invited", title: "Pazarlama", mfa: false, davetGunOnce: 6, invitedBy: "Elif Yılmaz" },
  ];
  const teamMembers = teamDefs.map((t, i) => {
    const davetli = t.status === "invited";
    const invitedAt = davetli && t.davetGunOnce != null ? now - t.davetGunOnce * 86400000 : undefined;
    const m: TeamMember = {
      id: id("tm"),
      ownerId: owner.id,
      name: t.name,
      email: t.email,
      role: t.role,
      avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
      status: t.status,
      title: t.title,
      mfaEnabled: t.mfa,
      permissions: t.ekstraIzin,
      lastActive: davetli
        ? (invitedAt ?? now)
        : now - Math.floor((t.aktifOnceSaat ?? rng() * 120) * 3600000),
      invitedAt,
      invitedBy: t.invitedBy,
      inviteExpiresAt: invitedAt != null ? invitedAt + 7 * 86400000 : undefined,
    };
    db.team.push(m);
    return m;
  });
  // Olaya atanabilir aktif üyeler (davetli/askıdakiler hariç).
  const atanabilir = teamMembers.filter((m) => m.status === "active");
  const uyeAdi = (mid: string | null) => teamMembers.find((m) => m.id === mid)?.name ?? "Sistem";

  // --- Uyarılar / Olaylar (Olay Yönetimi) ---
  // Gerçekçi bir SOC olay kuyruğu: farklı kategori/severity/priority/status,
  // bir kısmı atanmış, bir kısmı çözülmüş (MTTR hesaplanabilir), zaman
  // çizelgeli. sourceIp'ler yukarıdaki saldırgan IP'lerle örtüşür (tehdit
  // sayfasına link verilebilsin). Deterministik.
  const camps = db.campaigns; // yukarıda üretildi
  const kazimaCamp = camps.find((c) => c.botClass === "scraper");
  const kimlikCamp = camps.find((c) => c.botClass === "credential_stuffing");
  const ddosCamp = camps.find((c) => c.botClass === "ddos");
  const aiCamp = camps.find((c) => c.botClass === "ai_agent");

  interface OlayTanim {
    sev: AlertSeverity;
    pri: AlertPriority;
    cat: AlertCategory;
    title: string;
    msg: string;
    /** kaç saat önce açıldı */
    ago: number;
    status: AlertStatus;
    /** atanan üye indeksi (teamMembers içinde) ya da null */
    assigneeIdx: number | null;
    sourceIp?: string;
    campaignId?: string;
    /** açıldıktan kaç saat sonra onaylandı (ack) */
    ackAfter?: number;
    /** açıldıktan kaç saat sonra çözüldü (MTTR için) */
    resolveAfter?: number;
    /** ek not (olay geçmişine düşer) */
    notlar?: Array<{ afterH: number; byIdx: number; text: string }>;
  }

  const olayTanimlari: OlayTanim[] = [
    // --- Kritik / açık ---
    { sev: "critical", pri: "p1", cat: "saldiri", title: "Aktif kazıma kampanyası", msg: "acme-shop.com üzerinde /api/products yolunda 6.200 RPS scraper aktivitesi tespit edildi. Ürün kataloğu toplu çekiliyor.", ago: 0.05, status: "acik", assigneeIdx: null, sourceIp: "185.220.101.34", campaignId: kazimaCamp?.id },
    { sev: "critical", pri: "p1", cat: "saldiri", title: "Katman-7 DDoS dalgası", msg: "api.acme.com /api/checkout yolunda 8.400 RPS zirve; kaynak M247 (VPN) ASN yoğunluklu. Otomatik hız-sınırlama devrede.", ago: 0.6, status: "inceleniyor", assigneeIdx: 1, sourceIp: "193.42.33.14", campaignId: ddosCamp?.id, ackAfter: 0.15, notlar: [{ afterH: 0.3, byIdx: 1, text: "Sınır kural eşiği 3.000→1.500 RPS düşürüldü, engelleme oranı %94'e çıktı." }] },
    { sev: "high", pri: "p2", cat: "saldiri", title: "Kimlik doldurma dalgası", msg: "checkout.acme.com /login yolunda 340 IP'den 12 dk'da 18.000 başarısız oturum denemesi. Flokinet ASN ağırlıklı.", ago: 1.4, status: "inceleniyor", assigneeIdx: 2, sourceIp: "45.155.205.211", campaignId: kimlikCamp?.id, ackAfter: 0.4, notlar: [{ afterH: 0.8, byIdx: 2, text: "Etkilenen 3 hesap için parola sıfırlama tetiklendi; sızıntı listesiyle eşleşme yok." }] },
    { sev: "high", pri: "p2", cat: "anomali", title: "AI ajan trafiği artışı", msg: "GPTBot/ClaudeBot istekleri son 24 saatte %280 arttı; /api/graphql şema keşfi deseni gözlemlendi.", ago: 2.1, status: "acik", assigneeIdx: null, sourceIp: "104.244.76.187", campaignId: aiCamp?.id },
    { sev: "high", pri: "p2", cat: "saldiri", title: "Yeni kötü ASN görüldü", msg: "AS200651 Flokinet üzerinden ilk kez yoğun otomasyon trafiği; /wp-login.php ve /.env sondajı yapılıyor.", ago: 3.5, status: "acik", assigneeIdx: null, sourceIp: "89.248.165.52" },
    { sev: "high", pri: "p2", cat: "anomali", title: "Ghost-font başarısızlık artışı", msg: "Görünmez ghost-font challenge çözüm oranı %98'den %71'e düştü; olası yeni OCR bypass denemesi.", ago: 5, status: "inceleniyor", assigneeIdx: 1, ackAfter: 1, notlar: [{ afterH: 2, byIdx: 1, text: "Temporal dithering frekansı 12Hz→18Hz çıkarıldı; A/B başlatıldı." }] },

    // --- Orta ---
    { sev: "medium", pri: "p3", cat: "kota", title: "Doğrulama kotası %90", msg: "Aylık doğrulama kotanızın %90'ını kullandınız. Mevcut hızla 3 gün içinde limit dolacak.", ago: 8, status: "acik", assigneeIdx: null },
    { sev: "medium", pri: "p3", cat: "politika", title: "Kural yüksek false-positive", msg: "'Datacenter IP zorlaması' kuralı son 6 saatte %31 meşru trafiği challenge'a soktu. Gözden geçirilmeli.", ago: 9, status: "inceleniyor", assigneeIdx: 2, ackAfter: 1.5 },
    { sev: "medium", pri: "p3", cat: "anomali", title: "Coğrafi anomali", msg: "blog.acme.com trafiğinin %40'ı aniden VN/ID kaynaklı; normalde %3. Olası proxy havuzu.", ago: 11, status: "acik", assigneeIdx: null, sourceIp: "116.203.44.9" },
    { sev: "medium", pri: "p3", cat: "sistem", title: "Webhook teslim gecikmesi", msg: "https://acme.com/hooks/specter son 5 teslimatın 2'sinde 5xx döndü; yeniden deneme kuyruğu büyüyor.", ago: 14, status: "acik", assigneeIdx: null },
    { sev: "medium", pri: "p3", cat: "saldiri", title: "Spam kayıt dalgası", msg: "acme-shop.com /register yolunda tek fingerprint'ten 1.200 sahte kayıt denemesi (DigitalOcean ASN).", ago: 18, status: "acik", assigneeIdx: null, sourceIp: "159.65.221.78" },

    // --- Düşük ---
    { sev: "low", pri: "p4", cat: "sistem", title: "Yeni cihaz girişi", msg: "Ekip üyesi Elif Yılmaz yeni bir cihazdan (İstanbul) panele giriş yaptı.", ago: 20, status: "acik", assigneeIdx: null },
    { sev: "low", pri: "p4", cat: "politika", title: "Pasif kural birikimi", msg: "3 kural 30 gündür hiç tetiklenmedi. Sadeleştirme önerilir.", ago: 26, status: "yoksayildi", assigneeIdx: 2, notlar: [{ afterH: 1, byIdx: 2, text: "Bilinçli tutuluyor — mevsimsel kampanya kuralları. Yok sayıldı." }] },
    { sev: "low", pri: "p4", cat: "kota", title: "Kota %78", msg: "Aylık doğrulama kotanızın %78'ini kullandınız.", ago: 40, status: "yoksayildi", assigneeIdx: null },

    // --- Çözülmüş olaylar (MTTR hesabı için — son 30 gün) ---
    { sev: "critical", pri: "p1", cat: "saldiri", title: "Envanter kazıma botu durduruldu", msg: "acme-shop.com katalog kazıma kampanyası; 480K istek, %96 engellendi. Kaynak IP kalıcı engellendi.", ago: 30, status: "cozuldu", assigneeIdx: 1, sourceIp: "185.220.101.34", campaignId: kazimaCamp?.id, ackAfter: 0.3, resolveAfter: 3.2, notlar: [{ afterH: 1, byIdx: 1, text: "IP bloğu + ASN challenge kuralı eklendi." }, { afterH: 3, byIdx: 1, text: "Trafik normale döndü, kampanya kapatıldı." }] },
    { sev: "high", pri: "p2", cat: "saldiri", title: "Kimlik doldurma püskürtüldü", msg: "checkout.acme.com'a 26K deneme; hız-sınır + challenge ile %99 engellendi. Sıfır hesap ele geçirildi.", ago: 52, status: "cozuldu", assigneeIdx: 2, sourceIp: "141.98.11.29", ackAfter: 0.5, resolveAfter: 5.5 },
    { sev: "high", pri: "p2", cat: "anomali", title: "AI ajan sondajı yatıştırıldı", msg: "GPTBot şema keşfi; robots + challenge politikası uygulandı, istekler %88 azaldı.", ago: 74, status: "cozuldu", assigneeIdx: 1, sourceIp: "104.244.76.187", campaignId: aiCamp?.id, ackAfter: 1.2, resolveAfter: 8 },
    { sev: "medium", pri: "p3", cat: "politika", title: "Kural eşiği kalibre edildi", msg: "Davranış skoru eşiği 0.20→0.28; false-positive %31→%4'e indi.", ago: 96, status: "cozuldu", assigneeIdx: 2, ackAfter: 2, resolveAfter: 6.5 },
    { sev: "medium", pri: "p3", cat: "sistem", title: "Webhook sağlığı düzeltildi", msg: "Alıcı uçtaki 5xx giderildi; yeniden deneme kuyruğu boşaldı.", ago: 130, status: "cozuldu", assigneeIdx: 1, ackAfter: 3, resolveAfter: 10 },
    { sev: "critical", pri: "p1", cat: "saldiri", title: "Katman-7 DDoS azaltıldı", msg: "api.acme.com'a 11K RPS zirve; anycast + hız-sınır ile hizmet kesintisiz kaldı.", ago: 168, status: "cozuldu", assigneeIdx: 1, sourceIp: "193.42.33.14", campaignId: ddosCamp?.id, ackAfter: 0.2, resolveAfter: 4 },
    { sev: "low", pri: "p4", cat: "kota", title: "Kota uyarısı kapatıldı", msg: "Plan yükseltmesi sonrası kota %52'ye düştü.", ago: 200, status: "cozuldu", assigneeIdx: null, ackAfter: 1, resolveAfter: 2 },
    { sev: "medium", pri: "p3", cat: "anomali", title: "Coğrafi anomali çözüldü", msg: "VN/ID proxy havuzu ASN bazında engellendi; trafik dağılımı normale döndü.", ago: 240, status: "cozuldu", assigneeIdx: 2, sourceIp: "116.203.44.9", ackAfter: 1.5, resolveAfter: 7 },
    { sev: "high", pri: "p2", cat: "saldiri", title: "Sahte kayıt dalgası engellendi", msg: "/register spam botu fingerprint + rate kuralıyla durduruldu; 1.2K sahte kayıt önlendi.", ago: 300, status: "cozuldu", assigneeIdx: 1, sourceIp: "159.65.221.78", ackAfter: 0.8, resolveAfter: 3.5 },
    { sev: "medium", pri: "p3", cat: "sistem", title: "Sertifika yenileme uyarısı", msg: "acme-shop.com TLS sertifikası otomatik yenilendi.", ago: 360, status: "cozuldu", assigneeIdx: null, ackAfter: 0.5, resolveAfter: 1 },
    { sev: "low", pri: "p4", cat: "politika", title: "Kural içe aktarımı", msg: "OWASP CRS tabanlı 12 kural içe aktarıldı ve etkinleştirildi.", ago: 420, status: "cozuldu", assigneeIdx: 2, ackAfter: 1, resolveAfter: 4 },
    { sev: "high", pri: "p2", cat: "anomali", title: "Fingerprint çakışması giderildi", msg: "Aynı fingerprint'ten 40 farklı IP; bot ağı tespit edilip challenge'a alındı.", ago: 500, status: "cozuldu", assigneeIdx: 1, ackAfter: 0.6, resolveAfter: 5 },
  ];

  olayTanimlari.forEach((o, i) => {
    const acildi = now - o.ago * 3600000;
    const assigneeId = o.assigneeIdx != null ? teamMembers[o.assigneeIdx].id : null;
    const timeline: AlertTimelineEntry[] = [
      { ts: acildi, actor: "Sistem", action: "oluşturuldu", note: "Otomatik tespit motoru tarafından açıldı." },
    ];
    let acknowledgedAt: number | undefined;
    let resolvedAt: number | undefined;

    // Onay (ack)
    if (o.ackAfter != null && assigneeId) {
      acknowledgedAt = acildi + o.ackAfter * 3600000;
      timeline.push({ ts: acknowledgedAt, actor: uyeAdi(assigneeId), action: "onayladı", note: "Olay onaylandı, inceleme başlatıldı." });
    }
    // Atama kaydı
    if (assigneeId) {
      timeline.push({ ts: acildi + (o.ackAfter ?? 0.05) * 3600000, actor: uyeAdi(assigneeId), action: "atandı", note: `${uyeAdi(assigneeId)} üzerine alındı.` });
    }
    // Notlar
    (o.notlar ?? []).forEach((n) => {
      timeline.push({ ts: acildi + n.afterH * 3600000, actor: teamMembers[n.byIdx].name, action: "not", note: n.text });
    });
    // Durum geçişleri
    if (o.status === "inceleniyor") {
      timeline.push({ ts: acildi + (o.ackAfter ?? 0.2) * 3600000, actor: uyeAdi(assigneeId), action: "durum:inceleniyor", note: "İncelemeye alındı." });
    }
    if (o.status === "yoksayildi") {
      timeline.push({ ts: acildi + 0.5 * 3600000, actor: uyeAdi(assigneeId), action: "durum:yoksayildi", note: "Aksiyon gerektirmiyor olarak işaretlendi." });
    }
    if (o.status === "cozuldu" && o.resolveAfter != null) {
      resolvedAt = acildi + o.resolveAfter * 3600000;
      timeline.push({ ts: resolvedAt, actor: uyeAdi(assigneeId), action: "durum:cozuldu", note: "Olay çözüldü ve kapatıldı." });
    }
    timeline.sort((a, b) => a.ts - b.ts);

    db.alerts.push({
      id: id("alert"),
      siteId: sites[i % sites.length].id,
      severity: o.sev,
      title: o.title,
      message: o.msg,
      ts: acildi,
      // Açık/inceleme olayları çoğunlukla okunmamış; çözülmüş/yoksayılmış okunmuş.
      read: o.status === "cozuldu" || o.status === "yoksayildi",
      category: o.cat,
      status: o.status,
      assignee: assigneeId,
      priority: o.pri,
      sourceIp: o.sourceIp,
      relatedCampaignId: o.campaignId,
      timeline,
      acknowledgedAt,
      resolvedAt,
    });
  });
  // Kampanya ve ekip yukarıda; olaylar en yeni üstte gelsin diye ts'e göre repo sıralar.
  void atanabilir;

  // --- Denetim günlüğü (uyum/compliance seviyesi) ---
  // Gerçek bir SOC/uyum denetim izi: 40+ işlem, farklı kategori (auth/site/
  // rule/team/ai-policy/billing/token/webhook), gerçek aktörler (ekipten),
  // kritik işlem işareti, önceki→sonraki değer ve DEĞİŞMEZLİK HASH ZİNCİRİ.
  // Her kayıt bir öncekinin hash'ini içerir → tek satır oynatılırsa zincir
  // kırılır (WORM/append-only denetim defteri iması). Deterministik.
  interface DenetimTanim {
    cat: AuditCategory;
    action: string;
    target: string;
    ago: number; // saat önce
    /** işlemi yapan ekip üyesi indeksi (teamMembers). 0 = owner. */
    byIdx?: number;
    critical?: boolean;
    onceki?: string;
    sonraki?: string;
    meta?: Record<string, string>;
    /** aktör IP'si (yoksa deterministik türetilir). */
    ip?: string;
  }
  // En yeni ÜSTTE olacak şekilde sıraladığımız için zincir en eskiden (alt)
  // başlar; aşağıda ago'ya göre artan sıralayıp seq/hash veririz.
  const denetimTanimlari: DenetimTanim[] = [
    // auth
    { cat: "auth", action: "oturum.giriş", target: "panel", ago: 0.1, byIdx: 0, meta: { yontem: "parola + TOTP", konum: "İstanbul, TR" } },
    { cat: "auth", action: "oturum.giriş", target: "panel", ago: 1.6, byIdx: 1, meta: { yontem: "parola + TOTP", konum: "İstanbul, TR" } },
    { cat: "auth", action: "2fa.etkinleştir", target: "Mert Kaya", ago: 30, byIdx: 2, critical: true, onceki: "Kapalı", sonraki: "TOTP (Authenticator)" },
    { cat: "auth", action: "oturum.başarısız", target: "panel", ago: 44, byIdx: 0, critical: true, meta: { neden: "hatalı 2FA kodu", deneme: "2/5" }, ip: "88.240.12.77" },
    { cat: "auth", action: "parola.değiştir", target: "Can Öztürk", ago: 96, byIdx: 3 },
    { cat: "auth", action: "oturum.çıkış", target: "panel", ago: 120, byIdx: 5 },

    // site
    { cat: "site", action: "site.oluştur", target: "api.acme.com", ago: 45 * 24, byIdx: 0, meta: { zorluk: "high", mod: "block" } },
    { cat: "site", action: "site.mod-değiştir", target: "blog.acme.com", ago: 30 * 24, byIdx: 1, onceki: "challenge", sonraki: "monitor", meta: { neden: "false-positive azaltma" } },
    { cat: "site", action: "site.mod-değiştir", target: "checkout.acme.com", ago: 6, byIdx: 1, critical: true, onceki: "challenge", sonraki: "block", meta: { neden: "aktif DDoS" } },
    { cat: "site", action: "site.eşik-güncelle", target: "acme-shop.com", ago: 52, byIdx: 2, onceki: "0.35", sonraki: "0.42", meta: { alan: "davranış eşiği" } },
    { cat: "site", action: "site.görünmez-mod", target: "api.acme.com", ago: 88, byIdx: 1, onceki: "Kapalı", sonraki: "Açık" },
    { cat: "site", action: "site.alan-ekle", target: "acme-shop.com", ago: 200, byIdx: 0, onceki: "1 alan", sonraki: "www.acme-shop.com eklendi" },

    // rule
    { cat: "rule", action: "kural.güncelle", target: "AI ajan tespiti", ago: 0.5, byIdx: 2, onceki: "action: challenge", sonraki: "action: block", meta: { öncelik: "3" } },
    { cat: "rule", action: "kural.devre-dışı", target: "Datacenter IP zorlaması", ago: 8, byIdx: 2, critical: true, onceki: "Etkin", sonraki: "Devre dışı", meta: { neden: "%31 false-positive" } },
    { cat: "rule", action: "kural.şablon-ekle", target: "AI ajanlarını işaretle", ago: 20, byIdx: 1, meta: { şablon: "ai-agents", site: "blog.acme.com" } },
    { cat: "rule", action: "kural.oluştur", target: "Kimlik doldurma koruması", ago: 74, byIdx: 2, meta: { alan: "path", değer: "/login", action: "challenge" } },
    { cat: "rule", action: "kural.öncelik-değiştir", target: "Düşük davranış skoru", ago: 130, byIdx: 1, onceki: "3", sonraki: "1" },
    { cat: "rule", action: "kural.sil", target: "Eski coğrafya kuralı", ago: 260, byIdx: 2, critical: true, meta: { neden: "kullanılmıyor" } },
    { cat: "rule", action: "kural.içe-aktar", target: "OWASP CRS (12 kural)", ago: 420, byIdx: 2, meta: { kaynak: "owasp-crs-4.0" } },

    // ai-policy
    { cat: "ai-policy", action: "ai.politika-değiştir", target: "GPTBot (OpenAI)", ago: 3, byIdx: 0, critical: true, onceki: "Doğrula", sonraki: "Engelle", meta: { kategori: "Model eğitimi", risk: "Yüksek" } },
    { cat: "ai-policy", action: "ai.politika-değiştir", target: "ClaudeBot (Anthropic)", ago: 3.1, byIdx: 0, onceki: "Doğrula", sonraki: "Engelle", meta: { kategori: "Model eğitimi" } },
    { cat: "ai-policy", action: "ai.politika-değiştir", target: "Bytespider (ByteDance)", ago: 26, byIdx: 1, critical: true, onceki: "Doğrula", sonraki: "Engelle", meta: { risk: "Kritik", neden: "robots.txt ihlali" } },
    { cat: "ai-policy", action: "ai.politika-değiştir", target: "OAI-SearchBot (OpenAI)", ago: 50, byIdx: 1, onceki: "Engelle", sonraki: "İzin ver", meta: { neden: "arama görünürlüğü" } },
    { cat: "ai-policy", action: "ai.politika-değiştir", target: "PerplexityBot (Perplexity)", ago: 140, byIdx: 2, onceki: "İzin ver", sonraki: "Doğrula" },

    // team
    { cat: "team", action: "üye.davet", target: "zeynep@acme.com", ago: 5 * 24, byIdx: 1, meta: { rol: "analyst", davet_eden: "Elif Yılmaz" } },
    { cat: "team", action: "üye.davet", target: "kerem@partner-soc.com", ago: 5 * 24, byIdx: 0, critical: true, meta: { rol: "admin", neden: "dış SOC danışmanı" } },
    { cat: "team", action: "üye.rol-değiştir", target: "Can Öztürk", ago: 72, byIdx: 0, critical: true, onceki: "viewer", sonraki: "analyst" },
    { cat: "team", action: "üye.askıya-al", target: "Deniz Arslan", ago: 21 * 24, byIdx: 0, critical: true, onceki: "active", sonraki: "suspended", meta: { neden: "staj bitişi" } },
    { cat: "team", action: "üye.izin-ver", target: "Selin Aydın", ago: 300, byIdx: 0, onceki: "viewer varsayılan", sonraki: "+ incidents.resolve" },

    // token
    { cat: "token", action: "anahtar.döndür", target: "checkout.acme.com secret", ago: 3 * 24, byIdx: 0, critical: true, meta: { ortam: "live", neden: "planlı rotasyon" } },
    { cat: "token", action: "anahtar.oluştur", target: "Prodüksiyon sunucusu", ago: 40 * 24, byIdx: 0, meta: { ortam: "live", kapsam: "verify, siteverify, analytics:read" } },
    { cat: "token", action: "anahtar.iptal", target: "Eski entegrasyon", ago: 30 * 24, byIdx: 1, critical: true, onceki: "Etkin", sonraki: "İptal edildi" },
    { cat: "token", action: "anahtar.oluştur", target: "CI/CD pipeline", ago: 20 * 24, byIdx: 3, meta: { ortam: "live", kapsam: "sites:read" } },

    // webhook
    { cat: "webhook", action: "webhook.oluştur", target: "https://acme.com/hooks/specter", ago: 12 * 24, byIdx: 1, meta: { olaylar: "bot.blocked, campaign.started" } },
    { cat: "webhook", action: "webhook.test", target: "https://api.acme.com/internal/security-events", ago: 14, byIdx: 3, meta: { durum: "200 OK", süre: "84ms" } },
    { cat: "webhook", action: "webhook.devre-dışı", target: "https://acme.com/legacy/webhook-old", ago: 60 * 24, byIdx: 1, onceki: "Etkin", sonraki: "Devre dışı", meta: { neden: "sürekli 5xx" } },

    // billing
    { cat: "billing", action: "plan.yükselt", target: "Pro plan", ago: 200, byIdx: 0, critical: true, onceki: "Free", sonraki: "Pro", meta: { tutar: "$99/ay", döngü: "aylık" } },
    { cat: "billing", action: "fatura.öde", target: "Temmuz 2026 faturası", ago: 15 * 24, byIdx: 0, meta: { tutar: "$99.00", yöntem: "•••• 4242" } },
    { cat: "billing", action: "kota.artır", target: "Aylık doğrulama kotası", ago: 180, byIdx: 0, onceki: "1M/ay", sonraki: "5M/ay" },
    { cat: "billing", action: "ödeme-yöntemi.güncelle", target: "Kredi kartı", ago: 220, byIdx: 0, critical: true, onceki: "•••• 1111", sonraki: "•••• 4242" },
  ];

  // ago'ya göre artan (en eski önce) sıralayıp değişmezlik zincirini kur.
  const sirali = [...denetimTanimlari].sort((a, b) => b.ago - a.ago);
  let prevHash = "genesis";
  const denetimKayitlari: AuditLog[] = sirali.map((a, i) => {
    const uye = a.byIdx != null ? teamMembers[a.byIdx] : owner;
    const ts = now - a.ago * 3600000;
    const seq = i + 1;
    const ip = a.ip ?? "88.240.12." + (10 + Math.floor(rng() * 240));
    // İçerik hash'i: kaydın anlamlı alanları + önceki hash → zincir.
    const govde = JSON.stringify({ seq, actor: uye.id, action: a.action, target: a.target, ts, prevHash });
    const hash = crypto.createHash("sha256").update(govde).digest("hex").slice(0, 16);
    const kayit: AuditLog = {
      id: id("audit"),
      actorId: uye.id,
      actorName: uye.name,
      action: a.action,
      target: a.target,
      ts,
      ip,
      category: a.cat,
      seq,
      hash,
      prevHash,
      critical: a.critical ?? false,
      onceki: a.onceki,
      sonraki: a.sonraki,
      meta: a.meta,
    };
    prevHash = hash;
    return kayit;
  });
  // Repo/istemci en yeni üstte bekliyor → ts azalan.
  denetimKayitlari.sort((a, b) => b.ts - a.ts);
  db.auditLogs.push(...denetimKayitlari);

  // --- API anahtarları (canlı + test ortamı, gerçekçi kullanım) ---
  const tokenDefs: Array<{
    name: string;
    env: "live" | "test";
    scopes: string[];
    createdAgo: number; // gün
    lastUsedAgo: number | null; // ms
    req30: number;
    revoked?: boolean;
  }> = [
    { name: "Prodüksiyon sunucusu", env: "live", scopes: ["verify", "siteverify", "analytics:read"], createdAgo: 40, lastUsedAgo: 120000, req30: 1_284_500 },
    { name: "CI/CD pipeline", env: "live", scopes: ["sites:read"], createdAgo: 20, lastUsedAgo: 8 * 3600000, req30: 12_400 },
    { name: "Yerel geliştirme", env: "test", scopes: ["verify", "siteverify"], createdAgo: 12, lastUsedAgo: 40 * 60000, req30: 3_920 },
    { name: "Staging ortamı", env: "test", scopes: ["verify", "analytics:read"], createdAgo: 8, lastUsedAgo: 26 * 3600000, req30: 860 },
    { name: "Eski entegrasyon (döndürüldü)", env: "live", scopes: ["verify"], createdAgo: 96, lastUsedAgo: 30 * 86400000, req30: 0, revoked: true },
  ];
  tokenDefs.forEach((t) => {
    db.apiTokens.push({
      id: id("tok"),
      ownerId: owner.id,
      name: t.name,
      prefix: `sk_${t.env}_` + crypto.randomBytes(6).toString("hex"),
      scopes: t.scopes,
      environment: t.env,
      createdAt: now - t.createdAgo * 86400000,
      lastUsed: t.lastUsedAgo == null ? null : now - t.lastUsedAgo,
      requests30d: t.req30,
      revoked: t.revoked ?? false,
    });
  });

  // --- Webhooks (birden çok endpoint + gerçek teslim logları) ---
  const EVENT_KATALOG = [
    "verification.passed", "verification.failed", "bot.blocked",
    "ai_agent.detected", "campaign.started", "rule.triggered", "quota.warning",
  ];
  const whDefs: Array<{
    siteIdx: number;
    url: string;
    events: string[];
    active: boolean;
    createdAgo: number; // gün
    /** son teslimler: [kaç saat önce, durum kodu, deneme] */
    teslimler: Array<[number, number, number]>;
  }> = [
    {
      siteIdx: 0,
      url: "https://acme.com/hooks/specter",
      events: ["bot.blocked", "campaign.started", "quota.warning"],
      active: true,
      createdAgo: 12,
      teslimler: [[0.4, 200, 1], [2, 200, 1], [5, 200, 1], [9, 200, 1], [14, 200, 1], [22, 200, 1]],
    },
    {
      siteIdx: 2,
      url: "https://api.acme.com/internal/security-events",
      events: ["verification.failed", "bot.blocked", "ai_agent.detected", "rule.triggered"],
      active: true,
      createdAgo: 8,
      teslimler: [[0.2, 200, 1], [1.5, 500, 3], [1.5, 500, 2], [1.5, 200, 1], [6, 200, 1], [11, 429, 2], [11, 200, 1]],
    },
    {
      siteIdx: 1,
      url: "https://hooks.slack.com/services/T00/B00/specter-alerts",
      events: ["campaign.started", "ai_agent.detected"],
      active: true,
      createdAgo: 20,
      teslimler: [[3, 200, 1], [30, 200, 1], [54, 200, 1]],
    },
    {
      siteIdx: 3,
      url: "https://acme.com/legacy/webhook-old",
      events: ["verification.passed"],
      active: false,
      createdAgo: 60,
      teslimler: [[48, 0, 5], [48, 0, 4], [48, 0, 3]],
    },
  ];
  whDefs.forEach((w) => {
    const teslimler = w.teslimler.map(([agoH, status, attempt]) => ({
      id: id("whd"),
      event: EVENT_KATALOG[Math.floor(rng() * EVENT_KATALOG.length)],
      status,
      ts: now - agoH * 3600000,
      attempt,
      durationMs: 40 + Math.floor(rng() * 240),
    }));
    teslimler.sort((a, b) => a.ts - b.ts);
    const son = teslimler[teslimler.length - 1];
    db.webhooks.push({
      id: id("wh"),
      siteId: sites[w.siteIdx].id,
      url: w.url,
      events: w.events,
      active: w.active,
      secret: "whsec_" + crypto.randomBytes(16).toString("hex"),
      createdAt: now - w.createdAgo * 86400000,
      lastDelivery: son ? son.ts : null,
      lastStatus: son ? son.status : null,
      deliveries: teslimler,
    });
  });

  // --- Asistan karşılama ---
  db.assistant.push({
    id: id("msg"),
    ownerId: owner.id,
    role: "assistant",
    content:
      "Merhaba! Ben Veylify Zeka. Trafiğinizi, tehditleri ve kurallarınızı analiz edebilirim. Örneğin: \"Son 24 saatte en çok hangi ülkeden bot geldi?\" veya \"Kimlik doldurma saldırısını nasıl durdururum?\" diye sorabilirsiniz.",
    ts: now - 86400000,
  });

  // --- Zamanlanmış raporlar (otomatik rapor takvimi) ---
  // Gerçek bir SOC ekibinin kurduğu düzenli rapor akışı: farklı tür/sıklık/
  // format/alıcı, bir kısmı duraklatılmış. Deterministik.
  interface ZamanTanim {
    type: ReportType;
    name: string;
    frequency: ReportFrequency;
    format: ReportFormat;
    recipients: string[];
    siteIdx: number | null;
    active: boolean;
    /** kaç gün önce oluşturuldu */
    createdGunOnce: number;
    /** en son kaç gün önce çalıştı (null = hiç) */
    lastRunGunOnce: number | null;
  }
  function sonrakiCalismaSeed(freq: ReportFrequency, base: number): number {
    const gun = 86400000;
    if (freq === "gunluk") return base + gun;
    if (freq === "haftalik") return base + 7 * gun;
    return base + 30 * gun;
  }
  const zamanTanimlari: ZamanTanim[] = [
    { type: "haftalik_ozet", name: "Haftalık güvenlik özeti", frequency: "haftalik", format: "pdf", recipients: ["elif@acme.com", "demo@specter.dev"], siteIdx: null, active: true, createdGunOnce: 60, lastRunGunOnce: 3 },
    { type: "aylik_tehdit", name: "Aylık tehdit raporu — Yönetim", frequency: "aylik", format: "pdf", recipients: ["demo@specter.dev"], siteIdx: null, active: true, createdGunOnce: 90, lastRunGunOnce: 12 },
    { type: "ai_ajan", name: "AI ajan aktivite raporu", frequency: "haftalik", format: "csv", recipients: ["mert@acme.com"], siteIdx: 0, active: true, createdGunOnce: 30, lastRunGunOnce: 5 },
    { type: "uyum_denetim", name: "Uyum/denetim izi — SOC2", frequency: "aylik", format: "json", recipients: ["selin@acme.com", "demo@specter.dev"], siteIdx: null, active: true, createdGunOnce: 45, lastRunGunOnce: 12 },
    { type: "bot_trafik", name: "Günlük bot trafiği (checkout)", frequency: "gunluk", format: "csv", recipients: ["mert@acme.com", "can@acme.com"], siteIdx: 1, active: false, createdGunOnce: 20, lastRunGunOnce: 8 },
  ];
  zamanTanimlari.forEach((z) => {
    const createdAt = now - z.createdGunOnce * 86400000;
    const lastRunAt = z.lastRunGunOnce == null ? null : now - z.lastRunGunOnce * 86400000;
    db.scheduledReports.push({
      id: id("srep"),
      ownerId: owner.id,
      type: z.type,
      name: z.name,
      frequency: z.frequency,
      format: z.format,
      recipients: z.recipients,
      siteId: z.siteIdx == null ? null : sites[z.siteIdx].id,
      active: z.active,
      createdAt,
      nextRunAt: z.active ? sonrakiCalismaSeed(z.frequency, lastRunAt ?? createdAt) : sonrakiCalismaSeed(z.frequency, now),
      lastRunAt,
    });
  });

  // --- Rapor geçmişi (üretilmiş rapor arşivi) ---
  interface GecmisTanim {
    type: ReportType;
    name: string;
    periodDays: number;
    format: ReportFormat;
    sizeKb: number;
    byIdx: number; // teamMembers indeksi
    agoSaat: number;
    scheduled?: boolean;
  }
  const gecmisTanimlari: GecmisTanim[] = [
    { type: "haftalik_ozet", name: "Haftalık güvenlik özeti", periodDays: 7, format: "pdf", sizeKb: 284, byIdx: 0, agoSaat: 3 * 24, scheduled: true },
    { type: "aylik_tehdit", name: "Aylık tehdit raporu — Yönetim", periodDays: 30, format: "pdf", sizeKb: 612, byIdx: 0, agoSaat: 12 * 24, scheduled: true },
    { type: "ai_ajan", name: "AI ajan aktivite raporu", periodDays: 7, format: "csv", sizeKb: 48, byIdx: 2, agoSaat: 5 * 24, scheduled: true },
    { type: "kampanya_analiz", name: "Kampanya sonrası analiz — Kimlik Doldurma", periodDays: 30, format: "pdf", sizeKb: 421, byIdx: 1, agoSaat: 9 },
    { type: "bot_trafik", name: "Bot trafiği analizi — acme-shop.com", periodDays: 30, format: "csv", sizeKb: 156, byIdx: 2, agoSaat: 26 },
    { type: "uyum_denetim", name: "Uyum/denetim izi — SOC2", periodDays: 90, format: "json", sizeKb: 92, byIdx: 4, agoSaat: 12 * 24, scheduled: true },
    { type: "aylik_tehdit", name: "Aylık tehdit raporu — Haziran", periodDays: 30, format: "pdf", sizeKb: 587, byIdx: 0, agoSaat: 40 * 24, scheduled: true },
    { type: "bot_trafik", name: "Bot trafiği analizi — Tüm siteler", periodDays: 90, format: "json", sizeKb: 340, byIdx: 1, agoSaat: 60 },
  ];
  gecmisTanimlari.forEach((g) => {
    db.reportHistory.push({
      id: id("rhist"),
      ownerId: owner.id,
      type: g.type,
      name: g.name,
      periodDays: g.periodDays,
      format: g.format,
      sizeBytes: g.sizeKb * 1024,
      createdBy: teamMembers[g.byIdx]?.name ?? owner.name,
      createdAt: now - g.agoSaat * 3600000,
      scheduledReportId: g.scheduled ? "seed-zamanlanmis" : undefined,
    });
  });
  db.reportHistory.sort((a, b) => b.createdAt - a.createdAt);

  // --- Denemeler (A/B Test / Deneme Çerçevesi) ---
  // Gerçek bir güvenlik ekibinin koruma yapılandırmasını (zorluk, davranış
  // eşiği, görünmez mod, trafik bölünmesi) A/B test etmesi. Deterministik
  // sonuç metrikleri: her variant için gösterim/geçiş/engellenen/ortSkor.
  // Bir tanesi çalışıyor+kısmi sonuç, biri tamamlanmış+kazanan, biri taslak.
  interface DeneyTanim {
    name: string;
    siteIdx: number;
    metric: "surtunme" | "guvenlik" | "donusum";
    status: "taslak" | "calisiyor" | "tamam" | "durduruldu";
    A: { difficulty: "low" | "medium" | "high"; behaviorThreshold: number; invisibleMode: boolean; trafik: number };
    B: { difficulty: "low" | "medium" | "high"; behaviorThreshold: number; invisibleMode: boolean; trafik: number };
    /** kaç gün önce oluşturuldu */
    createdGunOnce: number;
    /** kaç gün önce başladı (null = taslak, henüz başlamadı) */
    startedGunOnce: number | null;
    /** kaç gün önce bitti (null = devam ediyor) */
    endedGunOnce: number | null;
    winner: "A" | "B" | null;
    /** variant başına toplam gösterim (0 = taslak, sonuç yok) */
    gosterimA: number;
    gosterimB: number;
    /** variant başına geçiş oranı (0..1) — geçis = round(gosterim*oran) */
    gecisOranA: number;
    gecisOranB: number;
    /** variant başına ortalama insanlık skoru (0..1) */
    ortSkorA: number;
    ortSkorB: number;
  }
  const deneyTanimlari: DeneyTanim[] = [
    // Çalışıyor — kısmi sonuç. Görünmez mod sürtünmeyi düşürüyor mu?
    {
      name: "Görünmez mod — sürtünme testi",
      siteIdx: 0,
      metric: "surtunme",
      status: "calisiyor",
      A: { difficulty: "medium", behaviorThreshold: 0.35, invisibleMode: false, trafik: 50 },
      B: { difficulty: "medium", behaviorThreshold: 0.35, invisibleMode: true, trafik: 50 },
      createdGunOnce: 6,
      startedGunOnce: 5,
      endedGunOnce: null,
      winner: null,
      gosterimA: 8420,
      gosterimB: 8610,
      gecisOranA: 0.883,
      gecisOranB: 0.941,
      ortSkorA: 0.71,
      ortSkorB: 0.74,
    },
    // Tamamlanmış — kazanan B. Yüksek zorluk + eşik güvenliği artırdı mı?
    {
      name: "Yüksek zorluk — checkout güvenliği",
      siteIdx: 1,
      metric: "guvenlik",
      status: "tamam",
      A: { difficulty: "medium", behaviorThreshold: 0.5, invisibleMode: true, trafik: 50 },
      B: { difficulty: "high", behaviorThreshold: 0.62, invisibleMode: true, trafik: 50 },
      createdGunOnce: 22,
      startedGunOnce: 21,
      endedGunOnce: 8,
      winner: "B",
      gosterimA: 24180,
      gosterimB: 24020,
      gecisOranA: 0.64,
      gecisOranB: 0.52,
      ortSkorA: 0.44,
      ortSkorB: 0.39,
    },
    // Tamamlanmış — kazanan A (eşik düşürmek dönüşümü korudu, kabul edildi).
    {
      name: "Davranış eşiği kalibrasyonu",
      siteIdx: 0,
      metric: "donusum",
      status: "tamam",
      A: { difficulty: "medium", behaviorThreshold: 0.28, invisibleMode: true, trafik: 60 },
      B: { difficulty: "medium", behaviorThreshold: 0.42, invisibleMode: true, trafik: 40 },
      createdGunOnce: 40,
      startedGunOnce: 38,
      endedGunOnce: 26,
      winner: "A",
      gosterimA: 31200,
      gosterimB: 20640,
      gecisOranA: 0.92,
      gecisOranB: 0.79,
      ortSkorA: 0.68,
      ortSkorB: 0.66,
    },
    // Taslak — henüz başlatılmadı, sonuç yok.
    {
      name: "API zorlama — kural seti denemesi",
      siteIdx: 2,
      metric: "guvenlik",
      status: "taslak",
      A: { difficulty: "high", behaviorThreshold: 0.5, invisibleMode: true, trafik: 50 },
      B: { difficulty: "high", behaviorThreshold: 0.6, invisibleMode: false, trafik: 50 },
      createdGunOnce: 1,
      startedGunOnce: null,
      endedGunOnce: null,
      winner: null,
      gosterimA: 0,
      gosterimB: 0,
      gecisOranA: 0,
      gecisOranB: 0,
      ortSkorA: 0,
      ortSkorB: 0,
    },
  ];
  deneyTanimlari.forEach((d) => {
    const gecisA = Math.round(d.gosterimA * d.gecisOranA);
    const gecisB = Math.round(d.gosterimB * d.gecisOranB);
    db.experiments.push({
      id: id("exp"),
      ownerId: owner.id,
      siteId: sites[d.siteIdx].id,
      name: d.name,
      status: d.status,
      metric: d.metric,
      variantA: d.A,
      variantB: d.B,
      results: {
        A: { gosterim: d.gosterimA, gecis: gecisA, engellenen: d.gosterimA - gecisA, ortSkor: d.ortSkorA },
        B: { gosterim: d.gosterimB, gecis: gecisB, engellenen: d.gosterimB - gecisB, ortSkor: d.ortSkorB },
      },
      createdAt: now - d.createdGunOnce * 86400000,
      startedAt: d.startedGunOnce == null ? null : now - d.startedGunOnce * 86400000,
      endedAt: d.endedGunOnce == null ? null : now - d.endedGunOnce * 86400000,
      winner: d.winner,
    });
  });

  // Örnek entegrasyonlar (Slack + Discord) — demo hesaba.
  db.integrations.push(
    {
      id: id("int"), ownerId: owner.id, tur: "slack", ad: "Güvenlik kanalı",
      hedef: "https://hooks.slack.com/services/T0XXX/B0XXX/demoWebhook",
      olaylar: ["bot.blocked", "campaign.started", "anomaly.detected"],
      aktif: true, createdAt: now - 12 * 86400000, lastDelivery: now - 3 * 3600000, lastStatus: 200, gonderilen: 847,
    },
    {
      id: id("int"), ownerId: owner.id, tur: "discord", ad: "Ops bildirimleri",
      hedef: "https://discord.com/api/webhooks/000/demoDiscordHook",
      olaylar: ["ai_agent.detected", "quota.warning"],
      aktif: true, createdAt: now - 6 * 86400000, lastDelivery: now - 40 * 60000, lastStatus: 204, gonderilen: 213,
    },
  );

  // --- Promo kodlar (indirim kuponları) ---
  // Gerçek başlangıç kuponları: yüzde + sabit, sınırlı/sınırsız kullanım,
  // yaklaşan son kullanma, plan kısıtı. Deterministik.
  interface PromoTanim {
    kod: string;
    tur: "yuzde" | "sabit";
    deger: number;
    aciklama: string;
    maxKullanim: number | null;
    kullanilan: number;
    sonKullanmaGunSonra: number | null; // kaç gün sonra sona erer (null = süresiz)
    aktif: boolean;
    planKisiti: "hepsi" | "pro" | "scale";
    createdGunOnce: number;
  }
  const promoTanimlari: PromoTanim[] = [
    { kod: "LANSMAN30", tur: "yuzde", deger: 30, aciklama: "Lansman kampanyası — tüm planlarda %30 indirim", maxKullanim: 500, kullanilan: 87, sonKullanmaGunSonra: 60, aktif: true, planKisiti: "hepsi", createdGunOnce: 20 },
    { kod: "HOSGELDIN", tur: "yuzde", deger: 20, aciklama: "Yeni üyelere hoş geldin indirimi (%20)", maxKullanim: null, kullanilan: 342, sonKullanmaGunSonra: null, aktif: true, planKisiti: "hepsi", createdGunOnce: 45 },
    { kod: "VEYLIFY50", tur: "sabit", deger: 50, aciklama: "Pro planda 50₺ sabit indirim", maxKullanim: 200, kullanilan: 41, sonKullanmaGunSonra: 90, aktif: true, planKisiti: "pro", createdGunOnce: 15 },
    { kod: "ERKENKUS", tur: "yuzde", deger: 40, aciklama: "Erken kuş fırsatı — %40 (sınırlı süre!)", maxKullanim: 100, kullanilan: 63, sonKullanmaGunSonra: 5, aktif: true, planKisiti: "hepsi", createdGunOnce: 25 },
  ];
  promoTanimlari.forEach((p) => {
    db.promoKodlar.push({
      id: id("promo"),
      kod: p.kod,
      tur: p.tur,
      deger: p.deger,
      aciklama: p.aciklama,
      maxKullanim: p.maxKullanim,
      kullanilan: p.kullanilan,
      sonKullanma: p.sonKullanmaGunSonra == null ? null : new Date(now + p.sonKullanmaGunSonra * 86400000).toISOString(),
      aktif: p.aktif,
      planKisiti: p.planKisiti,
      createdAt: now - p.createdGunOnce * 86400000,
    });
  });
  // Kullanım logu boş başlar; gerçek checkout uygulamaları buraya yazar.
  // (promoKullanimlar zaten emptyDatabase'de [] olarak hazır.)

  return db;
}
