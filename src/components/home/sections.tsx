import Link from "next/link";
import {
  Bot,
  Crosshair,
  Gauge,
  KeyRound,
  MapPinned,
  MessageCircle,
  Route,
  ScanSearch,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { BRAND } from "@/lib/constants";
import { OpenChatButton } from "@/components/shared/open-chat-button";

// ── Problem → solution story ─────────────────────────────────────────────

export function StorySection() {
  return (
    <section className="border-y border-line bg-white" aria-labelledby="story-title">
      <div className="container-site grid gap-10 py-20 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="eyebrow">WHY VERTICE EXISTS</p>
          <h2 id="story-title" className="mt-3 font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl text-balance">
            Property websites collect forms. We start conversations.
          </h2>
          <p className="mt-5 leading-relaxed text-ink-soft">
            At most agencies, visitors leave a name and phone number, then receive a call
            from an agent who has no idea whether they want to buy, rent, or clicked by
            mistake. The result: wasted calls and a frustrating first impression.
          </p>
          <p className="mt-4 leading-relaxed text-ink-soft">
            At Vertice, {BRAND.assistantName}—our AI-powered property concierge—speaks
            with every visitor before the first human interaction. She learns what they
            need, recommends homes from our real listings, and gives the specialist useful context.
          </p>
        </div>
        <div className="flex flex-col justify-center gap-3">
          {[
            {
              icon: ScanSearch,
              title: "Less manual lead qualification",
              text: "Intent, budget, neighborhood, timeline, and readiness gathered naturally—not buried in a form.",
            },
            {
              icon: Timer,
              title: "More context before first contact",
              text: "Agents receive a clear summary and suggested listings instead of a phone number with no history.",
            },
            {
              icon: Route,
              title: "A thoughtful path for every visitor",
              text: "Ready-to-act clients can reach a specialist right away. Early-stage shoppers receive relevant follow-up without pressure.",
            },
          ].map((item) => (
            <div key={item.title} className="flex gap-4 rounded-2xl border border-line bg-ivory p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brass/15 text-brass-dark">
                <item.icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-ink">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── How the AI works ─────────────────────────────────────────────────────

export function HowAiWorks() {
  const steps = [
    {
      icon: MessageCircle,
      num: "01",
      title: "Understands intent",
      text: "Maya learns whether a visitor wants to buy, rent, sell, or simply explore through a relaxed conversation.",
    },
    {
      icon: Gauge,
      num: "02",
      title: "Qualifies the opportunity",
      text: "Budget, neighborhood, bedrooms, timeline, and financial readiness are gathered progressively, one question at a time.",
    },
    {
      icon: Crosshair,
      num: "03",
      title: "Matches real inventory",
      text: "A deterministic matching engine compares preferences with live inventory and recommends only real, relevant listings.",
    },
    {
      icon: Route,
      num: "04",
      title: "Routes each lead thoughtfully",
      text: "Ready prospects reach a specialist with a WhatsApp alert. Early-stage shoppers enter a helpful nurture journey.",
    },
  ];

  return (
    <section className="container-site py-20" aria-labelledby="how-ai-title">
      <div className="max-w-2xl">
        <p className="eyebrow">THE INTELLIGENCE LAYER</p>
        <h2 id="how-ai-title" className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl text-balance">
          How {BRAND.assistantName} works
        </h2>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => (
          <div
            key={step.num}
            className="group rounded-2xl border border-line bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brass/40 hover:shadow-lift"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-pine/10 text-pine">
                <step.icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="font-display text-2xl font-semibold text-champagne-deep transition-colors group-hover:text-brass">
                {step.num}
              </span>
            </div>
            <h3 className="mt-5 text-base font-semibold text-ink">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{step.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Why choose us ────────────────────────────────────────────────────────

export function WhyChooseUs() {
  const items = [
    {
      icon: ShieldCheck,
      title: "Thoughtful curation",
      text: "We visit and verify every property before it is listed. No ghost listings or decade-old photos.",
    },
    {
      icon: Bot,
      title: "A response in minutes, not days",
      text: "Maya is available around the clock. When a person steps in, they already understand what matters to you.",
    },
    {
      icon: MapPinned,
      title: "Neighborhood specialists",
      text: "Our agents know their areas inside out—from price per square meter to local projects and the best coffee nearby.",
    },
    {
      icon: KeyRound,
      title: "From first click to keys",
      text: "Financing, paperwork, inspections, and handover—we guide you through every step at no extra cost.",
    },
  ];

  return (
    <section className="border-y border-line bg-pine text-ivory" aria-labelledby="why-title">
      <div className="container-site py-20">
        <div className="max-w-2xl">
          <p className="eyebrow !text-brass-light">THE VERTICE DIFFERENCE</p>
          <h2 id="why-title" className="mt-3 font-display text-3xl font-semibold sm:text-4xl text-balance">
            Boutique service, with technology that stays in the background
          </h2>
          <p className="mt-4 text-ivory/70">
            Technology handles the first steps so our people can focus on yours.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <div key={item.title} className="rounded-2xl border border-ivory/10 bg-ivory/5 p-6 backdrop-blur-sm">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ivory/10 text-brass-light">
                <item.icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-5 text-base font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ivory/70">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Testimonials ─────────────────────────────────────────────────────────

export function Testimonials() {
  const testimonials = [
    {
      quote:
        "We described what we wanted in a five-minute conversation and toured three apartments that genuinely fit that same week. No agency had made it that easy before.",
      name: "Carolina and Eduardo Monteiro",
      role: "Bought in Jardins",
      initials: "CM",
    },
    {
      quote:
        "Maya narrowed things down before the first call. When Helena reached out, she already knew my budget, timeline, and preferred neighborhoods. It was the most productive conversation I've had with an agency.",
      name: "Rodrigo Almeida",
      role: "Bought in Vila Mariana",
      initials: "RA",
    },
    {
      quote:
        "I was just researching and still felt well looked after. I received a few weeks of relevant email suggestions and found the right studio in Pinheiros—without any pressure.",
      name: "Beatriz Campos",
      role: "Rented in Pinheiros",
      initials: "BC",
    },
    {
      quote:
        "Selling my apartment was stress-free. The valuation was thoughtful, the process transparent, and the buyer was well qualified. We signed in six weeks.",
      name: "Marcos Vieira",
      role: "Sold in Perdizes",
      initials: "MV",
    },
  ];

  const stats = [
    { value: "340+", label: "homes represented" },
    { value: "10", label: "neighborhoods served" },
    { value: "14 years", label: "combined experience" },
    { value: "4.9/5", label: "client satisfaction" },
  ];

  return (
    <section className="container-site py-20" aria-labelledby="testimonials-title">
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr] lg:gap-12">
        <div>
          <p className="eyebrow">CLIENT STORIES</p>
          <h2 id="testimonials-title" className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl text-balance">
            Stories from people who found their place
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-line bg-white p-4">
                <p className="font-display text-2xl font-semibold text-brass-dark">{s.value}</p>
                <p className="mt-1 text-xs leading-snug text-ink-muted">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-ink-muted">
            Illustrative testimonials from the fictional {BRAND.name} brand.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {testimonials.map((t) => (
            <figure key={t.name} className="flex flex-col rounded-2xl border border-line bg-white p-6 shadow-card">
              <blockquote className="flex-1 text-sm leading-relaxed text-ink-soft">
                <span className="font-display text-3xl leading-none text-brass" aria-hidden>“</span>
                {t.quote}
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-line pt-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-champagne font-display text-sm font-semibold text-brass-dark">
                  {t.initials}
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{t.name}</p>
                  <p className="text-xs text-ink-muted">{t.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Final CTA ────────────────────────────────────────────────────────────

export function CtaSection() {
  return (
    <section className="container-site pb-24" aria-labelledby="cta-title">
      <div className="relative overflow-hidden rounded-3xl bg-ink px-6 py-16 text-center text-ivory sm:px-12">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brass/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-pine/40 blur-3xl"
          aria-hidden
        />
        <p className="eyebrow !text-brass-light">GET STARTED</p>
        <h2 id="cta-title" className="mx-auto mt-3 max-w-2xl font-display text-3xl font-semibold sm:text-4xl text-balance">
          Your next address is one conversation away
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-ivory/70">
          Talk with {BRAND.assistantName}—no forms, no waiting, no pressure. In just a
          couple of minutes, she'll put together a shortlist for you.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <OpenChatButton />
          <Link
            href="/properties"
            className="btn border border-ivory/25 px-7 py-3.5 text-ivory transition-colors hover:bg-ivory/10"
          >
            Explore properties
          </Link>
        </div>
      </div>
    </section>
  );
}
