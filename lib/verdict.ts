import type { ScanStatus } from "@/services/types";

export type VerdictBand = "safe" | "caution" | "unsafe";

export type VerdictStyle = {
  band: VerdictBand;
  /** Short headline, e.g. "Safe", "Caution", "Unsafe" */
  word: string;
  /** One-line subtext */
  sub: string;
  /** Recommended action sentence */
  action: string;
  /** Solid accent color (hex) for the gauge ring and score number */
  ring: string;
  /** Tailwind background class for callout banners */
  bg: string;
  /** Tailwind border class for callout banners */
  border: string;
  /** Tailwind text color class for the band */
  text: string;
};

/**
 * Maps the backend's two-state result (status + 0-100 score) onto the
 * three visual bands used by the design. "Caution" is a purely presentational
 * middle band that lives entirely inside the backend's "safe" range, so the UI
 * never contradicts the real safe/unsafe verdict.
 *
 *   score 0-24   -> safe
 *   score 25-49  -> caution   (still status === "safe")
 *   score 50-100 -> unsafe    (status === "unsafe")
 */
export function scoreToBand(score: number, status: ScanStatus): VerdictBand {
  if (status === "unsafe" || score >= 50) {
    return "unsafe";
  }
  if (score >= 25) {
    return "caution";
  }
  return "safe";
}

const STYLES: Record<VerdictBand, VerdictStyle> = {
  safe: {
    band: "safe",
    word: "Safe",
    sub: "No problems found",
    action: "Safe to continue.",
    ring: "#7FBF4A",
    bg: "bg-safe-50",
    border: "border-safe-200",
    text: "text-safe-800"
  },
  caution: {
    band: "caution",
    word: "Caution",
    sub: "A few things to watch",
    action: "Be careful — double-check before you enter anything.",
    ring: "#F59E0B",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-800"
  },
  unsafe: {
    band: "unsafe",
    word: "Unsafe",
    sub: "Do not continue",
    action: "Don't continue — close this page.",
    ring: "#DC2626",
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700"
  }
};

export function verdictStyle(score: number, status: ScanStatus): VerdictStyle {
  return STYLES[scoreToBand(score, status)];
}
