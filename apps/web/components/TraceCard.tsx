"use client";

import type { TraceListItem } from "@/lib/types";

const VERDICT_STYLES: Record<string, string> = {
  approved: "text-pass border-pass",
  blocked: "text-fail border-fail",
  escalated: "text-warn border-warn",
};

export function TraceCard({ trace }: { trace: TraceListItem }) {
  const verdict = trace.final_verdict;
  const style = VERDICT_STYLES[verdict] || "text-ink-dim border-ink-faint";
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
      className="block border-b border-rule py-5 px-2 no-underline hover:bg-bg-elev transition-colors group"
    >
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          <p className="text-ink text-sm font-serif leading-relaxed truncate">
            &ldquo;{trace.query}&rdquo;
          </p>
          <div className="flex items-center gap-4 mt-2 text-xs text-ink-faint tracking-wide">
            <span>{dateStr} {timeStr}</span>
            <span>{trace.total_latency_ms}ms</span>
            <span className="uppercase text-ink-faint">{trace.primary_model}</span>
          </div>
        </div>
        <span
          className={`text-[10px] tracking-[0.2em] uppercase border px-3 py-1 ${style}`}
        >
          {verdict}
        </span>
      </div>
    </a>
  );
}
