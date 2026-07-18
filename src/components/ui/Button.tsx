import Link from "next/link";
import { cn } from "@/lib/cn";

/** Sentinel DNA butonları: 7 variant, 3 boyut. */
type Variant = "primary" | "accent" | "outline" | "ghost" | "danger" | "success" | "white";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-ink-900 text-white hover:bg-ink-800",
  accent: "bg-ink-900 text-white hover:bg-ink-800",
  outline: "border border-line-strong bg-surface text-slate-ink hover:bg-canvas",
  ghost: "text-slate-ink hover:bg-black/5",
  danger: "bg-danger2 text-white hover:brightness-95",
  success: "bg-ok text-white hover:brightness-95",
  white: "bg-surface text-ink-900 hover:bg-brand-50",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px] gap-1.5 rounded-full",
  md: "h-11 px-5 text-sm gap-2 rounded-full",
  lg: "h-[52px] px-7 text-[15px] gap-2 rounded-full",
};

const base =
  "inline-flex items-center justify-center font-medium transition-all duration-150 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-brand-400/60 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  href?: string;
}

export function Button({ variant = "accent", size = "md", href, className, children, ...rest }: Props) {
  const cls = cn(base, variants[variant], sizes[size], className);
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}
