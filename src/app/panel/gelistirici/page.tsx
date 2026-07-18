import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Tokens, Webhooks, Sites, Events } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { GelistiriciIstemci } from "./GelistiriciIstemci";

export const metadata: Metadata = { title: "Geliştirici — Veylify" };

export default async function GelistiriciPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();
  const baslik = ceviri("nav.developer", dil);

  const tokens = Tokens.forOwner(user.id);
  const webhooks = Webhooks.forOwner(user.id);
  const sites = Sites.forOwner(user.id);

  // Son API istekleri logu için sahibin son olaylarından türetilmiş kayıtlar.
  const sonOlaylar = Events.forOwner(user.id, 40);
  const istekLog = sonOlaylar.map((e) => ({
    id: e.id,
    endpoint:
      e.verdict === "allowed" || e.verdict === "challenged"
        ? "/api/v1/verify"
        : e.botClass === "ai_agent"
          ? "/api/v1/passive"
          : "/api/v1/verify",
    method: "POST",
    status: e.verdict === "blocked" ? 403 : e.verdict === "flagged" ? 422 : 200,
    latency: e.latency,
    ts: e.ts,
    ip: e.ip,
    country: e.country,
  }));

  // Üst özet metrikleri.
  const aktifAnahtar = tokens.filter((t) => !t.revoked).length;
  const aylikCagri = tokens.reduce((s, t) => s + (t.requests30d ?? 0), 0);
  const tumTeslim = webhooks.flatMap((w) => w.deliveries ?? []);
  const basarili = tumTeslim.filter((d) => d.status >= 200 && d.status < 300).length;
  const teslimOrani = tumTeslim.length ? Math.round((basarili / tumTeslim.length) * 100) : 100;
  const ortLatency = istekLog.length
    ? Math.round(istekLog.reduce((s, e) => s + e.latency, 0) / istekLog.length)
    : 0;

  return (
    <>
      <PanelUst kirintilar={[{ ad: baslik }]} baslik={baslik} />
      <GelistiriciIstemci
        dil={dil}
        tokens={tokens.map((t) => ({
          id: t.id,
          name: t.name,
          prefix: t.prefix,
          scopes: t.scopes,
          environment: t.environment,
          lastUsed: t.lastUsed,
          requests30d: t.requests30d ?? 0,
          revoked: t.revoked,
          createdAt: t.createdAt,
        }))}
        webhooks={webhooks.map((w) => {
          const site = sites.find((s) => s.id === w.siteId);
          return {
            id: w.id,
            siteId: w.siteId,
            siteName: site?.name ?? "—",
            url: w.url,
            events: w.events,
            active: w.active,
            secret: w.secret,
            createdAt: w.createdAt,
            lastDelivery: w.lastDelivery,
            lastStatus: w.lastStatus,
            deliveries: (w.deliveries ?? [])
              .slice()
              .sort((a, b) => b.ts - a.ts)
              .map((d) => ({ id: d.id, event: d.event, status: d.status, ts: d.ts, attempt: d.attempt, durationMs: d.durationMs })),
          };
        })}
        sites={sites.map((s) => ({ id: s.id, name: s.name, siteKey: s.siteKey }))}
        istekLog={istekLog}
        ozet={{ aktifAnahtar, aylikCagri, teslimOrani, ortLatency, webhookSayi: webhooks.length }}
        plan={user.plan}
      />
    </>
  );
}
