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

export default function SentinelOpsTrueClone() {
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
    <div
      className="min-h-screen bg-[#080405] text-white selection:bg-red-600 selection:text-white antialiased overflow-x-hidden relative"
      style={{ fontFamily: "'Arial', 'Helvetica Neue', 'Epic Pro', sans-serif" }}
    >
      {/* ========================================================================= */}
      {/* PERFECT 1:1 POSTER POST-PROCESSING CANVAS */}
      {/* ========================================================================= */}
      <section className="relative h-screen w-full flex flex-col justify-between p-8 sm:p-14 overflow-hidden select-none bg-[#090304]">
        {/* Fine Analogue Film Grain Noise Layer */}
        <div
          className="absolute inset-0 pointer-events-none opacity-45 mix-blend-screen z-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.8'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Ambient Red Photographic Atmosphere Lighting */}
        <div className="absolute top-[15%] right-[5%] w-[450px] sm:w-[650px] h-[450px] bg-red-600/35 blur-[120px] rounded-full pointer-events-none z-0" />
        <div className="absolute -bottom-10 left-[10%] w-[550px] sm:w-[850px] h-[400px] bg-red-700/30 blur-[140px] rounded-full pointer-events-none z-0" />

        {/* TOP RIGHT BACKGROUND GLOWING BLURRED TEXT: "OPS" */}
        <div
          className="absolute top-[8%] right-[2%] text-[18vw] font-black uppercase text-red-600 leading-none tracking-[-0.04em] pointer-events-none z-0 opacity-80"
          style={{
            filter: "blur(22px)",
            fontFamily: "'Arial Black', 'Arial', sans-serif",
          }}
        >
          OPS
        </div>

        {/* BOTTOM LEFT BACKGROUND MASSIVE BLURRED TEXT: "SENTINEL" */}
        <div
          className="absolute -bottom-[8%] -left-[4%] text-[24vw] font-black uppercase text-red-600 leading-none tracking-[-0.05em] pointer-events-none z-0 opacity-80"
          style={{
            filter: "blur(28px)",
            fontFamily: "'Arial Black', 'Arial', sans-serif",
          }}
        >
          SENTINEL
        </div>

        {/* TOP METADATA CALLOUTS (EXACT 1:1 REPLICATION) */}
        <div className="relative z-20 flex justify-between items-start text-xs sm:text-sm font-mono text-zinc-300 tracking-wide leading-snug">
          <div>
            <p>kill that</p>
            <p>anxiety and fear</p>
          </div>
          <div className="text-right">
            <p>face it or be</p>
            <p>destroyed with it</p>
          </div>
        </div>

        {/* CENTER HERO TYPOGRAPHY WITH LAYERED MOTION ECHO */}
        <div className="relative z-20 my-auto text-center py-6">
          <p
            className="text-sm sm:text-base text-white tracking-wide mb-1 font-semibold"
            style={{ fontFamily: "'Arial', 'Epic Pro', sans-serif" }}
          >
            My Harness Agent
          </p>

          <div className="relative inline-block select-none mt-1">
            {/* Layer 1: Bottom Blurred Motion Echo */}
            <span
              className="absolute top-3 left-4 sm:left-8 text-5xl sm:text-7xl md:text-8xl font-black uppercase tracking-[-0.03em] text-red-600 opacity-60 pointer-events-none"
              style={{
                filter: "blur(8px)",
                fontFamily: "'Arial Black', 'Arial', sans-serif",
              }}
            >
              SENTINEL OPS
            </span>

            {/* Layer 2: Middle Soft Red Glow Echo */}
            <span
              className="absolute top-1 left-2 sm:left-4 text-5xl sm:text-7xl md:text-8xl font-black uppercase tracking-[-0.03em] text-red-500 opacity-80 pointer-events-none"
              style={{
                filter: "blur(3px)",
                fontFamily: "'Arial Black', 'Arial', sans-serif",
              }}
            >
              SENTINEL OPS
            </span>

            {/* Layer 3: Sharp Front Red Title */}
            <h1
              className="relative text-5xl sm:text-7xl md:text-8xl font-black uppercase tracking-[-0.03em] text-[#ff173d] drop-shadow-[0_0_20px_rgba(255,23,61,0.9)] z-10"
              style={{ fontFamily: "'Arial Black', 'Arial', sans-serif" }}
            >
              SENTINEL OPS
            </h1>
          </div>
        </div>

        {/* BOTTOM METADATA CALLOUTS & FLOATING ACTION CAPSULES */}
        <div className="relative z-20 flex justify-between items-end text-xs sm:text-sm font-mono text-zinc-300 tracking-wide">
          <div>
            <p>You have</p>
            <p>to face it!</p>
          </div>

          {/* Center Bottom Floating Action Capsules */}
          <div className="flex items-center gap-3">
            <a
              href="#checkout"
              className="px-5 py-2.5 rounded-full bg-red-600/90 hover:bg-red-500 text-white font-bold text-xs shadow-[0_0_25px_rgba(239,68,68,0.6)] backdrop-blur-md transition-all uppercase tracking-wider"
            >
              Test Live Service &darr;
            </a>
            <Link
              href="/sentinelops"
              className="px-5 py-2.5 rounded-full bg-black/80 hover:bg-black text-white font-bold text-xs border border-zinc-700/80 backdrop-blur-md transition-all uppercase tracking-wider"
            >
              Swarm HUD &rarr;
            </Link>
          </div>

          <div className="text-right">
            <p>Created by</p>
            <p className="text-white font-bold">SentinelOps.TrueForge</p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* LIVE TARGET CHECKOUT & INCIDENT REPRODUCTION GATEWAY */}
      {/* ========================================================================= */}
      <section id="checkout" className="px-6 sm:px-12 py-24 bg-[#070203] border-t border-red-950/60">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Header */}
          <div className="border-b border-red-950/80 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-red-500 font-bold">
                02 // LIVE REPRODUCTION TARGET
              </span>
              <h2
                className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white mt-1"
                style={{ fontFamily: "'Arial Black', 'Arial', sans-serif" }}
              >
                Checkout Service Gateway
              </h2>
            </div>
            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="text-emerald-400 flex items-center gap-1.5 bg-emerald-950/60 px-3.5 py-1.5 rounded-full border border-emerald-800/60 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                API STATUS: {backendHealth ? "ONLINE (8000)" : "CONNECTING"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Cart Items & Configuration */}
            <div className="lg:col-span-7 space-y-6">
              <div className="p-6 rounded-2xl bg-black/80 border border-zinc-900 space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold">
                  Cart Order Items
                </h3>
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div
                      key={item.sku}
                      className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-sm text-white">{item.name}</p>
                        <span className="text-[11px] font-mono text-zinc-500">{item.sku}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-zinc-800 rounded-lg bg-black text-xs font-mono">
                          <button
                            onClick={() => updateQuantity(item.sku, -1)}
                            className="px-2.5 py-1 text-zinc-400 hover:text-white"
                          >
                            -
                          </button>
                          <span className="px-2 font-bold text-red-500">{item.qty}</span>
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
              <div className="p-6 rounded-2xl bg-black/80 border border-zinc-900 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block font-bold">
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
                      <span className="block font-bold">👤 Registered User</span>
                      <span className="text-[10px] text-emerald-400 block mt-1">Status: 200 OK</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsGuest(true)}
                      className={`p-4 rounded-xl border text-left font-mono text-xs transition-all ${
                        isGuest
                          ? "bg-red-950/60 border-red-500 text-red-300 font-bold shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                          : "bg-black border-zinc-800 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      <span className="block font-bold">⚡ Guest Checkout</span>
                      <span className="text-[10px] text-red-400 block mt-1">Triggers 500 Incident</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block font-bold">
                    Settlement Currency
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
                      ? "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.5)]"
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

            {/* Right: Dynamic Incident & Success Feedback */}
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
                <div className="p-6 rounded-2xl bg-red-950/70 border-2 border-red-600 text-red-200 space-y-4 font-mono text-xs shadow-[0_0_30px_rgba(239,68,68,0.4)]">
                  <div className="flex items-center justify-between border-b border-red-800 pb-2">
                    <span className="font-bold text-sm text-red-300 font-bold">
                      INCIDENT DETECTED: HTTP {errorState.status}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-red-900 text-white text-[10px] font-bold">
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
              <div className="p-6 rounded-2xl bg-black/80 border border-zinc-900 space-y-4">
                <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold">
                  Autonomous SRE Architecture
                </h4>
                <div className="flex flex-col gap-2">
                  <Link
                    href="/sentinelops"
                    className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-white hover:border-red-500 transition-colors flex items-center justify-between font-bold"
                  >
                    <span>SentinelOps Commander Swarm HUD</span>
                    <span>&rarr;</span>
                  </Link>
                  <Link
                    href="/incidents"
                    className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-white hover:border-red-500 transition-colors flex items-center justify-between font-bold"
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
