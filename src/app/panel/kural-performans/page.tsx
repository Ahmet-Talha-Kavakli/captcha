import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Rules, Events } from "@/lib/db/db";
import { kuralPerformans } from "@/lib/specter/kural-performans";
import { PanelUst } from "@/components/panel/PanelUst";
import { KuralPerformansIstemci } from "./KuralPerformansIstemci";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { kuralCeviri } from "./kural-performans.i18n";

export const metadata: Metadata = { title: "Kural Performansı — Veylify" };

export default async function KuralPerformansPage() {
  const user = await currentUser();
  if (!user) return null;

  const dil = await panelDil();
  const rules = Rules.forOwner(user.id);
  const events = Events.forOwner(user.id, 3000);
  const sonuc = kuralPerformans(rules, events);

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.ruleperf", dil) }]} baslik={kuralCeviri("baslik", dil)} />
      <KuralPerformansIstemci kurallar={sonuc.kurallar} ozet={sonuc.ozet} olaySayisi={events.length} dil={dil} />
    </>
  );
}
