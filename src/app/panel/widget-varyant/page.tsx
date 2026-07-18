import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { WidgetVaryantIstemci } from "./WidgetVaryantIstemci";

export const metadata: Metadata = { title: "Widget Varyantları — Veylify" };

/**
 * Widget Görsel Varyant Stüdyosu (sunucu kabuğu).
 * ------------------------------------------------
 * Aracın kendisi tamamen istemci tarafındadır (canvas render, localStorage,
 * canlı önizleme). Sunucu yalnızca oturumu doğrular ve breadcrumb'ı basar.
 */
export default async function WidgetVaryantPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  const baslik = ceviri("nav.widgetstudio", dil);

  return (
    <>
      <PanelUst kirintilar={[{ ad: baslik }]} baslik={baslik} />
      <WidgetVaryantIstemci dil={dil} />
    </>
  );
}
