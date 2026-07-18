import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { MobilSdkIstemci } from "./MobilSdkIstemci";

export const metadata: Metadata = { title: "Mobil & SDK — Veylify" };

export default async function MobilSdkPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();
  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.mobilesdk", dil) }]} baslik={ceviri("nav.mobilesdk", dil)} />
      <MobilSdkIstemci dil={dil} />
    </>
  );
}
