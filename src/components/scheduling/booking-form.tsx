"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CalendarCheck, CheckCircle2, Clock, Loader2, MapPin, SendHorizonal } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { PropertyImage } from "@/components/shared/property-image";
import { formatDateEN, formatPrice } from "@/lib/utils";
import { track } from "@/lib/analytics";
import type { Purpose } from "@/lib/types";
import type { TimeSlot } from "@/lib/types";

interface Props {
  property: {
    id: string;
    slug: string;
    title: string;
    price: number;
    purpose: string;
    neighborhood: string;
    address: string;
    images: string[];
  };
  lead?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  } | null;
  agent: {
    name: string;
    phone: string;
  };
  initialDates: { iso: string; label: string; weekday: string }[];
}

export function BookingForm({ property, lead, agent, initialDates }: Props) {
  const [date, setDate] = useState(initialDates[0]?.iso ?? "");
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState(false);
  const [time, setTime] = useState("");
  const [form, setForm] = useState({
    name: lead?.name ?? "",
    email: lead?.email ?? "",
    phone: lead?.phone ?? "",
    note: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [confirmation, setConfirmation] = useState<{
    code: string;
    date: string;
    time: string;
    property: { title: string; neighborhood: string; address: string };
    agent: { name: string; phone: string };
  } | null>(null);
  const { toast } = useToast();
  const slotsRequest = useRef<AbortController | null>(null);

  const fetchSlots = useCallback(async (iso: string) => {
    if (!iso) return;
    slotsRequest.current?.abort();
    const controller = new AbortController();
    slotsRequest.current = controller;
    setTime("");
    setSlots([]);
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/appointments/slots?date=${iso}&propertySlug=${encodeURIComponent(property.slug)}`, { signal: controller.signal });
      const data = (await res.json()) as { slots: TimeSlot[] };
      if (controller.signal.aborted) return;
      if (!res.ok) throw new Error("Unable to load viewing times");
      setSlots(data.slots ?? []);
      setSlotsError(false);
      setTime("");
    } catch {
      if (controller.signal.aborted) return;
      setSlots([]);
      setSlotsError(true);
    } finally {
      if (!controller.signal.aborted) setLoadingSlots(false);
    }
  }, [property.slug]);

  useEffect(() => {
    if (date) fetchSlots(date);
    return () => slotsRequest.current?.abort();
  }, [date, fetchSlots]);

  const validate = () => {
    const err: Record<string, string> = {};
    if (!date) err.date = "Choose a date";
    if (!time) err.time = "Choose a time";
    else if (loadingSlots || slotsError || !slots.some((slot) => slot.time === time && slot.available)) err.time = "Choose an available time";
    if (form.name.trim().length < 2) err.name = "Enter your name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) err.email = "Enter a valid email address";
    if (!form.phone || form.phone.replace(/\D/g, "").length < 10)
      err.phone = "Enter a valid WhatsApp number, including area code";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertySlug: property.slug,
          leadId: lead?.id,
          date,
          time,
          name: form.name,
          email: form.email,
          phone: form.phone,
          note: form.note,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        appointment?: {
          code: string;
          date: string;
          time: string;
          property: { title: string; neighborhood: string; address: string };
          agent: { name: string; phone: string };
        };
      };
      if (!res.ok) {
        if (res.status === 409) await fetchSlots(date);
        throw new Error(data.error ?? "Unable to request a viewing");
      }
      setStatus("done");
      setConfirmation(data.appointment!);
      track("visit_requested", { propertySlug: property.slug, date, time });
      toast({
        title: "Viewing requested",
        description: "The details have been sent to your email.",
        variant: "success",
      });
    } catch (err) {
      setStatus("idle");
      toast({
        title: "We couldn't book your viewing",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "error",
      });
    }
  };

  const availableSlots = useMemo(() => slots.filter((s) => s.available), [slots]);

  if (confirmation) {
    return (
      <div className="rounded-3xl border border-success/30 bg-success/5 px-6 py-12 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success mx-auto">
          <CheckCircle2 className="h-8 w-8" aria-hidden />
        </span>
        <h2 className="mt-5 font-display text-2xl font-semibold text-ink">
          Your viewing is confirmed
        </h2>
        <p className="mt-2 text-sm text-ink-muted">
          Confirmation code:
        </p>
        <p className="mt-1 font-mono text-xl font-semibold tracking-wider text-brass-dark">
          {confirmation.code}
        </p>
        <dl className="mt-6 grid gap-3 text-left text-sm sm:grid-cols-2">
          <div className="rounded-xl border border-line bg-white p-4">
            <dt className="text-ink-muted">Property</dt>
            <dd className="mt-1 font-medium text-ink">{confirmation.property.title}</dd>
            <dd className="text-ink-muted">{confirmation.property.neighborhood}</dd>
          </div>
          <div className="rounded-xl border border-line bg-white p-4">
            <dt className="text-ink-muted">Date and time</dt>
            <dd className="mt-1 font-medium text-ink">{formatDateEN(confirmation.date)}</dd>
            <dd className="text-ink-muted">{confirmation.time}</dd>
          </div>
          <div className="rounded-xl border border-line bg-white p-4">
            <dt className="text-ink-muted">Your agent</dt>
            <dd className="mt-1 font-medium text-ink">{confirmation.agent.name}</dd>
            <dd className="text-ink-muted">{confirmation.agent.phone}</dd>
          </div>
          <div className="rounded-xl border border-line bg-white p-4">
            <dt className="text-ink-muted">What happens next</dt>
            <dd className="mt-1 text-ink-soft">
              Your request is saved. In this portfolio demo, email and calendar delivery are simulated unless integrations are configured.
            </dd>
          </div>
        </dl>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href={`/properties/${property.slug}`} className="btn-secondary !py-3">
            Back to property
          </Link>
          <Link href="/properties" className="btn-primary !py-3">
            Explore more properties
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-5">
        {/* Date */}
        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-ink">Choose a date</legend>
          <div className="flex flex-wrap gap-2">
            {initialDates.map((d) => (
              <label
                key={d.iso}
                className={`relative cursor-pointer focus-within:ring-2 focus-within:ring-brass focus-within:ring-offset-2 rounded-xl border px-4 py-3 text-center transition-all ${
                  date === d.iso
                    ? "border-brass bg-champagne/60 text-ink"
                    : "border-line bg-white text-ink-soft hover:border-brass/40"
                }`}
              >
                <input
                  type="radio"
                  name="visit-date"
                  value={d.iso}
                  checked={date === d.iso}
                  onChange={(e) => setDate(e.target.value)}
                  className="sr-only"
                />
                <span className="block text-[11px] font-semibold uppercase tracking-wide">
                  {d.weekday}
                </span>
                <span className="mt-0.5 block text-lg font-semibold">{d.label}</span>
              </label>
            ))}
          </div>
          {errors.date && <p className="mt-2 text-xs text-hot">{errors.date}</p>}
        </fieldset>

        {/* Time slots */}
        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-ink">
            Available times
            {loadingSlots && <Loader2 className="ml-2 inline h-3.5 w-3.5 animate-spin" aria-hidden />}
          </legend>
          {loadingSlots ? (
            <p className="text-sm text-ink-muted">Loading available times...</p>
          ) : availableSlots.length === 0 ? (
            <p className="rounded-xl border border-line bg-white p-4 text-sm text-ink-muted">
              {slotsError ? "We couldn't load times. Please choose another date or try again." : "No times are available on this date. Please choose another."}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableSlots.map((s) => (
                <label
                  key={s.time}
                  className={`cursor-pointer focus-within:ring-2 focus-within:ring-brass focus-within:ring-offset-2 rounded-full border px-4 py-2 text-sm transition-all ${
                    time === s.time
                      ? "border-brass bg-brass text-white"
                      : "border-line bg-white text-ink-soft hover:border-brass/50 hover:text-ink"
                  }`}
                >
                  <input
                    type="radio"
                    name="visit-time"
                    value={s.time}
                    checked={time === s.time}
                    onChange={(e) => setTime(e.target.value)}
                    className="sr-only"
                  />
                  {s.time}
                </label>
              ))}
            </div>
          )}
          {errors.time && <p className="mt-2 text-xs text-hot">{errors.time}</p>}
        </fieldset>

        {/* Personal info */}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink-soft">Full name</span>
            <input
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="input-field"
              placeholder="Your name"
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name && <p className="mt-1 text-xs text-hot">{errors.name}</p>}
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink-soft">Email</span>
            <input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="input-field"
              placeholder="you@example.com"
              aria-invalid={Boolean(errors.email)}
            />
            {errors.email && <p className="mt-1 text-xs text-hot">{errors.email}</p>}
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold text-ink-soft">WhatsApp number</span>
            <input
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="input-field"
              placeholder="+55 11 98765-4321"
              aria-invalid={Boolean(errors.phone)}
            />
            {errors.phone && <p className="mt-1 text-xs text-hot">{errors.phone}</p>}
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold text-ink-soft">
              Note <span className="font-normal text-ink-muted">(optional)</span>
            </span>
            <textarea
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              className="input-field resize-none"
              rows={3}
              placeholder="For example, I'll be driving and prefer a morning viewing"
            />
          </label>
        </div>
      </div>

      {/* Summary sidebar */}
      <aside className="h-fit space-y-5">
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="relative aspect-video bg-champagne">
            <PropertyImage src={property.images[0] ?? ""} alt={property.title} fill sizes="340px" />
          </div>
          <div className="p-5">
            <p className="text-sm text-ink-muted">{formatPrice(property.price, property.purpose as Purpose)}</p>
            <h3 className="mt-1 font-display text-lg font-semibold text-ink">{property.title}</h3>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted">
              <MapPin className="h-3.5 w-3.5 text-brass" aria-hidden />
              {property.address}
            </p>
            <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
              <p className="flex items-center gap-2 text-ink-soft">
                <CalendarCheck className="h-4 w-4 text-brass" aria-hidden />
                {date ? formatDateEN(date) : "Choose a date"}
              </p>
              <p className="flex items-center gap-2 text-ink-soft">
                <Clock className="h-4 w-4 text-brass" aria-hidden />
                {time || "Choose a time"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">
            Your agent
          </p>
          <p className="mt-1 font-semibold text-ink">{agent.name}</p>
          <p className="text-sm text-ink-muted">{agent.phone}</p>
        </div>

        <button
          type="submit"
          disabled={status === "submitting"}
          className="btn-brass w-full !py-3"
        >
          {status === "submitting" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <SendHorizonal className="h-4 w-4" aria-hidden />
          )}
          {status === "submitting" ? "Confirming..." : "Request this viewing"}
        </button>
      </aside>
    </form>
  );
}
