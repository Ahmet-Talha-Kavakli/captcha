"use client";

/**
 * DilDegistirici — Landing dil seçici (bayrak + açılır menü)
 * ==========================================================
 * Navbar'da yer alır. Seçilen dili `veylify_dil` cookie'sine yazar ve sayfayı
 * yeniler (router.refresh) → Server Component'ler landing'i yeni dilde render eder.
 * Otomatik IP-dil seçimi middleware'de; bu bileşen kullanıcının elle değiştirmesi
 * içindir (ve seçim, otomatik seçimi kalıcı olarak ezer).
 */
import { useState, useRef, useEffect } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import {
  LANDING_DILLER,
  LANDING_DIL_META,
  LANDING_DIL_COOKIE,
  type LandingDil,
} from "@/lib/i18n/landing";

export function DilDegistirici({ dil }: { dil: LandingDil }) {
  const [acik, setAcik] = useState(false);
  const kok = useRef<HTMLDivElement>(null);

  // Dışarı tıklama + Esc ile kapan.
  useEffect(() => {
    if (!acik) return;
    function tikla(e: MouseEvent) {
      if (kok.current && !kok.current.contains(e.target as Node)) setAcik(false);
    }
    function tus(e: KeyboardEvent) {
      if (e.key === "Escape") setAcik(false);
    }
    document.addEventListener("mousedown", tikla);
    document.addEventListener("keydown", tus);
    return () => {
      document.removeEventListener("mousedown", tikla);
      document.removeEventListener("keydown", tus);
    };
  }, [acik]);

  function sec(yeni: LandingDil) {
    document.cookie = `${LANDING_DIL_COOKIE}=${yeni}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    setAcik(false);
    // Dil değişince sayfayı tamamen yenile — tüm metinler (server + client)
    // yeni dilde kesin gelsin (kullanıcı isteği: otomatik refresh).
    if (yeni !== dil) window.location.reload();
  }

  const secili = LANDING_DIL_META[dil];

  return (
    <div ref={kok} className="relative">
      <button
        type="button"
        onClick={() => setAcik((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={acik}
        aria-label={`Dil: ${secili.ad}. Değiştirmek için aç`}
        className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[14px] font-medium text-slate-600 transition hover:bg-veylify-50 hover:text-veylify-700"
      >
        <Globe className="size-[18px]" />
        <span className="hidden sm:inline">{secili.bayrak}</span>
        <ChevronDown className={`size-3.5 transition ${acik ? "rotate-180" : ""}`} />
      </button>

      {acik && (
        <ul
          role="listbox"
          aria-label="Dil seçimi"
          className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-veylify-100 bg-white p-1.5 shadow-[0_20px_50px_-20px_rgba(79,70,229,0.35)]"
        >
          {LANDING_DILLER.map((k) => {
            const m = LANDING_DIL_META[k];
            const aktif = k === dil;
            return (
              <li key={k} role="option" aria-selected={aktif}>
                <button
                  type="button"
                  onClick={() => sec(k)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[14px] transition ${
                    aktif ? "bg-veylify-50 font-semibold text-veylify-700" : "text-slate-600 hover:bg-veylify-50/60"
                  }`}
                >
                  <span className="text-base leading-none">{m.bayrak}</span>
                  <span className="flex-1">{m.ad}</span>
                  {aktif && <Check className="size-4 text-veylify-600" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
