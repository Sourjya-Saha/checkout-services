"use client";

import { useState, useEffect } from "react";

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
  { sku: "SKU-SENTINEL-PRO", name: "SentinelOps Pro Enterprise", qty: 1, price: 99.0 },
  { sku: "SKU-CLOUD-CREDITS", name: "Incident Response Credits (500)", qty: 2, price: 25.0 },
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
        setOrdersList(data);
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
        status: 0,
        errorType: "ConnectionError",
        message: err.message || "Failed to communicate with FastAPI backend",
        detail: {
          hint: "Ensure FastAPI backend is running on " + apiBase,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="border-b border-slate-200 pb-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              SentinelOps Checkout Service
            </h1>
            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-600/10">
              Incident Demo Target
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            FastAPI &bull; Supabase &bull; Next.js &bull; Live Regression Demo
          </p>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-2">
          <button
            onClick={checkHealth}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Backend: {backendHealth ? "Online (8000)" : "Offline"}
          </button>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Database: {backendHealth?.database === "connected" ? "Supabase Connected" : "Local Store Active"}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 rounded-xl bg-slate-200/80 p-1 mb-8 max-w-md">
        <button
          onClick={() => setActiveTab("checkout")}
          className={`w-full rounded-lg py-2.5 text-sm font-semibold leading-5 transition-all ${
            activeTab === "checkout"
              ? "bg-white text-slate-900 shadow"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Checkout Page
        </button>
        <button
          onClick={() => {
            setActiveTab("orders");
            fetchOrders();
          }}
          className={`w-full rounded-lg py-2.5 text-sm font-semibold leading-5 transition-all ${
            activeTab === "orders"
              ? "bg-white text-slate-900 shadow"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Order History ({ordersList.length})
        </button>
      </div>

      {activeTab === "checkout" ? (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Left Column: Cart & Checkout Form */}
          <div className="md:col-span-2 space-y-6">
            {/* Cart Box */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center justify-between">
                <span>Cart Items</span>
                <span className="text-xs font-normal text-slate-500">{cartItems.length} items</span>
              </h2>
              <div className="divide-y divide-slate-100">
                {cartItems.map((item) => (
                  <div key={item.sku} className="py-4 flex justify-between items-center text-sm">
                    <div>
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">SKU: {item.sku}</p>
                      <p className="text-xs text-slate-500 mt-1">${item.price.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-slate-200 rounded-lg">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.sku, -1)}
                          className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 rounded-l-lg font-bold"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 font-semibold text-slate-800 text-xs">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.sku, 1)}
                          className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 rounded-r-lg font-bold"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-bold text-slate-900 min-w-[70px] text-right">
                        ${(item.qty * item.price).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 mt-4 pt-4 flex justify-between items-center">
                <span className="font-semibold text-slate-700">Subtotal (USD Base)</span>
                <span className="font-bold text-xl text-slate-900">${subtotalUSD.toFixed(2)}</span>
              </div>
            </div>

            {/* Options Form */}
            <form
              onSubmit={handleCheckout}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6"
            >
              <h2 className="text-lg font-bold text-slate-900">Checkout Settings</h2>

              {/* Currency Selector */}
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Select Currency
                </label>
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro (0.92x)</option>
                  <option value="GBP">GBP (£) - British Pound (0.79x)</option>
                </select>
              </div>

              {/* Identity Mode */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Customer Identity Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsGuest(false)}
                    className={`p-4 text-left rounded-xl border transition-all ${
                      !isGuest
                        ? "bg-slate-900 text-white border-slate-900 shadow-md"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="font-bold text-sm">Registered User</div>
                    <div className="text-xs opacity-75 mt-0.5">&bull; Loads profile &rarr; 200 OK</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsGuest(true)}
                    className={`p-4 text-left rounded-xl border transition-all ${
                      isGuest
                        ? "bg-red-600 text-white border-red-600 shadow-md"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="font-bold text-sm flex items-center gap-1.5">
                      Guest Checkout <span className="text-[10px] bg-red-800 px-1.5 py-0.5 rounded font-mono">TARGET BUG</span>
                    </div>
                    <div className="text-xs opacity-75 mt-0.5">&bull; Triggers TypeError 500</div>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || cartItems.length === 0}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-white shadow-md transition-all ${
                  loading
                    ? "bg-slate-400 cursor-not-allowed"
                    : isGuest
                    ? "bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-200"
                    : "bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200"
                }`}
              >
                {loading
                  ? "Processing Order..."
                  : isGuest
                  ? `Trigger Guest Checkout (${currency} ${CURRENCY_SYMBOLS[currency] || ""})`
                  : `Place Order as Registered User (${currency} ${CURRENCY_SYMBOLS[currency] || ""})`}
              </button>
            </form>
          </div>

          {/* Right Column: Real-Time Confirmation / Incident Details */}
          <div className="space-y-5">
            {/* Live Order Confirmation (200 OK) */}
            {orderResult && (
              <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-6 shadow-md text-emerald-950 animate-fadeIn">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">
                    ✓
                  </div>
                  <h3 className="font-bold text-base text-emerald-900">Order Confirmed (200 OK)</h3>
                </div>
                <p className="text-xs text-emerald-800 mb-4">
                  Registered user checkout succeeded without error.
                </p>
                <div className="bg-white p-3.5 rounded-xl border border-emerald-200 space-y-1.5 text-xs font-mono text-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Order ID:</span>
                    <span className="font-bold">{orderResult.order_id.slice(0, 13)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Billed:</span>
                    <span className="font-bold text-emerald-700">
                      {CURRENCY_SYMBOLS[orderResult.currency] || ""}
                      {orderResult.total} {orderResult.currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {orderResult.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Incident / Bug Display (500 Error) */}
            {errorState && (
              <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-6 shadow-lg text-red-950 animate-fadeIn">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-sm">
                    !
                  </div>
                  <h3 className="font-bold text-base text-red-900">
                    Incident Detected: HTTP {errorState.status || 500}
                  </h3>
                </div>

                <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-xl space-y-1">
                  <p className="text-xs font-bold text-red-900">
                    Exception: <span className="font-mono">{errorState.errorType}: {errorState.message}</span>
                  </p>
                  <p className="text-[11px] text-red-700">
                    <strong>File:</strong> <code>backend/app/payment_processor.py:32</code> in <code>_resolve_currency_symbol</code>
                  </p>
                </div>

                {/* Server Response Payload */}
                <div className="mt-3">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Live Server Error Payload:
                  </div>
                  <pre className="bg-slate-900 text-red-400 p-3 rounded-xl text-[11px] font-mono overflow-x-auto">
                    {JSON.stringify(errorState.detail, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Architecture Card */}
            <div className="bg-slate-100 p-5 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Incident Information
              </h4>
              <ul className="text-xs text-slate-600 space-y-1.5">
                <li>&bull; <strong>Registered User:</strong> Profile is loaded &rarr; succeeds (200 OK).</li>
                <li>&bull; <strong>Guest Checkout:</strong> Profile is <code>None</code> &rarr; accesses <code>currency_info["symbol"]</code> and throws <code>TypeError</code> (500 Error).</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        /* Orders History Tab */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Processed Orders ({ordersList.length})</h2>
            <button
              onClick={fetchOrders}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              Refresh Orders
            </button>
          </div>

          {ordersList.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No orders found yet. Place a new order on the Checkout tab!
            </div>
          ) : (
            <div className="space-y-4">
              {ordersList.map((ord) => (
                <div
                  key={ord.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all bg-slate-50/50"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div>
                      <span className="font-mono font-bold text-sm text-slate-900">{ord.id}</span>
                      <span
                        className={`ml-2 inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${
                          ord.is_guest
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {ord.is_guest ? "Guest" : "Registered User"}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-base text-slate-900">
                        {CURRENCY_SYMBOLS[ord.currency] || ""}
                        {ord.total.toFixed(2)} {ord.currency}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 border-t border-slate-200 pt-2 space-y-1">
                    {ord.items && ord.items.length > 0 ? (
                      ord.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>
                            {item.sku} &times; {item.qty}
                          </span>
                          <span>${(item.qty * item.price).toFixed(2)}</span>
                        </div>
                      ))
                    ) : (
                      <div>Items recorded in database</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
