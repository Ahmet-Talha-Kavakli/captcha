"use client";

/**
 * Hero video — clay ekip/koruma animasyonu (baykuş kalkanda, robotlar engelli).
 * Krem zeminli, sessiz, otomatik döngü. Poster ile ilk boya hızlı; reduced-motion
 * kullanıcılarına statik poster gösterilir (video oynatılmaz).
 */
export function HeroVideo({ className = "" }: { className?: string }) {
  return (
    <div className={className} style={{ aspectRatio: "16 / 9" }}>
      <video
        className="h-full w-full rounded-3xl object-cover"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        poster="/pazarlama/hero-poster.jpg"
      >
        <source src="/video/hero.webm" type="video/webm" />
        <source src="/video/hero.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
