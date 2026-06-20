"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Image as ImageIcon, ShieldCheck } from "lucide-react";
import { detectType, normalizeLink, type InputType } from "@/lib/detect-input";

type Mode = "auto" | InputType;

const TABS: { key: Mode; label: string }[] = [
  { key: "auto", label: "Auto-detect" },
  { key: "link", label: "Link" },
  { key: "email", label: "Email" },
  { key: "qr", label: "QR / image" }
];

const TYPE_LABEL: Record<InputType, string> = {
  link: "Link",
  email: "Email",
  qr: "QR code"
};

export function ScanInput() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("auto");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const detected: InputType | null = mode === "auto" ? detectType(value) : mode;
  const comingSoon = detected === "email" || detected === "qr";

  function onCheck() {
    setError("");
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Paste a link to check it.");
      return;
    }

    const type: InputType | null = mode === "auto" ? detectType(trimmed) : mode;

    if (type !== "link") {
      return; // email / QR are placeholders — the coming-soon note is already shown
    }

    const link = normalizeLink(trimmed);
    try {
      // eslint-disable-next-line no-new
      new URL(link);
    } catch {
      setError("That doesn't look like a valid link.");
      return;
    }

    router.push(`/scan?url=${encodeURIComponent(link)}`);
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
          placeholder="Paste a link, paste a suspicious email, or drop in a QR code image…"
          className="w-full resize-none border-0 bg-transparent px-2 py-1 text-base text-slate-900 outline-none placeholder:text-slate-400"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-2.5">
          <div className="flex items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700">
              <ImageIcon className="h-4 w-4" />
              Upload image
              <input type="file" accept="image/*" className="hidden" onChange={onFile} />
            </label>
            {detected ? (
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
        Whatever you paste, we open it far from your device and tell you if it's safe — usually in under 15
        seconds.
      </p>

      {error ? <p className="mt-2 text-sm font-medium text-red-600">{error}</p> : null}
      {comingSoon ? (
        <p className="mt-2 text-sm font-medium text-amber-700">
          {detected === "email" ? "Email scanning" : "Image / QR scanning"} is coming soon — for now, paste a
          link to check it.
        </p>
      ) : null}
    </div>
  );
}
