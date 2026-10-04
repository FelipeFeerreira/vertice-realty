import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { BRAND } from "@/lib/constants";
import { HeroSearch } from "@/components/home/hero-search";
import { AutomationFlow } from "@/components/home/automation-flow";
import {
  CtaSection,
  HowAiWorks,
  StorySection,
  Testimonials,
  WhyChooseUs,
} from "@/components/home/sections";
import { PropertyCard } from "@/components/properties/property-card";
import { PropertyImage } from "@/components/shared/property-image";
import { HERO_IMAGE } from "@/data/properties";

export const revalidate = 60;

async function FeaturedProperties() {
  const featured = await db.property.findMany({
    where: { featured: true, status: "available" },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  return (
    <section className="container-site py-20" aria-labelledby="featured-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">THIS WEEK'S EDIT</p>
          <h2 id="featured-title" className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl">
            Featured properties
          </h2>
        </div>
        <Link
          href="/properties"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brass-dark transition-colors hover:text-brass"
        >
          View all properties
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: BRAND.name,
    description: BRAND.description,
    telephone: BRAND.phone,
    email: BRAND.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Rua Oscar Freire, 1240",
      addressLocality: "São Paulo",
      addressRegion: "SP",
      addressCountry: "BR",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative" aria-labelledby="hero-title">
        <div className="absolute inset-0 overflow-hidden">
          <PropertyImage
            src={HERO_IMAGE}
            alt="Contemporary home exterior at dusk"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/45 to-ink/75" aria-hidden />
        </div>

        <div className="container-site relative flex min-h-[92svh] flex-col items-center justify-center py-20 text-center text-ivory">
          <p className="eyebrow !text-brass-light animate-fade-up">
            BOUTIQUE REAL ESTATE · SÃO PAULO
          </p>
          <h1
            id="hero-title"
            className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-6xl text-balance animate-fade-up"
            style={{ animationDelay: "80ms" }}
          >
            Find a place that feels like yours
          </h1>
          <p
            className="mt-5 max-w-xl text-base leading-relaxed text-ivory/80 sm:text-lg animate-fade-up"
            style={{ animationDelay: "160ms" }}
          >
            Thoughtfully selected homes in São Paulo's most desirable neighborhoods,
            with an AI property concierge who understands what you're looking for.
          </p>

          <div className="mt-9 w-full max-w-4xl animate-fade-up" style={{ animationDelay: "240ms" }}>
            <HeroSearch />
          </div>

          <p className="mt-6 text-xs uppercase tracking-[0.18em] text-ivory/60 animate-fade-up" style={{ animationDelay: "320ms" }}>
            Jardins · Vila Madalena · Pinheiros · Itaim Bibi · Moema · and beyond
          </p>
        </div>
      </section>

      <FeaturedProperties />
      <StorySection />
      <HowAiWorks />

      {/* ── Automation visualization ─────────────────────────────────── */}
      <section className="border-y border-line bg-champagne/40" aria-labelledby="automation-title">
        <div className="container-site py-20">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="eyebrow">AUTOMATION WITH PURPOSE</p>
            <h2 id="automation-title" className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl text-balance">
              From anonymous visitor to qualified opportunity—automatically
            </h2>
            <p className="mt-4 text-ink-soft">
              Every visitor gets a thoughtful next step. Ready prospects connect with a
              specialist in minutes; early-stage shoppers receive useful guidance as they explore.
            </p>
          </div>
          <AutomationFlow />
        </div>
      </section>

      <WhyChooseUs />
      <Testimonials />
      <CtaSection />
    </>
  );
}
