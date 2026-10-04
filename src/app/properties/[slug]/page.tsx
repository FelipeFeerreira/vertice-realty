import { PropertyViewEvent } from "@/components/shared/property-view-event";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Bath,
  BedDouble,
  Building,
  Calendar,
  CalendarCheck,
  Car,
  Check,
  FileText,
  Landmark,
  MapPin,
  Phone,
  Ruler,
} from "lucide-react";
import { db } from "@/lib/db";
import { PROPERTY_TYPE_LABELS, SITE_URL } from "@/lib/constants";
import { formatPrice, safeJsonParse } from "@/lib/utils";
import { PropertyGallery } from "@/components/properties/property-gallery";
import { PropertyCard } from "@/components/properties/property-card";
import { InterestForm } from "@/components/properties/interest-form";
import { ChatLink } from "@/components/properties/chat-link";
import { PropertyImage } from "@/components/shared/property-image";
import type { PropertyType, Purpose } from "@/lib/types";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const property = await db.property.findUnique({ where: { slug } });
   if (!property) return { title: "Property not found" };
  const images = safeJsonParse<string[]>(property.images, []);
  return {
    title: `${property.title} — ${formatPrice(property.price, property.purpose as Purpose)}`,
    description: property.shortDescription,
    openGraph: {
      title: property.title,
      description: property.shortDescription,
      images: images[0] ? [{ url: images[0] }] : undefined,
    },
    alternates: { canonical: `${SITE_URL}/properties/${property.slug}` },
  };
}

function SpecItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-champagne text-brass-dark">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">{label}</p>
        <p className="text-sm font-semibold text-ink">{value}</p>
      </div>
    </div>
  );
}

export default async function PropertyPage({ params }: PageProps) {
  const { slug } = await params;
  const property = await db.property.findUnique({
    where: { slug },
    include: { agent: true },
  });
  if (!property) notFound();

  const images = safeJsonParse<string[]>(property.images, []);
  const amenities = safeJsonParse<string[]>(property.amenities, []);
  const purpose = property.purpose as Purpose;

  const similar = await db.property.findMany({
    where: {
      status: "available",
      id: { not: property.id },
      OR: [
        { purpose: property.purpose, neighborhood: property.neighborhood },
        { purpose: property.purpose, type: property.type },
      ],
    },
    take: 3,
    orderBy: { featured: "desc" },
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: property.shortDescription,
    url: `${SITE_URL}/properties/${property.slug}`,
    image: images,
    address: {
      "@type": "PostalAddress",
      streetAddress: property.address,
      addressLocality: property.city,
      addressRegion: "SP",
      addressCountry: "BR",
    },
    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: "BRL",
    },
    numberOfRooms: property.bedrooms,
    floorSize: {
      "@type": "QuantitativeValue",
      value: property.area,
      unitCode: "MTK",
    },
  };

  const badges = (
    <>
      <span className="rounded-full bg-ink/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-ivory backdrop-blur">
        {purpose === "buy" ? "For sale" : "For rent"}
      </span>
      {property.featured && (
        <span className="rounded-full bg-brass px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
          Featured
        </span>
      )}
    </>
  );

  return (
    <article className="container-site py-8 sm:py-10">
      <PropertyViewEvent slug={property.slug} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-ink-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:text-brass">Home</Link></li>
          <li aria-hidden>/</li>
          <li><Link href="/properties" className="hover:text-brass">Properties</Link></li>
          <li aria-hidden>/</li>
          <li>
            <Link href={`/properties?location=${encodeURIComponent(property.neighborhood)}`} className="hover:text-brass">
              {property.neighborhood}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="max-w-[240px] truncate text-ink" aria-current="page">{property.title}</li>
        </ol>
      </nav>

      <PropertyGallery
        images={images}
        title={property.title}
        propertyId={property.id}
        badges={badges}
      />

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        {/* ── Main column ─────────────────────────────────────────────── */}
        <div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-3">
                <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl text-balance">
                  {property.title}
                </h1>
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-ink-muted">
                <MapPin className="h-4 w-4 text-brass" aria-hidden />
                {property.address} · {property.city}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-ink-muted">
                Ref. {property.reference} · {PROPERTY_TYPE_LABELS[property.type as PropertyType]}
              </p>
            </div>
          </div>

          {/* Specs */}
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
            <SpecItem icon={BedDouble} label="Bedrooms" value={String(property.bedrooms)} />
            <SpecItem icon={Bath} label="Bathrooms" value={String(property.bathrooms)} />
            <SpecItem icon={Ruler} label="Area" value={`${property.area} m²`} />
            <SpecItem icon={Car} label="Parking" value={property.parking > 0 ? String(property.parking) : "—"} />
            {property.yearBuilt && (
              <SpecItem icon={Building} label="Year built" value={String(property.yearBuilt)} />
            )}
            {property.condoFee != null && (
              <SpecItem icon={FileText} label="HOA fee" value={`${formatPrice(property.condoFee)}/month`} />
            )}
            {property.tax != null && (
              <SpecItem icon={Landmark} label="Property tax" value={`${formatPrice(property.tax)}/month`} />
            )}
          </div>

          {/* Description */}
          <section className="mt-10" aria-labelledby="desc-title">
            <h2 id="desc-title" className="font-display text-2xl font-semibold text-ink">
              About this property
            </h2>
            <p className="mt-4 leading-relaxed text-ink-soft">{property.description}</p>
          </section>

          {/* Amenities */}
          {amenities.length > 0 && (
            <section className="mt-10" aria-labelledby="amenities-title">
              <h2 id="amenities-title" className="font-display text-2xl font-semibold text-ink">
                Features & amenities
              </h2>
              <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {amenities.map((a) => (
                  <li key={a} className="flex items-center gap-2.5 text-sm text-ink-soft">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success/15 text-success">
                      <Check className="h-3 w-3" aria-hidden />
                    </span>
                    {a}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* ── Sidebar ─────────────────────────────────────────────────── */}
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          {/* Price card */}
          <div className="card-surface p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">
              {purpose === "buy" ? "Asking price" : "Monthly rent"}
            </p>
            <div className="mt-1.5 flex items-baseline gap-2.5">
              <p className="font-display text-3xl font-semibold text-ink">
                {formatPrice(property.price, purpose)}
              </p>
              {property.previousPrice && (
                <p className="text-sm text-ink-muted line-through">
                  {formatPrice(property.previousPrice, purpose)}
                </p>
              )}
            </div>
            {purpose === "buy" && (
              <p className="mt-1 text-sm text-ink-muted">
                {formatPrice(Math.round(property.price / property.area))}/m²
              </p>
            )}

            <div className="mt-5 space-y-2.5">
              <Link href={`/schedule/${property.slug}`} className="btn-brass w-full !py-3">
                <CalendarCheck className="h-4 w-4" aria-hidden />
                Request a viewing
              </Link>
              <ChatLink slug={property.slug} />
            </div>

            <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-ink-muted">
              <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              In-person or virtual viewings, Monday through Saturday, with a neighborhood specialist.
            </p>
          </div>

          {/* Agent card */}
          <div className="card-surface p-6">
            <div className="flex items-center gap-4">
              <div className="relative h-14 w-14 overflow-hidden rounded-full bg-champagne">
                <PropertyImage src={property.agent.avatar} alt={`Portrait of ${property.agent.name}`} fill sizes="56px" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">{property.agent.name}</p>
                <p className="text-xs text-ink-muted">{property.agent.role}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ink-muted">{property.agent.bio}</p>
            <a
              href={`tel:${property.agent.phone.replace(/\D/g, "")}`}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-pine hover:text-brass-dark"
            >
              <Phone className="h-4 w-4" aria-hidden />
              {property.agent.phone}
            </a>
          </div>

          {/* Interest form */}
          <div className="card-surface p-6">
            <h2 className="text-base font-semibold text-ink">Interested in this home?</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Leave your details and a specialist will reach out during business hours.
            </p>
            <div className="mt-4">
              <InterestForm propertySlug={property.slug} propertyTitle={property.title} />
            </div>
          </div>
        </aside>
      </div>

      {/* Similar */}
      {similar.length > 0 && (
        <section className="mt-16" aria-labelledby="similar-title">
          <div className="flex items-end justify-between gap-4">
            <h2 id="similar-title" className="font-display text-2xl font-semibold text-ink sm:text-3xl">
              Similar properties
            </h2>
            <Link href="/properties" className="text-sm font-semibold text-brass-dark hover:text-brass">
              View all
            </Link>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
