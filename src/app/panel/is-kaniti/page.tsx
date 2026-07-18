import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { powDagitim } from "@/lib/specter/proof-of-work";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { IsKanitiIstemci } from "./IsKanitiIstemci";
import { isKanitiCeviri } from "./is-kaniti.i18n";

export const metadata: Metadata = { title: "İşlem Kanıtı — Veylify" };

export default async function IsKanitiPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  // Gerçek olaylar — her isteğin skoruna göre alacağı zorluk dağılımı hesaplanır.
  const events = Events.forOwner(user.id, 3000);
  const rapor = powDagitim(events);

  return (
    <>
      <PanelUst
        kirintilar={[{ ad: ceviri("nav.proofofwork", dil) }]}
        baslik={isKanitiCeviri("pow.baslik", dil)}
      />
      <IsKanitiIstemci rapor={rapor} olaySayisi={events.length} dil={dil} />
    </>
  );
}
