import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Usage, Events } from "@/lib/db/db";
import { planTanim, kotaDurumu } from "@/lib/specter/plans";
import {
  israfAnaliz,
  verimlilikSkoru,
  kaynakDagilim,
  optimizasyonOnerileri,
  tasarrufProjeksiyon,
  BIRIM_TL,
} from "@/lib/specter/maliyet-optim";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { MaliyetOptimIstemci } from "./MaliyetOptimIstemci";

export const metadata: Metadata = { title: "Maliyet Optimizasyonu — Veylify" };

export default async function MaliyetOptimPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  // Ham veri (import-only): 30g kullanım sayaçları + olay örneklemi.
  const usage30 = Usage.forOwner(user.id, 30);
  const events = Events.forOwner(user.id, 2000);

  const plan = planTanim(user.plan);
  const kullanilan = usage30.reduce((a, u) => a + u.issued, 0);
  const durum = kotaDurumu(kullanilan, user.plan);

  // Türetilmiş FinOps analizleri (hepsi pure/deterministik lib'den).
  const verimlilik = verimlilikSkoru(usage30, events);
  const israf = israfAnaliz(usage30, events);
  const dagilim = kaynakDagilim(usage30, events);
  const oneriler = optimizasyonOnerileri(usage30, events);
  const projeksiyon = tasarrufProjeksiyon(usage30, events);

  // 30g maliyet trendi: günlük (kota + compute) ₺ tahmini.
  const gunSay: Record<string, { issued: number; challenged: number; blocked: number; verified: number }> = {};
  for (const u of usage30) {
    const g = (gunSay[u.day] ??= { issued: 0, challenged: 0, blocked: 0, verified: 0 });
    g.issued += u.issued;
    g.challenged += u.challenged;
    g.blocked += u.blocked;
    g.verified += u.verified;
  }
  const gunler: string[] = [];
  for (let i = 29; i >= 0; i--) gunler.push(new Date(Date.now() - i * 86400000).toISOString().slice(0, 10));
  // Günlük ₺: kota birimi * issued + compute (verdict ağırlıklı) * compute birimi.
  const trendSeri = gunler.map((g) => {
    const d = gunSay[g];
    if (!d) return 0;
    const compute = d.verified * 1 + d.challenged * 6 + d.blocked * 2;
    const tl = d.issued * BIRIM_TL.kotaBirim + compute * BIRIM_TL.computeBirim;
    return Math.round(tl * 100) / 100;
  });
  const trendEtiket = gunler.map((g) => g.slice(5));

  const baslik = ceviri("nav.costoptim", dil);

  return (
    <>
      <PanelUst kirintilar={[{ ad: baslik }]} baslik={baslik} />
      <MaliyetOptimIstemci
        dil={dil}
        planAd={plan.ad}
        kota={durum.kota}
        kullanilan={kullanilan}
        kotaOran={durum.oran}
        verimlilik={verimlilik}
        israf={israf}
        dagilim={dagilim}
        oneriler={oneriler}
        projeksiyon={projeksiyon}
        trendSeri={trendSeri}
        trendEtiket={trendEtiket}
        birimTL={{ kota: BIRIM_TL.kotaBirim, compute: BIRIM_TL.computeBirim }}
      />
    </>
  );
}
