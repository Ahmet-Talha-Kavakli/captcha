import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { ZorlukLabIstemci } from "./ZorlukLabIstemci";
import { labCeviri } from "./zorluk-lab.i18n";

export const metadata: Metadata = { title: "Zorluk Laboratuvarı — Veylify" };

/**
 * Ghost-Font Zorluk Laboratuvarı (sunucu kabuğu).
 * currentUser guard'ı + istemci canlı-canvas bileşenini render eder.
 */
export default async function ZorlukLabPage() {
  const user = await currentUser();
  if (!user) return null;

  const dil = await panelDil();

  return (
    <>
      <PanelUst
        kirintilar={[{ ad: ceviri("nav.difflab", dil) }]}
        baslik={labCeviri("x.ustBaslik", dil)}
      />
      <ZorlukLabIstemci dil={dil} />
    </>
  );
}
