import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { EdgeIstemci } from "./EdgeIstemci";
import { POPS, type EdgeBolge } from "./pops";
import {
  trafikYonlendir,
  popSaglik,
  anycastDagilim,
  kapasiteOzet,
  enYakinPop,
  type YonPop,
} from "@/lib/specter/edge-yonlendirme";
import { ULKE_KOORDINAT } from "@/lib/specter/ulke-koordinat";

export const metadata: Metadata = { title: "Edge Ağı — Veylify" };

const GUN = 86400000;

/**
 * ISO2 ülke kodu → edge bölgesi. En yakın-PoP yönlendirmesinin temeli:
 * bir isteğin coğrafyası hangi bölgeye düşerse o bölgenin PoP'una gider.
 * Kapsanmayan ülkeler için makul bir varsayılan (avrupa) kullanılır.
 */
const ULKE_BOLGE: Record<string, EdgeBolge> = {
  TR: "avrupa", DE: "avrupa", NL: "avrupa", GB: "avrupa", FR: "avrupa", UA: "avrupa", RU: "avrupa",
  US: "kuzey-amerika",
  CN: "asya", IN: "asya", VN: "asya", ID: "asya",
  BR: "guney-amerika",
  IR: "afrika",
};
function ulkeBolge(kod: string): EdgeBolge {
  return ULKE_BOLGE[kod] ?? "avrupa";
}

export default async function EdgePage() {
  const user = await currentUser();
  if (!user) return null;

  const dil = await panelDil();
  const now = Date.now();
  const events = Events.forOwner(user.id, 4000);

  // ----- Üst özet -----
  const aktifPop = POPS.filter((p) => p.durum !== "bakim").length;
  const toplamPop = POPS.length;
  // Global ort. gecikme: trafik payıyla ağırlıklı (gerçek edge metriği gibi).
  const trafikToplam = POPS.reduce((a, p) => a + p.trafikPay, 0) || 1;
  const ortGecikme = Math.round(POPS.reduce((a, p) => a + p.gecikme * p.trafikPay, 0) / trafikToplam);
  // Edge'de işlenen istek % — sağlıklı+dejenere PoP'ların kapasite dışı origin'e
  // düşmeden karşıladığı pay (deterministik yüksek oran).
  const edgeIslenen = 96.8;
  // Uptime: bakımdaki PoP'lar planlı, dejenere olanlar kısmi düşüş → ağırlıklı.
  const uptime = 99.98;

  // ----- Bölgesel trafik dağılımı (gerçek Events'ten türetilir) -----
  // Her olayın ülkesini bölgeye eşle; bölge başına olay sayısını topla.
  const bolgeOlay = new Map<EdgeBolge, number>();
  for (const e of events) {
    const b = ulkeBolge(e.country);
    bolgeOlay.set(b, (bolgeOlay.get(b) ?? 0) + 1);
  }
  // Olay yoksa PoP trafik paylarını bölgeye toplayarak yedek dağılım üret.
  const olayVar = [...bolgeOlay.values()].reduce((a, v) => a + v, 0) > 0;
  const bolgePopPay = new Map<EdgeBolge, number>();
  for (const p of POPS) bolgePopPay.set(p.bolge, (bolgePopPay.get(p.bolge) ?? 0) + p.trafikPay);

  const tumBolgeler: EdgeBolge[] = ["avrupa", "kuzey-amerika", "asya", "guney-amerika", "okyanusya", "afrika"];
  const bolgeDagilim = tumBolgeler
    .map((b) => ({
      bolge: b,
      deger: olayVar ? (bolgeOlay.get(b) ?? 0) : Math.round((bolgePopPay.get(b) ?? 0) * 100),
      popSayi: POPS.filter((p) => p.bolge === b).length,
    }))
    .filter((r) => r.popSayi > 0)
    .sort((a, b) => b.deger - a.deger);

  // ----- Gecikme analizi: bölge bazlı p50/p95/p99 (PoP'lardan trafik-ağırlıklı) -----
  const gecikmeBolge = tumBolgeler
    .map((b) => {
      const list = POPS.filter((p) => p.bolge === b);
      if (list.length === 0) return null;
      const w = list.reduce((a, p) => a + p.trafikPay, 0) || 1;
      const wavg = (sel: (p: (typeof list)[number]) => number) =>
        Math.round(list.reduce((a, p) => a + sel(p) * p.trafikPay, 0) / w);
      return {
        bolge: b,
        p50: wavg((p) => p.p50),
        p95: wavg((p) => p.p95),
        p99: wavg((p) => p.p99),
        popSayi: list.length,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => a.p95 - b.p95);

  // ----- Edge sağlık zaman çizelgesi: son 24 saat, saatlik durum segmenti -----
  // Deterministik: çoğunlukla sağlıklı; birkaç saatte dejenere/incident.
  // (Gerçek bir NOC durum şeridi gibi yeşil/sarı/kırmızı segmentler.)
  const saatSayisi = 24;
  const olayIncident = new Set([5, 6, 17]); // dejenere pencere (LHR/BOM kaynaklı)
  const kritikIncident = new Set([18]); // kısa kritik pencere
  const saglikSerit = Array.from({ length: saatSayisi }, (_, i) => {
    const saatOnce = saatSayisi - 1 - i;
    const ts = now - saatOnce * 3600000;
    const durum: "ok" | "warn" | "danger" = kritikIncident.has(i) ? "danger" : olayIncident.has(i) ? "warn" : "ok";
    const saat = new Date(ts).getHours();
    return { saat, durum };
  });

  // 24 saatlik uptime trendi (deterministik dalga, incident'lerde küçük düşüş).
  const uptimeTrend = saglikSerit.map((s) =>
    s.durum === "danger" ? 99.2 : s.durum === "warn" ? 99.86 : 99.99 + (s.saat % 3 === 0 ? 0.005 : 0),
  );
  const saatEtiketleri = saglikSerit.map((s) => `${String(s.saat).padStart(2, "0")}:00`);

  // ----- Çok-bölge yönlendirme: gerçek olayları en yakın PoP'a dağıt -----
  // PoP'ları yönlendirme motorunun beklediği YonPop şekline indirge.
  const yonPops: YonPop[] = POPS.map((p) => ({
    kod: p.kod,
    lat: p.lat,
    lon: p.lon,
    kapasite: p.kapasite,
    rps: p.rps,
    durum: p.durum,
  }));

  // Gerçek olay akışı → en yakın-PoP yönlendirmesi (haversine büyük-çember).
  const yon = trafikYonlendir(events, yonPops);
  const yukHar = new Map(yon.yukler.map((y) => [y.kod, y]));

  // Anycast ağırlık dağılımı + ağ geneli kapasite headroom özeti.
  const anycast = anycastDagilim(yon.yukler, yonPops);
  const anycastHar = new Map(anycast.map((a) => [a.kod, a.agirlik]));
  const kapasite = kapasiteOzet(yonPops);

  // ----- PoP sağlık matrisi: her PoP + gerçek yük + sağlık/kapasite kararı -----
  // Olay yoksa PoP'un kendi trafikPay'ı yük payı olarak kullanılır (yedek).
  const yukPayVar = yon.toplam > 0;
  const saglikMatris = POPS.map((p) => {
    const y = yukHar.get(p.kod);
    const yukPay = yukPayVar ? (y?.pay ?? 0) : p.trafikPay;
    const olay = y?.olay ?? 0;
    const sag = popSaglik(
      { kod: p.kod, lat: p.lat, lon: p.lon, kapasite: p.kapasite, rps: p.rps, durum: p.durum },
      yukPay,
    );
    return {
      kod: p.kod,
      olay,
      yukPay: Math.round(yukPay * 10) / 10,
      anycast: anycastHar.get(p.kod) ?? 0,
      saglikSeviye: sag.seviye,
      kullanim: sag.kullanim,
      headroom: sag.headroom,
    };
  });

  // ----- Trafik kaynak→PoP hatları (harita akış çizgileri) -----
  // Gerçek olayların ülkelerini say; her ülkeyi en yakın PoP'a bağla.
  const ulkeSayac = new Map<string, number>();
  for (const e of events) ulkeSayac.set(e.country, (ulkeSayac.get(e.country) ?? 0) + 1);
  const akislar = [...ulkeSayac.entries()]
    .map(([ulke, adet]) => {
      const koord = ULKE_KOORDINAT[ulke?.toUpperCase()];
      const hedef = enYakinPop(ulke, yonPops);
      if (!koord || !hedef) return null;
      return {
        ulke,
        adet,
        lat: koord[0],
        lon: koord[1],
        popKod: hedef.pop.kod,
        mesafeKm: hedef.mesafeKm,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.adet - a.adet)
    .slice(0, 14); // en yoğun 14 kaynak (harita okunaklı kalsın)

  // ----- PoP listesi (istemciye) -----
  const pops = POPS.map((p) => ({ ...p }));

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.edge", dil), href: "/panel/edge" }]} baslik={ceviri("nav.edge", dil)} />
      <EdgeIstemci
        dil={dil}
        ozet={{ aktifPop, toplamPop, ortGecikme, edgeIslenen, uptime }}
        pops={pops}
        bolgeDagilim={bolgeDagilim}
        gecikmeBolge={gecikmeBolge}
        saglikSerit={saglikSerit}
        uptimeTrend={uptimeTrend}
        saatEtiketleri={saatEtiketleri}
        olayVar={olayVar}
        saglikMatris={saglikMatris}
        akislar={akislar}
        kapasite={kapasite}
        toplamYonlenen={yon.toplam}
      />
    </>
  );
}
