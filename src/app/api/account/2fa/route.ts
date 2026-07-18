import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Users, Audit } from "@/lib/db/db";

/**
 * İki-adımlı doğrulama (TOTP) aç/kapat. Görsel akış: istemci QR + kod
 * doğrulama adımlarını gösterir; sunucu yalnızca durumu kalıcılaştırır.
 * `code` alanı gönderilirse basit format doğrulaması yapılır (6 hane).
 */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { enabled, code } = await req.json().catch(() => ({}));

  if (enabled === true) {
    // Etkinleştirme için 6 haneli doğrulama kodu bekle (görsel doğrulama).
    if (typeof code !== "string" || !/^\d{6}$/.test(code.trim())) {
      return NextResponse.json({ error: "6 haneli doğrulama kodunu girin" }, { status: 400 });
    }
  }

  const guncel = Users.setTwoFactor(user.id, Boolean(enabled));
  if (!guncel) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  Audit.log(user.id, user.name, enabled ? "hesap.2fa-ac" : "hesap.2fa-kapat", user.email);

  return NextResponse.json({ twoFactorEnabled: guncel.twoFactorEnabled ?? false });
}
