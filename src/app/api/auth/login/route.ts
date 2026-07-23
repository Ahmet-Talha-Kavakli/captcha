import { NextResponse } from "next/server";
import { Users, verifyPassword, blobHazirla } from "@/lib/db/db";
import { startSession } from "@/lib/auth";
import { totpDogrula } from "@/lib/specter/totp";

export async function POST(req: Request) {
  const { email, password, code } = await req.json().catch(() => ({}));

  if (!email || !password) {
    return NextResponse.json(
      { error: "E-posta ve şifre zorunludur." },
      { status: 400 },
    );
  }

  // KRİTİK: Supabase blob'unu TAZE yükle (zorla) — aksi halde cache henüz
  // yüklenmemişken geçici SEED'deki kullanıcıyı buluruz, session seed-id'sine
  // bağlanır ve blob yüklenince (gerçek kullanıcı gelince) oturum 401 olur.
  await blobHazirla(true);

  const user = Users.byEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json(
      { error: "E-posta veya şifre hatalı." },
      { status: 401 },
    );
  }

  // ASKIYA ALINMIŞ HESAP: platform yönetimi bu hesabı askıya aldıysa giriş yok.
  if (user.hesapDurumu === "suspended") {
    return NextResponse.json(
      { error: user.askiNedeni || "Hesabınız askıya alınmış. Destek ile iletişime geçin." },
      { status: 403 },
    );
  }

  // İKİNCİ FAKTÖR: hesapta 2FA açık VE gerçek bir TOTP secret varsa, şifre doğru
  // olsa bile TOTP kodu ZORUNLU. Şifre sızsa bile authenticator olmadan giriş
  // engellenir. (Eski/bozuk durum: enabled=true ama secret yok → 2FA yok sayılır,
  // giriş normal ilerler; böylece secret'sız eski hesaplar kilitlenmez.)
  if (user.twoFactorEnabled && user.totpSecret) {
    if (!code) {
      // Session BAŞLATILMAZ — istemciye ikinci adımı iste.
      return NextResponse.json({ requires2fa: true }, { status: 200 });
    }
    if (typeof code !== "string" || !totpDogrula(user.totpSecret, code)) {
      return NextResponse.json(
        { error: "Doğrulama kodu geçersiz.", requires2fa: true },
        { status: 401 },
      );
    }
  }

  await startSession(user.id);
  return NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.name },
  });
}
