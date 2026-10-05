import type {
  Classification,
  FinancingStatus,
  Intent,
  PropertyType,
  Timeline,
} from "./types";

// ── Brand ────────────────────────────────────────────────────────────────
export const BRAND = {
  name: "Vertice Realty",
  short: "Vertice",
  tagline: "Find a place that feels like yours.",
  description:
    "A boutique real estate agency in São Paulo, offering thoughtfully selected homes and technology-assisted, personal service.",
  phone: "+55 11 3456-7890",
  whatsapp: "+55 11 99876-5432",
  email: "hello@verticerealty.com.br",
  address: "1240 Rua Oscar Freire — Jardins, São Paulo, SP",
  hours: "Mon–Fri, 9 am–7 pm · Sat, 9 am–2 pm",
  creci: "CRECI-SP 00000-F (fictional brand)",
  assistantName: "Maya",
  assistantRole: "Property Concierge",
} as const;

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

// ── Property taxonomy ────────────────────────────────────────────────────
export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  apartment: "Apartment",
  house: "House",
  penthouse: "Penthouse",
  studio: "Studio",
  townhouse: "Townhouse",
};

export const PURPOSE_LABELS = { buy: "Buy", rent: "Rent" } as const;

export const NEIGHBORHOODS = [
  "Jardins",
  "Vila Mariana",
  "Pinheiros",
  "Vila Madalena",
  "Moema",
  "Itaim Bibi",
  "Perdizes",
  "Brooklin",
  "Higienópolis",
  "Saúde",
] as const;

// ── Chatbot labels ───────────────────────────────────────────────────────
export const INTENT_LABELS: Record<Intent, string> = {
  buy: "Buy a property",
  rent: "Rent a property",
  sell: "Sell a property",
  explore: "Just exploring",
};

export const TIMELINE_LABELS: Record<Timeline, string> = {
  immediate: "Immediately",
  "30-days": "Within 30 days",
  "1-3-months": "1–3 months",
  "3-6-months": "3–6 months",
  "6-plus": "6+ months",
  researching: "Just researching",
};

export const FINANCING_LABELS: Record<FinancingStatus, string> = {
  cash: "Cash",
  approved: "Mortgage pre-approved",
  "needs-mortgage": "Need mortgage assistance",
  "selling-first": "Selling another property first",
  evaluating: "Still evaluating",
  na: "Not applicable",
};

export const CLASSIFICATION_LABELS: Record<Classification, string> = {
  HOT: "Hot",
  WARM: "Warm",
  NURTURE: "Nurture",
  NEW: "New",
};

/** Budget quick-reply ranges shown by the concierge. */
export const BUY_BUDGET_RANGES = [
  { label: "Under R$ 700k", min: null, max: 700_000 },
  { label: "R$ 700k – R$ 1.2m", min: 700_000, max: 1_200_000 },
  { label: "R$ 1.2m – R$ 2m", min: 1_200_000, max: 2_000_000 },
  { label: "R$ 2m – R$ 3.5m", min: 2_000_000, max: 3_500_000 },
  { label: "Over R$ 3.5m", min: 3_500_000, max: null },
] as const;

export const RENT_BUDGET_RANGES = [
  { label: "Under R$ 4k/month", min: null, max: 4_000 },
  { label: "R$ 4k – R$ 7k/month", min: 4_000, max: 7_000 },
  { label: "R$ 7k – R$ 12k/month", min: 7_000, max: 12_000 },
  { label: "Over R$ 12k/month", min: 12_000, max: null },
] as const;

// ── Lead scoring (centralized, easy to tune) ────────────────────────────
export const SCORING = {
  thresholds: { hot: 80, warm: 55 },
  intent: { buy: 20, rent: 15, sell: 18, explore: 4 } as Record<Intent, number>,
  timeline: {
    immediate: 25,
    "30-days": 25,
    "1-3-months": 20,
    "3-6-months": 12,
    "6-plus": 6,
    researching: 2,
  } as Record<Timeline, number>,
  financing: {
    cash: 25,
    approved: 25,
    "needs-mortgage": 15,
    "selling-first": 12,
    evaluating: 6,
    na: 10,
  } as Record<FinancingStatus, number>,
  profile: {
    typeSpecified: 5,
    locationSpecified: 5,
    bedroomsSpecified: 5,
    budgetSpecified: 10,
  },
  contact: { email: 5, phone: 10 },
  match: { any: 5, threeOrMore: 10 },
} as const;

// ── Visit scheduling ─────────────────────────────────────────────────────
export const VISIT_SLOTS = {
  weekday: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"],
  saturday: ["09:00", "10:00", "11:00", "12:00", "13:00"],
} as const;

export const NURTURE_SEQUENCE = [
  { day: 0, subject: "Homes that match your search" },
  { day: 2, subject: "New opportunities in your preferred neighborhood" },
  { day: 5, subject: "A quick guide to getting ready for a viewing" },
  { day: 10, subject: "Still looking for a home? We're here to help" },
] as const;
