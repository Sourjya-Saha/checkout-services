"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
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

interface ChatMessage {
  id: string;
  sender: "user" | "agent" | "system";
  text: string;
  timestamp: string;
  patchPreview?: string;
  prLink?: string;
  isApprovalPrompt?: boolean;
}

export default function VenturaSentinelOpsCommander() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-init",
      sender: "agent",
      text: "👋 **SentinelOps Autonomous Incident Commander Active.**\n\nI am connected via the TrueForge Agent Harness. You can type any incident report, regression report, or command below to trigger an autonomous investigation.",
      timestamp: "Just now",
    },
  ]);

  const [inputText, setInputText] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [currentStage, setCurrentStage] = useState<string>("idle");
  const [incidentId, setIncidentId] = useState<string>("INC-20260826-checkout");

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
      metric: "Query: Error Correlation",
    },
  ]);

  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[*] [VENTURA BOOT] SentinelOps v2.4 Autonomous Incident Response Swarm",
    "[*] [TRUEFORGE HARNESS] Connected via local session runtime",
    "[*] [STANDBY] Ready for SRE engineer chat dispatch...",
  ]);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || inputText).trim();
    if (!messageContent || isTyping) return;

    const userMsgId = `user-${Date.now()}`;
    const userTimestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Add user message
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        sender: "user",
        text: messageContent,
        timestamp: userTimestamp,
      },
    ]);

    setInputText("");
    setIsTyping(true);

    // Update Subagents to running state
    setSubagents((prev) =>
      prev.map((s) => ({
        ...s,
        status: "running",
        telemetry: `Executing subagent analysis on query: "${messageContent.slice(0, 30)}..."`,
      }))
    );

    try {
      const res = await fetch(`${apiBase}/api/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageContent,
          incident_id: incidentId,
          step: 1,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentStage(data.stage);
        setIncidentId(data.incident_id);

        if (data.subagents) {
          setSubagents(data.subagents);
        }

        if (data.logs) {
          setTerminalLogs((prev) => [...prev, ...data.logs]);
        }

        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: `agent-${Date.now()}`,
              sender: "agent",
              text: data.reply,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              patchPreview: data.patch_preview,
              prLink: data.pr_link,
              isApprovalPrompt: data.stage === "awaiting_approval",
            },
          ]);
          setIsTyping(false);
        }, 1200);
      } else {
        throw new Error("Chat request failed");
      }
    } catch {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `agent-${Date.now()}`,
            sender: "agent",
            text: "⚠️ **Agent Gateway Exception**: Unable to reach FastAPI backend on port 8000. Please ensure `uvicorn app.main:app` is running.",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
        setIsTyping(false);
      }, 1000);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const handleApproveFromChat = () => {
    handleSendMessage("Approved. Please apply the verified patch in sandbox, push branch, and open GitHub PR.");
  };

  return (
    <Blurred404Background blurIntensity="heavy">
      <div className="min-h-screen font-epic antialiased selection:bg-white selection:text-black">
        {/* Top Navigation Header */}
        <header className="px-6 sm:px-12 py-6 border-b border-white/10 bg-black/40 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-blue-500 flex items-center justify-center text-black font-black text-xs">
              ⎊
            </div>
            <div>
              <h1 className="text-sm font-mono uppercase tracking-widest text-white font-bold">
                SentinelOps Swarm &amp; Agent Chat
              </h1>
              <span className="text-[10px] font-mono text-zinc-400">
                TrueForge Autonomous Harness &bull; In-Browser Interactive SRE Console
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
            <Link href="/incidents" className="text-zinc-400 hover:text-white transition-colors">
              Supabase Audit &rarr;
            </Link>
          </div>
        </header>

        {/* Main Content Layout */}
        <main className="max-w-7xl mx-auto px-6 sm:px-12 py-10 space-y-10">
          {/* Headline Banner */}
          <div className="p-8 rounded-3xl bg-black/50 backdrop-blur-xl border border-white/10 space-y-3 shadow-2xl">
            <span className="text-[10px] font-mono uppercase tracking-widest text-red-400">
              01 // TrueForge Interactive Agent Interface
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">
              Autonomous SRE Chat &amp; Swarm HUD
            </h2>
            <div className="w-full h-1.5 bg-gradient-to-r from-red-600 via-orange-500 via-amber-400 to-blue-600 rounded-full" />
          </div>

          {/* TWO COLUMN GRID: LEFT = INTERACTIVE CHAT, RIGHT = LIVE TELEMETRY & SANDBOX */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* LEFT COLUMN: INTERACTIVE AGENT CHAT (7 COLS) */}
            <div className="lg:col-span-7 flex flex-col h-[750px] p-6 rounded-3xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl space-y-4">
              {/* Chat Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-white font-bold">TRUEFORGE AGENT HARNESS</span>
                </div>
                <span className="text-zinc-400 text-[11px]">ID: {incidentId}</span>
              </div>

              {/* Chat Messages Stream */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 font-mono text-xs">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"} space-y-1`}
                  >
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400 px-1">
                      <span>{msg.sender === "user" ? "👤 You" : "🤖 TrueForge Agent"}</span>
                      <span>&bull;</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    <div
                      className={`max-w-[90%] p-4 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                        msg.sender === "user"
                          ? "bg-red-600 text-white rounded-br-none shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                          : "bg-zinc-900/90 border border-white/10 text-zinc-200 rounded-bl-none shadow-xl"
                      }`}
                    >
                      {msg.text}

                      {/* Patch Preview Code Block */}
                      {msg.patchPreview && (
                        <div className="mt-3 p-3 rounded-xl bg-black/90 border border-white/10 text-emerald-400 font-mono text-[11px] overflow-x-auto">
                          <p className="text-[10px] text-zinc-500 uppercase mb-1">Candidate Verified Patch:</p>
                          <code>{msg.patchPreview}</code>
                        </div>
                      )}

                      {/* PR Link */}
                      {msg.prLink && (
                        <div className="mt-3 pt-2 border-t border-white/10">
                          <a
                            href={msg.prLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-colors shadow"
                          >
                            View GitHub Pull Request &rarr;
                          </a>
                        </div>
                      )}

                      {/* Approval Action Button Inside Chat */}
                      {msg.isApprovalPrompt && currentStage === "awaiting_approval" && (
                        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2">
                          <button
                            onClick={handleApproveFromChat}
                            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                          >
                            ✓ Authorize Fix &amp; Open GitHub PR
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex items-center gap-2 text-zinc-400 p-2 font-mono text-xs">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <span>TrueForge Agent analyzing repository &amp; provisioning sandbox...</span>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Quick Prompt Suggestions */}
              <div className="pt-2 flex flex-wrap gap-2 font-mono text-[11px]">
                <button
                  type="button"
                  onClick={() =>
                    handleQuickPrompt(
                      "A user reported that checkout is failing with KeyError: 'STANDARD' in payment_processor.py during tax calculation. Investigate, sandbox, and fix."
                    )
                  }
                  className="px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-800/60 text-red-300 transition-colors"
                >
                  🪲 Fix KeyError: 'STANDARD'
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleQuickPrompt(
                      "A user reported that guest checkout is failing with a 500 error. Investigate using incident-runbook and ask for approval."
                    )
                  }
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-zinc-300 transition-colors"
                >
                  ⚡ Investigate 500 Outage
                </button>
              </div>

              {/* Interactive Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2 pt-1"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type an SRE prompt, query, or 'Approve' to authorize fix..."
                  className="flex-1 px-4 py-3 rounded-2xl bg-black/80 border border-white/15 text-white placeholder-zinc-500 font-mono text-xs focus:outline-none focus:border-red-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isTyping}
                  className="px-6 py-3 rounded-2xl bg-white hover:bg-zinc-200 text-black font-mono text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-30 shadow-lg"
                >
                  Send
                </button>
              </form>
            </div>

            {/* RIGHT COLUMN: SUBAGENTS SWARM & DAYTONA TERMINAL (5 COLS) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Subagents Swarm Status */}
              <div className="p-6 rounded-3xl bg-black/60 backdrop-blur-xl border border-white/10 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between pb-2 border-b border-white/10 font-mono text-xs">
                  <span className="text-zinc-400 uppercase tracking-widest text-[11px]">
                    02 // Active Swarm Radars
                  </span>
                  <span className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 text-[10px]">
                    3 Parallel Subagents
                  </span>
                </div>

                <div className="space-y-3">
                  {subagents.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-3.5 rounded-2xl bg-black/70 border border-white/10 space-y-1.5 font-mono text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-[11px]">{sub.codename}</span>
                        <span
                          className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-bold ${
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
                      <p className="text-[11px] text-zinc-300">{sub.role}</p>
                      <p className="text-[10px] text-zinc-400 truncate">{sub.telemetry}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Daytona Sandbox Terminal */}
              <div className="p-6 rounded-3xl bg-black/60 backdrop-blur-xl border border-white/10 space-y-3 shadow-2xl font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-white/10 text-zinc-400 text-[11px]">
                  <span>DAYTONA SANDBOX TERMINAL</span>
                  <span>LINUX VM</span>
                </div>
                <div className="space-y-1.5 min-h-[220px] max-h-[280px] overflow-y-auto bg-black/90 p-3 rounded-2xl border border-white/5">
                  {terminalLogs.map((log, idx) => (
                    <p
                      key={idx}
                      className={
                        log.includes("[FAIL]") || log.includes("KeyError") || log.includes("TypeError")
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
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </Blurred404Background>
  );
}
