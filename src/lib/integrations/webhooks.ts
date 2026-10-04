// ── Integration layer ────────────────────────────────────────────────────
// Each integration POSTs to a webhook URL from env vars. When the URL is
// not configured, the integration runs in DEMO MODE: the payload is logged
// and the function reports `simulated: true`. This keeps the whole product
// demonstrable without paid APIs, while remaining one env-var away from
// n8n / Make / Zapier / Twilio / Meta WhatsApp / Resend / Google Calendar.

import { BRAND, FINANCING_LABELS, INTENT_LABELS, PROPERTY_TYPE_LABELS, TIMELINE_LABELS } from "@/lib/constants";
import type { Classification, Intent, PropertyType, Timeline, FinancingStatus } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

interface WebhookResult {
  ok: boolean;
  simulated: boolean;
}

async function postWebhook(url: string | undefined, payload: unknown): Promise<WebhookResult> {
  if (!url) {
    console.log("[integration:demo] payload:", JSON.stringify(payload, null, 2));
    return { ok: true, simulated: true };
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
    return { ok: res.ok, simulated: false };
  } catch (err) {
    console.error("[integration] webhook failed:", err);
    return { ok: false, simulated: false };
  }
}

// ── Qualified lead → CRM / automation platform ──────────────────────────

export interface QualifiedLeadPayload {
  leadId: string;
  name: string;
  email: string | null;
  phone: string | null;
  intent: Intent | null;
  propertyType: PropertyType | "any" | null;
  preferredLocation: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  bedrooms: number | null;
  timeline: Timeline | null;
  financingStatus: FinancingStatus | null;
  score: number;
  classification: Classification;
  propertyOfInterest: string | null;
  matchedProperties: { slug: string; title: string; price: number }[];
  source: string;
  createdAt: string;
}

export function dispatchQualifiedLead(payload: QualifiedLeadPayload) {
  return postWebhook(process.env.AUTOMATION_WEBHOOK_URL, payload);
}

export function dispatchNurtureLead(payload: QualifiedLeadPayload & { sequence: { day: number; subject: string }[] }) {
  return postWebhook(process.env.AUTOMATION_WEBHOOK_URL, { type: "nurture_lead", ...payload });
}

// ── WhatsApp agent alert ─────────────────────────────────────────────────

export function buildAgentAlert(payload: QualifiedLeadPayload): string {
  const budget =
    payload.budgetMin || payload.budgetMax
      ? `${payload.budgetMin ? formatPrice(payload.budgetMin) : "—"} – ${payload.budgetMax ? formatPrice(payload.budgetMax) : "no maximum"}`
      : "not provided";
  const lines = [
    "🔥 NEW QUALIFIED LEAD — VERTICE REALTY",
    "",
    `Name: ${payload.name}`,
    `Intent: ${payload.intent ? INTENT_LABELS[payload.intent] : "—"}`,
    `Budget: ${budget}`,
    `Neighborhood: ${payload.preferredLocation ?? "no preference"}`,
    `Property type: ${payload.propertyType && payload.propertyType !== "any" ? PROPERTY_TYPE_LABELS[payload.propertyType] : "no preference"}`,
    `Bedrooms: ${payload.bedrooms ?? "—"}`,
    `Timeline: ${payload.timeline ? TIMELINE_LABELS[payload.timeline] : "—"}`,
    payload.financingStatus && payload.financingStatus !== "na"
      ? `Financing: ${FINANCING_LABELS[payload.financingStatus]}`
      : null,
    `Score: ${payload.score}/100 (${payload.classification})`,
    "",
    payload.propertyOfInterest ? `Property of interest: ${payload.propertyOfInterest}` : null,
    payload.matchedProperties.length > 0
      ? `Recommended: ${payload.matchedProperties.map((p) => p.title).join("; ")}`
      : null,
    "",
    `Contact: ${payload.phone ?? payload.email ?? "—"}`,
    "",
    "Recommended action: contact within 10 minutes.",
  ].filter(Boolean);
  return lines.join("\n");
}

export function sendWhatsAppAgentAlert(payload: QualifiedLeadPayload) {
  return postWebhook(process.env.WHATSAPP_WEBHOOK_URL, {
    to: process.env.AGENT_WHATSAPP_NUMBER ?? BRAND.whatsapp,
    channel: "whatsapp",
    message: buildAgentAlert(payload),
    leadId: payload.leadId,
  });
}

// ── Email (nurture + confirmations) ──────────────────────────────────────

export function sendEmail(to: string, subject: string, body: string) {
  return postWebhook(process.env.EMAIL_WEBHOOK_URL ?? process.env.AUTOMATION_WEBHOOK_URL, {
    type: "email",
    from: process.env.EMAIL_FROM ?? BRAND.email,
    to,
    subject,
    body,
  });
}

// ── Calendar ─────────────────────────────────────────────────────────────

export function createCalendarEvent(input: {
  summary: string;
  date: string;
  time: string;
  attendeeEmail: string;
  propertyTitle: string;
}) {
  return postWebhook(process.env.GOOGLE_CALENDAR_WEBHOOK_URL, {
    calendarId: process.env.GOOGLE_CALENDAR_ID ?? "primary",
    summary: input.summary,
    start: `${input.date}T${input.time}:00`,
    durationMinutes: 60,
    timeZone: "America/Sao_Paulo",
    attendees: [input.attendeeEmail],
    description: `Property viewing: ${input.propertyTitle}`,
  });
}

export function cancelNurture(leadId: string, email: string | null) {
  return postWebhook(process.env.AUTOMATION_WEBHOOK_URL, { type: "nurture_unsubscribed", leadId, email });
}
