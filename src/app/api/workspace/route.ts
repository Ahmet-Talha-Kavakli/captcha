import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Users, Audit } from "@/lib/db/db";

/**
 * Çalışma Alanı (workspace) API'si
 * =================================
 * Tek uç: çalışma alanının adını günceller. Kalıcılık `Users.updateProfile`
 * üzerinden yürür (workspaceName alanı desteklenir) — böylece owner ekip
 * kaydıyla tutarlılık ve tek yazma yolu korunur.
 */

/** Çalışma alanı adının azami uzunluğu (hesap ayarlarıyla aynı kural). */
const MAX_AD = 60;

/** POST { workspaceName } → çalışma alanı adını doğrular ve kalıcılaştırır. */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  // Doğrulama: string olmalı, boşluklar kırpılır, boş olamaz, <= 60 karakter.
  if (typeof body.workspaceName !== "string") {
    return NextResponse.json({ error: "Çalışma alanı adı gerekli" }, { status: 400 });
  }
  const ad = body.workspaceName.trim();
  if (ad.length < 2) {
    return NextResponse.json({ error: "Çalışma alanı adı en az 2 karakter olmalı" }, { status: 400 });
  }
  const temizAd = ad.slice(0, MAX_AD);

  // Önceki değeri denetim izi için sakla.
  const onceki = user.workspaceName ?? user.name;

  const guncel = Users.updateProfile(user.id, { workspaceName: temizAd });
  if (!guncel) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });

  Audit.log(
    user.id,
    guncel.name,
    "çalışma-alanı.güncelle",
    temizAd,
    { workspaceName: temizAd },
    { category: "site", onceki, sonraki: temizAd },
  );

  return NextResponse.json({ workspaceName: guncel.workspaceName ?? temizAd });
}
