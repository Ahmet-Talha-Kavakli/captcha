/**
 * Specter panel i18n — sunucu tarafı dil çözümü.
 *
 * Öncelik sırası:
 *   1. Giriş yapmış kullanıcının tercihi (User.locale)
 *   2. `specter_panel_dil` cookie'si (giriş öncesi / anlık değişim)
 *   3. Varsayılan ("tr")
 *
 * Server Component'lerde çağrılır; sonucu client bileşenlere prop olarak geçirin.
 */
import { cookies } from "next/headers";
import { currentUser } from "@/lib/auth";
import { dileCevir, type Dil } from "./panel";

/** Panel için cookie adı — dil değiştirici bunu ayarlar. */
export const PANEL_DIL_COOKIE = "specter_panel_dil";

/** Mevcut istek için etkin panel dilini çöz. */
export async function panelDil(): Promise<Dil> {
  const user = await currentUser();
  if (user?.locale) return dileCevir(user.locale);
  const store = await cookies();
  const c = store.get(PANEL_DIL_COOKIE)?.value;
  return dileCevir(c);
}
