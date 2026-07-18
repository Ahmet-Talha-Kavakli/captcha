/**
 * Specter — Denetim Günlüğü SIEM Dışa-Aktarım API'si
 * ===================================================
 * GET /api/denetim/export?format=ndjson|cef|json
 * Sahibin denetim günlüğünü seçilen biçimde İNDİRİLEBİLİR ek (attachment)
 * olarak döndürür. currentUser ile korunur (401). Kayıtlar Audit.forOwner
 * ile en fazla 5000 satır çekilir.
 */

import { currentUser } from "@/lib/auth";
import { Audit } from "@/lib/db/db";
import { ndjsonUret, cefUret, jsonUret } from "@/lib/specter/audit-export";

type Bicim = "ndjson" | "cef" | "json";

/** Biçim → içerik türü + dosya uzantısı eşlemesi. */
const BICIM_META: Record<Bicim, { contentType: string; uzanti: string }> = {
  // NDJSON için yaygın MIME: application/x-ndjson (Splunk/Elastic).
  ndjson: { contentType: "application/x-ndjson; charset=utf-8", uzanti: "ndjson" },
  // CEF düz metindir (ArcSight/QRadar syslog gövdesi).
  cef: { contentType: "text/plain; charset=utf-8", uzanti: "cef" },
  json: { contentType: "application/json; charset=utf-8", uzanti: "json" },
};

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  // Biçim doğrula (varsayılan ndjson).
  const url = new URL(req.url);
  const istenen = (url.searchParams.get("format") ?? "ndjson").toLowerCase();
  const bicim: Bicim =
    istenen === "cef" || istenen === "json" || istenen === "ndjson" ? (istenen as Bicim) : "ndjson";

  const kayitlar = Audit.forOwner(user.id, 5000);

  let govde: string;
  if (bicim === "cef") govde = cefUret(kayitlar);
  else if (bicim === "json") govde = jsonUret(kayitlar);
  else govde = ndjsonUret(kayitlar);

  const meta = BICIM_META[bicim];
  // Dosya adında tarih: kayıtların en yeni ts'inden türetilir (SAF/deterministik;
  // sistem saatine değil veriye bağlı). Kayıt yoksa "bos".
  const enYeniTs = kayitlar.reduce<number | null>((m, k) => (m === null || k.ts > m ? k.ts : m), null);
  const tarihEtiket = enYeniTs !== null ? new Date(enYeniTs).toISOString().slice(0, 10) : "bos";
  const dosyaAdi = `specter-denetim-${tarihEtiket}.${meta.uzanti}`;

  return new Response(govde, {
    status: 200,
    headers: {
      "content-type": meta.contentType,
      "content-disposition": `attachment; filename="${dosyaAdi}"`,
      // SIEM/uyum: aracı önbelleklerinin denetim çıktısını saklamasını engelle.
      "cache-control": "no-store",
    },
  });
}
