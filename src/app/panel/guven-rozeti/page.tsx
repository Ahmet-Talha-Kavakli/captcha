import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events, Sites } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { rozetIstatistik } from "./rozet";
import { grCeviri } from "./guven-rozeti.i18n";
import { GuvenRozetiIstemci } from "./GuvenRozetiIstemci";

export const metadata: Metadata = { title: "Güven Rozeti — Veylify" };

/**
 * Güven Rozeti & Şeffaflık — sunucu girişi.
 * Sahibin GERÇEK olaylarından (Events.forOwner) rozet istatistiklerini
 * türetir ve istemciye verir. Yalnızca doğrulanmış siteler herkese açık
 * rozete uygundur — slug seçimi için site listesini de geçeriz.
 */
export default async function GuvenRozetiPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();
  const navBaslik = ceviri("nav.trustbadge", dil);
  const baslik = navBaslik + grCeviri("gr.baslikEk", dil);

  // Gerçek koruma verisi: sahibin son olayları + site sayısı.
  const events = Events.forOwner(user.id, 2000);
  const sites = Sites.forOwner(user.id);
  const dogrulanmisSite = sites.filter((s) => s.verified).length;
  const veri = rozetIstatistik(events, sites.length);

  return (
    <>
      <PanelUst kirintilar={[{ ad: navBaslik }]} baslik={baslik} />
      <GuvenRozetiIstemci
        dil={dil}
        veri={veri}
        siteler={sites.map((s) => ({ id: s.id, name: s.name, verified: s.verified }))}
        dogrulanmisSite={dogrulanmisSite}
      />
    </>
  );
}
