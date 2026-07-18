import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { PanelUst } from "@/components/panel/PanelUst";
import { Events } from "@/lib/db/db";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { vakalariUret, ekipMetrikleri } from "./vaka";
import { EkipAkisIstemci } from "./EkipAkisIstemci";

export const metadata: Metadata = { title: "Ekip & Vakalar — Veylify" };

/**
 * SOC Ekip İş Akışı & Vaka Yönetimi — sunucu sayfası.
 * ===================================================
 * Tespit edilen tehditleri ATANABİLİR VAKALARA çevirir; sahip, durum yaşam
 * döngüsü, öncelik/SLA ve ekip performansı (MTTR/backlog) izler. Olay Müdahale
 * playbook'larının (mudahale) ÜZERİNE oturan KUYRUK/EKİP/VAKA katmanı — her
 * vaka bir playbook'a atıf yapar (/panel/mudahale).
 *
 * Veri: GERÇEK son 800 olay (Events.forOwner) yüksek-şiddetli kümelere ayrılıp
 * aday vakalara tohumlanır (vakalariUret, saf/deterministik). Ekip roster'ı ve
 * atamalar TEMSİLİ demo iş akışıdır; istemci bunu açıkça belirtir ve durumu
 * yalnızca localStorage'da tutar (üretim mutasyona uğramaz).
 */
export default async function EkipAkisPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  // GERÇEK olaylar — vakaları tohumlamak için.
  const olaylar = Events.forOwner(user.id, 800);
  const vakalar = vakalariUret(olaylar);
  const metrik = ekipMetrikleri(vakalar);

  const baslik = ceviri("nav.casework", dil);

  return (
    <>
      <PanelUst kirintilar={[{ ad: baslik }]} baslik={baslik} />
      <EkipAkisIstemci dil={dil} vakalar={vakalar} metrik={metrik} toplamOlay={olaylar.length} />
    </>
  );
}
