"use client";

import { useEffect, useState } from "react";
import type { TraceListItem } from "@/lib/types";
import { getTraces } from "@/lib/api";
import { TraceCard } from "@/components/TraceCard";

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

  return (
    <div className="max-w-[1400px] mx-auto px-8 py-16">
      <div className="mb-12">
        <span className="text-gold font-serif italic text-sm tracking-wide">
          &#9671; II
        </span>
        <h1 className="font-serif text-4xl md:text-5xl text-ink mt-2 tracking-tight">
          All traces.
        </h1>
      </div>

      <div className="flex gap-6 mb-10 text-xs tracking-[0.15em] uppercase">
        {["all", "approved", "blocked", "escalated"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`bg-transparent border-none cursor-pointer transition-colors ${
              filter === f ? "text-ink" : "text-ink-faint hover:text-ink-dim"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-ink-dim text-sm">Loading traces...</p>
      ) : filtered.length === 0 ? (
        <p className="text-ink-dim text-sm">
          No traces yet. Submit a query from the{" "}
          <a href="/intake" className="text-gold">
            intake form
          </a>
          .
        </p>
      ) : (
        <div className="flex flex-col gap-0">
          {filtered.map((trace) => (
            <TraceCard key={trace.id} trace={trace} />
          ))}
        </div>
      )}
    </div>
  );
}
