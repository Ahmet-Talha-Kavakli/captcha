import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { YerellestirmeIstemci } from "./YerellestirmeIstemci";

export const metadata: Metadata = { title: "Yerelleştirme Merkezi — Veylify" };

/**
 * Widget Yerelleştirme Merkezi — sunucu sayfası.
 * Veri statik katalog (yerel.ts) olduğundan sunucuda iş yok; sadece kullanıcı
 * koruması + istemci render. Düzenlemeler istemcide oturum-yerel (localStorage).
 */
export default async function YerellestirmePage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  return (
    <>
      <PanelUst
        kirintilar={[{ ad: ceviri("nav.wloc", dil) }]}
        baslik={ceviri("nav.wloc", dil)}
      />
      <YerellestirmeIstemci dil={dil} />
    </>
  );
}
