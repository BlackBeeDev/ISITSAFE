import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { getScanResult } from "@/services/results";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { VerdictCard } from "@/components/verdict-card";

export default async function ResultPage({
  params
}: {
  params: { id: string };
}) {
  const result = await getScanResult(params.id);

  if (!result) {
    notFound();
  }

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Scan result</p>
            <p className="mt-1 truncate font-mono text-sm text-slate-700">{result.url}</p>
          </div>
          <Link
            href="/"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" />
            New scan
          </Link>
        </div>

        <div className="mt-6">
          <VerdictCard
            url={result.url}
            status={result.status}
            score={result.score}
            explanation={result.explanation}
            screenshot={result.screenshot}
          />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
