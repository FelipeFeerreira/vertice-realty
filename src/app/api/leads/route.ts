import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leadCreateSchema } from "@/lib/validation/schemas";
import { logEvent } from "@/lib/automation/events";

/** Interest form on property pages → creates a NEW lead. */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = leadCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request data." },
      { status: 400 }
    );
  }

  const { name, email, phone, message, propertySlug } = parsed.data;

  const property = propertySlug
    ? await db.property.findUnique({ where: { slug: propertySlug } })
    : null;

  if (propertySlug && !property) return NextResponse.json({ error: "Property not found." }, { status: 404 });

  const lead = await db.lead.create({
    data: {
      name,
      email,
      phone: phone || null,
      notes: message || null,
      source: "PROPERTY_PAGE",
      propertyId: property?.id ?? null,
      classification: "NEW",
      status: "NEW",
      score: 15,
      aiSummary: property
        ? `Expressed interest in "${property.title}" via the property page.${message ? ` Message: "${message}"` : ""}`
        : `Contacted the agency via the website form.${message ? ` Message: "${message}"` : ""}`,
    },
  });

  await logEvent("property_interest", "Interest submitted from property page", {
    detail: property ? property.title : undefined,
    leadId: lead.id,
  });
  await logEvent("lead_created", "Lead created from property inquiry", {
    detail: "Source: PROPERTY_PAGE",
    leadId: lead.id,
  });

  return NextResponse.json({ ok: true, leadId: lead.id });
}
