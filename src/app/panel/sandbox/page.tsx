import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Rules } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { SandboxIstemci } from "./SandboxIstemci";

export const metadata: Metadata = { title: "Saldırı Sandbox'ı — Veylify" };

export default async function SandboxPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  // Baz = canlıdaki gerçek kurallar. Sandbox bunları üretime dokunmadan yeniden oynatır.
  const kurallar = Rules.forOwner(user.id);

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.sandbox", dil) }]} baslik={ceviri("nav.sandbox", dil)} />
      <SandboxIstemci dil={dil} bazKurallar={kurallar} />
    </>
  );
}
