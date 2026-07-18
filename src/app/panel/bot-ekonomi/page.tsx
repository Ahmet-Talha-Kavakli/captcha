import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { botEkonomiHesap } from "@/lib/specter/bot-ekonomi";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { BotEkonomiIstemci } from "./BotEkonomiIstemci";
import { botEkonomiCeviri } from "./bot-ekonomi.i18n";

export const metadata: Metadata = { title: "Bot Ekonomisi — Veylify" };

export default async function BotEkonomiPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  const events = Events.forOwner(user.id, 1500);
  const rapor = botEkonomiHesap(events);

  return (
    <>
      <PanelUst
        kirintilar={[{ ad: ceviri("nav.boteconomy", dil) }]}
        baslik={botEkonomiCeviri("eko.baslik", dil)}
      />
      <BotEkonomiIstemci rapor={rapor} olaySayisi={events.length} dil={dil} />
    </>
  );
}
