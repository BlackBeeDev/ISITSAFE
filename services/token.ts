import type { ScanRecord } from "@/services/types";

// Self-describing result id: encodes everything needed to render a result
// directly in the id itself, so /api/result and /results/[id] work without
// a database. Screenshot is deliberately left out - it can be a large data
// URI and would blow past practical URL length limits.
type TokenPayload = Omit<ScanRecord, "id" | "screenshot">;

export function encodeScanToken(payload: TokenPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url");
}

export function decodeScanToken(token: string): ScanRecord | null {
  try {
    const parsed = JSON.parse(Buffer.from(token, "base64url").toString("utf-8"));
    if (
      typeof parsed.url === "string" &&
      typeof parsed.score === "number" &&
      typeof parsed.status === "string" &&
      typeof parsed.explanation === "string" &&
      typeof parsed.created_at === "string"
    ) {
      return { ...parsed, id: token, screenshot: null };
    }
    return null;
  } catch {
    return null;
  }
}
