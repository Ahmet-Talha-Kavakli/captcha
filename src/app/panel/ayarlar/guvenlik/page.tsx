import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { PanelUst } from "@/components/panel/PanelUst";
import { AyarlarSekme } from "@/components/panel/AyarlarSekme";
import { GuvenlikIstemci } from "./GuvenlikIstemci";

export const metadata: Metadata = { title: "Güvenlik — Veylify" };

export default async function GuvenlikPage() {
  const user = await currentUser();
  if (!user) return null;
  return (
    <>
      <PanelUst kirintilar={[{ ad: "Ayarlar", href: "/panel/ayarlar" }, { ad: "Güvenlik" }]} baslik="Ayarlar" />
      <div className="mx-auto w-full max-w-4xl px-6 pt-6 pb-10 lg:px-10">
        <AyarlarSekme aktif="guvenlik" />
        <div className="mt-6">
          <GuvenlikIstemci
            email={user.email}
            twoFactorEnabled={user.twoFactorEnabled ?? false}
            passwordChangedAt={user.passwordChangedAt ?? null}
          />
        </div>
      </div>
    </>
  );
}
