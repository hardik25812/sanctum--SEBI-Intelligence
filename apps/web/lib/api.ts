import type { Trace, TraceListItem, ClientProfile, EvalRun } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchJSON<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function getTraces(): Promise<TraceListItem[]> {
  return fetchJSON<TraceListItem[]>("/api/traces");
}

export async function getTrace(id: string): Promise<Trace> {
  return fetchJSON<Trace>(`/api/traces/${id}`);
}

export async function getProfiles(): Promise<ClientProfile[]> {
  return fetchJSON<ClientProfile[]>("/api/profiles");
}

export async function submitIntake(
  clientProfileId: string,
  query: string
): Promise<Trace> {
  return fetchJSON<Trace>("/api/intake", {
    method: "POST",
    body: JSON.stringify({
      client_profile_id: clientProfileId,
      query,
    }),
  });
}

export async function getEvalRuns(): Promise<EvalRun[]> {
  return fetchJSON<EvalRun[]>("/api/evals");
}
