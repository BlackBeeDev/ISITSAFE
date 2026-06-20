import { runScan } from "@/services/scanner";
import type { ScanErrorResponse, ScanRequest, ScanStartResponse } from "@/services/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<ScanRequest>;

    if (!body.url) {
      return apiJson<ScanErrorResponse>({ error: "URL is required" }, { status: 400 });
    }

    const scan = await runScan(body.url);
    return apiJson<ScanStartResponse>({ id: scan.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scan failed";
    return apiJson<ScanErrorResponse>({ error: message }, { status: 400 });
  }
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: apiHeaders
  });
}

const apiHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function apiJson<T>(body: T, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: init?.status,
    headers: {
      "Content-Type": "application/json",
      ...apiHeaders,
      ...init?.headers
    }
  });
}
