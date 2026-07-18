import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { Events } from "@/lib/db/db";
import {
  ulkeYogunluk,
  zamanDilimleri,
  bolgeselOzet,
  geoIsiOzet,
  type GeoOlay,
} from "@/lib/specter/geo-isi";
import { GeoIsiIstemci } from "./GeoIsiIstemci";

export const metadata: Metadata = { title: "Coğrafi Isı Haritası — Veylify" };

/**
 * Coğrafi Tehdit Isı Haritası — sunucu sayfası.
 * ==============================================
 * Son olayları çeker, geo-isi motoruyla ülke/bölge yoğunluğuna ve zaman
 * dilimlerine dönüştürüp istemciye verir. İstemci bunları choropleth-benzeri
 * bir dünya ısı haritası + drill-down + zaman kaydırıcısı olarak çizer.
 *
 * NOT: Bu, /panel/harita'daki canlı saldırı haritasından FARKLIDIR — orası
 * anlık PoP işaretçileri/yaylar gösterir; burası gözlemlenen trafiğin coğrafi
 * YOĞUNLUK ısı haritası (deterministik, zaman-evrimli, drill-down'lı).
 */
export default async function GeoIsiPage() {
  const user = await currentUser();
  if (!user) return null;

  const dil = await panelDil();

  // Son 2000 olay (ısı haritası + zaman dilimleri için yeterli geçmiş).
  const ham = Events.forOwner(user.id, 2000);
  const olaylar: GeoOlay[] = ham.map((e) => ({
    ts: e.ts,
    country: e.country,
    asn: e.asn,
    botClass: e.botClass,
    verdict: e.verdict,
    score: e.score,
  }));

  // Zamanla ilgili her hesap için deterministik referans (motor SAF, bugun'ü
  // burada — sunucuda — bir kez belirleriz).
  const bugun = Date.now();

  const ulkeler = ulkeYogunluk(olaylar);
  const bolgeler = bolgeselOzet(ulkeler);
  const ozet = geoIsiOzet(ulkeler, bolgeler);
  const zaman = zamanDilimleri(olaylar, bugun, 8, 7);

  return (
    <>
      <PanelUst
        kirintilar={[{ ad: ceviri("nav.geoheat", dil) }]}
        baslik={ceviri("nav.geoheat", dil)}
      />
      <GeoIsiIstemci
        ulkeler={ulkeler}
        bolgeler={bolgeler}
        ozet={ozet}
        zaman={zaman}
        dil={dil}
      />
    </>
  );
}
