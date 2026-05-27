"use client";

import type { TraceStep } from "@/lib/types";
import { ROMAN, STEP_NAMES } from "@/lib/design-tokens";

const STATUS_COLOR: Record<string, string> = {
  pass: "bg-pass",
  fail: "bg-fail",
  skipped: "bg-ink-faint",
};

function stepDescription(step: TraceStep): string {
  const p = step.payload || {};
  switch (step.step_name) {
    case "intake":
      return p.risk_profile
        ? `Triple risk profile parsed`
        : "Profile parsed";
    case "distribution":
      return p.in_distribution
        ? `In distribution \u00b7 OOD score ${(p.ood_score as number)?.toFixed(2) ?? "—"}`
        : `Out of distribution \u00b7 OOD score ${(p.ood_score as number)?.toFixed(2) ?? "—"}`;
    case "reasoning":
      return p.divergence_score !== undefined
        ? `Claude Opus \u2014 cross-check w/ GPT`
        : "Model reasoning";
    case "grounding":
      return p.total_claims !== undefined
        ? `${p.grounded_claims} / ${p.total_claims} claims sourced`
        : "Citation check";
    case "compliance":
      return p.violations && Array.isArray(p.violations) && (p.violations as unknown[]).length > 0
        ? `Violation \u00b7 IA Reg. ${((p.violations as Array<Record<string, string>>)[0])?.rule_id?.split("_").pop() ?? ""}`
        : `${p.total_rules_checked ?? 0} / ${p.total_rules_checked ?? 0} passed`;
    case "audit":
      return p.verdict === "blocked"
        ? "Recommendation withheld"
        : "Delivered to client";
    default:
      return step.step_name;
  }
}

export function PipelineRail({ steps }: { steps: TraceStep[] }) {
  return (
    <div className="relative">
      <div className="absolute left-[7px] top-4 bottom-4 w-px bg-rule" />
      <div className="flex flex-col gap-0">
        {steps.map((step, i) => {
          const color = STATUS_COLOR[step.status] || "bg-ink-faint";
          return (
            <div key={step.id} className="relative pl-8 py-5 border-b border-rule last:border-b-0">
              <div
                className={`absolute left-0 top-6 w-[15px] h-[15px] rounded-full ${color}`}
                style={{ borderRadius: "50%" }}
              />
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-gold font-serif italic text-xs">
                  {ROMAN[i]}
                </span>
                <span className="text-ink-dim font-mono text-[10px] tracking-wider uppercase">
                  Step {String(step.step_number).padStart(2, "0")}
                </span>
              </div>
              <h3 className="font-serif text-lg text-ink">
                {STEP_NAMES[i] || step.step_name}
              </h3>
              <p className="text-ink-dim text-xs mt-1">
                {stepDescription(step)}
              </p>
              <span className="text-ink-faint text-[10px] font-mono mt-1 block">
                {step.latency_ms}ms
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
