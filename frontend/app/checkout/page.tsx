"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Blurred404Background from "@/components/Blurred404Background";

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

export default function CheckoutServiceGatewayPage() {
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
    <Blurred404Background blurIntensity="heavy">
      <div className="min-h-screen px-6 sm:px-12 py-10 font-epic antialiased selection:bg-red-600 selection:text-white">
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Navigation & Header in Frosted Glass */}
          <header className="p-6 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl">
            <div className="space-y-1">
              <Link
                href="/"
                className="text-xs font-mono text-zinc-400 hover:text-white transition-colors"
              >
                &larr; Return to SentinelOps Poster
              </Link>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1">
                Checkout Service Gateway
              </h1>
              <p className="text-[11px] font-mono text-zinc-400">
                Target Microservice for Regression Reproduction &bull; FastAPI + Supabase
              </p>
            </div>
            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="text-emerald-400 flex items-center gap-1.5 bg-emerald-950/60 px-3.5 py-1.5 rounded-full border border-emerald-800/60 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                API STATUS: {backendHealth ? "ONLINE (8000)" : "CONNECTING"}
              </span>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Cart & Configuration */}
            <div className="lg:col-span-7 space-y-6">
              <div className="p-6 rounded-3xl bg-black/50 backdrop-blur-xl border border-white/10 space-y-4 shadow-2xl">
                <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400">
                  Cart Order Items
                </h3>
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div
                      key={item.sku}
                      className="p-4 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-sm text-white">{item.name}</p>
                        <span className="text-[11px] font-mono text-zinc-500">{item.sku}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-white/10 rounded-xl bg-black/70 text-xs font-mono">
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
              <div className="p-6 rounded-3xl bg-black/50 backdrop-blur-xl border border-white/10 space-y-6 shadow-2xl">
                <div className="space-y-2">
                  <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                    Select User Authentication Mode
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setIsGuest(false)}
                      className={`p-4 rounded-2xl border text-left font-mono text-xs transition-all ${
                        !isGuest
                          ? "bg-white/15 border-white text-white font-bold shadow-lg"
                          : "bg-black/40 border-white/10 text-zinc-400 hover:border-white/20"
                      }`}
                    >
                      <span className="block">👤 Registered User</span>
                      <span className="text-[10px] text-emerald-400 block mt-1">Status: 200 OK</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsGuest(true)}
                      className={`p-4 rounded-2xl border text-left font-mono text-xs transition-all ${
                        isGuest
                          ? "bg-red-950/70 border-red-500 text-red-300 font-bold shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                          : "bg-black/40 border-white/10 text-zinc-400 hover:border-white/20"
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
                            : "bg-black/40 border-white/10 text-zinc-400 hover:border-white/20"
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
                  className={`w-full py-4 rounded-2xl font-epic text-xs font-black uppercase tracking-widest transition-all ${
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

            {/* Right: Dynamic Feedback */}
            <div className="lg:col-span-5 space-y-6">
              {orderResult && (
                <div className="p-6 rounded-3xl bg-emerald-950/60 border border-emerald-500 text-emerald-300 space-y-3 font-mono text-xs backdrop-blur-xl shadow-2xl">
                  <p className="font-bold text-sm font-epic">HTTP 200: Order Successfully Processed</p>
                  <p>Order ID: {orderResult.order_id}</p>
                  <p>Total: {orderResult.currency} {orderResult.total}</p>
                  <p className="text-emerald-400">Recorded to Supabase PostgreSQL database.</p>
                </div>
              )}

              {errorState && (
                <div className="p-6 rounded-3xl bg-red-950/80 border-2 border-red-600 text-red-200 space-y-4 font-mono text-xs shadow-[0_0_30px_rgba(239,68,68,0.5)] backdrop-blur-xl">
                  <div className="flex items-center justify-between border-b border-red-800 pb-2">
                    <span className="font-bold text-sm text-red-300 font-epic">
                      INCIDENT DETECTED: HTTP {errorState.status}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-red-900 text-white text-[10px]">
                      {errorState.errorType}
                    </span>
                  </div>
                  <p className="font-bold text-red-400">{errorState.message}</p>
                  {errorState.traceback && (
                    <div className="text-[11px] text-zinc-400 space-y-1 bg-black/80 p-3.5 rounded-xl border border-red-900/50">
                      {errorState.traceback.map((line, idx) => (
                        <p key={idx}>{line}</p>
                      ))}
                    </div>
                  )}

                  <Link
                    href="/sentinelops"
                    className="block w-full py-3 bg-red-600 hover:bg-red-500 text-white text-center font-bold uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-all font-epic"
                  >
                    Remediate with SentinelOps Swarm &rarr;
                  </Link>
                </div>
              )}

              {/* Navigation Cards */}
              <div className="p-6 rounded-3xl bg-black/50 backdrop-blur-xl border border-white/10 space-y-4 shadow-2xl">
                <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-400">
                  Autonomous SRE Ecosystem
                </h4>
                <div className="flex flex-col gap-2.5">
                  <Link
                    href="/sentinelops"
                    className="p-4 rounded-2xl bg-black/60 border border-white/10 text-xs font-mono text-white hover:border-red-500 transition-colors flex items-center justify-between"
                  >
                    <span>SentinelOps Commander Swarm HUD</span>
                    <span>&rarr;</span>
                  </Link>
                  <Link
                    href="/incidents"
                    className="p-4 rounded-2xl bg-black/60 border border-white/10 text-xs font-mono text-white hover:border-red-500 transition-colors flex items-center justify-between"
                  >
                    <span>Supabase Postmortem Audit Log</span>
                    <span>&rarr;</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Blurred404Background>
  );
}
