import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Usage } from "@/lib/db/db";
import { planTanim, PLANLAR, kotaDurumu } from "@/lib/specter/plans";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { MaliyetIstemci } from "./MaliyetIstemci";
import { maliyetCeviri } from "./maliyet.i18n";

export const metadata: Metadata = { title: "Maliyet & Fatura — Veylify" };

export default async function MaliyetPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  const plan = planTanim(user.plan);
  const usage30 = Usage.forOwner(user.id, 30);
  const kullanilan = usage30.reduce((a, u) => a + u.issued, 0);
  const durum = kotaDurumu(kullanilan, user.plan);

  // Günlük kullanım serisi (30 gün) + ay-sonu öngörü.
  const gunSay: Record<string, number> = {};
  for (const u of usage30) gunSay[u.day] = (gunSay[u.day] || 0) + u.issued;
  const gunler: string[] = [];
  for (let i = 29; i >= 0; i--) gunler.push(new Date(Date.now() - i * 86400000).toISOString().slice(0, 10));
  const seri = gunler.map((g) => gunSay[g] || 0);
  const etiket = gunler.map((g) => g.slice(5));

  // Ay-sonu öngörü: ayın geçen günü ortalamasından tam ay tahmini.
  const simdi = new Date();
  const ayGun = simdi.getDate();
  const ayToplamGun = new Date(simdi.getFullYear(), simdi.getMonth() + 1, 0).getDate();
  const ayKullanim = seri.slice(-ayGun).reduce((a, b) => a + b, 0);
  const gunlukOrt = ayGun > 0 ? ayKullanim / ayGun : 0;
  const aySonuTahmin = Math.round(gunlukOrt * ayToplamGun);

  // Fiyat modeli (temsili): overage birim maliyeti.
  const overageBirim = user.plan === "pro" ? 0.002 : user.plan === "scale" ? 0.001 : 0; // TL/doğrulama
  const tahminAsim = Math.max(0, aySonuTahmin - durum.kota);
  const tahminEkUcret = Math.round(tahminAsim * overageBirim);

  // Plan karşılaştırma (optimizasyon önerisi).
  const planlar = Object.values(PLANLAR).map((p) => ({
    key: p.key, ad: p.ad, fiyat: p.fiyat, kota: p.dogrulamaKotasi,
    yeterli: aySonuTahmin <= p.dogrulamaKotasi,
    mevcut: p.key === user.plan,
  }));

  const baslik = maliyetCeviri("ma.baslik", dil);

  return (
    <>
      <PanelUst kirintilar={[{ ad: baslik }]} baslik={baslik} />
      <MaliyetIstemci
        dil={dil}
        planKey={plan.key}
        kota={durum.kota}
        kullanilan={kullanilan}
        oran={durum.oran}
        seri={seri}
        etiket={etiket}
        aySonuTahmin={aySonuTahmin}
        tahminAsim={tahminAsim}
        tahminEkUcret={tahminEkUcret}
        gunlukOrt={Math.round(gunlukOrt)}
        planlar={planlar}
      />
    </>
  );
}
