import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Sites, Events, Usage, Campaigns, Alerts, IpRep, Audit, Reports } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import {
  RaporlarIstemci,
  type ZamanRaporDTO,
  type GecmisDTO,
  type SiteDTO,
  type RaporVeriDTO,
  type GunDTO,
} from "./RaporlarIstemci";

export const metadata: Metadata = { title: "Raporlar — Veylify" };

function gunKey(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

export default async function RaporlarPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  const now = Date.now();
  const sites = Sites.forOwner(user.id);
  const siteAdi = new Map(sites.map((s) => [s.id, s.name]));

  // Gerçek veriden 90 günlük havuz (rapor oluşturucu istemcide dönemi kırpar).
  const events = Events.forOwner(user.id, 8000);
  const usage = Usage.forOwner(user.id, 90);
  const campaigns = Campaigns.forOwner(user.id);
  const alerts = Alerts.forOwner(user.id);
  const ipRep = IpRep.forOwner();

  // --- Kullanım (issued/verified/blocked/challenged) günlük seri (90 gün) ---
  const gunHarita = new Map<string, { issued: number; verified: number; blocked: number; challenged: number }>();
  for (let d = 89; d >= 0; d--) {
    gunHarita.set(gunKey(now - d * 86400000), { issued: 0, verified: 0, blocked: 0, challenged: 0 });
  }
  for (const u of usage) {
    const g = gunHarita.get(u.day);
    if (g) {
      g.issued += u.issued;
      g.verified += u.verified;
      g.blocked += u.blocked;
      g.challenged += u.challenged;
    }
  }
  const gunler: GunDTO[] = [...gunHarita.entries()].map(([gun, v]) => ({ gun, ...v }));

  // --- Bot sınıfı dağılımı (event tabanlı, 90 gün) ---
  const cutoff90 = now - 90 * 86400000;
  const son90 = events.filter((e) => e.ts >= cutoff90);
  const sinifSayac: Record<string, number> = {};
  for (const e of son90) sinifSayac[e.botClass] = (sinifSayac[e.botClass] ?? 0) + 1;

  // --- Ülke dağılımı (bot olayları) ---
  const ulkeSayac: Record<string, number> = {};
  for (const e of son90) {
    if (e.botClass !== "human" && e.botClass !== "good_bot") {
      ulkeSayac[e.country] = (ulkeSayac[e.country] ?? 0) + 1;
    }
  }
  const ulkeler = Object.entries(ulkeSayac)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([kod, deger]) => ({ kod, deger }));

  // --- AI ajan olayları (UA aile bazında) ---
  const aiEvents = son90.filter((e) => e.botClass === "ai_agent");
  const aiAileSayac: Record<string, number> = {};
  for (const e of aiEvents) {
    const u = e.ua.toLowerCase();
    const aile = u.includes("gptbot") || u.includes("openai") || u.includes("chatgpt")
      ? "GPTBot (OpenAI)"
      : u.includes("claude") || u.includes("anthropic")
        ? "ClaudeBot (Anthropic)"
        : u.includes("perplexity")
          ? "PerplexityBot"
          : u.includes("bytespider")
            ? "Bytespider (ByteDance)"
            : u.includes("ccbot") || u.includes("commoncrawl")
              ? "CCBot (Common Crawl)"
              : u.includes("amazonbot")
                ? "Amazonbot"
                : u.includes("google-extended")
                  ? "Google-Extended"
                  : "Diğer AI ajanları";
    aiAileSayac[aile] = (aiAileSayac[aile] ?? 0) + 1;
  }
  const aiAileler = Object.entries(aiAileSayac)
    .sort((a, b) => b[1] - a[1])
    .map(([ad, deger]) => ({ ad, deger }));

  // --- Kampanya özeti ---
  const kampanyalar = campaigns.map((c) => ({
    id: c.id,
    name: c.name,
    botClass: c.botClass,
    status: c.status,
    siteName: siteAdi.get(c.siteId) ?? "—",
    totalRequests: c.totalRequests,
    blockedRequests: c.blockedRequests,
    peakRps: c.peakRps,
    startedAt: c.startedAt,
  }));

  // --- Uyarı/olay özeti (uyum & denetim raporu için) ---
  const cozulen = alerts.filter((a) => a.status === "cozuldu");
  const mttrList = cozulen
    .filter((a) => a.resolvedAt)
    .map((a) => (a.resolvedAt! - a.ts) / 3600000);
  const ortMttr = mttrList.length ? mttrList.reduce((x, y) => x + y, 0) / mttrList.length : 0;

  const denetim = Audit.forOwner(user.id, 500);
  const kritikDenetim = denetim.filter((a) => a.critical).length;

  // --- Toplu KPI'lar ---
  const kullanimToplam = usage.reduce(
    (a, u) => ({
      issued: a.issued + u.issued,
      verified: a.verified + u.verified,
      blocked: a.blocked + u.blocked,
      challenged: a.challenged + u.challenged,
    }),
    { issued: 0, verified: 0, blocked: 0, challenged: 0 },
  );

  const veri: RaporVeriDTO = {
    siteler: sites.map((s): SiteDTO => ({ id: s.id, name: s.name, mode: s.mode })),
    gunler,
    sinifSayac,
    ulkeler,
    aiAileler,
    aiOlaySayisi: aiEvents.length,
    kampanyalar,
    kullanimToplam,
    kotuIpSayisi: ipRep.filter((r) => r.threatScore > 60).length,
    ipToplam: ipRep.length,
    uyariAcik: alerts.filter((a) => a.status === "acik").length,
    uyariCozulen: cozulen.length,
    uyariToplam: alerts.length,
    ortMttrSaat: Math.round(ortMttr * 10) / 10,
    denetimToplam: denetim.length,
    denetimKritik: kritikDenetim,
  };

  // --- Zamanlanmış raporlar ---
  const zamanli: ZamanRaporDTO[] = Reports.scheduledForOwner(user.id).map((r) => ({
    id: r.id,
    type: r.type,
    name: r.name,
    frequency: r.frequency,
    format: r.format,
    recipients: r.recipients,
    siteName: r.siteId ? (siteAdi.get(r.siteId) ?? "—") : null,
    active: r.active,
    createdAt: r.createdAt,
    nextRunAt: r.nextRunAt,
    lastRunAt: r.lastRunAt,
  }));

  // --- Rapor geçmişi ---
  const gecmis: GecmisDTO[] = Reports.historyForOwner(user.id, 100).map((r) => ({
    id: r.id,
    type: r.type,
    name: r.name,
    periodDays: r.periodDays,
    format: r.format,
    sizeBytes: r.sizeBytes,
    createdBy: r.createdBy,
    createdAt: r.createdAt,
    scheduled: !!r.scheduledReportId,
  }));

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.reports", dil) }]} baslik={ceviri("nav.reports", dil)} />
      <RaporlarIstemci
        dil={dil}
        veri={veri}
        zamanli={zamanli}
        gecmis={gecmis}
        benimAdim={user.name}
      />
    </>
  );
}
