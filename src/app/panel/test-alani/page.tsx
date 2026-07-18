import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Sites } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { TestAlaniIstemci } from "./TestAlaniIstemci";

export const metadata: Metadata = { title: "API Test Alanı — Veylify" };

export default async function TestAlaniPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();
  const sites = Sites.forOwner(user.id);
  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.playground", dil) }]} baslik={ceviri("nav.playground", dil)} />
      <TestAlaniIstemci
        dil={dil}
        sites={sites.map((s) => ({ id: s.id, name: s.name, siteKey: s.siteKey, secretKey: s.secretKey }))}
      />
    </>
  );
}
