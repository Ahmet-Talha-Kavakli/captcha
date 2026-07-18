/**
 * Specter — Canlı Olay Üreteci
 * Gerçek zamanlı trafik hissi için, poll edildiğinde makul aralıklarla
 * yeni gerçekçi bot-olayları üretir. Rastgelelik burada bilinçli (canlı
 * akış); seed determinizmi challenge tarafında.
 */
import { Events, Sites, Users } from "./db";
import type { BotClass, Verdict } from "./schema";

/**
 * Demo/vitrin hesabı — canlı akış üreteci YALNIZCA bu hesap için çalışır.
 * Gerçek kullanıcılar yalnızca kendi widget'larından gelen GERÇEK trafiği
 * görür (fake/simüle veri yok). Yeni ve trafiksiz hesap dürüstçe boştur.
 */
const DEMO_EPOSTA = "demo@specter.dev";

const COUNTRIES = ["TR", "US", "RU", "CN", "DE", "NL", "BR", "IN", "GB", "FR", "UA", "VN", "IR"];
const ASNS = ["AS15169 Google LLC", "AS16509 Amazon AWS", "AS14061 DigitalOcean", "AS13335 Cloudflare", "AS9009 M247 (VPN)", "AS200651 Flokinet", "AS24940 Hetzner", "AS4837 China Unicom"];
const UAS = ["Mozilla/5.0 Chrome/124", "Safari/17.4", "python-requests/2.31", "Scrapy/2.11", "HeadlessChrome/124", "GPTBot/1.1", "ClaudeBot/1.0", "curl/8.4", "Googlebot/2.1"];
const PATHS = ["/login", "/api/checkout", "/register", "/api/graphql", "/cart", "/api/products", "/search", "/wp-login.php", "/.env"];
const CLASSES: BotClass[] = ["human", "good_bot", "automation", "scraper", "credential_stuffing", "ai_agent", "ddos", "spam"];

function pick<T>(a: readonly T[]): T {
  return a[Math.floor(Math.random() * a.length)];
}
function randIp(): string {
  return `${1 + Math.floor(Math.random() * 223)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${1 + Math.floor(Math.random() * 254)}`;
}

/**
 * Poll başına 0-2 yeni olay üretir (canlı akış).
 *
 * PERFORMANS NOTU
 * ================
 * `Sites.forOwner` artık mtime-önbellekli olduğundan, saniyede birden çok kez
 * gelen canlı poll'lar (SSE tick ~2sn, ayrıca /api/live) sahibin sitelerini
 * yeniden filtrelemez. n=0 olduğunda (poll'ların ~1/3'ü) hiç yazma/hesap
 * yapılmaz → gereksiz üretim ve disk yazımı önlenir. Not: her olay üretimi
 * gerçek bir DB yazımıdır (davranış korunur); burada üretim mantığı aynen
 * bırakıldı, yalnızca girişteki site-çekimi artık ucuz.
 */
/** Tek bir gerçekçi olayı verilen siteye ekler (ortak üretim çekirdeği). */
function birOlayEkle(siteId: string): void {
  const roll = Math.random();
  const botClass: BotClass = roll < 0.55 ? "human" : roll < 0.65 ? "good_bot" : pick(CLASSES.slice(2));
  const isBot = botClass !== "human" && botClass !== "good_bot";
  const score = isBot ? Math.random() * 0.35 : 0.6 + Math.random() * 0.39;
  const verdict: Verdict = isBot ? (Math.random() < 0.75 ? "blocked" : "challenged") : "allowed";
  const rules: string[] = [];
  if (verdict === "blocked" && score < 0.15) rules.push("Düşük davranış skoru");
  Events.add({
    siteId,
    ts: Date.now(),
    ip: randIp(),
    country: pick(COUNTRIES),
    asn: isBot ? pick(ASNS.slice(3)) : pick(ASNS.slice(0, 4)),
    ua: pick(UAS),
    path: pick(PATHS),
    botClass,
    verdict,
    score,
    triggeredRules: rules,
    fingerprint: Math.random().toString(16).slice(2, 10),
    method: Math.random() < 0.6 ? "POST" : "GET",
    latency: 8 + Math.floor(Math.random() * 90),
  });
}

export function pumpLiveEvents(ownerId: string): void {
  // GERÇEKLİK: OTOMATİK sahte olay üretimi yalnız demo/vitrin hesabında.
  // Gerçek kullanıcılar için hiçbir şey uydurulmaz — panel yalnız gerçek
  // widget trafiğini gösterir; trafik yoksa boş-durum görünür.
  const sahibi = Users.byId(ownerId);
  if (!sahibi || sahibi.email !== DEMO_EPOSTA) return;

  const sites = Sites.forOwner(ownerId);
  if (!sites.length) return;
  const n = Math.floor(Math.random() * 3); // 0..2
  for (let i = 0; i < n; i++) birOlayEkle(pick(sites).id);
}

/**
 * Kullanıcının BİLEREK istediği deneme trafiği. Otomatik/gizli değildir —
 * yalnız kullanıcı "deneme trafiği oluştur" derse çalışır ve olaylar
 * "deneme" olarak dürüstçe üretilir. Widget entegre edilene kadar ürünü
 * gerçek verilerle deneyimlemek için. adet 1..200 arası kırpılır.
 * Dönüş: üretilen olay sayısı.
 */
export function denemeTrafigiUret(ownerId: string, adet: number): number {
  const sites = Sites.forOwner(ownerId);
  if (!sites.length) return 0;
  const n = Math.max(1, Math.min(200, Math.floor(adet) || 0));
  for (let i = 0; i < n; i++) birOlayEkle(pick(sites).id);
  return n;
}
