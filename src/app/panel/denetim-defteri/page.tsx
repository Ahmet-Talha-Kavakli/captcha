import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { ornekKayitlar, defterKur, defterDogrula } from "@/lib/specter/denetim-defteri";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { DenetimDefteriIstemci } from "./DenetimDefteriIstemci";
import { defterCeviri } from "./denetim-defteri.i18n";

export const metadata: Metadata = { title: "Değişmezlik Defteri — Veylify" };

export default async function DenetimDefteriPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  // "Şimdi" referansı gerçek en-son olaydan; kayıtlar temsili denetim izidir.
  const events = Events.forOwner(user.id, 100);
  const enSonTs = events.length ? Math.max(...events.map((e) => e.ts)) : 1_700_000_000_000;
  const kayitlar = ornekKayitlar(enSonTs, 28, user.email || "demo@veylify.com");
  const zincir = defterKur(kayitlar);
  const dogrulama = defterDogrula(zincir);

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.ledger", dil) }]} baslik={defterCeviri("dd.baslik", dil)} />
      <DenetimDefteriIstemci zincir={zincir} dogrulama={dogrulama} dil={dil} />
    </>
  );
}
