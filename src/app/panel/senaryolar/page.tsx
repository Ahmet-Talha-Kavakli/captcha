import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Sites } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { SenaryolarIstemci } from "./SenaryolarIstemci";
import { senaryolarCeviri } from "./senaryolar.i18n";

export const metadata: Metadata = { title: "Kullanım Senaryoları — Veylify" };

export default async function SenaryolarPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();
  const baslik = senaryolarCeviri("x.baslik", dil);
  const sites = Sites.forOwner(user.id);
  return (
    <>
      <PanelUst kirintilar={[{ ad: baslik }]} baslik={baslik} />
      <SenaryolarIstemci dil={dil} sites={sites.map((s) => ({ id: s.id, name: s.name }))} />
    </>
  );
}
