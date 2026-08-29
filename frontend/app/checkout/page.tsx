"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getStoredUser,
  getStoredToken,
  loginUser,
  signupUser,
  clearAuthSession,
  UserProfile,
} from "@/lib/auth";

// Types
interface CartItem {
  sku: string;
  name: string;
  category: string;
  qty: number;
  price: number;
}

interface PromoDiscount {
  code: string;
  rate: number;
  label: string;
}

const INITIAL_CART: CartItem[] = [
  {
    sku: "SKU-SENTINEL-PRO",
    name: "SentinelOps Autonomous SRE Engine",
    category: "Cloud Infrastructure / Production Guard",
    qty: 1,
    price: 99.0,
  },
  {
    sku: "SKU-DAYTONA-COMPUTE",
    name: "Daytona MicroVM Sandbox Compute",
    category: "1,000 Isolated Execution Hours",
    qty: 2,
    price: 25.0,
  },
  {
    sku: "SKU-SWARM-TELEMETRY",
    name: "PostgreSQL & Supabase Telemetry Bridge",
    category: "Real-time Distributed Event Stream",
    qty: 1,
    price: 49.0,
  },
];

const CURRENCY_CONFIG: Record<string, { symbol: string; rate: number; label: string }> = {
  USD: { symbol: "$", rate: 1.0, label: "USD ($)" },
  EUR: { symbol: "€", rate: 0.92, label: "EUR (€)" },
  GBP: { symbol: "£", rate: 0.79, label: "GBP (£)" },
};

const TAX_RATES: Record<string, { rate: number; label: string }> = {
  US_CA: { rate: 0.0825, label: "California (8.25%)" },
  US_NY: { rate: 0.08875, label: "New York (8.875%)" },
  EU_DE: { rate: 0.19, label: "Germany MwSt. (19.0%)" },
  EU_FR: { rate: 0.20, label: "France TVA (20.0%)" },
  STANDARD: { rate: 0.05, label: "International (5.0%)" },
};

const SHIPPING_TIERS = [
  { id: "STANDARD", name: "Standard Delivery", estimate: "3–5 business days", price: 5.99 },
  { id: "EXPRESS", name: "Express Courier", estimate: "1–2 business days", price: 14.99 },
  { id: "OVERNIGHT", name: "Priority Overnight Air", estimate: "Next business morning", price: 29.99 },
  { id: "UK_EXPRESS", name: "UK Express Shipping", estimate: "2–3 business days (UK & NI)", price: 19.99 },
];

const PACKAGING_OPTIONS = [
  { id: "STANDARD_BOX", name: "Standard Box", price: 0.0, note: "Included" },
  { id: "ECO_FRIENDLY", name: "Biodegradable Pack", price: 3.0, note: "+$3.00" },
  { id: "GIFT_WRAP", name: "Gift Wrap with Ribbon", price: 5.0, note: "+$5.00" },
];

const CARBON_INITIATIVES = [
  { id: "TREES", name: "Reforestation Planting", rate: 1.25 },
  { id: "OCEAN", name: "Marine Reclamation", rate: 2.5 },
  { id: "SOLAR", name: "Solar Grid Expansion", rate: 3.75 },
];

const PROMO_CODES: Record<string, PromoDiscount> = {
  SUMMER20: { code: "SUMMER20", rate: 0.2, label: "20% Summer Discount" },
  WELCOME10: { code: "WELCOME10", rate: 0.1, label: "10% Welcome Offer" },
  VIP50: { code: "VIP50", rate: 0.5, label: "50% VIP Executive Pass" },
};

export default function ProfessionalCheckoutPage() {
  const router = useRouter();

  // User Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
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

  // Cart & Commerce State
  const [cartItems, setCartItems] = useState<CartItem[]>(INITIAL_CART);
  const [currency, setCurrency] = useState<string>("USD");
  const [isGuest, setIsGuest] = useState<boolean>(true);
  const [promoCodeInput, setPromoCodeInput] = useState<string>("");
  const [appliedPromo, setAppliedPromo] = useState<PromoDiscount | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Fulfillment State
  const [shippingTier, setShippingTier] = useState<string>("STANDARD");
  const [packagingOption, setPackagingOption] = useState<string>("STANDARD_BOX");
  const [enableCarbonOffset, setEnableCarbonOffset] = useState<boolean>(false);
  const [carbonInitiative, setCarbonInitiative] = useState<string>("TREES");
  const [taxRegion, setTaxRegion] = useState<string>("US_CA");

  // Customer & Shipping Form State
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [streetAddress, setStreetAddress] = useState<string>("500 Howard Street, Suite 400");
  const [city, setCity] = useState<string>("San Francisco");
  const [postalCode, setPostalCode] = useState<string>("94105");

  // Payment Form State
  const [paymentMethod, setPaymentMethod] = useState<"card" | "express">("card");
  const [cardNumber, setCardNumber] = useState<string>("•••• •••• •••• 4242");
  const [cardExpiry, setCardExpiry] = useState<string>("12/28");
  const [cardCvc, setCardCvc] = useState<string>("888");

  // Network & Anomaly State
  const [loading, setLoading] = useState<boolean>(false);
  const [orderResult, setOrderResult] = useState<any | null>(null);
  const [errorState, setErrorState] = useState<any | null>(null);
  const [showIncidentModal, setShowIncidentModal] = useState<boolean>(false);
  const [reportingIncident, setReportingIncident] = useState<boolean>(false);

  const apiBase = process.env.NEXT_PUBLIC_CHECKOUT_API_URL || "http://127.0.0.1:8000";
  const currencyConfig = CURRENCY_CONFIG[currency] || { symbol: "$", rate: 1.0, label: "USD ($)" };

  // Load user profile on mount
  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setCurrentUser(user);
      setIsGuest(false);
      setCustomerEmail(user.email);
      setCustomerName(user.name);
      if (user.address) setStreetAddress(user.address);
    } else {
      setIsGuest(true);
      setCustomerName("");
      setCustomerEmail("");
    }
  }, []);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          setCurrentUser(res.user);
          setIsGuest(false);
          setCustomerEmail(res.user.email);
          setCustomerName(res.user.name);
          if (res.user.address) setStreetAddress(res.user.address);
        }
      } else {
        const res = await loginUser(authEmail, authPassword);
        if (!res.success) {
          setAuthError(res.error || "Invalid credentials.");
          return;
        }
        if (res.user) {
          setCurrentUser(res.user);
          setIsGuest(false);
          setCustomerEmail(res.user.email);
          setCustomerName(res.user.name);
          if (res.user.address) setStreetAddress(res.user.address);
        }
      }
      setShowAuthModal(false);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    setCurrentUser(null);
    setIsGuest(true);
    setCustomerName("");
    setCustomerEmail("");
    setIsDropdownOpen(false);
  };

  // Cart Quantities
  const updateQuantity = (sku: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.sku === sku) {
            const nextQty = Math.max(1, item.qty + delta);
            return { ...item, qty: nextQty };
          }
          return item;
        })
        .filter((item) => item.qty > 0)
    );
  };

  const removeItem = (sku: string) => {
    setCartItems((prev) => prev.filter((item) => item.sku !== sku));
  };

  // Pricing Calculations
  const rawSubtotalUSD = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.qty * item.price, 0);
  }, [cartItems]);

  const promoDiscountUSD = useMemo(() => {
    if (!appliedPromo) return 0;
    return rawSubtotalUSD * appliedPromo.rate;
  }, [rawSubtotalUSD, appliedPromo]);

  const discountedSubtotalUSD = Math.max(0, rawSubtotalUSD - promoDiscountUSD);

  const shippingFeeUSD = useMemo(() => {
    if (discountedSubtotalUSD >= 150.0 && shippingTier === "STANDARD") return 0.0;
    const selected = SHIPPING_TIERS.find((t) => t.id === shippingTier);
    return selected ? selected.price : 5.99;
  }, [discountedSubtotalUSD, shippingTier]);

  const packagingFeeUSD = useMemo(() => {
    const selected = PACKAGING_OPTIONS.find((p) => p.id === packagingOption);
    return selected ? selected.price : 0.0;
  }, [packagingOption]);

  const carbonFeeUSD = useMemo(() => {
    if (!enableCarbonOffset) return 0.0;
    const selected = CARBON_INITIATIVES.find((c) => c.id === carbonInitiative);
    return selected ? selected.rate : 0.0;
  }, [enableCarbonOffset, carbonInitiative]);

  const taxAmountUSD = useMemo(() => {
    const rateInfo = TAX_RATES[taxRegion] || { rate: 0.05 };
    return discountedSubtotalUSD * rateInfo.rate;
  }, [discountedSubtotalUSD, taxRegion]);

  const totalUSD = discountedSubtotalUSD + shippingFeeUSD + packagingFeeUSD + carbonFeeUSD + taxAmountUSD;
  const convertedTotal = (totalUSD * currencyConfig.rate).toFixed(2);

  // Apply Promo
  const handleApplyPromo = (codeToApply?: string) => {
    const code = (codeToApply || promoCodeInput).trim().toUpperCase();
    if (!code) return;
    if (PROMO_CODES[code]) {
      setAppliedPromo(PROMO_CODES[code]);
      setPromoError(null);
      setPromoCodeInput(code);
    } else {
      setAppliedPromo(null);
      setPromoError(`Coupon code "${code}" is invalid or expired.`);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCodeInput("");
    setPromoError(null);
  };

  // Submit Checkout
  const handleCheckout = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (cartItems.length === 0) return;

    setLoading(true);
    setOrderResult(null);
    setErrorState(null);
    setShowIncidentModal(false);

    const payload = {
      user_id: isGuest ? null : currentUser?.id || "usr_8fa93c20-7e1d-481b-9721-e019f2a938c4",
      cart_items: cartItems.map(({ sku, qty, price }) => ({ sku, qty, price })),
      currency: currency,
      is_guest: isGuest,
      promo_code: appliedPromo ? appliedPromo.code : null,
      shipping_tier: shippingTier,
      tax_region: taxRegion,
      packaging_type: packagingOption,
      offset_initiative: enableCarbonOffset ? carbonInitiative : null,
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
          errorType: responseData.type || "InternalServerError",
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
        traceback: ["Ensure the backend server is online on port 8000"],
      };
      setErrorState(errObj);
      setShowIncidentModal(true);
    } finally {
      setLoading(false);
    }
  };

  // Report Incident to SentinelOps
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

  // User Initials for Profile Avatar DP
  const userInitials = useMemo(() => {
    if (!currentUser?.name) return "U";
    return currentUser.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#292524] font-['Inter',sans-serif] relative overflow-hidden antialiased selection:bg-[#292524] selection:text-white">
      {/* ========================================================================= */}
      {/* ATMOSPHERIC GRADIENT ORBS (Design.md Signature) */}
      {/* ========================================================================= */}
      <div className="absolute top-[-100px] left-[15%] w-[520px] h-[520px] rounded-full bg-[#a7e5d3]/35 blur-[130px] pointer-events-none -z-10" />
      <div className="absolute top-[280px] right-[5%] w-[480px] h-[480px] rounded-full bg-[#f4c5a8]/30 blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-[100px] left-[10%] w-[560px] h-[560px] rounded-full bg-[#c8b8e0]/25 blur-[150px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-150px] right-[25%] w-[440px] h-[440px] rounded-full bg-[#a8c8e8]/25 blur-[130px] pointer-events-none -z-10" />

      {/* ========================================================================= */}
      {/* TOP NAVIGATION */}
      {/* ========================================================================= */}
      <nav className="animate-landing sticky top-0 z-40 bg-[#f5f5f5]/85 backdrop-blur-md border-b border-[#e7e5e4] h-16 px-6 sm:px-12 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="text-lg font-['EB_Garamond',serif] font-normal tracking-[-0.02em] text-[#0c0a09] flex items-center gap-2 group"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#292524] inline-block transition-transform group-hover:scale-125" />
            <span className="font-['EB_Garamond',serif] text-xl text-[#0c0a09]">SentinelOps Store</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-[#777169]">
            <span className="text-[#0c0a09] font-medium">Store & Checkout</span>
            <Link href="/orders" className="hover:text-[#0c0a09] transition-colors">
              Orders
            </Link>
          </div>
        </div>

        {/* User Account Controls with DP & Hover Dropdown */}
        <div className="flex items-center gap-4">
          {currentUser ? (
            <div ref={dropdownRef} className="relative">
              {/* User Avatar DP Pill */}
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#ffffff] border border-[#e7e5e4] hover:border-[#d6d3d1] transition-all shadow-xs cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-[#292524] text-white flex items-center justify-center text-xs font-semibold">
                  {userInitials}
                </div>
                <span className="text-xs font-medium text-[#0c0a09] hidden sm:inline">
                  {currentUser.name}
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
                    <p className="text-xs font-semibold text-[#0c0a09]">{currentUser.name}</p>
                    <p className="text-[11px] text-[#777169] truncate">{currentUser.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-[#a7e5d3]/40 text-[#16a34a] text-[10px] font-semibold uppercase">
                      Member
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <Link
                      href="/orders"
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-[#0c0a09] hover:bg-[#f0efed] transition-colors block"
                    >
                      View Order History →
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
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
      {/* MAIN CHECKOUT BODY */}
      {/* ========================================================================= */}
      <main className="animate-landing-stagger-1 max-w-[1240px] mx-auto px-6 sm:px-10 py-12 sm:py-16">
        {/* Editorial Header */}
        <header className="mb-12 text-center max-w-2xl mx-auto space-y-3">
        
          <h1 className="text-4xl sm:text-5xl font-['EB_Garamond',serif] font-light tracking-[-0.03em] text-[#0c0a09] leading-[1.1]">
            Review & Complete Your Order
          </h1>
          <p className="text-sm sm:text-base text-[#777169] font-normal leading-relaxed">
            Enter your destination, select fulfillment options, and review your cart.
          </p>
        </header>

        {/* Order Confirmed State */}
        {orderResult ? (
          <div className="max-w-2xl mx-auto bg-[#ffffff] rounded-2xl border border-[#e7e5e4] p-8 sm:p-12 shadow-[0_4px_16px_rgba(0,0,0,0.04)] text-center space-y-6">
            <div className="w-14 h-14 rounded-full bg-[#a7e5d3]/40 text-[#16a34a] text-xl font-bold flex items-center justify-center mx-auto">
              ✓
            </div>
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.96px] text-[#16a34a]">
                Payment Authorized
              </span>
              <h2 className="text-3xl font-['EB_Garamond',serif] font-light text-[#0c0a09]">
                Thank you for your purchase
              </h2>
              <p className="text-xs text-[#777169]">
                Your invoice receipt and order confirmation have been recorded.
              </p>
            </div>

            <div className="bg-[#fafafa] rounded-xl border border-[#e7e5e4] p-6 text-left space-y-3 text-xs">
              <div className="flex justify-between text-[#777169]">
                <span>Order Reference:</span>
                <span className="font-mono text-[#0c0a09] font-medium">{orderResult.order_id}</span>
              </div>
              <div className="flex justify-between text-[#777169]">
                <span>Total Amount Charged:</span>
                <span className="font-semibold text-[#0c0a09]">
                  {currencyConfig.symbol}
                  {orderResult.total} {orderResult.currency}
                </span>
              </div>
              <div className="flex justify-between text-[#777169]">
                <span>Account Mode:</span>
                <span className="text-[#0c0a09] capitalize">{isGuest ? "Guest Checkout" : "Registered Member"}</span>
              </div>
              <div className="flex justify-between text-[#777169]">
                <span>Fulfillment Status:</span>
                <span className="text-[#16a34a] font-medium">Processing & Confirmed</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setOrderResult(null);
                  setCartItems(INITIAL_CART);
                }}
                className="px-6 py-2.5 rounded-full bg-[#292524] text-white text-xs font-medium hover:bg-[#0c0a09] transition-all shadow-xs"
              >
                Place Another Order
              </button>
              <Link
                href="/orders"
                className="px-6 py-2.5 rounded-full bg-transparent border border-[#d6d3d1] text-[#0c0a09] text-xs font-medium hover:bg-[#f0efed] transition-all text-center"
              >
                View in Orders Ledger →
              </Link>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* TWO-COLUMN BALANCED CHECKOUT LAYOUT */
          /* ========================================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* ========================================================================= */}
            {/* LEFT COLUMN: Customer Account -> Shipping & Logistics -> Packaging */}
            {/* ========================================================================= */}
            <div className="lg:col-span-6 space-y-6">
              {/* Card 1: Customer Account Details */}
              <section className="bg-[#ffffff] rounded-2xl border border-[#e7e5e4] p-6 sm:p-7 shadow-[0_4px_16px_rgba(0,0,0,0.04)] space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e7e5e4] pb-4">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.96px] text-[#777169]">
                      01 / Account
                    </span>
                    <h2 className="text-xl font-['EB_Garamond',serif] font-light text-[#0c0a09]">
                      {currentUser ? "Customer Profile" : "Checkout Mode"}
                    </h2>
                  </div>

                  {/* Authenticated vs Guest Presentation */}
                  {currentUser ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#a7e5d3]/30 text-[#16a34a] text-xs font-medium border border-[#a7e5d3]">
                      
                      <span>Member</span>
                    </div>
                  ) : (
                    <div className="inline-flex rounded-full bg-[#f0efed] p-1 border border-[#e7e5e4]">
                      <button
                        type="button"
                        onClick={() => setIsGuest(true)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                          isGuest ? "bg-[#292524] text-white shadow-xs" : "text-[#777169] hover:text-[#0c0a09]"
                        }`}
                      >
                        Guest Checkout
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode("login");
                          setShowAuthModal(true);
                        }}
                        className="px-3.5 py-1.5 rounded-full text-xs font-medium text-[#777169] hover:text-[#0c0a09] transition-all"
                      >
                        Sign In / Register
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-[#4e4e4e]">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-[#ffffff] border border-[#d6d3d1] text-sm text-[#0c0a09] placeholder-[#a8a29e] focus:outline-none focus:border-[#0c0a09] transition-all"
                      placeholder="e.g. Jane Doe"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-[#4e4e4e]">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-[#ffffff] border border-[#d6d3d1] text-sm text-[#0c0a09] placeholder-[#a8a29e] focus:outline-none focus:border-[#0c0a09] transition-all"
                      placeholder="e.g. jane@company.com"
                    />
                  </div>
                </div>

                {!currentUser && (
                  <p className="text-[11px] text-[#777169]">
                    Checking out as guest. If you already have an account,{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("login");
                        setShowAuthModal(true);
                      }}
                      className="text-[#0c0a09] font-medium underline"
                    >
                      sign in here
                    </button>{" "}
                    to save to your order history.
                  </p>
                )}
              </section>

              {/* Card 2: Shipping Destination & Delivery Speed WITH Currency Selector */}
              <section className="bg-[#ffffff] rounded-2xl border border-[#e7e5e4] p-6 sm:p-7 shadow-[0_4px_16px_rgba(0,0,0,0.04)] space-y-5">
                <div className="border-b border-[#e7e5e4] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.96px] text-[#777169]">
                      02 / Shipping & Currency
                    </span>
                    <h2 className="text-xl font-['EB_Garamond',serif] font-light text-[#0c0a09]">
                      Logistics & Currency
                    </h2>
                  </div>

                  {/* Currency Selector moved cleanly inside Shipment & Logistics Card */}
                  <div className="flex items-center bg-[#f0efed] border border-[#e7e5e4] rounded-full p-0.5 shadow-xs self-start sm:self-auto">
                    {["USD", "EUR", "GBP"].map((curr) => (
                      <button
                        key={curr}
                        type="button"
                        onClick={() => setCurrency(curr)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                          currency === curr
                            ? "bg-[#292524] text-white shadow-xs"
                            : "text-[#777169] hover:text-[#0c0a09]"
                        }`}
                      >
                        {CURRENCY_CONFIG[curr].label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-[#4e4e4e]">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-[#ffffff] border border-[#d6d3d1] text-sm text-[#0c0a09] placeholder-[#a8a29e] focus:outline-none focus:border-[#0c0a09] transition-all"
                      placeholder="100 Innovation Boulevard"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-medium text-[#4e4e4e]">
                        City
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg bg-[#ffffff] border border-[#d6d3d1] text-sm text-[#0c0a09] focus:outline-none focus:border-[#0c0a09] transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-medium text-[#4e4e4e]">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg bg-[#ffffff] border border-[#d6d3d1] text-sm text-[#0c0a09] focus:outline-none focus:border-[#0c0a09] transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-medium text-[#4e4e4e]">
                        Tax Region
                      </label>
                      <select
                        value={taxRegion}
                        onChange={(e) => setTaxRegion(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg bg-[#ffffff] border border-[#d6d3d1] text-sm text-[#0c0a09] focus:outline-none focus:border-[#0c0a09] transition-all"
                      >
                        <option value="US_CA">US (California — 8.25%)</option>
                        <option value="US_NY">US (New York — 8.875%)</option>
                        <option value="EU_DE">Germany (MwSt. — 19%)</option>
                        <option value="EU_FR">France (TVA — 20%)</option>
                        <option value="STANDARD">International (5%)</option>
                      </select>
                    </div>
                  </div>

                  {/* Shipping Speeds */}
                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between items-center">
                      <label className="block text-[13px] font-medium text-[#4e4e4e]">
                        Fulfillment Speed
                      </label>
                      {discountedSubtotalUSD >= 150.0 && (
                        <span className="text-[11px] font-semibold text-[#16a34a] uppercase">
                          Free Standard Shipping Qualified
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {SHIPPING_TIERS.map((tier) => {
                        const isFree = tier.id === "STANDARD" && discountedSubtotalUSD >= 150.0;
                        const priceFormatted = isFree
                          ? "FREE"
                          : `${currencyConfig.symbol}${(tier.price * currencyConfig.rate).toFixed(2)}`;
                        const isSelected = shippingTier === tier.id;

                        return (
                          <button
                            key={tier.id}
                            type="button"
                            onClick={() => setShippingTier(tier.id)}
                            className={`p-3 rounded-xl text-left border transition-all text-xs ${
                              isSelected
                                ? "border-[#292524] bg-[#fafafa] shadow-xs"
                                : "border-[#e7e5e4] bg-[#ffffff] hover:border-[#d6d3d1]"
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-medium text-[#0c0a09]">{tier.name}</span>
                              <span className={`font-semibold ${isFree ? "text-[#16a34a]" : "text-[#0c0a09]"}`}>
                                {priceFormatted}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#777169]">{tier.estimate}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>

              {/* Card 3: Packaging & Carbon Offset (FULL WIDTH below shipping card) */}
              <section className="bg-[#ffffff] rounded-2xl border border-[#e7e5e4] p-6 sm:p-7 shadow-[0_4px_16px_rgba(0,0,0,0.04)] space-y-5">
                <div className="border-b border-[#e7e5e4] pb-4">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.96px] text-[#777169]">
                    03 / Presentation & Sustainability
                  </span>
                  <h2 className="text-xl font-['EB_Garamond',serif] font-light text-[#0c0a09]">
                    Packaging & Carbon Offset
                  </h2>
                </div>

                <div className="space-y-4">
                  {/* Packaging Options */}
                  <div className="space-y-2">
                    <label className="block text-[13px] font-medium text-[#4e4e4e]">
                      Order Packaging Presentation
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {PACKAGING_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setPackagingOption(opt.id)}
                          className={`p-3 rounded-xl text-left border transition-all text-xs ${
                            packagingOption === opt.id
                              ? "border-[#292524] bg-[#fafafa] text-[#0c0a09] shadow-xs"
                              : "border-[#e7e5e4] bg-[#ffffff] text-[#777169] hover:border-[#d6d3d1]"
                          }`}
                        >
                          <div className="font-medium text-[#0c0a09]">{opt.name}</div>
                          <div className="text-[11px] text-[#777169] mt-0.5">{opt.note}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Carbon Offset Checkbox */}
                  <div className="p-4 rounded-xl bg-[#fafafa] border border-[#e7e5e4] space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableCarbonOffset}
                        onChange={(e) => setEnableCarbonOffset(e.target.checked)}
                        className="accent-[#292524] w-4 h-4 mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-medium text-[#0c0a09]">
                          Carbon-Neutral Delivery Contribution
                        </p>
                        <p className="text-xs text-[#777169]">
                          Offset 100% of transit emissions through certified environmental initiatives.
                        </p>
                      </div>
                    </label>

                    {enableCarbonOffset && (
                      <div className="pt-2 pl-7 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {CARBON_INITIATIVES.map((init) => (
                          <button
                            key={init.id}
                            type="button"
                            onClick={() => setCarbonInitiative(init.id)}
                            className={`p-2.5 rounded-lg text-left text-xs border transition-all ${
                              carbonInitiative === init.id
                                ? "border-[#292524] bg-[#ffffff] font-medium text-[#0c0a09]"
                                : "border-[#e7e5e4] bg-[#ffffff] text-[#777169]"
                            }`}
                          >
                            <div className="font-medium text-[#0c0a09] truncate">{init.name}</div>
                            <div className="text-[11px] text-[#292524] font-semibold mt-0.5">
                              +{currencyConfig.symbol}{(init.rate * currencyConfig.rate).toFixed(2)}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>

            {/* ========================================================================= */}
            {/* RIGHT COLUMN: Cart Summary & Breakdown -> Payment Method & Complete CTA */}
            {/* ========================================================================= */}
            <div className="lg:col-span-6 space-y-6">
              {/* Card 4: Order Cart & Cost Breakdown */}
              <div className="bg-[#ffffff] rounded-2xl border border-[#e7e5e4] p-6 sm:p-7 shadow-[0_4px_16px_rgba(0,0,0,0.04)] space-y-5">
                <div className="flex items-center justify-between border-b border-[#e7e5e4] pb-4">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.96px] text-[#777169]">
                      Summary
                    </span>
                    <h2 className="text-xl font-['EB_Garamond',serif] font-light text-[#0c0a09]">
                      Order Cart ({cartItems.reduce((acc, i) => acc + i.qty, 0)})
                    </h2>
                  </div>
                  <span className="text-xs text-[#777169] font-mono">
                    Currency: {currency}
                  </span>
                </div>

                {/* Items List */}
                <div className="divide-y divide-[#f0efed] max-h-60 overflow-y-auto pr-1">
                  {cartItems.map((item) => (
                    <div key={item.sku} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-[13px] font-medium text-[#0c0a09] leading-snug">
                          {item.name}
                        </h3>
                        <p className="text-[11px] text-[#777169]">{item.category}</p>
                        <p className="text-xs font-semibold text-[#292524] mt-0.5">
                          {currencyConfig.symbol}
                          {(item.price * currencyConfig.rate).toFixed(2)}
                        </p>
                      </div>

                      {/* Quantity Control */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div className="flex items-center rounded-full bg-[#f0efed] border border-[#e7e5e4] p-0.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.sku, -1)}
                            className="w-5 h-5 rounded-full bg-white hover:bg-[#e7e5e4] text-[#0c0a09] flex items-center justify-center text-xs font-semibold shadow-xs"
                          >
                            -
                          </button>
                          <span className="w-5 text-center text-xs font-medium text-[#0c0a09]">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.sku, 1)}
                            className="w-5 h-5 rounded-full bg-white hover:bg-[#e7e5e4] text-[#0c0a09] flex items-center justify-center text-xs font-semibold shadow-xs"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.sku)}
                          className="text-[#a8a29e] hover:text-[#dc2626] text-xs p-1"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Promo Code Input */}
                <div className="space-y-2 pt-2 border-t border-[#e7e5e4]">
                  <label className="block text-xs font-medium text-[#4e4e4e]">
                    Promotional Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value)}
                      placeholder="e.g. SUMMER20"
                      className="flex-1 px-4 py-2 rounded-full bg-[#ffffff] border border-[#d6d3d1] text-xs text-[#0c0a09] uppercase placeholder-[#a8a29e] focus:outline-none focus:border-[#0c0a09] transition-all font-mono"
                    />
                    {appliedPromo ? (
                      <button
                        type="button"
                        onClick={handleRemovePromo}
                        className="px-4 py-2 rounded-full bg-[#f0efed] hover:bg-[#e7e5e4] text-[#dc2626] text-xs font-medium transition-all"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleApplyPromo()}
                        className="px-5 py-2 rounded-full bg-[#292524] hover:bg-[#0c0a09] text-white text-xs font-medium transition-all"
                      >
                        Apply
                      </button>
                    )}
                  </div>

                  {appliedPromo && (
                    <div className="text-xs text-[#16a34a] font-medium">
                      Applied {appliedPromo.label} (-{(appliedPromo.rate * 100)}%)
                    </div>
                  )}

                  {promoError && (
                    <p className="text-xs text-[#dc2626] font-medium">{promoError}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-[#777169]">Available codes:</span>
                    {Object.keys(PROMO_CODES).map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => handleApplyPromo(code)}
                        className="px-2.5 py-0.5 rounded-full bg-[#f0efed] hover:bg-[#e7e5e4] text-[11px] font-mono text-[#0c0a09] transition-all"
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="bg-[#fafafa] rounded-xl border border-[#e7e5e4] p-4 space-y-2 text-xs">
                  <div className="flex justify-between text-[#777169]">
                    <span>Cart Subtotal</span>
                    <span className="font-medium text-[#0c0a09]">
                      {currencyConfig.symbol}
                      {(rawSubtotalUSD * currencyConfig.rate).toFixed(2)}
                    </span>
                  </div>

                  {appliedPromo && (
                    <div className="flex justify-between text-[#16a34a]">
                      <span>Discount ({appliedPromo.code})</span>
                      <span>
                        -{currencyConfig.symbol}
                        {(promoDiscountUSD * currencyConfig.rate).toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-[#777169]">
                    <span>Shipping & Logistics</span>
                    <span className={`font-medium ${shippingFeeUSD === 0 ? "text-[#16a34a]" : "text-[#0c0a09]"}`}>
                      {shippingFeeUSD === 0
                        ? "FREE"
                        : `${currencyConfig.symbol}${(shippingFeeUSD * currencyConfig.rate).toFixed(2)}`}
                    </span>
                  </div>

                  {packagingFeeUSD > 0 && (
                    <div className="flex justify-between text-[#777169]">
                      <span>Packaging Presentation</span>
                      <span className="font-medium text-[#0c0a09]">
                        +{currencyConfig.symbol}
                        {(packagingFeeUSD * currencyConfig.rate).toFixed(2)}
                      </span>
                    </div>
                  )}

                  {carbonFeeUSD > 0 && (
                    <div className="flex justify-between text-[#16a34a]">
                      <span>Carbon Offset</span>
                      <span>
                        +{currencyConfig.symbol}
                        {(carbonFeeUSD * currencyConfig.rate).toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-[#777169]">
                    <span>Estimated Regional Tax</span>
                    <span className="font-medium text-[#0c0a09]">
                      {currencyConfig.symbol}
                      {(taxAmountUSD * currencyConfig.rate).toFixed(2)}
                    </span>
                  </div>

                  <div className="border-t border-[#e7e5e4] pt-2.5 flex items-baseline justify-between">
                    <div>
                      <span className="text-sm font-semibold text-[#0c0a09]">Order Total</span>
                      <p className="text-[10px] text-[#777169]">All duties & taxes included</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-['EB_Garamond',serif] font-light text-[#0c0a09] tracking-tight">
                        {currencyConfig.symbol}{convertedTotal}
                      </span>
                      <span className="text-xs font-mono text-[#777169] ml-1">{currency}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 5: Payment Authorization & Complete Order */}
              <section className="bg-[#ffffff] rounded-2xl border border-[#e7e5e4] p-6 sm:p-7 shadow-[0_4px_16px_rgba(0,0,0,0.04)] space-y-5">
                <div className="border-b border-[#e7e5e4] pb-4">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.96px] text-[#777169]">
                    04 / Payment Method
                  </span>
                  <h2 className="text-xl font-['EB_Garamond',serif] font-light text-[#0c0a09]">
                    Payment Authorization
                  </h2>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("card")}
                      className={`py-2 px-3 rounded-lg border text-center text-xs font-medium transition-all ${
                        paymentMethod === "card"
                          ? "border-[#292524] bg-[#fafafa] text-[#0c0a09] shadow-xs"
                          : "border-[#e7e5e4] text-[#777169] hover:border-[#d6d3d1]"
                      }`}
                    >
                      Credit / Debit Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("express")}
                      className={`py-2 px-3 rounded-lg border text-center text-xs font-medium transition-all ${
                        paymentMethod === "express"
                          ? "border-[#292524] bg-[#fafafa] text-[#0c0a09] shadow-xs"
                          : "border-[#e7e5e4] text-[#777169] hover:border-[#d6d3d1]"
                      }`}
                    >
                      Express Pay
                    </button>
                  </div>

                  {paymentMethod === "card" ? (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-[#4e4e4e]">
                          Card Number
                        </label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-lg bg-[#ffffff] border border-[#d6d3d1] text-xs text-[#0c0a09] focus:outline-none focus:border-[#0c0a09] transition-all font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[11px] font-medium text-[#4e4e4e]">
                            Expires
                          </label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-lg bg-[#ffffff] border border-[#d6d3d1] text-xs text-[#0c0a09] focus:outline-none focus:border-[#0c0a09] transition-all font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[11px] font-medium text-[#4e4e4e]">
                            CVC
                          </label>
                          <input
                            type="text"
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-lg bg-[#ffffff] border border-[#d6d3d1] text-xs text-[#0c0a09] focus:outline-none focus:border-[#0c0a09] transition-all font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-[#fafafa] border border-[#e7e5e4] text-center space-y-1.5">
                      <p className="text-xs text-[#0c0a09] font-medium">
                        Biometric Express Pay Ready
                      </p>
                      <p className="text-[11px] text-[#777169]">
                        Clicking Complete Order will authorize payment via device passkey.
                      </p>
                    </div>
                  )}

                  {/* Primary Complete Order CTA */}
                  <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={loading || cartItems.length === 0}
                    className="w-full h-12 rounded-full bg-[#292524] hover:bg-[#0c0a09] text-white text-[14px] font-medium transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        <span>Authorizing Payment...</span>
                      </>
                    ) : (
                      <>
                        <span>Complete Order & Authorize</span>
                        <span className="font-['EB_Garamond',serif] text-base font-normal">
                          ({currencyConfig.symbol}{convertedTotal})
                        </span>
                        <span>→</span>
                      </>
                    )}
                  </button>
                </div>
              </section>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* AUTHENTICATION MODAL (Login & Signup Dialog) */}
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

      {/* ========================================================================= */}
      {/* SENTINELOPS INCIDENT NOTIFICATION MODAL */}
      {/* ========================================================================= */}
      {showIncidentModal && errorState && (
        <div className="fixed inset-0 bg-[#0c0a09]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#ffffff] rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#e7e5e4] animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-[#e7e5e4] pb-4">
              <div className="flex items-center gap-2 text-[#dc2626] font-semibold text-xs uppercase tracking-[0.96px]">
                <span className="w-2 h-2 rounded-full bg-[#dc2626] animate-pulse" />
                Service Exception Captured
              </div>
              <button
                onClick={() => setShowIncidentModal(false)}
                className="text-[#a8a29e] hover:text-[#0c0a09] transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <h3 className="text-2xl font-['EB_Garamond',serif] font-light text-[#0c0a09]">
                500 Internal Server Error
              </h3>
              <p className="text-[#777169] text-xs leading-relaxed">
                An unhandled runtime error occurred on /checkout.
              </p>

              <div className="p-3.5 rounded-xl bg-[#fafafa] border border-[#e7e5e4] space-y-1 font-mono text-xs">
                <div className="text-[#dc2626] font-semibold">
                  {errorState.errorType}: {errorState.message}
                </div>
                <div className="text-[11px] text-[#777169] truncate">
                  Endpoint: /checkout · Status: {errorState.status}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleReportIncident}
                disabled={reportingIncident}
                className="flex-1 py-2.5 px-5 rounded-full bg-[#292524] hover:bg-[#0c0a09] text-white text-xs font-medium transition-all shadow-xs text-center disabled:opacity-50"
              >
                {reportingIncident ? "Spawning Swarm..." : "Launch SentinelOps Swarm ↗"}
              </button>
              <button
                onClick={() => setShowIncidentModal(false)}
                className="py-2.5 px-5 rounded-full bg-transparent border border-[#d6d3d1] text-[#0c0a09] text-xs font-medium hover:bg-[#f0efed] transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-20 border-t border-[#e7e5e4] bg-[#f5f5f5] py-12 px-6 sm:px-12 text-sm text-[#777169]">
        <div className="max-w-[1240px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs">
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
