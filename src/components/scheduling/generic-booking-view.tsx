"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { BookingForm } from "@/components/scheduling/booking-form";
import { PropertyImage } from "@/components/shared/property-image";
import { formatPrice } from "@/lib/utils";
import type { Purpose } from "@/lib/types";

interface PropertyOption {
  id: string;
  slug: string;
  title: string;
  price: number;
  purpose: string;
  neighborhood: string;
  address: string;
  images: string[];
  agent: { name: string; phone: string };
}

interface GenericScheduleProps {
  properties: PropertyOption[];
  lead: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  } | null;
  initialDates: { iso: string; label: string; weekday: string }[];
}

export function GenericBookingView({ properties, lead, initialDates }: GenericScheduleProps) {
  const [selected, setSelected] = useState<PropertyOption | null>(properties[0] ?? null);

  if (!selected) {
    return (
      <div className="rounded-3xl border border-dashed border-line bg-white px-6 py-16 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-ink-muted" aria-hidden />
        <h2 className="mt-4 font-display text-xl font-semibold text-ink">No properties available to schedule</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Choose a property from our collection and select “Request a viewing.”
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {properties.length > 1 && (
        <fieldset className="rounded-2xl border border-line bg-white p-5">
          <legend className="mb-3 text-sm font-semibold text-ink">Which property would you like to view?</legend>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((p) => (
              <label
                key={p.id}
                className={`cursor-pointer overflow-hidden rounded-xl border transition-all focus-within:ring-2 focus-within:ring-brass focus-within:ring-offset-2 ${
                  selected.id === p.id ? "border-brass bg-champagne/60" : "border-line bg-white hover:border-brass/40"
                }`}
              >
                <input
                  type="radio"
                  name="selected-property"
                  value={p.id}
                  checked={selected.id === p.id}
                  onChange={() => setSelected(p)}
                  className="sr-only"
                />
                <div className="relative h-28 bg-champagne">
                  <PropertyImage src={p.images[0] ?? ""} alt={p.title} fill sizes="200px" />
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-ink line-clamp-1">{p.title}</p>
                  <p className="text-xs text-brass-dark">{formatPrice(p.price, p.purpose as Purpose)}</p>
                  <p className="text-xs text-ink-muted">{p.neighborhood}</p>
                </div>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <BookingForm key={selected.id} property={selected} lead={lead} agent={selected.agent} initialDates={initialDates} />
    </div>
  );
}
