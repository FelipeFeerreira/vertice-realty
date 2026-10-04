"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { PropertyImage } from "@/components/shared/property-image";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
import { cn } from "@/lib/utils";

export function PropertyGallery({
  images,
  title,
  propertyId,
  badges,
}: {
  images: string[];
  title: string;
  propertyId: string;
  badges: React.ReactNode;
}) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setLightbox(false), []);
  useDialogFocus(dialogRef, lightbox, close);

  const go = useCallback(
    (dir: 1 | -1) => setActive((i) => (i + dir + images.length) % images.length),
    [images.length]
  );

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);

    };
  }, [lightbox, go]);

  return (
    <>
      <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
        {/* Main image */}
        <div className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-champagne sm:aspect-[16/10]">
          <PropertyImage
            src={images[active]}
                 alt={`${title} — photo ${active + 1}`}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 66vw"
            className="transition-transform duration-700 group-hover:scale-[1.02]"
          />
          <div className="absolute left-4 top-4 flex gap-2">{badges}</div>
          <div className="absolute right-4 top-4 flex gap-2">
            <FavoriteButton propertyId={propertyId} propertyTitle={title} />
            <button
              type="button"
              onClick={() => setLightbox(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white/90 text-ink-soft backdrop-blur transition-colors hover:text-ink"
               aria-label="Open image gallery"
            >
              <Expand className="h-4 w-4" aria-hidden />
            </button>
          </div>
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink opacity-100 shadow-card backdrop-blur transition-opacity sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                 aria-label="Previous photo"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink opacity-100 shadow-card backdrop-blur transition-opacity sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                 aria-label="Next photo"
              >
                <ChevronRight className="h-5 w-5" aria-hidden />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails */}
        <div className="grid grid-cols-4 gap-3 lg:grid-cols-1 lg:grid-rows-3">
          {images.slice(0, 4).map((src, i) =>
            i < 3 ? (
              <button
                key={src + i}
                type="button"
                onClick={() => setActive(i)}
                className={cn(
                  "relative aspect-[4/3] overflow-hidden rounded-xl bg-champagne transition-all lg:aspect-auto",
                  active === i ? "ring-2 ring-brass ring-offset-2 ring-offset-ivory" : "opacity-80 hover:opacity-100"
                )}
                 aria-label={`View photo ${i + 1}`}
                aria-pressed={active === i}
              >
                 <PropertyImage src={src} alt={`${title} — thumbnail ${i + 1}`} fill sizes="25vw" />
              </button>
            ) : (
              <button
                key={src + i}
                type="button"
                onClick={() => setLightbox(true)}
                className="relative aspect-[4/3] overflow-hidden rounded-xl bg-ink/80 lg:hidden"
                 aria-label="Open full gallery"
              >
                <PropertyImage src={src} alt="" fill sizes="25vw" className="opacity-50" />
                <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white">
                   +{images.length - 3} photos
                </span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-ink/95 backdrop-blur animate-fade-in"
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
           aria-label={`Photo gallery — ${title}`}
        >
          <div className="flex items-center justify-between px-5 py-4 text-ivory">
            <p className="text-sm text-ivory/70">
               {active + 1} of {images.length} — {title}
            </p>
            <button
              type="button"
              onClick={() => setLightbox(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-ivory transition-colors hover:bg-white/20"
               aria-label="Close gallery"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
          <div className="relative mx-auto w-full max-w-5xl flex-1 px-5 pb-6">
            <div className="relative h-full w-full overflow-hidden rounded-2xl">
              <PropertyImage
                src={images[active]}
                 alt={`${title} — enlarged photo ${active + 1}`}
                fill
                sizes="100vw"
              />
            </div>
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  className="absolute left-8 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-ivory transition-colors hover:bg-white/25"
                   aria-label="Previous photo"
                >
                  <ChevronLeft className="h-6 w-6" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  className="absolute right-8 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-ivory transition-colors hover:bg-white/25"
                   aria-label="Next photo"
                >
                  <ChevronRight className="h-6 w-6" aria-hidden />
                </button>
              </>
            )}
          </div>
          <div className="scrollbar-thin flex gap-2 overflow-x-auto px-5 pb-5">
            {images.map((src, i) => (
              <button
                key={src + i}
                type="button"
                onClick={() => setActive(i)}
                className={cn(
                  "relative h-16 w-24 shrink-0 overflow-hidden rounded-lg transition-all",
                  active === i ? "ring-2 ring-brass" : "opacity-60 hover:opacity-100"
                )}
                 aria-label={`Go to photo ${i + 1}`}
              >
                <PropertyImage src={src} alt="" fill sizes="96px" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
