import Link from "next/link";
import { Building2, Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { BRAND } from "@/lib/constants";

const columns = [
  {
    title: "Explore",
    links: [
      { href: "/properties", label: "All properties" },
      { href: "/properties?purpose=buy", label: "Buy" },
      { href: "/properties?purpose=rent", label: "Rent" },
      { href: "/favorites", label: "Saved properties" },
    ],
  },
  {
    title: "Vertice",
    links: [
      { href: "/about", label: "About the agency" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/contact", label: "Contact" },
      { href: "/dashboard", label: "Agent dashboard" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="container-site grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-ivory">
              <Building2 className="h-4 w-4" aria-hidden />
            </span>
            <span className="font-display text-lg font-semibold">
              Vertice<span className="text-brass">.</span>
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-muted">
            A boutique real estate agency in São Paulo. Thoughtfully selected homes,
            supported by intelligent technology and personal service.
          </p>
          <div className="mt-5 flex gap-2">
            <a
              href={`https://wa.me/${BRAND.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink-soft transition-colors hover:border-pine hover:text-pine"
              aria-label="Vertice on WhatsApp"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
            </a>
            <a
              href={`mailto:${BRAND.email}`}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink-soft transition-colors hover:border-pine hover:text-pine"
              aria-label="Email Vertice"
            >
              <Mail className="h-4 w-4" aria-hidden />
            </a>
            <a
              href={`tel:${BRAND.phone.replace(/\D/g, "")}`}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink-soft transition-colors hover:border-pine hover:text-pine"
              aria-label="Call Vertice"
            >
              <Phone className="h-4 w-4" aria-hidden />
            </a>
          </div>
        </div>

        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
              {col.title}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-soft transition-colors hover:text-brass"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
            Our office
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-ink-soft">
            <li className="flex gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brass" aria-hidden />
              <span>{BRAND.address}</span>
            </li>
            <li className="flex gap-2.5">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brass" aria-hidden />
              <span>{BRAND.hours}</span>
            </li>
            <li className="flex gap-2.5">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brass" aria-hidden />
              <span>{BRAND.phone}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-site flex flex-col items-start justify-between gap-2 py-5 text-xs text-ink-muted sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} {BRAND.name} · {BRAND.creci}
          </p>
          <p>
            Fictional brand created as a product demonstration and portfolio project.
          </p>
        </div>
      </div>
    </footer>
  );
}
