"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/** Highlight — kelime arkasında hafif eğik renk bloğu (imza öğesi). */
export function Highlight({
  children,
  variant = "indigo",
}: {
  children: React.ReactNode;
  variant?: "teal" | "dark" | "indigo" | "gradient";
}) {
  const styles = {
    teal: "bg-specter-300 text-abyss-900",
    dark: "bg-abyss-900 text-specter-300",
    indigo: "bg-veylify-100 text-veylify-700",
    gradient: "bg-gradient-to-r from-veylify-600 to-violet-600 bg-clip-text text-transparent",
  };
  // Gradyan varyant metin-boyar; blok yok.
  if (variant === "gradient") {
    return <span className={cn("font-bold", styles.gradient)}>{children}</span>;
  }
  return (
    <span
      className={cn(
        "box-decoration-clone inline-block -rotate-[0.5deg] rounded-[6px] px-2.5 py-0.5 leading-tight",
        styles[variant],
      )}
    >
      {children}
    </span>
  );
}

/** Badge / eyebrow pill. */
export function Badge({
  children,
  variant = "indigo",
}: {
  children: React.ReactNode;
  variant?: "teal" | "dark" | "soft" | "white" | "indigo";
}) {
  const styles = {
    teal: "bg-specter-300/90 text-abyss-900",
    dark: "bg-abyss-900 text-specter-300",
    soft: "bg-specter-500/10 text-specter-300 ring-1 ring-specter-500/20",
    white: "bg-white text-abyss-900 shadow-soft",
    indigo: "bg-veylify-50 text-veylify-700 ring-1 ring-veylify-100",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider",
        styles[variant],
      )}
    >
      {children}
    </span>
  );
}

/** Scroll reveal — IntersectionObserver ile .in-view ekler. */
export function Reveal({
  children,
  delay,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: 1 | 2 | 3 | 4 | 5;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}) {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // IntersectionObserver yoksa (SSR sonrası eski/headless) → hemen görünür.
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    // Zaten viewport içindeyse (ilk ekran) anında göster — observer'ı bekleme.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setSeen(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          obs.disconnect();
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px -8% 0px" },
    );
    obs.observe(el);
    // GÜVENLİK AĞI: 1.2sn içinde observer tetiklenmezse yine de göster
    // (bazı headless/otomasyon ortamları IO'yu geç/eksik tetikler → içerik
    // asla opacity:0'da KALMAMALI). Kullanıcı hiçbir zaman boş bölüm görmez.
    const zamanlayici = window.setTimeout(() => setSeen(true), 1200);
    return () => {
      obs.disconnect();
      window.clearTimeout(zamanlayici);
    };
  }, []);
  const Comp = Tag as React.ElementType;
  return (
    <Comp
      ref={ref}
      className={cn("reveal", delay && `d${delay}`, seen && "in-view", className)}
    >
      {children}
    </Comp>
  );
}
