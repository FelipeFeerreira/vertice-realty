// ── Domain types shared across the English-language application ──

export type Purpose = "buy" | "rent";

export type PropertyType =
  | "apartment"
  | "house"
  | "penthouse"
  | "studio"
  | "townhouse";

export type Intent = "buy" | "rent" | "sell" | "explore";

export type Timeline =
  | "immediate"
  | "30-days"
  | "1-3-months"
  | "3-6-months"
  | "6-plus"
  | "researching";

export type FinancingStatus =
  | "cash"
  | "approved"
  | "needs-mortgage"
  | "selling-first"
  | "evaluating"
  | "na";

export type Classification = "HOT" | "WARM" | "NURTURE" | "NEW";

export type LeadStatus = "NEW" | "CONTACTED" | "SCHEDULED" | "NURTURE";

export type LeadSource =
  | "AI_CHATBOT"
  | "PROPERTY_PAGE"
  | "CONTACT_PAGE"
  | "SCHEDULE_PAGE";

/** Structured state collected by the AI concierge. */
export interface QualificationState {
  intent: Intent | null;
  propertyType: PropertyType | "any" | null;
  location: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  bedrooms: number | null;
  timeline: Timeline | null;
  financingStatus: FinancingStatus | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  /** id of the current step being asked */
  step: QualificationStepId;
  /** lead id once persisted */
  leadId: string | null;
  completed: boolean;
  marketingConsent?: boolean | null;
  skippedFields?: QualificationStepId[];
  /** slug of the property the visitor was viewing when the chat started */
  propertyContext: string | null;
}

export type QualificationStepId =
  | "intent"
  | "propertyType"
  | "location"
  | "budget"
  | "bedrooms"
  | "timeline"
  | "financing"
  | "name"
  | "email"
  | "phone"
  | "consent"
  | "done";

export interface QuickReply {
  label: string;
  value: string;
}

/** A message emitted by the chat engine for the UI to render. */
export type ChatReplyMessage =
  | { kind: "text"; text: string }
  | { kind: "properties"; text: string; properties: MatchedProperty[] }
  | {
      kind: "result";
      text: string;
      classification: Classification;
      score: number;
      leadId: string | null;
      ctas: { label: string; href: string; variant: "primary" | "ghost" }[];
    };

export interface MatchedProperty {
  id: string;
  slug: string;
  title: string;
  neighborhood: string;
  price: number;
  purpose: Purpose;
  type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  area: number;
  image: string;
  score: number;
}

export interface PropertyFilters {
  q?: string;
  purpose?: Purpose;
  type?: PropertyType;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  sort?: "featured" | "price-asc" | "price-desc" | "newest";
}

export interface ScoreResult {
  total: number;
  classification: Classification;
  reasons: string[];
}

export interface TimeSlot {
  time: string;
  available: boolean;
}
