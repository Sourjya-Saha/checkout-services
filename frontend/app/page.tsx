"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface CartItem {
  sku: string;
  name: string;
  qty: number;
  price: number;
}

interface OrderItem {
  id: string;
  sku: string;
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
  items: OrderItem[];
}

const INITIAL_CART: CartItem[] = [
  { sku: "SKU-SENTINEL-PRO", name: "SentinelOps Autonomous SRE Platform", qty: 1, price: 99.0 },
  { sku: "SKU-SANDBOX-CLUSTER", name: "Daytona Sandboxed Container Nodes", qty: 2, price: 25.0 },
];

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
};

export default function VanguardCheckoutPage() {
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

  const [activeTab, setActiveTab] = useState<"checkout" | "orders">("checkout");
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
        headers: {
          "Content-Type": "application/json",
        },
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
    <div className="min-h-screen bg-[#050505] text-zinc-100 selection:bg-violet-500 selection:text-white relative overflow-hidden font-sans">
      {/* Ambient Background Glow Mesh */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-violet-600/10 via-fuchsia-600/5 to-transparent blur-[120px] pointer-events-none -z-10" />

      {/* Floating Fluid Island Navigation */}
      <header className="pt-6 px-4 sm:px-6 sticky top-0 z-50">
        <nav className="max-w-5xl mx-auto rounded-full bg-zinc-900/70 border border-white/10 backdrop-blur-2xl px-5 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-[0_0_15px_rgba(139,92,246,0.5)]">
              ✦
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm tracking-tight text-white">checkout-service</span>
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  Target Service
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href="/sentinelops"
              className="group inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all duration-300"
            >
              <span>SentinelOps Commander</span>
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] group-hover:translate-x-0.5 transition-transform">
                ↗
              </span>
            </Link>
            <Link
              href="/incidents"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 border border-white/5 transition-colors"
            >
              Postmortems
            </Link>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono bg-zinc-900 border border-white/5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
              {backendHealth ? "API Online :8000" : "Connecting..."}
            </div>
          </div>
        </nav>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto py-12 px-4 sm:px-6 space-y-10">
        {/* Hero Title Block */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 text-[10px] uppercase tracking-[0.25em] text-zinc-400 font-medium">
            <span>E-Commerce Microservice</span>
            <span>&bull;</span>
            <span className="text-violet-400">FastAPI &amp; Supabase</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Target Checkout Service
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            A production checkout service seeded with an unhandled currency symbol regression on guest transactions. Defended autonomously by SentinelOps.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center">
          <div className="p-1 rounded-full bg-zinc-900/90 border border-white/10 flex gap-1 shadow-inner">
            <button
              onClick={() => setActiveTab("checkout")}
              className={`px-5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                activeTab === "checkout"
                  ? "bg-white text-zinc-950 shadow-md font-semibold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Live Checkout Experience
            </button>
            <button
              onClick={() => {
                setActiveTab("orders");
                fetchOrders();
              }}
              className={`px-5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                activeTab === "orders"
                  ? "bg-white text-zinc-950 shadow-md font-semibold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Database Transactions ({ordersList.length})
            </button>
          </div>
        </div>

        {activeTab === "checkout" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Cart & Config (Double-Bezel Architecture) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Cart Double-Bezel */}
              <div className="p-2 rounded-[2rem] bg-white/[0.02] border border-white/10 shadow-2xl">
                <div className="p-6 rounded-[calc(2rem-0.5rem)] bg-zinc-950/90 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] space-y-5">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <h2 className="text-xs uppercase tracking-[0.2em] font-semibold text-zinc-400">
                      Selected Items
                    </h2>
                    <span className="text-xs text-zinc-500 font-mono">{cartItems.length} Products</span>
                  </div>

                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div
                        key={item.sku}
                        className="p-4 rounded-2xl bg-zinc-900/50 border border-white/5 flex items-center justify-between gap-3 hover:border-white/10 transition-colors"
                      >
                        <div className="space-y-0.5">
                          <p className="font-medium text-sm text-zinc-100">{item.name}</p>
                          <span className="text-[11px] font-mono text-zinc-500">{item.sku}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center border border-white/10 rounded-full bg-zinc-900 px-2 py-0.5 text-xs font-mono">
                            <button
                              onClick={() => updateQuantity(item.sku, -1)}
                              className="px-2 py-0.5 text-zinc-400 hover:text-white"
                            >
                              -
                            </button>
                            <span className="px-2 font-bold text-violet-400">{item.qty}</span>
                            <button
                              onClick={() => updateQuantity(item.sku, 1)}
                              className="px-2 py-0.5 text-zinc-400 hover:text-white"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-sm font-semibold text-white min-w-[65px] text-right font-mono">
                            ${(item.price * item.qty).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Checkout Controls Double-Bezel */}
              <div className="p-2 rounded-[2rem] bg-white/[0.02] border border-white/10 shadow-2xl">
                <div className="p-6 rounded-[calc(2rem-0.5rem)] bg-zinc-950/90 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] space-y-6">
                  <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-zinc-400 border-b border-white/5 pb-4">
                    Transaction Profile
                  </h3>

                  {/* Mode Toggle */}
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-400 font-medium block">
                      Account Type (Simulate Failure)
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setIsGuest(false)}
                        className={`p-4 rounded-2xl border text-left transition-all duration-300 ${
                          !isGuest
                            ? "bg-violet-950/30 border-violet-500/50 shadow-[0_0_20px_rgba(139,92,246,0.15)] ring-1 ring-violet-500/30"
                            : "bg-zinc-900/40 border-white/5 text-zinc-400 hover:border-white/10"
                        }`}
                      >
                        <span className="block text-sm font-semibold text-white">Registered User</span>
                        <span className="text-[11px] text-zinc-400 block mt-0.5">Known Profile &bull; 200 OK</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsGuest(true)}
                        className={`p-4 rounded-2xl border text-left transition-all duration-300 ${
                          isGuest
                            ? "bg-rose-950/30 border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.15)] ring-1 ring-rose-500/30"
                            : "bg-zinc-900/40 border-white/5 text-zinc-400 hover:border-white/10"
                        }`}
                      >
                        <span className="block text-sm font-semibold text-rose-300">Guest Checkout</span>
                        <span className="text-[11px] text-rose-400/80 block mt-0.5">Seeded Regression &bull; 500 Error</span>
                      </button>
                    </div>
                  </div>

                  {/* Currency Selection */}
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-400 font-medium block">Settlement Currency</label>
                    <div className="grid grid-cols-3 gap-3">
                      {["USD", "EUR", "GBP"].map((curr) => (
                        <button
                          key={curr}
                          type="button"
                          onClick={() => setCurrency(curr)}
                          className={`py-3 rounded-2xl border text-xs font-semibold font-mono transition-all ${
                            currency === curr
                              ? "bg-white text-zinc-950 border-white shadow-md"
                              : "bg-zinc-900/40 border-white/5 text-zinc-400 hover:border-white/10"
                          }`}
                        >
                          {curr} ({CURRENCY_SYMBOLS[curr]})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* CTA Button-in-Button */}
                  <button
                    onClick={handleCheckout}
                    disabled={loading}
                    className={`group w-full py-4 px-6 rounded-full font-medium text-sm flex items-center justify-between transition-all duration-300 ${
                      isGuest
                        ? "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-[0_0_25px_rgba(244,63,94,0.3)]"
                        : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-[0_0_25px_rgba(139,92,246,0.3)]"
                    } disabled:opacity-40 active:scale-[0.99]`}
                  >
                    <span className="font-semibold">
                      {loading
                        ? "Processing Payment Gateway..."
                        : isGuest
                        ? "Trigger Guest Checkout Regression"
                        : `Complete Order ($${subtotalUSD.toFixed(2)} USD)`}
                    </span>
                    <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs group-hover:scale-105 group-hover:translate-x-0.5 transition-all">
                      →
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Real-Time Dynamic Feedback */}
            <div className="lg:col-span-5 space-y-6">
              {/* Order Success */}
              {orderResult && (
                <div className="p-2 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/30 shadow-2xl animate-fadeIn">
                  <div className="p-6 rounded-[calc(2rem-0.5rem)] bg-zinc-950/90 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                      <h3 className="font-semibold text-sm text-emerald-300">Order Confirmed (HTTP 200)</h3>
                    </div>
                    <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 font-mono text-xs space-y-1 text-zinc-300">
                      <p>Order ID: {orderResult.order_id}</p>
                      <p>Total: {orderResult.currency} {orderResult.total}</p>
                      <p className="text-emerald-400">Written to Supabase orders table</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Incident Card */}
              {errorState && (
                <div className="p-2 rounded-[2rem] bg-rose-500/10 border-2 border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.2)] animate-fadeIn">
                  <div className="p-6 rounded-[calc(2rem-0.5rem)] bg-zinc-950/90 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                        <h3 className="font-semibold text-sm text-rose-300">
                          Incident Detected (HTTP {errorState.status})
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
                        {errorState.errorType}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-900/80 border border-white/5 font-mono text-xs space-y-2 text-zinc-300">
                      <p className="text-rose-400 font-semibold">{errorState.message}</p>
                      {errorState.traceback && (
                        <div className="pt-2 border-t border-white/5 text-[11px] text-zinc-500 space-y-1">
                          {errorState.traceback.map((line, idx) => (
                            <p key={idx}>{line}</p>
                          ))}
                        </div>
                      )}
                    </div>

                    <Link
                      href="/sentinelops"
                      className="group w-full py-3 px-5 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center justify-between shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all"
                    >
                      <span>Investigate in SentinelOps Swarm</span>
                      <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                        ↗
                      </span>
                    </Link>
                  </div>
                </div>
              )}

              {/* Architecture Info Tile */}
              <div className="p-2 rounded-[2rem] bg-white/[0.02] border border-white/10">
                <div className="p-6 rounded-[calc(2rem-0.5rem)] bg-zinc-950/90 space-y-3">
                  <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-zinc-400">
                    System Safeguards
                  </h4>
                  <ul className="text-xs space-y-2.5 text-zinc-400 font-mono">
                    <li className="flex items-center gap-2">
                      <span className="text-violet-400">✦</span> TrueForge autonomous agent harness
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-violet-400">✦</span> Daytona isolated sandbox runner
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-violet-400">✦</span> Qodo AI automated repository review
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-violet-400">✦</span> Supabase persistent postmortem memory
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Orders Audit Tab */
          <div className="p-2 rounded-[2rem] bg-white/[0.02] border border-white/10 shadow-2xl">
            <div className="p-6 rounded-[calc(2rem-0.5rem)] bg-zinc-950/90 space-y-4">
              <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-zinc-400">
                PostgreSQL Transaction Records
              </h3>
              {ordersList.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-xs font-mono">
                  No orders recorded yet. Complete a checkout above to record one.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ordersList.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-5 rounded-2xl bg-zinc-900/50 border border-white/5 space-y-2 font-mono text-xs"
                    >
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-violet-400 font-bold">{ord.id.slice(0, 16)}...</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            ord.is_guest
                              ? "bg-amber-950 text-amber-300 border border-amber-800"
                              : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          }`}
                        >
                          {ord.is_guest ? "GUEST" : "AUTHENTICATED"}
                        </span>
                      </div>
                      <p className="text-white font-semibold">
                        Total: {ord.currency} {ord.total}
                      </p>
                      <p className="text-zinc-500 text-[11px]">
                        Items: {ord.items ? ord.items.map((i) => `${i.qty}x ${i.sku}`).join(", ") : "N/A"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
