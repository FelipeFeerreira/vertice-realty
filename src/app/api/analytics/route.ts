import { NextRequest, NextResponse } from "next/server";
import { analyticsSchema } from "@/lib/validation/schemas";
import { logEvent } from "@/lib/automation/events";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }
  const parsed = analyticsSchema.safeParse(body);
  if (parsed.success) {
    const { event, payload } = parsed.data;
    await logEvent("analytics", event, {
      detail: payload ? JSON.stringify(payload).slice(0, 300) : undefined,
    });
  }
  return new NextResponse(null, { status: 204 });
}
