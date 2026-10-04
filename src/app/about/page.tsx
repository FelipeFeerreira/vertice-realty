import type { Metadata } from "next";
import { db } from "@/lib/db";
import { BRAND } from "@/lib/constants";
import { PropertyImage } from "@/components/shared/property-image";

export const metadata: Metadata = {
  title: "About the Agency",
  description:
    "Meet Vertice Realty, a boutique São Paulo agency combining carefully curated homes with thoughtful, technology-assisted service.",
};

export const revalidate = 60;

export default async function AboutPage() {
  const agents = await db.agent.findMany();

  return (
    <div className="container-site py-10 sm:py-14">
      <header className="mb-10 max-w-2xl">
        <p className="eyebrow">OUR APPROACH</p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl text-balance">
          Thoughtfully chosen homes. A more personal way to find yours.
        </h1>
      </header>

      <section className="grid gap-10 lg:grid-cols-2 lg:gap-16" aria-labelledby="story-heading">
        <div>
          <h2 id="story-heading" className="font-display text-2xl font-semibold text-ink">
            Our story
          </h2>
          <p className="mt-4 leading-relaxed text-ink-soft">
            {BRAND.name} began with a familiar frustration for anyone searching for a home
            in São Paulo: polished websites, empty forms, cold calls, and agents who barely
            knew what people needed. We set out to build an agency where technology handles
            the first steps, so people can focus on what matters—understanding each client
            and finding the right address.
          </p>
          <p className="mt-4 leading-relaxed text-ink-soft">
            We keep our team intentionally small. We would rather know a handful of
            neighborhoods—Jardins, Vila Madalena, Pinheiros, Itaim Bibi, Moema, Perdizes,
            and nearby areas—deeply than cover the whole city superficially. We visit
            every listing, review the paperwork, and guide each viewing.
          </p>
        </div>
        <div className="rounded-3xl border border-line bg-white p-8">
          <h3 className="font-display text-xl font-semibold text-ink">How we work</h3>
          <ul className="mt-5 space-y-4">
            {[
              "Curation over volume—we only list homes we have visited.",
              "Context before calls—Maya organizes your preferences before an agent reaches out.",
              "Transparency at every step—pricing, terms, and paperwork are clearly explained.",
              "Support through move-in—we stay with you after the paperwork is signed.",
            ].map((text) => (
              <li key={text} className="flex gap-3 text-sm leading-relaxed text-ink-soft">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brass" aria-hidden />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-16" aria-labelledby="agents-title">
        <h2 id="agents-title" className="font-display text-2xl font-semibold text-ink">
          Meet your advisors
        </h2>
        <p className="mt-2 max-w-2xl text-ink-muted">
          Local specialists who know the neighborhoods you are considering. When Maya
          introduces a client, they already have the full conversation and context.
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="rounded-2xl border border-line bg-white p-6 transition-shadow hover:shadow-lift"
            >
              <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full bg-champagne">
                <PropertyImage src={agent.avatar} alt={`Portrait of ${agent.name}`} fill sizes="96px" />
              </div>
              <div className="mt-4 text-center">
                <h3 className="font-display text-lg font-semibold text-ink">{agent.name}</h3>
                <p className="text-xs font-semibold uppercase tracking-wide text-brass">{agent.role}</p>
              </div>
              <p className="mt-4 text-center text-sm leading-relaxed text-ink-muted">{agent.bio}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-3xl bg-pine px-6 py-12 text-ivory sm:px-12" aria-labelledby="values-title">
        <h2 id="values-title" className="font-display text-2xl font-semibold">
          What guides us
        </h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {[
            { title: "Clarity", text: "No fine print, inflated prices, or unrealistic promises. You always know where you stand." },
            { title: "Human-centered technology", text: "AI makes the first steps faster, while a real advisor guides the rest. Technology never replaces a relationship." },
            { title: "Respect for your time", text: "We narrow down options before viewings and prepare the way for each decision." },
          ].map((v) => (
            <div key={v.title}>
              <h3 className="text-base font-semibold">{v.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ivory/70">{v.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
