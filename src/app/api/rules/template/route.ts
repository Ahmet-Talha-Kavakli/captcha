import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Rules, Sites, Audit } from "@/lib/db/db";
import { RULE_TEMPLATES } from "@/lib/specter/rule-templates";

/** POST /api/rules/template — bir şablonu bir siteye uygular. */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { siteId, key } = await req.json().catch(() => ({}));
  const site = Sites.byId(siteId);
  if (!site || site.ownerId !== user.id) return NextResponse.json({ error: "site" }, { status: 400 });
  const tpl = RULE_TEMPLATES.find((t) => t.key === key);
  if (!tpl) return NextResponse.json({ error: "template" }, { status: 400 });

  const rule = Rules.create({
    siteId, name: tpl.name, description: tpl.description, enabled: true,
    priority: tpl.priority, field: tpl.field, op: tpl.op, value: tpl.value, action: tpl.action,
  });
  Audit.log(user.id, user.name, "kural.şablon-ekle", tpl.name);
  return NextResponse.json({ rule });
}
