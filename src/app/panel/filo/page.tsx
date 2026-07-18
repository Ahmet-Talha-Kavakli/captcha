import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { Sites, Events, Rules, Alerts } from "@/lib/db/db";
import { siteDurumu, filoOzet } from "@/lib/specter/filo";
import { FiloIstemci } from "./FiloIstemci";

export const metadata: Metadata = { title: "Filo Panosu — Veylify" };

/**
 * Filo Panosu (sunucu sayfası) — MSP/ajans portföy konsolu.
 * Sahibin tüm sitelerini toplar; her site için son ~500 olayı, kurallarını
 * ve o siteye ait açık uyarıları çekip SAF `siteDurumu` ile duruş hesaplar,
 * ardından `filoOzet` birleşik özetini istemciye geçirir.
 */
export default async function FiloPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  const siteler = Sites.forOwner(user.id);
  // Tüm uyarıları bir kez çek, siteId'ye göre indeksle (N+1 sorgu yerine).
  const tumUyarilar = Alerts.forOwner(user.id);

  const durumlar = siteler.map((site) => {
    const events = Events.forSite(site.id, 500);
    const rules = Rules.forSite(site.id);
    const alerts = tumUyarilar.filter((a) => a.siteId === site.id);
    return siteDurumu(site, events, rules, alerts);
  });

  const ozet = filoOzet(durumlar);

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.fleet", dil) }]} baslik={ceviri("nav.fleet", dil)} />
      <FiloIstemci durumlar={durumlar} ozet={ozet} dil={dil} />
    </>
  );
}
