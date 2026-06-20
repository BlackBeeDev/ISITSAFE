type ResendEmail = {
  to: string;
  subject: string;
  textBody: string;
  htmlBody?: string;
};

type ResendReceivedEmail = {
  id: string;
  from: string;
  to: string[];
  subject: string | null;
  text: string | null;
  html: string | null;
  message_id: string | null;
};

export async function sendResendEmail(email: ResendEmail) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    return { sent: false, reason: "Resend outbound is not configured" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [email.to],
      subject: email.subject,
      text: email.textBody,
      html: email.htmlBody
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend send failed: HTTP ${response.status} ${body}`);
  }

  return { sent: true };
}

export async function getResendReceivedEmail(emailId: string) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is required to fetch received email content");
  }

  const response = await fetch(
    `https://api.resend.com/emails/receiving/${encodeURIComponent(emailId)}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend received email lookup failed: HTTP ${response.status} ${body}`);
  }

  return (await response.json()) as ResendReceivedEmail;
}
