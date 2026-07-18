import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Integrations } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import {
  entegrasyonSaglikHesapla,
  filoOzeti,
  olayKapsamaHesapla,
} from "@/lib/specter/entegrasyon-saglik";
import { EntegrasyonSaglikIstemci } from "./EntegrasyonSaglikIstemci";

export const metadata: Metadata = { title: "Entegrasyon Sağlığı — Veylify" };

export default async function EntegrasyonSaglikPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  // "Şimdi" sunucu tarafında bir kez sabitlenir → SAF hesaplayıcılara verilir
  // (istemciyle tutarlı, deterministik).
  const now = Date.now();
  const entegrasyonlar = Integrations.forOwner(user.id);
  const saglikList = entegrasyonlar.map((e) => entegrasyonSaglikHesapla(e, now));
  const ozet = filoOzeti(saglikList);
  const kapsama = olayKapsamaHesapla(entegrasyonlar);

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.integrationhealth", dil) }]} baslik={ceviri("nav.integrationhealth", dil)} />
      <EntegrasyonSaglikIstemci saglikList={saglikList} ozet={ozet} kapsama={kapsama} now={now} dil={dil} />
    </>
  );
}
