"use client";

import { useMemo } from "react";
import { Heart } from "lucide-react";
import Link from "next/link";
import { useFavorites } from "@/hooks/use-favorites";
import { PropertyCard } from "@/components/properties/property-card";
import type { PropertyCardData } from "@/components/properties/property-card";

export function FavoritesGrid({ properties }: { properties: PropertyCardData[] }) {
  const { favorites, hydrated } = useFavorites();
  const favoriteProperties = useMemo(
    () => properties.filter((p) => favorites.includes(p.id)),
    [properties, favorites]
  );

  if (!hydrated) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {properties.slice(0, 3).map((p) => (
          <div key={p.id} className="h-80 animate-pulse rounded-2xl bg-champagne" />
        ))}
      </div>
    );
  }

  if (favoriteProperties.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-3xl border border-dashed border-line bg-white px-6 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-champagne text-ink-muted">
          <Heart className="h-6 w-6" aria-hidden />
        </span>
        <h2 className="mt-5 font-display text-2xl font-semibold text-ink">No saved properties yet</h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
          Tap the heart on any property card to save it here and compare your options later.
        </p>
        <Link href="/properties" className="btn-primary mt-6">
          Explore properties
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {favoriteProperties.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}
