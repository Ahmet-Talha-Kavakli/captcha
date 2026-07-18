/**
 * Specter — Rol-Bazlı Erişim Kontrolü (RBAC) uygulaması
 * ======================================================
 * roller.ts izin matrisini panele GERÇEKTEN uygular: sidebar filtreleme +
 * sayfa guard. Kullanıcının efektif rolü, gerçek rolü VEYA (demo/deneme için)
 * `specter_rol_onizleme` cookie'sindeki rol önizlemesidir — böylece sahip,
 * analist/izleyici gibi rolleri deneyimleyip erişimin nasıl kısıtlandığını
 * görebilir. Önizleme YALNIZCA erişimi DARALTIR (yetki yükseltmez).
 */
import type { Role, TeamCapability } from "@/lib/db/schema";
import { efektifIzinler } from "@/app/panel/ekip/roller";

/** Bu rolün belirli bir yeteneğe sahip olup olmadığı. (Client-safe, saf fonksiyon.) */
export function yetkiliMi(rol: Role, yetenek?: TeamCapability): boolean {
  if (!yetenek) return true; // yetenek gerektirmeyen modül (görüntüleme)
  return efektifIzinler(rol).has(yetenek);
}
