import { db } from "@/lib/db";
import { formatDateTimeEN } from "@/lib/utils";

export type AutomationEventType =
  | "lead_updated"
  | "calendar_failed"
  | "confirmation_email_failed"
  | "whatsapp_failed"
  | "webhook_failed"
  | "nurture_failed"
  | "lead_created"
  | "qualification_completed"
  | "lead_classified"
  | "matched_properties"
  | "whatsapp_agent_alert"
  | "agent_handoff_requested"
  | "webhook_dispatched"
  | "visit_scheduled"
  | "calendar_event_created"
  | "confirmation_email_sent"
  | "nurture_enrolled"
  | "nurture_email_scheduled"
  | "contact_message_received"
  | "property_interest"
  | "analytics";

/** Persists an automation event (the dashboard activity log reads these). */
export async function logEvent(
  type: AutomationEventType,
  label: string,
  opts: { detail?: string; leadId?: string | null } = {}
) {
  try {
    await db.automationEvent.create({
      data: {
        type,
        label,
        detail: opts.detail ?? null,
        leadId: opts.leadId ?? null,
      },
    });
  } catch (err) {
    // Event logging must never break the user flow
    console.error(`[automation] failed to log ${type}:`, err);
  }
  console.log(`[automation] ${formatDateTimeEN(new Date())} — ${type}: ${label}`);
}
