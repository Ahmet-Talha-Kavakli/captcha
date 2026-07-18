import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Rules } from "@/lib/db/db";
import { kirmiziTakimCalistir } from "@/lib/specter/kirmizi-takim";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { KirmiziTakimIstemci } from "./KirmiziTakimIstemci";

export const metadata: Metadata = { title: "Kırmızı Takım — Veylify" };

export default async function KirmiziTakimPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  const rules = Rules.forOwner(user.id);
  const sonuc = kirmiziTakimCalistir(rules, 40);

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.redteam", dil) }]} baslik={ceviri("nav.redteam", dil)} />
      <KirmiziTakimIstemci
        dil={dil}
        ilkSonuc={{
          ozet: sonuc.ozet,
          kuralSayisi: rules.filter((r) => r.enabled).length,
          sonuclar: sonuc.sonuclar.map((s) => ({
            id: s.senaryo.id, ad: s.senaryo.ad, aciklama: s.senaryo.aciklama,
            kategori: s.senaryo.kategori, siddet: s.senaryo.siddet, beklenen: s.senaryo.beklenen,
            toplam: s.toplam, engellenen: s.engellenen, dogrulanan: s.dogrulanan, kacan: s.kacan,
            etkinlik: s.etkinlik, durum: s.durum, yakalayanKurallar: s.yakalayanKurallar,
          })),
        }}
      />
    </>
  );
}
