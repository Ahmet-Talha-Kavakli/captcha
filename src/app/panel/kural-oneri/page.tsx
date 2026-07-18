import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events, Rules, Sites } from "@/lib/db/db";
import { kuralOnerileri } from "@/lib/specter/kural-oneri";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { KuralOneriIstemci } from "./KuralOneriIstemci";

export const metadata: Metadata = { title: "Kural Önerileri — Veylify" };

export default async function KuralOneriPage() {
  const user = await currentUser();
  if (!user) return null;

  const dil = await panelDil();

  const events = Events.forOwner(user.id, 3000);
  const mevcutKurallar = Rules.forOwner(user.id);
  const sonuc = kuralOnerileri(events, mevcutKurallar);
  const sites = Sites.forOwner(user.id);

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.rulesuggest", dil) }]} baslik={ceviri("nav.rulesuggest", dil)} />
      <KuralOneriIstemci
        oneriler={sonuc.oneriler}
        ozet={sonuc.ozet}
        siteler={sites.map((s) => ({ id: s.id, name: s.name }))}
        dil={dil}
      />
    </>
  );
}
