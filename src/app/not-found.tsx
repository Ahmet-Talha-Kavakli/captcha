import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-6 text-center">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-veylify-100/70 to-violet-100/50 blur-3xl" />
      <div className="relative">
        <div className="flex justify-center">
          <Logo size={32} tone="dark" />
        </div>
        <div className="mt-10 bg-gradient-to-r from-veylify-600 to-violet-600 bg-clip-text text-[88px] font-extrabold leading-none tracking-tight text-transparent">
          404
        </div>
        <h1 className="mt-2 text-2xl font-bold text-veylify-950">Sayfa bulunamadı</h1>
        <p className="mx-auto mt-3 max-w-md text-slate-500">
          Aradığın sayfa taşınmış veya hiç var olmamış olabilir.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-veylify-600 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-veylify-700"
          >
            Ana sayfaya dön
          </Link>
          <Link
            href="/panel"
            className="rounded-full border border-veylify-200 bg-white px-6 py-3 text-sm font-semibold text-veylify-700 transition hover:bg-veylify-50"
          >
            Panele git
          </Link>
        </div>
      </div>
    </div>
  );
}
