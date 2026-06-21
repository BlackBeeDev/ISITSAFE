"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

type ShareResultButtonProps = {
  scanId: string;
  scannedUrl: string;
  status: string;
  score: number;
  className?: string;
};

export function ShareResultButton({
  scanId,
  scannedUrl,
  status,
  score,
  className
}: ShareResultButtonProps) {
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  async function onShare() {
    const resultUrl = `${window.location.origin}/results/${scanId}`;
    const title = `IsItSafe result: ${status}`;
    const text = `IsItSafe scanned ${scannedUrl} and rated it ${status} with a risk score of ${score}/100.`;

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url: resultUrl });
        setMessage("Share sheet opened.");
        return;
      }

      await navigator.clipboard.writeText(`${text}\n${resultUrl}`);
      setCopied(true);
      setMessage("Result link copied.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return;
      }

      setMessage("Could not share. Copy the result page URL from your browser.");
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={onShare}
        className={
          className ??
          "inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-800"
        }
      >
        {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
        {copied ? "Copied" : "Share result"}
      </button>
      {message ? <span className="text-xs font-medium text-slate-500">{message}</span> : null}
    </div>
  );
}
