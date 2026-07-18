import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Rules, Sites } from "@/lib/db/db";
import { evaluateRules } from "@/lib/specter/rule-engine";
import { aiAjanTespit } from "@/lib/specter/ai-agents";
import { fingerprintUret } from "@/lib/specter/fingerprint";
import type { BotClass } from "@/lib/db/schema";

/**
 * POST /api/rules/simulate
 * Bir hayali istek bağlamı alır, sitenin kurallarını değerlendirir ve
 * hangi kuralların tetiklendiğini + nihai kararı döner. Kural motorunun
 * GERÇEK çalıştığını kanıtlayan playground.
 */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const site = Sites.byId(body.siteId);
  if (!site || site.ownerId !== user.id) return NextResponse.json({ error: "site" }, { status: 400 });

  const rules = Rules.forSite(site.id);
  const ua = body.ua || "Mozilla/5.0";
  const ip = body.ip || "1.2.3.4";

  // UA'dan AI ajanı + parmak izi türet — canlı akışla aynı sinyaller.
  const aiAjan = aiAjanTespit(ua.toLowerCase());
  const botClass = (body.botClass as BotClass) || (aiAjan ? "ai_agent" : "human");
  const fp = fingerprintUret(ua, botClass, ip);

  // İstemci açık override gönderirse (headless/tls toggle) onu kullan, yoksa parmak izinden gelen.
  const headless = typeof body.headless === "boolean" ? body.headless : fp.headless;
  const tlsUaUyumsuz = typeof body.tlsMismatch === "boolean" ? body.tlsMismatch : fp.tlsUaUyumsuz;

  const result = evaluateRules(rules, {
    ip,
    country: body.country || "TR",
    asn: body.asn || "AS0 Unknown",
    ua,
    path: body.path || "/",
    score: typeof body.score === "number" ? body.score : 0.5,
    botClass,
    rate: body.rate || 0,
    aiAgentId: aiAjan?.id ?? "",
    aiCategory: aiAjan?.kategori ?? "",
    headless,
    tlsUaUyumsuz,
    httpVersion: body.httpVersion || fp.httpVersion,
  });

  return NextResponse.json({
    action: result.action,
    decidedBy: result.decidedBy,
    matched: result.matched,
    evaluated: rules.filter((r) => r.enabled).length,
    // Türetilen sinyaller — playground'da gösterilsin.
    sinyaller: { aiAgentId: aiAjan?.id ?? "", aiCategory: aiAjan?.kategori ?? "", headless, tlsUaUyumsuz, httpVersion: body.httpVersion || fp.httpVersion },
  });
}
