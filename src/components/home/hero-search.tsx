"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { NEIGHBORHOODS, PROPERTY_TYPE_LABELS } from "@/lib/constants";
import type { PropertyType, Purpose } from "@/lib/types";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

const BUDGET_OPTIONS = {
  buy: [
    { label: "Any budget", min: "", max: "" },
    { label: "Under R$ 700k", min: "", max: "700000" },
    { label: "R$ 700k – R$ 1.2m", min: "700000", max: "1200000" },
    { label: "R$ 1.2m – R$ 2m", min: "1200000", max: "2000000" },
    { label: "R$ 2m – R$ 3.5m", min: "2000000", max: "3500000" },
    { label: "Over R$ 3.5m", min: "3500000", max: "" },
  ],
  rent: [
    { label: "Any budget", min: "", max: "" },
    { label: "Under R$ 4k/month", min: "", max: "4000" },
    { label: "R$ 4k – R$ 7k/month", min: "4000", max: "7000" },
    { label: "R$ 7k – R$ 12k/month", min: "7000", max: "12000" },
    { label: "Over R$ 12k/month", min: "12000", max: "" },
  ],
};

const selectClass =
  "w-full appearance-none rounded-xl border border-line bg-white px-3.5 py-2.5 pr-9 text-sm text-ink transition-colors focus:border-brass/60 focus:outline-none focus:ring-2 focus:ring-brass/20";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-left">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
        {label}
      </span>
      <div className="relative">
        {children}
        <svg
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </label>
  );
}

export function HeroSearch() {
  const router = useRouter();
  const [purpose, setPurpose] = useState<Purpose>("buy");
  const [type, setType] = useState<PropertyType | "">("");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("|");
  const [bedrooms, setBedrooms] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("purpose", purpose);
    if (type) params.set("type", type);
    if (location) params.set("location", location);
    if (budget) {
      const [min, max] = budget.split("|");
      if (min) params.set("minPrice", min);
      if (max) params.set("maxPrice", max);
    }
    if (bedrooms) params.set("bedrooms", bedrooms);
    track("property_search", { purpose, type, location, budget, bedrooms });
    router.push(`/properties?${params.toString()}`);
  };

  return (
    <form
      onSubmit={submit}
      className="w-full rounded-2xl border border-white/70 bg-ivory/95 p-4 shadow-lift backdrop-blur-xl sm:p-6"
    >
      <div className="mb-5 flex flex-col gap-3 border-b border-line pb-5 text-left sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brass-dark">THE VERTICE COLLECTION</p>
          <p className="mt-1 font-display text-xl font-semibold text-ink">Search for your next home</p>
        </div>
      <div className="inline-flex self-start rounded-full border border-line bg-champagne/60 p-1" role="tablist" aria-label="Listing purpose">
        {(["buy", "rent"] as Purpose[]).map((p) => (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={purpose === p}
            onClick={() => { setPurpose(p); setBudget("|"); }}
            className={cn(
              "rounded-full px-5 py-2 text-sm font-semibold transition-all",
              purpose === p ? "bg-ink text-ivory shadow-sm" : "text-ink-soft hover:text-ink"
            )}
          >
            {p === "buy" ? "Buy" : "Rent"}
          </button>
        ))}
      </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Field label="PROPERTY TYPE">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as PropertyType | "")}
            className={selectClass}
            aria-label="Property type"
          >
            <option value="">Any type</option>
            {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="NEIGHBORHOOD">
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={selectClass}
            aria-label="Neighborhood"
          >
            <option value="">Any area</option>
            {NEIGHBORHOODS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </Field>

        <Field label="BUDGET">
          <select
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className={selectClass}
            aria-label="Budget range"
          >
            {BUDGET_OPTIONS[purpose].map((b) => (
              <option key={b.label} value={`${b.min}|${b.max}`}>
                {b.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="BEDROOMS">
          <select
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
            className={selectClass}
            aria-label="Bedrooms"
          >
            <option value="">Any bedrooms</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
          </select>
        </Field>

        <div className="flex items-end">
          <button type="submit" className="btn-brass w-full !py-2.5">
            <Search className="h-4 w-4" aria-hidden />
            Search properties
          </button>
        </div>
      </div>
    </form>
  );
}
