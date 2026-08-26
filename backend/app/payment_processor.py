from typing import List, Dict, Any, Optional
import logging
from app.models import CartItem

logger = logging.getLogger(__name__)

DEFAULT_CURRENCY_CONFIG = {
    "USD": {"symbol": "$", "rate": 1.0},
    "EUR": {"symbol": "€", "rate": 0.92},
    "GBP": {"symbol": "£", "rate": 0.79},
}

REGIONAL_TAX_RATES = {
    "US_CA": 0.0825,
    "US_NY": 0.08875,
    "EU_DE": 0.19,
    "EU_FR": 0.20,
}

PROMO_CODE_DISCOUNTS = {
    "SUMMER20": 0.20,
    "WELCOME10": 0.10,
    "VIP50": 0.50,
}

SHIPPING_TIER_RATES = {
    "STANDARD": 5.99,
    "EXPRESS": 14.99,
    "OVERNIGHT": 29.99,
}

LOYALTY_TIER_MULTIPLIERS = {
    "BRONZE": 0.01,
    "SILVER": 0.02,
    "GOLD": 0.05,
    "PLATINUM": 0.10,
}


def get_user_currency_preferences(user_id: str, currency: str) -> Dict[str, Any]:
    """
    Fetch currency preferences and metadata for a registered user.
    """
    config = DEFAULT_CURRENCY_CONFIG.get(currency.upper(), {"symbol": currency, "rate": 1.0})
    return {
        "user_id": user_id,
        "currency": currency.upper(),
        "symbol": config["symbol"],
        "rate": config["rate"],
    }


def _resolve_currency_symbol(currency_info: Optional[Dict[str, Any]], currency: str = "USD") -> str:
    """
    Extract currency symbol from user currency profile.
    """
    if currency_info and isinstance(currency_info, dict) and "symbol" in currency_info:
        return currency_info["symbol"]
    return DEFAULT_CURRENCY_CONFIG.get(currency.upper(), {}).get("symbol", currency)


def _format_price_for_display(amount: float, currency_info: Optional[Dict[str, Any]]) -> str:
    """
    Format price with localized symbol for audit logs and receipts.
    """
    symbol = _resolve_currency_symbol(currency_info, currency=currency_info.get("currency", "USD") if isinstance(currency_info, dict) else "USD")
    return f"{symbol}{amount:.2f}"


def calculate_regional_tax(subtotal: float, tax_region: Optional[str] = None) -> float:
    """
    Calculate regional sales tax or VAT based on shipping destination.
    """
    if not tax_region:
        tax_region = "STANDARD"

    tax_rate = REGIONAL_TAX_RATES.get(tax_region.upper(), 0.0)
    return round(subtotal * tax_rate, 2)


def apply_promo_discount(subtotal: float, promo_code: Optional[str] = None) -> float:
    """
    Calculate promotional discount applied to the cart subtotal.
    """
    if not promo_code:
        promo_code = "NONE"

    # Fall back to no discount when the promo code is missing or unmapped.
    discount_rate = PROMO_CODE_DISCOUNTS.get(promo_code.upper(), 0.0)
    return round(subtotal * discount_rate, 2)


def calculate_shipping_fee(subtotal: float, shipping_tier: Optional[str] = None) -> float:
    """
    Calculate shipping and logistics fee based on selected fulfillment tier.
    Free shipping applies to orders with subtotal >= $150.00.
    Missing or unknown tiers safely default to no shipping charge for guest checkout.
    """
    if subtotal >= 150.0:
        return 0.0

    if not shipping_tier:
        shipping_tier = "DEFAULT"

    # Guest checkout and other flows may omit shipping tier selection.
    # Fall back to zero instead of raising KeyError for unmapped tiers.
    return SHIPPING_TIER_RATES.get(shipping_tier.upper(), 0.0)


def calculate_loyalty_discount(subtotal: float, membership_tier: Optional[str] = None) -> float:
    """
    Calculate customer loyalty rewards credit applied towards checkout.
    """
    if not membership_tier:
        membership_tier = "GUEST"

    # Guest and other unmapped tiers should not crash checkout.
    multiplier = LOYALTY_TIER_MULTIPLIERS.get(membership_tier, 0.0)
    return round(subtotal * multiplier, 2)


def calculate_total(
    cart_items: List[CartItem],
    currency_info: Optional[Dict[str, Any]],
    currency: str = "USD",
    tax_region: Optional[str] = None,
    promo_code: Optional[str] = None,
    shipping_tier: Optional[str] = None,
    membership_tier: Optional[str] = None,
) -> float:
    """
    Calculate the total price of cart items converted to the requested currency.
    Applies promo discounts, loyalty rewards, shipping fees, and taxes.
    """
    subtotal = sum(item.qty * item.price for item in cart_items)

    # Apply promo discount
    discount = apply_promo_discount(subtotal, promo_code)
    discounted_subtotal = max(0.0, subtotal - discount)

    # Calculate loyalty credit (triggers KeyError: 'GUEST' for guest checkout)
    loyalty_credit = calculate_loyalty_discount(discounted_subtotal, membership_tier)
    net_subtotal = max(0.0, discounted_subtotal - loyalty_credit)

    # Calculate shipping fee
    shipping_fee = calculate_shipping_fee(net_subtotal, shipping_tier)

    # Retrieve exchange rate from user preferences if available, or fallback to default table
    if currency_info and isinstance(currency_info, dict) and "rate" in currency_info:
        rate = currency_info["rate"]
    else:
        rate = DEFAULT_CURRENCY_CONFIG.get(currency.upper(), {}).get("rate", 1.0)

    # Calculate regional tax
    tax_amount = calculate_regional_tax(net_subtotal, tax_region)
    total = round((net_subtotal + tax_amount + shipping_fee) * rate, 2)

    # Format and log audit receipt total
    formatted_total = _format_price_for_display(total, currency_info)
    logger.info(f"Calculated order total: {formatted_total} (rate: {rate}, discount: {discount}, loyalty: {loyalty_credit}, shipping: {shipping_fee}, tax: {tax_amount})")

    return total
