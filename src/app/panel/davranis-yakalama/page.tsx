import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { DavranisYakalamaIstemci } from "./DavranisYakalamaIstemci";
import { davranisYakalamaCeviri } from "./davranis-yakalama.i18n";

export const metadata: Metadata = { title: "Davranış Yakalama Stüdyosu — Veylify" };

/**
 * Davranış Yakalama Stüdyosu (server kabuğu)
 * ==========================================
 * Bu sayfa büyük ölçüde bir kabuktur: asıl iş istemci bileşeninde,
 * yöneticinin KENDİ tarayıcısında olur. specter.js widget'ının topladığı
 * BehaviorSignals'ın AYNISI canlı yakalanır ve gerçek `scoreBehavior()`
 * motoruna verilir — biyometrik yakalamanın gerçekten çalıştığını kanıtlar.
 * (Mevcut /panel/biyometri analiz sayfasını TAMAMLAR, değiştirmez.)
 */
export default async function DavranisYakalamaPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  return (
    <>
      <PanelUst
        kirintilar={[{ ad: davranisYakalamaCeviri("dy.baslik", dil) }]}
        baslik={davranisYakalamaCeviri("dy.baslik.uzun", dil)}
      />
      <DavranisYakalamaIstemci dil={dil} />
    </>
  );
}
