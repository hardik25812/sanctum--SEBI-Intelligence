"use client";

import type { TraceStep } from "@/lib/types";
import { cn } from "@/lib/utils";
import { 
  FileSearch, 
  Share2, 
  BrainCircuit, 
  SearchCode, 
  ShieldCheck, 
  Send 
} from "lucide-react";

const STEP_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  intake: { icon: FileSearch, color: "text-ink", label: "Intake" },
  distribution: { icon: Share2, color: "text-ink", label: "Distribution" },
  reasoning: { icon: BrainCircuit, color: "text-ink", label: "Reasoning" },
  grounding: { icon: SearchCode, color: "text-ink", label: "Grounding" },
  compliance: { icon: ShieldCheck, color: "text-gold", label: "Compliance" },
  audit: { icon: Send, color: "text-ink", label: "Audit" },
};

const STATUS_COLOR: Record<string, string> = {
  pass: "bg-pass",
  fail: "bg-fail",
  skipped: "bg-ink-faint",
};

function stepDescription(step: TraceStep): string {
  const p = step.payload || {};
  switch (step.step_name) {
    case "intake":
      return p.risk_profile ? "Triple risk profile parsed" : "Profile parsed";
    case "distribution":
      return p.in_distribution ? "In distribution" : "Out of distribution";
    case "reasoning":
      return "Primary advisory & cross-check completed";
    case "grounding":
      return p.total_claims !== undefined ? `${p.grounded_claims} / ${p.total_claims} claims verified` : "Grounding check";
    case "compliance":
      return p.violations && Array.isArray(p.violations) && (p.violations as any[]).length > 0 
        ? "Compliance violation detected" 
        : "Institutional standards met";
    case "audit":
      return "Audit trail generated & finalized";
    default:
      return step.step_name;
  }
}

export function PipelineRail({ steps }: { steps: TraceStep[] }) {
  return (
    <div className="relative pl-2 py-4">
      {/* Vertical line */}
      <div className="absolute left-[21px] top-8 bottom-8 w-px bg-rule/50" />
      
      <div className="flex flex-col gap-8">
        {steps.map((step) => {
          const config = STEP_CONFIG[step.step_name] || { icon: FileSearch, color: "text-ink", label: step.step_name };
          const Icon = config.icon;
          const statusColor = STATUS_COLOR[step.status] || "bg-ink-faint";
          
          return (
            <div key={step.id} className="relative flex gap-6 items-start group">
              {/* Dot and line attachment */}
              <div className="relative z-10 flex flex-col items-center mt-1">
                <div className={cn(
                  "w-10 h-10 rounded-full border border-rule flex items-center justify-center transition-all duration-300",
                  "bg-bg group-hover:bg-bg-elev group-hover:border-rule-bright",
                  step.status === "fail" && "border-fail/50 ring-4 ring-fail/5",
                  step.status === "pass" && "border-pass/20"
                )}>
                  <Icon size={16} className={cn(config.color, step.status === "skipped" && "opacity-30")} />
                </div>
                {/* Status indicator dot */}
                <div className={cn(
                  "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-bg",
                  statusColor
                )} />
              </div>

              <div className="flex-1 min-w-0 pb-6 border-b border-rule/30 last:border-0 group-hover:border-rule-bright/30 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-serif text-lg text-ink tracking-tight">{config.label}</h4>
                  <span className="text-[10px] font-mono text-ink-faint uppercase tracking-widest">
                    {step.latency_ms}ms
                  </span>
                </div>
                <p className="text-xs text-ink-dim font-serif italic mb-2">
                  {stepDescription(step)}
                </p>
                {step.status === "fail" && step.failure_reason && (
                  <div className="mt-3 p-3 bg-fail/5 border border-fail/20 rounded-sm">
                    <p className="text-[10px] text-fail uppercase tracking-widest font-bold mb-1">Failure Protocol</p>
                    <p className="text-xs text-fail/80 leading-relaxed font-mono">{step.failure_reason}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

