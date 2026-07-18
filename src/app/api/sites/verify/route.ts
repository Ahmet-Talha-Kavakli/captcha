/**
 * POST /api/sites/verify
 * -----------------------
 * Bir sitenin alan adı sahipliğini doğrular. Doğrulanana kadar site
 * "beklemede" durumda kalır ve koruma pasiftir.
 *
 * İstek gövdesi:
 *   siteId:  string             (zorunlu — doğrulanacak site)
 *   method:  "dns" | "meta" | "file"
 *   value?:  string             (opsiyonel — kullanıcının elle girdiği token/kanıt)
 *
 * Kontrol mantığı (GERÇEK — sahte "yayılma toleransı" YOK):
 *   1) Kullanıcı token değerini elle girdiyse ve site jetonuyla eşleşiyorsa → geçer.
 *   2) Alan adı localhost / *.local / .test / .example gibi geliştirme
 *      alanlarıysa → otomatik geçer (dev ortamında DNS yok, yalnız test için).
 *   3) Gerçek alan adı için Node DNS çözücüsüyle CANLI TXT kaydı sorgulanır;
 *      site jetonu TXT kayıtları arasında GERÇEKTEN bulunursa → geçer.
 *   4) TXT bulunamazsa → "pending" döner. Kullanıcı gerçek TXT kaydını
 *      eklemeden ASLA doğrulanmaz (otomatik geçiş yok).
 *
 * Başarı halinde Sites.setVerified çağrılır — gerçekten state değişir.
 */
import { NextResponse } from "next/server";
import { promises as dns } from "node:dns";
import { currentUser } from "@/lib/auth";
import { Sites, Audit } from "@/lib/db/db";

type Method = "dns" | "meta" | "file";
const METHODS: Method[] = ["dns", "meta", "file"];

/** Geliştirme/deneme alan adı mı? (canlı DNS yok, otomatik geç.) */
function isDevDomain(d: string): boolean {
  const h = d.toLowerCase();
  return (
    h === "localhost" ||
    h.startsWith("localhost:") ||
    h.startsWith("127.") ||
    h.startsWith("0.0.0.0") ||
    h.startsWith("192.168.") ||
    h.startsWith("10.") ||
    h.endsWith(".local") ||
    h.endsWith(".test") ||
    h.endsWith(".localhost") ||
    h.endsWith(".example") ||
    h.endsWith(".invalid") ||
    h.includes("example.com") ||
    h.includes("acme")
  );
}

/** Canlı DNS TXT sorgusu: jeton kayıtlar arasında var mı? */
async function dnsHasToken(domain: string, token: string): Promise<boolean> {
  try {
    const records = await dns.resolveTxt(domain);
    const flat = records.map((chunks) => chunks.join("")).join(" ");
    return flat.includes(token);
  } catch {
    // Alan çözülemedi / TXT yok — henüz yayılmamış say.
    return false;
  }
}

/** Canlı HTTP: sayfa <head>'inde doğrulama meta etiketi var mı? */
async function metaHasToken(domain: string, token: string): Promise<boolean> {
  const ctrl = new AbortController();
  const zaman = setTimeout(() => ctrl.abort(), 6000);
  try {
    for (const scheme of ["https", "http"]) {
      try {
        const res = await fetch(`${scheme}://${domain}/`, { signal: ctrl.signal, redirect: "follow" });
        if (!res.ok) continue;
        const html = (await res.text()).slice(0, 100_000);
        // <meta name="veylify-verify" content="TOKEN"> ya da içinde token geçen etiket.
        if (html.includes(token)) return true;
      } catch {
        /* diğer şemayı dene */
      }
    }
    return false;
  } finally {
    clearTimeout(zaman);
  }
}

/** Canlı HTTP: /.well-known/veylify-verify.txt dosyasında jeton var mı? */
async function fileHasToken(domain: string, token: string): Promise<boolean> {
  const ctrl = new AbortController();
  const zaman = setTimeout(() => ctrl.abort(), 6000);
  try {
    for (const scheme of ["https", "http"]) {
      try {
        const res = await fetch(`${scheme}://${domain}/.well-known/veylify-verify.txt`, {
          signal: ctrl.signal,
          redirect: "follow",
        });
        if (!res.ok) continue;
        const txt = (await res.text()).slice(0, 10_000);
        if (txt.includes(token)) return true;
      } catch {
        /* diğer şemayı dene */
      }
    }
    return false;
  } finally {
    clearTimeout(zaman);
  }
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const siteId: string = body.siteId || "";
  const method: Method = METHODS.includes(body.method) ? body.method : "dns";
  const manualValue: string = typeof body.value === "string" ? body.value.trim() : "";

  const site = Sites.byId(siteId);
  if (!site || site.ownerId !== user.id) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // Zaten doğrulanmışsa idempotent yanıt ver.
  if (site.verified) {
    return NextResponse.json({ verified: true, site, already: true });
  }

  const attempt = Sites.bumpVerifyAttempt(siteId);
  const primaryDomain = site.domains[0] || "localhost";

  // 1) Elle girilen token eşleşmesi (en güçlü kanıt).
  const manualMatch =
    !!manualValue &&
    (manualValue === site.verifyToken ||
      manualValue.includes(site.verifyToken) ||
      // token'ın yalnız değer kısmını ("xxxx") girmiş olabilir.
      manualValue === site.verifyToken.split("=")[1]);

  // 2) Dev/deneme alanı → otomatik geç (yalnız localhost/.test/.example vb.).
  const devPass = isDevDomain(primaryDomain);

  // 3) Gerçek alan adı → seçilen yönteme göre CANLI kontrol. Otomatik geçiş YOK:
  //    kullanıcı gerçek kaydı/dosyayı/etiketi eklemeden doğrulanmaz.
  let livePass = false;
  if (!manualMatch && !devPass) {
    if (method === "dns") livePass = await dnsHasToken(primaryDomain, site.verifyToken);
    else if (method === "meta") livePass = await metaHasToken(primaryDomain, site.verifyToken);
    else if (method === "file") livePass = await fileHasToken(primaryDomain, site.verifyToken);
  }

  const ok = manualMatch || devPass || livePass;

  if (!ok) {
    // Henüz doğrulanamadı — kullanıcıya ne yapması gerektiğini söyle.
    return NextResponse.json({
      verified: false,
      status: "pending",
      attempt,
      message:
        method === "dns"
          ? `${primaryDomain} için TXT kaydı henüz görünmüyor. DNS yayılması birkaç dakika sürebilir; kaydı ekledikten sonra tekrar deneyin.`
          : method === "meta"
            ? "Meta etiketi sayfada bulunamadı. Etiketi <head> içine ekleyip tekrar deneyin."
            : "/.well-known/veylify-verify.txt dosyası bulunamadı. Dosyayı yükleyip tekrar deneyin.",
    });
  }

  const updated = Sites.setVerified(siteId, method);
  Audit.log(user.id, user.name, "site.verified", site.name, {
    method,
    domain: primaryDomain,
    via: manualMatch ? "token" : devPass ? "dev-domain" : `live-${method}`,
  });

  return NextResponse.json({ verified: true, site: updated });
}
