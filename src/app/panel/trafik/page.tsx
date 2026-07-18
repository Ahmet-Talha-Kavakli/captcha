import type { Metadata } from "next";
import { Suspense } from "react";
import { currentUser } from "@/lib/auth";
import { Events, Sites } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { trafikCeviri } from "./trafik.i18n";
import { TrafikIstemci } from "./TrafikIstemci";

export const metadata: Metadata = { title: "Canlı Trafik — Veylify" };

export default async function TrafikPage() {
  const user = await currentUser();
  if (!user) return null;

  const dil = await panelDil();
  const events = Events.forOwner(user.id, 400);
  const sites = Sites.forOwner(user.id);
  const baslik = ceviri("nav.traffic", dil);

  return (
    <>
      <PanelUst kirintilar={[{ ad: baslik, href: "/panel/trafik" }, { ad: trafikCeviri("tr.olayAkisi", dil) }]} baslik={baslik} />
      <Suspense>
        <TrafikIstemci
          dil={dil}
          events={events.map((e) => ({
            id: e.id,
            ts: e.ts,
            ip: e.ip,
            country: e.country,
            city: e.city,
            asn: e.asn,
            ua: e.ua,
            path: e.path,
            method: e.method,
            botClass: e.botClass,
            verdict: e.verdict,
            score: e.score,
            triggeredRules: e.triggeredRules,
            fingerprint: e.fingerprint,
            latency: e.latency,
            siteId: e.siteId,
          }))}
          sites={sites.map((s) => ({ id: s.id, name: s.name }))}
        />
      </Suspense>
    </>
  );
}
