/**
 * Landing "güveniyor" şeridi için gerçek, tanınabilir marka işaretleri.
 * Her biri o markanın resmi logo işaretini basit/temiz inline SVG olarak
 * çizer (doğru renk + doğru biçim). Şeritte gri-tonlamalı durur, hover'da
 * renklenir — premium logo şeridi standardı (Stripe/Vercel dili).
 *
 * Not: Bunlar kamuya açık, tanınır teknoloji markalarının işaretleridir;
 * ölçeklenebilir, doğru marka renklerinde sade vektörler.
 */

type LogoProps = { className?: string };

/* Eski API korunur — bazı yerler hâlâ import edebilir. */
export function LogoTicari({ ad, className = "" }: { ad: string } & LogoProps) {
  return (
    <span
      className={`select-none text-lg font-bold tracking-tight text-slate-300 transition hover:text-slate-500 ${className}`}
    >
      {ad}
    </span>
  );
}

/* Geriye dönük uyumluluk: eski AmblemliLogo imzası hâlâ desteklenir ama
 * artık gerçek marka logolarına yönlendirir (tip yok sayılır, ad eşlenir). */
export function AmblemliLogo({
  ad,
  className = "",
}: {
  ad: string;
  tip?: string;
  className?: string;
}) {
  const key = ad.toLowerCase();
  const M = MARKA_LOGO[key];
  if (M) return <MarkaLogo ad={ad} className={className} />;
  return <LogoTicari ad={ad} className={className} />;
}

/* ============================================================
   Gerçek marka işaretleri — her biri işaret + wordmark döndürür.
   viewBox 24x24 tabanlı, currentColor DEĞİL: doğru marka renkleri.
   ============================================================ */

function Microsoft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <rect x="1" y="1" width="10" height="10" fill="#F25022" />
      <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
      <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
      <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
    </svg>
  );
}

function Google() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.55-5.17 3.55-8.87z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.95-2.91l-3.88-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.23 0 12 0A12 12 0 0 0 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  );
}

function Meta() {
  return (
    <svg width="22" height="22" viewBox="0 0 36 24" aria-hidden>
      <path
        fill="#0866FF"
        d="M6.9 3.5C3.6 3.5 1.5 7.2 1.5 11.6c0 3.4 1.4 6 3.9 6 2 0 3.3-1.4 5-4.5.5-.9 1.1-2.1 1.7-3.3.5 1 .9 1.8 1.2 2.4l.9 1.8c1.9 3.7 3.5 3.6 4.8 3.6h.1c-1.4 0-2.3-1.3-4-4.6l-1.2-2.3c1.6-2.7 3-4.4 4.8-4.4 1.9 0 3.4 1.9 3.4 5 0 2-.5 3.2-1.4 3.2-.6 0-.9-.4-.9-1.1V13c0-.2 0-.5.1-.7l-1.9.5c0 .6.1 1.1.3 1.6.6 1.4 1.7 2.2 3.1 2.2 2.6 0 4.1-2.4 4.1-6.4C29.3 6.6 27 3.5 23.6 3.5c-2.6 0-4.6 2-6.3 4.9-1.6-3-3.3-4.9-6-4.9h-.4Zm.2 2c1.5 0 2.7 1.4 4.1 4-1.7 3.3-2.9 5.4-4.4 5.4-1.3 0-2-1.4-2-3.9 0-3.2 1.1-5.5 2.3-5.5Z"
      />
    </svg>
  );
}

function Vercel() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path fill="#000000" d="M12 2 22 20H2L12 2Z" />
    </svg>
  );
}

function Shopify() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#95BF47"
        d="M17.6 5.3c0-.1-.1-.2-.2-.2l-1.7-.1s-1.1-1.1-1.3-1.2c-.1-.1-.3-.1-.4 0l-.6.2c-.4-1-1-2-2.2-2h-.1c-.3-.4-.7-.6-1.1-.6C7.5 1.4 6.2 4.4 5.8 6c-1 .3-1.7.5-1.8.6-.6.2-.6.2-.7.7C3.2 7.7 1.6 20 1.6 20l12 2.3 6.5-1.4S17.6 5.4 17.6 5.3ZM12.7 3.6l-1 .3v-.2c0-.6-.1-1.1-.2-1.5.5.1.9.7 1.2 1.4Zm-2-1.2c.2.4.3 1 .3 1.7v.1l-2 .6c.4-1.5 1.1-2.2 1.7-2.4Zm-.9-.8c.1 0 .2 0 .3.1-.8.4-1.6 1.3-2 3.2l-1.6.5C6.9 3.6 8.2 1.7 9.8 1.6Z"
      />
      <path
        fill="#5E8E3E"
        d="M17.4 5.1 15.7 5s-1.1-1.1-1.3-1.2l-.3-.1L13 22.3l6.5-1.4S17.5 5.2 17.4 5.1Z"
      />
      <path
        fill="#FFF"
        d="m11.9 8.3-.8 2.3s-.7-.4-1.5-.4c-1.2 0-1.3.8-1.3 1 0 1.1 2.8 1.5 2.8 4 0 1.9-1.2 3.2-2.9 3.2-2 0-3-1.3-3-1.3l.5-1.8s1 .9 1.9.9c.6 0 .8-.5.8-.8 0-1.4-2.3-1.5-2.3-3.8 0-1.9 1.4-3.7 4.1-3.7 1.1 0 1.6.4 1.6.4Z"
      />
    </svg>
  );
}

function Cloudflare() {
  return (
    <svg width="24" height="24" viewBox="0 0 48 24" aria-hidden>
      <path
        fill="#F38020"
        d="M34.5 16.6c.2-.6.1-1.1-.2-1.5-.3-.4-.8-.6-1.4-.6l-11.8-.2c-.1 0-.1 0-.2-.1 0 0 0-.1 0-.2 0-.1.1-.2.2-.2l11.9-.2c1.4-.1 3-1.2 3.5-2.6l.7-1.8c0-.1 0-.1 0-.2-.8-3.6-4-6.3-7.9-6.3-3.6 0-6.6 2.3-7.7 5.5-.7-.5-1.6-.8-2.6-.7-1.7.2-3.1 1.6-3.3 3.3 0 .4 0 .9.1 1.3-2.8.1-5 2.4-5 5.2 0 .3 0 .5.1.8 0 .1.1.2.2.2h21.7c.1 0 .2-.1.3-.2l.4-1.2Z"
      />
      <path
        fill="#FAAE40"
        d="M38.3 9.8h-.4c-.1 0-.2.1-.2.2l-.3 1c-.2.6-.1 1.1.2 1.5.3.4.8.6 1.4.6l2.5.2c.1 0 .1 0 .2.1 0 0 0 .1 0 .2 0 .1-.1.2-.2.2l-2.6.2c-1.4.1-3 1.2-3.5 2.6l-.2.4c0 .1 0 .2.1.2h9c.1 0 .2-.1.2-.2.2-.6.2-1.2.2-1.8 0-3.1-2.5-5.6-5.6-5.6Z"
      />
    </svg>
  );
}

function Stripe() {
  return (
    <svg width="24" height="20" viewBox="0 0 48 20" aria-hidden>
      <rect width="48" height="20" rx="4" fill="#635BFF" />
      <path
        fill="#fff"
        d="M22.6 8.3c0-.5.4-.7 1-.7.9 0 2 .3 2.9.8V6c-1-.4-1.9-.5-2.9-.5-2.4 0-4 1.2-4 3.3 0 3.2 4.4 2.7 4.4 4.1 0 .5-.5.7-1.1.7-.9 0-2.2-.4-3.1-.9v2.4c1 .4 2.1.6 3.1.6 2.4 0 4.1-1.2 4.1-3.3 0-3.5-4.4-2.9-4.4-4.2Z"
      />
      <path fill="#fff" d="M31.6 3.4 29.2 4v7.8c0 1.5 1.1 2.5 2.5 2.5.8 0 1.4-.1 1.7-.3v-2c-.3.1-1.9.6-1.9-.9V8h1.9V5.9h-1.9V3.4Z" />
      <path fill="#fff" d="M9.8 5.9v8.2h2.5V8.9c.6-.8 1.6-.6 1.9-.5V5.9c-.3-.1-1.5-.3-2.1.8v-.8H9.8Z" />
      <path fill="#fff" d="M6.4 5.9H8.9v8.2H6.4V5.9Zm0-2.7L8.9 2.7v2L6.4 5.2v-2Z" />
    </svg>
  );
}

function GitHub() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#181717"
        d="M12 .5C5.6.5.5 5.6.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7 0-.7 0-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 5 18.3 5.3 18.3 5.3c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.6 18.4.5 12 .5Z"
      />
    </svg>
  );
}

function Amazon() {
  return (
    <svg width="24" height="24" viewBox="0 0 32 24" aria-hidden>
      <path
        fill="#232F3E"
        d="M6.5 6.3c0-1.1.3-2 .8-2.7.6-.7 1.3-1 2.3-1 .1 0 .3 0 .5.1.2 0 .4.1.7.2v1.2c-.3-.1-.5-.2-.8-.2-.3-.1-.5-.1-.7-.1-.5 0-.9.2-1.1.5-.3.3-.4.8-.4 1.5v.6h2.6v1.3H7.8V15H6.5V7.7H5.2V6.4h1.3v-.1Z"
      />
      <path
        fill="#232F3E"
        d="M13.5 15.2c-1 0-1.8-.3-2.4-1-.6-.6-.9-1.5-.9-2.6 0-1.1.3-2 .9-2.7.6-.7 1.4-1 2.5-1 1 0 1.8.3 2.4.9.6.6.9 1.5.9 2.5 0 1.2-.3 2.1-.9 2.8-.6.7-1.5 1.1-2.5 1.1Zm.1-1.2c.6 0 1-.2 1.3-.6.3-.4.4-1 .4-1.8 0-.7-.1-1.3-.4-1.7-.3-.4-.7-.6-1.3-.6-.6 0-1 .2-1.3.6-.3.4-.4 1-.4 1.7 0 .8.1 1.4.4 1.8.3.4.7.6 1.3.6Z"
      />
      <path fill="#FF9900" d="M21.5 18.4c-2.9 2.1-7 3.2-10.6 3.2-5 0-9.5-1.8-12.9-4.9-.3-.2 0-.6.3-.4 3.6 2.1 8.1 3.4 12.7 3.4 3.1 0 6.6-.7 9.8-2 .5-.2.9.3.7.7Z" />
      <path fill="#FF9900" d="M22.7 17c-.4-.5-2.5-.2-3.4-.1-.3 0-.3-.2-.1-.4 1.6-1.2 4.3-.8 4.6-.4.3.4-.1 3.1-1.6 4.4-.2.2-.5.1-.4-.2.4-.9 1.2-3 .9-3.4Z" />
    </svg>
  );
}

/* İşaret bileşenleri kayıt tablosu — ad → { işaret, wordmark } */
const MARKA_LOGO: Record<string, { isaret: () => React.ReactElement; ad: string }> = {
  microsoft: { isaret: Microsoft, ad: "Microsoft" },
  google: { isaret: Google, ad: "Google" },
  meta: { isaret: Meta, ad: "Meta" },
  vercel: { isaret: Vercel, ad: "Vercel" },
  shopify: { isaret: Shopify, ad: "Shopify" },
  cloudflare: { isaret: Cloudflare, ad: "Cloudflare" },
  stripe: { isaret: Stripe, ad: "Stripe" },
  github: { isaret: GitHub, ad: "GitHub" },
  amazon: { isaret: Amazon, ad: "Amazon" },
};

/** Tek marka: gerçek işaret + wordmark. Şeritte grayscale, hover'da renkli. */
export function MarkaLogo({ ad, className = "" }: { ad: string } & LogoProps) {
  const key = ad.toLowerCase();
  const M = MARKA_LOGO[key];
  if (!M) return <LogoTicari ad={ad} className={className} />;
  const Isaret = M.isaret;
  return (
    <span
      className={`inline-flex select-none items-center gap-2 opacity-60 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0 ${className}`}
      title={M.ad}
    >
      <Isaret />
      <span className="text-[17px] font-bold tracking-tight text-slate-500">{M.ad}</span>
    </span>
  );
}

/** Landing güven şeridinde gösterilecek varsayılan marka sırası. */
export const GUVEN_MARKALARI = [
  "Microsoft",
  "Google",
  "Meta",
  "Vercel",
  "Shopify",
  "Cloudflare",
  "Stripe",
  "GitHub",
] as const;
