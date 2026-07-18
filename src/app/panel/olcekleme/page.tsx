import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { POPS, BOLGE_AD, BOLGE_RENK } from "../edge/pops";
import {
  olceklemeAnaliz,
  olceklemeOzet,
  politikaOner,
  DUGUM_AYLIK_MALIYET_USD,
  DUGUM_RPS_KAPASITE,
  HEDEF_HEADROOM,
  type OlayGirdi,
} from "./olcek";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { OlceklemeIstemci } from "./OlceklemeIstemci";

export const metadata: Metadata = { title: "Ölçekleme Politikası — Veylify" };

export default async function OlceklemePage() {
  const user = await currentUser();
  if (!user) return null;

  const dil = await panelDil();

  // Ham veri (import-only): gerçek PoP topolojisi (edge/pops) + olay örneklemi.
  // Olaylar ülke taşır; bölge-özel yük trendini türetmek için kullanılır.
  const olaylar: OlayGirdi[] = Events.forOwner(user.id, 3000).map((e) => ({
    ts: e.ts,
    country: e.country,
  }));

  // Türetilmiş ölçekleme analizleri (hepsi pure/deterministik yerel çekirdekten).
  const bolgeler = olceklemeAnaliz(POPS, olaylar);
  const ozet = olceklemeOzet(bolgeler);
  const politika = politikaOner(bolgeler);

  // İstemciye bölge etiketleri + renklerini serileştirilebilir biçimde ver.
  const bolgeMeta = bolgeler.map((b) => ({
    ad: BOLGE_AD[b.bolge],
    renk: BOLGE_RENK[b.bolge],
  }));

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.scaling", dil) }]} baslik={ceviri("nav.scaling", dil)} />
      <OlceklemeIstemci
        bolgeler={bolgeler}
        bolgeMeta={bolgeMeta}
        ozet={ozet}
        politika={politika}
        model={{
          dugumAylikMaliyet: DUGUM_AYLIK_MALIYET_USD,
          dugumRpsKapasite: DUGUM_RPS_KAPASITE,
          hedefHeadroom: HEDEF_HEADROOM,
        }}
        dil={dil}
      />
    </>
  );
}
