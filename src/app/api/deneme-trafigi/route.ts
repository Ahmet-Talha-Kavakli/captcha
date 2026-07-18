/**
 * POST /api/deneme-trafigi
 * ------------------------
 * Kullanıcının AÇIKÇA istediği deneme trafiği üretir (otomatik/gizli DEĞİL).
 * Widget entegre edilene kadar ürünü gerçek verilerle deneyimlemek için.
 * Body: { adet?: number }  (varsayılan 30, 1..200 arası kırpılır)
 */
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Sites, Audit } from "@/lib/db/db";
import { denemeTrafigiUret } from "@/lib/db/live";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const sites = Sites.forOwner(user.id);
  if (!sites.length) {
    return NextResponse.json(
      { ok: false, error: "Önce bir site eklemelisiniz." },
      { status: 400 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const adet = typeof body.adet === "number" ? body.adet : 30;
  const uretilen = denemeTrafigiUret(user.id, adet);

  Audit.log(user.id, user.name, "deneme.trafigi", "Deneme trafiği", { adet: String(uretilen) });

  return NextResponse.json({
    ok: true,
    uretilen,
    mesaj: `${uretilen} deneme olayı oluşturuldu. Canlı Trafik ve panolarınızda görebilirsiniz.`,
  });
}
