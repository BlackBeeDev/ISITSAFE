import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

const AUDIENCE = ["Students", "Families & parents", "Older adults", "Small nonprofits"];

export default function AboutPage() {
  return (
    <>
      <SiteNav active="about" />

      {/* HERO / MISSION */}
      <section className="border-b border-slate-100 bg-gradient-to-b from-brand-50/60 to-white">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-600">Our mission</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-[1.1] tracking-tight text-brand-900 sm:text-5xl">
            Everyone deserves to know if something is safe — before they click.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
            IsItSafe turns a suspicious link, email, or QR code into a clear, honest answer — so a scam can&apos;t
            win just because it looked convincing.
          </p>
        </div>
      </section>

      {/* WHO WE ARE */}
      <section className="bg-white">
        <div className="mx-auto max-w-4xl px-6 py-16 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-600">Who we are</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-brand-900">
            We&apos;re four students, not a security company
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-slate-600">
            We built IsItSafe at the NJx Hackathon because most tools that protect people online are made for big
            companies and IT departments — not for the average person trying to work out whether a link is real. We
            wanted something free, simple, and honest that we&apos;d be comfortable handing to our own families and
            friends. So we made it.
          </p>
        </div>
      </section>

      {/* WHY WE EXIST */}
      <section className="border-y border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-4xl px-6 py-16 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-600">Why we exist</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-brand-900">
            AI can fake almost anything now
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-slate-600">
            Online scams have become frighteningly convincing. A fake login page can look identical to the real
            one, an email can copy a brand down to the logo, and a single message can manufacture just enough panic
            to make you act before you think. Meanwhile, the warnings meant to protect you fall short: a
            browser&apos;s red &ldquo;deceptive site&rdquo; screen is easy to click straight through, the little
            padlock in the address bar only means the connection is encrypted — not that the site is honest, since
            scam sites use it too — and a vague &ldquo;this site may be unsafe&rdquo; popup never tells you why. So
            most people are left to guess.
          </p>
        </div>
      </section>

      {/* WHAT WE DO */}
      <section className="bg-white">
        <div className="mx-auto max-w-4xl px-6 py-16 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-600">What we do</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-brand-900">
            Paste it. We&apos;ll tell you straight.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-slate-600">
            You paste a link, an email, or a QR code. IsItSafe opens it in a safe, sealed-off space — never on
            your device — checks it against trusted threat databases, and has an AI read the page the way a
            careful person would. Seconds later you get a plain answer: safe, caution, or unsafe, with a risk
            score, a screenshot, and a sentence or two on what&apos;s going on and what to do next.
          </p>
        </div>
      </section>

      {/* YOUR PRIVACY */}
      <section className="border-y border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-4xl px-6 py-16 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-600">Your privacy</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-brand-900">
            The dangerous page opens on our side — never on yours
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-slate-600">
            When you check something, the suspicious page loads inside an isolated sandbox on our servers, so it
            never runs on your phone or computer. You don&apos;t need an account and you don&apos;t hand over
            personal details to get an answer — you just paste what you want checked, and we send back the verdict.
          </p>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="border-y border-slate-100 bg-brand-50">
        <div className="mx-auto max-w-4xl px-6 py-16 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-600">Who it&apos;s for</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-brand-900">Made for everyday people</h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
            Most security tools are built and priced for big companies. IsItSafe is free, needs no technical
            know-how, and is made for the people who get targeted just as much.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            {AUDIENCE.map((label) => (
              <span
                key={label}
                className="rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-800"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT WE BELIEVE */}
      <section className="bg-white">
        <div className="mx-auto max-w-4xl px-6 py-16 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-600">What we believe</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-brand-900">
            Security shouldn&apos;t require expertise.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-slate-600">
            Today&apos;s tools ask ordinary people to act as their own analysts, then treat them as the weak link
            when a clever fake slips through. We think that&apos;s backwards. The tool should do the hard part and
            hand you a clear decision. And we&apos;d rather stop someone from becoming a victim than help them
            clean up afterward.
          </p>
        </div>
      </section>

      {/* CLOSING / PITCH */}
      <section className="bg-brand-900">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <p className="text-2xl font-bold leading-snug text-white sm:text-3xl">
            IsItSafe protects people before they become victims by turning suspicious links into understandable
            decisions.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-semibold text-brand-900 transition hover:bg-brand-50"
          >
            Check a link
            <ArrowRight className="h-[18px] w-[18px]" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
