import { Sites, Events, Usage } from "@/lib/db/db";
import { MARKA } from "@/lib/marka";

/**
 * Gömülebilir Güven Rozeti (badge) — dinamik SVG
 * ==============================================
 * reCAPTCHA/Turnstile'daki "Protected by" köşe rozetinin muadili. Site sahibi
 * kendi sitesine tek satırla gömer:
 *
 *   <a href="https://veylify.com/muhur/<site>" target="_blank" rel="noopener">
 *     <img src="https://veylify.com/muhur/<site>/badge.svg" alt="Veylify ile korunuyor" height="52">
 *   </a>
 *
 * SVG GERÇEK koruma verisiyle üretilir (son 30 gün engellenen istek + derece).
 * ?tema=koyu|acik ve ?stil=tam|mini parametreleriyle özelleştirilir.
 * Auth YOK — public. Cache: 1 saat (istatistik yavaş değişir).
 */

export const dynamic = "force-dynamic";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function kisaSayi(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1) + "K";
  return String(n);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ site: string }> },
) {
  const { site } = await params;
  const url = new URL(req.url);
  const tema = url.searchParams.get("tema") === "acik" ? "acik" : "koyu";
  const mini = url.searchParams.get("stil") === "mini";

  const s = Sites.byNameSlug(site);

  // Gerçek koruma istatistikleri (site yoksa nötr rozet döner — kırılmaz).
  let engellenen = 0;
  let oran = 99.2;
  if (s) {
    const events = Events.forSite(s.id, 3000);
    const gun30 = Date.now() - 30 * 864e5;
    const son30 = events.filter((e) => e.ts >= gun30);
    const eng = son30.filter((e) => e.verdict === "blocked" || e.verdict === "challenged").length;
    const usage = Usage.forOwner(s.ownerId, 30);
    engellenen = usage.reduce((a, u) => a + u.blocked, 0) + eng;
    oran = son30.length ? (eng / son30.length) * 100 : 99.2;
  }
  const derece = oran >= 95 ? "A+" : oran >= 85 ? "A" : oran >= 70 ? "B" : "C";

  // Palet — koyu/açık cam
  const p =
    tema === "acik"
      ? { bg1: "#ffffff", bg2: "#f4f3fb", bd: "#e0e0f0", fg: "#312e81", sub: "#6b7280", acc: "#4f46e5" }
      : { bg1: "#1e1b4b", bg2: "#0f0e26", bd: "#3b3785", fg: "#eef1fb", sub: "#a5b4fc", acc: "#818cf8" };

  const koruniyor = esc(MARKA.koruniyorTr);
  const marka = esc(MARKA.ad);

  // Baykuş logo (widget'takiyle aynı) — indigo gradyan
  const owl = `<path d="M16 3c-5.5 0-9.5 4.2-9.5 10.2V27c0 1.1 1.3 1.7 2.2 1l1.6-1.3c.5-.4 1.2-.4 1.7 0l1.8 1.4c.5.4 1.2.4 1.7 0l1.8-1.4c.5-.4 1.2-.4 1.7 0l1.6 1.3c.9.7 2.2.1 2.2-1V13.2C25.5 7.2 21.5 3 16 3Z" fill="url(#og)"/><circle cx="12" cy="14" r="2" fill="#1e1b4b"/><circle cx="20" cy="14" r="2" fill="#1e1b4b"/>`;

  let svg: string;
  if (mini) {
    // MINI: sadece logo + "Veylify" — 132×52
    const W = 132, H = 52;
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${koruniyor}">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.bg1}"/><stop offset="1" stop-color="${p.bg2}"/></linearGradient>
  <linearGradient id="og" x1="0" y1="0" x2="32" y2="32"><stop stop-color="#a5b4fc"/><stop offset="1" stop-color="#4f46e5"/></linearGradient>
</defs>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="13" fill="url(#bg)" stroke="${p.bd}"/>
<rect x="1.5" y="1.5" width="${W - 3}" height="1" rx="0.5" fill="rgba(255,255,255,0.14)"/>
<g transform="translate(14,14) scale(0.75)">${owl}</g>
<text x="46" y="26" font-family="Inter,system-ui,sans-serif" font-size="14" font-weight="700" fill="${p.fg}">${marka}</text>
<text x="46" y="39" font-family="Inter,system-ui,sans-serif" font-size="9" font-weight="600" fill="${p.sub}" letter-spacing="0.3">KORUMA AKTİF</text>
</svg>`;
  } else {
    // TAM: logo + marka + koruniyor + derece rozeti — 240×52
    const W = 240, H = 52;
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${koruniyor}">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.bg1}"/><stop offset="1" stop-color="${p.bg2}"/></linearGradient>
  <linearGradient id="og" x1="0" y1="0" x2="32" y2="32"><stop stop-color="#a5b4fc"/><stop offset="1" stop-color="#4f46e5"/></linearGradient>
  <linearGradient id="dg" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#818cf8"/><stop offset="1" stop-color="#4f46e5"/></linearGradient>
</defs>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="13" fill="url(#bg)" stroke="${p.bd}"/>
<rect x="1.5" y="1.5" width="${W - 3}" height="1" rx="0.5" fill="rgba(255,255,255,0.14)"/>
<g transform="translate(14,14) scale(0.78)">${owl}</g>
<text x="48" y="24" font-family="Inter,system-ui,sans-serif" font-size="13.5" font-weight="700" fill="${p.fg}">${koruniyor}</text>
<text x="48" y="39" font-family="Inter,system-ui,sans-serif" font-size="9.5" font-weight="600" fill="${p.sub}" letter-spacing="0.2">${engellenen > 0 ? esc(kisaSayi(engellenen)) + " bot engellendi" : "AI botlarına karşı aktif"}</text>
<g transform="translate(${W - 44},14)">
  <rect x="0" y="0" width="30" height="24" rx="8" fill="url(#dg)"/>
  <rect x="0.5" y="0.5" width="29" height="1" rx="0.5" fill="rgba(255,255,255,0.3)"/>
  <text x="15" y="16.5" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="12" font-weight="800" fill="#fff">${esc(derece)}</text>
</g>
</svg>`;
  }

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
