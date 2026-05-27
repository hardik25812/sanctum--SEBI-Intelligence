"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ClientProfile } from "@/lib/types";
import { getProfiles, submitIntake } from "@/lib/api";

export default function IntakePage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<ClientProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [query, setQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProfiles()
      .then((p) => {
        setProfiles(p);
        if (p.length > 0) setSelectedProfileId(p[0].id);
      })
      .catch(console.error);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProfileId || !query.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const trace = await submitIntake(selectedProfileId, query.trim());
      router.push(`/traces/${trace.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-[700px] mx-auto px-8 py-16">
      <div className="mb-12">
        <span className="text-gold font-serif italic text-sm tracking-wide">
          &#9671; I
        </span>
        <h1 className="font-serif text-3xl md:text-4xl text-ink mt-2 tracking-tight">
          New advisory intake.
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <label className="text-[10px] tracking-[0.2em] uppercase text-ink-dim block mb-2">
            Client profile
          </label>
          <select
            value={selectedProfileId}
            onChange={(e) => setSelectedProfileId(e.target.value)}
            className="w-full bg-bg-card border border-rule text-ink px-4 py-3 text-sm font-mono focus:outline-none focus:border-gold"
            style={{ borderRadius: 0 }}
          >
            {profiles.length === 0 && (
              <option value="">No profiles — run seed.py first</option>
            )}
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.display_name} &middot; {p.risk_profile} &middot; &#8377;
                {(p.aum_inr / 1_00_00_000).toFixed(1)} Cr
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] tracking-[0.2em] uppercase text-ink-dim block mb-2">
            Client query
          </label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Should I move 40% of my portfolio into the new small-cap fund my friend is launching?"
            rows={4}
            className="w-full bg-bg-card border border-rule text-ink px-4 py-3 text-sm font-serif leading-relaxed focus:outline-none focus:border-gold resize-none"
            style={{ borderRadius: 0 }}
          />
        </div>

        {error && (
          <p className="text-fail text-xs">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting || !selectedProfileId || !query.trim()}
          className="bg-transparent border border-gold text-gold px-6 py-3 text-[10px] tracking-[0.2em] uppercase cursor-pointer hover:bg-gold hover:text-bg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ borderRadius: 0 }}
        >
          {submitting ? "Running pipeline..." : "Submit to Sanctum"}
        </button>
      </form>
    </div>
  );
}
