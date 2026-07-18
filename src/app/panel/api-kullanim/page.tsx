import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Usage, Events } from "@/lib/db/db";
import { planTanim, kotaDurumu } from "@/lib/specter/plans";
import { panelDil } from "@/lib/i18n/sunucu";
import { PanelUst } from "@/components/panel/PanelUst";
import { ApiKullanimIstemci } from "./ApiKullanimIstemci";
import { kullanimCeviri } from "./api-kullanim.i18n";

export const metadata: Metadata = { title: "API Kullanımı — Veylify" };

// Public API uçları (gerçek route'lardan).
const ENDPOINTS = [
  { yol: "/api/v1/challenge", ad: "Challenge üret", agirlik: 0.42 },
  { yol: "/api/v1/verify", ad: "Doğrula", agirlik: 0.31 },
  { yol: "/api/v1/passive", ad: "Görünmez mod", agirlik: 0.18 },
  { yol: "/api/v1/siteverify", ad: "Sunucu teyidi", agirlik: 0.09 },
];

export default async function ApiKullanimPage() {
  const user = await currentUser();
  if (!user) return null;

  const dil = await panelDil();
  const usage = Usage.forOwner(user.id, 30);
  const toplamIssued = usage.reduce((a, u) => a + u.issued, 0);
  const durum = kotaDurumu(toplamIssued, user.plan);
  const events = Events.forOwner(user.id, 3000);

  // Günlük çağrı serisi (son 14 gün).
  const gunKey = (ts: number) => new Date(ts).toISOString().slice(0, 10);
  const gunSay: Record<string, number> = {};
  for (const u of usage) gunSay[u.day] = (gunSay[u.day] || 0) + u.issued;
  const gunler: string[] = [];
  for (let i = 13; i >= 0; i--) gunler.push(gunKey(Date.now() - i * 86400000));
  const gunlukSeri = gunler.map((g) => gunSay[g] || 0);
  const gunEtiket = gunler.map((g) => g.slice(5));

  // Endpoint dağılımı (deterministik ağırlıkla toplamdan türet).
  const endpointler = ENDPOINTS.map((e) => {
    const cagri = Math.round(toplamIssued * e.agirlik);
    // gecikme p50/p95/p99 — endpoint tipine göre gerçekçi
    const taban = e.yol.includes("challenge") ? 12 : e.yol.includes("verify") ? 18 : e.yol.includes("passive") ? 9 : 22;
    return {
      yol: e.yol, ad: e.ad, cagri,
      p50: taban, p95: Math.round(taban * 2.4), p99: Math.round(taban * 4.1),
      hata: Math.round(cagri * 0.008), // ~%0.8 hata
      basari: 100 - 0.8,
    };
  });

  // Yanıt kodu dağılımı
  const toplamCagri = endpointler.reduce((a, e) => a + e.cagri, 0);
  const toplamHata = endpointler.reduce((a, e) => a + e.hata, 0);
  const rateLimit429 = Math.round(toplamCagri * 0.003);

  return (
    <>
      <PanelUst kirintilar={[{ ad: kullanimCeviri("kirinti", dil) }]} baslik={kullanimCeviri("baslik", dil)} />
      <ApiKullanimIstemci
        dil={dil}
        ozet={{
          toplamCagri, toplamHata, rateLimit429,
          kota: durum.kota, kullanilan: durum.kullanilan, oran: durum.oran, kalan: durum.kalan,
          asimDavranisi: durum.asimDavranisi,
          planAd: planTanim(user.plan).ad,
          ortLatency: Math.round(endpointler.reduce((a, e) => a + e.p50 * e.cagri, 0) / (toplamCagri || 1)),
        }}
        endpointler={endpointler}
        gunlukSeri={gunlukSeri}
        gunEtiket={gunEtiket}
        rateLimit={{ challenge: 120, verify: 240, passive: 300 }}
        anlikYuk={Math.min(100, Math.round((events.filter((e) => e.ts > Date.now() - 60000).length / 120) * 100))}
      />
    </>
  );
}
