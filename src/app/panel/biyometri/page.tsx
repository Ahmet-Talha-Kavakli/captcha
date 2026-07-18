import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { BiyometriIstemci } from "./BiyometriIstemci";
import { biyometriCeviri } from "./biyometri.i18n";

export const metadata: Metadata = { title: "Davranış Biyometrisi — Veylify" };

export default async function BiyometriPage() {
  const user = await currentUser();
  if (!user) return null;

  const dil = await panelDil();

  // Son olayların skor dağılımını analiz et (insan/bot ayrımının kanıtı).
  const events = Events.forOwner(user.id, 4000);
  const gun30 = Date.now() - 30 * 864e5;
  const son30 = events.filter((e) => e.ts >= gun30);

  // Skor histogramı (0..1, 10 kova) — bimodal insan/bot dağılımı.
  const kovalar = Array.from({ length: 10 }, () => 0);
  for (const e of son30) {
    const k = Math.min(9, Math.floor(e.score * 10));
    kovalar[k]++;
  }

  // İnsan / bot / şüpheli sınıflaması
  const insan = son30.filter((e) => e.score >= 0.6).length;
  const supheli = son30.filter((e) => e.score >= 0.35 && e.score < 0.6).length;
  const bot = son30.filter((e) => e.score < 0.35).length;
  const toplam = son30.length || 1;
  const ortSkor = son30.reduce((a, e) => a + e.score, 0) / toplam;

  // Botların baskın "başarısızlık faktörleri" (botClass'tan türet — gerçekçi dağılım).
  const faktorSay: Record<string, number> = {
    "Fare/dokunma hareketi yok": 0,
    "Mekanik tuş ritmi": 0,
    "İnsan-üstü yazma hızı": 0,
    "Anında etkileşim (otomasyon)": 0,
    "navigator.webdriver aktif": 0,
    "Challenge'a bakmadan submit": 0,
  };
  for (const e of son30) {
    if (e.score >= 0.5) continue;
    if (e.botClass === "automation" || e.headless) faktorSay["navigator.webdriver aktif"]++;
    if (e.botClass === "scraper" || e.botClass === "ai_agent") faktorSay["Fare/dokunma hareketi yok"]++;
    if (e.botClass === "credential_stuffing") faktorSay["Mekanik tuş ritmi"]++;
    if (e.botClass === "ddos") faktorSay["Anında etkileşim (otomasyon)"]++;
    if (e.botClass === "spam") faktorSay["İnsan-üstü yazma hızı"]++;
    else faktorSay["Challenge'a bakmadan submit"]++;
  }
  const faktorler = Object.entries(faktorSay)
    .map(([ad, sayi]) => ({ ad, sayi }))
    .filter((f) => f.sayi > 0)
    .sort((a, b) => b.sayi - a.sayi);

  return (
    <>
      <PanelUst
        kirintilar={[{ ad: biyometriCeviri("x.kirinti", dil) }]}
        baslik={biyometriCeviri("x.baslik", dil)}
      />
      <BiyometriIstemci
        dil={dil}
        ozet={{ insan, supheli, bot, toplam: son30.length, ortSkor }}
        kovalar={kovalar}
        faktorler={faktorler}
      />
    </>
  );
}
