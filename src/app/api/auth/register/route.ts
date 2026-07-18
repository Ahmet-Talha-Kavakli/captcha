import { NextResponse } from "next/server";
import { Users } from "@/lib/db/db";
import { startSession } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, name, password } = await req.json().catch(() => ({}));

  if (!email || !password || !name) {
    return NextResponse.json(
      { error: "E-posta, isim ve şifre zorunludur." },
      { status: 400 },
    );
  }
  if (typeof password !== "string" || password.length < 6) {
    return NextResponse.json(
      { error: "Şifre en az 6 karakter olmalı." },
      { status: 400 },
    );
  }
  if (Users.byEmail(email)) {
    return NextResponse.json(
      { error: "Bu e-posta zaten kayıtlı." },
      { status: 409 },
    );
  }

  const user = Users.create({ email, name, password });
  await startSession(user.id);
  return NextResponse.json({ ok: true, user: { id: user.id, email, name } });
}
