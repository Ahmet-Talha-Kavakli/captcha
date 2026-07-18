import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Usage, Events, Sites } from "@/lib/db/db";
import type { BotEvent, BotClass, Verdict } from "@/lib/db/schema";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { AnalitikIstemci } from "./AnalitikIstemci";

export const metadata: Metadata = { title: "Analitik — Veylify" };

function gunKey(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

/** UA metninden okunabilir istemci ailesi türet. */
function uaAile(ua: string): string {
  const u = ua.toLowerCase();
  if (u.includes("gptbot") || u.includes("claudebot") || u.includes("openai")) return "AI ajan (GPT/Claude)";
  if (u.includes("googlebot") || u.includes("bingbot")) return "Arama motoru botu";
  if (u.includes("headlesschrome")) return "Headless Chrome";
  if (u.includes("scrapy")) return "Scrapy";
  if (u.includes("python-requests")) return "python-requests";
  if (u.includes("go-http")) return "Go http-client";
  if (u.includes("node-fetch")) return "node-fetch";
  if (u.includes("axios")) return "axios";
  if (u.includes("curl")) return "curl";
  if (u.includes("chrome")) return "Chrome (tarayıcı)";
  if (u.includes("safari")) return "Safari (tarayıcı)";
  if (u.includes("firefox")) return "Firefox (tarayıcı)";
  return "Diğer";
}

/** İnsan tarafından okunabilir istemci ailesinin bot mu tarayıcı mı olduğu. */
function aileBotMu(aile: string): boolean {
  return !aile.includes("tarayıcı");
}

/** ASN kategorisi (temiz / VPN / veri merkezi). */
function asnKategori(asn: string): "vpn" | "datacenter" | "temiz" {
  if (asn.includes("VPN") || asn.includes("Flokinet") || asn.includes("M247")) return "vpn";
  if (
    asn.includes("Amazon") ||
    asn.includes("DigitalOcean") ||
    asn.includes("Hetzner") ||
    asn.includes("OVH") ||
    asn.includes("Selectel") ||
    asn.includes("Alibaba")
  ) return "datacenter";
  return "temiz";
}

const BOT_SINIFLAR: BotClass[] = ["human", "good_bot", "automation", "scraper", "credential_stuffing", "ai_agent", "ddos", "spam"];

export default async function AnalitikPage({ searchParams }: { searchParams: Promise<{ donem?: string }> }) {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();
  const sp = await searchParams;
  const donem = Number(sp.donem) === 7 || Number(sp.donem) === 90 ? Number(sp.donem) : 30;

  const now = Date.now();
  const cutoffTs = now - donem * 86400000;
  const cutoffPrevTs = now - donem * 2 * 86400000;

  const usageAll = Usage.forOwner(user.id, donem * 2); // bu + önceki dönem (gün-bazlı sayaçlar)
  // Olayları geniş çek: 90 güne kadar iki dönemi de kapsayacak kadar.
  const eventsAll = Events.forOwner(user.id, 8000);
  const sites = Sites.forOwner(user.id);

  const cutoffDay = gunKey(cutoffTs);
  const cutoffPrevDay = gunKey(cutoffPrevTs);

  // ---------------------------------------------------------------- Sayaç toplamları (issued dahil)
  function toplaSayac(filter: (day: string) => boolean) {
    return usageAll.filter((u) => filter(u.day)).reduce(
      (a, u) => ({
        issued: a.issued + u.issued,
        verified: a.verified + u.verified,
        blocked: a.blocked + u.blocked,
        challenged: a.challenged + u.challenged,
      }),
      { issued: 0, verified: 0, blocked: 0, challenged: 0 },
    );
  }
  const buDonem = toplaSayac((d) => d >= cutoffDay);
  const oncekiDonem = toplaSayac((d) => d >= cutoffPrevDay && d < cutoffDay);

  // ---------------------------------------------------------------- Olayları döneme böl
  const buOlaylar = eventsAll.filter((e) => e.ts >= cutoffTs);
  const oncekiOlaylar = eventsAll.filter((e) => e.ts >= cutoffPrevTs && e.ts < cutoffTs);

  // Olay bazlı örnekleme, gerçek istek ölçeğine ~40× ile eşlenir (seed ile aynı oran).
  // KPI'lar için sayaç (usage) tabanı kullanılır; olay-bazlı metrikler örneklem oranını taşır.
  const olayOrani = 40;

  // AI ajan trafiği (olaylardan; sayaç bazında ölçekli tahmin)
  function aiAjanSayisi(list: BotEvent[]): number {
    return list.filter((e) => e.botClass === "ai_agent").length;
  }
  const aiBu = aiAjanSayisi(buOlaylar) * olayOrani;
  const aiOnceki = aiAjanSayisi(oncekiOlaylar) * olayOrani;

  // Ortalama insanlık skoru + ortalama yanıt süresi (olaylardan)
  function ortalamalar(list: BotEvent[]) {
    if (!list.length) return { skor: 0, latency: 0 };
    const skor = list.reduce((a, e) => a + e.score, 0) / list.length;
    const latency = list.reduce((a, e) => a + e.latency, 0) / list.length;
    return { skor, latency };
  }
  const ortBu = ortalamalar(buOlaylar);
  const ortOnceki = ortalamalar(oncekiOlaylar);

  // ---------------------------------------------------------------- Günlük seri (bu dönem, sayaç bazlı)
  const byDay = new Map<string, { day: string; issued: number; verified: number; blocked: number; challenged: number }>();
  for (const u of usageAll) {
    if (u.day < cutoffDay) continue;
    const r = byDay.get(u.day) ?? { day: u.day, issued: 0, verified: 0, blocked: 0, challenged: 0 };
    r.issued += u.issued;
    r.verified += u.verified;
    r.blocked += u.blocked;
    r.challenged += u.challenged;
    byDay.set(u.day, r);
  }
  const gunlukRaw = [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day));
  const gunluk = gunlukRaw.map((g) => ({ label: g.day.slice(5), insan: g.verified, bot: g.blocked + g.challenged }));
  // Toplam istek trend serisi (KPI sparkline + zaman serisi için)
  const toplamTrend = gunlukRaw.map((g) => g.issued);
  const insanTrend = gunlukRaw.map((g) => g.verified);
  const botTrend = gunlukRaw.map((g) => g.blocked + g.challenged);

  // ---------------------------------------------------------------- Bot sınıfı dağılımı (bu dönem, tüm sınıflar)
  const sinifMap = new Map<BotClass, number>();
  for (const c of BOT_SINIFLAR) sinifMap.set(c, 0);
  for (const e of buOlaylar) sinifMap.set(e.botClass, (sinifMap.get(e.botClass) || 0) + 1);
  const botDagilim: [string, number][] = [...sinifMap.entries()]
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);

  // ---------------------------------------------------------------- Karar hunisi (funnel) — sayaç bazlı, gerçek ölçek
  // Toplam istek → İncelendi (bot şüphesi = tümü değerlendirildi) → Doğrulama istendi → Engellendi → İzin verildi
  const funnel = {
    toplam: buDonem.issued,
    incelendi: buDonem.issued, // her istek koruma motorundan geçer
    dogrulama: buDonem.challenged,
    engellendi: buDonem.blocked,
    izin: buDonem.verified,
  };

  // ---------------------------------------------------------------- Gün × saat yoğunluk heatmap (bot olayları)
  const heatmap: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));
  for (const e of buOlaylar) {
    if (e.verdict === "allowed") continue;
    const d = new Date(e.ts);
    const gun = (d.getDay() + 6) % 7; // Pazartesi=0
    heatmap[gun][d.getHours()]++;
  }

  // ---------------------------------------------------------------- Coğrafi dağılım (istek + bot oranı)
  const geoMap = new Map<string, { istek: number; bot: number }>();
  for (const e of buOlaylar) {
    const g = geoMap.get(e.country) ?? { istek: 0, bot: 0 };
    g.istek++;
    if (e.verdict !== "allowed") g.bot++;
    geoMap.set(e.country, g);
  }
  const cografya = [...geoMap.entries()]
    .map(([kod, v]) => ({ kod, istek: v.istek, bot: v.bot, oran: v.istek ? (v.bot / v.istek) * 100 : 0 }))
    .sort((a, b) => b.istek - a.istek)
    .slice(0, 8);

  // ---------------------------------------------------------------- En çok hedeflenen yollar (istek + engellenen)
  const pathMap = new Map<string, { istek: number; engel: number }>();
  for (const e of buOlaylar) {
    const p = pathMap.get(e.path) ?? { istek: 0, engel: 0 };
    p.istek++;
    if (e.verdict === "blocked") p.engel++;
    pathMap.set(e.path, p);
  }
  const yollar = [...pathMap.entries()]
    .map(([yol, v]) => ({ yol, istek: v.istek, engel: v.engel }))
    .sort((a, b) => b.istek - a.istek)
    .slice(0, 10);

  // ---------------------------------------------------------------- ASN / ağ dağılımı
  const asnMap = new Map<string, { istek: number; bot: number; kat: "vpn" | "datacenter" | "temiz" }>();
  for (const e of buOlaylar) {
    const a = asnMap.get(e.asn) ?? { istek: 0, bot: 0, kat: asnKategori(e.asn) };
    a.istek++;
    if (e.verdict !== "allowed") a.bot++;
    asnMap.set(e.asn, a);
  }
  const asnler = [...asnMap.entries()]
    .map(([asn, v]) => ({ asn, istek: v.istek, bot: v.bot, kat: v.kat, oran: v.istek ? (v.bot / v.istek) * 100 : 0 }))
    .sort((a, b) => b.istek - a.istek)
    .slice(0, 8);

  // ---------------------------------------------------------------- Skor dağılım histogramı (0..1, 10 kova)
  const histogram = new Array(10).fill(0);
  for (const e of buOlaylar) {
    let k = Math.floor(e.score * 10);
    if (k > 9) k = 9;
    if (k < 0) k = 0;
    histogram[k]++;
  }

  // ---------------------------------------------------------------- Segment kırılımı (UA ailesi)
  const segMap = new Map<string, { istek: number; engel: number; bot: boolean }>();
  for (const e of buOlaylar) {
    const aile = uaAile(e.ua);
    const s = segMap.get(aile) ?? { istek: 0, engel: 0, bot: aileBotMu(aile) };
    s.istek++;
    if (e.verdict !== "allowed") s.engel++;
    segMap.set(aile, s);
  }
  const segmentler = [...segMap.entries()]
    .map(([aile, v]) => ({ aile, istek: v.istek, engel: v.engel, bot: v.bot }))
    .sort((a, b) => b.istek - a.istek);

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.analytics", dil) }]} baslik={ceviri("nav.analytics", dil)} />
      <AnalitikIstemci
        dil={dil}
        siteCount={sites.length}
        donem={donem}
        olayOrani={olayOrani}
        buDonem={buDonem}
        oncekiDonem={oncekiDonem}
        aiBu={aiBu}
        aiOnceki={aiOnceki}
        ortBu={ortBu}
        ortOnceki={ortOnceki}
        gunluk={gunluk}
        toplamTrend={toplamTrend}
        insanTrend={insanTrend}
        botTrend={botTrend}
        gunEtiketleri={gunlukRaw.map((g) => g.day.slice(5))}
        botDagilim={botDagilim}
        funnel={funnel}
        heatmap={heatmap}
        cografya={cografya}
        yollar={yollar}
        asnler={asnler}
        histogram={histogram}
        segmentler={segmentler}
      />
    </>
  );
}
