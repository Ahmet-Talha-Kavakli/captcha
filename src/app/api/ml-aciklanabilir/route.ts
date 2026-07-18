/**
 * Specter — ML Açıklanabilirlik Canlı Sınıflandırma API'si
 * =======================================================
 * Bir girdi sinyali seti alır, sınıflandırıcıyı çalıştırır ve açıklamalı sonucu
 * (olasılıklar + katkılar + karşı-olgusal) döner. İnteraktif "neden bu karar"
 * aracını besler.
 *   POST /api/ml-aciklanabilir  { ua, behaviorScore, headless, tlsMismatch, aiAjan, rate }
 */
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { aciklamaliSiniflandir } from "@/lib/specter/ml-aciklanabilir";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const sonuc = aciklamaliSiniflandir({
    ua: String(b.ua ?? "Mozilla/5.0"),
    behaviorScore: typeof b.behaviorScore === "number" ? b.behaviorScore : 0.5,
    headless: !!b.headless,
    tlsMismatch: !!b.tlsMismatch,
    aiAjan: !!b.aiAjan,
    rate: typeof b.rate === "number" ? b.rate : 0,
  });

  return NextResponse.json({
    sinif: sonuc.sinif,
    guven: sonuc.guven,
    insanMi: sonuc.insanMi,
    guvenYorum: sonuc.guvenYorum,
    siraliOlasilik: sonuc.siraliOlasilik,
    katkilar: sonuc.katkilar,
    karsiOlgusal: sonuc.karsiOlgusal,
  });
}
