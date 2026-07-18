"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";
import { navYetenek } from "@/lib/panel-nav";
import { yetkiliMi } from "@/lib/rbac";
import { ROL_ETIKET } from "@/app/panel/ekip/roller";
import type { Role } from "@/lib/db/schema";

/**
 * Sayfa-seviyesi RBAC guard: mevcut yol için gereken yeteneğe efektif rol
 * sahip değilse içeriği engelleyip erişim-reddi gösterir. Sidebar filtreleme
 * ile birlikte tam kapsama sağlar (doğrudan URL erişimini de kapatır).
 */
export function RolGuard({ rol, children }: { rol: Role; children: React.ReactNode }) {
  const pathname = usePathname();
  const gereken = navYetenek(pathname);

  if (gereken && !yetkiliMi(rol, gereken)) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-lg flex-col items-center justify-center px-6 text-center">
        <span className="mb-5 grid size-16 place-items-center rounded-2xl bg-danger-soft text-danger2">
          <Lock className="size-8" />
        </span>
        <h1 className="text-[22px] font-bold text-slate-ink">Bu modüle erişimin yok</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-slate-muted">
          Bu sayfa <b>{ROL_ETIKET[rol]}</b> rolünün yetkisi dışında. Erişim için
          hesap yöneticinden rolünün yükseltilmesini iste.
        </p>
        <Link
          href="/panel"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-800"
        >
          Genel Bakış'a dön
        </Link>
      </div>
    );
  }
  return <>{children}</>;
}
