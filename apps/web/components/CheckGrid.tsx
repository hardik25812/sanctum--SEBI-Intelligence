"use client";

import type { TraceStep } from "@/lib/types";

interface CheckItem {
  label: string;
  value: string;
  detail: string;
  passed: boolean;
}

function extractChecks(steps: TraceStep[]): CheckItem[] {
  const distribution = steps.find((s) => s.step_name === "distribution");
  const grounding = steps.find((s) => s.step_name === "grounding");
  const reasoning = steps.find((s) => s.step_name === "reasoning");
  const compliance = steps.find((s) => s.step_name === "compliance");

  const checks: CheckItem[] = [];

  if (distribution) {
    const p = distribution.payload;
    checks.push({
      label: "Distribution",
      value: p.in_distribution ? "In distribution" : "Out of distribution",
      detail: `OOD score \u00b7 ${(p.ood_score as number)?.toFixed(2) ?? "—"} \u00b7 Threshold \u00b7 0.40`,
      passed: distribution.status === "pass",
    });
  }

  if (grounding) {
    const p = grounding.payload;
    checks.push({
      label: "Citation grounding",
      value: `${p.grounded_claims ?? 0} of ${p.total_claims ?? 0} sources verified`,
      detail: `SEBI IA Reg. \u00b7 AMFI \u00b7 Audit DD`,
      passed: grounding.status === "pass",
    });
  }

  if (reasoning) {
    const p = reasoning.payload;
    checks.push({
      label: "Adversarial divergence",
      value: `${((p.divergence_score as number) ?? 0).toFixed(2)}`,
      detail: `Divergence \u00b7 ${(p.divergence_score as number) <= 0.35 ? "within" : "exceeds"} threshold \u00b7 0.35`,
      passed: (p.divergence_score as number) <= 0.35,
    });
  }

  if (compliance) {
    const p = compliance.payload;
    const violations = (p.violations as Array<Record<string, string>>) ?? [];
    checks.push({
      label: "SEBI compliance",
      value:
        violations.length > 0
          ? `Violation \u00b7 IA Reg. ${violations[0]?.rule_id?.split("_").pop() ?? ""}`
          : `${p.total_rules_checked ?? 0} / ${p.total_rules_checked ?? 0} passed`,
      detail:
        violations.length > 0
          ? violations.map((v) => v.violation_type).join(", ")
          : "All deterministic + LLM-judge rules passed",
      passed: compliance.status === "pass",
    });
  }

  return checks;
}

export function CheckGrid({ steps }: { steps: TraceStep[] }) {
  const checks = extractChecks(steps);

  return (
    <div className="grid grid-cols-2 gap-px bg-rule">
      {checks.map((check) => (
        <div key={check.label} className="bg-bg-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`text-[10px] tracking-[0.15em] uppercase ${
                check.passed ? "text-pass" : "text-fail"
              }`}
            >
              {check.passed ? "\u25cf" : "\u25cf"} {check.label}
            </span>
          </div>
          <p
            className={`font-serif text-base ${
              check.passed ? "text-ink" : "text-fail"
            }`}
          >
            {check.value}
          </p>
          <p className="text-ink-faint text-[10px] tracking-wide mt-1 uppercase">
            {check.detail}
          </p>
        </div>
      ))}
    </div>
  );
}
