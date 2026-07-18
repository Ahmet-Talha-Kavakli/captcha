"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import * as Icons from "lucide-react";
import { Search, Loader2 } from "lucide-react";
import { useDisari } from "./kit";

interface Sonuc {
  tur: string; turAd: string; baslik: string; altBaslik: string; href: string; ikon: string; skor: number;
}

function LucideIkon({ name, className }: { name: string; className?: string }) {
  const Cmp = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name] ?? Icons.Circle;
  return <Cmp className={className} />;
}

/**
 * Global panel arama çubuğu — siteler, IP, kurallar, kampanyalar, ekip,
 * entegrasyonlar ve AI ajanları arasında birleşik arama (/api/search).
 * Debounce'lu, klavye-navigasyonlu, gruplanmış sonuçlar.
 */
export function GlobalArama() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [sonuclar, setSonuclar] = useState<Sonuc[]>([]);
  const [acik, setAcik] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sel, setSel] = useState(0);
  const ref = useDisari<HTMLDivElement>(() => setAcik(false));
  const zamanlayici = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ara = useCallback(async (metin: string) => {
    if (metin.trim().length < 1) { setSonuclar([]); setYukleniyor(false); return; }
    setYukleniyor(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(metin)}`);
      const d = await res.json();
      setSonuclar(d.sonuclar ?? []);
      setSel(0);
    } catch { setSonuclar([]); }
    setYukleniyor(false);
  }, []);

  // debounce
  useEffect(() => {
    if (zamanlayici.current) clearTimeout(zamanlayici.current);
    zamanlayici.current = setTimeout(() => ara(q), 220);
    return () => { if (zamanlayici.current) clearTimeout(zamanlayici.current); };
  }, [q, ara]);

  function git(s: Sonuc) {
    setAcik(false); setQ("");
    router.push(s.href);
  }

  function tus(e: React.KeyboardEvent) {
    if (!sonuclar.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, sonuclar.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (sonuclar[sel]) git(sonuclar[sel]); }
    else if (e.key === "Escape") { setAcik(false); }
  }

  return (
    <div ref={ref} className="relative hidden md:block">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-faint" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setAcik(true); }}
          onFocus={() => setAcik(true)}
          onKeyDown={tus}
          placeholder="Ara: site, IP, kural, ajan…"
          aria-label="Global arama"
          role="combobox"
          aria-expanded={acik}
          className="h-10 w-56 rounded-full border border-line/60 bg-surface pl-9 pr-8 text-sm text-slate-ink shadow-card outline-none transition focus:w-72 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 placeholder:text-slate-faint"
        />
        {yukleniyor && <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-slate-faint" />}
      </div>

      {acik && q.trim().length > 0 && (
        <div className="absolute right-0 top-12 z-50 w-[380px] overflow-hidden rounded-2xl border border-line bg-surface shadow-lift animate-fade-up" role="listbox">
          {sonuclar.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-faint">{yukleniyor ? "Aranıyor…" : `"${q}" için sonuç yok`}</div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto scrollbar-thin py-1.5">
              {sonuclar.map((s, i) => (
                <button
                  key={`${s.tur}-${i}`}
                  role="option"
                  aria-selected={i === sel}
                  onClick={() => git(s)}
                  onMouseEnter={() => setSel(i)}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition ${i === sel ? "bg-brand-50" : "hover:bg-canvas"}`}
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-canvas text-slate-muted"><LucideIkon name={s.ikon} className="size-4" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-slate-ink">{s.baslik}</div>
                    <div className="truncate text-[11.5px] text-slate-muted">{s.altBaslik}</div>
                  </div>
                  <span className="shrink-0 rounded-full bg-canvas px-2 py-0.5 text-[10px] font-medium text-slate-faint">{s.turAd}</span>
                </button>
              ))}
            </div>
          )}
          <div className="border-t border-line px-3 py-2 text-[11px] text-slate-faint">
            <kbd className="rounded bg-canvas px-1">↑↓</kbd> gezin · <kbd className="rounded bg-canvas px-1">↵</kbd> git · <kbd className="rounded bg-canvas px-1">esc</kbd> kapat
          </div>
        </div>
      )}
    </div>
  );
}
