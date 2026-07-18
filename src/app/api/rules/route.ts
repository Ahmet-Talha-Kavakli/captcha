import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Rules, Sites, Audit } from "@/lib/db/db";
import type { RuleKosulGrup } from "@/lib/db/schema";

const GECERLI_FIELD = new Set(["ip", "country", "asn", "ua", "path", "score", "botClass", "rate", "aiAgent", "aiCategory", "headless", "tlsMismatch", "httpVersion"]);
const GECERLI_OP = new Set(["eq", "neq", "contains", "gt", "lt", "in"]);

/** Gelişmiş koşul ağacını güvenle doğrular (kötü/eksik girdi kaydedilmesin). */
function gecerliKosulGrup(g: unknown, derinlik = 0): g is RuleKosulGrup {
  if (!g || typeof g !== "object" || derinlik > 4) return false;
  const grup = g as Record<string, unknown>;
  if (grup.birlestir !== "and" && grup.birlestir !== "or") return false;
  const kosullar = Array.isArray(grup.kosullar) ? grup.kosullar : [];
  const gruplar = Array.isArray(grup.gruplar) ? grup.gruplar : [];
  if (kosullar.length + gruplar.length === 0) return false;
  for (const k of kosullar) {
    const kk = k as Record<string, unknown>;
    if (!GECERLI_FIELD.has(String(kk.field)) || !GECERLI_OP.has(String(kk.op)) || typeof kk.value !== "string") return false;
  }
  for (const alt of gruplar) if (!gecerliKosulGrup(alt, derinlik + 1)) return false;
  return true;
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const site = Sites.byId(body.siteId);
  if (!site || site.ownerId !== user.id) return NextResponse.json({ error: "site" }, { status: 400 });

  // Gelişmiş koşul ağacı (v18) — verilirse geçir, doğrula.
  const kosulGrup = gecerliKosulGrup(body.kosulGrup) ? body.kosulGrup : undefined;

  const rule = Rules.create({
    siteId: body.siteId,
    name: body.name || "Yeni kural",
    description: body.description || "",
    enabled: true,
    priority: Number(body.priority) || 10,
    field: body.field || "score",
    op: body.op || "lt",
    value: String(body.value ?? ""),
    action: body.action || "challenge",
    ...(kosulGrup ? { kosulGrup } : {}),
  });
  Audit.log(user.id, user.name, "kural.oluştur", rule.name);
  return NextResponse.json({ rule });
}
