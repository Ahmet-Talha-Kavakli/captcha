import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Rules, Sites } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { kurallarCeviri } from "./kurallar.i18n";
import { KurallarIstemci } from "./KurallarIstemci";

export const metadata: Metadata = { title: "Kurallar — Veylify" };

export default async function KurallarPage() {
  const user = await currentUser();
  if (!user) return null;
  const sites = Sites.forOwner(user.id);
  const rules = Rules.forOwner(user.id);
  const dil = await panelDil();

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.rules", dil) }]} baslik={kurallarCeviri("kr.baslik", dil)} />
      <KurallarIstemci
        dil={dil}
        sites={sites.map((s) => ({ id: s.id, name: s.name }))}
        rules={rules.map((r) => ({
          id: r.id, siteId: r.siteId, name: r.name, description: r.description, enabled: r.enabled,
          priority: r.priority, field: r.field, op: r.op, value: r.value, action: r.action, hits: r.hits, system: r.system,
        }))}
      />
    </>
  );
}
