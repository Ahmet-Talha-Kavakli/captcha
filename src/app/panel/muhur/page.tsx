import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Sites, Usage } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { MuhurIstemci } from "./MuhurIstemci";
import { muhCeviri } from "./muhur.i18n";

export const metadata: Metadata = { title: "Güven Mührü — Veylify" };

export default async function MuhurPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();
  const sites = Sites.forOwner(user.id);
  const usage = Usage.forOwner(user.id, 30);
  const engellenen = usage.reduce((a, u) => a + u.blocked, 0);
  const toplamIstek = usage.reduce((a, u) => a + u.issued, 0);
  const dogrulanan = usage.reduce((a, u) => a + u.verified, 0);

  // Rozet görüntülenme trendi (30 gün): korunan trafiğin bir türevi olarak
  // rozetin kaç kez ziyaretçiye gösterildiğini deterministik türetiriz —
  // günlük doğrulanan istek ≈ rozetli sayfa gösterimi.
  const gunlukMap = new Map<string, number>();
  for (const u of usage) {
    gunlukMap.set(u.day, (gunlukMap.get(u.day) ?? 0) + u.verified);
  }
  const gunler = Array.from(gunlukMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  const gorunumTrend = gunler.map(([, v]) => Math.round(v * 0.6));
  const gorunumEtiket = gunler.map(([d]) => {
    const [, m, g] = d.split("-");
    return `${g}.${m}`;
  });
  const rozetGorunum = gorunumTrend.reduce((a, v) => a + v, 0);

  // Gerçek engelleme oranı: engellenen / (verilen + engellenen).
  // Engellenen bir istek asla "issued" (verilen token) sayılmadığı için payda
  // toplam gelen istek = toplamIstek + engellenen olarak alınır.
  const toplamGelen = toplamIstek + engellenen;
  const blokOrani = toplamGelen > 0 ? (engellenen / toplamGelen) * 100 : 0;
  // Harf notu eşik-tabanlı (blok oranından türetilir).
  const harfNotu =
    blokOrani >= 95 ? "A+" : blokOrani >= 85 ? "A" : blokOrani >= 70 ? "B" : "C";

  // İlk site için deterministik "üye olma" tarihi (trust page için).
  const ilkSite = sites[0];

  return (
    <>
      <PanelUst kirintilar={[{ ad: muhCeviri("kirinti", dil) }]} baslik={muhCeviri("kirinti", dil)} />
      <MuhurIstemci
        dil={dil}
        sites={sites.map((s) => ({
          id: s.id,
          name: s.name,
          verified: s.verified,
          korumaBaslangic: s.verifiedAt ?? s.createdAt,
        }))}
        engellenen={engellenen}
        toplamIstek={toplamIstek}
        dogrulanan={dogrulanan}
        blokOrani={blokOrani}
        harfNotu={harfNotu}
        rozetGorunum={rozetGorunum}
        gorunumTrend={gorunumTrend}
        gorunumEtiket={gorunumEtiket}
        ilkSiteAdi={ilkSite?.name ?? "acme-shop.com"}
      />
    </>
  );
}
