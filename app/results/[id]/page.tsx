import Link from "next/link";
import { notFound } from "next/navigation";
import { getScanResult } from "@/services/results";

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

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-8">
      <Link className="text-sm font-medium text-slate-600" href="/">
        IsItSafe
      </Link>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <p className="text-sm text-slate-500">{result.url}</p>
          <h1 className="mt-3 text-4xl font-bold tracking-normal">
            {isUnsafe ? "Unsafe" : "Safe"}
          </h1>
          <p className="mt-2 text-lg text-slate-600">
            Risk score: <span className="font-semibold">{result.score}/100</span>
          </p>
          <div className="mt-8 rounded-md border border-slate-200 bg-white p-5">
            <h2 className="font-semibold">Explanation</h2>
            <p className="mt-3 text-slate-700">{result.explanation}</p>
          </div>
        </div>

        <aside className="rounded-md border border-slate-200 bg-white p-4">
          <h2 className="font-semibold">Screenshot</h2>
          {result.screenshot ? (
            <img
              alt="Screenshot preview"
              className="mt-4 aspect-video w-full rounded border object-cover"
              src={result.screenshot}
            />
          ) : (
            <div className="mt-4 grid aspect-video place-items-center rounded border bg-slate-100 text-sm text-slate-500">
              No screenshot captured
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
