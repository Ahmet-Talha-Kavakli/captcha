import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Sites } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { KuralPazariIstemci } from "./KuralPazariIstemci";

export const metadata: Metadata = { title: "Kural Pazarı — Veylify" };

export default async function KuralPazariPage() {
  const user = await currentUser();
  if (!user) return null;
  const sites = Sites.forOwner(user.id);
  const dil = await panelDil();

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.marketplace", dil) }]} baslik={ceviri("nav.marketplace", dil)} />
      <KuralPazariIstemci dil={dil} sites={sites.map((s) => ({ id: s.id, name: s.name }))} />
    </>
  );
}
