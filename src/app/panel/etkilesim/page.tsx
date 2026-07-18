import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import {
  isiArketipleri,
  etkilesimOzet,
  trafikDagilim,
  VARSAYILAN_INSAN,
  VARSAYILAN_BOT,
} from "@/lib/specter/etkilesim-analiz";
import { EtkilesimIstemci } from "./EtkilesimIstemci";
import { etkilesimCeviri } from "./etkilesim.i18n";

export const metadata: Metadata = { title: "Etkileşim Analizi — Veylify" };

export default async function EtkilesimPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  // Gerçek olay dağılımı — ısı haritasını canlı trafiğe göre bağlamlar.
  const olaylar = Events.forOwner(user.id, 500).map((e) => ({
    botClass: e.botClass as string,
    score: e.score,
  }));
  const trafik = trafikDagilim(olaylar);

  const arketipler = isiArketipleri();
  const ozet = etkilesimOzet();

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.interaction", dil) }]} baslik={etkilesimCeviri("et.baslik", dil)} />
      <EtkilesimIstemci
        arketipler={arketipler}
        ozet={ozet}
        trafik={trafik}
        varsayilanInsan={VARSAYILAN_INSAN}
        varsayilanBot={VARSAYILAN_BOT}
        dil={dil}
      />
    </>
  );
}
