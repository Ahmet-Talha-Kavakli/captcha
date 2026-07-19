import Image from "next/image";
import { cn } from "@/lib/cn";
import { MARKA } from "@/lib/marka";

/**
 * Veylify marka amblemi — clay/plastisin baykuş maskotu (Veylify'nin görsel
 * dili). Arka planı kaldırılmış transparan PNG; her zemine (krem, koyu, beyaz)
 * dikişsiz oturur. Ölçeklenebilir, keskin.
 */
export function VeylifyMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/pazarlama/logo-baykus.png"
      alt=""
      width={size}
      height={size}
      className={cn("object-contain", className)}
      aria-hidden
      priority
    />
  );
}

/** Geriye dönük uyum: eski SpecterMark çağrıları Veylify amblemine düşer. */
export const SpecterMark = VeylifyMark;

export function Logo({
  size = 28,
  className,
  wordmark = true,
  tone = "dark",
}: {
  size?: number;
  className?: string;
  wordmark?: boolean;
  tone?: "dark" | "light";
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <VeylifyMark size={size} />
      {wordmark && (
        <span
          className={cn(
            "font-display text-[19px] font-extrabold tracking-tight",
            tone === "light" ? "text-white" : "text-ink-900",
          )}
        >
          {MARKA.ad}
        </span>
      )}
    </span>
  );
}
