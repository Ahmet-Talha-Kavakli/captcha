"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

export function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  const w = 42,
    h = 24,
    knob = 18,
    pad = 3;
  const travel = w - knob - pad * 2;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => !disabled && onChange(!on)}
      className={cn(
        "relative shrink-0 rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-400/60 focus-visible:ring-offset-2",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
      )}
      style={{
        width: w,
        height: h,
        padding: pad,
        display: "inline-flex",
        alignItems: "center",
        boxSizing: "border-box",
        background: on ? "var(--color-brand-600)" : "var(--color-line-strong)",
      }}
    >
      <motion.span
        className="block rounded-full bg-white shadow-sm"
        style={{ width: knob, height: knob }}
        initial={false}
        animate={{ x: on ? travel : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
      />
    </button>
  );
}
