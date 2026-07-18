import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Rules, Sites, Audit } from "@/lib/db/db";

async function guard(id: string) {
  const user = await currentUser();
  if (!user) return { err: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  const rule = Rules.byId(id);
  if (!rule) return { err: NextResponse.json({ error: "not found" }, { status: 404 }) };
  const site = Sites.byId(rule.siteId);
  if (!site || site.ownerId !== user.id) return { err: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  return { user, rule };
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const g = await guard(id);
  if (g.err) return g.err;
  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};
  for (const k of ["name", "description", "enabled", "priority", "field", "op", "value", "action"]) {
    if (k in body) patch[k] = body[k];
  }
  // Değişiklik özeti (geçmiş kaydı için).
  const degisen = Object.keys(patch).join(", ");
  const updated = Rules.update(id, patch, g.user!.name, degisen ? `${degisen} güncellendi` : "Güncellendi");
  Audit.log(g.user!.id, g.user!.name, "kural.güncelle", g.rule!.name);
  return NextResponse.json({ rule: updated });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const g = await guard(id);
  if (g.err) return g.err;
  if (g.rule!.system) return NextResponse.json({ error: "system rule" }, { status: 400 });
  Rules.remove(id);
  Audit.log(g.user!.id, g.user!.name, "kural.sil", g.rule!.name);
  return NextResponse.json({ ok: true });
}
