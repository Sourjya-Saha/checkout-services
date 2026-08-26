"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Types
interface CartItem {
  sku: string;
  name: string;
  category: string;
  qty: number;
  price: number;
  image: string;
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
    image: "⚡",
  },
  {
    sku: "SKU-DAYTONA-COMPUTE",
    name: "Daytona MicroVM Sandbox Compute",
    category: "1,000 Isolated Execution Hours",
    qty: 2,
    price: 25.0,
    image: "☁️",
  },
  {
    sku: "SKU-SWARM-TELEMETRY",
    name: "PostgreSQL & Supabase Telemetry Bridge",
    category: "Real-time Distributed Event Stream",
    qty: 1,
    price: 49.0,
    image: "📡",
  },
];

const CURRENCY_CONFIG: Record<string, { symbol: string; rate: number }> = {
  USD: { symbol: "$", rate: 1.0 },
  EUR: { symbol: "€", rate: 0.92 },
  GBP: { symbol: "£", rate: 0.79 },
};

const TAX_RATES: Record<string, { rate: number; label: string }> = {
  US_CA: { rate: 0.0825, label: "California State & Local Tax (8.25%)" },
  US_NY: { rate: 0.08875, label: "New York State & City Sales Tax (8.875%)" },
  EU_DE: { rate: 0.19, label: "German MwSt. / VAT (19.0%)" },
  EU_FR: { rate: 0.20, label: "French TVA (20.0%)" },
  STANDARD: { rate: 0.05, label: "Standard Regional Tax (5.0%)" },
};

const SHIPPING_TIERS = [
  { id: "STANDARD", name: "Standard Delivery", estimate: "3–5 business days", price: 5.99 },
  { id: "EXPRESS", name: "Express Courier", estimate: "1–2 business days", price: 14.99 },
  { id: "OVERNIGHT", name: "Priority Overnight Air", estimate: "Next business morning", price: 29.99 },
];

const PACKAGING_OPTIONS = [
  { id: "STANDARD_BOX", name: "Standard Recycled Box", price: 0.0, note: "Included" },
  { id: "ECO_FRIENDLY", name: "100% Biodegradable Eco-Pack", price: 3.0, note: "+$3.00" },
  { id: "GIFT_WRAP", name: "Editorial Gift Wrap with Silk Ribbon", price: 5.0, note: "+$5.00" },
];

const CARBON_INITIATIVES = [
  { id: "TREES", name: "Reforestation & Canopy Planting", rate: 1.25 },
  { id: "OCEAN", name: "Marine Plastic & Ocean Reclamation", rate: 2.5 },
  { id: "SOLAR", name: "Clean Solar Grid Expansion", rate: 3.75 },
];

const PROMO_CODES: Record<string, PromoDiscount> = {
  SUMMER20: { code: "SUMMER20", rate: 0.2, label: "20% Summer Discount" },
  WELCOME10: { code: "WELCOME10", rate: 0.1, label: "10% Welcome Offer" },
  VIP50: { code: "VIP50", rate: 0.5, label: "50% VIP Executive Pass" },
};

export default function EditorialCheckoutPage() {
  const router = useRouter();

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
  const [customerEmail, setCustomerEmail] = useState<string>("guest.developer@sentinelops.io");
  const [customerName, setCustomerName] = useState<string>("Guest Engineer");
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
  const currencyConfig = CURRENCY_CONFIG[currency] || { symbol: "$", rate: 1.0 };

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
    // Free shipping on orders >= $150
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
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    setLoading(true);
    setOrderResult(null);
    setErrorState(null);
    setShowIncidentModal(false);

    const payload = {
      user_id: isGuest ? null : "usr_8fa93c20-7e1d-481b-9721-e019f2a938c4",
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
        traceback: ["Ensure the FastAPI backend service is running on port 8000"],
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

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#292524] font-['Inter',sans-serif] relative overflow-hidden antialiased selection:bg-[#292524] selection:text-white">
      {/* ========================================================================= */}
      {/* ATMOSPHERIC GRADIENT ORBS (Design.md Signature: mint, peach, lavender, sky) */}
      {/* ========================================================================= */}
      <div className="absolute top-[-100px] left-[15%] w-[520px] h-[520px] rounded-full bg-[#a7e5d3]/40 blur-[130px] pointer-events-none -z-10" />
      <div className="absolute top-[280px] right-[5%] w-[480px] h-[480px] rounded-full bg-[#f4c5a8]/35 blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-[100px] left-[10%] w-[560px] h-[560px] rounded-full bg-[#c8b8e0]/30 blur-[150px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-150px] right-[25%] w-[440px] h-[440px] rounded-full bg-[#a8c8e8]/30 blur-[130px] pointer-events-none -z-10" />

      {/* ========================================================================= */}
      {/* TOP NAVIGATION (Design.md: top-nav 64px, canvas floor, near-black ink) */}
      {/* ========================================================================= */}
      <nav className="sticky top-0 z-40 bg-[#f5f5f5]/85 backdrop-blur-md border-b border-[#e7e5e4] h-16 px-6 sm:px-12 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="text-lg font-['EB_Garamond',serif] font-normal tracking-[-0.02em] text-[#0c0a09] flex items-center gap-2 group"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#292524] inline-block transition-transform group-hover:scale-125" />
            <span className="font-['EB_Garamond',serif] text-xl text-[#0c0a09]">SentinelOps Store</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-[#777169]">
            <span className="text-[#0c0a09] font-medium">Checkout</span>
            <Link href="/postmortem" className="hover:text-[#0c0a09] transition-colors">
              Incident Audit
            </Link>
            <Link href="/sentinelops" className="hover:text-[#0c0a09] transition-colors">
              Agent HUD
            </Link>
          </div>
        </div>

        {/* Currency & Security Badge */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f0efed] text-[12px] font-semibold tracking-[0.96px] uppercase text-[#777169]">
            <span className="text-[#16a34a]">🔒</span> 256-bit Encrypted
          </div>

          <div className="flex items-center bg-[#ffffff] border border-[#e7e5e4] rounded-full p-0.5 shadow-sm">
            {["USD", "EUR", "GBP"].map((curr) => (
              <button
                key={curr}
                type="button"
                onClick={() => setCurrency(curr)}
                className={`px-3 py-1 rounded-full text-[13px] font-medium transition-all ${
                  currency === curr
                    ? "bg-[#292524] text-white shadow-sm"
                    : "text-[#777169] hover:text-[#0c0a09]"
                }`}
              >
                {curr} ({CURRENCY_CONFIG[curr].symbol})
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* MAIN CHECKOUT CONTAINER */}
      {/* ========================================================================= */}
      <main className="max-w-[1200px] mx-auto px-6 sm:px-10 py-12 sm:py-16">
        {/* Editorial Hero Band */}
        <header className="mb-12 text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f0efed] text-[12px] font-semibold tracking-[0.96px] uppercase text-[#0c0a09]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#292524]" />
            Secure Order Fulfillment
          </div>
          <h1 className="text-4xl sm:text-5xl font-['EB_Garamond',serif] font-light tracking-[-0.03em] text-[#0c0a09] leading-[1.1]">
            Review & Complete Your Order
          </h1>
          <p className="text-base text-[#777169] font-normal leading-relaxed">
            Fulfill your automated SRE compute subscription and delivery options with precision.
          </p>
        </header>

        {/* Order Confirmed View */}
        {orderResult ? (
          <div className="max-w-2xl mx-auto bg-[#ffffff] rounded-2xl border border-[#e7e5e4] p-8 sm:p-12 shadow-[0_4px_16px_rgba(0,0,0,0.04)] text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-[#a7e5d3]/50 text-[#16a34a] text-2xl flex items-center justify-center mx-auto">
              ✓
            </div>
            <div className="space-y-2">
              <span className="text-[12px] font-semibold uppercase tracking-[0.96px] text-[#16a34a]">
                Payment Authorized & Verified
              </span>
              <h2 className="text-3xl font-['EB_Garamond',serif] font-light text-[#0c0a09]">
                Thank you for your order
              </h2>
              <p className="text-sm text-[#777169]">
                Your fulfillment confirmation and invoice receipt have been logged.
              </p>
            </div>

            <div className="bg-[#fafafa] rounded-xl border border-[#e7e5e4] p-6 text-left space-y-3 text-sm">
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
                <span className="text-[#0c0a09] capitalize">{isGuest ? "Guest Checkout" : "Member Account"}</span>
              </div>
              <div className="flex justify-between text-[#777169]">
                <span>Fulfillment Status:</span>
                <span className="inline-flex items-center gap-1 text-[#16a34a] font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#16a34a]" /> Active & In Progress
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setOrderResult(null);
                  setCartItems(INITIAL_CART);
                }}
                className="px-6 py-3 rounded-full bg-[#292524] text-white text-[15px] font-medium hover:bg-[#0c0a09] transition-all shadow-sm"
              >
                Place Another Order
              </button>
              <Link
                href="/postmortem"
                className="px-6 py-3 rounded-full bg-transparent border border-[#d6d3d1] text-[#0c0a09] text-[15px] font-medium hover:bg-[#f0efed] transition-all text-center"
              >
                View Incident Ledger
              </Link>
            </div>
          </div>
        ) : (
          /* Two-Column Checkout Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* ========================================================================= */}
            {/* LEFT COLUMN: Customer, Shipping, Delivery, Sustainability, & Payment */}
            {/* ========================================================================= */}
            <div className="lg:col-span-7 space-y-8">
              {/* Card 1: Customer Account & Contact */}
              <section className="bg-[#ffffff] rounded-2xl border border-[#e7e5e4] p-6 sm:p-8 shadow-[0_4px_16px_rgba(0,0,0,0.04)] space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e7e5e4] pb-4">
                  <div>
                    <span className="text-[12px] font-semibold uppercase tracking-[0.96px] text-[#777169]">
                      01 / Account Mode
                    </span>
                    <h2 className="text-xl font-['EB_Garamond',serif] font-light text-[#0c0a09]">
                      Customer Information
                    </h2>
                  </div>

                  {/* Guest vs Member Pill Toggle */}
                  <div className="inline-flex rounded-full bg-[#f0efed] p-1 border border-[#e7e5e4]">
                    <button
                      type="button"
                      onClick={() => setIsGuest(true)}
                      className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                        isGuest ? "bg-[#292524] text-white shadow-sm" : "text-[#777169] hover:text-[#0c0a09]"
                      }`}
                    >
                      Guest Checkout
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsGuest(false)}
                      className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                        !isGuest ? "bg-[#292524] text-white shadow-sm" : "text-[#777169] hover:text-[#0c0a09]"
                      }`}
                    >
                      Member Sign-In
                    </button>
                  </div>
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
                      className="w-full px-4 py-2.5 rounded-lg bg-[#ffffff] border border-[#d6d3d1] text-sm text-[#0c0a09] placeholder-[#a8a29e] focus:outline-none focus:border-[#0c0a09] focus:ring-1 focus:ring-[#0c0a09] transition-all"
                      placeholder="Jane Doe"
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
                      className="w-full px-4 py-2.5 rounded-lg bg-[#ffffff] border border-[#d6d3d1] text-sm text-[#0c0a09] placeholder-[#a8a29e] focus:outline-none focus:border-[#0c0a09] focus:ring-1 focus:ring-[#0c0a09] transition-all"
                      placeholder="jane@company.com"
                    />
                  </div>
                </div>
              </section>

              {/* Card 2: Shipping Destination & Tax Region */}
              <section className="bg-[#ffffff] rounded-2xl border border-[#e7e5e4] p-6 sm:p-8 shadow-[0_4px_16px_rgba(0,0,0,0.04)] space-y-6">
                <div className="border-b border-[#e7e5e4] pb-4">
                  <span className="text-[12px] font-semibold uppercase tracking-[0.96px] text-[#777169]">
                    02 / Destination & Tax Region
                  </span>
                  <h2 className="text-xl font-['EB_Garamond',serif] font-light text-[#0c0a09]">
                    Shipping Address
                  </h2>
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
                      className="w-full px-4 py-2.5 rounded-lg bg-[#ffffff] border border-[#d6d3d1] text-sm text-[#0c0a09] placeholder-[#a8a29e] focus:outline-none focus:border-[#0c0a09] focus:ring-1 focus:ring-[#0c0a09] transition-all"
                      placeholder="100 Innovation Boulevard"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-medium text-[#4e4e4e]">
                        City
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg bg-[#ffffff] border border-[#d6d3d1] text-sm text-[#0c0a09] focus:outline-none focus:border-[#0c0a09] transition-all"
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
                        className="w-full px-4 py-2.5 rounded-lg bg-[#ffffff] border border-[#d6d3d1] text-sm text-[#0c0a09] focus:outline-none focus:border-[#0c0a09] transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-medium text-[#4e4e4e]">
                        Tax Jurisdiction
                      </label>
                      <select
                        value={taxRegion}
                        onChange={(e) => setTaxRegion(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg bg-[#ffffff] border border-[#d6d3d1] text-sm text-[#0c0a09] focus:outline-none focus:border-[#0c0a09] transition-all"
                      >
                        <option value="US_CA">United States (California — 8.25%)</option>
                        <option value="US_NY">United States (New York — 8.875%)</option>
                        <option value="EU_DE">Germany (MwSt. — 19%)</option>
                        <option value="EU_FR">France (TVA — 20%)</option>
                        <option value="STANDARD">Standard International (5%)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </section>

              {/* Card 3: Fulfillment & Shipping Tier */}
              <section className="bg-[#ffffff] rounded-2xl border border-[#e7e5e4] p-6 sm:p-8 shadow-[0_4px_16px_rgba(0,0,0,0.04)] space-y-6">
                <div className="border-b border-[#e7e5e4] pb-4 flex items-center justify-between">
                  <div>
                    <span className="text-[12px] font-semibold uppercase tracking-[0.96px] text-[#777169]">
                      03 / Logistics
                    </span>
                    <h2 className="text-xl font-['EB_Garamond',serif] font-light text-[#0c0a09]">
                      Fulfillment & Shipping Speed
                    </h2>
                  </div>
                  {discountedSubtotalUSD >= 150.0 && (
                    <span className="px-2.5 py-1 rounded-full bg-[#a7e5d3]/40 text-[#16a34a] text-[11px] font-semibold tracking-wider uppercase">
                      Free Shipping Qualified
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {SHIPPING_TIERS.map((tier) => {
                    const isFree = tier.id === "STANDARD" && discountedSubtotalUSD >= 150.0;
                    const priceFormatted = isFree
                      ? "FREE"
                      : `${currencyConfig.symbol}${(tier.price * currencyConfig.rate).toFixed(2)}`;
                    const isSelected = shippingTier === tier.id;

                    return (
                      <label
                        key={tier.id}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? "border-[#292524] bg-[#fafafa] shadow-sm"
                            : "border-[#e7e5e4] bg-[#ffffff] hover:border-[#d6d3d1]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="shipping_tier"
                            value={tier.id}
                            checked={isSelected}
                            onChange={() => setShippingTier(tier.id)}
                            className="accent-[#292524] w-4 h-4"
                          />
                          <div>
                            <p className="text-sm font-medium text-[#0c0a09]">{tier.name}</p>
                            <p className="text-xs text-[#777169]">{tier.estimate}</p>
                          </div>
                        </div>
                        <span className={`text-sm font-semibold ${isFree ? "text-[#16a34a]" : "text-[#0c0a09]"}`}>
                          {priceFormatted}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </section>

              {/* Card 4: Packaging & Sustainable Carbon Offsets */}
              <section className="bg-[#ffffff] rounded-2xl border border-[#e7e5e4] p-6 sm:p-8 shadow-[0_4px_16px_rgba(0,0,0,0.04)] space-y-6">
                <div className="border-b border-[#e7e5e4] pb-4">
                  <span className="text-[12px] font-semibold uppercase tracking-[0.96px] text-[#777169]">
                    04 / Sustainability & Presentation
                  </span>
                  <h2 className="text-xl font-['EB_Garamond',serif] font-light text-[#0c0a09]">
                    Packaging & Carbon Offsets
                  </h2>
                </div>

                <div className="space-y-4">
                  {/* Packaging selector */}
                  <div className="space-y-2">
                    <label className="block text-[13px] font-medium text-[#4e4e4e]">
                      Order Packaging Preference
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {PACKAGING_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setPackagingOption(opt.id)}
                          className={`p-3 rounded-xl text-left border transition-all text-xs ${
                            packagingOption === opt.id
                              ? "border-[#292524] bg-[#fafafa] text-[#0c0a09]"
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
                        className="accent-[#16a34a] w-4 h-4 mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-medium text-[#0c0a09] flex items-center gap-1.5">
                          <span>🌱</span> Carbon-Neutral Delivery Contribution
                        </p>
                        <p className="text-xs text-[#777169]">
                          Offset 100% of compute and transit emissions through certified environmental projects.
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
                            className={`px-3 py-2 rounded-lg text-left text-xs border transition-all ${
                              carbonInitiative === init.id
                                ? "border-[#16a34a] bg-[#a7e5d3]/20 text-[#0c0a09]"
                                : "border-[#e7e5e4] bg-[#ffffff] text-[#777169]"
                            }`}
                          >
                            <div className="font-medium text-[#0c0a09] truncate">{init.name}</div>
                            <div className="text-[11px] text-[#16a34a] font-semibold">
                              +{currencyConfig.symbol}{(init.rate * currencyConfig.rate).toFixed(2)}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Card 5: Payment Method Details */}
              <section className="bg-[#ffffff] rounded-2xl border border-[#e7e5e4] p-6 sm:p-8 shadow-[0_4px_16px_rgba(0,0,0,0.04)] space-y-6">
                <div className="border-b border-[#e7e5e4] pb-4">
                  <span className="text-[12px] font-semibold uppercase tracking-[0.96px] text-[#777169]">
                    05 / Payment Method
                  </span>
                  <h2 className="text-xl font-['EB_Garamond',serif] font-light text-[#0c0a09]">
                    Secure Payment Processing
                  </h2>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("card")}
                      className={`py-3 px-4 rounded-xl border text-center text-sm font-medium transition-all ${
                        paymentMethod === "card"
                          ? "border-[#292524] bg-[#fafafa] text-[#0c0a09] shadow-sm"
                          : "border-[#e7e5e4] text-[#777169] hover:border-[#d6d3d1]"
                      }`}
                    >
                      Credit / Debit Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("express")}
                      className={`py-3 px-4 rounded-xl border text-center text-sm font-medium transition-all ${
                        paymentMethod === "express"
                          ? "border-[#292524] bg-[#fafafa] text-[#0c0a09] shadow-sm"
                          : "border-[#e7e5e4] text-[#777169] hover:border-[#d6d3d1]"
                      }`}
                    >
                      Apple Pay / Google Pay
                    </button>
                  </div>

                  {paymentMethod === "card" ? (
                    <div className="space-y-3 pt-2">
                      <div className="space-y-1.5">
                        <label className="block text-[13px] font-medium text-[#4e4e4e]">
                          Card Number
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg bg-[#ffffff] border border-[#d6d3d1] text-sm text-[#0c0a09] focus:outline-none focus:border-[#0c0a09] transition-all font-mono"
                          />
                          <span className="absolute right-3 top-2.5 text-xs text-[#777169]">
                            VISA / MC
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-[13px] font-medium text-[#4e4e4e]">
                            Expiration
                          </label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg bg-[#ffffff] border border-[#d6d3d1] text-sm text-[#0c0a09] focus:outline-none focus:border-[#0c0a09] transition-all font-mono"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[13px] font-medium text-[#4e4e4e]">
                            Security CVC
                          </label>
                          <input
                            type="text"
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg bg-[#ffffff] border border-[#d6d3d1] text-sm text-[#0c0a09] focus:outline-none focus:border-[#0c0a09] transition-all font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 rounded-xl bg-[#fafafa] border border-[#e7e5e4] text-center space-y-2">
                      <p className="text-sm text-[#0c0a09] font-medium">
                        Express 1-Click Authorization Ready
                      </p>
                      <p className="text-xs text-[#777169]">
                        Clicking Complete Order will launch your biometric device wallet.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* ========================================================================= */}
            {/* RIGHT COLUMN: Order Summary, Promo Input, Cost Breakdown & Primary CTA */}
            {/* ========================================================================= */}
            <div className="lg:col-span-5 space-y-6 sticky top-24">
              <div className="bg-[#ffffff] rounded-2xl border border-[#e7e5e4] p-6 sm:p-8 shadow-[0_4px_16px_rgba(0,0,0,0.04)] space-y-6">
                <div className="flex items-center justify-between border-b border-[#e7e5e4] pb-4">
                  <div>
                    <span className="text-[12px] font-semibold uppercase tracking-[0.96px] text-[#777169]">
                      Summary
                    </span>
                    <h2 className="text-xl font-['EB_Garamond',serif] font-light text-[#0c0a09]">
                      Cart Items ({cartItems.reduce((acc, i) => acc + i.qty, 0)})
                    </h2>
                  </div>
                  <span className="text-xs text-[#777169] font-mono">
                    Currency: {currency}
                  </span>
                </div>

                {/* Items List */}
                <div className="divide-y divide-[#f0efed] max-h-72 overflow-y-auto pr-1">
                  {cartItems.map((item) => (
                    <div key={item.sku} className="py-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#f0efed] flex items-center justify-center text-lg flex-shrink-0">
                          {item.image}
                        </div>
                        <div>
                          <h3 className="text-[14px] font-medium text-[#0c0a09] leading-snug">
                            {item.name}
                          </h3>
                          <p className="text-[11px] text-[#777169]">{item.category}</p>
                          <p className="text-xs font-semibold text-[#292524] mt-0.5">
                            {currencyConfig.symbol}
                            {(item.price * currencyConfig.rate).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Quantity Pills */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div className="flex items-center rounded-full bg-[#f0efed] border border-[#e7e5e4] p-0.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.sku, -1)}
                            className="w-6 h-6 rounded-full bg-white hover:bg-[#e7e5e4] text-[#0c0a09] flex items-center justify-center text-xs font-semibold shadow-xs"
                          >
                            -
                          </button>
                          <span className="w-6 text-center text-xs font-medium text-[#0c0a09]">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.sku, 1)}
                            className="w-6 h-6 rounded-full bg-white hover:bg-[#e7e5e4] text-[#0c0a09] flex items-center justify-center text-xs font-semibold shadow-xs"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.sku)}
                          className="text-[#a8a29e] hover:text-[#dc2626] text-xs p-1"
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Promo Code Input & Quick Apply Chips */}
                <div className="space-y-2.5 pt-2 border-t border-[#e7e5e4]">
                  <label className="block text-[13px] font-medium text-[#4e4e4e]">
                    Promotional Coupon
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
                    <div className="flex items-center gap-1.5 text-xs text-[#16a34a] font-medium">
                      <span>✓</span> Applied {appliedPromo.label} (-{(appliedPromo.rate * 100)}%)
                    </div>
                  )}

                  {promoError && (
                    <p className="text-xs text-[#dc2626] font-medium">{promoError}</p>
                  )}

                  {/* Fast Coupon Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-[#777169]">Try code:</span>
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

                {/* Cost Breakdown Ledger */}
                <div className="bg-[#fafafa] rounded-xl border border-[#e7e5e4] p-4 space-y-2.5 text-sm">
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
                    <span>Shipping & Handling</span>
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
                      <span>Carbon Neutral Offset</span>
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

                  <div className="border-t border-[#e7e5e4] pt-3 flex items-baseline justify-between">
                    <div>
                      <span className="text-base font-semibold text-[#0c0a09]">Order Total</span>
                      <p className="text-[11px] text-[#777169]">Includes all duties & taxes</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-['EB_Garamond',serif] font-light text-[#0c0a09] tracking-tight">
                        {currencyConfig.symbol}{convertedTotal}
                      </span>
                      <span className="text-xs font-mono text-[#777169] ml-1">{currency}</span>
                    </div>
                  </div>
                </div>

                {/* Primary CTA (Design.md: button-primary near-black ink pill) */}
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={loading || cartItems.length === 0}
                  className="w-full h-12 rounded-full bg-[#292524] hover:bg-[#0c0a09] text-white text-[15px] font-medium transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 group cursor-pointer"
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
                      <span className="transition-transform group-hover:translate-x-0.5">→</span>
                    </>
                  )}
                </button>

                {/* Trust & Guarantee Badges */}
                <div className="pt-2 flex items-center justify-center gap-6 text-[12px] text-[#777169]">
                  <span className="flex items-center gap-1">🔒 SSL Secured</span>
                  <span className="flex items-center gap-1">🛡️ 30-Day Guarantee</span>
                  <span className="flex items-center gap-1">🌿 Eco-Certified</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* SENTINELOPS INCIDENT NOTIFICATION MODAL (Design.md Editorial Style) */}
      {/* ========================================================================= */}
      {showIncidentModal && errorState && (
        <div className="fixed inset-0 bg-[#0c0a09]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#ffffff] rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#e7e5e4] animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#e7e5e4] pb-4">
              <div className="flex items-center gap-2 text-[#dc2626] font-semibold text-xs uppercase tracking-[0.96px]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626] animate-pulse" />
                SentinelOps Anomaly Ingestion
              </div>
              <button
                onClick={() => setShowIncidentModal(false)}
                className="text-[#a8a29e] hover:text-[#0c0a09] transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Error Content */}
            <div className="space-y-3 text-sm">
              <h3 className="text-2xl font-['EB_Garamond',serif] font-light text-[#0c0a09]">
                500 Internal Server Error Detected
              </h3>
              <p className="text-[#777169] text-sm leading-relaxed">
                The checkout gateway encountered an unhandled runtime exception during total calculation.
              </p>

              <div className="p-4 rounded-xl bg-[#fafafa] border border-[#e7e5e4] space-y-1.5 font-mono text-xs">
                <div className="text-[#dc2626] font-semibold">
                  {errorState.errorType}: {errorState.message}
                </div>
                <div className="text-[11px] text-[#777169] truncate">
                  Endpoint: /checkout · Status: {errorState.status}
                </div>
              </div>

              <p className="text-xs text-[#777169]">
                SentinelOps can autonomously launch a parallel subagent swarm to inspect commit history, reproduce in Daytona sandbox, and open a verified GitHub Pull Request.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleReportIncident}
                disabled={reportingIncident}
                className="flex-1 py-3 px-6 rounded-full bg-[#292524] hover:bg-[#0c0a09] text-white text-[14px] font-medium transition-all shadow-sm text-center disabled:opacity-50"
              >
                {reportingIncident ? "Spawning Swarm..." : "Launch SentinelOps Swarm ↗"}
              </button>
              <button
                onClick={() => setShowIncidentModal(false)}
                className="py-3 px-5 rounded-full bg-transparent border border-[#d6d3d1] text-[#0c0a09] text-[14px] font-medium hover:bg-[#f0efed] transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FOOTER (Design.md: footer 64px 48px, canvas floor, editorial typography) */}
      {/* ========================================================================= */}
      <footer className="mt-20 border-t border-[#e7e5e4] bg-[#f5f5f5] py-12 px-6 sm:px-12 text-sm text-[#777169]">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="font-['EB_Garamond',serif] text-base text-[#0c0a09]">SentinelOps Store</span>
            <span>·</span>
            <span>Autonomous E-Commerce Resilience</span>
          </div>
          <div className="flex items-center gap-6 text-xs">
            <Link href="/" className="hover:text-[#0c0a09] transition-colors">
              Platform Home
            </Link>
            <Link href="/sentinelops" className="hover:text-[#0c0a09] transition-colors">
              Incident HUD
            </Link>
            <Link href="/postmortem" className="hover:text-[#0c0a09] transition-colors">
              Audit Logs
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
