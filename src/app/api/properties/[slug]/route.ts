import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const property = await db.property.findUnique({
    where: { slug },
    include: { agent: true },
  });
  if (!property) {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }
  return NextResponse.json({ property });
}
