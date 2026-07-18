import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { DavranisBiyometriIstemci } from "./DavranisBiyometriIstemci";
import { biyometriCeviri } from "./davranis-biyometri.i18n";

export const metadata: Metadata = { title: "Davranışsal Biyometri — Veylify" };

export default async function DavranisBiyometriPage() {
  const user = await currentUser();
  if (!user) return null;

  const dil = await panelDil();

  return (
    <>
      <PanelUst kirintilar={[{ ad: biyometriCeviri("x.kirinti", dil) }]} baslik={biyometriCeviri("x.baslik", dil)} />
      <DavranisBiyometriIstemci dil={dil} />
    </>
  );
}
