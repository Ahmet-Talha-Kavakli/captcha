import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { IpRep } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { IpDetayIstemci } from "./IpDetayIstemci";

export const metadata: Metadata = { title: "IP İncelemesi — Veylify" };

const GUN = 86400000;

export default async function IpDetayPage({ params }: { params: Promise<{ ip: string }> }) {
  const { ip: raw } = await params;
  const ip = decodeURIComponent(raw);
  const user = await currentUser();
  if (!user) return null;

  const rep = IpRep.byIp(ip);
  // Adli inceleme: bu IP'nin sahibin tüm sitelerindeki olayları (yüksek limit
  // ki yoğun saldırganın tüm geçmişi çıksın).
  const events = IpRep.eventsForIp(user.id, ip, 800);
  if (!rep && events.length === 0) notFound();

  // -------- Türetilmiş metrikler (hepsi gerçek olaylardan) --------
  const now = Date.now();
  const pathMap = new Map<string, number>();
  const hourMap = new Array(24).fill(0) as number[];
  const verdictMap = new Map<string, number>();
  const botMap = new Map<string, number>();
  const asnSet = new Set<string>();
  const ulkeSet = new Set<string>();
  let toplamLatency = 0;

  // Son 14 günün günlük istek trendi.
  const GUN_SAYI = 14;
  const gunlukSayac = new Array(GUN_SAYI).fill(0) as number[];
  const gunEtiket: string[] = [];
  const bugunBaslangic = new Date(now);
  bugunBaslangic.setHours(0, 0, 0, 0);
  const bugun0 = bugunBaslangic.getTime();
  for (let i = 0; i < GUN_SAYI; i++) {
    const d = new Date(bugun0 - (GUN_SAYI - 1 - i) * GUN);
    gunEtiket.push(d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" }));
  }

  let engellenen = 0;
  let dogrulama = 0;
  let izin = 0;
  for (const e of events) {
    pathMap.set(e.path, (pathMap.get(e.path) || 0) + 1);
    hourMap[new Date(e.ts).getHours()]++;
    verdictMap.set(e.verdict, (verdictMap.get(e.verdict) || 0) + 1);
    botMap.set(e.botClass, (botMap.get(e.botClass) || 0) + 1);
    asnSet.add(e.asn);
    ulkeSet.add(e.country);
    toplamLatency += e.latency ?? 0;
    if (e.verdict === "blocked") engellenen++;
    else if (e.verdict === "challenged" || e.verdict === "flagged") dogrulama++;
    else if (e.verdict === "allowed") izin++;

    const gunIdx = Math.floor((e.ts - bugun0) / GUN) + (GUN_SAYI - 1);
    if (gunIdx >= 0 && gunIdx < GUN_SAYI) gunlukSayac[gunIdx]++;
  }

  const toplamIstek = rep?.requests ?? events.length;
  const enSonBotClass = events[0]?.botClass ?? [...botMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "automation";
  const ortLatency = events.length ? Math.round(toplamLatency / events.length) : 0;

  return (
    <>
      <PanelUst kirintilar={[{ ad: "Tehdit İstihbaratı", href: "/panel/tehdit" }, { ad: ip }]} baslik={ip} />
      <IpDetayIstemci
        ip={ip}
        rep={
          rep
            ? {
                country: rep.country,
                asn: rep.asn,
                threatScore: rep.threatScore,
                category: rep.category,
                requests: rep.requests,
                blocked: rep.blocked,
                firstSeen: rep.firstSeen,
                lastSeen: rep.lastSeen,
              }
            : null
        }
        ozet={{
          toplamIstek,
          engellenen: rep?.blocked ?? engellenen,
          dogrulama,
          izin,
          ortLatency,
          asnSayi: asnSet.size,
          ulkeSayi: ulkeSet.size,
          botClass: enSonBotClass,
          firstSeen: rep?.firstSeen ?? (events.length ? events[events.length - 1].ts : now),
          lastSeen: rep?.lastSeen ?? (events.length ? events[0].ts : now),
        }}
        events={events
          .slice(0, 300)
          .map((e) => ({ id: e.id, ts: e.ts, path: e.path, botClass: e.botClass, verdict: e.verdict, score: e.score, ua: e.ua, latency: e.latency ?? 0, triggeredRules: e.triggeredRules, siteId: e.siteId }))}
        yollar={[...pathMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)}
        saatler={hourMap}
        kararlar={[...verdictMap.entries()]}
        botlar={[...botMap.entries()].sort((a, b) => b[1] - a[1])}
        gunlukTrend={gunlukSayac}
        gunEtiketleri={gunEtiket}
      />
    </>
  );
}
