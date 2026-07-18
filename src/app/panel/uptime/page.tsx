import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { UptimeIstemci } from "./UptimeIstemci";
import {
  SERVISLER,
  OLAYLAR,
  BOLGE_SAGLIK,
  uptimeSerit,
  seritUptime,
  gecikmeTrend,
} from "./servisler";
import {
  slaHesap,
  yuzdelikOzet,
  histogram,
  butceYakma,
  kademeBul,
  SLA_KADEMELERI,
  type KontrolDurum,
} from "@/lib/specter/sla";

export const metadata: Metadata = { title: "Uptime & SLA İzleme — Veylify" };

const GUN = 86400000;

/**
 * Bir servisin 90 günlük şeridini gün-etki dakikalarına çevirir. Şerit "gün"
 * ağırlıklı; incident süreleri (gerçek dakika) OLAYLAR'dan gelir. Burada
 * şeritten TÜRETİLEN dakika, hata bütçesi trendini deterministik beslemek
 * için kullanılır: her degraded gün ~7 dk, her down gün ~22 dk kesinti sayılır
 * (BetterUptime tarzı sentetik ama sabit türetme).
 */
function seritKesintiDk(durum: KontrolDurum): number {
  if (durum === "down") return 22;
  if (durum === "degraded") return 7;
  return 0;
}

export default async function UptimePage() {
  const user = await currentUser();
  if (!user) return null;

  const dil = await panelDil();
  const now = Date.now();

  // ----- GERÇEK gecikme örnekleri (BotEvent.latency) -----
  // Verify/Challenge akışının ölçülen yanıt süreleri; SLA yüzdeliklerini
  // sentetik değil gerçek trafikten türetmek için kullanılır.
  const olaylar = Events.forOwner(user.id, 2000);
  const gercekGecikmeler = olaylar
    .map((e) => e.latency)
    .filter((l) => typeof l === "number" && Number.isFinite(l) && l >= 0);
  // Gerçek örnek yeterliyse ondan, yoksa katalog p50/p95/p99'dan türetilmiş
  // temsili bir dağılımdan yüzdelik hesapla (panel her koşulda dolu görünür).
  const gecikmeKaynak =
    gercekGecikmeler.length >= 20
      ? gercekGecikmeler
      : SERVISLER.flatMap((s) => [
          s.p50,
          s.p50,
          s.p50,
          s.p95,
          s.p99,
          s.gecikme,
          s.gecikme,
        ]);
  const genelYuzdelik = yuzdelikOzet(gecikmeKaynak);
  const gecikmeDagilim = histogram(gecikmeKaynak, [30, 60, 100, 200, 400]);
  const gercekOrnekVar = gercekGecikmeler.length >= 20;

  // ----- Her servis için 90 günlük şerit + gerçekleşen uptime + gecikme trendi -----
  const servisler = SERVISLER.map((s) => {
    const serit = uptimeSerit(s.tohum);
    const gunler = serit.map((durum, i) => ({
      durum,
      // 89 gün önce → bugün. ts, tooltip tarihi için.
      ts: now - (89 - i) * GUN,
    }));
    // Servis-bazlı gecikme yüzdelikleri: katalog + trend24 örneklerinden.
    const trend24 = gecikmeTrend(s.tohum, s.p50, 24);
    const servisOrnek = [...trend24.p50, ...trend24.p95, ...trend24.p99];
    const yuzdelik = yuzdelikOzet(servisOrnek);
    return {
      ...s,
      serit: gunler,
      gerceklesen90: seritUptime(serit),
      trend24,
      trend7g: gecikmeTrend(s.tohum + 7, s.p50, 7),
      yuzdelik: { p50: yuzdelik.p50, p95: yuzdelik.p95, p99: yuzdelik.p99 },
    };
  });

  // ----- Üst özet -----
  const genelUptime =
    servisler.reduce((a, s) => a + s.gerceklesen90, 0) / (servisler.length || 1);
  const operasyonelSayi = servisler.filter((s) => s.durum === "operasyonel").length;
  const toplamServis = servisler.length;
  const ortGecikme = Math.round(
    servisler.reduce((a, s) => a + s.gecikme, 0) / (servisler.length || 1),
  );
  const olay90 = OLAYLAR.length;
  const dejenereSayi = servisler.filter((s) => s.durum === "dejenere").length;
  const kesintiSayi = servisler.filter((s) => s.durum === "kesinti").length;

  // ----- SLA / hata bütçesi (sla.ts çekirdeği) -----
  // Platform hedefi %99.9 aylık. slaHesap gerçekleşen uptime'dan bütçe türetir.
  const slaHedef = 99.9;
  const otuzGunOnce = now - 30 * GUN;
  const buAyOlaylar = OLAYLAR.filter((o) => {
    const t = Date.parse(o.baslangic.replace(" ", "T"));
    return Number.isFinite(t) && t >= otuzGunOnce;
  });
  // Bakım salt-okunur moddu → hata bütçesine sayılmaz. Kısmi kesinti %ağırlıklı.
  const tuketilenKesintiDk = buAyOlaylar.reduce((a, o) => {
    if (o.etki === "bakim") return a;
    return a + (o.etki === "tam" ? o.sureDk : o.sureDk * 0.15);
  }, 0);
  // İncident'lardan gerçekleşen aylık uptime'ı türet → slaHesap ile uyum.
  const aylikDk = 30 * 24 * 60;
  const gerceklesenAylikUptime = 100 - (tuketilenKesintiDk / aylikDk) * 100;
  const sla = slaHesap(gerceklesenAylikUptime, slaHedef, "aylik");
  const kademe = kademeBul(slaHedef);

  // ----- Hata bütçesi yakma trendi (30 gün, kümülatif kesinti) -----
  // Her gün için o güne kadar birikmiş şerit-türevi kesinti dakikaları.
  // Tüm servislerin şeritlerinin ortalama günlük kesintisini topla.
  const gunlukKesinti: number[] = Array.from({ length: 30 }, (_, gi) => {
    // Şeridin son 30 gününü al (60..89 indeks). Her serviste o gün kesinti.
    const seritIdx = 60 + gi;
    let toplam = 0;
    for (const s of servisler) {
      toplam += seritKesintiDk(s.serit[seritIdx].durum);
    }
    return toplam / servisler.length; // servis-ortalaması
  });
  const kumulatif: number[] = [];
  gunlukKesinti.reduce((acc, v, i) => {
    kumulatif[i] = acc + v;
    return kumulatif[i];
  }, 0);
  const yakmaSerisi = butceYakma(kumulatif, sla.izinliKesintiDk);

  // ----- Olay geçmişi zenginleştirme: her olaya SLA-etkisi (dk → % bütçe) -----
  const olaylarZengin = OLAYLAR.map((o) => {
    const etkiDk = o.etki === "bakim" ? 0 : o.etki === "tam" ? o.sureDk : o.sureDk * 0.15;
    return {
      ...o,
      etkiDk: Math.round(etkiDk * 10) / 10,
      // Bu olayın aylık bütçenin ne kadarını yediği (%).
      butceYuzde:
        sla.izinliKesintiDk > 0
          ? Math.round((etkiDk / sla.izinliKesintiDk) * 1000) / 10
          : 0,
    };
  });

  return (
    <>
      <PanelUst
        kirintilar={[{ ad: ceviri("nav.uptime", dil), href: "/panel/uptime" }]}
        baslik={ceviri("nav.uptime", dil)}
      />
      <UptimeIstemci
        dil={dil}
        ozet={{
          genelUptime,
          operasyonelSayi,
          toplamServis,
          ortGecikme,
          olay90,
          dejenereSayi,
          kesintiSayi,
        }}
        servisler={servisler}
        olaylar={olaylarZengin}
        bolgeSaglik={BOLGE_SAGLIK}
        sla={{
          hedef: slaHedef,
          gerceklesen: genelUptime,
          gerceklesenAylik: Math.round(gerceklesenAylikUptime * 10000) / 10000,
          durum: sla.durum,
          karsilandi: sla.karsilandi,
          izinliKesintiDk: sla.izinliKesintiDk,
          tuketilenKesintiDk: sla.tuketilenDk,
          kalanKesintiDk: sla.kalanDk,
          kullanimYuzde: Number.isFinite(sla.kullanimYuzde) ? sla.kullanimYuzde : 100,
          kalanYuzde: sla.kalanYuzde,
          kademeEtiket: kademe.etiket,
          yillikDkIzin: kademe.yillikDkIzin,
        }}
        kademeler={SLA_KADEMELERI}
        yuzdelik={{
          p50: genelYuzdelik.p50,
          p95: genelYuzdelik.p95,
          p99: genelYuzdelik.p99,
          ort: genelYuzdelik.ort,
          n: genelYuzdelik.n,
          min: genelYuzdelik.min,
          max: genelYuzdelik.max,
          gercek: gercekOrnekVar,
        }}
        gecikmeDagilim={gecikmeDagilim.map((k) => ({ etiket: k.etiket, adet: k.adet }))}
        butceYakma={yakmaSerisi}
      />
    </>
  );
}
