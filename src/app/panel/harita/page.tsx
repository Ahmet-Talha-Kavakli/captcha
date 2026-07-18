import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { PanelUst } from "@/components/panel/PanelUst";
import { Events } from "@/lib/db/db";
import type { BotClass } from "@/lib/db/schema";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { HaritaIstemci, type UlkeVeri } from "./HaritaIstemci";

export const metadata: Metadata = { title: "Canlı Saldırı Haritası — Veylify" };

/**
 * Canlı Saldırı Haritası (SOC "harekat odası") — sunucu sayfası.
 * Son olayları ülkeye göre toplayıp istemciye verir; istemci bunları
 * dünya haritası, saldırı yayları ve canlı akışla görselleştirir.
 */
export default async function HaritaPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  // Son 1000 olayı çek, ülkeye göre topla.
  const olaylar = Events.forOwner(user.id, 1000);

  interface Toplayici {
    country: string;
    toplam: number;
    blocked: number;
    challenged: number;
    botSayac: Record<string, number>;
    sonTs: number;
  }
  const ulkeMap = new Map<string, Toplayici>();

  for (const e of olaylar) {
    const kod = (e.country || "").toUpperCase();
    if (!kod) continue;
    let t = ulkeMap.get(kod);
    if (!t) {
      t = { country: kod, toplam: 0, blocked: 0, challenged: 0, botSayac: {}, sonTs: 0 };
      ulkeMap.set(kod, t);
    }
    t.toplam++;
    if (e.verdict === "blocked") t.blocked++;
    else if (e.verdict === "challenged") t.challenged++;
    // İnsan/iyi-bot dışındaki sınıfları "tehdit sınıfı" olarak say (dominant tespiti için).
    if (e.botClass !== "human" && e.botClass !== "good_bot") {
      t.botSayac[e.botClass] = (t.botSayac[e.botClass] ?? 0) + 1;
    }
    if (e.ts > t.sonTs) t.sonTs = e.ts;
  }

  const ulkeler: UlkeVeri[] = [...ulkeMap.values()]
    .map((t) => {
      // Baskın bot sınıfı (yoksa, olayların içindeki en yaygın sınıf).
      let dominant: BotClass = "automation";
      let enCok = -1;
      for (const [cls, n] of Object.entries(t.botSayac)) {
        if (n > enCok) {
          enCok = n;
          dominant = cls as BotClass;
        }
      }
      const tehditli = t.blocked + t.challenged;
      const tehditOran = t.toplam > 0 ? tehditli / t.toplam : 0;
      return {
        country: t.country,
        toplam: t.toplam,
        blocked: t.blocked,
        challenged: t.challenged,
        dominantBotClass: enCok >= 0 ? dominant : "human",
        tehditOran,
      };
    })
    .sort((a, b) => b.toplam - a.toplam);

  const toplamOlay = ulkeler.reduce((a, u) => a + u.toplam, 0);
  const toplamBlocked = ulkeler.reduce((a, u) => a + u.blocked, 0);
  const enAktif = ulkeler[0] ?? null;

  const baslik = ceviri("nav.map", dil);

  return (
    <>
      <PanelUst kirintilar={[{ ad: baslik }]} baslik={baslik} />
      <HaritaIstemci
        dil={dil}
        ulkeler={ulkeler}
        toplamOlay={toplamOlay}
        toplamBlocked={toplamBlocked}
        toplamUlke={ulkeler.length}
        enAktifUlke={enAktif ? { country: enAktif.country, toplam: enAktif.toplam } : null}
      />
    </>
  );
}
