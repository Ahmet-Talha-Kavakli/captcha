"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Keyboard } from "lucide-react";
import { useOdakTuzak } from "@/lib/a11y/odak-tuzak";

const KISAYOLLAR = [
  { tus: ["⌘", "K"], ad: "Komut paletini aç" },
  { tus: ["G", "sonra", "H"], ad: "Genel Bakış'a git" },
  { tus: ["G", "sonra", "T"], ad: "Canlı Trafik'e git" },
  { tus: ["G", "sonra", "K"], ad: "Kurallar'a git" },
  { tus: ["?"], ad: "Bu yardım panelini aç" },
  { tus: ["ESC"], ad: "Panel / modal kapat" },
];

const HEDEF: Record<string, string> = { h: "/panel", t: "/panel/trafik", k: "/panel/kurallar", s: "/panel/siteler", a: "/panel/analitik", i: "/panel/tehdit" };

export function KisayolYardim() {
  const [acik, setAcik] = useState(false);
  const [gBekle, setGBekle] = useState(false);
  // WCAG 2.4.3: modal açıkken odak tuzağı.
  const dialogRef = useRef<HTMLDivElement>(null);
  useOdakTuzak(dialogRef, acik);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "?") { e.preventDefault(); setAcik((v) => !v); return; }
      if (e.key === "Escape") { setAcik(false); setGBekle(false); return; }
      if (e.key.toLowerCase() === "g") { setGBekle(true); setTimeout(() => setGBekle(false), 1200); return; }
      if (gBekle && HEDEF[e.key.toLowerCase()]) {
        e.preventDefault();
        setGBekle(false);
        window.location.href = HEDEF[e.key.toLowerCase()];
      }
    };
    // Komut paletinden "Klavye kısayolları" eylemiyle açılabilsin.
    const onAc = () => setAcik(true);
    document.addEventListener("keydown", onKey);
    window.addEventListener("specter-kisayol-ac", onAc);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("specter-kisayol-ac", onAc);
    };
  }, [gBekle]);

  return (
    <AnimatePresence>
      {acik && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAcik(false)} className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm" aria-hidden />
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-line bg-white shadow-lift"
            role="dialog"
            aria-modal="true"
            aria-labelledby="kisayol-yardim-baslik"
          >
            <div className="flex items-center gap-2 border-b border-line px-5 py-4">
              <span className="grid size-8 place-items-center rounded-lg bg-brand-50 text-brand-600"><Keyboard className="size-4" /></span>
              <h3 id="kisayol-yardim-baslik" className="text-[15px] font-semibold text-slate-ink">Klavye kısayolları</h3>
            </div>
            <div className="divide-y divide-line px-5">
              {KISAYOLLAR.map((k) => (
                <div key={k.ad} className="flex items-center justify-between py-3">
                  <span className="text-sm text-slate-muted">{k.ad}</span>
                  <span className="flex items-center gap-1">
                    {k.tus.map((t, i) =>
                      t === "sonra" ? (
                        <span key={i} className="text-[11px] text-slate-faint">sonra</span>
                      ) : (
                        <kbd key={i} className="rounded-md border border-line-strong bg-canvas px-2 py-0.5 text-[12px] font-medium text-slate-ink">{t}</kbd>
                      ),
                    )}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-line px-5 py-2.5 text-center text-[12px] text-slate-faint">
              <kbd className="rounded border border-line-strong px-1.5 py-0.5">ESC</kbd> ile kapat
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
