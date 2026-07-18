import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Experiments, Sites } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { DenemelerIstemci, type DeneyGorunum } from "./DenemelerIstemci";

export const metadata: Metadata = { title: "Denemeler — Veylify" };

export default async function DenemelerPage() {
  const user = await currentUser();
  if (!user) return null;

  const dil = await panelDil();

  const siteler = Sites.forOwner(user.id);
  const siteAd = new Map(siteler.map((s) => [s.id, s.name]));
  const denemeler = Experiments.forOwner(user.id);

  const gorunumler: DeneyGorunum[] = denemeler.map((d) => ({
    ...d,
    siteAd: siteAd.get(d.siteId) ?? "—",
  }));

  // Özet: aktif deneme, tamamlanan, ort. iyileşme %, toplam gösterim.
  const aktif = gorunumler.filter((d) => d.status === "calisiyor").length;
  const tamamlanan = gorunumler.filter((d) => d.status === "tamam").length;
  const toplamGosterim = gorunumler.reduce(
    (t, d) => t + d.results.A.gosterim + d.results.B.gosterim,
    0,
  );

  // Ort. iyileşme: tamamlanmış + kazananı olan denemelerde, kazanan variantın
  // metrik yönünde kaybeden variante göre yüzde iyileşmesi (ortalama).
  const iyilesmeler: number[] = [];
  for (const d of gorunumler) {
    if (d.status !== "tamam" || !d.winner) continue;
    const kaz = d.winner === "A" ? d.results.A : d.results.B;
    const kyb = d.winner === "A" ? d.results.B : d.results.A;
    const oran = (r: typeof kaz) => (r.gosterim ? r : null);
    if (!oran(kaz) || !oran(kyb)) continue;
    let iyi = 0;
    if (d.metric === "guvenlik") {
      const ek = kaz.engellenen / kaz.gosterim;
      const es = kyb.engellenen / kyb.gosterim;
      iyi = es ? ((ek - es) / es) * 100 : 0;
    } else {
      // surtunme + donusum → geçiş oranı yüksek iyi
      const gk = kaz.gecis / kaz.gosterim;
      const gs = kyb.gecis / kyb.gosterim;
      iyi = gs ? ((gk - gs) / gs) * 100 : 0;
    }
    iyilesmeler.push(iyi);
  }
  const ortIyilesme = iyilesmeler.length
    ? iyilesmeler.reduce((a, b) => a + b, 0) / iyilesmeler.length
    : 0;

  const siteSecenek = siteler.map((s) => ({ id: s.id, ad: s.name }));

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.experiments", dil) }]} baslik={ceviri("nav.experiments", dil)} />
      <DenemelerIstemci
        denemeler={gorunumler}
        siteler={siteSecenek}
        ozet={{ aktif, tamamlanan, ortIyilesme, toplamGosterim }}
        dil={dil}
      />
    </>
  );
}
