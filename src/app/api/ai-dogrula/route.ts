/**
 * Specter — AI Ajan Doğrulama API'si (anti-spoofing test aracı)
 * ============================================================
 * Bir UA + IP (+ opsiyonel PTR) alır, iddia edilen AI ajanını tespit eder ve
 * kaynağın GERÇEKTEN o ajan olup olmadığını (IP aralığı / reverse-DNS ile)
 * doğrular. Panel'deki canlı doğrulama aracını besler.
 *
 *   POST /api/ai-dogrula  { ua, ip, ptr? }
 */
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { aiAjanTespit } from "@/lib/specter/ai-agents";
import { aiAjanDogrula } from "@/lib/specter/ai-verify";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const ua = String(body.ua ?? "");
  const ip = String(body.ip ?? "");
  const ptr = body.ptr ? String(body.ptr) : null;

  if (!ua || !ip) return NextResponse.json({ error: "ua-ip-gerekli" }, { status: 400 });

  const ajan = aiAjanTespit(ua.toLowerCase());
  if (!ajan) {
    return NextResponse.json({
      ajan: null,
      sonuc: {
        durum: "dogrulanamaz",
        yontem: "yok",
        aciklama: "User-Agent bilinen bir AI ajanı iddia etmiyor. Bu bir AI botu değil ya da tanınmayan bir tarayıcı.",
        kanit: null,
        onerilenAksiyon: "dogrula",
      },
    });
  }

  const sonuc = aiAjanDogrula(ajan.id, ajan.dogrulama, ip, ptr);
  return NextResponse.json({
    ajan: { id: ajan.id, urun: ajan.urun, operator: ajan.operator, kategori: ajan.kategori, dogrulama: ajan.dogrulama, logo: ajan.logo, ipYayin: ajan.ipYayin ?? null },
    sonuc,
  });
}
