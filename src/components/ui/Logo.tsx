import { cn } from "@/lib/cn";
import { MARKA } from "@/lib/marka";

/**
 * Veylify marka amblemi — "veil" (peçe/görünmez katman) + koruyucu kalkan.
 * Kalkan silueti içinde bir nöbetçi göz; gözün üstünden geçen ince "peçe"
 * çizgileri (temporal-dithering perdesi) ürünün ghost-font özünü yansıtır:
 * insan hareketten okur, bot statik karede sadece perde görür.
 * indigo→violet gradyan, beyaz temaya uygun, keskin, ölçeklenebilir SVG.
 */
export function VeylifyMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="zn-g" x1="6" y1="3" x2="26" y2="29">
          <stop stopColor="#6366f1" />
          <stop offset="0.55" stopColor="#4f46e5" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="zn-iris" x1="11" y1="11" x2="21" y2="21">
          <stop stopColor="#c7d2fe" />
          <stop offset="1" stopColor="#a5b4fc" />
        </linearGradient>
        <clipPath id="zn-shield">
          <path d="M16 2.5 5.5 6.2v8.1c0 6.9 4.5 12.2 10.5 14.9 6-2.7 10.5-8 10.5-14.9V6.2L16 2.5Z" />
        </clipPath>
      </defs>
      {/* kalkan gövdesi — üstü düz, altı sivrilen koruyucu form */}
      <path
        d="M16 2.5 5.5 6.2v8.1c0 6.9 4.5 12.2 10.5 14.9 6-2.7 10.5-8 10.5-14.9V6.2L16 2.5Z"
        fill="url(#zn-g)"
      />
      {/* iç halka — nöbetçi diyaframı */}
      <circle cx="16" cy="13.7" r="6" fill="#ffffff" fillOpacity="0.16" />
      {/* nöbetçi göz — açık bakış */}
      <ellipse cx="16" cy="13.7" rx="5.2" ry="3.6" fill="#ffffff" fillOpacity="0.95" />
      <circle cx="16" cy="13.7" r="2.4" fill="url(#zn-iris)" />
      <circle cx="16" cy="13.7" r="1.1" fill="#312e81" />
      <circle cx="17" cy="12.8" r="0.5" fill="#eef2ff" />
      {/* peçe (veil) — gözün ve kalkanın üstünden geçen dithering perdesi */}
      <g clipPath="url(#zn-shield)" stroke="#ffffff" strokeLinecap="round">
        <path d="M4 17.4h24" strokeOpacity="0.5" strokeWidth="1.1" />
        <path d="M4 20.2h24" strokeOpacity="0.38" strokeWidth="1" />
        <path d="M4 22.9h24" strokeOpacity="0.26" strokeWidth="0.9" />
        <path d="M4 25.4h24" strokeOpacity="0.16" strokeWidth="0.8" />
      </g>
    </svg>
  );
}

/** Geriye dönük uyum: eski SpecterMark çağrıları Veylify amblemine düşer. */
export const SpecterMark = VeylifyMark;

export function Logo({
  size = 28,
  className,
  wordmark = true,
  tone = "dark",
}: {
  size?: number;
  className?: string;
  wordmark?: boolean;
  tone?: "dark" | "light";
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <VeylifyMark size={size} />
      {wordmark && (
        <span
          className={cn(
            "font-display text-[19px] font-extrabold tracking-tight",
            tone === "light" ? "text-white" : "text-ink-900",
          )}
        >
          {MARKA.ad}
        </span>
      )}
    </span>
  );
}
