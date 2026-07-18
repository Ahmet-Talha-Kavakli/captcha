import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { honeypotAnaliz } from "@/lib/specter/honeypot";
import { tuzakCeviri } from "./tuzak.i18n";
import { TuzakIstemci } from "./TuzakIstemci";

export const metadata: Metadata = { title: "Honeypot Tuzakları — Veylify" };

export default async function TuzakPage() {
  const user = await currentUser();
  if (!user) return null;

  const dil = await panelDil();
  const baslik = tuzakCeviri("hp.baslik", dil);

  // Gözlenen trafikten honeypot KAPSAMASINI çıkar (motor saftır; olay çekme
  // ve zaman burada, sunucu tarafında yapılır). Kullanıcı-izolasyonu:
  // yalnızca bu kullanıcının olayları.
  const events = Events.forOwner(user.id, 3000);
  const rapor = honeypotAnaliz(events);

  // Örnek site anahtarı — kullanıcının ilk sitesinin secretKey'i varsa onu
  // kullan; yoksa placeholder. (Sadece gömme kodu örneği için.)
  const siteKey = user.id ? `pk_${user.id.slice(0, 12)}` : "SITE_ANAHTARINIZ";

  return (
    <>
      <PanelUst kirintilar={[{ ad: baslik }]} baslik={baslik} />
      <TuzakIstemci
        tuzaklar={rapor.tuzaklar}
        ozet={rapor.ozet}
        siteKey={siteKey}
        dil={dil}
      />
    </>
  );
}
