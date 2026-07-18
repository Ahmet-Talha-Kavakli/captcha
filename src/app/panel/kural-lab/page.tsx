import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Sites, Rules } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { KuralLabIstemci } from "./KuralLabIstemci";

export const metadata: Metadata = { title: "Kural Test Laboratuvarı — Veylify" };

/**
 * Kural Test Laboratuvarı (sunucu bileşeni)
 * =========================================
 * Gelişmiş kural-simülasyon oyun alanı. İstek bağlamını (IP/ülke/ASN/UA/…)
 * elle kur, sitenin GERÇEK kural motorundan geçir, hangi kuralların
 * tetiklendiğini + adım adım "neden bu karar" izini gör, çok sayıda
 * sentetik isteği toplu test et.
 *
 * Not: Mevcut /panel/test-alani widget/challenge akışına odaklı; burası
 * KURAL-DEĞERLENDİRME odaklı — birbirini tamamlar.
 */
export default async function KuralLabPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  // Site seçici için sahibin siteleri (yalnız id + ad).
  const siteler = Sites.forOwner(user.id).map((s) => ({ id: s.id, ad: s.name }));

  // Varsayılan site için aktif kural setini gönder — izmi anında dolu gelsin.
  const varsayilanSiteId = siteler[0]?.id ?? "";
  const kurallar = varsayilanSiteId
    ? Rules.forSite(varsayilanSiteId).map((r) => ({
        id: r.id,
        ad: r.name,
        aciklama: r.description,
        enabled: r.enabled,
        priority: r.priority,
        field: r.field,
        op: r.op,
        value: r.value,
        action: r.action,
        // Gelişmiş koşul ağacı varsa (v18) izde göstermek için özet metnini
        // istemcide üretmek üzere ham grubu da taşıyalım.
        kosulGrup: r.kosulGrup ?? null,
        system: r.system,
      }))
    : [];

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.rulelab", dil) }]} baslik={ceviri("nav.rulelab", dil)} />
      <KuralLabIstemci
        dil={dil}
        siteler={siteler}
        varsayilanSiteId={varsayilanSiteId}
        varsayilanKurallar={kurallar}
      />
    </>
  );
}
