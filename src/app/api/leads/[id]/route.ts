import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { logEvent } from "@/lib/automation/events";

const updateSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "NURTURE"]),
  notes: z.string().trim().max(2000),
});

/** Local portfolio CRM. Add staff authentication before public deployment. */
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the status and notes (maximum 2,000 characters)." }, { status: 400 });
  const { id } = await context.params;
  const lead = await db.lead.findUnique({ where: { id }, include: { appointments: true } });
  if (!lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  const hasVisit = lead.appointments.some(a => ["PENDING", "CONFIRMED"].includes(a.status));
  await db.lead.update({ where: { id }, data: { ...parsed.data, status: hasVisit ? "SCHEDULED" : parsed.data.status } });
  await logEvent("lead_updated", "Agent updated lead details", { leadId: id, detail: hasVisit ? "Notes saved; upcoming viewing retained." : `Status: ${parsed.data.status}` });
  return NextResponse.json({ ok: true });
}
