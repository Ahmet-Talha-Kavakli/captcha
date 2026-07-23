import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { pumpLiveEvents } from "@/lib/db/live";

/**
 * GET /api/live/stream — Server-Sent Events (SSE) canlı trafik push akışı.
 *
 * Gerçek-zaman deneyimi: polling yerine tek bir uzun-yaşayan bağlantı üzerinden
 * sunucu her ~2sn'de yeni olayları `data: {json}\n\n` biçiminde iter.
 * Keep-alive için `: ping\n\n` yorumu gönderilir (proxy/tarayıcı bağlantısını
 * canlı tutar). İstemci kapanınca (abort) interval temizlenir, stream durur.
 *
 * DB erişimi gerektiği için Node runtime; her istekte taze veri için dynamic.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PUSH_ARALIK = 2000; // ms — yeni olay itme sıklığı
const PING_ARALIK = 15000; // ms — keep-alive yorumu sıklığı

export async function GET(req: Request) {
  // EGRESS: uzun-yaşayan akış; blob'u her tick'te değil yalnız bağlantı
  // açılışında (TTL'li) okumak yeter — kim olduğumuzu cookie söyler.
  const user = await currentUser({ taze: false });
  if (!user) {
    return new Response("unauthorized", { status: 401 });
  }
  const ownerId = user.id;

  const encoder = new TextEncoder();
  let since = Date.now();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let kapali = false;

      const gonder = (chunk: string) => {
        if (kapali) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          // controller kapanmış olabilir → temizle
          kapat();
        }
      };

      // Açılış: istemciye bağlantının kurulduğunu bildir (olaysız da olsa canlı).
      gonder(`event: ready\ndata: ${JSON.stringify({ now: Date.now() })}\n\n`);

      // Her ~2sn: yeni olay üret + `since`'den yeni olanları it.
      const tick = () => {
        if (kapali) return;
        try {
          pumpLiveEvents(ownerId);
          const all = Events.forOwner(ownerId, 100);
          const yeni = all.filter((e) => e.ts > since).sort((a, b) => a.ts - b.ts);
          const now = Date.now();
          since = now;
          if (yeni.length) {
            const payload = {
              now,
              events: yeni.map((e) => ({
                id: e.id, ts: e.ts, ip: e.ip, country: e.country, asn: e.asn, ua: e.ua,
                path: e.path, method: e.method, botClass: e.botClass, verdict: e.verdict,
                score: e.score, triggeredRules: e.triggeredRules, fingerprint: e.fingerprint,
                latency: e.latency, siteId: e.siteId,
              })),
            };
            gonder(`data: ${JSON.stringify(payload)}\n\n`);
          }
        } catch {
          /* sessiz — bir sonraki tick'te tekrar dener */
        }
      };

      // Keep-alive yorumu (veri değil, sadece bağlantıyı açık tutar).
      const ping = () => gonder(`: ping\n\n`);

      const tickTimer = setInterval(tick, PUSH_ARALIK);
      const pingTimer = setInterval(ping, PING_ARALIK);

      function kapat() {
        if (kapali) return;
        kapali = true;
        clearInterval(tickTimer);
        clearInterval(pingTimer);
        try {
          controller.close();
        } catch {
          /* zaten kapalı */
        }
      }

      // İstemci bağlantıyı keserse (sekme kapandı / navigasyon) temizle.
      req.signal.addEventListener("abort", kapat);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // nginx/proxy tampon kapat → anlık push
    },
  });
}
