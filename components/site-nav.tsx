import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { AuthButton } from "@/components/auth-button";

/**
 * Sticky top navigation shared across pages. The login control lives in the
 * isolated <AuthButton /> client component.
 */
export function SiteNav({ active }: { active?: "how" | "what" | "about" | "plans" }) {
  const linkClass = (key: "how" | "what" | "about" | "plans") =>
    active === key
      ? "hidden text-sm font-semibold text-brand-700 sm:block"
      : "hidden text-sm font-medium text-slate-600 hover:text-brand-700 sm:block";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <Link href="/" aria-label="IsItSafe home">
          <Wordmark />
        </Link>
        <div className="flex items-center gap-5">
          <Link href="/#how" className={linkClass("how")}>
            How it works
          </Link>
          <Link href="/#what" className={linkClass("what")}>
            What you get
          </Link>
          <Link href="/about" className={linkClass("about")}>
            About us
          </Link>
          <Link href="/plans" className={linkClass("plans")}>
            Plans
          </Link>
          <AuthButton />
        </div>
      </nav>
    </header>
  );
}
