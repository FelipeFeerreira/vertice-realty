import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chatRequestSchema } from "@/lib/validation/schemas";
import {
  buildAiSummary,
  describeProfile,
  initialState,
  progressFor,
  runEngine,
  quickRepliesFor,
} from "@/lib/qualification/engine";
import { matchProperties } from "@/lib/matching/property-match";
import { scoreLead } from "@/lib/scoring/lead-score";
import { logEvent } from "@/lib/automation/events";
import {
  dispatchNurtureLead,
  cancelNurture,
  dispatchQualifiedLead,
  sendWhatsAppAgentAlert,
  type QualifiedLeadPayload,
} from "@/lib/integrations/webhooks";
import { polishReply } from "@/lib/ai/openai";
import { BRAND, NURTURE_SEQUENCE } from "@/lib/constants";
import type {
  ChatReplyMessage,
  Classification,
  QualificationState,
} from "@/lib/types";

/**
 * POST /api/chat
 * Runs the deterministic qualification engine, then — when qualification
 * completes — performs matching, scoring, lead persistence and automation
 * dispatch (webhooks are simulated when env vars are not configured).
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request data." }, { status: 400 });
  }

  const { sessionId, requestId, input, inputType, propertyContext } = parsed.data;
  // Persisted state owns qualification; client state is only for rendering.
  const existingConversation = await db.conversation.findUnique({ where: { sessionId } });
  if (requestId && existingConversation?.lastRequestId === requestId && existingConversation.lastResponse) {
    return NextResponse.json(JSON.parse(existingConversation.lastResponse));
  }
  let state: QualificationState = initialState(propertyContext ?? null);
  if (existingConversation) {
    try {
      state = JSON.parse(existingConversation.state) as QualificationState;
    } catch {
      state = initialState(propertyContext ?? null);
    }
  }

  // Property the visitor was viewing (personalizes greeting + lead link)
  const contextSlug = propertyContext ?? state.propertyContext;
  state.propertyContext = contextSlug ?? null;
  const contextProperty = contextSlug
    ? await db.property.findUnique({ where: { slug: contextSlug } })
    : null;

  const output = runEngine({
    state,
    input,
    inputType,
    propertyTitle: contextProperty?.title ?? null,
  });

  let newState = output.state;
  const messages: ChatReplyMessage[] = [...output.messages];
  let quickReplies = output.quickReplies;

  // ── Finalization: match → score → persist → automate ──────────────────
  if (output.needsFinalize) {
    const inventory = await db.property.findMany({ where: { status: "available" } });
    const matches = matchProperties(inventory, newState);
    const score = scoreLead(newState, matches.length);
    const summary = buildAiSummary(newState, matches.length);

    const firstName = newState.name?.split(" ")[0] ?? null;
    const classification: Classification = score.classification;

    // Persist the lead (only when we captured at least a name)
    let leadId: string | null = null;
    if (newState.name) {
      const existingLead = newState.leadId ? await db.lead.findUnique({ where: { id: newState.leadId } }) : null;
      const leadData = {
          name: newState.name,
          email: newState.email,
          phone: newState.phone,
          intent: newState.intent,
          propertyType: newState.propertyType,
          preferredLocation: newState.location,
          budgetMin: newState.budgetMin,
          budgetMax: newState.budgetMax,
          bedrooms: newState.bedrooms,
          timeline: newState.timeline,
          financingStatus: newState.financingStatus,
          score: score.total,
          classification,
          status: existingLead && ["SCHEDULED", "CONTACTED"].includes(existingLead.status) ? existingLead.status : classification === "NURTURE" ? "NURTURE" : "NEW",
          marketingConsent: newState.marketingConsent === true,
          source: "AI_CHATBOT",
          propertyId: contextProperty?.id ?? null,
          matchedIds: matches.length ? JSON.stringify(matches.map((m) => m.id)) : null,
          aiSummary: summary,
          scoreReasons: JSON.stringify(score.reasons),
      };
      const lead = existingLead
        ? await db.lead.update({ where: { id: existingLead.id }, data: leadData })
        : await db.lead.create({ data: leadData });
      leadId = lead.id;
      newState = { ...newState, leadId };

      await logEvent(existingLead ? "lead_updated" : "lead_created", existingLead ? "Preferences updated via concierge" : "Lead created via concierge", {
        detail: "Source: AI_CHATBOT",
        leadId,
      });
      await logEvent("qualification_completed", "AI qualification completed", { leadId });
      if (matches.length > 0) {
        await logEvent(
          "matched_properties",
          `${matches.length} matching ${matches.length === 1 ? "property" : "properties"} found`,
          { detail: matches.map((m) => m.neighborhood).join(", "), leadId }
        );
      }
      await logEvent(
        "lead_classified",
        `Lead classified as ${classification} (${score.total}/100)`,
        { leadId }
      );

      // ── Automation dispatch ────────────────────────────────────────────
      const payload: QualifiedLeadPayload = {
        leadId,
        name: newState.name!,
        email: newState.email,
        phone: newState.phone,
        intent: newState.intent,
        propertyType: newState.propertyType,
        preferredLocation: newState.location,
        budgetMin: newState.budgetMin,
        budgetMax: newState.budgetMax,
        bedrooms: newState.bedrooms,
        timeline: newState.timeline,
        financingStatus: newState.financingStatus,
        score: score.total,
        classification,
        propertyOfInterest: contextProperty?.title ?? null,
        matchedProperties: matches.map((m) => ({ slug: m.slug, title: m.title, price: m.price })),
        source: "AI_CHATBOT",
        createdAt: new Date().toISOString(),
      };

      if (existingLead?.marketingConsent && !newState.marketingConsent) {
        const cancellation = await cancelNurture(leadId, newState.email);
        await logEvent(cancellation.ok ? "lead_updated" : "nurture_failed", cancellation.ok ? "Email updates opted out; nurture cancellation recorded" : "Nurture cancellation failed; manual unsubscribe required", { leadId });
      }
      if (classification === "HOT" || classification === "WARM") {
        const [webhookResult, waResult] = await Promise.all([
          dispatchQualifiedLead(payload),
          sendWhatsAppAgentAlert(payload),
        ]);
        await logEvent(webhookResult.ok ? "webhook_dispatched" : "webhook_failed", webhookResult.ok ? "Automation webhook dispatched" : "Automation webhook failed; manual follow-up required", {
          detail: webhookResult.simulated ? "Demo mode (no URL configured)" : "External webhook",
          leadId,
        });
        await logEvent(waResult.ok ? "whatsapp_agent_alert" : "whatsapp_failed", waResult.ok ? "WhatsApp agent alert recorded" : "WhatsApp alert failed; manual follow-up required", {
          detail: waResult.simulated
            ? `Simulated → ${process.env.AGENT_WHATSAPP_NUMBER ?? BRAND.whatsapp}`
            : waResult.ok ? "Delivered via webhook" : "Provider did not accept the request",
          leadId,
        });
      } else if (newState.email && newState.marketingConsent) {
        const nurtureResult = await dispatchNurtureLead({ ...payload, sequence: [...NURTURE_SEQUENCE] });
        await logEvent(nurtureResult.ok ? "nurture_enrolled" : "nurture_failed", nurtureResult.ok ? "Lead added to nurture sequence" : "Nurture enrollment failed", {
          detail: `${NURTURE_SEQUENCE.length}-email sequence`,
          leadId,
        });
        const firstEmail = NURTURE_SEQUENCE[0];
        await logEvent("nurture_email_scheduled", `Email 1 ${nurtureResult.ok ? "queued" : "pending retry"}: "${firstEmail.subject}"`, {
          detail: newState.email ? `to ${newState.email}` : undefined,
          leadId,
        });
      }
    }

    // ── Result messages ──────────────────────────────────────────────────
    const profile = describeProfile(newState);
    const greet = firstName ? `${firstName}, ` : "";

    if (newState.intent === "sell") {
      messages.push({ kind: "result", text: `${greet}I've saved the details of your property. Our local specialist can discuss a valuation, pricing and the next steps for selling.`, classification, score: score.total, leadId, ctas: [{ label: "Request a valuation call", href: "#whatsapp-handoff", variant: "primary" }] });
    } else if (matches.length > 0) {
      messages.push({
        kind: "properties",
        text: `${greet}I've reviewed everything you've shared. Based on ${profile}, I found ${matches.length} ${
          matches.length === 1 ? "property that fits" : "properties that fit"
        } your preferences:`,
        properties: matches,
      });
    } else {
      messages.push({
        kind: "text",
        text: `${greet}I've reviewed your preferences (${profile}). I don't have an exact match right now, but I can let you know when one becomes available. A specialist can also look for options tailored to you.`,
      });
    }

    const primaryProperty = matches[0];
    const scheduleHref = primaryProperty
      ? `/schedule/${primaryProperty.slug}${leadId ? `?lead=${leadId}` : ""}`
      : `/schedule${leadId ? `?lead=${leadId}` : ""}`;

    if (newState.intent === "sell") {
      // Valuation handoff is offered above.
    } else if (classification === "HOT") {
      messages.push({
        kind: "result",
        text: `Your timeline and preferences suggest you're ready to speak with a specialist. I can help you request a viewing or ask an agent to contact you on WhatsApp.`,
        classification,
        score: score.total,
        leadId,
        ctas: [
          { label: "Request a viewing", href: scheduleHref, variant: "primary" },
          { label: "Ask an agent to WhatsApp me", href: "#whatsapp-handoff", variant: "ghost" },
        ],
      });
    } else if (classification === "WARM") {
      messages.push({
        kind: "result",
        text: `You have a well-defined profile, which makes the process easier. Would you like to view one of these homes in person? Or I can ask a specialist to send you more details.`,
        classification,
        score: score.total,
        leadId,
        ctas: [
          { label: "Request a viewing", href: scheduleHref, variant: "primary" },
          { label: "Get details on WhatsApp", href: "#whatsapp-handoff", variant: "ghost" },
        ],
      });
    } else {
      messages.push({
        kind: "result",
        text: newState.email && newState.marketingConsent
          ? `No rush. I've saved your preferences, and when a matching home becomes available, I'll email you at ${newState.email}. Whenever you're closer to a decision, come back and I'll refresh your shortlist.`
          : `No rush. Whenever you'd like to pick this back up, come back and I'll build an updated shortlist in seconds.`,
        classification,
        score: score.total,
        leadId,
        ctas: primaryProperty
          ? [{ label: "View suggested properties", href: `/properties/${primaryProperty.slug}`, variant: "primary" }]
          : [{ label: "Explore all properties", href: "/properties", variant: "primary" }],
      });
    }

    quickReplies = quickRepliesFor(newState);
  }

  // Optional LLM polish of plain-text replies (business logic untouched)
  if (process.env.OPENAI_API_KEY) {
    for (const msg of messages) {
      if (msg.kind === "text") {
        msg.text = await polishReply(msg.text, newState);
      }
    }
  }

  // ── Persist conversation ───────────────────────────────────────────────
  const response = { messages, quickReplies, state: newState, progress: progressFor(newState) };
  try {
    const conversation = await db.conversation.upsert({
      where: { sessionId },
      create: {
        sessionId,
        state: JSON.stringify(newState),
        lastRequestId: requestId ?? null,
        lastResponse: JSON.stringify(response),
        leadId: newState.leadId,
      },
      update: {
        state: JSON.stringify(newState),
        lastRequestId: requestId ?? null,
        lastResponse: JSON.stringify(response),
        leadId: newState.leadId,
      },
    });
    if (input !== "__start__") {
      await db.message.create({
        data: { conversationId: conversation.id, role: "user", content: input },
      });
    }
    for (const msg of messages) {
      await db.message.create({
        data: {
          conversationId: conversation.id,
          role: "assistant",
          content: msg.kind === "text" ? msg.text : `[${msg.kind}] ${msg.text}`,
        },
      });
    }
  } catch (err) {
    console.error("[chat] conversation persistence failed:", err);
  }

  return NextResponse.json(response);
}
