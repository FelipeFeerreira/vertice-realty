import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const brl = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

/** BRL formatted with English separators; rentals include a monthly suffix. */
export function formatPrice(value: number, purpose?: "buy" | "rent") {
  return `${brl.format(value)}${purpose === "rent" ? "/month" : ""}`;
}

/** Compact price for chips/cards, formatted in English. */
export function formatPriceCompact(value: number) {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `R$ ${m.toLocaleString("en-US", { maximumFractionDigits: 2 })}m`;
  }
  if (value >= 1_000) {
    return `R$ ${Math.round(value / 1_000)}k`;
  }
  return brl.format(value);
}

export function formatArea(area: number) {
  return `${area} m²`;
}

export function formatDateEN(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function formatDateTimeEN(date: Date) {
  return date.toLocaleString("en-US", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function pluralize(n: number, singular: string, plural: string) {
  return n === 1 ? singular : plural;
}

/** Deterministic hash used for demo "taken" slots and ack variation. */
export function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function normalizeText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

export function generateCode(prefix = "VRT") {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${rand}`;
}

export function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
