import {
  inspectPastedLink,
  type LinkAgentResult,
  type LinkSignal
} from "@/utils/link-agent";

export type MessageAgentResult = LinkAgentResult & {
  messageSignals: LinkSignal[];
  riskLabel: "low" | "medium" | "high";
};

const MESSAGE_PATTERNS: Array<{
  label: string;
  severity: LinkSignal["severity"];
  pattern: RegExp;
}> = [
  {
    label: "Urgent action language detected",
    severity: "warning",
    pattern: /\b(urgent|immediately|right now|final notice|expires today|limited time|act now)\b/i
  },
  {
    label: "Account or payment threat detected",
    severity: "warning",
    pattern:
      /\b(account locked|account.*suspended|suspended|payment failed|unusual activity|unauthorized charge|card declined)\b/i
  },
  {
    label: "Prize or refund lure detected",
    severity: "warning",
    pattern: /\b(prize|winner|refund|rebate|gift card|claim now|reward|airdrop)\b/i
  },
  {
    label: "Sensitive code or password request detected",
    severity: "danger",
    pattern: /\b(otp|verification code|password|pin|2fa|security code|one-time code|passcode)\b/i
  },
  {
    label: "Impersonation-style sender language detected",
    severity: "warning",
    pattern:
      /\b(bank|irs|usps|ups|fedex|dhl|paypal|venmo|cash app|microsoft|apple support|amazon|netflix)\b/i
  },
  {
    label: "Reply or callback pressure detected",
    severity: "warning",
    pattern: /\b(reply yes|reply stop|call us|call now|text back|confirm by replying)\b/i
  },
  {
    label: "Unexpected file or QR request detected",
    severity: "warning",
    pattern: /\b(scan this qr|qr code|open attachment|download file|view document)\b/i
  }
];

export function inspectMessage(input: string): MessageAgentResult {
  const linkResult = inspectPastedLink(input);
  const messageSignals = MESSAGE_PATTERNS.filter((item) =>
    item.pattern.test(input)
  ).map((item) => ({
    label: item.label,
    severity: item.severity
  }));
  const signals = [...linkResult.signals, ...messageSignals];
  const dangerCount = signals.filter((signal) => signal.severity === "danger").length;
  const warningCount = signals.filter((signal) => signal.severity === "warning").length;

  return {
    ...linkResult,
    signals,
    messageSignals,
    riskLabel:
      dangerCount > 0 || warningCount >= 3 ? "high" : warningCount > 0 ? "medium" : "low"
  };
}
