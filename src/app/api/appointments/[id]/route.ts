import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { logEvent } from "@/lib/automation/events";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const parsed = z.object({ status: z.enum(["CANCELLED", "DONE"]) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid viewing status." }, { status: 400 });
  const { id } = await context.params;
  const appointment = await db.appointment.findUnique({ where: { id } });
  if (!appointment) return NextResponse.json({ error: "Viewing not found." }, { status: 404 });
  if (["CANCELLED", "DONE"].includes(appointment.status)) return NextResponse.json({ error: "This viewing is already closed." }, { status: 409 });
  await db.$transaction(async tx => {
    await tx.appointment.update({ where: { id }, data: { status: parsed.data.status, slotKey: parsed.data.status === "CANCELLED" ? null : appointment.slotKey } });
    const upcoming = await tx.appointment.count({ where: { leadId: appointment.leadId, status: { in: ["PENDING", "CONFIRMED"] } } });
    if (!upcoming) await tx.lead.update({ where: { id: appointment.leadId }, data: { status: "CONTACTED" } });
  });
  await logEvent("lead_updated", parsed.data.status === "CANCELLED" ? "Viewing cancelled; time released" : "Viewing completed", { leadId: appointment.leadId, detail: appointment.code });
  return NextResponse.json({ ok: true });
}
