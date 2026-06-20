import { NextResponse } from "next/server";
import {
  getForwardedEmailSummary,
  processForwardedEmail,
  type InboundEmailInput
} from "@/services/email-forwarding";
import { getResendReceivedEmail } from "@/services/resend";

const SECRET_HEADER = "x-isitsafe-webhook-secret";

export async function POST(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const input = await parseInboundEmail(request);
    const record = await processForwardedEmail(input);

    return NextResponse.json(getForwardedEmailSummary(record), { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Inbound email failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

function isAuthorized(request: Request) {
  const expected = process.env.INBOUND_EMAIL_WEBHOOK_SECRET;

  if (!expected) {
    return true;
  }

  const headerSecret = request.headers.get(SECRET_HEADER);
  const urlSecret = new URL(request.url).searchParams.get("secret");
  const authorization = request.headers.get("authorization");
  const bearerSecret = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

  return headerSecret === expected || bearerSecret === expected || urlSecret === expected;
}

async function parseInboundEmail(request: Request): Promise<InboundEmailInput> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as Record<string, unknown>;
    const resendInput = await mapResendEvent(body);

    if (resendInput) {
      return resendInput;
    }

    return mapFields(body, "json");
  }

  if (
    contentType.includes("multipart/form-data") ||
    contentType.includes("application/x-www-form-urlencoded")
  ) {
    const form = await request.formData();
    const body = Object.fromEntries(
      Array.from(form.entries()).map(([key, value]) => [
        key,
        typeof value === "string" ? value : value.name
      ])
    );
    return mapFields(body, "form");
  }

  const text = await request.text();
  return {
    provider: "raw",
    text
  };
}

async function mapResendEvent(body: Record<string, unknown>): Promise<InboundEmailInput | null> {
  if (body.type !== "email.received" || !isRecord(body.data)) {
    return null;
  }

  const emailId = stringField(body.data.email_id);

  if (!emailId) {
    return {
      provider: "resend",
      messageId: stringField(body.data.message_id),
      from: stringField(body.data.from),
      to: stringArrayField(body.data.to).join(", "),
      subject: stringField(body.data.subject),
      text: JSON.stringify(body)
    };
  }

  const email = await getResendReceivedEmail(emailId);

  return {
    provider: "resend",
    messageId: email.message_id ?? email.id,
    from: email.from,
    to: email.to.join(", "),
    subject: email.subject,
    text: email.text,
    html: email.html
  };
}

function mapFields(body: Record<string, unknown>, fallbackProvider: string): InboundEmailInput {
  const to = stringField(body.to) ?? stringArrayField(body.to).join(", ");

  return {
    provider: stringField(body.provider) ?? fallbackProvider,
    messageId: stringField(body.email_id) ?? stringField(body.message_id),
    from: stringField(body.from),
    to,
    subject: stringField(body.subject),
    text: stringField(body.text),
    html: stringField(body.html)
  };
}

function stringField(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringArrayField(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}
