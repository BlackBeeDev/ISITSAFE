import { NextResponse } from "next/server";
import { inspectMessage } from "@/utils/message-agent";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { input?: string };

    if (!body.input) {
      return NextResponse.json({ error: "input is required" }, { status: 400 });
    }

    return NextResponse.json(inspectMessage(body.input));
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
