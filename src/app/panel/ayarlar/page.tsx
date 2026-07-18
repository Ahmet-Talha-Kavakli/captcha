import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { AyarlarIstemci } from "./AyarlarIstemci";
import { AyarlarSekme } from "@/components/panel/AyarlarSekme";

export const metadata: Metadata = { title: "Ayarlar — Veylify" };

export default async function AyarlarPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();
  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.settings", dil) }]} baslik={ceviri("nav.settings", dil)} />
      <div className="mx-auto w-full max-w-4xl px-6 pt-6 pb-10 lg:px-10">
        <AyarlarSekme aktif="hesap" />
        <div className="mt-6">
          <AyarlarIstemci
            dil={dil}
            me={{
              name: user.name,
              email: user.email,
              avatarColor: user.avatarColor,
              workspaceName: user.workspaceName ?? "",
              locale: user.locale ?? "tr",
              timezone: user.timezone ?? "Europe/Istanbul",
              createdAt: user.createdAt,
              plan: user.plan,
              notificationPrefs: user.notificationPrefs ?? {},
            }}
          />
        </div>
      </div>
    </>
  );
}
