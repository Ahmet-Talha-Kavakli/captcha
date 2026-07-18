/**
 * POST /api/promo/dogrula  → bir promo kodunu doğrula (checkout tarafı)
 * Gövde: { kod: string, planId?: string, hamFiyat?: number }
 * Yanıt (geçerli):   { gecerli: true, tur, deger, aciklama, indirimTutari? }
 * Yanıt (geçersiz):  { gecerli: false, sebep }
 *
 * Auth OPSİYONEL: checkout'ta genelde giriş yapılmış olur ama kodun geçerliliği
 * kullanıcıdan bağımsızdır; oturum yoksa da doğrulama çalışır.
 */
import { NextResponse } from "next/server";
import { Promo, promoIndirimTutari } from "@/lib/db/db";
import { currentUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const kod: string = (body?.kod || "").toString();
    const planId: string | undefined = body?.planId ? String(body.planId) : undefined;
    const hamFiyat: number | undefined =
      typeof body?.hamFiyat === "number" && isFinite(body.hamFiyat) ? body.hamFiyat : undefined;

    if (!kod.trim()) {
      return NextResponse.json({ gecerli: false, sebep: "Bir kod girin." }, { status: 400 });
    }

    // Oturum varsa userId geçir → kullanıcı kodu daha önce kullandıysa checkout'ta
    // ERKEN "zaten kullandınız" uyarısı görür (kesin engel kullan'da; bu UX içindir).
    const user = await currentUser().catch(() => null);
    const sonuc = Promo.dogrula(kod, planId, user?.id);
    if (!sonuc.gecerli || !sonuc.promo) {
      return NextResponse.json({ gecerli: false, sebep: sonuc.sebep ?? "Bu kod geçersiz." });
    }

    const p = sonuc.promo;
    const indirimTutari = hamFiyat != null ? promoIndirimTutari(p, hamFiyat) : undefined;

    return NextResponse.json({
      gecerli: true,
      id: p.id,
      kod: p.kod,
      tur: p.tur,
      deger: p.deger,
      aciklama: p.aciklama,
      planKisiti: p.planKisiti,
      ...(indirimTutari != null ? { indirimTutari } : {}),
    });
  } catch {
    return NextResponse.json({ gecerli: false, sebep: "Doğrulama sırasında bir hata oluştu." }, { status: 500 });
  }
}
