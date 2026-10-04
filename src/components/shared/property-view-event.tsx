"use client";
import { useEffect } from "react";
import { track } from "@/lib/analytics";

export function PropertyViewEvent({ slug }: { slug: string }) {
  useEffect(() => { track("property_viewed", { slug }); }, [slug]);
  return null;
}
