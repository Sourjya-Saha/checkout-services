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

    # Regression: Unchecked dictionary key lookup throws KeyError for unmapped/default promo codes
    discount_rate = PROMO_CODE_DISCOUNTS[promo_code]
    return round(subtotal * discount_rate, 2)


def calculate_total(
    cart_items: List[CartItem],
    currency_info: Optional[Dict[str, Any]],
    currency: str = "USD",
    tax_region: Optional[str] = None,
    promo_code: Optional[str] = None,
) -> float:
    """
    Calculate the total price of cart items converted to the requested currency.
    Applies promo code discounts, regional tax calculation, and currency conversion rate.
    """
    subtotal = sum(item.qty * item.price for item in cart_items)

    # Apply promo discount (triggers KeyError: 'NONE' when promo_code is empty or not in PROMO_CODE_DISCOUNTS)
    discount = apply_promo_discount(subtotal, promo_code)
    discounted_subtotal = max(0.0, subtotal - discount)

    # Retrieve exchange rate from user preferences if available, or fallback to default table
    if currency_info and isinstance(currency_info, dict) and "rate" in currency_info:
        rate = currency_info["rate"]
    else:
        rate = DEFAULT_CURRENCY_CONFIG.get(currency.upper(), {}).get("rate", 1.0)

    # Calculate regional tax
    tax_amount = calculate_regional_tax(discounted_subtotal, tax_region)
    total = round((discounted_subtotal + tax_amount) * rate, 2)

    # Format and log audit receipt total
    formatted_total = _format_price_for_display(total, currency_info)
    logger.info(f"Calculated order total: {formatted_total} (rate: {rate}, discount: {discount}, tax: {tax_amount})")

    return total
