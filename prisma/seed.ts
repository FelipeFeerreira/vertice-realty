// ── Database seed ────────────────────────────────────────────────────────
// Creates agents, 18 properties, sample leads (hot/warm/nurture),
// appointments and automation events so the dashboard is alive immediately.

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { seedAgents, seedProperties } from "../src/data/properties";
import { AGENT_COPY, PROPERTY_COPY } from "../src/data/english-copy";
import { generateCode } from "../src/lib/utils";

const db = new PrismaClient();

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3_600_000);
const daysAgo = (d: number) => new Date(now - d * 86_400_000);
const daysAhead = (d: number) => {
  const dt = new Date(now + d * 86_400_000);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
};

async function main() {
  console.log("Seeding database...");

  await db.message.deleteMany();
  await db.conversation.deleteMany();
  await db.automationEvent.deleteMany();
  await db.appointment.deleteMany();
  await db.lead.deleteMany();
  await db.contactMessage.deleteMany();
  await db.property.deleteMany();
  await db.agent.deleteMany();

  for (const agent of seedAgents) {
    await db.agent.create({ data: { ...agent, ...AGENT_COPY[agent.id] } });
  }

  for (const p of seedProperties) {
    await db.property.create({
      data: {
        ...p,
        ...PROPERTY_COPY[p.slug],
        previousPrice: p.previousPrice ?? null,
        yearBuilt: p.yearBuilt ?? null,
        condoFee: p.condoFee ?? null,
        tax: p.tax ?? null,
        amenities: JSON.stringify(PROPERTY_COPY[p.slug].amenities),
        images: JSON.stringify(p.images),
        createdAt: daysAgo(Math.floor(Math.random() * 20) + 1),
      },
    });
  }
  console.log(`  ✓ ${seedAgents.length} agents, ${seedProperties.length} properties`);

  // ── Sample leads ───────────────────────────────────────────────────────
  const leads = [
    {
      id: "lead-daniel",
      name: "Daniel Martins",
      email: "daniel.martins@gmail.com",
      phone: "(11) 98765-1122",
      intent: "buy",
      propertyType: "apartment",
      preferredLocation: "Vila Mariana",
      budgetMin: 700_000,
      budgetMax: 1_200_000,
      bedrooms: 3,
      timeline: "30-days",
      financingStatus: "approved",
      score: 90,
      classification: "HOT",
      status: "SCHEDULED",
      source: "AI_CHATBOT",
      propertyId: "prop-vmariana-familiar",
      matchedIds: JSON.stringify(["prop-vmariana-familiar", "prop-perdizes-esquina", "prop-moema-lazer"]),
      scoreReasons: JSON.stringify([
        "Intenção declarada: compra (+20)",
        "Prazo: até 30 dias (+25)",
        "Condição financeira: financiamento aprovado (+25)",
        "Tipo de imóvel definido (+5)",
        "Região definida (+5)",
        "Dormitórios definidos (+5)",
        "Faixa de orçamento definida (+10)",
        "E-mail informado (+5)",
        "WhatsApp informado (+10)",
        "3 imóveis compatíveis em carteira (+10)",
      ]),
      aiSummary:
        "Daniel quer comprar apartamento de 3 dormitórios em Vila Mariana entre R$ 700 mil e R$ 1,2 mi. Prazo: em até 30 dias. Pagamento: financiamento já aprovado. 3 imóveis em carteira são compatíveis com o perfil.",
      createdAt: hoursAgo(26),
    },
    {
      id: "lead-fernanda",
      name: "Fernanda Lopes",
      email: "fernanda.lopes@outlook.com",
      phone: "(11) 97654-8833",
      intent: "buy",
      propertyType: "penthouse",
      preferredLocation: "Itaim Bibi",
      budgetMin: 3_500_000,
      budgetMax: null,
      bedrooms: 4,
      timeline: "immediate",
      financingStatus: "cash",
      score: 95,
      classification: "HOT",
      status: "CONTACTED",
      source: "AI_CHATBOT",
      propertyId: "prop-itaim-cobertura",
      matchedIds: JSON.stringify(["prop-itaim-cobertura"]),
      scoreReasons: JSON.stringify([
        "Intenção declarada: compra (+20)",
        "Prazo: imediato (+25)",
        "Condição financeira: pagamento à vista (+25)",
        "Tipo de imóvel definido (+5)",
        "Região definida (+5)",
        "Dormitórios definidos (+5)",
        "Faixa de orçamento definida (+10)",
        "E-mail informado (+5)",
        "WhatsApp informado (+10)",
        "1 imóvel compatível em carteira (+5)",
      ]),
      aiSummary:
        "Fernanda quer comprar cobertura de 4 dormitórios em Itaim Bibi a partir de R$ 3,5 mi. Prazo: imediato. Pagamento: à vista. 1 imóvel em carteira é compatível com o perfil.",
      createdAt: hoursAgo(49),
    },
    {
      id: "lead-roberto",
      name: "Roberto Hashimoto",
      email: "roberto.hashimoto@icloud.com",
      phone: "(11) 96543-2211",
      intent: "rent",
      propertyType: "apartment",
      preferredLocation: "Pinheiros",
      budgetMin: 4_000,
      budgetMax: 7_000,
      bedrooms: 1,
      timeline: "1-3-months",
      financingStatus: null,
      score: 71,
      classification: "WARM",
      status: "NEW",
      source: "AI_CHATBOT",
      propertyId: null,
      matchedIds: JSON.stringify(["prop-vmariana-aluguel"]),
      scoreReasons: JSON.stringify([
        "Intenção declarada: locação (+15)",
        "Prazo: 1–3 meses (+20)",
        "Tipo de imóvel definido (+5)",
        "Região definida (+5)",
        "Dormitórios definidos (+5)",
        "Faixa de orçamento definida (+10)",
        "E-mail informado (+5)",
        "WhatsApp informado (+10)",
        "1 imóvel compatível em carteira (+5)",
      ]),
      aiSummary:
        "Roberto quer alugar apartamento de 1 dormitório em Pinheiros entre R$ 4 mil e R$ 7 mil/mês. Prazo: 1 a 3 meses. 1 imóvel em carteira é compatível com o perfil — a faixa de preço pedida está acima dos anúncios atuais do bairro.",
      createdAt: hoursAgo(8),
    },
    {
      id: "lead-juliana",
      name: "Juliana Prado",
      email: "juliana.prado@gmail.com",
      phone: "(11) 99812-4455",
      intent: "buy",
      propertyType: "house",
      preferredLocation: "Vila Madalena",
      budgetMin: 2_000_000,
      budgetMax: 3_500_000,
      bedrooms: 3,
      timeline: "3-6-months",
      financingStatus: "selling-first",
      score: 68,
      classification: "WARM",
      status: "NEW",
      source: "AI_CHATBOT",
      propertyId: "prop-vmad-casa-vila",
      matchedIds: JSON.stringify(["prop-vmad-casa-vila", "prop-brooklin-sobrado"]),
      scoreReasons: JSON.stringify([
        "Intenção declarada: compra (+20)",
        "Prazo: 3–6 meses (+12)",
        "Condição financeira: vai vender um imóvel antes (+12)",
        "Tipo de imóvel definido (+5)",
        "Região definida (+5)",
        "Dormitórios definidos (+5)",
        "Faixa de orçamento definida (+10)",
        "E-mail informado (+5)",
        "WhatsApp informado (+10)",
        "2 imóveis compatíveis em carteira (+5)",
      ]),
      aiSummary:
        "Juliana quer comprar casa de 3 dormitórios em Vila Madalena entre R$ 2 mi e R$ 3,5 mi. Prazo: 3 a 6 meses. Pagamento: vai vender um imóvel antes. 2 imóveis em carteira são compatíveis com o perfil.",
      createdAt: hoursAgo(30),
    },
    {
      id: "lead-marcos",
      name: "Marcos Vieira",
      email: "marcos.vieira@uol.com.br",
      phone: "(11) 98123-7766",
      intent: "sell",
      propertyType: "apartment",
      preferredLocation: "Perdizes",
      budgetMin: null,
      budgetMax: null,
      bedrooms: 2,
      timeline: "1-3-months",
      financingStatus: null,
      score: 66,
      classification: "WARM",
      status: "CONTACTED",
      source: "AI_CHATBOT",
      propertyId: null,
      matchedIds: null,
      scoreReasons: JSON.stringify([
        "Intenção declarada: venda (+18)",
        "Prazo: 1–3 meses (+20)",
        "Tipo de imóvel definido (+5)",
        "Região definida (+5)",
        "Dormitórios definidos (+5)",
        "E-mail informado (+5)",
        "WhatsApp informado (+10)",
      ]),
      aiSummary:
        "Marcos quer vender apartamento de 2 dormitórios em Perdizes. Prazo: 1 a 3 meses. Encaminhar para avaliação presencial com especialista.",
      createdAt: hoursAgo(52),
    },
    {
      id: "lead-patricia",
      name: "Patrícia Gomes",
      email: "patricia.gomes@gmail.com",
      phone: null,
      intent: "explore",
      propertyType: "apartment",
      preferredLocation: "Moema",
      budgetMin: null,
      budgetMax: 700_000,
      bedrooms: 2,
      timeline: null,
      financingStatus: null,
      score: 34,
      classification: "NURTURE",
      marketingConsent: true,
      status: "NURTURE",
      source: "AI_CHATBOT",
      propertyId: null,
      matchedIds: JSON.stringify(["prop-brooklin-compacto"]),
      scoreReasons: JSON.stringify([
        "Exploração inicial (+4)",
        "Tipo de imóvel definido (+5)",
        "Região definida (+5)",
        "Dormitórios definidos (+5)",
        "Faixa de orçamento definida (+10)",
        "E-mail informado (+5)",
        "1 imóvel compatível em carteira (+5)",
      ]),
      aiSummary:
        "Patrícia está explorando apartamento de 2 dormitórios em Moema até R$ 700 mil. Ainda sem prazo definido. 1 imóvel em carteira é compatível com o perfil.",
      createdAt: daysAgo(3),
    },
    {
      id: "lead-thiago",
      name: "Thiago Nogueira",
      email: "thiago.nogueira@gmail.com",
      phone: null,
      intent: "rent",
      propertyType: "studio",
      preferredLocation: null,
      budgetMin: null,
      budgetMax: 4_000,
      bedrooms: 1,
      timeline: "researching",
      financingStatus: null,
      score: 52,
      classification: "NURTURE",
      marketingConsent: true,
      status: "NURTURE",
      source: "AI_CHATBOT",
      propertyId: null,
      matchedIds: JSON.stringify(["prop-moema-studio-aluguel", "prop-pinheiros-aluguel"]),
      scoreReasons: JSON.stringify([
        "Intenção declarada: locação (+15)",
        "Prazo: só pesquisando (+2)",
        "Tipo de imóvel definido (+5)",
        "Dormitórios definidos (+5)",
        "Faixa de orçamento definida (+10)",
        "E-mail informado (+5)",
        "2 imóveis compatíveis em carteira (+5)",
      ]),
      aiSummary:
        "Thiago quer alugar studio de 1 dormitório até R$ 4 mil/mês. Prazo: só pesquisando. 2 imóveis em carteira são compatíveis com o perfil.",
      createdAt: daysAgo(1),
    },
    {
      id: "lead-amanda",
      name: "Amanda Sales",
      email: "amanda.sales@terra.com.br",
      phone: "(11) 99456-8899",
      intent: null,
      propertyType: null,
      preferredLocation: null,
      budgetMin: null,
      budgetMax: null,
      bedrooms: null,
      timeline: null,
      financingStatus: null,
      score: 15,
      classification: "NEW",
      status: "NEW",
      source: "PROPERTY_PAGE",
      propertyId: "prop-higienopolis-epoca",
      matchedIds: null,
      scoreReasons: null,
      aiSummary: null,
      notes: "Demonstrou interesse via formulário da página do imóvel: \"Gostaria de mais fotos da cozinha e saber se aceita permuta por apartamento menor.\"",
      createdAt: hoursAgo(5),
    },
  ];

  const leadSummaries: Record<string, string> = {
    "lead-daniel": "Daniel is looking to buy a 3-bedroom apartment in Vila Mariana, with a budget of R$ 700k–R$ 1.2m. He hopes to move within 30 days and has mortgage pre-approval. Three current listings match his preferences.",
    "lead-fernanda": "Fernanda is looking to buy a 4-bedroom penthouse in Itaim Bibi, with a budget from R$ 3.5m. She is ready to move immediately and plans to pay cash. One current listing matches her preferences.",
    "lead-roberto": "Roberto is looking to rent a 1-bedroom apartment in Pinheiros for R$ 4k–R$ 7k per month. His timeline is 1–3 months. One current listing matches, though the asking rent is above his stated range.",
    "lead-juliana": "Juliana is looking to buy a 3-bedroom house in Vila Madalena, with a budget of R$ 2m–R$ 3.5m. Her timeline is 3–6 months, and she plans to sell another property first. Two current listings match her preferences.",
    "lead-marcos": "Marcos is looking to sell his 2-bedroom apartment in Perdizes within 1–3 months. Recommend an in-person valuation with a local specialist.",
    "lead-patricia": "Patrícia is exploring 2-bedroom apartments in Moema up to R$ 700k. She has not set a timeline yet. One current listing may fit her preferences.",
    "lead-thiago": "Thiago is looking to rent a studio for up to R$ 4k per month. He is just researching and has not selected a neighborhood. Two current listings may fit his preferences.",
  };
  const reasonLabels: [RegExp, string][] = [
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
  for (const lead of leads) {
    const reasons = lead.scoreReasons ? JSON.parse(lead.scoreReasons) as string[] : null;
    await db.lead.create({
      data: {
        ...lead,
        aiSummary: leadSummaries[lead.id] ?? lead.aiSummary,
        notes: lead.id === "lead-amanda"
          ? "Property inquiry: asked for additional kitchen photos and whether the owner would consider a smaller apartment in exchange."
          : lead.notes,
        scoreReasons: reasons
          ? JSON.stringify(reasons.map((reason) => {
              const points = reason.match(/\s\(\+\d+\)$/)?.[0] ?? "";
              const body = reason.replace(/\s\(\+\d+\)$/, "");
              const translated = reasonLabels.find(([pattern]) => pattern.test(body))?.[1]
                ?? body.replace(/^(\d+) imóveis compatíveis em carteira/, "$1 matching properties in the collection")
                  .replace(/^(\d+) imóvel\(is\) compatível\(is\) em carteira/, "$1 matching listing(s) in the collection");
              return `${translated}${points}`;
            }))
          : lead.scoreReasons,
      },
    });
  }
  console.log(`  ✓ ${leads.length} sample leads`);

  // ── Appointments ───────────────────────────────────────────────────────
  const appointments = [
    {
      code: generateCode(),
      leadId: "lead-daniel",
      propertyId: "prop-vmariana-familiar",
      agentId: "agent-camila",
      date: daysAhead(2),
      time: "10:00",
      status: "CONFIRMED",
      notes: "Cliente pediu para conhecer também o apartamento de Perdizes no mesmo dia.",
      createdAt: hoursAgo(24),
    },
    {
      code: generateCode(),
      leadId: "lead-fernanda",
      propertyId: "prop-itaim-cobertura",
      agentId: "agent-helena",
      date: daysAhead(1),
      time: "15:00",
      status: "CONFIRMED",
      notes: null,
      createdAt: hoursAgo(40),
    },
    {
      code: generateCode(),
      leadId: "lead-juliana",
      propertyId: "prop-vmad-casa-vila",
      agentId: "agent-rafael",
      date: daysAhead(6),
      time: "11:00",
      status: "PENDING",
      notes: "Vai com a mãe. Prefere manhã.",
      createdAt: hoursAgo(20),
    },
  ];
  for (const a of appointments) {
    await db.appointment.create({ data: a });
  }
  console.log(`  ✓ ${appointments.length} appointments`);

  // ── Automation events ──────────────────────────────────────────────────
  const events: {
    type: string;
    label: string;
    detail?: string;
    leadId?: string;
    createdAt: Date;
  }[] = [
    { type: "lead_created", label: "Lead created via concierge", detail: "Source: AI_CHATBOT", leadId: "lead-daniel", createdAt: hoursAgo(26) },
    { type: "qualification_completed", label: "AI qualification completed", leadId: "lead-daniel", createdAt: hoursAgo(26) },
    { type: "matched_properties", label: "3 matching properties found", detail: "Vila Mariana, Perdizes, Moema", leadId: "lead-daniel", createdAt: hoursAgo(26) },
    { type: "lead_classified", label: "Lead classified as HOT (90/100)", leadId: "lead-daniel", createdAt: hoursAgo(26) },
    { type: "whatsapp_agent_alert", label: "WhatsApp alert sent to agent", detail: "Camila Ferraz notified", leadId: "lead-daniel", createdAt: hoursAgo(26) },
    { type: "visit_scheduled", label: "Viewing scheduled", detail: "Vila Mariana · 10:00", leadId: "lead-daniel", createdAt: hoursAgo(24) },
    { type: "calendar_event_created", label: "Calendar event created (simulated)", leadId: "lead-daniel", createdAt: hoursAgo(24) },
    { type: "confirmation_email_sent", label: "Confirmation email sent", detail: "daniel.martins@gmail.com", leadId: "lead-daniel", createdAt: hoursAgo(24) },
    { type: "lead_created", label: "Lead created via concierge", leadId: "lead-fernanda", createdAt: hoursAgo(49) },
    { type: "lead_classified", label: "Lead classified as HOT (95/100)", leadId: "lead-fernanda", createdAt: hoursAgo(49) },
    { type: "whatsapp_agent_alert", label: "WhatsApp alert sent to agent", detail: "Helena Vasconcellos notified", leadId: "lead-fernanda", createdAt: hoursAgo(49) },
    { type: "visit_scheduled", label: "Viewing scheduled", detail: "Itaim penthouse · 15:00", leadId: "lead-fernanda", createdAt: hoursAgo(40) },
    { type: "lead_created", label: "Lead created via concierge", leadId: "lead-patricia", createdAt: daysAgo(3) },
    { type: "lead_classified", label: "Lead classified as NURTURE (34/100)", leadId: "lead-patricia", createdAt: daysAgo(3) },
    { type: "nurture_enrolled", label: "Lead added to nurture sequence", detail: "Sequence of 4 emails", leadId: "lead-patricia", createdAt: daysAgo(3) },
    { type: "nurture_email_scheduled", label: "Email 1 sent: \"Homes that match your search\"", leadId: "lead-patricia", createdAt: daysAgo(3) },
    { type: "nurture_email_scheduled", label: "Email 2 sent: \"New opportunities in Moema\"", leadId: "lead-patricia", createdAt: daysAgo(1) },
    { type: "lead_created", label: "Lead created via concierge", leadId: "lead-roberto", createdAt: hoursAgo(8) },
    { type: "lead_classified", label: "Lead classified as WARM (71/100)", leadId: "lead-roberto", createdAt: hoursAgo(8) },
    { type: "webhook_dispatched", label: "Automation webhook dispatched", detail: "Demo mode (no URL configured)", leadId: "lead-roberto", createdAt: hoursAgo(8) },
    { type: "property_interest", label: "Interest submitted from property page", detail: "Higienópolis apartment", leadId: "lead-amanda", createdAt: hoursAgo(5) },
  ];
  for (const e of events) {
    await db.automationEvent.create({ data: { ...e, detail: e.detail ?? null, leadId: e.leadId ?? null } });
  }
  console.log(`  ✓ ${events.length} automation events`);

  console.log("Seed complete ✓");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
