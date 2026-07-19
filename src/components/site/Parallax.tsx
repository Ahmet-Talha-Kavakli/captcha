"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Hafif parallax katmanı — scroll ilerledikçe içeriği `hiz` oranında dikeyde
 * kaydırır (derinlik hissi). Sadece transform kullanır (ucuz, 60fps).
 * reduced-motion'da devre dışı. Dekoratif öğeler için tasarlandı.
 *
 * hiz > 0 → yavaş kayar (arka planda kalır hissi), hiz < 0 → ters yön.
 */
export function ParallaxKatman({
  children,
  hiz = 0.15,
  className = "",
}: {
  children: ReactNode;
  hiz?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const guncelle = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      // Öğe viewport ortasına göre ne kadar uzakta → o kadar kaydır.
      const merkez = r.top + r.height / 2 - window.innerHeight / 2;
      el.style.transform = `translate3d(0, ${(-merkez * hiz).toFixed(1)}px, 0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(guncelle);
    };
    guncelle();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [hiz]);

  return (
    <div ref={ref} className={`will-change-transform ${className}`}>
      {children}
    </div>
  );
}
