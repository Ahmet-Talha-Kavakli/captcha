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
