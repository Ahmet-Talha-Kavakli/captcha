import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { birlesikRisk } from "@/lib/specter/birlesik-risk";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { BirlesikRiskIstemci } from "./BirlesikRiskIstemci";

export const metadata: Metadata = { title: "Birleşik Risk — Veylify" };

export default async function BirlesikRiskPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  const events = Events.forOwner(user.id, 3000);
  const sonuc = birlesikRisk(events);

  const baslik = ceviri("nav.unifiedrisk", dil);

  return (
    <>
      <PanelUst kirintilar={[{ ad: baslik }]} baslik={baslik} />
      <BirlesikRiskIstemci
        dil={dil}
        riskler={sonuc.riskler.slice(0, 60)}
        ozet={sonuc.ozet}
        faktorDagilim={sonuc.faktorDagilim}
      />
    </>
  );
}
