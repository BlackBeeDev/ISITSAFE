"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Shield,
  Image as ImageIcon,
  Link2,
  Database,
  Brain,
  ClipboardCheck,
  Check,
  Plus,
  Share2,
  Flag,
  AlertTriangle,
  Monitor,
  Smartphone,
  CheckCircle2,
  XCircle
} from "lucide-react";
import type { ScanRecord } from "@/services/types";
import { verdictStyle, type VerdictBand } from "@/lib/verdict";
import { RiskGauge } from "@/components/risk-gauge";

type StepDef = {
  label: string;
  dur: number;
  icon: typeof Shield;
  sources?: boolean;
  verdict?: boolean;
};

const STEPS: StepDef[] = [
  { label: "Opening the page in a safe sandbox", dur: 1100, icon: Shield },
  { label: "Taking a screenshot", dur: 1000, icon: ImageIcon },
  { label: "Checking the web address", dur: 900, icon: Link2 },
  { label: "Cross-checking threat databases", dur: 1300, icon: Database, sources: true },
  { label: "Reading the page like a human", dur: 1400, icon: Brain },
  { label: "Forming a verdict", dur: 700, icon: ClipboardCheck, verdict: true }
];

const SOURCES = ["Google Safe Browsing", "VirusTotal", "URLScan"];
const BAND_ICON: Record<VerdictBand, typeof CheckCircle2> = {
  safe: CheckCircle2,
  caution: AlertTriangle,
  unsafe: XCircle
};

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function ScanProgress({ url }: { url: string }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [doneCount, setDoneCount] = useState(0);
  const [checkedSources, setCheckedSources] = useState(0);
  const [record, setRecord] = useState<ScanRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [typed, setTyped] = useState("");
  const [elapsed, setElapsed] = useState(0);

  const recordRef = useRef<ScanRecord | null>(null);
  const errorRef = useRef<string | null>(null);

  // Run the real scan + the cosmetic animation concurrently, revealing the
  // real verdict only once BOTH the scan has returned and the animation has
  // played through (the "Forming a verdict" step waits for the real result).
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const reduce = prefersReducedMotion();
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));

    const startedAt = Date.now();
    const elapsedTimer = setInterval(() => {
      if (!recordRef.current && !errorRef.current) {
        setElapsed((Date.now() - startedAt) / 1000);
      }
    }, 100);

    const failHard = setTimeout(() => {
      if (!recordRef.current && !errorRef.current) {
        errorRef.current = "This scan took too long. Please try again.";
        setError(errorRef.current);
        controller.abort();
      }
    }, 30000);

    // --- real work ---
    (async () => {
      try {
        const res = await fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
          signal: controller.signal
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Scan failed");

        const lookup = await fetch(`/api/result?id=${data.id}`, { signal: controller.signal });
        const rec = (await lookup.json()) as ScanRecord;
        if (!lookup.ok) throw new Error("Could not load the result");

        recordRef.current = rec;
        if (!cancelled) setRecord(rec);
      } catch (err) {
        if (cancelled || (err as Error)?.name === "AbortError") return;
        errorRef.current = err instanceof Error ? err.message : "Scan failed";
        setError(errorRef.current);
      }
    })();

    // --- cosmetic animation ---
    (async () => {
      for (let i = 0; i < STEPS.length; i++) {
        if (cancelled || errorRef.current) return;
        const step = STEPS[i];
        setStepIndex(i);

        if (step.sources) {
          await sleep(step.dur * 0.3);
          for (let k = 0; k < SOURCES.length; k++) {
            if (cancelled || errorRef.current) return;
            await sleep(step.dur * 0.22);
            setCheckedSources(k + 1);
          }
        } else if (step.verdict) {
          await sleep(step.dur * 0.5);
          // dual gate: hold the final step until the real result is in
          while (!cancelled && !recordRef.current && !errorRef.current) {
            await sleep(150);
          }
        } else {
          await sleep(step.dur);
        }

        if (cancelled || errorRef.current) return;
        setDoneCount(i + 1);
      }

      if (!cancelled && !errorRef.current) setRevealed(true);
    })();

    return () => {
      cancelled = true;
      controller.abort();
      clearInterval(elapsedTimer);
      clearTimeout(failHard);
    };
  }, [url]);

  // Typewriter for the real explanation once revealed.
  useEffect(() => {
    if (!revealed || !record) return;
    const text = record.explanation;
    if (prefersReducedMotion()) {
      setTyped(text);
      return;
    }
    let i = 0;
    const iv = setInterval(() => {
      i += 1;
      setTyped(text.slice(0, i));
      if (i >= text.length) clearInterval(iv);
    }, 14);
    return () => clearInterval(iv);
  }, [revealed, record]);

  const style = record ? verdictStyle(record.score, record.status) : null;
  const BandIcon = style ? BAND_ICON[style.band] : null;
  const screenshotReady = record && doneCount >= 2;

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-red-100 text-red-600">
            <AlertTriangle className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-xl font-bold text-red-700">We couldn&apos;t finish this scan</h1>
          <p className="mt-2 break-words text-sm text-red-700/90">{error}</p>
          <p className="mt-1 font-mono text-xs text-slate-500">{url}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
            >
              Try again
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              New scan
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      {/* scan header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Checking this link</p>
          <div className="mt-1 flex items-center gap-2">
            <Link2 className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="truncate font-mono text-sm text-slate-700">{url}</span>
          </div>
        </div>
        <Link
          href="/"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <Plus className="h-4 w-4" />
          New scan
        </Link>
      </div>

      <div className="mt-6 grid items-stretch gap-5 lg:grid-cols-[1.618fr_1fr]">
        {/* PROCESS */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-brand-900">What IsItSafe is doing</h2>
            <span className="font-mono text-xs text-slate-400">{elapsed.toFixed(1)}s</span>
          </div>

          <ol className="mt-5">
            {STEPS.map((step, i) => {
              const isDone = i < doneCount;
              const isActive = !isDone && i === stepIndex;
              const StepIcon = step.icon;
              const showSources = step.sources && (isActive || isDone);
              return (
                <li key={step.label} className="relative flex gap-3 pb-4">
                  {i < STEPS.length - 1 ? (
                    <span
                      className="step-line absolute left-[15px] top-9 h-[calc(100%-1.5rem)] w-0.5"
                      style={{ backgroundColor: isDone ? "#C3E29A" : "#E2E8F0" }}
                    />
                  ) : null}
                  <span
                    className={
                      "z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 " +
                      (isDone
                        ? "border-safe-600 bg-safe-50 text-safe-700"
                        : isActive
                          ? "border-brand-600 bg-brand-50 text-brand-700"
                          : "border-slate-200 bg-white text-slate-300")
                    }
                  >
                    {isDone ? (
                      <Check className="h-4 w-4" />
                    ) : isActive ? (
                      <span className="spin block h-4 w-4 rounded-full border-2 border-brand-200 border-t-brand-600" />
                    ) : (
                      <StepIcon className="h-[18px] w-[18px]" />
                    )}
                  </span>
                  <div className="pt-1">
                    <p
                      className={
                        "text-sm " +
                        (isActive
                          ? "font-semibold text-brand-900"
                          : isDone
                            ? "font-medium text-slate-700"
                            : "font-medium text-slate-400")
                      }
                    >
                      {step.label}
                    </p>
                    {showSources ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {SOURCES.map((src, k) => {
                          const checked = k < checkedSources;
                          return (
                            <span
                              key={src}
                              className={
                                "inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium " +
                                (checked
                                  ? "border-brand-200 bg-brand-50 text-brand-700"
                                  : "border-slate-200 bg-slate-50 text-slate-500")
                              }
                            >
                              {checked ? <Check className="h-3 w-3" /> : null}
                              {src}
                            </span>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>

          {/* reasoning */}
          <div className="mt-2 rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">In plain words</p>
            <p className="mt-1.5 min-h-[3.5rem] leading-relaxed text-slate-700">
              {revealed ? typed : "Waiting for the analysis to finish…"}
            </p>
            {revealed && style && BandIcon ? (
              <>
                <div
                  className={`mt-3 flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-semibold fade-in ${style.bg} ${style.text}`}
                >
                  <BandIcon className="h-4 w-4 shrink-0" />
                  {style.action}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {record ? (
                    <Link
                      href={`/results/${record.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-800"
                    >
                      <Share2 className="h-4 w-4" />
                      Save &amp; share
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    title="Coming soon"
                    className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600"
                  >
                    <Flag className="h-4 w-4" />
                    Report this site
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </section>

        {/* RESULT preview + gauge */}
        <aside className="flex flex-col gap-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Page preview</p>
            {screenshotReady && record?.screenshot ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={record.screenshot}
                alt="Screenshot of the scanned page"
                className="aspect-[16/10] w-full rounded-lg border border-slate-200 object-cover object-top fade-in"
              />
            ) : screenshotReady ? (
              <div className="flex aspect-[16/10] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-400">
                No screenshot captured
              </div>
            ) : (
              <div className="shimmer flex aspect-[16/10] items-center justify-center rounded-lg border border-slate-200">
                <span className="text-xs font-medium text-slate-400">Capturing safely…</span>
              </div>
            )}
          </div>

          <div className="flex flex-1 flex-col justify-center rounded-2xl border border-slate-200 bg-white p-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Risk score</p>
            {revealed && record && style ? (
              <>
                <div className="mt-2">
                  <RiskGauge score={record.score} ring={style.ring} />
                </div>
                <p
                  className="mt-2 flex items-center justify-center gap-1.5 text-base font-bold"
                  style={{ color: style.ring }}
                >
                  {BandIcon ? <BandIcon className="h-4 w-4" /> : null} {style.word}
                </p>
              </>
            ) : (
              <>
                <div className="relative mx-auto mt-2 h-[150px] w-[150px]">
                  <svg viewBox="0 0 120 120" className="h-full w-full">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#E9EEF3" strokeWidth="12" />
                    <circle
                      id="gaugeScan"
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke="#AECBE3"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray="45 281"
                      transform="rotate(-90 60 60)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-extrabold leading-none text-slate-300">–</span>
                    <span className="mt-1 text-[11px] font-medium text-slate-400">out of 100</span>
                  </div>
                </div>
                <p className="mt-2 text-base font-bold text-slate-400">Analyzing…</p>
              </>
            )}
          </div>
        </aside>
      </div>

      {/* roadmap placeholders */}
      <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Coming soon to IsItSafe</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-500">
            <Monitor className="h-4 w-4" />
            Browser extension
            <span className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
              Soon
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-500">
            <Smartphone className="h-4 w-4" />
            Mobile app
            <span className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
              Soon
            </span>
          </span>
        </div>
      </div>
    </main>
  );
}
