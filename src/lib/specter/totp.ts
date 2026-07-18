/**
 * TOTP (RFC 6238) — gerçek zaman-tabanlı tek-kullanımlık şifre.
 * Sıfır bağımlılık: Node crypto HMAC-SHA1 ile. Google Authenticator / Authy /
 * 1Password ile uyumlu (SHA1, 6 hane, 30sn periyot).
 *
 * NEDEN: Önceki 2FA yalnızca "6 hane mi" format kontrolü yapıyordu — gerçek
 * doğrulama YOKTU (herhangi 6 rakam 2FA'yı açıyordu = güvenlik teatrosu). Bu
 * modül gerçek TOTP secret üretir ve authenticator kodunu MATEMATİKSEL olarak
 * doğrular; yanlış kod geçemez.
 *
 * Saf/deterministik değil (zaman girdisi alır) ama `now` parametre olarak
 * geçilebilir → test edilebilir. Math.random YOK (crypto.randomBytes kullanır).
 */
import crypto from "crypto";

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** Yeni rastgele TOTP secret (base32, 20 bayt = 160 bit — RFC önerisi). */
export function totpSecretUret(): string {
  const buf = crypto.randomBytes(20);
  let bits = "";
  for (const b of buf) bits += b.toString(2).padStart(8, "0");
  let out = "";
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    out += BASE32[parseInt(bits.slice(i, i + 5), 2)];
  }
  return out;
}

/** base32 (RFC 4648) → Buffer. */
function base32Decode(s: string): Buffer {
  const temiz = s.replace(/=+$/, "").toUpperCase().replace(/\s/g, "");
  let bits = "";
  for (const ch of temiz) {
    const idx = BASE32.indexOf(ch);
    if (idx === -1) continue;
    bits += idx.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

/** Belirli bir zaman-adımı için 6 haneli TOTP kodu (RFC 6238 / HOTP RFC 4226). */
function totpKod(secret: string, sayac: number): string {
  const key = base32Decode(secret);
  const buf = Buffer.alloc(8);
  // 64-bit big-endian sayaç.
  buf.writeUInt32BE(Math.floor(sayac / 0x100000000), 0);
  buf.writeUInt32BE(sayac >>> 0, 4);
  const hmac = crypto.createHmac("sha1", key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const kod =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (kod % 1_000_000).toString().padStart(6, "0");
}

/**
 * Kullanıcının girdiği kodu doğrula. ±1 pencere toleransı (saat kayması için,
 * ±30sn). Doğruysa true. Zaman `now` (ms) parametreyle test edilebilir.
 */
export function totpDogrula(secret: string, kod: string, now = Date.now(), pencere = 1): boolean {
  if (!/^\d{6}$/.test((kod || "").trim())) return false;
  const temizKod = kod.trim();
  const adim = Math.floor(now / 1000 / 30);
  for (let d = -pencere; d <= pencere; d++) {
    // Timing-safe karşılaştırma (yan-kanal sızıntısını önle).
    const beklenen = totpKod(secret, adim + d);
    if (
      beklenen.length === temizKod.length &&
      crypto.timingSafeEqual(Buffer.from(beklenen), Buffer.from(temizKod))
    ) {
      return true;
    }
  }
  return false;
}

/** Authenticator uygulamasına QR olarak verilecek otpauth:// URI. */
export function otpauthUri(secret: string, hesap: string, yayinci = "Veylify"): string {
  const etiket = encodeURIComponent(`${yayinci}:${hesap}`);
  const params = new URLSearchParams({ secret, issuer: yayinci, algorithm: "SHA1", digits: "6", period: "30" });
  return `otpauth://totp/${etiket}?${params.toString()}`;
}
