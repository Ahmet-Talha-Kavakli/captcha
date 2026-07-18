import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events, Rules } from "@/lib/db/db";
import { otoDuzeltmeCalistir } from "@/lib/specter/oto-duzeltme";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { OtoDuzeltmeIstemci } from "./OtoDuzeltmeIstemci";

export const metadata: Metadata = { title: "Otomatik Düzeltme — Veylify" };

export default async function OtoDuzeltmePage() {
  const user = await currentUser();
  if (!user) return null;

  const dil = await panelDil();

  // Gözlemlenen gerçek olaylar → boşluk tespiti; canlı kurallar → doğrulama bazı.
  const events = Events.forOwner(user.id, 800);
  const kurallar = Rules.forOwner(user.id);
  const rapor = otoDuzeltmeCalistir(events, kurallar);

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.autofix", dil) }]} baslik={ceviri("nav.autofix", dil)} />
      <OtoDuzeltmeIstemci rapor={rapor} olaySayisi={events.length} kuralSayisi={kurallar.length} dil={dil} />
    </>
  );
}
