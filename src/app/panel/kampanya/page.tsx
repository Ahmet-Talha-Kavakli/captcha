import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { kampanyalariCikar, kampanyaOzet } from "./kumele";
import { KampanyaIstemci } from "./KampanyaIstemci";

export const metadata: Metadata = { title: "Kampanyalar — Veylify" };

/**
 * Kampanya İlişkilendirme paneli (sunucu). Ham bot olaylarını çeker,
 * saf/deterministik kümeleme motoruyla kampanyalara ayırır ve istemciye
 * geçirir. Skorlama/adlandırma tamamen türetilmiştir — DB'ye yazılmaz.
 */
export default async function KampanyaPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  const events = Events.forOwner(user.id, 800);
  const kampanyalar = kampanyalariCikar(events);
  const ozet = kampanyaOzet(kampanyalar, events.length);

  const baslik = ceviri("nav.campaigns", dil);

  return (
    <>
      <PanelUst kirintilar={[{ ad: baslik }]} baslik={baslik} />
      <KampanyaIstemci dil={dil} kampanyalar={kampanyalar} ozet={ozet} toplamOlay={events.length} />
    </>
  );
}
