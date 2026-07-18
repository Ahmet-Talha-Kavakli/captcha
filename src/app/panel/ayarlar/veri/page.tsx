import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { yedekOlustur } from "@/lib/specter/backup";
import { PanelUst } from "@/components/panel/PanelUst";
import { VeriIstemci } from "./VeriIstemci";

export const metadata: Metadata = { title: "Veri & Yedekleme — Veylify" };

export default async function VeriPage() {
  const user = await currentUser();
  if (!user) return null;
  const kapsam = yedekOlustur(user.id).meta.kapsam;

  return (
    <>
      <PanelUst kirintilar={[{ ad: "Ayarlar", href: "/panel/ayarlar" }, { ad: "Veri & Yedekleme" }]} baslik="Veri & Yedekleme" />
      <VeriIstemci kapsam={kapsam} />
    </>
  );
}
