import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { db } from "@/lib/db";

export const revalidate = 3600;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const properties = await db.property.findMany({ where: { status: "available" }, select: { slug: true } });
  return ["", "/properties", "/about", "/how-it-works", "/contact", ...properties.map(p => `/properties/${p.slug}`)].map(path => ({ url: `${SITE_URL}${path}`, changeFrequency: "weekly", priority: path ? 0.7 : 1 }));
}
