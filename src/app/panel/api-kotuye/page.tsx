import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { apiAbuseAnaliz } from "@/lib/specter/api-kotuye";
import { panelDil } from "@/lib/i18n/sunucu";
import { PanelUst } from "@/components/panel/PanelUst";
import { ApiKotuyeIstemci } from "./ApiKotuyeIstemci";
import { kotuyeCeviri } from "./api-kotuye.i18n";

export const metadata: Metadata = { title: "API Kötüye-Kullanım — Veylify" };

export default async function ApiKotuyePage() {
  const user = await currentUser();
  if (!user) return null;

  const dil = await panelDil();
  const events = Events.forOwner(user.id, 3000);
  const rapor = apiAbuseAnaliz(events);

  return (
    <>
      <PanelUst kirintilar={[{ ad: kotuyeCeviri("kirinti", dil) }]} baslik={kotuyeCeviri("baslik", dil)} />
      <ApiKotuyeIstemci rapor={rapor} olaySayisi={events.length} dil={dil} />
    </>
  );
}
