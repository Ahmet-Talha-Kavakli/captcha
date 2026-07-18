import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Integrations } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { bkCeviri } from "./bildirim-kanali.i18n";
import { BildirimKanaliIstemci } from "./BildirimKanaliIstemci";

export const metadata: Metadata = { title: "Bildirim Kanalları & Kuralları — Veylify" };

/**
 * Bildirim Kanalları & Kuralları (sunucu sayfası)
 * ================================================
 * Specter'ın seni NEREDEN ve NE ZAMAN uyaracağını yapılandırır. Kanal
 * tercihleri, olay-tipi yönlendirmesi, şiddet eşiği, sessiz saatler ve
 * gerçek masaüstü (tarayıcı) bildirim izni buradan yönetilir.
 *
 * Not: DB şeması dokunulmaz olduğundan tercihler istemci tarafında
 * localStorage'da tutulur (dürüst ve bir ayar ekranı için yeterli). Burada
 * yalnızca bağlı entegrasyon kanallarını (Slack/Discord/webhook…) istemciye
 * geçiriyoruz; teslimat hedefleri bunlar.
 */
export default async function BildirimKanaliPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  // Bağlı entegrasyonları teslimat kanalı olarak istemciye taşı (salt-okunur).
  const entegrasyonlar = Integrations.forOwner(user.id).map((i) => ({
    id: i.id,
    tur: i.tur,
    ad: i.ad,
    hedef: i.hedef,
    aktif: i.aktif,
  }));

  const baslik = bkCeviri("bk.baslik", dil);

  return (
    <>
      <PanelUst kirintilar={[{ ad: baslik }]} baslik={baslik} />
      <BildirimKanaliIstemci entegrasyonlar={entegrasyonlar} eposta={user.email} dil={dil} />
    </>
  );
}
