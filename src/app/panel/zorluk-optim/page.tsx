import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { politikalariDegerlendir, kazananSec, oneriUret } from "./optim";
import { ZorlukOptimIstemci } from "./ZorlukOptimIstemci";
import { optimCeviri } from "./zorluk-optim.i18n";

export const metadata: Metadata = { title: "Zorluk Optimizasyonu — Veylify" };

/**
 * Adaptif Zorluk A/B Optimizasyon Motoru (sunucu).
 * Gerçek gözlemlenen olayları çeker, tüm politikaları KONTRFAKTÜEL simüle eder,
 * istatistiksel kazananı seçer ve öneri üretir. Ağır hesap sunucuda yapılır.
 */
export default async function ZorlukOptimPage() {
  const user = await currentUser();
  if (!user) return null;

  const dil = await panelDil();

  const events = Events.forOwner(user.id, 1500);
  const sonuclar = politikalariDegerlendir(events);
  const kazanan = kazananSec(sonuclar);
  const oneri = oneriUret(kazanan);

  return (
    <>
      <PanelUst
        kirintilar={[{ ad: ceviri("nav.diffoptim", dil) }]}
        baslik={optimCeviri("x.ustBaslik", dil)}
      />
      <ZorlukOptimIstemci
        sonuclar={sonuclar}
        kazanan={kazanan}
        oneri={oneri}
        olaySayisi={events.length}
        dil={dil}
      />
    </>
  );
}
