import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events, Sites } from "@/lib/db/db";
import { federeKorelasyon } from "@/lib/specter/federe-korelasyon";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { FedereIstemci } from "./FedereIstemci";
import { fedCeviri } from "./federe.i18n";

export const metadata: Metadata = { title: "Federe Korelasyon — Veylify" };

export default async function FederePage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  const siteler = Sites.forOwner(user.id);
  const events = Events.forOwner(user.id, 3000);
  const rapor = federeKorelasyon(events, siteler.length);

  // siteId → ad eşlemesi (görselleştirme için).
  const siteAd: Record<string, string> = {};
  for (const s of siteler) siteAd[s.id] = s.name;

  return (
    <>
      <PanelUst kirintilar={[{ ad: fedCeviri("kirinti", dil) }]} baslik={fedCeviri("baslik", dil)} />
      <FedereIstemci rapor={rapor} siteAd={siteAd} olaySayisi={events.length} dil={dil} />
    </>
  );
}
