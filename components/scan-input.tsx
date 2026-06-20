"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Image as ImageIcon, Search, ShieldCheck } from "lucide-react";
import { inspectMessage } from "@/utils/message-agent";

type Mode = "auto" | "link" | "email" | "qr";

const TABS: { key: Mode; label: string }[] = [
  { key: "auto", label: "Auto-detect" },
  { key: "link", label: "Link" },
  { key: "email", label: "Email" },
  { key: "qr", label: "QR / image" }
];

const TYPE_LABEL: Record<Exclude<Mode, "auto">, string> = {
  link: "Link",
  email: "Email",
  qr: "QR code"
};

export function ScanInput() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("auto");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const analysis = value.trim() ? inspectMessage(value) : null;
  const detected = mode === "auto" ? getDetectedMode(analysis) : mode;
  const comingSoon = detected === "qr" && !analysis?.normalizedUrl;

  function onCheck() {
    setError("");
    const trimmed = value.trim();

    if (!trimmed) {
      setError("Paste a link, message, email, or screenshot text to check it.");
      return;
    }

    const result = inspectMessage(trimmed);

    if (!result.normalizedUrl) {
      setError("No scannable link found yet. Paste the message text or the URL from the QR code.");
      return;
    }

    router.push(`/scan?url=${encodeURIComponent(result.normalizedUrl)}`);
  }

  function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files?.[0]) {
      setMode("qr");
    }
  }

  return (
    <div id="scan" className="mt-8">
      <div className="mb-3 inline-flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1">
        {TABS.map((tab) => {
          const on = mode === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setMode(tab.key)}
              className={
                on
                  ? "rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700"
                  : "rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-brand-700"
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-300 bg-white p-3 transition focus-within:border-brand-600 focus-within:ring-4 focus-within:ring-brand-100">
        <label htmlFor="checkInput" className="sr-only">
          Paste a link, an email, or upload a QR image
        </label>
        <textarea
          id="checkInput"
          rows={2}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Paste a link, suspicious email, text message, social DM, or QR screenshot text..."
          className="w-full resize-none border-0 bg-transparent px-2 py-1 text-base text-slate-900 outline-none placeholder:text-slate-400"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-2.5">
          <div className="flex items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700">
              <ImageIcon className="h-4 w-4" />
              Upload image
              <input type="file" accept="image/*" className="hidden" onChange={onFile} />
            </label>
            {detected && detected !== "auto" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                {mode === "auto" ? "Detected: " : ""}
                {TYPE_LABEL[detected]}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onCheck}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-700 px-6 text-base font-semibold text-white transition hover:bg-brand-800 active:scale-[.99]"
          >
            <Search className="h-5 w-5" />
            Check it
          </button>
        </div>
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-500">
        <ShieldCheck className="h-4 w-4 shrink-0" />
        Whatever you paste, we open it far from your device and tell you if it&apos;s safe, usually in under
        15 seconds.
      </p>

      {analysis ? <InputPreview result={analysis} /> : null}
      {error ? <p className="mt-2 text-sm font-medium text-red-600">{error}</p> : null}
      {comingSoon ? (
        <p className="mt-2 text-sm font-medium text-amber-700">
          Image / QR scanning is coming soon. For now, paste the link text from the QR code.
        </p>
      ) : null}
    </div>
  );
}

function getDetectedMode(result: ReturnType<typeof inspectMessage> | null): Mode | null {
  if (!result) {
    return null;
  }

  if (result.inputKind === "email") {
    return "email";
  }

  if (result.inputKind === "qr-text") {
    return "qr";
  }

  return result.normalizedUrl ? "link" : null;
}

function InputPreview({ result }: { result: ReturnType<typeof inspectMessage> }) {
  const warnings = result.signals.filter((signal) => signal.severity !== "info");

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-sm">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div className="min-w-0">
          <p className="font-semibold text-slate-800">
            {result.normalizedUrl ? "Scannable link found" : "No link found yet"}
          </p>
          {result.normalizedUrl ? (
            <p className="mt-1 break-all font-mono text-xs text-slate-500">{result.normalizedUrl}</p>
          ) : null}
          {result.detectedUrls.length > 1 ? (
            <p className="mt-1 text-xs text-amber-700">
              {result.detectedUrls.length} links found. The first valid link will be scanned.
            </p>
          ) : null}
          {warnings.length > 0 ? (
            <ul className="mt-2 grid gap-1 text-xs text-slate-600">
              {warnings.slice(0, 3).map((signal) => (
                <li key={signal.label}>{signal.label}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
