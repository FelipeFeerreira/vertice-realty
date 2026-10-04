import {
  BRAND,
  BUY_BUDGET_RANGES,
  FINANCING_LABELS,
  INTENT_LABELS,
  PROPERTY_TYPE_LABELS,
  RENT_BUDGET_RANGES,
  TIMELINE_LABELS,
} from "@/lib/constants";
import type {
  ChatReplyMessage,
  FinancingStatus,
  Intent,
  PropertyType,
  QualificationState,
  QualificationStepId,
  QuickReply,
  Timeline,
} from "@/lib/types";
import { hashString, normalizeText } from "@/lib/utils";

// ── State helpers ────────────────────────────────────────────────────────

export function initialState(propertyContext: string | null = null): QualificationState {
  return {
    intent: null,
    propertyType: null,
    location: null,
    budgetMin: null,
    budgetMax: null,
    bedrooms: null,
    timeline: null,
    financingStatus: null,
    name: null,
    email: null,
    phone: null,
    step: "intent",
    leadId: null,
    completed: false,
    marketingConsent: null,
    skippedFields: [],
    propertyContext,
  };
}

/** Ordered steps for each intent path. */
export function stepsForIntent(intent: Intent | null): QualificationStepId[] {
  switch (intent) {
    case "buy":
      return ["intent", "propertyType", "location", "budget", "bedrooms", "timeline", "financing", "name", "email", "phone", "consent"];
    case "rent":
      return ["intent", "propertyType", "location", "budget", "bedrooms", "timeline", "name", "email", "phone", "consent"];
    case "sell":
      return ["intent", "propertyType", "location", "bedrooms", "timeline", "name", "phone", "email", "consent"];
    case "explore":
      return ["intent", "propertyType", "location", "budget", "bedrooms", "name", "email", "consent"];
    default:
      return ["intent"];
  }
}

/** 0..1 progress through the current path. */
export function progressFor(state: QualificationState): number {
  const steps = stepsForIntent(state.intent);
  if (state.completed) return 1;
  const idx = steps.indexOf(state.step);
  if (idx < 0) return 0;
  return Math.round((idx / steps.length) * 100) / 100;
}

// ── Quick replies per step ───────────────────────────────────────────────

const INTENT_REPLIES: QuickReply[] = [
  { label: "Buy a property", value: "buy" },
  { label: "Rent a property", value: "rent" },
  { label: "Sell a property", value: "sell" },
  { label: "Just exploring", value: "explore" },
];

const TYPE_REPLIES: QuickReply[] = [
  { label: "Apartment", value: "apartment" },
  { label: "House", value: "house" },
  { label: "Penthouse", value: "penthouse" },
  { label: "Studio", value: "studio" },
  { label: "Townhouse", value: "townhouse" },
  { label: "No preference", value: "any" },
];

const LOCATION_REPLIES: QuickReply[] = [
  { label: "Jardins", value: "Jardins" },
  { label: "Vila Mariana", value: "Vila Mariana" },
  { label: "Pinheiros", value: "Pinheiros" },
  { label: "Vila Madalena", value: "Vila Madalena" },
  { label: "Moema", value: "Moema" },
  { label: "Itaim Bibi", value: "Itaim Bibi" },
  { label: "Another area", value: "__other__" },
  { label: "No preference", value: "__anywhere__" },
];

const BEDROOM_REPLIES: QuickReply[] = [
  { label: "1 bedroom", value: "1" },
  { label: "2 bedrooms", value: "2" },
  { label: "3 bedrooms", value: "3" },
  { label: "4 or more", value: "4" },
];

const TIMELINE_REPLIES: QuickReply[] = [
  { label: "As soon as possible", value: "immediate" },
  { label: "Within 30 days", value: "30-days" },
  { label: "1–3 months", value: "1-3-months" },
  { label: "3–6 months", value: "3-6-months" },
  { label: "More than 6 months", value: "6-plus" },
  { label: "Just researching", value: "researching" },
];

const FINANCING_REPLIES: QuickReply[] = [
  { label: "Cash", value: "cash" },
  { label: "Mortgage pre-approved", value: "approved" },
  { label: "Need mortgage assistance", value: "needs-mortgage" },
  { label: "Selling another property first", value: "selling-first" },
  { label: "Still evaluating", value: "evaluating" },
];

function budgetReplies(intent: Intent | null): QuickReply[] {
  const ranges = intent === "rent" ? RENT_BUDGET_RANGES : BUY_BUDGET_RANGES;
  return ranges.map((r) => ({
    label: r.label,
    value: `${r.min ?? ""}-${r.max ?? ""}`,
  }));
}

export function editRepliesFor(state: QualificationState): QuickReply[] {
  const labels: Partial<Record<QualificationStepId, string>> = { intent: "Buy, rent or sell", propertyType: "Property type", location: "Location", budget: "Budget", bedrooms: "Bedrooms", timeline: "Timeline", financing: "Financing", name: "Name", email: "Email", phone: "WhatsApp", consent: "Email preferences" };
  return stepsForIntent(state.intent).map(step => ({ label: labels[step] ?? step, value: `__edit__:${step}` }));
}

export function quickRepliesFor(state: QualificationState): QuickReply[] {
  if (state.completed) return [{ label: "Change my preferences", value: "__edit__" }];
  switch (state.step) {
    case "consent":
      return [{ label: "Yes, send relevant updates", value: "yes" }, { label: "No, only this request", value: "no" }];
    case "intent":
      return INTENT_REPLIES;
    case "propertyType":
      return TYPE_REPLIES;
    case "location":
      return LOCATION_REPLIES;
    case "budget":
      return budgetReplies(state.intent);
    case "bedrooms":
      return BEDROOM_REPLIES;
    case "timeline":
      return TIMELINE_REPLIES;
    case "financing":
      return FINANCING_REPLIES;
    case "email":
      return state.intent === "explore" ? [{ label: "Not right now", value: "__skip__" }] : [];
    default:
      return [];
  }
}

// ── Prompts ──────────────────────────────────────────────────────────────

export function greetingMessage(propertyTitle?: string | null): string {
  if (propertyTitle) {
    return `Hi! I'm ${BRAND.assistantName}, ${BRAND.name}'s ${BRAND.assistantRole.toLowerCase()}. I see you're interested in "${propertyTitle}"—great choice. I can help with this home or find other options. To get started, what are you looking for?`;
  }
  return `Hi! I'm ${BRAND.assistantName}, ${BRAND.name}'s ${BRAND.assistantRole.toLowerCase()}. I can learn what you're looking for, recommend homes from our collection, and connect you with a local specialist when you're ready. What brings you here today?`;
}

function promptFor(state: QualificationState): string {
  switch (state.step) {
    case "consent":
      return "May we email you matching homes and occasional property guides? This is optional. Choose 'No' to receive only messages about this request. You can change this preference here at any time.";
    case "intent":
      return "What are you looking for today?";
    case "propertyType":
      return state.intent === "sell"
        ? "What type of property are you looking to sell?"
        : "What type of property do you have in mind?";
    case "location":
      return state.intent === "sell"
        ? "Which neighborhood is the property in?"
        : "Which part of São Paulo would you like to live in?";
    case "budget":
      return state.intent === "rent"
        ? "What monthly rent range works for you?"
        : "What budget range are you considering?";
    case "bedrooms":
      return "How many bedrooms do you need?";
    case "timeline":
      return state.intent === "rent"
        ? "When are you hoping to move?"
        : state.intent === "sell"
          ? "When would you ideally like to sell?"
          : "When are you hoping to make the move?";
    case "financing":
      return "How are you planning to finance the purchase? This helps our specialist come prepared for your conversation.";
    case "name":
      return "We're nearly there. What name should I use when I put together your shortlist and connect you with the right specialist?";
    case "email":
      if (state.intent === "explore") {
        return "If you'd like, I can save your email and let you know when something matching this profile becomes available. No spam, promise.";
      }
      return `Nice to meet you, ${state.name}! What's the best email to send your property shortlist to?`;
    case "phone":
      return "And what's the best WhatsApp number, including area code, for the specialist to reach you?";
    default:
      return "";
  }
}

// ── Parsers ──────────────────────────────────────────────────────────────

interface ParseResult {
  ok: boolean;
  state: QualificationState;
  error?: string;
  /** if true, engine should ask for free text (e.g. "Outra região") */
  expectText?: boolean;
}

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_RE = /(?:\+?55\s?)?(?:\(?\d{2}\)?[\s.-]?)?9?\d{4}[\s.-]?\d{4}/;

function extractEmail(text: string): string | null {
  const m = text.match(EMAIL_RE);
  return m ? m[0].toLowerCase() : null;
}

function extractPhone(text: string): string | null {
  const m = text.match(PHONE_RE);
  if (!m) return null;
  const digits = m[0].replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 13) return null;
  return m[0].trim();
}

/** Parses Brazilian Real budget expressions written in English or Portuguese. */
export function parseMoney(text: string, rent: boolean): { min: number | null; max: number | null } | null {
  const t = normalizeText(text);
  if (/^\s*-/.test(t)) return null;
  const results: number[] = [];
  const re = /(\d[\d.,]*)\s*(million|millions|thousand|m\b|k\b|milhao|milhoes|mi\b|mil\b)?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t)) !== null) {
    const token = m[1].replace(/[.,]+$/, "");
    // The last separator is decimal when both formats occur. A single
    // separator followed by three digits denotes a thousands group.
    const hasBoth = token.includes(",") && token.includes(".");
    const decimal = token.lastIndexOf(",") > token.lastIndexOf(".") ? "," : ".";
    const raw = hasBoth
      ? token.split(decimal === "," ? "." : ",").join("").replace(decimal, ".")
      : /^\d{1,3}([.,]\d{3})+$/.test(token)
        ? token.replace(/[.,]/g, "")
        : token.replace(",", ".");
    let value = Number(raw);
    if (!Number.isFinite(value)) return null;
    const unit = m[2] ?? "";
    if (["million", "millions", "m", "milhao", "milhoes", "mi"].includes(unit)) value *= 1_000_000;
    else if (["thousand", "k", "mil"].includes(unit)) value *= 1_000;
    else if (value < 1000 && !rent) value *= 1_000; // "800" in buy context means 800 mil
    if (value > 1_000_000_000) return null;
    if (value >= (rent ? 500 : 20_000)) results.push(Math.round(value));
  }
  if (results.length === 0) return null;
  if (results.length >= 2) {
    const [a, b] = [Math.min(...results), Math.max(...results)];
    return { min: a, max: b };
  }
  const v = results[0];
  if (/\b(up to|under|maximum|max|at most|ate|no maximo)\b/.test(t)) return { min: null, max: v };
  if (/\b(from|starting|minimum|min|at least|a partir|minim|pelo menos)\b/.test(t)) return { min: v, max: null };
  return { min: null, max: v };
}

const TYPE_SYNONYMS: [RegExp, PropertyType][] = [
  [/apart|apto|\bapt\b/, "apartment"],
  [/house|home|casa(?!rao)/, "house"],
  [/cobertura|penthouse/, "penthouse"],
  [/studio|estudio/, "studio"],
  [/sobrado|townhouse/, "townhouse"],
];

function parseStep(
  step: QualificationStepId,
  state: QualificationState,
  input: string,
  inputType: "text" | "option"
): ParseResult {
  const text = input.trim();
  const norm = normalizeText(text);
  const next = { ...state };

  switch (step) {
    case "consent": {
      if (/^(yes|y|sure|agree)$/i.test(norm)) next.marketingConsent = true;
      else if (/^(no|n|no thanks|decline)$/i.test(norm)) next.marketingConsent = false;
      else return { ok: false, state, error: "Please choose whether you would like email updates. Both options let you continue." };
      return { ok: true, state: next };
    }
    case "intent": {
      const valid: Intent[] = ["buy", "rent", "sell", "explore"];
      if (inputType === "option" && valid.includes(text as Intent)) {
        next.intent = text as Intent;
        return { ok: true, state: next };
      }
      if (/buy|purchase|buying|comprar|compra|adquirir/.test(norm)) next.intent = "buy";
      else if (/rent|lease|renting|alugar|aluguel|locar|locacao/.test(norm)) next.intent = "rent";
      else if (/sell|selling|vender|venda/.test(norm)) next.intent = "sell";
      else if (/explor|brows|look|research|curios|conhecer/.test(norm)) next.intent = "explore";
      else return { ok: false, state, error: "Are you looking to buy, rent, sell, or just explore?" };
      return { ok: true, state: next };
    }

    case "propertyType": {
      if (inputType === "option") {
        if (text === "any") {
          next.propertyType = "any";
          return { ok: true, state: next };
        }
        if (text in PROPERTY_TYPE_LABELS) {
          next.propertyType = text as PropertyType;
          return { ok: true, state: next };
        }
      }
      if (/no preference|either|any|sem preferencia|tanto faz|qualquer/.test(norm)) {
        next.propertyType = "any";
        return { ok: true, state: next };
      }
      for (const [re, type] of TYPE_SYNONYMS) {
        if (re.test(norm)) {
          next.propertyType = type;
          return { ok: true, state: next };
        }
      }
      return {
        ok: false,
        state,
        error: "Tell me what you have in mind: apartment, house, penthouse, studio, or townhouse—or no preference.",
      };
    }

    case "location": {
      if (inputType === "option") {
        if (text === "__anywhere__") {
          next.location = "";
          return { ok: true, state: next };
        }
        if (text === "__other__") {
          return { ok: false, state, expectText: true, error: "Which neighborhood or area do you have in mind?" };
        }
        next.location = text;
        return { ok: true, state: next };
      }
      if (/no preference|any (area|neighborhood|where)|anywhere|sem preferencia|qualquer (regiao|bairro|lugar)|tanto faz/.test(norm)) {
        next.location = "";
        return { ok: true, state: next };
      }
      if (text.length >= 3) {
        // Capitalize each word for display
        next.location = text.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
        return { ok: true, state: next };
      }
      return { ok: false, state, error: "Which neighborhood or area would you prefer?" };
    }

    case "budget": {
      if (inputType === "option" && budgetReplies(state.intent).some(reply => reply.value === text)) {
        const [minRaw, maxRaw] = text.split("-");
        next.budgetMin = minRaw ? Number(minRaw) : null;
        next.budgetMax = maxRaw ? Number(maxRaw) : null;
        if ((next.budgetMin ?? 0) > 0 || (next.budgetMax ?? 0) > 0) return { ok: true, state: next };
      }
      const money = parseMoney(text, state.intent === "rent");
      if (money) {
        next.budgetMin = money.min;
        next.budgetMax = money.max;
        return { ok: true, state: next };
      }
      return {
        ok: false,
        state,
        error:
          state.intent === "rent"
            ? "What rent range works for you? For example, 'up to R$ 5k/month' or 'between R$ 4k and R$ 7k'."
            : "What budget range works for you? For example, 'up to R$ 1m' or 'between R$ 800k and R$ 1.2m'.",
      };
    }

    case "bedrooms": {
      const m = norm.match(/(\d)\s*(?:\+|or more|bed|bedroom|beds|ou mais|dorm|quarto)?/);
      if (inputType === "option" && /^[1-4]$/.test(text)) {
        next.bedrooms = Number(text);
        return { ok: true, state: next };
      }
      if (m) {
        next.bedrooms = Math.min(6, Math.max(1, Number(m[1])));
        return { ok: true, state: next };
      }
      return { ok: false, state, error: "How many bedrooms are you looking for? 1, 2, 3, or 4 and above?" };
    }

    case "timeline": {
      const valid: Timeline[] = ["immediate", "30-days", "1-3-months", "3-6-months", "6-plus", "researching"];
      if (inputType === "option" && valid.includes(text as Timeline)) {
        next.timeline = text as Timeline;
        return { ok: true, state: next };
      }
      if (/immediate|right away|asap|now|imediato|agora|urgente|ja\b/.test(norm)) next.timeline = "immediate";
      else if (/30 days|within a month|this month|next month|30 dias|esse mes|proximo mes/.test(norm)) next.timeline = "30-days";
      else if (/1 to 3|1-3|one to three|two months|three months|1 a 3|tres meses|2 meses|3 meses/.test(norm)) next.timeline = "1-3-months";
      else if (/3 to 6|3-6|three to six|four months|five months|3 a 6|seis meses|4 meses|5 meses/.test(norm)) next.timeline = "3-6-months";
      else if (/more than 6|over 6|next year|long term|mais de 6|ano que vem|longo prazo/.test(norm)) next.timeline = "6-plus";
      else if (/research|explor|brows|no rush|just looking|sem pressa|so olhando/.test(norm)) next.timeline = "researching";
      else return { ok: false, state, error: "When are you hoping to move? An estimate is perfectly fine." };
      return { ok: true, state: next };
    }

    case "financing": {
      const valid: FinancingStatus[] = ["cash", "approved", "needs-mortgage", "selling-first", "evaluating"];
      if (inputType === "option" && valid.includes(text as FinancingStatus)) {
        next.financingStatus = text as FinancingStatus;
        return { ok: true, state: next };
      }
      if (/cash|a vista|avista/.test(norm)) next.financingStatus = "cash";
      else if (/pre.?approv|approved|aprovad/.test(norm)) next.financingStatus = "approved";
      else if (/mortgage|financ/.test(norm)) next.financingStatus = "needs-mortgage";
      else if (/sell|selling|vender|vendo/.test(norm)) next.financingStatus = "selling-first";
      else if (/evaluat|not sure|still deciding|avaliando|nao sei|ainda/.test(norm)) next.financingStatus = "evaluating";
      else return { ok: false, state, error: "Are you paying cash, pre-approved for a mortgage, seeking financing, or still evaluating?" };
      return { ok: true, state: next };
    }

    case "name": {
      const email = extractEmail(text);
      const phone = extractPhone(text);
      if (email) next.email = email;
      if (phone) next.phone = phone;
      const cleaned = text
        .replace(EMAIL_RE, "")
        .replace(PHONE_RE, "")
        .replace(/^(my name is|i am|i'm|call me|hello,?|hi,?|meu nome e|me chamo|sou|oi,?|ola,?)\s*/i, "")
        .trim();
      if (cleaned.length >= 2) {
        next.name = cleaned.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
        return { ok: true, state: next };
      }
      if (next.name) return { ok: true, state: next };
      return { ok: false, state, error: "What should I call you?" };
    }

    case "email": {
      if (text === "__skip__" || /not right now|maybe later|skip|agora nao|depois|pular/.test(norm)) {
        if (state.intent === "explore") { next.email = null; next.skippedFields = [...(next.skippedFields ?? []), "email"]; return { ok: true, state: next }; }
      }
      const email = extractEmail(text);
      if (email) {
        next.email = email;
        return { ok: true, state: next };
      }
      return {
        ok: false,
        state,
        error: "That email doesn't look quite right. Could you check it? For example: name@example.com",
      };
    }

    case "phone": {
      const phone = extractPhone(text);
      if (phone) {
        next.phone = phone;
        return { ok: true, state: next };
      }
      return {
        ok: false,
        state,
        error: "Please share a WhatsApp number with area code. For example: +55 11 98765-4321",
      };
    }

    default:
      return { ok: true, state: next };
  }
}

// ── Acknowledgements (deterministic variety via input hash) ──────────────

const ACKS: Partial<Record<QualificationStepId, string[]>> = {
  intent: [],
  propertyType: ["Great choice.", "Got it.", "Perfect."],
  location: ["A lovely area.", "Great neighborhood.", "I know that area well."],
  budget: ["That works.", "Understood.", "Perfect, I've got it."],
  bedrooms: ["Noted.", "Got it.", "Sounds good."],
  timeline: ["I understand your timing.", "Got it, I've noted the timeline.", "Perfect."],
  financing: ["Thanks for sharing—that's helpful.", "Perfect, that's useful to know.", "Noted."],
};

function ackFor(step: QualificationStepId, state: QualificationState, input: string): string | null {
  if (step === "intent") {
    switch (state.intent) {
      case "buy":
        return "Buying a home is a big step. I'll help you find options that feel right.";
      case "rent":
        return "Great. Let's find a rental that fits your day-to-day.";
      case "sell":
        return "Understood. I'll connect you with a specialist who can help assess your property.";
      case "explore":
        return "No rush—exploring is a great place to start. I'll show you what we have.";
    }
  }
  const options = ACKS[step];
  if (!options || options.length === 0) return null;
  return options[hashString(input) % options.length];
}

// ── Engine ───────────────────────────────────────────────────────────────

export interface EngineInput {
  state: QualificationState;
  input: string;
  inputType: "text" | "option";
  propertyTitle?: string | null;
}

export interface EngineOutput {
  state: QualificationState;
  messages: ChatReplyMessage[];
  quickReplies: QuickReply[];
  needsFinalize: boolean;
}

/** Opportunistic extraction: visitors often volunteer info early. */
function opportunisticExtract(state: QualificationState, text: string): QualificationState {
  const next = { ...state };
  if (!next.email) next.email = extractEmail(text);
  if (!next.phone && /phone|whatsapp|call me|mobile/i.test(text)) next.phone = extractPhone(text);
  if (next.bedrooms == null) {
    const m = normalizeText(text).match(/(\d)\s*(bed|bedroom|beds|quarto|dormitorio|dorm)/);
    if (m) next.bedrooms = Number(m[1]);
  }
  if (next.propertyType == null) {
    for (const [re, type] of TYPE_SYNONYMS) {
      if (re.test(normalizeText(text))) {
        next.propertyType = type;
        break;
      }
    }
  }
  return next;
}

export function runEngine(engineInput: EngineInput): EngineOutput {
  const { input, inputType, propertyTitle } = engineInput;
  let state = { ...engineInput.state };
  const messages: ChatReplyMessage[] = [];

  if (/^(start over|start again|restart|fresh start)$/i.test(input.trim())) {
    state = { ...initialState(state.propertyContext), leadId: state.leadId };
    return { state, messages: [{ kind: "text", text: greetingMessage(propertyTitle) }], quickReplies: INTENT_REPLIES, needsFinalize: false };
  }
  if (input === "__edit__" || /^(change|edit|update)( my)? preferences$/i.test(input.trim())) {
    return { state, messages: [{ kind: "text", text: "Which detail would you like to change? I'll keep your other answers." }], quickReplies: editRepliesFor(state), needsFinalize: false };
  }
  const edit = input.startsWith("__edit__:") ? input.slice(9) : input.match(/^(?:change|edit|update)(?: my)? (budget|location|bedrooms|timeline|email|phone|name|intent|financing|propertyType)$/i)?.[1];
  if (edit && stepsForIntent(state.intent).includes(edit as QualificationStepId)) {
    state.step = edit as QualificationStepId;
    state.completed = false;
    state.skippedFields = (state.skippedFields ?? []).filter(field => field !== state.step);
    return { state, messages: [{ kind: "text", text: promptFor(state) }], quickReplies: quickRepliesFor(state), needsFinalize: false };
  }
  if (input === "__start__") {
    const text = state.completed ? "Welcome back. Your shortlist is saved below. You can update your preferences whenever you like." : state.intent ? `Welcome back. ${promptFor(state)}` : greetingMessage(propertyTitle);
    return { state, messages: [{ kind: "text", text }], quickReplies: quickRepliesFor(state), needsFinalize: false };
  }
  if (state.completed) {
    return { state, messages: [{ kind: "text", text: "I can update your search preferences or help you reach our team. Use the viewing and contact options above, or choose a detail to change below." }], quickReplies: editRepliesFor(state), needsFinalize: false };
  }

  // Opportunistic extraction from free text (contact fields, bedrooms, type)
  if (inputType === "text") {
    state = opportunisticExtract(state, input);
  }

  const result = parseStep(state.step, state, input, inputType);

  if (!result.ok) {
    messages.push({ kind: "text", text: result.error ?? "Could you say that again, please?" });
    return { state, messages, quickReplies: quickRepliesFor(state), needsFinalize: false };
  }

  state = result.state;
  if (input === "__skip__") state.skippedFields = [...(state.skippedFields ?? []), state.step];
  if (engineInput.state.step === "intent" && engineInput.state.intent !== state.intent) {
    state.budgetMin = null;
    state.budgetMax = null;
    state.financingStatus = null;
  }

  // Acknowledgement
  const ack = ackFor(engineInput.state.step, state, input);
  if (ack) messages.push({ kind: "text", text: ack });

  // Advance to the next unanswered step in the path
  const path = stepsForIntent(state.intent);


  const isAnswered = (stepId: QualificationStepId): boolean => {
    if (state.skippedFields?.includes(stepId)) return true;
    switch (stepId) {
      case "consent": return state.marketingConsent != null;
      case "intent": return state.intent != null;
      case "propertyType": return state.propertyType != null;
      case "location": return state.location !== null;
      case "budget": return state.budgetMin != null || state.budgetMax != null;
      case "bedrooms": return state.bedrooms != null;
      case "timeline": return state.timeline != null;
      case "financing": return state.financingStatus != null;
      case "name": return state.name != null;
      case "email": return state.email != null;
      case "phone": return state.phone != null;
      default: return false;
    }
  };

  let nextStep: QualificationStepId | null = null;
  for (let i = 0; i < path.length; i++) {
    if (!isAnswered(path[i])) {
      nextStep = path[i];
      break;
    }
  }

  if (nextStep) {
    state.step = nextStep;
    messages.push({ kind: "text", text: promptFor(state) });
    return { state, messages, quickReplies: quickRepliesFor(state), needsFinalize: false };
  }

  // All steps answered → finalize (DB work happens in the route handler)
  state.step = "done";
  state.completed = true;
  return { state, messages, quickReplies: [], needsFinalize: true };
}

// ── Human-readable summaries ─────────────────────────────────────────────

export function describeProfile(state: QualificationState): string {
  const parts: string[] = [];
  const type =
    state.propertyType && state.propertyType !== "any"
      ? PROPERTY_TYPE_LABELS[state.propertyType].toLowerCase()
      : "property";
  const beds = state.bedrooms ? ` with ${state.bedrooms} bedroom${state.bedrooms > 1 ? "s" : ""}` : "";
  const loc = state.location ? ` in ${state.location}` : "";
  parts.push(`${type}${beds}${loc}`);
  if (state.budgetMax || state.budgetMin) {
    const fmt = (v: number) =>
      v >= 1_000_000
        ? `R$ ${(v / 1_000_000).toLocaleString("en-US", { maximumFractionDigits: 1 })}m`
        : `R$ ${Math.round(v / 1_000)}k`;
    if (state.budgetMin && state.budgetMax)
      parts.push(`between ${fmt(state.budgetMin)} and ${fmt(state.budgetMax)}`);
    else if (state.budgetMax) parts.push(`up to ${fmt(state.budgetMax)}`);
    else if (state.budgetMin) parts.push(`from ${fmt(state.budgetMin)}`);
    if (state.intent === "rent") parts[parts.length - 1] += "/month";
  }
  return parts.join(" ");
}

/** Third-person summary stored on the lead and shown in the dashboard. */
export function buildAiSummary(state: QualificationState, matchedCount: number): string {
  const firstName = state.name?.split(" ")[0] ?? "The visitor";
  const intentLabel =
    state.intent === "buy" ? "buy" : state.intent === "rent" ? "rent" : state.intent === "sell" ? "sell" : "explore";
  const sentences: string[] = [];
  sentences.push(`${firstName} is looking to ${intentLabel} ${describeProfile(state)}.`);
  if (state.timeline) sentences.push(`Timeline: ${TIMELINE_LABELS[state.timeline].toLowerCase()}.`);
  if (state.intent === "buy" && state.financingStatus && state.financingStatus !== "na")
    sentences.push(`Financing: ${FINANCING_LABELS[state.financingStatus].toLowerCase()}.`);
  if (matchedCount > 0)
    sentences.push(
      `${matchedCount} ${matchedCount === 1 ? "listing matches" : "listings match"} the profile.`
    );
  else sentences.push("No current listing is a close match for the profile.");
  return sentences.join(" ");
}

export function intentLabel(intent: Intent | null): string {
  return intent ? INTENT_LABELS[intent] : "—";
}
