import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { ScanForm } from "@/components/scan-form";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-8">
      <nav className="flex items-center justify-between">
        <Link className="flex items-center gap-2 font-semibold" href="/">
          <ShieldCheck className="h-6 w-6 text-emerald-600" />
          IsItSafe
        </Link>
        <Link className="text-sm font-medium text-slate-600" href="/scan">
          Scan
        </Link>
      </nav>

      <section className="grid flex-1 content-center gap-8 py-14">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold tracking-normal sm:text-6xl">
            Check a suspicious link before you click.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-600">
            Paste a URL and get a basic safe or unsafe result, risk score,
            screenshot preview, and AI-style explanation.
          </p>
        </div>
        <ScanForm />
      </section>
    </main>
  );
}
