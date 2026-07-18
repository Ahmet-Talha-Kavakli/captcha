import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Alerts, Team, Campaigns } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { UyarilarIstemci } from "./UyarilarIstemci";

export const metadata: Metadata = { title: "Olaylar — Veylify" };

export default async function UyarilarPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();
  const alerts = Alerts.forOwner(user.id);
  const team = Team.forOwner(user.id);
  const campaigns = Campaigns.forOwner(user.id);

  const baslik = ceviri("nav.alerts", dil);

  return (
    <>
      <PanelUst kirintilar={[{ ad: baslik }]} baslik={baslik} />
      <UyarilarIstemci
        dil={dil}
        alerts={alerts.map((a) => ({
          id: a.id,
          severity: a.severity,
          title: a.title,
          message: a.message,
          ts: a.ts,
          read: a.read,
          category: a.category,
          status: a.status,
          assignee: a.assignee ?? null,
          priority: a.priority,
          sourceIp: a.sourceIp,
          relatedCampaignId: a.relatedCampaignId,
          timeline: a.timeline ?? [],
          acknowledgedAt: a.acknowledgedAt,
          resolvedAt: a.resolvedAt,
        }))}
        team={team.map((t) => ({ id: t.id, name: t.name, avatarColor: t.avatarColor, role: t.role, status: t.status }))}
        campaigns={campaigns.map((c) => ({ id: c.id, name: c.name, status: c.status }))}
      />
    </>
  );
}
