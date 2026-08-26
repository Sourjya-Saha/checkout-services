"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getStoredUser,
  getStoredToken,
  loginUser,
  signupUser,
  clearAuthSession,
  UserProfile,
} from "@/lib/auth";

interface OrderItem {
  id: string;
  sku: string;
  qty: number;
  price: number;
}

interface Order {
  id: string;
  user_id?: string | null;
  is_guest: boolean;
  currency: string;
  total: number;
  status: string;
  items: OrderItem[];
  created_at?: string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
};

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Guest Order Lookup
  const [lookupId, setLookupId] = useState<string>("");
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState<boolean>(false);

  // Auth Modal State
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState<string>("");
  const [authPassword, setAuthPassword] = useState<string>("");
  const [authName, setAuthName] = useState<string>("");
  const [authAddress, setAuthAddress] = useState<string>("");
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const apiBase = process.env.NEXT_PUBLIC_CHECKOUT_API_URL || "http://127.0.0.1:8000";

  const loadUserOrders = async (currentUserProfile: UserProfile | null) => {
    setLoading(true);
    const token = getStoredToken();
    try {
      const headers: Record<string, string> = {};
      let url = `${apiBase}/orders`;

      if (token && currentUserProfile) {
        headers["Authorization"] = `Bearer ${token}`;
        url = `${apiBase}/orders?user_id=${currentUserProfile.id}`;
      }

      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        // If user is logged in, filter strictly to user's orders
        if (currentUserProfile) {
          setOrders(data.filter((o: Order) => o.user_id === currentUserProfile.id));
        } else {
          // If guest, only show guest orders
          setOrders(data.filter((o: Order) => o.is_guest));
        }
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const stored = getStoredUser();
    setUser(stored);
    loadUserOrders(stored);

    const handleAuthChange = () => {
      const updated = getStoredUser();
      setUser(updated);
      loadUserOrders(updated);
    };
    window.addEventListener("sentinelops_auth_change", handleAuthChange);
    return () => window.removeEventListener("sentinelops_auth_change", handleAuthChange);
  }, [apiBase]);

  const handleLogout = () => {
    clearAuthSession();
    setUser(null);
    setOrders([]);
    setLoading(false);
  };

  const handleLookupOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const idClean = lookupId.trim();
    if (!idClean) return;

    setLookupLoading(true);
    setLookupError(null);
    try {
      const res = await fetch(`${apiBase}/orders/${idClean}`);
      if (res.ok) {
        const orderData = await res.json();
        setSelectedOrder(orderData);
      } else {
        setLookupError(`Order with ID "${idClean}" was not found.`);
      }
    } catch {
      setLookupError("Failed to look up order. Check backend connection.");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (authMode === "signup") {
        const res = await signupUser(authEmail, authPassword, authName, authAddress);
        if (!res.success) {
          setAuthError(res.error || "Registration failed.");
          return;
        }
        if (res.user) {
          setUser(res.user);
          loadUserOrders(res.user);
        }
      } else {
        const res = await loginUser(authEmail, authPassword);
        if (!res.success) {
          setAuthError(res.error || "Invalid credentials.");
          return;
        }
        if (res.user) {
          setUser(res.user);
          loadUserOrders(res.user);
        }
      }
      setShowAuthModal(false);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#292524] font-['Inter',sans-serif] relative overflow-hidden antialiased selection:bg-[#292524] selection:text-white">
      {/* ========================================================================= */}
      {/* ATMOSPHERIC GRADIENT ORBS */}
      {/* ========================================================================= */}
      <div className="absolute top-[-120px] left-[20%] w-[500px] h-[500px] rounded-full bg-[#a7e5d3]/35 blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-[350px] right-[10%] w-[450px] h-[450px] rounded-full bg-[#f4c5a8]/30 blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-100px] left-[15%] w-[520px] h-[520px] rounded-full bg-[#c8b8e0]/30 blur-[150px] pointer-events-none -z-10" />

      {/* ========================================================================= */}
      {/* TOP NAVIGATION */}
      {/* ========================================================================= */}
      <nav className="sticky top-0 z-40 bg-[#f5f5f5]/85 backdrop-blur-md border-b border-[#e7e5e4] h-16 px-6 sm:px-12 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            href="/checkout"
            className="text-lg font-['EB_Garamond',serif] font-normal tracking-[-0.02em] text-[#0c0a09] flex items-center gap-2 group"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#292524] inline-block transition-transform group-hover:scale-125" />
            <span className="font-['EB_Garamond',serif] text-xl text-[#0c0a09]">SentinelOps Store</span>
          </Link>
          <div className="flex items-center gap-6 text-sm text-[#777169]">
            <Link href="/checkout" className="hover:text-[#0c0a09] transition-colors">
              Store & Checkout
            </Link>
            <span className="text-[#0c0a09] font-medium">Orders</span>
          </div>
        </div>

        {/* User Account Controls with DP & Hover Dropdown */}
        <div className="flex items-center gap-4">
          {user ? (
            <div
              className="relative"
              onMouseEnter={() => setIsDropdownOpen(true)}
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              {/* User Avatar DP Pill */}
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#ffffff] border border-[#e7e5e4] hover:border-[#d6d3d1] transition-all shadow-xs"
              >
                <div className="w-7 h-7 rounded-full bg-[#292524] text-white flex items-center justify-center text-xs font-semibold">
                  {user.name
                    ? user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : "U"}
                </div>
                <span className="text-xs font-medium text-[#0c0a09] hidden sm:inline">
                  {user.name}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-3 h-3 text-[#777169] transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Hover Dropdown Popup */}
              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-56 bg-[#ffffff] rounded-2xl border border-[#e7e5e4] p-3 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2">
                  <div className="p-2 border-b border-[#f0efed] space-y-0.5">
                    <p className="text-xs font-semibold text-[#0c0a09]">{user.name}</p>
                    <p className="text-[11px] text-[#777169] truncate">{user.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-[#a7e5d3]/40 text-[#16a34a] text-[10px] font-semibold uppercase">
                      Verified Member
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <Link
                      href="/checkout"
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-[#0c0a09] hover:bg-[#f0efed] transition-colors block"
                    >
                      Store & Checkout →
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        handleLogout();
                        setIsDropdownOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-[#dc2626] hover:bg-[#dc2626]/10 transition-colors block font-medium"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setAuthMode("login");
                setShowAuthModal(true);
              }}
              className="px-4 py-1.5 rounded-full bg-[#292524] hover:bg-[#0c0a09] text-white text-xs font-medium transition-all shadow-xs"
            >
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* MAIN ORDERS CONTENT */}
      {/* ========================================================================= */}
      <main className="max-w-[1100px] mx-auto px-6 sm:px-10 py-12 sm:py-16 space-y-8">
        {/* Header */}
        <header className="text-center max-w-xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f0efed] text-[12px] font-semibold tracking-[0.96px] uppercase text-[#0c0a09]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#292524]" />
            {user ? "Your Order History" : "Guest & Customer Orders"}
          </div>
          <h1 className="text-4xl sm:text-5xl font-['EB_Garamond',serif] font-light tracking-[-0.03em] text-[#0c0a09]">
            Purchases & Invoices
          </h1>
          <p className="text-sm text-[#777169] leading-relaxed">
            {user
              ? `Displaying verified purchases recorded for ${user.name} (${user.email}).`
              : "Sign in to access your personal order history or search by order reference."}
          </p>
        </header>

        {/* Quick Order Lookup Bar for Guests */}
        {!user && (
          <div className="max-w-lg mx-auto bg-[#ffffff] rounded-2xl border border-[#e7e5e4] p-5 shadow-[0_4px_16px_rgba(0,0,0,0.04)] space-y-3">
            <span className="text-xs font-medium text-[#4e4e4e] block">
              Quick Order Lookup
            </span>
            <form onSubmit={handleLookupOrder} className="flex gap-2">
              <input
                type="text"
                value={lookupId}
                onChange={(e) => setLookupId(e.target.value)}
                placeholder="Enter Order UUID e.g. f47ac10b-..."
                className="flex-1 px-3.5 py-2 rounded-full bg-[#ffffff] border border-[#d6d3d1] text-xs text-[#0c0a09] font-mono focus:outline-none focus:border-[#0c0a09]"
              />
              <button
                type="submit"
                disabled={lookupLoading}
                className="px-5 py-2 rounded-full bg-[#292524] hover:bg-[#0c0a09] text-white text-xs font-medium transition-all shadow-xs disabled:opacity-50"
              >
                {lookupLoading ? "Searching..." : "Lookup"}
              </button>
            </form>
            {lookupError && (
              <p className="text-xs text-[#dc2626] font-medium">{lookupError}</p>
            )}
          </div>
        )}

        {/* Orders List / Empty State */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#292524]/20 border-t-[#292524] animate-spin mx-auto" />
            <p className="text-sm text-[#777169]">Retrieving order ledger...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-[#ffffff] rounded-2xl border border-[#e7e5e4] p-12 text-center max-w-lg mx-auto shadow-[0_4px_16px_rgba(0,0,0,0.04)] space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#f0efed] flex items-center justify-center text-sm font-semibold mx-auto text-[#777169]">
              0
            </div>
            <h2 className="text-2xl font-['EB_Garamond',serif] font-light text-[#0c0a09]">
              {user ? "No Orders Found For Your Account" : "No Orders to Display"}
            </h2>
            <p className="text-sm text-[#777169]">
              {user
                ? "You haven't placed any orders with this account yet. Complete a checkout to view itemized receipts here."
                : "Sign in with your email and password to load your personal orders, or complete a new purchase."}
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link
                href="/checkout"
                className="px-6 py-2.5 rounded-full bg-[#292524] hover:bg-[#0c0a09] text-white text-xs font-medium transition-all shadow-xs"
              >
                Go to Store & Checkout →
              </Link>
              {!user && (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setShowAuthModal(true);
                  }}
                  className="px-5 py-2.5 rounded-full bg-transparent border border-[#d6d3d1] text-[#0c0a09] text-xs font-medium hover:bg-[#f0efed] transition-all"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const symbol = CURRENCY_SYMBOLS[order.currency] || "$";
              return (
                <div
                  key={order.id}
                  className="bg-[#ffffff] rounded-2xl border border-[#e7e5e4] p-6 sm:p-7 shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all hover:border-[#d6d3d1] space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#f0efed] pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-[#0c0a09]">
                          Order #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#a7e5d3]/40 text-[#16a34a] text-[11px] font-semibold tracking-wider uppercase">
                          {order.status || "Completed"}
                        </span>
                      </div>
                      <p className="text-xs text-[#777169]">
                        Account: {order.is_guest ? "Guest Checkout" : "Verified Customer"} · Reference: {order.id}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="text-xl font-['EB_Garamond',serif] font-light text-[#0c0a09]">
                        {symbol}{order.total.toFixed(2)} {order.currency}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="text-xs text-[#292524] font-medium hover:underline inline-block mt-0.5 cursor-pointer"
                      >
                        View Full Invoice Receipt →
                      </button>
                    </div>
                  </div>

                  {/* Line Items */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-[#fafafa] border border-[#e7e5e4] text-xs flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium text-[#0c0a09] truncate max-w-[160px]">
                            {item.sku}
                          </p>
                          <p className="text-[11px] text-[#777169]">Qty: {item.qty}</p>
                        </div>
                        <span className="font-semibold text-[#0c0a09]">
                          {symbol}{(item.price * item.qty).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* INVOICE RECEIPT MODAL */}
      {/* ========================================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-[#0c0a09]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#ffffff] rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#e7e5e4]">
            <div className="flex items-center justify-between border-b border-[#e7e5e4] pb-4">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.96px] text-[#777169]">
                  Itemized Order Receipt
                </span>
                <h3 className="text-xl font-['EB_Garamond',serif] font-light text-[#0c0a09]">
                  Order #{selectedOrder.id.slice(0, 8).toUpperCase()}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-[#a8a29e] hover:text-[#0c0a09] text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="divide-y divide-[#f0efed] max-h-56 overflow-y-auto">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-medium text-[#0c0a09]">{item.sku}</p>
                      <p className="text-[#777169]">Quantity: {item.qty} × ${item.price.toFixed(2)}</p>
                    </div>
                    <span className="font-semibold text-[#0c0a09]">
                      ${(item.qty * item.price).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-[#fafafa] rounded-xl border border-[#e7e5e4] p-4 space-y-2 text-xs">
                <div className="flex justify-between text-[#777169]">
                  <span>Status:</span>
                  <span className="font-semibold text-[#16a34a] capitalize">{selectedOrder.status}</span>
                </div>
                <div className="flex justify-between text-[#777169]">
                  <span>Currency:</span>
                  <span className="text-[#0c0a09]">{selectedOrder.currency}</span>
                </div>
                <div className="border-t border-[#e7e5e4] pt-2 flex justify-between text-sm font-semibold text-[#0c0a09]">
                  <span>Total Amount Charged:</span>
                  <span>{CURRENCY_SYMBOLS[selectedOrder.currency] || "$"}{selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-full bg-[#292524] hover:bg-[#0c0a09] text-white text-xs font-medium transition-all"
              >
                Print Invoice
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2.5 rounded-full bg-transparent border border-[#d6d3d1] text-[#0c0a09] text-xs font-medium hover:bg-[#f0efed] transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AUTH MODAL */}
      {/* ========================================================================= */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-[#0c0a09]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#ffffff] rounded-2xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-[#e7e5e4] animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-[#e7e5e4] pb-3">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.96px] text-[#777169]">
                  {authMode === "login" ? "Account Access" : "Create Account"}
                </span>
                <h3 className="text-2xl font-['EB_Garamond',serif] font-light text-[#0c0a09]">
                  {authMode === "login" ? "Sign in to your account" : "Register customer account"}
                </h3>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-[#a8a29e] hover:text-[#0c0a09] text-sm p-1"
              >
                ✕
              </button>
            </div>

            {authError && (
              <div className="p-3 rounded-lg bg-[#dc2626]/10 border border-[#dc2626]/20 text-xs text-[#dc2626]">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3.5 text-xs">
              {authMode === "signup" && (
                <>
                  <div className="space-y-1">
                    <label className="block font-medium text-[#4e4e4e]">Full Name</label>
                    <input
                      type="text"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="Jane Doe"
                      required
                      className="w-full px-3 py-2 rounded-lg bg-[#ffffff] border border-[#d6d3d1] text-xs text-[#0c0a09] focus:outline-none focus:border-[#0c0a09]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-medium text-[#4e4e4e]">Default Delivery Address</label>
                    <input
                      type="text"
                      value={authAddress}
                      onChange={(e) => setAuthAddress(e.target.value)}
                      placeholder="500 Howard St, San Francisco, CA"
                      className="w-full px-3 py-2 rounded-lg bg-[#ffffff] border border-[#d6d3d1] text-xs text-[#0c0a09] focus:outline-none focus:border-[#0c0a09]"
                    />
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="block font-medium text-[#4e4e4e]">Email Address</label>
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="jane@company.com"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-[#ffffff] border border-[#d6d3d1] text-xs text-[#0c0a09] focus:outline-none focus:border-[#0c0a09]"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-medium text-[#4e4e4e]">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-3 pr-9 py-2 rounded-lg bg-[#ffffff] border border-[#d6d3d1] text-xs text-[#0c0a09] focus:outline-none focus:border-[#0c0a09]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#777169] hover:text-[#0c0a09] transition-colors p-1"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 rounded-full bg-[#292524] hover:bg-[#0c0a09] text-white text-xs font-medium transition-all shadow-xs disabled:opacity-50"
              >
                {authLoading
                  ? "Verifying..."
                  : authMode === "login"
                  ? "Sign In"
                  : "Create Account"}
              </button>

              <div className="text-center pt-1 text-[11px] text-[#777169]">
                {authMode === "login" ? (
                  <p>
                    Don&apos;t have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("signup");
                        setAuthError(null);
                      }}
                      className="text-[#0c0a09] font-semibold underline"
                    >
                      Sign Up
                    </button>
                  </p>
                ) : (
                  <p>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("login");
                        setAuthError(null);
                      }}
                      className="text-[#0c0a09] font-semibold underline"
                    >
                      Sign In
                    </button>
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-20 border-t border-[#e7e5e4] bg-[#f5f5f5] py-12 px-6 sm:px-12 text-sm text-[#777169]">
        <div className="max-w-[1100px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs">
          <div>
            <span className="font-['EB_Garamond',serif] text-sm text-[#0c0a09]">SentinelOps Store</span> · Autonomous Resilience Platform
          </div>
          <div className="flex items-center gap-6">
            <Link href="/checkout" className="hover:text-[#0c0a09] transition-colors">
              Checkout
            </Link>
            <Link href="/orders" className="hover:text-[#0c0a09] transition-colors">
              Orders
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
