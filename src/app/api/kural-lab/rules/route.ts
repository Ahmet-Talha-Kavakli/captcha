import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Rules, Sites } from "@/lib/db/db";

/**
 * GET /api/kural-lab/rules?siteId=...
 * Kural Test Laboratuvarı'nda site DEĞİŞTİRİLDİĞİNDE o sitenin aktif kural
 * setini (öncelik sırasıyla) döner — değerlendirme izini yeniden çizmek için.
 * Salt-okunur; yalnızca kullanıcının sahip olduğu sitelere izin verir.
 */
export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const siteId = searchParams.get("siteId") ?? "";
  const site = Sites.byId(siteId);
  if (!site || site.ownerId !== user.id) {
    return NextResponse.json({ error: "site" }, { status: 400 });
  }

  const kurallar = Rules.forSite(site.id).map((r) => ({
    id: r.id,
    ad: r.name,
    aciklama: r.description,
    enabled: r.enabled,
    priority: r.priority,
    field: r.field,
    op: r.op,
    value: r.value,
    action: r.action,
    kosulGrup: r.kosulGrup ?? null,
    system: r.system,
  }));

  return NextResponse.json({ kurallar });
}
