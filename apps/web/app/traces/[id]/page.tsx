"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Trace } from "@/lib/types";
import { getTrace } from "@/lib/api";
import { PipelineRail } from "@/components/PipelineRail";
import { CheckGrid } from "@/components/CheckGrid";

const VERDICT_STYLES: Record<string, string> = {
  approved: "text-pass border-pass",
  blocked: "text-fail border-fail",
  escalated: "text-warn border-warn",
};

function formatAum(paise: number): string {
  const crore = paise / 1_00_00_000;
  if (crore >= 1) return `${crore.toFixed(1)} Cr`;
  const lakh = paise / 1_00_000;
  return `${lakh.toFixed(1)} L`;
}

export default function TraceDetailPage() {
  const params = useParams();
  const [trace, setTrace] = useState<Trace | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      getTrace(params.id as string)
        .then(setTrace)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto px-8 py-16">
        <p className="text-ink-dim text-sm">Loading trace...</p>
      </div>
    );
  }

  if (!trace) {
    return (
      <div className="max-w-[1400px] mx-auto px-8 py-16">
        <p className="text-fail text-sm">Trace not found.</p>
      </div>
    );
  }

  const profile = trace.client_profile;
  const verdict = trace.final_verdict;
  const verdictStyle = VERDICT_STYLES[verdict] || "text-ink-dim border-ink-faint";
  const reasoning = trace.steps.find((s) => s.step_name === "reasoning");
  const compliance = trace.steps.find((s) => s.step_name === "compliance");
  const reasoningExcerpt = reasoning?.payload?.primary_response as string | undefined;
  const violations = (compliance?.payload?.violations as Array<Record<string, string>>) ?? [];

  return (
    <div className="max-w-[1400px] mx-auto px-8 py-16">
      <div className="mb-12">
        <span className="text-gold font-serif italic text-sm tracking-wide">
          &#9671; III
        </span>
        <h1 className="font-serif text-3xl md:text-4xl text-ink mt-2 tracking-tight">
          One decision, <em className="italic">traced end to end.</em>
        </h1>
        <div className="flex items-center gap-4 mt-3 text-xs text-ink-faint tracking-[0.1em] uppercase">
          <span>Trace ID &middot; {trace.id.slice(0, 8)}</span>
          <span>{new Date(trace.created_at).toLocaleDateString("en-IN")}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-0">
        {/* Left: Pipeline Rail */}
        <div className="border-r border-rule pr-6">
          <PipelineRail steps={trace.steps} />
        </div>

        {/* Right: Detail Panel */}
        <div className="pl-8">
          {/* Client Header */}
          <div className="border border-rule p-6 mb-6 relative"
               style={{
                 borderImage: `linear-gradient(135deg, #c4a572 8px, #1a1a1a 8px, #1a1a1a calc(100% - 8px), #c4a572 calc(100% - 8px)) 1`,
               }}>
            <div className="flex items-start justify-between">
              <div className="text-xs text-ink-dim tracking-[0.15em] uppercase flex items-center gap-3 flex-wrap">
                {profile && (
                  <>
                    <span>Client &middot; {profile.display_name}</span>
                    <span>&middot;</span>
                    <span>{profile.risk_profile}</span>
                    <span>&middot;</span>
                    <span>{profile.business_risk && typeof profile.business_risk === "object"
                      ? (profile.business_risk as Record<string, string>).sector || "Diversified"
                      : "Diversified"
                    } Sect</span>
                    <span>&middot;</span>
                    <span>&#8377;{formatAum(profile.aum_inr)} AUM</span>
                  </>
                )}
              </div>
              <span
                className={`text-[10px] tracking-[0.2em] uppercase border px-3 py-1 shrink-0 ${verdictStyle}`}
              >
                {verdict} &middot; {verdict === "blocked" ? "pre-client" : "delivered"}
              </span>
            </div>

            {/* Query */}
            <div className="mt-6 border-l-2 border-gold pl-4">
              <p className="font-serif text-xl text-ink italic leading-relaxed">
                &ldquo;{trace.query}&rdquo;
              </p>
            </div>
          </div>

          {/* Check Grid */}
          <CheckGrid steps={trace.steps} />

          {/* Reasoning Excerpt */}
          {reasoningExcerpt && (
            <div className="mt-6 border border-rule p-6"
                 style={{
                   borderImage: `linear-gradient(135deg, #c4a572 8px, #1a1a1a 8px, #1a1a1a calc(100% - 8px), #c4a572 calc(100% - 8px)) 1`,
                 }}>
              <h3 className="text-[10px] tracking-[0.2em] uppercase text-gold mb-4">
                Model reasoning excerpt
              </h3>
              <blockquote className="border-l-2 border-gold pl-4 font-serif text-sm text-ink-dim italic leading-relaxed">
                &ldquo;{reasoningExcerpt.slice(0, 500)}
                {reasoningExcerpt.length > 500 ? "..." : ""}&rdquo;
              </blockquote>
            </div>
          )}

          {/* Verdict Footer */}
          {verdict === "blocked" && (
            <div className="mt-6 flex items-center gap-4 text-xs">
              <span className="text-fail">
                Recommendation withheld for human reviewer.
              </span>
              <div className="flex gap-2 flex-wrap">
                <span className="text-ink-faint">Reason &middot;</span>
                {violations.map((v, i) => (
                  <span
                    key={i}
                    className="text-[10px] tracking-[0.15em] uppercase border border-fail text-fail px-2 py-0.5"
                  >
                    {v.violation_type}
                  </span>
                ))}
                {trace.steps
                  .filter((s) => s.status === "fail" && s.step_name !== "compliance")
                  .map((s) => (
                    <span
                      key={s.id}
                      className="text-[10px] tracking-[0.15em] uppercase border border-fail text-fail px-2 py-0.5"
                    >
                      {s.step_name.toUpperCase()}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Latency Bar */}
          <div className="mt-8 flex items-center gap-4 text-xs text-ink-faint">
            <span>Total latency &middot; {trace.total_latency_ms}ms</span>
            <span>&middot;</span>
            <span>Primary &middot; {trace.primary_model}</span>
            <span>&middot;</span>
            <span>Cross-check &middot; {trace.cross_check_model}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
