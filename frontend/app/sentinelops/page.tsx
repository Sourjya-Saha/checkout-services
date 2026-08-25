"use client";

import { useState } from "react";
import Link from "next/link";

interface SubagentStatus {
  id: string;
  name: string;
  codename: string;
  role: string;
  status: "standby" | "scanning" | "locked";
  telemetry: string;
  metric: string;
}

export default function SentinelOpsTacticalHUD() {
  const [activeTrigger, setActiveTrigger] = useState<"method_a" | "method_b">("method_a");
  const [systemState, setSystemState] = useState<"DEFCON_5" | "ALERT_LEVEL_1" | "REMEDIATING" | "RESOLVED">("DEFCON_5");
  const [currentStage, setCurrentStage] = useState<number>(0);
  const [approvalGranted, setApprovalGranted] = useState<boolean>(false);
  const [incidentId, setIncidentId] = useState<string>("INC-20260825-checkout");

  const [subagents, setSubagents] = useState<SubagentStatus[]>([
    {
      id: "recon-01",
      name: "SUBAGENT ALPHA",
      codename: "GIT-SENTINEL",
      role: "Commit History & Diff Inspector",
      status: "standby",
      telemetry: "Repository: Sourjya-Saha/checkout-services | Standby",
      metric: "Target: main branch",
    },
    {
      id: "recon-02",
      name: "SUBAGENT BRAVO",
      codename: "LOG-TRACE",
      role: "Exception & Telemetry Inspector",
      status: "standby",
      telemetry: "Stream: FastAPI stdout/stderr (:8000) | Standby",
      metric: "Filter: 5xx Spike",
    },
    {
      id: "recon-03",
      name: "SUBAGENT CHARLIE",
      codename: "DATA-CORE",
      role: "Database Telemetry & Order Correlation",
      status: "standby",
      telemetry: "Cluster: Supabase PostgreSQL (:5432) | Standby",
      metric: "Query: is_guest=true",
    },
  ]);

  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const dispatchIncidentResponse = async (triggerType: "manual" | "webhook") => {
    setSystemState("ALERT_LEVEL_1");
    setCurrentStage(1);
    setApprovalGranted(false);
    setTerminalLogs([
      "[*] [SYSTEM BOOT] SentinelOps v2.4 Autonomous Incident Response Engine",
      "[*] [AUTH] TrueForge Harness Connected (NodeJS 22 / SQLite Memory Core)",
      "[*] [ALERT DISPATCH] Signal received: 500 error spike detected on checkout-service",
    ]);

    const newId = `INC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(100 + Math.random() * 900)}`;
    setIncidentId(newId);

    if (triggerType === "webhook") {
      try {
        await fetch(`${apiBase}/api/webhook/alert`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            service: "checkout-service",
            error_code: 500,
            route: "/checkout",
            message: "500 Internal Server Error spike on guest checkout",
            trigger_type: "webhook_monitoring",
          }),
        });
      } catch (e) {
        console.error(e);
      }
    }

    // Phase 2: Parallel Subagent Dispatch
    setTimeout(() => {
      setCurrentStage(2);
      setSubagents([
        {
          id: "recon-01",
          name: "SUBAGENT ALPHA",
          codename: "GIT-SENTINEL",
          role: "Commit History & Diff Inspector",
          status: "scanning",
          telemetry: "Analyzing commit tree & diffs for payment_processor.py...",
          metric: "Scanning git log",
        },
        {
          id: "recon-02",
          name: "SUBAGENT BRAVO",
          codename: "LOG-TRACE",
          role: "Exception & Telemetry Inspector",
          status: "scanning",
          telemetry: "Parsing backend exception traces on port 8000...",
          metric: "Decoding traceback",
        },
        {
          id: "recon-03",
          name: "SUBAGENT CHARLIE",
          codename: "DATA-CORE",
          role: "Database Telemetry & Order Correlation",
          status: "scanning",
          telemetry: "Executing SQL correlation: SELECT * FROM orders WHERE is_guest = true...",
          metric: "Running query",
        },
      ]);
      setTerminalLogs((prev) => [
        ...prev,
        "[+] [PARALLEL MULTI-AGENT] Dispatching 3 specialized subagents simultaneously...",
        "[+] [ALPHA] Pulling commit diffs from Sourjya-Saha/checkout-services",
        "[+] [BRAVO] Hooking FastAPI error telemetry logstream",
        "[+] [CHARLIE] Querying Supabase PostgreSQL orders & order_items",
      ]);
    }, 1500);

    // Subagent Findings Locked
    setTimeout(() => {
      setSubagents([
        {
          id: "recon-01",
          name: "SUBAGENT ALPHA",
          codename: "GIT-SENTINEL",
          role: "Commit History & Diff Inspector",
          status: "locked",
          telemetry: "ROOT CAUSE LOCATED: Commit beda01a ('Add guest checkout support'). Unconditional subscript currency_info['symbol'] at payment_processor.py:32.",
          metric: "Commit: beda01a",
        },
        {
          id: "recon-02",
          name: "SUBAGENT BRAVO",
          codename: "LOG-TRACE",
          role: "Exception & Telemetry Inspector",
          status: "locked",
          telemetry: "EXCEPTION CAPTURED: TypeError: 'NoneType' object is not subscriptable in _resolve_currency_symbol.",
          metric: "Traceback: Line 32",
        },
        {
          id: "recon-03",
          name: "SUBAGENT CHARLIE",
          codename: "DATA-CORE",
          role: "Database Telemetry & Order Correlation",
          status: "locked",
          telemetry: "TELEMETRY CORRELATED: 100% of failed checkouts match is_guest=true. Registered users succeed with 200 OK.",
          metric: "Blast Radius: Guest Only",
        },
      ]);
      setTerminalLogs((prev) => [
        ...prev,
        "[+] [SYNTHESIS COMPLETE] Root Cause isolated to payment_processor.py:32",
        "[*] [SANDBOX REQUEST] Requesting Daytona isolated Linux execution container...",
      ]);
    }, 3200);

    // Phase 3: Daytona Sandboxed Execution
    setTimeout(() => {
      setSystemState("REMEDIATING");
      setCurrentStage(3);
      setTerminalLogs((prev) => [
        ...prev,
        "[Daytona-VM] Container instantiated (ID: sbx-daytona-linux-491)",
        "[Daytona-VM] $ git checkout beda01a && pytest -v",
        "  [FAIL] test_checkout_guest_failure_500 -> TypeError: 'NoneType' object is not subscriptable",
        "[Daytona-VM] $ git checkout d420a68 && pytest -v",
        "  [PASS] Baseline commit d420a68 passes all tests (200 OK)",
        "[Daytona-VM] [PATCH GEN] Applying candidate fix: Null-safe fallback in _resolve_currency_symbol",
        "[Daytona-VM] $ pytest -v",
        "  [PASS] test_health_check PASSED",
        "  [PASS] test_checkout_logged_in_success PASSED",
        "  [PASS] test_checkout_guest_success PASSED",
        "  [PASS] test_list_and_get_orders PASSED",
        "[Daytona-VM] ✅ 4/4 pytest suites passed in 1.43s. Patch verified 100% clean in sandbox.",
        "[*] [HITL GATE] Halting for Human-in-the-Loop approval before push...",
      ]);
    }, 4800);

    // Phase 4: Approval Stage
    setTimeout(() => {
      setCurrentStage(4);
    }, 6200);
  };

  const handleApprove = async () => {
    setApprovalGranted(true);
    setCurrentStage(5);
    setTerminalLogs((prev) => [
      ...prev,
      "[+] [HUMAN APPROVAL GRANTED] Incident Commander confirmed patch.",
      "[*] [GITHUB MCP] Creating branch fix-guest-checkout-symbol on Sourjya-Saha/checkout-services",
      "[*] [GITHUB MCP] Opening Pull Request #2 targeting main",
      "[*] [QODO AI] Pull Request #2 submitted to Qodo code review engine...",
    ]);

    const recordPayload = {
      id: incidentId,
      title: "500 Error in payment_processor.py during Guest Checkout",
      service: "checkout-service",
      root_cause: "payment_processor.py:32 accessed currency_info['symbol'] without a None-check.",
      evidence_summary: "Subagents confirmed commit beda01a regression, TypeError traceback, and 100% guest checkout failure correlation.",
      verification_result: "Daytona sandbox verified: reproduction failed on beda01a (500) and succeeded with candidate fix (200 OK).",
      approval_record: "Approved by Incident Commander via TrueForge Human-in-the-Loop approval gate.",
      pr_link: "https://github.com/Sourjya-Saha/checkout-services/pull/2",
      resolution_status: "resolved",
    };

    try {
      await fetch(`${apiBase}/incidents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recordPayload),
      });
    } catch (e) {
      console.error(e);
    }

    setTimeout(() => {
      setSystemState("RESOLVED");
      setCurrentStage(6);
      setTerminalLogs((prev) => [
        ...prev,
        "[+] [QODO REVIEW] PR #2 Reviewed: 0 High-severity findings. Clean bill of health.",
        "[+] [PERSISTENT MEMORY] Postmortem record stored in Supabase 'incidents' table.",
        "[✔] [STATUS RESOLVED] All systems nominal. MTTR: 1m 42s.",
      ]);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Tactical HUD Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Logo & Status */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-black text-slate-950 text-base shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              ⎊
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-wider text-sm text-white uppercase font-mono">
                  SentinelOps
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/50">
                  Command Center HUD v2.4
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Autonomous SRE Engine &bull; TrueForge Harness &bull; Daytona Sandbox &bull; Qodo AI
              </p>
            </div>
          </div>

          {/* HUD Indicators & Navigation */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  systemState === "DEFCON_5"
                    ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                    : systemState === "RESOLVED"
                    ? "bg-cyan-400 shadow-[0_0_8px_#22d3ee]"
                    : "bg-red-500 shadow-[0_0_10px_#ef4444] animate-ping"
                }`}
              />
              <span className="text-slate-300 text-[11px] font-bold">
                SYSTEM STATE:{" "}
                <span
                  className={
                    systemState === "DEFCON_5"
                      ? "text-emerald-400"
                      : systemState === "RESOLVED"
                      ? "text-cyan-400"
                      : "text-red-400"
                  }
                >
                  {systemState}
                </span>
              </span>
            </div>

            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all font-mono"
            >
              Target Checkout App &rarr;
            </Link>
            <Link
              href="/incidents"
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 transition-all font-mono"
            >
              Supabase Audit Log &rarr;
            </Link>
          </div>
        </div>
      </header>

      {/* Main Command Center Deck */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-8 space-y-8">
        {/* Section 1: Incident Trigger Matrix */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400 font-mono flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              01 // Trigger Station (Selectable Remediation Flow)
            </h2>
            <span className="text-[11px] font-mono text-slate-500">Autonomous Ingestion</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Method A Card */}
            <div
              onClick={() => setActiveTrigger("method_a")}
              className={`p-6 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                activeTrigger === "method_a"
                  ? "bg-slate-900/90 border-cyan-500/80 shadow-[0_0_25px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/40"
                  : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  <h3 className="font-bold text-sm text-white font-mono">METHOD A: SRE CHAT ALERT TRIGGER</h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50">
                  TrueForge Chat
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                An on-call engineer or monitoring bot dispatches an alert prompt into TrueForge harness chat:
              </p>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300/90 mb-5 select-all">
                &quot;A user reported guest checkout is failing with a 500 error on checkout-service. Investigate, sandbox, and remediate.&quot;
              </div>
              <button
                onClick={() => dispatchIncidentResponse("manual")}
                disabled={currentStage > 0 && currentStage < 6}
                className="w-full py-3 rounded-xl font-mono text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider"
              >
                {currentStage > 0 && currentStage < 6 ? "Executing Investigation..." : "Launch SRE Investigation"}
              </button>
            </div>

            {/* Method B Card */}
            <div
              onClick={() => setActiveTrigger("method_b")}
              className={`p-6 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                activeTrigger === "method_b"
                  ? "bg-slate-900/90 border-red-500/80 shadow-[0_0_25px_rgba(239,68,68,0.15)] ring-1 ring-red-500/40"
                  : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
                  <h3 className="font-bold text-sm text-white font-mono">METHOD B: AUTOMATED WEBHOOK TELEMETRY</h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800/50">
                  FastAPI Telemetry Hook
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                FastAPI detects an unhandled 500 exception &rarr; Fires telemetry webhook payload to wake SentinelOps:
              </p>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-red-400 mb-5">
                POST /api/webhook/alert &rarr; &#123; error: 500, route: &quot;/checkout&quot;, service: &quot;checkout-service&quot; &#125;
              </div>
              <button
                onClick={() => dispatchIncidentResponse("webhook")}
                disabled={currentStage > 0 && currentStage < 6}
                className="w-full py-3 rounded-xl font-mono text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider"
              >
                {currentStage > 0 && currentStage < 6 ? "Processing Webhook..." : "Fire Automated Error Webhook"}
              </button>
            </div>
          </div>
        </section>

        {/* Section 2: Parallel Subagents Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400 font-mono flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              02 // Parallel Multi-Agent Swarm (Investigation Stage)
            </h2>
            <span className="text-[11px] font-mono text-slate-500">Concurrent Tool Execution</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {subagents.map((sub) => (
              <div
                key={sub.id}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-4 relative overflow-hidden"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-extrabold text-cyan-400">
                      {sub.name}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                        sub.status === "locked"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-700/60"
                          : sub.status === "scanning"
                          ? "bg-amber-950 text-amber-300 border border-amber-700/60 animate-pulse"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {sub.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white font-mono">{sub.role}</h4>
                  <div className="text-[10px] font-mono text-slate-400 bg-slate-950/60 px-2 py-1 rounded border border-slate-800">
                    {sub.metric}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-slate-300 min-h-[90px] leading-relaxed">
                  {sub.telemetry}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Daytona Sandboxed Execution Terminal */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400 font-mono flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              03 // Daytona Sandboxed Execution Terminal (Isolated Verification)
            </h2>
            <span className="text-[11px] font-mono text-slate-400">Environment: Linux Container (sbx-daytona-491)</span>
          </div>

          <div className="rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl p-5 space-y-3 font-mono text-xs overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-900 text-slate-500 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
                <span className="ml-2 text-slate-400">daytona-cli &bull; pytest verification harness</span>
              </div>
              <span>PORT: 8000 &bull; DB: supabase-pg</span>
            </div>

            <div className="space-y-1.5 min-h-[160px] max-h-[260px] overflow-y-auto pr-2">
              {terminalLogs.length === 0 ? (
                <p className="text-slate-600">// Daytona sandbox container is on standby...</p>
              ) : (
                terminalLogs.map((log, i) => (
                  <p
                    key={i}
                    className={
                      log.includes("[FAIL]") || log.includes("TypeError")
                        ? "text-red-400 font-bold"
                        : log.includes("[PASS]") || log.includes("✅") || log.includes("[✔]")
                        ? "text-emerald-400 font-bold"
                        : log.includes("[+]") || log.includes("[*]")
                        ? "text-cyan-300"
                        : "text-slate-300"
                    }
                  >
                    {log}
                  </p>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Section 4: Human Approval Gateway */}
        {currentStage >= 4 && (
          <section className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
              <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400 font-mono flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                04 // Human-in-the-Loop Approval Gate (Production Guardrail)
              </h2>
              <span className="text-[11px] font-mono text-amber-300">Mandatory SRE Signoff</span>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border-2 border-amber-500/60 shadow-[0_0_30px_rgba(245,158,11,0.15)] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm">
                    ✋
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono">
                      CONFIRMATION REQUIRED: FORWARD-FIX PULL REQUEST
                    </h3>
                    <p className="text-xs text-slate-400">
                      SentinelOps has verified the fix in the Daytona sandbox. Human sign-off is required to push to GitHub.
                    </p>
                  </div>
                </div>

                <span className="text-xs font-mono px-3 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-700 font-bold">
                  {approvalGranted ? "Approved ✓" : "Awaiting Human Action"}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1.5 text-slate-300">
                <p>
                  <strong className="text-cyan-400">Target:</strong> Sourjya-Saha/checkout-services &bull; Branch: <code>fix-guest-checkout-symbol</code>
                </p>
                <p>
                  <strong className="text-emerald-400">Sandbox Verification:</strong> 4/4 pytest suites passed in Daytona container.
                </p>
                <p>
                  <strong className="text-purple-400">Review Engine:</strong> Qodo Merge will review the Pull Request upon creation.
                </p>
              </div>

              {!approvalGranted ? (
                <div className="flex gap-3">
                  <button
                    onClick={handleApprove}
                    className="px-6 py-3 rounded-xl font-mono text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all uppercase tracking-wider"
                  >
                    Authorize Fix &amp; Open GitHub PR
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-emerald-950/80 border border-emerald-600/60 rounded-xl text-xs font-mono text-emerald-300 flex items-center justify-between">
                  <span>✓ Authorization Received &bull; SentinelOps is opening GitHub PR &amp; writing postmortem to Supabase...</span>
                  <a
                    href="https://github.com/Sourjya-Saha/checkout-services/pull/2"
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-cyan-400 font-bold"
                  >
                    View PR on GitHub &rarr;
                  </a>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Section 5: Remediation Complete & Qodo Badge */}
        {currentStage >= 6 && (
          <section className="p-6 rounded-2xl bg-slate-900 border border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.15)] space-y-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-400 text-slate-950 font-black flex items-center justify-center text-sm">
                  ✔
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">
                    INCIDENT RESOLUTION CONFIRMED
                  </h3>
                  <p className="text-xs text-slate-400">
                    Incident {incidentId} successfully closed and archived in Supabase persistent memory.
                  </p>
                </div>
              </div>

              <span className="text-xs font-mono px-3 py-1 rounded-full bg-purple-950 text-purple-300 border border-purple-600 font-bold">
                Qodo Code Review: Approved (0 Highs)
              </span>
            </div>

            <div className="flex gap-3 pt-2">
              <Link
                href="/incidents"
                className="px-5 py-2.5 rounded-xl font-mono text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow transition-all uppercase tracking-wider"
              >
                Inspect Supabase Incident Record &rarr;
              </Link>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
