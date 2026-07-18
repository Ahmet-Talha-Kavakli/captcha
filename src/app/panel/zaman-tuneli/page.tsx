import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { saldiriZamanTuneli, zamanKovalari, tunelOzet } from "@/lib/specter/zaman-tuneli";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { ZamanTuneliIstemci } from "./ZamanTuneliIstemci";

export const metadata: Metadata = { title: "Saldırı Zaman Tüneli — Veylify" };

export default async function ZamanTuneliPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  // Geniş bir olay penceresi çek — adli yeniden-kurgu ne kadar veri o kadar iyi.
  const events = Events.forOwner(user.id, 3000);

  // Ham olayları kill-chain incident'larına yeniden kur.
  const incidents = saldiriZamanTuneli(events).slice(0, 40);
  const ozet = tunelOzet(incidents);
  // Genel zaman çizelgesi grafiği için verdict-kırılımlı hacim serisi.
  const kovalar = zamanKovalari(events, 80);

  const baslik = ceviri("nav.timeline", dil);

  return (
    <>
      <PanelUst kirintilar={[{ ad: baslik }]} baslik={baslik} />
      <ZamanTuneliIstemci dil={dil} incidents={incidents} ozet={ozet} kovalar={kovalar} />
    </>
  );
}
