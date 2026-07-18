/**
 * POST /api/rules/paket → bir kural paketini (marketplace bundle) bir siteye
 * tek tıkla kur. Paketin tüm kurallarını Rules.create ile ekler.
 * currentUser + site ownerId guard'lı + audit.
 */
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Sites, Rules, Audit } from "@/lib/db/db";
import { KURAL_PAKETLERI } from "@/lib/specter/rule-marketplace";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { paketKey, siteId } = await req.json().catch(() => ({}));

  const paket = KURAL_PAKETLERI.find((p) => p.key === paketKey);
  if (!paket) return NextResponse.json({ error: "geçersiz paket" }, { status: 400 });

  // Site sahiplik doğrulaması.
  const site = Sites.byId(siteId);
  if (!site || site.ownerId !== user.id) return NextResponse.json({ error: "site bulunamadı" }, { status: 404 });

  let eklenen = 0;
  for (const k of paket.kurallar) {
    Rules.create({
      siteId: site.id,
      name: k.ad,
      description: k.aciklama,
      enabled: true,
      priority: k.priority,
      field: k.field,
      op: k.op,
      value: k.value,
      action: k.action,
    });
    eklenen++;
  }

  Audit.log(user.id, user.name, "kural.paket-kur", `${paket.ad} → ${site.name}`, { kural: String(eklenen) });
  return NextResponse.json({ ok: true, eklenen, paket: paket.ad });
}
