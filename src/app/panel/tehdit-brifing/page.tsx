import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events, Campaigns, Alerts } from "@/lib/db/db";
import { korumaOzeti } from "@/lib/ozet";
import { anomaliTespit } from "@/lib/specter/anomaly";
import { korelasyonBul, type KorelasyonOlay } from "@/lib/specter/correlation";
import { brifingGirdiTopla, brifingUret, type BrifingDonem } from "@/lib/specter/tehdit-brifing";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { TehditBrifingIstemci } from "./TehditBrifingIstemci";

export const metadata: Metadata = { title: "Tehdit Brifingi — Veylify" };

function brifingHazirla(donem: BrifingDonem, events: ReturnType<typeof Events.forOwner>, simdi: number, ekstra: { anomaliSayi: number; korelasyonSayi: number; aktifKampanya: number; kritikOlay: number; korumaSkoru: number }) {
  const girdi = brifingGirdiTopla(events, donem, simdi, ekstra);
  return brifingUret(girdi);
}

export default async function TehditBrifingPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  const simdi = Date.now();
  const events = Events.forOwner(user.id, 3000);
  const ozet = korumaOzeti(user.id);
  const anomaliler = anomaliTespit(events);
  const korOlaylar: KorelasyonOlay[] = events.map((e) => ({
    id: e.id, ts: e.ts, ip: e.ip, country: e.country, asn: e.asn, ua: e.ua, path: e.path, botClass: e.botClass, verdict: e.verdict, score: e.score,
  }));
  const korelasyonlar = korelasyonBul(korOlaylar);
  const aktifKampanya = Campaigns.forOwner(user.id).filter((c) => c.status === "active").length;
  const kritikOlay = Alerts.forOwner(user.id).filter((a) => a.severity === "critical" && a.status !== "cozuldu" && a.status !== "yoksayildi").length;

  const ekstra = { anomaliSayi: anomaliler.length, korelasyonSayi: korelasyonlar.length, aktifKampanya, kritikOlay, korumaSkoru: ozet.skor };

  // Üç dönem için de brifing üret (istemci sekmelerle geçer).
  const brifingler = {
    "24s": brifingHazirla("24s", events, simdi, ekstra),
    "7g": brifingHazirla("7g", events, simdi, ekstra),
    "30g": brifingHazirla("30g", events, simdi, ekstra),
  };

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.briefing", dil) }]} baslik={ceviri("nav.briefing", dil)} />
      <TehditBrifingIstemci brifingler={brifingler} uretildi={new Date(simdi).toLocaleString("tr-TR")} dil={dil} />
    </>
  );
}
