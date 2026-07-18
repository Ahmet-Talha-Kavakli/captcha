import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { imzaMadenciligi, madencilikOzet } from "./madencilik";
import { ImzaMadencilikIstemci } from "./ImzaMadencilikIstemci";

export const metadata: Metadata = { title: "İmza Madenciliği — Veylify" };

/**
 * Otomatik İmza Madenciliği — sunucu tarafı.
 * Sahibin son 2000 olayını çeker, kümeleme ile aday imzalar madenler ve
 * özetiyle birlikte istemciye verir. Elle yazma YOK — denetimsiz keşif.
 */
export default async function ImzaMadencilikPage() {
  const user = await currentUser();
  if (!user) return null;

  const dil = await panelDil();

  const events = Events.forOwner(user.id, 2000);
  const imzalar = imzaMadenciligi(events);
  const ozet = madencilikOzet(imzalar);

  // Toplam kötü/olay bağlamı (özet başlığı için).
  const toplamOlay = events.length;
  const kotuOlay = events.filter((e) => e.botClass !== "human" && e.botClass !== "good_bot").length;

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.sigmining", dil) }]} baslik={ceviri("nav.sigmining", dil)} />
      <ImzaMadencilikIstemci
        imzalar={imzalar}
        ozet={ozet}
        toplamOlay={toplamOlay}
        kotuOlay={kotuOlay}
        dil={dil}
      />
    </>
  );
}
