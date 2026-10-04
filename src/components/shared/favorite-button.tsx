"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/use-favorites";
import { useToast } from "@/components/ui/toast";
import { track } from "@/lib/analytics";

export function FavoriteButton({
  propertyId,
  propertyTitle,
  className,
  size = "md",
}: {
  propertyId: string;
  propertyTitle?: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const { isFavorite, toggle, hydrated } = useFavorites();
  const { toast } = useToast();
  const active = hydrated && isFavorite(propertyId);

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? "Remove from saved properties" : "Save property"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const added = toggle(propertyId);
        if (added) {
          track("property_favorited", { propertyId });
          toast({
            title: "Property saved",
            description: propertyTitle ? `"${propertyTitle}" was added to your saved list.` : undefined,
            variant: "success",
          });
        }
      }}
      className={cn(
        "group/fav inline-flex items-center justify-center rounded-full border bg-white/90 backdrop-blur transition-all duration-200 hover:scale-105 active:scale-95",
        active ? "border-hot/40 text-hot" : "border-line text-ink-soft hover:border-hot/30 hover:text-hot",
        size === "md" ? "h-10 w-10" : "h-8 w-8",
        className
      )}
    >
      <Heart
        className={cn(size === "md" ? "h-4.5 w-4.5" : "h-4 w-4", "h-[18px] w-[18px] transition-transform duration-200", active && "fill-current scale-110")}
        aria-hidden
      />
    </button>
  );
}
