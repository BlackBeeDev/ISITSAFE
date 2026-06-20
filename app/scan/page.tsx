import Link from "next/link";
import { ScanForm } from "@/components/scan-form";

export default function ScanPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-8">
      <Link className="text-sm font-medium text-slate-600" href="/">
        IsItSafe
      </Link>
      <section className="mt-20">
        <h1 className="text-3xl font-bold tracking-normal">Scan a URL</h1>
        <p className="mt-3 text-slate-600">
          This MVP uses simple scoring and optional API hooks for the real scan
          providers.
        </p>
        <div className="mt-8">
          <ScanForm />
        </div>
      </section>
    </main>
  );
}
