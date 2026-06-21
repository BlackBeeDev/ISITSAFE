import Link from "next/link";
import { notFound } from "next/navigation";
import { getScanResult } from "@/services/results";
import { ScreenshotPreview } from "@/components/screenshot-preview";

const STATUS_STYLES = {
  safe: { label: "Safe", className: "text-emerald-600" },
  caution: { label: "Caution", className: "text-amber-600" },
  unsafe: { label: "Unsafe", className: "text-red-600" }
} as const;

export default async function ResultPage({
  params
}: {
  params: { id: string };
}) {
  const result = await getScanResult(params.id);

  if (!result) {
    notFound();
  }

  const statusStyle = STATUS_STYLES[result.status] ?? STATUS_STYLES.caution;

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-8">
      <Link className="text-sm font-medium text-slate-600" href="/">
        IsItSafe
      </Link>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <p className="text-sm text-slate-500">{result.url}</p>
          <h1 className={`mt-3 text-4xl font-bold tracking-normal ${statusStyle.className}`}>
            {statusStyle.label}
          </h1>
          <p className="mt-2 text-lg text-slate-600">
            Risk score: <span className="font-semibold">{result.score}/100</span>
          </p>
          <div className="mt-8 rounded-md border border-slate-200 bg-white p-5">
            <h2 className="font-semibold">Explanation</h2>
            <p className="mt-3 text-slate-700">{result.explanation}</p>
          </div>
        </div>

        <ScreenshotPreview id={result.id} initialScreenshot={result.screenshot} />
      </section>
    </main>
  );
}
