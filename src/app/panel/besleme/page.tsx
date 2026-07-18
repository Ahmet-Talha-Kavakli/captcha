import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { PanelUst } from "@/components/panel/PanelUst";
import { IpRep } from "@/lib/db/db";
import {
  BESLEMELER,
  beslemeOzeti,
  tehditBeslemeEslestir,
  type BeslemeKaynak,
} from "@/lib/specter/threat-feed";
import { panelDil } from "@/lib/i18n/sunucu";
import { BeslemeIstemci } from "./BeslemeIstemci";
import { beslemeCeviri } from "./besleme.i18n";

export const metadata: Metadata = { title: "Tehdit Beslemeleri — Veylify" };

/** İstemciye giden, beslemeyle eşleşen kötü-niyetli IP satırı. */
export interface EslesenIpSatiri {
  id: string;
  ip: string;
  country: string;
  asn: string;
  threatScore: number;
  category: string;
  requests: number;
  blocked: number;
  /** Bu IP'nin uyduğu besleme kaynakları (rozet olarak gösterilir). */
  kaynaklar: { kaynak: BeslemeKaynak; ad: string; guven: number }[];
}

export default async function BeslemePage() {
  const user = await currentUser();
  if (!user) return null;

  const dil = await panelDil();

  // Sahibin GÖZLEMLEDİĞİ trafiğindeki kötü-niyetli IP'ler:
  // yüksek tehdit skoru VEYA temiz olmayan kategori.
  const kotuIpler = IpRep.forOwner().filter(
    (r) => r.threatScore >= 50 || r.category !== "clean",
  );

  // Her kötü IP'yi tehdit beslemeleriyle eşleştir; yalnızca gerçekten bir
  // beslemeye uyanları tabloya al.
  const eslesenler: EslesenIpSatiri[] = [];
  // Besleme kaynağı başına, sahibin trafiğinde kaç IP eşleşti.
  const kaynakSayac = new Map<BeslemeKaynak, number>();

  for (const r of kotuIpler) {
    const eslesme = tehditBeslemeEslestir(r.ip, r.asn);
    if (!eslesme.eslesti) continue;
    eslesenler.push({
      id: r.ip,
      ip: r.ip,
      country: r.country,
      asn: r.asn,
      threatScore: r.threatScore,
      category: r.category,
      requests: r.requests,
      blocked: r.blocked,
      kaynaklar: eslesme.kaynaklar,
    });
    for (const k of eslesme.kaynaklar) {
      kaynakSayac.set(k.kaynak, (kaynakSayac.get(k.kaynak) ?? 0) + 1);
    }
  }

  // Yüksek skordan düşüğe sırala (en tehlikeli üstte).
  eslesenler.sort((a, b) => b.threatScore - a.threatScore);

  const ozet = beslemeOzeti();

  // Her besleme kaydını, sahibin trafiğindeki eşleşme sayısıyla zenginleştir.
  const beslemeler = BESLEMELER.map((b) => ({
    kaynak: b.kaynak,
    ad: b.ad,
    aciklama: b.aciklama,
    guven: b.guven,
    guncellemeGun: b.guncellemeGun,
    kayitSayisi: b.kayitSayisi,
    seninEslesme: kaynakSayac.get(b.kaynak) ?? 0,
  }));

  return (
    <>
      <PanelUst
        kirintilar={[{ ad: beslemeCeviri("x.kirinti", dil) }]}
        baslik={beslemeCeviri("x.baslik", dil)}
      />
      <BeslemeIstemci
        dil={dil}
        beslemeler={beslemeler}
        eslesenler={eslesenler}
        ozet={ozet}
        toplamEslesenIp={eslesenler.length}
      />
    </>
  );
}
