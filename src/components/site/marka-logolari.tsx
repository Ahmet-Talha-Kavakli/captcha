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
  // Meta "infinity" işareti — resmi mavi, doğru çift-halka biçimi (simple-icons).
  return (
    <svg width="24" height="20" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#0082FB"
        d="M6.897 4c1.915 0 3.516 1.442 4.68 3.109.643-.804 1.33-1.472 2.063-1.977C14.762 4.415 15.826 4 16.906 4c3.462 0 5.892 3.626 6.056 8.516.048 1.437-.115 2.816-.475 4.023-.371 1.244-.932 2.196-1.665 2.831-.68.589-1.475.887-2.312.887-1.017 0-1.784-.375-2.573-1.532-.596-.874-1.209-2.055-1.985-3.556l-.849-1.64c-.03-.058-.06-.115-.09-.171-.615.982-1.192 1.916-1.737 2.723-1.305 1.933-2.42 3.176-4.19 3.176-1.66 0-2.986-.983-3.517-2.94-.343-1.263-.492-2.868-.443-4.407C2.751 7.482 5.108 4 6.897 4Zm.28 2.407c-.892 0-2.174 2.01-2.174 4.94 0 1.02.148 1.926.383 2.673.2.634.508 1.077.913 1.077.406 0 .766-.28 1.312-1.06.435-.622 1.064-1.632 1.72-2.68l.53-.85c-.858-1.44-1.65-2.605-2.28-3.288-.464-.503-.891-.812-1.404-.812Zm9.548 0c-.564 0-1.03.244-1.548.744-.487.472-1.03 1.191-1.634 2.121l.62 1.03c.626 1.043 1.315 2.238 1.995 3.238.708 1.043 1.106 1.291 1.632 1.291.505 0 .81-.442.995-1.02.234-.73.343-1.72.284-2.788-.164-3.05-1.238-4.616-2.344-4.616Z"
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
  // Cloudflare bulut işareti — turuncu ana bulut + amber sağ kanat (simple-icons).
  return (
    <svg width="30" height="20" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#F38020"
        d="M16.5088 16.8447c.1475-.5068.0908-.9707-.1553-1.3154-.2246-.3164-.5977-.499-1.0498-.5205l-8.5654-.1094a.1673.1673 0 0 1-.1329-.0713.1712.1712 0 0 1-.0195-.1523c.0233-.0674.086-.1172.1592-.124l8.6445-.1094c1.0263-.0498 2.1348-.8574 2.5225-1.877l.4922-1.2822a.2971.2971 0 0 0 .0195-.164C18.041 8.6425 15.582 6.7676 12.6875 6.7676c-2.6699 0-4.9316 1.7217-5.7422 4.1113a2.6706 2.6706 0 0 0-1.875-.5195c-1.3164.1318-2.373 1.1875-2.5039 2.5039a2.7 2.7 0 0 0 .0665.8965C.6353 13.5606 0 14.6274 0 15.847c0 .1074.0079.2148.0225.3193a.1512.1512 0 0 0 .1494.1309l15.8213.0019.0021-.0004a.1875.1875 0 0 0 .1758-.1348l.2377-.4192Z"
      />
      <path
        fill="#FAAE40"
        d="M19.3037 10.9316c-.0791 0-.1582.002-.2363.0069a.1378.1378 0 0 0-.1231.0967l-.336 1.1602c-.1474.5068-.0908.9707.1553 1.3154.2246.3164.5977.499 1.0498.5205l1.8252.1094c.0547.0049.1025.0303.1329.0713a.1712.1712 0 0 1 .0195.1523c-.0234.0674-.086.1172-.1592.124l-1.8975.1104c-1.0312.0498-2.1348.8574-2.5224 1.877l-.1368.3535c-.0263.0674.0215.1348.0938.1348h6.5283a.1626.1626 0 0 0 .1573-.1182 4.6816 4.6816 0 0 0 .1728-1.2705c0-2.5849-2.1035-4.6875-4.6893-4.6875Z"
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
  // Amazon "smile" oku — a'dan z'ye kavisli turuncu gülümseme oku.
  return (
    <svg width="26" height="20" viewBox="0 0 26 16" aria-hidden>
      <path
        fill="#FF9900"
        d="M15.93 12.2C13.66 13.86 10.38 14.75 7.55 14.75c-3.96 0-7.53-1.46-10.23-3.9-.21-.19-.02-.45.24-.3 2.9 1.69 6.5 2.7 10.2 2.7 2.52 0 5.28-.52 7.83-1.6.39-.16.71.25.34.55z"
        transform="translate(3 0)"
      />
      <path
        fill="#FF9900"
        d="M17.98 11.03c-.29-.37-1.93-.18-2.67-.09-.22.03-.26-.17-.06-.31 1.31-.92 3.46-.66 3.71-.35.25.31-.07 2.47-1.3 3.5-.19.16-.37.07-.29-.14.28-.7.9-2.26.61-2.61z"
        transform="translate(3 0)"
      />
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

/** Tek marka: gerçek renkli işaret + wordmark. Hafif soluk, hover'da tam net. */
export function MarkaLogo({ ad, className = "" }: { ad: string } & LogoProps) {
  const key = ad.toLowerCase();
  const M = MARKA_LOGO[key];
  if (!M) return <LogoTicari ad={ad} className={className} />;
  const Isaret = M.isaret;
  return (
    <span
      className={`inline-flex select-none items-center gap-2 opacity-90 transition duration-300 hover:opacity-100 hover:-translate-y-0.5 ${className}`}
      title={M.ad}
    >
      <Isaret />
      <span className="text-[17px] font-bold tracking-tight text-veylify-950/75">{M.ad}</span>
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
