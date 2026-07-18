import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { oturumlariCikar, oturumOzet } from "@/lib/specter/oturum-replay";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { OturumReplayIstemci } from "./OturumReplayIstemci";

export const metadata: Metadata = { title: "Oturum Yeniden-Oynatma — Veylify" };

export default async function OturumReplayPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  const events = Events.forOwner(user.id, 2000);
  const oturumlar = oturumlariCikar(events).slice(0, 40);
  const ozet = oturumOzet(oturumlar);

  const baslik = ceviri("nav.replay", dil);

  return (
    <>
      <PanelUst kirintilar={[{ ad: baslik }]} baslik={baslik} />
      <OturumReplayIstemci oturumlar={oturumlar} ozet={ozet} dil={dil} />
    </>
  );
}
