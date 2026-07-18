/**
 * Specter — Tehdit Avı Sorgu API'si
 * =================================
 * Bir sorgu dizesi alır, sahibin olaylarında çalıştırır, eşleşmeleri + özeti döner.
 *   POST /api/tehdit-avi  { sorgu }
 */
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { tehditAvi } from "@/lib/specter/tehdit-avi";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const sorgu = String(body.sorgu ?? "");

  const events = Events.forOwner(user.id, 3000);
  const sonuc = tehditAvi(sorgu, events, 150);

  return NextResponse.json({
    eslesme: sonuc.eslesme,
    toplam: sonuc.toplam,
    ozet: sonuc.ozet,
    olaylar: sonuc.eslesmeler.map((e) => ({
      id: e.id, ts: e.ts, ip: e.ip, country: e.country, asn: e.asn, ua: e.ua,
      path: e.path, method: e.method, botClass: e.botClass, verdict: e.verdict,
      score: e.score, headless: !!e.headless, tls: !!e.tlsUaUyumsuz,
    })),
  });
}
