import Link from "next/link";
import { Bath, BedDouble, Car, MapPin, Ruler } from "lucide-react";
import { PropertyImage } from "@/components/shared/property-image";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { PROPERTY_TYPE_LABELS } from "@/lib/constants";
import type { Purpose, PropertyType } from "@/lib/types";
import { formatPrice, safeJsonParse } from "@/lib/utils";

export interface PropertyCardData {
  id: string;
  slug: string;
  title: string;
  neighborhood: string;
  price: number;
  previousPrice: number | null;
  purpose: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  area: number;
  images: string;
  featured: boolean;
}

export function PropertyCard({ property }: { property: PropertyCardData }) {
  const images = safeJsonParse<string[]>(property.images, []);
  const purpose = property.purpose as Purpose;

  return (
    <article
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift focus-visible:ring-2 focus-visible:ring-brass/60"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-champagne">
        <Link href={`/properties/${property.slug}`} className="absolute inset-0 block" aria-label={`View ${property.title}`}>
          <PropertyImage
            src={images[0] ?? ""}
            alt={property.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="transition-transform duration-500 group-hover:scale-[1.04]"
          />
          <div className="absolute left-3 top-3 flex gap-1.5">
            <span className="rounded-full bg-ink/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-ivory backdrop-blur">
              {purpose === "buy" ? "For sale" : "For rent"}
            </span>
            {property.featured && (
              <span className="rounded-full bg-brass px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">Featured</span>
            )}
          </div>
        </Link>
        <FavoriteButton
          propertyId={property.id}
          propertyTitle={property.title}
          className="absolute right-3 top-3 z-10"
        />
      </div>

      <Link href={`/properties/${property.slug}`} className="flex flex-1 flex-col p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brass/60">
        <div className="flex items-baseline gap-2">
          <p className="font-display text-xl font-semibold text-ink">
            {formatPrice(property.price, purpose)}
          </p>
          {property.previousPrice && (
            <p className="text-sm text-ink-muted line-through">
              {formatPrice(property.previousPrice, purpose)}
            </p>
          )}
        </div>

        <h3 className="mt-1.5 line-clamp-1 text-[15px] font-semibold text-ink group-hover:text-brass-dark">
          {property.title}
        </h3>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {property.neighborhood}, São Paulo
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line pt-4 text-[13px] text-ink-soft">
          <span className="inline-flex items-center gap-1.5">
            <BedDouble className="h-4 w-4 text-brass" aria-hidden />
            {property.bedrooms} {property.bedrooms === 1 ? "bed" : "beds"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Bath className="h-4 w-4 text-brass" aria-hidden />
            {property.bathrooms} {property.bathrooms === 1 ? "bath" : "baths"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Ruler className="h-4 w-4 text-brass" aria-hidden />
            {property.area} m²
          </span>
          {property.parking > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Car className="h-4 w-4 text-brass" aria-hidden />
              {property.parking} {property.parking === 1 ? "space" : "spaces"}
            </span>
          )}
        </div>

        <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted">
          {PROPERTY_TYPE_LABELS[property.type as PropertyType]}
        </p>
      </Link>
    </article>
  );
}
