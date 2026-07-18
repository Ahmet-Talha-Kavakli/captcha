import { NextResponse } from "next/server";
import { currentUser, endSession } from "@/lib/auth";
import { Users, Audit } from "@/lib/db/db";
import { DESTEKLENEN_DILLER } from "@/lib/i18n/panel";

/** Geçerli avatar renkleri (istemci paletiyle eşleşir). */
const AVATAR_RENKLERI = new Set([
  "#06b6d4", "#2f6fed", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899", "#0ea5e9", "#14b8a6",
]);
// Desteklenen diller tek kaynaktan (i18n/panel) — tr/en/de/fr/es.
const GECERLI_DIL = new Set<string>(DESTEKLENEN_DILLER);

/** Profil / çalışma alanı / tercih güncelle. */
export async function PATCH(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const patch: Record<string, string> = {};

  if (typeof body.name === "string") {
    const ad = body.name.trim();
    if (ad.length < 2) return NextResponse.json({ error: "Ad en az 2 karakter olmalı" }, { status: 400 });
    patch.name = ad.slice(0, 60);
  }
  if (typeof body.email === "string") {
    const email = body.email.trim().toLowerCase();
    if (!email.includes("@") || email.length < 5) {
      return NextResponse.json({ error: "Geçerli bir e-posta girin" }, { status: 400 });
    }
    // E-posta çakışması (başka bir kullanıcı bu adresi kullanıyor mu).
    const mevcut = Users.byEmail(email);
    if (mevcut && mevcut.id !== user.id) {
      return NextResponse.json({ error: "Bu e-posta zaten kullanımda" }, { status: 409 });
    }
    patch.email = email;
  }
  if (typeof body.avatarColor === "string" && AVATAR_RENKLERI.has(body.avatarColor)) {
    patch.avatarColor = body.avatarColor;
  }
  if (typeof body.workspaceName === "string") {
    patch.workspaceName = body.workspaceName.trim().slice(0, 60);
  }
  if (typeof body.locale === "string" && GECERLI_DIL.has(body.locale)) {
    patch.locale = body.locale;
  }
  if (typeof body.timezone === "string" && body.timezone.length <= 64) {
    patch.timezone = body.timezone;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Güncellenecek geçerli alan yok" }, { status: 400 });
  }

  const guncel = Users.updateProfile(user.id, patch);
  if (!guncel) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  Audit.log(user.id, guncel.name, "hesap.guncelle", guncel.email, patch);

  return NextResponse.json({
    user: {
      name: guncel.name,
      email: guncel.email,
      avatarColor: guncel.avatarColor,
      workspaceName: guncel.workspaceName ?? "",
      locale: guncel.locale ?? "tr",
      timezone: guncel.timezone ?? "Europe/Istanbul",
    },
  });
}

/** Hesabı kalıcı sil (onay istemci tarafında e-posta eşleşmesiyle alınır). */
export async function DELETE(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { confirm } = await req.json().catch(() => ({}));
  if (typeof confirm !== "string" || confirm.trim().toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json({ error: "Onay e-postası eşleşmiyor" }, { status: 400 });
  }

  Users.remove(user.id);
  await endSession();
  return NextResponse.json({ ok: true });
}
