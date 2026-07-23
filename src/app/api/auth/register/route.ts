import { NextResponse } from "next/server";
import { Users, blobHazirla } from "@/lib/db/db";
import { startSession } from "@/lib/auth";
import { mailGonder } from "@/lib/specter/mail";
import { hosgeldinMail } from "@/lib/specter/mail-sablonlar";
import { referralUygula } from "@/lib/specter/referral";

export async function POST(req: Request) {
  const { email, name, password, ref } = await req.json().catch(() => ({}));

  // KRİTİK: blob'u taze yükle — seed-race'i önle (bkz. login route).
  await blobHazirla(true);

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

  // REFERRAL: davet koduyla geldiyse çift taraflı kredi ödülü uygula.
  let referralOdulu = 0;
  if (typeof ref === "string" && ref.trim()) {
    const sonuc = referralUygula(user, ref);
    if (sonuc.odullendi) referralOdulu = 50; // davet edilene verilen (ODUL_DAVET_EDILEN)
  }

  await startSession(user.id);

  // Hoşgeldin maili — fire-and-forget (SMTP yoksa loglanır, akış kırılmaz).
  const { konu, html, metin } = hosgeldinMail(name);
  void mailGonder({ kime: email, konu, html, metin });

  return NextResponse.json({ ok: true, user: { id: user.id, email, name }, referralOdulu });
}
