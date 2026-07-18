import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { PanelUst } from "@/components/panel/PanelUst";
import { Rules, Sites } from "@/lib/db/db";
import { kuralAnaliz, analizOzet, sadeceIsaretleyenler } from "@/lib/specter/rule-analysis";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { KuralAnalizIstemci, type SiteAnaliz } from "./KuralAnalizIstemci";

export const metadata: Metadata = { title: "Kural Analizi — Veylify" };

/**
 * Kural Çakışma & Gölgeleme Analizi (sunucu sayfası).
 * Sahibin her sitesi için kural kümesini statik analizden geçirir ve
 * sonuçları (bulgular + özet) istemciye serileştirilebilir biçimde verir.
 * Böylece site seçimi anında (yeniden istek olmadan) çalışır.
 */
export default async function KuralAnalizPage() {
  const user = await currentUser();
  if (!user) return null;

  const dil = await panelDil();

  const siteler = Sites.forOwner(user.id);

  const analizler: SiteAnaliz[] = siteler.map((s) => {
    const kurallar = Rules.forSite(s.id); // zaten önceliğe göre sıralı
    const bulgular = kuralAnaliz(kurallar);
    return {
      siteId: s.id,
      siteAd: s.name,
      kuralSayisi: kurallar.length,
      etkinSayisi: kurallar.filter((r) => r.enabled).length,
      ozet: analizOzet(bulgular),
      bulgular,
      isaretleyenler: sadeceIsaretleyenler(kurallar),
    };
  });

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.ruleanalysis", dil) }]} baslik={ceviri("nav.ruleanalysis", dil)} />
      <KuralAnalizIstemci analizler={analizler} dil={dil} />
    </>
  );
}
