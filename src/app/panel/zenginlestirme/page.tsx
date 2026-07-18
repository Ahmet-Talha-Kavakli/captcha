import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events, IpRep } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { gostergeleriZenginlestir, zenginlestirmeOzet } from "./zengin";
import { ZenginlestirmeIstemci } from "./ZenginlestirmeIstemci";
import { zgCeviri } from "./zenginlestirme.i18n";

export const metadata: Metadata = { title: "Tehdit Göstergesi Zenginleştirme — Veylify" };

/**
 * Tehdit Göstergesi Zenginleştirme (IOC Auto-Enrichment) — sunucu.
 * Gözlemlenen ham göstergeleri (saldıran IP'ler + ASN'ler) alıp her birini
 * türetilmiş bağlamla (ağ tipi, itibar, güven, tehdit, aksiyon) zenginleştirir.
 */
export default async function ZenginlestirmePage() {
  const user = await currentUser();
  if (!user) return null;

  const dil = await panelDil();

  // GERÇEK gözlemlenen trafik + global IP itibar kayıtları.
  const events = Events.forOwner(user.id, 1000);
  const ipRep = IpRep.forOwner();

  const gostergeler = gostergeleriZenginlestir(events, ipRep);
  const ozet = zenginlestirmeOzet(gostergeler);

  // Başlık nav "Zenginleştirme"den daha zengin — yerel sayfa.baslik kullanılır.
  const baslik = zgCeviri("sayfa.baslik", dil);

  return (
    <>
      <PanelUst kirintilar={[{ ad: baslik }]} baslik={baslik} />
      <ZenginlestirmeIstemci gostergeler={gostergeler} ozet={ozet} dil={dil} />
    </>
  );
}
