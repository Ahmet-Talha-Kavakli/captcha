"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/ozellikler", label: "Özellikler" },
  { href: "/nasil-calisir", label: "Nasıl çalışır" },
  { href: "/cozumler", label: "Çözümler" },
  { href: "/fiyatlandirma", label: "Fiyatlar" },
  { href: "/demo", label: "Canlı demo" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300 relative",
        // Apple "liquid glass": her zaman blur + yarı-saydam beyaz zemin;
        // scroll'da daha opak + belirgin alt-border + yumuşak gölge.
        scrolled
          ? "border-b border-veylify-100/80 bg-white/70 shadow-[0_8px_30px_-12px_rgba(79,70,229,0.18)] backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-white/60"
          : "border-b border-transparent bg-white/40 backdrop-blur-md backdrop-saturate-150 supports-[backdrop-filter]:bg-white/30",
      )}
    >
      {/* üstte ince ışık çizgisi — cam kenarı hissi */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent transition-opacity duration-300",
          scrolled ? "opacity-100" : "opacity-0",
        )}
      />
      <nav
        className={cn(
          "mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 transition-all duration-300 lg:px-8",
          scrolled ? "py-3.5" : "py-5",
        )}
      >
        <Link href="/" className="flex items-center transition-transform hover:scale-[1.02]">
          <Logo size={scrolled ? 30 : 34} tone="dark" />
        </Link>

        <div className="hidden items-center gap-0.5 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-xl px-3.5 py-2.5 text-[15px] font-medium text-slate-600 transition hover:bg-veylify-50 hover:text-veylify-700"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2.5 md:flex">
          <Link
            href="/giris"
            className="rounded-xl px-3.5 py-2.5 text-[15px] font-medium text-slate-600 transition hover:text-veylify-700"
          >
            Giriş
          </Link>
          <Link
            href="/kayit"
            className="inline-flex items-center gap-1.5 rounded-full bg-veylify-600 px-5 py-2.5 text-[15px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(79,70,229,0.6)] transition hover:-translate-y-0.5 hover:bg-veylify-700"
          >
            Ücretsiz başla <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <button
          className="text-veylify-950 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
          aria-expanded={open}
          aria-controls="mobil-menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div id="mobil-menu" className="border-t border-veylify-100 bg-white/90 px-5 py-4 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-veylify-50"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-veylify-100 pt-3">
              <Link
                href="/giris"
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-veylify-50"
              >
                Giriş
              </Link>
              <Link
                href="/kayit"
                className="rounded-full bg-veylify-600 px-5 py-2.5 text-center text-sm font-semibold text-white"
              >
                Ücretsiz başla
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
