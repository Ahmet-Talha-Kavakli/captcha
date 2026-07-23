import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Users } from "@/lib/db/db";
import { referralIstatistik, davetLinki, koddanKullanici } from "@/lib/specter/referral";
import { mailGonder } from "@/lib/specter/mail";
import { davetMail } from "@/lib/specter/mail-sablonlar";
import { ODUL_DAVET_EDILEN } from "@/lib/specter/referral";

/**
 * GET  /api/referral         → kullanıcının davet kodu/linki + istatistikleri.
 * POST /api/referral {emails} → verilen e-postalara davet maili gönderir.
 */

export async function GET() {
  const user = await currentUser({ taze: false });
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(referralIstatistik(user));
}

export async function POST(req: Request) {
  const user = await currentUser({ taze: false });
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { emails } = await req.json().catch(() => ({}));
  const liste: string[] = Array.isArray(emails)
    ? emails.map((e) => String(e).trim()).filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e))
    : [];
  if (liste.length === 0) {
    return NextResponse.json({ error: "Geçerli e-posta girin." }, { status: 400 });
  }
  if (liste.length > 20) {
    return NextResponse.json({ error: "Tek seferde en fazla 20 davet." }, { status: 400 });
  }

  const link = davetLinki(user);
  const sonuclar: { email: string; gonderildi: boolean }[] = [];
  for (const email of liste) {
    // Zaten kayıtlı kullanıcıya davet gönderme (anlamsız).
    if (Users.byEmail(email)) {
      sonuclar.push({ email, gonderildi: false });
      continue;
    }
    const m = davetMail(user.name, link, ODUL_DAVET_EDILEN);
    const r = await mailGonder({ kime: email, konu: m.konu, html: m.html, metin: m.metin });
    sonuclar.push({ email, gonderildi: r.gonderildi });
  }

  const gonderilenSayi = sonuclar.filter((s) => s.gonderildi).length;
  return NextResponse.json({ ok: true, gonderilen: gonderilenSayi, toplam: liste.length, sonuclar });
}
