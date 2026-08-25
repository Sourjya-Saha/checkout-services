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

export default function SentinelOpsCinematicLanding() {
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

  return (
    <div className="min-h-screen bg-[#070102] text-white selection:bg-red-600 selection:text-white font-sans antialiased overflow-x-hidden">
      {/* ========================================================================= */}
      {/* EXACT CINEMATIC CRIMSON HERO SECTION (AS IN REFERENCE IMAGE) */}
      {/* ========================================================================= */}
      <section className="relative min-h-screen flex flex-col justify-between items-center px-6 sm:px-12 py-10 overflow-hidden bg-radial from-[#67070e] via-[#240307] to-[#070102]">
        {/* Subtle Ambient Vignette and Radial Red Light Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-600/30 via-transparent to-black/80 pointer-events-none" />

        {/* Massive 3D Background Watermark Typography: "SOON" / "SENTINEL" */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0">
          <div className="text-[34vw] sm:text-[38vw] font-black tracking-tighter leading-none text-red-950/40 uppercase transform scale-y-125 filter blur-[0.5px] drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)]">
            SOON
          </div>
        </div>

        {/* Top Centered Eyebrow */}
        <div className="relative z-10 text-center space-y-0.5">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/90 font-mono">
            SENTINELOPS
          </p>
          <p className="text-[9px] uppercase tracking-[0.25em] text-zinc-400 font-mono">
            AUTONOMOUS INCIDENT HARNESS
          </p>
        </div>

        {/* Center Hero Typographic Stack */}
        <div className="relative z-10 text-center my-auto py-8 max-w-4xl mx-auto">
          <p className="text-xs sm:text-sm font-medium tracking-[0.2em] text-zinc-300 uppercase mb-2 font-mono">
            TRUEFORGE HARNESS 2.0.
          </p>

          {/* Main Title with Overlaid Signature Script */}
          <div className="relative inline-block select-none">
            <h1 className="text-[15vw] sm:text-[13vw] font-black uppercase tracking-[-0.03em] leading-[0.85] text-white transform scale-y-110">
              REMEDIATION
            </h1>

            {/* Overlapping Red Neon Signature Cursive Script */}
            <span
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10vw] sm:text-[8vw] text-red-500 font-serif italic whitespace-nowrap pointer-events-none select-none opacity-90 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]"
              style={{
                fontFamily: "'Brush Script MT', 'Dancing Script', cursive, sans-serif",
                transform: "translate(-50%, -40%) rotate(-6deg)",
              }}
            >
              Autonomous
            </span>
          </div>
        </div>

        {/* Bottom Context Statement & Meta Links */}
        <div className="relative z-10 text-center space-y-4 max-w-2xl mx-auto pt-6">
          <p className="text-[11px] sm:text-xs uppercase tracking-wider text-zinc-300 font-light leading-relaxed">
            AUTONOMOUS INCIDENT INVESTIGATION, DAYTONA SANDBOX VERIFICATION, AND QODO-REVIEWED REMEDIATION FOR PRODUCTION MICROSERVICES.
          </p>

          <div className="flex items-center justify-center gap-6 text-xs font-mono tracking-widest text-zinc-400">
            <a
              href="#checkout"
              className="hover:text-white transition-colors underline underline-offset-4 decoration-red-500"
            >
              SENTINELOPS.IO
            </a>
            <span>&bull;</span>
            <a
              href="mailto:support@sentinelops.io"
              className="hover:text-white transition-colors underline underline-offset-4 decoration-red-500"
            >
              SUPPORT@SENTINELOPS.IO
            </a>
          </div>
        </div>

        {/* Bottom Floating Navigation Action Pills (as in image) */}
        <div className="absolute bottom-6 left-6 z-20">
          <a
            href="#checkout"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-mono backdrop-blur-md border border-white/20 shadow-lg transition-all"
          >
            <span>↗</span>
            <span>Test Checkout Service</span>
          </a>
        </div>

        <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2">
          <Link
            href="/sentinelops"
            className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-all uppercase tracking-wider"
          >
            SentinelOps Swarm &rarr;
          </Link>
          <Link
            href="/incidents"
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-mono backdrop-blur-md border border-white/20 transition-all uppercase tracking-wider"
          >
            Audit Log
          </Link>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* INTERACTIVE CHECKOUT & ERROR INCIDENT REPRODUCTION ENGINE */}
      {/* ========================================================================= */}
      <section id="checkout" className="px-6 sm:px-12 py-24 bg-black border-t border-zinc-900">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Section Heading */}
          <div className="border-b border-zinc-800 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-widest text-red-500">
                02 // LIVE REPRODUCTION TARGET
              </span>
              <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
                Checkout Service Gateway
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-950/60 px-3 py-1.5 rounded-full border border-emerald-800/60">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Backend API: {backendHealth ? "8000 ONLINE" : "CONNECTING"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Cart & Configuration */}
            <div className="lg:col-span-7 space-y-6">
              <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400">
                  Cart Order Items
                </h3>
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div
                      key={item.sku}
                      className="p-4 rounded-xl bg-black border border-zinc-800/80 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-sm text-white">{item.name}</p>
                        <span className="text-[11px] font-mono text-zinc-500">{item.sku}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-zinc-800 rounded-lg bg-zinc-950 text-xs font-mono">
                          <button
                            onClick={() => updateQuantity(item.sku, -1)}
                            className="px-2.5 py-1 text-zinc-400 hover:text-white"
                          >
                            -
                          </button>
                          <span className="px-2 font-bold text-red-400">{item.qty}</span>
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

              {/* Mode Selection */}
              <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-6">
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
                          ? "bg-zinc-900 border-white text-white font-bold shadow-md"
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
                          ? "bg-red-950/50 border-red-500 text-red-300 font-bold shadow-[0_0_20px_rgba(239,68,68,0.2)]"
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
                      ? "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.4)]"
                      : "bg-white hover:bg-zinc-200 text-black shadow-lg"
                  } disabled:opacity-40`}
                >
                  {loading
                    ? "Processing..."
                    : isGuest
                    ? "Trigger Guest Checkout Regression (500 Error)"
                    : `Process Checkout ($${subtotalUSD.toFixed(2)} USD)`}
                </button>
              </div>
            </div>

            {/* Right: Real-Time Dynamic Feedback */}
            <div className="lg:col-span-5 space-y-6">
              {orderResult && (
                <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500 text-emerald-300 space-y-3 font-mono text-xs">
                  <p className="font-bold text-sm">HTTP 200: Order Completed Successfully</p>
                  <p>Order ID: {orderResult.order_id}</p>
                  <p>Total: {orderResult.currency} {orderResult.total}</p>
                  <p className="text-emerald-400">Written to Supabase PostgreSQL orders table.</p>
                </div>
              )}

              {errorState && (
                <div className="p-6 rounded-2xl bg-red-950/60 border-2 border-red-600 text-red-200 space-y-4 font-mono text-xs shadow-[0_0_30px_rgba(239,68,68,0.3)]">
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
                    <div className="text-[11px] text-zinc-400 space-y-1 bg-black/70 p-3 rounded-lg border border-red-900/50">
                      {errorState.traceback.map((line, idx) => (
                        <p key={idx}>{line}</p>
                      ))}
                    </div>
                  )}

                  <Link
                    href="/sentinelops"
                    className="block w-full py-3 bg-red-600 hover:bg-red-500 text-white text-center font-bold uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-all"
                  >
                    Remediate with SentinelOps Swarm &rarr;
                  </Link>
                </div>
              )}

              {/* Navigation Cards */}
              <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4">
                <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-400">
                  Autonomous SRE Ecosystem
                </h4>
                <div className="flex flex-col gap-2">
                  <Link
                    href="/sentinelops"
                    className="p-3.5 rounded-xl bg-black border border-zinc-800 text-xs font-mono text-white hover:border-red-500 transition-colors flex items-center justify-between"
                  >
                    <span>SentinelOps Commander HUD</span>
                    <span>&rarr;</span>
                  </Link>
                  <Link
                    href="/incidents"
                    className="p-3.5 rounded-xl bg-black border border-zinc-800 text-xs font-mono text-white hover:border-red-500 transition-colors flex items-center justify-between"
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
