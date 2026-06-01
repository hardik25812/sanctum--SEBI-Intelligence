"use client";

import { useEffect, useState } from "react";
import type { TraceListItem } from "@/lib/types";
import { getTraces } from "@/lib/api";
import { TraceCard } from "@/components/TraceCard";
import { cn } from "@/lib/utils";
import { Activity, ShieldCheck, AlertTriangle, XCircle, Search } from "lucide-react";

const FILTERS = ["all", "approved", "blocked", "escalated"] as const;

export default function TracesPage() {
  const [traces, setTraces] = useState<TraceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    getTraces()
      .then(setTraces)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = traces
    .filter((t) => (filter === "all" ? true : t.final_verdict === filter))
    .filter((t) => t.query.toLowerCase().includes(searchQuery.toLowerCase()));

  const stats = {
    total: traces.length,
    approved: traces.filter((t) => t.final_verdict === "approved").length,
    blocked: traces.filter((t) => t.final_verdict === "blocked").length,
    escalated: traces.filter((t) => t.final_verdict === "escalated").length,
    avgLatency: traces.length > 0 
      ? Math.round(traces.reduce((acc, t) => acc + t.total_latency_ms, 0) / traces.length) 
      : 0,
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12 lg:py-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-1 rounded-full bg-gold" />
            <span className="text-gold font-mono text-[10px] tracking-[0.3em] uppercase">Auditor Insight</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-ink tracking-tight mb-4">
            Regulatory <em className="italic">Trace Ledger</em>
          </h1>
          <p className="text-ink-dim text-base font-serif italic">
            Monitoring every advisory query through the six-layer Sanctum pipeline.
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-rule border border-rule mb-16">
        <div className="bg-bg-card p-6">
          <div className="flex items-center gap-2 text-ink-faint mb-2">
            <Activity size={14} />
            <span className="text-[10px] tracking-widest uppercase font-mono">Total Traces</span>
          </div>
          <p className="text-3xl font-serif text-ink">{stats.total}</p>
        </div>
        <div className="bg-bg-card p-6">
          <div className="flex items-center gap-2 text-pass mb-2">
            <ShieldCheck size={14} />
            <span className="text-[10px] tracking-widest uppercase font-mono">Approved</span>
          </div>
          <p className="text-3xl font-serif text-ink">{stats.approved}</p>
        </div>
        <div className="bg-bg-card p-6">
          <div className="flex items-center gap-2 text-fail mb-2">
            <XCircle size={14} />
            <span className="text-[10px] tracking-widest uppercase font-mono">Blocked</span>
          </div>
          <p className="text-3xl font-serif text-ink">{stats.blocked}</p>
        </div>
        <div className="bg-bg-card p-6">
          <div className="flex items-center gap-2 text-warn mb-2">
            <AlertTriangle size={14} />
            <span className="text-[10px] tracking-widest uppercase font-mono">Avg Latency</span>
          </div>
          <p className="text-3xl font-serif text-ink">{stats.avgLatency}<span className="text-sm ml-1 text-ink-faint uppercase font-sans">ms</span></p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10 pb-6 border-b border-rule">
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-5 py-2.5 text-[10px] tracking-[0.2em] uppercase transition-all duration-200",
                filter === f
                  ? "bg-gold text-bg font-bold"
                  : "bg-bg-card text-ink-faint hover:text-ink hover:bg-bg-elev"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="relative group max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint group-focus-within:text-gold transition-colors" size={14} />
          <input 
            type="text"
            placeholder="Search queries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-bg-card/50 border border-rule py-2.5 pl-10 pr-4 text-[11px] text-ink placeholder:text-ink-faint focus:outline-none focus:border-gold transition-all"
          />
        </div>
      </div>

      {/* List Section */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-bg-card/50 animate-pulse border border-rule" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-rule border-dashed p-20 text-center bg-bg-card/20">
          <p className="text-ink-dim font-serif italic mb-6">No ledger entries match your criteria.</p>
          <a href="/intake" className="inline-block border border-gold text-gold px-8 py-3 text-[10px] tracking-[0.2em] uppercase hover:bg-gold hover:text-bg transition-all">
            Initiate Intake Pipeline
          </a>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((trace) => (
            <TraceCard key={trace.id} trace={trace} />
          ))}
        </div>
      )}
    </div>
  );
}

