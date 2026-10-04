import type { Metadata } from "next";
import { StorySection } from "@/components/home/sections";
import { AutomationFlow } from "@/components/home/automation-flow";
import { OpenChatButton } from "@/components/shared/open-chat-button";
import { BRAND } from "@/lib/constants";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "See how Vertice uses AI to understand what home seekers need, recommend relevant listings, and connect them with the right local specialist.",
};

export default function HowItWorksPage() {
  const steps = [
    {
      title: "Tell Maya what you're looking for",
      text: "On a property page or in the chat, share whether you want to buy or rent, your preferred property type and neighborhood, your budget, and timing.",
    },
    {
      title: "Get a tailored shortlist",
      text: "Maya compares your preferences with real listings in our collection and shares relevant options—never made-up prices or features.",
    },
    {
      title: "A few thoughtful questions",
      text: "Maya learns your timeline and financial readiness with just a few questions, one at a time, without making the conversation feel like an interview.",
    },
    {
      title: "The right next step, automatically",
      text: "If you're ready, a local agent receives your profile and can help arrange a viewing. If you're still exploring, you'll receive useful email updates at your pace.",
    },
  ];

  const faq = [
    {
      q: "Does Maya replace a real estate agent?",
      a: "No. She handles the first steps—learning your preferences, answering basic questions, and suggesting listings. When you are ready, a local agent takes over with the full context.",
    },
    {
      q: "How does lead qualification work?",
      a: "A deterministic scoring model considers intent, timeline, financial readiness, property preferences, and contact details. It helps the team prioritize follow-up while early-stage shoppers can continue exploring without pressure.",
    },
    {
      q: "How is my information used?",
      a: "Your details are used to respond to your inquiry and share relevant property information. This portfolio demo stores data locally and does not connect to external marketing services by default.",
    },
    {
      q: "Can I book a viewing without chatting with AI?",
      a: "Absolutely. Every property has a direct viewing request option. Maya is available if you would like help finding a time or preparing the agent with your preferences.",
    },
  ];

  return (
    <div>
      <div className="container-site py-10 sm:py-14">
        <header className="mb-10 max-w-2xl">
          <p className="eyebrow">A BETTER WAY TO FIND HOME</p>
          <h1 className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl text-balance">
            How Vertice works
          </h1>
          <p className="mt-4 text-ink-muted">
            Technology makes the first steps easier. People guide the decisions that matter.
          </p>
        </header>

        <section aria-labelledby="steps-title" className="mb-16">
          <h2 id="steps-title" className="sr-only">How it works</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <div
                key={step.title}
                className="rounded-2xl border border-line bg-white p-6 transition-shadow hover:shadow-lift"
              >
                <span className="font-display text-3xl font-semibold text-champagne-deep">
                  0{i + 1}
                </span>
                <h3 className="mt-4 text-base font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16" aria-labelledby="automation-title">
          <div className="mb-10 text-center">
            <h2 id="automation-title" className="font-display text-2xl font-semibold text-ink sm:text-3xl">
              From first visit to a well-qualified opportunity
            </h2>
          </div>
          <AutomationFlow />
        </section>

        <section aria-labelledby="faq-title" className="mx-auto max-w-3xl">
          <h2 id="faq-title" className="font-display text-2xl font-semibold text-ink">
            Frequently asked questions
          </h2>
          <dl className="mt-6 space-y-4">
            {faq.map((item) => (
              <div key={item.q} className="rounded-2xl border border-line bg-white p-5">
                <dt className="text-sm font-semibold text-ink">{item.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-ink-muted">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-16 rounded-2xl bg-ink px-6 py-10 text-ivory text-center sm:px-10">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">
            Experimente a {BRAND.assistantName} agora
          </h2>
          <p className="mt-2 text-ivory/70">
            It takes less than two minutes, with no obligation.
          </p>
          <div className="mt-6">
            <OpenChatButton label="Chat with Maya" />
          </div>
        </section>
      </div>
      <StorySection />
    </div>
  );
}
