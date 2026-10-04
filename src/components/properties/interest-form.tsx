"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, SendHorizonal } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { track } from "@/lib/analytics";

export function InterestForm({
  propertySlug,
  propertyTitle,
}: {
  propertySlug: string;
  propertyTitle: string;
}) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const { toast } = useToast();

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((err) => ({ ...err, [key]: "" }));
  };

  const validate = () => {
    const err: Record<string, string> = {};
    if (form.name.trim().length < 2) err.name = "Please enter your name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) err.email = "Enter a valid email address";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, propertySlug, source: "PROPERTY_PAGE" }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Unable to send your request");
      setStatus("done");
      track("lead_created", { source: "PROPERTY_PAGE", propertySlug });
      toast({
        title: "Interest received",
        description: "A Vertice specialist will be in touch soon.",
        variant: "success",
      });
    } catch (err) {
      setStatus("idle");
      toast({
        title: "We couldn't send your request",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "error",
      });
    }
  };

  if (status === "done") {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-success/30 bg-success/5 p-6 text-center">
        <CheckCircle2 className="h-8 w-8 text-success" aria-hidden />
        <h3 className="mt-3 text-base font-semibold text-ink">Thanks for your interest!</h3>
        <p className="mt-1 text-sm leading-relaxed text-ink-muted">
          A specialist will be in touch about{" "}
          <span className="font-medium text-ink">{propertyTitle}</span>. Se preferir,
          . You can also chat with Maya using the button in the corner.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-3">
      <div>
        <label htmlFor="interest-name" className="mb-1.5 block text-xs font-semibold text-ink-soft">
          Full name
        </label>
        <input
          id="interest-name"
          type="text"
          autoComplete="name"
          value={form.name}
          onChange={set("name")}
          className="input-field"
          placeholder="Your name"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "interest-name-error" : undefined}
        />
        {errors.name && <p id="interest-name-error" className="mt-1 text-xs text-hot">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="interest-email" className="mb-1.5 block text-xs font-semibold text-ink-soft">
          Email
        </label>
        <input
          id="interest-email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={set("email")}
          className="input-field"
          placeholder="you@example.com"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "interest-email-error" : undefined}
        />
        {errors.email && <p id="interest-email-error" className="mt-1 text-xs text-hot">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="interest-phone" className="mb-1.5 block text-xs font-semibold text-ink-soft">
          WhatsApp <span className="font-normal text-ink-muted">(optional)</span>
        </label>
        <input
          id="interest-phone"
          type="tel"
          autoComplete="tel"
          value={form.phone}
          onChange={set("phone")}
          className="input-field"
          placeholder="(11) 98765-4321"
        />
      </div>

      <div>
        <label htmlFor="interest-message" className="mb-1.5 block text-xs font-semibold text-ink-soft">
          Message <span className="font-normal text-ink-muted">(optional)</span>
        </label>
        <textarea
          id="interest-message"
          rows={3}
          value={form.message}
          onChange={set("message")}
          className="input-field resize-none"
          placeholder="For example, could I see more photos of the kitchen?"
        />
      </div>

      <button type="submit" disabled={status === "loading"} className="btn-primary w-full !py-3">
        {status === "loading" ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <SendHorizonal className="h-4 w-4" aria-hidden />
        )}
        {status === "loading" ? "Sending..." : "Request information"}
      </button>
      <p className="text-[11px] leading-relaxed text-ink-muted">
        By submitting, you agree to be contacted by Vertice Realty about this property.
        Your information is never shared with third parties.
      </p>
    </form>
  );
}
