import type { Metadata } from "next";
import { Suspense } from "react";
import { MARKA } from "@/lib/marka";
import { DemoClient } from "./DemoClient";

export const metadata: Metadata = {
  title: `Canlı Demo — ${MARKA.ad}`,
  description:
    "Ghost-font CAPTCHA'yı, makine-vs-insan testini, AI ajan simülatörünü ve davranış biyometrisini kendin dene. Gerçek koruma katmanı, tarayıcında canlı.",
  alternates: { canonical: "/demo" },
};

export default function DemoPage() {
  return (
    <Suspense>
      <DemoClient />
    </Suspense>
  );
}
