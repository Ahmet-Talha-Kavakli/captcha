"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function PanelError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <span className="grid size-16 place-items-center rounded-2xl bg-danger-soft text-danger2">
        <AlertTriangle className="size-8" />
      </span>
      <h2 className="mt-5 text-xl font-semibold text-slate-ink">Bir şeyler ters gitti</h2>
      <p className="mt-1.5 max-w-sm text-sm text-slate-muted">
        Bu sayfa yüklenirken beklenmeyen bir hata oluştu. Tekrar deneyebilir veya panele dönebilirsin.
      </p>
      <div className="mt-6 flex gap-2">
        <button onClick={reset} className="flex h-10 items-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-medium text-white transition hover:bg-brand-700">
          <RotateCcw className="size-4" /> Tekrar dene
        </button>
        <Link href="/panel" className="flex h-10 items-center rounded-xl border border-line-strong bg-white px-5 text-sm font-medium text-slate-ink transition hover:bg-canvas">
          Panele dön
        </Link>
      </div>
    </div>
  );
}
