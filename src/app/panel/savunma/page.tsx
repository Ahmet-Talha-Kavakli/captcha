import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { savunmaGenel } from "@/lib/specter/savunma-katmanlari";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { SavunmaIstemci } from "./SavunmaIstemci";
import { savunmaCeviri } from "./savunma.i18n";

export const metadata: Metadata = { title: "Savunma Katmanları — Veylify" };

export default async function SavunmaPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  // Sahibin son olayları üzerinden saf/deterministik 4-katman genel durumu.
  const events = Events.forOwner(user.id, 3000);
  const genel = savunmaGenel(events);

  const baslik = savunmaCeviri("sv.baslik", dil);

  return (
    <>
      <PanelUst kirintilar={[{ ad: baslik }]} baslik={baslik} />
      <SavunmaIstemci genel={genel} dil={dil} />
    </>
  );
}
