import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { ReportPanel } from "@/components/report-panel";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { ShareResultButton } from "@/components/share-result-button";
import { VerdictCard } from "@/components/verdict-card";
import { REPORT_AUTHORITIES } from "@/services/reporting";
import { getScanResult } from "@/services/results";
import type { EvidenceStatus, ScanEvidence } from "@/services/types";
import { verdictStyle } from "@/lib/verdict";

export default async function ResultPage({
  params
}: {
  params: { id: string };
}) {
  const result = await getScanResult(params.id);

  if (!result) {
    notFound();
  }

  const isUnsafe = result.status === "unsafe";
  const style = verdictStyle(result.score, result.status);

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Scan result</p>
            <p className="mt-1 truncate font-mono text-sm text-slate-700">{result.url}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ShareResultButton
              scanId={result.id}
              scannedUrl={result.url}
              status={style.word}
              score={result.score}
            />
            <Link
              href="/"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" />
              New scan
            </Link>
          </div>
        </div>

        <div className="mt-6">
          <VerdictCard
            url={result.url}
            status={result.status}
            score={result.score}
            explanation={result.explanation}
            screenshot={result.screenshot}
            video={result.video}
          />
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_360px]">
          <EvidencePanel evidence={result.evidence ?? []} />
          {isUnsafe ? (
            <ReportPanel authorities={REPORT_AUTHORITIES} scanId={result.id} />
          ) : null}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function EvidencePanel({ evidence }: { evidence: ScanEvidence[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-semibold text-brand-900">Scan evidence</h2>
        <span className="text-sm text-slate-500">{evidence.length} checks</span>
      </div>

      {evidence.length > 0 ? (
        <div className="mt-4 grid gap-3">
          {evidence.map((item) => (
            <article
              className="rounded-xl border border-slate-200 p-4"
              key={`${item.source}-${item.summary}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-medium text-slate-900">{item.source}</h3>
                  <p className="mt-1 text-sm text-slate-600">{item.summary}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={item.status} />
                  <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                    +{item.scoreImpact}
                  </span>
                </div>
              </div>
              {item.details.length > 0 ? (
                <ul className="mt-3 grid gap-1 text-sm text-slate-600">
                  {item.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-600">
          No structured evidence was saved for this scan.
        </p>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: EvidenceStatus }) {
  const styles = {
    clean: "bg-emerald-100 text-emerald-800",
    flagged: "bg-red-100 text-red-800",
    unavailable: "bg-amber-100 text-amber-800"
  };

  return (
    <span className={`rounded px-2 py-1 text-xs font-semibold ${styles[status]}`}>
      {status}
    </span>
  );
}
