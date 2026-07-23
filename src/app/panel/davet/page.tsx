import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { PanelUst } from "@/components/panel/PanelUst";
import { referralIstatistik } from "@/lib/specter/referral";
import { DavetIstemci } from "./DavetIstemci";

export const metadata: Metadata = { title: "Davet Et & Kazan — Veylify" };

/**
 * Davet Et & Kazan — referral sayfası.
 * Kullanıcının davet kodu/linki + istatistikleri + davet maili gönderme.
 */
export default async function DavetPage() {
  const user = await currentUser();
  if (!user) return null;
  const stat = referralIstatistik(user);

  return (
    <>
      <PanelUst kirintilar={[{ ad: "Davet Et & Kazan" }]} baslik="Davet Et & Kazan" />
      <DavetIstemci stat={stat} />
    </>
  );
}
