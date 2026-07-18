import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Usage, Sites, Team, Users } from "@/lib/db/db";
import { KREDI_PAKETLERI } from "@/app/api/account/kredi/route";
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

  // Kredi: bakiye + son hareketler (satın alma/tüketim). Backend hazır.
  const krediBakiye = Users.krediBakiye(user.id);
  const krediHareketler = Users.krediGecmis(user.id, 8).map((h) => ({
    id: h.id,
    tur: h.tur,
    miktar: h.miktar,
    aciklama: h.aciklama,
    createdAt: h.createdAt,
  }));
  const krediPaketleri = KREDI_PAKETLERI.map((p) => ({
    id: p.id,
    ad: p.ad,
    kredi: p.kredi,
    fiyat: p.fiyat,
    populer: "populer" in p ? !!p.populer : false,
  }));

  return (
    <>
      <PanelUst kirintilar={[{ ad: "Ayarlar", href: "/panel/ayarlar" }, { ad: "Plan & Fatura" }]} baslik="Ayarlar" />
      <div className="mx-auto w-full max-w-4xl px-6 pt-6 pb-10 lg:px-10">
        <AyarlarSekme aktif="plan" />
        <div className="mt-6">
          <PlanIstemci
            plan={user.plan}
            kullanim={{ dogrulama, siteSayisi, ekipSayisi }}
            kredi={{ bakiye: krediBakiye, hareketler: krediHareketler, paketler: krediPaketleri }}
          />
        </div>
      </div>
    </>
  );
}
