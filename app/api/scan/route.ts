import { NextResponse } from "next/server";
import { runScan } from "@/services/scanner";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string };

    if (!body.url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const scan = await runScan(body.url);
    return NextResponse.json({ id: scan.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scan failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
