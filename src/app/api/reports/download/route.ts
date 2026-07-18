/**
 * GET /api/reports/download?type=<tür>&format=json|csv&days=<N>
 * ---------------------------------------------------------------
 * GERÇEK indirilebilir rapor üretir — hesabın GERÇEK Events/Usage/koruma
 * verisinden. Daha önce "rapor üret" yalnızca geçmişe kayıt tutuyordu
 * (sizeBytes istemciden geliyordu, gerçek dosya YOKTU → indirilemez süs kayıt).
 * Bu endpoint gerçek içerikli, attachment olarak inen bir rapor döndürür.
 *
 * currentUser guard: yalnızca token sahibinin verisi (izolasyon).
 */
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Events, Usage } from "@/lib/db/db";
import { korumaOzeti, panelSayilari } from "@/lib/ozet";

const TURLER = ["haftalik_ozet", "aylik_tehdit", "ai_ajan", "uyum_denetim", "trafik"];

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "haftalik_ozet";
  const format = url.searchParams.get("format") === "csv" ? "csv" : "json";
  const days = Math.max(1, Math.min(365, Number(url.searchParams.get("days")) || 30));
  if (!TURLER.includes(type)) {
    return NextResponse.json({ error: "geçersiz rapor türü" }, { status: 400 });
  }

  // GERÇEK veri — son N gün olayları + koruma özeti + kullanım.
  const simdi = Date.now();
  const events = Events.sonGunler(user.id, days, simdi);
  const ozet = korumaOzeti(user.id);
  const sayilar = panelSayilari(user.id);

  const engellenen = events.filter((e) => e.verdict === "blocked" || e.verdict === "challenged");
  // Ülke ve bot-sınıfı kırılımı (gerçek olaylardan).
  const ulkeSay = new Map<string, number>();
  const sinifSay = new Map<string, number>();
  for (const e of engellenen) {
    ulkeSay.set(e.country, (ulkeSay.get(e.country) || 0) + 1);
    sinifSay.set(e.botClass, (sinifSay.get(e.botClass) || 0) + 1);
  }
  const enUlkeler = [...ulkeSay.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  const enSiniflar = [...sinifSay.entries()].sort((a, b) => b[1] - a[1]);

  const tarih = new Date(simdi).toISOString().slice(0, 10);
  const dosyaAd = `veylify-${type}-${tarih}.${format}`;

  if (format === "csv") {
    // CSV: olay bazlı (Excel/Sheets uyumlu). Başlık + satırlar.
    const satirlar = [
      "tarih,ip,ulke,botClass,verdict,path,score",
      ...events.map((e) =>
        [new Date(e.ts).toISOString(), e.ip, e.country, e.botClass, e.verdict, (e.path || "").replace(/,/g, ""), e.score]
          .join(","),
      ),
    ];
    return new NextResponse(satirlar.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${dosyaAd}"`,
      },
    });
  }

  // JSON: özet + kırılımlar + olay örneği.
  const rapor = {
    rapor: type,
    olusturuldu: new Date(simdi).toISOString(),
    donemGun: days,
    ozet: {
      korumaSkoru: ozet.skor,
      blockRate: Number((ozet.blockRate * 100).toFixed(2)),
      toplamOlay: events.length,
      engellenen: engellenen.length,
      son24Bot: sayilar.son24Bot,
      son24Ai: sayilar.son24Ai,
      aktifKural: sayilar.aktifKural,
    },
    enUlkeler: enUlkeler.map(([ulke, sayi]) => ({ ulke, sayi })),
    botSiniflari: enSiniflar.map(([sinif, sayi]) => ({ sinif, sayi })),
    olayOrnegi: events.slice(0, 100).map((e) => ({
      ts: e.ts, ip: e.ip, ulke: e.country, botClass: e.botClass, verdict: e.verdict, path: e.path, score: e.score,
    })),
  };
  return new NextResponse(JSON.stringify(rapor, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${dosyaAd}"`,
    },
  });
}
