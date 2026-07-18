import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { katmanAnaliz, derinlikOzet } from "./katman";
import { SavunmaDerinligiIstemci } from "./SavunmaDerinligiIstemci";

export const metadata: Metadata = { title: "Savunma Derinliği — Veylify" };

export default async function SavunmaDerinligiPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  // Sahibin son olayları üzerinden saf/deterministik katmanlı huni analizi.
  const olaylar = Events.forOwner(user.id, 3000);
  const katmanlar = katmanAnaliz(olaylar);
  // Toplam tehdit = ilk katmanın gireni (huni tüm tehditleri baştan görür).
  const toplamTehdit = katmanlar.length ? katmanlar[0].giren : 0;
  const ozet = derinlikOzet(katmanlar, toplamTehdit);

  const baslik = ceviri("nav.defenselayers", dil);

  return (
    <>
      <PanelUst kirintilar={[{ ad: baslik }]} baslik={baslik} />
      <SavunmaDerinligiIstemci katmanlar={katmanlar} ozet={ozet} dil={dil} />
    </>
  );
}
