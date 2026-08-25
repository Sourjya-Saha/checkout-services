"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface CartItem {
  sku: string;
  name: string;
  qty: number;
  price: number;
}

interface Order {
  id: string;
  user_id: string | null;
  is_guest: boolean;
  currency: string;
  total: number;
  status: string;
  items?: any[];
}

const INITIAL_CART: CartItem[] = [
  { sku: "SKU-SENTINEL-PRO", name: "SentinelOps Autonomous SRE Platform", qty: 1, price: 99.0 },
  { sku: "SKU-SANDBOX-CLUSTER", name: "Daytona Sandboxed Container Nodes", qty: 2, price: 25.0 },
];

export default function VenturaEditorialCheckout() {
  const [cartItems, setCartItems] = useState<CartItem[]>(INITIAL_CART);
  const [currency, setCurrency] = useState<string>("USD");
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [orderResult, setOrderResult] = useState<any | null>(null);
  const [errorState, setErrorState] = useState<{
    status?: number;
    errorType?: string;
    message: string;
    detail?: any;
    traceback?: string[];
  } | null>(null);

  const [ordersList, setOrdersList] = useState<Order[]>([]);
  const [backendHealth, setBackendHealth] = useState<{ status: string; database: string } | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    checkHealth();
    fetchOrders();
  }, []);

  const checkHealth = async () => {
    try {
      const res = await fetch(`${apiBase}/health`);
      if (res.ok) {
        const data = await res.json();
        setBackendHealth(data);
      }
    } catch {
      setBackendHealth(null);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${apiBase}/orders`);
      if (res.ok) {
        const data = await res.json();
        setOrdersList(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch orders", err);
    }
  };

  const updateQuantity = (sku: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.sku === sku) {
            const newQty = Math.max(1, item.qty + delta);
            return { ...item, qty: newQty };
          }
          return item;
        })
        .filter((item) => item.qty > 0)
    );
  };

  const subtotalUSD = cartItems.reduce((acc, item) => acc + item.qty * item.price, 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setOrderResult(null);
    setErrorState(null);

    const payload = {
      user_id: isGuest ? null : "usr_8fa93c20-7e1d-481b-9721-e019f2a938c4",
      cart_items: cartItems.map(({ sku, qty, price }) => ({ sku, qty, price })),
      currency: currency,
      is_guest: isGuest,
    };

    try {
      const response = await fetch(`${apiBase}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let responseData: any = {};
      try {
        responseData = await response.json();
      } catch {
        responseData = { message: "Internal server error" };
      }

      if (!response.ok) {
        setErrorState({
          status: response.status,
          errorType: responseData.type || "ServerError",
          message: responseData.message || responseData.detail || "Unhandled Server Exception",
          detail: responseData,
          traceback: responseData.traceback_tail || [],
        });
      } else {
        setOrderResult(responseData);
        fetchOrders();
      }
    } catch (err: any) {
      setErrorState({
        status: 500,
        errorType: "NetworkFetchException",
        message: err.message || "Failed to communicate with FastAPI backend (:8000)",
        detail: err,
        traceback: ["Check if FastAPI server is running: uvicorn app.main:app --port 8000 --reload"],
      });
    } finally {
      setLoading(false);
    }
  };

  const letterPills = [
    { letter: "V", bg: "bg-[#e11d48]" },
    { letter: "E", bg: "bg-[#f97316]" },
    { letter: "N", bg: "bg-[#f59e0b]" },
    { letter: "T", bg: "bg-[#eab308]" },
    { letter: "U", bg: "bg-[#06b6d4]" },
    { letter: "R", bg: "bg-[#0284c7]" },
    { letter: "A", bg: "bg-[#2563eb]" },
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-sans antialiased overflow-x-hidden">
      {/* ========================================================================= */}
      {/* SLIDE 30: HERO SECTION WITH MASSIVE TYPOGRAPHY & PRISMATIC GRADIENT BAR */}
      {/* ========================================================================= */}
      <section className="relative min-h-screen px-6 sm:px-12 py-8 flex flex-col justify-between border-b border-zinc-900">
        {/* Top Meta Bar */}
        <div className="flex items-center justify-between text-[11px] uppercase tracking-widest text-zinc-400 font-mono">
          <span>Partnership Proposal // SentinelOps</span>
          <span className="hidden sm:inline">January 01 / 2026</span>
          <div className="flex items-center gap-3">
            <span className="w-16 sm:w-24 h-2 rounded-full bg-gradient-to-r from-red-500 via-amber-400 via-emerald-400 via-cyan-400 to-blue-600 inline-block shadow-[0_0_12px_rgba(6,182,212,0.6)]" />
            <Link
              href="/sentinelops"
              className="text-white hover:text-cyan-400 transition-colors underline font-bold"
            >
              Commander HUD &rarr;
            </Link>
          </div>
        </div>

        {/* Center Giant Display Typography */}
        <div className="my-auto py-12">
          <h1 className="text-[18vw] sm:text-[19vw] font-black tracking-[-0.06em] leading-[0.82] text-white select-none">
            Ventura
          </h1>
          {/* Full-width Spectral Prismatic Gradient Bar */}
          <div className="w-full h-3 sm:h-4.5 bg-gradient-to-r from-red-600 via-orange-500 via-amber-400 via-emerald-400 via-cyan-400 to-blue-600 shadow-[0_0_25px_rgba(249,115,22,0.4)] my-4" />

          {/* Description Block */}
          <div className="max-w-2xl ml-auto pt-4 text-right space-y-2">
            <p className="text-xs sm:text-sm text-zinc-300 font-light leading-relaxed">
              Ventura is a research and incident response organisation transforming multi-billion cloud architectures into resilient market leaders.
            </p>
            <p className="text-xs sm:text-sm text-zinc-400 font-light leading-relaxed">
              We occupy the space between real-world infrastructure and autonomous AI swarms to deliver initiatives that truly captivate and convert minds.
            </p>
          </div>
        </div>

        {/* Bottom Metadata Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-zinc-400 font-mono pt-8 border-t border-zinc-900 gap-2">
          <span>30 // Production &amp; Strategy Firm</span>
          <span>contact@ventura.mn</span>
          <span>(+976) 83038880</span>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SLIDE 31: THREE COLUMNS + COLORED LETTER PILLS + STATEMENT MANIFESTO */}
      {/* ========================================================================= */}
      <section className="min-h-screen px-6 sm:px-12 py-16 flex flex-col justify-between border-b border-zinc-900">
        {/* 3 Column Top Context */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs text-zinc-400 font-light leading-relaxed border-b border-zinc-900 pb-12">
          <div>
            <p className="text-white font-medium mb-1">01. Autonomous SRE Shift</p>
            <p>
              Auto-responsive market shift in a cloud ecosystem undergoing significant change due to the introduction of low-latency protocols, sandboxed verification, and multi-agent swarms.
            </p>
          </div>
          <div>
            <p className="text-white font-medium mb-1">02. Infrastructure Integration</p>
            <p>
              A clean integrated system where innovative technologies, protocols, or services challenge traditional manual SRE, unlocking dynamic real-time value and zero downtime.
            </p>
          </div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white font-medium mb-1">03. Zero-Hallucination Execution</p>
              <p>
                Explore how we turn chaotic production outages into sandboxed, test-verified, and Qodo-reviewed pull requests.
              </p>
            </div>
            <span className="text-[10px] font-mono text-zinc-600">031</span>
          </div>
        </div>

        {/* Colored Letter Bubble Pills (V E N T U R A →) */}
        <div className="py-12 flex items-center gap-2.5 sm:gap-3 flex-wrap">
          {letterPills.map((pill, idx) => (
            <div
              key={idx}
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${pill.bg} text-white font-black text-sm sm:text-base flex items-center justify-center shadow-lg transform hover:-translate-y-1 transition-transform cursor-pointer`}
            >
              {pill.letter}
            </div>
          ))}
          <Link
            href="/sentinelops"
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-zinc-900 border border-zinc-700 text-white font-bold flex items-center justify-center hover:bg-white hover:text-black transition-colors"
          >
            &rarr;
          </Link>
        </div>

        {/* Giant Typographic Manifesto */}
        <div className="py-8 space-y-1 select-none">
          <p className="text-4xl sm:text-6xl md:text-7xl font-extralight uppercase tracking-tight text-zinc-300">
            Comfort Builds
          </p>
          <p className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight text-white">
            Companies.
          </p>
          <p className="text-4xl sm:text-6xl md:text-7xl font-extralight uppercase tracking-tight text-zinc-300">
            Disruption Builds
          </p>
          <p className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight text-white">
            Industries.
          </p>
        </div>

        {/* Footer Page Number */}
        <div className="flex justify-between items-center text-xs font-mono text-zinc-500 pt-8">
          <span>31 // Manifesto</span>
          <span>© 2026 Ventura Inc. All rights reserved.</span>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SLIDE 32: REVOLUTION HEADING + 1000+ STATS + 3D CHROMATIC GRAPHIC */}
      {/* ========================================================================= */}
      <section className="min-h-screen px-6 sm:px-12 py-16 flex flex-col justify-between border-b border-zinc-900">
        <div className="space-y-8">
          {/* Header Row */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
              Dive into our world and discover autonomous reliability and storytelling redefined.
            </p>
            <div className="text-right">
              <h2 className="text-2xl sm:text-4xl font-light text-white tracking-tight">
                We are a revolution{" "}
                <span className="font-black bg-gradient-to-r from-red-500 via-orange-400 via-emerald-400 to-blue-500 bg-clip-text text-transparent">
                  in the making
                </span>
              </h2>
            </div>
          </div>

          {/* 3 Metric Columns with Big Italic Numerals */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-zinc-900">
            <div className="space-y-3">
              <p className="text-5xl sm:text-6xl font-black italic tracking-tighter text-white">
                1000<span className="text-amber-400 not-italic font-light">+</span>
              </p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">PROJECTS</p>
              <p className="text-xs text-zinc-400 font-light leading-relaxed">
                Not just years. It&apos;s over a decade of learning, reinvention, and thoughtful transformation.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-5xl sm:text-6xl font-black italic tracking-tighter text-white">
                40<span className="text-cyan-400 not-italic font-light">+</span>
              </p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">CLIENTS</p>
              <p className="text-xs text-zinc-400 font-light leading-relaxed">
                Each one crafted with clarity, purpose, and lasting impact across mission-critical services.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-5xl sm:text-6xl font-black italic tracking-tighter text-white">
                10<span className="text-rose-400 not-italic font-light">+</span>
              </p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">YEARS</p>
              <p className="text-xs text-zinc-400 font-light leading-relaxed">
                From established market leaders to bold newcomers, we partner with those who expect more than &quot;normal&quot;.
              </p>
            </div>
          </div>
        </div>

        {/* 3D Chromatic Perspective Typographic Visual */}
        <div className="py-16 select-none relative overflow-hidden">
          <div className="relative text-[13vw] sm:text-[14vw] font-black leading-[0.8] tracking-tight uppercase">
            {/* Chromatic Extrusion Layers */}
            <span className="absolute top-4 left-4 text-red-600/60 blur-[1px]">our experience</span>
            <span className="absolute top-3 left-3 text-orange-500/70 blur-[0.5px]">our experience</span>
            <span className="absolute top-2 left-2 text-yellow-400/80">our experience</span>
            <span className="absolute top-1 left-1 text-cyan-400/90">our experience</span>
            <span className="relative text-white z-10">our experience</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center text-xs font-mono text-zinc-500 pt-8 border-t border-zinc-900">
          <span>32 // Experience Portfolio</span>
          <span>Ready to execute &bull; SentinelOps SRE</span>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* LIVE INTERACTIVE CHECKOUT & INCIDENT TESTING MODULE */}
      {/* ========================================================================= */}
      <section className="px-6 sm:px-12 py-20 bg-zinc-950 border-t border-zinc-900">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="border-b border-zinc-800 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-400">
                Functional Verification Environment
              </span>
              <h2 className="text-3xl font-black tracking-tight text-white mt-1">
                Live Checkout Terminal
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Backend API: {backendHealth ? "8000 OK" : "Connecting"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Cart items */}
            <div className="lg:col-span-7 space-y-6">
              <div className="p-6 rounded-2xl bg-black border border-zinc-800 space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400">
                  Cart Order Items
                </h3>
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div
                      key={item.sku}
                      className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-sm text-white">{item.name}</p>
                        <span className="text-[11px] font-mono text-zinc-500">{item.sku}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-zinc-700 rounded-lg bg-black text-xs font-mono">
                          <button
                            onClick={() => updateQuantity(item.sku, -1)}
                            className="px-2.5 py-1 text-zinc-400 hover:text-white"
                          >
                            -
                          </button>
                          <span className="px-2 font-bold text-cyan-400">{item.qty}</span>
                          <button
                            onClick={() => updateQuantity(item.sku, 1)}
                            className="px-2.5 py-1 text-zinc-400 hover:text-white"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-sm font-bold font-mono text-white min-w-[65px] text-right">
                          ${(item.price * item.qty).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Controls */}
              <div className="p-6 rounded-2xl bg-black border border-zinc-800 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                    Select User Authentication Mode
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setIsGuest(false)}
                      className={`p-4 rounded-xl border text-left font-mono text-xs transition-all ${
                        !isGuest
                          ? "bg-zinc-900 border-white text-white font-bold"
                          : "bg-black border-zinc-800 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      <span className="block">👤 Registered User</span>
                      <span className="text-[10px] text-emerald-400 block mt-1">Status: 200 OK</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsGuest(true)}
                      className={`p-4 rounded-xl border text-left font-mono text-xs transition-all ${
                        isGuest
                          ? "bg-red-950/40 border-red-500 text-red-300 font-bold"
                          : "bg-black border-zinc-800 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      <span className="block">⚡ Guest Checkout</span>
                      <span className="text-[10px] text-red-400 block mt-1">Triggers 500 Incident</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                    Currency
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {["USD", "EUR", "GBP"].map((curr) => (
                      <button
                        key={curr}
                        type="button"
                        onClick={() => setCurrency(curr)}
                        className={`py-2.5 rounded-xl border font-mono text-xs font-bold transition-all ${
                          currency === curr
                            ? "bg-white text-black border-white"
                            : "bg-black border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        {curr}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className={`w-full py-4 rounded-xl font-mono text-xs font-black uppercase tracking-widest transition-all ${
                    isGuest
                      ? "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                      : "bg-white hover:bg-zinc-200 text-black shadow-lg"
                  } disabled:opacity-40`}
                >
                  {loading
                    ? "Processing..."
                    : isGuest
                    ? "Execute Guest Checkout (Trigger Regression)"
                    : `Process Checkout ($${subtotalUSD.toFixed(2)} USD)`}
                </button>
              </div>
            </div>

            {/* Right: Dynamic Incident & Success Feedback */}
            <div className="lg:col-span-5 space-y-6">
              {orderResult && (
                <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500 text-emerald-300 space-y-3 font-mono text-xs">
                  <p className="font-bold text-sm">HTTP 200: Order Successfully Processed</p>
                  <p>Order ID: {orderResult.order_id}</p>
                  <p>Total: {orderResult.currency} {orderResult.total}</p>
                  <p className="text-emerald-400">Committed to Supabase PostgreSQL database.</p>
                </div>
              )}

              {errorState && (
                <div className="p-6 rounded-2xl bg-red-950/60 border-2 border-red-600 text-red-200 space-y-4 font-mono text-xs shadow-[0_0_25px_rgba(239,68,68,0.3)]">
                  <div className="flex items-center justify-between border-b border-red-800 pb-2">
                    <span className="font-bold text-sm text-red-300">
                      INCIDENT DETECTED: HTTP {errorState.status}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-red-900 text-white text-[10px]">
                      {errorState.errorType}
                    </span>
                  </div>
                  <p className="font-bold text-red-400">{errorState.message}</p>
                  {errorState.traceback && (
                    <div className="text-[11px] text-zinc-400 space-y-1 bg-black/60 p-3 rounded-lg border border-red-900/50">
                      {errorState.traceback.map((line, idx) => (
                        <p key={idx}>{line}</p>
                      ))}
                    </div>
                  )}

                  <Link
                    href="/sentinelops"
                    className="block w-full py-3 bg-red-600 hover:bg-red-500 text-white text-center font-bold uppercase tracking-wider rounded-xl transition-colors"
                  >
                    Open SentinelOps Swarm Visualizer &rarr;
                  </Link>
                </div>
              )}

              {/* Direct links */}
              <div className="p-6 rounded-2xl bg-black border border-zinc-800 space-y-4">
                <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-400">
                  Quick Navigation
                </h4>
                <div className="flex flex-col gap-2">
                  <Link
                    href="/sentinelops"
                    className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-white hover:border-white transition-colors flex items-center justify-between"
                  >
                    <span>SentinelOps Commander HUD</span>
                    <span>&rarr;</span>
                  </Link>
                  <Link
                    href="/incidents"
                    className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-white hover:border-white transition-colors flex items-center justify-between"
                  >
                    <span>Supabase Postmortem Audit Log</span>
                    <span>&rarr;</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
