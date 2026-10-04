import { NextRequest, NextResponse } from "next/server";
import { slotsForDate } from "@/lib/availability";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") ?? "";
  const propertySlug = req.nextUrl.searchParams.get("propertySlug");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Enter a valid date." }, { status: 400 });
  }
  const slots = slotsForDate(date);
  const property = propertySlug
    ? await db.property.findUnique({ where: { slug: propertySlug }, select: { agentId: true } })
    : null;
  if (propertySlug && !property) {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }
  const booked = await db.appointment.findMany({
    where: { date, agentId: property?.agentId, status: { not: "CANCELLED" } },
    select: { time: true },
  });
  const occupied = new Set(booked.map((appointment) => appointment.time));
  return NextResponse.json({ slots: slots.map((slot) => ({ ...slot, available: slot.available && !occupied.has(slot.time) })) });
}
