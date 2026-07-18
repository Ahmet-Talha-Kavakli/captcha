import "server-only";
import { cookies } from "next/headers";
import type { Role } from "@/lib/db/schema";

const ONIZLEME_COOKIE = "specter_rol_onizleme";
const GECERLI_ROLLER: Role[] = ["owner", "admin", "analyst", "viewer"];

/**
 * Kullanıcının efektif rolü (SERVER-ONLY — cookie okur). Rol önizleme
 * cookie'si varsa ve gerçek rolden DAHA KISITLI ise onu döndürür (yetki
 * yükseltme engellenir).
 */
export async function efektifRol(gercekRol: Role): Promise<Role> {
  const jar = await cookies();
  const onizleme = jar.get(ONIZLEME_COOKIE)?.value as Role | undefined;
  if (!onizleme || !GECERLI_ROLLER.includes(onizleme)) return gercekRol;
  const sira: Record<Role, number> = { viewer: 0, analyst: 1, admin: 2, owner: 3 };
  return sira[onizleme] < sira[gercekRol] ? onizleme : gercekRol;
}
