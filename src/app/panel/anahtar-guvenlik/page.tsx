import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Tokens } from "@/lib/db/db";
import { anahtarGuvenlikAnaliz, anahtarOzet } from "@/lib/specter/anahtar-guvenlik";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { AnahtarGuvenlikIstemci } from "./AnahtarGuvenlikIstemci";
import { anahtarGuvenlikCeviri } from "./anahtar-guvenlik.i18n";

export const metadata: Metadata = { title: "Anahtar Güvenliği — Veylify" };

export default async function AnahtarGuvenlikPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  const bugun = Date.now();
  const tokens = Tokens.forOwner(user.id);
  const analizler = tokens.map((t) => anahtarGuvenlikAnaliz(t, bugun));
  const ozet = anahtarOzet(analizler);

  return (
    <>
      <PanelUst
        kirintilar={[{ ad: anahtarGuvenlikCeviri("ag.baslik", dil) }]}
        baslik={anahtarGuvenlikCeviri("ag.ustBaslik", dil)}
      />
      <AnahtarGuvenlikIstemci dil={dil} analizler={analizler} ozet={ozet} />
    </>
  );
}
