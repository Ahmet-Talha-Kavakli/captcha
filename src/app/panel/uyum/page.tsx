import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { CERCEVELER, hazirlikSkoru } from "./cerceve";
import { UyumIstemci } from "./UyumIstemci";

export const metadata: Metadata = { title: "Uyum & Sertifika — Veylify" };

export default async function UyumPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  const cerceveler = CERCEVELER.map((c) => ({
    key: c.key, ad: c.ad, tamAd: c.tamAd, aciklama: c.aciklama, renk: c.renk, ikon: c.ikon,
    kontroller: c.kontroller,
    ...hazirlikSkoru(c),
  }));

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.compliance", dil) }]} baslik={ceviri("nav.compliance", dil)} />
      <UyumIstemci dil={dil} cerceveler={cerceveler} />
    </>
  );
}
