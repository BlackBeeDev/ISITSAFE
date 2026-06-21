import Link from "next/link";
import {
  Lock,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  ShieldCheck,
  LineChart,
  MessageCircle,
  ArrowRight
} from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { TrustStrip } from "@/components/trust-strip";
import { ScanInput } from "@/components/scan-input";

const STEPS = [
  {
    n: 1,
    eyebrow: "Paste",
    title: "Paste the link",
    body: "Drop in any link that feels off — from an email, a text, or a website."
  },
  {
    n: 2,
    eyebrow: "Inspect",
    title: "We open it safely",
    body: "IsItSafe loads the page in an isolated sandbox, takes a screenshot, and runs security checks — far away from your device."
  },
  {
    n: 3,
    eyebrow: "Decide",
    title: "Get a clear verdict",
    body: "You get a safe-or-unsafe call, a risk score, and a plain reason — so you know what to do in five seconds."
  }
];

const BENEFITS = [
  { icon: ShieldCheck, title: "A clear verdict", body: "Safe, caution, or unsafe. No guessing." },
  { icon: LineChart, title: "A risk score", body: "0 to 100, so you can see how serious it is." },
  { icon: ImageIcon, title: "A screenshot", body: "See the page without ever loading it yourself." },
  { icon: MessageCircle, title: "A plain reason", body: "Why it's risky, in everyday language." }
];

const AUDIENCE = ["Students", "Families & parents", "Older adults", "Small nonprofits"];

export default function HomePage() {
  return (
    <>
      <SiteNav />

      {/* HERO */}
      <section className="border-b border-slate-100 bg-gradient-to-b from-brand-50/60 to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          {/* left: message + the core action */}
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold text-brand-700">
              <Lock className="h-3.5 w-3.5" />
              Free · No account · Works in seconds
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-brand-900 sm:text-5xl">
              Check a suspicious link
              <br />
              before you click.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
              Paste a link and IsItSafe opens it for you in a safe, isolated space — then hands back a clear{" "}
              <span className="font-semibold text-safe-700">safe</span> or{" "}
              <span className="font-semibold text-red-600">unsafe</span> verdict, a risk score, a screenshot,
              and a plain-language reason. No jargon.
            </p>

            <ScanInput />
          </div>

          {/* right: an example verdict card */}
          <div className="reveal in">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Example result</p>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
              <div className="flex items-center gap-3 border-b border-red-100 bg-red-50 px-5 py-4">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-red-100 text-red-600">
                  <XCircle className="h-6 w-6" />
                </span>
                <div className="flex-1">
                  <p className="text-lg font-bold text-red-700">Unsafe — don&apos;t continue</p>
                  <p className="font-mono text-xs text-slate-500">accounts-google-verify.review</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-extrabold leading-none text-red-700">91</p>
                  <p className="text-[11px] font-medium text-slate-400">risk / 100</p>
                </div>
              </div>
              <div className="px-5 pt-5">
                <div className="flex aspect-[16/9] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400">
                  <div className="text-center">
                    <ImageIcon className="mx-auto h-6 w-6" />
                    <p className="mt-1 text-xs">Page preview (captured safely)</p>
                  </div>
                </div>
              </div>
              <div className="px-5 py-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Why we flagged it</p>
                <p className="mt-1.5 leading-relaxed text-slate-700">
                  This page pretends to be a Google sign-in and asks for your password. The web address isn&apos;t
                  one Google owns. Entering anything here would hand your login to an attacker.
                </p>
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                  Recommended: leave this site and don&apos;t enter anything.
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2.5">
              <div className="flex items-center justify-center gap-1.5 rounded-lg border border-safe-100 bg-safe-50 py-2 text-sm font-semibold text-safe-700">
                <CheckCircle2 className="h-4 w-4" /> Safe
              </div>
              <div className="flex items-center justify-center gap-1.5 rounded-lg border border-amber-100 bg-amber-50 py-2 text-sm font-semibold text-amber-700">
                <AlertTriangle className="h-4 w-4" /> Caution
              </div>
              <div className="flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-100 py-2 text-sm font-semibold text-red-700">
                <XCircle className="h-4 w-4" /> Unsafe
              </div>
            </div>
          </div>
        </div>
      </section>

      <TrustStrip />

      {/* HOW IT WORKS */}
      <section id="how" className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-brand-900">How it works</h2>
            <p className="mt-3 text-lg text-slate-600">Three steps. You never have to be the security expert.</p>
          </div>
          <ol className="mt-10 grid gap-5 md:grid-cols-3">
            {STEPS.map((step) => (
              <li key={step.n} className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 font-bold text-brand-700">
                    {step.n}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {step.eyebrow}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-brand-900">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-slate-600">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section id="what" className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-brand-900">What every scan gives you</h2>
            <p className="mt-3 text-lg text-slate-600">
              Not just a red light — the full picture, in words anyone can read.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold text-brand-900">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="border-y border-slate-100 bg-brand-900">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Made for everyday people
              </h2>
              <p className="mt-3 text-lg leading-relaxed text-brand-100">
                Most security tools are built and priced for big companies. IsItSafe is free, simple, and made
                for the people who get targeted just as much — students, families, older adults, and small
                nonprofits.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {AUDIENCE.map((label) => (
                <span key={label} className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white">
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center lg:py-20">
          <h2 className="text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
            Don&apos;t guess. Check first.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
            Paste a link above and get an answer before you click. Free, no account needed.
          </p>
          <Link
            href="/#scan"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-brand-700 px-7 py-3.5 text-base font-semibold text-white transition hover:bg-brand-800"
          >
            Scan a link
            <ArrowRight className="h-[18px] w-[18px]" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
