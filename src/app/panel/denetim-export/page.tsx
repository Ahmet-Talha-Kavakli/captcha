import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Audit } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { zincirDogrula, ozetCikar, ndjsonUret, cefUret, jsonUret } from "@/lib/specter/audit-export";
import { DenetimExportIstemci } from "./DenetimExportIstemci";
import { exportCeviri } from "./denetim-export.i18n";

export const metadata: Metadata = { title: "Denetim Dışa-Aktarım — Veylify" };

export default async function DenetimExportPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  // Tüm denetim kayıtları (dışa-aktarım kapsamıyla aynı üst sınır).
  const kayitlar = Audit.forOwner(user.id, 5000);

  // Zincir bütünlüğü + özet SUNUCUDA hesaplanır (saf lib). İstemci yalnızca
  // sonuçları gösterir. Önizlemeler ilk birkaç satırla sınırlıdır.
  const zincir = zincirDogrula(kayitlar);
  const ozet = ozetCikar(kayitlar);

  const ndjsonOnizleme = ndjsonUret(kayitlar).split("\n").slice(0, 3).join("\n");
  const cefOnizleme = cefUret(kayitlar).split("\n").slice(0, 2).join("\n");
  const jsonOnizleme = jsonUret(kayitlar).split("\n").slice(0, 14).join("\n");

  // Genesis→son seq aralığı (kanıt başlığı için).
  const seqler = kayitlar
    .map((k) => k.seq)
    .filter((s): s is number => typeof s === "number")
    .sort((a, b) => a - b);
  const ilkSeq = seqler.length ? seqler[0] : null;
  const sonSeq = seqler.length ? seqler[seqler.length - 1] : null;

  return (
    <>
      <PanelUst
        kirintilar={[{ ad: ceviri("nav.audit", dil), href: "/panel/denetim" }, { ad: exportCeviri("de.kirintiSiem", dil) }]}
        baslik={exportCeviri("de.baslik", dil)}
      />
      <DenetimExportIstemci
        dil={dil}
        zincir={zincir}
        ozet={ozet}
        ilkSeq={ilkSeq}
        sonSeq={sonSeq}
        onizlemeler={{ ndjson: ndjsonOnizleme, cef: cefOnizleme, json: jsonOnizleme }}
      />
    </>
  );
}
