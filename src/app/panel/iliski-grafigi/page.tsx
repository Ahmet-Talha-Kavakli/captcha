import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { iliskiGrafigi } from "@/lib/specter/iliski-grafigi";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { IliskiGrafigiIstemci } from "./IliskiGrafigiIstemci";
import { grafCeviri } from "./iliski-grafigi.i18n";

export const metadata: Metadata = { title: "Saldırgan İlişki Grafiği — Veylify" };

export default async function IliskiGrafigiPage() {
  const user = await currentUser();
  if (!user) return null;

  const dil = await panelDil();
  const events = Events.forOwner(user.id, 3000);
  const graf = iliskiGrafigi(events);

  return (
    <>
      <PanelUst
        kirintilar={[{ ad: ceviri("nav.graph", dil) }]}
        baslik={grafCeviri("graf.baslik", dil)}
      />
      <IliskiGrafigiIstemci
        kumeler={graf.kumeler.slice(0, 30)}
        odakGraf={graf.odakGraf}
        ozet={graf.ozet}
        dil={dil}
      />
    </>
  );
}
