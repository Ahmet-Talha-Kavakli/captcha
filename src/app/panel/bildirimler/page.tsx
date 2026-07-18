import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { bildirimMerkezi } from "@/lib/ozet";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { bildirimlerCeviri } from "./bildirimler.i18n";
import { BildirimlerIstemci } from "./BildirimlerIstemci";

export const metadata: Metadata = { title: "Bildirimler — Veylify" };

/**
 * Bildirim Merkezi (tam sayfa) — Linear/GitHub Notifications seviyesi.
 * Uyarılar modülünden FARKI: bu gelen-kutusu güvenlik olaylarına ek olarak
 * kota/ekip/rapor/sistem bildirimlerini de içerir (birleşik). Erişim Topbar'daki
 * bildirim zilinden "Tümünü gör" ile; sidebar'a eklenmez.
 */
export default async function BildirimlerPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();
  const bildirimler = bildirimMerkezi(user.id);

  return (
    <>
      <PanelUst
        kirintilar={[{ ad: bildirimlerCeviri("bl.kirinti", dil) }]}
        baslik={bildirimlerCeviri("bl.baslik", dil)}
      />
      <BildirimlerIstemci bildirimler={bildirimler} dil={dil} />
    </>
  );
}
