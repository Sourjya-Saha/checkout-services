"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getStoredUser, clearAuthSession, UserProfile } from "@/lib/auth";

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

  const apiBase = process.env.NEXT_PUBLIC_CHECKOUT_API_URL || "http://127.0.0.1:8000";

  useEffect(() => {
    setUser(getStoredUser());

    const loadOrders = async () => {
      try {
        const res = await fetch(`${apiBase}/orders`);
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }
      } catch (err) {
        console.error("Failed to load orders:", err);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();

    const handleAuthChange = () => {
      setUser(getStoredUser());
    };
    window.addEventListener("sentinelops_auth_change", handleAuthChange);
    return () => window.removeEventListener("sentinelops_auth_change", handleAuthChange);
  }, [apiBase]);

  const handleLogout = () => {
    clearAuthSession();
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#292524] font-['Inter',sans-serif] relative overflow-hidden antialiased selection:bg-[#292524] selection:text-white">
      {/* ========================================================================= */}
      {/* ATMOSPHERIC GRADIENT ORBS (Design.md Signature) */}
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

        {/* User Account Controls */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#777169] hidden sm:inline">
                Signed in as <strong className="text-[#0c0a09]">{user.name}</strong>
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="px-3.5 py-1 rounded-full bg-[#ffffff] border border-[#d6d3d1] hover:bg-[#f0efed] text-xs text-[#0c0a09] font-medium transition-all"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/checkout"
              className="px-4 py-1.5 rounded-full bg-[#292524] hover:bg-[#0c0a09] text-white text-xs font-medium transition-all shadow-sm"
            >
              Sign In
            </Link>
          )}
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* MAIN ORDERS CONTENT */}
      {/* ========================================================================= */}
      <main className="max-w-[1100px] mx-auto px-6 sm:px-10 py-12 sm:py-16 space-y-10">
        {/* Header */}
        <header className="text-center max-w-xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f0efed] text-[12px] font-semibold tracking-[0.96px] uppercase text-[#0c0a09]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#292524]" />
            Order History & Receipts
          </div>
          <h1 className="text-4xl sm:text-5xl font-['EB_Garamond',serif] font-light tracking-[-0.03em] text-[#0c0a09]">
            Purchases & Invoices
          </h1>
          <p className="text-sm text-[#777169] leading-relaxed">
            Review past fulfillment orders, itemized invoice receipts, and delivery tracking.
          </p>
        </header>

        {/* Orders List / Empty State */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#292524]/20 border-t-[#292524] animate-spin mx-auto" />
            <p className="text-sm text-[#777169]">Loading purchase history...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-[#ffffff] rounded-2xl border border-[#e7e5e4] p-12 text-center max-w-lg mx-auto shadow-[0_4px_16px_rgba(0,0,0,0.04)] space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#f0efed] flex items-center justify-center text-sm font-semibold mx-auto text-[#777169]">
              0
            </div>
            <h2 className="text-2xl font-['EB_Garamond',serif] font-light text-[#0c0a09]">
              No Orders Placed Yet
            </h2>
            <p className="text-sm text-[#777169]">
              Your order ledger is currently empty. Complete your first checkout to view itemized receipts here.
            </p>
            <div className="pt-2">
              <Link
                href="/checkout"
                className="inline-block px-6 py-2.5 rounded-full bg-[#292524] hover:bg-[#0c0a09] text-white text-xs font-medium transition-all shadow-sm"
              >
                Go to Store & Checkout →
              </Link>
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
                        Type: {order.is_guest ? "Guest Checkout" : "Registered Member"} · Reference: {order.id}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="text-xl font-['EB_Garamond',serif] font-light text-[#0c0a09]">
                        {symbol}{order.total.toFixed(2)} {order.currency}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="text-xs text-[#292524] font-medium hover:underline inline-block mt-0.5"
                      >
                        View Full Invoice Receipt →
                      </button>
                    </div>
                  </div>

                  {/* Line Items Preview */}
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
              <div className="divide-y divide-[#f0efed]">
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
                  <span>Payment Currency:</span>
                  <span className="text-[#0c0a09]">{selectedOrder.currency}</span>
                </div>
                <div className="border-t border-[#e7e5e4] pt-2 flex justify-between text-sm font-semibold text-[#0c0a09]">
                  <span>Total Amount:</span>
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
              Order Ledger
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
