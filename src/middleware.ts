/**
 * Middleware — Landing için OTOMATİK DİL SEÇİMİ (IP/coğrafya + tarayıcı dili)
 * ==========================================================================
 * Ziyaretçi siteye ilk geldiğinde dilini otomatik belirleriz ve bir cookie'ye
 * yazarız (`veylify_dil`). Öncelik sırası:
 *
 *   1) Kullanıcı zaten dil seçmişse (cookie var)          → dokunma.
 *   2) IP coğrafyası (ülke) → dil                          → en güçlü sinyal.
 *      - Vercel/edge: request.geo.country
 *      - Self-host / proxy: x-vercel-ip-country / cf-ipcountry / x-country header
 *   3) Accept-Language tarayıcı dili                       → coğrafya yoksa.
 *   4) Varsayılan (tr).
 *
 * Cookie yazılır ama YÖNLENDİRME yapılmaz (URL temiz kalır). Sunucu bileşenleri
 * cookie'yi okuyup landing'i o dilde render eder. Yalnızca landing/pazarlama
 * rotalarında çalışır — panel kendi `specter_panel_dil` cookie'sini kullanır.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";

const DILLER = ["tr", "en", "de", "fr", "es"] as const;
type Dil = (typeof DILLER)[number];
const VARSAYILAN: Dil = "tr";
export const LANDING_DIL_COOKIE = "veylify_dil";

/** Ülke kodu (ISO-3166 alpha-2, büyük harf) → landing dili. */
const ULKE_DIL: Record<string, Dil> = {
  // Türkçe
  TR: "tr", CY: "tr",
  // Almanca
  DE: "de", AT: "de", CH: "de", LI: "de",
  // Fransızca
  FR: "fr", BE: "fr", LU: "fr", MC: "fr",
  // İspanyolca (İspanya + Latin Amerika)
  ES: "es", MX: "es", AR: "es", CO: "es", CL: "es", PE: "es", VE: "es",
  EC: "es", GT: "es", CU: "es", BO: "es", DO: "es", HN: "es", PY: "es",
  SV: "es", NI: "es", CR: "es", PA: "es", UY: "es", PR: "es",
  // İngilizce (varsayılan geniş kapsam)
  US: "en", GB: "en", CA: "en", AU: "en", NZ: "en", IE: "en", IN: "en",
  ZA: "en", SG: "en", PH: "en", NG: "en",
};

/** İstekten ülke kodunu çıkar (edge geo + yaygın proxy header'ları). */
function ulkeKodu(req: NextRequest): string | null {
  // Next.js edge geo (Vercel).
  const geo = (req as unknown as { geo?: { country?: string } }).geo;
  if (geo?.country) return geo.country.toUpperCase();
  // Yaygın CDN/proxy header'ları.
  const h = req.headers;
  const aday =
    h.get("x-vercel-ip-country") ||
    h.get("cf-ipcountry") ||
    h.get("x-country") ||
    h.get("x-geo-country");
  return aday ? aday.toUpperCase() : null;
}

/** Accept-Language header'ından ilk desteklenen dili çöz. */
function tarayiciDili(req: NextRequest): Dil | null {
  const al = req.headers.get("accept-language");
  if (!al) return null;
  // "de-DE,de;q=0.9,en;q=0.8" → ["de","en"] (q'ya göre sıralı gelir).
  const parcalar = al
    .split(",")
    .map((p) => p.trim().split(";")[0].slice(0, 2).toLowerCase());
  for (const kod of parcalar) {
    if ((DILLER as readonly string[]).includes(kod)) return kod as Dil;
  }
  return null;
}

/** Landing otomatik dil seçimi — cookie yazar, yönlendirmez. */
function dilMiddleware(req: NextRequest) {
  const res = NextResponse.next();

  // Kullanıcı zaten bir dil seçtiyse (geçerli cookie) dokunma.
  const mevcut = req.cookies.get(LANDING_DIL_COOKIE)?.value;
  if (mevcut && (DILLER as readonly string[]).includes(mevcut)) {
    return res;
  }

  // 1) Coğrafya → dil (en güçlü sinyal). 2) Tarayıcı dili. 3) Varsayılan.
  const ulke = ulkeKodu(req);
  const cografyaDili = ulke ? ULKE_DIL[ulke] : undefined;
  const dil: Dil = cografyaDili ?? tarayiciDili(req) ?? VARSAYILAN;

  // Cookie'yi yaz (1 yıl). Yönlendirme yok — URL temiz kalır, SSR cookie'yi okur.
  res.cookies.set(LANDING_DIL_COOKIE, dil, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}

/**
 * Clerk yalnızca açıkça etkinken (VEYLIFY_CLERK=1) devreye girer — bu durumda
 * `clerkMiddleware` OTURUM + OAuth (Google) callback'lerini işler VE içinde
 * dil middleware'imizi çağırır (ikisi birlikte). Clerk kapalıysa yalnız dil
 * middleware çalışır (kendi cookie-auth formumuz kullanılır). Bu ayrım kritik:
 * clerkMiddleware olmadan canlıda Clerk oturumları/Google girişi kırılır.
 */
const clerkAktif =
  process.env.VEYLIFY_CLERK === "1" &&
  /^pk_(test|live)_/.test(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ?? "");

export default clerkAktif
  ? clerkMiddleware((_auth, req) => dilMiddleware(req))
  : dilMiddleware;

/**
 * Matcher — Clerk'in ÖNERDİĞİ desen (statik dosya + Next dahilîleri hariç,
 * API + Clerk rotaları DAHİL). Clerk OAuth/oturum callback'lerinin
 * middleware'den geçmesi ŞART; eski dar matcher bunları hariç tuttuğu için
 * canlıda Google girişi kırılıyordu. Dil middleware'i kendi içinde cookie
 * kontrolüyle sınırlanır (panel/api'de zararsız çalışır — sadece cookie yazar).
 */
export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
