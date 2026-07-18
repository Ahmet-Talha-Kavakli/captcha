/**
 * Topluluk İstihbaratı — sunucu sayfası.
 * =====================================
 * Kullanıcının GERÇEK gözlemlerinden (Events.forOwner) katkı yapabileceği
 * kötü niyetli IOC'leri türetir ve istemciye verir. Topluluk toplamı
 * istemcide topluluk.ts saf/deterministik fonksiyonlarıyla sentezlenir
 * (temsili — "simüle edilmiş topluluk ağı").
 */
import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { kendiKatkilar } from "@/lib/specter/topluluk";
import { ToplulukIstemci } from "./ToplulukIstemci";

export const metadata: Metadata = { title: "Topluluk İstihbaratı — Veylify" };

export default async function ToplulukPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  // GERÇEK: sahibin gözlemlediği kötü-karar / düşük-skor olaylarından katkılar.
  const olaylar = Events.forOwner(user.id, 2000);
  const katkilar = kendiKatkilar(olaylar);

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.community", dil) }]} baslik={ceviri("nav.community", dil)} />
      <ToplulukIstemci dil={dil} katkilar={katkilar} kullaniciAdi={user.name} />
    </>
  );
}
