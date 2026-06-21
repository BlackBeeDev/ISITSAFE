import { randomUUID } from "crypto";
import { sendResendEmail } from "@/services/resend";
import { runScan } from "@/services/scanner";
import { saveForwardedEmail } from "@/services/store";
import type { ForwardedEmailRecord, ScanRecord } from "@/services/types";
import { extractUrls } from "@/utils/link-agent";

const MAX_LINKS_PER_EMAIL = 3;
const BODY_PREVIEW_LENGTH = 500;

export type InboundEmailInput = {
  provider?: string;
  messageId?: string | null;
  from?: string | null;
  to?: string | null;
  subject?: string | null;
  text?: string | null;
  html?: string | null;
};

export async function processForwardedEmail(input: InboundEmailInput) {
  const provider = input.provider?.trim() || "unknown";
  const subject = cleanNullable(input.subject);
  const text = cleanNullable(input.text);
  const htmlText = htmlToText(cleanNullable(input.html) ?? "");
  const combined = [subject, text, htmlText].filter(Boolean).join("\n\n");
  const detectedUrls = extractUrls(combined).slice(0, MAX_LINKS_PER_EMAIL);
  const createdAt = new Date().toISOString();
  const baseRecord = {
    id: randomUUID(),
    provider,
    message_id: cleanNullable(input.messageId),
    from_email: cleanNullable(input.from),
    to_email: cleanNullable(input.to),
    subject,
    body_preview: combined.slice(0, BODY_PREVIEW_LENGTH),
    detected_urls: detectedUrls,
    created_at: createdAt
  };

  if (detectedUrls.length === 0) {
    return saveForwardedEmail({
      ...baseRecord,
      scan_ids: [],
      status: "no_link",
      error: null
    });
  }

  try {
    const scans = await Promise.all(detectedUrls.map((url) => runScan(url)));
    const record = await saveForwardedEmail({
      ...baseRecord,
      scan_ids: scans.map((scan) => scan.id),
      status: "scanned",
      error: null
    });

    await sendForwardedEmailReply(record, scans);

    return record;
  } catch (error) {
    return saveForwardedEmail({
      ...baseRecord,
      scan_ids: [],
      status: "failed",
      error: error instanceof Error ? error.message : "Email scan failed"
    });
  }
}

export function getForwardedEmailSummary(record: ForwardedEmailRecord) {
  return {
    id: record.id,
    status: record.status,
    detectedUrls: record.detected_urls,
    scanIds: record.scan_ids
  };
}

async function sendForwardedEmailReply(record: ForwardedEmailRecord, scans: ScanRecord[]) {
  if (!record.from_email || scans.length === 0) {
    return;
  }

  const report = buildSecurityEmailReport(record, scans[0], scans);

  try {
    await sendResendEmail({
      to: record.from_email,
      subject: report.subject,
      textBody: report.textBody,
      htmlBody: report.htmlBody
    });
  } catch (error) {
    console.error("Resend reply failed", error);
  }
}

function buildSecurityEmailReport(
  record: ForwardedEmailRecord,
  scan: ScanRecord,
  scans: ScanRecord[]
) {
  const appUrl = getAppUrl();
  const resultUrl = `${appUrl}/results/${scan.id}`;
  const sender = parseEmailIdentity(record.from_email);
  const risk = getRiskProfile(scan.score);
  const reasons = getEvidenceDetails(scan);
  const topReasons = (reasons.length > 0 ? reasons : [scan.explanation]).slice(0, 4);
  const forwardedUrl = getForwardedUrlForScan(record, scan);
  const destinationHost = getHost(forwardedUrl) ?? getHost(scan.url);
  const detectedAt = new Date(scan.created_at).toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric"
  });
  const decision = scan.status === "unsafe" ? "Do not proceed" : "Use caution";
  const threatType = getThreatType(topReasons, scan);
  const confidence = getConfidence(scan.score, topReasons.length);
  const actions = getRecommendedActions(scan);
  const subject = `IsItSafe scan report: ${risk.label}`;

  const textBody = [
    "IsItSafe Scan Report",
    "",
    `Verdict: ${decision}`,
    `Risk: ${risk.label} (${scan.score}/100)`,
    `Confidence: ${confidence}`,
    `Threat type: ${threatType}`,
    "",
    `From: ${sender.email ?? "Unknown sender"}`,
    `Forwarded link: ${forwardedUrl}`,
    `Domain: ${destinationHost ?? "Unknown"}`,
    `Detected: ${detectedAt}`,
    `Full result: ${resultUrl}`,
    "",
    "Why it was flagged:",
    ...topReasons.map((reason) => `- ${reason}`),
    "",
    "Recommended action:",
    ...actions.map((action) => `- ${action}`),
    scans.length > 1 ? `Additional links scanned: ${scans.length - 1}` : "",
    "",
    "This report is generated from link reputation, page capture, and visible page signals."
  ]
    .filter((line, index, lines) => line || lines[index - 1] !== "")
    .join("\n");

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.5; max-width: 640px;">
      <h1 style="margin: 0 0 12px;">IsItSafe Scan Report</h1>
      <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; background: #f8fafc;">
        <p style="margin: 0 0 6px; font-size: 18px; font-weight: 700;">${escapeHtml(decision)}</p>
        <p style="margin: 0;">${escapeHtml(risk.label)} · ${scan.score}/100 · ${escapeHtml(confidence)} confidence</p>
      </div>

      <h2 style="margin-top: 24px;">Summary</h2>
      <table style="border-collapse: collapse; width: 100%;">
        ${tableRow("From", sender.email ?? "Unknown sender")}
        ${tableRow("Forwarded link", `<a href="${escapeHtml(forwardedUrl)}">${escapeHtml(forwardedUrl)}</a>`, true)}
        ${tableRow("Domain", destinationHost ?? "Unknown")}
        ${tableRow("Threat type", threatType)}
        ${tableRow("Detected", detectedAt)}
      </table>

      <h2 style="margin-top: 24px;">Why it was flagged</h2>
      <ul>${topReasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}</ul>

      <h2 style="margin-top: 24px;">Recommended action</h2>
      <ul>${actions.map((action) => `<li>${escapeHtml(action)}</li>`).join("")}</ul>

      <p style="margin-top: 24px;">
        <a href="${escapeHtml(resultUrl)}" style="display: inline-block; background: #047857; color: #ffffff; padding: 10px 14px; border-radius: 8px; text-decoration: none; font-weight: 700;">
          View full result
        </a>
      </p>

      <p style="color: #64748b; font-size: 13px; margin-top: 24px;">
        This report is generated from link reputation, page capture, and visible page signals.
      </p>
    </div>
  `;

  return { subject, textBody, htmlBody };
}

function getForwardedUrlForScan(record: ForwardedEmailRecord, scan: ScanRecord) {
  return record.detected_urls.find((url) => sameUrl(url, scan.url)) ?? record.detected_urls[0] ?? scan.url;
}

function sameUrl(left: string, right: string) {
  try {
    return new URL(left).href === new URL(right).href;
  } catch {
    return left === right;
  }
}

function getRiskProfile(score: number) {
  if (score >= 75) {
    return { label: "High risk" };
  }

  if (score >= 50) {
    return { label: "Medium risk" };
  }

  return { label: "Low risk" };
}

function getConfidence(score: number, reasonCount: number) {
  if (score >= 75 || reasonCount >= 4) {
    return "High";
  }

  if (score >= 40 || reasonCount >= 2) {
    return "Medium";
  }

  return "Low";
}

function getThreatType(reasons: string[], scan: ScanRecord) {
  const combined = [...reasons, scan.explanation, scan.url].join(" ").toLowerCase();

  if (combined.includes("credential") || combined.includes("login") || combined.includes("password")) {
    return "Possible phishing or credential theft";
  }

  if (combined.includes("malware")) {
    return "Possible malware delivery";
  }

  if (combined.includes("gift") || combined.includes("free") || combined.includes("claim")) {
    return "Possible scam or lure";
  }

  return "Suspicious link";
}

function getRecommendedActions(scan: ScanRecord) {
  if (scan.status === "unsafe") {
    return ["Do not continue", "Do not enter credentials or payment details", "Report the email"];
  }

  return [
    "Do not enter credentials or payment details unless you independently trust the sender",
    "Verify the request through another channel",
    "Report the email if it was unexpected"
  ];
}

function getEvidenceDetails(scan: ScanRecord) {
  return scan.evidence
    .flatMap((item) => (item.details.length > 0 ? item.details : [item.summary]))
    .filter((detail) => !/not configured|missing /i.test(detail))
    .slice(0, 8);
}

function parseEmailIdentity(value: string | null) {
  if (!value) {
    return { displayName: null, email: null };
  }

  const match = value.match(/^(.*?)\s*<([^>]+)>$/);

  if (match) {
    return {
      displayName: cleanNullable(match[1].replace(/^"|"$/g, "")),
      email: match[2]
    };
  }

  return {
    displayName: null,
    email: value
  };
}

function getHost(value: string) {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function tableRow(label: string, value: string, valueMayContainHtml = false) {
  return `
    <tr>
      <td style="border-top: 1px solid #e2e8f0; padding: 8px 10px 8px 0; color: #64748b; width: 130px;">${escapeHtml(label)}</td>
      <td style="border-top: 1px solid #e2e8f0; padding: 8px 0; word-break: break-word;">${valueMayContainHtml ? value : escapeHtml(value)}</td>
    </tr>
  `;
}

function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.VERCEL_URL?.replace(/^/, "https://") ??
    "https://isitsafe.vercel.app"
  ).replace(/\/$/, "");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cleanNullable(value: string | null | undefined) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}

function htmlToText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}
