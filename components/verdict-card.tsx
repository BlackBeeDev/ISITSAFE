import { CheckCircle2, AlertTriangle, XCircle, Image as ImageIcon } from "lucide-react";
import { verdictStyle, type VerdictBand } from "@/lib/verdict";
import type { ScanStatus } from "@/services/types";
import { RiskGauge } from "@/components/risk-gauge";
import { VerdictAction } from "@/components/verdict-action";

const ICONS: Record<VerdictBand, typeof CheckCircle2> = {
  safe: CheckCircle2,
  caution: AlertTriangle,
  unsafe: XCircle
};

/**
 * Presentational verdict UI shared by the live scan reveal and the
 * shareable /results/[id] permalink. Driven entirely by the real ScanRecord
 * fields; the safe/caution/unsafe banding comes from lib/verdict.
 */
export function VerdictCard({
  url,
  status,
  score,
  explanation,
  screenshot
}: {
  url: string;
  status: ScanStatus;
  score: number;
  explanation: string;
  screenshot: string | null;
}) {
  const style = verdictStyle(score, status);
  const Icon = ICONS[style.band];

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[1fr_360px]">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className={`flex items-center gap-3 border-b ${style.border} ${style.bg} px-5 py-4`}>
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/70"
            style={{ color: style.ring }}
          >
            <Icon className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className={`text-lg font-bold ${style.text}`}>
              {style.word} — {style.sub}
            </p>
            <p className="truncate font-mono text-xs text-slate-500">{url}</p>
          </div>
        </div>
        <div className="px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">In plain words</p>
          <p className="mt-1.5 leading-relaxed text-slate-700">{explanation}</p>
          <div
            className={`mt-4 flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-semibold ${style.bg} ${style.text}`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <VerdictAction band={style.band} action={style.action} url={url} />
          </div>
        </div>
      </div>

      <aside className="flex flex-col gap-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Page preview</p>
          {screenshot ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={screenshot}
              alt="Screenshot of the scanned page"
              className="aspect-[16/10] w-full rounded-lg border border-slate-200 object-cover object-top"
            />
          ) : (
            <div className="flex aspect-[16/10] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400">
              <div className="text-center">
                <ImageIcon className="mx-auto h-6 w-6" />
                <p className="mt-1 text-xs">No screenshot captured</p>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Risk score</p>
          <div className="mt-2">
            <RiskGauge score={score} ring={style.ring} />
          </div>
          <p
            className="mt-2 flex items-center justify-center gap-1.5 text-base font-bold"
            style={{ color: style.ring }}
          >
            <Icon className="h-4 w-4" /> {style.word}
          </p>
        </div>
      </aside>
    </div>
  );
}
