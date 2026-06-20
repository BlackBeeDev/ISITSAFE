import { getScanResult } from "@/services/results";
import type { ScanErrorResponse, ScanResultResponse } from "@/services/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return apiJson<ScanErrorResponse>({ error: "id is required" }, { status: 400 });
  }

  const result = await getScanResult(id);

  if (!result) {
    return apiJson<ScanErrorResponse>({ error: "Result not found" }, { status: 404 });
  }

  return apiJson<ScanResultResponse>(result);
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: apiHeaders
  });
}

const apiHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
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
