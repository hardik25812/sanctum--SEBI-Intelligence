"use client";

import { useEffect, useState } from "react";
import type { TraceListItem } from "@/lib/types";
import { getTraces } from "@/lib/api";
import { TraceCard } from "@/components/TraceCard";

const FILTERS = ["all", "approved", "blocked", "escalated"] as const;

export default function TracesPage() {
  const [traces, setTraces] = useState<TraceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    getTraces()
      .then(setTraces)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filter === "all"
      ? traces
      : traces.filter((t) => t.final_verdict === filter);

  const counts = {
    all: traces.length,
    approved: traces.filter((t) => t.final_verdict === "approved").length,
    blocked: traces.filter((t) => t.final_verdict === "blocked").length,
    escalated: traces.filter((t) => t.final_verdict === "escalated").length,
  };

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-gold text-sm">&#9671;</span>
          <span className="text-gold font-serif italic text-sm tracking-wide">Pipeline Traces</span>
        </div>
        <h1 className="font-serif text-3xl md:text-4xl text-ink tracking-tight">
          All traces.
        </h1>
        <p className="text-ink-dim text-sm mt-2">
          {traces.length} total &middot; Every advisory query, traced through 6 layers.
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 mb-8">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-[11px] tracking-[0.15em] uppercase border transition-all cursor-pointer ${
              filter === f
                ? "bg-bg-card border-rule-bright text-ink"
                : "bg-transparent border-rule text-ink-faint hover:text-ink-dim hover:border-rule-bright"
            }`}
          >
            {f}
            <span className="ml-2 text-ink-faint">{counts[f as keyof typeof counts]}</span>
          </button>
        ))}
      </div>

      {/* Trace list */}
      {loading ? (
        <div className="border border-rule bg-bg-card p-12 text-center">
          <p className="text-ink-dim text-sm">Loading traces...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-rule bg-bg-card p-12 text-center">
          <p className="text-ink-dim text-sm mb-2">No traces yet.</p>
          <a href="/intake" className="text-gold text-sm hover:underline">
            Submit a query from the intake form &rarr;
          </a>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((trace) => (
            <TraceCard key={trace.id} trace={trace} />
          ))}
        </div>
      )}
    </div>
  );
}
