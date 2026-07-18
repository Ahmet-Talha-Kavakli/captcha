import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Usage, Sites, Team } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { AyarlarSekme } from "@/components/panel/AyarlarSekme";
import { PlanIstemci } from "./PlanIstemci";

export const metadata: Metadata = { title: "Plan & Fatura — Veylify" };

export default async function PlanPage() {
  const user = await currentUser();
  if (!user) return null;

  const usage = Usage.forOwner(user.id, 30);
  const dogrulama = usage.reduce((a, u) => a + u.issued, 0);
  const siteSayisi = Sites.forOwner(user.id).length;
  const ekipSayisi = Team.forOwner(user.id).filter((t) => t.status !== "invited").length;

  return (
    <>
      <PanelUst kirintilar={[{ ad: "Ayarlar", href: "/panel/ayarlar" }, { ad: "Plan & Fatura" }]} baslik="Ayarlar" />
      <div className="mx-auto w-full max-w-4xl px-6 pt-6 pb-10 lg:px-10">
        <AyarlarSekme aktif="plan" />
        <div className="mt-6">
          <PlanIstemci
            plan={user.plan}
            kullanim={{ dogrulama, siteSayisi, ekipSayisi }}
          />
        </div>
      </div>
    </>
  );
}
