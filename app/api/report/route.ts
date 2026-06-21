import { NextResponse } from "next/server";
import { createLinkReport, REPORT_AUTHORITIES } from "@/services/reporting";

export async function GET() {
  return NextResponse.json({ authorities: REPORT_AUTHORITIES });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      scanId?: string;
      authorityIds?: string[];
    };

    if (!body.scanId) {
      return NextResponse.json({ error: "scanId is required" }, { status: 400 });
    }

    const report = await createLinkReport(body.scanId, body.authorityIds ?? []);
    return NextResponse.json({ report });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Report failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
