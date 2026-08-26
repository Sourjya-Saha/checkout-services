"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Blurred404Background from "@/components/Blurred404Background";

interface SubagentStatus {
  id: string;
  name: string;
  codename: string;
  role: string;
  status: "idle" | "running" | "completed";
  telemetry: string;
  metric: string;
}

interface IncidentState {
  id: string;
  status:
    | "reported"
    | "investigating"
    | "awaiting_fix_approval"
    | "awaiting_pr_approval"
    | "resolved"
    | "denied";
  error_message?: string;
  stack_trace?: string;
  endpoint?: string;
  session_id?: string;
  pending_call_id?: string | null;
  pending_call_type?: "fix" | "pull_request" | null;
  pr_url?: string | null;
  root_cause?: string | null;
}

export default function VenturaSentinelOpsCommander() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const incidentQueryId = searchParams.get("incident");

  const [incidentId, setIncidentId] = useState<string>(incidentQueryId || "");
  const [incidentState, setIncidentState] = useState<IncidentState | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [isSpawning, setIsSpawning] = useState<boolean>(false);
  const [approvalDecision, setApprovalDecision] = useState<string | null>(null);

  const [subagents, setSubagents] = useState<SubagentStatus[]>([
    {
      id: "agent-01",
      name: "SUBAGENT ALPHA",
      codename: "GIT-SENTINEL",
      role: "Commit History & Diff Inspector",
      status: "idle",
      telemetry: "Repository: Sourjya-Saha/checkout-services",
      metric: "Target: main branch",
    },
    {
      id: "agent-02",
      name: "SUBAGENT BRAVO",
      codename: "LOG-TRACE",
      role: "Exception Stack Trace Decoder",
      status: "idle",
      telemetry: "FastAPI Runtime Logs (:8000)",
      metric: "Filter: 500 Spike",
    },
    {
      id: "agent-03",
      name: "SUBAGENT CHARLIE",
      codename: "DATA-CORE",
      role: "PostgreSQL Order Analytics",
      status: "idle",
      telemetry: "Supabase Database Cluster",
      metric: "Query: is_guest=true",
    },
  ]);

  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);

  // If no incident query ID is present, fetch the latest incident
  useEffect(() => {
    if (!incidentQueryId) {
      fetch("/api/incidents")
        .then((res) => res.json())
        .then((data) => {
          if (data.latest?.id) {
            router.replace(`/sentinelops?incident=${data.latest.id}`);
          }
        })
        .catch(() => {});
    }
  }, [incidentQueryId, router]);

  // Connect to live SSE stream when incidentQueryId is present
  useEffect(() => {
    if (!incidentQueryId) return;

    setIncidentId(incidentQueryId);
    setTerminalLogs([
      `[*] [TRUEFORGE SSE] Subscribed to live incident stream: ${incidentQueryId}`,
    ]);

    const es = new EventSource(`/api/incidents/${incidentQueryId}/stream`);
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);

        // 1. Initial State
        if (data.type === "incident.state" && data.incident) {
          setIncidentState(data.incident);
          if (data.incident.status === "investigating") setCurrentStep(2);
          if (data.incident.status === "awaiting_fix_approval") setCurrentStep(3);
          if (data.incident.status === "awaiting_pr_approval") setCurrentStep(4);
          if (data.incident.status === "resolved") setCurrentStep(6);
          return;
        }

        // 2. Thread / Subagents
        if (data.type === "thread.created") {
          setCurrentStep(2);
          setSubagents((prev) =>
            prev.map((sub) => ({
              ...sub,
              status: "running",
              telemetry: `Subagent Thread ${data.thread_id?.slice(0, 8)} investigating...`,
            }))
          );
          setTerminalLogs((prev) => [
            ...prev,
            `[+] [SUBAGENT] Spawned subagent worker thread: ${data.thread_id}`,
          ]);
        }

        // 3. Tool Response / Model Message
        if (data.type === "model.message") {
          const text = typeof data.content === "string" ? data.content : JSON.stringify(data.content || "");
          if (text) {
            setTerminalLogs((prev) => [...prev, `[Agent] ${text.slice(0, 180)}...`]);

            // Dynamically detect created Pull Request ONLY on the final concluding response
            const isConcluding = text.includes("Done — I drafted") || text.includes("### PR:") || text.includes("opened a PR");
            if (isConcluding) {
              const prMatch = text.match(/https:\/\/github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/pull\/\d+/);
              if (prMatch && prMatch[0]) {
                setIncidentState((prev) => ({
                  ...prev!,
                  status: "resolved",
                  pr_url: prMatch[0],
                }));
                setCurrentStep(6);
                setTerminalLogs((prev) => [
                  ...prev,
                  `[✓] [PR CREATED] Successfully opened Pull Request: ${prMatch[0]}`,
                ]);
              }
            }
          }
          if (data.tool_calls && data.tool_calls.length > 0) {
            const tool = data.tool_calls[0];
            const args = tool.function?.arguments || "";
            setTerminalLogs((prev) => [
              ...prev,
              `[*] [TOOL CALL] ${tool.function?.name || "call_tool"}: ${args.slice(0, 120)}...`,
            ]);
          }
        }

        if (data.type === "tool.response") {
          const toolName = data.tool_name || "";
          const text = JSON.stringify(data);
          if (toolName.includes("create_pull_request") || text.includes("pull_request")) {
            const prMatch = text.match(/https:\/\/github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/pull\/\d+/);
            if (prMatch && prMatch[0]) {
              setIncidentState((prev) => ({
                ...prev!,
                status: "resolved",
                pr_url: prMatch[0],
              }));
              setCurrentStep(6);
            }
          }
          setTerminalLogs((prev) => [
            ...prev,
            `[✓] [TOOL RETURN] ${data.tool_name || "tool"}: response captured`,
          ]);
        }

        if (data.type === "sandbox.created") {
          setTerminalLogs((prev) => [
            ...prev,
            `[Daytona-VM] Isolated container active (ID: ${data.sandbox_id || "sbx-daytona-linux"})`,
          ]);
        }

        // 4. Approval Required (Tool approval or Conversational Checkpoint)
        if (data.type === "tool.approval_required" || data.type === "checkpoint.approval_required") {
          setIsApproving(false);
          const checkpoint = data.checkpoint_type || "fix";
          setIncidentState((prev) => ({
            ...prev!,
            status:
              checkpoint === "pull_request"
                ? "awaiting_pr_approval"
                : "awaiting_fix_approval",
            pending_call_id: data.pending_call_id || null,
            pending_call_type: checkpoint,
          }));

          if (checkpoint === "fix") {
            setCurrentStep(3);
            setTerminalLogs((prev) => [
              ...prev,
              `[🛑] [CHECKPOINT A] Human Approval required before drafting/testing fix in sandbox.`,
            ]);
          } else {
            setCurrentStep(4);
            setTerminalLogs((prev) => [
              ...prev,
              `[🛑] [CHECKPOINT B] Human Approval required before opening GitHub Pull Request.`,
            ]);
          }
        }

        // 5. Turn Done / Resolution
        if (data.type === "turn.done") {
          if (data.state?.status === "done") {
            setSubagents((prev) =>
              prev.map((sub) => ({ ...sub, status: "completed" }))
            );
          }
        }
      } catch (err) {
        console.error("SSE parse error:", err);
      }
    };

    es.onerror = () => {
      console.warn("SSE connection closed or reconnecting.");
    };

    return () => {
      es.close();
    };
  }, [incidentQueryId]);

  const handleLaunchNewIncident = async () => {
    setIsSpawning(true);
    try {
      const res = await fetch("/api/incidents/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error_message: "KeyError: 'STANDARD' in payment_processor.py during tax calculation",
          stack_trace:
            "File backend/app/payment_processor.py, line 59, in calculate_regional_tax\nKeyError: 'STANDARD'",
          endpoint: "/checkout",
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await res.json();
      if (data.success && data.id) {
        router.push(`/sentinelops?incident=${data.id}`);
      }
    } catch (e) {
      console.error("Failed to launch incident:", e);
    } finally {
      setIsSpawning(false);
    }
  };

  const handleApproveAction = async (decision: "approve" | "deny") => {
    if (!incidentId) return;
    setIsApproving(true);
    setApprovalDecision(decision);

    try {
      const res = await fetch(`/api/incidents/${incidentId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });

      const data = await res.json();
      if (data.success) {
        setTerminalLogs((prev) => [
          ...prev,
          `[+] [HITL DECISION: ${decision.toUpperCase()}] SRE Commander decision transmitted to TrueForge.`,
        ]);
        setIncidentState((prev) => (prev ? { ...prev, status: data.status } : null));
      }
    } catch (e) {
      console.error("Approval post error:", e);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <Blurred404Background blurIntensity="heavy">
      <div className="min-h-screen font-epic antialiased selection:bg-white selection:text-black">
        {/* Top Header */}
        <header className="px-6 sm:px-12 py-6 border-b border-white/10 bg-black/40 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-blue-500 flex items-center justify-center text-black font-black text-xs">
              ⎊
            </div>
            <div>
              <h1 className="text-sm font-mono uppercase tracking-widest text-white font-bold">
                SentinelOps Swarm Visualizer
              </h1>
              <span className="text-[10px] font-mono text-zinc-400">
                TrueForge Live SDK Event Stream &bull; Daytona Sandbox &bull; Two-Stage Approval
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs font-mono text-zinc-400 hover:text-white transition-colors"
            >
              &larr; Poster App
            </Link>
            <Link
              href="/checkout"
              className="text-xs font-mono text-zinc-400 hover:text-white transition-colors"
            >
              Checkout Service &rarr;
            </Link>
            <Link
              href="/incidents"
              className="text-xs font-mono text-zinc-400 hover:text-white transition-colors"
            >
              Postmortem Audit &rarr;
            </Link>
          </div>
        </header>

        {/* Main Container */}
        <main className="max-w-7xl mx-auto px-6 sm:px-12 py-12 space-y-10">
          {/* Title & Active Incident Badge */}
          <div className="p-8 rounded-3xl bg-black/50 backdrop-blur-xl border border-white/10 space-y-3 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-red-400">
                01 // Autonomous Incident Ingestion &amp; Live Stream
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase mt-1">
                SentinelOps Incident HUD
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {incidentId ? (
                <span className="px-4 py-2 rounded-2xl bg-black/80 border border-white/15 text-xs font-mono font-bold text-cyan-400">
                  INCIDENT: {incidentId}
                </span>
              ) : (
                <button
                  onClick={handleLaunchNewIncident}
                  disabled={isSpawning}
                  className="px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold font-epic uppercase tracking-wider shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-all disabled:opacity-50"
                >
                  {isSpawning ? "Spawning SentinelOps..." : "⚡ Launch Incident Swarm ↗"}
                </button>
              )}
              {incidentState?.status && (
                <span className="px-3.5 py-2 rounded-2xl text-[10px] font-mono font-bold uppercase bg-amber-950/80 text-amber-300 border border-amber-800">
                  {incidentState.status}
                </span>
              )}
            </div>
          </div>

          {/* If no incident is active, show quick launcher card */}
          {!incidentId && (
            <div className="p-8 rounded-3xl bg-black/60 backdrop-blur-2xl border border-white/10 text-center space-y-4 shadow-2xl">
              <h3 className="text-lg font-bold text-white font-epic uppercase">
                No Active Incident Connected
              </h3>
              <p className="text-xs font-mono text-zinc-400 max-w-xl mx-auto">
                Trigger a guest checkout error on the Checkout Service page, or click below to immediately launch an automated investigation swarm using the saved SentinelOps agent.
              </p>
              <div className="flex justify-center gap-4 pt-2">
                <button
                  onClick={handleLaunchNewIncident}
                  disabled={isSpawning}
                  className="px-6 py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold font-epic uppercase tracking-widest shadow-[0_0_25px_rgba(239,68,68,0.5)] transition-all disabled:opacity-50"
                >
                  {isSpawning ? "Initializing TrueForge Session..." : "⚡ Launch Autonomous Swarm Investigation ↗"}
                </button>
                <Link
                  href="/checkout"
                  className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-bold uppercase tracking-wider transition-all"
                >
                  Go to Checkout Gateway &rarr;
                </Link>
              </div>
            </div>
          )}

          {/* TWO-STAGE APPROVAL CARDS */}
          {/* Checkpoint A: Fix Approval */}
          {incidentState?.status === "awaiting_fix_approval" && (
            <div className="p-8 rounded-3xl bg-amber-950/70 backdrop-blur-2xl border-2 border-amber-500 space-y-5 font-mono shadow-[0_0_40px_rgba(245,158,11,0.25)] animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
                  <h3 className="text-base font-bold text-amber-300 uppercase font-epic tracking-wide">
                    Checkpoint A // Approval Required to Draft &amp; Test Fix
                  </h3>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-amber-900 text-amber-100 font-bold">
                  HITL Gate 1 of 2
                </span>
              </div>
              <p className="text-xs text-zinc-200 leading-relaxed">
                SentinelOps has verified the root-cause hypothesis. Explicit human approval is required before drafting code or running candidate patches in the Daytona sandbox.
              </p>
              <div className="p-4 bg-black/80 rounded-2xl border border-amber-900/60 text-xs text-zinc-300 space-y-1">
                <p>
                  <strong className="text-white">Target Repository:</strong> Sourjya-Saha/checkout-services
                </p>
                <p>
                  <strong className="text-amber-400">Target Error:</strong> {incidentState.error_message || "Active production regression"}
                </p>
                <p>
                  <strong className="text-zinc-400">Action:</strong> Install dependencies, apply safe fallback in payment_processor.py, and run sandbox verification.
                </p>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => handleApproveAction("approve")}
                  disabled={isApproving}
                  className="px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs uppercase tracking-widest transition-all shadow-lg font-epic disabled:opacity-50"
                >
                  {isApproving && approvalDecision === "approve"
                    ? "Transmitting Approval..."
                    : "Approve: Draft & Test Fix in Sandbox ↗"}
                </button>
                <button
                  onClick={() => handleApproveAction("deny")}
                  disabled={isApproving}
                  className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-zinc-300 text-xs font-bold uppercase tracking-widest transition-all"
                >
                  Deny
                </button>
              </div>
            </div>
          )}

          {/* Checkpoint B: Pull Request Approval */}
          {incidentState?.status === "awaiting_pr_approval" && (
            <div className="p-8 rounded-3xl bg-blue-950/70 backdrop-blur-2xl border-2 border-blue-500 space-y-5 font-mono shadow-[0_0_40px_rgba(59,130,246,0.25)] animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-blue-400 animate-ping" />
                  <h3 className="text-base font-bold text-blue-300 uppercase font-epic tracking-wide">
                    Checkpoint B // Approval Required to Open GitHub Pull Request
                  </h3>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-blue-900 text-blue-100 font-bold">
                  HITL Gate 2 of 2
                </span>
              </div>
              <p className="text-xs text-zinc-200 leading-relaxed">
                Candidate patch successfully verified in the Daytona sandbox with all test suites passing. Explicit human approval is required before opening a Pull Request on GitHub.
              </p>
              <div className="p-4 bg-black/80 rounded-2xl border border-blue-900/60 text-xs text-zinc-300 space-y-1">
                <p>
                  <strong className="text-white">Target Repository:</strong> Sourjya-Saha/checkout-services
                </p>
                <p className="text-emerald-400">
                  <strong className="text-white">Daytona Proof:</strong> 100% verification checks passed in isolated Linux sandbox.
                </p>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => handleApproveAction("approve")}
                  disabled={isApproving}
                  className="px-6 py-3.5 rounded-2xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs uppercase tracking-widest transition-all shadow-lg font-epic disabled:opacity-50"
                >
                  {isApproving && approvalDecision === "approve"
                    ? "Opening GitHub PR..."
                    : "Approve: Open GitHub Pull Request ↗"}
                </button>
                <button
                  onClick={() => handleApproveAction("deny")}
                  disabled={isApproving}
                  className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-zinc-300 text-xs font-bold uppercase tracking-widest transition-all"
                >
                  Deny
                </button>
              </div>
            </div>
          )}

          {/* Resolved Banner */}
          {incidentState?.status === "resolved" && (
            <div className="p-8 rounded-3xl bg-emerald-950/70 backdrop-blur-2xl border-2 border-emerald-500 space-y-4 font-mono shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-emerald-300 uppercase font-epic">
                  Incident Remediated &amp; Resolved
                </h3>
                <span className="text-xs px-3.5 py-1 rounded-full bg-emerald-900 text-emerald-200 font-bold">
                  Status: Resolved ✓
                </span>
              </div>
              <p className="text-xs text-zinc-200">
                The incident has been completely remediated, reviewed, and logged to persistent memory.
              </p>
              {incidentState.pr_url && (
                <a
                  href={incidentState.pr_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block px-5 py-3 bg-white text-black text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-zinc-200 transition-colors shadow-lg font-epic"
                >
                  View Pull Request on GitHub &rarr;
                </a>
              )}
            </div>
          )}

          {/* Parallel Subagents Section */}
          <div className="space-y-4">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
              02 // Parallel Multi-Agent Swarm
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {subagents.map((sub) => (
                <div
                  key={sub.id}
                  className="p-6 rounded-3xl bg-black/50 backdrop-blur-xl border border-white/10 flex flex-col justify-between space-y-4 shadow-2xl"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-white">{sub.name}</span>
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold ${
                          sub.status === "completed"
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                            : sub.status === "running"
                            ? "bg-amber-950 text-amber-300 border border-amber-800 animate-pulse"
                            : "bg-zinc-900 text-zinc-500"
                        }`}
                      >
                        {sub.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-zinc-100">{sub.role}</h4>
                    <p className="text-[11px] font-mono text-zinc-400 mt-1">{sub.metric}</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-black/70 border border-white/10 font-mono text-xs text-zinc-300 min-h-[90px] leading-relaxed">
                    {sub.telemetry}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Daytona Sandbox Terminal / Live SSE Feed */}
          <div className="space-y-4">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
              03 // Live TrueForge SSE Stream &amp; Daytona Execution Terminal
            </span>
            <div className="p-6 rounded-3xl bg-black/60 backdrop-blur-xl border border-white/10 font-mono text-xs space-y-3 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 text-zinc-400 text-[11px]">
                <span>STREAM: {incidentId ? `/api/incidents/${incidentId}/stream` : "DISCONNECTED"}</span>
                <span>SAVED AGENT: sentinelops ({SENTINELOPS_AGENT_ID})</span>
              </div>
              <div className="space-y-1.5 min-h-[180px] max-h-[300px] overflow-y-auto">
                {terminalLogs.length === 0 ? (
                  <p className="text-zinc-500">// Waiting for incident trigger...</p>
                ) : (
                  terminalLogs.map((log, idx) => (
                    <p
                      key={idx}
                      className={
                        log.includes("[🛑]") || log.includes("TypeError") || log.includes("KeyError")
                          ? "text-amber-400 font-bold"
                          : log.includes("[✓]") || log.includes("PASS") || log.includes("Resolved")
                          ? "text-emerald-400 font-bold"
                          : log.includes("[+]") || log.includes("[*]")
                          ? "text-cyan-300"
                          : "text-zinc-300"
                      }
                    >
                      {log}
                    </p>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </Blurred404Background>
  );
}

const SENTINELOPS_AGENT_ID = "01m0xgq0c13c5p67k7rtjk0s35";
