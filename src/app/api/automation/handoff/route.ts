import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handoffSchema } from "@/lib/validation/schemas";
import { logEvent } from "@/lib/automation/events";
import { sendWhatsAppAgentAlert, type QualifiedLeadPayload } from "@/lib/integrations/webhooks";
import type { Classification, FinancingStatus, Intent, PropertyType, Timeline } from "@/lib/types";

/** Visitor explicitly asks for a human agent → immediate WhatsApp alert. */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = handoffSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request data." }, { status: 400 });
  }

  const lead = await db.lead.findUnique({
    where: { id: parsed.data.leadId },
    include: { property: true },
  });
  if (!lead) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  let matched: { slug: string; title: string; price: number }[] = [];
  if (lead.matchedIds) {
    try {
      const ids = JSON.parse(lead.matchedIds) as string[];
      const props = await db.property.findMany({ where: { id: { in: ids } } });
      matched = props.map((p) => ({ slug: p.slug, title: p.title, price: p.price }));
    } catch {
      matched = [];
    }
  }

  const payload: QualifiedLeadPayload = {
    leadId: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    intent: lead.intent as Intent | null,
    propertyType: lead.propertyType as PropertyType | "any" | null,
    preferredLocation: lead.preferredLocation,
    budgetMin: lead.budgetMin,
    budgetMax: lead.budgetMax,
    bedrooms: lead.bedrooms,
    timeline: lead.timeline as Timeline | null,
    financingStatus: lead.financingStatus as FinancingStatus | null,
    score: lead.score,
    classification: lead.classification as Classification,
    propertyOfInterest: lead.property?.title ?? null,
    matchedProperties: matched,
    source: lead.source,
    createdAt: lead.createdAt.toISOString(),
  };

  const result = await sendWhatsAppAgentAlert(payload);

  if (!result.ok) {
    await logEvent("whatsapp_failed", "Agent notification failed", { leadId: lead.id, detail: "Please retry the handoff." });
    return NextResponse.json({ error: "We could not notify the agent. Please try again." }, { status: 502 });
  }
  await logEvent("agent_handoff_requested", "Client requested immediate agent contact", {
    detail: result.simulated
      ? `Simulated → ${process.env.AGENT_WHATSAPP_NUMBER ?? "+55 11 99876-5432"}`
      : "Delivered via webhook",
    leadId: lead.id,
  });

  return NextResponse.json({ ok: true, simulated: result.simulated });
}
