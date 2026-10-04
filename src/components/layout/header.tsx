"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { ArrowUpRight, Building2, Heart, LayoutDashboard, Menu, MessageCircle, Phone, X } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
import { useFavorites } from "@/hooks/use-favorites";

const NAV = [
  { href: "/", label: "Home", key: "home" },
  { href: "/properties", label: "Explore homes", key: "properties" },
  { href: "/properties?purpose=buy", label: "Buy", key: "buy" },
  { href: "/properties?purpose=rent", label: "Rent", key: "rent" },
  { href: "/about", label: "Our story", key: "about" },
  { href: "/how-it-works", label: "How it works", key: "how" },
] as const;

export function Header() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const closeMenu = useCallback(() => setOpen(false), []);
  useDialogFocus(headerRef, open, closeMenu);
  const { favorites, hydrated } = useFavorites();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => setOpen(false), [pathname, query]);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  const activeKey = pathname === "/" ? "home"
    : pathname === "/properties" ? (searchParams.get("purpose") === "buy" ? "buy" : searchParams.get("purpose") === "rent" ? "rent" : "properties")
    : pathname === "/about" ? "about"
    : pathname === "/how-it-works" ? "how"
    : pathname === "/contact" ? "contact"
    : pathname === "/favorites" ? "favorites" : "";

  const openChat = () => {
    setOpen(false);
    window.dispatchEvent(new CustomEvent("open-chat"));
  };

  return (
    <header ref={headerRef} className={cn("sticky top-0 z-50 border-b border-line/80 bg-ivory/95 backdrop-blur-xl transition-shadow duration-300", scrolled && "shadow-card")}>
      <div className="hidden border-b border-line/70 bg-ink text-ivory/80 lg:block">
        <div className="container-site flex h-8 items-center justify-between text-[11px] tracking-wide">
          <span>CURATED HOMES · SÃO PAULO</span>
          <div className="flex items-center gap-6">
            <a href={`tel:${BRAND.phone.replace(/\D/g, "")}`} className="inline-flex items-center gap-1.5 hover:text-white"><Phone className="h-3 w-3" aria-hidden />{BRAND.phone}</a>
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 hover:text-white">Agent dashboard <ArrowUpRight className="h-3 w-3" aria-hidden /></Link>
          </div>
        </div>
      </div>
      <div className="container-site flex h-[68px] items-center gap-5 lg:h-[76px]">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label={`${BRAND.name} home`}>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-ivory transition-colors group-hover:bg-pine"><Building2 className="h-[19px] w-[19px]" aria-hidden /></span>
          <span className="font-display text-[21px] font-semibold tracking-tight text-ink">Vertice<span className="text-brass">.</span><span className="ml-1.5 hidden align-middle font-sans text-[10px] font-medium uppercase tracking-[0.24em] text-ink-muted sm:inline">Realty</span></span>
        </Link>
        <nav aria-label="Main navigation" className="ml-auto hidden h-full items-center gap-0.5 lg:flex">
          {NAV.map((item) => (
            <Link key={item.key} href={item.href} aria-current={activeKey === item.key ? "page" : undefined}
              className={cn("relative flex h-full items-center px-2.5 text-[13px] font-medium transition-colors xl:px-3.5", activeKey === item.key ? "text-ink" : "text-ink-soft hover:text-brass-dark")}>
              {item.label}
              <span className={cn("absolute bottom-0 left-2.5 right-2.5 h-0.5 bg-brass transition-transform duration-200 xl:left-3.5 xl:right-3.5", activeKey === item.key ? "scale-x-100" : "scale-x-0")} aria-hidden />
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-1.5 lg:ml-2">
          <Link href="/favorites" aria-current={activeKey === "favorites" ? "page" : undefined}
            className={cn("relative inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-champagne", activeKey === "favorites" ? "text-brass-dark" : "text-ink-soft")}
            aria-label="Saved properties" title="Saved properties">
            <Heart className="h-[19px] w-[19px]" aria-hidden />
            {hydrated && favorites.length > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-hot px-1 text-[10px] font-bold text-white">{favorites.length}</span>}
          </Link>
          <Link href="/contact" className="hidden px-2.5 py-2 text-[13px] font-medium text-ink-soft transition-colors hover:text-brass-dark xl:inline-flex" aria-current={activeKey === "contact" ? "page" : undefined}>Contact</Link>
          <button type="button" onClick={openChat} className="btn-brass hidden !px-4 !py-2.5 sm:inline-flex"><MessageCircle className="h-4 w-4" aria-hidden /> Ask Maya</button>
          <button type="button" className="ml-1 inline-flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen((value) => !value)}>
            {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </div>
      {open && (
        <div className="fixed inset-x-0 top-[68px] z-40 h-[calc(100dvh-68px)] bg-ink/40 lg:hidden" onClick={() => setOpen(false)}>
          <nav id="mobile-navigation" aria-label="Mobile navigation" className="max-h-full overflow-y-auto border-b border-line bg-ivory p-5 shadow-lift" onClick={(event) => event.stopPropagation()}>
            <p className="eyebrow mb-3">FIND YOUR PLACE</p>
            {NAV.map((item) => (
              <Link key={item.key} href={item.href} onClick={() => setOpen(false)} aria-current={activeKey === item.key ? "page" : undefined}
                className={cn("flex items-center justify-between border-b border-line/70 px-2 py-3.5 text-base font-medium", activeKey === item.key ? "text-brass-dark" : "text-ink")}>
                {item.label}<ArrowUpRight className="h-4 w-4 text-ink-muted" aria-hidden />
              </Link>
            ))}
            <Link href="/contact" onClick={() => setOpen(false)} className="flex items-center justify-between border-b border-line/70 px-2 py-3.5 text-base font-medium text-ink">Contact<ArrowUpRight className="h-4 w-4 text-ink-muted" aria-hidden /></Link>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button type="button" onClick={openChat} className="btn-brass !px-3 !py-3"><MessageCircle className="h-4 w-4" aria-hidden /> Ask Maya</button>
              <Link href="/dashboard" onClick={() => setOpen(false)} className="btn-secondary !px-3 !py-3"><LayoutDashboard className="h-4 w-4" aria-hidden /> Agent portal</Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
