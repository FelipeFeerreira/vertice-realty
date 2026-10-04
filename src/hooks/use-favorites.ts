"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "vertice:favorites";
let sessionFavorites: string[] = [];
let useSessionStorage = false;

function readFavorites(): string[] {
  if (typeof window === "undefined") return [];
  if (useSessionStorage) return sessionFavorites;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    sessionFavorites = Array.isArray(parsed)
      ? [...new Set(parsed.filter((value): value is string => typeof value === "string" && value.length > 0))]
      : [];
    return sessionFavorites;
  } catch {
    return sessionFavorites;
  }
}

/** Lightweight favorites store (localStorage + cross-component sync). */
export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setFavorites(readFavorites());
    setHydrated(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY || e.key === null) setFavorites(readFavorites());
    };
    const onCustom = () => setFavorites(readFavorites());
    window.addEventListener("storage", onStorage);
    window.addEventListener("favorites-changed", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("favorites-changed", onCustom);
    };
  }, []);

  const toggle = useCallback((id: string) => {
    const current = readFavorites();
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    sessionFavorites = next;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Keep favorites usable for this session when browser storage is blocked.
      useSessionStorage = true;
    }
    setFavorites(next);
    window.dispatchEvent(new Event("favorites-changed"));
    return next.includes(id);
  }, []);

  return { favorites, hydrated, toggle, isFavorite: (id: string) => favorites.includes(id) };
}
