import { cn } from "@/lib/cn";

/**
 * MarkaLogo — teknoloji / dil markalarının gerçek, tanınabilir inline SVG amblemleri.
 * Emoji yerine marka-renkli, sadeleştirilmiş ama otantik logolar kullanılır.
 * Ülke bayrağı emojileri BURAYA girmez — onlar ayrı bırakılır.
 *
 * Kullanım: <MarkaLogo ad="python" size={18} />
 */

export type MarkaAd =
  | "python"
  | "javascript"
  | "typescript"
  | "nodejs"
  | "node"
  | "curl"
  | "shell"
  | "bash"
  | "go"
  | "golang"
  | "ruby"
  | "php"
  | "java"
  | "csharp"
  | "http";

interface Props {
  ad: string;
  size?: number;
  className?: string;
}

/** Ad normalize — eş anlamlıları tek anahtara indirger. */
function normalize(ad: string): string {
  const a = ad.trim().toLowerCase();
  if (a === "node") return "nodejs";
  if (a === "golang") return "go";
  if (a === "bash" || a === "sh") return "shell";
  if (a === "js") return "javascript";
  if (a === "ts") return "typescript";
  if (a === "c#" || a === "cs") return "csharp";
  return a;
}

export function MarkaLogo({ ad, size = 18, className }: Props) {
  const key = normalize(ad);
  const svg = LOGOLAR[key] ?? GENEL_YEDEK;
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {svg(size)}
    </span>
  );
}

type Cizim = (s: number) => React.ReactElement;

const LOGOLAR: Record<string, Cizim> = {
  /* Python — iki iç içe mavi/sarı yılan */
  python: (s) => (
    <svg width={s} height={s} viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="#387EB8"
        d="M126 34c-51 0-48 22-48 22l.06 23h49v7H58s-33-4-33 48 29 51 29 51h17v-24s-1-29 28-29h48s28 .4 28-27V61s4-27-49-27ZM99 49a9 9 0 1 1 0 18 9 9 0 0 1 0-18Z"
      />
      <path
        fill="#FFC331"
        d="M130 222c51 0 48-22 48-22l-.06-23h-49v-7h69s33 4 33-48-29-51-29-51h-17v24s1 29-28 29h-48s-28-.4-28 27v45s-4 26 49 26ZM157 207a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z"
      />
    </svg>
  ),
  /* JavaScript — sarı kare, siyah "JS" */
  javascript: (s) => (
    <svg width={s} height={s} viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <rect width="256" height="256" rx="20" fill="#F7DF1E" />
      <path
        fill="#000"
        d="M67 213c-15 0-24-7-28-16l20-12c3 5 6 10 12 10 6 0 9-2 9-11v-62h24v62c0 25-15 39-37 39Zm81 0c-22 0-36-11-42-25l20-12c5 8 10 14 21 14 9 0 15-4 15-11 0-8-6-11-17-16l-6-3c-18-8-30-17-30-37 0-18 14-32 36-32 16 0 27 5 35 20l-19 12c-4-8-9-11-16-11-7 0-11 4-11 11 0 7 4 10 15 15l6 3c21 9 33 18 33 38 0 22-17 34-40 34Z"
      />
    </svg>
  ),
  /* TypeScript — mavi kare, beyaz "TS" */
  typescript: (s) => (
    <svg width={s} height={s} viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <rect width="256" height="256" rx="20" fill="#3178C6" />
      <path
        fill="#fff"
        d="M146 130v-20h-84v20h30v88h24v-88h30Zm10 84c-14 0-25-4-32-12l14-14c5 6 11 8 18 8 7 0 12-3 12-9 0-6-4-8-15-13l-6-2c-16-7-26-15-26-32 0-16 12-27 31-27 13 0 23 4 30 15l-16 11c-3-6-7-8-13-8-6 0-9 3-9 8 0 6 4 8 13 12l6 3c19 8 29 16 29 33 0 18-14 27-33 27Z"
      />
    </svg>
  ),
  /* Node.js — yeşil altıgen */
  nodejs: (s) => (
    <svg width={s} height={s} viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="#539E43"
        d="M128 6 20 68v120l108 62 108-62V68L128 6Z"
      />
      <path
        fill="#fff"
        d="M128 178c-24 0-39-10-39-27 0-3 2-5 5-5h9c3 0 5 2 5 4 1 6 4 11 20 11 12 0 17-3 17-9 0-4-1-6-19-9-16-3-33-6-33-24 0-15 13-24 34-24 24 0 33 9 34 25 0 2-1 4-5 4h-9c-2 0-4-1-5-4-1-6-5-9-16-9-12 0-15 4-15 8 0 4 2 5 19 8 20 3 34 7 34 24 0 16-14 27-38 27Z"
      />
    </svg>
  ),
  /* cURL — logo dalgası + terminal oku */
  curl: (s) => (
    <svg width={s} height={s} viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <rect width="256" height="256" rx="24" fill="#073551" />
      <path d="M52 66 96 128l-44 62" stroke="#7AA0B8" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="176" cy="70" r="12" fill="#40B4E5" />
      <circle cx="176" cy="128" r="12" fill="#40B4E5" />
      <circle cx="176" cy="186" r="12" fill="#40B4E5" />
    </svg>
  ),
  /* Shell / Bash — terminal penceresi + prompt */
  shell: (s) => (
    <svg width={s} height={s} viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <rect width="256" height="256" rx="28" fill="#293137" />
      <rect x="24" y="24" width="208" height="208" rx="18" fill="#4EAA25" />
      <path d="M62 96 100 128l-38 32" stroke="#fff" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="120" y="150" width="70" height="14" rx="7" fill="#fff" />
    </svg>
  ),
  /* Go — açık mavi "GO" gopher tonu */
  go: (s) => (
    <svg width={s} height={s} viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <rect width="256" height="256" rx="20" fill="#00ADD8" />
      <path
        fill="#fff"
        d="M92 104c-18 0-30 13-30 28s12 27 30 27c11 0 20-5 25-13v-19H88v14h14c-2 3-6 5-10 5-8 0-13-6-13-14s5-15 13-15c4 0 8 2 10 5l13-8c-5-8-13-13-23-13Zm70 0c-18 0-31 12-31 28 0 15 13 27 31 27s31-12 31-27c0-16-13-28-31-28Zm0 15c8 0 13 6 13 13s-5 13-13 13-13-6-13-13 5-13 13-13Z"
      />
    </svg>
  ),
  /* Ruby — kırmızı elmas */
  ruby: (s) => (
    <svg width={s} height={s} viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <path fill="#CC342D" d="M40 84h176l-88 132z" />
      <path fill="#9B211C" d="m128 216 88-132h-52z" />
      <path fill="#E63C31" d="M40 84h56l-56 132z" opacity="0.85" />
      <path fill="#B02B24" d="M40 84h176l-44-44H84z" />
    </svg>
  ),
  /* PHP — mor mengene "php" */
  php: (s) => (
    <svg width={s} height={s} viewBox="0 0 256 128" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="128" cy="64" rx="126" ry="58" fill="#777BB3" />
      <path
        fill="#fff"
        d="M52 44h26c14 0 22 7 20 20-2 12-11 18-24 18H62l-3 14H45l7-52Zm11 12-3 14h8c6 0 10-2 11-8 1-5-2-6-8-6h-8Zm121-12h26c14 0 22 7 20 20-2 12-11 18-24 18h-12l-3 14h-14l7-52Zm11 12-3 14h8c6 0 10-2 11-8 1-5-2-6-8-6h-8Zm-96-2h13l-2 12h12c12 0 18 5 16 16l-4 26h-14l4-24c1-4-1-6-6-6h-9l-6 30h-14l14-64Z"
      />
    </svg>
  ),
  /* Java — kahve fincanı + buhar */
  java: (s) => (
    <svg width={s} height={s} viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="#E76F00"
        d="M118 30c-14 12-4 24 2 34 8 12 6 20-6 30 20-12 24-24 14-38-6-8-16-16-10-26Zm34 16c-8 8-2 16 2 22 5 8 4 12-4 18 14-8 16-16 10-26-3-5-11-9-8-14Z"
      />
      <path
        fill="#5382A1"
        d="M78 152s-10 6 7 8c20 3 31 2 54-2 0 0 6 4 15 7-51 22-115-1-76-13Zm-6-28s-12 9 6 11c22 2 39 2 69-4 0 0 4 4 11 6-62 18-131 2-86-13Zm112 55s7 6-8 10c-28 9-118 11-143 0-9-4 8-9 13-10 6-1 9-1 9-1-10-7-64 14-27 20 100 16 182-7 156-19Zm-100-96s-28 6-10 9c8 1 22 1 36-1 11-1 22-3 22-3s-4 2-7 4c-28 8-83 4-67-4 13-7 26-5 26-5Zm81 45c28-15 15-29 6-27-2 0-3 2-3 2s1-2 3-3c22-8 39 23-6 29 0 0 1-1 0-1Zm-27 62c27 1 68-2 69-14 0 0-2 4-22 8-23 4-51 3-68 1 0 0 3 3 21 5Z"
      />
    </svg>
  ),
  /* C# — mor kare "C#" */
  csharp: (s) => (
    <svg width={s} height={s} viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <rect width="256" height="256" rx="20" fill="#68217A" />
      <path
        fill="#fff"
        d="M118 92c-24 0-40 15-40 36s16 36 40 36c15 0 26-6 33-17l-19-11c-3 5-7 8-14 8-11 0-17-7-17-16s6-16 17-16c7 0 11 3 14 8l19-11c-7-11-18-17-33-17Z"
      />
      <path
        fill="#fff"
        d="M176 100h11l-2 14h10v10h-11l-2 12h11v10h-13l-3 16h-11l3-16h-8l-3 16h-11l3-16h-9v-10h11l2-12h-10v-10h12l3-14h11l-3 14h8l3-14Zm-5 24h-8l-2 12h8l2-12Z"
      />
    </svg>
  ),
  /* HTTP — küre + ok */
  http: (s) => (
    <svg width={s} height={s} viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="128" cy="128" r="96" stroke="#2f6fed" strokeWidth="16" />
      <ellipse cx="128" cy="128" rx="48" ry="96" stroke="#2f6fed" strokeWidth="12" />
      <path d="M40 100h176M40 156h176" stroke="#2f6fed" strokeWidth="12" strokeLinecap="round" />
    </svg>
  ),
};

/* Genel yedek — sade kod/terminal simgesi */
const GENEL_YEDEK: Cizim = (s) => (
  <svg width={s} height={s} viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" rx="28" fill="#e6e1d5" />
    <path
      d="M96 92 60 128l36 36M160 92l36 36-36 36M140 76l-24 104"
      stroke="#6b6a63"
      strokeWidth="16"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);
