"use client";

import { MessageCircle } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Opens the Maya concierge from any server-rendered section. */
export function OpenChatButton({
  label,
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("open-chat"))}
      className={cn("btn-brass !px-7 !py-3.5", className)}
    >
      <MessageCircle className="h-4 w-4" aria-hidden />
      {label ?? `Chat with ${BRAND.assistantName}`}
    </button>
  );
}
