export type InputType = "link" | "email" | "qr";

/**
 * Best-effort guess of what the user pasted. Mirrors the auto-detect logic from
 * the landing mockup. Only "link" is wired to the real scanner today; email and
 * qr are recognised so the UI can show the right (placeholder) affordance.
 */
export function detectType(text: string): InputType | null {
  const t = text.trim();
  if (!t) return null;

  const hasSpaces = /\s/.test(t);

  if (!hasSpaces && /^(https?:\/\/|www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(t)) {
    return "link";
  }
  if (/(^|\n)\s*(from|subject|to|reply-to|sender)\s*:/i.test(t)) {
    return "email";
  }
  if (/^\S+@\S+\.\S+$/.test(t)) {
    return "email";
  }
  if (hasSpaces) {
    return "email";
  }
  return "link";
}

/**
 * Turns a user-typed link into something the URL parser / scanner accepts,
 * adding a protocol when the user omitted it (e.g. "example.com/login").
 */
export function normalizeLink(text: string): string {
  const t = text.trim();
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}
