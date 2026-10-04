"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Save } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function RefreshDashboard() {
  const router = useRouter();
  return <button type="button" onClick={() => router.refresh()} className="btn-secondary !px-4 !py-2"><RefreshCw className="h-4 w-4" aria-hidden />Refresh dashboard</button>;
}

export function LeadActions({ id, status, notes }: { id: string; status: string; notes: string | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const [value, setValue] = useState(status === "SCHEDULED" ? "CONTACTED" : status);
  const [text, setText] = useState(notes ?? "");
  const [busy, setBusy] = useState(false);
  return <form className="mt-5 space-y-3 border-t border-line pt-5" onSubmit={async event => {
    event.preventDefault(); setBusy(true);
    try {
      const res = await fetch(`/api/leads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: value, notes: text }) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast({ title: "Lead updated", variant: "success" }); router.refresh();
    } catch (error) { toast({ title: error instanceof Error ? error.message : "Unable to save. Please retry.", variant: "error" }); }
    finally { setBusy(false); }
  }}>
    <label className="block text-xs font-semibold text-ink-soft">Follow-up status
      <select value={value} onChange={e => setValue(e.target.value)} disabled={status === "SCHEDULED" || busy} className="input-field mt-1">
        <option value="NEW">New inquiry</option><option value="CONTACTED">Contacted</option><option value="NURTURE">Follow up later</option>
      </select>
    </label>
    {status === "SCHEDULED" && <p className="text-xs text-ink-muted">The scheduled status stays active until the viewing is completed or cancelled.</p>}
    <label className="block text-xs font-semibold text-ink-soft">Agent notes
      <textarea className="input-field mt-1" value={text} maxLength={2000} rows={3} onChange={e => setText(e.target.value)} placeholder="Add context for your next conversation..." />
    </label>
    <button disabled={busy} className="btn-primary !py-2 !text-xs"><Save className="h-3.5 w-3.5" aria-hidden />{busy ? "Saving..." : "Save changes"}</button>
  </form>;
}

export function AppointmentActions({ id, status }: { id: string; status: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  if (["CANCELLED", "DONE"].includes(status)) return <p className="mt-2 text-xs font-semibold text-ink-muted">{status === "DONE" ? "Completed" : "Cancelled"}</p>;
  async function update(next: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast({ title: next === "DONE" ? "Viewing completed" : "Viewing cancelled", variant: "success" }); router.refresh();
    } catch (error) { toast({ title: error instanceof Error ? error.message : "Unable to update viewing.", variant: "error" }); }
    finally { setBusy(false); }
  }
  return <div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={() => void update("DONE")} className="btn-secondary !px-3 !py-1.5 !text-xs">Mark completed</button><button type="button" disabled={busy} onClick={() => void update("CANCELLED")} className="rounded-full px-3 py-1.5 text-xs text-hot hover:bg-hot/5 disabled:opacity-50">Cancel viewing</button></div>;
}
