import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Users, Audit } from "@/lib/db/db";

/** Şifre değiştir: eski şifreyi doğrular, yeni şifreyi kaydeder. */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { oldPassword, newPassword } = await req.json().catch(() => ({}));
  if (typeof oldPassword !== "string" || typeof newPassword !== "string") {
    return NextResponse.json({ error: "Eksik alan" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Yeni şifre en az 8 karakter olmalı" }, { status: 400 });
  }
  if (newPassword === oldPassword) {
    return NextResponse.json({ error: "Yeni şifre eskisinden farklı olmalı" }, { status: 400 });
  }

  const sonuc = Users.changePassword(user.id, oldPassword, newPassword);
  if (sonuc === "yanlis") return NextResponse.json({ error: "Mevcut şifre yanlış" }, { status: 400 });
  if (sonuc === "yok") return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });

  Audit.log(user.id, user.name, "hesap.sifre-degistir", user.email);
  return NextResponse.json({ ok: true });
}
