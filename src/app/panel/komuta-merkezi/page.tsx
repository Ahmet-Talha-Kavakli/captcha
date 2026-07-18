import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { Events, Rules, IpRep } from "@/lib/db/db";
import { tehditFotoOlustur } from "./anlik";
import { KomutaMerkeziIstemci, type AkisOlay } from "./KomutaMerkeziIstemci";

export const metadata: Metadata = { title: "Komuta Merkezi — Veylify" };

/**
 * Komuta Merkezi (SOC Savaş Odası) — sunucu sayfası.
 * ==================================================
 * Aktif saldırı anında operatörün canlı tehdit fotoğrafını izleyip ANLIK
 * savunma aksiyonları aldığı tek-ekran komuta konsolu. Canli-konsol'dan farkı:
 * o pasif bir olay akışıdır; burası AKSIYON konsoludur (IP/ASN/ülke engelle,
 * savunma duruşu yükselt, senaryo karantinaya al, olay aç).
 *
 * Veri GERÇEK: Events.forOwner ile son 500 olayı çekip anlik.ts ile ilk tehdit
 * fotoğrafını (top saldırganlar, karar karışımı, senaryolar, DEFCON) hesaplar.
 * Canlı "akış" istemcide bu gerçek olayların interval ile yeniden oynatılması-
 * dır (trafik/canli-konsol deseni) — uydurma veri yok.
 */
export default async function KomutaMerkeziPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  // GERÇEK olaylar (en yeni başta) — hem fotoğraf hem canlı-replay kaynağı.
  const olaylar = Events.forOwner(user.id, 500);
  const ipRep = IpRep.forOwner();
  const kuralSayisi = Rules.forOwner(user.id).length;

  // İlk tehdit fotoğrafı (saf hesap; DB yazımı yok).
  const foto = tehditFotoOlustur(olaylar, ipRep);

  // Canlı akış için istemciye yalnızca gerekli alanları düz gönder. Akış
  // istemcide bu diziyi interval ile "yeniden oynatır" (gerçek olaylar).
  const akisOlaylari: AkisOlay[] = olaylar.map((e) => ({
    id: e.id,
    ts: e.ts,
    ip: e.ip,
    country: e.country,
    asn: e.asn,
    path: e.path,
    method: e.method,
    botClass: e.botClass,
    verdict: e.verdict,
    score: e.score,
  }));

  const baslik = ceviri("nav.commandcenter", dil);

  return (
    <>
      <PanelUst kirintilar={[{ ad: baslik }]} baslik={baslik} />
      <KomutaMerkeziIstemci
        foto={foto}
        akisOlaylari={akisOlaylari}
        kuralSayisi={kuralSayisi}
        dil={dil}
      />
    </>
  );
}
