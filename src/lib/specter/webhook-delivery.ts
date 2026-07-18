/**
 * Specter — Webhook Teslimat Motoru
 * ==================================
 * Bir olay olduğunda (bot.blocked, ai_agent.detected vb.) müşterinin webhook
 * endpoint'ine GERÇEK, HMAC-SHA256 imzalı HTTP POST gönderir. Stripe/Clerk
 * webhook güvenlik modelini uygular:
 *   - Gövde: JSON event zarfı ({type, id, created, data}).
 *   - İmza: `X-Veylify-Signature: t=<ts>,v1=<hmac>` (timing-safe doğrulanabilir).
 *   - Retry: başarısız (non-2xx / ağ hatası) teslimatlar üstel geri çekilmeyle
 *     yeniden denenir (bu süreç sunucu içinde en fazla birkaç deneme).
 *
 * NOT: Ağ dışına gerçek istek atar. Erişilemeyen/geçersiz URL'lerde zarif
 * biçimde başarısız olur (status 0) ve teslimat kaydına yazılır.
 */

import crypto from "node:crypto";
import { Webhooks } from "@/lib/db/db";
import type { Webhook } from "@/lib/db/schema";
import { MARKA } from "@/lib/marka";

export interface WebhookEvent {
  type: string;
  data: Record<string, unknown>;
}

/* ------------------------------------------------------------------ SSRF koruması
 * Webhook URL'si SUNUCUNUN yaptığı giden istektir → kötü niyetli kullanıcı iç
 * kaynaklara (loopback, private LAN, cloud metadata 169.254.169.254) istek
 * yaptırabilir (SSRF). Teslimat ÖNCESİ ve oluşturma sırasında host doğrulanır:
 * yalnızca http(s), varsayılan portlar/yaygın portlar, ve İÇSEL OLMAYAN host.
 * Not: DNS-rebinding'e tam bağışık değildir (isim→IP teslimat anında çözülür)
 * ama bariz iç hedefleri (IP-literal + localhost) engeller — pratik ilk savunma. */

/** Bir IPv4 literal'i içsel mi (loopback/private/link-local/metadata)? */
function icselIPv4(host: string): boolean {
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  if (a === 127) return true;                     // 127.0.0.0/8 loopback
  if (a === 10) return true;                       // 10.0.0.0/8 private
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12 private
  if (a === 192 && b === 168) return true;         // 192.168.0.0/16 private
  if (a === 169 && b === 254) return true;         // 169.254.0.0/16 link-local (metadata!)
  if (a === 0) return true;                         // 0.0.0.0/8
  if (a >= 224) return true;                        // multicast/reserved
  return false;
}

/**
 * Webhook hedef URL'si güvenli mi (SSRF'e karşı)? Yalnızca http(s) şeması ve
 * içsel-olmayan host kabul edilir. Loopback isimleri + IPv6 loopback/ULA + IPv4
 * private/link-local literalleri reddedilir.
 */
export function guvenliWebhookUrl(url: string): boolean {
  let u: URL;
  try { u = new URL(url); } catch { return false; }
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, ""); // IPv6 köşeli parantezi soy
  if (!host) return false;
  // GELİŞTİRME/TEST İSTİSNASI: yalnızca açık opt-in (VEYLIFY_ALLOW_LOCAL_WEBHOOK=1)
  // ile loopback'e izin ver — yerel webhook alıcısıyla uçtan-uca test için.
  // Production'da bu env ASLA set edilmez; şema (http/https) kontrolü yine geçerli.
  if (process.env.VEYLIFY_ALLOW_LOCAL_WEBHOOK === "1") return true;
  // Yaygın iç isimler
  if (host === "localhost" || host.endsWith(".localhost")) return false;
  if (host === "0.0.0.0" || host === "::" ) return false;
  // .internal / .local gibi iç TLD'ler (mDNS/kurumsal)
  if (host.endsWith(".internal") || host.endsWith(".local")) return false;
  // IPv6 loopback (::1) ve unique-local (fc00::/7 → fc.., fd..)
  if (host === "::1") return false;
  if (/^f[cd][0-9a-f]{0,2}:/.test(host)) return false;
  // IPv6 link-local (fe80::/10) ve IPv4-mapped metadata
  if (host.startsWith("fe80:")) return false;
  if (host.includes("169.254.169.254")) return false;
  // IPv4 literal içsel aralıkları
  if (icselIPv4(host)) return false;
  return true;
}

/** İmza başlığını üret (Stripe biçimi): t=<ts>,v1=<hmac-sha256(hex)> */
export function webhookImza(govde: string, secret: string, ts: number): string {
  const imza = crypto
    .createHmac("sha256", secret)
    .update(`${ts}.${govde}`)
    .digest("hex");
  return `t=${ts},v1=${imza}`;
}

/** İmzayı doğrula (müşteri tarafı örneği; timing-safe). */
export function webhookImzaDogrula(govde: string, secret: string, header: string, toleransSn = 300): boolean {
  const parcalar = Object.fromEntries(header.split(",").map((p) => p.split("=")));
  const ts = Number(parcalar.t);
  const v1 = parcalar.v1;
  if (!ts || !v1) return false;
  if (Math.abs(Date.now() / 1000 - ts) > toleransSn) return false;
  const beklenen = crypto.createHmac("sha256", secret).update(`${ts}.${govde}`).digest("hex");
  const a = Buffer.from(v1, "hex");
  const b = Buffer.from(beklenen, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Tek bir teslimat denemesi — gerçek HTTP POST. */
async function teslimEt(url: string, govde: string, imza: string, timeoutMs = 6000): Promise<{ status: number; durationMs: number }> {
  const bas = Date.now();
  // SSRF SON SAVUNMA: teslimat anında da doğrula (eski/DB'de kalmış webhook'lar
  // veya oluşturma-guard'ı atlanmış olsa bile iç hedeflere istek atılmaz).
  if (!guvenliWebhookUrl(url)) {
    return { status: 0, durationMs: Date.now() - bas };
  }
  const controller = new AbortController();
  const zamanlayici = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Veylify-Signature": imza,
        "User-Agent": `${MARKA.ad}-Webhook/1.0`,
      },
      body: govde,
      signal: controller.signal,
    });
    return { status: res.status, durationMs: Date.now() - bas };
  } catch {
    // Ağ hatası / timeout / erişilemez → status 0.
    return { status: 0, durationMs: Date.now() - bas };
  } finally {
    clearTimeout(zamanlayici);
  }
}

/**
 * Bir olayı, o olaya abone olan tüm aktif webhook'lara teslim eder.
 * Retry: 2xx dönene kadar en fazla `maxDeneme` kez üstel geri çekilmeyle dener.
 * Her deneme teslimat geçmişine kaydedilir.
 */
export async function webhookTetikle(
  ownerId: string,
  event: WebhookEvent,
  opts: { maxDeneme?: number } = {},
): Promise<{ hedef: number; basarili: number }> {
  const maxDeneme = opts.maxDeneme ?? 3;
  const hooks = Webhooks.forOwner(ownerId).filter(
    (w: Webhook) => w.active && (w.events.includes(event.type) || w.events.includes("*")),
  );

  const zarf = {
    type: event.type,
    id: "evt_" + crypto.randomBytes(9).toString("hex"),
    created: Math.floor(Date.now() / 1000),
    data: event.data,
  };
  const govde = JSON.stringify(zarf);

  let basarili = 0;
  await Promise.all(
    hooks.map(async (w) => {
      let sonStatus = 0;
      for (let deneme = 1; deneme <= maxDeneme; deneme++) {
        const ts = Math.floor(Date.now() / 1000);
        const imza = webhookImza(govde, w.secret, ts);
        const sonuc = await teslimEt(w.url, govde, imza);
        sonStatus = sonuc.status;
        Webhooks.kaydetTeslimat?.(ownerId, w.id, {
          event: event.type,
          status: sonuc.status,
          attempt: deneme,
          durationMs: sonuc.durationMs,
        });
        if (sonuc.status >= 200 && sonuc.status < 300) break;
        // üstel geri çekilme (küçük — sunucu içi, kullanıcıyı bekletmez)
        if (deneme < maxDeneme) await new Promise((r) => setTimeout(r, 200 * deneme));
      }
      if (sonStatus >= 200 && sonStatus < 300) basarili++;
    }),
  );

  return { hedef: hooks.length, basarili };
}
