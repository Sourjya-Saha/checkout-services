"use client";

import { useState } from "react";

interface CartItem {
  sku: string;
  name: string;
  qty: number;
  price: number;
}

const INITIAL_CART: CartItem[] = [
  { sku: "SKU-SENTINEL-PRO", name: "SentinelOps Pro License", qty: 1, price: 99.0 },
  { sku: "SKU-CLOUD-CREDITS", name: "Cloud Compute Pack (500 hrs)", qty: 2, price: 25.0 },
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
    message: string;
    detail?: any;
  } | null>(null);

  const subtotal = cartItems.reduce((acc, item) => acc + item.qty * item.price, 0);
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: "Internal server error" };
        }
        setErrorState({
          status: response.status,
          message: `HTTP ${response.status}: ${response.statusText || "Server Error"}`,
          detail: errorData,
        });
      } else {
        const data = await response.json();
        setOrderResult(data);
      }
    } catch (err: any) {
      setErrorState({
        status: 0,
        message: err.message || "Failed to connect to backend server",
        detail: "Is FastAPI running on " + apiBase + "?",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              SentinelOps Checkout Demo
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Target microservice for automated incident response & root-cause detection
            </p>
          </div>
          <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10">
            v1.1.0-guest-checkout
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Left Column: Order Summary */}
        <div className="md:col-span-2 space-y-6">
          {/* Cart Box */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Cart Summary</h2>
            <div className="divide-y divide-slate-100">
              {cartItems.map((item) => (
                <div key={item.sku} className="py-3 flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-400">SKU: {item.sku} &bull; Qty: {item.qty}</p>
                  </div>
                  <span className="font-medium text-slate-700">
                    ${(item.qty * item.price).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 mt-4 pt-4 flex justify-between items-center">
              <span className="font-semibold text-slate-800">Base Subtotal (USD)</span>
              <span className="font-bold text-lg text-slate-900">${subtotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Checkout Configuration Form */}
          <form onSubmit={handleCheckout} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
            <h2 className="text-lg font-semibold text-slate-900">Checkout Options</h2>

            {/* Currency Selector */}
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-slate-700 mb-1">
                Select Currency
              </label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
              </select>
            </div>

            {/* User Type Toggle */}
            <div className="pt-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Checkout Identity Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsGuest(false)}
                  className={`px-4 py-2.5 text-sm font-medium rounded-lg border transition-all ${
                    !isGuest
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="font-semibold">Logged-in User</div>
                  <div className="text-xs opacity-75">Uses user profile & prefs</div>
                </button>

                <button
                  type="button"
                  onClick={() => setIsGuest(true)}
                  className={`px-4 py-2.5 text-sm font-medium rounded-lg border transition-all ${
                    isGuest
                      ? "bg-red-600 text-white border-red-600 shadow-sm"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="font-semibold">Guest Checkout</div>
                  <div className="text-xs opacity-75">No user profile (Target Bug)</div>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                loading
                  ? "bg-slate-400 cursor-not-allowed"
                  : isGuest
                  ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                  : "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
              }`}
            >
              {loading
                ? "Processing Checkout..."
                : `Submit Order (${currency} ${CURRENCY_SYMBOLS[currency] || ""})`}
            </button>
          </form>
        </div>

        {/* Right Column: Status & Incident Result Display */}
        <div className="space-y-4">
          <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Current Mode
            </h3>
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isGuest ? "bg-red-500 animate-pulse" : "bg-emerald-500"
                }`}
              />
              <span className="text-sm font-semibold text-slate-800">
                {isGuest ? "Guest Checkout (Regression Active)" : "Logged-in User (Standard)"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {isGuest
                ? "Submitting will invoke the unhandled NoneType currency formatting exception in payment_processor.py."
                : "Submitting will process successfully with normal 200 OK."}
            </p>
          </div>

          {/* Success Result Card */}
          {orderResult && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-5 shadow-sm text-emerald-900">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <h4 className="font-bold text-base text-emerald-800">Order Confirmed (200 OK)</h4>
              </div>
              <div className="text-xs space-y-1 mt-3 bg-white p-3 rounded-lg border border-emerald-200 text-slate-800 font-mono">
                <p><strong>Order ID:</strong> {orderResult.order_id}</p>
                <p><strong>Total:</strong> {orderResult.total} {orderResult.currency}</p>
                <p><strong>Status:</strong> {orderResult.status}</p>
              </div>
            </div>
          )}

          {/* Incident / Error Result Card (Visible 500 error display) */}
          {errorState && (
            <div className="bg-red-50 border-2 border-red-500 rounded-xl p-5 shadow-md text-red-900 animate-fadeIn">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <h4 className="font-bold text-base text-red-700">Incident Detected: 500 Server Error</h4>
              </div>
              <p className="text-xs text-red-800 font-medium mb-3">
                {errorState.message}
              </p>
              <div className="bg-slate-900 text-red-400 p-3 rounded-lg text-xs font-mono overflow-x-auto">
                <div className="text-slate-400 mb-1 text-[11px]">// Backend Response</div>
                <pre>{JSON.stringify(errorState.detail, null, 2)}</pre>
              </div>
              <p className="text-[11px] text-red-700 mt-2">
                &bull; Target bug triggered: Unhandled <code>TypeError</code> in <code>calculate_total()</code> when <code>currency_info</code> is None for guest checkouts.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
