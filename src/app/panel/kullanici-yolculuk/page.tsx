import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { yolculukAnaliz } from "@/lib/specter/kullanici-yolculuk";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { KullaniciYolculukIstemci } from "./KullaniciYolculukIstemci";

export const metadata: Metadata = { title: "Kullanıcı Yolculuğu — Veylify" };

export default async function KullaniciYolculukPage() {
  const user = await currentUser();
  if (!user) return null;

  const dil = await panelDil();

  const events = Events.forOwner(user.id, 3000);
  const sonuc = yolculukAnaliz(events);
  // ÖNERİLER: Motorun `yolculukOneriler` çıktısı TR metin içerir. Motoru
  // düzenlememek için öneriler istemcide sayısal `sonuc`tan yeniden türetilir.

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.journey", dil) }]} baslik={ceviri("nav.journey", dil)} />
      <KullaniciYolculukIstemci sonuc={sonuc} dil={dil} />
    </>
  );
}
