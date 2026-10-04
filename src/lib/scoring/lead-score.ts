import { SCORING } from "@/lib/constants";
import type {
  Classification,
  QualificationState,
  ScoreResult,
} from "@/lib/types";

/**
 * Deterministic lead scoring, 0–100. Weights and thresholds live in
 * `lib/constants.ts` so business rules can be tuned in one place.
 *
 * NOTE: this scores *buying readiness and fit* only — never any personal
 * or sensitive characteristic of the visitor.
 */
export function scoreLead(
  state: QualificationState,
  matchedCount: number
): ScoreResult {
  let total = 0;
  const reasons: string[] = [];

  if (state.intent) {
    const pts = SCORING.intent[state.intent];
    total += pts;
    reasons.push(
      state.intent === "explore"
        ? `Early-stage browsing (+${pts})`
        : `Declared intent: ${state.intent === "buy" ? "buying" : state.intent === "rent" ? "renting" : "selling"} (+${pts})`
    );
  }

  if (state.timeline) {
    const pts = SCORING.timeline[state.timeline];
    total += pts;
    const labels: Record<string, string> = {
      immediate: "immediately",
      "30-days": "within 30 days",
      "1-3-months": "1–3 months",
      "3-6-months": "3–6 months",
      "6-plus": "6+ months",
      researching: "just researching",
    };
    reasons.push(`Timeline: ${labels[state.timeline]} (+${pts})`);
  }

  if (state.financingStatus && state.intent === "buy") {
    const pts = SCORING.financing[state.financingStatus];
    total += pts;
    const labels: Record<string, string> = {
      cash: "cash purchase",
      approved: "mortgage pre-approved",
      "needs-mortgage": "needs mortgage assistance",
      "selling-first": "selling another property first",
      evaluating: "evaluating options",
      na: "not applicable",
    };
    reasons.push(`Financial readiness: ${labels[state.financingStatus]} (+${pts})`);
  }

  if (state.propertyType && state.propertyType !== "any") {
    total += SCORING.profile.typeSpecified;
    reasons.push(`Property type specified (+${SCORING.profile.typeSpecified})`);
  }
  if (state.location) {
    total += SCORING.profile.locationSpecified;
    reasons.push(`Neighborhood specified (+${SCORING.profile.locationSpecified})`);
  }
  if (state.bedrooms != null) {
    total += SCORING.profile.bedroomsSpecified;
    reasons.push(`Bedrooms specified (+${SCORING.profile.bedroomsSpecified})`);
  }
  if (state.budgetMax != null || state.budgetMin != null) {
    total += SCORING.profile.budgetSpecified;
    reasons.push(`Budget range specified (+${SCORING.profile.budgetSpecified})`);
  }

  if (state.email) {
    total += SCORING.contact.email;
    reasons.push(`Email provided (+${SCORING.contact.email})`);
  }
  if (state.phone) {
    total += SCORING.contact.phone;
    reasons.push(`WhatsApp provided (+${SCORING.contact.phone})`);
  }

  if (matchedCount >= 3) {
    total += SCORING.match.threeOrMore;
    reasons.push(`${matchedCount} matching listings in the collection (+${SCORING.match.threeOrMore})`);
  } else if (matchedCount > 0) {
    total += SCORING.match.any;
    reasons.push(`${matchedCount} matching listing(s) in the collection (+${SCORING.match.any})`);
  }

  total = Math.min(100, Math.max(0, total));

  const classification: Classification =
    total >= SCORING.thresholds.hot
      ? "HOT"
      : total >= SCORING.thresholds.warm
        ? "WARM"
        : "NURTURE";

  return { total, classification, reasons };
}

/** Short recommended next action shown in the dashboard. */
export function recommendedAction(classification: Classification, hasAppointment: boolean): string {
  if (hasAppointment) return "Confirm the viewing on WhatsApp the day before.";
  switch (classification) {
    case "HOT":
      return "Reach out within 10 minutes—highest priority.";
    case "WARM":
      return "Reach out today with the listings Maya recommended.";
    case "NURTURE":
      return "Keep in the nurture sequence and review again in 7 days.";
    default:
      return "Review the details and make first contact.";
  }
}
