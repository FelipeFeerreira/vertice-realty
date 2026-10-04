"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-site flex flex-col items-center justify-center py-24 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-hot/10 text-hot">
        <AlertTriangle className="h-7 w-7" aria-hidden />
      </span>
      <h1 className="mt-6 font-display text-3xl font-semibold text-ink sm:text-4xl">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-md text-ink-muted">
        We hit an unexpected error. Try reloading the page or return to the home page.
      </p>
      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="btn-secondary inline-flex items-center gap-2"
        >
          <RefreshCcw className="h-4 w-4" aria-hidden />
          Try again
        </button>
        <Link href="/" className="btn-primary">
          Home
        </Link>
      </div>
    </div>
  );
}
