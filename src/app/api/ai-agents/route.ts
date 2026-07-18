/**
 * POST /api/ai-agents
 * --------------------
 * Bir AI ajanı için koruma politikasını ("izin" | "dogrula" | "engelle")
 * belirler. currentUser + kendi hesabı guard'lı. Politika kalıcı yazılır ve
 * verify akışında (rule-engine üzerinden) uygulanır.
 */
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Users, Audit } from "@/lib/db/db";
import { AI_AJANLAR, AI_POLITIKA_ETIKET } from "@/lib/specter/ai-agents";

const GECERLI = ["izin", "dogrula", "engelle"];

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const agentId: string = body.agentId || "";
  const policy: string = body.policy || "";

  if (!AI_AJANLAR.some((a) => a.id === agentId)) {
    return NextResponse.json({ error: "unknown-agent" }, { status: 400 });
  }
  if (!GECERLI.includes(policy)) {
    return NextResponse.json({ error: "invalid-policy" }, { status: 400 });
  }

  const updated = Users.setAiPolicy(user.id, agentId, policy);
  if (!updated) return NextResponse.json({ error: "not-found" }, { status: 404 });

  const ajan = AI_AJANLAR.find((a) => a.id === agentId)!;
  Audit.log(user.id, user.name, "ai.policy", ajan.urun, {
    agent: ajan.urun,
    policy: AI_POLITIKA_ETIKET[policy as keyof typeof AI_POLITIKA_ETIKET],
  });

  return NextResponse.json({ ok: true, agentId, policy, policies: updated.aiPolicies });
}
