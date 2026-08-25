"use client";

import { useState } from "react";
import Link from "next/link";

interface SubagentStatus {
  name: string;
  role: string;
  status: "idle" | "running" | "completed";
  output: string;
}

export default function SentinelOpsVisualizer() {
  const [activeTrigger, setActiveTrigger] = useState<"method_a" | "method_b">("method_a");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [approvalGranted, setApprovalGranted] = useState<boolean>(false);
  const [incidentId, setIncidentId] = useState<string>("INC-20260825-checkout");

  const [subagents, setSubagents] = useState<SubagentStatus[]>([
    {
      name: "Subagent A",
      role: "Git History & Diff Investigator",
      status: "idle",
      output: "Waiting to inspect commit diffs...",
    },
    {
      name: "Subagent B",
      role: "Log & Error Telemetry Investigator",
      status: "idle",
      output: "Waiting to parse error logs...",
    },
    {
      name: "Subagent C",
      role: "Database & Telemetry Investigator",
      status: "idle",
      output: "Waiting to query Supabase orders...",
    },
  ]);

  const [sandboxLogs, setSandboxLogs] = useState<string[]>([]);
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const runSimulation = async (triggerType: "manual" | "webhook") => {
    setIsRunning(true);
    setCurrentStep(1);
    setApprovalGranted(false);
    setSandboxLogs(["[Daytona] Provisioning isolated Linux sandbox environment..."]);

    const newId = `INC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(100 + Math.random() * 900)}`;
    setIncidentId(newId);

    // Step 1: Trigger
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

    // Step 2: Parallel Subagents
    setTimeout(() => {
      setCurrentStep(2);
      setSubagents([
        {
          name: "Subagent A",
          role: "Git History & Diff Investigator",
          status: "running",
          output: "Running git log -n 5 on Sourjya-Saha/checkout-services...",
        },
        {
          name: "Subagent B",
          role: "Log & Error Telemetry Investigator",
          status: "running",
          output: "Parsing FastAPI stack trace on port 8000...",
        },
        {
          name: "Subagent C",
          role: "Database & Telemetry Investigator",
          status: "running",
          output: "Executing Supabase query: SELECT * FROM orders WHERE is_guest = true...",
        },
      ]);
    }, 1200);

    setTimeout(() => {
      setSubagents([
        {
          name: "Subagent A",
          role: "Git History & Diff Investigator",
          status: "completed",
          output: "Identified regression commit beda01a ('Add guest checkout support'). Found unhandled currency_info['symbol'] on payment_processor.py:32.",
        },
        {
          name: "Subagent B",
          role: "Log & Error Telemetry Investigator",
          status: "completed",
          output: "Confirmed exception: TypeError: 'NoneType' object is not subscriptable at line 32 in _resolve_currency_symbol.",
        },
        {
          name: "Subagent C",
          role: "Database & Telemetry Investigator",
          status: "completed",
          output: "Correlation verified: 100% of failed transactions correspond to is_guest=true. Registered users succeed with 200 OK.",
        },
      ]);
    }, 2800);

    // Step 3: Daytona Sandbox Reproduction
    setTimeout(() => {
      setCurrentStep(3);
      setSandboxLogs((prev) => [
        ...prev,
        "[Daytona] Sandbox connected (ID: sbx_daytona_linux_491)",
        "[Daytona] Running: git checkout beda01a && pytest -v",
        "  FAIL: test_checkout_guest_failure_500 (TypeError: 'NoneType' object is not subscriptable)",
        "[Daytona] Running: git checkout d420a68 && pytest -v",
        "  PASS: Baseline commit d420a68 passes all tests (200 OK)",
        "[Daytona] Applying Candidate Patch: Added None-check fallback in _resolve_currency_symbol",
        "[Daytona] Running verification: pytest -v",
        "  PASS: test_health_check PASSED",
        "  PASS: test_checkout_logged_in_success PASSED",
        "  PASS: test_checkout_guest_success PASSED",
        "  PASS: test_list_and_get_orders PASSED",
        "[Daytona] ✅ 4 passed in 1.43s. Patch verified successfully in isolated container.",
      ]);
    }, 4200);

    // Step 4: Human Approval
    setTimeout(() => {
      setCurrentStep(4);
    }, 5800);
  };

  const handleApprove = async () => {
    setApprovalGranted(true);
    setCurrentStep(5);

    // Step 5: Write to Supabase & Open PR
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
      setIsRunning(false);
    }, 1500);
  };

  return (
    <main className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              SentinelOps Agent Visualizer
            </h1>
            <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-800 ring-1 ring-inset ring-indigo-600/20">
              TrueForge Agent Harness
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Visual inspection station for Multi-Agent Investigation, Daytona Sandboxing, Human Approvals, and Qodo Reviews
          </p>
        </div>

        {/* Links */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl shadow-sm hover:bg-slate-50 transition-all"
          >
            &larr; Target Checkout App
          </Link>
          <Link
            href="/incidents"
            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-all"
          >
            Supabase Incident Audit &rarr;
          </Link>
        </div>
      </div>

      {/* Trigger Control Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8 space-y-6">
        <h2 className="text-lg font-bold text-slate-900">1. Incident Detection & Triggering Center</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Method A: Human / Alert Trigger */}
          <div
            onClick={() => setActiveTrigger("method_a")}
            className={`p-5 rounded-2xl border cursor-pointer transition-all ${
              activeTrigger === "method_a"
                ? "border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-600/20"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                Method A: SRE Alert / Chat Trigger
              </span>
              <span className="text-[11px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-mono">
                TrueForge Chat
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              An engineer or alert bot triggers SentinelOps directly in TrueForge chat with the prompt:
            </p>
            <div className="p-3 rounded-lg bg-slate-900 text-slate-200 font-mono text-xs mb-4">
              &quot;A user reported that guest checkout is failing with a 500 error on checkout-service. Investigate, reproduce in sandbox, and fix.&quot;
            </div>
            <button
              onClick={() => runSimulation("manual")}
              disabled={isRunning}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-all disabled:opacity-50"
            >
              {isRunning && currentStep < 6 ? "Running Runbook..." : "Dispatch SRE Investigation"}
            </button>
          </div>

          {/* Method B: Automated Monitoring Webhook */}
          <div
            onClick={() => setActiveTrigger("method_b")}
            className={`p-5 rounded-2xl border cursor-pointer transition-all ${
              activeTrigger === "method_b"
                ? "border-red-600 bg-red-50/50 shadow-md ring-2 ring-red-600/20"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-red-700">
                Method B: Automated Telemetry Webhook
              </span>
              <span className="text-[11px] bg-red-100 text-red-800 px-2 py-0.5 rounded font-mono">
                Webhook / Datadog
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              FastAPI returns HTTP 500 errors &rarr; Monitoring webhook automatically fires an alert payload:
            </p>
            <div className="p-3 rounded-lg bg-slate-900 text-red-400 font-mono text-xs mb-4">
              POST /api/webhook/alert &rarr; &#123; error: 500, route: &quot;/checkout&quot;, service: &quot;checkout-service&quot; &#125;
            </div>
            <button
              onClick={() => runSimulation("webhook")}
              disabled={isRunning}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow transition-all disabled:opacity-50"
            >
              {isRunning && currentStep < 6 ? "Processing Alert..." : "Fire Automated Webhook Alert"}
            </button>
          </div>
        </div>
      </div>

      {/* Multi-Agent Investigation Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {subagents.map((sub, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-mono text-slate-900">{sub.name}</span>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    sub.status === "completed"
                      ? "bg-emerald-100 text-emerald-800"
                      : sub.status === "running"
                      ? "bg-amber-100 text-amber-800 animate-pulse"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {sub.status}
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-700">{sub.role}</h3>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 font-mono text-[11px] text-slate-800 min-h-[70px]">
              {sub.output}
            </div>
          </div>
        ))}
      </div>

      {/* Daytona Sandbox Execution Terminal */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl p-6 mb-8 text-white space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-mono text-slate-400 ml-2">
              Daytona Sandboxed Execution Terminal (Linux Container)
            </span>
          </div>
          <span className="text-xs font-mono bg-indigo-900/60 text-indigo-300 px-2 py-0.5 rounded border border-indigo-700">
            TrueForge Sandbox Provider: Daytona
          </span>
        </div>

        <div className="font-mono text-xs space-y-1.5 min-h-[140px] text-emerald-400 overflow-x-auto">
          {sandboxLogs.length === 0 ? (
            <p className="text-slate-600">// Waiting for SentinelOps to request a sandbox container...</p>
          ) : (
            sandboxLogs.map((log, idx) => (
              <p
                key={idx}
                className={
                  log.includes("FAIL")
                    ? "text-red-400 font-bold"
                    : log.includes("PASS") || log.includes("✅")
                    ? "text-emerald-400 font-bold"
                    : log.includes("[Daytona]")
                    ? "text-blue-400"
                    : "text-slate-300"
                }
              >
                {log}
              </p>
            ))
          )}
        </div>
      </div>

      {/* Human-in-the-Loop Approval Gate */}
      {currentStep >= 4 && (
        <div className="bg-white rounded-2xl border-2 border-indigo-500 shadow-xl p-6 mb-8 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                ✋
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  TrueForge Human-in-the-Loop Approval Gateway
                </h3>
                <p className="text-xs text-slate-500">
                  SentinelOps requires explicit human confirmation before pushing fixes to production
                </p>
              </div>
            </div>
            <span className="text-xs font-mono bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full font-bold">
              {approvalGranted ? "Approved ✓" : "Awaiting Approval"}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2 text-slate-700">
            <p>
              <strong>Proposed Action:</strong> Push branch <code>fix-guest-checkout-symbol</code> to <code>Sourjya-Saha/checkout-services</code> and create Pull Request targeting <code>main</code>.
            </p>
            <p>
              <strong>Sandbox Proof:</strong> Tested in Daytona container with 100% pytest pass rate.
            </p>
          </div>

          {!approvalGranted ? (
            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-all"
              >
                Approve &amp; Open Pull Request
              </button>
              <button
                onClick={() => setIsRunning(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                Decline
              </button>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold flex items-center justify-between">
              <span>✓ Approval Granted: SentinelOps is opening GitHub PR and writing postmortem to Supabase...</span>
              <a
                href="https://github.com/Sourjya-Saha/checkout-services/pull/2"
                target="_blank"
                rel="noreferrer"
                className="underline text-indigo-700 font-mono text-[11px]"
              >
                View PR #2 on GitHub &rarr;
              </a>
            </div>
          )}
        </div>
      )}

      {/* Resolution & Qodo Review Badge */}
      {currentStep >= 6 && (
        <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-6 shadow-md text-emerald-950 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                ✓
              </div>
              <h3 className="font-bold text-lg text-emerald-900">Incident Remediation Complete</h3>
            </div>
            <span className="text-xs font-mono bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-bold border border-purple-300">
              Qodo Code Review: Approved (0 Highs)
            </span>
          </div>

          <p className="text-xs text-emerald-800">
            The incident was successfully investigated, sandboxed in Daytona, approved by human commander, reviewed by Qodo AI, and logged into Supabase persistent memory under <strong>{incidentId}</strong>.
          </p>

          <div className="flex gap-4">
            <Link
              href="/incidents"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition-all"
            >
              Open Incident Command Center Audit Log &rarr;
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
