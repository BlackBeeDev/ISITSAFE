"use client";

import { ArrowRight, CheckCircle2, Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlanAction, PlanId } from "@/lib/plans";

type PlanActionButtonProps = {
  action: PlanAction;
  planId: PlanId;
  label: string;
  highlighted?: boolean;
};

export function PlanActionButton({
  action,
  planId,
  label,
  highlighted
}: PlanActionButtonProps) {
  const handleClick = () => {
    if (action === "current") {
      window.alert("You are currently on the Free Personal plan.");
      return;
    }

    if (action === "join") {
      window.localStorage.setItem("isitsafe-intended-plan", planId);
      window.alert("Student plan selected. Payments are not connected yet, so this is saved as an upgrade interest.");
      return;
    }

    if (action === "coming_soon") {
      window.localStorage.setItem("isitsafe-intended-plan", planId);
      window.alert("Family plan is coming soon. We saved this as interest for future access.");
      return;
    }

    window.location.href =
      "mailto:hello@isitsafe.app?subject=IsItSafe Business plan&body=Hi IsItSafe team,%0A%0AI want to learn more about the Business plan.";
  };

  const Icon =
    action === "current" ? CheckCircle2 : action === "contact" ? Mail : action === "coming_soon" ? Sparkles : ArrowRight;

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={action === "current"}
      variant={highlighted ? "primary" : "secondary"}
      className="mt-6 w-full rounded-lg"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  );
}
