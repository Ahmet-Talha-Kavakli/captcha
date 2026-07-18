/**
 * POST /api/ai-agents/sablon
 * --------------------------
 * Tek tıkla bir POLİTİKA ŞABLONUNU (Sıkı / Dengeli / Açık / Yalnız-arama /
 * Hepsini-engelle) tüm AI ajanlarına uygular. Kategori-bazlı akıllı kararlar
 * kalıcı yazılır ve verify/passive akışında + robots.txt üretiminde kullanılır.
 * Body: { sablon: AiSablonId }
 */
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Users, Audit } from "@/lib/db/db";
import { AI_SABLONLAR, aiSablonUygula, type AiSablonId } from "@/lib/specter/ai-agents";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const sablonId: string = body.sablon || "";
  const sablon = AI_SABLONLAR.find((s) => s.id === sablonId);
  if (!sablon) {
    return NextResponse.json({ error: "unknown-template" }, { status: 400 });
  }

  const politikalar = aiSablonUygula(sablonId as AiSablonId);
  const updated = Users.setAiPolicies(user.id, politikalar);
  if (!updated) return NextResponse.json({ error: "not-found" }, { status: 404 });

  Audit.log(user.id, user.name, "ai.policy.template", sablon.ad, {
    template: sablon.ad,
    count: String(Object.keys(politikalar).length),
  });

  return NextResponse.json({
    ok: true,
    sablon: sablonId,
    uygulanan: Object.keys(politikalar).length,
    policies: updated.aiPolicies,
  });
}
