import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "../src/lib/db";
import { bookableDates } from "../src/lib/availability";
import type { QualificationState, ChatReplyMessage } from "../src/lib/types";

const base = process.env.TEST_BASE_URL ?? "http://localhost:3001";
const sessions: string[] = [];
const leadIds = new Set<string>();
const suffix = randomUUID().slice(0, 8);
const email = `alex.${suffix}@example.com`;
const phone = "+55 11 98888-7777";

async function request(path: string, body?: unknown, method = "POST") {
  const response = await fetch(base + path, body === undefined ? undefined : { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json();
  return { status: response.status, data };
}

function conversation(propertyContext?: string) {
  const sessionId = randomUUID(); sessions.push(sessionId);
  return async (input: string, inputType = "option", requestId = randomUUID()) => {
    const result = await request("/api/chat", { sessionId, requestId, input, inputType, propertyContext, state: { completed: true, score: 100 } });
    assert.equal(result.status, 200, JSON.stringify(result.data));
    const data = result.data as { state: QualificationState; messages: ChatReplyMessage[] };
    if (data.state.leadId) leadIds.add(data.state.leadId);
    return data;
  };
}

async function main() {
  for (const key of ["AUTOMATION_WEBHOOK_URL", "WHATSAPP_WEBHOOK_URL", "EMAIL_WEBHOOK_URL", "GOOGLE_CALENDAR_WEBHOOK_URL", "OPENAI_API_KEY"]) assert.ok(!process.env[key], `${key} must be empty for local flow tests.`);
  const inventory = await db.property.findMany({ where: { purpose: "buy", type: "apartment", status: "available" } });
  const home = inventory.find(p => p.bedrooms >= 2)!; assert.ok(home);
  const chat = conversation(home.slug);
  const start = await chat("__start__"); assert.equal(start.state.completed, false, "Client cannot forge completed qualification");
  for (const answer of ["buy", "apartment", home.neighborhood]) await chat(answer);
  await chat(`up to ${home.price + 100000}`, "text");
  for (const answer of [String(home.bedrooms), "immediate", "cash", "Alex Morgan", email, phone]) await chat(answer);
  const requestId = randomUUID();
  const result = await chat("yes", "option", requestId);
  assert.equal(result.state.completed, true);
  const leadId = result.state.leadId!;
  assert.ok(leadId);
  const hot = await db.lead.findUniqueOrThrow({ where: { id: leadId } });
  assert.equal(hot.classification, "HOT");
  assert.equal(hot.propertyId, home.id);
  assert.equal(hot.marketingConsent, true);
  assert.equal((await chat("yes", "option", requestId)).state.leadId, leadId, "Retry must reuse response");
  await chat("__edit__:budget");
  const revised = await chat(`up to ${home.price + 500000}`, "text");
  assert.equal(revised.state.leadId, leadId);
  assert.equal(await db.lead.count({ where: { email } }), 1);
  assert.equal((await db.lead.findUniqueOrThrow({ where: { id: leadId } })).budgetMax, home.price + 500000);
  console.log("PASS: qualification, matching, HOT routing, retry and preference updates");

  for (const consent of ["yes", "no"]) {
    const explore = conversation();
    for (const answer of ["explore", "any", "__anywhere__", "1200000-2000000", "1", "Taylor Reed", `taylor.${consent}.${suffix}@example.com`, consent]) await explore(answer);
    const nurture = await db.lead.findFirstOrThrow({ where: { email: `taylor.${consent}.${suffix}@example.com` } });
    leadIds.add(nurture.id);
    assert.equal(nurture.classification, "NURTURE");
    assert.equal(await db.automationEvent.count({ where: { leadId: nurture.id, type: "nurture_enrolled" } }), consent === "yes" ? 1 : 0);
  }
  console.log("PASS: nurture opt-in and opt-out");

  let chosen: { date: string; time: string } | null = null;
  for (const day of bookableDates()) {
    const slots = await request(`/api/appointments/slots?date=${day.iso}&propertySlug=${home.slug}`);
    const available = slots.data.slots.find((slot: { available: boolean }) => slot.available);
    if (available) { chosen = { date: day.iso, time: available.time }; break; }
  }
  assert.ok(chosen);
  const booking = { propertySlug: home.slug, ...chosen, name: "Alex Morgan", email, phone, leadId };
  const attempts = await Promise.all([request("/api/appointments", booking), request("/api/appointments", booking)]);
  assert.deepEqual(attempts.map(r => r.status).sort(), [200, 409]);
  const appointment = await db.appointment.findFirstOrThrow({ where: { leadId } });
  assert.equal((await request(`/api/leads/${leadId}`, { status: "CONTACTED", notes: "Prefers afternoon follow-up." }, "PATCH")).status, 200);
  assert.equal((await db.lead.findUniqueOrThrow({ where: { id: leadId } })).status, "SCHEDULED");
  assert.equal((await request("/api/automation/handoff", { leadId })).status, 200);
  assert.equal((await db.lead.findUniqueOrThrow({ where: { id: leadId } })).status, "SCHEDULED");
  assert.equal((await request(`/api/appointments/${appointment.id}`, { status: "CANCELLED" }, "PATCH")).status, 200);
  const released = await request(`/api/appointments/slots?date=${chosen.date}&propertySlug=${home.slug}`);
  assert.ok(released.data.slots.find((slot: { time: string; available: boolean }) => slot.time === chosen.time)?.available);
  console.log("PASS: concurrent booking protection, agent actions, cancellation and slot release");

  const inquiry = await request("/api/leads", { name: "Jordan Ellis", email: `jordan.${suffix}@example.com`, phone, propertySlug: home.slug, message: "I would like more details about this home." });
  assert.equal(inquiry.status, 200); leadIds.add(inquiry.data.leadId);
  assert.equal((await request("/api/contact", { name: "Morgan Blake", email: `morgan.${suffix}@example.com`, message: "Please help me plan a move to Sao Paulo." })).status, 200);
  const contactLead = await db.lead.findFirstOrThrow({ where: { email: `morgan.${suffix}@example.com` } }); leadIds.add(contactLead.id);
  assert.equal((await request("/api/appointments", { ...booking, phone: "invalid-number" })).status, 400);
  assert.equal((await request("/api/properties?bedrooms=1.5")).status, 400);
  for (const path of ["/", "/properties", `/properties/${home.slug}`, "/properties?minPrice=invalid", "/favorites", "/about", "/contact", "/how-it-works", "/schedule", `/dashboard?lead=${leadId}`, "/sitemap.xml", "/robots.txt"]) {
    assert.equal((await fetch(base + path)).status, 200, path);
  }
  console.log("PASS: contact and interest persistence, validation, public pages and dashboard");
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  // Only remove records created by this run. Existing demo and user data stay intact.
  const ids = [...leadIds];
  await db.conversation.deleteMany({ where: { sessionId: { in: sessions } } });
  await db.automationEvent.deleteMany({ where: { leadId: { in: ids } } });
  await db.appointment.deleteMany({ where: { leadId: { in: ids } } });
  await db.lead.deleteMany({ where: { id: { in: ids } } });
  await db.contactMessage.deleteMany({ where: { email: `morgan.${suffix}@example.com` } });
  await db.$disconnect();
});
