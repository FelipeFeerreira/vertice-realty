import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { bookableDates } from "@/lib/availability";
import { BookingForm } from "@/components/scheduling/booking-form";
import { safeJsonParse } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Schedule a Viewing",
  description: "Request an in-person viewing with a local Vertice Realty specialist.",
};

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SchedulePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const leadId = typeof sp.lead === "string" ? sp.lead : undefined;

  const property = await db.property.findUnique({
    where: { slug },
    include: { agent: true },
  });
  if (!property) notFound();

  const lead = leadId
    ? await db.lead.findUnique({
        where: { id: leadId },
        select: { id: true, name: true, email: true, phone: true },
      })
    : null;

  const dates = bookableDates();

  return (
    <div className="container-site py-10 sm:py-14">
      <header className="mb-8">
        <p className="eyebrow">VIEWING REQUEST</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl text-balance">
          Schedule a viewing
        </h1>
        <p className="mt-2 max-w-xl text-ink-muted">
          Choose a date and time that work for you. A neighborhood specialist will
          confirm the appointment.
        </p>
      </header>

      <BookingForm
        property={{
          id: property.id,
          slug: property.slug,
          title: property.title,
          price: property.price,
          purpose: property.purpose,
          neighborhood: property.neighborhood,
          address: property.address,
          images: safeJsonParse<string[]>(property.images, []),
        }}
        lead={lead ? { id: lead.id, name: lead.name, email: lead.email ?? "", phone: lead.phone } : null}
        agent={{ name: property.agent.name, phone: property.agent.phone }}
        initialDates={dates}
      />
    </div>
  );
}
