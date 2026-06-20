"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  FileImage,
  Info,
  LinkIcon,
  MessageSquareText,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { inspectMessage, type MessageAgentResult } from "@/utils/message-agent";

type InputMode = "link" | "message" | "screenshot";

export function ScanForm() {
  const router = useRouter();
  const [mode, setMode] = useState<InputMode>("link");
  const [input, setInput] = useState("");
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [agentResult, setAgentResult] = useState<MessageAgentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const inspected = inspectMessage(input);
    setAgentResult(inspected);

    if (!inspected.normalizedUrl) {
      setError("No scannable link found in this input yet.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: inspected.normalizedUrl })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Scan failed");
      }

      router.push(`/results/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setLoading(false);
    }
  }

  function updateInput(value: string) {
    setInput(value);
    setAgentResult(value.trim() ? inspectMessage(value) : null);
  }

  function onPaste(event: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const pastedText = event.clipboardData.getData("text");
    const inspected = inspectMessage(pastedText);

    if (mode === "link" && inspected.normalizedUrl) {
      event.preventDefault();
      setInput(inspected.normalizedUrl);
    }

    setAgentResult(inspected);
  }

  function onScreenshotChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setScreenshotPreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setScreenshotPreview(String(reader.result));
    reader.readAsDataURL(file);
  }

  function selectMode(nextMode: InputMode) {
    setMode(nextMode);
    setError("");
    setAgentResult(input.trim() ? inspectMessage(input) : null);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <div className="grid grid-cols-3 gap-2 rounded-md border border-slate-200 bg-white p-1">
        <ModeButton active={mode === "link"} icon={<LinkIcon />} onClick={() => selectMode("link")}>
          Link
        </ModeButton>
        <ModeButton
          active={mode === "message"}
          icon={<MessageSquareText />}
          onClick={() => selectMode("message")}
        >
          Text
        </ModeButton>
        <ModeButton
          active={mode === "screenshot"}
          icon={<FileImage />}
          onClick={() => selectMode("screenshot")}
        >
          Image
        </ModeButton>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        {mode === "link" ? (
          <input
            className="h-12 rounded-md border border-slate-300 bg-white px-4 text-base outline-none ring-emerald-600 transition focus:ring-2"
            onChange={(event) => updateInput(event.target.value)}
            onPaste={onPaste}
            placeholder="Paste a suspicious link"
            required
            type="text"
            value={input}
          />
        ) : (
          <textarea
            className="min-h-32 rounded-md border border-slate-300 bg-white px-4 py-3 text-base outline-none ring-emerald-600 transition focus:ring-2 sm:min-h-12"
            onChange={(event) => updateInput(event.target.value)}
            onPaste={onPaste}
            placeholder={
              mode === "message"
                ? "Paste the suspicious text message"
                : "Paste any text from the screenshot"
            }
            required
            value={input}
          />
        )}
        <Button disabled={loading} type="submit">
          <Search className="mr-2 h-4 w-4" />
          {loading ? "Scanning" : "Scan"}
        </Button>
      </div>

      {mode === "screenshot" ? (
        <div className="rounded-md border border-dashed border-slate-300 bg-white p-4">
          <input
            accept="image/*"
            className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
            onChange={onScreenshotChange}
            type="file"
          />
          {screenshotPreview ? (
            <img
              alt="Uploaded screenshot preview"
              className="mt-4 max-h-72 w-full rounded-md border object-contain"
              src={screenshotPreview}
            />
          ) : null}
        </div>
      ) : null}

      {agentResult ? <AgentPreview result={agentResult} /> : null}
      {error ? <p className="text-sm text-red-600 sm:col-span-2">{error}</p> : null}
    </form>
  );
}

function ModeButton({
  active,
  children,
  icon,
  onClick
}: {
  active: boolean;
  children: React.ReactNode;
  icon: React.ReactElement<{ className?: string }>;
  onClick: () => void;
}) {
  return (
    <button
      className={`inline-flex h-10 items-center justify-center gap-2 rounded px-3 text-sm font-medium transition ${
        active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
      }`}
      onClick={onClick}
      type="button"
    >
      {React.cloneElement(icon, { className: "h-4 w-4" })}
      {children}
    </button>
  );
}

function AgentPreview({ result }: { result: MessageAgentResult }) {
  const hasWarnings = result.signals.some((signal) => signal.severity !== "info");
  const title = result.normalizedUrl
    ? "Scannable link found"
    : result.messageSignals.length > 0
      ? "Suspicious message signals found"
      : "Waiting for a scannable link";
  const inputLabel = getInputLabel(result.inputKind);

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 text-sm shadow-sm">
      <div className="flex items-start gap-3">
        {hasWarnings ? (
          <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
        ) : result.isValidUrl ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
        ) : (
          <Info className="mt-0.5 h-5 w-5 text-slate-500" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{title}</p>
            {inputLabel ? (
              <span className="rounded border border-slate-200 px-2 py-0.5 text-xs text-slate-600">
                {inputLabel}
              </span>
            ) : null}
            {result.detectedUrls.length > 1 ? (
              <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-800">
                {result.detectedUrls.length} links
              </span>
            ) : null}
          </div>
          {result.normalizedUrl ? (
            <p className="mt-1 break-all text-slate-600">{result.normalizedUrl}</p>
          ) : null}
          {result.domain ? (
            <p className="mt-1 text-slate-500">Domain: {result.domain}</p>
          ) : null}
          {result.messageSignals.length > 0 ? (
            <p className="mt-2 text-slate-600">Message risk: {result.riskLabel}</p>
          ) : null}
          {result.signals.length > 0 ? (
            <ul className="mt-3 grid gap-1 text-slate-600">
              {result.signals.map((signal) => (
                <li key={signal.label}>{signal.label}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-slate-600">No obvious paste-level issues found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function getInputLabel(kind: MessageAgentResult["inputKind"]) {
  const labels: Record<MessageAgentResult["inputKind"], string> = {
    empty: "",
    url: "Link",
    sms: "SMS",
    email: "Email",
    social: "Social",
    "qr-text": "QR text",
    "mixed-text": "Mixed text"
  };

  return labels[kind];
}
