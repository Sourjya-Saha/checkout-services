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
  { sku: "SKU-SENTINEL-PRO", name: "SentinelOps Autonomous SRE Pro License", qty: 1, price: 99.0 },
  { sku: "SKU-CLOUD-CREDITS", name: "Daytona Sandboxed Compute Credits (x500)", qty: 2, price: 25.0 },
];

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
};

export default function CheckoutPage() {
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-black text-slate-950 text-sm shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              🛒
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-wider text-sm text-white uppercase font-mono">
                  Checkout-Service
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800/60 font-bold">
                  Live Target App
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                FastAPI :8000 &bull; Supabase PostgreSQL &bull; Next.js 14
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href="/sentinelops"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all uppercase tracking-wider"
            >
              SentinelOps HUD &rarr;
            </Link>
            <Link
              href="/incidents"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all uppercase tracking-wider"
            >
              Incident Log
            </Link>
            <button
              onClick={checkHealth}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono bg-slate-900 border border-slate-800 text-emerald-400"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse"></span>
              API: {backendHealth ? "ONLINE (8000)" : "OFFLINE"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-8 space-y-8">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 pb-2 gap-4 text-xs font-mono">
          <button
            onClick={() => setActiveTab("checkout")}
            className={`pb-2 px-3 border-b-2 font-bold transition-all ${
              activeTab === "checkout"
                ? "border-cyan-400 text-cyan-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            01 // LIVE CHECKOUT TERMINAL
          </button>
          <button
            onClick={() => {
              setActiveTab("orders");
              fetchOrders();
            }}
            className={`pb-2 px-3 border-b-2 font-bold transition-all ${
              activeTab === "orders"
                ? "border-cyan-400 text-cyan-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            02 // DATABASE ORDER AUDIT ({ordersList.length})
          </button>
        </div>

        {activeTab === "checkout" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Cart & Configuration */}
            <div className="lg:col-span-7 space-y-6">
              {/* Cart Container */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
                    Cart Items &bull; Active Payload
                  </h2>
                  <span className="text-xs font-mono text-slate-400">{cartItems.length} Products</span>
                </div>

                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div
                      key={item.sku}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="font-bold text-xs text-white">{item.name}</p>
                        <span className="text-[10px] font-mono text-slate-500">{item.sku}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center border border-slate-800 rounded-lg bg-slate-900 text-xs font-mono">
                          <button
                            onClick={() => updateQuantity(item.sku, -1)}
                            className="px-2.5 py-1 hover:bg-slate-800 text-slate-300"
                          >
                            -
                          </button>
                          <span className="px-3 py-1 font-bold text-cyan-400">{item.qty}</span>
                          <button
                            onClick={() => updateQuantity(item.sku, 1)}
                            className="px-2.5 py-1 hover:bg-slate-800 text-slate-300"
                          >
                            +
                          </button>
                        </div>
                        <span className="font-mono text-xs font-bold text-white min-w-[65px] text-right">
                          ${(item.price * item.qty).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Settings Container */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono border-b border-slate-800 pb-3">
                  Checkout Configuration Matrix
                </h3>

                {/* Registered vs Guest Mode */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-slate-300 font-bold block">
                    USER AUTHENTICATION STATE
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setIsGuest(false)}
                      className={`p-3.5 rounded-xl border font-mono text-xs text-left transition-all ${
                        !isGuest
                          ? "bg-slate-900 border-cyan-500/80 text-cyan-300 ring-1 ring-cyan-500/30"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <span className="block font-bold">👤 Registered User</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Returns 200 OK</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsGuest(true)}
                      className={`p-3.5 rounded-xl border font-mono text-xs text-left transition-all ${
                        isGuest
                          ? "bg-red-950/40 border-red-500/80 text-red-300 ring-1 ring-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <span className="block font-bold">⚡ Guest Checkout</span>
                      <span className="text-[10px] text-red-400 block mt-0.5">Triggers 500 Incident</span>
                    </button>
                  </div>
                </div>

                {/* Currency Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-slate-300 font-bold block">
                    PAYMENT CURRENCY
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {["USD", "EUR", "GBP"].map((curr) => (
                      <button
                        key={curr}
                        type="button"
                        onClick={() => setCurrency(curr)}
                        className={`py-2.5 rounded-xl border font-mono text-xs font-bold transition-all ${
                          currency === curr
                            ? "bg-slate-900 border-cyan-500 text-cyan-300"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        {curr} ({CURRENCY_SYMBOLS[curr]})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit CTA */}
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className={`w-full py-3.5 rounded-xl font-mono text-xs font-black uppercase tracking-wider transition-all shadow-lg ${
                    isGuest
                      ? "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                      : "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                  } disabled:opacity-40`}
                >
                  {loading
                    ? "Executing Payment Process..."
                    : isGuest
                    ? "Trigger Guest Checkout (Seeded Regression)"
                    : `Process Payment ($${subtotalUSD.toFixed(2)} USD)`}
                </button>
              </div>
            </div>

            {/* Right Column: Dynamic Live Response */}
            <div className="lg:col-span-5 space-y-6">
              {/* Order Success Card */}
              {orderResult && (
                <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/80 shadow-[0_0_25px_rgba(16,185,129,0.15)] space-y-4 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
                    <h3 className="font-mono text-sm font-bold text-emerald-300">
                      HTTP 200: ORDER COMPLETED
                    </h3>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-1.5 text-slate-300">
                    <p>
                      <strong>Order ID:</strong> <span className="text-emerald-400">{orderResult.order_id}</span>
                    </p>
                    <p>
                      <strong>Total:</strong> {orderResult.currency} {orderResult.total}
                    </p>
                    <p>
                      <strong>Database:</strong> Written to Supabase PostgreSQL (orders table)
                    </p>
                  </div>
                </div>
              )}

              {/* Error Incident Card */}
              {errorState && (
                <div className="p-6 rounded-2xl bg-red-950/50 border-2 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.25)] space-y-4 animate-shake">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
                      <h3 className="font-mono text-sm font-bold text-red-300">
                        INCIDENT DETECTED: HTTP {errorState.status}
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-900 text-red-200 font-bold">
                      {errorState.errorType}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2 text-slate-300">
                    <p className="text-red-400 font-bold">{errorState.message}</p>
                    {errorState.traceback && errorState.traceback.length > 0 && (
                      <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                        <p className="font-bold text-slate-300">Stack Trace Tail:</p>
                        {errorState.traceback.map((line, i) => (
                          <p key={i} className="text-slate-400">
                            {line}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <Link
                      href="/sentinelops"
                      className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs rounded-xl shadow text-center uppercase tracking-wider"
                    >
                      Remediate with SentinelOps Swarm &rarr;
                    </Link>
                  </div>
                </div>
              )}

              {/* System Architecture Blueprint */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono border-b border-slate-800 pb-2">
                  System Telemetry &amp; SRE Guardrails
                </h3>
                <ul className="text-xs font-mono space-y-2.5 text-slate-400">
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span> Backend CORS exception handling active
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span> Supabase PostgreSQL persistence connected
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span> Daytona isolated sandbox runner ready
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span> Qodo AI automated code review integrated
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          /* Orders Audit Tab */
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-cyan-400 font-mono">
              Live Database Orders (Supabase orders table)
            </h3>
            {ordersList.length === 0 ? (
              <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-slate-500 font-mono text-xs">
                No orders recorded yet. Complete a checkout transaction to record one.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ordersList.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 font-mono text-xs"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-cyan-400 font-bold">{ord.id.slice(0, 16)}...</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          ord.is_guest
                            ? "bg-amber-950 text-amber-300 border border-amber-800"
                            : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                        }`}
                      >
                        {ord.is_guest ? "GUEST ORDER" : "AUTHENTICATED"}
                      </span>
                    </div>
                    <div className="space-y-1 text-slate-300">
                      <p>
                        Total: <strong>{ord.currency} {ord.total}</strong>
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        Items: {ord.items ? ord.items.map((i) => `${i.qty}x ${i.sku}`).join(", ") : "N/A"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
