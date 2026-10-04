import { PropertyCardSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container-site py-10 sm:py-14">
      <div className="mb-8 h-8 w-48 animate-pulse rounded-xl bg-champagne" />
      <div className="mb-6 h-32 animate-pulse rounded-2xl bg-champagne" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <PropertyCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
