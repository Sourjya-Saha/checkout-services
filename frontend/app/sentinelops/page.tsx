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

const SENTINELOPS_AGENT_ID = "01m0xgq0c13c5p67k7rtjk0s35";

export default function DarkRedComicSentinelOpsCommander() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const incidentQueryId = searchParams.get("incident");

  const [incidentId, setIncidentId] = useState<string>(incidentQueryId || "");
  const [incidentState, setIncidentState] = useState<IncidentState | null>(null);
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

  // Auto-fetch latest incident if no query parameter
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

  // Connect to live SSE stream
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
          return;
        }

        // 2. Thread / Subagents
        if (data.type === "thread.created") {
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

            const isConcluding = text.includes("Done — I drafted") || text.includes("### PR:") || text.includes("opened a PR");
            if (isConcluding) {
              const prMatch = text.match(/https:\/\/github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/pull\/\d+/);
              if (prMatch && prMatch[0]) {
                setIncidentState((prev) => ({
                  ...prev!,
                  status: "resolved",
                  pr_url: prMatch[0],
                }));
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

        // 4. Approval Required
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
            setTerminalLogs((prev) => [
              ...prev,
              `[🛑] [CHECKPOINT A] Human Approval required before drafting/testing fix in sandbox.`,
            ]);
          } else {
            setTerminalLogs((prev) => [
              ...prev,
              `[🛑] [CHECKPOINT B] Human Approval required before opening GitHub Pull Request.`,
            ]);
          }
        }

        // 5. Turn Done
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
      {/* SVG Distorted Comic Drawing Filters */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <filter id="comic-wobble-dark" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="comic-wobble-hero" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.055" numOctaves="2" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <div className="min-h-screen text-white font-epic antialiased selection:bg-red-600 selection:text-white">
        {/* ========================================================================= */}
        {/* TOP NEOBRUTALIST NAV BAR */}
        {/* ========================================================================= */}
        <header className="px-6 sm:px-12 py-5 border-b-[3.5px] border-black bg-black/90 backdrop-blur-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_6px_0_0_#dc2626]">
          <div className="flex items-center gap-3">
            {/* Distorted Drawing White Patch for Logo Title */}
            <Link href="/" className="group flex items-center gap-3">
              <div className="relative inline-block rotate-[-1.5deg] group-hover:rotate-0 transition-transform">
                <div
                  className="absolute -inset-1.5 bg-white border-[3px] border-black shadow-[4px_4px_0px_#dc2626]"
                  style={{ filter: "url(#comic-wobble-dark)" }}
                />
                <span className="relative z-10 font-anton text-xl sm:text-2xl text-black px-3 py-0.5 tracking-wider uppercase block">
                  SENTINEL OPS
                </span>
              </div>
              <span className="font-mono text-xs px-2.5 py-1 bg-red-600 text-white font-bold border-[2px] border-black shadow-[2px_2px_0px_#000000] rotate-[2deg] hidden sm:inline-block">
                SWARM HUD
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs font-bold">
            <Link
              href="/"
              className="px-3.5 py-1.5 bg-white text-black border-[2.5px] border-black shadow-[3px_3px_0px_#dc2626] hover:bg-red-600 hover:text-white hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#ffffff] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000000] transition-all"
            >
              ← Poster App
            </Link>
            <Link
              href="/checkout"
              className="px-3.5 py-1.5 bg-red-600 text-white border-[2.5px] border-black shadow-[3px_3px_0px_#ffffff] hover:bg-white hover:text-black hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#dc2626] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000000] transition-all"
            >
              Checkout Service →
            </Link>
            <Link
              href="/orders"
              className="px-3.5 py-1.5 bg-white text-black border-[2.5px] border-black shadow-[3px_3px_0px_#dc2626] hover:bg-black hover:text-white hover:border-white hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#ffffff] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000000] transition-all"
            >
              Orders
            </Link>
            <Link
              href="/incidents"
              className="px-3.5 py-1.5 bg-white text-black border-[2.5px] border-black shadow-[3px_3px_0px_#dc2626] hover:bg-red-600 hover:text-white hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#ffffff] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000000] transition-all"
            >
              Postmortem DB →
            </Link>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* MAIN HUD CONTAINER */}
        {/* ========================================================================= */}
        <main className="max-w-7xl mx-auto px-6 sm:px-12 py-12 space-y-10">
          {/* ========================================================================= */}
          {/* HERO BANNER: DISTORTED DRAWING WHITE BG BEHIND BIG TEXT (ANTON FONT) */}
          {/* ========================================================================= */}
          <div className="relative p-7 sm:p-9 bg-black/90 border-[3.5px] border-white shadow-[8px_8px_0px_0px_#dc2626] backdrop-blur-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="inline-block px-3 py-1 bg-red-600 text-white font-mono text-[11px] font-bold uppercase tracking-widest border-[2px] border-black rotate-[-1deg]">
                  01 // AUTONOMOUS INCIDENT INGESTION &amp; LIVE STREAM
                </div>

                {/* Distorted Drawing White Backplate with Anton Font */}
                <div className="relative inline-block mt-2">
                  <div
                    className="absolute -inset-2.5 sm:-inset-3.5 bg-white border-[3.5px] border-black shadow-[6px_6px_0px_#dc2626]"
                    style={{ filter: "url(#comic-wobble-hero)" }}
                  />
                  <h1 className="relative z-10 font-anton text-4xl sm:text-6xl text-black tracking-normal uppercase px-3.5 py-1 leading-tight">
                    SENTINELOPS INCIDENT HUD
                  </h1>
                </div>

                <p className="text-xs sm:text-sm font-mono text-zinc-300 max-w-2xl leading-relaxed pt-1">
                  TrueForge Multi-Agent Runtime &bull; Daytona Isolated Linux Sandbox &bull; Two-Stage Human Approval Gate
                </p>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                {incidentId ? (
                  <div className="relative rotate-[1.5deg]">
                    <div
                      className="absolute -inset-1.5 bg-white border-[2.5px] border-black shadow-[4px_4px_0px_#dc2626]"
                      style={{ filter: "url(#comic-wobble-dark)" }}
                    />
                    <span className="relative z-10 font-mono text-xs font-black text-black px-3 py-1 block">
                      INCIDENT: {incidentId.slice(0, 16)}...
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={handleLaunchNewIncident}
                    disabled={isSpawning}
                    className="px-6 py-3.5 bg-red-600 hover:bg-red-500 text-white font-anton text-sm uppercase tracking-wider border-[3px] border-black shadow-[5px_5px_0px_#ffffff] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0px_#ffffff] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[1px_1px_0px_#000000] transition-all disabled:opacity-50"
                  >
                    {isSpawning ? "SPAWNING SENTINELOPS..." : "⚡ LAUNCH INCIDENT SWARM ↗"}
                  </button>
                )}

                {incidentState?.status && (
                  <span className="px-3.5 py-1.5 bg-white text-black font-mono font-black text-xs uppercase border-[2.5px] border-black shadow-[3px_3px_0px_#dc2626] rotate-[-1deg]">
                    {incidentState.status}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Empty State Banner when no incident is connected */}
          {!incidentId && (
            <div className="p-8 sm:p-12 bg-black/85 border-[3.5px] border-white shadow-[8px_8px_0px_0px_#dc2626] backdrop-blur-2xl text-center space-y-6">
              <div className="relative inline-block">
                <div
                  className="absolute -inset-2 bg-white border-[3px] border-black shadow-[4px_4px_0px_#dc2626]"
                  style={{ filter: "url(#comic-wobble-dark)" }}
                />
                <h2 className="relative z-10 font-anton text-2xl sm:text-3xl text-black px-4 py-1.5 uppercase">
                  NO ACTIVE INCIDENT CONNECTED
                </h2>
              </div>

              <p className="text-xs sm:text-sm font-mono text-zinc-300 max-w-xl mx-auto leading-relaxed">
                Trigger a guest checkout error on the Checkout Service page, or click below to immediately launch an automated investigation swarm using the saved SentinelOps agent.
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
                <button
                  onClick={handleLaunchNewIncident}
                  disabled={isSpawning}
                  className="px-7 py-3.5 bg-red-600 hover:bg-red-500 text-white font-anton text-sm uppercase tracking-wider border-[3px] border-black shadow-[5px_5px_0px_#ffffff] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0px_#ffffff] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[1px_1px_0px_#000000] transition-all disabled:opacity-50"
                >
                  {isSpawning ? "INITIALIZING TRUEFORGE..." : "⚡ LAUNCH AUTONOMOUS SWARM INVESTIGATION ↗"}
                </button>
                <Link
                  href="/checkout"
                  className="px-6 py-3.5 bg-white hover:bg-zinc-200 text-black font-anton text-sm uppercase tracking-wider border-[3px] border-black shadow-[5px_5px_0px_#dc2626] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0px_#dc2626] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[1px_1px_0px_#000000] transition-all"
                >
                  GO TO CHECKOUT GATEWAY →
                </Link>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TWO-STAGE HITL APPROVAL CARDS (NEOBRUTALIST COMIC CARDS) */}
          {/* ========================================================================= */}

          {/* Checkpoint A: Fix Approval */}
          {incidentState?.status === "awaiting_fix_approval" && (
            <div className="p-8 bg-black/95 border-[3.5px] border-red-600 shadow-[10px_10px_0px_0px_#dc2626] space-y-6 rotate-[-0.5deg]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 rounded-full bg-red-600 border-[2px] border-white animate-ping" />
                  <div className="relative inline-block">
                    <div
                      className="absolute -inset-1.5 bg-white border-[3px] border-black shadow-[4px_4px_0px_#dc2626]"
                      style={{ filter: "url(#comic-wobble-dark)" }}
                    />
                    <h3 className="relative z-10 font-anton text-xl sm:text-2xl text-black px-3 py-1 uppercase">
                      CHECKPOINT A // APPROVAL TO DRAFT &amp; TEST FIX
                    </h3>
                  </div>
                </div>
                <span className="px-3 py-1 bg-red-600 text-white font-mono text-xs font-bold uppercase border-[2px] border-black">
                  HITL GATE 1 OF 2
                </span>
              </div>

              <p className="text-xs sm:text-sm font-mono text-zinc-200 leading-relaxed bg-zinc-900/90 p-3.5 border-[2px] border-white/20">
                SentinelOps has verified the root-cause hypothesis. Explicit human approval is required before drafting code or running candidate patches in the Daytona sandbox.
              </p>

              <div className="p-4 bg-white border-[3px] border-black shadow-[4px_4px_0px_#dc2626] text-black font-mono text-xs font-bold space-y-1">
                <p>
                  <strong className="text-red-600">TARGET REPO:</strong> Sourjya-Saha/checkout-services
                </p>
                <p>
                  <strong className="text-black">TARGET ERROR:</strong> {incidentState.error_message || "Active production regression"}
                </p>
                <p>
                  <strong className="text-zinc-600">ACTION:</strong> Install dependencies, apply safe fallback in payment_processor.py, and run sandbox verification.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <button
                  onClick={() => handleApproveAction("approve")}
                  disabled={isApproving}
                  className="px-7 py-3.5 bg-white hover:bg-zinc-200 text-black font-anton text-sm uppercase tracking-wider border-[3px] border-black shadow-[5px_5px_0px_#dc2626] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0px_#dc2626] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[1px_1px_0px_#000000] transition-all disabled:opacity-50"
                >
                  {isApproving && approvalDecision === "approve"
                    ? "TRANSMITTING APPROVAL..."
                    : "APPROVE: DRAFT & TEST FIX IN SANDBOX ↗"}
                </button>
                <button
                  onClick={() => handleApproveAction("deny")}
                  disabled={isApproving}
                  className="px-6 py-3.5 bg-red-600 hover:bg-red-500 text-white font-anton text-sm uppercase tracking-wider border-[3px] border-black shadow-[5px_5px_0px_#ffffff] transition-all"
                >
                  DENY
                </button>
              </div>
            </div>
          )}

          {/* Checkpoint B: Pull Request Approval */}
          {incidentState?.status === "awaiting_pr_approval" && (
            <div className="p-8 bg-black/95 border-[3.5px] border-white shadow-[10px_10px_0px_0px_#dc2626] space-y-6 rotate-[0.5deg]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 rounded-full bg-white border-[2px] border-red-600 animate-ping" />
                  <div className="relative inline-block">
                    <div
                      className="absolute -inset-1.5 bg-white border-[3px] border-black shadow-[4px_4px_0px_#dc2626]"
                      style={{ filter: "url(#comic-wobble-dark)" }}
                    />
                    <h3 className="relative z-10 font-anton text-xl sm:text-2xl text-black px-3 py-1 uppercase">
                      CHECKPOINT B // APPROVAL TO OPEN GITHUB PULL REQUEST
                    </h3>
                  </div>
                </div>
                <span className="px-3 py-1 bg-white text-black font-mono text-xs font-bold uppercase border-[2px] border-black">
                  HITL GATE 2 OF 2
                </span>
              </div>

              <p className="text-xs sm:text-sm font-mono text-zinc-200 leading-relaxed bg-zinc-900/90 p-3.5 border-[2px] border-white/20">
                Candidate patch successfully verified in the Daytona sandbox with all test suites passing. Explicit human approval is required before opening a Pull Request on GitHub.
              </p>

              <div className="p-4 bg-white border-[3px] border-black shadow-[4px_4px_0px_#dc2626] text-black font-mono text-xs font-bold space-y-1">
                <p>
                  <strong className="text-red-600">TARGET REPO:</strong> Sourjya-Saha/checkout-services
                </p>
                <p>
                  <strong className="text-black">DAYTONA PROOF:</strong> 100% verification checks passed in isolated Linux sandbox.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <button
                  onClick={() => handleApproveAction("approve")}
                  disabled={isApproving}
                  className="px-7 py-3.5 bg-red-600 hover:bg-red-500 text-white font-anton text-sm uppercase tracking-wider border-[3px] border-black shadow-[5px_5px_0px_#ffffff] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0px_#ffffff] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[1px_1px_0px_#000000] transition-all disabled:opacity-50"
                >
                  {isApproving && approvalDecision === "approve"
                    ? "OPENING GITHUB PR..."
                    : "APPROVE: OPEN GITHUB PULL REQUEST ↗"}
                </button>
                <button
                  onClick={() => handleApproveAction("deny")}
                  disabled={isApproving}
                  className="px-6 py-3.5 bg-white hover:bg-zinc-200 text-black font-anton text-sm uppercase tracking-wider border-[3px] border-black shadow-[5px_5px_0px_#dc2626] transition-all"
                >
                  DENY
                </button>
              </div>
            </div>
          )}

          {/* Resolved Banner */}
          {incidentState?.status === "resolved" && (
            <div className="p-8 bg-black/95 border-[3.5px] border-white shadow-[10px_10px_0px_0px_#dc2626] space-y-4">
              <div className="flex items-center justify-between">
                <div className="relative inline-block">
                  <div
                    className="absolute -inset-1.5 bg-white border-[3px] border-black shadow-[4px_4px_0px_#dc2626]"
                    style={{ filter: "url(#comic-wobble-dark)" }}
                  />
                  <h3 className="relative z-10 font-anton text-2xl sm:text-3xl text-black px-3.5 py-1 uppercase">
                    INCIDENT REMEDIATED &amp; RESOLVED
                  </h3>
                </div>
                <span className="px-4 py-1.5 bg-red-600 text-white font-mono text-xs font-bold uppercase border-[2px] border-black">
                  STATUS: RESOLVED ✓
                </span>
              </div>
              <p className="text-xs sm:text-sm font-mono text-zinc-200">
                The incident has been completely remediated, verified in sandbox, reviewed by Qodo AI, and recorded to Supabase persistent memory.
              </p>
              {incidentState.pr_url && (
                <a
                  href={incidentState.pr_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block px-6 py-3.5 bg-white hover:bg-red-600 hover:text-white text-black font-anton text-sm uppercase tracking-wider border-[3px] border-black shadow-[6px_6px_0px_#dc2626] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_#ffffff] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[1px_1px_0px_#000000] transition-all"
                >
                  VIEW PULL REQUEST ON GITHUB →
                </a>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* PARALLEL MULTI-AGENT SWARM (3 NEOBRUTALIST PANELS) */}
          {/* ========================================================================= */}
          <div className="space-y-4">
            <div className="relative inline-block">
              <div
                className="absolute -inset-1.5 bg-white border-[3px] border-black shadow-[4px_4px_0px_#dc2626]"
                style={{ filter: "url(#comic-wobble-dark)" }}
              />
              <span className="relative z-10 font-anton text-lg sm:text-xl text-black px-3.5 py-0.5 uppercase block">
                02 // PARALLEL MULTI-AGENT SWARM
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {subagents.map((sub) => (
                <div
                  key={sub.id}
                  className="p-6 bg-black/90 border-[3.5px] border-white shadow-[7px_7px_0px_0px_#dc2626] flex flex-col justify-between space-y-4 transition-transform hover:-translate-y-1"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b-[2px] border-white/20">
                      <span className="font-anton text-base text-white tracking-wide">{sub.name}</span>
                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 border-[2px] border-black shadow-[2px_2px_0px_#000] ${
                          sub.status === "completed"
                            ? "bg-white text-black"
                            : sub.status === "running"
                            ? "bg-red-600 text-white animate-pulse"
                            : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {sub.status}
                      </span>
                    </div>

                    <h4 className="font-anton text-lg text-red-500 uppercase tracking-wide">{sub.role}</h4>
                    <p className="text-xs font-mono text-zinc-400">{sub.metric}</p>
                  </div>

                  <div className="p-3.5 bg-zinc-950 border-[2px] border-white/20 font-mono text-xs text-zinc-200 min-h-[85px] leading-relaxed">
                    {sub.telemetry}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* LIVE TERMINAL & SSE EXECUTION STREAM */}
          {/* ========================================================================= */}
          <div className="space-y-4">
            <div className="relative inline-block">
              <div
                className="absolute -inset-1.5 bg-white border-[3px] border-black shadow-[4px_4px_0px_#dc2626]"
                style={{ filter: "url(#comic-wobble-dark)" }}
              />
              <span className="relative z-10 font-anton text-lg sm:text-xl text-black px-3.5 py-0.5 uppercase block">
                03 // LIVE TRUEFORGE SSE STREAM &amp; DAYTONA TERMINAL
              </span>
            </div>

            <div className="p-6 bg-black border-[3.5px] border-white shadow-[8px_8px_0px_0px_#dc2626] font-mono text-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/20 text-[11px] gap-2">
                <span className="text-zinc-300">
                  STREAM: {incidentId ? `/api/incidents/${incidentId}/stream` : "DISCONNECTED"}
                </span>
                <span className="text-red-500 font-bold">
                  SAVED AGENT: sentinelops ({SENTINELOPS_AGENT_ID})
                </span>
              </div>

              <div className="space-y-1.5 min-h-[180px] max-h-[320px] overflow-y-auto pr-2">
                {terminalLogs.length === 0 ? (
                  <p className="text-zinc-500">// Waiting for incident trigger on checkout-service...</p>
                ) : (
                  terminalLogs.map((log, idx) => (
                    <p
                      key={idx}
                      className={
                        log.includes("[🛑]") || log.includes("TypeError") || log.includes("KeyError")
                          ? "text-red-400 font-bold"
                          : log.includes("[✓]") || log.includes("PASS") || log.includes("Resolved")
                          ? "text-white font-bold underline"
                          : log.includes("[+]") || log.includes("[*]")
                          ? "text-zinc-300"
                          : "text-zinc-400"
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

        {/* Footer */}
        <footer className="mt-16 border-t-[3.5px] border-black bg-black/90 py-8 px-6 sm:px-12 text-zinc-400 font-mono text-xs">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-anton text-sm text-white uppercase">SENTINEL OPS</span> &bull; Autonomous Microservice Resilience Platform
            </div>
            <div className="flex items-center gap-4">
              <Link href="/checkout" className="hover:text-white transition-colors">
                Storefront
              </Link>
              <Link href="/orders" className="hover:text-white transition-colors">
                Orders
              </Link>
              <Link href="/incidents" className="hover:text-white transition-colors">
                Postmortem DB
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </Blurred404Background>
  );
}
