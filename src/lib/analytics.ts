"use client";

// ── Client-side analytics helper ─────────────────────────────────────────
// Fire-and-forget; events are persisted as AutomationEvents (type
// "analytics") and visible in the dashboard activity log.

export type AnalyticsEvent =
  | "property_viewed"
  | "property_favorited"
  | "property_search"
  | "chat_started"
  | "qualification_started"
  | "qualification_completed"
  | "lead_created"
  | "visit_requested"
  | "agent_handoff_requested";

export function track(event: AnalyticsEvent, payload?: Record<string, unknown>) {
  try {
    const body = JSON.stringify({ event, payload });
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics", new Blob([body], { type: "application/json" }));
    } else {
      void fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      });
    }
  } catch {
    // analytics must never break UX
  }
}
