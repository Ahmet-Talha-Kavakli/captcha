import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { tehditAvi, AV_SABLONLARI, SORGU_ALANLARI } from "@/lib/specter/tehdit-avi";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { TehditAviIstemci } from "./TehditAviIstemci";

export const metadata: Metadata = { title: "Tehdit Avı — Veylify" };

export default async function TehditAviPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  // İlk yükte boş sorgu → son olaylar.
  const events = Events.forOwner(user.id, 3000);
  const ilk = tehditAvi("", events, 150);

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.threathunt", dil) }]} baslik={ceviri("nav.threathunt", dil)} />
      <TehditAviIstemci
        dil={dil}
        ilkSonuc={{
          eslesme: ilk.eslesme,
          toplam: ilk.toplam,
          ozet: ilk.ozet,
          olaylar: ilk.eslesmeler.map((e) => ({
            id: e.id, ts: e.ts, ip: e.ip, country: e.country, asn: e.asn, ua: e.ua,
            path: e.path, method: e.method, botClass: e.botClass, verdict: e.verdict,
            score: e.score, headless: !!e.headless, tls: !!e.tlsUaUyumsuz,
          })),
        }}
        sablonlar={AV_SABLONLARI}
        alanlar={[...SORGU_ALANLARI]}
      />
    </>
  );
}
