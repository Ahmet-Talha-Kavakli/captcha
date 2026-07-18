import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { kapsamHaritasi, kapsamOzet } from "./kapsam";
import { KapsamIstemci } from "./KapsamIstemci";
import { kapsamCeviri } from "./kapsam.i18n";

export const metadata: Metadata = { title: "Koruma Kapsamı & Maruz-Kalma Haritası — Veylify" };

export default async function KapsamPage() {
  const user = await currentUser();
  if (!user) return null;

  const dil = await panelDil();

  // Sahibin son olayları üzerinden saf/deterministik kapsam analizi.
  const olaylar = Events.forOwner(user.id, 800);
  const yollar = kapsamHaritasi(olaylar);
  const ozet = kapsamOzet(yollar);

  return (
    <>
      <PanelUst
        kirintilar={[{ ad: ceviri("nav.coverage", dil) }]}
        baslik={kapsamCeviri("kap.baslik", dil)}
      />
      <KapsamIstemci yollar={yollar} ozet={ozet} dil={dil} />
    </>
  );
}
