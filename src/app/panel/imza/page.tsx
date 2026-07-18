import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { imzaTara, IMZA_KUTUPHANESI } from "@/lib/specter/imza";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { ImzaIstemci } from "./ImzaIstemci";

export const metadata: Metadata = { title: "Saldırı İmzaları — Veylify" };

export default async function ImzaPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  const events = Events.forOwner(user.id, 3000);
  const sonuc = imzaTara(events);

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.signatures", dil) }]} baslik={ceviri("nav.signatures", dil)} />
      <ImzaIstemci
        dil={dil}
        vuruslar={sonuc.vuruslar.map((v) => ({
          imza: v.imza, vurus: v.vurus, benzersizIp: v.benzersizIp, ornekIpler: v.ornekIpler, ulkeler: v.ulkeler,
        }))}
        ozet={sonuc.ozet}
        eslesenOlay={sonuc.eslesenOlay}
        toplamOlay={sonuc.toplamOlay}
        kutuphane={IMZA_KUTUPHANESI}
      />
    </>
  );
}
