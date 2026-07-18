/**
 * Kredi API
 * ---------
 * GET  /api/account/kredi         → bakiye + son hareketler
 * POST /api/account/kredi         → kredi satın al (paket)  Body: { paket }
 *
 * Kredi, plan kotasının ÜSTÜNDE esnek kapasitedir: kota dolduğunda ek
 * doğrulama isteği krediyle karşılanır (overage yerine kullanıcı-kontrollü).
 */
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Users, Audit } from "@/lib/db/db";
import { ODEME_HAZIR } from "@/lib/specter/plans";

/** Kredi paketleri — miktar + fiyat (₺). */
export const KREDI_PAKETLERI = [
  { id: "k10k", ad: "10.000 kredi", kredi: 10_000, fiyat: 90 },
  { id: "k50k", ad: "50.000 kredi", kredi: 50_000, fiyat: 400, populer: true },
  { id: "k200k", ad: "200.000 kredi", kredi: 200_000, fiyat: 1400 },
] as const;

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({
    bakiye: Users.krediBakiye(user.id),
    hareketler: Users.krediGecmis(user.id, 30),
    paketler: KREDI_PAKETLERI,
  });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Ödeme altyapısı canlı değilken kredi tahsilatı yapılmaz (UI-bypass dahil).
  if (!ODEME_HAZIR) {
    return NextResponse.json(
      {
        error: "payment-not-ready",
        yakinda: true,
        mesaj: "Kredi satın alma yakında. Ödeme altyapısı yayına alınınca kredi yükleyebileceksiniz.",
      },
      { status: 402 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const paket = KREDI_PAKETLERI.find((p) => p.id === body.paket);
  if (!paket) return NextResponse.json({ error: "invalid-package" }, { status: 400 });

  const sonuc = Users.krediHareket(user.id, "satinalma", paket.kredi, `${paket.ad} satın alındı`);
  if (!sonuc) return NextResponse.json({ error: "failed" }, { status: 500 });

  Audit.log(user.id, user.name, "kredi.satinalma", paket.ad, {
    kredi: String(paket.kredi),
    fiyat: String(paket.fiyat),
  });

  return NextResponse.json({
    ok: true,
    bakiye: sonuc.user.krediBakiye ?? 0,
    hareket: sonuc.hareket,
  });
}
