/**
 * Specter — İmza DSL Derle & Test API'si
 * ======================================
 * Bir imza-DSL alır, derler ve sahibin gerçek olaylarına karşı tarayıp kaç
 * eşleşme olacağını döner. Kaydetmez — canlı test.
 *   POST /api/imza  { ad, dsl }
 */
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { imzaDerle, imzaTara } from "@/lib/specter/imza";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { imza, hata } = imzaDerle(String(body.ad ?? "Özel imza"), String(body.dsl ?? ""));
  if (hata || !imza) return NextResponse.json({ hata: hata ?? "Derleme başarısız" }, { status: 200 });

  const events = Events.forOwner(user.id, 3000);
  const sonuc = imzaTara(events, [imza]);
  const vurus = sonuc.vuruslar[0];

  return NextResponse.json({
    imza: { id: imza.id, ad: imza.ad, birlestir: imza.birlestir, kosullar: imza.kosullar },
    vurus: vurus?.vurus ?? 0,
    benzersizIp: vurus?.benzersizIp ?? 0,
    ornekIpler: vurus?.ornekIpler ?? [],
    ulkeler: vurus?.ulkeler ?? [],
    toplamOlay: sonuc.toplamOlay,
  });
}
