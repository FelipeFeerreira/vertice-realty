"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bot,
  CalendarCheck,
  ClipboardList,
  Database,
  Flame,
  Mail,
  MessageCircle,
  MousePointerClick,
  RefreshCcw,
  Sprout,
  UserRound,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FlowNode {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  tone: "neutral" | "hot" | "nurture" | "accent";
}

const sharedStart: FlowNode[] = [
  { icon: UserRound, title: "Website visitor", subtitle: "Arrives without speaking to an agent", tone: "neutral" },
  { icon: MousePointerClick, title: "Property interest", subtitle: "Browses, filters, and saves listings", tone: "neutral" },
  { icon: Bot, title: "Maya — AI Concierge", subtitle: "Natural conversation, 24/7", tone: "accent" },
  { icon: ClipboardList, title: "Qualification", subtitle: "Needs, budget, timeline, readiness", tone: "accent" },
];

const hotPath: FlowNode[] = [
  { icon: Flame, title: "Qualified lead", subtitle: "High intent → prioritized", tone: "hot" },
  { icon: Database, title: "CRM", subtitle: "Structured lead record", tone: "neutral" },
  { icon: MessageCircle, title: "WhatsApp alert", subtitle: "Agent notified in seconds", tone: "hot" },
  { icon: CalendarCheck, title: "Viewing scheduled", subtitle: "Time added to the calendar", tone: "hot" },
  { icon: UserCheck, title: "Personal follow-up", subtitle: "Agent takes over with context", tone: "hot" },
];

const nurturePath: FlowNode[] = [
  { icon: Sprout, title: "Early-stage lead", subtitle: "No urgency → no pressure", tone: "nurture" },
  { icon: Database, title: "CRM", subtitle: "Preferences saved for later", tone: "neutral" },
  { icon: Mail, title: "Email nurture", subtitle: "Relevant, automated follow-up", tone: "nurture" },
  { icon: RefreshCcw, title: "Requalification", subtitle: "Reconnect when they're ready", tone: "nurture" },
];

const toneStyles: Record<FlowNode["tone"], { card: string; icon: string }> = {
  neutral: { card: "border-line bg-white", icon: "bg-champagne text-ink-soft" },
  accent: { card: "border-brass/40 bg-white", icon: "bg-brass/15 text-brass-dark" },
  hot: { card: "border-hot/25 bg-white", icon: "bg-hot/10 text-hot" },
  nurture: { card: "border-nurture/25 bg-white", icon: "bg-nurture/10 text-nurture" },
};

function Node({ node, delay, visible }: { node: FlowNode; delay: number; visible: boolean }) {
  const Icon = node.icon;
  return (
    <div
      className={cn(
        "flex items-center gap-3.5 rounded-2xl border p-3.5 shadow-card transition-all duration-700",
        toneStyles[node.tone].card,
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", toneStyles[node.tone].icon)}>
        <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-tight text-ink">{node.title}</p>
        <p className="mt-0.5 text-xs leading-snug text-ink-muted">{node.subtitle}</p>
      </div>
    </div>
  );
}

function Connector({ animated, visible }: { animated?: boolean; visible: boolean }) {
  return (
    <div className="relative mx-auto h-8 w-px bg-line" aria-hidden>
      {animated && visible && (
        <span className="absolute left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-brass animate-flow-dot" />
      )}
    </div>
  );
}

function PathColumn({
  label,
  labelClass,
  nodes,
  visible,
  baseDelay,
}: {
  label: string;
  labelClass: string;
  nodes: FlowNode[];
  visible: boolean;
  baseDelay: number;
}) {
  return (
    <div>
      <p className={cn("mb-4 text-center text-[11px] font-bold uppercase tracking-[0.2em]", labelClass)}>
        {label}
      </p>
      <div className="space-y-0">
        {nodes.map((node, i) => (
          <div key={node.title}>
            <Node node={node} delay={baseDelay + i * 120} visible={visible} />
            {i < nodes.length - 1 && <Connector animated visible={visible} />}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AutomationFlow() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="mx-auto max-w-4xl">
      {/* Shared start */}
      <div className="mx-auto max-w-sm">
        {sharedStart.map((node, i) => (
          <div key={node.title}>
            <Node node={node} delay={i * 120} visible={visible} />
            <Connector animated visible={visible} />
          </div>
        ))}
      </div>

      {/* Split */}
      <div className="relative mx-auto mb-2 mt-0 max-w-3xl" aria-hidden>
        <svg viewBox="0 0 600 60" className="h-14 w-full" fill="none" preserveAspectRatio="none">
          <path
            d="M300 0 C300 30 150 30 150 60 M300 0 C300 30 450 30 450 60"
            stroke="#E6E0D4"
            strokeWidth="2"
            className={cn("transition-all duration-1000", visible ? "opacity-100" : "opacity-0")}
          />
          {visible && (
            <>
              <circle r="3.5" fill="#B4432F">
                <animateMotion dur="2.2s" repeatCount="indefinite" path="M300 0 C300 30 150 30 150 60" />
              </circle>
              <circle r="3.5" fill="#5F7A93">
                <animateMotion dur="2.2s" begin="1.1s" repeatCount="indefinite" path="M300 0 C300 30 450 30 450 60" />
              </circle>
            </>
          )}
        </svg>
      </div>

      {/* Two paths */}
      <div className="grid gap-8 sm:grid-cols-2">
        <PathColumn
          label="PATH A · READY TO ACT"
          labelClass="text-hot"
          nodes={hotPath}
          visible={visible}
          baseDelay={500}
        />
        <PathColumn
          label="PATH B · STILL EXPLORING"
          labelClass="text-nurture"
          nodes={nurturePath}
          visible={visible}
          baseDelay={700}
        />
      </div>
    </div>
  );
}
