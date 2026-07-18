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
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-veylify-100 bg-white/85 backdrop-blur-xl"
          : "bg-transparent",
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 lg:px-8">
        <Link href="/" className="flex items-center">
          <Logo size={28} tone="dark" />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-veylify-50 hover:text-veylify-700"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/giris"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:text-veylify-700"
          >
            Giriş
          </Link>
          <Link
            href="/kayit"
            className="inline-flex items-center gap-1.5 rounded-full bg-veylify-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(79,70,229,0.6)] transition hover:-translate-y-0.5 hover:bg-veylify-700"
          >
            Ücretsiz başla <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <button
          className="text-veylify-950 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-veylify-100 bg-white px-5 py-4 md:hidden">
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
