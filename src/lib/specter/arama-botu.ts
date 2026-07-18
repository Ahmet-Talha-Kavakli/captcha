/**
 * Meşru arama motoru botu doğrulaması (Googlebot, Bingbot, ...).
 *
 * NEDEN: Bu ürün siteleri bot/AI'dan korur — ama Googlebot/Bingbot gibi MEŞRU
 * arama motoru botlarını ASLA engellememeli. Aksi halde müşterinin sitesi
 * Google/Bing sıralamasından düşer (SEO felaketi). Bu botlar davranış sinyali
 * (fare/klavye) üretmez, o yüzden davranış skoruyla challenge'a düşerler; onları
 * güvenle geçirmek gerekir.
 *
 * GÜVENLİK: UA "Googlebot" diyor diye ASLA geçirme — herkes UA'yı sahteleyebilir.
 * Kaynak IP'nin gerçekten operatörün YAYINLADIĞI CIDR bloklarında olduğunu
 * doğrula. Sahte Googlebot (rastgele IP'den) doğrulanamaz → normal akışa düşer.
 *
 * Saf/deterministik: Date.now / Math.random / argümansız new Date YOK.
 * IP doğrulaması [[ai-verify]]'daki herhangiCidr ile paylaşılır.
 */
import { herhangiCidr } from "./ai-verify";

export interface AramaBotu {
  id: string;
  ad: string;
  operator: string;
  /** UA'da aranan imza (küçük harf). */
  uaToken: string;
  /** Operatörün kamuya açık crawler IP CIDR blokları (resmi kaynaklardan). */
  cidr: string[];
}

/**
 * Meşru arama motoru botları + resmi IP blokları. Bloklar operatörlerin
 * yayımladığı listelerden (Googlebot, Bingbot, DuckDuckBot, Yandex, Apple).
 * AI eğitim botları (GPTBot vb.) BURADA DEĞİL — onlar ai-agents politikasıyla
 * yönetilir; bu tablo yalnızca "sıralamaya sokan" klasik arama botlarıdır.
 */
export const ARAMA_BOTLARI: AramaBotu[] = [
  {
    id: "googlebot", ad: "Googlebot", operator: "Google", uaToken: "googlebot",
    cidr: ["66.249.64.0/19", "34.100.0.0/16", "35.191.0.0/16", "216.239.32.0/19"],
  },
  {
    id: "bingbot", ad: "Bingbot", operator: "Microsoft", uaToken: "bingbot",
    cidr: ["40.77.167.0/24", "157.55.39.0/24", "207.46.13.0/24", "13.66.139.0/24", "20.191.45.0/24"],
  },
  {
    id: "duckduckbot", ad: "DuckDuckBot", operator: "DuckDuckGo", uaToken: "duckduckbot",
    cidr: ["20.191.45.0/24", "40.88.21.0/24", "51.116.0.0/16"],
  },
  {
    id: "yandexbot", ad: "YandexBot", operator: "Yandex", uaToken: "yandexbot",
    cidr: ["5.45.192.0/18", "77.88.0.0/18", "87.250.224.0/19", "100.43.64.0/19"],
  },
  {
    id: "applebot", ad: "Applebot", operator: "Apple", uaToken: "applebot",
    cidr: ["17.0.0.0/8"],
  },
];

export interface AramaBotuSonuc {
  /** UA meşru arama botu imzası taşıyor mu. */
  eslesti: boolean;
  /** Kaynak IP operatörün resmi CIDR bloğunda mı — DOĞRULANMIŞ. */
  dogrulandi: boolean;
  bot: AramaBotu | null;
}

/**
 * UA + IP'yi meşru arama botlarına karşı değerlendir.
 * - eslesti=true, dogrulandi=true  → gerçek Googlebot vb. (güvenle geçir)
 * - eslesti=true, dogrulandi=false → SAHTE Googlebot (UA taklidi, IP uymuyor) → geçirme
 * - eslesti=false                  → arama botu değil
 */
export function aramaBotuDegerlendir(ua: string, ip: string): AramaBotuSonuc {
  const u = (ua || "").toLowerCase();
  const bot = ARAMA_BOTLARI.find((b) => u.includes(b.uaToken)) ?? null;
  if (!bot) return { eslesti: false, dogrulandi: false, bot: null };
  const dogrulandi = herhangiCidr(ip, bot.cidr);
  return { eslesti: true, dogrulandi, bot };
}
