"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Menu, X, ArrowRight, LayoutDashboard } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/cn";
import { DilDegistirici } from "./DilDegistirici";
import { landingCeviri, LANDING_VARSAYILAN, type LandingDil } from "@/lib/i18n/landing";

/** Giriş yapılmışsa navbar'da gösterilecek oturum bilgisi. */
export type NavOturum = {
  isim: string;
  avatarUrl: string | null;
  avatarColor: string;
} | null;

/** Profil avatarı — Google/Clerk resmi varsa onu, yoksa isim baş harfi + renk. */
function Avatar({ oturum, boyut = 34 }: { oturum: NonNullable<NavOturum>; boyut?: number }) {
  const basHarf = oturum.isim.trim().charAt(0).toUpperCase() || "?";
  if (oturum.avatarUrl) {
    return (
      <Image
        src={oturum.avatarUrl}
        alt={oturum.isim}
        width={boyut}
        height={boyut}
        className="rounded-full object-cover ring-2 ring-white shadow-sm"
      />
    );
  }
  return (
    <span
      className="grid place-items-center rounded-full text-[13px] font-bold text-white ring-2 ring-white shadow-sm"
      style={{ width: boyut, height: boyut, background: oturum.avatarColor }}
    >
      {basHarf}
    </span>
  );
}

const LINKS = [
  { href: "/features", anahtar: "nav.ozellikler" },
  { href: "/how-it-works", anahtar: "nav.nasil" },
  { href: "/solutions", anahtar: "nav.cozumler" },
  { href: "/pricing", anahtar: "nav.fiyat" },
  { href: "/demo", anahtar: "nav.demo" },
];

export function Navbar({ dil = LANDING_VARSAYILAN, oturum = null }: { dil?: LandingDil; oturum?: NavOturum }) {
  const t = (k: string) => landingCeviri(k, dil);
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
          scrolled ? "py-4" : "py-6",
        )}
      >
        <Link href="/" className="flex items-center transition-transform hover:scale-[1.02]">
          <Logo size={scrolled ? 34 : 40} tone="dark" />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-xl px-4 py-2.5 text-[16px] font-medium text-slate-600 transition hover:bg-veylify-50 hover:text-veylify-700"
            >
              {t(l.anahtar)}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2.5 md:flex">
          <DilDegistirici dil={dil} />
          {oturum ? (
            // Giriş yapılmış → profil avatarı + Panel butonu
            <Link
              href="/panel"
              className="inline-flex items-center gap-2.5 rounded-full border border-veylify-200 bg-white/70 py-1.5 pl-2 pr-4 text-[15px] font-semibold text-veylify-950 shadow-sm transition hover:-translate-y-0.5 hover:border-veylify-300 hover:bg-white"
            >
              <Avatar oturum={oturum} boyut={30} />
              <span className="hidden lg:inline">{t("nav.panel")}</span>
              <LayoutDashboard className="h-4 w-4 text-veylify-600 lg:hidden" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl px-4 py-2.5 text-[16px] font-medium text-slate-600 transition hover:text-veylify-700"
              >
                {t("nav.giris")}
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-1.5 rounded-full bg-veylify-600 px-6 py-3 text-[16px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(79,70,229,0.6)] transition hover:-translate-y-0.5 hover:bg-veylify-700"
              >
                {t("nav.basla")} <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
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
                {t(l.anahtar)}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-veylify-100 pt-3">
              <div className="px-1 pb-1"><DilDegistirici dil={dil} /></div>
              {oturum ? (
                <Link
                  href="/panel"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg border border-veylify-200 bg-white px-3 py-2.5 text-sm font-semibold text-veylify-950"
                >
                  <Avatar oturum={oturum} boyut={28} />
                  {t("nav.panel")}
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-veylify-50"
                  >
                    {t("nav.giris")}
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setOpen(false)}
                    className="rounded-full bg-veylify-600 px-5 py-2.5 text-center text-sm font-semibold text-white"
                  >
                    {t("nav.basla")}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
