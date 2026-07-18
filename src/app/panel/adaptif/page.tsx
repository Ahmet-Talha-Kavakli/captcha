import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { olaylardanOrnek, adaptifEsikOgren, geriBeslemeSaglik } from "@/lib/specter/adaptif-ogrenme";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { AdaptifIstemci } from "./AdaptifIstemci";
import { adaptifCeviri } from "./adaptif.i18n";

export const metadata: Metadata = { title: "Adaptif Öğrenme — Veylify" };

export default async function AdaptifPage() {
  const user = await currentUser();
  if (!user) return null;

  const dil = await panelDil();

  const events = Events.forOwner(user.id, 3000);
  const ornekler = olaylardanOrnek(events);
  const sonuc = adaptifEsikOgren(ornekler, 0.5);
  const saglik = geriBeslemeSaglik(sonuc, 0.5);

  return (
    <>
      <PanelUst
        kirintilar={[{ ad: ceviri("nav.adaptive", dil) }]}
        baslik={adaptifCeviri("x.ustBaslik", dil)}
      />
      <AdaptifIstemci sonuc={sonuc} saglik={saglik} olaySayisi={events.length} dil={dil} />
    </>
  );
}
