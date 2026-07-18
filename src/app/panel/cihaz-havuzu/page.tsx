import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { cihazHavuzuCikar } from "@/lib/specter/cihaz-havuzu";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { CihazHavuzuIstemci } from "./CihazHavuzuIstemci";

export const metadata: Metadata = { title: "Cihaz Havuzu Tespiti — Veylify" };

export default async function CihazHavuzuPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  const events = Events.forOwner(user.id, 3000);
  const sonuc = cihazHavuzuCikar(events);

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.devicepool", dil) }]} baslik={ceviri("nav.devicepool", dil)} />
      <CihazHavuzuIstemci
        cihazlar={sonuc.cihazlar.slice(0, 30)}
        ipHavuzlari={sonuc.ipHavuzlari.slice(0, 30)}
        ozet={sonuc.ozet}
        dil={dil}
      />
    </>
  );
}
