import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Users, Audit } from "@/lib/db/db";
import { totpSecretUret, totpDogrula, otpauthUri } from "@/lib/specter/totp";

/**
 * İki-adımlı doğrulama (GERÇEK TOTP, RFC 6238).
 *
 * GET  → kurulum başlat: yeni TOTP secret üretir, saklar (henüz aktif değil),
 *        authenticator için otpauth:// URI + base32 secret döner (QR gösterimi).
 * POST → {enabled:true, code} : kullanıcının authenticator kodunu GERÇEK TOTP
 *        ile doğrular; doğruysa 2FA aktifleşir. Yanlış kod GEÇEMEZ (eski davranış
 *        yalnızca "6 hane mi" bakıyordu — güvenlik teatrosuydu).
 *        {enabled:false} : 2FA kapatır, secret temizlenir.
 */
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Her kurulum çağrısı yeni secret üretir (önceki tamamlanmadıysa geçersiz olur).
  const secret = totpSecretUret();
  Users.setTotpSecret(user.id, secret);
  return NextResponse.json({
    secret,
    otpauth: otpauthUri(secret, user.email),
  });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { enabled, code } = await req.json().catch(() => ({}));

  if (enabled === true) {
    const tam = Users.byId(user.id);
    if (!tam?.totpSecret) {
      return NextResponse.json({ error: "Önce kurulumu başlatın (QR kodu alın)." }, { status: 400 });
    }
    // GERÇEK TOTP doğrulama — yanlış/eski kod geçemez.
    if (typeof code !== "string" || !totpDogrula(tam.totpSecret, code)) {
      return NextResponse.json({ error: "Doğrulama kodu geçersiz. Authenticator uygulamanızdaki güncel kodu girin." }, { status: 400 });
    }
  }

  const guncel = Users.setTwoFactor(user.id, Boolean(enabled));
  if (!guncel) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  Audit.log(user.id, user.name, enabled ? "hesap.2fa-ac" : "hesap.2fa-kapat", user.email);

  return NextResponse.json({ twoFactorEnabled: guncel.twoFactorEnabled ?? false });
}
