"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface PropertyImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  priority?: boolean;
}

/** next/image with a graceful fallback when the remote photo fails. */
export function PropertyImage({
  src,
  alt,
  fill,
  width,
  height,
  sizes,
  className,
  priority,
}: PropertyImageProps) {
  const [failedSource, setFailedSource] = useState<string | null>(null);

  if (!src || failedSource === src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "flex h-full w-full items-center justify-center bg-champagne text-ink-muted",
          className
        )}
      >
        <ImageOff className="h-8 w-8" aria-hidden />
      </div>
    );
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes ?? "100vw"}
        className={cn("object-cover", className)}
        onError={() => setFailedSource(src)}
        priority={priority}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 1200}
      height={height ?? 900}
      sizes={sizes}
      className={cn("object-cover", className)}
      onError={() => setFailedSource(src)}
      priority={priority}
    />
  );
}
