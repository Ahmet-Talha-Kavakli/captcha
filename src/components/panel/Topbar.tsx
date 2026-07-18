"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { Bell, Code2, MessageCircle, Mail, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";
import { usePanelDil } from "@/lib/i18n/istemci";
import type { Dil } from "@/lib/i18n/panel";
import { useDisari, Tooltip } from "./kit";
import { GlobalArama } from "./GlobalArama";

interface Kirinti {
  ad: string;
  href?: string;
}
interface Bildirim {
  id: string;
  severity: string;
  title: string;
  message: string;
  ts: number;
  read: boolean;
}

/**
 * Tavily-stil topbar: breadcrumb (Pages / X) + büyük sayfa başlığı solda,
 * sağda "Operational" durum pill + sosyal ikonlar + bildirim + tema toggle.
 */
export function Topbar({
  kirintilar,
  baslik,
  bildirimler,
  dil: baslangicDil,
}: {
  kirintilar: Kirinti[];
  baslik: string;
  bildirimler: Bildirim[];
  dil?: Dil;
}) {
  const [bildirimAcik, setBildirimAcik] = useState(false);
  const [notlar, setNotlar] = useState(bildirimler);
  const bildirimRef = useDisari<HTMLDivElement>(() => setBildirimAcik(false));
  const okunmamis = notlar.filter((b) => !b.read).length;
  const { ceviri: t } = usePanelDil(baslangicDil);

  // Koyu tema — GERÇEK çalışır: localStorage'dan okunur, <html data-theme>
  // ile tüm panel token'ları koyulaşır. Landing etkilenmez.
  const [koyu, setKoyu] = useState(false);
  useEffect(() => {
    const kayitli = localStorage.getItem("veylify-tema");
    const aktif =
      kayitli === "dark" ||
      (kayitli === null && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
    setKoyu(aktif);
    document.documentElement.setAttribute("data-theme", aktif ? "dark" : "light");
  }, []);
  const temaDegistir = useCallback(() => {
    setKoyu((v) => {
      const yeni = !v;
      const kod = yeni ? "dark" : "light";
      document.documentElement.classList.add("tema-gecis");
      document.documentElement.setAttribute("data-theme", kod);
      localStorage.setItem("veylify-tema", kod);
      window.setTimeout(() => document.documentElement.classList.remove("tema-gecis"), 350);
      return yeni;
    });
  }, []);

  async function tumunuOku() {
    setNotlar((p) => p.map((b) => ({ ...b, read: true })));
    await fetch("/api/alerts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) });
  }

  return (
    <div className="sticky top-0 z-40 border-b border-line/60 bg-canvas/70 backdrop-blur-xl backdrop-saturate-150">
    <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4 pl-16 lg:px-10 lg:pl-10">
      {/* sol: breadcrumb + büyük başlık */}
      <div className="min-w-0">
        <nav className="flex items-center gap-1.5 text-[13px] text-slate-faint">
          <span>{t("topbar.pages")}</span>
          {kirintilar.map((k, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span>/</span>
              {k.href && i < kirintilar.length - 1 ? (
                <Link href={k.href} className="transition hover:text-slate-ink">{k.ad}</Link>
              ) : (
                <span className="text-slate-muted">{k.ad}</span>
              )}
            </span>
          ))}
        </nav>
        <h1 className="mt-0.5 truncate text-[26px] font-bold leading-tight tracking-tight text-slate-ink lg:text-[30px]">{baslik}</h1>
      </div>

      {/* sağ: global arama + operational + sosyal + bildirim + tema */}
      <div className="flex shrink-0 items-center gap-2.5">
        <GlobalArama />
        <div className="flex items-center gap-2 rounded-full border border-green-200 bg-ok-soft/70 px-3.5 py-2 shadow-card">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-ok opacity-60" />
            <span className="relative inline-flex size-2.5 rounded-full bg-ok" />
          </span>
          <span className="text-[13px] font-semibold text-green-700">{t("topbar.operational")}</span>
        </div>

        <div className="flex items-center gap-0.5 rounded-full border border-line/60 bg-surface px-2 py-1.5 shadow-card">
          <IkonBtn ikon={<Code2 className="size-[18px]" />} ipucu={t("topbar.apiDocs")} href="/panel/gelistirici" />
          <IkonBtn ikon={<MessageCircle className="size-[18px]" />} ipucu={t("topbar.supportChat")} />
          <IkonBtn ikon={<Mail className="size-[18px]" />} ipucu="destek@veylify.com" href="mailto:destek@veylify.com" />
          {/* bildirim */}
          <div ref={bildirimRef} className="relative">
            <button onClick={() => setBildirimAcik((v) => !v)} aria-label={t("topbar.notifications")} title={t("topbar.notifications")} className="relative grid size-9 place-items-center rounded-full text-slate-muted transition hover:bg-canvas">
              <Bell className="size-[18px]" />
              {okunmamis > 0 && <span className="absolute right-2 top-2 size-2 rounded-full bg-brand-600 ring-2 ring-surface" />}
            </button>
            {bildirimAcik && (
              <div className="absolute right-0 top-11 z-40 w-[360px] overflow-hidden rounded-2xl border border-line bg-surface shadow-lift animate-fade-up">
                <div className="flex items-center justify-between border-b border-line px-4 py-3">
                  <span className="text-sm font-semibold text-slate-ink">{t("topbar.notifications")}</span>
                  {okunmamis > 0 && <button onClick={tumunuOku} className="text-xs font-medium text-brand-600 hover:text-brand-700">{t("topbar.markAllRead")}</button>}
                </div>
                <div className="max-h-[380px] overflow-y-auto scrollbar-thin">
                  {notlar.length === 0 ? (
                    <div className="px-4 py-10 text-center text-sm text-slate-faint">{t("topbar.allClear")}</div>
                  ) : (
                    notlar.slice(0, 8).map((b) => (
                      <div key={b.id} className="flex gap-3 border-b border-line px-4 py-3 last:border-0">
                        <span className={cn("mt-1 size-2 shrink-0 rounded-full", b.severity === "critical" ? "bg-danger2" : b.severity === "high" ? "bg-warn" : "bg-brand-600")} />
                        <div className="min-w-0">
                          <div className="text-[13px] font-medium text-slate-ink">{b.title}</div>
                          <div className="mt-0.5 line-clamp-2 text-[12px] text-slate-muted">{b.message}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <Link href="/panel/bildirimler" className="block border-t border-line px-4 py-2.5 text-center text-[13px] font-medium text-brand-600 hover:bg-canvas">{t("topbar.viewAll")}</Link>
              </div>
            )}
          </div>
        </div>

        <Tooltip metin={koyu ? t("topbar.lightTheme") : t("topbar.darkTheme")} yon="alt">
          <button
            onClick={temaDegistir}
            aria-label={koyu ? t("topbar.lightTheme") : t("topbar.darkTheme")}
            aria-pressed={koyu}
            className="grid size-11 place-items-center rounded-full border border-line/60 bg-surface text-slate-muted shadow-card transition hover:text-slate-ink"
          >
            {koyu ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
          </button>
        </Tooltip>
      </div>
    </div>
    </div>
  );
}

function IkonBtn({ ikon, ipucu, href }: { ikon: React.ReactNode; ipucu: string; href?: string }) {
  const cls = "grid size-9 place-items-center rounded-full text-slate-muted transition hover:bg-canvas hover:text-slate-ink";
  const inner = href ? (
    <Link href={href} aria-label={ipucu} className={cls}>{ikon}</Link>
  ) : (
    <button aria-label={ipucu} className={cls}>{ikon}</button>
  );
  return <Tooltip metin={ipucu} yon="alt">{inner}</Tooltip>;
}
