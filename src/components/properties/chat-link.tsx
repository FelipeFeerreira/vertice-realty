"use client";

import { MessageCircle } from "lucide-react";

/**
 * Renders a server-safe button that opens the Maya concierge with the
 * current property as context.
 */
export function ChatLink({ slug }: { slug: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("open-chat", { detail: { propertyContext: slug } }))}
      className="btn-secondary w-full !py-3"
    >
      <MessageCircle className="h-4 w-4 text-brass" aria-hidden />
      Ask Maya about this property
    </button>
  );
}
