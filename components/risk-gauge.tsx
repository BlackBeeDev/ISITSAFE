"use client";

import { useEffect, useState } from "react";

const CIRCUMFERENCE = 327; // 2 * π * r, with r = 52

/**
 * Circular risk gauge (0-100). Animates the arc and counts the number up on
 * mount, and snaps to the final state when the user prefers reduced motion.
 */
export function RiskGauge({ score, ring }: { score: number; ring: string }) {
  const target = Math.max(0, Math.min(100, score));
  const [offset, setOffset] = useState(CIRCUMFERENCE);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const filled = CIRCUMFERENCE * (1 - target / 100);
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      setOffset(filled);
      setDisplay(target);
      return;
    }

    const raf = requestAnimationFrame(() => setOffset(filled));
    let v = 0;
    const step = Math.max(1, Math.round(target / 24));
    const iv = setInterval(() => {
      v = Math.min(target, v + step);
      setDisplay(v);
      if (v >= target) clearInterval(iv);
    }, 32);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(iv);
    };
  }, [target]);

  return (
    <div className="relative mx-auto h-[150px] w-[150px]">
      <svg viewBox="0 0 120 120" className="h-full w-full">
        <circle cx="60" cy="60" r="52" fill="none" stroke="#E9EEF3" strokeWidth="12" />
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke={ring}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold leading-none" style={{ color: ring }}>
          {display}
        </span>
        <span className="mt-1 text-[11px] font-medium text-slate-400">out of 100</span>
      </div>
    </div>
  );
}
