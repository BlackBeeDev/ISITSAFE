import type { ScanRecord } from "@/services/types";

// Self-describing result id: encodes everything needed to render a result
// directly in the id itself, so /api/result and /results/[id] work without
// a database. Screenshot is deliberately left out - it can be a large data
// URI and would blow past practical URL length limits.
type TokenPayload = Omit<ScanRecord, "id" | "screenshot">;

export function encodeScanToken(payload: TokenPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url");
}

// A legitimate token only ever holds a URL, a short explanation, and a
// couple of scalars, so cap the decoded size well above that to reject
// crafted tokens designed to cause a large JSON.parse/allocation.
const MAX_TOKEN_BYTES = 16 * 1024;

export function decodeScanToken(token: string): ScanRecord | null {
  if (token.length > MAX_TOKEN_BYTES) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(token, "base64url").toString("utf-8"));
    if (
      typeof parsed.url === "string" &&
      typeof parsed.score === "number" &&
      typeof parsed.status === "string" &&
      typeof parsed.explanation === "string" &&
      typeof parsed.created_at === "string" &&
      parsed.url.length < 2048 &&
      parsed.explanation.length < 8192
    ) {
      return { ...parsed, id: token, screenshot: null };
    }
    return null;
  } catch {
    return null;
  }
}
