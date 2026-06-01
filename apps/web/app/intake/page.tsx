"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ClientProfile } from "@/lib/types";
import { getProfiles, submitIntake } from "@/lib/api";
import { cn } from "@/lib/utils";
import { User, MessageSquare, Send, Sparkles } from "lucide-react";

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
    <div className="max-w-[800px] mx-auto px-6 py-12 lg:py-20">
      <div className="mb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold/20 bg-gold/5 mb-6">
          <Sparkles size={12} className="text-gold" />
          <span className="text-gold font-mono text-[9px] tracking-[0.3em] uppercase">Pipeline Initiation</span>
        </div>
        <h1 className="font-serif text-4xl md:text-5xl text-ink tracking-tight mb-4">
          Advisory <em className="italic">Intake.</em>
        </h1>
        <p className="text-ink-dim text-base font-serif italic max-w-lg mx-auto">
          Submit a new query for institutional-grade regulatory verification through the Sanctum core.
        </p>
      </div>

      <div className="bg-bg-card border border-rule p-8 md:p-12 relative overflow-hidden">
        {/* Decorative corner */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 blur-3xl rounded-full -mr-12 -mt-12" />
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-10 relative z-10">
          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-gold font-bold mb-4">
                <User size={12} />
                Client Persona
              </label>
              <div className="relative">
                <select
                  value={selectedProfileId}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  className="w-full bg-bg/50 border border-rule text-ink px-5 py-4 text-sm font-serif italic focus:outline-none focus:border-gold transition-all appearance-none cursor-pointer"
                  style={{ borderRadius: 0 }}
                >
                  {profiles.length === 0 && (
                    <option value="">No profiles — run seed.py first</option>
                  )}
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.display_name} &middot; {p.risk_profile} &middot; ₹{(p.aum_inr / 1_00_00_000).toFixed(1)} Cr
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-ink-faint">
                  <span className="text-[10px] uppercase tracking-widest">Select &darr;</span>
                </div>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-gold font-bold mb-4">
                <MessageSquare size={12} />
                Advisory Inquiry
              </label>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex: Should I allocate 15% to mid-cap equity given current SEBI volatility guidelines?"
                rows={5}
                className="w-full bg-bg/50 border border-rule text-ink px-5 py-4 text-base font-serif italic leading-relaxed focus:outline-none focus:border-gold resize-none transition-all placeholder:text-ink-faint/30"
                style={{ borderRadius: 0 }}
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-fail/5 border border-fail/20 text-fail text-xs font-mono">
              [SYSTEM ERROR]: {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !selectedProfileId || !query.trim()}
            className={cn(
              "w-full flex items-center justify-center gap-3 py-5 px-8 transition-all duration-300",
              "border border-gold text-[11px] tracking-[0.3em] uppercase font-bold",
              submitting 
                ? "bg-gold/10 text-gold cursor-wait" 
                : "bg-transparent text-gold hover:bg-gold hover:text-bg cursor-pointer shadow-[0_0_20px_rgba(212,169,106,0.1)] hover:shadow-[0_0_30px_rgba(212,169,106,0.3)]"
            )}
            style={{ borderRadius: 0 }}
          >
            {submitting ? (
              <>
                <div className="w-3 h-3 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                Engaging Pipeline...
              </>
            ) : (
              <>
                <Send size={14} />
                Initiate Verification
              </>
            )}
          </button>
        </form>
      </div>

      <div className="mt-12 flex items-center justify-center gap-8 text-[9px] text-ink-faint tracking-[0.2em] uppercase font-mono opacity-50">
        <span>SEBI COMPLIANT</span>
        <span>&middot;</span>
        <span>AUDIT READY</span>
        <span>&middot;</span>
        <span>RAG GROUNDED</span>
      </div>
    </div>
  );
}

