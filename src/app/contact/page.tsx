import type { Metadata } from "next";
import { BRAND } from "@/lib/constants";
import { ContactForm } from "@/components/contact/contact-form";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach Vertice Realty by phone, WhatsApp, email, or contact form. Our São Paulo team is available Monday through Saturday.",
};

export default function ContactPage() {
  return (
    <div className="container-site py-10 sm:py-14">
      <header className="mb-10 max-w-2xl">
        <p className="eyebrow">WE'RE HERE TO HELP</p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl text-balance">
          Let's find your next address
        </h1>
        <p className="mt-4 text-ink-muted">
          Call, message us on WhatsApp, or send a note using the form. A local
          specialist will get back to you during business hours.
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[1fr_420px]">
        <section aria-labelledby="channels-title">
          <h2 id="channels-title" className="sr-only">Contact options</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: Phone,
                title: "Phone",
                value: BRAND.phone,
                href: `tel:${BRAND.phone.replace(/\D/g, "")}`,
              },
              {
                icon: MessageCircle,
                title: "WhatsApp",
                value: BRAND.whatsapp,
                href: `https://wa.me/${BRAND.whatsapp.replace(/\D/g, "")}`,
              },
              {
                icon: Mail,
                title: "Email",
                value: BRAND.email,
                href: `mailto:${BRAND.email}`,
              },
              {
                icon: Clock,
                title: "Hours",
                value: BRAND.hours,
                href: undefined,
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-line bg-white p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-champagne text-brass-dark">
                  <item.icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-ink">{item.title}</h3>
                {item.href ? (
                  <a href={item.href} className="mt-1 block text-sm text-ink-soft hover:text-brass-dark">
                    {item.value}
                  </a>
                ) : (
                  <p className="mt-1 text-sm text-ink-soft">{item.value}</p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-line bg-white p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-champagne text-brass-dark">
              <MapPin className="h-5 w-5" aria-hidden />
            </span>
            <h3 className="mt-4 text-sm font-semibold text-ink">Office</h3>
            <p className="mt-1 text-sm text-ink-soft">{BRAND.address}</p>
          </div>
        </section>

        <section aria-labelledby="form-title" className="rounded-2xl border border-line bg-white p-6 sm:p-8">
          <h2 id="form-title" className="font-display text-xl font-semibold text-ink">
            Send us a message
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            We typically reply within four business hours.
          </p>
          <div className="mt-5">
            <ContactForm />
          </div>
        </section>
      </div>
    </div>
  );
}
