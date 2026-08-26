"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

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

export default function ComicNeobrutalismSentinelOpsCommander() {
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
    <div className="min-h-screen bg-[#FFF9E6] text-[#000000] font-['Space_Grotesk',sans-serif] selection:bg-[#FFE600] selection:text-black antialiased relative overflow-x-hidden">
      {/* Import Google Comic & Neobrutalism Fonts */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Bungee&family=Space+Grotesk:wght@500;700;900&family=Permanent+Marker&family=Chakra+Petch:wght@700;900&display=swap');
      `}</style>

      {/* SVG Distorted Comic Drawing Filters */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <filter id="comic-wobble-1" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="comic-wobble-2" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="5.5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* Pop-Art Halftone Dotted Background Overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20 -z-10"
        style={{
          backgroundImage: "radial-gradient(#000000 2px, transparent 2px)",
          backgroundSize: "20px 20px",
        }}
      />

      {/* ========================================================================= */}
      {/* TOP COMIC NAVIGATION BAR */}
      {/* ========================================================================= */}
      <nav className="sticky top-0 z-50 bg-[#FFE600] border-b-[4px] border-black px-6 sm:px-12 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_4px_0_0_#000000]">
        <div className="flex items-center gap-4">
          {/* Distorted Drawing Title Badge */}
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative inline-block rotate-[-2deg] group-hover:rotate-0 transition-transform">
              {/* Distorted White Background Patch */}
              <div
                className="absolute -inset-1.5 bg-white border-[3px] border-black shadow-[4px_4px_0px_#000000]"
                style={{ filter: "url(#comic-wobble-1)" }}
              />
              <span className="relative z-10 font-['Bungee',sans-serif] text-lg sm:text-xl text-black px-2 py-0.5 tracking-wider block">
                ⚡ SENTINELOPS
              </span>
            </div>
            <span className="font-['Permanent_Marker',cursive] text-xs px-2.5 py-1 bg-[#00F0FF] border-[2px] border-black shadow-[2px_2px_0px_#000000] rotate-[3deg] hidden sm:inline-block">
              SWARM HUD!
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3 font-['Space_Grotesk',sans-serif] text-xs font-bold">
          <Link
            href="/"
            className="px-3 py-1.5 bg-white border-[2.5px] border-black shadow-[3px_3px_0px_#000000] hover:bg-[#FF3366] hover:text-white hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000000] transition-all"
          >
            ← 404 Poster
          </Link>
          <Link
            href="/checkout"
            className="px-3 py-1.5 bg-[#00FF66] border-[2.5px] border-black shadow-[3px_3px_0px_#000000] hover:bg-black hover:text-[#00FF66] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000000] transition-all"
          >
            Checkout Store →
          </Link>
          <Link
            href="/orders"
            className="px-3 py-1.5 bg-white border-[2.5px] border-black shadow-[3px_3px_0px_#000000] hover:bg-[#FFE600] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000000] transition-all"
          >
            Orders & Receipts
          </Link>
          <Link
            href="/incidents"
            className="px-3 py-1.5 bg-[#00F0FF] border-[2.5px] border-black shadow-[3px_3px_0px_#000000] hover:bg-black hover:text-[#00F0FF] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000000] transition-all"
          >
            Postmortem DB →
          </Link>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* MAIN COMIC COMMAND CENTER CONTAINER */}
      {/* ========================================================================= */}
      <main className="max-w-7xl mx-auto px-6 sm:px-10 py-10 space-y-10">
        {/* ========================================================================= */}
        {/* HERO TITLE BANNER (WHITE DISTORTED DRAWING BG BEHIND BIG TEXT) */}
        {/* ========================================================================= */}
        <div className="relative p-6 sm:p-8 bg-[#00F0FF] border-[4px] border-black shadow-[8px_8px_0px_0px_#000000] rounded-none rotate-[-0.5deg]">
          {/* Halftone dot pattern inside banner */}
          <div
            className="absolute inset-0 pointer-events-none opacity-15"
            style={{
              backgroundImage: "radial-gradient(#000000 2px, transparent 2px)",
              backgroundSize: "14px 14px",
            }}
          />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-block px-3 py-1 bg-black text-[#FFE600] font-['Bungee',sans-serif] text-[11px] uppercase tracking-widest border-[2px] border-black rotate-[1deg]">
                💥 MISSION CONTROL // ACTIVE SRE SWARM
              </div>

              {/* Distorted Drawing White Backplate for Big Headline */}
              <div className="relative inline-block mt-2">
                <div
                  className="absolute -inset-2 sm:-inset-3 bg-white border-[4px] border-black shadow-[6px_6px_0px_#000000]"
                  style={{ filter: "url(#comic-wobble-2)" }}
                />
                <h1 className="relative z-10 text-3xl sm:text-5xl font-['Bungee',sans-serif] text-black tracking-tight uppercase px-3 py-1.5 leading-none">
                  AUTONOMOUS INCIDENT HUD
                </h1>
              </div>

              <p className="text-xs sm:text-sm font-bold font-['Space_Grotesk',sans-serif] text-black max-w-2xl bg-white/80 p-2 border-[2px] border-black inline-block mt-2">
                TrueForge Multi-Agent Runtime &bull; Daytona Isolated Linux Sandbox &bull; Two-Stage Human Approval
              </p>
            </div>

            {/* Quick Actions & Status Badge */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {incidentId ? (
                <div className="relative rotate-[2deg]">
                  <div
                    className="absolute -inset-1.5 bg-white border-[3px] border-black shadow-[4px_4px_0px_#000000]"
                    style={{ filter: "url(#comic-wobble-1)" }}
                  />
                  <span className="relative z-10 font-['Space_Grotesk',sans-serif] text-xs font-black text-black px-3 py-1 block">
                    INCIDENT: {incidentId.slice(0, 14)}...
                  </span>
                </div>
              ) : (
                <button
                  onClick={handleLaunchNewIncident}
                  disabled={isSpawning}
                  className="px-6 py-3.5 bg-[#FF3366] hover:bg-[#FF0044] text-white font-['Bungee',sans-serif] text-xs uppercase tracking-wider border-[3.5px] border-black shadow-[6px_6px_0px_#000000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_#000000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[2px_2px_0px_#000000] transition-all disabled:opacity-50"
                >
                  {isSpawning ? "SPAWNING SWARM..." : "⚡ LAUNCH INCIDENT SWARM ↗"}
                </button>
              )}

              {incidentState?.status && (
                <span className="px-3.5 py-1.5 bg-[#FFE600] text-black font-['Bungee',sans-serif] text-[11px] uppercase border-[3px] border-black shadow-[3px_3px_0px_#000000] rotate-[-2deg]">
                  {incidentState.status}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* If no incident is active, comic empty state card */}
        {!incidentId && (
          <div className="p-8 sm:p-12 bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_#000000] text-center space-y-6 relative overflow-hidden">
            <div className="relative inline-block">
              <div
                className="absolute -inset-2 bg-[#FFE600] border-[3px] border-black shadow-[4px_4px_0px_#000000]"
                style={{ filter: "url(#comic-wobble-1)" }}
              />
              <h2 className="relative z-10 font-['Bungee',sans-serif] text-2xl sm:text-3xl text-black px-4 py-2 uppercase">
                NO ACTIVE INCIDENT CONNECTED!
              </h2>
            </div>

            <p className="text-sm font-bold text-black max-w-xl mx-auto leading-relaxed">
              Trigger a guest checkout error on the Checkout Service page, or click below to immediately launch an automated investigation swarm using the saved SentinelOps agent.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
              <button
                onClick={handleLaunchNewIncident}
                disabled={isSpawning}
                className="px-7 py-4 bg-[#FF3366] hover:bg-[#FF0044] text-white font-['Bungee',sans-serif] text-xs uppercase tracking-widest border-[3.5px] border-black shadow-[6px_6px_0px_#000000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_#000000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[2px_2px_0px_#000000] transition-all disabled:opacity-50"
              >
                {isSpawning ? "INITIALIZING SESSION..." : "⚡ LAUNCH AUTONOMOUS SWARM INVESTIGATION ↗"}
              </button>
              <Link
                href="/checkout"
                className="px-6 py-4 bg-[#00FF66] hover:bg-[#00DD55] text-black font-['Bungee',sans-serif] text-xs uppercase tracking-widest border-[3.5px] border-black shadow-[6px_6px_0px_#000000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_#000000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[2px_2px_0px_#000000] transition-all"
              >
                GO TO CHECKOUT STORE →
              </Link>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TWO-STAGE HITL APPROVAL CARDS (COMIC COMBO BOXES) */}
        {/* ========================================================================= */}

        {/* Checkpoint A: Fix Approval */}
        {incidentState?.status === "awaiting_fix_approval" && (
          <div className="p-8 bg-[#FFE600] border-[4.5px] border-black shadow-[10px_10px_0px_0px_#000000] space-y-6 rotate-[-0.5deg]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#FF3366] border-[2px] border-black animate-ping" />
                <div className="relative inline-block">
                  <div
                    className="absolute -inset-1.5 bg-white border-[3px] border-black shadow-[4px_4px_0px_#000000]"
                    style={{ filter: "url(#comic-wobble-1)" }}
                  />
                  <h3 className="relative z-10 text-xl font-['Bungee',sans-serif] text-black px-3 py-1 uppercase">
                    🛑 CHECKPOINT A // APPROVAL TO DRAFT &amp; TEST FIX
                  </h3>
                </div>
              </div>
              <span className="px-3 py-1 bg-black text-[#00FF66] font-['Bungee',sans-serif] text-xs uppercase border-[2px] border-black">
                HITL GATE 1 OF 2
              </span>
            </div>

            <p className="text-sm font-bold text-black leading-relaxed bg-white/90 p-3 border-[2px] border-black">
              SentinelOps has verified the root-cause hypothesis. Explicit human approval is required before drafting code or running candidate patches in the Daytona sandbox.
            </p>

            <div className="p-4 bg-white border-[3px] border-black shadow-[4px_4px_0px_#000000] space-y-1.5 text-xs font-bold">
              <p>
                <span className="text-[#FF3366] uppercase font-['Bungee',sans-serif]">Target Repo:</span> Sourjya-Saha/checkout-services
              </p>
              <p>
                <span className="text-[#00F0FF] uppercase font-['Bungee',sans-serif]">Target Error:</span> {incidentState.error_message || "Active production regression"}
              </p>
              <p>
                <span className="text-black uppercase font-['Bungee',sans-serif]">Proposed Action:</span> Install dependencies, apply safe fallback in payment_processor.py, and run sandbox verification.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={() => handleApproveAction("approve")}
                disabled={isApproving}
                className="px-7 py-3.5 bg-[#00FF66] hover:bg-[#00EE55] text-black font-['Bungee',sans-serif] text-xs uppercase tracking-wider border-[3.5px] border-black shadow-[6px_6px_0px_#000000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_#000000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[2px_2px_0px_#000000] transition-all disabled:opacity-50"
              >
                {isApproving && approvalDecision === "approve"
                  ? "TRANSMITTING APPROVAL..."
                  : "APPROVE: DRAFT & TEST FIX IN SANDBOX ↗"}
              </button>
              <button
                onClick={() => handleApproveAction("deny")}
                disabled={isApproving}
                className="px-6 py-3.5 bg-[#FF3366] hover:bg-[#FF0044] text-white font-['Bungee',sans-serif] text-xs uppercase tracking-wider border-[3.5px] border-black shadow-[6px_6px_0px_#000000] transition-all"
              >
                DENY
              </button>
            </div>
          </div>
        )}

        {/* Checkpoint B: Pull Request Approval */}
        {incidentState?.status === "awaiting_pr_approval" && (
          <div className="p-8 bg-[#00F0FF] border-[4.5px] border-black shadow-[10px_10px_0px_0px_#000000] space-y-6 rotate-[0.5deg]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#FFE600] border-[2px] border-black animate-ping" />
                <div className="relative inline-block">
                  <div
                    className="absolute -inset-1.5 bg-white border-[3px] border-black shadow-[4px_4px_0px_#000000]"
                    style={{ filter: "url(#comic-wobble-1)" }}
                  />
                  <h3 className="relative z-10 text-xl font-['Bungee',sans-serif] text-black px-3 py-1 uppercase">
                    🛑 CHECKPOINT B // APPROVAL TO OPEN GITHUB PULL REQUEST
                  </h3>
                </div>
              </div>
              <span className="px-3 py-1 bg-black text-[#FFE600] font-['Bungee',sans-serif] text-xs uppercase border-[2px] border-black">
                HITL GATE 2 OF 2
              </span>
            </div>

            <p className="text-sm font-bold text-black leading-relaxed bg-white/90 p-3 border-[2px] border-black">
              Candidate patch successfully verified in the Daytona sandbox with all test suites passing. Explicit human approval is required before opening a Pull Request on GitHub.
            </p>

            <div className="p-4 bg-white border-[3px] border-black shadow-[4px_4px_0px_#000000] space-y-1.5 text-xs font-bold">
              <p>
                <span className="text-[#00F0FF] uppercase font-['Bungee',sans-serif]">Target Repo:</span> Sourjya-Saha/checkout-services
              </p>
              <p className="text-[#00CC44]">
                <span className="text-black uppercase font-['Bungee',sans-serif]">Daytona Proof:</span> 100% verification checks passed in isolated Linux sandbox.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={() => handleApproveAction("approve")}
                disabled={isApproving}
                className="px-7 py-3.5 bg-[#FFE600] hover:bg-[#FFF066] text-black font-['Bungee',sans-serif] text-xs uppercase tracking-wider border-[3.5px] border-black shadow-[6px_6px_0px_#000000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_#000000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[2px_2px_0px_#000000] transition-all disabled:opacity-50"
              >
                {isApproving && approvalDecision === "approve"
                  ? "OPENING GITHUB PR..."
                  : "APPROVE: OPEN GITHUB PULL REQUEST ↗"}
              </button>
              <button
                onClick={() => handleApproveAction("deny")}
                disabled={isApproving}
                className="px-6 py-3.5 bg-[#FF3366] hover:bg-[#FF0044] text-white font-['Bungee',sans-serif] text-xs uppercase tracking-wider border-[3.5px] border-black shadow-[6px_6px_0px_#000000] transition-all"
              >
                DENY
              </button>
            </div>
          </div>
        )}

        {/* Resolved Banner */}
        {incidentState?.status === "resolved" && (
          <div className="p-8 bg-[#00FF66] border-[4.5px] border-black shadow-[10px_10px_0px_0px_#000000] space-y-4">
            <div className="flex items-center justify-between">
              <div className="relative inline-block">
                <div
                  className="absolute -inset-1.5 bg-white border-[3px] border-black shadow-[4px_4px_0px_#000000]"
                  style={{ filter: "url(#comic-wobble-1)" }}
                />
                <h3 className="relative z-10 text-2xl font-['Bungee',sans-serif] text-black px-3 py-1 uppercase">
                  🎉 INCIDENT REMEDIATED &amp; RESOLVED!
                </h3>
              </div>
              <span className="px-4 py-1.5 bg-black text-[#00FF66] font-['Bungee',sans-serif] text-xs uppercase border-[2px] border-black">
                STATUS: RESOLVED ✓
              </span>
            </div>
            <p className="text-sm font-bold text-black">
              The incident has been completely remediated, reviewed by Qodo AI, and logged to Supabase persistent memory.
            </p>
            {incidentState.pr_url && (
              <a
                href={incidentState.pr_url}
                target="_blank"
                rel="noreferrer"
                className="inline-block px-6 py-3.5 bg-white hover:bg-black hover:text-white text-black font-['Bungee',sans-serif] text-xs uppercase tracking-widest border-[3.5px] border-black shadow-[6px_6px_0px_#000000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_#000000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[2px_2px_0px_#000000] transition-all"
              >
                VIEW PULL REQUEST ON GITHUB →
              </a>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* PARALLEL MULTI-AGENT SWARM (3 COMIC AGENT PANELS) */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          {/* Section Header with Distorted Drawing White Backplate */}
          <div className="relative inline-block">
            <div
              className="absolute -inset-1.5 bg-white border-[3px] border-black shadow-[4px_4px_0px_#000000]"
              style={{ filter: "url(#comic-wobble-1)" }}
            />
            <span className="relative z-10 font-['Bungee',sans-serif] text-base text-black px-3 py-1 uppercase block">
              🤖 02 // PARALLEL MULTI-AGENT SWARM
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {subagents.map((sub, idx) => {
              const bgColors = ["bg-[#00F0FF]", "bg-[#FF5376]", "bg-[#00FF66]"];
              const cardBg = bgColors[idx % 3];

              return (
                <div
                  key={sub.id}
                  className={`p-6 ${cardBg} border-[4px] border-black shadow-[7px_7px_0px_0px_#000000] flex flex-col justify-between space-y-4 transition-transform hover:-translate-y-1`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b-[3px] border-black">
                      <span className="font-['Bungee',sans-serif] text-sm text-black">{sub.name}</span>
                      <span
                        className={`text-[10px] font-['Bungee',sans-serif] uppercase px-2 py-0.5 border-[2px] border-black shadow-[2px_2px_0px_#000] ${
                          sub.status === "completed"
                            ? "bg-[#00FF66] text-black"
                            : sub.status === "running"
                            ? "bg-[#FFE600] text-black animate-pulse"
                            : "bg-white text-black"
                        }`}
                      >
                        {sub.status}
                      </span>
                    </div>

                    <h4 className="font-['Space_Grotesk',sans-serif] font-black text-base text-black">{sub.role}</h4>
                    <p className="text-xs font-bold text-black/80 font-mono">{sub.metric}</p>
                  </div>

                  <div className="p-3.5 bg-white border-[3px] border-black shadow-[4px_4px_0px_#000000] font-mono text-xs font-bold text-black min-h-[85px] leading-relaxed">
                    {sub.telemetry}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* LIVE TERMINAL & SSE EXECUTION STREAM (NEOBRUTALIST RETRO TERMINAL) */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          {/* Section Header with Distorted Drawing White Backplate */}
          <div className="relative inline-block">
            <div
              className="absolute -inset-1.5 bg-white border-[3px] border-black shadow-[4px_4px_0px_#000000]"
              style={{ filter: "url(#comic-wobble-1)" }}
            />
            <span className="relative z-10 font-['Bungee',sans-serif] text-base text-black px-3 py-1 uppercase block">
              🕹️ 03 // LIVE TRUEFORGE SSE STREAM &amp; DAYTONA TERMINAL
            </span>
          </div>

          <div className="p-6 bg-[#000000] text-[#00FF66] border-[4px] border-black shadow-[8px_8px_0px_0px_#000000] font-mono text-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b-[2px] border-[#00FF66]/30 text-[11px] gap-2">
              <span className="font-bold text-[#00F0FF]">
                STREAM: {incidentId ? `/api/incidents/${incidentId}/stream` : "DISCONNECTED"}
              </span>
              <span className="text-[#FFE600]">
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
                        ? "text-[#FF3366] font-black"
                        : log.includes("[✓]") || log.includes("PASS") || log.includes("Resolved")
                        ? "text-[#00FF66] font-black"
                        : log.includes("[+]") || log.includes("[*]")
                        ? "text-[#00F0FF] font-bold"
                        : "text-zinc-200"
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

      {/* Comic Footer */}
      <footer className="mt-16 border-t-[4px] border-black bg-[#FFE600] py-8 px-6 sm:px-12 text-black font-['Space_Grotesk',sans-serif] font-bold text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-['Bungee',sans-serif] text-sm">SENTINELOPS</span> &bull; Autonomous Microservice Resilience Platform
          </div>
          <div className="flex items-center gap-4">
            <Link href="/checkout" className="hover:underline">
              Storefront
            </Link>
            <Link href="/orders" className="hover:underline">
              Orders
            </Link>
            <Link href="/incidents" className="hover:underline">
              Postmortem DB
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
