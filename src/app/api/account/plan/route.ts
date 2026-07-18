/**
 * POST /api/account/plan
 * ----------------------
 * Kullanıcının abonelik planını GERÇEKTEN değiştirir (yükseltme/düşürme).
 * Promo kodu uygulandıysa indirim kaydedilir. Fatura geçmişine kayıt düşer.
 * Body: { plan: "free" | "pro" | "scale", promoId?, indirimTutari? }
 */
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Users, Audit, Promo } from "@/lib/db/db";
import { planTanim, ODEME_HAZIR } from "@/lib/specter/plans";
import type { Plan } from "@/lib/db/schema";

const PLANLAR: Plan[] = ["free", "pro", "scale"];

/** Bir plan geçişi para tahsil eder mi? (Ücretli plana YÜKSELTME.) */
function ucretliGecis(eski: Plan, yeni: Plan): boolean {
  const seviye: Record<Plan, number> = { free: 0, pro: 1, scale: 2 };
  return yeni !== "free" && seviye[yeni] > seviye[eski];
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const plan: string = body.plan || "";
  if (!PLANLAR.includes(plan as Plan)) {
    return NextResponse.json({ error: "invalid-plan" }, { status: 400 });
  }
  // Scale → satış talebi (self-servis değişmez).
  if (plan === "scale") {
    Audit.log(user.id, user.name, "plan.talep", "Scale planı", { plan: "scale" });
    return NextResponse.json({ ok: true, talep: true });
  }

  const eskiPlan = user.plan;

  // Ödeme altyapısı canlı değilken ücretli YÜKSELTME tahsilatı yapılmaz —
  // UI'ı bypass eden doğrudan istekler de burada 402 ile durur. Düşürme (→free)
  // ve aynı seviyede kalma serbesttir (para tahsil etmez).
  if (!ODEME_HAZIR && ucretliGecis(eskiPlan as Plan, plan as Plan)) {
    return NextResponse.json(
      {
        error: "payment-not-ready",
        yakinda: true,
        mesaj: "Ücretli abonelikler yakında. Ödeme altyapısı yayına alınınca planınızı yükseltebileceksiniz.",
      },
      { status: 402 },
    );
  }

  const updated = Users.setPlan(user.id, plan as Plan);
  if (!updated) return NextResponse.json({ error: "not-found" }, { status: 404 });

  // Promo kullanımı (varsa) gerçekten kaydet — sayaç + redemption log.
  const promoId: string = body.promoId || "";
  const indirimTutari: number = typeof body.indirimTutari === "number" ? body.indirimTutari : 0;
  if (promoId) {
    Promo.kullanimKaydet({
      promoId,
      userId: user.id,
      planId: plan,
      indirimTutari,
    });
  }

  const tanim = planTanim(plan as Plan);
  Audit.log(user.id, user.name, "plan.degisti", tanim?.ad ?? plan, {
    eski: eskiPlan,
    yeni: plan,
    indirim: String(indirimTutari),
  });

  return NextResponse.json({
    ok: true,
    plan,
    eskiPlan,
    yukseltme: plan !== "free" && eskiPlan === "free",
  });
}
