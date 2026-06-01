"use client";

import type { TraceListItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ChevronRight, Clock, Shield, AlertTriangle, CheckCircle2 } from "lucide-react";

const VERDICT_STYLES: Record<string, { 
  dot: string; 
  badge: string; 
  label: string;
  icon: any;
  iconColor: string;
}> = {
  approved: {
    dot: "bg-pass",
    badge: "text-pass border-pass/30 bg-pass/5",
    label: "Approved",
    icon: CheckCircle2,
    iconColor: "text-pass",
  },
  blocked: {
    dot: "bg-fail",
    badge: "text-fail border-fail/30 bg-fail/5",
    label: "Blocked",
    icon: Shield,
    iconColor: "text-fail",
  },
  escalated: {
    dot: "bg-warn",
    badge: "text-warn border-warn/30 bg-warn/5",
    label: "Escalated",
    icon: AlertTriangle,
    iconColor: "text-warn",
  },
};

const DEFAULT_STYLE = {
  dot: "bg-ink-faint",
  badge: "text-ink-dim border-ink-faint",
  label: "Unknown",
  icon: Clock,
  iconColor: "text-ink-faint",
};

export function TraceCard({ trace }: { trace: TraceListItem }) {
  const verdict = trace.final_verdict;
  const vs = VERDICT_STYLES[verdict] || DEFAULT_STYLE;
  const Icon = vs.icon;
  
  const date = new Date(trace.created_at);
  const timeStr = date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateStr = date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });

  return (
    <a
      href={`/traces/${trace.id}`}
      className="block no-underline group"
    >
      <div className={cn(
        "relative overflow-hidden border border-rule transition-all duration-300",
        "bg-bg-card/50 backdrop-blur-sm",
        "group-hover:bg-bg-elev group-hover:border-rule-bright group-hover:shadow-[0_0_30px_rgba(212,169,106,0.03)]",
        "p-6"
      )}>
        {/* Subtle accent line on hover */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            {/* Top row: ID and Date */}
            <div className="flex items-center gap-3 mb-4">
              <div className={cn("p-1.5 rounded-sm border border-rule bg-bg/50", vs.iconColor)}>
                <Icon size={12} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] tracking-[0.2em] uppercase text-ink-faint font-mono">
                TRC-{trace.id.slice(0, 8)}
              </span>
              <span className="text-rule-bright text-[10px]">&middot;</span>
              <span className="text-[10px] tracking-wide text-ink-dim uppercase">
                {dateStr} &middot; {timeStr}
              </span>
            </div>

            {/* Query */}
            <h3 className="text-ink text-lg font-serif italic leading-snug mb-4 group-hover:text-ink transition-colors">
              &ldquo;{trace.query}&rdquo;
            </h3>

            {/* Bottom row: Meta and Status */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-ink-faint">
                <Clock size={10} />
                <span className="text-[10px] tracking-wide font-mono">
                  {trace.total_latency_ms.toLocaleString()}ms
                </span>
              </div>
              <span className="text-rule-bright text-[10px]">&middot;</span>
              <span className="text-[10px] tracking-[0.1em] uppercase text-ink-faint font-medium">
                {trace.primary_model}
              </span>
            </div>
          </div>

          {/* Right side: Badge and Chevron */}
          <div className="flex flex-col items-end justify-between self-stretch">
            <span className={cn(
              "text-[9px] tracking-[0.25em] uppercase border px-2.5 py-1.5 font-bold transition-colors",
              vs.badge
            )}>
              {vs.label}
            </span>
            <ChevronRight 
              size={16} 
              className="text-ink-faint group-hover:text-gold group-hover:translate-x-1 transition-all" 
            />
          </div>
        </div>
      </div>
    </a>
  );
}

