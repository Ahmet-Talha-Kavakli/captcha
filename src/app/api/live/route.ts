import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { pumpLiveEvents } from "@/lib/db/live";

/**
 * GET /api/live?since=<ts>
 * Canlı trafik akışı. Her çağrıda birkaç yeni gerçekçi olay üretir
 * (canlı his), sonra `since`'den yeni olayları döner.
 */
export async function GET(req: Request) {
  // EGRESS: bu uç 3sn'de bir poll edilir. `taze:false` → Supabase blob'unu her
  // poll'de yeniden İNDİRME (TTL'li hafif okuma yeter; kim olduğumuzu cookie
  // zaten söyler). Aksi halde her poll ~1MB+ blob egress'i üretirdi.
  const user = await currentUser({ taze: false });
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  pumpLiveEvents(user.id);

  const url = new URL(req.url);
  const since = Number(url.searchParams.get("since")) || Date.now() - 10000;
  const all = Events.forOwner(user.id, 100);
  const yeni = all.filter((e) => e.ts > since).sort((a, b) => a.ts - b.ts);

  return NextResponse.json({
    now: Date.now(),
    events: yeni.map((e) => ({
      id: e.id, ts: e.ts, ip: e.ip, country: e.country, asn: e.asn, ua: e.ua,
      path: e.path, method: e.method, botClass: e.botClass, verdict: e.verdict,
      score: e.score, triggeredRules: e.triggeredRules, fingerprint: e.fingerprint,
      latency: e.latency, siteId: e.siteId,
    })),
  });
}
