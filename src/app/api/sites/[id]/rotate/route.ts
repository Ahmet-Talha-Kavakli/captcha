/**
 * POST /api/sites/:id/rotate → secret key'i yeniden üret.
 * (Sızıntı sonrası key döndürme akışı.)
 */
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Sites } from "@/lib/db/db";
import { generateSiteKeys } from "@/lib/specter/crypto";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const site = Sites.byId(id);
  if (!site || site.ownerId !== user.id) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const { secretKey } = generateSiteKeys();
  const updated = Sites.update(id, { secretKey });
  return NextResponse.json({ site: updated });
}
