import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { yolAnaliz, yuzeyOzet, kategoriDagilim } from "@/lib/specter/saldiri-yuzeyi";
import { SaldiriYuzeyiIstemci } from "./SaldiriYuzeyiIstemci";

export const metadata: Metadata = { title: "Saldırı Yüzeyi Analizi — Veylify" };

export default async function SaldiriYuzeyiPage() {
  const user = await currentUser();
  if (!user) return null;

  const dil = await panelDil();

  // Sahibin son olayları üzerinden saf/deterministik analiz.
  const olaylar = Events.forOwner(user.id, 4000);
  const yolRiskler = yolAnaliz(olaylar);
  const ozet = yuzeyOzet(yolRiskler);
  const dagilim = kategoriDagilim(yolRiskler);

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.surface", dil) }]} baslik={ceviri("nav.surface", dil)} />
      <SaldiriYuzeyiIstemci yolRiskler={yolRiskler} ozet={ozet} dagilim={dagilim} dil={dil} />
    </>
  );
}
