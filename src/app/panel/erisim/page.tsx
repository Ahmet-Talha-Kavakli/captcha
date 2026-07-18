import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { WCAG_KRITERLER } from "@/lib/specter/wcag";
import { ErisimIstemci } from "./ErisimIstemci";

export const metadata: Metadata = { title: "Erişilebilirlik & WCAG Uyumu — Veylify" };

export default async function ErisimPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  // Katalog saf/deterministik; sunucuda olduğu gibi istemciye geçirilir.
  // Ölçüt ad/açıklama/kanıt/öneri metinleri VERİ olarak TR kalır; UI çerçevesi
  // ve sınırlı etiket-eşlemeleri istemcide çevrilir.
  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.accessibility", dil) }]} baslik={ceviri("nav.accessibility", dil)} />
      <ErisimIstemci kriterler={WCAG_KRITERLER} dil={dil} />
    </>
  );
}
