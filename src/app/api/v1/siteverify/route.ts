/**
 * POST /api/v1/siteverify
 * ------------------------
 * Müşterinin BACKEND'i çağırır (reCAPTCHA /siteverify muadili).
 * Widget'ın döndürdüğü verification token'ı, müşterinin SECRET key'i
 * ile teyit eder. Böylece müşteri, formun gerçekten Specter'ı geçmiş
 * bir insan tarafından gönderildiğinden emin olur.
 *
 * İstek (form veya JSON):
 *   secret: sk_...        (müşteri secret key)
 *   response: <token>     (widget'tan gelen verification token)
 */

import { NextResponse } from "next/server";
import { Sites } from "@/lib/db/db";
import { verifyVerification } from "@/lib/specter/crypto";

async function readParams(req: Request): Promise<{ secret?: string; response?: string }> {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const b = await req.json().catch(() => ({}));
    return { secret: b.secret, response: b.response };
  }
  const form = await req.formData().catch(() => null);
  if (form) {
    return {
      secret: String(form.get("secret") || ""),
      response: String(form.get("response") || ""),
    };
  }
  return {};
}

export async function POST(req: Request) {
  const { secret, response } = await readParams(req);

  if (!secret || !response) {
    return NextResponse.json(
      { success: false, "error-codes": ["missing-input"] },
      { status: 400 },
    );
  }

  const site = Sites.forOwnerBySecret(secret);
  if (!site) {
    return NextResponse.json(
      { success: false, "error-codes": ["invalid-input-secret"] },
      { status: 200 },
    );
  }

  // Alan adı sahipliği doğrulanmadan koruma pasiftir.
  if (!site.verified) {
    return NextResponse.json(
      { success: false, "error-codes": ["site-not-verified"] },
      { status: 200 },
    );
  }

  const now = Date.now();
  const res = verifyVerification(response, site.secretKey, now);
  if (!res.ok) {
    return NextResponse.json(
      { success: false, "error-codes": [res.reason] },
      { status: 200 },
    );
  }

  return NextResponse.json({
    success: true,
    challenge_ts: new Date(res.claim.iat).toISOString(),
    hostname: site.name,
    score: res.claim.score,
    cid: res.claim.cid,
  });
}
