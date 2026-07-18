import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { tehditAktorAnaliz } from "@/lib/specter/tehdit-aktor";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { TehditAktorIstemci } from "./TehditAktorIstemci";

export const metadata: Metadata = { title: "Tehdit Aktörleri — Veylify" };

export default async function TehditAktorPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  const events = Events.forOwner(user.id, 3000);
  const sonuc = tehditAktorAnaliz(events);
  const baslik = ceviri("nav.threatactor", dil);

  return (
    <>
      <PanelUst kirintilar={[{ ad: baslik }]} baslik={baslik} />
      <TehditAktorIstemci atiflar={sonuc.atiflar.slice(0, 30)} ozet={sonuc.ozet} dil={dil} />
    </>
  );
}
