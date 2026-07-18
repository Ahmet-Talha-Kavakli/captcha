/**
 * GET /api/digest → hesabın haftalık güvenlik özet e-postasının HTML
 * önizlemesini döndürür (gerçek gönderim ayrı SMTP katmanı). currentUser guard.
 */
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { digestHazirla } from "@/lib/specter/email-digest";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const d = digestHazirla(user.id);
  if (!d) return NextResponse.json({ error: "not_found" }, { status: 404 });
  // HTML önizleme olarak döndür (iframe/yeni sekmede görüntülenebilir).
  return new NextResponse(d.html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
