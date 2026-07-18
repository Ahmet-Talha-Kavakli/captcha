import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { killChainCikar, killChainOzet } from "@/lib/specter/kill-chain";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { KillChainIstemci } from "./KillChainIstemci";

export const metadata: Metadata = { title: "Saldırı Zinciri — Veylify" };

export default async function KillChainPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  const events = Events.forOwner(user.id, 2000);
  const zincirler = killChainCikar(events);
  const ozet = killChainOzet(zincirler);

  const baslik = ceviri("nav.killchain", dil);

  return (
    <>
      <PanelUst kirintilar={[{ ad: baslik }]} baslik={baslik} />
      <KillChainIstemci dil={dil} zincirler={zincirler} ozet={ozet} olaySayisi={events.length} />
    </>
  );
}
