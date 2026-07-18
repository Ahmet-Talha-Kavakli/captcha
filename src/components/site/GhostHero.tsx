"use client";

import { useState } from "react";
import { RefreshCw, Camera, Eye } from "lucide-react";
import { GhostText } from "./GhostText";

const MESAJLAR = ["INSAN MISIN", "SADECE SEN", "BOT GECEMEZ", "GHOST FONT"];

/**
 * Landing canlı ghost-font kanıtı: GhostField motoru canvas'ta temporal
 * dithering ile gerçek zamanlı render eder. Ziyaretçi hareketten okur;
 * "basılı tut" ile kare donunca (AI'ın gördüğü) metin gürültüye karışır.
 * Beyaz landing'e uyumlu çerçeve, koyu demo yüzeyi (ghost-font koyu zeminde
 * en net görünür).
 */
export function GhostHero() {
  const [i, setI] = useState(0);
  const [donmus, setDonmus] = useState(false);

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-veylify-900 p-5 shadow-[0_24px_64px_-32px_rgba(79,70,229,0.5)]">
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-veylify-200">
          <span className="pulse-ring h-1.5 w-1.5 rounded-full bg-veylify-400" /> Canlı ghost-font — gerçek motor
        </span>
        <button
          onClick={() => setI((v) => (v + 1) % MESAJLAR.length)}
          className="grid h-7 w-7 place-items-center rounded-lg bg-white/5 text-white/50 transition hover:bg-white/10 hover:text-white"
          title="Mesajı değiştir"
          aria-label="Mesajı değiştir"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="overflow-hidden rounded-xl">
        <GhostText text={MESAJLAR[i]} width={420} height={150} cell={3} color="#1e1b4b" bg="#e0e7ff" paused={donmus} />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          onMouseDown={() => setDonmus(true)}
          onMouseUp={() => setDonmus(false)}
          onMouseLeave={() => setDonmus(false)}
          onTouchStart={() => setDonmus(true)}
          onTouchEnd={() => setDonmus(false)}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] py-2.5 text-[13px] font-medium text-white/70 transition hover:bg-white/[0.06]"
        >
          <Camera className="h-3.5 w-3.5" /> {donmus ? "Kare donduruldu — metin kayboldu ✕" : "Basılı tut: AI'ın gördüğü tek kare"}
        </button>
      </div>

      <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-white/40">
        <Eye className="h-3 w-3" /> İnsan hareketten okur · AI statik karede sadece gürültü görür
      </p>
    </div>
  );
}
