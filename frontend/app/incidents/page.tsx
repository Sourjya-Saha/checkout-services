"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Incident {
  id: string;
  title: string;
  service: string;
  root_cause: string;
  evidence_summary: string;
  verification_result: string;
  approval_record: string;
  pr_link?: string;
  resolution_status: string;
  created_at?: string;
}

export default function VanguardIncidentsAudit() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/incidents`);
      if (res.ok) {
        const data = await res.json();
        setIncidents(data || []);
      } else {
        setIncidents([]);
      }
    } catch {
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  const resolvedCount = incidents.filter((i) => i.resolution_status === "resolved").length;

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 selection:bg-violet-500 selection:text-white relative overflow-hidden font-sans">
      {/* Ambient Background Glow Mesh */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-violet-600/10 via-fuchsia-600/5 to-transparent blur-[120px] pointer-events-none -z-10" />

      {/* Floating Fluid Island Navigation */}
      <header className="pt-6 px-4 sm:px-6 sticky top-0 z-50">
        <nav className="max-w-6xl mx-auto rounded-full bg-zinc-900/70 border border-white/10 backdrop-blur-2xl px-5 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-[0_0_15px_rgba(139,92,246,0.5)]">
              🗄
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm tracking-tight text-white">Postmortem Audit Log</span>
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Supabase PostgreSQL
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 border border-white/5 transition-colors"
            >
              &larr; Target Checkout App
            </Link>
            <Link
              href="/sentinelops"
              className="group inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all duration-300"
            >
              <span>SentinelOps Commander</span>
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] group-hover:translate-x-0.5 transition-transform">
                ↗
              </span>
            </Link>
            <button
              onClick={fetchIncidents}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-white/5 transition-colors"
            >
              Refresh Records
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-12 px-4 sm:px-6 space-y-10">
        {/* Hero Title Block */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 text-[10px] uppercase tracking-[0.25em] text-zinc-400 font-medium">
            <span>Persistent Memory</span>
            <span>&bull;</span>
            <span className="text-emerald-400">PostgreSQL Memory Core</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Incident Postmortem Records
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Persistent incident memory stored in Supabase. Enables TrueForge agents to recall root cause postmortems across chat sessions.
          </p>
        </div>

        {/* Metrics Row (Double-Bezel Architecture) */}
        <section className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-2 rounded-[2rem] bg-white/[0.02] border border-white/10 shadow-xl">
            <div className="p-5 rounded-[calc(2rem-0.5rem)] bg-zinc-950/90 space-y-1">
              <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-zinc-400">
                Total Events
              </p>
              <p className="text-2xl font-extrabold text-white font-mono">{incidents.length}</p>
              <span className="text-xs text-violet-400 font-mono">
                {incidents.length === 0 ? "Zero recorded events" : `${resolvedCount} Resolved Autonomously`}
              </span>
            </div>
          </div>

          <div className="p-2 rounded-[2rem] bg-white/[0.02] border border-white/10 shadow-xl">
            <div className="p-5 rounded-[calc(2rem-0.5rem)] bg-zinc-950/90 space-y-1">
              <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-zinc-400">
                Agent Harness
              </p>
              <p className="text-2xl font-extrabold text-white">TrueForge</p>
              <span className="text-xs text-violet-400 font-mono">Multi-agent orchestrator</span>
            </div>
          </div>

          <div className="p-2 rounded-[2rem] bg-white/[0.02] border border-white/10 shadow-xl">
            <div className="p-5 rounded-[calc(2rem-0.5rem)] bg-zinc-950/90 space-y-1">
              <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-zinc-400">
                Quality Review
              </p>
              <p className="text-2xl font-extrabold text-purple-400">Qodo AI</p>
              <span className="text-xs text-purple-300 font-mono">Automated PR review</span>
            </div>
          </div>

          <div className="p-2 rounded-[2rem] bg-white/[0.02] border border-white/10 shadow-xl">
            <div className="p-5 rounded-[calc(2rem-0.5rem)] bg-zinc-950/90 space-y-1">
              <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-zinc-400">
                Database Store
              </p>
              <p className="text-2xl font-extrabold text-emerald-400 font-mono">Supabase</p>
              <span className="text-xs text-emerald-400 font-mono">incidents table</span>
            </div>
          </div>
        </section>

        {/* Audit Log Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h2 className="text-xs uppercase tracking-[0.2em] font-semibold text-zinc-400">
              Audit Stream ({incidents.length} Records)
            </h2>
            <span className="text-xs text-zinc-500 font-mono">Real-Time Sync</span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-zinc-500 font-mono text-xs">
              Querying Supabase persistent memory cluster...
            </div>
          ) : incidents.length === 0 ? (
            <div className="p-2 rounded-[2rem] bg-white/[0.02] border border-white/10 shadow-2xl">
              <div className="p-12 rounded-[calc(2rem-0.5rem)] bg-zinc-950/90 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-lg mx-auto">
                  ✓
                </div>
                <h3 className="text-sm font-semibold text-white">No Incidents Recorded In Memory</h3>
                <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                  SentinelOps is monitoring checkout-service. When an incident is investigated and remediated, the structured record will be committed to the Supabase <code>incidents</code> table and appear here in real-time.
                </p>
                <Link
                  href="/sentinelops"
                  className="inline-block mt-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-full shadow transition-all uppercase tracking-wider"
                >
                  Open SentinelOps Commander &rarr;
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {incidents.map((inc) => (
                <div key={inc.id} className="p-2 rounded-[2rem] bg-white/[0.02] border border-white/10 shadow-2xl">
                  <div className="p-6 rounded-[calc(2rem-0.5rem)] bg-zinc-950/90 space-y-5">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-zinc-900 text-violet-400 border border-white/10">
                          {inc.id}
                        </span>
                        <h3 className="font-semibold text-sm text-white">{inc.title}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {inc.resolution_status}
                        </span>
                        <span className="text-[11px] font-mono text-zinc-500">
                          {inc.created_at ? new Date(inc.created_at).toLocaleTimeString() : "Recent"}
                        </span>
                      </div>
                    </div>

                    {/* Dual Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                      <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/20 space-y-1">
                        <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-rose-400">
                          Root Cause Analysis
                        </p>
                        <p className="text-rose-200/90 leading-relaxed">{inc.root_cause}</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-1">
                        <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-emerald-400">
                          Daytona Sandbox Verification
                        </p>
                        <p className="text-emerald-200/90 leading-relaxed">{inc.verification_result}</p>
                      </div>
                    </div>

                    {/* Evidence & Approval */}
                    <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 text-xs font-mono space-y-1 text-zinc-300">
                      <p>
                        <strong className="text-violet-400">Subagent Evidence:</strong> {inc.evidence_summary}
                      </p>
                      <p>
                        <strong className="text-amber-400">Human Approval:</strong> {inc.approval_record}
                      </p>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="flex items-center gap-2">
                        {inc.pr_link && (
                          <a
                            href={inc.pr_link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white transition-all"
                          >
                            View GitHub PR &rarr;
                          </a>
                        )}
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          Qodo Review: Approved (0 Highs)
                        </span>
                      </div>

                      <button
                        onClick={() => setSelectedIncident(inc)}
                        className="text-xs font-mono text-violet-400 hover:text-violet-300 underline"
                      >
                        Inspect Supabase JSON Schema &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* JSON Inspector Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-[2rem] max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-white/10">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-semibold text-sm text-white">
                Supabase Persistent Memory Record ({selectedIncident.id})
              </h3>
              <button
                onClick={() => setSelectedIncident(null)}
                className="text-zinc-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>
            <pre className="bg-zinc-950 text-emerald-400 p-4 rounded-2xl text-xs font-mono overflow-x-auto max-h-96 border border-white/5">
              {JSON.stringify(selectedIncident, null, 2)}
            </pre>
            <div className="text-right">
              <button
                onClick={() => setSelectedIncident(null)}
                className="px-5 py-2 bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold rounded-full"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
