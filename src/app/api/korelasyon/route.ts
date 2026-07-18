/**
 * Specter — Olay Korelasyonu SIEM İhraç API'si
 * ============================================
 * Sahibin son olaylarından türetilen korelasyonları (saldırı zincirlerini)
 * JSON olarak döner. Splunk / Elastic / Sentinel gibi SIEM sistemlerine
 * ingest edilmek üzere makine-okur formatta. Panel görünümüyle AYNI motoru
 * (korelasyonBul) kullanır — yani ihraç edilen veri panelle birebir tutarlı.
 *
 *   GET /api/korelasyon                → tüm korelasyonlar + özet
 *   GET /api/korelasyon?siddet=kritik  → yalnızca verilen şiddet
 *   GET /api/korelasyon?format=ndjson  → SIEM ingest için satır-JSON (NDJSON)
 */
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { korelasyonBul, korelasyonOzet, type KorelasyonOlay, type KorelasyonSiddet } from "@/lib/specter/correlation";

const SIDDETLER: KorelasyonSiddet[] = ["kritik", "yuksek", "orta", "dusuk"];

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const siddetParam = url.searchParams.get("siddet");
  const format = url.searchParams.get("format");

  const olaylar = Events.forOwner(user.id, 3000).map((e): KorelasyonOlay => ({
    id: e.id, ts: e.ts, ip: e.ip, country: e.country, asn: e.asn,
    ua: e.ua, path: e.path, botClass: e.botClass, verdict: e.verdict, score: e.score,
  }));

  let korelasyonlar = korelasyonBul(olaylar);
  if (siddetParam && SIDDETLER.includes(siddetParam as KorelasyonSiddet)) {
    korelasyonlar = korelasyonlar.filter((k) => k.siddet === siddetParam);
  }

  // NDJSON — her korelasyon tek satır (SIEM ingest dostu).
  if (format === "ndjson") {
    const govde = korelasyonlar.map((k) => JSON.stringify(k)).join("\n");
    return new Response(govde, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Content-Disposition": `attachment; filename="specter-korelasyon-${new Date().toISOString().slice(0, 10)}.ndjson"`,
      },
    });
  }

  return NextResponse.json({
    uretildi: new Date().toISOString(),
    ozet: korelasyonOzet(korelasyonlar),
    korelasyonlar,
  });
}
