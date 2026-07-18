/**
 * Specter — Kırmızı Takım Simülasyon API'si
 * =========================================
 * Kullanıcının GERÇEK kurallarına karşı saldırı senaryolarını çalıştırır.
 *   POST /api/kirmizi-takim  { istekSayisi? }
 */
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Rules } from "@/lib/db/db";
import { kirmiziTakimCalistir } from "@/lib/specter/kirmizi-takim";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const istekSayisi = Math.min(100, Math.max(10, Number(body.istekSayisi) || 40));

  const rules = Rules.forOwner(user.id);
  const sonuc = kirmiziTakimCalistir(rules, istekSayisi);

  return NextResponse.json({
    ozet: sonuc.ozet,
    kuralSayisi: rules.filter((r) => r.enabled).length,
    sonuclar: sonuc.sonuclar.map((s) => ({
      id: s.senaryo.id, ad: s.senaryo.ad, aciklama: s.senaryo.aciklama,
      kategori: s.senaryo.kategori, siddet: s.senaryo.siddet, beklenen: s.senaryo.beklenen,
      toplam: s.toplam, engellenen: s.engellenen, dogrulanan: s.dogrulanan, kacan: s.kacan,
      etkinlik: s.etkinlik, durum: s.durum, yakalayanKurallar: s.yakalayanKurallar,
    })),
  });
}
