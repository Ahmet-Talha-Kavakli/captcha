import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { AI_AJANLAR, aiAjanTespit } from "@/lib/specter/ai-agents";
import { AiAjanlarIstemci } from "./AiAjanlarIstemci";
import { aiajanlarCeviri } from "./aiajanlar.i18n";

export const metadata: Metadata = { title: "AI Ajan İstihbaratı — Veylify" };

export default async function AiAjanlarPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  // Son olaylardan gerçek AI ajan trafiğini türet (UA eşleştirme).
  const events = Events.forOwner(user.id, 8000);
  const simdi = Date.now();
  const gun30 = simdi - 30 * 864e5;
  const gun7 = simdi - 7 * 864e5;

  // ajanId → istatistik
  const istat: Record<string, { toplam: number; son7: number; engellenen: number; dogrulanan: number; izin: number; sonGorulme: number; yollar: Record<string, number> }> = {};
  for (const a of AI_AJANLAR) istat[a.id] = { toplam: 0, son7: 0, engellenen: 0, dogrulanan: 0, izin: 0, sonGorulme: 0, yollar: {} };

  let aiToplam = 0;
  for (const e of events) {
    if (e.ts < gun30) continue;
    const ajan = aiAjanTespit((e.ua || "").toLowerCase());
    if (!ajan) continue;
    aiToplam++;
    const s = istat[ajan.id];
    s.toplam++;
    if (e.ts >= gun7) s.son7++;
    if (e.verdict === "blocked") s.engellenen++;
    else if (e.verdict === "challenged") s.dogrulanan++;
    else s.izin++;
    if (e.ts > s.sonGorulme) s.sonGorulme = e.ts;
    s.yollar[e.path] = (s.yollar[e.path] || 0) + 1;
  }

  // Ajan başına en çok vurulan yol
  const veri = AI_AJANLAR.map((a) => {
    const s = istat[a.id];
    const enYol = Object.entries(s.yollar).sort((x, y) => y[1] - x[1])[0]?.[0] || null;
    return {
      ...a,
      istat: { toplam: s.toplam, son7: s.son7, engellenen: s.engellenen, dogrulanan: s.dogrulanan, izin: s.izin, sonGorulme: s.sonGorulme || null, enYol },
      politika: user.aiPolicies?.[a.id] || a.onerilenPolitika,
    };
  });

  const aktifSayi = veri.filter((v) => v.istat.toplam > 0).length;
  const engellenenToplam = veri.reduce((t, v) => t + v.istat.engellenen, 0);
  const egitimTrafik = veri.filter((v) => v.kategori === "model_egitimi").reduce((t, v) => t + v.istat.toplam, 0);

  return (
    <>
      <PanelUst
        kirintilar={[{ ad: aiajanlarCeviri("ai.baslik", dil) }]}
        baslik={aiajanlarCeviri("ai.baslik", dil)}
      />
      <AiAjanlarIstemci
        veri={veri}
        ozet={{ aiToplam, aktifSayi, engellenenToplam, egitimTrafik, toplamKatalog: AI_AJANLAR.length }}
        dil={dil}
      />
    </>
  );
}
