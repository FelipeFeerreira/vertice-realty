import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contactSchema } from "@/lib/validation/schemas";
import { logEvent } from "@/lib/automation/events";

/** Contact page form → stores message + creates a traceable lead. */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request data." },
      { status: 400 }
    );
  }

  const { name, email, phone, subject, message } = parsed.data;

  await db.contactMessage.create({
    data: { name, email, phone: phone || null, subject: subject || null, message },
  });

  const lead = await db.lead.create({
    data: {
      name,
      email,
      phone: phone || null,
      source: "CONTACT_PAGE",
      classification: "NEW",
      status: "NEW",
      score: 20,
      notes: `${subject ? `[${subject}] ` : ""}${message}`,
      aiSummary: `Contact form inquiry.${subject ? ` Topic: ${subject}.` : ""} Message: "${message.slice(0, 200)}${message.length > 200 ? "…" : ""}"`,
    },
  });

  await logEvent("contact_message_received", "Message received from contact page", {
    detail: subject ?? undefined,
    leadId: lead.id,
  });

  return NextResponse.json({ ok: true });
}
