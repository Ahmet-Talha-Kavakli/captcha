/**
 * Landing i18n — sunucu tarafı dil çözümü.
 *
 * Middleware ziyaretçinin dilini (IP/coğrafya + Accept-Language) `veylify_dil`
 * cookie'sine yazar. Server Component'ler bu cookie'yi okuyup landing'i doğru
 * dilde render eder. Cookie yoksa (middleware henüz çalışmadıysa) Accept-Language
 * header'ından da bir tahmin yapılır; o da yoksa varsayılan (tr).
 */
import { cookies, headers } from "next/headers";
import {
  LANDING_DIL_COOKIE,
  LANDING_DILLER,
  LANDING_VARSAYILAN,
  landingDileCevir,
  type LandingDil,
} from "./landing";

/** Accept-Language header'ından ilk desteklenen dili çöz (cookie yoksa yedek). */
function headerDili(al: string | null): LandingDil | null {
  if (!al) return null;
  const parcalar = al
    .split(",")
    .map((p) => p.trim().split(";")[0].slice(0, 2).toLowerCase());
  for (const kod of parcalar) {
    if ((LANDING_DILLER as string[]).includes(kod)) return kod as LandingDil;
  }
  return null;
}

/** Mevcut istek için etkin landing dilini çöz (Server Component'te çağrılır). */
export async function landingDil(): Promise<LandingDil> {
  const store = await cookies();
  const c = store.get(LANDING_DIL_COOKIE)?.value;
  if (c) return landingDileCevir(c);
  // Cookie henüz yoksa header'dan tahmin et (ilk render).
  const h = await headers();
  return headerDili(h.get("accept-language")) ?? LANDING_VARSAYILAN;
}
