import type { VerdictBand } from "@/lib/verdict";

/**
 * Renders the recommended-action line for a verdict. When the result is safe,
 * the word "continue" becomes a blue, clickable link that opens the scanned
 * site in a new tab. For caution/unsafe results it stays plain text.
 */
export function VerdictAction({
  band,
  action,
  url
}: {
  band: VerdictBand;
  action: string;
  url: string;
}) {
  if (band === "safe") {
    return (
      <span>
        Safe to{" "}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-brand-700 underline underline-offset-2 hover:text-brand-800"
        >
          continue
        </a>
        .
      </span>
    );
  }

  return <span>{action}</span>;
}
