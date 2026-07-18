import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Usage, Sites } from "@/lib/db/db";
import { planTanim, kotaDurumu, PLANLAR } from "@/lib/specter/plans";
import {
  HIZ_LIMIT_KADEMELERI,
  kademeOner,
  kotaAsimSenaryo,
} from "@/lib/specter/rate-politika";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { RatePolitikaIstemci } from "./RatePolitikaIstemci";

export const metadata: Metadata = { title: "Hız & Kota Politikası — Veylify" };

export default async function RatePolitikaPage() {
  const user = await currentUser();
  if (!user) return null;

  const dil = await panelDil();

  // --- Kullanım verisi (son 30 gün) ---
  const usage = Usage.forOwner(user.id, 30);
  const toplamIssued = usage.reduce((a, u) => a + u.issued, 0);
  const durum = kotaDurumu(toplamIssued, user.plan);
  const plan = planTanim(user.plan);

  // --- Günlük kullanım serisi (son 14 gün) + kota çizgisi ---
  const gunKey = (ts: number) => new Date(ts).toISOString().slice(0, 10);
  const gunToplam: Record<string, number> = {};
  for (const u of usage) gunToplam[u.day] = (gunToplam[u.day] || 0) + u.issued;
  const gunler: string[] = [];
  for (let i = 13; i >= 0; i--) gunler.push(gunKey(Date.now() - i * 86400000));
  const gunlukSeri = gunler.map((g) => gunToplam[g] || 0);
  const gunEtiket = gunler.map((g) => g.slice(5));

  // Günlük ortalama (yalnızca veri olan günlerden; yoksa 30 güne böl).
  const veriliGun = gunlukSeri.filter((v) => v > 0).length;
  const gunlukOrt = veriliGun > 0 ? Math.round(toplamIssued / veriliGun) : Math.round(toplamIssued / 30);

  // Günlük kota tavanı (aylık kotayı 30'a böl) — grafikte referans çizgi olarak.
  const gunlukKotaTavan = Math.round(plan.dogrulamaKotasi / 30);

  // --- Gözlemlenen tepe RPS ---
  // En yoğun günün issued'ını al, o günün eşit dağıldığını varsayarak saniyeye
  // indir (86400 sn). Ama kısa süreli patlamalar bu ortalamanın çok üstünde
  // olabildiği için ~12x patlama faktörü uygulanır (gerçekçi zirve tahmini).
  const tepeGunIssued = gunlukSeri.length ? Math.max(...gunlukSeri) : 0;
  const ortRps = tepeGunIssued / 86400;
  const gozlemlenenTepeRps = Math.round(ortRps * 12 * 100) / 100; // patlama faktörü
  const oneri = kademeOner(gozlemlenenTepeRps);

  // --- Kota aşım senaryosu (mevcut plan) ---
  const senaryo = kotaAsimSenaryo(
    toplamIssued,
    plan.dogrulamaKotasi,
    gunlukOrt,
    durum.asimDavranisi,
  );

  // --- Plan overage karşılaştırması ---
  const planKarsilastirma = (Object.values(PLANLAR)).map((p) => ({
    key: p.key,
    ad: p.ad,
    fiyat: p.fiyat,
    kota: p.dogrulamaKotasi,
    asimDavranisi: p.asimDavranisi,
    mevcut: p.key === user.plan,
  }));

  // --- Site sayısı (özel limit ipucu için) ---
  const siteler = Sites.forOwner(user.id);

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.ratelimit", dil) }]} baslik={ceviri("nav.ratelimit", dil)} />
      <RatePolitikaIstemci
        dil={dil}
        kademeler={HIZ_LIMIT_KADEMELERI}
        oneriKey={oneri.oneriKey}
        oneriGerekce={oneri.gerekce}
        gozlemlenenTepeRps={gozlemlenenTepeRps}
        kota={{
          planAd: plan.ad,
          planFiyat: plan.fiyat,
          kota: durum.kota,
          kullanilan: durum.kullanilan,
          oran: durum.oran,
          kalan: durum.kalan,
          asildi: durum.asildi,
          uyari: durum.uyari,
          asimDavranisi: durum.asimDavranisi,
        }}
        senaryo={{
          tukenisGun: senaryo.tukenisGun,
          asimMiktar: senaryo.asimMiktar,
          asimDavranisiAciklama: senaryo.asimDavranisiAciklama,
          tahminEkMaliyet: senaryo.tahminEkMaliyet,
          gunlukOrt,
        }}
        planKarsilastirma={planKarsilastirma}
        grafik={{
          gunlukSeri,
          gunEtiket,
          gunlukKotaTavan,
        }}
        siteSayisi={siteler.length}
      />
    </>
  );
}
