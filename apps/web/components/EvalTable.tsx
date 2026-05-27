"use client";

import type { EvalRun } from "@/lib/types";

const SUITE_META: Record<
  string,
  { title: string; description: string; discipline: string }
> = {
  sebi_ia_regulations: {
    title: "SEBI \u00b7 Investment Adviser Regulations",
    description: "Reg. 15, 16, 17, 19 \u2014 fiduciary, conflict, advice quality, records",
    discipline: "Compliance",
  },
  implicit_return_guarantee: {
    title: "Implicit return guarantee detection",
    description: 'Catches "likely", "should return", "expected to deliver" framings',
    discipline: "Compliance",
  },
  citation_grounding: {
    title: "Citation grounding \u00b7 primary sources only",
    description: "Every numeric claim must trace to SEBI / RBI / AMFI / audited DD",
    discipline: "Truthfulness",
  },
  ood_intake: {
    title: "Out-of-distribution intake",
    description: "Crypto-only, F&O-leveraged, real estate flips, NRI-only edge cases",
    discipline: "Safety",
  },
  prompt_injection: {
    title: "Prompt-injection \u00b7 adversarial red team",
    description: "Jailbreaks framed as a client message, document, or attachment",
    discipline: "Security",
  },
  concentration_risk: {
    title: "Concentration / diversification floor",
    description: "No single-name > 8% \u00b7 no single-sector > 25% unless mandated",
    discipline: "Risk",
  },
  advisory_tone: {
    title: "Tone \u00b7 advisory register (no hype, no panic)",
    description: "Calibrated for Optima\u2019s calm, clear, first-principles voice",
    discipline: "Brand",
  },
};

function getStatus(passRate: number): { label: string; className: string } {
  if (passRate >= 99.5) return { label: "GREEN", className: "text-pass border-pass" };
  if (passRate >= 95) return { label: "AMBER", className: "text-warn border-warn" };
  return { label: "RED", className: "text-fail border-fail" };
}

export function EvalTable({ runs }: { runs: EvalRun[] }) {
  const latestBySuite = new Map<string, EvalRun>();
  for (const run of runs) {
    const existing = latestBySuite.get(run.suite_name);
    if (!existing || new Date(run.started_at) > new Date(existing.started_at)) {
      latestBySuite.set(run.suite_name, run);
    }
  }

  const suiteOrder = [
    "sebi_ia_regulations",
    "implicit_return_guarantee",
    "citation_grounding",
    "ood_intake",
    "prompt_injection",
    "concentration_risk",
    "advisory_tone",
  ];

  return (
    <div>
      <div className="grid grid-cols-[1fr_120px_180px_80px_80px] gap-0 border-b border-rule pb-3 mb-2">
        <span className="text-[10px] tracking-[0.2em] uppercase text-ink-faint">Suite</span>
        <span className="text-[10px] tracking-[0.2em] uppercase text-ink-faint">Discipline</span>
        <span className="text-[10px] tracking-[0.2em] uppercase text-ink-faint">Pass rate \u00b7 7d</span>
        <span className="text-[10px] tracking-[0.2em] uppercase text-ink-faint text-right">Cases</span>
        <span className="text-[10px] tracking-[0.2em] uppercase text-ink-faint text-right">Status</span>
      </div>
      {suiteOrder.map((suiteName) => {
        const run = latestBySuite.get(suiteName);
        const meta = SUITE_META[suiteName];
        if (!meta) return null;

        const passRate = run ? (run.passed / run.total_cases) * 100 : 0;
        const status = run ? getStatus(passRate) : { label: "—", className: "text-ink-faint border-ink-faint" };
        const totalRuns = runs.filter((r) => r.suite_name === suiteName).length;

        return (
          <div
            key={suiteName}
            className="grid grid-cols-[1fr_120px_180px_80px_80px] gap-0 border-b border-rule py-4 items-center"
          >
            <div>
              <p className="font-serif text-base text-ink">{meta.title}</p>
              <p className="text-ink-faint text-[11px] mt-0.5">{meta.description}</p>
            </div>
            <span className="text-ink-dim text-xs">{meta.discipline}</span>
            <span className="font-serif text-ink text-base">
              {run ? `${passRate.toFixed(1)}%` : "—"}
              <span className="text-ink-faint text-[10px] ml-1">
                / {totalRuns.toLocaleString()} runs
              </span>
            </span>
            <span className="font-serif text-ink text-xl text-right">
              {run?.total_cases ?? "—"}
            </span>
            <div className="text-right">
              <span
                className={`text-[10px] tracking-[0.2em] uppercase border px-2 py-0.5 ${status.className}`}
              >
                {status.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
