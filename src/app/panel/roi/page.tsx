import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events, Usage } from "@/lib/db/db";
import { planTanim } from "@/lib/specter/plans";
import { roiHesap, fiyatTl } from "@/lib/specter/roi";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { RoiIstemci } from "./RoiIstemci";
import { roiCeviri } from "./roi.i18n";

export const metadata: Metadata = { title: "ROI & Değer — Veylify" };

export default async function RoiPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  // Engellenen/challenge edilen olayların bot sınıfı dağılımı (son 3000 olay).
  const events = Events.forOwner(user.id, 3000);
  const dagilim: Record<string, number> = {};
  for (const e of events) {
    if (e.verdict === "blocked" || e.verdict === "challenged") {
      dagilim[e.botClass] = (dagilim[e.botClass] || 0) + 1;
    }
  }

  // Toplam engellenen (usage'dan — daha geniş, aylık gerçek).
  const usage30 = Usage.forOwner(user.id, 30);
  const usageEngellenen = usage30.reduce((a, u) => a + u.blocked + u.challenged, 0);
  // Olay örneklemi usage'dan azsa, dağılımı usage toplamına ölçekle (temsili).
  const ornekToplam = Object.values(dagilim).reduce((a, b) => a + b, 0);
  if (ornekToplam > 0 && usageEngellenen > ornekToplam) {
    const olcek = usageEngellenen / ornekToplam;
    for (const k of Object.keys(dagilim)) dagilim[k] = Math.round(dagilim[k] * olcek);
  }

  const plan = planTanim(user.plan);
  const specterTl = fiyatTl(plan.fiyat);
  const roi = roiHesap(dagilim, specterTl);

  // 30 günlük önlenen-maliyet trendi (günlük engellenen × ort değer).
  const gunler: string[] = [];
  for (let i = 29; i >= 0; i--) gunler.push(new Date(Date.now() - i * 86400000).toISOString().slice(0, 10));
  const gunMap = new Map<string, number>();
  for (const u of usage30) gunMap.set(u.day, (gunMap.get(u.day) || 0) + u.blocked + u.challenged);
  const trendDeger = gunler.map((g) => Math.round((gunMap.get(g) || 0) * (roi.ortDeger || 0.5)));
  const trendEtiket = gunler.map((g) => g.slice(5));

  return (
    <>
      <PanelUst
        kirintilar={[{ ad: ceviri("nav.roi", dil) }]}
        baslik={roiCeviri("roi.baslik", dil)}
      />
      <RoiIstemci
        roi={roi}
        planAd={plan.ad}
        planFiyat={plan.fiyat}
        trendDeger={trendDeger}
        trendEtiket={trendEtiket}
        dil={dil}
      />
    </>
  );
}
