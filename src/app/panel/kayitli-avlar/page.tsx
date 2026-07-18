import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { HAZIR_AVLAR, tumAvlariCalistir } from "./avlar";
import { avCeviri } from "./kayitli-avlar.i18n";
import { KayitliAvlarIstemci } from "./KayitliAvlarIstemci";

export const metadata: Metadata = { title: "Kayıtlı Avlar — Veylify" };

export default async function KayitliAvlarPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  // Avlar, sahibin GERÇEK olaylarına karşı gerçek DSL motoruyla çalışır.
  const events = Events.forOwner(user.id, 2000);
  const { sonuclar, ozet } = tumAvlariCalistir(HAZIR_AVLAR, events);

  // İstemciye yalnızca serileştirilebilir/gerekli alanları geçir.
  const sonuclarDto = sonuclar.map((s) => ({
    av: s.av,
    eslesme: s.eslesme,
    tetiklendi: s.tetiklendi,
    esik: s.esik,
    ornekler: s.ornekler.map((e) => ({
      id: e.id,
      ts: e.ts,
      ip: e.ip,
      country: e.country,
      asn: e.asn,
      ua: e.ua,
      path: e.path,
      botClass: e.botClass,
      verdict: e.verdict,
      score: e.score,
    })),
  }));

  const kirinti = ceviri("nav.savedhunts", dil);
  const baslik = avCeviri("ka.baslik", dil);

  return (
    <>
      <PanelUst kirintilar={[{ ad: kirinti }]} baslik={baslik} />
      <KayitliAvlarIstemci dil={dil} sonuclar={sonuclarDto} ozet={ozet} toplamOlay={events.length} />
    </>
  );
}
