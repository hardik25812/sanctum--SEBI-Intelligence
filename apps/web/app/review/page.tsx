"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ReviewItem {
  id: string;
  created_at: string;
  query: string;
  final_verdict: string;
  client_profile_id: string;
  total_latency_ms: number;
}

export default function ReviewPage() {
  const [queue, setQueue] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);

  async function fetchQueue() {
    setLoading(true);
    const res = await fetch(`${API_BASE}/api/review/queue`);
    const data = await res.json();
    setQueue(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchQueue();
  }, []);

  async function handleAction(traceId: string, action: string) {
    setActioning(traceId);
    await fetch(`${API_BASE}/api/review/${traceId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reviewer_note: "" }),
    });
    await fetchQueue();
    setActioning(null);
  }

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="font-serif text-2xl mb-6">Human Review Queue</h1>
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="font-serif text-2xl mb-2">Human Review Queue</h1>
      <p className="text-neutral-500 text-sm mb-6">
        Traces with verdict <span className="text-yellow-500">escalated</span> or{" "}
        <span className="text-red-500">blocked</span> require manual review.
      </p>

      {queue.length === 0 ? (
        <div className="border border-neutral-800 p-8 text-center text-neutral-500">
          No traces pending review.
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map((item) => (
            <div
              key={item.id}
              className="border border-neutral-800 p-4 flex items-start justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      item.final_verdict === "escalated"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                  />
                  <span className="text-xs text-neutral-500 uppercase tracking-wider">
                    {item.final_verdict}
                  </span>
                  <span className="text-xs text-neutral-600">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-neutral-200 truncate">{item.query}</p>
                <p className="text-xs text-neutral-600 mt-1">
                  Trace: {item.id.slice(0, 8)}... | Latency: {item.total_latency_ms}ms
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleAction(item.id, "approve")}
                  disabled={actioning === item.id}
                  className="px-3 py-1 text-xs border border-green-800 text-green-400 hover:bg-green-900/30 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleAction(item.id, "reject")}
                  disabled={actioning === item.id}
                  className="px-3 py-1 text-xs border border-red-800 text-red-400 hover:bg-red-900/30 disabled:opacity-50"
                >
                  Reject
                </button>
                <a
                  href={`/traces/${item.id}`}
                  className="px-3 py-1 text-xs border border-neutral-700 text-neutral-400 hover:bg-neutral-800"
                >
                  View
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
