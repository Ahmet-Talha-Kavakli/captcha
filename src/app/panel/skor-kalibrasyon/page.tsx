import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { kalibrasyonAnaliz, driftAnaliz } from "@/lib/specter/skor-kalibrasyon";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { SkorKalibrasyonIstemci } from "./SkorKalibrasyonIstemci";
import { skorKalibrasyonCeviri } from "./skor-kalibrasyon.i18n";

export const metadata: Metadata = { title: "Skor Kalibrasyonu — Veylify" };

export default async function SkorKalibrasyonPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  const events = Events.forOwner(user.id, 3000);
  const kalibrasyon = kalibrasyonAnaliz(events);
  const drift = driftAnaliz(events);

  return (
    <>
      <PanelUst
        kirintilar={[{ ad: ceviri("nav.calibration", dil) }]}
        baslik={skorKalibrasyonCeviri("sk.baslik", dil)}
      />
      <SkorKalibrasyonIstemci kalibrasyon={kalibrasyon} drift={drift} dil={dil} />
    </>
  );
}
