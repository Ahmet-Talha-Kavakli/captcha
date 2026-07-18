import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { tlsIstihbarat } from "@/lib/specter/tls-istihbarat";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { TlsIstihbaratIstemci } from "./TlsIstihbaratIstemci";
import { tlsCeviri } from "./tls-istihbarat.i18n";

export const metadata: Metadata = { title: "TLS Parmak İzi İstihbaratı — Veylify" };

export default async function TlsIstihbaratPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  const events = Events.forOwner(user.id, 3000);
  const sonuc = tlsIstihbarat(events);

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.tls", dil) }]} baslik={tlsCeviri("tls.baslik", dil)} />
      <TlsIstihbaratIstemci kumeler={sonuc.kumeler.slice(0, 40)} ozet={sonuc.ozet} dil={dil} />
    </>
  );
}
