/**
 * POST /api/promo/kullan  → bir promo kodunun kullanımını kaydeder (redemption)
 * Gövde: { promoId, planId, indirimTutari }
 * Checkout satın-alma tamamlandığında çağrılır: kullanilan sayacını atomik
 * artırır + kullanım logu yazar. Giriş yapılmış kullanıcı gerekir.
 */
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Promo, promoIndirimTutari, Audit } from "@/lib/db/db";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const promoId = String(body?.promoId || "");
    const planId = String(body?.planId || "");
    if (!promoId) return NextResponse.json({ error: "promoId gerekli" }, { status: 400 });

    const promo = Promo.byId(promoId);
    if (!promo) return NextResponse.json({ error: "not_found" }, { status: 404 });

    // Kullanım anında SON KEZ doğrula (aktif/süre/limit) — istemciye güvenme.
    const dog = Promo.dogrula(promo.kod, planId || undefined);
    if (!dog.gecerli) return NextResponse.json({ error: dog.sebep ?? "Kod artık geçerli değil." }, { status: 400 });

    // İndirim tutarını istemciye güvenmeden sunucuda yeniden hesapla (hamFiyat
    // verilirse); yoksa istemci değerini son çare olarak al.
    const hamFiyat = typeof body?.hamFiyat === "number" ? body.hamFiyat : undefined;
    const indirimTutari =
      hamFiyat != null ? promoIndirimTutari(promo, hamFiyat) : Number(body?.indirimTutari) || 0;

    const kayit = Promo.kullanimKaydet({ promoId, userId: user.id, planId, indirimTutari });
    if (!kayit) return NextResponse.json({ error: "Kullanım kaydedilemedi (limit dolmuş olabilir)." }, { status: 400 });

    Audit.log(user.id, user.name, "promo.kullan", `${promo.kod} · ${planId}`, {
      indirim: String(indirimTutari),
    });
    return NextResponse.json({ ok: true, kullanim: kayit });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
