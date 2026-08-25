"use client";

import { useState } from "react";
import Link from "next/link";

interface SubagentStatus {
  id: string;
  name: string;
  codename: string;
  role: string;
  status: "idle" | "running" | "completed";
  telemetry: string;
  metric: string;
}

export default function VanguardSentinelOpsCommander() {
  const [activeTrigger, setActiveTrigger] = useState<"method_a" | "method_b">("method_a");
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [approvalGranted, setApprovalGranted] = useState<boolean>(false);
  const [incidentId, setIncidentId] = useState<string>("INC-20260825-checkout");

  const [subagents, setSubagents] = useState<SubagentStatus[]>([
    {
      id: "agent-01",
      name: "Subagent Alpha",
      codename: "Git Bi-Sector",
      role: "Commit History & Diff Analysis",
      status: "idle",
      telemetry: "Repository: Sourjya-Saha/checkout-services",
      metric: "Branch: main",
    },
    {
      id: "agent-02",
      name: "Subagent Bravo",
      codename: "Log Extractor",
      role: "Exception Stack Trace Decoder",
      status: "idle",
      telemetry: "FastAPI Runtime Logs (:8000)",
      metric: "Filter: 500 Spike",
    },
    {
      id: "agent-03",
      name: "Subagent Charlie",
      codename: "Data Correlator",
      role: "PostgreSQL Order Analytics",
      status: "idle",
      telemetry: "Supabase Database Cluster",
      metric: "Query: is_guest=true",
    },
  ]);

  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const dispatchIncidentResponse = async (triggerType: "manual" | "webhook") => {
    setCurrentStep(1);
    setApprovalGranted(false);
    setTerminalLogs([
      "[*] [SYSTEM BOOT] SentinelOps v2.4 Autonomous Incident Commander",
      "[*] [HARNESS] TrueForge Multi-Agent Runtime Initialized",
      "[*] [INGESTION] Incident signal received: 500 error spike on checkout-service",
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
      setCurrentStep(2);
      setSubagents([
        {
          id: "agent-01",
          name: "Subagent Alpha",
          codename: "Git Bi-Sector",
          role: "Commit History & Diff Analysis",
          status: "running",
          telemetry: "Inspecting commit history and diffs on payment_processor.py...",
          metric: "Scanning git log",
        },
        {
          id: "agent-02",
          name: "Subagent Bravo",
          codename: "Log Extractor",
          role: "Exception Stack Trace Decoder",
          status: "running",
          telemetry: "Decoding FastAPI exception traces on port 8000...",
          metric: "Decoding traceback",
        },
        {
          id: "agent-03",
          name: "Subagent Charlie",
          codename: "Data Correlator",
          role: "PostgreSQL Order Analytics",
          status: "running",
          telemetry: "Correlating failed transactions in Supabase orders table...",
          metric: "Running query",
        },
      ]);
      setTerminalLogs((prev) => [
        ...prev,
        "[+] [SWARM DISPATCH] Launching 3 parallel subagents concurrently...",
        "[+] [ALPHA] Pulling commit diffs from Sourjya-Saha/checkout-services",
        "[+] [BRAVO] Hooking FastAPI error telemetry logstream",
        "[+] [CHARLIE] Querying Supabase PostgreSQL orders & order_items",
      ]);
    }, 1500);

    // Subagent Findings Locked
    setTimeout(() => {
      setSubagents([
        {
          id: "agent-01",
          name: "Subagent Alpha",
          codename: "Git Bi-Sector",
          role: "Commit History & Diff Analysis",
          status: "completed",
          telemetry: "ROOT CAUSE FOUND: Commit beda01a ('Add guest checkout support'). Unchecked subscript currency_info['symbol'] on payment_processor.py:32.",
          metric: "Commit: beda01a",
        },
        {
          id: "agent-02",
          name: "Subagent Bravo",
          codename: "Log Extractor",
          role: "Exception Stack Trace Decoder",
          status: "completed",
          telemetry: "EXCEPTION CONFIRMED: TypeError: 'NoneType' object is not subscriptable at line 32 in _resolve_currency_symbol.",
          metric: "Traceback: Line 32",
        },
        {
          id: "agent-03",
          name: "Subagent Charlie",
          codename: "Data Correlator",
          role: "PostgreSQL Order Analytics",
          status: "completed",
          telemetry: "CORRELATION VERIFIED: 100% of failed checkouts match is_guest=true. Registered users succeed with 200 OK.",
          metric: "Blast Radius: Guest Only",
        },
      ]);
      setTerminalLogs((prev) => [
        ...prev,
        "[+] [SYNTHESIS COMPLETE] Root Cause isolated to payment_processor.py:32",
        "[*] [SANDBOX PROVISION] Requesting Daytona isolated Linux execution container...",
      ]);
    }, 3200);

    // Phase 3: Daytona Sandboxed Execution
    setTimeout(() => {
      setCurrentStep(3);
      setTerminalLogs((prev) => [
        ...prev,
        "[Daytona-VM] Container active (ID: sbx-daytona-linux-491)",
        "[Daytona-VM] $ git checkout beda01a && pytest -v",
        "  [FAIL] test_checkout_guest_failure_500 -> TypeError: 'NoneType' object is not subscriptable",
        "[Daytona-VM] $ git checkout d420a68 && pytest -v",
        "  [PASS] Baseline commit d420a68 passes all tests (200 OK)",
        "[Daytona-VM] [PATCH APPLY] Adding null-safe fallback in _resolve_currency_symbol",
        "[Daytona-VM] $ pytest -v",
        "  [PASS] test_health_check PASSED",
        "  [PASS] test_checkout_logged_in_success PASSED",
        "  [PASS] test_checkout_guest_success PASSED",
        "  [PASS] test_list_and_get_orders PASSED",
        "[Daytona-VM] ✅ 4/4 pytest suites passed in 1.43s. Patch verified clean in isolated container.",
        "[*] [HITL GATE] Pausing for Human-in-the-Loop approval before PR push...",
      ]);
    }, 4800);

    // Phase 4: Approval Stage
    setTimeout(() => {
      setCurrentStep(4);
    }, 6200);
  };

  const handleApprove = async () => {
    setApprovalGranted(true);
    setCurrentStep(5);
    setTerminalLogs((prev) => [
      ...prev,
      "[+] [HUMAN APPROVAL GRANTED] Incident Commander confirmed fix.",
      "[*] [GITHUB MCP] Pushing branch fix-guest-checkout-symbol to Sourjya-Saha/checkout-services",
      "[*] [GITHUB MCP] Opening Pull Request #2 targeting main",
      "[*] [QODO AI] Pull Request #2 submitted for automated code review...",
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
      setCurrentStep(6);
      setTerminalLogs((prev) => [
        ...prev,
        "[+] [QODO REVIEW] PR #2 Reviewed: 0 High-severity findings. Clean bill of health.",
        "[+] [PERSISTENT MEMORY] Postmortem record saved to Supabase 'incidents' table.",
        "[✔] [STATUS RESOLVED] Incident resolved. MTTR: 1m 42s.",
      ]);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 selection:bg-violet-500 selection:text-white relative overflow-hidden font-sans">
      {/* Ambient Background Glow Mesh */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[500px] bg-gradient-to-b from-indigo-600/10 via-violet-600/5 to-transparent blur-[140px] pointer-events-none -z-10" />

      {/* Floating Fluid Island Navigation */}
      <header className="pt-6 px-4 sm:px-6 sticky top-0 z-50">
        <nav className="max-w-6xl mx-auto rounded-full bg-zinc-900/70 border border-white/10 backdrop-blur-2xl px-5 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-[0_0_15px_rgba(139,92,246,0.5)]">
              ⎊
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm tracking-tight text-white">SentinelOps</span>
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  Autonomous SRE
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
              href="/incidents"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 border border-white/5 transition-colors"
            >
              Supabase Incident Audit &rarr;
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Command Center Deck */}
      <main className="max-w-6xl mx-auto py-12 px-4 sm:px-6 space-y-10">
        {/* Hero Title Block */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 text-[10px] uppercase tracking-[0.25em] text-zinc-400 font-medium">
            <span>TrueForge Harness</span>
            <span>&bull;</span>
            <span className="text-violet-400">Multi-Agent Swarm</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            SentinelOps Incident Commander
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Autonomous multi-agent investigation, Daytona sandboxed reproduction, human-in-the-loop guardrails, and automated Qodo reviews.
          </p>
        </div>

        {/* Section 1: Trigger Station (Double-Bezel) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h2 className="text-xs uppercase tracking-[0.2em] font-semibold text-zinc-400">
              01 // Incident Ingestion Channels
            </h2>
            <span className="text-xs text-zinc-500 font-mono">Selectable Trigger Mode</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Method A: Human / Chat Trigger */}
            <div className="p-2 rounded-[2rem] bg-white/[0.02] border border-white/10 shadow-2xl">
              <div
                onClick={() => setActiveTrigger("method_a")}
                className={`p-6 rounded-[calc(2rem-0.5rem)] transition-all cursor-pointer ${
                  activeTrigger === "method_a"
                    ? "bg-violet-950/30 border border-violet-500/50 shadow-[0_0_25px_rgba(139,92,246,0.15)] ring-1 ring-violet-500/30"
                    : "bg-zinc-950/80 border border-white/5 hover:border-white/10"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-violet-300 uppercase tracking-wider">
                    Method A: SRE Chat Alert Trigger
                  </span>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300">
                    TrueForge Chat
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                  An on-call engineer prompts SentinelOps directly in the TrueForge agent harness workspace:
                </p>
                <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-white/5 text-xs font-mono text-violet-200 mb-5">
                  &quot;A user reported guest checkout is failing with a 500 error on checkout-service. Investigate, sandbox, and remediate.&quot;
                </div>
                <button
                  onClick={() => dispatchIncidentResponse("manual")}
                  disabled={currentStep > 0 && currentStep < 6}
                  className="w-full py-3 rounded-full font-medium text-xs bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all disabled:opacity-40 uppercase tracking-wider"
                >
                  {currentStep > 0 && currentStep < 6 ? "Executing Runbook..." : "Launch SRE Swarm"}
                </button>
              </div>
            </div>

            {/* Method B: Automated Webhook */}
            <div className="p-2 rounded-[2rem] bg-white/[0.02] border border-white/10 shadow-2xl">
              <div
                onClick={() => setActiveTrigger("method_b")}
                className={`p-6 rounded-[calc(2rem-0.5rem)] transition-all cursor-pointer ${
                  activeTrigger === "method_b"
                    ? "bg-rose-950/30 border border-rose-500/50 shadow-[0_0_25px_rgba(244,63,94,0.15)] ring-1 ring-rose-500/30"
                    : "bg-zinc-950/80 border border-white/5 hover:border-white/10"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-rose-300 uppercase tracking-wider">
                    Method B: Automated Telemetry Webhook
                  </span>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
                    FastAPI Webhook
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                  FastAPI captures an unhandled 500 exception and fires an automated telemetry alert payload:
                </p>
                <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-white/5 text-xs font-mono text-rose-300 mb-5">
                  POST /api/webhook/alert &rarr; &#123; error: 500, route: &quot;/checkout&quot;, service: &quot;checkout-service&quot; &#125;
                </div>
                <button
                  onClick={() => dispatchIncidentResponse("webhook")}
                  disabled={currentStep > 0 && currentStep < 6}
                  className="w-full py-3 rounded-full font-medium text-xs bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-all disabled:opacity-40 uppercase tracking-wider"
                >
                  {currentStep > 0 && currentStep < 6 ? "Processing Alert..." : "Fire Automated Webhook"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Parallel Subagent Swarm */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h2 className="text-xs uppercase tracking-[0.2em] font-semibold text-zinc-400">
              02 // Parallel Multi-Agent Investigation
            </h2>
            <span className="text-xs text-zinc-500 font-mono">Concurrent Subagent Delegation</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {subagents.map((sub) => (
              <div key={sub.id} className="p-2 rounded-[2rem] bg-white/[0.02] border border-white/10 shadow-xl">
                <div className="p-5 rounded-[calc(2rem-0.5rem)] bg-zinc-950/90 space-y-3 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-violet-400 font-mono">{sub.name}</span>
                      <span
                        className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full uppercase ${
                          sub.status === "completed"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : sub.status === "running"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse"
                            : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {sub.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-white">{sub.role}</h4>
                    <p className="text-[11px] font-mono text-zinc-500 mt-1">{sub.metric}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-white/5 font-mono text-xs text-zinc-300 min-h-[90px] leading-relaxed">
                    {sub.telemetry}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Daytona Sandboxed Execution Terminal */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h2 className="text-xs uppercase tracking-[0.2em] font-semibold text-zinc-400">
              03 // Daytona Sandboxed Execution Terminal
            </h2>
            <span className="text-xs text-zinc-500 font-mono">Isolated Container Environment</span>
          </div>

          <div className="p-2 rounded-[2rem] bg-white/[0.02] border border-white/10 shadow-2xl">
            <div className="p-6 rounded-[calc(2rem-0.5rem)] bg-zinc-950/95 font-mono text-xs space-y-3 overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-white/5 text-zinc-500 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                  <span className="ml-2 text-zinc-400">daytona-runner &bull; pytest test suite</span>
                </div>
                <span>FastAPI :8000 &bull; Supabase PostgreSQL</span>
              </div>

              <div className="space-y-1.5 min-h-[160px] max-h-[260px] overflow-y-auto pr-2">
                {terminalLogs.length === 0 ? (
                  <p className="text-zinc-600">// Waiting for SentinelOps to initiate sandbox container...</p>
                ) : (
                  terminalLogs.map((log, idx) => (
                    <p
                      key={idx}
                      className={
                        log.includes("[FAIL]") || log.includes("TypeError")
                          ? "text-rose-400 font-semibold"
                          : log.includes("[PASS]") || log.includes("✅") || log.includes("[✔]")
                          ? "text-emerald-400 font-semibold"
                          : log.includes("[+]") || log.includes("[*]")
                          ? "text-violet-300"
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
        </section>

        {/* Section 4: Human Approval Gateway */}
        {currentStep >= 4 && (
          <section className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h2 className="text-xs uppercase tracking-[0.2em] font-semibold text-amber-400">
                04 // Human-in-the-Loop Approval Gate
              </h2>
              <span className="text-xs text-amber-400 font-mono">Mandatory SRE Signoff</span>
            </div>

            <div className="p-2 rounded-[2rem] bg-amber-500/10 border border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
              <div className="p-6 rounded-[calc(2rem-0.5rem)] bg-zinc-950/95 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-zinc-950 font-bold flex items-center justify-center text-sm">
                      ✋
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        Production Safeguard: Forward-Fix Pull Request
                      </h3>
                      <p className="text-xs text-zinc-400">
                        SentinelOps has verified the candidate patch in the Daytona sandbox. Human sign-off is required to push to GitHub.
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-mono px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {approvalGranted ? "Approved ✓" : "Pending Approval"}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 text-xs font-mono space-y-1 text-zinc-300">
                  <p>Target: Sourjya-Saha/checkout-services &bull; Branch: fix-guest-checkout-symbol</p>
                  <p className="text-emerald-400">Daytona Proof: 4/4 pytest suites passed (100% OK)</p>
                  <p className="text-purple-400">Review Pipeline: Automated review by Qodo AI</p>
                </div>

                {!approvalGranted ? (
                  <button
                    onClick={handleApprove}
                    className="px-6 py-3 rounded-full font-medium text-xs bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all uppercase tracking-wider"
                  >
                    Authorize Patch &amp; Open GitHub PR
                  </button>
                ) : (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs font-mono text-emerald-300 flex items-center justify-between">
                    <span>✓ Authorization Granted &bull; Opening GitHub PR &amp; writing postmortem to Supabase...</span>
                    <a
                      href="https://github.com/Sourjya-Saha/checkout-services/pull/2"
                      target="_blank"
                      rel="noreferrer"
                      className="underline text-violet-300 font-semibold"
                    >
                      View PR on GitHub &rarr;
                    </a>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Section 5: Remediation Complete & Qodo Review */}
        {currentStep >= 6 && (
          <section className="p-2 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/30 shadow-2xl animate-fadeIn">
            <div className="p-6 rounded-[calc(2rem-0.5rem)] bg-zinc-950/95 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-zinc-950 font-bold flex items-center justify-center text-sm">
                    ✔
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      Incident Successfully Remediated
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Incident {incidentId} has been resolved and archived into Supabase persistent memory.
                    </p>
                  </div>
                </div>

                <span className="text-xs font-mono px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
                  Qodo AI Code Review: Approved (0 Highs)
                </span>
              </div>

              <div className="flex gap-4 pt-2">
                <Link
                  href="/incidents"
                  className="px-5 py-2.5 rounded-full text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-200 transition-all shadow-md uppercase tracking-wider"
                >
                  Inspect Supabase Postmortem Audit Log &rarr;
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
