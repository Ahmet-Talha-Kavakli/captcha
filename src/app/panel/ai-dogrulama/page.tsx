import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { AI_AJANLAR, aiAjanTespit } from "@/lib/specter/ai-agents";
import { aiAjanDogrula } from "@/lib/specter/ai-verify";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { AiDogrulamaIstemci } from "./AiDogrulamaIstemci";
import { aiDogrulamaCeviri } from "./ai-dogrulama.i18n";

export const metadata: Metadata = { title: "AI Ajan Doğrulama — Veylify" };

export default async function AiDogrulamaPage() {
  const user = await currentUser();
  if (!user) return null;

  const dil = await panelDil();
  const baslik = aiDogrulamaCeviri("x.baslik", dil);

  // Gerçek olaylardan sahte-ajan taraması: UA bir AI ajanı iddia ediyor mu,
  // ediyorsa kaynak IP operatörle doğrulanıyor mu?
  const events = Events.forOwner(user.id, 2000);
  let toplamAiIddia = 0;
  let dogrulanan = 0;
  let sahte = 0;
  const sahteOrnekler: { ip: string; country: string; urun: string; ts: number; ua: string }[] = [];
  const ajanSayac: Record<string, { dogrulanan: number; sahte: number }> = {};

  for (const e of events) {
    const ajan = aiAjanTespit(e.ua.toLowerCase());
    if (!ajan) continue;
    toplamAiIddia++;
    // Not: gerçek trafik verisinde PTR yok; ip_aralik yöntemi IP ile net karar verir.
    const sonuc = aiAjanDogrula(ajan.id, ajan.dogrulama, e.ip, null);
    ajanSayac[ajan.id] ??= { dogrulanan: 0, sahte: 0 };
    if (sonuc.durum === "dogrulandi") {
      dogrulanan++;
      ajanSayac[ajan.id].dogrulanan++;
    } else if (sonuc.durum === "sahte") {
      sahte++;
      ajanSayac[ajan.id].sahte++;
      if (sahteOrnekler.length < 10) {
        sahteOrnekler.push({ ip: e.ip, country: e.country, urun: ajan.urun, ts: e.ts, ua: e.ua });
      }
    }
  }

  // Doğrulama kataloğu: her ajanın doğrulama yöntemi + gözlemlenen sahte/gerçek.
  const katalog = AI_AJANLAR.map((a) => ({
    id: a.id, urun: a.urun, operator: a.operator, kategori: a.kategori,
    dogrulama: a.dogrulama, logo: a.logo, ipYayin: a.ipYayin ?? null, risk: a.risk,
    gozlemDogrulanan: ajanSayac[a.id]?.dogrulanan ?? 0,
    gozlemSahte: ajanSayac[a.id]?.sahte ?? 0,
  }));

  return (
    <>
      <PanelUst kirintilar={[{ ad: baslik }]} baslik={baslik} />
      <AiDogrulamaIstemci
        dil={dil}
        toplamAiIddia={toplamAiIddia}
        dogrulanan={dogrulanan}
        sahte={sahte}
        sahteOrnekler={sahteOrnekler}
        katalog={katalog}
      />
    </>
  );
}
