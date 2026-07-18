import { NextResponse } from "next/server";
import { Iletisim } from "@/lib/db/db";

/**
 * POST /api/iletisim — kurumsal iletişim formu.
 * Body: { ad, eposta, konu, mesaj }
 * Sunucu-tarafı doğrulama yapar ve mesajı GERÇEKTEN kalıcı DB'ye kaydeder
 * (fake değil). Referans no kayıt üzerinden üretilir.
 */

const EPOSTA_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, error: "Geçersiz istek gövdesi." },
        { status: 400 },
      );
    }

    const ad = String((body as Record<string, unknown>).ad ?? "").trim();
    const eposta = String((body as Record<string, unknown>).eposta ?? "").trim();
    const konu = String((body as Record<string, unknown>).konu ?? "").trim();
    const mesaj = String((body as Record<string, unknown>).mesaj ?? "").trim();

    const hatalar: Record<string, string> = {};
    if (ad.length < 2) hatalar.ad = "Lütfen adınızı girin.";
    if (!EPOSTA_RE.test(eposta)) hatalar.eposta = "Geçerli bir e-posta adresi girin.";
    if (konu.length < 2) hatalar.konu = "Lütfen bir konu girin.";
    if (mesaj.length < 10) hatalar.mesaj = "Mesajınız en az 10 karakter olmalı.";

    if (Object.keys(hatalar).length > 0) {
      return NextResponse.json(
        { ok: false, error: "Formda eksik veya hatalı alanlar var.", hatalar },
        { status: 422 },
      );
    }

    // Mesajı GERÇEKTEN kalıcı DB'ye kaydet (fake değil).
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      undefined;
    const kayit = Iletisim.kaydet({ ad, eposta, konu, mesaj, ip });

    return NextResponse.json({
      ok: true,
      referans: kayit.referans,
      mesaj: "Mesajınız alındı. En kısa sürede size dönüş yapacağız.",
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin." },
      { status: 500 },
    );
  }
}
