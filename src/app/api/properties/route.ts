import { NextRequest, NextResponse } from "next/server";
import { propertySearchSchema, searchProperties } from "@/lib/properties/search";

export async function GET(req: NextRequest) {
  const parsed = propertySearchSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid property filters." }, { status: 400 });
  }
  const properties = await searchProperties(parsed.data);
  return NextResponse.json({ properties, count: properties.length });
}
