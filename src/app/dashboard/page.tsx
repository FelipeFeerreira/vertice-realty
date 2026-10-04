import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarCheck,
  Clock,
  Flame,
  Mail,
  MessageCircle,
  Phone,
  Sprout,
  Thermometer,
  User,
} from "lucide-react";
import { db } from "@/lib/db";
import { LeadActions, AppointmentActions, RefreshDashboard } from "@/components/dashboard/lead-actions";
import { BRAND, TIMELINE_LABELS, FINANCING_LABELS } from "@/lib/constants";
import { ClassificationBadge } from "@/components/ui/classification-badge";
import { formatDateTimeEN, formatPrice, safeJsonParse } from "@/lib/utils";
import type { Classification, Intent, PropertyType, Purpose } from "@/lib/types";
import { recommendedAction } from "@/lib/scoring/lead-score";
import { PropertyImage } from "@/components/shared/property-image";

export const metadata: Metadata = {
  title: "Agent Dashboard",
  robots: { index: false, follow: false },
  description: "Demo dashboard for qualified leads, scheduled viewings, and automation activity.",
};

const TABS = [
  { key: "all", label: "All leads" },
  { key: "hot", label: "Hot" },
  { key: "warm", label: "Warm" },
  { key: "nurture", label: "Nurture" },
  { key: "scheduled", label: "Viewings scheduled" },
] as const;

interface DashboardPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function classColor(c: Classification) {
  if (c === "HOT") return "text-hot";
  if (c === "WARM") return "text-warm";
  if (c === "NURTURE") return "text-nurture";
  return "text-ink-muted";
}

function intentLabel(intent: string | null) {
  if (!intent) return "—";
  return { buy: "Buy", rent: "Rent", sell: "Sell", explore: "Explore" }[intent as Intent] ?? intent;
}

function propertyTypeLabel(t: string | null) {
  if (!t || t === "any") return "—";
  return (
    { apartment: "Apartment", house: "House", penthouse: "Penthouse", studio: "Studio", townhouse: "Townhouse" }[
      t as PropertyType
    ] ?? t
  );
}

function budgetLabel(min: number | null, max: number | null, intent?: string | null) {
  const suffix = intent === "rent" ? "/month" : "";
  if (min == null && max == null) return "—";
  if (min != null && max != null) return `${formatPrice(min)} – ${formatPrice(max)}${suffix}`;
  if (min != null) return `from ${formatPrice(min)}${suffix}`;
  return `up to ${formatPrice(max!)}${suffix}`;
}

function timelineLabel(timeline: string | null) {
  if (!timeline) return "—";
  return (TIMELINE_LABELS as Record<string, string>)[timeline] ?? timeline.replace(/-/g, " ");
}

function statusLabel(status: string) {
  return ({ NEW: "New", CONTACTED: "Contacted", SCHEDULED: "Scheduled", NURTURE: "Nurture" } as Record<string, string>)[status] ?? status;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const sp = await searchParams;
  const tab = typeof sp.tab === "string" ? sp.tab : "all";
  const leadId = typeof sp.lead === "string" ? sp.lead : null;

  const [leads, appointments, events] = await Promise.all([
    db.lead.findMany({ orderBy: { createdAt: "desc" }, include: { property: true } }),
    db.appointment.findMany({ include: { property: true, agent: true } }),
    db.automationEvent.findMany({ orderBy: { createdAt: "desc" }, take: 25 }),
  ]);

  const totalLeads = leads.length;
  const hot = leads.filter((l) => l.classification === "HOT").length;
  const warm = leads.filter((l) => l.classification === "WARM").length;
  const nurture = leads.filter((l) => l.classification === "NURTURE").length;
  const activeAppointments = appointments.filter(a => ["PENDING", "CONFIRMED"].includes(a.status));
  const scheduled = activeAppointments.length;
  const convertedLeads = new Set(appointments.filter(a => a.status !== "CANCELLED").map(a => a.leadId)).size;
  const conversionRate = totalLeads ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  const filtered = leads.filter((l) => {
    if (tab === "hot") return l.classification === "HOT";
    if (tab === "warm") return l.classification === "WARM";
    if (tab === "nurture") return l.classification === "NURTURE";
    if (tab === "scheduled") return l.status === "SCHEDULED" || activeAppointments.some((a) => a.leadId === l.id);
    return true;
  });

  const selectedLead = leadId ? leads.find((l) => l.id === leadId) ?? null : null;
  const selectedAppointments = selectedLead
    ? appointments.filter((a) => a.leadId === selectedLead.id)
    : [];
  const selectedEvents = selectedLead
    ? await db.automationEvent.findMany({ where: { leadId: selectedLead.id }, orderBy: { createdAt: "desc" }, take: 100 })
    : [];
  const matchedProperties = selectedLead?.matchedIds
    ? await db.property.findMany({ where: { id: { in: safeJsonParse<string[]>(selectedLead.matchedIds, []) } } })
    : [];

  return (
    <div className="container-site py-8 sm:py-10">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">AGENT WORKSPACE</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">
            Lead dashboard
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            Track leads qualified by {BRAND.assistantName}, scheduled viewings, and recent automation activity.
          </p>
        </div>
        <p className="text-xs text-ink-muted">
          Portfolio demonstration dashboard
        </p>
        <RefreshDashboard />
      </div>

      {/* Metrics */}
      <section aria-label="Overview metrics" className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Total leads", value: totalLeads, icon: User },
          { label: "Qualified", value: hot + warm, icon: Thermometer, tone: "text-warm" },
          { label: "Hot", value: hot, icon: Flame, tone: "text-hot" },
          { label: "Viewings scheduled", value: scheduled, icon: CalendarCheck, tone: "text-pine" },
          { label: "Nurture", value: nurture, icon: Sprout, tone: "text-nurture" },
          { label: "Viewing rate", value: `${conversionRate}%`, icon: Clock, tone: "text-brass-dark" },
        ].map((m) => (
          <div key={m.label} className="rounded-2xl border border-line bg-white p-4">
            <m.icon className={`h-5 w-5 ${m.tone ?? "text-ink-muted"}`} aria-hidden />
            <p className="mt-3 font-display text-2xl font-semibold text-ink">{m.value}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{m.label}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* Lead table */}
        <section className="min-w-0 rounded-2xl border border-line bg-white p-5" aria-labelledby="leads-title">
          <h2 id="leads-title" className="font-display text-xl font-semibold text-ink">
            Recent leads
          </h2>

          <div className="mt-4 flex flex-wrap gap-2">
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <Link
                  key={t.key}
                  href={`/dashboard?tab=${t.key}${leadId ? `&lead=${leadId}` : ""}`}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                    active
                      ? "bg-ink text-ivory"
                      : "border border-line bg-white text-ink-soft hover:border-brass/50 hover:text-ink"
                  }`}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-muted">
                  <th className="pb-3 font-semibold">Name</th>
                  <th className="pb-3 font-semibold">Intent</th>
                  <th className="pb-3 font-semibold">Property</th>
                  <th className="pb-3 font-semibold">Budget</th>
                  <th className="pb-3 font-semibold">Timeline</th>
                  <th className="pb-3 font-semibold">Score</th>
                  <th className="pb-3 font-semibold">Class.</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-line transition-colors hover:bg-champagne/40"
                  >
                    <td className="py-3">
                      <Link
                        href={`/dashboard?tab=${tab}&lead=${lead.id}`}
                        className="font-semibold text-ink hover:text-brass-dark"
                      >
                        {lead.name}
                      </Link>
                    </td>
                    <td className="py-3 text-ink-soft">{intentLabel(lead.intent)}</td>
                    <td className="py-3 text-ink-soft">
                      {lead.property ? (
                        <Link href={`/properties/${lead.property.slug}`} className="hover:text-brass-dark hover:underline">
                          {lead.property.title.slice(0, 30)}
                          {lead.property.title.length > 30 ? "…" : ""}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                      <td className="py-3 text-ink-soft">{budgetLabel(lead.budgetMin, lead.budgetMax, lead.intent)}</td>
                      <td className="py-3 text-ink-soft">{timelineLabel(lead.timeline)}</td>
                    <td className="py-3">
                      <span className={`font-semibold ${classColor(lead.classification as Classification)}`}>
                        {lead.score}
                      </span>
                    </td>
                    <td className="py-3">
                      <ClassificationBadge classification={lead.classification as Classification} />
                    </td>
                      <td className="py-3 text-ink-soft">{statusLabel(lead.status)}</td>
                      <td className="py-3 text-ink-soft">{formatDateTimeEN(lead.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="py-10 text-center text-sm text-ink-muted">
                No leads in this category.
              </p>
            )}
          </div>
        </section>

        {/* Detail panel */}
        <aside className="min-w-0 space-y-5">
          {selectedLead ? (
            <>
              <div className="rounded-2xl border border-line bg-white p-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl font-semibold text-ink">Lead details</h2>
                  <ClassificationBadge classification={selectedLead.classification as Classification} />
                </div>

                <div className="mt-4 space-y-3 text-sm">
                  <p className="flex items-center gap-2 text-ink-soft">
                    <User className="h-4 w-4 text-brass" aria-hidden />
                      <span className="font-medium text-ink">{selectedLead.name}</span>
                  </p>
                  {selectedLead.email && (
                    <p className="flex items-center gap-2 text-ink-soft">
                      <Mail className="h-4 w-4 text-brass" aria-hidden />
                      <a href={`mailto:${selectedLead.email}`} className="break-all hover:text-brass-dark">
                        {selectedLead.email}
                      </a>
                    </p>
                  )}
                  {selectedLead.phone && (
                    <p className="flex items-center gap-2 text-ink-soft">
                      <Phone className="h-4 w-4 text-brass" aria-hidden />
                      <a href={`tel:${selectedLead.phone.replace(/\D/g, "")}`} className="hover:text-brass-dark">
                        {selectedLead.phone}
                      </a>
                    </p>
                  )}
                  {selectedLead.preferredLocation && (
                    <p className="flex items-center gap-2 text-ink-soft">
                      <span className="flex h-4 w-4 items-center justify-center text-brass">📍</span>
                      {selectedLead.preferredLocation}
                    </p>
                  )}
                </div>

                {selectedLead.aiSummary && (
                  <div className="mt-5 rounded-xl bg-champagne/50 p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-brass-dark">
                      AI summary
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                      {selectedLead.aiSummary}
                    </p>
                  </div>
                )}

                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-line p-3">
                    <p className="text-[11px] uppercase tracking-wide text-ink-muted">Intent</p>
                    <p className="font-medium text-ink">{intentLabel(selectedLead.intent)}</p>
                  </div>
                  <div className="rounded-xl border border-line p-3">
                    <p className="text-[11px] uppercase tracking-wide text-ink-muted">Property type</p>
                    <p className="font-medium text-ink">{propertyTypeLabel(selectedLead.propertyType)}</p>
                  </div>
                  <div className="rounded-xl border border-line p-3">
                    <p className="text-[11px] uppercase tracking-wide text-ink-muted">Bedrooms</p>
                    <p className="font-medium text-ink">{selectedLead.bedrooms ?? "—"}</p>
                  </div>
                  <div className="rounded-xl border border-line p-3">
                    <p className="text-[11px] uppercase tracking-wide text-ink-muted">Budget</p>
                    <p className="font-medium text-ink">{budgetLabel(selectedLead.budgetMin, selectedLead.budgetMax, selectedLead.intent)}</p>
                  </div>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div><dt className="text-xs text-ink-muted">Timeline</dt><dd>{timelineLabel(selectedLead.timeline)}</dd></div>
                  <div><dt className="text-xs text-ink-muted">Financing</dt><dd>{selectedLead.financingStatus ? (FINANCING_LABELS as Record<string, string>)[selectedLead.financingStatus] ?? selectedLead.financingStatus : "Not applicable"}</dd></div>
                  <div><dt className="text-xs text-ink-muted">Email updates</dt><dd>{selectedLead.marketingConsent ? "Opted in" : "Not subscribed"}</dd></div>
                  <div><dt className="text-xs text-ink-muted">Lead score</dt><dd className="font-semibold">{selectedLead.score}/100</dd></div>
                </dl>
                <LeadActions key={selectedLead.id + selectedLead.updatedAt.toISOString()} id={selectedLead.id} status={selectedLead.status} notes={selectedLead.notes} />
                {selectedLead.scoreReasons && (
                  <div className="mt-5">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-ink-muted">
                      How the score was calculated
                    </h3>
                    <ul className="mt-2 space-y-1.5 text-sm text-ink-soft">
                      {safeJsonParse<string[]>(selectedLead.scoreReasons, []).map((r, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brass" aria-hidden />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-5 rounded-xl border border-hot/20 bg-hot/5 p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-hot">Recommended next action</h3>
                  <p className="mt-1 text-sm text-ink-soft">
                    {recommendedAction(
                      selectedLead.classification as Classification,
                      selectedAppointments.some(a => ["PENDING", "CONFIRMED"].includes(a.status))
                    )}
                  </p>
                </div>
              </div>

              {/* Property of interest / matches */}
              <div className="rounded-2xl border border-line bg-white p-5">
                <h3 className="font-display text-lg font-semibold text-ink">Related properties</h3>
                {selectedLead.property ? (
                  <div className="mt-3 flex gap-3">
                    <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-champagne">
                      <PropertyImage
                        src={safeJsonParse<string[]>(selectedLead.property.images, [])[0] ?? ""}
                        alt={selectedLead.property.title}
                        fill
                        sizes="80px"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink">{selectedLead.property.title}</p>
                      <p className="text-xs text-ink-muted">{selectedLead.property.neighborhood}</p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-ink-muted">No property of interest recorded.</p>
                )}

                {matchedProperties.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Recommended by Maya
                    </p>
                    <div className="mt-2 space-y-2">
                      {matchedProperties.map((p) => (
                        <Link
                          key={p.id}
                          href={`/properties/${p.slug}`}
                          className="flex items-center justify-between rounded-xl border border-line p-3 text-sm transition-colors hover:bg-champagne/50"
                        >
                          <span className="font-medium text-ink">{p.title}</span>
                          <span className="text-brass-dark">{formatPrice(p.price, p.purpose as Purpose)}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Appointments */}
              {selectedAppointments.length > 0 && (
                <div className="rounded-2xl border border-line bg-white p-5">
                  <h3 className="font-display text-lg font-semibold text-ink">Scheduled viewings</h3>
                  <div className="mt-3 space-y-3">
                    {selectedAppointments.map((a) => (
                      <div key={a.id} className="rounded-xl border border-line p-3 text-sm">
                        <p className="font-semibold text-ink">{a.property.title}</p>
                        <p className="mt-1 text-ink-soft">
                          {a.date} at {a.time}
                        </p>
                        <p className="text-ink-muted">Agent: {a.agent.name}</p>
                        <p className="text-[11px] text-ink-muted">Confirmation: {a.code}</p>
                        <AppointmentActions id={a.id} status={a.status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Automation event log */}
              <div className="rounded-2xl border border-line bg-white p-5">
                <h3 className="font-display text-lg font-semibold text-ink">Automation history</h3>
                {selectedEvents.length > 0 ? (
                  <ul className="mt-4 space-y-3">
                    {selectedEvents.map((e) => (
                      <li key={e.id} className="flex gap-3 text-sm">
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brass" aria-hidden />
                        <div>
                          <p className="font-medium text-ink">{e.label}</p>
                          {e.detail && <p className="text-xs text-ink-muted">{e.detail}</p>}
                          <p className="text-[11px] text-ink-muted">{formatDateTimeEN(e.createdAt)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-ink-muted">No automation events recorded for this lead.</p>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-line bg-white p-8 text-center">
              <MessageCircle className="mx-auto h-10 w-10 text-ink-muted" aria-hidden />
              <p className="mt-4 font-display text-lg font-semibold text-ink">Select a lead</p>
              <p className="mt-1 text-sm text-ink-muted">
                Select a lead in the table to review their details, score, recommended
                properties, and automation history.
              </p>
            </div>
          )}

          {/* Global recent activity */}
          <div className="rounded-2xl border border-line bg-white p-5">
            <h3 className="font-display text-lg font-semibold text-ink">Recent activity</h3>
            <ul className="mt-4 space-y-3">
              {events.slice(0, 6).map((e) => (
                <li key={e.id} className="flex gap-3 text-sm">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-nurture" aria-hidden />
                  <div>
                    <p className="font-medium text-ink">{e.label}</p>
                    {e.detail && <p className="text-xs text-ink-muted">{e.detail}</p>}
                    <p className="text-[11px] text-ink-muted">{formatDateTimeEN(e.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
