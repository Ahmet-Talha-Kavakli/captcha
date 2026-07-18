/**
 * GET /api/search?q=... → hesabın tüm varlıklarında birleşik arama.
 * Global arama çubuğu + komut paleti kullanır. currentUser guard'lı.
 */
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { globalAra } from "@/lib/specter/global-search";

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const q = new URL(req.url).searchParams.get("q") ?? "";
  const sonuclar = globalAra(user.id, q, 24);
  return NextResponse.json({ sonuclar });
}
