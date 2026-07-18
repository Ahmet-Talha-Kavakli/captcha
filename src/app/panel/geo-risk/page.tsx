import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events, IpRep } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { ulkeRiskPuanla, asnRiskPuanla, geoOzet } from "@/lib/specter/geo-risk";
import { GeoRiskIstemci } from "./GeoRiskIstemci";

export const metadata: Metadata = { title: "Coğrafi & ASN Risk — Veylify" };

export default async function GeoRiskPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  // Gerçek trafikten puanla (sahibe ait son olaylar + global IP itibarı).
  const events = Events.forOwner(user.id, 4000);
  const ipRep = IpRep.forOwner();

  const ulkeRiskler = ulkeRiskPuanla(events);
  const asnRiskler = asnRiskPuanla(events, ipRep);
  const ozet = geoOzet(ulkeRiskler, asnRiskler);

  return (
    <>
      <PanelUst
        kirintilar={[{ ad: ceviri("nav.georisk", dil) }]}
        baslik={ceviri("nav.georisk", dil)}
      />
      <GeoRiskIstemci ulkeRiskler={ulkeRiskler} asnRiskler={asnRiskler} ozet={ozet} dil={dil} />
    </>
  );
}
