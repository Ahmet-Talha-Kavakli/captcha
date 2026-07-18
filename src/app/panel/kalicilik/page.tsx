import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { kaliciSaldirganlar, kalicilikOzet } from "./kalici";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { KalicilikIstemci } from "./KalicilikIstemci";

export const metadata: Metadata = { title: "Kalıcılık Takibi — Veylify" };

export default async function KalicilikPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  // Gerçek olaylar — sahibin tüm sitelerinden, geniş zaman aralığı.
  const events = Events.forOwner(user.id, 3000);
  const saldirganlar = kaliciSaldirganlar(events);
  const ozet = kalicilikOzet(saldirganlar);

  // Başlık: paylaşılan nav sözlüğünden (5 dilde mevcut).
  const baslik = ceviri("nav.persistence", dil);

  return (
    <>
      <PanelUst kirintilar={[{ ad: baslik }]} baslik={baslik} />
      <KalicilikIstemci dil={dil} saldirganlar={saldirganlar.slice(0, 40)} ozet={ozet} />
    </>
  );
}
