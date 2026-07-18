"use client";

/**
 * Canlı Ghost-Font metni. Hareketli nokta gürültüsü içinde mesajı
 * gösterir — insan okur, statik ekran görüntüsü (OCR/AI) gürültü görür.
 */
import { useEffect, useRef } from "react";
import { GhostField } from "@/lib/specter/ghostfont";
import { cn } from "@/lib/cn";

export function GhostText({
  text,
  decoy = "",
  width = 640,
  height = 200,
  cell = 4,
  className,
  invert = false,
  color = "#0b1120",
  bg = "#e8ecef",
  paused = false,
}: {
  text: string;
  /** Tuzak mesajı — tek-kare OCR/AI bunu okuyup yanılır (gerçek `text` gizli). */
  decoy?: string;
  width?: number;
  height?: number;
  cell?: number;
  className?: string;
  invert?: boolean;
  color?: string;
  bg?: string;
  paused?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fieldRef = useRef<GhostField | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    fieldRef.current = new GhostField(ctx, { text, decoy, width, height, cell, color, bg });

    let start = 0;
    const loop = (ts: number) => {
      if (!start) start = ts;
      if (!paused) fieldRef.current?.render(ts - start, invert);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, cell, color, bg]);

  // metin değişince mask'i güncelle
  useEffect(() => {
    fieldRef.current?.setText(text);
  }, [text]);

  // decoy değişince tuzak mask'ini güncelle
  useEffect(() => {
    fieldRef.current?.setDecoy(decoy);
  }, [decoy]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className={cn("max-w-full rounded-xl", className)}
    />
  );
}
