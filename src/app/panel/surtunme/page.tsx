import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Usage, Events } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import {
  cozumHunisi,
  surtunmeSkoru,
  insanCozumTahmin,
  gunlukTrend,
  zorlukSurtunme,
  modellenmisOrtSure,
} from "@/lib/specter/surtunme";
import { planTanim } from "@/lib/specter/plans";
import { SurtunmeIstemci } from "./SurtunmeIstemci";

export const metadata: Metadata = { title: "Sürtünme Analizi — Veylify" };

/**
 * Sürtünme Analizi (server) — CAPTCHA sürtünme & çözüm UX-kalite konsolu.
 * Tüm ağır hesap SAF motorda (surtunme.ts) yapılır; burada yalnızca veri
 * çekilir ve istemciye serileştirilebilir düz nesne olarak aktarılır.
 */
export default async function SurtunmePage() {
  const user = await currentUser();
  if (!user) return null;

  const dil = await panelDil();

  // Gerçek sayaçlar (son 30 gün) ve son olaylar.
  const usage = Usage.forOwner(user.id, 30);
  const events = Events.forOwner(user.id, 1500);

  // Çözüm hunisi + insan çözüm tahmini + modellenmiş ortalama süre.
  const huni = cozumHunisi(usage);
  const insan = insanCozumTahmin(events);
  const ortSure = modellenmisOrtSure(events);

  // Sürtünme skoru (süre modellenmiş olduğundan dahil edilir).
  const surtunme = surtunmeSkoru(huni.cozumOran, huni.terkOran, ortSure);

  // Günlük trend + zorluk-bazlı sürtünme tablosu.
  const trend = gunlukTrend(usage);
  const zorluk = zorlukSurtunme();
  // ÖNERİLER: Motorun `oneriler` çıktısı TR metin içerir. Motoru düzenlememek
  // için öneriler istemcide sayısal veriden (huni/surtunme/insan) yeniden türetilir.

  const plan = planTanim(user.plan);

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.friction", dil) }]} baslik={ceviri("nav.friction", dil)} />
      <SurtunmeIstemci
        huni={huni}
        surtunme={surtunme}
        insan={insan}
        ortSure={ortSure}
        trend={trend}
        zorluk={zorluk}
        planAd={plan.ad}
        dil={dil}
      />
    </>
  );
}
