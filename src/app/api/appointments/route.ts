import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appointmentSchema } from "@/lib/validation/schemas";
import { isValidSlot } from "@/lib/availability";
import { logEvent } from "@/lib/automation/events";
import { createCalendarEvent, sendEmail } from "@/lib/integrations/webhooks";
import { formatDateEN, generateCode } from "@/lib/utils";

/** Creates a visit appointment (and a lead when one doesn't exist yet). */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = appointmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request data." },
      { status: 400 }
    );
  }

  const { propertySlug, date, time, name, email, phone, note, leadId } = parsed.data;

  const property = await db.property.findUnique({
    where: { slug: propertySlug },
    include: { agent: true },
  });
  if (!property || property.status !== "available") {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }

  if (!isValidSlot(date, time)) {
    return NextResponse.json(
      { error: "That time is no longer available. Please choose another." },
      { status: 409 }
    );
  }

  // Attach to an existing qualified lead or create a fresh one
  let lead = leadId ? await db.lead.findUnique({ where: { id: leadId } }) : null;
  if (lead && lead.email?.toLowerCase() !== email.toLowerCase()) {
    return NextResponse.json({ error: "The contact email does not match this lead." }, { status: 403 });
  }
  const existingLead = lead;
  let appointment;
  try {
    appointment = await db.$transaction(async (tx) => {
      const occupied = await tx.appointment.findFirst({ where: { date, time, agentId: property.agentId, status: { not: "CANCELLED" } } });
      if (occupied) throw new Error("SLOT_TAKEN");
  if (!lead) {
    lead = await tx.lead.create({
      data: {
        name,
        email,
        phone,
        source: "SCHEDULE_PAGE",
        propertyId: property.id,
        classification: "WARM",
        status: "SCHEDULED",
        score: 65,
        aiSummary: `Requested a viewing for "${property.title}" on ${formatDateEN(date)} at ${time}.`,
      },
    });

  } else {
    lead = await tx.lead.update({
      where: { id: lead.id },
      data: {
        name: lead.name || name,
        email: lead.email ?? email,
        phone: lead.phone ?? phone,
        status: "SCHEDULED",
        propertyId: lead.propertyId ?? property.id,
      },
    });
  }

  return tx.appointment.create({
    data: {
      code: generateCode(),
      slotKey: `${property.agentId}:${date}:${time}`,
      leadId: lead.id,
      propertyId: property.id,
      agentId: property.agentId,
      date,
      time,
      notes: note || null,
      status: "CONFIRMED",
    },
  });

    });
  } catch (error) {
    if ((error instanceof Error && error.message === "SLOT_TAKEN") || (error instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P1008", "P2034", "P2028"].includes(error.code))) {
      return NextResponse.json({ error: "That time is no longer available. Please choose another." }, { status: 409 });
    }
    throw error;
  }
  if (!existingLead) await logEvent("lead_created", "Lead created from viewing request", { leadId: appointment.leadId });

  // ── Simulated integrations ─────────────────────────────────────────────
  const calendarResult = await createCalendarEvent({
    summary: `Viewing: ${property.title} — ${name}`,
    date,
    time,
    attendeeEmail: email,
    propertyTitle: property.title,
  });
  const emailResult = await sendEmail(
    email,
    `Viewing confirmed: ${property.title}`,
    `Hi ${name}, your viewing is confirmed for ${formatDateEN(date)} at ${time} with ${property.agent.name}. Confirmation code: ${appointment.code}.`
  );

  await logEvent("visit_scheduled", "Viewing scheduled", {
    detail: `${property.neighborhood} · ${formatDateEN(date)} · ${time}`,
    leadId: appointment.leadId,
  });
  await logEvent(calendarResult.ok ? "calendar_event_created" : "calendar_failed", calendarResult.ok ? "Calendar event recorded" : "Calendar sync failed ? booking saved locally", {
    detail: calendarResult.simulated ? "Simulated (no calendar integration configured)" : "Google Calendar",
    leadId: appointment.leadId,
  });
  await logEvent(emailResult.ok ? "confirmation_email_sent" : "confirmation_email_failed", emailResult.ok ? "Confirmation email recorded" : "Confirmation email failed ? manual follow-up required", {
    detail: email,
    leadId: appointment.leadId,
  });

  return NextResponse.json({
    ok: true,
    appointment: {
      code: appointment.code,
      date,
      time,
      property: {
        title: property.title,
        slug: property.slug,
        neighborhood: property.neighborhood,
        address: property.address,
      },
      agent: {
        name: property.agent.name,
        phone: property.agent.phone,
        whatsapp: property.agent.whatsapp,
      },
    },
  });
}
