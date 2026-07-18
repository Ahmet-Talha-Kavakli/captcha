import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { robotsUyumAnaliz, VARSAYILAN_KORUMALI_YOLLAR } from "@/lib/specter/robots-uyum";
import { RobotsUyumIstemci } from "./RobotsUyumIstemci";

export const metadata: Metadata = { title: "robots.txt Uyum Denetleyici — Veylify" };

export default async function RobotsUyumPage() {
  const user = await currentUser();
  if (!user) return null;

  const dil = await panelDil();

  // Son 30 günün gözlenen trafiğinden AI bot isteklerini süz ve temsili
  // robots.txt politikasıyla karşılaştır. Zaman penceresi burada (server)
  // hesaplanır; motor saftır (Date.now kullanmaz).
  const simdi = Date.now();
  const gun30 = simdi - 30 * 864e5;
  const olaylar = Events.forOwner(user.id, 8000)
    .filter((e) => e.ts >= gun30)
    .map((e) => ({ ua: e.ua || "", path: e.path || "" }));

  const rapor = robotsUyumAnaliz(olaylar, VARSAYILAN_KORUMALI_YOLLAR);

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.robots", dil) }]} baslik={ceviri("nav.robots", dil)} />
      <RobotsUyumIstemci
        ajanlar={rapor.ajanlar}
        ozet={rapor.ozet}
        korumaliYollar={VARSAYILAN_KORUMALI_YOLLAR}
        dil={dil}
      />
    </>
  );
}
