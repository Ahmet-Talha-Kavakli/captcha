import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { efektifRol } from "@/lib/rbac-server";
import { Sidebar } from "@/components/panel/Sidebar";
import { RolGuard } from "@/components/panel/RolGuard";
import { KomutPaleti } from "@/components/panel/KomutPaleti";
import { KisayolYardim } from "@/components/panel/KisayolYardim";
import { UrunTuru } from "@/components/panel/UrunTuru";
import { ToastSaglayici } from "@/components/panel/kit";
import { panelDil } from "@/lib/i18n/sunucu";
import { Sites, Users } from "@/lib/db/db";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/login");

  // RBAC: efektif rolü hesapla (gerçek rol veya daraltılmış önizleme).
  const rol = await efektifRol(user.role);
  // i18n: etkin panel dilini çöz (kullanıcı tercihi > cookie > "tr").
  const dil = await panelDil();
  // Komut paletinin "Site anahtarımı kopyala" eylemi için ilk site anahtarı.
  const ilkSiteKey = Sites.forOwner(user.id)[0]?.siteKey;

  return (
    <ToastSaglayici>
      <a
        href="#icerik"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[300] focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        İçeriğe geç
      </a>
      {/* Masaüstünde viewport-kilit: sidebar TAM sabit kalır, yalnızca içerik
          alanı (main) kendi içinde dikey kayar. Mobilde normal sayfa akışı. */}
      <div className="flex bg-canvas lg:h-screen lg:overflow-hidden">
        <Sidebar me={{ name: user.name, email: user.email, avatarColor: user.avatarColor, rol, gercekRol: user.role, krediBakiye: Users.krediBakiye(user.id) }} dil={dil} />
        <main id="icerik" className="flex min-w-0 flex-1 flex-col overflow-x-clip lg:h-screen lg:overflow-y-auto">
          <RolGuard rol={rol}>{children}</RolGuard>
        </main>
        <KomutPaleti rol={rol} ilkSiteKey={ilkSiteKey} />
        <KisayolYardim />
        {/* İlk-açılış panel gezisi (spotlight ürün turu). Kendi localStorage
            mantığıyla bir kez gösterilir; komut paleti/ayarlardan da tetiklenir. */}
        <UrunTuru />
      </div>
    </ToastSaglayici>
  );
}
