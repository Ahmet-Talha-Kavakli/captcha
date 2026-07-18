/**
 * GET /api/ai-robots
 * ------------------
 * Giriş yapmış kullanıcının AI-ajan politikalarından GERÇEK robots.txt üretir.
 * Panel "AI Ajanları" ekranından kopyalanır ve kullanıcı kendi sitesinin
 * köküne koyar. robots.txt naziktir; Veylify uymayan AI'ları AYRICA aktif
 * engeller (verify/passive akışında).
 *
 * Query: ?format=text (varsayılan, indirilebilir) | ?format=json
 */
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Sites } from "@/lib/db/db";
import { aiRobotsUret, aiPolitikaOzet } from "@/lib/specter/ai-agents";

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const format = url.searchParams.get("format") || "text";

  const site = Sites.forOwner(user.id)[0];
  const siteUrl = site?.domains?.[0]
    ? `https://${site.domains[0].replace(/^https?:\/\//, "")}`
    : undefined;

  const robots = aiRobotsUret(user.aiPolicies, { siteUrl });

  if (format === "json") {
    return NextResponse.json({
      robots,
      ozet: aiPolitikaOzet(user.aiPolicies),
    });
  }

  return new NextResponse(robots, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": 'inline; filename="robots.txt"',
    },
  });
}
