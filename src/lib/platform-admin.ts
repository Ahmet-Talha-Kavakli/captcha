import "server-only";
import type { User } from "@/lib/db/schema";

/**
 * PLATFORM ADMIN (staff) KAPISI
 * =============================
 * `/panel/admin` tüm kullanıcıların e-posta/plan/MRR verisini gösteren küresel
 * bir operasyon panosudur — YALNIZCA platform sahibi/staff görebilmeli. Daha
 * önce hiçbir kapı yoktu: oturum açan HERHANGİ bir kullanıcı bu veriyi görebiliyordu
 * (ciddi veri sızması). Bu modül tek yetki-kaynağıdır.
 *
 * Admin belirleme (öncelik sırasıyla):
 *   1) VEYLIFY_ADMIN_EMAILS env — virgülle ayrılmış e-posta allowlist'i (canlı).
 *   2) Kullanıcının `platformAdmin === true` bayrağı (DB'de işaretlenmiş staff).
 *
 * env boşsa güvenli bir varsayılan allowlist kullanılır (kurucu + demo hesabı),
 * böylece yerel/vitrin ortamı kilitlenmez ama yabancı kullanıcı giremez.
 */

const VARSAYILAN_ADMINLER = ["ahmettalhakavakli32@gmail.com", "demo@specter.dev"];

/** env'den (veya varsayılandan) normalize edilmiş admin e-posta kümesi. */
function adminEpostalar(): Set<string> {
  const ham = process.env.VEYLIFY_ADMIN_EMAILS?.trim();
  const liste = ham ? ham.split(",") : VARSAYILAN_ADMINLER;
  return new Set(liste.map((e) => e.trim().toLowerCase()).filter(Boolean));
}

/** Verilen kullanıcı platform admini (staff) mi? */
export function platformAdminMi(user: User | null | undefined): boolean {
  if (!user) return false;
  if ((user as User & { platformAdmin?: boolean }).platformAdmin === true) return true;
  return adminEpostalar().has(user.email.trim().toLowerCase());
}
