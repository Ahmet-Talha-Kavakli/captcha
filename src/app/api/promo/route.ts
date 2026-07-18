/**
 * GET  /api/promo  → tüm promo kodları (yönetim)
 * POST /api/promo  → yeni promo kodu oluştur
 * Yalnızca giriş yapmış kullanıcı (yönetim). Audit'e yazılır.
 */
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Promo, Audit } from "@/lib/db/db";
import type { PromoTur, Plan } from "@/lib/db/schema";

const TURLER: PromoTur[] = ["yuzde", "sabit"];
const PLAN_KISIT: Array<"hepsi" | Plan> = ["hepsi", "free", "pro", "scale"];

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ promoKodlar: Promo.all() });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const kod = (body?.kod || "").toString();
    const tur = body?.tur as PromoTur;
    const deger = Number(body?.deger);
    const aciklama = (body?.aciklama || "").toString();
    const planKisiti = (body?.planKisiti || "hepsi") as "hepsi" | Plan;

    if (!TURLER.includes(tur)) return NextResponse.json({ error: "Geçersiz indirim türü." }, { status: 400 });
    if (!isFinite(deger)) return NextResponse.json({ error: "Değer sayı olmalı." }, { status: 400 });
    if (!PLAN_KISIT.includes(planKisiti)) return NextResponse.json({ error: "Geçersiz plan kısıtı." }, { status: 400 });

    // maxKullanim: boş/0 → sınırsız (null)
    const maxHam = body?.maxKullanim;
    const maxKullanim =
      maxHam === "" || maxHam == null || Number(maxHam) <= 0 ? null : Math.round(Number(maxHam));

    // sonKullanma: "YYYY-MM-DD" ya da ISO ya da boş
    let sonKullanma: string | null = null;
    if (body?.sonKullanma) {
      const t = Date.parse(String(body.sonKullanma));
      if (Number.isNaN(t)) return NextResponse.json({ error: "Geçersiz son kullanma tarihi." }, { status: 400 });
      sonKullanma = new Date(t).toISOString();
    }

    const { promo, hata } = Promo.create({
      kod,
      tur,
      deger,
      aciklama,
      maxKullanim,
      sonKullanma,
      aktif: body?.aktif !== false,
      planKisiti,
    });
    if (hata || !promo) return NextResponse.json({ error: hata ?? "Kod oluşturulamadı." }, { status: 400 });

    Audit.log(user.id, user.name, "promo.oluştur", promo.kod, {
      tür: promo.tur,
      değer: String(promo.deger),
    });
    return NextResponse.json({ promo });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
