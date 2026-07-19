/**
 * Entegrasyon platformları için gerçek, tanınabilir marka işaretleri.
 * Her biri o platformun resmi logo işaretini doğru geometri + doğru marka
 * rengiyle inline SVG olarak çizer. ~18-20px'te net görünecek şekilde
 * viewBox'lar ayarlanmıştır.
 *
 * Not: Bunlar kamuya açık teknoloji markalarının işaretleridir; ölçeklenebilir
 * vektörler. Riskli/belirsiz olanlar (Webhook, cURL/REST) için temiz mono
 * ikon kullanılır (renkli marka daireleri değil).
 */
import type React from "react";

type LogoProps = { className?: string };

/* ============================================================
 * 1. WordPress — "W" logosu (#21759B)
 * ============================================================ */
function WordPressLogo({ className }: LogoProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#21759B" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 1.2a8.77 8.77 0 0 1 4.94 1.52c-.36-.02-.76.2-.76.7 0 .44.26.82.53 1.26.2.36.44.82.44 1.49 0 .46-.18 1-.41 1.75l-.54 1.8-1.95-5.81c.33-.02.62-.05.62-.05.29-.04.26-.46-.03-.44 0 0-.88.07-1.45.07-.53 0-1.43-.07-1.43-.07-.29-.02-.33.42-.03.44 0 0 .27.03.57.05l.87 2.38-1.22 3.66-2.03-6.04c.33-.02.62-.05.62-.05.29-.04.26-.46-.03-.44 0 0-.88.07-1.45.07-.1 0-.22 0-.35-.01A8.78 8.78 0 0 1 12 3.2zM4.02 8.98l3.9 10.7A8.8 8.8 0 0 1 4.02 8.98zm8.32 3.5l1.66 4.53c.01.03.03.06.04.08a8.79 8.79 0 0 1-5.02-.16l3.32-4.45zm5.65-3.71a8.8 8.8 0 0 1-3.15 11.1l2.7-7.8c.5-1.26.67-2.27.67-3.16 0-.05 0-.1-.01-.14z" />
    </svg>
  );
}

/* ============================================================
 * 2. Shopify — alışveriş çantası (#95BF47 / #5E8E3E)
 * ============================================================ */
function ShopifyLogo({ className }: LogoProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#95BF47"
        d="M16.9 5.06c-.02-.11-.11-.17-.19-.18-.08-.01-1.63-.03-1.63-.03s-1.3-1.26-1.43-1.39c-.13-.13-.38-.09-.48-.06 0 0-.24.08-.65.2-.07-.22-.17-.5-.32-.78-.48-.91-1.17-1.39-2.02-1.39h-.09c-.02-.03-.05-.06-.08-.09-.37-.4-.85-.59-1.42-.57C6.99.51 5.9 1.31 5.02 2.73c-.62 1-1.09 2.25-1.22 3.22-1.26.39-2.14.66-2.16.67-.64.2-.66.22-.74.82C.84 7.9 0 21.02 0 21.02l14.03 2.42 6.08-1.51S16.92 5.17 16.9 5.06zM11.75 3.4l-1.05.32c0-.6-.08-1.44-.36-2.16.9.17 1.34 1.19 1.41 1.84zm-1.76.54l-2.26.7c.22-.84.64-1.68 1.15-2.23.19-.2.46-.43.78-.56.3.63.37 1.51.33 2.09zM8.64 1.13c.26 0 .48.06.66.17-.3.15-.58.38-.85.66-.68.73-1.2 1.86-1.41 2.95l-1.86.58c.37-1.72 1.81-4.31 3.46-4.36z"
      />
      <path
        fill="#5E8E3E"
        d="M16.71 4.88c-.08-.01-1.63-.03-1.63-.03s-1.3-1.26-1.43-1.39a.32.32 0 0 0-.18-.08L14.04 24l6.08-1.51S16.92 5.17 16.9 5.06a.24.24 0 0 0-.19-.18z"
      />
      <path
        fill="#FFF"
        d="M10.4 8.13l-.71 2.64s-.79-.36-1.72-.3c-1.37.09-1.38.95-1.37 1.17.08 1.18 3.17 1.44 3.34 4.19.14 2.17-1.14 3.65-2.99 3.76-2.22.14-3.44-1.17-3.44-1.17l.47-2s1.23.93 2.21.86c.64-.04.87-.56.85-.93-.1-1.53-2.62-1.44-2.78-3.96-.13-2.12 1.26-4.27 4.33-4.46.98-.06 1.48.19 1.48.19z"
      />
    </svg>
  );
}

/* ============================================================
 * 3. Next.js — siyah daire "N" (#000000)
 * ============================================================ */
function NextLogo({ className }: LogoProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#000" />
      <path
        fill="#FFF"
        d="M9.2 7.2h1.35l6.28 8.55V7.2h1.1v9.6h-1.1l-6.55-8.9v8.9H9.2V7.2z"
      />
      <rect x="15.9" y="7.2" width="1.1" height="6.2" fill="#FFF" />
    </svg>
  );
}

/* ============================================================
 * 4. Cloudflare — turuncu bulut (#F38020 / #FBAD41)
 * ============================================================ */
function CloudflareLogo({ className }: LogoProps) {
  return (
    <svg className={className} viewBox="0 0 24 16" aria-hidden="true">
      <path
        fill="#FBAD41"
        d="M18.5 7.3c-.08 0-.16 0-.24.01a.13.13 0 0 1-.12-.09 3.35 3.35 0 0 0-3.24-2.47c-1.5 0-2.8.98-3.24 2.35a1.9 1.9 0 0 0-1.28-.35 1.98 1.98 0 0 0-1.72 2.16c0 .1.01.2.03.29.01.06-.03.13-.1.13H3.3a.16.16 0 0 0-.15.11c-.05.2-.08.4-.08.62 0 1.86 1.5 3.37 3.36 3.37h13.2c.09 0 .17-.06.19-.15.05-.19.08-.4.08-.6a2.32 2.32 0 0 0-2.32-2.33z"
      />
      <path
        fill="#F38020"
        d="M16.02 12.86c.06-.2.04-.39-.06-.53a.55.55 0 0 0-.42-.22l-8.03-.1a.14.14 0 0 1-.11-.06.14.14 0 0 1-.02-.13.19.19 0 0 1 .17-.13l8.1-.1c.96-.05 2-.83 2.36-1.78l.46-1.2a.24.24 0 0 0 .01-.15A5.35 5.35 0 0 0 8.6 6.29a2.4 2.4 0 0 0-3.75 2.5c-1.3.04-2.34 1.1-2.34 2.41 0 .12.01.23.03.35a.11.11 0 0 0 .11.1h12.9c.06 0 .11-.04.13-.1z"
      />
    </svg>
  );
}

/* ============================================================
 * 5. Slack — 4-renk hashtag (#36C5F0 #2EB67D #ECB22E #E01E5A)
 * ============================================================ */
function SlackLogo({ className }: LogoProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#36C5F0"
        d="M9 3.5A1.75 1.75 0 1 0 7.25 5.25H9V3.5zm.88 0v4.62A1.75 1.75 0 1 1 6.4 8.12 1.75 1.75 0 0 1 8.13 6.37 1.75 1.75 0 0 1 9.88 8.13"
      />
      <path
        fill="#2EB67D"
        d="M20.5 9A1.75 1.75 0 1 0 18.75 7.25V9h1.75zm-4.62.88h-4.62a1.75 1.75 0 1 1 1.74-1.75 1.75 1.75 0 0 1-1.75 1.75h4.63A1.75 1.75 0 1 0 15.88 8.13"
      />
      <path
        fill="#ECB22E"
        d="M15 20.5A1.75 1.75 0 1 0 16.75 18.75H15v1.75zm-.88-4.62v-4.62a1.75 1.75 0 1 1 1.75 1.74 1.75 1.75 0 0 1-1.75-1.74"
      />
      <path
        fill="#E01E5A"
        d="M3.5 15A1.75 1.75 0 1 0 5.25 16.75V15H3.5zm4.63-.88h4.62a1.75 1.75 0 1 1-1.75 1.75 1.75 1.75 0 0 1 1.75-1.75"
      />
    </svg>
  );
}

/* ============================================================
 * 6. Webhook — bağlantılı daireler / temiz mono ikon (#C73A63)
 *    (resmi webhooks logosu: iç içe akış — mono çizim)
 * ============================================================ */
function WebhookLogo({ className }: LogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#C73A63"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9.5 8.5a3 3 0 1 1 4.2 2.76L11 16" />
      <path d="M14.5 15.5a3 3 0 1 1-2.9 3.75H6.4" />
      <path d="M9.5 15.5a3 3 0 1 1 4.75 2.4L11.7 13" />
      <circle cx="8" cy="7.2" r="1" fill="#C73A63" stroke="none" />
      <circle cx="17" cy="18" r="1" fill="#C73A63" stroke="none" />
      <circle cx="5.2" cy="18" r="1" fill="#C73A63" stroke="none" />
    </svg>
  );
}

/* ============================================================
 * 7. React — atom (#61DAFB)
 * ============================================================ */
function ReactLogo({ className }: LogoProps) {
  return (
    <svg className={className} viewBox="-12 -12 24 24" aria-hidden="true">
      <circle r="1.9" fill="#61DAFB" />
      <g fill="none" stroke="#61DAFB" strokeWidth="1">
        <ellipse rx="10" ry="4.2" />
        <ellipse rx="10" ry="4.2" transform="rotate(60)" />
        <ellipse rx="10" ry="4.2" transform="rotate(120)" />
      </g>
    </svg>
  );
}

/* ============================================================
 * 8. Nginx — yeşil "N" altıgen (#009639)
 * ============================================================ */
function NginxLogo({ className }: LogoProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#009639"
        d="M12 1.5 2.9 6.75v10.5L12 22.5l9.1-5.25V6.75L12 1.5z"
      />
      <path
        fill="#FFF"
        d="M8.4 7.2h1.2l4.7 5.85V7.2h1.3v9.6h-1.2L9.7 10.9v5.9H8.4V7.2z"
      />
    </svg>
  );
}

/* ============================================================
 * 9. Zapier — turuncu 6 kollu yıldız (#FF4A00)
 * ============================================================ */
function ZapierLogo({ className }: LogoProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#FF4A00"
        d="M15 12a5.9 5.9 0 0 1-.4 2.16c-.68.25-1.4.38-2.16.38h-.02c-.76 0-1.48-.13-2.16-.38A5.94 5.94 0 0 1 9.88 12v-.02c0-.76.14-1.48.38-2.16A5.94 5.94 0 0 1 12.42 9.5h.02c.76 0 1.48.14 2.16.38A5.9 5.9 0 0 1 15 12zM23.5 9.87h-6.05l4.28-4.28-2.16-2.16L15.29 7.7V1.66h-3.05V7.7L7.96 3.43 5.8 5.59l4.28 4.28H4.03v3.05h6.05L5.8 17.2l2.16 2.16 4.28-4.28v6.05h3.05V15.1l4.28 4.28 2.16-2.16-4.28-4.28h6.05V9.87z"
      />
    </svg>
  );
}

/* ============================================================
 * 10. PHP / Laravel — Laravel "L" işareti (#FF2D20)
 * ============================================================ */
function LaravelLogo({ className }: LogoProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#FF2D20"
        d="M23.64 6.55a.32.32 0 0 1 .01.09v4.83c0 .12-.06.23-.16.29l-4.05 2.34v4.63c0 .12-.06.23-.16.29l-8.46 4.87a.34.34 0 0 1-.11.04h-.02a.34.34 0 0 1-.16 0h-.02a.35.35 0 0 1-.11-.04L1.9 24.1a.33.33 0 0 1-.16-.29V9.32c0-.03 0-.06.01-.09l.01-.05a.3.3 0 0 1 .02-.05l.03-.05.04-.04.04-.03h.01l4.24-2.44a.33.33 0 0 1 .33 0l4.24 2.44h.01l.04.03.04.04.03.05a.3.3 0 0 1 .02.05l.01.05c.01.03.01.06.01.09v9.05l3.52-2.03V9.31c0-.03 0-.06.01-.09l.02-.05.02-.05.03-.05.04-.04.04-.03h.01l4.24-2.44a.33.33 0 0 1 .33 0l4.24 2.44.04.03.04.04.03.05.02.05zM2.4 23.62l3.53 2.03v-3.66l-3.53-2.03v3.66zm7.75-4.46V15.5l-3.52 2.03v3.66l3.52-2.03zm-3.86-9.9L2.75 11.3l3.53 2.03 3.53-2.03-3.52-2.04zm-.17 9.9l3.52-2.03v-3.66l-3.52 2.03v3.66zm14.53-9.9L17.6 11.3l3.53 2.03 3.53-2.03-3.53-2.04zm-.34 5.6l3.53-2.03V8.62l-3.53 2.03v3.75zm-8.98 6.87l4.4-2.53v-3.66l-4.4 2.53v3.66z"
      />
    </svg>
  );
}

/* ============================================================
 * 11. Python — iki renkli yılan (#3776AB / #FFD43B)
 * ============================================================ */
function PythonLogo({ className }: LogoProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#3776AB"
        d="M11.9 1.5c-.86 0-1.68.07-2.4.2-2.12.37-2.5 1.16-2.5 2.6v1.9h5v.63H5.12c-1.46 0-2.73.87-3.13 2.53-.46 1.9-.48 3.08 0 5.06.35 1.48 1.2 2.53 2.66 2.53H6.4v-2.28c0-1.65 1.43-3.1 3.13-3.1h4.99c1.4 0 2.5-1.15 2.5-2.55V4.3c0-1.36-1.15-2.38-2.5-2.6a15 15 0 0 0-2.62-.2zM9.2 3.03c.52 0 .94.43.94.95a.94.94 0 0 1-.94.94.93.93 0 0 1-.93-.94c0-.52.41-.95.93-.95z"
      />
      <path
        fill="#FFD43B"
        d="M18.38 6.83v2.22c0 1.72-1.46 3.17-3.13 3.17h-4.99c-1.37 0-2.5 1.17-2.5 2.55v4.78c0 1.36 1.18 2.16 2.5 2.55 1.58.46 3.1.55 4.99 0 1.26-.36 2.5-1.1 2.5-2.55v-1.9h-4.99v-.64h7.49c1.45 0 2-1.01 2.5-2.53.52-1.56.5-3.06 0-5.06-.36-1.45-1.05-2.53-2.5-2.53h-1.87zm-2.8 12.03c.51 0 .93.42.93.94a.94.94 0 0 1-.94.95.94.94 0 0 1-.93-.95c0-.52.42-.94.93-.94z"
      />
    </svg>
  );
}

/* ============================================================
 * 12. cURL / REST — temiz terminal / API mono ikonu
 * ============================================================ */
function CurlLogo({ className }: LogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#475569"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2.5" y="4" width="19" height="16" rx="2.2" />
      <path d="M6.5 9.2 9.3 12l-2.8 2.8" />
      <path d="M12.5 14.8h4.6" />
    </svg>
  );
}

/* ============================================================
 * Kayıt tablosu — anahtarlar page.tsx ile TAM eşleşmeli.
 * ============================================================ */
export const PLATFORM_LOGO: Record<
  string,
  (p: { className?: string }) => React.ReactElement
> = {
  WordPress: WordPressLogo,
  Shopify: ShopifyLogo,
  "Next.js": NextLogo,
  Cloudflare: CloudflareLogo,
  Slack: SlackLogo,
  Webhook: WebhookLogo,
  React: ReactLogo,
  Nginx: NginxLogo,
  Zapier: ZapierLogo,
  "PHP / Laravel": LaravelLogo,
  Python: PythonLogo,
  "cURL / REST": CurlLogo,
};

export {
  WordPressLogo,
  ShopifyLogo,
  NextLogo,
  CloudflareLogo,
  SlackLogo,
  WebhookLogo,
  ReactLogo,
  NginxLogo,
  ZapierLogo,
  LaravelLogo,
  PythonLogo,
  CurlLogo,
};
