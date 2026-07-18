/**
 * PATCH  /api/promo/[id]  → promo kodunu güncelle (aktif toggle, değer, vb.)
 * DELETE /api/promo/[id]  → promo kodunu sil
 * Yalnızca giriş yapmış kullanıcı. Audit'e yazılır.
 */
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Promo, Audit } from "@/lib/db/db";
import type { PromoTur, Plan } from "@/lib/db/schema";

const TURLER: PromoTur[] = ["yuzde", "sabit"];
const PLAN_KISIT: Array<"hepsi" | Plan> = ["hepsi", "free", "pro", "scale"];

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const mevcut = Promo.byId(id);
  if (!mevcut) return NextResponse.json({ error: "not_found" }, { status: 404 });

  try {
    const body = await req.json().catch(() => ({}));
    const patch: Parameters<typeof Promo.update>[1] = {};

    if (body.aktif !== undefined) patch.aktif = !!body.aktif;
    if (body.tur !== undefined) {
      if (!TURLER.includes(body.tur)) return NextResponse.json({ error: "Geçersiz tür." }, { status: 400 });
      patch.tur = body.tur;
    }
    if (body.deger !== undefined) {
      const d = Number(body.deger);
      if (!isFinite(d) || d <= 0) return NextResponse.json({ error: "Geçersiz değer." }, { status: 400 });
      const tur = patch.tur ?? mevcut.tur;
      if (tur === "yuzde" && d > 100) return NextResponse.json({ error: "Yüzde 100'ü aşamaz." }, { status: 400 });
      patch.deger = d;
    }
    if (body.aciklama !== undefined) patch.aciklama = String(body.aciklama);
    if (body.maxKullanim !== undefined) {
      patch.maxKullanim = body.maxKullanim == null || Number(body.maxKullanim) <= 0 ? null : Math.round(Number(body.maxKullanim));
    }
    if (body.sonKullanma !== undefined) {
      if (!body.sonKullanma) patch.sonKullanma = null;
      else {
        const t = Date.parse(String(body.sonKullanma));
        if (Number.isNaN(t)) return NextResponse.json({ error: "Geçersiz tarih." }, { status: 400 });
        patch.sonKullanma = new Date(t).toISOString();
      }
    }
    if (body.planKisiti !== undefined) {
      if (!PLAN_KISIT.includes(body.planKisiti)) return NextResponse.json({ error: "Geçersiz plan kısıtı." }, { status: 400 });
      patch.planKisiti = body.planKisiti;
    }

    const guncel = Promo.update(id, patch);
    if (!guncel) return NextResponse.json({ error: "not_found" }, { status: 404 });

    if (body.aktif !== undefined && Object.keys(patch).length === 1) {
      Audit.log(user.id, user.name, "promo.durum", `${guncel.kod} → ${guncel.aktif ? "aktif" : "pasif"}`);
    } else {
      Audit.log(user.id, user.name, "promo.güncelle", guncel.kod);
    }
    return NextResponse.json({ promo: guncel });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const mevcut = Promo.byId(id);
  if (!mevcut) return NextResponse.json({ error: "not_found" }, { status: 404 });

  Promo.remove(id);
  Audit.log(user.id, user.name, "promo.sil", mevcut.kod, undefined, { critical: true });
  return NextResponse.json({ ok: true });
}
