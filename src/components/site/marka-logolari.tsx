/**
 * LogoStrip için sade, tek-renk (currentColor) wordmark SVG'leri.
 * Foto-gerçekçi marka logosu değil — güven şeridi için nötr, telifsiz
 * tipografik amblemler. Gri tonda durur, hover'da koyulaşır.
 */

type LogoProps = { className?: string };

export function LogoTicari({ ad, className = "" }: { ad: string } & LogoProps) {
  return (
    <span
      className={`select-none text-lg font-bold tracking-tight text-slate-300 transition hover:text-slate-500 ${className}`}
    >
      {ad}
    </span>
  );
}

/** Basit geometrik "logo" amblemleri — her biri özgün bir işaret + wordmark. */
export function AmblemliLogo({
  ad,
  tip,
  className = "",
}: {
  ad: string;
  tip: "daire" | "kare" | "ucgen" | "altigen" | "yildiz" | "dalga";
  className?: string;
}) {
  return (
    <span
      className={`inline-flex select-none items-center gap-2 text-slate-300 transition hover:text-slate-500 ${className}`}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        {tip === "daire" && <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="2.4" />}
        {tip === "kare" && <rect x="3.5" y="3.5" width="13" height="13" rx="3" stroke="currentColor" strokeWidth="2.4" />}
        {tip === "ucgen" && <path d="M10 3.5 17 16H3L10 3.5Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />}
        {tip === "altigen" && <path d="M10 3l6 3.5v7L10 17l-6-3.5v-7L10 3Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />}
        {tip === "yildiz" && <path d="M10 3l2 5h5l-4 3.2 1.6 5L10 14l-4.6 2.2L7 11.2 3 8h5l2-5Z" fill="currentColor" />}
        {tip === "dalga" && <path d="M3 12c2-4 5-4 7 0s5 4 7 0" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none" />}
      </svg>
      <span className="text-[17px] font-bold tracking-tight">{ad}</span>
    </span>
  );
}
