"use client";

import { useEffect, useState } from "react";
import type { EvalRun } from "@/lib/types";
import { getEvalRuns } from "@/lib/api";
import { EvalTable } from "@/components/EvalTable";

export default function EvalsPage() {
  const [runs, setRuns] = useState<EvalRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEvalRuns()
      .then(setRuns)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto px-8 py-16">
      <div className="mb-12">
        <span className="text-gold font-serif italic text-sm tracking-wide">
          &#9671; III
        </span>
        <h1 className="font-serif text-3xl md:text-4xl text-ink mt-2 tracking-tight">
          The eval suite, <em className="italic">always running.</em>
        </h1>
        <div className="flex items-center gap-4 mt-3 text-xs text-ink-faint tracking-[0.1em] uppercase">
          <span>Last run &middot; {runs.length > 0 ? "recent" : "never"}</span>
          <span>&middot;</span>
          <span>Auto every commit</span>
        </div>
      </div>

      {loading ? (
        <p className="text-ink-dim text-sm">Loading eval results...</p>
      ) : runs.length === 0 ? (
        <p className="text-ink-dim text-sm">
          No eval runs yet. Run <code className="font-mono text-gold">python evals/runner.py --suite all</code> to generate results.
        </p>
      ) : (
        <EvalTable runs={runs} />
      )}
    </div>
  );
}
