import { VISIT_SLOTS } from "@/lib/constants";
import type { TimeSlot } from "@/lib/types";
import { hashString } from "@/lib/utils";

/** Returns YYYY-MM-DD in local time. */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function bookableDates(count = 14): { iso: string; label: string; weekday: string }[] {
  const out: { iso: string; label: string; weekday: string }[] = [];
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const part = (type: string) => parts.find(p => p.type === type)!.value;
  const d = new Date(Number(part("year")), Number(part("month")) - 1, Number(part("day")), 12);
  d.setDate(d.getDate() + 1); // earliest: tomorrow
  while (out.length < count) {
    const dow = d.getDay();
    if (dow !== 0) {
      // closed on Sundays
      out.push({
        iso: toISODate(d),
        label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
      });
    }
    d.setDate(d.getDate() + 1);
  }
  return out;
}

/**
 * Deterministic demo availability: some slots are "taken" based on a hash of
 * date+time, so the UI shows realistic variation without a real calendar.
 */
export function slotsForDate(iso: string): TimeSlot[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || !bookableDates().some((day) => day.iso === iso)) return [];
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return [];
  const date = new Date(y, m - 1, d);
  if (toISODate(date) !== iso) return [];

  const dow = date.getDay();
  if (dow === 0) return [];
  const base = dow === 6 ? VISIT_SLOTS.saturday : VISIT_SLOTS.weekday;

  return base.map((time) => ({
    time,
    available: hashString(`${iso}T${time}`) % 6 !== 0,
  }));
}

export function isValidSlot(iso: string, time: string): boolean {
  return slotsForDate(iso).some((s) => s.time === time && s.available);
}
