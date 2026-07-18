import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Usage } from "@/lib/db/db";
import { planTanim, PLANLAR, kotaDurumu } from "@/lib/specter/plans";
import { kotaTahmin, kapasitePlani } from "@/lib/specter/kota-tahmin";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { KotaTahminIstemci } from "./KotaTahminIstemci";

export const metadata: Metadata = { title: "Kota Tahmini — Veylify" };

export default async function KotaTahminPage() {
  const user = await currentUser();
  if (!user) return null;

  const dil = await panelDil();
  const plan = planTanim(user.plan);

  /* --- "Bugün" bilgisi SADECE burada okunur (sunucu). Motor saf kalsın diye
     gün/ay-uzunluğu değerleri hesaplanıp tahmin fonksiyonuna PARAMETRE geçilir. --- */
  const simdi = new Date();
  const gunGecti = simdi.getDate();
  const ayToplamGun = new Date(simdi.getFullYear(), simdi.getMonth() + 1, 0).getDate();
  const bugunMs = simdi.getTime();

  // Son 60 günün günlük "issued" (doğrulama) serisini kur — regresyon için
  // bu ayın öncesindeki günler de trend bağlamı verir.
  const gunSayisi = 60;
  const usage = Usage.forOwner(user.id, gunSayisi);
  const gunToplam: Record<string, number> = {};
  for (const u of usage) gunToplam[u.day] = (gunToplam[u.day] || 0) + u.issued;

  const gunler: string[] = [];
  for (let i = gunSayisi - 1; i >= 0; i--) {
    gunler.push(new Date(bugunMs - i * 86400000).toISOString().slice(0, 10));
  }
  const tumSeri = gunler.map((g) => gunToplam[g] || 0);

  // Bu ayın günlük serisi (son gunGecti gün) — grafik + mevcut kullanım için.
  const buAySeri = tumSeri.slice(-gunGecti);
  const buAyGunler = gunler.slice(-gunGecti);
  const etiketler = buAyGunler.map((g) => g.slice(5));

  const kota = plan.dogrulamaKotasi;
  const tahmin = kotaTahmin(buAySeri, gunGecti, ayToplamGun, kota);

  const durum = kotaDurumu(tahmin.mevcutKullanim, user.plan);
  const kapasite = kapasitePlani(tahmin, Object.values(PLANLAR), user.plan);

  /* --- Projeksiyon serisi (grafik için): geçmiş gerçek + ileriye seçilen
     yöntemin günlük hızıyla uzatılmış tahmin çizgisi. İki seri:
       [0] gerçek (bu aya kadar; kalan günler null yerine son değerde sabit)
       [1] projeksiyon (bugüne kadar boş, sonra tahmini birikimli değil GÜNLÜK) --- */
  const secHiz = tahmin.secilen.gunlukHiz;
  /* İki tam-uzunluklu seri (aynı x ekseni, hizalı):
       gercekSeri     → geçmiş günlerde gerçek kullanım, gelecekte son gerçek
                        değerde SABİT tutulur (çizgi düz uzasın, yanıltmasın).
       projeksiyonSeri → geçmişte gerçek değerlerle ÖRTÜŞÜR (görsel süreklilik),
                        gelecekte seçilen yöntemin günlük tahmin hızını çizer.
     TrendGrafik sonlu-olmayan değerleri filtreleyip hizayı bozacağından NaN/null
     KULLANILMAZ; her iki seri de baştan sona gerçek sayı taşır. */
  const gercekGunluk: number[] = [...buAySeri];
  const projeksiyonGunluk: number[] = [...buAySeri];
  const tumEtiket: string[] = [...etiketler];
  const sonGercek = buAySeri.length > 0 ? buAySeri[buAySeri.length - 1] : 0;
  // Projeksiyon, "bugün" noktasında SON GERÇEK değerden başlar ve birkaç günde
  // seçilen tahmin hızına YUMUŞAK geçer (sınırda dikey sıçramayı önler). Böylece
  // çizgi kesintisiz görünür — gerçek→tahmin köprüsü doğal olur.
  const gelecekGun = ayToplamGun - gunGecti;
  const rampGun = Math.max(1, Math.min(3, gelecekGun)); // ilk ~3 günde harmanla
  for (let i = 1; i <= gelecekGun; i++) {
    const gun = gunGecti + i;
    gercekGunluk.push(sonGercek); // gerçek çizgi son bilinen değerde düz uzar
    // İlk rampGun boyunca sonGercek→secHiz lineer harmanla, sonra düz secHiz.
    const t = Math.min(1, i / rampGun);
    projeksiyonGunluk.push(Math.round(sonGercek + (secHiz - sonGercek) * t));
    const tarih = new Date(simdi.getFullYear(), simdi.getMonth(), gun);
    tumEtiket.push(tarih.toISOString().slice(5, 10));
  }
  const gercekSeri = gercekGunluk;
  const projSeri = projeksiyonGunluk;

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.forecast", dil) }]} baslik={ceviri("nav.forecast", dil)} />
      <KotaTahminIstemci
        dil={dil}
        planAd={plan.ad}
        kota={kota}
        gunGecti={gunGecti}
        ayToplamGun={ayToplamGun}
        mevcutKullanim={tahmin.mevcutKullanim}
        gunlukOrtalama={tahmin.gunlukOrtalama}
        oran={durum.oran}
        trendYonu={tahmin.trendYonu}
        egim={tahmin.egim}
        yontemler={tahmin.yontemler}
        secilenAnahtar={tahmin.secilen.anahtar}
        guvenAraligi={tahmin.guvenAraligi}
        tukenecek={tahmin.tukenecek}
        tukenisGunu={tahmin.tukenisGunu}
        gercekSeri={gercekSeri}
        projeksiyonSeri={projSeri}
        etiketler={tumEtiket}
        kapasite={kapasite}
      />
    </>
  );
}
