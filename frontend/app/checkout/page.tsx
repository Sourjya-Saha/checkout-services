"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Blurred404Background from "@/components/Blurred404Background";

interface CartItem {
  sku: string;
  name: string;
  qty: number;
  price: number;
}

const INITIAL_CART: CartItem[] = [
  { sku: "SKU-SENTINEL-PRO", name: "SentinelOps Pro Subscription", qty: 1, price: 99.0 },
  { sku: "SKU-CLOUD-CREDITS", name: "Cloud Compute Credits (1,000 hrs)", qty: 2, price: 25.0 },
];

export default function CheckoutExperience() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>(INITIAL_CART);
  const [currency, setCurrency] = useState<string>("USD");
  const [isGuest, setIsGuest] = useState<boolean>(true);
  const [promoCode, setPromoCode] = useState<string>("");
  const [shippingAddress, setShippingAddress] = useState<string>("100 Innovation Way, San Francisco, CA");
  const [customerName, setCustomerName] = useState<string>("Guest Customer");
  const [loading, setLoading] = useState<boolean>(false);
  const [orderResult, setOrderResult] = useState<any | null>(null);
  const [errorState, setErrorState] = useState<any | null>(null);
  const [showIncidentModal, setShowIncidentModal] = useState<boolean>(false);
  const [reportingIncident, setReportingIncident] = useState<boolean>(false);

  const apiBase = process.env.NEXT_PUBLIC_CHECKOUT_API_URL || "http://127.0.0.1:8000";

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
    setShowIncidentModal(false);

    const payload = {
      user_id: isGuest ? null : "usr_8fa93c20-7e1d-481b-9721-e019f2a938c4",
      cart_items: cartItems.map(({ sku, qty, price }) => ({ sku, qty, price })),
      currency: currency,
      is_guest: isGuest,
      promo_code: promoCode || null,
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
        const errObj = {
          status: response.status,
          errorType: responseData.type || "ServerError",
          message: responseData.message || responseData.detail || `Server returned HTTP ${response.status}`,
          detail: responseData,
          traceback: responseData.traceback_tail || [
            responseData.stack_trace || responseData.message || `HTTP ${response.status} at /checkout`,
          ],
        };
        setErrorState(errObj);
        setShowIncidentModal(true);
      } else {
        setOrderResult(responseData);
      }
    } catch (err: any) {
      const errObj = {
        status: 500,
        errorType: "NetworkFetchException",
        message: err.message || "Failed to communicate with Checkout Server (:8000)",
        detail: err,
        traceback: ["Check if backend server is online on port 8000"],
      };
      setErrorState(errObj);
      setShowIncidentModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleReportIncident = async () => {
    if (!errorState) return;
    setReportingIncident(true);
    try {
      const res = await fetch("/api/incidents/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error_message: errorState.message,
          stack_trace: errorState.traceback?.join("\n") || errorState.message,
          endpoint: "/checkout",
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await res.json();
      if (data.success && data.id) {
        router.push(`/sentinelops?incident=${data.id}`);
      } else {
        router.push("/sentinelops");
      }
    } catch (e) {
      console.error("Failed to report incident:", e);
      router.push("/sentinelops");
    } finally {
      setReportingIncident(false);
    }
  };

  return (
    <Blurred404Background blurIntensity="heavy">
      <div className="min-h-screen px-6 sm:px-12 py-10 font-epic antialiased selection:bg-white selection:text-black">
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Header */}
          <header className="p-6 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl">
            <div>
              <Link
                href="/"
                className="text-xs font-mono text-zinc-400 hover:text-white transition-colors"
              >
                &larr; SentinelOps Home
              </Link>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1">
                Store Checkout
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/sentinelops"
                className="text-xs font-mono text-zinc-400 hover:text-white transition-colors"
              >
                SentinelOps Swarm &rarr;
              </Link>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Cart & Form */}
            <div className="lg:col-span-7 space-y-6">
              <div className="p-6 rounded-3xl bg-black/50 backdrop-blur-xl border border-white/10 space-y-4 shadow-2xl">
                <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400">
                  Your Cart
                </h3>
                <div className="divide-y divide-white/10">
                  {cartItems.map((item) => (
                    <div
                      key={item.sku}
                      className="py-3.5 flex items-center justify-between gap-4"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-white">{item.name}</h4>
                        <p className="text-xs font-mono text-zinc-400">
                          ${item.price.toFixed(2)} &times; {item.qty}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.sku, -1)}
                          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-xs"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-xs font-mono font-bold text-white">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.sku, 1)}
                          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer & Shipping Details */}
              <div className="p-6 rounded-3xl bg-black/50 backdrop-blur-xl border border-white/10 space-y-4 shadow-2xl">
                <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400">
                  Checkout Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:outline-none focus:border-white/40"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                      Shipping Address
                    </label>
                    <input
                      type="text"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:outline-none focus:border-white/40"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                      Promo Code (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SUMMER20"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:outline-none focus:border-white/40"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Summary & Order Trigger */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 rounded-3xl bg-black/50 backdrop-blur-xl border border-white/10 space-y-5 shadow-2xl">
                <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400">
                  Payment Summary
                </h3>

                {/* Account Mode Toggle */}
                <div className="flex rounded-2xl bg-black/70 p-1 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsGuest(true)}
                    className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                      isGuest ? "bg-white text-black shadow-md" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Guest Checkout
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsGuest(false)}
                    className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                      !isGuest ? "bg-white text-black shadow-md" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Member Account
                  </button>
                </div>

                {/* Currency Picker */}
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1.5">
                    Currency
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["USD", "EUR", "GBP"].map((curr) => (
                      <button
                        key={curr}
                        type="button"
                        onClick={() => setCurrency(curr)}
                        className={`py-2 rounded-xl text-xs font-mono font-bold transition-all border ${
                          currency === curr
                            ? "bg-white/20 border-white text-white"
                            : "bg-black/60 border-white/10 text-zinc-400 hover:text-white"
                        }`}
                      >
                        {curr}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subtotal Calculation */}
                <div className="p-4 rounded-2xl bg-black/70 border border-white/10 space-y-2 font-mono text-xs">
                  <div className="flex justify-between text-zinc-400">
                    <span>Subtotal:</span>
                    <span className="text-white font-bold">${subtotalUSD.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Account Mode:</span>
                    <span className="text-white font-bold">{isGuest ? "Guest" : "Member"}</span>
                  </div>
                  <div className="border-t border-white/10 pt-2 flex justify-between text-sm text-white font-bold">
                    <span>Total:</span>
                    <span>${subtotalUSD.toFixed(2)} {currency}</span>
                  </div>
                </div>

                {/* Checkout Submit */}
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-white hover:bg-zinc-200 text-black font-bold uppercase tracking-wider text-xs font-epic transition-all shadow-xl disabled:opacity-50"
                >
                  {loading ? "Processing Payment..." : "Complete Order ↗"}
                </button>
              </div>

              {/* Order Success Card */}
              {orderResult && (
                <div className="p-6 rounded-3xl bg-emerald-950/60 border border-emerald-800 text-xs font-mono space-y-2 text-emerald-200 shadow-2xl">
                  <h4 className="text-sm font-bold text-emerald-300">Order Confirmed!</h4>
                  <p>Order ID: {orderResult.order_id}</p>
                  <p>Total Charged: {orderResult.total} {orderResult.currency}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Automatic Incident Popup Modal */}
      {showIncidentModal && errorState && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-black/90 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border-2 border-red-500/80 backdrop-blur-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-red-400 font-bold font-epic text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                AUTOMATED INCIDENT DETECTOR
              </div>
              <button
                onClick={() => setShowIncidentModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-zinc-200">
              <p className="text-sm font-bold text-white">
                We detected an unhandled HTTP {errorState.status} anomaly on /checkout.
              </p>
              <div className="p-3 bg-red-950/60 rounded-xl border border-red-900 text-red-300 text-[11px]">
                {errorState.message}
              </div>
              <p className="text-zinc-400 text-[11px]">
                Would you like to report this incident to TrueForge SentinelOps? This will automatically spawn parallel subagents to investigate, sandbox, and remediate.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleReportIncident}
                disabled={reportingIncident}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-all font-epic disabled:opacity-50 text-center"
              >
                {reportingIncident ? "Spawning Agent..." : "Report Incident & Launch SentinelOps ↗"}
              </button>
              <button
                onClick={() => setShowIncidentModal(false)}
                className="px-4 py-3 bg-white/10 hover:bg-white/20 text-zinc-300 rounded-xl transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </Blurred404Background>
  );
}
