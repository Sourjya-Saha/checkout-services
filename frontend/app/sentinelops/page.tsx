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

export default function DistortedBlackBoxSentinelOpsCommander() {
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
                  `[OK] [PR CREATED] Successfully opened Pull Request: ${prMatch[0]}`,
                ]);
              }
            }
          }
          if (data.tool_calls && data.tool_calls.length > 0) {
            const tool = data.tool_calls[0];
            const args = tool.function?.arguments || "";
            setTerminalLogs((prev) => [
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
            `[OK] [TOOL RETURN] ${data.tool_name || "tool"}: response captured`,
          ]);
        }

        if (data.type === "sandbox.created") {
          setTerminalLogs((prev) => [
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
              `[!] [CHECKPOINT A] Human Approval required before drafting/testing fix in sandbox.`,
            ]);
          } else {
            setTerminalLogs((prev) => [
              `[!] [CHECKPOINT B] Human Approval required before opening GitHub Pull Request.`,
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
      {/* Google Fonts */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Space+Grotesk:wght@500;700;900&display=swap');
      `}</style>

      {/* SVG Distorted Drawing Filters for Comic Frames & Title Patches */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <filter id="comic-box-wobble" x="-6%" y="-6%" width="112%" height="112%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="5.5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="comic-title-wobble" x="-8%" y="-8%" width="116%" height="116%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="5.5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <div className="min-h-screen text-white font-['Space_Grotesk',sans-serif] antialiased selection:bg-red-600 selection:text-white pb-24">
        {/* ========================================================================= */}
        {/* TOP NAVIGATION BAR (SINGLE REDIRECTION BUTTON: POSTMORTEM REPORTS) */}
        {/* ========================================================================= */}
        <header className="px-6 sm:px-12 py-5 border-b-[3.5px] border-black bg-black/90 backdrop-blur-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_6px_0_0_#dc2626]">
          <div className="flex items-center gap-3">
            {/* Distorted White Background Patch for SENTINEL OPS (TIGHTER & DISTORTED) */}
            <Link href="/" className="group flex items-center gap-3">
              <div
                className="relative inline-block rotate-[-1.5deg] group-hover:rotate-0 transition-transform"
                style={{ filter: "url(#comic-title-wobble)" }}
              >
                <div className="absolute -inset-2 bg-white border-[3.5px] border-black shadow-[4px_4px_0px_#dc2626]" />
                <span className="relative z-10 font-anton text-2xl sm:text-3xl text-black px-3.5 py-0.5 tracking-tighter uppercase block">
                  SENTINEL OPS
                </span>
              </div>

              {/* Clean Comic SWARM HUD Tag */}
              <div className="relative inline-block rotate-[2deg]">
                <div className="absolute -inset-1 bg-red-600 border-[2px] border-black shadow-[2px_2px_0px_#000000]" />
                <span className="relative z-10 font-anton text-xs text-white px-3 py-0.5 uppercase tracking-wider block">
                  SWARM HUD
                </span>
              </div>
            </Link>
          </div>

          {/* ONLY 1 Redirection Button */}
          <div className="flex items-center">
            <Link
              href="/incidents"
              className="relative inline-block group rotate-[-1deg] hover:rotate-0 transition-transform"
            >
              <div className="absolute -inset-1 bg-white border-[3px] border-black shadow-[4px_4px_0px_#dc2626] group-hover:shadow-[6px_6px_0px_#ffffff] group-hover:bg-red-600 transition-all" />
              <span className="relative z-10 font-anton text-sm sm:text-base text-black group-hover:text-white px-5 py-2 uppercase tracking-wide flex items-center gap-2 block transition-colors">
                <span>POSTMORTEM REPORTS</span>
                <span>→</span>
              </span>
            </Link>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* MAIN HUD CONTAINER (PUSHED MORE DOWNWARDS WITH pt-14 sm:pt-20) */}
        {/* ========================================================================= */}
        <main className="max-w-7xl mx-auto px-6 sm:px-12 pt-14 sm:pt-20 space-y-12">
          {/* ========================================================================= */}
          {/* 1. HERO BANNER: DISTORTED BLACK CONTAINER BOX + TIGHT DISTORTED TITLE */}
          {/* ========================================================================= */}
          <div className="relative p-8 sm:p-12 rotate-[-0.3deg]">
            {/* Distorted Black Box Background Layer */}
            <div
              className="absolute inset-0 bg-black/95 border-[4px] border-white shadow-[9px_9px_0px_0px_#dc2626]"
              style={{ filter: "url(#comic-box-wobble)" }}
            />

            {/* Content inside Hero Banner */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="space-y-5">
                {/* Subtitle Badge */}
                <div className="relative inline-block rotate-[0.5deg]">
                  <div className="absolute -inset-1 bg-red-600 border-[2px] border-black shadow-[3px_3px_0px_#ffffff]" />
                  <span className="relative z-10 font-anton text-xs sm:text-sm text-white px-3.5 py-1 tracking-wider uppercase block">
                    01 // AUTONOMOUS INCIDENT INGESTION &amp; LIVE STREAM
                  </span>
                </div>

                {/* Big Title: SENTINELOPS INCIDENT HUD (TIGHTER & DISTORTED) */}
                <div>
                  <div
                    className="relative inline-block mt-1"
                    style={{ filter: "url(#comic-title-wobble)" }}
                  >
                    <div className="absolute -inset-2.5 sm:-inset-4 bg-white border-[4px] border-black shadow-[6px_6px_0px_#dc2626]" />
                    <h1 className="relative z-10 font-anton text-4xl sm:text-6xl md:text-7xl text-black tracking-tighter uppercase px-4 py-1.5 leading-none block">
                      SENTINELOPS INCIDENT HUD
                    </h1>
                  </div>
                </div>

                {/* Specs Ribbon (EXPANDED LETTER SPACING) */}
                <div className="relative inline-block pt-2">
                  <div className="absolute -inset-1.5 bg-zinc-900 border-[2px] border-white shadow-[3px_3px_0px_#dc2626]" />
                  <p className="relative z-10 text-xs sm:text-[13px] font-anton text-zinc-100 px-4 py-1.5 flex items-center gap-3 flex-wrap tracking-[0.18em] uppercase">
                    <span className="text-red-500">TRUEFORGE AGENT RUNTIME</span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-white">DAYTONA LINUX SANDBOX</span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-red-500">TWO-STAGE HITL APPROVAL</span>
                  </p>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {incidentId ? (
                  <div className="relative rotate-[1deg]">
                    <div className="absolute -inset-1.5 bg-white border-[2.5px] border-black shadow-[4px_4px_0px_#dc2626]" />
                    <span className="relative z-10 font-anton text-sm text-black px-3.5 py-1.5 uppercase block">
                      INCIDENT: {incidentId.slice(0, 16)}...
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={handleLaunchNewIncident}
                    disabled={isSpawning}
                    className="relative group rotate-[-1deg] hover:rotate-0 transition-transform"
                  >
                    <div className="absolute -inset-1.5 bg-red-600 border-[3px] border-black shadow-[5px_5px_0px_#ffffff] group-hover:shadow-[7px_7px_0px_#ffffff]" />
                    <span className="relative z-10 font-anton text-sm text-white px-6 py-3 uppercase tracking-wider block">
                      {isSpawning ? "SPAWNING SWARM..." : "LAUNCH INCIDENT SWARM →"}
                    </span>
                  </button>
                )}

                {incidentState?.status && (
                  <div className="relative rotate-[-1deg]">
                    <div className="absolute -inset-1 bg-white border-[2px] border-black shadow-[3px_3px_0px_#dc2626]" />
                    <span className="relative z-10 font-anton text-xs text-black px-3 py-1 uppercase block">
                      STATUS: {incidentState.status}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Empty State Banner when no incident is connected */}
          {!incidentId && (
            <div className="relative p-8 sm:p-12 text-center space-y-6 rotate-[0.2deg]">
              <div
                className="absolute inset-0 bg-black/90 border-[3.5px] border-white shadow-[8px_8px_0px_0px_#dc2626]"
                style={{ filter: "url(#comic-box-wobble)" }}
              />
              <div className="relative z-10 space-y-6">
                <div className="relative inline-block">
                  <div className="absolute -inset-2 bg-white border-[3px] border-black shadow-[4px_4px_0px_#dc2626]" />
                  <h2 className="relative z-10 font-anton text-2xl sm:text-4xl text-black px-5 py-2 uppercase">
                    NO ACTIVE INCIDENT CONNECTED
                  </h2>
                </div>

                <p className="text-xs sm:text-sm font-bold text-zinc-300 max-w-xl mx-auto leading-relaxed">
                  Trigger a guest checkout error on the Checkout Service page, or click below to immediately launch an automated investigation swarm using the saved SentinelOps agent.
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
                  <button
                    onClick={handleLaunchNewIncident}
                    disabled={isSpawning}
                    className="px-7 py-3.5 bg-red-600 hover:bg-red-500 text-white font-anton text-sm uppercase tracking-wider border-[3px] border-black shadow-[5px_5px_0px_#ffffff] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0px_#ffffff] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[1px_1px_0px_#000000] transition-all disabled:opacity-50"
                  >
                    {isSpawning ? "INITIALIZING TRUEFORGE..." : "LAUNCH AUTONOMOUS SWARM INVESTIGATION →"}
                  </button>
                  <Link
                    href="/checkout"
                    className="px-6 py-3.5 bg-white hover:bg-zinc-200 text-black font-anton text-sm uppercase tracking-wider border-[3px] border-black shadow-[5px_5px_0px_#dc2626] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0px_#dc2626] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[1px_1px_0px_#000000] transition-all"
                  >
                    GO TO CHECKOUT GATEWAY →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TWO-STAGE HITL APPROVAL CARDS (DISTORTED BLACK BOXES) */}
          {/* ========================================================================= */}

          {/* Checkpoint A: Fix Approval */}
          {incidentState?.status === "awaiting_fix_approval" && (
            <div className="relative p-8 space-y-6 rotate-[-0.4deg]">
              <div
                className="absolute inset-0 bg-black/95 border-[3.5px] border-red-600 shadow-[9px_9px_0px_0px_#dc2626]"
                style={{ filter: "url(#comic-box-wobble)" }}
              />

              <div className="relative z-10 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-3.5 h-3.5 rounded-full bg-red-600 border-[2px] border-white animate-ping" />
                    <div className="relative inline-block">
                      <div className="absolute -inset-1.5 bg-white border-[3px] border-black shadow-[4px_4px_0px_#dc2626]" />
                      <h3 className="relative z-10 font-anton text-xl sm:text-2xl text-black px-4 py-1 uppercase">
                        CHECKPOINT A // APPROVAL TO DRAFT &amp; TEST FIX
                      </h3>
                    </div>
                  </div>
                  <div className="relative rotate-[1.5deg]">
                    <div className="absolute -inset-1 bg-red-600 border-[2px] border-black shadow-[2px_2px_0px_#ffffff]" />
                    <span className="relative z-10 font-anton text-xs text-white px-3 py-1 uppercase block">
                      HITL GATE 1 OF 2
                    </span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm font-bold text-zinc-100 leading-relaxed bg-zinc-900/90 p-4 border-[2px] border-white/30">
                  SentinelOps has verified the root-cause hypothesis. Explicit human approval is required before drafting code or running candidate patches in the Daytona sandbox.
                </p>

                <div className="p-4 bg-white border-[3px] border-black shadow-[4px_4px_0px_#dc2626] text-black font-mono text-xs font-bold space-y-1.5">
                  <p>
                    <strong className="text-red-600 font-anton text-sm">TARGET REPO:</strong> Sourjya-Saha/checkout-services
                  </p>
                  <p>
                    <strong className="text-black font-anton text-sm">TARGET ERROR:</strong> {incidentState.error_message || "Active production regression"}
                  </p>
                  <p>
                    <strong className="text-zinc-600 font-anton text-sm">ACTION:</strong> Install dependencies, apply safe fallback in payment_processor.py, and run sandbox verification.
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
                      : "APPROVE: DRAFT & TEST FIX IN SANDBOX →"}
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
            </div>
          )}

          {/* Checkpoint B: Pull Request Approval */}
          {incidentState?.status === "awaiting_pr_approval" && (
            <div className="relative p-8 space-y-6 rotate-[0.4deg]">
              <div
                className="absolute inset-0 bg-black/95 border-[3.5px] border-white shadow-[9px_9px_0px_0px_#dc2626]"
                style={{ filter: "url(#comic-box-wobble)" }}
              />

              <div className="relative z-10 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-3.5 h-3.5 rounded-full bg-white border-[2px] border-red-600 animate-ping" />
                    <div className="relative inline-block">
                      <div className="absolute -inset-1.5 bg-white border-[3px] border-black shadow-[4px_4px_0px_#dc2626]" />
                      <h3 className="relative z-10 font-anton text-xl sm:text-2xl text-black px-4 py-1 uppercase">
                        CHECKPOINT B // APPROVAL TO OPEN GITHUB PULL REQUEST
                      </h3>
                    </div>
                  </div>
                  <div className="relative rotate-[-1.5deg]">
                    <div className="absolute -inset-1 bg-white border-[2px] border-black shadow-[2px_2px_0px_#dc2626]" />
                    <span className="relative z-10 font-anton text-xs text-black px-3 py-1 uppercase block">
                      HITL GATE 2 OF 2
                    </span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm font-bold text-zinc-100 leading-relaxed bg-zinc-900/90 p-4 border-[2px] border-white/30">
                  Candidate patch successfully verified in the Daytona sandbox with all test suites passing. Explicit human approval is required before opening a Pull Request on GitHub.
                </p>

                <div className="p-4 bg-white border-[3px] border-black shadow-[4px_4px_0px_#dc2626] text-black font-mono text-xs font-bold space-y-1.5">
                  <p>
                    <strong className="text-red-600 font-anton text-sm">TARGET REPO:</strong> Sourjya-Saha/checkout-services
                  </p>
                  <p>
                    <strong className="text-black font-anton text-sm">DAYTONA PROOF:</strong> 100% verification checks passed in isolated Linux sandbox.
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
                      : "APPROVE: OPEN GITHUB PULL REQUEST →"}
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
            </div>
          )}

          {/* Resolved Banner */}
          {incidentState?.status === "resolved" && (
            <div className="relative p-8 space-y-4">
              <div
                className="absolute inset-0 bg-black/95 border-[3.5px] border-white shadow-[9px_9px_0px_0px_#dc2626]"
                style={{ filter: "url(#comic-box-wobble)" }}
              />

              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="relative inline-block">
                    <div className="absolute -inset-1.5 bg-white border-[3px] border-black shadow-[4px_4px_0px_#dc2626]" />
                    <h3 className="relative z-10 font-anton text-2xl sm:text-3xl text-black px-4 py-1 uppercase">
                      INCIDENT REMEDIATED &amp; RESOLVED
                    </h3>
                  </div>
                  <span className="px-4 py-1.5 bg-red-600 text-white font-anton text-xs uppercase border-[2px] border-black">
                    STATUS: RESOLVED [OK]
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-bold text-zinc-200">
                  The incident has been completely remediated, verified in sandbox, reviewed by Qodo AI, and recorded to Supabase persistent memory.
                </p>
                {incidentState.pr_url && (
                  <a
                    href={incidentState.pr_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block px-6 py-3.5 bg-white hover:bg-red-600 hover:text-white text-black font-anton text-sm uppercase tracking-wider border-[3px] border-black shadow-[5px_5px_0px_#dc2626] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0px_#ffffff] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[1px_1px_0px_#000000] transition-all"
                  >
                    VIEW PULL REQUEST ON GITHUB →
                  </a>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. PARALLEL MULTI-AGENT SWARM (DISTORTED BLACK BOXES) */}
          {/* ========================================================================= */}
          <div className="space-y-5">
            {/* Section Tag */}
            <div className="relative inline-block rotate-[-0.8deg]">
              <div className="absolute -inset-1.5 bg-white border-[3px] border-black shadow-[4px_4px_0px_#dc2626]" />
              <span className="relative z-10 font-anton text-xl sm:text-2xl text-black px-4 py-1 uppercase block">
                02 // PARALLEL MULTI-AGENT SWARM
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {subagents.map((sub, idx) => {
                const rot = idx === 0 ? "rotate-[-0.5deg]" : idx === 1 ? "rotate-[0.5deg]" : "rotate-[-0.3deg]";

                return (
                  <div
                    key={sub.id}
                    className={`relative p-6 flex flex-col justify-between space-y-4 transition-transform hover:-translate-y-1 ${rot}`}
                  >
                    {/* Distorted Black Box Background Layer */}
                    <div
                      className="absolute inset-0 bg-black/95 border-[3.5px] border-white shadow-[7px_7px_0px_0px_#dc2626]"
                      style={{ filter: "url(#comic-box-wobble)" }}
                    />

                    {/* Content inside Subagent Card */}
                    <div className="relative z-10 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b-[2px] border-white/20">
                        {/* Subagent Name in Clean White Patch */}
                        <div className="relative inline-block">
                          <div className="absolute -inset-1 bg-white border-[2px] border-black" />
                          <span className="relative z-10 font-anton text-sm text-black px-2.5 py-0.5 tracking-wide block">
                            {sub.name}
                          </span>
                        </div>

                        <span
                          className={`text-[10px] font-anton uppercase px-2.5 py-0.5 border-[2px] border-black shadow-[2px_2px_0px_#000] ${
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

                      <h4 className="font-anton text-lg text-red-500 uppercase tracking-wide leading-tight">{sub.role}</h4>
                      <p className="text-xs font-mono font-bold text-zinc-300">{sub.metric}</p>
                    </div>

                    <div className="relative z-10 p-3.5 bg-zinc-950 border-[1.5px] border-white/30 font-mono text-xs text-zinc-200 min-h-[85px] leading-relaxed">
                      {sub.telemetry}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. LIVE TERMINAL & SSE EXECUTION STREAM (DISTORTED BLACK BOX) */}
          {/* ========================================================================= */}
          <div className="space-y-5">
            {/* Section Tag */}
            <div className="relative inline-block rotate-[0.8deg]">
              <div className="absolute -inset-1.5 bg-white border-[3px] border-black shadow-[4px_4px_0px_#dc2626]" />
              <span className="relative z-10 font-anton text-xl sm:text-2xl text-black px-4 py-1 uppercase block">
                03 // LIVE TRUEFORGE SSE STREAM &amp; DAYTONA TERMINAL
              </span>
            </div>

            {/* Distorted Terminal Box */}
            <div className="relative p-7 font-mono text-xs space-y-4 rotate-[-0.2deg]">
              {/* Distorted Black Box Background Layer */}
              <div
                className="absolute inset-0 bg-black/95 border-[3.5px] border-white shadow-[8px_8px_0px_0px_#dc2626]"
                style={{ filter: "url(#comic-box-wobble)" }}
              />

              {/* Terminal Content */}
              <div className="relative z-10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b-[2px] border-white/20 text-[11px] gap-2">
                  <div className="relative inline-block">
                    <div className="absolute -inset-1 bg-zinc-900 border-[1.5px] border-red-600" />
                    <span className="relative z-10 text-white font-bold px-2 py-0.5 block">
                      STREAM: {incidentId ? `/api/incidents/${incidentId}/stream` : "DISCONNECTED"}
                    </span>
                  </div>

                  <span className="text-red-500 font-anton text-xs uppercase tracking-wider">
                    SAVED AGENT: sentinelops ({SENTINELOPS_AGENT_ID})
                  </span>
                </div>

                <div className="space-y-2 min-h-[200px] max-h-[340px] overflow-y-auto pr-2">
                  {terminalLogs.length === 0 ? (
                    <p className="text-zinc-500 font-mono text-xs">// Waiting for incident trigger on checkout-service...</p>
                  ) : (
                    terminalLogs.map((log, idx) => (
                      <p
                        key={idx}
                        className={
                          log.includes("[!]") || log.includes("TypeError") || log.includes("KeyError")
                            ? "text-red-400 font-bold"
                            : log.includes("[OK]") || log.includes("PASS") || log.includes("Resolved")
                            ? "text-white font-bold underline"
                            : log.includes("[+]") || log.includes("[*]")
                            ? "text-zinc-200"
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
          </div>
        </main>

        {/* Comic Footer */}
        <footer className="mt-20 border-t-[3.5px] border-black bg-black/90 py-8 px-6 sm:px-12 text-zinc-400 font-mono text-xs">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-anton text-sm text-white uppercase">SENTINEL OPS</span> &bull; Autonomous Microservice Resilience Platform
            </div>
            <div>
              <Link href="/incidents" className="text-red-500 hover:text-white font-anton uppercase transition-colors">
                POSTMORTEM REPORTS LEDGER →
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </Blurred404Background>
  );
}
