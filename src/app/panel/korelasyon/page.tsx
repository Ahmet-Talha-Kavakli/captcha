import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { Events } from "@/lib/db/db";
import { korelasyonBul, korelasyonOzet, type KorelasyonOlay } from "@/lib/specter/correlation";
import { KorelasyonIstemci } from "./KorelasyonIstemci";

export const metadata: Metadata = { title: "Olay Korelasyonu — Veylify" };

export default async function KorelasyonPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  // Sahibin son olaylarını çek (SIEM korelasyon motorunun ham girdisi).
  const ham = Events.forOwner(user.id, 2000);
  // Motor için gereken asgari alanlara indir (BotEvent → KorelasyonOlay).
  const olaylar: KorelasyonOlay[] = ham.map((e) => ({
    id: e.id,
    ts: e.ts,
    ip: e.ip,
    country: e.country,
    asn: e.asn,
    ua: e.ua,
    path: e.path,
    botClass: e.botClass,
    verdict: e.verdict,
    score: e.score,
  }));

  const korelasyonlar = korelasyonBul(olaylar);
  const ozet = korelasyonOzet(korelasyonlar);

  return (
    <>
      <PanelUst
        kirintilar={[{ ad: ceviri("nav.correlation", dil) }]}
        baslik={ceviri("nav.correlation", dil)}
      />
      <KorelasyonIstemci
        korelasyonlar={korelasyonlar}
        ozet={ozet}
        toplamOlay={olaylar.length}
        dil={dil}
      />
    </>
  );
}
