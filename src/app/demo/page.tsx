import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { DemoClient } from "./DemoClient";

export const metadata: Metadata = { title: "Canlı Demo — Veylify" };

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-abyss-950">
      <div className="mx-auto max-w-5xl px-5 py-8 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white/60 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" /> <Logo size={24} tone="light" />
          </Link>
          <Link
            href="/kayit"
            className="rounded-full bg-specter-500 px-5 py-2 text-sm font-semibold text-[#04222b] transition hover:bg-specter-400"
          >
            Ücretsiz başla
          </Link>
        </div>
        <main>
          <Suspense>
            <DemoClient />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
