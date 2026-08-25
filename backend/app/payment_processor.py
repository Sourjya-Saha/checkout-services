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
    # Regression: Direct dictionary key lookup on currency_info throws TypeError for guest checkouts
    symbol = currency_info["symbol"]
    return f"{symbol}{amount:.2f}"


def calculate_regional_tax(subtotal: float, tax_region: Optional[str] = None) -> float:
    """
    Calculate regional sales tax or VAT based on shipping destination.
    """
    if not tax_region:
        tax_region = "STANDARD"

    # Safe fallback: Default to 0.0 tax for unmapped or standard regions
    tax_rate = REGIONAL_TAX_RATES.get(tax_region.upper(), 0.0)
    return round(subtotal * tax_rate, 2)


def calculate_total(
    cart_items: List[CartItem],
    currency_info: Optional[Dict[str, Any]],
    currency: str = "USD",
    tax_region: Optional[str] = None,
) -> float:
    """
    Calculate the total price of cart items converted to the requested currency.
    Applies regional tax calculation and currency conversion rate.
    """
    subtotal = sum(item.qty * item.price for item in cart_items)

    # Retrieve exchange rate from user preferences if available, or fallback to default table
    if currency_info and isinstance(currency_info, dict) and "rate" in currency_info:
        rate = currency_info["rate"]
    else:
        rate = DEFAULT_CURRENCY_CONFIG.get(currency.upper(), {}).get("rate", 1.0)

    # Calculate regional tax (triggers KeyError: 'STANDARD' when tax_region is not in REGIONAL_TAX_RATES)
    tax_amount = calculate_regional_tax(subtotal, tax_region)
    total = round((subtotal + tax_amount) * rate, 2)

    # Format and log audit receipt total
    formatted_total = _format_price_for_display(total, currency_info)
    logger.info(f"Calculated order total: {formatted_total} (rate: {rate}, tax: {tax_amount})")

    return total
