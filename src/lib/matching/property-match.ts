import type { MatchedProperty, PropertyType, Purpose, QualificationState } from "@/lib/types";
import { normalizeText } from "@/lib/utils";

interface PropertyLike {
  id: string;
  slug: string;
  title: string;
  neighborhood: string;
  city: string;
  price: number;
  purpose: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  images: string;
  featured: boolean;
}

/**
 * Scores inventory against a qualified profile. Deterministic — never random.
 * Returns the top matches (best score first), or an empty array when nothing
 * is reasonably compatible.
 */
export function matchProperties(
  properties: PropertyLike[],
  state: Pick<
    QualificationState,
    "intent" | "propertyType" | "location" | "budgetMin" | "budgetMax" | "bedrooms"
  >,
  limit = 4
): MatchedProperty[] {
  // A sale inquiry is about valuing the visitor's home, not recommending inventory.
  if (state.intent === "sell") return [];
  const purpose: Purpose = state.intent === "rent" ? "rent" : "buy";
  const normLocation = state.location ? normalizeText(state.location) : null;

  const scored = properties
    .filter((p) => {
      if (p.purpose !== purpose) return false;
      if (state.propertyType && state.propertyType !== "any" && p.type !== state.propertyType) return false;
      if (normLocation) {
        const hood = normalizeText(p.neighborhood);
        const city = normalizeText(p.city);
        if (!hood.includes(normLocation) && !normLocation.includes(hood) && !city.includes(normLocation)) return false;
      }
      if (state.budgetMax != null && p.price > state.budgetMax) return false;
      if (state.budgetMin != null && p.price < state.budgetMin) return false;
      if (state.bedrooms != null && p.bedrooms < state.bedrooms) return false;
      return true;
    })
    .map((p) => {
      let score = 0;

      // Location: strong signal
      if (normLocation) {
        const hood = normalizeText(p.neighborhood);
        if (hood === normLocation) score += 4;
        else if (hood.includes(normLocation) || normLocation.includes(hood))
          score += 2;
      }

      // Type
      if (state.propertyType && state.propertyType !== "any") {
        if (p.type === state.propertyType) score += 3;
      } else {
        score += 1;
      }

      // Budget: hard limits have already been applied above.
      if (state.budgetMax != null && p.price <= state.budgetMax) score += 4;
      if (state.budgetMin != null && p.price >= state.budgetMin) score += 2;

      // Bedrooms
      if (state.bedrooms != null) {
        if (p.bedrooms === state.bedrooms) score += 3;
        else if (p.bedrooms === state.bedrooms + 1) score += 2;
        else if (p.bedrooms > state.bedrooms) score += 1;
      }

      // Featured listings get a gentle boost
      if (p.featured) score += 1;

      return { property: p, score };
    })
    .filter(({ score }) => score >= 4)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ property: p, score }) => {
    let images: string[] = [];
    try {
      images = JSON.parse(p.images) as string[];
    } catch {
      images = [];
    }
    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      neighborhood: p.neighborhood,
      price: p.price,
      purpose: p.purpose as Purpose,
      type: p.type as PropertyType,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      area: p.area,
      image: images[0] ?? "",
      score,
    };
  });
}
