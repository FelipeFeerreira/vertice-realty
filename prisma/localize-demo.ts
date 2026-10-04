/** Safe in-place migration of the existing seeded demo catalog to English. */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { AGENT_COPY, PROPERTY_COPY } from "../src/data/english-copy";
import { FINANCING_LABELS, INTENT_LABELS, PROPERTY_TYPE_LABELS, TIMELINE_LABELS } from "../src/lib/constants";
import { formatDateEN, formatPrice, safeJsonParse } from "../src/lib/utils";

const db = new PrismaClient();

const sampleLeadSummaries: Record<string, string> = {
  "lead-daniel": "Daniel is looking to buy a 3-bedroom apartment in Vila Mariana, with a budget of R$ 700k–R$ 1.2m. He hopes to move within 30 days and has mortgage pre-approval. Three current listings match his preferences.",
  "lead-fernanda": "Fernanda is looking to buy a 4-bedroom penthouse in Itaim Bibi, with a budget from R$ 3.5m. She is ready to move immediately and plans to pay cash. One current listing matches her preferences.",
  "lead-roberto": "Roberto is looking to rent a 1-bedroom apartment in Pinheiros for R$ 4k–R$ 7k per month. His timeline is 1–3 months. One current listing matches, though the asking rent is above his stated range.",
  "lead-juliana": "Juliana is looking to buy a 3-bedroom house in Vila Madalena, with a budget of R$ 2m–R$ 3.5m. Her timeline is 3–6 months, and she plans to sell another property first. Two current listings match her preferences.",
  "lead-marcos": "Marcos is looking to sell his 2-bedroom apartment in Perdizes within 1–3 months. Recommend an in-person valuation with a local specialist.",
  "lead-patricia": "Patrícia is exploring 2-bedroom apartments in Moema up to R$ 700k. She has not set a timeline yet. One current listing may fit her preferences.",
  "lead-thiago": "Thiago is looking to rent a studio for up to R$ 4k per month. He is just researching and has not selected a neighborhood. Two current listings may fit his preferences.",
};

const sampleEvents: Record<string, { label: string; detail?: string }> = {
  lead_created: { label: "Lead created via concierge", detail: "Source: AI_CHATBOT" },
  qualification_completed: { label: "AI qualification completed" },
  matched_properties: { label: "Matching properties found" },
  lead_classified: { label: "Lead classified" },
  whatsapp_agent_alert: { label: "WhatsApp alert sent to agent" },
  visit_scheduled: { label: "Viewing scheduled" },
  calendar_event_created: { label: "Calendar event created (simulated)" },
  confirmation_email_sent: { label: "Confirmation email sent" },
  nurture_enrolled: { label: "Lead added to nurture sequence", detail: "Sequence of 4 emails" },
  nurture_email_scheduled: { label: "Nurture email sent or scheduled" },
  webhook_dispatched: { label: "Automation webhook dispatched", detail: "Demo mode (no URL configured)" },
  property_interest: { label: "Interest submitted from property page" },
  agent_handoff_requested: { label: "Client requested immediate agent contact" },
  contact_message_received: { label: "Message received from contact page" },
};

const reasonTranslations: [RegExp, string][] = [
  [/^Exploração inicial/, "Early-stage browsing"],
  [/^Intenção declarada: compra/, "Declared intent: purchase"],
  [/^Intenção declarada: locação/, "Declared intent: rent"],
  [/^Intenção declarada: venda/, "Declared intent: sale"],
  [/^Prazo: imediato/, "Timeline: immediately"],
  [/^Prazo: até 30 dias/, "Timeline: within 30 days"],
  [/^Prazo: 1–3 meses/, "Timeline: 1–3 months"],
  [/^Prazo: 3–6 meses/, "Timeline: 3–6 months"],
  [/^Prazo: \+6 meses/, "Timeline: 6+ months"],
  [/^Prazo: só pesquisando/, "Timeline: just researching"],
  [/^Condição financeira: pagamento à vista/, "Financial readiness: cash purchase"],
  [/^Condição financeira: financiamento aprovado/, "Financial readiness: mortgage pre-approved"],
  [/^Condição financeira: precisa de financiamento/, "Financial readiness: needs mortgage assistance"],
  [/^Condição financeira: vai vender um imóvel antes/, "Financial readiness: selling another property first"],
  [/^Condição financeira: avaliando opções/, "Financial readiness: evaluating options"],
  [/^Tipo de imóvel definido/, "Property type specified"],
  [/^Região definida/, "Neighborhood specified"],
  [/^Dormitórios definidos/, "Bedrooms specified"],
  [/^Faixa de orçamento definida/, "Budget range specified"],
  [/^E-mail informado/, "Email provided"],
  [/^WhatsApp informado/, "WhatsApp provided"],
];

function localizeReason(reason: string) {
  const points = reason.match(/\s\(\+\d+\)$/)?.[0] ?? "";
  const body = reason.replace(/\s\(\+\d+\)$/, "");
  const translated = reasonTranslations.find(([pattern]) => pattern.test(body))?.[1]
    ?? body.replace(/^(\d+) imóveis compatíveis em carteira/, "$1 matching properties in the collection")
      .replace(/^(\d+) imóvel\(is\) compatível\(is\) em carteira/, "$1 matching listing(s) in the collection");
  return `${translated}${points}`;
}

function buildLeadSummary(lead: {
  name: string;
  source: string;
  intent: string | null;
  propertyType: string | null;
  preferredLocation: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  bedrooms: number | null;
  timeline: string | null;
  financingStatus: string | null;
  matchedIds: string | null;
  property: { title: string } | null;
}) {
  const firstName = lead.name.split(" ")[0] || "The visitor";
  if (lead.source === "SCHEDULE_PAGE") {
    return `${firstName} requested a viewing${lead.property ? ` for “${lead.property.title}”` : ""} through the website.`;
  }
  const intent = lead.intent && lead.intent in INTENT_LABELS ? INTENT_LABELS[lead.intent as keyof typeof INTENT_LABELS].toLowerCase() : "explore";
  const type = lead.propertyType && lead.propertyType in PROPERTY_TYPE_LABELS
    ? PROPERTY_TYPE_LABELS[lead.propertyType as keyof typeof PROPERTY_TYPE_LABELS].toLowerCase()
    : "property";
  const details = [
    lead.bedrooms ? `${lead.bedrooms}-bedroom` : "",
    type,
    lead.preferredLocation ? `in ${lead.preferredLocation}` : "",
  ].filter(Boolean).join(" ");
  const budget = lead.budgetMin != null || lead.budgetMax != null
    ? ` Budget: ${lead.budgetMin != null ? formatPrice(lead.budgetMin) : "—"}–${lead.budgetMax != null ? formatPrice(lead.budgetMax) : "no maximum"}${lead.intent === "rent" ? "/month" : ""}.`
    : "";
  const timeline = lead.timeline && lead.timeline in TIMELINE_LABELS
    ? ` Timeline: ${TIMELINE_LABELS[lead.timeline as keyof typeof TIMELINE_LABELS].toLowerCase()}.`
    : "";
  const financing = lead.intent === "buy" && lead.financingStatus && lead.financingStatus in FINANCING_LABELS
    ? ` Financing: ${FINANCING_LABELS[lead.financingStatus as keyof typeof FINANCING_LABELS].toLowerCase()}.`
    : "";
  const matches = safeJsonParse<string[]>(lead.matchedIds, []).length;
  const matching = matches ? ` ${matches} matching ${matches === 1 ? "listing" : "listings"} in the current collection.` : " No close inventory match was available at the time.";
  return `${firstName} is looking to ${intent} ${details}.${budget}${timeline}${financing}${matching}`;
}

function translatedEventLabel(type: string, label: string) {
  if (type === "lead_classified") {
    const match = label.match(/(HOT|WARM|NURTURE|NEW)(?: \((\d+\/100)\))?/);
    return match ? `Lead classified as ${match[1]}${match[2] ? ` (${match[2]})` : ""}` : "Lead classified";
  }
  if (type === "matched_properties") {
    const count = label.match(/\d+/)?.[0];
    return count ? `${count} matching ${Number(count) === 1 ? "property" : "properties"} found` : "Matching properties found";
  }
  if (type === "nurture_email_scheduled" && label.includes("E-mail 1")) return "Nurture email 1 sent: Homes that match your search";
  if (type === "nurture_email_scheduled" && label.includes("E-mail 2")) return "Nurture email 2 sent: New opportunities in Moema";
  return sampleEvents[type]?.label ?? label;
}

function translatedEventDetail(type: string, detail: string | null) {
  if (!detail) return detail;
  if (detail.startsWith("Origem:")) return detail.replace("Origem:", "Source:");
  if (detail.startsWith("Modo demonstração")) return "Demo mode (no URL configured)";
  if (detail === "Simulado (sem integração configurada)") return "Simulated (no integration configured)";
  if (detail === "Entregue via webhook") return "Delivered via webhook";
  if (detail.startsWith("Simulado →")) return detail.replace("Simulado", "Simulated");
  if (detail.endsWith(" notificada")) return detail.replace(" notificada", " notified");
  if (detail === "Sequência de 4 e-mails") return "Sequence of 4 emails";
  if (detail === "Apartamento Higienópolis") return "Higienópolis apartment";
  return detail;
}

async function main() {
  for (const [slug, copy] of Object.entries(PROPERTY_COPY)) {
    await db.property.updateMany({
      where: { slug },
      data: {
        title: copy.title,
        shortDescription: copy.shortDescription,
        description: copy.description,
        amenities: JSON.stringify(copy.amenities),
      },
    });
  }

  for (const [id, copy] of Object.entries(AGENT_COPY)) {
    await db.agent.updateMany({ where: { id }, data: copy });
  }

  const leads = await db.lead.findMany({ include: { property: { select: { title: true } } } });
  for (const lead of leads) {
    const scoreReasons = lead.scoreReasons
      ? JSON.stringify((JSON.parse(lead.scoreReasons) as string[]).map(localizeReason))
      : null;
    const aiSummary = sampleLeadSummaries[lead.id]
      ?? (lead.aiSummary && (lead.source === "AI_CHATBOT" || lead.source === "SCHEDULE_PAGE")
        ? buildLeadSummary(lead)
        : lead.aiSummary);
    if (scoreReasons !== lead.scoreReasons || aiSummary !== lead.aiSummary) {
      await db.lead.update({ where: { id: lead.id }, data: { scoreReasons, aiSummary } });
    }
  }

  await db.lead.updateMany({
    where: { id: "lead-amanda" },
    data: {
      notes: "Property inquiry: asked for additional kitchen photos and whether the owner would consider a smaller apartment in exchange.",
    },
  });

  const events = await db.automationEvent.findMany({
    include: {
      lead: {
        include: {
          property: true,
          appointments: { include: { property: true }, orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });
  for (const event of events) {
    const appointment = event.lead?.appointments[0];
    let detail = translatedEventDetail(event.type, event.detail);
    if (event.type === "visit_scheduled" && appointment) {
      detail = `${appointment.property.neighborhood} · ${formatDateEN(appointment.date)} · ${appointment.time}`;
    } else if (event.type === "whatsapp_agent_alert" && event.leadId === "lead-daniel") {
      detail = "Camila Ferraz notified";
    } else if (event.type === "whatsapp_agent_alert" && event.leadId === "lead-fernanda") {
      detail = "Helena Vasconcellos notified";
    } else if (event.type === "matched_properties" && event.leadId === "lead-daniel") {
      detail = "Vila Mariana, Perdizes, Moema";
    } else if (event.type === "property_interest" && event.leadId === "lead-amanda") {
      detail = "Higienópolis apartment";
    }
    await db.automationEvent.update({
      where: { id: event.id },
      data: { label: translatedEventLabel(event.type, event.label), detail },
    });
  }

  console.log("Demo catalog, lead summaries, scoring reasons, and activity history updated to English.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => db.$disconnect());
