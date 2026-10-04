import Link from "next/link";
import { Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-site flex flex-col items-center justify-center py-24 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-champagne text-ink-muted">
        <Search className="h-7 w-7" aria-hidden />
      </span>
      <h1 className="mt-6 font-display text-3xl font-semibold text-ink sm:text-4xl">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-ink-muted">
        The page you were looking for may have moved or no longer exists. Head back
        to explore our properties.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className="btn-secondary">
          Home
        </Link>
        <Link href="/properties" className="btn-primary">
          Browse properties
        </Link>
      </div>
    </div>
  );
}
