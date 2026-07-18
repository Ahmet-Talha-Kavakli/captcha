/**
 * AiOperatorLogo — AI ajan kataloğundaki operatörlerin gerçek marka
 * işaretlerini inline SVG olarak gösterir. Panel crawler kartlarında renkli
 * baş-harf rozeti yerine kullanılır: OpenAI, Anthropic, Google, Meta,
 * ByteDance, Perplexity, Amazon, Cohere, Common Crawl...
 *
 * Bulunmayan operatör için baş-harf fallback (marka rengi arka planla).
 * İşaretler kamuya açık, tanınır marka logolarının sade vektör biçimleridir.
 */

type OperatorLogoProps = {
  /** AI_AJANLAR[].operator alanı (ör. "OpenAI", "Anthropic"). */
  operator: string;
  /** Fallback rozeti için ürün adı (baş-harf) + marka rengi. */
  urun?: string;
  logo?: string;
  /** px cinsinden kare boyut (rozet kutusu). Varsayılan 44. */
  boyut?: number;
  className?: string;
};

/* ---- Operatör işaretleri: her biri viewBox 24x24, doğru marka renkleri ---- */

function OpenAI({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#000000"
        d="M22.28 9.82a5.98 5.98 0 0 0-.52-4.91 6.05 6.05 0 0 0-6.52-2.9A6.06 6.06 0 0 0 4.98 4.18a5.98 5.98 0 0 0-4 2.9 6.05 6.05 0 0 0 .75 7.1 5.98 5.98 0 0 0 .51 4.91 6.05 6.05 0 0 0 6.52 2.9A5.98 5.98 0 0 0 13.26 24a6.06 6.06 0 0 0 5.77-4.2 5.99 5.99 0 0 0 4-2.9 6.06 6.06 0 0 0-.75-7.08Zm-9.02 12.6a4.48 4.48 0 0 1-2.88-1.04l.14-.08 4.78-2.76a.79.79 0 0 0 .39-.68v-6.74l2.02 1.17a.07.07 0 0 1 .04.05v5.58a4.5 4.5 0 0 1-4.49 4.5ZM3.6 18.7a4.47 4.47 0 0 1-.54-3.01l.14.09 4.78 2.76c.24.14.53.14.77 0l5.84-3.37v2.33a.08.08 0 0 1-.03.06L9.72 22.4a4.5 4.5 0 0 1-6.14-1.65l.01-2.06Zm-1.26-10.4a4.48 4.48 0 0 1 2.34-1.97v5.68c0 .28.15.54.39.68l5.83 3.37-2.02 1.17a.08.08 0 0 1-.07 0L4.98 14.4a4.5 4.5 0 0 1-1.65-6.14l-.99.04Zm16.6 3.86-5.84-3.37 2.02-1.16a.08.08 0 0 1 .07 0l4.83 2.79a4.5 4.5 0 0 1-.68 8.11v-5.69a.79.79 0 0 0-.4-.68Zm2.01-3.02-.14-.09-4.77-2.77a.78.78 0 0 0-.78 0L9.42 9.65V7.32a.07.07 0 0 1 .03-.07l4.83-2.78a4.5 4.5 0 0 1 6.68 4.66Zm-12.64 4.15L6.29 12.3a.07.07 0 0 1-.03-.06V6.66a4.5 4.5 0 0 1 7.38-3.45l-.14.08-4.78 2.76a.79.79 0 0 0-.39.68l-.02 6.71Zm1.1-2.37 2.6-1.5 2.6 1.5v3l-2.6 1.5-2.6-1.5v-3Z"
      />
    </svg>
  );
}

function Anthropic({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#D97757"
        d="M14.5 3.5h-3.1l5.6 17h3.5l-6-17Zm-6.9 0L1.5 20.5h3.6l1.2-3.5h6.1l1.2 3.5h3.6L11 3.5H7.6Zm-.2 10.4L7.5 8.2l2.1 5.7H7.4Z"
      />
    </svg>
  );
}

function GoogleG({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.55-5.17 3.55-8.87z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.95-2.91l-3.88-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.23 0 12 0A12 12 0 0 0 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  );
}

function MetaMark({ s }: { s: number }) {
  return (
    <svg width={s} height={s * 0.66} viewBox="0 0 36 24" aria-hidden>
      <path
        fill="#0866FF"
        d="M6.9 3.5C3.6 3.5 1.5 7.2 1.5 11.6c0 3.4 1.4 6 3.9 6 2 0 3.3-1.4 5-4.5.5-.9 1.1-2.1 1.7-3.3.5 1 .9 1.8 1.2 2.4l.9 1.8c1.9 3.7 3.5 3.6 4.8 3.6h.1c-1.4 0-2.3-1.3-4-4.6l-1.2-2.3c1.6-2.7 3-4.4 4.8-4.4 1.9 0 3.4 1.9 3.4 5 0 2-.5 3.2-1.4 3.2-.6 0-.9-.4-.9-1.1V13c0-.2 0-.5.1-.7l-1.9.5c0 .6.1 1.1.3 1.6.6 1.4 1.7 2.2 3.1 2.2 2.6 0 4.1-2.4 4.1-6.4C29.3 6.6 27 3.5 23.6 3.5c-2.6 0-4.6 2-6.3 4.9-1.6-3-3.3-4.9-6-4.9h-.4Zm.2 2c1.5 0 2.7 1.4 4.1 4-1.7 3.3-2.9 5.4-4.4 5.4-1.3 0-2-1.4-2-3.9 0-3.2 1.1-5.5 2.3-5.5Z"
      />
    </svg>
  );
}

function Perplexity({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#20808D"
        d="M12 2.5 6 6.9h3.6v-3l2.4 1.8V2.5Zm0 0v3.2l2.4-1.8v3H18L12 2.5ZM3.5 7.4v6.4h1.9v5.7l6.6-4.9v4.9h.9v-4.9l6.6 4.9v-5.7h1.9V7.4H3.5Zm7.9 1v5.2l-5.2-.02V8.4h5.2Zm1.2 0h5.2v5.18l-5.2.02V8.4Z"
      />
    </svg>
  );
}

function ByteDance({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
      <path fill="#25F4EE" d="M2.5 6.5 6 5.2v13.6l-3.5 1.3V6.5Z" />
      <path fill="#000000" d="M8.7 3.5 12 2.2v19.6l-3.3 1.3V3.5Z" />
      <path fill="#FE2C55" d="M15 6.5l3.5-1.3v13.6L15 20.1V6.5Z" />
      <path fill="#000000" d="M21.5 3.5v17l-3.5-1.3V4.8L21.5 3.5Z" opacity="0" />
    </svg>
  );
}

function CommonCrawl({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="#1A1A18" />
      <path fill="#fff" d="M16.2 9.4a4.6 4.6 0 1 0 0 5.2l-1.7-1a2.6 2.6 0 1 1 0-3.2l1.7-1Z" />
    </svg>
  );
}

function AmazonMark({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#232F3E"
        d="M4 4.5h2.2v9.8H4V4.5Zm.02-3.3 2.16-.5v2.1L4.02 3.3v-2.1ZM9.2 6.1c1.2-1.4 3.6-1.3 3.6 1.4v6.8h-2.2V8.3c0-1.2-1.6-1.2-1.6.1v5.9H6.9V4.6h2.1v1.5h.2Z"
      />
      <path fill="#FF9900" d="M18.7 18.8c-2.6 1.9-6.3 2.9-9.5 2.9a17.3 17.3 0 0 1-11.6-4.4c-.24-.22 0-.52.3-.35a23.5 23.5 0 0 0 11.6 3.08c2.8 0 5.9-.6 8.7-1.8.42-.18.78.28.5.94Z" transform="translate(1.5 0)" />
      <path fill="#FF9900" d="M19.8 17.5c-.36-.46-2.3-.22-3.1-.11-.25.03-.29-.19-.06-.35 1.5-1.06 4-.76 4.3-.4.3.36-.08 2.8-1.5 4-.22.18-.42.08-.33-.16.32-.8 1.05-2.6.7-2.98Z" transform="translate(0.5 0)" />
    </svg>
  );
}

function Cohere({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="#39594C" />
      <path fill="#D18EE2" d="M9.3 12.4c0-.9.5-1.4 1.6-1.9l3.4-1.5c.9-.4 1.3-.5 1.9-.5 1.3 0 2.2 1 2.2 2.4 0 1.1-.6 1.7-1.9 2.3l-3.3 1.5c-1 .5-1.5.6-2.2.6-1.1 0-1.7-.9-1.7-2.4Z" />
      <circle cx="7" cy="12" r="2.4" fill="#FF7759" />
    </svg>
  );
}

/* operator (küçük harf) → işaret bileşeni */
const ISARET: Record<string, (p: { s: number }) => React.ReactElement> = {
  openai: OpenAI,
  anthropic: Anthropic,
  google: GoogleG,
  meta: MetaMark,
  perplexity: Perplexity,
  bytedance: ByteDance,
  "common crawl": CommonCrawl,
  amazon: AmazonMark,
  cohere: Cohere,
};

export function AiOperatorLogo({
  operator,
  urun,
  logo,
  boyut = 44,
  className = "",
}: OperatorLogoProps) {
  const key = operator.trim().toLowerCase();
  const Isaret = ISARET[key];

  // Fallback: bilinmeyen operatör → marka renkli baş-harf rozeti (eski davranış).
  if (!Isaret) {
    const harf = (urun || operator).charAt(0).toUpperCase();
    return (
      <span
        className={`grid shrink-0 place-items-center rounded-2xl font-bold text-white shadow-sm ${className}`}
        style={{ width: boyut, height: boyut, background: logo || "#4f46e5", fontSize: boyut * 0.4 }}
        aria-hidden
      >
        {harf}
      </span>
    );
  }

  return (
    <span
      className={`grid shrink-0 place-items-center rounded-2xl bg-white ring-1 ring-black/5 shadow-sm ${className}`}
      style={{ width: boyut, height: boyut }}
      title={operator}
    >
      <Isaret s={Math.round(boyut * 0.52)} />
    </span>
  );
}
