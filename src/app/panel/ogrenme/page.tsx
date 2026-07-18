import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { OgrenmeIstemci } from "./OgrenmeIstemci";

export const metadata: Metadata = { title: "Öğrenme Merkezi — Veylify" };

export default async function OgrenmePage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  // Eğitim içeriği (icerik.ts) büyük teknik nesir VERİSİDİR ve TR kalır;
  // yalnızca UI çerçevesi (dil prop'uyla) istemcide çevrilir.
  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.learn", dil) }]} baslik={ceviri("nav.learn", dil)} />
      <OgrenmeIstemci dil={dil} />
    </>
  );
}
