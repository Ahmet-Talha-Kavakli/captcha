import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Audit } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { DenetimIstemci } from "./DenetimIstemci";

export const metadata: Metadata = { title: "Denetim — Veylify" };

export default async function DenetimPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();
  const logs = Audit.forOwner(user.id, 500);
  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.audit", dil) }]} baslik={ceviri("nav.audit", dil)} />
      <DenetimIstemci
        dil={dil}
        logs={logs.map((l) => ({
          id: l.id,
          actorName: l.actorName,
          action: l.action,
          target: l.target,
          ts: l.ts,
          ip: l.ip,
          category: l.category ?? "site",
          seq: l.seq ?? 0,
          hash: l.hash ?? "",
          prevHash: l.prevHash ?? "",
          critical: l.critical ?? false,
          onceki: l.onceki ?? null,
          sonraki: l.sonraki ?? null,
          meta: l.meta ?? null,
        }))}
      />
    </>
  );
}
