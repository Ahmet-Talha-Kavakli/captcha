import type { Metadata } from "next";
import { FiyatIcerik } from "./FiyatIcerik";
import { MARKA } from "@/lib/marka";

export const metadata: Metadata = {
  title: "Fiyatlandırma",
  description:
    "Veylify fiyatlandırması: Başlangıç ₺0, Büyüme ₺990/ay, Ölçek özel. Plan karşılaştırma tablosu, SSS ve kredi kartı gerektirmeyen ücretsiz başlangıç.",
  alternates: { canonical: "/fiyatlandirma" },
  openGraph: {
    title: `Fiyatlandırma — ${MARKA.ad}`,
    description:
      "Başlangıç ₺0, Büyüme ₺990/ay, Ölçek özel. Kredi kartı gerektirmeyen ücretsiz başlangıç.",
    url: `${MARKA.url}/fiyatlandirma`,
    type: "website",
    locale: "tr_TR",
    siteName: MARKA.ad,
  },
};

export default function FiyatlandirmaPage() {
  return <FiyatIcerik />;
}
