import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { saldirganNiyetleri, niyetOzet } from "@/lib/specter/niyet-siniflandirma";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { niyetCeviri } from "./niyet.i18n";
import { NiyetIstemci } from "./NiyetIstemci";

export const metadata: Metadata = { title: "Saldırgan Niyeti — Veylify" };

export default async function NiyetPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  const events = Events.forOwner(user.id, 2000);
  const saldirganlar = saldirganNiyetleri(events);
  const ozet = niyetOzet(events, saldirganlar);

  return (
    <>
      <PanelUst
        kirintilar={[{ ad: ceviri("nav.intent", dil) }]}
        baslik={niyetCeviri("n.baslik", dil)}
      />
      <NiyetIstemci saldirganlar={saldirganlar} ozet={ozet} olaySayisi={events.length} dil={dil} />
    </>
  );
}
