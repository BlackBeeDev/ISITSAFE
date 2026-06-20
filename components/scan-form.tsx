"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Info, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inspectPastedLink, type LinkAgentResult } from "@/utils/link-agent";

export function ScanForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [agentResult, setAgentResult] = useState<LinkAgentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const inspected = inspectPastedLink(url);
    setAgentResult(inspected);

    if (!inspected.normalizedUrl) {
      setError("Paste a valid URL to scan.");
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

  function updateUrl(value: string) {
    setUrl(value);
    setAgentResult(value.trim() ? inspectPastedLink(value) : null);
  }

  function onPaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const pastedText = event.clipboardData.getData("text");
    const inspected = inspectPastedLink(pastedText);

    if (inspected.normalizedUrl) {
      event.preventDefault();
      setUrl(inspected.normalizedUrl);
    }

    setAgentResult(inspected);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-[1fr_auto]">
      <input
        className="h-12 rounded-md border border-slate-300 bg-white px-4 text-base outline-none ring-emerald-600 transition focus:ring-2"
        onChange={(event) => updateUrl(event.target.value)}
        onPaste={onPaste}
        placeholder="Paste a suspicious link"
        required
        type="text"
        value={url}
      />
      <Button disabled={loading} type="submit">
        <Search className="mr-2 h-4 w-4" />
        {loading ? "Scanning" : "Scan"}
      </Button>
      {agentResult ? <AgentPreview result={agentResult} /> : null}
      {error ? <p className="text-sm text-red-600 sm:col-span-2">{error}</p> : null}
    </form>
  );
}

function AgentPreview({ result }: { result: LinkAgentResult }) {
  const hasWarnings = result.signals.some((signal) => signal.severity !== "info");

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 text-sm shadow-sm sm:col-span-2">
      <div className="flex items-start gap-3">
        {hasWarnings ? (
          <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
        ) : result.isValidUrl ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
        ) : (
          <Info className="mt-0.5 h-5 w-5 text-slate-500" />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-medium">
            {result.normalizedUrl ? "Link detected" : "Waiting for a valid link"}
          </p>
          {result.normalizedUrl ? (
            <p className="mt-1 break-all text-slate-600">{result.normalizedUrl}</p>
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
