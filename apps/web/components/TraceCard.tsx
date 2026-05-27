"use client";

import type { TraceListItem } from "@/lib/types";

const VERDICT_STYLES: Record<string, { dot: string; badge: string; label: string }> = {
  approved: {
    dot: "bg-pass",
    badge: "text-pass border-pass/40 bg-pass/10",
    label: "Approved",
  },
  blocked: {
    dot: "bg-fail",
    badge: "text-fail border-fail/40 bg-fail/10",
    label: "Blocked",
  },
  escalated: {
    dot: "bg-warn",
    badge: "text-warn border-warn/40 bg-warn/10",
    label: "Escalated",
  },
};

const DEFAULT_STYLE = {
  dot: "bg-ink-faint",
  badge: "text-ink-dim border-ink-faint",
  label: "Unknown",
};

export function TraceCard({ trace }: { trace: TraceListItem }) {
  const verdict = trace.final_verdict;
  const vs = VERDICT_STYLES[verdict] || DEFAULT_STYLE;
  const date = new Date(trace.created_at);
  const timeStr = date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateStr = date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <a
      href={`/traces/${trace.id}`}
      className="block no-underline group"
    >
      <div className="border border-rule group-hover:border-rule-bright bg-bg-card group-hover:bg-bg-elev transition-all p-5 md:p-6">
        <div className="flex items-start justify-between gap-4">
          {/* Left content */}
          <div className="flex-1 min-w-0">
            {/* Status row */}
            <div className="flex items-center gap-2.5 mb-2">
              <span className={`w-2 h-2 rounded-full shrink-0 ${vs.dot}`} />
              <span className="text-[10px] tracking-[0.15em] uppercase text-ink-faint font-mono">
                {trace.id.slice(0, 8)}
              </span>
              <span className="text-ink-faint text-[10px]">&middot;</span>
              <span className="text-[10px] text-ink-faint">{dateStr} {timeStr}</span>
            </div>

            {/* Query */}
            <p className="text-ink text-[15px] font-serif leading-relaxed line-clamp-2 group-hover:text-ink/90 transition-colors">
              &ldquo;{trace.query}&rdquo;
            </p>

            {/* Meta row */}
            <div className="flex items-center gap-3 mt-3">
              <span className="text-[10px] tracking-wide text-ink-faint font-mono">
                {trace.total_latency_ms.toLocaleString()}ms
              </span>
              <span className="text-ink-faint/50 text-[10px]">&middot;</span>
              <span className="text-[10px] tracking-wide uppercase text-ink-faint">
                {trace.primary_model}
              </span>
            </div>
          </div>

          {/* Right badge */}
          <span className={`text-[10px] tracking-[0.2em] uppercase border px-3 py-1.5 shrink-0 font-mono ${vs.badge}`}>
            {vs.label}
          </span>
        </div>
      </div>
    </a>
  );
}
