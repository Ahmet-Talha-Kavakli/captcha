import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { koCeviri } from "./kullanim-olcum.i18n";
import {
  PLANLAR,
  PLAN_MAP,
  kullanimOlc,
  slaTakip,
  olcumOzet,
  faturaHesap,
  yukseltmeOneri,
  type OlcumPlan,
} from "./olcum";
import { KullanimOlcumIstemci } from "./KullanimOlcumIstemci";

export const metadata: Metadata = { title: "Kullanım & SLA — Veylify" };

/**
 * Hesabın gerçek plan kademesini (free/pro/scale) ölçüm-planına eşle.
 * Ölçüm/SLA kataloğu ile plans.ts kademesi hizalıdır:
 *   free → Başlangıç, pro → Büyüme, scale → Kurumsal.
 * Kullanıcıda kademe belirsizse "Büyüme" varsayılır (VARSAYIM olarak etiketlenir).
 */
function planEsle(userPlan: string): { plan: OlcumPlan; varsayim: boolean } {
  const map: Record<string, OlcumPlan["id"]> = { free: "baslangic", pro: "buyume", scale: "kurumsal" };
  const id = map[userPlan];
  if (id && PLAN_MAP.has(id)) return { plan: PLAN_MAP.get(id)!, varsayim: false };
  return { plan: PLAN_MAP.get("buyume")!, varsayim: true };
}

export default async function KullanimOlcumPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  const { plan, varsayim } = planEsle(user.plan);

  // GERÇEK olaylar — ölçümün tek kaynağı. ts-penceresi (limit-kesme YOK): günlük
  // seri ayın 1. gününe kadar gider; forOwner limiti en eski günleri kesip
  // yanlış "düz/sıfır" çizgi üretiyordu. Son 32 gün (bir aylık pencereyi kapsar).
  const now = Date.now();
  const events = Events.sonGunler(user.id, 32, now);

  const kullanim = kullanimOlc(events, plan);
  const sla = slaTakip(events, plan);
  const ozet = olcumOzet(kullanim, sla, plan);
  const fatura = faturaHesap(kullanim.projeksiyon, plan);
  const oneri = yukseltmeOneri(kullanim, plan);

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.metering", dil) }]} baslik={koCeviri("ko.baslik", dil)} />
      <KullanimOlcumIstemci
        dil={dil}
        planId={plan.id}
        planVarsayim={varsayim}
        kota={plan.aylikKota}
        planFiyat={plan.fiyat}
        asimBirimFiyat={plan.asimBirimFiyat}
        kullanim={kullanim}
        sla={sla}
        ozet={ozet}
        fatura={fatura}
        oneri={oneri}
        planlar={PLANLAR}
        toplamOlay={events.length}
      />
    </>
  );
}
