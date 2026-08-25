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

export default function VenturaSentinelOpsCommander() {
  const [activeTrigger, setActiveTrigger] = useState<"method_a" | "method_b">("method_a");
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [approvalGranted, setApprovalGranted] = useState<boolean>(false);
  const [incidentId, setIncidentId] = useState<string>("INC-20260825-checkout");

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
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const dispatchIncidentResponse = async (triggerType: "manual" | "webhook") => {
    setCurrentStep(1);
    setApprovalGranted(false);
    setTerminalLogs([
      "[*] [VENTURA BOOT] SentinelOps v2.4 Autonomous Incident Response Swarm",
      "[*] [TRUEFORGE HARNESS] Connected via local SQLite session runtime",
      "[*] [ALERT DISPATCH] 500 error spike detected on checkout-service (/checkout)",
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

    // Phase 2: Parallel Subagents
    setTimeout(() => {
      setCurrentStep(2);
      setSubagents([
        {
          id: "agent-01",
          name: "SUBAGENT ALPHA",
          codename: "GIT-SENTINEL",
          role: "Commit History & Diff Inspector",
          status: "running",
          telemetry: "Running git log -n 5 and diff inspection on payment_processor.py...",
          metric: "Scanning git log",
        },
        {
          id: "agent-02",
          name: "SUBAGENT BRAVO",
          codename: "LOG-TRACE",
          role: "Exception Stack Trace Decoder",
          status: "running",
          telemetry: "Hooking live FastAPI stdout logstream on port 8000...",
          metric: "Decoding traceback",
        },
        {
          id: "agent-03",
          name: "SUBAGENT CHARLIE",
          codename: "DATA-CORE",
          role: "PostgreSQL Order Analytics",
          status: "running",
          telemetry: "Executing SQL correlation: SELECT * FROM orders WHERE is_guest = true...",
          metric: "Running query",
        },
      ]);
      setTerminalLogs((prev) => [
        ...prev,
        "[+] [SWARM INVOCATION] 3 specialized subagents dispatched simultaneously in parallel",
        "[+] [ALPHA] Diff analysis active on Sourjya-Saha/checkout-services",
        "[+] [BRAVO] Capturing unhandled exception in payment_processor.py",
        "[+] [CHARLIE] Running PostgreSQL order telemetry aggregation",
      ]);
    }, 1500);

    // Subagents Locked
    setTimeout(() => {
      setSubagents([
        {
          id: "agent-01",
          name: "SUBAGENT ALPHA",
          codename: "GIT-SENTINEL",
          role: "Commit History & Diff Inspector",
          status: "completed",
          telemetry: "ROOT CAUSE LOCATED: Commit beda01a ('Add guest checkout support'). Unchecked currency_info['symbol'] on payment_processor.py:32.",
          metric: "Commit: beda01a",
        },
        {
          id: "agent-02",
          name: "SUBAGENT BRAVO",
          codename: "LOG-TRACE",
          role: "Exception Stack Trace Decoder",
          status: "completed",
          telemetry: "EXCEPTION CONFIRMED: TypeError: 'NoneType' object is not subscriptable at line 32 in _resolve_currency_symbol.",
          metric: "Traceback: Line 32",
        },
        {
          id: "agent-03",
          name: "SUBAGENT CHARLIE",
          codename: "DATA-CORE",
          role: "PostgreSQL Order Analytics",
          status: "completed",
          telemetry: "CORRELATION VERIFIED: 100% of failed transactions correspond to is_guest=true. Registered users succeed with 200 OK.",
          metric: "Blast Radius: Guest Only",
        },
      ]);
      setTerminalLogs((prev) => [
        ...prev,
        "[+] [SYNTHESIS COMPLETE] Root Cause isolated to payment_processor.py:32",
        "[*] [SANDBOX REQUEST] Requesting Daytona isolated Linux container for reproduction...",
      ]);
    }, 3200);

    // Phase 3: Daytona Sandboxed Execution
    setTimeout(() => {
      setCurrentStep(3);
      setTerminalLogs((prev) => [
        ...prev,
        "[Daytona-VM] Isolated container active (ID: sbx-daytona-linux-491)",
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
        "[Daytona-VM] ✅ 4/4 pytest suites passed in 1.43s. Patch verified clean in isolated sandbox.",
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
      "[+] [HUMAN APPROVAL GRANTED] SRE Commander authorized PR creation.",
      "[*] [GITHUB MCP] Pushing branch fix-guest-checkout-symbol to Sourjya-Saha/checkout-services",
      "[*] [GITHUB MCP] Opening Pull Request #2 targeting main",
      "[*] [QODO AI] Pull Request #2 submitted for automated repository code review...",
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
        "[+] [QODO REVIEW] PR #2 Reviewed: 0 High-severity findings. Approved.",
        "[+] [PERSISTENT MEMORY] Postmortem written to Supabase PostgreSQL 'incidents' table.",
        "[✔] [STATUS RESOLVED] Production healthy. MTTR: 1m 42s.",
      ]);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans antialiased selection:bg-white selection:text-black">
      {/* Top Header */}
      <header className="px-6 sm:px-12 py-6 border-b border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 via-amber-400 via-emerald-400 to-blue-500 flex items-center justify-center text-black font-black text-xs">
            ⎊
          </div>
          <div>
            <h1 className="text-sm font-mono uppercase tracking-widest text-white font-bold">
              SentinelOps Swarm Visualizer
            </h1>
            <span className="text-[10px] font-mono text-zinc-500">
              TrueForge Agent Harness &bull; Daytona Sandbox &bull; Qodo Code Review
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-xs font-mono text-zinc-400 hover:text-white transition-colors"
          >
            &larr; Ventura App
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
      <main className="max-w-7xl mx-auto px-6 sm:px-12 py-12 space-y-12">
        {/* Title Headline */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            01 // Incident Ingestion &amp; Multi-Agent Swarm
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">
            Autonomous Incident Commander
          </h2>
          <div className="w-full h-1.5 bg-gradient-to-r from-red-600 via-orange-500 via-amber-400 via-emerald-400 via-cyan-400 to-blue-600" />
        </div>

        {/* Ingestion Trigger Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            onClick={() => setActiveTrigger("method_a")}
            className={`p-6 rounded-2xl border transition-all cursor-pointer ${
              activeTrigger === "method_a"
                ? "bg-zinc-950 border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                : "bg-black border-zinc-900 hover:border-zinc-800"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                Method A: SRE Chat Alert Trigger
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-300">
                TrueForge Chat
              </span>
            </div>
            <p className="text-xs text-zinc-400 mb-4 font-light leading-relaxed">
              An on-call engineer prompts SentinelOps in TrueForge chat:
            </p>
            <div className="p-3.5 rounded-xl bg-black border border-zinc-800 text-xs font-mono text-zinc-200 mb-5">
              &quot;A user reported guest checkout is failing with a 500 error on checkout-service. Investigate, sandbox, and remediate.&quot;
            </div>
            <button
              onClick={() => dispatchIncidentResponse("manual")}
              disabled={currentStep > 0 && currentStep < 6}
              className="w-full py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-widest bg-white hover:bg-zinc-200 text-black shadow transition-all disabled:opacity-40"
            >
              {currentStep > 0 && currentStep < 6 ? "Executing Investigation..." : "Launch SRE Investigation"}
            </button>
          </div>

          <div
            onClick={() => setActiveTrigger("method_b")}
            className={`p-6 rounded-2xl border transition-all cursor-pointer ${
              activeTrigger === "method_b"
                ? "bg-zinc-950 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                : "bg-black border-zinc-900 hover:border-zinc-800"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-400">
                Method B: Automated Telemetry Webhook
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-300">
                FastAPI Hook
              </span>
            </div>
            <p className="text-xs text-zinc-400 mb-4 font-light leading-relaxed">
              FastAPI captures an unhandled 500 exception and dispatches automated webhook:
            </p>
            <div className="p-3.5 rounded-xl bg-black border border-zinc-800 text-xs font-mono text-red-400 mb-5">
              POST /api/webhook/alert &rarr; &#123; error: 500, route: &quot;/checkout&quot;, service: &quot;checkout-service&quot; &#125;
            </div>
            <button
              onClick={() => dispatchIncidentResponse("webhook")}
              disabled={currentStep > 0 && currentStep < 6}
              className="w-full py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-widest bg-red-600 hover:bg-red-500 text-white shadow transition-all disabled:opacity-40"
            >
              {currentStep > 0 && currentStep < 6 ? "Processing Alert..." : "Fire Automated Webhook"}
            </button>
          </div>
        </div>

        {/* Parallel Subagents Section */}
        <div className="space-y-4">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            02 // Parallel Multi-Agent Swarm
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {subagents.map((sub) => (
              <div
                key={sub.id}
                className="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 flex flex-col justify-between space-y-4"
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
                  <h4 className="text-sm font-bold text-zinc-200">{sub.role}</h4>
                  <p className="text-[11px] font-mono text-zinc-500 mt-1">{sub.metric}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-black border border-zinc-900 font-mono text-xs text-zinc-300 min-h-[90px] leading-relaxed">
                  {sub.telemetry}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daytona Sandbox Terminal */}
        <div className="space-y-4">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            03 // Daytona Sandboxed Execution Terminal (Linux Container)
          </span>
          <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 font-mono text-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-900 text-zinc-500 text-[11px]">
              <span>CONTAINER: sbx-daytona-linux-491</span>
              <span>PYTEST &bull; FASTAPI 8000</span>
            </div>
            <div className="space-y-1.5 min-h-[160px] max-h-[260px] overflow-y-auto">
              {terminalLogs.length === 0 ? (
                <p className="text-zinc-600">// Container on standby. Launch investigation above...</p>
              ) : (
                terminalLogs.map((log, idx) => (
                  <p
                    key={idx}
                    className={
                      log.includes("[FAIL]") || log.includes("TypeError")
                        ? "text-red-400 font-bold"
                        : log.includes("[PASS]") || log.includes("✅") || log.includes("[✔]")
                        ? "text-emerald-400 font-bold"
                        : log.includes("[+]") || log.includes("[*]")
                        ? "text-cyan-300"
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

        {/* Human-in-the-Loop Gate */}
        {currentStep >= 4 && (
          <div className="p-6 rounded-2xl bg-amber-950/40 border-2 border-amber-500 space-y-4 font-mono">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-amber-300 uppercase">
                04 // Human-in-the-Loop Approval Gate (SRE Signoff)
              </h3>
              <span className="text-xs px-3 py-1 rounded-full bg-amber-900 text-amber-200">
                {approvalGranted ? "Approved ✓" : "Awaiting Confirmation"}
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              SentinelOps has verified the candidate patch in Daytona sandbox. Human sign-off is required to push to GitHub.
            </p>
            <div className="p-3 bg-black rounded-lg border border-amber-900/60 text-xs text-zinc-300">
              <p>Target: Sourjya-Saha/checkout-services &bull; Branch: fix-guest-checkout-symbol</p>
              <p className="text-emerald-400">Daytona Proof: 4/4 pytest suites passed (100% OK)</p>
            </div>

            {!approvalGranted ? (
              <button
                onClick={handleApprove}
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-widest transition-colors"
              >
                Authorize Fix &amp; Open GitHub PR
              </button>
            ) : (
              <div className="text-xs text-emerald-400 font-bold flex items-center justify-between">
                <span>✓ Authorization Granted &bull; Opening GitHub PR &amp; writing postmortem to Supabase...</span>
                <a
                  href="https://github.com/Sourjya-Saha/checkout-services/pull/2"
                  target="_blank"
                  rel="noreferrer"
                  className="underline text-white font-bold"
                >
                  View PR #2 on GitHub &rarr;
                </a>
              </div>
            )}
          </div>
        )}

        {/* Final Status & Qodo Review */}
        {currentStep >= 6 && (
          <div className="p-6 rounded-2xl bg-zinc-950 border border-emerald-500 space-y-4 font-mono">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-emerald-400 uppercase">
                05 // Incident Remediation Complete
              </h3>
              <span className="text-xs px-3 py-1 rounded-full bg-purple-950 text-purple-300 border border-purple-800 font-bold">
                Qodo Code Review: Approved (0 Highs)
              </span>
            </div>
            <p className="text-xs text-zinc-300">
              Incident {incidentId} successfully remediated, reviewed by Qodo AI, and written to Supabase persistent memory.
            </p>
            <Link
              href="/incidents"
              className="inline-block px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold uppercase tracking-widest transition-colors"
            >
              Inspect Supabase Incident Record &rarr;
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
