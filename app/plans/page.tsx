import type { Metadata } from "next";
import { Check, LockKeyhole, Shield, Sparkles } from "lucide-react";
import { PlanActionButton } from "@/components/plan-action-button";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { ALL_PLAN_FEATURES, PLAN_AUDIENCES, PLANS } from "@/lib/plans";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Plans - IsItSafe",
  description:
    "Choose the IsItSafe plan that fits how you scan suspicious links, emails, QR codes, and screenshots."
};

export default function PlansPage() {
  return (
    <>
      <SiteNav active="plans" />

      <main className="bg-white">
        <section className="border-b border-slate-100 bg-gradient-to-b from-brand-50/80 to-white">
          <div className="mx-auto max-w-6xl px-6 py-14 lg:py-16">
            <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold text-brand-700">
                  <Shield className="h-3.5 w-3.5" />
                  Plans without payments yet
                </span>
                <h1 className="mt-5 max-w-2xl text-4xl font-extrabold leading-tight tracking-tight text-brand-900 sm:text-5xl">
                  Protection that grows with the people you keep safe.
                </h1>
                <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
                  Start with personal link checks, then unlock student, family, and team workflows as IsItSafe grows.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {PLAN_AUDIENCES.map(({ icon: Icon, label }) => (
                  <div key={label} className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-700">
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <span className="text-sm font-semibold text-slate-700">{label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-100 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-8">
            <div className="flex flex-col gap-4 rounded-lg border border-brand-100 bg-brand-50/70 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-brand-700">
                  <LockKeyhole className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-semibold text-brand-900">Included in every plan</h2>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    The core safety experience stays available to everyone.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {ALL_PLAN_FEATURES.map((feature) => (
                  <span
                    key={feature}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-brand-800"
                  >
                    <Check className="h-3.5 w-3.5 text-safe-700" />
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-50">
          <div className="mx-auto max-w-6xl px-6 py-12 lg:py-16">
            <div className="grid gap-5 lg:grid-cols-4">
              {PLANS.map((plan) => {
                const Icon = plan.icon;

                return (
                  <article
                    key={plan.id}
                    className={cn(
                      "relative flex min-h-full flex-col rounded-lg border bg-white p-6 shadow-sm",
                      plan.highlighted
                        ? "border-brand-500 shadow-xl shadow-brand-100 ring-2 ring-brand-100"
                        : "border-slate-200"
                    )}
                  >
                    {plan.badge ? (
                      <div className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-brand-700 px-3 py-1 text-xs font-bold text-white">
                        <Sparkles className="h-3.5 w-3.5" />
                        {plan.badge}
                      </div>
                    ) : null}

                    <div
                      className={cn(
                        "grid h-12 w-12 place-items-center rounded-lg",
                        plan.highlighted ? "bg-brand-700 text-white" : "bg-brand-50 text-brand-700"
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </div>

                    <div className="mt-5">
                      <p className="text-sm font-semibold text-brand-700">{plan.label}</p>
                      <h2 className="mt-1 text-2xl font-bold tracking-tight text-brand-900">{plan.name}</h2>
                      <p className="mt-3 min-h-[72px] text-sm leading-relaxed text-slate-600">{plan.summary}</p>
                    </div>

                    <PlanActionButton
                      action={plan.action}
                      planId={plan.id}
                      label={plan.buttonLabel}
                      highlighted={plan.highlighted}
                    />

                    <div className="mt-6 border-t border-slate-100 pt-5">
                      {plan.includedText ? (
                        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                          {plan.includedText}
                        </p>
                      ) : null}

                      <ul className="space-y-3">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex gap-2.5 text-sm leading-relaxed text-slate-700">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-safe-700" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-8 rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold text-brand-900">Feature locking is ready for later.</h2>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    Each plan now has feature flags, so the app can show locked states before payments are added.
                  </p>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  No payment integration
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
