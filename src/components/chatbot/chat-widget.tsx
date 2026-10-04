"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bath,
  BedDouble,
  CalendarCheck,
  MessageCircle,
  RotateCcw,
  Ruler,
  SendHorizonal,
  Sparkles,
  X,
} from "lucide-react";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
import { BRAND } from "@/lib/constants";
import type {
  ChatReplyMessage,
  Classification,
  MatchedProperty,
  QualificationState,
  QuickReply,
} from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";
import { PropertyImage } from "@/components/shared/property-image";
import { useToast } from "@/components/ui/toast";
import { track } from "@/lib/analytics";
import { progressFor, quickRepliesFor } from "@/lib/qualification/engine";

// ── Client-side state ────────────────────────────────────────────────────

type UiMessage = ChatReplyMessage & { id: number; fromUser?: boolean };

const SESSION_KEY = "vertice:chat-session";
const STATE_KEY = "vertice:chat-state";
const HISTORY_KEY = "vertice:chat-history";

let memorySession: string | null = null;
function getSessionId(): string {
  try {
    memorySession = window.localStorage.getItem(SESSION_KEY) || memorySession || crypto.randomUUID();
    window.localStorage.setItem(SESSION_KEY, memorySession);
  } catch { memorySession ??= crypto.randomUUID(); }
  return memorySession;
}

function initialClientState(): QualificationState {
  return {
    intent: null,
    propertyType: null,
    location: null,
    budgetMin: null,
    budgetMax: null,
    bedrooms: null,
    timeline: null,
    financingStatus: null,
    name: null,
    email: null,
    phone: null,
    step: "intent",
    leadId: null,
    completed: false,
    propertyContext: null,
  };
}

let messageId = 0;
const nextId = () => ++messageId;

// ── Sub-components ───────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-champagne/80 px-4 py-3" aria-label="Maya is typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-ink-muted animate-typing-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function MiniPropertyCard({ property }: { property: MatchedProperty }) {
  return (
    <Link
      href={`/properties/${property.slug}`}
      className="group flex gap-3 rounded-xl border border-line bg-white p-2.5 transition-all hover:border-brass/50 hover:shadow-card"
    >
      <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-champagne">
        <PropertyImage src={property.image} alt={property.title} fill sizes="80px" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold leading-tight text-ink line-clamp-1 group-hover:text-brass-dark">
          {property.title}
        </p>
        <p className="mt-0.5 text-xs font-semibold text-brass-dark">
          {formatPrice(property.price, property.purpose)}
        </p>
        <p className="mt-0.5 flex items-center gap-2.5 text-[11px] text-ink-muted">
          <span className="inline-flex items-center gap-1">
            <BedDouble className="h-3 w-3" aria-hidden />
            {property.bedrooms}
          </span>
          <span className="inline-flex items-center gap-1">
            <Bath className="h-3 w-3" aria-hidden />
            {property.bathrooms}
          </span>
          <span className="inline-flex items-center gap-1">
            <Ruler className="h-3 w-3" aria-hidden />
            {property.area} m²
          </span>
        </p>
      </div>
      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brass" aria-hidden />
    </Link>
  );
}

function ResultActions({
  msg,
  onHandoff,
  handoffState,
}: {
  msg: Extract<ChatReplyMessage, { kind: "result" }>;
  onHandoff: (leadId: string) => void;
  handoffState: "idle" | "loading" | "done";
}) {
  return (
    <div className="mt-3 flex flex-col gap-2">
      {msg.ctas.map((cta) =>
        cta.href === "#whatsapp-handoff" ? (
          <button
            key={cta.label}
            type="button"
            disabled={handoffState !== "idle" || !msg.leadId}
            onClick={() => msg.leadId && onHandoff(msg.leadId)}
            className="btn-secondary w-full !py-2.5 !text-[13px] disabled:opacity-60"
          >
            <MessageCircle className="h-4 w-4 text-pine" aria-hidden />
            {handoffState === "loading"
              ? "Notifying the agent..."
              : handoffState === "done"
                ? "Agent notified ✓"
                : cta.label}
          </button>
        ) : (
          <Link
            key={cta.label}
            href={cta.href}
            className={cn(
              "w-full !py-2.5 !text-[13px]",
              cta.variant === "primary" ? "btn-primary" : "btn-secondary"
            )}
          >
            <CalendarCheck className="h-4 w-4" aria-hidden />
            {cta.label}
          </Link>
        )
      )}
    </div>
  );
}

const classificationStyles: Record<Classification, string> = {
  HOT: "bg-hot/10 text-hot",
  WARM: "bg-warm/10 text-warm",
  NURTURE: "bg-nurture/10 text-nurture",
  NEW: "bg-champagne text-ink-soft",
};

// ── Main widget ──────────────────────────────────────────────────────────

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const closeChat = useCallback(() => setOpen(false), []);
  useDialogFocus(panelRef, open, closeChat);
  const sending = useRef(false);
  const [failedMessage, setFailedMessage] = useState<{ value: string; inputType: "text" | "option"; label?: string; requestId: string } | null>(null);
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [state, setState] = useState<QualificationState>(initialClientState());
  const [progress, setProgress] = useState(0);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [handoff, setHandoff] = useState<"idle" | "loading" | "done">("idle");
  const [hasNew, setHasNew] = useState(true);
  const [propertyContext, setPropertyContext] = useState<string | null>(null);
  const [storageLoaded, setStorageLoaded] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }, []);

  // Load persisted state/history
  useEffect(() => {
    try {
      const rawState = window.localStorage.getItem(STATE_KEY);
      const rawHistory = window.localStorage.getItem(HISTORY_KEY);
      if (rawState) {
        const restored = JSON.parse(rawState) as QualificationState;
        if (restored && typeof restored.step === "string") {
          setState(restored);
          setQuickReplies(quickRepliesFor(restored));
          setProgress(progressFor(restored));
          setPropertyContext(restored.propertyContext ?? null);
        }
      }
      if (rawHistory) {
        const history = JSON.parse(rawHistory) as UiMessage[];
        if (Array.isArray(history) && history.length > 0 && history.every((message) => message && typeof message.id === "number" && typeof message.text === "string")) {
          messageId = Math.max(messageId, ...history.map((message) => message.id));
          setMessages(history);
          setStarted(true);
        }
      }
    } catch {
      // corrupted storage → fresh session
    } finally {
      setStorageLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!storageLoaded) return;
    try {
      window.localStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch {}
  }, [state, storageLoaded]);

  useEffect(() => {
    if (!storageLoaded) return;
    try {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-40)));
    } catch {}
  }, [messages, storageLoaded]);

  // External "open chat" requests (header button, property page CTA)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ propertyContext?: string }>).detail;
      if (detail?.propertyContext) setPropertyContext(detail.propertyContext);
      setOpen(true);
      setHasNew(false);
    };
    window.addEventListener("open-chat", handler);
    return () => window.removeEventListener("open-chat", handler);
  }, []);

  const send = useCallback(
    async (value: string, inputType: "text" | "option", displayLabel?: string, retryId?: string) => {
      if (sending.current) return;
      sending.current = true;
      setFailedMessage(null);
      const currentState = state;
      const requestId = retryId ?? crypto.randomUUID();
      if (value !== "__start__") {
        setMessages((prev) => [
          ...prev,
          { kind: "text", id: nextId(), text: displayLabel ?? value, fromUser: true } as UiMessage,
        ]);
      }
      setTyping(true);
      setQuickReplies([]);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(45000),
          body: JSON.stringify({
            sessionId: getSessionId(),
            requestId,
            state: currentState,
            input: value,
            inputType,
            propertyContext,
          }),
        });
        if (!res.ok) throw new Error("chat failed");
        const data = (await res.json()) as {
          messages: ChatReplyMessage[];
          quickReplies: QuickReply[];
          state: QualificationState;
          progress: number;
        };

        setState(data.state);
        setProgress(data.progress);
        // Stagger assistant messages for a natural rhythm
        const withIds = data.messages.map((m) => ({ ...m, id: nextId() }));
        for (let i = 0; i < withIds.length; i++) {
          await new Promise((r) => setTimeout(r, i === 0 ? 500 : 750));
          setMessages((prev) => [...prev, withIds[i]]);
          scrollToBottom();
        }

        setQuickReplies(data.quickReplies);
        setState(data.state);
        setProgress(data.progress);
        if (data.state.completed) track("qualification_completed", { leadId: data.state.leadId });
      } catch {
        setFailedMessage({ value, inputType, label: displayLabel, requestId });
        setQuickReplies(quickRepliesFor(currentState));
        setMessages((prev) => [
          ...prev,
          {
            kind: "text",
            id: nextId(),
            text: "I'm having a connection issue. Could you try again in a moment?",
          },
        ]);
      } finally {
        sending.current = false;
        setTyping(false);
      }
    },
    [state, propertyContext, scrollToBottom]
  );

  // Kick off the greeting on first open
  useEffect(() => {
    if (open && storageLoaded && !started) {
      setStarted(true);
      track("chat_started");
      void send("__start__", "text");
    }
  }, [open, storageLoaded, started, send]);

  useEffect(() => {
    if (open) {
      scrollToBottom();

    }
  }, [open, messages, typing, scrollToBottom]);

  const handleHandoff = useCallback(
    async (leadId: string) => {
      setHandoff("loading");
      track("agent_handoff_requested", { leadId });
      try {
        const res = await fetch("/api/automation/handoff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId, channel: "whatsapp" }),
        });
        if (!res.ok) throw new Error();
        setHandoff("done");
        setMessages((prev) => [
          ...prev,
          {
            kind: "text",
            id: nextId(),
            text: "All set! I've notified our team on WhatsApp. An agent will reach out shortly. In the meantime, I can adjust your preferences if you'd like.",
          },
        ]);
        toast({
          title: "Agent notified",
          description: "A Vertice specialist has been alerted and will be in touch.",
          variant: "success",
        });
      } catch {
        setHandoff("idle");
        toast({
          title: "We couldn't notify the agent",
          description: "Please try again in a few seconds.",
          variant: "error",
        });
      }
    },
    [toast]
  );

  const reset = useCallback(() => {
    if (sending.current) return;
    memorySession = crypto.randomUUID();
    try {
      window.localStorage.setItem(SESSION_KEY, memorySession);
      window.localStorage.removeItem(STATE_KEY);
      window.localStorage.removeItem(HISTORY_KEY);
    } catch {}
    setMessages([]);
    setState(initialClientState());
    setQuickReplies([]);
    setProgress(0);
    setHandoff("idle");
    setStarted(true);
    void send("__start__", "text");
  }, [send]);

  const quickReplyLabels = useMemo(() => new Set(quickReplies.map((q) => q.value)), [quickReplies]);

  return (
    <>
      {/* Floating trigger */}
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setHasNew(false);
        }}
        aria-label={open ? "Close assistant" : `Chat with ${BRAND.assistantName}`}
        aria-expanded={open}
        className={cn(
          "fixed bottom-5 right-5 z-[80] flex h-14 w-14 items-center justify-center rounded-full shadow-chat transition-all duration-300 hover:scale-105 active:scale-95 sm:bottom-6 sm:right-6",
          open ? "bg-ink text-ivory" : "bg-pine text-ivory"
        )}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-6 w-6" />}
        {!open && hasNew && (
          <>
            <span className="absolute inset-0 rounded-full bg-pine animate-pulse-ring" aria-hidden />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-hot text-[10px] font-bold text-white" aria-hidden>
              1
            </span>
          </>
        )}
      </button>

      {open && <div className="fixed inset-0 z-[70] bg-ink/10" onClick={closeChat} aria-hidden />}
      {/* Panel */}
      <section
        ref={panelRef}
        role="dialog"
        aria-modal={open ? true : undefined}
        aria-hidden={!open}
        inert={!open}
        aria-label={`${BRAND.assistantName} virtual assistant`}
        className={cn(
          "fixed z-[80] flex flex-col overflow-hidden border border-line bg-ivory shadow-chat transition-all duration-300",
          "bottom-0 right-0 h-[100dvh] w-full sm:bottom-24 sm:right-6 sm:h-[min(660px,calc(100dvh-8rem))] sm:w-[400px] sm:rounded-3xl",
          open
            ? "pointer-events-auto translate-y-0 opacity-100 sm:scale-100"
            : "pointer-events-none translate-y-4 opacity-0 sm:scale-95"
        )}
      >
        {/* Header */}
        <div className="border-b border-line bg-white px-5 pb-3 pt-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-pine text-ivory">
                <Sparkles className="h-4.5 w-4.5 h-[18px] w-[18px]" aria-hidden />
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-success" aria-hidden />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink">
                {BRAND.assistantName}
                <span className="ml-2 rounded-full bg-champagne px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brass-dark">
                  AI
                </span>
              </p>
              <p className="text-xs text-ink-muted">
                {BRAND.assistantRole} · online now
              </p>
            </div>
            <button
              type="button"
              onClick={reset}
              disabled={typing}
              className="rounded-full p-2 text-ink-muted transition-colors hover:bg-champagne hover:text-ink"
              aria-label="Restart conversation"
              title="Restart conversation"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-2 text-ink-muted transition-colors hover:bg-champagne hover:text-ink sm:hidden"
              aria-label="Close"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
          {/* Qualification progress */}
          <div className="mt-3">
            <div className="h-1 overflow-hidden rounded-full bg-champagne">
              <div
                className="h-full rounded-full bg-brass transition-all duration-700 ease-out"
                style={{ width: `${Math.max(progress * 100, started ? 6 : 0)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="scrollbar-thin flex-1 space-y-4 overflow-y-auto px-4 py-4"
          aria-live="polite"
        >
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} onHandoff={handleHandoff} handoffState={handoff} />
          ))}
          {typing && (
            <div className="flex justify-start">
              <TypingIndicator />
            </div>
          )}
        </div>

        {failedMessage && !typing && (
        <button type="button" className="mx-4 mb-2 rounded-lg border border-line p-2 text-sm font-medium" onClick={() => void send(failedMessage.value, failedMessage.inputType, failedMessage.label, failedMessage.requestId)}>Retry last message</button>
      )}
      {!typing && state.intent && !state.completed && (
        <button type="button" className="mx-4 mb-2 self-start text-xs font-medium text-brass-dark underline" onClick={() => void send("__edit__", "option", "Change an earlier answer")}>Change an earlier answer</button>
      )}
        {/* Quick replies */}
        {quickReplies.length > 0 && !typing && (
          <div className="max-h-[35dvh] shrink-0 overflow-y-auto flex flex-wrap gap-1.5 border-t border-line bg-white px-4 pt-3">
            {quickReplies.map((q) => (
              <button
                key={q.value}
                type="button"
                onClick={() => {
                  setQuickReplies([]);
                  void send(q.value, "option", q.label);
                }}
                className={cn(
                  "rounded-full border border-line bg-white px-3.5 py-2 text-[13px] font-medium text-ink-soft transition-all hover:border-brass hover:bg-champagne/50 hover:text-ink",
                  quickReplyLabels.has(q.value) && "animate-fade-in"
                )}
              >
                {q.label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form
          className="flex items-center gap-2 border-t border-line bg-white p-3"
          onSubmit={(e) => {
            e.preventDefault();
            const value = input.trim();
            if (!value || typing) return;
            setInput("");
            void send(value, "text");
          }}
        >
          <label htmlFor="chat-input" className="sr-only">
            Write your message
          </label>
          <input
            id="chat-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            autoComplete="off"
            maxLength={600}
            className="input-field !rounded-full !py-2.5"
          />
          <button
            type="submit"
            disabled={!input.trim() || typing}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-ivory transition-all hover:bg-pine disabled:opacity-40"
            aria-label="Send message"
          >
            <SendHorizonal className="h-4 w-4" aria-hidden />
          </button>
        </form>
      </section>
    </>
  );
}

function MessageBubble({
  msg,
  onHandoff,
  handoffState,
}: {
  msg: UiMessage;
  onHandoff: (leadId: string) => void;
  handoffState: "idle" | "loading" | "done";
}) {
  if (msg.fromUser) {
    return (
      <div className="flex justify-end animate-fade-up">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-sm leading-relaxed text-ivory">
          {msg.kind === "text" ? msg.text : ""}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start animate-fade-up">
      <div className="max-w-[92%]">
        <div
          className={cn(
            "rounded-2xl rounded-bl-md px-4 py-3 text-sm leading-relaxed",
            msg.kind === "result" ? "border border-brass/30 bg-white" : "bg-champagne/80"
          )}
        >
          {msg.kind === "result" && (
            <span
              className={cn(
                "mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                classificationStyles[msg.classification]
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
              {msg.classification === "HOT" ? "High intent" : msg.classification === "WARM" ? "Well defined" : "Early stage"} profile
            </span>
          )}
          <p className="text-ink-soft">{msg.text}</p>

          {msg.kind === "properties" && (
            <div className="mt-3 space-y-2">
              {msg.properties.map((p) => (
                <MiniPropertyCard key={p.id} property={p} />
              ))}
            </div>
          )}

          {msg.kind === "result" && (
            <ResultActions msg={msg} onHandoff={onHandoff} handoffState={handoffState} />
          )}
        </div>
      </div>
    </div>
  );
}
