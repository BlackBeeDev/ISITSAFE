import { randomUUID } from "crypto";
import { sendResendEmail } from "@/services/resend";
import { runScan } from "@/services/scanner";
import { saveForwardedEmail } from "@/services/store";
import type { ForwardedEmailRecord } from "@/services/types";
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

async function sendForwardedEmailReply(
  record: ForwardedEmailRecord,
  scans: Array<{ id: string; url: string; status: string; score: number; explanation: string }>
) {
  if (!record.from_email || scans.length === 0) {
    return;
  }

  const appUrl = getAppUrl();
  const lines = scans.map((scan, index) => {
    const resultUrl = `${appUrl}/results/${scan.id}`;
    return [
      `${index + 1}. ${scan.status.toUpperCase()} - risk ${scan.score}/100`,
      `URL: ${scan.url}`,
      `Result: ${resultUrl}`,
      `Reason: ${scan.explanation}`
    ].join("\n");
  });
  const htmlItems = scans
    .map((scan) => {
      const resultUrl = `${appUrl}/results/${scan.id}`;
      return `<li><strong>${escapeHtml(scan.status.toUpperCase())}</strong> - risk ${scan.score}/100<br><a href="${resultUrl}">${escapeHtml(scan.url)}</a><br>${escapeHtml(scan.explanation)}</li>`;
    })
    .join("");

  try {
    await sendResendEmail({
      to: record.from_email,
      subject: `IsItSafe scan result${scans.length > 1 ? "s" : ""}`,
      textBody: [
        "We scanned the link(s) from the email you forwarded.",
        "",
        ...lines,
        "",
        "If you did not request this scan, you can ignore this message."
      ].join("\n"),
      htmlBody: `<p>We scanned the link(s) from the email you forwarded.</p><ol>${htmlItems}</ol><p>If you did not request this scan, you can ignore this message.</p>`
    });
  } catch (error) {
    console.error("Resend reply failed", error);
  }
}

function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.VERCEL_URL?.replace(/^/, "https://") ??
    "http://localhost:3000"
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
