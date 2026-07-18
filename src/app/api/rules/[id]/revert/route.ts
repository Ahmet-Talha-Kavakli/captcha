/**
 * Specter — Kural Sürüm Geri-Alma
 * ===============================
 * Bir kuralı geçmişteki bir sürüme geri döndürür. Mevcut durum da geçmişe
 * yazılır → geri-alma da geri-alınabilir (güvenli). Yalnızca kural sahibi.
 *
 *   POST /api/rules/:id/revert  { surum }
 */
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Rules, Sites, Audit } from "@/lib/db/db";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rule = Rules.byId(id);
  if (!rule) return NextResponse.json({ error: "not found" }, { status: 404 });
  const site = Sites.byId(rule.siteId);
  if (!site || site.ownerId !== user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const surum = Number(body.surum);
  if (!Number.isInteger(surum) || surum < 1) return NextResponse.json({ error: "sürüm" }, { status: 400 });

  const updated = Rules.revert(id, surum, user.name);
  if (!updated) return NextResponse.json({ error: "sürüm bulunamadı" }, { status: 404 });

  Audit.log(user.id, user.name, "kural.geri-al", `${rule.name} → sürüm ${surum}`);
  return NextResponse.json({ rule: { id: updated.id, name: updated.name, surum } });
}
