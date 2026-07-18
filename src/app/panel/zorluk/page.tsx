import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Sites, Events, IpRep } from "@/lib/db/db";
import { zorlukAnaliz } from "@/lib/specter/difficulty-analiz";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { ZorlukIstemci } from "./ZorlukIstemci";
import type { IpReputation } from "@/lib/db/schema";

export const metadata: Metadata = { title: "Adaptif Zorluk — Veylify" };

export default async function ZorlukPage() {
  const user = await currentUser();
  if (!user) return null;

  const dil = await panelDil();

  const sites = Sites.forOwner(user.id);
  const events = Events.forOwner(user.id, 1500);

  // IP itibar haritası (analiz için).
  const repList = IpRep.forOwner();
  const repMap = new Map<string, IpReputation>(repList.map((r) => [r.ip, r]));

  // Taban zorluk: sitelerin en yaygın difficulty'si (yoksa medium).
  const tabanSay: Record<string, number> = {};
  for (const s of sites) tabanSay[s.difficulty] = (tabanSay[s.difficulty] || 0) + 1;
  const taban = (Object.entries(tabanSay).sort((a, b) => b[1] - a[1])[0]?.[0] as "low" | "medium" | "high") ?? "medium";

  const analiz = zorlukAnaliz(events, repMap, taban);

  // Site başına zorluk yapılandırması (istemcide gösterilecek).
  const siteZorluk = sites.map((s) => ({
    id: s.id,
    name: s.name,
    difficulty: s.difficulty,
    mode: s.mode,
    verified: s.verified,
  }));

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.difficulty", dil) }]} baslik={ceviri("nav.difficulty", dil)} />
      <ZorlukIstemci taban={taban} analiz={analiz} siteler={siteZorluk} olaySayisi={events.length} dil={dil} />
    </>
  );
}
