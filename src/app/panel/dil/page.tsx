import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { WIDGET_DILLER, WIDGET_ANAHTARLAR } from "@/lib/widget-i18n";
import { DilIstemci } from "./DilIstemci";

export const metadata: Metadata = { title: "Dil & Yerelleştirme — Veylify" };

export default async function DilPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  return (
    <>
      <PanelUst
        kirintilar={[{ ad: ceviri("nav.localization", dil) }]}
        baslik={ceviri("nav.localization", dil)}
      />
      <DilIstemci diller={WIDGET_DILLER} anahtarlar={[...WIDGET_ANAHTARLAR]} dil={dil} />
    </>
  );
}
