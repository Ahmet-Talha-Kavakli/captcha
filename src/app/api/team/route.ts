import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Team, Audit } from "@/lib/db/db";
import type { Role } from "@/lib/db/schema";

const GECERLI_ROLLER: Role[] = ["admin", "analyst", "viewer"];

/** Yeni üye davet et (status="invited"). */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { name, email, role, title } = await req.json().catch(() => ({}));
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "geçerli e-posta gerekli" }, { status: 400 });
  }
  // Aynı e-posta zaten ekipteyse tekrar davet etme.
  if (Team.forOwner(user.id).some((m) => m.email.toLowerCase() === email.toLowerCase())) {
    return NextResponse.json({ error: "bu e-posta zaten ekipte" }, { status: 409 });
  }
  const secilenRol: Role = GECERLI_ROLLER.includes(role) ? role : "viewer";
  const m = Team.invite(user.id, name?.trim() || email.split("@")[0], email.trim(), secilenRol, {
    title: title?.trim() || undefined,
    invitedBy: user.name,
  });
  Audit.log(user.id, user.name, "üye.davet", email, { rol: secilenRol });
  return NextResponse.json({ member: m });
}

/** Rol değiştir veya bekleyen daveti yeniden gönder. */
export async function PATCH(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id, action, role } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  const hedef = Team.byId(user.id, id);
  if (!hedef) return NextResponse.json({ error: "üye bulunamadı" }, { status: 404 });
  if (hedef.role === "owner") return NextResponse.json({ error: "sahip değiştirilemez" }, { status: 403 });

  if (action === "resend") {
    const m = Team.resendInvite(user.id, id);
    if (!m) return NextResponse.json({ error: "yalnızca bekleyen davetler yenilenebilir" }, { status: 400 });
    Audit.log(user.id, user.name, "üye.davet-yenile", hedef.email);
    return NextResponse.json({ member: m });
  }

  // Varsayılan: rol değişikliği.
  if (!GECERLI_ROLLER.includes(role)) return NextResponse.json({ error: "geçersiz rol" }, { status: 400 });
  const m = Team.changeRole(user.id, id, role);
  if (!m) return NextResponse.json({ error: "rol değiştirilemedi" }, { status: 400 });
  Audit.log(user.id, user.name, "üye.rol-değiştir", hedef.email, { yeniRol: role });
  return NextResponse.json({ member: m });
}

/** Üye çıkar veya bekleyen daveti iptal et. */
export async function DELETE(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });
  const hedef = Team.byId(user.id, id);
  if (!hedef) return NextResponse.json({ error: "üye bulunamadı" }, { status: 404 });
  const ok = Team.removeForOwner(user.id, id);
  if (!ok) return NextResponse.json({ error: "sahip çıkarılamaz" }, { status: 403 });
  Audit.log(user.id, user.name, hedef.status === "invited" ? "üye.davet-iptal" : "üye.çıkar", hedef.email);
  return NextResponse.json({ ok: true });
}
