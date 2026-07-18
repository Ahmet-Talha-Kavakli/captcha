/**
 * Public API — Koruma İstatistikleri (GET /api/v1/stats)
 * ------------------------------------------------------
 * Müşterinin programatik olarak koruma metriklerini çektiği GERÇEK Bearer-auth'lu
 * endpoint. Panelde oluşturulan API anahtarı (sk_live_… / sk_test_…) ile
 * kimlik doğrular; iptal edilen (revoked) anahtar erişemez.
 *
 * Kullanım:
 *   curl https://veylify.com/api/v1/stats \
 *        -H "Authorization: Bearer sk_live_xxxxx"
 *
 * Güvenlik:
 *   - Bearer token SHA-256 hash ile timing-safe doğrulanır (Tokens.byToken).
 *   - Rate-limit: token başına 120/dk (kötüye kullanım tavanı).
 *   - "stats" scope'u gerekir (yoksa 403 insufficient_scope).
 *   - Yanıt yalnızca token sahibinin (ownerId) verisini içerir — izolasyon.
 */
import { NextResponse } from "next/server";
import { Tokens } from "@/lib/db/db";
import { rateLimit, retryAfterSn } from "@/lib/db/rate";
import { korumaOzeti, panelSayilari } from "@/lib/ozet";

function bearer(req: Request): string | null {
  const h = req.headers.get("authorization") || "";
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m ? m[1].trim() : null;
}

export async function GET(req: Request) {
  const secret = bearer(req);
  if (!secret) {
    return NextResponse.json(
      { error: "missing_token", message: "Authorization: Bearer sk_… başlığı gerekli." },
      { status: 401 },
    );
  }

  // Bearer doğrulama — iptal edilmiş/geçersiz anahtar reddedilir.
  const token = Tokens.byToken(secret);
  if (!token) {
    return NextResponse.json(
      { error: "invalid_token", message: "Anahtar geçersiz veya iptal edilmiş." },
      { status: 401 },
    );
  }

  // Rate-limit: token başına dakikada 120 istek. Public API → standart
  // X-RateLimit-* header'ları (GitHub/Stripe deseni) + 429'da Retry-After.
  const RL_LIMIT = 120;
  const rl = rateLimit(`api:${token.id}`, RL_LIMIT, 60_000);
  const rlHeaders: Record<string, string> = {
    "X-RateLimit-Limit": String(RL_LIMIT),
    "X-RateLimit-Remaining": String(rl.remaining),
    "X-RateLimit-Reset": String(Math.ceil(rl.resetAt / 1000)),
  };
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited", message: "Çok fazla istek — biraz bekleyin." },
      { status: 429, headers: { ...rlHeaders, "Retry-After": String(retryAfterSn(rl.resetAt)) } },
    );
  }

  // Scope kontrolü — anahtar "stats" veya "*" yetkisine sahip olmalı.
  if (!token.scopes.includes("stats") && !token.scopes.includes("*")) {
    return NextResponse.json(
      { error: "insufficient_scope", message: "Bu anahtar 'stats' yetkisine sahip değil." },
      { status: 403 },
    );
  }

  // Yalnızca token sahibinin verisi — kullanıcı izolasyonu.
  const ozet = korumaOzeti(token.ownerId);
  const sayilar = panelSayilari(token.ownerId);

  return NextResponse.json({
    ok: true,
    environment: token.environment,
    protection_score: ozet.skor,
    block_rate: Number((ozet.blockRate * 100).toFixed(2)),
    sites: ozet.siteCount,
    last_24h: {
      total: sayilar.son24Toplam,
      bots_blocked: sayilar.son24Bot,
      ai_agents: sayilar.son24Ai,
    },
    active_rules: sayilar.aktifKural,
    bad_ips_tracked: sayilar.kotuIp,
    generated_at: new Date().toISOString(),
  }, { headers: rlHeaders });
}
