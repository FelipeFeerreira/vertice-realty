import { z } from "zod";
import { db } from "@/lib/db";
import { normalizeText } from "@/lib/utils";

const optionalText = z.preprocess(value => value === "" || value === null ? undefined : value, z.string().trim().max(120).optional());
const optionalNumber = (integer = false) => z.preprocess(
  value => value === "" || value === null || value === undefined ? undefined : Number(value),
  (integer ? z.number().int() : z.number()).finite().nonnegative().max(1_000_000_000).optional()
);
export const propertySearchSchema = z.object({
  q: optionalText,
  location: optionalText,
  purpose: z.enum(["buy", "rent"]).optional(),
  type: z.enum(["apartment", "house", "penthouse", "studio", "townhouse"]).optional(),
  sort: z.enum(["featured", "price-asc", "price-desc", "newest"]).default("featured"),
  minPrice: optionalNumber(),
  maxPrice: optionalNumber(),
  bedrooms: optionalNumber(true),
  bathrooms: optionalNumber(true),
}).refine(values => values.minPrice === undefined || values.maxPrice === undefined || values.minPrice <= values.maxPrice, {
  message: "Minimum price must not exceed maximum price.", path: ["minPrice"],
});

export async function searchProperties(filters: z.infer<typeof propertySearchSchema>) {
  const where: Record<string, unknown> = { status: "available" };
  if (filters.purpose) where.purpose = filters.purpose;
  if (filters.type) where.type = filters.type;
  if (filters.location)
    where.neighborhood = { contains: filters.location };
  if (filters.minPrice != null || filters.maxPrice != null) {
    where.price = {
      ...(filters.minPrice != null ? { gte: filters.minPrice } : {}),
      ...(filters.maxPrice != null ? { lte: filters.maxPrice } : {}),
    };
  }
  if (filters.bedrooms != null) where.bedrooms = { gte: filters.bedrooms };
  if (filters.bathrooms != null) where.bathrooms = { gte: filters.bathrooms };

  const orderBy =
    filters.sort === "price-asc"
      ? { price: "asc" as const }
      : filters.sort === "price-desc"
        ? { price: "desc" as const }
        : filters.sort === "newest"
          ? { createdAt: "desc" as const }
          : [{ featured: "desc" as const }, { createdAt: "desc" as const }];

  let properties = await db.property.findMany({ where, orderBy, include: { agent: true } });

  if (filters.q) {
    const q = normalizeText(filters.q);
    properties = properties.filter((p) =>
      normalizeText(`${p.title} ${p.neighborhood} ${p.address} ${p.shortDescription}`).includes(q)
    );
  }

  return properties;
}
