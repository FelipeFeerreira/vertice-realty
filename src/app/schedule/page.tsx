import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { bookableDates } from "@/lib/availability";
import { safeJsonParse } from "@/lib/utils";
import { GenericBookingView } from "@/components/scheduling/generic-booking-view";

export const metadata: Metadata = {
  title: "Schedule a Viewing",
  description: "Request a property viewing with a local Vertice Realty specialist.",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ScheduleGenericPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const leadId = typeof sp.lead === "string" ? sp.lead : undefined;

  const lead = leadId
    ? await db.lead.findUnique({ where: { id: leadId }, select: { id: true, name: true, email: true, phone: true, matchedIds: true } })
    : null;

  let properties = await db.property.findMany({
    where: { status: "available" },
    include: { agent: true },
    orderBy: { featured: "desc" },
    take: 6,
  });

  if (lead?.matchedIds) {
    const ids = safeJsonParse<string[]>(lead.matchedIds, []);
    if (ids.length > 0) {
      const matched = await db.property.findMany({
        where: { id: { in: ids }, status: "available" },
        include: { agent: true },
      });
      if (matched.length > 0) properties = matched;
    }
  }

  if (properties.length === 0) notFound();

  const dates = bookableDates();

  return (
    <div className="container-site py-10 sm:py-14">
      <header className="mb-8">
        <p className="eyebrow">VIEWING REQUEST</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl text-balance">
          Choose a property and request a viewing
        </h1>
        <p className="mt-2 max-w-xl text-ink-muted">
          Select a property, then choose a date and time. A local specialist will follow up to confirm.
        </p>
      </header>

      <GenericBookingView
        properties={properties.map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          price: p.price,
          purpose: p.purpose,
          neighborhood: p.neighborhood,
          address: p.address,
          images: safeJsonParse<string[]>(p.images, []),
          agent: { name: p.agent.name, phone: p.agent.phone },
        }))}
        lead={lead ? { id: lead.id, name: lead.name, email: lead.email ?? "", phone: lead.phone } : null}
        initialDates={dates}
      />
    </div>
  );
}
