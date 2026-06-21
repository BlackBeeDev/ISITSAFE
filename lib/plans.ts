import type { LucideIcon } from "lucide-react";
import {
  BriefcaseBusiness,
  GraduationCap,
  Home,
  ShieldCheck,
  Users
} from "lucide-react";

export type PlanId = "free" | "student" | "family" | "business";

export type PlanFeature =
  | "link_scanning"
  | "ai_phishing_analysis"
  | "human_explanations"
  | "privacy_first"
  | "email_screenshot_scan"
  | "text_screenshot_scan"
  | "safe_unsafe_result"
  | "risk_score"
  | "limited_history"
  | "ten_scans_per_day"
  | "unlimited_scans"
  | "student_scam_detection"
  | "school_email_verification"
  | "qr_scan"
  | "extended_history"
  | "family_members"
  | "shared_alerts"
  | "parent_dashboard"
  | "family_trust_list"
  | "weekly_reports"
  | "employee_verification"
  | "company_trust_directory"
  | "sender_verification_badge"
  | "team_dashboard"
  | "analytics"
  | "shared_reports";

export type PlanAction = "current" | "join" | "coming_soon" | "contact";

export type Plan = {
  id: PlanId;
  name: string;
  label: string;
  summary: string;
  icon: LucideIcon;
  badge?: string;
  action: PlanAction;
  buttonLabel: string;
  highlighted?: boolean;
  includedText?: string;
  features: string[];
  featureFlags: PlanFeature[];
};

export const ALL_PLAN_FEATURES = [
  "Link scanning",
  "AI phishing analysis",
  "Human explanations",
  "Privacy-first design"
] as const;

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    label: "Personal",
    summary: "Simple protection for checking links and screenshots before you click.",
    icon: ShieldCheck,
    action: "current",
    buttonLabel: "Current Plan",
    features: [
      "Scan suspicious links",
      "Scan email screenshots",
      "Scan text screenshots",
      "Safe / Unsafe result",
      "Human explanation",
      "Risk score",
      "Limited scan history",
      "10 scans/day"
    ],
    featureFlags: [
      "link_scanning",
      "ai_phishing_analysis",
      "human_explanations",
      "privacy_first",
      "email_screenshot_scan",
      "text_screenshot_scan",
      "safe_unsafe_result",
      "risk_score",
      "limited_history",
      "ten_scans_per_day"
    ]
  },
  {
    id: "student",
    name: "Student",
    label: "Student",
    summary: "Extra protection for school accounts, QR codes, fake jobs, and campus scams.",
    icon: GraduationCap,
    badge: "Most Popular",
    action: "join",
    buttonLabel: "Join Student",
    highlighted: true,
    includedText: "Everything in Free +",
    features: [
      "Unlimited scans",
      "Student scam detection",
      "School email verification",
      "QR scan",
      "Extended history"
    ],
    featureFlags: [
      "link_scanning",
      "ai_phishing_analysis",
      "human_explanations",
      "privacy_first",
      "email_screenshot_scan",
      "text_screenshot_scan",
      "safe_unsafe_result",
      "risk_score",
      "unlimited_scans",
      "student_scam_detection",
      "school_email_verification",
      "qr_scan",
      "extended_history"
    ]
  },
  {
    id: "family",
    name: "Family",
    label: "Household",
    summary: "Shared scam protection for parents, kids, and relatives.",
    icon: Home,
    action: "coming_soon",
    buttonLabel: "Coming Soon",
    includedText: "Everything in Student +",
    features: [
      "Up to 6 family members",
      "Shared alerts",
      "Parent dashboard",
      "Family trust list",
      "Weekly reports"
    ],
    featureFlags: [
      "link_scanning",
      "ai_phishing_analysis",
      "human_explanations",
      "privacy_first",
      "unlimited_scans",
      "student_scam_detection",
      "school_email_verification",
      "qr_scan",
      "extended_history",
      "family_members",
      "shared_alerts",
      "parent_dashboard",
      "family_trust_list",
      "weekly_reports"
    ]
  },
  {
    id: "business",
    name: "Business",
    label: "Teams",
    summary: "Verification and reporting tools for teams that handle risky messages daily.",
    icon: BriefcaseBusiness,
    action: "contact",
    buttonLabel: "Contact Us",
    includedText: "Everything in Family +",
    features: [
      "Employee verification",
      "Company trust directory",
      "Sender verification badge",
      "Team dashboard",
      "Analytics",
      "Shared reports"
    ],
    featureFlags: [
      "link_scanning",
      "ai_phishing_analysis",
      "human_explanations",
      "privacy_first",
      "unlimited_scans",
      "family_members",
      "shared_alerts",
      "parent_dashboard",
      "family_trust_list",
      "weekly_reports",
      "employee_verification",
      "company_trust_directory",
      "sender_verification_badge",
      "team_dashboard",
      "analytics",
      "shared_reports"
    ]
  }
];

export const DEFAULT_PLAN_ID: PlanId = "free";

export function getPlan(planId: PlanId = DEFAULT_PLAN_ID) {
  return PLANS.find((plan) => plan.id === planId) ?? PLANS[0];
}

export function hasFeature(planId: PlanId, feature: PlanFeature) {
  return getPlan(planId).featureFlags.includes(feature);
}

export function getLockedFeatures(planId: PlanId, features: PlanFeature[]) {
  const plan = getPlan(planId);
  return features.filter((feature) => !plan.featureFlags.includes(feature));
}

export const PLAN_AUDIENCES = [
  { icon: ShieldCheck, label: "Personal safety" },
  { icon: GraduationCap, label: "Students" },
  { icon: Users, label: "Families" },
  { icon: BriefcaseBusiness, label: "Teams" }
] as const;
