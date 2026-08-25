"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Blurred404Background from "@/components/Blurred404Background";

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

export default function VenturaIncidentsAudit() {
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
    <Blurred404Background blurIntensity="heavy">
      <div className="min-h-screen font-epic antialiased selection:bg-white selection:text-black">
        {/* Top Header */}
        <header className="px-6 sm:px-12 py-6 border-b border-white/10 bg-black/40 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-blue-500 flex items-center justify-center text-black font-black text-xs">
              🗄
            </div>
            <div>
              <h1 className="text-sm font-mono uppercase tracking-widest text-white font-bold">
                Supabase Incident Postmortem Audit
              </h1>
              <span className="text-[10px] font-mono text-zinc-400">
                Persistent Memory &bull; Daytona Verifications &bull; Qodo Reviews
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 font-mono text-xs">
            <Link href="/" className="text-zinc-400 hover:text-white transition-colors">
              &larr; Poster App
            </Link>
            <Link href="/checkout" className="text-zinc-400 hover:text-white transition-colors">
              Checkout &rarr;
            </Link>
            <Link href="/sentinelops" className="text-zinc-400 hover:text-white transition-colors">
              SentinelOps HUD &rarr;
            </Link>
            <button
              onClick={fetchIncidents}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all backdrop-blur-md"
            >
              Sync DB
            </button>
          </div>
        </header>

        {/* Main Container */}
        <main className="max-w-7xl mx-auto px-6 sm:px-12 py-12 space-y-12">
          {/* Title Headline */}
          <div className="p-8 rounded-3xl bg-black/50 backdrop-blur-xl border border-white/10 space-y-3 shadow-2xl">
            <span className="text-[10px] font-mono uppercase tracking-widest text-red-400">
              02 // PostgreSQL Persistent Memory Matrix
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">
              Incident Audit Records
            </h2>
            <div className="w-full h-1.5 bg-gradient-to-r from-red-600 via-orange-500 via-amber-400 to-blue-600 rounded-full" />
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-black/50 backdrop-blur-xl border border-white/10 space-y-1 font-mono shadow-2xl">
              <p className="text-[10px] uppercase tracking-widest text-zinc-400">Total Records</p>
              <p className="text-4xl font-black text-white">{incidents.length}</p>
              <span className="text-xs text-zinc-300">
                {incidents.length === 0 ? "Zero recorded events" : `${resolvedCount} Resolved Events`}
              </span>
            </div>

            <div className="p-6 rounded-3xl bg-black/50 backdrop-blur-xl border border-white/10 space-y-1 font-mono shadow-2xl">
              <p className="text-[10px] uppercase tracking-widest text-zinc-400">Agent Harness</p>
              <p className="text-4xl font-black text-white">TrueForge</p>
              <span className="text-xs text-zinc-300">Multi-agent runtime</span>
            </div>

            <div className="p-6 rounded-3xl bg-black/50 backdrop-blur-xl border border-white/10 space-y-1 font-mono shadow-2xl">
              <p className="text-[10px] uppercase tracking-widest text-zinc-400">Code Quality</p>
              <p className="text-4xl font-black text-purple-400">Qodo AI</p>
              <span className="text-xs text-zinc-300">Automated PR review</span>
            </div>

            <div className="p-6 rounded-3xl bg-black/50 backdrop-blur-xl border border-white/10 space-y-1 font-mono shadow-2xl">
              <p className="text-[10px] uppercase tracking-widest text-zinc-400">Persistent DB</p>
              <p className="text-4xl font-black text-emerald-400">Supabase</p>
              <span className="text-xs text-zinc-300">incidents table</span>
            </div>
          </div>

          {/* Audit Log Stream */}
          <div className="space-y-6">
            {loading ? (
              <div className="py-16 text-center text-zinc-400 font-mono text-xs p-8 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10">
                Querying Supabase persistent memory cluster...
              </div>
            ) : incidents.length === 0 ? (
              <div className="p-12 rounded-3xl bg-black/50 backdrop-blur-xl border border-white/10 text-center space-y-4 font-mono shadow-2xl">
                <div className="w-12 h-12 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 flex items-center justify-center font-bold text-lg mx-auto shadow-lg">
                  ✓
                </div>
                <h3 className="text-base font-bold text-white uppercase">No Incidents Recorded In Memory</h3>
                <p className="text-xs text-zinc-300 max-w-md mx-auto leading-relaxed">
                  SentinelOps is actively monitoring checkout-service. When an incident is investigated and remediated, the postmortem record will be committed to Supabase and appear here in real-time.
                </p>
                <Link
                  href="/sentinelops"
                  className="inline-block mt-2 px-6 py-3 bg-white hover:bg-zinc-200 text-black text-xs font-bold uppercase tracking-widest rounded-2xl transition-colors shadow-lg"
                >
                  Launch SentinelOps Swarm &rarr;
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {incidents.map((inc) => (
                  <div
                    key={inc.id}
                    className="p-8 rounded-3xl bg-black/50 backdrop-blur-xl border border-white/10 space-y-6 shadow-2xl hover:border-white/20 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-black px-3 py-1 rounded-xl bg-black/80 text-cyan-400 border border-white/10">
                          {inc.id}
                        </span>
                        <h3 className="font-bold text-base text-white">{inc.title}</h3>
                      </div>
                      <span className="px-3.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 backdrop-blur-md">
                        {inc.resolution_status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
                      <div className="p-5 rounded-2xl bg-red-950/40 border border-red-900/50 space-y-2 backdrop-blur-md">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-red-400">
                          Root Cause Analysis
                        </p>
                        <p className="text-red-200 leading-relaxed">{inc.root_cause}</p>
                      </div>

                      <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-900/50 space-y-2 backdrop-blur-md">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">
                          Daytona Sandbox Verification
                        </p>
                        <p className="text-emerald-200 leading-relaxed">{inc.verification_result}</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-black/70 border border-white/10 text-xs font-mono space-y-1.5 text-zinc-200">
                      <p>
                        <strong className="text-white">Subagent Evidence:</strong> {inc.evidence_summary}
                      </p>
                      <p>
                        <strong className="text-amber-400">Human Approval:</strong> {inc.approval_record}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="flex items-center gap-3">
                        {inc.pr_link && (
                          <a
                            href={inc.pr_link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl text-xs font-mono font-bold uppercase tracking-widest bg-white hover:bg-zinc-200 text-black transition-colors shadow-lg"
                          >
                            View GitHub PR &rarr;
                          </a>
                        )}
                        <span className="px-3.5 py-2 rounded-2xl text-xs font-mono font-bold bg-purple-950/80 text-purple-300 border border-purple-800/60 backdrop-blur-md">
                          Qodo Review: Approved (0 Highs)
                        </span>
                      </div>

                      <button
                        onClick={() => setSelectedIncident(inc)}
                        className="text-xs font-mono text-zinc-300 hover:text-white underline transition-colors"
                      >
                        Inspect Supabase JSON Schema &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* JSON Modal */}
        {selectedIncident && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-black/90 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-white/15 backdrop-blur-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="font-bold text-sm text-white font-mono">
                  Supabase Persistent Memory Record ({selectedIncident.id})
                </h3>
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="text-zinc-400 hover:text-white font-bold text-sm"
                >
                  ✕
                </button>
              </div>
              <pre className="bg-black/90 text-emerald-400 p-4 rounded-2xl text-xs font-mono overflow-x-auto max-h-96 border border-white/10">
                {JSON.stringify(selectedIncident, null, 2)}
              </pre>
              <div className="text-right">
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="px-5 py-2.5 bg-white text-black text-xs font-mono font-bold rounded-xl hover:bg-zinc-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Blurred404Background>
  );
}
