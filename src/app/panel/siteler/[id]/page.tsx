import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { Sites, Events, Usage, Rules } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { SiteDetayIstemci } from "./SiteDetayIstemci";

export const metadata: Metadata = { title: "Site — Veylify" };

export default async function SiteDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) return null;
  const site = Sites.byId(id);
  if (!site || site.ownerId !== user.id) notFound();

  // 14 günlük kullanım → günlük trend (doğrulama / engellenen) + toplamlar.
  const usage = Usage.forSite(id, 14);
  const byDay = new Map<string, { issued: number; verified: number; blocked: number; challenged: number }>();
  for (const u of usage) {
    const r = byDay.get(u.day) ?? { issued: 0, verified: 0, blocked: 0, challenged: 0 };
    r.issued += u.issued;
    r.verified += u.verified;
    r.blocked += u.blocked;
    r.challenged += u.challenged;
    byDay.set(u.day, r);
  }
  const trend = [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  const toplam = usage.reduce(
    (a, u) => {
      a.issued += u.issued; a.verified += u.verified; a.blocked += u.blocked; a.challenged += u.challenged;
      return a;
    },
    { issued: 0, verified: 0, blocked: 0, challenged: 0 },
  );

  // Son gün (bugün) sayaçları — sağlık paneli "son trafik" bileşeni için.
  const bugun = new Date().toISOString().slice(0, 10);
  const bugunSayac = byDay.get(bugun) ?? { issued: 0, verified: 0, blocked: 0, challenged: 0 };

  // Kural özeti: yol-bazlı kural önizlemesi için ad/koşul/aksiyon.
  const rules = Rules.forSite(id);
  const aktifKural = rules.filter((r) => r.enabled).length;
  const kuralOzet = rules.slice(0, 6).map((r) => ({
    id: r.id, name: r.name, field: r.field, op: r.op, value: r.value, action: r.action, enabled: r.enabled,
  }));

  return (
    <>
      <PanelUst kirintilar={[{ ad: "Siteler", href: "/panel/siteler" }, { ad: site.name }]} baslik={site.name} />
      <SiteDetayIstemci
        site={{
          id: site.id, name: site.name, domains: site.domains, siteKey: site.siteKey, secretKey: site.secretKey,
          difficulty: site.difficulty, behaviorThreshold: site.behaviorThreshold, invisibleMode: site.invisibleMode,
          mode: site.mode, active: site.active, rateLimit: site.rateLimit ?? 0,
          verified: site.verified, verifyToken: site.verifyToken, verifiedAt: site.verifiedAt, createdAt: site.createdAt,
        }}
        events={Events.forSite(id, 20).map((e) => ({ id: e.id, ts: e.ts, ip: e.ip, botClass: e.botClass, verdict: e.verdict, path: e.path, score: e.score }))}
        ruleCount={rules.length}
        aktifKural={aktifKural}
        kuralOzet={kuralOzet}
        trendIssued={trend.map(([, v]) => v.issued)}
        trendBlocked={trend.map(([, v]) => v.blocked)}
        toplam={toplam}
        bugunTrafik={bugunSayac.issued}
      />
    </>
  );
}
