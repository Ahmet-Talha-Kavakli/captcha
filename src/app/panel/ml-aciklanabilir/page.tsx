import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { modelOzet } from "@/lib/specter/ml-aciklanabilir";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { MlAciklanabilirIstemci } from "./MlAciklanabilirIstemci";

export const metadata: Metadata = { title: "ML Açıklanabilirlik — Veylify" };

export default async function MlAciklanabilirPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  const events = Events.forOwner(user.id, 2000);
  const ozet = modelOzet(events);

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.mlexplain", dil) }]} baslik={ceviri("nav.mlexplain", dil)} />
      <MlAciklanabilirIstemci
        dil={dil}
        ozet={{
          toplam: ozet.toplam,
          ortGuven: ozet.ortGuven,
          belirsizOran: ozet.belirsizOran,
          // Enum güvenliği: sınıf DEĞERİNİ (BotClass) taşırız, etiketi istemcide çeviririz.
          sinifDagilim: ozet.sinifDagilim.map((s) => ({ sinif: s.sinif, sayi: s.sayi, oran: s.oran })),
          ozellikEtki: ozet.ozellikEtki,
        }}
      />
    </>
  );
}
