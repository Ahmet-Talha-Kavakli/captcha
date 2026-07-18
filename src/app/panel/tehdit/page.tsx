import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { IpRep, Events, Campaigns } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { ULKE_AD } from "@/lib/flag";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { tehditCeviri } from "./tehdit.i18n";
import { TehditIstemci } from "./TehditIstemci";
import type { IpReputation } from "@/lib/db/schema";

export const metadata: Metadata = { title: "Tehdit İstihbaratı — Veylify" };

const GUN = 86400000;

/** ASN adından ağ kategorisi türet (barındırma sağlayıcı profili). */
function asnKategori(asn: string): "vpn" | "datacenter" | "bulletproof" | "isp" | "temiz" {
  const a = asn.toLowerCase();
  if (a.includes("vpn") || a.includes("m247")) return "vpn";
  if (a.includes("flokinet")) return "bulletproof"; // kurşun-geçirmez barındırma
  if (
    a.includes("amazon") || a.includes("aws") || a.includes("digitalocean") ||
    a.includes("hetzner") || a.includes("ovh") || a.includes("selectel") ||
    a.includes("alibaba") || a.includes("microsoft") || a.includes("google")
  )
    return "datacenter";
  if (a.includes("unicom") || a.includes("telecom") || a.includes("türk") || a.includes("turk")) return "isp";
  return "datacenter";
}

export default async function TehditPage() {
  const user = await currentUser();
  if (!user) return null;

  const dil = await panelDil();
  const now = Date.now();
  const repAll: IpReputation[] = IpRep.forOwner();
  // Trend grafiği 30 günü kapsar. `forOwner`'ın sabit limiti olay hacmi yüksekken
  // en eski günleri keser → grafik başta yanlış "düz/sıfır" görünür. Zaman-pencereli
  // `sonGunler` her günü eksiksiz getirir (limit-kesme bug'ı yok).
  const events = Events.sonGunler(user.id, 30, now);
  const campaigns = Campaigns.forOwner(user.id);

  // ----- IP itibar tablosu (en tehditli üstte) -----
  const ips = [...repAll]
    .sort((a, b) => b.threatScore - a.threatScore)
    .slice(0, 150)
    .map((r) => ({
      id: r.ip,
      ip: r.ip,
      country: r.country,
      asn: r.asn,
      threatScore: r.threatScore,
      category: r.category,
      requests: r.requests,
      blocked: r.blocked,
      lastSeen: r.lastSeen,
    }));

  // ----- Üst özet KPI -----
  const kotuUn = repAll.filter((r) => r.threatScore >= 70).length;
  const engellenen30g = repAll.reduce((a, r) => a + r.blocked, 0);
  const ortSkor = repAll.length ? Math.round(repAll.reduce((a, r) => a + r.threatScore, 0) / repAll.length) : 0;
  const aktifKampanya = campaigns.filter((c) => c.status === "active").length;
  const izlenenSaldiran = repAll.length;

  // Delta: son 7 gün ilk görülen "yeni" tehdit IP'si (itibar akışının ivmesi).
  const yeniIp7g = repAll.filter((r) => now - r.firstSeen <= 7 * GUN).length;
  // Son 24 saatte aktif olan tehdit IP'si (canlılık göstergesi).
  const aktif24s = repAll.filter((r) => now - r.lastSeen <= GUN).length;

  const kpi = {
    izlenenSaldiran,
    kotuUn,
    aktifKampanya,
    engellenen30g,
    ortSkor,
    yeniIp7g,
    aktif24s,
  };

  // ----- GLOBAL TEHDİT HARİTASI: ülke bazlı tehdit yoğunluğu (IpReputation'dan) -----
  // Her ülke için: kaynak IP sayısı, toplam istek, engellenen, ort. tehdit skoru,
  // kötü-ün IP sayısı. Isı = ort. skor + hacim. Gerçek hesaplanır.
  interface UlkeAgg {
    kod: string;
    ipSayi: number;
    istek: number;
    engellenen: number;
    skorTop: number;
    kotuUn: number;
  }
  const ulkeMap = new Map<string, UlkeAgg>();
  for (const r of repAll) {
    const u = ulkeMap.get(r.country) ?? { kod: r.country, ipSayi: 0, istek: 0, engellenen: 0, skorTop: 0, kotuUn: 0 };
    u.ipSayi++;
    u.istek += r.requests;
    u.engellenen += r.blocked;
    u.skorTop += r.threatScore;
    if (r.threatScore >= 70) u.kotuUn++;
    ulkeMap.set(r.country, u);
  }
  const enFazlaEngel = Math.max(1, ...[...ulkeMap.values()].map((u) => u.engellenen));
  const harita = [...ulkeMap.values()]
    .map((u) => {
      const ortSkor = u.ipSayi ? Math.round(u.skorTop / u.ipSayi) : 0;
      // Isı 0..100: tehdit skoru ağırlıklı + hacim katkısı.
      const isi = Math.min(100, Math.round(ortSkor * 0.6 + (u.engellenen / enFazlaEngel) * 40));
      return {
        kod: u.kod,
        ad: ULKE_AD[u.kod] || u.kod,
        ipSayi: u.ipSayi,
        istek: u.istek,
        engellenen: u.engellenen,
        ortSkor,
        kotuUn: u.kotuUn,
        isi,
      };
    })
    .sort((a, b) => b.isi - a.isi || b.engellenen - a.engellenen)
    .slice(0, 15);

  // ----- ASN / AĞ İSTİHBARATI: barındırma sağlayıcı bazlı (IpReputation'dan) -----
  interface AsnAgg {
    asn: string;
    ipSayi: number;
    istek: number;
    engellenen: number;
    skorTop: number;
    ulkeler: Set<string>;
  }
  const asnMap = new Map<string, AsnAgg>();
  for (const r of repAll) {
    const a = asnMap.get(r.asn) ?? { asn: r.asn, ipSayi: 0, istek: 0, engellenen: 0, skorTop: 0, ulkeler: new Set<string>() };
    a.ipSayi++;
    a.istek += r.requests;
    a.engellenen += r.blocked;
    a.skorTop += r.threatScore;
    a.ulkeler.add(r.country);
    asnMap.set(r.asn, a);
  }
  const aglar = [...asnMap.values()]
    .map((a) => {
      const ortSkor = a.ipSayi ? Math.round(a.skorTop / a.ipSayi) : 0;
      // ASN adını sadeleştir ("AS9009 M247 (VPN)" → ad + numara).
      const eslesme = a.asn.match(/^(AS\d+)\s+(.+?)(?:\s*\(.*\))?$/);
      const asNo = eslesme?.[1] ?? a.asn.split(" ")[0];
      const ad = (eslesme?.[2] ?? a.asn).replace(/\s*\(VPN\)\s*/i, "").trim();
      return {
        asn: a.asn,
        asNo,
        ad,
        kategori: asnKategori(a.asn),
        ipSayi: a.ipSayi,
        istek: a.istek,
        engellenen: a.engellenen,
        ulkeSayi: a.ulkeler.size,
        ortSkor,
      };
    })
    .sort((a, b) => b.ortSkor - a.ortSkor || b.engellenen - a.engellenen);

  // ----- Tehdit kategorisi dağılımı (IpReputation.category) -----
  const katMap = new Map<string, number>();
  for (const r of repAll) katMap.set(r.category, (katMap.get(r.category) || 0) + 1);
  const kategoriDagilim = [...katMap.entries()].sort((a, b) => b[1] - a[1]);

  // ----- Bot sınıfı dağılımı + saldırı coğrafyası (engellenen/challenged olaylar) -----
  const botMap = new Map<string, number>();
  const cografyaMap = new Map<string, number>();
  for (const e of events) {
    if (e.verdict === "blocked" || e.verdict === "challenged" || e.verdict === "flagged") {
      botMap.set(e.botClass, (botMap.get(e.botClass) || 0) + 1);
      cografyaMap.set(e.country, (cografyaMap.get(e.country) || 0) + 1);
    }
  }
  const botDagilim = [...botMap.entries()].sort((a, b) => b[1] - a[1]);
  const cografya = [...cografyaMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([kod, deger]) => ({ kod, ad: ULKE_AD[kod] || kod, deger }));

  // ----- Tehdit trendi: son 30 gün günlük tehdit + engellenen istek (olaylardan) -----
  const gunSayisi = 30;
  const tehditGun = new Array(gunSayisi).fill(0);
  const engelGun = new Array(gunSayisi).fill(0);
  const bugun0 = new Date(now); bugun0.setHours(0, 0, 0, 0);
  const bugunTs = bugun0.getTime();
  for (const e of events) {
    const gunFark = Math.floor((bugunTs - e.ts) / GUN);
    if (gunFark < 0 || gunFark >= gunSayisi) continue;
    const idx = gunSayisi - 1 - gunFark;
    // Tehdit = insan/iyi-bot olmayan tüm olaylar; engellenen = blocked kararı.
    if (e.botClass !== "human" && e.botClass !== "good_bot") tehditGun[idx]++;
    if (e.verdict === "blocked") engelGun[idx]++;
  }
  const gunEtiketleri = Array.from({ length: gunSayisi }, (_, i) => {
    const d = new Date(bugunTs - (gunSayisi - 1 - i) * GUN);
    return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
  });

  // ----- Aktif kampanyalar (korelasyon) -----
  const kampanyaListe = campaigns.slice(0, 6).map((c) => ({
    id: c.id,
    name: c.name,
    botClass: c.botClass,
    status: c.status,
    peakRps: c.peakRps,
    totalRequests: c.totalRequests,
    blockedRequests: c.blockedRequests,
    topCountries: c.topCountries,
    topAsns: c.topAsns,
    startedAt: c.startedAt,
  }));

  const baslik = ceviri("nav.threat", dil);

  return (
    <>
      <PanelUst
        kirintilar={[{ ad: baslik, href: "/panel/tehdit" }, { ad: tehditCeviri("th.kirinti", dil) }]}
        baslik={baslik}
      />
      <TehditIstemci
        dil={dil}
        kpi={kpi}
        ips={ips}
        harita={harita}
        aglar={aglar}
        kategoriDagilim={kategoriDagilim}
        botDagilim={botDagilim}
        cografya={cografya}
        kampanyalar={kampanyaListe}
        tehditGun={tehditGun}
        engelGun={engelGun}
        gunEtiketleri={gunEtiketleri}
      />
    </>
  );
}
