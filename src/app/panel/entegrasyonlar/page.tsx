import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Integrations } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { EntegrasyonlarIstemci } from "./EntegrasyonlarIstemci";

export const metadata: Metadata = { title: "Entegrasyonlar — Veylify" };

export default async function EntegrasyonlarPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();
  const list = Integrations.forOwner(user.id);
  const baslik = ceviri("nav.integrations", dil);

  return (
    <>
      <PanelUst kirintilar={[{ ad: baslik }]} baslik={baslik} />
      <EntegrasyonlarIstemci
        dil={dil}
        baglantilar={list.map((i) => ({
          id: i.id, tur: i.tur, ad: i.ad, hedef: i.hedef, olaylar: i.olaylar,
          aktif: i.aktif, lastStatus: i.lastStatus, lastDelivery: i.lastDelivery, gonderilen: i.gonderilen,
        }))}
      />
    </>
  );
}
