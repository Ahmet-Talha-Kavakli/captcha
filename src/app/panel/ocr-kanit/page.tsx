import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { tumOcrMetrikler, kareBirikimEgrisi, ocrKanitOzet } from "@/lib/specter/ocr-direnc";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { OcrKanitIstemci } from "./OcrKanitIstemci";

export const metadata: Metadata = { title: "OCR Direnç Kanıtı — Veylify" };

export default async function OcrKanitPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  const metrikler = tumOcrMetrikler();
  const ozet = ocrKanitOzet();
  const egriler = {
    low: kareBirikimEgrisi("low"),
    medium: kareBirikimEgrisi("medium"),
    high: kareBirikimEgrisi("high"),
  };

  const baslik = ceviri("nav.ocr", dil);

  return (
    <>
      <PanelUst kirintilar={[{ ad: baslik }]} baslik={baslik} />
      <OcrKanitIstemci metrikler={metrikler} ozet={ozet} egriler={egriler} dil={dil} />
    </>
  );
}
