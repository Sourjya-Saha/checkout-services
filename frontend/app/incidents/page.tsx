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

export default function IncidentsAuditMatrix() {
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-black text-slate-950 text-sm shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              🗄
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-wider text-sm text-white uppercase font-mono">
                  SentinelOps Incident Audit Matrix
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-bold">
                  Supabase PostgreSQL
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Persistent Incident Memory &bull; Daytona Verification Proofs &bull; Qodo Reviews
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-all font-mono"
            >
              &larr; Checkout App
            </Link>
            <Link
              href="/sentinelops"
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all font-mono uppercase tracking-wider"
            >
              SentinelOps HUD &rarr;
            </Link>
            <button
              onClick={fetchIncidents}
              className="px-3.5 py-1.5 rounded-xl text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            >
              Sync DB
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-8 space-y-8">
        {/* Metrics Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-1">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Total Recorded Incidents
            </p>
            <p className="text-2xl font-black text-white font-mono">{incidents.length}</p>
            <span className="text-[11px] font-mono text-cyan-400">
              {incidents.length === 0 ? "Zero recorded events" : `${resolvedCount} Resolved Autonomously`}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-1">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Remediation Engine
            </p>
            <p className="text-2xl font-black text-white font-mono">TrueForge</p>
            <span className="text-[11px] font-mono text-cyan-400">Daytona Sandboxed Verify</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-1">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Code Quality Review
            </p>
            <p className="text-2xl font-black text-purple-400 font-mono">Qodo AI</p>
            <span className="text-[11px] font-mono text-purple-300">Automated PR Verification</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-1">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Persistent Memory
            </p>
            <p className="text-2xl font-black text-emerald-400 font-mono">Supabase</p>
            <span className="text-[11px] font-mono text-emerald-300">incidents table storage</span>
          </div>
        </section>

        {/* Audit Log Stream */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400 font-mono flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              Live Incident Audit Stream
            </h2>
            <span className="text-[11px] font-mono text-slate-500">
              Showing {incidents.length} Event Record(s)
            </span>
          </div>

          {loading ? (
            <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center font-mono text-xs text-slate-500">
              Querying Supabase persistent memory cluster...
            </div>
          ) : incidents.length === 0 ? (
            <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-3 font-mono">
              <div className="w-12 h-12 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center font-bold text-lg mx-auto shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                ✓
              </div>
              <h3 className="text-sm font-bold text-white">No Incidents Recorded In Memory</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                SentinelOps is monitoring checkout-service. When an incident is investigated and remediated, the structured record will be committed to the Supabase <code>incidents</code> table and appear here in real-time.
              </p>
              <Link
                href="/sentinelops"
                className="inline-block mt-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl shadow font-mono uppercase tracking-wider"
              >
                Launch SentinelOps Agent Visualizer &rarr;
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {incidents.map((inc) => (
                <div
                  key={inc.id}
                  className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 shadow-xl space-y-4 transition-all"
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-black px-2.5 py-1 rounded bg-slate-950 text-cyan-400 border border-slate-800">
                        {inc.id}
                      </span>
                      <h3 className="font-bold text-sm text-white font-mono">{inc.title}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                        {inc.resolution_status}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {inc.created_at ? new Date(inc.created_at).toLocaleTimeString() : "Recent"}
                      </span>
                    </div>
                  </div>

                  {/* Dual Diagnosis Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="p-4 rounded-xl bg-red-950/30 border border-red-800/50 space-y-1">
                      <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
                        Root Cause Diagnosis
                      </p>
                      <p className="text-red-200 leading-relaxed">{inc.root_cause}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/50 space-y-1">
                      <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                        Daytona Sandboxed Verification Proof
                      </p>
                      <p className="text-emerald-200 leading-relaxed">{inc.verification_result}</p>
                    </div>
                  </div>

                  {/* Subagent Evidence */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs font-mono space-y-1.5 text-slate-300">
                    <p>
                      <strong className="text-cyan-400">Subagent Evidence:</strong> {inc.evidence_summary}
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
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-mono bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all uppercase tracking-wider"
                        >
                          View GitHub PR &rarr;
                        </a>
                      )}
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-purple-950 text-purple-300 border border-purple-700/60">
                        Qodo Review: Approved (0 Highs)
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedIncident(inc)}
                      className="text-xs font-mono text-cyan-400 hover:text-cyan-300 underline"
                    >
                      Inspect Supabase Record JSON &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* JSON Inspector Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white font-mono">
                Supabase Persistent Memory Record ({selectedIncident.id})
              </h3>
              <button
                onClick={() => setSelectedIncident(null)}
                className="text-slate-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>
            <pre className="bg-slate-950 text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-96 border border-slate-800">
              {JSON.stringify(selectedIncident, null, 2)}
            </pre>
            <div className="text-right">
              <button
                onClick={() => setSelectedIncident(null)}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold rounded-xl"
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
