import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchX } from "lucide-react";
import Link from "next/link";
import { propertySearchSchema, searchProperties } from "@/lib/properties/search";
import { PropertyCard } from "@/components/properties/property-card";
import { PropertyFilters } from "@/components/properties/property-filters";
import { OpenChatButton } from "@/components/shared/open-chat-button";

export const metadata: Metadata = {
  title: "Homes for Sale and Rent in São Paulo",
  description:
    "Explore apartments, houses, penthouses, studios, and townhouses in São Paulo's most desirable neighborhoods. Filter by area, price, and bedrooms.",
};

export const revalidate = 60;

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function Results({ searchParams }: PageProps) {
  const sp = await searchParams;
  const parsed = propertySearchSchema.safeParse(sp);
  if (!parsed.success) {
    return (
      <section role="alert" className="rounded-2xl border border-line bg-white p-8 text-center">
        <SearchX className="mx-auto h-8 w-8 text-brass" aria-hidden />
        <h2 className="mt-4 font-display text-2xl">Let's adjust your search</h2>
        <p className="mt-3 text-sm text-ink-muted">Use valid prices and whole numbers for bedrooms and bathrooms. The minimum price must be below the maximum.</p>
        <Link href="/properties" className="mt-6 inline-flex rounded-xl bg-ink px-5 py-3 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">Reset filters and explore homes</Link>
      </section>
    );
  }
  const properties = await searchProperties(parsed.data);

  return (
    <>
      <Suspense>
        <PropertyFilters totalCount={properties.length} />
      </Suspense>

      {properties.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-3xl border border-dashed border-line bg-white px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-champagne text-ink-muted">
            <SearchX className="h-6 w-6" aria-hidden />
          </span>
          <h2 className="mt-5 font-display text-2xl font-semibold text-ink">
            No properties match these filters
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
            Try widening your price range or removing a filter. Or tell Maya what you're
            looking for—she can let you know when a matching property becomes available.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <OpenChatButton label="Tell us what you're looking for" />
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </>
  );
}

export default function PropertiesPage(props: PageProps) {
  return (
    <div className="container-site py-8 sm:py-12">
      <header className="mb-8 grid gap-6 rounded-2xl border border-line bg-champagne/50 px-6 py-8 sm:px-9 sm:py-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="eyebrow">THE FULL COLLECTION</p>
          <h1 className="mt-3 max-w-2xl font-display text-3xl font-semibold leading-tight text-ink sm:text-5xl text-balance">
            Homes worth a closer look.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft sm:text-base">
            Carefully reviewed apartments, houses, penthouses, and studios across São Paulo. Use the filters below to find the right fit.
          </p>
        </div>
        <div className="border-t border-line pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">A more personal search</p>
          <p className="mt-2 max-w-[240px] text-sm leading-relaxed text-ink-soft">Tell Maya what matters to you and get a shortlist built around your needs.</p>
          <OpenChatButton label="Ask Maya for a match" className="mt-4 !px-5 !py-2.5" />
        </div>
      </header>

      <Suspense>
        <Results searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
