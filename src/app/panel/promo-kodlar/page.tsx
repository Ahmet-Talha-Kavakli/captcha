import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Promo } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { PromoKodlarIstemci } from "./PromoKodlarIstemci";

export const metadata: Metadata = { title: "Promo Kodlar — Veylify" };

export default async function PromoKodlarPage() {
  const user = await currentUser();
  if (!user) return null;

  const kodlar = Promo.all();
  const kullanimlar = Promo.kullanimlar();
  const toplamIndirim = kullanimlar.reduce((a, k) => a + k.indirimTutari, 0);

  return (
    <>
      <PanelUst kirintilar={[{ ad: "Promo Kodlar" }]} baslik="Promo Kodlar" />
      <PromoKodlarIstemci
        baslangic={kodlar}
        toplamIndirim={toplamIndirim}
      />
    </>
  );
}
