import Link from "next/link";
import { Wordmark } from "@/components/wordmark";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        <Link href="/" aria-label="IsItSafe home">
          <Wordmark iconSize={28} textClassName="text-base" />
        </Link>
        <p className="text-sm text-slate-500">
          Open links without opening yourself to attacks.
        </p>
      </div>
    </footer>
  );
}
