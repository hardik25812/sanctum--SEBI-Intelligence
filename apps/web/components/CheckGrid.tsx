"use client";

import type { TraceStep } from "@/lib/types";
import { cn } from "@/lib/utils";
import { 
  Globe, 
  Search, 
  Brain, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle 
} from "lucide-react";

interface CheckItem {
  label: string;
  value: string;
  detail: string;
  passed: boolean;
  icon: any;
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
      detail: `OOD score \u00b7 ${(p.ood_score as number)?.toFixed(2) ?? "—"}`,
      passed: distribution.status === "pass",
      icon: Globe,
    });
  }

  if (grounding) {
    const p = grounding.payload;
    checks.push({
      label: "Grounding",
      value: `${p.grounded_claims ?? 0} of ${p.total_claims ?? 0} verified`,
      detail: `Citations verified against primary sources`,
      passed: grounding.status === "pass",
      icon: Search,
    });
  }

  if (reasoning) {
    const p = reasoning.payload;
    checks.push({
      label: "Divergence",
      value: `${((p.divergence_score as number) ?? 0).toFixed(2)}`,
      detail: `Adversarial cross-check variance`,
      passed: (p.divergence_score as number) <= 0.35,
      icon: Brain,
    });
  }

  if (compliance) {
    const p = compliance.payload;
    const violations = (p.violations as Array<Record<string, string>>) ?? [];
    checks.push({
      label: "Compliance",
      value: violations.length > 0 ? "Violation detected" : "Standards met",
      detail: violations.length > 0 
        ? violations[0]?.violation_type 
        : "Deterministic & LLM rules passed",
      passed: compliance.status === "pass",
      icon: ShieldAlert,
    });
  }

  return checks;
}

export function CheckGrid({ steps }: { steps: TraceStep[] }) {
  const checks = extractChecks(steps);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {checks.map((check) => {
        const Icon = check.icon;
        return (
          <div key={check.label} className="bg-bg-card/30 border border-rule p-5 relative group overflow-hidden transition-all hover:bg-bg-elev">
            <div className={cn(
              "absolute top-0 right-0 w-16 h-16 opacity-5 -mr-4 -mt-4 transition-all group-hover:opacity-10 group-hover:scale-110",
              check.passed ? "text-pass" : "text-fail"
            )}>
              <Icon size={64} />
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                check.passed ? "bg-pass shadow-[0_0_8px_rgba(134,239,172,0.4)]" : "bg-fail shadow-[0_0_8px_rgba(252,165,165,0.4)]"
              )} />
              <span className="text-[10px] tracking-[0.2em] uppercase text-ink-faint font-mono">
                {check.label}
              </span>
            </div>
            
            <p className={cn(
              "font-serif text-lg leading-tight mb-1",
              check.passed ? "text-ink" : "text-fail"
            )}>
              {check.value}
            </p>
            
            <p className="text-ink-dim text-[10px] tracking-wide font-serif italic uppercase opacity-60">
              {check.detail}
            </p>
          </div>
        );
      })}
    </div>
  );
}

