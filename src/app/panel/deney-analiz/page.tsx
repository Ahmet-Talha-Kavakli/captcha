import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Experiments } from "@/lib/db/db";
import { deneyAnaliz, peekingUyarisi } from "@/lib/specter/deney-istatistik";
import { PanelUst } from "@/components/panel/PanelUst";
import { DeneyAnalizIstemci } from "./DeneyAnalizIstemci";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { deneyCeviri } from "./deney-analiz.i18n";
import type { ExperimentMetric, ExperimentVariantResult } from "@/lib/db/schema";

export const metadata: Metadata = { title: "Deney Analizi — Veylify" };

/** Metriğe göre "başarı" sayısı (geçiş ya da engelleme). */
function basari(m: ExperimentMetric, r: ExperimentVariantResult): number {
  return m === "guvenlik" ? r.engellenen : r.gecis;
}

export default async function DeneyAnalizPage() {
  const user = await currentUser();
  if (!user) return null;

  const dil = await panelDil();
  const denemeler = Experiments.forOwner(user.id);
  // Her deney için tam istatistik analiz (sunucuda hesapla).
  const analizler = denemeler.map((d) => {
    const a = { n: d.results.A.gosterim, basari: basari(d.metric, d.results.A) };
    const b = { n: d.results.B.gosterim, basari: basari(d.metric, d.results.B) };
    const analiz = deneyAnaliz(a, b);
    const minN = Math.min(a.n, b.n);
    const uyari = peekingUyarisi(minN, analiz.gerekenN, analiz.anlamli);
    return {
      id: d.id,
      name: d.name,
      status: d.status,
      metric: d.metric,
      variantADifficulty: d.variantA.difficulty,
      variantAInvisible: d.variantA.invisibleMode,
      variantBDifficulty: d.variantB.difficulty,
      variantBInvisible: d.variantB.invisibleMode,
      sonucA: d.results.A,
      sonucB: d.results.B,
      basariA: a.basari,
      basariB: b.basari,
      analiz,
      peekingUyari: uyari,
    };
  });

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.expanalysis", dil) }]} baslik={deneyCeviri("baslik", dil)} />
      <DeneyAnalizIstemci analizler={analizler} dil={dil} />
    </>
  );
}
