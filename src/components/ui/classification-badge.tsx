import type { Classification } from "@/lib/types";
import { cn } from "@/lib/utils";

const styles: Record<Classification, string> = {
  HOT: "bg-hot/10 text-hot border-hot/25",
  WARM: "bg-warm/10 text-warm border-warm/25",
  NURTURE: "bg-nurture/10 text-nurture border-nurture/25",
  NEW: "bg-champagne text-ink-soft border-line",
};

const labels: Record<Classification, string> = {
  HOT: "Hot",
  WARM: "Warm",
  NURTURE: "Nurture",
  NEW: "New",
};

export function ClassificationBadge({
  classification,
  className,
}: {
  classification: Classification;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        styles[classification],
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {labels[classification]}
    </span>
  );
}
