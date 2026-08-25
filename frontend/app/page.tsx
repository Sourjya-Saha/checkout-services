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

export default function SentinelOpsExactCloneHero() {
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
    <div className="min-h-screen bg-[#0a0506] text-white selection:bg-red-600 selection:text-white font-sans antialiased overflow-x-hidden relative">
      {/* ========================================================================= */}
      {/* EXACT 1:1 CLONE HERO SECTION (NOISE TEXTURE, RED GLOW, KINETIC BLURS) */}
      {/* ========================================================================= */}
      <section className="relative min-h-screen flex flex-col justify-between p-8 sm:p-14 overflow-hidden border-b border-red-950/40 select-none">
        {/* SVG Film Grain / Analogue Noise Overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay z-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.7'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Ambient Radial Red Light Bleed */}
        <div className="absolute top-1/4 right-0 w-[600px] sm:w-[900px] h-[500px] bg-red-600/25 blur-[160px] pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-0 w-[500px] sm:w-[700px] h-[400px] bg-red-700/20 blur-[140px] pointer-events-none rounded-full" />

        {/* TOP RIGHT BACKGROUND BLURRED MOTION GLYPH: "SENTINEL" */}
        <div className="absolute -top-6 -right-16 text-[14vw] sm:text-[16vw] font-black uppercase text-red-600/70 tracking-tighter filter blur-[6px] sm:blur-[10px] pointer-events-none select-none z-0">
          SENTINEL
        </div>

        {/* BOTTOM BACKGROUND MASSIVE BLURRED GLYPH: "SENTINEL" */}
        <div className="absolute -bottom-16 -left-10 text-[20vw] sm:text-[23vw] font-black uppercase text-red-600/80 tracking-tighter filter blur-[8px] sm:blur-[14px] pointer-events-none select-none z-0">
          SENTINEL
        </div>

        {/* TOP EDITORIAL METADATA CALLOUTS (EXACT CORNER PLACEMENT) */}
        <div className="relative z-10 flex justify-between items-start font-mono text-xs text-zinc-300 leading-tight">
          <div className="space-y-0.5">
            <p>kill that</p>
            <p>anxiety and fear</p>
          </div>
          <div className="text-right space-y-0.5">
            <p>face it or be</p>
            <p>destroyed with it</p>
          </div>
        </div>

        {/* CENTER HERO STACK: "My Harness Agent" + KINETIC MOTION STACKED "SENTINEL OPS" */}
        <div className="relative z-10 my-auto text-center py-16">
          <p className="text-sm sm:text-base font-medium tracking-wide text-white mb-2 font-mono">
            My Harness Agent
          </p>

          <div className="relative inline-block">
            {/* Motion Blur Trail Underlayer 1 */}
            <span className="absolute top-2 left-6 sm:left-10 text-5xl sm:text-7xl md:text-8xl font-black uppercase tracking-tighter text-red-600/50 filter blur-[4px] sm:blur-[7px] select-none pointer-events-none">
              SENTINEL OPS
            </span>

            {/* Motion Blur Trail Underlayer 2 */}
            <span className="absolute -top-1 left-3 sm:left-6 text-5xl sm:text-7xl md:text-8xl font-black uppercase tracking-tighter text-red-500/70 filter blur-[2px] sm:blur-[3px] select-none pointer-events-none">
              SENTINEL OPS
            </span>

            {/* Sharp Front Title */}
            <h1 className="relative text-5xl sm:text-7xl md:text-8xl font-black uppercase tracking-tighter text-red-600 drop-shadow-[0_0_25px_rgba(220,38,38,0.8)] z-10">
              SENTINEL OPS
            </h1>
          </div>
        </div>

        {/* BOTTOM EDITORIAL METADATA CALLOUTS (EXACT CORNER PLACEMENT) */}
        <div className="relative z-10 flex justify-between items-end font-mono text-xs text-zinc-300">
          <div className="space-y-0.5">
            <p>You have</p>
            <p>to face it!</p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="#checkout"
              className="px-4 py-2 rounded-full bg-red-600/80 hover:bg-red-500 text-white font-mono text-xs font-bold backdrop-blur-md border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-all"
            >
              Test Live Service &darr;
            </a>
            <Link
              href="/sentinelops"
              className="px-4 py-2 rounded-full bg-black/60 hover:bg-black text-white font-mono text-xs border border-zinc-700 backdrop-blur-md transition-all"
            >
              Swarm HUD &rarr;
            </Link>
          </div>

          <div className="text-right space-y-0.5">
            <p>Created for</p>
            <p className="text-white font-bold">TrueForge Hackathon</p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* LIVE TARGET CHECKOUT & INCIDENT DETECTION TERMINAL */}
      {/* ========================================================================= */}
      <section id="checkout" className="px-6 sm:px-12 py-24 bg-[#080203] border-t border-red-950/60">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Header */}
          <div className="border-b border-red-950/80 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-red-500">
                02 // REPRODUCTION ENVIRONMENT
              </span>
              <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white mt-1">
                Checkout Service Gateway
              </h2>
            </div>
            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="text-emerald-400 flex items-center gap-1.5 bg-emerald-950/60 px-3.5 py-1.5 rounded-full border border-emerald-800/60">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                API STATUS: {backendHealth ? "ONLINE (8000)" : "CONNECTING"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Cart & Configuration */}
            <div className="lg:col-span-7 space-y-6">
              <div className="p-6 rounded-2xl bg-black/70 border border-zinc-900 space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400">
                  Cart Order Items
                </h3>
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div
                      key={item.sku}
                      className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between"
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
              <div className="p-6 rounded-2xl bg-black/70 border border-zinc-900 space-y-6">
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
                          ? "bg-red-950/60 border-red-500 text-red-300 font-bold shadow-[0_0_20px_rgba(239,68,68,0.3)]"
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
                  <p className="font-bold text-sm">HTTP 200: Order Successfully Processed</p>
                  <p>Order ID: {orderResult.order_id}</p>
                  <p>Total: {orderResult.currency} {orderResult.total}</p>
                  <p className="text-emerald-400">Recorded to Supabase PostgreSQL database.</p>
                </div>
              )}

              {errorState && (
                <div className="p-6 rounded-2xl bg-red-950/70 border-2 border-red-600 text-red-200 space-y-4 font-mono text-xs shadow-[0_0_30px_rgba(239,68,68,0.4)]">
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

              {/* Ecosystem Navigation */}
              <div className="p-6 rounded-2xl bg-black/70 border border-zinc-900 space-y-4">
                <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-400">
                  Autonomous SRE Architecture
                </h4>
                <div className="flex flex-col gap-2">
                  <Link
                    href="/sentinelops"
                    className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-white hover:border-red-500 transition-colors flex items-center justify-between"
                  >
                    <span>SentinelOps Commander Swarm HUD</span>
                    <span>&rarr;</span>
                  </Link>
                  <Link
                    href="/incidents"
                    className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-white hover:border-red-500 transition-colors flex items-center justify-between"
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
