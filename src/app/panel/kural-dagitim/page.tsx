import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Sites, Rules } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import {
  kapsamaMatrisi,
  driftBul,
  masterKuralSeti,
  kurallariGrupla,
  type DagitimSite,
  type KuralTohum,
} from "@/lib/specter/kural-dagitim";
import { KuralDagitimIstemci } from "./KuralDagitimIstemci";

export const metadata: Metadata = { title: "Kural Dağıtımı — Veylify" };

export default async function KuralDagitimPage() {
  const user = await currentUser();
  if (!user) return null;

  const dil = await panelDil();
  const baslik = ceviri("nav.ruledeploy", dil);

  // Sahibin siteleri + tüm kuralları topla.
  const sitelerHam = Sites.forOwner(user.id);
  const siteler: DagitimSite[] = sitelerHam.map((s) => ({ id: s.id, name: s.name }));
  const kurallar = Rules.forOwner(user.id);

  // Saf çekirdekle kapsama matrisi + drift + master seti hesapla (SSR).
  const kuralHaritasi = kurallariGrupla(siteler, kurallar);
  const matris = kapsamaMatrisi(siteler, kuralHaritasi);
  const drift = driftBul(siteler, kurallar);
  const master = masterKuralSeti(siteler, kurallar);

  // İmza → dağıtılabilir tohum haritası. Master birleşim olduğundan HER
  // benzersiz imzayı içerir; toplu dağıtımda satır → tohum eşlemesi bundan.
  const tohumHaritasi: Record<string, KuralTohum> = {};
  for (const k of master.kurallar) tohumHaritasi[k.imza] = k.tohum;

  // Site meta (mod/doğrulama) — kart etiketleri için ince bir alt küme.
  const siteMeta = sitelerHam.map((s) => ({
    id: s.id,
    name: s.name,
    mode: s.mode,
    verified: s.verified,
    kuralSayisi: kuralHaritasi[s.id]?.length ?? 0,
  }));

  return (
    <>
      <PanelUst kirintilar={[{ ad: baslik }]} baslik={baslik} />
      <KuralDagitimIstemci
        dil={dil}
        siteMeta={siteMeta}
        matris={matris}
        drift={drift}
        master={master}
        tohumHaritasi={tohumHaritasi}
      />
    </>
  );
}
