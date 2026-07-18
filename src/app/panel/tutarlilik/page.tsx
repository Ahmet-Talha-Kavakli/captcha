import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { tutarlilikAnaliz } from "@/lib/specter/tarayici-tutarlilik";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { tutarlilikCeviri } from "./tutarlilik.i18n";
import { TutarlilikIstemci } from "./TutarlilikIstemci";

export const metadata: Metadata = { title: "Tarayıcı Tutarlılık — Veylify" };

export default async function TutarlilikPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  const events = Events.forOwner(user.id, 3000);
  const dagilim = tutarlilikAnaliz(events);
  const baslik = tutarlilikCeviri("tc.baslik", dil);

  return (
    <>
      <PanelUst
        kirintilar={[{ ad: tutarlilikCeviri("tc.kirinti", dil) }]}
        baslik={baslik}
      />
      <TutarlilikIstemci dil={dil} dagilim={dagilim} />
    </>
  );
}
