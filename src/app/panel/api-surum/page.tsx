import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { ApiSurumIstemci } from "./ApiSurumIstemci";

export const metadata: Metadata = { title: "API Sürümleme — Veylify" };

/**
 * API Sürümleme & Değişiklik Günlüğü
 * -----------------------------------
 * Stripe/Twilio tarzı geliştirici referans yüzeyi: sürüm genel bakışı,
 * değişiklik günlüğü zaman çizelgesi, endpoint sürüm matrisi, kullanımdan
 * kaldırma bildirimleri + göç kılavuzları, "neler değişti" diff görünümü ve
 * sürüm sabitleme rehberi.
 *
 * İçerik büyük ölçüde STATİK/referans niteliktedir. Endpoint matrisi ve kod
 * örnekleri, src/app/api/v1/ altındaki GERÇEK public uçları (challenge /
 * passive / verify / siteverify) ve bunların gerçek yanıt alanlarını yansıtır.
 */
export default async function ApiSurumPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  // Başlık: paylaşılan nav sözlüğünden (5 dilde mevcut).
  const baslik = ceviri("nav.apiversion", dil);

  return (
    <>
      <PanelUst kirintilar={[{ ad: baslik }]} baslik={baslik} />
      <ApiSurumIstemci dil={dil} />
    </>
  );
}
