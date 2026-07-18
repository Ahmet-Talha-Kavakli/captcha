/**
 * Specter — Kripto & Token
 * -------------------------
 * Stateless challenge doğrulaması. Sunucu, üretilen her challenge için
 * bir "commitment token" imzalar; bu token challenge'ın seed'ini,
 * uzunluğunu, site anahtarını ve süresini HMAC-SHA256 ile mühürler.
 *
 * Doğrulama anında sunucu:
 *   1. Token imzasını secret ile yeniden hesaplar → kurcalanma tespiti.
 *   2. Token'daki seed'den cevabı yeniden türetir (deriveAnswer).
 *   3. Kullanıcının girdisiyle karşılaştırır.
 *
 * Bu sayede hiçbir yerde challenge state'i (DB kaydı) tutmaya gerek
 * kalmaz; sistem yatay ölçeklenir ve replay saldırıları nonce + ttl
 * ile sınırlanır.
 *
 * Node runtime'ında çalışır (crypto). Edge için Web Crypto varyantı da
 * eklenebilir; şimdilik Node API route'larında kullanılıyor.
 */

import crypto from "node:crypto";

/** Token içinde taşınan imzalı yük. */
export interface TokenPayload {
  /** challenge id */
  cid: string;
  /** render seed */
  seed: number;
  /** cevap uzunluğu */
  len: number;
  /**
   * Challenge türü (kod | sayi | yon | sec). Verilmezse "kod" varsayılır —
   * eski token'lar ve mevcut testler bu alan olmadan da doğrulanır.
   */
  type?: "kod" | "sayi" | "yon" | "sec";
  /** site anahtarı (hangi müşteri sitesi) */
  site: string;
  /** issued-at (ms) */
  iat: number;
  /** expiry (ms) */
  exp: number;
  /** tek kullanımlık nonce (replay önleme) */
  nonce: string;
  /**
   * İşlem-Kanıtı (Proof-of-Work) hedef zorluk biti. Verilmezse PoW istenmez
   * (geriye uyumlu — eski token'lar/testler etkilenmez). Şüpheli trafik için
   * challenge route bunu adaptif olarak yükseltir; verify çözümü doğrular.
   */
  powBit?: number;
}

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Buffer {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Buffer.from(s, "base64");
}

function hmac(secret: string, data: string): Buffer {
  return crypto.createHmac("sha256", secret).update(data).digest();
}

/** Challenge commitment token'ı imzalar → "<payload>.<sig>". */
export function signToken(payload: TokenPayload, secret: string): string {
  const body = b64url(Buffer.from(JSON.stringify(payload), "utf8"));
  const sig = b64url(hmac(secret, body));
  return `${body}.${sig}`;
}

export type VerifyResult =
  | { ok: true; payload: TokenPayload }
  | { ok: false; reason: "malformed" | "bad_signature" | "expired" };

/** Token'ı doğrular ve payload'ı döndürür (imza + süre kontrolü). */
export function verifyToken(token: string, secret: string, now: number): VerifyResult {
  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, reason: "malformed" };
  const [body, sig] = parts;

  const expected = b64url(hmac(secret, body));
  // sabit-zaman karşılaştırma
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, reason: "bad_signature" };
  }

  let payload: TokenPayload;
  try {
    payload = JSON.parse(fromB64url(body).toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }

  if (now > payload.exp) return { ok: false, reason: "expired" };
  return { ok: true, payload };
}

/** Kriptografik güvenli 32-bit seed. */
export function secureSeed(): number {
  return crypto.randomBytes(4).readUInt32BE(0);
}

/** Rastgele nonce (replay + benzersiz challenge id için). */
export function randomNonce(bytes = 12): string {
  return b64url(crypto.randomBytes(bytes));
}

/** Site anahtarları: public site key (pk_) + gizli secret key (sk_). */
export function generateSiteKeys(): { siteKey: string; secretKey: string } {
  return {
    siteKey: "pk_" + b64url(crypto.randomBytes(18)),
    secretKey: "sk_" + b64url(crypto.randomBytes(24)),
  };
}

/**
 * Başarılı doğrulama sonrası müşteri sunucusuna dönecek "verification
 * token". Müşteri bunu kendi backend'inde /siteverify ile teyit eder
 * (reCAPTCHA akışının aynısı).
 */
export interface VerificationClaim {
  cid: string;
  site: string;
  success: true;
  iat: number;
  exp: number;
  /** çözüm sinyalleri (davranışsal skor vb.) */
  score: number;
}

export function signVerification(claim: VerificationClaim, secret: string): string {
  const body = b64url(Buffer.from(JSON.stringify(claim), "utf8"));
  const sig = b64url(hmac(secret, "verify:" + body));
  return `${body}.${sig}`;
}

export function verifyVerification(
  token: string,
  secret: string,
  now: number,
):
  | { ok: true; claim: VerificationClaim }
  | { ok: false; reason: "malformed" | "bad_signature" | "expired" } {
  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, reason: "malformed" };
  const [body, sig] = parts;
  const expected = b64url(hmac(secret, "verify:" + body));
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, reason: "bad_signature" };
  }
  let claim: VerificationClaim;
  try {
    claim = JSON.parse(fromB64url(body).toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (now > claim.exp) return { ok: false, reason: "expired" };
  return { ok: true, claim };
}
