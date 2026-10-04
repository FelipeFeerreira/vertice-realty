"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, SendHorizonal } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { track } from "@/lib/analytics";
import { BRAND } from "@/lib/constants";

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const { toast } = useToast();

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((err) => ({ ...err, [key]: "" }));
  };

  const validate = () => {
    const err: Record<string, string> = {};
    if (form.name.trim().length < 2) err.name = "Enter your name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) err.email = "Enter a valid email address";
    if (form.message.trim().length < 10) err.message = "Please tell us a little more about what you need";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Unable to send your message");
      setStatus("done");
      track("lead_created", { source: "CONTACT_PAGE" });
      toast({
        title: "Message sent",
        description: "We'll get back to you during business hours.",
        variant: "success",
      });
    } catch (err) {
      setStatus("idle");
      toast({
        title: "We couldn't send your message",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "error",
      });
    }
  };

  if (status === "done") {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-success/30 bg-success/5 p-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-success" aria-hidden />
        <h3 className="mt-4 font-display text-xl font-semibold text-ink">We received your message</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          A {BRAND.name} specialist will be in touch during business hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-ink-soft">Full name</span>
          <input type="text" autoComplete="name" value={form.name} onChange={set("name")} className="input-field" placeholder="Your name" />
          {errors.name && <p className="mt-1 text-xs text-hot">{errors.name}</p>}
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-ink-soft">Email</span>
          <input type="email" autoComplete="email" value={form.email} onChange={set("email")} className="input-field" placeholder="you@example.com" />
          {errors.email && <p className="mt-1 text-xs text-hot">{errors.email}</p>}
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-ink-soft">WhatsApp <span className="font-normal text-ink-muted">(optional)</span></span>
          <input type="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} className="input-field" placeholder="+55 11 98765-4321" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-ink-soft">Topic</span>
          <select value={form.subject} onChange={set("subject")} className="input-field">
            <option value="">General inquiry</option>
            <option value="Buy">I'm looking to buy</option>
            <option value="Rent">I'm looking to rent</option>
            <option value="Sell">I'm looking to sell</option>
            <option value="Partnership">Partnership</option>
          </select>
        </label>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-ink-soft">Message</span>
        <textarea value={form.message} onChange={set("message")} className="input-field resize-none" rows={5} placeholder="Tell us how we can help..." />
        {errors.message && <p className="mt-1 text-xs text-hot">{errors.message}</p>}
      </label>
      <button type="submit" disabled={status === "loading"} className="btn-primary w-full !py-3">
        {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <SendHorizonal className="h-4 w-4" aria-hidden />}
        {status === "loading" ? "Sending..." : "Send message"}
      </button>
      <p className="text-[11px] leading-relaxed text-ink-muted">
        By submitting, you agree to be contacted by {BRAND.name}. Your information is not shared with third parties.
      </p>
    </form>
  );
}
