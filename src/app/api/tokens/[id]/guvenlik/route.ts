/**
 * Specter — API Anahtarı Güvenlik Eylemleri
 * =========================================
 * Bir anahtarı döndür (rotate) veya sızıntı taraması simülasyonuyla sızmış
 * işaretle. Yalnızca anahtar sahibi.
 *
 *   POST /api/tokens/:id/guvenlik  { eylem: "dondur" | "sizinti-tara" }
 */
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Tokens, Audit } from "@/lib/db/db";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const t = Tokens.byId(user.id, id);
  if (!t) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const eylem = String(body.eylem ?? "");

  if (eylem === "dondur") {
    const sonuc = Tokens.rotate(user.id, id);
    if (!sonuc) return NextResponse.json({ error: "döndürülemedi" }, { status: 400 });
    Audit.log(user.id, user.name, "anahtar.döndür", t.name);
    return NextResponse.json({ ok: true, secret: sonuc.secret, prefix: sonuc.token.prefix });
  }

  if (eylem === "sizinti-tara") {
    // Sızıntı taraması simülasyonu: prefix'in hash'inden deterministik bir karar.
    // Gerçek üründe bu, GitHub/paste/log taraması + secret-scanning ile yapılır.
    let h = 0;
    for (const c of t.prefix) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const sizmis = h % 5 === 0; // ~%20 demo tespiti
    if (sizmis) {
      Tokens.markLeaked(user.id, id, "GitHub public repo (simülasyon)");
      Audit.log(user.id, user.name, "anahtar.sızıntı-tespit", t.name);
      return NextResponse.json({ ok: true, sizmis: true, source: "GitHub public repo (simülasyon)" });
    }
    return NextResponse.json({ ok: true, sizmis: false });
  }

  return NextResponse.json({ error: "geçersiz eylem" }, { status: 400 });
}
