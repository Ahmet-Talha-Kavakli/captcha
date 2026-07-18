import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Sites, Usage } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { SitelerIstemci } from "./SitelerIstemci";

export const metadata: Metadata = { title: "Siteler — Veylify" };

export default async function SitelerPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();
  const sites = Sites.forOwner(user.id);
  const enriched = sites.map((s) => {
    const u = Usage.forSite(s.id, 30);
    const t = u.reduce((a, x) => ({ issued: a.issued + x.issued, blocked: a.blocked + x.blocked }), { issued: 0, blocked: 0 });
    return {
      id: s.id, name: s.name, domains: s.domains, difficulty: s.difficulty, mode: s.mode,
      invisibleMode: s.invisibleMode, active: s.active, verified: s.verified, stats: t,
    };
  });

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.sites", dil) }]} baslik={ceviri("nav.sites", dil)} />
      <SitelerIstemci sites={enriched} dil={dil} />
    </>
  );
}
