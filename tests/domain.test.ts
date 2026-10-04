import test from "node:test";
import assert from "node:assert/strict";
import { initialState, parseMoney, runEngine } from "../src/lib/qualification/engine";
import { scoreLead } from "../src/lib/scoring/lead-score";
import { propertySearchSchema } from "../src/lib/properties/search";
import { bookableDates, isValidSlot } from "../src/lib/availability";
import { appointmentSchema } from "../src/lib/validation/schemas";
import type { QualificationState } from "../src/lib/types";

function answer(state: QualificationState, input: string, inputType: "text" | "option" = "option") {
  return runEngine({ state, input, inputType });
}

test("budgets accept grouped English and Brazilian numbers without truncating", () => {
  for (const [input, rent, max] of [["4,500", true, 4500], ["1,200,000", false, 1200000], ["1.200.000,00", false, 1200000], ["1.2m", false, 1200000], ["4.500", true, 4500]] as const) assert.equal(parseMoney(input, rent)?.max, max, input);
  assert.deepEqual(parseMoney("800k to 1.2m", false), { min: 800000, max: 1200000 });
  assert.equal(parseMoney("-500", false), null);
  assert.equal(parseMoney("90000000000000000", false), null);
});

test("complete buyer, edit budget, preserve contact and reset budget when switching to rent", () => {
  let state = initialState();
  for (const input of ["buy", "apartment", "__anywhere__", "1200000-2000000", "2", "immediate", "cash", "Alex Morgan", "alex@example.com", "+55 11 98888-7777", "yes"]) state = answer(state, input).state;
  assert.equal(state.completed, true);
  assert.equal(state.marketingConsent, true);
  assert.equal(scoreLead(state, 3).classification, "HOT");
  state.leadId = "existing-lead";
  state = answer(state, "__edit__:budget").state;
  const update = answer(state, "up to 1,200,000", "text");
  assert.equal(update.state.budgetMax, 1200000);
  assert.equal(update.state.leadId, "existing-lead");
  assert.equal(update.needsFinalize, true);
  state = answer(update.state, "__edit__:intent").state;
  state = answer(state, "rent").state;
  assert.equal(state.step, "budget");
  assert.equal(state.financingStatus, null);
  assert.equal(state.budgetMax, null);
  assert.equal(state.email, "alex@example.com");
});

test("early-stage visitors may skip email and decline nurturing", () => {
  let state = initialState();
  for (const input of ["explore", "any", "__anywhere__", "1200000-2000000", "1", "Taylor Reed", "__skip__", "no"]) state = answer(state, input).state;
  assert.equal(state.completed, true);
  assert.equal(state.email, null);
  assert.equal(state.marketingConsent, false);
  assert.equal(scoreLead(state, 1).classification, "NURTURE");
});

test("search and booking input reject malformed or out-of-range values", () => {
  for (const input of [{ minPrice: "abc" }, { bedrooms: "1.5" }, { minPrice: "500", maxPrice: "100" }, { purpose: "unknown" }, { maxPrice: "Infinity" }]) assert.equal(propertySearchSchema.safeParse(input).success, false);
  assert.equal(isValidSlot("2020-01-01", "10:00"), false);
  assert.equal(isValidSlot("2026-02-31", "10:00"), false);
  assert.equal(bookableDates().length, 14);
  const booking = { propertySlug: "home", date: "2026-10-06", time: "10:00", name: "Alex Morgan", email: "alex@example.com", phone: "abcdefghij" };
  assert.equal(appointmentSchema.safeParse(booking).success, false);
});
