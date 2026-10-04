import type { Metadata } from "next";
import { db } from "@/lib/db";
import { FavoritesGrid } from "@/components/favorites/favorites-grid";

export const metadata: Metadata = {
  title: "Saved Properties",
  description: "Review and compare your saved homes from Vertice Realty.",
};

export const revalidate = 60;

export default async function FavoritesPage() {
  const properties = await db.property.findMany({
    where: { status: "available" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container-site py-10 sm:py-14">
      <header className="mb-8">
        <p className="eyebrow">YOUR COLLECTION</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">
          Saved properties
        </h1>
        <p className="mt-2 max-w-xl text-ink-muted">
          The homes you've saved to compare. Maya can help you narrow down your options
          whenever you're ready.
        </p>
      </header>
      <FavoritesGrid properties={properties} />
    </div>
  );
}
