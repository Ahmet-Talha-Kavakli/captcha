"use client";

import Link from "next/link";
import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Production'da hata izleme servisine gönderilebilir.
    console.error(error);
  }, [error]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-6 text-center">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-veylify-100/70 to-violet-100/50 blur-3xl" />
      <div className="relative">
        <div className="flex justify-center">
          <Logo size={32} tone="dark" />
        </div>
        <div className="mt-10 bg-gradient-to-r from-veylify-600 to-violet-600 bg-clip-text text-[72px] font-extrabold leading-none tracking-tight text-transparent">
          Bir şeyler ters gitti
        </div>
        <p className="mx-auto mt-3 max-w-md text-slate-500">
          Beklenmeyen bir hata oluştu. Tekrar deneyebilir ya da ana sayfaya
          dönebilirsin. Sorun devam ederse destek ekibimizle iletişime geç.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-[12px] text-slate-400">Hata kodu: {error.digest}</p>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full bg-veylify-600 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-veylify-700"
          >
            <RefreshCw className="size-4" /> Tekrar dene
          </button>
          <Link
            href="/"
            className="rounded-full border border-veylify-200 bg-white px-6 py-3 text-sm font-semibold text-veylify-700 transition hover:bg-veylify-50"
          >
            Ana sayfaya dön
          </Link>
        </div>
      </div>
    </div>
  );
}
