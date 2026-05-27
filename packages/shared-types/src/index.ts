export interface ClientProfile {
  id: string;
  created_at: string;
  display_name: string;
  aum_inr: number;
  business_risk: Record<string, unknown>;
  income_risk: Record<string, unknown>;
  balance_sheet: Record<string, unknown>;
  risk_profile: "conservative" | "moderate" | "aggressive";
  kyc_tier: "tier_1" | "tier_2" | "tier_3";
  entitlements: string[];
}

export interface TraceStep {
  id: string;
  step_number: number;
  step_name: string;
  status: "pass" | "fail" | "skipped";
  latency_ms: number;
  input_hash: string;
  output_hash: string;
  payload: Record<string, unknown>;
  failure_reason: string | null;
  created_at: string | null;
}

export interface Trace {
  id: string;
  created_at: string;
  client_profile_id: string;
  query: string;
  final_verdict: "approved" | "blocked" | "escalated";
  final_output: string | null;
  total_latency_ms: number;
  primary_model: string;
  cross_check_model: string;
  steps: TraceStep[];
  client_profile: ClientProfile | null;
}

export interface EvalRun {
  id: string;
  suite_name: string;
  git_commit: string;
  started_at: string;
  completed_at: string | null;
  total_cases: number;
  passed: number;
  failed: number;
  results: Record<string, unknown>;
}

export type Verdict = "approved" | "blocked" | "escalated";
export type StepStatus = "pass" | "fail" | "skipped";
export type RiskProfile = "conservative" | "moderate" | "aggressive";
export type KycTier = "tier_1" | "tier_2" | "tier_3";
