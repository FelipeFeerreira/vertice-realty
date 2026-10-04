"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ListFilter, Search, SlidersHorizontal, X } from "lucide-react";
import { NEIGHBORHOODS, PROPERTY_TYPE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

const selectClass =
  "w-full appearance-none rounded-xl border border-line bg-white px-3.5 py-2.5 pr-9 text-sm text-ink transition-colors focus:border-brass/60 focus:outline-none focus:ring-2 focus:ring-brass/20";

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "newest", label: "Newest" },
];

const PRICE_OPTIONS = {
  buy: [
    { label: "No minimum", value: "" },
    { label: "R$ 500k", value: "500000" },
    { label: "R$ 1m", value: "1000000" },
    { label: "R$ 2m", value: "2000000" },
    { label: "R$ 3.5m", value: "3500000" },
  ],
  rent: [
    { label: "No minimum", value: "" },
    { label: "R$ 3k/month", value: "3000" },
    { label: "R$ 5k/month", value: "5000" },
    { label: "R$ 8k/month", value: "8000" },
    { label: "R$ 12k/month", value: "12000" },
  ],
};

const MAX_PRICE_OPTIONS = {
  buy: [
    { label: "No maximum", value: "" },
    { label: "R$ 700k", value: "700000" },
    { label: "R$ 1.2m", value: "1200000" },
    { label: "R$ 2m", value: "2000000" },
    { label: "R$ 3.5m", value: "3500000" },
    { label: "R$ 5m", value: "5000000" },
  ],
  rent: [
    { label: "No maximum", value: "" },
    { label: "R$ 4k/month", value: "4000" },
    { label: "R$ 7k/month", value: "7000" },
    { label: "R$ 12k/month", value: "12000" },
    { label: "R$ 20k/month", value: "20000" },
  ],
};

function SelectChevron() {
  return (
    <svg
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function PropertyFilters({ totalCount }: { totalCount: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const queryValue = searchParams.get("q") ?? "";

  useEffect(() => setQ(queryValue), [queryValue]);

  const purpose = searchParams.get("purpose") ?? "";
  const get = (key: string) => searchParams.get(key) ?? "";

  const setParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      const min = params.get("minPrice");
      const max = params.get("maxPrice");
      if (min && max && Number(min) > Number(max)) {
        if ("minPrice" in updates) params.delete("maxPrice");
        else params.delete("minPrice");
      }
      track("property_search", Object.fromEntries(params));
      router.push(`/properties?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // Debounced free-text search
  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (q === current) return;
    const t = setTimeout(() => setParams({ q }), 400);
    return () => clearTimeout(t);
  }, [q, searchParams, setParams]);

  const chips: { key: string; label: string }[] = [];
  if (purpose) chips.push({ key: "purpose", label: purpose === "buy" ? "Buy" : "Rent" });
  if (get("type")) chips.push({ key: "type", label: PROPERTY_TYPE_LABELS[get("type") as keyof typeof PROPERTY_TYPE_LABELS] });
  if (get("location")) chips.push({ key: "location", label: get("location") });
  if (get("minPrice")) chips.push({ key: "minPrice", label: `Min. ${Number(get("minPrice")).toLocaleString("en-US", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}` });
  if (get("maxPrice")) chips.push({ key: "maxPrice", label: `Max. ${Number(get("maxPrice")).toLocaleString("en-US", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}` });
  if (get("bedrooms")) chips.push({ key: "bedrooms", label: `${get("bedrooms")}+ beds` });
  if (get("bathrooms")) chips.push({ key: "bathrooms", label: `${get("bathrooms")}+ baths` });
  if (get("q")) chips.push({ key: "q", label: `"${get("q")}"` });

  const clearAll = () => {
    setQ("");
    router.push("/properties", { scroll: false });
    track("property_search", { cleared: true });
  };

  const withCurrent = (options: { label: string; value: string }[], key: string) => {
    const value = get(key);
    return value && !options.some(option => option.value === value)
      ? [...options, { value, label: Number(value).toLocaleString("en-US", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }) }]
      : options;
  };
  const priceOpts = withCurrent(purpose === "rent" ? PRICE_OPTIONS.rent : PRICE_OPTIONS.buy, "minPrice");
  const maxPriceOpts = withCurrent(purpose === "rent" ? MAX_PRICE_OPTIONS.rent : MAX_PRICE_OPTIONS.buy, "maxPrice");

  const filtersForm = (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <label className="block">
        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
          Purpose
        </span>
        <div className="relative">
          <select
            className={selectClass}
            value={purpose}
            onChange={(e) => setParams({ purpose: e.target.value, minPrice: "", maxPrice: "" })}
            aria-label="Purpose"
          >
            <option value="">Buy or rent</option>
            <option value="buy">Buy</option>
            <option value="rent">Rent</option>
          </select>
          <SelectChevron />
        </div>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
          Property type
        </span>
        <div className="relative">
          <select
            className={selectClass}
            value={get("type")}
            onChange={(e) => setParams({ type: e.target.value })}
            aria-label="Property type"
          >
            <option value="">All property types</option>
            {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <SelectChevron />
        </div>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
          Neighborhood
        </span>
        <div className="relative">
          <select
            className={selectClass}
            value={get("location")}
            onChange={(e) => setParams({ location: e.target.value })}
            aria-label="Neighborhood"
          >
            <option value="">All neighborhoods</option>
            {NEIGHBORHOODS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <SelectChevron />
        </div>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
          Minimum price
        </span>
        <div className="relative">
          <select
            className={selectClass}
            value={get("minPrice")}
            onChange={(e) => setParams({ minPrice: e.target.value })}
            aria-label="Minimum price"
          >
            {priceOpts.map((o) => (
              <option key={o.label} value={o.value}>{o.label}</option>
            ))}
          </select>
          <SelectChevron />
        </div>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
          Maximum price
        </span>
        <div className="relative">
          <select
            className={selectClass}
            value={get("maxPrice")}
            onChange={(e) => setParams({ maxPrice: e.target.value })}
            aria-label="Maximum price"
          >
            {maxPriceOpts.map((o) => (
              <option key={o.label} value={o.value}>{o.label}</option>
            ))}
          </select>
          <SelectChevron />
        </div>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
          Bedrooms
        </span>
        <div className="relative">
          <select
            className={selectClass}
            value={get("bedrooms")}
            onChange={(e) => setParams({ bedrooms: e.target.value })}
            aria-label="Bedrooms"
          >
            <option value="">Any</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
          </select>
          <SelectChevron />
        </div>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
          Bathrooms
        </span>
        <div className="relative">
          <select
            className={selectClass}
            value={get("bathrooms")}
            onChange={(e) => setParams({ bathrooms: e.target.value })}
            aria-label="Bathrooms"
          >
            <option value="">Any</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
          </select>
          <SelectChevron />
        </div>
      </label>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Search + sort row */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden />
          <label htmlFor="filter-q" className="sr-only">Search by neighborhood, street, or property title</label>
          <input
            id="filter-q"
            maxLength={120}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by neighborhood, street, or property title..."
            className="input-field !py-3 !pl-11"
          />
        </div>
        <div className="flex gap-3">
          <div className="relative flex-1 sm:flex-none">
            <select
              className={cn(selectClass, "sm:w-48 !py-3")}
              value={get("sort") || "featured"}
              onChange={(e) => setParams({ sort: e.target.value === "featured" ? "" : e.target.value })}
              aria-label="Sort results"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <SelectChevron />
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="btn-secondary !px-4 !py-3 lg:hidden"
            aria-expanded={mobileOpen}
            aria-controls="filters-panel"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
            Filters
            {chips.length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brass text-[11px] font-bold text-white">
                {chips.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filters panel */}
      <div
        id="filters-panel"
        className={cn(
          "rounded-2xl border border-line bg-white p-5",
          mobileOpen ? "block" : "hidden lg:block"
        )}
      >
        {filtersForm}
      </div>

      {/* Result meta + chips */}
      <div className="flex flex-wrap items-center gap-2">
        <p className="inline-flex items-center gap-1.5 text-sm text-ink-muted">
          <ListFilter className="h-4 w-4" aria-hidden />
          <strong className="font-semibold text-ink">{totalCount}</strong>
          {totalCount === 1 ? " property found" : " properties found"}
        </p>
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={() => {
              if (chip.key === "q") setQ("");
              setParams({ [chip.key]: "" });
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-brass/30 bg-champagne/60 px-3 py-1 text-xs font-medium text-brass-dark transition-colors hover:bg-champagne"
            aria-label={`Remove ${chip.label} filter`}
          >
            {chip.label}
            <X className="h-3 w-3" aria-hidden />
          </button>
        ))}
        {chips.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-semibold text-ink-muted underline-offset-2 transition-colors hover:text-hot hover:underline"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
